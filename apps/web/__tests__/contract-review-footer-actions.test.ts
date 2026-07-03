import { describe, expect, it, vi } from "vitest";
import {
  runContractReviewContinueAction,
  runContractReviewEditAction,
} from "../app/lib/components/surfaces/contract-review-footer-actions";
import type { ContractReviewFooterViewState } from "../app/lib/components/surfaces/contract-review-footer-state";

function viewState(
  overrides: Partial<ContractReviewFooterViewState> = {},
): ContractReviewFooterViewState {
  return {
    canContinue: true,
    canEdit: true,
    continueLabel: "계약 검토 완료 — 다음 단계로",
    editLabel: "✓ 수정 저장",
    isSaving: false,
    ...overrides,
  };
}

describe("contract review footer actions", () => {
  it("does not continue while the contract gate is closed", () => {
    const onContinue = vi.fn();

    runContractReviewContinueAction({
      onContinue,
      viewState: viewState({ canContinue: false }),
    });

    expect(onContinue).not.toHaveBeenCalled();
  });

  it("continues only when the contract gate is open", () => {
    const onContinue = vi.fn();

    runContractReviewContinueAction({
      onContinue,
      viewState: viewState({ canContinue: true }),
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("does not save completed-stage edits while edit is blocked", () => {
    const onEdit = vi.fn();

    runContractReviewEditAction({
      onEdit,
      viewState: viewState({ canEdit: false }),
    });

    expect(onEdit).not.toHaveBeenCalled();
  });

  it("saves completed-stage edits only when edit is allowed", () => {
    const onEdit = vi.fn();

    runContractReviewEditAction({
      onEdit,
      viewState: viewState({ canEdit: true }),
    });

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
