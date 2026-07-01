"use client";

import { CONTRACT_REVIEW_CONTENT } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { usePageNavStore } from "../../stores/page-nav-store";
import { styles } from "../../styles";
import { StageContentRenderer } from "../stages/shared/StageContentRenderer";
import {
  getContractReviewContinueLabel,
  getContractReviewEditLabel,
  getContractReviewGateState,
} from "./contract-review-footer-state";
import { CurrentStageLockedHint, CurrentStagePageNav } from "./CurrentStagePageNav";

export function ContractReviewStageSection() {
  const d = useDashboardCtx();
  const {
    copy,
    decisions,
    handleContractContinue,
    handleStageEdit,
    isViewingPastStage,
    language,
    prevTraversedStage,
    resetDemo,
    setViewingStageId,
  } = d;
  const pageNav = usePageNavStore((s) => s.nav);
  const hasMoreReadingPages = !!pageNav && pageNav.page < pageNav.totalPages - 1;
  const pageNavBlock = <CurrentStagePageNav language={language} pageNav={pageNav} />;
  const stageLockedHint = <CurrentStageLockedHint language={language} pageNav={pageNav} />;
  const gateState = getContractReviewGateState(CONTRACT_REVIEW_CONTENT, d.contractSubChecks ?? {});
  const isStageCompleted = !!decisions["contract-review"]?.completedAt && isViewingPastStage;
  const editStatus = d.editSaveStatus?.stageId === "contract-review" ? d.editSaveStatus.status : null;
  const editLabel = getContractReviewEditLabel(language, editStatus);
  const continueLabel = getContractReviewContinueLabel(language, gateState);

  const navigateBack = () => {
    if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
    else setViewingStageId(null);
  };

  return (
    <>
      <StageContentRenderer content={CONTRACT_REVIEW_CONTENT} />
      {pageNavBlock}
      <div style={styles.stageFooter}>
        <button type="button" style={styles.button} onClick={navigateBack}>
          {language === "ko" ? "← 이전 단계" : "← Back"}
        </button>
        {isStageCompleted && (
          <button
            type="button"
            style={{
              ...styles.primaryButton,
              opacity: gateState.canContinue && editStatus !== "saving" ? 1 : 0.5,
              background: editStatus === "error" ? "#b64c4c" : "#1d3557",
              cursor: editStatus === "saving" ? "wait" : "pointer",
            }}
            disabled={editStatus === "saving"}
            onClick={() => {
              if (!gateState.canContinue) return;
              void handleStageEdit("contract-review");
            }}
          >
            {editLabel}
          </button>
        )}
        {hasMoreReadingPages ? (
          stageLockedHint
        ) : (
          <button
            type="button"
            style={{
              ...styles.primaryButton,
              opacity: gateState.canContinue ? 1 : 0.45,
              cursor: gateState.canContinue ? "pointer" : "not-allowed",
            }}
            disabled={!gateState.canContinue}
            onClick={() => {
              if (!gateState.canContinue) return;
              handleContractContinue();
            }}
          >
            {continueLabel}
          </button>
        )}
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
