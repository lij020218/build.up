import { NextResponse } from "next/server";
import OpenAI from "openai";
import { resolveTrendGroup, TREND_GROUP_LABELS } from "@foundone/shared";
import { getOpenAIApiKey, getTavilyApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";
import { researchMarketingCases, type ResearchSource } from "../../../_lib/marketing-research";

/**
 * 마케팅 성공사례 → 내 사업 적용 ("마케팅 작업하기" 엔진).
 *
 *  2단계 파이프라인 (사례를 *확실히* 찾기 위한 신뢰성 설계):
 *    1) researchMarketingCases — OpenAI web_search(+Tavily 폴백)로 업종 최신 한국 사례·트렌드를 자유 텍스트로 수집
 *    2) OpenAI gpt-5.4-mini(json_object) — 수집 텍스트 + 가게 컨텍스트 → plays[] 구조화 (사례/트렌드 + 내 사업 적용)
 *
 *  ⚠️ 기존 trend-generator 는 web_search 응답에서 정규식으로 JSON 을 뽑아 자주 빈 결과("사례 0건")가 났음.
 *     검색(산문) 단계와 JSON 생성 단계를 분리해 이 문제를 제거.
 *
 *  캐시: marketing_cases_cache (user_id, week_key, context_key) — coach 와 동일 정책. 웹/iOS 동일 결과.
 *  인증: Supabase Bearer.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

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

export type PlayTool = { name: string; purpose: string; tier: "free" | "paid" | "freemium"; url?: string };

export type MarketingPlay = {
  /** 검증된 성공사례 기반인지(case), 현재 트렌드 기반인지(trend) — AI 가 더 유용한 쪽 선택 */
  kind: "case" | "trend";
  title: string;
  source: {
    brand?: string;           // 사례 주체 (트렌드면 생략 가능)
    whatHappened: string;     // 무엇을 했나 / 무슨 트렌드인가
    whyItWorked: string;      // 왜 통했나
    metric?: string;          // 검증된 정량 지표 (없으면 생략)
    url?: string;             // 출처
  };
  application: {
    steps: string[];          // 내 사업 맞춤 3~5단계
    expectedEffect: string;   // 기대 효과 (검증 수치 or 방향성)
    effortLevel: "low" | "medium" | "high";
  };
  tools: PlayTool[];
};

const TIERS = new Set(["free", "paid", "freemium"]);
const EFFORTS = new Set(["low", "medium", "high"]);

function str(v: unknown, max = 600): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

/** LLM 산출물 → MarketingPlay 정제. 필수 필드 없으면 null(드롭). */
function sanitizePlay(raw: unknown): MarketingPlay | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind = r.kind === "case" ? "case" : r.kind === "trend" ? "trend" : null;
  const title = str(r.title, 80);
  const src = (r.source && typeof r.source === "object" ? r.source : {}) as Record<string, unknown>;
  const app = (r.application && typeof r.application === "object" ? r.application : {}) as Record<string, unknown>;
  const whatHappened = str(src.whatHappened);
  const whyItWorked = str(src.whyItWorked);
  const steps = Array.isArray(app.steps)
    ? app.steps.map((s) => str(s, 280)).filter((s): s is string => !!s).slice(0, 6)
    : [];
  const expectedEffect = str(app.expectedEffect);
  if (!kind || !title || !whatHappened || steps.length === 0) return null;
  const effort = EFFORTS.has(app.effortLevel as string) ? (app.effortLevel as "low" | "medium" | "high") : "medium";
  const tools: PlayTool[] = Array.isArray(r.tools)
    ? r.tools
        .map((t) => {
          const to = (t && typeof t === "object" ? t : {}) as Record<string, unknown>;
          const name = str(to.name, 60);
          if (!name) return null;
          return {
            name,
            purpose: str(to.purpose, 120) ?? "",
            tier: TIERS.has(to.tier as string) ? (to.tier as PlayTool["tier"]) : "free",
            url: str(to.url, 300),
          } as PlayTool;
        })
        .filter((t): t is PlayTool => !!t)
        .slice(0, 4)
    : [];
  return {
    kind,
    title,
    source: {
      brand: str(src.brand, 80),
      whatHappened,
      whyItWorked: whyItWorked ?? "",
      metric: str(src.metric, 120),
      url: str(src.url, 300),
    },
    application: { steps, expectedEffect: expectedEffect ?? "", effortLevel: effort },
    tools,
  };
}

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
  const contextKey = [body.storeName ?? "내가게", subIdentifier, lang].join("|");

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
    // ── 1단계: 사례·트렌드 조사 ──
    const research = await researchMarketingCases({ apiKey, tavilyKey: getTavilyApiKey(), label, language: lang });

    if (!research.text || research.text.trim().length < 80) {
      // 조사 실패 — 빈 결과로 graceful (UI 는 "잠시 후 재시도" 안내).
      return NextResponse.json({ plays: [], sources: research.sources, generatedAt: new Date().toISOString(), cached: false, weekKey });
    }

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

    // ── 2단계: 가게 맞춤 구조화 ──
    const storeName = body.storeName?.trim() || (ko ? "내 가게" : "your business");
    const revMan = body.monthlyRevenueWon ? Math.round(body.monthlyRevenueWon / 10000) : null;
    const roas = body.blendedRoas && body.blendedRoas > 0 ? body.blendedRoas.toFixed(1) : null;
    const stage = body.currentStageLabel || (ko ? "미정" : "unknown");
    const isLaunched = !!body.launchDate;
    const channels = body.activeChannels && body.activeChannels.length > 0 ? body.activeChannels.join(", ") : (ko ? "없음" : "none");
    const noSales = body.hasUserSales === false;

    const system = ko
      ? `당신은 한국 소상공인 마케팅 전략가입니다. 아래 [조사자료]에 담긴 실제 사례·트렌드만 근거로,
이 가게가 **그대로 따라 할 수 있는 마케팅 플레이**를 우선순위 순으로 만듭니다.

🚨 우선순위 규칙 (한국 소상공인 현실 — 시간·예산·지식 모두 부족):
- **모든 채널을 동시에 권하지 말 것.** 가장 중요한 1가지에 집중시킨다.
- 채널 우선순위: ① 네이버 플레이스(정보·리뷰·사진) ② 인스타 15초 숏폼(사장님이 직접) ③ 그 외.
- 네이버 플레이스가 활성 채널에 없으면 1순위는 네이버 플레이스. **단, "개설"인지 "최적화"인지 단계로 구분**:
  · **운영 중인 가게**는 네이버 플레이스가 이미 등록돼 있을 가능성이 크다 → "개설"이 아니라 **리뷰·사진·키워드 최적화**를 1순위로.
  · **예비창업/오픈 준비**일 때만 "개설/기본 세팅"을 1순위로.
- 첫 번째 플레이(plays[0]) = "이번 주에 딱 이거 하나만" — 가장 임팩트 크고 바로 실행 가능한 것.
- 매출이 아직 없는 가게면 '돈 적게 드는' 플레이 우선.

절대 규칙:
- 브랜드명·수치는 [조사자료]에 있는 것만. 자료에 없으면 지어내지 말 것(metric 은 생략).
- 각 플레이는 사례(case) 또는 트렌드(trend) 중 이 가게에 더 유용한 형태로.
- application.steps 는 이 가게(업종·규모·단계) 기준 30분~2시간 내 실행 가능한 구체 행동.
- 추상적 조언 금지. "오늘 당장" 가능한 것만.`
      : `You are a Korean small-business marketing strategist. Using ONLY the real cases/trends in [RESEARCH],
create prioritized marketing plays this store can copy directly. Focus on ONE thing — don't push all channels at once.
Channel priority: Naver Place → Instagram 15s shorts → others. plays[0] = the single most important action this week.
No invented brands or numbers. Concrete, doable today.`;

    const user = ko
      ? `[가게]
- 상호: ${storeName}
- 업종: ${label}
- 단계: ${stage} (${isLaunched ? "운영 중" : "준비 중"})
- 이번 달 매출: ${revMan ? `${revMan.toLocaleString()}만원` : "미입력"}${noSales ? " (아직 매출 없음)" : ""}
- ROAS: ${roas ? `${roas}x` : "데이터 없음"}
- 활성 채널: ${channels}

[조사자료]
${research.text.slice(0, 6000)}
${feedbackBlock}
위 [조사자료]의 실제 사례·트렌드를 바탕으로, 이 가게에 맞는 마케팅 플레이를 **우선순위 순으로 3~4개** 만들어 주세요.
plays[0] 는 "이번 주에 딱 이거 하나만" — 가장 중요하고 바로 실행 가능한 1순위입니다(채널 우선순위·활성채널 반영).
각 플레이는 "왜 통했는지(사례/트렌드)" + "내 가게에 이렇게 적용" 으로 구성합니다.

반드시 아래 JSON 으로만 응답 (코드블록·설명 없이):
{
  "plays": [
    {
      "kind": "case" | "trend",
      "title": "한 줄 제목(20자 이내)",
      "source": {
        "brand": "사례 브랜드/가게명 (트렌드면 생략)",
        "whatHappened": "무엇을 했는지 / 무슨 트렌드인지 1~2문장",
        "whyItWorked": "왜 통했는지 1문장",
        "metric": "조사자료에 있는 정량 지표만 (없으면 생략)",
        "url": "출처 URL (조사자료에 있으면)"
      },
      "application": {
        "steps": ["① ...", "② ...", "③ ..."],
        "expectedEffect": "이 가게 기준 기대 효과 (검증 수치 or 방향성)",
        "effortLevel": "low" | "medium" | "high"
      },
      "tools": [ {"name":"도구","purpose":"용도","tier":"free|paid|freemium","url":"https://..."} ]
    }
  ]
}`
      : `[STORE] name:${storeName}, industry:${label}, stage:${stage}, revenue:${revMan ?? "n/a"}만원, ROAS:${roas ?? "n/a"}, channels:${channels}

[RESEARCH]
${research.text.slice(0, 6000)}

Create 4 marketing plays tailored to this store. Respond ONLY with JSON:
{"plays":[{"kind":"case|trend","title":"...","source":{"brand":"...","whatHappened":"...","whyItWorked":"...","metric":"...","url":"..."},"application":{"steps":["..."],"expectedEffect":"...","effortLevel":"low|medium|high"},"tools":[{"name":"...","purpose":"...","tier":"free|paid|freemium","url":"..."}]}]}`;

    const client = new OpenAI({ apiKey, timeout: 40_000 });
    const r = await client.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 2600,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = r.choices[0]?.message?.content ?? "{}";
    let parsed: { plays?: unknown[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("[marketing-cases] JSON parse failed, len:", content.length);
      return NextResponse.json({ plays: [], sources: research.sources, generatedAt: new Date().toISOString(), cached: false, weekKey });
    }

    const plays = (Array.isArray(parsed.plays) ? parsed.plays : [])
      .map(sanitizePlay)
      .filter((p): p is MarketingPlay => p !== null)
      .slice(0, 6);

    const generatedAt = new Date().toISOString();

    if (supa && plays.length > 0) {
      const { error: cacheErr } = await supa
        .from("marketing_cases_cache")
        .upsert(
          { user_id: userId, week_key: weekKey, context_key: contextKey, plays, sources: research.sources, generated_at: generatedAt, updated_at: generatedAt },
          { onConflict: "user_id,week_key,context_key" },
        );
      if (cacheErr) console.warn("[marketing-cases] cache write failed:", cacheErr.message);
    }

    return NextResponse.json({ plays, sources: research.sources, generatedAt, cached: false, weekKey });
  } catch (err) {
    console.error("[marketing-cases error]", err);
    return NextResponse.json({ plays: [], sources: [], error: "Failed to generate cases" }, { status: 200 });
  }
}
