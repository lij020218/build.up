"use client";

import { useEffect, useRef } from "react";
import {
  bootstrapAccountWorkspace,
  buildRoadmapState,
  getCurrentUser,
  getIndustryCategoryIdByOptionId,
  getFranchiseBrandById,
  getUiCopy,
  loadBusinessProfile,
  loadStoreData,
  saveRoadmapState,
  saveStoreData,
  starterTaskMap,
  upsertStageDecision,
  type UserStoreData,
  type WorkflowDecisionMap,
  type WorkflowTaskMap,
} from "@build-up/shared";
import { baseRoadmap } from "../helpers";
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
    // Zustand persist 키 — 모든 buildup-* store. 한 곳에 빠지면 hydration 시 stale 상태가 살아남는다.
    [
      "buildup-operations",
      "buildup-finance",
      "buildup-profile",
      "buildup-roadmap",
      "buildup-cashflow",
      "buildup-marketing",
      "buildup-agents",
      "buildup-customer-interviews",
      "buildup-time-log",
      "buildup-usage-stats-v1",
    ].forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/**
 * Hard wipe — `clearLocalUserData` 보다 더 공격적.
 * 데모 초기화 직전 (페이지 reload 직전) 호출해서 Zustand persist 가 set 으로 다시 써넣은
 * 모든 "buildup*" / "__buildup*" 키를 통째로 제거. 다음 마운트에서 store 들은 initialState 로 시작.
 */
export function hardWipeBuildupStorage(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("buildup") || k.startsWith("__buildup")) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
    // sessionStorage 에도 hint 가 남아있을 수 있으므로 정리.
    try {
      const sToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith("buildup") || k.startsWith("__buildup"))) sToRemove.push(k);
      }
      for (const k of sToRemove) sessionStorage.removeItem(k);
    } catch { /* ignore */ }
  } catch { /* ignore */ }
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
  // businessLaunched / launchedDate: 양방향 sync. Supabase 가 명시적으로 false/null 이면 로컬도 그렇게.
  // 단, 키 자체가 row 에 없으면 (undefined) 손대지 않음 — 부분 update 시 안전.
  if (typeof data.businessLaunched === "boolean") prof.setBusinessLaunched(data.businessLaunched);
  if (data.businessLaunchedDate !== undefined) prof.setBusinessLaunchedDate(data.businessLaunchedDate);
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
  // 고객 인터뷰 복원 — Mom Test 노트 + AI 패턴 분석 (다른 기기 접속 시에도 유지)
  try {
    const { useInterviewStore } = require("../stores/interview-store");
    const iv = useInterviewStore.getState();
    if ((data.customerInterviews as unknown[])?.length) {
      iv.setCustomerInterviews(data.customerInterviews as never);
    }
    if (data.interviewPatternAnalysis) {
      iv.setPatternAnalysis(data.interviewPatternAnalysis as never);
    }
  } catch { /* interview store not loaded yet */ }
  // 시간 로그 복원 — Drucker 5분 체크인 (다른 기기 접속 시에도 유지)
  try {
    const { useTimeLogStore } = require("../stores/time-log-store");
    const tl = useTimeLogStore.getState();
    if ((data.timeLogEntries as unknown[])?.length) {
      tl.setEntries(data.timeLogEntries as never);
    }
    if (data.timeLogEnabled === false) {
      tl.setEnabled(false);
    }
  } catch { /* time-log store not loaded yet */ }
  // 현금흐름 설정 복원 — 통장 잔고·판매 채널·알림 설정
  try {
    const { useCashflowStore } = require("../stores/cashflow-store");
    const cf = useCashflowStore.getState();
    const settings = data.cashflowSettings as Record<string, unknown> | null | undefined;
    if (settings && typeof settings === "object") {
      if (typeof settings.currentBalance === "number") cf.setCurrentBalance(settings.currentBalance);
      if (Array.isArray(settings.salesChannels) && settings.salesChannels.length > 0) {
        cf.setSalesChannels(settings.salesChannels as never);
      }
      if (Array.isArray(settings.fixedExpenses) && settings.fixedExpenses.length > 0) {
        // 기존 cashflow-store fixedExpenses 를 통째로 교체 (action 이 add 만 있어 reduce 가 필요)
        const current = cf.fixedExpenses as unknown[];
        // 중복 방지: id 기준
        const existingIds = new Set(current.map((e) => (e as { id: string }).id));
        for (const exp of settings.fixedExpenses as Array<{ id: string }>) {
          if (!existingIds.has(exp.id)) cf.addFixedExpense(exp as never);
        }
      }
      if (typeof settings.crisisThresholdDays === "number") cf.setCrisisThresholdDays(settings.crisisThresholdDays);
      if (typeof settings.notifyOnCrisis === "boolean") cf.setNotifyOnCrisis(settings.notifyOnCrisis);
      if (typeof settings.dailyMorningBriefing === "boolean") cf.setDailyMorningBriefing(settings.dailyMorningBriefing);
      if (typeof settings.vatReserveEnabled === "boolean") cf.setVatReserveEnabled(settings.vatReserveEnabled);
      // setupCompletedAt 은 markSetupCompleted action 만 있어, 이미 완료된 상태면 그대로 둠
    }
  } catch { /* cashflow store not loaded yet */ }
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
  // 고객 인터뷰 — Mom Test 노트 + AI 패턴 분석
  try {
    const { useInterviewStore } = require("../stores/interview-store");
    const iv = useInterviewStore.getState();
    if (iv.customerInterviews && iv.customerInterviews.length > 0) {
      r.customerInterviews = iv.customerInterviews;
    }
    if (iv.patternAnalysis) {
      r.interviewPatternAnalysis = iv.patternAnalysis;
    }
  } catch { /* interview store not loaded yet */ }
  // 시간 로그 — Drucker 매일 저녁 5분 체크인 (사장님 직접 입력)
  try {
    const { useTimeLogStore } = require("../stores/time-log-store");
    const tl = useTimeLogStore.getState();
    if (tl.entries && tl.entries.length > 0) {
      r.timeLogEntries = tl.entries;
    }
    r.timeLogEnabled = tl.enabled;
  } catch { /* time-log store not loaded yet */ }
  // 현금흐름 설정 — Cash-flow Crunch Tracker (사장님 직접 입력, 손실 시 큰 손실)
  try {
    const { useCashflowStore } = require("../stores/cashflow-store");
    const cf = useCashflowStore.getState();
    // setupCompletedAt 이 있을 때만 의미 있는 설정으로 간주해 저장
    if (cf.setupCompletedAt || cf.currentBalance > 0 || cf.fixedExpenses.length > 0) {
      r.cashflowSettings = {
        currentBalance: cf.currentBalance,
        currentBalanceUpdatedAt: cf.currentBalanceUpdatedAt,
        salesChannels: cf.salesChannels,
        fixedExpenses: cf.fixedExpenses,
        crisisThresholdDays: cf.crisisThresholdDays,
        notifyOnCrisis: cf.notifyOnCrisis,
        dailyMorningBriefing: cf.dailyMorningBriefing,
        vatReserveEnabled: cf.vatReserveEnabled,
        setupCompletedAt: cf.setupCompletedAt,
      };
    }
  } catch { /* cashflow store not loaded yet */ }
  return r;
}

// ─── Hook ───

export function usePersistence(deps: DashboardDeps, surface: DashboardSurface) {
  const { language, copy, searchParams } = deps;

  // Zustand selectors (reactive values for effects)
  const {
    persistenceReady, setPersistenceReady,
    setAuthLabel, setUserName, setPersistenceLabel,
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
  /**
   * Reset 도중 autosave 콜백이 실행되는 것을 차단하는 동기 플래그.
   *  React state (`persistenceReady`) 는 비동기라 setTimeout 콜백이 fire 할 때
   *  이미 false 가 됐다고 보장 못 함. 이 ref 로 콜백 시작 시점에 즉시 차단.
   */
  const isResettingRef = useRef(false);

  // ── connectAndLoad ──
  const connectAndLoad = async () => {
    if (connectLoadingRef.current) return;
    connectLoadingRef.current = true;
    try {
      console.log("[connectAndLoad] start");
      const result = await bootstrapAccountWorkspace(supabase);
      console.log("[connectAndLoad] bootstrap done", {
        userId: result.user.id?.slice(0, 8),
        isNew: result.isNew,
        roadmapStageId: result.state.roadmap.currentStageId,
        completedStages: result.state.roadmap.completedStageIds.length,
        decisionsKeys: Object.keys(result.state.decisions),
      });
      const userLabel = result.user.email ?? copy.common.account;
      // 회원가입 시 입력한 이름 추출 — auth.users.user_metadata.name 에 저장됨.
      // 인사말·프로필 헤더 등 UI 에서 사용. 비어있으면 null.
      const meta = (result.user.user_metadata ?? {}) as Record<string, unknown>;
      const rawName = typeof meta.name === "string" ? meta.name.trim()
        : typeof meta.full_name === "string" ? meta.full_name.trim()
        : "";
      setUserName(rawName.length > 0 ? rawName : null);

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
        console.log("[connectAndLoad] storeData", {
          exists: !!storeData,
          businessLaunched: storeData?.businessLaunched,
          storeName: storeData?.storeName,
        });
        if (storeData) {
          applyStoreData(storeData);
        } else {
          // First time: migrate localStorage → Supabase
          const localData = collectStoreData();
          console.log("[connectAndLoad] no server storeData; migrating localData", { keys: Object.keys(localData) });
          if (Object.keys(localData).length > 0) {
            await saveStoreData(supabase, localData, result.user).catch(() => {});
          }
        }
      } catch (err) {
        console.warn("[connectAndLoad] storeData load failed", err);
        // Silent fail — localStorage already loaded via useState initializers
      }

      // ── ⚠️ Stale `businessLaunched` 플래그 자가복구 ──
      // 시나리오: 데모 초기화(/api/account/reset)가 일부 테이블 삭제에 실패하거나 (RLS·권한·partial fail),
      //  비인증 상태에서 client-only reset 만 일어나는 경우, server 의 user_store_data.businessLaunched=true
      //  flag 가 살아남는다. 다음 마운트에서 applyStoreData 가 이걸 다시 setBusinessLaunched(true) 로 적용 →
      //  로드맵은 첫 단계로 리셋됐는데 home 의 progress 100% / 21/21 완료가 표시되는 모순 화면이 발생.
      // 자가복구: 로드맵에 완료된 stage 가 0개인데 businessLaunched=true 면 stale 로 판정 → 양쪽 wipe.
      const profileLaunched = useProfileStore.getState().businessLaunched;
      const completedFromRoadmap = result.state.roadmap.completedStageIds.length;
      if (profileLaunched && completedFromRoadmap === 0) {
        useProfileStore.getState().setBusinessLaunched(false);
        useProfileStore.getState().setBusinessLaunchedDate(null);
        // Server 에도 false 강제 반영 — 다음 새로고침에 다시 살아나지 않게
        void saveStoreData(
          supabase,
          { businessLaunched: false, businessLaunchedDate: null },
          result.user,
        ).catch(() => { /* silent — UI 는 이미 일관 */ });
      }

      // Show onboarding choice when no industry has been selected yet
      const hasIndustry = loadedIndustryId || loadedProfile?.subIndustryId;
      const isLaunched = useProfileStore.getState().businessLaunched || businessLaunched;
      const dismissed = localStorage.getItem("buildup_onboarding_dismissed") === "true";
      if (!hasIndustry && !isLaunched && !dismissed) {
        setShowOnboardingChoice(true);
      }

      // ── ⚠️ 로드맵 0단계 리셋 자동 복구 (Auto-heal) ──
      // 증상: 18/18 완료된 유저의 completedStageIds가 0으로 돌아가는 문제.
      // 원인: (1) starter-data.ts에 신규 stage 추가 시 기존 유저의 decisions에 해당 stage completedAt 누락
      //       (2) autosave delete-then-insert 레이스에서 순간적으로 decisions 빈 상태가 Supabase에 저장
      //       (3) Zustand persist hydration 실패 등
      // 해결: businessLaunched=true인 유저의 모든 path-stage에 completedAt을 보강하고 Supabase에 재저장.
      if (isLaunched) {
        const currentDecisions = result.state.decisions;
        const currentStages = result.state.roadmap.stages;
        const missing = currentStages.filter(
          (s: { stageId: string }) => !currentDecisions[s.stageId]?.completedAt,
        );
        // 안전장치: 결정값이 0개거나 거의 모든 stage 가 비어있으면 "초기화 직후" 상태이므로
        // auto-heal 금지 (그렇지 않으면 reset 후 isLaunched 가 잠깐 true 일 때 20단계 자동 완료됨).
        const decisionCount = Object.keys(currentDecisions).length;
        const looksLikeFreshReset = decisionCount === 0 || missing.length === currentStages.length;
        if (missing.length > 0 && !looksLikeFreshReset) {
          const nowIso = new Date().toISOString();
          let healedDecisions: WorkflowDecisionMap = currentDecisions;
          for (const stage of missing) {
            healedDecisions = upsertStageDecision(healedDecisions, stage.stageId, {
              stageId: stage.stageId,
              completedAt: nowIso,
            });
          }
          const healedRoadmap = buildRoadmapState(
            { ...baseRoadmap, roadmapId: result.state.roadmap.roadmapId },
            healedDecisions,
            reconciled,
          );
          setDecisions(healedDecisions);
          setRoadmap(healedRoadmap);
          // Supabase에 즉시 반영 (다음 새로고침에도 복구 상태가 유지되도록)
          void saveRoadmapState(supabase, {
            roadmap: healedRoadmap,
            decisions: healedDecisions,
            tasks: reconciled,
          }).catch(() => { /* silent — UI에서는 이미 보강됨 */ });
        }
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
      // 동기 가드: reset 도중이면 콜백 즉시 종료 (saveRoadmapState 가 ensureBusinessProfile +
      // roadmaps UPSERT 를 무조건 수행하기 때문에 — 즉, 자동저장이 reset 직후 row 를 재생성하는
      // race 를 차단해야 함).
      if (isResettingRef.current) {
        console.log("[autosave] blocked — reset in progress");
        return;
      }
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
      // reset 도중 차단
      if (isResettingRef.current) return;
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

  /**
   * Reset 직전 호출 — 모든 autosave 채널을 즉시 차단.
   *  ⚠️ setPersistenceReady(false) 만으로는 부족. useEffect cleanup 으로 timer 가
   *  지워지지만, "현재 살아있는 800ms 타이머" 는 closure 안에서 ref 로만 잡혀있어
   *  외부에서 명시적으로 clearTimeout 해야 함.
   */
  const cancelAllAutosaves = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (storeDataTimerRef.current) {
      clearTimeout(storeDataTimerRef.current);
      storeDataTimerRef.current = null;
    }
  };

  /**
   * Reset 동안 autosave 콜백 실행을 동기적으로 차단/해제.
   * resetDemo 시작 시 setResetting(true), 마지막에 setResetting(false) (또는 reload).
   */
  const setResetting = (value: boolean) => {
    isResettingRef.current = value;
  };

  return {
    connectAndLoad,
    persistCurrentState,
    flushStoreData,
    clearLocalUserData,
    resetLocalState,
    applyStoreData,
    collectStoreData,
    cancelAllAutosaves,
    setResetting,
  };
}
