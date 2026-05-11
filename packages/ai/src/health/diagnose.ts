import { createAiClient } from "../utils/client";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import {
  HEALTH_DIAGNOSIS_SYSTEM_PROMPT,
  buildHealthDiagnosisUserPrompt,
} from "./prompt";
import type { HealthDiagnosisContext, HealthDiagnosisResult } from "./prompt";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 800;

// ─── 응답 파싱 ──────────────────────────────────────────────────────────────

function parseDiagnosisResponse(raw: string): HealthDiagnosisResult {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
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
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching — 같은 사용자가 시간차 진단 시 절감
    system: systemWithCache(HEALTH_DIAGNOSIS_SYSTEM_PROMPT),
    // ✦ Adaptive Thinking — 다지표 종합 진단 (재무·운영·마케팅·리스크 교차 분석)
    thinking: { type: "enabled", budget_tokens: 2048 },
    messages: [{ role: "user", content: userMessage }],
  } as Parameters<typeof client.messages.create>[0]);
  const message = rawMessage as { content: Array<{ type: "text"; text: string }>; stop_reason: string | null; usage: { input_tokens: number; output_tokens: number } };

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트 블록이 없습니다.", JSON.stringify(message.content));
  }

  return parseDiagnosisResponse(textBlock.text);
}
