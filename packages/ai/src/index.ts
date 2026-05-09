export * from "./types/ai";
export { ANTI_HALLUCINATION_DIRECTIVE, GROUNDED_DATA_HEADER } from "./utils/anti-hallucination";
export * from "./finance/interpret";
export * from "./guide/interpret";
export * from "./contract/analyze";
export * from "./market/interpret";
export * from "./stage/brief";
export * from "./dashboard/actions";
export type { DashboardContext } from "./dashboard/prompt";
export { enrichDashboardContext, enrichDashboardContextAsync } from "./dashboard/enrich-context";
export type { ContractClause, ContractAnalysisResult, ContractType } from "./contract/prompt";
export { getSystemPromptForType } from "./contract/prompt";
export { buildFinanceUserPrompt, FINANCE_SYSTEM_PROMPT } from "./finance/prompt";
export { buildGuideQaUserPrompt, GUIDE_QA_SYSTEM_PROMPT } from "./guide/prompt";
export { buildMarketNarrativeUserPrompt, MARKET_NARRATIVE_SYSTEM_PROMPT } from "./market/prompt";
export type { StageBriefParams, StageBriefResult } from "./stage/prompt";
export { buildStageBriefUserPrompt, STAGE_BRIEF_SYSTEM_PROMPT } from "./stage/prompt";
export { matchPrograms, checkEligibility } from "./programs/match";
export type { EligibilityResult } from "./programs/match";
export type { ProgramMatchingResult, ProgramRecommendation, ProgramMatchingContext } from "./programs/prompt";
export { diagnoseBusinessHealth } from "./health/diagnose";
export type { HealthDiagnosisContext, HealthDiagnosisResult } from "./health/prompt";
export { generateRoadmap } from "./roadmap/generate";
export type { RoadmapGenerationInput, RoadmapGenerationResult } from "./roadmap/prompt";
export { selectFromPool } from "./roadmap/select-from-pool";
export type {
  SelectFromPoolInput,
  SelectFromPoolResult,
  PoolVendor,
  PoolMaterial,
  PoolConcept,
  PoolChannel,
} from "./roadmap/select-from-pool";
export { generateInterviewScript } from "./interview/generate";
export type { InterviewInput, InterviewScript, InterviewQuestion } from "./interview/generate";
export { analyzeInterviews } from "./interview/analyze";
export type { InterviewAnalysisInput, InterviewAnalysisResult } from "./interview/analyze";
export { askQuickQuery } from "./quick-query/ask";
export type { QuickQueryContext, QuickQueryResult } from "./quick-query/prompt";
export { QUICK_QUERY_SYSTEM_PROMPT, buildQuickQueryUserPrompt } from "./quick-query/prompt";
export { generateReportInsight } from "./report/actions";
export type { ReportInsightInput } from "./report/prompt";

// ── Insight RAG (vector knowledge base) ───────────────────────────────────
export {
  chunkInsightBody,
  estimateTokens,
  embedTexts,
  embedQuery,
  EMBEDDING_MODEL,
  EMBEDDING_DIM,
  retrieveInsightChunks,
  formatInsightContext,
  ingestInsightDocument,
} from "./rag";
export type {
  ChunkOptions,
  EmbedOptions,
  RetrieveDeps,
  AugmentOptions,
  IngestDeps,
  IngestResult,
  IngestOptions,
  InsightCategory,
  InsightDocumentInput,
  InsightChunk,
  EmbeddedChunk,
  RetrievedChunk,
  RetrieveOptions,
} from "./rag";
