"use client";

/**
 * DeepDiveSection — 접이식 섹션 래퍼.
 *
 * 운영 대시보드의 "드릴다운 존"을 범주별로 그룹화.
 * 기본 접힘 상태, localStorage로 섹션별 상태 기억.
 *
 * 미니멀 톤: 헤더는 가벼운 padding + subtle 호버, 구분선 없음.
 */

import { useState, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type DeepDiveSectionProps = {
  id: string;                     // 상태 persist 용 key
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

const LS_KEY = "buildup-deepdive-open";

function loadOpenState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOpenState(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* quota */ }
}

export function DeepDiveSection({ id, title, subtitle, defaultOpen = false, children }: DeepDiveSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const saved = loadOpenState();
    if (id in saved) setOpen(saved[id]);
  }, [id]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      const saved = loadOpenState();
      saveOpenState({ ...saved, [id]: next });
      return next;
    });
  };

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: open ? "14px" : "0",
        transition: "gap 0.2s ease",
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 4px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          borderRadius: "6px",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(17,17,17,0.02)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{
            fontSize: "10.5px",
            fontWeight: 650,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: "12.5px",
              fontWeight: 500,
              color: "rgba(17,17,17,0.45)",
              letterSpacing: "-0.005em",
            }}>
              {subtitle}
            </div>
          )}
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          color="var(--muted)"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}
        />
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {children}
        </div>
      )}
    </section>
  );
}
