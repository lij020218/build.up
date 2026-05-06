"use client";

import { useMemo } from "react";
import {
  calculateCMGR,
  calculateWoWGrowth,
  calculateBurnMultiple,
  calculateRunwayMonths,
  calculateRuleOf40,
  calculateMagicNumber,
  calculateAOV,
  calculateRepeatPurchaseRate,
  isDefaultAlive,
  getMetricHealth,
  getDefaultAliveHealth,
  getMetricTrend,
  getMetricActions,
  type StartupMetrics,
  type MetricCard,
  type MetricAction,
  type StartupMetricHealth,
  type StartupContext,
} from "@build-up/shared";

import { useFinanceStore, useProfileStore } from "../stores";

// ════════════════════════════════════════════════════════════════════════════════
// useStartupMetrics
// 디자인 철학: 한눈에 사업 상태를 파악할 수 있고,
// 가장 중요한 것 3~5개만 보여줘 다음 행동에 착수할 수 있게 한다.
// ════════════════════════════════════════════════════════════════════════════════

/** 업종 그룹 — 표시할 핵심 지표 세트를 결정 */
type MetricIndustry = "saas" | "ecommerce" | "restaurant" | "service" | "general";

function inferMetricIndustry(industryCategoryId?: string | null): MetricIndustry {
  if (!industryCategoryId) return "general";
  const id = industryCategoryId.toLowerCase();
  if (id.includes("startup") || id.includes("tech") || id.includes("saas")) return "saas";
  if (id.includes("online") || id.includes("digital") || id.includes("ecom")) return "ecommerce";
  if (id.includes("food") || id.includes("cafe") || id.includes("dessert") || id.includes("bakery") || id.includes("restaurant")) return "restaurant";
  if (id.includes("beauty") || id.includes("fitness") || id.includes("education") || id.includes("service") || id.includes("space")) return "service";
  return "general";
}

/**
 * 업종별 핵심 지표 세트 — "쏟아붓지 않는다"
 *  - SaaS: 자본 효율 + 성장 (Sacks·Brad Feld·Scale VP 기준)
 *  - 커머스: 객단가·재구매 + 자본 효율
 *  - 외식·서비스: 런웨이 + 성장 + Default Alive (생존 중심)
 */
const METRIC_SETS: Record<MetricIndustry, Array<keyof StartupMetrics>> = {
  saas:       ["cmgr", "burnMultiple", "runwayMonths", "ruleOf40", "magicNumber"],
  ecommerce:  ["cmgr", "wowGrowth", "aov", "repeatPurchaseRate", "runwayMonths"],
  restaurant: ["wowGrowth", "runwayMonths", "aov", "defaultAlive"],
  service:    ["cmgr", "wowGrowth", "runwayMonths", "defaultAlive"],
  general:    ["cmgr", "runwayMonths", "defaultAlive"],
};

const METRIC_LABELS_KO: Record<keyof StartupMetrics, string> = {
  cmgr: "월 성장률 (CMGR)",
  wowGrowth: "주간 성장률",
  burnMultiple: "Burn Multiple",
  runwayMonths: "런웨이",
  ruleOf40: "Rule of 40",
  magicNumber: "Magic Number",
  defaultAlive: "Default Alive",
  aov: "객단가 (AOV)",
  repeatPurchaseRate: "재구매율",
};

const METRIC_BENCHMARKS: Record<keyof StartupMetrics, string> = {
  cmgr: "YC 기준 월 10%+ 양호",
  wowGrowth: "YC 기준 주 5-7%",
  burnMultiple: "Sacks 기준 <2x 양호",
  runwayMonths: "한국 VC 권장 18-24개월",
  ruleOf40: "SaaS 기준 합 ≥ 40%",
  magicNumber: "Scale VP 기준 ≥ 1.0x",
  defaultAlive: "Paul Graham (2015)",
  aov: "추세 비교 (절대 기준 없음)",
  repeatPurchaseRate: "Shopify 평균 28%, 우수 40%+",
};

const METRIC_SOURCES: Record<keyof StartupMetrics, string> = {
  cmgr: "YC growth standard",
  wowGrowth: "Paul Graham — Startup = Growth (YC, 2012)",
  burnMultiple: "David Sacks (Craft Ventures, 2020)",
  runwayMonths: "한국 VC 권장 (ZUZU·클로브)",
  ruleOf40: "Brad Feld / Bessemer SaaS index",
  magicNumber: "Scale Venture Partners",
  defaultAlive: "Paul Graham (2015)",
  aov: "Shopify Commerce Benchmark",
  repeatPurchaseRate: "Shopify Commerce Benchmark",
};

function fmtCardValue(key: keyof StartupMetrics, value: number | boolean | null): string {
  if (value == null) return "—";
  if (key === "defaultAlive") return value ? "Alive" : "Default Dead";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "aov") {
    if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
    if (value >= 10_000) return `${Math.round(value / 10_000)}만원`;
    return `${Math.round(value).toLocaleString()}원`;
  }
  if (key === "burnMultiple" || key === "magicNumber") return `${value.toFixed(1)}x`;
  if (key === "runwayMonths") return `${value.toFixed(1)}개월`;
  // % 지표
  return `${value.toFixed(1)}%`;
}

// ── 매출/비용 보조 함수 ────────────────────────────────────────────

type DailyEntryLite = { date: string; sales: number; customers: number };

function sumByMonth(entries: DailyEntryLite[]): Record<string, { sales: number; customers: number }> {
  const acc: Record<string, { sales: number; customers: number }> = {};
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    if (!acc[month]) acc[month] = { sales: 0, customers: 0 };
    acc[month].sales += e.sales;
    acc[month].customers += e.customers;
  }
  return acc;
}

function getRecentMonths(byMonth: Record<string, { sales: number }>, n: number): number[] {
  const keys = Object.keys(byMonth).sort();
  return keys.slice(-n).map((k) => byMonth[k].sales);
}

// ── Hook ────────────────────────────────────────────────────────────

export type UseStartupMetricsResult = {
  /** 원시 지표 값 */
  metrics: StartupMetrics;
  /** 업종별 핵심 카드 (이미 priority 정렬) */
  cards: MetricCard[];
  /** 업종별 우선순위 정렬된 Next Action (cards 와 1:1) */
  actions: MetricAction[];
  /** 사용자에게 데이터가 충분치 않을 때 메시지 (없으면 null) */
  notReadyReason: string | null;
  industry: MetricIndustry;
};

/**
 * Startup metrics 통합 훅.
 *
 *  - 기존 useFinanceStore (dailyEntries, monthlyCosts), useProfileStore (industry, capital) 활용
 *  - 중복 계산 X — useDashboard 에서 이미 가공된 값이 있다면 향후 prop 으로 받도록 확장 가능
 */
export function useStartupMetrics(): UseStartupMetricsResult {
  const { dailyEntries, monthlyCosts } = useFinanceStore();
  const { selectedIndustryCategoryId, selectedBudget, initialOperatingCapital } = useProfileStore();

  return useMemo(() => {
    const industry = inferMetricIndustry(selectedIndustryCategoryId);
    const entries = (dailyEntries ?? []) as DailyEntryLite[];
    const sortedAsc = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    // ── 월별 매출 집계 ──
    const byMonth = sumByMonth(sortedAsc);
    const monthKeys = Object.keys(byMonth).sort();
    const currentMonthKey = monthKeys[monthKeys.length - 1] ?? null;
    const previousMonthKey = monthKeys[monthKeys.length - 2] ?? null;
    const monthlyRevenue = currentMonthKey ? byMonth[currentMonthKey].sales : 0;
    const previousMonthRevenue = previousMonthKey ? byMonth[previousMonthKey].sales : 0;
    const monthlyCustomers = currentMonthKey ? byMonth[currentMonthKey].customers : 0;

    // ── 비용 집계 ──
    const costs = monthlyCosts ?? {
      ingredients: 0, labor: 0, rent: 0, utilities: 0,
      sga: 0, marketing: 0, other: 0, interest: 0,
    };
    const totalCosts =
      (costs.ingredients ?? 0) + (costs.labor ?? 0) + (costs.rent ?? 0) +
      (costs.utilities ?? 0) + (costs.sga ?? 0) + (costs.marketing ?? 0) +
      (costs.other ?? 0) + (costs.interest ?? 0);
    const monthlyFixedCosts =
      (costs.rent ?? 0) + (costs.labor ?? 0) + (costs.utilities ?? 0) + (costs.sga ?? 0);
    const netBurn = Math.max(0, totalCosts - monthlyRevenue);

    // 자본 (초기 투자금 + 운영자금) — 별도 cashBalance 추적이 없는 경우 폴백
    const totalCapital = ((selectedBudget ?? 0) as number) + ((initialOperatingCapital ?? 0) as number);

    // ── 주간 매출 (최근 7일 vs 직전 7일) ──
    const recent7 = sortedAsc.slice(-7).reduce((s, e) => s + e.sales, 0);
    const prev7   = sortedAsc.slice(-14, -7).reduce((s, e) => s + e.sales, 0);

    // ── CMGR (최근 3-6개월 매출) ──
    const recentMonths = getRecentMonths(byMonth, 6);
    const cmgr = calculateCMGR(recentMonths);

    // ── 핵심 지표 계산 ──
    const wowGrowth = calculateWoWGrowth(recent7, prev7);
    const newARR = monthlyRevenue - previousMonthRevenue; // 단순 매출 증분 (proxy for ARR delta)
    const burnMultiple = calculateBurnMultiple(netBurn, newARR);
    const runwayMonths = calculateRunwayMonths(totalCapital, netBurn);
    const profitMarginPct = monthlyRevenue > 0 ? ((monthlyRevenue - totalCosts) / monthlyRevenue) * 100 : 0;
    const ruleOf40 = cmgr != null ? calculateRuleOf40(cmgr, profitMarginPct) : null;
    const magicNumber = calculateMagicNumber(newARR, costs.marketing ?? 0);
    const aov = calculateAOV(monthlyRevenue, monthlyCustomers);
    const repeatPurchaseRate: number | null = null; // 재구매 데이터 없음 — 미래 확장 지점

    const monthlyGrowthRate = cmgr != null ? cmgr / 100 : 0;
    const defaultAlive =
      monthlyRevenue > 0 || totalCosts > 0
        ? isDefaultAlive(monthlyRevenue, totalCosts, monthlyGrowthRate, totalCapital)
        : null;

    const metrics: StartupMetrics = {
      cmgr,
      wowGrowth,
      burnMultiple,
      runwayMonths,
      ruleOf40,
      magicNumber,
      defaultAlive,
      aov,
      repeatPurchaseRate,
    };

    // ── 업종별 카드 빌드 ──
    const set = METRIC_SETS[industry];
    const cards: MetricCard[] = set.map((key) => {
      const value = metrics[key];
      let health: MetricCard["health"];
      if (value == null) {
        health = "unknown";
      } else if (key === "defaultAlive") {
        health = getDefaultAliveHealth(value as boolean);
      } else if (typeof value === "number") {
        health = getMetricHealth(key, value);
      } else {
        health = "unknown";
      }
      return {
        key,
        name: METRIC_LABELS_KO[key],
        value: value ?? null,
        formatted: fmtCardValue(key, value ?? null),
        health,
        trend: "stable" as const,
        benchmark: METRIC_BENCHMARKS[key],
        source: METRIC_SOURCES[key],
      };
    });

    // ── 트렌드 (현재 매출 vs 직전월) — wowGrowth/cmgr 가 양수면 up ──
    cards.forEach((c) => {
      if (c.key === "cmgr" || c.key === "wowGrowth" || c.key === "ruleOf40" || c.key === "magicNumber") {
        if (typeof c.value === "number") {
          c.trend = c.value > 1 ? "up" : c.value < -1 ? "down" : "stable";
        }
      } else if (c.key === "burnMultiple") {
        // lowerIsBetter — 1 미만은 호전
        if (typeof c.value === "number") {
          c.trend = c.value < 1 ? "up" : c.value > 2 ? "down" : "stable";
        }
      } else if (c.key === "runwayMonths") {
        if (typeof c.value === "number") {
          c.trend = c.value >= 18 ? "up" : c.value < 6 ? "down" : "stable";
        }
      }
    });

    // ── 헬스 정렬 (critical → warning → healthy) ──
    const healthRank: Record<MetricCard["health"], number> = {
      critical: 0, warning: 1, unknown: 2, healthy: 3,
    } as Record<StartupMetricHealth | "unknown", number>;
    cards.sort((a, b) => healthRank[a.health] - healthRank[b.health]);

    // ── Next Action (필요 컨텍스트 주입) ──
    const ctx: StartupContext = {
      monthlyFixedCosts,
      monthlyRevenue,
      salesMarketingSpend: costs.marketing ?? 0,
      industry,
    };
    // 표시 중인 카드와 동일한 메트릭의 액션만
    const visibleKeys = new Set(set);
    const allActions = getMetricActions(metrics, ctx);
    const actions = allActions.filter((a) => visibleKeys.has(a.metricKey));

    // ── notReadyReason ──
    let notReadyReason: string | null = null;
    if (entries.length === 0 && totalCosts === 0) {
      notReadyReason = "매출과 월 비용을 입력하면 핵심 지표가 표시됩니다";
    } else if (entries.length < 7) {
      notReadyReason = `매출 ${entries.length}일 / 7일 이상 권장`;
    }

    return { metrics, cards, actions, notReadyReason, industry };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyEntries, monthlyCosts, selectedIndustryCategoryId, selectedBudget, initialOperatingCapital]);
}

/** 외부 노출 (디버그·재사용용) */
export { inferMetricIndustry, METRIC_SETS, METRIC_LABELS_KO };
export type { MetricIndustry };
