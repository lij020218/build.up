import { NextResponse } from "next/server";
import { createAiClient } from "@foundone/ai/utils/client";
import { getAnthropicApiKey } from "../../../_lib/env";
import { parseLlmJson } from "@foundone/ai/utils/parse-json";
import { runAiFeature } from "../../../_lib/ai-guard";

/**
 * Content Agent — 인스타/SNS 포스트 초안 생성.
 *
 * 입력:
 * - industryCategoryId
 * - occasion: "sales-record" | "weekend-boost" | "anniversary" | "new-item" 등
 * - storeName (선택)
 * - contextData: { salesAmount?, growthPct?, itemName? } 트리거 당시 수치
 *
 * 출력: { postDraftKo, postDraftEn, hashtags }
 */

const SYSTEM_PROMPT = `You write short Instagram captions for Korean small businesses.
Write both Korean and English versions.

Korean tone:
- 친근하고 진솔 (과하지 않음)
- 3-5줄, 이모지 2-4개 적절히
- 공감 중심 ("오늘도 영업합니다" 같은 감성)
- 해시태그는 post 하단에 배치

English tone:
- Warm, sincere, concise
- 3-4 lines with 2-3 emojis
- Hashtags at end

Avoid:
- Overselling or exaggerated claims
- Generic phrases ("check us out", "amazing")
- More than 5 hashtags per language

Output JSON only:
{
  "postDraftKo": "...",
  "postDraftEn": "...",
  "hashtags": ["#1", "#2", "#3", "#4"]
}`;

const OCCASION_CONTEXT: Record<string, string> = {
  "sales-record": "일매출 신기록 달성 — 감사 + 단골 감성",
  "weekend-boost": "지난 주말 호황 감사 — 다음 주말 암시",
  "anniversary": "오픈 N주년 — 감사 + 초심",
  "new-item": "신메뉴/신상품 — 소개 + 호기심 유발",
  "default": "평범한 영업일 — 가벼운 인사",
};

function buildPrompt(body: {
  industryCategoryId: string;
  occasion: string;
  storeName?: string;
  contextData?: Record<string, unknown>;
}): string {
  const occasionDesc = OCCASION_CONTEXT[body.occasion] ?? OCCASION_CONTEXT.default;

  const contextLine = body.contextData
    ? Object.entries(body.contextData)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")
    : "";

  return `[업종] ${body.industryCategoryId}
[상황] ${body.occasion} (${occasionDesc})
[매장명] ${body.storeName ?? "(미제공, 생략 가능)"}
${contextLine ? `[데이터]\n${contextLine}` : ""}

위 상황에 어울리는 인스타 포스트를 한/영 각각 작성하세요. JSON만 반환.`;
}

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  // 입력 검증은 게이트(차감) 전에 — 잘못된 입력은 절대 차감하지 않는다.
  let body: {
    industryCategoryId?: string;
    occasion?: string;
    storeName?: string;
    contextData?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.industryCategoryId || !body.occasion) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const input = {
    industryCategoryId: body.industryCategoryId,
    occasion: body.occasion,
    storeName: body.storeName,
    contextData: body.contextData,
  };

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  // 2026-08-19 ai-guard: 분·일·주·월 한도 + 실패 시 자동 환불(파싱 실패는 1회 재시도 후 503)
  return runAiFeature({ request, feature: "agents-content-draft" }, async () => {
    const client = createAiClient(apiKey);
    const res = await client.messages.create({
      model: "gpt-5.6-luna", // 2026-07-27 luna — 짧은 초안 생성
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // 90% 입력 토큰 절감
        },
      ],
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    const text = res.content.find((c) => c.type === "text")?.text ?? "";
    // 실패 시 throw → 게이트가 1회 재시도 후 환불 + 503
    const parsed = parseLlmJson<{
      postDraftKo?: string;
      postDraftEn?: string;
      hashtags?: string[];
    }>(text);

    return NextResponse.json({
      postDraftKo: parsed.postDraftKo?.trim() ?? "",
      postDraftEn: parsed.postDraftEn?.trim() ?? "",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 6) : [],
      cache: {
        created: res.usage?.cache_creation_input_tokens ?? 0,
        read: res.usage?.cache_read_input_tokens ?? 0,
      },
    });
  });
}
