"use client";

import { CONTRACT_REVIEW_CONTENT } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { StageContentRenderer } from "../stages/shared/StageContentRenderer";
import { getContractReviewGateState } from "./contract-review-footer-state";
import { ContractReviewStageFooter } from "./ContractReviewStageFooter";
import { useCurrentStageNavigation } from "./use-current-stage-navigation";

export function ContractReviewStageSection() {
  const d = useDashboardCtx();
  const {
    hasMoreReadingPages,
    navigateBack,
    pageNavBlock,
    stageLockedHint,
  } = useCurrentStageNavigation();
  const gateState = getContractReviewGateState(CONTRACT_REVIEW_CONTENT, d.contractSubChecks ?? {});

  return (
    <>
      <StageContentRenderer content={CONTRACT_REVIEW_CONTENT} />
      {pageNavBlock}
      <ContractReviewStageFooter
        gateState={gateState}
        hasMoreReadingPages={hasMoreReadingPages}
        onBack={navigateBack}
        stageLockedContent={stageLockedHint}
      />
    </>
  );
}
