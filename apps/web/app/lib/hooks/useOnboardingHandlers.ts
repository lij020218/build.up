"use client";

import { useRef } from "react";
import {
  buildRoadmapState,
  loadBusinessProfile,
  saveRoadmapState,
  saveStoreData,
  upsertStageDecision,
  type UserStoreData,
} from "@build-up/shared";
import {
  useProfileStore,
  useRoadmapStore,
  useOnboardingStore,
  useFinanceStore,
  useOperationsStore,
} from "../stores";
import { supabase } from "../../../lib/supabase";
import type { DashboardDeps, DashboardSurface } from "../types";
import { SURFACE_HREFS } from "../constants";

/** useOnboardingHandlers 전용 추가 deps */
export type OnboardingHandlersDeps = DashboardDeps & {
  collectStoreData: () => Partial<UserStoreData>;
  fetchAiActions: () => Promise<void>;
};

export function useOnboardingHandlers(deps: OnboardingHandlersDeps) {
  const { router, collectStoreData, fetchAiActions } = deps;

  // ── Profile store ──
  const {
    setSelectedIndustryId,
    setSelectedIndustryCategoryId,
    setSelectedBusinessModelId,
    setSelectedBudget,
    setBudgetInputText,
    setPreferredRegionInput,
    setStartupType,
    setSelectedFranchiseBrandId,
    setStoreName,
    setCpaDecision,
    setSelectedInteriorConcept,
    setProfile,
    setBusinessLaunched,
    setBusinessLaunchedDate,
  } = useProfileStore();

  // ── Roadmap store ──
  const {
    decisions,
    setDecisions,
    roadmap,
    setRoadmap,
    taskMap,
    setTaskMap,
    setVendorSelections,
    setVendorCustomInputs,
    setOpsSelections,
  } = useRoadmapStore();

  // ── Finance store ──
  const {
    setMonthlyCosts,
    setCostIngredientsText,
    setCostLaborText,
    setCostRentText,
    setCostUtilitiesText,
    setCostOtherText,
  } = useFinanceStore();

  // ── Onboarding store ──
  const {
    setShowExistingOnboarding,
    setShowOnboardingChoice,
    setShowAIRoadmapWizard,
    setPersistenceReady,
  } = useOnboardingStore();

  // ── Tax settings (operations store) ──
  const { setTaxSettings } = useOperationsStore();

  const navigateToSurface = (nextSurface: DashboardSurface) => {
    router.push(SURFACE_HREFS[nextSurface]);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // handleExistingBusinessComplete
  // ──────────────────────────────────────────────────────────────────────────
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
      const storeDataToSave = collectStoreData();
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

  // ──────────────────────────────────────────────────────────────────────────
  // handleAIRoadmapComplete
  // ──────────────────────────────────────────────────────────────────────────
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
      const storeData = collectStoreData();
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

  // ──────────────────────────────────────────────────────────────────────────
  // scheduleAiRefresh — AI 액션 갱신 debounce (데이터 변경 후 5초 뒤 자동 갱신)
  // ──────────────────────────────────────────────────────────────────────────
  const aiRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAiRefresh = () => {
    const { businessLaunched, storeName } = useProfileStore.getState();
    if (!businessLaunched || !storeName) return; // 아직 개업 전이면 무시
    if (aiRefreshTimerRef.current) clearTimeout(aiRefreshTimerRef.current);
    aiRefreshTimerRef.current = setTimeout(() => {
      void fetchAiActions();
    }, 5000);
  };

  return { handleExistingBusinessComplete, handleAIRoadmapComplete, scheduleAiRefresh };
}
