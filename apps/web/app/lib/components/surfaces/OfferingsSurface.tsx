"use client";

/**
 * OfferingsSurface — "내가 파는 것" 탭 (2026-07-25 신설, 사장님 피드백 "재고·메뉴를 따로 페이지로").
 *
 *  정체성: 재고가 아니라 **오퍼링 관리**. 업종에 따라 판매 단위가 다르다:
 *   메뉴(외식·카페) / 상품(소매) / 시술(뷰티·생활서비스) / 권종·이용권(피트니스·교육·스터디카페) /
 *   요금제(공간) / 플랜(구독). 분기 SSOT = packages/shared/src/offering-kinds.ts (70개 세부업종 전수).
 *
 *  구성:
 *   · menu-bom / stocked-goods / service-menu → 기존 InventoryOpsCard 이관 (CRUD·레시피·발주 전부)
 *   · membership / space-booking / digital-goods / subscription-plan / project-service
 *     → OfferingCatalogCard — 권종 카탈로그 + 권종별 판매 수 (사장님 결정 2026-07-25:
 *       스터디카페는 갱신 관리가 아니라 "시간권·5,000원권 몇 명" 회전 관리).
 *
 *  정직성: 원가율 자동계산은 menu-bom(재료 BOM 실재)만 — offering-kinds 가드 테스트로 강제.
 *  데이터 정본: operations-store inventory (itemType=product) — 모델 변경 없음, UI 재배치만.
 *  iOS 미러: OfferingsView.swift (AppRoot .offerings 탭)
 */

import { useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  resolveOfferingKind,
  resolveOfferingFlags,
  offeringMeta,
  type OfferingKind,
} from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { useDashboardComputed } from "../../hooks/useDashboardComputed";
import { InventoryOpsCard } from "../dashboard/InventoryOpsCard";
import type { DashboardHook } from "../../useDashboard";

const MIDNIGHT = "#191970";
const INK = "#0f172a";
const MUTED = "rgba(15,23,42,0.55)";

const cardShell: React.CSSProperties = {
  background: "white", borderRadius: 16, border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04)", padding: "16px 18px",
};

/** 기존 재고 카드가 그대로 담당하는 유형 (CRUD·레시피·발주·CSV 완비) */
const INVENTORY_KINDS = new Set<OfferingKind>(["menu-bom", "stocked-goods", "service-menu"]);

export function OfferingsSurface() {
  const d = useDashboardCtx();
  const c = useDashboardComputed(d);
  const ko = d.language === "ko";

  const subIndustryId = d.selectedIndustryId || null;
  const kind = resolveOfferingKind(subIndustryId, d.industryCategoryId);

  if (kind === "hidden") return null; // 탭 미노출 업종 — 직접 URL 진입 방어
  const meta = offeringMeta(kind);
  const flags = resolveOfferingFlags(subIndustryId);

  return (
    <main style={{ width: "min(1080px, calc(100vw - 32px))", margin: "0 auto", padding: "24px 0 80px", display: "flex", flexDirection: "column", gap: 18 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.65, letterSpacing: "0.12em" }}>OFFERINGS</div>
        <h1 style={{ fontSize: 26, fontWeight: 750, letterSpacing: "-0.025em", color: INK, margin: 0 }}>
          {ko ? meta.tabLabel.ko : meta.tabLabel.en}
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, margin: 0, maxWidth: 620 }}>
          {ko ? meta.pageSub.ko : meta.pageSub.en}
        </p>
      </header>

      {INVENTORY_KINDS.has(kind) ? (
        kind === "stocked-goods" ? (
          // 소매·이커머스 — 상품이 곧 재고라 분리할 두 실체가 없음: 통합 카드 유지.
          <InventoryOpsCard ko={ko} inventory={c.inventory} lowStockItems={c.lowStockItems} d={d} />
        ) : (
          // 메뉴/시술 업종 (2026-07-27 사장님 지시): 통합 카드는 대시보드 몫,
          //   전용 페이지에선 메뉴 카드와 재고 카드를 명확히 분리.
          <>
            <InventoryOpsCard ko={ko} inventory={c.inventory} lowStockItems={c.lowStockItems} d={d} section="menu" />
            <InventoryOpsCard
              ko={ko}
              inventory={c.inventory.filter((i) => i.itemType !== "product")}
              lowStockItems={c.lowStockItems.filter((i) => i.itemType !== "product")}
              d={d}
              section="stock"
            />
          </>
        )
      ) : (
        <OfferingCatalogCard d={d} ko={ko} unitLabel={ko ? meta.unitLabel.ko : meta.unitLabel.en} kind={kind} />
      )}

      {flags.consignment && (
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, padding: "0 2px" }}>
          {ko ? "위탁 판매 업종 — 수량은 위탁처 기준이라 실보유 재고와 다를 수 있어요." : "Consignment — quantities may differ from physical stock."}
        </div>
      )}
    </main>
  );
}

// ── 권종 카탈로그 — membership 계열 유형용 (재고·원가 어휘 없음) ──
//    데이터는 동일 정본(inventory, itemType=product): 권종=상품 항목, 판매 수=monthlySold.
//    폼은 d.invForm 재사용(같은 화면에 InventoryOpsCard 가 없을 때만 마운트되므로 충돌 없음).

type CatalogItem = {
  id: string;
  name: string;
  itemType?: "material" | "product";
  sellingPrice?: number;
  monthlySold?: number;
  displayCategory?: string;
};

function fmtWon(n: number): string {
  if (!isFinite(n) || n <= 0) return "—";
  return `${n.toLocaleString()}원`;
}

function OfferingCatalogCard({ d, ko, unitLabel, kind }: { d: DashboardHook; ko: boolean; unitLabel: string; kind: OfferingKind }) {
  const items = useMemo(
    () => (d.inventory as CatalogItem[]).filter((i) => i.itemType === "product"),
    [d.inventory],
  );
  const invForm = d.invForm;
  const formOpen = invForm.open;

  // 권종 분류 제안 — 업종 유형별 placeholder (스터디카페: 시간권·금액권이 사장님 확정 관리 단위)
  const catPlaceholder = ko
    ? kind === "membership" ? "분류 (예: 시간권 · 기간권 · 금액권)"
    : kind === "space-booking" ? "분류 (예: 평일 · 주말 · 야간)"
    : kind === "subscription-plan" ? "분류 (예: 베이식 · 프로)"
    : "분류 (선택)"
    : "Category (optional)";

  const soldLabel = ko
    ? (kind === "membership" ? "이번 달 이용" : kind === "project-service" ? "이번 달 수주" : "이번 달 판매")
    : "This month";

  const openAdd = () => {
    d.setInvForm({
      open: true, editId: null, name: "", qty: "0", unit: ko ? "개" : "ea", threshold: "",
      unitCost: "", category: "other", itemType: "product",
      sellingPrice: "", displayCategory: "", expiryDate: "", supplierName: "", url: "", leadTimeDays: "", dailyUsage: "",
    });
  };
  const closeForm = () => d.setInvForm({ ...invForm, open: false, editId: null, name: "", sellingPrice: "", displayCategory: "" });

  return (
    <div style={cardShell}>
      {/* 헤더 줄 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 750, color: MIDNIGHT, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {ko ? `${unitLabel} 목록` : `${unitLabel} list`}
        </div>
        <button
          type="button"
          onClick={formOpen ? closeForm : openAdd}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, border: "none", cursor: "pointer",
            padding: "8px 14px", borderRadius: 11, background: formOpen ? "rgba(25,25,112,0.06)" : MIDNIGHT,
            color: formOpen ? MIDNIGHT : "white", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
          }}
        >
          {formOpen ? (ko ? "닫기" : "Close") : (<><Plus size={13} strokeWidth={2.4} />{ko ? `${unitLabel} 추가` : `Add ${unitLabel}`}</>)}
        </button>
      </div>

      {/* 추가/수정 폼 — invForm 바인딩 (handleInvSave 재사용) */}
      {formOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px", borderRadius: 12, background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.08)", marginBottom: 12 }}>
          <input
            type="text"
            placeholder={ko ? `${unitLabel} 이름 (예: 4시간권)` : `${unitLabel} name`}
            value={invForm.name}
            onChange={(e) => d.setInvForm({ ...invForm, name: e.target.value })}
            style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.1)", background: "#fff", fontSize: 13, fontWeight: 600, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text" inputMode="numeric"
              placeholder={ko ? "가격 (원)" : "Price (KRW)"}
              value={invForm.sellingPrice}
              onChange={(e) => d.setInvForm({ ...invForm, sellingPrice: e.target.value.replace(/[^0-9]/g, "") })}
              style={{ flex: 1, minWidth: 120, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.1)", background: "#fff", fontSize: 13, fontWeight: 600, outline: "none" }}
            />
            <input
              type="text"
              placeholder={catPlaceholder}
              value={invForm.displayCategory}
              onChange={(e) => d.setInvForm({ ...invForm, displayCategory: e.target.value })}
              style={{ flex: 1.4, minWidth: 150, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.1)", background: "#fff", fontSize: 13, fontWeight: 600, outline: "none" }}
            />
          </div>
          <button
            type="button"
            disabled={!invForm.name.trim()}
            onClick={() => { d.handleInvSave(); }}
            style={{
              padding: "10px", borderRadius: 10, border: "none",
              background: invForm.name.trim() ? MIDNIGHT : "rgba(15,23,42,0.06)",
              color: invForm.name.trim() ? "#fff" : "rgba(15,23,42,0.3)",
              fontSize: 13, fontWeight: 700, cursor: invForm.name.trim() ? "pointer" : "not-allowed", fontFamily: "inherit",
            }}
          >
            {invForm.editId ? (ko ? "수정 저장" : "Save") : (ko ? "추가" : "Add")}
          </button>
        </div>
      )}

      {/* 목록 */}
      {items.length === 0 ? (
        <div style={{ padding: "26px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 13.5, fontWeight: 650, color: INK, marginBottom: 4 }}>
            {ko ? `아직 등록된 ${unitLabel}이 없어요` : `No ${unitLabel.toLowerCase()} yet`}
          </div>
          <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>
            {ko ? `위의 [${unitLabel} 추가]로 첫 ${unitLabel}을 등록해 보세요.` : "Add your first one above."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it) => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, border: "1px solid rgba(15,23,42,0.07)", background: "rgba(25,25,112,0.015)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{it.name}</span>
                  {it.displayCategory && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.07)", padding: "2px 8px", borderRadius: 999 }}>
                      {it.displayCategory}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                  {fmtWon(it.sellingPrice ?? 0)}
                </div>
              </div>

              {/* 판매/이용 수 — ± (사장님 결정: 권종별 몇 명인지가 관리의 핵심) */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 10.5, fontWeight: 650, color: MUTED }}>{soldLabel}</span>
                <button type="button" onClick={() => d.handleProdSoldChange(it.id, -1)} aria-label="-1"
                  style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(25,25,112,0.16)", background: "#fff", color: MIDNIGHT, fontSize: 14, fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>−</button>
                <span style={{ minWidth: 26, textAlign: "center", fontSize: 14, fontWeight: 750, color: INK, fontVariantNumeric: "tabular-nums" }}>
                  {it.monthlySold ?? 0}
                </span>
                <button type="button" onClick={() => d.handleProdSoldChange(it.id, 1)} aria-label="+1"
                  style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: MIDNIGHT, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>＋</button>
              </div>

              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button type="button" onClick={() => { const item = d.inventory.find((x) => x.id === it.id); if (item) d.openInvEdit(item); }} aria-label={ko ? "수정" : "Edit"}
                  style={{ border: "none", background: "rgba(25,25,112,0.05)", borderRadius: 8, padding: 6, cursor: "pointer" }}>
                  <Pencil size={12} strokeWidth={2} color={MIDNIGHT} />
                </button>
                <button type="button" onClick={() => { if (window.confirm(ko ? `${it.name} 을(를) 삭제할까요?` : "Delete?")) d.handleInvDelete(it.id); }} aria-label={ko ? "삭제" : "Delete"}
                  style={{ border: "none", background: "rgba(182,76,76,0.06)", borderRadius: 8, padding: 6, cursor: "pointer" }}>
                  <Trash2 size={12} strokeWidth={2} color="#b64c4c" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
