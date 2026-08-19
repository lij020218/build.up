import OpenAI from "openai";
import { parseLlmJson } from "@foundone/ai/utils/parse-json";
import { withOpenAiFallback, OPENAI_SDK_MAX_RETRIES } from "./openai-fallback";
import { researchMarketingCases, type ResearchSource } from "./marketing-research";

/**
 * 마케팅 플레이 생성 코어 (2026-07-25 추출).
 *
 * cases/route.ts 에서 리서치→합성→정제 파이프라인을 분리한 것.
 * 목적: 스모크 하네스(scripts/smoke-marketing-cases.mts)가 **라우트와 정확히
 * 같은 코드**로 LLM 품질을 평가할 수 있게 — 스크립트 전용 복제본을 만들면
 * 프롬프트가 갈라지는 순간 평가가 무의미해진다.
 *
 * 라우트가 갖는 것: 인증·캐시·레이트리밋·피드백 블록 조회.
 * 코어가 갖는 것: 리서치 호출·프롬프트·OpenAI 호출·sanitize.
 */

export type PlayTool = { name: string; purpose: string; tier: "free" | "paid" | "freemium"; url?: string };

/** 복사해 바로 쓰는 실행물 — "읽고 번역하는 3단계" 를 "버튼" 으로 바꾸는 핵심 (2026-07-24 개편). */
export type PlayDeliverable = {
  kind: "copy" | "guide";   // copy=그대로 붙여넣는 텍스트, guide=따라 하는 짧은 가이드
  label: string;            // "인스타 캡션 + 해시태그" / "단골에게 보낼 메시지" / "촬영 3컷"
  content: string;          // 실제 내용 — 가게 데이터 기반, 바로 사용 가능해야 함
};

export type MarketingPlay = {
  /** 검증된 성공사례 기반인지(case), 현재 트렌드 기반인지(trend) — AI 가 더 유용한 쪽 선택 */
  kind: "case" | "trend";
  title: string;
  /** 미션 한 문장 (명령형, 첫 화면의 주인공) — "점심 도시락 뚜껑 여는 순간 3초 릴스 찍기" */
  mission?: string;
  /** 소요 시간 배지 — "5분 컷" / "15분" */
  timeLabel?: string;
  /** 복사/저장 버튼이 되는 실행물 2~3개 */
  deliverables?: PlayDeliverable[];
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
export function sanitizePlay(raw: unknown): MarketingPlay | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  let kind: "case" | "trend" | null = r.kind === "case" ? "case" : r.kind === "trend" ? "trend" : null;
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

  // ── 사례 실재성 게이트 (2026-07-24 사장님 원칙): "검증된 사례" 배지는
  //    실명(brand) + 출처 URL 이 있을 때만. 없으면 드롭이 아니라 trend 로 강등 —
  //    페이지는 계속 동작하되, 근거 없는 것에 '검증' 라벨을 붙이지 않는다.
  if (kind === "case" && (!str(src.brand, 80) || !str(src.url, 300))) kind = "trend";

  const effort = EFFORTS.has(app.effortLevel as string) ? (app.effortLevel as "low" | "medium" | "high") : "medium";
  const deliverables: PlayDeliverable[] = Array.isArray(r.deliverables)
    ? r.deliverables
        .map((dv) => {
          const o = (dv && typeof dv === "object" ? dv : {}) as Record<string, unknown>;
          const label = str(o.label, 40);
          const content = str(o.content, 600);
          if (!label || !content) return null;
          return { kind: o.kind === "guide" ? "guide" : "copy", label, content } as PlayDeliverable;
        })
        .filter((dv): dv is PlayDeliverable => !!dv)
        .slice(0, 3)
    : [];
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
    mission: str(r.mission, 60),
    timeLabel: str(r.timeLabel, 20),
    deliverables,
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

export type GeneratePlaysInput = {
  openaiKey: string;
  tavilyKey?: string;
  /** 프롬프트 주입용 업종 라벨 (예: "치킨·버거·배달음식") */
  label: string;
  /** 업종 대분류 (food, cafe-dessert, …, startup-tech) — 채널 우선순위 정책 분기용 */
  categoryId?: string;
  language: "ko" | "en";
  storeName?: string;
  /** 동네 라벨 (예: "분당구 정자동") — deliverables 의 지역 키워드 실주입용. 없으면 지역 문구 생략 지시. */
  region?: string;
  monthlyRevenueWon?: number;
  blendedRoas?: number;
  activeChannels?: string[];
  currentStageLabel?: string;
  launchDate?: string | null;
  hasUserSales?: boolean;
  /** 라우트가 조회해 만든 "[지난주 실행 결과]" 블록 (없으면 빈 문자열) */
  feedbackBlock?: string;
};

export type GeneratePlaysOutput = {
  plays: MarketingPlay[];
  sources: ResearchSource[];
  /** 스모크 하네스 진단용 — 리서치 산문 (라우트는 사용 안 함) */
  researchText: string;
  /** plays 가 비어 있을 때 원인 — 라우트가 사용 횟수 환불 판단에 사용 (2026-08-19). 정상이면 undefined */
  failReason?: "research_empty" | "parse_failed";
};

/** 리서치 → 합성 → 정제. 리서치 실패 시 plays:[] (호출자가 graceful 처리). */
export async function generateMarketingPlays(input: GeneratePlaysInput): Promise<GeneratePlaysOutput> {
  const { openaiKey, tavilyKey, label, language, feedbackBlock = "" } = input;
  const ko = language === "ko";

  // ── 1단계: 사례·트렌드 조사 ──
  const research = await researchMarketingCases({ apiKey: openaiKey, tavilyKey, label, language });
  if (!research.text || research.text.trim().length < 80) {
    return { plays: [], sources: research.sources, researchText: research.text ?? "", failReason: "research_empty" };
  }

  // ── 2단계: 가게 맞춤 구조화 ──
  const storeName = input.storeName?.trim() || (ko ? "내 가게" : "your business");
  const revMan = input.monthlyRevenueWon ? Math.round(input.monthlyRevenueWon / 10000) : null;
  const roas = input.blendedRoas && input.blendedRoas > 0 ? input.blendedRoas.toFixed(1) : null;
  const stage = input.currentStageLabel || (ko ? "미정" : "unknown");
  const isLaunched = !!input.launchDate;
  const channels = input.activeChannels && input.activeChannels.length > 0 ? input.activeChannels.join(", ") : (ko ? "없음" : "none");
  const noSales = input.hasUserSales === false;

  // ── 업종군별 채널 정책 — B2B·온라인 사업에 "네이버 플레이스" 를 권하는 사고 방지 (2026-07-25 스모크 발견) ──
  const isOnlineBiz = input.categoryId === "startup-tech" || input.categoryId === "online-digital";
  const channelPolicy = isOnlineBiz
    ? `- 이 사업은 **오프라인 매장이 아니다.** 네이버 플레이스·배달앱·당근 같은 로컬 채널을 절대 권하지 말 것.
- 채널 우선순위: ① 디스콰이엇·제품 커뮤니티(초기 유저·검증) ② 링크드인/스레드 창업자 콘텐츠 ③ SEO 블로그·뉴스레터.`
    : `- 채널 우선순위: ① 네이버 플레이스(정보·리뷰·사진) ② 인스타 15초 숏폼(사장님이 직접) ③ 그 외.
- 네이버 플레이스가 활성 채널에 없으면 1순위는 네이버 플레이스. **단, "개설"인지 "최적화"인지 단계로 구분**:
  · **운영 중인 가게**는 네이버 플레이스가 이미 등록돼 있을 가능성이 크다 → "개설"이 아니라 **리뷰·사진·키워드 최적화**를 1순위로.
  · **예비창업/오픈 준비**일 때만 "개설/기본 세팅"을 1순위로.`;

  const system = ko
    ? `당신은 한국 소상공인 마케팅 전략가입니다. 아래 [조사자료]에 담긴 실제 사례·트렌드만 근거로,
이 가게가 **그대로 따라 할 수 있는 마케팅 플레이**를 우선순위 순으로 만듭니다.

🚨 우선순위 규칙 (한국 소상공인 현실 — 시간·예산·지식 모두 부족):
- **모든 채널을 동시에 권하지 말 것.** 가장 중요한 1가지에 집중시킨다.
${channelPolicy}
- 첫 번째 플레이(plays[0]) = "이번 주에 딱 이거 하나만" — 가장 임팩트 크고 바로 실행 가능한 것.
- 매출이 아직 없는 가게면 '돈 적게 드는' 플레이 우선.

절대 규칙:
- 브랜드명·수치는 [조사자료]에 있는 것만. 자료에 없으면 지어내지 말 것(metric 은 생략).
- **"case" 는 실명 가게/브랜드(brand) + 출처 URL(url) 이 [조사자료]에 있을 때만.** 없으면 kind 를 "trend" 로.
  해외 사례를 한국 가게에 억지 번역하지 말 것 — 한국 사례가 없으면 trend 로 정직하게.
- 각 플레이는 사례(case) 또는 트렌드(trend) 중 이 가게에 더 유용한 형태로.
- application.steps 는 이 가게(업종·규모·단계) 기준 30분~2시간 내 실행 가능한 구체 행동.
- 추상적 조언 금지. "오늘 당장" 가능한 것만.

📌 출력 형태 규칙 (2026-07 개편 — "읽는 보고서" 금지, "쓸 재료" 로):
- mission: 사장님이 볼 첫 문장. **명령형 한 문장, 25자 이내** — "점심 도시락 뚜껑 여는 순간 3초 릴스 찍기".
- timeLabel: 실제 소요 시간 — "5분 컷", "15분". 과소 추정 금지.
- deliverables: **복사해서 바로 쓰는 실행물 2~3개.** 이게 이 서비스의 핵심 가치다.
  · kind "copy" = 그대로 붙여넣는 텍스트 (인스타 캡션+해시태그, 손님에게 보낼 메시지, 플레이스 새소식 초안 등)
  · kind "guide" = 짧은 따라하기 (촬영 3컷 순서 등)
  · content 는 [가게] 정보(상호·업종·동네)를 실제로 넣어 완성형으로. "OO을 넣으세요" 같은 빈칸 금지.
  · **동네를 모르면(가게 정보에 없으면) "○○동" 같은 빈칸을 절대 쓰지 말 것** — 지역 문구를 빼고도 완성되는 문장으로.
  · 채널은 업종 상식에 맞게 — 외식·카페면 인스타/배달앱/플레이스, B2B·SaaS 면 디스콰이엇/링크드인 등.`
    : `You are a Korean small-business marketing strategist. Using ONLY the real cases/trends in [RESEARCH],
create prioritized marketing plays this store can copy directly. Focus on ONE thing — don't push all channels at once.
Channel priority: Naver Place → Instagram 15s shorts → others. plays[0] = the single most important action this week.
No invented brands or numbers. Concrete, doable today.`;

  const user = ko
    ? `[가게]
- 상호: ${storeName}
- 업종: ${label}${input.region ? `\n- 동네: ${input.region}` : ""}
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
      "mission": "명령형 미션 한 문장 (25자 이내)",
      "timeLabel": "5분 컷",
      "deliverables": [
        {"kind":"copy","label":"인스타 캡션 + 해시태그","content":"그대로 붙여넣을 완성 텍스트"},
        {"kind":"guide","label":"촬영 3컷","content":"① ... ② ... ③ ..."}
      ],
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

Create 4 marketing plays tailored to this store. plays[0] must include a one-sentence imperative "mission",
a realistic "timeLabel", and 2-3 "deliverables" (ready-to-paste caption/message/checklist using the store's real name).
Mark kind "case" ONLY when a named brand + source url exist in [RESEARCH]; otherwise "trend". Respond ONLY with JSON:
{"plays":[{"kind":"case|trend","title":"...","mission":"...","timeLabel":"...","deliverables":[{"kind":"copy|guide","label":"...","content":"..."}],"source":{"brand":"...","whatHappened":"...","whyItWorked":"...","metric":"...","url":"..."},"application":{"steps":["..."],"expectedEffect":"...","effortLevel":"low|medium|high"},"tools":[{"name":"...","purpose":"...","tier":"free|paid|freemium","url":"..."}]}]}`;

  // SDK 재시도 3 + 일시 오류 시 gpt-5.4-mini 폴백 (2026-08-19). response_format json_object 필요라 OpenAI 직접 호출 유지.
  const client = new OpenAI({ apiKey: openaiKey, timeout: 55_000, maxRetries: OPENAI_SDK_MAX_RETRIES }); // terra 추론 지연 여유 (실측 합성 ~25s)
  const r = await withOpenAiFallback("gpt-5.6-terra", (model) => client.chat.completions.create({
    // 2026-07-27 GPT-5.6 전환 실험: terra = 5.5 동급 성능 절반가($2.5/$15).
    //  ⚠️ 5.6 계열은 temperature 미지원(400) — 파라미터 제거. reasoning_effort low 로
    //  추론 토큰(출력 과금)·지연 상한. max 토큰은 추론분 여유 +600.
    model,
    reasoning_effort: "low",
    max_completion_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  }), "[marketing-cases-core]");

  // [ai-cost] 비용 관측 — 1인 월 ₩6,000 예산 검사용 (2026-07-27 사장님 지시). prod 로그에서 grep "[ai-cost]"
  console.info("[ai-cost] marketing-cases", JSON.stringify({ model: r.model, in: r.usage?.prompt_tokens, out: r.usage?.completion_tokens }));

  const content = r.choices[0]?.message?.content ?? "";
  let parsed: { plays?: unknown[] };
  try {
    // robust 4단계 파서(strict → loose → damage fix → truncated repair)
    parsed = content.trim() ? parseLlmJson<{ plays?: unknown[] }>(content) : {};
  } catch {
    console.warn("[marketing-cases-core] JSON parse failed, len:", content.length);
    return { plays: [], sources: research.sources, researchText: research.text, failReason: "parse_failed" };
  }

  const plays = (Array.isArray(parsed.plays) ? parsed.plays : [])
    .map(sanitizePlay)
    .filter((p): p is MarketingPlay => p !== null)
    .slice(0, 6);

  return { plays, sources: research.sources, researchText: research.text, ...(plays.length === 0 ? { failReason: "parse_failed" as const } : {}) };
}
