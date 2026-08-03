/**
 * 마케팅 예산 벤치마크 SSOT (2026-08-03 신설, 사장님 지시).
 *
 * 용도: 마케팅 장부에서 "이달 지출이 매출 대비 너무 낮으면" 경고.
 *  웹 MarketingSurface · iOS MarketingView 가 같은 수치·같은 문구 기준을 쓴다.
 *
 * 정직성 경계 (조사 2026-08-03):
 *  - 한국 소상공인 "매출 대비 마케팅비" 공식 통계는 존재하지 않는다 — 있는 척 금지.
 *  - 아래 수치는 미국 업계 통용 기준이며, 출처를 함께 표시한다:
 *    · 외식업 3~6% (신규 개업 5~10%) — backofhouse.io / WebFX 외 다수 통용
 *    · 일반 소기업 7~8% (연매출 $5M 미만) — U.S. SBA 권고
 *  - 코호트 전환 계획: 사용자 장부 데이터가 쌓이면 같은 인터페이스로
 *    "우리 사용자 동종업계 실측 분포" 소스로 교체한다 (industry-revenue-benchmark 패턴).
 */

export type MarketingBudgetBenchmark = {
  /** 매출 대비 권장 하한 % */
  lowPct: number;
  /** 매출 대비 권장 상한 % */
  highPct: number;
  /** 신규 개업(12개월 이내) 구간 — 자료가 구분해줄 때만 존재 */
  newBiz?: { lowPct: number; highPct: number };
  /** 출처 표기 — "미국 외식업계 통용 기준" 처럼 국가·성격을 숨기지 않는다 */
  sourceLabelKo: string;
  sourceLabelEn: string;
  sourceUrl: string;
};

const RESTAURANT_BENCHMARK: MarketingBudgetBenchmark = {
  lowPct: 3,
  highPct: 6,
  newBiz: { lowPct: 5, highPct: 10 },
  sourceLabelKo: "미국 외식업계 통용 기준",
  sourceLabelEn: "US restaurant industry norm",
  sourceUrl: "https://backofhouse.io/resources/whats-an-average-restaurant-marketing-budget",
};

const SBA_BENCHMARK: MarketingBudgetBenchmark = {
  lowPct: 7,
  highPct: 8,
  sourceLabelKo: "미국 중소기업청(SBA) 권고",
  sourceLabelEn: "U.S. SBA guideline",
  sourceUrl: "https://www.crestmontcapital.com/blog/marketing-spend-benchmarks-small-business",
};

/** industryCategoryId → 벤치마크. 등록 안 된 업종은 SBA 일반 기준. */
const BY_CATEGORY: Record<string, MarketingBudgetBenchmark> = {
  food: RESTAURANT_BENCHMARK,
  "cafe-dessert": RESTAURANT_BENCHMARK,
};

export function getMarketingBudgetBenchmark(categoryId: string | null | undefined): MarketingBudgetBenchmark {
  return (categoryId && BY_CATEGORY[categoryId]) || SBA_BENCHMARK;
}

export type MarketingSpendAssessment = {
  /** 이달 지출 ÷ 이달 매출 (%) — 소수 1자리 반올림 */
  pct: number;
  band: "below" | "within" | "above";
  /** 실제 비교에 쓴 구간 (신규 개업이면 newBiz 구간) */
  lowPct: number;
  highPct: number;
  isNewBiz: boolean;
  benchmark: MarketingBudgetBenchmark;
};

/** 판정에 필요한 최소 월매출 — 이보다 적으면 비율이 노이즈라 판정하지 않는다(null). */
export const MIN_REVENUE_FOR_ASSESSMENT_WON = 500_000;

/**
 * 이달 지출 수준 판정. 매출이 없거나 최소치 미만이면 null (판정 불가 = 표시 안 함).
 * spendWon 0 도 매출이 있으면 "below" 로 판정한다 — 지출 0 이 곧 경고 대상.
 */
export function assessMarketingSpend(input: {
  spendWon: number;
  revenueWon: number;
  categoryId: string | null | undefined;
  isNewBiz: boolean;
}): MarketingSpendAssessment | null {
  const { spendWon, revenueWon, categoryId, isNewBiz } = input;
  if (!Number.isFinite(revenueWon) || revenueWon < MIN_REVENUE_FOR_ASSESSMENT_WON) return null;
  const benchmark = getMarketingBudgetBenchmark(categoryId);
  const range = isNewBiz && benchmark.newBiz ? benchmark.newBiz : benchmark;
  const pct = Math.round((Math.max(0, spendWon) / revenueWon) * 1000) / 10;
  const band = pct < range.lowPct ? "below" : pct > range.highPct ? "above" : "within";
  return { pct, band, lowPct: range.lowPct, highPct: range.highPct, isNewBiz: isNewBiz && !!benchmark.newBiz, benchmark };
}
