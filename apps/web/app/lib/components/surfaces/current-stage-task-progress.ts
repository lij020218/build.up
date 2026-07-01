import type { TaskState } from "@foundone/shared";

export type TaskProgressSummary = {
  visibleTasks: TaskState[];
  visibleDone: number;
};

export const GATE_OPTIONAL_TASK_IDS = new Set([
  "apple-app-store-submitted",
  "google-play-submitted",
  "launch-day-monitored",
]);

export type TaskGateSummary = {
  gateTasks: TaskState[];
  completedCount: number;
  allDone: boolean;
};

export type PreLaunchVisibleIds = {
  dayIds: string[];
  feedbackIds: string[];
  finalIds: string[];
  improvementIds: string[];
} | null;

export type PreLaunchDoneInput = {
  softOpenChecks: Record<string, boolean>;
  softOpenPricing: string;
  softOpenSkips: Record<string, boolean>;
  preLaunchVisibleIds: PreLaunchVisibleIds;
};

export function getVisibleTaskProgressTasks(stageTasks: TaskState[]) {
  return stageTasks.filter((task) => task.taskId !== "cpa-decision-made");
}

export function calculatePreLaunchDoneMap({
  softOpenChecks,
  softOpenPricing,
  softOpenSkips,
  preLaunchVisibleIds,
}: PreLaunchDoneInput): Record<string, boolean> {
  const guestSelected = ["guest-family", "guest-neighbor", "guest-influencer", "guest-peer"].some(
    (key) => softOpenChecks[key],
  );
  const prepDone = ["prep-feedback-form", "prep-invite-sent", "prep-sns-plan"].every(
    (key) => softOpenChecks[key],
  );
  const softOpenDone = guestSelected && softOpenPricing !== "" && prepDone;

  if (!preLaunchVisibleIds) {
    return {
      "soft-open-done": softOpenDone,
      "feedback-collected": false,
      "final-checklist": false,
    };
  }

  const allDayChecked =
    preLaunchVisibleIds.dayIds.length > 0 &&
    preLaunchVisibleIds.dayIds.every((id) => softOpenChecks[id]);
  const allFeedbackChecked =
    preLaunchVisibleIds.feedbackIds.length > 0 &&
    preLaunchVisibleIds.feedbackIds.every((id) => softOpenChecks[id]);
  const allFinalResolved =
    preLaunchVisibleIds.finalIds.length > 0 &&
    preLaunchVisibleIds.finalIds.every((id) => softOpenChecks[id] || softOpenSkips[id]);
  const finalAtLeastOne = preLaunchVisibleIds.finalIds.some((id) => softOpenChecks[id]);

  return {
    "soft-open-done": softOpenDone,
    "feedback-collected": allDayChecked,
    "final-checklist": allFeedbackChecked && allFinalResolved && finalAtLeastOne,
  };
}

export function getStageGateTasks(stageId: string, stageTasks: TaskState[]) {
  return stageTasks.filter((task) => {
    if (task.required === false) {
      return false;
    }

    return stageId !== "go-live" || !GATE_OPTIONAL_TASK_IDS.has(task.taskId);
  });
}

export function isTaskCompleteForGate(
  task: TaskState,
  isPreLaunch: boolean,
  preLaunchDoneMap: Record<string, boolean>,
) {
  return isPreLaunch
    ? ((preLaunchDoneMap[task.taskId] ?? false) || task.status === "completed")
    : task.status === "completed";
}

export function calculateTaskGateSummary(
  stageId: string,
  stageTasks: TaskState[],
  preLaunchDoneMap: Record<string, boolean>,
): TaskGateSummary {
  const gateTasks = getStageGateTasks(stageId, stageTasks);
  const isPreLaunch = stageId === "pre-launch";
  const completedCount = gateTasks.filter((task) =>
    isTaskCompleteForGate(task, isPreLaunch, preLaunchDoneMap),
  ).length;

  return {
    gateTasks,
    completedCount,
    allDone: gateTasks.length > 0 && completedCount === gateTasks.length,
  };
}

export function calculateTaskProgressSummary(
  stageTasks: TaskState[],
  isPreLaunch: boolean,
  preLaunchDoneMap: Record<string, boolean>,
): TaskProgressSummary {
  const visibleTasks = getVisibleTaskProgressTasks(stageTasks);
  const visibleDone = visibleTasks.filter((task) =>
    isPreLaunch
      ? ((preLaunchDoneMap[task.taskId] ?? false) || task.status === "completed")
      : task.status === "completed",
  ).length;

  return { visibleTasks, visibleDone };
}
