/**
 * payroll-ios-sync.test.ts — 급여 계산 웹·iOS 드리프트 가드 (2026).
 *
 * 급여 수치가 두 플랫폼에서 갈라지면 한쪽이 임금체불이 된다.
 * 법정 요율은 손으로 두 곳에 적혀 있으므로 여기서 한 줄씩 대조한다.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PAYROLL_MINIMUM_WAGE,
  MONTHLY_STANDARD_HOURS,
  INSURANCE_RATES,
  PENSION_INCOME_BOUNDS,
  INDUSTRIAL_ACCIDENT,
  DURUNURI,
  TAX_FREE_MEAL_ALLOWANCE_MAX,
  PREMIUM_PAY_MIN_HEADCOUNT,
  RATES_REVIEW_BY,
  weeklyHolidayHours,
  ordinaryHourlyWage,
  calculatePayroll,
} from "@foundone/shared";

const SWIFT = readFileSync(
  join(__dirname, "..", "..", "..", "apps/ios/Sources/FoundOneCore/Payroll.swift"),
  "utf8",
);

/** Swift 의 `static let 이름 = 값` 에서 숫자만 (밑줄 구분 허용). */
function swiftNumber(name: string): number {
  const hit = new RegExp(`static let ${name} = ([0-9_.]+)`).exec(SWIFT);
  if (!hit) throw new Error(`Payroll.swift 에 ${name} 이 없습니다`);
  return Number(hit[1].replace(/_/g, ""));
}

describe("법정 요율 — 웹 ↔ iOS", () => {
  it("최저임금", () => {
    expect(swiftNumber("minimumWage")).toBe(PAYROLL_MINIMUM_WAGE);
  });

  it("월 소정근로시간 209", () => {
    expect(swiftNumber("monthlyStandardHours")).toBe(MONTHLY_STANDARD_HOURS);
  });

  it("4대보험 요율 6종", () => {
    expect(swiftNumber("pensionEmployee")).toBe(INSURANCE_RATES.nationalPension.employee);
    expect(swiftNumber("pensionEmployer")).toBe(INSURANCE_RATES.nationalPension.employer);
    expect(swiftNumber("healthEmployee")).toBe(INSURANCE_RATES.healthInsurance.employee);
    expect(swiftNumber("longTermCareOfHealth")).toBe(INSURANCE_RATES.longTermCareOfHealth);
    expect(swiftNumber("employmentEmployee")).toBe(INSURANCE_RATES.employmentInsurance.employee);
    expect(swiftNumber("employmentStabilityEmployer")).toBe(INSURANCE_RATES.employmentStability.employer);
  });

  it("국민연금 기준소득월액 상·하한", () => {
    expect(swiftNumber("pensionIncomeMin")).toBe(PENSION_INCOME_BOUNDS.current.min);
    expect(swiftNumber("pensionIncomeMax")).toBe(PENSION_INCOME_BOUNDS.current.max);
  });

  it("산재 기본요율·출퇴근재해", () => {
    expect(swiftNumber("accidentDefaultRate")).toBe(INDUSTRIAL_ACCIDENT.defaultRate);
    expect(swiftNumber("commuteAccidentRate")).toBe(INDUSTRIAL_ACCIDENT.commuteAccident);
  });

  it("두루누리 기준", () => {
    expect(swiftNumber("duruduriSalaryThreshold")).toBe(DURUNURI.monthlySalaryThreshold);
    expect(swiftNumber("duruduriMaxEmployees")).toBe(DURUNURI.maxEmployees);
  });

  it("비과세 식대 한도·5인 기준선", () => {
    expect(swiftNumber("taxFreeMealMax")).toBe(TAX_FREE_MEAL_ALLOWANCE_MAX);
    expect(swiftNumber("premiumPayMinHeadcount")).toBe(PREMIUM_PAY_MIN_HEADCOUNT);
  });

  it("요율 재확인 기한이 같다 — 한쪽만 갱신하면 값이 갈라진다", () => {
    expect(SWIFT).toContain(`reviewBy = "${RATES_REVIEW_BY}"`);
  });
});

describe("계산 규칙 — iOS 에 같은 분기가 있다", () => {
  it("주휴: 15시간 미만 0 · (소정/40)×8 · 8시간 상한", () => {
    expect(SWIFT).toMatch(/scheduledWeeklyHours >= BUPayrollRates\.shortTimeWeeklyHours/);
    expect(SWIFT).toMatch(/legalWeeklyHours\) \* BUPayrollRates\.weeklyHolidayMaxHours/);
    expect(SWIFT).toMatch(/min\(/);
    // 웹 쪽 동작도 고정
    expect(weeklyHolidayHours(40)).toBe(8);
    expect(weeklyHolidayHours(20)).toBe(4);
    expect(weeklyHolidayHours(14)).toBe(0);
  });

  it("통상시급: 주 40시간 이상은 209시간으로 나눈다", () => {
    expect(SWIFT).toMatch(/weekly >= BUPayrollRates\.legalWeeklyHours[\s\S]{0,80}monthlyStandardHours/);
    expect(ordinaryHourlyWage({ monthlyBaseSalary: 2_090_000, contractedWeeklyHours: 40 })).toBe(10_000);
  });

  it("가산: 5인 미만이면 1배", () => {
    expect(SWIFT).toMatch(/headcount >= BUPayrollRates\.premiumPayMinHeadcount \? 1 \+ premium : 1/);
  });
});

/**
 * 골든 값 — 웹·iOS 두 엔진이 **원 단위까지 같은 답**을 낸 결과를 고정한다.
 *
 * iOS 쪽 대조 방법 (수동, 요율을 바꿨을 때 다시 돌릴 것):
 *   cp apps/ios/Sources/FoundOneCore/Payroll.swift /tmp/xcheck/ && cd /tmp/xcheck
 *   swiftc -O Payroll.swift main.swift -o xcheck && ./xcheck
 *   → 아래 숫자와 같아야 한다. 다르면 한쪽이 임금체불을 만든다.
 */
describe("골든 — 웹·iOS 동일 결과 (2026-09-12 대조 완료)", () => {
  it("사례 1 — 알바 주 20시간, 4주 개근, 5인 미만, 두루누리", () => {
    const r = calculatePayroll({
      period: "2026-09", headcount: 3,
      hourlyWage: 10_320, contractedWeeklyHours: 20, actualWorkedHours: 80,
      duruduriEligible: true,
      weeks: [0, 1, 2, 3].map((i) => ({ weekStart: `2026-09-0${i + 1}`, scheduledHours: 20, absentDays: 0 })),
    });
    expect(r.ordinaryHourlyWage).toBe(10_320);
    expect(r.grossPay).toBe(990_720);
    expect(r.deductionTotal).toBe(51_491);
    expect(r.netPay).toBe(939_229);
    expect(r.employerBurdenTotal).toBe(62_488);
    expect(r.totalEmployerCost).toBe(1_053_208);
    expect(r.severanceReserve).toBe(82_560);
    expect(r.earnings.map((e) => [e.label, e.amount])).toEqual([
      ["기본급", 825_600],
      ["주휴수당", 165_120],
    ]);
  });

  it("사례 2 — 정직원 월 250만원, 연장 10h·야간 4h, 5인 이상, 식대 20만", () => {
    const r = calculatePayroll({
      period: "2026-09", headcount: 6, industrialAccidentRate: 0.008,
      monthlyBaseSalary: 2_500_000, contractedWeeklyHours: 40,
      overtimeHours: 10, nightHours: 4, dependents: 1, taxFreeAllowance: 200_000,
    });
    expect(r.ordinaryHourlyWage).toBe(11_962);
    expect(r.grossPay).toBe(2_951_202);
    expect(r.deductionTotal).toBe(311_116);
    expect(r.netPay).toBe(2_640_086);
    expect(r.employerBurdenTotal).toBe(297_883);
    expect(r.totalEmployerCost).toBe(3_249_085);
    // 월급제는 주휴를 두 번 주지 않는다.
    expect(r.earnings.find((e) => e.label === "주휴수당")).toBeUndefined();
  });

  it("사례 3 — 단시간 주 12시간 (연금·건보 제외, 퇴직급여 없음)", () => {
    const r = calculatePayroll({
      period: "2026-09", headcount: 2,
      hourlyWage: 11_000, contractedWeeklyHours: 12, actualWorkedHours: 48,
    });
    expect(r.grossPay).toBe(528_000);
    expect(r.deductionTotal).toBe(4_752);
    expect(r.netPay).toBe(523_248);
    expect(r.employerBurdenTotal).toBe(10_613);
    expect(r.severanceReserve).toBe(0);
    expect(r.deductions.map((d) => d.label)).toEqual(["고용보험"]);
  });
});
