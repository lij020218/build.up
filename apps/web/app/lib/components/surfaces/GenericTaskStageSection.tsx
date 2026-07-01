"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { usePageNavStore } from "../../stores/page-nav-store";
import { styles } from "../../styles";
import { FRANCHISE_INTERIOR_DATA } from "../stages/offline/franchise-interior-data";
import { shouldUseStrictFranchiseConstructionCopy } from "./construction-task-copy";
import { CurrentStageLockedHint, CurrentStagePageNav } from "./CurrentStagePageNav";
import { CurrentStageTaskProgress } from "./CurrentStageTaskProgress";
import {
  calculatePreLaunchDoneMap,
  calculateTaskGateSummary,
} from "./current-stage-task-progress";
import {
  getCompletedStageSaveLabel,
  getGenericTaskContinueLabel,
  getGenericTaskEditBackground,
  getGenericTaskEditLabel,
  getGenericTaskFooterMode,
  getLaunchButtonLabel,
  getScopedEditSaveStatus,
  shouldShowGenericTaskEditButton,
} from "./generic-task-footer-state";
import { GenericTaskChecklist } from "./GenericTaskChecklist";
import { getGenericTaskStageId } from "./generic-task-stage-routing";
import { GenericTaskStageBody } from "./GenericTaskStageBody";

export function GenericTaskStageSection() {
  const d = useDashboardCtx();
  const {
    businessLaunched,
    copy,
    correctedProgressPercent,
    currentStage,
    decisions,
    handleLaunchBusiness,
    handleStageContinue,
    handleStageEdit,
    handleTaskToggle,
    industryCategoryId,
    isViewingPastStage,
    language,
    localizedCurrentStage,
    persistCurrentState,
    preLaunchVisibleIds,
    prevTraversedStage,
    resetDemo,
    saveStatus,
    selectedFranchiseBrandId,
    setSaveStatus,
    setViewingStageId,
    softOpenChecks,
    softOpenPricing,
    softOpenSkips,
    startupType,
    taskMap,
  } = d;
  const pageNav = usePageNavStore((s) => s.nav);
  const hasMoreReadingPages = !!pageNav && pageNav.page < pageNav.totalPages - 1;
  const pageNavBlock = <CurrentStagePageNav language={language} pageNav={pageNav} />;
  const stageLockedHint = <CurrentStageLockedHint language={language} pageNav={pageNav} />;

  const stageId = getGenericTaskStageId(currentStage.code);
  const rawStageTasks = taskMap[stageId] ?? [];
  const foodLike = new Set(["food", "cafe-dessert"]);
  const stageTasks = rawStageTasks.filter((task) => {
    if (stageId === "contract-review" && task.taskId === "septic-tank-checked") {
      return industryCategoryId ? foodLike.has(industryCategoryId) : true;
    }

    return true;
  });
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
    currentStage.code === "construction_setup" && startupType === "franchise" && selectedFranchiseBrandId
      ? FRANCHISE_INTERIOR_DATA[selectedFranchiseBrandId]
      : undefined;
  const isStrictConstructionFranchise = shouldUseStrictFranchiseConstructionCopy({
    stageCode: currentStage.code,
    startupType,
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

  const navigateBack = () => {
    if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
    else setViewingStageId(null);
  };

  return (
    <>
      <div style={styles.helper}>{localizedCurrentStage.goal}</div>

      <GenericTaskStageBody />

      <CurrentStageTaskProgress
        language={language}
        stageTasks={stageTasks}
        isPreLaunch={isPreLaunch}
        preLaunchDoneMap={preLaunchDoneMap}
      />
      <GenericTaskChecklist
        decisions={decisions}
        industryCategoryId={industryCategoryId}
        isPreLaunch={isPreLaunch}
        isStrictConstructionFranchise={isStrictConstructionFranchise}
        language={language}
        onToggleTask={(taskId) => handleTaskToggle(stageId, taskId)}
        preLaunchDoneMap={preLaunchDoneMap}
        stageCode={currentStage.code}
        stageTasks={stageTasks}
      />
      {pageNavBlock}
      <div style={styles.stageFooter}>
        <button type="button" style={styles.button} onClick={navigateBack}>
          {language === "ko" ? "← 이전 단계" : "← Back"}
        </button>
        {footerMode === "page_locked" ? (
          stageLockedHint
        ) : footerMode === "save_completed" ? (
          <button
            type="button"
            disabled={saveStatus === "saving"}
            style={{
              ...styles.primaryButton,
              opacity: saveStatus === "saving" ? 0.6 : 1,
              background:
                saveStatus === "saved" ? "#1d3557" : saveStatus === "error" ? "#b64c4c" : undefined,
              transition: "background 0.2s, opacity 0.2s",
            }}
            onClick={async () => {
              setSaveStatus("saving");
              try {
                await persistCurrentState();
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
              } catch {
                setSaveStatus("error");
                setTimeout(() => setSaveStatus("idle"), 2500);
              }
            }}
          >
            {getCompletedStageSaveLabel(language, saveStatus)}
          </button>
        ) : footerMode === "launch" ? (
          <button
            type="button"
            style={{
              ...styles.primaryButton,
              opacity: allDone ? 1 : 0.45,
              background: allDone ? "linear-gradient(135deg, #1d3557, #30a84e)" : undefined,
            }}
            onClick={() => {
              handleStageContinue(stageId);
              handleLaunchBusiness();
            }}
            disabled={!allDone}
          >
            {getLaunchButtonLabel(language, industryCategoryId)}
          </button>
        ) : (
          <GenericTaskContinueActions
            allDone={allDone}
            isViewingPastStage={isViewingPastStage}
            stageId={stageId}
          />
        )}
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}

function GenericTaskContinueActions({
  allDone,
  isViewingPastStage,
  stageId,
}: {
  allDone: boolean;
  isViewingPastStage: boolean;
  stageId: string;
}) {
  const {
    decisions,
    editSaveStatus,
    handleStageContinue,
    handleStageEdit,
    language,
  } = useDashboardCtx();
  const isStageCompleted = shouldShowGenericTaskEditButton(
    decisions[stageId]?.completedAt,
    isViewingPastStage,
  );
  const editStatus = getScopedEditSaveStatus(editSaveStatus, stageId);
  const editLabel = getGenericTaskEditLabel(language, editStatus);
  const editBg = getGenericTaskEditBackground(editStatus);

  return (
    <>
      {isStageCompleted && (
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            opacity: allDone && editStatus !== "saving" ? 1 : 0.5,
            background: editBg,
            cursor: editStatus === "saving" ? "wait" : "pointer",
          }}
          onClick={() => {
            void handleStageEdit(stageId);
          }}
          disabled={!allDone || editStatus === "saving"}
        >
          {editLabel}
        </button>
      )}
      <button
        type="button"
        style={{
          ...styles.primaryButton,
          opacity: allDone ? 1 : 0.45,
        }}
        onClick={() => handleStageContinue(stageId)}
        disabled={!allDone}
      >
        {getGenericTaskContinueLabel(language)}
      </button>
    </>
  );
}
