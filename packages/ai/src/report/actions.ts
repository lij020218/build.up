import { createAiClient } from "../utils/client";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { parseLlmJson } from "../utils/parse-json";
import { REPORT_INSIGHT_SYSTEM_PROMPT, buildReportInsightPrompt } from "./prompt";
import type { ReportInsightInput } from "./prompt";

const DEFAULT_MODEL = "gpt-5.4-mini";   // 실제 실행 모델 (2026-08-03 이름 정직화 — 종전 claude-* 표기는 MODEL_MAP 거쳐 동일 모델)
const DEFAULT_MAX_TOKENS = 300;

function parseInsight(raw: string): string {
  let parsed: unknown;
  try {
    parsed = parseLlmJson(raw); // 2026-08-19 robust 4단계 파서
  } catch {
    throw new AiParseError("보고서 인사이트 응답이 유효한 JSON이 아닙니다.", raw);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new AiParseError("보고서 인사이트 응답이 객체 형태가 아닙니다.", raw);
  }

  const obj = parsed as Record<string, unknown>;
  const insight = typeof obj.insight === "string" ? obj.insight.trim() : "";

  if (insight.length < 20) {
    throw new AiParseError("인사이트 텍스트가 너무 짧습니다.", raw);
  }

  return insight.slice(0, 500);
}

export async function generateReportInsight(
  input: ReportInsightInput,
  options: AiCallOptions
): Promise<string> {
  const client = createAiClient(options.apiKey);

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: systemWithCache(REPORT_INSIGHT_SYSTEM_PROMPT),
    messages: [
      { role: "user", content: buildReportInsightPrompt(input) },
    ],
  });

  const content = response.content.find((c) => c.type === "text") ?? response.content[0];
  if (!content || content.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.content));
  }

  return parseInsight(content.text);
}
