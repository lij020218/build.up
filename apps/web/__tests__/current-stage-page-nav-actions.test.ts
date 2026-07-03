import type { StagePageNav } from "../app/lib/stores/page-nav-store";
import { describe, expect, it, vi } from "vitest";
import {
  getCurrentStagePageNavTargetPage,
  getCurrentStagePageNavTargetPageFromNav,
  runCurrentStagePageNavAction,
} from "../app/lib/components/surfaces/current-stage-page-nav-actions";
import { getCurrentStagePageNavState } from "../app/lib/components/surfaces/current-stage-page-nav-state";

function nav(page: number, totalPages: number): StagePageNav {
  return {
    page,
    totalPages,
    onChange: vi.fn(),
  };
}

describe("current stage page nav actions", () => {
  it("resolves previous and next targets from sanitized page nav state", () => {
    const state = getCurrentStagePageNavState(nav(9, 3), "ko");

    expect(getCurrentStagePageNavTargetPage(state, "previous")).toBe(1);
    expect(getCurrentStagePageNavTargetPage(state, "next")).toBeNull();
    expect(getCurrentStagePageNavTargetPageFromNav(nav(-2, 3), "next")).toBe(1);
    expect(getCurrentStagePageNavTargetPageFromNav(nav(Number.NaN, 3), "previous")).toBeNull();
  });

  it("does not navigate when page nav is unavailable", () => {
    const scrollToTop = vi.fn();

    runCurrentStagePageNavAction({
      action: "next",
      pageNav: null,
      scrollToTop,
    });

    expect(scrollToTop).not.toHaveBeenCalled();
  });

  it("does not navigate before the first page or after the final page", () => {
    const first = nav(0, 3);
    const last = nav(2, 3);
    const scrollToTop = vi.fn();

    runCurrentStagePageNavAction({
      action: "previous",
      pageNav: first,
      scrollToTop,
    });
    runCurrentStagePageNavAction({
      action: "next",
      pageNav: last,
      scrollToTop,
    });

    expect(first.onChange).not.toHaveBeenCalled();
    expect(last.onChange).not.toHaveBeenCalled();
    expect(scrollToTop).not.toHaveBeenCalled();
  });

  it("navigates to the target reading page and scrolls to the top", () => {
    const pageNav = nav(1, 3);
    const scrollToTop = vi.fn();

    runCurrentStagePageNavAction({
      action: "next",
      pageNav,
      scrollToTop,
    });

    expect(pageNav.onChange).toHaveBeenCalledTimes(1);
    expect(pageNav.onChange).toHaveBeenCalledWith(2);
    expect(scrollToTop).toHaveBeenCalledTimes(1);
  });

  it("derives the target from the supplied page nav instead of a caller-provided state snapshot", () => {
    const pageNav = nav(0, 3);
    const scrollToTop = vi.fn();

    runCurrentStagePageNavAction({
      action: "next",
      pageNav,
      scrollToTop,
    });

    expect(pageNav.onChange).toHaveBeenCalledWith(1);
    expect(scrollToTop).toHaveBeenCalledTimes(1);
  });
});
