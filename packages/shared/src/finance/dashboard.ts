// ─── 실시간 손익 대시보드 엔진 ───────────────────────────────────────────────
// user_store_data의 실제 매출/비용 데이터를 기반으로 경영 지표를 계산합니다.
// 시뮬레이션(simulation.ts)이 "예측"이라면, 이 모듈은 "실적"입니다.

// ─── 타입 ────────────────────────────────────────────────────────────────────

export type DailyEntry = {
  date: string;    // YYYY-MM-DD
  sales: number;
  customers: number;
};

export type MonthlyCosts = {
  ingredients: number;
  labor: number;
  rent: number;
  utilities: number;
  other: number;
};

export type DeliveryPlatformSales = {
  platformName: string;
  sales: number;
};

/** 실시간 P&L 요약 (월 단위) */
export type MonthlyPnL = {
  month: string;           // YYYY-MM
  totalRevenue: number;
  offlineRevenue: number;
  deliveryRevenue: number;
  totalCosts: number;
  costBreakdown: MonthlyCosts;
  grossProfit: number;     // 매출 - 재료비
  grossMargin: number;     // % (0~100)
  operatingProfit: number; // 매출 - 전체 비용
  operatingMargin: number; // % (0~100)
  netCashFlow: number;     // 영업이익 (= operatingProfit, 단순 모델)
};

/** 경영 건강 지표 */
export type BusinessHealthMetrics = {
  // 매출 지표
  avgDailySales: number;
  avgDailyCustomers: number;
  avgTicketSize: number;
  salesTrend: "growing" | "stable" | "declining";
  salesTrendPercent: number;   // 전월 대비 %

  // 비용 지표
  costToRevenueRatio: number;  // 총비용/매출 (0~100)
  laborCostRatio: number;      // 인건비/매출
  rentCostRatio: number;       // 임대료/매출
  primeCostRatio: number;      // (재료비+인건비)/매출 — 외식업 핵심 지표

  // 수익성 지표
  operatingMargin: number;
  breakEvenDailySales: number; // 일일 손익분기 매출
  daysAboveBreakEven: number;  // 이번 달 손익분기 초과일 수
  totalDaysRecorded: number;

  // 생존력 지표
  cashRunwayMonths: number;    // 현재 현금으로 버틸 수 있는 개월 수

  // 종합 등급
  healthGrade: "healthy" | "caution" | "warning" | "critical";
  healthScore: number;         // 0~100
  alerts: HealthAlert[];
};

export type HealthAlert = {
  type: "danger" | "warning" | "info";
  title: string;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
};

/** 매출 예측 (단순 이동평균 기반) */
export type SalesForecast = {
  nextWeekDaily: number;
  nextMonthTotal: number;
  confidence: "high" | "medium" | "low";
  basis: string;
};

// ─── 핵심 계산 함수 ─────────────────────────────────────────────────────────

/** 일별 매출 데이터에서 월별 P&L을 생성합니다 */
export function calculateMonthlyPnL(
  dailyEntries: DailyEntry[],
  monthlyCosts: MonthlyCosts,
  deliverySales?: Record<string, number>
): MonthlyPnL {
  const offlineRevenue = dailyEntries.reduce((sum, e) => sum + e.sales, 0);
  const deliveryRevenue = deliverySales
    ? Object.values(deliverySales).reduce((sum, s) => sum + s, 0)
    : 0;
  const totalRevenue = offlineRevenue + deliveryRevenue;

  const totalCosts =
    monthlyCosts.ingredients +
    monthlyCosts.labor +
    monthlyCosts.rent +
    monthlyCosts.utilities +
    monthlyCosts.other;

  const grossProfit = totalRevenue - monthlyCosts.ingredients;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const operatingProfit = totalRevenue - totalCosts;
  const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return {
    month,
    totalRevenue,
    offlineRevenue,
    deliveryRevenue,
    totalCosts,
    costBreakdown: monthlyCosts,
    grossProfit,
    grossMargin: Math.round(grossMargin * 10) / 10,
    operatingProfit,
    operatingMargin: Math.round(operatingMargin * 10) / 10,
    netCashFlow: operatingProfit,
  };
}

/** 경영 건강 지표를 계산합니다 */
export function calculateHealthMetrics(
  dailyEntries: DailyEntry[],
  monthlyCosts: MonthlyCosts,
  previousMonthRevenue?: number,
  currentCash?: number,
  deliverySales?: Record<string, number>
): BusinessHealthMetrics {
  const pnl = calculateMonthlyPnL(dailyEntries, monthlyCosts, deliverySales);
  const totalDaysRecorded = dailyEntries.length;

  // 매출 지표
  const avgDailySales = totalDaysRecorded > 0
    ? pnl.totalRevenue / totalDaysRecorded
    : 0;
  const totalCustomers = dailyEntries.reduce((sum, e) => sum + e.customers, 0);
  const avgDailyCustomers = totalDaysRecorded > 0
    ? Math.round(totalCustomers / totalDaysRecorded)
    : 0;
  const avgTicketSize = totalCustomers > 0
    ? Math.round(pnl.offlineRevenue / totalCustomers)
    : 0;

  // 매출 추세
  let salesTrend: "growing" | "stable" | "declining" = "stable";
  let salesTrendPercent = 0;
  if (previousMonthRevenue && previousMonthRevenue > 0) {
    salesTrendPercent = ((pnl.totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    salesTrendPercent = Math.round(salesTrendPercent * 10) / 10;
    if (salesTrendPercent > 5) salesTrend = "growing";
    else if (salesTrendPercent < -5) salesTrend = "declining";
  }

  // 비용 지표
  const costToRevenueRatio = pnl.totalRevenue > 0
    ? (pnl.totalCosts / pnl.totalRevenue) * 100
    : 100;
  const laborCostRatio = pnl.totalRevenue > 0
    ? (monthlyCosts.labor / pnl.totalRevenue) * 100
    : 0;
  const rentCostRatio = pnl.totalRevenue > 0
    ? (monthlyCosts.rent / pnl.totalRevenue) * 100
    : 0;
  const primeCostRatio = pnl.totalRevenue > 0
    ? ((monthlyCosts.ingredients + monthlyCosts.labor) / pnl.totalRevenue) * 100
    : 0;

  // 손익분기 일매출
  const dailyFixedCosts = (monthlyCosts.rent + monthlyCosts.labor + monthlyCosts.utilities + monthlyCosts.other) / 26;
  const cogsRate = pnl.totalRevenue > 0
    ? monthlyCosts.ingredients / pnl.totalRevenue
    : 0.33;
  const breakEvenDailySales = cogsRate < 1
    ? Math.round(dailyFixedCosts / (1 - cogsRate))
    : 0;

  // 손익분기 초과일 계산
  const daysAboveBreakEven = dailyEntries.filter(
    (e) => e.sales >= breakEvenDailySales
  ).length;

  // 현금 런웨이
  const monthlyBurn = pnl.totalCosts - pnl.totalRevenue;
  const cashRunwayMonths = monthlyBurn > 0 && currentCash
    ? Math.round((currentCash / monthlyBurn) * 10) / 10
    : currentCash && currentCash > 0 ? 99 : 0;

  // 경고 생성
  const alerts = generateAlerts({
    operatingMargin: pnl.operatingMargin,
    rentCostRatio,
    primeCostRatio,
    costToRevenueRatio,
    cashRunwayMonths,
    salesTrend,
    salesTrendPercent,
    daysAboveBreakEven,
    totalDaysRecorded,
  });

  // 종합 점수 (0~100)
  const healthScore = calculateHealthScore({
    operatingMargin: pnl.operatingMargin,
    costToRevenueRatio,
    primeCostRatio,
    cashRunwayMonths,
    salesTrend,
    daysAboveBreakEven,
    totalDaysRecorded,
  });

  const healthGrade: BusinessHealthMetrics["healthGrade"] =
    healthScore >= 75 ? "healthy"
    : healthScore >= 50 ? "caution"
    : healthScore >= 25 ? "warning"
    : "critical";

  return {
    avgDailySales: Math.round(avgDailySales),
    avgDailyCustomers,
    avgTicketSize,
    salesTrend,
    salesTrendPercent,
    costToRevenueRatio: Math.round(costToRevenueRatio * 10) / 10,
    laborCostRatio: Math.round(laborCostRatio * 10) / 10,
    rentCostRatio: Math.round(rentCostRatio * 10) / 10,
    primeCostRatio: Math.round(primeCostRatio * 10) / 10,
    operatingMargin: pnl.operatingMargin,
    breakEvenDailySales,
    daysAboveBreakEven,
    totalDaysRecorded,
    cashRunwayMonths,
    healthGrade,
    healthScore,
    alerts,
  };
}

// ─── 매출 예측 (7일/14일 이동평균) ──────────────────────────────────────────

export function forecastSales(dailyEntries: DailyEntry[]): SalesForecast {
  if (dailyEntries.length < 7) {
    return {
      nextWeekDaily: 0,
      nextMonthTotal: 0,
      confidence: "low",
      basis: "데이터 부족 (최소 7일 필요)",
    };
  }

  const sorted = [...dailyEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 최근 7일 평균
  const last7 = sorted.slice(0, 7);
  const avg7 = last7.reduce((sum, e) => sum + e.sales, 0) / 7;

  // 최근 14일 평균 (있으면)
  const last14 = sorted.slice(0, Math.min(14, sorted.length));
  const avg14 = last14.reduce((sum, e) => sum + e.sales, 0) / last14.length;

  // 가중 평균 (최근 데이터에 더 높은 가중치)
  const weightedAvg = avg7 * 0.7 + avg14 * 0.3;
  const nextWeekDaily = Math.round(weightedAvg);
  const nextMonthTotal = Math.round(weightedAvg * 26); // 월 26일 영업

  const confidence: SalesForecast["confidence"] =
    dailyEntries.length >= 30 ? "high"
    : dailyEntries.length >= 14 ? "medium"
    : "low";

  return {
    nextWeekDaily,
    nextMonthTotal,
    confidence,
    basis: `최근 ${Math.min(dailyEntries.length, 14)}일 매출 기반 가중 이동평균`,
  };
}

// ─── 내부 유틸 ──────────────────────────────────────────────────────────────

type AlertInput = {
  operatingMargin: number;
  rentCostRatio: number;
  primeCostRatio: number;
  costToRevenueRatio: number;
  cashRunwayMonths: number;
  salesTrend: string;
  salesTrendPercent: number;
  daysAboveBreakEven: number;
  totalDaysRecorded: number;
};

function generateAlerts(input: AlertInput): HealthAlert[] {
  const alerts: HealthAlert[] = [];

  if (input.operatingMargin < -20) {
    alerts.push({
      type: "danger",
      title: "심각한 영업 적자",
      message: `영업이익률이 ${input.operatingMargin.toFixed(1)}%입니다. 비용 구조를 즉시 재검토하세요.`,
      metric: "영업이익률",
      value: input.operatingMargin,
      threshold: 0,
    });
  } else if (input.operatingMargin < 0) {
    alerts.push({
      type: "warning",
      title: "영업 적자 상태",
      message: `매출 대비 비용이 초과하고 있습니다. 비용 절감 또는 매출 증대 방안을 검토하세요.`,
      metric: "영업이익률",
      value: input.operatingMargin,
      threshold: 0,
    });
  }

  if (input.rentCostRatio > 30) {
    alerts.push({
      type: "danger",
      title: "임대료 비중 과다",
      message: `임대료가 매출의 ${input.rentCostRatio.toFixed(1)}%를 차지합니다. 일반적으로 10~15%가 적정입니다.`,
      metric: "임대료 비율",
      value: input.rentCostRatio,
      threshold: 30,
    });
  } else if (input.rentCostRatio > 20) {
    alerts.push({
      type: "warning",
      title: "임대료 비중 주의",
      message: `임대료가 매출의 ${input.rentCostRatio.toFixed(1)}%입니다. 매출 증대로 비율을 낮추세요.`,
      metric: "임대료 비율",
      value: input.rentCostRatio,
      threshold: 20,
    });
  }

  // 외식업 핵심 지표: 프라임 코스트 (재료비+인건비)
  if (input.primeCostRatio > 70) {
    alerts.push({
      type: "danger",
      title: "프라임 코스트 초과",
      message: `재료비+인건비가 매출의 ${input.primeCostRatio.toFixed(1)}%입니다. 외식업 기준 65% 이하가 건강합니다.`,
      metric: "프라임 코스트",
      value: input.primeCostRatio,
      threshold: 65,
    });
  }

  if (input.cashRunwayMonths < 3 && input.cashRunwayMonths > 0) {
    alerts.push({
      type: "danger",
      title: "현금 소진 임박",
      message: `현재 속도로 약 ${input.cashRunwayMonths.toFixed(1)}개월 후 현금이 소진됩니다.`,
      metric: "현금 런웨이",
      value: input.cashRunwayMonths,
      threshold: 3,
    });
  }

  if (input.salesTrend === "declining" && input.salesTrendPercent < -15) {
    alerts.push({
      type: "danger",
      title: "급격한 매출 감소",
      message: `전월 대비 매출이 ${Math.abs(input.salesTrendPercent).toFixed(1)}% 감소했습니다.`,
      metric: "매출 추세",
      value: input.salesTrendPercent,
      threshold: -15,
    });
  } else if (input.salesTrend === "declining") {
    alerts.push({
      type: "warning",
      title: "매출 하락 추세",
      message: `전월 대비 매출이 감소하고 있습니다. 원인 분석이 필요합니다.`,
      metric: "매출 추세",
      value: input.salesTrendPercent,
    });
  }

  if (input.totalDaysRecorded >= 7) {
    const breakEvenRatio = input.daysAboveBreakEven / input.totalDaysRecorded;
    if (breakEvenRatio < 0.3) {
      alerts.push({
        type: "warning",
        title: "손익분기 미달 빈도 높음",
        message: `기록된 ${input.totalDaysRecorded}일 중 ${input.daysAboveBreakEven}일만 손익분기를 넘겼습니다.`,
        metric: "손익분기 달성률",
        value: Math.round(breakEvenRatio * 100),
        threshold: 50,
      });
    }
  }

  if (input.salesTrend === "growing" && input.salesTrendPercent > 10) {
    alerts.push({
      type: "info",
      title: "매출 성장 중",
      message: `전월 대비 ${input.salesTrendPercent.toFixed(1)}% 성장하고 있습니다. 좋은 추세입니다!`,
      metric: "매출 추세",
      value: input.salesTrendPercent,
    });
  }

  return alerts;
}

type ScoreInput = {
  operatingMargin: number;
  costToRevenueRatio: number;
  primeCostRatio: number;
  cashRunwayMonths: number;
  salesTrend: string;
  daysAboveBreakEven: number;
  totalDaysRecorded: number;
};

function calculateHealthScore(input: ScoreInput): number {
  let score = 50; // 기본 점수

  // 영업이익률 (최대 ±25점)
  if (input.operatingMargin >= 15) score += 25;
  else if (input.operatingMargin >= 5) score += 15;
  else if (input.operatingMargin >= 0) score += 5;
  else if (input.operatingMargin >= -10) score -= 10;
  else score -= 25;

  // 프라임 코스트 (최대 ±15점)
  if (input.primeCostRatio <= 60) score += 15;
  else if (input.primeCostRatio <= 65) score += 10;
  else if (input.primeCostRatio <= 70) score += 0;
  else score -= 15;

  // 현금 런웨이 (최대 ±15점)
  if (input.cashRunwayMonths >= 6) score += 15;
  else if (input.cashRunwayMonths >= 3) score += 5;
  else if (input.cashRunwayMonths > 0) score -= 15;

  // 매출 추세 (최대 ±10점)
  if (input.salesTrend === "growing") score += 10;
  else if (input.salesTrend === "declining") score -= 10;

  // 손익분기 달성률 (최대 ±10점)
  if (input.totalDaysRecorded >= 7) {
    const ratio = input.daysAboveBreakEven / input.totalDaysRecorded;
    if (ratio >= 0.7) score += 10;
    else if (ratio >= 0.5) score += 5;
    else score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}
