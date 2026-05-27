import {
  buildMarketScoreNarrative,
  buildRecommendedMarkets,
  buildRoadmapState,
  calculateHealthMetrics,
  calculateMoM,
  calculateMonthlyPnL,
  bootstrapAccountWorkspace,
  completeCurrentStage,
  evaluateDirectMarket,
  forecastSales,
  formatBudgetPresetLabel,
  formatMarketMetaValue,
  formatGuideSectionTitle,
  formatOpenDatePresetLabel,
  getRiskLevelLabel,
  formatStageStatus,
  formatStageType,
  formatStartupType,
  franchiseBrands,
  computeOverallScore,
  formatFranchiseCost,
  getScoreLabel,
  getMatchedHighlights,
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
  localizeTaskTitle,
  loadKnowledgeRecommendations,
  loadLoanKnowledge,
  loadBestMarketSignal,
  loadBusinessProfile,
  loadMarketSignalRecommendations,
  loadPermitKnowledge,
  loadStoreData,
  runFinancialSimulation,
  saveRoadmapState,
  saveStoreData,
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
  type UserStoreData,
  type WorkflowTaskMap,
  type WorkflowDecisionMap
} from "@build-up/shared";
import type { AiStructuredResponse, ContractAnalysisResult, RoadmapGenerationResult } from "@build-up/ai";
import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";
import { AuroraBackground, colors, radii, shadows } from "../lib/design";
import { useLanguage } from "../lib/language-provider";
import { SURFACE_HREFS, type DashboardSurface } from "../lib/navigation/surfaces";
import { AppHeader, HeroIntro, SurfaceSwitcher, type SurfaceTabItem } from "../lib/components/AppChrome";

// MarketingChannelKey → dashboard-screen-marketing.ts (re-export 됨).

// 2026-05-27 Phase 2: 타입·변환·상수·포매터 → 별도 파일로 분리.
//   closure 의존성 없는 pure functions / data 만 추출 (안전).
import {
  emptyMobileMonthlyCosts,
  isRecord,
  KNOWN_STORE_FIELDS,
  toMobileDailyEntries,
  toMobileEmployees,
  toMobileInventoryItems,
  toMobileProducts,
  toMobileSubscribers,
  toMobileSubscriptionPlans,
  type MobileDailyEntry,
  type MobileEmployee,
  type MobileInventoryItem,
  type MobileMonthlyCosts,
  type MobileProduct,
  type MobileSubscriber,
  type MobileSubscriptionPlan,
} from "./dashboard-screen-data";
import {
  parseManwonInput,
  formatWonCompact,
  formatBreakEvenMonth,
} from "./dashboard-screen-formatters";
import {
  mobileMarketingChannels,
  mobileRecommendedMarketingChannels,
  type MarketingChannelKey,
} from "./dashboard-screen-marketing";

// 마케팅 채널 상수 → dashboard-screen-marketing.ts 로 분리.

function getMobileStageAssistCopy(stageId: string, language: "ko" | "en") {
  const ko = language === "ko";
  const startupStages = new Set([
    "startup-foundation",
    "customer-discovery",
    "company-setup",
    "mvp-build",
    "launch-gtm",
    "growth-engine",
    "fundraising-readiness",
    "venture-certification"
  ]);
  const onlineStages = new Set([
    "platform-setup",
    "online-registration",
    "sourcing-setup",
    "store-setup",
    "online-marketing"
  ]);
  const offlineStages = new Set([
    "permit-check",
    "construction-setup",
    "vendor-setup",
    "registration-setup",
    "insurance-tax-setup",
    "hiring-setup",
    "operations-setup",
    "pre-launch"
  ]);

  if (stageId === "franchise-application") {
    return ko
      ? "정보공개서, 가맹본부 상담, 기존 점주 인터뷰처럼 돈을 쓰기 전에 확인해야 하는 항목부터 끝내세요."
      : "Clear disclosure, HQ consultation, and owner interview tasks before committing capital.";
  }

  if (startupStages.has(stageId)) {
    return ko
      ? "아이디어를 문서로만 남기지 말고 고객 검증, 출시 준비, 지표 관리까지 실행 단위로 쪼개 진행합니다."
      : "Move from idea to customer validation, launch readiness, and metrics in concrete execution tasks.";
  }

  if (onlineStages.has(stageId)) {
    return ko
      ? "온라인 판매는 계정, 통신판매 신고, 소싱, 상세페이지, 광고 준비가 서로 이어지므로 완료 순서를 지키는 게 중요합니다."
      : "Online sales depend on account setup, filings, sourcing, product pages, and ads working in sequence.";
  }

  if (offlineStages.has(stageId)) {
    return ko
      ? "오프라인 창업은 인허가, 공사, 공급처, 고용, 오픈 운영이 비용과 일정에 직접 연결됩니다."
      : "Offline launch tasks connect permits, construction, vendors, hiring, and opening operations to cost and timing.";
  }

  return ko
    ? "필수 항목을 모두 체크하면 다음 로드맵 단계가 열립니다. 선택 항목은 리스크를 줄이는 보조 작업입니다."
    : "Complete every required item to unlock the next roadmap step. Optional items reduce risk.";
}

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

// parseManwonInput / formatWonCompact / formatBreakEvenMonth → dashboard-screen-formatters.ts.
// 변환 함수들 (isRecord, toMobileXxx) + KNOWN_STORE_FIELDS → dashboard-screen-data.ts.

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
  const [franchiseFilterCat, setFranchiseFilterCat] = useState("all");
  const [expandedFranchiseId, setExpandedFranchiseId] = useState<string | null>(null);
  const [selectedMarketingChannel, setSelectedMarketingChannel] = useState<MarketingChannelKey | null>(null);
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
  const [onboardingMode, setOnboardingMode] = useState<"ai" | "existing" | null>(null);
  const [existingStep, setExistingStep] = useState(1);
  const [existingCategoryId, setExistingCategoryId] = useState("food");
  const [existingIndustryId, setExistingIndustryId] = useState<string | undefined>();
  const [existingStoreName, setExistingStoreName] = useState("");
  const [existingBusinessModelId, setExistingBusinessModelId] = useState<string | undefined>();
  const [existingStartupType, setExistingStartupType] = useState<"independent" | "franchise">("independent");
  const [existingRegion, setExistingRegion] = useState("");
  const [existingLaunchDate, setExistingLaunchDate] = useState(new Date().toISOString().slice(0, 10));
  const [existingRentText, setExistingRentText] = useState("");
  const [existingLaborText, setExistingLaborText] = useState("");
  const [existingCapitalText, setExistingCapitalText] = useState("");
  const [aiStep, setAiStep] = useState<"idea" | "budget" | "region" | "review">("idea");
  const [aiIdeaText, setAiIdeaText] = useState("");
  const [aiBudgetText, setAiBudgetText] = useState("");
  const [aiRegion, setAiRegion] = useState("");
  const [aiStoreName, setAiStoreName] = useState("");
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const [aiRoadmapResult, setAiRoadmapResult] = useState<RoadmapGenerationResult | null>(null);
  const [storeName, setStoreName] = useState("");
  const [businessLaunched, setBusinessLaunched] = useState(false);
  const [businessLaunchedDate, setBusinessLaunchedDate] = useState<string | null>(null);
  const [dailyEntries, setDailyEntries] = useState<MobileDailyEntry[]>([]);
  const [dailyDateInput, setDailyDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [dailySalesInput, setDailySalesInput] = useState("");
  const [dailyCustomersInput, setDailyCustomersInput] = useState("");
  const [monthlyCosts, setMonthlyCosts] = useState<MobileMonthlyCosts>(emptyMobileMonthlyCosts);
  const [costIngredientsText, setCostIngredientsText] = useState("");
  const [costLaborText, setCostLaborText] = useState("");
  const [costRentText, setCostRentText] = useState("");
  const [costUtilitiesText, setCostUtilitiesText] = useState("");
  const [costMarketingText, setCostMarketingText] = useState("");
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [productNameInput, setProductNameInput] = useState("");
  const [productPriceInput, setProductPriceInput] = useState("");
  const [productCostInput, setProductCostInput] = useState("");
  const [productStockInput, setProductStockInput] = useState("");
  const [inventoryItems, setInventoryItems] = useState<MobileInventoryItem[]>([]);
  const [inventoryNameInput, setInventoryNameInput] = useState("");
  const [inventoryQtyInput, setInventoryQtyInput] = useState("");
  const [inventoryThresholdInput, setInventoryThresholdInput] = useState("");
  const [employees, setEmployees] = useState<MobileEmployee[]>([]);
  const [employeeNameInput, setEmployeeNameInput] = useState("");
  const [employeeWageInput, setEmployeeWageInput] = useState("");
  const [employeeHoursInput, setEmployeeHoursInput] = useState("");
  // ── 구독/회원 관리 (웹과 양방향 동기화) ──
  const [subscriptionPlans, setSubscriptionPlans] = useState<MobileSubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<MobileSubscriber[]>([]);
  const [usesSubscriptions, setUsesSubscriptions] = useState(false);
  // ── 데이터 완전 동기화 (2026-05-27 P1 패리티) ─────────────────────────────
  //   UserStoreData 의 모든 필드를 mobile 에서도 보존. UI 가 아직 없는 필드도
  //   웹에서 입력한 값을 잃지 않도록 passthrough 로 보관.
  //   향후 phase 에서 UI 추가 시 explicit state 로 분리하면서 KNOWN_FIELDS 에 추가.
  const [extraStoreData, setExtraStoreData] = useState<Partial<UserStoreData>>({});
  // 플랜 등록 폼
  const [planNameInput, setPlanNameInput] = useState("");
  const [planPriceInput, setPlanPriceInput] = useState("");
  const [planCycleInput, setPlanCycleInput] = useState<"monthly" | "annual">("monthly");
  // 구독자 등록 폼
  const [subscriberNameInput, setSubscriberNameInput] = useState("");
  const [subscriberPlanIdInput, setSubscriberPlanIdInput] = useState("");
  const [showSubscriberForm, setShowSubscriberForm] = useState(false);
  const [storeSaveStatus, setStoreSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [storeSaveError, setStoreSaveError] = useState("");
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

  // ── 업종별 관리 카드 표시 조건 (web industry-card-matrix.ts SSOT 기준) ──────────
  // 재고 카드: 실물 발주가 필요한 업종 (카페도 원두·유제품 발주 있음)
  const showInventoryCard = (
    ["food", "cafe-dessert", "retail", "ecommerce", "pet", "space", "beauty"] as string[]
  ).includes(industryCategoryId);
  // 구독/회원 관리 카드 표시 조건:
  //   1) 반복 결제가 *본업* 인 업종 (fitness·education·online-digital·startup-tech) — 항상 노출
  //   2) 사장님이 "구독 모델 사용" 토글을 켰을 때 (usesSubscriptions === true) — 뷰티 멤버십, 외식 정기구독 등
  //   3) 이미 플랜·구독자를 등록한 상태 — 데이터가 있으면 무조건 보여서 손실 방지
  const isInherentSubscriptionIndustry = (
    ["fitness", "education", "online-digital", "startup-tech"] as string[]
  ).includes(industryCategoryId);
  const showSubscriptionCard =
    isInherentSubscriptionIndustry ||
    usesSubscriptions ||
    subscriptionPlans.length > 0 ||
    subscribers.length > 0;
  // 직원 카드: 직원 고용이 일반적인 오프라인 업종
  const showStaffCard = (
    ["food", "cafe-dessert", "beauty", "retail", "fitness", "education", "pet", "living-service"] as string[]
  ).includes(industryCategoryId);
  // 업종별 구독 카드 라벨
  const subscriptionCardLabel =
    industryCategoryId === "fitness"
      ? (language === "ko" ? "회원권 관리" : "Memberships")
      : industryCategoryId === "education"
        ? (language === "ko" ? "수강권 관리" : "Enrollments")
        : industryCategoryId === "startup-tech"
          ? (language === "ko" ? "구독 플랜 관리" : "Subscription Plans")
          : (language === "ko" ? "구독 관리" : "Subscriptions");
  const subscriptionCardDesc =
    industryCategoryId === "fitness"
      ? (language === "ko" ? "회원권 갱신·만료·신규 등록을 웹에서 관리합니다." : "Manage membership renewals and new signups on web.")
      : industryCategoryId === "education"
        ? (language === "ko" ? "수강권 등록·미수금·재등록 현황을 웹에서 관리합니다." : "Track enrollments, overdue fees, and renewals on web.")
        : (language === "ko" ? "구독 플랜·결제 주기·이탈률을 웹에서 관리합니다." : "Manage subscription plans and churn on web.");
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
  const isStartupCategory = industryCategoryId === "startup-tech";
  const isFranchisePath = startupType === "franchise" || profile?.startupType === "franchise";
  const onlineOnlyStageIds = new Set(["platform-setup", "online-registration", "sourcing-setup", "store-setup", "online-marketing"]);
  const startupOnlyStageIds = new Set(["startup-foundation", "customer-discovery", "mvp-build", "launch-gtm", "growth-engine", "company-setup", "fundraising-readiness", "venture-certification"]);
  const offlineOnlyStageIds = new Set(["permit-check", "location-candidates", "contract-review", "construction-setup", "vendor-setup", "registration-setup", "insurance-tax-setup", "hiring-setup", "operations-setup", "pre-launch"]);
  const hiddenStageIds = isStartupCategory
    ? new Set([...offlineOnlyStageIds, ...onlineOnlyStageIds])
    : isDigitalCategory
      ? new Set([...offlineOnlyStageIds, ...startupOnlyStageIds])
      : new Set([...onlineOnlyStageIds, ...startupOnlyStageIds]);
  const visibleRoadmapStages = roadmap.stages.filter((stage) => {
    if (hiddenStageIds.has(stage.stageId)) return false;
    if (stage.stageId === "franchise-application" && !isFranchisePath) return false;
    return true;
  });
  const visibleCurrentStageIndex = visibleRoadmapStages.findIndex((stage) => stage.stageId === currentStage.stageId);
  const nextVisibleStage = visibleCurrentStageIndex >= 0 ? visibleRoadmapStages[visibleCurrentStageIndex + 1] ?? null : null;
  const visibleCompletedCount = visibleRoadmapStages.filter((stage) => stage.status === "completed").length;
  const visibleProgressPercent =
    visibleRoadmapStages.length > 0 ? Math.round((visibleCompletedCount / visibleRoadmapStages.length) * 100) : roadmap.progressPercent;
  const roadmapPreviewStages = visibleRoadmapStages.slice(
    visibleCurrentStageIndex >= 0 ? visibleCurrentStageIndex : 0,
    (visibleCurrentStageIndex >= 0 ? visibleCurrentStageIndex : 0) + 2
  );
  const localizedNextVisibleStage = nextVisibleStage ? localizeStage(nextVisibleStage, language, industryCategoryId) : null;
  const currentStageTasks = taskMap[currentStage.stageId] ?? [];
  const requiredCurrentStageTasks = currentStageTasks.filter((task) => task.required);
  const completedCurrentStageTasks = currentStageTasks.filter((task) => task.status === "completed");
  const currentStageRequiredDone = requiredCurrentStageTasks.every(
    (task) => task.status === "completed"
  );
  const currentStageTaskProgress =
    currentStageTasks.length > 0
      ? Math.round((completedCurrentStageTasks.length / currentStageTasks.length) * 100)
      : 0;
  const canUseGenericTaskStage =
    currentStageTasks.length > 0 && currentStage.code !== "contract_review";
  const currentStageAssistCopy = getMobileStageAssistCopy(currentStage.stageId, language);
  const stageBriefCards = [
    {
      label: language === "ko" ? "지금" : "Now",
      title: localizedCurrentStage.title,
      body: nextStepSummary
    },
    {
      label: language === "ko" ? "왜 지금" : "Why now",
      title: language === "ko" ? "순서를 지키면 비용이 줄어듭니다" : "Sequence protects the budget",
      body: localizedCurrentStage.whyNow
    },
    {
      label: language === "ko" ? "다음" : "Next",
      title: localizedNextVisibleStage?.title ?? (language === "ko" ? "마무리 단계" : "Wrap-up"),
      body: localizedNextVisibleStage?.goal ?? (language === "ko" ? "현재 단계가 끝나면 개업 준비 흐름이 정리됩니다." : "Finish this step to keep the launch flow clean.")
    }
  ];
  const financeRentPresets = ["120", "220", "350"];
  const financeLaborPresets = ["0", "220", "420"];
  const financeRevenuePresets = ["800", "1500", "3000"];
  const franchiseCategories = [
    { id: "all", label: language === "ko" ? "전체" : "All" },
    { id: "food", label: language === "ko" ? "음식" : "Food" },
    { id: "cafe-dessert", label: language === "ko" ? "카페" : "Cafe" },
    { id: "retail", label: language === "ko" ? "소매" : "Retail" },
    { id: "beauty", label: language === "ko" ? "뷰티" : "Beauty" },
    { id: "fitness", label: language === "ko" ? "피트니스" : "Fitness" },
    { id: "education", label: language === "ko" ? "교육" : "Education" },
    { id: "pet", label: language === "ko" ? "반려동물" : "Pet" },
    { id: "living-service", label: language === "ko" ? "생활서비스" : "Living" },
    { id: "space", label: language === "ko" ? "공간" : "Space" }
  ];
  const filteredFranchiseBrands = franchiseBrands
    .filter((brand) => franchiseFilterCat === "all" || brand.categoryId === franchiseFilterCat)
    .sort((a, b) => computeOverallScore(b.scores) - computeOverallScore(a.scores))
    .slice(0, 18);
  const recommendedMarketingKeys =
    mobileRecommendedMarketingChannels[industryCategoryId] ?? mobileRecommendedMarketingChannels.food;
  const recommendedMarketingChannels = recommendedMarketingKeys
    .map((key) => mobileMarketingChannels.find((channel) => channel.key === key))
    .filter((channel): channel is (typeof mobileMarketingChannels)[number] => Boolean(channel));
  const selectedMarketingChannelMeta =
    mobileMarketingChannels.find((channel) => channel.key === selectedMarketingChannel) ??
    recommendedMarketingChannels[0] ??
    mobileMarketingChannels[0];
  const supportHighlights = getMatchedHighlights(startupType);
  const existingIndustryOptions = starterIndustryOptions
    .filter((option) => option.meta?.categoryId === existingCategoryId)
    .slice(0, 6);
  const existingBusinessModelOptions = getStarterBusinessModelOptions(existingCategoryId);
  const existingCanContinue =
    existingStep === 1
      ? Boolean(existingIndustryId)
      : existingStep === 2
        ? Boolean(existingStoreName.trim()) && Boolean(existingBusinessModelId)
        : existingStep === 3
          ? Boolean(existingLaunchDate.trim())
          : true;
  const aiCanContinue =
    aiStep === "idea"
      ? aiIdeaText.trim().length >= 5
      : aiStep === "review"
        ? Boolean(aiRoadmapResult)
        : true;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthEntries = dailyEntries.filter((entry) => entry.date.startsWith(currentMonth));
  const monthSales = monthEntries.reduce((sum, entry) => sum + entry.sales, 0);
  const monthCustomers = monthEntries.reduce((sum, entry) => sum + entry.customers, 0);
  const totalMonthlyCosts = Object.values(monthlyCosts).reduce((sum, value) => sum + value, 0);
  const estimatedMonthlyProfit = monthSales - totalMonthlyCosts;
  const lowInventoryCount = inventoryItems.filter(
    (item) => item.minThreshold > 0 && item.quantity <= item.minThreshold
  ).length;
  const weeklyLaborCost = employees.reduce(
    (sum, employee) => sum + employee.hourlyWage * employee.weeklyHours,
    0
  );
  const operatingPnl = calculateMonthlyPnL(monthEntries, monthlyCosts);
  const currentCashForRunway = selectedBudget ?? profile?.capital ?? 0;
  const healthMetrics = calculateHealthMetrics(
    monthEntries,
    monthlyCosts,
    undefined,
    currentCashForRunway
  );
  const salesForecast = forecastSales(dailyEntries);
  const momComparison = calculateMoM(dailyEntries);
  const healthGradeLabel =
    healthMetrics.healthGrade === "healthy"
      ? language === "ko" ? "건강" : "Healthy"
      : healthMetrics.healthGrade === "caution"
        ? language === "ko" ? "주의" : "Caution"
        : healthMetrics.healthGrade === "warning"
          ? language === "ko" ? "경고" : "Warning"
          : language === "ko" ? "위험" : "Critical";
  const forecastConfidenceLabel =
    salesForecast.confidence === "high"
      ? language === "ko" ? "높음" : "High"
      : salesForecast.confidence === "medium"
        ? language === "ko" ? "보통" : "Medium"
        : language === "ko" ? "낮음" : "Low";
  const costBreakdownItems = [
    { key: "ingredients", label: language === "ko" ? "재료/매입" : "COGS", value: monthlyCosts.ingredients },
    { key: "labor", label: language === "ko" ? "인건비" : "Labor", value: monthlyCosts.labor },
    { key: "rent", label: language === "ko" ? "임대료" : "Rent", value: monthlyCosts.rent },
    { key: "utilities", label: language === "ko" ? "공과금" : "Utilities", value: monthlyCosts.utilities },
    { key: "marketing", label: language === "ko" ? "마케팅" : "Marketing", value: monthlyCosts.marketing },
    { key: "other", label: language === "ko" ? "기타" : "Other", value: monthlyCosts.other + monthlyCosts.sga + monthlyCosts.interest }
  ];
  const storeDataPayload = (): Partial<UserStoreData> => ({
    // ── 1) passthrough 필드 (UI 가 아직 없어도 다른 기기에서 입력한 값 보존) ──
    //   spread 가 먼저 와야 explicit state 가 override 함 (사용자가 mobile 에서 수정 가능)
    ...extraStoreData,
    // ── 2) explicit state 필드 (mobile UI 에서 직접 관리) ──
    storeName,
    businessLaunched,
    businessLaunchedDate,
    dailyEntries,
    monthlyCosts,
    products,
    inventoryItems,
    employees,
    usesSubscriptions,
    subscriptionPlans,
    subscribers,
    aiRoadmapResult
  });
  const surfaceTabs: SurfaceTabItem[] = [
    { id: "home", label: language === "ko" ? "홈" : "Home" },
    { id: "current", label: language === "ko" ? "현재 단계" : "Current" },
    { id: "roadmap", label: language === "ko" ? "로드맵" : "Roadmap" },
    { id: "guides", label: language === "ko" ? "가이드" : "Guides" },
    { id: "profile", label: language === "ko" ? "내 정보" : "Profile" }
  ];
  const navigateToSurface = (nextSurface: DashboardSurface) => {
    router.push(SURFACE_HREFS[nextSurface]);
  };
  const onboardingChoiceCards = [
    {
      id: "manual-roadmap",
      label: language === "ko" ? "직접 로드맵" : "Manual roadmap",
      title: language === "ko" ? "로드맵으로 진행할게요" : "Start with the roadmap",
      body:
        language === "ko"
          ? "업종 선택부터 개업까지 단계별로 직접 확인하며 진행합니다."
          : "Move step by step from industry selection to opening day.",
      actionLabel: language === "ko" ? "로드맵 시작하기" : "Start roadmap",
      onPress: () => navigateToSurface("current")
    },
    {
      id: "ai-roadmap",
      label: language === "ko" ? "AI 생성" : "AI generated",
      title: language === "ko" ? "AI가 로드맵을 만들게 할게요" : "Let AI build the roadmap",
      body:
        language === "ko"
          ? "아이디어, 예산, 지역을 바탕으로 맞춤 로드맵을 생성하는 플로우입니다."
          : "Generate a tailored roadmap from your idea, budget, and region.",
      actionLabel: language === "ko" ? "AI로 시작하기" : "Start with AI",
      onPress: () => {
        setOnboardingMode("ai");
        setAiStep("idea");
      }
    },
    {
      id: "existing-store",
      label: language === "ko" ? "기존 가게" : "Existing store",
      title: language === "ko" ? "이미 운영 중인 가게를 등록할게요" : "Register an existing store",
      body:
        language === "ko"
          ? "가게 정보를 등록하고 운영 대시보드로 바로 들어가는 플로우입니다."
          : "Register store details and move straight into the operations dashboard.",
      actionLabel: language === "ko" ? "가게 등록하기" : "Register store",
      onPress: () => {
        setOnboardingMode("existing");
        setExistingStep(1);
      }
    }
  ];

  const closeMobileOnboarding = () => {
    setOnboardingMode(null);
    setAiStatus("idle");
    setAiError("");
  };

  const completeExistingBusinessOnboarding = async () => {
    if (!existingIndustryId || !existingBusinessModelId) {
      return;
    }

    const now = new Date().toISOString();
    let nextDecisions: WorkflowDecisionMap = decisions;
    nextDecisions = upsertStageDecision(nextDecisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: existingIndustryId,
      inputs: {
        subIndustryId: existingIndustryId,
        industryCategoryId: existingCategoryId
      },
      completedAt: now
    });
    nextDecisions = upsertStageDecision(nextDecisions, "startup-type", {
      stageId: "startup-type",
      selectedPrimaryOptionId: existingStartupType,
      inputs: {
        startupType: existingStartupType
      },
      completedAt: now
    });
    nextDecisions = upsertStageDecision(nextDecisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: existingBusinessModelId,
      completedAt: now
    });
    nextDecisions = upsertStageDecision(nextDecisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: {
        ...(parseManwonInput(existingCapitalText)
          ? { capital: parseManwonInput(existingCapitalText) as number }
          : {}),
        targetOpenDate: existingLaunchDate
      },
      completedAt: now
    });
    nextDecisions = upsertStageDecision(nextDecisions, "location-candidates", {
      stageId: "location-candidates",
      inputs: {
        preferredRegion: existingRegion,
        selectionMode: "direct",
        storeName: existingStoreName.trim()
      },
      completedAt: now
    });

    for (const stage of starterStageFlow) {
      if (!nextDecisions[stage.stageId]?.completedAt) {
        nextDecisions = upsertStageDecision(nextDecisions, stage.stageId, {
          stageId: stage.stageId,
          completedAt: now
        });
      }
    }

    const completedRoadmap = buildRoadmapState(
      {
        roadmapId:
          roadmap.roadmapId && roadmap.roadmapId !== starterRoadmap.roadmapId
            ? roadmap.roadmapId
            : starterRoadmap.roadmapId,
        templateId: starterRoadmap.templateId,
        stages: starterStageFlow
      },
      nextDecisions,
      taskMap
    );

    setDecisions(nextDecisions);
    setSelectedIndustryId(existingIndustryId);
    setSelectedIndustryCategoryId(existingCategoryId);
    setStartupType(existingStartupType);
    setSelectedBusinessModelId(existingBusinessModelId);
    setSelectedBudget(parseManwonInput(existingCapitalText) || undefined);
    setBudgetInputText(existingCapitalText.replace(/[^0-9]/g, ""));
    setSelectedOpenDate(existingLaunchDate);
    setPreferredRegionInput(existingRegion);
    setFinanceMonthlyRentText(existingRentText.replace(/[^0-9]/g, ""));
    setFinanceLaborText(existingLaborText.replace(/[^0-9]/g, ""));
    setStoreName(existingStoreName.trim());
    setBusinessLaunched(true);
    setBusinessLaunchedDate(existingLaunchDate);
    const existingCosts: MobileMonthlyCosts = {
      ...emptyMobileMonthlyCosts,
      rent: parseManwonInput(existingRentText) ?? 0,
      labor: parseManwonInput(existingLaborText) ?? 0
    };
    setMonthlyCosts(existingCosts);
    setRoadmap(completedRoadmap);
    setPersistenceLabel(language === "ko" ? "기존 가게 저장 중..." : "Saving existing store...");

    try {
      const persisted = await saveRoadmapState(supabase, {
        roadmap: completedRoadmap,
        decisions: nextDecisions,
        tasks: taskMap
      });
      await saveStoreData(supabase, {
        storeName: existingStoreName.trim(),
        businessLaunched: true,
        businessLaunchedDate: existingLaunchDate,
        monthlyCosts: existingCosts
      }).catch(() => {});
      setRoadmap(persisted.roadmap);
      setDecisions(persisted.decisions);
      setTaskMap(persisted.tasks);
      setProfile(await loadBusinessProfile(supabase));
      setPersistenceReady(true);
      setPersistenceLabel(language === "ko" ? "기존 가게가 저장되었습니다." : "Existing store saved.");
    } catch (error) {
      setPersistenceLabel(
        error instanceof Error
          ? `${language === "ko" ? "저장 실패" : "Save failed"}: ${error.message}`
          : language === "ko"
            ? "저장 실패"
            : "Save failed"
      );
    }

    setOnboardingMode(null);
    navigateToSurface("analytics");
  };

  const generateAiRoadmap = async () => {
    if (!aiIdeaText.trim()) {
      return;
    }

    setAiStatus("loading");
    setAiError("");

    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`${apiBaseUrl}/api/ai/roadmap/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`
        },
        body: JSON.stringify({
          ideaText: aiIdeaText,
          budget: parseManwonInput(aiBudgetText) || undefined,
          region: aiRegion || undefined,
          storeName: aiStoreName || undefined,
          language
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to generate roadmap");
      }

      const payload = (await response.json()) as RoadmapGenerationResult;
      setAiRoadmapResult(payload);
      setAiStep("review");
      setAiStatus("idle");
    } catch (error) {
      setAiStatus("error");
      setAiError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "AI 로드맵 생성에 실패했습니다."
            : "AI roadmap generation failed."
      );
    }
  };

  const applyAiRoadmap = async () => {
    if (!aiRoadmapResult) {
      return;
    }

    const now = new Date().toISOString();
    let nextDecisions: WorkflowDecisionMap = decisions;
    nextDecisions = upsertStageDecision(nextDecisions, "industry-selection", {
      stageId: "industry-selection",
      selectedPrimaryOptionId: aiRoadmapResult.parsed.subIndustryId,
      inputs: {
        subIndustryId: aiRoadmapResult.parsed.subIndustryId,
        industryCategoryId: aiRoadmapResult.parsed.industryCategoryId
      },
      completedAt: now
    });
    nextDecisions = upsertStageDecision(nextDecisions, "startup-type", {
      stageId: "startup-type",
      selectedPrimaryOptionId: aiRoadmapResult.parsed.startupType,
      completedAt: now
    });
    nextDecisions = upsertStageDecision(nextDecisions, "business-model", {
      stageId: "business-model",
      selectedPrimaryOptionId: aiRoadmapResult.parsed.businessModelId,
      completedAt: now
    });
    nextDecisions = upsertStageDecision(nextDecisions, "budget-setup", {
      stageId: "budget-setup",
      inputs: {
        capital: aiRoadmapResult.budgetAllocation.total,
        targetOpenDate: aiRoadmapResult.timeline.targetOpenDate
      },
      completedAt: now
    });
    if (aiRoadmapResult.parsed.preferredRegion) {
      nextDecisions = upsertStageDecision(nextDecisions, "location-candidates", {
        stageId: "location-candidates",
        inputs: {
          preferredRegion: aiRoadmapResult.parsed.preferredRegion,
          selectionMode: "direct",
          storeName: aiStoreName
        },
        completedAt: now
      });
    }

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
      taskMap
    );

    setDecisions(nextDecisions);
    setSelectedIndustryId(aiRoadmapResult.parsed.subIndustryId);
    setSelectedIndustryCategoryId(aiRoadmapResult.parsed.industryCategoryId);
    setStartupType(aiRoadmapResult.parsed.startupType);
    setSelectedBusinessModelId(aiRoadmapResult.parsed.businessModelId);
    setSelectedBudget(aiRoadmapResult.budgetAllocation.total);
    setBudgetInputText(String(Math.round(aiRoadmapResult.budgetAllocation.total / 10000)));
    setSelectedOpenDate(aiRoadmapResult.timeline.targetOpenDate);
    setPreferredRegionInput(aiRoadmapResult.parsed.preferredRegion);
    setFinanceCapitalText(String(Math.round(aiRoadmapResult.budgetAllocation.total / 10000)));
    setFinanceMonthlyRentText(String(Math.round(aiRoadmapResult.monthlyCosts.rent / 10000)));
    setFinanceLaborText(String(Math.round(aiRoadmapResult.monthlyCosts.labor / 10000)));
    setRoadmap(nextRoadmap);
    setPersistenceLabel(language === "ko" ? "AI 로드맵 저장 중..." : "Saving AI roadmap...");

    try {
      const persisted = await saveRoadmapState(supabase, {
        roadmap: nextRoadmap,
        decisions: nextDecisions,
        tasks: taskMap
      });
      await saveStoreData(supabase, {
        ...storeDataPayload(),
        aiRoadmapResult
      }).catch(() => {});
      setRoadmap(persisted.roadmap);
      setDecisions(persisted.decisions);
      setTaskMap(persisted.tasks);
      setProfile(await loadBusinessProfile(supabase));
      setPersistenceReady(true);
      setPersistenceLabel(language === "ko" ? "AI 로드맵이 저장되었습니다." : "AI roadmap saved.");
    } catch (error) {
      setPersistenceLabel(
        error instanceof Error
          ? `${language === "ko" ? "저장 실패" : "Save failed"}: ${error.message}`
          : language === "ko"
            ? "저장 실패"
            : "Save failed"
      );
    }

    setOnboardingMode(null);
    navigateToSurface("home");
  };

  const applyMobileStoreData = (data: UserStoreData | null) => {
    if (!data) {
      return;
    }

    setStoreName(data.storeName ?? "");
    setBusinessLaunched(Boolean(data.businessLaunched));
    setBusinessLaunchedDate(data.businessLaunchedDate ?? null);
    setDailyEntries(toMobileDailyEntries(data.dailyEntries));
    setMonthlyCosts({ ...emptyMobileMonthlyCosts, ...(data.monthlyCosts ?? {}) });
    setProducts(toMobileProducts(data.products));
    setInventoryItems(toMobileInventoryItems(data.inventoryItems));
    setEmployees(toMobileEmployees(data.employees));
    setSubscriptionPlans(toMobileSubscriptionPlans(data.subscriptionPlans));
    setSubscribers(toMobileSubscribers(data.subscribers));
    setUsesSubscriptions(Boolean(data.usesSubscriptions));
    if (isRecord(data.aiRoadmapResult)) {
      setAiRoadmapResult(data.aiRoadmapResult as unknown as RoadmapGenerationResult);
    }

    // 2026-05-27 패리티 (Phase 1): KNOWN 필드 외 모든 필드를 extraStoreData 에 보관.
    //   웹에서 입력한 "내 가게" 정보·마케팅·인터뷰·시간로그·현금흐름 설정 등이 mobile 에서
    //   사라지지 않도록 passthrough. mobile UI 가 아직 없어도 데이터는 그대로 echo.
    const extras: Partial<UserStoreData> = {};
    for (const [key, value] of Object.entries(data) as Array<[keyof UserStoreData, unknown]>) {
      if (!KNOWN_STORE_FIELDS.has(key)) {
        (extras as Record<string, unknown>)[key] = value;
      }
    }
    setExtraStoreData(extras);

    if (data.monthlyCosts) {
      setCostIngredientsText(data.monthlyCosts.ingredients ? String(Math.round(data.monthlyCosts.ingredients / 10000)) : "");
      setCostLaborText(data.monthlyCosts.labor ? String(Math.round(data.monthlyCosts.labor / 10000)) : "");
      setCostRentText(data.monthlyCosts.rent ? String(Math.round(data.monthlyCosts.rent / 10000)) : "");
      setCostUtilitiesText(data.monthlyCosts.utilities ? String(Math.round(data.monthlyCosts.utilities / 10000)) : "");
      setCostMarketingText(data.monthlyCosts.marketing ? String(Math.round(data.monthlyCosts.marketing / 10000)) : "");
    }
  };

  const persistMobileStoreData = async (patch?: Partial<UserStoreData>) => {
    setStoreSaveStatus("saving");
    setStoreSaveError("");

    try {
      await saveStoreData(supabase, {
        ...storeDataPayload(),
        ...(patch ?? {})
      });
      setStoreSaveStatus("saved");
      setPersistenceLabel(language === "ko" ? "운영 데이터가 저장되었습니다." : "Operations data saved.");
    } catch (error) {
      setStoreSaveStatus("error");
      setStoreSaveError(
        error instanceof Error
          ? error.message
          : language === "ko"
            ? "운영 데이터 저장 실패"
            : "Failed to save operations data"
      );
    }
  };

  const handleAddDailyEntry = () => {
    const sales = parseManwonInput(dailySalesInput) ?? 0;
    const customers = Number(dailyCustomersInput.replace(/[^0-9]/g, "")) || 0;

    if (!sales) {
      return;
    }

    const entry: MobileDailyEntry = {
      date: dailyDateInput || new Date().toISOString().slice(0, 10),
      sales,
      customers
    };
    const nextEntries = [
      ...dailyEntries.filter((item) => item.date !== entry.date),
      entry
    ].sort((a, b) => b.date.localeCompare(a.date));

    setDailyEntries(nextEntries);
    setDailySalesInput("");
    setDailyCustomersInput("");
    void persistMobileStoreData({ dailyEntries: nextEntries });
  };

  const handleSaveMonthlyCosts = () => {
    const nextCosts: MobileMonthlyCosts = {
      ...emptyMobileMonthlyCosts,
      ingredients: parseManwonInput(costIngredientsText) ?? 0,
      labor: parseManwonInput(costLaborText) ?? 0,
      rent: parseManwonInput(costRentText) ?? 0,
      utilities: parseManwonInput(costUtilitiesText) ?? 0,
      marketing: parseManwonInput(costMarketingText) ?? 0
    };

    setMonthlyCosts(nextCosts);
    void persistMobileStoreData({ monthlyCosts: nextCosts });
  };

  const handleAddProduct = () => {
    if (!productNameInput.trim()) {
      return;
    }

    const nextProducts = [
      ...products,
      {
        id: `prod-${Date.now()}`,
        name: productNameInput.trim(),
        price: parseManwonInput(productPriceInput) ?? 0,
        cost: parseManwonInput(productCostInput) ?? 0,
        stock: Number(productStockInput.replace(/[^0-9]/g, "")) || 0
      }
    ];

    setProducts(nextProducts);
    setProductNameInput("");
    setProductPriceInput("");
    setProductCostInput("");
    setProductStockInput("");
    void persistMobileStoreData({ products: nextProducts });
  };

  const handleAddInventoryItem = () => {
    if (!inventoryNameInput.trim()) {
      return;
    }

    const nextItems = [
      ...inventoryItems,
      {
        id: `inv-${Date.now()}`,
        name: inventoryNameInput.trim(),
        quantity: Number(inventoryQtyInput.replace(/[^0-9.]/g, "")) || 0,
        unit: "개",
        minThreshold: Number(inventoryThresholdInput.replace(/[^0-9.]/g, "")) || 0
      }
    ];

    setInventoryItems(nextItems);
    setInventoryNameInput("");
    setInventoryQtyInput("");
    setInventoryThresholdInput("");
    void persistMobileStoreData({ inventoryItems: nextItems });
  };

  const handleAddEmployee = () => {
    const hourlyWage = Number(employeeWageInput.replace(/[^0-9]/g, "")) || 0;
    const weeklyHours = Number(employeeHoursInput.replace(/[^0-9.]/g, "")) || 0;

    if (!employeeNameInput.trim() || !hourlyWage || !weeklyHours) {
      return;
    }

    const nextEmployees = [
      ...employees,
      {
        id: `emp-${Date.now()}`,
        name: employeeNameInput.trim(),
        hourlyWage,
        weeklyHours,
        isInsured: weeklyHours * 4.345 >= 60
      }
    ];

    setEmployees(nextEmployees);
    setEmployeeNameInput("");
    setEmployeeWageInput("");
    setEmployeeHoursInput("");
    void persistMobileStoreData({ employees: nextEmployees });
  };

  // ── 구독 플랜 CRUD ─────────────────────────────────────────────────────────
  // 플랜은 만원 단위가 아닌 *원* 단위로 입력받음 (4,900원/월 등 소액 결제 흔함)
  const handleAddPlan = () => {
    const name = planNameInput.trim();
    const price = Number(planPriceInput.replace(/[^0-9]/g, "")) || 0;
    if (!name || !price) {
      return;
    }
    const nextPlans: MobileSubscriptionPlan[] = [
      ...subscriptionPlans,
      {
        id: `plan-${Date.now()}`,
        name,
        price,
        billingCycle: planCycleInput,
        isActive: true,
      },
    ];
    setSubscriptionPlans(nextPlans);
    setPlanNameInput("");
    setPlanPriceInput("");
    setPlanCycleInput("monthly");
    // 첫 플랜 등록 시 usesSubscriptions 도 자동 true — 다른 기기·웹과 동기화
    const nextUsesSubscriptions = true;
    setUsesSubscriptions(nextUsesSubscriptions);
    void persistMobileStoreData({
      subscriptionPlans: nextPlans,
      usesSubscriptions: nextUsesSubscriptions,
    });
  };

  const handleDeletePlan = (planId: string) => {
    const nextPlans = subscriptionPlans.filter((p) => p.id !== planId);
    // 해당 플랜의 구독자도 같이 정리 (orphan 방지)
    const nextSubscribers = subscribers.filter((s) => s.planId !== planId);
    setSubscriptionPlans(nextPlans);
    setSubscribers(nextSubscribers);
    void persistMobileStoreData({
      subscriptionPlans: nextPlans,
      subscribers: nextSubscribers,
    });
  };

  const handleAddSubscriber = () => {
    const name = subscriberNameInput.trim();
    const planId = subscriberPlanIdInput || subscriptionPlans.find((p) => p.isActive)?.id;
    if (!name || !planId) {
      return;
    }
    const nextSubscribers: MobileSubscriber[] = [
      ...subscribers,
      {
        id: `sub-${Date.now()}`,
        name,
        planId,
        status: "active",
        joinedAt: new Date().toISOString().slice(0, 10),
      },
    ];
    setSubscribers(nextSubscribers);
    setSubscriberNameInput("");
    setSubscriberPlanIdInput("");
    setShowSubscriberForm(false);
    void persistMobileStoreData({ subscribers: nextSubscribers });
  };

  const handleDeleteSubscriber = (subscriberId: string) => {
    const nextSubscribers = subscribers.filter((s) => s.id !== subscriberId);
    setSubscribers(nextSubscribers);
    void persistMobileStoreData({ subscribers: nextSubscribers });
  };

  const handleToggleSubscriptionMode = () => {
    const nextUses = !usesSubscriptions;
    setUsesSubscriptions(nextUses);
    void persistMobileStoreData({ usesSubscriptions: nextUses });
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

    const nextRoadmap = buildRoadmapState(
      {
        roadmapId:
          roadmap.roadmapId && roadmap.roadmapId !== starterRoadmap.roadmapId
            ? roadmap.roadmapId
            : starterRoadmap.roadmapId,
        templateId: starterRoadmap.templateId,
        stages: starterStageFlow
      },
      decisions,
      nextTaskMap
    );

    setTaskMap(nextTaskMap);
    setRoadmap(
      roadmap.currentStageId === "contract-review"
        ? { ...nextRoadmap, currentStageId: "contract-review" }
        : nextRoadmap
    );
  };

  const handleContractContinue = () => {
    const transition = completeCurrentStage(roadmap, decisions, taskMap);
    setRoadmap(transition.roadmap);
    setLastUnlocked(transition.newlyUnlockedStageIds);
    setTransitionNotice(buildTransitionNotice(transition.roadmap, language));
  };

  const handleGenericTaskToggle = (stageId: string, taskId: string) => {
    const currentTasks = taskMap[stageId] ?? [];
    const existing = currentTasks.find((task) => task.taskId === taskId);

    if (!existing) {
      return;
    }

    const nextTaskMap = updateTaskStatus(
      taskMap,
      stageId,
      taskId,
      existing.status === "completed" ? "todo" : "completed"
    );

    const nextRoadmap = buildRoadmapState(
      {
        roadmapId:
          roadmap.roadmapId && roadmap.roadmapId !== starterRoadmap.roadmapId
            ? roadmap.roadmapId
            : starterRoadmap.roadmapId,
        templateId: starterRoadmap.templateId,
        stages: starterStageFlow
      },
      decisions,
      nextTaskMap
    );

    setTaskMap(nextTaskMap);
    setRoadmap(
      roadmap.currentStageId === stageId
        ? { ...nextRoadmap, currentStageId: stageId }
        : nextRoadmap
    );
  };

  const handleGenericTaskStageContinue = () => {
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
      applyMobileStoreData(await loadStoreData(supabase, result.user).catch(() => null));
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
      await saveStoreData(supabase, storeDataPayload()).catch(() => {});

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

  // ── 구독 관리 카드 (analytics + profile surface 양쪽에서 재사용) ──────────
  //   사장님이 대시보드(analytics) 또는 내 설정(profile) 어느 쪽에서든 플랜·구독자 CRUD 가능.
  //   계산된 JSX 를 한 번만 만들고 두 곳에서 렌더 — state 는 컴포넌트 최상위에 있으므로 공유됨.
  //   activeSurface 가 mutually exclusive 라서 동시에 두 인스턴스 보이지 않음.
  const subscriptionCardElement: React.ReactNode = showSubscriptionCard ? (() => {
    const activeSubs = subscribers.filter((s) => s.status === "active" || s.status === "trial");
    const planMap = Object.fromEntries(subscriptionPlans.map((p) => [p.id, p]));
    const mrr = activeSubs.reduce((sum, s) => {
      const plan = planMap[s.planId];
      if (!plan) return sum;
      return sum + (plan.billingCycle === "annual" ? Math.round(plan.price / 12) : plan.price);
    }, 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const newThisMonth = subscribers.filter(
      (s) => s.joinedAt.startsWith(thisMonth) && s.status !== "churned"
    ).length;
    const activePlans = subscriptionPlans.filter((p) => p.isActive);
    const canAddSubscriber = activePlans.length > 0;
    return (
      <View style={styles.budgetPanel}>
        <Text style={styles.budgetLabel}>{subscriptionCardLabel}</Text>

        {/* ── 상단 메트릭 ── */}
        <View style={styles.metricGrid}>
          <ProfileItem
            label={language === "ko" ? "활성 구독자" : "Active subs"}
            value={`${activeSubs.length}${language === "ko" ? "명" : ""}`}
          />
          <ProfileItem
            label={language === "ko" ? "월 반복 매출(MRR)" : "MRR"}
            value={formatWonCompact(mrr, language)}
          />
          <ProfileItem
            label={language === "ko" ? "이번 달 신규" : "New this month"}
            value={`${newThisMonth}${language === "ko" ? "명" : ""}`}
          />
          <ProfileItem
            label={language === "ko" ? "활성 플랜 수" : "Active plans"}
            value={`${activePlans.length}`}
          />
        </View>

        {/* ── 플랜 리스트 + 삭제 ── */}
        {activePlans.length > 0 ? (
          activePlans.slice(0, 5).map((plan) => {
            const planSubs = activeSubs.filter((s) => s.planId === plan.id).length;
            return (
              <View key={plan.id} style={styles.inlineSummaryRow}>
                <Text style={styles.inlineSummaryLabel}>{plan.name}</Text>
                <Text style={styles.inlineSummaryValue}>
                  {formatWonCompact(plan.price, language)}/{language === "ko" ? (plan.billingCycle === "annual" ? "년" : "월") : (plan.billingCycle === "annual" ? "yr" : "mo")}
                  {" · "}{planSubs}{language === "ko" ? "명" : ""}
                </Text>
                <Pressable onPress={() => handleDeletePlan(plan.id)}>
                  <Text style={[styles.helper, { color: "#C0392B" }]}>
                    {language === "ko" ? "삭제" : "Delete"}
                  </Text>
                </Pressable>
              </View>
            );
          })
        ) : (
          <Text style={styles.helper}>{subscriptionCardDesc}</Text>
        )}

        {/* ── 플랜 등록 폼 ── */}
        <Text style={[styles.helper, { marginTop: 12, fontWeight: "600" }]}>
          {language === "ko" ? "+ 새 플랜 등록" : "+ Add new plan"}
        </Text>
        <TextInput
          value={planNameInput}
          onChangeText={setPlanNameInput}
          placeholder={language === "ko" ? "플랜 이름 (예: Standard, 월회원)" : "Plan name (e.g. Standard)"}
          placeholderTextColor="#8A909C"
          style={styles.budgetInput}
        />
        <TextInput
          value={planPriceInput}
          onChangeText={(value) => setPlanPriceInput(value.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder={language === "ko" ? "가격, 원 단위 (예: 29000)" : "Price in KRW (e.g. 29000)"}
          placeholderTextColor="#8A909C"
          style={styles.budgetInput}
        />
        <View style={styles.summaryBar}>
          <Pressable
            onPress={() => setPlanCycleInput("monthly")}
            style={[styles.summarySegment, planCycleInput === "monthly" && { backgroundColor: "#191970" }]}
          >
            <Text style={[styles.summarySegmentText, planCycleInput === "monthly" && { color: "#FFF" }]}>
              {language === "ko" ? "월 결제" : "Monthly"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPlanCycleInput("annual")}
            style={[styles.summarySegment, styles.summarySegmentLast, planCycleInput === "annual" && { backgroundColor: "#191970" }]}
          >
            <Text style={[styles.summarySegmentText, planCycleInput === "annual" && { color: "#FFF" }]}>
              {language === "ko" ? "연 결제" : "Annual"}
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={handleAddPlan}
          disabled={!planNameInput.trim() || !planPriceInput.trim()}
          style={[
            styles.secondaryButton,
            (!planNameInput.trim() || !planPriceInput.trim()) && styles.primaryButtonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonText}>
            {language === "ko" ? "플랜 추가" : "Add plan"}
          </Text>
        </Pressable>

        {/* ── 구독자 등록 (플랜이 있어야 가능) ── */}
        {canAddSubscriber ? (
          showSubscriberForm ? (
            <>
              <Text style={[styles.helper, { marginTop: 12, fontWeight: "600" }]}>
                {language === "ko" ? "+ 구독자 추가" : "+ Add subscriber"}
              </Text>
              <TextInput
                value={subscriberNameInput}
                onChangeText={setSubscriberNameInput}
                placeholder={language === "ko" ? "구독자 이름" : "Subscriber name"}
                placeholderTextColor="#8A909C"
                style={styles.budgetInput}
              />
              <View style={styles.summaryBar}>
                {activePlans.slice(0, 3).map((plan, idx) => {
                  const isLast = idx === Math.min(activePlans.length, 3) - 1;
                  const selectedId = subscriberPlanIdInput || activePlans[0].id;
                  const isSelected = selectedId === plan.id;
                  return (
                    <Pressable
                      key={plan.id}
                      onPress={() => setSubscriberPlanIdInput(plan.id)}
                      style={[
                        styles.summarySegment,
                        isLast && styles.summarySegmentLast,
                        isSelected && { backgroundColor: "#191970" },
                      ]}
                    >
                      <Text style={[styles.summarySegmentText, isSelected && { color: "#FFF" }]}>
                        {plan.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={handleAddSubscriber}
                disabled={!subscriberNameInput.trim()}
                style={[styles.secondaryButton, !subscriberNameInput.trim() && styles.primaryButtonDisabled]}
              >
                <Text style={styles.secondaryButtonText}>
                  {language === "ko" ? "구독자 추가" : "Add subscriber"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setShowSubscriberForm(true)}>
              <Text style={[styles.helper, { marginTop: 12, color: "#191970", fontWeight: "600" }]}>
                {language === "ko" ? "+ 구독자 추가" : "+ Add subscriber"}
              </Text>
            </Pressable>
          )
        ) : null}

        {/* ── 활성 구독자 리스트 (최근 가입 순) ── */}
        {activeSubs.length > 0 ? (
          <>
            <Text style={[styles.helper, { marginTop: 12, fontWeight: "600" }]}>
              {language === "ko" ? `최근 구독자 (${activeSubs.length}명)` : `Recent subscribers (${activeSubs.length})`}
            </Text>
            {[...activeSubs]
              .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
              .slice(0, 3)
              .map((sub) => {
                const plan = planMap[sub.planId];
                return (
                  <View key={sub.id} style={styles.inlineSummaryRow}>
                    <Text style={styles.inlineSummaryLabel}>{sub.name}</Text>
                    <Text style={styles.inlineSummaryValue}>
                      {plan ? plan.name : (language === "ko" ? "(플랜 삭제됨)" : "(plan deleted)")}
                      {sub.joinedAt ? ` · ${sub.joinedAt}` : ""}
                    </Text>
                    <Pressable onPress={() => handleDeleteSubscriber(sub.id)}>
                      <Text style={[styles.helper, { color: "#C0392B" }]}>
                        {language === "ko" ? "삭제" : "Delete"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
          </>
        ) : null}

        {/* ── 비-본업 업종에서 토글 OFF 옵션 (잘못 켰을 때) ── */}
        {!isInherentSubscriptionIndustry && subscriptionPlans.length === 0 && subscribers.length === 0 ? (
          <Pressable onPress={handleToggleSubscriptionMode} style={{ marginTop: 8 }}>
            <Text style={[styles.helper, { textAlign: "center" }]}>
              {language === "ko" ? "구독 모델 사용 안 함 →" : "Disable subscription tracking →"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  })() : (
    !isInherentSubscriptionIndustry ? (
      <Pressable onPress={handleToggleSubscriptionMode} style={styles.budgetPanel}>
        <Text style={styles.budgetLabel}>
          {language === "ko" ? "구독·멤버십 사용 중이신가요?" : "Run a subscription or membership?"}
        </Text>
        <Text style={styles.helper}>
          {language === "ko"
            ? "활성화하면 플랜·구독자·MRR 을 모바일에서 바로 관리할 수 있습니다."
            : "Enable to track plans, subscribers, and MRR right from mobile."}
        </Text>
        <Text style={[styles.secondaryButtonText, { marginTop: 8, color: "#191970", fontWeight: "600" }]}>
          {language === "ko" ? "구독 모델 활성화 →" : "Enable subscriptions →"}
        </Text>
      </Pressable>
    ) : null
  );

  return (
    <AuroraBackground>
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader
          language={language}
          showProgress={!requiresAuth}
          progressPercent={visibleProgressPercent}
        />

        <HeroIntro
          title={isFreshAccount ? copy.home.heroFresh : copy.home.heroActive}
          subtitle={isFreshAccount ? copy.home.heroFreshBody : copy.home.heroActiveBody}
        />

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
        <SurfaceSwitcher
          tabs={surfaceTabs}
          activeSurface={activeSurface}
          onSelect={navigateToSurface}
        />
        ) : null}

        {activeSurface === "home" && onboardingMode === "existing" ? (
        <View style={styles.section}>
          <View style={styles.currentStageCard}>
            <Text style={styles.currentMeta}>
              {language === "ko" ? `기존 가게 등록 · ${existingStep}/4` : `Existing store · ${existingStep}/4`}
            </Text>
            <Text style={styles.currentTitle}>
              {existingStep === 1
                ? language === "ko" ? "어떤 사업을 운영하고 계신가요?" : "What business do you run?"
                : existingStep === 2
                  ? language === "ko" ? "가게 기본 정보를 알려주세요" : "Tell us the store basics"
                  : existingStep === 3
                    ? language === "ko" ? "세무와 오픈 정보를 맞춥니다" : "Set tax and launch basics"
                    : language === "ko" ? "운영 숫자를 입력하세요" : "Enter operating numbers"}
            </Text>
            <Text style={styles.currentBody}>
              {language === "ko"
                ? "입력한 내용으로 창업 로드맵을 완료 처리하고 운영 분석 화면을 바로 열겠습니다."
                : "This will complete the startup roadmap and open the operations analytics surface."}
            </Text>

            {existingStep === 1 ? (
              <>
                <View style={styles.toggleRow}>
                  {starterIndustryCategories.map((rawCategory) => {
                    const category = localizeStarterIndustryCategory(rawCategory, language);
                    return (
                      <Pressable
                        key={rawCategory.id}
                        onPress={() => {
                          setExistingCategoryId(rawCategory.id);
                          setExistingIndustryId(undefined);
                          setExistingBusinessModelId(undefined);
                        }}
                        style={[
                          styles.toggleChip,
                          existingCategoryId === rawCategory.id && styles.toggleChipSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.toggleChipText,
                            existingCategoryId === rawCategory.id && styles.toggleChipTextSelected
                          ]}
                        >
                          {category.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.optionList}>
                  {existingIndustryOptions.map((rawOption) => {
                    const option = localizeRecommendationItem(rawOption, language);
                    const selected = existingIndustryId === rawOption.id;
                    return (
                      <Pressable
                        key={rawOption.id}
                        onPress={() => setExistingIndustryId(rawOption.id)}
                        style={[styles.optionCard, selected && styles.optionCardSelected]}
                      >
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionSummary} numberOfLines={2}>{option.summary}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {existingStep === 2 ? (
              <View style={styles.optionList}>
                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>{language === "ko" ? "가게 이름" : "Store name"}</Text>
                  <TextInput
                    value={existingStoreName}
                    onChangeText={setExistingStoreName}
                    placeholder={language === "ko" ? "예: 성수 커피랩" : "Example: Seongsu Coffee Lab"}
                    placeholderTextColor="#8A909C"
                    style={styles.budgetInput}
                  />
                  <Text style={styles.budgetLabel}>{language === "ko" ? "지역" : "Region"}</Text>
                  <TextInput
                    value={existingRegion}
                    onChangeText={setExistingRegion}
                    placeholder={language === "ko" ? "예: 서울 성수동" : "Example: Seongsu, Seoul"}
                    placeholderTextColor="#8A909C"
                    style={styles.budgetInput}
                  />
                </View>
                <View style={styles.toggleRow}>
                  {(["independent", "franchise"] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setExistingStartupType(type)}
                      style={[
                        styles.toggleChip,
                        existingStartupType === type && styles.toggleChipSelected
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleChipText,
                          existingStartupType === type && styles.toggleChipTextSelected
                        ]}
                      >
                        {formatStartupType(type, language)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {existingBusinessModelOptions.map((rawOption) => {
                  const option = localizeRecommendationItem(rawOption, language);
                  const selected = existingBusinessModelId === rawOption.id;
                  return (
                    <Pressable
                      key={rawOption.id}
                      onPress={() => setExistingBusinessModelId(rawOption.id)}
                      style={[styles.optionCard, selected && styles.optionCardSelected]}
                    >
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionSummary}>{option.summary}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {existingStep === 3 ? (
              <View style={styles.optionList}>
                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>{language === "ko" ? "오픈일" : "Launch date"}</Text>
                  <TextInput
                    value={existingLaunchDate}
                    onChangeText={setExistingLaunchDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8A909C"
                    style={styles.budgetInput}
                  />
                  <Text style={styles.helper}>
                    {language === "ko"
                      ? "정확한 날짜가 아니어도 됩니다. 운영 분석의 기준일로 사용합니다."
                      : "An approximate date is fine. It anchors the operations dashboard."}
                  </Text>
                </View>
              </View>
            ) : null}

            {existingStep === 4 ? (
              <View style={styles.optionList}>
                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>{language === "ko" ? "월 임대료" : "Monthly rent"}</Text>
                  <TextInput
                    value={existingRentText}
                    onChangeText={(value) => setExistingRentText(value.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder={language === "ko" ? "만원 단위, 예: 250" : "10K KRW, e.g. 250"}
                    placeholderTextColor="#8A909C"
                    style={styles.budgetInput}
                  />
                  <Text style={styles.budgetLabel}>{language === "ko" ? "월 인건비" : "Monthly labor"}</Text>
                  <TextInput
                    value={existingLaborText}
                    onChangeText={(value) => setExistingLaborText(value.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder={language === "ko" ? "만원 단위, 예: 420" : "10K KRW, e.g. 420"}
                    placeholderTextColor="#8A909C"
                    style={styles.budgetInput}
                  />
                  <Text style={styles.budgetLabel}>{language === "ko" ? "보유 운영자금" : "Operating capital"}</Text>
                  <TextInput
                    value={existingCapitalText}
                    onChangeText={(value) => setExistingCapitalText(value.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder={language === "ko" ? "만원 단위, 예: 1500" : "10K KRW, e.g. 1500"}
                    placeholderTextColor="#8A909C"
                    style={styles.budgetInput}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.stageFooter}>
              <Pressable onPress={closeMobileOnboarding} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{language === "ko" ? "처음으로" : "Back"}</Text>
              </Pressable>
              {existingStep > 1 ? (
                <Pressable onPress={() => setExistingStep((step) => Math.max(1, step - 1))} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>{language === "ko" ? "이전" : "Previous"}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  if (existingStep < 4) {
                    setExistingStep((step) => step + 1);
                  } else {
                    void completeExistingBusinessOnboarding();
                  }
                }}
                disabled={!existingCanContinue}
                style={[styles.primaryButton, !existingCanContinue && styles.primaryButtonDisabled]}
              >
                <Text style={styles.primaryButtonText}>
                  {existingStep < 4
                    ? language === "ko" ? "다음" : "Continue"
                    : language === "ko" ? "가게 등록 완료" : "Finish setup"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        ) : null}

        {activeSurface === "home" && onboardingMode === "ai" ? (
        <View style={styles.section}>
          <View style={styles.currentStageCard}>
            <Text style={styles.currentMeta}>{language === "ko" ? "AI 자동 로드맵" : "AI roadmap"}</Text>
            <Text style={styles.currentTitle}>
              {aiStep === "idea"
                ? language === "ko" ? "사업 아이디어를 설명해주세요" : "Describe your business idea"
                : aiStep === "budget"
                  ? language === "ko" ? "예산을 알려주세요" : "Set the budget"
                  : aiStep === "region"
                    ? language === "ko" ? "지역과 이름을 정해주세요" : "Set region and name"
                    : language === "ko" ? "AI가 만든 로드맵을 확인하세요" : "Review the generated roadmap"}
            </Text>
            <Text style={styles.currentBody}>
              {language === "ko"
                ? "웹의 AI 로드맵 생성 흐름을 모바일 입력 단계로 옮겼습니다."
                : "This ports the web AI roadmap flow into a native mobile intake."}
            </Text>

            {aiStep === "idea" ? (
              <View style={styles.budgetPanel}>
                <Text style={styles.budgetLabel}>{language === "ko" ? "아이디어" : "Idea"}</Text>
                <TextInput
                  value={aiIdeaText}
                  onChangeText={setAiIdeaText}
                  multiline
                  placeholder={language === "ko" ? "예: 강남역 근처에서 직장인 대상 포케 가게를 열고 싶어요." : "Example: I want to open a poke shop near Gangnam for office workers."}
                  placeholderTextColor="#8A909C"
                  style={[styles.budgetInput, styles.multilineInput]}
                />
                <View style={styles.presetRow}>
                  {[
                    language === "ko" ? "마포 1인 카페" : "Solo cafe in Mapo",
                    language === "ko" ? "온라인 반려동물 용품몰" : "Online pet supplies",
                    language === "ko" ? "AI B2B SaaS" : "AI B2B SaaS"
                  ].map((example) => (
                    <Pressable key={example} onPress={() => setAiIdeaText(example)} style={styles.presetChip}>
                      <Text style={styles.presetChipText}>{example}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {aiStep === "budget" ? (
              <View style={styles.budgetPanel}>
                <Text style={styles.budgetLabel}>{language === "ko" ? "창업 예산" : "Startup budget"}</Text>
                <TextInput
                  value={aiBudgetText}
                  onChangeText={(value) => setAiBudgetText(value.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  placeholder={language === "ko" ? "만원 단위, 예: 5000" : "10K KRW, e.g. 5000"}
                  placeholderTextColor="#8A909C"
                  style={styles.budgetInput}
                />
                <View style={styles.choiceGrid}>
                  {[
                    { label: language === "ko" ? "3천만원" : "30M", value: "3000" },
                    { label: language === "ko" ? "5천만원" : "50M", value: "5000" },
                    { label: language === "ko" ? "1억원" : "100M", value: "10000" },
                    { label: language === "ko" ? "1.5억원" : "150M", value: "15000" }
                  ].map((preset) => (
                    <Pressable
                      key={preset.value}
                      onPress={() => setAiBudgetText(preset.value)}
                      style={[styles.choiceCard, aiBudgetText === preset.value && styles.choiceCardSelected]}
                    >
                      <Text style={[styles.choiceTitle, aiBudgetText === preset.value && styles.choiceTitleSelected]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {aiStep === "region" ? (
              <View style={styles.budgetPanel}>
                <Text style={styles.budgetLabel}>{language === "ko" ? "희망 지역" : "Preferred region"}</Text>
                <TextInput
                  value={aiRegion}
                  onChangeText={setAiRegion}
                  placeholder={language === "ko" ? "예: 서울 마포구" : "Example: Mapo, Seoul"}
                  placeholderTextColor="#8A909C"
                  style={styles.budgetInput}
                />
                <Text style={styles.budgetLabel}>{language === "ko" ? "상호명" : "Store name"}</Text>
                <TextInput
                  value={aiStoreName}
                  onChangeText={setAiStoreName}
                  placeholder={language === "ko" ? "정하지 않았으면 비워도 됩니다." : "Leave blank if undecided."}
                  placeholderTextColor="#8A909C"
                  style={styles.budgetInput}
                />
                {aiError ? <Text style={styles.warningText}>{aiError}</Text> : null}
              </View>
            ) : null}

            {aiStep === "review" && aiRoadmapResult ? (
              <View style={styles.optionList}>
                <View style={styles.budgetPanel}>
                  <View style={styles.recommendationTop}>
                    <View style={styles.flexOne}>
                      <Text style={styles.budgetLabel}>{language === "ko" ? "추천 업종" : "Recommended category"}</Text>
                      <Text style={styles.optionTitle}>{aiRoadmapResult.parsed.industryLabel}</Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>
                        {aiRoadmapResult.marketAnalysis.grade} · {aiRoadmapResult.marketAnalysis.score}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.optionSummary}>{aiRoadmapResult.marketAnalysis.summary}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.max(7, Math.min(100, aiRoadmapResult.marketAnalysis.score))}%` }
                      ]}
                    />
                  </View>
                  <View style={styles.metricWrap}>
                    <View style={styles.metricChip}>
                      <Text style={styles.metricChipText}>
                        {language === "ko" ? "유동" : "Traffic"} {aiRoadmapResult.marketAnalysis.footTraffic}
                      </Text>
                    </View>
                    <View style={styles.metricChip}>
                      <Text style={styles.metricChipText}>
                        {language === "ko" ? "경쟁" : "Competition"} {aiRoadmapResult.marketAnalysis.competition}
                      </Text>
                    </View>
                    <View style={styles.metricChip}>
                      <Text style={styles.metricChipText}>
                        {language === "ko" ? "임대료" : "Rent"} {aiRoadmapResult.marketAnalysis.rentLevel}
                      </Text>
                    </View>
                    <View style={styles.metricChip}>
                      <Text style={styles.metricChipText}>
                        {language === "ko" ? "타깃" : "Fit"} {aiRoadmapResult.marketAnalysis.targetFit}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.metricGrid}>
                  <ProfileItem label={language === "ko" ? "예산" : "Budget"} value={formatBudgetPresetLabel(aiRoadmapResult.budgetAllocation.total, language)} />
                  <ProfileItem label={language === "ko" ? "지역" : "Region"} value={aiRoadmapResult.parsed.preferredRegion || "-"} />
                  <ProfileItem label={language === "ko" ? "오픈 목표" : "Target"} value={aiRoadmapResult.timeline.targetOpenDate} />
                  <ProfileItem label={language === "ko" ? "총 기간" : "Timeline"} value={`${aiRoadmapResult.timeline.totalWeeks}${language === "ko" ? "주" : " weeks"}`} />
                </View>
                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>{language === "ko" ? "예산 배분" : "Budget allocation"}</Text>
                  {([
                    { key: "deposit", label: language === "ko" ? "보증금" : "Deposit", value: aiRoadmapResult.budgetAllocation.deposit },
                    { key: "interior", label: language === "ko" ? "인테리어" : "Interior", value: aiRoadmapResult.budgetAllocation.interior },
                    { key: "equipment", label: language === "ko" ? "집기/장비" : "Equipment", value: aiRoadmapResult.budgetAllocation.equipment },
                    { key: "workingCapital", label: language === "ko" ? "운영자금" : "Working capital", value: aiRoadmapResult.budgetAllocation.workingCapital }
                  ]).map((item) => {
                    const percent =
                      aiRoadmapResult.budgetAllocation.total > 0
                        ? Math.round((item.value / aiRoadmapResult.budgetAllocation.total) * 100)
                        : 0;
                    return (
                      <View key={item.key} style={styles.inlineSummaryRow}>
                        <Text style={styles.inlineSummaryLabel}>{item.label}</Text>
                        <Text style={styles.inlineSummaryValue}>
                          {formatWonCompact(item.value, language)} · {percent}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>{language === "ko" ? "예상 월 비용" : "Estimated monthly costs"}</Text>
                  {([
                    { key: "ingredients", label: language === "ko" ? "재료/매입" : "COGS", value: aiRoadmapResult.monthlyCosts.ingredients },
                    { key: "labor", label: language === "ko" ? "인건비" : "Labor", value: aiRoadmapResult.monthlyCosts.labor },
                    { key: "rent", label: language === "ko" ? "임대료" : "Rent", value: aiRoadmapResult.monthlyCosts.rent },
                    { key: "utilities", label: language === "ko" ? "공과금" : "Utilities", value: aiRoadmapResult.monthlyCosts.utilities },
                    { key: "other", label: language === "ko" ? "기타" : "Other", value: aiRoadmapResult.monthlyCosts.other }
                  ]).map((item) => (
                    <View key={item.key} style={styles.inlineSummaryRow}>
                      <Text style={styles.inlineSummaryLabel}>{item.label}</Text>
                      <Text style={styles.inlineSummaryValue}>{formatWonCompact(item.value, language)}</Text>
                    </View>
                  ))}
                </View>
                {aiRoadmapResult.timeline.phases.length > 0 ? (
                  <View style={styles.budgetPanel}>
                    <Text style={styles.budgetLabel}>{language === "ko" ? "실행 타임라인" : "Execution timeline"}</Text>
                    {aiRoadmapResult.timeline.phases.map((phase, index) => (
                      <View key={`${phase.name}-${index}`} style={styles.inlineSummaryRow}>
                        <Text style={styles.inlineSummaryLabel}>
                          {language === "ko" ? `${index + 1}단계` : `Phase ${index + 1}`}
                        </Text>
                        <Text style={styles.inlineSummaryValue}>
                          {phase.name} · {phase.weeks}{language === "ko" ? "주" : " weeks"}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View style={styles.budgetPanel}>
                  <Text style={styles.budgetLabel}>{language === "ko" ? "추천 실행 자원" : "Recommended resources"}</Text>
                  {aiRoadmapResult.recommendations.permits.slice(0, 4).map((permit) => (
                    <View key={`permit-${permit}`} style={styles.inlineSummaryRow}>
                      <Text style={styles.inlineSummaryLabel}>{language === "ko" ? "인허가" : "Permit"}</Text>
                      <Text style={styles.inlineSummaryValue}>{permit}</Text>
                    </View>
                  ))}
                  {[...aiRoadmapResult.recommendations.deliveryPlatforms, ...aiRoadmapResult.recommendations.snsChannels]
                    .slice(0, 5)
                    .map((channel) => (
                      <View key={`channel-${channel}`} style={styles.inlineSummaryRow}>
                        <Text style={styles.inlineSummaryLabel}>{language === "ko" ? "채널" : "Channel"}</Text>
                        <Text style={styles.inlineSummaryValue}>{channel}</Text>
                      </View>
                    ))}
                  {aiRoadmapResult.recommendations.suppliers.slice(0, 3).map((supplier) => (
                    <View key={`${supplier.name}-${supplier.category}`} style={styles.inlineSummaryRow}>
                      <Text style={styles.inlineSummaryLabel}>{supplier.category}</Text>
                      <Text style={styles.inlineSummaryValue}>
                        {supplier.name} · {supplier.priceRange}
                      </Text>
                      <Text style={styles.helper}>{supplier.reason}</Text>
                    </View>
                  ))}
                  {aiRoadmapResult.recommendations.taxAdvice ? (
                    <View style={styles.inlineSummaryRow}>
                      <Text style={styles.inlineSummaryLabel}>{language === "ko" ? "세무" : "Tax"}</Text>
                      <Text style={styles.inlineSummaryValue}>{aiRoadmapResult.recommendations.taxAdvice}</Text>
                    </View>
                  ) : null}
                </View>
                {aiRoadmapResult.recommendations.interior.length > 0 ? (
                  <View style={styles.budgetPanel}>
                    <Text style={styles.budgetLabel}>{language === "ko" ? "공간/설비 추천" : "Interior and equipment"}</Text>
                    {aiRoadmapResult.recommendations.interior.slice(0, 4).map((item) => (
                      <View key={`${item.item}-${item.vendor}`} style={styles.inlineSummaryRow}>
                        <Text style={styles.inlineSummaryLabel}>{item.vendor}</Text>
                        <Text style={styles.inlineSummaryValue}>
                          {item.item} · {item.estimatedCost}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {aiRoadmapResult.risks.slice(0, 4).map((risk) => (
                  <View key={`${risk.level}-${risk.description}`} style={styles.budgetPanel}>
                    <Text style={risk.level === "high" ? styles.criticalText : risk.level === "medium" ? styles.warningText : styles.freshnessText}>
                      {risk.level === "high"
                        ? language === "ko" ? "위험 높음" : "High risk"
                        : risk.level === "medium"
                          ? language === "ko" ? "주의" : "Medium risk"
                          : language === "ko" ? "낮음" : "Low risk"}
                    </Text>
                    <Text style={styles.optionTitle}>{risk.description}</Text>
                    <Text style={styles.helper}>{risk.mitigation}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.stageFooter}>
              <Pressable onPress={closeMobileOnboarding} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{language === "ko" ? "처음으로" : "Back"}</Text>
              </Pressable>
              {aiStep !== "idea" ? (
                <Pressable
                  onPress={() =>
                    setAiStep(aiStep === "review" ? "region" : aiStep === "region" ? "budget" : "idea")
                  }
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>{language === "ko" ? "이전" : "Previous"}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  if (aiStep === "idea") setAiStep("budget");
                  else if (aiStep === "budget") setAiStep("region");
                  else if (aiStep === "region") void generateAiRoadmap();
                  else void applyAiRoadmap();
                }}
                disabled={!aiCanContinue || aiStatus === "loading"}
                style={[
                  styles.primaryButton,
                  (!aiCanContinue || aiStatus === "loading") && styles.primaryButtonDisabled
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {aiStatus === "loading"
                    ? language === "ko" ? "생성 중..." : "Generating..."
                    : aiStep === "review"
                      ? language === "ko" ? "이 로드맵 적용" : "Apply roadmap"
                      : aiStep === "region"
                        ? language === "ko" ? "AI 로드맵 생성" : "Generate roadmap"
                        : language === "ko" ? "다음" : "Continue"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        ) : null}

        {activeSurface === "home" && !onboardingMode ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{language === "ko" ? "홈" : "Home"}</Text>
          {isFreshAccount ? (
            <View style={styles.onboardingChoiceGrid}>
              {onboardingChoiceCards.map((card) => (
                <Pressable key={card.id} onPress={card.onPress} style={styles.onboardingChoiceCard}>
                  <Text style={styles.stageBriefLabel}>{card.label}</Text>
                  <Text style={styles.onboardingChoiceTitle}>{card.title}</Text>
                  <Text style={styles.stageBriefBody}>{card.body}</Text>
                  <Text style={styles.onboardingChoiceAction}>{card.actionLabel}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.currentStageCard}>
              <Text style={styles.currentMeta}>{language === "ko" ? "오늘의 진행" : "Today"}</Text>
              <Text style={styles.currentTitle}>{language === "ko" ? "지금 해야 할 일" : "What to do next"}</Text>
              <Text style={styles.currentBody}>{localizedCurrentStage.title}</Text>
            <View style={styles.summaryBar}>
              <View style={styles.summarySegment}>
                <Text style={styles.summarySegmentText}>{copy.home.progress} {visibleProgressPercent}%</Text>
              </View>
              <View style={styles.summarySegment}>
                <Text style={styles.summarySegmentText}>{copy.home.completed} {visibleCompletedCount} / {visibleRoadmapStages.length}</Text>
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
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(7, visibleProgressPercent)}%` }]} />
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
            <View style={styles.mobileFeatureGrid}>
              {([
                {
                  surface: "analytics" as const,
                  label: language === "ko" ? "분석" : "Analytics",
                  title: language === "ko" ? "운영 지표 보기" : "View operating signals",
                  body: language === "ko" ? "진행률, 비용, 지원사업 후보를 한 번에 봅니다." : "See progress, finance, and program signals together."
                },
                {
                  surface: "franchise" as const,
                  label: language === "ko" ? "프랜차이즈" : "Franchise",
                  title: language === "ko" ? "브랜드 비교" : "Compare brands",
                  body: language === "ko" ? "창업비용, 매출, 폐점률, 안정성을 비교합니다." : "Compare cost, revenue, closure rate, and stability."
                },
                {
                  surface: "marketing" as const,
                  label: language === "ko" ? "마케팅" : "Marketing",
                  title: language === "ko" ? "첫 고객 채널" : "First customer channels",
                  body: language === "ko" ? "업종에 맞는 초기 채널과 실행 순서를 봅니다." : "Review early channels and execution order for your category."
                }
              ]).map((item) => (
                <Pressable
                  key={item.surface}
                  onPress={() => navigateToSurface(item.surface)}
                  style={styles.mobileFeatureCard}
                >
                  <Text style={styles.stageBriefLabel}>{item.label}</Text>
                  <Text style={styles.stageBriefTitle}>{item.title}</Text>
                  <Text style={styles.stageBriefBody}>{item.body}</Text>
                </Pressable>
              ))}
            </View>
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
          )}
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
            <View style={styles.stageBriefGrid}>
              {stageBriefCards.map((card) => (
                <View key={card.label} style={styles.stageBriefCard}>
                  <Text style={styles.stageBriefLabel}>{card.label}</Text>
                  <Text style={styles.stageBriefTitle}>{card.title}</Text>
                  <Text style={styles.stageBriefBody} numberOfLines={3}>{card.body}</Text>
                </View>
              ))}
            </View>
            {isFreshAccount ? null : (
              <>
                <View style={styles.summaryBar}>
                  <View style={styles.summarySegment}>
                    <Text style={styles.summarySegmentText}>{copy.home.progress} {visibleProgressPercent}%</Text>
                  </View>
                  <View style={styles.summarySegment}>
                    <Text style={styles.summarySegmentText}>{copy.home.completed} {visibleCompletedCount} / {visibleRoadmapStages.length}</Text>
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
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.max(7, visibleProgressPercent)}%` }]} />
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
            ) : canUseGenericTaskStage ? (
              <>
                <Text style={styles.helper}>{currentStageAssistCopy}</Text>
                <View style={styles.budgetPanel}>
                  <View style={styles.recommendationTop}>
                    <View style={styles.flexOne}>
                      <Text style={styles.budgetLabel}>
                        {language === "ko" ? "단계 진행률" : "Stage progress"}
                      </Text>
                      <Text style={styles.optionTitle}>
                        {language === "ko"
                          ? `완료 ${completedCurrentStageTasks.length} / ${currentStageTasks.length}`
                          : `${completedCurrentStageTasks.length} of ${currentStageTasks.length} done`}
                      </Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>{currentStageTaskProgress}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(7, currentStageTaskProgress)}%` }]} />
                  </View>
                  <Text style={styles.helper}>
                    {language === "ko"
                      ? `필수 ${requiredCurrentStageTasks.filter((task) => task.status === "completed").length} / ${requiredCurrentStageTasks.length}개를 완료하면 다음 단계로 넘어갑니다.`
                      : `Complete ${requiredCurrentStageTasks.filter((task) => task.status === "completed").length} of ${requiredCurrentStageTasks.length} required items to continue.`}
                  </Text>
                </View>

                <View style={styles.optionList}>
                  {currentStageTasks.map((task) => {
                    const completed = task.status === "completed";
                    const title =
                      localizeTaskTitle(task.taskId, language, industryCategoryId) ?? task.title;

                    return (
                      <Pressable
                        key={task.taskId}
                        onPress={() => handleGenericTaskToggle(currentStage.stageId, task.taskId)}
                        style={[styles.optionCard, completed && styles.optionCardSelected]}
                      >
                        <View style={styles.recommendationTop}>
                          <View style={styles.flexOne}>
                            <Text style={styles.optionTitle}>{title}</Text>
                          </View>
                          <View style={[styles.scoreBadge, completed && styles.scoreBadgeDone]}>
                            <Text style={[styles.scoreBadgeText, completed && styles.scoreBadgeDoneText]}>
                              {completed
                                ? language === "ko"
                                  ? "완료"
                                  : "Done"
                                : task.required
                                  ? language === "ko"
                                    ? "필수"
                                    : "Required"
                                  : language === "ko"
                                    ? "선택"
                                    : "Optional"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.metricWrap}>
                          <View style={styles.metricChip}>
                            <Text style={styles.metricChipText}>
                              {formatStageType(currentStage.type, language)}
                            </Text>
                          </View>
                          {task.estimatedMinutes ? (
                            <View style={styles.metricChip}>
                              <Text style={styles.metricChipText}>
                                {language === "ko"
                                  ? `예상 ${task.estimatedMinutes}분`
                                  : `${task.estimatedMinutes} min`}
                              </Text>
                            </View>
                          ) : null}
                          {task.waitDays ? (
                            <View style={styles.metricChip}>
                              <Text style={styles.metricChipText}>
                                {language === "ko"
                                  ? `대기 약 ${task.waitDays}일`
                                  : `Wait ${task.waitDays} days`}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {task.followupQuestion ? (
                          <Text style={styles.helper}>{task.followupQuestion}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.stageFooter}>
                  <Pressable
                    onPress={handleGenericTaskStageContinue}
                    disabled={!currentStageRequiredDone}
                    style={[
                      styles.primaryButton,
                      !currentStageRequiredDone && styles.primaryButtonDisabled
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {language === "ko" ? "필수 항목 완료하고 다음 단계" : "Complete required items and continue"}
                    </Text>
                  </Pressable>
                  <Pressable onPress={resetDemo} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>{copy.common.resetDemo}</Text>
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

            {/* 구독/회원 관리 — analytics 와 동일 카드. 어느 쪽에서든 CRUD 가능. */}
            {subscriptionCardElement}
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
                <View style={styles.presetRow}>
                  {financeRentPresets.map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => setFinanceMonthlyRentText(value)}
                      style={[styles.presetChip, financeMonthlyRentText === value && styles.presetChipSelected]}
                    >
                      <Text style={[styles.presetChipText, financeMonthlyRentText === value && styles.presetChipTextSelected]}>
                        {language === "ko" ? `${value}만원` : `${value}0k KRW`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
                <View style={styles.presetRow}>
                  {financeLaborPresets.map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => setFinanceLaborText(value)}
                      style={[styles.presetChip, financeLaborText === value && styles.presetChipSelected]}
                    >
                      <Text style={[styles.presetChipText, financeLaborText === value && styles.presetChipTextSelected]}>
                        {value === "0"
                          ? language === "ko" ? "직원 없음" : "No staff"
                          : language === "ko" ? `${value}만원` : `${value}0k KRW`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
                <View style={styles.presetRow}>
                  {financeRevenuePresets.map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => setFinanceRevenueText(value)}
                      style={[styles.presetChip, financeRevenueText === value && styles.presetChipSelected]}
                    >
                      <Text style={[styles.presetChipText, financeRevenueText === value && styles.presetChipTextSelected]}>
                        {language === "ko" ? `${value}만원` : `${value}0k KRW`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
                {visibleRoadmapStages.map((stage, index) => {
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

        {activeSurface === "analytics" && !isFreshAccount ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{language === "ko" ? "분석" : "Analytics"}</Text>
            <View style={styles.currentStageCard}>
              <Text style={styles.currentMeta}>{language === "ko" ? "운영 신호" : "Operating signals"}</Text>
              <Text style={styles.currentTitle}>{language === "ko" ? "지금까지의 준비 상태" : "Readiness so far"}</Text>
              <Text style={styles.currentBody}>
                {language === "ko"
                  ? "모바일에서는 먼저 창업 준비, 재무 위험, 지원사업 후보를 빠르게 확인합니다."
                  : "On mobile, start with launch readiness, finance risk, and support program signals."}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(7, visibleProgressPercent)}%` }]} />
              </View>
              <View style={styles.metricGrid}>
                <ProfileItem label={language === "ko" ? "로드맵" : "Roadmap"} value={`${visibleCompletedCount}/${visibleRoadmapStages.length}`} />
                <ProfileItem label={language === "ko" ? "현재 단계" : "Current"} value={localizedCurrentStage.title} />
                <ProfileItem
                  label={language === "ko" ? "최근 재무 위험" : "Finance risk"}
                  value={savedFinanceSnapshot ? getRiskLevelLabel(savedFinanceSnapshot.riskLevel as never, language) : copy.common.notSetYet}
                />
                <ProfileItem
                  label={language === "ko" ? "손익분기" : "Break-even"}
                  value={savedFinanceSnapshot ? formatBreakEvenMonth(savedFinanceSnapshot.breakEvenMonth, language) : copy.common.notSetYet}
                />
              </View>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepMeta}>{language === "ko" ? "운영 입력" : "Operations input"}</Text>
              <Text style={styles.stepTitle}>
                {storeName || (language === "ko" ? "내 가게 운영 코어" : "Store operations core")}
              </Text>
              <Text style={styles.stepGoal}>
                {language === "ko"
                  ? "웹 운영 대시보드의 핵심 입력을 모바일에서 먼저 저장합니다. 매출, 비용, 상품, 재고, 직원을 여기서 빠르게 업데이트하세요."
                  : "Save the core web operations inputs on mobile first: sales, costs, products, inventory, and staff."}
              </Text>
              <View style={styles.metricGrid}>
                <ProfileItem label={language === "ko" ? "이번 달 매출" : "Monthly sales"} value={formatWonCompact(monthSales, language)} />
                <ProfileItem label={language === "ko" ? "이번 달 고객" : "Customers"} value={`${monthCustomers.toLocaleString()}${language === "ko" ? "명" : ""}`} />
                <ProfileItem label={language === "ko" ? "월 고정비" : "Monthly costs"} value={formatWonCompact(totalMonthlyCosts, language)} />
                <ProfileItem label={language === "ko" ? "추정 손익" : "Est. profit"} value={formatWonCompact(estimatedMonthlyProfit, language)} />
                <ProfileItem label={language === "ko" ? "재고 주의" : "Low stock"} value={`${lowInventoryCount}`} />
                <ProfileItem label={language === "ko" ? "주 인건비" : "Weekly labor"} value={formatWonCompact(weeklyLaborCost, language)} />
              </View>
              {storeSaveStatus === "saving" ? (
                <Text style={styles.freshnessText}>{language === "ko" ? "운영 데이터 저장 중..." : "Saving operations data..."}</Text>
              ) : storeSaveStatus === "saved" ? (
                <Text style={styles.freshnessText}>{language === "ko" ? "운영 데이터 저장 완료" : "Operations data saved"}</Text>
              ) : storeSaveError ? (
                <Text style={styles.warningText}>{storeSaveError}</Text>
              ) : null}
            </View>
            <View style={styles.budgetPanel}>
              <View style={styles.recommendationTop}>
                <View style={styles.flexOne}>
                  <Text style={styles.budgetLabel}>{language === "ko" ? "경영 건강도" : "Business health"}</Text>
                  <Text style={styles.optionTitle}>{healthGradeLabel}</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{healthMetrics.healthScore}</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(7, healthMetrics.healthScore)}%` }]} />
              </View>
              <View style={styles.metricGrid}>
                <ProfileItem label={language === "ko" ? "평균 일매출" : "Avg daily"} value={formatWonCompact(healthMetrics.avgDailySales, language)} />
                <ProfileItem label={language === "ko" ? "객단가" : "Ticket"} value={formatWonCompact(healthMetrics.avgTicketSize, language)} />
                <ProfileItem label={language === "ko" ? "손익분기 일매출" : "Break-even daily"} value={formatWonCompact(healthMetrics.breakEvenDailySales, language)} />
                <ProfileItem
                  label={language === "ko" ? "현금 생존" : "Runway"}
                  value={
                    healthMetrics.cashRunwayMonths < 0
                      ? "-"
                      : healthMetrics.cashRunwayMonths >= 90
                        ? language === "ko" ? "흑자" : "Profitable"
                        : `${healthMetrics.cashRunwayMonths}${language === "ko" ? "개월" : " mo"}`
                  }
                />
              </View>
              {healthMetrics.alerts.slice(0, 2).map((alert) => (
                <View key={`${alert.title}-${alert.message}`} style={styles.inlineSummaryRow}>
                  <Text
                    style={
                      alert.type === "danger"
                        ? styles.criticalText
                        : alert.type === "warning"
                          ? styles.warningText
                          : styles.freshnessText
                    }
                  >
                    {alert.title}
                  </Text>
                  <Text style={styles.inlineSummaryValue}>{alert.message}</Text>
                </View>
              ))}
              {healthMetrics.alerts.length === 0 ? (
                <Text style={styles.helper}>
                  {monthEntries.length < 7
                    ? language === "ko"
                      ? "7일 이상 매출을 입력하면 건강도 판단이 더 정확해집니다."
                      : "Add at least 7 days of sales for a stronger health read."
                    : language === "ko"
                      ? "현재 입력 기준으로 큰 경고는 없습니다."
                      : "No major alerts from the current inputs."}
                </Text>
              ) : null}
            </View>
            <View style={styles.budgetPanel}>
              <Text style={styles.budgetLabel}>{language === "ko" ? "월 손익" : "Monthly P&L"}</Text>
              <View style={styles.metricGrid}>
                <ProfileItem label={language === "ko" ? "매출" : "Revenue"} value={formatWonCompact(operatingPnl.totalRevenue, language)} />
                <ProfileItem label={language === "ko" ? "총비용" : "Costs"} value={formatWonCompact(operatingPnl.totalCosts, language)} />
                <ProfileItem label={language === "ko" ? "영업이익" : "Operating profit"} value={formatWonCompact(operatingPnl.operatingProfit, language)} />
                <ProfileItem label={language === "ko" ? "순현금흐름" : "Net cashflow"} value={formatWonCompact(operatingPnl.netCashFlow, language)} />
                <ProfileItem label={language === "ko" ? "매출총이익률" : "Gross margin"} value={`${operatingPnl.grossMargin}%`} />
                <ProfileItem label={language === "ko" ? "영업이익률" : "Op. margin"} value={`${operatingPnl.operatingMargin}%`} />
              </View>
            </View>
            <View style={styles.budgetPanel}>
              <Text style={styles.budgetLabel}>{language === "ko" ? "비용 구조" : "Cost structure"}</Text>
              {costBreakdownItems.map((item) => {
                const share = totalMonthlyCosts > 0 ? Math.round((item.value / totalMonthlyCosts) * 100) : 0;
                return (
                  <View key={item.key} style={styles.inlineSummaryRow}>
                    <Text style={styles.inlineSummaryLabel}>{item.label}</Text>
                    <Text style={styles.inlineSummaryValue}>
                      {formatWonCompact(item.value, language)} · {share}%
                    </Text>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.max(7, share)}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.budgetPanel}>
              <Text style={styles.budgetLabel}>{language === "ko" ? "예측" : "Forecast"}</Text>
              <View style={styles.metricGrid}>
                <ProfileItem label={language === "ko" ? "다음 주 일매출" : "Next week daily"} value={formatWonCompact(salesForecast.nextWeekDaily, language)} />
                <ProfileItem label={language === "ko" ? "다음 달 매출" : "Next month"} value={formatWonCompact(salesForecast.nextMonthTotal, language)} />
                <ProfileItem label={language === "ko" ? "신뢰도" : "Confidence"} value={forecastConfidenceLabel} />
                <ProfileItem label={language === "ko" ? "기록일" : "Days"} value={`${dailyEntries.length}`} />
              </View>
              <Text style={styles.helper}>
                {salesForecast.nextWeekDaily > 0
                  ? salesForecast.basis
                  : language === "ko"
                    ? "최소 7일 매출을 입력하면 다음 주와 다음 달 매출을 예측합니다."
                    : "Add at least 7 days of sales to forecast next week and next month."}
              </Text>
              {momComparison ? (
                <View style={styles.inlineSummaryRow}>
                  <Text style={styles.inlineSummaryLabel}>{language === "ko" ? "전월 동기 대비" : "MoM pace"}</Text>
                  <Text style={styles.inlineSummaryValue}>
                    {formatWonCompact(momComparison.currentMTD, language)} · {momComparison.momChangePercent > 0 ? "+" : ""}{momComparison.momChangePercent}%
                  </Text>
                  <Text style={styles.helper}>
                    {language === "ko"
                      ? `월말 예상 ${formatWonCompact(momComparison.projectedMonthEnd, language)}`
                      : `Projected month-end ${formatWonCompact(momComparison.projectedMonthEnd, language)}`}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.budgetPanel}>
              <Text style={styles.budgetLabel}>{language === "ko" ? "오늘 매출" : "Daily sales"}</Text>
              <TextInput
                value={dailyDateInput}
                onChangeText={setDailyDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8A909C"
                style={styles.budgetInput}
              />
              <TextInput
                value={dailySalesInput}
                onChangeText={(value) => setDailySalesInput(value.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder={language === "ko" ? "매출, 만원 단위 예: 45" : "Sales in 10K KRW, e.g. 45"}
                placeholderTextColor="#8A909C"
                style={styles.budgetInput}
              />
              <TextInput
                value={dailyCustomersInput}
                onChangeText={(value) => setDailyCustomersInput(value.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder={language === "ko" ? "고객 수, 예: 32" : "Customers, e.g. 32"}
                placeholderTextColor="#8A909C"
                style={styles.budgetInput}
              />
              <Pressable
                onPress={handleAddDailyEntry}
                disabled={!dailySalesInput.trim()}
                style={[styles.primaryButton, !dailySalesInput.trim() && styles.primaryButtonDisabled]}
              >
                <Text style={styles.primaryButtonText}>{language === "ko" ? "오늘 매출 저장" : "Save sales"}</Text>
              </Pressable>
              {dailyEntries.slice(0, 3).map((entry) => (
                <View key={entry.date} style={styles.inlineSummaryRow}>
                  <Text style={styles.inlineSummaryLabel}>{entry.date}</Text>
                  <Text style={styles.inlineSummaryValue}>
                    {formatWonCompact(entry.sales, language)} · {entry.customers.toLocaleString()}{language === "ko" ? "명" : " customers"}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.budgetPanel}>
              <Text style={styles.budgetLabel}>{language === "ko" ? "월 비용" : "Monthly costs"}</Text>
              <TextInput value={costIngredientsText} onChangeText={(value) => setCostIngredientsText(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "재료/매입비, 만원" : "COGS, 10K KRW"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <TextInput value={costLaborText} onChangeText={(value) => setCostLaborText(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "인건비, 만원" : "Labor, 10K KRW"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <TextInput value={costRentText} onChangeText={(value) => setCostRentText(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "임대료, 만원" : "Rent, 10K KRW"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <TextInput value={costUtilitiesText} onChangeText={(value) => setCostUtilitiesText(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "공과금, 만원" : "Utilities, 10K KRW"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <TextInput value={costMarketingText} onChangeText={(value) => setCostMarketingText(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "마케팅비, 만원" : "Marketing, 10K KRW"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <Pressable onPress={handleSaveMonthlyCosts} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{language === "ko" ? "월 비용 저장" : "Save monthly costs"}</Text>
              </Pressable>
            </View>
            <View style={styles.budgetPanel}>
              <Text style={styles.budgetLabel}>{language === "ko" ? "상품/메뉴" : "Products"}</Text>
              <TextInput value={productNameInput} onChangeText={setProductNameInput} placeholder={language === "ko" ? "상품명" : "Product name"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <TextInput value={productPriceInput} onChangeText={(value) => setProductPriceInput(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "판매가, 만원" : "Price, 10K KRW"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <TextInput value={productCostInput} onChangeText={(value) => setProductCostInput(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "원가, 만원" : "Cost, 10K KRW"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <TextInput value={productStockInput} onChangeText={(value) => setProductStockInput(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "재고 수량" : "Stock count"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
              <Pressable onPress={handleAddProduct} disabled={!productNameInput.trim()} style={[styles.secondaryButton, !productNameInput.trim() && styles.primaryButtonDisabled]}>
                <Text style={styles.secondaryButtonText}>{language === "ko" ? "상품 추가" : "Add product"}</Text>
              </Pressable>
              {products.slice(0, 3).map((product) => (
                <View key={product.id} style={styles.inlineSummaryRow}>
                  <Text style={styles.inlineSummaryLabel}>{product.name}</Text>
                  <Text style={styles.inlineSummaryValue}>{formatWonCompact(product.price, language)} · {language === "ko" ? "재고" : "Stock"} {product.stock}</Text>
                </View>
              ))}
            </View>
            {/* 재고 관리 — 실물 발주 업종만 (food·카페·소매·이커머스·펫·공간·뷰티) */}
            {showInventoryCard ? (
              <View style={styles.budgetPanel}>
                <Text style={styles.budgetLabel}>{language === "ko" ? "재고" : "Inventory"}</Text>
                <TextInput value={inventoryNameInput} onChangeText={setInventoryNameInput} placeholder={language === "ko" ? "재고명" : "Inventory item"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
                <TextInput value={inventoryQtyInput} onChangeText={(value) => setInventoryQtyInput(value.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" placeholder={language === "ko" ? "현재 수량" : "Quantity"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
                <TextInput value={inventoryThresholdInput} onChangeText={(value) => setInventoryThresholdInput(value.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" placeholder={language === "ko" ? "최소 수량 (발주 알림)" : "Min threshold (reorder alert)"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
                <Pressable onPress={handleAddInventoryItem} disabled={!inventoryNameInput.trim()} style={[styles.secondaryButton, !inventoryNameInput.trim() && styles.primaryButtonDisabled]}>
                  <Text style={styles.secondaryButtonText}>{language === "ko" ? "재고 추가" : "Add inventory"}</Text>
                </Pressable>
                {inventoryItems.length > 0 ? (
                  inventoryItems.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.inlineSummaryRow}>
                      <Text style={styles.inlineSummaryLabel}>{item.name}</Text>
                      <Text style={[
                        styles.inlineSummaryValue,
                        item.quantity <= item.minThreshold && { color: "#C0392B" },
                      ]}>
                        {item.quantity}{item.unit}
                        {item.quantity <= item.minThreshold
                          ? (language === "ko" ? " · 발주 필요" : " · Reorder needed")
                          : ` · ${language === "ko" ? "최소" : "Min"} ${item.minThreshold}`}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.helper}>
                    {language === "ko"
                      ? "재고를 추가하면 최소 수량 미만 시 빨간색으로 표시됩니다."
                      : "Items below minimum threshold will appear in red."}
                  </Text>
                )}
              </View>
            ) : null}

            {/* 구독/회원 관리 — analytics + profile 양쪽에서 재사용 (subscriptionCardElement 로 추출) */}
            {subscriptionCardElement}

            {/* 직원 관리 — 오프라인 인력 업종만 (food·카페·뷰티·소매·피트니스·교육·펫·생활서비스) */}
            {showStaffCard ? (
              <View style={styles.budgetPanel}>
                <Text style={styles.budgetLabel}>{language === "ko" ? "직원" : "Staff"}</Text>
                <TextInput value={employeeNameInput} onChangeText={setEmployeeNameInput} placeholder={language === "ko" ? "직원 이름" : "Employee name"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
                <TextInput value={employeeWageInput} onChangeText={(value) => setEmployeeWageInput(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder={language === "ko" ? "시급, 원 단위" : "Hourly wage, KRW"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
                <TextInput value={employeeHoursInput} onChangeText={(value) => setEmployeeHoursInput(value.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" placeholder={language === "ko" ? "주 근무시간" : "Weekly hours"} placeholderTextColor="#8A909C" style={styles.budgetInput} />
                <Pressable onPress={handleAddEmployee} disabled={!employeeNameInput.trim() || !employeeWageInput.trim() || !employeeHoursInput.trim()} style={[styles.secondaryButton, (!employeeNameInput.trim() || !employeeWageInput.trim() || !employeeHoursInput.trim()) && styles.primaryButtonDisabled]}>
                  <Text style={styles.secondaryButtonText}>{language === "ko" ? "직원 추가" : "Add staff"}</Text>
                </Pressable>
                {employees.length > 0 ? (
                  employees.slice(0, 3).map((employee) => (
                    <View key={employee.id} style={styles.inlineSummaryRow}>
                      <Text style={styles.inlineSummaryLabel}>{employee.name}</Text>
                      <Text style={styles.inlineSummaryValue}>{formatWonCompact(employee.hourlyWage, language)} · {employee.weeklyHours}h/w</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.helper}>
                    {language === "ko"
                      ? "직원을 추가하면 주 인건비 합계가 자동 계산됩니다."
                      : "Add staff to auto-calculate weekly labor costs."}
                  </Text>
                )}
              </View>
            ) : null}
            <View style={styles.step}>
              <Text style={styles.stepMeta}>{language === "ko" ? "다음 행동" : "Next actions"}</Text>
              <Text style={styles.stepTitle}>{language === "ko" ? "분석을 채우는 빠른 입력" : "Quick inputs to improve analysis"}</Text>
              <Pressable onPress={() => navigateToSurface("guides")} style={styles.inlineSummaryRow}>
                <Text style={styles.inlineSummaryLabel}>{language === "ko" ? "재무 시뮬레이션" : "Financial simulation"}</Text>
                <Text style={styles.inlineSummaryValue}>{language === "ko" ? "자본금·임대료·매출을 넣어 위험도를 계산합니다." : "Add capital, rent, and revenue to calculate risk."}</Text>
              </Pressable>
              <Pressable onPress={() => navigateToSurface("current")} style={styles.inlineSummaryRow}>
                <Text style={styles.inlineSummaryLabel}>{language === "ko" ? "현재 단계" : "Current step"}</Text>
                <Text style={styles.inlineSummaryValue}>{nextStepSummary}</Text>
              </Pressable>
            </View>
            {supportHighlights.length > 0 ? (
              <View style={styles.step}>
                <Text style={styles.stepMeta}>{language === "ko" ? "지원사업 후보" : "Support matches"}</Text>
                <Text style={styles.stepTitle}>{language === "ko" ? "지금 같이 확인할 지원 프로그램" : "Programs to review now"}</Text>
                {supportHighlights.slice(0, 3).map((program) => (
                  <View key={program.id} style={styles.optionCard}>
                    <Text style={styles.optionTitle}>{program.name[language]}</Text>
                    <Text style={styles.optionSummary}>{program.benefit[language]}</Text>
                    <Text style={styles.freshnessText}>{program.organizer[language]}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {activeSurface === "franchise" ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{language === "ko" ? "프랜차이즈" : "Franchise"}</Text>
            <View style={styles.currentStageCard}>
              <Text style={styles.currentMeta}>{language === "ko" ? "브랜드 비교" : "Brand comparison"}</Text>
              <Text style={styles.currentTitle}>{language === "ko" ? "비용과 안정성을 같이 봅니다" : "Compare cost and stability together"}</Text>
              <Text style={styles.currentBody}>
                {language === "ko"
                  ? "웹의 프랜차이즈 비교 데이터를 모바일에서도 먼저 볼 수 있게 가져왔습니다."
                  : "The web franchise comparison data is now available on mobile first."}
              </Text>
              <View style={styles.toggleRow}>
                {franchiseCategories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      setFranchiseFilterCat(category.id);
                      setExpandedFranchiseId(null);
                    }}
                    style={[styles.toggleChip, franchiseFilterCat === category.id && styles.toggleChipSelected]}
                  >
                    <Text style={[styles.toggleChipText, franchiseFilterCat === category.id && styles.toggleChipTextSelected]}>
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.optionList}>
              {filteredFranchiseBrands.map((brand) => {
                const overall = computeOverallScore(brand.scores);
                const expanded = expandedFranchiseId === brand.id;
                return (
                  <Pressable
                    key={brand.id}
                    onPress={() => setExpandedFranchiseId(expanded ? null : brand.id)}
                    style={[styles.optionCard, expanded && styles.optionCardSelected]}
                  >
                    <View style={styles.recommendationTop}>
                      <View style={styles.flexOne}>
                        <Text style={styles.optionTitle}>{brand.name[language]}</Text>
                        <Text style={styles.optionSummary}>{brand.tagline[language]}</Text>
                      </View>
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>{overall}</Text>
                      </View>
                    </View>
                    <View style={styles.metricGrid}>
                      <ProfileItem label={language === "ko" ? "창업비용" : "Startup"} value={formatFranchiseCost(brand.startupCostWon)} />
                      <ProfileItem label={language === "ko" ? "연매출" : "Revenue"} value={formatFranchiseCost(brand.avgAnnualRevenueWon)} />
                      <ProfileItem label={language === "ko" ? "폐점률" : "Closure"} value={`${brand.closureRate}%`} />
                      <ProfileItem label={language === "ko" ? "평가" : "Score"} value={getScoreLabel(overall, language)} />
                    </View>
                    {expanded ? (
                      <View style={styles.budgetPanel}>
                        <Text style={styles.budgetLabel}>{language === "ko" ? "특이사항" : "Key notes"}</Text>
                        {brand.roadmapNotes[language].slice(0, 3).map((note) => (
                          <Text key={note} style={styles.aiHelper}>• {note}</Text>
                        ))}
                        <Text style={styles.freshnessText}>
                          {brand.costVerified
                            ? language === "ko" ? `검증 비용 · ${brand.costSource ?? brand.dataYear}` : `Verified cost · ${brand.costSource ?? brand.dataYear}`
                            : language === "ko" ? "비용 검증 필요" : "Cost needs verification"}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {activeSurface === "marketing" ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{language === "ko" ? "마케팅" : "Marketing"}</Text>
            <View style={styles.currentStageCard}>
              <Text style={styles.currentMeta}>{language === "ko" ? "첫 고객" : "First customers"}</Text>
              <Text style={styles.currentTitle}>{language === "ko" ? "업종에 맞는 채널부터 시작합니다" : "Start with channels that fit the business"}</Text>
              <Text style={styles.currentBody}>
                {language === "ko"
                  ? `${selectedIndustryLabel} 기준으로 초기 고객을 만들 채널을 우선순위로 정리했습니다.`
                  : `Prioritized first-customer channels for ${selectedIndustryLabel}.`}
              </Text>
            </View>
            <View style={styles.optionList}>
              {recommendedMarketingChannels.map((channel, index) => {
                const selected = selectedMarketingChannelMeta.key === channel.key;
                return (
                  <Pressable
                    key={channel.key}
                    onPress={() => setSelectedMarketingChannel(channel.key)}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                  >
                    <View style={styles.recommendationTop}>
                      <Text style={styles.optionTitle}>{channel.label[language]}</Text>
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>{index + 1}</Text>
                      </View>
                    </View>
                    <Text style={styles.optionSummary}>{channel.body[language]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.step}>
              <Text style={styles.stepMeta}>{language === "ko" ? "이번 주 실행" : "This week"}</Text>
              <Text style={styles.stepTitle}>{selectedMarketingChannelMeta.label[language]}</Text>
              {[
                language === "ko" ? "프로필/소개 문구를 오늘 안에 정리합니다." : "Finish the profile and intro copy today.",
                language === "ko" ? "첫 혜택 또는 첫 방문 이유를 하나만 만듭니다." : "Create one reason to try or visit first.",
                language === "ko" ? "성과는 지출보다 문의·저장·방문 같은 초기 신호부터 봅니다." : "Read early signals such as inquiries, saves, and visits before spend."
              ].map((item) => (
                <Text key={item} style={styles.aiHelper}>• {item}</Text>
              ))}
            </View>
          </View>
        ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
    </AuroraBackground>
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
    backgroundColor: "transparent"
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 112,
    gap: 16
  },
  eyebrow: {
    fontSize: 13,
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: colors.primary
  },
  title: {
    fontSize: 32,
    lineHeight: 35,
    fontWeight: "700",
    letterSpacing: -1.1,
    color: "#101820"
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "#637083"
  },
  section: {
    gap: 12
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    borderRadius: radii.card,
    padding: 20,
    gap: 10,
    ...shadows.glassCard
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#101820"
  },
  cardSummary: {
    fontSize: 15,
    lineHeight: 24,
    color: "#637083"
  },
  cardPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: "#637083"
  },
  currentStageCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.76)",
    borderRadius: radii.card,
    padding: 20,
    gap: 9,
    ...shadows.glassCard
  },
  currentMeta: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.primary
  },
  currentTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: "#101820"
  },
  currentBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#637083"
  },
  stageBriefGrid: {
    gap: 8
  },
  mobileFeatureGrid: {
    gap: 9
  },
  onboardingChoiceGrid: {
    gap: 10
  },
  onboardingChoiceCard: {
    minHeight: 148,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.07)",
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingHorizontal: 18,
    paddingVertical: 17,
    gap: 8,
    ...shadows.glassCard
  },
  onboardingChoiceTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
    color: "#101820"
  },
  onboardingChoiceAction: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary
  },
  mobileFeatureCard: {
    minHeight: 100,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.07)",
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 5
  },
  stageBriefCard: {
    minHeight: 92,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.07)",
    backgroundColor: "rgba(255,255,255,0.74)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 5
  },
  stageBriefLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  stageBriefTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#101820"
  },
  stageBriefBody: {
    fontSize: 13,
    lineHeight: 19,
    color: "#637083"
  },
  transitionNotice: {
    borderRadius: radii.lg,
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
    color: colors.primary,
    fontWeight: "700"
  },
  transitionNoticeText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.primary
  },
  helper: {
    fontSize: 14,
    lineHeight: 22,
    color: "#637083"
  },
  summaryBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: radii.lg,
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
    color: "#637083"
  },
  progressTrack: {
    height: 7,
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: "rgba(15,23,42,0.07)"
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.primary
  },
  inlineSummaryRow: {
    borderRadius: radii.lg,
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
    color: "#637083"
  },
  inlineSummaryValue: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: "#101820"
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.62)",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  currentUtilityButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#637083"
  },
  currentStateChip: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.46)",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  currentStateChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#637083"
  },
  quickActionGrid: {
    gap: 10
  },
  quickActionCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: radii.xl,
    padding: 16,
    gap: 6,
    ...shadows.glassCard
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101820"
  },
  quickActionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#637083"
  },
  pill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  pillText: {
    fontSize: 13,
    color: "#637083"
  },
  optionList: {
    gap: 10
  },
  optionCard: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: radii.xl,
    padding: 16,
    gap: 8,
    ...shadows.glassCard
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
    color: "#101820"
  },
  optionSummary: {
    fontSize: 14,
    lineHeight: 22,
    color: "#637083"
  },
  recommendationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  scoreBadge: {
    borderRadius: radii.pill,
    backgroundColor: "rgba(29,53,87,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  scoreBadgeDone: {
    backgroundColor: colors.primary
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary
  },
  scoreBadgeDoneText: {
    color: "#FFFFFF"
  },
  metricWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metricChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.8)"
  },
  metricChipText: {
    fontSize: 12,
    color: "#637083"
  },
  freshnessText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#637083"
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
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: -2
  },
  presetChip: {
    minHeight: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 11,
    paddingVertical: 8,
    justifyContent: "center"
  },
  presetChipSelected: {
    borderColor: "rgba(29,53,87,0.28)",
    backgroundColor: "rgba(29,53,87,0.07)"
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#637083"
  },
  presetChipTextSelected: {
    color: colors.primary
  },
  budgetPanel: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    borderRadius: radii.xl,
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
    color: "#637083"
  },
  confidenceBadge: {
    fontSize: 11,
    color: colors.primary,
    backgroundColor: "rgba(29,53,87,0.08)",
    borderWidth: 1,
    borderColor: "rgba(29,53,87,0.1)",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden"
  },
  budgetValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: "#101820"
  },
  budgetInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#101820"
  },
  multilineInput: {
    minHeight: 82,
    textAlignVertical: "top"
  },
  aiHelper: {
    fontSize: 13,
    lineHeight: 20,
    color: "#637083"
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  choiceCard: {
    width: "48%",
    minHeight: 74,
    borderRadius: radii.lg,
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
    color: "#101820"
  },
  choiceTitleSelected: {
    color: colors.primary
  },
  choiceCaption: {
    fontSize: 13,
    lineHeight: 19,
    color: "#637083"
  },
  toggleChip: {
    borderRadius: radii.pill,
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
    color: "#637083"
  },
  toggleChipTextSelected: {
    color: colors.primary,
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
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(245,247,250,0.74)"
  },
  stageInlineActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center"
  },
  primaryButton: {
    borderRadius: radii.md,
    backgroundColor: colors.primaryBottom,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...shadows.primaryButton
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  secondaryButtonText: {
    color: "#101820",
    fontSize: 14,
    fontWeight: "500"
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#637083"
  },
  roadmapList: {
    gap: 10
  },
  roadmapRow: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: radii.xl,
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
    color: colors.primary
  },
  roadmapTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101820"
  },
  roadmapStatus: {
    fontSize: 13,
    color: "#637083"
  },
  roadmapStatusQuiet: {
    color: "rgba(91,97,110,0.72)"
  },
  roadmapTitleQuiet: {
    color: "rgba(17,17,17,0.72)"
  },
  step: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    padding: 18,
    gap: 8
  },
  stepMeta: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.primary
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#101820"
  },
  stepGoal: {
    fontSize: 15,
    lineHeight: 24,
    color: "#637083"
  },
  profileGrid: {
    gap: 10
  },
  metricGrid: {
    gap: 8
  },
  flexOne: {
    flex: 1
  },
  profileItem: {
    borderRadius: radii.xl,
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
    color: "#637083"
  },
  profileValue: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
    color: "#101820"
  }
});
