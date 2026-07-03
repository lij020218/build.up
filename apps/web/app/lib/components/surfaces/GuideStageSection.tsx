"use client";

import { TAX_GUIDE_CONTENT } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { LoanGuideStage } from "../stages/shared-tail/LoanGuideStage";
import { StageContentRenderer } from "../stages/shared/StageContentRenderer";
import {
  getLoanFinalReviewLabel,
  getLoanFinalReviewTitle,
  getTaxReviewLabel,
  getTaxReviewTitle,
} from "./guide-verification-footer-state";
import { GuideVerificationFooter } from "./GuideVerificationFooter";
import {
  getGuideStageKind,
  getLoanGuideReviewState,
  getTaxGuideGateState,
} from "./guide-stage-state";
import { useCurrentStageNavigation } from "./use-current-stage-navigation";

export function GuideStageSection() {
  const d = useDashboardCtx();
  const {
    copy,
    currentStage,
    handleVerificationContinue,
    industryCategoryId,
    loanChecks,
    taxChecks,
  } = d;
  const {
    hasMoreReadingPages,
    language,
    navigateBack,
    pageNavBlock,
    stageLockedHint,
  } = useCurrentStageNavigation();
  const guideStageKind = getGuideStageKind(currentStage.code);

  if (guideStageKind === "tax_guide") {
    const taxGate = getTaxGuideGateState({ industryCategoryId, taxChecks });

    return (
      <>
        <StageContentRenderer content={TAX_GUIDE_CONTENT} />
        {pageNavBlock}
        <GuideVerificationFooter
          language={language}
          hasMoreReadingPages={hasMoreReadingPages}
          lockedContent={stageLockedHint}
          ready={taxGate.allDone}
          title={getTaxReviewTitle(language, taxGate)}
          label={getTaxReviewLabel(language, taxGate, copy.home.markTaxReviewed)}
          onBack={navigateBack}
          onConfirm={() => handleVerificationContinue("tax-guide")}
        />
      </>
    );
  }

  if (guideStageKind === "loan_guide") {
    const loanReviewed = getLoanGuideReviewState(loanChecks);

    return (
      <>
        <LoanGuideStage />
        {pageNavBlock}
        <GuideVerificationFooter
          language={language}
          hasMoreReadingPages={hasMoreReadingPages}
          lockedContent={stageLockedHint}
          ready={loanReviewed}
          title={getLoanFinalReviewTitle(language, loanReviewed)}
          label={getLoanFinalReviewLabel(language, loanReviewed, copy.home.markLoanReviewed)}
          onBack={navigateBack}
          onConfirm={() => handleVerificationContinue("loan-guide")}
        />
      </>
    );
  }

  return null;
}
