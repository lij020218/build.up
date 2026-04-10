import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistedBusinessProfile } from "@build-up/shared";

type ProfileState = {
  selectedIndustryId: string | undefined;
  selectedIndustryCategoryId: string;
  selectedBusinessModelId: string | undefined;
  selectedBudget: number | undefined;
  budgetInputText: string;
  selectedOpenDate: string | undefined;
  selectedLocationId: string | undefined;
  preferredRegionInput: string;
  locationMode: "recommended" | "direct";
  startupType: "franchise" | "independent" | "undecided" | undefined;
  selectedFranchiseBrandId: string | null;
  showFranchisePicker: boolean;
  storeName: string;
  cpaDecision: "cpa" | "self" | null;
  selectedInteriorConcept: string | null;
  profile: PersistedBusinessProfile | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  businessLaunched: boolean;
  businessLaunchedDate: string | null;
};

type ProfileActions = {
  setSelectedIndustryId: (v: string | undefined) => void;
  setSelectedIndustryCategoryId: (v: string) => void;
  setSelectedBusinessModelId: (v: string | undefined) => void;
  setSelectedBudget: (v: number | undefined) => void;
  setBudgetInputText: (v: string) => void;
  setSelectedOpenDate: (v: string | undefined) => void;
  setSelectedLocationId: (v: string | undefined) => void;
  setPreferredRegionInput: (v: string) => void;
  setLocationMode: (v: "recommended" | "direct") => void;
  setStartupType: (v: "franchise" | "independent" | "undecided" | undefined) => void;
  setSelectedFranchiseBrandId: (v: string | null) => void;
  setShowFranchisePicker: (v: boolean) => void;
  setStoreName: (v: string) => void;
  setCpaDecision: (v: "cpa" | "self" | null) => void;
  setSelectedInteriorConcept: (v: string | null) => void;
  setProfile: (v: PersistedBusinessProfile | null) => void;
  setSaveStatus: (v: "idle" | "saving" | "saved" | "error") => void;
  setBusinessLaunched: (v: boolean) => void;
  setBusinessLaunchedDate: (v: string | null) => void;
  resetAll: () => void;
};

const initialState: ProfileState = {
  selectedIndustryId: undefined,
  selectedIndustryCategoryId: "food",
  selectedBusinessModelId: undefined,
  selectedBudget: undefined,
  budgetInputText: "",
  selectedOpenDate: undefined,
  selectedLocationId: undefined,
  preferredRegionInput: "",
  locationMode: "recommended",
  startupType: undefined,
  selectedFranchiseBrandId: null,
  showFranchisePicker: false,
  storeName: "",
  cpaDecision: null,
  selectedInteriorConcept: null,
  profile: null,
  saveStatus: "idle",
  businessLaunched: false,
  businessLaunchedDate: null,
};

export const useProfileStore = create<ProfileState & ProfileActions>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedIndustryId: (v) => set({ selectedIndustryId: v }),
      setSelectedIndustryCategoryId: (v) => set({ selectedIndustryCategoryId: v }),
      setSelectedBusinessModelId: (v) => set({ selectedBusinessModelId: v }),
      setSelectedBudget: (v) => set({ selectedBudget: v }),
      setBudgetInputText: (v) => set({ budgetInputText: v }),
      setSelectedOpenDate: (v) => set({ selectedOpenDate: v }),
      setSelectedLocationId: (v) => set({ selectedLocationId: v }),
      setPreferredRegionInput: (v) => set({ preferredRegionInput: v }),
      setLocationMode: (v) => set({ locationMode: v }),
      setStartupType: (v) => set({ startupType: v }),
      setSelectedFranchiseBrandId: (v) => set({ selectedFranchiseBrandId: v }),
      setShowFranchisePicker: (v) => set({ showFranchisePicker: v }),
      setStoreName: (v) => set({ storeName: v }),
      setCpaDecision: (v) => set({ cpaDecision: v }),
      setSelectedInteriorConcept: (v) => set({ selectedInteriorConcept: v }),
      setProfile: (v) => set({ profile: v }),
      setSaveStatus: (v) => set({ saveStatus: v }),
      setBusinessLaunched: (v) => set({ businessLaunched: v }),
      setBusinessLaunchedDate: (v) => set({ businessLaunchedDate: v }),
      resetAll: () => set(initialState),
    }),
    {
      name: "buildup-profile",
      partialize: (state) => ({
        selectedIndustryId: state.selectedIndustryId,
        selectedIndustryCategoryId: state.selectedIndustryCategoryId,
        selectedBusinessModelId: state.selectedBusinessModelId,
        selectedBudget: state.selectedBudget,
        selectedOpenDate: state.selectedOpenDate,
        selectedLocationId: state.selectedLocationId,
        preferredRegionInput: state.preferredRegionInput,
        locationMode: state.locationMode,
        startupType: state.startupType,
        selectedFranchiseBrandId: state.selectedFranchiseBrandId,
        storeName: state.storeName,
        cpaDecision: state.cpaDecision,
        businessLaunched: state.businessLaunched,
        businessLaunchedDate: state.businessLaunchedDate,
        selectedInteriorConcept: state.selectedInteriorConcept,
      }),
    },
  ),
);
