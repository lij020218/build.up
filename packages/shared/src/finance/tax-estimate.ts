import { LEGAL } from "../constants/benchmarks"; // SSOT: 간이과세 기준 등 법정 수치

/**
 * 세금 간이 예상 SSOT (2026 기준) — 개인사업자 부가세·종합소득세 *개략* 추정.
 *
 *  ── 사용자 지시 (2026-07-22) ──────────────────────────────
 *  "세금 화면에서 세금 계산도 하게." — 흩어진 세무 자산(일정·공제)에 계산을 더한다.
 *  ────────────────────────────────────────────────
 *
 *  ⚠️ 절대 경계 (세금은 오차가 곧 신뢰 붕괴):
 *   · 이건 "예상 간이치" 이지 신고서 세액이 아니다. 매입세액·필요경비·소득공제·
 *     세액공제·누진구조가 전부 반영돼야 정확한데, 앱은 그 일부만 안다.
 *   · 따라서 **범위(range)로 안내**하고, "정확한 세액은 홈택스·세무사" 를 항상 병기.
 *   · 부가율·경비율은 업종코드(KSIC)로 결정 → 우리는 카테고리 대표값만 안다(홈택스 확인 유도).
 *   · [[labor-law-ssot]]·[[tax-credits-2026]] 와 동일 정직성: 금액 단정 금지.
 */

// ═══════════════════════════════════════════════════════════════
//   업종별 부가가치율 (간이과세 부가세 계산용) — 부가가치세법 시행령 §111 (2021.7~)
// ═══════════════════════════════════════════════════════════════
//
//  간이과세 납부세액 = 공급대가 × 업종별 부가가치율 × 10%.
//  ⚠️ 정확한 부가율은 사업자등록 업종코드 기준 — 아래는 카테고리 *대표값*(홈택스 확인 유도).

/** 카테고리 → 대표 부가가치율(%). 실제는 업종코드별 상이 → range 로 안내. */
const VAT_VALUE_ADDED_RATE_PCT: Record<string, number> = {
  food: 15,             // 음식점업 15%
  "cafe-dessert": 15,   // 음식점업(비알코올음료점) 15%
  retail: 15,           // 소매업 15%
  "online-digital": 15, // 통신판매 소매 15% (정보통신 성격이면 30%)
  beauty: 30,           // 그 밖의 서비스업 30% (개인서비스는 40%까지 — range 로)
  fitness: 30,
  education: 30,
  pet: 30,
  "living-service": 30, // 세탁·수리 등 서비스업 30%
  space: 25,            // 숙박 25% (부동산임대는 40%)
  "startup-tech": 30,   // 정보통신 30% (제조는 20%)
};

const DEFAULT_VAT_VALUE_ADDED_RATE_PCT = 30;

export function vatValueAddedRatePct(categoryId?: string | null): number {
  return (categoryId && VAT_VALUE_ADDED_RATE_PCT[categoryId]) || DEFAULT_VAT_VALUE_ADDED_RATE_PCT;
}

// ═══════════════════════════════════════════════════════════════
//   과세유형 판정 — 간이 vs 일반 (개인사업자)
// ═══════════════════════════════════════════════════════════════

export type TaxTypeVerdict = {
  /** 연매출 기준 간이과세 가능 여부 (법인·간이배제업종은 별도 — 여기선 매출 기준만) */
  simplifiedEligible: boolean;
  annualRevenueWon: number;
  thresholdWon: number;
  /** 임계까지 남은 매출(원). 음수 = 이미 초과(일반과세 전환 대상) */
  headroomWon: number;
  /** 안내 문구 */
  noteKo: string;
};

/**
 * 연매출 기준 과세유형 판정. 간이배제 업종(유흥·부동산매매 등)·법인은 매출 무관 일반과세라
 * 이 판정만으로 확정 금지 → note 에 배제 가능성 병기.
 */
export function classifyTaxType(annualRevenueWon: number): TaxTypeVerdict {
  const threshold = LEGAL.SIMPLIFIED_TAX_THRESHOLD; // 1억 400만
  const eligible = annualRevenueWon > 0 && annualRevenueWon < threshold;
  const headroom = threshold - annualRevenueWon;
  const noteKo = annualRevenueWon <= 0
    ? "매출을 기록하면 과세유형(간이/일반)을 판정해 드려요."
    : eligible
      ? `연매출 추정 ${manwon(annualRevenueWon)} — 간이과세 가능 구간(1억 400만 미만). 단 간이배제 업종·법인은 제외.`
      : `연매출 추정 ${manwon(annualRevenueWon)} — 일반과세 대상(1억 400만 이상). 매입세액 환급이 가능해요.`;
  return { simplifiedEligible: eligible, annualRevenueWon, thresholdWon: threshold, headroomWon: headroom, noteKo };
}

// ═══════════════════════════════════════════════════════════════
//   부가세 간이 예상 — 일반/간이, 범위로
// ═══════════════════════════════════════════════════════════════

export type VatEstimate = {
  taxType: "general" | "simplified";
  annualRevenueWon: number;
  /** 예상 연 부가세 하한~상한(원) — 매입세액·공제 가정 폭 */
  lowWon: number;
  highWon: number;
  valueAddedRatePct: number;
  noteKo: string;
};

/**
 * 부가세 연 예상.
 *  · 일반과세: 매출세액(공급가액×10%) − 매입세액. 매입세액을 모르므로 매입비율 30~60% 가정 → 범위.
 *  · 간이과세: 공급대가 × 부가율 × 10%. (세액공제·재고매입세액 미반영 → 상한 성격, 하한은 신용카드공제 반영)
 *  둘 다 "예상 범위" — 정확한 건 홈택스.
 */
export function estimateVat(annualRevenueWon: number, categoryId: string | null, simplified: boolean): VatEstimate {
  const rev = Math.max(0, Math.round(annualRevenueWon));
  const vatRate = vatValueAddedRatePct(categoryId);
  if (simplified) {
    // 간이: 공급대가 × 부가율 × 10%. 신용카드 발행세액공제(1.3%)로 하한 낮아짐.
    const base = Math.round((rev * vatRate / 100) * 0.1);
    const creditFloor = Math.round(base - rev * 0.013); // 발행세액공제 반영 하한(음수면 0)
    return {
      taxType: "simplified",
      annualRevenueWon: rev,
      lowWon: Math.max(0, creditFloor),
      highWon: base,
      valueAddedRatePct: vatRate,
      noteKo: `간이과세 예상: 공급대가 × 업종부가율(${vatRate}%) × 10%. 실제 부가율은 업종코드로 결정되고 세액공제·재고매입에 따라 달라져요 → 홈택스 확정.`,
    };
  }
  // 일반: 매출세액 − 매입세액(매입비율 30~60% 가정)
  const salesVat = Math.round(rev * 0.1);
  const high = Math.round(salesVat * 0.7); // 매입 30% 가정
  const low = Math.round(salesVat * 0.4);  // 매입 60% 가정
  return {
    taxType: "general",
    annualRevenueWon: rev,
    lowWon: Math.max(0, low),
    highWon: Math.max(0, high),
    valueAddedRatePct: 10,
    noteKo: "일반과세 예상: 매출세액(10%) − 매입세액. 매입 증빙(세금계산서·카드)이 많을수록 줄어요. 실제 매입세액 기준으로 홈택스에서 확정.",
  };
}

// ═══════════════════════════════════════════════════════════════
//   종합소득세 — 계산 대신 개념·구간 안내 (필요경비·소득공제 복잡 → 단정 금지)
// ═══════════════════════════════════════════════════════════════

export type IncomeTaxGuide = {
  /** 사업소득 대략 추정(원) — 매출 × (1 − 단순경비율 가정). 매우 개략. */
  estimatedBusinessIncomeWon: number | null;
  /** 예상 한계세율 구간(%) — 과표 기준(소득공제 전이라 실효세율은 더 낮음) */
  marginalBracketPct: number | null;
  noteKo: string;
};

/** 2026 종합소득세 과표 구간(원) → 세율(%). 소득세법 §55. */
const INCOME_TAX_BRACKETS: Array<{ upTo: number; ratePct: number }> = [
  { upTo: 14_000_000, ratePct: 6 },
  { upTo: 50_000_000, ratePct: 15 },
  { upTo: 88_000_000, ratePct: 24 },
  { upTo: 150_000_000, ratePct: 35 },
  { upTo: 300_000_000, ratePct: 38 },
  { upTo: 500_000_000, ratePct: 40 },
  { upTo: 1_000_000_000, ratePct: 42 },
  { upTo: Infinity, ratePct: 45 },
];

/**
 * 종소세는 정확 계산을 하지 않는다(필요경비·소득공제·세액공제 조합이 앱 밖).
 * 대신 매출 기반 사업소득을 아주 개략 추정해 "예상 세율 구간"만 안내한다.
 * @param expenseRatioAssumption 단순경비율 가정(기본 0.7 = 경비 70% 가정, 업종마다 다름)
 */
export function guideIncomeTax(annualRevenueWon: number, expenseRatioAssumption = 0.7): IncomeTaxGuide {
  if (!annualRevenueWon || annualRevenueWon <= 0) {
    return {
      estimatedBusinessIncomeWon: null,
      marginalBracketPct: null,
      noteKo: "매출을 기록하면 예상 종합소득세 구간을 안내해 드려요. 정확한 세액은 필요경비·소득공제에 따라 달라져 홈택스·세무사로 확정하세요.",
    };
  }
  const income = Math.round(annualRevenueWon * (1 - expenseRatioAssumption));
  const bracket = INCOME_TAX_BRACKETS.find((b) => income <= b.upTo);
  return {
    estimatedBusinessIncomeWon: income,
    marginalBracketPct: bracket?.ratePct ?? null,
    noteKo: `사업소득을 매출의 약 ${Math.round((1 - expenseRatioAssumption) * 100)}%로 가정한 개략치예요(업종·경비에 따라 크게 달라짐). 실제 필요경비·소득공제·세액공제를 반영하면 세액이 낮아져요 — 홈택스·세무사 확정.`,
  };
}

// ── helper ──
function manwon(won: number): string {
  const man = Math.round(won / 10_000);
  if (man >= 10_000) return `${(man / 10_000).toFixed(man % 10_000 === 0 ? 0 : 1)}억원`;
  return `${man.toLocaleString()}만원`;
}
