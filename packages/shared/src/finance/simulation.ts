import type {
  FinancialBenchmark,
  FinancialSimulationInput,
  FinancialSimulationResult,
  ResolvedCosts,
  BreakEvenAnalysis,
  MonthlyProjection,
  FinancialRiskLevel
} from "../types/finance";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const OPERATING_DAYS_PER_MONTH = 26; // 월 평균 영업일
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
  capitalAfterSetupLow: number
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
  const expectedRevenue =
    input.expectedMonthlyRevenue ??
    resolvedCosts.totalMonthlyFixed / 0.3; // 추정

  const rentRatio = resolvedCosts.monthlyRent / (expectedRevenue || 1);
  if (rentRatio > 0.3) {
    riskScore += 2;
    reasons.push("임대료가 예상 매출의 30%를 초과합니다.");
  }

  // 원가율 + 임대료율이 70% 초과 → 공헌이익이 너무 낮음
  const totalVariableAndRent =
    resolvedCosts.variableCostRate +
    Math.round((resolvedCosts.monthlyRent / (expectedRevenue || 1)) * 100);
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
    capitalAfterSetupLow
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

// 금액 포맷 (만 원 단위, 소수점 없음)
export function formatKRW(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${Math.round(amount / 10000)}만원`;
  }
  return `${amount.toLocaleString()}원`;
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
