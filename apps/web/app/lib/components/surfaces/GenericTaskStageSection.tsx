"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { CurrentStageTaskProgress } from "./CurrentStageTaskProgress";
import { GenericTaskChecklist } from "./GenericTaskChecklist";
import { getGenericTaskStageState } from "./generic-task-stage-state";
import { GenericTaskStageBody } from "./GenericTaskStageBody";
import { GenericTaskStageFooter } from "./GenericTaskStageFooter";
import { useCurrentStageNavigation } from "./use-current-stage-navigation";

export function GenericTaskStageSection() {
  const d = useDashboardCtx();
  const {
    businessLaunched,
    correctedProgressPercent,
    currentStage,
    decisions,
    handleTaskToggle,
    industryCategoryId,
    isViewingPastStage,
    localizedCurrentStage,
    preLaunchVisibleIds,
    selectedFranchiseBrandId,
    softOpenChecks,
    softOpenPricing,
    softOpenSkips,
    startupType,
    taskMap,
  } = d;
  const {
    hasMoreReadingPages,
    language,
    navigateBack,
    pageNavBlock,
    stageLockedHint,
  } = useCurrentStageNavigation();
  const stageState = getGenericTaskStageState({
    businessLaunched,
    correctedProgressPercent,
    hasMoreReadingPages,
    preLaunchVisibleIds,
    selectedFranchiseBrandId,
    softOpenChecks,
    softOpenPricing,
    softOpenSkips,
    stageCode: currentStage.code,
    startupType,
    taskMap,
  });

  return (
    <>
      <div style={styles.helper}>{localizedCurrentStage.goal}</div>

      <GenericTaskStageBody />

      <CurrentStageTaskProgress
        language={language}
        stageTasks={stageState.stageTasks}
        isPreLaunch={stageState.isPreLaunch}
        preLaunchDoneMap={stageState.preLaunchDoneMap}
      />
      <GenericTaskChecklist
        decisions={decisions}
        industryCategoryId={industryCategoryId}
        isPreLaunch={stageState.isPreLaunch}
        isStrictConstructionFranchise={stageState.isStrictConstructionFranchise}
        language={language}
        onToggleTask={(taskId) => handleTaskToggle(stageState.stageId, taskId)}
        preLaunchDoneMap={stageState.preLaunchDoneMap}
        stageCode={currentStage.code}
        stageTasks={stageState.stageTasks}
      />
      {pageNavBlock}
      <GenericTaskStageFooter
        allDone={stageState.allDone}
        footerMode={stageState.footerMode}
        isViewingPastStage={isViewingPastStage}
        onBack={navigateBack}
        stageId={stageState.stageId}
        stageLockedContent={stageLockedHint}
      />
    </>
  );
}
