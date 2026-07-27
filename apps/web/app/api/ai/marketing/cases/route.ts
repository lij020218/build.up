import { NextResponse } from "next/server";
import { resolveTrendGroup, TREND_GROUP_LABELS } from "@foundone/shared";
import { getOpenAIApiKey, getTavilyApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";
import { generateMarketingPlays, type MarketingPlay } from "../../../_lib/marketing-cases-core";
import type { ResearchSource } from "../../../_lib/marketing-research";

/**
 * 마케팅 성공사례 → 내 사업 적용 ("마케팅 작업하기" 엔진).
 *
 *  2단계 파이프라인 (사례를 *확실히* 찾기 위한 신뢰성 설계):
 *    1) researchMarketingCases — OpenAI web_search(+Tavily 폴백)로 업종 최신 한국 사례·트렌드를 자유 텍스트로 수집
 *    2) OpenAI gpt-5.6-terra(json_object, 2026-07-27 전환) — 수집 텍스트 + 가게 컨텍스트 → plays[] 구조화
 *
 *  2026-07-25: 파이프라인 본체는 _lib/marketing-cases-core.ts 로 추출 —
 *    스모크 하네스(scripts/smoke-marketing-cases.mts)가 라우트와 동일 코드로 품질 평가.
 *    이 라우트는 인증·캐시·레이트리밋·피드백 루프 조회만 담당.
 *
 *  캐시: marketing_cases_cache (user_id, week_key, context_key) — coach 와 동일 정책. 웹/iOS 동일 결과.
 *  인증: Supabase Bearer.
 */

export const runtime = "nodejs";
export const maxDuration = 90; // 2026-07-27 gpt-5.6-terra 전환 — 리서치+추론 합산 실측 ~40s, 여유 2x

// 하위호환 re-export — 기존 임포트 경로 유지.
export type { MarketingPlay, PlayDeliverable, PlayTool } from "../../../_lib/marketing-cases-core";

/**
 * ISO 주차 키 (YYYY-Www) — **KST 기준**.
 *
 * ⚠️ 2026-06-10 fix: 기존엔 UTC 캘린더로 주차를 계산해, 클라이언트(MarketingSurface,
 *    KST 기준)와 어긋남. KST 월요일 00~09시(=UTC 일요일 15~24시)에는 서버가 전주 키를
 *    돌려줘 주간 갱신이 사실상 월 오전 9시 이후로 밀렸음.
 *    MarketingSurface.getIsoWeekKey 와 동일하게 KST 캘린더 일자에서 ISO 주차를 계산.
 */
function getIsoWeekKey(date: Date = new Date()): string {
  // 입력 시각을 KST 캘린더 Y/M/D 로 환산 (클라이언트와 동일한 toLocaleString 방식)
  const kst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const target = new Date(Date.UTC(kst.getFullYear(), kst.getMonth(), kst.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const jan4 = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target.getTime() - jan4.getTime()) / 86_400_000 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

type RequestBody = {
  storeName?: string;
  /** 동네 라벨 (예: "분당구 정자동") — 웹은 addressRoad 파생, iOS 는 선택 */
  region?: string;
  industryCategoryId?: string;
  subIndustryId?: string;
  subIndustryLabel?: string;
  monthlyRevenueWon?: number;
  monthlySpendWon?: number;
  blendedRoas?: number;
  activeChannels?: string[];
  currentStageLabel?: string;
  launchDate?: string | null;
  hasUserSales?: boolean;
  /** 최근 매출 추세(%, 최근 vs 직전) — 피드백 루프: "지난주 실행 후 숫자 변화" 반영 */
  salesTrendPct?: number;
  language?: "ko" | "en";
  force?: boolean;
};

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const userId = auth.userId;

  const apiKey = getOpenAIApiKey();
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lang: "ko" | "en" = body.language === "en" ? "en" : "ko";
  const ko = lang === "ko";

  // ── 캐시 키 (coach 와 동일 정책) ──
  const weekKey = getIsoWeekKey();
  const subIdentifier = body.subIndustryId ?? body.industryCategoryId ?? "general";
  // "v2" = 2026-07-24 미션·실행물 스키마 — 옛 주간 캐시(설명형 plays)를 무효화해 즉시 재생성.
  const contextKey = [body.storeName ?? "내가게", subIdentifier, lang, "v2"].join("|");

  const supa = getSupabaseAdmin();
  if (!body.force && supa) {
    const { data: cached } = await supa
      .from("marketing_cases_cache")
      .select("plays, sources, generated_at")
      .eq("user_id", userId)
      .eq("week_key", weekKey)
      .eq("context_key", contextKey)
      .maybeSingle();
    if (cached && Array.isArray(cached.plays) && (cached.plays as MarketingPlay[]).length > 0) {
      return NextResponse.json({
        plays: cached.plays as MarketingPlay[],
        sources: (cached.sources as ResearchSource[]) ?? [],
        generatedAt: cached.generated_at,
        cached: true,
        weekKey,
      });
    }
  }

  // ── 레이트리밋 (web_search 비용 보호) ──
  const burst = await checkSimpleRateLimit({ key: `ai-marketing-cases:${userId}`, limit: 6, windowMs: 60 * 60 * 1000 });
  if (!burst.ok) return NextResponse.json({ error: burst.error }, { status: burst.status });
  const daily = await checkDailyRateLimit({
    userId,
    feature: "marketing-cases",
    limit: 20,
    message: ko ? "오늘 사례 추천 사용량을 초과했습니다. 내일 다시 시도해 주세요." : "Daily limit reached. Try again tomorrow.",
  });
  if (!daily.ok) return NextResponse.json({ error: daily.error }, { status: daily.status });

  // ── 업종 라벨 해석 (coach 와 동일) ──
  const subGroup = resolveTrendGroup(body.subIndustryId ?? null);
  const groupLabel = subGroup ? (ko ? TREND_GROUP_LABELS[subGroup].ko : TREND_GROUP_LABELS[subGroup].en) : null;
  const label = body.subIndustryLabel?.trim() || groupLabel || (body.industryCategoryId ?? (ko ? "소상공인" : "small business"));

  try {
    // ── 피드백 루프: 지난주 사장님이 "했어요" 체크한 플레이 + 매출 추세 ──
    let feedbackBlock = "";
    if (ko) {
      const lastWeekKey = getIsoWeekKey(new Date(Date.now() - 7 * 86_400_000));
      let doneTitles: string[] = [];
      if (supa) {
        const { data: prog } = await supa
          .from("marketing_play_progress")
          .select("play_title")
          .eq("user_id", userId)
          .eq("week_key", lastWeekKey);
        doneTitles = (prog ?? []).map((r) => (r as { play_title: string }).play_title).filter(Boolean).slice(0, 6);
      }
      const trend = typeof body.salesTrendPct === "number" && Number.isFinite(body.salesTrendPct) ? body.salesTrendPct : null;
      if (doneTitles.length > 0 || trend !== null) {
        feedbackBlock = `\n[지난주 실행 결과]\n`
          + (doneTitles.length > 0 ? `- 지난주 사장님이 실행한 플레이: ${doneTitles.join(" / ")}\n` : "")
          + (trend !== null ? `- 그 사이 매출 추세: ${trend > 0 ? "+" : ""}${trend}%\n` : "")
          + `→ 위에서 한 것은 **중복 추천하지 말고**, 그 다음 단계/심화를 우선하세요. 매출 추세가 좋으면 같은 방향을 강화, 나쁘면 채널·전술을 바꾸세요.\n`;
      }
    }

    // ── 리서치→합성→정제 (코어 공유 — 스모크 하네스와 동일 코드) ──
    const result = await generateMarketingPlays({
      openaiKey: apiKey,
      tavilyKey: getTavilyApiKey(),
      label,
      categoryId: body.industryCategoryId,
      language: lang,
      storeName: body.storeName,
      region: typeof body.region === "string" && body.region.trim() ? body.region.trim().slice(0, 40) : undefined,
      monthlyRevenueWon: body.monthlyRevenueWon,
      blendedRoas: body.blendedRoas,
      activeChannels: body.activeChannels,
      currentStageLabel: body.currentStageLabel,
      launchDate: body.launchDate,
      hasUserSales: body.hasUserSales,
      feedbackBlock,
    });

    const generatedAt = new Date().toISOString();

    if (supa && result.plays.length > 0) {
      const { error: cacheErr } = await supa
        .from("marketing_cases_cache")
        .upsert(
          { user_id: userId, week_key: weekKey, context_key: contextKey, plays: result.plays, sources: result.sources, generated_at: generatedAt, updated_at: generatedAt },
          { onConflict: "user_id,week_key,context_key" },
        );
      if (cacheErr) console.warn("[marketing-cases] cache write failed:", cacheErr.message);
    }

    return NextResponse.json({ plays: result.plays, sources: result.sources, generatedAt, cached: false, weekKey });
  } catch (err) {
    console.error("[marketing-cases error]", err);
    return NextResponse.json({ plays: [], sources: [], error: "Failed to generate cases" }, { status: 200 });
  }
}
