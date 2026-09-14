/**
 * payroll-engine.test.ts — 급여 계산 검증 (2026).
 *
 * 급여는 틀리면 임금체불이 된다. 손으로 계산한 값과 대조한다.
 * 특히 주휴수당·가산수당 누락이 임금체불 신고의 다수라 그 경로를 집중적으로 본다.
 */

import { describe, expect, it } from "vitest";
import {
  calculatePayroll,
  ordinaryHourlyWage,
  weeklyHolidayHours,
  estimateMonthlyIncomeTax,
  PAYROLL_MINIMUM_WAGE,
  MONTHLY_STANDARD_HOURS,
} from "@foundone/shared";

const MIN_WAGE = PAYROLL_MINIMUM_WAGE; // 10,320원 (2026)

describe("주휴수당 시간", () => {
  it("주 40시간이면 8시간", () => {
    expect(weeklyHolidayHours(40)).toBe(8);
  });
  it("주 20시간이면 4시간 — (20/40)×8", () => {
    expect(weeklyHolidayHours(20)).toBe(4);
  });
  it("주 40시간을 넘어도 8시간이 상한", () => {
    expect(weeklyHolidayHours(52)).toBe(8);
  });
  it("주 15시간 미만이면 발생하지 않는다", () => {
    expect(weeklyHolidayHours(14)).toBe(0);
  });
});

describe("통상시급", () => {
  it("시급제는 시급 그대로", () => {
    expect(ordinaryHourlyWage({ hourlyWage: 12_000, contractedWeeklyHours: 20 })).toBe(12_000);
  });
  it("월급제 주 40시간은 209시간으로 나눈다", () => {
    const w = ordinaryHourlyWage({ monthlyBaseSalary: 2_500_000, contractedWeeklyHours: 40 });
    expect(w).toBe(Math.round(2_500_000 / MONTHLY_STANDARD_HOURS)); // 11,962원
  });
});

describe("시급제 알바 — 주 20시간, 4주 개근, 5인 미만", () => {
  const result = calculatePayroll({
    period: "2026-09",
    headcount: 3,
    hourlyWage: MIN_WAGE,
    contractedWeeklyHours: 20,
    actualWorkedHours: 80,
    weeks: [0, 1, 2, 3].map((i) => ({ weekStart: `2026-09-0${i + 1}`, scheduledHours: 20, absentDays: 0 })),
  });

  it("기본급 = 시급 × 실근로 80시간", () => {
    expect(result.earnings.find((e) => e.label === "기본급")?.amount).toBe(MIN_WAGE * 80);
  });

  it("주휴수당이 반드시 붙는다 — 주 15시간 이상 개근 4주 × 4시간", () => {
    const juhyu = result.earnings.find((e) => e.label === "주휴수당");
    expect(juhyu).toBeDefined();
    expect(juhyu!.amount).toBe(MIN_WAGE * 16); // 4주 × 4시간
  });

  it("임금명세서 필수 — 계산방법이 항목마다 적힌다", () => {
    for (const e of result.earnings) expect(e.method).toBeTruthy();
  });

  it("5인 미만이라도 최저임금 위반은 없다", () => {
    expect(result.warnings.filter((w) => w.level === "violation")).toHaveLength(0);
  });
});

describe("결근한 주는 주휴수당이 빠진다", () => {
  const result = calculatePayroll({
    period: "2026-09",
    headcount: 3,
    hourlyWage: MIN_WAGE,
    contractedWeeklyHours: 20,
    actualWorkedHours: 76,
    weeks: [
      { weekStart: "2026-09-01", scheduledHours: 20, absentDays: 0 },
      { weekStart: "2026-09-08", scheduledHours: 20, absentDays: 1 }, // 결근
      { weekStart: "2026-09-15", scheduledHours: 20, absentDays: 0 },
      { weekStart: "2026-09-22", scheduledHours: 20, absentDays: 0 },
    ],
  });

  it("개근한 3주치만 지급", () => {
    expect(result.earnings.find((e) => e.label === "주휴수당")?.amount).toBe(MIN_WAGE * 12);
  });

  it("빠진 이유를 사장님께 알린다", () => {
    expect(result.warnings.some((w) => w.message.includes("주휴수당이 빠진"))).toBe(true);
  });
});

describe("가산수당 — 5인 기준선", () => {
  const base = {
    period: "2026-09" as const,
    hourlyWage: 12_000,
    contractedWeeklyHours: 40,
    actualWorkedHours: 174,
    overtimeHours: 10,
    nightHours: 4,
    holidayHours: 10,
  };

  it("5인 이상이면 연장 1.5배·야간 1.5배·휴일 8h 이내 1.5배/초과 2배", () => {
    const r = calculatePayroll({ ...base, headcount: 5 });
    expect(r.earnings.find((e) => e.label === "연장근로수당")?.amount).toBe(12_000 * 10 * 1.5);
    expect(r.earnings.find((e) => e.label === "야간근로수당")?.amount).toBe(12_000 * 4 * 1.5);
    expect(r.earnings.find((e) => e.label === "휴일근로수당")?.amount).toBe(12_000 * 8 * 1.5);
    expect(r.earnings.find((e) => e.label === "휴일근로수당(8시간 초과)")?.amount).toBe(12_000 * 2 * 2);
  });

  it("5인 미만이면 가산 없이 통상임금만 — 다만 시간은 지급한다", () => {
    const r = calculatePayroll({ ...base, headcount: 4 });
    expect(r.earnings.find((e) => e.label === "연장근로수당")?.amount).toBe(12_000 * 10);
    expect(r.warnings.some((w) => w.message.includes("가산"))).toBe(true);
  });

  it("연장·야간·휴일은 시간 수를 명세서에 적는다 (근기법 §48②)", () => {
    const r = calculatePayroll({ ...base, headcount: 5 });
    for (const label of ["연장근로수당", "야간근로수당", "휴일근로수당"]) {
      expect(r.earnings.find((e) => e.label === label)?.hours).toBeGreaterThan(0);
    }
  });
});

describe("최저임금 위반 탐지", () => {
  it("시급이 최저임금보다 낮으면 위반으로 표시", () => {
    const r = calculatePayroll({
      period: "2026-09", headcount: 3,
      hourlyWage: 9_000, contractedWeeklyHours: 20, actualWorkedHours: 80,
    });
    const v = r.warnings.find((w) => w.level === "violation");
    expect(v).toBeDefined();
    expect(v!.law).toContain("최저임금법");
  });

  it("월급제도 통상시급으로 환산해 본다", () => {
    // 주 40시간인데 월 200만원 → 시급 9,569원 < 10,320원
    const r = calculatePayroll({
      period: "2026-09", headcount: 3,
      monthlyBaseSalary: 2_000_000, contractedWeeklyHours: 40,
    });
    expect(r.warnings.some((w) => w.level === "violation")).toBe(true);
  });
});

describe("월급제는 주휴를 두 번 주지 않는다", () => {
  it("209시간에 주휴가 이미 들어 있으므로 별도 주휴 항목이 없다", () => {
    const r = calculatePayroll({
      period: "2026-09", headcount: 3,
      monthlyBaseSalary: 2_500_000, contractedWeeklyHours: 40,
      weeks: [0, 1, 2, 3].map((i) => ({ weekStart: `2026-09-0${i + 1}`, scheduledHours: 40, absentDays: 0 })),
    });
    expect(r.earnings.find((e) => e.label === "주휴수당")).toBeUndefined();
  });
});

describe("4대보험", () => {
  it("주 15시간 미만은 국민연금·건강보험을 공제하지 않는다", () => {
    const r = calculatePayroll({
      period: "2026-09", headcount: 3,
      hourlyWage: MIN_WAGE, contractedWeeklyHours: 12, actualWorkedHours: 48,
    });
    expect(r.deductions.find((d) => d.label === "국민연금")).toBeUndefined();
    expect(r.deductions.find((d) => d.label === "건강보험")).toBeUndefined();
    expect(r.deductions.find((d) => d.label === "고용보험")).toBeDefined();
  });

  it("국민연금은 기준소득월액 상한(659만원)을 넘지 않는다", () => {
    const r = calculatePayroll({
      period: "2026-09", headcount: 10,
      monthlyBaseSalary: 12_000_000, contractedWeeklyHours: 40,
    });
    const pension = r.deductions.find((d) => d.label === "국민연금")!.amount;
    expect(pension).toBe(Math.round(6_590_000 * 0.0475));
  });

  it("미가입이면 공제하지 않되 위반으로 알린다", () => {
    const r = calculatePayroll({
      period: "2026-09", headcount: 3, insuranceEnrolled: false,
      hourlyWage: MIN_WAGE, contractedWeeklyHours: 20, actualWorkedHours: 80,
    });
    // 4대보험 항목만 빠진다. 소득세 원천징수 의무는 가입 여부와 무관하게 남는다.
    for (const label of ["국민연금", "건강보험", "장기요양보험", "고용보험"]) {
      expect(r.deductions.find((d) => d.label === label)).toBeUndefined();
    }
    expect(r.employerBurdenTotal).toBe(0);
    expect(r.warnings.some((w) => w.level === "violation" && w.message.includes("4대보험"))).toBe(true);
  });
});

describe("소득세 추정 — 현실적인 범위인가", () => {
  it("월 200만원 1인은 매우 적다 (3% 정률이면 6만원이 나온다)", () => {
    const tax = estimateMonthlyIncomeTax({
      monthlyTaxableGross: 2_000_000, dependents: 1, monthlyPensionPremium: 95_000,
    });
    expect(tax).toBeLessThan(30_000);
  });

  it("월 500만원 1인은 월 200만원보다 확실히 많다", () => {
    const low = estimateMonthlyIncomeTax({ monthlyTaxableGross: 2_000_000, dependents: 1, monthlyPensionPremium: 95_000 });
    const high = estimateMonthlyIncomeTax({ monthlyTaxableGross: 5_000_000, dependents: 1, monthlyPensionPremium: 237_500 });
    expect(high).toBeGreaterThan(low * 5);
  });

  it("부양가족이 늘면 세금이 줄어든다", () => {
    const one = estimateMonthlyIncomeTax({ monthlyTaxableGross: 3_000_000, dependents: 1, monthlyPensionPremium: 142_500 });
    const three = estimateMonthlyIncomeTax({ monthlyTaxableGross: 3_000_000, dependents: 3, monthlyPensionPremium: 142_500 });
    expect(three).toBeLessThan(one);
  });

  it("음수가 나오지 않는다", () => {
    expect(estimateMonthlyIncomeTax({ monthlyTaxableGross: 500_000, dependents: 4, monthlyPensionPremium: 19_000 })).toBe(0);
  });
});

describe("정직성 — 무엇이 확정이고 무엇이 추정인지 말한다", () => {
  const r = calculatePayroll({
    period: "2026-09", headcount: 3,
    hourlyWage: MIN_WAGE, contractedWeeklyHours: 20, actualWorkedHours: 80,
    weeks: [{ weekStart: "2026-09-01", scheduledHours: 20, absentDays: 0 }],
  });

  it("지급항목·4대보험은 확정으로 표시", () => {
    expect(r.confidence.exact).toContain("기본급");
    expect(r.confidence.exact).toContain("주휴수당");
    expect(r.confidence.exact).toContain("국민연금");
  });

  it("소득세는 추정으로 표시하고 이유를 적는다", () => {
    const est = r.confidence.estimated.find((e) => e.item.includes("소득세"));
    expect(est).toBeDefined();
    expect(est!.why).toContain("간이세액표");
  });

  it("실지급액 = 지급 총액 − 공제 총액", () => {
    expect(r.netPay).toBe(r.grossPay - r.deductionTotal);
  });

  it("사업주 총비용 = 지급 총액 + 사업주 부담", () => {
    expect(r.totalEmployerCost).toBe(r.grossPay + r.employerBurdenTotal);
  });
});
