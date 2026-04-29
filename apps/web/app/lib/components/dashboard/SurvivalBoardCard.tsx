"use client";

import React from "react";
import type { DashboardHook } from "../../useDashboard";
import { AnimatedPath, AnimatedProgressBar, CountUp } from "./animations";

/**
 * Inline sparkline — 24px tall, axisless, clean polyline (no smoothing artifacts).
 * 소규모 데이터에서 cubic bezier는 overshoot·wobble을 만들므로 직선 segment 사용.
 */
function Sparkline({
  values,
  color = "#1d3557",
  fill = false,
}: {
  values: number[];
  color?: string;
  fill?: boolean;
}) {
  // 의미 있는 데이터가 2개 이상일 때만 렌더
  const nonZero = values.filter((v) => v > 0);
  if (nonZero.length < 2) return <div style={{ height: 26 }} />;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 24;
  const pad = 2;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const step = iw / (values.length - 1);
  const points = values.map((v, i) => ({
    x: pad + i * step,
    y: pad + ih - ((v - min) / range) * ih,
  }));

  // 직선 segment (smoothing 제거 — 깔끔)
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const fillPath = `${path} L ${points[points.length - 1].x.toFixed(2)} ${(pad + ih).toFixed(2)} L ${points[0].x.toFixed(2)} ${(pad + ih).toFixed(2)} Z`;
  const gradId = `spark-${Math.random().toString(36).slice(2, 8)}`;
  const endPoint = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: "block", marginTop: 6 }}>
      {fill && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={fillPath} fill={`url(#${gradId})`} opacity={0.9} />}
      <AnimatedPath d={path} stroke={color} strokeWidth={1.4} duration={1.2} delay={0.3} />
      {/* 끝점 dot */}
      <circle cx={endPoint.x} cy={endPoint.y} r={1.8} fill={color} />
    </svg>
  );
}

/**
 * 런웨이 fuel gauge — 12개월 기준 연료 게이지.
 * <=3개월: 빨강 25%, <=6개월: 주황 50%, >6개월: 녹색, >=12개월: full.
 */
function RunwayGauge({ runwayMonths }: { runwayMonths: number }) {
  const pct = Math.min(100, (runwayMonths / 12) * 100);
  const color =
    runwayMonths <= 3 ? "#ff3b30"
    : runwayMonths <= 6 ? "#ff9f0a"
    : "#34c759";
  return (
    <div style={{ marginTop: 10, position: "relative" as const }}>
      <AnimatedProgressBar
        pct={Math.max(4, pct)}
        color={color}
        height={6}
        borderRadius={3}
        delay={0.35}
        duration={0.95}
      />
      {/* 12개월 기준 마커 */}
      {runwayMonths < 12 && (
        <div style={{
          position: "absolute" as const,
          right: 0, top: -1,
          width: "1px", height: "8px",
          background: "rgba(17,17,17,0.18)",
        }} />
      )}
    </div>
  );
}

type DailyEntry = { date: string; sales: number; customers: number };

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

  // 최근 14일 매출 시리즈 (스파크라인용)
  const last14 = (() => {
    const map = new Map<string, number>((d.dailyEntries as DailyEntry[]).map((e) => [e.date, e.sales]));
    const days: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      days.push(map.get(dt.toISOString().slice(0, 10)) ?? 0);
    }
    return days;
  })();
  const hasSalesSeries = last14.filter((v) => v > 0).length >= 2;
  const dailyFixed = totalCosts > 0 ? totalCosts / 30 : 0;
  const profitSeries = last14.map((v) => v - dailyFixed);

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
        {/* 1. 이번 달 매출 — 보조 메트릭 (hero는 MorningBriefing 노스스타) */}
        <div style={survivalMetricCard}>
          <div style={survivalMetricLabel}>{ko ? "MTD 매출" : "MTD Revenue"}</div>
          <div style={{ ...survivalMetricValueSecondary, color: totalSales > 0 ? "#0f172a" : "rgba(15,23,42,0.25)" }}>
            {totalSales > 0 ? <CountUp to={totalSales} duration={1.0} format={fmt} /> : "—"}
          </div>
          <div style={survivalMetricNote}>{ko ? `일평균 ${totalSales > 0 ? fmt(Math.round(totalSales / Math.max(1, new Date().getDate()))) : "—"}` : `Daily avg ${totalSales > 0 ? fmt(Math.round(totalSales / Math.max(1, new Date().getDate()))) : "—"}`}</div>
          {hasSalesSeries && <Sparkline values={last14} color="#1d3557" fill />}
        </div>
        {/* 2. 손익 — 보조 메트릭 */}
        <div style={survivalMetricCard}>
          <div style={survivalMetricLabel}>{ko ? "MTD 손익" : "MTD P&L"}</div>
          <div style={{ ...survivalMetricValueSecondary, color: totalSales === 0 && totalCosts === 0 ? "rgba(15,23,42,0.25)" : netProfit >= 0 ? "#059669" : "#dc2626" }}>
            {totalSales === 0 && totalCosts === 0
              ? "—"
              : <>{netProfit >= 0 ? "+" : ""}<CountUp to={netProfit} duration={1.0} format={fmt} /></>}
          </div>
          <div style={survivalMetricNote}>{totalCosts > 0 ? (ko ? `비용 ${fmt(totalCosts)}` : `Costs ${fmt(totalCosts)}`) : (ko ? "비용 미입력" : "No costs")}</div>
          {hasSalesSeries && totalCosts > 0 && (
            <Sparkline values={profitSeries} color={netProfit >= 0 ? "#34c759" : "#ff3b30"} fill />
          )}
        </div>
        {/* 3. 런웨이 — 보조 메트릭 (hero는 MorningBriefing 노스스타) */}
        <div style={survivalMetricCard}>
          <div style={survivalMetricLabel}>{ko ? "런웨이" : "Runway"}</div>
          <div style={{ ...survivalMetricValueSecondary, color: runwayMonths >= 0 && runwayMonths <= 3 ? "#dc2626" : runwayMonths <= 6 ? "#d97706" : "#0f172a" }}>
            {runwayMonths < 0
              ? (ko ? "흑자" : "Surplus")
              : <><CountUp to={runwayMonths} duration={0.9} format={(n) => Math.round(n).toString()} />{ko ? "개월" : "mo"}</>}
          </div>
          <div style={survivalMetricNote}>{ko ? `현금 ${fmt(capitalLeft)}` : `Cash ${fmt(capitalLeft)}`}</div>
          {runwayMonths >= 0 && (
            <RunwayGauge runwayMonths={runwayMonths} />
          )}
        </div>
        {/* 4. 주간 성장 */}
        <div style={survivalMetricCard}>
          <div style={survivalMetricLabel}>{ko ? "주간 성장" : "Weekly"}</div>
          <div style={{ ...survivalMetricValue, color: weeklySalesChange >= 0 ? "#059669" : "#dc2626" }}>
            {weeklySignalLabel}
          </div>
          <div style={survivalMetricNote}>{ko ? "7일 vs 직전 7일" : "7d vs prev 7d"}</div>
          {hasSalesSeries && (
            <Sparkline values={last14.slice(-7)} color={weeklySalesChange >= 0 ? "#34c759" : "#ff3b30"} fill />
          )}
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
  borderRadius: "20px",
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

/** 노스스타화 후 — 매출/손익 같은 중복 메트릭은 hero 격하 (MorningBriefing 노스스타가 진짜 hero) */
const survivalMetricValueSecondary: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
};

const survivalMetricNote: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: 1.5,
  color: "rgba(15,23,42,0.56)",
};
