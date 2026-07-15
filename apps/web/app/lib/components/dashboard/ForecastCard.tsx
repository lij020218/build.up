"use client";

import { useMemo } from "react";
import { formatKrw } from "../../utils/format-krw";
import { LineChart } from "lucide-react";
import { EmptyStateCard } from "./EmptyStateCard";
import { entriesInLastDays, honestDailyAverage } from "../../utils/daily-windows";

/**
 * 매출 예측 카드 — 다음 주 매출 추세만 책임 (2026-05-13 단순화).
 * - 7일 실적 + 7일 예측선 SVG 차트 (그라데이션 + 신뢰구간)
 * - 업종별 핵심 Input 지표
 *
 * ⚠️ 이전엔 "3개월 현금 시나리오" 도 표시했으나, Cashflow13WeekForecastCard
 * (Tier 2 / 정산채널·고정비·VAT 정밀 반영) 와 중복 + 단순 추정으로 부정확.
 * 현금 예측 SSOT 는 Cashflow13Week. 본 카드는 매출 트렌드만.
 */

type DailyEntry = { date: string; sales: number; customers: number };
type MonthlyCosts = { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number };

type Props = {
  ko: boolean;
  dailyEntries: DailyEntry[];
  monthlyCosts: MonthlyCosts;
  capitalLeft: number;
  breakEvenDailySales: number;
  industryCategoryId: string;
  initialOperatingCapital?: number;
};

const fmt = (n: number) => {
  const rounded = Math.round(n);
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? "−" : ""; // 음수 부호 보존 — 모든 표시 분기에서 일관
  // 1억 이상은 "15,000만원" 이 아니라 "1억 5,000만원" 이라 읽는다. 억 표기는 SSOT(formatKrw)에 위임 —
  //   여기서 억 로직을 또 구현하면 같은 계산이 파일마다 복제된다. (2026-07 사장님 지적)
  if (abs >= 100_000_000) return `${sign}${formatKrw(abs)}`;
  if (abs >= 10000) return `${sign}${Math.round(abs / 10000).toLocaleString()}만원`;
  return `${sign}${abs.toLocaleString()}원`;
};

export function ForecastCard({ ko, dailyEntries, monthlyCosts, capitalLeft, breakEvenDailySales, industryCategoryId, initialOperatingCapital }: Props) {
  const sorted = useMemo(() =>
    [...dailyEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [dailyEntries]
  );

  // 최근 14일 실적
  const recent14 = sorted.slice(-14);
  if (recent14.length < 3) {
    return (
      <EmptyStateCard
        ko={ko}
        eyebrow={ko ? "매출 예측" : "Sales Forecast"}
        title={ko ? "3일치 데이터가 모이면 예측이 시작돼요" : "Forecast unlocks with 3 days of data"}
        description={ko
          ? "지난 2주 매출을 기반으로 다음 주 일매출 추세를 그립니다."
          : "We'll chart next week's daily sales trend from your recent 14 days."}
        Icon={LineChart}
        progress={{
          current: recent14.length,
          target: 3,
          unitKo: "일",
          unitEn: "days",
        }}
      />
    );
  }

  // ⚠️ 예측 — *날짜 기반* 윈도우 + 경과일수 분모 (2026-05-11 fix).
  //  이전: sorted.slice(-7) 7개 entry / .length 분모 → sparse 입력이면 평균 과대 →
  //  forecast 폭주. honestDailyAverage 가 MAX(entry, 경과일) 분모 보장.
  const last7Date = entriesInLastDays(sorted, 7);
  const last14Date = entriesInLastDays(sorted, 14);
  const avg7Info = honestDailyAverage(last7Date, (e) => e.sales);
  const avg14Info = honestDailyAverage(last14Date, (e) => e.sales);
  const avg7 = avg7Info.avg;
  const avg14 = avg14Info.avg;
  const trend = avg14 > 0 ? (avg7 - avg14) / avg14 : 0;
  const last7 = last7Date; // 신뢰구간·차트 actual 표시용

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

  // 2026-05-13: 3개월 현금 예측 로직 제거 — Cashflow13WeekForecastCard 가 SSOT.
  //   본 카드는 다음 주 매출 트렌드 책임만.
  // suppress unused warnings for backward-compat props (caller 가 여전히 전달)
  void monthlyCosts; void capitalLeft; void initialOperatingCapital;

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
  const trendColor = trend > 0.03 ? "#1d3557" : trend < -0.03 ? "#b64c4c" : "#191970";

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
              <stop offset="0%" stopColor="#191970" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#191970" stopOpacity="0.02" />
            </linearGradient>
            {/* 예측 신뢰구간 */}
            <linearGradient id="fg-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#191970" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#191970" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* BEP 기준선 */}
          {breakEvenDailySales > 0 && (
            <>
              <line x1={padL} y1={bepY} x2={chartW} y2={bepY} stroke="#b64c4c" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              <text x={chartW - 2} y={bepY - 4} textAnchor="end" fontSize="8" fill="#b64c4c" opacity="0.5">BEP</text>
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
          <path d={actualPath} fill="none" stroke="#191970" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* 예측 라인 (점선) */}
          <path d={forecastPath} fill="none" stroke="#191970" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" opacity="0.7" />

          {/* 실적 포인트 */}
          {actualDays.map((e, i) => (
            <circle key={e.date} cx={toX(i)} cy={toY(e.sales)} r="3.5" fill="#fff" stroke="#191970" strokeWidth="2">
              <animate attributeName="r" from="0" to="3.5" dur="0.4s" begin={`${i * 0.06}s`} fill="freeze" />
            </circle>
          ))}

          {/* 예측 포인트 */}
          {forecastPoints.map((s, i) => (
            <circle key={`f-${i}`} cx={toX(actualDays.length + i)} cy={toY(s)} r="3" fill="#fff" stroke="#191970" strokeWidth="1.5" opacity="0.6">
              <animate attributeName="r" from="0" to="3" dur="0.3s" begin={`${0.5 + i * 0.06}s`} fill="freeze" />
            </circle>
          ))}

          {/* 구분선: 실적 | 예측 */}
          <line x1={toX(actualDays.length - 0.5)} y1={padT} x2={toX(actualDays.length - 0.5)} y2={chartH - padB} stroke="rgba(15,23,42,0.08)" strokeWidth="1" strokeDasharray="2 3" />

          {/* 레이블 */}
          <text x={toX(3)} y={chartH - 4} textAnchor="middle" fontSize="9" fill="rgba(15,23,42,0.35)">{ko ? "실적" : "Actual"}</text>
          <text x={toX(actualDays.length + 3)} y={chartH - 4} textAnchor="middle" fontSize="9" fill="rgba(25,25,112,0.5)">{ko ? "예측" : "Forecast"}</text>
        </svg>
      </div>

      {/* 예측 요약 지표 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
        <div style={metricBox}>
          <div style={metricLabel}>{ko ? "다음 주 예상 일매출" : "Next week daily"}</div>
          <div className="bento-number" style={{ ...metricValue, color: "#191970" }}>{fmt(Math.round(avg7))}</div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>{ko ? "다음 달 예상 총매출" : "Next month total"}</div>
          <div className="bento-number" style={{ ...metricValue, color: "#191970" }}>{fmt(Math.round(avg7 * 26))}</div>
        </div>
        <div style={metricBox}>
          <div style={metricLabel}>{ko ? "신뢰도" : "Confidence"}</div>
          <div style={{ ...metricValue, color: dailyEntries.length >= 30 ? "#1d3557" : dailyEntries.length >= 14 ? "#191970" : "#b64c4c" }}>
            {dailyEntries.length >= 30 ? (ko ? "높음" : "High") : dailyEntries.length >= 14 ? (ko ? "보통" : "Medium") : (ko ? "낮음" : "Low")}
          </div>
          <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "1px" }}>
            {dailyEntries.length}{ko ? "일 데이터" : "d data"}
          </div>
        </div>
      </div>

      {/* 2026-05-13: 3개월 현금 시나리오 박스 제거 — Cashflow13WeekForecastCard (Tier 2, SSOT) 가 책임.
          본 카드는 "다음 주 매출 트렌드" 단일 목적으로 단순화. */}
    </section>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "20px",
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
  color: "var(--muted)",
  marginBottom: "2px",
};

const title: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
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
  color: "var(--muted)",
  marginBottom: "4px",
};

const metricValue: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 760,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
};
