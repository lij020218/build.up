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
import { calculateHealthMetrics, buildTaxCalendar, calculateCostRatios, calculateHealthScore, TOTAL_EMPLOYER_RATE_PCT } from "@foundone/shared";
import type { MonthlyCosts, HealthScoreResult } from "@foundone/shared";
import { getBusinessDay, getKstDate, getKstMonthKey, prevMonthKey } from "../utils/business-day";
import { useUnifiedSaasMetrics } from "./useUnifiedSaasMetrics";
import { useUnifiedRevenue } from "./useUnifiedRevenue";
import { checkMilestones } from "../components/dashboard/MilestoneToast";
import { useCashflowStore } from "../stores/cashflow-store";
import { BP } from "../breakpoints";

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
  // material(식자재·소모품) | product(메뉴·판매상품). 메뉴 수익성 카드 분리에 사용.
  itemType?: "material" | "product";
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
  const isWide = viewportWidth >= BP.lg;
  const isThreeUp = viewportWidth >= BP.xxl;

  // 일자 컷오프
  const todayStr = getBusinessDay(new Date(), {
    categoryId: d.industryCategoryId,
    closeTime: d.businessCloseTime,
  });
  const currentMonth = todayStr.slice(0, 7);

  // 매출 entries (ASC 정렬)
  const allEntriesRaw = d.dailyEntries as DailyEntry[];
  // 2026-05-13 Step 5: useEffectiveRevenue 통합 — 수동 매출 + 자동 수집 (PortOne·
  //   TossPlace·CODEF·Popbill·CSV) 머지. 같은 날짜 충돌 시 *자동 수집 우선*
  //   (manual = 사장님 입력 추정 / unified = 실시간 결제·정산 데이터).
  //   ARCHITECTURE.md 미해결 부채 #1 해소 — 분석 카드 모두 자동 매출 반영.
  //   ActivitySnapshotCard 는 자체 useUnifiedRevenue 호출 유지 (source 표시 등).
  const unifiedRev = useUnifiedRevenue(30);
  const allEntries = useMemo(() => {
    const byDate = new Map<string, DailyEntry>();
    // manual 먼저 채움
    for (const e of allEntriesRaw) {
      byDate.set(e.date, { date: e.date, sales: e.sales, customers: e.customers });
    }
    // unified (자동 수집) 가 같은 날짜 있으면 *덮어쓰기* — 정책: 자동이 사장님 입력보다 정확
    // 사장님이 명시적으로 unified 보다 더 큰 manual 입력 했다면 sales max 사용해 정보 손실 방지
    for (const u of unifiedRev.entries) {
      const existing = byDate.get(u.date);
      if (!existing) {
        byDate.set(u.date, { date: u.date, sales: u.sales, customers: u.customers });
      } else {
        // 둘 다 있으면: sales 는 unified 우선 (자동 수집 = 실 결제), customers 는 max 사용
        byDate.set(u.date, {
          date: u.date,
          sales: u.sales > 0 ? u.sales : existing.sales,
          customers: Math.max(u.customers ?? 0, existing.customers ?? 0),
        });
      }
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [allEntriesRaw, unifiedRev.entries],
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

  // ⚠️ CRITICAL FIX (2026-05-11) ─────────────────────────────────────
  //  일 평균은 *경과 영업일수* 로 나눠야 한다. entry 개수로 나누면 입력 안 한 날을
  //  무시해서 평균이 과대 계상된다.
  //
  //  실제 사용자 신고: 누적 손님 26명, 7일+ 운영했는데 2일치만 입력
  //   · 버그: 26 / 2 = 13명 → 월 예상 390명 (잘못)
  //   · 수정: 26 / 7 = 3.7명 → 월 예상 약 112명 (현실)
  //
  //  분모: MAX(entry 개수, 이 달 경과 영업일수). 둘 다 봐서 큰 쪽 사용 — 보수적.
  //  같은 패턴 fix: CEOMorningHero (2026-05-08), UserActivityCard (2026-05-11), 여기 (2026-05-11)
  // ─────────────────────────────────────────────────────────────────
  const businessLaunchedDate = (d as { businessLaunchedDate?: string | null }).businessLaunchedDate ?? null;
  const calendarElapsedInMonth = (() => {
    const monthStartDate = new Date(`${currentMonth}-01T00:00:00`);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    // 개업일이 이 달 안에 있으면 그게 시작점. 그 외엔 월초.
    const businessStart = businessLaunchedDate ? new Date(businessLaunchedDate) : null;
    const effectiveStart = businessStart && businessStart > monthStartDate ? businessStart : monthStartDate;
    const days = Math.floor((todayDate.getTime() - effectiveStart.getTime()) / 86_400_000) + 1;
    return Math.max(1, Math.min(31, days));
  })();
  const avgDailyDenominator = Math.max(workingDays, calendarElapsedInMonth);
  const avgDailySales = avgDailyDenominator > 0 ? totalSales / avgDailyDenominator : 0;
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

  // 예상 매출 — ⚠️ 영업일 컷오프 기반. 종전엔 calendar `new Date().getDate()` 사용해서 23:30
  //   close-time 카페가 자정~01:00 사이에 보면 *영업일은 어제* 인데 calendar 가 오늘로 잡혀
  //   남은 영업일 -1 → projected 불일치. todayStr (getBusinessDay 결과) 의 일 부분 사용.
  const projectedSales =
    workingDays > 0
      ? totalSales +
        avgDailySales *
          (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
            parseInt(todayStr.slice(8, 10), 10))
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
  // SSOT 의 신뢰도 플래그 — UI 가 "비율 표시 vs '데이터 보강 필요' empty state" 분기에 사용.
  // 사용 예: PrimeCostCard 가 직접 division 하면 부분월 입력 시 비율 폭주. 이 플래그로 차단.
  const ratiosReady = _ratios.ready;
  const monthlyRevenueEquivalent = _ratios.monthlyRevenueEquivalent;
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
  const prevMonthKeyStr = prevMonthKey(getKstMonthKey());
  const prevSnap = costHistory.find((h) => h.month === prevMonthKeyStr);
  const prevMonthCosts = prevSnap
    ? prevSnap.ingredients + prevSnap.labor + prevSnap.rent + prevSnap.utilities + prevSnap.other
    : undefined;
  const prevMonthEntries = allEntries.filter((e) => e.date.startsWith(prevMonthKeyStr));
  const prevMonthSales =
    prevMonthEntries.length > 0 ? prevMonthEntries.reduce((s, e) => s + e.sales, 0) : undefined;

  // 재고 / 직원
  const inventory = d.inventory as InventoryEntry[];
  const lowStockItems = inventory.filter((i) => i.quantity <= (i.minThreshold ?? 0));
  const employees = d.employees as EmployeeEntry[];
  // 월 인건비 = 실부담(임금 + 주휴수당 + 사업주 4대보험). 종전 임금만 계산(×4.34)은 ~20% 과소표시 →
  //   StaffLaborCard.calcEmployee / iOS monthlyBurden 과 동일 공식으로 통일 (SSOT 요율, 4.345).
  const estimatedMonthlyPayroll = employees.reduce((sum, e) => {
    const wage = e.hourlyWage ?? 0;
    const hours = e.weeklyHours ?? 0;
    const weeklyAllowance = hours >= 15 ? (hours / 5) * wage : 0;
    const monthlyWage = Math.round((wage * hours + weeklyAllowance) * 4.345);
    const insurance = e.isInsured ? Math.round(monthlyWage * (TOTAL_EMPLOYER_RATE_PCT / 100)) : 0;
    return sum + monthlyWage + insurance;
  }, 0);
  const insuredEmployees = employees.filter((e) => e.isInsured).length;
  const monthlyBurn = Math.max(totalCosts - totalSales, 0);

  // 개업 일자 / 런웨이 — ⚠️ 단일 소스: d.businessLaunchedDate (store/Supabase). 종전엔 localStorage
  //   직접 read 했는데 store 와 두 값이 다르면 daysSinceLaunch / phase / runway 디바이스 간 불일치
  //   + SSR 환경에서 null 반환되어 hydration mismatch 잠재. d.businessLaunchedDate 만 신뢰.
  const launchDateText = d.businessLaunchedDate ?? null;
  const launchDate =
    launchDateText && !Number.isNaN(new Date(launchDateText).getTime())
      ? new Date(launchDateText)
      : null;
  const daysSinceLaunch = launchDate
    ? Math.max(0, Math.round((Date.now() - launchDate.getTime()) / 86400000))
    : 0;
  const totalCapital = (d.selectedBudget ?? 0) + (d.initialOperatingCapital ?? 0);
  // ⚠️ capitalLeft fix: 종전 공식 `totalCapital - totalCosts * (daysSinceLaunch / 30)` 는 totalCosts
  //   가 "이번 달 누계" 인데 daysSinceLaunch 전체 영업기간을 곱해서 1년 영업 가게 자본 12배 차감 →
  //   runway 음수 폭주. 이번 달 부분만 곱하도록 clamp.
  const monthFactor = Math.min(daysSinceLaunch, 30) / 30;
  const capitalLeft = Math.max(0, totalCapital - totalCosts * monthFactor);
  const runwayMonths =
    totalCosts > 0 && netProfit < 0
      ? Math.max(0, Math.round(capitalLeft / Math.abs(netProfit)))
      : -1;

  // 건강 라벨 — 신호등 컬러 금지. HEALTH_COLORS(@foundone/shared) 농담 스케일과 동일 SSOT:
  //   healthy=옅은 네이비(0.55), caution=짙은 네이비(0.85), danger=벽돌 danger(#b64c4c), unknown=뉴트럴.
  //   gauge·label 은 라벨(안정/주의/위험)을 항상 동반하므로 색만으로 구분하지 않음(색각 접근성).
  const healthTone =
    d.businessHealthScore === "healthy"
      ? "rgba(25,25,112,0.55)"
      : d.businessHealthScore === "danger"
        ? "#b64c4c"
        : d.businessHealthScore === "caution"
          ? "rgba(25,25,112,0.85)"
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
      const ds = getKstDate(checkDate);
      if (allEntries.some((e) => e.date === ds)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return count;
  })();

  // ── 경영 건강 점수 — SSOT (packages/shared/finance/health-score.ts) ──────
  //   5-dimension 합성 (Cash Safety / Profitability / Cost Efficiency / Sales Trend /
  //   Data Confidence). 업종별 가중치 분기 + null 차원 자동 재분배.
  //   웹 조사 출처 (2026-05-11): FinHealth Network · NetSuite · Altman Z' · Toast · StockTitan
  const currentBalance = useCashflowStore((s) => s.currentBalance);
  const healthScoreResult: HealthScoreResult = calculateHealthScore({
    industryCategoryId: d.industryCategoryId,
    totalRevenue: totalSales,
    workingDays,
    monthlyCosts: monthlyCosts as Parameters<typeof calculateHealthScore>[0]["monthlyCosts"],
    hasEmployees: employees.length > 0,
    currentBalance: currentBalance > 0 ? currentBalance : undefined,
    weeklySalesChangePct: weeklySalesChange,
    daysSinceLaunch,
    initialCapital: totalCapital > 0 ? totalCapital : undefined,
  });

  // milestone — 종합 점수 (null 시 0 으로 fallback, milestone 자체는 다른 트리거가 많아 OK)
  const healthScore = healthScoreResult.score ?? 0;
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
    ratiosReady,
    monthlyRevenueEquivalent,
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
    currentBalance: currentBalance > 0 ? currentBalance : undefined,
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
    /** SSOT 5-dim 결과 — UI 가 점수·grade·차원별 분해·신뢰도 모두 사용 */
    healthScoreResult,
    currentMilestone,
    handleDismissMilestone,
  };
}
