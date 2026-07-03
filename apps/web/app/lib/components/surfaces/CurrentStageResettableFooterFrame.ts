"use client";

import { createElement, type ReactNode } from "react";
import type { Language } from "@foundone/shared";
import { styles } from "../../styles";

type CurrentStageResettableFooterFrameProps = {
  children?: ReactNode;
  language: Language;
  onBack: () => void;
  onReset: () => void;
  resetLabel: string;
};

export function CurrentStageResettableFooterFrame({
  children,
  language,
  onBack,
  onReset,
  resetLabel,
}: CurrentStageResettableFooterFrameProps) {
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
      { type: "button", style: styles.button, onClick: onReset },
      resetLabel,
    ),
  );
}
