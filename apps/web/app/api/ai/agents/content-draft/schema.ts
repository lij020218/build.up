import type { ResponseSchema } from "@foundone/ai/utils/structured-output";

/** Structured Outputs 스키마 — content-draft 응답 { postDraftKo, postDraftEn, hashtags } */
export const CONTENT_DRAFT_RESPONSE_SCHEMA: ResponseSchema = {
  name: "content_draft",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["postDraftKo", "postDraftEn", "hashtags"],
    properties: {
      postDraftKo: { type: "string" },
      postDraftEn: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
    },
  },
};
