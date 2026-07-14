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

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { ActivitySnapshotCard } from "../ActivitySnapshotCard";
import { UserActivityCard } from "../UserActivityCard";
import { CashflowHeroCard } from "../CashflowHeroCard";
import { PLHeroCard } from "../PLHeroCard";
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

  return (
    <>
      {/* ① 매출 흐름 — full-width (매출 raw 차트가 작아지면 의미 손실) */}
      <div className="dash-stagger-item" style={nextStaggerStyle()}>
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
      </div>

      {/* ② 사용자수 — 성장 선행 지표라 매출 바로 아래 full-width (2026-07-13 재배치:
          종전엔 매출과 2-col 이었으나 "성장→재무" 흐름 위해 매출 직하로 승격) */}
      {showUserActivity && (
        <div className="dash-stagger-item" style={nextStaggerStyle()}>
          <UserActivityCard
            d={d}
            ko={ko}
            todayStr={c.todayStr}
            recent7Entries={c.recent7Entries}
            todayEntry={c.todayEntry}
            fmt={fmt}
          />
        </div>
      )}

      {/* ③ 손익 · 현금흐름 (2-col → 손익 숨김 시 현금 full-width). 손익 좌 · 현금 우 */}
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
        {showPLHero && <PLHeroCard
          totalSales={c.totalSales}
          totalCosts={c.totalCosts}
          netProfit={c.netProfit}
          bepProgress={c.bepProgress}
          ingredientRatio={c.ingredientRatio}
          laborRatio={c.laborRatio}
          rentRatio={c.rentRatio}
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
        <CashflowHeroCard
          ko={ko}
          dailyEntries={c.allEntries}
          fallbackMonthlyCostsTotal={c.totalCosts}
        />
      </div>

      {/* KPI 5칸 스트립 제거 (2026-07-13 재설계): 죽은 셀 7개 + 나머지는 히어로·손익·현금
          중복이라 기본 노출에서 제외. 어제매출·객수 트렌드는 매출/사용자수 카드에서 확인. */}
    </>
  );
}

