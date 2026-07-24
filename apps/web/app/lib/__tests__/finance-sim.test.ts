import { describe, it, expect } from "vitest";
import { projectTwelveMonths } from "../finance-sim";

/** 12개월 재무 투영 회귀 가드 (2026-07-24 재무 페이지). 수식 = 월 산술, 경계값 전수. */

const base = {
  startCash: 10_000_000,      // 1,000만
  monthlySales: 20_000_000,   // 2,000만
  variableCostRatio: 0.3,     // 변동비 30%
  monthlyFixedCosts: 15_000_000, // 고정비 1,500만 → 월 순익 = 2000×0.7 − 1500 = −100만
  growthRatePct: 0,
};

describe("projectTwelveMonths", () => {
  it("기준: 월 순익 −100만 → 10개월차에 현금 소진", () => {
    const r = projectTwelveMonths(base);
    expect(r.points[0].net).toBe(-1_000_000);
    expect(r.points[0].endCash).toBe(9_000_000);
    // 10개월 후 누적 −1,000만 → 10개월차 endCash = 0 (음수 아님), 11개월차 −100만
    expect(r.points[9].endCash).toBe(0);
    expect(r.cashOutMonth).toBe(11);
    expect(r.shortfall).toBe(1_000_000);
    expect(r.breakEvenMonth).toBeNull(); // 성장 0% 라 흑자 전환 없음
  });

  it("성장 +3%: 매출 복리 증가 → 흑자 전환월 존재", () => {
    const r = projectTwelveMonths({ ...base, growthRatePct: 3 });
    // net_m = 2000×1.03^(m-1)×0.7 − 1500 ≥ 0 ⇔ 1.03^(m-1) ≥ 1.0714 ⇔ m−1 ≥ 2.34 → m = 4
    expect(r.breakEvenMonth).toBe(4);
    expect(r.points[11].sales).toBe(Math.round(20_000_000 * Math.pow(1.03, 11)));
  });

  it("이미 흑자면 breakEvenMonth = 1, 현금 소진 없음", () => {
    const r = projectTwelveMonths({ ...base, monthlyFixedCosts: 10_000_000 });
    expect(r.breakEvenMonth).toBe(1);
    expect(r.cashOutMonth).toBeNull();
    expect(r.shortfall).toBeNull();
    expect(r.finalCash).toBe(10_000_000 + 4_000_000 * 12);
  });

  it("경계: 매출 0 → 고정비만큼 감소, 1개월차 소진 가능", () => {
    const r = projectTwelveMonths({ ...base, monthlySales: 0, startCash: 5_000_000 });
    expect(r.points[0].net).toBe(-15_000_000);
    expect(r.cashOutMonth).toBe(1);
    expect(r.shortfall).toBe(10_000_000);
  });

  it("경계: 변동비율 1 초과 입력은 1로 클램프(방어)", () => {
    const r = projectTwelveMonths({ ...base, variableCostRatio: 1.5 });
    expect(r.points[0].net).toBe(-15_000_000); // 매출 전액 변동비 → 고정비만 적자
  });

  it("경계: 음수 시작현금·음수 고정비는 0 취급", () => {
    const r = projectTwelveMonths({ ...base, startCash: -100, monthlyFixedCosts: -5 });
    expect(r.points[0].endCash).toBe(14_000_000); // 0 + (2000×0.7 − 0)
  });

  it("성장 −2%: 매출 감소 복리", () => {
    const r = projectTwelveMonths({ ...base, growthRatePct: -2 });
    expect(r.points[11].sales).toBe(Math.round(20_000_000 * Math.pow(0.98, 11)));
    expect(r.breakEvenMonth).toBeNull();
  });
});
