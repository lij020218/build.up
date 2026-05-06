/**
 * startup-metrics.ts — 스타트업 핵심 지표 (Tier 1, 순수 함수)
 *
 * ─── 학술·실무 근거 ──────────────────────────────────────────────────────
 * 1) David Sacks "Burn Multiple" (Craft Ventures, 2020)
 *      Net Burn / Net New ARR. <1x amazing / 1-1.5 great / 1.5-2 good /
 *      2-3 suspect / >3 bad.
 * 2) Y Combinator 좋은 주간 성장률: 5-7% (Paul Graham "Startup = Growth", 2012)
 * 3) Paul Graham "Default Alive vs Default Dead" (2015)
 * 4) Brad Feld "Rule of 40" — Growth% + Profit% ≥ 40% (SaaS 건강 기준)
 * 5) "Magic Number" (Scale Venture Partners) — Net New ARR / S&M Spend.
 *      >1 가속 / 0.75-1 양호 / <0.75 비효율
 * 6) AOV / Repeat Purchase Rate — Shopify 커머스 표준 KPI
 *
 * ─── 설계 원칙 ───────────────────────────────────────────────────────────
 * 본 모듈은 **순수 함수**만 노출. 상태나 외부 I/O 없음.
 * unified-health.ts 가 종합 점수, 본 모듈은 단일 지표 + 신호등.
 */

// ════════════════════════════════════════════════════════════════════════
// 1. 타입
// ════════════════════════════════════════════════════════════════════════

export type StartupMetricHealth = "healthy" | "warning" | "critical";
export type StartupMetricTrend = "up" | "down" | "stable";

export type StartupMetrics = {
  cmgr: number | null;                  // % (compounded monthly growth rate)
  wowGrowth: number | null;             // % (week over week)
  burnMultiple: number | null;          // ratio (lower is better)
  runwayMonths: number | null;          // months
  ruleOf40: number | null;              // % (sum)
  magicNumber: number | null;           // ratio
  defaultAlive: boolean | null;
  aov: number | null;                   // 원 (커머스/오프라인)
  repeatPurchaseRate: number | null;    // % (재구매율)
};

export type MetricCard = {
  key: keyof StartupMetrics;
  name: string;                         // ko 라벨
  value: number | boolean | null;
  formatted: string;                    // 표시용 ("3.2x", "12개월", "흑자")
  health: StartupMetricHealth | "unknown";
  trend: StartupMetricTrend;
  benchmark: string;                    // 예: "YC 기준 5-7%"
  source: string;                       // 출처
};

// ════════════════════════════════════════════════════════════════════════
// 2. 벤치마크 상수 (학술·VC 표준)
// ════════════════════════════════════════════════════════════════════════

/**
 * Burn Multiple 컷오프 — David Sacks (Craft Ventures, 2020)
 *  <1x   amazing
 *  1-1.5 great
 *  1.5-2 good      ← caution 컷
 *  2-3   suspect   ← warning 컷
 *  >3    bad       ← critical
 *
 * lowerIsBetter 임계값. healthy 1.0 이하, warning 2.0 까지, critical >3.
 */
export const BURN_MULTIPLE_BENCHMARK = {
  healthy: 1.0,
  warning: 2.0,
  critical: 3.0,
  source: "David Sacks (Craft Ventures, 2020)",
} as const;

/**
 * 주간 성장률 — Paul Graham, "Startup = Growth" (2012)
 *  5-7% 좋음, 10% 매우 좋음, <1% 위험 신호.
 */
export const WOW_GROWTH_BENCHMARK = {
  healthy: 5,    // %
  warning: 1,
  critical: 0,
  source: "Paul Graham — Startup = Growth (YC, 2012)",
} as const;

/**
 * CMGR — Compounded Monthly Growth Rate.
 *  주간 5% ≈ 월 ~22%. early-stage 기준 healthy 15%+, growth-stage healthy 10%+.
 *  보수적으로 healthy 10%, warning 5%, critical 0%.
 */
export const CMGR_BENCHMARK = {
  healthy: 10,
  warning: 5,
  critical: 0,
  source: "YC growth standard (보수적 적용)",
} as const;

/**
 * Runway — 한국 VC 권장 (ZUZU, 클로브). 18-24개월.
 */
export const RUNWAY_BENCHMARK = {
  healthy: 18,
  warning: 12,
  critical: 6,
  source: "한국 VC 권장 (ZUZU·클로브)",
} as const;

/**
 * Rule of 40 — Brad Feld / Bessemer SaaS index.
 *  Growth% + Profit% ≥ 40 → 건강.
 */
export const RULE_OF_40_BENCHMARK = {
  healthy: 40,
  warning: 20,
  critical: 0,
  source: "Brad Feld / Bessemer SaaS index",
} as const;

/**
 * Magic Number — Scale Venture Partners.
 *  >1.0 efficient / 0.75-1.0 acceptable / <0.75 inefficient.
 */
export const MAGIC_NUMBER_BENCHMARK = {
  healthy: 1.0,
  warning: 0.75,
  critical: 0.5,
  source: "Scale Venture Partners",
} as const;

/**
 * Repeat Purchase Rate — Shopify 평균 28%, 우수 40%+ (이커머스).
 */
export const REPEAT_PURCHASE_BENCHMARK = {
  healthy: 40,
  warning: 20,
  critical: 10,
  source: "Shopify Commerce Benchmark",
} as const;

// ════════════════════════════════════════════════════════════════════════
// 3. 지표 계산 함수 (순수 함수)
// ════════════════════════════════════════════════════════════════════════

/**
 * CMGR — Compounded Monthly Growth Rate (%)
 *  공식: (last/first)^(1/(n-1)) - 1
 *
 *  @param revenues 시간순(오래→최신) 월 매출 배열. 최소 2개.
 *  @returns % (예: 12.5 = 12.5%/월), 데이터 부족·0 이하면 null.
 */
export function calculateCMGR(revenues: number[]): number | null {
  if (!revenues || revenues.length < 2) return null;
  const first = revenues[0];
  const last = revenues[revenues.length - 1];
  if (first <= 0 || last <= 0) return null;
  const n = revenues.length;
  const cmgr = Math.pow(last / first, 1 / (n - 1)) - 1;
  if (!Number.isFinite(cmgr)) return null;
  return cmgr * 100;
}

/**
 * WoW Growth — 주간 성장률 (%)
 */
export function calculateWoWGrowth(thisWeek: number, lastWeek: number): number | null {
  if (lastWeek <= 0) return null;
  const growth = ((thisWeek - lastWeek) / lastWeek) * 100;
  if (!Number.isFinite(growth)) return null;
  return growth;
}

/**
 * Burn Multiple — David Sacks (2020)
 *  Net Burn / Net New ARR. 자본 효율의 단일 지표.
 *
 *  @param netBurn 월 순소진 (>0). 흑자면 0 또는 음수.
 *  @param netNewARR 월 신규 ARR 증분. <=0 이면 정의 불가 → null.
 *  @returns 배수 (예: 3.2). 흑자(netBurn<=0)면 0 반환.
 */
export function calculateBurnMultiple(netBurn: number, netNewARR: number): number | null {
  if (netNewARR <= 0) return null;
  if (netBurn <= 0) return 0; // 흑자 = 자본 효율 만점
  const ratio = netBurn / netNewARR;
  if (!Number.isFinite(ratio)) return null;
  return ratio;
}

/**
 * Runway (개월) — 현금잔고 / 월 순소진.
 *  흑자(monthlyBurn<=0)면 Infinity 대용으로 null. (UI는 "흑자"로 표기)
 */
export function calculateRunwayMonths(cashBalance: number, monthlyBurn: number): number | null {
  if (cashBalance <= 0) return 0;
  if (monthlyBurn <= 0) return null; // 흑자 → 사실상 무한
  const months = cashBalance / monthlyBurn;
  if (!Number.isFinite(months)) return null;
  return months;
}

/** Average Order Value (원) */
export function calculateAOV(totalRevenue: number, orderCount: number): number | null {
  if (orderCount <= 0) return null;
  return totalRevenue / orderCount;
}

/** Repeat Purchase Rate (%) */
export function calculateRepeatPurchaseRate(
  repeatCustomers: number,
  totalCustomers: number
): number | null {
  if (totalCustomers <= 0) return null;
  return (repeatCustomers / totalCustomers) * 100;
}

/**
 * Rule of 40 — Growth% + ProfitMargin% (Brad Feld).
 *  SaaS 건강 단일 지표. ≥ 40 healthy.
 */
export function calculateRuleOf40(revenueGrowthPct: number, profitMarginPct: number): number {
  return revenueGrowthPct + profitMarginPct;
}

/**
 * Magic Number — Scale Venture Partners.
 *  Δ ARR / 직전기 S&M 지출. >1 healthy.
 */
export function calculateMagicNumber(deltaARR: number, salesMarketingSpend: number): number | null {
  if (salesMarketingSpend <= 0) return null;
  const m = deltaARR / salesMarketingSpend;
  if (!Number.isFinite(m)) return null;
  return m;
}

/**
 * Default Alive (Paul Graham, 2015)
 *  현 비용 그대로, 현 성장률 그대로 가면 잔고 0 전에 흑자 도달?
 *
 *  unified-health.ts 의 calculateDefaultAlive 와 동일 로직(36개월 시뮬).
 *  여기서는 Tier 1 카드용 간단 boolean 반환.
 *
 *  @param monthlyRevenue 이번 달 매출
 *  @param monthlyExpenses 이번 달 총비용
 *  @param revenueGrowthRate 월 성장률 (0.07 = 7%)
 *  @param cashBalance 현금잔고
 */
export function isDefaultAlive(
  monthlyRevenue: number,
  monthlyExpenses: number,
  revenueGrowthRate: number,
  cashBalance: number
): boolean | null {
  if (monthlyExpenses <= 0) return null;
  if (monthlyRevenue >= monthlyExpenses) return true; // 이미 흑자
  if (cashBalance <= 0) return false;

  let rev = monthlyRevenue;
  let cash = cashBalance;
  for (let m = 0; m < 36; m++) {
    cash += rev - monthlyExpenses;
    if (rev >= monthlyExpenses) return true;
    if (cash <= 0) return false;
    rev *= 1 + revenueGrowthRate;
  }
  return false; // 36개월 내 도달 못 함
}

// ════════════════════════════════════════════════════════════════════════
// 4. 신호등 — getMetricHealth
// ════════════════════════════════════════════════════════════════════════

type Bench = { healthy: number; warning: number; critical: number };

const BENCHMARKS: Record<string, { bench: Bench; lowerIsBetter: boolean }> = {
  cmgr:               { bench: CMGR_BENCHMARK,            lowerIsBetter: false },
  wowGrowth:          { bench: WOW_GROWTH_BENCHMARK,      lowerIsBetter: false },
  burnMultiple:       { bench: BURN_MULTIPLE_BENCHMARK,   lowerIsBetter: true  },
  runwayMonths:       { bench: RUNWAY_BENCHMARK,          lowerIsBetter: false },
  ruleOf40:           { bench: RULE_OF_40_BENCHMARK,      lowerIsBetter: false },
  magicNumber:        { bench: MAGIC_NUMBER_BENCHMARK,    lowerIsBetter: false },
  repeatPurchaseRate: { bench: REPEAT_PURCHASE_BENCHMARK, lowerIsBetter: false },
};

/**
 * 단일 지표 + 값 → 신호등.
 * 미정의 지표명이거나 값이 NaN/null 이면 critical 폴백 대신 warning 처리.
 *
 *  @param metricName 지표 키 (cmgr, burnMultiple, …)
 *  @param value 측정값
 */
export function getMetricHealth(
  metricName: string,
  value: number | null | undefined
): StartupMetricHealth {
  if (value == null || !Number.isFinite(value)) return "warning";
  const def = BENCHMARKS[metricName];
  if (!def) return "warning";
  const { bench, lowerIsBetter } = def;
  if (lowerIsBetter) {
    if (value <= bench.healthy) return "healthy";
    if (value <= bench.warning) return "warning";
    return "critical";
  }
  if (value >= bench.healthy) return "healthy";
  if (value >= bench.warning) return "warning";
  return "critical";
}

/**
 * Default Alive 전용 신호등 (boolean → 신호등).
 */
export function getDefaultAliveHealth(alive: boolean | null): StartupMetricHealth {
  if (alive == null) return "warning";
  return alive ? "healthy" : "critical";
}

// ════════════════════════════════════════════════════════════════════════
// 5. 추세(trend) — 직전값 대비
// ════════════════════════════════════════════════════════════════════════

/**
 * 추세 판정. epsilon 안쪽이면 stable.
 *  lowerIsBetter 이면 감소가 up(=호전)으로 표시되도록 호출부에서 부호를 반전해도 되지만,
 *  여기서는 "값" 자체의 방향만 반환. 컴포넌트에서 직접 해석.
 */
export function getMetricTrend(
  current: number | null,
  previous: number | null,
  epsilonPct = 1
): StartupMetricTrend {
  if (current == null || previous == null) return "stable";
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return "stable";
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(delta) < epsilonPct) return "stable";
  return delta > 0 ? "up" : "down";
}
