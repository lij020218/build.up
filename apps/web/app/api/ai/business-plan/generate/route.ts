import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";

// 사업계획서 생성은 긴 AI 응답이 필요하므로 타임아웃 확장
export const maxDuration = 120; // 120초 (Vercel Pro: 최대 300초)

/**
 * POST /api/ai/business-plan/generate
 *
 * Uses Claude Sonnet 4.6 to generate a structured business plan
 * from the user's roadmap data.
 */

type BusinessPlanInput = {
  industry: string;
  subIndustry: string;
  startupType: string;
  franchiseBrand?: string;
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

  const rateLimit = checkSimpleRateLimit({
    key: `business-plan:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
  }

  let input: BusinessPlanInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

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

  const systemPrompt = ko
    ? (isStartup ? startupSystemPrompt : smbSystemPrompt)
    : `You are a startup business consultant. Generate a structured business plan based on the user's data. Respond ONLY in the JSON format specified.`;

  const userData = [
    `업종: ${input.industry} (${input.subIndustry})`,
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

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `아래 데이터를 기반으로 사업계획서를 작성해주세요:\n\n${userData}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[business-plan] Anthropic API error:", res.status, err);
      return NextResponse.json({ error: "AI 응답 생성에 실패했습니다." }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";

    // Parse JSON from response
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    let parsed: BusinessPlanResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from mixed response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
        }
      } else {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
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
