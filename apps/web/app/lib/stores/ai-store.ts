import { create } from "zustand";
import type { ContractAnalysisResult, DashboardActionsResponse } from "@build-up/ai";
import type { GuideQaAnswer, loadPermitKnowledge } from "@build-up/shared";

// ─── Types for knowledge guides ───
type KnowledgeGuide = Awaited<ReturnType<typeof loadPermitKnowledge>>[number];

type AiState = {
  // 계약서 분석
  selectedContractTaskId: string | undefined;
  contractText: string;
  contractAnalysisStatus: "idle" | "loading" | "error";
  contractAnalysisError: string;
  contractAnalysis: ContractAnalysisResult | null;
  // 가이드 Q&A
  selectedGuideSectionKey: string | undefined;
  guideQuestion: string;
  guideQaStatus: "idle" | "loading" | "error";
  guideQaError: string;
  guideAnswer: GuideQaAnswer | null;
  // 지식 Q&A
  knowledgeQaText: string;
  knowledgeQaStatus: "idle" | "loading" | "error";
  knowledgeQaError: string;
  // 지식베이스 (서버에서 로드)
  permitGuides: KnowledgeGuide[];
  taxGuides: KnowledgeGuide[];
  loanGuides: KnowledgeGuide[];
  // AI 대시보드 코치
  aiActions: DashboardActionsResponse | null;
  aiActionsLoading: boolean;
  /** AI 코칭 생성을 skip한 이유 (null=정상, "stale-data"=매출 오래됨, "not-launched"=미런칭, "no-session"=로그인 안됨, "error"=API 실패) */
  aiActionsSkipReason: "stale-data" | "not-launched" | "no-session" | "error" | null;
  /** API 에러 메시지 (debugging) */
  aiActionsError: string | null;
};

type AiActions = {
  setSelectedContractTaskId: (v: string | undefined) => void;
  setContractText: (v: string) => void;
  setContractAnalysisStatus: (v: "idle" | "loading" | "error") => void;
  setContractAnalysisError: (v: string) => void;
  setContractAnalysis: (v: ContractAnalysisResult | null) => void;
  setSelectedGuideSectionKey: (v: string | undefined) => void;
  setGuideQuestion: (v: string) => void;
  setGuideQaStatus: (v: "idle" | "loading" | "error") => void;
  setGuideQaError: (v: string) => void;
  setGuideAnswer: (v: GuideQaAnswer | null) => void;
  setKnowledgeQaText: (v: string) => void;
  setKnowledgeQaStatus: (v: "idle" | "loading" | "error") => void;
  setKnowledgeQaError: (v: string) => void;
  setPermitGuides: (v: KnowledgeGuide[]) => void;
  setTaxGuides: (v: KnowledgeGuide[]) => void;
  setLoanGuides: (v: KnowledgeGuide[]) => void;
  setAiActions: (v: DashboardActionsResponse | null) => void;
  setAiActionsLoading: (v: boolean) => void;
  setAiActionsSkipReason: (v: AiState["aiActionsSkipReason"]) => void;
  setAiActionsError: (v: string | null) => void;
  resetAll: () => void;
};

const initialState: AiState = {
  selectedContractTaskId: undefined,
  contractText: "",
  contractAnalysisStatus: "idle",
  contractAnalysisError: "",
  contractAnalysis: null,
  selectedGuideSectionKey: undefined,
  guideQuestion: "",
  guideQaStatus: "idle",
  guideQaError: "",
  guideAnswer: null,
  knowledgeQaText: "",
  knowledgeQaStatus: "idle",
  knowledgeQaError: "",
  permitGuides: [],
  taxGuides: [],
  loanGuides: [],
  aiActions: null,
  aiActionsLoading: false,
  aiActionsSkipReason: null,
  aiActionsError: null,
};

export const useAiStore = create<AiState & AiActions>()((set) => ({
  ...initialState,
  setSelectedContractTaskId: (v) => set({ selectedContractTaskId: v }),
  setContractText: (v) => set({ contractText: v }),
  setContractAnalysisStatus: (v) => set({ contractAnalysisStatus: v }),
  setContractAnalysisError: (v) => set({ contractAnalysisError: v }),
  setContractAnalysis: (v) => set({ contractAnalysis: v }),
  setSelectedGuideSectionKey: (v) => set({ selectedGuideSectionKey: v }),
  setGuideQuestion: (v) => set({ guideQuestion: v }),
  setGuideQaStatus: (v) => set({ guideQaStatus: v }),
  setGuideQaError: (v) => set({ guideQaError: v }),
  setGuideAnswer: (v) => set({ guideAnswer: v }),
  setKnowledgeQaText: (v) => set({ knowledgeQaText: v }),
  setKnowledgeQaStatus: (v) => set({ knowledgeQaStatus: v }),
  setKnowledgeQaError: (v) => set({ knowledgeQaError: v }),
  setPermitGuides: (v) => set({ permitGuides: v }),
  setTaxGuides: (v) => set({ taxGuides: v }),
  setLoanGuides: (v) => set({ loanGuides: v }),
  setAiActions: (v) => set({ aiActions: v }),
  setAiActionsLoading: (v) => set({ aiActionsLoading: v }),
  setAiActionsSkipReason: (v) => set({ aiActionsSkipReason: v }),
  setAiActionsError: (v) => set({ aiActionsError: v }),
  resetAll: () => set(initialState),
}));
