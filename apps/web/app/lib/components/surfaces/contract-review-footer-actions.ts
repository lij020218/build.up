import type { ContractReviewFooterViewState } from "./contract-review-footer-state";

type ContinueHandler = () => void;
type EditHandler = () => void | Promise<void>;

export function runContractReviewContinueAction({
  onContinue,
  viewState,
}: {
  onContinue: ContinueHandler;
  viewState: ContractReviewFooterViewState;
}) {
  if (!viewState.canContinue) {
    return;
  }

  onContinue();
}

export function runContractReviewEditAction({
  onEdit,
  viewState,
}: {
  onEdit: EditHandler;
  viewState: ContractReviewFooterViewState;
}) {
  if (!viewState.canEdit) {
    return;
  }

  void onEdit();
}
