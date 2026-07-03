import type { Language } from "@foundone/shared";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type EditSaveStatus = "saving" | "saved" | "error" | null;

export type GenericTaskFooterMode =
  | "page_locked"
  | "save_completed"
  | "launch"
  | "task_continue";

export type GenericTaskSaveViewState = {
  isSaving: boolean;
  label: string;
};

export type GenericTaskLaunchViewState = {
  canLaunch: boolean;
  label: string;
};

export type GenericTaskContinueViewState = {
  canContinue: boolean;
  canEdit: boolean;
  continueLabel: string;
  editBackground: string;
  editLabel: string;
  isSavingEdit: boolean;
};

export type GenericTaskFooterModeInput = {
  hasMoreReadingPages: boolean;
  correctedProgressPercent: number;
  stageId: string;
  businessLaunched: boolean;
};

export type ScopedEditSaveStatus = {
  stageId: string;
  status: Exclude<EditSaveStatus, null>;
} | null;

export function getGenericTaskFooterMode({
  hasMoreReadingPages,
  correctedProgressPercent,
  stageId,
  businessLaunched,
}: GenericTaskFooterModeInput): GenericTaskFooterMode {
  if (hasMoreReadingPages) {
    return "page_locked";
  }

  if (correctedProgressPercent >= 100 && !(stageId === "pre-launch-final" && !businessLaunched)) {
    return "save_completed";
  }

  if (stageId === "pre-launch-final") {
    return "launch";
  }

  return "task_continue";
}

export function getCompletedStageSaveLabel(language: Language, saveStatus: SaveStatus) {
  if (saveStatus === "saving") {
    return language === "ko" ? "저장 중…" : "Saving…";
  }

  if (saveStatus === "saved") {
    return language === "ko" ? "저장됨 ✓" : "Saved ✓";
  }

  if (saveStatus === "error") {
    return language === "ko" ? "저장 실패 — 다시 시도" : "Save failed — retry";
  }

  return language === "ko" ? "수정 내용 저장" : "Save changes";
}

export function getLaunchButtonLabel(language: Language, industryCategoryId?: string) {
  if (language === "ko") {
    return industryCategoryId === "startup-tech" ? "🚀 런칭하기" : "🚀 개업하기";
  }

  return industryCategoryId === "startup-tech" ? "🚀 Launch" : "🚀 Open store";
}

export function shouldShowGenericTaskEditButton(
  completedAt: string | undefined,
  isViewingPastStage: boolean,
) {
  return !!completedAt && isViewingPastStage;
}

export function getScopedEditSaveStatus(
  editSaveStatus: ScopedEditSaveStatus,
  stageId: string,
): EditSaveStatus {
  return editSaveStatus?.stageId === stageId ? editSaveStatus.status : null;
}

export function getGenericTaskEditLabel(language: Language, editStatus: EditSaveStatus) {
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

export function getGenericTaskEditBackground(editStatus: EditSaveStatus) {
  return editStatus === "error" ? "#b64c4c" : "#1d3557";
}

export function getGenericTaskContinueLabel(language: Language) {
  return language === "ko" ? "다음 단계로" : "Continue";
}

export function getGenericTaskSaveViewState({
  language,
  saveStatus,
}: {
  language: Language;
  saveStatus: SaveStatus;
}): GenericTaskSaveViewState {
  return {
    isSaving: saveStatus === "saving",
    label: getCompletedStageSaveLabel(language, saveStatus),
  };
}

export function getGenericTaskLaunchViewState({
  allDone,
  industryCategoryId,
  language,
}: {
  allDone: boolean;
  industryCategoryId?: string;
  language: Language;
}): GenericTaskLaunchViewState {
  return {
    canLaunch: allDone,
    label: getLaunchButtonLabel(language, industryCategoryId),
  };
}

export function getGenericTaskContinueViewState({
  allDone,
  editStatus,
  language,
}: {
  allDone: boolean;
  editStatus: EditSaveStatus;
  language: Language;
}): GenericTaskContinueViewState {
  const isSavingEdit = editStatus === "saving";

  return {
    canContinue: allDone,
    canEdit: allDone && !isSavingEdit,
    continueLabel: getGenericTaskContinueLabel(language),
    editBackground: getGenericTaskEditBackground(editStatus),
    editLabel: getGenericTaskEditLabel(language, editStatus),
    isSavingEdit,
  };
}
