import type { Language } from "@foundone/shared";
import type { StagePageNav } from "../../stores/page-nav-store";

export type CurrentStagePageNavState = {
  atFirst: boolean;
  atLast: boolean;
  hasMoreReadingPages: boolean;
  lockedHintLabel: string | null;
  nextPage: number | null;
  page: number;
  pageLabel: string | null;
  previousPage: number | null;
  shouldShowLockedHint: boolean;
  shouldShowPageNav: boolean;
  totalPages: number;
};

export type CurrentStagePageNavPosition = {
  page: number;
  totalPages: number;
};

export function getCurrentStagePageNavState(
  pageNav: StagePageNav | null,
  language: Language,
): CurrentStagePageNavState {
  const position = getCurrentStagePageNavPosition(pageNav);
  if (!position) {
    return emptyPageNavState();
  }

  const { page, totalPages } = position;
  const atFirst = page <= 0;
  const atLast = page >= totalPages - 1;
  const shouldShowPageNav = totalPages > 1;
  const hasMoreReadingPages = page < totalPages - 1;
  const shouldShowLockedHint = hasMoreReadingPages;

  return {
    atFirst,
    atLast,
    hasMoreReadingPages,
    lockedHintLabel: shouldShowLockedHint
      ? language === "ko"
        ? `다음 페이지 (${page + 1}/${totalPages})`
        : `Next page (${page + 1}/${totalPages})`
      : null,
    nextPage: hasMoreReadingPages ? page + 1 : null,
    page,
    pageLabel: shouldShowPageNav
      ? language === "ko"
        ? `페이지 ${page + 1}/${totalPages}`
        : `${page + 1}/${totalPages}`
      : null,
    previousPage: atFirst ? null : page - 1,
    shouldShowLockedHint,
    shouldShowPageNav,
    totalPages,
  };
}

export function getCurrentStagePageNavPosition(
  pageNav: StagePageNav | null,
): CurrentStagePageNavPosition | null {
  if (!pageNav) {
    return null;
  }

  const totalPages = normalizeTotalPages(pageNav.totalPages);
  if (totalPages <= 0) {
    return null;
  }

  return {
    page: clampPage(pageNav.page, totalPages),
    totalPages,
  };
}

function emptyPageNavState(): CurrentStagePageNavState {
  return {
    atFirst: true,
    atLast: true,
    hasMoreReadingPages: false,
    lockedHintLabel: null,
    nextPage: null,
    page: 0,
    pageLabel: null,
    previousPage: null,
    shouldShowLockedHint: false,
    shouldShowPageNav: false,
    totalPages: 0,
  };
}

function normalizeTotalPages(totalPages: number) {
  if (!Number.isFinite(totalPages)) {
    return 0;
  }

  return Math.max(0, Math.floor(totalPages));
}

function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page)) {
    return 0;
  }

  return Math.min(Math.max(0, Math.floor(page)), totalPages - 1);
}
