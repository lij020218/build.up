import type { StagePageNav } from "../../stores/page-nav-store";
import type { CurrentStagePageNavState } from "./current-stage-page-nav-state";
import { getCurrentStagePageNavPosition } from "./current-stage-page-nav-state";

export type CurrentStagePageNavAction = "next" | "previous";
type ScrollToTopHandler = () => void;

export function getCurrentStagePageNavTargetPage(
  state: CurrentStagePageNavState,
  action: CurrentStagePageNavAction,
) {
  return action === "previous" ? state.previousPage : state.nextPage;
}

export function runCurrentStagePageNavAction({
  action,
  pageNav,
  scrollToTop = scrollCurrentWindowToTop,
}: {
  action: CurrentStagePageNavAction;
  pageNav: StagePageNav | null;
  scrollToTop?: ScrollToTopHandler;
}) {
  const targetPage = getCurrentStagePageNavTargetPageFromNav(pageNav, action);

  if (!pageNav || targetPage === null) {
    return;
  }

  pageNav.onChange(targetPage);
  scrollToTop();
}

export function getCurrentStagePageNavTargetPageFromNav(
  pageNav: StagePageNav | null,
  action: CurrentStagePageNavAction,
) {
  const position = getCurrentStagePageNavPosition(pageNav);
  if (!position) {
    return null;
  }

  if (action === "previous") {
    return position.page <= 0 ? null : position.page - 1;
  }

  return position.page < position.totalPages - 1 ? position.page + 1 : null;
}

function scrollCurrentWindowToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
