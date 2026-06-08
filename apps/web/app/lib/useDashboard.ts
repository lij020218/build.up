"use client";

import { useEffect, useRef } from "react";
import { getUiCopy, getRecommendedPrograms } from "@foundone/shared";
import { useCashflowStore } from "./stores/cashflow-store";
import { projectCashflow, detectCrisis } from "./services/cashflow-projection";
import { ageFromBirthYear } from "./components/dashboard/OwnerProfileChips";
import { recordTodayAction, getPreviousActionForPrompt } from "./services/morning-action-log";
import {
  useOperationsStore,
  useFinanceStore,
  useAiStore,
  useProfileStore,
  useRoadmapStore,
  useOnboardingStore,
} from "./stores";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../language-provider";
import type { DashboardSurface } from "./types";
import { GUIDE_STAGE_CODES, SURFACE_HREFS } from "./constants";
import { inferFinanceDefaults } from "./helpers";
import { getBusinessDay } from "./utils/business-day";

// ── Sub-hooks ──
import { useComputedDashboard } from "./hooks/useComputedDashboard";
import { useSelectionHandlers } from "./hooks/useSelectionHandlers";
import { useTaskHandlers } from "./hooks/useTaskHandlers";
import { useTaskAutoCompletion } from "./hooks/useTaskAutoCompletion";
import { useOnboardingHandlers } from "./hooks/useOnboardingHandlers";
import { useOperationsHandlers } from "./hooks/useOperationsHandlers";
import { useAiAnalysisHandlers } from "./hooks/useAiAnalysisHandlers";
import { usePersistence } from "./hooks/usePersistence";
import { useDataLoading } from "./hooks/useDataLoading";
import { getKstDate } from "./utils/business-day";
import { computeWeakestDayPct } from "./utils/weakest-day";

// ── Re-exported types (consumers import from useDashboard) ──
export type { DailyEntry, MonthlyCosts, CostSnapshot } from "./stores/finance-store";
export type {
  InventoryItem,
  InvForm,
  Employee,
  DeliveryPlatform,
  Product,
  UnifiedProduct,
  ServiceMenuItem,
  TaxSettings,
  FixedExpense,
  Member,
} from "./stores/operations-store";

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * useDashboard — 앱 전체 상태를 하나로 묶는 thin orchestrator hook
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * 역할
 * ────
 * - 6개 Zustand 스토어에서 raw state/setter를 읽어와 소비 컴포넌트에 일괄 전달
 * - 9개 sub-hook을 조합해 "computed + handlers + persistence" 를 단일 반환값으로 합성
 * - AI actions 일 1회 캐시(localStorage) 및 fetchAiActions 오케스트레이션 담당
 * - 스타트업/온라인 업종 rent/utilities 유령값 정리 migration effect 포함
 *
 * ────────────────────────────────────────────────────────────────────────────────
 * Sub-hook 구성도
 * ────────────────────────────────────────────────────────────────────────────────
 *  §1  useComputedDashboard   — currentStage, activeSurface, healthScore, industryCategoryId
 *  §2  useSelectionHandlers   — handleIndustryContinue … handleSignOut, resetDemo
 *  §3  useTaskHandlers        — handleContractTaskToggle … handleLaunchBusiness
 *  §4  useTaskAutoCompletion  — task 자동 완료 사이드이펙트
 *  §5  useOnboardingHandlers  — handleExistingBusinessComplete, handleAIRoadmapComplete
 *  §6  useOperationsHandlers  — handleAddDailyEntry … saveTaxSettings
 *  §7  useAiAnalysisHandlers  — contractTasks, activeGuide, effectiveGuideAnswer
 *  §8  usePersistence         — connectAndLoad, flushStoreData, collectStoreData (SSOT)
 *  §9  useDataLoading         — contractors, nearbyFranchiseStores, locationMapReady
 *
 * ────────────────────────────────────────────────────────────────────────────────
 * Zustand 스토어 매핑
 * ────────────────────────────────────────────────────────────────────────────────
 *  useOnboardingStore  → auth·UI 상태 (showOnboardingChoice, authLabel, persistenceLabel …)
 *  useProfileStore     → 업종·창업 설정 (selectedIndustryId, storeName, businessLaunched …)
 *  useRoadmapStore     → AI 로드맵 (roadmap, taskMap, decisions, stageGuideContent …)
 *  useFinanceStore     → 매출·비용 (dailyEntries, monthlyCosts, costHistory …)
 *  useOperationsStore  → 운영 데이터 (inventory, employees, products, subscriptionPlans …)
 *  useAiStore          → AI 결과 (aiActions, contractAnalysis, guideAnswer …)
 *
 * ────────────────────────────────────────────────────────────────────────────────
 * AI actions 캐시 규칙 (KST 자정 무효)
 * ────────────────────────────────────────────────────────────────────────────────
 *  key: "foundone-ai-actions-v1:{userId}:{YYYY-MM-DD}"
 *  - force=true → 캐시 우회, LLM 재호출
 *  - 매출 미기록 ≥ 3일 → skip (stale-data)
 *  - 미런칭 → skip (not-launched)
 *
 * ────────────────────────────────────────────────────────────────────────────────
 * @param surface  현재 화면 탭 ("home" | "franchise" | "reports" | …)
 *                 기본값 "home" — StarterStageDemo 에서 activeSurface 로 덮어씀
 */
export function useDashboard(surface: DashboardSurface = "home") {
  // ── 1. Framework deps ──
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const copy = getUiCopy(language);
  const deps = { language, copy, router, searchParams } as const;

  // ── 2. Zustand stores — bare state/setters passed through ──
  const onboardingStore = useOnboardingStore();
  const profileStore = useProfileStore();
  const roadmapStore = useRoadmapStore();
  const financeStore = useFinanceStore();
  const operationsStore = useOperationsStore();
  const aiStore = useAiStore();

  // Destructure what we need for passthrough & orchestration
  const {
    showOnboardingChoice, setShowOnboardingChoice,
    showExistingOnboarding, setShowExistingOnboarding,
    showAIRoadmapWizard, setShowAIRoadmapWizard,
    showRoleSelection, setShowRoleSelection,
    userRole, setUserRole,
    isResetting, resetProgress,
    authLabel, userName, persistenceLabel, persistenceReady,
    authResolved, requiresAuth,
    persistStatus, persistError, persistLastSavedAt,
    showProfileDetails, setShowProfileDetails,
    showMonthlyCostPrompt, setShowMonthlyCostPrompt,
    lastUnlocked,
    selectedStoreIndex, setSelectedStoreIndex,
    transitionNotice, setTransitionNotice,
  } = onboardingStore;

  const {
    selectedIndustryId, setSelectedIndustryId,
    selectedIndustryCategoryId, setSelectedIndustryCategoryId,
    selectedSpecialtyId, setSelectedSpecialtyId,
    selectedBusinessModelId, setSelectedBusinessModelId,
    selectedBudget, setSelectedBudget,
    budgetInputText, setBudgetInputText,
    initialOperatingCapital, setInitialOperatingCapital,
    operatingCapitalInputText, setOperatingCapitalInputText,
    selectedOpenDate, setSelectedOpenDate,
    selectedLocationId, setSelectedLocationId,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    startupType, setStartupType,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    storeName, setStoreName,
    businessOpenTime, setBusinessOpenTime,
    businessCloseTime, setBusinessCloseTime,
    cpaDecision, setCpaDecision,
    usesSubscriptions, setUsesSubscriptions,
    selectedRevenueModelId, setSelectedRevenueModelId,
    selectedInteriorConcept, setSelectedInteriorConcept,
    profile,
    saveStatus, setSaveStatus,
    businessLaunched, setBusinessLaunched,
    businessLaunchedDate,
    startupOperatingMode, setStartupOperatingMode,
  } = profileStore;

  const {
    decisions, setDecisions,
    roadmap, setRoadmap,
    taskMap, setTaskMap,
    viewingStageId, setViewingStageId,
    editSaveStatus,
    recommendedMarkets, setRecommendedMarkets,
    customMarketName, setCustomMarketName,
    customMarketReason, setCustomMarketReason,
    manualMarketEvaluation, setManualMarketEvaluation,
    manualAlternative, setManualAlternative,
    locationOptions,
    locationSourceLabel,
    vendorSelections, setVendorSelections,
    vendorCustomInputs, setVendorCustomInputs,
    opsSelections, setOpsSelections,
    opsPosChecks, setOpsPosChecks,
    opsStep, setOpsStep,
    softOpenChecks, setSoftOpenChecks,
    softOpenPricing, setSoftOpenPricing,
    softOpenStep, setSoftOpenStep,
    softOpenSkips, setSoftOpenSkips,
    taxChecks, setTaxChecks,
    loanChecks, setLoanChecks,
    contractSubChecks, setContractSubChecks,
    preLaunchVisibleIds, setPreLaunchVisibleIds,
    stageGuideContent,
    guideStepIndex, setGuideStepIndex,
    guideSelections, setGuideSelections,
  } = roadmapStore;

  const {
    showFinancePanel, setShowFinancePanel,
    financeCapitalText, setFinanceCapitalText,
    financeMonthlyRentText, setFinanceMonthlyRentText,
    financeLaborText, setFinanceLaborText,
    financeRevenueText, setFinanceRevenueText,
    financeMarketStyle, setFinanceMarketStyle,
    financeRentBand, setFinanceRentBand,
    financeStatus, financeError, financeResult, financeInterpretation,
    dailyEntries, setDailyEntries,
    dailyDateInput, setDailyDateInput,
    dailySalesInput, setDailySalesInput,
    dailyCustomersInput, setDailyCustomersInput,
    monthlyCosts, setMonthlyCosts,
    costHistory,
    costCogsText, setCostCogsText,
    costIngredientsText, setCostIngredientsText,
    costLaborText, setCostLaborText,
    costRentText, setCostRentText,
    costUtilitiesText, setCostUtilitiesText,
    costSgaText, setCostSgaText,
    costMarketingText, setCostMarketingText,
    costOtherText, setCostOtherText,
    costInterestText, setCostInterestText,
  } = financeStore;

  const {
    inventory, setInventory,
    invForm, setInvForm,
    invCategoryFilter, setInvCategoryFilter,
    invWasteTarget, setInvWasteTarget,
    invWasteQty, setInvWasteQty,
    invWasteReason, setInvWasteReason,
    employees, setEmployees,
    empFormOpen, setEmpFormOpen,
    empEditId, setEmpEditId,
    empName, setEmpName,
    empWage, setEmpWage,
    empHours, setEmpHours,
    empInsured, setEmpInsured,
    empHireDate, setEmpHireDate,
    fixedExpenses, setFixedExpenses,
    fexpFormOpen, setFexpFormOpen,
    fexpEditId, setFexpEditId,
    fexpName, setFexpName,
    fexpAmount, setFexpAmount,
    fexpDueDay, setFexpDueDay,
    fexpCategory, setFexpCategory,
    deliveryPlatforms, setDeliveryPlatforms,
    monthlyDeliverySales, setMonthlyDeliverySales,
    dlvFormOpen, setDlvFormOpen,
    dlvEditId, setDlvEditId,
    dlvName, setDlvName,
    dlvRate, setDlvRate,
    dlvAd, setDlvAd,
    products, setProducts,
    prodFormOpen, setProdFormOpen,
    prodEditId, setProdEditId,
    prodName, setProdName,
    prodCategory, setProdCategory,
    prodPrice, setProdPrice,
    prodCost, setProdCost,
    prodStock, setProdStock,
    prodUnit, setProdUnit,
    unifiedProducts, setUnifiedProducts,
    serviceMenuItems, setServiceMenuItems,
    taxSettings, setTaxSettings,
    onlinePlatformSales, setOnlinePlatformSales,
    onlineSelectedPlatforms, setOnlineSelectedPlatforms,
    onlineSelectedCourier, setOnlineSelectedCourier,
    onlineMonthlyParcels, setOnlineMonthlyParcels,
    members, setMembers,
    memFormOpen, setMemFormOpen,
    memName, setMemName,
    memPlan, setMemPlan,
    memFee, setMemFee,
    memEnd, setMemEnd,
    subscriptionPlans, setSubscriptionPlans,
    subPlanFormOpen, setSubPlanFormOpen,
    subPlanEditId, setSubPlanEditId,
    subPlanName, setSubPlanName,
    subPlanPrice, setSubPlanPrice,
    subPlanCycle, setSubPlanCycle,
    subscribers, setSubscribers,
    subCustomerFormOpen, setSubCustomerFormOpen,
    subCustomerName, setSubCustomerName,
    subCustomerEmail, setSubCustomerEmail,
    subCustomerPlanId, setSubCustomerPlanId,
  } = operationsStore;

  const {
    selectedContractTaskId, setSelectedContractTaskId,
    contractText, setContractText,
    contractAnalysisStatus, contractAnalysisError, contractAnalysis, setContractAnalysis,
    selectedGuideSectionKey, setSelectedGuideSectionKey,
    guideQuestion, setGuideQuestion,
    guideQaStatus, guideQaError, guideAnswer, setGuideAnswer,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError, setKnowledgeQaError,
    permitGuides, taxGuides, loanGuides,
    aiActions, aiActionsLoading, setAiActions, setAiActionsLoading,
    aiActionsSkipReason, aiActionsError, setAiActionsSkipReason, setAiActionsError,
  } = aiStore;

  // ── 3. Init effect (store defaults that depend on copy) ──
  useEffect(() => {
    if (!authLabel) onboardingStore.setAuthLabel(copy.home.notConnected);
    if (!persistenceLabel) onboardingStore.setPersistenceLabel(copy.home.localDemoMode);
    if (!locationSourceLabel) roadmapStore.setLocationSourceLabel(copy.common.starterFallback);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 4. Shared refs ──
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 5. Sub-hook: computed dashboard ──
  const computed = useComputedDashboard(deps, surface);
  const {
    industryCategoryId, currentStage, completedCount, activeSurface,
    businessCtx, businessHealthScore, selectedIndustryLabel,
    pathTotalStages,
  } = computed;

  // ── 5b. Migration: 스타트업/온라인 업종은 자동 추정된 rent/utilities 정리 ──
  //  과거 버전에서 estimateMonthlyCosts() 가 startup-tech/online-digital 에도
  //  자동으로 rent/utilities 를 채워넣던 버그가 있었음. 사용자가 직접 입력한 적이 없으면
  //  (costRentText, costUtilitiesText 가 비어있으면) 자동으로 0 으로 정리.
  const migrationDoneRef = useRef(false);
  useEffect(() => {
    if (migrationDoneRef.current) return;
    if (!industryCategoryId) return;
    const isPlaceless = industryCategoryId === "startup-tech" || industryCategoryId === "online-digital";
    if (!isPlaceless) { migrationDoneRef.current = true; return; }
    const mc = monthlyCosts as { rent?: number; utilities?: number } | undefined;
    if (!mc) return;
    const hasGhostRent = (mc.rent ?? 0) > 0 && !costRentText;
    const hasGhostUtilities = (mc.utilities ?? 0) > 0 && !costUtilitiesText;
    if (hasGhostRent || hasGhostUtilities) {
      setMonthlyCosts({
        ...(monthlyCosts as Record<string, number>),
        rent: hasGhostRent ? 0 : (mc.rent ?? 0),
        utilities: hasGhostUtilities ? 0 : (mc.utilities ?? 0),
      } as typeof monthlyCosts);
    }
    migrationDoneRef.current = true;
  }, [industryCategoryId, monthlyCosts, costRentText, costUtilitiesText, setMonthlyCosts]);

  // ── 6. Sub-hook: persistence ──
  const persistence = usePersistence(deps, surface);
  const { collectStoreData, flushStoreData, flushStoreDataImmediate, cancelAllAutosaves, setResetting } = persistence;

  // ── 7. fetchAiActions (defined here — used by onboarding & data loading) ──
  const aiActionsLoadedRef = useRef(false);
  type DailyEntryLocal = { date: string; sales: number; customers: number };
  type MonthlyCostsLocal = { ingredients: number; labor: number; rent: number; utilities: number; other: number };
  type InventoryItemLocal = { id: string; name: string; quantity: number; minThreshold: number; [key: string]: unknown };

  // ── AI actions 일 1회 캐시 (사용자 신고 2026-05-11) ──────────────────────
  //  "오늘의 집중" hero 가 새로고침마다 LLM 비결정성으로 매번 다른 액션을 보였음.
  //  하루 같은 메시지가 보이는 게 자연스럽고, API 호출 비용도 절감.
  //  키: 사용자 ID + KST 날짜. 자정(KST) 지나면 자동 무효 (옛 키는 cleanup).
  //
  //  ※ industryInsight 는 useIndustryInsight.ts 가 이미 동일 패턴으로 캐싱.
  const AI_ACTIONS_CACHE_PREFIX = "foundone-ai-actions-v1:";
  const todayKst = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const buildAiActionsCacheKey = (userId: string) => `${AI_ACTIONS_CACHE_PREFIX}${userId}:${todayKst()}`;
  const loadCachedAiActions = (userId: string): unknown | null => {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(buildAiActionsCacheKey(userId));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const saveCachedAiActions = (userId: string, data: unknown): void => {
    if (typeof localStorage === "undefined") return;
    try {
      const currentKey = buildAiActionsCacheKey(userId);
      localStorage.setItem(currentKey, JSON.stringify(data));
      // 오래된 키 정리 (오늘 KST 아닌 것)
      const today = todayKst();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(AI_ACTIONS_CACHE_PREFIX)) continue;
        if (!k.endsWith(`:${today}`)) localStorage.removeItem(k);
      }
    } catch { /* quota / private mode — 무시 */ }
  };

  /**
   * @param force true 면 캐시 무시하고 LLM 재호출 (Retry 버튼·수동 재생성).
   */
  const fetchAiActions = async (force?: boolean) => {
    if (aiActionsLoading) return;

    // ── 가드 A: 미런칭
    if (!businessLaunched || !storeName) {
      setAiActionsSkipReason("not-launched");
      return;
    }

    const entries = dailyEntries as DailyEntryLocal[];

    // ── 가드 B: 매출 미기록 2일 이상 → 할루시네이션 방지 (MorningBriefing hero가 "매출 입력" 프롬프트 담당)
    if (entries.length > 0) {
      const latestDate = entries.reduce((acc, e) => (e.date > acc ? e.date : acc), entries[0].date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const last = new Date(latestDate); last.setHours(0, 0, 0, 0);
      const daysSinceLast = Math.max(0, Math.round((today.getTime() - last.getTime()) / 86400000));
      // ⚠️ 2026-05-18: 임계값 2 → 3 으로 완화. 주말 매출 입력 안 한 월요일 출근 사장님이 가장 중요한
      //   순간에 AI 카드 사라지는 경험 방지. 메모 `feedback_morning_brief_stale_threshold` 와 통일.
      if (daysSinceLast >= 3) {
        setAiActionsSkipReason("stale-data");
        return;
      }
    }

    // 정상 시작 — skip/error 상태 초기화
    setAiActionsSkipReason(null);
    setAiActionsError(null);
    setAiActionsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setAiActionsSkipReason("no-session");
        return;
      }

      // 일 1회 캐시 hit — 오늘 KST 안에 이미 생성한 액션이 있으면 그대로 사용.
      //   "오늘의 집중" 이 새로고침마다 바뀌던 문제 차단. force=true 면 우회.
      if (!force) {
        const cached = loadCachedAiActions(session.user.id);
        if (cached) {
          setAiActions(cached as Parameters<typeof setAiActions>[0]);
          setAiActionsLoading(false);
          return;
        }
      }
      const recent30 = entries.filter(e => {
        const d = new Date(e.date);
        const ago = new Date(); ago.setDate(ago.getDate() - 30);
        return d >= ago;
      });
      const monthlySales = recent30.reduce((s, e) => s + e.sales, 0);
      const mc = monthlyCosts as MonthlyCostsLocal;
      const totalCost = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;
      const primeRate = monthlySales > 0 ? ((mc.ingredients + mc.labor) / monthlySales) * 100 : 0;
      const monthlyNet = monthlySales - totalCost;
      const launchDateStr = businessLaunchedDate;
      const daysSinceLaunchCalc = launchDateStr ? Math.max(0, Math.round((Date.now() - new Date(launchDateStr).getTime()) / 86400000)) : 30;
      const totalCapital = (selectedBudget ?? 0) + (initialOperatingCapital ?? 0);
      const capitalLeft = Math.max(0, totalCapital - totalCost * (daysSinceLaunchCalc / 30));
      const runway = totalCost > 0 && monthlyNet < 0 ? Math.max(0, Math.round(capitalLeft / Math.abs(monthlyNet))) : -1;

      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(now); thisMonday.setDate(now.getDate() + mondayOffset);
      const lastMonday = new Date(thisMonday); lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday); lastSunday.setDate(lastSunday.getDate() - 1);
      const toIso = (d: Date) => getKstDate(d);
      // 일자 컷오프: 사장의 closeTime + 30분 (utils/business-day) — KST 정확
      const todayIso = getBusinessDay(now, { categoryId: selectedIndustryCategoryId, closeTime: businessCloseTime });
      const thisWeekSales = entries.filter(e => e.date >= toIso(thisMonday) && e.date <= todayIso).reduce((s, e) => s + e.sales, 0);
      const lastWeekSales = entries.filter(e => e.date >= toIso(lastMonday) && e.date <= toIso(lastSunday)).reduce((s, e) => s + e.sales, 0);
      const weeklyChange = lastWeekSales > 0 ? Math.round((thisWeekSales - lastWeekSales) / lastWeekSales * 100) : 0;

      // ── 룰 기반 선제 진단 (AI 호출 컨텍스트로 전달) ──
      // 사장님 화면에 이미 알림 표시된 anomaly 를 LLM 컨텍스트로 보내서
      // AI 코칭이 단순 데이터 분석을 넘어 "재료비 +8% 인상이 진짜 원인" 같은
      // 구체적 멘토링을 생성할 수 있도록 함.
      let proactiveInsightsForAI: Array<{ kind: string; severity: "critical" | "warning" | "info"; headline: string; analysis: string; suggestedAction: string }> = [];
      try {
        const { detectProactiveInsights } = await import("./services/profit-anomaly-detector");
        const curMonth = getKstDate(new Date()).slice(0, 7);
        const prevMonthDate = new Date(); prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const prevMonthKey = getKstDate(prevMonthDate).slice(0, 7);
        const thisMonthEntries = entries.filter(e => e.date.startsWith(curMonth));
        const prevMonthEntries = entries.filter(e => e.date.startsWith(prevMonthKey));
        const costSnapshots = (costHistory as Array<{ month: string; ingredients: number; labor: number; rent: number; utilities: number; other: number }>) ?? [];
        const prevSnap = costSnapshots.find(h => h.month === prevMonthKey);
        // 재고·마케팅 데이터도 함께 (없으면 해당 anomaly 자동 skip)
        let mktCampaigns: Array<{ channel: string; spend: number; attributedRevenue?: number; month: string }> | undefined;
        try {
          const { useMarketingStore: mktStore } = require("./stores/marketing-store");
          mktCampaigns = mktStore.getState().campaigns ?? undefined;
        } catch { /* skip */ }
        const insights = detectProactiveInsights({
          thisMonthEntries,
          prevMonthEntries,
          monthlyCosts: mc,
          prevMonthCosts: prevSnap,
          inventory: inventory as Array<{ name: string; quantity: number; minThreshold?: number; dailyUsage?: number; lastOrderedAt?: string }> | undefined,
          marketingCampaigns: mktCampaigns,
        });
        // critical/warning 만 LLM 에 전달 (info 는 화면 표시용)
        proactiveInsightsForAI = insights
          .filter(i => i.severity === "critical" || i.severity === "warning")
          .slice(0, 3)
          .map(i => ({
            kind: i.kind,
            severity: i.severity,
            headline: i.headline,
            analysis: i.analysis,
            suggestedAction: i.action,
          }));
      } catch (err) {
        console.warn("[fetchAiActions] anomaly detection failed:", err);
      }

      // ── 미래 지향 신호 (2026-06-05) — AI 가 "곧 일어날 일" 을 먼저 말하도록 ──
      const forwardSignals: Record<string, unknown> = (() => {
        const out: Record<string, unknown> = {};
        // 요일
        out.dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];
        // North Star Metric (사장님이 고른 핵심 지표) → 한국어 라벨로
        if (profileStore.northStarMetric && profileStore.northStarMetric !== "auto") {
          const nsm: Record<string, string> = {
            todaySales: "오늘 매출", avgDailySales14d: "14일 평균 매출", customers: "고객 수",
            aov: "객단가", weeklySales7d: "주간 매출", monthlyProfit: "월 순익", runway: "런웨이", mrr: "MRR",
          };
          out.northStarMetric = nsm[profileStore.northStarMetric] ?? profileStore.northStarMetric;
        }
        // 현금흐름 위기 — useMorningBriefingBrain 과 동일 로직 재사용(DRY)
        try {
          const cf = useCashflowStore.getState();
          if (cf.setupCompletedAt) {
            const crisis = detectCrisis(
              projectCashflow({
                currentBalance: cf.currentBalance,
                recentDailyEntries: entries,
                salesChannels: cf.salesChannels,
                fixedExpenses: cf.fixedExpenses,
                vatReserveEnabled: cf.vatReserveEnabled,
              }),
              cf.crisisThresholdDays,
            );
            if (crisis.willCrisis && crisis.daysUntilCrisis != null) {
              out.cashflowCrisis = { daysUntilCrisis: crisis.daysUntilCrisis, shortfallWon: Math.abs(crisis.shortfallAmount) };
            }
          }
        } catch { /* cashflow 미설정 — skip */ }
        // 곧 닥치는 의무 지출 (고정비 dueDay + 월급일) — 다음 14일
        const todayDate = now.getDate();
        const dUntil = (dueDay: number) => (dueDay >= todayDate ? dueDay - todayDate : dueDay + 30 - todayDate);
        const obligations: Array<{ label: string; daysUntil: number; amountWon: number }> = [];
        (fixedExpenses as { name: string; amount: number; dueDay: number }[]).forEach((f) => {
          const du = dUntil(f.dueDay);
          if (du >= 0 && du <= 14) obligations.push({ label: f.name, daysUntil: du, amountWon: f.amount });
        });
        if (profileStore.payDay) {
          const du = dUntil(profileStore.payDay);
          if (du >= 0 && du <= 14) obligations.push({ label: "직원 월급일", daysUntil: du, amountWon: 0 });
        }
        obligations.sort((a, b) => a.daysUntil - b.daysUntil);
        if (obligations.length > 0) out.upcomingObligations = obligations.slice(0, 4);
        // 매칭 정책자금 상위 1~2 (자금 부족 시 구체 제안용)
        try {
          const businessYears = businessLaunched && businessLaunchedDate
            ? Math.max(0, Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / (365 * 86400000)))
            : 0;
          const recs = getRecommendedPrograms({
            startupType: startupType || undefined,
            industryCategoryId,
            businessYears,
            region: preferredRegionInput || undefined,
            capital: selectedBudget ?? undefined,
            monthlyAvgRevenue: monthlySales > 0 ? monthlySales : undefined,
            runwayMonths: runway,
            age: ageFromBirthYear(profileStore.ownerBirthYear),
            ncbScore: profileStore.ownerNcbScore,
            consideringClosure: profileStore.ownerConsideringClosure,
            isDisabledOwner: profileStore.ownerIsDisabledOwner,
          }, 2);
          const programs = recs
            .filter((p) => p.applicationStatus !== "closed")
            .slice(0, 2)
            .map((p) => ({ name: p.name.ko, amount: p.amount ?? "", deadline: p.applicationDeadline ?? undefined }));
          if (programs.length > 0) out.matchedPrograms = programs;
        } catch { /* skip */ }
        // 전일 제안 후속 (액션→결과 루프)
        const prev = getPreviousActionForPrompt(session.user.id);
        if (prev) out.previousAction = prev;
        return out;
      })();

      const res = await fetch("/api/ai/dashboard/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          ...forwardSignals,
          industryCategoryId,
          // 세부업종 — 있으면 K-히트 사례 매칭 정밀도 향상 (예: chicken-burger > food)
          industrySubIndustryId: (profile as { subIndustryId?: string } | null)?.subIndustryId,
          industryLabel: industryCategoryId,
          storeName,
          monthlySales,
          monthlyCosts: mc,
          weeklyChange,
          primeRate,
          runway,
          hasEmployees: (employees as { id: string }[]).length > 0,
          employeeCount: (employees as { id: string }[]).length,
          businessHealthScore,
          daysSinceLaunch: daysSinceLaunchCalc,
          // 운영 단계 분류 (pre-launch / early / growth / mature)
          operatingPhase: (!businessLaunched
            ? "pre-launch"
            : daysSinceLaunchCalc > 90
              ? "mature"
              : daysSinceLaunchCalc > 30
                ? "growth"
                : "early") as "pre-launch" | "early" | "growth" | "mature",
          // 매출 트렌드 (최근 7일 vs 그 이전 7일) — 14일 미만이면 insufficient
          salesTrendDirection: ((): "improving" | "declining" | "stable" | "insufficient" => {
            const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
            const last14 = sorted.slice(-14);
            if (last14.length < 14) return "insufficient";
            const r7 = last14.slice(-7).reduce((s, e) => s + e.sales, 0) / 7;
            const p7 = last14.slice(0, 7).reduce((s, e) => s + e.sales, 0) / 7;
            if (p7 <= 0) return "insufficient";
            const ch = ((r7 - p7) / p7) * 100;
            return ch >= 5 ? "improving" : ch <= -5 ? "declining" : "stable";
          })(),
          // 요일별 매출 패턴 — 최약 요일이 일평균의 N% (AI 가 요일 타겟 제안에 활용)
          weakestDayPct: computeWeakestDayPct(entries),
          // 비용 구조 추세 (이번달 prime cost vs 지난달)
          ...(() => {
            const curMonth = getKstDate(new Date()).slice(0, 7);
            const prevDate = new Date(); prevDate.setMonth(prevDate.getMonth() - 1);
            const prevMonth = getKstDate(prevDate).slice(0, 7);
            const thisRev = entries.filter((e) => e.date.startsWith(curMonth)).reduce((s, e) => s + e.sales, 0);
            const prevRev = entries.filter((e) => e.date.startsWith(prevMonth)).reduce((s, e) => s + e.sales, 0);
            const costSnaps = (costHistory as Array<{ month: string; ingredients: number; labor: number }> | undefined) ?? [];
            const prevSnap = costSnaps.find((h) => h.month === prevMonth);
            if (!prevSnap || prevRev <= 0 || thisRev <= 0) return {};
            const prevPrime = ((prevSnap.ingredients + prevSnap.labor) / prevRev) * 100;
            return {
              prevPrimeRate: Math.round(prevPrime * 10) / 10,
              primeRateDeltaPct: Math.round((primeRate - prevPrime) * 10) / 10,
            };
          })(),
          // 사장님이 아직 안 써본 핵심 기능 — AI 코칭이 자연스럽게 nudge 가능
          unusedFeatures: ((): string[] | undefined => {
            const list: string[] = [];
            if (entries.length === 0) list.push("매출입력");
            if ((employees as Array<unknown>).length === 0) list.push("직원등록");
            if ((inventory as Array<unknown>).length === 0 && ["food", "cafe-dessert", "retail", "beauty", "pet"].includes(industryCategoryId)) list.push("재고등록");
            if ((fixedExpenses as Array<unknown>).length === 0) list.push("고정비등록");
            return list.length > 0 ? list : undefined;
          })(),
          pendingTaxEvents: [],
          // 제품·메뉴 등록 수 — AI 가 재료비 비율 신뢰도 판정 시 사용 (cost-ratios SSOT 와 정합).
          //  unifiedProducts 가 비어있어도 legacy products / serviceMenuItems 에 데이터 있으면 등록된 것으로 간주.
          productCount: ((unifiedProducts as Array<unknown> | undefined)?.length ?? 0)
            + ((products as Array<unknown> | undefined)?.length ?? 0)
            + ((serviceMenuItems as Array<unknown> | undefined)?.length ?? 0),
          lowStockItems: (inventory as InventoryItemLocal[]).filter(i => i.quantity <= i.minThreshold && i.minThreshold > 0).map(i => i.name).slice(0, 3),
          upcomingFixedExpenses: (() => {
            const today = new Date().getDate();
            return (fixedExpenses as { name: string; amount: number; dueDay: number }[])
              .filter(f => f.dueDay >= today && f.dueDay <= today + 7)
              .map(f => `${f.name} (${f.dueDay}일 ${Math.round(f.amount / 10000)}만원)`)
              .slice(0, 3);
          })(),
          currentRoadmapStage: !businessLaunched ? (currentStage as { code: string })?.code : undefined,
          isPreLaunch: !businessLaunched || undefined,
          // ✦ 룰 기반 선제 진단 — AI 가 데이터를 한 단계 깊이 코칭하도록 컨텍스트 보강
          proactiveInsights: proactiveInsightsForAI.length > 0 ? proactiveInsightsForAI : undefined,
          ...(selectedFranchiseBrandId ? { franchiseBrandId: selectedFranchiseBrandId } : {}),
          ...(businessCtx.expenseFields ? {
            expenseLabels: {
              ingredients: businessCtx.expenseFields[0]?.label?.ko ?? "재료비",
              labor: businessCtx.expenseFields[1]?.label?.ko ?? "인건비",
              rent: businessCtx.expenseFields[2]?.label?.ko ?? "임대료",
              utilities: businessCtx.expenseFields[3]?.label?.ko ?? "공과금",
              other: businessCtx.expenseFields[4]?.label?.ko ?? "기타",
            },
          } : {}),
          // 마케팅 데이터
          ...(() => {
            try {
              const { useMarketingStore: mktStore } = require("./stores/marketing-store");
              const mktState = mktStore.getState();
              const curMonth = getKstDate(new Date()).slice(0, 7);
              const monthCamps = (mktState.campaigns ?? []).filter((c: { month: string }) => c.month === curMonth);
              const totalMktSpend = monthCamps.reduce((s: number, c: { spend: number }) => s + c.spend, 0);
              const totalAttrRev = monthCamps.reduce((s: number, c: { attributedRevenue?: number }) => s + (c.attributedRevenue ?? 0), 0);
              const channels = [...new Set(monthCamps.map((c: { channel: string }) => c.channel))];
              return {
                totalMarketingSpend: totalMktSpend,
                activeChannels: channels,
                marketingRoas: totalMktSpend > 0 ? Math.round((totalAttrRev / totalMktSpend) * 10) / 10 : 0,
              };
            } catch { return {}; }
          })(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiActions(data);
        // 오늘(KST) 캐시에 저장 — 같은 사용자가 새로고침해도 동일한 hero 가 유지됨.
        saveCachedAiActions(session.user.id, data);
        // 액션→결과 루프: 오늘 최우선 액션을 기록 → 다음 날 아침 프롬프트가 후속 코칭.
        const topTitle = (data as { todayActions?: Array<{ title?: string }> })?.todayActions?.[0]?.title;
        if (typeof topTitle === "string") recordTodayAction(session.user.id, topTitle);
      } else {
        // API 에러 — 상태 + 메시지 저장 (사용자에게 "다시 시도" 버튼 제공 가능)
        let rawMsg = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody?.error) rawMsg = String(errBody.error);
        } catch { /* body 없음 */ }
        // 콘솔엔 진짜 원인 (admin 디버깅용), UI 엔 friendly 메시지.
        console.error("[fetchAiActions] API error:", res.status, rawMsg);
        setAiActionsSkipReason("error");
        setAiActionsError(humanizeAiError(rawMsg, res.status, language === "ko"));
      }
    } catch (err) {
      // 네트워크/기타 예외 — 로그 남기고 사용자에게 표면화
      console.error("[fetchAiActions] Exception:", err);
      setAiActionsSkipReason("error");
      const raw = err instanceof Error ? err.message : "Unknown error";
      setAiActionsError(humanizeAiError(raw, 0, language === "ko"));
    }
    finally { setAiActionsLoading(false); }
  };

  // AI 에러 → 사용자 친화적 메시지. raw 메시지엔 API 키·청구 정보·내부 토큰 등이
  //  포함될 수 있어 그대로 노출하면 안 됨. 사장님 시각에선 다 똑같이 "잠시 후 재시도".
  function humanizeAiError(raw: string, status: number, ko: boolean): string {
    const lower = raw.toLowerCase();
    // Anthropic 결제 잔액 / 카드 만료 / 요금제 문제 — admin 영역
    if (lower.includes("credit balance") || lower.includes("billing") || lower.includes("payment_required") || status === 402) {
      return ko
        ? "AI 코칭 일시 중단 — 관리자에게 문의해주세요 (서비스 점검 중)."
        : "AI coaching temporarily unavailable — contact admin.";
    }
    // Rate limit
    if (lower.includes("rate") && (lower.includes("limit") || lower.includes("exceeded"))) {
      return ko ? "AI 호출이 잠시 몰렸어요. 1분 뒤 다시 시도해주세요." : "AI is busy. Try again in a minute.";
    }
    // Overloaded
    if (lower.includes("overloaded") || status === 529) {
      return ko ? "AI 서버가 일시 과부하 상태입니다. 잠시 후 다시 시도해주세요." : "AI is overloaded. Try again shortly.";
    }
    // 인증 / 키 문제
    if (lower.includes("invalid api") || lower.includes("authentication") || status === 401) {
      return ko ? "AI 인증 오류 — 관리자에게 문의해주세요." : "AI authentication error — contact admin.";
    }
    // 그 외 — 일반화
    return ko
      ? "AI 코칭을 불러오지 못했어요. 잠시 후 다시 시도해주세요."
      : "Could not load AI coaching. Try again later.";
  }

  // Auto-load AI actions on first mount when business is launched
  useEffect(() => {
    if (businessLaunched && storeName && !aiActionsLoadedRef.current) {
      aiActionsLoadedRef.current = true;
      void fetchAiActions();
    }
  }, [businessLaunched, storeName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 8. Compute activeLocationCandidates & finalSelectedMarket ──
  const activeLocationCandidates =
    locationMode === "recommended" && !preferredRegionInput.trim()
      ? []
      : recommendedMarkets.length > 0
        ? recommendedMarkets
        : locationOptions;
  const finalSelectedMarket =
    locationMode === "direct"
      ? selectedLocationId === manualMarketEvaluation?.id
        ? manualMarketEvaluation
        : null
      : activeLocationCandidates.find((item) => item.id === selectedLocationId) ?? null;

  // ── 9. Sub-hook: selection handlers ──
  const selection = useSelectionHandlers({
    ...deps,
    industryCategoryId,
    finalSelectedMarket,
    locationMode,
    autosaveTimerRef,
    cancelAllAutosaves,
    setResetting,
  });

  // ── 10. Sub-hook: task handlers ──
  const tasks = useTaskHandlers(deps, collectStoreData);

  // ── 11. Sub-hook: task auto-completion (effects only) ──
  useTaskAutoCompletion(deps, surface, activeSurface);

  // ── 12. Sub-hook: onboarding handlers ──
  const onboarding = useOnboardingHandlers({
    ...deps,
    collectStoreData,
    fetchAiActions,
  });

  // ── 13. Sub-hook: operations handlers ──
  const operations = useOperationsHandlers({
    ...deps,
    flushStoreData,
    flushStoreDataImmediate,
    scheduleAiRefresh: onboarding.scheduleAiRefresh,
  });

  // ── 14. Sub-hook: AI analysis handlers ──
  const currentStageCode = currentStage?.code ?? "";
  const aiAnalysis = useAiAnalysisHandlers(deps, industryCategoryId, {
    currentStageCode,
    selectedIndustryLabel,
    finalSelectedMarket,
  });

  // ── 15. Sub-hook: data loading ──
  const dataLoading = useDataLoading(
    language,
    copy,
    industryCategoryId,
    currentStageCode,
    businessCtx,
  );

  // ── 16. Finance defaults sync effect ──
  const financeDefaults = inferFinanceDefaults(finalSelectedMarket, industryCategoryId);
  useEffect(() => {
    setFinanceMarketStyle(financeDefaults.marketStyle);
    setFinanceRentBand(financeDefaults.rentBand);
  }, [financeDefaults.marketStyle, financeDefaults.rentBand]); // eslint-disable-line react-hooks/exhaustive-deps

  // ════════════════════════════════════════════════════════════════════════════
  // Return — sub-hook spreads + bare store passthrough
  // ════════════════════════════════════════════════════════════════════════════
  return {
    // ── Sub-hook results (spread) ──
    ...computed,        // displayedStageId, currentStage, activeSurface, etc.
    ...selection,       // handleIndustryContinue … handleLocationContinue, handleSignOut, resetDemo
    ...tasks,           // handleContractTaskToggle … handleLaunchBusiness
    ...onboarding,      // handleExistingBusinessComplete, handleAIRoadmapComplete, scheduleAiRefresh
    ...operations,      // handleAddDailyEntry … saveTaxSettings, emptyInvForm
    ...aiAnalysis,      // contractTasks, activeGuide … effectiveGuideAnswer
    ...persistence,     // connectAndLoad, persistCurrentState, flushStoreData, etc.
    ...dataLoading,     // contractors, nearbyFranchiseStores, locationMapReady, etc.

    // ── Orchestrator-level computed ──
    activeLocationCandidates, finalSelectedMarket, financeDefaults,
    aiActions, aiActionsLoading, aiActionsSkipReason, aiActionsError, fetchAiActions,

    // ── Context hooks ──
    router, searchParams, language, setLanguage, copy,

    // ── Bare store state/setters (onboarding) ──
    showOnboardingChoice, setShowOnboardingChoice,
    showExistingOnboarding, setShowExistingOnboarding,
    showAIRoadmapWizard, setShowAIRoadmapWizard,
    showRoleSelection, setShowRoleSelection,
    userRole, setUserRole,
    isResetting, resetProgress,
    authLabel, userName, persistenceLabel, persistenceReady,
    authResolved, requiresAuth,
    persistStatus, persistError, persistLastSavedAt,
    showProfileDetails, setShowProfileDetails,
    showMonthlyCostPrompt, setShowMonthlyCostPrompt,
    lastUnlocked, selectedStoreIndex, setSelectedStoreIndex,
    transitionNotice, setTransitionNotice,

    // ── Bare store state/setters (profile) ──
    selectedIndustryId, setSelectedIndustryId,
    selectedIndustryCategoryId, setSelectedIndustryCategoryId,
    selectedSpecialtyId, setSelectedSpecialtyId,
    selectedBusinessModelId, setSelectedBusinessModelId,
    selectedBudget, setSelectedBudget, budgetInputText, setBudgetInputText,
    initialOperatingCapital, setInitialOperatingCapital,
    operatingCapitalInputText, setOperatingCapitalInputText,
    selectedOpenDate, setSelectedOpenDate,
    selectedLocationId, setSelectedLocationId,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    startupType, setStartupType,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    showFranchisePicker: profileStore.showFranchisePicker,
    setShowFranchisePicker: profileStore.setShowFranchisePicker,
    storeName, setStoreName,
    businessOpenTime, setBusinessOpenTime,
    businessCloseTime, setBusinessCloseTime,
    cpaDecision, setCpaDecision,
    usesSubscriptions, setUsesSubscriptions,
    selectedRevenueModelId, setSelectedRevenueModelId,
    selectedInteriorConcept, setSelectedInteriorConcept,
    profile, saveStatus, setSaveStatus,
    businessLaunched, setBusinessLaunched,
    businessLaunchedDate,
    startupOperatingMode, setStartupOperatingMode,

    // ── Bare store state/setters (roadmap) ──
    decisions, setDecisions, roadmap, setRoadmap, taskMap, setTaskMap,
    viewingStageId, setViewingStageId,
    editSaveStatus,
    recommendedMarkets, setRecommendedMarkets,
    customMarketName, setCustomMarketName,
    customMarketReason, setCustomMarketReason,
    manualMarketEvaluation, setManualMarketEvaluation,
    manualAlternative, setManualAlternative,
    locationOptions, locationSourceLabel,
    vendorSelections, setVendorSelections,
    vendorCustomInputs, setVendorCustomInputs,
    opsSelections, setOpsSelections,
    opsPosChecks, setOpsPosChecks,
    opsStep, setOpsStep,
    softOpenChecks, setSoftOpenChecks,
    softOpenPricing, setSoftOpenPricing,
    softOpenStep, setSoftOpenStep,
    softOpenSkips, setSoftOpenSkips,
    taxChecks, setTaxChecks, loanChecks, setLoanChecks,
    contractSubChecks, setContractSubChecks,
    preLaunchVisibleIds, setPreLaunchVisibleIds,
    stageGuideContent, guideStepIndex, setGuideStepIndex,
    guideSelections, setGuideSelections,

    // ── Bare store state/setters (finance) ──
    showFinancePanel, setShowFinancePanel,
    financeCapitalText, setFinanceCapitalText,
    financeMonthlyRentText, setFinanceMonthlyRentText,
    financeLaborText, setFinanceLaborText,
    financeRevenueText, setFinanceRevenueText,
    financeMarketStyle, setFinanceMarketStyle,
    financeRentBand, setFinanceRentBand,
    financeStatus, financeError, financeResult, financeInterpretation,
    dailyEntries, setDailyEntries, monthlyCosts, setMonthlyCosts, costHistory,
    dailyDateInput, setDailyDateInput,
    dailySalesInput, setDailySalesInput,
    dailyCustomersInput, setDailyCustomersInput,
    costCogsText, setCostCogsText,
    costIngredientsText, setCostIngredientsText,
    costLaborText, setCostLaborText,
    costRentText, setCostRentText,
    costUtilitiesText, setCostUtilitiesText,
    costSgaText, setCostSgaText,
    costMarketingText, setCostMarketingText,
    costOtherText, setCostOtherText,
    costInterestText, setCostInterestText,

    // ── Bare store state/setters (operations) ──
    // ⚠️ 2026-05-18: 명시 narrow — 종전엔 useDashboard 의 inference 가 inventory/employees 등을
    //   `unknown` 비슷한 wide type 으로 떨어뜨려 컴포넌트가 `as unknown as Foo[]` 패턴으로
    //   강제 캐스트해야 했음. store 타입을 직접 명시해 호출처가 `as InventoryItem[]` 정도로
    //   안전하게 narrow 할 수 있게 한다. (DetailTabs 의 local entity 타입 정합성 정정은 별도 turn.)
    inventory: inventory as import("./stores/operations-store").InventoryItem[],
    setInventory, invForm, setInvForm,
    invCategoryFilter, setInvCategoryFilter,
    invWasteTarget, setInvWasteTarget,
    invWasteQty, setInvWasteQty, invWasteReason, setInvWasteReason,
    employees: employees as import("./stores/operations-store").Employee[],
    setEmployees,
    empFormOpen, setEmpFormOpen, empEditId, setEmpEditId,
    empName, setEmpName, empWage, setEmpWage,
    empHours, setEmpHours, empInsured, setEmpInsured,
    empHireDate, setEmpHireDate,
    fixedExpenses, setFixedExpenses,
    fexpFormOpen, setFexpFormOpen, fexpEditId, setFexpEditId,
    fexpName, setFexpName, fexpAmount, setFexpAmount,
    fexpDueDay, setFexpDueDay, fexpCategory, setFexpCategory,
    deliveryPlatforms: deliveryPlatforms as import("./stores/operations-store").DeliveryPlatform[],
    setDeliveryPlatforms,
    monthlyDeliverySales, setMonthlyDeliverySales,
    dlvFormOpen, setDlvFormOpen, dlvEditId, setDlvEditId,
    dlvName, setDlvName, dlvRate, setDlvRate, dlvAd, setDlvAd,
    products: products as import("./stores/operations-store").Product[],
    setProducts,
    prodFormOpen, setProdFormOpen, prodEditId, setProdEditId,
    prodName, setProdName, prodCategory, setProdCategory,
    prodPrice, setProdPrice, prodCost, setProdCost,
    prodStock, setProdStock, prodUnit, setProdUnit,
    unifiedProducts, setUnifiedProducts,
    serviceMenuItems, setServiceMenuItems,
    taxSettings, setTaxSettings,
    onlinePlatformSales, setOnlinePlatformSales,
    onlineSelectedPlatforms, setOnlineSelectedPlatforms,
    onlineSelectedCourier, setOnlineSelectedCourier,
    onlineMonthlyParcels, setOnlineMonthlyParcels,
    members: members as import("./stores/operations-store").Member[],
    setMembers,
    memFormOpen, setMemFormOpen,
    memName, setMemName, memPlan, setMemPlan,
    memFee, setMemFee, memEnd, setMemEnd,
    subscriptionPlans, setSubscriptionPlans,
    subPlanFormOpen, setSubPlanFormOpen,
    subPlanEditId, setSubPlanEditId,
    subPlanName, setSubPlanName,
    subPlanPrice, setSubPlanPrice,
    subPlanCycle, setSubPlanCycle,
    subscribers, setSubscribers,
    subCustomerFormOpen, setSubCustomerFormOpen,
    subCustomerName, setSubCustomerName,
    subCustomerEmail, setSubCustomerEmail,
    subCustomerPlanId, setSubCustomerPlanId,

    // ── Bare store state/setters (AI) ──
    selectedContractTaskId, setSelectedContractTaskId,
    contractText, setContractText,
    contractAnalysisStatus, contractAnalysisError, contractAnalysis, setContractAnalysis,
    selectedGuideSectionKey, setSelectedGuideSectionKey,
    guideQuestion, setGuideQuestion,
    guideQaStatus, guideQaError, guideAnswer, setGuideAnswer,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError, setKnowledgeQaError,
    permitGuides, taxGuides, loanGuides,

    // ── Constants re-exported for surfaces ──
    GUIDE_STAGE_CODES, SURFACE_HREFS,
  };
}

export type DashboardHook = ReturnType<typeof useDashboard>;
