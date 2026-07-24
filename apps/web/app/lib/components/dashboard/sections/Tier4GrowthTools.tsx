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
 *   - WeeklyReport              — 주간 리포트 (streak ≥7)
 *   ※ PolicyFundMatchCard 는 2026-05 Tier 1.5 로 승격 (발견율 개선)
 *
 * 자세한 분기 표 → `DASHBOARD_MAP.md`
 */

import type { DashboardHook } from "../../../useDashboard";
import type { DashboardComputed } from "../../../hooks/useDashboardComputed";
import { DeepDiveSection } from "../DeepDiveSection";
import { WeeklyTimeReport } from "../WeeklyTimeReport";
import { ProgressMilestonesCard } from "../ProgressMilestonesCard";
import { CustomerInterviewCard } from "../CustomerInterviewCard";
import { InsuranceSimulatorCard } from "../InsuranceSimulatorCard";
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
      {/* What-If 시뮬레이터 → 재무 탭 12개월 시뮬레이션으로 이관·확장 (2026-07-24) */}

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

      {/* 정책자금 매칭 — 2026-05 Tier 1.5 (c-1) 로 이동 (Tier 4 접힘으로 발견율 낮음) */}

      {/* 주간 리포트 — streak ≥7 일 때만 */}
      {c.streak >= 7 && <WeeklyReport d={d} ko={ko} fmt={fmt} />}
    </DeepDiveSection>
  );
}
