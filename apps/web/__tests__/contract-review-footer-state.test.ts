import { CONTRACT_REVIEW_CONTENT } from "@foundone/shared";
import { describe, expect, it } from "vitest";
import {
  getContractReviewContinueLabel,
  getContractReviewEditLabel,
  getContractReviewGateState,
} from "../app/lib/components/surfaces/contract-review-footer-state";

describe("contract review footer state", () => {
  it("requires every final clause and contract signature before continuing", () => {
    const empty = getContractReviewGateState(CONTRACT_REVIEW_CONTENT, {});

    expect(empty.totalCount).toBe(9);
    expect(empty.doneCount).toBe(0);
    expect(empty.allClausesDone).toBe(false);
    expect(empty.signed).toBe(false);
    expect(empty.canContinue).toBe(false);
    expect(getContractReviewContinueLabel("ko", empty)).toBe("↑ 9대 핵심 조항 0/9");

    const clauseChecks = Object.fromEntries(
      empty.clauseIds.map((id) => [`__final:${id}`, true]),
    );
    const clausesOnly = getContractReviewGateState(CONTRACT_REVIEW_CONTENT, clauseChecks);

    expect(clausesOnly.doneCount).toBe(9);
    expect(clausesOnly.allClausesDone).toBe(true);
    expect(clausesOnly.signed).toBe(false);
    expect(clausesOnly.canContinue).toBe(false);
    expect(getContractReviewContinueLabel("en", clausesOnly)).toBe("↑ Toggle 'signed'");

    const complete = getContractReviewGateState(CONTRACT_REVIEW_CONTENT, {
      ...clauseChecks,
      "__final:signed": true,
    });

    expect(complete.canContinue).toBe(true);
    expect(getContractReviewContinueLabel("ko", complete)).toBe("계약 검토 완료 — 다음 단계로");
  });

  it("uses scoped edit labels for completed-stage save state", () => {
    expect(getContractReviewEditLabel("ko", null)).toBe("✓ 수정 저장");
    expect(getContractReviewEditLabel("en", "saving")).toBe("Saving...");
    expect(getContractReviewEditLabel("ko", "saved")).toBe("✓ 수정 완료");
    expect(getContractReviewEditLabel("en", "error")).toBe("⚠ Retry");
  });
});
