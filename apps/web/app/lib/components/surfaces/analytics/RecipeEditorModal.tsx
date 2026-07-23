"use client";

/**
 * RecipeEditorModal — 메뉴 레시피(BOM) 편집 팝업 (2026-07-22).
 *  재고 관리 카드의 재료(material)를 선택해 소요량·단위를 지정 → 원가율 자동 계산 +
 *  판매 시 재고 자동차감의 기준. 단위는 재료와 호환되는 것만 노출(개 소수·g·kg·ml·l).
 */

import { useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { InventoryItem, RecipeIngredient } from "../../../stores/operations-store";
import { compatibleUnits, ingredientCost, menuCostPerServing, menuCostRatio } from "../../../recipe-cost";
import { OverlayModal } from "../../OverlayModal";

const MIDNIGHT = "#191970";
const BRICK = "#b64c4c";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

type Props = {
  ko: boolean;
  menu: InventoryItem;
  materials: InventoryItem[];
  goldenMax?: number; // 황금률 원가율 기준(음식 33 / 서비스 25)
  onSave: (recipe: RecipeIngredient[]) => void;
  onClose: () => void;
};

const won = (n: number) => (isFinite(n) ? `₩${Math.round(n).toLocaleString()}` : "—");

export function RecipeEditorModal({ ko, menu, materials, goldenMax = 33, onSave, onClose }: Props) {
  const [recipe, setRecipe] = useState<RecipeIngredient[]>(() => menu.recipe ? [...menu.recipe] : []);
  const [addSel, setAddSel] = useState("");

  const preview = useMemo(() => ({ ...menu, recipe }), [menu, recipe]);
  const cost = menuCostPerServing(preview, materials);
  const ratio = menuCostRatio(preview, materials);
  const price = menu.sellingPrice || 0;

  const usedIds = new Set(recipe.map((r) => r.materialId));
  const addable = materials.filter((m) => !usedIds.has(m.id));

  const addIngredient = (materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return;
    setRecipe((prev) => [...prev, { materialId, qty: 1, unit: compatibleUnits(mat.unit)[0] }]);
    setAddSel("");
  };
  const updateRow = (i: number, patch: Partial<RecipeIngredient>) =>
    setRecipe((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRecipe((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <OverlayModal label={ko ? `${menu.name} 레시피` : `${menu.name} recipe`} onClose={onClose} maxWidth={520}>
      <>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>{menu.name}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              {ko ? "레시피 재료 · 원가율 자동 계산" : "Recipe ingredients · auto cost ratio"}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={ko ? "닫기" : "Close"}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* 원가 요약 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <Tile label={ko ? "판매가" : "Price"} value={won(price)} />
          <Tile label={ko ? "재료 원가" : "Cost"} value={won(cost)} />
          <Tile label={ko ? "원가율" : "Ratio"} value={price > 0 ? `${ratio.toFixed(0)}%` : "—"}
            tone={price > 0 && ratio > goldenMax ? "brick" : "midnight"}
            sub={ko ? `황금률 ${goldenMax}%` : `golden ${goldenMax}%`} />
        </div>

        {/* 재료 목록 */}
        {materials.length === 0 ? (
          <div style={{ padding: "18px 12px", textAlign: "center", color: MUTED, fontSize: 13, lineHeight: 1.6, background: "rgba(25,25,112,0.03)", borderRadius: 12 }}>
            {ko ? "재고 관리 카드에서 재료를 먼저 등록하세요.\n등록된 재료가 여기 선택지로 나타납니다."
                : "Register materials in the inventory card first."}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recipe.length === 0 && (
                <div style={{ fontSize: 12.5, color: MUTED, padding: "8px 2px" }}>
                  {ko ? "아직 재료가 없습니다. 아래에서 재료를 추가하세요." : "No ingredients yet. Add below."}
                </div>
              )}
              {recipe.map((ing, i) => {
                const mat = materials.find((m) => m.id === ing.materialId);
                const units = compatibleUnits(mat?.unit ?? "개");
                const lineCost = ingredientCost(ing, materials);
                return (
                  <div key={ing.materialId + i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", background: "rgba(25,25,112,0.02)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {mat?.name ?? (ko ? "삭제된 재료" : "Deleted")}
                      </div>
                      <div style={{ fontSize: 11, color: MUTED }}>
                        {mat ? `${won(mat.unitCost)}/${mat.unit} · ${ko ? "재고" : "stock"} ${mat.quantity}${mat.unit}` : ""}
                        {lineCost != null ? ` · ${won(lineCost)}` : ""}
                      </div>
                    </div>
                    <input
                      type="text" inputMode="decimal" aria-label={ko ? "소요량" : "Quantity"}
                      value={String(ing.qty)}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        updateRow(i, { qty: v === "" || v === "." ? 0 : parseFloat(v) });
                      }}
                      style={{ width: 58, textAlign: "right", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 8, padding: "7px 8px", fontSize: 14 }}
                    />
                    <select value={ing.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} aria-label={ko ? "단위" : "Unit"}
                      style={{ border: "1px solid rgba(15,23,42,0.14)", borderRadius: 8, padding: "7px 6px", fontSize: 13, background: "#fff" }}>
                      {units.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button type="button" onClick={() => removeRow(i)} aria-label={ko ? "삭제" : "Remove"}
                      style={{ background: "none", border: "none", cursor: "pointer", color: BRICK, padding: 4 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 재료 추가 */}
            {addable.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <select value={addSel} onChange={(e) => setAddSel(e.target.value)} aria-label={ko ? "재료 선택" : "Select material"}
                  style={{ flex: 1, border: "1px solid rgba(15,23,42,0.14)", borderRadius: 10, padding: "10px 10px", fontSize: 14, background: "#fff" }}>
                  <option value="">{ko ? "재료 선택…" : "Select material…"}</option>
                  {addable.map((m) => <option key={m.id} value={m.id}>{m.name} ({won(m.unitCost)}/{m.unit})</option>)}
                </select>
                <button type="button" disabled={!addSel} onClick={() => addSel && addIngredient(addSel)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0 16px", borderRadius: 10, border: "none", background: addSel ? MIDNIGHT : "rgba(25,25,112,0.25)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: addSel ? "pointer" : "default" }}>
                  <Plus size={15} /> {ko ? "추가" : "Add"}
                </button>
              </div>
            )}
          </>
        )}

        {/* 저장/취소 */}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button type="button" onClick={() => onSave(recipe)}
            style={{ flex: 1, padding: 13, borderRadius: 12, background: MIDNIGHT, color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            {ko ? "저장" : "Save"}
          </button>
          <button type="button" onClick={onClose}
            style={{ padding: "13px 20px", borderRadius: 12, background: "rgba(15,23,42,0.06)", color: INK, border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {ko ? "취소" : "Cancel"}
          </button>
        </div>
      </>
    </OverlayModal>
  );
}

function Tile({ label, value, sub, tone = "midnight" }: { label: string; value: string; sub?: string; tone?: "midnight" | "brick" }) {
  return (
    <div style={{ padding: "10px 8px", borderRadius: 12, background: "rgba(25,25,112,0.03)", display: "flex", flexDirection: "column", gap: 2, alignItems: "center", textAlign: "center" }}>
      <span style={{ fontSize: 17, fontWeight: 800, color: tone === "brick" ? BRICK : MIDNIGHT, lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: INK }}>{label}</span>
      {sub && <span style={{ fontSize: 9.5, color: MUTED }}>{sub}</span>}
    </div>
  );
}
