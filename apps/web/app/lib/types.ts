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

export type DashboardSurface = "home" | "current" | "roadmap" | "guides" | "franchise" | "profile" | "analytics" | "marketing" | "reports" | "team";

/** 서브훅에 전달되는 공통 의존성 */
export type DashboardDeps = {
  language: "ko" | "en";
  copy: ReturnType<typeof import("@foundone/shared").getUiCopy>;
  router: ReturnType<typeof import("next/navigation").useRouter>;
  searchParams: ReturnType<typeof import("next/navigation").useSearchParams>;
};
