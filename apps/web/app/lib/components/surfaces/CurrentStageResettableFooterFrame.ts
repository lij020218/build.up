"use client";

import { createElement, type ReactNode } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";

type CurrentStageResettableFooterFrameProps = {
  children?: ReactNode;
  onBack: () => void;
};

export function CurrentStageResettableFooterFrame({
  children,
  onBack,
}: CurrentStageResettableFooterFrameProps) {
  const { copy, language, resetDemo } = useDashboardCtx();

  return createElement(
    "div",
    { style: styles.stageFooter },
    createElement(
      "button",
      { type: "button", style: styles.button, onClick: onBack },
      language === "ko" ? "← 이전 단계" : "← Back",
    ),
    children,
    createElement(
      "button",
      { type: "button", style: styles.button, onClick: resetDemo },
      copy.common.resetDemo,
    ),
  );
}
