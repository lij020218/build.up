import { isCurrentStageSelectionCode } from "./current-stage-selection-routing";
import { isGenericTaskStageCode } from "./generic-task-stage-routing";

export type CurrentStageViewMode =
  | "launched_summary"
  | "roadmap_complete"
  | "active_stage";

export type CurrentStageBodyKind =
  | "selection"
  | "contract_review"
  | "generic_task"
  | "guide"
  | "fallback";

export function getCurrentStageViewMode({
  allStagesDone,
  businessLaunched,
  viewingStageId,
}: {
  allStagesDone: boolean;
  businessLaunched: boolean;
  viewingStageId: string | null;
}): CurrentStageViewMode {
  if (businessLaunched && !viewingStageId) {
    return "launched_summary";
  }

  if (allStagesDone) {
    return "roadmap_complete";
  }

  return "active_stage";
}

export function getCurrentStageBodyKind({
  isGuideStage,
  stageCode,
}: {
  isGuideStage: boolean;
  stageCode: string;
}): CurrentStageBodyKind {
  if (isCurrentStageSelectionCode(stageCode)) {
    return "selection";
  }

  if (stageCode === "contract_review") {
    return "contract_review";
  }

  if (isGenericTaskStageCode(stageCode)) {
    return "generic_task";
  }

  if (isGuideStage) {
    return "guide";
  }

  return "fallback";
}
