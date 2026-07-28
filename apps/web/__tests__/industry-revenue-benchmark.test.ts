import { describe, it, expect } from "vitest";
import {
  CATEGORY_REVENUE_BENCHMARK,
  REVENUE_BANDS,
  REVENUE_BENCHMARK_SOURCE,
  compareBandToBenchmark,
} from "../../../packages/shared/src/industry-revenue-benchmark";
import { CATEGORY_OFFERING_FALLBACK } from "../../../packages/shared/src/offering-kinds";

/**
 * 벤치마크 SSOT 가드 —
 *  1) 커버리지: 카테고리 정본 전체가 명시적으로 선언(값 또는 null) — 암묵 누락 금지
 *  2) 원문 대조: 중기부 2023 잠정 보도자료 수치(연매출 백만원) 고정 — 무단 변경 시 실패
 *  3) 파생 무결성: 월값 = 연÷12 반올림
 *  4) 정직성: null 카테고리는 비교 결과도 null (카드 미표시)
 */

describe("industry-revenue-benchmark", () => {
  it("카테고리 정본 전체가 명시 선언되어 있다 (값 또는 null)", () => {
    const canonical = Object.keys(CATEGORY_OFFERING_FALLBACK);
    const missing = canonical.filter((c) => !(c in CATEGORY_REVENUE_BENCHMARK));
    expect(missing, `벤치마크 미선언: ${missing.join(", ")}`).toEqual([]);
  });

  it("원문 수치 고정 — 중기부 2023 잠정 (연매출 백만원)", () => {
    expect(CATEGORY_REVENUE_BENCHMARK["food"]?.annualRevenueMillionKrw).toBe(151);
    expect(CATEGORY_REVENUE_BENCHMARK["retail"]?.annualRevenueMillionKrw).toBe(260);
    expect(CATEGORY_REVENUE_BENCHMARK["education"]?.annualRevenueMillionKrw).toBe(75);
    expect(CATEGORY_REVENUE_BENCHMARK["fitness"]?.annualRevenueMillionKrw).toBe(92);
    expect(CATEGORY_REVENUE_BENCHMARK["beauty"]?.annualRevenueMillionKrw).toBe(67);
    expect(REVENUE_BENCHMARK_SOURCE.publisher).toBe("중소벤처기업부");
  });

  it("월값 파생 무결성 — 연매출(백만원)×100÷12 반올림(만원)", () => {
    for (const [cat, b] of Object.entries(CATEGORY_REVENUE_BENCHMARK)) {
      if (!b) continue;
      expect(b.monthlyRevenueManwon, cat).toBe(Math.round((b.annualRevenueMillionKrw * 100) / 12));
    }
    // 숙박·음식점 151백만/년 → 월 1,258만원
    expect(CATEGORY_REVENUE_BENCHMARK["food"]?.monthlyRevenueManwon).toBe(1258);
  });

  it("구간 비교 3단 판정 — 평균만으로 가능한 주장까지만", () => {
    // 카페(평균 월 1,258만): 800~1,500 구간은 평균과 겹침 / 3,000~5,000은 위 / 300 미만은 아래
    expect(compareBandToBenchmark("cafe-dessert", "800-1500")?.position).toBe("overlaps");
    expect(compareBandToBenchmark("cafe-dessert", "3000-5000")?.position).toBe("above");
    expect(compareBandToBenchmark("cafe-dessert", "lt300")?.position).toBe("below");
  });

  it("벤치마크 없는 카테고리(스타트업·온라인·공간)는 비교도 null — 카드 미표시", () => {
    expect(compareBandToBenchmark("startup-tech", "800-1500")).toBeNull();
    expect(compareBandToBenchmark("online-digital", "800-1500")).toBeNull();
    expect(compareBandToBenchmark("space", "800-1500")).toBeNull();
  });

  it("매출 구간 6종은 경계가 연속이다", () => {
    for (let i = 1; i < REVENUE_BANDS.length; i++) {
      expect(REVENUE_BANDS[i].minManwon).toBe(REVENUE_BANDS[i - 1].maxManwon);
    }
    expect(REVENUE_BANDS[REVENUE_BANDS.length - 1].maxManwon).toBeNull();
  });
});
