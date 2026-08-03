import { describe, it, expect } from "vitest";
import {
  assessMarketingSpend,
  getMarketingBudgetBenchmark,
  MIN_REVENUE_FOR_ASSESSMENT_WON,
} from "../marketing-budget-benchmarks";

describe("marketing-budget-benchmarks", () => {
  it("외식업은 3~6%, 신규 개업은 5~10% 구간을 쓴다", () => {
    const b = getMarketingBudgetBenchmark("food");
    expect(b.lowPct).toBe(3);
    expect(b.highPct).toBe(6);
    expect(b.newBiz).toEqual({ lowPct: 5, highPct: 10 });
  });

  it("미등록 업종은 SBA 일반 기준(7~8%)으로 폴백", () => {
    const b = getMarketingBudgetBenchmark("beauty");
    expect(b.lowPct).toBe(7);
    expect(b.highPct).toBe(8);
    expect(getMarketingBudgetBenchmark(null).lowPct).toBe(7);
  });

  it("매출이 최소치 미만이면 판정하지 않는다 (null — 노이즈 방지)", () => {
    expect(
      assessMarketingSpend({ spendWon: 0, revenueWon: MIN_REVENUE_FOR_ASSESSMENT_WON - 1, categoryId: "food", isNewBiz: false }),
    ).toBeNull();
  });

  it("지출 0 + 매출 존재 = below (지출 0이 곧 경고 대상)", () => {
    const a = assessMarketingSpend({ spendWon: 0, revenueWon: 5_000_000, categoryId: "food", isNewBiz: false });
    expect(a?.band).toBe("below");
    expect(a?.pct).toBe(0);
  });

  it("외식 매출 1,000만원 · 지출 40만원 = 4% → within", () => {
    const a = assessMarketingSpend({ spendWon: 400_000, revenueWon: 10_000_000, categoryId: "food", isNewBiz: false });
    expect(a?.pct).toBe(4);
    expect(a?.band).toBe("within");
  });

  it("신규 개업 외식은 5~10% 구간으로 판정 — 4%면 below", () => {
    const a = assessMarketingSpend({ spendWon: 400_000, revenueWon: 10_000_000, categoryId: "food", isNewBiz: true });
    expect(a?.band).toBe("below");
    expect(a?.lowPct).toBe(5);
    expect(a?.isNewBiz).toBe(true);
  });

  it("상한 초과는 above (경고 아님 — 정보 표시용)", () => {
    const a = assessMarketingSpend({ spendWon: 1_500_000, revenueWon: 10_000_000, categoryId: "food", isNewBiz: false });
    expect(a?.band).toBe("above");
  });
});
