import { describe, expect, it } from "vitest";
import {
  monthlyEquivalentRevenue,
  calculateCogsRate,
  calculateBreakEven,
  calculateCostRatios,
  OPERATING_DAYS_PER_MONTH,
} from "../finance/cost-ratios";

describe("monthlyEquivalentRevenue (영업일 26일 모델)", () => {
  it("scales partial-month input to 26 operating-day equivalent", () => {
    // 7일에 140만원 = 일평균 20만 → 월 520만 (영업일 26 기준)
    expect(monthlyEquivalentRevenue(1_400_000, 7)).toBe(5_200_000);
  });
  it("returns raw value when N >= 26 (사실상 1개월 입력)", () => {
    expect(monthlyEquivalentRevenue(9_000_000, 26)).toBe(9_000_000);
    expect(monthlyEquivalentRevenue(9_000_000, 30)).toBe(9_000_000);
  });
  it("returns 0 for invalid input", () => {
    expect(monthlyEquivalentRevenue(0, 7)).toBe(0);
    expect(monthlyEquivalentRevenue(1_000_000, 0)).toBe(0);
    expect(monthlyEquivalentRevenue(-100, 5)).toBe(0);
  });
});

describe("calculateCogsRate", () => {
  it("uses monthly equivalent — partial month doesn't inflate the ratio", () => {
    // 월 식재료 200만, 7일치 매출 140만 (월 환산 520만, 영업일 26 모델)
    // 버그 시: 200 / 140 = 1.43 (>1, BEP 침묵)
    // 수정 시: 200 / 520 = 0.385
    const rate = calculateCogsRate({
      monthlyIngredients: 2_000_000,
      totalRevenue: 1_400_000,
      days: 7,
    });
    expect(rate).toBeCloseTo(0.385, 2);
  });
  it("clamps to 0.95 when ingredients dominate", () => {
    const rate = calculateCogsRate({
      monthlyIngredients: 10_000_000,
      totalRevenue: 9_000_000,
      days: 30,
    });
    expect(rate).toBe(0.95); // clamped, not 1.11
  });
  it("returns 0 fallback when no revenue", () => {
    expect(calculateCogsRate({ monthlyIngredients: 2_000_000, totalRevenue: 0, days: 0 })).toBe(0);
  });
  it("uses provided fallback when no revenue", () => {
    expect(calculateCogsRate({
      monthlyIngredients: 2_000_000, totalRevenue: 0, days: 0, fallback: 0.33,
    })).toBe(0.33);
  });
});

describe("calculateBreakEven — 사용자 실제 보고 케이스 (2026-05-07)", () => {
  // 사용자 보고: 월 비용 6,690,000원 → 일일 손익분기 2,890,000원 표시 (잘못)
  // 검증: 정상 BEP 는 200K~250K 범위여야 함.
  const monthlyCosts = {
    ingredients: 2_000_000,
    labor: 2_200_000,
    rent: 1_500_000,
    utilities: 300_000,
    sga: 200_000,
    marketing: 200_000,
    other: 290_000,
  };
  const monthlyFixed = 4_690_000; // 모든 비-식재료
  const monthlyTotal = 6_690_000;

  it("월비용 669만 + 7일치 일평균 20만 → BEP 약 293K/일 (영업일 26 기준)", () => {
    const result = calculateBreakEven({
      monthlyIngredients: monthlyCosts.ingredients,
      monthlyFixedCosts: monthlyFixed,
      totalRevenue: 1_400_000,
      days: 7,
    });
    expect(result.computable).toBe(true);
    // monthlyEq = 200K * 26 = 5,200,000
    // cogsRate = 2M / 5.2M = 0.3846
    // monthlyBEP = 4.69M / 0.6154 = 7,621,250
    // dailyBEP = 7,621,250 / 26 = 293,125
    expect(result.breakEvenDaily).toBeGreaterThanOrEqual(290_000);
    expect(result.breakEvenDaily).toBeLessThanOrEqual(295_000);
    // 월 BEP 매출은 월 총비용보다 약간 큼 (변동비 cover) — 정합성 확인
    expect(result.breakEvenMonthly).toBeGreaterThan(monthlyTotal);
    expect(result.breakEvenMonthly).toBeLessThan(monthlyTotal * 1.2);
  });

  it("월비용 669만 + 30일 풀 입력 매출 750만 → BEP 약 246K/일", () => {
    const result = calculateBreakEven({
      monthlyIngredients: monthlyCosts.ingredients,
      monthlyFixedCosts: monthlyFixed,
      totalRevenue: 7_500_000,
      days: 30,
    });
    // days >= 26 → raw 750만 사용
    // cogsRate = 2M / 7.5M = 0.2667
    // monthlyBEP = 4.69M / 0.7333 = 6,395,455
    // dailyBEP = 6,395,455 / 26 = 246,002
    expect(result.breakEvenDaily).toBeGreaterThanOrEqual(240_000);
    expect(result.breakEvenDaily).toBeLessThanOrEqual(255_000);
  });

  it("이전 버그 회귀 — 일일 BEP 가 월 비용 절반 이상이면 안 됨", () => {
    const result = calculateBreakEven({
      monthlyIngredients: monthlyCosts.ingredients,
      monthlyFixedCosts: monthlyFixed,
      totalRevenue: 1_400_000,
      days: 7,
    });
    // 가드: BEP 일매출 × 30 (월 환산) 은 월 비용의 1.5배를 초과하면 안 됨
    expect(result.breakEvenMonthly).toBeLessThan(monthlyTotal * 1.5);
    // 가드: BEP 일매출은 월 비용의 절반 미만이어야 함
    expect(result.breakEvenDaily).toBeLessThan(monthlyTotal / 2);
  });
});

describe("calculateBreakEven — 사용자 신고 케이스 #2 (2026-05-11)", () => {
  // 사용자 보고: 월 비용 8,950,000원 → 일일 손익분기 2,850,000원 표시 (잘못)
  //  · 매출 입력이 매우 적은데 식재료비는 큰 경우 cogsRate 폭주 → BEP 무한대 근처.
  //  · 검증: BEP 는 총 비용의 1.5 배 이내, 일 매출 단위로 합리적이어야.
  const monthlyTotalUser = 8_950_000;

  it("월비용 895만 + 식재료 300만 + 7일 매출 88만 → BEP 폭주 방지 (3× cap 안전망)", () => {
    const result = calculateBreakEven({
      monthlyIngredients: 3_000_000,
      monthlyFixedCosts: 5_950_000,
      totalRevenue: 880_000,    // 7일치 일평균 ~12.5만
      days: 7,
    });
    expect(result.computable).toBe(true);
    // 안전망 발동 — 단순 BEP = 총 비용 / 26 = 8,950,000 / 26 = 344,231
    expect(result.breakEvenDaily).toBeGreaterThanOrEqual(330_000);
    expect(result.breakEvenDaily).toBeLessThanOrEqual(360_000);
    // 핵심: BEP 일매출이 285만원 같은 비현실적 값이면 안 됨
    expect(result.breakEvenDaily).toBeLessThan(monthlyTotalUser / 5);
  });

  it("일반화 회귀 가드 — BEP 가 항상 총 비용의 3 배 이내 (월 환산)", () => {
    // 다양한 비현실적 입력 — 모두 안전망이 잡아야
    const cases = [
      { ingredients: 5_000_000, fixed: 3_000_000, rev: 500_000, days: 3 },
      { ingredients: 4_000_000, fixed: 4_000_000, rev: 1_000_000, days: 10 },
      { ingredients: 2_000_000, fixed: 1_000_000, rev: 200_000, days: 5 },
    ];
    for (const c of cases) {
      const result = calculateBreakEven({
        monthlyIngredients: c.ingredients,
        monthlyFixedCosts: c.fixed,
        totalRevenue: c.rev,
        days: c.days,
      });
      const totalCosts = c.ingredients + c.fixed;
      expect(result.breakEvenMonthly).toBeLessThanOrEqual(totalCosts * 3);
      // 일 BEP × 26영업일 = 월 BEP 와 일치 (또는 안전망 단순 모델)
      expect(result.breakEvenDaily * 26).toBeLessThanOrEqual(totalCosts * 3.1); // 반올림 여유
    }
  });

  it("안전망 발동 시 단순 BEP = 총비용 / 26 (사장님 직관과 일치)", () => {
    const result = calculateBreakEven({
      monthlyIngredients: 3_000_000,
      monthlyFixedCosts: 5_950_000,
      totalRevenue: 100_000,   // 극단적으로 적은 매출
      days: 3,
    });
    // 8,950,000 / 26 = 344,230.77
    expect(result.breakEvenDaily).toBe(344_231);
    expect(result.breakEvenMonthly).toBe(8_950_000);
  });
});

describe("calculateBreakEven — 일반 케이스", () => {
  it("ingredients = 0 (서비스업) → BEP = 고정비/26", () => {
    const result = calculateBreakEven({
      monthlyIngredients: 0,
      monthlyFixedCosts: 6_000_000,
      totalRevenue: 5_000_000,
      days: 15,
    });
    expect(result.cogsRate).toBe(0);
    // 6M / 26 = 230,769
    expect(result.breakEvenDaily).toBe(230_769);
  });

  it("매출 없음 + fallback cogsRate 0.33 → 1.49 × 고정비 / 26", () => {
    const result = calculateBreakEven({
      monthlyIngredients: 1_000_000,
      monthlyFixedCosts: 4_000_000,
      totalRevenue: 0,
      days: 0,
      fallbackCogsRate: 0.33,
    });
    // 4M / 0.67 / 26 = 229,621
    expect(result.breakEvenDaily).toBeGreaterThanOrEqual(229_000);
    expect(result.breakEvenDaily).toBeLessThanOrEqual(230_500);
  });

  it("고정비 0 → BEP = 0 (computable false)", () => {
    const result = calculateBreakEven({
      monthlyIngredients: 1_000_000,
      monthlyFixedCosts: 0,
      totalRevenue: 5_000_000,
      days: 30,
    });
    expect(result.computable).toBe(false);
    expect(result.breakEvenDaily).toBe(0);
  });
});

describe("calculateCostRatios — 기간 정합", () => {
  const costs = {
    ingredients: 2_000_000, labor: 2_200_000, rent: 1_500_000,
    utilities: 300_000, sga: 200_000, marketing: 200_000, other: 290_000,
  };

  it("7일 부분 입력 + 일평균 20만 → 월 환산 520만 기준 비율 (영업일 26)", () => {
    const ratios = calculateCostRatios({
      costs,
      totalRevenue: 1_400_000,
      days: 7,
    });
    // 월 환산 520만, 식재료 200만 → 38.46%
    expect(ratios.ingredientRatio).toBeCloseTo(38.46, 1);
    // 인건비 220만 → 42.31%
    expect(ratios.laborRatio).toBeCloseTo(42.31, 1);
    // 임대료 150만 → 28.85%
    expect(ratios.rentRatio).toBeCloseTo(28.85, 1);
    // prime 80.77%
    expect(ratios.primeCostRatio).toBeCloseTo(80.77, 1);
    // 총 비용 669만 / 월 520만 = 128.65%
    expect(ratios.costToRevenueRatio).toBeCloseTo(128.65, 1);
  });

  it("30일 풀 입력 + 매출 750만 → raw 750만 기준 (>= 26일)", () => {
    const ratios = calculateCostRatios({
      costs,
      totalRevenue: 7_500_000,
      days: 30,
    });
    // 월 750만, 식재료 200만 → 26.67%
    expect(ratios.ingredientRatio).toBeCloseTo(26.67, 1);
    // 총 비용 669만 / 750만 = 89.2%
    expect(ratios.costToRevenueRatio).toBeCloseTo(89.2, 1);
  });

  it("매출 0 → 모든 비율 0 (NaN/Inf 방지)", () => {
    const ratios = calculateCostRatios({ costs, totalRevenue: 0, days: 0 });
    expect(ratios.ingredientRatio).toBe(0);
    expect(ratios.costToRevenueRatio).toBe(0);
    expect(Number.isFinite(ratios.primeCostRatio)).toBe(true);
  });

  it("OPERATING_DAYS_PER_MONTH 상수는 26 고정 (한국·국제 외식 표준)", () => {
    expect(OPERATING_DAYS_PER_MONTH).toBe(26);
  });
});
