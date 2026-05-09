import { NextResponse } from "next/server";
import {
  ALL_TREND_GROUPS,
  GROUP_TO_SUB_INDUSTRIES,
  TREND_GROUP_LABELS,
} from "@build-up/shared";
import {
  getAnthropicApiKey,
  getCronSecret,
  getNaverApiCreds,
  getTavilyApiKey,
  getYoutubeApiKey,
} from "../../_lib/env";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { generateTrends } from "../../_lib/trend-generator";

/**
 * 매일 08:00 KST (23:00 UTC) Vercel cron 실행.
 *
 * 흐름:
 * 1. CRON_SECRET 검증 (Vercel cron은 `x-vercel-cron-signature` 헤더로 자동 검증되지만
 *    수동 호출 방어 위해 별도 secret도 확인)
 * 2. 20개 트렌드 그룹 순차 생성 (Tavily·Naver rate limit 보호 위해 순차)
 * 3. 각 그룹 결과를 해당 sub-industry들에게 fan-out하여 Supabase upsert
 * 4. ko/en 둘 다 생성
 *
 * 타임아웃: Vercel Hobby는 10초, Pro는 60초. 본 작업은 20그룹 × 2언어 × ~15초 ≈ 600초.
 * → Pro 플랜에서 maxDuration=300초 + 그룹 수만큼 분할 호출 전략이 최종안.
 * → 우선은 단일 호출 버전으로 제출 (Pro 기준). 필요 시 /api/cron/marketing-trends?group=X 분할.
 */

export const runtime = "nodejs";
export const maxDuration = 300; // 5분 (Vercel Pro 최대). Hobby면 10초로 강등됨.

function isAuthorized(request: Request): boolean {
  // Vercel cron은 Authorization: Bearer <CRON_SECRET>을 자동으로 보냄
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const secret = getCronSecret();
  if (!secret) return false;
  return token === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anthropicKey = getAnthropicApiKey();
  if (!anthropicKey) {
    return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL" },
      { status: 500 }
    );
  }

  const naverCreds = getNaverApiCreds();
  const tavilyKey = getTavilyApiKey();
  const youtubeKey = getYoutubeApiKey();

  // 요청이 부분 실행 모드인지 확인 — ?group=food-delivery
  const url = new URL(request.url);
  const groupFilter = url.searchParams.get("group");
  const languageFilter = url.searchParams.get("language") as "ko" | "en" | null;

  const targetGroups = groupFilter
    ? ALL_TREND_GROUPS.filter((g) => g === groupFilter)
    : ALL_TREND_GROUPS;

  const targetLanguages: Array<"ko" | "en"> = languageFilter
    ? [languageFilter]
    : ["ko", "en"];

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }); // YYYY-MM-DD (KST)

  const report = {
    date: today,
    groups: 0,
    subIndustryRows: 0,
    failed: [] as Array<{ group: string; language: string; error: string }>,
    durations: [] as Array<{ group: string; language: string; ms: number }>,
  };

  for (const groupKey of targetGroups) {
    const groupMeta = TREND_GROUP_LABELS[groupKey];
    const memberSubIds = GROUP_TO_SUB_INDUSTRIES[groupKey];
    if (!memberSubIds || memberSubIds.length === 0) continue;

    for (const lang of targetLanguages) {
      const t0 = Date.now();
      try {
        const result = await generateTrends({
          anthropicApiKey: anthropicKey,
          naverCreds,
          tavilyKey,
          youtubeKey,
          bizLabel: lang === "ko" ? groupMeta.ko : groupMeta.en,
          categoryId: groupMeta.categoryId,
          language: lang,
        });

        if (result.trends.length === 0) {
          report.failed.push({ group: groupKey, language: lang, error: "empty-trends" });
          continue;
        }

        // Fan-out upsert — 이 그룹의 모든 sub-industry row에 동일 데이터 저장
        const rows = memberSubIds.map((subId) => ({
          date: today,
          sub_industry_id: subId,
          language: lang,
          group_key: groupKey,
          category_id: groupMeta.categoryId,
          trends: result.trends,
          sources: result.sources,
          meta: result.meta,
        }));

        const { error } = await supabase
          .from("marketing_trend_cache")
          .upsert(rows, { onConflict: "date,sub_industry_id,language" });

        if (error) {
          report.failed.push({ group: groupKey, language: lang, error: error.message });
        } else {
          report.groups += 1;
          report.subIndustryRows += rows.length;
        }
      } catch (err) {
        report.failed.push({
          group: groupKey,
          language: lang,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        report.durations.push({ group: groupKey, language: lang, ms: Date.now() - t0 });
      }
    }
  }

  return NextResponse.json({
    ok: report.failed.length === 0,
    ...report,
  });
}

/** 수동 트리거를 위한 POST — 동일 동작. */
export async function POST(request: Request) {
  return GET(request);
}
