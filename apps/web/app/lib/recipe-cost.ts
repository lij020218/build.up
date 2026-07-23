/**
 * 레시피(BOM) 원가·재고차감 SSOT (2026-07-22).
 *
 *  메뉴(inventory.itemType="product")의 recipe = 재료(material) 소요량 목록.
 *  · 원가/1인분 = Σ 재료단가(unitCost, 원/재료단위) × 소요량(재료단위로 환산)
 *  · 원가율 = 원가/판매가
 *  · 판매 n개 → 각 재료 quantity 를 n × 소요량 만큼 차감(0 클램프)
 *
 *  단위 환산은 무게(g·kg·mg)·부피(ml·l·cc) 같은 차원 안에서만. 차원이 다르면(개↔g) null →
 *  UI 에서 재료 단위와 호환되는 단위만 노출해 비호환 입력을 원천 차단(정직: 잘못된 환산 금지).
 */

import type { InventoryItem, RecipeIngredient } from "./stores/operations-store";

const WEIGHT: Record<string, number> = { mg: 0.001, g: 1, kg: 1000 };
const VOLUME: Record<string, number> = { ml: 1, cc: 1, l: 1000 };

/** 한글·구어 단위 → 정규 단위 별칭 (그램·킬로·리터 등도 환산 대상). */
const UNIT_ALIAS: Record<string, string> = {
  "그램": "g", "그람": "g", "밀리그램": "mg",
  "킬로": "kg", "키로": "kg", "킬로그램": "kg", "키로그램": "kg",
  "밀리리터": "ml", "미리리터": "ml", "미리": "ml", "씨씨": "cc",
  "리터": "l", "ℓ": "l",
};

function norm(u: string): string {
  const t = u.trim().toLowerCase();
  return UNIT_ALIAS[t] ?? t;
}

/** `qty` (fromUnit) → toUnit 로 환산. 같은 차원만 성공, 비호환이면 null. */
export function convertQty(qty: number, fromUnit: string, toUnit: string): number | null {
  const f = norm(fromUnit), t = norm(toUnit);
  if (f === t) return qty;
  if (f in WEIGHT && t in WEIGHT) return (qty * WEIGHT[f]) / WEIGHT[t];
  if (f in VOLUME && t in VOLUME) return (qty * VOLUME[f]) / VOLUME[t];
  return null;
}

/** 재료 단위와 호환되는 레시피 입력 단위 목록(첫 항목 = 재료 단위 자체 = 기본값).
 *  한글 단위(그램·킬로·리터)도 별칭 정규화로 지원 — 정규화 기준 중복 제거(그램+g 이중표시 방지). */
export function compatibleUnits(materialUnit: string): string[] {
  const u = norm(materialUnit);
  const candidates = u in WEIGHT ? [materialUnit, "g", "kg"]
    : u in VOLUME ? [materialUnit, "ml", "l"]
    : [materialUnit || "개"];
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const n = norm(c);
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

/** 재료 한 줄의 원가(원). 재료 없거나 단위 비호환이면 null(계산 불가 — 위조 금지). */
export function ingredientCost(ing: RecipeIngredient, materials: InventoryItem[]): number | null {
  const mat = materials.find((m) => m.id === ing.materialId);
  if (!mat) return null;
  const inMatUnit = convertQty(ing.qty, ing.unit, mat.unit);
  if (inMatUnit == null) return null;
  return (mat.unitCost || 0) * inMatUnit;
}

/**
 * 메뉴 1개 원가. recipe 가 있으면 재료 합산, 없으면 수동 unitCost 폴백.
 *  recipe 는 있지만 일부 재료가 삭제/비호환이면 계산 가능한 것만 합산(부분 원가) — 정직하게 부분값 표기용.
 */
export function menuCostPerServing(menu: InventoryItem, materials: InventoryItem[]): number {
  const recipe = menu.recipe ?? [];
  if (recipe.length === 0) return menu.unitCost || 0;
  return recipe.reduce((sum, ing) => sum + (ingredientCost(ing, materials) ?? 0), 0);
}

/** recipe 원가율(%) — 판매가 0 이면 0. */
export function menuCostRatio(menu: InventoryItem, materials: InventoryItem[]): number {
  const price = menu.sellingPrice || 0;
  if (price <= 0) return 0;
  return (menuCostPerServing(menu, materials) / price) * 100;
}

/** "지금 재료로 몇 개 만들 수 있나" 결과 — 입력이 아니라 레시피×재고에서 파생(위조 0). */
export type MakeableResult = { servings: number; limitingMaterialId: string | null };

/**
 * 지금 재료 재고로 만들 수 있는 메뉴 수(병목 재료 포함).
 *  = min over 재료( 재고 / 1인분 소요량 ) 의 내림. 메뉴 "수량"은 입력받지 않고 이걸로 계산.
 *  레시피 없음·재료 삭제·단위 비호환 등 정직하게 계산 불가면 null(비표시).
 */
export function makeableServings(menu: InventoryItem, materials: InventoryItem[]): MakeableResult | null {
  const recipe = menu.recipe ?? [];
  if (recipe.length === 0) return null;
  let min = Infinity;
  let limiting: string | null = null;
  let counted = 0;
  for (const ing of recipe) {
    if (ing.qty <= 0) continue;
    const mat = materials.find((m) => m.id === ing.materialId);
    if (!mat) return null; // 삭제된 재료 → 계산 불가(과대표시 방지)
    const per = convertQty(ing.qty, ing.unit, mat.unit);
    if (per == null || per <= 0) return null;
    counted++;
    const s = (mat.quantity || 0) / per;
    if (s < min) { min = s; limiting = mat.id; }
  }
  if (counted === 0) return null;
  return { servings: Math.floor(min), limitingMaterialId: limiting };
}

/**
 * 판매 delta 개에 따른 재료 재고 차감 결과. delta>0 차감, delta<0 복구.
 *  반환 = 갱신된 inventory 배열(레시피 없는 메뉴/재료 없는 항목은 무변).
 *  차감 후 음수는 0 클램프(과사용 은닉 방지 위해 별도 경보는 UI 몫).
 */
export function applyRecipeStockDelta(
  inventory: InventoryItem[],
  menuId: string,
  delta: number,
): InventoryItem[] {
  const menu = inventory.find((i) => i.id === menuId);
  const recipe = menu?.recipe ?? [];
  if (recipe.length === 0 || delta === 0) return inventory;
  // materialId → 차감량(재료단위)
  const deductByMaterial = new Map<string, number>();
  for (const ing of recipe) {
    const mat = inventory.find((m) => m.id === ing.materialId);
    if (!mat) continue;
    const per = convertQty(ing.qty, ing.unit, mat.unit);
    if (per == null) continue;
    deductByMaterial.set(ing.materialId, (deductByMaterial.get(ing.materialId) ?? 0) + per * delta);
  }
  if (deductByMaterial.size === 0) return inventory;
  return inventory.map((it) => {
    const d = deductByMaterial.get(it.id);
    if (d == null) return it;
    const next = Math.max(0, +(it.quantity - d).toFixed(4));
    return { ...it, quantity: next };
  });
}
