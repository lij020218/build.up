"use client";

/**
 * CollapsibleSection — 접이식 섹션 (웹 공용, iOS BUCollapsibleSection 미러)
 *
 *  2026-08-19 사장님 지시: 한 화면에 요소가 꽉 차는 현상 배제 → 세그먼트 + 접기.
 *  헤더 한 줄(제목 + 요약 + chevron), 기본 접힘(defaultOpen=false). 펼치면 children 이 아래에 붙는다.
 */

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleSection({
  title, summary, defaultOpen = false, children, right,
}: {
  title: string;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  /** 헤더 우측 보조 요소(링크 등) — 클릭이 토글로 번지지 않게 stopPropagation 처리됨 */
  right?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className="bento-card"
      style={{
        background: "white",
        border: "1px solid rgba(25,25,112,0.10)",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "inherit", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.005em" }}>{title}</span>
        {summary ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {summary}
          </span>
        ) : null}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10 }}>
          {right ? <span onClick={(e) => e.stopPropagation()}>{right}</span> : null}
          <ChevronDown
            size={14}
            strokeWidth={2}
            style={{ color: "var(--muted)", transition: "transform 0.18s", transform: open ? "rotate(180deg)" : "none" }}
          />
        </span>
      </button>
      {open ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 18px 18px" }}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
