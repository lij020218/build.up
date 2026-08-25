"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DashboardHook } from "../../useDashboard";
import { importInventoryFromFile, INVENTORY_IMPORT_ACCEPT } from "../../inventory-file-import";
import { detectOverstockItems, isBulkUnit, isCountTracked, orderRhythm, bulkUnitCostDisplay, packSizeLabel, resolveStarterPack, type OverstockAlert } from "@foundone/shared";
import { getKstDate } from "../../utils/business-day";
import type { InventoryItem } from "../../stores/operations-store";
import { menuCostPerServing, makeableServings, takeoutExtraCost } from "../../recipe-cost";
import { RecipeEditorModal } from "../surfaces/analytics/RecipeEditorModal";
import { MenuProfitabilityModal } from "./MenuProfitabilityModal";

type InventoryEntry = {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  minThreshold?: number;
  category?: string;
  displayCategory?: string;
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
  detailHref,
  section = "all",
}: {
  ko: boolean;
  inventory: InventoryEntry[];
  lowStockItems: InventoryEntry[];
  d: DashboardHook;
  /** "자세히 →" 진입 링크 (대시보드에서 /offerings 로) — 오퍼링 페이지 자체에선 생략 */
  detailHref?: string;
  /**
   * 렌더 범위 (2026-07-27 사장님 지시 — 오퍼링 페이지는 메뉴/재고 카드 분리):
   *  "all"  = 통합 카드 (대시보드 기본 — 메뉴+재고 한 카드)
   *  "menu" = 메뉴·서비스 섹션만 (원가율·판매±·레시피)
   *  "stock"= 재고 섹션만 (수량·발주·과주문·CSV)
   */
  section?: "all" | "menu" | "stock";
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const invForm = d.invForm;
  const isEditing = Boolean(invForm.editId);
  // ── 스타터팩 (2026-08-25) — 재료 0개 콜드스타트에서만 체크리스트 노출 (inventory-starter-packs SSOT)
  //    기본 전체 선택(카페는 안 쓰는 게 더 적음) → 해제한 이름만 추적.
  const starterPack = resolveStarterPack(d.businessCtx.categoryId);
  const [starterDeselected, setStarterDeselected] = useState<Set<string>>(new Set());
  const [showAllInventory, setShowAllInventory] = useState(false);
  const [inventorySnapshot, setInventorySnapshot] = useState<InventoryEntry[]>([]);
  // 전체 재고 팝업 정렬 — 긴급도(기본)/가나다/분류. 카드 상위4는 항상 긴급도.
  const [invSortMode, setInvSortMode] = useState<"urgency" | "name" | "category">("urgency");
  const sortInventory = (arr: InventoryEntry[]): InventoryEntry[] => {
    const urgencyRank = (it: InventoryEntry) => {
      if (!isCountTracked(it)) return 2;          // 벌크 재료는 잔량 긴급도 없음 (추적모드 분리)
      const th = it.minThreshold ?? 0;
      if (th > 0 && it.quantity <= 0) return 0;   // critical
      if (th > 0 && it.quantity <= th) return 1;  // warning
      return 2;                                    // normal
    };
    const byName = (a: InventoryEntry, b: InventoryEntry) => (a.name ?? "").localeCompare(b.name ?? "", "ko");
    const copy = [...arr];
    if (invSortMode === "name") return copy.sort(byName);
    if (invSortMode === "category") return copy.sort((a, b) => ((a.displayCategory || a.category) ?? "").localeCompare((b.displayCategory || b.category) ?? "", "ko") || byName(a, b));
    return copy.sort((a, b) => urgencyRank(a) - urgencyRank(b) || byName(a, b));
  };

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

  // 상품(itemType=product) 분류 추천 — 식자재 enum 대신 업종에 맞는 자유분류(무손실). (2026-07-22 통합)
  const mode = d.businessCtx.inventoryMode;
  const productCatSuggestions: string[] = d.businessCtx.isOnlineStore
    ? (ko ? ["의류", "잡화", "디지털", "홈리빙", "기타"] : ["Apparel", "Accessories", "Digital", "Home", "Other"])
    : mode === "separate"
      ? (ko ? ["메인", "사이드", "음료", "디저트", "세트"] : ["Main", "Side", "Drink", "Dessert", "Set"])
      : mode === "service"
        ? (ko ? ["시술", "케어", "추가", "상품"] : ["Service", "Care", "Add-on", "Product"])
        : (ko ? ["상품", "소모품", "악세서리", "기타"] : ["Product", "Supplies", "Accessories", "Other"]);

  // ── 메뉴·서비스 섹션 (2026-07-22 통합, 사장님 지시) ─────────────────────
  //  음식·카페(separate)·서비스(service)의 메뉴는 예전엔 이 카드에서 추가만 되고 목록에선
  //  걸러져(메뉴 수익성 카드로) 관리 진입점이 없었다 → 이 카드에 메뉴 섹션을 직접 통합.
  //  메뉴 행 = 판매가·원가율(레시피 자동) + 판매 −/＋(재고 자동차감) + [재료](레시피 편집).
  const isMenuMode = mode === "separate" || mode === "service";
  // 분리 렌더 게이트 — menu 카드엔 재고 UI, stock 카드엔 메뉴 UI 가 나오지 않게.
  const showMenuSection = isMenuMode && section !== "stock";
  const showStockSection = section !== "menu";
  const fullInventory = d.inventory as InventoryItem[];
  const menus = isMenuMode ? fullInventory.filter((i) => i.itemType === "product") : [];
  const recipeMaterials = fullInventory.filter((i) => i.itemType === "material");
  const goldenMax = mode === "service" ? 25 : 33; // 황금률 원가율 (수익성 카드에서 흡수)
  const [recipeMenuId, setRecipeMenuId] = useState<string | null>(null);
  const recipeMenu = recipeMenuId ? fullInventory.find((i) => i.id === recipeMenuId) ?? null : null;
  const [showProfitDetail, setShowProfitDetail] = useState(false); // 수익성 상세 팝업 (2026-07-22 사장님 지시)
  const menuCost = (m: InventoryItem) => menuCostPerServing(m, recipeMaterials);
  const menuRatio = (m: InventoryItem) => (m.sellingPrice > 0 ? (menuCost(m) / m.sellingPrice) * 100 : 0);
  const overMenus = menus.filter((m) => m.sellingPrice > 0 && menuRatio(m) > goldenMax);
  const menuNoun = mode === "service" ? (ko ? "서비스 메뉴" : "Services") : (ko ? "메뉴" : "Menu");

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
        // 재고 CSV/엑셀 가져오기 = 재고(stock) → material. 메뉴(product)는 로드맵 menu-design 에서만.
        //   product 로 넣으면 음식·카페·서비스 업종에서 메뉴 카드로 걸러져 재고 카드에 안 보임(iOS 와 통일).
        itemType: "material" as const,
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
            {section === "menu"
              ? (mode === "service" ? (ko ? "시술·서비스" : "Services") : (ko ? "메뉴" : "Menu"))
              : section === "stock"
                ? (mode === "service" ? (ko ? "소모품" : "Supplies") : (ko ? "재료" : "Ingredients"))
                : isMenuMode
                  ? (mode === "separate" ? (ko ? "메뉴 · 식재료" : "Menu · Ingredients") : (ko ? "서비스 · 소모품" : "Services · Supplies"))
                  : ko ? (d.businessCtx.inventoryLabel?.ko ?? "현재 재고") : (d.businessCtx.inventoryLabel?.en ?? "Inventory")}
          </div>
          <div style={opsTitle}>
            {section === "menu"
              ? (mode === "service" ? (ko ? "시술·서비스 관리" : "Services") : (ko ? "메뉴 관리" : "Menu"))
              : section === "stock"
                ? (mode === "service" ? (ko ? "소모품 재고" : "Supplies stock") : (ko ? "재료 재고" : "Ingredient stock"))
                : d.businessCtx.inventoryMode === "unified"
                  ? (ko ? "제품·재고 통합 관리" : "Product & inventory")
                  : mode === "separate"
                    ? (ko ? "메뉴·재료 관리" : "Menu & ingredients")
                    : mode === "service"
                      ? (ko ? "서비스·소모품 관리" : "Services & supplies")
                      : d.businessCtx.categoryId === "startup-tech"
                        ? (ko ? "자산·도구 관리" : "Assets and tools")
                        : (ko ? "재고 관리" : "Inventory management")}
          </div>
        </div>
        <div style={opsActionRow}>
          <button
            type="button"
            onClick={() => d.setInvForm({
              ...d.emptyInvForm,
              open: true,
              // 분리 카드는 유형 고정 — 메뉴 카드=product, 재고 카드=material (2026-07-27)
              itemType: section === "menu" ? "product" : d.emptyInvForm.itemType,
            })}
            style={opsActionPrimary}
          >
            {ko
              ? (section === "menu" ? (mode === "service" ? "서비스 추가" : "메뉴 추가")
                : section === "stock" ? (mode === "service" ? "소모품 추가" : "재료 추가")
                : mode === "separate" ? "메뉴·재료 추가"
                : mode === "service" ? "서비스·소모품 추가"
                : d.businessCtx.inventoryLabel?.ko === "내 제품" ? "제품 추가"
                : d.businessCtx.inventoryLabel?.ko === "운영 자산" ? "자산 추가" : "재고 추가")
              : "Add item"}
          </button>
          {section !== "menu" && (
            <button type="button" onClick={() => fileInputRef.current?.click()} style={opsActionSecondary}>
              CSV·Excel
            </button>
          )}
          {/* 자세히 — 오퍼링 페이지(/offerings) 진입 (2026-07-25 사장님 지시:
              대시보드 카드 기능은 그대로, 더 깊은 관리는 전용 페이지에서) */}
          {detailHref && (
            <a href={detailHref} style={{ ...opsActionSecondary, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              {ko ? "자세히 →" : "Details →"}
            </a>
          )}
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

      {/* ── 메뉴·서비스 섹션 (2026-07-22 통합) — 원가율·판매(재고 자동차감)·레시피 ── */}
      {showMenuSection && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#191970", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {menuNoun}{menus.length > 0 ? ` · ${menus.length}` : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {overMenus.length > 0 && (
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#b64c4c", background: "rgba(182,76,76,0.07)", borderRadius: "10px", padding: "3px 9px" }}>
                  {ko ? `원가율 ${goldenMax}% 초과 ${overMenus.length}개` : `${overMenus.length} over ${goldenMax}%`}
                </span>
              )}
              {/* 수익성 상세 팝업 (메뉴별 원가율·마진·경보·효자) — 2026-07-22 사장님 지시 */}
              {menus.length > 0 && (
                <button type="button" onClick={() => setShowProfitDetail(true)}
                  style={{ fontSize: "11px", fontWeight: 650, color: "#191970", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {ko ? "자세히 보기 →" : "Detail →"}
                </button>
              )}
            </div>
          </div>
          {menus.length === 0 ? (
            <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.03)", fontSize: "12.5px", color: "rgba(15,23,42,0.55)", lineHeight: 1.55 }}>
              {ko
                ? `[${mode === "separate" ? "메뉴·재료 추가" : "서비스·소모품 추가"}] → ‘${mode === "separate" ? "메뉴" : "서비스 메뉴"}’ 유형으로 등록하면 원가율·판매 기록·재고 자동차감이 여기서 됩니다.`
                : "Add items with type ‘Product’ to manage price, cost ratio and sales here."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
              {menus.map((m) => {
                const cost = menuCost(m);
                const ratio = menuRatio(m);
                const rc = m.recipe?.length ?? 0;
                // 홀/포장 분리 (2026-08-25) — 포장 추가 재료 지정 시 카운터 분할 + 포장 원가율 병기
                const extra = takeoutExtraCost(m, recipeMaterials);
                const hasTakeout = (m.takeoutRecipe?.length ?? 0) > 0;
                const takeoutRatio = m.sellingPrice > 0 ? ((cost + extra) / m.sellingPrice) * 100 : 0;
                const over = m.sellingPrice > 0 && (hasTakeout ? Math.max(ratio, takeoutRatio) : ratio) > goldenMax;
                return (
                  <div key={m.id} style={{ padding: "10px 12px", borderRadius: "12px", border: `1px solid ${over ? "rgba(182,76,76,0.18)" : "rgba(25,25,112,0.08)"}`, background: over ? "rgba(182,76,76,0.03)" : "rgba(25,25,112,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "7px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 650, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                          {m.displayCategory && (
                            <span style={{ fontSize: "9.5px", fontWeight: 600, padding: "1px 6px", borderRadius: "8px", background: "rgba(25,25,112,0.06)", color: "rgba(15,23,42,0.55)", flexShrink: 0 }}>{m.displayCategory}</span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", marginTop: "2px" }}>
                          {ko
                            ? `${m.sellingPrice.toLocaleString()}원 · 원가 ${cost > 0 ? `${Math.round(cost).toLocaleString()}원` : "미입력"}${rc > 0 ? ` (재료 ${rc}종 자동)` : ""}${hasTakeout && extra > 0 ? ` · 포장 +${Math.round(extra).toLocaleString()}원` : ""}`
                            : `₩${m.sellingPrice.toLocaleString()} · cost ${cost > 0 ? `₩${Math.round(cost).toLocaleString()}` : "N/A"}${hasTakeout && extra > 0 ? ` · takeout +₩${Math.round(extra).toLocaleString()}` : ""}`}
                        </div>
                      </div>
                      {m.sellingPrice > 0 && (
                        /* 포장 지정 메뉴는 홀/포장 원가율 병기 — 포장 쪽이 진짜 마진을 보여줌 (2026-08-25) */
                        <span style={{ fontSize: hasTakeout ? "11.5px" : "13px", fontWeight: 750, color: over ? "#b64c4c" : "#191970", flexShrink: 0, textAlign: "right" as const }}>
                          {hasTakeout ? (ko ? `홀 ${ratio.toFixed(0)}% · 포장 ${takeoutRatio.toFixed(0)}%` : `${ratio.toFixed(0)}% · TO ${takeoutRatio.toFixed(0)}%`) : `${ratio.toFixed(0)}%`}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
                      {/* 판매 −/＋ — 레시피만큼 재고 자동 차감·복구 (handleProdSoldChange).
                          포장 추가 재료 지정 메뉴는 홀/포장 카운터 분할 — 포장만 부자재 차감 (2026-08-25) */}
                      {(hasTakeout
                        ? [
                            { label: ko ? "홀" : "In", takeout: false, count: Math.max(0, (m.monthlySold ?? 0) - ((m as { monthlySoldTakeout?: number }).monthlySoldTakeout ?? 0)) },
                            { label: ko ? "포장" : "TO", takeout: true, count: (m as { monthlySoldTakeout?: number }).monthlySoldTakeout ?? 0 },
                          ]
                        : [{ label: ko ? "판매" : "sold", takeout: false, count: m.monthlySold ?? 0 }]
                      ).map((counter) => (
                        <div key={counter.label} style={{ display: "flex", alignItems: "center" }}>
                          <button type="button" onClick={() => d.handleProdSoldChange(m.id, -1, counter.takeout)}
                            aria-label={ko ? `${m.name} ${counter.label} 판매 취소` : `Undo ${m.name} ${counter.label} sale`}
                            style={{ width: "26px", height: "26px", borderRadius: "8px 0 0 8px", border: "1px solid rgba(25,25,112,0.14)", background: "rgba(25,25,112,0.03)", fontSize: "15px", cursor: "pointer", color: "#191970", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <div style={{ padding: "0 9px", height: "26px", border: "1px solid rgba(25,25,112,0.14)", borderLeft: "none", borderRight: "none", display: "flex", alignItems: "center", fontSize: "12px", fontWeight: 650, minWidth: hasTakeout ? "44px" : "52px", justifyContent: "center", fontVariantNumeric: "tabular-nums" as const }} aria-live="polite">
                            {counter.count} {counter.label}
                          </div>
                          <button type="button" onClick={() => d.handleProdSoldChange(m.id, 1, counter.takeout)}
                            aria-label={ko ? `${m.name} ${counter.label} 판매 기록` : `Record ${m.name} ${counter.label} sale`}
                            style={{ width: "26px", height: "26px", borderRadius: "0 8px 8px 0", border: "1px solid rgba(25,25,112,0.14)", background: "rgba(25,25,112,0.03)", fontSize: "15px", cursor: "pointer", color: "#191970", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>
                      ))}
                      {rc === 0 ? (
                        <span style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)" }}>{ko ? "재료 등록 시 자동차감" : "Set recipe for auto-deduct"}</span>
                      ) : (() => {
                        // "지금 재료로 N개 가능" — 메뉴 수량은 입력이 아니라 레시피×재고에서 계산. (2026-07-23 사장님 승인)
                        const mk = makeableServings(m, recipeMaterials);
                        if (!mk) return null;
                        const limName = mk.limitingMaterialId ? recipeMaterials.find((x) => x.id === mk.limitingMaterialId)?.name : null;
                        return mk.servings <= 0 ? (
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#b64c4c" }}>
                            {ko ? `${limName ?? "재료"} 소진 — 만들 수 없음` : "Out of ingredients"}
                          </span>
                        ) : (
                          <span style={{ fontSize: "10px", color: "rgba(15,23,42,0.5)" }}>
                            {ko ? `지금 재료로 ${mk.servings}개 가능` : `${mk.servings} makeable`}
                          </span>
                        );
                      })()}
                      <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                        <button type="button" onClick={() => setRecipeMenuId(m.id)}
                          style={{ fontSize: "11px", fontWeight: 650, color: "#191970", background: "rgba(25,25,112,0.07)", border: "none", borderRadius: "9px", padding: "4px 10px", cursor: "pointer" }}>
                          {ko ? (rc > 0 ? `재료 ${rc}` : "재료") : "Recipe"}
                        </button>
                        <button type="button" onClick={() => d.openInvEdit(m)} style={{ fontSize: "11px", color: "#3b5c8c", background: "none", border: "none", cursor: "pointer" }}>{ko ? "수정" : "Edit"}</button>
                        <button type="button" onClick={() => { if (window.confirm(ko ? `'${m.name}' 을(를) 삭제하시겠습니까?` : `Delete '${m.name}'?`)) d.handleInvDelete(m.id); }}
                          style={{ fontSize: "11px", color: "#b64c4c", background: "none", border: "none", cursor: "pointer" }}>{ko ? "삭제" : "Del"}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {section === "all" && <div style={{ height: "1px", background: "rgba(25,25,112,0.07)", margin: "12px 0 0" }} />}
        </div>
      )}

      {showStockSection && (() => {
        // ── 추적모드 분리 (2026-08-25, 사용자 피드백 — inventory-tracking SSOT) ──
        //  벌크(무게·부피 단위) 재료 = 잔량·발주임계 대신 원가·발주 리듬으로 관리.
        const countedStock = inventory.filter((i) => isCountTracked(i));
        const bulkStock = inventory.filter((i) => !isCountTracked(i));
        const todayIso = getKstDate(new Date());
        // 스타터팩: 재료가 하나도 없을 때만 (재진입 소음 방지) + 이미 있는 이름 제외
        const materialCount = fullInventory.filter((i) => i.itemType !== "product").length;
        const starterItems = starterPack && materialCount === 0
          ? starterPack.items.filter((s) => !fullInventory.some((i) => i.name === s.name))
          : [];
        const showStarter = starterItems.length > 0;
        return (<>
      {/* 재료(식자재·소모품) 섹션 라벨 — 통합 카드에서만 (분리 카드는 카드 제목이 대신) */}
      {section === "all" && isMenuMode && (
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#191970", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
          {mode === "service" ? (ko ? "소모품 재고" : "Supplies") : (ko ? "재료 재고" : "Ingredients")}
        </div>
      )}

      {showStarter ? (
        /* ── 스타터 체크리스트 — 콜드스타트 해소 (2026-08-25, 사용자 피드백 "베이스로 깔아놓기") ── */
        <div style={{ borderRadius: "14px", background: "rgba(25,25,112,0.03)", padding: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
            {ko ? starterPack!.titleKo : starterPack!.titleEn}
          </div>
          <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.5)", marginBottom: "10px" }}>
            {ko
              ? "쓰는 것만 골라 한 번에 추가하세요. 수량·가격은 나중에 아는 것부터 채우면 돼요."
              : "Pick what you use — quantities and prices can be filled in later."}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "12px" }}>
            {starterItems.map((s) => {
              const selected = !starterDeselected.has(s.name);
              const bulk = isBulkUnit(s.unit);
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setStarterDeselected((prev) => {
                    const next = new Set(prev);
                    if (next.has(s.name)) next.delete(s.name); else next.add(s.name);
                    return next;
                  })}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px", padding: "6px 10px",
                    borderRadius: "999px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                    border: selected ? "1px solid rgba(25,25,112,0.3)" : "1px solid rgba(15,23,42,0.1)",
                    background: selected ? "rgba(25,25,112,0.08)" : "#fff",
                    color: selected ? "#191970" : "rgba(15,23,42,0.45)",
                  }}
                >
                  {selected ? "✓ " : ""}{s.name}
                  {/* 단위가 곧 관리 방식 — 여기서 추적모드 규칙을 자연 학습 */}
                  <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.7 }}>
                    {s.unit} · {bulk ? (ko ? "원가·리듬" : "cost") : (ko ? "수량" : "count")}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              const picked = starterItems.filter((s) => !starterDeselected.has(s.name));
              if (picked.length === 0) return;
              const now = Date.now();
              d.saveInventory([
                ...fullInventory,
                ...picked.map((s, idx) => ({
                  id: `starter-${now}-${idx}`,
                  name: s.name, quantity: 0, unit: s.unit, minThreshold: 0, unitCost: 0,
                  category: s.category, itemType: "material" as const, sellingPrice: 0,
                  expiryDate: "", supplierName: "", supplierUrl: "", leadTimeDays: 1,
                  dailyUsage: 0, lastOrderedAt: "", wasteLog: [],
                })),
              ]);
            }}
            style={{ ...opsActionPrimary, width: "100%" }}
          >
            {ko
              ? `${starterItems.length - [...starterDeselected].filter((n) => starterItems.some((s) => s.name === n)).length}개 품목 추가`
              : `Add ${starterItems.length - starterDeselected.size} items`}
          </button>
        </div>
      ) : (<>
      <div style={opsMetricGrid}>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "발주 필요" : "Reorder"}</div>
          <div style={{ ...opsMetricValue, color: lowStockItems.length > 0 ? "#b64c4c" : "#1d3557" }}>
            {lowStockItems.length}{ko ? "개" : ""}
          </div>
        </div>
        <div style={opsMetricCard}>
          <div style={opsMetricLabel}>{ko ? "정상 품목" : "Normal"}</div>
          <div style={opsMetricValue}>{Math.max(countedStock.length - lowStockItems.length, 0)}{ko ? "개" : ""}</div>
        </div>
      </div>

      <OverstockSection ko={ko} inventory={countedStock} />

      <div style={listStack}>
        {/* 발주 필요(critical → warning) 품목을 상단으로 정렬 후 top 4 노출. 2026-05-11 */}
        {[...countedStock]
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
                <div style={listMeta}>{(categoryLabels[item.category as keyof typeof categoryLabels] ?? item.category ?? (ko ? "일반" : "General"))}</div>
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
              <button type="button" onClick={() => { if (window.confirm(ko ? `'${item.name}' 재고를 삭제하시겠습니까? 되돌릴 수 없습니다.` : `Delete '${item.name}'? This can't be undone.`)) d.handleInvDelete(item.id); }} style={tinyDangerAction}>
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

      {/* ── 원가·발주 리듬 재료 (벌크 단위) — 잔량 대신 마지막 발주 경과일 (2026-08-25) ── */}
      {bulkStock.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#191970", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "4px" }}>
            {ko ? "원가·발주 리듬 관리" : "Cost & order rhythm"}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", marginBottom: "8px" }}>
            {ko
              ? "무게·부피 단위 재료는 잔량 대신 원가 계산과 발주 리듬으로 관리돼요."
              : "Weight/volume ingredients are managed by cost and order rhythm, not counts."}
          </div>
          <div style={listStack}>
            {bulkStock.map((item) => {
              const rhythm = orderRhythm(item as { lastOrderedAt?: string; orderCycleDays?: number }, todayIso);
              const cycle = (item as { orderCycleDays?: number }).orderCycleDays ?? 0;
              return (
                <div key={item.id} style={{ ...listRow, borderLeft: `3px solid ${rhythm?.overdue ? "#b64c4c" : "rgba(25,25,112,0.15)"}` }}>
                  <div>
                    <div style={listTitle}>{item.name}</div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" as const }}>
                      {/* 단가는 사장님 언어로 — 구매 묶음("1L 2,600원") > L·kg 환산 > 원단위 (2026-08-25) */}
                      {(() => {
                        const pack = item as { purchasePackSize?: number; purchasePackPrice?: number };
                        if (pack.purchasePackSize && pack.purchasePackPrice) {
                          return <span style={listMeta}>{packSizeLabel(pack.purchasePackSize, item.unit ?? "")} {fmt(pack.purchasePackPrice)}</span>;
                        }
                        const disp = item.unitCost ? bulkUnitCostDisplay(item.unitCost, item.unit) : null;
                        if (disp) return <span style={listMeta}>{fmt(disp.amount)}/{disp.perUnit}</span>;
                        return item.unitCost ? <span style={listMeta}>{fmt(item.unitCost)}/{item.unit}</span> : null;
                      })()}
                      <span style={listMeta}>
                        {rhythm
                          ? (ko ? `마지막 발주 ${rhythm.daysSince}일 전` : `Ordered ${rhythm.daysSince}d ago`)
                          : (ko ? "발주 기록 없음" : "No order yet")}
                        {cycle > 0 ? (ko ? ` · 보통 ${cycle}일마다` : ` · every ${cycle}d`) : ""}
                      </span>
                      {rhythm?.overdue && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#b64c4c", background: "rgba(182,76,76,0.08)", borderRadius: "4px", padding: "1px 5px" }}>
                          {ko ? "발주 시기 확인" : "Check order"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={rowActions}>
                    <button type="button" onClick={() => d.handleMarkOrdered(item.id)} style={tinyAction}>
                      {ko ? "오늘 발주" : "Ordered"}
                    </button>
                    <button type="button" onClick={() => d.openInvEdit(item as never)} style={tinyAction}>
                      {ko ? "수정" : "Edit"}
                    </button>
                    <button type="button" onClick={() => { if (window.confirm(ko ? `'${item.name}' 재고를 삭제하시겠습니까? 되돌릴 수 없습니다.` : `Delete '${item.name}'? This can't be undone.`)) d.handleInvDelete(item.id); }} style={tinyDangerAction}>
                      {ko ? "삭제" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>)}
      </>); })()}

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
            {/* 정렬 토글 — 긴급도(기본)/가나다/분류 */}
            <div style={{ display: "flex", gap: "6px", padding: "12px 24px 0" }}>
              {([
                { id: "urgency", label: ko ? "긴급도" : "Urgency" },
                { id: "name", label: ko ? "가나다" : "A–Z" },
                { id: "category", label: ko ? "분류" : "Category" },
              ] as const).map((opt) => {
                const active = invSortMode === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setInvSortMode(opt.id)} style={{
                    fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "999px", cursor: "pointer",
                    border: active ? "1px solid rgba(25,25,112,0.25)" : "1px solid rgba(15,23,42,0.08)",
                    background: active ? "rgba(25,25,112,0.08)" : "transparent",
                    color: active ? "#191970" : "rgba(15,23,42,0.5)",
                  }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {/* list — 정렬 토글에 따라 정렬 (기본 긴급도) */}
            <div style={{ overflowY: "auto", padding: "12px 24px 24px", display: "flex", flexDirection: "column" as const, gap: "6px" }}>
              {sortInventory(inventorySnapshot)
                .map((item) => {
                const tracked = isCountTracked(item);
                const isLow = tracked && (item.minThreshold ?? 0) > 0 && item.quantity <= (item.minThreshold ?? 0);
                const urgency = tracked && (item.minThreshold ?? 0) > 0 && item.quantity <= 0 ? "critical" : isLow ? "warning" : "ok";
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
                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>{(categoryLabels[item.category as keyof typeof categoryLabels] ?? item.category ?? (ko ? "일반" : "General"))}</span>
                        {urgency !== "ok" && (
                          <span style={{ fontSize: "10px", fontWeight: 700, color: urgencyColor, background: `${urgencyColor}10`, borderRadius: "4px", padding: "1px 5px" }}>
                            {urgency === "critical" ? (ko ? "즉시 발주" : "Order now") : (ko ? "발주 필요" : "Low")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>
                        {/* 벌크 재료는 잔량 대신 단가 — 추적모드 분리 (2026-08-25) */}
                        {tracked
                          ? <>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</>
                          : (item.unitCost ? `${fmt(item.unitCost)}/${item.unit}` : (ko ? "원가·리듬" : "Cost only"))}
                      </div>
                      {(item as { sellingPrice?: number }).sellingPrice ? (
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{fmt((item as { sellingPrice?: number }).sellingPrice ?? 0)}</div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button type="button" onClick={() => { d.openInvEdit(item as never); setShowAllInventory(false); }} style={tinyAction}>
                        {ko ? "수정" : "Edit"}
                      </button>
                      <button type="button" onClick={() => { if (window.confirm(ko ? `'${item.name}' 재고를 삭제하시겠습니까? 되돌릴 수 없습니다.` : `Delete '${item.name}'? This can't be undone.`)) { d.handleInvDelete(item.id); setInventorySnapshot(prev => prev.filter(i => i.id !== item.id)); } }} style={tinyDangerAction}>
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

      {/* 폼 — 분리 카드에선 자기 유형의 폼만 렌더 (메뉴 카드=product, 재고 카드=material) */}
      {invForm.open && (section === "all" || (invForm.itemType === "product") === (section === "menu")) ? (
        <div style={inlineEditor}>
          <div style={inlineEditorTitle}>
            {isMenuMode
              ? (invForm.itemType === "product"
                ? (isEditing ? (ko ? `${menuNoun} 수정` : "Edit menu") : (ko ? `${menuNoun} 추가` : "Add menu"))
                : (isEditing ? (ko ? "재료 수정" : "Edit ingredient") : (ko ? "재료 추가" : "Add ingredient")))
              : isEditing ? (ko ? "재고 수정" : "Edit inventory") : (ko ? "재고 추가" : "Add inventory")}
          </div>
          {/* 유형 선택 — 통합 카드에서만 (분리 카드는 유형 고정, 2026-07-27) */}
          {section === "all" && (
          <div style={{ display: "flex", gap: "4px", padding: "3px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", marginBottom: "10px" }}>
            {([
              { value: "material" as const, label: ko ? (mode === "service" ? "소모품" : "원재료") : "Material" },
              { value: "product" as const, label: ko ? (mode === "separate" ? "메뉴" : mode === "service" ? "서비스 메뉴" : "판매 상품") : "Product" },
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
          )}
          <div style={formGridTwo}>
            <input
              type="text"
              value={invForm.name}
              onChange={(event) => d.setInvForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={ko ? "품목명" : "Item name"}
              style={inputStyle}
            />
            {invForm.itemType === "product" ? (
              /* 상품: 업종 맞춤 자유분류 (식자재 enum 부적합) — displayCategory 로 무손실 보존. */
              <>
                <input
                  type="text"
                  list="prod-cat-suggestions"
                  value={invForm.displayCategory ?? ""}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, displayCategory: event.target.value }))}
                  placeholder={ko ? "분류 (예: 메인·의류·음료)" : "Category"}
                  style={inputStyle}
                />
                <datalist id="prod-cat-suggestions">
                  {productCatSuggestions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            ) : (
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
            )}
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
            isMenuMode ? (
              /* ── 메뉴·서비스 폼: 재고 수량 없음(만들어 파는 품목) — 원가는 재료(레시피)로 자동.
                    저장하면 재료 선택 팝업이 바로 열림. (2026-07-22 사장님 지시) ── */
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.unitCost}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unitCost: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "원가 (선택 — 재료 지정 시 자동 계산)" : "Cost (opt — auto from recipe)"}
                  style={inputStyle}
                />
                <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, padding: "2px 2px 0" }}>
                  {ko
                    ? "저장하면 들어가는 재료를 고르는 창이 열립니다 — 재료·소요량(0.3개, 200g)으로 원가율 자동 계산, 판매 시 재고 자동 차감."
                    : "After saving, pick the ingredients — cost ratio auto-calculates and stock auto-deducts on sale."}
                </div>
              </>
            ) : (
            /* ── 판매 상품 폼(소매): 판매가 + 수량 + (선택)원가 ── */
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
                  list="inv-unit-suggestions"
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
            )
          ) : (
            /* ── 원재료 폼: 단가 + 수량 + 최소수량 + 일사용량 + 리드타임 + 공급처 ──
                 벌크(무게·부피 단위)면 수량·최소수량·일사용량 대신 발주 주기 — 추적모드 분리 (2026-08-25) */
            <>
              <div style={formGridThree}>
                {!isBulkUnit(invForm.unit) && (
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.qty}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, qty: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "수량" : "Qty"}
                  style={inputStyle}
                />
                )}
                <input
                  type="text"
                  list="inv-unit-suggestions"
                  value={invForm.unit}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, unit: event.target.value }))}
                  placeholder={ko ? "단위 (개·g·kg·ml·l)" : "Unit (ea·g·kg·ml·l)"}
                  style={inputStyle}
                />
                {/* 무게(g·kg)·부피(ml·l)로 등록하면 레시피에서 그램·리터 소요량 환산이 활성화됨 */}
                <datalist id="inv-unit-suggestions">
                  {["개", "g", "kg", "ml", "l", "병", "팩", "캔", "포", "장"].map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
                {isBulkUnit(invForm.unit) ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.orderCycleDays}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, orderCycleDays: event.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder={ko ? "발주 주기(일)" : "Order cycle (d)"}
                  style={inputStyle}
                />
                ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.threshold}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, threshold: event.target.value.replace(/[^0-9.]/g, "") }))}
                  placeholder={ko ? "최소 수량" : "Min"}
                  style={inputStyle}
                />
                )}
              </div>
              <div style={formGridThree}>
                {isBulkUnit(invForm.unit) ? (
                  /* 벌크 단가 = 구매 묶음으로 입력 — 사장님은 "우유 1L 2,600원"으로 기억 (2026-08-25) */
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={invForm.purchasePackSize}
                      onChange={(event) => d.setInvForm((prev) => ({ ...prev, purchasePackSize: event.target.value.replace(/[^0-9.]/g, "") }))}
                      placeholder={ko ? `한 번에 사는 양 (${invForm.unit})` : `Pack size (${invForm.unit})`}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={invForm.purchasePackPrice}
                      onChange={(event) => d.setInvForm((prev) => ({ ...prev, purchasePackPrice: event.target.value.replace(/[^0-9]/g, "") }))}
                      placeholder={ko ? "그 가격 (원)" : "Pack price"}
                      style={inputStyle}
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={invForm.leadTimeDays}
                  onChange={(event) => d.setInvForm((prev) => ({ ...prev, leadTimeDays: event.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder={ko ? "리드타임" : "Lead days"}
                  style={inputStyle}
                />
              </div>
              {isBulkUnit(invForm.unit) && (
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", marginTop: "-4px" }}>
                  {(() => {
                    const size = Number(invForm.purchasePackSize) || 0;
                    const price = Number(invForm.purchasePackPrice) || 0;
                    if (size > 0 && price > 0) {
                      const disp = bulkUnitCostDisplay(price / size, invForm.unit);
                      return ko
                        ? `${packSizeLabel(size, invForm.unit)} ${fmt(price)} → 단가 자동 계산${disp ? ` (${disp.perUnit}당 ${fmt(disp.amount)})` : ""}`
                        : `${packSizeLabel(size, invForm.unit)} at ${fmt(price)} → unit cost auto-derived`;
                    }
                    return ko
                      ? "부어 쓰는(무게·부피) 재료는 잔량 대신 원가 계산과 발주 리듬으로 관리돼요 — 수량 입력이 필요 없어요."
                      : "Weight/volume ingredients skip counting — managed by cost and order rhythm instead.";
                  })()}
                </div>
              )}
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
            <button
              type="button"
              onClick={() => {
                // 신규 메뉴는 저장 즉시 재료 선택 팝업 자동 오픈 — 추가→레시피 지정이 한 흐름.
                // (수정은 행의 [재료] 버튼으로 — 매번 팝업 뜨면 성가심) (2026-07-22 사장님 지시)
                const openRecipe = isMenuMode && invForm.itemType === "product" && !invForm.editId;
                const savedId = d.handleInvSave();
                if (openRecipe && savedId) setRecipeMenuId(savedId);
              }}
              style={opsActionPrimary}
            >
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

      {/* 레시피(BOM) 편집 팝업 — 메뉴 행 [재료] 버튼 (2026-07-22 통합) */}
      {recipeMenu && (
        <RecipeEditorModal
          ko={ko}
          menu={recipeMenu}
          materials={recipeMaterials}
          goldenMax={goldenMax}
          onSave={(recipe, takeoutRecipe) => {
            d.saveInventory(fullInventory.map((i) => (i.id === recipeMenu.id
              ? { ...i, recipe, takeoutRecipe: takeoutRecipe.length > 0 ? takeoutRecipe : undefined }
              : i)));
            setRecipeMenuId(null);
          }}
          onClose={() => setRecipeMenuId(null)}
        />
      )}

      {/* 수익성 상세 팝업 — [자세히 보기] (2026-07-22 사장님 지시) */}
      {showProfitDetail && (
        <MenuProfitabilityModal
          ko={ko}
          menus={menus}
          materials={recipeMaterials}
          goldenMax={goldenMax}
          noun={menuNoun}
          onClose={() => setShowProfitDetail(false)}
        />
      )}
    </section>
  );
}
