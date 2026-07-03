"use client";

import { useDashboardCtx } from "../../contexts/DashboardContext";
import { usePageNavStore } from "../../stores/page-nav-store";
import { CurrentStageLockedHint, CurrentStagePageNav } from "./CurrentStagePageNav";

export function useCurrentStageNavigation() {
  const { language, prevTraversedStage, setViewingStageId } = useDashboardCtx();
  const pageNav = usePageNavStore((state) => state.nav);
  const hasMoreReadingPages = !!pageNav && pageNav.page < pageNav.totalPages - 1;

  const navigateBack = () => {
    if (prevTraversedStage) setViewingStageId(prevTraversedStage.stageId);
    else setViewingStageId(null);
  };

  return {
    hasMoreReadingPages,
    language,
    navigateBack,
    pageNavBlock: <CurrentStagePageNav language={language} pageNav={pageNav} />,
    stageLockedHint: <CurrentStageLockedHint language={language} pageNav={pageNav} />,
  };
}
