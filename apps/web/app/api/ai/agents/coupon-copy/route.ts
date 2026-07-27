import { NextResponse } from "next/server";
import { createAiClient } from "@foundone/ai/utils/client";
import { getAnthropicApiKey } from "../../../_lib/env";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

/**
 * Coupon Agent — 쿠폰 카피 생성.
 *
 * 입력:
 * - industryCategoryId: 업종
 * - discountValue: 할인율 또는 금액
 * - discountType: "percent" | "amount"
 * - validDays: 유효기간
 * - couponCode: 코드
 * - triggerReason: 왜 쿠폰 발급 중인지 (매출 감소 등)
 *
 * 출력: { copyKo, copyEn }
 *
 * ⚠️ Prompt caching 최초 도입 (90% 입력 토큰 비용 절감).
 */

const SYSTEM_PROMPT_KO = `당신은 한국 자영업자를 돕는 마케팅 카피라이터입니다.
고객에게 직접 보낼 쿠폰 안내 메시지를 작성합니다.

원칙:
1. 친근하고 진솔한 톤 (과하지 않게)
2. 3-5줄 이내 짧게
3. 이모지 1-3개 적절히 사용
4. 쿠폰 코드, 할인, 유효기간을 명확히 표기
5. 마지막에 감사 인사 (부담 없이)

피해야 할 것:
- 과장된 표현 ("역대급", "최저가" 등)
- 지나친 이모지
- 불필요한 인사말 길이`;

const SYSTEM_PROMPT_EN = `You write short coupon messages for Korean small business customers.
Tone: friendly, sincere, concise.
Format: 3-5 lines with 1-3 emojis.
Include: coupon code, discount, validity.
Avoid: overselling, excessive emojis.`;

function buildPrompt(body: {
  industryCategoryId: string;
  discountValue: number;
  discountType: string;
  validDays: number;
  couponCode: string;
  triggerReason?: string;
  language?: string;
}): string {
  const discountLabel =
    body.discountType === "percent"
      ? `${body.discountValue}% 할인`
      : `${Math.round(body.discountValue / 1000)}천원 할인`;

  return `다음 조건으로 쿠폰 메시지를 한국어와 영어로 각각 작성해주세요.

[조건]
- 업종: ${body.industryCategoryId}
- 쿠폰 코드: ${body.couponCode}
- 혜택: ${discountLabel}
- 유효기간: ${body.validDays}일
${body.triggerReason ? `- 상황: ${body.triggerReason}` : ""}

[응답 형식 — JSON만]
{
  "copyKo": "한국어 메시지 전문 (줄바꿈 포함)",
  "copyEn": "영어 메시지 전문 (줄바꿈 포함)"
}

다른 설명 없이 JSON만 반환하세요.`;
}

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 일일 한도 (MVP: 전체 10건/일, Phase 2에서 플랜별 차등)
  const rateLimit = await checkSimpleRateLimit({
    key: `agent-coupon:${auth.userId}`,
    limit: 10,
    windowMs: 86_400_000, // 24h
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "agents-coupon-copy",
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
    discountValue?: number;
    discountType?: string;
    validDays?: number;
    couponCode?: string;
    triggerReason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.industryCategoryId || !body.couponCode || typeof body.discountValue !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const client = createAiClient(apiKey);
    const res = await client.messages.create({
      model: "gpt-5.6-luna", // 2026-07-27 luna — 쿠폰 문구
      max_tokens: 500,
      system: [
        // cache_control로 90% 입력 토큰 비용 절감 (2h TTL)
        {
          type: "text",
          text: `${SYSTEM_PROMPT_KO}\n\n---\n\n${SYSTEM_PROMPT_EN}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: buildPrompt({
            industryCategoryId: body.industryCategoryId,
            discountValue: body.discountValue,
            discountType: body.discountType ?? "percent",
            validDays: body.validDays ?? 7,
            couponCode: body.couponCode,
            triggerReason: body.triggerReason,
          }),
        },
      ],
    });

    const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI response malformed" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { copyKo?: string; copyEn?: string };
    return NextResponse.json({
      copyKo: parsed.copyKo?.trim() ?? "",
      copyEn: parsed.copyEn?.trim() ?? "",
      // 캐시 통계 (로깅용)
      cache: {
        created: res.usage?.cache_creation_input_tokens ?? 0,
        read: res.usage?.cache_read_input_tokens ?? 0,
      },
    });
  } catch (err) {
    console.error("[Agent coupon-copy error]", err);
    return NextResponse.json({ error: "Failed to generate copy" }, { status: 500 });
  }
}
