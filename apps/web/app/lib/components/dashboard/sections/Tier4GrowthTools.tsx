"use client";

/**
 * Tier 4 — 성장 도구 (DeepDive, 접이식).
 *
 * 카드 목록 (위→아래):
 *   - WhatIfSimulator           — What-If 시뮬 (매출/비용 ≥1 입력 시)
 *   - WeeklyTimeReport          — 주간 시간 리포트
 *   - ProgressMilestonesCard    — 마일스톤 진행
 *   - CustomerInterviewCard     — 고객 인터뷰
 *   - InsuranceSimulatorCard    — 4대보험 시뮬레이터 (직원 ≥1 또는 인건비 입력)
 *   - PolicyFundMatchCard       — 정책자금 매칭 (런웨이 ≥6개월일 때만, 평상시)
 *   - WeeklyReport              — 주간 리포트 (streak ≥7)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { DeepDiveSection } from "../DeepDiveSection";
import { WhatIfSimulator } from "../WhatIfSimulator";
import { WeeklyTimeReport } from "../WeeklyTimeReport";
import { ProgressMilestonesCard } from "../ProgressMilestonesCard";
import { CustomerInterviewCard } from "../CustomerInterviewCard";
import { InsuranceSimulatorCard } from "../InsuranceSimulatorCard";
import { PolicyFundMatchCard } from "../PolicyFundMatchCard";
import { WeeklyReport } from "../WeeklyReport";

type Props = {
  d: DashboardHook;
  c: DashboardComputed;
  ko: boolean;
  fmt: (n: number) => string;
};

export function Tier4GrowthTools({ d, c, ko, fmt }: Props) {
  return (
    <DeepDiveSection
      id="growth-tools"
      title={ko ? "성장 도구" : "Growth Tools"}
      subtitle={
        ko
          ? "What-If 시뮬 · 시간 패턴 · 마일스톤 · 인터뷰 · 주간 리포트"
          : "What-If · Time · Milestones · Interviews · Weekly report"
      }
      defaultOpen={false}
      ko={ko}
    >
      {(c.totalSales > 0 || c.totalCosts > 0) && (
        <WhatIfSimulator
          ko={ko}
          monthlySales={c.totalSales}
          monthlyCosts={
            d.monthlyCosts as {
              ingredients: number;
              labor: number;
              rent: number;
              utilities: number;
              sga: number;
              marketing: number;
              other: number;
              interest: number;
            }
          }
          capitalLeft={c.capitalLeft}
          expenseFields={d.businessCtx.expenseFields?.map((f) => ({
            fieldKey: f.fieldKey,
            label: f.label,
          }))}
        />
      )}

      <WeeklyTimeReport ko={ko} />

      <ProgressMilestonesCard
        ko={ko}
        dailyEntries={c.allEntries as Array<{ date: string; sales: number; customers: number }>}
        healthScore={c.healthScore}
        bepProgress={c.bepProgress}
        completedStages={d.completedCount ?? 0}
      />

      <CustomerInterviewCard ko={ko} industryCategoryId={d.industryCategoryId} />

      {/* 4대보험 시뮬레이터 — 채용 결정 5분 안에 */}
      {(c.employees.length > 0 || (c.monthlyCosts.labor ?? 0) > 0) && (
        <InsuranceSimulatorCard ko={ko} currentEmployeeCount={c.employees.length} />
      )}

      {/* 정책자금 매칭 — 평상시 (위기 시 Tier 1.5 로 elevation) */}
      {!c.cashflowCriticalElevation && (
        <PolicyFundMatchCard
          ko={ko}
          input={{
            businessYears: c.daysSinceLaunch / 365.25,
            monthlySalesWon: c.totalSales,
            employeeCount: c.employees.length,
            salesDeclinePct: c.weeklySalesChange < 0 ? Math.abs(c.weeklySalesChange) : 0,
            industryCategoryId: d.industryCategoryId,
          }}
        />
      )}

      {/* 주간 리포트 — streak ≥7 일 때만 */}
      {c.streak >= 7 && <WeeklyReport d={d} ko={ko} fmt={fmt} />}
    </DeepDiveSection>
  );
}
