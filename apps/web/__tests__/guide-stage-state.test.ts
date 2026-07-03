import { describe, expect, it } from "vitest";
import {
  getGuideStageKind,
  getLoanGuideReviewState,
  getTaxGuideGateState,
} from "../app/lib/components/surfaces/guide-stage-state";

describe("guide stage state", () => {
  it("classifies guide stage variants", () => {
    expect(getGuideStageKind("tax_guide")).toBe("tax_guide");
    expect(getGuideStageKind("loan_guide")).toBe("loan_guide");
    expect(getGuideStageKind("legacy_unknown")).toBe("unsupported");
  });

  it("summarizes tax guide gates with category fallback", () => {
    const food = getTaxGuideGateState({
      industryCategoryId: "food",
      taxChecks: { "tc-hometax": true },
    });
    const fallback = getTaxGuideGateState({
      industryCategoryId: "unknown-category",
      taxChecks: { "tc-hometax": true },
    });

    expect(food).toEqual({
      doneCount: 1,
      totalCount: 6,
      allDone: false,
    });
    expect(fallback).toEqual(food);
  });

  it("requires explicit loan guide final review", () => {
    expect(getLoanGuideReviewState({})).toBe(false);
    expect(getLoanGuideReviewState({ "loan-final-review": true })).toBe(true);
  });
});
