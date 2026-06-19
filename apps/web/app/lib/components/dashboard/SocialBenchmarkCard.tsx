"use client";

import { useMemo } from "react";
import { Users, TrendingUp, Award } from "lucide-react";
import { getIndustryBenchmark, FRANCHISE_BENCHMARK_PROVENANCE } from "@foundone/shared";
import type { DailyEntry } from "../../stores/finance-store";
import { EmptyStateCard } from "./EmptyStateCard";
import { getKstDate } from "../../utils/business-day";

type Props = {
  ko: boolean;
  industryCategoryId: string;
  dailyEntries: DailyEntry[];
};

/**
 * Social Benchmark Card — Hook Model의 "Tribe Reward" (사회적 보상).
 *
 * 사용자 월매출을 업종 평균·상위10%·하위10%와 비교.
 * 데이터 출처: @foundone/shared/franchise-benchmarks (공정거래위원회 기반).
 *
 * Phase 1: 정적 업종 벤치마크 기반 위치 추정
 * Phase 2: Supabase 익명 집계 (같은 지역·업종 실시간 비교)
 *
 * 표시 원칙:
 * - 긍정적 프레이밍: 개선 거리도 "도달 가능"으로 표현
 * - 데이터 출처 명시 (신뢰도)
 * - 스트레스 최소화 (비교 스트레스 → 동기부여 전환)
 */
export function SocialBenchmarkCard({ ko, industryCategoryId, dailyEntries }: Props) {
  const analysis = useMemo(() => {
    const benchmark = getIndustryBenchmark(industryCategoryId);
    if (!benchmark) return null;

    // 이번 달 매출 (영업일로 환산)
    const now = new Date();
    const thisMonth = getKstDate(now).slice(0, 7);
    const monthEntries = dailyEntries.filter((e) => e.date.startsWith(thisMonth));
    if (monthEntries.length < 3) return { insufficientData: true as const, days: monthEntries.length };

    const monthSales = monthEntries.reduce((s, e) => s + e.sales, 0);
    const avgDaily = monthSales / monthEntries.length;
    // 월 26 영업일 가정 (업종 통계 기준)
    const projectedMonthly = avgDaily * 26;

    // 벤치마크 (연간 → 월 환산, 단위: 만원)
    const avgMonthly = (benchmark.avgAnnualRevenue / 12) * 10000;          // 원
    const top10Monthly = (benchmark.top10PctRevenue / 12) * 10000;
    const bottom10Monthly = (benchmark.bottom10PctRevenue / 12) * 10000;

    // 백분위 추정 (3 포인트 선형 보간)
    let percentile: number;
    if (projectedMonthly <= bottom10Monthly) {
      percentile = 10;
    } else if (projectedMonthly <= avgMonthly) {
      // 10 ~ 50 사이
      const ratio = (projectedMonthly - bottom10Monthly) / Math.max(1, avgMonthly - bottom10Monthly);
      percentile = 10 + ratio * 40;
    } else if (projectedMonthly <= top10Monthly) {
      // 50 ~ 90 사이
      const ratio = (projectedMonthly - avgMonthly) / Math.max(1, top10Monthly - avgMonthly);
      percentile = 50 + ratio * 40;
    } else {
      percentile = 95;
    }

    return {
      insufficientData: false as const,
      days: monthEntries.length,
      projectedMonthly,
      avgMonthly,
      top10Monthly,
      bottom10Monthly,
      percentile: Math.round(percentile),
    };
  }, [industryCategoryId, dailyEntries]);

  if (!analysis) {
    // 업종 정보 없음 → 카드 숨김
    return null;
  }

  if (analysis.insufficientData) {
    return (
      <EmptyStateCard
        ko={ko}
        eyebrow={ko ? "업종 비교" : "Industry Benchmark"}
        title={ko ? "3일 이상 기록하면 비교가 열려요" : "Benchmark unlocks after 3 days"}
        description={ko
          ? "같은 업종 평균·상위 10%와 비교해서 내 매장의 위치를 알려드려요. 공정거래위원회 통계 기반."
          : "See where you stand vs industry average and top 10%, based on Fair Trade Commission data."}
        Icon={Users}
        progress={{
          current: analysis.days,
          target: 3,
          unitKo: "일",
          unitEn: "days",
        }}
      />
    );
  }

  const { projectedMonthly, avgMonthly, top10Monthly, percentile } = analysis;
  const fmt = (n: number) => {
    const abs = Math.abs(Math.round(n));
    if (abs >= 100000000) return `${Math.round(n / 10000000) / 10}억원`;
    if (abs >= 10000) return `${Math.round(n / 10000).toLocaleString()}만원`;
    return `${abs.toLocaleString()}원`;
  };

  // ── 최근 4주 내 매장 주간 매출 (환산 월 추정) ──────────────
  // 각 주마다 (주간 매출 합 × 4.33) = 월 환산 추정
  const weeklyProjections: Array<{ label: string; value: number }> = (() => {
    const result: Array<{ label: string; value: number }> = [];
    const today = new Date();
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (w * 7 + 6));
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - w * 7);
      const startStr = getKstDate(weekStart);
      const endStr = getKstDate(weekEnd);
      const weekEntries = dailyEntries.filter((e) => e.date >= startStr && e.date <= endStr);
      const weekSales = weekEntries.reduce((s, e) => s + e.sales, 0);
      const workedDays = weekEntries.length;
      const projected = workedDays > 0 ? (weekSales / workedDays) * 26 : 0;
      const label = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
      result.push({ label, value: projected });
    }
    return result;
  })();
  const hasWeeklyTrend = weeklyProjections.filter((w) => w.value > 0).length >= 2;

  const momDelta = weeklyProjections.length >= 2 && weeklyProjections[weeklyProjections.length - 2].value > 0
    ? ((weeklyProjections[weeklyProjections.length - 1].value - weeklyProjections[weeklyProjections.length - 2].value) / weeklyProjections[weeklyProjections.length - 2].value) * 100
    : null;

  // 위치별 색상·메시지
  const { tone, message } = (() => {
    if (percentile >= 75) {
      return {
        tone: "positive" as const,
        message: ko
          ? `같은 업종 상위 ${100 - percentile}% 수준이에요. 이 페이스를 유지하세요.`
          : `Top ${100 - percentile}% in your industry. Keep this pace.`,
      };
    }
    if (percentile >= 40) {
      const gapToTop = top10Monthly - projectedMonthly;
      return {
        tone: "neutral" as const,
        message: ko
          ? `업종 평균 근처에요. 상위 10%까지 월 ${fmt(gapToTop)} 더 필요합니다.`
          : `Near industry average. ${fmt(gapToTop)} more per month to reach top 10%.`,
      };
    }
    const gapToAvg = avgMonthly - projectedMonthly;
    return {
      tone: "warning" as const,
      message: ko
        ? `업종 평균보다 아래에요. 평균까지 월 ${fmt(gapToAvg)} 추가 필요.`
        : `Below average. ${fmt(gapToAvg)} more per month to reach industry average.`,
    };
  })();

  const toneColor = tone === "positive" ? "#1d3557" : tone === "warning" ? "#191970" : "#191970";
  const toneBg = tone === "positive" ? "rgba(29,53,87,0.04)" : tone === "warning" ? "rgba(25,25,112,0.04)" : "rgba(25,25,112,0.04)";

  // 막대 차트 3 구간 — 0 ~ top10Monthly
  const barMax = Math.max(top10Monthly, projectedMonthly * 1.1);
  const avgPct = (avgMonthly / barMax) * 100;
  const top10Pct = (top10Monthly / barMax) * 100;
  const userPct = Math.min(100, (projectedMonthly / barMax) * 100);

  return (
    <section
      style={{
        borderRadius: "20px",
        padding: "20px 22px",
        background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
        border: "1px solid rgba(25,25,112,0.10)",
        boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
      }}
      className="bento-card"
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <div
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: "#191970",
              opacity: 0.7,
              marginBottom: "2px",
            }}
          >
            {ko ? "업종 비교" : "Industry Benchmark"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f0f4a", letterSpacing: "-0.02em" }}>
            {ko ? "같은 업종에서 내 위치" : "Your position in industry"}
          </div>
        </div>
        <div
          style={{
            padding: "5px 12px",
            borderRadius: "10px",
            background: toneBg,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {tone === "positive" ? <Award size={13} strokeWidth={1.5} color={toneColor} /> : <TrendingUp size={13} strokeWidth={1.5} color={toneColor} />}
          <span style={{ fontSize: "12px", fontWeight: 700, color: toneColor }}>
            {ko ? `상위 ${100 - percentile}%` : `Top ${100 - percentile}%`}
          </span>
        </div>
      </div>

      {/* 주간 매출 3-라인 차트 (내 가게 라인 + 평균·상위 10% 수평 기준선) */}
      {hasWeeklyTrend ? (
        <WeeklyBenchmarkChart
          ko={ko}
          weekly={weeklyProjections}
          avgMonthly={avgMonthly}
          top10Monthly={top10Monthly}
          toneColor={toneColor}
          momDelta={momDelta}
          fmt={fmt}
        />
      ) : (
        // 주간 데이터 부족 시 기존 단일 바 표시
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 650, color: "rgba(15,23,42,0.6)" }}>
              {ko ? "내 매장 (이번 달 예상)" : "My store (this month est.)"}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 720, color: toneColor, fontVariantNumeric: "tabular-nums" as const }}>
              {fmt(projectedMonthly)}
            </span>
          </div>
          <div style={{ height: "6px", background: "rgba(25,25,112,0.04)", borderRadius: "3px", position: "relative" as const, overflow: "hidden" as const }}>
            <div style={{ height: "100%", width: `${userPct}%`, background: toneColor, borderRadius: "3px", opacity: 0.85, transition: "width 0.4s ease" }} />
            <div style={{ position: "absolute" as const, left: `${avgPct}%`, top: 0, bottom: 0, width: "1.5px", background: "rgba(15,23,42,0.4)" }} />
            <div style={{ position: "absolute" as const, left: `${top10Pct}%`, top: 0, bottom: 0, width: "1.5px", background: "rgba(29,53,87,0.6)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted)", marginTop: "4px", fontWeight: 600 }}>
            <span>{ko ? "0" : "0"}</span>
            <span>{ko ? `평균 ${fmt(avgMonthly)}` : `Avg ${fmt(avgMonthly)}`}</span>
            <span style={{ color: "rgba(29,53,87,0.7)" }}>{ko ? `상위 10% ${fmt(top10Monthly)}` : `Top 10% ${fmt(top10Monthly)}`}</span>
          </div>
        </div>
      )}

      {/* 인사이트 메시지 */}
      <div
        style={{
          marginTop: "14px",
          padding: "10px 12px",
          borderRadius: "10px",
          background: toneBg,
          fontSize: "12px",
          lineHeight: 1.55,
          color: toneColor,
          fontWeight: 600,
        }}
      >
        {message}
      </div>

      {/* 출처·기준연도·분포추정 (iOS WeeklyPulse 1:1) */}
      <div style={{ marginTop: "10px", fontSize: "10px", color: "var(--muted)", fontWeight: 500, lineHeight: 1.5 }}>
        {ko
          ? `※ 기준 ${FRANCHISE_BENCHMARK_PROVENANCE.disclosureYear}년 · 공정거래위원회 가맹사업 정보공개서 · 소상공인실태조사`
          : `* As of ${FRANCHISE_BENCHMARK_PROVENANCE.disclosureYear} · Fair Trade Commission franchise disclosures · SMB survey`}
        <br />
        {ko ? "상·하위 10%는 분포 추정치입니다." : "Upper/lower 10% bands are distribution estimates."}
      </div>
    </section>
  );
}

// ─── 3-라인 벤치마크 차트 (내 가게 solid + 평균·상위 10% dashed) ──────────

function WeeklyBenchmarkChart({
  ko,
  weekly,
  avgMonthly,
  top10Monthly,
  toneColor,
  momDelta,
  fmt,
}: {
  ko: boolean;
  weekly: Array<{ label: string; value: number }>;
  avgMonthly: number;
  top10Monthly: number;
  toneColor: string;
  momDelta: number | null;
  fmt: (n: number) => string;
}) {
  const w = 320;
  const h = 140;
  const pad = { top: 12, right: 12, bottom: 28, left: 12 };
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;

  const allValues = [...weekly.map((v) => v.value), avgMonthly, top10Monthly];
  const max = Math.max(...allValues) * 1.1;
  const min = 0;
  const range = max - min || 1;

  const x = (i: number) => pad.left + (i / Math.max(1, weekly.length - 1)) * iw;
  const y = (v: number) => pad.top + ih - ((v - min) / range) * ih;

  // 내 가게 라인 (smoothed cubic bezier)
  const points = weekly.map((v, i) => ({ x: x(i), y: y(v.value) }));
  const myPath = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx.toFixed(2)} ${prev.y.toFixed(2)}, ${cpx.toFixed(2)} ${p.y.toFixed(2)}, ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(" ");
  const fillPath = `${myPath} L ${points[points.length - 1].x.toFixed(2)} ${(pad.top + ih).toFixed(2)} L ${points[0].x.toFixed(2)} ${(pad.top + ih).toFixed(2)} Z`;

  const avgY = y(avgMonthly);
  const topY = y(top10Monthly);
  const endPoint = points[points.length - 1];
  const gradId = `bench-fill-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "11.5px", fontWeight: 650, color: "rgba(15,23,42,0.6)" }}>
          {ko ? "주간 매출 (월 환산, 최근 4주)" : "Weekly revenue (monthly est., last 4w)"}
        </span>
        {momDelta !== null && (
          <span style={{ fontSize: "12px", fontWeight: 650, color: momDelta >= 0 ? "#1d3557" : "#b64c4c", fontVariantNumeric: "tabular-nums" as const }}>
            {momDelta >= 0 ? "↑" : "↓"} {Math.abs(momDelta).toFixed(1)}%
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={toneColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={toneColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 평균 dashed 수평선 (gray) */}
        <line
          x1={pad.left} x2={w - pad.right} y1={avgY} y2={avgY}
          stroke="rgba(15,23,42,0.32)" strokeWidth={1.2} strokeDasharray="4 4"
        />
        <text x={w - pad.right - 4} y={avgY - 4} textAnchor="end" fontSize="9.5" fontWeight="600" fill="rgba(15,23,42,0.5)">
          {ko ? `평균 ${fmt(avgMonthly)}` : `Avg ${fmt(avgMonthly)}`}
        </text>

        {/* 상위 10% dashed 수평선 (mint) */}
        <line
          x1={pad.left} x2={w - pad.right} y1={topY} y2={topY}
          stroke="rgba(29,53,87,0.5)" strokeWidth={1.2} strokeDasharray="4 4"
        />
        <text x={w - pad.right - 4} y={topY - 4} textAnchor="end" fontSize="9.5" fontWeight="600" fill="rgba(29,53,87,0.8)">
          {ko ? `상위 10% ${fmt(top10Monthly)}` : `Top 10% ${fmt(top10Monthly)}`}
        </text>

        {/* 내 가게 그라디언트 fill */}
        <path d={fillPath} fill={`url(#${gradId})`} />

        {/* 내 가게 solid 라인 */}
        <path d={myPath} fill="none" stroke={toneColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* 끝점 dot */}
        <circle cx={endPoint.x} cy={endPoint.y} r={4} fill={toneColor} />
        <circle cx={endPoint.x} cy={endPoint.y} r={7} fill={toneColor} opacity={0.18} />

        {/* X축 label */}
        {weekly.map((w2, i) => (
          <text key={i} x={x(i)} y={h - 8} textAnchor="middle" fontSize="9.5" fontWeight="500" fill="rgba(15,23,42,0.4)">
            {w2.label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px", fontWeight: 550, marginTop: "6px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "rgba(15,23,42,0.7)" }}>
          <span style={{ width: "12px", height: "2px", background: toneColor, borderRadius: "1px" }} />
          {ko ? "내 가게" : "My store"} <strong style={{ color: toneColor, fontWeight: 700, fontVariantNumeric: "tabular-nums" as const }}>{fmt(weekly[weekly.length - 1].value)}</strong>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--muted)" }}>
          <span style={{ width: "12px", height: "1.5px", background: "rgba(15,23,42,0.32)", borderRadius: "1px" }} />
          {ko ? "평균" : "Avg"}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "rgba(29,53,87,0.75)" }}>
          <span style={{ width: "12px", height: "1.5px", background: "rgba(29,53,87,0.5)", borderRadius: "1px" }} />
          {ko ? "상위 10%" : "Top 10%"}
        </span>
      </div>
    </div>
  );
}
