/**
 * rates-2026.ts — 급여 계산에 쓰는 2026년 법정 수치 SSOT.
 *
 * ⚠️ 모든 값에 **출처와 적용 시점**을 적는다. 급여는 틀리면 임금체불이 된다.
 *    매년 1월(일부는 7월) 갱신 필요 — REVIEW_BY 를 넘기면 계산기가 경고를 낸다.
 */

/** 이 파일의 값들을 다시 확인해야 하는 날짜 (YYYY-MM-DD). */
export const RATES_REVIEW_BY = "2027-01-15";

import { LEGAL } from "../constants/benchmarks";

/** 최저임금 — 고용노동부 고시(2025-08-05), 2026-01-01 시행.
 *  값은 LEGAL.MINIMUM_WAGE_HOURLY 한 곳에서만 정의한다(드리프트 방지). */
export const PAYROLL_MINIMUM_WAGE = LEGAL.MINIMUM_WAGE_HOURLY;

/**
 * 월 소정근로시간 209 = (주 40시간 + 주휴 8시간) × 4.345주.
 * 4.345 = 365 ÷ 7 ÷ 12. 통상시급 산정의 분모(월급제).
 */
export const MONTHLY_STANDARD_HOURS = 209;
export const WEEKS_PER_MONTH = 365 / 7 / 12; // 4.3452…

/** 법정 기준 근로시간. */
export const LEGAL_WEEKLY_HOURS = 40;
/** 주휴수당 상한 시간 — 주 40시간 이상이어도 8시간분이 최대(근기법 §55). */
export const WEEKLY_HOLIDAY_MAX_HOURS = 8;
/** 주휴수당·4대보험(연금·건보) 판정 기준 — 주 소정근로 15시간. */
export const SHORT_TIME_WEEKLY_HOURS = 15;
/** 가산수당 의무가 생기는 상시 근로자 수 (근기법 §11 — 5인 미만 적용 제외). */
export const PREMIUM_PAY_MIN_HEADCOUNT = 5;

/**
 * 가산율 — 근로기준법 §56. **상시 5인 이상만 의무**.
 *  중복 시 가산율을 합산하고 기본 1배는 한 번만 센다
 *  (예: 야간에 한 연장근로 = 1 + 0.5 + 0.5 = 2.0배).
 */
export const PREMIUM_RATES = {
  /** 연장근로 가산 (§56①) */
  overtime: 0.5,
  /** 야간근로 가산 22:00~06:00 (§56③) */
  night: 0.5,
  /** 휴일근로 8시간 이내 (§56②) */
  holidayWithin8h: 0.5,
  /** 휴일근로 8시간 초과 (§56②) */
  holidayOver8h: 1.0,
} as const;

/** 야간근로 시간대 (시). */
export const NIGHT_WORK_START_HOUR = 22;
export const NIGHT_WORK_END_HOUR = 6;

/**
 * 4대보험 요율 — 2026년.
 *  국민연금 9.5% (2026 인상, 2033년까지 매년 0.5%p) · 국민연금공단
 *  건강보험 7.19% · 장기요양 0.9448%(= 건강보험료의 13.14%) · 보건복지부 고시
 *  고용보험 실업급여 1.8%(노사 각 0.9) + 고용안정·직업능력개발(사업주 전액)
 */
export const INSURANCE_RATES = {
  nationalPension: { employer: 0.0475, employee: 0.0475 },
  healthInsurance: { employer: 0.03595, employee: 0.03595 },
  /** 장기요양 = 건강보험료 × 이 비율 (0.9448 ÷ 7.19). */
  longTermCareOfHealth: 0.1314,
  employmentInsurance: { employer: 0.009, employee: 0.009 },
  /** 고용안정·직업능력개발 — 사업주 전액. 150인 미만 0.25%. */
  employmentStability: { employer: 0.0025 },
} as const;

/**
 * 산재보험료율 — 고용노동부 고시 제2025-91호(2026년도 사업종류별). 단위: 비율.
 *  2026 평균 1.47%. 아래는 우리 업종 매핑에 쓰는 값이며, **사업장마다 실제 요율이 다르다**
 *  (근로복지공단 고지서에 적힌 값이 정답). 모르면 defaultRate 를 쓰고 화면에 "확인 필요"를 띄운다.
 */
export const INDUSTRIAL_ACCIDENT = {
  /** 도소매·음식·숙박업 0.8% — 우리 사용자 다수. */
  retailFoodLodging: 0.008,
  /** 업종 미상일 때의 기본값(= 도소매·음식·숙박). */
  defaultRate: 0.008,
  /** 출퇴근재해 요율 — 전 업종 공통 별도 가산, 천분의 0.6. */
  commuteAccident: 0.0006,
} as const;

/**
 * 국민연금 기준소득월액 상·하한 — 국민연금공단.
 *  요율은 이 범위로 자른 소득에 곱한다. 2026-07-01 조정.
 */
export const PENSION_INCOME_BOUNDS = {
  /** 2026-07-01 이후 */
  current: { min: 410_000, max: 6_590_000, effectiveFrom: "2026-07-01" },
  /** 2026-06-30 까지 */
  previous: { min: 400_000, max: 6_370_000, effectiveFrom: "2025-07-01" },
} as const;

/** 두루누리 사회보험 지원 — 4insure.or.kr 신청. */
export const DURUNURI = {
  monthlySalaryThreshold: 2_700_000,
  maxEmployees: 10,
  subsidyPct: 80,
  durationMonths: 36,
} as const;

/** 비과세 식대 한도 — 소득세법 시행령 §17의2, 2023년부터 월 20만원. */
export const TAX_FREE_MEAL_ALLOWANCE_MAX = 200_000;

/** 퇴직급여 월 적립 비율 (1/12) — 근로자퇴직급여보장법 §8.
 *  이름 충돌을 피하려고 접두어를 둔다 (finance/hiring-cost 에 동명 상수가 있다). */
export const PAYROLL_SEVERANCE_RESERVE_RATE = 1 / 12;
/** 퇴직급여 대상 — 계속근로 1년 이상 + 주 15시간 이상. 5인 미만도 의무. */
export const SEVERANCE_MIN_DAYS = 365;

// ── 소득세 (근로소득 간이세액표 추정용) ────────────────────────────────
//
// ⚠️ 법적 기준은 국세청 간이세액표(소득세법 시행령 별표2)다. 아래는 그 표를 만드는
//    **산식 구조**를 옮긴 추정이며, 표와 수천 원 단위 차이가 날 수 있다.
//    화면에서는 반드시 "추정"으로 표시하고 홈택스 조회 링크를 함께 준다.

/** 근로소득공제 — 소득세법 §47. [상한, 기본공제액, 초과분 공제율]. */
export const EARNED_INCOME_DEDUCTION_BRACKETS: ReadonlyArray<{
  upTo: number; base: number; rate: number;
}> = [
  { upTo: 5_000_000, base: 0, rate: 0.7 },
  { upTo: 15_000_000, base: 3_500_000, rate: 0.4 },
  { upTo: 45_000_000, base: 7_500_000, rate: 0.15 },
  { upTo: 100_000_000, base: 12_000_000, rate: 0.05 },
  { upTo: Number.POSITIVE_INFINITY, base: 14_750_000, rate: 0.02 },
];
/** 근로소득공제 한도 — 2,000만원. */
export const EARNED_INCOME_DEDUCTION_CAP = 20_000_000;

/** 기본공제 1인당 — 소득세법 §50. */
export const BASIC_DEDUCTION_PER_PERSON = 1_500_000;

/** 종합소득세 기본세율 — 소득세법 §55. [상한, 세율, 누진공제]. */
export const INCOME_TAX_BRACKETS: ReadonlyArray<{
  upTo: number; rate: number; progressive: number;
}> = [
  { upTo: 14_000_000, rate: 0.06, progressive: 0 },
  { upTo: 50_000_000, rate: 0.15, progressive: 1_260_000 },
  { upTo: 88_000_000, rate: 0.24, progressive: 5_760_000 },
  { upTo: 150_000_000, rate: 0.35, progressive: 15_440_000 },
  { upTo: 300_000_000, rate: 0.38, progressive: 19_940_000 },
  { upTo: 500_000_000, rate: 0.40, progressive: 25_940_000 },
  { upTo: 1_000_000_000, rate: 0.42, progressive: 35_940_000 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.45, progressive: 65_940_000 },
];

/** 지방소득세 — 소득세의 10%. */
export const LOCAL_INCOME_TAX_RATE = 0.1;

/** 간이세액표 원천징수 비율 선택 — 근로자가 80/100/120 중 고를 수 있다(기본 100). */
export const WITHHOLDING_RATIO_OPTIONS = [0.8, 1.0, 1.2] as const;
