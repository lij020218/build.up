import Anthropic from "@anthropic-ai/sdk";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { QUICK_QUERY_SYSTEM_PROMPT, buildQuickQueryUserPrompt } from "./prompt";
import type { QuickQueryContext, QuickQueryResult } from "./prompt";

const DEFAULT_MODEL = "claude-sonnet-4-6";
// 컨텍스트가 풍부해진 만큼 답변에도 약간 여유 (2~4 문장 + nextAction + referencedCase)
const DEFAULT_MAX_TOKENS = 768;

function parseResponse(raw: string): QuickQueryResult {
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);

  try {
    const obj = JSON.parse(cleaned) as Record<string, unknown>;
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
  const client = new Anthropic({ apiKey: options.apiKey, timeout: 20_000 });

  const response = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Caching — system prompt 안정 재사용 (사장님 한 번에 여러 질문 가능)
    system: systemWithCache(QUICK_QUERY_SYSTEM_PROMPT),
    messages: [{ role: "user", content: buildQuickQueryUserPrompt(ctx) }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트가 없습니다.", JSON.stringify(response.content));
  }
  return parseResponse(textBlock.text);
}
