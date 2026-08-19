import { createAiClient } from "../utils/client";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { parseLlmJson } from "../utils/parse-json";
import type { ResponseSchema } from "../utils/structured-output";
import {
  HEALTH_DIAGNOSIS_SYSTEM_PROMPT,
  buildHealthDiagnosisUserPrompt,
} from "./prompt";
import type { HealthDiagnosisContext, HealthDiagnosisResult } from "./prompt";

/** Structured Outputs 스키마 — HealthDiagnosisResult 1:1 */
export const HEALTH_DIAGNOSIS_RESPONSE_SCHEMA: ResponseSchema = {
  name: "health_diagnosis",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["headline", "statusSummary", "actions", "encouragement"],
    properties: {
      headline: { type: "string" },
      statusSummary: { type: "string" },
      actions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "reason", "difficulty"],
          properties: {
            title: { type: "string" },
            reason: { type: "string" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          },
        },
      },
      encouragement: { type: "string" },
    },
  },
};

const DEFAULT_MODEL = "gpt-5.4-mini";   // 실제 실행 모델 (2026-08-03 이름 정직화 — 종전 claude-* 표기는 MODEL_MAP 거쳐 동일 모델)
const DEFAULT_MAX_TOKENS = 800;

// ─── 응답 파싱 ──────────────────────────────────────────────────────────────

function parseDiagnosisResponse(raw: string): HealthDiagnosisResult {
  let parsed: unknown;
  try {
    parsed = parseLlmJson(raw); // robust 4단계 파서 — Structured Outputs 의 안전망
  } catch {
    throw new AiParseError("경영 진단 응답이 유효한 JSON이 아닙니다.", raw);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AiParseError("경영 진단 응답이 객체 형태가 아닙니다.", raw);
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.headline !== "string") {
    throw new AiParseError("headline 필드가 없습니다.", raw);
  }

  const actions = Array.isArray(obj.actions)
    ? (obj.actions as Record<string, unknown>[]).slice(0, 3).map((a) => ({
        title: String(a.title ?? ""),
        reason: String(a.reason ?? ""),
        difficulty: (["easy", "medium", "hard"].includes(String(a.difficulty))
          ? a.difficulty
          : "medium") as "easy" | "medium" | "hard",
      }))
    : [];

  return {
    headline: String(obj.headline),
    statusSummary: String(obj.statusSummary ?? ""),
    actions,
    encouragement: String(obj.encouragement ?? ""),
  };
}

// ─── 메인 함수 ──────────────────────────────────────────────────────────────

export async function diagnoseBusinessHealth(
  context: HealthDiagnosisContext,
  options: AiCallOptions
): Promise<HealthDiagnosisResult> {
  const client = createAiClient(options.apiKey);
  const userMessage = buildHealthDiagnosisUserPrompt(context);

  const rawMessage = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    // ⚠️ 2026-05-18: `thinking` 파라미터는 OpenAI 마이그레이션 후 미지원 (silent drop).
    //   종전엔 budget_tokens 2048 로 reasoning 토큰 확보를 의도했으나 실제 효과 0.
    //   대신 max_tokens 를 1600 추가해 명시적 추론 분량 확보. 정확한 reasoning 강화는
    //   향후 OpenAI o1-mini / o3-mini 분기 도입 시 재검토.
    max_tokens: (options.maxTokens ?? DEFAULT_MAX_TOKENS) + 1600,
    // ✦ Prompt Caching — 같은 사용자가 시간차 진단 시 절감
    system: systemWithCache(HEALTH_DIAGNOSIS_SYSTEM_PROMPT),
    messages: [{ role: "user", content: userMessage }],
    response_schema: HEALTH_DIAGNOSIS_RESPONSE_SCHEMA,
  });
  const message = rawMessage as { content: Array<{ type: "text"; text: string }>; stop_reason: string | null; usage: { input_tokens: number; output_tokens: number } };

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트 블록이 없습니다.", JSON.stringify(message.content));
  }

  return parseDiagnosisResponse(textBlock.text);
}
