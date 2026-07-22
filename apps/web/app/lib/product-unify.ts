/**
 * 소매 상품 정규화 SSOT (2026-07-22 소매 상품모델 통합).
 *
 *  배경(조사 결과): 웹은 소매 판매상품을 products(구)·unifiedProducts(신) 별도 배열에,
 *  iOS 는 inventory(itemType="product") 하나에 담아 **웹↔iOS DB 컬럼이 달라 동기화 단절**.
 *  정본을 inventory 로 통일(iOS 정합) — 이 함수가 네 소스를 하나로 정규화해 읽기를 일원화한다.
 *
 *  ⚠️ 무손실·롤백: 기존 products/unifiedProducts/serviceMenuItems 컬럼은 삭제하지 않는다.
 *     이 함수가 읽기에서 흡수하므로 기존 데이터는 계속 보이고, 문제 시 입력 전환만 되돌리면 원복.
 *
 *  우선순위(같은 id 중복 시): inventory.product > unifiedProducts > products.
 *  serviceMenuItems 는 재고 없는 서비스 메뉴라 별도 흡수(stock 0).
 */

import type { InventoryItem, Product, UnifiedProduct, ServiceMenuItem } from "./stores/operations-store";

/** sell-through·성과 카드가 읽는 정규화 상품 shape (UnifiedProduct 상위 호환). */
export type RetailProduct = {
  id: string;
  name: string;
  category: string;
  price: number;      // 판매가
  cost: number;       // 원가
  stock: number;      // 재고 수량
  monthlySold: number;
  unit: string;
  minThreshold: number;
  supplierName: string;
  supplierUrl: string;
  leadTimeDays: number;
  dailyUsage: number;
  lastOrderedAt: string;
  /** 소진성(식자재·소모품) 여부 — 판매상품은 false */
  isConsumable: boolean;
};

function fromInventory(i: InventoryItem): RetailProduct {
  return {
    id: i.id, name: i.name, category: i.category ?? "",
    price: i.sellingPrice ?? 0, cost: i.unitCost ?? 0, stock: i.quantity ?? 0,
    monthlySold: i.monthlySold ?? 0, unit: i.unit ?? "",
    minThreshold: i.minThreshold ?? 0, supplierName: i.supplierName ?? "",
    supplierUrl: i.supplierUrl ?? "", leadTimeDays: i.leadTimeDays ?? 0,
    dailyUsage: i.dailyUsage ?? 0, lastOrderedAt: i.lastOrderedAt ?? "",
    isConsumable: i.itemType === "material",
  };
}
function fromProduct(p: Product): RetailProduct {
  return {
    id: p.id, name: p.name, category: p.category ?? "",
    price: p.price ?? 0, cost: p.cost ?? 0, stock: p.stock ?? 0,
    monthlySold: p.monthlySold ?? 0, unit: p.unit ?? "",
    minThreshold: 0, supplierName: "", supplierUrl: "", leadTimeDays: 0,
    dailyUsage: 0, lastOrderedAt: "", isConsumable: false,
  };
}
function fromUnified(u: UnifiedProduct): RetailProduct {
  return {
    id: u.id, name: u.name, category: u.category ?? "",
    price: u.price ?? 0, cost: u.cost ?? 0, stock: u.stock ?? 0,
    monthlySold: u.monthlySold ?? 0, unit: u.unit ?? "",
    minThreshold: u.minThreshold ?? 0, supplierName: u.supplierName ?? "",
    supplierUrl: u.supplierUrl ?? "", leadTimeDays: u.leadTimeDays ?? 0,
    dailyUsage: u.dailyUsage ?? 0, lastOrderedAt: u.lastOrderedAt ?? "",
    isConsumable: u.isConsumable ?? false,
  };
}
function fromServiceMenu(s: ServiceMenuItem): RetailProduct {
  return {
    id: s.id, name: s.name, category: s.category ?? "",
    price: s.price ?? 0, cost: 0, stock: 0, monthlySold: s.monthlySold ?? 0,
    unit: "", minThreshold: 0, supplierName: "", supplierUrl: "", leadTimeDays: 0,
    dailyUsage: 0, lastOrderedAt: "", isConsumable: false,
  };
}

type UnifyInput = {
  inventory?: InventoryItem[];
  products?: Product[];
  unifiedProducts?: UnifiedProduct[];
  serviceMenuItems?: ServiceMenuItem[];
};

/**
 * 네 소스를 하나의 소매 상품 목록으로 정규화.
 *  우선순위(id 중복): inventory.product > unifiedProducts > products. serviceMenu 는 항상 별도.
 *  @param includeServiceMenu 서비스 메뉴 포함 여부(sell-through 는 제외, 객단가/업셀은 포함).
 */
export function unifyRetailProducts(input: UnifyInput, includeServiceMenu = false): RetailProduct[] {
  const byId = new Map<string, RetailProduct>();
  // 낮은 우선순위부터 넣고 높은 것으로 덮어쓴다.
  for (const p of input.products ?? []) byId.set(p.id, fromProduct(p));
  for (const u of input.unifiedProducts ?? []) byId.set(u.id, fromUnified(u));
  for (const i of input.inventory ?? []) {
    if (i.itemType === "product") byId.set(i.id, fromInventory(i));
  }
  if (includeServiceMenu) {
    for (const s of input.serviceMenuItems ?? []) byId.set(s.id, fromServiceMenu(s));
  }
  return Array.from(byId.values());
}
