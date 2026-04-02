import {
  buildMarketScoreNarrative,
  buildRecommendedMarkets,
  buildRoadmapState,
  bootstrapAccountWorkspace,
  completeCurrentStage,
  evaluateDirectMarket,
  formatBudgetPresetLabel,
  formatMarketMetaValue,
  formatGuideSectionTitle,
  formatOpenDatePresetLabel,
  getRiskLevelLabel,
  formatStageStatus,
  formatStageType,
  formatStartupType,
  getIndustryCategoryIdByOptionId,
  getFreshnessPresentation,
  getCurrentUser,
  getStarterBusinessModelOptions,
  getStarterLocationOptions,
  getUiCopy,
  localizeGuideRecord,
  localizeRecommendationItem,
  localizeStage,
  localizeStarterIndustryCategory,
  localizeStarterStepCard,
  loadKnowledgeRecommendations,
  loadLoanKnowledge,
  loadBestMarketSignal,
  loadBusinessProfile,
  loadMarketSignalRecommendations,
  loadPermitKnowledge,
  runFinancialSimulation,
  saveRoadmapState,
  loadTaxKnowledge,
  starterIndustryCategories,
  starterBudgetPresets,
  starterDecisionMap,
  starterIndustryOptions,
  starterOpenDatePresets,
  starterRoadmap,
  starterStageFlow,
  starterStepCards,
  starterTaskMap,
  updateTaskStatus,
  upsertStageDecision,
  type FinancialRiskLevel,
  type FinancialSimulationResult,
  type KnowledgeItemRecord,
  type KnowledgeItemSourceRecord,
  type GuideQaAnswer,
  type PersistedBusinessProfile,
  type RecommendationItem,
  type WorkflowTaskMap,
  type WorkflowDecisionMap
} from "@build-up/shared";
import type { AiStructuredResponse, ContractAnalysisResult } from "@build-up/ai";
import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";
import { useLanguage } from "./language-provider";

export type DashboardSurface = "home" | "current" | "roadmap" | "guides" | "profile";

const SURFACE_HREFS: Record<DashboardSurface, string> = {
  home: "/(tabs)/home",
  current: "/(tabs)/current",
  roadmap: "/(tabs)/roadmap",
  guides: "/(tabs)/guides",
  profile: "/(tabs)/profile"
};

function getContractTaskDetail(taskId: string, language: "ko" | "en", categoryId?: string) {
  if (categoryId === "online-digital") {
    const details = {
      "use-check": {
        ko: {
          title: "작업 공간 적합성 확인",
          summary: "보관, 포장, 촬영, 고객응대까지 지금 운영 방식에 맞는 공간인지 먼저 봐야 합니다.",
          why: ["집에서 시작해도 재고와 포장 동선이 빠르게 복잡해질 수 있습니다.", "작업 공간이 맞지 않으면 초기 운영 효율이 크게 떨어집니다."]
        },
        en: {
          title: "Check workspace fit",
          summary: "Review whether the base fits storage, packing, content work, and daily operations.",
          why: ["Even home-based setups can become cramped quickly.", "A poor workspace setup reduces operating efficiency immediately."]
        }
      },
      "facility-check": {
        ko: {
          title: "보관·포장·택배 동선 확인",
          summary: "재고 보관과 포장, 택배 픽업/반품 흐름이 막히지 않는지 확인해야 합니다.",
          why: ["온라인 판매는 매장 노출보다 fulfillment 흐름이 더 중요합니다.", "출고와 반품이 꼬이면 운영 비용이 빠르게 커집니다."]
        },
        en: {
          title: "Review storage and shipping flow",
          summary: "Make sure inventory, packaging, pickup, and returns can run smoothly.",
          why: ["Fulfillment matters more than foot traffic here.", "Shipping friction quickly turns into operating cost."]
        }
      },
      "restriction-check": {
        ko: {
          title: "공급·외주 제한 확인",
          summary: "도매 접근성, 외주 포장, 반품 처리처럼 반복 운영에 영향을 주는 제한을 확인합니다.",
          why: ["소싱과 외주 흐름이 막히면 성장 속도가 크게 떨어집니다.", "반품 처리 조건은 고객 경험과 비용에 직접 영향을 줍니다."]
        },
        en: {
          title: "Check sourcing and outsourcing constraints",
          summary: "Review supplier access, outsourced packing, and return handling constraints.",
          why: ["Sourcing friction slows down growth.", "Return handling affects both cost and customer experience."]
        }
      }
    } as const;

    return details[taskId as keyof typeof details]?.[language] ?? {
      title: taskId,
      summary: "",
      why: []
    };
  }

  const details = {
    "use-check": {
      ko: {
        title: "업종 가능 여부 확인",
        summary: "건물 용도와 업종 제한이 맞지 않으면 계약 후에도 영업을 못 할 수 있어요.",
        why: ["건축물 용도와 실제 영업 업종이 맞아야 합니다.", "구청 신고나 인허가 단계에서 막히는지 미리 확인해야 합니다."]
      },
      en: {
        title: "Check permitted use",
        summary: "If zoning or building use does not fit your business, you may not be allowed to operate even after signing.",
        why: ["The building use category needs to match your actual business.", "This prevents permit issues later in the process."]
      }
    },
    "facility-check": {
      ko: {
        title: "시설과 설비 확인",
        summary: "전기, 수도, 배기 같은 기본 설비가 부족하면 예상보다 비용이 크게 늘 수 있어요.",
        why: ["기존 설비를 얼마나 재활용할 수 있는지 확인해야 합니다.", "추가 공사 비용이 초기 자본 계획을 흔들 수 있습니다."]
      },
      en: {
        title: "Review facilities",
        summary: "If utilities or ventilation are insufficient, setup costs can rise sharply.",
        why: ["Check how much of the current setup can actually be reused.", "Hidden construction work can change your budget materially."]
      }
    },
    "restriction-check": {
      ko: {
        title: "계약 제한 조항 확인",
        summary: "권리금, 업종 제한, 승인 조항은 나중에 가장 큰 분쟁 포인트가 될 수 있어요.",
        why: ["임대인의 승인 조건이나 업종 제한은 꼭 미리 봐야 합니다.", "권리금과 특약 조항은 계약 후 되돌리기 어렵습니다."]
      },
      en: {
        title: "Review lease restrictions",
        summary: "Approval clauses, category restrictions, and key money terms often become the biggest contract risks.",
        why: ["Landlord approval and use restrictions need early review.", "Special clauses are much harder to fix after signing."]
      }
    }
  } as const;

  return details[taskId as keyof typeof details]?.[language] ?? {
    title: taskId,
    summary: "",
    why: []
  };
}

function buildTransitionNotice(nextRoadmap: typeof starterRoadmap, language: "ko" | "en") {
  const nextStage =
    nextRoadmap.stages.find((stage) => stage.stageId === nextRoadmap.currentStageId) ??
    nextRoadmap.stages[0];
  const nextTitle = localizeStage(nextStage, language).title;
  return language === "ko"
    ? { title: "완료됨", body: `${nextTitle} 단계로 이어집니다.` }
    : { title: "Saved", body: `Next up: ${nextTitle}.` };
}

function formatConfidenceBadge(confidence: GuideQaAnswer["confidence"], language: "ko" | "en") {
  if (language === "ko") {
    if (confidence === "high") return "높음";
    if (confidence === "medium") return "보통";
    return "확인 필요";
  }

  if (confidence === "high") return "High";
  if (confidence === "medium") return "Medium";
  return "Check needed";
}

type GuideRecord = KnowledgeItemRecord & {
  sources: KnowledgeItemSourceRecord[];
  freshness?: import("@build-up/shared").FreshnessMeta;
};

type SavedFinanceSnapshot = {
  riskLevel: FinancialRiskLevel;
  survivabilityMonths?: number | null;
  breakEvenMonth?: number | null;
};

type SavedContractAnalysisSnapshot = {
  summary: string;
  riskLevel: "low" | "medium" | "high" | "critical";
};

type SavedGuideQaSnapshot = {
  question: string;
  answer: GuideQaAnswer;
};

type SavedFinanceInterpretationSnapshot = {
  summary: string;
  rationale: string[];
  warnings: string[];
  nextActions: string[];
};

function parseManwonInput(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) {
    return undefined;
  }

  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed * 10000;
}

const GUIDE_STAGE_CODES = ["permit_guide", "tax_guide", "loan_guide"] as const;

function getGuideSections(guide: GuideRecord | null, language: import("@build-up/shared").Language) {
  if (!guide) {
    return [];
  }

  return Object.entries(guide.payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({
      key,
      title: formatGuideSectionTitle(key, language),
      items: (value as unknown[]).map((item) => String(item))
    }));
}

function formatBreakEvenMonth(month: number | null | undefined, language: "ko" | "en") {
  if (month == null) {
    return language === "ko" ? "손익분기 미도달" : "Break-even not reached";
  }

  return language === "ko" ? `${month}개월` : `${month} months`;
}

function hydrateSavedFinanceSnapshot(
  decision?: WorkflowDecisionMap[string]
): SavedFinanceSnapshot | null {
  if (!decision?.inputs) {
    return null;
  }

  const riskLevel = decision.inputs.riskLevel;
  if (
    riskLevel !== "low" &&
    riskLevel !== "medium" &&
    riskLevel !== "high" &&
    riskLevel !== "critical"
  ) {
    return null;
  }

  const survivabilityMonths =
    typeof decision.inputs.survivabilityMonths === "number"
      ? decision.inputs.survivabilityMonths
      : null;
  const breakEvenMonth =
    typeof decision.inputs.breakEvenMonth === "number" ? decision.inputs.breakEvenMonth : null;

  return {
    riskLevel,
    survivabilityMonths,
    breakEvenMonth
  };
}

function hydrateSavedFinanceInterpretationSnapshot(
  decision?: WorkflowDecisionMap[string]
): SavedFinanceInterpretationSnapshot | null {
  if (!decision) {
    return null;
  }

  const rationale = Array.isArray(decision.inputs?.aiRationale)
    ? decision.inputs.aiRationale.filter((item): item is string => typeof item === "string")
    : [];
  const warnings = Array.isArray(decision.inputs?.aiWarnings)
    ? decision.inputs.aiWarnings.filter((item): item is string => typeof item === "string")
    : [];
  const nextActions = Array.isArray(decision.inputs?.aiNextActions)
    ? decision.inputs.aiNextActions.filter((item): item is string => typeof item === "string")
    : [];

  if (!decision.notes && rationale.length === 0 && warnings.length === 0 && nextActions.length === 0) {
    return null;
  }

  return {
    summary: decision.notes ?? "",
    rationale,
    warnings,
    nextActions
  };
}

function hydrateSavedContractAnalysisSnapshot(
  decision?: WorkflowDecisionMap[string]
): SavedContractAnalysisSnapshot | null {
  const inputs = decision?.inputs;
  const riskLevel = inputs?.riskLevel;

  if (
    !decision?.notes ||
    !(
      riskLevel === "low" ||
      riskLevel === "medium" ||
      riskLevel === "high" ||
      riskLevel === "critical"
    )
  ) {
    return null;
  }

  return {
    summary: decision.notes,
    riskLevel
  };
}

function hydrateSavedContractAnalysis(
  decision?: WorkflowDecisionMap[string]
): ContractAnalysisResult | null {
  if (!decision) {
    return null;
  }

  const inputs = decision.inputs;
  const riskLevel = inputs?.riskLevel;

  if (
    riskLevel !== "low" &&
    riskLevel !== "medium" &&
    riskLevel !== "high" &&
    riskLevel !== "critical"
  ) {
    return null;
  }

  let flaggedClauses: ContractAnalysisResult["flaggedClauses"] = [];
  if (typeof inputs?.flaggedClausesJson === "string") {
    try {
      const parsed = JSON.parse(inputs.flaggedClausesJson) as ContractAnalysisResult["flaggedClauses"];
      if (Array.isArray(parsed)) {
        flaggedClauses = parsed;
      }
    } catch {
      flaggedClauses = [];
    }
  }

  const missingItems = Array.isArray(inputs?.missingItems)
    ? inputs.missingItems.filter((item): item is string => typeof item === "string")
    : [];
  const unusualTerms = Array.isArray(inputs?.unusualTerms)
    ? inputs.unusualTerms.filter((item): item is string => typeof item === "string")
    : [];
  const nextActions = Array.isArray(inputs?.nextActions)
    ? inputs.nextActions.filter((item): item is string => typeof item === "string")
    : [];

  return {
    summary: decision.notes ?? "",
    riskLevel,
    flaggedClauses,
    missingItems,
    unusualTerms,
    nextActions
  };
}

function hydrateSavedGuideQaSnapshot(
  decision?: WorkflowDecisionMap[string]
): SavedGuideQaSnapshot | null {
  const inputs = decision?.inputs;

  if (!inputs || typeof inputs.question !== "string" || !decision?.notes) {
    return null;
  }

  const reasons = Array.isArray(inputs.reasons)
    ? inputs.reasons.filter((item): item is string => typeof item === "string")
    : [];
  const cautions = Array.isArray(inputs.cautions)
    ? inputs.cautions.filter((item): item is string => typeof item === "string")
    : [];
  const nextActions = Array.isArray(inputs.nextActions)
    ? inputs.nextActions.filter((item): item is string => typeof item === "string")
    : [];
  const confidence =
    inputs.confidence === "high" || inputs.confidence === "medium" || inputs.confidence === "check_needed"
      ? inputs.confidence
      : "medium";

  return {
    question: inputs.question,
    answer: {
      shortAnswer: decision.notes,
      explanation: typeof inputs.explanation === "string" ? inputs.explanation : "",
      reasons,
      cautions,
      nextActions,
      confidence,
      citations: []
    }
  };
}

function cloneStarterTaskMap(): WorkflowTaskMap {
  return Object.fromEntries(
    Object.entries(starterTaskMap).map(([stageCode, tasks]) => [
      stageCode,
      tasks.map((task) => ({ ...task }))
    ])
  );
}

export default function DashboardScreen({
  surface = "home",
  showSurfaceNav = false
}: {
  surface?: DashboardSurface;
  showSurfaceNav?: boolean;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = getUiCopy(language);
  const [decisions, setDecisions] = useState<WorkflowDecisionMap>(() => ({ ...starterDecisionMap }));
  const [roadmap, setRoadmap] = useState(() => ({ ...starterRoadmap }));
  const [taskMap, setTaskMap] = useState<WorkflowTaskMap>(cloneStarterTaskMap);
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | undefined>();
  const [selectedIndustryCategoryId, setSelectedIndustryCategoryId] = useState("food");
  const [selectedBusinessModelId, setSelectedBusinessModelId] = useState<string | undefined>();
  const [selectedBudget, setSelectedBudget] = useState<number | undefined>();
  const [budgetInputText, setBudgetInputText] = useState("");
  const [selectedOpenDate, setSelectedOpenDate] = useState<string | undefined>();
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [preferredRegionInput, setPreferredRegionInput] = useState("");
  const [locationMode, setLocationMode] = useState<"recommended" | "direct">("recommended");
  const [recommendedMarkets, setRecommendedMarkets] = useState<RecommendationItem[]>([]);
  const [customMarketName, setCustomMarketName] = useState("");
  const [customMarketReason, setCustomMarketReason] = useState("");
  const [manualMarketEvaluation, setManualMarketEvaluation] = useState<RecommendationItem | null>(null);
  const [manualAlternative, setManualAlternative] = useState<RecommendationItem | null>(null);
  const [selectedContractTaskId, setSelectedContractTaskId] = useState<string | undefined>();
  const [selectedGuideSectionKey, setSelectedGuideSectionKey] = useState<string | undefined>();
  const [guideQuestion, setGuideQuestion] = useState("");
  const [guideQaStatus, setGuideQaStatus] = useState<"idle" | "loading" | "error">("idle");
  const [guideQaError, setGuideQaError] = useState("");
  const [guideAnswer, setGuideAnswer] = useState<GuideQaAnswer | null>(null);
  const [contractText, setContractText] = useState("");
  const [contractAnalysisStatus, setContractAnalysisStatus] = useState<"idle" | "loading" | "error">("idle");
  const [contractAnalysisError, setContractAnalysisError] = useState("");
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysisResult | null>(null);
  const [financeCapitalText, setFinanceCapitalText] = useState("");
  const [financeMonthlyRentText, setFinanceMonthlyRentText] = useState("");
  const [financeLaborText, setFinanceLaborText] = useState("");
  const [financeRevenueText, setFinanceRevenueText] = useState("");
  const [financeMarketStyle, setFinanceMarketStyle] = useState<"office" | "residential" | "destination" | "hybrid">("hybrid");
  const [financeRentBand, setFinanceRentBand] = useState<"low" | "mid-low" | "mid" | "mid-high" | "high">("mid");
  const [financeStatus, setFinanceStatus] = useState<"idle" | "loading" | "error">("idle");
  const [financeError, setFinanceError] = useState("");
  const [financeResult, setFinanceResult] = useState<FinancialSimulationResult | null>(null);
  const [financeInterpretation, setFinanceInterpretation] = useState<AiStructuredResponse | null>(null);
  const [locationOptions, setLocationOptions] = useState(getStarterLocationOptions("food"));
  const [locationSourceLabel, setLocationSourceLabel] = useState<string>(copy.common.starterFallback);
  const [permitGuides, setPermitGuides] = useState<Awaited<ReturnType<typeof loadPermitKnowledge>>>([]);
  const [taxGuides, setTaxGuides] = useState<Awaited<ReturnType<typeof loadTaxKnowledge>>>([]);
  const [loanGuides, setLoanGuides] = useState<Awaited<ReturnType<typeof loadLoanKnowledge>>>([]);
  const [startupType, setStartupType] = useState<"franchise" | "independent" | "undecided" | undefined>();
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [lastUnlocked, setLastUnlocked] = useState<string[]>([]);
  const [authLabel, setAuthLabel] = useState<string>(copy.home.notConnected);
  const [persistenceLabel, setPersistenceLabel] = useState<string>(copy.home.localDemoMode);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [profile, setProfile] = useState<PersistedBusinessProfile | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [transitionNotice, setTransitionNotice] = useState<{ title: string; body: string } | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiBaseUrl = process.env.EXPO_PUBLIC_WEB_API_BASE ?? "http://localhost:3001";

  const currentStage =
    roadmap.stages.find((stage) => stage.stageId === roadmap.currentStageId) ?? roadmap.stages[0];
  const canCompleteIndustryStep = Boolean(selectedIndustryId);
  const canCompleteStartupTypeStep = Boolean(startupType);
  const canCompleteBusinessModelStep = Boolean(selectedBusinessModelId);
  const canCompleteBudgetStep = Boolean(selectedBudget && selectedOpenDate);
  const canCompleteLocationStep = Boolean(selectedLocationId);
  const hasPermitGuide = permitGuides.length > 0;
  const hasTaxGuide = taxGuides.length > 0;
  const hasLoanGuide = loanGuides.length > 0;
  const completedCount = roadmap.completedStageIds.length;
  const preferredRegion = profile?.preferredRegions?.[0];
  const industryCategoryId =
    getIndustryCategoryIdByOptionId(
      selectedIndustryId ??
        profile?.subIndustryId ??
        decisions["industry-selection"]?.selectedPrimaryOptionId
    ) ?? "food";
  const isDigitalCategory = industryCategoryId === "online-digital";
  const localizedCurrentStage = localizeStage(currentStage, language, industryCategoryId);
  const isGuideStage = GUIDE_STAGE_CODES.includes(
    currentStage.code as (typeof GUIDE_STAGE_CODES)[number]
  );
  const isFreshAccount =
    !profile?.subIndustryId &&
    !profile?.businessModelId &&
    completedCount === 0 &&
    currentStage.code === "industry_selection";
  const startupSummary = [
    profile?.subIndustryId
      ? localizeRecommendationItem({ id: profile.subIndustryId, title: profile.subIndustryId }, language)
          .title
      : undefined,
    profile?.startupType ? formatStartupType(profile.startupType, language) : undefined,
    profile?.businessModelId
      ? localizeRecommendationItem(
          { id: profile.businessModelId, title: profile.businessModelId },
          language
        ).title
      : undefined
  ]
    .filter(Boolean)
    .join(" · ");
  const savedFinanceSnapshot = hydrateSavedFinanceSnapshot(decisions["financial-simulation"]);
  const savedFinanceInterpretation = hydrateSavedFinanceInterpretationSnapshot(
    decisions["financial-simulation"]
  );
  const savedContractSnapshot = hydrateSavedContractAnalysisSnapshot(decisions["contract-analysis"]);
  const savedContractAnalysis = hydrateSavedContractAnalysis(decisions["contract-analysis"]);
  const selectedIndustryLabel =
    selectedIndustryId ??
    profile?.subIndustryId ??
    decisions["industry-selection"]?.selectedPrimaryOptionId
      ? localizeRecommendationItem(
          {
            id:
              selectedIndustryId ??
              profile?.subIndustryId ??
              decisions["industry-selection"]?.selectedPrimaryOptionId ??
              "",
            title:
              selectedIndustryId ??
              profile?.subIndustryId ??
              decisions["industry-selection"]?.selectedPrimaryOptionId ??
              ""
          },
          language
        ).title
      : copy.common.notSetYet;
  const nextStepSummary =
    currentStage.code === "industry_selection"
      ? copy.home.nextStepIndustry
      : currentStage.code === "startup_type"
        ? copy.home.nextStepStartupType
      : currentStage.code === "business_model"
        ? copy.home.nextStepModel
        : currentStage.code === "budget_setup"
          ? copy.home.nextStepBudget
          : currentStage.code === "location_candidates"
            ? copy.home.nextStepLocation
            : currentStage.code === "contract_review"
              ? copy.home.nextStepContract
              : currentStage.code === "permit_guide"
                ? copy.home.nextStepPermit
                : currentStage.code === "tax_guide"
                  ? copy.home.nextStepTax
                  : currentStage.code === "loan_guide"
                    ? copy.home.nextStepLoan
              : copy.home.nextStepDone;
  const locationHelpText = isDigitalCategory
    ? (language === "ko"
        ? "운영하고 싶은 권역을 적으면 작업·보관·택배 흐름 기준으로 거점 3곳을 추천하고, 직접 생각한 거점도 점검해드립니다."
        : "Enter your target area to see three operating-base suggestions focused on storage, packing, and logistics.")
    : copy.home.locationHelp;
  const locationRegionLabel = isDigitalCategory
    ? (language === "ko" ? "희망 운영 지역" : "Preferred base region")
    : (language === "ko" ? "희망 지역" : "Preferred region");
  const locationRecommendedLabel = isDigitalCategory
    ? (language === "ko" ? "추천 거점 보기" : "Recommended bases")
    : (language === "ko" ? "추천 상권 보기" : "Recommended markets");
  const locationDirectLabel = isDigitalCategory
    ? (language === "ko" ? "직접 입력하기" : "My own base")
    : (language === "ko" ? "직접 입력하기" : "My own market");
  const locationInputPlaceholder = isDigitalCategory
    ? (language === "ko" ? "예: 구로, 동대문, 일산" : "Example: Guro, Dongdaemun, Ilsan")
    : (language === "ko" ? "예: 성수동, 수원 영통, 부산 전포" : "Example: Seongsu, Pangyo, Jeonpo");
  const customLocationLabel = isDigitalCategory
    ? (language === "ko" ? "직접 생각한 운영 거점" : "Your chosen base")
    : (language === "ko" ? "직접 생각한 상권" : "Your chosen market");
  const customLocationPlaceholder = isDigitalCategory
    ? (language === "ko" ? "예: 구로 물류센터 인근, 집 근처 작업실" : "Example: near Guro logistics, home studio")
    : (language === "ko" ? "예: 성수역 3번 출구 근처" : "Example: near Seongsu Station exit 3");
  const customLocationReasonPlaceholder = isDigitalCategory
    ? (language === "ko" ? "왜 이 거점을 생각했는지 적어주세요." : "Why are you considering this base?")
    : (language === "ko" ? "왜 이 상권을 생각했는지 적어주세요." : "Why are you considering this market?");
  const scoreLocationLabel = isDigitalCategory
    ? (language === "ko" ? "이 거점 평가하기" : "Score this base")
    : (language === "ko" ? "이 상권 평가하기" : "Score this market");
  const selectedLocationDetailLabel = isDigitalCategory
    ? (language === "ko" ? "선택한 운영 거점 자세히 보기" : "Selected base details")
    : (language === "ko" ? "선택한 상권 자세히 보기" : "Selected market details");
  const activeBudgetValue = selectedBudget;
  const activeOpenDatePreset =
    starterOpenDatePresets.find((date) => date.value === selectedOpenDate) ?? null;
  const activeSurface = surface;
  const currentStageIndex = roadmap.stages.findIndex((stage) => stage.stageId === currentStage.stageId);
  const roadmapPreviewStages = roadmap.stages.slice(
    currentStageIndex >= 0 ? currentStageIndex : 0,
    (currentStageIndex >= 0 ? currentStageIndex : 0) + 2
  );
  const surfaceTabs = [
    { id: "home" as const, label: language === "ko" ? "홈" : "Home" },
    { id: "current" as const, label: language === "ko" ? "현재 단계" : "Current" },
    { id: "roadmap" as const, label: language === "ko" ? "로드맵" : "Roadmap" },
    { id: "guides" as const, label: language === "ko" ? "가이드" : "Guides" },
    { id: "profile" as const, label: language === "ko" ? "내 정보" : "Profile" }
  ];
  const navigateToSurface = (nextSurface: DashboardSurface) => {
    router.push(SURFACE_HREFS[nextSurface]);
  };

  const handleIndustryContinue = () => {
    if (!selectedIndustryId) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: selectedIndustryId,
      inputs: {
        subIndustryId: selectedIndustryId
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const resetDemo = () => {
    Alert.alert(
      language === "ko" ? "데모 초기화" : "Reset demo",
      language === "ko"
        ? "정말 초기화할까요? 현재 홈 화면과 서버 저장 상태에 바로 반영됩니다."
        : "Reset the demo? This will immediately update your home screen and saved server state.",
      [
        {
          text: language === "ko" ? "취소" : "Cancel",
          style: "cancel"
        },
        {
          text: language === "ko" ? "확인" : "Confirm",
          style: "destructive",
          onPress: () => {
            if (autosaveTimerRef.current) {
              clearTimeout(autosaveTimerRef.current);
            }

            setPersistenceReady(false);

            const nextDecisions: WorkflowDecisionMap = {};
            const nextTasks = cloneStarterTaskMap();
            const nextRoadmap = buildRoadmapState(
              {
                roadmapId:
                  roadmap.roadmapId && roadmap.roadmapId !== starterRoadmap.roadmapId
                    ? roadmap.roadmapId
                    : starterRoadmap.roadmapId,
                templateId: starterRoadmap.templateId,
                stages: starterStageFlow
              },
              nextDecisions,
              nextTasks
            );

            setDecisions(nextDecisions);
            setRoadmap(nextRoadmap);
            setTaskMap(nextTasks);
            setSelectedIndustryId(undefined);
            setSelectedIndustryCategoryId("food");
            setSelectedBusinessModelId(undefined);
            setSelectedBudget(undefined);
            setBudgetInputText("");
            setSelectedOpenDate(undefined);
            setSelectedLocationId(undefined);
            setPreferredRegionInput("");
            setLocationMode("recommended");
            setRecommendedMarkets([]);
            setCustomMarketName("");
            setCustomMarketReason("");
            setManualMarketEvaluation(null);
            setManualAlternative(null);
            setGuideQuestion("");
            setGuideAnswer(null);
            setGuideQaStatus("idle");
            setGuideQaError("");
            setContractText("");
            setContractAnalysis(null);
            setContractAnalysisStatus("idle");
            setContractAnalysisError("");
            setFinanceCapitalText("");
            setFinanceMonthlyRentText("");
            setFinanceLaborText("");
            setFinanceRevenueText("");
            setFinanceResult(null);
            setFinanceInterpretation(null);
            setFinanceStatus("idle");
            setFinanceError("");
            setStartupType(undefined);
            setLastUnlocked([]);
            setTransitionNotice(null);
            setProfile(null);
            setPersistenceLabel(language === "ko" ? "초기화 중..." : "Resetting...");
            router.replace(SURFACE_HREFS.home);

            void saveRoadmapState(supabase, {
              roadmap: nextRoadmap,
              decisions: nextDecisions,
              tasks: nextTasks
            })
              .then(async (persisted) => {
                setRoadmap(persisted.roadmap);
                setDecisions(persisted.decisions);
                setTaskMap(persisted.tasks);
                setProfile(await loadBusinessProfile(supabase));
                setPersistenceReady(true);
                setPersistenceLabel(
                  language === "ko" ? "초기화가 서버에 적용되었습니다." : "Reset applied to server."
                );
              })
              .catch((error) => {
                setPersistenceReady(true);
                setPersistenceLabel(
                  error instanceof Error
                    ? `${language === "ko" ? "초기화 저장 실패" : "Reset save failed"}: ${error.message}`
                    : language === "ko"
                      ? "초기화 저장 실패"
                      : "Reset save failed"
                );
              });
          }
        }
      ]
    );
  };

  const handleBusinessModelContinue = () => {
    if (!selectedBusinessModelId) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: selectedBusinessModelId,
      selectedOptionIds: [selectedBusinessModelId],
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleStartupTypeContinue = () => {
    if (!startupType) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "startup-type", {
      stageId: "startup-type",
      selectedPrimaryOptionId: startupType,
      selectedOptionIds: [startupType],
      inputs: {
        startupType
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleBudgetContinue = () => {
    if (!selectedBudget || !selectedOpenDate) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: {
        capital: selectedBudget,
        targetOpenDate: selectedOpenDate
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleLocationContinue = () => {
    if (!selectedLocationId) {
      return;
    }

    const nextDecisions = upsertStageDecision(decisions, "location-candidates", {
      stageId: "location-candidates",
      selectedPrimaryOptionId: selectedLocationId,
      selectedOptionIds: [selectedLocationId],
      inputs: {
        preferredRegion: preferredRegionInput,
        customMarketName,
        customMarketReason,
        selectionMode: locationMode,
        finalMarketTitle: finalSelectedMarket?.title ?? ""
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleContractTaskToggle = (taskId: string) => {
    const currentTasks = taskMap["contract-review"] ?? [];
    const existing = currentTasks.find((task) => task.taskId === taskId);

    if (!existing) {
      return;
    }

    const nextTaskMap = updateTaskStatus(
      taskMap,
      "contract-review",
      taskId,
      existing.status === "completed" ? "todo" : "completed"
    );

    setTaskMap(nextTaskMap);
    setRoadmap(
      buildRoadmapState(
        {
          roadmapId: starterRoadmap.roadmapId,
          templateId: starterRoadmap.templateId,
          stages: starterStageFlow
        },
        decisions,
        nextTaskMap
      )
    );
  };

  const handleContractContinue = () => {
    const transition = completeCurrentStage(roadmap, decisions, taskMap);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleVerificationContinue = (stageId: "permit-guide" | "tax-guide" | "loan-guide") => {
    const nextDecisions = upsertStageDecision(decisions, stageId, {
      stageId,
      inputs: {
        reviewed: true
      },
      completedAt: new Date().toISOString()
    });

    const transition = completeCurrentStage(roadmap, nextDecisions, taskMap);
    setDecisions(nextDecisions);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  useEffect(() => {
    if (!transitionNotice) {
      return;
    }

    if (transitionNoticeTimerRef.current) {
      clearTimeout(transitionNoticeTimerRef.current);
    }

    transitionNoticeTimerRef.current = setTimeout(() => {
      setTransitionNotice(null);
    }, 2600);

    return () => {
      if (transitionNoticeTimerRef.current) {
        clearTimeout(transitionNoticeTimerRef.current);
      }
    };
  }, [transitionNotice]);

  useEffect(() => {
    if (!financeCapitalText.trim()) {
      const nextCapital = selectedBudget ?? profile?.capital;
      if (typeof nextCapital === "number" && nextCapital > 0) {
        setFinanceCapitalText(String(Math.round(nextCapital / 10000)));
      }
    }
  }, [selectedBudget, profile?.capital, financeCapitalText]);

  useEffect(() => {
    const savedText = decisions["contract-analysis"]?.inputs?.contractText;
    if (!contractText.trim() && typeof savedText === "string" && savedText) {
      setContractText(savedText);
    }
  }, [decisions, contractText]);

  const contractTasks = taskMap["contract-review"] ?? [];
  const activeContractTask =
    contractTasks.find((task) => task.taskId === selectedContractTaskId) ?? contractTasks[0] ?? null;
  const activeContractTaskDetail = activeContractTask
    ? getContractTaskDetail(activeContractTask.taskId, language, industryCategoryId)
    : null;
  const activeGuide =
    currentStage.code === "permit_guide"
      ? permitGuides[0] ?? null
      : currentStage.code === "tax_guide"
        ? taxGuides[0] ?? null
        : currentStage.code === "loan_guide"
          ? loanGuides[0] ?? null
          : null;
  const activeGuideSections = getGuideSections(activeGuide, language);
  const activeGuideSection =
    activeGuideSections.find((section) => section.key === selectedGuideSectionKey) ??
    activeGuideSections[0] ??
    null;
  const activeGuideFreshness = getFreshnessPresentation(activeGuide?.freshness);
  const activeGuideActionLabel =
    currentStage.code === "permit_guide"
      ? copy.home.markPermitReviewed
      : currentStage.code === "tax_guide"
        ? copy.home.markTaxReviewed
        : copy.home.markLoanReviewed;
  const activeGuideEmptyLabel =
    currentStage.code === "permit_guide"
      ? copy.home.noPermitGuide
      : currentStage.code === "tax_guide"
        ? copy.home.noTaxGuide
        : copy.home.noLoanGuide;
  const guideDecisionKey = activeGuide ? `guide-qa-${activeGuide.id}` : undefined;
  const savedGuideQaSnapshot = hydrateSavedGuideQaSnapshot(
    guideDecisionKey ? decisions[guideDecisionKey] : undefined
  );
  const effectiveGuideAnswer = guideAnswer ?? savedGuideQaSnapshot?.answer ?? null;
  const handleContractAnalysis = async () => {
    const trimmed = contractText.trim();

    if (!trimmed) {
      return;
    }

    try {
      setContractAnalysisStatus("loading");
      setContractAnalysisError("");
      setContractAnalysis(null);

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          language === "ko" ? "로그인 세션을 다시 확인해 주세요." : "Please refresh your login session."
        );
      }

      const response = await fetch(`${apiBaseUrl}/api/ai/contract/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contractText: trimmed
        })
      });

      const payload = (await response.json()) as ContractAnalysisResult & {
        error?: string;
        detail?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(
          payload.detail ??
            payload.error ??
            (language === "ko" ? "계약서 분석에 실패했습니다." : "Failed to analyze the contract.")
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
          nextActions: payload.nextActions
        },
        notes: payload.summary,
        completedAt: new Date().toISOString()
      });

      setDecisions(nextDecisions);
      setContractAnalysis(payload);
      setContractAnalysisStatus("idle");
      await saveRoadmapState(supabase, {
        roadmap,
        decisions: nextDecisions,
        tasks: taskMap
      });
      setPersistenceReady(true);
      setPersistenceLabel(copy.home.savedToSupabase);
    } catch (error) {
      setContractAnalysisStatus("error");
      setContractAnalysisError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "계약서 분석에 실패했습니다."
            : "Failed to analyze the contract."
      );
    }
  };

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
          : "Enter your starting capital in KRW ten-thousands."
      );
      return;
    }

    try {
      setFinanceStatus("loading");
      setFinanceError("");
      setFinanceResult(null);
      setFinanceInterpretation(null);

      const result = await runFinancialSimulation(supabase, {
        capital,
        categoryId: industryCategoryId,
        marketStyle: financeMarketStyle,
        rentBand: financeRentBand,
        monthlyRent,
        monthlyLaborCost,
        expectedMonthlyRevenue
      });

      setFinanceResult(result);

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          language === "ko" ? "로그인 세션을 다시 확인해 주세요." : "Please refresh your login session."
        );
      }

      const response = await fetch(`${apiBaseUrl}/api/ai/finance/interpret`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          result,
          categoryLabel: selectedIndustryLabel
        })
      });

      const payload = (await response.json()) as AiStructuredResponse & {
        error?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(
          payload.error ??
            (language === "ko"
              ? "재무 해석에 실패했습니다."
              : "Failed to interpret the financial result.")
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
          aiNextActions: payload.nextActions
        },
        notes: payload.summary,
        completedAt: new Date().toISOString()
      });

      setDecisions(nextDecisions);
      setFinanceInterpretation(payload);
      setFinanceStatus("idle");
      await saveRoadmapState(supabase, {
        roadmap,
        decisions: nextDecisions,
        tasks: taskMap
      });
      setPersistenceReady(true);
      setPersistenceLabel(copy.home.savedToSupabase);
    } catch (error) {
      setFinanceStatus("error");
      setFinanceError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "재무 분석에 실패했습니다."
            : "Financial simulation failed."
      );
    }
  };

  const handleGuideQuestion = async () => {
    if (!activeGuide || !guideQuestion.trim()) {
      return;
    }

    try {
      setGuideQaStatus("loading");
      setGuideQaError("");
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          language === "ko" ? "로그인 세션을 다시 확인해 주세요." : "Please refresh your login session."
        );
      }

      const response = await fetch(`${apiBaseUrl}/api/ai/guides/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          guideId: activeGuide.id,
          question: guideQuestion.trim(),
          language
        })
      });

      const payload = (await response.json()) as GuideQaAnswer & {
        error?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(
          payload.error ??
            (language === "ko" ? "가이드 질문에 실패했습니다." : "Failed to answer the guide question.")
        );
      }

      const nextAnswer = payload;
      const nextDecisions = upsertStageDecision(decisions, `guide-qa-${activeGuide.id}`, {
        stageId: `guide-qa-${activeGuide.id}`,
        inputs: {
          question: guideQuestion.trim(),
          explanation: nextAnswer.explanation,
          reasons: nextAnswer.reasons,
          cautions: nextAnswer.cautions,
          nextActions: nextAnswer.nextActions,
          confidence: nextAnswer.confidence
        },
        notes: nextAnswer.shortAnswer,
        completedAt: new Date().toISOString()
      });
      setDecisions(nextDecisions);
      setGuideAnswer(nextAnswer);
      setGuideQaStatus("idle");
      await saveRoadmapState(supabase, {
        roadmap,
        decisions: nextDecisions,
        tasks: taskMap
      });
      setPersistenceReady(true);
      setPersistenceLabel(copy.home.savedToSupabase);
    } catch (error) {
      setGuideQaStatus("error");
      setGuideQaError(error instanceof Error ? error.message : "Failed to answer question.");
    }
  };
  const activeLocationCandidates =
    locationMode === "recommended" && !preferredRegionInput.trim()
      ? []
      : recommendedMarkets.length > 0
        ? recommendedMarkets
        : locationOptions;
  const finalSelectedMarket =
    locationMode === "direct"
      ? selectedLocationId === manualMarketEvaluation?.id
        ? manualMarketEvaluation
        : null
      : activeLocationCandidates.find((item) => item.id === selectedLocationId) ?? null;

  const connectAndLoad = async () => {
    try {
      const result = await bootstrapAccountWorkspace(supabase);
      const userLabel = result.user.email ?? copy.common.account;
      setAuthLabel(`${userLabel} · ${result.user.id.slice(0, 8)}`);
      setRequiresAuth(false);
      setAuthResolved(true);
      setPersistenceReady(true);
      setDecisions(result.state.decisions);
      setTaskMap(result.state.tasks);
      setRoadmap(result.state.roadmap);
      setProfile(await loadBusinessProfile(supabase, result.user));
      setPersistenceLabel(result.isNew ? copy.home.starterRoadmapCreated : copy.home.loadedFromSupabase);
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        setRequiresAuth(true);
        setAuthResolved(true);
        setPersistenceReady(false);
        setAuthLabel(copy.home.signInRequired);
        setPersistenceLabel(copy.home.noAccountSession);
        return;
      }

      setPersistenceLabel(
        error instanceof Error ? `${copy.home.loadFailed}: ${error.message}` : copy.home.loadFailed
      );
      setAuthResolved(true);
    }
  };

  const persistCurrentState = async () => {
    try {
      const result = await bootstrapAccountWorkspace(supabase);
      const user = result.user;
      setAuthLabel(`${user.email ?? copy.common.account} · ${user.id.slice(0, 8)}`);

      const persisted = await saveRoadmapState(supabase, {
        roadmap,
        decisions,
        tasks: taskMap
      });

      setRoadmap(persisted.roadmap);
      setProfile(await loadBusinessProfile(supabase, user));
      setPersistenceLabel(copy.home.savedToSupabase);
      setPersistenceReady(true);
    } catch (error) {
      setPersistenceLabel(
        error instanceof Error ? `${copy.home.saveFailed}: ${error.message}` : copy.home.saveFailed
      );
    }
  };

  useEffect(() => {
    void connectAndLoad();
  }, []);

  useEffect(() => {
    void getCurrentUser(supabase).then((user) => {
      if (!user || user.is_anonymous) {
        setRequiresAuth(true);
        setAuthResolved(true);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user || session.user.is_anonymous) {
        setRequiresAuth(true);
        setAuthResolved(true);
        router.replace("/auth");
        return;
      }

      void connectAndLoad();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!persistenceReady) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void saveRoadmapState(supabase, {
        roadmap,
        decisions,
        tasks: taskMap
      })
        .then(async () => {
          setProfile(await loadBusinessProfile(supabase));
          setPersistenceLabel(copy.home.autosaved);
        })
        .catch((error) => {
          setPersistenceLabel(
            error instanceof Error ? `${copy.home.autosaveFailed}: ${error.message}` : copy.home.autosaveFailed
          );
        });
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [roadmap, decisions, taskMap, persistenceReady]);

  useEffect(() => {
    if (requiresAuth) {
      return;
    }

    void loadKnowledgeRecommendations(supabase, {
      domain: "market-recommendation",
      itemType: "location_candidate",
      categoryId: industryCategoryId
    })
      .then((items) => {
        setLocationSourceLabel(items.length > 0 ? copy.common.liveKnowledgeLayer : copy.common.starterFallback);
        setLocationOptions((items.length > 0 ? items : getStarterLocationOptions(industryCategoryId)).map((item) => localizeRecommendationItem(item, language)));
      })
      .catch(() => {
        setLocationSourceLabel(copy.common.starterFallback);
        setLocationOptions(getStarterLocationOptions(industryCategoryId).map((item) => localizeRecommendationItem(item, language)));
      });
  }, [industryCategoryId, requiresAuth, language]);

  useEffect(() => {
    if (locationMode !== "recommended") {
      return;
    }

    if (!preferredRegionInput.trim()) {
      setRecommendedMarkets([]);
      return;
    }

    void loadMarketSignalRecommendations(supabase, {
      regionQuery: preferredRegionInput,
      categoryId: industryCategoryId
    })
      .then((signalItems) => {
        if (signalItems.length > 0) {
          setRecommendedMarkets(signalItems.map((item) => localizeRecommendationItem(item, language)));
          setLocationSourceLabel(language === "ko" ? "상권 신호 데이터" : "Market signal data");
          return;
        }

        setRecommendedMarkets(
          buildRecommendedMarkets({
            region: preferredRegionInput,
            categoryId: industryCategoryId,
            capital: selectedBudget,
            candidates: locationOptions
          }).map((item) => localizeRecommendationItem(item, language))
        );
        setLocationSourceLabel(copy.common.liveKnowledgeLayer);
      })
      .catch(() => {
        setRecommendedMarkets(
          buildRecommendedMarkets({
            region: preferredRegionInput,
            categoryId: industryCategoryId,
            capital: selectedBudget,
            candidates: locationOptions
          }).map((item) => localizeRecommendationItem(item, language))
        );
        setLocationSourceLabel(copy.common.starterFallback);
      });
  }, [preferredRegionInput, industryCategoryId, selectedBudget, locationOptions, language, locationMode]);

  useEffect(() => {
    if (requiresAuth) {
      return;
    }

    void Promise.all([
      loadPermitKnowledge(supabase, industryCategoryId),
      loadTaxKnowledge(supabase, industryCategoryId),
      loadLoanKnowledge(supabase, industryCategoryId)
    ])
      .then(([permits, taxes, loans]) => {
        setPermitGuides(permits.map((guide) => localizeGuideRecord(guide, language)));
        setTaxGuides(taxes.map((guide) => localizeGuideRecord(guide, language)));
        setLoanGuides(loans.map((guide) => localizeGuideRecord(guide, language)));
      })
      .catch(() => {
        setPermitGuides([]);
        setTaxGuides([]);
        setLoanGuides([]);
      });
  }, [industryCategoryId, requiresAuth, language]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>build.up</Text>
          <Text style={styles.title}>
            {isFreshAccount ? copy.home.heroFresh : copy.home.heroActive}
          </Text>
          <Text style={styles.subtitle}>
            {isFreshAccount
              ? copy.home.heroFreshBody
              : copy.home.heroActiveBody}
          </Text>
        </View>

        {authResolved && requiresAuth ? (
          <View style={styles.currentStageCard}>
            <Text style={styles.eyebrow}>{copy.common.account}</Text>
            <Text style={styles.currentTitle}>{copy.home.authRequiredTitle}</Text>
            <Text style={styles.currentBody}>{copy.home.authRequiredBody}</Text>
            <Link href="/auth" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{copy.home.authRequiredAction}</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {requiresAuth ? null : (
          <>
        {showSurfaceNav ? (
        <View style={styles.section}>
          <View style={styles.surfaceNav}>
            {surfaceTabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => navigateToSurface(tab.id)}
                style={[
                  styles.surfaceNavButton,
                  activeSurface === tab.id && styles.surfaceNavButtonSelected
                ]}
              >
                <Text
                  style={[
                    styles.surfaceNavButtonText,
                    activeSurface === tab.id && styles.surfaceNavButtonTextSelected
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        ) : null}

        {activeSurface === "home" ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{language === "ko" ? "홈" : "Home"}</Text>
            <View style={styles.currentStageCard}>
              <Text style={styles.currentMeta}>{language === "ko" ? "오늘의 진행" : "Today"}</Text>
              <Text style={styles.currentTitle}>{language === "ko" ? "지금 해야 할 일" : "What to do next"}</Text>
              <Text style={styles.currentBody}>{localizedCurrentStage.title}</Text>
            <View style={styles.summaryBar}>
              <View style={styles.summarySegment}>
                <Text style={styles.summarySegmentText}>{copy.home.progress} {roadmap.progressPercent}%</Text>
              </View>
              <View style={styles.summarySegment}>
                <Text style={styles.summarySegmentText}>{copy.home.completed} {completedCount} / {roadmap.stages.length}</Text>
              </View>
              {startupSummary ? (
                <View style={styles.summarySegment}>
                  <Text style={styles.summarySegmentText}>{startupSummary}</Text>
                </View>
              ) : null}
              {preferredRegion ? (
                <View style={[styles.summarySegment, styles.summarySegmentLast]}>
                  <Text style={styles.summarySegmentText}>{copy.home.region} {preferredRegion}</Text>
                </View>
              ) : null}
            </View>
            {savedFinanceSnapshot ? (
              <Pressable onPress={() => navigateToSurface("guides")} style={styles.inlineSummaryRow}>
                <Text style={styles.inlineSummaryLabel}>
                  {language === "ko" ? "최근 재무 분석" : "Recent finance review"}
                </Text>
                <Text style={styles.inlineSummaryValue}>
                  {language === "ko"
                    ? `${getRiskLevelLabel(savedFinanceSnapshot.riskLevel as never, language)} · ${savedFinanceSnapshot.survivabilityMonths ?? 0}개월`
                    : `${getRiskLevelLabel(savedFinanceSnapshot.riskLevel as never, language)} · ${savedFinanceSnapshot.survivabilityMonths ?? 0} mo`}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => navigateToSurface("current")} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{language === "ko" ? "현재 단계로 가기" : "Go to current step"}</Text>
            </Pressable>
            {isFreshAccount ? null : (
              <View style={styles.roadmapList}>
                {roadmapPreviewStages.map((stage, index) => (
                  <View
                    key={stage.code}
                    style={[styles.roadmapRow, stage.stageId === currentStage.stageId && styles.roadmapRowCurrent]}
                  >
                    <View style={styles.roadmapRowTop}>
                      <Text style={styles.roadmapIndex}>
                        {language === "ko" ? `${index + 1}단계` : `Step ${index + 1}`}
                      </Text>
                      <Text style={styles.roadmapStatus}>{formatStageStatus(stage.status, language)}</Text>
                    </View>
                    <Text style={styles.roadmapTitle}>{localizeStage(stage, language, industryCategoryId).title}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        ) : null}

        {activeSurface === "current" ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{copy.home.today}</Text>
          <View style={styles.currentStageCard}>
            <Text style={styles.currentMeta}>
              {language === "ko"
                ? `${currentStage.stepNumber}/${currentStage.totalSteps} 단계 · ${formatStageType(currentStage.type, language)}`
                : `Step ${currentStage.stepNumber} of ${currentStage.totalSteps} · ${formatStageType(currentStage.type, language)}`}
            </Text>
            <Text style={styles.currentTitle}>{localizedCurrentStage.title}</Text>
            <Text style={styles.currentBody}>
              {localizedCurrentStage.goal}
            </Text>
            {transitionNotice ? (
              <View style={styles.transitionNotice}>
                <Text style={styles.transitionNoticeTitle}>{transitionNotice.title}</Text>
                <Text style={styles.transitionNoticeText}>{transitionNotice.body}</Text>
              </View>
            ) : null}
            {isFreshAccount ? null : (
              <>
                <View style={styles.summaryBar}>
                  <View style={styles.summarySegment}>
                    <Text style={styles.summarySegmentText}>{copy.home.progress} {roadmap.progressPercent}%</Text>
                  </View>
                  <View style={styles.summarySegment}>
                    <Text style={styles.summarySegmentText}>{copy.home.completed} {completedCount} / {roadmap.stages.length}</Text>
                  </View>
                  {startupSummary ? (
                    <View style={styles.summarySegment}>
                      <Text style={styles.summarySegmentText}>{startupSummary}</Text>
                    </View>
                  ) : null}
                  {preferredRegion ? (
                    <View style={[styles.summarySegment, styles.summarySegmentLast]}>
                      <Text style={styles.summarySegmentText}>{copy.home.region} {preferredRegion}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.currentActionRail}>
                  <Pressable onPress={() => navigateToSurface("roadmap")} style={styles.currentUtilityButton}>
                    <Text style={styles.currentUtilityButtonText}>{language === "ko" ? "전체 로드맵" : "Roadmap"}</Text>
                  </Pressable>
                  <Pressable onPress={() => navigateToSurface("guides")} style={styles.currentUtilityButton}>
                    <Text style={styles.currentUtilityButtonText}>{language === "ko" ? "가이드" : "Guides"}</Text>
                  </Pressable>
                  <Pressable onPress={connectAndLoad} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.connectAndLoad}</Text>
                  </Pressable>
                  <Pressable onPress={persistCurrentState} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.saveProgress}</Text>
                  </Pressable>
                  <Pressable style={styles.currentStateChip}>
                    <Text style={styles.currentStateChipText}>{persistenceLabel}</Text>
                  </Pressable>
                </View>
              </>
            )}

            {currentStage.code === "industry_selection" ? (
              <>
                <Text style={styles.helper}>
                  {copy.home.chooseIndustryHelp}
                </Text>
                <View style={styles.toggleRow}>
                  {starterIndustryCategories.map((rawCategory) => {
                    const category = localizeStarterIndustryCategory(rawCategory, language);
                    return (
                    <Pressable
                      key={rawCategory.id}
                      onPress={() => {
                        setSelectedIndustryCategoryId(rawCategory.id);
                        setSelectedIndustryId(undefined);
                      }}
                      style={[
                        styles.toggleChip,
                        selectedIndustryCategoryId === rawCategory.id && styles.toggleChipSelected
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          selectedIndustryCategoryId === rawCategory.id && styles.toggleChipTextSelected
                        ]}
                      >
                        {category.title}
                      </Text>
                    </Pressable>
                  )})}
                </View>
                <Text style={styles.helper}>
                  {localizeStarterIndustryCategory(
                    starterIndustryCategories.find((category) => category.id === selectedIndustryCategoryId) ??
                      starterIndustryCategories[0],
                    language
                  ).summary}
                </Text>
                <View style={styles.optionList}>
                  {starterIndustryOptions
                    .filter((option) => option.meta?.categoryId === selectedIndustryCategoryId)
                    .slice(0, 6)
                    .map((rawOption) => {
                    const option = localizeRecommendationItem(rawOption, language);
                    const selected = selectedIndustryId === rawOption.id;

                    return (
                      <Pressable
                        key={rawOption.id}
                        onPress={() => setSelectedIndustryId(rawOption.id)}
                        style={[styles.optionCard, selected && styles.optionCardSelected]}
                      >
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionSummary} numberOfLines={2}>
                          {option.summary}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.stageFooter}>
                  <Pressable
                    onPress={handleIndustryContinue}
                    disabled={!canCompleteIndustryStep}
                    style={[
                      styles.primaryButton,
                      !canCompleteIndustryStep && styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>{language === "ko" ? "이 업종으로 다음 단계" : "Use this industry and continue"}</Text>
                  </Pressable>
                  <Pressable onPress={resetDemo} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.resetDemo}</Text>
                  </Pressable>
                </View>
              </>
            ) : currentStage.code === "startup_type" ? (
              <>
                <Text style={styles.helper}>
                  {copy.home.startupTypeHelp}
                </Text>
                <View style={styles.toggleRow}>
                  {(["independent", "franchise", "undecided"] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setStartupType(type)}
                      style={[styles.toggleChip, startupType === type && styles.toggleChipSelected]}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          startupType === type && styles.toggleChipTextSelected
                        ]}
                      >
                        {formatStartupType(type, language)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.stageFooter}>
                  <Pressable
                    onPress={handleStartupTypeContinue}
                    disabled={!canCompleteStartupTypeStep}
                    style={[
                      styles.primaryButton,
                      !canCompleteStartupTypeStep && styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>{language === "ko" ? "이 창업 형태로 계속" : "Use this startup type and continue"}</Text>
                  </Pressable>
                  <Pressable onPress={resetDemo} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.resetDemo}</Text>
                  </Pressable>
                </View>
              </>
            ) : currentStage.code === "business_model" ? (
              <>
                <Text style={styles.helper}>
                  {copy.home.businessModelHelp}
                </Text>
                <Text style={styles.helper}>
                  {language === "ko"
                    ? `${selectedIndustryLabel} 기준으로 운영 방식을 고르세요.`
                    : `Choose the operating model for ${selectedIndustryLabel}.`}
                </Text>
                <View style={styles.optionList}>
                  {getStarterBusinessModelOptions(industryCategoryId).map((rawOption) => {
                    const option = localizeRecommendationItem(rawOption, language);
                    const selected = selectedBusinessModelId === rawOption.id;

                    return (
                      <Pressable
                        key={rawOption.id}
                        onPress={() => setSelectedBusinessModelId(rawOption.id)}
                        style={[styles.optionCard, selected && styles.optionCardSelected]}
                      >
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionSummary}>{option.summary}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.stageFooter}>
                  <Pressable
                    onPress={handleBusinessModelContinue}
                    disabled={!canCompleteBusinessModelStep}
                    style={[
                      styles.primaryButton,
                      !canCompleteBusinessModelStep && styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>{language === "ko" ? "운영 방식 확정하고 계속" : "Lock this model and continue"}</Text>
                  </Pressable>
                  <Pressable onPress={resetDemo} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.resetDemo}</Text>
                  </Pressable>
                </View>
              </>
            ) : currentStage.code === "budget_setup" ? (
              <>
                <Text style={styles.helper}>
                  {copy.home.budgetHelp}
                </Text>
                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>
                    {language === "ko" ? "시작 자본금" : "Starting capital"}
                  </Text>
                  <Text style={styles.budgetValue}>
                    {typeof activeBudgetValue === "number"
                      ? formatBudgetPresetLabel(activeBudgetValue, language)
                      : language === "ko"
                        ? "아직 입력하지 않음"
                        : "Not set yet"}
                  </Text>
                  <Text style={styles.helper}>
                    {language === "ko"
                      ? "가장 가까운 예산을 먼저 고르고, 필요하면 바로 바꿔도 됩니다."
                      : "Choose the closest starting budget first. You can adjust it right away."}
                  </Text>
                  <TextInput
                    value={budgetInputText}
                    onChangeText={(value) => {
                      const digitsOnly = value.replace(/[^0-9]/g, "");
                      setBudgetInputText(digitsOnly);

                      if (!digitsOnly) {
                        setSelectedBudget(undefined);
                        return;
                      }

                      const nextValue = Number(digitsOnly);
                      if (!Number.isFinite(nextValue) || nextValue <= 0) {
                        setSelectedBudget(undefined);
                        return;
                      }

                      const nextBudget = nextValue * 10000;
                      setSelectedBudget(Math.min(300000000, Math.max(1000000, nextBudget)));
                    }}
                    keyboardType="number-pad"
                    placeholder={language === "ko" ? "예: 450" : "Example: 450"}
                    placeholderTextColor="#8A909C"
                    style={styles.budgetInput}
                  />
                  <Text style={styles.helper}>
                    {language === "ko"
                      ? "직접 입력은 만원 단위입니다. 450을 입력하면 450만원으로 저장됩니다."
                      : "Direct input uses ten-thousand KRW units. Enter 450 to save KRW 4,500,000."}
                  </Text>
                  <View style={styles.choiceGrid}>
                    {starterBudgetPresets.map((budget) => (
                      <Pressable
                        key={budget.id}
                        onPress={() => {
                          setSelectedBudget(budget.value);
                          setBudgetInputText(String(Math.round(budget.value / 10000)));
                        }}
                        style={[
                          styles.choiceCard,
                          selectedBudget === budget.value && styles.choiceCardSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceTitle,
                            selectedBudget === budget.value && styles.choiceTitleSelected
                          ]}
                        >
                          {formatBudgetPresetLabel(budget.value, language)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>
                    {language === "ko" ? "목표 오픈 시점" : "Target opening window"}
                  </Text>
                  <Text style={styles.choiceTitle}>
                    {activeOpenDatePreset
                      ? formatOpenDatePresetLabel(
                          activeOpenDatePreset.id,
                          activeOpenDatePreset.label,
                          language
                        )
                      : language === "ko"
                        ? "아직 선택하지 않음"
                        : "Not selected yet"}
                  </Text>
                  <View style={styles.choiceGrid}>
                    {starterOpenDatePresets.map((date) => (
                      <Pressable
                        key={date.id}
                        onPress={() => setSelectedOpenDate(date.value)}
                        style={[
                          styles.choiceCard,
                          selectedOpenDate === date.value && styles.choiceCardSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceTitle,
                            selectedOpenDate === date.value && styles.choiceTitleSelected
                          ]}
                        >
                          {formatOpenDatePresetLabel(date.id, date.label, language)}
                        </Text>
                        <Text style={styles.choiceCaption}>
                          {language === "ko"
                            ? "이 일정에 맞춰 로드맵 속도를 조정합니다."
                            : "Roadmap timing will follow this window."}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.stageFooter}>
                  <Pressable
                    onPress={handleBudgetContinue}
                    disabled={!canCompleteBudgetStep}
                    style={[
                      styles.primaryButton,
                      !canCompleteBudgetStep && styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>{language === "ko" ? "예산 저장하고 상권 보기" : "Save budget and open markets"}</Text>
                  </Pressable>
                  <Pressable onPress={resetDemo} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.resetDemo}</Text>
                  </Pressable>
                </View>
              </>
            ) : currentStage.code === "location_candidates" ? (
              <>
                <Text style={styles.helper}>
                  {locationHelpText}
                </Text>
                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>
                    {locationRegionLabel}
                  </Text>
                  <TextInput
                    value={preferredRegionInput}
                    onChangeText={setPreferredRegionInput}
                    placeholder={locationInputPlaceholder}
                    placeholderTextColor="#8A909C"
                    style={styles.budgetInput}
                  />
                  <View style={styles.toggleRow}>
                    <Pressable
                      onPress={() => {
                        setLocationMode("recommended");
                        setManualMarketEvaluation(null);
                        setManualAlternative(null);
                      }}
                      style={[
                        styles.toggleChip,
                        locationMode === "recommended" && styles.toggleChipSelected
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          locationMode === "recommended" && styles.toggleChipTextSelected
                        ]}
                      >
                        {locationRecommendedLabel}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setLocationMode("direct");
                        setSelectedLocationId(undefined);
                      }}
                      style={[
                        styles.toggleChip,
                        locationMode === "direct" && styles.toggleChipSelected
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          locationMode === "direct" && styles.toggleChipTextSelected
                        ]}
                      >
                        {locationDirectLabel}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {locationMode === "recommended" ? (
                  <View style={styles.optionList}>
                    {activeLocationCandidates.map((item) => {
                      const selected = selectedLocationId === item.id;
                      const freshness = getFreshnessPresentation(item.freshness);

                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            if (!freshness.isSelectable) {
                              return;
                            }

                            setSelectedLocationId(item.id);
                          }}
                          style={[
                            styles.optionCard,
                            selected && styles.optionCardSelected,
                            !freshness.isSelectable && styles.optionCardDisabled
                          ]}
                        >
                          <View style={styles.recommendationTop}>
                            <Text style={styles.optionTitle}>{item.title}</Text>
                            <View style={styles.scoreBadge}>
                              <Text style={styles.scoreBadgeText}>
                                {language === "ko" ? `점수 ${item.score ?? "-"}` : `Score ${item.score ?? "-"}`}
                              </Text>
                            </View>
                          </View>
                          {item.meta?.districtName ? (
                            <Text style={styles.helper}>
                              {String(item.meta.districtName)}
                            </Text>
                          ) : null}
                          <Text style={styles.optionSummary}>{item.summary}</Text>
                          <View style={styles.metricWrap}>
                            <View style={styles.metricChip}>
                              <Text style={styles.metricChipText}>
                                {language === "ko" ? "임대료" : "Rent"} {formatMarketMetaValue("rentBand", item.meta?.rentBand, language)}
                              </Text>
                            </View>
                            <View style={styles.metricChip}>
                              <Text style={styles.metricChipText}>
                                {language === "ko" ? "경쟁도" : "Competition"} {formatMarketMetaValue("competitionLevel", item.meta?.competitionLevel, language)}
                              </Text>
                            </View>
                            <View style={styles.metricChip}>
                              <Text style={styles.metricChipText}>
                                {language === "ko" ? "적합도" : "Fit"} {formatMarketMetaValue("customerFit", item.meta?.customerFit, language)}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <>
                    <View style={styles.budgetPanel}>
                      <Text style={styles.budgetLabel}>
                        {customLocationLabel}
                      </Text>
                      <TextInput
                        value={customMarketName}
                        onChangeText={setCustomMarketName}
                        placeholder={customLocationPlaceholder}
                        placeholderTextColor="#8A909C"
                        style={styles.budgetInput}
                      />
                      <TextInput
                        value={customMarketReason}
                        onChangeText={setCustomMarketReason}
                        placeholder={customLocationReasonPlaceholder}
                        placeholderTextColor="#8A909C"
                        style={[styles.budgetInput, styles.multilineInput]}
                        multiline
                      />
                      <Pressable
                        onPress={async () => {
                          const signal = await loadBestMarketSignal(supabase, {
                            regionQuery: preferredRegionInput,
                            marketQuery: customMarketName,
                            categoryId: industryCategoryId
                          }).catch(() => null);
                          const result = evaluateDirectMarket({
                            region: preferredRegionInput,
                            marketName: customMarketName,
                            categoryId: industryCategoryId,
                            capital: selectedBudget,
                            candidates: locationOptions,
                            signal
                          });
                          const evaluation = localizeRecommendationItem(result.evaluation, language);
                          const alternative = result.alternative
                            ? localizeRecommendationItem(result.alternative, language)
                            : null;
                          setManualMarketEvaluation(evaluation);
                          setManualAlternative(alternative);
                          setSelectedLocationId(undefined);
                        }}
                        disabled={!customMarketName.trim()}
                        style={[
                          styles.secondaryButton,
                          !customMarketName.trim() && styles.primaryButtonDisabled
                        ]}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {scoreLocationLabel}
                        </Text>
                      </Pressable>
                    </View>

                    {manualMarketEvaluation ? (
                      <View style={styles.optionCard}>
                        <Text style={styles.budgetLabel}>
                          {language === "ko" ? "평가 결과" : "Evaluation"}
                        </Text>
                        <View style={styles.recommendationTop}>
                          <Text style={styles.optionTitle}>{manualMarketEvaluation.title}</Text>
                          <View style={styles.scoreBadge}>
                            <Text style={styles.scoreBadgeText}>
                              {language === "ko" ? `점수 ${manualMarketEvaluation.score ?? "-"}` : `Score ${manualMarketEvaluation.score ?? "-"}`}
                            </Text>
                          </View>
                        </View>
                        {manualMarketEvaluation.meta?.districtName ? (
                          <Text style={styles.helper}>
                            {String(manualMarketEvaluation.meta.districtName)}
                          </Text>
                        ) : null}
                        <Text style={styles.optionSummary}>{manualMarketEvaluation.summary}</Text>
                        <Text style={styles.helper}>
                          {language === "ko"
                            ? "이 상권으로 진행할지, build.up이 한 번 더 제안하는 대안을 볼지 선택하세요."
                            : "Choose whether to keep this market or review one suggested alternative."}
                        </Text>
                        <View style={styles.stageInlineActions}>
                          <Pressable
                            onPress={() => setSelectedLocationId(manualMarketEvaluation.id)}
                            style={styles.primaryButton}
                          >
                            <Text style={styles.primaryButtonText}>
                              {language === "ko" ? "내가 고른 상권 유지" : "Keep my market"}
                            </Text>
                          </Pressable>
                          {manualAlternative ? (
                            <Pressable
                              onPress={() => {
                                setLocationMode("recommended");
                                setRecommendedMarkets(
                                  buildRecommendedMarkets({
                                    region: preferredRegionInput || customMarketName,
                                    categoryId: industryCategoryId,
                                    capital: selectedBudget,
                                    candidates: locationOptions
                                  }).map((item) => localizeRecommendationItem(item, language))
                                );
                                setSelectedLocationId(manualAlternative.id);
                              }}
                              style={styles.secondaryButton}
                            >
                              <Text style={styles.secondaryButtonText}>
                                {language === "ko" ? "추천 대안 보기" : "View suggested alternative"}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                        {manualAlternative ? (
                          <View style={styles.budgetPanel}>
                            <Text style={styles.budgetLabel}>
                              {language === "ko" ? "이런 곳은 어떠세요?" : "How about this instead?"}
                            </Text>
                            <Text style={styles.choiceTitle}>{manualAlternative.title}</Text>
                            <Text style={styles.choiceCaption}>{manualAlternative.summary}</Text>
                            <Text style={styles.helper}>
                              {language === "ko"
                                ? "원래 고른 상권도 계속 유지할 수 있습니다."
                                : "You can still keep your original market choice."}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                )}

                {finalSelectedMarket ? (
                  <View style={styles.budgetPanel}>
                    <Text style={styles.budgetLabel}>
                      {selectedLocationDetailLabel}
                    </Text>
                    <View style={styles.recommendationTop}>
                      <Text style={styles.optionTitle}>{finalSelectedMarket.title}</Text>
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>
                          {language === "ko" ? `점수 ${finalSelectedMarket.score ?? "-"}` : `Score ${finalSelectedMarket.score ?? "-"}`}
                        </Text>
                      </View>
                    </View>
                    {finalSelectedMarket.meta?.districtName ? (
                      <Text style={styles.helper}>
                        {String(finalSelectedMarket.meta.districtName)}
                      </Text>
                    ) : null}
                    <Text style={styles.optionSummary}>{finalSelectedMarket.summary}</Text>
                    <Text style={styles.helper}>
                      {buildMarketScoreNarrative(finalSelectedMarket, language)}
                    </Text>
                    <Text style={styles.budgetLabel}>
                      {language === "ko" ? "왜 괜찮은가" : "Why this works"}
                    </Text>
                    {finalSelectedMarket.reasons?.slice(0, 2).map((reason) => (
                      <Text key={reason} style={styles.helper}>
                        {reason}
                      </Text>
                    ))}
                    <Text style={styles.budgetLabel}>
                      {language === "ko" ? "주의할 점" : "Watch-outs"}
                    </Text>
                    {finalSelectedMarket.warnings?.slice(0, 1).map((warning) => (
                      <Text key={warning} style={styles.warningText}>
                        {warning}
                      </Text>
                    ))}
                  </View>
                ) : null}

                <View style={styles.stageFooter}>
                  <Pressable
                    onPress={handleLocationContinue}
                    disabled={!canCompleteLocationStep}
                    style={[
                      styles.primaryButton,
                      !canCompleteLocationStep && styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isDigitalCategory
                        ? language === "ko"
                          ? "이 거점으로 운영 준비 시작"
                          : "Use this base and continue"
                        : copy.home.selectMarketAndContinue}
                    </Text>
                  </Pressable>
                  <Pressable onPress={resetDemo} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.resetDemo}</Text>
                  </Pressable>
                </View>
              </>
            ) : currentStage.code === "contract_review" ? (
              <>
                <Text style={styles.helper}>
                  {isDigitalCategory
                    ? language === "ko"
                      ? "운영 공간, 보관, 택배, 공급 접근성처럼 온라인 판매의 실제 실행 조건을 먼저 점검합니다."
                      : "Review workspace, storage, shipping, and sourcing conditions before scaling online operations."
                    : copy.home.contractHelp}
                </Text>
                <Text style={styles.budgetLabel}>
                  {language === "ko" ? "꼭 볼 것 3개" : "Three must-check items"}
                </Text>
                <View style={styles.optionList}>
                  {contractTasks.map((task) => {
                    const completed = task.status === "completed";
                    const selected = activeContractTask?.taskId === task.taskId;

                    return (
                      <Pressable
                        key={task.taskId}
                        onPress={() => setSelectedContractTaskId(task.taskId)}
                        style={[styles.optionCard, selected && styles.optionCardSelected, completed && styles.optionCardSelected]}
                      >
                        <View style={styles.recommendationTop}>
                          <Text style={styles.optionTitle}>
                            {getContractTaskDetail(task.taskId, language, industryCategoryId).title}
                          </Text>
                        <View style={styles.scoreBadge}>
                          <Text style={styles.scoreBadgeText}>
                              {completed
                                ? language === "ko"
                                  ? "완료"
                                  : "Done"
                                : `${task.estimatedMinutes ?? "-"} ${language === "ko" ? "분" : "min"}`}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.optionSummary}>
                          {selected ? activeContractTaskDetail?.summary : copy.common.requiredReviewItem}
                      </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {activeContractTask && activeContractTaskDetail ? (
                  <View style={styles.budgetPanel}>
                    <Text style={styles.budgetLabel}>
                      {language === "ko" ? "현재 확인할 항목" : "Current review item"}
                    </Text>
                    <View style={styles.recommendationTop}>
                      <Text style={styles.optionTitle}>{activeContractTaskDetail.title}</Text>
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>
                          {activeContractTask.status === "completed"
                            ? language === "ko"
                              ? "완료"
                              : "Done"
                            : `${activeContractTask.estimatedMinutes ?? "-"} ${language === "ko" ? "분" : "min"}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.optionSummary}>{activeContractTaskDetail.summary}</Text>
                    <Text style={styles.budgetLabel}>
                      {language === "ko" ? "왜 중요한가" : "Why it matters"}
                    </Text>
                    {activeContractTaskDetail.why.map((item) => (
                      <Text key={item} style={styles.helper}>
                        {item}
                      </Text>
                    ))}
                    <View style={styles.stageInlineActions}>
                      <Pressable
                        onPress={() => handleContractTaskToggle(activeContractTask.taskId)}
                        style={activeContractTask.status === "completed" ? styles.secondaryButton : styles.primaryButton}
                      >
                        <Text style={activeContractTask.status === "completed" ? styles.secondaryButtonText : styles.primaryButtonText}>
                          {activeContractTask.status === "completed"
                            ? language === "ko"
                              ? "다시 확인하기로 표시"
                              : "Mark as not reviewed"
                            : language === "ko"
                              ? "이 항목 확인 완료"
                              : "Mark this item reviewed"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>
                    {language === "ko" ? "계약서 조항 분석" : "Contract clause analysis"}
                  </Text>
                  {savedContractSnapshot ? (
                    <View style={[styles.inlineSummaryRow, styles.aiInlineSummaryRow]}>
                      <Text style={styles.inlineSummaryLabel}>
                        {language === "ko" ? "최근 계약서 분석" : "Recent contract analysis"}
                      </Text>
                      <Text style={styles.inlineSummaryValue}>
                        {savedContractSnapshot.summary}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.aiHelper}>
                    {language === "ko"
                      ? "상가 임대차 계약서 원문을 붙여넣으면 위험 조항, 누락 항목, 특이 조건을 먼저 짚어드립니다."
                      : "Paste the lease text to flag risky clauses, missing items, and unusual terms before signing."}
                  </Text>
                  <TextInput
                    value={contractText}
                    onChangeText={setContractText}
                    multiline
                    style={[styles.budgetInput, styles.multilineInput]}
                    placeholder={
                      language === "ko"
                        ? "임대차 계약서 원문을 붙여넣어 보세요. 예: 임대료, 원상복구, 권리금, 해지 조항..."
                        : "Paste the lease text here. Focus on rent, restoration, key money, termination, and renewal clauses."
                    }
                    placeholderTextColor="#8A909C"
                  />
                  <Text style={styles.aiHelper}>
                    {language === "ko"
                      ? "최소 100자 이상, 10,000자 이하의 텍스트를 권장합니다."
                      : "Use at least 100 characters and keep the text under 10,000 characters."}
                  </Text>
                  <Pressable
                    onPress={handleContractAnalysis}
                    disabled={!contractText.trim() || contractAnalysisStatus === "loading"}
                    style={[
                      styles.secondaryButton,
                      (!contractText.trim() || contractAnalysisStatus === "loading") &&
                        styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {contractAnalysisStatus === "loading"
                        ? language === "ko" ? "분석 중..." : "Analyzing..."
                        : language === "ko" ? "계약서 분석하기" : "Analyze contract"}
                    </Text>
                  </Pressable>
                  {contractAnalysisError ? <Text style={styles.warningText}>{contractAnalysisError}</Text> : null}
                  {(contractAnalysis ?? savedContractAnalysis) ? (
                    <View style={[styles.budgetPanel, styles.aiBudgetPanel]}>
                      <View style={styles.answerMetaRow}>
                        <Text style={styles.budgetLabel}>
                          {language === "ko" ? "AI 해석 · 계약서 원문 기반" : "AI interpretation · grounded in contract text"}
                        </Text>
                        <Text style={styles.confidenceBadge}>
                          {(contractAnalysis ?? savedContractAnalysis)?.riskLevel === "critical"
                            ? language === "ko" ? "위험 높음" : "High risk"
                            : (contractAnalysis ?? savedContractAnalysis)?.riskLevel === "high"
                              ? language === "ko" ? "주의 필요" : "Needs caution"
                              : (contractAnalysis ?? savedContractAnalysis)?.riskLevel === "medium"
                                ? language === "ko" ? "검토 권장" : "Review suggested"
                                : language === "ko" ? "기본 확인" : "Basic review"}
                        </Text>
                      </View>
                      <Text style={styles.budgetLabel}>{language === "ko" ? "한 줄 요약" : "Summary"}</Text>
                      <Text style={styles.optionTitle}>{(contractAnalysis ?? savedContractAnalysis)?.summary}</Text>
                      {((contractAnalysis ?? savedContractAnalysis)?.flaggedClauses ?? []).slice(0, 3).length ? (
                        <>
                          <Text style={styles.budgetLabel}>{language === "ko" ? "위험 조항" : "Flagged clauses"}</Text>
                          {((contractAnalysis ?? savedContractAnalysis)?.flaggedClauses ?? []).slice(0, 3).map((clause) => (
                            <View key={`${clause.excerpt}-${clause.issue}`} style={styles.budgetPanel}>
                              <Text style={styles.optionSummary}>{clause.excerpt}</Text>
                              <Text style={clause.severity === "danger" ? styles.criticalText : styles.warningText}>
                                {clause.issue}
                              </Text>
                            </View>
                          ))}
                        </>
                      ) : null}
                      {((contractAnalysis ?? savedContractAnalysis)?.missingItems ?? []).slice(0, 3).length ? (
                        <>
                          <Text style={styles.budgetLabel}>{language === "ko" ? "누락 확인 항목" : "Missing checks"}</Text>
                          {((contractAnalysis ?? savedContractAnalysis)?.missingItems ?? []).slice(0, 3).map((item) => (
                            <Text key={item} style={styles.aiHelper}>• {item}</Text>
                          ))}
                        </>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                <View style={styles.stageFooter}>
                  <Pressable
                    onPress={handleContractContinue}
                    disabled={!contractTasks.every((task) => task.status === "completed")}
                    style={[
                      styles.primaryButton,
                      !contractTasks.every((task) => task.status === "completed") &&
                        styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>{copy.home.completeContractReview}</Text>
                  </Pressable>
                  <Pressable onPress={resetDemo} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.resetDemo}</Text>
                  </Pressable>
                </View>
              </>
            ) : isGuideStage ? (
              <>
                {activeGuide ? (
                  <View style={styles.step}>
                    <Text style={styles.stepMeta}>
                      {language === "ko"
                        ? currentStage.code === "permit_guide"
                          ? "인허가"
                          : currentStage.code === "tax_guide"
                            ? "세무"
                            : "대출"
                        : activeGuide.domain}
                    </Text>
                    <Text style={styles.stepTitle}>{activeGuide.title}</Text>
                    <Text style={styles.stepGoal}>{activeGuide.summary}</Text>
                    <Text
                      style={
                        activeGuideFreshness.tone === "critical"
                          ? styles.criticalText
                          : activeGuideFreshness.tone === "warning"
                            ? styles.warningText
                            : styles.freshnessText
                      }
                    >
                      {activeGuideFreshness.summary}
                    </Text>
                    {activeGuide.freshness?.notes ? (
                      <Text style={styles.helper}>{activeGuide.freshness.notes}</Text>
                    ) : null}
                    <Text style={styles.budgetLabel}>
                      {language === "ko" ? "핵심 요약" : "Core sections"}
                    </Text>
                    <View style={styles.optionList}>
                      {activeGuideSections.map((section) => {
                        const selected = activeGuideSection?.key === section.key;
                        return (
                          <Pressable
                            key={section.key}
                            onPress={() => setSelectedGuideSectionKey(section.key)}
                            style={[styles.optionCard, selected && styles.optionCardSelected]}
                          >
                            <Text style={styles.optionTitle}>{section.title}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {activeGuideSection ? (
                      <View style={styles.budgetPanel}>
                        <Text style={styles.budgetLabel}>
                          {language === "ko" ? "선택한 항목 자세히 보기" : "Selected section"}
                        </Text>
                        <Text style={styles.optionTitle}>{activeGuideSection.title}</Text>
                        {activeGuideSection.items.slice(0, 3).map((item: string) => (
                          <Text key={item} style={styles.helper}>
                            {item}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    <View style={styles.budgetPanel}>
                      <Text style={styles.budgetLabel}>{language === "ko" ? "가이드 Q&A" : "Guide Q&A"}</Text>
                      {savedGuideQaSnapshot ? (
                        <View style={[styles.inlineSummaryRow, styles.aiInlineSummaryRow]}>
                          <Text style={styles.inlineSummaryLabel}>
                            {language === "ko" ? "최근 질문" : "Recent question"}
                          </Text>
                          <Text style={styles.inlineSummaryValue}>{savedGuideQaSnapshot.question}</Text>
                        </View>
                      ) : null}
                      <TextInput
                        value={guideQuestion}
                        onChangeText={setGuideQuestion}
                        placeholder={
                          language === "ko"
                            ? "현재 가이드에 대해 궁금한 점을 적어보세요."
                            : "Ask a question about this guide."
                        }
                        multiline
                        style={[styles.budgetInput, styles.multilineInput]}
                      />
                      <Pressable
                        onPress={handleGuideQuestion}
                        disabled={!guideQuestion.trim() || guideQaStatus === "loading"}
                        style={[
                          styles.secondaryButton,
                          (!guideQuestion.trim() || guideQaStatus === "loading") && styles.primaryButtonDisabled
                        ]}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {guideQaStatus === "loading"
                            ? language === "ko" ? "해석 중..." : "Answering..."
                            : language === "ko" ? "질문하기" : "Ask"}
                        </Text>
                      </Pressable>
                      {guideQaError ? <Text style={styles.warningText}>{guideQaError}</Text> : null}
                      {effectiveGuideAnswer ? (
                        <View style={[styles.budgetPanel, styles.aiBudgetPanel]}>
                          <View style={styles.answerMetaRow}>
                            <Text style={styles.budgetLabel}>
                              {language === "ko" ? "AI 해석 · 가이드 근거 기반" : "AI interpretation · grounded in guide content"}
                            </Text>
                            <Text style={styles.confidenceBadge}>
                              {formatConfidenceBadge(effectiveGuideAnswer.confidence, language)}
                            </Text>
                          </View>
                          <Text style={styles.budgetLabel}>{language === "ko" ? "짧은 답" : "Short answer"}</Text>
                          <Text style={styles.optionTitle}>{effectiveGuideAnswer.shortAnswer}</Text>
                          <Text style={styles.aiHelper}>{effectiveGuideAnswer.explanation}</Text>
                          <Text style={styles.budgetLabel}>{language === "ko" ? "주의할 점" : "Cautions"}</Text>
                          {effectiveGuideAnswer.cautions.map((item) => (
                            <Text key={item} style={styles.aiHelper}>• {item}</Text>
                          ))}
                          <Text style={styles.budgetLabel}>{language === "ko" ? "다음 행동" : "Next actions"}</Text>
                          {effectiveGuideAnswer.nextActions.map((item) => (
                            <Text key={item} style={styles.aiHelper}>• {item}</Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                    {activeGuide.sources[0] ? (
                      <View style={styles.profileGrid}>
                        <Text style={styles.profileLabel}>{copy.common.source}</Text>
                        <Text style={styles.freshnessText}>{activeGuide.sources[0].sourceName}</Text>
                        <Text style={styles.freshnessText}>{activeGuide.sources[0].sourceUrl}</Text>
                        {activeGuide.sources[0].verifiedAt ? (
                          <Text style={styles.freshnessText}>
                            {copy.common.verified} {activeGuide.sources[0].verifiedAt.slice(0, 10)}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.warningText}>{activeGuideEmptyLabel}</Text>
                )}
                <View style={styles.stageFooter}>
                  {activeGuide ? (
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/guide/${activeGuide.id}?stageId=${
                            currentStage.code === "permit_guide"
                              ? "permit-guide"
                              : currentStage.code === "tax_guide"
                                ? "tax-guide"
                                : "loan-guide"
                          }`
                        )
                      }
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>{copy.common.openFullGuideDetail}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() =>
                      handleVerificationContinue(
                        currentStage.code === "permit_guide"
                          ? "permit-guide"
                          : currentStage.code === "tax_guide"
                            ? "tax-guide"
                            : "loan-guide"
                      )
                    }
                    disabled={!activeGuide}
                    style={[
                      styles.primaryButton,
                      !activeGuide && styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>{activeGuideActionLabel}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.helper}>
                  {copy.home.completeStarterLoop}
                </Text>
                <View style={styles.stageFooter}>
                  <Pressable onPress={resetDemo} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.resetDemo}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
        ) : null}

        {activeSurface === "profile" && !isFreshAccount ? (
          <View style={styles.section}>
            <View style={styles.roadmapRowTop}>
              <Text style={styles.sectionLabel}>{language === "ko" ? "build.up 구조" : "How build.up works"}</Text>
            </View>
            {starterStepCards.map((rawCard) => {
                  const card = localizeStarterStepCard(rawCard, language);
                  return (
                  <View key={card.title} style={styles.card}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSummary}>{card.summary}</Text>
                    {card.points.map((point) => (
                      <Text key={point} style={styles.cardPoint}>
                        • {point}
                      </Text>
                    ))}
                  </View>
                );})}
          </View>
        ) : null}

        {activeSurface === "profile" && !isFreshAccount ? (
          <View style={styles.section}>
            <View style={styles.roadmapRowTop}>
              <Text style={styles.sectionLabel}>{copy.home.profile}</Text>
            </View>
            <View style={styles.currentStageCard}>
                <Text style={styles.currentTitle}>{copy.home.savedFounderSetup}</Text>
                <View style={styles.profileGrid}>
                  <ProfileItem
                    label={copy.home.subIndustry}
                    value={
                      profile?.subIndustryId
                        ? localizeRecommendationItem({ id: profile.subIndustryId, title: profile.subIndustryId }, language).title
                        : copy.common.notSetYet
                    }
                  />
                  <ProfileItem label={copy.home.startupType} value={formatStartupType(profile?.startupType, language)} />
                  <ProfileItem
                    label={copy.home.businessModel}
                    value={
                      profile?.businessModelId
                        ? localizeRecommendationItem({ id: profile.businessModelId, title: profile.businessModelId }, language).title
                        : copy.common.notSetYet
                    }
                  />
                  <ProfileItem
                    label={copy.home.capital}
                    value={
                      typeof profile?.capital === "number"
                        ? formatBudgetPresetLabel(profile.capital, language)
                        : copy.common.notSetYet
                    }
                  />
                </View>
                {savedFinanceSnapshot ? (
                  <Pressable onPress={() => navigateToSurface("guides")} style={styles.inlineSummaryRow}>
                    <Text style={styles.inlineSummaryLabel}>
                      {language === "ko" ? "최근 재무 분석" : "Recent finance review"}
                    </Text>
                    <Text style={styles.inlineSummaryValue}>
                      {language === "ko"
                        ? `${getRiskLevelLabel(savedFinanceSnapshot.riskLevel as never, language)} · ${formatBreakEvenMonth(savedFinanceSnapshot.breakEvenMonth, language)}`
                        : `${getRiskLevelLabel(savedFinanceSnapshot.riskLevel as never, language)} · ${formatBreakEvenMonth(savedFinanceSnapshot.breakEvenMonth, language)}`}
                    </Text>
                  </Pressable>
                ) : null}
                {showProfileDetails ? (
                  <View style={styles.profileGrid}>
                    <ProfileItem label={copy.home.targetOpenDate} value={profile?.targetOpenDate ?? copy.common.notSetYet} />
                    <ProfileItem
                      label={copy.home.preferredRegion}
                      value={profile?.preferredRegions?.[0] ?? copy.common.notSetYet}
                    />
                  </View>
                ) : null}
                <Pressable onPress={() => setShowProfileDetails((value) => !value)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>
                    {showProfileDetails
                      ? language === "ko" ? "접기" : "Show less"
                      : language === "ko" ? "더 보기" : "Show more"}
                  </Text>
                </Pressable>
              </View>
          </View>
        ) : null}

        {activeSurface === "guides" && !isFreshAccount && !isGuideStage ? (
          <View style={styles.section}>
            <View style={styles.step}>
              <Text style={styles.stepMeta}>{language === "ko" ? "재무 시뮬레이션" : "Financial simulation"}</Text>
              <Text style={styles.stepTitle}>
                {language === "ko"
                  ? "초기 비용과 고정비를 바탕으로 손익분기와 운영 여력을 계산합니다."
                  : "Estimate break-even timing and operating runway from your setup and fixed costs."}
              </Text>
              <View style={styles.budgetPanel}>
                <Text style={styles.budgetLabel}>
                  {language === "ko" ? "자본금 (만원)" : "Capital (10k KRW)"}
                </Text>
                <TextInput
                  value={financeCapitalText}
                  onChangeText={(text) => setFinanceCapitalText(text.replace(/[^\d]/g, ""))}
                  style={styles.budgetInput}
                  placeholder={language === "ko" ? "예: 8000" : "Ex: 8000"}
                  placeholderTextColor="#8A909C"
                  keyboardType="numeric"
                />
                <Text style={styles.budgetLabel}>
                  {language === "ko" ? "시장 성격" : "Market style"}
                </Text>
                <View style={styles.toggleRow}>
                  {(["office", "residential", "destination", "hybrid"] as const).map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setFinanceMarketStyle(item)}
                      style={[styles.toggleChip, financeMarketStyle === item && styles.toggleChipSelected]}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          financeMarketStyle === item && styles.toggleChipTextSelected
                        ]}
                      >
                        {formatMarketMetaValue("marketStyle", item, language)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.budgetLabel}>
                  {language === "ko" ? "임대료 구간" : "Rent band"}
                </Text>
                <View style={styles.toggleRow}>
                  {(["low", "mid-low", "mid", "mid-high", "high"] as const).map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setFinanceRentBand(item)}
                      style={[styles.toggleChip, financeRentBand === item && styles.toggleChipSelected]}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          financeRentBand === item && styles.toggleChipTextSelected
                        ]}
                      >
                        {formatMarketMetaValue("rentBand", item, language)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.budgetLabel}>
                  {language === "ko" ? "월 임대료 (만원, 선택)" : "Monthly rent (10k KRW, optional)"}
                </Text>
                <TextInput
                  value={financeMonthlyRentText}
                  onChangeText={(text) => setFinanceMonthlyRentText(text.replace(/[^\d]/g, ""))}
                  style={styles.budgetInput}
                  placeholder={language === "ko" ? "예: 180" : "Ex: 180"}
                  placeholderTextColor="#8A909C"
                  keyboardType="numeric"
                />
                <Text style={styles.budgetLabel}>
                  {language === "ko" ? "월 인건비 (만원, 선택)" : "Monthly labor (10k KRW, optional)"}
                </Text>
                <TextInput
                  value={financeLaborText}
                  onChangeText={(text) => setFinanceLaborText(text.replace(/[^\d]/g, ""))}
                  style={styles.budgetInput}
                  placeholder={language === "ko" ? "예: 250" : "Ex: 250"}
                  placeholderTextColor="#8A909C"
                  keyboardType="numeric"
                />
                <Text style={styles.budgetLabel}>
                  {language === "ko" ? "예상 월 매출 (만원, 선택)" : "Expected revenue (10k KRW, optional)"}
                </Text>
                <TextInput
                  value={financeRevenueText}
                  onChangeText={(text) => setFinanceRevenueText(text.replace(/[^\d]/g, ""))}
                  style={styles.budgetInput}
                  placeholder={
                    language === "ko" ? "비워두면 보수적 기준 반영" : "Leave blank for benchmark"
                  }
                  placeholderTextColor="#8A909C"
                  keyboardType="numeric"
                />
                <Text style={styles.aiHelper}>
                  {language === "ko"
                    ? `현재 선택 기준: ${selectedIndustryLabel} · ${formatMarketMetaValue("marketStyle", financeMarketStyle, language)} · ${formatMarketMetaValue("rentBand", financeRentBand, language)}`
                    : `Based on your current setup: ${selectedIndustryLabel} · ${formatMarketMetaValue("marketStyle", financeMarketStyle, language)} · ${formatMarketMetaValue("rentBand", financeRentBand, language)}`}
                </Text>
                <Pressable
                  onPress={handleRunFinancialSimulation}
                  disabled={financeStatus === "loading"}
                  style={[styles.primaryButton, financeStatus === "loading" && styles.primaryButtonDisabled]}
                >
                  <Text style={styles.primaryButtonText}>
                    {financeStatus === "loading"
                      ? language === "ko" ? "계산 중..." : "Running..."
                      : language === "ko" ? "시뮬레이션 실행" : "Run simulation"}
                  </Text>
                </Pressable>
                {financeError ? <Text style={styles.warningText}>{financeError}</Text> : null}
              </View>
              {savedFinanceSnapshot ? (
                <Pressable style={styles.inlineSummaryRow}>
                  <Text style={styles.inlineSummaryLabel}>
                    {language === "ko" ? "최근 재무 분석" : "Recent finance review"}
                  </Text>
                  <Text style={styles.inlineSummaryValue}>
                    {language === "ko"
                      ? `${getRiskLevelLabel(savedFinanceSnapshot.riskLevel as never, language)} · ${savedFinanceSnapshot.survivabilityMonths ?? 0}개월 버팀`
                      : `${getRiskLevelLabel(savedFinanceSnapshot.riskLevel as never, language)} · ${savedFinanceSnapshot.survivabilityMonths ?? 0} months runway`}
                  </Text>
                </Pressable>
              ) : null}
              {(financeResult ?? savedFinanceSnapshot) ? (
                <View style={styles.budgetPanel}>
                  <View style={styles.answerMetaRow}>
                    <Text style={styles.budgetLabel}>{language === "ko" ? "결과" : "Results"}</Text>
                    <Text style={styles.confidenceBadge}>
                      {getRiskLevelLabel((financeResult ?? savedFinanceSnapshot)!.riskLevel, language)}
                    </Text>
                  </View>
                  <View style={styles.profileGrid}>
                    <ProfileItem
                      label={language === "ko" ? "버틸 수 있는 기간" : "Runway"}
                      value={
                        language === "ko"
                          ? `${(financeResult ?? savedFinanceSnapshot)!.survivabilityMonths}개월`
                          : `${(financeResult ?? savedFinanceSnapshot)!.survivabilityMonths} months`
                      }
                    />
                    <ProfileItem
                      label={language === "ko" ? "손익분기 시점" : "Break-even"}
                      value={formatBreakEvenMonth(
                        financeResult
                          ? financeResult.breakEven.estimatedBreakEvenMonth
                          : savedFinanceSnapshot!.breakEvenMonth,
                        language
                      )}
                    />
                  </View>
                  {(financeInterpretation ?? savedFinanceInterpretation) ? (
                    <View style={[styles.budgetPanel, styles.aiBudgetPanel]}>
                      <Text style={styles.budgetLabel}>
                        {language === "ko" ? "AI 해석 · 계산 결과 기반" : "AI interpretation · grounded in simulation"}
                      </Text>
                      <Text style={styles.optionTitle}>
                        {(financeInterpretation ?? savedFinanceInterpretation)?.summary}
                      </Text>
                      {((financeInterpretation ?? savedFinanceInterpretation)?.rationale ?? []).slice(0, 3).map((item) => (
                        <Text key={item} style={styles.aiHelper}>• {item}</Text>
                      ))}
                      {((financeInterpretation ?? savedFinanceInterpretation)?.warnings ?? []).slice(0, 3).length ? (
                        <>
                          <Text style={styles.budgetLabel}>{language === "ko" ? "주의할 점" : "Cautions"}</Text>
                          {((financeInterpretation ?? savedFinanceInterpretation)?.warnings ?? []).slice(0, 3).map((item) => (
                            <Text key={item} style={styles.aiHelper}>• {item}</Text>
                          ))}
                        </>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.stepGoal}>
                  {language === "ko"
                    ? "자본금, 임대료, 인건비, 예상 매출을 넣어 손익분기와 운전자금을 계산할 수 있습니다."
                    : "Enter capital, rent, labor, and revenue to estimate break-even and runway."}
                </Text>
              )}
            </View>
            <View style={styles.roadmapRowTop}>
              <Text style={styles.sectionLabel}>{copy.home.operationalGuides}</Text>
            </View>
            {[permitGuides[0], taxGuides[0], loanGuides[0]]
                  .filter(Boolean)
                  .map((guide) => {
                    const freshness = getFreshnessPresentation(guide?.freshness);
                    return (
                      <Pressable
                        key={guide?.id}
                        style={styles.step}
                        onPress={() => router.push(`/guide/${guide?.id}`)}
                      >
                        <Text style={styles.stepMeta}>
                          {language === "ko"
                            ? guide?.domain === "permit-guide"
                              ? "인허가"
                              : guide?.domain === "tax-guide"
                                ? "세무"
                                : guide?.domain === "loan-guide"
                                  ? "대출"
                                  : guide?.domain
                            : guide?.domain}
                        </Text>
                        <Text style={styles.stepTitle}>{guide?.title}</Text>
                        <Text style={styles.stepGoal}>{guide?.summary}</Text>
                        <Text
                          style={
                            freshness.tone === "critical"
                              ? styles.criticalText
                              : freshness.tone === "warning"
                                ? styles.warningText
                                : styles.freshnessText
                          }
                        >
                          {freshness.summary}
                        </Text>
                        {guide?.sources[0] ? (
                          <Text style={styles.freshnessText}>
                            {copy.common.source} {guide.sources[0].sourceName}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
          </View>
        ) : null}

        {activeSurface === "roadmap" && !isFreshAccount ? (
          <View style={styles.section}>
            <View style={styles.roadmapRowTop}>
              <Text style={styles.sectionLabel}>{copy.home.starterFlow}</Text>
            </View>
            <View style={styles.roadmapList}>
                {roadmap.stages.map((stage, index) => {
                  const isCurrent = stage.stageId === currentStage.stageId;
                  const isCompleted = stage.status === "completed";
                  return (
                  <View
                    key={stage.code}
                    style={[
                      styles.roadmapRow,
                      isCurrent && styles.roadmapRowCurrent,
                      isCompleted && styles.roadmapRowCompleted
                    ]}
                  >
                    <View style={styles.roadmapRowTop}>
                      <Text style={styles.roadmapIndex}>
                        {language === "ko" ? `${index + 1}단계` : `Step ${index + 1}`}
                      </Text>
                      <Text style={[styles.roadmapStatus, isCompleted && styles.roadmapStatusQuiet]}>
                        {formatStageStatus(stage.status, language)}
                      </Text>
                    </View>
                    <Text style={[styles.roadmapTitle, isCompleted && !isCurrent && styles.roadmapTitleQuiet]}>
                      {localizeStage(stage, language, industryCategoryId).title}
                    </Text>
                    {isCurrent ? (
                      <Text style={styles.helper}>{localizeStage(stage, language, industryCategoryId).goal}</Text>
                    ) : null}
                    {!isCompleted || isCurrent ? (
                      <Text style={[styles.roadmapStatus, isCompleted && styles.roadmapStatusQuiet]}>
                        {formatStageType(stage.type, language)}
                      </Text>
                    ) : null}
                  </View>
                );
                })}
              </View>
          </View>
        ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileItem(props: { label: string; value: string }) {
  return (
    <View style={styles.profileItem}>
      <Text style={styles.profileLabel}>{props.label}</Text>
      <Text style={styles.profileValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F6F3"
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16
  },
  hero: {
    gap: 12,
    paddingTop: 20,
    paddingBottom: 8
  },
  eyebrow: {
    fontSize: 13,
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: "#1D3557"
  },
  title: {
    fontSize: 38,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -1.4,
    color: "#111111"
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "#5B616E"
  },
  section: {
    gap: 12
  },
  surfaceNav: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    padding: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(255,255,255,0.46)"
  },
  surfaceNavButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  surfaceNavButtonSelected: {
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(255,255,255,0.72)"
  },
  surfaceNavButtonText: {
    fontSize: 14,
    color: "#5B616E"
  },
  surfaceNavButtonTextSelected: {
    color: "#1D3557",
    fontWeight: "600"
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    borderRadius: 24,
    padding: 20,
    gap: 10
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111111"
  },
  cardSummary: {
    fontSize: 15,
    lineHeight: 24,
    color: "#5B616E"
  },
  cardPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5B616E"
  },
  currentStageCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.76)",
    borderRadius: 24,
    padding: 20,
    gap: 9,
    shadowColor: "#111111",
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  },
  currentMeta: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#1D3557"
  },
  currentTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: "#111111"
  },
  currentBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5B616E"
  },
  transitionNotice: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(29,53,87,0.12)",
    backgroundColor: "rgba(29,53,87,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4
  },
  transitionNoticeTitle: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#1D3557",
    fontWeight: "700"
  },
  transitionNoticeText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#1D3557"
  },
  helper: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5B616E"
  },
  summaryBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.52)"
  },
  summarySegment: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRightWidth: 1,
    borderRightColor: "rgba(17,17,17,0.06)"
  },
  summarySegmentLast: {
    borderRightWidth: 0
  },
  summarySegmentText: {
    fontSize: 12,
    color: "#5B616E"
  },
  inlineSummaryRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.66)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4
  },
  aiInlineSummaryRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3
  },
  inlineSummaryLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#5B616E"
  },
  inlineSummaryValue: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: "#111111"
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  currentActionRail: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center"
  },
  currentUtilityButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.62)",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  currentUtilityButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#5B616E"
  },
  currentStateChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.46)",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  currentStateChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#5B616E"
  },
  quickActionGrid: {
    gap: 10
  },
  quickActionCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: 20,
    padding: 16,
    gap: 6,
    shadowColor: "#111111",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111"
  },
  quickActionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5B616E"
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  pillText: {
    fontSize: 13,
    color: "#5B616E"
  },
  optionList: {
    gap: 10
  },
  optionCard: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: "#111111",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  optionCardSelected: {
    borderColor: "rgba(29,53,87,0.28)",
    backgroundColor: "rgba(29,53,87,0.04)"
  },
  optionCardDisabled: {
    opacity: 0.56
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111111"
  },
  optionSummary: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5B616E"
  },
  recommendationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  scoreBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(29,53,87,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D3557"
  },
  metricWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metricChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.8)"
  },
  metricChipText: {
    fontSize: 12,
    color: "#5B616E"
  },
  freshnessText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#5B616E"
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#C58B2A"
  },
  criticalText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#B64C4C"
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  budgetPanel: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    borderRadius: 22,
    padding: 18,
    gap: 10
  },
  aiBudgetPanel: {
    padding: 15,
    gap: 8
  },
  answerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  budgetLabel: {
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#5B616E"
  },
  confidenceBadge: {
    fontSize: 11,
    color: "#1D3557",
    backgroundColor: "rgba(29,53,87,0.08)",
    borderWidth: 1,
    borderColor: "rgba(29,53,87,0.1)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden"
  },
  budgetValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: "#111111"
  },
  budgetInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#111111"
  },
  multilineInput: {
    minHeight: 82,
    textAlignVertical: "top"
  },
  aiHelper: {
    fontSize: 13,
    lineHeight: 20,
    color: "#5B616E"
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  choiceCard: {
    width: "48%",
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    gap: 4
  },
  choiceCardSelected: {
    borderColor: "rgba(29,53,87,0.28)",
    backgroundColor: "rgba(29,53,87,0.06)"
  },
  choiceTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: "#111111"
  },
  choiceTitleSelected: {
    color: "#1D3557"
  },
  choiceCaption: {
    fontSize: 13,
    lineHeight: 19,
    color: "#5B616E"
  },
  toggleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF"
  },
  toggleChipSelected: {
    borderColor: "rgba(29,53,87,0.28)",
    backgroundColor: "rgba(29,53,87,0.06)"
  },
  toggleChipText: {
    fontSize: 14,
    color: "#5B616E"
  },
  toggleChipTextSelected: {
    color: "#1D3557",
    fontWeight: "600"
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  stageFooter: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(247,246,243,0.74)"
  },
  stageInlineActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center"
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: "#1D3557",
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  primaryButtonDisabled: {
    opacity: 0.45
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  secondaryButtonText: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "500"
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#5B616E"
  },
  roadmapList: {
    gap: 10
  },
  roadmapRow: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    padding: 14,
    gap: 8
  },
  roadmapRowCurrent: {
    borderColor: "rgba(29,53,87,0.22)",
    backgroundColor: "#FFFFFF"
  },
  roadmapRowCompleted: {
    backgroundColor: "rgba(255,255,255,0.58)",
    borderColor: "rgba(17,17,17,0.06)"
  },
  roadmapRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  roadmapIndex: {
    fontSize: 12,
    letterSpacing: 1.4,
    color: "#1D3557"
  },
  roadmapTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111"
  },
  roadmapStatus: {
    fontSize: 13,
    color: "#5B616E"
  },
  roadmapStatusQuiet: {
    color: "rgba(91,97,110,0.72)"
  },
  roadmapTitleQuiet: {
    color: "rgba(17,17,17,0.72)"
  },
  step: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    padding: 18,
    gap: 8
  },
  stepMeta: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#1D3557"
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111111"
  },
  stepGoal: {
    fontSize: 15,
    lineHeight: 24,
    color: "#5B616E"
  },
  profileGrid: {
    gap: 10
  },
  profileItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4
  },
  profileLabel: {
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#5B616E"
  },
  profileValue: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: "#111111"
  }
});
