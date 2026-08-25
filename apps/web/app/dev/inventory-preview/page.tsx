"use client";

/**
 * /dev/inventory-preview — 재고 추적모드 분리 실렌더 검증 (dev 전용, prod 404).
 *
 * 2026-08-25 추적모드 분리: 벌크(무게·부피 단위) 재료는 잔량·발주임계 대신
 * 원가·발주 리듬으로 관리 (inventory-tracking SSOT). 검증 시나리오:
 *  · 우유(ml, 주기 3일·5일 경과) → 벌크 섹션 + "발주 시기 확인" 배지
 *  · 밀가루(kg, 발주 기록 없음)  → 벌크 섹션 + "발주 기록 없음"
 *  · 컵(개, 40/최소50)          → 수량 목록 + "발주 필요"
 *  · 빨대(개, 500/최소100)      → 수량 목록 정상
 *  · 폼에서 단위를 g 로 바꾸면 수량·최소수량·일사용량 → 발주주기로 전환
 */
import { useState } from "react";
import { notFound } from "next/navigation";
import { InventoryOpsCard } from "../../lib/components/dashboard/InventoryOpsCard";
import type { InventoryItem, InvForm } from "../../lib/stores/operations-store";
import type { DashboardHook } from "../../lib/useDashboard";
import { isCountTracked } from "@foundone/shared";
import { applyRecipeStockDelta } from "../../lib/recipe-cost";

const base = {
  minThreshold: 0, unitCost: 0, category: "other" as const, itemType: "material" as const,
  sellingPrice: 0, expiryDate: "", supplierName: "", supplierUrl: "",
  leadTimeDays: 1, dailyUsage: 0, lastOrderedAt: "", wasteLog: [] as InventoryItem["wasteLog"],
};

const daysAgoIso = (n: number) => {
  const d = new Date(Date.now() - n * 86_400_000);
  return d.toISOString().slice(0, 10);
};

const FIXTURE: InventoryItem[] = [
  { ...base, id: "m1", name: "우유", quantity: 0, unit: "ml", unitCost: 3, category: "fresh", lastOrderedAt: daysAgoIso(5), orderCycleDays: 3 },
  { ...base, id: "m2", name: "밀가루", quantity: 0, unit: "kg", unitCost: 1800, category: "dry" },
  { ...base, id: "m3", name: "테이크아웃 컵 16oz", quantity: 40, unit: "개", minThreshold: 50, unitCost: 150, category: "supply", dailyUsage: 30 },
  { ...base, id: "m4", name: "빨대", quantity: 500, unit: "개", minThreshold: 100, unitCost: 20, category: "supply" },
  { ...base, id: "p1", name: "아메리카노", quantity: 0, unit: "개", itemType: "product", sellingPrice: 4500,
    recipe: [{ materialId: "m1", qty: 30, unit: "ml" }],
    // 홀/포장 분리 (2026-08-25) — 포장 추가 재료 지정 시 카운터 분할 검증용
    takeoutRecipe: [{ materialId: "m3", qty: 1, unit: "개" }, { materialId: "m4", qty: 1, unit: "개" }],
    monthlySold: 8, monthlySoldTakeout: 5 },
];

const EMPTY_FORM: InvForm = {
  open: false, editId: null, name: "", qty: "", unit: "개", threshold: "",
  unitCost: "", category: "other", itemType: "material", sellingPrice: "",
  displayCategory: "", expiryDate: "", supplierName: "", url: "", leadTimeDays: "", dailyUsage: "", orderCycleDays: "",
  purchasePackSize: "", purchasePackPrice: "",
};

export default function InventoryPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [inventory, setInventory] = useState<InventoryItem[]>(FIXTURE);
  const [invForm, setInvForm] = useState<InvForm>(EMPTY_FORM);

  const lowStockItems = inventory.filter(
    (i) => i.itemType !== "product" && isCountTracked(i) && (i.minThreshold ?? 0) > 0 && i.quantity <= (i.minThreshold ?? 0),
  );

  const d = {
    invForm,
    setInvForm: (v: InvForm | ((prev: InvForm) => InvForm)) =>
      setInvForm((prev) => (typeof v === "function" ? v(prev) : v)),
    emptyInvForm: EMPTY_FORM,
    inventory,
    saveInventory: (next: InventoryItem[]) => setInventory(next),
    handleInvSave: () => {
      if (!invForm.name.trim()) return undefined;
      // 구매 묶음 → 단가 파생 (useOperationsHandlers.handleInvSave 와 동일 공식)
      const packSize = Number(invForm.purchasePackSize) || 0;
      const packPrice = Number(invForm.purchasePackPrice) || 0;
      const item: InventoryItem = {
        ...base,
        id: invForm.editId ?? Date.now().toString(),
        name: invForm.name.trim(), quantity: Number(invForm.qty) || 0, unit: invForm.unit,
        minThreshold: Number(invForm.threshold) || 0,
        unitCost: packSize > 0 && packPrice > 0 ? packPrice / packSize : (Number(invForm.unitCost) || 0),
        purchasePackSize: packSize || undefined, purchasePackPrice: packPrice || undefined,
        category: invForm.category, itemType: invForm.itemType,
        sellingPrice: Number(invForm.sellingPrice) || 0,
        orderCycleDays: Number(invForm.orderCycleDays) || undefined,
      };
      setInventory((prev) => (invForm.editId ? prev.map((i) => (i.id === invForm.editId ? item : i)) : [...prev, item]));
      setInvForm(EMPTY_FORM);
      return item.id;
    },
    handleInvQty: (id: string, delta: number) =>
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))),
    handleInvDelete: (id: string) => setInventory((prev) => prev.filter((i) => i.id !== id)),
    // 홀/포장 판매 카운터 — useOperationsHandlers.handleProdSoldChange 와 동일 로직 (2026-08-25)
    handleProdSoldChange: (id: string, delta: number, takeout = false) => {
      setInventory((prev) => {
        const menu = prev.find((i) => i.id === id);
        if (!menu) return prev;
        const total = menu.monthlySold ?? 0;
        const tk = menu.monthlySoldTakeout ?? 0;
        let actualDelta: number;
        let nextTk = tk;
        if (takeout) {
          nextTk = Math.max(0, tk + delta);
          actualDelta = nextTk - tk;
        } else {
          const hall = Math.max(0, total - tk);
          actualDelta = Math.max(0, hall + delta) - hall;
        }
        if (actualDelta === 0) return prev;
        const withSold = prev.map((i) => i.id === id
          ? { ...i, monthlySold: Math.max(0, total + actualDelta), monthlySoldTakeout: nextTk > 0 ? nextTk : undefined }
          : i);
        return applyRecipeStockDelta(withSold, id, actualDelta, takeout);
      });
    },
    handleMarkOrdered: (id: string) =>
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, lastOrderedAt: daysAgoIso(0) } : i))),
    openInvEdit: (item: InventoryItem) =>
      setInvForm({
        open: true, editId: item.id, name: item.name, qty: String(item.quantity), unit: item.unit,
        threshold: String(item.minThreshold), unitCost: item.unitCost ? String(item.unitCost) : "",
        category: item.category ?? "other", itemType: item.itemType ?? "material",
        sellingPrice: item.sellingPrice ? String(item.sellingPrice) : "",
        displayCategory: item.displayCategory ?? "", expiryDate: item.expiryDate ?? "",
        supplierName: item.supplierName ?? "", url: item.supplierUrl ?? "",
        leadTimeDays: item.leadTimeDays ? String(item.leadTimeDays) : "",
        dailyUsage: item.dailyUsage ? String(item.dailyUsage) : "",
        orderCycleDays: item.orderCycleDays ? String(item.orderCycleDays) : "",
        purchasePackSize: item.purchasePackSize ? String(item.purchasePackSize) : "",
        purchasePackPrice: item.purchasePackPrice ? String(item.purchasePackPrice) : "",
      }),
    businessCtx: { categoryId: "cafe-dessert", inventoryMode: "separate", inventoryLabel: undefined },
    vendorSelections: {},
    language: "ko",
  } as unknown as DashboardHook;

  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", letterSpacing: "0.12em", marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
        DEV 프리뷰 — 재고 추적모드 분리 + 카페 스타터팩
        {/* 스타터 체크리스트는 재료 0개 콜드스타트에서만 — 비우기로 재현 */}
        <button type="button" onClick={() => setInventory([])} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(25,25,112,0.25)", background: "#fff", cursor: "pointer" }}>
          비우기 (콜드스타트 재현)
        </button>
        <button type="button" onClick={() => setInventory(FIXTURE)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(25,25,112,0.25)", background: "#fff", cursor: "pointer" }}>
          픽스처 복원
        </button>
      </div>
      <InventoryOpsCard ko inventory={inventory} lowStockItems={lowStockItems} d={d} />
    </div>
  );
}
