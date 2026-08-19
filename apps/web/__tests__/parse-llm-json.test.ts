import { describe, it, expect } from "vitest";
import { parseLlmJson, repairTruncatedJson } from "@foundone/ai/utils/parse-json";

describe("parseLlmJson — robust 3-step", () => {
  it("코드펜스 + 산문", () => {
    expect(parseLlmJson('다음은 결과입니다:\n```json\n{"a":1}\n```\n감사합니다')).toEqual({ a: 1 });
  });
  it("후행 콤마·스마트 따옴표", () => {
    expect(parseLlmJson('{“a”: [1,2,],}')).toEqual({ a: [1, 2] });
  });
  it("문자열 내 개행", () => {
    expect(parseLlmJson('{"a": "줄1\n줄2"}')).toEqual({ a: "줄1\n줄2" });
  });
  it("max_tokens 로 잘린 JSON — 마지막 완결 원소까지 복구", () => {
    const raw = '{"items":[{"t":"a"},{"t":"b"},{"t":"c';
    const r = parseLlmJson<{ items: Array<{ t: string }> }>(raw);
    expect(r.items.length).toBeGreaterThanOrEqual(2);
  });
  it("복구 불가면 AiParseError", () => {
    expect(() => parseLlmJson("완전 산문만")).toThrow(/JSON/);
  });
  it("repairTruncatedJson 균형 잡힌 입력은 그대로", () => {
    expect(repairTruncatedJson('{"a":1}')).toBe('{"a":1}');
  });
});
