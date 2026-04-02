"use client";

import { useMemo } from "react";

/**
 * 매출 예측 + "이대로 가면" 시나리오 카드.
 * - 7일 실적 + 7일 예측선 SVG 차트 (그라데이션 + 신뢰구간)
 * - 3개월 현금 예측 (손실 프레이밍)
 * - 업종별 핵심 Input 지표
 */

type DailyEntry = { date: string; sales: number; customers: number };
type MonthlyCosts = { ingredients: number; labor: number; rent: number; utilities: number; other: number };

type Props = {
  ko: boolean;
  dailyEntries: DailyEntry[];
  monthlyCosts: MonthlyCosts;
  capitalLeft: number;
  breakEvenDailySales: number;
  industryCategoryId: string;
};

const fmt = (n: number) => {
  const abs = Math.abs(Math.round(n));
  if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString()}만원`;
  return `${abs.toLocaleString()}원`;
};

export function ForecastCard({ ko, dailyEntries, monthlyCosts, capitalLeft, breakEvenDailySales, industryCategoryId }: Props) {
  const sorted = useMemo(() =>
    [...dailyEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [dailyEntries]
  );

  // 최근 14일 실적
  const recent14 = sorted.slice(-14);
  if (recent14.length < 3) return null; // 데이터 부족 시 미표시

  // 예측: 가중 이동평균
  const last7 = sorted.slice(-7);
  const avg7 = last7.reduce((s, e) => s + e.sales, 0) / Math.max(last7.length, 1);
  const last14 = sorted.slice(-14);
  const avg14 = last14.reduce((s, e) => s + e.sales, 0) / Math.max(last14.length, 1);
  const trend = last7.length >= 7 && avg14 > 0 ? (avg7 - avg14) / avg14 : 0;

  // 7일 예측 데이터 포인트
  const forecastDays = 7;
  const forecastPoints = Array.from({ length: forecastDays }, (_, i) => {
    const dayFactor = 1 + trend * ((i + 1) / forecastDays) * 0.5; // 트렌드 반영 (감쇄)
    return Math.max(0, Math.round(avg7 * dayFactor));
  });

  // 신뢰구간 (표준편차 기반)
  const salesValues = last7.map(e => e.sales);
  const stdDev = salesValues.length > 1
    ? Math.sqrt(salesValues.reduce((s, v) => s + (v - avg7) ** 2, 0) / salesValues.length)
    : avg7 * 0.15;
  const confidenceBand = stdDev * 1.2;

  // 차트 데이터 통합
  const actualDays = recent14.slice(-7);
  const allPoints = [
    ...actualDays.map((e, i) => ({ day: i, sales: e.sales, type: "actual" as const })),
    ...forecastPoints.map((s, i) => ({ day: actualDays.length + i, sales: s, type: "forecast" as const })),
  ];
  const maxSales = Math.max(...allPoints.map(p => p.sales + confidenceBand), breakEvenDailySales * 1.2, 1);

  // 3개월 현금 예측
  const totalMonthlyCosts = monthlyCosts.ingredients + monthlyCosts.labor + monthlyCosts.rent + monthlyCosts.utilities + monthlyCosts.other;
  const projectedMonthlySales = avg7 * 26;
  const monthlyNet = projectedMonthlySales - totalMonthlyCosts;
  const months3Cash = capitalLeft + monthlyNet * 3;
  const cashRunoutMonth = monthlyNet < 0 && capitalLeft > 0
    ? Math.max(0, Math.floor(capitalLeft / Math.abs(monthlyNet)))
    : -1; // -1 = 흑자

  // SVG 차트 치수
  const chartW = 400;
  const chartH = 140;
  const padL = 0;
  const padR = 0;
  const padT = 10;
  const padB = 20;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const toX = (i: number) => padL + (i / (allPoints.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - (v / maxSales) * plotH;

  // 경로 생성
  const actualPath = actualDays.map((_, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(allPoints[i].sales)}`).join(" ");
  const forecastPath = forecastPoints.map((s, i) => {
    const idx = actualDays.length + i;
    return `${i === 0 ? `M${toX(actualDays.length - 1)},${toY(actualDays[actualDays.length - 1].sales)} L` : "L"}${toX(idx)},${toY(s)}`;
  }).join(" ");

  // 신뢰구간 영역
  const bandTop = forecastPoints.map((s, i) => `${toX(actualDays.length + i)},${toY(Math.min(maxSales, s + confidenceBand))}`).join(" ");
  const bandBottom = [...forecastPoints].reverse().map((s, i) => `${toX(actualDays.length + forecastDays - 1 - i)},${toY(Math.max(0, s - confidenceBand))}`).join(" ");
  const bandPath = `M${toX(actualDays.length - 1)},${toY(actualDays[actualDays.length - 1].sales)} ${bandTop} ${bandBottom} Z`;

  // BEP 라인 Y
  const bepY = toY(breakEvenDailySales);

  // 예측 방향
  const trendLabel = trend > 0.03 ? (ko ? "상승 추세" : "Uptrend") : trend < -0.03 ? (ko ? "하락 추세" : "Downtrend") : (ko ? "유지 추세" : "Stable");
  const trendColor = trend > 0.03 ? "#059669" : trend < -0.03 ? "#dc2626" : "#d97706";

  return (
    <section style={card} className="bento-card">
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={eyebrow}>{ko ? "매출 예측" : "Sales Forecast"}</div>
          <div style={title}>{ko ? "이대로 가면" : "If This Continues"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: trendColor }} />
          <span style={{ fontSize: "12px", fontWeight: 620, color: trendColor }}>{trendLabel}</span>
        </div>
      </div>

      {/* SVG 차트 */}
      <div style={{ position: "relative" as const, marginTop: "8px" }}>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height="auto" style={{ overflow: "visible" }}>
          <defs>
            {/* 실적 라인 그라데이션 */}
            <linearGradient id="fg-actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d3557" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#1d3557" stopOpacity="0.02" />
            </linearGradient>
            {/* 예측 신뢰구간 */}
            <linearGradient id="fg-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* BEP 기준선 */}
          {breakEvenDailySales > 0 && (
            <>
              <line x1={padL} y1={bepY} x2={chartW} y2={bepY} stroke="#dc2626" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              <text x={chartW - 2} y={bepY - 4} textAnchor="end" fontSize="8" fill="#dc2626" opacity="0.5">BEP</text>
            </>
          )}

          {/* 실적 영역 채우기 */}
          <path
            d={`${actualPath} L${toX(actualDays.length - 1)},${chartH - padB} L${toX(0)},${chartH - padB} Z`}
            fill="url(#fg-actual)"
          />

          {/* 신뢰구간 영역 */}
          <path d={bandPath} fill="url(#fg-band)" />

          {/* 실적 라인 */}
          <path d={actualPath} fill="none" stroke="#1d3557" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* 예측 라인 (점선) */}
          <path d={forecastPath} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" opacity="0.7" />

          {/* 실적 포인트 */}
          {actualDays.map((e, i) => (
            <circle key={e.date} cx={toX(i)} cy={toY(e.sales)} r="3.5" fill="#fff" stroke="#1d3557" strokeWidth="2">
              <animate attributeName="r" from="0" to="3.5" dur="0.4s" begin={`${i * 0.06}s`} fill="freeze" />
            </circle>
          ))}

          {/* 예측 포인트 */}
          {forecastPoints.map((s, i) => (
            <circle key={`f-${i}`} cx={toX(actualDays.length + i)} cy={toY(s)} r="3" fill="#fff" stroke="#2563eb" strokeWidth="1.5" opacity="0.6">
              <animate attributeName="r" from="0" to="3" dur="0.3s" begin={`${0.5 + i * 0.06}s`} fill="freeze" />
            </circle>
          ))}

          {/* 구분선: 실적 | 예측 */}
          <line x1={toX(actualDays.length - 0.5)} y1={padT} x2={toX(actualDays.length - 0.5)} y2={chartH - padB} stroke="rgba(15,23,42,0.08)" strokeWidth="1" strokeDasharray="2 3" />

          {/* 레이블 */}
          <text x={toX(3)} y={chartH - 4} textAnchor="middle" fontSize="9" fill="rgba(15,23,42,0.35)">{ko ? "실적" : "Actual"}</text>
          <text x={toX(actualDays.length + 3)} y={chartH - 4} textAnchor="middle" fontSize="9" fill="rgba(37,99,235,0.5)">{ko ? "예측" : "Forecast"}</text>
        </svg>
      </div>

      {/* 예측 요약 지표 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
        <div style={metricBox}>
          <div style={metricLabel}>{ko ? "다음 주 예상 일매출" : "Next week daily"}</div>
          <div className="bento-number" style={{ ...metricValue, color: "#1d3557" }}>{fmt(Math.round(avg7))}</div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>{ko ? "다음 달 예상 총매출" : "Next month total"}</div>
          <div className="bento-number" style={{ ...metricValue, color: "#1d3557" }}>{fmt(Math.round(avg7 * 26))}</div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>{ko ? "신뢰도" : "Confidence"}</div>
          <div style={{ ...metricValue, color: dailyEntries.length >= 30 ? "#059669" : dailyEntries.length >= 14 ? "#d97706" : "#dc2626" }}>
            {dailyEntries.length >= 30 ? (ko ? "높음" : "High") : dailyEntries.length >= 14 ? (ko ? "보통" : "Medium") : (ko ? "낮음" : "Low")}
          </div>
          <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.3)", marginTop: "1px" }}>
            {dailyEntries.length}{ko ? "일 데이터" : "d data"}
          </div>
        </div>
      </div>

      {/* "이대로 가면" 3개월 시나리오 — 손실 프레이밍 */}
      <div style={{
        marginTop: "14px", padding: "16px", borderRadius: "16px",
        background: months3Cash < 0 ? "rgba(220,38,38,0.04)" : monthlyNet < 0 ? "rgba(217,119,6,0.04)" : "rgba(5,150,105,0.04)",
        border: `1px solid ${months3Cash < 0 ? "rgba(220,38,38,0.08)" : monthlyNet < 0 ? "rgba(217,119,6,0.08)" : "rgba(5,150,105,0.08)"}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l6.93 12H1.07L8 1z" fill={months3Cash < 0 ? "#dc2626" : monthlyNet < 0 ? "#d97706" : "#059669"} opacity="0.15" />
            <path d="M8 6v3M8 11h.01" stroke={months3Cash < 0 ? "#dc2626" : monthlyNet < 0 ? "#d97706" : "#059669"} strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 660, color: months3Cash < 0 ? "#dc2626" : monthlyNet < 0 ? "#b45309" : "#059669" }}>
            {months3Cash < 0
              ? (ko ? "3개월 후 현금 부족 예상" : "Cash shortage expected in 3 months")
              : monthlyNet < 0
                ? (ko ? `현금 소진까지 약 ${cashRunoutMonth}개월` : `~${cashRunoutMonth} months until cash runs out`)
                : (ko ? "현재 추세로 안정적입니다" : "Current trend is sustainable")}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              {ko ? "월 순이익 예상" : "Monthly net"}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 740, letterSpacing: "-0.03em", color: monthlyNet >= 0 ? "#059669" : "#dc2626" }}>
              {monthlyNet >= 0 ? "+" : ""}{fmt(monthlyNet)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              {ko ? "3개월 후 예상 현금" : "Cash in 3 months"}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 740, letterSpacing: "-0.03em", color: months3Cash >= 0 ? "#059669" : "#dc2626" }}>
              {months3Cash >= 0 ? "" : ""}{fmt(months3Cash)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "24px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(243,246,251,0.91))",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset, 0 18px 42px rgba(15, 23, 42, 0.038)",
  display: "grid",
  gap: "4px",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
  marginBottom: "2px",
};

const title: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 740,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  lineHeight: 1.1,
};

const metricBox: React.CSSProperties = {
  padding: "12px",
  borderRadius: "14px",
  background: "linear-gradient(180deg, rgba(248,250,253,0.92), rgba(242,246,250,0.82))",
  border: "1px solid rgba(15,23,42,0.04)",
};

const metricLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 650,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
  marginBottom: "4px",
};

const metricValue: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 760,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
};
