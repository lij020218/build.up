import { describe, it, expect } from "vitest";
import { unifyRetailProducts } from "../product-unify";

/**
 * 소매 상품 정규화 SSOT 회귀 가드 (2026-07-22 상품모델 통합).
 *  inventory.product(iOS 정본) + unifiedProducts + products 우선순위·중복제거를 잠근다.
 */
const invProduct = (id: string, over: Record<string, unknown> = {}) => ({
  id, name: `inv-${id}`, quantity: 10, unit: "개", minThreshold: 2, unitCost: 1000,
  category: "other" as const, itemType: "product" as const, sellingPrice: 3000, monthlySold: 5,
  expiryDate: "", supplierName: "", supplierUrl: "", leadTimeDays: 0, dailyUsage: 0, lastOrderedAt: "",
  wasteLog: [], ...over,
});
const invMaterial = (id: string) => ({ ...invProduct(id), itemType: "material" as const });
const prod = (id: string, over: Record<string, unknown> = {}) => ({
  id, name: `prod-${id}`, category: "c", price: 2000, cost: 800, stock: 20, monthlySold: 3, unit: "개", ...over,
});
const unified = (id: string, over: Record<string, unknown> = {}) => ({
  id, name: `uni-${id}`, category: "c", price: 2500, cost: 900, stock: 15, monthlySold: 4, unit: "개",
  minThreshold: 3, supplierName: "s", supplierUrl: "", leadTimeDays: 2, dailyUsage: 1, lastOrderedAt: "", isConsumable: false, ...over,
});

describe("unifyRetailProducts", () => {
  it("inventory.product 만 소매 상품으로 포함, material 은 제외", () => {
    const out = unifyRetailProducts({ inventory: [invProduct("a"), invMaterial("b")] });
    expect(out.map((p) => p.id)).toEqual(["a"]);
    expect(out[0].isConsumable).toBe(false);
  });

  it("세 소스 병합 — id 중복 시 inventory > unified > products 우선", () => {
    const out = unifyRetailProducts({
      inventory: [invProduct("x", { name: "from-inv" })],
      unifiedProducts: [unified("x", { name: "from-uni" }), unified("y")],
      products: [prod("x", { name: "from-prod" }), prod("z")],
    });
    const byId = Object.fromEntries(out.map((p) => [p.id, p]));
    expect(byId["x"].name).toBe("from-inv");   // inventory 우선
    expect(byId["y"].name).toBe("uni-y");
    expect(byId["z"].name).toBe("prod-z");
    expect(out.length).toBe(3);                 // x 중복 제거
  });

  it("inventory 필드 매핑 — sellingPrice→price·unitCost→cost·quantity→stock", () => {
    const out = unifyRetailProducts({ inventory: [invProduct("a", { sellingPrice: 5000, unitCost: 1200, quantity: 7, monthlySold: 9 })] });
    expect(out[0]).toMatchObject({ price: 5000, cost: 1200, stock: 7, monthlySold: 9 });
  });

  it("monthlySold 누락(구 inventory) 은 0 폴백", () => {
    const noSold = invProduct("a"); delete (noSold as { monthlySold?: number }).monthlySold;
    expect(unifyRetailProducts({ inventory: [noSold] })[0].monthlySold).toBe(0);
  });

  it("serviceMenu 는 includeServiceMenu=true 일 때만 (기본 제외)", () => {
    const svc = [{ id: "s1", name: "커트", category: "hair", price: 20000, duration: 30, monthlySold: 40 }];
    expect(unifyRetailProducts({ serviceMenuItems: svc }).length).toBe(0);
    const withSvc = unifyRetailProducts({ serviceMenuItems: svc }, true);
    expect(withSvc.length).toBe(1);
    expect(withSvc[0]).toMatchObject({ price: 20000, stock: 0, monthlySold: 40 });
  });

  it("displayCategory(자유분류) 가 enum category 보다 우선 표시", () => {
    // 메뉴/소매 분류는 식자재 enum 이 아니라 사장님이 입력한 자유문자열을 보존해야 한다.
    const out = unifyRetailProducts({ inventory: [invProduct("a", { category: "other", displayCategory: "메인" })] });
    expect(out[0].category).toBe("메인");
  });

  it("displayCategory 없으면 enum category 로 폴백", () => {
    const noDisp = invProduct("a", { category: "beverage" });
    delete (noDisp as { displayCategory?: string }).displayCategory;
    expect(unifyRetailProducts({ inventory: [noDisp] })[0].category).toBe("beverage");
  });

  it("빈 입력 → 빈 배열", () => {
    expect(unifyRetailProducts({})).toEqual([]);
  });
});
