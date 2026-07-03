import type { TaskState, WorkflowTaskMap } from "@foundone/shared";
import { describe, expect, it } from "vitest";
import { getGenericTaskStageState } from "../app/lib/components/surfaces/generic-task-stage-state";

function task(taskId: string, status: TaskState["status"] = "todo"): TaskState {
  return {
    taskId,
    title: taskId,
    status,
    required: true,
  };
}

function baseInput(overrides: Partial<Parameters<typeof getGenericTaskStageState>[0]> = {}) {
  const taskMap: WorkflowTaskMap = {
    "operations-setup": [task("pos-ready", "completed")],
  };

  return {
    businessLaunched: false,
    correctedProgressPercent: 0,
    franchiseFlexibility: undefined,
    hasMoreReadingPages: false,
    preLaunchVisibleIds: null,
    selectedFranchiseBrandId: null,
    softOpenChecks: {},
    softOpenPricing: "",
    softOpenSkips: {},
    stageCode: "operations_setup",
    startupType: "independent",
    taskMap,
    ...overrides,
  };
}

describe("generic task stage state", () => {
  it("maps stage code to stage id and summarizes required task completion", () => {
    const state = getGenericTaskStageState(baseInput());

    expect(state.stageId).toBe("operations-setup");
    expect(state.stageTasks.map((item) => item.taskId)).toEqual(["pos-ready"]);
    expect(state.allDone).toBe(true);
    expect(state.footerMode).toBe("task_continue");
  });

  it("uses pre-launch auto-completion map for pre-launch gates", () => {
    const state = getGenericTaskStageState(baseInput({
      softOpenChecks: {
        "guest-family": true,
        "prep-feedback-form": true,
        "prep-invite-sent": true,
        "prep-sns-plan": true,
      },
      softOpenPricing: "discount",
      stageCode: "pre_launch",
      taskMap: {
        "pre-launch": [task("soft-open-done")],
      },
    }));

    expect(state.stageId).toBe("pre-launch");
    expect(state.isPreLaunch).toBe(true);
    expect(state.preLaunchDoneMap["soft-open-done"]).toBe(true);
    expect(state.allDone).toBe(true);
  });

  it("keeps pre-launch final on launch mode before business launch", () => {
    const state = getGenericTaskStageState(baseInput({
      correctedProgressPercent: 100,
      stageCode: "pre_launch_final",
      taskMap: {
        "pre-launch-final": [task("final-ready", "completed")],
      },
    }));

    expect(state.stageId).toBe("pre-launch-final");
    expect(state.footerMode).toBe("launch");
    expect(state.allDone).toBe(true);
  });

  it("detects strict franchise construction copy only for strict franchise data", () => {
    const strictState = getGenericTaskStageState(baseInput({
      franchiseFlexibility: "strict",
      selectedFranchiseBrandId: "compose-coffee",
      stageCode: "construction_setup",
      startupType: "franchise",
      taskMap: {
        "construction-setup": [task("contractor-selected")],
      },
    }));

    expect(strictState.isStrictConstructionFranchise).toBe(true);

    const independentState = getGenericTaskStageState(baseInput({
      franchiseFlexibility: "strict",
      selectedFranchiseBrandId: "compose-coffee",
      stageCode: "construction_setup",
      startupType: "independent",
      taskMap: {
        "construction-setup": [task("contractor-selected")],
      },
    }));

    expect(independentState.isStrictConstructionFranchise).toBe(false);

    const flexibleState = getGenericTaskStageState(baseInput({
      franchiseFlexibility: "moderate",
      selectedFranchiseBrandId: "compose-coffee",
      stageCode: "construction_setup",
      startupType: "franchise",
      taskMap: {
        "construction-setup": [task("contractor-selected")],
      },
    }));

    expect(flexibleState.isStrictConstructionFranchise).toBe(false);
  });
});
