"use client";

import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StagePageNav } from "../../stores/page-nav-store";
import { styles } from "../../styles";
import { runCurrentStagePageNavAction } from "./current-stage-page-nav-actions";
import { getCurrentStagePageNavState } from "./current-stage-page-nav-state";

type CurrentStagePageNavProps = {
  language: "ko" | "en";
  pageNav: StagePageNav | null;
};

const PAGE_BLUE = "#2563eb";

export function CurrentStagePageNav({ language, pageNav }: CurrentStagePageNavProps) {
  const state = getCurrentStagePageNavState(pageNav, language);

  if (!pageNav || !state.shouldShowPageNav) {
    return null;
  }

  const goToPreviousPage = () => {
    runCurrentStagePageNavAction({ action: "previous", pageNav });
  };
  const goToNextPage = () => {
    runCurrentStagePageNavAction({ action: "next", pageNav });
  };
  const previousButtonStyle = getPreviousPageButtonStyle(state.atFirst);
  const nextButtonStyle = getNextPageButtonStyle(state.atLast);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
      padding: "9px 12px", marginBottom: "10px", borderRadius: "14px",
      border: `1px solid ${PAGE_BLUE}2e`, background: `${PAGE_BLUE}0d`,
    }}>
      <button
        type="button"
        disabled={state.atFirst}
        onClick={goToPreviousPage}
        style={previousButtonStyle}
      >
        <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />{language === "ko" ? "이전 페이지" : "Prev"}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", gap: "5px" }}>
          {Array.from({ length: state.totalPages }).map((_, i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: "50%",
              background: i <= state.page ? PAGE_BLUE : `${PAGE_BLUE}40` }} />
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "#1d3a8a", fontWeight: 600, whiteSpace: "nowrap" }}>
          {state.pageLabel}
        </span>
      </div>
      <button
        type="button"
        disabled={state.atLast}
        onClick={goToNextPage}
        style={nextButtonStyle}
      >
        {language === "ko" ? "다음 페이지" : "Next"}<ChevronRight size={15} strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
}

export function CurrentStageLockedHint({ language, pageNav }: CurrentStagePageNavProps) {
  const state = getCurrentStagePageNavState(pageNav, language);

  if (!pageNav || !state.shouldShowLockedHint || state.nextPage === null) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => runCurrentStagePageNavAction({ action: "next", pageNav })}
      style={{ ...styles.primaryButton, display: "inline-flex", alignItems: "center", gap: "6px" }}
    >
      {state.lockedHintLabel}
      <ChevronRight size={15} strokeWidth={2.4} aria-hidden />
    </button>
  );
}

function getPreviousPageButtonStyle(disabled: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "1px",
    border: "none",
    background: "transparent",
    color: disabled ? `${PAGE_BLUE}55` : PAGE_BLUE,
    fontSize: "13px",
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    padding: "4px 4px",
    fontFamily: "inherit",
  };
}

function getNextPageButtonStyle(disabled: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "1px",
    border: "none",
    background: disabled ? "transparent" : `${PAGE_BLUE}1a`,
    color: disabled ? `${PAGE_BLUE}55` : PAGE_BLUE,
    fontSize: "13px",
    fontWeight: 700,
    borderRadius: "10px",
    cursor: disabled ? "default" : "pointer",
    padding: "6px 12px",
    fontFamily: "inherit",
  };
}
