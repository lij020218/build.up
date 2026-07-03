import { describe, expect, it, vi } from "vitest";
import {
  runGenericTaskContinueAction,
  runGenericTaskEditAction,
  runGenericTaskLaunchAction,
  runGenericTaskSaveAction,
} from "../app/lib/components/surfaces/generic-task-footer-actions";

describe("generic task footer actions", () => {
  it("does not persist while a save is already running", async () => {
    const onPersistCurrentState = vi.fn().mockResolvedValue(undefined);
    const onSetSaveStatus = vi.fn();

    await runGenericTaskSaveAction({
      onPersistCurrentState,
      onSetSaveStatus,
      viewState: {
        isSaving: true,
        label: "저장 중…",
      },
    });

    expect(onPersistCurrentState).not.toHaveBeenCalled();
    expect(onSetSaveStatus).not.toHaveBeenCalled();
  });

  it("persists and schedules idle reset after a successful save", async () => {
    const onPersistCurrentState = vi.fn().mockResolvedValue(undefined);
    const onSetSaveStatus = vi.fn();
    const scheduleReset = vi.fn((callback: () => void, _delay: number) => callback());

    await runGenericTaskSaveAction({
      onPersistCurrentState,
      onSetSaveStatus,
      scheduleReset,
      viewState: {
        isSaving: false,
        label: "수정 내용 저장",
      },
    });

    expect(onSetSaveStatus).toHaveBeenNthCalledWith(1, "saving");
    expect(onPersistCurrentState).toHaveBeenCalledTimes(1);
    expect(onSetSaveStatus).toHaveBeenNthCalledWith(2, "saved");
    expect(scheduleReset).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(onSetSaveStatus).toHaveBeenNthCalledWith(3, "idle");
  });

  it("records save errors and schedules idle reset", async () => {
    const onPersistCurrentState = vi.fn().mockRejectedValue(new Error("failed"));
    const onSetSaveStatus = vi.fn();
    const scheduleReset = vi.fn((callback: () => void, _delay: number) => callback());

    await runGenericTaskSaveAction({
      onPersistCurrentState,
      onSetSaveStatus,
      scheduleReset,
      viewState: {
        isSaving: false,
        label: "수정 내용 저장",
      },
    });

    expect(onSetSaveStatus).toHaveBeenNthCalledWith(1, "saving");
    expect(onSetSaveStatus).toHaveBeenNthCalledWith(2, "error");
    expect(scheduleReset).toHaveBeenCalledWith(expect.any(Function), 2500);
    expect(onSetSaveStatus).toHaveBeenNthCalledWith(3, "idle");
  });

  it("does not launch until the final task gate is complete", async () => {
    const onContinueStage = vi.fn();
    const onLaunchBusiness = vi.fn();

    await runGenericTaskLaunchAction({
      onContinueStage,
      onLaunchBusiness,
      stageId: "pre-launch-final",
      viewState: {
        canLaunch: false,
        label: "🚀 개업하기",
      },
    });

    expect(onContinueStage).not.toHaveBeenCalled();
    expect(onLaunchBusiness).not.toHaveBeenCalled();
  });

  it("launches in stage-advance order only when allowed", async () => {
    const calls: string[] = [];

    await runGenericTaskLaunchAction({
      onContinueStage: async (stageId) => {
        calls.push(`continue:${stageId}`);
      },
      onLaunchBusiness: () => calls.push("launch"),
      stageId: "pre-launch-final",
      viewState: {
        canLaunch: true,
        label: "🚀 개업하기",
      },
    });

    expect(calls).toEqual(["continue:pre-launch-final", "launch"]);
  });

  it("does not continue or edit when each action gate is closed", () => {
    const onContinueStage = vi.fn();
    const onEditStage = vi.fn();
    const viewState = {
      canContinue: false,
      canEdit: false,
      continueLabel: "다음 단계로",
      editBackground: "#1d3557",
      editLabel: "✓ 수정 저장",
      isSavingEdit: false,
    };

    runGenericTaskContinueAction({
      onContinueStage,
      stageId: "operations-setup",
      viewState,
    });
    runGenericTaskEditAction({
      onEditStage,
      stageId: "operations-setup",
      viewState,
    });

    expect(onContinueStage).not.toHaveBeenCalled();
    expect(onEditStage).not.toHaveBeenCalled();
  });
});
