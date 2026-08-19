import type { ResponseSchema } from "@foundone/ai/utils/structured-output";

/** Structured Outputs 스키마 — coupon-copy 응답 { copyKo, copyEn } */
export const COUPON_COPY_RESPONSE_SCHEMA: ResponseSchema = {
  name: "coupon_copy",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["copyKo", "copyEn"],
    properties: {
      copyKo: { type: "string" },
      copyEn: { type: "string" },
    },
  },
};
