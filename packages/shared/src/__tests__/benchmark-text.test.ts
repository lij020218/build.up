import { describe, expect, it } from "vitest";
import { benchmarkText } from "../finance/benchmark-text";

describe("benchmarkText — 원가율 계열 (COST_RATIO_THRESHOLDS 재사용)", () => {
  it("외식 식자재율 34% → 평균 35–45% 양호(good), source=industry", () => {
    const r = benchmarkText("food", "growth", "ingredientRatio", 34, "ko");
    expect(r).not.toBeNull();
    expect(r!.status).toBe("good");
    expect(r!.source).toBe("industry");
    expect(r!.rangeLabel).toBe("35–45%");
    expect(r!.myLabel).toBe("34%");
    expect(r!.narrative).toContain("외식 평균 식자재율");
    expect(r!.narrative).toContain("양호");
  });

  it("외식 식자재율 38% → caution → watch(주의)", () => {
    const r = benchmarkText("food", undefined, "ingredientRatio", 38, "ko");
    expect(r!.status).toBe("watch");
  });

  it("외식 식자재율 50% → critical → risk(관리 필요)", () => {
    const r = benchmarkText("food", "scale", "ingredientRatio", 50, "ko");
    expect(r!.status).toBe("risk");
    expect(r!.narrative).toContain("관리 필요");
  });

  it("영문 요청 시 영문 narrative 반환", () => {
    const r = benchmarkText("food", "growth", "ingredientRatio", 34, "en");
    expect(r!.narrative).toMatch(/Restaurant avg\. food-cost ratio/);
    expect(r!.narrative).toMatch(/good/);
  });

  it("category 느슨 매칭: cafe-dessert → 카페 그룹", () => {
    const r = benchmarkText("cafe-dessert", "seed", "ingredientRatio", 32, "ko");
    expect(r!.narrative).toContain("카페 평균");
  });

  // 같은 인건비 38% 라도 미용(디자이너 커미션 구조)은 양호, 일반 서비스업은 주의 — 그룹 분리 효과 검증
  it("미용은 service 와 별도 그룹: 인건비 38% → 미용 평균 45–65% 양호", () => {
    const r = benchmarkText("beauty-salon", "growth", "laborRatio", 38, "ko");
    expect(r).not.toBeNull();
    expect(r!.narrative).toContain("미용 평균 인건비율");
    expect(r!.rangeLabel).toBe("45–65%");
    expect(r!.status).toBe("good"); // 38 ≤ healthy(45) → healthy → good
  });

  it("일반 서비스업(필라테스)은 service 그룹 유지: 인건비 38% → 35–55% 주의", () => {
    const r = benchmarkText("fitness", "growth", "laborRatio", 38, "ko");
    expect(r!.narrative).toContain("서비스업 평균 인건비율");
    expect(r!.rangeLabel).toBe("35–55%");
    expect(r!.status).toBe("watch"); // 38 > healthy(35), ≤ caution(45) → caution → watch
  });
});

describe("benchmarkText — 영업이익률 (COMMON_THRESHOLDS, higherIsBetter)", () => {
  it("영업이익률 12% → ≥10% 양호", () => {
    const r = benchmarkText("food", "growth", "operatingMargin", 12, "ko");
    expect(r!.status).toBe("good");
    expect(r!.rangeLabel).toBe("≥10%");
  });

  it("영업이익률 -3% → critical → risk", () => {
    const r = benchmarkText("retail", "growth", "operatingMargin", -3, "ko");
    expect(r!.status).toBe("risk");
  });
});

describe("benchmarkText — 월매출 (INDUSTRY_BENCHMARKS 평균 기반, food=월 1,950만원)", () => {
  it("월 2,500만원 → 평균 +28% → good", () => {
    const r = benchmarkText("food", "scale", "monthlyRevenue", 2500, "ko");
    expect(r!.status).toBe("good");
    expect(r!.rangeLabel).toContain("1,950만원");
    expect(r!.myLabel).toContain("2,500만원");
  });

  it("월 1,000만원 → 평균의 51% → risk", () => {
    const r = benchmarkText("food", "growth", "monthlyRevenue", 1000, "ko");
    expect(r!.status).toBe("risk");
  });

  it("월 1,900만원 → 평균권(±15%) → watch", () => {
    const r = benchmarkText("food", "growth", "monthlyRevenue", 1900, "ko");
    expect(r!.status).toBe("watch");
  });
});

describe("benchmarkText — 가짜숫자 0 (벤치마크 없으면 null)", () => {
  it("general 그룹에 배달수수료 기준 없음 → null (미표시)", () => {
    // 알 수 없는 업종 → general 그룹, general 에는 delivery 임계값 없음
    expect(benchmarkText("totally-unknown-biz", "seed", "deliveryRatio", 20, "ko")).toBeNull();
  });

  it("NaN/Infinity 입력 → null", () => {
    expect(benchmarkText("food", "growth", "ingredientRatio", NaN, "ko")).toBeNull();
    expect(benchmarkText("food", "growth", "ingredientRatio", Infinity, "ko")).toBeNull();
  });

  it("월매출 벤치마크 없는 category → null", () => {
    expect(benchmarkText("nonexistent-cat-xyz", "seed", "monthlyRevenue", 1000, "ko")).toBeNull();
  });
});
