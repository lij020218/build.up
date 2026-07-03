"use client";

import type { ReactNode } from "react";
import { TAX_GUIDE_CONTENT } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { LoanGuideStage } from "../stages/shared-tail/LoanGuideStage";
import { StageContentRenderer } from "../stages/shared/StageContentRenderer";
import { CurrentStageNavigationFrame } from "./CurrentStageNavigationFrame";
import { GuideVerificationFooter } from "./GuideVerificationFooter";
import {
  getGuideVerificationFooterState,
  getGuideStageKind,
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
    pageNav,
  } = useCurrentStageNavigation();
  const guideStageKind = getGuideStageKind(currentStage.code);

  if (guideStageKind === "unsupported") {
    return null;
  }

  const footerState = getGuideVerificationFooterState({
    guideStageKind,
    industryCategoryId,
    language,
    loanChecks,
    reviewedLabels: {
      loan: copy.home.markLoanReviewed,
      tax: copy.home.markTaxReviewed,
    },
    taxChecks,
  });

  function renderFooter(stageLockedContent: ReactNode) {
    return (
      <GuideVerificationFooter
        language={language}
        hasMoreReadingPages={hasMoreReadingPages}
        lockedContent={stageLockedContent}
        ready={footerState.ready}
        title={footerState.title}
        label={footerState.label}
        onBack={navigateBack}
        onConfirm={() => handleVerificationContinue(footerState.stageId)}
      />
    );
  }

  if (guideStageKind === "tax_guide") {
    return (
      <>
        <StageContentRenderer content={TAX_GUIDE_CONTENT} />
        <CurrentStageNavigationFrame
          language={language}
          pageNav={pageNav}
          renderFooter={renderFooter}
        />
      </>
    );
  }

  if (guideStageKind === "loan_guide") {
    return (
      <>
        <LoanGuideStage />
        <CurrentStageNavigationFrame
          language={language}
          pageNav={pageNav}
          renderFooter={renderFooter}
        />
      </>
    );
  }

  return null;
}
