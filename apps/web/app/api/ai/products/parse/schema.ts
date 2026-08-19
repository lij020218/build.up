import type { ResponseSchema } from "@foundone/ai/utils/structured-output";

/** Structured Outputs 스키마 — 루트 배열은 strict 불가 → { products: [...] } 로 감싼다 (라우트 파서는 배열·객체 모두 관용) */
export const PRODUCTS_PARSE_RESPONSE_SCHEMA: ResponseSchema = {
  name: "parsed_products",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["products"],
    properties: {
      products: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "category", "price", "cost", "stock", "unit"],
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            price: { type: "number" },
            cost: { type: "number" },
            stock: { type: "number" },
            unit: { type: "string" },
          },
        },
      },
    },
  },
};
