"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { usePageNavStore } from "../../stores/page-nav-store";
import { runCurrentStageBackAction } from "./current-stage-navigation-actions";
import { getCurrentStagePageNavState } from "./current-stage-page-nav-state";

export function useCurrentStageNavigation() {
  const { language, prevTraversedStage, setViewingStageId } = useDashboardCtx();
  const pageNav = usePageNavStore((state) => state.nav);
  const pageNavState = getCurrentStagePageNavState(pageNav, language);

  const navigateBack = () => {
    runCurrentStageBackAction({
      previousStage: prevTraversedStage,
      setViewingStageId,
    });
  };

  return {
    hasMoreReadingPages: pageNavState.hasMoreReadingPages,
    language,
    navigateBack,
    pageNav,
  };
}
