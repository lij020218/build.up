"use client";

import { createElement, type ReactNode } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import {
  getContractReviewContinueLabel,
  getContractReviewEditLabel,
  type ContractReviewGateState,
} from "./contract-review-footer-state";
import { CurrentStageResettableFooterFrame } from "./CurrentStageResettableFooterFrame";

type ContractReviewStageFooterProps = {
  gateState: ContractReviewGateState;
  hasMoreReadingPages: boolean;
  onBack: () => void;
  stageLockedContent: ReactNode;
};

export function ContractReviewStageFooter({
  gateState,
  hasMoreReadingPages,
  onBack,
  stageLockedContent,
}: ContractReviewStageFooterProps) {
  const {
    decisions,
    handleContractContinue,
    handleStageEdit,
    editSaveStatus,
    isViewingPastStage,
    language,
  } = useDashboardCtx();
  const isStageCompleted = !!decisions["contract-review"]?.completedAt && isViewingPastStage;
  const editStatus = editSaveStatus?.stageId === "contract-review"
    ? editSaveStatus.status
    : null;
  const editLabel = getContractReviewEditLabel(language, editStatus);
  const continueLabel = getContractReviewContinueLabel(language, gateState);

  return createElement(
    CurrentStageResettableFooterFrame,
    { onBack },
    isStageCompleted
      ? createElement(
        "button",
        {
          type: "button",
          style: {
            ...styles.primaryButton,
            opacity: gateState.canContinue && editStatus !== "saving" ? 1 : 0.5,
            background: editStatus === "error" ? "#b64c4c" : "#1d3557",
            cursor: editStatus === "saving" ? "wait" : "pointer",
          },
          disabled: editStatus === "saving",
          onClick: () => {
            if (!gateState.canContinue) return;
            void handleStageEdit("contract-review");
          },
        },
        editLabel,
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
            opacity: gateState.canContinue ? 1 : 0.45,
            cursor: gateState.canContinue ? "pointer" : "not-allowed",
          },
          disabled: !gateState.canContinue,
          onClick: () => {
            if (!gateState.canContinue) return;
            handleContractContinue();
          },
        },
        continueLabel,
      ),
  );
}
