"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { ContractReviewStageSection } from "./ContractReviewStageSection";
import { CurrentStageDefaultSection } from "./CurrentStageDefaultSection";
import { CurrentStageHeader } from "./CurrentStageHeader";
import { CurrentStageSelectionContent } from "./CurrentStageSelectionContent";
import {
  getCurrentStageBodyKind,
  getCurrentStageViewMode,
} from "./current-stage-view-routing";
import { GenericTaskStageSection } from "./GenericTaskStageSection";
import { GuideStageSection } from "./GuideStageSection";
import { LaunchedBusinessSummaryView } from "./LaunchedBusinessSummaryView";
import { RoadmapCompleteView } from "./RoadmapCompleteView";

export function CurrentStageView() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    navigateToSurface,
    businessLaunched,
    storeName,
    dailyEntries,
    monthlyCosts,
    dailyDateInput,
    setDailyDateInput,
    dailySalesInput,
    setDailySalesInput,
    dailyCustomersInput,
    setDailyCustomersInput,
    handleAddDailyEntry,
    viewingStageId,
    allStagesDone,
    pathTotalStages,
    pathStepNumber,
    currentStage,
    localizedCurrentStage,
    transitionNotice,
    isFreshAccount,
    persistenceLabel,
    isViewingPastStage,
    isGuideStage,
    handleLaunchBusiness,
  } = d;
  const viewMode = getCurrentStageViewMode({
    allStagesDone,
    businessLaunched,
    viewingStageId,
  });
  const bodyKind = getCurrentStageBodyKind({
    isGuideStage,
    stageCode: currentStage.code,
  });

  return (
    <>
      {/* 초기화 확인 모달은 starter-stage-demo 최상단으로 이관(모든 surface 에서 동작).
          여기서 중복 렌더하면 모달이 2개 마운트돼 confirm 이 executeResetDemo 를 두 번 호출. */}
      {viewMode === "launched_summary" ? (
        <LaunchedBusinessSummaryView
          language={language}
          storeName={storeName}
          dailyEntries={dailyEntries}
          monthlyCosts={monthlyCosts}
          dailyDateInput={dailyDateInput}
          setDailyDateInput={setDailyDateInput}
          dailySalesInput={dailySalesInput}
          setDailySalesInput={setDailySalesInput}
          dailyCustomersInput={dailyCustomersInput}
          setDailyCustomersInput={setDailyCustomersInput}
          handleAddDailyEntry={handleAddDailyEntry}
          navigateToSurface={navigateToSurface}
        />
      ) : viewMode === "roadmap_complete" ? (
        <RoadmapCompleteView
          language={language}
          pathTotalStages={pathTotalStages}
          handleLaunchBusiness={handleLaunchBusiness}
          navigateToSurface={navigateToSurface}
        />
      ) : (
        <section style={styles.section}>
          <div style={styles.sectionTitle}>{copy.home.today}</div>
          <article style={styles.currentStage}>
            <CurrentStageHeader
              language={language}
              pathStepNumber={pathStepNumber}
              pathTotalStages={pathTotalStages}
              stageType={currentStage.type}
              title={localizedCurrentStage.title}
              goal={localizedCurrentStage.goal}
              transitionNotice={transitionNotice}
              isFreshAccount={isFreshAccount}
              persistenceLabel={persistenceLabel}
              isViewingPastStage={isViewingPastStage}
              navigateToSurface={navigateToSurface}
            />

            {bodyKind === "selection" ? (
              <CurrentStageSelectionContent stageCode={currentStage.code} />
            ) : bodyKind === "contract_review" ? (
              <ContractReviewStageSection />
            ) : bodyKind === "generic_task" ? (
              <GenericTaskStageSection />
            ) : bodyKind === "guide" ? (
              <GuideStageSection />
            ) : (
              <CurrentStageDefaultSection />
            )}
          </article>
        </section>
      )}
    </>
  );
}
