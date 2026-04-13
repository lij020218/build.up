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
} from "@build-up/shared";
import type { AiStructuredResponse, ContractAnalysisResult } from "@build-up/ai";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { fetchLiveSupportPrograms } from "./lib/services/live-data";
import { DashboardProvider, type DashboardContextValue } from "./lib/contexts/DashboardContext";
import { AuroraBackground } from "../components/ui/aurora-background";
import { RoadmapSurface } from "./lib/components/surfaces/RoadmapSurface";
import { AnalyticsSurface } from "./lib/components/surfaces/AnalyticsSurface";
import { FranchiseView } from "./lib/components/surfaces/FranchiseView";
import { ProfileView } from "./lib/components/surfaces/ProfileView";
import { GuidesView } from "./lib/components/surfaces/GuidesView";
import { HomeView } from "./lib/components/surfaces/HomeView";
import { CurrentStageView } from "./lib/components/surfaces/CurrentStageView";
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
import TaxCalendarCard from "./lib/components/TaxCalendarCard";
import HealthDiagnosisCard from "./lib/components/HealthDiagnosisCard";
import LifecycleCard from "./lib/components/LifecycleCard";
import OperationalDashboard from "./lib/components/dashboard/OperationalDashboard";
import RoleSelectionScreen from "./lib/components/RoleSelectionScreen";
import AIRoadmapWizard from "./lib/components/AIRoadmapWizard";
import { calculateHealthMetrics, forecastSales } from "@build-up/shared";
import type { BusinessHealthMetrics, SalesForecast } from "@build-up/shared";
import { useDashboard, type InventoryItem, type InvForm, type Employee, type DeliveryPlatform, type Product, type TaxSettings, type FixedExpense, type Member, type DailyEntry, type MonthlyCosts, type UnifiedProduct, type ServiceMenuItem } from "./lib/useDashboard";

export default function StarterStageDemo({
  surface = "home",
  showSurfaceNav = true
}: {
  surface?: DashboardSurface;
  showSurfaceNav?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [welcomed, setWelcomed] = useState(() => {
    try { return localStorage.getItem("__buildup_welcomed") === "true"; } catch { return false; }
  });
  useEffect(() => { setMounted(true); }, []);

  // ── Hoisted from conditional render blocks to prevent hook ordering issues ──
  const [filterCat, setFilterCat] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [competitorResults, setCompetitorResults] = useState<{ totalCount: number; places: Array<{ name: string; address: string; phone: string; url: string }> } | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [bpLoading, setBpLoading] = useState(false);
  const [bpSections, setBpSections] = useState<Array<{ title: string; content: string }> | null>(null);
  const [bpSummary, setBpSummary] = useState<string | null>(null);
  const [bpError, setBpError] = useState<string | null>(null);
  const [bpExpandedIdx, setBpExpandedIdx] = useState<number | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("buildup_onboarding_dismissed") === "true";
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

  const shouldShowExistingOnboarding = showExistingOnboarding && !shouldShowAuth && !shouldShowRoleSelection;
  const shouldShowAIRoadmap = showAIRoadmapWizard && !shouldShowAuth && !shouldShowRoleSelection;
  // 데이터 로드 완료 후 fresh account면 항상 온보딩 선택 화면 표시 (리셋 후에도)
  // onboardingDismissed가 true이면 isFreshAccount 자동 표시를 억제 (직접 로드맵 선택 시)
  const shouldShowOnboardingChoice = (showOnboardingChoice || (isFreshAccount && persistenceReady && !businessLaunched && !onboardingDismissed)) && !shouldShowAuth && !shouldShowRoleSelection && !shouldShowExistingOnboarding && !shouldShowAIRoadmap;

  // NOTE: No early returns here — useEffect below must always execute.
  // All conditional returns are placed AFTER the useEffect.

  if (false as boolean) { // DEAD CODE: onboarding choice moved after useEffect
    const ko = language === "ko";
    void ko;
    return (
      <main style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, rgba(29,53,87,0.08), transparent 32%), #f7f6f3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}>
        <div style={{ maxWidth: "860px", width: "100%", textAlign: "center" }}>
          <div style={{
            fontSize: "13px", fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: "16px",
            animation: "fadeUp 0.7s cubic-bezier(0.25,0.46,0.45,0.94) 0.1s both",
          }}>build.up</div>
          <div style={{
            fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 700,
            letterSpacing: "-0.035em", lineHeight: 1.08, color: "var(--text)", marginBottom: "14px",
            animation: "fadeUp 0.8s cubic-bezier(0.25,0.46,0.45,0.94) 0.25s both",
          }}>
            {ko ? "어떤 상황에 계신가요?" : "Where are you in your journey?"}
          </div>
          <div style={{
            fontSize: "17px", lineHeight: 1.6, color: "var(--muted)", marginBottom: "48px",
            animation: "fadeUp 0.7s cubic-bezier(0.25,0.46,0.45,0.94) 0.4s both",
          }}>
            {ko ? "맞춤형 경험을 제공하기 위해 알려주세요." : "Help us personalize your experience."}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Card 1: 신규 창업 */}
            <button type="button" onClick={() => setShowOnboardingChoice(false)} style={{
              borderRadius: "28px",
              border: "1px solid rgba(29,53,87,0.06)",
              background: "linear-gradient(160deg, rgba(232,243,255,0.8) 0%, rgba(245,249,255,0.95) 50%, rgba(255,255,255,0.98) 100%)",
              boxShadow: "0 8px 30px rgba(29,53,87,0.06)",
              backdropFilter: "blur(16px)",
              padding: "36px 32px 32px",
              cursor: "pointer",
              textAlign: "left" as const,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              animation: "fadeUp 0.8s cubic-bezier(0.25,0.46,0.45,0.94) 0.55s both",
              display: "flex",
              flexDirection: "column" as const,
              gap: "0",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(29,53,87,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(29,53,87,0.06)"; }}
            >
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px", marginBottom: "20px",
                background: "linear-gradient(135deg, #e0edff 0%, #c9ddfb 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b7ddd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 680, color: "var(--text)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
                {ko ? "창업을 준비하고 있어요" : "I'm preparing to start"}
              </div>
              <div style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--muted)", marginBottom: "16px" }}>
                {ko
                  ? "업종 선택부터 개업까지, 단계별 로드맵으로 안내합니다. 재무 시뮬레이션, AI 계약서 분석, 상권 추천까지 모두 포함되어 있어요."
                  : "Guided from industry selection to grand opening. Includes financial simulation, AI contract analysis, and market recommendations."}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "14px", fontWeight: 600, color: "#3b7ddd",
              }}>
                {ko ? "로드맵 시작하기" : "Start roadmap"}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </div>
            </button>

            {/* Card 2: 기존 사업자 */}
            <button type="button" onClick={() => { setShowOnboardingChoice(false); setShowExistingOnboarding(true); }} style={{
              borderRadius: "28px",
              border: "1px solid rgba(45,106,79,0.06)",
              background: "linear-gradient(160deg, rgba(232,250,241,0.8) 0%, rgba(243,252,247,0.95) 50%, rgba(255,255,255,0.98) 100%)",
              boxShadow: "0 8px 30px rgba(45,106,79,0.06)",
              backdropFilter: "blur(16px)",
              padding: "36px 32px 32px",
              cursor: "pointer",
              textAlign: "left" as const,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              animation: "fadeUp 0.8s cubic-bezier(0.25,0.46,0.45,0.94) 0.7s both",
              display: "flex",
              flexDirection: "column" as const,
              gap: "0",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(45,106,79,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(45,106,79,0.06)"; }}
            >
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px", marginBottom: "20px",
                background: "linear-gradient(135deg, #ddf5e9 0%, #c4ebd6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d8659" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V8l9-5 9 5v13" />
                  <path d="M9 21v-6h6v6" />
                  <path d="M3 8h18" />
                </svg>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 680, color: "var(--text)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
                {ko ? "이미 가게를 운영하고 있어요" : "I already run a business"}
              </div>
              <div style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--muted)", marginBottom: "16px" }}>
                {ko
                  ? "간단한 설정만 하면 매출 분석, 비용 관리, 세금 달력, 재고 알림을 바로 사용할 수 있어요."
                  : "Quick setup to unlock sales analytics, cost tracking, tax calendar, and inventory alerts."}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "14px", fontWeight: 600, color: "#2d8659",
              }}>
                {ko ? "가게 등록하기" : "Register my store"}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const showOperationalHero = !(activeSurface === "home" && mounted && businessLaunched);

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
    const ko = language === "ko";
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg, #f7f6f3)" }}>
        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" as const }}>
          <div style={{
            width: "64px", height: "64px", margin: "0 auto 24px", borderRadius: "20px",
            background: "linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1.2s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 720, letterSpacing: "-0.03em", color: "#0f172a", margin: "0 0 8px" }}>
            {ko ? "모든 진행 과정을 초기화하는 중입니다" : "Resetting all progress"}
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(15,23,42,0.45)", margin: "0 0 32px", lineHeight: 1.5 }}>
            {ko ? "서버 데이터를 정리하고 있습니다. 잠시만 기다려주세요." : "Cleaning up server data. Please wait a moment."}
          </p>
          {/* 프로그레스 바 */}
          <div style={{ width: "100%", height: "6px", borderRadius: "3px", background: "rgba(15,23,42,0.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "3px",
              background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
              width: `${resetProgress}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.35)", marginTop: "10px" }}>
            {resetProgress < 40
              ? (ko ? "로컬 데이터 정리 중..." : "Clearing local data...")
              : resetProgress < 70
                ? (ko ? "서버 데이터 초기화 중..." : "Resetting server data...")
                : resetProgress < 100
                  ? (ko ? "마무리 중..." : "Finishing up...")
                  : (ko ? "완료!" : "Done!")}
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }
  if (shouldShowOnboardingChoice && !welcomed) {
    return <WelcomeOnboarding language={language} onComplete={() => setWelcomed(true)} />;
  }
  if (shouldShowOnboardingChoice) {
    const ko = language === "ko";
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg, #f7f6f3)" }}>
        <div style={{ width: "100%", maxWidth: "1020px" }}>
          <div style={{ textAlign: "center" as const, marginBottom: "40px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--primary, #1d3557)", marginBottom: "14px" }}>build.up</div>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 720, letterSpacing: "-0.04em", color: "var(--text, #0f172a)", margin: "0 0 10px", lineHeight: 1.1 }}>{ko ? "어떤 상태에서 시작하시나요?" : "Where are you starting from?"}</h1>
            <p style={{ fontSize: "16px", color: "var(--muted, #5b616e)", lineHeight: 1.6, margin: 0 }}>{ko ? "상황에 맞는 화면을 준비합니다" : "We'll set up the right experience for you"}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {/* Card 1: 직접 로드맵 — 파란색 */}
            <button type="button" onClick={() => { setOnboardingDismissed(true); localStorage.setItem("buildup_onboarding_dismissed", "true"); setShowOnboardingChoice(false); navigateToSurface("current"); }} style={{
              borderRadius: "28px", border: "1px solid rgba(29,53,87,0.06)",
              background: "linear-gradient(160deg, rgba(232,243,255,0.8) 0%, rgba(245,249,255,0.95) 50%, rgba(255,255,255,0.98) 100%)",
              boxShadow: "0 8px 30px rgba(29,53,87,0.06)", backdropFilter: "blur(16px)",
              padding: "36px 28px 32px", cursor: "pointer", textAlign: "left" as const,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              display: "flex", flexDirection: "column" as const,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(29,53,87,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(29,53,87,0.06)"; }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", marginBottom: "20px", background: "linear-gradient(135deg, #e0edff 0%, #c9ddfb 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b7ddd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 680, color: "var(--text, #0f172a)", marginBottom: "8px", letterSpacing: "-0.02em" }}>{ko ? "직접 로드맵 진행" : "Manual Roadmap"}</div>
              <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted, #5b616e)", marginBottom: "16px", flex: 1 }}>{ko ? "업종 선택부터 개업까지, 단계별 로드맵으로 안내합니다." : "Guided from industry selection to opening day."}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600, color: "#3b7ddd" }}>
                {ko ? "로드맵 시작하기" : "Start roadmap"} <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
              </div>
            </button>

            {/* Card 2: AI 자동 — 보라색 */}
            <button type="button" onClick={() => { setShowOnboardingChoice(false); setShowAIRoadmapWizard(true); }} style={{
              borderRadius: "28px", border: "1px solid rgba(99,61,225,0.08)",
              background: "linear-gradient(160deg, rgba(237,233,254,0.8) 0%, rgba(247,244,255,0.95) 50%, rgba(255,255,255,0.98) 100%)",
              boxShadow: "0 8px 30px rgba(99,61,225,0.08)", backdropFilter: "blur(16px)",
              padding: "36px 28px 32px", cursor: "pointer", textAlign: "left" as const,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              display: "flex", flexDirection: "column" as const,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(99,61,225,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(99,61,225,0.08)"; }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", marginBottom: "20px", background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z" />
                </svg>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 680, color: "var(--text, #0f172a)", marginBottom: "8px", letterSpacing: "-0.02em" }}>{ko ? "AI 자동 로드맵" : "AI Auto Roadmap"}</div>
              <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted, #5b616e)", marginBottom: "16px", flex: 1 }}>{ko ? "아이디어만 입력하면 AI가 예산, 상권, 공급업체까지 맞춤 설계합니다." : "Describe your idea and AI builds your entire plan."}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600, color: "#7c3aed" }}>
                {ko ? "AI로 시작하기" : "Start with AI"} <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
              </div>
            </button>

            {/* Card 3: 기존 운영 — 초록색 */}
            <button type="button" onClick={() => { setShowOnboardingChoice(false); setShowExistingOnboarding(true); }} style={{
              borderRadius: "28px", border: "1px solid rgba(45,106,79,0.06)",
              background: "linear-gradient(160deg, rgba(232,250,241,0.8) 0%, rgba(243,252,247,0.95) 50%, rgba(255,255,255,0.98) 100%)",
              boxShadow: "0 8px 30px rgba(45,106,79,0.06)", backdropFilter: "blur(16px)",
              padding: "36px 28px 32px", cursor: "pointer", textAlign: "left" as const,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              display: "flex", flexDirection: "column" as const,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(45,106,79,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(45,106,79,0.06)"; }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", marginBottom: "20px", background: "linear-gradient(135deg, #ddf5e9 0%, #c4ebd6 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d8659" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" /><path d="M3 8h18" />
                </svg>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 680, color: "var(--text, #0f172a)", marginBottom: "8px", letterSpacing: "-0.02em" }}>{ko ? "이미 운영 중이에요" : "Already Running"}</div>
              <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted, #5b616e)", marginBottom: "16px", flex: 1 }}>{ko ? "기존 가게 정보를 등록하면 바로 운영 대시보드를 사용할 수 있습니다." : "Register your store and start using the dashboard right away."}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600, color: "#2d8659" }}>
                {ko ? "가게 등록하기" : "Register store"} <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <DashboardProvider value={_ctxValue}>
    <AuroraBackground style={{ minHeight: "100vh", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} showRadialGradient />
    <main style={{ ...(showOperationalHero ? styles.shell : operationalShell), position: "relative", zIndex: 1 }}>
      {showOperationalHero ? (
      <section style={styles.hero}>
        <div style={styles.eyebrow}>build.up</div>
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

      {/* ━━━ Build.UP 로고 — 네비게이션 바 위 ━━━ */}
      {showSurfaceNav && (
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
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            letterSpacing: "-0.02em",
          }}>b</span>
        </div>
        <span style={{
          fontSize: "16px", fontWeight: 750, color: "#0f172a",
          letterSpacing: "-0.03em",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}>
          Build<span style={{ color: "#1d3557" }}>.</span><span style={{ fontWeight: 800 }}>UP</span>
        </span>
      </div>
      )}

      {showSurfaceNav ? (
      <section style={showOperationalHero ? styles.section : operationalNavSection}>
        <div style={{ ...styles.surfaceNav, ...(showOperationalHero ? {} : operationalSurfaceNav) }}>
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

      {activeSurface === "profile" && !isFreshAccount ? (
        <ProfileView />
      ) : null}


      {activeSurface === "guides" && !isFreshAccount && !isGuideStage ? (
        <GuidesView />
      ) : null}


      {activeSurface === "analytics" ? (
        <CardErrorBoundary cardLabel="내 가게">
          <AnalyticsSurface />
        </CardErrorBoundary>
      ) : null}


      {activeSurface === "roadmap" && !isFreshAccount ? (
        <RoadmapSurface />
      ) : null}
    </main>
    </DashboardProvider>
  );
}

/* Roadmap surface → RoadmapSurface.tsx */
const operationalShell: React.CSSProperties = {
  width: "min(1440px, calc(100vw - 32px))",
  margin: "0 auto",
  padding: "92px 0 80px",
};

const operationalNavSection: React.CSSProperties = {
  marginTop: "0",
  marginBottom: "18px",
};

const operationalSurfaceNav: React.CSSProperties = {
  maxWidth: "calc(100% - 220px)",
};
