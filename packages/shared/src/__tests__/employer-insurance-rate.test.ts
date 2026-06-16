import { describe, expect, it } from "vitest";
import { TOTAL_EMPLOYER_RATE_PCT, INSURANCE_RATES_2026 } from "../finance/hiring-cost";

// D1 회귀 가드 (2026-06-16) — StaffLaborCard·TeamCard 가 옛 매직넘버 0.1041(=10.41%, 고용안정 0.25% 누락)을
// 다시 쓰지 못하게 SSOT 값을 잠근다. 사업주 4대보험 부담률은 hiring-cost.ts 한 곳만 정본.
describe("사업주 4대보험 부담률 SSOT (TOTAL_EMPLOYER_RATE_PCT)", () => {
  it("국민연금4.75 + 건보3.595 + 장기요양0.4724 + 고용보험(실업0.9+고용안정0.25) + 산재0.7 = 10.6674%", () => {
    expect(TOTAL_EMPLOYER_RATE_PCT).toBeCloseTo(10.6674, 4);
  });

  it("고용안정·직업능력개발 0.25% 가 포함되어 있다 (옛 0.1041 거짓값과의 차이 = 정확히 0.25%p)", () => {
    expect(INSURANCE_RATES_2026.employmentStability.employer).toBe(0.0025);
    const legacyWrongPct = 10.41; // = 0.1041 × 100
    expect(TOTAL_EMPLOYER_RATE_PCT - legacyWrongPct).toBeCloseTo(0.2574, 3);
  });

  it("2,000,000원 임금의 사업주 보험 = SSOT 기준 ~213,348원 (옛 0.1041 의 208,200원이 아님)", () => {
    const wage = 2_000_000;
    const ssotInsurance = Math.round(wage * (TOTAL_EMPLOYER_RATE_PCT / 100));
    expect(ssotInsurance).toBe(213_348);
    const legacyInsurance = Math.round(wage * 0.1041);
    expect(ssotInsurance).toBeGreaterThan(legacyInsurance); // SSOT 가 옛 거짓값보다 큼(고용안정 포함)
  });
});
