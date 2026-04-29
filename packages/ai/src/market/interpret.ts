import Anthropic from "@anthropic-ai/sdk";
import type { RecommendationItem } from "@build-up/shared";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { MARKET_NARRATIVE_SYSTEM_PROMPT, buildMarketNarrativeUserPrompt } from "./prompt";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 300;

export async function interpretMarketScore(
  item: RecommendationItem,
  params: { categoryId?: string; startupType?: string },
  options: AiCallOptions
): Promise<string> {
  const client = new Anthropic({ apiKey: options.apiKey, timeout: 30_000 });
  const userPrompt = buildMarketNarrativeUserPrompt(item, params);

  const message = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching — market narrative system prompt
    system: systemWithCache(MARKET_NARRATIVE_SYSTEM_PROMPT),
    messages: [{ role: "user", content: userPrompt }]
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트 블록이 없습니다.", JSON.stringify(message.content));
  }

  const narrative = textBlock.text.trim();
  if (!narrative) {
    throw new AiParseError("AI 응답이 비어있습니다.", textBlock.text);
  }

  return narrative;
}
