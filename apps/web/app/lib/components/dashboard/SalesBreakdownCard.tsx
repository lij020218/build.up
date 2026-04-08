"use client";

import { useMemo } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { calculateSalesBreakdown } from "@build-up/shared";

/* ─── Formatting ─── */

const fmtWon = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 10_000_000) return `${(n / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}만`;
  if (abs >= 10_000) return `${Math.round(n / 10_000)}만`;
  return `${n.toLocaleString("ko-KR")}`;
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
  const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number; customers: number }>;

  const breakdown = useMemo(
    () => calculateSalesBreakdown(entries, "week"),
    [entries],
  );

  if (!breakdown) {
    return (
      <div style={card}>
        <div style={headerRow}>
          <span style={{ fontSize: "15px" }}>&#x1F4CA;</span>
          <span style={cardTitle}>매출 분해</span>
        </div>
        <div style={emptyState}>
          매출 데이터가 2주 이상 쌓이면 분석이 시작됩니다
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
        <span style={{ fontSize: "15px" }}>&#x1F4CA;</span>
        <span style={cardTitle}>매출 분해</span>
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
          <div style={mainValue}>&yen;{avgTicket.toLocaleString("ko-KR")}</div>
          <div style={label}>객단가</div>
        </div>
        <div style={equalsSign}>=</div>
        <div style={formulaSegment}>
          <div style={{ ...mainValue, color: "#1d3557", fontSize: "26px" }}>
            &yen;{fmtWon(totalSales)}
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
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.05)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.03), 0 1px 2px rgba(15,23,42,0.02)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
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
  color: "rgba(15,23,42,0.4)",
  background: "rgba(15,23,42,0.04)",
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
  fontWeight: 750,
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
  color: "rgba(15,23,42,0.4)",
  marginTop: "4px",
};

const multiplySign: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 300,
  color: "rgba(15,23,42,0.25)",
  paddingBottom: "18px",
};

const equalsSign: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 300,
  color: "rgba(15,23,42,0.25)",
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
  color: positive ? "#34C759" : "#FF3B30",
  background: positive ? "rgba(52,199,89,0.08)" : "rgba(255,59,48,0.08)",
  padding: "3px 10px",
  borderRadius: "8px",
  whiteSpace: "nowrap",
});

const separator: React.CSSProperties = {
  height: "1px",
  background: "rgba(15,23,42,0.06)",
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
  color: "rgba(15,23,42,0.55)",
  lineHeight: 1.5,
  fontStyle: "italic",
};

const emptyState: React.CSSProperties = {
  padding: "28px 0",
  textAlign: "center",
  fontSize: "13px",
  color: "rgba(15,23,42,0.35)",
  lineHeight: 1.5,
};
