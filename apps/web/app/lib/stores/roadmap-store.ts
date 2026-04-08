import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  starterDecisionMap,
  starterRoadmap,
  starterTaskMap,
  type RecommendationItem,
  type WorkflowDecisionMap,
  type WorkflowTaskMap,
  type StageGuideContent,
} from "@build-up/shared";

type RoadmapState = {
  decisions: WorkflowDecisionMap;
  roadmap: typeof starterRoadmap;
  taskMap: WorkflowTaskMap;
  viewingStageId: string | null;
  // 상권
  recommendedMarkets: RecommendationItem[];
  customMarketName: string;
  customMarketReason: string;
  manualMarketEvaluation: RecommendationItem | null;
  manualAlternative: RecommendationItem | null;
  locationOptions: RecommendationItem[];
  locationSourceLabel: string;
  // 벤더/운영 준비
  vendorSelections: Record<string, string>;
  vendorCustomInputs: Record<string, string>;
  opsSelections: Record<string, boolean>;
  opsPosChecks: Record<string, boolean>;
  opsStep: number;
  softOpenChecks: Record<string, boolean>;
  softOpenPricing: string;
  softOpenStep: number;
  softOpenSkips: Record<string, boolean>;
  taxChecks: Record<string, boolean>;
  loanChecks: Record<string, boolean>;
  // 스테이지 가이드
  stageGuideContent: StageGuideContent | null;
  guideStepIndex: number;
  guideSelections: Record<string, string>;
  // AI 로드맵 결과 (생성 후 보존)
  aiRoadmapResult: AiRoadmapSnapshot | null;
};

/** AI 로드맵 위저드가 생성한 전체 결과 — 한 번 생성 후 영구 보존 */
export type AiRoadmapSnapshot = {
  generatedAt: string; // ISO 8601
  marketAnalysis: {
    score: number; grade: string;
    footTraffic: string; competition: string;
    rentLevel: string; targetFit: string; summary: string;
  };
  budgetAllocation: {
    deposit: number; interior: number; equipment: number;
    workingCapital: number; total: number;
  };
  recommendations: {
    suppliers: Array<{ name: string; category: string; reason: string; priceRange: string }>;
    interior: Array<{ item: string; vendor: string; estimatedCost: string }>;
    permits: string[];
    taxAdvice: string;
    deliveryPlatforms: string[];
    snsChannels: string[];
  };
  timeline: {
    targetOpenDate: string; totalWeeks: number;
    phases: Array<{ name: string; weeks: number }>;
  };
  risks: Array<{ level: string; description: string; mitigation: string }>;
};

type RoadmapActions = {
  setDecisions: (v: WorkflowDecisionMap | ((prev: WorkflowDecisionMap) => WorkflowDecisionMap)) => void;
  setRoadmap: (v: typeof starterRoadmap | ((prev: typeof starterRoadmap) => typeof starterRoadmap)) => void;
  setTaskMap: (v: WorkflowTaskMap | ((prev: WorkflowTaskMap) => WorkflowTaskMap)) => void;
  setViewingStageId: (v: string | null) => void;
  setRecommendedMarkets: (v: RecommendationItem[]) => void;
  setCustomMarketName: (v: string) => void;
  setCustomMarketReason: (v: string) => void;
  setManualMarketEvaluation: (v: RecommendationItem | null) => void;
  setManualAlternative: (v: RecommendationItem | null) => void;
  setLocationOptions: (v: RecommendationItem[]) => void;
  setLocationSourceLabel: (v: string) => void;
  setVendorSelections: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setVendorCustomInputs: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setOpsSelections: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  setOpsPosChecks: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  setOpsStep: (v: number | ((prev: number) => number)) => void;
  setSoftOpenChecks: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  setSoftOpenPricing: (v: string) => void;
  setSoftOpenStep: (v: number | ((prev: number) => number)) => void;
  setSoftOpenSkips: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  setTaxChecks: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  setLoanChecks: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  setStageGuideContent: (v: StageGuideContent | null) => void;
  setGuideStepIndex: (v: number | ((prev: number) => number)) => void;
  setGuideSelections: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setAiRoadmapResult: (v: AiRoadmapSnapshot | null) => void;
  resetAll: () => void;
};

const initialState: RoadmapState = {
  decisions: starterDecisionMap,
  roadmap: starterRoadmap,
  taskMap: starterTaskMap,
  viewingStageId: null,
  recommendedMarkets: [],
  customMarketName: "",
  customMarketReason: "",
  manualMarketEvaluation: null,
  manualAlternative: null,
  locationOptions: [],
  locationSourceLabel: "",
  vendorSelections: {},
  vendorCustomInputs: {},
  opsSelections: {},
  opsPosChecks: {},
  opsStep: 0,
  softOpenChecks: {},
  softOpenPricing: "",
  softOpenStep: 0,
  softOpenSkips: {},
  taxChecks: {},
  loanChecks: {},
  stageGuideContent: null,
  guideStepIndex: 0,
  guideSelections: {},
  aiRoadmapResult: null,
};

// 함수형 업데이트 헬퍼
const withFn = <T>(v: T | ((prev: T) => T), prev: T): T =>
  typeof v === "function" ? (v as (p: T) => T)(prev) : v;

export const useRoadmapStore = create<RoadmapState & RoadmapActions>()(
  persist(
    (set) => ({
      ...initialState,
      setDecisions: (v) => set((s) => ({ decisions: withFn(v, s.decisions) })),
      setRoadmap: (v) => set((s) => ({ roadmap: withFn(v, s.roadmap) })),
      setTaskMap: (v) => set((s) => ({ taskMap: withFn(v, s.taskMap) })),
      setViewingStageId: (v) => set({ viewingStageId: v }),
      setRecommendedMarkets: (v) => set({ recommendedMarkets: v }),
      setCustomMarketName: (v) => set({ customMarketName: v }),
      setCustomMarketReason: (v) => set({ customMarketReason: v }),
      setManualMarketEvaluation: (v) => set({ manualMarketEvaluation: v }),
      setManualAlternative: (v) => set({ manualAlternative: v }),
      setLocationOptions: (v) => set({ locationOptions: v }),
      setLocationSourceLabel: (v) => set({ locationSourceLabel: v }),
      setVendorSelections: (v) => set((s) => ({ vendorSelections: withFn(v, s.vendorSelections) })),
      setVendorCustomInputs: (v) => set((s) => ({ vendorCustomInputs: withFn(v, s.vendorCustomInputs) })),
      setOpsSelections: (v) => set((s) => ({ opsSelections: withFn(v, s.opsSelections) })),
      setOpsPosChecks: (v) => set((s) => ({ opsPosChecks: withFn(v, s.opsPosChecks) })),
      setOpsStep: (v) => set((s) => ({ opsStep: withFn(v, s.opsStep) })),
      setSoftOpenChecks: (v) => set((s) => ({ softOpenChecks: withFn(v, s.softOpenChecks) })),
      setSoftOpenPricing: (v) => set({ softOpenPricing: v }),
      setSoftOpenStep: (v) => set((s) => ({ softOpenStep: withFn(v, s.softOpenStep) })),
      setSoftOpenSkips: (v) => set((s) => ({ softOpenSkips: withFn(v, s.softOpenSkips) })),
      setTaxChecks: (v) => set((s) => ({ taxChecks: withFn(v, s.taxChecks) })),
      setLoanChecks: (v) => set((s) => ({ loanChecks: withFn(v, s.loanChecks) })),
      setStageGuideContent: (v) => set({ stageGuideContent: v }),
      setGuideStepIndex: (v) => set((s) => ({ guideStepIndex: withFn(v, s.guideStepIndex) })),
      setGuideSelections: (v) => set((s) => ({ guideSelections: withFn(v, s.guideSelections) })),
      setAiRoadmapResult: (v) => set({ aiRoadmapResult: v }),
      resetAll: () => set(initialState),
    }),
    {
      name: "buildup-roadmap",
      partialize: (state) => ({
        decisions: state.decisions,
        roadmap: state.roadmap,
        taskMap: state.taskMap,
        vendorSelections: state.vendorSelections,
        vendorCustomInputs: state.vendorCustomInputs,
        opsSelections: state.opsSelections,
        opsPosChecks: state.opsPosChecks,
        softOpenChecks: state.softOpenChecks,
        softOpenPricing: state.softOpenPricing,
        softOpenSkips: state.softOpenSkips,
        taxChecks: state.taxChecks,
        loanChecks: state.loanChecks,
        guideSelections: state.guideSelections,
        aiRoadmapResult: state.aiRoadmapResult,
      }),
    },
  ),
);
