// ─── 채용 비용 계산기 (2026 한국) ────────────────────────────────────────
// 연봉/시급 → 실제 사업주 부담 비용 (4대보험 + 퇴직금 + 원천세)

// ── 2026 4대보험 요율 ──
export const INSURANCE_RATES_2026 = {
  nationalPension: { employer: 0.045, employee: 0.045 },       // 국민연금 9% (50:50)
  healthInsurance: { employer: 0.03545, employee: 0.03545 },   // 건강보험 7.09% (50:50)
  longTermCare: { rateOfHealth: 0.1281 },                      // 장기요양 = 건강보험의 12.81%
  employmentInsurance: { employer: 0.009, employee: 0.009 },   // 고용보험 1.8% (50:50 기본)
  industrialAccident: { employer: 0.007 },                     // 산재보험 ~0.7% (업종별 상이)
} as const;

export const MINIMUM_WAGE_2026 = 10_030; // 시급 (원)
export const MONTHLY_WORK_HOURS = 209;    // 주 40시간 기준 월 소정근로시간
export const SEVERANCE_RESERVE_RATE = 1 / 12; // 월별 퇴직금 적립 비율

// ── 타입 ──
export type HiringCostInput = {
  /** 월 기본급 (원) */
  monthlySalary: number;
  /** 주당 근무시간 */
  weeklyHours?: number;
  /** 계약 유형 */
  contractType?: "fulltime" | "parttime" | "daily";
  /** 주휴수당 포함 여부 (주 15시간 이상 시 의무) */
  includeWeeklyHoliday?: boolean;
};

export type HiringCostBreakdown = {
  // 급여
  baseSalary: number;
  weeklyHolidayPay: number;
  totalGross: number;

  // 4대보험 사업주 부담
  pension: number;
  health: number;
  longTermCare: number;
  employment: number;
  accident: number;
  totalInsuranceEmployer: number;

  // 4대보험 근로자 부담 (참고용)
  totalInsuranceEmployee: number;

  // 원천세 (간이세액)
  incomeTaxWithholding: number;
  localTaxWithholding: number;

  // 퇴직금 적립
  severanceMonthly: number;

  // 최종
  netPayToEmployee: number;
  totalEmployerCostMonthly: number;
  totalEmployerCostAnnual: number;

  // 비율
  insuranceRatio: number;  // 사업주 보험 부담 / 기본급 %
  totalOverheadRatio: number; // (총 사업주 비용 - 기본급) / 기본급 %
};

/** 채용 비용 상세 계산 */
export function calculateHiringCost(input: HiringCostInput): HiringCostBreakdown {
  const {
    monthlySalary,
    weeklyHours = 40,
    includeWeeklyHoliday = weeklyHours >= 15,
  } = input;

  const rates = INSURANCE_RATES_2026;

  // 주휴수당: 주 15시간 이상 근무 시 유급 휴일 수당
  const weeklyHolidayPay = includeWeeklyHoliday
    ? Math.round(monthlySalary * (8 / 40)) // 1일 8시간 기준
    : 0;
  const totalGross = monthlySalary + weeklyHolidayPay;

  // 4대보험 사업주 부담
  const pension = Math.round(totalGross * rates.nationalPension.employer);
  const health = Math.round(totalGross * rates.healthInsurance.employer);
  const longTermCare = Math.round(health * rates.longTermCare.rateOfHealth);
  const employment = Math.round(totalGross * rates.employmentInsurance.employer);
  const accident = Math.round(totalGross * rates.industrialAccident.employer);
  const totalInsuranceEmployer = pension + health + longTermCare + employment + accident;

  // 4대보험 근로자 부담
  const empPension = Math.round(totalGross * rates.nationalPension.employee);
  const empHealth = Math.round(totalGross * rates.healthInsurance.employee);
  const empLongTerm = Math.round(empHealth * rates.longTermCare.rateOfHealth);
  const empEmployment = Math.round(totalGross * rates.employmentInsurance.employee);
  const totalInsuranceEmployee = empPension + empHealth + empLongTerm + empEmployment;

  // 원천세 (간이세액표 근사 — 실제는 부양가족 수에 따라 다름)
  const taxableMonthly = totalGross - totalInsuranceEmployee;
  const incomeTaxWithholding = Math.round(Math.max(0, taxableMonthly * 0.03)); // ~3% 근사
  const localTaxWithholding = Math.round(incomeTaxWithholding * 0.1); // 지방세 10%

  // 퇴직금 월 적립 (1년 이상 근무 시 의무)
  const severanceMonthly = Math.round(totalGross * SEVERANCE_RESERVE_RATE);

  // 근로자 실수령
  const netPayToEmployee = totalGross - totalInsuranceEmployee - incomeTaxWithholding - localTaxWithholding;

  // 사업주 총 비용
  const totalEmployerCostMonthly = totalGross + totalInsuranceEmployer + severanceMonthly;
  const totalEmployerCostAnnual = totalEmployerCostMonthly * 12;

  // 비율
  const insuranceRatio = monthlySalary > 0 ? (totalInsuranceEmployer / monthlySalary) * 100 : 0;
  const totalOverheadRatio = monthlySalary > 0 ? ((totalEmployerCostMonthly - monthlySalary) / monthlySalary) * 100 : 0;

  return {
    baseSalary: monthlySalary,
    weeklyHolidayPay,
    totalGross,
    pension, health, longTermCare, employment, accident,
    totalInsuranceEmployer, totalInsuranceEmployee,
    incomeTaxWithholding, localTaxWithholding,
    severanceMonthly,
    netPayToEmployee,
    totalEmployerCostMonthly, totalEmployerCostAnnual,
    insuranceRatio, totalOverheadRatio,
  };
}

/** 연봉 → 월급 변환 */
export function annualToMonthly(annual: number): number {
  return Math.round(annual / 12);
}

/** 시급 → 월급 변환 (주 40시간 기준) */
export function hourlyToMonthly(hourly: number, weeklyHours = 40): number {
  return Math.round(hourly * weeklyHours * (365.25 / 7 / 12));
}

/** 최저임금 준수 여부 확인 */
export function checkMinimumWage(monthlySalary: number, weeklyHours = 40): {
  compliant: boolean;
  minimumMonthly: number;
  shortfall: number;
} {
  const minimumMonthly = hourlyToMonthly(MINIMUM_WAGE_2026, weeklyHours);
  return {
    compliant: monthlySalary >= minimumMonthly,
    minimumMonthly,
    shortfall: Math.max(0, minimumMonthly - monthlySalary),
  };
}

// ─── 팀 단위 월 인건비 집계 (FinancialReviewStage용) ─────────────────────

export type StaffPlan = {
  /** 정직원 수 */
  fullTimeCount?: number;
  /** 알바·파트타임 수 */
  partTimeCount?: number;
  /** 정직원 월 기본급 (없으면 최저시급 × 주 40시간 자동 계산) */
  fullTimeMonthlyBase?: number;
  /** 알바 시급 (없으면 최저시급) */
  partTimeHourlyWage?: number;
  /** 알바 주 평균 근무시간 (기본 20) */
  partTimeHoursPerWeek?: number;
};

/** 업종별 기본 인력 계획 (오픈 시점 권장값) */
export function getDefaultStaffPlan(categoryId: string): StaffPlan {
  const defaults: Record<string, StaffPlan> = {
    food:              { fullTimeCount: 1, partTimeCount: 2, partTimeHoursPerWeek: 25 },
    "cafe-dessert":    { fullTimeCount: 1, partTimeCount: 1, partTimeHoursPerWeek: 25 },
    retail:            { fullTimeCount: 0, partTimeCount: 1, partTimeHoursPerWeek: 30 },
    beauty:            { fullTimeCount: 1, partTimeCount: 1, partTimeHoursPerWeek: 20 },
    pet:               { fullTimeCount: 0, partTimeCount: 1, partTimeHoursPerWeek: 25 },
    fitness:           { fullTimeCount: 1, partTimeCount: 0 },
    education:         { fullTimeCount: 1, partTimeCount: 1, partTimeHoursPerWeek: 15 },
    space:             { fullTimeCount: 0, partTimeCount: 1, partTimeHoursPerWeek: 20 },
    "online-digital":  { fullTimeCount: 1, partTimeCount: 0 },
    "startup-tech":    { fullTimeCount: 1, partTimeCount: 0 },
    "living-service":  { fullTimeCount: 1, partTimeCount: 0 },
  };
  return defaults[categoryId] ?? defaults.food;
}

/**
 * 팀 단위 월 인건비 (사업주 총 부담 = 기본급 + 주휴 + 4대보험 + 퇴직 적립).
 * 정직원·알바 섞인 팀을 한 번에 계산해 monthlyCosts.labor 필드에 바로 투입 가능.
 */
export function calculateMonthlyTeamLaborCost(plan: StaffPlan): {
  fullTimeCost: number;
  partTimeCost: number;
  total: number;
} {
  const fullTimeCount = Math.max(0, plan.fullTimeCount ?? 0);
  const partTimeCount = Math.max(0, plan.partTimeCount ?? 0);

  const fullTimeBase = plan.fullTimeMonthlyBase ?? hourlyToMonthly(MINIMUM_WAGE_2026, 40);
  const fullTimeSingle = calculateHiringCost({ monthlySalary: fullTimeBase, weeklyHours: 40 });
  const fullTimeCost = fullTimeCount * fullTimeSingle.totalEmployerCostMonthly;

  const partTimeHourly = plan.partTimeHourlyWage ?? MINIMUM_WAGE_2026;
  const partTimeHours = plan.partTimeHoursPerWeek ?? 20;
  const partTimeMonthly = hourlyToMonthly(partTimeHourly, partTimeHours);
  const partTimeSingle = calculateHiringCost({ monthlySalary: partTimeMonthly, weeklyHours: partTimeHours });
  const partTimeCost = partTimeCount * partTimeSingle.totalEmployerCostMonthly;

  return {
    fullTimeCost,
    partTimeCost,
    total: fullTimeCost + partTimeCost,
  };
}
