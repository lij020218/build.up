"use client";

/**
 * usePersistence — Found.One 데이터 영속성 훅
 *
 * ─────────────────────────────────────────────────────────────────
 * 역할
 * ─────────────────────────────────────────────────────────────────
 * Supabase(서버)와 Zustand(클라이언트 상태) 사이의 동기화를 담당.
 * 앱 최초 마운트 시 계정 데이터를 로드하고, 이후 변경사항을 디바운스
 * autosave로 Supabase에 영속화합니다.
 *
 * ─────────────────────────────────────────────────────────────────
 * FILE MAP
 * ─────────────────────────────────────────────────────────────────
 *  §1  헬퍼 함수        : clearLocalUserData, resetLocalState, ...
 *  §2  connectAndLoad   : 최초 로그인 시 계정 부트스트랩 → Zustand 반영
 *       - bootstrapAccountWorkspace (roadmap/decisions/tasks 로드)
 *       - loadBusinessProfile (업종·가맹 정보)
 *       - loadStoreData (매장 운영 데이터)
 *       - 유저 전환 감지 (다른 계정 로그인 시 로컬 초기화)
 *  §3  autosave          : Zustand 변경 감지 → 디바운스(3초) → Supabase 저장
 *       - circuit breaker: 영구 실패 감지 시 재시도 차단
 *  §4  훅 반환값         : persistenceLabel, persistenceReady
 *
 * ─────────────────────────────────────────────────────────────────
 * 데이터 진실의 원천 (SSOT)
 * ─────────────────────────────────────────────────────────────────
 * Supabase가 유일한 SSOT. 로컬 상태는 UI 렌더링용 캐시이며,
 * 모든 변경사항은 autosave를 통해 반드시 Supabase에 기록됩니다.
 * 오프라인/에러 시 circuit breaker가 스팸 재시도를 방지합니다.
 *
 * ─────────────────────────────────────────────────────────────────
 * 주요 의존성
 * ─────────────────────────────────────────────────────────────────
 * - @foundone/shared: bootstrapAccountWorkspace, saveStoreData, ...
 * - Zustand stores: useRoadmapStore, useProfileStore, useFinanceStore, ...
 * - Sentry: 에러 자동 리포팅 (console.log 대신 Sentry breadcrumb 사용)
 */

import { useEffect, useRef } from "react";
import {
  bootstrapAccountWorkspace,
  buildRoadmapState,
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
} from "@foundone/shared";
import { baseRoadmap } from "../helpers";
import {
  useOperationsStore,
  useFinanceStore,
  useAiStore,
  useProfileStore,
  useRoadmapStore,
  useOnboardingStore,
  useMarketingStore,
  useAgentsStore,
  useInterviewStore,
  useTimeLogStore,
  useCashflowStore,
  useUsageStore,
  useBookingStore,
  useEcommerceStore,
} from "../stores";
import { useStoreInfoStore } from "../stores/store-info-store";
import { isCircuitBroken, recordSaveFailure, recordSaveSuccess, resetCircuit } from "../services/save-circuit-breaker";
import type { AiRoadmapSnapshot } from "../stores/roadmap-store";
import type { DailyEntry, MonthlyCosts, CostSnapshot } from "../stores/finance-store";
import type {
  InventoryItem, Employee, DeliveryPlatform, Product,
  UnifiedProduct, ServiceMenuItem, TaxSettings, FixedExpense, Member,
} from "../stores/operations-store";
import { supabase } from "../../../lib/supabase";
import type { DashboardDeps, DashboardSurface } from "../types";
import { getKstDate } from "../utils/business-day";
import { makeIsPathStage } from "../utils/path-filter";

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
  "__foundone_decisions", "__foundone_roadmap", "__foundone_taskmap",
];

// ─── Pure helpers (no hooks, use getState()) ───

/**
 * 모든 Zustand persist 키 (localStorage). 계정 전환·로그아웃 시 전부 비워야 cross-account 누출이 없다.
 * persist 되는 store 를 새로 만들면 *반드시 여기에 추가*. (clearLocalUserData 의 SSOT)
 */
const PERSISTED_STORE_KEYS = [
  "foundone-operations",
  "foundone-finance",
  "foundone-profile",
  "foundone-roadmap",
  "foundone-cashflow",
  "foundone-marketing",
  "foundone-agents",
  "foundone-customer-interviews",
  "foundone-time-log",
  "foundone-usage-stats-v1",
  "foundone-store-info",  // 상호·주소 PII — 누락 시 공용기기에서 다음 사용자에게 노출
  "foundone-bookings",
  "foundone-ecommerce",
] as const;

/** Remove all user-specific localStorage keys */
export function clearLocalUserData(): void {
  try {
    LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    // Zustand persist 키 — 모든 foundone-* store. 한 곳에 빠지면 계정 전환 시 stale 상태가
    //   살아남아 cross-account 누출(특히 store-info=상호·주소 PII)이 발생한다.
    //   PERSISTED_STORE_KEYS 가 SSOT — store 추가 시 여기 한 곳만 갱신하면 됨.
    PERSISTED_STORE_KEYS.forEach((k) => localStorage.removeItem(k));
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

/**
 * 독립적으로 hydrate 하는 카드(코칭 일지 등 — Zustand 가 아니라 자체 fetch 로 로드)에
 * "원격 데이터가 바뀌었으니 다시 읽어라" 를 알리는 window 이벤트.
 * realtime 수신·포커스 복귀 양쪽에서 발행해 웹↔iOS 가 곧바로 동기화되게 한다.
 */
export function notifyRemoteDataChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent("buildup:remote-data-changed"));
  } catch {
    /* SSR/비브라우저 — 무시 */
  }
}

/**
 * 모든 persist Zustand store 의 *메모리 상태*를 초기화.
 *   (localStorage 만 지우고 메모리를 안 지우면, 같은 탭에서 로그아웃→재로그인 시 이전 계정
 *    데이터가 화면에 남는다. 특히 store-info 의 상호·주소 PII.)
 *   clearLocalUserData(localStorage) 와 짝으로 호출된다.
 */
export function resetLocalState(): void {
  useOperationsStore.getState().resetAll();
  useFinanceStore.getState().resetAll();
  useProfileStore.getState().resetAll();
  useRoadmapStore.getState().resetAll();
  useAiStore.getState().resetAll();
  useOnboardingStore.getState().resetAll();
  // 이전에 누락돼 cross-account 로 남던 store 들 — 전부 초기화.
  useStoreInfoStore.getState().resetAll();
  useCashflowStore.getState().resetAll();
  useMarketingStore.getState().resetAll();
  useAgentsStore.getState().resetAll();
  useTimeLogStore.getState().resetAll();
  useInterviewStore.getState().resetAll();
  useUsageStore.getState().resetAll();
  useBookingStore.getState().clearAll();    // booking/ecommerce 는 clearAll 시그니처
  useEcommerceStore.getState().clearAll();
}

/**
 * 계정별 로컬 캐시 격리 (cross-account 누출 차단의 핵심).
 *
 * 모든 user-data store 는 `skipHydration: true` — 모듈 로드 시 자동 hydrate 하지 않는다.
 *   종전엔 자동 hydrate 가 *인증 전에* 이전 계정 캐시를 메모리에 올린 뒤, connectAndLoad 의
 *   "계정 바뀜 → 삭제" 가 *나중에* 돌아서, 그 사이/누락으로 다른 계정 데이터가 보이는 P0 누출이 있었다.
 *   (동명이인 염예준 naver↔gmail 신고, 2026-06-22.)
 *
 * 이제 hydrate 는 *오직 여기서, uid 일치를 확인한 뒤에만* 일어난다:
 *   - 직전 uid == 현재 uid → 내 캐시이므로 rehydrate(즉시 로드, UX 유지).
 *   - 다르거나 미상 → 이전 캐시를 *읽지 않고* clearStorage + 메모리 초기화 → 새 계정은 절대
 *     이전 계정 캐시를 못 본다(서버 로드로만 채워짐). "지우기에 의존"이 아니라 "안 읽기"로 뒤집음.
 */
type PersistApiStore = { persist: { rehydrate: () => Promise<void> | void; clearStorage: () => void } };
const USER_PERSIST_STORES: PersistApiStore[] = [
  useOperationsStore, useFinanceStore, useProfileStore, useRoadmapStore,
  useCashflowStore, useMarketingStore, useAgentsStore, useInterviewStore,
  useTimeLogStore, useUsageStore, useStoreInfoStore, useBookingStore, useEcommerceStore,
] as unknown as PersistApiStore[];

export async function hydrateStoresForUser(uid: string): Promise<{ switched: boolean }> {
  let prev: string | null = null;
  try { prev = localStorage.getItem("__foundone_uid"); } catch { /* storage 차단 */ }
  if (prev === uid) {
    // 같은 계정 — 캐시 즉시 로드.
    await Promise.all(USER_PERSIST_STORES.map((s) => {
      try { return Promise.resolve(s.persist.rehydrate()); } catch { return Promise.resolve(); }
    }));
    return { switched: false };
  }
  // 다른/미상 계정 — 이전 계정 캐시를 *읽지 않고* 전부 제거 + 메모리 초기화.
  USER_PERSIST_STORES.forEach((s) => { try { s.persist.clearStorage(); } catch { /* */ } });
  clearLocalUserData();
  resetLocalState();
  try { localStorage.setItem("__foundone_uid", uid); } catch { /* */ }
  return { switched: true };
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
  {
    const mkt = useMarketingStore.getState();
    if ((data.marketingCampaigns as unknown[])?.length) mkt.setCampaigns(data.marketingCampaigns as never);
    if (data.marketingMonthlyBudget && data.marketingMonthlyBudget > 0) mkt.setMonthlyBudget(data.marketingMonthlyBudget);
    if ((data.promoCodes as unknown[])?.length) mkt.setPromoCodes(data.promoCodes as never);
    if ((data.playbookChecklist as unknown[])?.length) mkt.setPlaybookChecklist(data.playbookChecklist as never);
  }
  // 에이전트 on/off 설정 복원 — 웹·앱 동기화
  if (data.agentSettings && typeof data.agentSettings === "object") {
    useAgentsStore.getState().setEnabledAgents(data.agentSettings as never);
  }
  // 고객 인터뷰 복원 — Mom Test 노트 + AI 패턴 분석 (다른 기기 접속 시에도 유지)
  {
    const iv = useInterviewStore.getState();
    if ((data.customerInterviews as unknown[])?.length) {
      iv.setCustomerInterviews(data.customerInterviews as never);
    }
    if (data.interviewPatternAnalysis) {
      iv.setPatternAnalysis(data.interviewPatternAnalysis as never);
    }
  }
  // 시간 로그 복원 — Drucker 5분 체크인 (다른 기기 접속 시에도 유지)
  {
    const tl = useTimeLogStore.getState();
    if ((data.timeLogEntries as unknown[])?.length) {
      tl.setEntries(data.timeLogEntries as never);
    }
    if (data.timeLogEnabled === false) {
      tl.setEnabled(false);
    }
  }
  // 현금흐름 설정 복원 — 통장 잔고·판매 채널·알림 설정
  {
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
      // 매출 집계 기준 복원
      const rb = settings.revenueBasis as { card?: unknown; countCashReceipt?: unknown } | null | undefined;
      if (rb && (rb.card === "individual" || rb.card === "codef")) {
        cf.setRevenueBasis({ card: rb.card, countCashReceipt: rb.countCashReceipt === true });
      }
      // setupCompletedAt 복원 — 다른 기기에서 캐시플로우 셋업을 다시 요구하지 않도록 원본 시각 hydrate.
      //   (종전: 복원 setter 부재로 누락 → 새 기기 진입 시 설정 완료 상태가 사라져 재요구되던 버그.)
      if (typeof settings.setupCompletedAt === "string" && settings.setupCompletedAt && !cf.setupCompletedAt) {
        cf.setSetupCompletedAt(settings.setupCompletedAt);
      }
    }
  }

  // ── 예약·이커머스 store 복원 ──
  //   booking-store / ecommerce-store 의 사장님 입력 데이터는 별도 DB 컬럼 없이
  //   industrySpecifics(industry_specifics jsonb)의 예약 키 __bookings / __ecommerce 에 nest 한다
  //   (마이그레이션 0 — FoodSafety 와 동일 패턴). 키가 있을 때만 교체(없으면 로컬 보존 — 보수적 가드).
  //   iOS 는 이 두 키를 모르므로 jsonb 라운드트립에서 그대로 보존된다.
  {
    const indSpec = (data.industrySpecifics as Record<string, unknown> | null) ?? {};
    const bk = indSpec.__bookings as { bookings?: unknown[]; providers?: unknown[] } | undefined;
    if (bk && typeof bk === "object") {
      useBookingStore.getState().hydrate(
        (Array.isArray(bk.bookings) ? bk.bookings : []) as never,
        (Array.isArray(bk.providers) ? bk.providers : []) as never,
      );
    }
    const ec = indSpec.__ecommerce as { adSpends?: unknown[]; returns?: unknown[] } | undefined;
    if (ec && typeof ec === "object") {
      useEcommerceStore.getState().hydrate(
        (Array.isArray(ec.adSpends) ? ec.adSpends : []) as never,
        (Array.isArray(ec.returns) ? ec.returns : []) as never,
      );
    }
  }

  // ── "내 가게" store 복원 ──
  try {
    const si = useStoreInfoStore.getState();
    // 예약 키(__bookings/__ecommerce)는 booking/ecommerce store 가 SSOT 이므로
    //   store-info 의 industrySpecifics 에는 넣지 않는다(중복·MyStore 섹션 오염 방지).
    //   collectStoreData 가 저장 시 다시 합쳐서 내보낸다.
    const rawIndSpec = (data.industrySpecifics as Record<string, unknown> | null) ?? {};
    const cleanIndSpec = { ...rawIndSpec };
    delete cleanIndSpec.__bookings;
    delete cleanIndSpec.__ecommerce;
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
      industrySpecifics: cleanIndSpec,
      businessDocuments: Array.isArray(data.businessDocuments) ? (data.businessDocuments as never) : [],
    });
  } catch (err) {
    console.error("[buildup persistence] store-info hydrate failed", err);
  }
}

/**
 * Collect store data for Supabase sync (reads from Zustand stores, not localStorage).
 *
 * @param includeEmpties 사장님이 리스트의 *마지막 항목까지 삭제*한 경우, 빈 배열도 서버에 보내
 *   삭제가 반영되게 한다. 기본 false 인 이유: 서버 hydrate 가 끝나기 전(또는 로드 실패 시)
 *   Zustand 가 일시적으로 비어 있을 때 빈 배열을 보내면 서버의 멀쩡한 데이터를 지워버린다.
 *   따라서 호출부는 **applyStoreData 로 서버 데이터를 받은 뒤(=storeDataReadyRef)** 에만 true 를 넘긴다.
 *   (대상: 사장님이 직접 관리하는 리스트 — 직원·캠페인·일매출 등. 로드맵 체크리스트 딕셔너리는
 *    reset 외엔 통째로 비우지 않으므로 보수적으로 제외.)
 */
export function collectStoreData(includeEmpties = false): Partial<UserStoreData> {
  const ops = useOperationsStore.getState();
  const fin = useFinanceStore.getState();
  const prof = useProfileStore.getState();
  const rm = useRoadmapStore.getState();
  const r: Partial<UserStoreData> = {};
  // 사장 관리 리스트: includeEmpties 면 빈 배열도 전송(삭제 반영), 아니면 기존처럼 비었을 때 생략.
  const keep = (n: number) => includeEmpties || n > 0;
  if (prof.storeName) r.storeName = prof.storeName;
  // 🛑 "항상 전송" 필드(영업시간·세금설정·월비용)는 *서버 로드 완료(includeEmpties=true) 후에만* 보낸다.
  //   로드 전(다른 기기 첫 진입 등)엔 이들이 기본값(null·zeros)이라, 그대로 보내면 서버의 실제 값
  //   (사장님 월비용·영업시간)을 덮어쓴다 — dailyEntries race 와 동일 부류의 cross-device wipe.
  //   빈 배열 가드(keep)와 동일한 storeDataReadyRef 규약을 스칼라/객체 필드에도 적용.
  if (includeEmpties) {
    // 영업 시간 — null 도 보낸다 (사장이 "24h 영업"으로 바꾼 경우 반영 위해 포함)
    r.businessOpenTime = prof.businessOpenTime ?? null;
    r.businessCloseTime = prof.businessCloseTime ?? null;
    r.taxSettings = ops.taxSettings;
    r.monthlyCosts = fin.monthlyCosts;
  }
  if (prof.businessLaunched) r.businessLaunched = true;
  if (prof.businessLaunchedDate) r.businessLaunchedDate = prof.businessLaunchedDate;
  if (prof.cpaDecision) r.cpaDecision = prof.cpaDecision;
  if (keep(fin.dailyEntries.length)) r.dailyEntries = fin.dailyEntries;
  if (keep(ops.inventory.length)) r.inventoryItems = ops.inventory;
  if (keep(ops.employees.length)) r.employees = ops.employees;
  if (keep(ops.fixedExpenses.length)) r.fixedExpenses = ops.fixedExpenses;
  if (keep(ops.deliveryPlatforms.length)) r.deliveryPlatforms = ops.deliveryPlatforms;
  if (keep(Object.keys(ops.monthlyDeliverySales).length)) r.monthlyDeliverySales = ops.monthlyDeliverySales;
  if (keep(ops.products.length)) r.products = ops.products;
  if (keep(ops.unifiedProducts.length)) r.unifiedProducts = ops.unifiedProducts;
  if (keep(ops.serviceMenuItems.length)) r.serviceMenuItems = ops.serviceMenuItems;
  if (keep(ops.members.length)) r.members = ops.members;
  if (Object.keys(rm.vendorSelections).length) r.vendorSelections = rm.vendorSelections;
  if (Object.keys(rm.vendorCustomInputs).length) r.vendorCustomInputs = rm.vendorCustomInputs;
  if (Object.keys(rm.opsSelections).length) r.opsSelections = rm.opsSelections;
  if (Object.keys(rm.opsPosChecks).length) r.opsPosChecks = rm.opsPosChecks;
  if (Object.keys(rm.softOpenChecks).length) r.softOpenChecks = rm.softOpenChecks;
  if (rm.softOpenPricing) r.softOpenPricing = rm.softOpenPricing;
  if (Object.keys(rm.softOpenSkips).length) r.softOpenSkips = rm.softOpenSkips;
  if (Object.keys(rm.taxChecks).length) r.taxChecks = rm.taxChecks;
  if (Object.keys(rm.loanChecks).length) r.loanChecks = rm.loanChecks;
  if (keep(Object.keys(ops.onlinePlatformSales).length)) r.onlinePlatformSales = ops.onlinePlatformSales;
  if (keep(ops.onlineSelectedPlatforms.length)) r.onlineSelectedPlatforms = ops.onlineSelectedPlatforms;
  if (ops.onlineSelectedCourier) r.onlineSelectedCourier = ops.onlineSelectedCourier;
  if (ops.onlineMonthlyParcels) r.onlineMonthlyParcels = ops.onlineMonthlyParcels;
  if (keep(fin.costHistory.length)) r.costHistory = fin.costHistory;
  // AI 생성 결과 — Supabase 동기화 (localStorage 소실 방지)
  if (Object.keys(rm.guideSelections).length) r.guideSelections = rm.guideSelections;
  if (rm.aiRoadmapResult) r.aiRoadmapResult = rm.aiRoadmapResult;
  if (prof.selectedInteriorConcept) r.selectedInteriorConcept = prof.selectedInteriorConcept;
  // 구독 관리 (usesSubscriptions 항상-전송 → 로드 후에만, 기본 false 가 서버 true 를 덮지 않게)
  if (includeEmpties) r.usesSubscriptions = prof.usesSubscriptions ?? false;
  if (keep(ops.subscriptionPlans.length)) r.subscriptionPlans = ops.subscriptionPlans;
  if (keep(ops.subscribers.length)) r.subscribers = ops.subscribers;
  // 마케팅
  {
    const mkt = useMarketingStore.getState();
    if (keep(mkt.campaigns.length)) r.marketingCampaigns = mkt.campaigns;
    if (mkt.monthlyBudget > 0) r.marketingMonthlyBudget = mkt.monthlyBudget;
    if (keep(mkt.promoCodes.length)) r.promoCodes = mkt.promoCodes;
    if (keep(mkt.playbookChecklist.length)) r.playbookChecklist = mkt.playbookChecklist;
  }
  // 에이전트 on/off 설정 — 웹·앱 동기화 (항상-전송 → 로드 후에만, 기본값이 서버 설정 덮지 않게)
  if (includeEmpties) r.agentSettings = useAgentsStore.getState().enabledAgents;
  // 고객 인터뷰 — Mom Test 노트 + AI 패턴 분석
  {
    const iv = useInterviewStore.getState();
    if (keep(iv.customerInterviews?.length ?? 0)) {
      r.customerInterviews = iv.customerInterviews;
    }
    if (iv.patternAnalysis) {
      r.interviewPatternAnalysis = iv.patternAnalysis;
    }
  }
  // 시간 로그 — Drucker 매일 저녁 5분 체크인 (사장님 직접 입력)
  {
    const tl = useTimeLogStore.getState();
    if (keep(tl.entries?.length ?? 0)) {
      r.timeLogEntries = tl.entries;
    }
    if (includeEmpties) r.timeLogEnabled = tl.enabled;
  }
  // 현금흐름 설정 — Cash-flow Crunch Tracker (사장님 직접 입력, 손실 시 큰 손실)
  {
    const cf = useCashflowStore.getState();
    // setupCompletedAt·잔고·고정비·매출집계기준 중 하나라도 있으면 의미 있는 설정으로 간주해 저장
    if (cf.setupCompletedAt || cf.currentBalance > 0 || cf.fixedExpenses.length > 0 || cf.revenueBasis) {
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
        ...(cf.revenueBasis ? { revenueBasis: cf.revenueBasis } : {}),
      };
    }
  }

  // ── 내 가게 store 수집 ──
  // 🛑 storeInfo 전체(주소·사업자등록번호·전화·PII 등)는 빈 값도 `|| null` 로 항상 보내므로,
  //   서버 로드 전(includeEmpties=false)엔 절대 보내면 안 된다 — 다른 기기 첫 진입 시 빈 상태가
  //   서버의 실제 매장정보·사업자번호를 통째로 null 로 덮어쓴다(가장 큰 데이터 유실 노출).
  //   로드 완료(includeEmpties=true) 후에만 수집한다. ("사장이 지웠을 수 있음"=빈값 전송은 로드 후에만 유효.)
  if (includeEmpties) try {
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
    // 예약·이커머스 입력을 industrySpecifics 예약 키에 합쳐 보낸다(별도 컬럼 없이 동기화).
    //   booking/ecommerce store 가 SSOT 이므로 매 수집마다 fresh non-demo 데이터로 덮어쓴다.
    //   includeEmpties=true(서버 로드 후) 일 때만 실행되므로 빈 상태가 서버를 지우지 않는다.
    const bs = useBookingStore.getState();
    const es = useEcommerceStore.getState();
    r.industrySpecifics = {
      ...si.industrySpecifics,
      __bookings: {
        bookings: bs.bookings.filter((b) => !b.isDemo),
        providers: bs.providers.filter((p) => !p.isDemo),
      },
      __ecommerce: {
        adSpends: es.adSpends.filter((a) => !a.isDemo),
        returns: es.returns.filter((rt) => !rt.isDemo),
      },
    };
    r.businessDocuments = si.businessDocuments;
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
    setSelectedSpecialtyId,
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
  // 2단계 실시간 동기화 — 유저별 채널 1회 구독 + 스로틀된 재조회.
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const realtimeUserRef = useRef<string | null>(null);
  const realtimeThrottleRef = useRef(0);
  // 트레일링 리로드 타이머 — throttle 윈도우 안에서 온 마지막 변경이 누락되지 않게 보장.
  const realtimeTrailingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * In-flight guard — 같은 user_store_data row 에 4채널이 동시 upsert 하면 stale 가 fresh 를
   * 덮어쓸 위험. 모든 saveStoreData 호출은 이 guard 를 거쳐 직전 호출이 끝난 뒤 실행.
   * (2026-05-18 audit fix)
   */
  const storeDataInflightRef = useRef<Promise<unknown> | null>(null);
  /**
   * Reset 도중 autosave 콜백이 실행되는 것을 차단하는 동기 플래그.
   *  React state (`persistenceReady`) 는 비동기라 setTimeout 콜백이 fire 할 때
   *  이미 false 가 됐다고 보장 못 함. 이 ref 로 콜백 시작 시점에 즉시 차단.
   */
  const isResettingRef = useRef(false);
  /**
   * 서버 store data(applyStoreData) 를 한 번이라도 받았는지 동기 플래그.
   *  true 일 때만 collectStoreData(includeEmpties=true) 로 빈 배열까지 전송 → 삭제 반영.
   *  hydrate 전/로드 실패/계정전환 윈도우에는 false 라, 일시적 빈 store 가 서버를 지우지 않는다.
   */
  const storeDataReadyRef = useRef(false);

  // ── In-flight serializer for store data upsert ──
  // 4채널 (800ms autosave / 1s debounce / 5s interval / immediate) 이 동시 호출되면 stale 가
  // fresh 를 덮을 수 있다. 모든 saveStoreData 호출은 이 함수를 거쳐 직전 in-flight 이 끝난
  // 뒤 실행된다.
  const safeSaveStoreData = async (payload: Partial<UserStoreData>) => {
    if (storeDataInflightRef.current) {
      try { await storeDataInflightRef.current; } catch { /* ignore prior failure */ }
    }
    const p = saveStoreData(supabase, payload).finally(() => {
      if (storeDataInflightRef.current === p) storeDataInflightRef.current = null;
    });
    storeDataInflightRef.current = p;
    return p;
  };

  // ── connectAndLoad ──
  const connectAndLoad = async () => {
    if (connectLoadingRef.current) return;
    connectLoadingRef.current = true;
    try {
      const result = await bootstrapAccountWorkspace(supabase);
      const userLabel = result.user.email ?? copy.common.account;
      // 사용자 표시 이름 — 이메일 가입은 user_metadata.name, 소셜(카카오 등)은 provider 별로
      // preferred_username/nickname/user_name 등에 닉네임이 들어온다. ⚠️ 카카오는 account_email 이
      // 비즈앱 전용이라 이메일이 null 일 수 있으므로(email-less 가입), 이름은 이메일과 무관하게 메타에서 도출.
      const meta = (result.user.user_metadata ?? {}) as Record<string, unknown>;
      const pickName = (...keys: string[]): string => {
        for (const k of keys) {
          const v = meta[k];
          if (typeof v === "string" && v.trim().length > 0) return v.trim();
        }
        return "";
      };
      const rawName = pickName("name", "full_name", "preferred_username", "nickname", "user_name");
      setUserName(rawName.length > 0 ? rawName : null);

      // CRITICAL: 계정별 로컬 캐시 격리 — *내 uid 캐시일 때만* hydrate, 아니면 안 읽고 전부 제거.
      //   skipHydration(자동 hydrate 차단) + 여기서만 명시 hydrate → 새 계정이 이전 계정 캐시를
      //   보던 P0 누출(동명이인 naver↔gmail) 구조적 차단. ("지우기 의존"이 아니라 "안 읽기".)
      const { switched } = await hydrateStoresForUser(result.user.id);
      if (switched) resetCircuit();  // 이전 계정에서 trip 된 저장 차단을 새 계정으로 이월하지 않음
      // 새 로드 사이클 시작 — applyStoreData 로 서버 데이터를 받기 전까지는 빈 배열 전송 금지.
      storeDataReadyRef.current = false;

      setAuthLabel(`${userLabel} · ${result.user.id.slice(0, 8)}`);
      setRequiresAuth(false);
      setAuthResolved(true);

      // ── 2단계 실시간 동기화 — 유저별 채널 1회 구독 (user_store_data·business_profiles 본인 행) ──
      //   변경 수신 시 5초 스로틀된 재조회(flush 우선 → connectAndLoad). connectAndLoad 가 재진입해도
      //   같은 user 면 채널 재생성 skip. iOS·다른 기기에서 저장한 내용이 웹에 즉시 반영되게 한다.
      if (realtimeUserRef.current !== result.user.id) {
        if (realtimeChannelRef.current) {
          void supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
        if (realtimeTrailingRef.current) {
          clearTimeout(realtimeTrailingRef.current);
          realtimeTrailingRef.current = null;
        }
        const uid = result.user.id;
        // 원격 변경 → 재조회(전체 재수화). 빈 로컬 push 금지(로드 전) + 최신 스냅샷 fetch.
        const doReload = () => {
          void (async () => {
            try {
              // 🛑 서버 로드 완료 전엔 빈 로컬 push 금지 — 다른 기기 저장이 echo 됐을 때
              //   아직 로드 안 한 이 기기가 빈/기본 상태를 서버에 덮어쓰는 것을 차단(cross-device wipe).
              if (storeDataReadyRef.current) await flushStoreDataImmediate();
            } catch {
              /* flush 실패해도 재조회 진행 */
            }
            void connectAndLoad();
          })();
        };
        // throttle: leading-edge 즉시 + trailing(윈도우 내 추가 변경의 마지막을 반드시 반영).
        //   종전 5초 leading-only 는 (1) 지연이 길고 (2) 윈도우 내 마지막 변경을 *드롭* 해
        //   B가 최대 5초 stale + 누락 가능했음 → 1.5초 + trailing 으로 "바로바로·누락 0" 보장.
        const REALTIME_THROTTLE_MS = 1500;
        const onRemote = () => {
          // Zustand 외 독립 hydrate 카드도 재조회하도록 항상 즉시 알림 (throttle 무관 — 비용 저렴).
          notifyRemoteDataChanged();
          const now = Date.now();
          const since = now - realtimeThrottleRef.current;
          if (since >= REALTIME_THROTTLE_MS) {
            // leading-edge: 즉시 재조회.
            realtimeThrottleRef.current = now;
            doReload();
          } else if (!realtimeTrailingRef.current) {
            // 윈도우 내 변경 — 마지막 변경이 누락되지 않게 남은 시간 뒤 1회 재조회 예약.
            realtimeTrailingRef.current = setTimeout(() => {
              realtimeTrailingRef.current = null;
              realtimeThrottleRef.current = Date.now();
              doReload();
            }, REALTIME_THROTTLE_MS - since);
          }
        };
        const ch = supabase
          .channel(`buildup-sync-${uid}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "user_store_data", filter: `user_id=eq.${uid}` }, onRemote)
          .on("postgres_changes", { event: "*", schema: "public", table: "business_profiles", filter: `user_id=eq.${uid}` }, onRemote)
          // coaching_history — 코칭 일지는 Zustand 가 아니라 CoachingHistoryCard 가 자체 fetch.
          //   connectAndLoad 와 무관하므로 가벼운 알림만 발행해 카드가 재-hydrate 하게 한다.
          .on("postgres_changes", { event: "*", schema: "public", table: "coaching_history", filter: `user_id=eq.${uid}` }, () => notifyRemoteDataChanged())
          // roadmaps — 로드맵 진행도(stage_decisions) 즉시 양방향 동기화. stage_decisions 는 user_id
          //   컬럼이 없어 직접 필터 구독 불가하므로, 양쪽(웹 saveRoadmapState / iOS upsert)이 저장 시
          //   roadmaps.updated_at 을 bump 하고, 여기서 roadmaps(user_id 필터)를 구독해 앱·다른 기기의
          //   로드맵 변경을 즉시 재조회한다.
          .on("postgres_changes", { event: "*", schema: "public", table: "roadmaps", filter: `user_id=eq.${uid}` }, onRemote)
          // ── 동기화 메시 확장(2026-06-22) — owner 편집 테이블 5종 ──
          //   분류: 대시보드(Zustand) 재조회가 필요한 데이터는 onRemote(=flush+connectAndLoad),
          //         Zustand 밖에서 독립 hydrate 하는 카드는 가벼운 notifyRemoteDataChanged() 만 발행
          //         (해당 카드가 buildup:remote-data-changed 를 구독해 자체 refetch — CoachingHistoryCard 패턴).
          //   ⚠️ user_id 가 PK 가 아닌 테이블(csv·program·store)은 RLS+FULL 상 DELETE old 레코드에
          //      user_id 가 빠질 수 있어 삭제 이벤트 필터가 미스날 수 있음(마이그레이션 주석 참고). INSERT/UPDATE 는 정상.

          // marketing_play_progress — 주간 마케팅 플레이 체크. MarketingSurface 가 자체 fetch → 알림만.
          .on("postgres_changes", { event: "*", schema: "public", table: "marketing_play_progress", filter: `user_id=eq.${uid}` }, () => notifyRemoteDataChanged())
          // saas_funnel_manual_weekly — 수동 퍼널 입력. useFunnelMetrics 가 이미 이벤트 구독 → 알림만.
          .on("postgres_changes", { event: "*", schema: "public", table: "saas_funnel_manual_weekly", filter: `user_id=eq.${uid}` }, () => notifyRemoteDataChanged())
          // program_applications — 지원사업 신청. GuidesView 신청버튼 상태가 이벤트로 갱신 → 알림만.
          .on("postgres_changes", { event: "*", schema: "public", table: "program_applications", filter: `user_id=eq.${uid}` }, () => notifyRemoteDataChanged())
          // csv_revenue_uploads/entries — 수동 매출 CSV. 매출(대시보드 Zustand)에 반영되므로 full 재조회.
          //   onRemote 가 notifyRemoteDataChanged 도 발행하므로 CsvUploadCard 목록도 함께 refetch.
          .on("postgres_changes", { event: "*", schema: "public", table: "csv_revenue_uploads", filter: `user_id=eq.${uid}` }, onRemote)
          .on("postgres_changes", { event: "*", schema: "public", table: "csv_revenue_entries", filter: `user_id=eq.${uid}` }, onRemote)
          // store_members — 팀 멤버십(역할 staff/manager). 역할은 connectAndLoad 가 재-resolve 하므로 full 재조회.
          //   owner 행은 owner_user_id, 직원(staff) 본인 기기는 member_user_id 로 잡히므로 양쪽 필터 구독.
          .on("postgres_changes", { event: "*", schema: "public", table: "store_members", filter: `owner_user_id=eq.${uid}` }, onRemote)
          .on("postgres_changes", { event: "*", schema: "public", table: "store_members", filter: `member_user_id=eq.${uid}` }, onRemote)
          // store_invites — 팀 초대. 초대 생성/사용을 StaffOps·초대 흐름이 이벤트로 반영 → 알림만(owner 기준).
          .on("postgres_changes", { event: "*", schema: "public", table: "store_invites", filter: `owner_user_id=eq.${uid}` }, () => notifyRemoteDataChanged())
          .subscribe();
        realtimeChannelRef.current = ch;
        realtimeUserRef.current = uid;
      }

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
          // ⚠️ 2026-05-18: 종전엔 void fire-and-forget → RLS 거부/row 없음 시 silent fail.
          //   await + error 로깅으로 변경. 실패해도 resolvedRole 은 유지 (로컬 fallback).
          try {
            const { error: updErr } = await supabase
              .from("business_profiles")
              .update({ user_role: "owner" } as never)
              .eq("user_id", result.user.id);
            if (updErr) {
              console.warn("[connectAndLoad] business_profiles.user_role update failed:", updErr.message);
            }
          } catch (e) {
            console.warn("[connectAndLoad] business_profiles.user_role update threw:", e);
          }
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
      // healed 여부는 Sentry breadcrumb 로 추적 (프로덕션 콘솔 노출 방지)
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
      // specialty(세부업종) — industry-selection.inputs.specialtyId 에 저장됨.
      const loadedSpecialtyId = dec["industry-selection"]?.inputs?.specialtyId;
      if (typeof loadedSpecialtyId === "string" && loadedSpecialtyId) {
        setSelectedSpecialtyId(loadedSpecialtyId);
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
      // ⚠️ 2026-05-25 사장님 신고: "전부 초기화 후에도 상호명이 남는 경우 있음".
      //   원인: server 측 user_store_data 삭제가 RLS/네트워크 부분 실패한 후 verify SELECT 도
      //   permission denied 로 logged-and-skipped 되면 row 가 그대로 남음 → 다음 로드에서
      //   applyStoreData(storeData) 가 storeName 을 옛 값으로 복원 → 사장님 혼란.
      //   안전망: ?reset= URL 또는 pending_force_onboarding 플래그가 있으면 storeName / 영업시간
      //   같은 사용자 입력 필드는 server 값을 무시하고 빈 상태 유지.
      const justResetFlag = typeof window !== "undefined" && (
        new URLSearchParams(window.location.search).has("reset")
        || !!localStorage.getItem("pending_force_onboarding")
      );
      try {
        const storeData = await loadStoreData(supabase, result.user);
        if (storeData) {
          if (justResetFlag) {
            // reset 직후 — server 잔존 데이터 (delete partial fail) 무시. 사용자 의도는 "초기 상태".
          } else {
            applyStoreData(storeData);
          }
        } else {
          // 신규 계정 첫 진입: 이전 로컬 임시 캐시(있다면)를 1회만 Supabase 로 백업.
          //
          // ⚠️ 데이터 *진실의 원천(SSOT) 은 Supabase* 입니다. 이 분기는 신규 가입자 첫 1회만 실행되며,
          //    "데이터가 로컬에 저장된다" 는 의미가 *절대 아닙니다*. 이후 모든 입력은 즉시
          //    flushStoreDataImmediate → Supabase 로 영속화됩니다 (다른 기기·도메인 동일 이메일로
          //    로그인하면 그대로 보임).
          const localData = collectStoreData();
          const hasMeaningfulLocal = Object.keys(localData).length > 0;
          if (hasMeaningfulLocal) {
            await saveStoreData(supabase, localData, result.user).catch(() => {});
          }
        }
        // 서버 데이터 로드 사이클 정상 완료 — 이제부터 빈 배열 전송 허용(삭제 반영).
        //   loadStoreData 가 throw 하면 이 줄에 도달하지 않으므로 false 유지(서버 보호).
        storeDataReadyRef.current = true;
      } catch (err) {
        console.warn("[connectAndLoad] storeData load failed", err);
        // Silent fail — localStorage already loaded via useState initializers
      }

      // ── Owner 프로필 서버 복원 (기기 전환·재설치 대응) ──
      //   user_store_data.owner_profile_enc → 서버 복호화(봉투암호화) → 로컬 hydrate.
      //   KEK 미설정이면 204 반환 → 조용히 skip (로컬값 유지).
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (token) {
          const res = await fetch("/api/account/owner-profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok && res.status === 200) {
            const json = (await res.json()) as { ok: boolean; profile?: { birthYear?: number; ncbScore?: number; consideringClosure?: boolean; isDisabledOwner?: boolean } };
            if (json.ok && json.profile) {
              useProfileStore.getState().hydrateOwnerProfileFromServer(json.profile);
            }
          }
        }
      } catch {
        // 네트워크·파싱 실패 — 로컬값 유지, 무시
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
          const launchDate = getKstDate(new Date());
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
      const dismissed = localStorage.getItem("foundone_onboarding_dismissed") === "true";
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
        // 단일 SSOT(lib/utils/path-filter.ts) 사용 — 3곳 중복·diverge 제거.
        const isInPath = makeIsPathStage({
          industryCategoryId: cat ?? "",
          selectedIndustryId: subId,
          startupType: sType,
        });

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
        const curMonth = getKstDate(new Date()).slice(0, 7);
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
        await safeSaveStoreData(collectStoreData(storeDataReadyRef.current));
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
    // 회로 차단(store 채널) — 영구 실패 감지된 후엔 시도조차 안 함
    if (isCircuitBroken("store")) {
      throw new Error("CIRCUIT_BROKEN");
    }
    if (storeDataTimerRef.current) clearTimeout(storeDataTimerRef.current);
    onb.setPersistStatus("saving");
    try {
      await safeSaveStoreData(collectStoreData(storeDataReadyRef.current));
      recordSaveSuccess("store");
      onb.setPersistStatus("saved");
      onb.setPersistError(null);
      onb.setPersistLastSavedAt(Date.now());
      setTimeout(() => {
        if (useOnboardingStore.getState().persistStatus === "saved") {
          useOnboardingStore.getState().setPersistStatus("idle");
        }
      }, 2000);
    } catch (err) {
      const { message } = recordSaveFailure(err, "store");
      onb.setPersistStatus("error");
      onb.setPersistError(message);
      throw err;
    }
  };

  // ── Effects ──

  // 1. Initial connect on mount
  useEffect(() => {
    void connectAndLoad();
    return () => {
      // 2단계 realtime 채널 정리 — 언마운트 시 구독 해제(누수 방지).
      if (realtimeChannelRef.current) {
        void supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
        realtimeUserRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Finance panel URL sync
  useEffect(() => {
    const activeSurface = surface;
    if (activeSurface === "guides" && searchParams.get("panel") === "finance") {
      setShowFinancePanel(true);
    }
  }, [surface, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Auth state change listener
  //
  //  ⚠️ 이전 (race condition 버그): 마운트 시 getCurrentUser() 로 *네트워크 호출* 해서 user 가
  //     null 이면 setRequiresAuth(true) 설정. Vercel 환경 cold start / 라우팅 전환 직후 일시적
  //     null 반환 시 → Effect 1 의 connectAndLoad 가 false 로 설정한 직후 true 로 덮어써
  //     /auth 로 즉시 redirect → "한번 더 로그인해야 들어가는" 증상 (사장님 보고 2026-05-10).
  //
  //  Fix: 초기 체크는 connectAndLoad (Effect 1) 가 *유일한 소스 오브 트루스*. 여기선 단지
  //       onAuthStateChange 리스너만 등록 — SIGN_IN/TOKEN_REFRESHED 이벤트로 connectAndLoad
  //       재실행. SIGNED_OUT 이벤트만 명시적으로 requiresAuth=true 처리.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // ⚠️ 2026-06-05 개인정보 수정: 로그아웃 시 로컬 캐시를 비우지 않으면 공용 PC 에서
        //   다음 계정 로그인 시 이전 계정의 상호명·매출 등 잔존값이 노출됨(applyStoreData 의
        //   `if (data.x)` 가드가 누락 필드를 안 덮으므로). 명시적으로 전부 wipe.
        storeDataReadyRef.current = false; // 로그아웃 — 빈 store 가 서버 지우지 않게
        clearLocalUserData();
        resetLocalState();
        resetCircuit();  // 저장 차단 상태도 초기화 — 다음 로그인 첫 저장이 지연되지 않게
        try { localStorage.removeItem("__foundone_uid"); } catch { /* storage 차단 무시 */ }
        setRequiresAuth(true);
        setAuthResolved(true);
        return;
      }
      // SIGN_IN / INITIAL_SESSION / TOKEN_REFRESHED — 데이터 재로드
      void connectAndLoad();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3b. 탭 포커스/가시성 복귀 시 원격 재조회 — 다른 기기·iOS 앱에서 저장한 내용을 웹에 반영.
  //   순서: (1) 미저장 store 데이터 먼저 flush(클로버 방지) → (2) connectAndLoad 재실행(프로필·
  //   store_data·로드맵 재하이드레이트). 10초 쓰로틀로 과도한 재조회 방지. connectAndLoad 는
  //   auth 의 SOT 라 미인증 시 알아서 처리. (mount 직후 중복 로드 방지 위해 lastSync 를 now 로 초기화.)
  useEffect(() => {
    let lastSync = Date.now();
    const refetchOnFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastSync < 10_000) return;
      lastSync = now;
      // 독립 hydrate 카드(코칭 일지 등)도 포커스 복귀 시 재조회 — iOS 에서 바꾼 내용 즉시 반영.
      notifyRemoteDataChanged();
      void (async () => {
        try {
          await flushStoreDataImmediate();
        } catch {
          /* flush 실패해도 재조회는 진행 */
        }
        void connectAndLoad();
      })();
    };
    window.addEventListener("focus", refetchOnFocus);
    document.addEventListener("visibilitychange", refetchOnFocus);
    return () => {
      window.removeEventListener("focus", refetchOnFocus);
      document.removeEventListener("visibilitychange", refetchOnFocus);
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
      if (isResettingRef.current) return; // reset 진행 중 — autosave 차단
      // 회로 차단(roadmap 채널 — store 와 분리) — 영구 실패 후엔 시도조차 안 함 (콘솔/네트워크 스팸 방지)
      if (isCircuitBroken("roadmap")) return;
      const snap = roadmapSnapshotRef.current;
      // ⚠️ 두 save 를 독립적으로 처리 — 하나가 실패해도 다른 하나는 진행, 각자 회로 차단기 알림.
      //   이전엔 Promise.all 로 묶고 saveRoadmapState 실패는 recordSaveFailure 호출 안 했음.
      //   결과: roadmap save 가 영구 실패 (마이그레이션 미적용 등) 해도 회로 차단 안 되고
      //         매 800ms 마다 시도 → 콘솔 스팸 + 사용자가 "저장 잘 되나?" 의심하게 됨.
      // ⚠️ 2026-05-18: Effect 4 는 *roadmap 전용* 으로 단순화. 종전엔 같은 800ms 마다 storeData 도
      //   같이 저장해서 1초 debounce flushStoreData 와 5초 interval 과 race → stale 가 fresh 덮을
      //   위험. storeData 는 flushStoreData / flushStoreDataImmediate / 5초 interval 셋이 모두
      //   safeSaveStoreData 를 거치므로 race 없이 직렬화됨. roadmap 만 여기서.
      saveRoadmapState(supabase, {
        roadmap: snap.roadmap,
        decisions: snap.decisions,
        tasks: snap.taskMap,
      }).then(
        () => {
          recordSaveSuccess("roadmap");
          setPersistenceLabel(copy.home.autosaved);
        },
        (err) => {
          recordSaveFailure(err, "roadmap");
          setPersistenceLabel(
            err instanceof Error
              ? `${copy.home.autosaveFailed}: ${err.message}`
              : copy.home.autosaveFailed,
          );
        },
      );
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
    // 서버 hydrate 완료 후에만 빈 배열 포함(삭제 반영). 그 전엔 보수적으로 비움 생략.
    storeDataSnapshotRef.current = collectStoreData(storeDataReadyRef.current);
  });

  useEffect(() => {
    if (!persistenceReady) return;

    const interval = setInterval(() => {
      if (isResettingRef.current) return;
      if (!useOnboardingStore.getState().persistenceReady) return;
      // 🛑 데이터 유실 방지(cross-device wipe): 서버 store 데이터 로드(applyStoreData)가
      //   끝나기 전엔 자동저장 금지. persistenceReady 는 로드맵 복원 직후(서버 store 로드 *전*)
      //   true 가 되므로, 이 가드가 없으면 다른 기기(B)의 빈 로컬 상태가 인터벌로 서버에 저장돼
      //   기기 A 가 5일간 쌓은 매출을 덮어쓴다. collectStoreData 의 storeDataReadyRef 규약을 동일 적용.
      if (!storeDataReadyRef.current) return;
      // circuit breaker(store 채널) — 영구 실패 후엔 시도조차 안 함
      if (isCircuitBroken("store")) return;
      safeSaveStoreData(storeDataSnapshotRef.current).then(
        () => { recordSaveSuccess("store"); },
        (err) => {
          const { message, tripped } = recordSaveFailure(err, "store");
          const onb = useOnboardingStore.getState();
          const isAuth = /AUTH_REQUIRED/.test(message);
          onb.setPersistStatus("error");
          // raw "AUTH_REQUIRED" 영문 노출 금지 — 사람이 읽을 메시지로.
          onb.setPersistError(isAuth ? "세션이 만료됐어요. 다시 로그인하면 저장이 재개됩니다." : message);
          // 일시적 토큰 갱신 중 조기 redirect(과거 "한번 더 로그인" 버그) 방지 위해
          //   *지속 실패(circuit tripped)* 일 때만 재로그인 유도. (SIGNED_OUT 은 별도로 즉시 처리됨.)
          if (isAuth && tripped) setRequiresAuth(true);
        },
      );
    }, 5000);

    const handleBeforeUnload = () => {
      try {
        const data = storeDataSnapshotRef.current;
        if (data && Object.keys(data).length > 0) {
          localStorage.setItem("__foundone_last_snapshot", JSON.stringify(data));
          localStorage.setItem("__foundone_last_snapshot_at", new Date().toISOString());
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
