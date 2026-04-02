// ─── DB 레코드 타입 ───────────────────────────────────────────────────────────

export type FinancialBenchmark = {
  id: string;
  categoryId: string;
  marketStyle: string;
  rentBand: string;

  monthlyRevenueLow: number;
  monthlyRevenueHigh: number;

  avgCogsRate: number;         // 원가율 (0~100)
  avgLaborRate: number;        // 인건비율 (0~100)
  avgOtherFixedRate: number;   // 기타 고정비율 (0~100)

  monthlyRentLow: number;
  monthlyRentHigh: number;

  setupCostLow: number;
  setupCostHigh: number;

  avgBreakEvenMonths: number;
  avgDailyCustomersLow?: number;
  avgDailyCustomersHigh?: number;
  avgTicketSize?: number;

  notes?: string;
  freshnessStatus: "fresh" | "review_soon" | "stale" | "blocked";
  lastCheckedAt: string;
  nextReviewAt?: string;
};

// ─── 시뮬레이션 입력 ─────────────────────────────────────────────────────────

export type FinancialSimulationInput = {
  capital: number;               // 자본금 (원)
  categoryId: string;
  marketStyle: string;
  rentBand: string;

  // 사용자가 직접 입력한 값 (없으면 벤치마크 기본값 사용)
  monthlyRent?: number;          // 월 임대료 직접 입력
  monthlyLaborCost?: number;     // 인건비 (1인 운영이면 0)
  monthlyOtherFixed?: number;    // 기타 고정비 직접 입력
  expectedMonthlyRevenue?: number; // 예상 월 매출 (없으면 벤치마크 하한 사용)

  simulationMonths?: number;     // 현금흐름 시뮬 기간 (기본 6)
};

// ─── 계산 중간 결과 타입 ─────────────────────────────────────────────────────

export type ResolvedCosts = {
  monthlyRent: number;
  monthlyLaborCost: number;
  monthlyOtherFixed: number;
  totalMonthlyFixed: number;       // 고정비 합계
  cogsRate: number;                // 적용된 원가율 (0~100)
  variableCostRate: number;        // 변동비율 = cogsRate
};

export type BreakEvenAnalysis = {
  // 손익분기 매출 계산: 고정비 / (1 - 원가율)
  monthlyBreakEvenRevenue: number;
  dailyBreakEvenRevenue: number;   // 월 26일 영업 기준
  dailyTransactionsNeeded?: number; // 객단가 있을 때만 계산

  estimatedBreakEvenMonth: number | null; // null = 예상 매출로 시뮬 기간 내 미달성
  totalMonthlyFixed: number;
  variableCostRate: number;
};

export type MonthlyProjection = {
  month: number;           // 1부터 시작
  revenue: number;         // 월 매출
  cogs: number;            // 원가 (변동비)
  rent: number;            // 월 임대료
  labor: number;           // 인건비
  otherFixed: number;      // 기타 고정비
  totalCosts: number;      // 총 비용
  netProfit: number;       // 순이익 (음수 = 적자)
  cumulativeCash: number;  // 누적 현금 (초기 운전자금 기준)
};

export type FinancialRiskLevel = "low" | "medium" | "high" | "critical";

// ─── 최종 시뮬레이션 결과 ────────────────────────────────────────────────────

export type FinancialSimulationResult = {
  input: FinancialSimulationInput;
  benchmark: FinancialBenchmark | null;
  resolvedCosts: ResolvedCosts;
  breakEven: BreakEvenAnalysis;
  projections: MonthlyProjection[];

  // 매출이 전혀 없다고 가정할 때 고정비만으로 버틸 수 있는 개월 수
  survivabilityMonths: number;

  // 초기 투자 후 남는 운전자금 범위
  capitalAfterSetup: {
    low: number;   // setup_cost_high 적용 후 잔여
    high: number;  // setup_cost_low 적용 후 잔여
  };

  riskLevel: FinancialRiskLevel;
  riskReasons: string[];

  // 벤치마크 기준 참고 범위 (UI 표시용)
  revenueRange: { low: number; high: number };
  setupCostRange: { low: number; high: number };
  rentRange: { low: number; high: number };
};
