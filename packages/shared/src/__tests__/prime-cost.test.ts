import { describe, expect, it } from "vitest";
import {
  enrichLaborCost,
  calculatePrimeCost,
  getPrimeCostBenchmark,
  toneFromPrime,
  toneFromCogs,
  toneFromLabor,
  LABOR_EMPLOYER_BURDEN_MULTIPLIER,
} from "../finance/prime-cost";

describe("enrichLaborCost (4대보험·퇴직금 사업주 부담 가산)", () => {
  it("hasEmployees=true 면 ~18.5% 가산", () => {
    expect(enrichLaborCost(1_000_000, true)).toBe(Math.round(1_000_000 * LABOR_EMPLOYER_BURDEN_MULTIPLIER));
  });
  it("hasEmployees=false 면 1인 운영으로 무가산", () => {
    expect(enrichLaborCost(1_000_000, false)).toBe(1_000_000);
  });
  it("alreadyIncludesBurden=true 면 over-count 방지로 무가산", () => {
    expect(enrichLaborCost(1_000_000, true, true)).toBe(1_000_000);
  });
  it("0 또는 음수 입력은 0 반환", () => {
    expect(enrichLaborCost(0, true)).toBe(0);
    expect(enrichLaborCost(-100, true)).toBe(0);
  });
});

describe("calculatePrimeCost (기간 일치 보장)", () => {
  it("정상 케이스 — 월 매출 1000만, 식자재 300만, 인건비 200만 (1인) → Prime 50%", () => {
    const r = calculatePrimeCost({
      ingredientPurchases: 3_000_000,
      laborBaseWages: 2_000_000,
      hasEmployees: false,
      totalRevenue: 10_000_000,
      days: 26,
      period: "month",
    });
    expect(r.ready).toBe(true);
    expect(r.cogsPct).toBe(30);
    expect(r.laborPct).toBe(20);
    expect(r.primePct).toBe(50);
  });

  it("직원 있으면 인건비 burden 자동 가산 (~18.5%)", () => {
    const r = calculatePrimeCost({
      ingredientPurchases: 3_000_000,
      laborBaseWages: 2_000_000,
      hasEmployees: true,
      totalRevenue: 10_000_000,
      days: 26,
      period: "month",
    });
    expect(r.enrichedLabor).toBe(Math.round(2_000_000 * LABOR_EMPLOYER_BURDEN_MULTIPLIER));
    expect(r.laborBurdenAmount).toBeGreaterThan(0);
    // labor 가 ~237만으로 늘어남 → laborPct ~ 23.7%
    expect(r.laborPct).toBeCloseTo(23.7, 1);
  });

  it("days < 7 → ready=false (표본 부족, 신고된 1375% 버그 차단)", () => {
    const r = calculatePrimeCost({
      ingredientPurchases: 3_000_000,
      laborBaseWages: 2_000_000,
      hasEmployees: false,
      totalRevenue: 400_000,
      days: 2,
      period: "week",
    });
    expect(r.ready).toBe(false);
    expect(r.notReadyReason).toBe("few-days");
    expect(r.primePct).toBe(0);
  });

  it("매출 표본 너무 작음 (< 비용/5) → ready=false", () => {
    // 비용 1000만 vs 월 환산 매출 26만 (1/40) → small-sample
    const r = calculatePrimeCost({
      ingredientPurchases: 5_000_000,
      laborBaseWages: 5_000_000,
      hasEmployees: false,
      totalRevenue: 100_000,   // 10일 합 10만 → 일평균 1만 → 월 환산 26만
      days: 10,
      period: "month",
    });
    expect(r.ready).toBe(false);
    expect(r.notReadyReason).toBe("small-sample");
  });

  it("매출 0 → ready=false (no-sales)", () => {
    const r = calculatePrimeCost({
      ingredientPurchases: 1_000_000, laborBaseWages: 1_000_000,
      hasEmployees: false, totalRevenue: 0, days: 7, period: "week",
    });
    expect(r.ready).toBe(false);
    expect(r.notReadyReason).toBe("no-sales");
  });

  it("주간 view 와 월간 view 의 비율은 동일 (분자·분모 같이 변환)", () => {
    const common = {
      ingredientPurchases: 3_000_000,
      laborBaseWages: 2_000_000,
      hasEmployees: false,
      totalRevenue: 10_000_000,
      days: 26,
    } as const;
    const weekly = calculatePrimeCost({ ...common, period: "week" });
    const monthly = calculatePrimeCost({ ...common, period: "month" });
    expect(weekly.primePct).toBeCloseTo(monthly.primePct, 5);
    // 절대 금액은 month/week 차이 (≈ 4.33배)
    expect(monthly.primeCostAmount).toBeGreaterThan(weekly.primeCostAmount * 4);
  });
});

describe("getPrimeCostBenchmark (업종별 한국 시장 출처)", () => {
  it("카페·디저트 — 식자재 낮음·인건비 높음", () => {
    const b = getPrimeCostBenchmark("cafe-dessert");
    expect(b.cogsTargetMax).toBeLessThan(35);
    expect(b.industryLabel.ko).toContain("카페");
  });
  it("외식(한식·일식 등) — Prime 60-65 적정, 식자재 35% 목표", () => {
    const b = getPrimeCostBenchmark("food");
    expect(b.primeIdealRange).toEqual([60, 65]);
    expect(b.cogsTargetMax).toBe(35);
  });
  it("치킨·QSR — 식자재 높음 허용, 인건비 낮음", () => {
    const b = getPrimeCostBenchmark("food", "chicken-burger");
    expect(b.laborTargetMax).toBeLessThanOrEqual(25);
  });
});

describe("tone 함수 — 벤치마크 대비 색조", () => {
  const bench = getPrimeCostBenchmark("food");
  it("프라임 적정 범위 안이면 'ok'", () => {
    expect(toneFromPrime(62, bench)).toBe("ok");
  });
  it("프라임 위험선 초과면 'critical'", () => {
    expect(toneFromPrime(75, bench)).toBe("critical");
  });
  it("식자재 목표값 이하면 'good'", () => {
    expect(toneFromCogs(30, bench)).toBe("good");
  });
  it("인건비 위험선 초과면 'critical'", () => {
    expect(toneFromLabor(40, bench)).toBe("critical");
  });
});
