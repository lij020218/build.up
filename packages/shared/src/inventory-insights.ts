/**
 * 재고 인사이트 SSOT (2026-08-05, 사장님 지시 — 온라인 셀러 재고 철학 반영).
 *
 *  조사 근거 (2026-08-05):
 *   · 안전재고 기본형 = 평균 일수요 × 리드타임 + 안전버퍼 (변동성 클수록 버퍼↑) — Shopify/NetSuite 실무 공식 단순형
 *   · ABC: 매출기여 누적 80% = A(재고율 98~99% 목표) / 95% = B(95%) / 나머지 = C(90%) — NetSuite·Finale
 *   · 쿠팡 로켓그로스: 무료 보관 30/60일 — 그 안에 완판 못 하면 장기보관비가 마진을 잠식 (셀러 실무 가이드)
 *   · 품절 = 오픈마켓 랭킹·노출 하락 → 기회비용이 보관비보다 큰 경우가 많다 (A급 품목 기준)
 *
 *  웹 InventoryManagementCard · iOS InventoryInsights.swift(손미러)가 같은 공식을 쓴다 — 수정 시 양쪽 동시.
 */

export type InventoryInsightItem = {
  quantity: number;
  itemType?: "material" | "product";
  /** 재료: 일 사용량 */
  dailyUsage?: number | null;
  /** 상품: 월 판매량 */
  monthlySales?: number | null;
  leadTimeDays?: number | null;
  unitCost?: number | null;
};

/** 쿠팡 로켓그로스 무료 보관 한도(일) — 초과분부터 장기보관비 (30/60일 정책 중 보수적 60 채택) */
export const FULFILLMENT_FREE_STORAGE_DAYS = 60;

/** 일 수요 — 상품은 월판매/30, 재료는 일사용량. 없으면 null (추정 금지) */
export function dailyDemand(i: InventoryInsightItem): number | null {
  if (i.itemType === "product") {
    const m = i.monthlySales ?? 0;
    return m > 0 ? m / 30 : null;
  }
  const d = i.dailyUsage ?? 0;
  return d > 0 ? d : null;
}

/** 현 재고로 버티는 일수 (회전일수) — 수요 데이터 없으면 null */
export function daysOfStock(i: InventoryInsightItem): number | null {
  const d = dailyDemand(i);
  if (d === null || i.quantity <= 0) return i.quantity <= 0 ? 0 : null;
  return Math.floor(i.quantity / d);
}

/**
 * 재주문 기준(안전재고) 제안 = ceil(일수요 × 리드타임 × 1.3).
 *  30% 버퍼 = 수요·리드타임 변동 대비 최소치 (실무 단순형). 데이터 없으면 null.
 */
export function suggestedThreshold(i: InventoryInsightItem): number | null {
  const d = dailyDemand(i);
  if (d === null) return null;
  const lead = Math.max(1, i.leadTimeDays ?? 1);
  return Math.ceil(d * lead * 1.3);
}

export type AbcGrade = "A" | "B" | "C";

/** ABC 목표 재고율 문구 — 조사 출처의 권장치 그대로 */
export const ABC_TARGET_KO: Record<AbcGrade, string> = {
  A: "품절 절대 금지 (재고율 98~99% 목표) — 품절 시 랭킹·노출 하락",
  B: "정기 점검 (재고율 95% 목표)",
  C: "최소 관리 — 과재고가 더 위험 (재고율 90%)",
};

/**
 * ABC 분류 — 매출기여(월판매×단가) 누적 80%까지 A, 95%까지 B, 나머지 C.
 *  매출 계산이 불가능한 항목(월판매·단가 없음)은 분류하지 않는다(null) — 위조 금지.
 *  반환: 항목 인덱스가 아닌 "id 추출 함수" 없이 쓰도록 입력 배열과 같은 순서의 등급 배열.
 */
export function abcClassify<T extends InventoryInsightItem>(items: T[]): Array<AbcGrade | null> {
  const revenues = items.map((i) =>
    i.itemType === "product" && (i.monthlySales ?? 0) > 0 && (i.unitCost ?? 0) > 0
      ? (i.monthlySales as number) * (i.unitCost as number)
      : null,
  );
  const total = revenues.reduce<number>((s, r) => s + (r ?? 0), 0);
  if (total <= 0) return items.map(() => null);
  // 매출 내림차순 누적 비중으로 등급 결정
  const order = revenues
    .map((r, idx) => ({ r: r ?? 0, idx }))
    .filter((x) => x.r > 0)
    .sort((a, b) => b.r - a.r);
  const grade = new Map<number, AbcGrade>();
  let cum = 0;
  for (const { r, idx } of order) {
    cum += r;
    grade.set(idx, cum / total <= 0.8 ? "A" : cum / total <= 0.95 ? "B" : "C");
  }
  return items.map((_, idx) => grade.get(idx) ?? null);
}
