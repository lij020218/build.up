import type { StagePageNav } from "../app/lib/stores/page-nav-store";
import { describe, expect, it, vi } from "vitest";
import { getCurrentStagePageNavState } from "../app/lib/components/surfaces/current-stage-page-nav-state";

function nav(page: number, totalPages: number): StagePageNav {
  return {
    page,
    totalPages,
    onChange: vi.fn(),
  };
}

describe("current stage page nav state", () => {
  it("hides navigation and locked hints without page nav", () => {
    expect(getCurrentStagePageNavState(null, "ko")).toMatchObject({
      hasMoreReadingPages: false,
      lockedHintLabel: null,
      pageLabel: null,
      shouldShowLockedHint: false,
      shouldShowPageNav: false,
    });
  });

  it("shows previous and next page state in the middle of a multi-page stage", () => {
    expect(getCurrentStagePageNavState(nav(1, 3), "ko")).toMatchObject({
      atFirst: false,
      atLast: false,
      hasMoreReadingPages: true,
      lockedHintLabel: "다음 페이지 (2/3)",
      nextPage: 2,
      pageLabel: "페이지 2/3",
      previousPage: 0,
      shouldShowLockedHint: true,
      shouldShowPageNav: true,
    });
  });

  it("keeps the footer unlocked on the final page", () => {
    expect(getCurrentStagePageNavState(nav(2, 3), "en")).toMatchObject({
      atFirst: false,
      atLast: true,
      hasMoreReadingPages: false,
      lockedHintLabel: null,
      nextPage: null,
      pageLabel: "3/3",
      previousPage: 1,
      shouldShowLockedHint: false,
      shouldShowPageNav: true,
    });
  });

  it("does not show full nav controls for a one-page stage", () => {
    expect(getCurrentStagePageNavState(nav(0, 1), "ko")).toMatchObject({
      hasMoreReadingPages: false,
      nextPage: null,
      pageLabel: null,
      previousPage: null,
      shouldShowLockedHint: false,
      shouldShowPageNav: false,
    });
  });

  it("clamps invalid page values before calculating labels and targets", () => {
    expect(getCurrentStagePageNavState(nav(9, 3), "ko")).toMatchObject({
      atLast: true,
      hasMoreReadingPages: false,
      nextPage: null,
      page: 2,
      pageLabel: "페이지 3/3",
      previousPage: 1,
      shouldShowLockedHint: false,
      shouldShowPageNav: true,
    });

    expect(getCurrentStagePageNavState(nav(-2, 3), "en")).toMatchObject({
      atFirst: true,
      hasMoreReadingPages: true,
      lockedHintLabel: "Next page (1/3)",
      nextPage: 1,
      page: 0,
      pageLabel: "1/3",
      previousPage: null,
    });
  });

  it("treats invalid total page counts as no page navigation", () => {
    expect(getCurrentStagePageNavState(nav(0, 0), "ko")).toMatchObject({
      hasMoreReadingPages: false,
      pageLabel: null,
      shouldShowLockedHint: false,
      shouldShowPageNav: false,
      totalPages: 0,
    });
    expect(getCurrentStagePageNavState(nav(0, Number.NaN), "ko")).toMatchObject({
      hasMoreReadingPages: false,
      shouldShowPageNav: false,
      totalPages: 0,
    });
    expect(getCurrentStagePageNavState(nav(0, Number.POSITIVE_INFINITY), "en")).toMatchObject({
      hasMoreReadingPages: false,
      shouldShowPageNav: false,
      totalPages: 0,
    });
  });
});
