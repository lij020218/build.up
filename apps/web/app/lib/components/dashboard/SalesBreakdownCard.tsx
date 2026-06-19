"use client";

import { useMemo } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { calculateSalesBreakdown } from "@foundone/shared";
import { Users } from "lucide-react";

/* ─── Formatting ─── */

// 한국 원화 — 항상 "원" 단위 (혼동 방지).
const fmtWon = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`;
  return `${n.toLocaleString("ko-KR")}원`;
};

const fmtPct = (n: number): string =>
  `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

const fmtDelta = (cur: number, prev: number): string => {
  const diff = cur - prev;
  return `${diff >= 0 ? "+" : ""}${diff.toLocaleString("ko-KR")}`;
};

/* ─── AI Comment Logic ─── */

const getDriverComment = (driver: "customers" | "ticket" | "both" | "none"): string => {
  switch (driver) {
    case "customers": return "고객수 변화가 주 원인입니다";
    case "ticket":    return "객단가 변화가 주 원인입니다";
    case "both":      return "고객수와 객단가 모두 변화했습니다";
    case "none":      return "유의미한 변화가 없습니다";
  }
};

/* ─── Component ─── */

export function SalesBreakdownCard() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number; customers: number }>;

  const breakdown = useMemo(
    () => calculateSalesBreakdown(entries, "week"),
    [entries],
  );

  if (!breakdown) {
    return (
      <div style={card}>
        <div style={headerRow}>
                    <Users size={14} strokeWidth={1.5} style={{ color: "var(--muted)", marginRight: "6px" }} /><span style={cardTitle}>매출 분해</span>
        </div>
        <div style={emptyState}>
          {ko ? "매출을 7일 이상 기록하면 고객수 × 객단가 분석이 시작됩니다" : "Log 7+ days of sales to unlock customer × ticket analysis"}
        </div>
      </div>
    );
  }

  const {
    customers, avgTicket, totalSales,
    prevCustomers, prevAvgTicket,
    customersChange, avgTicketChange, salesChange,
    primaryDriver,
  } = breakdown;

  const custDelta = customers - prevCustomers;
  const ticketDelta = avgTicket - prevAvgTicket;
  const salesPositive = salesChange >= 0;
  const custPositive = customersChange >= 0;
  const ticketPositive = avgTicketChange >= 0;

  return (
    <div style={card}>
      {/* Header */}
      <div style={headerRow}>
                <Users size={14} strokeWidth={1.5} style={{ color: "var(--muted)", marginRight: "6px" }} /><span style={cardTitle}>매출 분해</span>
        <span style={periodBadge}>전주 대비</span>
      </div>

      {/* Decomposition Formula */}
      <div style={formulaRow}>
        <div style={formulaSegment}>
          <div style={mainValue}>{customers}명</div>
          <div style={label}>고객수</div>
        </div>
        <div style={multiplySign}>&times;</div>
        <div style={formulaSegment}>
          <div style={mainValue}>{avgTicket.toLocaleString("ko-KR")}원</div>
          <div style={label}>객단가</div>
        </div>
        <div style={equalsSign}>=</div>
        <div style={formulaSegment}>
          <div style={{ ...mainValue, color: "#191970", fontSize: "26px" }}>
            {fmtWon(totalSales)}
          </div>
          <div style={label}>총매출</div>
        </div>
      </div>

      {/* Change Indicators */}
      <div style={changeRow}>
        <div style={changePill(custPositive)}>
          {fmtDelta(customers, prevCustomers)}명({fmtPct(customersChange)})
        </div>
        <div style={changePill(ticketPositive)}>
          {fmtDelta(avgTicket, prevAvgTicket)}원({fmtPct(avgTicketChange)})
        </div>
        <div style={{
          ...changePill(salesPositive),
          fontWeight: 700,
        }}>
          {fmtPct(salesChange)}
        </div>
      </div>

      {/* Separator */}
      <div style={separator} />

      {/* AI Comment */}
      <div style={commentRow}>
        <span style={{ fontSize: "14px", flexShrink: 0 }}>&#x1F4A1;</span>
        <span style={commentText}>
          &ldquo;{getDriverComment(primaryDriver)}&rdquo;
        </span>
      </div>
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
  gap: "16px",
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

const periodBadge: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--muted)",
  background: "rgba(25,25,112,0.04)",
  padding: "3px 8px",
  borderRadius: "6px",
  letterSpacing: "0.02em",
};

const formulaRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "4px 0",
};

const formulaSegment: React.CSSProperties = {
  textAlign: "center",
  flex: 1,
};

const mainValue: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.03em",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.2,
};

const label: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginTop: "4px",
};

const multiplySign: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 300,
  color: "var(--muted)",
  paddingBottom: "18px",
};

const equalsSign: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 300,
  color: "var(--muted)",
  paddingBottom: "18px",
};

const changeRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  marginTop: "-8px",
};

const changePill = (positive: boolean): React.CSSProperties => ({
  fontSize: "12px",
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums",
  color: positive ? "#1d3557" : "#b64c4c",
  background: positive ? "rgba(29,53,87,0.08)" : "rgba(182,76,76,0.08)",
  padding: "3px 10px",
  borderRadius: "8px",
  whiteSpace: "nowrap",
});

const separator: React.CSSProperties = {
  height: "1px",
  background: "rgba(25,25,112,0.05)",
  margin: "0 -2px",
};

const commentRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
};

const commentText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--muted)",
  lineHeight: 1.5,
  fontStyle: "italic",
};

const emptyState: React.CSSProperties = {
  padding: "28px 0",
  textAlign: "center",
  fontSize: "13px",
  color: "var(--muted)",
  lineHeight: 1.5,
};
