import { describe, expect, it } from "vitest";
import {
  detectOverstockItems,
  suggestReorderQuantity,
  type InventoryItemForCycle,
} from "../finance/inventory-cycle";

const TODAY = new Date("2026-05-11T00:00:00Z");

describe("detectOverstockItems — 과주문 검출 (사장님 신고 케이스)", () => {
  it("사장님 신고 케이스: 100개 주문, 임계 20, 한 달 후 50개 남음 → 검출 (watch)", () => {
    const items: InventoryItemForCycle[] = [
      {
        id: "salt",
        name: "소금",
        quantity: 50, // 임계 20 × 2.0 = 40 초과
        minThreshold: 20,
        lastOrderedAt: "2026-04-10", // 31일 전
        unit: "kg",
      },
    ];
    const alerts = detectOverstockItems(items, { today: TODAY });
    expect(alerts.length).toBe(1);
    expect(alerts[0].itemId).toBe("salt");
    expect(alerts[0].daysSinceOrder).toBe(31);
    expect(alerts[0].currentQuantity).toBe(50);
    expect(alerts[0].threshold).toBe(20);
    expect(alerts[0].severity).toBe("watch"); // dailyUsage 없으면 watch
  });

  it("재고 60, 임계 20 → 3배 초과 + 31일 경과 → 검출", () => {
    const items: InventoryItemForCycle[] = [
      {
        id: "salt",
        name: "소금",
        quantity: 60,
        minThreshold: 20,
        lastOrderedAt: "2026-04-10",
      },
    ];
    const alerts = detectOverstockItems(items, { today: TODAY });
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("watch");
  });

  it("재고 40 = 임계 × 2.0 *정확히* — 검출 X (>= multiplier 이상이라야)", () => {
    const items: InventoryItemForCycle[] = [
      {
        id: "salt",
        name: "소금",
        quantity: 40, // 정확히 2배 (경계)
        minThreshold: 20,
        lastOrderedAt: "2026-04-10",
      },
    ];
    expect(detectOverstockItems(items, { today: TODAY }).length).toBe(0);
  });

  it("dailyUsage 있으면 *남은 일수* 검증 → 14일+ 남으면 alert", () => {
    // dailyUsage 1/일 + 60개 남음 → 60일 더 사용 가능 = 명백한 과주문
    const items: InventoryItemForCycle[] = [
      {
        id: "salt",
        name: "소금",
        quantity: 60,
        minThreshold: 20,
        dailyUsage: 1, // 60개 / 1 = 60일 남음
        lastOrderedAt: "2026-04-10",
        unit: "kg",
      },
    ];
    const alerts = detectOverstockItems(items, { today: TODAY });
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("alert"); // 60일 > 14일 cutoff
    expect(alerts[0].recommendation).toBe("reduce-quantity");
    expect(alerts[0].reasonKo).toContain("60일 더 사용 가능");
  });

  it("dailyUsage 있어도 14일 미만 남으면 watch (alert 격상 안 함)", () => {
    // 50개 남음, dailyUsage 5/일 → 10일 남음 = watch (양이 많긴 한데 곧 소진)
    const items: InventoryItemForCycle[] = [
      {
        id: "salt",
        name: "소금",
        quantity: 50,
        minThreshold: 20,
        dailyUsage: 5, // 50 / 5 = 10일 남음
        lastOrderedAt: "2026-04-10",
      },
    ];
    const alerts = detectOverstockItems(items, { today: TODAY });
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("watch"); // 10일 < 14일 cutoff
  });

  it("발주 이력 없음 → 검출 X (비교 기준 없음)", () => {
    const items: InventoryItemForCycle[] = [
      {
        id: "salt",
        name: "소금",
        quantity: 80,
        minThreshold: 20,
        // lastOrderedAt 없음
      },
    ];
    expect(detectOverstockItems(items, { today: TODAY }).length).toBe(0);
  });

  it("발주 주기 미달 (29일 전) → 검출 X (아직 한 달 안 됨)", () => {
    const items: InventoryItemForCycle[] = [
      {
        id: "salt",
        name: "소금",
        quantity: 80,
        minThreshold: 20,
        lastOrderedAt: "2026-04-13", // 28일 전
      },
    ];
    expect(detectOverstockItems(items, { today: TODAY, cycleThresholdDays: 30 }).length).toBe(0);
  });

  it("임계 미설정 → 검출 X (비교 기준 없음)", () => {
    const items: InventoryItemForCycle[] = [
      {
        id: "salt",
        name: "소금",
        quantity: 80,
        // minThreshold 없음
        lastOrderedAt: "2026-04-10",
      },
    ];
    expect(detectOverstockItems(items, { today: TODAY }).length).toBe(0);
  });

  it("잉여 자금 추정 (unitCost 있을 때)", () => {
    const items: InventoryItemForCycle[] = [
      {
        id: "oil",
        name: "식용유",
        quantity: 60,
        minThreshold: 20,    // safeStock = 30
        unitCost: 15_000,    // 한 통 15,000원
        lastOrderedAt: "2026-04-01", // 40일 전
        unit: "L",
      },
    ];
    const alerts = detectOverstockItems(items, { today: TODAY });
    expect(alerts.length).toBe(1);
    expect(alerts[0].excessUnits).toBe(30); // 60 - 30 (safeStock)
    expect(alerts[0].excessCostKrw).toBe(30 * 15_000);
  });

  it("정렬 — alert > watch, 그 후 잉여 자금 큰 순", () => {
    const items: InventoryItemForCycle[] = [
      {
        id: "a",
        name: "A",
        quantity: 100, minThreshold: 20,
        lastOrderedAt: "2026-04-10", unitCost: 1000,
        // 잉여 = 100 - 30 = 70, 잉여비용 70,000
      },
      {
        id: "b",
        name: "B",
        quantity: 200, minThreshold: 20,
        lastOrderedAt: "2026-04-10", unitCost: 5000,
        // 잉여 = 200 - 30 = 170, 잉여비용 850,000
      },
    ];
    const alerts = detectOverstockItems(items, { today: TODAY });
    expect(alerts.length).toBe(2);
    expect(alerts[0].itemId).toBe("b"); // 잉여 자금 더 큰 항목이 위
    expect(alerts[1].itemId).toBe("a");
  });

  it("여러 품목 중 정상 + 과주문 섞임 → 과주문만 반환", () => {
    const items: InventoryItemForCycle[] = [
      { id: "ok1", name: "정상1", quantity: 15, minThreshold: 20, lastOrderedAt: "2026-04-10" },  // 이미 발주 필요 (정상 흐름)
      { id: "ok2", name: "정상2", quantity: 30, minThreshold: 20, lastOrderedAt: "2026-05-01" },  // 10일 전 — 너무 빠름
      { id: "bad", name: "과주문", quantity: 80, minThreshold: 20, lastOrderedAt: "2026-04-10" }, // 검출 대상
    ];
    const alerts = detectOverstockItems(items, { today: TODAY });
    expect(alerts.length).toBe(1);
    expect(alerts[0].itemId).toBe("bad");
  });
});

describe("suggestReorderQuantity", () => {
  it("dailyUsage 알면 30일 × 사용량 × 1.2 (20% 버퍼)", () => {
    const item: InventoryItemForCycle = {
      id: "salt", name: "소금", quantity: 20, dailyUsage: 2,
    };
    expect(suggestReorderQuantity(item)).toBe(72); // 30 × 2 × 1.2 = 72
  });
  it("dailyUsage 미설정 → null (추정 불가)", () => {
    const item: InventoryItemForCycle = {
      id: "salt", name: "소금", quantity: 20,
    };
    expect(suggestReorderQuantity(item)).toBeNull();
  });
  it("커스텀 주기 (45일) 지정 가능", () => {
    const item: InventoryItemForCycle = {
      id: "salt", name: "소금", quantity: 20, dailyUsage: 1,
    };
    expect(suggestReorderQuantity(item, 45)).toBe(54); // 45 × 1 × 1.2 = 54
  });
});
