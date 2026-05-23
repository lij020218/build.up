/**
 * AI 응답 raw text 확인 — text block 첫 600자 + 마지막 200자.
 */
import { createAiClient, systemWithCache } from "../packages/ai/src/utils/client";
import { ROADMAP_GENERATION_SYSTEM_PROMPT, buildRoadmapGenerationPrompt } from "../packages/ai/src/roadmap/prompt";

const apiKey = process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY!;
const client = createAiClient(apiKey);

const ROADMAP_TOOL = {
  name: "submit_roadmap",
  description: "사용자 사업 아이디어를 분석한 결과를 구조화된 로드맵으로 제출합니다.",
  input_schema: { type: "object", properties: { parsed: { type: "object" } } },
};

const r = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 8192,
  system: systemWithCache(ROADMAP_GENERATION_SYSTEM_PROMPT, "1h") as never,
  tools: [ROADMAP_TOOL],
  messages: [{ role: "user", content: buildRoadmapGenerationPrompt({ ideaText: "강남에서 1인 한식집 창업.", language: "ko" }) }],
} as never);

const text = r.content.find(c => c.type === "text")?.text ?? "";
console.log("=== content types:", r.content.map(c => c.type).join(", "));
console.log("=== text length:", text.length);
console.log("=== first 800 chars ===\n" + text.slice(0, 800));
console.log("\n=== last 400 chars ===\n" + text.slice(-400));
