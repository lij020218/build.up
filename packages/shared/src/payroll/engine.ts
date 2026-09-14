/**
 * engine.ts — 근태 기반 급여 계산 (2026).
 *
 * 왜 만들었나: 종전 계산(hiring-cost.ts)은 "채용 비용 견적"이었다. 실제 급여를 주려면
 *  ① 이번 달 실제로 몇 시간 일했는지, ② 주휴 요건을 채운 주가 몇 주인지,
 *  ③ 연장·야간·휴일이 몇 시간인지를 알아야 한다. 임금체불 신고의 대부분이 이 세 가지 누락이다.
 *
 * 정확도 구분 (화면에도 이대로 표시할 것):
 *  · 지급항목(기본급·주휴·연장·야간·휴일) — **법이 정한 계산식 그대로**. 확정값.
 *  · 4대보험 — 고시 요율 그대로. 확정값. (단 산재요율은 사업장마다 다름 → 입력받는다)
 *  · 소득세·지방소득세 — **추정**. 법적 기준은 국세청 간이세액표다.
 *
 * 근거: 근로기준법 §55(주휴)·§56(가산)·§48②(임금명세서), 소득세법 §47·§50·§55.
 */

import {
  INSURANCE_RATES,
  INDUSTRIAL_ACCIDENT,
  PENSION_INCOME_BOUNDS,
  DURUNURI,
  PAYROLL_MINIMUM_WAGE,
  MONTHLY_STANDARD_HOURS,
  LEGAL_WEEKLY_HOURS,
  WEEKLY_HOLIDAY_MAX_HOURS,
  SHORT_TIME_WEEKLY_HOURS,
  PREMIUM_PAY_MIN_HEADCOUNT,
  PREMIUM_RATES,
  WEEKS_PER_MONTH,
  TAX_FREE_MEAL_ALLOWANCE_MAX,
  EARNED_INCOME_DEDUCTION_BRACKETS,
  EARNED_INCOME_DEDUCTION_CAP,
  BASIC_DEDUCTION_PER_PERSON,
  INCOME_TAX_BRACKETS,
  LOCAL_INCOME_TAX_RATE,
  RATES_REVIEW_BY,
  SEVERANCE_MIN_DAYS,
} from "./rates-2026";

// ── 입력 ────────────────────────────────────────────────────────────────

/** 한 주의 근태 — 주휴수당은 **주 단위**로 판정한다(개근 요건). */
export type WeekAttendance = {
  /** 그 주 월요일 (YYYY-MM-DD) — 표시·정렬용. */
  weekStart: string;
  /** 그 주 소정근로시간 (근무표 기준). */
  scheduledHours: number;
  /** 소정근로일 중 결근한 날 수. 지각·조퇴는 결근이 아니다. */
  absentDays: number;
  /** 이 달에 속한 비율 (0~1) — 월 경계에 걸친 주를 나눠 담는다. */
  monthShare?: number;
};

export type PayrollInput = {
  /** 대상 월 (YYYY-MM) — 표시·기록용. */
  period: string;

  // ── 사업장 ──
  /** 상시 근로자 수. 5인 미만이면 가산수당 의무가 없다(근기법 §11). */
  headcount: number;
  /** 산재보험료율. 사업장 고지서 값이 정답. 모르면 생략 → 기본값 + 경고. */
  industrialAccidentRate?: number;

  // ── 근로자 ──
  /** 시급 (원). 시급제면 필수. */
  hourlyWage?: number;
  /** 월 기본급 (원). 월급제면 필수. */
  monthlyBaseSalary?: number;
  /** 주 소정근로시간 (계약 기준). */
  contractedWeeklyHours: number;
  /** 만 나이 — 65세 이후 신규 고용은 실업급여 적용 제외. */
  age?: number;
  /** 이 사업장 입사 시점에 이미 65세였는지 (실업급여 적용 제외 판정). */
  hiredAfter65?: boolean;
  /** 4대보험 가입 여부 — 미가입이면 공제하지 않되 경고한다. */
  insuranceEnrolled?: boolean;
  /** 두루누리 지원 대상(신규 가입 36개월 이내). */
  duruduriEligible?: boolean;

  // ── 이번 달 근태 ──
  /** 주 단위 근태 — 주휴 판정용. 비어 있으면 계약 시간으로 추정한다. */
  weeks?: WeekAttendance[];
  /** 실제 근로시간 합계. 시급제 기본급의 근거. 없으면 계약 시간 × 주수. */
  actualWorkedHours?: number;
  /** 승인된 연장근로 시간. */
  overtimeHours?: number;
  /** 승인된 야간근로 시간 (22:00~06:00). */
  nightHours?: number;
  /** 승인된 휴일근로 시간. */
  holidayHours?: number;

  // ── 세금 ──
  /** 공제대상 가족 수 (본인 포함). 기본 1. */
  dependents?: number;
  /** 8세 이상 20세 이하 자녀 수 — 간이세액표에서 차감. */
  childrenAged8to20?: number;
  /** 비과세 식대 등 (월). 한도 20만원까지만 인정. */
  taxFreeAllowance?: number;
  /** 원천징수 비율 선택 (0.8 / 1.0 / 1.2). 기본 1.0. */
  withholdingRatio?: number;
  /** 계속근로일수 — 퇴직급여 의무 판정(1년). 모르면 생략. */
  tenureDays?: number;
};

// ── 출력 ────────────────────────────────────────────────────────────────

export type PayItem = {
  /** 명세서에 그대로 찍히는 이름. */
  label: string;
  amount: number;
  /** 근기법 §48② 필수 — "출근일수·시간에 따라 달라지는 항목"은 계산방법을 적어야 한다. */
  method?: string;
  /** 연장·야간·휴일은 **시간 수**도 필수 기재. */
  hours?: number;
};

export type PayrollResult = {
  period: string;
  /** 통상시급 — 모든 가산수당의 기준. */
  ordinaryHourlyWage: number;
  /** 지급 항목. */
  earnings: PayItem[];
  /** 지급 총액 (세전). */
  grossPay: number;
  /** 비과세 금액 (과세 대상에서 제외). */
  taxFreeAmount: number;
  /** 공제 항목 (근로자 부담). */
  deductions: PayItem[];
  deductionTotal: number;
  /** 실지급액. */
  netPay: number;
  /** 사업주가 따로 내는 몫 (급여에 더해 나가는 돈). */
  employerBurden: PayItem[];
  employerBurdenTotal: number;
  /** 급여 + 사업주 부담 = 이 직원의 월 총비용. */
  totalEmployerCost: number;
  /** 퇴직급여 월 적립 권장액 (지급액 아님 — 적립). */
  severanceReserve: number;
  /** 사장님이 반드시 봐야 할 경고. 비었으면 문제 없음. */
  warnings: PayrollWarning[];
  /** 값의 신뢰도 — 화면에서 그대로 구분해 보여준다. */
  confidence: {
    /** 법정 계산식 그대로인 항목. */
    exact: string[];
    /** 추정인 항목과 그 이유. */
    estimated: { item: string; why: string }[];
  };
};

export type PayrollWarning = {
  level: "violation" | "check";
  /** 사장님이 읽을 한 줄. */
  message: string;
  /** 근거 법조문. */
  law?: string;
};

// ── 유틸 ────────────────────────────────────────────────────────────────

const won = (v: number) => Math.round(v);

/** 주 소정근로시간 → 그 주의 주휴 시간. (소정/40)×8, 최대 8시간. */
export function weeklyHolidayHours(scheduledWeeklyHours: number): number {
  if (scheduledWeeklyHours < SHORT_TIME_WEEKLY_HOURS) return 0;
  return Math.min(
    (scheduledWeeklyHours / LEGAL_WEEKLY_HOURS) * WEEKLY_HOLIDAY_MAX_HOURS,
    WEEKLY_HOLIDAY_MAX_HOURS,
  );
}

/**
 * 통상시급.
 *  · 시급제 — 시급 그 자체.
 *  · 월급제 — 월 기본급 ÷ 월 통상임금 산정 기준시간.
 *    기준시간 = (주 소정 + 주휴) × 4.345. 주 40시간이면 209시간.
 */
export function ordinaryHourlyWage(input: Pick<PayrollInput, "hourlyWage" | "monthlyBaseSalary" | "contractedWeeklyHours">): number {
  if (input.hourlyWage && input.hourlyWage > 0) return input.hourlyWage;
  const base = input.monthlyBaseSalary ?? 0;
  if (base <= 0) return 0;
  const weekly = input.contractedWeeklyHours || LEGAL_WEEKLY_HOURS;
  const paidWeeklyHours = weekly + weeklyHolidayHours(weekly);
  const monthlyHours = weekly >= LEGAL_WEEKLY_HOURS
    ? MONTHLY_STANDARD_HOURS            // 주 40시간 = 209시간 (관행·판례 기준)
    : paidWeeklyHours * WEEKS_PER_MONTH;
  return monthlyHours > 0 ? won(base / monthlyHours) : 0;
}

// ── 소득세 추정 ─────────────────────────────────────────────────────────

function earnedIncomeDeduction(annualGross: number): number {
  let prevCap = 0;
  for (const b of EARNED_INCOME_DEDUCTION_BRACKETS) {
    if (annualGross <= b.upTo) {
      return Math.min(b.base + (annualGross - prevCap) * b.rate, EARNED_INCOME_DEDUCTION_CAP);
    }
    prevCap = b.upTo;
  }
  return EARNED_INCOME_DEDUCTION_CAP;
}

/**
 * 간이세액표의 "특별소득공제·특별세액공제 중 일부" 간주액.
 * 소득세법 시행령 별표2 비고의 구간식을 옮긴 것.
 */
function deemedSpecialDeduction(annualGross: number, dependents: number): number {
  const n = Math.max(1, dependents);
  const tier = n === 1 ? 1 : n === 2 ? 2 : 3;
  let amount: number;
  if (annualGross <= 30_000_000) {
    amount = tier === 1 ? 3_100_000 + annualGross * 0.04
      : tier === 2 ? 3_600_000 + annualGross * 0.04
      : 5_000_000 + annualGross * 0.07 + Math.max(0, annualGross - 40_000_000) * 0.04;
  } else if (annualGross <= 45_000_000) {
    const base = tier === 1 ? 3_100_000 + annualGross * 0.04
      : tier === 2 ? 3_600_000 + annualGross * 0.04
      : 5_000_000 + annualGross * 0.07 + Math.max(0, annualGross - 40_000_000) * 0.04;
    amount = base - (annualGross - 30_000_000) * 0.05;
  } else if (annualGross <= 70_000_000) {
    amount = tier === 1 ? 3_100_000 + annualGross * 0.015
      : tier === 2 ? 3_600_000 + annualGross * 0.02
      : 5_000_000 + annualGross * 0.05;
  } else {
    amount = tier === 1 ? 3_100_000 + annualGross * 0.005
      : tier === 2 ? 3_600_000 + annualGross * 0.01
      : 5_000_000 + annualGross * 0.03;
  }
  return Math.max(0, amount);
}

function grossTax(taxBase: number): number {
  for (const b of INCOME_TAX_BRACKETS) {
    if (taxBase <= b.upTo) return Math.max(0, taxBase * b.rate - b.progressive);
  }
  return 0;
}

/** 근로소득세액공제 한도 — 총급여 구간별 체감. */
function earnedIncomeTaxCreditCap(annualGross: number): number {
  if (annualGross <= 33_000_000) return 740_000;
  if (annualGross <= 70_000_000) return Math.max(660_000, 740_000 - (annualGross - 33_000_000) * 0.008);
  return Math.max(500_000, 660_000 - (annualGross - 70_000_000) / 2);
}

/**
 * 월 소득세 추정 — 간이세액표의 산식 구조를 따른다.
 * ⚠️ 법적 기준은 국세청 간이세액표. 표와 차이가 날 수 있어 "추정"으로만 쓴다.
 */
export function estimateMonthlyIncomeTax(args: {
  monthlyTaxableGross: number;
  dependents: number;
  childrenAged8to20?: number;
  /** 국민연금 근로자 부담 월액 — 연금보험료공제. */
  monthlyPensionPremium: number;
  withholdingRatio?: number;
}): number {
  const annualGross = Math.max(0, args.monthlyTaxableGross) * 12;
  if (annualGross <= 0) return 0;

  const incomeAmount = annualGross - earnedIncomeDeduction(annualGross);
  const personal = BASIC_DEDUCTION_PER_PERSON * Math.max(1, args.dependents);
  const pension = Math.max(0, args.monthlyPensionPremium) * 12;
  const special = deemedSpecialDeduction(annualGross, args.dependents);

  const taxBase = Math.max(0, incomeAmount - personal - pension - special);
  const computed = grossTax(taxBase);

  // 근로소득세액공제 — 130만원 이하 55%, 초과분 30%, 총급여별 한도.
  const rawCredit = computed <= 1_300_000
    ? computed * 0.55
    : 1_300_000 * 0.55 + (computed - 1_300_000) * 0.3;
  const credit = Math.min(rawCredit, earnedIncomeTaxCreditCap(annualGross));

  // 자녀세액공제 — 8~20세. 2026 개정으로 확대. 1명 25만·2명 55만·3명부터 1명당 +40만.
  const kids = Math.max(0, args.childrenAged8to20 ?? 0);
  const childCredit = kids === 0 ? 0
    : kids === 1 ? 250_000
    : kids === 2 ? 550_000
    : 550_000 + (kids - 2) * 400_000;

  const annualTax = Math.max(0, computed - credit - childCredit);
  const ratio = args.withholdingRatio ?? 1.0;
  return won((annualTax / 12) * ratio);
}

// ── 메인 ────────────────────────────────────────────────────────────────

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const warnings: PayrollWarning[] = [];
  const estimated: { item: string; why: string }[] = [];
  const exact: string[] = [];

  const hourly = ordinaryHourlyWage(input);
  const weekly = input.contractedWeeklyHours || LEGAL_WEEKLY_HOURS;
  const isShortTime = weekly < SHORT_TIME_WEEKLY_HOURS;
  const premiumRequired = input.headcount >= PREMIUM_PAY_MIN_HEADCOUNT;

  // ── 1. 최저임금 ──
  if (hourly > 0 && hourly < PAYROLL_MINIMUM_WAGE) {
    warnings.push({
      level: "violation",
      message: `통상시급 ${hourly.toLocaleString()}원 — 2026년 최저임금 ${PAYROLL_MINIMUM_WAGE.toLocaleString()}원보다 ${(PAYROLL_MINIMUM_WAGE - hourly).toLocaleString()}원 낮습니다.`,
      law: "최저임금법 §6",
    });
  }

  // ── 2. 지급 항목 ──
  const earnings: PayItem[] = [];

  // 기본급
  const weeksInMonth = input.weeks?.length
    ? input.weeks.reduce((a, w) => a + (w.monthShare ?? 1), 0)
    : WEEKS_PER_MONTH;
  const workedHours = input.actualWorkedHours ?? weekly * weeksInMonth;

  if (input.monthlyBaseSalary && input.monthlyBaseSalary > 0) {
    earnings.push({
      label: "기본급",
      amount: won(input.monthlyBaseSalary),
      method: `월 고정급 (통상시급 ${hourly.toLocaleString()}원 기준)`,
    });
    exact.push("기본급");
  } else {
    earnings.push({
      label: "기본급",
      amount: won(hourly * workedHours),
      method: `${hourly.toLocaleString()}원 × ${round1(workedHours)}시간`,
      hours: round1(workedHours),
    });
    exact.push("기본급");
  }

  // 주휴수당 — 주 단위 개근 판정
  let holidayPayHours = 0;
  let paidWeeks = 0;
  let skippedWeeks = 0;
  let needsHolidayEstimateNote = false;
  if (input.weeks?.length) {
    for (const w of input.weeks) {
      const hrs = weeklyHolidayHours(w.scheduledHours);
      if (hrs <= 0) continue;
      if (w.absentDays > 0) { skippedWeeks += 1; continue; }   // 개근 아니면 미발생
      holidayPayHours += hrs * (w.monthShare ?? 1);
      paidWeeks += 1;
    }
  } else if (!isShortTime) {
    holidayPayHours = weeklyHolidayHours(weekly) * WEEKS_PER_MONTH;
    // 추정 표시는 **실제로 주휴수당 항목이 나갈 때만**. 월급제는 아래에서 항목을 내지 않는다.
    needsHolidayEstimateNote = true;
  }

  // 월급제는 주휴가 이미 월급에 포함(209시간 = 40 + 주휴 8). 중복 지급 금지.
  const weeklyHolidayIncludedInBase = !!(input.monthlyBaseSalary && input.monthlyBaseSalary > 0);
  if (holidayPayHours > 0 && !weeklyHolidayIncludedInBase) {
    earnings.push({
      label: "주휴수당",
      amount: won(hourly * holidayPayHours),
      // 주별 기록이 있으면 "개근 N주", 없으면 추정임을 문구로 밝힌다("개근 0주" 라고 쓰면 거짓말).
      method: needsHolidayEstimateNote
        ? `${hourly.toLocaleString()}원 × ${round1(holidayPayHours)}시간 (주 ${round1(weeklyHolidayHours(weekly))}시간 × 약 ${round1(WEEKS_PER_MONTH)}주 — 출결 기록 없어 추정)`
        : `${hourly.toLocaleString()}원 × ${round1(holidayPayHours)}시간 (주 ${round1(weeklyHolidayHours(weekly))}시간 × 개근 ${paidWeeks}주)`,
      hours: round1(holidayPayHours),
    });
    exact.push("주휴수당");
    if (needsHolidayEstimateNote) {
      estimated.push({ item: "주휴수당", why: "주별 출결 기록이 없어 계약 시간으로 추정했습니다. 결근이 있으면 그 주는 빠집니다." });
    }
  }
  if (skippedWeeks > 0) {
    warnings.push({
      level: "check",
      message: `결근이 있어 주휴수당이 빠진 주가 ${skippedWeeks}주 있습니다. 지각·조퇴는 결근이 아니니 기록을 확인하세요.`,
      law: "근로기준법 §55",
    });
  }
  if (isShortTime) {
    warnings.push({
      level: "check",
      message: "주 소정근로 15시간 미만 — 주휴수당·연차 의무가 없고 국민연금·건강보험도 제외됩니다.",
      law: "근로기준법 §18③",
    });
  }

  // 연장·야간·휴일
  const ot = input.overtimeHours ?? 0;
  const night = input.nightHours ?? 0;
  const holiday = input.holidayHours ?? 0;

  const addPremium = (label: string, hours: number, rate: number, note: string) => {
    if (hours <= 0) return;
    // 5인 미만이면 가산 없이 통상임금만. 승인된 시간은 그래도 지급해야 한다.
    const multiplier = premiumRequired ? 1 + rate : 1;
    earnings.push({
      label,
      amount: won(hourly * hours * multiplier),
      method: `${hourly.toLocaleString()}원 × ${round1(hours)}시간 × ${multiplier}배 (${note})`,
      hours: round1(hours),
    });
    exact.push(label);
  };

  addPremium("연장근로수당", ot, PREMIUM_RATES.overtime,
    premiumRequired ? "5인 이상 50% 가산" : "5인 미만 — 가산 의무 없음");
  addPremium("야간근로수당", night, PREMIUM_RATES.night,
    premiumRequired ? "22시~6시 50% 가산" : "5인 미만 — 가산 의무 없음");
  // 휴일 8시간 이내 50%, 초과분 100%
  if (holiday > 0) {
    const within = Math.min(holiday, 8);
    const over = Math.max(0, holiday - 8);
    addPremium("휴일근로수당", within, PREMIUM_RATES.holidayWithin8h,
      premiumRequired ? "8시간 이내 50% 가산" : "5인 미만 — 가산 의무 없음");
    if (over > 0) {
      addPremium("휴일근로수당(8시간 초과)", over, PREMIUM_RATES.holidayOver8h,
        premiumRequired ? "8시간 초과 100% 가산" : "5인 미만 — 가산 의무 없음");
    }
  }
  if (!premiumRequired && (ot > 0 || night > 0 || holiday > 0)) {
    warnings.push({
      level: "check",
      message: "상시 5인 미만이라 연장·야간·휴일 가산(50%) 의무가 없습니다. 근로계약서에 가산을 약속했다면 그 약속이 우선합니다.",
      law: "근로기준법 §11 · §56",
    });
  }

  // 비과세 (식대 등)
  const taxFreeRaw = Math.max(0, input.taxFreeAllowance ?? 0);
  const taxFreeAmount = Math.min(taxFreeRaw, TAX_FREE_MEAL_ALLOWANCE_MAX);
  if (taxFreeRaw > 0) {
    earnings.push({
      label: "식대(비과세)",
      amount: won(taxFreeRaw),
      method: taxFreeRaw > TAX_FREE_MEAL_ALLOWANCE_MAX
        ? `비과세 한도 ${TAX_FREE_MEAL_ALLOWANCE_MAX.toLocaleString()}원 초과분은 과세`
        : "비과세",
    });
    exact.push("식대");
  }

  const grossPay = earnings.reduce((a, e) => a + e.amount, 0);
  const taxableGross = Math.max(0, grossPay - taxFreeAmount);

  // ── 3. 4대보험 ──
  const enrolled = input.insuranceEnrolled !== false;
  const pensionBase = clamp(taxableGross, PENSION_INCOME_BOUNDS.current.min, PENSION_INCOME_BOUNDS.current.max);
  const r = INSURANCE_RATES;

  // 65세 이후 신규 고용 → 실업급여 적용 제외 (근로자 부담 없음, 고용안정분은 사업주 부담)
  const unemploymentExempt = !!input.hiredAfter65 || (input.age != null && input.age >= 65 && input.hiredAfter65 !== false);

  const eePension = enrolled && !isShortTime ? won(pensionBase * r.nationalPension.employee) : 0;
  const eeHealth = enrolled && !isShortTime ? won(taxableGross * r.healthInsurance.employee) : 0;
  const eeLtc = won(eeHealth * r.longTermCareOfHealth);
  const eeEmployment = enrolled && !unemploymentExempt ? won(taxableGross * r.employmentInsurance.employee) : 0;

  const erPension = enrolled && !isShortTime ? won(pensionBase * r.nationalPension.employer) : 0;
  const erHealth = enrolled && !isShortTime ? won(taxableGross * r.healthInsurance.employer) : 0;
  const erLtc = won(erHealth * r.longTermCareOfHealth);
  const erUnemployment = enrolled && !unemploymentExempt ? won(taxableGross * r.employmentInsurance.employer) : 0;
  const erStability = enrolled ? won(taxableGross * r.employmentStability.employer) : 0;

  const accidentRate = input.industrialAccidentRate ?? INDUSTRIAL_ACCIDENT.defaultRate;
  const erAccident = enrolled ? won(taxableGross * (accidentRate + INDUSTRIAL_ACCIDENT.commuteAccident)) : 0;
  if (input.industrialAccidentRate == null) {
    estimated.push({
      item: "산재보험료",
      why: `업종 기본값 ${(INDUSTRIAL_ACCIDENT.defaultRate * 100).toFixed(1)}%로 계산했습니다. 실제 요율은 근로복지공단 고지서에 있습니다.`,
    });
  } else {
    exact.push("산재보험료");
  }

  if (!enrolled) {
    warnings.push({
      level: "violation",
      message: "4대보험 미가입으로 계산했습니다. 주 15시간 이상이면 가입 의무가 있고, 미가입 시 소급 부과와 과태료가 따릅니다.",
      law: "국민연금법 §8 · 국민건강보험법 §6",
    });
  }

  // 두루누리
  const duruduri = enrolled
    && !!input.duruduriEligible
    && taxableGross < DURUNURI.monthlySalaryThreshold
    && input.headcount < DURUNURI.maxEmployees;
  const duruduriEeSaving = duruduri ? won((eePension + eeEmployment) * (DURUNURI.subsidyPct / 100)) : 0;
  const duruduriErSaving = duruduri ? won((erPension + erUnemployment) * (DURUNURI.subsidyPct / 100)) : 0;
  // 주 15시간 미만은 국민연금 가입 자체가 없어 두루누리 실익이 거의 없다 → 안내하지 않는다.
  if (!duruduri && enrolled && !isShortTime
      && taxableGross < DURUNURI.monthlySalaryThreshold && input.headcount < DURUNURI.maxEmployees) {
    warnings.push({
      level: "check",
      message: "두루누리 사회보험 지원 대상일 수 있습니다. 신규 가입 36개월 이내면 국민연금·고용보험을 80% 지원받습니다.",
    });
  }

  // ── 4. 소득세 (추정) ──
  const incomeTax = estimateMonthlyIncomeTax({
    monthlyTaxableGross: taxableGross,
    dependents: input.dependents ?? 1,
    childrenAged8to20: input.childrenAged8to20,
    monthlyPensionPremium: eePension,
    withholdingRatio: input.withholdingRatio,
  });
  const localTax = won(incomeTax * LOCAL_INCOME_TAX_RATE);
  estimated.push({
    item: "소득세·지방소득세",
    why: "국세청 간이세액표의 산식 구조로 추정했습니다. 법적 기준은 홈택스의 간이세액표이며 수천 원 차이가 날 수 있습니다.",
  });

  // ── 5. 조립 ──
  const deductions: PayItem[] = [];
  const pushDeduction = (label: string, amount: number, method?: string) => {
    if (amount > 0) deductions.push({ label, amount, method });
  };
  pushDeduction("국민연금", Math.max(0, eePension - (duruduri ? won(eePension * 0.8) : 0)),
    `기준소득월액 ${pensionBase.toLocaleString()}원 × 4.75%${duruduri ? " (두루누리 80% 지원)" : ""}`);
  pushDeduction("건강보험", eeHealth, "보수월액 × 3.595%");
  pushDeduction("장기요양보험", eeLtc, "건강보험료 × 13.14%");
  pushDeduction("고용보험", Math.max(0, eeEmployment - (duruduri ? won(eeEmployment * 0.8) : 0)),
    unemploymentExempt ? "65세 이후 고용 — 실업급여 적용 제외" : "보수월액 × 0.9%");
  pushDeduction("소득세(추정)", incomeTax, "간이세액표 추정");
  pushDeduction("지방소득세(추정)", localTax, "소득세의 10%");

  // 실제로 명세서에 찍힌 항목만 "확정"으로 센다. 공제하지 않은 걸 확정이라 하면 거짓말이 된다.
  for (const d of deductions) {
    if (["국민연금", "건강보험", "장기요양보험", "고용보험"].includes(d.label)) exact.push(d.label);
  }

  const deductionTotal = deductions.reduce((a, d) => a + d.amount, 0);
  const netPay = grossPay - deductionTotal;

  const employerBurden: PayItem[] = [];
  const pushBurden = (label: string, amount: number, method?: string) => {
    if (amount > 0) employerBurden.push({ label, amount, method });
  };
  pushBurden("국민연금(사업주)", Math.max(0, erPension - duruduriErSaving > 0 ? erPension - (duruduri ? won(erPension * 0.8) : 0) : 0), "기준소득월액 × 4.75%");
  pushBurden("건강보험(사업주)", erHealth, "보수월액 × 3.595%");
  pushBurden("장기요양보험(사업주)", erLtc, "건강보험료 × 13.14%");
  pushBurden("고용보험(사업주)", Math.max(0, erUnemployment - (duruduri ? won(erUnemployment * 0.8) : 0)) + erStability,
    "실업급여 0.9% + 고용안정·직업능력개발 0.25%");
  pushBurden("산재보험(사업주)", erAccident,
    `보수월액 × ${((accidentRate + INDUSTRIAL_ACCIDENT.commuteAccident) * 100).toFixed(2)}% (출퇴근재해 포함)`);

  const employerBurdenTotal = employerBurden.reduce((a, e) => a + e.amount, 0);
  // 퇴직급여는 계속근로 1년 이상 + 주 15시간 이상일 때 의무(근퇴법 §4). 조건을 모르면 적립 권장액만 낸다.
  const severanceEligible = !isShortTime;
  const severanceReserve = severanceEligible ? won(grossPay / 12) : 0;
  if (severanceEligible && input.tenureDays != null && input.tenureDays < SEVERANCE_MIN_DAYS) {
    warnings.push({
      level: "check",
      message: `근속 ${input.tenureDays}일 — 1년(365일)을 채우면 퇴직급여 지급 의무가 생깁니다. 미리 적립해 두세요.`,
      law: "근로자퇴직급여보장법 §4",
    });
  }

  // 요율 검토 만료 경고
  if (new Date().toISOString().slice(0, 10) > RATES_REVIEW_BY) {
    warnings.push({
      level: "check",
      message: `급여 계산에 쓰는 법정 요율의 확인 기한(${RATES_REVIEW_BY})이 지났습니다. 최신 요율로 갱신이 필요합니다.`,
    });
  }

  return {
    period: input.period,
    ordinaryHourlyWage: hourly,
    earnings,
    grossPay,
    taxFreeAmount,
    deductions,
    deductionTotal,
    netPay,
    employerBurden,
    employerBurdenTotal,
    totalEmployerCost: grossPay + employerBurdenTotal,
    severanceReserve,
    warnings,
    confidence: { exact: [...new Set(exact)], estimated },
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
