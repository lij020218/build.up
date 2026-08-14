import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { checkSimpleRateLimit, checkDailyRateLimit, checkWeeklyRateLimit } from "../../../_lib/rate-limit";
import { buildPlanFacts, PLAN_HONESTY_RULES } from "../../../_lib/business-plan-facts";

// 사업계획서 생성은 긴 AI 응답이 필요하므로 타임아웃 확장
export const maxDuration = 120; // 120초 (Vercel Pro: 최대 300초)

/**
 * POST /api/ai/business-plan/generate
 *
 * Uses Claude Sonnet 4.6 to generate a structured business plan
 * from the user's roadmap data.
 */

type BusinessPlanInput = {
  /** industryCategoryId (예: "food"). 라벨이 아니라 ID 다 — 벤치마크 조회 키로 쓴다. */
  industry: string;
  /** selectedIndustryId = 세부업종 ID (예: "korean-restaurant"). 미선택 시 "". */
  subIndustry: string;
  startupType: string;
  franchiseBrand?: string;
  /** 프랜차이즈 브랜드 ID — 공정위 기반 실데이터(창업비용·평균매출·폐점률) 조회용. */
  franchiseBrandId?: string;
  /** 사람이 읽는 업종명. 서버엔 category/specialty 라벨 SSOT 가 없어 클라가 넘겨준다. */
  industryLabel?: string;
  subIndustryLabel?: string;
  businessModel: string;
  capital: number;
  targetOpenDate: string;
  location?: string;
  locationScore?: number;
  bepRevenue?: number;
  runway?: number;
  riskLevel?: string;
  suppliers?: string[];
  language: "ko" | "en";
  // 용도 (스타트업)
  purpose?: "govt-support" | "loan" | "investor";
  // 로드맵에서 수집한 데이터 (스타트업)
  problemStatement?: string;
  teamStructure?: string;
  northStarType?: string;
  northStarMetricName?: string;
  interviewInsights?: string;
  targetCustomer?: string;
  /**
   * 공고 맞춤 모드 (펀딩 페이지, 2026-08-14) — K-Startup 라이브 공고의 특성을 주입해
   * 해당 공고 제출용으로 강조점을 조정한다. 있으면 주 2회 한도(business-plan-program) 적용.
   */
  program?: {
    id: string;
    name: string;
    organizer?: string;
    category?: string;
    target?: string;
    benefit?: string;
    region?: string;
    targetAge?: string;
    businessPeriod?: string;
    applicationEnd?: string;
  };
};

type BusinessPlanSection = {
  title: string;
  content: string;
};

type BusinessPlanResponse = {
  sections: BusinessPlanSection[];
  summary: string;
};

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await checkSimpleRateLimit({
    key: `business-plan:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // body 를 먼저 파싱해야 공고 맞춤 모드 여부로 한도를 분기할 수 있다.
  let earlyInput: BusinessPlanInput;
  try {
    earlyInput = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (earlyInput.program) {
    // 공고 맞춤 모드 — 주 2회 (2026-08-14 사장님 지시: 무료 개방이므로 주간 캡으로 비용 통제)
    const weekly = await checkWeeklyRateLimit({
      userId: auth.userId,
      feature: "business-plan-program",
      limit: 2,
      message: "공고 맞춤 사업계획서는 주 2회까지예요. 다음 주 월요일에 초기화됩니다.",
    });
    if (!weekly.ok) {
      return NextResponse.json({ error: weekly.error, remaining: 0, limit: weekly.limit, resetAt: weekly.resetAt }, { status: weekly.status });
    }
  } else {
    // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
    const dailyLimit = await checkDailyRateLimit({
      userId: auth.userId,
      feature: "business-plan-generate",
      limit: 3,
      message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
    });
    if (!dailyLimit.ok) {
      return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
    }
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    const rawKey = process.env.ANTHROPIC_API_KEY;
    console.error("[business-plan] API key missing! raw exists:", !!rawKey, "raw length:", rawKey?.length, "raw prefix:", rawKey?.substring(0, 10));
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
  }

  const input: BusinessPlanInput = earlyInput;

  const ko = input.language === "ko";
  const isStartup = input.industry === "startup-tech";
  const purposeLabel = input.purpose === "investor" ? "투자 유치" : input.purpose === "loan" ? "대출 신청" : "정부 지원사업 신청";

  const startupSystemPrompt = `당신은 예비창업패키지, 초기창업패키지, TIPS 평가위원 출신의 스타트업 전문 컨설턴트입니다.
사용자가 제공한 데이터를 기반으로 ${purposeLabel}에 적합한 사업계획서를 PSST 프레임워크로 작성해주세요.

PSST 프레임워크 (창업진흥원 평가 기준):
- P (Problem): 문제의 구체성 + 데이터 근거. 평가위원은 "이 문제가 진짜인가?"를 봅니다.
- S (Solution): 해결 방안의 실현 가능성. MVP/프로토타입 등 실행 증거가 핵심입니다.
- S (Scale-up): 시장 규모(TAM/SAM/SOM), 수익 모델, 고객 획득 전략의 현실성.
- T (Team): 대표자의 해당 분야 경험과 실행력. "왜 이 팀이 이 문제를 풀 수 있는가?"

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "summary": "사업계획서 한 줄 요약 (엘리베이터 피치 형태)",
  "sections": [
    {"title": "1. 문제 인식 (Problem)", "content": "타겟 고객의 핵심 고통, 기존 해결 방식의 한계, 시장 데이터 기반 문제 크기 수치화"},
    {"title": "2. 해결 방안 (Solution)", "content": "제품/서비스 핵심 기능, 기술적 차별화, MVP/프로토타입 현황, 경쟁 우위"},
    {"title": "3. 시장 분석 및 사업화 전략 (Scale-up)", "content": "TAM/SAM/SOM 추정, BM 수익 모델, 가격 전략, 고객 획득 채널, 1~3년 매출 로드맵"},
    {"title": "4. 팀 역량 (Team)", "content": "대표자 이력과 해당 분야 전문성, 팀 구성 및 역할, 핵심 역량이 이 문제를 풀 수 있는 이유"},
    {"title": "5. 재무 계획", "content": "초기 투자금 사용 계획, 월별 비용 구조(번레이트), 손익분기점 시점, 3년 재무 추정"},
    {"title": "6. 리스크 관리", "content": "기술/시장/재무/규제 리스크 각각 식별 + 구체적 대응 방안"},
    {"title": "7. 자금 집행 계획", "content": "항목별 구체 금액: 인건비, 서버/인프라, 마케팅, 외주, 특허/법무 등"}
  ]
}

핵심 규칙:
- 각 섹션 3~5문단. 구체적 숫자와 데이터 필수. 추상적 표현 금지.
- 사용자가 제공한 문제 정의, 인터뷰 인사이트, 팀 구성 데이터를 반드시 반영하세요.
- 평가위원이 "근거 있는 계획"이라고 느끼도록 업종 데이터와 벤치마크를 인용하세요.
- TAM/SAM/SOM은 반드시 출처(통계청, 업종 보고서 등)를 명시하세요.`;

  const smbSystemPrompt = `당신은 소상공인 창업 전문 컨설턴트입니다. 사용자가 제공한 데이터를 기반으로 소상공인시장진흥공단(소진공) 정책자금 신청에 적합한 사업계획서를 작성해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "summary": "사업계획서 한 줄 요약",
  "sections": [
    {"title": "1. 사업 개요", "content": "사업장명, 업종, 소재지, 창업 경위, 주요 상품/서비스"},
    {"title": "2. 창업 동기 및 목표", "content": "경력과의 연관성, 사업 비전, 1~3년 목표"},
    {"title": "3. 시장 및 상권 분석", "content": "상권 현황, 타겟 고객, 경쟁 업체 분석, 차별화 전략"},
    {"title": "4. 마케팅 전략", "content": "온/오프라인 홍보 전략, 고객 유치 방안, 배달앱/SNS 전략"},
    {"title": "5. 재무 계획", "content": "월별 매출 추정(근거 포함), 비용 구조, 손익분기점"},
    {"title": "6. 운영 계획", "content": "인력 운영, 공급처 관리, 품질 관리 체계"},
    {"title": "7. 자금 용도 및 상환 계획", "content": "항목별 자금 사용 계획(상품매입, 인건비, 인테리어 등), 현금흐름 기반 상환 스케줄"}
  ]
}

각 섹션의 content는 3~5문단으로, 구체적인 숫자와 데이터를 포함하여 신뢰감 있게 작성하세요. 추상적 표현 대신 실제 데이터를 인용하세요.
자금 용도는 "운전자금"처럼 뭉뚱그리지 말고 항목별 구체 금액으로 작성하세요.`;

  // ── 공고 맞춤 블록 (2026-08-14) — 공고의 대상·내용을 평가 포인트로 삼아 강조점을 조정.
  //   공고 원문이 길 수 있어 항목별 600자 컷 (입력 상한 6,500 토큰 예산 내).
  const clip = (s: string | undefined, n = 600) => (s ? (s.length > n ? `${s.slice(0, n)}…` : s) : null);
  const p = input.program;
  const programBlock = p
    ? [
        `\n\n[지원 공고 맞춤 지침 — 이 사업계획서는 아래 공고 제출용입니다]`,
        `- 공고명: ${clip(p.name, 200)}`,
        p.organizer ? `- 주관: ${clip(p.organizer, 100)}` : null,
        p.category ? `- 지원 분야: ${clip(p.category, 100)}` : null,
        p.region ? `- 지역: ${clip(p.region, 100)}` : null,
        p.targetAge ? `- 대상 연령: ${clip(p.targetAge, 100)}` : null,
        p.businessPeriod ? `- 대상 업력: ${clip(p.businessPeriod, 100)}` : null,
        p.target ? `- 지원 대상: ${clip(p.target)}` : null,
        p.benefit ? `- 지원 내용: ${clip(p.benefit)}` : null,
        `맞춤 규칙:`,
        `1. 공고의 지원 대상 조건(연령·업력·지역·분야)과 신청자의 실제 조건이 맞닿는 지점을 개요/팀 섹션에서 명시적으로 연결하세요.`,
        `2. 공고의 지원 내용(자금 용도·프로그램 산출물)에 맞춰 자금 계획·실행 계획의 지면을 늘리고, 공고와 무관한 내용은 줄이세요.`,
        `3. 공고가 특정 분야(수출, 기술, 청년, 재도전 등)를 명시하면 해당 관점의 목표와 지표를 각 섹션에 반영하세요.`,
        `4. 공고 조건 충족 여부가 데이터로 확인되지 않으면 단정하지 말고 [확인 필요] 로 남기세요.`,
      ].filter(Boolean).join("\n")
    : "";

  // 정직성 규칙(PLAN_HONESTY_RULES)은 두 프롬프트 공통 — 없는 수치를 지어내는 대신
  //   [확인 필요: …] 플레이스홀더로 남기게 한다. 가짜 출처보다 빈 칸이 신뢰도에 낫다.
  const systemPrompt = ko
    ? `${isStartup ? startupSystemPrompt : smbSystemPrompt}${programBlock}\n\n${PLAN_HONESTY_RULES}`
    : `You are a startup business consultant. Generate a structured business plan based on the user's data. Respond ONLY in the JSON format specified.
Never invent statistics. If a figure is not provided in the [검증된 데이터] block, leave a bracketed placeholder such as "[TODO: verify via Statistics Korea]" instead of fabricating a number or citing an institution without a figure.`;

  // buildPlanFacts 를 먼저 — userData 의 업종 라벨(raw ID 대신)도 여기서 나온다.
  const facts = buildPlanFacts({
    industryCategoryId: input.industry,
    specialtyId: input.subIndustry || undefined,
    franchiseBrandId: input.franchiseBrandId,
    industryLabel: input.industryLabel,
    subIndustryLabel: input.subIndustryLabel,
    capitalWon: input.capital,
  });

  const userData = [
    // ⚠️ 종전엔 raw ID 를 그대로 넣어 "업종: food (korean-restaurant)" 이 프롬프트에 박혔다.
    //   facts.searchLabel 은 CLUSTER_LABEL 기반 한글명("음식점·외식") → 모델이 업종을 정확히 인지.
    //   세부업종은 서버에 한글 라벨 SSOT 가 없어 슬러그뿐이라, 본문 인용 금지를 명시해 함께 넘긴다.
    //   (안 그러면 "세부 업태가 korean-restaurant인" 처럼 영문 슬러그가 계획서에 그대로 박힌다)
    `업종: ${facts.searchLabel}`,
    input.subIndustry
      ? `세부 업종 코드: ${input.subIndustry} — ⚠️ 내부 식별자입니다. 본문에 이 영문 코드를 절대 쓰지 말고, 뜻하는 업태를 한국어로 풀어 쓰세요.`
      : null,
    `창업 형태: ${input.startupType}${input.franchiseBrand ? ` — ${input.franchiseBrand}` : ""}`,
    `비즈니스 모델: ${input.businessModel}`,
    `초기 자본금: ${(input.capital / 10000).toLocaleString()}만원`,
    input.targetOpenDate ? `목표 개업일: ${input.targetOpenDate}` : null,
    input.purpose ? `사업계획서 용도: ${purposeLabel}` : null,
    input.location ? `입지: ${input.location} (점수 ${input.locationScore ?? "-"})` : null,
    input.bepRevenue ? `손익분기 매출: 월 ${(input.bepRevenue / 10000).toLocaleString()}만원` : null,
    input.runway ? `생존 가능 기간: ${input.runway}개월` : null,
    input.riskLevel ? `리스크 수준: ${input.riskLevel}` : null,
    input.suppliers?.length ? `주요 공급업체: ${input.suppliers.join(", ")}` : null,
    // 스타트업 로드맵 데이터
    input.problemStatement ? `핵심 문제 정의: ${input.problemStatement}` : null,
    input.teamStructure ? `팀 구성: ${input.teamStructure === "solo" ? "1인 창업 (솔로 파운더)" : "공동 창업"}` : null,
    input.targetCustomer ? `타겟 고객: ${input.targetCustomer}` : null,
    input.northStarType ? `북극성 지표 유형: ${input.northStarType}` : null,
    input.northStarMetricName ? `핵심 추적 지표: ${input.northStarMetricName}` : null,
    input.interviewInsights ? `고객 인터뷰 인사이트: ${input.interviewInsights}` : null,
  ].filter(Boolean).join("\n");

  // ── 검증된 정량 데이터 주입 ─────────────────────────────────────────
  //  2026-07 실호출 리뷰: 데이터를 안 주고 "출처를 명시하라"고만 시키니, 모델이 기관명만 대고
  //  수치는 "매우 크며"·"수십만~수백만" 으로 뭉갰다(= 심사에서 감점되는 인용 흉내).
  //  우리 SSOT(업종 매출·창업비용·출처·연도)를 그대로 주입해 지어낼 필요 자체를 없앤다.
  const factsSection = facts.factsBlock
    ? `\n\n──────────\n[검증된 데이터 — 아래 수치만 출처와 함께 인용하세요]\n${facts.factsBlock}`
    : "";
  const userDataWithFacts = `${userData}${factsSection}`;

  try {
    // ⚠️ 2026-05-18 마이그레이션: 종전엔 Anthropic URL 로 raw fetch 했는데 OPENAI_API_KEY 가
    //   전달되어 401 → 사업계획서 기능 100% 실패. OpenAI Chat Completions URL + Bearer 인증으로
    //   교체. timeout 90초 (사업계획서 대용량 응답 대비). 모델명은 client.ts MODEL_MAP 과 일치.
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(90_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        // ⚠️ GPT-5.4 시리즈는 max_tokens 미지원(2026 API 변경) → max_completion_tokens.
        //   종전 max_tokens 는 400(unsupported parameter) → 502 로 사업계획서 100% 실패.
        // ⚠️ 2026-06-26 A2 버그: response_format 미지정 시 모델이 산문/마크다운 + 말미 부분 JSON을
        //   내보내 cleanup regex(첫 { ~ 마지막 })가 마지막 객체(섹션 7)만 남겨 "섹션 7만 뜸" 발생.
        //   타 OpenAI 라우트(industry-daily·marketing/cases·funding/score)와 동일하게 json_object 강제.
        response_format: { type: "json_object" },
        // 7개 장문 섹션(각 3~5문단) 전량 수용 — 8192는 7섹션 한국어 본문에서 truncate 위험. 상향.
        max_completion_tokens: 12288,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `아래 데이터를 기반으로 사업계획서를 작성해주세요. 반드시 JSON 형식으로만 응답하세요. 설명이나 머리말 없이 { 로 시작하고 } 로 끝나는 순수 JSON만 출력하세요.\n\n${userDataWithFacts}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[business-plan] OpenAI API error:", res.status, err);
      return NextResponse.json({ error: "AI 응답 생성에 실패했습니다." }, { status: 502 });
    }

    const data = await res.json();
    // OpenAI Chat Completions 응답 구조: { choices: [{ message: { content } }] }
    const text =
      (typeof data.choices?.[0]?.message?.content === "string" ? data.choices[0].message.content : "") ||
      // 호환: Anthropic 형식 응답이 돌아오는 경우 (env hybrid 라우팅)
      data.content?.[0]?.text ||
      "";

    // Parse JSON from response — Claude sometimes wraps in markdown or adds preamble
    let cleaned = text.trim();
    // Remove markdown code fences
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```\s*$/i, "").trim();
    // Remove any text before the first {
    const firstBrace = cleaned.indexOf("{");
    if (firstBrace > 0) cleaned = cleaned.substring(firstBrace);
    // Remove any text after the last }
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace >= 0 && lastBrace < cleaned.length - 1) cleaned = cleaned.substring(0, lastBrace + 1);

    let parsed: BusinessPlanResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[business-plan] JSON parse failed. First 500 chars:", cleaned.substring(0, 500));
      console.error("[business-plan] Parse error:", parseErr instanceof Error ? parseErr.message : parseErr);
      // Last resort: try to find JSON object pattern
      const jsonMatch = cleaned.match(/\{[\s\S]*"sections"\s*:\s*\[[\s\S]*\]\s*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json({ error: "AI 응답을 파싱할 수 없습니다. 다시 시도해주세요." }, { status: 502 });
        }
      } else {
        return NextResponse.json({ error: "AI 응답을 파싱할 수 없습니다. 다시 시도해주세요." }, { status: 502 });
      }
    }

    if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      return NextResponse.json({ error: "Invalid AI response structure" }, { status: 502 });
    }

    // Validate each section has required fields
    parsed.sections = parsed.sections.filter(
      (s: Record<string, unknown>) => s && typeof s.title === "string" && typeof s.content === "string"
    );
    if (parsed.sections.length === 0) {
      return NextResponse.json({ error: "AI response sections are empty or malformed" }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[business-plan] Error:", msg);
    const isTimeout = msg.includes("timeout") || msg.includes("ETIMEDOUT") || msg.includes("abort");
    return NextResponse.json(
      { error: isTimeout
          ? "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
          : `사업계획서 생성 중 오류: ${msg}` },
      { status: isTimeout ? 504 : 503 }
    );
  }
}
