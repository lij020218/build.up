/** 재고 인사이트 SSOT 가드 (2026-08-05) — 공식 고정 (iOS InventoryInsights.swift 와 동일해야 함) */
import { describe, it, expect } from "vitest";
import { abcClassify, daysOfStock, suggestedThreshold, FULFILLMENT_FREE_STORAGE_DAYS } from "@foundone/shared";

describe("inventory-insights", () => {
  it("안전재고 제안 = ceil(일수요 × 리드타임 × 1.3)", () => {
    expect(suggestedThreshold({ quantity: 0, dailyUsage: 5, leadTimeDays: 2 })).toBe(13); // 5×2×1.3=13
    expect(suggestedThreshold({ quantity: 0, itemType: "product", monthlySales: 90, leadTimeDays: 3 })).toBe(12); // 3×3×1.3=11.7→12
    expect(suggestedThreshold({ quantity: 0, dailyUsage: 0 })).toBeNull(); // 수요 없으면 제안 안 함
  });

  it("회전일수 — 상품은 월판매/30, 수요 없으면 null, 재고 0이면 0", () => {
    expect(daysOfStock({ quantity: 30, itemType: "product", monthlySales: 30 })).toBe(30);
    expect(daysOfStock({ quantity: 10, itemType: "product", monthlySales: 0 })).toBeNull();
    expect(daysOfStock({ quantity: 0, itemType: "product", monthlySales: 30 })).toBe(0);
    expect(FULFILLMENT_FREE_STORAGE_DAYS).toBe(60);
  });

  it("ABC — 매출기여 누적 80/95%, 매출 계산 불가 항목은 null (위조 금지)", () => {
    const items = [
      { quantity: 1, itemType: "product" as const, monthlySales: 100, unitCost: 10000 }, // 100만 (80%) → A
      { quantity: 1, itemType: "product" as const, monthlySales: 15, unitCost: 10000 },  // 15만 (92%) → B
      { quantity: 1, itemType: "product" as const, monthlySales: 10, unitCost: 10000 },  // 10만 (100%) → C
      { quantity: 1, itemType: "material" as const, dailyUsage: 5 },                     // 재료 → null
    ];
    expect(abcClassify(items)).toEqual(["A", "B", "C", null]);
  });
});
