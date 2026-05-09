"use client";

/**
 * useDashboardComputed — 운영 대시보드의 모든 계산 값 단일 소스.
 *
 * 이전: OperationalDashboard.tsx 안에 280줄 인라인 계산.
 * 이후: 훅 1개 → 모든 tier 섹션이 동일 컴퓨티드 객체 (`c`) 참조.
 *
 * 새 카드 추가 시 흐름:
 *   1. 이 훅에 필요한 값이 이미 있는지 확인 (대부분 있음)
 *   2. 없으면 추가 계산해서 c 에 export
 *   3. 해당 tier 섹션 파일에서 c.someValue 사용
 */

import { useEffect, useMemo, useState, useRef } from "react";
import type { DashboardHook } from "../useDashboard";
import { calculateHealthMetrics, buildTaxCalendar, calculateCostRatios } from "@build-up/shared";
import type { MonthlyCosts } from "@build-up/shared";
import { getBusinessDay } from "../utils/business-day";
import { useUnifiedSaasMetrics } from "./useUnifiedSaasMetrics";
import { checkMilestones } from "../components/dashboard/MilestoneToast";

export type DailyEntry = {
  date: string;
  sales: number;
  customers: number;
};

export type InventoryEntry = {
  id: string;
  name: string;
  quantity: number;
  minThreshold?: number;
  unit?: string;
};

export type EmployeeEntry = {
  id: string;
  name: string;
  hourlyWage?: number;
  weeklyHours?: number;
  isInsured?: boolean;
};

export type DashboardComputed = ReturnType<typeof useDashboardComputed>;

export function useDashboardComputed(d: DashboardHook) {
  const ko = d.language === "ko";
  const isStartupCompany = d.businessCtx.categoryId === "startup-tech";
  const isOnlineCategory = d.businessCtx.categoryId === "online-digital";
  const usesSubscriptions = !!d.usesSubscriptions;

  // SaaS 사용자 지표 통합 (스타트업 업종에만 활성, 그 외는 빈 결과)
  const saasMetrics = useUnifiedSaasMetrics({
    industryCategoryId: d.businessCtx.categoryId,
    fromDays: 30,
  });

  // 뷰포트 (responsive)
  const [viewportWidth, setViewportWidth] = useState(1440);
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isWide = viewportWidth >= 980;
  const isThreeUp = viewportWidth >= 1220;

  // 일자 컷오프
  const todayStr = getBusinessDay(new Date(), {
    categoryId: d.industryCategoryId,
    closeTime: d.businessCloseTime,
  });
  const currentMonth = todayStr.slice(0, 7);

  // 매출 entries (ASC 정렬)
  const allEntriesRaw = d.dailyEntries as DailyEntry[];
  const allEntries = useMemo(
    () => [...allEntriesRaw].sort((a, b) => a.date.localeCompare(b.date)),
    [allEntriesRaw],
  );
  const monthEntries = useMemo(
    () => allEntries.filter((e) => e.date.startsWith(currentMonth)),
    [allEntries, currentMonth],
  );
  const todayEntry = allEntries.find((e) => e.date === todayStr);
  const recent7Entries = allEntries.slice(-7);
  const previous7Entries = allEntries.slice(-14, -7);

  // 매출 집계
  const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
  const totalCustomers = monthEntries.reduce((s, e) => s + e.customers, 0);
  const workingDays = monthEntries.length;
  const avgDailySales = workingDays > 0 ? totalSales / workingDays : 0;
  const recent7Sales = recent7Entries.reduce((s, e) => s + e.sales, 0);
  const previous7Sales = previous7Entries.reduce((s, e) => s + e.sales, 0);
  const weeklySalesChange =
    previous7Sales > 0
      ? Math.round(((recent7Sales - previous7Sales) / previous7Sales) * 100)
      : 0;

  // 비용 집계
  const monthlyCosts = d.monthlyCosts as {
    ingredients: number;
    labor: number;
    rent: number;
    utilities: number;
    sga: number;
    marketing: number;
    other: number;
    interest: number;
  };
  const totalCosts =
    (monthlyCosts.ingredients ?? 0) +
    (monthlyCosts.labor ?? 0) +
    (monthlyCosts.rent ?? 0) +
    (monthlyCosts.utilities ?? 0) +
    (monthlyCosts.sga ?? 0) +
    (monthlyCosts.marketing ?? 0) +
    (monthlyCosts.other ?? 0) +
    (monthlyCosts.interest ?? 0);
  const netProfit = totalSales - totalCosts;

  // 위기 elevation flag
  const _budgetForRunway = (d.selectedBudget ?? 0) as number;
  const _runwayMonths =
    totalCosts > 0 && _budgetForRunway > 0 ? _budgetForRunway / totalCosts : Infinity;
  const cashflowCriticalElevation = Number.isFinite(_runwayMonths) && _runwayMonths < 6;

  // 예상 매출
  const projectedSales =
    workingDays > 0
      ? totalSales +
        avgDailySales *
          (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
            new Date().getDate())
      : 0;
  const projectedProfit = projectedSales - totalCosts;
  // 비용 비율 — cost-ratios.ts SSOT (월간 비용 ÷ 월 환산 매출, 부분월 입력 보정)
  const _ratios = calculateCostRatios({
    costs: {
      ingredients: monthlyCosts.ingredients ?? 0, labor: monthlyCosts.labor ?? 0,
      rent: monthlyCosts.rent ?? 0, utilities: monthlyCosts.utilities ?? 0,
      sga: (monthlyCosts as { sga?: number }).sga ?? 0,
      marketing: (monthlyCosts as { marketing?: number }).marketing ?? 0,
      other: monthlyCosts.other ?? 0,
    },
    totalRevenue: totalSales,
    days: workingDays,
  });
  const ingredientRatio = _ratios.ingredientRatio;
  const laborRatio = _ratios.laborRatio;
  const rentRatio = _ratios.rentRatio;
  const primeCost = _ratios.primeCostRatio;
  // BEP 진행률 — 월 환산 매출 / 월 비용
  const bepProgress = totalCosts > 0 && _ratios.monthlyRevenueEquivalent > 0
    ? Math.min(100, (_ratios.monthlyRevenueEquivalent / totalCosts) * 100)
    : 0;

  // 건강도 메트릭
  const healthMetrics = calculateHealthMetrics(
    allEntries as Array<{ date: string; sales: number; customers: number }>,
    monthlyCosts as MonthlyCosts,
  );
  const breakEvenDailySales = healthMetrics.breakEvenDailySales;
  const daysAboveBreakEven = healthMetrics.daysAboveBreakEven;
  const todaySales = todayEntry?.sales ?? 0;
  const todayBepProgress =
    breakEvenDailySales > 0
      ? Math.min(100, Math.round((todaySales / breakEvenDailySales) * 100))
      : 0;

  // 세금 캘린더
  const taxCalendar = buildTaxCalendar({
    isSimplified:
      ((d.taxSettings as { vatType?: string })?.vatType ?? "general") === "simplified",
    hasEmployees: (d.employees as unknown[])?.length > 0,
  });
  const nextTaxItem = taxCalendar.next;

  // 지난달 비교
  const costHistory = d.costHistory as Array<{
    month: string;
    ingredients: number;
    labor: number;
    rent: number;
    utilities: number;
    other: number;
  }>;
  const prevMonthKey = (() => {
    const dt = new Date();
    dt.setMonth(dt.getMonth() - 1);
    return dt.toISOString().slice(0, 7);
  })();
  const prevSnap = costHistory.find((h) => h.month === prevMonthKey);
  const prevMonthCosts = prevSnap
    ? prevSnap.ingredients + prevSnap.labor + prevSnap.rent + prevSnap.utilities + prevSnap.other
    : undefined;
  const prevMonthEntries = allEntries.filter((e) => e.date.startsWith(prevMonthKey));
  const prevMonthSales =
    prevMonthEntries.length > 0 ? prevMonthEntries.reduce((s, e) => s + e.sales, 0) : undefined;

  // 재고 / 직원
  const inventory = d.inventory as InventoryEntry[];
  const lowStockItems = inventory.filter((i) => i.quantity <= (i.minThreshold ?? 0));
  const employees = d.employees as EmployeeEntry[];
  const estimatedMonthlyPayroll = employees.reduce(
    (sum, e) => sum + (e.hourlyWage ?? 0) * (e.weeklyHours ?? 0) * 4.34,
    0,
  );
  const insuredEmployees = employees.filter((e) => e.isInsured).length;
  const monthlyBurn = Math.max(totalCosts - totalSales, 0);

  // 개업 일자 / 런웨이
  const launchDateText =
    typeof window !== "undefined" ? window.localStorage.getItem("businessLaunchedDate") : null;
  const launchDate =
    launchDateText && !Number.isNaN(new Date(launchDateText).getTime())
      ? new Date(launchDateText)
      : null;
  const daysSinceLaunch = launchDate
    ? Math.max(0, Math.round((Date.now() - launchDate.getTime()) / 86400000))
    : 0;
  const totalCapital = (d.selectedBudget ?? 0) + (d.initialOperatingCapital ?? 0);
  const capitalLeft = Math.max(0, totalCapital - totalCosts * (daysSinceLaunch / 30));
  const runwayMonths =
    totalCosts > 0 && netProfit < 0
      ? Math.max(0, Math.round(capitalLeft / Math.abs(netProfit)))
      : -1;

  // 건강 라벨
  const healthTone =
    d.businessHealthScore === "healthy"
      ? "#177245"
      : d.businessHealthScore === "danger"
        ? "#b42318"
        : d.businessHealthScore === "caution"
          ? "#b54708"
          : "rgba(15, 23, 42, 0.82)";
  const healthLabel =
    d.businessHealthScore === "healthy"
      ? ko ? "안정" : "Healthy"
      : d.businessHealthScore === "danger"
        ? ko ? "위험" : "Critical"
        : d.businessHealthScore === "caution"
          ? ko ? "주의" : "Caution"
          : ko ? "미확인" : "Unknown";
  const weeklySignalLabel =
    previous7Sales > 0
      ? `${weeklySalesChange >= 0 ? "+" : ""}${weeklySalesChange}%`
      : ko ? "비교 데이터 없음" : "No comparison";

  // AI 코치 톱 액션
  const aiTopAction = d.aiActions?.todayActions?.[0];
  const aiCrisis = d.aiActions?.crisisActions?.[0];
  const topRiskLabel = aiCrisis
    ? aiCrisis.title
    : aiTopAction?.priority === "high"
      ? aiTopAction.title
      : runwayMonths >= 0 && runwayMonths <= 3
        ? ko ? `런웨이 ${runwayMonths}개월` : `${runwayMonths} mo runway`
        : lowStockItems.length > 0
          ? ko ? `재고 경고 ${lowStockItems.length}건` : `${lowStockItems.length} stock alerts`
          : employees.length === 0
            ? ko ? "인력 플랜 필요" : "Team plan needed"
            : ko ? "핵심 리스크 낮음" : "Low immediate risk";
  const focusMessage = aiCrisis
    ? aiCrisis.impact
    : aiTopAction?.priority === "high"
      ? aiTopAction.reason
      : runwayMonths >= 0 && runwayMonths <= 3
        ? ko
          ? "지금은 성장보다 현금 방어가 우선입니다. 고정비와 저효율 지출부터 줄이세요."
          : "Cash defense comes before growth. Cut fixed and low-efficiency spend first."
        : weeklySalesChange < 0
          ? ko
            ? "전주 대비 하락세입니다. 신규 유입보다 재구매와 전환 병목부터 점검하세요."
            : "Weekly trend is down. Fix retention and conversion before chasing more acquisition."
          : lowStockItems.length > 0
            ? ko
              ? "매출을 만들 수 있어도 재고가 막으면 성장이 멈춥니다. 발주 우선순위를 정하세요."
              : "Stockouts can kill growth. Prioritize reorder decisions now."
            : ko
              ? "오늘은 매출 기록, 병목 점검, 핵심 운영 자산 유지에 집중하면 됩니다."
              : "Today, focus on logging revenue, checking bottlenecks, and protecting core operations.";

  // AI 액션 자동 로드
  const aiLoadAttemptedRef = useRef(false);
  useEffect(() => {
    if (
      !d.aiActions &&
      !d.aiActionsLoading &&
      d.businessLaunched &&
      d.storeName &&
      !aiLoadAttemptedRef.current
    ) {
      aiLoadAttemptedRef.current = true;
      void d.fetchAiActions().finally(() => {
        setTimeout(() => {
          aiLoadAttemptedRef.current = false;
        }, 5000);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.aiActions, d.aiActionsLoading, d.businessLaunched, d.storeName]);

  // streak
  const streak = (() => {
    let count = 0;
    const checkDate = new Date();
    const todayE = allEntries.find((e) => e.date === todayStr);
    if (!todayE) checkDate.setDate(checkDate.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().slice(0, 10);
      if (allEntries.some((e) => e.date === ds)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return count;
  })();

  // milestone
  const healthScore =
    typeof d.businessHealthScore === "string"
      ? d.businessHealthScore === "healthy"
        ? 85
        : d.businessHealthScore === "caution"
          ? 55
          : 30
      : 0;
  const [dismissedMilestones, setDismissedMilestones] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("dismissedMilestones");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const currentMilestone = checkMilestones({
    streak,
    totalEntries: allEntries.length,
    bepProgress,
    healthScore,
    completedStages: d.completedCount,
    dismissed: dismissedMilestones,
    ko,
  });
  const handleDismissMilestone = () => {
    if (!currentMilestone) return;
    const next = new Set(dismissedMilestones);
    next.add(currentMilestone.id);
    setDismissedMilestones(next);
    try {
      localStorage.setItem("dismissedMilestones", JSON.stringify([...next]));
    } catch {
      /* quota — ignore */
    }
  };

  return {
    ko,
    isStartupCompany,
    isOnlineCategory,
    usesSubscriptions,
    saasMetrics,
    viewportWidth,
    isWide,
    isThreeUp,
    todayStr,
    currentMonth,
    allEntries,
    monthEntries,
    todayEntry: todayEntry ?? null,
    recent7Entries,
    previous7Entries,
    totalSales,
    totalCustomers,
    workingDays,
    avgDailySales,
    recent7Sales,
    previous7Sales,
    weeklySalesChange,
    monthlyCosts,
    totalCosts,
    netProfit,
    cashflowCriticalElevation,
    projectedSales,
    projectedProfit,
    ingredientRatio,
    laborRatio,
    rentRatio,
    primeCost,
    bepProgress,
    healthMetrics,
    breakEvenDailySales,
    daysAboveBreakEven,
    todaySales,
    todayBepProgress,
    nextTaxItem,
    prevMonthCosts,
    prevMonthSales,
    inventory,
    lowStockItems,
    employees,
    estimatedMonthlyPayroll,
    insuredEmployees,
    monthlyBurn,
    launchDateText,
    daysSinceLaunch,
    totalCapital,
    capitalLeft,
    runwayMonths,
    healthTone,
    healthLabel,
    weeklySignalLabel,
    topRiskLabel,
    focusMessage,
    streak,
    healthScore,
    currentMilestone,
    handleDismissMilestone,
  };
}
