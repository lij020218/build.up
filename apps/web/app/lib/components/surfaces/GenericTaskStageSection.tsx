"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { CurrentStageNavigationFrame } from "./CurrentStageNavigationFrame";
import { CurrentStageTaskProgress } from "./CurrentStageTaskProgress";
import { getGenericTaskFooterAdapterProps } from "./current-stage-footer-adapters";
import { getSelectedFranchiseFlexibility } from "./franchise-flexibility-adapter";
import { GenericTaskChecklist } from "./GenericTaskChecklist";
import { getGenericTaskStageState } from "./generic-task-stage-state";
import { GenericTaskStageBody } from "./GenericTaskStageBody";
import { GenericTaskStageFooter } from "./GenericTaskStageFooter";
import { useCurrentStageNavigation } from "./use-current-stage-navigation";

export function GenericTaskStageSection() {
  const d = useDashboardCtx();
  const {
    businessLaunched,
    copy,
    correctedProgressPercent,
    currentStage,
    decisions,
    editSaveStatus,
    handleLaunchBusiness,
    handleStageContinue,
    handleStageEdit,
    handleTaskToggle,
    industryCategoryId,
    isViewingPastStage,
    localizedCurrentStage,
    persistCurrentState,
    preLaunchVisibleIds,
    resetDemo,
    saveStatus,
    selectedFranchiseBrandId,
    setSaveStatus,
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
    pageNav,
  } = useCurrentStageNavigation();
  const franchiseFlexibility =
    getSelectedFranchiseFlexibility({
      selectedFranchiseBrandId,
      stageCode: currentStage.code,
      startupType,
    });
  const stageState = getGenericTaskStageState({
    businessLaunched,
    correctedProgressPercent,
    franchiseFlexibility,
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
  const footerAdapterProps = getGenericTaskFooterAdapterProps({
    decisions,
    editSaveStatus,
    isViewingPastStage,
    onContinueStage: handleStageContinue,
    onEditStage: handleStageEdit,
    stageId: stageState.stageId,
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
      <CurrentStageNavigationFrame
        language={language}
        pageNav={pageNav}
        renderFooter={(stageLockedContent) => (
          <GenericTaskStageFooter
            allDone={stageState.allDone}
            editStatus={footerAdapterProps.editStatus}
            footerMode={stageState.footerMode}
            industryCategoryId={industryCategoryId}
            isStageCompleted={footerAdapterProps.isStageCompleted}
            language={language}
            onBack={navigateBack}
            onContinueStage={footerAdapterProps.onContinueStage}
            onEditStage={footerAdapterProps.onEditStage}
            onLaunchBusiness={handleLaunchBusiness}
            onPersistCurrentState={persistCurrentState}
            onReset={resetDemo}
            onSetSaveStatus={setSaveStatus}
            resetLabel={copy.common.resetDemo}
            saveStatus={saveStatus}
            stageId={stageState.stageId}
            stageLockedContent={stageLockedContent}
          />
        )}
      />
    </>
  );
}
