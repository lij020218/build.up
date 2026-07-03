import { TAX_GUIDE_CONTENT } from "@foundone/shared";
import {
  calculateChecklistGateSummary,
  isLoanFinalReviewChecked,
  type ChecklistGateSummary,
} from "./guide-verification-footer-state";

export type GuideStageKind = "tax_guide" | "loan_guide" | "unsupported";

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
