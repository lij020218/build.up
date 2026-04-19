"use client";

import type { MutableRefObject } from "react";
import {
  buildRoadmapState,
  completeCurrentStage,
  getIndustryCategoryIdByOptionId,
  getStarterLocationOptions,
  loadBusinessProfile,
  saveRoadmapState,
  saveStoreData,
  starterRoadmap,
  upsertStageDecision,
  getFranchiseBrandsForSubIndustry,
  getFranchiseBrandsForCategory,
  type RecommendationItem,
  type WorkflowDecisionMap,
} from "@build-up/shared";
import {
  useFinanceStore,
  useAiStore,
  useProfileStore,
  useRoadmapStore,
  useOnboardingStore,
} from "../stores";
import { supabase } from "../../../lib/supabase";
import type { DashboardDeps } from "../types";
import { buildTransitionNotice, cloneStarterTaskMap, baseRoadmap } from "../helpers";
import {
  clearLocalUserData,
  resetLocalState,
  applyStoreData,
  collectStoreData,
} from "./usePersistence";

// Re-export pure helpers so callers have a single import point
export { clearLocalUserData, resetLocalState, applyStoreData, collectStoreData };

// ── Types ──────────────────────────────────────────────────────────────────────

export type SelectionHandlersDeps = DashboardDeps & {
  /** Computed: active industry category id (derived from decisions / profile / store) */
  industryCategoryId: string;
  /** Computed: resolved final selected market object (may be null) */
  finalSelectedMarket: RecommendationItem | null;
  /** Current location selection mode */
  locationMode: "recommended" | "direct";
  /** Ref that tracks the ongoing autosave timer (needed to cancel during resetDemo) */
  autosaveTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSelectionHandlers(deps: SelectionHandlersDeps) {
  const { language, copy, router, industryCategoryId, finalSelectedMarket, autosaveTimerRef } = deps;

  // ── Profile store ──────────────────────────────────────────────────────────
  const {
    selectedIndustryId,
    selectedFranchiseBrandId,
    startupType, setStartupType,
    showFranchisePicker, setShowFranchisePicker,
    selectedBusinessModelId,
    selectedBudget,
    selectedOpenDate,
    selectedLocationId,
    preferredRegionInput,
    setSelectedIndustryId,
    setSelectedIndustryCategoryId,
    setSelectedBusinessModelId,
    setSelectedBudget,
    setBudgetInputText,
    setSelectedOpenDate,
    setSelectedLocationId,
    setPreferredRegionInput,
    setLocationMode,
    setProfile,
    setBusinessLaunched,
    setBusinessLaunchedDate,
  } = useProfileStore();

  // ── Roadmap store ──────────────────────────────────────────────────────────
  const {
    decisions, setDecisions,
    roadmap, setRoadmap,
    taskMap, setTaskMap,
    setViewingStageId,
    customMarketName,
    customMarketReason,
    setRecommendedMarkets,
    setCustomMarketName,
    setCustomMarketReason,
    setManualMarketEvaluation,
    setManualAlternative,
    setSoftOpenStep,
    setLocationOptions,
    setLocationSourceLabel,
  } = useRoadmapStore();

  // ── Finance store ──────────────────────────────────────────────────────────
  const {
    setShowFinancePanel,
    setFinanceCapitalText,
    setFinanceMonthlyRentText,
    setFinanceLaborText,
    setFinanceRevenueText,
    setFinanceMarketStyle,
    setFinanceRentBand,
    setFinanceStatus,
    setFinanceError,
    setFinanceResult,
    setFinanceInterpretation,
  } = useFinanceStore();

  // ── Onboarding store ───────────────────────────────────────────────────────
  const {
    setIsResetting,
    setResetProgress,
    setPersistenceLabel,
    setPersistenceReady,
    setLastUnlocked,
    setTransitionNotice,
    setShowOnboardingChoice,
  } = useOnboardingStore();

  // ── AI store ───────────────────────────────────────────────────────────────
  // (needed for resetDemo: reset selected guide / contract fields stored in ai-store)
  // We use getState() in resetDemo to avoid reactive subscription overhead

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleIndustryContinue = () => {
    if (!selectedIndustryId) return;

    const nextDecisions = upsertStageDecision(decisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: selectedIndustryId,
      inputs: {
        subIndustryId: selectedIndustryId,
        categoryId: getIndustryCategoryIdByOptionId(selectedIndustryId) ?? "",
      },
      completedAt: new Date().toISOString(),
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleBusinessModelContinue = () => {
    if (!selectedBusinessModelId) return;

    const nextDecisions = upsertStageDecision(decisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: selectedBusinessModelId,
      selectedOptionIds: [selectedBusinessModelId],
      completedAt: new Date().toISOString(),
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
      const brands = (() => {
        const sub = selectedIndustryId
          ? getFranchiseBrandsForSubIndustry(selectedIndustryId)
          : [];
        return sub.length > 0 ? sub : getFranchiseBrandsForCategory(industryCategoryId);
      })();
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
        ...(startupType === "franchise" && selectedFranchiseBrandId
          ? { franchiseBrandId: selectedFranchiseBrandId }
          : {}),
      },
      completedAt: new Date().toISOString(),
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
    if (!selectedBudget || !selectedOpenDate) return;

    const nextDecisions = upsertStageDecision(decisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: {
        capital: selectedBudget,
        targetOpenDate: selectedOpenDate,
      },
      completedAt: new Date().toISOString(),
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleLocationContinue = () => {
    if (!selectedLocationId) return;

    const nextDecisions = upsertStageDecision(decisions, "location-candidates", {
      stageId: "location-candidates",
      selectedPrimaryOptionId: selectedLocationId,
      selectedOptionIds: [selectedLocationId],
      inputs: {
        preferredRegion: preferredRegionInput,
        customMarketName,
        customMarketReason,
        selectionMode: deps.locationMode,
        finalMarketTitle: finalSelectedMarket?.title ?? "",
      },
      completedAt: new Date().toISOString(),
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

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
            : baseRoadmap.roadmapId,
      },
      nextDecisions,
      nextTasks,
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

    // AI store fields reset via getState() (same pattern as useDashboard)
    const ai = useAiStore.getState();
    ai.setSelectedContractTaskId(undefined);
    ai.setContractText("");
    ai.setContractAnalysisStatus("idle");
    ai.setContractAnalysisError("");
    ai.setContractAnalysis(null);
    ai.setSelectedGuideSectionKey(undefined);
    ai.setGuideQuestion("");
    ai.setGuideQaStatus("idle");
    ai.setGuideQaError("");
    ai.setGuideAnswer(null);

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

    // Onboarding flags (use getState() to avoid subscribing as reactive)
    useOnboardingStore.getState().setShowProfileDetails(false);
    setStartupType(undefined);
    setLastUnlocked([]);
    setTransitionNotice(null);
    setProfile(null);
    setBusinessLaunched(false);
    setBusinessLaunchedDate(null);
    useOnboardingStore.getState().setShowExistingOnboarding(false);
    useOnboardingStore.getState().setShowAIRoadmapWizard(false);
    try {
      localStorage.removeItem("buildup_onboarding_dismissed");
    } catch { /* ignore */ }

    // Step 2: business_profiles 초기화
    setResetProgress(40);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("business_profiles")
          .update({
            industry_category_id: null,
            sub_industry_id: null,
            startup_type: null,
            business_model_id: null,
            capital: null,
            target_open_date: null,
            preferred_regions: null,
          } as never)
          .eq("user_id", user.id);
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
          monthlyCosts: { ingredients: 0, labor: 0, rent: 0, utilities: 0, sga: 0, marketing: 0, other: 0, interest: 0 },
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
      setPersistenceLabel(
        language === "ko" ? "초기화가 서버에 적용되었습니다." : "Reset applied to server.",
      );
      setPersistenceReady(true);
      void loadBusinessProfile(supabase)
        .then((p) => {
          if (p) setProfile(p);
        })
        .catch(() => {});
    } catch (error) {
      setPersistenceReady(true);
      setPersistenceLabel(
        error instanceof Error
          ? `${language === "ko" ? "초기화 저장 실패" : "Reset save failed"}: ${error.message}`
          : language === "ko"
            ? "초기화 저장 실패"
            : "Reset save failed",
      );
    }

    // Step 4: 완료 → 온보딩 화면으로 전환
    setResetProgress(100);
    await new Promise((r) => setTimeout(r, 600));
    setShowOnboardingChoice(true);
    setIsResetting(false);
    setResetProgress(0);
  };

  return {
    handleIndustryContinue,
    handleBusinessModelContinue,
    handleStartupTypeContinue,
    handleBudgetContinue,
    handleLocationContinue,
    handleSignOut,
    resetDemo,
  };
}
