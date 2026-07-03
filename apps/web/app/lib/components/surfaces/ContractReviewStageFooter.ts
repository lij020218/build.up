"use client";

import { createElement, type ReactNode } from "react";
import type { Language } from "@foundone/shared";
import { styles } from "../../styles";
import {
  runContractReviewContinueAction,
  runContractReviewEditAction,
} from "./contract-review-footer-actions";
import {
  getContractReviewFooterViewState,
  type ContractReviewGateState,
} from "./contract-review-footer-state";
import { CurrentStageResettableFooterFrame } from "./CurrentStageResettableFooterFrame";

type ContractReviewStageFooterProps = {
  editStatus: "saving" | "saved" | "error" | null;
  gateState: ContractReviewGateState;
  hasMoreReadingPages: boolean;
  isStageCompleted: boolean;
  language: Language;
  onBack: () => void;
  onContinue: () => void;
  onEdit: () => void | Promise<void>;
  onReset: () => void;
  resetLabel: string;
  stageLockedContent: ReactNode;
};

export function ContractReviewStageFooter({
  editStatus,
  gateState,
  hasMoreReadingPages,
  isStageCompleted,
  language,
  onBack,
  onContinue,
  onEdit,
  onReset,
  resetLabel,
  stageLockedContent,
}: ContractReviewStageFooterProps) {
  const viewState = getContractReviewFooterViewState({
    editStatus,
    gateState,
    language,
  });

  return createElement(
    CurrentStageResettableFooterFrame,
    {
      language,
      onBack,
      onReset,
      resetLabel,
    },
    isStageCompleted
      ? createElement(
        "button",
        {
          type: "button",
          style: {
            ...styles.primaryButton,
            opacity: viewState.canEdit ? 1 : 0.5,
            background: editStatus === "error" ? "#b64c4c" : "#1d3557",
            cursor: viewState.isSaving ? "wait" : viewState.canEdit ? "pointer" : "not-allowed",
          },
          disabled: !viewState.canEdit,
          onClick: () => {
            runContractReviewEditAction({
              onEdit,
              viewState,
            });
          },
        },
        viewState.editLabel,
      )
      : null,
    hasMoreReadingPages
      ? stageLockedContent
      : createElement(
        "button",
        {
          type: "button",
          style: {
            ...styles.primaryButton,
            opacity: viewState.canContinue ? 1 : 0.45,
            cursor: viewState.canContinue ? "pointer" : "not-allowed",
          },
          disabled: !viewState.canContinue,
          onClick: () => {
            runContractReviewContinueAction({
              onContinue,
              viewState,
            });
          },
        },
        viewState.continueLabel,
      ),
  );
}
