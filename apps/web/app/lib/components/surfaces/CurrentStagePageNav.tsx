"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StagePageNav } from "../../stores/page-nav-store";
import { styles } from "../../styles";

type CurrentStagePageNavProps = {
  language: "ko" | "en";
  pageNav: StagePageNav | null;
};

const PAGE_BLUE = "#2563eb";

function goToPage(pageNav: StagePageNav, page: number) {
  pageNav.onChange(page);
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function CurrentStagePageNav({ language, pageNav }: CurrentStagePageNavProps) {
  if (!pageNav || pageNav.totalPages <= 1) {
    return null;
  }

  const atFirst = pageNav.page <= 0;
  const atLast = pageNav.page >= pageNav.totalPages - 1;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
      padding: "9px 12px", marginBottom: "10px", borderRadius: "14px",
      border: `1px solid ${PAGE_BLUE}2e`, background: `${PAGE_BLUE}0d`,
    }}>
      <button type="button" disabled={atFirst} onClick={() => goToPage(pageNav, pageNav.page - 1)}
        style={{ display: "inline-flex", alignItems: "center", gap: "1px", border: "none", background: "transparent",
          color: atFirst ? `${PAGE_BLUE}55` : PAGE_BLUE, fontSize: "13px", fontWeight: 600,
          cursor: atFirst ? "default" : "pointer", padding: "4px 4px", fontFamily: "inherit" }}>
        <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />{language === "ko" ? "이전 페이지" : "Prev"}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", gap: "5px" }}>
          {Array.from({ length: pageNav.totalPages }).map((_, i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: "50%",
              background: i <= pageNav.page ? PAGE_BLUE : `${PAGE_BLUE}40` }} />
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "#1d3a8a", fontWeight: 600, whiteSpace: "nowrap" }}>
          {language === "ko" ? `페이지 ${pageNav.page + 1}/${pageNav.totalPages}` : `${pageNav.page + 1}/${pageNav.totalPages}`}
        </span>
      </div>
      <button type="button" disabled={atLast} onClick={() => goToPage(pageNav, pageNav.page + 1)}
        style={{ display: "inline-flex", alignItems: "center", gap: "1px", border: "none",
          background: atLast ? "transparent" : `${PAGE_BLUE}1a`,
          color: atLast ? `${PAGE_BLUE}55` : PAGE_BLUE, fontSize: "13px", fontWeight: 700,
          borderRadius: "10px", cursor: atLast ? "default" : "pointer", padding: "6px 12px", fontFamily: "inherit" }}>
        {language === "ko" ? "다음 페이지" : "Next"}<ChevronRight size={15} strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
}

export function CurrentStageLockedHint({ language, pageNav }: CurrentStagePageNavProps) {
  if (!pageNav || pageNav.page >= pageNav.totalPages - 1) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => goToPage(pageNav, pageNav.page + 1)}
      style={{ ...styles.primaryButton, display: "inline-flex", alignItems: "center", gap: "6px" }}
    >
      {language === "ko"
        ? `다음 페이지 (${pageNav.page + 1}/${pageNav.totalPages})`
        : `Next page (${pageNav.page + 1}/${pageNav.totalPages})`}
      <ChevronRight size={15} strokeWidth={2.4} aria-hidden />
    </button>
  );
}
