"use client";

import { useMemo } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { calculateMoM } from "@foundone/shared";
import { TrendingUp } from "lucide-react";

/* ─── Formatting ─── */

// 한국 원화 포맷 — 항상 "원" 단위로 끝남 (혼동 방지).
//  · 1억+ → "1.5억원"
//  · 1만+ → "40만원" (소수점 없이 정수)
//  · 그 외 → "1,234원"
const fmtWon = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`;
  return `${n.toLocaleString("ko-KR")}원`;
};

/* ─── Component ─── */

export function MonthlyProgressCard() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number; customers: number }>;

  const mom = useMemo(() => calculateMoM(entries), [entries]);

  // 지난 달 매출 — 자동 목표 산정의 baseline.
  //  종전 (2026-05-12 이전): selectedBudget (총 자본 — 의미적으로 완전 틀림) 사용 →
  //                          사장님이 "왜 내 자본금이 월 매출 목표지?" 혼란.
  //  현재: 지난 달 매출 × 1.05 (5% 성장 목표) — 자영업 상위 30% 표준 페이스.
  //        지난달 데이터 없으면 목표 없이 *진행 페이스* 만 표시 (가짜 목표 X).
  const lastMonthRevenue = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
    return entries
      .filter((e) => e.date.startsWith(lastMonthKey))
      .reduce((sum, e) => sum + (e.sales ?? 0), 0);
  }, [entries]);

  const monthlyTarget = lastMonthRevenue > 0 ? Math.round(lastMonthRevenue * 1.05) : 0;
  const hasTarget = monthlyTarget > 0;

  if (!mom || mom.currentDays === 0) {
    return (
      <div style={card}>
        <div style={headerRow}>
                    <TrendingUp size={14} strokeWidth={1.5} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} /><span style={cardTitle}>이번 달 진행</span>
        </div>
        <div style={emptyState}>
          {ko
            ? "이번 달 매출을 1건 이상 기록하면 목표 달성률이 표시됩니다"
            : "Log at least 1 sale this month to see progress"}
        </div>
      </div>
    );
  }

  const { currentMTD, momChangePercent, projectedMonthEnd, prevMTD, prevDays } = mom;
  // 지난달 데이터 없으면 MoM 비교 불가 — "+0.0%" 거짓 표시 방지
  const momComparable = prevDays > 0 && prevMTD > 0;
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
                <TrendingUp size={14} strokeWidth={1.5} style={{ color: "rgba(15,23,42,0.35)", marginRight: "6px" }} /><span style={cardTitle}>이번 달 진행</span>
        {hasTarget ? (
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
        ) : (
          <div style={{
            marginLeft: "auto",
            fontSize: "11px",
            fontWeight: 600,
            color: "rgba(15,23,42,0.5)",
            background: "rgba(25,25,112,0.05)",
            padding: "3px 8px",
            borderRadius: "6px",
          }}>
            {ko ? "지난달 데이터 누적 중" : "Building baseline"}
          </div>
        )}
      </div>

      {/* Main Figures — 목표 있을 때만 비교 표시 */}
      {hasTarget ? (
        <div style={figuresRow}>
          <div style={figuresLeft}>
            <span style={currentAmount}>{fmtWon(currentMTD)}</span>
            <span style={targetSep}>/</span>
            <span style={targetAmount}>{fmtWon(monthlyTarget)}</span>
          </div>
          <div style={percentBadge(onTrack)}>
            {progress.toFixed(0)}%
          </div>
        </div>
      ) : (
        <div style={figuresRow}>
          <div style={figuresLeft}>
            <span style={currentAmount}>{fmtWon(currentMTD)}</span>
          </div>
        </div>
      )}

      {/* Progress Bar — 목표 있을 때만 */}
      {hasTarget && (
        <>
          <div style={barTrack}>
            <div style={barFill(progress, onTrack)} />
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
        </>
      )}

      {/* Separator */}
      <div style={separator} />

      {/* MoM + Projection */}
      <div style={insightsGrid}>
        <div style={insightItem}>
          <div style={insightLabel}>전월 동기 대비</div>
          {momComparable ? (
            <div style={insightValue(momPositive)}>
              {momPositive ? "+" : ""}{momChangePercent.toFixed(1)}%
            </div>
          ) : (
            <div style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(15,23,42,0.4)",
              letterSpacing: "-0.01em",
            }}>
              {ko ? "지난달 데이터 없음" : "No prior data"}
            </div>
          )}
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
            월말 {fmtWon(projectedMonthEnd)} 예상
          </div>
        </div>
      </div>

      {/* 목표 산정 근거 안내 — 사장님이 "왜 이 목표인가" 알게 */}
      {hasTarget && (
        <div style={targetBasisNote}>
          {ko
            ? `목표 = 지난 달 매출 ${fmtWon(lastMonthRevenue)} × 1.05 (성장 +5%)`
            : `Target = last month ${fmtWon(lastMonthRevenue)} × 1.05`}
        </div>
      )}
      {!hasTarget && (
        <div style={targetBasisNote}>
          {ko
            ? "이번 달이 첫 달입니다. 다음 달부터 지난달 매출 기반 +5% 성장 목표가 자동 산정됩니다."
            : "First month — target auto-generates from next month based on this month."}
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "22px",
  background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
  fontFamily: "inherit",
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
  fontWeight: 700,
  color: "#191970",
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
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: onTrack ? "#34C759" : "#FF3B30",
  letterSpacing: "-0.02em",
});

const barTrack: React.CSSProperties = {
  position: "relative",
  height: "8px",
  borderRadius: "4px",
  background: "rgba(25,25,112,0.05)",
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
  background: "rgba(25,25,112,0.05)",
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

const targetBasisNote: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(15,23,42,0.4)",
  textAlign: "center",
  padding: "8px 12px",
  marginTop: "-4px",
  borderRadius: "8px",
  background: "rgba(25,25,112,0.03)",
  letterSpacing: "0.01em",
};
