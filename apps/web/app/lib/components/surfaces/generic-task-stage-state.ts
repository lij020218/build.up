import type { TaskState, WorkflowTaskMap } from "@foundone/shared";
import { FRANCHISE_INTERIOR_DATA } from "../stages/offline/franchise-interior-data";
import { shouldUseStrictFranchiseConstructionCopy } from "./construction-task-copy";
import {
  calculatePreLaunchDoneMap,
  calculateTaskGateSummary,
  type PreLaunchVisibleIds,
} from "./current-stage-task-progress";
import {
  getGenericTaskFooterMode,
  type GenericTaskFooterMode,
} from "./generic-task-footer-state";
import { getGenericTaskStageId } from "./generic-task-stage-routing";

export type GenericTaskStageState = {
  allDone: boolean;
  footerMode: GenericTaskFooterMode;
  isPreLaunch: boolean;
  isStrictConstructionFranchise: boolean;
  preLaunchDoneMap: Record<string, boolean>;
  stageId: string;
  stageTasks: TaskState[];
};

export function getGenericTaskStageState({
  businessLaunched,
  correctedProgressPercent,
  hasMoreReadingPages,
  preLaunchVisibleIds,
  selectedFranchiseBrandId,
  softOpenChecks,
  softOpenPricing,
  softOpenSkips,
  stageCode,
  startupType,
  taskMap,
}: {
  businessLaunched: boolean;
  correctedProgressPercent: number;
  hasMoreReadingPages: boolean;
  preLaunchVisibleIds: PreLaunchVisibleIds;
  selectedFranchiseBrandId: string | null | undefined;
  softOpenChecks: Record<string, boolean>;
  softOpenPricing: string;
  softOpenSkips: Record<string, boolean>;
  stageCode: string;
  startupType: string | null | undefined;
  taskMap: WorkflowTaskMap;
}): GenericTaskStageState {
  const stageId = getGenericTaskStageId(stageCode);
  const stageTasks = taskMap[stageId] ?? [];
  const isPreLaunch = stageId === "pre-launch";
  const preLaunchDoneMap = isPreLaunch
    ? calculatePreLaunchDoneMap({
        softOpenChecks,
        softOpenPricing,
        softOpenSkips,
        preLaunchVisibleIds,
      })
    : {};
  const constructionFranchiseData =
    stageCode === "construction_setup" && startupType === "franchise" && selectedFranchiseBrandId
      ? FRANCHISE_INTERIOR_DATA[selectedFranchiseBrandId]
      : undefined;
  const isStrictConstructionFranchise = shouldUseStrictFranchiseConstructionCopy({
    stageCode,
    startupType: startupType ?? undefined,
    selectedFranchiseBrandId,
    franchiseFlexibility: constructionFranchiseData?.flexibility,
  });
  const { allDone } = calculateTaskGateSummary(stageId, stageTasks, preLaunchDoneMap);
  const footerMode = getGenericTaskFooterMode({
    hasMoreReadingPages,
    correctedProgressPercent,
    stageId,
    businessLaunched,
  });

  return {
    allDone,
    footerMode,
    isPreLaunch,
    isStrictConstructionFranchise,
    preLaunchDoneMap,
    stageId,
    stageTasks,
  };
}
