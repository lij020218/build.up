import { describe, expect, it } from "vitest";
import { isBulkUnit, isCountTracked, orderRhythm, bulkUnitCostDisplay, packSizeLabel } from "../inventory-tracking";

describe("isBulkUnit — 무게·부피 단위 판별", () => {
  it("g·kg·ml·l·리터 등은 벌크", () => {
    for (const u of ["g", "kg", "ml", "l", "L", "리터", "그램", " KG ", "cc"]) {
      expect(isBulkUnit(u), u).toBe(true);
    }
  });
  it("개수 단위·빈값은 벌크 아님", () => {
    for (const u of ["개", "병", "팩", "캔", "포", "장", "박스", "", undefined, null]) {
      expect(isBulkUnit(u as string), String(u)).toBe(false);
    }
  });
});

describe("isCountTracked — 수량 추적 대상", () => {
  it("상품(product)은 단위 무관 항상 추적 (판매 1:1 차감)", () => {
    expect(isCountTracked({ itemType: "product", unit: "ml" })).toBe(true);
  });
  it("재료는 개수 단위만 추적", () => {
    expect(isCountTracked({ itemType: "material", unit: "개" })).toBe(true);
    expect(isCountTracked({ itemType: "material", unit: "팩" })).toBe(true);
    expect(isCountTracked({ itemType: "material", unit: "kg" })).toBe(false);
    expect(isCountTracked({ itemType: "material", unit: "ml" })).toBe(false);
  });
  it("itemType 누락(구형 데이터)은 재료로 취급", () => {
    expect(isCountTracked({ unit: "g" })).toBe(false);
    expect(isCountTracked({ unit: "개" })).toBe(true);
  });
});

describe("orderRhythm — 발주 리듬", () => {
  it("발주 기록 없으면 null (위조 금지)", () => {
    expect(orderRhythm({ lastOrderedAt: "" }, "2026-08-25")).toBeNull();
    expect(orderRhythm({}, "2026-08-25")).toBeNull();
    expect(orderRhythm({ lastOrderedAt: "not-a-date" }, "2026-08-25")).toBeNull();
  });
  it("경과 일수 계산 + 주기 초과 판정", () => {
    expect(orderRhythm({ lastOrderedAt: "2026-08-20" }, "2026-08-25")).toEqual({ daysSince: 5, overdue: false });
    expect(orderRhythm({ lastOrderedAt: "2026-08-20", orderCycleDays: 3 }, "2026-08-25")).toEqual({ daysSince: 5, overdue: true });
    expect(orderRhythm({ lastOrderedAt: "2026-08-20", orderCycleDays: 7 }, "2026-08-25")).toEqual({ daysSince: 5, overdue: false });
  });
  it("미래 발주일(시계 어긋남)은 0일로 클램프", () => {
    expect(orderRhythm({ lastOrderedAt: "2026-08-30" }, "2026-08-25")?.daysSince).toBe(0);
  });
});

describe("bulkUnitCostDisplay — 사장님 언어(L당·kg당) 환산", () => {
  it("ml → L, g → kg (×1000)", () => {
    expect(bulkUnitCostDisplay(2.6, "ml")).toEqual({ amount: 2600, perUnit: "L" });
    expect(bulkUnitCostDisplay(18, "g")).toEqual({ amount: 18000, perUnit: "kg" });
  });
  it("환산 불가 단위·단가 0 은 null", () => {
    expect(bulkUnitCostDisplay(500, "개")).toBeNull();
    expect(bulkUnitCostDisplay(0, "ml")).toBeNull();
  });
});

describe("packSizeLabel — 구매 묶음 자연 표기", () => {
  it("1000ml → 1L, 1000g → 1kg", () => {
    expect(packSizeLabel(1000, "ml")).toBe("1L");
    expect(packSizeLabel(1000, "g")).toBe("1kg");
  });
  it("1000 미만·비환산 단위는 그대로", () => {
    expect(packSizeLabel(500, "ml")).toBe("500ml");
    expect(packSizeLabel(20, "kg")).toBe("20kg");
  });
});
