/**
 * 비용 비율 + 손익분기 — 단일 진실 원천 (SSOT).
 *
 *  ── 왜 이 모듈이 필요한가 ──────────────────────────────────────
 *  대시보드·차트·경고·시뮬레이션 곳곳에서 똑같은 수식을 반복 구현하다 보니
 *  "월간 비용 ÷ N일치 매출" 형태의 *기간 불일치* 버그가 12+ 곳에 퍼져 있었음.
 *
 *  예: 월 식재료 200만원, 7일치 매출 140만원 → cogsRate = 200/140 = 1.43
 *      → (1 - cogsRate) 음수/0 → 손익분기 매출이 +∞ 또는 침묵 (UI 0 표시).
 *      → 실제 사용자: 월 비용 669만 vs 일일 손익분기 289만 (월 환산 86.7M, 13× 폭주)
 *
 *  ── 원칙 ─────────────────────────────────────────
 *  1. 월간 비용은 월간 매출(또는 환산값) 과만 비교한다.
 *  2. 일간 비용은 일간 매출과만 비교한다.
 *  3. 부분 입력 (N < 30) 일 땐 일평균을 30일로 환산해 월간 비교에 사용.
 *  4. 직접 `monthlyCosts.X / dailyTotalRevenue` 같은 division 은 금지 (린트로 막을 예정).
 *  ─────────────────────────────────────────────────
 */

/**
 * 월 영업일 — 한국 외식·소매 평균 26일 (주 1일 휴무 가정).
 *
 *  ── 검증 출처 (이중·삼중 교차) ─────────────────────────────
 *  • 요기요 파트너: 월 영업일 25일로 BEP 일매출 산출
 *  • 장사닷컴 / 세종신용보증재단 / 에파타뉴스: 월 BEP ÷ 영업일 수
 *  • Restaurant365 / Toast / Lightspeed / SpotOn (US): "divide by days you operate", 25-26 일
 *  • 자체 simulation.ts:13 도 동일 26 일 사용 — 일관성 확보
 *  ─────────────────────────────────────────────────
 *
 *  ⚠️ 캘린더 30 일이 *아닌* 영업일 26 일이 업계 표준임을 주의.
 *      30 일로 나누면 일일 BEP 가 인위적으로 낮아져 "흑자처럼 보이는 적자" 위험.
 */
export const OPERATING_DAYS_PER_MONTH = 26;

/**
 * 월간 매출 환산 — 부분 입력 (N < 26) 의 일평균을 26영업일로 늘려 추정.
 * 입력 일수 >= 26 이면 사실상 1개월로 간주, raw 매출 그대로 반환.
 *
 * 가정: 사용자의 dailyEntries 는 영업일을 의미 (휴무일 0 입력 가능).
 *      이 함수는 simulation.ts:forecastSales 의 *26 환산과 동일한 모델.
 */
export function monthlyEquivalentRevenue(totalRevenue: number, days: number): number {
  if (!Number.isFinite(totalRevenue) || totalRevenue <= 0 || !Number.isFinite(days) || days <= 0) {
    return 0;
  }
  return days >= OPERATING_DAYS_PER_MONTH
    ? totalRevenue
    : (totalRevenue / days) * OPERATING_DAYS_PER_MONTH;
}

export type CogsRateInput = {
  /** 월간 식재료비 (또는 변동비). */
  monthlyIngredients: number;
  /** 입력된 dailyEntries 의 매출 합계 (N일치). */
  totalRevenue: number;
  /** 입력 일 수 (dailyEntries.length). */
  days: number;
  /**
   * 매출 데이터가 없을 때 사용할 기본 cogsRate. 외식 평균 ~33%.
   * 미지정 시 0 → BEP 가 = 고정비/30 으로만 표시 (가장 보수적).
   */
  fallback?: number;
};

/**
 * COGS (변동비) 비율 — 0~0.95 로 클램프.
 * 0.95 초과는 "사실상 변동비 = 매출" 로 BEP 가 무한대에 수렴 → 표시 의미 없음.
 */
export function calculateCogsRate(input: CogsRateInput): number {
  const monthlyRev = monthlyEquivalentRevenue(input.totalRevenue, input.days);
  if (monthlyRev <= 0) {
    // 매출 데이터 없음 → fallback. 식재료가 0이어도 fallback 우선 (보수적).
    return input.fallback ?? 0;
  }
  if (input.monthlyIngredients <= 0) {
    // 매출은 있는데 식재료 0 (서비스업) → 진짜 0.
    return 0;
  }
  const rate = input.monthlyIngredients / monthlyRev;
  return Math.min(0.95, Math.max(0, rate));
}

export type BreakEvenInput = {
  /** 월간 식재료비 (변동비). */
  monthlyIngredients: number;
  /** 월간 고정비 합 (rent + labor + utilities + sga + marketing + other). */
  monthlyFixedCosts: number;
  /** dailyEntries.totalRevenue 합. */
  totalRevenue: number;
  /** dailyEntries.length. */
  days: number;
  /** 매출 없을 때 가정할 cogsRate (기본 0.33 = 외식 평균). */
  fallbackCogsRate?: number;
};

export type BreakEvenResult = {
  /** 일일 손익분기 매출 (원). */
  breakEvenDaily: number;
  /** 월간 손익분기 매출 (원) — 일일 × 30. */
  breakEvenMonthly: number;
  /** 사용된 cogsRate (0~0.95). */
  cogsRate: number;
  /** cogsRate < 1 (계산 가능) 여부. */
  computable: boolean;
};

/**
 * 손익분기 — 월/일 한 번에 계산.
 *
 *   monthlyBep = monthlyFixedCosts / (1 - cogsRate)
 *   dailyBep   = monthlyBep / 30
 *
 * 분자·분모 모두 월 단위로 정렬되어 기간 불일치 버그 원천 차단.
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const cogsRate = calculateCogsRate({
    monthlyIngredients: input.monthlyIngredients,
    totalRevenue: input.totalRevenue,
    days: input.days,
    fallback: input.fallbackCogsRate ?? 0.33,
  });

  if (cogsRate >= 1 || input.monthlyFixedCosts <= 0) {
    return { breakEvenDaily: 0, breakEvenMonthly: 0, cogsRate, computable: false };
  }

  const monthlyBep = input.monthlyFixedCosts / (1 - cogsRate);

  // ⚠️ CRITICAL SAFETY NET (2026-05-11) ──────────────────────────────
  //  cogsRate 가 비현실적으로 높게 계산되면 (월 식재료/환산매출 > 0.9)
  //  monthlyBep 가 폭주한다.
  //
  //  실제 사용자 신고:
  //   · 월 비용 895만원 (식재료 300 + 고정 595)
  //   · 매출 7일치만 입력 (~90만원) → 월 환산 334만원
  //   · cogsRate = 300/334 = 0.898 → monthlyBep = 595/0.102 = 5,830만원
  //   · dailyBep = 5830/26 = 224만원 (비용 895보다 큰 BEP 표시되는 버그)
  //
  //  안전망: monthlyBep 가 총 비용의 3 배를 넘으면 cogsRate 신뢰 불가 →
  //  *단순 모델* (총 비용 / 영업일 26) 로 폴백.
  //  외식 표준 cogsRate 25-35% 기준, 총비용 × 3 는 cogsRate ≈ 0.67 영역 — 정상 범위 보존.
  // ─────────────────────────────────────────────────────────────────
  const totalAllCosts = input.monthlyFixedCosts + Math.max(0, input.monthlyIngredients);
  if (monthlyBep > totalAllCosts * 3) {
    const dailyBepSimple = totalAllCosts / OPERATING_DAYS_PER_MONTH;
    return {
      breakEvenDaily: Math.round(dailyBepSimple),
      breakEvenMonthly: Math.round(totalAllCosts),
      cogsRate, // 원래 계산된 cogsRate 보존 (디버그 추적용) — 0 으로 덮지 않음
      computable: true,
    };
  }

  // 영업일 26 일 기준 (업계 표준 — 위 OPERATING_DAYS_PER_MONTH 출처 참조)
  const dailyBep = monthlyBep / OPERATING_DAYS_PER_MONTH;
  return {
    breakEvenDaily: Math.round(dailyBep),
    breakEvenMonthly: Math.round(monthlyBep),
    cogsRate,
    computable: true,
  };
}

export type CostRatiosInput = {
  /** 월간 비용 항목들. */
  costs: {
    ingredients: number;
    labor: number;
    rent: number;
    utilities: number;
    sga: number;
    marketing: number;
    other: number;
  };
  /** dailyEntries.totalRevenue 합. */
  totalRevenue: number;
  /** dailyEntries.length. */
  days: number;
};

export type CostRatios = {
  /** 식재료비 / 월 환산 매출 (%) */
  ingredientRatio: number;
  /** 인건비 / 월 환산 매출 (%) */
  laborRatio: number;
  /** 임대료 / 월 환산 매출 (%) */
  rentRatio: number;
  /** (식재료 + 인건비) / 월 환산 매출 (%) */
  primeCostRatio: number;
  /** 총 비용 / 월 환산 매출 (%) — 100 이면 손익분기, 100 초과면 적자 */
  costToRevenueRatio: number;
  /** 월 환산 매출 — 호출 측에서 다른 비교 시에도 재사용 */
  monthlyRevenueEquivalent: number;
  /**
   * 비율이 신뢰 가능한지 — false 면 UI·AI 인사이트에서 *사용 금지*.
   *   사유: days < 7 (표본 부족) / monthlyRev 너무 작음 → ratio 폭주.
   *   사용자 신고 케이스: "재료비 1375%" 같은 비현실 수치 차단.
   */
  ready: boolean;
};

/**
 * 모든 비용 비율을 *월간* 기준으로 한 번에 계산.
 *
 *  ⚠️ 절대 직접 `costs.X / totalRevenue` 하지 말 것 — 이 함수만 사용.
 */
export function calculateCostRatios(input: CostRatiosInput): CostRatios {
  const monthlyRev = monthlyEquivalentRevenue(input.totalRevenue, input.days);
  const totalCosts =
    input.costs.ingredients + input.costs.labor + input.costs.rent +
    input.costs.utilities + input.costs.sga + input.costs.marketing + input.costs.other;

  // ⚠️ CRITICAL (2026-05-11): 비율 신뢰도 가드.
  //  · days < 7: 표본 부족 → ratio 폭주 위험 (예: 식재료 500만 / 7일 36만 환산 = 1375%)
  //  · monthlyRev 가 totalCosts 의 1/5 미만: 매출 입력이 사실상 비어있음 → ratio 무의미
  //  → ready=false, 모든 ratio 0. UI·AI 인사이트는 "준비 안 됨" 표시하고 사용 금지.
  if (monthlyRev <= 0 || input.days < 7 || (totalCosts > 0 && monthlyRev < totalCosts / 5)) {
    return {
      ingredientRatio: 0, laborRatio: 0, rentRatio: 0,
      primeCostRatio: 0, costToRevenueRatio: 0,
      monthlyRevenueEquivalent: monthlyRev,
      ready: false,
    };
  }

  return {
    ingredientRatio: (input.costs.ingredients / monthlyRev) * 100,
    laborRatio: (input.costs.labor / monthlyRev) * 100,
    rentRatio: (input.costs.rent / monthlyRev) * 100,
    primeCostRatio: ((input.costs.ingredients + input.costs.labor) / monthlyRev) * 100,
    costToRevenueRatio: (totalCosts / monthlyRev) * 100,
    monthlyRevenueEquivalent: monthlyRev,
    ready: true,
  };
}
