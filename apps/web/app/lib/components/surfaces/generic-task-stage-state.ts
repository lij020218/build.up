import type { TaskState, WorkflowTaskMap } from "@foundone/shared";
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
import type { FranchiseFlexibility } from "./franchise-flexibility-adapter";

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
  franchiseFlexibility,
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
  franchiseFlexibility?: FranchiseFlexibility;
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
  const isStrictConstructionFranchise = shouldUseStrictFranchiseConstructionCopy({
    stageCode,
    startupType: startupType ?? undefined,
    selectedFranchiseBrandId,
    franchiseFlexibility,
  });
  const { allDone: gateAllDone } = calculateTaskGateSummary(stageId, stageTasks, preLaunchDoneMap);
  // financial-review(월 운영비)는 taskMap 게이트 태스크가 없어 자체 "확인" UI로 완료하는 스테이지.
  //   calculateTaskGateSummary 는 gateTasks.length===0 이면 allDone=false 를 주므로, 하단 공통
  //   "다음 단계로" 푸터가 영구 비활성화됐음(중간 "저장하고 다음"만 동작). 자체 완료 스테이지라 continue 허용.
  const allDone = stageId === "financial-review" ? true : gateAllDone;
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
