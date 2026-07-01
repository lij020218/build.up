"use client";

import {
  answerGuideQuestion,
  getFreshnessPresentation,
  runFinancialSimulation,
  saveRoadmapState,
  upsertStageDecision,
  type StageTransitionResult,
  type WorkflowDecisionMap,
} from "@foundone/shared";
import type { AiStructuredResponse, ContractAnalysisResult } from "@foundone/ai";
import { useAiStore, useFinanceStore, useRoadmapStore, useOnboardingStore } from "../stores";
import { supabase } from "../../../lib/supabase";
import {
  getContractTaskDetail,
  getGuideSections,
  inferFinanceDefaults,
  parseManwonInput,
  hydrateSavedFinanceSnapshot,
  hydrateSavedContractAnalysisSnapshot,
  hydrateSavedGuideQaSnapshot,
  markViewedStageAdvanced,
  buildTransitionNotice,
} from "../helpers";
import type { DashboardDeps } from "../types";

export function useAiAnalysisHandlers(
  deps: DashboardDeps,
  industryCategoryId: string | undefined,
  /** Additional context needed from the parent hook */
  ctx: {
    currentStageCode: string;
    selectedIndustryLabel: string;
    finalSelectedMarket: import("@foundone/shared").RecommendationItem | null;
  },
) {
  const { language, copy } = deps;

  // ── Stores ──
  const aiStore = useAiStore();
  const financeStore = useFinanceStore();
  const roadmapStore = useRoadmapStore();
  const onboardingStore = useOnboardingStore();

  const {
    selectedContractTaskId,
    contractText,
    contractAnalysis,
    guideQuestion,
    guideAnswer,
    taxGuides,
    loanGuides,
    selectedGuideSectionKey,
    setContractAnalysisStatus,
    setContractAnalysisError,
    setContractAnalysis,
    setGuideQaStatus,
    setGuideQaError,
    setGuideAnswer,
    setKnowledgeQaStatus,
    setKnowledgeQaError,
    setKnowledgeQaText,
  } = aiStore;

  const {
    financeCapitalText,
    financeMonthlyRentText,
    financeLaborText,
    financeRevenueText,
    financeMarketStyle,
    financeRentBand,
    setFinanceStatus,
    setFinanceError,
    setFinanceResult,
    setFinanceInterpretation,
  } = financeStore;

  const {
    decisions,
    roadmap,
    taskMap,
    setDecisions,
    setRoadmap,
    setViewingStageId,
  } = roadmapStore;

  const {
    setPersistenceReady,
    setPersistenceLabel,
    setLastUnlocked,
    setTransitionNotice,
  } = onboardingStore;

  // ── Computed: contract tasks ──
  const contractTasks = taskMap["contract-review"] ?? [];
  const activeContractTask =
    contractTasks.find((task) => task.taskId === selectedContractTaskId) ?? contractTasks[0] ?? null;
  const activeContractTaskDetail = activeContractTask
    ? getContractTaskDetail(activeContractTask.taskId, language, industryCategoryId)
    : null;

  // ── Computed: active guide ──
  const activeGuide =
    ctx.currentStageCode === "tax_guide"
      ? taxGuides[0] ?? null
      : ctx.currentStageCode === "loan_guide"
        ? loanGuides[0] ?? null
        : null;
  const activeGuideSections = getGuideSections(activeGuide, language);
  const activeGuideSection =
    activeGuideSections.find((section) => section.key === selectedGuideSectionKey) ??
    activeGuideSections[0] ??
    null;
  const activeGuideFreshness = getFreshnessPresentation(activeGuide?.freshness);
  const activeGuideActionLabel =
    ctx.currentStageCode === "tax_guide"
      ? copy.home.markTaxReviewed
      : copy.home.markLoanReviewed;
  const activeGuideEmptyLabel =
    ctx.currentStageCode === "tax_guide"
      ? copy.home.noTaxGuide
      : copy.home.noLoanGuide;
  const guideDecisionKey = activeGuide ? `guide-qa-${activeGuide.id}` : undefined;

  // ── Computed: snapshots & effective values ──
  const savedFinanceSnapshot = hydrateSavedFinanceSnapshot(decisions["financial-simulation"]);
  const savedContractSnapshot = hydrateSavedContractAnalysisSnapshot(decisions["contract-analysis"]);
  const savedGuideQaSnapshot = hydrateSavedGuideQaSnapshot(
    guideDecisionKey ? decisions[guideDecisionKey] : undefined,
  );
  const effectiveContractAnalysis = contractAnalysis ?? savedContractSnapshot?.analysis ?? null;
  const effectiveGuideAnswer = guideAnswer ?? savedGuideQaSnapshot?.answer ?? null;
  const financeDefaults = inferFinanceDefaults(ctx.finalSelectedMarket, industryCategoryId ?? "food");

  const persistRoadmapDecisions = async (nextDecisions: WorkflowDecisionMap) => {
    await saveRoadmapState(supabase, {
      roadmap,
      decisions: nextDecisions,
      tasks: taskMap,
    });
    setPersistenceReady(true);
    setPersistenceLabel(copy.home.savedToSupabase);
  };

  const getRequiredAccessToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(language === "ko" ? "로그인 세션을 다시 확인해 주세요." : "Please refresh your login session.");
    }

    return session.access_token;
  };

  const postAuthenticatedJson = async <TPayload,>(
    url: string,
    body: Record<string, unknown>,
  ): Promise<{ response: Response; payload: TPayload }> => {
    const accessToken = await getRequiredAccessToken();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const rawPayload = await response.text();
    let payload = {} as TPayload;

    if (rawPayload) {
      try {
        payload = JSON.parse(rawPayload) as TPayload;
      } catch (error) {
        if (!response.ok) {
          throw new Error(
            language === "ko"
              ? `서버 응답을 읽지 못했습니다. (${response.status})`
              : `Could not read the server response. (${response.status})`,
          );
        }

        throw error;
      }
    }

    return { response, payload };
  };

  const applyVerificationAdvance = (result: StageTransitionResult) => {
    setDecisions(result.decisions);
    setRoadmap(result.roadmap);
    setLastUnlocked(result.newlyUnlockedStageIds);
    setViewingStageId(null);
    setTransitionNotice(buildTransitionNotice(result.roadmap, language));
  };

  // ── Handler: contract analysis ──
  const handleContractAnalysis = async () => {
    const trimmed = contractText.trim();

    if (!trimmed) {
      return;
    }

    setContractAnalysisStatus("loading");
    setContractAnalysisError("");
    setContractAnalysis(null);

    try {
      const { response, payload } = await postAuthenticatedJson<
        ContractAnalysisResult & {
          error?: string;
          detail?: string;
        }
      >("/api/ai/contract/analyze", {
        contractText: trimmed,
      });

      if (!response.ok || payload.error) {
        throw new Error(
          payload.detail ??
            payload.error ??
            (language === "ko" ? "계약서 분석에 실패했습니다." : "Failed to analyze the contract."),
        );
      }

      const nextDecisions = upsertStageDecision(decisions, "contract-analysis", {
        stageId: "contract-analysis",
        inputs: {
          contractText: trimmed,
          riskLevel: payload.riskLevel,
          flaggedClausesJson: JSON.stringify(payload.flaggedClauses),
          missingItems: payload.missingItems,
          unusualTerms: payload.unusualTerms,
          nextActions: payload.nextActions,
        },
        notes: payload.summary,
        completedAt: new Date().toISOString(),
      });

      setDecisions(nextDecisions);
      setContractAnalysis(payload);
      setContractAnalysisStatus("idle");
      await persistRoadmapDecisions(nextDecisions);
    } catch (error) {
      setContractAnalysisStatus("error");
      setContractAnalysisError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "계약서 분석에 실패했습니다."
            : "Failed to analyze the contract.",
      );
    }
  };

  // ── Handler: financial simulation ──
  const handleRunFinancialSimulation = async () => {
    const capital = parseManwonInput(financeCapitalText);
    const monthlyRent = parseManwonInput(financeMonthlyRentText);
    const monthlyLaborCost = parseManwonInput(financeLaborText);
    const expectedMonthlyRevenue = parseManwonInput(financeRevenueText);

    if (!capital) {
      setFinanceStatus("error");
      setFinanceError(
        language === "ko"
          ? "자본금을 만원 단위로 입력해 주세요."
          : "Enter your starting capital in KRW ten-thousands.",
      );
      return;
    }

    setFinanceStatus("loading");
    setFinanceError("");
    setFinanceResult(null);
    setFinanceInterpretation(null);

    try {
      const result = await runFinancialSimulation(supabase, {
        capital,
        categoryId: industryCategoryId ?? "food",
        marketStyle: financeMarketStyle,
        rentBand: financeRentBand,
        monthlyRent,
        monthlyLaborCost,
        expectedMonthlyRevenue,
      });

      setFinanceResult(result);

      const { response, payload } = await postAuthenticatedJson<
        AiStructuredResponse & {
          error?: string;
        }
      >("/api/ai/finance/interpret", {
        result,
        categoryLabel: ctx.selectedIndustryLabel,
      });

      if (!response.ok || payload.error) {
        throw new Error(
          payload.error ??
            (language === "ko"
              ? "재무 해석에 실패했습니다."
              : "Failed to interpret the financial result."),
        );
      }

      const nextDecisions = upsertStageDecision(decisions, "financial-simulation", {
        stageId: "financial-simulation",
        inputs: {
          capital,
          marketStyle: financeMarketStyle,
          rentBand: financeRentBand,
          ...(typeof monthlyRent === "number" ? { monthlyRent } : {}),
          ...(typeof monthlyLaborCost === "number" ? { monthlyLaborCost } : {}),
          ...(typeof expectedMonthlyRevenue === "number" ? { expectedMonthlyRevenue } : {}),
          riskLevel: result.riskLevel,
          survivabilityMonths: result.survivabilityMonths,
          ...(typeof result.breakEven.estimatedBreakEvenMonth === "number"
            ? { breakEvenMonth: result.breakEven.estimatedBreakEvenMonth }
            : {}),
          breakEvenRevenue: result.breakEven.monthlyBreakEvenRevenue,
          capitalAfterSetupLow: result.capitalAfterSetup.low,
          capitalAfterSetupHigh: result.capitalAfterSetup.high,
          totalMonthlyFixed: result.resolvedCosts.totalMonthlyFixed,
          cogsRate: result.resolvedCosts.cogsRate,
          aiRationale: payload.rationale,
          aiWarnings: payload.warnings,
          aiNextActions: payload.nextActions,
        },
        notes: payload.summary,
        completedAt: new Date().toISOString(),
      });

      setDecisions(nextDecisions);
      setFinanceInterpretation(payload);
      await persistRoadmapDecisions(nextDecisions);
      setFinanceStatus("idle");
    } catch (error) {
      setFinanceStatus("error");
      setFinanceError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "재무 시뮬레이션에 실패했습니다."
            : "Failed to run the financial simulation.",
      );
    }
  };

  // ── Handler: verification continue (permit/tax/loan/financial-review) ──
  // Viewed-stage advance: guide review can happen while revisiting a non-current stage,
  // so the stage id must be explicit rather than derived from roadmap.currentStageId.
  const handleVerificationContinue = (
    stageId: "permit-guide" | "tax-guide" | "loan-guide" | "financial-review",
    extraInputs: Record<string, unknown> = {},
  ) => {
    // 먼저 reviewed: true 등 inputs 를 upsert 한 decisions 생성
    const nextDecisions = upsertStageDecision(decisions, stageId, {
      stageId,
      inputs: {
        reviewed: true,
        ...extraInputs,
      },
      completedAt: new Date().toISOString(),
    });

    const result = markViewedStageAdvanced(stageId, nextDecisions, roadmap, taskMap);
    applyVerificationAdvance(result);
  };

  // ── Handler: knowledge Q&A (streaming) ──
  const handleKnowledgeQuestion = async (domain: "tax" | "loan") => {
    if (!guideQuestion.trim()) return;
    setKnowledgeQaStatus("loading");
    setKnowledgeQaError("");
    setKnowledgeQaText("");
    try {
      const res = await fetch("/api/knowledge/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: guideQuestion.trim(),
          domain,
          industryCategoryId,
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "서버 오류가 발생했습니다." }));
        throw new Error(err.error ?? "서버 오류");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setKnowledgeQaText(accumulated);
            }
          } catch { /* skip malformed lines */ }
        }
      }
      setKnowledgeQaStatus("idle");
    } catch (error) {
      setKnowledgeQaStatus("error");
      setKnowledgeQaError(error instanceof Error ? error.message : "답변 요청에 실패했습니다.");
    }
  };

  // ── Handler: guide Q&A (local/deterministic) ──
  const handleGuideQuestion = async () => {
    if (!activeGuide || !guideQuestion.trim()) {
      return;
    }

    try {
      setGuideQaStatus("loading");
      setGuideQaError("");
      const nextAnswer = answerGuideQuestion({
        question: guideQuestion,
        language,
        guide: activeGuide,
      });
      const nextDecisions = upsertStageDecision(decisions, `guide-qa-${activeGuide.id}`, {
        stageId: `guide-qa-${activeGuide.id}`,
        inputs: {
          question: guideQuestion.trim(),
          explanation: nextAnswer.explanation,
          reasons: nextAnswer.reasons,
          cautions: nextAnswer.cautions,
          nextActions: nextAnswer.nextActions,
          confidence: nextAnswer.confidence,
        },
        notes: nextAnswer.shortAnswer,
        completedAt: new Date().toISOString(),
      });

      setDecisions(nextDecisions);
      setGuideAnswer(nextAnswer);
      setGuideQaStatus("idle");
      await persistRoadmapDecisions(nextDecisions);
    } catch (error) {
      setGuideQaStatus("error");
      setGuideQaError(error instanceof Error ? error.message : "Failed to answer question.");
    }
  };

  return {
    // Handlers
    handleContractAnalysis,
    handleRunFinancialSimulation,
    handleVerificationContinue,
    handleKnowledgeQuestion,
    handleGuideQuestion,
    // Computed: contract
    contractTasks,
    activeContractTask,
    activeContractTaskDetail,
    // Computed: guide
    activeGuide,
    activeGuideSections,
    activeGuideSection,
    activeGuideFreshness,
    activeGuideActionLabel,
    activeGuideEmptyLabel,
    guideDecisionKey,
    // Computed: snapshots & effective values
    savedFinanceSnapshot,
    savedContractSnapshot,
    savedGuideQaSnapshot,
    effectiveContractAnalysis,
    effectiveGuideAnswer,
    financeDefaults,
  };
}
