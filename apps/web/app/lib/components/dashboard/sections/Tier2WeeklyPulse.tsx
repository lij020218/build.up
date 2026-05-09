"use client";

/**
 * Tier 2 — 이번 주 점검 (DeepDive 안, 주 1회 클릭).
 *
 * 카드 목록 (위→아래):
 *   - Cashflow13WeekForecastCard — 13주 자금흐름 예측 (모두, 미설정 시 nudge)
 *   - SurvivalBoardCard          — 생존 보드 (2-col 좌)
 *   - CostCompositionDonutCard   — 비용 도넛 (2-col 우)
 *   - SocialBenchmarkCard        — 동종업 벤치마크
 *   - SalesBreakdownCard / MonthlyProgressCard (entries ≥ 2)
 *   - CostStructureCard / BenchmarkCard (entries ≥ 1, 분기 다름)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { DeepDiveSection } from "../DeepDiveSection";
import { Cashflow13WeekForecastCard } from "../Cashflow13WeekForecastCard";
import { SurvivalBoardCard } from "../SurvivalBoardCard";
import { CostCompositionDonutCard } from "../CostCompositionDonutCard";
import { SocialBenchmarkCard } from "../SocialBenchmarkCard";
import { SalesBreakdownCard } from "../SalesBreakdownCard";
import { MonthlyProgressCard } from "../MonthlyProgressCard";
import { CostStructureCard } from "../CostStructureCard";
import { BenchmarkCard } from "../BenchmarkCard";

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
};

export function Tier2WeeklyPulse({ d, c, ko, fmt }: Props) {
  return (
    <DeepDiveSection
      id="weekly-pulse"
      title={ko ? "이번 주 점검" : "Weekly Pulse"}
      subtitle={
        ko
          ? "생존 지표 · 비용 구조 · 매출 분해 · 월간 진행 · 벤치마크 — 주 1회 점검"
          : "Survival · Cost · Sales breakdown · Monthly · Benchmark — review weekly"
      }
      defaultOpen={false}
      ko={ko}
    >
      {/* 13주 자금흐름 예측 — Quicken/CFO 표준 + AI 처방 */}
      <Cashflow13WeekForecastCard
        ko={ko}
        dailyEntries={c.allEntries as Array<{ date: string; sales: number; customers: number }>}
        fallbackMonthlyCostsTotal={c.totalCosts}
      />

      {/* 생존 보드 + 비용 도넛 (2-col) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: c.isWide ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
          gap: "14px",
        }}
      >
        <SurvivalBoardCard
          ko={ko}
          isStartupCompany={c.isStartupCompany}
          runwayMonths={c.runwayMonths}
          capitalLeft={c.capitalLeft}
          weeklySalesChange={c.weeklySalesChange}
          weeklySignalLabel={c.weeklySignalLabel}
          healthLabel={c.healthLabel}
          healthTone={c.healthTone}
          topRiskLabel={c.topRiskLabel}
          focusMessage={c.focusMessage}
          d={d}
          totalSales={c.totalSales}
          netProfit={c.netProfit}
          totalCosts={c.totalCosts}
        />
        <CostCompositionDonutCard
          ko={ko}
          totalSales={c.totalSales}
          monthlyCosts={c.monthlyCosts}
          industryCategoryId={d.industryCategoryId}
          fmt={fmt}
          expenseFields={d.businessCtx.expenseFields?.map((f) => ({
            fieldKey: f.fieldKey,
            label: f.label,
          }))}
        />
      </div>

      {/* 동종업 벤치마크 */}
      <SocialBenchmarkCard
        ko={ko}
        industryCategoryId={d.industryCategoryId}
        dailyEntries={c.allEntries as Array<{ date: string; sales: number; customers: number }>}
      />

      {/* 매출 분해 + 월간 진행 (entries ≥ 2) */}
      {c.allEntries.length >= 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <SalesBreakdownCard />
          <MonthlyProgressCard />
        </div>
      )}

      {/* 비용 구조 + 벤치마크 (entries ≥ 1, 분기 다름) */}
      {c.allEntries.length >= 1 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              !c.isStartupCompany && !c.isOnlineCategory ? "1fr 1fr" : "1fr",
            gap: "14px",
          }}
        >
          {!c.isStartupCompany && !c.isOnlineCategory && <CostStructureCard />}
          <BenchmarkCard />
        </div>
      )}
    </DeepDiveSection>
  );
}
