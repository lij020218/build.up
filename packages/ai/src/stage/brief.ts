import { createAiClient } from "../utils/client";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { parseLlmJson } from "../utils/parse-json";
import {
  STAGE_BRIEF_SYSTEM_PROMPT,
  buildStageBriefUserPrompt,
  type StageBriefParams,
  type StageBriefResult
} from "./prompt";
import type { ResponseSchema } from "../utils/structured-output";

/** Structured Outputs 스키마 — StageBriefResult 1:1 */
export const STAGE_BRIEF_RESPONSE_SCHEMA: ResponseSchema = {
  name: "stage_brief",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["headline", "context", "actions", "commonMistakes", "readyWhen"],
    properties: {
      headline: { type: "string" },
      context: { type: "string" },
      actions: { type: "array", items: { type: "string" } },
      commonMistakes: { type: "array", items: { type: "string" } },
      readyWhen: { type: "string" },
    },
  },
};

const DEFAULT_MODEL = "gpt-5.4-mini";   // 실제 실행 모델 (2026-08-03 이름 정직화 — 종전 claude-* 표기는 MODEL_MAP 거쳐 동일 모델)
const DEFAULT_MAX_TOKENS = 600;

function parseStageBriefResponse(raw: string): StageBriefResult {
  let parsed: unknown;
  try {
    parsed = parseLlmJson(raw); // 2026-08-19 robust 4단계 파서
  } catch {
    throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AiParseError("AI 응답이 객체 형태가 아닙니다.", raw);
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.headline !== "string" || !obj.headline.trim()) {
    throw new AiParseError("headline 필드가 없거나 비어있습니다.", raw);
  }

  if (typeof obj.context !== "string" || !obj.context.trim()) {
    throw new AiParseError("context 필드가 없거나 비어있습니다.", raw);
  }

  if (!Array.isArray(obj.actions) || !obj.actions.every((v) => typeof v === "string")) {
    throw new AiParseError("actions 필드가 string[] 형태가 아닙니다.", raw);
  }

  if (
    !Array.isArray(obj.commonMistakes) ||
    !obj.commonMistakes.every((v) => typeof v === "string")
  ) {
    throw new AiParseError("commonMistakes 필드가 string[] 형태가 아닙니다.", raw);
  }

  if (typeof obj.readyWhen !== "string" || !obj.readyWhen.trim()) {
    throw new AiParseError("readyWhen 필드가 없거나 비어있습니다.", raw);
  }

  return {
    headline: obj.headline.trim(),
    context: obj.context.trim(),
    actions: (obj.actions as string[]).map((s) => s.trim()).filter(Boolean),
    commonMistakes: (obj.commonMistakes as string[]).map((s) => s.trim()).filter(Boolean),
    readyWhen: obj.readyWhen.trim()
  };
}

export async function generateStageBrief(
  params: StageBriefParams,
  options: AiCallOptions
): Promise<StageBriefResult> {
  const client = createAiClient(options.apiKey);
  const userPrompt = buildStageBriefUserPrompt(params);

  const message = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching — stage brief system prompt 안정 재사용
    system: systemWithCache(STAGE_BRIEF_SYSTEM_PROMPT),
    messages: [{ role: "user", content: userPrompt }],
    response_schema: STAGE_BRIEF_RESPONSE_SCHEMA,
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트 블록이 없습니다.", JSON.stringify(message.content));
  }

  return parseStageBriefResponse(textBlock.text);
}
