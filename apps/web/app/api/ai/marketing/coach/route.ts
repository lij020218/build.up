import { NextResponse } from "next/server";
import { createAiClient } from "@foundone/ai/utils/client";
import { resolveTrendGroup, TREND_GROUP_LABELS } from "@foundone/shared";
import { getAnthropicApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

/**
 * 가게 맞춤 마케팅 코칭 — 트렌드와 독립된 개인화 조언.
 *
 * 입력: 가게명 · 업종 · 세부업종 · 월 매출 · 활성 채널 · ROAS · 현재 단계
 * 출력: 3개 액션 — 우선순위, 기대 효과, 실행 단계, 추천 도구
 *
 * 캐시 (2026-05-20): Supabase `marketing_coach_cache` 테이블
 *   • PK: (user_id, week_key, context_key)
 *   • 같은 주차 + 같은 contextKey → 즉시 cache hit (LLM 호출 0)
 *   • 웹/모바일 동일 결과 보장
 *   • force=true → 캐시 무시하고 재생성 (사용자 "재생성" 버튼)
 *
 * 인증: Supabase Bearer 필수.
 */

/** ISO 주차 키 (YYYY-Www) — 매주 월요일 시작, **KST 기준**.
 *  ⚠️ 2026-06-11 fix: UTC 캘린더로 계산하면 KST 월요일 00~09시에 전주 키를 반환해
 *     주간 갱신이 밀림. cases/route 와 동일하게 KST 캘린더 일자에서 ISO 주차 계산. */
function getIsoWeekKey(date: Date = new Date()): string {
  // ISO 8601: week starts Monday, week 1 contains January 4.
  const kst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const target = new Date(Date.UTC(kst.getFullYear(), kst.getMonth(), kst.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  target.setUTCDate(target.getUTCDate() - dayNr + 3); // nearest Thursday
  const jan4 = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target.getTime() - jan4.getTime()) / 86_400_000 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export const runtime = "nodejs";
export const maxDuration = 60;

type RequestBody = {
  storeName?: string;
  industryCategoryId?: string;
  subIndustryId?: string;
  /** 세부업종 fine-grained 한글/영문 라벨 (예: "한식/백반·가정식"). 클라이언트가 주면 우선 사용. */
  subIndustryLabel?: string;
  monthlyRevenueWon?: number;        // 이번 달 추정 매출
  monthlySpendWon?: number;           // 이번 달 마케팅 지출
  blendedRoas?: number;               // 전체 ROAS (0 = 데이터 없음)
  activeChannels?: string[];          // ["instagram", "naver-place", ...]
  currentStageLabel?: string;         // 현재 로드맵 단계 (예: "오픈 준비")
  launchDate?: string | null;         // 오픈일 ISO (운영 중이면 값 있음)
  language?: "ko" | "en";
  /** true → 서버 캐시 무시하고 재생성 (사용자 "재생성" 버튼) */
  force?: boolean;
};

export type CoachTool = {
  name: string;
  purpose: string;
  tier: "free" | "paid" | "freemium";
  url?: string;
};

export type CoachAction = {
  priority: "now" | "this-week" | "this-month";
  title: string;                      // "네이버 플레이스 체험단 20명 모집"
  why: string;                        // "현재 ROAS 0.8x로 미흡 — 체험단은 초기 리뷰 10개 확보가 핵심"
  howToExecute: string[];             // 3~5 steps
  expectedImpact: string;             // "월 방문자 +15%, 리뷰 10건 확보 시 네이버 플레이스 상단 노출 가능"
  tools: CoachTool[];
};

export async function POST(request: Request) {
  // ─── 1. 인증 (Supabase Bearer) ───
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;

  const apiKey = getAnthropicApiKey();
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lang: "ko" | "en" = body.language === "en" ? "en" : "ko";
  const ko = lang === "ko";

  // ─── 2. 캐시 키 ───
  const weekKey = getIsoWeekKey();
  const subIdentifier = body.subIndustryId ?? body.industryCategoryId ?? "general";
  const contextKey = [body.storeName ?? "내가게", subIdentifier, lang].join("|");

  // ─── 3. 캐시 조회 (force=false 일 때만) ───
  const supa = getSupabaseAdmin();
  if (!body.force && supa) {
    const { data: cached } = await supa
      .from("marketing_coach_cache")
      .select("actions, generated_at")
      .eq("user_id", userId)
      .eq("week_key", weekKey)
      .eq("context_key", contextKey)
      .maybeSingle();

    if (cached && Array.isArray(cached.actions) && (cached.actions as CoachAction[]).length > 0) {
      return NextResponse.json({
        actions: cached.actions as CoachAction[],
        generatedAt: cached.generated_at,
        cached: true,
        weekKey,
      });
    }
  }

  const rl = await checkSimpleRateLimit({
    key: `ai-marketing-coach:${userId}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId,
    feature: "marketing-coach",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  // 업종 라벨 해석 — fine-grained (클라이언트가 준) > 20-그룹 cluster 라벨 > 대분류 fallback
  const subGroup = resolveTrendGroup(body.subIndustryId ?? null);
  const groupLabel = subGroup
    ? (ko ? TREND_GROUP_LABELS[subGroup].ko : TREND_GROUP_LABELS[subGroup].en)
    : null;
  const subLabel = body.subIndustryLabel?.trim()
    || groupLabel
    || (body.industryCategoryId ?? "business");

  const storeName = body.storeName?.trim() || (ko ? "내 가게" : "your business");
  const revMan = body.monthlyRevenueWon ? Math.round(body.monthlyRevenueWon / 10000) : null;
  const spendMan = body.monthlySpendWon ? Math.round(body.monthlySpendWon / 10000) : null;
  const roas = body.blendedRoas && body.blendedRoas > 0 ? body.blendedRoas.toFixed(1) : null;
  const stage = body.currentStageLabel || (ko ? "미정" : "unknown");
  const isLaunched = !!body.launchDate;

  const activeChannelsText = body.activeChannels && body.activeChannels.length > 0
    ? body.activeChannels.join(", ")
    : (ko ? "없음 (아직 채널 운영 전)" : "none yet");

  // ═══════════════════════════════════════════════════
  // System (cacheable) — 일반 지침, 할루시네이션 방지
  // ═══════════════════════════════════════════════════
  const systemText = ko
    ? `당신은 한국 소상공인·창업가를 돕는 마케팅 코치입니다.

🚨 **절대 준수 — 할루시네이션 금지**:
- 모든 브랜드 사례·구체 수치(+XX%, 전환율 등)는 **반드시 web_search 결과에서 확인된 내용**만 사용.
- web_search에서 확인되지 않은 브랜드 이름·캠페인명·통계 수치 **절대 금지** (추측·일반 지식·상상 모두 금지).
- 검증 불가능한 영역은 **방향성 문구**("효과적이다", "도움이 된다")로만 서술. 구체 수치 삽입 금지.
- 브랜드 사례를 인용하면 **그 사례의 출처 URL을 tools 또는 howToExecute에 포함**.

**원칙**:
- 추상 조언 금지. "오늘 당장 실행할 수 있는 구체 액션"만.
- 사장님 가게 context(ROAS·채널·매출·단계)는 입력값 그대로 인용 가능 (웹 검색 대상 아님).
- 도구는 포맷에 맞는 조합만 (CapCut/Midjourney/Gemini/Meta Business Suite/Canva 등 널리 알려진 것).
- 사장님 혼자 30분~2시간 내 실행 가능한 범위.`
    : `You are a marketing coach for Korean small business owners.

🚨 **STRICT — No hallucination**:
- All brand cases and specific numbers must come from verified web_search results ONLY.
- Do NOT mention unverified brand names, campaign names, or statistics.
- For unverified areas, use directional language ("effective", "helpful") without specific numbers.
- When citing a brand case, include its source URL in tools or howToExecute.

**Principles**:
- No abstract advice. Concrete actions executable today.
- Store context (ROAS, channels, revenue, stage) from input is usable directly (no web search needed).
- Tools: CapCut, Midjourney, Gemini, Meta Business Suite, Canva, etc.
- Doable by the owner alone in 30 minutes to 2 hours.`;

  // ═══════════════════════════════════════════════════
  // User (dynamic) — 가게별 context
  // ═══════════════════════════════════════════════════
  const userText = ko
    ? `가게 정보:
- 상호: ${storeName}
- 업종: ${subLabel}
- 현재 단계: ${stage}
- 오픈 여부: ${isLaunched ? "운영 중" : "준비 중"}
- 이번 달 매출: ${revMan ? `${revMan.toLocaleString()}만원` : "미입력"}
- 이번 달 마케팅 지출: ${spendMan ? `${spendMan.toLocaleString()}만원` : "미입력"}
- ROAS: ${roas ? `${roas}x` : "데이터 없음"}
- 활성 채널: ${activeChannelsText}

**생성 절차**:
1. 먼저 web_search 툴로 "${subLabel} 마케팅 전략", "한국 [업종] 소상공인 고객 확보 사례" 등 검색해서 검증 가능한 브랜드 사례·전술·수치 확보.
2. 위 가게 context(매출·ROAS·단계·채널)를 반영해 가장 적절한 **마케팅 액션 3개**를 우선순위별로 작성.
3. 각 액션의 why에는 **입력된 가게 수치를 직접 인용** (예: "ROAS 0.5x", "매출 850만원").
4. expectedImpact의 구체 수치는 **web_search에서 확인된 경우만** 사용. 확인 안 되면 방향성 문구로 대체.

반드시 아래 JSON 배열로만 응답 (코드블록 없이):
[
  {
    "priority": "now" | "this-week" | "this-month",
    "title": "액션 제목 (20자 이내)",
    "why": "위 가게 수치 인용 + 왜 필요한지 1~2문장",
    "howToExecute": ["① ...", "② ...", "③ ..."],
    "expectedImpact": "검색 결과에서 확인된 수치 또는 방향성 문구",
    "tools": [
      {"name": "도구명", "purpose": "용도", "tier": "free|paid|freemium", "url": "https://..."}
    ]
  }
]`
    : `Store info:
- Name: ${storeName}
- Industry: ${subLabel}
- Stage: ${stage}
- Status: ${isLaunched ? "Operating" : "Pre-launch"}
- Monthly revenue: ${revMan ? `${revMan.toLocaleString()}만원` : "N/A"}
- Monthly marketing spend: ${spendMan ? `${spendMan.toLocaleString()}만원` : "N/A"}
- ROAS: ${roas ? `${roas}x` : "N/A"}
- Active channels: ${activeChannelsText}

Propose **3 most relevant marketing actions** for this specific business, ranked by priority.
Each action MUST reference the store's specific numbers/context.

Respond with ONLY the JSON array:
[
  {
    "priority": "now" | "this-week" | "this-month",
    "title": "Action title (<=30 chars)",
    "why": "Why this store specifically needs this (reference numbers above)",
    "howToExecute": ["1. ...", "2. ...", "3. ...", "4. ..."],
    "expectedImpact": "Expected impact with numbers and timeframe",
    "tools": [
      {"name": "Tool name", "purpose": "purpose", "tier": "free|paid|freemium", "url": "https://..."}
    ]
  }
]`;

  try {
    const client = createAiClient(apiKey);
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 5,
        } as unknown,
      ],
      system: systemText,
      messages: [{ role: "user", content: userText }],
    });

    const textBlocks = response.content.filter((c) => c.type === "text");
    const combined = textBlocks.map((c) => (c as { type: "text"; text: string }).text).join("\n");
    const jsonMatch = combined.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.warn(
        "[coach] No JSON array | stop_reason:", response.stop_reason,
        "| first 300:", combined.slice(0, 300)
      );
      return NextResponse.json({ actions: [] });
    }

    // <cite> 태그 등 JSON-breaking XML 제거
    const sanitized = jsonMatch[0]
      .replace(/<cite[^>]*>/g, "")
      .replace(/<\/cite>/g, "");

    let actions: CoachAction[] = [];
    try {
      actions = JSON.parse(sanitized);
    } catch (err) {
      console.warn(
        "[coach] JSON parse failed:", err instanceof Error ? err.message : err,
        "| stop_reason:", response.stop_reason,
        "| last 200:", sanitized.slice(-200)
      );
      return NextResponse.json({ actions: [] });
    }

    const generatedAt = new Date().toISOString();

    // ─── 4. 캐시 기록 (실패해도 응답엔 영향 X) ───
    if (supa && actions.length > 0) {
      const { error: cacheErr } = await supa
        .from("marketing_coach_cache")
        .upsert(
          {
            user_id: userId,
            week_key: weekKey,
            context_key: contextKey,
            actions,
            generated_at: generatedAt,
            updated_at: generatedAt,
          },
          { onConflict: "user_id,week_key,context_key" }
        );
      if (cacheErr) {
        console.warn("[coach] cache write failed:", cacheErr.message);
      }
    }

    return NextResponse.json({
      actions,
      generatedAt,
      cached: false,
      weekKey,
    });
  } catch (err) {
    console.error("[Marketing coach error]", err);
    return NextResponse.json({ actions: [], error: "Failed to generate coaching" }, { status: 200 });
  }
}
