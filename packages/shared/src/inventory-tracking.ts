/**
 * 재고 추적 모드 SSOT (2026-08-25, 사장님 지시 — 사용자 피드백 2건 + 교차검증 반영).
 *
 *  ── 배경 ────────────────────────────────────────────────────────────────
 *   부어 쓰는 재료(밀가루·설탕·우유·시럽 등 g·ml 단위)는 수량 추적이 구조적으로 불가:
 *   레시피 편차(스팀 손실·리필), 개봉 후 폐기, 소수점 차감 누적 → "우유 3.7팩" 같은
 *   아무도 안 믿는 잔량이 나온다. 업계 표준(ABC 실사·yield %)도 이런 품목은 수량을
 *   상시 추적하지 않는다. 국내 도도카트는 아예 수량 없이 구매 기록만으로 성립.
 *
 *  ── 규칙 ────────────────────────────────────────────────────────────────
 *   · 상품(itemType=product) = 항상 수량 추적 (판매 1:1 차감).
 *   · 재료(material)는 단위로 판별: 개수 단위(개·병·팩…) = 수량 추적,
 *     무게·부피 단위(g·kg·ml·l…) = 잔량 미표시 + 원가 계산·발주 리듬만.
 *   · 단위 선택이 곧 사장님의 관리 방식 — 우유를 "팩"으로 등록하면 개수 추적,
 *     "ml"로 등록하면 원가·리듬 관리. 별도 설정 없음.
 *
 *  소비처: 웹 InventoryOpsCard·AlertStripBanner·useDashboardComputed·useDashboard(AI 컨텍스트)
 *          + iOS BUInventoryItem.isBulkTracked (손미러) — 수정 시 양쪽 동시.
 */

/** 무게·부피 단위 — 이 단위로 등록된 재료는 수량 추적 제외 (소문자 비교) */
const BULK_UNITS = new Set([
  "g", "kg", "mg", "그램", "킬로그램",
  "ml", "l", "cc", "리터", "밀리리터", "㎖", "ℓ",
  "oz", "온스", "lb", "파운드",
]);

export function isBulkUnit(unit: string | undefined | null): boolean {
  if (!unit) return false;
  return BULK_UNITS.has(unit.trim().toLowerCase());
}

export type TrackableInventoryItem = {
  unit?: string | null;
  itemType?: string | null;
};

/** 수량 추적(잔량·발주임계 알림) 대상인가 */
export function isCountTracked(i: TrackableInventoryItem): boolean {
  if (i.itemType === "product") return true;
  return !isBulkUnit(i.unit);
}

/**
 * 벌크 단가 자연 표기 — 사장님 언어는 "L당·kg당"이지 "ml당 2.6원"이 아니다.
 *  ml·cc→L, g→kg 로 ×1000 환산해 반환. 그 외 단위는 null(그대로 표기).
 */
export function bulkUnitCostDisplay(
  unitCost: number,
  unit: string | null | undefined,
): { amount: number; perUnit: string } | null {
  if (!unitCost || unitCost <= 0 || !unit) return null;
  const u = unit.trim().toLowerCase();
  if (u === "ml" || u === "cc" || u === "밀리리터" || u === "㎖") return { amount: unitCost * 1000, perUnit: "L" };
  if (u === "g" || u === "그램") return { amount: unitCost * 1000, perUnit: "kg" };
  return null;
}

/** 구매 묶음 자연 표기 — 1000ml → "1L", 500g → "500g", 1000g → "1kg" */
export function packSizeLabel(size: number, unit: string): string {
  const u = unit.trim().toLowerCase();
  if ((u === "ml" || u === "cc") && size >= 1000 && size % 100 === 0) return `${size / 1000}L`;
  if (u === "g" && size >= 1000 && size % 100 === 0) return `${size / 1000}kg`;
  return `${size}${unit}`;
}

export type OrderRhythm = {
  /** 마지막 발주 후 경과 일수 */
  daysSince: number;
  /** 사장님이 설정한 발주 주기(일)를 넘겼는가 — 주기 미설정이면 항상 false */
  overdue: boolean;
};

/**
 * 발주 리듬 — 잔량 없이도 정직하게 줄 수 있는 유일한 신호.
 *  todayIso 는 호출부가 주입 (KST 기준, 테스트 결정론). 발주 기록 없으면 null.
 */
export function orderRhythm(
  i: { lastOrderedAt?: string | null; orderCycleDays?: number | null },
  todayIso: string,
): OrderRhythm | null {
  if (!i.lastOrderedAt) return null;
  const last = Date.parse(i.lastOrderedAt);
  const today = Date.parse(todayIso);
  if (Number.isNaN(last) || Number.isNaN(today)) return null;
  const daysSince = Math.max(0, Math.floor((today - last) / 86_400_000));
  const cycle = i.orderCycleDays ?? 0;
  return { daysSince, overdue: cycle > 0 && daysSince >= cycle };
}
