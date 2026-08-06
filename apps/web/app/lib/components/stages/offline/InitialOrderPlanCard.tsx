"use client";

/**
 * InitialOrderPlanCard — 공급처별 초기 발주 원자재 입력 + 재고 카드 자동 등록.
 *
 * 위치: VendorSetupStage 안, 공급처/장비/POS 선택 직후, MyIngredientsPlanCard 위.
 *
 * 사장님 신고 (2026-05-14): "공급처에서 원자재 공급업체를 고르잖아. 그때 어떤
 *   원자재를 골랐고 몇 개를 발주했는지 적게 하면 바로 운영 대시보드 재고 관리
 *   카드에 반영되게 할 수 있지 않을까?"
 *
 * 흐름:
 *   1. d.vendorSelections 에서 선택된 공급처(`vendor-setup_s1_c{cursor}`) 리스트 추출.
 *   2. 사장님이 각 공급처별로 받을 원자재를 추가: 이름·수량·단위·단가·카테고리.
 *   3. 입력 즉시 (a) decisions["vendor-setup"].inputs.initialMaterialsJson 에 영구 저장,
 *                (b) operations-store.inventory[] 에 itemType="material" + supplierName 채워 자동 반영.
 *   4. InventoryOpsCard 가 즉시 표시 → day-1 재고 등록 수고 0.
 *
 * 데이터 보존 규칙 (syncMaterialsToInventory):
 *   · 메뉴-design 가 등록한 product 아이템은 보존.
 *   · 사장님이 손으로 추가한 material 중 supplierName 이 없거나 이 카드 외에서 추가된 것 보존.
 *   · 이 카드가 만든 material 은 id prefix "init-mat-" 로 식별. 재추가 시 가격·수량만 갱신.
 */

import { useMemo, useCallback } from "react";
import { Boxes, Plus, Trash2, Truck } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { resolveVendorDisplayName } from "./vendor-setup-data";
import type { InventoryItem } from "../../../stores/operations-store";

const MIDNIGHT = "#191970";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.06)";

const STAGE_ID = "vendor-setup";
const ID_PREFIX = "init-mat-"; // 이 카드가 만든 material 식별용

export type InitialMaterialItem = {
  id: string;
  name: string;
  supplier: string;     // 사장님이 선택한 공급처 이름 (vendorSelections 에서 가져옴)
  quantity: number;     // 초기 발주 수량
  unit: string;         // kg, 개, L, 박스 등
  unitCost: number;     // 단가 (원)
  category: InventoryItem["category"];
  notes?: string;
};

const CATEGORY_OPTIONS: Array<{ id: InventoryItem["category"]; ko: string; en: string }> = [
  { id: "fresh", ko: "신선", en: "Fresh" },
  { id: "dry", ko: "건식", en: "Dry" },
  { id: "frozen", ko: "냉동", en: "Frozen" },
  { id: "beverage", ko: "음료", en: "Beverage" },
  { id: "supply", ko: "소모품", en: "Supply" },
  { id: "other", ko: "기타", en: "Other" },
];

export function InitialOrderPlanCard({ ko }: { ko: boolean }) {
  const d = useDashboardCtx();

  // 1. 선택된 공급처 추출 — vendor-setup_s1_c{cursor} 키.
  //    AI 위저드 커스텀 선택(`__etc__` 값)은 vendorCustomInputs 에서 표시명으로 해석 (2026-08-05).
  const suppliers = useMemo(() => {
    const sel = (d.vendorSelections ?? {}) as Record<string, string>;
    const custom = (d.vendorCustomInputs ?? {}) as Record<string, string>;
    const names = Object.entries(sel)
      .filter(([k]) => k.startsWith("vendor-setup_s1_"))
      .map(([k, v]) => resolveVendorDisplayName(typeof v === "string" ? v : "", k, custom))
      .filter((v) => v.length > 0);
    return Array.from(new Set(names));
  }, [d.vendorSelections, d.vendorCustomInputs]);

  // 2. 저장된 material 리스트 복원
  const inputs =
    (d.decisions[STAGE_ID]?.inputs as { initialMaterialsJson?: string } | undefined) ?? {};
  const items: InitialMaterialItem[] = useMemo(
    () => parseMaterials(inputs.initialMaterialsJson),
    [inputs.initialMaterialsJson],
  );

  // 3. 입력 폼 임시 상태 (guideSelections 사용)
  const sel = d.guideSelections;
  const setSel = d.setGuideSelections;
  const k = (suffix: string) => `init-order-${suffix}`;
  const fName = sel[k("name")] ?? "";
  const fSupplier = sel[k("supplier")] ?? (suppliers[0] ?? "");
  const fQty = sel[k("qty")] ?? "";
  const fUnit = sel[k("unit")] ?? (ko ? "kg" : "kg");
  const fUnitCost = sel[k("unitCost")] ?? "";
  const fCategory = (sel[k("category")] as InventoryItem["category"]) || "fresh";

  // 4. 영구 저장 + inventory 자동 sync
  const persist = useCallback(
    (next: InitialMaterialItem[]) => {
      d.setDecisions((prev: Record<string, unknown>) => ({
        ...prev,
        [STAGE_ID]: {
          ...((prev[STAGE_ID] as Record<string, unknown>) ?? {}),
          stageId: STAGE_ID,
          inputs: {
            ...(((prev[STAGE_ID] as Record<string, unknown>)?.inputs as Record<string, unknown>) ?? {}),
            initialMaterialsJson: JSON.stringify(next),
          },
        },
      }));
      syncMaterialsToInventory(next, d.inventory, d.setInventory);
    },
    [d],
  );

  const canAdd = fName.trim() && fSupplier && fQty && fUnitCost;

  const handleAdd = () => {
    if (!canAdd) return;
    const newItem: InitialMaterialItem = {
      id: `${ID_PREFIX}${Date.now()}`,
      name: fName.trim(),
      supplier: fSupplier.trim(),
      quantity: Number(fQty) || 0,
      unit: fUnit.trim() || "개",
      unitCost: Number(fUnitCost) || 0,
      category: fCategory,
    };
    persist([...items, newItem]);
    // form reset
    setSel((prev: Record<string, string>) => ({
      ...prev,
      [k("name")]: "",
      [k("qty")]: "",
      [k("unitCost")]: "",
    }));
  };

  const handleDelete = (id: string) => {
    persist(items.filter((x) => x.id !== id));
  };

  // 통계
  const totalCost = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const bySupplier = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.supplier] = (acc[i.supplier] ?? 0) + i.quantity * i.unitCost;
    return acc;
  }, {});

  return (
    <div
      style={{
        background: "white",
        border: `1px solid ${MIDNIGHT_BORDER}`,
        borderRadius: 16,
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        marginBottom: 16,
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={iconBoxStyle}>
          <Boxes size={14} strokeWidth={1.8} />
        </span>
        <div>
          <div style={eyebrowStyle}>
            {ko ? "초기 발주 계획 → 재고 자동 등록" : "Initial order → auto-register inventory"}
          </div>
          <div style={titleStyle}>
            {ko ? "공급처별로 받을 원자재·수량을 적어주세요" : "List ingredients & quantities per supplier"}
          </div>
        </div>
      </div>

      {/* 공급처 미선택 안내 */}
      {suppliers.length === 0 ? (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: "rgba(15,23,42,0.03)",
            border: "1px solid rgba(15,23,42,0.08)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <Truck size={16} strokeWidth={2} color="rgba(15,23,42,0.5)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.55 }}>
            {ko
              ? "위 「공급처 · 식자재 · 원자재」 섹션에서 사용할 곳을 먼저 선택하세요. 선택한 공급처들이 여기 발주 폼에 자동으로 표시됩니다."
              : "Select suppliers above first. They'll appear in the form below."}
          </div>
        </div>
      ) : (
        <>
          {/* 입력 폼 */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(25,25,112,0.025)",
              border: `1px solid ${MIDNIGHT_BORDER}`,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {ko ? "원자재 추가" : "Add ingredient"}
            </div>

            {/* 이름 */}
            <input
              type="text"
              placeholder={ko ? "원자재 이름 (예: 김치, 돼지고기 삼겹살, 라이트 원두)" : "Ingredient name"}
              value={fName}
              onChange={(e) => setSel((p: Record<string, string>) => ({ ...p, [k("name")]: e.target.value }))}
              style={inputStyle}
            />

            {/* 공급처 선택 (선택된 것들 칩) */}
            <div>
              <div style={fieldLabel}>{ko ? "공급처" : "Supplier"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {suppliers.map((s) => {
                  const isSel = fSupplier === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSel((p: Record<string, string>) => ({ ...p, [k("supplier")]: s }))}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: isSel ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.12)",
                        background: isSel ? `${MIDNIGHT}10` : "white",
                        color: isSel ? MIDNIGHT : "rgba(15,23,42,0.65)",
                        fontSize: 11.5,
                        fontWeight: isSel ? 700 : 500,
                        cursor: "pointer",
                        maxWidth: "100%",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 수량 · 단위 · 단가 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 0.7fr 1fr", gap: 6 }}>
              <input
                type="text"
                inputMode="decimal"
                placeholder={ko ? "발주 수량" : "Qty"}
                value={fQty}
                onChange={(e) => setSel((p: Record<string, string>) => ({ ...p, [k("qty")]: e.target.value.replace(/[^0-9.]/g, "") }))}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder={ko ? "단위 (kg/개/L)" : "Unit"}
                value={fUnit}
                onChange={(e) => setSel((p: Record<string, string>) => ({ ...p, [k("unit")]: e.target.value }))}
                style={inputStyle}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder={ko ? "단가 (원)" : "Unit cost"}
                value={fUnitCost}
                onChange={(e) => setSel((p: Record<string, string>) => ({ ...p, [k("unitCost")]: e.target.value.replace(/[^0-9]/g, "") }))}
                style={inputStyle}
              />
            </div>

            {/* 카테고리 */}
            <div>
              <div style={fieldLabel}>{ko ? "카테고리" : "Category"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {CATEGORY_OPTIONS.map((c) => {
                  const isSel = fCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSel((p: Record<string, string>) => ({ ...p, [k("category")]: c.id }))}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 7,
                        border: isSel ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.10)",
                        background: isSel ? `${MIDNIGHT}08` : "white",
                        color: isSel ? MIDNIGHT : "rgba(15,23,42,0.6)",
                        fontSize: 11,
                        fontWeight: isSel ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {ko ? c.ko : c.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 추가 버튼 */}
            <button
              type="button"
              disabled={!canAdd}
              onClick={handleAdd}
              style={{
                padding: "10px",
                borderRadius: 10,
                border: "none",
                background: canAdd ? MIDNIGHT : "rgba(25,25,112,0.1)",
                color: canAdd ? "white" : "rgba(25,25,112,0.3)",
                fontSize: 13,
                fontWeight: 700,
                cursor: canAdd ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 4,
              }}
            >
              <Plus size={14} strokeWidth={2.4} />
              {ko ? "발주 추가 + 재고 자동 등록" : "Add order + auto inventory"}
            </button>
          </div>

          {/* 등록된 발주 리스트 */}
          {items.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {ko ? `등록된 발주 ${items.length}건` : `${items.length} order${items.length === 1 ? "" : "s"}`}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: MIDNIGHT }}>
                  {ko ? "총액 " : "Total "}
                  ₩{Math.round(totalCost).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${MIDNIGHT_BORDER}`,
                      background: "rgba(25,25,112,0.02)",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{it.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                        {it.supplier} · {it.quantity}{it.unit} × ₩{it.unitCost.toLocaleString()} = ₩{Math.round(it.quantity * it.unitCost).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(it.id)}
                      style={{ padding: 6, background: "transparent", border: "none", color: "rgba(220,38,38,0.7)", cursor: "pointer" }}
                      aria-label="delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* 공급처별 합계 (3개 이상 공급처일 때) */}
              {Object.keys(bySupplier).length >= 2 && (
                <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(15,23,42,0.025)" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>
                    {ko ? "공급처별 합계" : "Per supplier"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {Object.entries(bySupplier).map(([sup, total]) => (
                      <div key={sup} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(15,23,42,0.7)" }}>{sup}</span>
                        <span style={{ fontWeight: 700, color: MIDNIGHT }}>₩{Math.round(total).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 하단 안내 */}
      <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 }}>
        {ko
          ? "여기 입력한 원자재는 운영 대시보드 「재고 관리」 카드에 자동 등록됩니다 (material 타입 + 공급처명 자동). 사장님이 day-1 에 재고 카드를 따로 채울 필요가 없어집니다."
          : "Items entered here auto-register in the operational dashboard's Inventory card (material type + supplier prefilled). No day-1 re-entry needed."}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────
function parseMaterials(json: string | undefined): InitialMaterialItem[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is InitialMaterialItem =>
      typeof x?.id === "string" &&
      typeof x?.name === "string" &&
      typeof x?.supplier === "string" &&
      typeof x?.quantity === "number" &&
      typeof x?.unitCost === "number",
    );
  } catch {
    return [];
  }
}

/**
 * 초기 발주 계획 → inventory[] 자동 동기화.
 *
 *   보존 규칙:
 *     1. itemType="product" 아이템 (menu-design 이 만든 메뉴) — 모두 보존.
 *     2. itemType="material" 이지만 id 가 `init-mat-` prefix 가 아닌 것
 *        (= 사장님이 손으로 InventoryOpsCard 에서 직접 추가한 것) — 보존.
 *     3. itemType="material" + id `init-mat-` prefix (= 이 카드가 만든 것)
 *        — materials 배열로 통째로 교체. 이름 매칭 시 quantity·unitCost 갱신 (lastOrderedAt 보존).
 */
function syncMaterialsToInventory(
  materials: InitialMaterialItem[],
  currentInventory: InventoryItem[],
  setInventory: (items: InventoryItem[]) => void,
) {
  // 기존 init-mat 아이템들 (name → 기존 item 매핑, lastOrderedAt 등 보존용)
  const existingInitByName = new Map(
    currentInventory
      .filter((i) => i.itemType === "material" && i.id.startsWith(ID_PREFIX))
      .map((i) => [i.name.toLowerCase().trim(), i]),
  );

  // 새 material 아이템 변환
  const syncedMaterials: InventoryItem[] = materials.map((m) => {
    const existing = existingInitByName.get(m.name.toLowerCase().trim());
    return {
      id: existing?.id ?? m.id,
      name: m.name,
      quantity: m.quantity,
      unit: m.unit || "개",
      minThreshold: existing?.minThreshold ?? Math.max(1, Math.round(m.quantity * 0.2)),
      unitCost: m.unitCost,
      category: m.category,
      itemType: "material" as const,
      sellingPrice: 0,
      expiryDate: existing?.expiryDate ?? "",
      supplierName: m.supplier,
      supplierUrl: existing?.supplierUrl ?? "",
      leadTimeDays: existing?.leadTimeDays ?? 1,
      dailyUsage: existing?.dailyUsage ?? 0,
      lastOrderedAt: existing?.lastOrderedAt ?? "",
      wasteLog: existing?.wasteLog ?? [],
    };
  });

  // 보존할 기존 아이템: products + non-init materials
  const preserved = currentInventory.filter(
    (i) => i.itemType === "product" || (i.itemType === "material" && !i.id.startsWith(ID_PREFIX)),
  );

  setInventory([...preserved, ...syncedMaterials]);
}

// ── 스타일 토큰 ─────────────────────────────────────────────────────────
const iconBoxStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 8,
  background: MIDNIGHT_SOFT,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: MIDNIGHT,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.7,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.01em",
  marginTop: 1,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(15,23,42,0.6)",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 11px",
  borderRadius: 8,
  border: "1px solid rgba(25,25,112,0.12)",
  fontSize: 13,
  fontWeight: 500,
  color: "#0f172a",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};
