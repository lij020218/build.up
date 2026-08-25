"use client";

/**
 * RecipeEditorModal — 메뉴 레시피(BOM) 편집 팝업 (2026-07-22).
 *  재고 관리 카드의 재료(material)를 선택해 소요량·단위를 지정 → 원가율 자동 계산 +
 *  판매 시 재고 자동차감의 기준. 단위는 재료와 호환되는 것만 노출(개 소수·g·kg·ml·l).
 *
 *  홀/포장 분리 (2026-08-25, 사장님 지시): "포장 추가 재료" 섹션 — 컵·뚜껑·빨대 등
 *  포장 판매에만 붙는 재료. 지정하면 판매 카운터가 홀/포장으로 분할되고 포장 원가율 병기.
 *  소모품(supply) 재료는 원탭 칩으로 빠르게 추가 (아이스/핫 구성이 메뉴마다 달라 자동 세팅은 금지).
 */

import { useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { InventoryItem, RecipeIngredient } from "../../../stores/operations-store";
import { compatibleUnits, ingredientCost, menuCostPerServing, menuCostRatio, takeoutExtraCost } from "../../../recipe-cost";
import { isCountTracked } from "@foundone/shared";
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
  onSave: (recipe: RecipeIngredient[], takeoutRecipe: RecipeIngredient[]) => void;
  onClose: () => void;
};

const won = (n: number) => (isFinite(n) ? `₩${Math.round(n).toLocaleString()}` : "—");

/** 편집 중 행 — 소요량은 문자열로 유지해 "0.3" 같은 소수 입력이 중간 상태("0.")에서 안 깨지게. */
type EditRow = { materialId: string; qtyText: string; unit: string };

/** 소수점 1개까지 허용하는 수량 문자열 정리. */
function sanitizeQty(v: string): string {
  const cleaned = v.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

const toRows = (recipe: RecipeIngredient[] | undefined): EditRow[] =>
  (recipe ?? []).map((r) => ({ materialId: r.materialId, qtyText: String(r.qty), unit: r.unit }));
const toRecipe = (rows: EditRow[]): RecipeIngredient[] =>
  rows.map((r) => ({ materialId: r.materialId, qty: parseFloat(r.qtyText) || 0, unit: r.unit }));

export function RecipeEditorModal({ ko, menu, materials, goldenMax = 33, onSave, onClose }: Props) {
  const [rows, setRows] = useState<EditRow[]>(() => toRows(menu.recipe));
  const [tkRows, setTkRows] = useState<EditRow[]>(() => toRows(menu.takeoutRecipe));
  const [addSel, setAddSel] = useState("");
  const [tkAddSel, setTkAddSel] = useState("");

  // 미리보기·저장용 정규 레시피 (문자열 → 숫자)
  const recipe = useMemo(() => toRecipe(rows), [rows]);
  const takeoutRecipe = useMemo(() => toRecipe(tkRows), [tkRows]);
  const preview = useMemo(() => ({ ...menu, recipe, takeoutRecipe }), [menu, recipe, takeoutRecipe]);
  const cost = menuCostPerServing(preview, materials);
  const ratio = menuCostRatio(preview, materials);
  const extra = takeoutExtraCost(preview, materials);
  const price = menu.sellingPrice || 0;
  const takeoutRatio = price > 0 ? ((cost + extra) / price) * 100 : 0;
  const hasTakeout = tkRows.length > 0;

  const addIngredient = (
    materialId: string,
    setter: React.Dispatch<React.SetStateAction<EditRow[]>>,
    clearSel: () => void,
  ) => {
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return;
    setter((prev) => [...prev, { materialId, qtyText: "1", unit: compatibleUnits(mat.unit)[0] }]);
    clearSel();
  };

  /** 재료 행 목록 + 추가 셀렉트 — 기본/포장 두 섹션이 같은 UI 를 공유 */
  const rowList = (
    list: EditRow[],
    setter: React.Dispatch<React.SetStateAction<EditRow[]>>,
    sel: string,
    setSel: (v: string) => void,
    emptyText: string,
  ) => {
    const usedIds = new Set(list.map((r) => r.materialId));
    const addable = materials.filter((m) => !usedIds.has(m.id));
    const normalized = toRecipe(list);
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.length === 0 && (
            <div style={{ fontSize: 12.5, color: MUTED, padding: "8px 2px" }}>{emptyText}</div>
          )}
          {list.map((row, i) => {
            const mat = materials.find((m) => m.id === row.materialId);
            const units = compatibleUnits(mat?.unit ?? "개");
            const lineCost = ingredientCost(normalized[i], materials);
            return (
              <div key={row.materialId + i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", background: "rgba(25,25,112,0.02)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {mat?.name ?? (ko ? "삭제된 재료" : "Deleted")}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED }}>
                    {/* 단가 0 = 원가율 과소표시 위험 → "단가 미입력" 정직 표기. 벌크 재료는 잔량 미추적이라 재고 숨김 (2026-08-25) */}
                    {mat ? (
                      <>
                        {mat.unitCost > 0
                          ? `${won(mat.unitCost)}/${mat.unit}`
                          : <span style={{ color: BRICK, fontWeight: 600 }}>{ko ? "단가 미입력" : "No unit cost"}</span>}
                        {isCountTracked(mat) ? ` · ${ko ? "재고" : "stock"} ${mat.quantity}${mat.unit}` : ""}
                      </>
                    ) : ""}
                    {lineCost != null && lineCost > 0 ? ` · ${won(lineCost)}` : ""}
                  </div>
                </div>
                <input
                  type="text" inputMode="decimal" aria-label={ko ? "소요량" : "Quantity"}
                  value={row.qtyText}
                  onChange={(e) => setter((prev) => prev.map((r, idx) => (idx === i ? { ...r, qtyText: sanitizeQty(e.target.value) } : r)))}
                  style={{ width: 58, textAlign: "right", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 8, padding: "7px 8px", fontSize: 14 }}
                />
                <select value={row.unit} onChange={(e) => setter((prev) => prev.map((r, idx) => (idx === i ? { ...r, unit: e.target.value } : r)))} aria-label={ko ? "단위" : "Unit"}
                  style={{ border: "1px solid rgba(15,23,42,0.14)", borderRadius: 8, padding: "7px 6px", fontSize: 13, background: "#fff" }}>
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <button type="button" onClick={() => setter((prev) => prev.filter((_, idx) => idx !== i))} aria-label={ko ? "삭제" : "Remove"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: BRICK, padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
        {addable.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <select value={sel} onChange={(e) => setSel(e.target.value)} aria-label={ko ? "재료 선택" : "Select material"}
              style={{ flex: 1, border: "1px solid rgba(15,23,42,0.14)", borderRadius: 10, padding: "10px 10px", fontSize: 14, background: "#fff" }}>
              <option value="">{ko ? "재료 선택…" : "Select material…"}</option>
              {addable.map((m) => <option key={m.id} value={m.id}>{m.name} ({won(m.unitCost)}/{m.unit})</option>)}
            </select>
            <button type="button" disabled={!sel} onClick={() => sel && addIngredient(sel, setter, () => setSel(""))}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "0 16px", borderRadius: 10, border: "none", background: sel ? MIDNIGHT : "rgba(25,25,112,0.25)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: sel ? "pointer" : "default" }}>
              <Plus size={15} /> {ko ? "추가" : "Add"}
            </button>
          </div>
        )}
      </>
    );
  };

  // 포장 섹션 원탭 후보 — 소모품(supply) 개수형 재료. 아이스/핫 구성이 메뉴마다 달라 자동 세팅은 안 함.
  const tkUsed = new Set(tkRows.map((r) => r.materialId));
  const supplyChips = materials.filter((m) => m.category === "supply" && isCountTracked(m) && !tkUsed.has(m.id));

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

        {/* 원가 요약 — 포장 지정 시 포장 원가·원가율 병기 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <Tile label={ko ? "판매가" : "Price"} value={won(price)} />
          <Tile label={ko ? "재료 원가" : "Cost"} value={won(cost)}
            sub={hasTakeout && extra > 0 ? (ko ? `포장 +${won(extra)}` : `TO +${won(extra)}`) : undefined} />
          <Tile label={ko ? "원가율" : "Ratio"} value={price > 0 ? `${ratio.toFixed(0)}%` : "—"}
            tone={price > 0 && (hasTakeout ? Math.max(ratio, takeoutRatio) : ratio) > goldenMax ? "brick" : "midnight"}
            sub={hasTakeout && price > 0 ? (ko ? `포장 ${takeoutRatio.toFixed(0)}% · 황금률 ${goldenMax}%` : `TO ${takeoutRatio.toFixed(0)}%`) : (ko ? `황금률 ${goldenMax}%` : `golden ${goldenMax}%`)} />
        </div>

        {materials.length === 0 ? (
          <div style={{ padding: "18px 12px", textAlign: "center", color: MUTED, fontSize: 13, lineHeight: 1.6, background: "rgba(25,25,112,0.03)", borderRadius: 12 }}>
            {ko ? "재고 관리 카드에서 재료를 먼저 등록하세요.\n등록된 재료가 여기 선택지로 나타납니다."
                : "Register materials in the inventory card first."}
          </div>
        ) : (
          <>
            {/* 기본 레시피 (홀·포장 공통) */}
            <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
              {ko ? "기본 레시피 (홀·포장 공통)" : "Base recipe"}
            </div>
            {rowList(rows, setRows, addSel, setAddSel,
              ko ? "아직 재료가 없습니다. 아래에서 재료를 추가하세요." : "No ingredients yet. Add below.")}

            {/* 포장 추가 재료 — 포장 판매에만 차감·원가 반영 */}
            <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const, margin: "16px 0 2px" }}>
              {ko ? "포장 추가 재료" : "Takeout extras"}
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>
              {ko ? "컵·뚜껑·빨대처럼 포장 판매에만 붙는 재료. 지정하면 판매 기록이 홀/포장으로 나뉘어요."
                  : "Cup, lid, straw — deducted only on takeout sales. Splits the sale counter."}
            </div>
            {/* 소모품 원탭 칩 — 비어 있을 때 빠른 시작 */}
            {tkRows.length === 0 && supplyChips.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 8 }}>
                {supplyChips.map((m) => (
                  <button key={m.id} type="button" onClick={() => addIngredient(m.id, setTkRows, () => setTkAddSel(""))}
                    style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, cursor: "pointer", border: "1px solid rgba(25,25,112,0.25)", background: "rgba(25,25,112,0.04)", color: MIDNIGHT }}>
                    + {m.name}
                  </button>
                ))}
              </div>
            )}
            {rowList(tkRows, setTkRows, tkAddSel, setTkAddSel,
              ko ? "지정 안 하면 지금처럼 판매 카운터 하나로 동작해요." : "Optional — leave empty to keep a single counter.")}
          </>
        )}

        {/* 저장/취소 */}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button type="button" onClick={() => onSave(recipe, takeoutRecipe)}
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
