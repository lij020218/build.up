import { createAiClient } from "../utils/client";
import type { FinancialSimulationResult } from "@foundone/shared";
import { AiParseError } from "../types/ai";
import type { AiStructuredResponse, AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { FINANCE_SYSTEM_PROMPT, buildFinanceUserPrompt } from "./prompt";
import { parseLlmJson } from "../utils/parse-json";
import type { ResponseSchema } from "../utils/structured-output";

/** Structured Outputs 스키마 — AiStructuredResponse(4칸) 1:1 */
export const FINANCE_INTERPRET_RESPONSE_SCHEMA: ResponseSchema = {
  name: "finance_interpretation",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "rationale", "warnings", "nextActions"],
    properties: {
      summary: { type: "string" },
      rationale: { type: "array", items: { type: "string" } },
      warnings: { type: "array", items: { type: "string" } },
      nextActions: { type: "array", items: { type: "string" } },
    },
  },
};

// ─── 상수 ────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "gpt-5.4-mini";   // 실제 실행 모델 (2026-08-03 이름 정직화 — 종전 claude-* 표기는 MODEL_MAP 거쳐 동일 모델)
const DEFAULT_MAX_TOKENS = 1024;

// ─── 응답 파싱 & 검증 ─────────────────────────────────────────────────────────

function parseAiResponse(raw: string): AiStructuredResponse {
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

  if (typeof obj.summary !== "string" || obj.summary.trim() === "") {
    throw new AiParseError("summary 필드가 없거나 비어있습니다.", raw);
  }

  if (!Array.isArray(obj.rationale) || !obj.rationale.every((v) => typeof v === "string")) {
    throw new AiParseError("rationale 필드가 string[] 형태가 아닙니다.", raw);
  }

  if (!Array.isArray(obj.warnings) || !obj.warnings.every((v) => typeof v === "string")) {
    throw new AiParseError("warnings 필드가 string[] 형태가 아닙니다.", raw);
  }

  if (!Array.isArray(obj.nextActions) || !obj.nextActions.every((v) => typeof v === "string")) {
    throw new AiParseError("nextActions 필드가 string[] 형태가 아닙니다.", raw);
  }

  return {
    summary: obj.summary.trim(),
    rationale: (obj.rationale as string[]).map((s) => s.trim()).filter(Boolean),
    warnings: (obj.warnings as string[]).map((s) => s.trim()).filter(Boolean),
    nextActions: (obj.nextActions as string[]).map((s) => s.trim()).filter(Boolean)
  };
}

// ─── 메인 함수 ────────────────────────────────────────────────────────────────

export async function interpretFinancialSimulation(
  result: FinancialSimulationResult,
  options: AiCallOptions & { categoryLabel?: string }
): Promise<AiStructuredResponse> {
  const client = createAiClient(options.apiKey);

  const userMessage = buildFinanceUserPrompt(result, options.categoryLabel);

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching — finance interpretation system prompt
    system: systemWithCache(FINANCE_SYSTEM_PROMPT),
    messages: [
      { role: "user", content: userMessage }
    ],
    response_schema: FINANCE_INTERPRET_RESPONSE_SCHEMA,
  });

  const content = response.content.find((c) => c.type === "text") ?? response.content[0];
  if (!content || content.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.content));
  }

  return parseAiResponse(content.text);
}
