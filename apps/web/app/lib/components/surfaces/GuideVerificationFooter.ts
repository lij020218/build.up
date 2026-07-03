"use client";

import { createElement, type ReactNode } from "react";
import type { Language } from "@foundone/shared";
import { styles } from "../../styles";
import { runGuideVerificationConfirmAction } from "./guide-verification-footer-actions";

type GuideVerificationFooterProps = {
  language: Language;
  hasMoreReadingPages: boolean;
  lockedContent: ReactNode;
  ready: boolean;
  title?: string;
  label: string;
  onBack: () => void;
  onConfirm: () => void;
};

export function GuideVerificationFooter({
  language,
  hasMoreReadingPages,
  lockedContent,
  ready,
  title,
  label,
  onBack,
  onConfirm,
}: GuideVerificationFooterProps) {
  return createElement(
    "div",
    { style: styles.stageFooter },
    createElement(
      "button",
      { type: "button", style: styles.button, onClick: onBack },
      language === "ko" ? "← 이전 단계" : "← Back",
    ),
    hasMoreReadingPages
      ? lockedContent
      : createElement(
        "button",
        {
          type: "button",
          style: {
            ...styles.primaryButton,
            opacity: ready ? 1 : 0.45,
            cursor: ready ? "pointer" : "not-allowed",
          },
          title,
          onClick: () => {
            runGuideVerificationConfirmAction({
              onConfirm,
              ready,
            });
          },
          disabled: !ready,
        },
        label,
      ),
  );
}
