/**
 * 비용 분류 SSOT — 고정비 / 변동비 / 기타.
 *
 *  ── 분류 기준 (한국 SMB 회계 표준) ───────────────────────────────────
 *   · 고정비 (Fixed cost): 매출과 무관하게 매월 일정. 임대료·정규직 인건비·공과금·이자.
 *   · 변동비 (Variable cost): 매출에 비례해서 늘고 줌. 식재료비·배달수수료·일부 마케팅.
 *   · 기타 (Other): 분류 애매한 잡비.
 *  ────────────────────────────────────────────────────────────────────
 *
 *  ⚠️ labor·marketing 은 *준변동비* — 정규직/알바 또는 캠페인 빈도에 따라 다름.
 *     단순화를 위해 labor=고정 (정규직 기준), marketing=변동 (캠페인 기반).
 *
 *  사용처: DetailTabs CostsPanel, CostStructureCard, CostCompositionDonutCard 등에서
 *          동일 SSOT 분류로 사장님께 "고정비 X만, 변동비 Y만" 일관 표시.
 */

/** 비용 분류 — UI 가 색·그룹·정렬에 사용. */
export type CostClassification = "fixed" | "variable" | "other";

/** monthlyCosts 의 fieldKey → 분류 매핑. */
export function classifyCost(fieldKey: string): CostClassification {
  switch (fieldKey) {
    // ─── 고정비 ───────────────────────────────────────────────
    case "rent":          // 임대료
    case "labor":         // 인건비 (정규직 기준)
    case "utilities":     // 공과금
    case "interest":      // 대출이자
      return "fixed";

    // ─── 변동비 ───────────────────────────────────────────────
    case "ingredients":   // 식재료비 / 원가 (COGS)
    case "marketing":     // 마케팅·광고비 (캠페인별)
    case "sga":           // 판관비 (배달수수료·PG수수료 등 — 외식에서 자주 운영비로 사용)
      return "variable";

    // ─── 기타 ─────────────────────────────────────────────────
    case "other":
    default:
      return "other";
  }
}

export type ClassificationLabels = {
  fixed: { ko: string; en: string };
  variable: { ko: string; en: string };
  other: { ko: string; en: string };
};

export const COST_CLASSIFICATION_LABELS: ClassificationLabels = {
  fixed:    { ko: "고정비", en: "Fixed" },
  variable: { ko: "변동비", en: "Variable" },
  other:    { ko: "기타",   en: "Other" },
};

/**
 * 분류별 색조 (UI 일관). Apple Health 톤 — 매출 영향도가 큰 변동비는 *경고 톤*,
 * 고정비는 안정 톤. 색은 의미 정렬 (변동성 ↑ = 더 주목).
 */
export const COST_CLASSIFICATION_COLORS = {
  fixed: {
    text: "#1E3A8A",       // navy 700 — 안정 (변하지 않음)
    bg: "rgba(30,58,138,0.06)",
    border: "rgba(30,58,138,0.18)",
    bar: "rgba(30,58,138,0.85)",
  },
  variable: {
    text: "#9A3412",       // amber 800 — 주목 (매출 따라 변함)
    bg: "rgba(154,52,18,0.06)",
    border: "rgba(154,52,18,0.18)",
    bar: "rgba(154,52,18,0.78)",
  },
  other: {
    text: "rgba(15,23,42,0.6)",
    bg: "rgba(15,23,42,0.04)",
    border: "rgba(15,23,42,0.10)",
    bar: "rgba(15,23,42,0.45)",
  },
} as const;

export type CostItem = {
  fieldKey: string;
  /** 표시 라벨 (한국어/영어 — 호출 측에서 expenseFields 로 풀어옴) */
  label: string;
  value: number;
};

export type GroupedCosts = {
  fixed: { items: CostItem[]; total: number };
  variable: { items: CostItem[]; total: number };
  other: { items: CostItem[]; total: number };
  grandTotal: number;
};

/**
 * 비용 항목을 분류별로 그룹화 + 그룹 소계 + 총합.
 *
 *  @param items — { fieldKey, label, value } 배열. 0원 항목은 *유지* (UI 가 결정).
 */
export function groupCostsByClassification(items: CostItem[]): GroupedCosts {
  const grouped: GroupedCosts = {
    fixed:    { items: [], total: 0 },
    variable: { items: [], total: 0 },
    other:    { items: [], total: 0 },
    grandTotal: 0,
  };
  for (const it of items) {
    const cls = classifyCost(it.fieldKey);
    grouped[cls].items.push(it);
    grouped[cls].total += it.value;
    grouped.grandTotal += it.value;
  }
  // 각 그룹 안에서 값 큰 순 정렬 (사장님 시선 우선순위)
  grouped.fixed.items.sort((a, b) => b.value - a.value);
  grouped.variable.items.sort((a, b) => b.value - a.value);
  grouped.other.items.sort((a, b) => b.value - a.value);
  return grouped;
}
