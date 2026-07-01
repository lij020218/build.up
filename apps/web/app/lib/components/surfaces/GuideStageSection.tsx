"use client";

import { TAX_GUIDE_CONTENT } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { usePageNavStore } from "../../stores/page-nav-store";
import { LoanGuideStage } from "../stages/shared-tail/LoanGuideStage";
import { StageContentRenderer } from "../stages/shared/StageContentRenderer";
import { CurrentStageLockedHint, CurrentStagePageNav } from "./CurrentStagePageNav";
import {
  calculateChecklistGateSummary,
  getLoanFinalReviewLabel,
  getLoanFinalReviewTitle,
  getTaxReviewLabel,
  getTaxReviewTitle,
  isLoanFinalReviewChecked,
} from "./guide-verification-footer-state";
import { GuideVerificationFooter } from "./GuideVerificationFooter";
import { LegacyLoanGuideFallback } from "./LegacyLoanGuideFallback";

export function GuideStageSection() {
  const d = useDashboardCtx();
  const {
    copy,
    currentStage,
    guideQuestion,
    handleKnowledgeQuestion,
    handleVerificationContinue,
    industryCategoryId,
    knowledgeQaError,
    knowledgeQaStatus,
    knowledgeQaText,
    language,
    loanChecks,
    prevTraversedStage,
    savedGuideQaSnapshot,
    setGuideQuestion,
    setLoanChecks,
    setViewingStageId,
    taxChecks,
  } = d;
  const pageNav = usePageNavStore((s) => s.nav);
  const hasMoreReadingPages = !!pageNav && pageNav.page < pageNav.totalPages - 1;
  const pageNavBlock = <CurrentStagePageNav language={language} pageNav={pageNav} />;
  const stageLockedHint = <CurrentStageLockedHint language={language} pageNav={pageNav} />;
  const navigateBackFromStage = () => {
    if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
    else setViewingStageId(null);
  };

  if (currentStage.code === "tax_guide") {
    const taxItems =
      (TAX_GUIDE_CONTENT.byCategory[industryCategoryId ?? "food"] ?? TAX_GUIDE_CONTENT.byCategory.food)
        .taxChecklist ?? [];
    const taxGate = calculateChecklistGateSummary(taxItems, taxChecks);

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
          onBack={navigateBackFromStage}
          onConfirm={() => handleVerificationContinue("tax-guide")}
        />
      </>
    );
  }

  if (currentStage.code === "loan_guide") {
    const loanReviewed = isLoanFinalReviewChecked(loanChecks);

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
          onBack={navigateBackFromStage}
          onConfirm={() => handleVerificationContinue("loan-guide")}
        />
      </>
    );
  }

  return (
    <LegacyLoanGuideFallback
      guideQuestion={guideQuestion}
      handleKnowledgeQuestion={handleKnowledgeQuestion}
      knowledgeQaError={knowledgeQaError}
      knowledgeQaStatus={knowledgeQaStatus}
      knowledgeQaText={knowledgeQaText}
      language={language}
      loanChecks={loanChecks}
      markLoanReviewedLabel={copy.home.markLoanReviewed}
      onBack={navigateBackFromStage}
      onConfirm={() => handleVerificationContinue("loan-guide")}
      savedGuideQaSnapshot={savedGuideQaSnapshot}
      setGuideQuestion={setGuideQuestion}
      setLoanChecks={setLoanChecks}
    />
  );
}
