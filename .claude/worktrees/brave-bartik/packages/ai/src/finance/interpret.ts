import OpenAI from "openai";
import type { FinancialSimulationResult } from "@build-up/shared";
import { AiParseError } from "../types/ai";
import type { AiStructuredResponse, AiCallOptions } from "../types/ai";
import { FINANCE_SYSTEM_PROMPT, buildFinanceUserPrompt } from "./prompt";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "gpt-5.4-mini";
const DEFAULT_MAX_TOKENS = 1024;

// ─── 응답 파싱 & 검증 ─────────────────────────────────────────────────────────
// Claude가 JSON 형식을 지키는지 검증합니다.
// Zod 없이 수동 검증 — 외부 의존성 최소화.

function parseAiResponse(raw: string): AiStructuredResponse {
  // 마크다운 코드블록 안에 JSON이 감싸진 경우 제거
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
// FinancialSimulationResult를 받아 AI 해석을 반환합니다.
//
// 설계 원칙:
// - API 키는 파라미터로 받아 함수가 순수하게 유지됩니다 (env 직접 읽지 않음).
// - 네트워크 오류는 그대로 throw합니다 (재시도 정책은 호출부에서 결정).
// - 파싱 실패 시 AiParseError를 throw합니다.

export async function interpretFinancialSimulation(
  result: FinancialSimulationResult,
  options: AiCallOptions & { categoryLabel?: string }
): Promise<AiStructuredResponse> {
  const client = new OpenAI({ apiKey: options.apiKey });

  const userMessage = buildFinanceUserPrompt(result, options.categoryLabel);

  const response = await client.chat.completions.create({
    model: options.model ?? DEFAULT_MODEL,
    max_completion_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: 1.0,
    messages: [
      { role: "system", content: FINANCE_SYSTEM_PROMPT },
      { role: "user", content: userMessage }
    ]
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.choices));
  }

  return parseAiResponse(text);
}
