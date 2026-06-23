"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DashboardHook } from "../../useDashboard";
import { importInventoryFromFile, INVENTORY_IMPORT_ACCEPT } from "../../inventory-file-import";
import { detectOverstockItems, type OverstockAlert } from "@foundone/shared";

type InventoryEntry = {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  minThreshold?: number;
  category?: string;
  unitCost?: number;
  expiryDate?: string;
  supplierName?: string;
  supplierUrl?: string;
  leadTimeDays?: number;
  dailyUsage?: number;
  lastOrderedAt?: string;
  wasteLog?: Array<{ date: string; qty: number; reason: string }>;
};

/** 정확한 원화 표시. 반올림 없음. */
const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000);
    const remain = abs % 100000000;
    const man = Math.floor(remain / 10000);
    return man > 0 ? `${sign}${eok}억 ${man.toLocaleString()}만원` : `${sign}${eok}억원`;
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const remain = abs % 10000;
    return remain > 0 ? `${sign}${man.toLocaleString()}만 ${remain.toLocaleString()}원` : `${sign}${man.toLocaleString()}만원`;
  }
  return `${sign}${abs.toLocaleString()}원`;
};

// ── Overstock Section ────────────────────────────────────────────────────────
//
//  2026-05-11 신규 기능 (사장님 신고):
//   "한 달에 한 번 주문하는 재고인데 발주 임계를 한참 위로 유지하는 경우
//    (예: 100개씩 주문 + 임계 20개 → 한 달 후 50-60개 남음) 발주 시기 재검토 필요."
//
//   → SSOT `detectOverstockItems` 가 검출한 과주문 품목을 카드 상단에 안내.
//     dailyUsage 있으면 *남은 일수* 까지 표시 (14일+ = alert).

function OverstockSection({
  ko,
  inventory,
}: {
  ko: boolean;
  inventory: InventoryEntry[];
}) {
  const alerts = useMemo<OverstockAlert[]>(
    () => detectOverstockItems(inventory as never),
    [inventory],
  );
  const [open, setOpen] = useState(false);

  if (alerts.length === 0) return null;

  const totalExcessCost = alerts.reduce((s, a) => s + (a.excessCostKrw ?? 0), 0);
  const hasAlertSeverity = alerts.some((a) => a.severity === "alert");
  // 신호등 금지(2026-06-16): alert 강조는 앰버 대신 브릭 danger(#b64c4c) — 구분 유지하며 팔레트 준수.
  const accentColor = hasAlertSeverity ? "#b64c4c" : "#1F46A8";
  const accentBg = hasAlertSeverity ? "rgba(182,76,76,0.06)" : "rgba(25,25,112,0.05)";
  const accentBorder = hasAlertSeverity ? "rgba(182,76,76,0.18)" : "rgba(25,25,112,0.12)";

  return (
    <div style={{
      marginTop: "10px",
      padding: "12px 14px",
      borderRadius: "12px",
      background: accentBg,
      border: `1px solid ${accentBorder}`,
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left" as const,
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: hasAlertSeverity ? "rgba(182,76,76,0.14)" : "rgba(25,25,112,0.10)",
          color: accentColor,
          flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v4M6 9h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "12.5px",
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
          }}>
            {ko
              ? `발주 주기 재검토 필요 ${alerts.length}건${hasAlertSeverity ? " · 과주문 의심" : ""}`
              : `Reorder cycle review · ${alerts.length} item${alerts.length > 1 ? "s" : ""}`}
          </div>
          <div style={{
            fontSize: "11px",
            color: "var(--muted)",
            marginTop: "2px",
            lineHeight: 1.4,
          }}>
            {ko
              ? totalExcessCost > 0
                ? `한 달+ 지났는데 재고가 임계의 2배 이상 남음. 잉여 추정 ${fmt(totalExcessCost)} 자금 묶임.`
                : "한 달+ 지났는데 재고가 임계의 2배 이상 남음 — 발주량 또는 주기 조정 권장."
              : "Stock 2×+ threshold after 30+ days. Consider reducing order qty or extending cycle."}
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", color: accentColor }}
        >
          <path d="M3.5 5L7 8.5L10.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul style={{
          listStyle: "none",
          margin: "10px 0 0",
          padding: 0,
          display: "flex",
          flexDirection: "column" as const,
          gap: "6px",
        }}>
          {alerts.map((a) => {
            const itemColor = a.severity === "alert" ? "#191970" : "rgba(15,23,42,0.62)";
            const recommendKo =
              a.recommendation === "reduce-quantity" ? "발주량 줄이기 권장"
              : a.recommendation === "extend-cycle" ? "발주 주기 연장 권장"
              : "재검토 필요";
            const recommendEn =
              a.recommendation === "reduce-quantity" ? "Reduce order qty"
              : a.recommendation === "extend-cycle" ? "Extend cycle"
              : "Review";
            return (
              <li
                key={a.itemId}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(15,23,42,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>
                    {a.itemName}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: itemColor,
                    background: a.severity === "alert" ? "rgba(182,76,76,0.10)" : "rgba(15,23,42,0.05)",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    flexShrink: 0,
                    letterSpacing: "0.01em",
                  }}>
                    {ko ? recommendKo : recommendEn}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px", lineHeight: 1.4 }}>
                  {ko ? a.reasonKo : a.reasonEn}
                </div>
                {a.excessCostKrw != null && a.excessCostKrw > 0 && (
                  <div style={{ fontSize: "10.5px", color: itemColor, marginTop: "3px", fontWeight: 600 }}>
                    {ko ? `잉여 자금 ${fmt(a.excessCostKrw)} (${a.excessUnits}${a.unit ?? "개"})` : `Tied-up ${fmt(a.excessCostKrw)}`}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Style constants ──────────────────────────────────────────────────────────

const opsCard: React.CSSProperties = {
  borderRadius: "14px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,244,255,0.45) 100%)",
  border: "1px solid rgba(25,25,112, 0.06)",
  boxShadow: "0 21px 94px rgba(0, 0, 0, 0.03)",
  display: "grid",
  gap: "14px",
};

const opsHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const sectionEyebrow: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: "6px",
};

const opsTitle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  color: "#0f172a",
};

const opsActionRow: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const opsActionPrimary: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "9px 12px",
  background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
};

const opsActionSecondary: React.CSSProperties = {
  border: "1px solid rgba(25,25,112, 0.12)",
  borderRadius: "8px",
  padding: "9px 12px",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const opsMetricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const opsMetricCard: React.CSSProperties = {
  borderRadius: "10px",
  padding: "14px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.55) 0%, rgba(248,250,255,0.35) 100%)",
  border: "1px solid rgba(25,25,112,0.04)",
};

const opsMetricLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--muted)",
  marginBottom: "8px",
};

const opsMetricValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 720,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const rowActions: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "flex-end",
};

const tinyAction: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

const tinyDangerAction: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#b64c4c",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

const listStack: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const listRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.5) 0%, rgba(248,250,255,0.3) 100%)",
  border: "1px solid rgba(25,25,112,0.04)",
};

const listTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 650,
  color: "#0f172a",
};

const listMeta: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "11px",
  color: "var(--muted)",
};

const emptyState: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "linear-gradient(180deg, rgba(240,244,255,0.4) 0%, rgba(248,250,255,0.25) 100%)",
  border: "1px solid rgba(25,25,112,0.04)",
  fontSize: "13px",
  lineHeight: 1.55,
  color: "rgba(15, 23, 42, 0.58)",
};

const inlineEditor: React.CSSProperties = {
  borderTop: "1px solid rgba(15, 23, 42, 0.08)",
  paddingTop: "14px",
  display: "grid",
  gap: "10px",
};

const inlineEditorTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#191970",
  letterSpacing: "0.02em",
};

const formGridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const formGridThree: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
};

const editorActions: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

// ── Component ────────────────────────────────────────────────────────────────

export function InventoryOpsCard({
  ko,
  inventory,
  lowStockItems,
  d,
}: {
  ko: boolean;
  inventory: InventoryEntry[];
  lowStockItems: InventoryEntry[];
  d: DashboardHook;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const invForm = d.invForm;
  const isEditing = Boolean(invForm.editId);
  const [showAllInventory, setShowAllInventory] = useState(false);
  const [inventorySnapshot, setInventorySnapshot] = useState<InventoryEntry[]>([]);

  // VendorSetupStage(공급처·장비 단계)에서 사장님이 선택한 공급처를
  //  재고 추가 폼의 supplierName 입력 시 datalist 로 자동 제안.
  //  ── 키 스키마: `vendor-setup_s1_c{cursor}` (s1 = 공급처)
  //     · 값(string)이 공급처 이름이므로 별도 ID-label 매핑 불필요.
  //  ── 데이터 흐름: VendorSetupStage → roadmap-store.vendorSelections → 여기.
  const supplierSuggestions = (() => {
    const sel = (d.vendorSelections ?? {}) as Record<string, string>;
    const names = Object.entries(sel)
      .filter(([k]) => k.startsWith("vendor-setup_s1_"))
      .map(([, v]) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);
    return Array.from(new Set(names));
  })();

  // 팝업 열릴 때 body 스크롤 잠금 + ESC 키 닫기
  useEffect(() => {
    if (showAllInventory) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setShowAllInventory(false); };
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [showAllInventory]);

  const categoryLabels: Record<NonNullable<typeof invForm.category>, string> = {
    fresh: ko ? "신선" : "Fresh",
    dry: ko ? "건식" : "Dry",
    frozen: ko ? "냉동" : "Frozen",
    beverage: ko ? "음료" : "Beverage",
    supply: ko ? "소모품" : "Supply",
    other: ko ? "기타" : "Other",
  };

  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(15,23,42,0.10)",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  };

  const [excelImportState, setExcelImportState] = useState<{ status: "idle" | "reading" | "parsing" | "saving" | "done" | "error"; total: number; current: number; message: string }>({ status: "idle", total: 0, current: 0, message: "" });

  const handleExcelImport = async (file: File) => {
    try {
      setExcelImportState({ status: "parsing", total: 0, current: 0, message: ko ? "AI가 데이터 분석 중..." : "AI parsing data..." });

      // CSV/TSV/TXT 는 텍스트로, XLSX/XLS 는 base64 로 보내 서버(exceljs)가 변환 — 공용 헬퍼.
      const parsed = await importInventoryFromFile(file, d.language);
      if (!parsed?.length) {
        setExcelImportState({ status: "error", total: 0, current: 0, message: ko ? "데이터를 찾을 수 없습니다." : "No data found." });
        setTimeout(() => setExcelImportState({ status: "idle", total: 0, current: 0, message: "" }), 3000);
        return;
      }

      const total = parsed.length;
      setExcelImportState({ status: "saving", total, current: 0, message: ko ? `${total}개 품목 등록 중...` : `Adding ${total} items...` });

      const newItems = parsed.map((product, idx) => ({
        id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${idx}`,
        name: product.name,
        quantity: product.stock,
        unit: product.unit || "개",
        minThreshold: 0,
        unitCost: product.cost,
        category: "other" as const,
        itemType: "product" as const,
        sellingPrice: product.price ?? 0,
        expiryDate: "",
        supplierName: "",
        supplierUrl: "",
        leadTimeDays: 1,
        dailyUsage: 0,
        lastOrderedAt: "",
        wasteLog: [],
      }));

      // 하나씩 등록하는 시각적 효과
      const existingItems = d.inventory as typeof newItems;
      for (let i = 0; i < newItems.length; i++) {
        setExcelImportState({ status: "saving", total, current: i + 1, message: ko ? `${newItems[i].name} 등록 중... (${i + 1}/${total})` : `Adding ${newItems[i].name}... (${i + 1}/${total})` });
        await new Promise(resolve => setTimeout(resolve, 120));
      }
      d.saveInventory([...existingItems, ...newItems]);
      setExcelImportState({ status: "done", total, current: total, message: ko ? `${total}개 품목 등록 완료!` : `${total} items added!` });
      setTimeout(() => setExcelImportState({ status: "idle", total: 0, current: 0, message: "" }), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Excel import error]", msg);
      setExcelImportState({ status: "error", total: 0, current: 0, message: ko ? `파일 처리 오류: ${msg}` : `File error: ${msg}` });
      setTimeout(() => setExcelImportState({ status: "idle", total: 0, current: 0, message: "" }), 5000);
    }
  };

  return (
    <section
      style={opsCard}
      className="bento-card"
      data-inventory-card
      id="inventory-card"
    >
      <div style={opsHeader}>
        <div>
          <div style={sectionEyebrow}>
            {ko ? (d.businessCtx.inventoryLabel?.ko ?? "현재 재고") : (d.businessCtx.inventoryLabel?.en ?? "Inventory")}
          </div>
          <div style={opsTitle}>
            {d.businessCtx.inventoryMode === "unified"
              ? (ko ? "제품·재고 통합 관리" : "Product & inventory")
              : d.businessCtx.categoryId === "startup-tech"
                ? (ko ? "자산·도구 관리" : "Assets and tools")
                : (ko ? "재고 관리" : "Inventory management")}
          </div>
        </div>
        <div style={opsActionRow}>
          <button
            type="button"
            onClick={() => d.setInvForm({ ...d.emptyInvForm, open: true })}
            style={opsActionPrimary}
          >
            {ko ? (d.businessCtx.inventoryLabel?.ko === "내 제품" ? "제품 추가" : d.businessCtx.inventoryLabel?.ko === "소모품 관리" ? "소모품 추가" : d.businessCtx.inventoryLabel?.ko === "운영 자산" ? "자산 추가" : "재고 추가") : "Add item"}
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={opsActionSecondary}>
            CSV·Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={INVENTORY_IMPORT_ACCEPT}
            style={{ display: "none" }}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              event.target.value = "";
              await handleExcelImport(file);
            }}
          />
        </div>
      </div>

      {/* 엑셀 임포트 진행률 */}
      {excelImportState.status !== "idle" && (
        <div style={{
          padding: "12px 16px", borderRadius: "12px", marginBottom: "8px",
          background: excelImportState.status === "error" ? "rgba(182,76,76,0.04)" : excelImportState.status === "done" ? "rgba(25,25,112,0.04)" : "rgba(25,25,112,0.04)",
          border: `1px solid ${excelImportState.status === "error" ? "rgba(182,76,76,0.1)" : excelImportState.status === "done" ? "rgba(25,25,112,0.1)" : "rgba(25,25,112,0.1)"}`,
        }} className="bento-fade-in">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: excelImportState.total > 0 ? "8px" : "0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {excelImportState.status === "error" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b64c4c" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
              ) : excelImportState.status === "done" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d3557" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              ) : (
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(25,25,112,0.3)", borderTopColor: "#191970", animation: "spin 0.8s linear infinite" }} />
              )}
              <span style={{
                fontSize: "13px", fontWeight: 600,
                color: excelImportState.status === "error" ? "#b64c4c" : excelImportState.status === "done" ? "#1d3557" : "#191970",
              }}>
                {excelImportState.message}
              </span>
            </div>
            {excelImportState.total > 0 && excelImportState.status === "saving" && (
              <span style={{ fontSize: "12px", fontWeight: 650, color: "#191970", fontVariantNumeric: "tabular-nums" as const }}>
                {excelImportState.current}/{excelImportState.total}
              </span>
            )}
          </div>
          {excelImportState.total > 0 && (
            <div style={{ height: "4px", borderRadius: "2px", background: "rgba(25,25,112,0.08)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                width: `${(excelImportState.current / excelImportState.total) * 100}%`,
                background: excelImportState.status === "done" ? "#1d3557" : "#191970",
                transition: "width 0.15s ease",
              }} />
            </div>
          )}
        </div>
      )}

      <div style={opsMetricGrid}>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "발주 필요" : "Reorder"}</div>
          <div style={{ ...opsMetricValue, color: lowStockItems.length > 0 ? "#b64c4c" : "#1d3557" }}>
            {lowStockItems.length}{ko ? "개" : ""}
          </div>
        </div>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "정상 품목" : "Normal"}</div>
          <div style={opsMetricValue}>{Math.max(inventory.length - lowStockItems.length, 0)}{ko ? "개" : ""}</div>
        </div>
      </div>

      <OverstockSection ko={ko} inventory={inventory} />

      <div style={listStack}>
        {/* 발주 필요(critical → warning) 품목을 상단으로 정렬 후 top 4 노출. 2026-05-11 */}
        {[...inventory]
          .map((item) => {
            const threshold = item.minThreshold ?? 0;
            const isLow = lowStockItems.some((c) => c.id === item.id);
            // urgency: 0 = critical (quantity ≤ 0), 1 = warning (low stock), 2 = normal
            const urgencyRank = threshold > 0 && item.quantity <= 0 ? 0 : isLow ? 1 : 2;
            return { item, urgencyRank };
          })
          .sort((a, b) => a.urgencyRank - b.urgencyRank)
          .slice(0, 4)
          .map(({ item }) => {
          const isLow = lowStockItems.some((c) => c.id === item.id);
          const threshold = item.minThreshold ?? 0;
          const urgency = threshold > 0 && item.quantity <= 0 ? "critical" : isLow ? "warning" : "ok";
          const urgencyColor = urgency === "critical" ? "#b64c4c" : urgency === "warning" ? "#191970" : "#1d3557";
          return (
          <div key={item.id} style={{ ...listRow, borderLeft: `3px solid ${urgencyColor}` }}>
            <div>
              <div style={listTitle}>{item.name}</div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: (item as { itemType?: string }).itemType === "product" ? "#191970" : "rgba(15,23,42,0.4)", background: (item as { itemType?: string }).itemType === "product" ? "rgba(25,25,112,0.08)" : "rgba(25,25,112,0.04)", borderRadius: "4px", padding: "1px 5px" }}>
                  {(item as { itemType?: string }).itemType === "product" ? (ko ? "상품" : "Product") : (ko ? "재료" : "Material")}
                </span>
                <div style={listMeta}>{item.category || (ko ? "일반" : "General")}</div>
                {urgency !== "ok" && (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: urgencyColor, background: `${urgencyColor}10`, borderRadius: "4px", padding: "1px 5px" }}>
                    {urgency === "critical" ? (ko ? "즉시 발주" : "Order now") : (ko ? "발주 필요" : "Low")}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={listTitle}>
                {item.quantity}{item.unit ? ` ${item.unit}` : ""}
              </div>
              {threshold > 0 && (
                <div style={{ height: "3px", borderRadius: "2px", background: `${urgencyColor}18`, width: "48px", overflow: "hidden", marginTop: "4px", marginLeft: "auto" }}>
                  <div style={{ height: "100%", borderRadius: "2px", background: urgencyColor, width: `${Math.min(100, (item.quantity / threshold) * 100)}%`, transition: "width 0.3s ease" }} />
                </div>
              )}
            </div>
            <div style={rowActions}>
              <button type="button" onClick={() => d.openInvEdit(item as never)} style={tinyAction}>
                {ko ? "수정" : "Edit"}
              </button>
              <button type="button" onClick={() => d.handleInvDelete(item.id)} style={tinyDangerAction}>
                {ko ? "삭제" : "Delete"}
              </button>
            </div>
          </div>
          );
        })}
        {inventory.length === 0 ? (
          <div style={emptyState}>
            {d.businessCtx.categoryId === "startup-tech"
              ? ko
                ? "장비, 계정, 테스트 디바이스, 반복 결제 도구 같은 운영 자산을 등록해두면 팀이 한곳에서 관리할 수 있습니다."
                : "Track equipment, accounts, test devices, and recurring tools here."
              : ko
                ? "운영 재고를 등록하면 부족 품목을 바로 확인할 수 있습니다."
                : "Add inventory items to track low stock here."}
          </div>
        ) : null}
        {inventory.length > 4 && (
          <button type="button" onClick={() => { setInventorySnapshot([...inventory]); setShowAllInventory(true); }} style={{
            width: "100%", padding: "10px", marginTop: "6px", borderRadius: "10px",
            border: "none", background: "rgba(25,25,112,0.035)", cursor: "pointer",
            fontSize: "13px", fontWeight: 600, color: "var(--muted)",
          }}>
            {ko ? `전체 ${inventory.length}개 보기` : `View all ${inventory.length} items`}
          </button>
        )}
      </div>

      {/* 전체 재고 팝업 — Portal로 body에 직접 렌더링하여 부모 리렌더링 격리 */}
      {showAllInventory && typeof document !== "undefined" && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAllInventory(false); }}
        >
          <div style={{ width: "min(600px, 90vw)", maxHeight: "80vh", borderRadius: "24px", background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" as const }}>
            {/* header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  {ko ? "전체 재고" : "All Inventory"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                  {inventorySnapshot.length}{ko ? "개 품목" : " items"}
                </div>
              </div>
              <button type="button" onClick={() => setShowAllInventory(false)} style={{
                width: "32px", height: "32px", borderRadius: "999px", border: "none",
                background: "rgba(25,25,112,0.05)", cursor: "pointer", fontSize: "16px", color: "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
            {/* list — 발주 필요(critical → warning) 품목 상단 정렬 */}
            <div style={{ overflowY: "auto", padding: "12px 24px 24px", display: "flex", flexDirection: "column" as const, gap: "6px" }}>
              {[...inventorySnapshot]
                .sort((a, b) => {
                  const rank = (it: InventoryEntry) => {
                    const th = it.minThreshold ?? 0;
                    if (th > 0 && it.quantity <= 0) return 0;       // critical
                    if (th > 0 && it.quantity <= th) return 1;      // warning (low)
                    return 2;                                        // normal
                  };
                  return rank(a) - rank(b);
                })
                .map((item) => {
                const isLow = (item.minThreshold ?? 0) > 0 && item.quantity <= (item.minThreshold ?? 0);
                const urgency = (item.minThreshold ?? 0) > 0 && item.quantity <= 0 ? "critical" : isLow ? "warning" : "ok";
                const urgencyColor = urgency === "critical" ? "#b64c4c" : urgency === "warning" ? "#191970" : "#1d3557";
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 12px", borderRadius: "12px",
                    background: urgency !== "ok" ? `${urgencyColor}06` : "rgba(25,25,112,0.025)",
                    borderLeft: `3px solid ${urgencyColor}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{item.name}</div>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "2px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: (item as { itemType?: string }).itemType === "product" ? "#191970" : "rgba(15,23,42,0.4)", background: (item as { itemType?: string }).itemType === "product" ? "rgba(25,25,112,0.08)" : "rgba(25,25,112,0.04)", borderRadius: "4px", padding: "1px 5px" }}>
                          {(item as { itemType?: string }).itemType === "product" ? (ko ? "상품" : "Product") : (ko ? "재료" : "Material")}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>{item.category || (ko ? "일반" : "General")}</span>
                        {urgency !== "ok" && (
                          <span style={{ fontSize: "10px", fontWeight: 700, color: urgencyColor, background: `${urgencyColor}10`, borderRadius: "4px", padding: "1px 5px" }}>
                            {urgency === "critical" ? (ko ? "즉시 발주" : "Order now") : (ko ? "발주 필요" : "Low")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>
                        {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </div>
                      {(item as { sellingPrice?: number }).sellingPrice ? (
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{fmt((item as { sellingPrice?: number }).sellingPrice ?? 0)}</div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button type="button" onClick={() => { d.openInvEdit(item as never); setShowAllInventory(false); }} style={tinyAction}>
                        {ko ? "수정" : "Edit"}
                      </button>
                      <button type="button" onClick={() => { d.handleInvDelete(item.id); setInventorySnapshot(prev => prev.filter(i => i.id !== item.id)); }} style={tinyDangerAction}>
                        {ko ? "삭제" : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {invForm.open ? (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>
            {isEditing ? (ko ? "재고 수정" : "Edit inventory") : (ko ? "재고 추가" : "Add inventory")}
          </div>
          {/* 유형 선택: 원재료 / 판매 상품 */}
          <div style={{ display: "flex", gap: "4px", padding: "3px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", marginBottom: "10px" }}>
            {([
              { value: "material" as const, label: ko ? "원재료" : "Material" },
              { value: "product" as const, label: ko ? "판매 상품" : "Product" },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => d.setInvForm((prev) => ({ ...prev, itemType: opt.value }))}
                style={{
                  flex: 1, fontSize: "12px", fontWeight: 600, padding: "8px 0",
                  borderRadius: "8px", border: "none", cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: invForm.itemType === opt.value ? "#fff" : "transparent",
                  color: invForm.itemType === opt.value ? "#0f172a" : "rgba(15,23,42,0.45)",
                  boxShadow: invForm.itemType === opt.value ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={formGridTwo}>
            <input
              type="text"
              value={invForm.name}
              onChange={(event) => d.setInvForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={ko ? "품목명" : "Item name"}
              style={inputStyle}
            />
            <select
              value={invForm.category}
              onChange={(event) =>
                d.setInvForm((prev) => ({
                  ...prev,
                  category: event.target.value as typeof invForm.category,
                }))
              }
              style={inputStyle}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {/* 판매 상품일 때 판매가 입력 */}
          {invForm.itemType === "product" && (
            <div style={{ marginBottom: "2px" }}>
              <input
                type="text"
                inputMode="numeric"
                value={invForm.sellingPrice}
                onChange={(event) => d.setInvForm((prev) => ({ ...prev, sellingPrice: event.target.value.replace(/[^0-9]/g, "") }))}
                placeholder={ko ? "판매가 (원)" : "Selling price (₩)"}
                style={inputStyle}
              />
            </div>
          )}
          {invForm.itemType === "product" ? (
            /* ── 판매 상품 폼: 판매가 + 수량 + (선택)원가 ── */
            <>
              <div style={formGridThree}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.qty}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, qty: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "재고 수량" : "Stock qty"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={invForm.unit}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unit: event.target.value }))}
                  placeholder={ko ? "단위 (개, 병)" : "Unit"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.unitCost}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unitCost: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "원가 (선택)" : "Cost (opt)"}
                  style={inputStyle}
                />
              </div>
              {invForm.sellingPrice && Number(invForm.sellingPrice) > 0 && invForm.unitCost && Number(invForm.unitCost) > 0 && (
                <div style={{ fontSize: "12px", color: "#191970", fontWeight: 600, padding: "4px 0" }}>
                  {ko ? "마진율" : "Margin"}: {Math.round(((Number(invForm.sellingPrice) - Number(invForm.unitCost)) / Number(invForm.sellingPrice)) * 100)}%
                </div>
              )}
            </>
          ) : (
            /* ── 원재료 폼: 단가 + 수량 + 최소수량 + 일사용량 + 리드타임 + 공급처 ── */
            <>
              <div style={formGridThree}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.qty}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, qty: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "수량" : "Qty"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={invForm.unit}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unit: event.target.value }))}
                  placeholder={ko ? "단위" : "Unit"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.threshold}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, threshold: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "최소 수량" : "Min"}
                  style={inputStyle}
                />
              </div>
              <div style={formGridThree}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.unitCost}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unitCost: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "단가 (매입가)" : "Unit cost"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.dailyUsage}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, dailyUsage: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "일 사용량" : "Daily usage"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.leadTimeDays}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, leadTimeDays: event.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder={ko ? "리드타임" : "Lead days"}
                  style={inputStyle}
                />
              </div>
            </>
          )}
          {invForm.itemType === "material" && (
          <div style={formGridTwo}>
            <input
              type="text"
              value={invForm.supplierName}
              onChange={(event) => d.setInvForm((prev) => ({ ...prev, supplierName: event.target.value }))}
              placeholder={
                supplierSuggestions.length > 0
                  ? (ko ? `공급업체명 (선택한 ${supplierSuggestions.length}곳 자동 제안)` : `Supplier (${supplierSuggestions.length} suggested)`)
                  : (ko ? "공급업체명" : "Supplier")
              }
              list={supplierSuggestions.length > 0 ? "foundone-supplier-suggestions" : undefined}
              style={inputStyle}
              autoComplete="off"
            />
            {supplierSuggestions.length > 0 && (
              <datalist id="foundone-supplier-suggestions">
                {supplierSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            )}
            <input
              type="text"
              value={invForm.url}
              onChange={(event) => d.setInvForm((prev) => ({ ...prev, url: event.target.value }))}
              placeholder={ko ? "주문 URL" : "Order URL"}
              style={inputStyle}
            />
          </div>
          )}
          <div style={editorActions}>
            <button type="button" onClick={d.handleInvSave} style={opsActionPrimary}>
              {isEditing ? (ko ? "수정 저장" : "Save") : (ko ? "추가 저장" : "Add")}
            </button>
            <button
              type="button"
              onClick={() => d.setInvForm((prev) => ({ ...prev, ...d.emptyInvForm }))}
              style={opsActionSecondary}
            >
              {ko ? "취소" : "Cancel"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
