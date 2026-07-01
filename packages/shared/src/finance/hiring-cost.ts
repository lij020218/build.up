// ─── 채용 비용 계산기 (2026 한국) ────────────────────────────────────────
// 연봉/시급 → 실제 사업주 부담 비용 (4대보험 + 퇴직금 + 원천세)
import { LEGAL } from "../constants/benchmarks"; // SSOT: 최저시급 등 법정 수치

// ── 2026 4대보험 요율 ── (출처: 국민연금공단·국민건강보험공단·근로복지공단)
//   ⚠ 매년 1월 갱신. 2026 인상사항:
//      국민연금 9% → 9.5% (1998년 이후 첫 인상, 2033년까지 매년 0.5%p 인상 예정)
//      건강보험 7.09% → 7.19%
//      장기요양 0.9182% → 0.9448%
export const INSURANCE_RATES_2026 = {
  nationalPension: { employer: 0.0475, employee: 0.0475 },     // 국민연금 9.5% (50:50, 2026 인상)
  healthInsurance: { employer: 0.03595, employee: 0.03595 },   // 건강보험 7.19% (50:50, 2026 인상)
  longTermCare: { rateOfHealth: 0.1314 },                      // 장기요양 = 건강보험의 13.14% (0.9448 / 7.19)
  employmentInsurance: { employer: 0.009, employee: 0.009 },   // 고용보험 실업급여 1.8% (50:50)
  // 고용안정·직업능력개발사업 — 사업주 전액 부담. 150인 미만 0.25% (2022.7~ 동결). 의무.
  employmentStability: { employer: 0.0025 },
  industrialAccident: { employer: 0.007 },                     // 산재보험 ~0.7% (업종별 상이, 일반 서비스업 가정)
} as const;

export const MINIMUM_WAGE_2026 = LEGAL.MINIMUM_WAGE_HOURLY; // SSOT: constants/benchmarks LEGAL.MINIMUM_WAGE_HOURLY (드리프트 방지)
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

  // 주휴수당: 주 15시간 이상 근무 시 유급 휴일 수당. 소정근로시간 비례(근기법 §55).
  //   주휴시간 = 주 소정근로시간 ÷ 5 이므로 월급 대비 항상 1/5(= 8/40, 주 40h 이하).
  //   monthlySalary 가 이미 실근로시간 기준이라 비례 결과와 동일 — 무조건 8시간분(고정)이 아님.
  const weeklyHolidayPay = includeWeeklyHoliday
    ? Math.round(monthlySalary * (8 / 40)) // = ×1/5 (주휴 비례). 주 40h 초과는 8h 상한 별도 처리 필요
    : 0;
  const totalGross = monthlySalary + weeklyHolidayPay;

  // 4대보험 사업주 부담
  const pension = Math.round(totalGross * rates.nationalPension.employer);
  const health = Math.round(totalGross * rates.healthInsurance.employer);
  const longTermCare = Math.round(health * rates.longTermCare.rateOfHealth);
  // 고용보험 사업주분 = 실업급여 0.9% + 고용안정·직업능력개발 0.25% = 1.15%
  const employment = Math.round(totalGross * (rates.employmentInsurance.employer + rates.employmentStability.employer));
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

// ─── 두루누리 사회보험 + 단시간 분기 (시뮬레이터 강화) ──────────────────
//
// 출처: 두루누리(4insure.or.kr 신청) — 270만원 미만 + 10인 미만 사업장의
//       신규 가입자 36개월간 국민연금·고용보험 80% 지원.
//
// 단시간(주 15h 미만): 국민연금·건강보험 면제, 고용·산재만 가입.

export const DURUNURI_2026 = {
  /** 월급 상한 (원) */
  monthlySalaryThreshold: 2_700_000,
  /** 사업장 직원 수 상한 */
  maxEmployees: 10,
  /** 지원 비율 (사업주·근로자 부담분 모두) */
  subsidyPct: 80,
  /** 지원 항목 */
  appliesTo: ["pension", "employment"] as const,
  /** 지원 기간 */
  durationMonths: 36,
} as const;

/** 사업주 4대보험 총 부담률(%) — 2026 기준
 *  국민연금 4.75 + 건보 3.595 + 장기요양 0.4724 + 고용보험(실업급여 0.9 + 고용안정·직업능력개발 0.25) + 산재 0.7(일반서비스업) */
export const TOTAL_EMPLOYER_RATE_PCT = 4.75 + 3.595 + 0.4724 + (0.9 + 0.25) + 0.7;
/** 근로자 4대보험 총 공제율(%) — 2026 기준 */
export const TOTAL_EMPLOYEE_RATE_PCT = 4.75 + 3.595 + 0.4724 + 0.9;

export type InsuranceSimInput = {
  /** 월 급여 (원) — 세전 */
  monthlySalary: number;
  /** 주 근무시간 */
  weeklyHours?: number;
  /** 사업장 총 직원 수 (시뮬 직원 포함) — 두루누리 자격 판단용 */
  totalEmployeeCount?: number;
  /** 두루누리 신청 의향 + 가입 36개월 이내 신규 여부 */
  isDuruduriEligible?: boolean;
};

export type InsuranceSimResult = {
  employer: {
    pension: number;
    health: number;
    longTermCare: number;
    employment: number;
    workers: number;
    total: number;
    /** 두루누리 적용 후 */
    afterDuruduri: number;
  };
  employee: {
    pension: number;
    health: number;
    longTermCare: number;
    employment: number;
    total: number;
    afterDuruduri: number;
  };
  /** 사장님 실 월부담 = 급여 + 사업주 보험료 (두루누리 적용 후) */
  totalMonthlyCostToEmployer: number;
  duruduriEligible: boolean;
  duruduriMonthlySaving: number;
  warnings: string[];
};

/**
 * 4대보험 시뮬레이션 (두루누리 + 단시간 분기 포함).
 *
 * 기존 calculateHiringCost 와 달리 더 가벼운 결과 + 두루누리 80% 지원 자동 분기.
 * 채용 결정 시 즉답 UI 용.
 */
export function simulateInsurance(input: InsuranceSimInput): InsuranceSimResult {
  const salary = Math.max(0, Math.round(input.monthlySalary));
  const weeklyHours = input.weeklyHours ?? 40;
  const totalEmployeeCount = input.totalEmployeeCount ?? 1;
  const r = INSURANCE_RATES_2026;
  const warnings: string[] = [];

  const isShortTime = weeklyHours < 15;
  if (isShortTime) {
    warnings.push("주 15시간 미만 근로자 — 국민연금·건강보험 면제, 고용·산재만 가입");
  }

  // 사업주 부담
  const empPension = isShortTime ? 0 : Math.round(salary * r.nationalPension.employer);
  const empHealth = isShortTime ? 0 : Math.round(salary * r.healthInsurance.employer);
  const empLtc = isShortTime ? 0 : Math.round(empHealth * r.longTermCare.rateOfHealth);
  // 고용보험 사업주분 = 실업급여(0.9%, 두루누리 대상) + 고용안정·직업능력개발(0.25%, 사업주 전액·비대상)
  const empUnemployment = Math.round(salary * r.employmentInsurance.employer);
  const empStability = Math.round(salary * r.employmentStability.employer);
  const empEmployment = empUnemployment + empStability;
  const empWorkers = Math.round(salary * r.industrialAccident.employer);
  const empTotal = empPension + empHealth + empLtc + empEmployment + empWorkers;

  // 근로자 부담
  const eePension = isShortTime ? 0 : Math.round(salary * r.nationalPension.employee);
  const eeHealth = isShortTime ? 0 : Math.round(salary * r.healthInsurance.employee);
  const eeLtc = isShortTime ? 0 : Math.round(eeHealth * r.longTermCare.rateOfHealth);
  const eeEmployment = Math.round(salary * r.employmentInsurance.employee);
  const eeTotal = eePension + eeHealth + eeLtc + eeEmployment;

  const duruduriEligible =
    salary < DURUNURI_2026.monthlySalaryThreshold &&
    totalEmployeeCount < DURUNURI_2026.maxEmployees &&
    !!input.isDuruduriEligible;

  // 두루누리는 국민연금 + 고용보험 실업급여분만 지원 (고용안정·직업능력개발분은 비대상)
  const employerSaving = duruduriEligible
    ? Math.round((empPension + empUnemployment) * (DURUNURI_2026.subsidyPct / 100))
    : 0;
  const employeeSaving = duruduriEligible
    ? Math.round((eePension + eeEmployment) * (DURUNURI_2026.subsidyPct / 100))
    : 0;

  if (duruduriEligible) {
    warnings.push("두루누리 80% 지원 자격 — 가입 36개월간 국민연금·고용보험 부담 대폭 감소");
  } else if (
    salary < DURUNURI_2026.monthlySalaryThreshold &&
    totalEmployeeCount < DURUNURI_2026.maxEmployees
  ) {
    warnings.push("두루누리 자격 가능 — 신규 가입자(가입 36개월 이내)면 80% 지원 신청 가능");
  }

  return {
    employer: {
      pension: empPension,
      health: empHealth,
      longTermCare: empLtc,
      employment: empEmployment,
      workers: empWorkers,
      total: empTotal,
      afterDuruduri: empTotal - employerSaving,
    },
    employee: {
      pension: eePension,
      health: eeHealth,
      longTermCare: eeLtc,
      employment: eeEmployment,
      total: eeTotal,
      afterDuruduri: eeTotal - employeeSaving,
    },
    totalMonthlyCostToEmployer: salary + empTotal - employerSaving,
    duruduriEligible,
    duruduriMonthlySaving: employerSaving + employeeSaving,
    warnings,
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
