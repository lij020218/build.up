import { describe, expect, it } from "vitest";
import {
  calculateHiringCost,
  checkMinimumWage,
  hourlyToMonthly,
  MINIMUM_WAGE_2026,
} from "../finance/hiring-cost";

// D2 인건비 회귀테스트 — calculateHiringCost 전체 분해(급여+주휴+4대보험+퇴직금) 잠금.
// 요율 변경(INSURANCE_RATES_2026)·계산식 회귀를 즉시 감지. 기존 employer-insurance-rate.test 는
// 요율 SSOT만 잠갔고, 본 테스트는 *최종 사업주 비용 산출*까지 잠근다.

describe("calculateHiringCost — 정규직 월 200만원 (주 40h, 주휴 포함)", () => {
  const r = calculateHiringCost({ monthlySalary: 2_000_000, weeklyHours: 40 });

  it("주휴수당 = 기본급 × 8/40 = 40만원, 총지급 240만원", () => {
    expect(r.weeklyHolidayPay).toBe(400_000);
    expect(r.totalGross).toBe(2_400_000);
  });

  it("사업주 4대보험 분해 (총지급 240만 기준)", () => {
    expect(r.pension).toBe(114_000); // 4.75%
    expect(r.health).toBe(86_280); // 3.595%
    expect(r.longTermCare).toBe(11_337); // 건보 × 13.14%
    expect(r.employment).toBe(27_600); // 실업0.9 + 고용안정0.25 = 1.15%
    expect(r.accident).toBe(16_800); // 0.7%
    expect(r.totalInsuranceEmployer).toBe(256_017);
  });

  it("퇴직금 월 적립 = 총지급 / 12 = 20만원", () => {
    expect(r.severanceMonthly).toBe(200_000);
  });

  it("사업주 총비용 월 2,856,017 / 연 34,272,204", () => {
    expect(r.totalEmployerCostMonthly).toBe(2_856_017);
    expect(r.totalEmployerCostAnnual).toBe(34_272_204);
  });

  it("사업주 보험부담률 ≈ 기본급의 12.8%, 총오버헤드 ≈ 42.8%", () => {
    expect(r.insuranceRatio).toBeCloseTo(12.8, 1);
    expect(r.totalOverheadRatio).toBeCloseTo(42.8, 1);
  });
});

describe("calculateHiringCost — 초단시간 (주 10h) 주휴 미적용", () => {
  const r = calculateHiringCost({ monthlySalary: 500_000, weeklyHours: 10 });
  it("주 15h 미만 → 주휴수당 0, 총지급 = 기본급", () => {
    expect(r.weeklyHolidayPay).toBe(0);
    expect(r.totalGross).toBe(500_000);
  });
});

describe("최저임금 (MINIMUM_WAGE_2026 SSOT)", () => {
  it("최저시급 월환산 미만 급여는 미준수로 판정", () => {
    const minMonthly = hourlyToMonthly(MINIMUM_WAGE_2026, 40);
    const below = checkMinimumWage(minMonthly - 100_000, 40);
    expect(below.compliant).toBe(false);
    expect(below.shortfall).toBeGreaterThan(0);
    const ok = checkMinimumWage(minMonthly + 100_000, 40);
    expect(ok.compliant).toBe(true);
    expect(ok.shortfall).toBe(0);
  });
});
