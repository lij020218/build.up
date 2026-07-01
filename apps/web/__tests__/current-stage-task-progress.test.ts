import { describe, expect, it } from "vitest";
import type { TaskState } from "@foundone/shared";
import {
  calculatePreLaunchDoneMap,
  calculateTaskGateSummary,
  calculateTaskProgressSummary,
  getStageGateTasks,
  getVisibleTaskProgressTasks,
} from "../app/lib/components/surfaces/current-stage-task-progress";

function task(taskId: string, status: TaskState["status"] = "todo"): TaskState {
  return {
    taskId,
    title: taskId,
    status,
    required: true,
  };
}

describe("calculateTaskProgressSummary", () => {
  it("hides inline-only CPA task from visible progress", () => {
    const summary = calculateTaskProgressSummary(
      [
        task("business-number-issued", "completed"),
        task("cpa-decision-made", "completed"),
        task("tax-profile-ready", "todo"),
      ],
      false,
      {},
    );

    expect(summary.visibleTasks.map((item) => item.taskId)).toEqual([
      "business-number-issued",
      "tax-profile-ready",
    ]);
    expect(summary.visibleDone).toBe(1);
    expect(getVisibleTaskProgressTasks([
      task("business-number-issued", "completed"),
      task("cpa-decision-made", "completed"),
    ]).map((item) => item.taskId)).toEqual(["business-number-issued"]);
  });

  it("uses task status for ordinary stages", () => {
    const summary = calculateTaskProgressSummary(
      [task("a", "completed"), task("b", "in_progress"), task("c", "todo")],
      false,
      { b: true },
    );

    expect(summary.visibleDone).toBe(1);
  });

  it("accepts either pre-launch auto-completion map or manual task completion", () => {
    const summary = calculateTaskProgressSummary(
      [task("soft-open-done", "todo"), task("feedback-collected", "completed"), task("final-checklist", "todo")],
      true,
      {
        "soft-open-done": true,
        "feedback-collected": false,
        "final-checklist": false,
      },
    );

    expect(summary.visibleDone).toBe(2);
  });

  it("returns empty visible progress when all tasks are hidden", () => {
    const summary = calculateTaskProgressSummary([task("cpa-decision-made", "completed")], false, {});

    expect(summary.visibleTasks).toEqual([]);
    expect(summary.visibleDone).toBe(0);
  });
});

describe("calculateTaskGateSummary", () => {
  it("uses required tasks only for ordinary stage gates", () => {
    const tasks = [
      task("required-done", "completed"),
      { ...task("optional-todo", "todo"), required: false },
    ];

    expect(getStageGateTasks("biz-registration", tasks).map((item) => item.taskId)).toEqual([
      "required-done",
    ]);
    expect(calculateTaskGateSummary("biz-registration", tasks, {}).allDone).toBe(true);
  });

  it("keeps go-live optional app-store tasks out of the gate", () => {
    const tasks = [
      task("launch-checklist-ready", "completed"),
      task("apple-app-store-submitted", "todo"),
      task("google-play-submitted", "todo"),
      task("launch-day-monitored", "todo"),
    ];

    expect(getStageGateTasks("go-live", tasks).map((item) => item.taskId)).toEqual([
      "launch-checklist-ready",
    ]);
    expect(calculateTaskGateSummary("go-live", tasks, {}).allDone).toBe(true);
  });

  it("requires at least one gate task before allDone can be true", () => {
    const summary = calculateTaskGateSummary("empty-stage", [], {});

    expect(summary.completedCount).toBe(0);
    expect(summary.allDone).toBe(false);
  });

  it("uses pre-launch auto-completion map or manual status for gate completion", () => {
    const summary = calculateTaskGateSummary(
      "pre-launch",
      [task("soft-open-done", "todo"), task("feedback-collected", "completed")],
      { "soft-open-done": true },
    );

    expect(summary.completedCount).toBe(2);
    expect(summary.allDone).toBe(true);
  });
});

describe("calculatePreLaunchDoneMap", () => {
  it("allows soft-open-done from guest, pricing, and prep checks before visible ids load", () => {
    const doneMap = calculatePreLaunchDoneMap({
      softOpenChecks: {
        "guest-family": true,
        "prep-feedback-form": true,
        "prep-invite-sent": true,
        "prep-sns-plan": true,
      },
      softOpenPricing: "discount",
      softOpenSkips: {},
      preLaunchVisibleIds: null,
    });

    expect(doneMap).toEqual({
      "soft-open-done": true,
      "feedback-collected": false,
      "final-checklist": false,
    });
  });

  it("requires rendered day ids for feedback-collected", () => {
    const doneMap = calculatePreLaunchDoneMap({
      softOpenChecks: {
        "day-open": true,
        "day-close": true,
      },
      softOpenPricing: "",
      softOpenSkips: {},
      preLaunchVisibleIds: {
        dayIds: ["day-open", "day-close"],
        feedbackIds: [],
        finalIds: [],
        improvementIds: [],
      },
    });

    expect(doneMap["feedback-collected"]).toBe(true);
    expect(doneMap["final-checklist"]).toBe(false);
  });

  it("requires feedback checks, all final ids resolved, and at least one final check", () => {
    const doneMap = calculatePreLaunchDoneMap({
      softOpenChecks: {
        "feedback-review": true,
        "final-menu": true,
      },
      softOpenPricing: "",
      softOpenSkips: {
        "final-staff": true,
      },
      preLaunchVisibleIds: {
        dayIds: [],
        feedbackIds: ["feedback-review"],
        finalIds: ["final-menu", "final-staff"],
        improvementIds: [],
      },
    });

    expect(doneMap["final-checklist"]).toBe(true);
  });

  it("does not complete final-checklist when every final item is only skipped", () => {
    const doneMap = calculatePreLaunchDoneMap({
      softOpenChecks: {
        "feedback-review": true,
      },
      softOpenPricing: "",
      softOpenSkips: {
        "final-menu": true,
        "final-staff": true,
      },
      preLaunchVisibleIds: {
        dayIds: [],
        feedbackIds: ["feedback-review"],
        finalIds: ["final-menu", "final-staff"],
        improvementIds: [],
      },
    });

    expect(doneMap["final-checklist"]).toBe(false);
  });
});
