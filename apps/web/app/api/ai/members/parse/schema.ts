import type { ResponseSchema } from "@foundone/ai/utils/structured-output";

/** Structured Outputs 스키마 — 루트 배열은 strict 불가 → { members: [...] } 로 감싼다 (라우트 파서는 배열·객체 모두 관용) */
export const MEMBERS_PARSE_RESPONSE_SCHEMA: ResponseSchema = {
  name: "parsed_members",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["members"],
    properties: {
      members: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "plan", "fee", "startDate", "endDate"],
          properties: {
            name: { type: "string" },
            plan: { type: "string" },
            fee: { type: "number" },
            startDate: { type: "string" },
            endDate: { type: "string" },
          },
        },
      },
    },
  },
};
