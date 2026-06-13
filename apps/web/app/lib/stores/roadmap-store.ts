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
} from "@foundone/shared";

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
  // 입력 지역에 큐레이션 상권(market_location_signals) 매칭이 있었는지.
  //   true = 우리 조사 데이터로 카드 표시 → 라이브 AI 버튼 숨김(덮어쓰기 방지).
  //   false = 큐레이션 없는 지역 → 수동 "AI로 분석" 버튼 노출.
  hasCuratedMarket: boolean;
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
  // 계약 전 검토 — task 별 sub-checklist (key: `${taskId}:${idx}`)
  contractSubChecks: Record<string, boolean>;
  // ⚠️ Pre-launch (오픈 준비) — 사용자에게 "실제로 렌더된" 체크 항목의 ID 목록.
  //    CurrentStageView 가 task 완료 판정 시 100% 룰 적용 (이전엔 >=6/>=4 부분 체크로 자동 진행 버그).
  //    PreLaunchStage 가 useEffect 로 채움. null = 아직 페이지 진입 전.
  preLaunchVisibleIds: {
    dayIds: string[];          // 당일 운영 체크리스트 (universal + industry + ownership 합산)
    feedbackIds: string[];     // 피드백 수집 항목 (industry-specific + universal)
    finalIds: string[];        // 그랜드 오픈 최종 체크리스트
    improvementIds: string[];  // 본오픈 준비 개선 항목
  } | null;
  // 수정 저장 진행 상태 — 사용자가 "수정 저장" 클릭 시 버튼 라벨 / 색 동기화용.
  // null = idle, "saving" = Supabase 저장 중, "saved" = 저장 완료 (2초 후 자동 idle), "error" = 실패.
  editSaveStatus: { stageId: string; status: "saving" | "saved" | "error" } | null;
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
    suppliers: Array<{ id?: string; name: string; category: string; reason: string; priceRange: string }>;
    interior: Array<{ id?: string; item: string; vendor: string; estimatedCost: string; reason?: string }>;
    /** 인테리어 시공 업체 (vendor_type='interior') — 자재와 분리 */
    interiorVendors?: Array<{ id: string; title: string; description: string; checkItems: string[]; reason: string }>;
    permits: string[];
    taxAdvice: string;
    deliveryPlatforms: string[];
    snsChannels: string[];
    /** Pass 2 AI 가 interior_design_guides 풀에서 고른 컨셉 1개 + reasoning */
    selectedConcept?: {
      id: string;
      nameKo: string;
      descriptionKo: string;
      costRangeKo?: string;
      pros: string[];
      cons: string[];
      reason: string;
    };
    /** Pass 2 AI 가 logistics-platforms 풀에서 고른 운영 채널 + 우선순위 + reasoning */
    operationalChannels?: Array<{
      id: string;
      nameKo: string;
      type: string;
      typeLabelKo: string;
      commissionRate: number;
      priority: 1 | 2;
      reason: string;
    }>;
  };
  timeline: {
    targetOpenDate: string; totalWeeks: number;
    phases: Array<{ name: string; weeks: number }>;
  };
  risks: Array<{ level: string; description: string; mitigation: string }>;
  /** 서비스 DB 검증 풀 (sub-industry 매칭 후 enrich) — vendor_recommendations + interior_design_guides */
  serviceRecommendations?: {
    vendors: Array<{
      id: string;
      vendorType: string;
      vendorTypeLabel: string;
      title: string;
      description: string;
      checkItems: string[];
      franchiseNote?: string;
      priority: number;
    }>;
    interiorMaterials: Array<{
      id: string;
      nameKo: string;
      descriptionKo: string;
      costRangeKo?: string;
      tags: string[];
      trendSource?: string;
      priority: number;
    }>;
    interiorConcepts: Array<{
      id: string;
      nameKo: string;
      descriptionKo: string;
      costRangeKo?: string;
      pros: string[];
      cons: string[];
      tags: string[];
      priority: number;
    }>;
  };
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
  setHasCuratedMarket: (v: boolean) => void;
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
  setContractSubChecks: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  setEditSaveStatus: (v: RoadmapState["editSaveStatus"]) => void;
  setPreLaunchVisibleIds: (v: RoadmapState["preLaunchVisibleIds"]) => void;
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
  hasCuratedMarket: false,
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
  contractSubChecks: {},
  editSaveStatus: null,
  preLaunchVisibleIds: null,
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
      setHasCuratedMarket: (v) => set({ hasCuratedMarket: v }),
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
      setContractSubChecks: (v) => set((s) => ({ contractSubChecks: withFn(v, s.contractSubChecks) })),
      setEditSaveStatus: (v) => set({ editSaveStatus: v }),
      setPreLaunchVisibleIds: (v) => set({ preLaunchVisibleIds: v }),
      setStageGuideContent: (v) => set({ stageGuideContent: v }),
      setGuideStepIndex: (v) => set((s) => ({ guideStepIndex: withFn(v, s.guideStepIndex) })),
      setGuideSelections: (v) => set((s) => ({ guideSelections: withFn(v, s.guideSelections) })),
      setAiRoadmapResult: (v) => set({ aiRoadmapResult: v }),
      resetAll: () => set(initialState),
    }),
    {
      name: "foundone-roadmap",
      partialize: (state) => ({
        decisions: state.decisions,
        roadmap: state.roadmap,
        taskMap: state.taskMap,
        vendorSelections: state.vendorSelections,
        vendorCustomInputs: state.vendorCustomInputs,
        opsSelections: state.opsSelections,
        opsPosChecks: state.opsPosChecks,
        opsStep: state.opsStep,
        softOpenChecks: state.softOpenChecks,
        softOpenPricing: state.softOpenPricing,
        softOpenSkips: state.softOpenSkips,
        softOpenStep: state.softOpenStep,
        taxChecks: state.taxChecks,
        loanChecks: state.loanChecks,
        contractSubChecks: state.contractSubChecks,
        guideSelections: state.guideSelections,
        guideStepIndex: state.guideStepIndex,
        preLaunchVisibleIds: state.preLaunchVisibleIds,
        aiRoadmapResult: state.aiRoadmapResult,
        // ⚠️ 2026-05-25 audit fix: 사용자 입력·AI 결과 영속화 — 새로고침 시 손실 방지.
        //   customMarketName/Reason: 사용자가 직접 입력한 상권 이름·이유 (텍스트 손실 X).
        //   recommendedMarkets/locationOptions: AI 매칭 결과 재호출 비용 크므로 캐시.
        //   manualMarketEvaluation/Alternative: 사용자 검토 중 새로고침 시 컨텍스트 복원.
        customMarketName: state.customMarketName,
        customMarketReason: state.customMarketReason,
        manualMarketEvaluation: state.manualMarketEvaluation,
        manualAlternative: state.manualAlternative,
        recommendedMarkets: state.recommendedMarkets,
        locationOptions: state.locationOptions,
        locationSourceLabel: state.locationSourceLabel,
      }),
    },
  ),
);
