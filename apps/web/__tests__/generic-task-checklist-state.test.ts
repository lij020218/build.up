import type { TaskState, WorkflowDecisionMap } from "@foundone/shared";
import { describe, expect, it } from "vitest";
import { getGenericTaskChecklistItemState } from "../app/lib/components/surfaces/generic-task-checklist-state";

function task(taskId: string, status: TaskState["status"] = "todo"): TaskState {
  return {
    taskId,
    title: taskId,
    status,
    required: true,
  };
}

describe("generic task checklist state", () => {
  it("treats pre-launch auto-completion as done and suppresses manual hints", () => {
    const state = getGenericTaskChecklistItemState({
      decisions: {},
      industryCategoryId: "food",
      isPreLaunch: true,
      isStrictConstructionFranchise: false,
      language: "ko",
      preLaunchDoneMap: { "soft-open-done": true },
      stageCode: "pre_launch",
      task: task("soft-open-done"),
    });

    expect(state.done).toBe(true);
    expect(state.preLaunchHint).toBeNull();
    expect(state.gate.blocked).toBe(false);
  });

  it("blocks problem-defined until the startup problem decision is complete", () => {
    const state = getGenericTaskChecklistItemState({
      decisions: {},
      industryCategoryId: "startup-tech",
      isPreLaunch: false,
      isStrictConstructionFranchise: false,
      language: "en",
      preLaunchDoneMap: {},
      stageCode: "customer_discovery",
      task: task("problem-defined"),
    });

    expect(state.done).toBe(false);
    expect(state.gate.blocked).toBe(true);
    if (state.gate.blocked) {
      expect(state.gate.hint.en).toContain("problem statement");
    }
  });

  it("uses strict franchise construction copy before falling back to task title", () => {
    const state = getGenericTaskChecklistItemState({
      decisions: {} satisfies WorkflowDecisionMap,
      industryCategoryId: "food",
      isPreLaunch: false,
      isStrictConstructionFranchise: true,
      language: "ko",
      preLaunchDoneMap: {},
      stageCode: "construction_setup",
      task: task("contractor-selected"),
    });

    expect(state.title).toBe("본사 가맹 담당자에게 시공 일정·비용 분담 협의 완료");
    expect(state.constructionHint).toContain("외부 업체 견적");
  });

  it("keeps construction hints hidden for completed construction tasks", () => {
    const state = getGenericTaskChecklistItemState({
      decisions: {},
      industryCategoryId: "food",
      isPreLaunch: false,
      isStrictConstructionFranchise: false,
      language: "ko",
      preLaunchDoneMap: {},
      stageCode: "construction_setup",
      task: task("interior-concept-selected", "completed"),
    });

    expect(state.done).toBe(true);
    expect(state.constructionHint).toBeNull();
  });
});
