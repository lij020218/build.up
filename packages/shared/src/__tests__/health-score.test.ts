import { describe, expect, it } from "vitest";
import {
  calculateHealthScore,
  gradeFromHealthScore,
  HEALTH_SCORE_TIER,
} from "../finance/health-score";

describe("gradeFromScore", () => {
  it("70+ → healthy", () => {
    expect(gradeFromHealthScore(85)).toBe("healthy");
    expect(gradeFromHealthScore(70)).toBe("healthy");
  });
  it("45-70 → caution", () => {
    expect(gradeFromHealthScore(60)).toBe("caution");
    expect(gradeFromHealthScore(45)).toBe("caution");
    expect(gradeFromHealthScore(69)).toBe("caution");
  });
  it("<45 → danger", () => {
    expect(gradeFromHealthScore(44)).toBe("danger");
    expect(gradeFromHealthScore(0)).toBe("danger");
  });
  it("invalid → unknown", () => {
    expect(gradeFromHealthScore(NaN)).toBe("unknown");
    expect(gradeFromHealthScore(-1)).toBe("unknown");
  });
  it("HEALTH_SCORE_TIER constants match grade boundaries", () => {
    expect(gradeFromHealthScore(HEALTH_SCORE_TIER.HEALTHY_MIN)).toBe("healthy");
    expect(gradeFromHealthScore(HEALTH_SCORE_TIER.HEALTHY_MIN - 1)).toBe("caution");
    expect(gradeFromHealthScore(HEALTH_SCORE_TIER.CAUTION_MIN)).toBe("caution");
    expect(gradeFromHealthScore(HEALTH_SCORE_TIER.CAUTION_MIN - 1)).toBe("danger");
  });
});

describe("calculateHealthScore — happy path (food)", () => {
  it("우수한 외식 사장님 — 모든 차원 좋음 → 건강", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 15_000_000,
      workingDays: 26,
      monthlyCosts: {
        ingredients: 4_500_000,
        labor: 4_000_000,
        rent: 1_500_000,
        utilities: 300_000,
      },
      hasEmployees: true,
      currentBalance: 30_000_000, // 런웨이 충분
      weeklySalesChangePct: 10, // 성장 중
      daysSinceLaunch: 90,
      initialCapital: 50_000_000,
    });
    expect(r.score).not.toBeNull();
    expect(r.score!).toBeGreaterThanOrEqual(70);
    expect(r.grade).toBe("healthy");
    expect(r.confidence).toBeGreaterThanOrEqual(80);
  });

  it("위기 외식 사장님 — 런웨이 부족 + 적자 → 위험", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 5_000_000,
      workingDays: 26,
      monthlyCosts: {
        ingredients: 3_000_000,
        labor: 3_500_000,
        rent: 2_000_000,
        utilities: 300_000,
      },
      hasEmployees: true,
      currentBalance: 1_000_000, // 런웨이 < 1개월
      weeklySalesChangePct: -20, // 매출 급락
      daysSinceLaunch: 60,
    });
    expect(r.score).not.toBeNull();
    expect(r.score!).toBeLessThan(45);
    expect(r.grade).toBe("danger");
  });
});

describe("calculateHealthScore — 차원별 null 처리 (가중치 재분배)", () => {
  it("통장 잔고 미입력 → cashSafety null, 나머지로 점수 산정", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 10_000_000,
      workingDays: 26,
      monthlyCosts: { ingredients: 3_000_000, labor: 2_500_000 },
      hasEmployees: true,
      currentBalance: 0, // 미입력
      weeklySalesChangePct: 5,
      daysSinceLaunch: 60,
    });
    expect(r.score).not.toBeNull();
    const cash = r.dimensions.find((d) => d.key === "cashSafety");
    expect(cash?.score).toBeNull();
    // 다른 차원은 산정됨
    expect(r.dimensions.find((d) => d.key === "profitability")?.score).not.toBeNull();
  });

  it("주간 추세 데이터 부족 (14일 미만 패턴) → salesTrend null", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 10_000_000,
      workingDays: 26,
      monthlyCosts: { ingredients: 3_000_000, labor: 2_500_000, rent: 1_500_000 },
      hasEmployees: true,
      currentBalance: 10_000_000,
      // weeklySalesChangePct undefined
      daysSinceLaunch: 60,
    });
    expect(r.score).not.toBeNull();
    expect(r.dimensions.find((d) => d.key === "salesTrend")?.score).toBeNull();
  });
});

describe("calculateHealthScore — 데이터 너무 부족", () => {
  it("매출·비용·잔고 모두 없음 → score null, missingData 안내", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 0,
      workingDays: 0,
      monthlyCosts: {},
      hasEmployees: false,
    });
    expect(r.score).toBeNull();
    expect(r.grade).toBe("unknown");
    expect(r.missingDataKo.length).toBeGreaterThan(0);
  });

  it("매출 7일 미만 → ratios.ready=false → profitability/costEfficiency null", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 500_000,
      workingDays: 3,
      monthlyCosts: { ingredients: 2_000_000, labor: 2_000_000, rent: 1_500_000 },
      hasEmployees: true,
      currentBalance: 5_000_000,
      daysSinceLaunch: 5,
    });
    // ratios.ready=false 라 profitability, costEfficiency null. 그래도 cashSafety 는 산정됨.
    expect(r.dimensions.find((d) => d.key === "profitability")?.score).toBeNull();
    expect(r.dimensions.find((d) => d.key === "costEfficiency")?.score).toBeNull();
    // cashSafety 산정됨 (잔고 + 비용 있으니 런웨이 계산 가능)
    expect(r.dimensions.find((d) => d.key === "cashSafety")?.score).not.toBeNull();
  });
});

describe("calculateHealthScore — 업종별 가중치 분기", () => {
  it("외식 — costEfficiency 가중치 0.25", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 10_000_000, workingDays: 26,
      monthlyCosts: { ingredients: 3_000_000, labor: 2_500_000, rent: 1_500_000 },
      hasEmployees: true, currentBalance: 10_000_000,
      weeklySalesChangePct: 0, daysSinceLaunch: 60,
    });
    const ce = r.dimensions.find((d) => d.key === "costEfficiency");
    expect(ce?.weight).toBeCloseTo(0.25, 2);
  });
  it("스타트업 — cashSafety 가중치 0.40 (최우선)", () => {
    const r = calculateHealthScore({
      industryCategoryId: "startup-tech",
      totalRevenue: 10_000_000, workingDays: 26,
      monthlyCosts: { labor: 5_000_000, rent: 1_000_000 },
      hasEmployees: true, currentBalance: 50_000_000,
      weeklySalesChangePct: 20, daysSinceLaunch: 90,
    });
    const cash = r.dimensions.find((d) => d.key === "cashSafety");
    expect(cash?.weight).toBeCloseTo(0.40, 2);
  });
  it("온라인 — salesTrend 가중치 0.25 (성장 강조)", () => {
    const r = calculateHealthScore({
      industryCategoryId: "online-digital",
      totalRevenue: 20_000_000, workingDays: 30,
      monthlyCosts: { ingredients: 8_000_000, marketing: 3_000_000 },
      hasEmployees: false, currentBalance: 20_000_000,
      weeklySalesChangePct: 15, daysSinceLaunch: 180,
    });
    const trend = r.dimensions.find((d) => d.key === "salesTrend");
    expect(trend?.weight).toBeCloseTo(0.25, 2);
  });
});

describe("calculateHealthScore — confidence 산정", () => {
  it("매출 30일+ + 잔고 + 비용 모두 입력 → confidence 100", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 10_000_000, workingDays: 30,
      monthlyCosts: { ingredients: 3_000_000, labor: 2_500_000 },
      hasEmployees: true, currentBalance: 10_000_000,
      daysSinceLaunch: 60,
    });
    expect(r.confidence).toBe(100);
  });
  it("매출 26일 + 잔고 + 비용 → confidence 89 (26/30 × 80 + 20)", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 10_000_000, workingDays: 26,
      monthlyCosts: { ingredients: 3_000_000, labor: 2_500_000 },
      hasEmployees: true, currentBalance: 10_000_000,
      daysSinceLaunch: 60,
    });
    expect(r.confidence).toBeGreaterThanOrEqual(85);
    expect(r.confidence).toBeLessThan(100);
  });
  it("매출 3일치만 입력 + 잔고/비용 X → confidence 매우 낮음", () => {
    const r = calculateHealthScore({
      industryCategoryId: "food",
      totalRevenue: 300_000, workingDays: 3,
      monthlyCosts: {},
      hasEmployees: false,
      daysSinceLaunch: 5,
    });
    expect(r.confidence).toBeLessThan(15);
  });
});
