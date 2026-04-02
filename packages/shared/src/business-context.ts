export type BusinessCategory =
  | "food"
  | "cafe-dessert"
  | "retail"
  | "beauty"
  | "fitness"
  | "education"
  | "pet"
  | "living-service"
  | "space"
  | "online-digital"
  | "startup-tech";

/**
 * inventoryMode — 업종별 재고-제품 관계:
 *   separate : 원재료(재고) + 완성품(메뉴) 분리  → food, cafe-dessert
 *   unified  : 판매상품 = 재고, 하나의 카드       → retail, online-digital, pet, startup-tech
 *   service  : 소모품(재고) + 서비스메뉴(제품) 분리 → beauty, living-service
 *   minimal  : 소모품만(선택적), 제품→회원관리     → fitness, education, space
 */
export type InventoryMode = "separate" | "unified" | "service" | "minimal";

export type BusinessContext = {
  categoryId: BusinessCategory | null;
  isDeliveryRelevant: boolean;
  isOnlineStore: boolean;
  isServiceBusiness: boolean;
  isRecurringRevenue: boolean;
  hasPhysicalInventory: boolean;
  inventoryMode: InventoryMode;
  inventoryLabel: { ko: string; en: string };
  productLabel: { ko: string; en: string };
  showProductCard: boolean;
  showInventoryCard: boolean;
};

export function resolveBusinessContext(categoryId: string | null | undefined): BusinessContext {
  const id = (categoryId ?? null) as BusinessCategory | null;

  const inventoryMode: InventoryMode =
    id === "food" || id === "cafe-dessert" ? "separate"
    : id === "retail" || id === "online-digital" || id === "pet" || id === "startup-tech" ? "unified"
    : id === "beauty" || id === "living-service" ? "service"
    : "minimal";

  const inventoryLabel =
    inventoryMode === "separate" ? { ko: "식재료 재고", en: "Ingredients" }
    : inventoryMode === "unified" && id === "startup-tech" ? { ko: "운영 자산", en: "Ops Assets" }
    : inventoryMode === "unified" ? { ko: "내 제품", en: "My Products" }
    : inventoryMode === "service" ? { ko: "소모품 관리", en: "Supplies" }
    : { ko: "소모품", en: "Supplies" };

  const productLabel =
    inventoryMode === "separate" ? { ko: "메뉴 관리", en: "Menu" }
    : inventoryMode === "unified" && id === "startup-tech" ? { ko: "제품·플랜", en: "Product Plans" }
    : inventoryMode === "unified" ? { ko: "내 제품", en: "My Products" }
    : inventoryMode === "service" ? { ko: "서비스 메뉴", en: "Services" }
    : { ko: "", en: "" };

  return {
    categoryId: id,
    isDeliveryRelevant: id === "food" || id === "cafe-dessert",
    isOnlineStore: id === "online-digital",
    isServiceBusiness: id === "beauty" || id === "fitness" || id === "pet" || id === "living-service",
    isRecurringRevenue: id === "fitness" || id === "education" || id === "space",
    hasPhysicalInventory: id === "food" || id === "cafe-dessert" || id === "retail" || id === "pet" || id === "online-digital" || id === "startup-tech",
    inventoryMode,
    inventoryLabel,
    productLabel,
    showProductCard: inventoryMode === "separate" || inventoryMode === "service",
    showInventoryCard: true,
  };
}
