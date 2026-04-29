"use client";

import { useState } from "react";
import { BarChart3, Wallet, Package, Users, FileText, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DailyEntry, MonthlyCosts } from "../../stores/finance-store";
import type { InventoryItem, Employee, Product, UnifiedProduct, ServiceMenuItem } from "../../stores/operations-store";
import {
  exportSalesCsv,
  exportCostsCsv,
  exportInventoryCsv,
  exportEmployeesCsv,
  exportComprehensiveExcel,
  exportMonthlyPnLPdf,
  currentMonthIso,
} from "../../services/export";

type Props = {
  ko: boolean;
  storeName?: string;
  entries: DailyEntry[];
  monthlyCosts: MonthlyCosts;
  inventory: InventoryItem[];
  employees: Employee[];
  products?: Product[];
  unifiedProducts?: UnifiedProduct[];
  serviceMenu?: ServiceMenuItem[];
};

/**
 * 데이터 Export 패널 — 매출·비용·재고·직원·P&L 다운로드.
 * 세무사·은행·투자자 제출용 자료를 버튼 한 번으로.
 */
export function ExportPanel({ ko, storeName, entries, monthlyCosts, inventory, employees, products, unifiedProducts, serviceMenu }: Props) {
  const [month, setMonth] = useState<string>(currentMonthIso());
  const [busy, setBusy] = useState<string | null>(null);

  const totalSales = entries.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.sales, 0);

  const run = async (id: string, fn: () => Promise<void> | void) => {
    setBusy(id);
    try {
      await fn();
    } catch (err) {
      console.error("[Export]", id, err);
      alert(ko ? "내보내기 중 오류가 발생했습니다." : "Export failed. Please try again.");
    } finally {
      setTimeout(() => setBusy(null), 400);
    }
  };

  const items: Array<{
    id: string;
    label: { ko: string; en: string };
    desc: { ko: string; en: string };
    Icon: LucideIcon;
    iconColor: string;
    type: "csv" | "excel" | "pdf";
    action: () => void | Promise<void>;
  }> = [
    {
      id: "sales",
      label: { ko: "매출 내역", en: "Sales records" },
      desc: { ko: "일별 매출 + 고객수 + 객단가", en: "Daily sales + customers + avg ticket" },
      Icon: BarChart3,
      iconColor: "#2563eb",
      type: "csv",
      action: () => exportSalesCsv(entries, month),
    },
    {
      id: "costs",
      label: { ko: "비용 구조", en: "Cost structure" },
      desc: { ko: "8항목별 비용 + 매출 대비 비율", en: "8-item breakdown + revenue ratio" },
      Icon: Wallet,
      iconColor: "#b45309",
      type: "csv",
      action: () => exportCostsCsv(monthlyCosts, totalSales, month),
    },
    {
      id: "inventory",
      label: { ko: "재고 현황", en: "Inventory" },
      desc: { ko: "전체 재고 + 공급처 + 리드타임", en: "All inventory + suppliers + lead time" },
      Icon: Package,
      iconColor: "#7c3aed",
      type: "csv",
      action: () => exportInventoryCsv(inventory),
    },
    {
      id: "employees",
      label: { ko: "직원 명세", en: "Employees" },
      desc: { ko: "시급 + 근무시간 + 월급 추정", en: "Wage + hours + est. monthly pay" },
      Icon: Users,
      iconColor: "#0891b2",
      type: "csv",
      action: () => exportEmployeesCsv(employees),
    },
    {
      id: "pnl-pdf",
      label: { ko: "월간 P&L 리포트", en: "Monthly P&L Report" },
      desc: { ko: "손익계산서 + 운영지표 (PDF)", en: "Income statement + metrics (PDF)" },
      Icon: FileText,
      iconColor: "#dc2626",
      type: "pdf",
      action: () => exportMonthlyPnLPdf({ month, storeName, entries, monthlyCosts }),
    },
    {
      id: "comprehensive",
      label: { ko: "통합 경영보고서", en: "Comprehensive report" },
      desc: { ko: "매출·비용·재고·직원 한 파일 (Excel)", en: "All data in one Excel" },
      Icon: TrendingUp,
      iconColor: "#059669",
      type: "excel",
      action: () => exportComprehensiveExcel({ month, entries, monthlyCosts, inventory, employees, products, unifiedProducts, serviceMenu }),
    },
  ];

  const typeColor = (t: "csv" | "excel" | "pdf") =>
    t === "csv" ? "#10b981" : t === "excel" ? "#059669" : "#dc2626";
  const typeLabel = (t: "csv" | "excel" | "pdf") => t.toUpperCase();

  return (
    <section style={card} className="bento-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={eyebrow}>{ko ? "데이터 내보내기" : "Export Data"}</div>
          <div style={title}>{ko ? "세무사·은행·투자자용" : "For CPA, Banks, Investors"}</div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginTop: "4px" }}>
            {ko
              ? "버튼 한 번으로 경영 데이터를 내려받으세요. 한글 엑셀 호환."
              : "One-click download. Korean Excel compatible."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", fontWeight: 650 }}>
            {ko ? "기준 월" : "Month"}
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(15,23,42,0.1)",
              fontSize: "12px",
              fontFamily: "inherit",
              background: "#fff",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
        {items.map((item) => {
          const isBusy = busy === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => run(item.id, item.action)}
              disabled={isBusy}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(15,23,42,0.06)",
                cursor: isBusy ? "wait" : "pointer",
                textAlign: "left" as const,
                fontFamily: "inherit",
                transition: "all 0.15s",
                opacity: isBusy ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isBusy) {
                  e.currentTarget.style.background = "rgba(37,99,235,0.04)";
                  e.currentTarget.style.borderColor = "rgba(37,99,235,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.7)";
                e.currentTarget.style.borderColor = "rgba(15,23,42,0.06)";
              }}
            >
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: `${item.iconColor}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <item.Icon size={18} strokeWidth={1.5} color={item.iconColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 660, color: "#0f172a" }}>
                    {item.label[ko ? "ko" : "en"]}
                  </div>
                  <div style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: typeColor(item.type) + "15",
                    color: typeColor(item.type),
                    letterSpacing: "0.05em",
                  }}>
                    {typeLabel(item.type)}
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5 }}>
                  {item.desc[ko ? "ko" : "en"]}
                </div>
                {isBusy && (
                  <div style={{ fontSize: "10px", color: "#2563eb", marginTop: "4px", fontWeight: 650 }}>
                    {ko ? "생성 중..." : "Generating..."}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "20px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(243,246,251,0.91))",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset, 0 18px 42px rgba(15, 23, 42, 0.038)",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
  marginBottom: "2px",
};

const title: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  lineHeight: 1.1,
};
