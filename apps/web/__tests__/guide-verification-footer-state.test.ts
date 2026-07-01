import { describe, expect, it } from "vitest";
import {
  calculateChecklistGateSummary,
  calculateLegacyLoanGateSummary,
  getLegacyLoanReviewLabel,
  getLegacyLoanReviewTitle,
  getLoanFinalReviewLabel,
  getLoanFinalReviewTitle,
  getTaxReviewLabel,
  getTaxReviewTitle,
  isLoanFinalReviewChecked,
} from "../app/lib/components/surfaces/guide-verification-footer-state";

describe("guide verification footer state", () => {
  it("summarizes tax checklist completion", () => {
    const summary = calculateChecklistGateSummary(
      [{ id: "tax-a" }, { id: "tax-b" }],
      { "tax-a": true },
    );

    expect(summary).toEqual({
      doneCount: 1,
      totalCount: 2,
      allDone: false,
    });
    expect(getTaxReviewTitle("ko", summary)).toBe("필수 세팅 1/2 — 「필수 세팅」 탭에서 모두 체크 후 진행");
    expect(getTaxReviewLabel("en", summary, "Finish tax review")).toBe("↑ Setup 1/2");
  });

  it("uses reviewed tax label only when every checklist item is done", () => {
    const summary = calculateChecklistGateSummary(
      [{ id: "tax-a" }, { id: "tax-b" }],
      { "tax-a": true, "tax-b": true },
    );

    expect(summary.allDone).toBe(true);
    expect(getTaxReviewTitle("en", summary)).toBeUndefined();
    expect(getTaxReviewLabel("ko", summary, "세무 검토를 마치고 계속")).toBe("세무 검토를 마치고 계속");
  });

  it("requires explicit loan final review confirmation", () => {
    expect(isLoanFinalReviewChecked({})).toBe(false);
    expect(isLoanFinalReviewChecked({ "loan-final-review": true })).toBe(true);
    expect(getLoanFinalReviewTitle("en", false)).toBe("Tick the 'I have reviewed' box above first");
    expect(getLoanFinalReviewLabel("ko", false, "대출 검토를 마치고 계속")).toBe("↑ 검토 완료 박스 먼저 체크");
    expect(getLoanFinalReviewTitle("ko", true)).toBeUndefined();
    expect(getLoanFinalReviewLabel("en", true, "Finish loan review")).toBe("Finish loan review");
  });

  it("summarizes legacy loan eligibility and document gates", () => {
    const partial = calculateLegacyLoanGateSummary({
      eligDone: 5,
      eligTotal: 6,
      docDone: 7,
      docTotal: 7,
    });

    expect(partial.allDone).toBe(false);
    expect(getLegacyLoanReviewTitle("ko", partial)).toBe("자격 5/6 + 서류 7/7 모두 체크 필요");
    expect(getLegacyLoanReviewLabel("en", partial, "Finish loan review")).toBe("↑ Check 12/13");

    const complete = calculateLegacyLoanGateSummary({
      eligDone: 6,
      eligTotal: 6,
      docDone: 7,
      docTotal: 7,
    });

    expect(complete.allDone).toBe(true);
    expect(getLegacyLoanReviewTitle("en", complete)).toBeUndefined();
    expect(getLegacyLoanReviewLabel("ko", complete, "대출 검토를 마치고 계속")).toBe("대출 검토를 마치고 계속");
  });
});
