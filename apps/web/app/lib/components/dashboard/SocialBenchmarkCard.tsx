"use client";

import { useMemo } from "react";
import { Users, TrendingUp, Award } from "lucide-react";
import { getIndustryBenchmark } from "@build-up/shared";
import type { DailyEntry } from "../../stores/finance-store";
import { EmptyStateCard } from "./EmptyStateCard";

type Props = {
  ko: boolean;
  industryCategoryId: string;
  dailyEntries: DailyEntry[];
};

/**
 * Social Benchmark Card — Hook Model의 "Tribe Reward" (사회적 보상).
 *
 * 사용자 월매출을 업종 평균·상위10%·하위10%와 비교.
 * 데이터 출처: @build-up/shared/franchise-benchmarks (공정거래위원회 기반).
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
    const thisMonth = now.toISOString().slice(0, 7);
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

  const toneColor = tone === "positive" ? "#059669" : tone === "warning" ? "#b45309" : "#2563eb";
  const toneBg = tone === "positive" ? "rgba(5,150,105,0.04)" : tone === "warning" ? "rgba(217,119,6,0.04)" : "rgba(37,99,235,0.04)";

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
        background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,253,0.9) 100%)",
        border: "1px solid rgba(15,23,42,0.05)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset",
      }}
      className="bento-card"
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 650,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "rgba(15,23,42,0.4)",
              marginBottom: "2px",
            }}
          >
            {ko ? "업종 비교" : "Industry Benchmark"}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
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

      {/* 내 매장 */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 650, color: "rgba(15,23,42,0.6)" }}>
            {ko ? "내 매장 (이번 달 예상)" : "My store (this month est.)"}
          </span>
          <span style={{ fontSize: "14px", fontWeight: 720, color: toneColor, fontVariantNumeric: "tabular-nums" as const }}>
            {fmt(projectedMonthly)}
          </span>
        </div>
        <div
          style={{
            height: "6px",
            background: "rgba(15,23,42,0.04)",
            borderRadius: "3px",
            position: "relative" as const,
            overflow: "hidden" as const,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${userPct}%`,
              background: toneColor,
              borderRadius: "3px",
              opacity: 0.85,
              transition: "width 0.4s ease",
            }}
          />
          {/* 평균 라인 */}
          <div
            style={{
              position: "absolute" as const,
              left: `${avgPct}%`,
              top: 0,
              bottom: 0,
              width: "1.5px",
              background: "rgba(15,23,42,0.4)",
            }}
          />
          {/* 상위10% 라인 */}
          <div
            style={{
              position: "absolute" as const,
              left: `${top10Pct}%`,
              top: 0,
              bottom: 0,
              width: "1.5px",
              background: "rgba(5,150,105,0.6)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(15,23,42,0.4)", marginTop: "4px", fontWeight: 600 }}>
          <span>{ko ? "0" : "0"}</span>
          <span>{ko ? `평균 ${fmt(avgMonthly)}` : `Avg ${fmt(avgMonthly)}`}</span>
          <span style={{ color: "rgba(5,150,105,0.7)" }}>{ko ? `상위 10% ${fmt(top10Monthly)}` : `Top 10% ${fmt(top10Monthly)}`}</span>
        </div>
      </div>

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

      {/* 출처 */}
      <div style={{ marginTop: "10px", fontSize: "10px", color: "rgba(15,23,42,0.35)", fontWeight: 500 }}>
        {ko
          ? "출처: 공정거래위원회 가맹사업 정보공개서 · 소상공인실태조사"
          : "Source: Fair Trade Commission franchise disclosures · SMB survey"}
      </div>
    </section>
  );
}
