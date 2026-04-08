"use client";

import {
  answerGuideQuestion,
  buildMarketScoreNarrative,
  buildRecommendedMarkets,
  buildRoadmapState,
  bootstrapAccountWorkspace,
  completeCurrentStage,
  evaluateDirectMarket,
  formatBudgetPresetLabel,
  formatStartupType,
  getCurrentUser,
  getIndustryCategoryIdByOptionId,
  getStarterLocationOptions,
  getUiCopy,
  localizeGuideRecord,
  localizeRecommendationItem,
  localizeStage,
  localizeStarterStepCard,
  loadBestMarketSignal,
  loadBusinessProfile,
  loadKnowledgeRecommendations,
  loadLoanKnowledge,
  loadMarketSignalRecommendations,
  loadPermitKnowledge,
  loadStageGuideContent,
  loadTaxKnowledge,
  runFinancialSimulation,
  saveRoadmapState,
  saveStoreData,
  loadStoreData,
  type UserStoreData,
  starterBudgetPresets,
  starterDecisionMap,
  starterOpenDatePresets,
  starterRoadmap,
  starterStepCards,
  starterTaskMap,
  updateTaskStatus,
  upsertStageDecision,
  resolveBusinessContext,
  getFranchiseBrandById,
  getFranchiseBrandsForSubIndustry,
  getFranchiseBrandsForCategory,
  getFreshnessPresentation,
  type GuideQaAnswer,
  type PersistedBusinessProfile,
  type FinancialSimulationResult,
  type RecommendationItem,
  type WorkflowTaskMap,
  type WorkflowDecisionMap,
  type StageGuideContent,
} from "@build-up/shared";
import type { AiStructuredResponse, ContractAnalysisResult, DashboardActionsResponse } from "@build-up/ai";
import { useEffect, useRef, useState } from "react";
import {
  useOperationsStore, useFinanceStore, useAiStore,
  useProfileStore, useRoadmapStore, useOnboardingStore,
} from "./stores";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../language-provider";
import { useNotifications } from "../notification-context";
import type { DashboardSurface } from "./types";
import { GUIDE_STAGE_CODES, SURFACE_HREFS } from "./constants";
import {
  getContractTaskDetail,
  getGuideSections,
  inferFinanceDefaults,
  parseManwonInput,
  hydrateSavedFinanceSnapshot,
  hydrateSavedContractAnalysisSnapshot,
  hydrateSavedGuideQaSnapshot,
  buildTransitionNotice,
  cloneStarterTaskMap,
  baseRoadmap,
} from "./helpers";

export type DailyEntry = { date: string; sales: number; customers: number };
export type MonthlyCosts = { ingredients: number; labor: number; rent: number; utilities: number; other: number };
export type CostSnapshot = MonthlyCosts & { month: string };
export type InventoryItem = {
  id: string; name: string; quantity: number; unit: string; minThreshold: number;
  unitCost: number;
  category: "fresh" | "dry" | "frozen" | "beverage" | "supply" | "other";
  itemType: "material" | "product";
  sellingPrice: number;
  expiryDate: string; supplierName: string; supplierUrl: string;
  leadTimeDays: number; dailyUsage: number; lastOrderedAt: string;
  wasteLog: { date: string; qty: number; reason: string }[];
};
export type InvForm = {
  open: boolean; editId: string | null;
  name: string; qty: string; unit: string; threshold: string; unitCost: string;
  category: "fresh" | "dry" | "frozen" | "beverage" | "supply" | "other";
  itemType: "material" | "product";
  sellingPrice: string;
  expiryDate: string; supplierName: string; url: string; leadTimeDays: string; dailyUsage: string;
};
export type Employee = {
  id: string;
  name: string;
  hourlyWage: number;
  weeklyHours: number;
  isInsured: boolean;
};
export type DeliveryPlatform = {
  id: string;
  name: string;
  commissionRate: number;
  adCostMonthly: number;
};
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  monthlySold: number;
  unit: string;
};
/** 통합 제품 타입 — retail, online-digital, pet용. 판매상품 = 재고 */
export type UnifiedProduct = {
  id: string;
  name: string;
  category: string;
  price: number;          // 판매가
  cost: number;           // 원가 (매입가)
  stock: number;          // 재고 수량
  monthlySold: number;    // 이달 판매량
  unit: string;
  // 재고 관리 필드
  minThreshold: number;   // 리오더 기준
  supplierName: string;
  supplierUrl: string;
  leadTimeDays: number;
  dailyUsage: number;
  lastOrderedAt: string;
  isConsumable: boolean;  // true = 소모품 (포장재 등, 판매 아님)
};
/** 서비스 메뉴 타입 — beauty, living-service용 */
export type ServiceMenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;       // 소요시간 (분)
  monthlySold: number;
};
export type TaxSettings = {
  vatType: "general" | "simplified";
  hasEmployees: boolean;
};
export type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: "rent" | "loan" | "insurance" | "other";
};
export type Member = { id: string; name: string; plan: string; fee: number; startDate: string; endDate: string; };

export function useDashboard(surface: DashboardSurface = "home") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const copy = getUiCopy(language);
  // ── Zustand 스토어 연결 ──
  const {
    showOnboardingChoice, setShowOnboardingChoice,
    showExistingOnboarding, setShowExistingOnboarding,
    showAIRoadmapWizard, setShowAIRoadmapWizard,
    showRoleSelection, setShowRoleSelection,
    userRole, setUserRole,
    isResetting, setIsResetting,
    resetProgress, setResetProgress,
    authLabel, setAuthLabel,
    persistenceLabel, setPersistenceLabel,
    persistenceReady, setPersistenceReady,
    authResolved, setAuthResolved,
    requiresAuth, setRequiresAuth,
    showProfileDetails, setShowProfileDetails,
    showMonthlyCostPrompt, setShowMonthlyCostPrompt,
    lastUnlocked, setLastUnlocked,
    selectedStoreIndex, setSelectedStoreIndex,
    transitionNotice, setTransitionNotice,
  } = useOnboardingStore();

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
    showFranchisePicker, setShowFranchisePicker,
    storeName, setStoreName,
    cpaDecision, setCpaDecision,
    selectedInteriorConcept, setSelectedInteriorConcept,
    profile, setProfile,
    saveStatus, setSaveStatus,
    businessLaunched, setBusinessLaunched,
    businessLaunchedDate, setBusinessLaunchedDate,
  } = useProfileStore();

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
    locationOptions, setLocationOptions,
    locationSourceLabel, setLocationSourceLabel,
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
    stageGuideContent, setStageGuideContent,
    guideStepIndex, setGuideStepIndex,
    guideSelections, setGuideSelections,
  } = useRoadmapStore();

  const {
    showFinancePanel, setShowFinancePanel,
    financeCapitalText, setFinanceCapitalText,
    financeMonthlyRentText, setFinanceMonthlyRentText,
    financeLaborText, setFinanceLaborText,
    financeRevenueText, setFinanceRevenueText,
    financeMarketStyle, setFinanceMarketStyle,
    financeRentBand, setFinanceRentBand,
    financeStatus, setFinanceStatus,
    financeError, setFinanceError,
    financeResult, setFinanceResult,
    financeInterpretation, setFinanceInterpretation,
    dailyEntries, setDailyEntries,
    dailyDateInput, setDailyDateInput,
    dailySalesInput, setDailySalesInput,
    dailyCustomersInput, setDailyCustomersInput,
    monthlyCosts, setMonthlyCosts,
    costHistory, setCostHistory,
    costIngredientsText, setCostIngredientsText,
    costLaborText, setCostLaborText,
    costRentText, setCostRentText,
    costUtilitiesText, setCostUtilitiesText,
    costOtherText, setCostOtherText,
  } = useFinanceStore();

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
  } = useOperationsStore();

  const {
    selectedContractTaskId, setSelectedContractTaskId,
    contractText, setContractText,
    contractAnalysisStatus, setContractAnalysisStatus,
    contractAnalysisError, setContractAnalysisError,
    contractAnalysis, setContractAnalysis,
    selectedGuideSectionKey, setSelectedGuideSectionKey,
    guideQuestion, setGuideQuestion,
    guideQaStatus, setGuideQaStatus,
    guideQaError, setGuideQaError,
    guideAnswer, setGuideAnswer,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, setKnowledgeQaStatus,
    knowledgeQaError, setKnowledgeQaError,
    permitGuides, setPermitGuides,
    taxGuides, setTaxGuides,
    loanGuides, setLoanGuides,
    aiActions, setAiActions,
    aiActionsLoading, setAiActionsLoading,
  } = useAiStore();

  // ── 스토어에 포함되지 않는 로컬 상태 ──
  const [nearbyFranchiseStores, setNearbyFranchiseStores] = useState<{ totalCount: number; places: Array<{ name: string; address: string; phone: string; url: string }> } | null>(null);
  const [nearbyFranchiseLoading, setNearbyFranchiseLoading] = useState(false);
  const [locationMapReady, setLocationMapReady] = useState(false);
  const [contractors, setContractors] = useState<{ id: string; name: string; address: string; phone: string | null; description: string; mapUrl: string | null }[]>([]);
  const [contractorsLoading, setContractorsLoading] = useState(false);
  const [contractorsRetryKey, setContractorsRetryKey] = useState(0);
  const { setNotifications } = useNotifications();
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectLoadingRef = useRef(false);
  const storeDataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 초기값 설정 (스토어 기본값이 copy에 의존하는 경우) ──
  useEffect(() => {
    if (!authLabel) setAuthLabel(copy.home.notConnected);
    if (!persistenceLabel) setPersistenceLabel(copy.home.localDemoMode);
    if (!locationSourceLabel) setLocationSourceLabel(copy.common.starterFallback);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Zustand 스토어에서 읽어서 1초 debounce로 Supabase에 flush */
  const flushStoreData = () => {
    if (!useOnboardingStore.getState().persistenceReady) return;
    if (storeDataTimerRef.current) clearTimeout(storeDataTimerRef.current);
    storeDataTimerRef.current = setTimeout(() => {
      void saveStoreData(supabase, collectStoreData()).catch(() => {});
    }, 1000);
  };

  const displayedStageId = viewingStageId ?? roadmap.currentStageId;
  const currentStage =
    roadmap.stages.find((stage) => stage.stageId === displayedStageId) ?? roadmap.stages[0];
  const traversedStages = roadmap.stages.filter(
    (s) => s.status === "completed" || s.stageId === roadmap.currentStageId
  );
  const traversedIndex = traversedStages.findIndex((s) => s.stageId === displayedStageId);
  const prevTraversedStage = traversedIndex > 0 ? traversedStages[traversedIndex - 1] : null;
  const nextTraversedStage =
    traversedIndex >= 0 && traversedIndex < traversedStages.length - 1
      ? traversedStages[traversedIndex + 1]
      : null;
  const isViewingPastStage =
    viewingStageId !== null && viewingStageId !== roadmap.currentStageId;
  const canCompleteIndustryStep = Boolean(selectedIndustryId);
  const canCompleteStartupTypeStep = Boolean(startupType);
  const canCompleteBusinessModelStep = Boolean(selectedBusinessModelId);
  const canCompleteBudgetStep = Boolean(selectedBudget && selectedOpenDate);
  const canCompleteLocationStep = Boolean(selectedLocationId);
  const hasPermitGuide = permitGuides.length > 0;
  const hasTaxGuide = taxGuides.length > 0;
  const hasLoanGuide = loanGuides.length > 0;
  const completedCount = roadmap.completedStageIds.length;
  const preferredRegion = profile?.preferredRegions?.[0];
  const industryCategoryId =
    getIndustryCategoryIdByOptionId(
      selectedIndustryId ??
        profile?.subIndustryId ??
        decisions["industry-selection"]?.selectedPrimaryOptionId
    )
    ?? (decisions["industry-selection"]?.inputs?.categoryId as string | undefined)
    ?? selectedIndustryCategoryId
    ?? "food";
  const businessCtx = resolveBusinessContext(industryCategoryId);
  const isDigitalCategory = industryCategoryId === "online-digital" || industryCategoryId === "startup-tech";
  const isStartupCategory = industryCategoryId === "startup-tech";
  const onlineOnlyIds = new Set(["platform-setup", "online-registration", "sourcing-setup", "store-setup", "online-marketing"]);
  const startupOnlyIds = new Set(["startup-foundation", "customer-discovery", "mvp-build", "launch-gtm", "growth-engine", "company-setup", "fundraising-readiness", "venture-certification"]);
  const offlineOnlyIds = new Set(["permit-check", "location-candidates", "contract-review", "construction-setup", "vendor-setup", "registration-setup", "insurance-tax-setup", "hiring-setup", "operations-setup", "pre-launch"]);
  const franchiseOnlyIds = new Set(["franchise-application"]);
  const pathTotalStages = roadmap.stages.filter((stage) => {
    if (isStartupCategory) {
      if (onlineOnlyIds.has(stage.stageId) || offlineOnlyIds.has(stage.stageId) || franchiseOnlyIds.has(stage.stageId)) return false;
      return true;
    }
    if (isDigitalCategory) {
      if (offlineOnlyIds.has(stage.stageId) || startupOnlyIds.has(stage.stageId)) return false;
      if (franchiseOnlyIds.has(stage.stageId) && startupType !== "franchise") return false;
      return true;
    }
    if (onlineOnlyIds.has(stage.stageId) || startupOnlyIds.has(stage.stageId)) return false;
    if (franchiseOnlyIds.has(stage.stageId) && startupType !== "franchise") return false;
    return true;
  }).length;
  const correctedProgressPercent = pathTotalStages > 0 ? Math.min(100, Math.round((completedCount / pathTotalStages) * 100)) : 0;
  const allStagesDone = completedCount >= pathTotalStages;

  // Business health score — 데이터 충분성 + 수익성 + 안정성 종합 판단
  const businessHealthScore: "healthy" | "caution" | "danger" | "unknown" = (() => {
    if (!businessLaunched) return "unknown";
    const entries = dailyEntries as DailyEntry[];
    const mc = monthlyCosts as MonthlyCosts;
    const totalCost = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;

    // ─── 데이터 충분성 검증 (최소 조건 미충족 시 unknown) ───
    // 1) 매출 기록 7일 미만이면 판단 불가
    if (entries.length < 7) return "unknown";
    // 2) 비용을 하나도 입력하지 않았으면 판단 불가
    if (totalCost === 0) return "unknown";
    // 3) 임대료가 0이면 필수 고정비 미입력으로 판단 불가
    if (mc.rent === 0) return "unknown";

    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const recent30 = sorted.slice(-30);
    const totalRev = recent30.reduce((s, e) => s + e.sales, 0);

    // 매출 0이면 위험
    if (totalRev === 0) return "danger";

    const monthlyNet = totalRev - totalCost;
    const primeRate = (mc.ingredients + mc.labor) / totalRev;
    const rentRate = mc.rent / totalRev;

    // 3개월 비용 추세
    const costTrend = costHistory.length >= 3 ? (() => {
      const s = [...costHistory].sort((a, b) => a.month.localeCompare(b.month)).slice(-3);
      const tots = s.map(c => c.ingredients + c.labor + c.rent + c.utilities + c.other);
      return tots[2] > tots[1] && tots[1] > tots[0]; // 3개월 연속 증가
    })() : false;

    // ─── 위험 판단 (danger) ───
    // 적자 + 프라임코스트 65% 초과
    if (monthlyNet < 0 && primeRate > 0.65) return "danger";
    // 임대료 비율 20% 초과 (구조적 위험)
    if (rentRate > 0.2) return "danger";

    // ─── 주의 판단 (caution) ───
    if (monthlyNet < 0) return "caution";
    if (primeRate > 0.6) return "caution";
    if (rentRate > 0.15) return "caution";
    if (costTrend) return "caution";
    // 재료비 비율이 0이면 미입력 가능성 (외식/카페만)
    if ((industryCategoryId === "food" || industryCategoryId === "cafe-dessert") && mc.ingredients === 0) return "caution";

    return "healthy";
  })();

  // AI 오늘 할 일 + 위기 해결 방법 (aiActions, setAiActions, aiActionsLoading, setAiActionsLoading는 ai-store에서)
  const aiActionsLoadedRef = useRef(false);

  const fetchAiActions = async () => {
    if (aiActionsLoading || !businessLaunched || !storeName) return;
    setAiActionsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const entries = dailyEntries as DailyEntry[];
      const recent30 = entries.filter(e => {
        const d = new Date(e.date);
        const ago = new Date(); ago.setDate(ago.getDate() - 30);
        return d >= ago;
      });
      const monthlySales = recent30.reduce((s, e) => s + e.sales, 0);
      const mc = monthlyCosts as MonthlyCosts;
      const totalCost = mc.ingredients + mc.labor + mc.rent + mc.utilities + mc.other;
      const primeRate = monthlySales > 0 ? ((mc.ingredients + mc.labor) / monthlySales) * 100 : 0;
      const monthlyNet = monthlySales - totalCost;
      const launchDateStr = businessLaunchedDate;
      const daysSinceLaunchCalc = launchDateStr ? Math.max(0, Math.round((Date.now() - new Date(launchDateStr).getTime()) / 86400000)) : 30;
      const capitalLeft = Math.max(0, (selectedBudget ?? 0) - totalCost * (daysSinceLaunchCalc / 30));
      const runway = totalCost > 0 && monthlyNet < 0 ? Math.max(0, Math.round(capitalLeft / Math.abs(monthlyNet))) : -1;

      // 주간 변화율
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
          pendingTaxEvents: [],  // enrichment에서 computedTaxEvents로 채움
          lowStockItems: (inventory as InventoryItem[]).filter(i => i.quantity <= i.minThreshold && i.minThreshold > 0).map(i => i.name).slice(0, 3),
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

  const localizedCurrentStage = localizeStage(currentStage, language, industryCategoryId);
  const isGuideStage = GUIDE_STAGE_CODES.includes(
    currentStage.code as (typeof GUIDE_STAGE_CODES)[number]
  );
  const isFreshAccount =
    !profile?.subIndustryId &&
    !profile?.businessModelId &&
    completedCount === 0 &&
    currentStage.code === "industry_selection";
  const startupSummary = [
    profile?.subIndustryId
      ? localizeRecommendationItem({ id: profile.subIndustryId, title: profile.subIndustryId }, language)
          .title
      : undefined,
    profile?.startupType ? formatStartupType(profile.startupType, language) : undefined,
    profile?.businessModelId
      ? localizeRecommendationItem(
          { id: profile.businessModelId, title: profile.businessModelId },
          language
        ).title
      : undefined
  ]
    .filter(Boolean)
    .join(" · ");
  const selectedIndustryLabel =
    selectedIndustryId ??
    profile?.subIndustryId ??
    decisions["industry-selection"]?.selectedPrimaryOptionId
      ? localizeRecommendationItem(
          {
            id:
              selectedIndustryId ??
              profile?.subIndustryId ??
              decisions["industry-selection"]?.selectedPrimaryOptionId ??
              "",
            title:
              selectedIndustryId ??
              profile?.subIndustryId ??
              decisions["industry-selection"]?.selectedPrimaryOptionId ??
              ""
          },
          language
        ).title
      : copy.common.notSetYet;
  const nextStepSummary =
    currentStage.code === "industry_selection"
      ? copy.home.nextStepIndustry
      : currentStage.code === "startup_type"
        ? copy.home.nextStepStartupType
      : currentStage.code === "business_model"
        ? copy.home.nextStepModel
        : currentStage.code === "budget_setup"
          ? copy.home.nextStepBudget
          : currentStage.code === "startup_foundation"
            ? (language === "ko" ? "공동창업 구조와 지분, 법인 설립 방향을 먼저 정리하세요." : "Lock founder roles, equity, and company setup first.")
            : currentStage.code === "customer_discovery"
              ? (language === "ko" ? "인터뷰로 반복되는 문제와 첫 타겟 고객을 좁히세요." : "Use interviews to narrow the first customer and pain wedge.")
              : currentStage.code === "mvp_build"
                ? (language === "ko" ? "핵심 워크플로 하나를 해결하는 MVP를 빠르게 출시하세요." : "Ship the smallest MVP that solves one core workflow.")
                : currentStage.code === "launch_gtm"
                  ? (language === "ko" ? "분석·결제·GTM 채널을 깔고 첫 고객 확보 실험을 시작하세요." : "Install analytics, billing, and GTM channel before pushing growth.")
                  : currentStage.code === "growth_engine"
                    ? (language === "ko" ? "북극성 지표와 유지율을 함께 보는 주간 리뷰를 시작하세요." : "Start a weekly review for north-star growth and retention.")
                    : currentStage.code === "company_setup"
                      ? (language === "ko" ? "법인 설립·세무사 선임·보안 기본기를 완료하세요." : "Complete incorporation, tax advisor, and security basics.")
                      : currentStage.code === "fundraising_readiness"
                        ? (language === "ko" ? "런웨이와 마일스톤을 기준으로 투자 필요성을 정리하세요." : "Model runway and milestones before you fundraise.")
                        : currentStage.code === "venture_certification"
                          ? (language === "ko" ? "벤처인증과 정부 지원사업을 매칭하여 비희석 자금을 확보하세요." : "Match to venture certification and government programs for non-dilutive funding.")
        : currentStage.code === "location_candidates"
            ? copy.home.nextStepLocation
            : currentStage.code === "contract_review"
              ? copy.home.nextStepContract
              : currentStage.code === "tax_guide"
                ? copy.home.nextStepTax
                : currentStage.code === "loan_guide"
                  ? copy.home.nextStepLoan
                  : currentStage.code === "biz_registration"
                    ? (language === "ko" ? "사업자등록과 금융 세팅을 완료하세요." : "Finalize business registration and banking.")
                    : currentStage.code === "pre_launch_final"
                      ? (language === "ko" ? "초도 재고 입고, 직원 교육, SNS 예고를 마치세요." : "Receive inventory, brief staff, and post a teaser.")
                      : currentStage.code === "first_month_check"
                        ? (language === "ko" ? "현금흐름 기록 방법을 정하고 개업을 시작하세요." : "Set up cash flow tracking and launch your business.")
                        : copy.home.nextStepDone;
  const locationRegionLabel = isStartupCategory
    ? (language === "ko" ? "선호 허브 지역" : "Preferred founder hub")
    : isDigitalCategory
    ? (language === "ko" ? "희망 운영 지역" : "Preferred base region")
    : (language === "ko" ? "희망 지역" : "Preferred region");
  const locationHelpText = isStartupCategory
    ? (language === "ko"
        ? "스타트업은 상권보다 팀 채용, 고객 인터뷰, 커뮤니티 접근성이 더 중요합니다. 선호 허브를 적어두면 참고 정보로 활용합니다."
        : "For startups, founder talent, customer access, and community matter more than storefront traffic. We use your preferred hub as reference only.")
    : isDigitalCategory
    ? (language === "ko"
        ? "운영하고 싶은 권역을 적으면 작업·보관·택배 흐름 기준으로 거점 3곳을 추천하고, 직접 생각한 거점도 점검해드립니다."
        : "Enter your target area to see three operating-base suggestions focused on storage, packing, and logistics.")
    : (language === "ko"
        ? "원하는 지역을 적으면 추천 상권 3곳을 보여드리고, 직접 생각한 상권도 점수로 점검해드립니다."
        : "Enter your target region to see three suggested markets, or score a market you already have in mind.");
  const locationRecommendedLabel = isStartupCategory
    ? (language === "ko" ? "추천 허브 보기" : "Suggested hubs")
    : isDigitalCategory
    ? (language === "ko" ? "추천 거점 보기" : "Recommended bases")
    : (language === "ko" ? "추천 상권 보기" : "Recommended markets");
  const locationDirectLabel = isStartupCategory
    ? (language === "ko" ? "직접 입력하기" : "My own hub")
    : isDigitalCategory
    ? (language === "ko" ? "직접 입력하기" : "My own base")
    : (language === "ko" ? "직접 입력하기" : "My own market");
  const locationInputPlaceholder = isStartupCategory
    ? (language === "ko" ? "예: 판교, 강남, 성수, 원격" : "Example: Pangyo, Gangnam, Seongsu, remote")
    : isDigitalCategory
    ? (language === "ko" ? "예: 구로, 동대문, 일산" : "Example: Guro, Dongdaemun, Ilsan")
    : (language === "ko" ? "예: 성수동, 수원 영통, 부산 전포" : "Example: Seongsu, Pangyo, Jeonpo");
  const customLocationLabel = isStartupCategory
    ? (language === "ko" ? "직접 생각한 허브" : "Your chosen hub")
    : isDigitalCategory
    ? (language === "ko" ? "직접 생각한 운영 거점" : "Your chosen base")
    : (language === "ko" ? "직접 생각한 상권" : "Your chosen market");
  const customLocationPlaceholder = isStartupCategory
    ? (language === "ko" ? "예: 판교 공유오피스, 원격 팀" : "Example: Pangyo coworking, remote team")
    : isDigitalCategory
    ? (language === "ko" ? "예: 구로 물류센터 인근, 집 근처 작업실" : "Example: near Guro logistics, home studio")
    : (language === "ko" ? "예: 성수역 3번 출구 근처" : "Example: near Seongsu Station exit 3");
  const customLocationReasonPlaceholder = isStartupCategory
    ? (language === "ko" ? "왜 이 허브를 생각했는지 적어주세요." : "Why are you considering this hub?")
    : isDigitalCategory
    ? (language === "ko" ? "왜 이 거점을 생각했는지 적어주세요." : "Why are you considering this base?")
    : (language === "ko" ? "왜 이 상권을 생각했는지 적어주세요." : "Why are you considering this market?");
  const scoreLocationLabel = isStartupCategory
    ? (language === "ko" ? "이 허브 평가하기" : "Score this hub")
    : isDigitalCategory
    ? (language === "ko" ? "이 거점 평가하기" : "Score this base")
    : (language === "ko" ? "이 상권 평가하기" : "Score this market");
  const selectedLocationDetailLabel = isStartupCategory
    ? (language === "ko" ? "선택한 허브 자세히 보기" : "Selected hub details")
    : isDigitalCategory
    ? (language === "ko" ? "선택한 운영 거점 자세히 보기" : "Selected base details")
    : (language === "ko" ? "선택한 상권 자세히 보기" : "Selected market details");
  const sliderBudgetValue = selectedBudget ?? 1000000;
  const activeBudgetLabel =
    typeof selectedBudget === "number"
      ? formatBudgetPresetLabel(selectedBudget, language)
      : language === "ko"
        ? "아직 입력하지 않음"
        : "Not set yet";
  const activeOpenDatePreset =
    starterOpenDatePresets.find((date) => date.value === selectedOpenDate) ?? null;
  const activeSurface = surface;
  const currentStageIndex = roadmap.stages.findIndex((stage) => stage.stageId === currentStage.stageId);
  const roadmapPreviewStages = roadmap.stages.slice(
    currentStageIndex >= 0 ? currentStageIndex : 0,
    (currentStageIndex >= 0 ? currentStageIndex : 0) + 2
  );
  const nextRoadmapStage = roadmapPreviewStages[1] ?? null;
  const homePrinciples = starterStepCards
    .slice(0, 3)
    .map((card) => localizeStarterStepCard(card, language));
  const surfaceTabs = [
    {
      id: "home" as const,
      label: language === "ko" ? "홈" : "Home"
    },
    {
      id: "current" as const,
      label: language === "ko" ? "현재 단계" : "Current step"
    },
    {
      id: "roadmap" as const,
      label: language === "ko" ? "로드맵" : "Roadmap"
    },
    {
      id: "guides" as const,
      label: language === "ko" ? "가이드" : "Guides"
    },
    {
      id: "franchise" as const,
      label: language === "ko" ? "프랜차이즈" : "Franchise"
    },
    {
      id: "profile" as const,
      label: language === "ko" ? "내 정보" : "Profile"
    },
    {
      id: "analytics" as const,
      label: language === "ko" ? "내 가게" : "My store"
    }
  ];
  const navigateToSurface = (nextSurface: DashboardSurface) => {
    router.push(SURFACE_HREFS[nextSurface]);
  };
  const openFinanceFromSummary = () => {
    setShowFinancePanel(true);
    router.push("/guides?panel=finance");
  };

  const handleIndustryContinue = () => {
    if (!selectedIndustryId) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: selectedIndustryId,
      inputs: {
        subIndustryId: selectedIndustryId,
        categoryId: getIndustryCategoryIdByOptionId(selectedIndustryId) ?? ""
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const LOCAL_STORAGE_KEYS = [
    "businessLaunched", "businessLaunchedDate", "storeName", "cpaDecision",
    "vendorSelections", "vendorCustomInputs", "opsSelections", "opsPosChecks",
    "softOpenChecks", "softOpenPricing", "softOpenSkips",
    "taxChecks", "loanChecks", "dailyEntries", "monthlyCosts",
    "employees", "fixedExpenses", "deliveryPlatforms", "monthlyDeliverySales",
    "products", "taxSettings", "members", "inventoryItems",
    "onlinePlatformSales", "onlineSelectedPlatforms", "onlineSelectedCourier",
    "onlineMonthlyParcels", "unifiedProducts", "serviceMenuItems", "costHistory",
    "__buildup_decisions", "__buildup_roadmap", "__buildup_taskmap",
  ];

  const clearLocalUserData = () => {
    try {
      LOCAL_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
      // Zustand persist 키도 정리
      ["buildup-operations", "buildup-finance", "buildup-profile", "buildup-roadmap"].forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
  };

  const resetLocalState = () => {
    useOperationsStore.getState().resetAll();
    useFinanceStore.getState().resetAll();
    useProfileStore.getState().resetAll();
    useRoadmapStore.getState().resetAll();
    useAiStore.getState().resetAll();
    useOnboardingStore.getState().resetAll();
  };

  /** Apply Supabase-loaded store data to Zustand stores (persist auto-syncs to localStorage) */
  const applyStoreData = (data: UserStoreData) => {
    if (data.storeName) setStoreName(data.storeName);
    if (data.businessLaunched) setBusinessLaunched(true);
    if (data.businessLaunchedDate) setBusinessLaunchedDate(data.businessLaunchedDate);
    if (data.cpaDecision === "cpa" || data.cpaDecision === "self") setCpaDecision(data.cpaDecision);
    if (data.taxSettings?.vatType) setTaxSettings(data.taxSettings as TaxSettings);
    if (data.monthlyCosts && typeof data.monthlyCosts === "object") {
      const mc = data.monthlyCosts;
      setMonthlyCosts(mc);
      setCostIngredientsText(mc.ingredients ? String(Math.round(mc.ingredients / 10000)) : "");
      setCostLaborText(mc.labor ? String(Math.round(mc.labor / 10000)) : "");
      setCostRentText(mc.rent ? String(Math.round(mc.rent / 10000)) : "");
      setCostUtilitiesText(mc.utilities ? String(Math.round(mc.utilities / 10000)) : "");
      setCostOtherText(mc.other ? String(Math.round(mc.other / 10000)) : "");
    }
    if (data.dailyEntries?.length) setDailyEntries(data.dailyEntries as DailyEntry[]);
    if (data.inventoryItems?.length) setInventory(data.inventoryItems as InventoryItem[]);
    if (data.employees?.length) setEmployees(data.employees as Employee[]);
    if (data.fixedExpenses?.length) setFixedExpenses(data.fixedExpenses as FixedExpense[]);
    if (data.deliveryPlatforms?.length) setDeliveryPlatforms(data.deliveryPlatforms as DeliveryPlatform[]);
    if (data.monthlyDeliverySales && Object.keys(data.monthlyDeliverySales).length) setMonthlyDeliverySales(data.monthlyDeliverySales);
    if (data.products?.length) setProducts(data.products as Product[]);
    if (data.unifiedProducts?.length) setUnifiedProducts(data.unifiedProducts as UnifiedProduct[]);
    if (data.serviceMenuItems?.length) setServiceMenuItems(data.serviceMenuItems as ServiceMenuItem[]);
    if (data.members?.length) setMembers(data.members as Member[]);
    if (data.vendorSelections && Object.keys(data.vendorSelections).length) setVendorSelections(data.vendorSelections);
    if (data.vendorCustomInputs && Object.keys(data.vendorCustomInputs).length) setVendorCustomInputs(data.vendorCustomInputs);
    if (data.opsSelections && Object.keys(data.opsSelections).length) setOpsSelections(data.opsSelections);
    if (data.opsPosChecks && Object.keys(data.opsPosChecks).length) setOpsPosChecks(data.opsPosChecks);
    if (data.softOpenChecks && Object.keys(data.softOpenChecks).length) setSoftOpenChecks(data.softOpenChecks);
    if (data.softOpenPricing) setSoftOpenPricing(data.softOpenPricing);
    if (data.softOpenSkips && Object.keys(data.softOpenSkips).length) setSoftOpenSkips(data.softOpenSkips);
    if (data.taxChecks && Object.keys(data.taxChecks).length) setTaxChecks(data.taxChecks);
    if (data.loanChecks && Object.keys(data.loanChecks).length) setLoanChecks(data.loanChecks);
    if (data.onlinePlatformSales && Object.keys(data.onlinePlatformSales).length) setOnlinePlatformSales(data.onlinePlatformSales);
    if (data.onlineSelectedPlatforms?.length) setOnlineSelectedPlatforms(data.onlineSelectedPlatforms);
    if (data.onlineSelectedCourier) setOnlineSelectedCourier(data.onlineSelectedCourier);
    if (data.onlineMonthlyParcels) setOnlineMonthlyParcels(data.onlineMonthlyParcels);
    if (data.costHistory?.length) setCostHistory(data.costHistory as CostSnapshot[]);
  };

  /** Collect store data for Supabase sync (reads from Zustand stores, not localStorage) */
  const collectStoreData = (): Partial<UserStoreData> => {
    const ops = useOperationsStore.getState();
    const fin = useFinanceStore.getState();
    const prof = useProfileStore.getState();
    const rm = useRoadmapStore.getState();
    const r: Partial<UserStoreData> = {};
    if (prof.storeName) r.storeName = prof.storeName;
    if (prof.businessLaunched) r.businessLaunched = true;
    if (prof.businessLaunchedDate) r.businessLaunchedDate = prof.businessLaunchedDate;
    if (prof.cpaDecision) r.cpaDecision = prof.cpaDecision;
    r.taxSettings = ops.taxSettings;
    r.monthlyCosts = fin.monthlyCosts;
    if (fin.dailyEntries.length) r.dailyEntries = fin.dailyEntries;
    if (ops.inventory.length) r.inventoryItems = ops.inventory;
    if (ops.employees.length) r.employees = ops.employees;
    if (ops.fixedExpenses.length) r.fixedExpenses = ops.fixedExpenses;
    if (ops.deliveryPlatforms.length) r.deliveryPlatforms = ops.deliveryPlatforms;
    if (Object.keys(ops.monthlyDeliverySales).length) r.monthlyDeliverySales = ops.monthlyDeliverySales;
    if (ops.products.length) r.products = ops.products;
    if (ops.unifiedProducts.length) r.unifiedProducts = ops.unifiedProducts;
    if (ops.serviceMenuItems.length) r.serviceMenuItems = ops.serviceMenuItems;
    if (ops.members.length) r.members = ops.members;
    if (Object.keys(rm.vendorSelections).length) r.vendorSelections = rm.vendorSelections;
    if (Object.keys(rm.vendorCustomInputs).length) r.vendorCustomInputs = rm.vendorCustomInputs;
    if (Object.keys(rm.opsSelections).length) r.opsSelections = rm.opsSelections;
    if (Object.keys(rm.opsPosChecks).length) r.opsPosChecks = rm.opsPosChecks;
    if (Object.keys(rm.softOpenChecks).length) r.softOpenChecks = rm.softOpenChecks;
    if (rm.softOpenPricing) r.softOpenPricing = rm.softOpenPricing;
    if (Object.keys(rm.softOpenSkips).length) r.softOpenSkips = rm.softOpenSkips;
    if (Object.keys(rm.taxChecks).length) r.taxChecks = rm.taxChecks;
    if (Object.keys(rm.loanChecks).length) r.loanChecks = rm.loanChecks;
    if (Object.keys(ops.onlinePlatformSales).length) r.onlinePlatformSales = ops.onlinePlatformSales;
    if (ops.onlineSelectedPlatforms.length) r.onlineSelectedPlatforms = ops.onlineSelectedPlatforms;
    if (ops.onlineSelectedCourier) r.onlineSelectedCourier = ops.onlineSelectedCourier;
    if (ops.onlineMonthlyParcels) r.onlineMonthlyParcels = ops.onlineMonthlyParcels;
    if (fin.costHistory.length) r.costHistory = fin.costHistory;
    return r;
  };
  // backward-compat alias
  const collectLocalStorageData = collectStoreData;

  const handleSignOut = async () => {
    clearLocalUserData();
    resetLocalState();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const resetDemo = async () => {
    const confirmed = window.confirm(
      language === "ko"
        ? "데모 진행 상태를 정말 초기화할까요? 현재 저장된 홈 화면과 서버 데이터에도 바로 반영됩니다."
        : "Reset the demo progress? This will immediately update both your home screen and saved server state."
    );

    if (!confirmed) return;

    // 초기화 오버레이 표시
    setIsResetting(true);
    setResetProgress(0);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    setPersistenceReady(false);

    const nextDecisions: WorkflowDecisionMap = {};
    const nextTasks = cloneStarterTaskMap();
    const nextRoadmap = buildRoadmapState(
      {
        ...baseRoadmap,
        roadmapId:
          roadmap.roadmapId && roadmap.roadmapId !== starterRoadmap.roadmapId
            ? roadmap.roadmapId
            : baseRoadmap.roadmapId
      },
      nextDecisions,
      nextTasks
    );

    // Step 1: 로컬 상태 초기화
    setResetProgress(20);
    clearLocalUserData();
    resetLocalState();

    setDecisions(nextDecisions);
    setTaskMap(nextTasks);
    setRoadmap(nextRoadmap);
    setViewingStageId(null);
    setSoftOpenStep(0);
    setSelectedIndustryId(undefined);
    setSelectedIndustryCategoryId("food");
    setSelectedBusinessModelId(undefined);
    setSelectedBudget(undefined);
    setBudgetInputText("");
    setSelectedOpenDate(undefined);
    setSelectedLocationId(undefined);
    setPreferredRegionInput("");
    setLocationMode("recommended");
    setRecommendedMarkets([]);
    setCustomMarketName("");
    setCustomMarketReason("");
    setManualMarketEvaluation(null);
    setManualAlternative(null);
    setSelectedContractTaskId(undefined);
    setContractText("");
    setContractAnalysisStatus("idle");
    setContractAnalysisError("");
    setContractAnalysis(null);
    setSelectedGuideSectionKey(undefined);
    setGuideQuestion("");
    setGuideQaStatus("idle");
    setGuideQaError("");
    setGuideAnswer(null);
    setShowFinancePanel(false);
    setFinanceCapitalText("");
    setFinanceMonthlyRentText("");
    setFinanceLaborText("");
    setFinanceRevenueText("");
    setFinanceMarketStyle("balanced");
    setFinanceRentBand("mid");
    setFinanceStatus("idle");
    setFinanceError("");
    setFinanceResult(null);
    setFinanceInterpretation(null);
    setLocationOptions(getStarterLocationOptions("food"));
    setLocationSourceLabel(copy.common.starterFallback);
    setShowProfileDetails(false);
    setStartupType(undefined);
    setLastUnlocked([]);
    setTransitionNotice(null);
    setProfile(null);
    setBusinessLaunched(false);
    setBusinessLaunchedDate(null);
    setShowExistingOnboarding(false);
    setShowAIRoadmapWizard(false);
    try { localStorage.removeItem("buildup_onboarding_dismissed"); } catch {}

    // Step 2: business_profiles 초기화
    setResetProgress(40);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("business_profiles").update({
          industry_category_id: null,
          sub_industry_id: null,
          startup_type: null,
          business_model_id: null,
          capital: null,
          target_open_date: null,
          preferred_regions: null,
        } as never).eq("user_id", user.id);
      }
    } catch { /* ignore */ }

    // Step 3: 서버 데이터 초기화
    setResetProgress(60);
    try {
      const [persisted] = await Promise.all([
        saveRoadmapState(supabase, {
          roadmap: nextRoadmap,
          decisions: nextDecisions,
          tasks: nextTasks,
        }),
        saveStoreData(supabase, {
          storeName: "",
          businessLaunched: false,
          businessLaunchedDate: null,
          cpaDecision: null,
          taxSettings: { vatType: "general", hasEmployees: false },
          monthlyCosts: { ingredients: 0, labor: 0, rent: 0, utilities: 0, other: 0 },
          dailyEntries: [],
          inventoryItems: [],
          employees: [],
          fixedExpenses: [],
          deliveryPlatforms: [],
          monthlyDeliverySales: {},
          products: [],
          unifiedProducts: [],
          serviceMenuItems: [],
          members: [],
          vendorSelections: {},
          vendorCustomInputs: {},
          opsSelections: {},
          opsPosChecks: {},
          softOpenChecks: {},
          softOpenPricing: "",
          softOpenSkips: {},
          taxChecks: {},
          loanChecks: {},
          onlinePlatformSales: {},
          onlineSelectedPlatforms: [],
          onlineSelectedCourier: "",
          onlineMonthlyParcels: "",
          costHistory: [],
        }).catch(() => {}),
      ]);

      setResetProgress(90);
      setRoadmap(persisted.roadmap);
      setDecisions(persisted.decisions);
      setTaskMap(persisted.tasks);
      setPersistenceLabel(language === "ko" ? "초기화가 서버에 적용되었습니다." : "Reset applied to server.");
      setPersistenceReady(true);
      void loadBusinessProfile(supabase).then((p) => { if (p) setProfile(p); }).catch(() => {});
    } catch (error) {
      setPersistenceReady(true);
      setPersistenceLabel(
        error instanceof Error
          ? `${language === "ko" ? "초기화 저장 실패" : "Reset save failed"}: ${error.message}`
          : language === "ko"
            ? "초기화 저장 실패"
            : "Reset save failed"
      );
    }

    // Step 4: 완료 → 온보딩 화면으로 전환
    setResetProgress(100);
    // 잠시 100% 상태를 보여준 뒤 온보딩으로 전환
    await new Promise((r) => setTimeout(r, 600));
    setShowOnboardingChoice(true);
    setIsResetting(false);
    setResetProgress(0);
  };

  const handleBusinessModelContinue = () => {
    if (!selectedBusinessModelId) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: selectedBusinessModelId,
      selectedOptionIds: [selectedBusinessModelId],
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleStartupTypeContinue = () => {
    if (!startupType) return;

    // If franchise selected but brand picker not shown yet → show it
    if (startupType === "franchise" && !showFranchisePicker) {
      const brands = (() => { const sub = selectedIndustryId ? getFranchiseBrandsForSubIndustry(selectedIndustryId) : []; return sub.length > 0 ? sub : getFranchiseBrandsForCategory(industryCategoryId); })();
      if (brands.length > 0) {
        setShowFranchisePicker(true);
        return;
      }
    }

    const nextDecisions = upsertStageDecision(decisions, "startup-type", {
      stageId: "startup-type",
      selectedPrimaryOptionId: startupType,
      selectedOptionIds: [startupType],
      inputs: {
        startupType,
        ...(startupType === "franchise" && selectedFranchiseBrandId ? { franchiseBrandId: selectedFranchiseBrandId } : {})
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setShowFranchisePicker(false);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleBudgetContinue = () => {
    if (!selectedBudget || !selectedOpenDate) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: {
        capital: selectedBudget,
        targetOpenDate: selectedOpenDate
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleLocationContinue = () => {
    if (!selectedLocationId) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "location-candidates", {
      stageId: "location-candidates",
      selectedPrimaryOptionId: selectedLocationId,
      selectedOptionIds: [selectedLocationId],
      inputs: {
        preferredRegion: preferredRegionInput,
        customMarketName,
        customMarketReason,
        selectionMode: locationMode,
        finalMarketTitle: finalSelectedMarket?.title ?? ""
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleContractTaskToggle = (taskId: string) => {
    const currentTasks = taskMap["contract-review"] ?? [];
    const existing = currentTasks.find((task) => task.taskId === taskId);

    if (!existing) {
      return;
    }

    const nextTaskMap = updateTaskStatus(
      taskMap,
      "contract-review",
      taskId,
      existing.status === "completed" ? "todo" : "completed"
    );

    setTaskMap(nextTaskMap);
    setRoadmap(buildRoadmapState(baseRoadmap, decisions, nextTaskMap));
  };

  const handleContractContinue = () => {
    const transition = completeCurrentStage(roadmap, decisions, taskMap);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleTaskToggle = (stageId: string, taskId: string) => {
    const currentTasks = taskMap[stageId] ?? [];
    const existing = currentTasks.find((task) => task.taskId === taskId);
    if (!existing) return;
    const nextTaskMap = updateTaskStatus(
      taskMap,
      stageId,
      taskId,
      existing.status === "completed" ? "todo" : "completed"
    );
    const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
    setTaskMap(nextTaskMap);
    setRoadmap(nextRoadmap);
    // 모든 체크리스트 완료 시 currentStageId가 다음 단계로 바뀌어도
    // 사용자가 "다음 단계로" 버튼을 직접 누를 때까지 현재 화면을 유지
    if (nextRoadmap.currentStageId !== stageId && viewingStageId === null && !searchParams.get("editStage")) {
      setViewingStageId(stageId);
    }
  };

  // analytics → current 단계 화면: ?editStage= 파라미터로 해당 단계 표시
  // 핵심 규칙: URL에 editStage가 있으면 해당 단계를 보여주고, 없으면 ops 대시보드(또는 기본 stage view)로
  useEffect(() => {
    if (activeSurface !== "current") return;
    const editStage = searchParams.get("editStage");
    setViewingStageId(editStage ?? null);
  }, [activeSurface, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // biz_registration: 세무대리인 여부 선택 시 태스크 자동 완료
  useEffect(() => {
    const bizStageId = "biz-registration";
    if (!taskMap[bizStageId]) return;
    const task = taskMap[bizStageId].find((t) => t.taskId === "cpa-decision-made");
    if (!task) return;
    const shouldComplete = cpaDecision !== null;
    if ((task.status === "completed") === shouldComplete) return;
    const nextTaskMap = updateTaskStatus(taskMap, bizStageId, "cpa-decision-made", shouldComplete ? "completed" : "todo");
    const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
    setTaskMap(nextTaskMap);
    setRoadmap(nextRoadmap);
  }, [cpaDecision]); // eslint-disable-line react-hooks/exhaustive-deps

  // vendor_setup: 공급처 선택 시 대응 태스크 자동 완료
  useEffect(() => {
    const vendorStageId = "vendor-setup";
    if (!taskMap[vendorStageId]) return;

    const hasStep = (step: number) =>
      Object.entries(vendorSelections).some(
        ([k, v]) => k.startsWith(`${vendorStageId}_s${step}_`) && v !== ""
      );

    const triggers: Array<{ taskId: string; shouldComplete: boolean }> = [
      { taskId: "supplier-identified", shouldComplete: hasStep(1) },
      { taskId: "equipment-planned",   shouldComplete: hasStep(2) },
      { taskId: "pos-selected",        shouldComplete: hasStep(3) || hasStep(4) },
    ];

    let nextTaskMap = taskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (taskMap[vendorStageId] ?? []).find(t => t.taskId === taskId);
      if (!task || !shouldComplete || task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, vendorStageId, taskId, "completed");
      changed = true;
    }

    if (changed) {
      const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
      setTaskMap(nextTaskMap);
      setRoadmap(nextRoadmap);
      if (nextRoadmap.currentStageId !== vendorStageId && viewingStageId === null && !searchParams.get("editStage")) {
        setViewingStageId(vendorStageId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorSelections]);

  // localStorage sync useEffect들 제거됨 — Zustand persist 미들웨어가 자동 처리

  // operations_setup: 플랫폼 선택 시 대응 태스크 자동 완료
  useEffect(() => {
    const opsStageId = "operations-setup";
    if (!taskMap[opsStageId]) return;

    const hasDelivery = ["baemin", "coupangeats", "yogiyo", "naver-order"].some(id => opsSelections[`delivery-${id}`]);
    const allPosChecked = ["menu-check", "payment-check", "receipt-check", "settlement-check"].every(id => opsPosChecks[id]);
    const hasSns = ["instagram", "naver-place", "kakao-channel", "google-business"].some(id => opsSelections[`sns-${id}`]);

    const triggers: Array<{ taskId: string; shouldComplete: boolean }> = [
      { taskId: "delivery-app-registered", shouldComplete: hasDelivery },
      { taskId: "pos-live",               shouldComplete: allPosChecked },
      { taskId: "sns-setup",              shouldComplete: hasSns },
    ];

    let nextTaskMap = taskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (taskMap[opsStageId] ?? []).find(t => t.taskId === taskId);
      if (!task || !shouldComplete || task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, opsStageId, taskId, "completed");
      changed = true;
    }
    if (changed) {
      const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
      setTaskMap(nextTaskMap);
      setRoadmap(nextRoadmap);
      if (nextRoadmap.currentStageId !== opsStageId && viewingStageId === null && !searchParams.get("editStage")) {
        setViewingStageId(opsStageId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opsSelections, opsPosChecks]);

  // pre-launch: 소프트오픈 체크 완료 시 태스크 자동 완료
  useEffect(() => {
    const stageId = "pre-launch";
    if (!taskMap[stageId]) return;

    // Step 01: 손님 초대 & 행사 기획 — 1명 이상 게스트 선택 + 가격 정책 선택 + 사전준비 3개 완료
    const guestIds = ["guest-family", "guest-neighbor", "guest-influencer", "guest-peer"];
    const guestSelected = guestIds.some(k => softOpenChecks[k]);
    const prepKeys = ["prep-feedback-form", "prep-invite-sent", "prep-sns-plan"];
    const allPrepDone = prepKeys.every(k => softOpenChecks[k]);
    const step01Done = guestSelected && softOpenPricing !== "" && allPrepDone;

    // Step 02: 당일 운영 체크리스트 — 6개 이상 체크
    const dayKeys = [
      "day-cleanliness", "day-staff-briefing", "day-pos", "day-ambiance",
      "day-observation", "day-payment", "day-feedback-card", "day-debrief", "day-settlement", "day-sns",
      "day-inventory", "day-order-timing", "day-delivery",
      "day-booking-system", "day-no-show", "day-service-time",
      "day-display", "day-checkout-test",
      "day-equipment", "day-crm", "day-class",
      "day-checkout-online", "day-cs", "day-fulfillment",
    ];
    const dayChecked = dayKeys.filter(k => softOpenChecks[k]).length;

    // Step 03: 피드백 수집 4개 이상 + 본오픈 준비 4개 모두 완료
    const feedbackKeys = [
      "feedback-service", "feedback-price", "feedback-ambiance",
      "feedback-taste", "feedback-quality", "feedback-product", "feedback-facility", "feedback-ux",
      "feedback-booking", "feedback-menu", "feedback-display", "feedback-instructor",
    ];
    const feedbackChecked = feedbackKeys.filter(k => softOpenChecks[k]).length;
    const finalKeys = ["final-naver", "final-instagram", "final-kakao", "final-event"];
    const finalAllResolved = finalKeys.every(k => softOpenChecks[k] || softOpenSkips[k]);
    const finalAtLeastOne  = finalKeys.some(k => softOpenChecks[k]);

    const triggers = [
      { taskId: "soft-open-done",     shouldComplete: step01Done },
      { taskId: "feedback-collected", shouldComplete: dayChecked >= 6 },
      { taskId: "final-checklist",    shouldComplete: feedbackChecked >= 4 && finalAllResolved && finalAtLeastOne },
    ];

    let nextTaskMap = taskMap;
    let changed = false;
    for (const { taskId, shouldComplete } of triggers) {
      const task = (taskMap[stageId] ?? []).find(t => t.taskId === taskId);
      if (!task || !shouldComplete || task.status === "completed") continue;
      nextTaskMap = updateTaskStatus(nextTaskMap, stageId, taskId, "completed");
      changed = true;
    }
    if (changed) {
      const nextRoadmap = buildRoadmapState(baseRoadmap, decisions, nextTaskMap);
      setTaskMap(nextTaskMap);
      setRoadmap(nextRoadmap);
      if (nextRoadmap.currentStageId !== stageId && viewingStageId === null && !searchParams.get("editStage")) {
        setViewingStageId(stageId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [softOpenChecks, softOpenPricing, softOpenSkips]);

  const handleStageContinue = (stageId: string) => {
    const nextDecisions = upsertStageDecision(decisions, stageId, {
      stageId,
      completedAt: new Date().toISOString()
    });
    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleLaunchBusiness = () => {
    const launchDate = new Date().toISOString().slice(0, 10);
    setBusinessLaunched(true);
    if (!businessLaunchedDate) setBusinessLaunchedDate(launchDate);
    let finalStoreName = storeName;
    if (!storeName && selectedFranchiseBrandId) {
      const fb = getFranchiseBrandById(selectedFranchiseBrandId);
      if (fb) {
        finalStoreName = fb.name[language];
        setStoreName(finalStoreName);
      }
    }
    // ── Supabase에 store data 저장 ──
    // setTimeout을 사용하여 Zustand 상태가 업데이트된 후 읽도록 함
    setTimeout(() => {
      const storeDataToSave = collectStoreData();
      storeDataToSave.businessLaunched = true;
      storeDataToSave.businessLaunchedDate = businessLaunchedDate ?? launchDate;
      if (finalStoreName) storeDataToSave.storeName = finalStoreName;
      void saveStoreData(supabase, storeDataToSave).catch(() => {});
    }, 0);
    navigateToSurface("analytics");
  };

  const handleExistingBusinessComplete = async (result: {
    industryId: string;
    industryCategoryId: string;
    storeName: string;
    businessModelId: string;
    startupType: "independent" | "franchise";
    franchiseBrandId: string | null;
    preferredRegion: string;
    vatType: "general" | "simplified";
    hasEmployees: boolean;
    cpaDecision: "cpa" | "self";
    launchDate: string;
    monthlyCosts: { ingredients: number; labor: number; rent: number; utilities: number; other: number };
    capital: number;
    deliveryPlatforms: string[];
    snsChannels: string[];
  }) => {
    // ── decisions에 데이터 기록 (Supabase autosave + 새로고침 복원) ──
    const now = new Date().toISOString();
    let nextDecisions = decisions;
    nextDecisions = upsertStageDecision(nextDecisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: result.industryId,
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "startup-type", {
      stageId: "startup-type",
      selectedPrimaryOptionId: result.startupType,
      inputs: result.franchiseBrandId ? { franchiseBrandId: result.franchiseBrandId } : undefined,
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: result.businessModelId,
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: {
        ...(result.capital > 0 ? { capital: result.capital } : {}),
        targetOpenDate: result.launchDate,
      },
      completedAt: now,
    });
    if (result.preferredRegion) {
      nextDecisions = upsertStageDecision(nextDecisions, "location-candidates", {
        stageId: "location-candidates",
        inputs: { preferredRegion: result.preferredRegion, selectionMode: "direct" },
        completedAt: now,
      });
    }

    // 기존 가게 등록 유저는 이미 창업을 완료한 상태이므로
    // 아직 decisions이 없는 나머지 모든 스테이지에도 completedAt을 기록해둔다.
    // 이렇게 해야 loadRoadmapState → buildRoadmapState 재계산 시 전부 완료로 복원된다.
    for (const stage of roadmap.stages) {
      if (!nextDecisions[stage.stageId]?.completedAt) {
        nextDecisions = upsertStageDecision(nextDecisions, stage.stageId, {
          stageId: stage.stageId,
          completedAt: now,
        });
      }
    }

    setDecisions(nextDecisions);

    // ── React state 설정 ──
    setSelectedIndustryId(result.industryId);
    setSelectedIndustryCategoryId(result.industryCategoryId);
    setSelectedBusinessModelId(result.businessModelId);
    setStartupType(result.startupType);
    if (result.franchiseBrandId) setSelectedFranchiseBrandId(result.franchiseBrandId);
    if (result.capital > 0) {
      setSelectedBudget(result.capital);
      setBudgetInputText(String(Math.round(result.capital / 10000)));
    }

    // Region / location
    if (result.preferredRegion) {
      setPreferredRegionInput(result.preferredRegion);
    }

    // Store name
    setStoreName(result.storeName);

    // Tax settings
    const ts = { vatType: result.vatType, hasEmployees: result.hasEmployees };
    setTaxSettings(ts);

    // CPA decision
    setCpaDecision(result.cpaDecision);

    // Monthly costs
    setMonthlyCosts(result.monthlyCosts);
    setCostIngredientsText(result.monthlyCosts.ingredients ? String(Math.round(result.monthlyCosts.ingredients / 10000)) : "");
    setCostLaborText(result.monthlyCosts.labor ? String(Math.round(result.monthlyCosts.labor / 10000)) : "");
    setCostRentText(result.monthlyCosts.rent ? String(Math.round(result.monthlyCosts.rent / 10000)) : "");
    setCostUtilitiesText(result.monthlyCosts.utilities ? String(Math.round(result.monthlyCosts.utilities / 10000)) : "");
    setCostOtherText(result.monthlyCosts.other ? String(Math.round(result.monthlyCosts.other / 10000)) : "");

    // Delivery & SNS
    const ops: Record<string, boolean> = {};
    for (const id of result.deliveryPlatforms) ops[`delivery-${id}`] = true;
    for (const id of result.snsChannels) ops[`sns-${id}`] = true;
    setOpsSelections(ops);

    // Mark as launched
    setBusinessLaunched(true);
    setBusinessLaunchedDate(result.launchDate);

    // ── Supabase에 먼저 저장 (페이지 전환 전 반드시 완료) ──
    // 로드맵 stage를 전부 completed로 마킹
    const completedRoadmap = {
      ...roadmap,
      completedStageIds: roadmap.stages.map(s => s.stageId),
      stages: roadmap.stages.map(s => ({ ...s, status: "completed" as const })),
    };
    setRoadmap(completedRoadmap);

    try {
      await saveRoadmapState(supabase, {
        roadmap: completedRoadmap,
        decisions: nextDecisions,
        tasks: taskMap,
      });
      // ── Store data도 Supabase에 저장 ──
      const storeDataToSave = collectLocalStorageData();
      await saveStoreData(supabase, storeDataToSave).catch(() => {});
      setPersistenceReady(true);
    } catch {
      // 저장 실패해도 localStorage에는 있으므로 진행
    }

    // Hide onboarding, show dashboard
    setShowExistingOnboarding(false);
    setShowOnboardingChoice(false);
    navigateToSurface("analytics");
  };

  const handleAIRoadmapComplete = async (result: {
    parsed: { industryCategoryId: string; subIndustryId: string; industryLabel: string; startupType: "independent" | "franchise"; businessModelId: string; preferredRegion: string };
    budgetAllocation: { total: number; deposit?: number; interior?: number; equipment?: number; workingCapital?: number };
    monthlyCosts: { ingredients: number; labor: number; rent: number; utilities: number; other: number };
    recommendations: { deliveryPlatforms: string[]; snsChannels: string[]; suppliers?: Array<{ name: string; category: string; reason: string; priceRange: string }>; interior?: Array<{ item: string; vendor: string; estimatedCost: string }>; permits?: string[]; taxAdvice?: string };
    timeline: { targetOpenDate: string; totalWeeks?: number; phases?: Array<{ name: string; weeks: number }> };
    marketAnalysis?: { score: number; grade: string; footTraffic: string; competition: string; rentLevel: string; targetFit: string; summary: string };
    risks?: Array<{ level: string; description: string; mitigation: string }>;
  }, wizardStoreName?: string) => {
    const now = new Date().toISOString();
    let nextDecisions = decisions;

    // ── AI 로드맵 결과 전체 보존 (기존에는 버려지던 데이터) ──
    useRoadmapStore.getState().setAiRoadmapResult({
      generatedAt: now,
      marketAnalysis: result.marketAnalysis ?? { score: 0, grade: "C", footTraffic: "", competition: "", rentLevel: "", targetFit: "", summary: "" },
      budgetAllocation: {
        deposit: result.budgetAllocation.deposit ?? 0,
        interior: result.budgetAllocation.interior ?? 0,
        equipment: result.budgetAllocation.equipment ?? 0,
        workingCapital: result.budgetAllocation.workingCapital ?? 0,
        total: result.budgetAllocation.total,
      },
      recommendations: {
        suppliers: result.recommendations.suppliers ?? [],
        interior: result.recommendations.interior ?? [],
        permits: result.recommendations.permits ?? [],
        taxAdvice: result.recommendations.taxAdvice ?? "",
        deliveryPlatforms: result.recommendations.deliveryPlatforms,
        snsChannels: result.recommendations.snsChannels,
      },
      timeline: {
        targetOpenDate: result.timeline.targetOpenDate,
        totalWeeks: result.timeline.totalWeeks ?? 16,
        phases: result.timeline.phases ?? [],
      },
      risks: result.risks ?? [],
    });

    // 상호명 설정
    if (wizardStoreName) {
      setStoreName(wizardStoreName);
    }

    // decisions 채우기 (handleExistingBusinessComplete와 동일 패턴)
    nextDecisions = upsertStageDecision(nextDecisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: result.parsed.subIndustryId,
      inputs: { subIndustryId: result.parsed.subIndustryId, categoryId: result.parsed.industryCategoryId },
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "startup-type", {
      stageId: "startup-type",
      selectedPrimaryOptionId: result.parsed.startupType,
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: result.parsed.businessModelId,
      completedAt: now,
    });
    nextDecisions = upsertStageDecision(nextDecisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: { capital: result.budgetAllocation.total, targetOpenDate: result.timeline.targetOpenDate },
      completedAt: now,
    });
    if (result.parsed.preferredRegion) {
      nextDecisions = upsertStageDecision(nextDecisions, "location-candidates", {
        stageId: "location-candidates",
        inputs: { preferredRegion: result.parsed.preferredRegion, selectionMode: "direct" },
        completedAt: now,
      });
    }

    setDecisions(nextDecisions);
    setSelectedIndustryId(result.parsed.subIndustryId);
    setSelectedIndustryCategoryId(result.parsed.industryCategoryId);
    setSelectedBusinessModelId(result.parsed.businessModelId);
    setStartupType(result.parsed.startupType);
    setSelectedBudget(result.budgetAllocation.total);
    setBudgetInputText(String(Math.round(result.budgetAllocation.total / 10000)));
    if (result.parsed.preferredRegion) setPreferredRegionInput(result.parsed.preferredRegion);

    // 비용
    const mc = result.monthlyCosts;
    setMonthlyCosts(mc);

    // 운영 채널
    const ops: Record<string, boolean> = {};
    for (const id of result.recommendations.deliveryPlatforms) ops[`delivery-${id}`] = true;
    for (const id of result.recommendations.snsChannels) ops[`sns-${id}`] = true;
    setOpsSelections(ops);

    // ── AI 추천 공급업체 → vendorSelections/vendorCustomInputs에 자동 채우기 ──
    if (result.recommendations.suppliers && result.recommendations.suppliers.length > 0) {
      const vs: Record<string, string> = {};
      const vc: Record<string, string> = {};
      result.recommendations.suppliers.forEach((supplier, i) => {
        // 카테고리별 step 매핑: 식재료→s1, 포장/소모품→s2, 설비→s3, 기타→s4
        const step = supplier.category.includes("재료") || supplier.category.includes("식자재") ? 1
          : supplier.category.includes("포장") || supplier.category.includes("소모품") ? 2
          : supplier.category.includes("설비") || supplier.category.includes("장비") || supplier.category.includes("POS") ? 3
          : 4;
        const key = `vendor-setup_s${step}_c${i}`;
        // __etc__ 패턴으로 커스텀 공급업체로 등록 (AI 추천은 대부분 사전 목록에 없으므로)
        vs[key] = `__etc__${key}`;
        vc[key] = `${supplier.name} — ${supplier.reason} (${supplier.priceRange})`;
      });
      setVendorSelections(vs);
      setVendorCustomInputs(vc);
    }

    // ── AI 추천 인테리어 컨셉 자동 선택 ──
    // AI가 추천한 내용은 aiRoadmapResult.recommendations.interior에 저장됨
    // 여기서는 업종 기본 컨셉을 자동 선택 (첫 번째 컨셉)
    const conceptMap: Record<string, string> = {
      "food": "modern-hanok", "cafe-dessert": "industrial", "beauty": "clean-modern",
      "fitness": "clean-sport", "education": "clean-academic", "pet": "clean-white",
      "retail": "editorial", "living-service": "clean-tech", "space": "modern-study",
      "online-digital": "minimal-home", "startup-tech": "minimal-home",
    };
    const defaultConcept = conceptMap[result.parsed.industryCategoryId];
    if (defaultConcept) setSelectedInteriorConcept(defaultConcept);

    // AI 로드맵은 businessLaunched = false (아직 개업 전)
    // 로드맵 진행 모드에서 시작 — 하지만 핵심 스테이지(업종/모델/예산/상권)은 완료 마킹

    // ── 로드맵 재빌드: decisions 반영 → completedStageIds 갱신 ──
    const nextTasks = taskMap;
    const nextRoadmap = buildRoadmapState(
      { ...roadmap, roadmapId: roadmap.roadmapId },
      nextDecisions,
      nextTasks,
    );
    setRoadmap(nextRoadmap);
    setTaskMap(nextTasks);

    // ── Supabase 저장 (페이지 전환 전 완료) ──
    try {
      await saveRoadmapState(supabase, { roadmap: nextRoadmap, decisions: nextDecisions, tasks: nextTasks });
      const storeData = collectLocalStorageData();
      await saveStoreData(supabase, storeData).catch(() => {});
      // profile 갱신 — isFreshAccount 판정을 위해 필수
      const p = await loadBusinessProfile(supabase).catch(() => null);
      if (p) setProfile(p);
      setPersistenceReady(true);
    } catch { /* silent */ }

    setShowAIRoadmapWizard(false);
    setShowOnboardingChoice(false);
    navigateToSurface("home");
  };

  /** AI 액션 갱신 debounce — 데이터 변경 후 5초 뒤 자동 갱신 */
  const aiRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleAiRefresh = () => {
    if (!businessLaunched || !storeName) return; // 아직 개업 전이면 무시
    if (aiRefreshTimerRef.current) clearTimeout(aiRefreshTimerRef.current);
    aiRefreshTimerRef.current = setTimeout(() => {
      // 직접 fetch 호출 (null 세팅으로 무한 루프 방지)
      void fetchAiActions();
    }, 5000);
  };

  const handleAddDailyEntry = () => {
    if (!dailySalesInput) return;
    // 기존 기록의 productSales 등 추가 필드를 보존
    const existing = (dailyEntries as Array<Record<string, unknown>>).find((e) => e.date === dailyDateInput);
    const entry = {
      ...(existing ?? {}),
      date: dailyDateInput,
      sales: (Number(dailySalesInput.replace(/[^0-9]/g, "")) || 0) * 10000,
      customers: Number(dailyCustomersInput.replace(/[^0-9]/g, "")) || 0
    };
    const next = [
      ...(dailyEntries as DailyEntry[]).filter((e) => e.date !== dailyDateInput),
      entry as DailyEntry
    ].sort((a, b) => b.date.localeCompare(a.date));
    setDailyEntries(next);
    setDailySalesInput("");
    setDailyCustomersInput("");
    flushStoreData();
    scheduleAiRefresh(); // 매출 입력 → AI 경영 우선순위 자동 갱신
  };

  const handleSaveMonthlyCosts = () => {
    const costs = {
      ingredients: (Number(costIngredientsText.replace(/[^0-9]/g, "")) || 0) * 10000,
      labor: (Number(costLaborText.replace(/[^0-9]/g, "")) || 0) * 10000,
      rent: (Number(costRentText.replace(/[^0-9]/g, "")) || 0) * 10000,
      utilities: (Number(costUtilitiesText.replace(/[^0-9]/g, "")) || 0) * 10000,
      other: (Number(costOtherText.replace(/[^0-9]/g, "")) || 0) * 10000
    };
    setMonthlyCosts(costs);
    // Archive to costHistory (월별 스냅샷, 최대 12개월)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const snap: CostSnapshot = { ...costs, month: currentMonth };
    const updatedHistory = [...costHistory.filter(h => h.month !== currentMonth), snap]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
    setCostHistory(updatedHistory);
    flushStoreData();
    scheduleAiRefresh(); // 비용 변경 → AI 경영 우선순위 자동 갱신
  };

  const saveInventory = (next: InventoryItem[]) => {
    setInventory(next);
    flushStoreData();
    scheduleAiRefresh(); // 재고 변경 → AI 우선순위 갱신
  };
  const emptyInvForm: InvForm = { open: false, editId: null, name: "", qty: "", unit: "개", threshold: "", unitCost: "", category: "other", itemType: "material" as const, sellingPrice: "", expiryDate: "", supplierName: "", url: "", leadTimeDays: "", dailyUsage: "" };
  const handleInvSave = () => {
    if (!invForm.name.trim()) return;
    const existing = inventory.find(i => i.id === invForm.editId);
    const item: InventoryItem = {
      id: invForm.editId ?? Date.now().toString(),
      name: invForm.name.trim(),
      quantity: Number(invForm.qty) || 0,
      unit: invForm.unit,
      minThreshold: Number(invForm.threshold) || 0,
      unitCost: Number(invForm.unitCost) || 0,
      category: invForm.category,
      itemType: invForm.itemType,
      sellingPrice: Number(invForm.sellingPrice) || 0,
      expiryDate: invForm.expiryDate,
      supplierName: invForm.supplierName.trim(),
      supplierUrl: invForm.url.trim(),
      leadTimeDays: Number(invForm.leadTimeDays) || 1,
      dailyUsage: Number(invForm.dailyUsage) || 0,
      lastOrderedAt: existing?.lastOrderedAt ?? "",
      wasteLog: existing?.wasteLog ?? [],
    };
    saveInventory(invForm.editId
      ? inventory.map(i => i.id === invForm.editId ? item : i)
      : [...inventory, item]);
    setInvForm(emptyInvForm);
  };
  const handleInvQty = (id: string, delta: number) => {
    saveInventory(inventory.map(i =>
      i.id === id ? { ...i, quantity: Math.max(0, parseFloat((i.quantity + delta).toFixed(2))) } : i
    ));
  };
  const handleInvDelete = (id: string) => {
    saveInventory(inventory.filter(i => i.id !== id));
  };
  const openInvEdit = (item: InventoryItem) => {
    setInvForm({
      open: true, editId: item.id, name: item.name, qty: String(item.quantity), unit: item.unit,
      threshold: String(item.minThreshold), unitCost: item.unitCost ? String(item.unitCost) : "",
      category: item.category ?? "other", itemType: item.itemType ?? "material", sellingPrice: item.sellingPrice ? String(item.sellingPrice) : "",
      expiryDate: item.expiryDate ?? "",
      supplierName: item.supplierName ?? "", url: item.supplierUrl ?? "",
      leadTimeDays: item.leadTimeDays ? String(item.leadTimeDays) : "",
      dailyUsage: item.dailyUsage ? String(item.dailyUsage) : "",
    });
  };
  const handleInvWaste = (itemId: string) => {
    const qty = parseFloat(invWasteQty) || 0;
    if (qty <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    saveInventory(inventory.map(i => i.id !== itemId ? i : {
      ...i,
      quantity: Math.max(0, parseFloat((i.quantity - qty).toFixed(2))),
      wasteLog: [...(i.wasteLog ?? []), { date: today, qty, reason: invWasteReason }],
    }));
    setInvWasteTarget(null);
    setInvWasteQty("");
    setInvWasteReason("");
  };
  const handleMarkOrdered = (itemId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    saveInventory(inventory.map(i => i.id === itemId ? { ...i, lastOrderedAt: today } : i));
  };

  const saveEmployees = (list: Employee[]) => {
    setEmployees(list);
    flushStoreData();
    scheduleAiRefresh(); // 직원 변경 → AI 우선순위 갱신
  };
  const handleEmpSave = () => {
    const wage = parseInt(empWage.replace(/[^0-9]/g, ""), 10);
    const hours = parseFloat(empHours.replace(/[^0-9.]/g, ""));
    if (!empName.trim() || !wage || !hours) return;
    const autoInsured = hours * 4.345 >= 60;
    const entry: Employee = {
      id: empEditId ?? `emp-${Date.now()}`,
      name: empName.trim(),
      hourlyWage: wage,
      weeklyHours: hours,
      isInsured: empInsured || autoInsured,
    };
    const next = empEditId
      ? employees.map(e => e.id === empEditId ? entry : e)
      : [...employees, entry];
    saveEmployees(next);
    setEmpFormOpen(false); setEmpEditId(null);
    setEmpName(""); setEmpWage(""); setEmpHours(""); setEmpInsured(false);
  };
  const handleEmpDelete = (id: string) => saveEmployees(employees.filter(e => e.id !== id));
  const openEmpEdit = (emp: Employee) => {
    setEmpEditId(emp.id); setEmpName(emp.name);
    setEmpWage(String(emp.hourlyWage)); setEmpHours(String(emp.weeklyHours));
    setEmpInsured(emp.isInsured); setEmpFormOpen(true);
  };

  const saveFixedExpenses = (list: FixedExpense[]) => {
    setFixedExpenses(list);
    flushStoreData();
  };
  const handleFexpSave = () => {
    const amount = parseInt(fexpAmount.replace(/[^0-9]/g, ""), 10) * 10000;
    const dueDay = parseInt(fexpDueDay.replace(/[^0-9]/g, ""), 10);
    if (!fexpName.trim() || !amount || !dueDay || dueDay < 1 || dueDay > 31) return;
    const entry: FixedExpense = {
      id: fexpEditId ?? `fexp-${Date.now()}`,
      name: fexpName.trim(),
      amount,
      dueDay,
      category: fexpCategory,
    };
    const next = fexpEditId
      ? fixedExpenses.map(e => e.id === fexpEditId ? entry : e)
      : [...fixedExpenses, entry];
    saveFixedExpenses(next);
    setFexpFormOpen(false); setFexpEditId(null);
    setFexpName(""); setFexpAmount(""); setFexpDueDay(""); setFexpCategory("other");
  };
  const handleFexpDelete = (id: string) => saveFixedExpenses(fixedExpenses.filter(e => e.id !== id));
  const openFexpEdit = (fe: FixedExpense) => {
    setFexpEditId(fe.id); setFexpName(fe.name);
    setFexpAmount(String(Math.round(fe.amount / 10000)));
    setFexpDueDay(String(fe.dueDay)); setFexpCategory(fe.category);
    setFexpFormOpen(true);
  };

  // ── 배달 플랫폼 핸들러 ──
  const saveDeliveryPlatforms = (list: DeliveryPlatform[]) => {
    setDeliveryPlatforms(list);
    flushStoreData();
  };
  const saveMonthlyDeliverySales = (map: Record<string, number>) => {
    setMonthlyDeliverySales(map);
    flushStoreData();
  };
  const handleDlvSave = () => {
    const rate = parseFloat(dlvRate) || 0;
    const ad = parseFloat(dlvAd) || 0;
    if (!dlvName.trim() || rate <= 0) return;
    const entry: DeliveryPlatform = {
      id: dlvEditId ?? `dlv-${Date.now()}`,
      name: dlvName.trim(), commissionRate: rate, adCostMonthly: ad,
    };
    const next = dlvEditId
      ? deliveryPlatforms.map(p => p.id === dlvEditId ? entry : p)
      : [...deliveryPlatforms, entry];
    saveDeliveryPlatforms(next);
    setDlvFormOpen(false); setDlvEditId(null);
    setDlvName(""); setDlvRate(""); setDlvAd("");
  };
  const handleDlvDelete = (id: string) => {
    saveDeliveryPlatforms(deliveryPlatforms.filter(p => p.id !== id));
    const next = { ...monthlyDeliverySales }; delete next[id];
    saveMonthlyDeliverySales(next);
  };
  const openDlvEdit = (p: DeliveryPlatform) => {
    setDlvEditId(p.id); setDlvName(p.name);
    setDlvRate(String(p.commissionRate)); setDlvAd(String(p.adCostMonthly));
    setDlvFormOpen(true);
  };

  // ── 상품/메뉴 핸들러 ──
  const saveProducts = (list: Product[]) => {
    setProducts(list);
    flushStoreData();
  };
  const saveUnifiedProducts = (list: UnifiedProduct[]) => {
    setUnifiedProducts(list);
    flushStoreData();
  };
  const saveServiceMenuItems = (list: ServiceMenuItem[]) => {
    setServiceMenuItems(list);
    flushStoreData();
  };
  const handleProdSave = () => {
    const price = parseInt(prodPrice.replace(/[^0-9]/g, ""), 10);
    const cost = parseInt(prodCost.replace(/[^0-9]/g, ""), 10) || 0;
    const stock = parseInt(prodStock.replace(/[^0-9]/g, ""), 10) || 0;
    if (!prodName.trim() || !price) return;
    const entry: Product = {
      id: prodEditId ?? `prod-${Date.now()}`,
      name: prodName.trim(), category: prodCategory.trim() || (language === "ko" ? "기타" : "Other"),
      price, cost, stock,
      monthlySold: prodEditId ? (products.find(p => p.id === prodEditId)?.monthlySold ?? 0) : 0,
      unit: prodUnit,
    };
    const next = prodEditId
      ? products.map(p => p.id === prodEditId ? entry : p)
      : [...products, entry];
    saveProducts(next);
    setProdFormOpen(false); setProdEditId(null);
    setProdName(""); setProdCategory(""); setProdPrice(""); setProdCost(""); setProdStock(""); setProdUnit("개");
  };
  const handleProdDelete = (id: string) => saveProducts(products.filter(p => p.id !== id));
  const handleProdSoldChange = (id: string, delta: number) => {
    saveProducts(products.map(p => p.id === id ? { ...p, monthlySold: Math.max(0, p.monthlySold + delta) } : p));
  };
  const openProdEdit = (p: Product) => {
    setProdEditId(p.id); setProdName(p.name); setProdCategory(p.category);
    setProdPrice(String(p.price)); setProdCost(String(p.cost)); setProdStock(String(p.stock));
    setProdUnit(p.unit); setProdFormOpen(true);
  };
  const saveTaxSettings = (s: TaxSettings) => {
    setTaxSettings(s);
    flushStoreData();
  };

  const handleContractAnalysis = async () => {
    const trimmed = contractText.trim();

    if (!trimmed) {
      return;
    }

    setContractAnalysisStatus("loading");
    setContractAnalysisError("");
    setContractAnalysis(null);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(language === "ko" ? "로그인 세션을 다시 확인해 주세요." : "Please refresh your login session.");
      }

      const response = await fetch("/api/ai/contract/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contractText: trimmed
        })
      });

      const payload = (await response.json()) as ContractAnalysisResult & {
        error?: string;
        detail?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(
          payload.detail ??
            payload.error ??
            (language === "ko" ? "계약서 분석에 실패했습니다." : "Failed to analyze the contract.")
        );
      }

      const nextDecisions = upsertStageDecision(decisions, "contract-analysis", {
        stageId: "contract-analysis",
        inputs: {
          contractText: trimmed,
          riskLevel: payload.riskLevel,
          flaggedClausesJson: JSON.stringify(payload.flaggedClauses),
          missingItems: payload.missingItems,
          unusualTerms: payload.unusualTerms,
          nextActions: payload.nextActions
        },
        notes: payload.summary,
        completedAt: new Date().toISOString()
      });

      setDecisions(nextDecisions);
      setContractAnalysis(payload);
      setContractAnalysisStatus("idle");
      await saveRoadmapState(supabase, {
        roadmap,
        decisions: nextDecisions,
        tasks: taskMap
      });
      setPersistenceReady(true);
      setPersistenceLabel(copy.home.savedToSupabase);
    } catch (error) {
      setContractAnalysisStatus("error");
      setContractAnalysisError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "계약서 분석에 실패했습니다."
            : "Failed to analyze the contract."
      );
    }
  };

  const handleRunFinancialSimulation = async () => {
    const capital = parseManwonInput(financeCapitalText);
    const monthlyRent = parseManwonInput(financeMonthlyRentText);
    const monthlyLaborCost = parseManwonInput(financeLaborText);
    const expectedMonthlyRevenue = parseManwonInput(financeRevenueText);

    if (!capital) {
      setFinanceStatus("error");
      setFinanceError(
        language === "ko"
          ? "자본금을 만원 단위로 입력해 주세요."
          : "Enter your starting capital in KRW ten-thousands."
      );
      return;
    }

    setFinanceStatus("loading");
    setFinanceError("");
    setFinanceResult(null);
    setFinanceInterpretation(null);

    try {
      const result = await runFinancialSimulation(supabase, {
        capital,
        categoryId: industryCategoryId,
        marketStyle: financeMarketStyle,
        rentBand: financeRentBand,
        monthlyRent,
        monthlyLaborCost,
        expectedMonthlyRevenue
      });

      setFinanceResult(result);

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(language === "ko" ? "로그인 세션을 다시 확인해 주세요." : "Please refresh your login session.");
      }

      const response = await fetch("/api/ai/finance/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          result,
          categoryLabel: selectedIndustryLabel
        })
      });

      const payload = (await response.json()) as AiStructuredResponse & {
        error?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(
          payload.error ??
            (language === "ko"
              ? "재무 해석에 실패했습니다."
              : "Failed to interpret the financial result.")
        );
      }

      const nextDecisions = upsertStageDecision(decisions, "financial-simulation", {
        stageId: "financial-simulation",
        inputs: {
          capital,
          marketStyle: financeMarketStyle,
          rentBand: financeRentBand,
          ...(typeof monthlyRent === "number" ? { monthlyRent } : {}),
          ...(typeof monthlyLaborCost === "number" ? { monthlyLaborCost } : {}),
          ...(typeof expectedMonthlyRevenue === "number" ? { expectedMonthlyRevenue } : {}),
          riskLevel: result.riskLevel,
          survivabilityMonths: result.survivabilityMonths,
          ...(typeof result.breakEven.estimatedBreakEvenMonth === "number"
            ? { breakEvenMonth: result.breakEven.estimatedBreakEvenMonth }
            : {}),
          breakEvenRevenue: result.breakEven.monthlyBreakEvenRevenue,
          capitalAfterSetupLow: result.capitalAfterSetup.low,
          capitalAfterSetupHigh: result.capitalAfterSetup.high,
          totalMonthlyFixed: result.resolvedCosts.totalMonthlyFixed,
          cogsRate: result.resolvedCosts.cogsRate,
          aiRationale: payload.rationale,
          aiWarnings: payload.warnings,
          aiNextActions: payload.nextActions
        },
        notes: payload.summary,
        completedAt: new Date().toISOString()
      });

      setDecisions(nextDecisions);
      setFinanceInterpretation(payload);
      await saveRoadmapState(supabase, {
        roadmap,
        decisions: nextDecisions,
        tasks: taskMap
      });
      setPersistenceReady(true);
      setPersistenceLabel(copy.home.savedToSupabase);
      setFinanceStatus("idle");
    } catch (error) {
      setFinanceStatus("error");
      setFinanceError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "재무 시뮬레이션에 실패했습니다."
            : "Failed to run the financial simulation."
      );
    }
  };

  const handleVerificationContinue = (stageId: "permit-guide" | "tax-guide" | "loan-guide") => {
    const nextDecisions = upsertStageDecision(decisions, stageId, {
      stageId,
      inputs: {
        reviewed: true
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  useEffect(() => {
    if (!transitionNotice) {
      return;
    }

    if (transitionNoticeTimerRef.current) {
      clearTimeout(transitionNoticeTimerRef.current);
    }

    transitionNoticeTimerRef.current = setTimeout(() => {
      setTransitionNotice(null);
    }, 2600);

    return () => {
      if (transitionNoticeTimerRef.current) {
        clearTimeout(transitionNoticeTimerRef.current);
      }
    };
  }, [transitionNotice]);

  const contractTasks = taskMap["contract-review"] ?? [];
  const activeContractTask =
    contractTasks.find((task) => task.taskId === selectedContractTaskId) ?? contractTasks[0] ?? null;
  const activeContractTaskDetail = activeContractTask
    ? getContractTaskDetail(activeContractTask.taskId, language, industryCategoryId)
    : null;
  const activeGuide =
    currentStage.code === "tax_guide"
      ? taxGuides[0] ?? null
      : currentStage.code === "loan_guide"
        ? loanGuides[0] ?? null
        : null;
  const activeGuideSections = getGuideSections(activeGuide, language);
  const activeGuideSection =
    activeGuideSections.find((section) => section.key === selectedGuideSectionKey) ??
    activeGuideSections[0] ??
    null;
  const activeGuideFreshness = getFreshnessPresentation(activeGuide?.freshness);
  const activeGuideActionLabel =
    currentStage.code === "tax_guide"
      ? copy.home.markTaxReviewed
      : copy.home.markLoanReviewed;
  const activeGuideEmptyLabel =
    currentStage.code === "tax_guide"
      ? copy.home.noTaxGuide
      : copy.home.noLoanGuide;
  const guideDecisionKey = activeGuide ? `guide-qa-${activeGuide.id}` : undefined;

  const handleKnowledgeQuestion = async (domain: "tax" | "loan") => {
    if (!guideQuestion.trim()) return;
    setKnowledgeQaStatus("loading");
    setKnowledgeQaError("");
    setKnowledgeQaText("");
    try {
      const res = await fetch("/api/knowledge/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: guideQuestion.trim(),
          domain,
          industryCategoryId,
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "서버 오류가 발생했습니다." }));
        throw new Error(err.error ?? "서버 오류");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setKnowledgeQaText(accumulated);
            }
          } catch { /* skip malformed lines */ }
        }
      }
      setKnowledgeQaStatus("idle");
    } catch (error) {
      setKnowledgeQaStatus("error");
      setKnowledgeQaError(error instanceof Error ? error.message : "답변 요청에 실패했습니다.");
    }
  };

  const handleGuideQuestion = async () => {
    if (!activeGuide || !guideQuestion.trim()) {
      return;
    }

    try {
      setGuideQaStatus("loading");
      setGuideQaError("");
      const nextAnswer = answerGuideQuestion({
        question: guideQuestion,
        language,
        guide: activeGuide
      });
      const nextDecisions = upsertStageDecision(decisions, `guide-qa-${activeGuide.id}`, {
        stageId: `guide-qa-${activeGuide.id}`,
        inputs: {
          question: guideQuestion.trim(),
          explanation: nextAnswer.explanation,
          reasons: nextAnswer.reasons,
          cautions: nextAnswer.cautions,
          nextActions: nextAnswer.nextActions,
          confidence: nextAnswer.confidence
        },
        notes: nextAnswer.shortAnswer,
        completedAt: new Date().toISOString()
      });

      setDecisions(nextDecisions);
      setGuideAnswer(nextAnswer);
      setGuideQaStatus("idle");
      await saveRoadmapState(supabase, {
        roadmap,
        decisions: nextDecisions,
        tasks: taskMap
      });
      setPersistenceReady(true);
      setPersistenceLabel(copy.home.savedToSupabase);
    } catch (error) {
      setGuideQaStatus("error");
      setGuideQaError(error instanceof Error ? error.message : "Failed to answer question.");
    }
  };
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
  const savedFinanceSnapshot = hydrateSavedFinanceSnapshot(decisions["financial-simulation"]);
  const savedContractSnapshot = hydrateSavedContractAnalysisSnapshot(decisions["contract-analysis"]);
  const savedGuideQaSnapshot = hydrateSavedGuideQaSnapshot(
    guideDecisionKey ? decisions[guideDecisionKey] : undefined
  );
  const effectiveContractAnalysis = contractAnalysis ?? savedContractSnapshot?.analysis ?? null;
  const effectiveGuideAnswer = guideAnswer ?? savedGuideQaSnapshot?.answer ?? null;
  const financeDefaults = inferFinanceDefaults(finalSelectedMarket, industryCategoryId);

  useEffect(() => {
    setFinanceMarketStyle(financeDefaults.marketStyle);
    setFinanceRentBand(financeDefaults.rentBand);
  }, [financeDefaults.marketStyle, financeDefaults.rentBand]);

  useEffect(() => {
    if (!financeCapitalText.trim()) {
      const nextCapital = selectedBudget ?? profile?.capital;
      if (typeof nextCapital === "number" && nextCapital > 0) {
        setFinanceCapitalText(String(Math.round(nextCapital / 10000)));
      }
    }
  }, [selectedBudget, profile?.capital, financeCapitalText]);

  useEffect(() => {
    if (!contractText.trim() && savedContractSnapshot?.contractText) {
      setContractText(savedContractSnapshot.contractText);
    }
  }, [savedContractSnapshot?.contractText, contractText]);

  const connectAndLoad = async () => {
    if (connectLoadingRef.current) return;
    connectLoadingRef.current = true;
    try {
      const result = await bootstrapAccountWorkspace(supabase);
      const userLabel = result.user.email ?? copy.common.account;

      // CRITICAL: Detect user switch — clear previous user's localStorage data
      const previousUserId = localStorage.getItem("__buildup_uid");
      if (previousUserId && previousUserId !== result.user.id) {
        clearLocalUserData();
        resetLocalState();
      }
      localStorage.setItem("__buildup_uid", result.user.id);

      setAuthLabel(`${userLabel} · ${result.user.id.slice(0, 8)}`);
      setRequiresAuth(false);
      setAuthResolved(true);

      // ── 역할 확인: Supabase가 유일한 진실의 원천 ──
      let resolvedRole: "owner" | "staff" | "manager" = "owner";
      try {
        // 1. business_profiles에서 역할 확인
        const profileRes = await supabase.from("business_profiles").select("*").eq("user_id", result.user.id).maybeSingle();
        const profileRole = (profileRes?.data as Record<string, unknown> | null)?.user_role as string | undefined;

        // 2. store_members에서 직원 역할 확인
        let memberRole: string | undefined;
        try {
          const memberRes = await supabase.from("store_members" as never).select("role, owner_user_id").eq("member_user_id", result.user.id).maybeSingle();
          memberRole = (memberRes?.data as Record<string, unknown> | null)?.role as string | undefined;
        } catch { /* table may not exist yet */ }

        // 3. 역할 결정 (DB 우선, 없으면 owner)
        if (profileRole === "staff" || profileRole === "manager" || profileRole === "owner") {
          resolvedRole = profileRole;
        } else if (memberRole === "staff" || memberRole === "manager") {
          resolvedRole = memberRole;
        } else {
          // DB에 역할 없음 → owner로 저장
          resolvedRole = "owner";
          void supabase.from("business_profiles").update({ user_role: "owner" } as never).eq("user_id", result.user.id).then(() => {});
        }
      } catch {
        resolvedRole = "owner";
      }
      setUserRole(resolvedRole);

      setDecisions(result.state.decisions);
      // Backfill missing tasks from starterTaskMap (handles schema updates)
      // Only backfill for stages that exist in the current roadmap
      const loadedTasks = result.state.tasks;
      const roadmapStageIds = new Set(result.state.roadmap.stages.map((s: { stageId: string }) => s.stageId));
      const backfilled: WorkflowTaskMap = {};
      for (const [stageKey, starterTasks] of Object.entries(starterTaskMap)) {
        // Only backfill if this stage exists in the user's roadmap
        if (!roadmapStageIds.has(stageKey)) {
          // Still preserve if loaded data has it
          if (loadedTasks[stageKey]) backfilled[stageKey] = loadedTasks[stageKey];
          continue;
        }
        const existing = loadedTasks[stageKey] ?? [];
        const existingIds = new Set(existing.map((t) => t.taskId));
        const missing = starterTasks.filter((t) => !existingIds.has(t.taskId));
        backfilled[stageKey] = [...existing, ...missing];
      }
      // Preserve any loaded stages not in starterTaskMap
      for (const [stageKey, tasks] of Object.entries(loadedTasks)) {
        if (!backfilled[stageKey]) backfilled[stageKey] = tasks;
      }
      setTaskMap(backfilled);
      setRoadmap(result.state.roadmap);
      /* IMPORTANT: setPersistenceReady MUST come AFTER state restoration.
         Otherwise the autosave effect fires with stale starter defaults
         and overwrites the user's saved progress on the server. */
      setPersistenceReady(true);

      // 로드된 decisions에서 폼 상태 복원 (analytics '수정 →' 및 홈 스냅샷 표시를 위해)
      const dec = result.state.decisions;
      const loadedIndustryId = dec["industry-selection"]?.selectedPrimaryOptionId;
      if (loadedIndustryId) {
        setSelectedIndustryId(loadedIndustryId);
        setSelectedIndustryCategoryId(getIndustryCategoryIdByOptionId(loadedIndustryId) ?? "food");
      }
      const loadedStartupType = dec["startup-type"]?.selectedPrimaryOptionId;
      if (loadedStartupType === "franchise" || loadedStartupType === "independent" || loadedStartupType === "undecided") {
        setStartupType(loadedStartupType);
      }
      const loadedFranchiseBrandId = dec["startup-type"]?.inputs?.franchiseBrandId;
      if (typeof loadedFranchiseBrandId === "string") {
        setSelectedFranchiseBrandId(loadedFranchiseBrandId);
        // 상호명이 비어있으면 프랜차이즈 브랜드명으로 자동 채움
        const currentStoreName = useProfileStore.getState().storeName;
        if (!currentStoreName) {
          const fb = getFranchiseBrandById(loadedFranchiseBrandId);
          if (fb) { setStoreName(fb.name[language]); }
        }
      }
      const loadedBizModelId = dec["business-model"]?.selectedPrimaryOptionId;
      if (loadedBizModelId) setSelectedBusinessModelId(loadedBizModelId);
      const loadedCapital = dec["budget-setup"]?.inputs?.capital;
      if (typeof loadedCapital === "number") {
        setSelectedBudget(loadedCapital);
        setBudgetInputText(String(Math.round(loadedCapital / 10000)));
      }
      const loadedOpenDate = dec["budget-setup"]?.inputs?.targetOpenDate;
      if (typeof loadedOpenDate === "string") setSelectedOpenDate(loadedOpenDate);
      const loadedLocationId = dec["location-candidates"]?.selectedPrimaryOptionId;
      if (loadedLocationId) setSelectedLocationId(loadedLocationId);
      const loadedRegion = dec["location-candidates"]?.inputs?.preferredRegion;
      if (typeof loadedRegion === "string" && loadedRegion) setPreferredRegionInput(loadedRegion);
      const loadedMode = dec["location-candidates"]?.inputs?.selectionMode;
      if (loadedMode === "recommended" || loadedMode === "direct") setLocationMode(loadedMode);

      const loadedProfile = await loadBusinessProfile(supabase, result.user);
      setProfile(loadedProfile);
      setPersistenceLabel(result.isNew ? copy.home.starterRoadmapCreated : copy.home.loadedFromSupabase);

      // ── Store data sync: Supabase ↔ localStorage ──
      try {
        const storeData = await loadStoreData(supabase, result.user);
        if (storeData) {
          applyStoreData(storeData);
        } else {
          // First time: migrate localStorage → Supabase
          const localData = collectLocalStorageData();
          if (Object.keys(localData).length > 0) {
            await saveStoreData(supabase, localData, result.user).catch(() => {});
          }
        }
      } catch {
        // Silent fail — localStorage already loaded via useState initializers
      }

      // Show onboarding choice when no industry has been selected yet
      // (fresh account regardless of whether workspace was just created or already existed)
      const hasIndustry = loadedIndustryId || loadedProfile?.subIndustryId;
      // businessLaunched는 Supabase에서 복원된 후의 상태를 확인 (localStorage만으로는 새 기기에서 작동 안 함)
      const isLaunched = useProfileStore.getState().businessLaunched || businessLaunched;
      if (!hasIndustry && !isLaunched) {
        setShowOnboardingChoice(true);
      }

      // Monthly cost prompt: 매월 1~7일, 이번 달 비용 미입력 시 표시
      if (isLaunched) {
        const dom = new Date().getDate();
        const curMonth = new Date().toISOString().slice(0, 7);
        const hasCurrent = costHistory.some((h: { month: string }) => h.month === curMonth);
        if (dom <= 7 && !hasCurrent && costHistory.length > 0) {
          setShowMonthlyCostPrompt(true);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        setRequiresAuth(true);
        setAuthResolved(true);
        setPersistenceReady(false);
        setAuthLabel(copy.home.signInRequired);
        setPersistenceLabel(copy.home.noAccountSession);
        return;
      }

      setPersistenceLabel(
        error instanceof Error ? `${copy.home.loadFailed}: ${error.message}` : copy.home.loadFailed
      );
      setAuthResolved(true);
    } finally {
      connectLoadingRef.current = false;
    }
  };

  const persistCurrentState = async () => {
    try {
      const result = await bootstrapAccountWorkspace(supabase);
      const user = result.user;
      const userLabel = user.email ?? copy.common.account;
      setAuthLabel(`${userLabel} · ${user.id.slice(0, 8)}`);

      const persisted = await saveRoadmapState(supabase, {
        roadmap,
        decisions,
        tasks: taskMap
      });

      setRoadmap(persisted.roadmap);
      setProfile(await loadBusinessProfile(supabase, user));
      setPersistenceLabel(copy.home.savedToSupabase);
      setPersistenceReady(true);
    } catch (error) {
      setPersistenceLabel(
        error instanceof Error ? `${copy.home.saveFailed}: ${error.message}` : copy.home.saveFailed
      );
      throw error;
    }
  };

  useEffect(() => {
    void connectAndLoad();
  }, []);

  useEffect(() => {
    if (activeSurface === "guides" && searchParams.get("panel") === "finance") {
      setShowFinancePanel(true);
    }
  }, [activeSurface, searchParams]);

  useEffect(() => {
    void getCurrentUser(supabase).then((user) => {
      if (!user || user.is_anonymous) {
        setRequiresAuth(true);
        setAuthResolved(true);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void connectAndLoad();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Roadmap autosave: ref 기반으로 최신 값을 항상 사용 (stale closure 방지) ──
  const roadmapSnapshotRef = useRef({ roadmap, decisions, taskMap });
  useEffect(() => {
    roadmapSnapshotRef.current = { roadmap, decisions, taskMap };
  });

  useEffect(() => {
    if (!persistenceReady) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      // ref에서 최신 값을 읽어서 stale closure 문제 방지
      const snap = roadmapSnapshotRef.current;
      void Promise.all([
        saveRoadmapState(supabase, {
          roadmap: snap.roadmap,
          decisions: snap.decisions,
          tasks: snap.taskMap
        }),
        saveStoreData(supabase, collectLocalStorageData()).catch(() => {}),
      ])
        .then(() => {
          setPersistenceLabel(copy.home.autosaved);
          void loadBusinessProfile(supabase).then((p) => { if (p) setProfile(p); }).catch(() => {});
        })
        .catch((error) => {
          setPersistenceLabel(
            error instanceof Error ? `${copy.home.autosaveFailed}: ${error.message}` : copy.home.autosaveFailed
          );
        });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [roadmap, decisions, taskMap, persistenceReady]);

  // ── Store data bulk autosave to Supabase (interval-based, not dependency-based) ──
  // Use refs to always access latest state without re-triggering the effect
  const storeDataSnapshotRef = useRef<Partial<import("@build-up/shared").UserStoreData>>({});
  useEffect(() => {
    storeDataSnapshotRef.current = {
      storeName, businessLaunched, businessLaunchedDate,
      cpaDecision, taxSettings, monthlyCosts,
      dailyEntries, inventoryItems: inventory, employees, fixedExpenses,
      deliveryPlatforms, monthlyDeliverySales, products,
      unifiedProducts, serviceMenuItems, members,
      vendorSelections, vendorCustomInputs, opsSelections, opsPosChecks,
      softOpenChecks, softOpenPricing, softOpenSkips, taxChecks, loanChecks,
      onlinePlatformSales, onlineSelectedPlatforms,
      onlineSelectedCourier, onlineMonthlyParcels, costHistory,
    };
  });

  useEffect(() => {
    if (!persistenceReady) return;

    const interval = setInterval(() => {
      void saveStoreData(supabase, storeDataSnapshotRef.current).catch(() => {});
    }, 5000); // 5초 간격 자동저장

    // 브라우저 탭 닫기/새로고침 시 마지막 데이터 저장
    const handleBeforeUnload = () => {
      // sendBeacon은 페이지 unload 중에도 비동기 요청을 보장합니다
      try {
        const data = storeDataSnapshotRef.current;
        if (data && Object.keys(data).length > 0) {
          // localStorage에 최신 스냅샷 저장 (다음 접속 시 복원용)
          localStorage.setItem("__buildup_last_snapshot", JSON.stringify(data));
          localStorage.setItem("__buildup_last_snapshot_at", new Date().toISOString());
        }
      } catch { /* ignore — unload 중 에러 무시 */ }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [persistenceReady]);

  useEffect(() => {
    if (requiresAuth) {
      return;
    }

    void loadKnowledgeRecommendations(supabase, {
      domain: "market-recommendation",
      itemType: "location_candidate",
      categoryId: industryCategoryId
    })
      .then((items) => {
        setLocationSourceLabel(
          items.length > 0 ? copy.common.liveKnowledgeLayer : copy.common.starterFallback
        );
        setLocationOptions(
          (items.length > 0 ? items : getStarterLocationOptions(industryCategoryId)).map((item) =>
            localizeRecommendationItem(item, language)
          )
        );
      })
      .catch(() => {
        setLocationSourceLabel(copy.common.starterFallback);
        setLocationOptions(getStarterLocationOptions(industryCategoryId).map((item) => localizeRecommendationItem(item, language)));
      });
  }, [industryCategoryId, requiresAuth, language]);

  useEffect(() => {
    if (locationMode !== "recommended") {
      return;
    }

    if (!preferredRegionInput.trim()) {
      setRecommendedMarkets([]);
      return;
    }

    void loadMarketSignalRecommendations(supabase, {
      regionQuery: preferredRegionInput,
      categoryId: industryCategoryId
    })
      .then((signalItems) => {
        // 최소 3개 이상의 추천이 있어야 유의미 — 부족하면 내장 데이터로 보충
        const builtInMarkets = buildRecommendedMarkets({
          region: preferredRegionInput,
          categoryId: industryCategoryId,
          capital: selectedBudget,
          candidates: locationOptions
        });

        if (signalItems.length >= 3) {
          setRecommendedMarkets(signalItems.map((item) => localizeRecommendationItem(item, language)));
          setLocationSourceLabel(language === "ko" ? "상권 신호 데이터" : "Market signal data");
          return;
        }

        if (signalItems.length > 0 && builtInMarkets.length > 0) {
          // signal 데이터 + 내장 데이터 합산, 중복 ID 제거
          const signalIds = new Set(signalItems.map((s) => s.id));
          const merged = [
            ...signalItems.map((item) => localizeRecommendationItem(item, language)),
            ...builtInMarkets
              .filter((b) => !signalIds.has(b.id))
              .map((item) => localizeRecommendationItem(item, language)),
          ].slice(0, 5);
          setRecommendedMarkets(merged);
          setLocationSourceLabel(language === "ko" ? "상권 신호 + 내장 데이터" : "Signal + built-in data");
          return;
        }

        setRecommendedMarkets(
          builtInMarkets.map((item) => localizeRecommendationItem(item, language))
        );
        setLocationSourceLabel(copy.common.liveKnowledgeLayer);
      })
      .catch(() => {
        setRecommendedMarkets(
          buildRecommendedMarkets({
            region: preferredRegionInput,
            categoryId: industryCategoryId,
            capital: selectedBudget,
            candidates: locationOptions
          }).map((item) => localizeRecommendationItem(item, language))
        );
        setLocationSourceLabel(copy.common.starterFallback);
      });
  }, [preferredRegionInput, industryCategoryId, selectedBudget, locationOptions, language, locationMode]);

  useEffect(() => {
    void Promise.all([
      loadPermitKnowledge(supabase, industryCategoryId),
      loadTaxKnowledge(supabase, industryCategoryId),
      loadLoanKnowledge(supabase, industryCategoryId)
    ])
      .then(([permits, taxes, loans]) => {
        setPermitGuides(permits.map((guide) => localizeGuideRecord(guide, language)));
        setTaxGuides(taxes.map((guide) => localizeGuideRecord(guide, language)));
        setLoanGuides(loans.map((guide) => localizeGuideRecord(guide, language)));
      })
      .catch(() => {
        setPermitGuides([]);
        setTaxGuides([]);
        setLoanGuides([]);
      });
  }, [industryCategoryId, language]);

  // 상권이 확정되면 카카오 Places API로 인테리어 업체를 검색
  useEffect(() => {
    if (!preferredRegion || !industryCategoryId) return;

    const contractorKeywords: Record<string, string> = {
      "cafe-dessert": "카페 인테리어",
      "food": "음식점 인테리어",
      "beauty": "미용실 인테리어",
      "fitness": "피트니스 인테리어",
      "education": "학원 인테리어",
      "pet": "펫샵 인테리어",
      "retail": "매장 인테리어",
      "living-service": "상가 인테리어",
      "space": "스터디카페 인테리어",
    };
    const keyword = contractorKeywords[industryCategoryId] ?? "인테리어 업체";
    const query = `${preferredRegion} ${keyword}`;

    // Try Kakao Places API first (client-side)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;
    const kakao = w.kakao;

    const searchViaKakao = () => {
      if (!kakao?.maps?.services) return false;
      setContractorsLoading(true);
      const runSearch = () => {
        const ps = new kakao.maps.services.Places();
        ps.keywordSearch(query, (data: any[], status: string) => {
          if (status === kakao.maps.services.Status.OK && data.length > 0) {
            setContractors(data.slice(0, 5).map((d: any, i: number) => ({
              id: `kakao-${i}`,
              name: String(d.place_name ?? ""),
              address: String(d.road_address_name || d.address_name || ""),
              phone: d.phone ? String(d.phone) : null,
              description: String(d.category_name ?? ""),
              mapUrl: d.place_url ? String(d.place_url) : null,
            })));
          } else {
            setContractors([]);
          }
          setContractorsLoading(false);
        }, { size: 5 });
      };
      if (kakao.maps.load) { kakao.maps.load(runSearch); } else { runSearch(); }
      return true;
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!searchViaKakao()) {
      // Fallback: server API (OpenAI web search)
      setContractorsLoading(true);
      const params = new URLSearchParams({ region: preferredRegion, categoryId: industryCategoryId, keyword });
      fetch(`/api/contractors/local?${params.toString()}`)
        .then((r) => r.json() as Promise<{ results: { id: string; name: string; address: string; phone: string | null; description: string; mapUrl: string | null }[] }>)
        .then(({ results }) => { setContractors(results ?? []); })
        .catch(() => { setContractors([]); })
        .finally(() => { setContractorsLoading(false); });
    }
  }, [preferredRegion, industryCategoryId, contractorsRetryKey]);

  useEffect(() => {
    const stageCode = currentStage.stageId;
    setStageGuideContent(null);
    setGuideStepIndex(0);
    void loadStageGuideContent(supabase, stageCode, industryCategoryId, language)
      .then((content) => {
        setStageGuideContent(content);
        setGuideStepIndex(0);
      })
      .catch(() => {
        setStageGuideContent(null);
      });
  }, [currentStage.stageId, industryCategoryId, language]);

  // ── 알림 계산 → 헤더 벨로 전달 ──
  useEffect(() => {
    type Notif = { id: string; severity: "urgent" | "warning"; title: string; detail: string };
    const ko = language === "ko";
    const nowN = new Date();
    const todayMsN = new Date(nowN.getFullYear(), nowN.getMonth(), nowN.getDate()).getTime();
    const diffD = (d: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - todayMsN) / 86400000);
    const yN = nowN.getFullYear();
    const mN = nowN.getMonth();
    const domN = nowN.getDate();
    const todayStrN = nowN.toISOString().slice(0, 10);
    const in7daysN = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const daysInMonthN = new Date(yN, mN + 1, 0).getDate();
    const items: Notif[] = [];

    // 1. 재고 부족
    if (businessCtx.hasPhysicalInventory) {
      (inventory as InventoryItem[]).forEach(item => {
        if (item.quantity <= 0) {
          items.push({ id: `inv-${item.id}`, severity: "urgent", title: ko ? `재고 소진: ${item.name}` : `Out of stock: ${item.name}`, detail: ko ? "즉시 주문이 필요합니다" : "Needs immediate reorder" });
        } else if (item.dailyUsage > 0) {
          const daysLeft = Math.floor(item.quantity / item.dailyUsage);
          if (daysLeft <= item.leadTimeDays + 2) {
            items.push({ id: `inv-${item.id}`, severity: daysLeft <= 1 ? "urgent" : "warning", title: ko ? `재고 부족: ${item.name}` : `Low stock: ${item.name}`, detail: ko ? `${daysLeft}일치 남음 · 리드타임 ${item.leadTimeDays}일` : `${daysLeft}d left · ${item.leadTimeDays}d lead time` });
          }
        } else if (item.minThreshold > 0 && item.quantity <= item.minThreshold) {
          items.push({ id: `inv-${item.id}`, severity: "warning", title: ko ? `재고 부족: ${item.name}` : `Low stock: ${item.name}`, detail: ko ? `현재 ${item.quantity}${item.unit} (최소 기준 ${item.minThreshold}${item.unit})` : `${item.quantity}${item.unit} (min: ${item.minThreshold}${item.unit})` });
        }
      });
    }

    // 2. 세금 D-14
    if (businessLaunched) {
      const { vatType, hasEmployees: hasFmEmp } = taxSettings;
      const whtM = domN >= 10 ? mN + 1 : mN;
      const withholdingDate = new Date(whtM > 11 ? yN + 1 : yN, whtM % 12, 10);
      const insuranceDate = new Date(yN, mN + 1, 0);
      const vatDates = vatType === "simplified" ? [new Date(yN, 0, 25), new Date(yN + 1, 0, 25)] : [new Date(yN, 0, 25), new Date(yN, 6, 25), new Date(yN + 1, 0, 25)];
      const vatDate = vatDates.find(d => diffD(d) >= 0) ?? vatDates[vatDates.length - 1];
      const incomeTaxDate = [new Date(yN, 4, 31), new Date(yN + 1, 4, 31)].find(d => diffD(d) >= 0) ?? new Date(yN + 1, 4, 31);
      const taxEv: { label: string; date: Date }[] = [
        ...(hasFmEmp ? [
          { label: ko ? "원천세 신고·납부" : "Withholding tax", date: withholdingDate },
          { label: ko ? "4대보험료" : "Social insurance", date: insuranceDate },
        ] : []),
        { label: ko ? "부가세 신고" : "VAT filing", date: vatDate },
        { label: ko ? "종합소득세 신고" : "Income tax", date: incomeTaxDate },
      ];
      taxEv.forEach(e => {
        const d = diffD(e.date);
        if (d >= 0 && d <= 14) {
          items.push({ id: `tax-${e.label}`, severity: d <= 3 ? "urgent" : "warning", title: e.label, detail: ko ? (d === 0 ? "오늘 마감" : `D-${d} · ${e.date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}`) : (d === 0 ? "Due today" : `D-${d} · ${e.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`) });
        }
      });
    }

    // 3. 직원 월급 D-7
    if ((employees as { id: string }[]).length > 0 && businessLaunched) {
      const payDay = 25;
      const payDate = domN <= payDay ? new Date(yN, mN, payDay) : new Date(yN, mN + 1, payDay);
      const pd = diffD(payDate);
      if (pd >= 0 && pd <= 7) {
        const totalPay = (employees as { hourlyWage: number; weeklyHours: number }[]).reduce((s, e) => {
          const weekly = e.weeklyHours >= 15 ? (e.weeklyHours / 5) * e.hourlyWage : 0;
          return s + Math.round((e.hourlyWage * e.weeklyHours + weekly) * 4.345);
        }, 0);
        items.push({ id: "payroll", severity: pd <= 2 ? "urgent" : "warning", title: ko ? `직원 월급 지급일 D-${pd}` : `Payroll in ${pd} days`, detail: ko ? `${(employees as { id: string }[]).length}명 · 예상 ${Math.round(totalPay / 10000)}만원` : `${(employees as { id: string }[]).length} staff · est. ₩${Math.round(totalPay / 10000)}K` });
      }
    }

    // 4. 고정비 D-7
    if (businessLaunched) {
      (fixedExpenses as FixedExpense[]).forEach(fe => {
        const effectiveDay = Math.min(fe.dueDay, daysInMonthN);
        const fDate = effectiveDay >= domN ? new Date(yN, mN, effectiveDay) : new Date(yN, mN + 1, Math.min(fe.dueDay, new Date(yN, mN + 2, 0).getDate()));
        const fd = diffD(fDate);
        if (fd >= 0 && fd <= 7) {
          items.push({ id: `fexp-${fe.id}`, severity: fd <= 2 ? "urgent" : "warning", title: ko ? `고정비 납부: ${fe.name}` : `Expense due: ${fe.name}`, detail: ko ? `${Math.round(fe.amount / 10000)}만원 · D-${fd}` : `₩${Math.round(fe.amount / 10000)}K · D-${fd}` });
        }
      });
    }

    // 5. 회원 만료 D-7
    if (businessCtx.isRecurringRevenue) {
      members.forEach(mm => {
        if (mm.endDate >= todayStrN && mm.endDate <= in7daysN) {
          const d = Math.ceil((new Date(mm.endDate).getTime() - Date.now()) / 86400000);
          items.push({ id: `mem-${mm.id}`, severity: d <= 2 ? "urgent" : "warning", title: ko ? `회원 만료 임박: ${mm.name}` : `Member expiring: ${mm.name}`, detail: ko ? `${mm.plan} · D-${d}` : `${mm.plan} · ${d}d left` });
        }
      });
    }

    // 6. 로드맵 미완료 리마인더
    if (!businessLaunched && completedCount > 0 && completedCount < pathTotalStages) {
      items.push({ id: "roadmap-reminder", severity: "warning", title: ko ? `로드맵 ${completedCount}/${pathTotalStages} 완료` : `Roadmap ${completedCount}/${pathTotalStages} done`, detail: ko ? "다음 단계를 진행하세요" : "Continue to the next stage" });
    }

    // 7. 원가율 경고 (비용 2개월 이상 이력)
    if (costHistory.length >= 2 && businessLaunched) {
      const sorted = [...costHistory].sort((a, b) => b.month.localeCompare(a.month));
      const latest = sorted[0];
      const prev = sorted[1];
      const latestTotal = latest.ingredients + latest.labor + latest.rent + latest.utilities + latest.other;
      const prevTotal = prev.ingredients + prev.labor + prev.rent + prev.utilities + prev.other;
      if (prevTotal > 0 && latestTotal > prevTotal && (latestTotal - prevTotal) / prevTotal > 0.1) {
        items.push({ id: "cost-trend", severity: "warning", title: ko ? "비용 급증 경고" : "Cost surge alert", detail: ko ? `전월 대비 ${Math.round((latestTotal - prevTotal) / prevTotal * 100)}% 증가` : `${Math.round((latestTotal - prevTotal) / prevTotal * 100)}% increase vs last month` });
      }
    }

    setNotifications(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, inventory, employees, fixedExpenses, members, taxSettings, businessLaunched, businessCtx.hasPhysicalInventory, businessCtx.isRecurringRevenue, completedCount, pathTotalStages, costHistory]);


  return {
    // Context hooks
    router, searchParams, language, setLanguage, copy,
    // Core state
    decisions, setDecisions, roadmap, setRoadmap, taskMap, setTaskMap,
    viewingStageId, setViewingStageId,
    // Industry / startup selection
    selectedIndustryId, setSelectedIndustryId,
    selectedIndustryCategoryId, setSelectedIndustryCategoryId,
    selectedBusinessModelId, setSelectedBusinessModelId,
    selectedBudget, setSelectedBudget, budgetInputText, setBudgetInputText,
    selectedOpenDate, setSelectedOpenDate,
    selectedLocationId, setSelectedLocationId,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    recommendedMarkets, setRecommendedMarkets,
    customMarketName, setCustomMarketName,
    customMarketReason, setCustomMarketReason,
    manualMarketEvaluation, setManualMarketEvaluation,
    manualAlternative, setManualAlternative,
    // Contract
    selectedContractTaskId, setSelectedContractTaskId,
    contractText, setContractText,
    contractAnalysisStatus, contractAnalysisError, contractAnalysis, setContractAnalysis,
    // Finance
    showFinancePanel, setShowFinancePanel,
    financeCapitalText, setFinanceCapitalText,
    financeMonthlyRentText, setFinanceMonthlyRentText,
    financeLaborText, setFinanceLaborText,
    financeRevenueText, setFinanceRevenueText,
    financeMarketStyle, setFinanceMarketStyle,
    financeRentBand, setFinanceRentBand,
    financeStatus, financeError, financeResult, financeInterpretation,
    // Guide Q&A
    selectedGuideSectionKey, setSelectedGuideSectionKey,
    guideQuestion, setGuideQuestion,
    guideQaStatus, guideQaError, guideAnswer, setGuideAnswer,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError, setKnowledgeQaError,
    // Knowledge
    locationOptions, locationSourceLabel,
    permitGuides, taxGuides, loanGuides,
    // Startup type / franchise
    startupType, setStartupType,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    showFranchisePicker, setShowFranchisePicker,
    nearbyFranchiseStores, setNearbyFranchiseStores,
    nearbyFranchiseLoading, setNearbyFranchiseLoading,
    locationMapReady, setLocationMapReady,
    // Stage guide
    stageGuideContent, guideStepIndex, setGuideStepIndex,
    guideSelections, setGuideSelections,
    // Vendor / ops
    vendorSelections, setVendorSelections,
    vendorCustomInputs, setVendorCustomInputs,
    opsSelections, setOpsSelections,
    opsPosChecks, setOpsPosChecks,
    opsStep, setOpsStep,
    // Soft open
    softOpenChecks, setSoftOpenChecks,
    softOpenPricing, setSoftOpenPricing,
    softOpenStep, setSoftOpenStep,
    softOpenSkips, setSoftOpenSkips,
    // Tax / loan checks
    taxChecks, setTaxChecks, loanChecks, setLoanChecks,
    // Analytics state
    dailyEntries, setDailyEntries, monthlyCosts, setMonthlyCosts, costHistory,
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
    taxSettings, setTaxSettings,
    onlinePlatformSales, setOnlinePlatformSales,
    onlineSelectedPlatforms, setOnlineSelectedPlatforms,
    onlineSelectedCourier, setOnlineSelectedCourier,
    onlineMonthlyParcels, setOnlineMonthlyParcels,
    members, setMembers,
    memFormOpen, setMemFormOpen,
    memName, setMemName, memPlan, setMemPlan,
    memFee, setMemFee, memEnd, setMemEnd,
    // Business state
    businessLaunched, setBusinessLaunched, storeName, setStoreName,
    costIngredientsText, setCostIngredientsText,
    costLaborText, setCostLaborText,
    costRentText, setCostRentText,
    costUtilitiesText, setCostUtilitiesText,
    costOtherText, setCostOtherText,
    dailyDateInput, setDailyDateInput,
    dailySalesInput, setDailySalesInput,
    dailyCustomersInput, setDailyCustomersInput,
    cpaDecision, setCpaDecision,
    selectedInteriorConcept, setSelectedInteriorConcept,
    contractors, contractorsLoading, contractorsRetryKey, setContractorsRetryKey,
    showProfileDetails, setShowProfileDetails,
    showMonthlyCostPrompt, setShowMonthlyCostPrompt,
    lastUnlocked, selectedStoreIndex, setSelectedStoreIndex,
    authLabel, persistenceLabel, persistenceReady,
    saveStatus, setSaveStatus,
    profile, authResolved, requiresAuth,
    transitionNotice, setTransitionNotice,
    // Computed values
    displayedStageId, currentStage, traversedStages,
    traversedIndex, prevTraversedStage, nextTraversedStage,
    isViewingPastStage,
    canCompleteIndustryStep, canCompleteStartupTypeStep,
    canCompleteBusinessModelStep, canCompleteBudgetStep, canCompleteLocationStep,
    hasPermitGuide, hasTaxGuide, hasLoanGuide,
    completedCount, preferredRegion, industryCategoryId, businessCtx,
    isDigitalCategory, pathTotalStages, correctedProgressPercent, allStagesDone, businessHealthScore,
    aiActions, aiActionsLoading, fetchAiActions,
    localizedCurrentStage, isGuideStage, isFreshAccount,
    startupSummary, selectedIndustryLabel, nextStepSummary,
    locationRegionLabel, locationHelpText,
    locationRecommendedLabel, locationDirectLabel,
    locationInputPlaceholder, customLocationLabel,
    customLocationPlaceholder, customLocationReasonPlaceholder,
    scoreLocationLabel, selectedLocationDetailLabel,
    sliderBudgetValue, activeBudgetLabel, activeOpenDatePreset,
    activeSurface, currentStageIndex,
    roadmapPreviewStages, nextRoadmapStage,
    homePrinciples, surfaceTabs,
    // Onboarding
    showOnboardingChoice, setShowOnboardingChoice,
    showExistingOnboarding, setShowExistingOnboarding,
    showAIRoadmapWizard, setShowAIRoadmapWizard,
    showRoleSelection, setShowRoleSelection,
    userRole, setUserRole,
    handleExistingBusinessComplete,
    handleAIRoadmapComplete,
    // Auth
    handleSignOut, clearLocalUserData, resetLocalState,
    // Reset
    resetDemo, isResetting, resetProgress,
    // Contract computed
    contractTasks, activeContractTask, activeContractTaskDetail,
    // Handlers
    navigateToSurface, openFinanceFromSummary,
    handleIndustryContinue, handleBusinessModelContinue,
    handleStartupTypeContinue, handleBudgetContinue,
    handleLocationContinue, handleContractTaskToggle,
    handleContractContinue, handleTaskToggle,
    handleStageContinue, handleLaunchBusiness,
    handleAddDailyEntry, handleSaveMonthlyCosts,
    saveInventory, handleInvSave, handleInvQty, handleInvDelete,
    openInvEdit, handleInvWaste, handleMarkOrdered,
    emptyInvForm,
    saveEmployees, handleEmpSave, handleEmpDelete, openEmpEdit,
    saveFixedExpenses, handleFexpSave, handleFexpDelete, openFexpEdit,
    saveDeliveryPlatforms, saveMonthlyDeliverySales,
    handleDlvSave, handleDlvDelete, openDlvEdit,
    saveProducts, handleProdSave, handleProdDelete, handleProdSoldChange, openProdEdit,
    unifiedProducts, setUnifiedProducts, saveUnifiedProducts,
    serviceMenuItems, setServiceMenuItems, saveServiceMenuItems,
    saveTaxSettings,
    handleContractAnalysis, handleRunFinancialSimulation,
    handleVerificationContinue,
    handleKnowledgeQuestion, handleGuideQuestion,
    // Guide computed
    activeGuide, activeGuideSections, activeGuideSection,
    activeGuideFreshness, activeGuideActionLabel, activeGuideEmptyLabel,
    guideDecisionKey,
    // Location computed
    activeLocationCandidates, finalSelectedMarket,
    // Derived
    savedFinanceSnapshot, savedContractSnapshot, savedGuideQaSnapshot,
    effectiveContractAnalysis, effectiveGuideAnswer, financeDefaults,
    connectAndLoad, persistCurrentState,
    // Constants re-exported for surfaces
    GUIDE_STAGE_CODES, SURFACE_HREFS,
  };
}

export type DashboardHook = ReturnType<typeof useDashboard>;
