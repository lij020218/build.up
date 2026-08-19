import type { ResponseSchema } from "@foundone/ai/utils/structured-output";

/** Structured Outputs 스키마 — FundingScore 중 LLM 산출 필드 (framework/passingScore 는 서버가 rubric 에서 채움) */
export const FUNDING_SCORE_RESPONSE_SCHEMA: ResponseSchema = {
  name: "funding_score",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["score", "level", "headline", "breakdown", "strengths", "weaknesses", "improvements", "verdict", "bonusEligible", "disqualified"],
    properties: {
      score: { type: "integer" },
      level: { type: "string", enum: ["high", "medium", "low"] },
      headline: { type: "string" },
      breakdown: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["item", "weight", "itemScore", "reason"],
          properties: {
            item: { type: "string" },
            weight: { type: "integer" },
            itemScore: { type: "integer" },
            reason: { type: "string" },
          },
        },
      },
      strengths: { type: "array", items: { type: "string" } },
      weaknesses: { type: "array", items: { type: "string" } },
      improvements: { type: "array", items: { type: "string" } },
      verdict: { type: "string" },
      bonusEligible: { type: "array", items: { type: "string" } },
      disqualified: { type: "array", items: { type: "string" } },
    },
  },
};
