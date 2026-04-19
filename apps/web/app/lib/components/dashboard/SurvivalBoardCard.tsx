"use client";

import React from "react";
import type { DashboardHook } from "../../useDashboard";

const fmt = (n: number): string => {
  if (!isFinite(n) || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000);
    const remain = abs % 100000000;
    const man = Math.floor(remain / 10000);
    return man > 0 ? `${sign}${eok}억 ${man.toLocaleString()}만원` : `${sign}${eok}억원`;
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const remain = abs % 10000;
    return remain > 0 ? `${sign}${man.toLocaleString()}만 ${remain.toLocaleString()}원` : `${sign}${man.toLocaleString()}만원`;
  }
  return `${sign}${abs.toLocaleString()}원`;
};

export function SurvivalBoardCard({
  ko,
  isStartupCompany,
  runwayMonths,
  capitalLeft,
  weeklySalesChange,
  weeklySignalLabel,
  healthLabel,
  healthTone,
  topRiskLabel,
  focusMessage,
  d,
  totalSales,
  netProfit,
  totalCosts,
}: {
  ko: boolean;
  isStartupCompany: boolean;
  totalSales: number;
  netProfit: number;
  totalCosts: number;
  runwayMonths: number;
  capitalLeft: number;
  weeklySalesChange: number;
  weeklySignalLabel: string;
  healthLabel: string;
  healthTone: string;
  topRiskLabel: string;
  focusMessage: string;
  d: DashboardHook;
}) {
  const actions = d.aiActions?.todayActions ?? [];
  const hasActions = actions.length > 0;
  const runwayProgress =
    runwayMonths < 0 ? 100 : runwayMonths >= 12 ? 100 : Math.max(8, Math.min(100, runwayMonths * 8));
  const weeklyProgress = Math.max(10, Math.min(100, 50 + weeklySalesChange));

  // suppress unused variable warnings
  void hasActions;
  void runwayProgress;
  void weeklyProgress;

  return (
    <section style={survivalCard} className="bento-card">
      <div style={survivalTop}>
        <div>
          <div style={sectionEyebrow}>{isStartupCompany ? (ko ? "스타트업 지표" : "Startup metrics") : ko ? "경영 지표" : "Metrics"}</div>
          <div style={opsTitle}>{isStartupCompany ? (ko ? "핵심 생존 지표" : "Survival metrics") : ko ? "경영 건강 지표" : "Health metrics"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* 헬스 점수 미니 게이지 */}
          {(() => {
            // 실제 데이터 기반 점수 계산 (하드코딩 제거)
            const score = d.businessHealthScore === "unknown" ? 0
              : d.businessHealthScore === "healthy" ? 78
              : d.businessHealthScore === "caution" ? 52
              : 25; // danger
            const displayScore = d.businessHealthScore === "unknown" ? "–" : String(score);
            const gaugeColor = d.businessHealthScore === "unknown" ? "rgba(15,23,42,0.2)" : healthTone;
            return (
              <svg width="36" height="36" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none"
                  stroke={gaugeColor}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${score * 0.942} 94.2`}
                  transform="rotate(-90 18 18)"
                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
                <text x="18" y="20" textAnchor="middle" fontSize="10" fontWeight="750" fill={gaugeColor}>
                  {displayScore}
                </text>
              </svg>
            );
          })()}
          <div style={{ ...opsPill, color: d.businessHealthScore === "unknown" ? "rgba(15,23,42,0.4)" : healthTone }}>{healthLabel}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {/* 1. 이번 달 매출 */}
        <div style={survivalMetricCard}>
          <div style={survivalMetricLabel}>{ko ? "이번 달 매출" : "MTD Revenue"}</div>
          <div style={{ ...survivalMetricValue, color: totalSales > 0 ? "#0f172a" : "rgba(15,23,42,0.25)" }}>
            {totalSales > 0 ? fmt(totalSales) : "—"}
          </div>
          <div style={survivalMetricNote}>{ko ? `일평균 ${totalSales > 0 ? fmt(Math.round(totalSales / Math.max(1, new Date().getDate()))) : "—"}` : `Daily avg ${totalSales > 0 ? fmt(Math.round(totalSales / Math.max(1, new Date().getDate()))) : "—"}`}</div>
        </div>
        {/* 2. 손익 */}
        <div style={survivalMetricCard}>
          <div style={survivalMetricLabel}>{ko ? "이번 달 손익" : "MTD P&L"}</div>
          <div style={{ ...survivalMetricValue, color: totalSales === 0 && totalCosts === 0 ? "rgba(15,23,42,0.25)" : netProfit >= 0 ? "#059669" : "#dc2626" }}>
            {totalSales === 0 && totalCosts === 0 ? "—" : `${netProfit >= 0 ? "+" : ""}${fmt(netProfit)}`}
          </div>
          <div style={survivalMetricNote}>{totalCosts > 0 ? (ko ? `비용 ${fmt(totalCosts)}` : `Costs ${fmt(totalCosts)}`) : (ko ? "비용 미입력" : "No costs")}</div>
        </div>
        {/* 3. 런웨이 */}
        <div style={survivalMetricCard}>
          <div style={survivalMetricLabel}>{ko ? "런웨이" : "Runway"}</div>
          <div style={{ ...survivalMetricValue, color: runwayMonths >= 0 && runwayMonths <= 3 ? "#dc2626" : runwayMonths <= 6 ? "#d97706" : "#0f172a" }}>
            {runwayMonths < 0 ? (ko ? "흑자" : "Surplus") : `${runwayMonths}${ko ? "개월" : "mo"}`}
          </div>
          <div style={survivalMetricNote}>{ko ? `현금 ${fmt(capitalLeft)}` : `Cash ${fmt(capitalLeft)}`}</div>
        </div>
        {/* 4. 주간 성장 */}
        <div style={survivalMetricCard}>
          <div style={survivalMetricLabel}>{ko ? "주간 성장" : "Weekly"}</div>
          <div style={{ ...survivalMetricValue, color: weeklySalesChange >= 0 ? "#059669" : "#dc2626" }}>
            {weeklySignalLabel}
          </div>
          <div style={survivalMetricNote}>{ko ? "7일 vs 직전 7일" : "7d vs prev 7d"}</div>
        </div>
      </div>

      {/* 긴급 경고·AI 인사이트·오늘 할 일은 모닝 브리핑에 통합됨 — 생존 보드는 지표만 */}
    </section>
  );
}

const sectionEyebrow: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "rgba(15, 23, 42, 0.46)",
  marginBottom: "6px",
};

const opsTitle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  color: "#0f172a",
};

const opsPill: React.CSSProperties = {
  borderRadius: "999px",
  padding: "8px 12px",
  background: "rgba(15, 23, 42, 0.04)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
  fontSize: "12px",
  fontWeight: 700,
  color: "rgba(15, 23, 42, 0.72)",
  whiteSpace: "nowrap",
};

const survivalCard: React.CSSProperties = {
  borderRadius: "24px",
  padding: "20px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.982), rgba(243,246,250,0.9))",
  color: "#0f172a",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 16px 38px rgba(15, 23, 42, 0.035)",
  display: "grid",
  gap: "12px",
};

const survivalTop: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
};

const survivalMetricCard: React.CSSProperties = {
  borderRadius: "16px",
  padding: "14px",
  background: "linear-gradient(180deg, rgba(248,250,253,0.92), rgba(242,246,250,0.82))",
  border: "1px solid rgba(15,23,42,0.04)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset",
  display: "grid",
  gap: "8px",
  transition: "background 0.2s ease",
};

const survivalMetricLabel: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.48)",
};

const survivalMetricValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 760,
  letterSpacing: "-0.05em",
  lineHeight: 1,
};

const survivalMetricNote: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: 1.5,
  color: "rgba(15,23,42,0.56)",
};
