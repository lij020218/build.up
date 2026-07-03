"use client";

import { CONTRACT_REVIEW_CONTENT } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { StageContentRenderer } from "../stages/shared/StageContentRenderer";
import { getContractReviewGateState } from "./contract-review-footer-state";
import { ContractReviewStageFooter } from "./ContractReviewStageFooter";
import { CurrentStageNavigationFrame } from "./CurrentStageNavigationFrame";
import { getContractReviewFooterAdapterProps } from "./current-stage-footer-adapters";
import { useCurrentStageNavigation } from "./use-current-stage-navigation";

export function ContractReviewStageSection() {
  const d = useDashboardCtx();
  const {
    copy,
    decisions,
    editSaveStatus,
    handleContractContinue,
    handleStageEdit,
    isViewingPastStage,
    resetDemo,
  } = d;
  const {
    hasMoreReadingPages,
    language,
    navigateBack,
    pageNav,
  } = useCurrentStageNavigation();
  const gateState = getContractReviewGateState(CONTRACT_REVIEW_CONTENT, d.contractSubChecks ?? {});
  const footerAdapterProps = getContractReviewFooterAdapterProps({
    decisions,
    editSaveStatus,
    isViewingPastStage,
    onContinue: handleContractContinue,
    onEditStage: handleStageEdit,
  });

  return (
    <>
      <StageContentRenderer content={CONTRACT_REVIEW_CONTENT} />
      <CurrentStageNavigationFrame
        language={language}
        pageNav={pageNav}
        renderFooter={(stageLockedContent) => (
          <ContractReviewStageFooter
            editStatus={footerAdapterProps.editStatus}
            gateState={gateState}
            hasMoreReadingPages={hasMoreReadingPages}
            isStageCompleted={footerAdapterProps.isStageCompleted}
            language={language}
            onBack={navigateBack}
            onContinue={footerAdapterProps.onContinue}
            onEdit={footerAdapterProps.onEdit}
            onReset={resetDemo}
            resetLabel={copy.common.resetDemo}
            stageLockedContent={stageLockedContent}
          />
        )}
      />
    </>
  );
}
