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

  // iOS 시스템 팔레트 (8색) — 앱 전역과 일관
  const items = [
    { label: getLabel("ingredients"), value: mc.ingredients, color: "#ff9500" },   // iOS orange
    { label: getLabel("labor"),       value: mc.labor,       color: "#007aff" },   // iOS blue (primary)
    { label: getLabel("rent"),        value: mc.rent,        color: "#5856d6" },   // iOS indigo
    { label: getLabel("utilities"),   value: mc.utilities,   color: "#34c759" },   // iOS green
    { label: getLabel("sga"),         value: mc.sga ?? 0,    color: "#ff9f0a" },   // iOS amber
    { label: getLabel("marketing"),   value: mc.marketing ?? 0, color: "#af52de" },// iOS purple
    { label: getLabel("other"),       value: mc.other,       color: "#86868b" },   // iOS gray
    { label: getLabel("interest"),    value: (mc as Record<string, number>).interest ?? 0, color: "#ff3b30" }, // iOS red
  ];

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--border)", borderRadius: "10px",
    padding: "9px 12px", fontSize: "13.5px", outline: "none",
    background: "var(--surface-strong)", width: "100%", boxSizing: "border-box",
    fontVariantNumeric: "tabular-nums",
    transition: "border-color 0.15s ease",
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
              marginTop: "10px", borderRadius: "10px", border: "none",
              background: "#007aff", color: "#fff",
              padding: "11px", fontSize: "13.5px", fontWeight: 650,
              letterSpacing: "-0.005em", cursor: "pointer",
              transition: "background 0.15s ease",
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
                    background: "rgba(255,59,48,0.08)", color: "#ff3b30",
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
            const marginColor = margin >= 60 ? "#34c759" : margin >= 40 ? "#ff9f0a" : "#ff3b30";
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
  return (
    <div>
      <SummaryRow items={[
        {
          label: ko ? "과세 유형" : "VAT type",
          value: ts?.vatType === "simplified" ? (ko ? "간이" : "Simplified") : (ko ? "일반" : "General"),
        },
        {
          label: ko ? "직원 유무" : "Employees",
          value: ts?.hasEmployees ? (ko ? "있음" : "Yes") : (ko ? "없음" : "No"),
        },
        {
          label: ko ? "세무 처리" : "Tax filing",
          value: d.cpaDecision === "cpa" ? (ko ? "세무사" : "CPA") : d.cpaDecision === "self" ? (ko ? "직접" : "Self") : "—",
        },
      ]} />
      <div style={{
        padding: "18px 20px", borderRadius: "12px",
        background: "var(--surface)", border: "1px solid var(--border)",
        textAlign: "center" as const, color: "var(--muted)",
        fontSize: "13px", lineHeight: 1.5,
      }}>
        {ko ? "세금 캘린더는 하단에서 확인하세요" : "See tax calendar below"}
      </div>
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
        const accent = it.tone === "alert" ? "#ff3b30" : it.tone === "warn" ? "#ff9f0a" : "var(--text)";
        const border = it.tone === "alert"
          ? "1px solid rgba(255,59,48,0.18)"
          : it.tone === "warn"
            ? "1px solid rgba(255,159,10,0.2)"
            : "1px solid var(--border)";
        const bg = it.tone === "alert"
          ? "rgba(255,59,48,0.04)"
          : it.tone === "warn"
            ? "rgba(255,159,10,0.04)"
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

/* ─── Styles ─── */

const container: React.CSSProperties = {
  borderRadius: "20px",
  background: "var(--surface-strong)",
  border: "1px solid var(--border)",
  boxShadow: "0 1px 2px rgba(17,17,17,0.02), 0 8px 24px rgba(17,17,17,0.03)",
  overflow: "hidden",
};

// Pill-style tab bar — Apple/Linear 현대 톤
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
  fontWeight: 600,
  letterSpacing: "-0.005em",
  border: "none",
  borderRadius: "999px",
  padding: "8px 16px",
  cursor: "pointer",
  transition: "background 0.18s ease, color 0.18s ease",
};

const tabActive: React.CSSProperties = {
  background: "#007aff",
  color: "#fff",
};

const tabInactive: React.CSSProperties = {
  background: "transparent",
  color: "var(--muted)",
};

const tabContent: React.CSSProperties = {
  padding: "20px 20px 24px",
  borderTop: "1px solid var(--border)",
  marginTop: "14px",
};

const panelLabel: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

const miniCard: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "14px 16px",
  borderRadius: "14px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
};
