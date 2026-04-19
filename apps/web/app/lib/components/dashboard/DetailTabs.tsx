"use client";

import { useState } from "react";
import type { DashboardHook } from "../../useDashboard";

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

  const items = [
    { label: getLabel("ingredients"), value: mc.ingredients, color: "#ff6b35" },
    { label: getLabel("labor"), value: mc.labor, color: "#007aff" },
    { label: getLabel("rent"), value: mc.rent, color: "#5856d6" },
    { label: getLabel("utilities"), value: mc.utilities, color: "#34c759" },
    { label: getLabel("sga"), value: mc.sga ?? 0, color: "#ff9500" },
    { label: getLabel("marketing"), value: mc.marketing ?? 0, color: "#af52de" },
    { label: getLabel("other"), value: mc.other, color: "#86868b" },
    { label: getLabel("interest"), value: (mc as Record<string, number>).interest ?? 0, color: "#ef4444" },
  ];

  const inputStyle: React.CSSProperties = {
    border: "1px solid rgba(17,17,17,0.08)", borderRadius: "10px",
    padding: "8px 12px", fontSize: "14px", outline: "none",
    background: "rgba(255,255,255,0.9)", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      {/* Left: visual breakdown */}
      <div>
        <div style={panelLabel}>{ko ? "월간 비용 구조" : "Monthly Cost Structure"}</div>

        {/* donut-style horizontal bars */}
        {total > 0 ? (
          <>
            {/* stacked bar */}
            <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", marginTop: "12px" }}>
              {items.filter(it => it.value > 0).map((it) => (
                <div key={it.label} style={{
                  width: `${(it.value / total) * 100}%`,
                  background: it.color,
                  transition: "width 0.4s ease",
                }} />
              ))}
            </div>

            {/* legend */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", marginTop: "16px" }}>
              {items.filter(it => it.value > 0).map((it) => (
                <div key={it.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: it.color }} />
                    <span style={{ fontSize: "13px", color: "#86868b" }}>{it.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{fmt(it.value)}</span>
                    <span style={{ fontSize: "11px", color: "#86868b" }}>{total > 0 ? `${((it.value / total) * 100).toFixed(0)}%` : ""}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "16px", padding: "12px 14px", background: "rgba(0,0,0,0.03)", borderRadius: "12px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{ko ? "총 비용" : "Total"}</span>
              <span style={{ fontSize: "15px", fontWeight: 720, fontVariantNumeric: "tabular-nums" }}>{fmt(total)}</span>
            </div>
          </>
        ) : (
          <div style={{ padding: "24px 0", textAlign: "center" as const, color: "#86868b", fontSize: "13px" }}>
            {ko ? "비용 데이터를 입력해주세요" : "Enter cost data"}
          </div>
        )}
      </div>

      {/* Right: input form */}
      <div>
        <div style={panelLabel}>{ko ? "비용 수정" : "Edit Costs"}</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", marginTop: "12px" }}>
          {[
            { label: getLabel("ingredients"), state: d.costCogsText ?? d.costIngredientsText ?? "", setter: d.setCostCogsText ?? d.setCostIngredientsText },
            { label: getLabel("labor"), state: d.costLaborText, setter: d.setCostLaborText },
            { label: getLabel("rent"), state: d.costRentText, setter: d.setCostRentText },
            { label: getLabel("utilities"), state: d.costUtilitiesText, setter: d.setCostUtilitiesText },
            { label: getLabel("sga"), state: d.costSgaText ?? "", setter: d.setCostSgaText },
            { label: getLabel("marketing"), state: d.costMarketingText ?? "", setter: d.setCostMarketingText },
            { label: getLabel("other"), state: d.costOtherText, setter: d.setCostOtherText },
            { label: getLabel("interest"), state: d.costInterestText ?? "", setter: d.setCostInterestText },
          ].map((field) => (
            <div key={field.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#86868b", width: "56px", flexShrink: 0 }}>{field.label}</span>
              <input
                type="text"
                inputMode="numeric"
                value={field.state}
                onChange={(e) => field.setter(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={ko ? "만원" : "만원"}
                style={inputStyle}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={d.handleSaveMonthlyCosts}
            style={{
              marginTop: "8px", borderRadius: "10px", border: "none",
              background: "#1d3557", color: "#fff",
              padding: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}
          >
            {ko ? "저장" : "Save"}
          </button>
        </div>
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
      {/* summary row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div style={miniCard}>
          <div style={{ fontSize: "10px", color: "#86868b", textTransform: "uppercase" as const }}>{ko ? "재고 가치" : "Stock Value"}</div>
          <div style={{ fontSize: "18px", fontWeight: 720, fontVariantNumeric: "tabular-nums", marginTop: "4px" }}>{fmt(totalValue)}</div>
        </div>
        <div style={miniCard}>
          <div style={{ fontSize: "10px", color: "#86868b", textTransform: "uppercase" as const }}>{ko ? "품목 수" : "Items"}</div>
          <div style={{ fontSize: "18px", fontWeight: 720, marginTop: "4px" }}>{items.length}</div>
        </div>
        {urgentCount > 0 && (
          <div style={{ ...miniCard, background: "rgba(255,59,48,0.05)", border: "1px solid rgba(255,59,48,0.1)" }}>
            <div style={{ fontSize: "10px", color: "#ff3b30", textTransform: "uppercase" as const }}>{ko ? "발주 필요" : "Order Now"}</div>
            <div style={{ fontSize: "18px", fontWeight: 720, color: "#ff3b30", marginTop: "4px" }}>{urgentCount}</div>
          </div>
        )}
      </div>

      {/* items list */}
      {items.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
          {items.slice(0, 10).map((it) => (
            <div key={it.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{it.name}</span>
                <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.05)", color: "#86868b" }}>{it.category}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>{it.quantity} {it.unit}</span>
                {(it.status === "urgent" || it.status === "warning") && (
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(255,59,48,0.08)", color: "#ff3b30" }}>
                    {ko ? "발주" : "Order"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "24px 0", textAlign: "center" as const, color: "#86868b", fontSize: "13px" }}>
          {ko ? "재고 품목을 추가하세요" : "Add inventory items"}
        </div>
      )}
    </div>
  );
}

function StaffPanel({ d, ko }: { d: DashboardHook; ko: boolean }) {
  type Emp = { id: string; name: string; role?: string; monthlyWage?: number; hoursPerWeek?: number };
  const employees = d.employees as unknown as Emp[];
  const totalLabor = employees.reduce((s, e) => s + (e.monthlyWage || 0), 0);
  const fmtWon = (n: number) => n >= 10000 ? `${Math.round(n / 10000)}만원` : `${n.toLocaleString()}원`;

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div style={miniCard}>
          <div style={{ fontSize: "10px", color: "#86868b", textTransform: "uppercase" as const }}>{ko ? "직원 수" : "Staff"}</div>
          <div style={{ fontSize: "18px", fontWeight: 720, marginTop: "4px" }}>{employees.length}{ko ? "명" : ""}</div>
        </div>
        <div style={miniCard}>
          <div style={{ fontSize: "10px", color: "#86868b", textTransform: "uppercase" as const }}>{ko ? "월 인건비" : "Monthly Labor"}</div>
          <div style={{ fontSize: "18px", fontWeight: 720, fontVariantNumeric: "tabular-nums", marginTop: "4px" }}>{fmtWon(totalLabor)}</div>
        </div>
      </div>

      {employees.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
          {employees.map((emp) => (
            <div key={emp.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)",
            }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{emp.name}</span>
                <span style={{ fontSize: "11px", color: "#86868b", marginLeft: "8px" }}>{emp.role}</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtWon(emp.monthlyWage || 0)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "24px 0", textAlign: "center" as const, color: "#86868b", fontSize: "13px" }}>
          {ko ? "직원 정보를 추가하세요" : "Add staff information"}
        </div>
      )}
    </div>
  );
}

function DeliveryPanel({ d, ko }: { d: DashboardHook; ko: boolean }) {
  type Dlv = { id: string; name: string; commissionRate?: number; adFee?: number };
  const platforms = d.deliveryPlatforms as unknown as Dlv[];

  return (
    <div>
      {platforms.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
          {platforms.map((p) => (
            <div key={p.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.02)",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>{p.name}</span>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: "#86868b" }}>{ko ? "수수료" : "Fee"} {p.commissionRate}%</span>
                {(p.adFee ?? 0) > 0 && <span style={{ fontSize: "12px", color: "#86868b" }}>{ko ? "광고" : "Ad"} {(p.adFee ?? 0).toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "24px 0", textAlign: "center" as const, color: "#86868b", fontSize: "13px" }}>
          {ko ? "배달 플랫폼 정보를 추가하세요" : "Add delivery platforms"}
        </div>
      )}
    </div>
  );
}

function ProductsPanel({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  type Prod = { id: string; name: string; price: number; cost: number; category?: string };
  const products = d.products as unknown as Prod[];

  return (
    <div>
      {products.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {products.map((p) => {
            const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100) : 0;
            return (
              <div key={p.id} style={{
                padding: "12px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.02)",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{p.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#86868b" }}>{fmt(p.price)}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: margin >= 60 ? "#34c759" : margin >= 40 ? "#ff9f0a" : "#ff3b30" }}>
                    {ko ? "마진" : "Margin"} {margin.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: "24px 0", textAlign: "center" as const, color: "#86868b", fontSize: "13px" }}>
          {ko ? "메뉴/상품을 추가하세요" : "Add products or menu items"}
        </div>
      )}
    </div>
  );
}

function MembersPanel({ d, ko }: { d: DashboardHook; ko: boolean }) {
  type Mem = { name: string; plan?: string; fee?: string; end?: string };
  const members = d.members as unknown as Mem[];

  return (
    <div>
      {members.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
          {members.map((m, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.02)",
            }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{m.name}</span>
                <span style={{ fontSize: "11px", color: "#86868b", marginLeft: "8px" }}>{m.plan}</span>
              </div>
              <span style={{ fontSize: "12px", color: "#86868b" }}>{m.end}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "24px 0", textAlign: "center" as const, color: "#86868b", fontSize: "13px" }}>
          {ko ? "회원 정보를 추가하세요" : "Add members"}
        </div>
      )}
    </div>
  );
}

function TaxPanel({ d, ko }: { d: DashboardHook; ko: boolean }) {
  const ts = d.taxSettings as { vatType?: string; hasEmployees?: boolean } | null;
  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div style={miniCard}>
          <div style={{ fontSize: "10px", color: "#86868b", textTransform: "uppercase" as const }}>{ko ? "과세 유형" : "VAT Type"}</div>
          <div style={{ fontSize: "14px", fontWeight: 650, marginTop: "4px" }}>
            {ts?.vatType === "simplified" ? (ko ? "간이과세" : "Simplified") : (ko ? "일반과세" : "General")}
          </div>
        </div>
        <div style={miniCard}>
          <div style={{ fontSize: "10px", color: "#86868b", textTransform: "uppercase" as const }}>{ko ? "직원 유무" : "Employees"}</div>
          <div style={{ fontSize: "14px", fontWeight: 650, marginTop: "4px" }}>
            {ts?.hasEmployees ? (ko ? "있음" : "Yes") : (ko ? "없음" : "No")}
          </div>
        </div>
        <div style={miniCard}>
          <div style={{ fontSize: "10px", color: "#86868b", textTransform: "uppercase" as const }}>{ko ? "세무 처리" : "Tax Filing"}</div>
          <div style={{ fontSize: "14px", fontWeight: 650, marginTop: "4px" }}>
            {d.cpaDecision === "cpa" ? (ko ? "세무사" : "CPA") : d.cpaDecision === "self" ? (ko ? "직접 신고" : "Self") : "—"}
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 0", textAlign: "center" as const, color: "#86868b", fontSize: "13px" }}>
        {ko ? "세금 캘린더는 하단에서 확인하세요" : "See tax calendar below"}
      </div>
    </div>
  );
}

/* ─── Styles ─── */

const container: React.CSSProperties = {
  borderRadius: "24px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
  border: "1px solid rgba(17,17,17,0.06)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 24px rgba(17,17,17,0.035)",
  overflow: "hidden",
};

const tabBar: React.CSSProperties = {
  display: "flex",
  gap: "4px",
  padding: "16px 20px 0",
  overflowX: "auto",
  borderBottom: "1px solid rgba(17,17,17,0.05)",
};

const tabButton: React.CSSProperties = {
  flexShrink: 0,
  fontSize: "13px",
  fontWeight: 600,
  border: "none",
  borderRadius: "10px 10px 0 0",
  padding: "10px 18px",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
};

const tabActive: React.CSSProperties = {
  background: "rgba(0,122,255,0.08)",
  color: "#007aff",
};

const tabInactive: React.CSSProperties = {
  background: "transparent",
  color: "#86868b",
};

const tabContent: React.CSSProperties = {
  padding: "24px 20px",
};

const panelLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#86868b",
};

const miniCard: React.CSSProperties = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(0,0,0,0.03)",
};
