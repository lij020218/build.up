import { create } from "zustand";

type OnboardingState = {
  showOnboardingChoice: boolean;
  showExistingOnboarding: boolean;
  showAIRoadmapWizard: boolean;
  showRoleSelection: boolean;
  userRole: "owner" | "staff" | "manager";
  isResetting: boolean;
  resetProgress: number;
  authLabel: string;
  persistenceLabel: string;
  persistenceReady: boolean;
  authResolved: boolean;
  requiresAuth: boolean;
  // 기타 UI
  showProfileDetails: boolean;
  showMonthlyCostPrompt: boolean;
  lastUnlocked: string[];
  selectedStoreIndex: number | null;
  transitionNotice: { title: string; body: string } | null;
};

type OnboardingActions = {
  setShowOnboardingChoice: (v: boolean) => void;
  setShowExistingOnboarding: (v: boolean) => void;
  setShowAIRoadmapWizard: (v: boolean) => void;
  setShowRoleSelection: (v: boolean) => void;
  setUserRole: (v: "owner" | "staff" | "manager") => void;
  setIsResetting: (v: boolean) => void;
  setResetProgress: (v: number) => void;
  setAuthLabel: (v: string) => void;
  setPersistenceLabel: (v: string) => void;
  setPersistenceReady: (v: boolean) => void;
  setAuthResolved: (v: boolean) => void;
  setRequiresAuth: (v: boolean) => void;
  setShowProfileDetails: (v: boolean) => void;
  setShowMonthlyCostPrompt: (v: boolean) => void;
  setLastUnlocked: (v: string[]) => void;
  setSelectedStoreIndex: (v: number | null) => void;
  setTransitionNotice: (v: { title: string; body: string } | null) => void;
  resetAll: () => void;
};

const initialState: OnboardingState = {
  showOnboardingChoice: false,
  showExistingOnboarding: false,
  showAIRoadmapWizard: false,
  showRoleSelection: false,
  userRole: "owner",
  isResetting: false,
  resetProgress: 0,
  authLabel: "",
  persistenceLabel: "",
  persistenceReady: false,
  authResolved: false,
  requiresAuth: false,
  showProfileDetails: false,
  showMonthlyCostPrompt: false,
  lastUnlocked: [],
  selectedStoreIndex: null,
  transitionNotice: null,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()((set) => ({
  ...initialState,
  setShowOnboardingChoice: (v) => set({ showOnboardingChoice: v }),
  setShowExistingOnboarding: (v) => set({ showExistingOnboarding: v }),
  setShowAIRoadmapWizard: (v) => set({ showAIRoadmapWizard: v }),
  setShowRoleSelection: (v) => set({ showRoleSelection: v }),
  setUserRole: (v) => set({ userRole: v }),
  setIsResetting: (v) => set({ isResetting: v }),
  setResetProgress: (v) => set({ resetProgress: v }),
  setAuthLabel: (v) => set({ authLabel: v }),
  setPersistenceLabel: (v) => set({ persistenceLabel: v }),
  setPersistenceReady: (v) => set({ persistenceReady: v }),
  setAuthResolved: (v) => set({ authResolved: v }),
  setRequiresAuth: (v) => set({ requiresAuth: v }),
  setShowProfileDetails: (v) => set({ showProfileDetails: v }),
  setShowMonthlyCostPrompt: (v) => set({ showMonthlyCostPrompt: v }),
  setLastUnlocked: (v) => set({ lastUnlocked: v }),
  setSelectedStoreIndex: (v) => set({ selectedStoreIndex: v }),
  setTransitionNotice: (v) => set({ transitionNotice: v }),
  resetAll: () => set(initialState),
}));
