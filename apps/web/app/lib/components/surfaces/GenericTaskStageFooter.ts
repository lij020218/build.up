"use client";

import { createElement, Fragment, type ReactNode } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { CurrentStageResettableFooterFrame } from "./CurrentStageResettableFooterFrame";
import {
  getCompletedStageSaveLabel,
  getGenericTaskContinueLabel,
  getGenericTaskEditBackground,
  getGenericTaskEditLabel,
  getLaunchButtonLabel,
  getScopedEditSaveStatus,
  shouldShowGenericTaskEditButton,
  type GenericTaskFooterMode,
} from "./generic-task-footer-state";

type GenericTaskStageFooterProps = {
  allDone: boolean;
  footerMode: GenericTaskFooterMode;
  isViewingPastStage: boolean;
  onBack: () => void;
  stageId: string;
  stageLockedContent: ReactNode;
};

export function GenericTaskStageFooter({
  allDone,
  footerMode,
  isViewingPastStage,
  onBack,
  stageId,
  stageLockedContent,
}: GenericTaskStageFooterProps) {
  const {
    handleLaunchBusiness,
    handleStageContinue,
    industryCategoryId,
    language,
    persistCurrentState,
    saveStatus,
    setSaveStatus,
  } = useDashboardCtx();

  const footerContent = footerMode === "page_locked"
    ? stageLockedContent
    : footerMode === "save_completed"
      ? createElement(
        "button",
        {
          type: "button",
          disabled: saveStatus === "saving",
          style: {
            ...styles.primaryButton,
            opacity: saveStatus === "saving" ? 0.6 : 1,
            background:
              saveStatus === "saved" ? "#1d3557" : saveStatus === "error" ? "#b64c4c" : undefined,
            transition: "background 0.2s, opacity 0.2s",
          },
          onClick: async () => {
            setSaveStatus("saving");
            try {
              await persistCurrentState();
              setSaveStatus("saved");
              setTimeout(() => setSaveStatus("idle"), 2000);
            } catch {
              setSaveStatus("error");
              setTimeout(() => setSaveStatus("idle"), 2500);
            }
          },
        },
        getCompletedStageSaveLabel(language, saveStatus),
      )
      : footerMode === "launch"
        ? createElement(
          "button",
          {
            type: "button",
            style: {
              ...styles.primaryButton,
              opacity: allDone ? 1 : 0.45,
              background: allDone ? "linear-gradient(135deg, #1d3557, #30a84e)" : undefined,
            },
            onClick: () => {
              handleStageContinue(stageId);
              handleLaunchBusiness();
            },
            disabled: !allDone,
          },
          getLaunchButtonLabel(language, industryCategoryId),
        )
        : createElement(GenericTaskContinueActions, {
          allDone,
          isViewingPastStage,
          stageId,
        });

  return createElement(CurrentStageResettableFooterFrame, { onBack }, footerContent);
}

function GenericTaskContinueActions({
  allDone,
  isViewingPastStage,
  stageId,
}: {
  allDone: boolean;
  isViewingPastStage: boolean;
  stageId: string;
}) {
  const {
    decisions,
    editSaveStatus,
    handleStageContinue,
    handleStageEdit,
    language,
  } = useDashboardCtx();
  const isStageCompleted = shouldShowGenericTaskEditButton(
    decisions[stageId]?.completedAt,
    isViewingPastStage,
  );
  const editStatus = getScopedEditSaveStatus(editSaveStatus, stageId);
  const editLabel = getGenericTaskEditLabel(language, editStatus);
  const editBg = getGenericTaskEditBackground(editStatus);

  return createElement(
    Fragment,
    null,
    isStageCompleted
      ? createElement(
        "button",
        {
          type: "button",
          style: {
            ...styles.primaryButton,
            opacity: allDone && editStatus !== "saving" ? 1 : 0.5,
            background: editBg,
            cursor: editStatus === "saving" ? "wait" : "pointer",
          },
          onClick: () => {
            void handleStageEdit(stageId);
          },
          disabled: !allDone || editStatus === "saving",
        },
        editLabel,
      )
      : null,
    createElement(
      "button",
      {
        type: "button",
        style: {
          ...styles.primaryButton,
          opacity: allDone ? 1 : 0.45,
        },
        onClick: () => handleStageContinue(stageId),
        disabled: !allDone,
      },
      getGenericTaskContinueLabel(language),
    ),
  );
}
