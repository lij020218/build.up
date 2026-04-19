"use client";

import { useEffect, useRef } from "react";
import {
  bootstrapAccountWorkspace,
  getCurrentUser,
  getIndustryCategoryIdByOptionId,
  getFranchiseBrandById,
  getUiCopy,
  loadBusinessProfile,
  loadStoreData,
  saveRoadmapState,
  saveStoreData,
  starterTaskMap,
  type UserStoreData,
  type WorkflowTaskMap,
} from "@build-up/shared";
import {
  useOperationsStore,
  useFinanceStore,
  useAiStore,
  useProfileStore,
  useRoadmapStore,
  useOnboardingStore,
} from "../stores";
import type { AiRoadmapSnapshot } from "../stores/roadmap-store";
import type { DailyEntry, MonthlyCosts, CostSnapshot } from "../stores/finance-store";
import type {
  InventoryItem, Employee, DeliveryPlatform, Product,
  UnifiedProduct, ServiceMenuItem, TaxSettings, FixedExpense, Member,
} from "../stores/operations-store";
import { supabase } from "../../../lib/supabase";
import type { DashboardDeps, DashboardSurface } from "../types";

// ─── localStorage keys cleaned on user switch / sign-out ───
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

// ─── Pure helpers (no hooks, use getState()) ───

/** Remove all user-specific localStorage keys */
export function clearLocalUserData(): void {
  try {
    LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    // Zustand persist 키도 정리
    ["buildup-operations", "buildup-finance", "buildup-profile", "buildup-roadmap"].forEach((k) =>
      localStorage.removeItem(k),
    );
  } catch {
    /* ignore */
  }
}

/** Reset all 6 Zustand stores to their initial values */
export function resetLocalState(): void {
  useOperationsStore.getState().resetAll();
  useFinanceStore.getState().resetAll();
  useProfileStore.getState().resetAll();
  useRoadmapStore.getState().resetAll();
  useAiStore.getState().resetAll();
  useOnboardingStore.getState().resetAll();
}

/** Apply Supabase-loaded store data to Zustand stores (persist auto-syncs to localStorage) */
export function applyStoreData(data: UserStoreData): void {
  const prof = useProfileStore.getState();
  const ops = useOperationsStore.getState();
  const fin = useFinanceStore.getState();
  const rm = useRoadmapStore.getState();

  if (data.storeName) prof.setStoreName(data.storeName);
  if (data.businessLaunched) prof.setBusinessLaunched(true);
  if (data.businessLaunchedDate) prof.setBusinessLaunchedDate(data.businessLaunchedDate);
  if (data.cpaDecision === "cpa" || data.cpaDecision === "self") prof.setCpaDecision(data.cpaDecision);
  if (data.taxSettings?.vatType) ops.setTaxSettings(data.taxSettings as TaxSettings);
  if (data.monthlyCosts && typeof data.monthlyCosts === "object") {
    const mc = data.monthlyCosts;
    fin.setMonthlyCosts({ ...mc, sga: (mc as Record<string, number>).sga ?? 0, marketing: (mc as Record<string, number>).marketing ?? 0, interest: (mc as Record<string, number>).interest ?? 0 });
    fin.setCostIngredientsText(mc.ingredients ? String(Math.round(mc.ingredients / 10000)) : "");
    fin.setCostLaborText(mc.labor ? String(Math.round(mc.labor / 10000)) : "");
    fin.setCostRentText(mc.rent ? String(Math.round(mc.rent / 10000)) : "");
    fin.setCostUtilitiesText(mc.utilities ? String(Math.round(mc.utilities / 10000)) : "");
    fin.setCostOtherText(mc.other ? String(Math.round(mc.other / 10000)) : "");
    const mcAny = mc as Record<string, number>;
    if (mcAny.sga) fin.setCostSgaText(String(Math.round(mcAny.sga / 10000)));
    if (mcAny.marketing) fin.setCostMarketingText(String(Math.round(mcAny.marketing / 10000)));
    if (mcAny.interest) fin.setCostInterestText(String(Math.round(mcAny.interest / 10000)));
  }
  if (data.dailyEntries?.length) fin.setDailyEntries(data.dailyEntries as DailyEntry[]);
  if (data.inventoryItems?.length) ops.setInventory(data.inventoryItems as InventoryItem[]);
  if (data.employees?.length) ops.setEmployees(data.employees as Employee[]);
  if (data.fixedExpenses?.length) ops.setFixedExpenses(data.fixedExpenses as FixedExpense[]);
  if (data.deliveryPlatforms?.length) ops.setDeliveryPlatforms(data.deliveryPlatforms as DeliveryPlatform[]);
  if (data.monthlyDeliverySales && Object.keys(data.monthlyDeliverySales).length) ops.setMonthlyDeliverySales(data.monthlyDeliverySales);
  if (data.products?.length) ops.setProducts(data.products as Product[]);
  if (data.unifiedProducts?.length) ops.setUnifiedProducts(data.unifiedProducts as UnifiedProduct[]);
  if (data.serviceMenuItems?.length) ops.setServiceMenuItems(data.serviceMenuItems as ServiceMenuItem[]);
  if (data.members?.length) ops.setMembers(data.members as Member[]);
  if (data.vendorSelections && Object.keys(data.vendorSelections).length) rm.setVendorSelections(data.vendorSelections);
  if (data.vendorCustomInputs && Object.keys(data.vendorCustomInputs).length) rm.setVendorCustomInputs(data.vendorCustomInputs);
  if (data.opsSelections && Object.keys(data.opsSelections).length) rm.setOpsSelections(data.opsSelections);
  if (data.opsPosChecks && Object.keys(data.opsPosChecks).length) rm.setOpsPosChecks(data.opsPosChecks);
  if (data.softOpenChecks && Object.keys(data.softOpenChecks).length) rm.setSoftOpenChecks(data.softOpenChecks);
  if (data.softOpenPricing) rm.setSoftOpenPricing(data.softOpenPricing);
  if (data.softOpenSkips && Object.keys(data.softOpenSkips).length) rm.setSoftOpenSkips(data.softOpenSkips);
  if (data.taxChecks && Object.keys(data.taxChecks).length) rm.setTaxChecks(data.taxChecks);
  if (data.loanChecks && Object.keys(data.loanChecks).length) rm.setLoanChecks(data.loanChecks);
  if (data.onlinePlatformSales && Object.keys(data.onlinePlatformSales).length) ops.setOnlinePlatformSales(data.onlinePlatformSales);
  if (data.onlineSelectedPlatforms?.length) ops.setOnlineSelectedPlatforms(data.onlineSelectedPlatforms);
  if (data.onlineSelectedCourier) ops.setOnlineSelectedCourier(data.onlineSelectedCourier);
  if (data.onlineMonthlyParcels) ops.setOnlineMonthlyParcels(data.onlineMonthlyParcels);
  if (data.costHistory?.length) fin.setCostHistory(data.costHistory as CostSnapshot[]);
  // AI 생성 결과 복원
  if (data.guideSelections && Object.keys(data.guideSelections).length) {
    rm.setGuideSelections(data.guideSelections);
  }
  if (data.aiRoadmapResult) {
    rm.setAiRoadmapResult(data.aiRoadmapResult as AiRoadmapSnapshot);
  }
  if (data.selectedInteriorConcept) {
    prof.setSelectedInteriorConcept(data.selectedInteriorConcept);
  }
  // 구독 관리 복원
  if (data.usesSubscriptions) prof.setUsesSubscriptions(true);
  if ((data.subscriptionPlans as unknown[])?.length) ops.setSubscriptionPlans(data.subscriptionPlans as never);
  if ((data.subscribers as unknown[])?.length) ops.setSubscribers(data.subscribers as never);
  // 마케팅 복원
  try {
    const { useMarketingStore } = require("../stores/marketing-store");
    const mkt = useMarketingStore.getState();
    if ((data.marketingCampaigns as unknown[])?.length) mkt.setCampaigns(data.marketingCampaigns);
    if (data.marketingMonthlyBudget && data.marketingMonthlyBudget > 0) mkt.setMonthlyBudget(data.marketingMonthlyBudget);
  } catch { /* marketing store not loaded yet */ }
}

/** Collect store data for Supabase sync (reads from Zustand stores, not localStorage) */
export function collectStoreData(): Partial<UserStoreData> {
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
  // AI 생성 결과 — Supabase 동기화 (localStorage 소실 방지)
  if (Object.keys(rm.guideSelections).length) r.guideSelections = rm.guideSelections;
  if (rm.aiRoadmapResult) r.aiRoadmapResult = rm.aiRoadmapResult;
  if (prof.selectedInteriorConcept) r.selectedInteriorConcept = prof.selectedInteriorConcept;
  // 구독 관리
  r.usesSubscriptions = prof.usesSubscriptions ?? false;
  if (ops.subscriptionPlans.length) r.subscriptionPlans = ops.subscriptionPlans;
  if (ops.subscribers.length) r.subscribers = ops.subscribers;
  // 마케팅
  try {
    const { useMarketingStore } = require("../stores/marketing-store");
    const mkt = useMarketingStore.getState();
    if (mkt.campaigns.length) r.marketingCampaigns = mkt.campaigns;
    if (mkt.monthlyBudget > 0) r.marketingMonthlyBudget = mkt.monthlyBudget;
  } catch { /* marketing store not loaded yet */ }
  return r;
}

// ─── Hook ───

export function usePersistence(deps: DashboardDeps, surface: DashboardSurface) {
  const { language, copy, searchParams } = deps;

  // Zustand selectors (reactive values for effects)
  const {
    persistenceReady, setPersistenceReady,
    setAuthLabel, setPersistenceLabel,
    setRequiresAuth, setAuthResolved,
    setShowOnboardingChoice, setShowMonthlyCostPrompt,
    setUserRole,
  } = useOnboardingStore();

  const {
    roadmap, setRoadmap,
    decisions, setDecisions,
    taskMap, setTaskMap,
  } = useRoadmapStore();

  const {
    setSelectedIndustryId, setSelectedIndustryCategoryId,
    setSelectedBusinessModelId,
    setSelectedBudget, setBudgetInputText,
    setSelectedOpenDate,
    setSelectedLocationId, setPreferredRegionInput, setLocationMode,
    setStartupType, setSelectedFranchiseBrandId,
    setStoreName,
    setProfile,
    businessLaunched, setBusinessLaunched, setBusinessLaunchedDate,
    setCpaDecision,
  } = useProfileStore();

  const { setShowFinancePanel, costHistory } = useFinanceStore();

  // Refs
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectLoadingRef = useRef(false);
  const storeDataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── connectAndLoad ──
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
        const profileRes = await supabase.from("business_profiles").select("*").eq("user_id", result.user.id).maybeSingle();
        const profileRole = (profileRes?.data as Record<string, unknown> | null)?.user_role as string | undefined;

        let memberRole: string | undefined;
        try {
          const memberRes = await supabase.from("store_members" as never).select("role, owner_user_id").eq("member_user_id", result.user.id).maybeSingle();
          memberRole = (memberRes?.data as Record<string, unknown> | null)?.role as string | undefined;
        } catch { /* table may not exist yet */ }

        if (profileRole === "staff" || profileRole === "manager" || profileRole === "owner") {
          resolvedRole = profileRole;
        } else if (memberRole === "staff" || memberRole === "manager") {
          resolvedRole = memberRole;
        } else {
          resolvedRole = "owner";
          void supabase.from("business_profiles").update({ user_role: "owner" } as never).eq("user_id", result.user.id).then(() => {});
        }
      } catch {
        resolvedRole = "owner";
      }
      setUserRole(resolvedRole);

      setDecisions(result.state.decisions);
      // Reconcile tasks: starterTaskMap is source of truth for task definitions.
      const loadedTasks = result.state.tasks;
      const roadmapStageIds = new Set(result.state.roadmap.stages.map((s: { stageId: string }) => s.stageId));
      const reconciled: WorkflowTaskMap = {};
      for (const [stageKey, starterTasks] of Object.entries(starterTaskMap)) {
        if (!roadmapStageIds.has(stageKey)) {
          if (loadedTasks[stageKey]) reconciled[stageKey] = loadedTasks[stageKey];
          continue;
        }
        const existingByKey = new Map((loadedTasks[stageKey] ?? []).map((t) => [t.taskId, t]));
        reconciled[stageKey] = starterTasks.map((starterTask) => {
          const saved = existingByKey.get(starterTask.taskId);
          return saved ? { ...starterTask, status: saved.status } : starterTask;
        });
      }
      setTaskMap(reconciled);
      setRoadmap(result.state.roadmap);
      /* IMPORTANT: setPersistenceReady MUST come AFTER state restoration. */
      setPersistenceReady(true);

      // 로드된 decisions에서 폼 상태 복원
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
          const localData = collectStoreData();
          if (Object.keys(localData).length > 0) {
            await saveStoreData(supabase, localData, result.user).catch(() => {});
          }
        }
      } catch {
        // Silent fail — localStorage already loaded via useState initializers
      }

      // Show onboarding choice when no industry has been selected yet
      const hasIndustry = loadedIndustryId || loadedProfile?.subIndustryId;
      const isLaunched = useProfileStore.getState().businessLaunched || businessLaunched;
      const dismissed = localStorage.getItem("buildup_onboarding_dismissed") === "true";
      if (!hasIndustry && !isLaunched && !dismissed) {
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
        error instanceof Error ? `${copy.home.loadFailed}: ${error.message}` : copy.home.loadFailed,
      );
      setAuthResolved(true);
    } finally {
      connectLoadingRef.current = false;
    }
  };

  // ── persistCurrentState ──
  const persistCurrentState = async () => {
    try {
      const result = await bootstrapAccountWorkspace(supabase);
      const user = result.user;
      const userLabel = user.email ?? copy.common.account;
      setAuthLabel(`${userLabel} · ${user.id.slice(0, 8)}`);

      const persisted = await saveRoadmapState(supabase, {
        roadmap,
        decisions,
        tasks: taskMap,
      });

      setRoadmap(persisted.roadmap);
      setProfile(await loadBusinessProfile(supabase, user));
      setPersistenceLabel(copy.home.savedToSupabase);
      setPersistenceReady(true);
    } catch (error) {
      setPersistenceLabel(
        error instanceof Error ? `${copy.home.saveFailed}: ${error.message}` : copy.home.saveFailed,
      );
      throw error;
    }
  };

  /** Zustand 스토어에서 읽어서 1초 debounce로 Supabase에 flush */
  const flushStoreData = () => {
    if (!useOnboardingStore.getState().persistenceReady) return;
    if (storeDataTimerRef.current) clearTimeout(storeDataTimerRef.current);
    storeDataTimerRef.current = setTimeout(() => {
      void saveStoreData(supabase, collectStoreData()).catch(() => {});
    }, 1000);
  };

  // ── Effects ──

  // 1. Initial connect on mount
  useEffect(() => {
    void connectAndLoad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Finance panel URL sync
  useEffect(() => {
    const activeSurface = surface;
    if (activeSurface === "guides" && searchParams.get("panel") === "finance") {
      setShowFinancePanel(true);
    }
  }, [surface, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Auth state change listener
  useEffect(() => {
    void getCurrentUser(supabase).then((user) => {
      if (!user || user.is_anonymous) {
        setRequiresAuth(true);
        setAuthResolved(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void connectAndLoad();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 4. Roadmap autosave with 800ms debounce
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
      const snap = roadmapSnapshotRef.current;
      void Promise.all([
        saveRoadmapState(supabase, {
          roadmap: snap.roadmap,
          decisions: snap.decisions,
          tasks: snap.taskMap,
        }),
        saveStoreData(supabase, collectStoreData()).catch(() => {}),
      ])
        .then(() => {
          setPersistenceLabel(copy.home.autosaved);
          void loadBusinessProfile(supabase)
            .then((p) => {
              if (p) setProfile(p);
            })
            .catch(() => {});
        })
        .catch((error) => {
          setPersistenceLabel(
            error instanceof Error
              ? `${copy.home.autosaveFailed}: ${error.message}`
              : copy.home.autosaveFailed,
          );
        });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [roadmap, decisions, taskMap, persistenceReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. Store data interval autosave to Supabase (5-second interval + beforeunload)
  const storeDataSnapshotRef = useRef<Partial<UserStoreData>>({});
  useEffect(() => {
    storeDataSnapshotRef.current = collectStoreData();
  });

  useEffect(() => {
    if (!persistenceReady) return;

    const interval = setInterval(() => {
      void saveStoreData(supabase, storeDataSnapshotRef.current).catch(() => {});
    }, 5000);

    const handleBeforeUnload = () => {
      try {
        const data = storeDataSnapshotRef.current;
        if (data && Object.keys(data).length > 0) {
          localStorage.setItem("__buildup_last_snapshot", JSON.stringify(data));
          localStorage.setItem("__buildup_last_snapshot_at", new Date().toISOString());
        }
      } catch {
        /* ignore — unload 중 에러 무시 */
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [persistenceReady]);

  return {
    connectAndLoad,
    persistCurrentState,
    flushStoreData,
    clearLocalUserData,
    resetLocalState,
    applyStoreData,
    collectStoreData,
  };
}
