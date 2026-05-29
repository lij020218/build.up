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
import { computeIndustryRule, type IndustryRuleResult } from "./useIndustryRuleSignal";
import type { DailyEntry, MonthlyCosts } from "../useDashboard";
import { getBusinessDay } from "../utils/business-day";
import { calculateCostRatios, calculateUnifiedHealthScore, type HealthGrade } from "@foundone/shared";
import { honestDailyAverage } from "../utils/daily-windows";

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
  /** 2026-05-12 추가 — 11 업종 임계값 룰 신호 (재료비·인건비·임대료·BEP·객단가).
   *  종전 OfflineFounderBrief 별도 hero 카드 → Tier 1 hero 흡수 (Toast IQ·Amplitude 통합 패턴).
   *  resolveHero 가 anomaly 다음 (priority 1.6) 으로 사용. */
  industryRule: IndustryRuleResult;
  /** 2026-05-13 추가 — 다중 위험신호 박스 (구 MorningBriefing 717-789 이식).
   *  Hero 의 HealthScore pill (숫자 1개) 보완 — "왜 점수가 낮은지" 구체적 도메인 신호 최대 3개.
   *  데이터 충분: unified.domains 중 critical/warning 영역 worst component
   *  데이터 부족: 매출 vs 비용 극단 gap 등 명백한 사실 신호 */
  riskSignals: Array<{ grade: HealthGrade; title: string; message: string }>;
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
  //
  //  ⚠️ 분모는 *캘린더 일수* (1~7) — entry 수로 나누면 1일 입력이 7일 평균으로 잘못 표시되는 버그.
  //     사용자 보고 (2026-05-08): 1일 200K 입력 → 14일 평균 200K 로 표시.
  const avgDailySales7 = useMemo(() => {
    if (entries.length === 0) return 0;
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sorted.slice(-7);
    if (last7.length === 0) return 0;
    const earliestMs = new Date(last7[0].date).getTime();
    const calendarDays = Math.min(7, Math.max(1, Math.floor((Date.now() - earliestMs) / 86400000) + 1));
    return last7.reduce((s, e) => s + e.sales, 0) / calendarDays;
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
    // ⚡ 안전망: latest 가 오늘 영업일 이상 (오늘·미래 — 미래는 사장님 잘못 입력) 이면 0
    //   timezone / DST / new Date(YYYY-MM-DD) UTC parsing edge case 회피.
    //   사용자 보고 (2026-05-06): 오늘 입력했는데 "공백" 메시지 트리거 케이스 방지.
    if (latest >= todayBusinessDay) return 0;
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

  // ── 2026-05-12: 11 업종 임계값 룰 신호 (industry-rule) ──
  //   OfflineFounderBrief 안에 고립되어 있던 룰엔진을 brain 으로 끌어올림.
  //   resolveHero 의 우선순위 1.6 (anomaly 다음) 에서 사용.
  const ko = d.language === "ko";
  const industryRule = useMemo<IndustryRuleResult>(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthEntries = entries.filter((e) => e.date.startsWith(currentMonth));
    const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
    const totalCustomers = monthEntries.reduce((s, e) => s + (e.customers ?? 0), 0);

    const ratios = calculateCostRatios({
      costs: {
        ingredients: costs.ingredients ?? 0,
        labor: costs.labor ?? 0,
        rent: costs.rent ?? 0,
        utilities: costs.utilities ?? 0,
        sga: costs.sga ?? 0,
        marketing: costs.marketing ?? 0,
        other: costs.other ?? 0,
      },
      totalRevenue: totalSales,
      days: monthEntries.length,
    });

    // BEP 진행률 — 월 매출 환산 vs 월 비용
    const bepProgress = monthlyBurn > 0 && ratios.monthlyRevenueEquivalent > 0
      ? (ratios.monthlyRevenueEquivalent / monthlyBurn) * 100
      : 0;

    return computeIndustryRule({
      industryCategoryId: d.industryCategoryId ?? "",
      ingredientRatio: ratios.ingredientRatio,
      laborRatio: ratios.laborRatio,
      rentRatio: ratios.rentRatio,
      primeCost: ratios.primeCostRatio,
      ratiosReady: ratios.ready,
      bepProgress,
      weeklySalesChange: salesTrend.changePct ?? 0,
      totalCustomers,
      totalSales,
      dailyEntriesCount: entries.length,
      ko,
    });
  }, [entries, costs, monthlyBurn, salesTrend.changePct, d.industryCategoryId, ko]);

  // ── 2026-05-13: 다중 위험신호 (구 MorningBriefing 717-789 이식) ──
  //   Hero 의 HealthScore "78점" 같은 단일 숫자만 보고는 "무엇이 위험한지" 모름.
  //   unified.domains (cash/profit/efficiency/growth) 중 critical/warning 도메인의
  //   worst component 를 최대 3개 신호로 추출. 데이터 부족 시는 매출 vs 비용 극단 gap 만 표시.
  const riskSignals = useMemo<Array<{ grade: HealthGrade; title: string; message: string }>>(() => {
    const unified = calculateUnifiedHealthScore({
      dailyEntries: entries,
      monthlyCosts: costs,
      industry: "general",
      stage: "growth",
    });
    const signals: Array<{ grade: HealthGrade; title: string; message: string }> = [];
    const totalCostsAll =
      (costs.ingredients ?? 0) + (costs.labor ?? 0) + (costs.rent ?? 0) + (costs.utilities ?? 0) +
      ((costs as { sga?: number }).sga ?? 0) +
      ((costs as { marketing?: number }).marketing ?? 0) +
      (costs.other ?? 0) +
      ((costs as { interest?: number }).interest ?? 0);
    const totalRev = entries.reduce((s, e) => s + e.sales, 0);

    // 일 평균 — 경과 캘린더 일수 분모 (sparse 자동 보정)
    const honestAvg = honestDailyAverage(entries, (e) => e.sales);
    const days = honestAvg.denominator;

    // ① 데이터 부족이라도 명백한 신호: 매출 vs 비용 극단 gap
    if (!unified.ready && days > 0 && totalCostsAll > 0 && totalRev > 0) {
      const monthEst = honestAvg.avg * 26; // 월 26영업일 가정
      const ratio = monthEst / totalCostsAll;
      const fmtWon = (v: number): string => {
        if (ko) {
          if (Math.abs(v) >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
          if (Math.abs(v) >= 10_000) return `${Math.round(v / 10_000)}만`;
          return `${v.toLocaleString("ko-KR")}원`;
        }
        if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
        return v.toLocaleString("en-US");
      };
      if (ratio < 0.3 && totalCostsAll > 100000) {
        signals.push({
          grade: "critical",
          title: ko ? "매출이 비용 대비 너무 적어요" : "Revenue much lower than costs",
          message: ko
            ? `이 페이스라면 월 매출 추정 ${fmtWon(Math.round(monthEst))}, 월 비용 ${fmtWon(totalCostsAll)} — 비용의 ${Math.round(ratio * 100)}% 수준. 매출 확보가 가장 시급합니다.`
            : `Projected monthly revenue ${fmtWon(Math.round(monthEst))} vs costs ${fmtWon(totalCostsAll)} — only ${Math.round(ratio * 100)}% of costs.`,
        });
      } else if (ratio >= 0.3 && ratio < 0.7) {
        signals.push({
          grade: "warning",
          title: ko ? "매출이 비용을 못 따라가요" : "Revenue lagging costs",
          message: ko
            ? `현재 페이스로 월 비용의 ${Math.round(ratio * 100)}%만 매출. 이 추세가 한 달 이어지면 적자가 ${fmtWon(Math.round(totalCostsAll - monthEst))} 쌓여요.`
            : `On pace for ${Math.round(ratio * 100)}% of costs. A month at this pace = ${fmtWon(Math.round(totalCostsAll - monthEst))} loss.`,
        });
      }
    }

    // ② 데이터 충분: unified.domains 의 critical/warning 영역 worst component
    if (unified.ready) {
      const order: Array<"cash" | "profit" | "efficiency" | "growth"> = ["cash", "profit", "efficiency", "growth"];
      const titleByDomain: Record<string, { ko: string; en: string }> = {
        cash:       { ko: "현금 흐름 위험",   en: "Cash flow risk" },
        profit:     { ko: "수익성 위험",       en: "Profitability risk" },
        efficiency: { ko: "비용 효율 위험",   en: "Cost efficiency risk" },
        growth:     { ko: "성장 둔화",         en: "Growth slowdown" },
      };
      const formatValue = (name: string, value: number): string => {
        if (!Number.isFinite(value)) return "—";
        if (name.includes("런웨이") || name.toLowerCase().includes("runway"))
          return ko ? `${value.toFixed(1)}개월` : `${value.toFixed(1)}mo`;
        if (name.includes("이자보상") || name.includes("배율"))
          return `×${value.toFixed(1)}`;
        if (name.includes("성장률") || name.includes("growth"))
          return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
        return `${value.toFixed(1)}%`;
      };
      for (const key of order) {
        const dm = unified.domains[key];
        if (dm.grade !== "critical" && dm.grade !== "warning") continue;
        const worst = dm.components
          .filter((c) => Number.isFinite(c.score))
          .sort((a, b) => a.score - b.score)[0];
        if (!worst) continue;
        const headline = titleByDomain[key][ko ? "ko" : "en"];
        const valueText = formatValue(worst.name, worst.value);
        signals.push({
          grade: dm.grade,
          title: headline,
          message: ko
            ? `${worst.name} ${valueText} — 영역 점수 ${Math.round(dm.score)}점`
            : `${worst.name} ${valueText} — domain score ${Math.round(dm.score)}`,
        });
        if (signals.length >= 3) break;
      }
    }

    return signals.slice(0, 3);
  }, [entries, costs, ko]);

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
    industryRule,
    riskSignals,
  };
}
