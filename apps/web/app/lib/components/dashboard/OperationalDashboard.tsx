"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, TrendingUp, Gem, Check, Lightbulb } from "lucide-react";
import type { DashboardHook } from "../../useDashboard";
import { DetailTabs } from "./DetailTabs";
import { PLHeroCard } from "./PLHeroCard";
import { RevenueCalendar } from "./RevenueCalendar";
import { WeeklyReport } from "./WeeklyReport";
import { NotificationCenter } from "./NotificationCenter";
import { MilestoneToast, checkMilestones } from "./MilestoneToast";
import { ForecastCard } from "./ForecastCard";
import { FirstCustomersCard } from "./FirstCustomersCard";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { ExportPanel } from "./ExportPanel";
import { CashflowHeroCard } from "./CashflowHeroCard";
import { WeeklyTimeReport } from "./WeeklyTimeReport";
import { SocialBenchmarkCard } from "./SocialBenchmarkCard";
import { ProgressMilestonesCard } from "./ProgressMilestonesCard";
import { DailyImprovementCard } from "./DailyImprovementCard";
import { RitualBanner } from "./RitualBanner";
import { calculateHealthMetrics, buildTaxCalendar } from "@build-up/shared";
import type { MonthlyCosts } from "@build-up/shared";
import { AlertStripBanner } from "./AlertStripBanner";
import { DeepDiveSection } from "./DeepDiveSection";
import { MorningBriefing } from "./MorningBriefing";
import { SalesBreakdownCard } from "./SalesBreakdownCard";
import { MonthlyProgressCard } from "./MonthlyProgressCard";
import { CostStructureCard } from "./CostStructureCard";
import { BenchmarkCard } from "./BenchmarkCard";
import { ActivitySnapshotCard } from "./ActivitySnapshotCard";
import { SurvivalBoardCard } from "./SurvivalBoardCard";
import { StartupMetricsCard } from "./StartupMetricsCard";
import { InventoryOpsCard } from "./InventoryOpsCard";
import { StaffOpsCard } from "./StaffOpsCard";
import type { SubscriptionPlan, Subscriber } from "../../stores/operations-store";
import {
  shell,
  bentoHoverCSS,
  heroPanel,
  heroHeader,
  heroEyebrow,
  heroTitle,
  heroBody,
  heroActions,
  primaryAction,
  secondaryAction,
  headlineGrid,
  headlineCard,
  headlineLabel,
  headlineValue,
  headlineNote,
  survivalGrid,
  coreGrid,
  opsCard,
  opsHeader,
  sectionEyebrow,
  emptyState,
  detailSection,
  detailSectionHeader,
  detailSectionTitle,
} from "./operationalStyles";

type Props = { d: DashboardHook };

type DailyEntry = { date: string; sales: number; customers: number };
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
type EmployeeEntry = {
  id: string;
  name: string;
  hourlyWage?: number;
  weeklyHours?: number;
  isInsured?: boolean;
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

// ─── 고객/회원 관리 요약 (비스타트업) ────────────────────────────────────────

function CustomerSummaryCard({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  const mode = d.businessCtx.customerMode;
  const label = d.businessCtx.customerLabel;
  const members = (d.members ?? []) as Array<{ id: string; name: string; plan: string; fee: number; startDate: string; endDate: string }>;

  // 업종별 표시 정보
  const title = ko ? label.ko : label.en;

  const activeMembers = members.filter((m) => {
    if (!m.endDate) return true;
    return new Date(m.endDate) >= new Date();
  });

  const expiringMembers = members.filter((m) => {
    if (!m.endDate) return false;
    const diff = new Date(m.endDate).getTime() - Date.now();
    return diff > 0 && diff < 7 * 86400000;
  });

  const totalRevenue = activeMembers.reduce((s, m) => s + (m.fee ?? 0), 0);

  // 업종별 stat 구성
  const stats: Array<{ value: string | number; label: string; alert?: boolean }> = (() => {
    switch (mode) {
      case "membership":
        return [
          { value: activeMembers.length, label: ko ? "활성 회원" : "Active" },
          { value: expiringMembers.length, label: ko ? "만료 임박" : "Expiring", alert: expiringMembers.length > 0 },
          { value: totalRevenue > 0 ? fmt(totalRevenue) : "—", label: ko ? "월 매출" : "MRR" },
        ];
      case "appointment":
        return [
          { value: members.length, label: ko ? "고객 수" : "Clients" },
          { value: activeMembers.length, label: ko ? "단골" : "Regulars" },
          { value: "—", label: ko ? "이번 주 예약" : "Bookings" },
        ];
      case "repeat":
        return [
          { value: members.length, label: ko ? "등록 고객" : "Registered" },
          { value: activeMembers.length, label: ko ? "활성" : "Active" },
          { value: "—", label: ko ? "재방문율" : "Return %" },
        ];
      case "ecommerce":
        return [
          { value: members.length, label: ko ? "구매자" : "Buyers" },
          { value: "—", label: ko ? "재구매" : "Repeat" },
          { value: "—", label: ko ? "평균 객단가" : "AOV" },
        ];
      default:
        return [
          { value: members.length, label: ko ? "고객 수" : "Customers" },
          { value: activeMembers.length, label: ko ? "활성" : "Active" },
          { value: "—", label: ko ? "월 매출" : "Revenue" },
        ];
    }
  })();

  const emptyMsg: Record<string, { ko: string; en: string }> = {
    membership: { ko: "🏋️ 회원을 등록하면 만료·갱신 현황을 추적할 수 있어요", en: "🏋️ Add members to track expiry & renewal" },
    appointment: { ko: "✂️ 고객을 등록하면 예약·시술 이력을 관리할 수 있어요", en: "✂️ Add clients to track visits & services" },
    repeat: { ko: "☕ 단골을 등록하면 재방문 패턴을 볼 수 있어요", en: "☕ Add regulars to see return patterns" },
    ecommerce: { ko: "📦 구매자를 등록하면 재구매율을 추적할 수 있어요", en: "📦 Add buyers to track repeat purchases" },
    pipeline: { ko: "🚀 리드를 등록하면 파이프라인을 추적할 수 있어요", en: "🚀 Add leads to track your pipeline" },
  };

  const emptyText = emptyMsg[mode] ?? emptyMsg.repeat;

  return (
    <article style={{ borderRadius: "20px", border: "1px solid rgba(0,0,0,0.06)", background: "#fff", padding: "18px 22px", display: "grid", gap: "10px" }} className="bento-card bento-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</span>
          <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(29,53,87,0.06)", color: "var(--primary)" }}>
            {members.length}{mode === "membership" ? (ko ? "명" : "") : (ko ? "명" : "")}
          </span>
        </div>
        <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>
          {ko ? "관리하기 →" : "Manage →"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ padding: "10px", borderRadius: "10px", background: s.alert ? "rgba(255,59,48,0.04)" : "rgba(0,0,0,0.02)", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: s.alert ? "#ff3b30" : "#0f172a" }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {members.length === 0 && (
        <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{
          width: "100%", padding: "12px", borderRadius: "10px",
          border: "1px dashed rgba(0,0,0,0.1)", background: "transparent",
          cursor: "pointer", fontSize: "13px", color: "var(--muted)", fontWeight: 500,
        }}>
          {ko ? emptyText.ko : emptyText.en}
        </button>
      )}
    </article>
  );
}

// ─── 구독 고객 관리 (스타트업) ──────────────────────────────────────────────

const PLAN_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: "rgba(124,58,237,0.08)", text: "#7c3aed", border: "rgba(124,58,237,0.15)" },
  1: { bg: "rgba(37,99,235,0.08)", text: "#2563eb", border: "rgba(37,99,235,0.15)" },
  2: { bg: "rgba(5,150,105,0.08)", text: "#059669", border: "rgba(5,150,105,0.15)" },
  3: { bg: "rgba(234,88,12,0.08)", text: "#ea580c", border: "rgba(234,88,12,0.15)" },
  4: { bg: "rgba(220,38,38,0.08)", text: "#dc2626", border: "rgba(220,38,38,0.15)" },
};

function getPlanColor(index: number) {
  return PLAN_COLORS[index % 5] ?? PLAN_COLORS[0];
}

function SubscriptionPlanManager({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
  const plans = (d.subscriptionPlans ?? []) as SubscriptionPlan[];
  const subs = (d.subscribers ?? []) as Subscriber[];
  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trial");
  const [tab, setTab] = useState<"customers" | "plans">("customers");

  // ── Plan CRUD ──
  const handleAddPlan = () => {
    const name = d.subPlanName?.trim();
    const price = parseInt(String(d.subPlanPrice ?? "").replace(/[^0-9]/g, ""), 10);
    if (!name || !price || isNaN(price)) return;
    const newPlan: SubscriptionPlan = {
      id: `plan-${Date.now()}`, name, price,
      billingCycle: (d.subPlanCycle as "monthly" | "annual") ?? "monthly",
      isActive: true,
    };
    d.setSubscriptionPlans([...plans, newPlan]);
    d.setSubPlanName(""); d.setSubPlanPrice(""); d.setSubPlanFormOpen(false);
  };

  const handleDeletePlan = (id: string) => {
    d.setSubscriptionPlans(plans.filter((p) => p.id !== id));
  };

  // ── Subscriber CRUD ──
  const handleAddSubscriber = () => {
    const name = d.subCustomerName?.trim();
    const planId = d.subCustomerPlanId;
    if (!name || !planId) return;
    const newSub: Subscriber = {
      id: `sub-${Date.now()}`, name,
      email: d.subCustomerEmail?.trim() || undefined,
      planId, status: "active",
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    d.setSubscribers([...subs, newSub]);
    d.setSubCustomerName(""); d.setSubCustomerEmail(""); d.setSubCustomerFormOpen(false);
  };

  const handleChurn = (id: string) => {
    d.setSubscribers(subs.map((s) =>
      s.id === id ? { ...s, status: "churned" as const, churnedAt: new Date().toISOString().slice(0, 10) } : s,
    ));
  };

  const handleReactivate = (id: string) => {
    d.setSubscribers(subs.map((s) =>
      s.id === id ? { ...s, status: "active" as const, churnedAt: undefined } : s,
    ));
  };

  const handleDeleteSub = (id: string) => {
    d.setSubscribers(subs.filter((s) => s.id !== id));
  };

  const getPlan = (planId: string) => plans.find((p) => p.id === planId);
  const getPlanIndex = (planId: string) => plans.findIndex((p) => p.id === planId);
  const activePlans = plans.filter((p) => p.isActive);

  // MRR from active subscribers
  const currentMrr = activeSubs.reduce((sum, s) => {
    const p = getPlan(s.planId);
    if (!p) return sum;
    return sum + (p.billingCycle === "annual" ? Math.round(p.price / 12) : p.price);
  }, 0);

  return (
    <article style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "#fff", padding: "18px 22px", display: "grid", gap: "10px" }} className="bento-card bento-fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em" }}>{ko ? "구독 관리" : "Subscriptions"}</span>
          <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(124,58,237,0.06)", color: "#7c3aed" }}>
            {activeSubs.length}{ko ? "명" : ""}
          </span>
          {currentMrr > 0 && (
            <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(5,150,105,0.06)", color: "#059669" }}>
              MRR {fmt(currentMrr)}
            </span>
          )}
        </div>
        <button type="button" onClick={() => d.setUsesSubscriptions(false)} style={{
          fontSize: "11px", fontWeight: 600, color: "rgba(15,23,42,0.35)", background: "none", border: "none", cursor: "pointer",
        }}>
          {ko ? "비활성화" : "Disable"}
        </button>
      </div>

      {/* Tab toggle */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(15,23,42,0.03)", borderRadius: "10px", padding: "3px" }}>
        {(["customers", "plans"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            flex: 1, padding: "7px 0", borderRadius: "8px", border: "none", cursor: "pointer",
            fontSize: "12px", fontWeight: 650,
            background: tab === t ? "#fff" : "transparent",
            color: tab === t ? "#0f172a" : "rgba(15,23,42,0.4)",
            boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.15s ease",
          }}>
            {t === "customers" ? (ko ? `고객 ${activeSubs.length}` : `Customers ${activeSubs.length}`) : (ko ? `플랜 ${plans.length}` : `Plans ${plans.length}`)}
          </button>
        ))}
      </div>

      {/* ── Customers tab ── */}
      {tab === "customers" && (
        <>
          {/* Plan summary chips */}
          {activePlans.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {activePlans.map((plan, i) => {
                const count = activeSubs.filter((s) => s.planId === plan.id).length;
                const c = getPlanColor(i);
                return (
                  <span key={plan.id} style={{
                    fontSize: "11px", fontWeight: 650, padding: "3px 10px", borderRadius: "7px",
                    background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                  }}>
                    {plan.name} {count}
                  </span>
                );
              })}
            </div>
          )}

          {/* Subscriber list */}
          {activeSubs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "240px", overflowY: "auto" }}>
              {[...subs].sort((a, b) => {
                if (a.status === "active" && b.status !== "active") return -1;
                if (a.status !== "active" && b.status === "active") return 1;
                return b.joinedAt.localeCompare(a.joinedAt);
              }).filter((s) => s.status !== "churned").map((sub) => {
                const plan = getPlan(sub.planId);
                const planIdx = getPlanIndex(sub.planId);
                const c = getPlanColor(planIdx);
                return (
                  <div key={sub.id} style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
                    borderRadius: "10px", background: "rgba(15,23,42,0.015)",
                    border: "1px solid rgba(15,23,42,0.04)",
                  }}>
                    {/* Avatar initial */}
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "8px",
                      background: c.bg, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700, color: c.text, flexShrink: 0,
                    }}>
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.name}</span>
                        {/* Plan badge */}
                        {plan && (
                          <span style={{
                            fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: "5px",
                            background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
                            letterSpacing: "0.02em", flexShrink: 0,
                          }}>
                            {plan.name}
                          </span>
                        )}
                        {sub.status === "trial" && (
                          <span style={{ fontSize: "10px", fontWeight: 650, color: "#f59e0b", background: "rgba(245,158,11,0.08)", padding: "1px 6px", borderRadius: "5px" }}>Trial</span>
                        )}
                      </div>
                      {sub.email && (
                        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.email}</div>
                      )}
                    </div>
                    {/* Churn button */}
                    <button type="button" onClick={() => handleChurn(sub.id)} title={ko ? "이탈 처리" : "Mark churned"} style={{
                      width: "24px", height: "24px", borderRadius: "6px", border: "none",
                      background: "rgba(15,23,42,0.04)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 2l6 6M8 2l-6 6" stroke="rgba(15,23,42,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : plans.length > 0 ? (
            <button type="button" onClick={() => d.setSubCustomerFormOpen(true)} style={{
              width: "100%", padding: "14px", borderRadius: "12px",
              border: "1px dashed rgba(124,58,237,0.15)", background: "transparent",
              cursor: "pointer", fontSize: "13px", color: "rgba(15,23,42,0.4)", fontWeight: 500,
            }}>
              {ko ? "첫 번째 고객을 등록하세요" : "Register your first customer"}
            </button>
          ) : (
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(124,58,237,0.02)", fontSize: "12px", color: "rgba(15,23,42,0.4)", lineHeight: 1.5 }}>
              {ko ? "먼저 [플랜] 탭에서 구독 플랜을 등록하세요" : "First register plans in the [Plans] tab"}
            </div>
          )}

          {/* Add customer form */}
          {plans.length > 0 && (
            <div style={{ display: "flex", gap: "6px" }}>
              {!d.subCustomerFormOpen ? (
                <button type="button" onClick={() => d.setSubCustomerFormOpen(true)} style={{
                  width: "100%", padding: "10px", borderRadius: "10px",
                  border: "1px solid rgba(124,58,237,0.1)", background: "rgba(124,58,237,0.02)",
                  cursor: "pointer", fontSize: "12px", fontWeight: 650, color: "#7c3aed",
                }}>
                  + {ko ? "고객 추가" : "Add Customer"}
                </button>
              ) : (
                <div style={{
                  width: "100%", padding: "12px", borderRadius: "12px",
                  background: "rgba(124,58,237,0.02)", border: "1px solid rgba(124,58,237,0.08)",
                  display: "flex", flexDirection: "column", gap: "6px",
                }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input type="text" placeholder={ko ? "이름" : "Name"}
                      value={d.subCustomerName ?? ""} onChange={(e) => d.setSubCustomerName(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none" }}
                    />
                    <input type="email" placeholder={ko ? "이메일 (선택)" : "Email (opt)"}
                      value={d.subCustomerEmail ?? ""} onChange={(e) => d.setSubCustomerEmail(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select value={d.subCustomerPlanId ?? ""} onChange={(e) => d.setSubCustomerPlanId(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}>
                      <option value="">{ko ? "플랜 선택" : "Select plan"}</option>
                      {activePlans.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}/{p.billingCycle === "monthly" ? (ko ? "월" : "mo") : (ko ? "연" : "yr")}</option>
                      ))}
                    </select>
                    <button type="button" onClick={handleAddSubscriber}
                      disabled={!(d.subCustomerName ?? "").trim() || !(d.subCustomerPlanId)}
                      style={{
                        padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                        background: (d.subCustomerName ?? "").trim() && d.subCustomerPlanId ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" : "rgba(15,23,42,0.06)",
                        color: (d.subCustomerName ?? "").trim() && d.subCustomerPlanId ? "#fff" : "rgba(15,23,42,0.3)",
                        fontSize: "13px", fontWeight: 650, whiteSpace: "nowrap",
                      }}>
                      {ko ? "추가" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Churned list (collapsed) */}
          {subs.filter((s) => s.status === "churned").length > 0 && (
            <details style={{ marginTop: "2px" }}>
              <summary style={{ fontSize: "11px", fontWeight: 600, color: "rgba(15,23,42,0.35)", cursor: "pointer", userSelect: "none" }}>
                {ko ? "이탈 고객" : "Churned"} ({subs.filter((s) => s.status === "churned").length})
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "6px" }}>
                {subs.filter((s) => s.status === "churned").map((sub) => (
                  <div key={sub.id} style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px",
                    borderRadius: "8px", background: "rgba(15,23,42,0.015)", opacity: 0.6,
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", flex: 1 }}>{sub.name}</span>
                    <button type="button" onClick={() => handleReactivate(sub.id)} style={{ fontSize: "10px", fontWeight: 650, padding: "2px 8px", borderRadius: "5px", border: "none", cursor: "pointer", background: "rgba(5,150,105,0.08)", color: "#059669" }}>
                      {ko ? "복구" : "Reactivate"}
                    </button>
                    <button type="button" onClick={() => handleDeleteSub(sub.id)} style={{ fontSize: "10px", fontWeight: 650, padding: "2px 8px", borderRadius: "5px", border: "none", cursor: "pointer", background: "rgba(220,38,38,0.06)", color: "#dc2626" }}>
                      {ko ? "삭제" : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* ── Plans tab ── */}
      {tab === "plans" && (
        <>
          {plans.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {plans.map((plan, i) => {
                const c = getPlanColor(i);
                const subCount = subs.filter((s) => s.planId === plan.id && s.status !== "churned").length;
                return (
                  <div key={plan.id} style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                    borderRadius: "12px", background: plan.isActive ? c.bg : "rgba(15,23,42,0.02)",
                    border: `1px solid ${plan.isActive ? c.border : "rgba(15,23,42,0.04)"}`,
                    opacity: plan.isActive ? 1 : 0.5, transition: "all 0.15s ease",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a" }}>{plan.name}</span>
                        {subCount > 0 && (
                          <span style={{ fontSize: "10px", fontWeight: 700, color: c.text }}>{subCount}{ko ? "명" : ""}</span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)" }}>
                        {fmt(plan.price)}/{plan.billingCycle === "monthly" ? (ko ? "월" : "mo") : (ko ? "연" : "yr")}
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeletePlan(plan.id)} style={{
                      width: "24px", height: "24px", borderRadius: "6px", border: "none",
                      background: "rgba(15,23,42,0.04)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 2l6 6M8 2l-6 6" stroke="rgba(15,23,42,0.3)" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add plan form */}
          {!d.subPlanFormOpen ? (
            <button type="button" onClick={() => d.setSubPlanFormOpen(true)} style={{
              width: "100%", padding: "10px", borderRadius: "10px",
              border: "1px solid rgba(124,58,237,0.1)", background: "rgba(124,58,237,0.02)",
              cursor: "pointer", fontSize: "12px", fontWeight: 650, color: "#7c3aed",
            }}>
              + {ko ? "플랜 추가" : "Add Plan"}
            </button>
          ) : (
            <div style={{
              padding: "12px", borderRadius: "12px",
              background: "rgba(124,58,237,0.02)", border: "1px solid rgba(124,58,237,0.08)",
              display: "flex", flexDirection: "column", gap: "6px",
            }}>
              <input type="text" placeholder={ko ? "플랜 이름 (예: Pro)" : "Plan name (e.g. Pro)"}
                value={d.subPlanName ?? ""} onChange={(e) => d.setSubPlanName(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none" }}
              />
              <div style={{ display: "flex", gap: "6px" }}>
                <input type="text" inputMode="numeric" placeholder={ko ? "월 가격 (원)" : "Price (KRW)"}
                  value={d.subPlanPrice ?? ""} onChange={(e) => d.setSubPlanPrice(e.target.value)}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none" }}
                />
                <select value={(d.subPlanCycle as string) ?? "monthly"} onChange={(e) => d.setSubPlanCycle(e.target.value as "monthly" | "annual")}
                  style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(15,23,42,0.08)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}>
                  <option value="monthly">{ko ? "월" : "Monthly"}</option>
                  <option value="annual">{ko ? "연" : "Annual"}</option>
                </select>
              </div>
              <button type="button" onClick={handleAddPlan}
                disabled={!(d.subPlanName ?? "").trim() || !(d.subPlanPrice ?? "")}
                style={{
                  padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer",
                  background: (d.subPlanName ?? "").trim() && (d.subPlanPrice ?? "") ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" : "rgba(15,23,42,0.06)",
                  color: (d.subPlanName ?? "").trim() && (d.subPlanPrice ?? "") ? "#fff" : "rgba(15,23,42,0.3)",
                  fontSize: "13px", fontWeight: 650,
                }}>
                {ko ? "추가" : "Add"}
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default function OperationalDashboard({ d }: Props) {
  const ko = d.language === "ko";
  const isStaff = d.userRole === "staff";
  const isStartupCompany = d.businessCtx.categoryId === "startup-tech";
  const isOnlineCategory = d.businessCtx.categoryId === "online-digital";
  const usesSubscriptions = !!(d.usesSubscriptions);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dismissedMilestones, setDismissedMilestones] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("dismissedMilestones");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isWide = viewportWidth >= 980;
  const isThreeUp = viewportWidth >= 1220;

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const allEntries = d.dailyEntries as DailyEntry[];
  const monthEntries = allEntries.filter((entry) => entry.date.startsWith(currentMonth));
  const todayEntry = allEntries.find((entry) => entry.date === todayStr);
  const recent7Entries = allEntries.slice(-7);
  const previous7Entries = allEntries.slice(-14, -7);

  const totalSales = monthEntries.reduce((sum, entry) => sum + entry.sales, 0);
  const totalCustomers = monthEntries.reduce((sum, entry) => sum + entry.customers, 0);
  const workingDays = monthEntries.length;
  const avgDailySales = workingDays > 0 ? totalSales / workingDays : 0;
  const recent7Sales = recent7Entries.reduce((sum, entry) => sum + entry.sales, 0);
  const previous7Sales = previous7Entries.reduce((sum, entry) => sum + entry.sales, 0);
  const weeklySalesChange =
    previous7Sales > 0 ? Math.round(((recent7Sales - previous7Sales) / previous7Sales) * 100) : 0;
  const recent7Customers = recent7Entries.reduce((sum, entry) => sum + entry.customers, 0);
  const activeDays7 = recent7Entries.filter((entry) => entry.sales > 0 || entry.customers > 0).length;

  const monthlyCosts = d.monthlyCosts as {
    ingredients: number;
    labor: number;
    rent: number;
    utilities: number;
    sga: number;
    marketing: number;
    other: number;
    interest: number;
  };
  const totalCosts =
    (monthlyCosts.ingredients ?? 0) +
    (monthlyCosts.labor ?? 0) +
    (monthlyCosts.rent ?? 0) +
    (monthlyCosts.utilities ?? 0) +
    (monthlyCosts.sga ?? 0) +
    (monthlyCosts.marketing ?? 0) +
    (monthlyCosts.other ?? 0) +
    (monthlyCosts.interest ?? 0);
  const netProfit = totalSales - totalCosts;
  const projectedSales =
    workingDays > 0
      ? totalSales +
        avgDailySales *
          (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
            new Date().getDate())
      : 0;
  const projectedProfit = projectedSales - totalCosts;
  const ingredientRatio = totalSales > 0 ? (monthlyCosts.ingredients / totalSales) * 100 : 0;
  const laborRatio = totalSales > 0 ? (monthlyCosts.labor / totalSales) * 100 : 0;
  const rentRatio = totalSales > 0 ? (monthlyCosts.rent / totalSales) * 100 : 0;
  const primeCost = ingredientRatio + laborRatio;
  const bepProgress = totalCosts > 0 ? Math.min(100, (totalSales / totalCosts) * 100) : 0;

  // BEP 실시간 추적 (일일 손익분기)
  const healthMetrics = calculateHealthMetrics(
    allEntries as Array<{ date: string; sales: number; customers: number }>,
    monthlyCosts as MonthlyCosts,
  );
  // 세금 캘린더
  const taxCalendar = buildTaxCalendar({
    isSimplified: ((d.taxSettings as { vatType?: string })?.vatType ?? "general") === "simplified",
    hasEmployees: (d.employees as unknown[])?.length > 0,
  });
  const nextTaxItem = taxCalendar.next;

  const breakEvenDailySales = healthMetrics.breakEvenDailySales;
  const daysAboveBreakEven = healthMetrics.daysAboveBreakEven;
  const todaySales = (allEntries.find(e => e.date === todayStr) as { sales: number } | undefined)?.sales ?? 0;
  const todayBepProgress = breakEvenDailySales > 0 ? Math.min(100, Math.round((todaySales / breakEvenDailySales) * 100)) : 0;

  /* previous month data from costHistory */
  const costHistory = d.costHistory as Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }>;
  const prevMonthKey = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const prevSnap = costHistory.find(h => h.month === prevMonthKey);
  const prevMonthCosts = prevSnap ? prevSnap.ingredients + prevSnap.labor + prevSnap.rent + prevSnap.utilities + prevSnap.other : undefined;
  const prevMonthEntries = allEntries.filter(e => e.date.startsWith(prevMonthKey));
  const prevMonthSales = prevMonthEntries.length > 0 ? prevMonthEntries.reduce((s, e) => s + e.sales, 0) : undefined;

  const inventory = d.inventory as InventoryEntry[];
  const lowStockItems = inventory.filter((item) => item.quantity <= (item.minThreshold ?? 0));
  const employees = d.employees as EmployeeEntry[];
  const estimatedMonthlyPayroll = employees.reduce(
    (sum, employee) => sum + (employee.hourlyWage ?? 0) * (employee.weeklyHours ?? 0) * 4.34,
    0
  );
  const insuredEmployees = employees.filter((employee) => employee.isInsured).length;
  const monthlyBurn = Math.max(totalCosts - totalSales, 0);
  const launchDateText =
    typeof window !== "undefined" ? window.localStorage.getItem("businessLaunchedDate") : null;
  const launchDate =
    launchDateText && !Number.isNaN(new Date(launchDateText).getTime())
      ? new Date(launchDateText)
      : null;
  const daysSinceLaunch = launchDate
    ? Math.max(0, Math.round((Date.now() - launchDate.getTime()) / 86400000))
    : 0;
  const totalCapital = (d.selectedBudget ?? 0) + (d.initialOperatingCapital ?? 0);
  const capitalLeft = Math.max(0, totalCapital - totalCosts * (daysSinceLaunch / 30));
  const runwayMonths =
    totalCosts > 0 && netProfit < 0 ? Math.max(0, Math.round(capitalLeft / Math.abs(netProfit))) : -1;
  const healthTone =
    d.businessHealthScore === "healthy"
      ? "#177245"
      : d.businessHealthScore === "danger"
        ? "#b42318"
        : d.businessHealthScore === "caution"
          ? "#b54708"
          : "rgba(15, 23, 42, 0.82)";
  const healthLabel =
    d.businessHealthScore === "healthy"
      ? ko
        ? "안정"
        : "Healthy"
      : d.businessHealthScore === "danger"
        ? ko
          ? "위험"
          : "Critical"
        : d.businessHealthScore === "caution"
          ? ko
            ? "주의"
            : "Caution"
          : ko
            ? "미확인"
            : "Unknown";
  const weeklySignalLabel =
    previous7Sales > 0
      ? `${weeklySalesChange >= 0 ? "+" : ""}${weeklySalesChange}%`
      : ko
        ? "비교 데이터 없음"
        : "No comparison";
  // AI 코치에서 가장 높은 우선순위 액션의 제목을 topRiskLabel로 사용
  const aiTopAction = d.aiActions?.todayActions?.[0];
  const aiCrisis = d.aiActions?.crisisActions?.[0];
  const topRiskLabel =
    aiCrisis
      ? aiCrisis.title
      : aiTopAction?.priority === "high"
        ? aiTopAction.title
        : runwayMonths >= 0 && runwayMonths <= 3
          ? ko
            ? `런웨이 ${runwayMonths}개월`
            : `${runwayMonths} mo runway`
          : lowStockItems.length > 0
            ? ko
              ? `재고 경고 ${lowStockItems.length}건`
              : `${lowStockItems.length} stock alerts`
            : employees.length === 0
              ? ko
                ? "인력 플랜 필요"
                : "Team plan needed"
              : ko
                ? "핵심 리스크 낮음"
                : "Low immediate risk";
  // AI 코치에서 reason/impact를 focusMessage로 사용
  const focusMessage =
    aiCrisis
      ? aiCrisis.impact
      : aiTopAction?.priority === "high"
        ? aiTopAction.reason
        : runwayMonths >= 0 && runwayMonths <= 3
          ? ko
            ? "지금은 성장보다 현금 방어가 우선입니다. 고정비와 저효율 지출부터 줄이세요."
            : "Cash defense comes before growth. Cut fixed and low-efficiency spend first."
          : weeklySalesChange < 0
            ? ko
              ? "전주 대비 하락세입니다. 신규 유입보다 재구매와 전환 병목부터 점검하세요."
              : "Weekly trend is down. Fix retention and conversion before chasing more acquisition."
            : lowStockItems.length > 0
              ? ko
                ? "매출을 만들 수 있어도 재고가 막으면 성장이 멈춥니다. 발주 우선순위를 정하세요."
                : "Stockouts can kill growth. Prioritize reorder decisions now."
              : ko
                ? "오늘은 매출 기록, 병목 점검, 핵심 운영 자산 유지에 집중하면 됩니다."
                : "Today, focus on logging revenue, checking bottlenecks, and protecting core operations.";

  const aiLoadAttemptedRef = useRef(false);
  useEffect(() => {
    if (!d.aiActions && !d.aiActionsLoading && d.businessLaunched && d.storeName && !aiLoadAttemptedRef.current) {
      aiLoadAttemptedRef.current = true;
      void d.fetchAiActions().finally(() => {
        // 5초 후 다시 시도 가능하도록 (무한 루프 방지)
        setTimeout(() => { aiLoadAttemptedRef.current = false; }, 5000);
      });
    }
  }, [d.aiActions, d.aiActionsLoading, d.businessLaunched, d.storeName]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── streak computation ── */
  const streak = (() => {
    let count = 0;
    const checkDate = new Date();
    const todayE = allEntries.find(e => e.date === todayStr);
    if (!todayE) checkDate.setDate(checkDate.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().slice(0, 10);
      if (allEntries.some(e => e.date === ds)) { count++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    }
    return count;
  })();

  /* ── milestone check ── */
  const healthScore = typeof d.businessHealthScore === "string" ? (d.businessHealthScore === "healthy" ? 85 : d.businessHealthScore === "caution" ? 55 : 30) : 0;
  const currentMilestone = checkMilestones({
    streak,
    totalEntries: allEntries.length,
    bepProgress,
    healthScore,
    completedStages: d.completedCount,
    dismissed: dismissedMilestones,
    ko,
  });
  const handleDismissMilestone = () => {
    if (!currentMilestone) return;
    const next = new Set(dismissedMilestones);
    next.add(currentMilestone.id);
    setDismissedMilestones(next);
    try { localStorage.setItem("dismissedMilestones", JSON.stringify([...next])); } catch {}
  };

  // 전월 대비 손익 변화율
  const prevNetProfit = (prevMonthSales !== undefined && prevMonthCosts !== undefined) ? prevMonthSales - prevMonthCosts : undefined;
  const pnlChangePercent = (prevNetProfit !== undefined && prevNetProfit !== 0) ? Math.round(((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100) : undefined;

  const headlineStats = isStaff ? [] : [
    {
      label: isStartupCompany ? (ko ? "월 Burn / 손익" : "Monthly burn / P&L") : ko ? "월 손익" : "Monthly P&L",
      value: totalSales > 0 || totalCosts > 0 ? `${netProfit >= 0 ? "+" : ""}${fmt(netProfit)}` : "—",
      note:
        totalCosts > 0
          ? ko
            ? `월 비용 ${fmt(totalCosts)}`
            : `Costs ${fmt(totalCosts)}`
          : ko
            ? "비용 입력 필요"
            : "Need monthly costs",
      tone: netProfit > 0 ? "#177245" : netProfit < 0 ? "#b42318" : "rgba(15, 23, 42, 0.82)",
      change: pnlChangePercent,
    },
    {
      label: ko ? "현금 런웨이" : "Cash runway",
      value:
        totalCosts > 0
          ? runwayMonths < 0
            ? ko
              ? "흑자"
              : "Positive"
            : `${runwayMonths}${ko ? "개월" : " mo"}`
          : "—",
      note:
        d.selectedBudget
          ? ko
            ? `가용 현금 ${fmt(capitalLeft)}`
            : `Cash left ${fmt(capitalLeft)}`
          : ko
            ? "예산 입력 필요"
            : "Need starting cash",
      tone: runwayMonths >= 0 && runwayMonths <= 3 ? "#b42318" : "rgba(15, 23, 42, 0.82)",
      change: undefined as number | undefined,
    },
    {
      label: isStartupCompany
        ? (ko ? "로드맵 실행" : "Roadmap execution")
        : ko ? (d.businessCtx.inventoryLabel?.ko ?? "현재 재고") : (d.businessCtx.inventoryLabel?.en ?? "Inventory"),
      value: isStartupCompany
        ? `${d.completedCount}/${d.pathTotalStages}`
        : inventory.length > 0
          ? `${inventory.length}${ko ? "개" : ""}`
          : ko
            ? "미등록"
            : "Empty",
      note:
        isStartupCompany
          ? d.nextRoadmapStage
            ? `${d.nextRoadmapStage.title}`
            : ko
              ? "현재 단계 완료"
              : "Current stage complete"
          : lowStockItems.length > 0
          ? ko
            ? `부족 ${lowStockItems.length}개 품목`
            : `${lowStockItems.length} low-stock items`
          : ko
            ? (d.businessCtx.inventoryMode === "unified" ? "제품 상태 안정" : "재고 상태 안정")
            : "Stock looks stable",
      tone: "rgba(15, 23, 42, 0.94)",
      change: undefined as number | undefined,
    },
    {
      label: ko ? "경영 건강" : "Health",
      value: totalSales > 0
        ? `${healthMetrics.healthScore}${ko ? "점" : "pt"}`
        : "—",
      note: totalSales > 0
        ? healthMetrics.healthGrade === "healthy" ? (ko ? "건강한 상태입니다" : "Healthy")
          : healthMetrics.healthGrade === "caution" ? (ko ? "주의가 필요합니다" : "Needs attention")
          : healthMetrics.healthGrade === "warning" ? (ko ? "경고 — 비용 점검 필요" : "Warning — check costs")
          : (ko ? "위험 — 즉시 대응 필요" : "Critical — act now")
        : ko ? "매출 입력 후 측정" : "Enter sales to measure",
      tone: totalSales > 0
        ? healthMetrics.healthScore >= 75 ? "#059669"
          : healthMetrics.healthScore >= 50 ? "#d97706"
          : "#dc2626"
        : "rgba(15, 23, 42, 0.82)",
      change: undefined as number | undefined,
    },
    ...(nextTaxItem ? [{
      label: ko ? "다음 세금 마감" : "Next tax deadline",
      value: nextTaxItem.daysUntil <= 0
        ? (ko ? "오늘 마감!" : "Due today!")
        : nextTaxItem.daysUntil <= 7
          ? `D-${nextTaxItem.daysUntil}`
          : `${nextTaxItem.daysUntil}${ko ? "일 후" : "d"}`,
      note: nextTaxItem.summary,
      tone: nextTaxItem.daysUntil <= 7 ? "#b42318" : nextTaxItem.daysUntil <= 30 ? "#b54708" : "rgba(15, 23, 42, 0.82)",
      change: undefined as number | undefined,
    }] : []),
  ];

  // CSV 내보내기
  const handleExportCSV = () => {
    const rows = [ko ? ["날짜", "매출(원)", "고객수"] : ["Date", "Sales(KRW)", "Customers"]];
    for (const entry of allEntries) {
      rows.push([entry.date, String(entry.sales), String(entry.customers)]);
    }
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buildup-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // suppress unused variable warnings
  void totalCustomers;
  void handleExportCSV;

  return (
    <section style={shell}>
      <style>{bentoHoverCSS}</style>

      {/* ━━━ 상호명 ━━━ */}
      <div style={{
        padding: "4px 0 12px",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <span style={{
          fontSize: "18px", fontWeight: 720, color: "#0f172a",
          letterSpacing: "-0.02em",
          fontFamily: "inherit",
        }}>
          {d.storeName || (ko ? "내 가게" : "My Store")}
        </span>
        {d.businessLaunched && (
          <span style={{
            fontSize: "10px", fontWeight: 650, padding: "3px 8px", borderRadius: "6px",
            background: "rgba(5,150,105,0.08)", color: "#059669",
            letterSpacing: "0.02em",
          }}>
            {ko ? "운영 중" : "LIVE"}
          </span>
        )}
      </div>

      {/* ━━━ 0단계: 경영 리추얼 배너 (주간/월간 프롬프트) ━━━ */}
      {!isStaff && (
        <RitualBanner
          ko={ko}
          onOpenWeekly={() => {
            const el = document.querySelector("[data-weekly-report]");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          onOpenMonthly={() => d.navigateToSurface("analytics")}
        />
      )}

      {/* ━━━ 긴급 Alert Strip (있을 때만 렌더) ━━━ */}
      {!isStaff && <AlertStripBanner />}

      {/* ━━━ 1단계: AI 경영 브리핑 (통합 허브 — 오늘의 1가지 + 분석·행동 + 다른 제안 접힘형 + KPI) ━━━ */}
      <MorningBriefing />

      {/* ━━━ 2단계: 매출 흐름 + 오늘 입력 · 핵심 생존 지표 — AI 코칭 바로 아래 ━━━ */}
      {!isStaff && (
        <div
          style={{
            display: "grid",
            gap: "14px",
            gridTemplateColumns: isWide
              ? "minmax(0, 1.15fr) minmax(360px, 0.85fr)"
              : "1fr",
          }}
        >
          <ActivitySnapshotCard
            d={d}
            ko={ko}
            todayStr={todayStr}
            recent7Entries={recent7Entries}
            recent7Sales={recent7Sales}
            weeklySalesChange={weeklySalesChange}
            todayEntry={todayEntry ?? null}
            avgDailySales={avgDailySales}
            fmt={fmt}
            onOpenCalendar={() => setShowCalendar(true)}
          />
          <SurvivalBoardCard
            ko={ko}
            isStartupCompany={isStartupCompany}
            runwayMonths={runwayMonths}
            capitalLeft={capitalLeft}
            weeklySalesChange={weeklySalesChange}
            weeklySignalLabel={weeklySignalLabel}
            healthLabel={healthLabel}
            healthTone={healthTone}
            topRiskLabel={topRiskLabel}
            focusMessage={focusMessage}
            d={d}
            totalSales={totalSales}
            netProfit={netProfit}
            totalCosts={totalCosts}
          />
        </div>
      )}

      {/* ━━━ 3단계: 현금흐름 레이더 (14일 시각화 + 설정) ━━━ */}
      {!isStaff && (
        <CashflowHeroCard
          ko={ko}
          dailyEntries={allEntries as Array<{ date: string; sales: number; customers: number }>}
        />
      )}

      {/* ━━━ Vital: 업종 벤치마크 (한국형 차별화, 항상 표시) ━━━ */}
      {!isStaff && (
        <SocialBenchmarkCard
          ko={ko}
          industryCategoryId={d.industryCategoryId}
          dailyEntries={allEntries as Array<{ date: string; sales: number; customers: number }>}
        />
      )}

      {/* ━━━ Deep Dive: 성장 도구 — 시간 패턴 · 마일스톤 · 일일 개선 (접이식) ━━━ */}
      {!isStaff && (
        <DeepDiveSection
          id="growth-tools"
          title={ko ? "성장 도구" : "Growth Tools"}
          subtitle={ko ? "시간 패턴 · 마일스톤 · 일일 개선" : "Time log · Milestones · Daily improvement"}
          defaultOpen={false}
        >
          <WeeklyTimeReport ko={ko} />
          <ProgressMilestonesCard
            ko={ko}
            dailyEntries={allEntries as Array<{ date: string; sales: number; customers: number }>}
            healthScore={healthScore}
            bepProgress={bepProgress}
            completedStages={d.completedCount ?? 0}
          />
          <DailyImprovementCard ko={ko} industryCategoryId={d.industryCategoryId} />
        </DeepDiveSection>
      )}

      {/* ── 비용 미입력 안내 ── */}
      {!isStaff && allEntries.length >= 1 && totalCosts === 0 && (
        <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{
          width: "100%", marginTop: "10px", padding: "14px 18px",
          borderRadius: "16px", border: "1px solid rgba(245,158,11,0.15)",
          background: "linear-gradient(180deg, rgba(245,158,11,0.04) 0%, rgba(255,255,255,0.9) 100%)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
          transition: "all 0.15s ease",
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "rgba(245,158,11,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v6M8 11.5v.5" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="8" cy="8" r="6.5" stroke="#f59e0b" strokeWidth="1.2" fill="none" />
            </svg>
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: "13px", fontWeight: 670, color: "#0f172a", letterSpacing: "-0.01em" }}>
              {ko ? "월 비용을 입력하면 손익 분석이 시작됩니다" : "Enter monthly costs to unlock P&L analysis"}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>
              {ko
                ? `${d.businessCtx.expenseFields?.[0]?.label?.ko ?? "재료비"}, 인건비, 임대료 등 실제 비용을 입력하세요`
                : `Enter actual costs: ${d.businessCtx.expenseFields?.[0]?.label?.en ?? "materials"}, labor, rent, etc.`}
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M5 3l4 4-4 4" stroke="rgba(15,23,42,0.3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ━━━ 2단계: 매출 분해 + 월간 진행 + 비용 구조 (데이터 있을 때만) ━━━ */}
      {allEntries.length >= 2 && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
        <SalesBreakdownCard />
        <MonthlyProgressCard />
      </div>
      )}
      {allEntries.length >= 1 && (
      <div style={{ display: "grid", gridTemplateColumns: !isStartupCompany && !isOnlineCategory ? "1fr 1fr" : "1fr", gap: "14px", marginTop: "14px" }}>
        {/* CostStructure: 오프라인 전용 (식재료/인건비 비율 — 스타트업/온라인에 불필요) */}
        {!isStartupCompany && !isOnlineCategory && <CostStructureCard />}
        <BenchmarkCard />
      </div>
      )}

      {/* ━━━ 기존 대시보드 (3단계: 딥다이브) — 데이터 있을 때만 표시 ━━━ */}
      {allEntries.length >= 3 && (
      <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(15,23,42,0.35)", marginBottom: "16px" }}>
          {ko ? "상세 분석" : "DEEP DIVE"}
        </div>
      </div>
      )}

      <div style={{ ...heroPanel, display: "none" }} className="bento-card">
        <div style={heroHeader}>
          <div>
            <div style={heroEyebrow}>{ko ? "운영 홈" : "Operations home"}</div>
            <h1 style={heroTitle}>{d.storeName || (ko ? "내 가게" : "My Store")}</h1>
            <p style={heroBody}>
              {""}
            </p>
          </div>
          <div style={heroActions}>
            <NotificationCenter d={d} ko={ko} />
            {!isStaff && (
              <>
                <button type="button" onClick={() => d.router.push("/analysis")} style={primaryAction} className="bento-btn">
                  {ko ? "경영 분석" : "Analysis"}
                </button>
                <button type="button" onClick={() => { d.setSelectedStoreIndex(0); d.navigateToSurface("analytics"); }} style={secondaryAction} className="bento-btn">
                  {ko ? "가게 정보" : "Store Info"}
                </button>
              </>
            )}
          </div>
        </div>

        {headlineStats.length > 0 && (
        <div style={headlineGrid}>
          {headlineStats.map((item, idx) => (
            <div key={item.label} style={{ ...headlineCard, animationDelay: `${idx * 60}ms` }} className="bento-headline bento-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={headlineLabel}>{item.label}</div>
                {item.change !== undefined && item.change !== 0 && (
                  <div style={{
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: item.change > 0 ? "rgba(101, 197, 101, 0.12)" : "rgba(197, 101, 101, 0.12)",
                    color: item.change > 0 ? "#177245" : "#b42318",
                  }}>
                    {item.change > 0 ? "+" : ""}{item.change}%
                  </div>
                )}
              </div>
              <div style={{ ...headlineValue, color: item.tone }} className="bento-number">{item.value}</div>
              <div style={headlineNote}>{item.note}</div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* ActivitySnapshotCard와 SurvivalBoardCard 모두 위로 이동됨 (AI 경영 코칭 바로 아래 grid) */}

      {/* ── 정산 예정 타임라인: CashflowHeroCard로 통합됨 (14일 시각화 + 위기 감지 + 설정) ── */}

      {/* ── 스타트업: 구독제 활성화 안내 (아직 안 켠 경우) ── */}
      {isStartupCompany && !usesSubscriptions && (
        <article style={{
          borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)",
          background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, #fff 100%)",
          padding: "20px 22px", marginTop: "14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "12px",
        }} className="bento-card bento-fade-in">
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              {ko ? "구독제를 운영하시나요?" : "Do you run a subscription model?"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", marginTop: "3px", lineHeight: 1.5 }}>
              {ko ? "켜면 MRR·이탈률·플랜별 가입 추적이 활성화됩니다" : "Enable to track MRR, churn rate, and plan-level signups"}
            </div>
          </div>
          <button type="button" onClick={() => d.setUsesSubscriptions(true)} style={{
            padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            color: "#fff", fontSize: "13px", fontWeight: 650, whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(124,58,237,0.2)",
          }}>
            {ko ? "활성화" : "Enable"}
          </button>
        </article>
      )}

      {/* ── 구독제: SaaS 핵심 지표 (독립 풀너비) ── */}
      {usesSubscriptions && (
        (() => {
          type PlanEntry = { date: string; sales: number; customers?: number; planSignups?: Record<string, number>; planChurns?: Record<string, number> };
          const typed = allEntries as PlanEntry[];
          const curKey = new Date().toISOString().slice(0, 7);
          const monthEntries = typed.filter((e) => e.date.startsWith(curKey));
          const mrr = monthEntries.reduce((s, e) => s + e.sales, 0);
          const prevMonth = new Date(); prevMonth.setMonth(prevMonth.getMonth() - 1);
          const prevKey = prevMonth.toISOString().slice(0, 7);
          const prevEntries = typed.filter((e) => e.date.startsWith(prevKey));
          const prevMrr = prevEntries.reduce((s, e) => s + e.sales, 0);
          const mrrGrowth = prevMrr > 0 ? Math.round(((mrr - prevMrr) / prevMrr) * 100) : 0;

          // Plan-level signups/churns
          const monthSignups = monthEntries.reduce((s, e) => {
            if (!e.planSignups) return s + (e.customers ?? 0);
            return s + Object.values(e.planSignups).reduce((a, b) => a + b, 0);
          }, 0);
          const monthChurns = monthEntries.reduce((s, e) => {
            if (!e.planChurns) return s;
            return s + Object.values(e.planChurns).reduce((a, b) => a + b, 0);
          }, 0);
          const prevSignups = prevEntries.reduce((s, e) => {
            if (!e.planSignups) return s + (e.customers ?? 0);
            return s + Object.values(e.planSignups).reduce((a, b) => a + b, 0);
          }, 0);

          const netNew = monthSignups - monthChurns;
          const churnRate = prevSignups > 0 ? Math.max(0, Math.round((monthChurns / prevSignups) * 100)) : 0;
          const convRate = monthSignups > 0 && mrr > 0 ? Math.min(100, Math.round((mrr / (monthSignups * 100)) * 100)) : 0;

          // Plan breakdown for tooltip
          const plans = (d.subscriptionPlans ?? []) as Array<{ id: string; name: string; price: number; isActive: boolean }>;
          const planBreakdown = plans.filter((p) => p.isActive).map((p) => {
            const count = monthEntries.reduce((s, e) => s + (e.planSignups?.[p.id] ?? 0), 0);
            return { name: p.name, count, revenue: count * p.price };
          }).filter((p) => p.count > 0);

          return (
          <article style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, #fff 100%)", padding: "20px 22px", marginTop: "14px" }} className="bento-card bento-fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>{ko ? "SaaS 핵심 지표" : "SaaS Key Metrics"}</span>
              <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ fontSize: "12px", fontWeight: 600, color: "#7c3aed", background: "none", border: "none", cursor: "pointer" }}>{ko ? "상세 →" : "Details →"}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isWide ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(124,58,237,0.03)" }}>
                <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(15,23,42,0.4)", marginBottom: "6px" }}>MRR</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#7c3aed", letterSpacing: "-0.02em" }}>{fmt(mrr)}</div>
                {mrrGrowth !== 0 && <div style={{ fontSize: "12px", fontWeight: 600, color: mrrGrowth > 0 ? "#059669" : "#dc2626", marginTop: "3px" }}>{mrrGrowth > 0 ? "+" : ""}{mrrGrowth}% MoM</div>}
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.03)" }}>
                <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(15,23,42,0.4)", marginBottom: "6px" }}>{ko ? "이달 신규" : "New MTD"}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#2563eb", letterSpacing: "-0.02em" }}>+{monthSignups.toLocaleString()}</div>
                {netNew !== monthSignups && <div style={{ fontSize: "12px", fontWeight: 600, color: netNew >= 0 ? "#059669" : "#dc2626", marginTop: "3px" }}>net {netNew >= 0 ? "+" : ""}{netNew}</div>}
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(5,150,105,0.03)" }}>
                <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(15,23,42,0.4)", marginBottom: "6px" }}>{ko ? "전환율" : "Conversion"}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#059669" }}>{convRate > 0 ? `${convRate}%` : "—"}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: churnRate > 10 ? "rgba(220,38,38,0.04)" : "rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(15,23,42,0.4)", marginBottom: "6px" }}>{ko ? "이탈률" : "Churn"}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: churnRate > 10 ? "#dc2626" : "#0f172a" }}>{churnRate > 0 ? `${churnRate}%` : "—"}</div>
              </div>
            </div>
            {/* Plan-level breakdown */}
            {planBreakdown.length > 0 && (
              <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {planBreakdown.map((p) => (
                  <span key={p.name} style={{
                    fontSize: "11px", fontWeight: 650, padding: "4px 10px", borderRadius: "8px",
                    background: "rgba(124,58,237,0.05)", color: "#7c3aed",
                  }}>
                    {p.name}: {p.count}{ko ? "건" : ""} ({fmt(p.revenue)})
                  </span>
                ))}
              </div>
            )}
            {allEntries.length === 0 && (
              <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "10px", background: "rgba(124,58,237,0.03)", fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5, display: "flex", alignItems: "center", gap: "6px" }}>
                <Lightbulb size={13} strokeWidth={1.5} color="#f59e0b" />
                {ko ? "매출을 기록하면 MRR·유저·전환율·이탈률이 자동 계산됩니다" : "Log revenue to auto-calculate MRR, users, conversion, churn"}
              </div>
            )}
          </article>
          );
        })()
      )}

      <div
        style={{
          ...coreGrid,
          gridTemplateColumns: (isStartupCompany && usesSubscriptions)
            ? (isWide ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr")
            : (isThreeUp ? "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)" : isWide ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr"),
        }}
      >
        {!isStaff && isStartupCompany ? (
          <StartupMetricsCard
            ko={ko}
            recent7Customers={recent7Customers}
            activeDays7={activeDays7}
            weeklySalesChange={weeklySalesChange}
            monthlyBurn={monthlyBurn}
            runwayMonths={runwayMonths}
            employeesCount={employees.length}
            roadmapProgress={d.pathTotalStages > 0 ? Math.round((d.completedCount / d.pathTotalStages) * 100) : 0}
            fmt={fmt}
          />
        ) : null}
        {!isStaff && (
          <PLHeroCard
            totalSales={totalSales}
            totalCosts={totalCosts}
            netProfit={netProfit}
            bepProgress={bepProgress}
            ingredientRatio={ingredientRatio}
            laborRatio={laborRatio}
            rentRatio={rentRatio}
            primeCost={primeCost}
            projectedProfit={projectedProfit}
            workingDays={workingDays}
            ko={ko}
            fmt={fmt}
            prevMonthSales={prevMonthSales}
            prevMonthCosts={prevMonthCosts}
            breakEvenDailySales={breakEvenDailySales}
            todaySales={todaySales}
            todayBepProgress={todayBepProgress}
            daysAboveBreakEven={daysAboveBreakEven}
            totalDaysRecorded={healthMetrics.totalDaysRecorded}
            cogsLabel={d.businessCtx.expenseFields?.[0]?.label}
          />
        )}
        {/* ── 구독제: 구독 관리 (구독제 활성화 시만) ── */}
        {usesSubscriptions && (
          <SubscriptionPlanManager d={d} ko={ko} fmt={fmt} />
        )}
        {/* ── 재고/제품 관리 (CRUD + 엑셀 — 구독제 사용 시엔 구독 카드로 대체) ── */}
        {!usesSubscriptions && d.businessCtx.showInventoryCard ? (
          <InventoryOpsCard ko={ko} inventory={inventory} lowStockItems={lowStockItems} d={d} />
        ) : null}
        {/* ── 고객/회원 관리 요약 (업종별) ── */}
        {!usesSubscriptions && d.businessCtx.showCustomerCard && (
          <CustomerSummaryCard d={d} ko={ko} fmt={fmt} />
        )}
        {/* ── 팀 요약 (읽기 전용) — CRUD는 내 가게 탭 ── */}
        <article style={{ borderRadius: "20px", border: "1px solid rgba(0,0,0,0.06)", background: "#fff", padding: "18px 22px", display: "grid", gap: "10px" }} className="bento-card bento-fade-in">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em" }}>{ko ? "팀 현황" : "Team"}</span>
              <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(29,53,87,0.06)", color: "var(--primary)" }}>{employees.length}{ko ? "명" : ""}</span>
            </div>
            <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>{ko ? "관리하기 →" : "Manage →"}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{employees.length}</div>
              <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "인원" : "Staff"}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{fmt(estimatedMonthlyPayroll)}</div>
              <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "예상 급여" : "Payroll"}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{insuredEmployees}</div>
              <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600 }}>{ko ? "4대보험" : "Insured"}</div>
            </div>
          </div>
          {employees.length === 0 && (
            <button type="button" onClick={() => d.navigateToSurface("analytics")} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px dashed rgba(0,0,0,0.1)", background: "transparent", cursor: "pointer", fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>
              {ko ? "👥 직원을 등록하면 급여·보험 현황을 한눈에 볼 수 있어요" : "👥 Add staff to see payroll & insurance at a glance"}
            </button>
          )}
        </article>
      </div>

      {/* ── Weekly Report (owner only) ── */}
      {!isStaff && <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
        {streak >= 7 ? (
          <WeeklyReport d={d} ko={ko} fmt={fmt} />
        ) : (
          <div style={{
            borderRadius: "28px", padding: "24px", textAlign: "center" as const,
            background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
            border: "1px solid rgba(15,23,42,0.06)",
          }}>
            <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="6" y="13" width="16" height="11" rx="3" stroke="rgba(15,23,42,0.35)" strokeWidth="1.5" fill="rgba(15,23,42,0.04)" />
                <path d="M10 13V9.5a4 4 0 1 1 8 0V13" stroke="rgba(15,23,42,0.35)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="14" cy="18.5" r="1.5" fill="rgba(15,23,42,0.3)" />
                <path d="M14 20v1.5" stroke="rgba(15,23,42,0.3)" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>
              {ko ? "주간 리포트" : "Weekly Report"}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.48)", marginTop: "4px", lineHeight: 1.5 }}>
              {ko
                ? `7일 연속 매출 기록 시 해금됩니다 (현재 ${streak}일)`
                : `Unlocks at 7-day streak (current: ${streak}d)`}
            </div>
            <div style={{
              marginTop: "12px", height: "6px", borderRadius: "3px",
              background: "rgba(15,23,42,0.06)", overflow: "hidden", maxWidth: "200px", marginInline: "auto",
            }}>
              <div style={{
                height: "100%", borderRadius: "3px",
                width: `${Math.min(100, (streak / 7) * 100)}%`,
                background: "linear-gradient(90deg, #2563eb, #457b9d)",
                transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
              }} />
            </div>
            {/* 다음 해금 단계 안내 */}
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "center", gap: "12px" }}>
              {[
                { days: 7, label: ko ? "주간 리포트" : "Weekly", Icon: BarChart3, color: "#2563eb" },
                { days: 30, label: ko ? "월간 트렌드" : "Monthly", Icon: TrendingUp, color: "#7c3aed" },
                { days: 90, label: ko ? "연간 리포트" : "Annual", Icon: Gem, color: "#059669" },
              ].map(tier => {
                const unlocked = streak >= tier.days;
                const IconComp = unlocked ? Check : tier.Icon;
                return (
                  <div key={tier.days} style={{
                    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "3px",
                    opacity: unlocked ? 1 : 0.4,
                  }}>
                    <IconComp
                      size={16}
                      strokeWidth={1.5}
                      color={unlocked ? tier.color : "rgba(15,23,42,0.5)"}
                    />
                    <span style={{ fontSize: "10px", fontWeight: 600, color: unlocked ? tier.color : "rgba(15,23,42,0.35)" }}>
                      {tier.days}{ko ? "일" : "d"}
                    </span>
                    <span style={{ fontSize: "9px", color: "rgba(15,23,42,0.3)" }}>{tier.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>}

      {/* ── 매출 예측 + "이대로 가면" 시나리오 (owner only) ── */}
      {!isStaff && allEntries.length >= 3 && (
        <ForecastCard
          ko={ko}
          dailyEntries={allEntries as Array<{ date: string; sales: number; customers: number }>}
          monthlyCosts={d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number }}
          capitalLeft={capitalLeft}
          breakEvenDailySales={breakEvenDailySales}
          industryCategoryId={d.industryCategoryId}
          initialOperatingCapital={d.initialOperatingCapital}
        />
      )}

      {/* ── 첫 100명 고객 확보 플레이북 (owner only, 초기 90일 또는 100명 미만) ── */}
      {!isStaff && (daysSinceLaunch <= 90 || daysSinceLaunch === 0) && (
        <FirstCustomersCard
          ko={ko}
          industryCategoryId={d.industryCategoryId}
          businessLaunched={d.businessLaunched}
          businessLaunchedDate={launchDateText}
        />
      )}

      {/* ── What-If 시뮬레이터 (owner only, 매출 or 비용 있을 때) ── */}
      {!isStaff && (totalSales > 0 || totalCosts > 0) && (
        <WhatIfSimulator
          ko={ko}
          monthlySales={totalSales}
          monthlyCosts={d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number }}
          capitalLeft={capitalLeft}
        />
      )}

      {/* ── 인기 상품/서비스 + 최근 활동 2열 그리드 ── */}
      {!isStaff && (d.businessCtx.inventoryMode as string) !== "minimal" && !(isStartupCompany && usesSubscriptions) && (
        <div style={{ display: "grid", gridTemplateColumns: viewportWidth >= 768 ? "1fr 1fr" : "1fr", gap: "16px" }}>
          {/* 인기 상품/서비스 카드 */}
          <div style={opsCard} className="bento-card bento-fade-in">
            <div style={opsHeader}>
              <div>
                <div style={sectionEyebrow}>{ko ? "이번 달" : "This Month"}</div>
                <div style={{ fontSize: "17px", fontWeight: 650, letterSpacing: "-0.02em", color: "#0f172a" }}>
                  {ko ? (d.businessCtx.inventoryMode === "service" ? "인기 서비스" : d.businessCtx.inventoryMode === "minimal" ? "인기 프로그램" : "인기 상품") : "Top Products"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", marginTop: "2px" }}>
                  {ko ? "매출 기준 상위 항목" : "Best selling products this month"}
                </div>
              </div>
            </div>
            {(d.products as Array<{ id: string; name: string; monthlySales?: number; price?: number }> || []).length > 0 ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {(d.products as Array<{ id: string; name: string; monthlySales?: number; price?: number }>)
                  .sort((a, b) => ((b.monthlySales ?? 0) * (b.price ?? 0)) - ((a.monthlySales ?? 0) * (a.price ?? 0)))
                  .slice(0, 4)
                  .map((product, i) => {
                    const revenue = (product.monthlySales ?? 0) * (product.price ?? 0);
                    const maxRevenue = Math.max(...(d.products as Array<{ monthlySales?: number; price?: number }>).map(p => (p.monthlySales ?? 0) * (p.price ?? 0)), 1);
                    const percent = Math.round((revenue / maxRevenue) * 100);
                    return (
                      <div key={product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "2px" }}>{product.name}</div>
                          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>
                            {product.monthlySales ?? 0}{ko ? "개 판매" : " sales"}
                          </div>
                          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(5,97,252,0.08)", marginTop: "6px", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "2px", width: `${percent}%`, background: i === 0 ? "#0561fc" : "rgba(5,97,252,0.4)", transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a", whiteSpace: "nowrap" }}>{fmt(revenue)}</div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={emptyState}>{ko ? "상품을 등록하면 매출 순위가 여기에 표시됩니다" : "Add products to see sales ranking here"}</div>
            )}
          </div>

          {/* 최근 활동 피드 */}
          <div style={opsCard} className="bento-card bento-fade-in">
            <div style={opsHeader}>
              <div>
                <div style={sectionEyebrow}>{ko ? "최근" : "Recent"}</div>
                <div style={{ fontSize: "17px", fontWeight: 650, letterSpacing: "-0.02em", color: "#0f172a" }}>
                  {ko ? "최근 활동" : "Recent Activity"}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", marginTop: "2px" }}>
                  {ko ? "대시보드 최근 이벤트" : "Latest events and updates"}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {recent7Entries.length > 0 ? recent7Entries.slice(-5).reverse().map((entry, i) => (
                <div key={entry.date} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: i === 0 ? "rgba(5,97,252,0.04)" : "transparent" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: entry.sales > avgDailySales ? "rgba(101,197,101,0.12)" : "rgba(5,97,252,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {entry.sales > avgDailySales
                      ? <TrendingUp size={14} strokeWidth={1.5} color="#059669" />
                      : <BarChart3 size={14} strokeWidth={1.5} color="#2563eb" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                      {ko ? "매출 기록" : "Sales recorded"} — {fmt(entry.sales)}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>
                      {ko ? `고객 ${entry.customers}명` : `${entry.customers} customers`} · {entry.date.slice(5).replace("-", "/")}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.35)", whiteSpace: "nowrap" }}>
                    {i === 0 ? (ko ? "최근" : "Latest") : `${i + 1}${ko ? "일 전" : "d ago"}`}
                  </div>
                </div>
              )) : (
                <div style={emptyState}>{ko ? "매출을 기록하면 활동 내역이 여기에 표시됩니다" : "Record sales to see activity here"}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 데이터 Export (owner only) ── */}
      {!isStaff && (totalSales > 0 || inventory.length > 0 || employees.length > 0) && (
        <ExportPanel
          ko={ko}
          storeName={d.storeName}
          entries={allEntries as Array<{ date: string; sales: number; customers: number }>}
          monthlyCosts={d.monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number }}
          inventory={inventory as unknown as import("../../stores/operations-store").InventoryItem[]}
          employees={employees as unknown as import("../../stores/operations-store").Employee[]}
          products={d.products as import("../../stores/operations-store").Product[] | undefined}
          unifiedProducts={d.unifiedProducts as import("../../stores/operations-store").UnifiedProduct[] | undefined}
        />
      )}

      {!isStaff && <section style={detailSection}>
        <div style={detailSectionHeader}>
          <div>
            <div style={sectionEyebrow}>{ko ? "추가 관리" : "More controls"}</div>
            <div style={detailSectionTitle}>
              {ko ? "세부 입력과 편집은 아래에서 필요할 때만 펼쳐보세요" : "Open detailed controls below only when you need them"}
            </div>
          </div>
        </div>
        <DetailTabs d={d} fmt={fmt} />
      </section>}

      {/* ── Milestone Toast ── */}
      <MilestoneToast milestone={currentMilestone} onDismiss={handleDismissMilestone} />

      {/* ── Calendar Modal ── */}
      {showCalendar && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCalendar(false); }}
        >
          <div style={{ width: "min(520px, 90vw)", maxHeight: "85vh", overflowY: "auto", borderRadius: "28px", background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
              <div />
              <button type="button" onClick={() => setShowCalendar(false)} style={{ background: "rgba(15,23,42,0.06)", border: "none", borderRadius: "999px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "rgba(15,23,42,0.5)" }}>✕</button>
            </div>
            <div style={{ padding: "0 0 24px" }}>
              <RevenueCalendar
                dailyEntries={allEntries}
                ko={ko}
                fmt={fmt}
                onDateClick={(date) => { d.setDailyDateInput(date); setShowCalendar(false); }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
