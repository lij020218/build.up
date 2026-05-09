"use client";

/**
 * Tier 1.1–1.2 — 데일리 허브 (매일 30초 사용성).
 *
 * 카드 목록 (위→아래):
 *   - Tier 1.1: ActivitySnapshotCard + UserActivityCard (2-col, 1100px↑)
 *   - Tier 1.2: CashflowHeroCard + PLHeroCard (2-col, 980px↑)
 *   - Tier 1.2 (KPI): DailyKpiStrip — 업종별 5칸 KPI (cell.id 자동 분기)
 *
 * KPI Strip 셀 매핑:
 *   - 매출/고객 (외식·소매·뷰티 등): yesterday-sales, yesterday-customers, prime-cost, cash-runway, avg-ticket
 *   - SaaS/스타트업 (자동 수집): active-users, cumulative-users, wau, net-new, mrr, nrr, arpu
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { ActivitySnapshotCard } from "../ActivitySnapshotCard";
import { UserActivityCard } from "../UserActivityCard";
import { CashflowHeroCard } from "../CashflowHeroCard";
import { PLHeroCard } from "../PLHeroCard";
import { DailyKpiStrip, type KpiValue } from "../DailyKpiStrip";

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
  nextStaggerStyle: () => React.CSSProperties;
  onOpenCalendar: () => void;
};

export function Tier1DailyHub({ d, c, ko, fmt, nextStaggerStyle, onOpenCalendar }: Props) {
  return (
    <>
      {/* Tier 1.1 — 매출 흐름 + 사용자 변화 (2-col) */}
      <div className="dash-stagger-item" style={nextStaggerStyle()}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              c.viewportWidth >= 1100 ? "minmax(0, 1.35fr) minmax(0, 1fr)" : "1fr",
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
          <UserActivityCard
            d={d}
            ko={ko}
            todayStr={c.todayStr}
            recent7Entries={c.recent7Entries}
            todayEntry={c.todayEntry}
            fmt={fmt}
          />
        </div>
      </div>

      {/* Tier 1.2 — 현금흐름 + 손익 (2-col) */}
      <div
        className="dash-stagger-item"
        style={{
          ...nextStaggerStyle(),
          display: "grid",
          gap: "14px",
          gridTemplateColumns: c.isWide ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
          alignItems: "stretch",
        }}
      >
        <CashflowHeroCard
          ko={ko}
          dailyEntries={c.allEntries}
          fallbackMonthlyCostsTotal={c.totalCosts}
        />
        <PLHeroCard
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
          todaySales={c.todaySales}
          todayBepProgress={c.todayBepProgress}
          daysAboveBreakEven={c.daysAboveBreakEven}
          totalDaysRecorded={c.healthMetrics.totalDaysRecorded}
          cogsLabel={d.businessCtx.expenseFields?.[0]?.label}
          expenseFields={d.businessCtx.expenseFields?.map((f) => ({
            fieldKey: f.fieldKey,
            label: f.label,
          }))}
        />
      </div>

      {/* Tier 1.2 — 업종별 5칸 KPI Strip */}
      <div className="dash-stagger-item" style={nextStaggerStyle()}>
        <DailyKpiStrip
          ko={ko}
          industryCategoryId={d.businessCtx.categoryId ?? undefined}
          values={buildKpiValues(d, c, ko)}
        />
      </div>
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
  const ySalesTrend =
    yesterdaySales != null && prevWeekSameDay?.sales
      ? ((yesterdaySales - prevWeekSameDay.sales) / prevWeekSameDay.sales) * 100
      : undefined;
  const yCustTrend =
    yesterdayCustomers != null && prevWeekSameDay?.customers
      ? ((yesterdayCustomers - prevWeekSameDay.customers) / prevWeekSameDay.customers) * 100
      : undefined;
  const primeCost =
    c.totalSales > 0
      ? ((c.monthlyCosts.ingredients + c.monthlyCosts.labor) / c.totalSales) * 100
      : null;
  const selectedBudget = (d.selectedBudget ?? 0) as number;
  const cashRunway =
    c.totalCosts > 0 && selectedBudget > 0 ? selectedBudget / c.totalCosts : null;
  const avgTicket = c.totalCustomers > 0 ? c.totalSales / c.totalCustomers : null;
  const cogsRatio =
    c.totalSales > 0 && c.monthlyCosts.ingredients
      ? (c.monthlyCosts.ingredients / c.totalSales) * 100
      : null;
  const laborRatio =
    c.totalSales > 0 && c.monthlyCosts.labor
      ? (c.monthlyCosts.labor / c.totalSales) * 100
      : null;
  const rentRatio =
    c.totalSales > 0 && c.monthlyCosts.rent
      ? (c.monthlyCosts.rent / c.totalSales) * 100
      : null;

  // SaaS — GA4/Webhook 자동 수집 우선, 없으면 사장님이 입력한 subscribers.active fallback
  const subs = (d as { subscribers?: { active?: number } }).subscribers;
  const manualActive = subs?.active ?? null;
  const autoActiveUsers = c.saasMetrics.latest?.active_users ?? null;
  const autoCumulativeUsers = c.saasMetrics.latest?.cumulative_users ?? null;
  const autoWau = c.saasMetrics.latest?.weekly_active_users ?? null;
  const autoNewUsers = c.saasMetrics.latest?.new_users ?? null;
  const activeUsers = autoActiveUsers ?? manualActive;
  const cumulativeUsers = autoCumulativeUsers ?? manualActive;

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
    "cumulative-users": { value: cumulativeUsers ?? undefined },
    wau:
      autoWau != null
        ? { value: autoWau }
        : { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    "pmf-score": { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    mrr: { value: yesterdaySales ?? undefined },
    "net-new":
      autoNewUsers != null
        ? { value: autoNewUsers }
        : { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    nrr: { value: undefined, displayOverride: ko ? "준비 중" : "Soon" },
    arpu: { value: avgTicket ?? undefined },
  };
}
