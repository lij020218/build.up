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
  formatKRW,
  formatMarketMetaValue,
  formatGuideSectionTitle,
  formatOpenDatePresetLabel,
  formatStageStatus,
  formatStageType,
  formatStartupType,
  getRiskLevelLabel,
  getIndustryCategoryIdByOptionId,
  getFreshnessPresentation,
  getCurrentUser,
  getStarterBusinessModelOptions,
  getStarterLocationOptions,
  getUiCopy,
  localizeGuideRecord,
  localizeRecommendationItem,
  localizeStage,
  localizeStarterIndustryCategory,
  localizeStarterStepCard,
  localizeTaskTitle,
  loadKnowledgeRecommendations,
  loadLoanKnowledge,
  loadBestMarketSignal,
  loadBusinessProfile,
  loadMarketSignalRecommendations,
  loadPermitKnowledge,
  runFinancialSimulation,
  saveRoadmapState,
  loadStageGuideContent,
  loadTaxKnowledge,
  starterIndustryCategories,
  starterBudgetPresets,
  starterDecisionMap,
  starterIndustryOptions,
  starterOpenDatePresets,
  starterRoadmap,
  starterStageFlow,
  starterStepCards,
  starterTaskMap,
  updateTaskStatus,
  upsertStageDecision,
  type StageGuideContent,
  type GuideQaAnswer,
  type PersistedBusinessProfile,
  type FinancialSimulationResult,
  type RecommendationItem,
  type WorkflowTaskMap,
  type WorkflowDecisionMap,
  resolveBusinessContext,
  franchiseBrands,
  getHighlightedPrograms,
  getMatchedPrograms,
  getMatchedProgramsV2,
  getApplicationStatusLabel,
  getMatchedHighlights,
  getProgramCategoryLabel,
  getProgramCategoryColor,
  startupPrograms,
  type ProgramCategory,
  getFranchiseBrandsForCategory,
  getFranchiseBrandsForSubIndustry,
  getFranchiseBrandById,
  franchiseApplicationChecklist,
  contractCheckpoints,
  getFranchiseSupplyInfo,
  getSupplyTypeLabel,
  getSupplyTypeColor,
  type SupplyType,
  computeOverallScore,
  formatFranchiseCost,
  getScoreColor,
  getScoreLabel,
  type FranchiseBrand,
  getFullToolKit,
  getRecommendedStack,
} from "@foundone/shared";
import type { AiStructuredResponse, ContractAnalysisResult } from "@foundone/ai";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { fetchLiveSupportPrograms } from "./lib/services/live-data";
import { DashboardProvider, type DashboardContextValue } from "./lib/contexts/DashboardContext";
import { AuroraBackground } from "../components/ui/aurora-background";
import { RoadmapSurface } from "./lib/components/surfaces/RoadmapSurface";
import { ResetAnimationOverlay } from "./lib/components/reset/ResetAnimationOverlay";
import { OnboardingChoiceScreen } from "./lib/components/onboarding/OnboardingChoiceScreen";
import { AnalyticsSurface } from "./lib/components/surfaces/AnalyticsSurface";
import { MyStoreView } from "./lib/components/surfaces/MyStoreView";
import { ReportsSurface } from "./lib/components/surfaces/ReportsSurface";
import { MarketingSurface } from "./lib/components/surfaces/MarketingSurface";
import { FranchiseView } from "./lib/components/surfaces/FranchiseView";
import { ProfileView } from "./lib/components/surfaces/ProfileView";
import { GuidesView } from "./lib/components/surfaces/GuidesView";
import { HomeView } from "./lib/components/surfaces/HomeView";
import { CurrentStageView } from "./lib/components/surfaces/CurrentStageView";
import { FloatingAIPartner } from "./lib/components/dashboard/FloatingAIPartner";
import { useCashflowNotifications } from "./lib/hooks/useCashflowNotifications";
import { WelcomeOnboarding } from "./lib/components/WelcomeOnboarding";
import { CardErrorBoundary } from "./lib/components/CardErrorBoundary";
import { DashboardSkeleton } from "./lib/components/ui/Skeleton";
import { HiringCostCalculator } from "./lib/components/knowledge/HiringCostCalculator";
import { SecurityChecklist } from "./lib/components/knowledge/SecurityChecklist";
import { InvestmentGlossary } from "./lib/components/knowledge/InvestmentGlossary";
import { useLanguage } from "./language-provider";
import { useNotifications } from "./notification-context";
import {
  Layers, Lightbulb, VolumeX, Shield, Zap, Droplets, Wind, Gem,
  Paintbrush, Leaf, Scan, Lock, Plug, Grid3X3, DoorOpen, Sun, Film,
  PanelLeft, Table2, Box, Frame, Trees, Thermometer, Flame, Package,
  Factory, Coffee, Compass, Home, Beer, Wine, Sprout, Sparkles,
  Flower2, Crown, Heart, Dumbbell, Waves, BookOpen, Palette, Award,
  Star, Scissors, AlignLeft, Megaphone, Store, Cpu, RefreshCw,
  Maximize2, MapPin, Monitor, Smile, Building2, LayoutGrid,
  CreditCard, ClipboardList, BarChart2, Bike,
  Wifi, Camera, Users, Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { styles } from "./lib/styles";
import type { GuideRecord, SavedFinanceSnapshot, SavedContractAnalysisSnapshot, SavedGuideQaSnapshot, DashboardSurface } from "./lib/types";
import { GUIDE_STAGE_CODES, SURFACE_HREFS, VENDOR_URL_MAP } from "./lib/constants";
import {
  getGuideSections,
  formatConfidenceBadge,
  parseManwonInput,
  inferFinanceDefaults,
  formatBreakEvenMonth,
  hydrateSavedFinanceSnapshot,
  hydrateSavedContractAnalysisSnapshot,
  hydrateSavedGuideQaSnapshot,
  getContractAnalysisHints,
  baseRoadmap,
  getContractTaskDetail,
  buildTransitionNotice,
  cloneStarterTaskMap,
  type ContractTaskDetail,
} from "./lib/helpers";
import { LocationMapPanel } from "./lib/components/LocationMapPanel";
import { SurfaceIcon } from "./lib/components/SurfaceIcon";
import { ExistingBusinessOnboarding } from "./lib/components/ExistingBusinessOnboarding";
import { StaffDashboard } from "./lib/components/surfaces/StaffDashboard";
import TaxCalendarCard from "./lib/components/TaxCalendarCard";
import HealthDiagnosisCard from "./lib/components/HealthDiagnosisCard";
import LifecycleCard from "./lib/components/LifecycleCard";
import OperationalDashboard from "./lib/components/dashboard/OperationalDashboard";
import RoleSelectionScreen from "./lib/components/RoleSelectionScreen";
import AIRoadmapWizard from "./lib/components/AIRoadmapWizard";
import { calculateHealthMetrics, forecastSales } from "@foundone/shared";
import type { BusinessHealthMetrics, SalesForecast } from "@foundone/shared";
import { useDashboard, type InventoryItem, type InvForm, type Employee, type DeliveryPlatform, type Product, type TaxSettings, type FixedExpense, type Member, type DailyEntry, type MonthlyCosts, type UnifiedProduct, type ServiceMenuItem } from "./lib/useDashboard";
import { getKstDate } from "./lib/utils/business-day";
import {
  operationalShell,
  operationalShellSidebar,
  operationalShellSidebarCollapsed,
  operationalNavSection,
  operationalSurfaceNav,
} from "./app-shell-styles";

/**
 * StarterStageDemo — Found.One 앱 메인 셸
 *
 * ─────────────────────────────────────────────────────
 * FILE MAP (1300+ 줄 단일 컴포넌트 — 향후 분리 예정)
 * ─────────────────────────────────────────────────────
 *  L164–550   : 상태·훅 선언 (useDashboard, useHandlers, computed values)
 *  L550–660   : 상황 감지 파생값 (showOperationalHero, isHomeOperational, ...)
 *  L660–705   : 조기 반환 (로딩 중 / 인증 미완료)
 *  L705–955   : 온보딩 경로 분기 (WelcomeOnboarding / AIRoadmapWizard / ExistingBusinessOnboarding / OnboardingChoiceScreen)
 *  L955–1050  : 모바일 수평 nav (isHomeOperational && showSurfaceNav)
 *  L1050–1155 : 데스크탑 좌측 사이드바 (isHomeOperational)
 *  L1155–1295 : 상단 nav 바 + surface 탭 (showSurfaceNav && !isHomeOperational)
 *  L1295–1305 : surface 콘텐츠 렌더러 (activeSurface switch)
 *
 * 스타일 상수 → ./app-shell-styles.ts
 * ─────────────────────────────────────────────────────
 */
export default function StarterStageDemo({
  surface = "home",
  showSurfaceNav = true
}: {
  surface?: DashboardSurface;
  showSurfaceNav?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [welcomed, setWelcomed] = useState(() => {
    try { return localStorage.getItem("__foundone_welcomed") === "true"; } catch { return false; }
  });
  useEffect(() => { setMounted(true); }, []);

  // ── 🔒 reset 직후 무조건 onboarding 첫 화면 노출 ──────────────────────────
  //  resetDemo 가 reload 직전 localStorage 에 `pending_force_onboarding` 을 set 하고
  //  `?reset=...` 쿼리로 redirect. 둘 중 하나라도 있으면 useState 초기값 / 다른 데이터 로딩
  //  결과를 무시하고 강제로 onboarding 화면을 띄운다. 이게 없으면 server 데이터 race / RLS
  //  검증 실패 / hasIndustry 잔재 등으로 reset 후에도 옛 화면이 보이는 corner case 발생.
  const justReset = (() => {
    if (typeof window === "undefined") return false;
    try {
      const flagged = localStorage.getItem("pending_force_onboarding");
      const urlReset = new URLSearchParams(window.location.search).has("reset");
      return !!flagged || urlReset;
    } catch {
      return false;
    }
  })();

  // ── Hoisted from conditional render blocks to prevent hook ordering issues ──
  const [filterCat, setFilterCat] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [competitorResults, setCompetitorResults] = useState<{ totalCount: number; places: Array<{ name: string; address: string; phone: string; url: string }> } | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  // AI + Kakao 라이브 상권 추천
  const [aiMarketLoading, setAiMarketLoading] = useState(false);
  const [aiMarketError, setAiMarketError] = useState<string | null>(null);
  const [bpLoading, setBpLoading] = useState(false);
  const [bpSections, setBpSections] = useState<Array<{ title: string; content: string }> | null>(null);
  const [bpSummary, setBpSummary] = useState<string | null>(null);
  const [bpError, setBpError] = useState<string | null>(null);
  const [bpExpandedIdx, setBpExpandedIdx] = useState<number | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("foundone_onboarding_dismissed") === "true";
    }
    return false;
  });
  const [progFilter, setProgFilter] = useState<ProgramCategory | "all">("all");
  const [liveProgramsData, setLiveProgramsData] = useState<Array<{ id: string; programName: string; organizerName: string; supportCategory: string; isOpen: boolean; url?: string }>>([]);
  const [liveProgramsLoading, setLiveProgramsLoading] = useState(false);
  const [liveMarketInsights, setLiveMarketInsights] = useState<{
    loading: boolean;
    population?: { total: number; households: number; male: number; female: number };
  } | null>(null);
  const [regPage, setRegPage] = useState(0);
  const [mvpPage, setMvpPage] = useState(0);
  const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);
  const [insuranceTaxPage, setInsuranceTaxPage] = useState(0);
  const [interiorGuidesData, setInteriorGuidesData] = useState<{ materials: Array<{ id: string; guideType: string; nameKo: string; nameEn?: string; descriptionKo: string; descriptionEn?: string; iconName?: string; tags: string[]; pros?: string[]; cons?: string[]; costRangeKo?: string; costRangeEn?: string; trendSource?: string; priority: number }>; concepts: Array<{ id: string; guideType: string; nameKo: string; nameEn?: string; descriptionKo: string; descriptionEn?: string; iconName?: string; tags: string[]; pros?: string[]; cons?: string[]; costRangeKo?: string; costRangeEn?: string; trendSource?: string; priority: number }> } | null>(null);
  const [interiorGuidesLoaded, setInteriorGuidesLoaded] = useState(false);
  const [mvpToolsOpen, setMvpToolsOpen] = useState(false);
  const [livePermitInsights, setLivePermitInsights] = useState<{
    loading: boolean;
    data?: { total: number; operating: number; closed: number; survivalRate: number };
  } | null>(null);
  const [liveBudgetBenchmark, setLiveBudgetBenchmark] = useState<{
    loading: boolean;
    data?: { avgTotalStartupCost: number; avgFranchiseFee: number; avgDeposit: number; avgEducationFee: number; avgOtherCost: number; industryName: string };
  } | null>(null);

  const d = useDashboard(surface);
  // Cashflow 알림 자동 발송 — 위기 감지 + 매일 아침 8~11시 요약
  // (cashflow-store 의 notifyOnCrisis / dailyMorningBriefing 토글이 ON 일 때만 동작)
  useCashflowNotifications();

  // ─── AI 코치 → 기능 navigate 이벤트 listener ─────────────────────────
  // AiCoachCard 의 feature CTA 클릭 시 dispatch 되는 'bup:navigate-feature' 이벤트를
  // 받아 surface 전환 + (옵션) 카드 ID 로 부드럽게 scroll + 청록 halo 강조.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { surface?: import("./lib/types").DashboardSurface; scrollTargetId?: string; selector?: string; focusInput?: boolean }
        | undefined;
      if (!detail?.surface) return;
      d.navigateToSurface(detail.surface);

      const targetId = detail.scrollTargetId;
      const targetSelector = detail.selector;
      if (!targetId && !targetSelector) return;

      // surface remount 후 DOM 커밋 대기 (애니메이션 제거됨 — 50ms 면 충분)
      window.setTimeout(() => {
        const el: HTMLElement | null = targetId
          ? document.getElementById(targetId)
          : targetSelector
            ? document.querySelector<HTMLElement>(targetSelector)
            : null;
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });

        // 입력 필드 focus 옵션 — 매출 입력 같은 경우 즉시 타이핑 가능하도록
        if (detail.focusInput) {
          const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
          input?.focus();
        }

        // 시각적 강조 — 청록 halo 1.4s
        const prevBoxShadow = el.style.boxShadow;
        const prevTransition = el.style.transition;
        el.style.transition = "box-shadow 0.4s cubic-bezier(0.22,1,0.36,1)";
        el.style.boxShadow = "0 0 0 4px rgba(45, 212, 191, 0.45), 0 12px 32px rgba(45, 212, 191, 0.2)";
        window.setTimeout(() => {
          el.style.boxShadow = prevBoxShadow;
          window.setTimeout(() => { el.style.transition = prevTransition; }, 400);
        }, 1400);
      }, 50);
    };
    window.addEventListener("bup:navigate-feature", handler);
    return () => window.removeEventListener("bup:navigate-feature", handler);
  }, [d]);

  const isStartupCategory = d.industryCategoryId === "startup-tech";
  const startupTypeOptions: Array<"independent" | "franchise" | "undecided"> = isStartupCategory
    ? ["independent", "undecided"]
    : ["independent", "franchise", "undecided"];
  const analyticsInventoryRef = useRef<HTMLElement | null>(null);
  const analyticsStaffRef = useRef<HTMLElement | null>(null);
  const lastAnalyticsActionRef = useRef("");
  const {
    router, searchParams, language, setLanguage, copy,
    decisions, setDecisions, roadmap, setRoadmap, taskMap, setTaskMap,
    viewingStageId, setViewingStageId,
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
    selectedContractTaskId, setSelectedContractTaskId,
    contractText, setContractText,
    contractAnalysisStatus, contractAnalysisError, contractAnalysis, setContractAnalysis,
    showFinancePanel, setShowFinancePanel,
    financeCapitalText, setFinanceCapitalText,
    financeMonthlyRentText, setFinanceMonthlyRentText,
    financeLaborText, setFinanceLaborText,
    financeRevenueText, setFinanceRevenueText,
    financeMarketStyle, setFinanceMarketStyle,
    financeRentBand, setFinanceRentBand,
    financeStatus, financeError, financeResult, financeInterpretation,
    selectedGuideSectionKey, setSelectedGuideSectionKey,
    guideQuestion, setGuideQuestion,
    guideQaStatus, guideQaError, guideAnswer, setGuideAnswer,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError, setKnowledgeQaError,
    locationOptions, locationSourceLabel,
    permitGuides, taxGuides, loanGuides,
    startupType, setStartupType,
    selectedFranchiseBrandId, setSelectedFranchiseBrandId,
    showFranchisePicker, setShowFranchisePicker,
    nearbyFranchiseStores, setNearbyFranchiseStores,
    nearbyFranchiseLoading, setNearbyFranchiseLoading,
    locationMapReady, setLocationMapReady,
    stageGuideContent, guideStepIndex, setGuideStepIndex,
    guideSelections, setGuideSelections,
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
    showOnboardingChoice, setShowOnboardingChoice,
    showExistingOnboarding, setShowExistingOnboarding,
    showAIRoadmapWizard, setShowAIRoadmapWizard,
    showRoleSelection, setShowRoleSelection,
    userRole, setUserRole,
    handleExistingBusinessComplete,
    handleAIRoadmapComplete,
    handleSignOut,
    resetDemo, isResetting, resetProgress,
    contractTasks, activeContractTask, activeContractTaskDetail,
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
    unifiedProducts, saveUnifiedProducts,
    serviceMenuItems, saveServiceMenuItems,
    saveTaxSettings,
    handleContractAnalysis, handleRunFinancialSimulation,
    handleVerificationContinue,
    handleKnowledgeQuestion, handleGuideQuestion,
    activeGuide, activeGuideSections, activeGuideSection,
    activeGuideFreshness, activeGuideActionLabel, activeGuideEmptyLabel,
    guideDecisionKey,
    activeLocationCandidates, finalSelectedMarket,
    savedFinanceSnapshot, savedContractSnapshot, savedGuideQaSnapshot,
    effectiveContractAnalysis, effectiveGuideAnswer, financeDefaults,
    connectAndLoad, persistCurrentState,
    GUIDE_STAGE_CODES, SURFACE_HREFS,
  } = d;
  /* ── Redirect to landing page if not logged in ── */
  useEffect(() => {
    if (authResolved && requiresAuth) {
      router.push("/auth");
    }
  }, [authResolved, requiresAuth, router]);

  // Flags for conditional rendering — no early returns here (hooks below)
  const shouldShowAuth = authResolved && requiresAuth;
  const shouldShowRoleSelection = showRoleSelection && !shouldShowAuth;

  const roleSelectionNode = shouldShowRoleSelection ? (
      <RoleSelectionScreen
        language={language}
        onSelect={async (role, inviteCode) => {
          try {
            if (role === "staff" && inviteCode) {
              // 직원: 초대 코드로 가게 연결
              try {
                const { data: invite } = await supabase
                  .from("store_invites" as never)
                  .select("*")
                  .eq("invite_code", inviteCode)
                  .is("used_by", null)
                  .gt("expires_at", new Date().toISOString())
                  .maybeSingle() as { data: { id: string; owner_user_id: string; role: string } | null };

                if (invite) {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await supabase.from("store_members" as never).upsert({
                      owner_user_id: invite.owner_user_id,
                      member_user_id: user.id,
                      role: invite.role || "staff",
                    } as never, { onConflict: "owner_user_id,member_user_id" });
                    await supabase.from("store_invites" as never).update({ used_by: user.id, used_at: new Date().toISOString() } as never).eq("id", invite.id);
                  }
                }
              } catch { /* tables may not exist yet */ }
            }

            // 역할 저장 (business_profiles에)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("business_profiles").update({ user_role: role } as never).eq("user_id", user.id);
            }

            setUserRole(role);
            setShowRoleSelection(false);
            if (role === "owner") setShowOnboardingChoice(true);
          } catch {
            setUserRole(role);
            setShowRoleSelection(false);
            if (role === "owner") setShowOnboardingChoice(true);
          }
        }}
      />
  ) : null;

  const shouldShowExistingOnboarding = !justReset && showExistingOnboarding && !shouldShowAuth && !shouldShowRoleSelection;
  const shouldShowAIRoadmap = !justReset && showAIRoadmapWizard && !shouldShowAuth && !shouldShowRoleSelection;
  // 데이터 로드 완료 후 fresh account면 항상 온보딩 선택 화면 표시 (리셋 후에도)
  // onboardingDismissed가 true이면 isFreshAccount 자동 표시를 억제 (직접 로드맵 선택 시)
  // justReset=true 이면 모든 조건 우회 — reset 직후엔 무조건 onboarding 첫 화면.
  const shouldShowOnboardingChoice =
    !shouldShowAuth && !shouldShowRoleSelection && !shouldShowExistingOnboarding && !shouldShowAIRoadmap &&
    (justReset || showOnboardingChoice || (isFreshAccount && persistenceReady && !businessLaunched && !onboardingDismissed));

  // ── reset flag clear: onboarding 화면이 떴고 사용자가 mount 한 후 한 번만 정리 ──
  //  너무 일찍 지우면 다시 다른 페이지 갔다 올 때 force 효과 사라짐.
  //  너무 늦게 지우면 다음 mount 에서도 force 가 계속 걸림.
  //  → onboarding 카드를 "표시하기 시작" 한 직후 (mount 완료 + flag 사용 끝났을 때) 정리.
  useEffect(() => {
    if (!justReset) return;
    if (!shouldShowOnboardingChoice) return;
    // onboarding 카드가 실제로 보이는 첫 frame 다음에 정리.
    const timer = window.setTimeout(() => {
      try {
        localStorage.removeItem("pending_force_onboarding");
        // URL 의 ?reset=... 도 제거 — 새로고침 시 재발동 방지
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete("reset");
          window.history.replaceState({}, "", url.toString());
        }
      } catch { /* noop */ }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [justReset, shouldShowOnboardingChoice]);

  // NOTE: No early returns here — useEffect below must always execute.
  // All conditional returns are placed AFTER the useEffect.

  // ⚠️ 2026-05-25 audit fix: dead code block (line 549-684, 'if (false as boolean)') 제거.
  //   온보딩 choice 는 아래 useEffect 이후 렌더됨. 이전 ~140줄 unreachable code.


  const showOperationalHero = !(
    (activeSurface === "home" && mounted && businessLaunched) ||
    // 4개 surface(보고서·마케팅·프랜차이즈·펀딩)는 모두 자체 hero header 를 가져
    // 외부 hero 중복 노출을 방지. 미드나이트 단색 + eyebrow + title + subtitle 패턴 통일.
    activeSurface === "reports" ||
    activeSurface === "marketing" ||
    activeSurface === "franchise" ||
    activeSurface === "guides"
  );
  // 운영 중 (창업 완료 후) → 모든 페이지에서 좌측 사이드바, 상단 nav 숨김
  // (이전엔 홈에서만 사이드바였으나 사용자 결정으로 통일)
  const isHomeOperational = mounted && businessLaunched;

  // 사이드바 접기/펼치기 (Linear/Notion 표준 패턴)
  //   접힘: 60px (아이콘만, 라벨 tooltip)
  //   펼침: 200px (아이콘 + 라벨)
  // localStorage 영속.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("foundone-sidebar-collapsed") === "true"; }
    catch { return false; }
  });
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem("foundone-sidebar-collapsed", String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  useEffect(() => {
    if (activeSurface !== "analytics") {
      lastAnalyticsActionRef.current = "";
      return;
    }

    const manage = searchParams.get("manage");
    const action = searchParams.get("action");
    const key = `${manage ?? ""}:${action ?? ""}`;

    if (!manage || lastAnalyticsActionRef.current === key) {
      return;
    }

    lastAnalyticsActionRef.current = key;

    const scrollToTarget = () => {
      const target =
        manage === "inventory"
          ? analyticsInventoryRef.current
          : manage === "staff"
            ? analyticsStaffRef.current
            : null;

      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    requestAnimationFrame(scrollToTarget);

    if (manage === "inventory" && action === "add") {
      setInvForm({ ...emptyInvForm, open: true });
    }

    if (manage === "staff" && action === "add") {
      setEmpFormOpen(true);
      setEmpEditId(null);
      setEmpName("");
      setEmpWage("");
      setEmpHours("");
      setEmpInsured(false);
    }
  }, [
    activeSurface,
    searchParams,
    emptyInvForm,
    setInvForm,
    setEmpFormOpen,
    setEmpEditId,
    setEmpName,
    setEmpWage,
    setEmpHours,
    setEmpInsured,
  ]);

  // ── ALL HOOKS CALLED. Conditional returns are safe below. ──

  // Context value: useDashboard 반환값 + 로컬 state 통합
  const _ctxValue: DashboardContextValue = {
    ...d,
    mounted, filterCat, setFilterCat, expandedId, setExpandedId,
    competitorResults, setCompetitorResults, competitorLoading, setCompetitorLoading,
    aiMarketLoading, setAiMarketLoading, aiMarketError, setAiMarketError,
    bpLoading, setBpLoading, bpSections, setBpSections, bpSummary, setBpSummary,
    bpError, setBpError, bpExpandedIdx, setBpExpandedIdx,
    onboardingDismissed, setOnboardingDismissed,
    progFilter, setProgFilter,
    liveProgramsData, setLiveProgramsData, liveProgramsLoading, setLiveProgramsLoading,
    liveMarketInsights, setLiveMarketInsights,
    regPage, setRegPage,
    livePermitInsights, setLivePermitInsights,
    liveBudgetBenchmark, setLiveBudgetBenchmark,
  };

  // 초기 로딩 중 — 인증 확인 전 스켈레톤 표시
  if (!mounted || !authResolved) {
    return <DashboardSkeleton />;
  }

  if (shouldShowAuth) {
    return null; // useEffect에서 /auth로 리다이렉트
  }
  if (roleSelectionNode) {
    return roleSelectionNode;
  }
  // ── 직원(또는 매니저) 계정 → 직원 대시보드만 노출. 사장 전용 화면(로드맵·재무·AI) 진입 차단.
  if (userRole === "staff" || userRole === "manager") {
    return <StaffDashboard language={language} />;
  }
  if (shouldShowExistingOnboarding) {
    return (
      <ExistingBusinessOnboarding
        language={language}
        onComplete={handleExistingBusinessComplete}
        onBack={() => { setShowExistingOnboarding(false); setShowOnboardingChoice(true); }}
      />
    );
  }
  if (shouldShowAIRoadmap) {
    return (
      <AIRoadmapWizard
        language={language}
        onComplete={handleAIRoadmapComplete}
        onBack={() => { setShowAIRoadmapWizard(false); setShowOnboardingChoice(true); }}
      />
    );
  }
  if (isResetting) {
    return <ResetAnimationOverlay progress={resetProgress} ko={language === "ko"} />;
  }
  if (shouldShowOnboardingChoice && !welcomed) {
    return <WelcomeOnboarding language={language} onComplete={() => setWelcomed(true)} />;
  }
  if (shouldShowOnboardingChoice) {
    return <OnboardingChoiceScreen
      ko={language === "ko"}
      onChooseManual={() => { setOnboardingDismissed(true); localStorage.setItem("foundone_onboarding_dismissed", "true"); setShowOnboardingChoice(false); navigateToSurface("current"); }}
      onChooseAI={() => { setShowOnboardingChoice(false); setShowAIRoadmapWizard(true); }}
      onChooseExisting={() => { setShowOnboardingChoice(false); setShowExistingOnboarding(true); }}
    />;
  }

  return (
    <DashboardProvider value={_ctxValue}>
    {/* surface 전환 애니메이션 제거됨 (사장님 요청 2026-05-13) — 페이지 전환 시 즉시 표시 */}
    <style>{`
      /* ━━━ 홈 사이드바 ━━━ */
      @keyframes bupSidebarIn {
        from { opacity: 0; transform: translateX(-12px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .bup-sidebar {
        position: fixed;
        top: 0; left: 0; bottom: 0;
        width: 200px;
        padding: 28px 16px 24px;
        /* Liquid glass — 더 투명하게, 뒷배경 색감이 강하게 비침 */
        background:
          linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(248,250,252,0.20) 100%),
          radial-gradient(circle at top left, rgba(29,53,87,0.05), transparent 60%);
        backdrop-filter: blur(40px) saturate(200%);
        -webkit-backdrop-filter: blur(40px) saturate(200%);
        border-right: 1px solid rgba(255,255,255,0.5);
        /* 우측에 미세한 그림자 (페이지와 분리) + 좌상단 highlight */
        box-shadow:
          1px 0 0 rgba(255,255,255,0.6) inset,
          0 1px 0 rgba(255,255,255,0.6) inset,
          4px 0 24px rgba(15,23,42,0.06),
          1px 0 0 rgba(15,23,42,0.04);
        display: flex; flex-direction: column;
        z-index: 50;
        animation: bupSidebarIn .35s cubic-bezier(0.16, 1, 0.3, 1) both;
        font-family: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
        /* overflow: visible — 우측 가장자리 토글 버튼이 -11px 외부로 나오도록 */
      }
      /* 사이드바 내부 미세한 sheen (위→아래 빛 반사) */
      .bup-sidebar::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 60%;
        background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%);
        pointer-events: none;
        z-index: -1;
      }
      .bup-sidebar-logo {
        display: flex; align-items: center; gap: 10px;
        padding: 4px 6px 24px;
        /* 글래스 톤에 맞는 미세 separator (흰색 highlight + 어두운 그림자) */
        border-bottom: 0.5px solid rgba(255,255,255,0.7);
        box-shadow: 0 1px 0 rgba(15,23,42,0.06);
        margin-bottom: 16px;
        position: relative; z-index: 1;
      }
      .bup-sidebar-logo-mark {
        width: 32px; height: 32px; border-radius: 9px;
        background: linear-gradient(135deg, #1d3557 0%, #457b9d 50%, #a8dadc 100%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(29,53,87,0.18);
        font-size: 17px; font-weight: 800; color: #fff;
        letter-spacing: -0.02em;
        flex-shrink: 0;
      }
      .bup-sidebar-logo-text {
        font-size: 15px; font-weight: 700; color: #0f172a;
        letter-spacing: -0.03em;
      }
      .bup-sidebar-nav {
        display: flex; flex-direction: column; gap: 3px;
        flex: 1;
        position: relative; z-index: 1;
      }
      .bup-sidebar-btn {
        display: flex; align-items: center; gap: 11px;
        padding: 10px 12px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 10px;
        font-family: inherit;
        font-size: 13.5px; font-weight: 600;
        color: rgba(15,23,42,0.62);
        text-align: left;
        letter-spacing: -0.01em;
        transition: background .15s ease, color .15s ease, transform .12s ease;
        position: relative;
      }
      .bup-sidebar-btn:hover {
        /* 호버에도 글래스 톤 — 흰색 반투명 + inset highlight */
        background: rgba(255,255,255,0.45);
        color: #0f172a;
        box-shadow: inset 0 0.5px 0 rgba(255,255,255,0.7);
      }
      .bup-sidebar-btn:active { transform: scale(0.98); }
      .bup-sidebar-btn-active {
        /* 활성 — 미드나이트 틴티드 글래스 */
        background: linear-gradient(135deg, rgba(29,53,87,0.12) 0%, rgba(69,123,157,0.06) 100%) !important;
        color: #1d3557 !important;
        font-weight: 700;
        box-shadow:
          inset 0 0.5px 0 rgba(255,255,255,0.6),
          inset 0 0 0 0.5px rgba(29,53,87,0.2),
          0 1px 2px rgba(29,53,87,0.06);
      }
      .bup-sidebar-btn-active::before {
        content: "";
        position: absolute; left: 0; top: 25%; bottom: 25%;
        width: 3px; border-radius: 0 2px 2px 0;
        background: linear-gradient(180deg, #1d3557 0%, #457b9d 100%);
      }
      .bup-sidebar-btn-label {
        flex: 1; min-width: 0;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      /* ━━━ 사이드바 collapsed 모드 (아이콘만, 60px) ━━━ */
      .bup-sidebar { transition: width .25s cubic-bezier(0.16, 1, 0.3, 1); }
      .bup-sidebar[data-collapsed="true"] {
        width: 60px;
        padding: 28px 8px 24px;
      }
      .bup-sidebar[data-collapsed="true"] .bup-sidebar-logo {
        justify-content: center;
        padding: 4px 0 24px;
      }
      .bup-sidebar[data-collapsed="true"] .bup-sidebar-logo-text {
        display: none;
      }
      .bup-sidebar[data-collapsed="true"] .bup-sidebar-btn-label {
        display: none;
      }
      .bup-sidebar[data-collapsed="true"] .bup-sidebar-btn {
        justify-content: center;
        padding: 10px 8px;
      }
      .bup-sidebar[data-collapsed="true"] .bup-sidebar-btn-active::before {
        /* 접힌 상태에선 left bar 살짝 숨김 (아이콘 가운데 정렬 깨지지 않게) */
        opacity: 0.6;
      }

      /* ━━━ 사이드바 우측 가장자리 토글 버튼 (Linear/Notion 표준) ━━━ */
      .bup-sidebar-toggle {
        position: absolute;
        right: -11px;
        top: 30px;
        width: 22px; height: 22px;
        border-radius: 50%;
        background: #fff;
        border: 0.5px solid rgba(15,23,42,0.12);
        box-shadow:
          0 1px 3px rgba(15,23,42,0.08),
          0 0 0 0.5px rgba(255,255,255,0.6) inset;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: rgba(15,23,42,0.5);
        z-index: 51;
        opacity: 0;
        transition: opacity .18s ease, transform .18s ease, background .15s ease, color .15s ease;
        padding: 0;
      }
      .bup-sidebar:hover .bup-sidebar-toggle,
      .bup-sidebar[data-collapsed="true"] .bup-sidebar-toggle {
        opacity: 1;
      }
      .bup-sidebar-toggle:hover {
        background: #1d3557;
        color: #fff;
        transform: scale(1.08);
      }
      .bup-sidebar-toggle:active {
        transform: scale(0.95);
      }

      /* main 의 좌측 padding 도 사이드바 폭에 맞춰 동적 */
      .bup-shell-sidebar { transition: padding-left .25s cubic-bezier(0.16, 1, 0.3, 1); }

      /* 좁은 화면 — 사이드바 숨김 + main 좌측 padding 0으로 (HTML class 로 보정) */
      @media (max-width: 1080px) {
        .bup-sidebar { display: none; }
        .bup-shell-sidebar { padding-left: 16px !important; padding-top: 64px !important; }
      }

      /* ⚠️ 2026-05-19 모바일 horizontal nav — 사이드바 대체 */
      .bup-mobile-topnav {
        display: none;
      }
      @media (max-width: 1080px) {
        .bup-mobile-topnav {
          display: flex;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 60;
          height: 52px;
          padding: 6px 12px;
          padding-top: max(6px, env(safe-area-inset-top));
          padding-left: max(12px, env(safe-area-inset-left));
          padding-right: max(12px, env(safe-area-inset-right));
          background: rgba(255,255,255,0.92);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          border-bottom: 0.5px solid rgba(15,23,42,0.08);
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .bup-mobile-topnav::-webkit-scrollbar { display: none; }
        .bup-mobile-topnav { scrollbar-width: none; }
      }
      .bup-mobile-topnav-logo {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 8px 0 4px;
        font-size: 14px;
        font-weight: 700;
        color: #1d3557;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .bup-mobile-topnav-logo-mark {
        display: inline-flex; align-items: center; justify-content: center;
        width: 26px; height: 26px;
        border-radius: 8px;
        background: linear-gradient(135deg, #1d3557 0%, #457b9d 100%);
        color: #fff; font-weight: 800; font-size: 13px;
      }
      .bup-mobile-topnav-btn {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 36px;
        padding: 0 12px;
        border-radius: 999px;
        border: 0.5px solid rgba(15,23,42,0.08);
        background: rgba(255,255,255,0.6);
        color: rgba(15,23,42,0.7);
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        transition: background .12s, color .12s;
        font-family: inherit;
        scroll-snap-align: start;
      }
      .bup-mobile-topnav-btn-active {
        background: linear-gradient(135deg, rgba(29,53,87,0.12) 0%, rgba(69,123,157,0.06) 100%);
        color: #1d3557 !important;
        font-weight: 700;
        border-color: rgba(29,53,87,0.2);
      }
    `}</style>
    {/* ━━━ 모바일 horizontal nav — 2026-05-19 추가 (사이드바 대체) ━━━ */}
    {isHomeOperational && showSurfaceNav && (
      <nav className="bup-mobile-topnav" aria-label="Mobile navigation">
        <div className="bup-mobile-topnav-logo">
          <span className="bup-mobile-topnav-logo-mark">b</span>
          <span>Found.One</span>
        </div>
        {surfaceTabs.map((tab) => {
          const active = activeSurface === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateToSurface(tab.id)}
              className={`bup-mobile-topnav-btn ${active ? "bup-mobile-topnav-btn-active" : ""}`}
            >
              <SurfaceIcon surface={tab.id} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    )}

    {/* ━━━ 사이드바 — 운영 중일 때 모든 페이지 (좌측 고정 vertical nav, 데스크탑 전용) ━━━ */}
    {isHomeOperational && showSurfaceNav && (
      <aside className="bup-sidebar" data-collapsed={sidebarCollapsed} aria-label="Navigation">
        <div className="bup-sidebar-logo">
          <div className="bup-sidebar-logo-mark">b</div>
          <span className="bup-sidebar-logo-text">
            Build<span style={{ color: "#1d3557" }}>.</span><span style={{ fontWeight: 800 }}>UP</span>
          </span>
        </div>
        {/* 접기/펼치기 토글 — 우측 가장자리 floating */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="bup-sidebar-toggle"
          title={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d={sidebarCollapsed ? "M4.5 3l3 3-3 3" : "M7.5 3l-3 3 3 3"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <nav className="bup-sidebar-nav">
          {surfaceTabs.map((tab) => {
            const active = activeSurface === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateToSurface(tab.id)}
                className={`bup-sidebar-btn ${active ? "bup-sidebar-btn-active" : ""}`}
                title={sidebarCollapsed ? tab.label : undefined}
              >
                <SurfaceIcon surface={tab.id} />
                <span className="bup-sidebar-btn-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    )}

    <main
      className={isHomeOperational ? "bup-shell-sidebar" : undefined}
      data-collapsed={isHomeOperational ? sidebarCollapsed : undefined}
      style={showOperationalHero
        ? styles.shell
        : (isHomeOperational ? (sidebarCollapsed ? operationalShellSidebarCollapsed : operationalShellSidebar) : operationalShell)}
    >
      {showOperationalHero ? (
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Found.One</div>
        <div style={styles.title}>
          {isFreshAccount ? copy.home.heroFresh : copy.home.heroActive}
        </div>
        <div style={styles.subtitle}>
          {isFreshAccount
            ? copy.home.heroFreshBody
            : copy.home.heroActiveBody}
        </div>
      </section>
      ) : null}

      {/* ━━━ Found.One 로고 — 네비게이션 바 위 (사이드바 모드에서는 숨김 → 사이드바 안에 노출) ━━━ */}
      {showSurfaceNav && !isHomeOperational && (
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: showOperationalHero ? "0 24px 8px" : "12px 20px 8px",
      }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "9px",
          background: "linear-gradient(135deg, #1d3557 0%, #457b9d 50%, #a8dadc 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(29,53,87,0.15)",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: "17px", fontWeight: 800, color: "#fff",
            fontFamily: "inherit",
            letterSpacing: "-0.02em",
          }}>b</span>
        </div>
        <span style={{
          fontSize: "16px", fontWeight: 750, color: "#0f172a",
          letterSpacing: "-0.03em",
          fontFamily: "inherit",
        }}>
          Build<span style={{ color: "#1d3557" }}>.</span><span style={{ fontWeight: 800 }}>UP</span>
        </span>
      </div>
      )}

      {/* 상단 nav — 사이드바 모드에선 숨김 (사이드바에 동일 nav 노출) */}
      {showSurfaceNav && !isHomeOperational ? (
      <section style={showOperationalHero ? styles.section : operationalNavSection}>
        <div style={styles.surfaceNav}>
          {surfaceTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              style={{
                ...styles.surfaceNavButton,
                ...(activeSurface === tab.id ? styles.surfaceNavButtonSelected : {})
              }}
              onClick={() => navigateToSurface(tab.id)}
            >
              <span style={styles.surfaceNavButtonInner}>
                <SurfaceIcon surface={tab.id} />
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      ) : null}

      {/* surface 전환 — 애니메이션 제거, 즉시 표시 (key 는 React remount 유지를 위해 보존) */}
      <div key={activeSurface}>
        {activeSurface === "home" ? (
        mounted && businessLaunched ? (
          <CardErrorBoundary cardLabel="대시보드">
            <OperationalDashboard d={d} />
          </CardErrorBoundary>
        ) : (
          <HomeView />
        )
        ) : null}

        {activeSurface === "current" ? <CurrentStageView /> : null}
        {activeSurface === "franchise" ? <FranchiseView /> : null}

        {/* /profile (내 정보) — 항상 렌더 (설정·언어·계정 관리·매장 정보는 fresh 계정에도 유용).
            이전엔 !isFreshAccount 로 차단했으나 마이그레이션 미적용으로 profile 로드 실패 시
            isFreshAccount=true 로 판정되어 페이지 통째로 빈 화면이 나오는 회귀가 있었음. */}
        {activeSurface === "profile" ? (
          <CardErrorBoundary cardLabel="내 정보">
            <ProfileView />
          </CardErrorBoundary>
        ) : null}

        {activeSurface === "guides" && !isFreshAccount && !isGuideStage ? (
          <GuidesView />
        ) : null}

        {activeSurface === "analytics" ? (
          <CardErrorBoundary cardLabel="내 가게">
            <MyStoreView />
          </CardErrorBoundary>
        ) : null}

        {activeSurface === "marketing" ? (
          <CardErrorBoundary cardLabel="마케팅">
            <MarketingSurface />
          </CardErrorBoundary>
        ) : null}

        {activeSurface === "reports" ? (
          <CardErrorBoundary cardLabel="보고서">
            <ReportsSurface />
          </CardErrorBoundary>
        ) : null}

        {activeSurface === "roadmap" && !isFreshAccount ? (
          <RoadmapSurface />
        ) : null}
      </div>

      {/* ── 전역 AI 파트너 챗봇 — 모든 surface 에서 오른쪽 하단에 떠있음 ──
           "AI 가 사용자의 모든 정보를 알게" — 매출·비용·직원·재고·고정비·마케팅·이상신호·로드맵 종합 주입 */}
      {(() => {
        if (!d.businessLaunched) return null;  // 운영 시작 후에만 노출

        // 1) 매출 집계 (이번 달 / 어제 / 주간 변화)
        const entries = (d.dailyEntries as Array<{ date: string; sales: number }>) ?? [];
        const curMonth = new Date().toISOString().slice(0, 7);
        const thisMonth = entries.filter((e) => e.date.startsWith(curMonth));
        const monthlySalesSum = thisMonth.reduce((s, e) => s + e.sales, 0);
        const yesterdayIso = getKstDate(new Date(Date.now() - 86_400_000));
        const yesterdaySales = entries.find((e) => e.date === yesterdayIso)?.sales;

        // 2) 비용 분해
        const costs = (d.monthlyCosts as Record<string, number>) ?? {};
        const monthlyCostsSum =
          (costs.ingredients ?? 0) + (costs.labor ?? 0) + (costs.rent ?? 0) +
          (costs.utilities ?? 0) + (costs.sga ?? 0) + (costs.marketing ?? 0) +
          (costs.other ?? 0) + (costs.interest ?? 0);
        const marginPct = monthlySalesSum > 0 ? ((monthlySalesSum - monthlyCostsSum) / monthlySalesSum) * 100 : undefined;
        const primeRate = monthlySalesSum > 0
          ? (((costs.ingredients ?? 0) + (costs.labor ?? 0)) / monthlySalesSum) * 100
          : undefined;

        // 3) 운영 정보
        const employees = (d.employees as Array<{ id: string }> | undefined) ?? [];
        const inventory = (d.inventory as Array<{ name: string; quantity: number; minThreshold: number }> | undefined) ?? [];
        const lowStockItems = inventory
          .filter((i) => i.quantity <= i.minThreshold && i.minThreshold > 0)
          .map((i) => i.name)
          .slice(0, 5);
        const fixedExpensesData = (d.fixedExpenses as Array<{ name: string; amount: number; dueDay: number }> | undefined) ?? [];
        const today = new Date().getDate();
        const upcomingFixedExpenses = fixedExpensesData
          .filter((f) => f.dueDay >= today && f.dueDay <= today + 7)
          .map((f) => `${f.name} (${f.dueDay}일 ${Math.round(f.amount / 10000)}만원)`)
          .slice(0, 5);

        // 4) 개업 후 경과일 — profile.businessLaunchedDate 가 있으면 계산
        const profile = d.profile as { businessLaunchedDate?: string; subIndustryId?: string } | null;
        const launchedDate = profile?.businessLaunchedDate;
        const daysSinceLaunch = launchedDate
          ? Math.max(0, Math.round((Date.now() - new Date(launchedDate).getTime()) / 86_400_000))
          : undefined;

        return (
          <FloatingAIPartner
            ko={d.language === "ko"}
            context={{
              // 가게 기본
              storeName: d.storeName,
              industryCategoryId: d.industryCategoryId,
              industryLabel: d.industryCategoryId,
              industrySubIndustryId: profile?.subIndustryId,
              startupType: d.startupType,
              businessLaunched: d.businessLaunched,
              daysSinceLaunch,
              region: d.preferredRegionInput || undefined,
              selectedBudget: d.selectedBudget ?? undefined,

              // 매출/비용
              monthlySales: monthlySalesSum,
              monthlyCosts: monthlyCostsSum,
              marginPct,
              monthlyCostBreakdown: {
                ingredients: costs.ingredients,
                labor: costs.labor,
                rent: costs.rent,
                utilities: costs.utilities,
                sga: costs.sga,
                marketing: costs.marketing,
                other: costs.other,
                interest: costs.interest,
              },
              yesterdaySales,
              primeRate,
              // 운영 단계 분류 (pre-launch / early / growth / mature) — AI 코칭 톤 결정용
              operatingPhase: !d.businessLaunched
                ? "pre-launch"
                : daysSinceLaunch != null && daysSinceLaunch > 90
                  ? "mature"
                  : daysSinceLaunch != null && daysSinceLaunch > 30
                    ? "growth"
                    : "early",
              // 매출 트렌드 (이번 주 7일 vs 그 이전 7일) — 14일 미만이면 insufficient
              ...(() => {
                const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
                const last14 = sorted.slice(-14);
                if (last14.length < 14) {
                  return { salesTrendDirection: "insufficient" as const };
                }
                const recent7Avg = last14.slice(-7).reduce((s, e) => s + e.sales, 0) / 7;
                const prior7Avg = last14.slice(0, 7).reduce((s, e) => s + e.sales, 0) / 7;
                if (prior7Avg <= 0) return { salesTrendDirection: "insufficient" as const };
                const changePct = ((recent7Avg - prior7Avg) / prior7Avg) * 100;
                const direction: "improving" | "declining" | "stable" =
                  changePct >= 5 ? "improving" : changePct <= -5 ? "declining" : "stable";
                return {
                  salesTrendDirection: direction,
                  weeklyChange: Math.round(changePct * 10) / 10,
                };
              })(),
              // 비용 구조 추세 (이번달 prime cost % vs 지난달)
              ...(() => {
                const curMonth = new Date().toISOString().slice(0, 7);
                const prevDate = new Date(); prevDate.setMonth(prevDate.getMonth() - 1);
                const prevMonth = prevDate.toISOString().slice(0, 7);
                const thisRev = entries.filter((e) => e.date.startsWith(curMonth)).reduce((s, e) => s + e.sales, 0);
                const prevRev = entries.filter((e) => e.date.startsWith(prevMonth)).reduce((s, e) => s + e.sales, 0);
                const costHistory = (d.costHistory as Array<{ month: string; ingredients: number; labor: number }> | undefined) ?? [];
                const prevSnap = costHistory.find((h) => h.month === prevMonth);
                if (!prevSnap || prevRev <= 0 || thisRev <= 0 || primeRate == null) return {};
                const prevPrime = ((prevSnap.ingredients + prevSnap.labor) / prevRev) * 100;
                return {
                  prevPrimeRate: Math.round(prevPrime * 10) / 10,
                  primeRateDeltaPct: Math.round((primeRate - prevPrime) * 10) / 10,
                };
              })(),
              businessHealthScore: d.businessHealthScore as "healthy" | "caution" | "danger" | "unknown" | undefined,

              // 운영
              employeeCount: employees.length,
              lowStockItems: lowStockItems.length > 0 ? lowStockItems : undefined,
              upcomingFixedExpenses: upcomingFixedExpenses.length > 0 ? upcomingFixedExpenses : undefined,

              // 마케팅 비용 (이번 달 분해에 marketing 카테고리로 이미 포함됨)
              totalMarketingSpend: costs.marketing,

              // ── 사장님이 아직 안 써본 핵심 기능 — AI 가 답변 시 자연스럽게 안내 가능 ──
              unusedFeatures: (() => {
                const list: string[] = [];
                if (entries.length === 0) list.push("매출입력");
                if (employees.length === 0) list.push("직원등록");
                if (inventory.length === 0 && ["food", "cafe-dessert", "retail", "beauty", "pet"].includes(d.industryCategoryId ?? "")) list.push("재고등록");
                if ((d.products as Array<unknown> | undefined ?? []).length === 0 && ["food", "cafe-dessert", "retail", "online-digital"].includes(d.industryCategoryId ?? "")) {
                  list.push(d.industryCategoryId === "online-digital" ? "상품등록" : "메뉴등록");
                }
                if ((d.fixedExpenses as Array<unknown> | undefined ?? []).length === 0) list.push("고정비등록");
                // 고객인터뷰는 별도 zustand store — IIFE 안에선 hook 호출 불가, 생략
                return list.length > 0 ? list : undefined;
              })(),

              // 프랜차이즈
              franchiseBrandId: d.selectedFranchiseBrandId ?? undefined,
            }}
          />
        );
      })()}
    </main>
    </DashboardProvider>
  );
}

// 스타일 상수 → ./app-shell-styles.ts 로 분리됨
