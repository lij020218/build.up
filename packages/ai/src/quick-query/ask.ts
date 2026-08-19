import { createAiClient } from "../utils/client";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { parseLlmJson } from "../utils/parse-json";
import { QUICK_QUERY_SYSTEM_PROMPT, buildQuickQueryUserPrompt } from "./prompt";
import type { QuickQueryContext, QuickQueryResult } from "./prompt";
import type { ResponseSchema } from "../utils/structured-output";

/** Structured Outputs 스키마 — QuickQueryResult 1:1 (선택 필드는 null 유니온) */
export const QUICK_QUERY_RESPONSE_SCHEMA: ResponseSchema = {
  name: "quick_query_result",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["answer", "nextAction", "confidence", "referencedCase"],
    properties: {
      answer: { type: "string" },
      nextAction: { type: ["string", "null"] },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      referencedCase: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["id", "name"],
        properties: { id: { type: "string" }, name: { type: "string" } },
      },
    },
  },
};

const DEFAULT_MODEL = "gpt-5.6-luna"; // 2026-07-27 luna 전환 — 인터랙티브 질의, effort none(중앙 가드)
// 컨텍스트가 풍부해진 만큼 답변에도 약간 여유 (2~4 문장 + nextAction + referencedCase)
const DEFAULT_MAX_TOKENS = 768;

function parseResponse(raw: string): QuickQueryResult {
  const cleaned = raw;
  try {
    // 2026-08-19 robust 파서(4단계: strict → loose → damage fix → truncated repair)
    const obj = parseLlmJson<Record<string, unknown>>(raw);
    // referencedCase: { id, name } 두 string 필드 모두 있을 때만 통과
    let referencedCase: { id: string; name: string } | undefined;
    const rc = obj.referencedCase;
    if (rc && typeof rc === "object") {
      const r = rc as Record<string, unknown>;
      if (typeof r.id === "string" && typeof r.name === "string" && r.id.trim() && r.name.trim()) {
        referencedCase = { id: r.id.trim(), name: r.name.trim() };
      }
    }
    return {
      answer: typeof obj.answer === "string" ? obj.answer.trim() : "",
      nextAction: typeof obj.nextAction === "string" ? obj.nextAction.trim() : undefined,
      confidence: (["high", "medium", "low"].includes(String(obj.confidence)) ? obj.confidence : "medium") as "high" | "medium" | "low",
      referencedCase,
    };
  } catch (err) {
    throw new AiParseError(
      `Quick query 응답 파싱 실패: ${err instanceof Error ? err.message : String(err)}`,
      cleaned,
    );
  }
}

export async function askQuickQuery(
  ctx: QuickQueryContext,
  options: AiCallOptions,
): Promise<QuickQueryResult> {
  const client = createAiClient(options.apiKey);

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Caching — system prompt 안정 재사용 (사장님 한 번에 여러 질문 가능)
    system: systemWithCache(QUICK_QUERY_SYSTEM_PROMPT),
    messages: [{ role: "user", content: buildQuickQueryUserPrompt(ctx) }],
    response_schema: QUICK_QUERY_RESPONSE_SCHEMA,
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.content));
  }
  return parseResponse(textBlock.text);
}
