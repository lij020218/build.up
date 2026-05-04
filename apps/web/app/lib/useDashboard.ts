"use client";

import { useEffect, useRef } from "react";
import { getUiCopy } from "@build-up/shared";
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

// ════════════════════════════════════════════════════════════════════════════════
// useDashboard — thin orchestrator
// ════════════════════════════════════════════════════════════════════════════════

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

  const fetchAiActions = async () => {
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
      if (daysSinceLast >= 2) {
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
      const toIso = (d: Date) => d.toISOString().slice(0, 10);
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
        const curMonth = new Date().toISOString().slice(0, 7);
        const prevMonthDate = new Date(); prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const prevMonthKey = prevMonthDate.toISOString().slice(0, 7);
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

      const res = await fetch("/api/ai/dashboard/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
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
          pendingTaxEvents: [],
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
              const curMonth = new Date().toISOString().slice(0, 7);
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
      } else {
        // API 에러 — 상태 + 메시지 저장 (사용자에게 "다시 시도" 버튼 제공 가능)
        let msg = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody?.error) msg = String(errBody.error);
        } catch { /* body 없음 */ }
        console.error("[fetchAiActions] API error:", res.status, msg);
        setAiActionsSkipReason("error");
        setAiActionsError(msg);
      }
    } catch (err) {
      // 네트워크/기타 예외 — 로그 남기고 사용자에게 표면화
      console.error("[fetchAiActions] Exception:", err);
      setAiActionsSkipReason("error");
      setAiActionsError(err instanceof Error ? err.message : "Unknown error");
    }
    finally { setAiActionsLoading(false); }
  };

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
    inventory, setInventory, invForm, setInvForm,
    invCategoryFilter, setInvCategoryFilter,
    invWasteTarget, setInvWasteTarget,
    invWasteQty, setInvWasteQty, invWasteReason, setInvWasteReason,
    employees, setEmployees,
    empFormOpen, setEmpFormOpen, empEditId, setEmpEditId,
    empName, setEmpName, empWage, setEmpWage,
    empHours, setEmpHours, empInsured, setEmpInsured,
    fixedExpenses, setFixedExpenses,
    fexpFormOpen, setFexpFormOpen, fexpEditId, setFexpEditId,
    fexpName, setFexpName, fexpAmount, setFexpAmount,
    fexpDueDay, setFexpDueDay, fexpCategory, setFexpCategory,
    deliveryPlatforms, setDeliveryPlatforms,
    monthlyDeliverySales, setMonthlyDeliverySales,
    dlvFormOpen, setDlvFormOpen, dlvEditId, setDlvEditId,
    dlvName, setDlvName, dlvRate, setDlvRate, dlvAd, setDlvAd,
    products, setProducts,
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
    members, setMembers,
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
