import { describe, expect, it } from "vitest";
import {
  getCompletedStageSaveLabel,
  getGenericTaskContinueLabel,
  getGenericTaskContinueViewState,
  getGenericTaskEditBackground,
  getGenericTaskEditLabel,
  getGenericTaskFooterMode,
  getGenericTaskLaunchViewState,
  getGenericTaskSaveViewState,
  getLaunchButtonLabel,
  getScopedEditSaveStatus,
  shouldShowGenericTaskEditButton,
} from "../app/lib/components/surfaces/generic-task-footer-state";

describe("generic task footer state", () => {
  it("keeps page navigation locked before stage actions", () => {
    expect(getGenericTaskFooterMode({
      hasMoreReadingPages: true,
      correctedProgressPercent: 100,
      stageId: "operations-setup",
      businessLaunched: false,
    })).toBe("page_locked");
  });

  it("keeps pre-launch-final on the launch button before business launch even at 100%", () => {
    expect(getGenericTaskFooterMode({
      hasMoreReadingPages: false,
      correctedProgressPercent: 100,
      stageId: "pre-launch-final",
      businessLaunched: false,
    })).toBe("launch");
  });

  it("shows save changes for completed non-final stages and launched final stages", () => {
    expect(getGenericTaskFooterMode({
      hasMoreReadingPages: false,
      correctedProgressPercent: 100,
      stageId: "operations-setup",
      businessLaunched: false,
    })).toBe("save_completed");
    expect(getGenericTaskFooterMode({
      hasMoreReadingPages: false,
      correctedProgressPercent: 100,
      stageId: "pre-launch-final",
      businessLaunched: true,
    })).toBe("save_completed");
  });

  it("returns task continue mode before completion", () => {
    expect(getGenericTaskFooterMode({
      hasMoreReadingPages: false,
      correctedProgressPercent: 90,
      stageId: "operations-setup",
      businessLaunched: false,
    })).toBe("task_continue");
  });

  it("localizes save, launch, edit, and continue labels", () => {
    expect(getCompletedStageSaveLabel("ko", "saving")).toBe("저장 중…");
    expect(getCompletedStageSaveLabel("en", "error")).toBe("Save failed — retry");
    expect(getLaunchButtonLabel("ko", "startup-tech")).toBe("🚀 런칭하기");
    expect(getLaunchButtonLabel("en", "food")).toBe("🚀 Open store");
    expect(getGenericTaskEditLabel("ko", "saved")).toBe("✓ 수정 완료");
    expect(getGenericTaskEditLabel("en", null)).toBe("✓ Save edits");
    expect(getGenericTaskContinueLabel("ko")).toBe("다음 단계로");
  });

  it("scopes edit-save status and visibility to the viewed completed stage", () => {
    expect(shouldShowGenericTaskEditButton("2026-07-01T00:00:00.000Z", true)).toBe(true);
    expect(shouldShowGenericTaskEditButton("2026-07-01T00:00:00.000Z", false)).toBe(false);
    expect(shouldShowGenericTaskEditButton(undefined, true)).toBe(false);
    expect(getScopedEditSaveStatus({ stageId: "a", status: "saving" }, "a")).toBe("saving");
    expect(getScopedEditSaveStatus({ stageId: "a", status: "saving" }, "b")).toBeNull();
    expect(getGenericTaskEditBackground("error")).toBe("#b64c4c");
    expect(getGenericTaskEditBackground("saved")).toBe("#1d3557");
  });

  it("builds save button view state from save status", () => {
    expect(getGenericTaskSaveViewState({
      language: "ko",
      saveStatus: "saving",
    })).toEqual({
      isSaving: true,
      label: "저장 중…",
    });
    expect(getGenericTaskSaveViewState({
      language: "en",
      saveStatus: "idle",
    })).toEqual({
      isSaving: false,
      label: "Save changes",
    });
  });

  it("builds launch button view state from completion and industry", () => {
    expect(getGenericTaskLaunchViewState({
      allDone: false,
      industryCategoryId: "startup-tech",
      language: "en",
    })).toEqual({
      canLaunch: false,
      label: "🚀 Launch",
    });
    expect(getGenericTaskLaunchViewState({
      allDone: true,
      industryCategoryId: "food",
      language: "ko",
    })).toEqual({
      canLaunch: true,
      label: "🚀 개업하기",
    });
  });

  it("builds continue and edit view state without allowing saving edits", () => {
    expect(getGenericTaskContinueViewState({
      allDone: true,
      editStatus: "saving",
      language: "en",
    })).toEqual({
      canContinue: true,
      canEdit: false,
      continueLabel: "Continue",
      editBackground: "#1d3557",
      editLabel: "Saving...",
      isSavingEdit: true,
    });
    expect(getGenericTaskContinueViewState({
      allDone: false,
      editStatus: null,
      language: "ko",
    })).toMatchObject({
      canContinue: false,
      canEdit: false,
      continueLabel: "다음 단계로",
      editLabel: "✓ 수정 저장",
      isSavingEdit: false,
    });
  });
});
