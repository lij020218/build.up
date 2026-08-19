import { createAiClient } from "../utils/client";
import {
  buildGuideContextBlock,
  type GuideContextBlock,
  type GuideRecordWithSources
} from "@foundone/shared";
import { AiParseError } from "../types/ai";
import type { AiCallOptions, GuideAiStructuredResponse } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { GUIDE_QA_SYSTEM_PROMPT, buildGuideQaUserPrompt } from "./prompt";
import type { Language } from "@foundone/shared";
import { parseLlmJson } from "../utils/parse-json";
import type { ResponseSchema } from "../utils/structured-output";

/** Structured Outputs 스키마 — GuideAiStructuredResponse 1:1 */
export const GUIDE_QA_RESPONSE_SCHEMA: ResponseSchema = {
  name: "guide_qa_answer",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["shortAnswer", "explanation", "cautions", "nextActions", "confidence"],
    properties: {
      shortAnswer: { type: "string" },
      explanation: { type: "string" },
      cautions: { type: "array", items: { type: "string" } },
      nextActions: { type: "array", items: { type: "string" } },
      confidence: { type: "string", enum: ["high", "medium", "check_needed"] },
    },
  },
};

const DEFAULT_MODEL = "gpt-5.4-mini";   // 실제 실행 모델 (2026-08-03 이름 정직화 — 종전 claude-* 표기는 MODEL_MAP 거쳐 동일 모델)
const DEFAULT_MAX_TOKENS = 1200;

function parseGuideAiResponse(raw: string): GuideAiStructuredResponse {
  let parsed: unknown;
  try {
    parsed = parseLlmJson(raw); // robust 4단계 파서 — Structured Outputs 의 안전망
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
  const client = createAiClient(options.apiKey);
  const context = buildGuideContextBlock(guide, language);
  const userPrompt = buildGuideQaUserPrompt(question, context, language);

  const message = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching — guide QA 같은 가이드 반복 질문 시 절감
    system: systemWithCache(GUIDE_QA_SYSTEM_PROMPT),
    messages: [{ role: "user", content: userPrompt }],
    response_schema: GUIDE_QA_RESPONSE_SCHEMA,
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
