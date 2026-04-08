"use client";

import { useMemo } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { calculateMoM } from "@build-up/shared";
import { TrendingUp } from "lucide-react";

/* ─── Formatting ─── */

const fmtWon = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만`;
  return `${n.toLocaleString("ko-KR")}원`;
};

/* ─── Component ─── */

export function MonthlyProgressCard() {
  const d = useDashboardCtx();
  const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number; customers: number }>;
  const monthlyTarget = (d.selectedBudget as number | undefined) ?? 25_000_000;

  const mom = useMemo(() => calculateMoM(entries), [entries]);

  if (!mom || mom.currentDays === 0) {
    return (
      <div style={card}>
        <div style={headerRow}>
          <span style={{ fontSize: "15px" }}>&#x1F4C8;</span>
          <TrendingUp size={14} strokeWidth={2} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} /><span style={cardTitle}>이번 달 진행</span>
        </div>
        <div style={emptyState}>
          이번 달 매출을 입력하면 진행률이 표시됩니다
        </div>
      </div>
    );
  }

  const { currentMTD, momChangePercent, projectedMonthEnd } = mom;
  const progress = monthlyTarget > 0 ? Math.min((currentMTD / monthlyTarget) * 100, 100) : 0;
  const onTrack = projectedMonthEnd >= monthlyTarget;
  const momPositive = momChangePercent >= 0;

  /* Time-based expected progress for context */
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const expectedProgress = (today.getDate() / daysInMonth) * 100;
  const aheadOfSchedule = progress >= expectedProgress;

  return (
    <div style={card}>
      {/* Header */}
      <div style={headerRow}>
        <span style={{ fontSize: "15px" }}>&#x1F4C8;</span>
        <TrendingUp size={14} strokeWidth={2} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} /><span style={cardTitle}>이번 달 진행</span>
        <div style={{
          marginLeft: "auto",
          fontSize: "11px",
          fontWeight: 700,
          color: onTrack ? "#34C759" : "#FF3B30",
          background: onTrack ? "rgba(52,199,89,0.08)" : "rgba(255,59,48,0.08)",
          padding: "3px 8px",
          borderRadius: "6px",
        }}>
          {onTrack ? "순항 중" : "목표 미달"}
        </div>
      </div>

      {/* Main Figures */}
      <div style={figuresRow}>
        <div style={figuresLeft}>
          <span style={currentAmount}>&yen;{fmtWon(currentMTD)}</span>
          <span style={targetSep}>/</span>
          <span style={targetAmount}>&yen;{fmtWon(monthlyTarget)}</span>
        </div>
        <div style={percentBadge(onTrack)}>
          {progress.toFixed(0)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div style={barTrack}>
        <div style={barFill(progress, onTrack)} />
        {/* Expected progress marker */}
        <div style={expectedMarker(expectedProgress)} title={`경과일 기준 ${expectedProgress.toFixed(0)}%`} />
      </div>
      <div style={barLabels}>
        <span style={barLabelText}>0%</span>
        <span style={{
          ...barLabelText,
          position: "absolute",
          left: `${expectedProgress}%`,
          transform: "translateX(-50%)",
          color: "rgba(15,23,42,0.3)",
          fontSize: "9px",
        }}>
          &#x25BC; {expectedProgress.toFixed(0)}% 경과
        </span>
        <span style={barLabelText}>100%</span>
      </div>

      {/* Separator */}
      <div style={separator} />

      {/* MoM + Projection */}
      <div style={insightsGrid}>
        <div style={insightItem}>
          <div style={insightLabel}>전월 동기 대비</div>
          <div style={insightValue(momPositive)}>
            {momPositive ? "+" : ""}{momChangePercent.toFixed(1)}%
          </div>
        </div>
        <div style={insightItem}>
          <div style={insightLabel}>현재 페이스</div>
          <div style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#0f172a",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}>
            월말 &yen;{fmtWon(projectedMonthEnd)} 예상
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "22px",
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.03), 0 1px 2px rgba(15,23,42,0.02)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const cardTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.01em",
};

const figuresRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
};

const figuresLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
};

const currentAmount: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 750,
  color: "#1d3557",
  letterSpacing: "-0.03em",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.1,
};

const targetSep: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 300,
  color: "rgba(15,23,42,0.2)",
};

const targetAmount: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "rgba(15,23,42,0.35)",
  fontVariantNumeric: "tabular-nums",
};

const percentBadge = (onTrack: boolean): React.CSSProperties => ({
  fontSize: "22px",
  fontWeight: 750,
  fontVariantNumeric: "tabular-nums",
  color: onTrack ? "#34C759" : "#FF3B30",
  letterSpacing: "-0.02em",
});

const barTrack: React.CSSProperties = {
  position: "relative",
  height: "8px",
  borderRadius: "4px",
  background: "rgba(15,23,42,0.06)",
  overflow: "visible",
};

const barFill = (progress: number, onTrack: boolean): React.CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
  borderRadius: "4px",
  width: `${progress}%`,
  background: onTrack
    ? "linear-gradient(90deg, #007AFF, #34C759)"
    : "linear-gradient(90deg, #FF9F0A, #FF3B30)",
  transition: "width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  boxShadow: onTrack
    ? "0 0 12px rgba(52,199,89,0.3)"
    : "0 0 12px rgba(255,59,48,0.2)",
});

const expectedMarker = (pct: number): React.CSSProperties => ({
  position: "absolute",
  top: "-3px",
  left: `${pct}%`,
  width: "2px",
  height: "14px",
  borderRadius: "1px",
  background: "rgba(15,23,42,0.2)",
  transform: "translateX(-1px)",
});

const barLabels: React.CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  marginTop: "4px",
};

const barLabelText: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 500,
  color: "rgba(15,23,42,0.25)",
  fontVariantNumeric: "tabular-nums",
};

const separator: React.CSSProperties = {
  height: "1px",
  background: "rgba(15,23,42,0.06)",
};

const insightsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const insightItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const insightLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
};

const insightValue = (positive: boolean): React.CSSProperties => ({
  fontSize: "16px",
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: positive ? "#34C759" : "#FF3B30",
  letterSpacing: "-0.02em",
});

const emptyState: React.CSSProperties = {
  padding: "28px 0",
  textAlign: "center",
  fontSize: "13px",
  color: "rgba(15,23,42,0.35)",
  lineHeight: 1.5,
};
