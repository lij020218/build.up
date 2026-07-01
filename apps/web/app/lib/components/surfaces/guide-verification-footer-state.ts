import type { Language } from "@foundone/shared";

type ChecklistItem = {
  id: string;
};

export type ChecklistGateSummary = {
  doneCount: number;
  totalCount: number;
  allDone: boolean;
};

export type LegacyLoanGateSummary = {
  eligDone: number;
  eligTotal: number;
  docDone: number;
  docTotal: number;
  allDone: boolean;
};

export function calculateChecklistGateSummary(
  items: ChecklistItem[],
  checks: Record<string, boolean>,
): ChecklistGateSummary {
  const doneCount = items.filter((item) => checks[item.id]).length;

  return {
    doneCount,
    totalCount: items.length,
    allDone: items.length > 0 && doneCount === items.length,
  };
}

export function getTaxReviewTitle(
  language: Language,
  summary: ChecklistGateSummary,
) {
  if (summary.allDone) {
    return undefined;
  }

  return language === "ko"
    ? `필수 세팅 ${summary.doneCount}/${summary.totalCount} — 「필수 세팅」 탭에서 모두 체크 후 진행`
    : `Complete all ${summary.totalCount} setup items first`;
}

export function getTaxReviewLabel(
  language: Language,
  summary: ChecklistGateSummary,
  reviewedLabel: string,
) {
  if (summary.allDone) {
    return reviewedLabel;
  }

  return language === "ko"
    ? `↑ 필수 세팅 ${summary.doneCount}/${summary.totalCount}`
    : `↑ Setup ${summary.doneCount}/${summary.totalCount}`;
}

export function isLoanFinalReviewChecked(loanChecks: Record<string, boolean>) {
  return !!loanChecks["loan-final-review"];
}

export function getLoanFinalReviewTitle(language: Language, reviewed: boolean) {
  if (reviewed) {
    return undefined;
  }

  return language === "ko"
    ? "위 「검토했습니다」 박스 체크 후 진행 가능"
    : "Tick the 'I have reviewed' box above first";
}

export function getLoanFinalReviewLabel(
  language: Language,
  reviewed: boolean,
  reviewedLabel: string,
) {
  if (reviewed) {
    return reviewedLabel;
  }

  return language === "ko"
    ? "↑ 검토 완료 박스 먼저 체크"
    : "↑ Tick the review box first";
}

export function calculateLegacyLoanGateSummary({
  eligDone,
  eligTotal,
  docDone,
  docTotal,
}: Omit<LegacyLoanGateSummary, "allDone">): LegacyLoanGateSummary {
  return {
    eligDone,
    eligTotal,
    docDone,
    docTotal,
    allDone: eligTotal > 0 && docTotal > 0 && eligDone === eligTotal && docDone === docTotal,
  };
}

export function getLegacyLoanReviewTitle(
  language: Language,
  summary: LegacyLoanGateSummary,
) {
  if (summary.allDone) {
    return undefined;
  }

  return language === "ko"
    ? `자격 ${summary.eligDone}/${summary.eligTotal} + 서류 ${summary.docDone}/${summary.docTotal} 모두 체크 필요`
    : `Complete ${summary.eligDone}/${summary.eligTotal} eligibility + ${summary.docDone}/${summary.docTotal} docs`;
}

export function getLegacyLoanReviewLabel(
  language: Language,
  summary: LegacyLoanGateSummary,
  reviewedLabel: string,
) {
  if (summary.allDone) {
    return reviewedLabel;
  }

  return language === "ko"
    ? `↑ 체크 ${summary.eligDone + summary.docDone}/${summary.eligTotal + summary.docTotal}`
    : `↑ Check ${summary.eligDone + summary.docDone}/${summary.eligTotal + summary.docTotal}`;
}
