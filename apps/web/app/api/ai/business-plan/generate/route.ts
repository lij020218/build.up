import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicApiKey, getRealAnthropicApiKey } from "../../../_lib/env";
import { runAiFeature } from "../../../_lib/ai-guard";
import { parseLlmJson } from "@foundone/ai/utils/parse-json";
import { buildPlanFacts, PLAN_HONESTY_RULES } from "../../../_lib/business-plan-facts";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

/**
 * 생성 성공 시 business_plan_drafts 원장에 저장 (2026-08-14 — 펀딩 페이지 '사업계획서 보기').
 *  fire-and-forget: 저장 실패가 생성 응답을 막지 않는다(로그만). 반환된 id 는 응답에 실어
 *  클라이언트가 목록과 매칭할 수 있게 한다.
 */
async function persistDraft(
  userId: string,
  input: BusinessPlanInput,
  plan: BusinessPlanResponse,
  model: string,
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("business_plan_drafts")
      .insert({
        user_id: userId,
        program_id: input.program?.id ?? null,
        program_name: input.program?.name ?? null,
        purpose: input.purpose ?? "govt-support",
        summary: plan.summary ?? null,
        sections: plan.sections,
        missing_info: plan.missingInfo ?? [],
        model,
      })
      .select("id")
      .single();
    if (error) {
      console.warn("[business-plan] 초안 저장 실패:", error.message);
      return null;
    }
    return (data?.id as string) ?? null;
  } catch (e) {
    console.warn("[business-plan] 초안 저장 예외:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

// 사업계획서 생성은 긴 AI 응답이 필요하므로 타임아웃 확장
// Claude(최대 110s) 실패 시 OpenAI 폴백(90s)까지 순차 실행될 수 있어 합산 여유 확보 (2026-08-14)
export const maxDuration = 240; // Vercel Pro: 최대 300초

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
  // ── 미니 위저드 입력 (2026-08-14 하네스 고도화) — 심사위원이 보는 "그 팀만의 내용" 보강 ──
  /** 대표자 경력·전문성 (선택) */
  founderBackground?: string;
  /** 우리 가게/제품만의 차별점 (선택) */
  differentiation?: string;
  /** 고객 반응·검증 근거 (선택) — 시식회, 사전 주문, 인터뷰 등 */
  customerEvidence?: string;
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
  /** 사용자가 채워야 완성되는 항목 체크리스트 (Claude 경로만 채움 — 빈칸을 '할 일'로 전환) */
  missingInfo?: string[];
};

// ── Claude Sonnet 5 구조화 출력 스키마 (2026-08-14) — 파싱 실패 자체를 제거 ──
const CLAUDE_MODEL = "claude-sonnet-5";
const PLAN_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "사업계획서 한 줄 요약 (엘리베이터 피치)" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
        additionalProperties: false,
      },
    },
    missingInfo: {
      type: "array",
      items: { type: "string" },
      description: "사용자가 제공하지 않아 [확인 필요]로 남긴 핵심 항목 — '무엇을 왜 채워야 하는지' 한 줄씩, 3~7개",
    },
  },
  required: ["summary", "sections", "missingInfo"],
  additionalProperties: false,
} as const;

/**
 * Claude Sonnet 5 경로 — 구조화 출력 + 시스템 프롬프트 캐싱.
 *  · system 은 세그먼트(스타트업/소상공인)별로 안정적 → cache_control 로 5분 캐시(입력비 ~90% 절감).
 *    공고 컨텍스트·유저 데이터는 user 메시지에 실어 캐시 프리픽스를 깨지 않는다.
 *  · adaptive thinking 은 Sonnet 5 기본값(생략 = on). max_tokens 는 사고+본문 합산 상한.
 *  · SDK 0.39 타이핑에 output_config 가 없어 cast — 서버는 GA 파라미터로 정상 처리.
 */
async function generateWithClaude(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
): Promise<BusinessPlanResponse> {
  const client = new Anthropic({ apiKey, timeout: 110_000 });
  const res = (await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    system: [
      { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
    ] as never,
    messages: [{ role: "user", content: userContent }],
    ...({ output_config: { format: { type: "json_schema", schema: PLAN_OUTPUT_SCHEMA } } } as object),
  })) as unknown as {
    stop_reason?: string;
    content?: Array<{ type: string; text?: string }>;
  };

  if (res.stop_reason === "refusal") {
    throw new Error("claude_refusal");
  }
  const text = res.content?.find((b) => b.type === "text")?.text ?? "";
  const parsed = parseLlmJson<BusinessPlanResponse>(text);
  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error("claude_empty_sections");
  }
  return parsed;
}

export async function POST(req: NextRequest) {
  // body 를 먼저 파싱 — (1) 잘못된 입력은 차감 전에 400 (2) 공고 맞춤 모드 여부로 feature 키를 분기.
  let earlyInput: BusinessPlanInput;
  try {
    earlyInput = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!earlyInput || typeof earlyInput !== "object" || typeof earlyInput.industry !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    const rawKey = process.env.ANTHROPIC_API_KEY;
    console.error("[business-plan] API key missing! raw exists:", !!rawKey, "raw length:", rawKey?.length, "raw prefix:", rawKey?.substring(0, 10));
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
  }

  // 2026-08-19 ai-guard: 분·일·주·월 한도 + 실패 시 전액 환불.
  //  · 공고 맞춤 모드 = business-plan-program, 주 2회 (2026-08-14 사장님 지시) → limits 로 명시.
  //  · retryOnce=false: 핸들러 안에 Claude→gpt 폴백이 이미 있고(최대 110s+90s), 게이트 재시도까지 하면
  //    maxDuration 240s 를 넘길 수 있다. 실패 시 환불은 그대로.
  //  (feature 키는 문자열 리터럴로 — ai-cost-budget 테스트가 비용표 드리프트를 정적 추출한다)
  const FAIL_MESSAGE = "사업계획서 생성에 실패했어요. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.";
  const guardOpts = earlyInput.program
    ? { request: req, feature: "business-plan-program", limits: { weekly: 2, daily: 2 }, retryOnce: false, failMessage: FAIL_MESSAGE }
    : { request: req, feature: "business-plan-generate", retryOnce: false, failMessage: FAIL_MESSAGE };
  return runAiFeature(guardOpts, async ({ userId }) => generatePlan(earlyInput, apiKey, userId));
}

async function generatePlan(input: BusinessPlanInput, apiKey: string, userId: string): Promise<NextResponse> {

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
- 각 섹션 4~7문단. 구체적 숫자와 데이터 필수. 추상적 표현 금지. 전체는 공식 양식에 옮겼을 때 A4 7~10장이 되는 분량을 목표로 충실하게 작성.
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

각 섹션의 content는 4~7문단으로, 구체적인 숫자와 데이터를 포함하여 신뢰감 있게 작성하세요. 추상적 표현 대신 실제 데이터를 인용하세요. 전체는 공식 양식에 옮겼을 때 A4 7~10장이 되는 분량을 목표로 충실하게 작성하세요.
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

  // missingInfo 체크리스트 규칙 (2026-08-14) — 빈칸을 결함이 아니라 "할 일"로 전환.
  const missingInfoRule = `\n\n[미제공 정보 체크리스트]\n사용자가 제공하지 않아 [확인 필요]로 남긴 핵심 항목을 missingInfo 배열에 담으세요.\n각 항목은 "무엇을(어느 섹션에) 왜 채워야 하는지"가 드러나는 한 문장으로, 3~7개. 없으면 빈 배열.`;

  // 정직성 규칙(PLAN_HONESTY_RULES)은 두 프롬프트 공통 — 없는 수치를 지어내는 대신
  //   [확인 필요: …] 플레이스홀더로 남기게 한다. 가짜 출처보다 빈 칸이 신뢰도에 낫다.
  // ⚠️ 공고 맞춤 블록(programBlock)은 system 이 아니라 user 메시지에 싣는다 —
  //   system 을 세그먼트별로 안정시켜 Claude prompt cache 프리픽스를 살리기 위함 (2026-08-14).
  const systemPrompt = ko
    ? `${isStartup ? startupSystemPrompt : smbSystemPrompt}\n\n${PLAN_HONESTY_RULES}${missingInfoRule}`
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
    // 미니 위저드 입력 (2026-08-14) — 심사위원이 보는 "그 팀만의 내용". 각 500자 컷.
    input.founderBackground ? `대표자 경력·전문성: ${clip(input.founderBackground, 500)}` : null,
    input.differentiation ? `핵심 차별점: ${clip(input.differentiation, 500)}` : null,
    input.customerEvidence ? `고객 반응·검증 근거: ${clip(input.customerEvidence, 500)}` : null,
  ].filter(Boolean).join("\n");

  // ── 검증된 정량 데이터 주입 ─────────────────────────────────────────
  //  2026-07 실호출 리뷰: 데이터를 안 주고 "출처를 명시하라"고만 시키니, 모델이 기관명만 대고
  //  수치는 "매우 크며"·"수십만~수백만" 으로 뭉갰다(= 심사에서 감점되는 인용 흉내).
  //  우리 SSOT(업종 매출·창업비용·출처·연도)를 그대로 주입해 지어낼 필요 자체를 없앤다.
  const factsSection = facts.factsBlock
    ? `\n\n──────────\n[검증된 데이터 — 아래 수치만 출처와 함께 인용하세요]\n${facts.factsBlock}`
    : "";
  // 공고 맞춤 블록은 user 콘텐츠 말미에 — system 캐시 프리픽스 보존 (위 주석 참조).
  const userDataWithFacts = `${userData}${factsSection}${programBlock}`;

  // ── 1차: Claude Sonnet 5 (구조화 출력 + 시스템 캐싱, 2026-08-14 하네스 업그레이드) ──
  const claudeKey = getRealAnthropicApiKey();
  if (claudeKey) {
    try {
      const result = await generateWithClaude(
        claudeKey,
        systemPrompt,
        `아래 데이터를 기반으로 사업계획서를 작성해주세요.\n\n${userDataWithFacts}`,
      );
      const draftId = await persistDraft(userId, input, result, CLAUDE_MODEL);
      return NextResponse.json({ ...result, draftId });
    } catch (err) {
      // 폴백 사유를 남긴다 (침묵 강등 금지) — refusal·타임아웃·파싱 실패 등
      console.warn(
        "[business-plan] Claude Sonnet 5 실패 → gpt-5.4-mini 폴백:",
        err instanceof Error ? err.message : String(err),
      );
    }
  } else {
    console.warn("[business-plan] ANTHROPIC_API_KEY 미설정 — gpt-5.4-mini 경로 사용");
  }

  // ── 2차(폴백): 기존 OpenAI 경로 ──
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

    // parseLlmJson: 코드펜스·머리말·잘림까지 4단계 복구 (2026-08-19). 실패 시 throw → 게이트 환불 + 503.
    let parsed: BusinessPlanResponse;
    try {
      parsed = parseLlmJson<BusinessPlanResponse>(text);
    } catch (parseErr) {
      console.error("[business-plan] JSON parse failed. First 500 chars:", String(text).substring(0, 500));
      console.error("[business-plan] Parse error:", parseErr instanceof Error ? parseErr.message : parseErr);
      return NextResponse.json({ error: "AI 응답을 파싱할 수 없습니다. 다시 시도해주세요." }, { status: 502 });
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

    const draftId = await persistDraft(userId, input, parsed, "gpt-5.4-mini");
    return NextResponse.json({ ...parsed, draftId });
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
