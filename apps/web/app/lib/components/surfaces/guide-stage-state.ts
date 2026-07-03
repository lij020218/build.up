import type { Language } from "@foundone/shared";
import { TAX_GUIDE_CONTENT } from "@foundone/shared";
import {
  calculateChecklistGateSummary,
  getLoanFinalReviewLabel,
  getLoanFinalReviewTitle,
  getTaxReviewLabel,
  getTaxReviewTitle,
  isLoanFinalReviewChecked,
  type ChecklistGateSummary,
} from "./guide-verification-footer-state";

export type GuideStageKind = "tax_guide" | "loan_guide" | "unsupported";
export type SupportedGuideStageKind = Exclude<GuideStageKind, "unsupported">;
export type GuideVerificationStageId = "tax-guide" | "loan-guide";

export type GuideVerificationFooterState = {
  label: string;
  ready: boolean;
  stageId: GuideVerificationStageId;
  title: string | undefined;
};

export function getGuideStageKind(stageCode: string): GuideStageKind {
  if (stageCode === "tax_guide") {
    return "tax_guide";
  }

  if (stageCode === "loan_guide") {
    return "loan_guide";
  }

  return "unsupported";
}

export function getTaxGuideGateState({
  industryCategoryId,
  taxChecks,
}: {
  industryCategoryId: string | null | undefined;
  taxChecks: Record<string, boolean>;
}): ChecklistGateSummary {
  const taxItems =
    (TAX_GUIDE_CONTENT.byCategory[industryCategoryId ?? "food"] ?? TAX_GUIDE_CONTENT.byCategory.food)
      .taxChecklist ?? [];

  return calculateChecklistGateSummary(taxItems, taxChecks);
}

export function getLoanGuideReviewState(loanChecks: Record<string, boolean>) {
  return isLoanFinalReviewChecked(loanChecks);
}

type GuideVerificationFooterStateInput<TGuideStageKind extends GuideStageKind = GuideStageKind> = {
  guideStageKind: TGuideStageKind;
  industryCategoryId: string | null | undefined;
  language: Language;
  loanChecks: Record<string, boolean>;
  reviewedLabels: {
    loan: string;
    tax: string;
  };
  taxChecks: Record<string, boolean>;
};

export function getGuideVerificationFooterState(
  input: GuideVerificationFooterStateInput<SupportedGuideStageKind>,
): GuideVerificationFooterState;
export function getGuideVerificationFooterState(
  input: GuideVerificationFooterStateInput,
): GuideVerificationFooterState | null;
export function getGuideVerificationFooterState({
  guideStageKind,
  industryCategoryId,
  language,
  loanChecks,
  reviewedLabels,
  taxChecks,
}: GuideVerificationFooterStateInput): GuideVerificationFooterState | null {
  if (guideStageKind === "tax_guide") {
    const taxGate = getTaxGuideGateState({ industryCategoryId, taxChecks });

    return {
      label: getTaxReviewLabel(language, taxGate, reviewedLabels.tax),
      ready: taxGate.allDone,
      stageId: "tax-guide",
      title: getTaxReviewTitle(language, taxGate),
    };
  }

  if (guideStageKind === "loan_guide") {
    const loanReviewed = getLoanGuideReviewState(loanChecks);

    return {
      label: getLoanFinalReviewLabel(language, loanReviewed, reviewedLabels.loan),
      ready: loanReviewed,
      stageId: "loan-guide",
      title: getLoanFinalReviewTitle(language, loanReviewed),
    };
  }

  return null;
}
