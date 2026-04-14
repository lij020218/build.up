import Anthropic from "@anthropic-ai/sdk";
import {
  buildGuideContextBlock,
  type GuideContextBlock,
  type GuideRecordWithSources
} from "@build-up/shared";
import { AiParseError } from "../types/ai";
import type { AiCallOptions, GuideAiStructuredResponse } from "../types/ai";
import { GUIDE_QA_SYSTEM_PROMPT, buildGuideQaUserPrompt } from "./prompt";
import type { Language } from "@build-up/shared";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1200;

function parseGuideAiResponse(raw: string): GuideAiStructuredResponse {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AiParseError("AI 응답이 객체 형태가 아닙니다.", raw);
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.shortAnswer !== "string" || obj.shortAnswer.trim() === "") {
    throw new AiParseError("shortAnswer 필드가 없거나 비어있습니다.", raw);
  }

  if (typeof obj.explanation !== "string" || obj.explanation.trim() === "") {
    throw new AiParseError("explanation 필드가 없거나 비어있습니다.", raw);
  }

  if (!Array.isArray(obj.cautions) || !obj.cautions.every((v) => typeof v === "string")) {
    throw new AiParseError("cautions 필드가 string[] 형태가 아닙니다.", raw);
  }

  if (!Array.isArray(obj.nextActions) || !obj.nextActions.every((v) => typeof v === "string")) {
    throw new AiParseError("nextActions 필드가 string[] 형태가 아닙니다.", raw);
  }

  if (!["high", "medium", "check_needed"].includes(String(obj.confidence))) {
    throw new AiParseError("confidence 필드가 올바르지 않습니다.", raw);
  }

  return {
    shortAnswer: obj.shortAnswer.trim(),
    explanation: obj.explanation.trim(),
    cautions: (obj.cautions as string[]).map((item) => item.trim()).filter(Boolean),
    nextActions: (obj.nextActions as string[]).map((item) => item.trim()).filter(Boolean),
    confidence: obj.confidence as GuideAiStructuredResponse["confidence"]
  };
}

export async function interpretGuideQuestion(
  guide: GuideRecordWithSources,
  question: string,
  language: Language,
  options: AiCallOptions
): Promise<{ answer: GuideAiStructuredResponse; context: GuideContextBlock }> {
  const client = new Anthropic({ apiKey: options.apiKey, timeout: 30_000 });
  const context = buildGuideContextBlock(guide, language);
  const userPrompt = buildGuideQaUserPrompt(question, context, language);

  const message = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: GUIDE_QA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }]
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트 블록이 없습니다.", JSON.stringify(message.content));
  }

  return {
    answer: parseGuideAiResponse(textBlock.text),
    context
  };
}
