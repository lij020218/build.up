import { localizeTaskTitle, type Language, type TaskState, type WorkflowDecisionMap } from "@foundone/shared";
import {
  getConstructionTaskHint,
  getConstructionTaskTitleOverride,
} from "./construction-task-copy";
import {
  evaluateTaskChecklistGate,
  getPreLaunchTaskHint,
  type TaskChecklistGate,
} from "./task-checklist-gates";

export type GenericTaskChecklistItemState = {
  constructionHint: string | null;
  done: boolean;
  gate: TaskChecklistGate;
  preLaunchHint: string | null;
  title: string;
};

export function getGenericTaskChecklistItemState({
  decisions,
  industryCategoryId,
  subIndustryId,
  isPreLaunch,
  isStrictConstructionFranchise,
  language,
  preLaunchDoneMap,
  stageCode,
  task,
}: {
  decisions: WorkflowDecisionMap;
  industryCategoryId: string | null | undefined;
  /** 세부 업종 — 디지털 콘텐츠(무배송) 서브타입의 "{taskId}__digital" 라벨 오버라이드용. */
  subIndustryId?: string | null;
  isPreLaunch: boolean;
  isStrictConstructionFranchise: boolean;
  language: Language;
  preLaunchDoneMap: Record<string, boolean>;
  stageCode: string;
  task: TaskState;
}): GenericTaskChecklistItemState {
  const done = isPreLaunch
    ? (preLaunchDoneMap[task.taskId] ?? false) || task.status === "completed"
    : task.status === "completed";
  const gate = evaluateTaskChecklistGate(task.taskId, decisions);
  const preLaunchHint = getPreLaunchTaskHint(language, isPreLaunch, done);
  const constructionTitleOverride =
    stageCode === "construction_setup"
      ? getConstructionTaskTitleOverride(
          task.taskId,
          language,
          isStrictConstructionFranchise,
        )
      : null;
  const constructionHint =
    !done && stageCode === "construction_setup"
      ? getConstructionTaskHint(
          task.taskId,
          language,
          isStrictConstructionFranchise,
        )
      : null;

  return {
    constructionHint,
    done,
    gate,
    preLaunchHint,
    title:
      constructionTitleOverride ??
      localizeTaskTitle(task.taskId, language, industryCategoryId ?? undefined, subIndustryId ?? undefined) ??
      task.title,
  };
}
