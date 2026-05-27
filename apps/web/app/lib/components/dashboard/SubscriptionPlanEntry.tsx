"use client";

import { useEffect, useState } from "react";
import type { DashboardHook } from "../../useDashboard";
import type { SubscriptionPlan } from "../../stores/operations-store";
import { getKstDate } from "../../utils/business-day";

const FONT_STACK =
  "inherit";

export function SubscriptionPlanEntry({
  d,
  ko,
  fmt,
  onSignupsApplied,
  /** 외부 펼침 강제 — "+ 오늘 입력" 클릭 시 자동 펼침 */
  forceExpanded,
}: {
  d: DashboardHook;
  ko: boolean;
  fmt: (n: number) => string;
  onSignupsApplied?: (totalRevenue: number, totalSignups: number) => void;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(forceExpanded ?? false);
  const [signupCounts, setSignupCounts] = useState<Record<string, number>>({});
  const [churnCounts, setChurnCounts] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<"signup" | "churn">("signup");

  // forceExpanded → internal expanded 동기화 (true 들어오면 펼침)
  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  const plans = (d.subscriptionPlans as SubscriptionPlan[]).filter((p) => p.isActive);

  if (plans.length === 0) return null;

  const totalRevenue = Object.entries(signupCounts).reduce((sum, [id, qty]) => {
    const p = plans.find((x) => x.id === id);
    return sum + (p?.price ?? 0) * qty;
  }, 0);

  const totalSignups = Object.values(signupCounts).reduce((s, v) => s + v, 0);
  const totalChurns = Object.values(churnCounts).reduce((s, v) => s + v, 0);

  const handlePlus = (id: string, target: "signup" | "churn") => {
    const setter = target === "signup" ? setSignupCounts : setChurnCounts;
    setter((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleMinus = (id: string, target: "signup" | "churn") => {
    const setter = target === "signup" ? setSignupCounts : setChurnCounts;
    setter((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) > 0) next[id] = (next[id] ?? 0) - 1;
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const handleApply = () => {
    if (totalSignups <= 0 && totalChurns <= 0) return;

    const entryDate = d.dailyDateInput || getKstDate(new Date());
    const allE = d.dailyEntries as Array<{
      date: string; sales: number; customers: number;
      productSales?: Record<string, number>;
      planSignups?: Record<string, number>;
      planChurns?: Record<string, number>;
    }>;
    const existing = allE.find((e) => e.date === entryDate);

    // Merge with existing plan data
    const prevSignups: Record<string, number> = existing?.planSignups ?? {};
    const prevChurns: Record<string, number> = existing?.planChurns ?? {};
    const mergedSignups: Record<string, number> = { ...prevSignups };
    const mergedChurns: Record<string, number> = { ...prevChurns };

    for (const [id, qty] of Object.entries(signupCounts)) {
      if (qty > 0) mergedSignups[id] = (mergedSignups[id] ?? 0) + qty;
    }
    for (const [id, qty] of Object.entries(churnCounts)) {
      if (qty > 0) mergedChurns[id] = (mergedChurns[id] ?? 0) + qty;
    }

    const entry = {
      date: entryDate,
      sales: (existing?.sales ?? 0) + totalRevenue,
      customers: (existing?.customers ?? 0) + totalSignups - totalChurns,
      productSales: existing?.productSales,
      planSignups: mergedSignups,
      planChurns: mergedChurns,
    };

    const next = [...allE.filter((e) => e.date !== entry.date), entry].sort(
      (a, b) => b.date.localeCompare(a.date),
    );
    d.setDailyEntries(next);
    try { localStorage.setItem("dailyEntries", JSON.stringify(next)); } catch {}

    // Update MRR/user input fields
    const inManWon = String(Math.round(entry.sales / 10000));
    d.setDailySalesInput(inManWon);
    d.setDailyCustomersInput(String(Math.max(0, entry.customers)));

    if (onSignupsApplied) onSignupsApplied(entry.sales, totalSignups);

    setSignupCounts({});
    setChurnCounts({});
  };

  const activeCounts = mode === "signup" ? signupCounts : churnCounts;
  const activeEntries = Object.entries(activeCounts).filter(([, qty]) => qty > 0);

  return (
    <div style={{
      marginTop: "12px", borderRadius: "16px",
      background: expanded ? "rgba(255,255,255,0.98)" : "rgba(124,58,237,0.02)",
      border: expanded ? "1px solid rgba(124,58,237,0.1)" : "1px solid rgba(124,58,237,0.05)",
      overflow: expanded ? "visible" : "hidden", transition: "all 0.2s ease",
    }}>
      {/* Header — 좌: 토글, 우: 구독 관리 CTA + chevron */}
      <div style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", gap: "8px",
      }}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          style={{
            display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0,
            background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3" width="14" height="12" rx="3" stroke="rgba(124,58,237,0.5)" strokeWidth="1.2" fill="none" />
            <path d="M5 7.5h8M5 10.5h5" stroke="rgba(124,58,237,0.5)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a", fontFamily: FONT_STACK }}>
            {ko ? "플랜별 가입 기록" : "Plan-based signups"}
          </span>
          {!expanded && totalSignups > 0 && (
            <span style={{ fontSize: "12px", fontWeight: 650, color: "#7c3aed" }}>
              +{totalSignups}{ko ? "건" : ""}
            </span>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {/* 구독 관리 카드 (운영 관리 DeepDive) 로 이동 — DeepDive 펼치고 스크롤 */}
          <button
            type="button"
            onClick={() => {
              try {
                window.dispatchEvent(new CustomEvent("buildup:open-deepdive", { detail: { id: "ops-mgmt" } }));
              } catch { /* SSR safety */ }
              // DeepDive 가 펼쳐질 시간 확보 후 스크롤
              setTimeout(() => {
                const el = document.getElementById("subscription-manager");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 80);
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "5px 10px", borderRadius: "999px",
              border: "1px solid rgba(124,58,237,0.18)",
              background: "rgba(124,58,237,0.04)",
              fontSize: "11.5px", fontWeight: 650, color: "#7c3aed",
              cursor: "pointer", fontFamily: FONT_STACK, letterSpacing: "-0.005em",
              whiteSpace: "nowrap" as const, transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.09)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.04)"; }}
          >
            {ko ? "구독 관리" : "Manage plans"} →
          </button>

          {/* Toggle chevron */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? (ko ? "접기" : "Collapse") : (ko ? "펼치기" : "Expand")}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "26px", height: "26px", borderRadius: "8px",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>
              <path d="M3.5 5.5L7 9l3.5-3.5" stroke="rgba(15,23,42,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          {/* Signup / Churn toggle */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            {(["signup", "churn"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px 0", borderRadius: "10px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: 650, fontFamily: FONT_STACK,
                background: mode === m ? (m === "signup" ? "rgba(124,58,237,0.08)" : "rgba(220,38,38,0.06)") : "rgba(25,25,112,0.035)",
                color: mode === m ? (m === "signup" ? "#7c3aed" : "#dc2626") : "rgba(15,23,42,0.4)",
                transition: "all 0.15s ease",
              }}>
                {m === "signup" ? (ko ? "신규 가입" : "New Signups") : (ko ? "이탈" : "Churns")}
              </button>
            ))}
          </div>

          {/* Plan list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {plans.map((plan) => {
              const count = activeCounts[plan.id] ?? 0;
              const isChurn = mode === "churn";
              const accent = isChurn ? "#dc2626" : "#7c3aed";
              return (
                <div key={plan.id} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "12px",
                  background: count > 0 ? (isChurn ? "rgba(220,38,38,0.03)" : "rgba(124,58,237,0.03)") : "rgba(15,23,42,0.015)",
                  border: count > 0 ? `1px solid ${isChurn ? "rgba(220,38,38,0.1)" : "rgba(124,58,237,0.1)"}` : "1px solid rgba(15,23,42,0.04)",
                  transition: "all 0.15s ease",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a" }}>{plan.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)" }}>
                      {fmt(plan.price)}/{plan.billingCycle === "monthly" ? (ko ? "월" : "mo") : (ko ? "연" : "yr")}
                      {count > 0 && !isChurn && (
                        <span style={{ color: accent, fontWeight: 600, marginLeft: "6px" }}>
                          = {fmt(plan.price * count)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", borderRadius: "9px",
                    overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)", background: "#fff",
                  }}>
                    <button type="button" onClick={() => handleMinus(plan.id, mode)}
                      style={{
                        width: "32px", height: "34px", border: "none", cursor: "pointer",
                        background: "transparent", fontSize: "15px", fontWeight: 500, color: "#0f172a",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>-</button>
                    <input
                      type="text" inputMode="numeric" value={String(count)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
                        const setter = mode === "signup" ? setSignupCounts : setChurnCounts;
                        setter((prev) => ({ ...prev, [plan.id]: Number.isNaN(val) ? 0 : Math.max(0, val) }));
                      }}
                      style={{
                        width: "40px", height: "34px", border: "none",
                        borderLeft: "1px solid rgba(15,23,42,0.06)",
                        borderRight: "1px solid rgba(15,23,42,0.06)",
                        textAlign: "center", fontSize: "14px", fontWeight: 700,
                        color: count > 0 ? accent : "rgba(15,23,42,0.25)",
                        outline: "none", background: "transparent",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    />
                    <button type="button" onClick={() => handlePlus(plan.id, mode)}
                      style={{
                        width: "32px", height: "34px", border: "none", cursor: "pointer",
                        background: "transparent", fontSize: "15px", fontWeight: 500, color: "#0f172a",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>+</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary + Apply */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", borderRadius: "12px", marginTop: "10px",
            background: (totalSignups > 0 || totalChurns > 0) ? "rgba(124,58,237,0.04)" : "rgba(25,25,112,0.025)",
            border: (totalSignups > 0 || totalChurns > 0) ? "1px solid rgba(124,58,237,0.1)" : "1px solid transparent",
          }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.4)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                {ko ? "요약" : "Summary"}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a", marginTop: "3px", lineHeight: 1.5 }}>
                {totalSignups > 0 && (
                  <span style={{ color: "#7c3aed" }}>+{totalSignups} {ko ? "가입" : "signup"}{totalSignups > 1 && !ko ? "s" : ""}</span>
                )}
                {totalSignups > 0 && totalChurns > 0 && " · "}
                {totalChurns > 0 && (
                  <span style={{ color: "#dc2626" }}>-{totalChurns} {ko ? "이탈" : "churn"}{totalChurns > 1 && !ko ? "s" : ""}</span>
                )}
                {totalSignups === 0 && totalChurns === 0 && (
                  <span style={{ color: "rgba(15,23,42,0.25)" }}>--</span>
                )}
              </div>
              {totalRevenue > 0 && (
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "1px" }}>
                  MRR +{fmt(totalRevenue)}
                </div>
              )}
            </div>
            <button type="button" onClick={handleApply}
              disabled={totalSignups <= 0 && totalChurns <= 0}
              style={{
                fontSize: "13px", fontWeight: 650, padding: "10px 18px", borderRadius: "10px",
                border: "none",
                cursor: (totalSignups > 0 || totalChurns > 0) ? "pointer" : "default",
                background: (totalSignups > 0 || totalChurns > 0)
                  ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                  : "rgba(25,25,112,0.05)",
                color: (totalSignups > 0 || totalChurns > 0) ? "#fff" : "rgba(15,23,42,0.3)",
                transition: "all 0.15s ease",
                fontFamily: FONT_STACK,
              }}>
              {ko ? "매출에 반영" : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
