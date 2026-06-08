"use client";

/**
 * Admin 콘솔 공용 스타일 프리미티브 — Found.One 디자인 토큰 재사용.
 *   네이비(#1d3557) 주조 + muted 그레이. 신호등 컬러 남용 금지(상태 배지만 절제 사용).
 *   내부 도구라 밀도↑ 허용하되 여백·타이포 위계는 Apple-미니멀 유지.
 */
import type { CSSProperties, ReactNode } from "react";

export const NAVY = "#1d3557";
export const NAVY_DEEP = "#191970";
export const MUTED = "#5b616e";
export const BORDER = "rgba(17,17,17,0.08)";
export const BG = "#f7f6f3";

export const card: CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  border: `1px solid ${BORDER}`,
  fontFamily: "Pretendard, -apple-system, sans-serif",
};

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...card, ...style }}>{children}</div>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#16181d", margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: MUTED, margin: "5px 0 0" }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        cursor: onClick ? "pointer" : "default",
        fontSize: 12.5,
        fontWeight: 600,
        border: active ? `1px solid ${NAVY}` : `1px solid ${BORDER}`,
        background: active ? "rgba(29,53,87,0.06)" : "#fff",
        color: active ? NAVY : MUTED,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/** 카테고리 라벨(피드백) — 한글화 */
export const CATEGORY_LABEL: Record<string, string> = {
  bug: "버그·오류",
  idea: "기능 제안",
  ux: "사용성",
  other: "기타",
};

/** 절제된 상태 점(신호등 남용 금지 — 작은 도트 + muted 텍스트) */
export function StatusDot({ tone }: { tone: "ok" | "warn" | "off" }) {
  const color = tone === "ok" ? "#2d6a4f" : tone === "warn" ? "#c58b2a" : "#9aa0ab";
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, marginRight: 6, verticalAlign: "middle" }} />;
}

export const tableStyles = {
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: {
    textAlign: "left" as const,
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase" as const,
    color: MUTED,
    borderBottom: `1px solid ${BORDER}`,
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "12px 14px",
    color: "#23262d",
    borderBottom: `1px solid rgba(17,17,17,0.05)`,
    verticalAlign: "top" as const,
  },
};

/** 빈 상태 안내 */
export function EmptyState({ children }: { children: ReactNode }) {
  return <div style={{ padding: "40px 20px", textAlign: "center", color: MUTED, fontSize: 13.5 }}>{children}</div>;
}

/** 정직 숫자 — null/undefined 면 "—" */
export function fmtNum(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("ko-KR") : "—";
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // KST 표기
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}
