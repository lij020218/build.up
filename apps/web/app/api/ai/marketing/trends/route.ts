import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  resolveTrendGroup,
  TREND_GROUP_LABELS,
  SUB_INDUSTRY_TO_GROUP,
  GROUP_TO_SUB_INDUSTRIES,
} from "@foundone/shared";
import {
  getAnthropicApiKey,
  getNaverApiCreds,
  getTavilyApiKey,
  getYoutubeApiKey,
} from "../../../_lib/env";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { generateTrends } from "../../../_lib/trend-generator";
import { requireApiUserAllowAnon } from "../../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

/**
 * 마케팅 트렌드 API — 캐시 우선, 필요시 on-demand 생성.
 *
 * 1. `subIndustryId` + 오늘자 language Supabase 캐시 조회 → 있으면 즉시 반환
 * 2. 없으면 그룹의 다른 sub-industry row를 찾아서 공유 (같은 그룹은 같은 결과)
 * 3. 모두 없으면 on-demand 생성 (Tavily + Naver + Claude web_search)
 *
 * 반환: { trends, sources, meta, cached, generatedAt }
 */

type RequestBody = {
  /** 세부업종 ID (starterIndustryOptions.id). 예: "chicken-burger" */
  subIndustryId?: string;
  /** 하위호환: 11 대분류 (categoryId). sub 없으면 이걸로 그룹 추정 */
  businessType?: string;
  language?: "ko" | "en";
};

// Supabase 읽기 전용 클라이언트 (공개 읽기 RLS 통과)
function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** 업종 라벨 해석 — 프롬프트 주입용 한/영 라벨. */
function resolveBizLabel(subIndustryId: string | undefined, categoryId: string, ko: boolean): string {
  if (subIndustryId) {
    const groupKey = resolveTrendGroup(subIndustryId);
    if (groupKey) {
      const meta = TREND_GROUP_LABELS[groupKey];
      return ko ? meta.ko : meta.en;
    }
  }
  // categoryId fallback
  const CATEGORY_LABELS: Record<string, { ko: string; en: string }> = {
    food: { ko: "외식업", en: "Restaurant" },
    "cafe-dessert": { ko: "카페·디저트", en: "Cafe" },
    retail: { ko: "소매", en: "Retail" },
    beauty: { ko: "뷰티", en: "Beauty" },
    pet: { ko: "펫", en: "Pet" },
    fitness: { ko: "피트니스", en: "Fitness" },
    education: { ko: "교육", en: "Education" },
    space: { ko: "공유공간", en: "Space" },
    "online-digital": { ko: "온라인", en: "Online" },
    "startup-tech": { ko: "스타트업", en: "Startup" },
    "living-service": { ko: "생활서비스", en: "Service" },
  };
  return CATEGORY_LABELS[categoryId]?.[ko ? "ko" : "en"] ?? categoryId;
}

export const runtime = "nodejs";
export const maxDuration = 90; // Vercel function timeout

export async function POST(request: Request) {
  // ⚠️ 2026-05-25 audit fix: 이전 무인증 → DoS·OpenAI/Anthropic 지갑 고갈 위험.
  //   세션 사용자 (anon 포함) 만 호출 가능 + 분당 10회 rate limit.
  //   캐시 hit 경로는 LLM 비용 없으므로 anon 허용. 미스 시 generateTrends 가 LLM 사용.
  const auth = await requireApiUserAllowAnon(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const rl = await checkSimpleRateLimit({
    key: `ai-marketing-trends:${auth.userId}`,
    limit: 10,
    windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요 (분당 10회 제한).",
  });
  if (!rl.ok) {
    return NextResponse.json({ error: rl.error }, { status: rl.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "marketing-trends",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subIndustryId = body.subIndustryId;
  const categoryId = body.businessType ?? "food";
  const lang: "ko" | "en" = body.language === "en" ? "en" : "ko";
  const today = todayKst();

  // ═══ 1. Supabase 캐시 조회 ═══
  const readClient = getReadClient();
  if (readClient && subIndustryId) {
    // 1-a. 정확히 내 sub-industry 캐시
    const { data: exact } = await readClient
      .from("marketing_trend_cache")
      .select("trends, sources, meta, group_key, updated_at")
      .eq("date", today)
      .eq("sub_industry_id", subIndustryId)
      .eq("language", lang)
      .maybeSingle();

    if (exact && Array.isArray(exact.trends) && exact.trends.length > 0) {
      return NextResponse.json({
        trends: exact.trends,
        sources: exact.sources ?? [],
        meta: exact.meta ?? {},
        cached: true,
        generatedAt: exact.updated_at,
        groupKey: exact.group_key,
      });
    }

    // 1-b. 같은 그룹의 다른 sub-industry 캐시 (fan-out 누락 대비)
    const groupKey = SUB_INDUSTRY_TO_GROUP[subIndustryId];
    if (groupKey) {
      const { data: sibling } = await readClient
        .from("marketing_trend_cache")
        .select("trends, sources, meta, updated_at")
        .eq("date", today)
        .eq("group_key", groupKey)
        .eq("language", lang)
        .limit(1)
        .maybeSingle();

      if (sibling && Array.isArray(sibling.trends) && sibling.trends.length > 0) {
        return NextResponse.json({
          trends: sibling.trends,
          sources: sibling.sources ?? [],
          meta: sibling.meta ?? {},
          cached: true,
          generatedAt: sibling.updated_at,
          groupKey,
        });
      }
    }
  }

  // ═══ 2. On-demand 생성 (캐시 미스) ═══
  try {
    const bizLabel = resolveBizLabel(subIndustryId, categoryId, lang === "ko");
    const resolvedCategoryId = subIndustryId
      ? (TREND_GROUP_LABELS[resolveTrendGroup(subIndustryId) ?? "food-delivery"]?.categoryId ?? categoryId)
      : categoryId;

    const result = await generateTrends({
      anthropicApiKey: apiKey,
      naverCreds: getNaverApiCreds(),
      tavilyKey: getTavilyApiKey(),
      youtubeKey: getYoutubeApiKey(),
      bizLabel,
      categoryId: resolvedCategoryId,
      language: lang,
    });

    // Opportunistic write-back: on-demand 생성 결과를 Supabase 캐시에도 저장 → 다음 사용자는 캐시 히트
    // (service_role 키가 있을 때만 작동, 없으면 조용히 skip)
    if (result.trends.length > 0) {
      const groupKey = subIndustryId ? resolveTrendGroup(subIndustryId) : null;
      const admin = getSupabaseAdmin();
      if (admin && groupKey) {
        const memberSubIds = GROUP_TO_SUB_INDUSTRIES[groupKey] ?? [subIndustryId!];
        const rows = memberSubIds.map((subId) => ({
          date: today,
          sub_industry_id: subId,
          language: lang,
          group_key: groupKey,
          category_id: resolvedCategoryId,
          trends: result.trends,
          sources: result.sources,
          meta: result.meta,
        }));
        // fire-and-forget — 응답 지연시키지 않음
        admin
          .from("marketing_trend_cache")
          .upsert(rows, { onConflict: "date,sub_industry_id,language" })
          .then(({ error }) => {
            if (error) console.warn("[trends] Supabase cache write failed:", error.message);
          });
      }
    }

    return NextResponse.json({
      trends: result.trends,
      sources: result.sources,
      meta: result.meta,
      cached: false,
      generatedAt: new Date().toISOString(),
      groupKey: subIndustryId ? resolveTrendGroup(subIndustryId) : null,
    });
  } catch (err) {
    console.error("[Marketing trends error]", err);
    return NextResponse.json(
      { trends: [], sources: [], error: "Failed to generate trends" },
      { status: 200 }
    );
  }
}
