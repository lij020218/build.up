import { describe, expect, it } from "vitest";
import {
  getGuideVerificationFooterState,
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

  it("builds tax guide verification footer state from checklist progress", () => {
    expect(getGuideVerificationFooterState({
      guideStageKind: "tax_guide",
      industryCategoryId: "food",
      language: "ko",
      loanChecks: {},
      reviewedLabels: {
        loan: "대출 검토를 마치고 계속",
        tax: "세무 검토를 마치고 계속",
      },
      taxChecks: { "tc-hometax": true },
    })).toEqual({
      label: "↑ 필수 세팅 1/6",
      ready: false,
      stageId: "tax-guide",
      title: "필수 세팅 1/6 — 「필수 세팅」 탭에서 모두 체크 후 진행",
    });
  });

  it("builds loan guide verification footer state from final review", () => {
    expect(getGuideVerificationFooterState({
      guideStageKind: "loan_guide",
      industryCategoryId: "food",
      language: "en",
      loanChecks: { "loan-final-review": true },
      reviewedLabels: {
        loan: "Finish loan review",
        tax: "Finish tax review",
      },
      taxChecks: {},
    })).toEqual({
      label: "Finish loan review",
      ready: true,
      stageId: "loan-guide",
      title: undefined,
    });
  });

  it("does not build footer state for unsupported guide stages", () => {
    expect(getGuideVerificationFooterState({
      guideStageKind: "unsupported",
      industryCategoryId: "food",
      language: "ko",
      loanChecks: {},
      reviewedLabels: {
        loan: "대출 검토를 마치고 계속",
        tax: "세무 검토를 마치고 계속",
      },
      taxChecks: {},
    })).toBeNull();
  });
});
