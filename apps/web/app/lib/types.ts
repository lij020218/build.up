import type { KnowledgeItemRecord, KnowledgeItemSourceRecord, GuideQaAnswer } from "@foundone/shared";
import type { AiStructuredResponse, ContractAnalysisResult } from "@foundone/ai";
import type { FreshnessMeta } from "@foundone/shared";

export type GuideRecord = KnowledgeItemRecord & {
  sources: KnowledgeItemSourceRecord[];
  freshness?: FreshnessMeta;
};

export type SavedFinanceSnapshot = {
  capital: number;
  marketStyle: string;
  rentBand: string;
  monthlyRent?: number;
  monthlyLaborCost?: number;
  expectedMonthlyRevenue?: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  survivabilityMonths: number;
  breakEvenMonth: number | null;
  breakEvenRevenue: number;
  capitalAfterSetupLow: number;
  capitalAfterSetupHigh: number;
  totalMonthlyFixed: number;
  cogsRate: number;
  interpretation?: AiStructuredResponse;
  savedAt?: string;
};

export type SavedContractAnalysisSnapshot = {
  contractText?: string;
  analysis: ContractAnalysisResult;
  savedAt?: string;
};

export type SavedGuideQaSnapshot = {
  question: string;
  answer: GuideQaAnswer;
  savedAt?: string;
};

export type DashboardSurface = "home" | "current" | "roadmap" | "guides" | "franchise" | "profile" | "analytics" | "marketing" | "reports" | "finance" | "team" | "tax" | "offerings";

/**
 * AI 로드맵 위저드 → 온보딩 핸드오프 부가 정보 (2026-08-20 위저드 3대 업그레이드).
 *  결과(RoadmapGenerationResult) 밖에서 사용자가 위저드 화면에서 직접 고른 것들:
 *   ① 추천 상권 선택 → location-candidates 단계 프리필
 *   ② 예산 직접 입력 → budget-setup 단계 항목(budgetItem.*) 프리필
 *   ③ 지역 인테리어 업체 선택 → vendor-setup s4 프리체크
 *  iOS AIRoadmapWizardView 미러 (웹·모바일 동기화 원칙).
 */
export type AiRoadmapWizardExtras = {
  /** 지역 단계에서 탭해 고른 상권 (market-recommend 결과 원본) */
  selectedMarket?: import("@foundone/shared").RecommendationItem | null;
  /** 같은 호출의 후보 전체 — location-candidates 단계 카드 목록으로 보존 */
  marketCandidates?: import("@foundone/shared").RecommendationItem[];
  /** market-recommend 를 호출한 지역 문자열 (aiMarketRegion 보존 가드용) */
  marketRegion?: string | null;
  /** 예산 "직접 입력" 모드 사용자 값 — 모두 만원 단위 */
  budgetBreakdown?: {
    /** budget-setup 항목 키(startup-budget-items SSOT) → 만원 */
    items: Record<string, number>;
    workingCapital?: number;
    monthlyRent?: number;
    monthlyLabor?: number;
    monthlyMarketing?: number;
  } | null;
  /** 리뷰 화면에서 체크한 내 지역 인테리어 업체 (최대 3곳) */
  selectedInteriorFirms?: Array<{ name: string; phone?: string | null }>;
};

/** 서브훅에 전달되는 공통 의존성 */
export type DashboardDeps = {
  language: "ko" | "en";
  copy: ReturnType<typeof import("@foundone/shared").getUiCopy>;
  router: ReturnType<typeof import("next/navigation").useRouter>;
  searchParams: ReturnType<typeof import("next/navigation").useSearchParams>;
};
