import { describe, it, expect, beforeEach } from "vitest";
import { isModelOpen, recordModelFailure, recordModelSuccess, resetCircuitBreakers } from "@foundone/ai/utils/client";

describe("LlmClient 모델별 서킷 브레이커", () => {
  beforeEach(() => resetCircuitBreakers());
  it("60초 내 3회 실패 → open, 성공 기록 시 닫힘", () => {
    expect(isModelOpen("gpt-5.6-terra")).toBe(false);
    recordModelFailure("gpt-5.6-terra"); recordModelFailure("gpt-5.6-terra");
    expect(isModelOpen("gpt-5.6-terra")).toBe(false);
    recordModelFailure("gpt-5.6-terra");
    expect(isModelOpen("gpt-5.6-terra")).toBe(true);
    recordModelSuccess("gpt-5.6-terra");
    expect(isModelOpen("gpt-5.6-terra")).toBe(false);
  });
  it("모델별 독립", () => {
    for (let i = 0; i < 3; i++) recordModelFailure("gpt-5.6-terra");
    expect(isModelOpen("gpt-5.6-luna")).toBe(false);
  });
});
