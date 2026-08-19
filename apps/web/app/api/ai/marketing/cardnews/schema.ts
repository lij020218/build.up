import type { ResponseSchema } from "@foundone/ai/utils/structured-output";

/** Structured Outputs 스키마 — 카드뉴스 LLM 응답 { cards, caption, hashtags } (highlight/photoIdea 선택 → null 유니온, sanitize 가 무시) */
export const CARDNEWS_RESPONSE_SCHEMA: ResponseSchema = {
  name: "cardnews",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["cards", "caption", "hashtags"],
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["role", "title", "lines", "highlight", "photoIdea"],
          properties: {
            role: { type: "string", enum: ["cover", "body", "cta"] },
            title: { type: "string" },
            lines: { type: "array", items: { type: "string" } },
            highlight: { type: ["string", "null"] },
            photoIdea: { type: ["string", "null"] },
          },
        },
      },
      caption: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
    },
  },
};
