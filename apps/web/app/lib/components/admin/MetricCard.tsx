"use client";

import type { ReactNode } from "react";
import { card, MUTED, NAVY, fmtNum } from "./ui";

/**
 * MetricCard — 단일 지표. value 가 null 이면 "—"(가짜숫자 금지).
 *   계산 불가 사유가 있으면 hint 로 표기.
 */
export function MetricCard({
  label,
  value,
  unit,
  hint,
  accent,
}: {
  label: string;
  value: number | null;
  unit?: string;
  hint?: string;
  accent?: boolean;
}) {
  const shown = fmtNum(value);
  return (
    <div style={{ ...card, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: accent ? NAVY : "#16181d" }}>{shown}</span>
        {unit && shown !== "—" && <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
      {children}
    </div>
  );
}
