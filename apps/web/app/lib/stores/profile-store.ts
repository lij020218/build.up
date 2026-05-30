import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistedBusinessProfile } from "@foundone/shared";

type ProfileState = {
  selectedIndustryId: string | undefined;
  selectedIndustryCategoryId: string;
  /** 세부 컨셉/특화 — sub-industry 안에서 한 번 더 분기 (예: korean-casual → "국밥집") */
  selectedSpecialtyId: string | undefined;
  selectedBusinessModelId: string | undefined;
  selectedBudget: number | undefined;
  budgetInputText: string;
  initialOperatingCapital: number | undefined;
  operatingCapitalInputText: string;
  selectedOpenDate: string | undefined;
  selectedLocationId: string | undefined;
  preferredRegionInput: string;
  locationMode: "recommended" | "direct";
  startupType: "franchise" | "independent" | "undecided" | undefined;
  selectedFranchiseBrandId: string | null;
  showFranchisePicker: boolean;
  storeName: string;
  /** 영업 시작 시각 "HH:MM" (24h KST) — 오프라인 매장만. 온라인·스타트업은 null. */
  businessOpenTime: string | null;
  /** 영업 종료 시각 "HH:MM" (24h KST). 카페 22:00, 바 01:00 등. 24h 영업이면 null. */
  businessCloseTime: string | null;
  cpaDecision: "cpa" | "self" | null;
  usesSubscriptions: boolean;
  /** 수익 모델 — 어떻게 돈을 받는가. business-model 단계에서 결정.
   *  "subscription" | "api-usage" | "one-time" | "freemium" | "marketplace-fee" | "ads" | "hybrid" */
  selectedRevenueModelId: string | null;
  selectedInteriorConcept: string | null;
  profile: PersistedBusinessProfile | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  businessLaunched: boolean;
  businessLaunchedDate: string | null;
  /** 스타트업 운영 모드 — 같은 sub-industry 라도 인디/부트스트랩/시드/시리즈A 비용·자금원 다름 */
  startupOperatingMode: "indie" | "bootstrap" | "seed" | "seriesA";
  /**
   * 매월 직원 월급 지급일 (1~31). null = 미설정 → 알림 비활성.
   *  사용자 요청 (2026-05-09): 임금체불 방지 — D-7 / D-2 / D-day 사장님께 알림.
   */
  payDay: number | null;
  /**
   * North Star Metric — 사장님이 직접 고른 "내 사업의 단 1개 숫자".
   *  CEOMorningHero 의 거대 hero number 가 이걸 따라감.
   *  null = 자동 (스타트업→런웨이, 외식→일매출). 베스트 프랙티스: YC, Facebook MAU, Uber weekly trips.
   *  옵션: "auto" | "todaySales" | "avgDailySales14d" | "customers" | "aov" | "weeklySales7d" | "monthlyProfit" | "runway" | "mrr"
   */
  northStarMetric: string | null;
  /**
   * 사장님이 숨긴 대시보드 카드 ID 리스트.
   *  카드 id 카탈로그 → `app/lib/dashboard-cards-meta.ts` (SSOT).
   *  essential 카드는 메타에서 차단되어 여기 들어와도 무시됨 (안전망).
   */
  hiddenCards: string[];
};

type ProfileActions = {
  setSelectedIndustryId: (v: string | undefined) => void;
  setSelectedIndustryCategoryId: (v: string) => void;
  setSelectedSpecialtyId: (v: string | undefined) => void;
  setSelectedBusinessModelId: (v: string | undefined) => void;
  setSelectedBudget: (v: number | undefined) => void;
  setBudgetInputText: (v: string) => void;
  setInitialOperatingCapital: (v: number | undefined) => void;
  setOperatingCapitalInputText: (v: string) => void;
  setSelectedOpenDate: (v: string | undefined) => void;
  setSelectedLocationId: (v: string | undefined) => void;
  setPreferredRegionInput: (v: string) => void;
  setLocationMode: (v: "recommended" | "direct") => void;
  setStartupType: (v: "franchise" | "independent" | "undecided" | undefined) => void;
  setSelectedFranchiseBrandId: (v: string | null) => void;
  setShowFranchisePicker: (v: boolean) => void;
  setStoreName: (v: string) => void;
  setBusinessOpenTime: (v: string | null) => void;
  setBusinessCloseTime: (v: string | null) => void;
  setCpaDecision: (v: "cpa" | "self" | null) => void;
  setPayDay: (v: number | null) => void;
  setUsesSubscriptions: (v: boolean) => void;
  setSelectedRevenueModelId: (v: string | null) => void;
  setSelectedInteriorConcept: (v: string | null) => void;
  setProfile: (v: PersistedBusinessProfile | null) => void;
  setSaveStatus: (v: "idle" | "saving" | "saved" | "error") => void;
  setBusinessLaunched: (v: boolean) => void;
  setBusinessLaunchedDate: (v: string | null) => void;
  setStartupOperatingMode: (v: "indie" | "bootstrap" | "seed" | "seriesA") => void;
  setNorthStarMetric: (v: string | null) => void;
  setHiddenCards: (v: string[]) => void;
  toggleHiddenCard: (id: string) => void;
  resetAll: () => void;
};

const initialState: ProfileState = {
  selectedIndustryId: undefined,
  selectedIndustryCategoryId: "food",
  selectedSpecialtyId: undefined,
  selectedBusinessModelId: undefined,
  selectedBudget: undefined,
  budgetInputText: "",
  initialOperatingCapital: undefined,
  operatingCapitalInputText: "",
  selectedOpenDate: undefined,
  selectedLocationId: undefined,
  preferredRegionInput: "",
  locationMode: "recommended",
  startupType: undefined,
  selectedFranchiseBrandId: null,
  showFranchisePicker: false,
  storeName: "",
  businessOpenTime: null,
  businessCloseTime: null,
  cpaDecision: null,
  payDay: null,
  usesSubscriptions: false,
  selectedRevenueModelId: null,
  selectedInteriorConcept: null,
  profile: null,
  saveStatus: "idle",
  businessLaunched: false,
  businessLaunchedDate: null,
  startupOperatingMode: "bootstrap",
  northStarMetric: null,
  hiddenCards: [],
};

export const useProfileStore = create<ProfileState & ProfileActions>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedIndustryId: (v) => set({ selectedIndustryId: v }),
      setSelectedIndustryCategoryId: (v) => set({ selectedIndustryCategoryId: v }),
      setSelectedSpecialtyId: (v) => set({ selectedSpecialtyId: v }),
      setSelectedBusinessModelId: (v) => set({ selectedBusinessModelId: v }),
      setSelectedBudget: (v) => set({ selectedBudget: v }),
      setBudgetInputText: (v) => set({ budgetInputText: v }),
      setInitialOperatingCapital: (v) => set({ initialOperatingCapital: v }),
      setOperatingCapitalInputText: (v) => set({ operatingCapitalInputText: v }),
      setSelectedOpenDate: (v) => set({ selectedOpenDate: v }),
      setSelectedLocationId: (v) => set({ selectedLocationId: v }),
      setPreferredRegionInput: (v) => set({ preferredRegionInput: v }),
      setLocationMode: (v) => set({ locationMode: v }),
      setStartupType: (v) => set({ startupType: v }),
      setSelectedFranchiseBrandId: (v) => set({ selectedFranchiseBrandId: v }),
      setShowFranchisePicker: (v) => set({ showFranchisePicker: v }),
      setStoreName: (v) => set({ storeName: v }),
      setBusinessOpenTime: (v) => set({ businessOpenTime: v }),
      setBusinessCloseTime: (v) => set({ businessCloseTime: v }),
      setCpaDecision: (v) => set({ cpaDecision: v }),
      setPayDay: (v) => set({ payDay: v }),
      setUsesSubscriptions: (v) => set({ usesSubscriptions: v }),
      setSelectedRevenueModelId: (v) => set({ selectedRevenueModelId: v, usesSubscriptions: v === "subscription" || v === "freemium" || v === "hybrid" }),
      setSelectedInteriorConcept: (v) => set({ selectedInteriorConcept: v }),
      setProfile: (v) => set({ profile: v }),
      setSaveStatus: (v) => set({ saveStatus: v }),
      setBusinessLaunched: (v) => set({ businessLaunched: v }),
      setBusinessLaunchedDate: (v) => set({ businessLaunchedDate: v }),
      setStartupOperatingMode: (v) => set({ startupOperatingMode: v }),
      setNorthStarMetric: (v) => set({ northStarMetric: v }),
      setHiddenCards: (v) => set({ hiddenCards: Array.from(new Set(v)) }),
      toggleHiddenCard: (id) => set((s) => ({
        hiddenCards: s.hiddenCards.includes(id)
          ? s.hiddenCards.filter((x) => x !== id)
          : [...s.hiddenCards, id],
      })),
      resetAll: () => set(initialState),
    }),
    {
      name: "foundone-profile",
      partialize: (state) => ({
        selectedIndustryId: state.selectedIndustryId,
        selectedIndustryCategoryId: state.selectedIndustryCategoryId,
        selectedSpecialtyId: state.selectedSpecialtyId,
        selectedBusinessModelId: state.selectedBusinessModelId,
        selectedBudget: state.selectedBudget,
        initialOperatingCapital: state.initialOperatingCapital,
        selectedOpenDate: state.selectedOpenDate,
        selectedLocationId: state.selectedLocationId,
        preferredRegionInput: state.preferredRegionInput,
        locationMode: state.locationMode,
        startupType: state.startupType,
        selectedFranchiseBrandId: state.selectedFranchiseBrandId,
        storeName: state.storeName,
        businessOpenTime: state.businessOpenTime,
        businessCloseTime: state.businessCloseTime,
        cpaDecision: state.cpaDecision,
        payDay: state.payDay,
        usesSubscriptions: state.usesSubscriptions,
        selectedRevenueModelId: state.selectedRevenueModelId,
        businessLaunched: state.businessLaunched,
        businessLaunchedDate: state.businessLaunchedDate,
        startupOperatingMode: state.startupOperatingMode,
        northStarMetric: state.northStarMetric,
        hiddenCards: state.hiddenCards,
        selectedInteriorConcept: state.selectedInteriorConcept,
      }),
    },
  ),
);
