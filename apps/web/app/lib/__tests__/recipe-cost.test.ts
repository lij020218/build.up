import { describe, it, expect } from "vitest";
import { convertQty, compatibleUnits, menuCostPerServing, menuCostRatio, applyRecipeStockDelta } from "../recipe-cost";
import type { InventoryItem } from "../stores/operations-store";

/** 레시피/BOM 원가·재고차감 회귀 가드 (2026-07-22). */
const mat = (id: string, over: Partial<InventoryItem> = {}): InventoryItem => ({
  id, name: id, quantity: 100, unit: "개", minThreshold: 0, unitCost: 500,
  category: "fresh", itemType: "material", sellingPrice: 0, expiryDate: "",
  supplierName: "", supplierUrl: "", leadTimeDays: 0, dailyUsage: 0, lastOrderedAt: "", wasteLog: [], ...over,
});
const menu = (id: string, over: Partial<InventoryItem> = {}): InventoryItem =>
  ({ ...mat(id, { itemType: "product", sellingPrice: 10000, unitCost: 0, quantity: 0 }), ...over });

describe("convertQty", () => {
  it("같은 단위 그대로", () => expect(convertQty(0.3, "개", "개")).toBe(0.3));
  it("g↔kg 환산", () => { expect(convertQty(200, "g", "kg")).toBe(0.2); expect(convertQty(0.5, "kg", "g")).toBe(500); });
  it("ml↔l 환산", () => expect(convertQty(250, "ml", "l")).toBe(0.25));
  it("비호환 차원(개↔g) 은 null", () => expect(convertQty(1, "개", "g")).toBeNull());
});

describe("compatibleUnits", () => {
  it("무게 재료는 g·kg 선택지", () => expect(compatibleUnits("kg")).toEqual(["kg", "g"]));
  it("부피 재료는 ml·l", () => expect(compatibleUnits("l")).toEqual(["l", "ml"]));
  it("개수 재료는 그 단위만", () => expect(compatibleUnits("개")).toEqual(["개"]));
  it("한글 단위 별칭 — 그램 재료도 무게로 인식 + 중복 없이", () =>
    expect(compatibleUnits("그램")).toEqual(["그램", "kg"]));
});

describe("한글 단위 환산 (별칭)", () => {
  it("그램↔kg", () => expect(convertQty(200, "그램", "kg")).toBe(0.2));
  it("킬로→g", () => expect(convertQty(0.5, "킬로", "g")).toBe(500));
  it("리터↔ml", () => expect(convertQty(0.25, "리터", "ml")).toBe(250));
});

describe("menuCostPerServing / ratio", () => {
  const materials = [
    mat("onion", { unit: "개", unitCost: 500 }),      // 양파 500원/개
    mat("flour", { unit: "kg", unitCost: 2000 }),      // 밀가루 2000원/kg
  ];
  it("레시피 합산 (개 소수 + g 환산)", () => {
    const m = menu("bibim", { sellingPrice: 8000, recipe: [
      { materialId: "onion", qty: 0.3, unit: "개" },   // 150원
      { materialId: "flour", qty: 200, unit: "g" },    // 0.2kg × 2000 = 400원
    ]});
    expect(menuCostPerServing(m, materials)).toBe(550);
    expect(Math.round(menuCostRatio(m, materials) * 100) / 100).toBeCloseTo(6.88, 1);
  });
  it("레시피 없으면 수동 unitCost 폴백", () => {
    expect(menuCostPerServing(menu("x", { unitCost: 1200 }), materials)).toBe(1200);
  });
  it("삭제된 재료는 건너뛰고 부분 합산", () => {
    const m = menu("y", { recipe: [{ materialId: "onion", qty: 1, unit: "개" }, { materialId: "gone", qty: 5, unit: "개" }] });
    expect(menuCostPerServing(m, materials)).toBe(500); // gone 제외
  });
});

describe("applyRecipeStockDelta", () => {
  const base: InventoryItem[] = [
    mat("onion", { unit: "개", quantity: 10 }),
    mat("flour", { unit: "kg", quantity: 5 }),
    menu("bibim", { recipe: [{ materialId: "onion", qty: 0.3, unit: "개" }, { materialId: "flour", qty: 200, unit: "g" }] }),
  ];
  it("판매 +2 → 재료 차감 (양파 0.6, 밀가루 0.4kg)", () => {
    const out = applyRecipeStockDelta(base, "bibim", 2);
    expect(out.find((i) => i.id === "onion")!.quantity).toBe(9.4);
    expect(out.find((i) => i.id === "flour")!.quantity).toBe(4.6);
  });
  it("판매 취소 -1 → 복구", () => {
    const out = applyRecipeStockDelta(base, "bibim", -1);
    expect(out.find((i) => i.id === "onion")!.quantity).toBe(10.3);
  });
  it("0 이하 클램프", () => {
    const out = applyRecipeStockDelta(base, "bibim", 100); // 30개 필요 > 10
    expect(out.find((i) => i.id === "onion")!.quantity).toBe(0);
  });
  it("레시피 없는 메뉴는 무변", () => {
    const noRec = [...base.slice(0, 2), menu("plain")];
    expect(applyRecipeStockDelta(noRec, "plain", 5)).toEqual(noRec);
  });
});
