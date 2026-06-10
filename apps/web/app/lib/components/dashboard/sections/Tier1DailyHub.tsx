"use client";

/**
 * Tier 1.1–1.2 — 데일리 허브 (매일 30초 사용성).
 *
 * ── 운영 대시보드 목적 (2026-05-12 명문화) ──────────────────────────────
 * 단순 보여주기 X. 사장님이 *사업의 현 상황을 파악·대비·다음 행동 개시* 가능.
 *
 *   ① 상황 파악: CEOMorningHero (AI 해석 hero) + ActivitySnapshot (매출 raw 차트)
 *      → 22 자료 검증: "최대 2 hero, 3개부터 cancel out" (UI patterns / Hero Anti-Pattern)
 *   ② 대비:     CashflowHero (런웨이) + PLHero (손익 추세)
 *   ③ 행동:     CEOMorningHero 내부 단일 우선순위 액션 (이미 통합 — Phase 1a)
 *
 * Phase 1b (2026-05-12): Tier 1 5분할 → 1+3 layout 재배치
 *   · UserActivityCard 를 Tier 2 (Weekly Pulse) 로 이동 — 일간 hero level 부적합
 *   · ActivitySnapshot 단독 full-width (매출 raw 차트가 작아지면 의미 손실)
 *   · Cashflow + PL 만 2-col supporting
 *
 * 카드 목록 (위→아래):
 *   - Tier 1.1: ActivitySnapshotCard (단독 full-width — 매출 raw 차트 hero #2)
 *   - Tier 1.2: CashflowHeroCard + PLHeroCard (2-col, 980px↑) — "대비"
 *   - Tier 1.2 (KPI): DailyKpiStrip — 업종별 5칸 KPI 보조
 *
 * KPI Strip 셀 매핑:
 *   - 매출/고객 (외식·소매·뷰티 등): yesterday-sales, yesterday-customers, prime-cost, cash-runway, avg-ticket
 *   - SaaS/스타트업 (자동 수집): active-users, cumulative-users, wau, net-new, mrr, nrr, arpu
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import { BP } from "../../../breakpoints";
import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { ActivitySnapshotCard } from "../ActivitySnapshotCard";
import { UserActivityCard } from "../UserActivityCard";
import { CashflowHeroCard } from "../CashflowHeroCard";
import { PLHeroCard } from "../PLHeroCard";
import { DailyKpiStrip, type KpiValue } from "../DailyKpiStrip";
import { useProfileStore } from "../../../stores/profile-store";

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
  nextStaggerStyle: () => React.CSSProperties;
  onOpenCalendar: () => void;
};

export function Tier1DailyHub({ d, c, ko, fmt, nextStaggerStyle, onOpenCalendar }: Props) {
  // 사장님이 숨긴 카드 목록 — 마이페이지 > 대시보드 카드 표시에서 토글.
  // essential 카드(activity-snapshot, cashflow-hero)는 메타에서 숨김 불가 처리.
  const hiddenCards = useProfileStore((s) => s.hiddenCards);
  const showUserActivity = !hiddenCards.includes("user-activity");
  const showPLHero = !hiddenCards.includes("pl-hero");
  const showDailyKpi = !hiddenCards.includes("daily-kpi-strip");

  return (
    <>
      {/* Tier 1.1 — 매출 흐름 + 사용자 변화 (2-col).
          2026-05-12 사장님 결정: UserActivity 는 *매일 보는 사용자 수 변화* 로 유지. */}
      <div className="dash-stagger-item" style={nextStaggerStyle()}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              showUserActivity && c.viewportWidth >= BP.xl
                ? "minmax(0, 1.35fr) minmax(0, 1fr)"
                : "1fr",
            gap: "14px",
            alignItems: "stretch",
          }}
        >
          <ActivitySnapshotCard
            d={d}
            ko={ko}
            todayStr={c.todayStr}
            recent7Entries={c.recent7Entries}
            recent7Sales={c.recent7Sales}
            weeklySalesChange={c.weeklySalesChange}
            todayEntry={c.todayEntry}
            avgDailySales={c.avgDailySales}
            fmt={fmt}
            onOpenCalendar={onOpenCalendar}
          />
          {showUserActivity && (
            <UserActivityCard
              d={d}
              ko={ko}
              todayStr={c.todayStr}
              recent7Entries={c.recent7Entries}
              todayEntry={c.todayEntry}
              fmt={fmt}
            />
          )}
        </div>
      </div>

      {/* Tier 1.2 — 현금흐름 + 손익 (2-col → 손익 숨김 시 1-col) */}
      <div
        className="dash-stagger-item"
        style={{
          ...nextStaggerStyle(),
          display: "grid",
          gap: "14px",
          gridTemplateColumns: showPLHero && c.isWide ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
          alignItems: "stretch",
        }}
      >
        <CashflowHeroCard
          ko={ko}
          dailyEntries={c.allEntries}
          fallbackMonthlyCostsTotal={c.totalCosts}
        />
        {showPLHero && <PLHeroCard
          totalSales={c.totalSales}
          totalCosts={c.totalCosts}
          netProfit={c.netProfit}
          bepProgress={c.bepProgress}
          ingredientRatio={c.ingredientRatio}
          laborRatio={c.laborRatio}
          rentRatio={c.rentRatio}
          primeCost={c.primeCost}
          projectedProfit={c.projectedProfit}
          workingDays={c.workingDays}
          ko={ko}
          fmt={fmt}
          prevMonthSales={c.prevMonthSales}
          prevMonthCosts={c.prevMonthCosts}
          breakEvenDailySales={c.breakEvenDailySales}
          breakEvenMonthlySales={c.healthMetrics.breakEvenMonthlySales}
          todaySales={c.todaySales}
          todayBepProgress={c.todayBepProgress}
          daysAboveBreakEven={c.daysAboveBreakEven}
          totalDaysRecorded={c.healthMetrics.totalDaysRecorded}
          ratiosReady={c.ratiosReady}
          monthlyRevenueEquivalent={c.monthlyRevenueEquivalent}
          cogsLabel={d.businessCtx.expenseFields?.[0]?.label}
          expenseFields={d.businessCtx.expenseFields?.map((f) => ({
            fieldKey: f.fieldKey,
            label: f.label,
          }))}
        />}
      </div>

      {/* Tier 1.2 — 업종별 5칸 KPI Strip */}
      {showDailyKpi && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <DailyKpiStrip
            ko={ko}
            industryCategoryId={d.businessCtx.categoryId ?? undefined}
            values={buildKpiValues(d, c, ko)}
          />
        </div>
      )}
    </>
  );
}

// ─── KPI Strip 값 매핑 (업종별 cell.id 매칭) ──────────────────────
function buildKpiValues(
  d: DashboardHook,
  c: DashboardComputed,
  ko: boolean,
): Record<string, KpiValue | undefined> {
  const lastEntry = c.allEntries[c.allEntries.length - 1];
  const prevWeekSameDay = c.allEntries[c.allEntries.length - 8];
  const yesterdaySales = lastEntry?.sales ?? null;
  const yesterdayCustomers = lastEntry?.customers ?? null;
  // ⚠️ 2026-05-18: falsy 0 회피 — prevWeekSameDay.sales===0 (정당한 휴무일) vs undefined (미입력)
  //   구분. `!= null && > 0` 명시.
  const ySalesTrend =
    yesterdaySales != null && prevWeekSameDay?.sales != null && prevWeekSameDay.sales > 0
      ? ((yesterdaySales - prevWeekSameDay.sales) / prevWeekSameDay.sales) * 100
      : undefined;
  const yCustTrend =
    yesterdayCustomers != null && prevWeekSameDay?.customers != null && prevWeekSameDay.customers > 0
      ? ((yesterdayCustomers - prevWeekSameDay.customers) / prevWeekSameDay.customers) * 100
      : undefined;
  // ⚠️ 2026-06-10 (P1-5): prime-cost/cogs/labor/rent 비율은 SSOT(useDashboardComputed)의
  //   보정값만 사용. 종전엔 `월비용 ÷ MTD 매출` 생나눗셈 → 월초(부분월 입력) 시 200%+ 폭주.
  //   calculateCostRatios 가 월 환산 매출(monthlyRevenueEquivalent)로 나눠 부분월 보정.
  //   ratiosReady===false 면 모든 비율 undefined → "준비 중" empty state.
  const primeCost = c.ratiosReady ? c.primeCost : null;
  const cogsRatio = c.ratiosReady ? c.ingredientRatio : null;
  const laborRatio = c.ratiosReady ? c.laborRatio : null;
  const rentRatio = c.ratiosReady ? c.rentRatio : null;
  const selectedBudget = (d.selectedBudget ?? 0) as number;
  const cashRunway =
    c.totalCosts > 0 && selectedBudget > 0 ? selectedBudget / c.totalCosts : null;
  const avgTicket = c.totalCustomers > 0 ? c.totalSales / c.totalCustomers : null;

  // SaaS — GA4/Webhook 자동 수집 우선, 없으면 사장님이 입력한 subscribers.active fallback
  const subs = (d as { subscribers?: { active?: number } }).subscribers;
  const manualActive = subs?.active ?? null;
  const autoActiveUsers = c.saasMetrics.latest?.active_users ?? null;
  const autoCumulativeUsers = c.saasMetrics.latest?.cumulative_users ?? null;
  const autoWau = c.saasMetrics.latest?.weekly_active_users ?? null;
  const autoNewUsers = c.saasMetrics.latest?.new_users ?? null;
  const activeUsers = autoActiveUsers ?? manualActive;
  // ⚠️ cumulative ≠ active. 자동 수집 데이터가 없으면 누적 수치 자체가 불명확하므로 manual active
  //   로 대체하면 의미 왜곡. 데이터 없을 때 undefined 로 두어 "준비 중" 표시되도록 한다.
  const cumulativeUsers = autoCumulativeUsers;

  // ⚠️ MRR fix (2026-06-10, P1-6): 종전엔 GA4 active_users(= 방문 활성 사용자, *유료 구독자 아님*)
  //   × 평균 플랜가로 계산 → 허수 MRR. MRR 정의는 "확정 유료 구독자 × 플랜 가격" 이므로
  //   Tier3 와 동일하게 누적 planSignups − planChurns(확정 구독 이벤트)로만 계산한다.
  //   구독 이벤트가 하나도 없으면 undefined → "준비 중" (연동/입력 유도). active_users 로 대체 금지.
  const plans = (d as { subscriptionPlans?: Array<{ id: string; price: number; isActive: boolean }> }).subscriptionPlans ?? [];
  const planPriceMap = new Map(plans.map((p) => [p.id, p.price]));
  const subEntries = c.allEntries as Array<{
    planSignups?: Record<string, number>;
    planChurns?: Record<string, number>;
  }>;
  const activeByPlan: Record<string, number> = {};
  let hasSubEvents = false;
  for (const e of subEntries) {
    if (e.planSignups) {
      hasSubEvents = true;
      for (const [pid, n] of Object.entries(e.planSignups)) {
        activeByPlan[pid] = (activeByPlan[pid] ?? 0) + (n ?? 0);
      }
    }
    if (e.planChurns) {
      for (const [pid, n] of Object.entries(e.planChurns)) {
        activeByPlan[pid] = (activeByPlan[pid] ?? 0) - (n ?? 0);
      }
    }
  }
  const computedMrr = hasSubEvents
    ? Math.round(
        Object.entries(activeByPlan).reduce(
          (s, [pid, count]) => s + Math.max(0, count) * (planPriceMap.get(pid) ?? 0),
          0,
        ),
      )
    : null;

  return {
    "yesterday-sales": { value: yesterdaySales, trendPct: ySalesTrend },
    "yesterday-customers": { value: yesterdayCustomers, trendPct: yCustTrend },
    "prime-cost": { value: primeCost ?? undefined },
    "cash-runway": { value: cashRunway ?? undefined },
    "avg-ticket": { value: avgTicket ?? undefined },
    "cogs-ratio": { value: cogsRatio ?? undefined },
    "labor-ratio": { value: laborRatio ?? undefined },
    "rent-ratio": { value: rentRatio ?? undefined },
    "inventory-days": { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    "booking-utilization": { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    "seat-utilization": { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    "renewal-rate": { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    "repeat-rate": { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    "active-members": { value: activeUsers ?? undefined },
    "active-users": { value: activeUsers ?? undefined },
    "cumulative-users": cumulativeUsers != null
      ? { value: cumulativeUsers }
      : { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    wau:
      autoWau != null
        ? { value: autoWau }
        : { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    "pmf-score": { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    mrr: computedMrr != null
      ? { value: computedMrr }
      : { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    "net-new":
      autoNewUsers != null
        ? { value: autoNewUsers }
        : { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    nrr: { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    arpu: { value: avgTicket ?? undefined },
  };
}
