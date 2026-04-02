import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI 서비스가 설정되지 않았습니다." }, { status: 500 });
  }

  let input: BusinessPlanInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ko = input.language === "ko";

  const systemPrompt = ko
    ? `당신은 소상공인 창업 전문 컨설턴트입니다. 사용자가 제공한 데이터를 기반으로 소상공인시장진흥공단(소진공) 정책자금 신청에 적합한 사업계획서를 작성해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "summary": "사업계획서 한 줄 요약",
  "sections": [
    {"title": "1. 사업 개요", "content": "..."},
    {"title": "2. 창업 동기 및 목표", "content": "..."},
    {"title": "3. 시장 분석", "content": "..."},
    {"title": "4. 마케팅 전략", "content": "..."},
    {"title": "5. 재무 계획", "content": "..."},
    {"title": "6. 운영 계획", "content": "..."},
    {"title": "7. 리스크 관리", "content": "..."}
  ]
}

각 섹션의 content는 3~5문단으로, 구체적인 숫자와 데이터를 포함하여 신뢰감 있게 작성하세요. 추상적 표현 대신 실제 데이터를 인용하세요.`
    : `You are a startup business consultant. Generate a structured business plan based on the user's data. Respond ONLY in the JSON format specified.`;

  const userData = [
    `업종: ${input.industry} (${input.subIndustry})`,
    `창업 형태: ${input.startupType}${input.franchiseBrand ? ` — ${input.franchiseBrand}` : ""}`,
    `비즈니스 모델: ${input.businessModel}`,
    `초기 자본금: ${(input.capital / 10000).toLocaleString()}만원`,
    `목표 개업일: ${input.targetOpenDate}`,
    input.location ? `입지: ${input.location} (점수 ${input.locationScore ?? "-"})` : null,
    input.bepRevenue ? `손익분기 매출: 월 ${(input.bepRevenue / 10000).toLocaleString()}만원` : null,
    input.runway ? `생존 가능 기간: ${input.runway}개월` : null,
    input.riskLevel ? `리스크 수준: ${input.riskLevel}` : null,
    input.suppliers?.length ? `주요 공급업체: ${input.suppliers.join(", ")}` : null,
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
        max_tokens: 4096,
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
    console.error("[business-plan] Error:", err);
    return NextResponse.json(
      { error: "사업계획서 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
