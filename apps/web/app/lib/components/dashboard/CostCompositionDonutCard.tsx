"use client";

import { useMemo } from "react";
import {
  COST_RATIOS,
  HEALTH_COLORS,
  HEALTH_LABEL_KO as SHARED_LABEL_KO,
  HEALTH_LABEL_EN as SHARED_LABEL_EN,
  gradeKpi,
  getCostThreshold,
  mapIndustryToGroup,
  type HealthGrade,
} from "@build-up/shared";

/**
 * CostCompositionDonutCard — 비용 구조 도넛
 *
 * 매출 그래프 짝궁. P&L 의 두 축 (매출↔비용) 시각화.
 *  - 8개 비용 카테고리를 도넛으로 분해 (작은 항목은 "기타" 묶음)
 *  - 중앙: 마진율 % (음수면 빨강)
 *  - 슬라이스마다 SSOT(unified-health) 통합 4단계 신호
 *  - 하단: 가장 위험한 항목에 대한 한 줄 액션 (AI 코칭 트리거)
 *
 * 모든 업종 100% 적용 (모든 사장님이 매월 비용 입력 필수).
 *
 * 점수·색상·임계값은 모두 `@build-up/shared`의 unified-health.ts 에서 가져옴.
 */

type Props = {
  ko: boolean;
  /** 이번 달 매출 (원) */
  totalSales: number;
  /** 이번 달 비용 분해 (원) */
  monthlyCosts: {
    ingredients: number;
    labor: number;
    rent: number;
    utilities: number;
    sga: number;
    marketing: number;
    other: number;
    interest: number;
  };
  /** 사장님 업종 (벤치마크 매칭용) */
  industryCategoryId: string | undefined;
  fmt: (won: number) => string;
  /**
   * 업종별 비용 라벨 (business-context.ts 의 expenseFields).
   * 미전달 시 음식점 디폴트(재료비/인건비/임대료/공과금) 라벨로 fallback.
   * 스타트업이면 ingredients = "서버·클라우드·SaaS", sga = "외주비·법률비" 등으로 자동 분기.
   */
  expenseFields?: Array<{ fieldKey: string; label: { ko: string; en: string } }>;
};

type CategoryKey = "ingredients" | "labor" | "rent" | "utilities" | "sga" | "marketing" | "other" | "interest";

// 표시용: SSOT 의 4단계 등급에서 unknown 만 분리하여 슬라이스 단위 신호로 사용
type Health = HealthGrade; // "healthy" | "caution" | "warning" | "critical" | "unknown"

const CATEGORY_LABELS: Record<CategoryKey, { ko: string; en: string }> = {
  ingredients: { ko: "재료비", en: "Materials" },
  labor: { ko: "인건비", en: "Labor" },
  rent: { ko: "임대료", en: "Rent" },
  utilities: { ko: "공과금", en: "Utilities" },
  sga: { ko: "판관비", en: "SG&A" },
  marketing: { ko: "마케팅비", en: "Marketing" },
  other: { ko: "기타", en: "Other" },
  interest: { ko: "이자", en: "Interest" },
};

// 미드나이트 → 사이안 → 골드 → 코랄 그라데이션 (각 슬라이스마다 [from, to] 페어)
const SLICE_GRADIENTS: Array<[string, string]> = [
  ["#0a1929", "#2c4a7a"], // 1: deep midnight → midnight
  ["#191970", "#3b5c8c"], // 2: midnight → steel blue
  ["#3b5c8c", "#5f8bb8"], // 3: steel → light steel
  ["#5f8bb8", "#8db5d3"], // 4: light steel → sky
  ["#0d9488", "#22d3a3"], // 5: teal → mint
  ["#d4a017", "#fbbf24"], // 6: gold → amber
  ["#9ca3af", "#cbd5e1"], // 7: gray (기타)
  ["#dc2626", "#f87171"], // 8: red → coral (이자/위험)
];

// SSOT 색상 — 같은 등급은 모든 카드에서 같은 색
const HEALTH_COLOR: Record<Health, string> = {
  healthy: HEALTH_COLORS.healthy.dot,    // #22c55e
  caution: HEALTH_COLORS.caution.dot,    // #f59e0b
  warning: HEALTH_COLORS.warning.dot,    // #ea580c
  critical: HEALTH_COLORS.critical.dot,  // #ef4444
  unknown: HEALTH_COLORS.unknown.dot,
};
const HEALTH_LABEL_KO: Record<Health, string> = {
  healthy: SHARED_LABEL_KO.healthy,    // "건강"
  caution: SHARED_LABEL_KO.caution,    // "주의"
  warning: SHARED_LABEL_KO.warning,    // "위험"
  critical: SHARED_LABEL_KO.critical,  // "긴급"
  unknown: "—",
};
const HEALTH_LABEL_EN: Record<Health, string> = {
  healthy: SHARED_LABEL_EN.healthy,
  caution: SHARED_LABEL_EN.caution,
  warning: SHARED_LABEL_EN.warning,
  critical: SHARED_LABEL_EN.critical,
  unknown: "—",
};

export function CostCompositionDonutCard({ ko, totalSales, monthlyCosts, industryCategoryId, fmt, expenseFields }: Props) {
  // 업종별 라벨 lookup (있으면 사용, 없으면 디폴트 CATEGORY_LABELS 로 fallback)
  const labelOf = (key: CategoryKey): { ko: string; en: string } => {
    const dynamic = expenseFields?.find((f) => f.fieldKey === key)?.label;
    return dynamic ?? CATEGORY_LABELS[key];
  };
  // ── 1. 데이터 가공 (8개 → 6개로 압축, "기타+이자" 묶기) ──
  const slices = useMemo(() => {
    const totalCosts =
      monthlyCosts.ingredients + monthlyCosts.labor + monthlyCosts.rent +
      monthlyCosts.utilities + monthlyCosts.sga + monthlyCosts.marketing +
      monthlyCosts.other + monthlyCosts.interest;

    if (totalCosts === 0) return [];

    // 매출 대비 비교가 의미 있는지 (매출이 비용의 30%↑일 때만)
    const meaningfulRevenue = totalSales > 0 && totalSales >= totalCosts * 0.3;

    // 모든 카테고리 → 0 초과만, 정렬, 작은 것은 "기타"로 묶기 (도넛 가독성)
    const all: Array<{ key: CategoryKey; amount: number; pct: number; ratioOfSales: number; health: Health }> =
      (Object.keys(CATEGORY_LABELS) as CategoryKey[])
        .map((k) => {
          const amount = monthlyCosts[k];
          const pct = (amount / totalCosts) * 100;
          const ratioOfSales = totalSales > 0 ? (amount / totalSales) * 100 : 0;
          const health: Health = meaningfulRevenue
            ? resolveHealth(k, ratioOfSales, industryCategoryId)
            : "unknown";
          return { key: k, amount, pct, ratioOfSales, health };
        })
        .filter((s) => s.amount > 0)
        .sort((a, b) => b.amount - a.amount);

    return all;
  }, [monthlyCosts, totalSales, industryCategoryId]);

  const totalCosts = useMemo(
    () => slices.reduce((s, x) => s + x.amount, 0),
    [slices]
  );

  // 마진율 (매출 대비 이익)
  const marginPct = totalSales > 0 ? ((totalSales - totalCosts) / totalSales) * 100 : 0;
  const isProfit = totalSales > totalCosts;
  // 매출이 비용 대비 너무 적으면 "매출 대비 %" 가 의미 없음 (예: 매출 10만 vs 비용 340만 = -3300%)
  // 매출이 비용의 30% 미만이면 마진/벤치마크 비교 비활성 → "매출 대비" 대신 "비용 비중만" 표시
  const insufficientRevenue = totalSales > 0 && totalSales < totalCosts * 0.3;
  const noRevenue = totalSales === 0;

  // 가장 위험한 슬라이스 (액션 메시지용) — 매출 충분할 때만 의미 있음
  // 우선순위: critical > warning > caution
  const topRisk = (insufficientRevenue || noRevenue) ? null
    : (slices.find((s) => s.health === "critical")
       ?? slices.find((s) => s.health === "warning")
       ?? slices.find((s) => s.health === "caution"));

  // 데이터 없음
  if (slices.length === 0) {
    return (
      <article className="ccd-card">
        <header className="ccd-header">
          <div className="ccd-eyebrow">{ko ? "비용 구조" : "Cost Composition"}</div>
          <div className="ccd-title">{ko ? "이번 달 비용 분해" : "Monthly cost breakdown"}</div>
        </header>
        <div className="ccd-empty">
          {ko ? "비용 데이터가 없습니다. 손익 카드에서 비용을 입력해 주세요." : "No cost data. Add costs in the P&L card."}
        </div>
        <style>{KEYFRAMES}</style>
      </article>
    );
  }

  // ── 2. 도넛 SVG (그라디언트 + glow + 클린 separator) ──
  const size = 196;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * radius;
  // 슬라이스 사이 미세한 흰색 갭 (1.5px) — futuristic crisp separation
  const sepDeg = 1.5;
  const sepArc = (sepDeg / 360) * circ;

  let cumulative = 0;
  const arcs = slices.map((s, i) => {
    const offset = -cumulative;
    cumulative += (s.pct / 100) * circ;
    // separator gap 빼기 (양쪽으로 sepArc/2 만큼)
    const dash = Math.max(0, (s.pct / 100) * circ - sepArc);
    return {
      slice: s,
      gradient: SLICE_GRADIENTS[i % SLICE_GRADIENTS.length],
      gradientId: `ccd-grad-${i}`,
      dash,
      gap: circ - dash,
      offset,
    };
  });

  return (
    <article className="ccd-card">
      <style>{KEYFRAMES}</style>

      <header className="ccd-header">
        <div>
          <div className="ccd-eyebrow">{ko ? "비용 구조" : "Cost Composition"}</div>
          <div className="ccd-title">{ko ? "이번 달 비용 분해" : "Monthly cost breakdown"}</div>
        </div>
        <div className="ccd-total-pill">
          {ko ? "총 비용" : "Total"} {fmt(totalCosts)}
        </div>
      </header>

      <div className="ccd-body">
        {/* ─── Donut SVG (그라디언트 + glow + crisp separator) ─── */}
        <div className="ccd-donut-wrap">
          {/* 뒤 ambient glow — 미래적 느낌 */}
          <div className="ccd-ambient-glow" aria-hidden />

          <svg
            width={size} height={size} viewBox={`0 0 ${size} ${size}`}
            className="ccd-donut"
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* 각 슬라이스 그라디언트 (from → to) */}
              {arcs.map((a) => (
                <linearGradient key={a.gradientId} id={a.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={a.gradient[0]} />
                  <stop offset="100%" stopColor={a.gradient[1]} />
                </linearGradient>
              ))}
              {/* 소프트 glow 필터 */}
              <filter id="ccd-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* 내부 그림자 마스크 — 깊이감 */}
              <radialGradient id="ccd-inner-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="transparent" />
                <stop offset="100%" stopColor="rgba(15,23,42,0.1)" />
              </radialGradient>
            </defs>

            {/* 배경 트랙 (연한 그라디언트) */}
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke="rgba(25,25,112,0.04)"
              strokeWidth={stroke}
            />

            {/* 슬라이스들 — 그라디언트 + glow */}
            <g transform={`rotate(-90 ${cx} ${cy})`} filter="url(#ccd-glow)">
              {arcs.map((a, i) => (
                <circle
                  key={a.slice.key}
                  cx={cx} cy={cy} r={radius}
                  fill="none"
                  stroke={`url(#${a.gradientId})`}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${a.dash} ${a.gap}`}
                  strokeDashoffset={a.offset}
                  style={{
                    animation: `ccdSliceIn .9s cubic-bezier(0.16, 1, 0.3, 1) ${0.08 * i}s both`,
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                />
              ))}
            </g>

            {/* 중앙 내부 원 — 깊이감 */}
            <circle
              cx={cx} cy={cy} r={radius - stroke / 2 - 1}
              fill="url(#ccd-inner-shadow)"
              pointerEvents="none"
            />
          </svg>

          {/* 중앙 텍스트 — SVG 밖에 별도 레이어 (타이포 선명도) */}
          <div className="ccd-center">
            {noRevenue ? (
              <>
                <div className="ccd-center-label">{ko ? "총 비용" : "Total Cost"}</div>
                <div className="ccd-center-value-sm">{fmt(totalCosts)}</div>
                <div className="ccd-center-sub">{ko ? "매출 미입력" : "no revenue"}</div>
              </>
            ) : insufficientRevenue ? (
              <>
                <div className="ccd-center-label">{ko ? "월 비용" : "Monthly Cost"}</div>
                <div className="ccd-center-value-sm">{fmt(totalCosts)}</div>
                <div className="ccd-center-sub-warn">{ko ? "매출 데이터 부족" : "low revenue"}</div>
              </>
            ) : (
              <>
                <div className="ccd-center-label">{ko ? "마진율" : "Margin"}</div>
                <div className={`ccd-center-value ${isProfit ? "" : "ccd-loss"}`}>
                  {marginPct >= 0 ? "" : "-"}{Math.abs(marginPct).toFixed(1)}%
                </div>
                <div className="ccd-center-sub">
                  {ko ? "매출 대비" : "of revenue"}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Footer: 상황별 안내 ─── */}
      {(noRevenue || insufficientRevenue) ? (
        <footer className="ccd-footer ccd-footer-info">
          <span className="ccd-footer-icon">ⓘ</span>
          <span className="ccd-footer-text">
            {ko
              ? noRevenue
                ? "이번 달 매출을 기록하면 업종 평균 대비 비용 구조를 진단해 드려요"
                : "매출이 비용 대비 적어 정확한 진단이 어렵습니다 — 매출을 더 기록해 주세요"
              : noRevenue ? "Log this month's sales to enable benchmark diagnosis" : "Revenue too low for accurate diagnosis"}
          </span>
        </footer>
      ) : topRisk ? (
        <footer className={`ccd-footer ${
          topRisk.health === "critical" ? "ccd-footer-danger"
          : topRisk.health === "warning" ? "ccd-footer-danger"
          : "ccd-footer-caution"
        }`}>
          <span className="ccd-footer-icon">{
            (topRisk.health === "critical" || topRisk.health === "warning") ? "⚠" : "ⓘ"
          }</span>
          <span className="ccd-footer-text">
            {ko
              ? `${labelOf(topRisk.key).ko}가 매출의 ${topRisk.ratioOfSales.toFixed(1)}% — 업종 평균 ${formatBenchmarkRange(topRisk.key, industryCategoryId, ko)} 기준 ${HEALTH_LABEL_KO[topRisk.health]} 구간`
              : `${labelOf(topRisk.key).en} is ${topRisk.ratioOfSales.toFixed(1)}% of revenue — ${HEALTH_LABEL_KO[topRisk.health]} vs industry benchmark`}
          </span>
        </footer>
      ) : (
        <footer className="ccd-footer ccd-footer-good">
          <span className="ccd-footer-icon">✓</span>
          <span className="ccd-footer-text">
            {ko ? "모든 비용 항목이 업종 평균 정상 범위입니다" : "All cost categories within healthy range"}
          </span>
        </footer>
      )}

      {/* 비용 항목 수정 → 내 가게로 이동 */}
      <button
        type="button"
        className="ccd-edit-link"
        onClick={() => {
          if (typeof window === "undefined") return;
          window.dispatchEvent(new CustomEvent("bup:navigate-feature", {
            detail: { surface: "analytics", selector: "[data-cost-management]" },
          }));
        }}
      >
        {ko ? "비용 항목 수정 →" : "Edit cost items →"}
      </button>

      {/* ─── Legend — 푸터 메시지 아래 (카드 하단 빈 공간 활용) ─── */}
      <ul className="ccd-legend">
        {arcs.map((a) => (
          <li key={a.slice.key} className="ccd-legend-row">
            <span
              className="ccd-legend-dot"
              style={{ background: `linear-gradient(135deg, ${a.gradient[0]} 0%, ${a.gradient[1]} 100%)` }}
            />
            <span className="ccd-legend-label">{labelOf(a.slice.key)[ko ? "ko" : "en"]}</span>
            <span className="ccd-legend-pct">{Math.round(a.slice.pct)}%</span>
            <span
              className="ccd-legend-health"
              style={{
                background: HEALTH_COLOR[a.slice.health],
                boxShadow: a.slice.health !== "unknown" ? `0 0 6px ${HEALTH_COLOR[a.slice.health]}88` : undefined,
              }}
              title={`${HEALTH_LABEL_KO[a.slice.health]} · 매출 대비 ${a.slice.ratioOfSales.toFixed(1)}%`}
            />
          </li>
        ))}
      </ul>
    </article>
  );
}

// ─── Benchmark resolution (SSOT 기반) ─────────────────────────────────
// 모든 임계값은 unified-health.ts/COST_RATIO_THRESHOLDS 에서 가져옴.
// → 같은 65% 프라임코스트가 도넛카드/PL카드/AI프롬프트 모두에서 동일하게 판정됨.

/** ratioOfSales (%) 와 업종을 받아 SSOT 4단계 등급으로 판정 */
function resolveHealth(
  key: CategoryKey,
  ratioOfSales: number,
  industryCategoryId: string | undefined,
): Health {
  if (ratioOfSales === 0) return "unknown";
  const industry = mapIndustryToGroup(industryCategoryId);
  // SSOT 임계값 우선
  const ssotKey = (
    key === "ingredients" || key === "labor" || key === "rent" || key === "marketing"
  ) ? key : null;
  if (ssotKey) {
    const t = getCostThreshold(ssotKey, industry);
    if (t) return gradeKpi(ratioOfSales, t);
  }
  // utilities/sga/other/interest 는 SSOT 에 미정의 → 일반 룰 (4단계 동등 적용)
  const range = getGenericRange(key);
  if (!range) return "unknown";
  const [healthy, caution, warning] = range;
  if (ratioOfSales <= healthy) return "healthy";
  if (ratioOfSales <= caution) return "caution";
  if (ratioOfSales <= warning) return "warning";
  return "critical";
}

/** SSOT 외 카테고리 (utilities/sga/other/interest) 용 일반 임계값 — 업종 무관 */
function getGenericRange(key: CategoryKey): readonly [number, number, number] | null {
  if (key === "utilities") return [3, 6, 10] as const;
  if (key === "sga") return [5, 10, 15] as const;
  if (key === "interest") return [2, 5, 8] as const;
  if (key === "other") return [3, 7, 12] as const;
  return null;
}

function formatBenchmarkRange(
  key: CategoryKey,
  industryCategoryId: string | undefined,
  ko: boolean,
): string {
  const industry = mapIndustryToGroup(industryCategoryId);
  const ssotKey = (
    key === "ingredients" || key === "labor" || key === "rent" || key === "marketing"
  ) ? key : null;
  if (ssotKey) {
    const t = getCostThreshold(ssotKey, industry);
    if (t) return `${t.healthy}~${t.caution}%`;
  }
  const range = getGenericRange(key);
  if (!range) return ko ? "기준 없음" : "no benchmark";
  return `${range[0]}~${range[1]}%`;
}

// COST_RATIOS 는 다른 곳에서 여전히 참조 가능 — silently keep import live.
void COST_RATIOS;

// ─── CSS (Futuristic 미드나이트 + Glassmorphism + Glow) ─────────────────────
const KEYFRAMES = `
@keyframes ccdSliceIn {
  from { stroke-dasharray: 0 9999; opacity: 0; filter: blur(2px); }
  to { opacity: 1; filter: blur(0); }
}
@keyframes ccdFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ccdAmbientPulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(1.06); }
}

.ccd-card {
  position: relative;
  border-radius: 20px;
  padding: 18px 20px 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%);
  border: 1px solid rgba(25,25,112,0.10);
  box-shadow:
    0 1px 3px rgba(25,25,112,0.04),
    0 12px 24px -12px rgba(25,25,112,0.10);
  display: flex; flex-direction: column; gap: 12px;
  font-family: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
  letter-spacing: -0.01em;
  overflow: hidden;
}
/* 카드 우상단 미세 액센트 — 미래적 디테일 */
.ccd-card::before {
  content: "";
  position: absolute;
  top: 0; right: 0;
  width: 180px; height: 180px;
  background: radial-gradient(circle at top right, rgba(25,25,112, 0.06) 0%, transparent 60%);
  pointer-events: none;
}

.ccd-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px;
  position: relative; z-index: 1;
}
.ccd-eyebrow {
  font-size: 10px; font-weight: 700; color: #191970;
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 3px;
  opacity: 0.85;
}
.ccd-title {
  font-size: 16px; font-weight: 700; color: #0f172a;
  letter-spacing: -0.025em; line-height: 1.2;
}
.ccd-total-pill {
  flex-shrink: 0;
  font-size: 11px; font-weight: 700;
  padding: 5px 11px; border-radius: 999px;
  background: linear-gradient(135deg, rgba(25,25,112, 0.1) 0%, rgba(44, 74, 122, 0.06) 100%);
  color: #191970;
  border: 0.5px solid rgba(25,25,112, 0.2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

/* 도넛 그래프는 중앙 정렬, 라벨(legend)은 도넛 아래 가로 배치 */
.ccd-body {
  display: flex; flex-direction: column; align-items: center;
  gap: 18px;
  padding: 4px 0 0;
  position: relative; z-index: 1;
}

.ccd-donut-wrap {
  flex-shrink: 0;
  position: relative;
  display: flex; align-items: center; justify-content: center;
  width: 196px; height: 196px;
  margin: 0 auto;
}
/* 뒤 ambient glow — 미래적 깊이감 */
.ccd-ambient-glow {
  position: absolute; inset: -10%;
  background:
    radial-gradient(circle at 30% 30%, rgba(25,25,112, 0.14) 0%, transparent 55%),
    radial-gradient(circle at 70% 70%, rgba(13, 148, 136, 0.08) 0%, transparent 55%);
  filter: blur(20px);
  animation: ccdAmbientPulse 6s ease-in-out infinite;
  pointer-events: none;
  border-radius: 50%;
}
.ccd-donut {
  display: block; position: relative; z-index: 1;
  filter: drop-shadow(0 4px 14px rgba(25,25,112, 0.18));
}

.ccd-center {
  position: absolute;
  inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center;
  pointer-events: none;
  z-index: 2;
}
.ccd-center-label {
  font-size: 9.5px; font-weight: 700; color: rgba(15,23,42,0.5);
  letter-spacing: 0.1em; text-transform: uppercase;
}
.ccd-center-value {
  font-size: 28px; font-weight: 800; color: #0f172a;
  letter-spacing: -0.04em; line-height: 1; margin-top: 3px;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(180deg, #0f172a 0%, #191970 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ccd-loss {
  background: linear-gradient(180deg, #b91c1c 0%, #ef4444 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
/* 매출 부족 시 중앙 — 마진율 대신 총 비용 표시 (작은 글자) */
.ccd-center-value-sm {
  font-size: 19px; font-weight: 800; color: #191970;
  letter-spacing: -0.03em; line-height: 1; margin-top: 3px;
  font-variant-numeric: tabular-nums;
}
.ccd-center-sub {
  font-size: 9.5px; color: rgba(15,23,42,0.45); margin-top: 4px;
  font-weight: 500;
}
.ccd-center-sub-warn {
  font-size: 9.5px; color: rgba(180, 83, 9, 0.85); margin-top: 4px;
  font-weight: 600;
}

/* Legend — 푸터 메시지 아래 (카드 하단 빈 공간 활용), 세로 stack */
.ccd-legend {
  width: 100%;
  list-style: none; padding: 14px 4px 4px; margin: 0;
  display: flex; flex-direction: column;
  gap: 8px;
  position: relative; z-index: 1;
}
.ccd-legend-row {
  display: flex; align-items: center; gap: 10px;
  font-size: 12.5px; font-weight: 600; color: #0f172a;
  animation: ccdFadeIn .4s cubic-bezier(0.16,1,0.3,1) both;
  padding: 2px 0;
}
.ccd-legend-dot {
  width: 10px; height: 10px; border-radius: 3px;
  flex-shrink: 0;
  box-shadow:
    0 1px 3px rgba(10,25,41,0.18),
    inset 0 0.5px 0 rgba(255,255,255,0.3);
}
.ccd-legend-label {
  flex: 1; min-width: 0;
  letter-spacing: -0.005em;
}
.ccd-legend-pct {
  font-variant-numeric: tabular-nums;
  color: rgba(15,23,42,0.7); font-weight: 700;
  letter-spacing: -0.01em;
  margin-right: 4px;
}
.ccd-legend-health {
  width: 7px; height: 7px; border-radius: 50%;
  flex-shrink: 0;
}

.ccd-footer {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 13px; border-radius: 11px;
  font-size: 11.5px; font-weight: 600; line-height: 1.45;
  letter-spacing: -0.005em;
  position: relative; z-index: 1;
}
.ccd-footer-good {
  background: linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.03) 100%);
  border: 0.5px solid rgba(34,197,94,0.22);
  color: #15803d;
}
.ccd-footer-caution {
  background: linear-gradient(135deg, rgba(255,159,10,0.08) 0%, rgba(255,159,10,0.04) 100%);
  border: 0.5px solid rgba(255,159,10,0.25);
  color: #b45309;
}
.ccd-footer-danger {
  background: linear-gradient(135deg, rgba(255,59,48,0.07) 0%, rgba(255,59,48,0.03) 100%);
  border: 0.5px solid rgba(255,59,48,0.25);
  color: #b91c1c;
}
.ccd-footer-info {
  background: linear-gradient(135deg, rgba(25,25,112,0.05) 0%, rgba(25,25,112,0.02) 100%);
  border: 0.5px solid rgba(25,25,112,0.16);
  color: #191970;
}
.ccd-footer-icon { flex-shrink: 0; font-size: 13px; }
.ccd-footer-text { flex: 1; }

.ccd-empty {
  padding: 36px 20px; text-align: center;
  font-size: 12.5px; color: rgba(15,23,42,0.5);
  background: rgba(15,23,42,0.025);
  border-radius: 12px;
}

/* 비용 항목 수정 링크 — 카드 하단, 작은 텍스트 버튼 */
.ccd-edit-link {
  align-self: flex-end;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
  color: #191970;
  background: transparent;
  border: none;
  padding: 4px 0;
  cursor: pointer;
  letter-spacing: -0.01em;
  opacity: 0.75;
  transition: opacity 0.15s ease;
  position: relative; z-index: 1;
}
.ccd-edit-link:hover { opacity: 1; }
`;
