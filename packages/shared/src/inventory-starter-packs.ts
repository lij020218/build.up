/**
 * 재고 스타터팩 SSOT (2026-08-25, 사장님 지시 — 사용자 피드백 "베이스로 깔아놓기" 반영).
 *
 *  ── 설계 (교차검증 판정 반영) ─────────────────────────────────────────
 *   · 프리셋 = "품목 체크리스트"만. 수량·단가·레시피 양은 절대 프리필하지 않는다
 *     (틀린 기본값은 빈 값보다 해롭다 — GPT·Gemini 교차검증 공통 지적).
 *   · 단위가 곧 관리 방식: ml·g = 원가·발주 리듬(잔량 미추적) / 개·팩 = 수량 추적.
 *     칩 라벨에서 이 규칙을 자연 학습시킨다 ([[inventory-tracking]] SSOT).
 *   · 파일럿 = cafe-dessert 만. 검증 후 업종 확대.
 *
 *  소비처: 웹 InventoryOpsCard 빈 상태 패널 + iOS InventoryStarterPacks.swift(손미러).
 */

export type StarterPackItem = {
  name: string;
  /** 단위 = 관리 방식 선택 (ml·g → 원가·리듬 / 개·팩 → 수량 추적) */
  unit: string;
  category: "fresh" | "dry" | "frozen" | "beverage" | "supply" | "other";
};

export type StarterPack = {
  id: string;
  titleKo: string;
  titleEn: string;
  items: StarterPackItem[];
};

/** 카페·디저트 — 음료 원가의 20~25%가 부자재(컵·뚜껑·빨대)라 개수 추적 가치가 가장 큰 업종 */
const CAFE_PACK: StarterPack = {
  id: "cafe-dessert",
  titleKo: "카페에서 많이 쓰는 품목",
  titleEn: "Common cafe items",
  items: [
    // 부어 쓰는 재료 → 원가·발주 리듬
    { name: "원두", unit: "g", category: "beverage" },
    { name: "우유", unit: "ml", category: "fresh" },
    { name: "시럽", unit: "ml", category: "dry" },
    // 개수 부자재 → 수량 추적 + 판매 자동차감
    { name: "아이스컵", unit: "개", category: "supply" },
    { name: "핫컵", unit: "개", category: "supply" },
    { name: "컵 뚜껑", unit: "개", category: "supply" },
    { name: "빨대", unit: "개", category: "supply" },
    { name: "컵 홀더", unit: "개", category: "supply" },
    { name: "캐리어", unit: "개", category: "supply" },
    { name: "냅킨", unit: "팩", category: "supply" },
  ],
};

const PACKS: Record<string, StarterPack> = {
  "cafe-dessert": CAFE_PACK,
};

/** 업종 카테고리 → 스타터팩. 없는 업종은 null (억지 프리셋 금지). */
export function resolveStarterPack(categoryId: string | null | undefined): StarterPack | null {
  if (!categoryId) return null;
  return PACKS[categoryId] ?? null;
}
