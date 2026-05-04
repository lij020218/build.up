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
import { useStoreInfoStore } from "../stores/store-info-store";
import { isCircuitBroken, recordSaveFailure, recordSaveSuccess } from "../services/save-circuit-breaker";
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
  // 영업 시간 — null 도 명시적 의미 (24h 영업) 이므로 키 존재 여부로 판단
  if (data.businessOpenTime !== undefined) prof.setBusinessOpenTime(data.businessOpenTime);
  if (data.businessCloseTime !== undefined) prof.setBusinessCloseTime(data.businessCloseTime);
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

  // ── "내 가게" store 복원 ──
  try {
    const si = useStoreInfoStore.getState();
    si.hydrate({
      mission: (data.mission as string | null) ?? "",
      shortDescription: (data.shortDescription as string | null) ?? "",
      longDescription: (data.longDescription as string | null) ?? "",
      addressRoad: (data.addressRoad as string | null) ?? "",
      addressDetail: (data.addressDetail as string | null) ?? "",
      regionCode: (data.regionCode as string | null) ?? "",
      latitude: (data.latitude as number | null) ?? null,
      longitude: (data.longitude as number | null) ?? null,
      phone: (data.phone as string | null) ?? "",
      ownerPhone: (data.ownerPhone as string | null) ?? "",
      websiteUrl: (data.websiteUrl as string | null) ?? "",
      instagramUrl: (data.instagramUrl as string | null) ?? "",
      naverPlaceUrl: (data.naverPlaceUrl as string | null) ?? "",
      kakaoPlaceUrl: (data.kakaoPlaceUrl as string | null) ?? "",
      weeklyHolidays: Array.isArray(data.weeklyHolidays) ? (data.weeklyHolidays as string[]) : [],
      breakTime: (data.breakTime as string | null) ?? "",
      storePhotos: Array.isArray(data.storePhotos) ? (data.storePhotos as never) : [],
      currentBalanceManualKrw: (data.currentBalanceManualKrw as number | null) ?? null,
      currentBalanceUpdatedAt: (data.currentBalanceUpdatedAt as string | null) ?? null,
      bizRegistrationNumber: (data.bizRegistrationNumber as string | null) ?? "",
      bizRegistrationDate: (data.bizRegistrationDate as string | null) ?? "",
      bizRegistrationType: (data.bizRegistrationType as string | null) ?? "",
      industryCode: (data.industryCode as string | null) ?? "",
      telecomSalesNumber: (data.telecomSalesNumber as string | null) ?? "",
      fourInsuranceEstablished: (data.fourInsuranceEstablished as string | null) ?? "",
      permits: Array.isArray(data.permits) ? (data.permits as never) : [],
      bizBankName: (data.bizBankName as string | null) ?? "",
      bizBankAccountMasked: (data.bizBankAccountMasked as string | null) ?? "",
      bizCardIssued: (data.bizCardIssued as string | null) ?? "",
      posTerminal: (data.posTerminal as string | null) ?? "",
      taxHandling: (data.taxHandling as string | null) ?? "",
      cpaName: (data.cpaName as string | null) ?? "",
      cpaPhone: (data.cpaPhone as string | null) ?? "",
      peopleDirectory: Array.isArray(data.peopleDirectory) ? (data.peopleDirectory as never) : [],
      insurancePolicies: Array.isArray(data.insurancePolicies) ? (data.insurancePolicies as never) : [],
      tenancy: (data.tenancy as Record<string, unknown> | null) ?? {},
      digitalFootprint: Array.isArray(data.digitalFootprint) ? (data.digitalFootprint as never) : [],
      vehicles: Array.isArray(data.vehicles) ? (data.vehicles as never) : [],
      industrySpecifics: (data.industrySpecifics as Record<string, unknown> | null) ?? {},
    });
  } catch (err) {
    console.error("[buildup persistence] store-info hydrate failed", err);
  }
}

/** Collect store data for Supabase sync (reads from Zustand stores, not localStorage) */
export function collectStoreData(): Partial<UserStoreData> {
  const ops = useOperationsStore.getState();
  const fin = useFinanceStore.getState();
  const prof = useProfileStore.getState();
  const rm = useRoadmapStore.getState();
  const r: Partial<UserStoreData> = {};
  if (prof.storeName) r.storeName = prof.storeName;
  // 영업 시간 — null 도 보낸다 (사장이 "24h 영업"으로 바꾼 경우 반영 위해 항상 포함)
  r.businessOpenTime = prof.businessOpenTime ?? null;
  r.businessCloseTime = prof.businessCloseTime ?? null;
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

  // ── 내 가게 store 수집 ──
  try {
    const si = useStoreInfoStore.getState();
    // 모든 필드를 항상 포함 (빈 값도 의도 — 사장이 지웠을 수 있음)
    r.mission = si.mission || null;
    r.shortDescription = si.shortDescription || null;
    r.longDescription = si.longDescription || null;
    r.addressRoad = si.addressRoad || null;
    r.addressDetail = si.addressDetail || null;
    r.regionCode = si.regionCode || null;
    r.latitude = si.latitude;
    r.longitude = si.longitude;
    r.phone = si.phone || null;
    r.ownerPhone = si.ownerPhone || null;
    r.websiteUrl = si.websiteUrl || null;
    r.instagramUrl = si.instagramUrl || null;
    r.naverPlaceUrl = si.naverPlaceUrl || null;
    r.kakaoPlaceUrl = si.kakaoPlaceUrl || null;
    r.weeklyHolidays = si.weeklyHolidays;
    r.breakTime = si.breakTime || null;
    r.storePhotos = si.storePhotos;
    r.currentBalanceManualKrw = si.currentBalanceManualKrw;
    r.currentBalanceUpdatedAt = si.currentBalanceUpdatedAt;
    r.bizRegistrationNumber = si.bizRegistrationNumber || null;
    r.bizRegistrationDate = si.bizRegistrationDate || null;
    r.bizRegistrationType = si.bizRegistrationType || null;
    r.industryCode = si.industryCode || null;
    r.telecomSalesNumber = si.telecomSalesNumber || null;
    r.fourInsuranceEstablished = si.fourInsuranceEstablished || null;
    r.permits = si.permits;
    r.bizBankName = si.bizBankName || null;
    r.bizBankAccountMasked = si.bizBankAccountMasked || null;
    r.bizCardIssued = si.bizCardIssued || null;
    r.posTerminal = si.posTerminal || null;
    r.taxHandling = si.taxHandling || null;
    r.cpaName = si.cpaName || null;
    r.cpaPhone = si.cpaPhone || null;
    r.peopleDirectory = si.peopleDirectory;
    r.insurancePolicies = si.insurancePolicies;
    r.tenancy = si.tenancy;
    r.digitalFootprint = si.digitalFootprint;
    r.vehicles = si.vehicles;
    r.industrySpecifics = si.industrySpecifics;
  } catch (err) {
    console.error("[buildup persistence] store-info collect failed", err);
  }
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

        // ⚠️ store_members 테이블은 멀티-테넌트(팀) 기능용. 1인 사장 시나리오에는 불필요하며,
        //    테이블 미적용 환경에서 매 connect 마다 404 콘솔 노이즈를 일으켰음.
        //    팀 초대 흐름은 starter-stage-demo.tsx 의 invite acceptance 에서만 query.
        if (profileRole === "staff" || profileRole === "manager" || profileRole === "owner") {
          resolvedRole = profileRole;
        } else {
          resolvedRole = "owner";
          void supabase.from("business_profiles").update({ user_role: "owner" } as never).eq("user_id", result.user.id).then(() => {});
        }
      } catch {
        resolvedRole = "owner";
      }
      setUserRole(resolvedRole);

      const loadedTasks = result.state.tasks;

      // ── Backward heal: completedAt 백필 (강화 v2 — 2026-05-03 사용자 보고 반복) ──
      //
      // 문제 시나리오: 룰 강화 후 (예: permit-check 2→5) 사용자가 옛 룰로 task 토글만 하고
      //   "다음 단계로" 안 눌렀을 때 → completedAt 없음 + 새로 추가된 task 는 status=todo →
      //   evaluateRule 이 fail → stage 회귀. 이전 v1 heal 은 "furthestIdx 보다 앞" 만 backfill 해서
      //   furthestIdx 자체가 회귀 stage 면 안 고쳐짐.
      //
      // 강화 v2: 두 단계 적용.
      //   ① 모든 stage 중 "신호 있음 = completedAt OR 어떤 task 라도 status=completed" 면
      //      그 stage 자체에 completedAt 백필 (사용자가 토글하기 시작했다는 건 진행 흔적).
      //   ② 위에서 하나라도 backfill 된 가장 뒤 stage idx 까지의 모든 in-roadmap stage 에 backfill
      //      (path 의 monotonic chain 보장 — 중간 단계가 비어 있을 수 없음).
      //
      // 결과: 사용자가 task 만 토글했어도, "다음 단계로" 한 번이라도 눌렀어도, 둘 다 done 으로 인정.
      const stageOrder = new Map<string, number>();
      result.state.roadmap.stages.forEach((s: { stageId: string }, idx: number) => stageOrder.set(s.stageId, idx));
      const decisionsToHeal: WorkflowDecisionMap = { ...result.state.decisions };
      const healedStageIds = new Set<string>();

      // ① "신호 있음" stage 모두 직접 backfill.
      let maxSignalIdx = -1;
      const signalStages: Array<{ sid: string; idx: number; hasCompleted: boolean }> = [];
      // decisions 에 등록된 stage 와 tasks 에 등록된 stage 둘 다 스캔 (decisions 만 보면 누락).
      const allStageIds = new Set<string>([
        ...Object.keys(decisionsToHeal),
        ...Object.keys(loadedTasks),
      ]);
      for (const sid of allStageIds) {
        const idx = stageOrder.get(sid) ?? -1;
        if (idx < 0) continue;
        const dec = decisionsToHeal[sid];
        const hasCompleted = !!dec?.completedAt;
        const hasAnyCompletedTask = (loadedTasks[sid] ?? []).some((t: { status: string }) => t.status === "completed");
        if (hasCompleted || hasAnyCompletedTask) {
          signalStages.push({ sid, idx, hasCompleted });
          if (idx > maxSignalIdx) maxSignalIdx = idx;
        }
      }

      const baseTime = Date.now();
      // ① 신호 있는 stage 자체에 completedAt 없으면 채움 (사용자의 진행 흔적 = done 인정).
      for (const { sid, idx, hasCompleted } of signalStages) {
        if (!hasCompleted) {
          const existing = decisionsToHeal[sid];
          const ts = new Date(baseTime - (maxSignalIdx - idx) * 1000).toISOString();
          decisionsToHeal[sid] = { ...(existing ?? { stageId: sid }), stageId: sid, completedAt: ts };
          healedStageIds.add(sid);
        }
      }
      // ② maxSignalIdx 까지의 모든 path stage 에 chain backfill (사용자가 거기까지 도달한 사실).
      if (maxSignalIdx > 0) {
        for (let i = 0; i < maxSignalIdx; i++) {
          const sid = result.state.roadmap.stages[i].stageId;
          const existing = decisionsToHeal[sid];
          if (!existing?.completedAt) {
            const ts = new Date(baseTime - (maxSignalIdx - i) * 1000).toISOString();
            decisionsToHeal[sid] = { ...(existing ?? { stageId: sid }), stageId: sid, completedAt: ts };
            healedStageIds.add(sid);
          }
        }
      }
      const healed = healedStageIds.size > 0;
      if (healed) {
        console.log(
          `[buildup persistence] heal v2: backfilled ${healedStageIds.size} stages (maxSignalIdx=${maxSignalIdx})`,
          Array.from(healedStageIds),
        );
      }
      setDecisions(decisionsToHeal);

      // Reconcile tasks: starterTaskMap is source of truth for task definitions.
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
      // healed 된 decisions 로 roadmap 재빌드 — 그렇지 않으면 result.state.roadmap 이
      // 백필 전 평가 결과라 곧바로 다시 "available" 로 표시될 수 있음.
      const healedRoadmap = healed
        ? buildRoadmapState(
            { ...baseRoadmap, roadmapId: result.state.roadmap.roadmapId },
            decisionsToHeal,
            reconciled,
          )
        : result.state.roadmap;
      setRoadmap(healedRoadmap);
      // 백필이 일어났다면 즉시 Supabase 저장 (다음 새로고침에도 유지).
      if (healed) {
        void saveRoadmapState(supabase, {
          roadmap: healedRoadmap,
          decisions: decisionsToHeal,
          tasks: reconciled,
        }).catch((err) => {
          console.warn("[buildup persistence] heal save failed:", err);
        });
      }
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

      // ── ⚠️ Reverse stale: 모든 path stage 완료됐는데 businessLaunched=false ──
      // 시나리오: 사용자가 "내 가게 대시보드로 이동" 버튼을 눌렀지만 이전 버그 시점엔 인라인 구현이
      //  Supabase 저장을 빠뜨려서 새로고침 후 businessLaunched=false로 복구되는 일이 있었음.
      // 결과: home/완료 화면은 "18단계 모두 완료"인데 current stage 페이지는 여전히 pre-launch-final
      //  단계 콘텐츠를 보여주는 모순 발생. 사용자 직접 다시 버튼을 눌러야만 정상화.
      // 자가복구: pathStage 전부 완료됐고 (path 기준 — first-month-check 같은 deprecated stage 제외)
      //  businessLaunched=false면 → 사용자가 명시적으로 완료 끝낸 것으로 보고 launched=true 자가복구.
      if (!profileLaunched && completedFromRoadmap > 0) {
        // path 기준으로 완료 판정 — pathStageIds 가 hook 외부에서 계산되므로 여기선 simple heuristic
        // 사용자의 currentStageId 가 pre-launch-final 이고 그 stage 가 completed에 포함됐다면 launched 로 자가복구
        const completedSet = new Set(result.state.roadmap.completedStageIds);
        const reachedFinal = completedSet.has("pre-launch-final");
        if (reachedFinal) {
          const launchDate = new Date().toISOString().slice(0, 10);
          useProfileStore.getState().setBusinessLaunched(true);
          if (!useProfileStore.getState().businessLaunchedDate) {
            useProfileStore.getState().setBusinessLaunchedDate(launchDate);
          }
          // Server 에 즉시 반영
          void saveStoreData(
            supabase,
            { businessLaunched: true, businessLaunchedDate: useProfileStore.getState().businessLaunchedDate ?? launchDate },
            result.user,
          ).catch(() => { /* silent — UI 는 이미 일관 */ });
        }
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

        // ⚠️ Path-aware: 사용자 path 외 stage는 healing 대상에서 제외.
        // 예전엔 모든 stage(46개)에 completedAt 보강해서 startup-tech 유저가 offline 단계까지 false-positive로 완료된 듯이 표시되는 버그.
        const indDec = currentDecisions["industry-selection"] as { inputs?: { categoryId?: string }; selectedPrimaryOptionId?: string } | undefined;
        const stDec = currentDecisions["startup-type"] as { selectedPrimaryOptionId?: string; inputs?: { startupType?: string } } | undefined;
        const cat = indDec?.inputs?.categoryId;
        const subId = indDec?.selectedPrimaryOptionId ?? "";
        const sType = stDec?.selectedPrimaryOptionId ?? stDec?.inputs?.startupType;
        const onlineOnly = new Set(["platform-setup","online-registration","sourcing-setup","store-setup","online-marketing"]);
        const startupOnly = new Set(["startup-foundation","customer-discovery","mvp-build","launch-gtm","go-live","growth-engine","company-setup","fundraising-readiness","venture-certification","hardware-prototype","bom-supply-chain","certification-kc-ce","manufacturing-partner","lab-setup","prototype-iteration","field-or-clinical-test","regulatory-submission","eda-tooling-setup","mpw-or-pilot-tape-out","packaging-and-test","partner-foundation-or-pilot-line"]);
        const offlineOnly = new Set(["permit-check","location-candidates","contract-review","construction-setup","vendor-setup","registration-setup","insurance-tax-setup","hiring-setup","operations-setup","pre-launch"]);
        const clusterB = new Set(["hardware-prototype","bom-supply-chain","certification-kc-ce","manufacturing-partner"]);
        const clusterC = new Set(["lab-setup","prototype-iteration","field-or-clinical-test","regulatory-submission"]);
        const clusterD = new Set(["eda-tooling-setup","mpw-or-pilot-tape-out","packaging-and-test","partner-foundation-or-pilot-line"]);
        const isClusterB = subId === "hardware-iot";
        const isClusterC = subId === "robotics-physical-ai" || subId === "biotech-medtech";
        const isClusterD = subId === "semiconductor" || subId === "climate-energy";
        const isInPath = (stageId: string): boolean => {
          if (cat === "startup-tech") {
            if (onlineOnly.has(stageId) || offlineOnly.has(stageId) || stageId === "franchise-application") return false;
            if (clusterB.has(stageId)) return isClusterB;
            if (clusterC.has(stageId)) return isClusterC;
            if (clusterD.has(stageId)) return isClusterD;
            return true;
          }
          if (cat === "online-digital") {
            if (offlineOnly.has(stageId) || startupOnly.has(stageId) || stageId === "franchise-application") return false;
            return true;
          }
          // offline (default)
          if (onlineOnly.has(stageId) || startupOnly.has(stageId)) return false;
          if (stageId === "franchise-application" && sType !== "franchise") return false;
          return true;
        };

        const pathStageList = currentStages.filter((s: { stageId: string }) => isInPath(s.stageId));
        const missing = pathStageList.filter(
          (s: { stageId: string }) => !currentDecisions[s.stageId]?.completedAt,
        );
        // 안전장치: 결정값이 0개거나 path stage 거의 전부가 비어있으면 "초기화 직후" 상태이므로
        // auto-heal 금지 (그렇지 않으면 reset 후 isLaunched 가 잠깐 true 일 때 자동 완료됨).
        const decisionCount = Object.keys(currentDecisions).length;
        const looksLikeFreshReset = decisionCount === 0 || missing.length === pathStageList.length;
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

  /** Zustand 스토어에서 읽어서 1초 debounce로 Supabase에 flush — 일반 변경 (재고·직원·세팅 등) */
  const flushStoreData = () => {
    const onb = useOnboardingStore.getState();
    if (!onb.persistenceReady) {
      console.warn("[buildup persistence] flushStoreData skipped — persistence not ready (signed out?)");
      return;
    }
    if (storeDataTimerRef.current) clearTimeout(storeDataTimerRef.current);
    storeDataTimerRef.current = setTimeout(async () => {
      onb.setPersistStatus("saving");
      try {
        await saveStoreData(supabase, collectStoreData());
        onb.setPersistStatus("saved");
        onb.setPersistError(null);
        onb.setPersistLastSavedAt(Date.now());
        // 2초 뒤 idle로 복귀
        setTimeout(() => {
          if (useOnboardingStore.getState().persistStatus === "saved") {
            useOnboardingStore.getState().setPersistStatus("idle");
          }
        }, 2000);
      } catch (err) {
        console.error("[buildup persistence] saveStoreData failed:", err);
        onb.setPersistStatus("error");
        onb.setPersistError(err instanceof Error ? err.message : String(err));
      }
    }, 1000);
  };

  /** 즉시 저장 (debounce 없이) — 매출·비용 입력 같은 critical 데이터용. throw on failure. */
  const flushStoreDataImmediate = async (): Promise<void> => {
    const onb = useOnboardingStore.getState();
    if (!onb.persistenceReady) {
      onb.setPersistStatus("error");
      onb.setPersistError("로그인이 필요합니다 — 데이터가 서버에 저장되지 않습니다.");
      throw new Error("AUTH_REQUIRED");
    }
    // 회로 차단 — 영구 실패 감지된 후엔 시도조차 안 함
    if (isCircuitBroken()) {
      throw new Error("CIRCUIT_BROKEN");
    }
    if (storeDataTimerRef.current) clearTimeout(storeDataTimerRef.current);
    onb.setPersistStatus("saving");
    try {
      await saveStoreData(supabase, collectStoreData());
      recordSaveSuccess();
      onb.setPersistStatus("saved");
      onb.setPersistError(null);
      onb.setPersistLastSavedAt(Date.now());
      setTimeout(() => {
        if (useOnboardingStore.getState().persistStatus === "saved") {
          useOnboardingStore.getState().setPersistStatus("idle");
        }
      }, 2000);
    } catch (err) {
      const { message } = recordSaveFailure(err);
      onb.setPersistStatus("error");
      onb.setPersistError(message);
      throw err;
    }
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
      if (isResettingRef.current) {
        console.log("[autosave] blocked — reset in progress");
        return;
      }
      // 회로 차단 — 영구 실패 감지된 후엔 시도조차 안 함 (콘솔/네트워크 스팸 방지)
      if (isCircuitBroken()) return;
      const snap = roadmapSnapshotRef.current;
      // ⚠️ 두 save 를 독립적으로 처리 — 하나가 실패해도 다른 하나는 진행, 각자 회로 차단기 알림.
      //   이전엔 Promise.all 로 묶고 saveRoadmapState 실패는 recordSaveFailure 호출 안 했음.
      //   결과: roadmap save 가 영구 실패 (마이그레이션 미적용 등) 해도 회로 차단 안 되고
      //         매 800ms 마다 시도 → 콘솔 스팸 + 사용자가 "저장 잘 되나?" 의심하게 됨.
      const roadmapPromise = saveRoadmapState(supabase, {
        roadmap: snap.roadmap,
        decisions: snap.decisions,
        tasks: snap.taskMap,
      }).then(
        () => { recordSaveSuccess(); },
        (err) => { recordSaveFailure(err); throw err; },
      );
      const storePromise = saveStoreData(supabase, collectStoreData()).then(
        () => { recordSaveSuccess(); },
        (err) => { recordSaveFailure(err); throw err; },
      );
      void Promise.allSettled([roadmapPromise, storePromise]).then((results) => {
        const anyRejected = results.some((r) => r.status === "rejected");
        if (anyRejected) {
          const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
          setPersistenceLabel(
            firstErr?.reason instanceof Error
              ? `${copy.home.autosaveFailed}: ${firstErr.reason.message}`
              : copy.home.autosaveFailed,
          );
        } else {
          setPersistenceLabel(copy.home.autosaved);
          void loadBusinessProfile(supabase)
            .then((p) => { if (p) setProfile(p); })
            .catch(() => {});
        }
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
      if (isResettingRef.current) return;
      if (!useOnboardingStore.getState().persistenceReady) return;
      // 전역 circuit breaker — 영구 실패 후엔 시도조차 안 함
      if (isCircuitBroken()) return;
      saveStoreData(supabase, storeDataSnapshotRef.current).then(
        () => { recordSaveSuccess(); },
        (err) => {
          const { message } = recordSaveFailure(err);
          const onb = useOnboardingStore.getState();
          onb.setPersistStatus("error");
          onb.setPersistError(message);
        },
      );
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
    flushStoreDataImmediate,
    clearLocalUserData,
    resetLocalState,
    applyStoreData,
    collectStoreData,
    cancelAllAutosaves,
    setResetting,
  };
}
