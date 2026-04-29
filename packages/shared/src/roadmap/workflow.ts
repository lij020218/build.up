import type {
  CompletionCheck,
  CompletionRule,
  NextStageCondition,
  RoadmapStageState,
  RoadmapState,
  TaskState,
  StageDecisionState,
  StageStatus,
  StageTransitionResult,
  WorkflowDecisionMap,
  WorkflowTaskMap
} from "../types/roadmap";

type DecisionInputValue = string | number | boolean | string[];

function hasUsableValue(value: DecisionInputValue | undefined): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null;
}

function getDecisionValue(
  decision: StageDecisionState | undefined,
  key: string
): string | number | boolean | string[] | undefined {
  if (!decision) {
    return undefined;
  }

  if (key === "selectedPrimaryOptionId") {
    return decision.selectedPrimaryOptionId;
  }

  if (key === "selectedOptionIds") {
    return decision.selectedOptionIds;
  }

  return decision.inputs?.[key];
}

function evaluateRule(
  rule: CompletionRule,
  decision: StageDecisionState | undefined,
  tasks: WorkflowTaskMap[string] | undefined
): CompletionCheck {
  switch (rule.kind) {
    case "select_one": {
      const selectedCount =
        (decision?.selectedOptionIds?.length ?? 0) +
        (decision?.selectedPrimaryOptionId ? 1 : 0);

      return {
        isComplete: selectedCount >= (rule.minimumSelectedCount ?? 1),
        missingKeys: selectedCount >= (rule.minimumSelectedCount ?? 1) ? [] : ["selection"],
        missingTaskIds: []
      };
    }

    case "select_and_save":
    case "required_inputs":
    case "verification_checks": {
      const missingKeys = rule.requiredKeys.filter(
        (key) => !hasUsableValue(getDecisionValue(decision, key))
      );

      return {
        isComplete: missingKeys.length === 0,
        missingKeys,
        missingTaskIds: []
      };
    }

    case "required_tasks": {
      const completedTaskIds = new Set(
        (tasks ?? []).filter((task) => task.status === "completed").map((task) => task.taskId)
      );
      const missingTaskIds = rule.requiredTaskIds.filter((taskId) => !completedTaskIds.has(taskId));

      return {
        isComplete: missingTaskIds.length === 0,
        missingKeys: [],
        missingTaskIds
      };
    }
  }
}

export function evaluateStageCompletion(
  stage: RoadmapStageState,
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap
): CompletionCheck {
  const decision = decisions[stage.stageId];

  // 기존 가게 온보딩 등으로 명시적으로 완료 처리된 스테이지는 규칙 재평가 없이 완료로 취급
  if (decision?.completedAt) {
    return { isComplete: true, missingKeys: [], missingTaskIds: [] };
  }

  return evaluateRule(stage.completionRule, decision, tasks[stage.stageId]);
}

function updateStageStatus(
  stage: RoadmapStageState,
  completion: CompletionCheck,
  currentStageId: string,
  unlockedStageIds: Set<string>
): StageStatus {
  if (completion.isComplete) {
    return "completed";
  }

  if (stage.stageId === currentStageId) {
    return "in_progress";
  }

  if (unlockedStageIds.has(stage.stageId)) {
    return "available";
  }

  return "locked";
}

function getFirstAvailableStageId(stages: RoadmapStageState[], reachableIds?: Set<string>): string {
  // 1. 명시적으로 in_progress인 단계
  const inProgress = stages.find((s) => s.status === "in_progress" && (!reachableIds || reachableIds.has(s.stageId)));
  if (inProgress) return inProgress.stageId;

  // 2. reachable 셋이 있으면 경로 내 available만
  if (reachableIds) {
    const reachableAvailable = stages.find((s) => s.status === "available" && reachableIds.has(s.stageId));
    if (reachableAvailable) return reachableAvailable.stageId;
  }

  // 3. fallback — reachable 내에서 미완료 단계, 없으면 전체에서 available
  if (reachableIds) {
    const reachableFallback = stages.find((s) => s.status !== "completed" && reachableIds.has(s.stageId));
    if (reachableFallback) return reachableFallback.stageId;
  }
  return stages.find((s) => s.status === "available")?.stageId ?? stages[0].stageId;
}

function resolveDecisionValue(
  decisions: WorkflowDecisionMap,
  condition: NextStageCondition
): string | undefined {
  const decision = decisions[condition.decisionStageId];
  if (!decision) return undefined;

  if (condition.decisionKey === "selectedPrimaryOptionId") {
    return decision.selectedPrimaryOptionId;
  }

  const inputVal = decision.inputs?.[condition.decisionKey];
  if (inputVal !== undefined) return String(inputVal);

  return undefined;
}

function resolveNextStageIds(
  stage: RoadmapStageState,
  decisions: WorkflowDecisionMap
): string[] {
  if (!stage.nextStageConditions || stage.nextStageConditions.length === 0) {
    return stage.nextStageIds;
  }

  for (const condition of stage.nextStageConditions) {
    const value = resolveDecisionValue(decisions, condition);
    if (value === undefined) continue;
    // matchValueIn (배열) — 값이 배열에 포함되면 매치 (클러스터 단위 분기)
    if (condition.matchValueIn && condition.matchValueIn.includes(value)) {
      return condition.stageIds;
    }
    // matchValue (단일) — 정확히 일치 시 매치
    if (condition.matchValue !== undefined && value === condition.matchValue) {
      return condition.stageIds;
    }
  }

  return stage.nextStageIds;
}

export function buildRoadmapState(
  baseRoadmap: Omit<RoadmapState, "progressPercent" | "currentStageId" | "completedStageIds" | "unlockedStageIds">,
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap
): RoadmapState {
  const unlockedStageIds = new Set<string>();

  if (baseRoadmap.stages.length > 0) {
    unlockedStageIds.add(baseRoadmap.stages[0].stageId);
  }

  const completedStageIds = new Set<string>();
  // 첫 번째 단계에서 조건부 분기를 따라 도달 가능한 단계만 추적
  const reachableIds = new Set<string>();
  if (baseRoadmap.stages.length > 0) {
    reachableIds.add(baseRoadmap.stages[0].stageId);
  }

  for (const stage of baseRoadmap.stages) {
    const completion = evaluateStageCompletion(stage, decisions, tasks);

    if (completion.isComplete) {
      completedStageIds.add(stage.stageId);
      const nextIds = resolveNextStageIds(stage, decisions);
      for (const nextStageId of nextIds) {
        unlockedStageIds.add(nextStageId);
        // reachable 체인: 이 단계가 reachable이면 다음 단계도 reachable
        if (reachableIds.has(stage.stageId)) {
          reachableIds.add(nextStageId);
        }
      }
    }
  }

  const stageStatuses = baseRoadmap.stages.map((stage) => {
    const completion = evaluateStageCompletion(stage, decisions, tasks);
    return {
      stageId: stage.stageId,
      completion,
      status: completion.isComplete
        ? "completed"
        : unlockedStageIds.has(stage.stageId)
          ? "available"
          : "locked"
    };
  });

  const nextCurrentStageId =
    stageStatuses.find((stage) => stage.status === "available")?.stageId ??
    baseRoadmap.stages[baseRoadmap.stages.length - 1]?.stageId;

  const stages = baseRoadmap.stages.map((stage) => {
    const completion = evaluateStageCompletion(stage, decisions, tasks);
    return {
      ...stage,
      status: updateStageStatus(stage, completion, nextCurrentStageId, unlockedStageIds)
    };
  });

  const progressPercent =
    stages.length === 0 ? 0 : Math.round((completedStageIds.size / stages.length) * 100);

  return {
    ...baseRoadmap,
    currentStageId: getFirstAvailableStageId(stages, reachableIds),
    progressPercent,
    completedStageIds: Array.from(completedStageIds),
    unlockedStageIds: Array.from(unlockedStageIds),
    stages
  };
}

export function completeCurrentStage(
  roadmap: RoadmapState,
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap
): StageTransitionResult {
  const currentStage = roadmap.stages.find((stage) => stage.stageId === roadmap.currentStageId);

  if (!currentStage) {
    return {
      roadmap,
      completion: { isComplete: false, missingKeys: ["currentStage"], missingTaskIds: [] },
      nextCurrentStageId: roadmap.currentStageId,
      newlyUnlockedStageIds: []
    };
  }

  const completion = evaluateStageCompletion(currentStage, decisions, tasks);

  if (!completion.isComplete) {
    return {
      roadmap,
      completion,
      nextCurrentStageId: roadmap.currentStageId,
      newlyUnlockedStageIds: []
    };
  }

  const previousUnlocked = new Set(roadmap.unlockedStageIds);
  const nextRoadmap = buildRoadmapState(
    {
      roadmapId: roadmap.roadmapId,
      templateId: roadmap.templateId,
      stages: roadmap.stages
    },
    decisions,
    tasks
  );

  const newlyUnlockedStageIds = nextRoadmap.unlockedStageIds.filter(
    (stageId) => !previousUnlocked.has(stageId)
  );

  return {
    roadmap: nextRoadmap,
    completion,
    nextCurrentStageId: nextRoadmap.currentStageId,
    newlyUnlockedStageIds
  };
}

export function upsertStageDecision(
  decisions: WorkflowDecisionMap,
  stageId: string,
  patch: Partial<StageDecisionState>
): WorkflowDecisionMap {
  const current = decisions[stageId] ?? { stageId };

  return {
    ...decisions,
    [stageId]: {
      ...current,
      ...patch,
      inputs: {
        ...(current.inputs ?? {}),
        ...(patch.inputs ?? {})
      }
    }
  };
}

export function updateTaskStatus(
  tasks: WorkflowTaskMap,
  stageId: string,
  taskId: string,
  status: TaskState["status"]
): WorkflowTaskMap {
  const stageTasks = tasks[stageId] ?? [];

  return {
    ...tasks,
    [stageId]: stageTasks.map((task) =>
      task.taskId === taskId
        ? {
            ...task,
            status,
            // 완료 시 타임스탬프 기록, 미완료로 되돌리면 제거
            completedAt: status === "completed" ? new Date().toISOString() : undefined,
            // 미완료로 되돌리면 팔로업 응답도 리셋
            followupAnswered: status === "completed" ? task.followupAnswered : undefined,
          }
        : task
    )
  };
}
