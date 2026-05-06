"use client";

/**
 * ReportChart — period 별 SVG 차트 (외부 lib X).
 *
 * - day: 14일 line + gradient fill (CEOMorningHero sparkline 패턴)
 * - week: 8주 bar
 * - month: 6개월 bar
 * - quarter: 4분기 bar
 *
 * 데이터는 useReportSnapshot.chartSeries — { label, value }[] 그대로 받음.
 */

import { useMemo } from "react";

const MIDNIGHT = "#191970";
const MIDNIGHT_FADE = "rgba(25,25,112,0.18)";

type Props = {
  ko: boolean;
  period: "day" | "week" | "month" | "quarter";
  series: Array<{ label: string; value: number }>;
};

const fmtKrw = (n: number): string => {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return `${Math.round(n).toLocaleString()}`;
};

export function ReportChart({ ko, period, series }: Props) {
  const max = useMemo(() => Math.max(...series.map((p) => p.value), 1), [series]);
  const allZero = series.every((p) => p.value === 0);

  if (allZero) {
    return (
      <div style={emptyChartStyle}>
        {ko ? "데이터가 모이면 차트가 채워집니다" : "Chart fills as data accumulates"}
      </div>
    );
  }

  if (period === "day") {
    // 14-point sparkline
    return <DayLineChart series={series} max={max} ko={ko} />;
  }

  // week/month/quarter — bar chart
  return <BarChart series={series} max={max} ko={ko} period={period} />;
}

function DayLineChart({ series, max, ko }: { series: Array<{ label: string; value: number }>; max: number; ko: boolean }) {
  const W = 100;
  const H = 32;
  const pad = 2;
  const points = series.map((p, i) => ({
    x: pad + (i / (series.length - 1)) * (W - 2 * pad),
    y: H - pad - (p.value / max) * (H - 2 * pad),
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const fillPath = `${path} L ${points[points.length - 1].x.toFixed(2)} ${H - pad} L ${points[0].x.toFixed(2)} ${H - pad} Z`;

  // 7일 이동 평균 ghost line — 변동이 큰 일별 매출에 추세선 추가
  const ghostPoints = series.map((_, i) => {
    const window = series.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, p) => s + p.value, 0) / window.length;
    return {
      x: pad + (i / (series.length - 1)) * (W - 2 * pad),
      y: H - pad - (avg / max) * (H - 2 * pad),
    };
  });
  const ghostPath = ghostPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

  const last = series[series.length - 1];

  return (
    <div style={chartContainer}>
      <div style={chartHeader}>
        <span style={chartTitle}>{ko ? "최근 14일 매출" : "Last 14 days"}</span>
        <span style={legendRow}>
          <span style={legendItem}><span style={{ ...legendSwatch, background: MIDNIGHT }} />{ko ? "일별" : "Daily"}</span>
          <span style={legendItem}><span style={{ ...legendSwatch, background: "rgba(25,25,112,0.35)", border: "1px dashed rgba(25,25,112,0.6)" }} />{ko ? "7일 평균" : "7d avg"}</span>
        </span>
        <span style={chartTodayValue}>{last ? `${fmtKrw(last.value)}원` : "-"}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 90, display: "block" }}>
        <defs>
          <linearGradient id="report-sparkline-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={MIDNIGHT} stopOpacity="0.22" />
            <stop offset="100%" stopColor={MIDNIGHT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#report-sparkline-fill)" />
        {/* ghost 7일 평균 */}
        <path d={ghostPath} fill="none" stroke={MIDNIGHT} strokeWidth="0.4" strokeDasharray="0.8 0.8" strokeLinecap="round" strokeOpacity="0.55" />
        {/* 일별 매출 */}
        <path d={path} fill="none" stroke={MIDNIGHT} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={axisRow}>
        {series.map((p, i) => (
          (i === 0 || i === series.length - 1) ? (
            <span key={i} style={axisLabel}>{p.label}</span>
          ) : null
        ))}
      </div>
    </div>
  );
}

function BarChart({ series, max, ko, period }: { series: Array<{ label: string; value: number }>; max: number; ko: boolean; period: string }) {
  const periodLabel =
    period === "week" ? (ko ? "최근 8주" : "Last 8 weeks") :
    period === "month" ? (ko ? "최근 6개월" : "Last 6 months") :
    (ko ? "최근 4분기" : "Last 4 quarters");

  const last = series[series.length - 1];

  return (
    <div style={chartContainer}>
      <div style={chartHeader}>
        <span style={chartTitle}>{periodLabel}</span>
        <span style={chartTodayValue}>{last ? `${fmtKrw(last.value)}원` : "-"}</span>
      </div>
      <div style={barsRow}>
        {series.map((p, i) => {
          const h = max > 0 ? Math.max(2, (p.value / max) * 80) : 2;
          const isLast = i === series.length - 1;
          return (
            <div key={i} style={barColumn} title={`${p.label}: ${fmtKrw(p.value)}원`}>
              <div
                style={{
                  ...barStyle,
                  height: `${h}px`,
                  background: isLast ? MIDNIGHT : MIDNIGHT_FADE,
                }}
              />
              <span style={barLabel}>{p.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const chartContainer: React.CSSProperties = {
  background: "white",
  border: "1px solid rgba(15,23,42,0.08)",
  borderRadius: 18,
  padding: "18px 20px",
};

const legendRow: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  fontSize: 11,
  color: "rgba(15,23,42,0.55)",
};

const legendItem: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const legendSwatch: React.CSSProperties = {
  display: "inline-block",
  width: 10,
  height: 4,
  borderRadius: 2,
};

const chartHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};

const chartTitle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "rgba(15,23,42,0.55)",
};

const chartTodayValue: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: MIDNIGHT,
  letterSpacing: "-0.01em",
};

const axisRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 6,
};

const axisLabel: React.CSSProperties = {
  fontSize: 10.5,
  color: "rgba(15,23,42,0.45)",
  fontFamily: "ui-monospace, monospace",
};

const barsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  height: 100,
  gap: 6,
};

const barColumn: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  height: "100%",
  justifyContent: "flex-end",
};

const barStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "4px 4px 0 0",
  transition: "height 0.3s ease",
};

const barLabel: React.CSSProperties = {
  fontSize: 10,
  color: "rgba(15,23,42,0.5)",
  fontFamily: "ui-monospace, monospace",
};

const emptyChartStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.02)",
  border: "1px dashed rgba(15,23,42,0.12)",
  borderRadius: 14,
  padding: "32px 16px",
  textAlign: "center",
  fontSize: 12.5,
  color: "rgba(15,23,42,0.5)",
};
