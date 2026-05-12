import { describe, expect, it } from "vitest";
import {
  sellThroughRate,
  averageSellThrough,
  topSellers,
  deadStock,
  lowStock,
  topNRevenueShare,
  deadStockCapital,
  type SellThroughProduct,
} from "../finance/sell-through";

const make = (over: Partial<SellThroughProduct>): SellThroughProduct => ({
  id: over.id ?? "1",
  name: over.name ?? "test",
  price: over.price ?? 10_000,
  cost: over.cost ?? 5_000,
  stock: over.stock ?? 0,
  monthlySold: over.monthlySold ?? 0,
});

describe("sellThroughRate", () => {
  it("80%+ excellent — 80 판매 / 20 재고 = 80%", () => {
    expect(sellThroughRate(make({ monthlySold: 80, stock: 20 }))).toBe(80);
  });
  it("60% healthy — 60 판매 / 40 재고", () => {
    expect(sellThroughRate(make({ monthlySold: 60, stock: 40 }))).toBe(60);
  });
  it("slow mover — 30 판매 / 70 재고 = 30%", () => {
    expect(sellThroughRate(make({ monthlySold: 30, stock: 70 }))).toBe(30);
  });
  it("dead stock — 0 판매 = 0%", () => {
    expect(sellThroughRate(make({ monthlySold: 0, stock: 50 }))).toBe(0);
  });
  it("재고도 판매도 0 = 0% (divide by zero 보호)", () => {
    expect(sellThroughRate(make({ monthlySold: 0, stock: 0 }))).toBe(0);
  });
});

describe("averageSellThrough", () => {
  it("3 상품 평균", () => {
    const products = [
      make({ id: "1", monthlySold: 80, stock: 20 }),  // 80%
      make({ id: "2", monthlySold: 60, stock: 40 }),  // 60%
      make({ id: "3", monthlySold: 40, stock: 60 }),  // 40%
    ];
    expect(averageSellThrough(products)).toBe(60);
  });
  it("빈 배열 = 0", () => {
    expect(averageSellThrough([])).toBe(0);
  });
});

describe("topSellers", () => {
  it("월 판매 수량 desc 정렬, top 5", () => {
    const products = [
      make({ id: "a", monthlySold: 10 }),
      make({ id: "b", monthlySold: 30 }),
      make({ id: "c", monthlySold: 20 }),
      make({ id: "d", monthlySold: 50 }),
      make({ id: "e", monthlySold: 40 }),
      make({ id: "f", monthlySold: 5 }),
    ];
    const top = topSellers(products, 5);
    expect(top.map((p) => p.id)).toEqual(["d", "e", "b", "c", "a"]);
    expect(top[0].rate).toBeDefined();
  });

  it("n 보다 적은 상품 — 전체 반환", () => {
    const products = [make({ id: "a", monthlySold: 5 })];
    expect(topSellers(products, 5)).toHaveLength(1);
  });
});

describe("deadStock", () => {
  it("rate <20% & stock>0 — dead", () => {
    const products = [
      make({ id: "a", monthlySold: 5, stock: 95 }),    // 5% dead
      make({ id: "b", monthlySold: 0, stock: 50 }),    // 0% dead
      make({ id: "c", monthlySold: 25, stock: 75 }),   // 25% slow but not dead
      make({ id: "d", monthlySold: 5, stock: 0 }),     // 재고 X (제외)
    ];
    const dead = deadStock(products);
    expect(dead.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("lowStock", () => {
  it("stock/sold < 0.3 — low (한 달 안 떨어짐)", () => {
    const products = [
      make({ id: "a", monthlySold: 100, stock: 25 }),  // 0.25, low
      make({ id: "b", monthlySold: 100, stock: 50 }),  // 0.50, safe
      make({ id: "c", monthlySold: 0, stock: 50 }),    // monthlySold=0 (제외)
      make({ id: "d", monthlySold: 50, stock: 10 }),   // 0.20, low
    ];
    const low = lowStock(products);
    expect(low.map((p) => p.id).sort()).toEqual(["a", "d"]);
  });
});

describe("topNRevenueShare", () => {
  it("top 5 매출 비중", () => {
    const products = [
      make({ id: "a", monthlySold: 100, price: 10_000 }),  // 100만
      make({ id: "b", monthlySold: 50, price: 20_000 }),   // 100만
      make({ id: "c", monthlySold: 10, price: 5_000 }),    // 5만
      make({ id: "d", monthlySold: 5, price: 1_000 }),     // 0.5만
    ];
    // top 2 = 200만 / total 205.5만 = 약 97%
    const share = topNRevenueShare(products, 2);
    expect(share.sharePct).toBe(97);
  });

  it("70%+ = 집중 risk", () => {
    const products = [
      make({ id: "a", monthlySold: 100, price: 100_000 }),  // 1000만
      make({ id: "b", monthlySold: 10, price: 10_000 }),    // 10만
    ];
    const share = topNRevenueShare(products, 1);
    expect(share.sharePct).toBeGreaterThan(70);
  });
});

describe("deadStockCapital", () => {
  it("재고×원가 합산", () => {
    const products = [
      make({ id: "a", monthlySold: 0, stock: 100, cost: 5_000 }),    // dead, 50만 묶임
      make({ id: "b", monthlySold: 100, stock: 50, cost: 3_000 }),   // 67%, not dead
      make({ id: "c", monthlySold: 5, stock: 100, cost: 10_000 }),   // 5% dead, 100만
    ];
    expect(deadStockCapital(products)).toBe(500_000 + 1_000_000);
  });
});
