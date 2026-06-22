"use client";

/**
 * SubscriptionPlanManager — 구독 플랜 관리 (스타트업·SaaS 전용).
 *
 * 사용처: Tier 3 운영 관리 DeepDive 안.
 * 분기: usesSubscriptions === true 일 때만.
 *
 * 구성:
 *   - 플랜 별 색상 라벨 (5색 회전)
 *   - 신규/편집 폼 (이름·가격·청구주기·활성 토글)
 *   - 가입자 리스트 + 플랜별 통계
 */

import { useState } from "react";
import type { DashboardHook } from "../../useDashboard";
import type { SubscriptionPlan, Subscriber } from "../../stores/operations-store";
import { getKstDate } from "../../utils/business-day";

// ─── 구독 고객 관리 (스타트업) ──────────────────────────────────────────────

const PLAN_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: "rgba(124,58,237,0.08)", text: "#7c3aed", border: "rgba(124,58,237,0.15)" },
  1: { bg: "rgba(25,25,112,0.08)", text: "#191970", border: "rgba(25,25,112,0.15)" },
  2: { bg: "rgba(25,25,112,0.08)", text: "#1d3557", border: "rgba(25,25,112,0.15)" },
  3: { bg: "rgba(25,25,112,0.08)", text: "#191970", border: "rgba(25,25,112,0.15)" },
  4: { bg: "rgba(182,76,76,0.08)", text: "#b64c4c", border: "rgba(182,76,76,0.15)" },
};

function getPlanColor(index: number) {
  return PLAN_COLORS[index % 5] ?? PLAN_COLORS[0];
}

export function SubscriptionPlanManager({ d, ko, fmt }: { d: DashboardHook; ko: boolean; fmt: (n: number) => string }) {
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
    void d.flushStoreDataImmediate?.(); // 즉시 서버 동기화(기기 간 즉시 반영)
  };

  const handleDeletePlan = (id: string) => {
    d.setSubscriptionPlans(plans.filter((p) => p.id !== id));
    void d.flushStoreDataImmediate?.();
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
      joinedAt: getKstDate(new Date()),
    };
    d.setSubscribers([...subs, newSub]);
    d.setSubCustomerName(""); d.setSubCustomerEmail(""); d.setSubCustomerFormOpen(false);
    void d.flushStoreDataImmediate?.();
  };

  const handleChurn = (id: string) => {
    d.setSubscribers(subs.map((s) =>
      s.id === id ? { ...s, status: "churned" as const, churnedAt: getKstDate(new Date()) } : s,
    ));
    void d.flushStoreDataImmediate?.();
  };

  const handleReactivate = (id: string) => {
    d.setSubscribers(subs.map((s) =>
      s.id === id ? { ...s, status: "active" as const, churnedAt: undefined } : s,
    ));
    void d.flushStoreDataImmediate?.();
  };

  const handleDeleteSub = (id: string) => {
    d.setSubscribers(subs.filter((s) => s.id !== id));
    void d.flushStoreDataImmediate?.();
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

  const isEmpty = plans.length === 0 && subs.length === 0;

  return (
    <article style={{
      borderRadius: "20px",
      border: "1px solid rgba(124,58,237,0.08)",
      background: isEmpty
        ? "linear-gradient(180deg, rgba(124,58,237,0.04) 0%, rgba(168,85,247,0.02) 100%)"
        : "#fff",
      padding: "18px 22px", display: "grid", gap: "12px",
    }} className="bento-card">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "구독 관리" : "Subscriptions"}</span>
          {!isEmpty && (
            <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
              {activeSubs.length}{ko ? "명" : ""}
            </span>
          )}
          {currentMrr > 0 && (
            <span style={{ fontSize: "11px", fontWeight: 650, padding: "2px 8px", borderRadius: "6px", background: "rgba(25,25,112,0.06)", color: "#1d3557" }}>
              MRR {fmt(currentMrr)}
            </span>
          )}
        </div>
        <button type="button" onClick={() => d.setUsesSubscriptions(false)} style={{
          fontSize: "11px", fontWeight: 600, color: "var(--muted)", background: "none", border: "none", cursor: "pointer",
          padding: "2px 6px", borderRadius: "6px",
        }}>
          {ko ? "비활성화" : "Disable"}
        </button>
      </div>

      {/* Empty state — 깔끔한 hero CTA (폼 안 열렸을 때만) */}
      {isEmpty && !d.subPlanFormOpen && (
        <div style={{
          padding: "20px 16px 18px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
          textAlign: "center" as const,
        }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(168,85,247,0.08) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(124,58,237,0.12)",
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2.5l1.85 4.94L17 8.13l-3.85 3.27.92 5.1L10 14l-4.07 2.5.92-5.1L3 8.13l5.15-.69L10 2.5z" fill="#7c3aed" opacity="0.85"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              {ko ? "구독제 비즈니스 시작" : "Start your subscription business"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "5px", lineHeight: 1.55, maxWidth: "260px" }}>
              {ko
                ? "플랜을 만들고 고객을 추가하면 MRR·이탈률·전환율이 자동으로 계산됩니다"
                : "Create plans and add customers — MRR, churn, and conversion are tracked automatically"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setTab("plans"); d.setSubPlanFormOpen(true); }}
            style={{
              marginTop: "2px",
              padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
              color: "#fff", fontSize: "13px", fontWeight: 650, letterSpacing: "-0.01em",
              boxShadow: "0 6px 18px rgba(124,58,237,0.22)",
              display: "inline-flex", alignItems: "center", gap: "6px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2v8M2 6h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {ko ? "첫 플랜 만들기" : "Create first plan"}
          </button>
        </div>
      )}

      {/* Empty + 폼 열림 — 인라인 첫 플랜 추가 폼 (취소 버튼 포함) */}
      {isEmpty && d.subPlanFormOpen && (
        <div style={{
          padding: "16px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(124,58,237,0.12)",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
              {ko ? "첫 플랜 만들기" : "Create first plan"}
            </div>
            <button
              type="button"
              onClick={() => { d.setSubPlanFormOpen(false); d.setSubPlanName(""); d.setSubPlanPrice(""); }}
              style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
            >
              {ko ? "취소" : "Cancel"}
            </button>
          </div>
          <input
            type="text"
            placeholder={ko ? "플랜 이름 (예: Pro, Basic)" : "Plan name (e.g. Pro, Basic)"}
            value={d.subPlanName ?? ""}
            onChange={(e) => d.setSubPlanName(e.target.value)}
            autoFocus
            style={{ padding: "10px 12px", borderRadius: "9px", border: "1px solid rgba(15,23,42,0.1)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none" }}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="text" inputMode="numeric"
              placeholder={ko ? "가격 (원)" : "Price (KRW)"}
              value={d.subPlanPrice ?? ""}
              onChange={(e) => d.setSubPlanPrice(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", borderRadius: "9px", border: "1px solid rgba(15,23,42,0.1)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none" }}
            />
            <select
              value={(d.subPlanCycle as string) ?? "monthly"}
              onChange={(e) => d.setSubPlanCycle(e.target.value as "monthly" | "annual")}
              style={{ padding: "10px 12px", borderRadius: "9px", border: "1px solid rgba(15,23,42,0.1)", background: "#fff", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
            >
              <option value="monthly">{ko ? "월" : "Monthly"}</option>
              <option value="annual">{ko ? "연" : "Annual"}</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddPlan}
            disabled={!(d.subPlanName ?? "").trim() || !(d.subPlanPrice ?? "")}
            style={{
              padding: "10px", borderRadius: "9px", border: "none", cursor: "pointer",
              background: (d.subPlanName ?? "").trim() && (d.subPlanPrice ?? "")
                ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                : "rgba(25,25,112,0.05)",
              color: (d.subPlanName ?? "").trim() && (d.subPlanPrice ?? "") ? "#fff" : "rgba(15,23,42,0.3)",
              fontSize: "13px", fontWeight: 650, letterSpacing: "-0.01em",
              boxShadow: (d.subPlanName ?? "").trim() && (d.subPlanPrice ?? "") ? "0 4px 12px rgba(124,58,237,0.18)" : "none",
            }}
          >
            {ko ? "플랜 만들기" : "Create plan"}
          </button>
        </div>
      )}

      {/* Tab toggle — 데이터 있을 때만 */}
      {!isEmpty && (
        <div style={{ display: "flex", gap: "4px", background: "rgba(25,25,112,0.035)", borderRadius: "10px", padding: "3px" }}>
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
      )}

      {/* ── Customers tab ── */}
      {!isEmpty && tab === "customers" && (
        <>
          {/* Plan summary chips — 구독자가 있을 때만 의미 있음 */}
          {activeSubs.length > 0 && activePlans.length > 0 && (
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
                          <span style={{ fontSize: "10px", fontWeight: 650, color: "#191970", background: "rgba(25,25,112,0.08)", padding: "1px 6px", borderRadius: "5px" }}>Trial</span>
                        )}
                      </div>
                      {sub.email && (
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.email}</div>
                      )}
                    </div>
                    {/* Churn button */}
                    <button type="button" onClick={() => handleChurn(sub.id)} title={ko ? "이탈 처리" : "Mark churned"} style={{
                      width: "24px", height: "24px", borderRadius: "6px", border: "none",
                      background: "rgba(25,25,112,0.04)", cursor: "pointer",
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
          ) : plans.length > 0 && !d.subCustomerFormOpen ? (
            // 빈 상태 — 통합 hero CTA (chip + dashed + add 버튼 → 한 박스로)
            <div style={{
              padding: "22px 16px",
              borderRadius: "14px",
              background: "linear-gradient(180deg, rgba(124,58,237,0.04) 0%, rgba(168,85,247,0.015) 100%)",
              border: "1px solid rgba(124,58,237,0.08)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
              textAlign: "center" as const,
            }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "11px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(168,85,247,0.08) 100%)",
                border: "1px solid rgba(124,58,237,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="6" r="3" stroke="#7c3aed" strokeWidth="1.5" fill="none"/>
                  <path d="M3 15.5c0-3 2.7-5 6-5s6 2 6 5" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <circle cx="14.5" cy="3.5" r="2.5" fill="#7c3aed" opacity="0.15"/>
                  <path d="M14.5 2.5v2M13.5 3.5h2" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.015em" }}>
                  {ko ? "첫 고객을 등록하세요" : "Register your first customer"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", lineHeight: 1.55, maxWidth: "280px" }}>
                  {ko
                    ? `${plans.length}개의 플랜이 준비됐어요 — 첫 고객을 추가하면 MRR이 시작됩니다`
                    : `${plans.length} plan${plans.length > 1 ? "s" : ""} ready — add your first customer to start MRR`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => d.setSubCustomerFormOpen(true)}
                style={{
                  marginTop: "2px",
                  padding: "9px 18px", borderRadius: "10px", border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                  color: "#fff", fontSize: "12.5px", fontWeight: 650, letterSpacing: "-0.01em",
                  boxShadow: "0 6px 16px rgba(124,58,237,0.2)",
                  display: "inline-flex", alignItems: "center", gap: "6px",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 2v7M2 5.5h7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {ko ? "고객 추가" : "Add customer"}
              </button>
            </div>
          ) : !plans.length && (
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(124,58,237,0.02)", fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
              {ko ? "먼저 [플랜] 탭에서 구독 플랜을 등록하세요" : "First register plans in the [Plans] tab"}
            </div>
          )}

          {/* Add customer form / button — subs 있을 때 작은 add 버튼만, 빈 상태는 위 hero가 처리 */}
          {plans.length > 0 && (activeSubs.length > 0 || d.subCustomerFormOpen) && (
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
                        background: (d.subCustomerName ?? "").trim() && d.subCustomerPlanId ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" : "rgba(25,25,112,0.05)",
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
              <summary style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", cursor: "pointer", userSelect: "none" }}>
                {ko ? "이탈 고객" : "Churned"} ({subs.filter((s) => s.status === "churned").length})
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "6px" }}>
                {subs.filter((s) => s.status === "churned").map((sub) => (
                  <div key={sub.id} style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px",
                    borderRadius: "8px", background: "rgba(15,23,42,0.015)", opacity: 0.6,
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a", flex: 1 }}>{sub.name}</span>
                    <button type="button" onClick={() => handleReactivate(sub.id)} style={{ fontSize: "10px", fontWeight: 650, padding: "2px 8px", borderRadius: "5px", border: "none", cursor: "pointer", background: "rgba(25,25,112,0.08)", color: "#1d3557" }}>
                      {ko ? "복구" : "Reactivate"}
                    </button>
                    <button type="button" onClick={() => handleDeleteSub(sub.id)} style={{ fontSize: "10px", fontWeight: 650, padding: "2px 8px", borderRadius: "5px", border: "none", cursor: "pointer", background: "rgba(182,76,76,0.06)", color: "#b64c4c" }}>
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
      {!isEmpty && tab === "plans" && (
        <>
          {plans.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {plans.map((plan, i) => {
                const c = getPlanColor(i);
                const subCount = subs.filter((s) => s.planId === plan.id && s.status !== "churned").length;
                const isInactive = !plan.isActive;
                return (
                  <div
                    key={plan.id}
                    className="bento-card sub-plan-card"
                    style={{
                      position: "relative" as const,
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 16px 14px 18px",
                      borderRadius: "14px",
                      background: isInactive
                        ? "rgba(15,23,42,0.015)"
                        : `linear-gradient(135deg, ${c.bg} 0%, rgba(255,255,255,0.92) 65%)`,
                      border: `1px solid ${isInactive ? "rgba(25,25,112,0.05)" : c.border}`,
                      opacity: isInactive ? 0.55 : 1,
                      overflow: "hidden",
                    }}
                  >
                    {/* Linear-style 좌측 accent bar (3px) */}
                    <div style={{
                      position: "absolute" as const, left: 0, top: 0, bottom: 0,
                      width: "3px",
                      background: isInactive
                        ? "rgba(15,23,42,0.15)"
                        : `linear-gradient(180deg, ${c.text} 0%, ${c.text}cc 100%)`,
                    }} />

                    {/* Stripe-style 이니셜 avatar */}
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "11px",
                      background: isInactive
                        ? "rgba(25,25,112,0.05)"
                        : `linear-gradient(135deg, ${c.text} 0%, ${c.text}d0 100%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "15px", fontWeight: 700,
                      color: isInactive ? "rgba(15,23,42,0.4)" : "#fff",
                      letterSpacing: "-0.02em", flexShrink: 0,
                      boxShadow: isInactive ? "none" : `0 4px 10px ${c.text}24`,
                    }}>
                      {plan.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Center: 이름 + chip · 가격 */}
                    <div style={{ minWidth: 0, display: "grid", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <span style={{
                          fontSize: "14.5px", fontWeight: 700, color: "#0f172a",
                          letterSpacing: "-0.015em",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                        }}>
                          {plan.name}
                        </span>
                        {subCount > 0 && (
                          <span style={{
                            fontSize: "10.5px", fontWeight: 650,
                            padding: "2px 8px", borderRadius: "999px",
                            background: isInactive ? "rgba(25,25,112,0.05)" : `${c.text}14`,
                            color: isInactive ? "rgba(15,23,42,0.45)" : c.text,
                            letterSpacing: "-0.005em", flexShrink: 0,
                            display: "inline-flex", alignItems: "center", gap: "3px",
                          }}>
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <circle cx="4.5" cy="3" r="1.5" fill="currentColor" />
                              <path d="M1.5 7.5c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                            </svg>
                            {subCount}{ko ? "명" : ""}
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: "flex", alignItems: "baseline", gap: "4px",
                        fontVariantNumeric: "tabular-nums" as const,
                      }}>
                        <span style={{
                          fontSize: "16px", fontWeight: 700, color: "#0f172a",
                          letterSpacing: "-0.025em",
                        }}>
                          {fmt(plan.price)}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                          / {plan.billingCycle === "monthly" ? (ko ? "월" : "mo") : (ko ? "연" : "yr")}
                        </span>
                      </div>
                    </div>

                    {/* Right: 미니멀 delete (기본은 subtle, hover 시 빨강) */}
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id)}
                      title={ko ? "플랜 삭제" : "Delete plan"}
                      className="sub-plan-delete"
                      style={{
                        width: "30px", height: "30px", borderRadius: "9px",
                        border: "none", background: "transparent",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--muted)",
                        transition: "background 0.15s ease, color 0.15s ease",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(182,76,76,0.08)";
                        e.currentTarget.style.color = "#b64c4c";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "rgba(15,23,42,0.3)";
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M3.5 3.5l6 6M9.5 3.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
                  background: (d.subPlanName ?? "").trim() && (d.subPlanPrice ?? "") ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" : "rgba(25,25,112,0.05)",
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
