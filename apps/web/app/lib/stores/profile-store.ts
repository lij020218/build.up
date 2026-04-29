import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistedBusinessProfile } from "@build-up/shared";

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
  cpaDecision: "cpa" | "self" | null;
  usesSubscriptions: boolean;
  selectedInteriorConcept: string | null;
  profile: PersistedBusinessProfile | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  businessLaunched: boolean;
  businessLaunchedDate: string | null;
  /** 스타트업 운영 모드 — 같은 sub-industry 라도 인디/부트스트랩/시드/시리즈A 비용·자금원 다름 */
  startupOperatingMode: "indie" | "bootstrap" | "seed" | "seriesA";
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
  setCpaDecision: (v: "cpa" | "self" | null) => void;
  setUsesSubscriptions: (v: boolean) => void;
  setSelectedInteriorConcept: (v: string | null) => void;
  setProfile: (v: PersistedBusinessProfile | null) => void;
  setSaveStatus: (v: "idle" | "saving" | "saved" | "error") => void;
  setBusinessLaunched: (v: boolean) => void;
  setBusinessLaunchedDate: (v: string | null) => void;
  setStartupOperatingMode: (v: "indie" | "bootstrap" | "seed" | "seriesA") => void;
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
  cpaDecision: null,
  usesSubscriptions: false,
  selectedInteriorConcept: null,
  profile: null,
  saveStatus: "idle",
  businessLaunched: false,
  businessLaunchedDate: null,
  startupOperatingMode: "bootstrap",
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
      setCpaDecision: (v) => set({ cpaDecision: v }),
      setUsesSubscriptions: (v) => set({ usesSubscriptions: v }),
      setSelectedInteriorConcept: (v) => set({ selectedInteriorConcept: v }),
      setProfile: (v) => set({ profile: v }),
      setSaveStatus: (v) => set({ saveStatus: v }),
      setBusinessLaunched: (v) => set({ businessLaunched: v }),
      setBusinessLaunchedDate: (v) => set({ businessLaunchedDate: v }),
      setStartupOperatingMode: (v) => set({ startupOperatingMode: v }),
      resetAll: () => set(initialState),
    }),
    {
      name: "buildup-profile",
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
        cpaDecision: state.cpaDecision,
        usesSubscriptions: state.usesSubscriptions,
        businessLaunched: state.businessLaunched,
        businessLaunchedDate: state.businessLaunchedDate,
        startupOperatingMode: state.startupOperatingMode,
        selectedInteriorConcept: state.selectedInteriorConcept,
      }),
    },
  ),
);
