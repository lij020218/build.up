import type { Language, StageContent } from "@foundone/shared";

export type ContractReviewGateState = {
  clauseIds: string[];
  doneCount: number;
  totalCount: number;
  allClausesDone: boolean;
  signed: boolean;
  canContinue: boolean;
};

export type ContractReviewFooterViewState = {
  canContinue: boolean;
  canEdit: boolean;
  continueLabel: string;
  editLabel: string;
  isSaving: boolean;
};

export function getContractReviewGateState(
  content: StageContent,
  checks: Record<string, boolean>,
): ContractReviewGateState {
  const gate = content.pages
    .flatMap((page) => page.sections)
    .find((section) => section.kind === "gateChecklist");
  const clauseIds = gate && gate.kind === "gateChecklist" ? gate.items.map((item) => item.id) : [];
  const doneCount = clauseIds.filter((id) => checks[`__final:${id}`]).length;
  const allClausesDone = clauseIds.length > 0 && doneCount === clauseIds.length;
  const signed = !!checks["__final:signed"];

  return {
    clauseIds,
    doneCount,
    totalCount: clauseIds.length,
    allClausesDone,
    signed,
    canContinue: allClausesDone && signed,
  };
}

export function getContractReviewContinueLabel(
  language: Language,
  state: ContractReviewGateState,
) {
  if (!state.allClausesDone) {
    return language === "ko"
      ? `↑ 9대 핵심 조항 ${state.doneCount}/${state.totalCount}`
      : `↑ Clauses ${state.doneCount}/${state.totalCount}`;
  }

  if (!state.signed) {
    return language === "ko" ? "↑ 서명 완료 토글을 켜세요" : "↑ Toggle 'signed'";
  }

  return language === "ko" ? "계약 검토 완료 — 다음 단계로" : "Contract reviewed — continue";
}

export function getContractReviewEditLabel(
  language: Language,
  editStatus: "saving" | "saved" | "error" | null,
) {
  if (editStatus === "saving") {
    return language === "ko" ? "저장 중..." : "Saving...";
  }

  if (editStatus === "saved") {
    return language === "ko" ? "✓ 수정 완료" : "✓ Saved";
  }

  if (editStatus === "error") {
    return language === "ko" ? "⚠ 다시 시도" : "⚠ Retry";
  }

  return language === "ko" ? "✓ 수정 저장" : "✓ Save edits";
}

export function getContractReviewFooterViewState({
  editStatus,
  gateState,
  language,
}: {
  editStatus: "saving" | "saved" | "error" | null;
  gateState: ContractReviewGateState;
  language: Language;
}): ContractReviewFooterViewState {
  const isSaving = editStatus === "saving";

  return {
    canContinue: gateState.canContinue,
    canEdit: gateState.canContinue && !isSaving,
    continueLabel: getContractReviewContinueLabel(language, gateState),
    editLabel: getContractReviewEditLabel(language, editStatus),
    isSaving,
  };
}
