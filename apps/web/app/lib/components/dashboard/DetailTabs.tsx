"use client";

import { useState } from "react";
import type { DashboardHook } from "../../useDashboard";
import {
  groupCostsByClassification,
  COST_CLASSIFICATION_LABELS,
  COST_CLASSIFICATION_COLORS,
  classifyCost,
  type CostItem,
  type CostClassification,
} from "@foundone/shared";
import TaxCalendarCard from "../TaxCalendarCard";

type Props = {
  d: DashboardHook;
  fmt: (n: number) => string;
};

type TabDef = { id: string; label: string; labelEn: string };

export function DetailTabs({ d, fmt }: Props) {
  const ko = d.language === "ko";
  const ctx = d.businessCtx;

  /* define tabs conditionally */
  const tabs: TabDef[] = [
    { id: "costs", label: "비용", labelEn: "Costs" },
    ...(ctx.showInventoryCard ? [{ id: "inventory", label: "재고", labelEn: "Inventory" }] : []),
    { id: "staff", label: "직원", labelEn: "Staff" },
    ...(ctx.isDeliveryRelevant ? [{ id: "delivery", label: "배달", labelEn: "Delivery" }] : []),
    ...(ctx.showProductCard ? [{ id: "products", label: "메뉴", labelEn: "Menu" }] : []),
    ...(ctx.isRecurringRevenue ? [{ id: "members", label: "회원", labelEn: "Members" }] : []),
    { id: "tax", label: "세금", labelEn: "Tax" },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "costs");

  return (
    <div style={container}>
      {/* Tab Bar */}
      <div style={tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...tabButton,
              ...(activeTab === tab.id ? tabActive : tabInactive),
            }}
          >
            {ko ? tab.label : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={tabContent}>
        {activeTab === "costs" && <CostsPanel d={d} ko={ko} fmt={fmt} />}
        {activeTab === "inventory" && <InventoryPanel d={d} ko={ko} fmt={fmt} />}
        {activeTab === "staff" && <StaffPanel d={d} ko={ko} />}
        {activeTab === "delivery" && <DeliveryPanel d={d} ko={ko} />}
        {activeTab === "products" && <ProductsPanel d={d} ko={ko} fmt={fmt} />}
        {activeTab === "members" && <MembersPanel d={d} ko={ko} />}
        {activeTab === "tax" && <TaxPanel d={d} ko={ko} />}
      </div>
    </div>
  );
}

/* ═══ Tab Panels ═══ */

function CostsPanel({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  const mc = d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number };
  const total = mc.ingredients + mc.labor + mc.rent + mc.utilities + (mc.sga ?? 0) + (mc.marketing ?? 0) + mc.other;

  const ef = d.businessCtx?.expenseFields ?? [];
  const getLabel = (key: string) => {
    const f = ef.find((e: { fieldKey: string; label: { ko: string; en: string } }) => e.fieldKey === key);
    return f ? (ko ? f.label.ko : f.label.en) : key;
  };

  // 분류별 그룹화 SSOT — packages/shared/finance/cost-classification.ts.
  //   고정비 (rent·labor·utilities·interest) · 변동비 (ingredients·sga·marketing) · 기타 (other).
  const itemsRaw: CostItem[] = [
    { fieldKey: "ingredients", label: getLabel("ingredients"), value: mc.ingredients },
    { fieldKey: "labor",       label: getLabel("labor"),       value: mc.labor },
    { fieldKey: "rent",        label: getLabel("rent"),        value: mc.rent },
    { fieldKey: "utilities",   label: getLabel("utilities"),   value: mc.utilities },
    { fieldKey: "sga",         label: getLabel("sga"),         value: mc.sga ?? 0 },
    { fieldKey: "marketing",   label: getLabel("marketing"),   value: mc.marketing ?? 0 },
    { fieldKey: "other",       label: getLabel("other"),       value: mc.other },
    { fieldKey: "interest",    label: getLabel("interest"),    value: (mc as Record<string, number>).interest ?? 0 },
  ];
  const grouped = groupCostsByClassification(itemsRaw);

  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(25,25,112,0.10)", borderRadius: "10px",
    padding: "9px 12px", fontSize: "13.5px", outline: "none",
    background: "#ffffff", width: "100%", boxSizing: "border-box",
    fontVariantNumeric: "tabular-nums",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    color: "#0f172a",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
      {/* Left: 분류별(고정·변동·기타) 그룹 카드 (Apple Health 톤) */}
      <div>
        <div style={panelLabel}>{ko ? "월간 비용 구조" : "Monthly Cost Structure"}</div>

        {total > 0 ? (
          <>
            {/* 분류 요약 칩 — 고정/변동/기타 비율 한 줄 */}
            <div style={{
              marginTop: "12px",
              display: "flex",
              gap: "6px",
              flexWrap: "wrap" as const,
            }}>
              {(["fixed", "variable", "other"] as const).map((cls) => {
                if (grouped[cls].total <= 0) return null;
                const c = COST_CLASSIFICATION_COLORS[cls];
                const pct = (grouped[cls].total / total) * 100;
                return (
                  <span key={cls} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "999px",
                    background: c.bg,
                    border: `0.5px solid ${c.border}`,
                    fontSize: "11px",
                    fontWeight: 700,
                    color: c.text,
                    letterSpacing: "-0.005em",
                    fontVariantNumeric: "tabular-nums" as const,
                  }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: c.bar, flexShrink: 0,
                    }} />
                    {ko ? COST_CLASSIFICATION_LABELS[cls].ko : COST_CLASSIFICATION_LABELS[cls].en}
                    <span style={{ opacity: 0.55 }}>·</span>
                    <span>{fmt(grouped[cls].total)}</span>
                    <span style={{ opacity: 0.55 }}>({pct.toFixed(0)}%)</span>
                  </span>
                );
              })}
            </div>

            {/* 분류별 그룹 카드 — 헤더 + 항목별 막대 */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px", marginTop: "16px" }}>
              {(["fixed", "variable", "other"] as const).map((cls) => {
                const group = grouped[cls];
                const nonZeroItems = group.items.filter((it) => it.value > 0);
                if (nonZeroItems.length === 0) return null;
                const c = COST_CLASSIFICATION_COLORS[cls];
                const groupPct = (group.total / total) * 100;
                const maxInGroup = Math.max(...nonZeroItems.map((it) => it.value), 1);
                return (
                  <div key={cls} style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                  }}>
                    {/* Group header */}
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <span style={{
                          width: "8px", height: "8px", borderRadius: "50%",
                          background: c.bar, flexShrink: 0,
                          boxShadow: `0 0 0 3px ${c.border}`,
                        }} />
                        <span style={{
                          fontSize: "11.5px", fontWeight: 700, color: c.text,
                          letterSpacing: "0.04em", textTransform: "uppercase" as const,
                        }}>
                          {ko ? COST_CLASSIFICATION_LABELS[cls].ko : COST_CLASSIFICATION_LABELS[cls].en}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                        <span style={{
                          fontSize: "14px", fontWeight: 700, color: c.text,
                          fontVariantNumeric: "tabular-nums" as const, letterSpacing: "-0.01em",
                        }}>
                          {fmt(group.total)}
                        </span>
                        <span style={{ fontSize: "10.5px", fontWeight: 600, color: c.text, opacity: 0.6, fontVariantNumeric: "tabular-nums" as const }}>
                          {groupPct.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Items in group */}
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "9px" }}>
                      {nonZeroItems.map((it) => {
                        const pctOfTotal = (it.value / total) * 100;
                        const widthOfGroup = (it.value / maxInGroup) * 100;
                        return (
                          <div key={it.fieldKey} style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.72)", letterSpacing: "-0.005em" }}>
                                {it.label}
                              </span>
                              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexShrink: 0 }}>
                                <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" as const, letterSpacing: "-0.01em" }}>
                                  {fmt(it.value)}
                                </span>
                                <span style={{ fontSize: "10.5px", fontWeight: 600, color: c.text, opacity: 0.7, fontVariantNumeric: "tabular-nums" as const, minWidth: "30px", textAlign: "right" as const }}>
                                  {pctOfTotal.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div style={{
                              height: "5px",
                              borderRadius: "999px",
                              background: "rgba(255,255,255,0.55)",
                              overflow: "hidden",
                            }}>
                              <div style={{
                                height: "100%",
                                width: `${widthOfGroup}%`,
                                background: c.bar,
                                borderRadius: "999px",
                                transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 총 비용 — 미드나이트 강조 */}
            <div style={{
              marginTop: "14px",
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(25,25,112,0.06) 0%, rgba(25,25,112,0.03) 100%)",
              borderRadius: "12px",
              border: "1px solid rgba(25,25,112,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#191970", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                {ko ? "총 비용" : "Total"}
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#0f0f4a", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" as const }}>
                {fmt(total)}
              </span>
            </div>
          </>
        ) : (
          <div style={{
            marginTop: "12px",
            padding: "32px 20px",
            borderRadius: "12px",
            background: "rgba(25,25,112,0.03)",
            border: "1px dashed rgba(25,25,112,0.16)",
            textAlign: "center" as const,
            color: "rgba(25,25,112,0.55)",
            fontSize: "13px",
            fontWeight: 500,
          }}>
            {ko ? "비용 데이터를 입력하면 분포 차트가 표시됩니다" : "Enter cost data to see breakdown"}
          </div>
        )}
      </div>

      {/* Right: input form — 분류별 그룹 (고정·변동·기타) */}
      <div>
        <div style={panelLabel}>{ko ? "비용 수정" : "Edit Costs"}</div>
        {(() => {
          const allFields: Array<{ fieldKey: string; label: string; state: string; setter: (v: string) => void }> = [
            { fieldKey: "ingredients", label: getLabel("ingredients"), state: d.costCogsText ?? d.costIngredientsText ?? "", setter: d.setCostCogsText ?? d.setCostIngredientsText },
            { fieldKey: "labor",       label: getLabel("labor"),       state: d.costLaborText, setter: d.setCostLaborText },
            { fieldKey: "rent",        label: getLabel("rent"),        state: d.costRentText, setter: d.setCostRentText },
            { fieldKey: "utilities",   label: getLabel("utilities"),   state: d.costUtilitiesText, setter: d.setCostUtilitiesText },
            { fieldKey: "sga",         label: getLabel("sga"),         state: d.costSgaText ?? "", setter: d.setCostSgaText },
            { fieldKey: "marketing",   label: getLabel("marketing"),   state: d.costMarketingText ?? "", setter: d.setCostMarketingText },
            { fieldKey: "other",       label: getLabel("other"),       state: d.costOtherText, setter: d.setCostOtherText },
            { fieldKey: "interest",    label: getLabel("interest"),    state: d.costInterestText ?? "", setter: d.setCostInterestText },
          ];
          // 분류별 그룹화 (SSOT)
          const byClass: Record<CostClassification, typeof allFields> = { fixed: [], variable: [], other: [] };
          for (const f of allFields) byClass[classifyCost(f.fieldKey)].push(f);

          const renderGroup = (cls: CostClassification) => {
            const fields = byClass[cls];
            if (fields.length === 0) return null;
            const c = COST_CLASSIFICATION_COLORS[cls];
            return (
              <div key={cls} style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  marginTop: "4px",
                }}>
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: c.bar, flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: "10.5px", fontWeight: 700, color: c.text,
                    letterSpacing: "0.06em", textTransform: "uppercase" as const,
                  }}>
                    {ko ? COST_CLASSIFICATION_LABELS[cls].ko : COST_CLASSIFICATION_LABELS[cls].en}
                  </span>
                </div>
                {fields.map((field) => (
                  <div key={field.fieldKey} style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" as const }}>
                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: "rgba(15,23,42,0.65)", width: "84px", flexShrink: 0, letterSpacing: "-0.005em" }}>
                      {field.label}
                    </span>
                    <div style={{ flex: 1, position: "relative" as const }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={field.state}
                        onChange={(e) => field.setter(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="0"
                        style={{ ...inputStyle, paddingRight: "40px" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(25,25,112,0.35)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(25,25,112,0.08)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(25,25,112,0.10)"; e.currentTarget.style.boxShadow = "none"; }}
                      />
                      <span style={{ position: "absolute" as const, right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "11.5px", fontWeight: 600, color: "rgba(25,25,112,0.5)", pointerEvents: "none" as const }}>
                        {ko ? "만원" : "10K"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          };

          return (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px", marginTop: "12px" }}>
              {renderGroup("fixed")}
              {renderGroup("variable")}
              {renderGroup("other")}
              <button
                type="button"
                onClick={d.handleSaveMonthlyCosts}
                style={{
                  marginTop: "10px", borderRadius: "12px", border: "none",
                  background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)", color: "#fff",
                  padding: "12px", fontSize: "13.5px", fontWeight: 700,
                  letterSpacing: "-0.01em", cursor: "pointer",
                  transition: "background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
                  boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(30,42,85,0.28)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(30,42,85,0.18)"; }}
              >
                {ko ? "저장" : "Save"}
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function InventoryPanel({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  type Inv = { id: string; name: string; quantity: number; unit: string; category: string; status?: string; cost?: number };
  const items = (d.inventory as unknown as Inv[]);
  const totalValue = items.reduce((s, it) => s + (it.cost ?? 0) * (it.quantity ?? 0), 0);
  const urgentCount = items.filter((it) => it.status === "urgent" || it.status === "warning").length;

  return (
    <div>
      <SummaryRow items={[
        { label: ko ? "재고 가치" : "Stock value", value: totalValue > 0 ? fmt(totalValue) : "—" },
        { label: ko ? "품목 수" : "Items", value: `${items.length}${ko ? "개" : ""}` },
        { label: ko ? "발주 필요" : "Order now", value: urgentCount > 0 ? `${urgentCount}${ko ? "개" : ""}` : "—", tone: urgentCount > 0 ? "alert" : undefined },
      ]} />

      {items.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
          {items.slice(0, 10).map((it) => (
            <div key={it.id} style={rowCard}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{it.name}</span>
                <span style={{
                  fontSize: "10px", padding: "2px 7px", borderRadius: "5px",
                  background: "rgba(17,17,17,0.04)", color: "var(--muted)",
                }}>{it.category}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontVariantNumeric: "tabular-nums", color: "var(--text)" }}>
                  {it.quantity} {it.unit}
                </span>
                {(it.status === "urgent" || it.status === "warning") && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
                    background: "rgba(182,76,76,0.08)", color: "#b64c4c",
                  }}>
                    {ko ? "발주" : "Order"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyHint text={ko ? "재고 품목을 추가하세요" : "Add inventory items"} />
      )}
    </div>
  );
}

function StaffPanel({ d, ko }: { d: DashboardHook; ko: boolean }) {
  type Emp = { id: string; name: string; role?: string; monthlyWage?: number; hoursPerWeek?: number };
  const employees = d.employees as unknown as Emp[];
  const totalLabor = employees.reduce((s, e) => s + (e.monthlyWage || 0), 0);
  const avgWage = employees.length > 0 ? totalLabor / employees.length : 0;
  const fmtWon = (n: number) => n >= 10000 ? `${Math.round(n / 10000)}만원` : `${n.toLocaleString()}원`;

  return (
    <div>
      <SummaryRow items={[
        { label: ko ? "직원 수" : "Staff", value: `${employees.length}${ko ? "명" : ""}` },
        { label: ko ? "월 인건비" : "Monthly labor", value: totalLabor > 0 ? fmtWon(totalLabor) : "—" },
        { label: ko ? "평균 급여" : "Avg wage", value: avgWage > 0 ? fmtWon(avgWage) : "—" },
      ]} />

      {employees.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
          {employees.map((emp) => (
            <div key={emp.id} style={rowCard}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{emp.name}</span>
                <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "8px" }}>{emp.role}</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 650, fontVariantNumeric: "tabular-nums", color: "var(--text)" }}>
                {fmtWon(emp.monthlyWage || 0)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyHint text={ko ? "직원 정보를 추가하세요" : "Add staff information"} />
      )}
    </div>
  );
}

function DeliveryPanel({ d, ko }: { d: DashboardHook; ko: boolean }) {
  type Dlv = { id: string; name: string; commissionRate?: number; adFee?: number };
  const platforms = d.deliveryPlatforms as unknown as Dlv[];
  const avgCommission = platforms.length > 0
    ? platforms.reduce((s, p) => s + (p.commissionRate ?? 0), 0) / platforms.length
    : 0;
  const totalAdFee = platforms.reduce((s, p) => s + (p.adFee ?? 0), 0);

  return (
    <div>
      <SummaryRow items={[
        { label: ko ? "플랫폼" : "Platforms", value: `${platforms.length}${ko ? "개" : ""}` },
        { label: ko ? "평균 수수료" : "Avg fee", value: platforms.length > 0 ? `${avgCommission.toFixed(1)}%` : "—" },
        { label: ko ? "월 광고비" : "Ad spend", value: totalAdFee > 0 ? `${totalAdFee.toLocaleString()}` : "—" },
      ]} />

      {platforms.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
          {platforms.map((p) => (
            <div key={p.id} style={rowCard}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                  {ko ? "수수료" : "Fee"} {p.commissionRate}%
                </span>
                {(p.adFee ?? 0) > 0 && (
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    {ko ? "광고" : "Ad"} {(p.adFee ?? 0).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyHint text={ko ? "배달 플랫폼 정보를 추가하세요" : "Add delivery platforms"} />
      )}
    </div>
  );
}

function ProductsPanel({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  type Prod = { id: string; name: string; price: number; cost: number; category?: string };
  const products = d.products as unknown as Prod[];
  const avgPrice = products.length > 0 ? products.reduce((s, p) => s + p.price, 0) / products.length : 0;
  const avgMargin = products.length > 0
    ? products.reduce((s, p) => s + (p.price > 0 ? (p.price - p.cost) / p.price * 100 : 0), 0) / products.length
    : 0;

  return (
    <div>
      <SummaryRow items={[
        { label: ko ? "등록 메뉴" : "Items", value: `${products.length}${ko ? "개" : ""}` },
        { label: ko ? "평균 가격" : "Avg price", value: avgPrice > 0 ? fmt(avgPrice) : "—" },
        { label: ko ? "평균 마진" : "Avg margin", value: avgMargin > 0 ? `${avgMargin.toFixed(0)}%` : "—" },
      ]} />

      {products.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {products.map((p) => {
            const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100) : 0;
            const marginColor = margin >= 60 ? "#1d3557" : margin >= 40 ? "#191970" : "#b64c4c";
            return (
              <div key={p.id} style={{
                padding: "12px 14px", borderRadius: "12px",
                background: "var(--surface)", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.005em" }}>{p.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{fmt(p.price)}</span>
                  <span style={{ fontSize: "12px", fontWeight: 650, color: marginColor, fontVariantNumeric: "tabular-nums" }}>
                    {ko ? "마진" : "Margin"} {margin.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyHint text={ko ? "메뉴/상품을 추가하세요" : "Add products or menu items"} />
      )}
    </div>
  );
}

function MembersPanel({ d, ko }: { d: DashboardHook; ko: boolean }) {
  type Mem = { name: string; plan?: string; fee?: string; end?: string };
  const members = d.members as unknown as Mem[];
  const planCount = new Set(members.map((m) => m.plan).filter(Boolean)).size;
  const now = new Date();
  const expiringSoon = members.filter((m) => {
    if (!m.end) return false;
    const diff = (new Date(m.end).getTime() - now.getTime()) / 86_400_000;
    return diff >= 0 && diff <= 14;
  }).length;

  return (
    <div>
      <SummaryRow items={[
        { label: ko ? "회원 수" : "Members", value: `${members.length}${ko ? "명" : ""}` },
        { label: ko ? "플랜 종류" : "Plans", value: `${planCount}${ko ? "종" : ""}` },
        { label: ko ? "만료 임박" : "Expiring", value: expiringSoon > 0 ? `${expiringSoon}${ko ? "명" : ""}` : "—", tone: expiringSoon > 0 ? "warn" : undefined },
      ]} />

      {members.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
          {members.map((m, i) => (
            <div key={i} style={rowCard}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{m.name}</span>
                <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "8px" }}>{m.plan}</span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{m.end}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyHint text={ko ? "회원 정보를 추가하세요" : "Add members"} />
      )}
    </div>
  );
}

function TaxPanel({ d, ko }: { d: DashboardHook; ko: boolean }) {
  const ts = d.taxSettings as { vatType?: string; hasEmployees?: boolean } | null;
  const isSimplified = ts?.vatType === "simplified";
  const hasEmployees = !!ts?.hasEmployees;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <SummaryRow items={[
        {
          label: ko ? "과세 유형" : "VAT type",
          value: isSimplified ? (ko ? "간이" : "Simplified") : (ko ? "일반" : "General"),
        },
        {
          label: ko ? "직원 유무" : "Employees",
          value: hasEmployees ? (ko ? "있음" : "Yes") : (ko ? "없음" : "No"),
        },
        {
          label: ko ? "세무 처리" : "Tax filing",
          value: d.cpaDecision === "cpa" ? (ko ? "세무사" : "CPA") : d.cpaDecision === "self" ? (ko ? "직접" : "Self") : "—",
        },
      ]} />
      {/* 2026-05-12: 종전엔 "세금 캘린더는 하단에서 확인하세요" 만 노출했는데 하단에 실제로
          렌더되는 캘린더가 없어서 사장님이 길을 잃었음. TaxCalendarCard 를 패널 안에 직접
          임베드 — 과세 유형·직원 유무 기반 개인화 일정이 같은 화면에서 즉시 보임. */}
      <TaxCalendarCard
        isSimplified={isSimplified}
        hasEmployees={hasEmployees}
        language={ko ? "ko" : "en"}
      />
    </div>
  );
}

/* ─── Shared components ─── */

type SummaryItem = { label: string; value: string; tone?: "warn" | "alert" };

function SummaryRow({ items }: { items: SummaryItem[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "10px",
      marginBottom: "18px",
    }}>
      {items.map((it, i) => {
        const accent = it.tone === "alert" ? "#b64c4c" : it.tone === "warn" ? "#191970" : "var(--text)";
        const border = it.tone === "alert"
          ? "1px solid rgba(182,76,76,0.18)"
          : it.tone === "warn"
            ? "1px solid rgba(25,25,112,0.2)"
            : "1px solid var(--border)";
        const bg = it.tone === "alert"
          ? "rgba(182,76,76,0.04)"
          : it.tone === "warn"
            ? "rgba(25,25,112,0.04)"
            : "var(--surface)";
        return (
          <div key={i} style={{ ...miniCard, background: bg, border }}>
            <div style={{
              fontSize: "10.5px", fontWeight: 650, letterSpacing: "0.08em",
              textTransform: "uppercase" as const, color: "var(--muted)",
            }}>
              {it.label}
            </div>
            <div style={{
              fontSize: "18px", fontWeight: 650, letterSpacing: "-0.025em",
              fontVariantNumeric: "tabular-nums", color: accent, marginTop: "6px",
              lineHeight: 1.1,
            }}>
              {it.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{
      padding: "24px 20px",
      borderRadius: "12px",
      background: "var(--surface)",
      border: "1px dashed var(--border)",
      textAlign: "center" as const,
      color: "var(--muted)",
      fontSize: "13px",
      letterSpacing: "-0.005em",
    }}>
      {text}
    </div>
  );
}

const rowCard: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "11px 14px",
  borderRadius: "12px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
};

/* ─── Styles — 미드나이트 블루 + Apple 톤 통일 ─── */

const container: React.CSSProperties = {
  borderRadius: "20px",
  background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 24px -12px rgba(25,25,112,0.10)",
  overflow: "hidden",
};

// Pill-style tab bar — 미드나이트 액센트
const tabBar: React.CSSProperties = {
  display: "flex",
  gap: "4px",
  padding: "14px 14px 0",
  overflowX: "auto",
  scrollbarWidth: "none",
};

const tabButton: React.CSSProperties = {
  flexShrink: 0,
  fontSize: "13px",
  fontWeight: 650,
  letterSpacing: "-0.005em",
  border: "none",
  borderRadius: "999px",
  padding: "8px 18px",
  cursor: "pointer",
  transition: "background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease",
};

const tabActive: React.CSSProperties = {
  background: "#191970",
  color: "#fff",
  boxShadow: "0 2px 6px rgba(25,25,112,0.22)",
};

const tabInactive: React.CSSProperties = {
  background: "transparent",
  color: "var(--muted)",
};

const tabContent: React.CSSProperties = {
  padding: "20px 20px 24px",
  borderTop: "1px solid rgba(25,25,112,0.06)",
  marginTop: "14px",
};

const panelLabel: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#191970",
  opacity: 0.7,
  marginBottom: "2px",
};

const miniCard: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "14px 16px",
  borderRadius: "14px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
};
