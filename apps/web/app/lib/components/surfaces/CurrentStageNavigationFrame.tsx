"use client";

import type { ReactNode } from "react";
import type { Language } from "@foundone/shared";
import type { StagePageNav } from "../../stores/page-nav-store";
import { CurrentStageLockedHint, CurrentStagePageNav } from "./CurrentStagePageNav";

type CurrentStageNavigationFrameProps = {
  language: Language;
  pageNav: StagePageNav | null;
  renderFooter: (stageLockedContent: ReactNode) => ReactNode;
};

export function CurrentStageNavigationFrame({
  language,
  pageNav,
  renderFooter,
}: CurrentStageNavigationFrameProps) {
  return (
    <>
      <CurrentStagePageNav language={language} pageNav={pageNav} />
      {renderFooter(<CurrentStageLockedHint language={language} pageNav={pageNav} />)}
    </>
  );
}
