import { describe, it, expect } from "vitest";
import { convertQty, compatibleUnits, menuCostPerServing, menuCostRatio, applyRecipeStockDelta, makeableServings, takeoutExtraCost } from "../recipe-cost";
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

describe("makeableServings — 지금 재료로 N개 가능 (입력 아닌 파생)", () => {
  const materials = [
    mat("onion", { unit: "개", quantity: 10 }),
    mat("pork", { unit: "kg", quantity: 3 }),
  ];
  const bibim = menu("bibim", { recipe: [
    { materialId: "onion", qty: 0.3, unit: "개" },   // 10/0.3 = 33.3
    { materialId: "pork", qty: 150, unit: "g" },     // 3kg/0.15kg = 20 ← 병목
  ]});
  //  2026-08-25 추적모드 분리: kg(벌크) 재료는 잔량 제약에서 제외 → 병목은 개수 재료(양파)만.
  it("병목 = 개수 재료만 (벌크 돼지고기는 제약 제외) — 양파 33개", () => {
    expect(makeableServings(bibim, materials)).toEqual({ servings: 33, limitingMaterialId: "onion" });
  });
  it("개수 재료 재고 0 → 0개(병목 표시)", () => {
    const out = makeableServings(bibim, [mat("onion", { unit: "개", quantity: 0 }), mat("pork", { unit: "kg", quantity: 3 })]);
    expect(out).toEqual({ servings: 0, limitingMaterialId: "onion" });
  });
  it("레시피 없으면 null(비표시 — 위조 금지)", () => {
    expect(makeableServings(menu("plain"), materials)).toBeNull();
  });
  it("삭제된 재료 포함 시 null(과대표시 방지)", () => {
    const m = menu("x", { recipe: [{ materialId: "gone", qty: 1, unit: "개" }] });
    expect(makeableServings(m, materials)).toBeNull();
  });
});

describe("applyRecipeStockDelta", () => {
  const base: InventoryItem[] = [
    mat("onion", { unit: "개", quantity: 10 }),
    mat("flour", { unit: "kg", quantity: 5 }),
    menu("bibim", { recipe: [{ materialId: "onion", qty: 0.3, unit: "개" }, { materialId: "flour", qty: 200, unit: "g" }] }),
  ];
  //  2026-08-25 추적모드 분리: kg(벌크) 밀가루는 차감 제외 — 개수 재료(양파)만 차감.
  it("판매 +2 → 개수 재료만 차감 (양파 0.6, 벌크 밀가루 무변)", () => {
    const out = applyRecipeStockDelta(base, "bibim", 2);
    expect(out.find((i) => i.id === "onion")!.quantity).toBe(9.4);
    expect(out.find((i) => i.id === "flour")!.quantity).toBe(5);
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

describe("벌크 재료 (추적모드 분리 2026-08-25) — 잔량 제약·차감 제외, 원가는 유지", () => {
  const materials = [
    mat("milk", { unit: "ml", unitCost: 3, quantity: 0 }),   // 우유 — 벌크, 잔량 미추적
    mat("cup", { unit: "개", unitCost: 150, quantity: 40 }), // 컵 — 개수 추적
  ];
  const latte = menu("latte", {
    sellingPrice: 5000,
    recipe: [
      { materialId: "milk", qty: 200, unit: "ml" },
      { materialId: "cup", qty: 1, unit: "개" },
    ],
  });

  it("원가에는 벌크 재료 포함 (200ml×3원 + 컵 150원)", () =>
    expect(menuCostPerServing(latte, materials)).toBe(750));

  it("makeableServings — 벌크 잔량(0)을 제약으로 잡지 않음 (컵 40개가 병목)", () =>
    expect(makeableServings(latte, materials)).toEqual({ servings: 40, limitingMaterialId: "cup" }));

  it("레시피가 벌크 재료뿐이면 null (가짜 '0개 가능' 금지)", () => {
    const milkOnly = menu("milk-only", { recipe: [{ materialId: "milk", qty: 200, unit: "ml" }] });
    expect(makeableServings(milkOnly, materials)).toBeNull();
  });

  it("판매 차감 — 컵만 차감, 벌크 우유는 무변", () => {
    const next = applyRecipeStockDelta([latte, ...materials], "latte", 3);
    expect(next.find((i) => i.id === "cup")?.quantity).toBe(37);
    expect(next.find((i) => i.id === "milk")?.quantity).toBe(0);
  });
});

describe("홀/포장 분리 (2026-08-25) — takeoutRecipe 는 포장 판매에만", () => {
  const materials = [
    mat("milk", { unit: "ml", unitCost: 3, quantity: 0 }),
    mat("cup", { unit: "개", unitCost: 150, quantity: 40 }),
    mat("lid", { unit: "개", unitCost: 80, quantity: 40 }),
  ];
  const latte = menu("latte", {
    sellingPrice: 5000,
    recipe: [{ materialId: "milk", qty: 200, unit: "ml" }],
    takeoutRecipe: [
      { materialId: "cup", qty: 1, unit: "개" },
      { materialId: "lid", qty: 1, unit: "개" },
    ],
  });

  it("takeoutExtraCost — 컵 150 + 뚜껑 80 = 230", () =>
    expect(takeoutExtraCost(latte, materials)).toBe(230));

  it("기본 원가에는 포장 재료 미포함 (우유 600원만)", () =>
    expect(menuCostPerServing(latte, materials)).toBe(600));

  it("홀 판매 차감 — 포장 재료 무변", () => {
    const next = applyRecipeStockDelta([latte, ...materials], "latte", 2);
    expect(next.find((i) => i.id === "cup")?.quantity).toBe(40);
    expect(next.find((i) => i.id === "lid")?.quantity).toBe(40);
  });

  it("포장 판매 차감 — 컵·뚜껑 차감 (벌크 우유는 여전히 무변)", () => {
    const next = applyRecipeStockDelta([latte, ...materials], "latte", 2, true);
    expect(next.find((i) => i.id === "cup")?.quantity).toBe(38);
    expect(next.find((i) => i.id === "lid")?.quantity).toBe(38);
    expect(next.find((i) => i.id === "milk")?.quantity).toBe(0);
  });

  it("포장 판매 취소(-1) — 복구", () => {
    const next = applyRecipeStockDelta([latte, ...materials], "latte", -1, true);
    expect(next.find((i) => i.id === "cup")?.quantity).toBe(41);
  });
});
