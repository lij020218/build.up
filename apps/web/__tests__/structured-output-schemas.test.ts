/**
 * Structured Outputs 스키마 가드 (2026-08-19)
 *  모든 export 된 response_schema 가 OpenAI strict 모드 구조 규칙을 만족하는지 재귀 검증:
 *   · 모든 object 레벨에 additionalProperties:false
 *   · required == properties 키 집합 (선택 필드는 null 유니온으로)
 *   · 루트 object, 지원 타입만, allOf/not/if 등 금지
 *  스키마를 고치다 strict 를 깨면 런타임 400 대신 여기서 잡힌다.
 */
import { describe, it, expect } from "vitest";
import {
  validateStrictJsonSchema,
  assertStrictJsonSchema,
  isSchemaRejectedError,
  LlmRefusalError,
  jsonSchemaResponseFormat,
  type ResponseSchema,
} from "@foundone/ai/utils/structured-output";
import { isTransientLlmError } from "@foundone/ai/utils/client";

// packages/ai
import { QUICK_QUERY_RESPONSE_SCHEMA } from "@foundone/ai/quick-query/ask";
import { INDUSTRY_CLASSIFY_RESPONSE_SCHEMA } from "@foundone/ai/roadmap/classify";
import { STAGE_BRIEF_RESPONSE_SCHEMA } from "@foundone/ai/stage/brief";
import { REPORT_INSIGHT_RESPONSE_SCHEMA } from "@foundone/ai/report/actions";
import { PROGRAM_MATCHING_RESPONSE_SCHEMA } from "@foundone/ai/programs/match";
import { HEALTH_DIAGNOSIS_RESPONSE_SCHEMA } from "@foundone/ai/health/diagnose";
import { FINANCE_INTERPRET_RESPONSE_SCHEMA } from "@foundone/ai/finance/interpret";
import { INTERVIEW_SCRIPT_RESPONSE_SCHEMA } from "@foundone/ai/interview/generate";
import { INTERVIEW_ANALYSIS_RESPONSE_SCHEMA } from "@foundone/ai/interview/analyze";
import { DASHBOARD_ACTIONS_RESPONSE_SCHEMA } from "@foundone/ai/dashboard/actions";
import { GUIDE_QA_RESPONSE_SCHEMA } from "@foundone/ai/guide/interpret";
// apps/web 라우트 (route.ts 옆 schema.ts)
import { CONTENT_DRAFT_RESPONSE_SCHEMA } from "../app/api/ai/agents/content-draft/schema";
import { COUPON_COPY_RESPONSE_SCHEMA } from "../app/api/ai/agents/coupon-copy/schema";
import { FEEDBACK_FORM_RESPONSE_SCHEMA, stripNullFields } from "../app/api/ai/agents/feedback-form/schema";
import { MEMBERS_PARSE_RESPONSE_SCHEMA } from "../app/api/ai/members/parse/schema";
import { PRODUCTS_PARSE_RESPONSE_SCHEMA } from "../app/api/ai/products/parse/schema";
import { FUNDING_SCORE_RESPONSE_SCHEMA } from "../app/api/ai/funding/score/schema";
import { CARDNEWS_RESPONSE_SCHEMA } from "../app/api/ai/marketing/cardnews/schema";

const ALL_SCHEMAS: ResponseSchema[] = [
  QUICK_QUERY_RESPONSE_SCHEMA,
  INDUSTRY_CLASSIFY_RESPONSE_SCHEMA,
  STAGE_BRIEF_RESPONSE_SCHEMA,
  REPORT_INSIGHT_RESPONSE_SCHEMA,
  PROGRAM_MATCHING_RESPONSE_SCHEMA,
  HEALTH_DIAGNOSIS_RESPONSE_SCHEMA,
  FINANCE_INTERPRET_RESPONSE_SCHEMA,
  INTERVIEW_SCRIPT_RESPONSE_SCHEMA,
  INTERVIEW_ANALYSIS_RESPONSE_SCHEMA,
  DASHBOARD_ACTIONS_RESPONSE_SCHEMA,
  GUIDE_QA_RESPONSE_SCHEMA,
  CONTENT_DRAFT_RESPONSE_SCHEMA,
  COUPON_COPY_RESPONSE_SCHEMA,
  FEEDBACK_FORM_RESPONSE_SCHEMA,
  MEMBERS_PARSE_RESPONSE_SCHEMA,
  PRODUCTS_PARSE_RESPONSE_SCHEMA,
  FUNDING_SCORE_RESPONSE_SCHEMA,
  CARDNEWS_RESPONSE_SCHEMA,
];

describe("Structured Outputs — 모든 response_schema 는 strict 호환", () => {
  it.each(ALL_SCHEMAS.map((s) => [s.name, s] as const))("%s", (_name, rs) => {
    expect(validateStrictJsonSchema(rs.schema)).toEqual([]);
    expect(() => assertStrictJsonSchema(rs)).not.toThrow();
  });

  it("스키마 name 은 고유", () => {
    const names = ALL_SCHEMAS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("response_format 생성 — strict 기본 true, 오버라이드 가능", () => {
    const rf = jsonSchemaResponseFormat(COUPON_COPY_RESPONSE_SCHEMA);
    expect(rf).toEqual({ type: "json_schema", json_schema: { name: "coupon_copy", strict: true, schema: COUPON_COPY_RESPONSE_SCHEMA.schema } });
    expect(jsonSchemaResponseFormat(COUPON_COPY_RESPONSE_SCHEMA, false).json_schema.strict).toBe(false);
  });
});

describe("validateStrictJsonSchema — 위반 감지", () => {
  it("additionalProperties 누락", () => {
    const errs = validateStrictJsonSchema({ type: "object", required: ["a"], properties: { a: { type: "string" } } });
    expect(errs.join("\n")).toMatch(/additionalProperties/);
  });
  it("required ≠ keys (누락·초과 모두)", () => {
    const missing = validateStrictJsonSchema({ type: "object", additionalProperties: false, required: [], properties: { a: { type: "string" } } });
    expect(missing.join("\n")).toMatch(/required is missing/);
    const extra = validateStrictJsonSchema({ type: "object", additionalProperties: false, required: ["a", "b"], properties: { a: { type: "string" } } });
    expect(extra.join("\n")).toMatch(/unknown/);
  });
  it("중첩 object 도 검사 (array items 안)", () => {
    const errs = validateStrictJsonSchema({
      type: "object", additionalProperties: false, required: ["xs"],
      properties: { xs: { type: "array", items: { type: "object", properties: { k: { type: "string" } }, required: ["k"] } } },
    });
    expect(errs.join("\n")).toMatch(/\$\.xs\[\]: additionalProperties/);
  });
  it("루트 배열·미지원 키워드·미지원 타입", () => {
    expect(validateStrictJsonSchema({ type: "array", items: { type: "string" } }).join("\n")).toMatch(/root must be/);
    expect(validateStrictJsonSchema({ type: "object", additionalProperties: false, required: [], properties: {}, allOf: [] }).join("\n")).toMatch(/allOf/);
    expect(validateStrictJsonSchema({ type: "object", additionalProperties: false, required: ["d"], properties: { d: { type: "date" } } }).join("\n")).toMatch(/unsupported type/);
  });
  it("nullable 유니온은 통과", () => {
    expect(validateStrictJsonSchema({
      type: "object", additionalProperties: false, required: ["a", "o"],
      properties: { a: { type: ["string", "null"] }, o: { type: ["object", "null"], additionalProperties: false, required: ["id"], properties: { id: { type: "string" } } } },
    })).toEqual([]);
  });
});

describe("LlmClient 연동 — 오류 분류", () => {
  it("스키마 거부 400 만 strict:false 재시도 대상", () => {
    expect(isSchemaRejectedError({ status: 400, message: "Invalid schema for response_format 'x': ..." })).toBe(true);
    expect(isSchemaRejectedError({ status: 400, message: "Unsupported parameter: temperature" })).toBe(false);
    expect(isSchemaRejectedError({ status: 500, message: "schema" })).toBe(false);
  });
  it("refusal 은 비일시 오류 (폴백·재시도 금지)", () => {
    const e = new LlmRefusalError("gpt-5.4-mini", "I can't help with that.");
    expect(e.transient).toBe(false);
    expect(isTransientLlmError(e)).toBe(false);
    expect(e.message).toMatch(/refused/);
  });
  it("stripNullFields — strict null 선택 필드 제거 (feedback-form 출력 호환)", () => {
    expect(stripNullFields({ id: "q1", description: null, scale: 5, options: null })).toEqual({ id: "q1", scale: 5 });
  });
});
