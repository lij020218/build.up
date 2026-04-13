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
    authLabel, persistenceLabel, persistenceReady,
    authResolved, requiresAuth,
    showProfileDetails, setShowProfileDetails,
    showMonthlyCostPrompt, setShowMonthlyCostPrompt,
    lastUnlocked,
    selectedStoreIndex, setSelectedStoreIndex,
    transitionNotice, setTransitionNotice,
  } = onboardingStore;

  const {
    selectedIndustryId, setSelectedIndustryId,
    selectedIndustryCategoryId, setSelectedIndustryCategoryId,
    selectedBusinessModelId, setSelectedBusinessModelId,
    selectedBudget, setSelectedBudget,
    budgetInputText, setBudgetInputText,
    selectedOpenDate, setSelectedOpenDate,
    selectedLocationId, setSelectedLocationId,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    startupType, setStartupType,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    storeName, setStoreName,
    cpaDecision, setCpaDecision,
    selectedInteriorConcept, setSelectedInteriorConcept,
    profile,
    saveStatus, setSaveStatus,
    businessLaunched, setBusinessLaunched,
    businessLaunchedDate,
  } = profileStore;

  const {
    decisions, setDecisions,
    roadmap, setRoadmap,
    taskMap, setTaskMap,
    viewingStageId, setViewingStageId,
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
    costIngredientsText, setCostIngredientsText,
    costLaborText, setCostLaborText,
    costRentText, setCostRentText,
    costUtilitiesText, setCostUtilitiesText,
    costOtherText, setCostOtherText,
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

  // ── 6. Sub-hook: persistence ──
  const persistence = usePersistence(deps, surface);
  const { collectStoreData, flushStoreData } = persistence;

  // ── 7. fetchAiActions (defined here — used by onboarding & data loading) ──
  const aiActionsLoadedRef = useRef(false);
  type DailyEntryLocal = { date: string; sales: number; customers: number };
  type MonthlyCostsLocal = { ingredients: number; labor: number; rent: number; utilities: number; other: number };
  type InventoryItemLocal = { id: string; name: string; quantity: number; minThreshold: number; [key: string]: unknown };

  const fetchAiActions = async () => {
    if (aiActionsLoading || !businessLaunched || !storeName) return;
    setAiActionsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const entries = dailyEntries as DailyEntryLocal[];
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
      const capitalLeft = Math.max(0, (selectedBudget ?? 0) - totalCost * (daysSinceLaunchCalc / 30));
      const runway = totalCost > 0 && monthlyNet < 0 ? Math.max(0, Math.round(capitalLeft / Math.abs(monthlyNet))) : -1;

      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const thisMonday = new Date(now); thisMonday.setDate(now.getDate() + mondayOffset);
      const lastMonday = new Date(thisMonday); lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday); lastSunday.setDate(lastSunday.getDate() - 1);
      const toIso = (d: Date) => d.toISOString().slice(0, 10);
      const todayIso = now.toISOString().slice(0, 10);
      const thisWeekSales = entries.filter(e => e.date >= toIso(thisMonday) && e.date <= todayIso).reduce((s, e) => s + e.sales, 0);
      const lastWeekSales = entries.filter(e => e.date >= toIso(lastMonday) && e.date <= toIso(lastSunday)).reduce((s, e) => s + e.sales, 0);
      const weeklyChange = lastWeekSales > 0 ? Math.round((thisWeekSales - lastWeekSales) / lastWeekSales * 100) : 0;

      const res = await fetch("/api/ai/dashboard/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          industryCategoryId,
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
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiActions(data);
      }
    } catch { /* silent */ }
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
    aiActions, aiActionsLoading, fetchAiActions,

    // ── Context hooks ──
    router, searchParams, language, setLanguage, copy,

    // ── Bare store state/setters (onboarding) ──
    showOnboardingChoice, setShowOnboardingChoice,
    showExistingOnboarding, setShowExistingOnboarding,
    showAIRoadmapWizard, setShowAIRoadmapWizard,
    showRoleSelection, setShowRoleSelection,
    userRole, setUserRole,
    isResetting, resetProgress,
    authLabel, persistenceLabel, persistenceReady,
    authResolved, requiresAuth,
    showProfileDetails, setShowProfileDetails,
    showMonthlyCostPrompt, setShowMonthlyCostPrompt,
    lastUnlocked, selectedStoreIndex, setSelectedStoreIndex,
    transitionNotice, setTransitionNotice,

    // ── Bare store state/setters (profile) ──
    selectedIndustryId, setSelectedIndustryId,
    selectedIndustryCategoryId, setSelectedIndustryCategoryId,
    selectedBusinessModelId, setSelectedBusinessModelId,
    selectedBudget, setSelectedBudget, budgetInputText, setBudgetInputText,
    selectedOpenDate, setSelectedOpenDate,
    selectedLocationId, setSelectedLocationId,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    startupType, setStartupType,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    showFranchisePicker: profileStore.showFranchisePicker,
    setShowFranchisePicker: profileStore.setShowFranchisePicker,
    storeName, setStoreName,
    cpaDecision, setCpaDecision,
    selectedInteriorConcept, setSelectedInteriorConcept,
    profile, saveStatus, setSaveStatus,
    businessLaunched, setBusinessLaunched,

    // ── Bare store state/setters (roadmap) ──
    decisions, setDecisions, roadmap, setRoadmap, taskMap, setTaskMap,
    viewingStageId, setViewingStageId,
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
    costIngredientsText, setCostIngredientsText,
    costLaborText, setCostLaborText,
    costRentText, setCostRentText,
    costUtilitiesText, setCostUtilitiesText,
    costOtherText, setCostOtherText,

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
