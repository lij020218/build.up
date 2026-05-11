/**
 * Prime Cost — 외식 1순위 KPI. 실제 업계 베스트 프랙티스에 맞춘 SSOT.
 *
 *  ── 출처 (2026-05-11 웹 조사) ───────────────────────────────────────
 *   · Toast POS, Restaurant365, TouchBistro, 7shifts (US): 표준 공식·벤치마크
 *   · KB금융 (KR): 인건비 = 월급 + 4대보험 + 퇴직금 + 복리후생 (출처: kbthink.com/ceo-content-guide-241010)
 *   · 한국외식산업통계연감 2020: 식재료비 평균 40.4% (실제 한국 외식 평균)
 *   · 캐시노트·KB: 식자재 원가 35% 이하 권장 / 프라임 60% 이하
 *   · RestaurantOwner.com: 주간 추적 시 prime cost 절감 효과 +2~5%p
 *  ────────────────────────────────────────────────────────────────────
 *
 *  ── 핵심 결정 (Korean 외식 현실 맞춤) ─────────────────────────────
 *  1. **추적 주기 = 주간 (week) 디폴트** — Toast/R365 가 일관되게 "good operators
 *     know their prime weekly, not monthly" 라고 명시. 월간은 보조 view.
 *  2. **인건비 burden 자동 가산** — 사장님 입력값은 보통 *기본급* 만. 사용자
 *     hasEmployees=true 면 4대보험(사업주 부담) + 퇴직 적립 ≈ +18.5% 보정.
 *     KB금융 "사업주 부담 = 급여의 약 10% 추가" + 퇴직금 8.33% 적립.
 *  3. **COGS 근거 투명화** — 사장님이 입력한 `ingredients` 는 *매입액* (purchases).
 *     진정한 COGS = 시작재고 + 매입 - 끝재고. 재고 추적 안 하는 경우 매입액으로 근사하고
 *     UI 에 "매입 기반 추정" 명시.
 *  4. **업종별 벤치마크** — 한국 시장 출처 반영 (food/cafe-dessert 등).
 *  5. **신뢰도 게이트** — cost-ratios.ts SSOT 와 동일 (days < 7 또는 매출 표본
 *     부족 시 ready=false).
 *  ────────────────────────────────────────────────────────────────────
 */

import { monthlyEquivalentRevenue, OPERATING_DAYS_PER_MONTH } from "./cost-ratios";

/**
 * 인건비 사업주 부담 가산율 — 기본급 → 진짜 사업주 비용.
 *
 *   ── 2026 한국 기준 ─────────────────────────────────────
 *   4대보험 사업주 부담 (employer share):
 *    · 국민연금 4.75% · 건강보험 3.595% · 장기요양 ≈ 0.4724% (건강 × 0.1314)
 *    · 고용보험 0.9% · 산재 0.7% (일반 서비스업) ───── 합 ≈ 10.4%
 *   퇴직금 적립 (1년 이상 근속자) ─────────────────────── 8.33% (1/12)
 *   주휴수당 (주 15시간 이상) — 보통 기본급에 포함되므로 별도 미가산
 *   ───────────────────────────────────────────────────────
 *   순계 ≈ 18.5%. 보수적으로 1.185 multiplier 사용.
 *
 *   사장님이 monthlyCosts.labor 에 *이미* 4대보험 포함해 입력했다면 over-count
 *   되지만, 한국 SMB 현실에서 대부분 "월급" 만 입력하므로 burden 가산이 정확도 우위.
 */
export const LABOR_EMPLOYER_BURDEN_MULTIPLIER = 1.185;

/**
 * 기본급 → 사업주 총 부담 (4대보험·퇴직 포함) 환산.
 *
 *  @param baseWages 사장님 입력 인건비 (월, 보통 기본급)
 *  @param hasEmployees 직원 등록 여부 — false 면 1인 운영으로 보고 무가산
 *  @param alreadyIncludesBurden true 면 이미 burden 포함된 값이라고 가정 (over-count 방지)
 */
export function enrichLaborCost(
  baseWages: number,
  hasEmployees: boolean,
  alreadyIncludesBurden = false,
): number {
  if (!Number.isFinite(baseWages) || baseWages <= 0) return 0;
  if (!hasEmployees) return baseWages; // 1인 운영 — 4대보험·퇴직 X
  if (alreadyIncludesBurden) return baseWages;
  return Math.round(baseWages * LABOR_EMPLOYER_BURDEN_MULTIPLIER);
}

// ─── Industry benchmarks (Korean 시장 출처 반영) ─────────────────────

export type PrimeCostBenchmark = {
  /** 적정 프라임 코스트 범위 (%) — 이 범위 안이면 'good' */
  primeIdealRange: [number, number];
  /** 프라임 위험선 (%) — 초과 시 'critical' */
  primeWarnAt: number;
  primeCritAt: number;
  /** 식자재 목표 (%) — 보통 단일 상한값 */
  cogsTargetMax: number;
  cogsWarnAt: number;
  cogsCritAt: number;
  /** 인건비 목표 (%) */
  laborTargetMax: number;
  laborWarnAt: number;
  laborCritAt: number;
  /** UI 표시 라벨 */
  industryLabel: { ko: string; en: string };
  /** 출처 라벨 */
  source: string;
};

/**
 * 업종별 Prime Cost 벤치마크.
 *  한식·일식·중식 (high COGS), 카페·디저트 (low COGS, high rent),
 *  치킨·분식 (medium), QSR 일반 (low prime, high turn).
 */
export function getPrimeCostBenchmark(
  categoryId: string | null | undefined,
  subIndustryId?: string | null,
): PrimeCostBenchmark {
  const sub = (subIndustryId ?? "").toLowerCase();
  const cat = (categoryId ?? "").toLowerCase();

  // 카페·디저트 — 식재료 낮음, 임대료/인건비 높음
  if (cat === "cafe-dessert" || sub.includes("cafe") || sub.includes("dessert") || sub.includes("coffee") || sub.includes("bakery")) {
    return {
      primeIdealRange: [50, 60],
      primeWarnAt: 65,
      primeCritAt: 70,
      cogsTargetMax: 30,
      cogsWarnAt: 33,
      cogsCritAt: 38,
      laborTargetMax: 30,
      laborWarnAt: 33,
      laborCritAt: 38,
      industryLabel: { ko: "카페·디저트", en: "Cafe / Dessert" },
      source: "Toast POS · 한국외식산업통계연감 2020 (cafe 평균 COGS ~28%)",
    };
  }

  // 치킨·분식·패스트푸드 (QSR 톤)
  if (sub.includes("chicken") || sub.includes("burger") || sub.includes("fast") || sub.includes("snack") || sub.includes("bunsik") || sub.includes("franchise-qsr")) {
    return {
      primeIdealRange: [55, 60],
      primeWarnAt: 63,
      primeCritAt: 68,
      cogsTargetMax: 33,
      cogsWarnAt: 36,
      cogsCritAt: 40,
      laborTargetMax: 25,
      laborWarnAt: 30,
      laborCritAt: 35,
      industryLabel: { ko: "치킨·분식·QSR", en: "Chicken / QSR" },
      source: "Toast POS QSR 표준 (Prime ≤60%)",
    };
  }

  // 한식·일식·중식 (full-service 외식 평균) — KB금융 + 한국외식산업통계연감 2020
  if (cat === "food") {
    return {
      primeIdealRange: [60, 65],
      primeWarnAt: 68,
      primeCritAt: 73,
      cogsTargetMax: 35,
      cogsWarnAt: 40,
      cogsCritAt: 45,
      laborTargetMax: 30,
      laborWarnAt: 33,
      laborCritAt: 38,
      industryLabel: { ko: "외식 (한식·일식·중식 등)", en: "Restaurant (Korean/Japanese/Chinese)" },
      source: "KB금융 (Prime ≤60%) · 한국외식산업통계연감 2020 (식재료 평균 40.4%)",
    };
  }

  // 기본 (외식 일반)
  return {
    primeIdealRange: [55, 65],
    primeWarnAt: 68,
    primeCritAt: 72,
    cogsTargetMax: 32,
    cogsWarnAt: 36,
    cogsCritAt: 42,
    laborTargetMax: 30,
    laborWarnAt: 33,
    laborCritAt: 38,
    industryLabel: { ko: "외식 일반", en: "Foodservice (general)" },
    source: "Toast POS · Restaurant365 표준 (Prime 55-65%)",
  };
}

// ─── 핵심 계산 ─────────────────────────────────────────────────────

export type PrimeCostInput = {
  /** 사장님이 입력한 월 식자재 매입액 (원). 진정한 COGS 가 아닌 *근사*. */
  ingredientPurchases: number;
  /** 사장님이 입력한 월 인건비 (원, 보통 *기본급*). */
  laborBaseWages: number;
  /** 직원 등록 여부 — 4대보험·퇴직금 자동 가산용. */
  hasEmployees: boolean;
  /**
   * laborBaseWages 가 이미 4대보험·퇴직 포함된 값이면 true (over-count 차단).
   *  대부분의 사장님 입력은 false (기본급만).
   */
  laborAlreadyIncludesBurden?: boolean;
  /** dailyEntries.totalRevenue 합 — 입력된 일수 만큼. */
  totalRevenue: number;
  /** dailyEntries.length — 입력 일수. */
  days: number;
  /** 추적 주기 — 'week' 디폴트 (industry best practice). */
  period?: "week" | "month";
};

export type PrimeCostResult = {
  /** 인건비 burden 가산 후 최종 (원). */
  enrichedLabor: number;
  /** burden 분 (가산된 차액, 원) — UI 가 "+18.5% (4대보험·퇴직금)" 표시용. */
  laborBurdenAmount: number;
  /** 사용된 COGS (이번 버전은 = ingredientPurchases). */
  cogs: number;
  /** Prime Cost 절대값 (원, *기간 변환 후*) — period='week' 면 주간, 'month' 면 월간. */
  primeCostAmount: number;
  /** 비율 (%) — 모두 기간 일치 (분자·분모 같은 기간). */
  cogsPct: number;
  laborPct: number;
  primePct: number;
  /** 신뢰도 — false 면 UI 가 empty state. days<7 또는 매출 표본부족. */
  ready: boolean;
  /** 비신뢰 사유 (디버그). */
  notReadyReason?: "no-sales" | "few-days" | "small-sample";
  /** 사용된 분모 (원) — UI '근거' 라인. */
  revenueBasis: number;
  /** 사용된 기간 (확인용). */
  period: "week" | "month";
};

/**
 * Prime Cost — 기간 일치 보장 계산.
 *
 *  핵심 원칙 (cost-ratios.ts SSOT 와 동일):
 *   · 분자(비용) 와 분모(매출) 가 *반드시* 같은 기간이어야 한다.
 *   · 사장님 입력은 비용=월간, 매출=일별 entries 합. 그대로 나누면 기간 불일치 → 비율 폭주.
 *
 *  본 함수 흐름:
 *   1. laborBaseWages → enrichLaborCost() → 진짜 사업주 부담 (4대보험+퇴직)
 *   2. 입력 매출을 monthlyEquivalentRevenue() 로 월 환산 (부분월 보정)
 *   3. period='week' 면 비용·매출 모두 월값 / 4.34 로 환산
 *   4. ready 게이트: days<7 또는 매출/비용 < 1/5 → 모든 비율 0
 */
export function calculatePrimeCost(input: PrimeCostInput): PrimeCostResult {
  const period = input.period ?? "week";
  const enrichedLabor = enrichLaborCost(
    input.laborBaseWages,
    input.hasEmployees,
    input.laborAlreadyIncludesBurden,
  );
  const laborBurdenAmount = enrichedLabor - input.laborBaseWages;
  const cogs = Math.max(0, input.ingredientPurchases);
  const totalCostMonthly = cogs + enrichedLabor;

  // 매출 — 월 환산 (cost-ratios SSOT)
  const monthlyRev = monthlyEquivalentRevenue(input.totalRevenue, input.days);

  // 신뢰도 게이트
  const notReadyReason: PrimeCostResult["notReadyReason"] =
    monthlyRev <= 0 ? "no-sales"
    : input.days < 7 ? "few-days"
    : totalCostMonthly > 0 && monthlyRev < totalCostMonthly / 5 ? "small-sample"
    : undefined;

  if (notReadyReason) {
    return {
      enrichedLabor, laborBurdenAmount, cogs,
      primeCostAmount: 0, cogsPct: 0, laborPct: 0, primePct: 0,
      ready: false, notReadyReason,
      revenueBasis: monthlyRev, period,
    };
  }

  // 기간 변환 — week 면 ÷ 4.34
  const WEEKS_PER_MONTH = OPERATING_DAYS_PER_MONTH / 6;  // 26영업일 ÷ 6일/주 ≈ 4.33주
  const periodDivisor = period === "week" ? WEEKS_PER_MONTH : 1;
  const periodCogs = cogs / periodDivisor;
  const periodLabor = enrichedLabor / periodDivisor;
  const periodRev = monthlyRev / periodDivisor;

  return {
    enrichedLabor,
    laborBurdenAmount,
    cogs,
    primeCostAmount: Math.round(periodCogs + periodLabor),
    cogsPct: Math.min(200, (periodCogs / periodRev) * 100),
    laborPct: Math.min(200, (periodLabor / periodRev) * 100),
    primePct: Math.min(200, ((periodCogs + periodLabor) / periodRev) * 100),
    ready: true,
    revenueBasis: Math.round(periodRev),
    period,
  };
}

/**
 * 색조 분류 — 벤치마크와 비교해 good/ok/warning/critical 4단계.
 *  cost-ratios 의 toneFromPct 와 별개로 *Prime Cost 카드 전용* — 벤치마크가 업종별.
 */
export type PrimeTone = "good" | "ok" | "warning" | "critical";

export function toneFromPrime(pct: number, bench: PrimeCostBenchmark): PrimeTone {
  if (pct <= 0) return "ok";
  if (pct >= bench.primeCritAt) return "critical";
  if (pct >= bench.primeWarnAt) return "warning";
  if (pct >= bench.primeIdealRange[0] && pct <= bench.primeIdealRange[1]) return "ok";
  return "good"; // 적정 범위 *아래* — 매우 우수
}

export function toneFromCogs(pct: number, bench: PrimeCostBenchmark): PrimeTone {
  if (pct <= 0) return "ok";
  if (pct >= bench.cogsCritAt) return "critical";
  if (pct >= bench.cogsWarnAt) return "warning";
  if (pct <= bench.cogsTargetMax) return "good";
  return "ok";
}

export function toneFromLabor(pct: number, bench: PrimeCostBenchmark): PrimeTone {
  if (pct <= 0) return "ok";
  if (pct >= bench.laborCritAt) return "critical";
  if (pct >= bench.laborWarnAt) return "warning";
  if (pct <= bench.laborTargetMax) return "good";
  return "ok";
}
