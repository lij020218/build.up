import { create } from "zustand";

type OnboardingState = {
  showOnboardingChoice: boolean;
  showExistingOnboarding: boolean;
  showAIRoadmapWizard: boolean;
  showRoleSelection: boolean;
  userRole: "owner" | "staff" | "manager";
  /** 역할(사장/직원) 확정 여부 — 확정 전엔 홈이 사장 화면을 잠깐 띄우는 깜빡임 방지용 스켈레톤 게이트 */
  roleResolved: boolean;
  isResetting: boolean;
  resetProgress: number;
  authLabel: string;
  /** 회원가입 시 입력한 이름 (auth.users.user_metadata.name) — 인사말·프로필 헤더에 사용 */
  userName: string | null;
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
  /** Supabase 저장 상태: idle / saving / saved / error */
  persistStatus: "idle" | "saving" | "saved" | "error";
  persistError: string | null;
  persistLastSavedAt: number | null;
};

type OnboardingActions = {
  setShowOnboardingChoice: (v: boolean) => void;
  setShowExistingOnboarding: (v: boolean) => void;
  setShowAIRoadmapWizard: (v: boolean) => void;
  setShowRoleSelection: (v: boolean) => void;
  setUserRole: (v: "owner" | "staff" | "manager") => void;
  setRoleResolved: (v: boolean) => void;
  setIsResetting: (v: boolean) => void;
  setResetProgress: (v: number) => void;
  setAuthLabel: (v: string) => void;
  setUserName: (v: string | null) => void;
  setPersistenceLabel: (v: string) => void;
  setPersistenceReady: (v: boolean) => void;
  setAuthResolved: (v: boolean) => void;
  setRequiresAuth: (v: boolean) => void;
  setShowProfileDetails: (v: boolean) => void;
  setShowMonthlyCostPrompt: (v: boolean) => void;
  setLastUnlocked: (v: string[]) => void;
  setSelectedStoreIndex: (v: number | null) => void;
  setTransitionNotice: (v: { title: string; body: string } | null) => void;
  setPersistStatus: (v: "idle" | "saving" | "saved" | "error") => void;
  setPersistError: (v: string | null) => void;
  setPersistLastSavedAt: (v: number | null) => void;
  resetAll: () => void;
};

const initialState: OnboardingState = {
  showOnboardingChoice: false,
  showExistingOnboarding: false,
  showAIRoadmapWizard: false,
  showRoleSelection: false,
  userRole: "owner",
  roleResolved: false,
  isResetting: false,
  resetProgress: 0,
  authLabel: "",
  userName: null,
  persistenceLabel: "",
  persistenceReady: false,
  authResolved: false,
  requiresAuth: false,
  showProfileDetails: false,
  showMonthlyCostPrompt: false,
  lastUnlocked: [],
  selectedStoreIndex: null,
  transitionNotice: null,
  persistStatus: "idle",
  persistError: null,
  persistLastSavedAt: null,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()((set) => ({
  ...initialState,
  setShowOnboardingChoice: (v) => set({ showOnboardingChoice: v }),
  setShowExistingOnboarding: (v) => set({ showExistingOnboarding: v }),
  setShowAIRoadmapWizard: (v) => set({ showAIRoadmapWizard: v }),
  setShowRoleSelection: (v) => set({ showRoleSelection: v }),
  setUserRole: (v) => set({ userRole: v }),
  setRoleResolved: (v) => set({ roleResolved: v }),
  setIsResetting: (v) => set({ isResetting: v }),
  setResetProgress: (v) => set({ resetProgress: v }),
  setAuthLabel: (v) => set({ authLabel: v }),
  setUserName: (v) => set({ userName: v }),
  setPersistenceLabel: (v) => set({ persistenceLabel: v }),
  setPersistenceReady: (v) => set({ persistenceReady: v }),
  setAuthResolved: (v) => set({ authResolved: v }),
  setRequiresAuth: (v) => set({ requiresAuth: v }),
  setShowProfileDetails: (v) => set({ showProfileDetails: v }),
  setShowMonthlyCostPrompt: (v) => set({ showMonthlyCostPrompt: v }),
  setLastUnlocked: (v) => set({ lastUnlocked: v }),
  setSelectedStoreIndex: (v) => set({ selectedStoreIndex: v }),
  setTransitionNotice: (v) => set({ transitionNotice: v }),
  setPersistStatus: (v) => set({ persistStatus: v }),
  setPersistError: (v) => set({ persistError: v }),
  setPersistLastSavedAt: (v) => set({ persistLastSavedAt: v }),
  resetAll: () => set(initialState),
}));
