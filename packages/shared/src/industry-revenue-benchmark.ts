/**
 * 업종 월매출 벤치마크 SSOT — 온보딩 첫 진단 "업종 평균 대비" 카드의 유일한 데이터 소스.
 *
 * 출처 (원문 PDF 실확인, 2026-07-28):
 *   중소벤처기업부 「2023년 소상공인실태조사 잠정결과 발표」 (2025-02-27 보도자료)
 *   - 기업체당 연간 매출액(백만원): 전체 평균 199 / 제조 407 / 도·소매 260 /
 *     숙박·음식점 151 / 교육서비스 75 / 예술·스포츠·여가 92 / 수리·기타서비스 67
 *   - ⚠️ 2024년 기준 조사부터 매출 항목이 설문에서 제외됨(국세청 자료로 전환 예정)
 *     → 이 잠정치가 업종별 매출의 최신 공식 수치. 국세청 기반 통계가 나오면 교체.
 *
 * 정직성 규칙:
 *   1) 값은 **평균(mean)** — 분위·중앙값 아님. "상위 N%" 류 주장 절대 금지.
 *      비교 표현은 "업종 평균보다 높은/겹치는/낮은 구간" 3단까지만.
 *   2) 월값은 연매출 ÷ 12 파생 — UI 에 "연매출 기준 환산" 표기.
 *   3) 매핑 없는 카테고리(null)는 벤치마크 카드 자체를 렌더하지 않는다 (빈 카드 금지).
 *   4) 대분류 통계이므로 카드에 통계 업종명(kstatIndustry)을 함께 표기 — 카페 사장님에게
 *      "숙박·음식점업 평균"임을 숨기지 않는다.
 */

export const REVENUE_BENCHMARK_SOURCE = {
  name: "소상공인실태조사 2023년 (잠정)",
  publisher: "중소벤처기업부",
  publishedAt: "2025-02-27",
  caveat: "기업체당 연매출 평균 · 모집단 개편으로 전년 비교 불가 · 평균값(중앙값 아님)",
} as const;

export type IndustryRevenueBenchmark = {
  /** 통계 대분류명 — UI 에 반드시 함께 표기 */
  kstatIndustry: string;
  /** 기업체당 연매출 (백만원, 원문 수치) */
  annualRevenueMillionKrw: number;
  /** 파생: 월평균 매출 (만원, 연÷12 반올림) — UI "연매출 기준 환산" 표기 필수 */
  monthlyRevenueManwon: number;
};

const bench = (kstatIndustry: string, annualMillion: number): IndustryRevenueBenchmark => ({
  kstatIndustry,
  annualRevenueMillionKrw: annualMillion,
  monthlyRevenueManwon: Math.round((annualMillion * 100) / 12), // 백만원→만원 환산 후 ÷12
});

/**
 * 카테고리 → 표준산업 대분류 매핑. null = 공식 통계에 대응 대분류 없음 → 카드 미표시.
 *  - food·cafe-dessert → I. 숙박·음식점업
 *  - retail → G. 도·소매업
 *  - beauty·living-service·pet → S. 수리·기타서비스업 (미용·세탁·반려 미용 등 기타 개인서비스)
 *  - fitness → R. 예술·스포츠·여가업
 *  - education → P. 교육서비스업
 *  - space·online-digital·startup-tech → 대응 없음 (부동산·정보통신은 성격 이질 — 위조 금지)
 */
export const CATEGORY_REVENUE_BENCHMARK: Record<string, IndustryRevenueBenchmark | null> = {
  "food":           bench("숙박·음식점업", 151),
  "cafe-dessert":   bench("숙박·음식점업", 151),
  "retail":         bench("도·소매업", 260),
  "beauty":         bench("수리·기타서비스업", 67),
  "living-service": bench("수리·기타서비스업", 67),
  "pet":            bench("수리·기타서비스업", 67),
  "fitness":        bench("예술·스포츠·여가업", 92),
  "education":      bench("교육서비스업", 75),
  "space":          null,
  "online-digital": null,
  "startup-tech":   null,
};

/** 온보딩 월매출 구간 (만원) — 구간 vs 평균 비교에 사용 */
export type RevenueBand = { id: string; minManwon: number; maxManwon: number | null; label: { ko: string; en: string } };
export const REVENUE_BANDS: RevenueBand[] = [
  { id: "lt300",     minManwon: 0,    maxManwon: 300,  label: { ko: "300만원 미만", en: "Under ₩3M" } },
  { id: "300-800",   minManwon: 300,  maxManwon: 800,  label: { ko: "300~800만원", en: "₩3–8M" } },
  { id: "800-1500",  minManwon: 800,  maxManwon: 1500, label: { ko: "800~1,500만원", en: "₩8–15M" } },
  { id: "1500-3000", minManwon: 1500, maxManwon: 3000, label: { ko: "1,500~3,000만원", en: "₩15–30M" } },
  { id: "3000-5000", minManwon: 3000, maxManwon: 5000, label: { ko: "3,000~5,000만원", en: "₩30–50M" } },
  { id: "gte5000",   minManwon: 5000, maxManwon: null, label: { ko: "5,000만원 이상", en: "₩50M+" } },
];

export type BenchmarkPosition = "above" | "overlaps" | "below";

/**
 * 사용자 구간 vs 업종 평균 비교 — 3단까지만 (분위 데이터가 없으므로 그 이상 주장 금지).
 * 반환 null = 벤치마크 없음(카드 미표시) 또는 미지 구간.
 */
export function compareBandToBenchmark(
  categoryId: string | null | undefined,
  bandId: string | null | undefined,
): { position: BenchmarkPosition; benchmark: IndustryRevenueBenchmark } | null {
  if (!categoryId || !bandId) return null;
  const benchmark = CATEGORY_REVENUE_BENCHMARK[categoryId];
  if (!benchmark) return null;
  const band = REVENUE_BANDS.find((b) => b.id === bandId);
  if (!band) return null;
  const avg = benchmark.monthlyRevenueManwon;
  if (band.minManwon > avg) return { position: "above", benchmark };
  if (band.maxManwon !== null && band.maxManwon < avg) return { position: "below", benchmark };
  return { position: "overlaps", benchmark };
}
