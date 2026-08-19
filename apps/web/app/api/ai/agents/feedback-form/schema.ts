import type { ResponseSchema } from "@foundone/ai/utils/structured-output";

/**
 * Structured Outputs 스키마 — feedback-form 응답.
 *  questions[].description/options/scale 는 선택 → null 유니온. 라우트가 null 을 제거해 종전 출력(필드 생략)과 동일하게 맞춘다.
 */
export const FEEDBACK_FORM_RESPONSE_SCHEMA: ResponseSchema = {
  name: "feedback_form",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["intro", "questions", "tips", "paperText"],
    properties: {
      intro: { type: "string" },
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "type", "question", "description", "options", "scale", "required"],
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["rating", "multiple_choice", "short_answer", "yes_no"] },
            question: { type: "string" },
            description: { type: ["string", "null"] },
            options: { type: ["array", "null"], items: { type: "string" } },
            scale: { type: ["integer", "null"] },
            required: { type: "boolean" },
          },
        },
      },
      tips: { type: "array", items: { type: "string" } },
      paperText: { type: "string" },
    },
  },
};

/** strict 스키마의 null 선택 필드를 제거 — 종전 "필드 생략" 출력과 동일 형태 유지 */
export function stripNullFields<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== null) out[k] = v;
  return out as T;
}
