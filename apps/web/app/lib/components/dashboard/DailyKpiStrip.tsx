"use client";

/**
 * DailyKpiStrip — Tier 1 (운영 대시보드 매일 30초) 의 5칸 KPI 가로 strip.
 *
 * 사장님이 임계값 색만 봐도 "오늘 가게 정상/주의/위험" 즉시 판단.
 * 업종(categoryId) 별로 어떤 5칸이 보이는지 다름 — daily-kpi-config.ts 카탈로그 분기.
 *
 * 디자인:
 *  - 5칸 horizontal grid (반응형: 모바일은 2-3개씩 wrap)
 *  - 각 칸: 라벨(작게) + 큰 숫자 + 트렌드(±%) + 임계값 색
 *  - 색: green(good) / amber(warning) / red(bad) / neutral(데이터 없음)
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  getDailyKpiCells,
  type KpiCellConfig,
  type KpiThresholds,
} from "@foundone/shared";

export type KpiValue = {
  /** 표시할 raw 값 (number 형식). 데이터 없으면 null/undefined */
  value: number | null | undefined;
  /** 전주 동기간 / 전월 대비 변화율 (%) */
  trendPct?: number;
  /** 직접 표시할 string (예: "—", "준비 중") — value 무시 */
  displayOverride?: string;
};

type Props = {
  ko: boolean;
  industryCategoryId?: string;
  /** cell.id → KpiValue lookup */
  values: Record<string, KpiValue | undefined>;
};

type KpiTone = {
  bg: string;
  fg: string;
  border: string;
  labelColor: string;
  shadow: string;
  state: "neutral" | "good" | "warning" | "bad";
};

/** 임계값 비교 → 색상 결정. 미드나이트 톤 + Apple iOS semantic 컬러 통합. */
function evaluateColor(value: number | null | undefined, t: KpiThresholds | undefined): KpiTone {
  // 데이터 없거나 임계값 없으면 neutral — 미드나이트 light tint (회색 X)
  if (value == null || !t) {
    return {
      bg: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
      fg: "#0f0f4a",
      border: "rgba(25,25,112,0.10)",
      labelColor: "rgba(25,25,112,0.65)",
      shadow: "0 1px 2px rgba(25,25,112,0.03)",
      state: "neutral",
    };
  }
  const isHigherBetter = t.direction === "higher-is-better";
  const isGood = isHigherBetter ? value >= t.good : value <= t.good;
  const isWarning = isHigherBetter
    ? value >= t.warning
    : value <= t.warning;
  const isBad = t.bad != null
    ? (isHigherBetter ? value < t.bad : value > t.bad)
    : !isWarning;

  if (isGood) return {
    bg: "linear-gradient(180deg, rgba(52,199,89,0.06) 0%, rgba(52,199,89,0.02) 100%)",
    fg: "#0e7c3a",
    border: "rgba(52,199,89,0.22)",
    labelColor: "#0e7c3a",
    shadow: "0 1px 3px rgba(52,199,89,0.06), 0 8px 16px -8px rgba(52,199,89,0.10)",
    state: "good",
  };
  if (isWarning && !isBad) return {
    bg: "linear-gradient(180deg, rgba(255,159,10,0.06) 0%, rgba(255,159,10,0.02) 100%)",
    fg: "#a35509",
    border: "rgba(255,159,10,0.24)",
    labelColor: "#a35509",
    shadow: "0 1px 3px rgba(255,159,10,0.06), 0 8px 16px -8px rgba(255,159,10,0.10)",
    state: "warning",
  };
  return {
    bg: "linear-gradient(180deg, rgba(255,59,48,0.06) 0%, rgba(255,59,48,0.02) 100%)",
    fg: "#b32419",
    border: "rgba(255,59,48,0.26)",
    labelColor: "#b32419",
    shadow: "0 1px 3px rgba(255,59,48,0.06), 0 8px 16px -8px rgba(255,59,48,0.12)",
    state: "bad",
  };
}

/** 값 포맷터 */
function formatKpi(value: number | null | undefined, type: KpiCellConfig["type"]): string {
  if (value == null || !Number.isFinite(value)) return "—";
  switch (type) {
    case "currency": {
      const v = Math.round(value);
      if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
      if (Math.abs(v) >= 10_000) return `${(v / 10_000).toFixed(0)}만`;
      return v.toLocaleString();
    }
    case "percent":
      return `${value.toFixed(1)}%`;
    case "months":
      return `${value.toFixed(1)}`;
    case "days":
      return `${Math.round(value)}일`;
    case "ratio":
      return `${(value * 100).toFixed(1)}%`;
    case "number":
    default:
      return Math.round(value).toLocaleString();
  }
}

export function DailyKpiStrip({ ko, industryCategoryId, values }: Props) {
  const cells = getDailyKpiCells(industryCategoryId);

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
        gap: "10px",
        // 반응형: 좁은 화면은 2-3 columns wrap
        // 모바일 스타일은 CSS variable 또는 media query 필요하나 inline 으로는 한계
        // 일단 데스크탑 5칸, 미디어 쿼리는 globals.css 이용 가능
      }}
      aria-label={ko ? "오늘의 핵심 지표 5개" : "5 daily KPIs"}
    >
      {cells.map((cell) => {
        const v = values[cell.id];
        const numericValue = v?.value;
        const tone = evaluateColor(numericValue, cell.thresholds);
        const trend = v?.trendPct;
        const TrendIcon = trend == null
          ? null
          : trend > 0.5 ? TrendingUp
          : trend < -0.5 ? TrendingDown
          : Minus;
        const hasData = numericValue != null && Number.isFinite(numericValue);
        const isPending = !hasData && !v?.displayOverride;

        return (
          <div
            key={cell.id}
            title={ko ? cell.hintKo : cell.hintEn}
            style={{
              display: "flex", flexDirection: "column", gap: "8px",
              padding: "16px 18px",
              borderRadius: "16px",
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              boxShadow: tone.shadow,
              minWidth: 0,
              cursor: cell.hintKo || cell.hintEn ? "help" : "default",
              transition: "transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease",
              position: "relative" as const,
            }}
            onMouseEnter={(e) => {
              if (!cell.hintKo && !cell.hintEn) return;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = tone.state === "neutral"
                ? "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.16)"
                : `0 1px 3px ${tone.border}, 0 12px 24px -8px ${tone.border}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = tone.shadow;
            }}
          >
            {/* 라벨 + 트렌드 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "6px",
              fontSize: "11px", fontWeight: 700,
              color: tone.labelColor,
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
              minHeight: "14px",
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ko ? cell.labelKo : cell.labelEn}
              </span>
              {TrendIcon && trend != null && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  fontSize: "10.5px", fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "999px",
                  background: trend > 0.5
                    ? "rgba(52,199,89,0.10)"
                    : trend < -0.5
                      ? "rgba(255,59,48,0.10)"
                      : "rgba(25,25,112,0.06)",
                  color: trend > 0.5 ? "#0e7c3a" : trend < -0.5 ? "#b32419" : "rgba(25,25,112,0.55)",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums" as const,
                  letterSpacing: "0",
                  textTransform: "none" as const,
                }}>
                  <TrendIcon size={10} strokeWidth={2.6} />
                  <span>{Math.abs(trend).toFixed(0)}%</span>
                </span>
              )}
            </div>

            {/* 큰 숫자 — 가시성 강화 */}
            <div style={{
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
              fontSize: isPending ? "16px" : "26px",
              fontWeight: 700,
              color: tone.fg,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums" as const,
              fontFamily: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
            }}>
              {isPending ? (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "rgba(25,25,112,0.45)",
                  letterSpacing: "-0.01em",
                }}>
                  <span style={{
                    display: "inline-block",
                    width: 6, height: 6,
                    borderRadius: "50%",
                    background: "rgba(25,25,112,0.30)",
                  }} />
                  {ko ? "준비 중" : "Pending"}
                </span>
              ) : (
                <>
                  <span>{v?.displayOverride ?? formatKpi(numericValue, cell.type)}</span>
                  {/* 단위 (옵션) */}
                  {!v?.displayOverride && numericValue != null && cell.type === "months" && (
                    <span style={{ fontSize: "12px", fontWeight: 600, color: tone.fg, opacity: 0.65 }}>
                      {ko ? "개월" : "mo"}
                    </span>
                  )}
                  {!v?.displayOverride && numericValue != null && cell.type === "currency" && (
                    <span style={{ fontSize: "12px", fontWeight: 600, color: tone.fg, opacity: 0.65 }}>
                      {ko ? "원" : ""}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
