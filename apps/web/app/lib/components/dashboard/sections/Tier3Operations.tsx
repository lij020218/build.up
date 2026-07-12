"use client";

/**
 * Tier 3 — 운영 관리 (DeepDive, 월/주 단위).
 *
 * 카드 목록 (위→아래):
 *   - SubscriptionEnableNudge   — 스타트업 구독제 활성화 안내 (스타트업 + 미사용)
 *   - SaaSKeyMetricsCard         — MRR/신규/전환율/이탈률 (usesSubscriptions)
 *   - SubscriptionPlanManager + Webhook — 구독 플랜 관리 (usesSubscriptions)
 *   - CustomerSummaryCard        — 고객 요약 (showCustomerCard, !subs, 재고 업종만 — 재고 없는 업종은 Tier 1.5 담당)
 *   - 인기 상품 + 최근 활동       — inventoryMode != minimal && !(startup + subs)
 *
 *  ⚠️ 이동 (2026-05-07): InventoryOpsCard·TeamCard 는 사장님 요청으로 Tier 1.5 상단 이동.
 *      → `Tier1_5Coaching.tsx` 의 운영 리츄얼 직후 블록 참조.
 *
 * 동적 레이아웃: 카드 갯수에 따라 cols 자동 (4개+maxCols=3 → cols=2 균등 등).
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import { BarChart3, TrendingUp, Lightbulb } from "lucide-react";
import { BP } from "../../../breakpoints";
import { useProfileStore } from "../../../stores/profile-store";
import { shouldShowCardByIndustry } from "../../../industry-card-matrix";
import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { DeepDiveSection } from "../DeepDiveSection";
import { SubscriptionPlanManager } from "../SubscriptionPlanManager";
import { CustomerSummaryCard } from "../CustomerSummaryCard";
import { SubscriptionWebhookConnectCard } from "../../profile/SubscriptionWebhookConnectCard";
import { opsCard, opsHeader, sectionEyebrow, emptyState } from "../operationalStyles";
import { getKstMonthKey, prevMonthKey } from "../../../utils/business-day";

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
  nextStaggerStyle: () => React.CSSProperties;
};

export function Tier3Operations({ d, c, ko, fmt, nextStaggerStyle }: Props) {
  // 2026-07-12 — 고객 카드 이중 렌더·숨김 무시 수정 + 빈 섹션 껍데기 방지.
  //   재고 카드 없는 업종(fitness/education/space 등)은 Tier 1.5 가 고객 카드를 이미 표시
  //   (Tier1_5Coaching: `showCustomer && !showInventory`). 종전 Tier 3 조건은 이 배타를
  //   안 봐서 같은 카드가 두 번 렌더됐고, 마이페이지 숨김 토글(customer-summary)도 무시했다.
  //   → Tier 3 는 "재고 카드가 Tier 1.5 에 뜨는 업종"에서만 고객 카드 담당 + hide 존중.
  //   그 결과 이 섹션이 통째로 빌 수 있으므로(예: fitness), 내용 없으면 헤더도 렌더하지 않는다.
  const hiddenCards = useProfileStore((s) => s.hiddenCards);
  const hide = (id: string) => hiddenCards.includes(id);
  const inventoryShownInCoaching =
    !c.usesSubscriptions &&
    d.businessCtx.showInventoryCard &&
    !hide("inventory-ops") &&
    shouldShowCardByIndustry("inventory-ops", d.industryCategoryId as import("../../../industry-card-matrix").IndustryId | undefined);
  const showCustomerHere =
    !c.usesSubscriptions && d.businessCtx.showCustomerCard && !hide("customer-summary") && inventoryShownInCoaching;
  const showSaasMetrics = c.usesSubscriptions && !c.isStartupCompany;
  const showPopular =
    (d.businessCtx.inventoryMode as string) !== "minimal" && !(c.isStartupCompany && c.usesSubscriptions);
  if (!showSaasMetrics && !c.usesSubscriptions && !showCustomerHere && !showPopular) return null;

  return (
    <DeepDiveSection
      id="ops-mgmt"
      title={ko ? "운영 관리" : "Operations"}
      subtitle={
        ko
          ? "구독 · 고객 · 인기 상품 · 최근 활동"
          : "Subscription · Customer · Top items · Activity"
      }
      defaultOpen={false}
      ko={ko}
    >
      {/* 스타트업: 구독제 활성화 안내 — 2026-05 Tier 1.5 로 이동 (startup-tech 사용자)
          Tier 3 는 비-스타트업 구독 사용자(예: 뷰티 멤버십)에게만 의미 */}

      {/* SaaS 핵심 지표 — 2026-05 startup-tech 는 Tier 1.5 에서, 그 외만 여기 */}
      {showSaasMetrics && <SaaSKeyMetricsCard d={d} c={c} ko={ko} fmt={fmt} nextStaggerStyle={nextStaggerStyle} />}

      {/* 동적 카드 그리드 (구독·고객) — 고객 카드 게이팅은 위에서 계산해 prop 으로 전달 */}
      <DynamicOpsCardGrid d={d} c={c} ko={ko} fmt={fmt} nextStaggerStyle={nextStaggerStyle} showCustomer={showCustomerHere} />

      {/* 인기 상품 + 최근 활동 */}
      {showPopular && (
        <PopularProductsAndActivity d={d} c={c} ko={ko} fmt={fmt} nextStaggerStyle={nextStaggerStyle} />
      )}
    </DeepDiveSection>
  );
}

// ─── 1. 구독제 활성화 안내 ────────────────────────────────────────

export function SubscriptionEnableNudge({
  ko,
  onEnable,
  nextStaggerStyle,
}: {
  ko: boolean;
  onEnable: () => void;
  nextStaggerStyle: () => React.CSSProperties;
}) {
  return (
    <article
      style={{
        ...nextStaggerStyle(),
        borderRadius: "20px",
        border: "1px solid rgba(124,58,237,0.08)",
        background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, #fff 100%)",
        padding: "20px 22px",
        marginTop: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
      className="bento-card dash-stagger-item"
    >
      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
          {ko ? "구독제를 운영하시나요?" : "Do you run a subscription model?"}
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px", lineHeight: 1.5 }}>
          {ko
            ? "켜면 MRR·이탈률·플랜별 가입 추적이 활성화됩니다"
            : "Enable to track MRR, churn rate, and plan-level signups"}
        </div>
      </div>
      <button
        type="button"
        onClick={onEnable}
        style={{
          padding: "10px 20px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 650,
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(124,58,237,0.2)",
        }}
      >
        {ko ? "활성화" : "Enable"}
      </button>
    </article>
  );
}

// ─── 2. SaaS 핵심 지표 (MRR/신규/전환/이탈) ────────────────────────

type PlanEntry = {
  date: string;
  sales: number;
  customers?: number;
  planSignups?: Record<string, number>;
  planChurns?: Record<string, number>;
};

export function SaaSKeyMetricsCard({
  d,
  c,
  ko,
  fmt,
  nextStaggerStyle,
}: {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
  nextStaggerStyle: () => React.CSSProperties;
}) {
  const typed = c.allEntries as PlanEntry[];
  const curKey = getKstMonthKey();
  const monthEntries = typed.filter((e) => e.date.startsWith(curKey));
  const prevKey = prevMonthKey(curKey);
  const prevEntries = typed.filter((e) => e.date.startsWith(prevKey));

  const plans = (d.subscriptionPlans ?? []) as Array<{
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }>;
  const planPriceMap = new Map(plans.map((p) => [p.id, p.price]));

  // ⚠️ MRR fix (2026-05-18 audit): 종전엔 monthEntries.reduce(sales) 로 MTD 매출 합계를 MRR 이라
  //   잘못 표시. MRR 의 정의는 "월 단위 반복 매출 = 활성 구독자 수 × 플랜 가격" 이므로 누적
  //   planSignups - planChurns 로 활성 구독자를 구하고 플랜별 가격을 곱한다. plan 데이터 없으면
  //   카드 자체 빈 상태 (NaN 표시 방지).
  const activeByPlan: Record<string, number> = {};
  typed.forEach((e) => {
    if (e.planSignups) {
      for (const [pid, n] of Object.entries(e.planSignups)) {
        activeByPlan[pid] = (activeByPlan[pid] ?? 0) + (n ?? 0);
      }
    }
    if (e.planChurns) {
      for (const [pid, n] of Object.entries(e.planChurns)) {
        activeByPlan[pid] = (activeByPlan[pid] ?? 0) - (n ?? 0);
      }
    }
  });
  const mrr = Object.entries(activeByPlan).reduce(
    (s, [pid, count]) => s + Math.max(0, count) * (planPriceMap.get(pid) ?? 0),
    0,
  );

  // 전월 활성 (= 이번달 전까지 누적) — 동일 방식으로 prevMrr 산출
  const prevActiveByPlan: Record<string, number> = {};
  typed
    .filter((e) => e.date < `${curKey}-01`)
    .forEach((e) => {
      if (e.planSignups) {
        for (const [pid, n] of Object.entries(e.planSignups)) {
          prevActiveByPlan[pid] = (prevActiveByPlan[pid] ?? 0) + (n ?? 0);
        }
      }
      if (e.planChurns) {
        for (const [pid, n] of Object.entries(e.planChurns)) {
          prevActiveByPlan[pid] = (prevActiveByPlan[pid] ?? 0) - (n ?? 0);
        }
      }
    });
  const prevMrr = Object.entries(prevActiveByPlan).reduce(
    (s, [pid, count]) => s + Math.max(0, count) * (planPriceMap.get(pid) ?? 0),
    0,
  );
  const mrrGrowth = prevMrr > 0 ? Math.round(((mrr - prevMrr) / prevMrr) * 100) : 0;

  const monthSignups = monthEntries.reduce((s, e) => {
    if (!e.planSignups) return s + (e.customers ?? 0);
    return s + Object.values(e.planSignups).reduce((a, b) => a + b, 0);
  }, 0);
  const monthChurns = monthEntries.reduce((s, e) => {
    if (!e.planChurns) return s;
    return s + Object.values(e.planChurns).reduce((a, b) => a + b, 0);
  }, 0);
  // ⚠️ churnRate fix: 분모는 *이번달 시작 시점의 활성 구독자수* (= prevActiveByPlan 합) 가 표준.
  //   종전 prevSignups (전월 신규) 는 SaaS churn 정의와 무관.
  const activeAtMonthStart = Object.values(prevActiveByPlan).reduce(
    (s, n) => s + Math.max(0, n),
    0,
  );
  const churnRate = activeAtMonthStart > 0
    ? Math.max(0, Math.round((monthChurns / activeAtMonthStart) * 100))
    : 0;
  const netNew = monthSignups - monthChurns;
  // convRate 는 visitor → signup 퍼널 데이터가 없으면 정의 불가 — 종전 마법상수 *100 공식은 의미
  //   없으므로 제거. 데이터가 들어오기 전엔 -1 (UI 가 hidden / "준비 중" 표시) 로 둔다.
  const convRate = -1;
  const planBreakdown = plans
    .filter((p) => p.isActive)
    .map((p) => {
      const count = monthEntries.reduce((s, e) => s + (e.planSignups?.[p.id] ?? 0), 0);
      return { name: p.name, count, revenue: count * p.price };
    })
    .filter((p) => p.count > 0);

  return (
    <article
      style={{
        ...nextStaggerStyle(),
        borderRadius: "20px",
        border: "1px solid rgba(124,58,237,0.08)",
        background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, #fff 100%)",
        padding: "20px 22px",
        marginTop: "14px",
      }}
      className="bento-card dash-stagger-item"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          {ko ? "SaaS 핵심 지표" : "SaaS Key Metrics"}
        </span>
        <button
          type="button"
          onClick={() => d.navigateToSurface("analytics")}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#7c3aed",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {ko ? "상세 →" : "Details →"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: c.isWide ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: "10px" }}>
        <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(124,58,237,0.03)" }}>
          <div style={{ fontSize: "11px", fontWeight: 650, color: "var(--muted)", marginBottom: "6px" }}>MRR</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#7c3aed", letterSpacing: "-0.02em" }}>{fmt(mrr)}</div>
          {mrrGrowth !== 0 && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: mrrGrowth > 0 ? "#1d3557" : "#b64c4c",
                marginTop: "3px",
              }}
            >
              {mrrGrowth > 0 ? "+" : ""}
              {mrrGrowth}% MoM
            </div>
          )}
        </div>
        <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(25,25,112,0.03)" }}>
          <div style={{ fontSize: "11px", fontWeight: 650, color: "var(--muted)", marginBottom: "6px" }}>
            {ko ? "이달 신규" : "New MTD"}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#191970", letterSpacing: "-0.02em" }}>
            +{monthSignups.toLocaleString()}
          </div>
          {netNew !== monthSignups && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: netNew >= 0 ? "#1d3557" : "#b64c4c",
                marginTop: "3px",
              }}
            >
              net {netNew >= 0 ? "+" : ""}
              {netNew}
            </div>
          )}
        </div>
        <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(25,25,112,0.03)" }}>
          <div style={{ fontSize: "11px", fontWeight: 650, color: "var(--muted)", marginBottom: "6px" }}>
            {ko ? "전환율" : "Conversion"}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1d3557" }}>
            {convRate > 0 ? `${convRate}%` : "—"}
          </div>
        </div>
        <div
          style={{
            padding: "14px",
            borderRadius: "14px",
            background: churnRate > 10 ? "rgba(182,76,76,0.04)" : "rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 650, color: "var(--muted)", marginBottom: "6px" }}>
            {ko ? "이탈률" : "Churn"}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: churnRate > 10 ? "#b64c4c" : "#0f172a" }}>
            {churnRate > 0 ? `${churnRate}%` : "—"}
          </div>
        </div>
      </div>
      {planBreakdown.length > 0 && (
        <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {planBreakdown.map((p) => (
            <span
              key={p.name}
              style={{
                fontSize: "11px",
                fontWeight: 650,
                padding: "4px 10px",
                borderRadius: "8px",
                background: "rgba(124,58,237,0.05)",
                color: "#7c3aed",
              }}
            >
              {p.name}: {p.count}
              {ko ? "건" : ""} ({fmt(p.revenue)})
            </span>
          ))}
        </div>
      )}
      {c.allEntries.length === 0 && (
        <div
          style={{
            marginTop: "8px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(124,58,237,0.03)",
            fontSize: "12px",
            color: "var(--muted)",
            lineHeight: 1.5,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Lightbulb size={13} strokeWidth={1.5} color="#191970" />
          {ko
            ? "매출을 기록하면 MRR·유저·전환율·이탈률이 자동 계산됩니다"
            : "Log revenue to auto-calculate MRR, users, conversion, churn"}
        </div>
      )}
    </article>
  );
}

// ─── 3. 동적 카드 그리드 (구독·재고·고객·팀) ────────────────────

function DynamicOpsCardGrid({
  d,
  c,
  ko,
  fmt,
  nextStaggerStyle,
  showCustomer,
}: {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
  nextStaggerStyle: () => React.CSSProperties;
  /** 고객 카드 표시 여부 — 게이팅(이중 렌더 배타·hide)은 Tier3Operations 래퍼에서 단일 계산. */
  showCustomer: boolean;
}) {
  const cards: React.ReactNode[] = [];
  if (c.usesSubscriptions) {
    cards.push(
      <div key="sub" id="subscription-manager" style={{ scrollMarginTop: "80px" }}>
        <SubscriptionPlanManager d={d} ko={ko} fmt={fmt} />
      </div>,
    );
    cards.push(<SubscriptionWebhookConnectCard key="webhook-connect" ko={ko} />);
  }
  if (showCustomer) {
    cards.push(<CustomerSummaryCard key="cust" d={d} ko={ko} fmt={fmt} />);
  }

  // 그리드에 표시할 카드가 없으면 row 자체를 렌더하지 않음
  if (cards.length === 0) return null;

  // 동적 cols — 마지막 행에 1개만 떨어지면 cols 한 단계 줄여 균등화.
  const maxCols = c.isThreeUp ? 3 : c.isWide ? 2 : 1;
  let cols = maxCols;
  while (cols > 1 && cards.length > cols && cards.length % cols === 1) cols--;
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < cards.length; i += cols) rows.push(cards.slice(i, i + cols));

  return (
    <>
      {rows.map((rowCards, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="dash-stagger-item"
          style={{
            ...nextStaggerStyle(),
            display: "grid",
            gridTemplateColumns: `repeat(${rowCards.length}, minmax(0, 1fr))`,
            gap: "14px",
            marginTop: rowIdx === 0 ? "14px" : 0,
            alignItems: "stretch",
          }}
        >
          {rowCards}
        </div>
      ))}
    </>
  );
}

// ─── 5. 인기 상품 + 최근 활동 ──────────────────────────────────

function PopularProductsAndActivity({
  d,
  c,
  ko,
  fmt,
  nextStaggerStyle,
}: {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
  nextStaggerStyle: () => React.CSSProperties;
}) {
  const products = (d.products as Array<{
    id: string;
    name: string;
    monthlySales?: number;
    price?: number;
  }>) ?? [];

  return (
    <div
      className="dash-stagger-item"
      style={{
        ...nextStaggerStyle(),
        display: "grid",
        gridTemplateColumns: c.viewportWidth >= BP.md ? "1fr 1fr" : "1fr",
        gap: "16px",
        marginTop: "14px",
      }}
    >
      {/* 인기 상품 */}
      <div style={opsCard} className="bento-card">
        <div style={opsHeader}>
          <div>
            <div style={sectionEyebrow}>{ko ? "이번 달" : "This Month"}</div>
            <div style={{ fontSize: "17px", fontWeight: 650, letterSpacing: "-0.02em", color: "#0f172a" }}>
              {ko
                ? d.businessCtx.inventoryMode === "service"
                  ? "인기 서비스"
                  : d.businessCtx.inventoryMode === "minimal"
                    ? "인기 프로그램"
                    : "인기 상품"
                : "Top Products"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
              {ko ? "매출 기준 상위 항목" : "Best selling products this month"}
            </div>
          </div>
        </div>
        {products.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {products
              .sort((a, b) => (b.monthlySales ?? 0) * (b.price ?? 0) - (a.monthlySales ?? 0) * (a.price ?? 0))
              .slice(0, 4)
              .map((product, i) => {
                const revenue = (product.monthlySales ?? 0) * (product.price ?? 0);
                const maxRevenue = Math.max(
                  ...products.map((p) => (p.monthlySales ?? 0) * (p.price ?? 0)),
                  1,
                );
                const percent = Math.round((revenue / maxRevenue) * 100);
                return (
                  <div
                    key={product.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "2px" }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {product.monthlySales ?? 0}
                        {ko ? "개 판매" : " sales"}
                      </div>
                      <div
                        style={{
                          height: "4px",
                          borderRadius: "2px",
                          background: "rgba(25,25,112,0.08)",
                          marginTop: "6px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: "2px",
                            width: `${percent}%`,
                            background: i === 0 ? "#191970" : "rgba(25,25,112,0.4)",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 650,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(revenue)}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={emptyState}>
            {ko
              ? "상품을 등록하면 매출 순위가 여기에 표시됩니다"
              : "Add products to see sales ranking here"}
          </div>
        )}
      </div>

      {/* 최근 활동 */}
      <div style={opsCard} className="bento-card">
        <div style={opsHeader}>
          <div>
            <div style={sectionEyebrow}>{ko ? "최근" : "Recent"}</div>
            <div style={{ fontSize: "17px", fontWeight: 650, letterSpacing: "-0.02em", color: "#0f172a" }}>
              {ko ? "최근 활동" : "Recent Activity"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
              {ko ? "대시보드 최근 이벤트" : "Latest events and updates"}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {c.recent7Entries.length > 0 ? (
            c.recent7Entries
              .slice(-5)
              .reverse()
              .map((entry, i) => (
                <div
                  key={entry.date}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: i === 0 ? "rgba(25,25,112,0.04)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background:
                        entry.sales > c.avgDailySales
                          ? "rgba(29,53,87,0.14)" // 평균 이상 = 양호(네이비 success). 신호등 그린 폐기(2026-06-16)
                          : "rgba(25,25,112,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {entry.sales > c.avgDailySales ? (
                      <TrendingUp size={14} strokeWidth={1.5} color="#1d3557" />
                    ) : (
                      <BarChart3 size={14} strokeWidth={1.5} color="#191970" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                      {ko ? "매출 기록" : "Sales recorded"} — {fmt(entry.sales)}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                      {ko ? `고객 ${entry.customers}명` : `${entry.customers} customers`} ·{" "}
                      {entry.date.slice(5).replace("-", "/")}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {(() => {
                      // ⚠️ 2026-05-18: 종전엔 `i + 1` 이 5건 reverse 인덱스라 사장님이 월·수만
                      //   입력하면 "3일 전" 같은 잘못된 라벨. 실제 날짜 차로 계산.
                      const daysAgo = Math.max(0, Math.round(
                        (Date.now() - new Date(`${entry.date}T00:00:00`).getTime()) / 86400000
                      ));
                      if (daysAgo === 0) return ko ? "오늘" : "Today";
                      if (daysAgo === 1) return ko ? "어제" : "Yesterday";
                      return `${daysAgo}${ko ? "일 전" : "d ago"}`;
                    })()}
                  </div>
                </div>
              ))
          ) : (
            <div style={emptyState}>
              {ko
                ? "매출을 기록하면 활동 내역이 여기에 표시됩니다"
                : "Record sales to see activity here"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
