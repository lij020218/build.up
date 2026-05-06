"use client";

import { useMemo } from "react";
import type { DashboardHook } from "../useDashboard";
import { useCashflowStore } from "../stores/cashflow-store";
import { useAgentsStore, agentUrgencyScore, type AgentProposal } from "../stores/agents-store";
import { useProfileStore } from "../stores/profile-store";
import { projectCashflow, detectCrisis, type CrisisDetection } from "../services/cashflow-projection";
import { detectProactiveInsights, type ProactiveInsight } from "../services/profit-anomaly-detector";
import { updateAnomalyHistory, getAnomalyContext } from "../services/anomaly-history";
import { useIndustryInsight, type IndustryInsight } from "./useIndustryInsight";
import type { DailyEntry, MonthlyCosts } from "../useDashboard";
import { getBusinessDay } from "../utils/business-day";

/**
 * ────────────────────────────────────────────────────────────────────────
 * useMorningBriefingBrain — AI 모닝 브리핑의 "두뇌"만 추상화한 hook.
 *
 * MorningBriefing.tsx 안에 갇혀있던 다음 로직을 컴포넌트 경계 밖으로 끌어냄:
 *   1. Cashflow 위기 감지 (`projectCashflow + detectCrisis`)
 *   2. 룰 기반 이상 감지 (`detectProactiveInsights`)
 *   3. Anomaly history (오늘 새로 발생 / N일째 지속)
 *   4. Agent proposals 우선순위
 *   5. AI Top Action (`d.aiActions.todayActions[0]`)
 *   6. Industry insight
 *   7. 매출 미기록 일수
 *
 * 같은 로직을 두 컴포넌트(MorningBriefing + CEOMorningHero)가 공유 →
 * 데이터 일관성 + 할루시네이션 방지 + 단일 우선순위 알고리즘.
 *
 * 의도적으로 "데이터 → 결정값" 만 반환하고 narrative 문자열은 만들지 않음.
 * narrative 생성은 호출 측의 resolveHero가 책임 (UI 톤마다 다른 문장 가능).
 * ────────────────────────────────────────────────────────────────────────
 */
export type MorningBriefingBrain = {
  /** 매출 데이터 0건 — 첫 기록 유도 표시 트리거 */
  hasNoData: boolean;
  /** 사용자 path 안에서 cashflow 설정·계산 후 위기 신호 (없으면 null) */
  cashflowCrisis: CrisisDetection | null;
  /** 룰 기반 이상 (이익률·매출·비용·프라임코스트) — critical/warning 우선 */
  topAnomaly: ProactiveInsight | null;
  /** 오늘 anomaly의 history 컨텍스트 ("어제부터 2일째") */
  anomalyContext: { isNew: boolean; consecutiveDays: number; label: string } | null;
  /** Agent proposals 중 가장 urgent (재주문·쿠폰·콘텐츠·리뷰) */
  topProposal: AgentProposal | null;
  /** AI 가 dashboard/actions 에서 산출한 오늘 1번 행동 (LLM) */
  aiTopAction: { title: string; reason: string; priority: "high" | "medium"; referencedCase?: { id: string; name: string } } | undefined;
  /** 업종 평균 인사이트 (LLM 또는 룰) */
  industryInsight: IndustryInsight | null;
  /** 매출 마지막 기록 후 며칠 (없으면 null) */
  daysSinceLastSalesEntry: number | null;
  /** 월 비용 합계 — 누적 손실 추정에 사용 */
  monthlyBurn: number;
  /** 사업 시작일로부터 며칠 (운영 중일 때만) */
  daysSinceLaunch: number | undefined;
  /** 최근 7일 일평균 매출 */
  avgDailySales7: number;
  /** 누적 entry 개수 (Hero 우선순위에 사용) */
  totalEntries: number;
  /** 사업 시작 여부 */
  businessLaunched: boolean;
  /** 운영 단계 — AI 코칭 톤 결정용 */
  phase: "pre-launch" | "early" | "growth" | "mature";
  /** 매출 트렌드 — 최근 7일 vs 그 이전 7일 */
  salesTrend: {
    direction: "improving" | "declining" | "stable" | "insufficient";
    /** 증감률 % (insufficient 면 null) */
    changePct: number | null;
    avgRecent7: number;
    avgPrior7: number;
  };
  /** 주간 매출 변화율 % (quick-query.weeklyChange 매핑용) — insufficient 면 null */
  weeklyChangePct: number | null;
  /** 비용 구조 추세 — 이번 달 prime cost % vs 지난 달 (insufficient 면 null) */
  costRatioTrend: {
    currentPrimeRate: number | null;
    prevPrimeRate: number | null;
    deltaPct: number | null;  // 이번달 - 지난달
  };
};

export function useMorningBriefingBrain(d: DashboardHook): MorningBriefingBrain {
  const entries = (d.dailyEntries ?? []) as DailyEntry[];
  const costs = (d.monthlyCosts ?? {
    ingredients: 0, labor: 0, rent: 0, utilities: 0,
    sga: 0, marketing: 0, other: 0, interest: 0,
  }) as MonthlyCosts;

  // ── Cashflow 위기 ──
  const cashflowState = useCashflowStore();
  const cashflowCrisis = useMemo<CrisisDetection | null>(() => {
    if (!cashflowState.setupCompletedAt) return null;
    const projections = projectCashflow({
      currentBalance: cashflowState.currentBalance,
      recentDailyEntries: entries,
      salesChannels: cashflowState.salesChannels,
      fixedExpenses: cashflowState.fixedExpenses,
      vatReserveEnabled: cashflowState.vatReserveEnabled,
    });
    const crisis = detectCrisis(projections, cashflowState.crisisThresholdDays);
    return crisis.willCrisis ? crisis : null;
  }, [
    cashflowState.setupCompletedAt,
    cashflowState.currentBalance,
    cashflowState.salesChannels,
    cashflowState.fixedExpenses,
    cashflowState.vatReserveEnabled,
    cashflowState.crisisThresholdDays,
    entries,
  ]);

  // ── Agent proposals ──
  const proposals = useAgentsStore((s) => s.proposals);
  const activeProposals = useMemo(() => {
    return proposals
      .filter((p) => p.status === "pending" && new Date(p.expiresAt) > new Date())
      .sort((a, b) => agentUrgencyScore(a) - agentUrgencyScore(b));
  }, [proposals]);
  const topProposal: AgentProposal | null = activeProposals[0] ?? null;

  // ── 7일 일평균 ──
  const avgDailySales7 = useMemo(() => {
    if (entries.length === 0) return 0;
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    if (last7.length === 0) return 0;
    return last7.reduce((s, e) => s + e.sales, 0) / last7.length;
  }, [entries]);

  // ── 사업 시작 후 일수 ──
  const businessLaunchedDate = useProfileStore((s) => s.businessLaunchedDate);
  const daysSinceLaunch = useMemo(() => {
    if (!d.businessLaunched || !businessLaunchedDate) return undefined;
    return Math.max(0, Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / 86400000));
  }, [d.businessLaunched, businessLaunchedDate]);

  // ── Industry insight ──
  const { insight: industryInsight } = useIndustryInsight({
    categoryId: d.industryCategoryId,
    hasUserSales: entries.length > 0,
    avgDailySales: avgDailySales7 > 0 ? avgDailySales7 : undefined,
    daysSinceLaunch,
    enabled: entries.length > 0 || !!d.industryCategoryId,
  });

  // ── 매출 미기록 일수 ──
  // 일자 비교는 사장의 영업일 컷오프 (closeTime + 30분) 기준으로 — 자정 기준이 아님.
  const todayBusinessDay = getBusinessDay(new Date(), {
    categoryId: d.industryCategoryId,
    closeTime: d.businessCloseTime,
  });
  const daysSinceLastSalesEntry = useMemo<number | null>(() => {
    if (entries.length === 0) return null;
    const latest = entries.reduce((acc, e) => (e.date > acc ? e.date : acc), entries[0].date);
    const today = new Date(`${todayBusinessDay}T00:00:00`);
    const last = new Date(`${latest}T00:00:00`);
    return Math.max(0, Math.round((today.getTime() - last.getTime()) / 86400000));
  }, [entries, todayBusinessDay]);

  // ── 룰 기반 이상 감지 ──
  const topAnomaly = useMemo<ProactiveInsight | null>(() => {
    if (entries.length < 5) return null;
    const curMonth = new Date().toISOString().slice(0, 7);
    const prevMonthDate = new Date(); prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthKey = prevMonthDate.toISOString().slice(0, 7);
    const thisMonthEntries = entries.filter((e) => e.date.startsWith(curMonth));
    const prevMonthEntries = entries.filter((e) => e.date.startsWith(prevMonthKey));
    const costHistory = (d.costHistory ?? []) as Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }>;
    const prevSnap = costHistory.find((h) => h.month === prevMonthKey);
    const inventory = (d.inventory as Array<{ name: string; quantity: number; minThreshold?: number; dailyUsage?: number; lastOrderedAt?: string }> | undefined) ?? undefined;

    const insights = detectProactiveInsights({
      thisMonthEntries,
      prevMonthEntries,
      monthlyCosts: costs as Parameters<typeof detectProactiveInsights>[0]["monthlyCosts"],
      prevMonthCosts: prevSnap,
      inventory,
    });
    if (insights.length > 0) {
      updateAnomalyHistory(insights.map((i) => i.kind));
    }
    return insights[0] ?? null;
  }, [entries, costs, d.costHistory, d.inventory]);

  const anomalyContext = useMemo(() => {
    if (!topAnomaly) return null;
    return getAnomalyContext(topAnomaly.kind);
  }, [topAnomaly]);

  // ── 월 비용 합계 ──
  const monthlyBurn = useMemo(() => {
    return (
      costs.ingredients + costs.labor + costs.rent + costs.utilities +
      (costs.sga ?? 0) + (costs.marketing ?? 0) + costs.other + (costs.interest ?? 0)
    );
  }, [costs]);

  // ── 운영 단계 분류 ──
  //   pre-launch: 아직 개업 X
  //   early: 개업 후 30일 이내 (PMF 검증·고객 확보 단계)
  //   growth: 30~90일 (운영 안정화·매출 패턴 학습)
  //   mature: 90일 초과 (효율화·확장 검토)
  const phase: MorningBriefingBrain["phase"] = useMemo(() => {
    if (!d.businessLaunched) return "pre-launch";
    if (daysSinceLaunch == null) return "early";
    if (daysSinceLaunch <= 30) return "early";
    if (daysSinceLaunch <= 90) return "growth";
    return "mature";
  }, [d.businessLaunched, daysSinceLaunch]);

  // ── 매출 트렌드 (최근 7일 vs 그 이전 7일) ──
  const salesTrend = useMemo<MorningBriefingBrain["salesTrend"]>(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const last14 = sorted.slice(-14);
    if (last14.length < 14) {
      return { direction: "insufficient", changePct: null, avgRecent7: avgDailySales7, avgPrior7: 0 };
    }
    const recent7 = last14.slice(-7);
    const prior7 = last14.slice(0, 7);
    const avgRecent = recent7.reduce((s, e) => s + e.sales, 0) / 7;
    const avgPrior = prior7.reduce((s, e) => s + e.sales, 0) / 7;
    if (avgPrior <= 0) {
      return { direction: "insufficient", changePct: null, avgRecent7: avgRecent, avgPrior7: avgPrior };
    }
    const changePct = ((avgRecent - avgPrior) / avgPrior) * 100;
    let direction: "improving" | "declining" | "stable";
    if (changePct >= 5) direction = "improving";
    else if (changePct <= -5) direction = "declining";
    else direction = "stable";
    return { direction, changePct: Math.round(changePct * 10) / 10, avgRecent7: avgRecent, avgPrior7: avgPrior };
  }, [entries, avgDailySales7]);

  // ── 비용 구조 추세 (이번 달 vs 지난 달 prime cost rate) ──
  const costRatioTrend = useMemo<MorningBriefingBrain["costRatioTrend"]>(() => {
    const curMonth = new Date().toISOString().slice(0, 7);
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthKey = prevMonthDate.toISOString().slice(0, 7);

    const thisMonthEntries = entries.filter((e) => e.date.startsWith(curMonth));
    const prevMonthEntries = entries.filter((e) => e.date.startsWith(prevMonthKey));
    const thisRev = thisMonthEntries.reduce((s, e) => s + e.sales, 0);
    const prevRev = prevMonthEntries.reduce((s, e) => s + e.sales, 0);

    const costHistory = (d.costHistory ?? []) as Array<{ month: string; ingredients: number; labor: number }>;
    const prevSnap = costHistory.find((h) => h.month === prevMonthKey);

    const currentPrimeCost = costs.ingredients + costs.labor;
    const currentPrimeRate = thisRev > 0 ? (currentPrimeCost / thisRev) * 100 : null;
    const prevPrimeCost = prevSnap ? prevSnap.ingredients + prevSnap.labor : null;
    const prevPrimeRate = prevSnap && prevRev > 0 && prevPrimeCost != null ? (prevPrimeCost / prevRev) * 100 : null;
    const deltaPct = currentPrimeRate != null && prevPrimeRate != null ? Math.round((currentPrimeRate - prevPrimeRate) * 10) / 10 : null;
    return {
      currentPrimeRate: currentPrimeRate != null ? Math.round(currentPrimeRate * 10) / 10 : null,
      prevPrimeRate: prevPrimeRate != null ? Math.round(prevPrimeRate * 10) / 10 : null,
      deltaPct,
    };
  }, [entries, costs, d.costHistory]);

  return {
    hasNoData: entries.length === 0,
    cashflowCrisis,
    topAnomaly,
    anomalyContext,
    topProposal,
    aiTopAction: d.aiActions?.todayActions?.[0],
    industryInsight,
    daysSinceLastSalesEntry,
    monthlyBurn,
    daysSinceLaunch,
    avgDailySales7,
    totalEntries: entries.length,
    businessLaunched: !!d.businessLaunched,
    phase,
    salesTrend,
    weeklyChangePct: salesTrend.changePct,
    costRatioTrend,
  };
}
