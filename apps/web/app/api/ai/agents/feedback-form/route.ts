import { NextResponse } from "next/server";
import { createAiClient } from "@build-up/ai/utils/client";
import { getAnthropicApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

/**
 * Feedback Form Agent — 소프트오픈/운영 피드백 질문지 자동 생성.
 *
 * 입력:
 * - industryCategoryId: food | cafe-dessert | beauty | fitness | retail | pet | education | living-service | space
 * - selectedIndustryId?: sub-industry (예: icecream-bingsu, ramen-noodle, hair-salon ...)
 * - startupType?: franchise | independent
 * - storeName?: 매장 이름 (인사말에 사용)
 * - language?: ko | en
 *
 * 출력:
 *   {
 *     intro: string,                         // 응답자 안내 인사말
 *     questions: Array<{
 *       id: string,
 *       type: "rating" | "multiple_choice" | "short_answer" | "yes_no",
 *       question: string,
 *       description?: string,                // 부가 안내 (선택)
 *       options?: string[],                  // multiple_choice용
 *       scale?: 5 | 7 | 10,                  // rating용 (기본 5)
 *       required?: boolean,
 *     }>,
 *     tips: string[],                        // 운영자 활용 팁 (3-5개)
 *     paperText: string,                     // 종이 카드용 한 페이지 plain text
 *   }
 *
 * UX: 사용자는 결과를 그대로 구글폼·네이버폼·카카오폼에 붙여넣을 수 있음.
 * 비용: prompt caching 으로 시스템 프롬프트 재사용 (90% 입력 토큰 절감).
 */

const SYSTEM_PROMPT = `당신은 한국 자영업자의 소프트오픈·운영 피드백 질문지를 설계하는 UX 리서처입니다.

원칙:
1. 질문 5–7개 (응답 1분 이내 — 길면 응답률 폭락)
2. 업종 핵심 항목 1개를 첫 번째로 (맛·시술 결과·상품 퀄리티 등)
3. 보편 항목 4–5개 — 서비스, 가격, 공간/분위기, 재방문 의향(1–5점), 좋았던 점/아쉬운 점
4. 1–5점 척도 우선 (3 미만이면 즉시 개선 신호)
5. 주관식은 마지막 1–2개만, "가장 아쉬운 점 한 가지만" 같은 짧은 단문 형식
6. 친근한 톤, 익명임을 강조 → 솔직한 답변 유도
7. sub-industry 가 있으면 그 업종에 특화된 질문 1–2개를 추가 (예: 빙수=토핑, 사골국밥=육수, 미용실=시술 만족도)
8. franchise = 본사 표준 준수 항목 1개 추가 가능 (메뉴 일관성 등)
9. independent = 사장님 개성·동네 적합도 항목 1개 추가 가능

응답은 JSON 만 반환. 다른 설명 X.`;

const SYSTEM_PROMPT_EN = `You are a UX researcher designing customer feedback forms for Korean small business owners during soft-launch and ongoing ops.

Rules:
1. 5–7 questions (1-min completion — longer = abandonment)
2. First question = industry-core (taste, treatment result, product quality)
3. 4–5 universal questions — service, price, ambiance, return intent (1–5), liked/missed points
4. Prefer 1–5 ratings (below 3 = immediate-fix signal)
5. Open-ended only as last 1–2 questions, short and pointed ("one thing you'd improve")
6. Friendly tone, emphasize anonymity to elicit honest answers
7. Sub-industry adds 1–2 specialized questions (bingsu=topping, broth-soup=stock depth, hair=cut satisfaction)
8. franchise = add a brand-consistency question
9. independent = add an owner-personality / neighborhood-fit question

Return JSON only. No prose.`;

function buildPrompt(body: {
  industryCategoryId: string;
  selectedIndustryId?: string;
  startupType?: string;
  storeName?: string;
  language?: string;
}): string {
  const ko = body.language !== "en";

  const ctx = ko
    ? `[매장 정보]
- 카테고리: ${body.industryCategoryId}
${body.selectedIndustryId ? `- 세부 업종: ${body.selectedIndustryId}` : ""}
${body.startupType ? `- 운영 형태: ${body.startupType === "franchise" ? "프랜차이즈" : body.startupType === "independent" ? "개인 운영" : "미정"}` : ""}
${body.storeName ? `- 매장명: ${body.storeName}` : ""}`
    : `[Store info]
- Category: ${body.industryCategoryId}
${body.selectedIndustryId ? `- Sub-industry: ${body.selectedIndustryId}` : ""}
${body.startupType ? `- Type: ${body.startupType}` : ""}
${body.storeName ? `- Store name: ${body.storeName}` : ""}`;

  const formatNote = ko
    ? `

[응답 JSON 스키마]
{
  "intro": "응답자에게 보일 1–2줄 인사말 (익명 보장 강조)",
  "questions": [
    {
      "id": "q1",
      "type": "rating" | "multiple_choice" | "short_answer" | "yes_no",
      "question": "질문 본문",
      "description": "(선택) 부가 안내 한 줄",
      "options": ["옵션1", "옵션2", ...],   // multiple_choice 일 때
      "scale": 5,                            // rating 일 때 (5점 기본)
      "required": true
    }
  ],
  "tips": [
    "운영자에게 줄 활용 팁 3-5개"
  ],
  "paperText": "종이 카드용 한 페이지 plain text. 구글 폼/네이버 폼에 그대로 붙여넣어도 작동하는 단순 형식. 줄바꿈 \\n 사용."
}

JSON 외 다른 설명 없이 JSON 만 반환하세요. ${body.selectedIndustryId ? `세부 업종 ${body.selectedIndustryId} 특화 질문 1-2개 반드시 포함.` : ""}`
    : `

[Response JSON schema]
{
  "intro": "...",
  "questions": [{ "id": "q1", "type": "...", "question": "...", "options": [...], "scale": 5, "required": true }],
  "tips": ["..."],
  "paperText": "Single-page paper version, plain text, line-broken with \\n."
}

Return JSON only. ${body.selectedIndustryId ? `Include 1-2 questions specific to sub-industry ${body.selectedIndustryId}.` : ""}`;

  return ctx + formatNote;
}

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 일일 한도: 사용자당 5건 / 24h (피드백 폼은 한 번 만들면 재사용)
  const rateLimit = await checkSimpleRateLimit({
    key: `agent-feedback-form:${auth.userId}`,
    limit: 5,
    windowMs: 86_400_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "agents-feedback-form",
    limit: 20,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  let body: {
    industryCategoryId?: string;
    selectedIndustryId?: string;
    startupType?: string;
    storeName?: string;
    language?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.industryCategoryId) {
    return NextResponse.json({ error: "industryCategoryId required" }, { status: 400 });
  }

  try {
    const client = createAiClient(apiKey);
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: `${SYSTEM_PROMPT}\n\n---\n\n${SYSTEM_PROMPT_EN}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: buildPrompt({
            industryCategoryId: body.industryCategoryId,
            selectedIndustryId: body.selectedIndustryId,
            startupType: body.startupType,
            storeName: body.storeName,
            language: body.language,
          }),
        },
      ],
    });

    const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI response malformed" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      intro: typeof parsed.intro === "string" ? parsed.intro : "",
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      paperText: typeof parsed.paperText === "string" ? parsed.paperText : "",
      cache: {
        created: res.usage?.cache_creation_input_tokens ?? 0,
        read: res.usage?.cache_read_input_tokens ?? 0,
      },
    });
  } catch (err) {
    console.error("[Agent feedback-form error]", err);
    return NextResponse.json({ error: "Failed to generate feedback form" }, { status: 500 });
  }
}
