"use client";

import { createElement, Fragment, type ReactNode } from "react";
import type { Language } from "@foundone/shared";
import { styles } from "../../styles";
import { CurrentStageResettableFooterFrame } from "./CurrentStageResettableFooterFrame";
import {
  runGenericTaskContinueAction,
  runGenericTaskEditAction,
  runGenericTaskLaunchAction,
  runGenericTaskSaveAction,
} from "./generic-task-footer-actions";
import {
  getGenericTaskContinueViewState,
  getGenericTaskLaunchViewState,
  getGenericTaskSaveViewState,
  type EditSaveStatus,
  type GenericTaskFooterMode,
  type SaveStatus,
} from "./generic-task-footer-state";

type GenericTaskStageFooterProps = {
  allDone: boolean;
  editStatus: EditSaveStatus;
  footerMode: GenericTaskFooterMode;
  industryCategoryId?: string;
  isStageCompleted: boolean;
  language: Language;
  onBack: () => void;
  onContinueStage: (stageId: string) => void;
  onEditStage: (stageId: string) => void | Promise<void>;
  onLaunchBusiness: () => void;
  onPersistCurrentState: () => Promise<void>;
  onReset: () => void;
  onSetSaveStatus: (status: SaveStatus) => void;
  resetLabel: string;
  saveStatus: SaveStatus;
  stageId: string;
  stageLockedContent: ReactNode;
};

export function GenericTaskStageFooter({
  allDone,
  editStatus,
  footerMode,
  industryCategoryId,
  isStageCompleted,
  language,
  onBack,
  onContinueStage,
  onEditStage,
  onLaunchBusiness,
  onPersistCurrentState,
  onReset,
  onSetSaveStatus,
  resetLabel,
  saveStatus,
  stageId,
  stageLockedContent,
}: GenericTaskStageFooterProps) {
  function renderFooterContent() {
    if (footerMode === "page_locked") {
      return stageLockedContent;
    }

    if (footerMode === "save_completed") {
      const saveViewState = getGenericTaskSaveViewState({ language, saveStatus });

      return createElement(
        "button",
        {
          type: "button",
          disabled: saveViewState.isSaving,
          style: {
            ...styles.primaryButton,
            opacity: saveViewState.isSaving ? 0.6 : 1,
            background:
              saveStatus === "saved" ? "#1d3557" : saveStatus === "error" ? "#b64c4c" : undefined,
            transition: "background 0.2s, opacity 0.2s",
          },
          onClick: async () => {
            await runGenericTaskSaveAction({
              onPersistCurrentState,
              onSetSaveStatus,
              viewState: saveViewState,
            });
          },
        },
        saveViewState.label,
      );
    }

    if (footerMode === "launch") {
      const launchViewState = getGenericTaskLaunchViewState({
        allDone,
        industryCategoryId,
        language,
      });

      return createElement(
        "button",
        {
          type: "button",
          style: {
            ...styles.primaryButton,
            opacity: launchViewState.canLaunch ? 1 : 0.45,
            background: launchViewState.canLaunch ? "linear-gradient(135deg, #1d3557, #30a84e)" : undefined,
          },
          onClick: () => {
            void runGenericTaskLaunchAction({
              onContinueStage,
              onLaunchBusiness,
              stageId,
              viewState: launchViewState,
            });
          },
          disabled: !launchViewState.canLaunch,
        },
        launchViewState.label,
      );
    }

    return createElement(GenericTaskContinueActions, {
      allDone,
      editStatus,
      isStageCompleted,
      language,
      onContinueStage,
      onEditStage,
      stageId,
    });
  }

  return createElement(
    CurrentStageResettableFooterFrame,
    {
      language,
      onBack,
      onReset,
      resetLabel,
    },
    renderFooterContent(),
  );
}

function GenericTaskContinueActions({
  allDone,
  editStatus,
  isStageCompleted,
  language,
  onContinueStage,
  onEditStage,
  stageId,
}: {
  allDone: boolean;
  editStatus: EditSaveStatus;
  isStageCompleted: boolean;
  language: Language;
  onContinueStage: (stageId: string) => void;
  onEditStage: (stageId: string) => void | Promise<void>;
  stageId: string;
}) {
  const viewState = getGenericTaskContinueViewState({
    allDone,
    editStatus,
    language,
  });

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
            opacity: viewState.canEdit ? 1 : 0.5,
            background: viewState.editBackground,
            cursor: viewState.isSavingEdit ? "wait" : viewState.canEdit ? "pointer" : "not-allowed",
          },
          onClick: () => {
            runGenericTaskEditAction({
              onEditStage,
              stageId,
              viewState,
            });
          },
          disabled: !viewState.canEdit,
        },
        viewState.editLabel,
      )
      : null,
    createElement(
      "button",
      {
        type: "button",
        style: {
          ...styles.primaryButton,
          opacity: viewState.canContinue ? 1 : 0.45,
        },
        onClick: () => {
          runGenericTaskContinueAction({
            onContinueStage,
            stageId,
            viewState,
          });
        },
        disabled: !viewState.canContinue,
      },
      viewState.continueLabel,
    ),
  );
}
