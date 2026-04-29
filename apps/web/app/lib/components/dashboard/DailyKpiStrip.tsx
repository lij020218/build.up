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
} from "@build-up/shared";

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

/** 임계값 비교 → 색상 결정 */
function evaluateColor(value: number | null | undefined, t: KpiThresholds | undefined): {
  bg: string; fg: string; border: string;
} {
  // 데이터 없거나 임계값 없으면 neutral
  if (value == null || !t) {
    return {
      bg: "rgba(15,23,42,0.03)",
      fg: "rgba(15,23,42,0.55)",
      border: "rgba(15,23,42,0.08)",
    };
  }
  const isHigherBetter = t.direction === "higher-is-better";
  const isGood = isHigherBetter ? value >= t.good : value <= t.good;
  const isWarning = isHigherBetter
    ? value >= t.warning
    : value <= t.warning;
  // bad 명시되면 그 너머는 빨강, 안 되면 warning 못 미치면 빨강
  const isBad = t.bad != null
    ? (isHigherBetter ? value < t.bad : value > t.bad)
    : !isWarning;

  if (isGood) return {
    bg: "linear-gradient(135deg, rgba(5,150,105,0.08) 0%, rgba(5,150,105,0.03) 100%)",
    fg: "#047857", border: "rgba(5,150,105,0.22)",
  };
  if (isWarning && !isBad) return {
    bg: "linear-gradient(135deg, rgba(217,119,6,0.08) 0%, rgba(217,119,6,0.03) 100%)",
    fg: "#b45309", border: "rgba(217,119,6,0.22)",
  };
  return {
    bg: "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.03) 100%)",
    fg: "#b91c1c", border: "rgba(220,38,38,0.25)",
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
        const colors = evaluateColor(numericValue, cell.thresholds);
        const trend = v?.trendPct;
        const TrendIcon = trend == null
          ? null
          : trend > 0.5 ? TrendingUp
          : trend < -0.5 ? TrendingDown
          : Minus;

        return (
          <div
            key={cell.id}
            title={ko ? cell.hintKo : cell.hintEn}
            style={{
              display: "flex", flexDirection: "column", gap: "4px",
              padding: "12px 14px",
              borderRadius: "14px",
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              minWidth: 0,
              cursor: cell.hintKo || cell.hintEn ? "help" : "default",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!cell.hintKo && !cell.hintEn) return;
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.border}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* 라벨 + 트렌드 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "4px",
              fontSize: "10.5px", fontWeight: 700,
              color: "rgba(15,23,42,0.5)",
              letterSpacing: "0.02em",
              textTransform: "uppercase" as const,
              minHeight: "14px",
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ko ? cell.labelKo : cell.labelEn}
              </span>
              {TrendIcon && trend != null && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "2px",
                  fontSize: "10px", fontWeight: 700,
                  color: trend > 0.5 ? "#059669" : trend < -0.5 ? "#dc2626" : "rgba(15,23,42,0.4)",
                  flexShrink: 0,
                }}>
                  <TrendIcon size={10} strokeWidth={2.4} />
                  <span>{Math.abs(trend).toFixed(0)}%</span>
                </span>
              )}
            </div>

            {/* 큰 숫자 */}
            <div style={{
              fontSize: "20px", fontWeight: 700,
              color: colors.fg,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              fontFamily: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
            }}>
              {v?.displayOverride ?? formatKpi(numericValue, cell.type)}
              {/* 단위 (옵션) */}
              {!v?.displayOverride && numericValue != null && cell.type === "months" && (
                <span style={{ fontSize: "11px", fontWeight: 600, color: colors.fg, opacity: 0.7, marginLeft: "3px" }}>
                  {ko ? "개월" : "mo"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
