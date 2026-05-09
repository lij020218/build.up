import type {
  FinancialBenchmark,
  FinancialSimulationInput,
  FinancialSimulationResult,
  ResolvedCosts,
  BreakEvenAnalysis,
  MonthlyProjection,
  FinancialRiskLevel
} from "../types/finance";
import { OPERATING_DAYS_PER_MONTH } from "./cost-ratios";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const DEFAULT_SIMULATION_MONTHS = 6;

// ─── 내부 유틸 ───────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function midpoint(low: number, high: number) {
  return Math.round((low + high) / 2);
}

// ─── 비용 확정 ───────────────────────────────────────────────────────────────
// 사용자가 직접 입력한 값을 우선 적용하고, 없으면 벤치마크 중간값 사용

function resolveCosts(
  input: FinancialSimulationInput,
  benchmark: FinancialBenchmark | null
): ResolvedCosts {
  const cogsRate = benchmark?.avgCogsRate ?? 33;

  const monthlyRent =
    input.monthlyRent ??
    (benchmark ? midpoint(benchmark.monthlyRentLow, benchmark.monthlyRentHigh) : 1500000);

  const monthlyLaborCost = input.monthlyLaborCost ?? 0;

  const monthlyOtherFixed =
    input.monthlyOtherFixed ??
    (benchmark
      ? Math.round(
          midpoint(benchmark.monthlyRevenueLow, benchmark.monthlyRevenueHigh) *
            (benchmark.avgOtherFixedRate / 100)
        )
      : 300000);

  const totalMonthlyFixed = monthlyRent + monthlyLaborCost + monthlyOtherFixed;

  return {
    monthlyRent,
    monthlyLaborCost,
    monthlyOtherFixed,
    totalMonthlyFixed,
    cogsRate,
    variableCostRate: cogsRate
  };
}

// ─── 손익분기점 계산 ──────────────────────────────────────────────────────────
//
// 공식:
//   BEP(월 매출) = 고정비 합계 / (1 - 원가율)
//
// 직관적 해석:
//   매출에서 원재료비를 뺀 나머지(공헌이익)로 고정비를 모두 커버하는 지점

function calculateBreakEven(
  resolvedCosts: ResolvedCosts,
  expectedMonthlyRevenue: number,
  simulationMonths: number,
  avgTicketSize?: number
): BreakEvenAnalysis {
  const contributionMarginRate = 1 - resolvedCosts.variableCostRate / 100;

  // 공헌이익률이 0 이하이면 BEP 자체가 무한대 → 사실상 불가능한 구조
  const monthlyBreakEvenRevenue =
    contributionMarginRate > 0
      ? Math.round(resolvedCosts.totalMonthlyFixed / contributionMarginRate)
      : Number.MAX_SAFE_INTEGER;

  const dailyBreakEvenRevenue = Math.round(
    monthlyBreakEvenRevenue / OPERATING_DAYS_PER_MONTH
  );

  const dailyTransactionsNeeded =
    avgTicketSize && avgTicketSize > 0
      ? Math.ceil(dailyBreakEvenRevenue / avgTicketSize)
      : undefined;

  // 예상 매출이 BEP보다 높으면 몇 달 후 손익분기인지 추정
  // (매출은 초기 0에서 선형으로 증가한다고 가정: 1개월차 20%, 3개월차 60%, 이후 100%)
  let estimatedBreakEvenMonth: number | null = null;
  for (let month = 1; month <= simulationMonths; month++) {
    const rampedRevenue = applyRamp(expectedMonthlyRevenue, month);
    const profit =
      rampedRevenue * (1 - resolvedCosts.variableCostRate / 100) -
      resolvedCosts.totalMonthlyFixed;
    if (profit >= 0) {
      estimatedBreakEvenMonth = month;
      break;
    }
  }

  return {
    monthlyBreakEvenRevenue,
    dailyBreakEvenRevenue,
    dailyTransactionsNeeded,
    estimatedBreakEvenMonth,
    totalMonthlyFixed: resolvedCosts.totalMonthlyFixed,
    variableCostRate: resolvedCosts.variableCostRate
  };
}

// ─── 매출 램프업 모델 ─────────────────────────────────────────────────────────
// 오픈 초기에는 인지도가 없어 기대 매출의 100%가 나오지 않음
// 1개월: 30%, 2개월: 50%, 3개월: 70%, 4개월: 85%, 5개월~: 100%

function applyRamp(baseRevenue: number, month: number): number {
  const rampFactors: Record<number, number> = {
    1: 0.30,
    2: 0.50,
    3: 0.70,
    4: 0.85
  };
  return Math.round(baseRevenue * (rampFactors[month] ?? 1.0));
}

// ─── 월별 현금흐름 시뮬레이션 ────────────────────────────────────────────────

function buildProjections(
  resolvedCosts: ResolvedCosts,
  expectedMonthlyRevenue: number,
  operatingCash: number,   // 초기 투자 후 남은 운전자금
  months: number
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  let cumulativeCash = operatingCash;

  for (let month = 1; month <= months; month++) {
    const revenue = applyRamp(expectedMonthlyRevenue, month);
    const cogs = Math.round(revenue * (resolvedCosts.cogsRate / 100));
    const rent = resolvedCosts.monthlyRent;
    const labor = resolvedCosts.monthlyLaborCost;
    const otherFixed = resolvedCosts.monthlyOtherFixed;
    const totalCosts = cogs + rent + labor + otherFixed;
    const netProfit = revenue - totalCosts;

    cumulativeCash += netProfit;

    projections.push({
      month,
      revenue,
      cogs,
      rent,
      labor,
      otherFixed,
      totalCosts,
      netProfit,
      cumulativeCash
    });
  }

  return projections;
}

// ─── 버티기 개월 수 계산 ──────────────────────────────────────────────────────
// 매출이 전혀 없다고 가정할 때, 운전자금만으로 고정비를 몇 달 낼 수 있는지

function calculateSurvivabilityMonths(
  operatingCash: number,
  totalMonthlyFixed: number
): number {
  if (totalMonthlyFixed <= 0) return 99;
  return Math.floor(operatingCash / totalMonthlyFixed);
}

// ─── 리스크 평가 ──────────────────────────────────────────────────────────────

function assessRisk(
  input: FinancialSimulationInput,
  resolvedCosts: ResolvedCosts,
  breakEven: BreakEvenAnalysis,
  survivabilityMonths: number,
  capitalAfterSetupLow: number,
  expectedMonthlyRevenue: number
): { riskLevel: FinancialRiskLevel; riskReasons: string[] } {
  const reasons: string[] = [];
  let riskScore = 0;

  // 운전자금 부족 (초기 투자 후 남는 돈이 너무 적을 때)
  if (capitalAfterSetupLow < 0) {
    riskScore += 4;
    reasons.push("초기 투자비가 자본금을 초과할 가능성이 있습니다.");
  } else if (capitalAfterSetupLow < resolvedCosts.totalMonthlyFixed * 2) {
    riskScore += 2;
    reasons.push("초기 투자 후 운전자금이 2개월치 고정비에도 못 미칩니다.");
  }

  // 버티기 개월 수 부족
  if (survivabilityMonths < 3) {
    riskScore += 3;
    reasons.push("매출 없이 버틸 수 있는 기간이 3개월 미만입니다.");
  } else if (survivabilityMonths < 5) {
    riskScore += 1;
    reasons.push("매출 없이 버틸 수 있는 기간이 5개월 미만입니다.");
  }

  // 손익분기 미달성
  if (breakEven.estimatedBreakEvenMonth === null) {
    riskScore += 3;
    reasons.push("예상 매출로는 시뮬레이션 기간 내 손익분기를 달성하기 어렵습니다.");
  } else if (breakEven.estimatedBreakEvenMonth > 4) {
    riskScore += 1;
    reasons.push("손익분기 달성까지 5개월 이상 걸릴 것으로 예상됩니다.");
  }

  // 임대료가 예상 매출의 30% 초과
  const rentRatio = resolvedCosts.monthlyRent / (expectedMonthlyRevenue || 1);
  if (rentRatio > 0.3) {
    riskScore += 2;
    reasons.push("임대료가 예상 매출의 30%를 초과합니다.");
  }

  // 원가율 + 임대료율이 70% 초과 → 공헌이익이 너무 낮음
  const totalVariableAndRent =
    resolvedCosts.variableCostRate +
    Math.round((resolvedCosts.monthlyRent / (expectedMonthlyRevenue || 1)) * 100);
  if (totalVariableAndRent > 70) {
    riskScore += 2;
    reasons.push("원가율과 임대료 비중 합산이 70%를 넘어 이익 여지가 좁습니다.");
  }

  const riskLevel: FinancialRiskLevel =
    riskScore >= 6 ? "critical"
    : riskScore >= 4 ? "high"
    : riskScore >= 2 ? "medium"
    : "low";

  return { riskLevel, riskReasons: reasons };
}

// ─── 메인 함수 ───────────────────────────────────────────────────────────────

export function buildFinancialSimulation(
  input: FinancialSimulationInput,
  benchmark: FinancialBenchmark | null
): FinancialSimulationResult {
  const simulationMonths = input.simulationMonths ?? DEFAULT_SIMULATION_MONTHS;

  // 1. 비용 확정
  const resolvedCosts = resolveCosts(input, benchmark);

  // 2. 예상 매출 결정 (없으면 벤치마크 보수적 하한 사용)
  const expectedMonthlyRevenue =
    input.expectedMonthlyRevenue ??
    (benchmark?.monthlyRevenueLow ?? resolvedCosts.totalMonthlyFixed * 1.2);

  // 3. 초기 투자 후 운전자금 계산
  const setupCostLow = benchmark?.setupCostLow ?? 0;
  const setupCostHigh = benchmark?.setupCostHigh ?? 0;
  const capitalAfterSetupLow = input.capital - setupCostHigh;
  const capitalAfterSetupHigh = input.capital - setupCostLow;

  // 운전자금: 낙관적 시나리오 중간값 사용 (음수면 0으로 클램프)
  const operatingCash = clamp(
    midpoint(capitalAfterSetupLow, capitalAfterSetupHigh),
    0,
    input.capital
  );

  // 4. 손익분기점 분석
  const breakEven = calculateBreakEven(
    resolvedCosts,
    expectedMonthlyRevenue,
    simulationMonths,
    benchmark?.avgTicketSize
  );

  // 5. 월별 현금흐름 시뮬레이션
  const projections = buildProjections(
    resolvedCosts,
    expectedMonthlyRevenue,
    operatingCash,
    simulationMonths
  );

  // 6. 버티기 개월 수
  const survivabilityMonths = calculateSurvivabilityMonths(
    operatingCash,
    resolvedCosts.totalMonthlyFixed
  );

  // 7. 리스크 평가
  const { riskLevel, riskReasons } = assessRisk(
    input,
    resolvedCosts,
    breakEven,
    survivabilityMonths,
    capitalAfterSetupLow,
    expectedMonthlyRevenue
  );

  return {
    input,
    benchmark,
    resolvedCosts,
    breakEven,
    projections,
    survivabilityMonths,
    capitalAfterSetup: {
      low: capitalAfterSetupLow,
      high: capitalAfterSetupHigh
    },
    riskLevel,
    riskReasons,
    revenueRange: {
      low: benchmark?.monthlyRevenueLow ?? 0,
      high: benchmark?.monthlyRevenueHigh ?? 0
    },
    setupCostRange: {
      low: setupCostLow,
      high: setupCostHigh
    },
    rentRange: {
      low: benchmark?.monthlyRentLow ?? 0,
      high: benchmark?.monthlyRentHigh ?? 0
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── 개업 후 운영 시뮬레이션 엔진 ────────────────────────────────────────────
// simulation.ts의 개업 전 예측과 dashboard.ts의 실적 데이터를 통합하여
// 실제 데이터 기반 미래 예측 + What-If 시나리오 + 민감도 분석을 제공합니다.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type OperatingSimulationInput = {
  /** 실제 일매출 기록 */
  dailyEntries: Array<{ date: string; sales: number; customers: number }>;
  /** 현재 월 비용 구조 */
  monthlyCosts: { ingredients: number; labor: number; rent: number; utilities: number; other: number };
  /** 과거 월별 비용 기록 */
  costHistory: Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }>;
  /** 초기 투자금 */
  capital: number;
  /** 개업일 */
  launchDate: string | null;
};

export type TrendForecast = {
  /** 다음 달 예상 매출 */
  nextMonthRevenue: number;
  /** 다음 달 예상 비용 */
  nextMonthCosts: number;
  /** 다음 달 예상 순이익 */
  nextMonthProfit: number;
  /** 예측 신뢰도 */
  confidence: "high" | "medium" | "low";
  /** 근거 데이터 일수 */
  basisDays: number;
  /** 요일별 평균 매출 (0=일, 6=토) */
  dayOfWeekAvg: number[];
  /** 주간 성장률 (최근 4주 기울기) */
  weeklyGrowthRate: number;
};

export type WhatIfScenario = {
  label: string;
  description: string;
  /** 변경 전 월 순이익 */
  baseProfit: number;
  /** 변경 후 월 순이익 */
  newProfit: number;
  /** 차이 */
  delta: number;
  /** 변경 전 BEP 일매출 */
  baseBepDaily: number;
  /** 변경 후 BEP 일매출 */
  newBepDaily: number;
  /** 가정 사항 */
  assumptions: string[];
};

export type SensitivityResult = {
  /** 영업레버리지 (DOL) */
  operatingLeverage: number;
  /** 매출 10% 하락 시 이익 변화% */
  revenueDropImpact: number;
  /** 비용 항목별 민감도: 해당 비용 5% 증가 시 순이익 변화 */
  costSensitivity: Array<{
    costName: string;
    currentAmount: number;
    fivePercentIncrease: number;
    profitImpact: number;
  }>;
  /** 3시나리오 스트레스 테스트 */
  stressTest: {
    worst: { revenue: number; costs: number; profit: number; label: string };
    base: { revenue: number; costs: number; profit: number; label: string };
    best: { revenue: number; costs: number; profit: number; label: string };
  };
};

export type OperatingSimulationResult = {
  forecast: TrendForecast;
  sensitivity: SensitivityResult;
  /** ROI 분해 */
  roiDecomposition: {
    investmentReturn: number;    // 영업이익 / 투자원금 × 100
    profitMargin: number;        // 영업이익 / 매출 × 100
    assetTurnover: number;       // 연간 매출 / 투자원금
    monthlyROI: number;          // 월 투자수익률 %
    paybackMonths: number | null; // 투자금 회수까지 남은 개월
  };
  /** 데이터 충분 여부 */
  dataQuality: {
    totalDays: number;
    hasCostHistory: boolean;
    confidenceLevel: "high" | "medium" | "low" | "insufficient";
  };
};

// ─── Layer 1: 추세 기반 예측 ──────────────────────────────────────────────────

function buildTrendForecast(input: OperatingSimulationInput): TrendForecast {
  const entries = input.dailyEntries;
  const totalDays = entries.length;

  // 요일별 평균 계산
  const dayBuckets: number[][] = [[], [], [], [], [], [], []];
  for (const e of entries) {
    const dow = new Date(e.date + "T12:00:00").getDay();
    dayBuckets[dow].push(e.sales);
  }
  const dayOfWeekAvg = dayBuckets.map(
    (bucket) => bucket.length > 0 ? Math.round(bucket.reduce((s, v) => s + v, 0) / bucket.length) : 0
  );

  // 주간 성장률 (최근 4주 비교)
  let weeklyGrowthRate = 0;
  if (totalDays >= 14) {
    const weeks: number[] = [];
    for (let w = 0; w < Math.min(4, Math.floor(totalDays / 7)); w++) {
      const weekEntries = entries.slice(-(w + 1) * 7, w === 0 ? undefined : -w * 7);
      weeks.unshift(weekEntries.reduce((s, e) => s + e.sales, 0));
    }
    if (weeks.length >= 2) {
      const growths: number[] = [];
      for (let i = 1; i < weeks.length; i++) {
        if (weeks[i - 1] > 0) {
          const g = (weeks[i] - weeks[i - 1]) / weeks[i - 1];
          if (isFinite(g)) growths.push(g);
        }
      }
      weeklyGrowthRate = growths.length > 0
        ? Math.round(growths.reduce((s, v) => s + v, 0) / growths.length * 1000) / 10
        : 0;
    }
  }

  // 다음 달 매출 예측: 최근 데이터 가중평균 × 26영업일
  let nextMonthRevenue = 0;
  let confidence: TrendForecast["confidence"] = "low";
  let basisDays = totalDays;

  if (totalDays >= 30) {
    // 30일+ → 최근 30일 평균 × 26, 높은 신뢰도
    const recent30 = entries.slice(-30);
    const avg = recent30.reduce((s, e) => s + e.sales, 0) / recent30.length;
    nextMonthRevenue = Math.round(avg * OPERATING_DAYS_PER_MONTH);
    confidence = "high";
    basisDays = 30;
  } else if (totalDays >= 14) {
    // 14-29일 → 최근 14일 평균, 보통 신뢰도
    const recent14 = entries.slice(-14);
    const avg = recent14.reduce((s, e) => s + e.sales, 0) / recent14.length;
    nextMonthRevenue = Math.round(avg * OPERATING_DAYS_PER_MONTH);
    confidence = "medium";
    basisDays = 14;
  } else if (totalDays >= 7) {
    // 7-13일 → 최근 7일 평균, 낮은 신뢰도
    const recent7 = entries.slice(-7);
    const avg = recent7.reduce((s, e) => s + e.sales, 0) / recent7.length;
    nextMonthRevenue = Math.round(avg * OPERATING_DAYS_PER_MONTH);
    confidence = "low";
    basisDays = 7;
  }

  // 성장률 보정
  if (weeklyGrowthRate !== 0 && confidence !== "low") {
    const monthlyGrowth = weeklyGrowthRate * 4.34 / 100;
    nextMonthRevenue = Math.round(nextMonthRevenue * (1 + monthlyGrowth));
  }

  // 비용 예측: costHistory 추세 or 현재 비용 유지
  const mc = input.monthlyCosts;
  const currentTotalCosts = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;
  let nextMonthCosts = currentTotalCosts;

  if (input.costHistory.length >= 2) {
    const sorted = [...input.costHistory].sort((a, b) => a.month.localeCompare(b.month));
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const lastTotal = last.ingredients + last.labor + last.rent + last.utilities + last.other;
    const prevTotal = prev.ingredients + prev.labor + prev.rent + prev.utilities + prev.other;
    if (prevTotal > 0) {
      const costTrend = (lastTotal - prevTotal) / prevTotal;
      // 비용 추세 반영하되 ±20% 범위로 클램프
      nextMonthCosts = Math.round(lastTotal * (1 + clamp(costTrend, -0.2, 0.2)));
    }
  }

  return {
    nextMonthRevenue,
    nextMonthCosts,
    nextMonthProfit: nextMonthRevenue - nextMonthCosts,
    confidence,
    basisDays,
    dayOfWeekAvg,
    weeklyGrowthRate,
  };
}

// ─── Layer 2: What-If 시나리오 생성 ───────────────────────────────────────────

export function buildWhatIfScenarios(
  input: OperatingSimulationInput,
  language: "ko" | "en" = "ko"
): WhatIfScenario[] {
  const ko = language === "ko";
  const mc = input.monthlyCosts;
  const totalCosts = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;
  const entries = input.dailyEntries;

  // 현재 기준값
  const avgDailySales = entries.length > 0
    ? entries.slice(-30).reduce((s, e) => s + e.sales, 0) / Math.min(entries.length, 30)
    : 0;
  const monthlyRevenue = Math.round(avgDailySales * OPERATING_DAYS_PER_MONTH);
  const baseProfit = monthlyRevenue - totalCosts;
  const cogsRate = monthlyRevenue > 0 ? mc.ingredients / monthlyRevenue : 0.33;
  const fixedCosts = mc.labor + mc.rent + mc.utilities + mc.other;
  const contributionRate = 1 - cogsRate;
  const baseBepDaily = contributionRate > 0
    ? Math.round((fixedCosts / contributionRate) / OPERATING_DAYS_PER_MONTH)
    : 0;

  const scenarios: WhatIfScenario[] = [];

  // 시나리오 1: 메뉴 가격 5% 인상
  if (monthlyRevenue > 0) {
    const priceUp = 0.05;
    const churnRate = 0.10; // 가정: 고객 10% 이탈
    const newRevenue = Math.round(monthlyRevenue * (1 + priceUp) * (1 - churnRate));
    const newCogs = Math.round(newRevenue * cogsRate);
    const newProfit = newRevenue - newCogs - fixedCosts;
    const newContrib = newRevenue > 0 ? 1 - (newCogs / newRevenue) : 0;
    const newBep = newContrib > 0
      ? Math.round((fixedCosts / newContrib) / OPERATING_DAYS_PER_MONTH)
      : 0;
    scenarios.push({
      label: ko ? "메뉴 가격 5% 인상" : "Raise prices 5%",
      description: ko
        ? "가격을 올리면 매출은 늘지만 일부 고객이 이탈합니다"
        : "Price increase boosts revenue but some customers leave",
      baseProfit, newProfit, delta: newProfit - baseProfit,
      baseBepDaily, newBepDaily: newBep,
      assumptions: [
        ko ? "가정: 고객 이탈률 10%" : "Assumption: 10% customer churn",
        ko ? "가정: 재료비 비율 동일" : "Assumption: COGS ratio unchanged",
      ],
    });
  }

  // 시나리오 2: 재료비 10% 절감
  if (mc.ingredients > 0) {
    const reduction = 0.10;
    const newIngredients = Math.round(mc.ingredients * (1 - reduction));
    const newProfit = monthlyRevenue - newIngredients - mc.labor - mc.rent - mc.utilities - mc.other;
    const newCogsRate = monthlyRevenue > 0 ? newIngredients / monthlyRevenue : cogsRate;
    const newContrib = 1 - newCogsRate;
    const newBep = newContrib > 0
      ? Math.round((fixedCosts / newContrib) / OPERATING_DAYS_PER_MONTH)
      : 0;
    scenarios.push({
      label: ko ? "재료비 10% 절감" : "Cut ingredient costs 10%",
      description: ko
        ? "공급처 재협상 또는 메뉴 원가 최적화"
        : "Renegotiate suppliers or optimize recipe costs",
      baseProfit, newProfit, delta: newProfit - baseProfit,
      baseBepDaily, newBepDaily: newBep,
      assumptions: [
        ko ? "가정: 매출 변화 없음" : "Assumption: No revenue change",
        ko ? `절감액: ${formatKRW(mc.ingredients - newIngredients)}/월` : `Savings: ${formatKRW(mc.ingredients - newIngredients)}/mo`,
      ],
    });
  }

  // 시나리오 3: 임대료 10% 협상
  if (mc.rent > 0) {
    const reduction = 0.10;
    const newRent = Math.round(mc.rent * (1 - reduction));
    const newFixed = mc.labor + newRent + mc.utilities + mc.other;
    const newProfit = monthlyRevenue - mc.ingredients - newFixed;
    const newBep = contributionRate > 0
      ? Math.round((newFixed / contributionRate) / OPERATING_DAYS_PER_MONTH)
      : 0;
    scenarios.push({
      label: ko ? "임대료 10% 협상" : "Negotiate 10% rent reduction",
      description: ko
        ? "계약 갱신 시 임대료 인하를 시도합니다"
        : "Request rent reduction at lease renewal",
      baseProfit, newProfit, delta: newProfit - baseProfit,
      baseBepDaily, newBepDaily: newBep,
      assumptions: [
        ko ? `절감액: ${formatKRW(mc.rent - newRent)}/월` : `Savings: ${formatKRW(mc.rent - newRent)}/mo`,
        ko ? "가정: 다른 비용 변화 없음" : "Assumption: No other cost changes",
      ],
    });
  }

  // 시나리오 4: 매출 20% 성장
  if (monthlyRevenue > 0) {
    const growth = 0.20;
    const newRevenue = Math.round(monthlyRevenue * (1 + growth));
    const newCogs = Math.round(newRevenue * cogsRate);
    const newProfit = newRevenue - newCogs - fixedCosts;
    scenarios.push({
      label: ko ? "매출 20% 성장" : "20% revenue growth",
      description: ko
        ? "마케팅 강화 또는 신규 채널 확보 시 효과"
        : "Effect of marketing push or new sales channel",
      baseProfit, newProfit, delta: newProfit - baseProfit,
      baseBepDaily, newBepDaily: baseBepDaily,
      assumptions: [
        ko ? "가정: 고정비 동일" : "Assumption: Fixed costs unchanged",
        ko ? "가정: 재료비 비율 동일" : "Assumption: COGS ratio unchanged",
      ],
    });
  }

  return scenarios;
}

// ─── Layer 3: 민감도 분석 ─────────────────────────────────────────────────────

function buildSensitivityAnalysis(input: OperatingSimulationInput): SensitivityResult {
  const mc = input.monthlyCosts;
  const entries = input.dailyEntries;

  const avgDailySales = entries.length > 0
    ? entries.slice(-30).reduce((s, e) => s + e.sales, 0) / Math.min(entries.length, 30)
    : 0;
  const monthlyRevenue = Math.round(avgDailySales * OPERATING_DAYS_PER_MONTH);
  const totalCosts = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;
  const operatingProfit = monthlyRevenue - totalCosts;

  // 공헌이익 (매출 - 변동비)
  const variableCosts = mc.ingredients; // 재료비만 변동비로 간주
  const contributionMargin = monthlyRevenue - variableCosts;

  // 영업레버리지 (DOL)
  const rawLeverage = operatingProfit !== 0 ? contributionMargin / operatingProfit : 0;
  const operatingLeverage = isFinite(rawLeverage) ? Math.round(rawLeverage * 10) / 10 : 0;

  // 매출 10% 하락 시 이익 변화
  const revenueDropImpact = operatingLeverage !== 0
    ? Math.round(operatingLeverage * -10 * 10) / 10
    : 0;

  // 비용 항목별 민감도 (5% 증가 시)
  const costItems = [
    { name: "재료비", amount: mc.ingredients },
    { name: "인건비", amount: mc.labor },
    { name: "임대료", amount: mc.rent },
    { name: "공과금", amount: mc.utilities },
    { name: "기타", amount: mc.other },
  ].filter((c) => c.amount > 0);

  const costSensitivity = costItems.map((c) => ({
    costName: c.name,
    currentAmount: c.amount,
    fivePercentIncrease: Math.round(c.amount * 0.05),
    profitImpact: -Math.round(c.amount * 0.05), // 비용 증가 = 이익 감소
  }));

  // 3시나리오 스트레스 테스트
  const worstRevenue = Math.round(monthlyRevenue * 0.8);  // -20%
  const bestRevenue = Math.round(monthlyRevenue * 1.15);   // +15%
  const worstCosts = Math.round(totalCosts * 1.10);        // +10%
  const bestCosts = Math.round(totalCosts * 0.95);         // -5%

  const stressTest = {
    worst: {
      revenue: worstRevenue,
      costs: worstCosts,
      profit: worstRevenue - worstCosts,
      label: "비관적 (매출-20%, 비용+10%)",
    },
    base: {
      revenue: monthlyRevenue,
      costs: totalCosts,
      profit: operatingProfit,
      label: "현재 추세 유지",
    },
    best: {
      revenue: bestRevenue,
      costs: bestCosts,
      profit: bestRevenue - bestCosts,
      label: "낙관적 (매출+15%, 비용-5%)",
    },
  };

  return { operatingLeverage, revenueDropImpact, costSensitivity, stressTest };
}

// ─── 메인: 운영 시뮬레이션 통합 ───────────────────────────────────────────────

export function buildOperatingSimulation(
  input: OperatingSimulationInput
): OperatingSimulationResult {
  const forecast = buildTrendForecast(input);
  const sensitivity = buildSensitivityAnalysis(input);

  // ROI 분해
  const mc = input.monthlyCosts;
  const entries = input.dailyEntries;
  const avgDailySales = entries.length > 0
    ? entries.slice(-30).reduce((s, e) => s + e.sales, 0) / Math.min(entries.length, 30)
    : 0;
  const monthlyRevenue = Math.round(avgDailySales * OPERATING_DAYS_PER_MONTH);
  const totalCosts = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;
  const operatingProfit = monthlyRevenue - totalCosts;
  const capital = input.capital > 0 ? input.capital : 1;

  const profitMargin = monthlyRevenue > 0
    ? Math.round((operatingProfit / monthlyRevenue) * 1000) / 10
    : 0;
  const annualRevenue = monthlyRevenue * 12;
  const assetTurnover = Math.round((annualRevenue / capital) * 100) / 100;
  const monthlyROI = Math.round((operatingProfit / capital) * 1000) / 10;
  const investmentReturn = profitMargin * assetTurnover;
  const paybackMonths = operatingProfit > 0
    ? Math.ceil(capital / operatingProfit)
    : null;

  // 데이터 품질 평가
  const totalDays = entries.length;
  const confidenceLevel: OperatingSimulationResult["dataQuality"]["confidenceLevel"] =
    totalDays >= 90 ? "high"
    : totalDays >= 30 ? "medium"
    : totalDays >= 7 ? "low"
    : "insufficient";

  return {
    forecast,
    sensitivity,
    roiDecomposition: {
      investmentReturn: Math.round(investmentReturn * 10) / 10,
      profitMargin,
      assetTurnover,
      monthlyROI,
      paybackMonths,
    },
    dataQuality: {
      totalDays,
      hasCostHistory: input.costHistory.length >= 2,
      confidenceLevel,
    },
  };
}

// ─── 보조 함수 (UI에서 직접 활용) ────────────────────────────────────────────

// 손익분기 월 매출이 벤치마크 하한보다 낮은지 검사
// (낮으면 달성 가능성이 높다는 뜻)
export function isBreakEvenAchievable(
  breakEvenRevenue: number,
  benchmark: FinancialBenchmark | null
): boolean {
  if (!benchmark) return true;
  return breakEvenRevenue <= benchmark.monthlyRevenueLow;
}

// 두 시나리오의 리스크 차이 텍스트 (상권 비교 화면 등에서 활용)
export function compareRiskLevels(
  a: FinancialRiskLevel,
  b: FinancialRiskLevel
): -1 | 0 | 1 {
  const order: Record<FinancialRiskLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3
  };
  if (order[a] < order[b]) return -1;
  if (order[a] > order[b]) return 1;
  return 0;
}

/**
 * 금액 포맷 — LLM prompt + UI 표시 공용 SSOT.
 *
 *  ⚠️ 반드시 만원·억원 단위 명시. raw 원 + 콤마 (예: "200,000원") 를 LLM 이
 *      "200만원" 으로 오독하는 버그 방지 (사용자 보고 2026-05-07: 20만원 → 200만원 폭주).
 *  ⚠️ 음수 부호 보존 (이전 fmt 버그: "−5,000원" → "5,000원" 으로 부호 누락).
 */
export function formatKRW(amount: number): string {
  if (!Number.isFinite(amount)) return "0원";
  const abs = Math.abs(Math.round(amount));
  const sign = amount < 0 ? "−" : "";
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억원`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000).toLocaleString()}만원`;
  return `${sign}${abs.toLocaleString()}원`;
}

// 리스크 레벨 → 한국어 라벨
export function getRiskLevelLabel(level: FinancialRiskLevel, language: "ko" | "en" = "ko"): string {
  if (language === "ko") {
    const map: Record<FinancialRiskLevel, string> = {
      low: "안정",
      medium: "보통",
      high: "주의",
      critical: "위험"
    };
    return map[level];
  }
  const map: Record<FinancialRiskLevel, string> = {
    low: "Low Risk",
    medium: "Moderate Risk",
    high: "High Risk",
    critical: "Critical Risk"
  };
  return map[level];
}
