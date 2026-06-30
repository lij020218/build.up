import type { FreshnessMeta } from "./freshness";

export type StageType = "selection" | "comparison" | "execution" | "verification";

export type StageStatus = "locked" | "available" | "in_progress" | "completed";

export type Severity = "low" | "medium" | "high";

export type RecommendationType =
  | "industry"
  | "business_model"
  | "location"
  | "store"
  | "loan";

export type CompletionRule =
  | {
      kind: "select_one";
      minimumSelectedCount?: number;
    }
  | {
      kind: "select_and_save";
      requiredKeys: string[];
    }
  | {
      kind: "required_inputs";
      requiredKeys: string[];
    }
  | {
      kind: "required_tasks";
      requiredTaskIds: string[];
    }
  | {
      kind: "verification_checks";
      requiredKeys: string[];
    };

export type RecommendationItem = {
  id: string;
  title: string;
  score?: number;
  summary?: string;
  reasons?: string[];
  warnings?: string[];
  meta?: Record<string, string | number>;
  freshness?: FreshnessMeta;
};

export type RecommendationPayload = {
  type: RecommendationType;
  items: RecommendationItem[];
  recommendedItemId?: string;
};

export type RiskState = {
  riskId: string;
  title: string;
  description: string;
  severity: Severity;
  isResolved: boolean;
  actionLabel?: string;
};

export type TaskState = {
  taskId: string;
  title: string;
  status: "todo" | "in_progress" | "completed";
  required: boolean;
  estimatedMinutes?: number;
  // 팔로업 시스템: 완료 후 대기 기간이 있는 태스크
  completedAt?: string;        // ISO 8601 — 체크한 시점
  waitDays?: number;           // 예상 대기 기간 (일)
  followupQuestion?: string;   // AI가 물어볼 팔로업 질문
  followupAnswered?: boolean;  // 사용자가 팔로업에 응답했는지
};

// Conditional next-stage routing based on a prior decision value.
// When a stage completes, the engine checks conditions in order.
// The first matching condition wins; if none match, nextStageIds is used.
//
// `matchValue` (단일 값) 또는 `matchValueIn` (값 배열) 중 하나를 사용.
// — 클러스터 단위 분기 (예: 로보틱스 OR 바이오 → 같은 다음 단계) 시 matchValueIn 으로 표현.
export type NextStageCondition = {
  decisionStageId: string;   // which stage's decision to read
  decisionKey: string;       // "selectedPrimaryOptionId" | "categoryId" | inputs key
  matchValue?: string;       // value to compare against (단일 매치)
  matchValueIn?: string[];   // OR-매치 (이 중 하나라도 일치하면 통과)
  stageIds: string[];        // stages to unlock when matched
};

export type RoadmapStageState = {
  stageId: string;
  code: string;
  title: string;
  type: StageType;
  status: StageStatus;
  /** @deprecated 표시는 useComputedDashboard.pathStepNumber(traverseUserPath 기반 동적) 사용.
   *   starter-data 의 하드코딩 stepNumber 는 path 와 어긋날 수 있어 *읽지 말 것*(과거 번호 점프 원인). */
  stepNumber: number;
  totalSteps: number;
  goal: string;
  whyNow: string;
  completionRule: CompletionRule;
  recommendationPayload?: RecommendationPayload;
  taskIds: string[];
  riskIds: string[];
  nextStageIds: string[];
  nextStageConditions?: NextStageCondition[];
};

export type RoadmapState = {
  roadmapId: string;
  templateId: string;
  currentStageId: string;
  progressPercent: number;
  stages: RoadmapStageState[];
  completedStageIds: string[];
  unlockedStageIds: string[];
};

export type StageDecisionState = {
  stageId: string;
  selectedOptionIds?: string[];
  selectedPrimaryOptionId?: string;
  /**
   * 자유 형식 입력값 — 단계마다 의미가 다름.
   * 일반 가드(typeof === "string" 등)로 좁혀 사용. nested 객체(예: hiring-setup.staffPlan) 도 허용.
   */
  inputs?: Record<string, unknown>;
  notes?: string;
  completedAt?: string;
};

export type WorkflowTaskMap = Record<string, TaskState[]>;

export type WorkflowDecisionMap = Record<string, StageDecisionState | undefined>;

export type CompletionCheck = {
  isComplete: boolean;
  missingKeys: string[];
  missingTaskIds: string[];
};

export type StageTransitionResult = {
  roadmap: RoadmapState;
  decisions: WorkflowDecisionMap;
  completion: CompletionCheck;
  nextCurrentStageId: string;
  newlyUnlockedStageIds: string[];
};

export type UserBusinessProfile = {
  userId: string;
  industryCategoryId?: string;
  subIndustryId?: string;
  selectedSpecialtyId?: string;
  startupType?: "franchise" | "independent" | "undecided";
  businessModelId?: string;
  capital?: number;
  loanIntent?: "yes" | "no" | "undecided";
  monthlyFixedCostLimit?: number;
  targetOpenDate?: string;
  preferredRegions?: string[];
  targetCustomerTypes?: string[];
  locationPriorities?: string[];
  hasStore?: boolean | null;
  employeePlan?: "yes" | "no" | "undecided";
};
