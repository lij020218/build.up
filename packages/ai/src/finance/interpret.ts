import { createAiClient } from "../utils/client";
import type { FinancialSimulationResult } from "@foundone/shared";
import { AiParseError } from "../types/ai";
import type { AiStructuredResponse, AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { FINANCE_SYSTEM_PROMPT, buildFinanceUserPrompt } from "./prompt";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1024;

// ─── 응답 파싱 & 검증 ─────────────────────────────────────────────────────────

function parseAiResponse(raw: string): AiStructuredResponse {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // JSON 부분만 추출 시도
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch {
        throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
      }
    } else {
      throw new AiParseError("AI 응답이 유효한 JSON이 아닙니다.", raw);
    }
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
    ]
  });

  const content = response.content.find((c) => c.type === "text") ?? response.content[0];
  if (!content || content.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.content));
  }

  return parseAiResponse(content.text);
}
