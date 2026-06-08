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

  // inputs 는 unknown 으로 완화됐지만, completion rule 은 primitive/배열만 평가.
  // nested 객체 값(예: hiring-setup.staffPlan)은 rule 매칭 대상에서 제외.
  const raw = decision.inputs?.[key];
  if (raw == null) return undefined;
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") return raw;
  if (Array.isArray(raw) && raw.every((it) => typeof it === "string")) return raw as string[];
  return undefined;
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

// zombie/타 cluster 경고를 단계당 1회만 — 콘솔 도배 방지(세션 단위).
const warnedZombieStages = new Set<string>();

export function resolveNextStageIds(
  stage: RoadmapStageState,
  decisions: WorkflowDecisionMap
): string[] {
  if (!stage.nextStageConditions || stage.nextStageConditions.length === 0) {
    return stage.nextStageIds;
  }

  // 모든 condition 의 decisionKey 가 decisions 에 존재하는지 사전 확인.
  // 하나라도 *값이 존재* 하지만 매칭 안 됐다면 default 사용 (정상 분기 실패).
  // 모든 condition 의 *값이 모두 undefined* 라면 → decisions 누락 (zombie state).
  // → 이 경우 default 로 fall through 시 cluster 무관 path 끝(예: financial-review)으로
  //    잘못 점프하는 사고가 발생함 (2026-05-18 사장님 신고).
  let anyValueFound = false;
  for (const condition of stage.nextStageConditions) {
    const value = resolveDecisionValue(decisions, condition);
    if (value !== undefined) {
      anyValueFound = true;
      if (condition.matchValueIn && condition.matchValueIn.includes(value)) {
        return condition.stageIds;
      }
      if (condition.matchValue !== undefined && value === condition.matchValue) {
        return condition.stageIds;
      }
    }
  }

  if (!anyValueFound) {
    // zombie decisions — 조건 평가에 필요한 어떤 decision 도 set 안 됨.
    // default nextStageIds 로 fall through 하면 cluster 무관 잘못된 path 로 점프 가능.
    // 콘솔 경고로 진단 가능 + 호출처가 *path 의 직계 다음 stage* 를 별도 추정해야 한다는 신호.
    // 빈 배열 반환 시 traverseUserPath / buildRoadmapState 는 path 종료로 인식.
    // 호출처는 useTaskHandlers.handleStageContinue 의 sanity-check fallback 으로 처리.
    // ⚠️ buildRoadmapState 는 *전 단계*를 평가하므로, 사용자 cluster 와 무관한 단계
    //   (예: 음식 사용자에게 startup 단계 mvp-build)는 매번 여기로 와 콘솔을 도배한다.
    //   default fallback 으로 안전하게 처리되는 정상 동작이므로, 단계당 1회만 경고(노이즈 억제).
    if (typeof console !== "undefined" && !warnedZombieStages.has(stage.stageId)) {
      warnedZombieStages.add(stage.stageId);
      console.warn(
        `[resolveNextStageIds] stage "${stage.stageId}" 의 모든 nextStageConditions 매칭 실패 — decisions zombie 가능성(또는 타 cluster 단계). default fallback 사용.`,
        { conditions: stage.nextStageConditions.map((c) => `${c.decisionStageId}.${c.decisionKey}`) },
      );
    }
    // default 유지 (path 진행은 일단 보장) — 호출처에서 *큰 점프 sanity check* 로 차단.
    return stage.nextStageIds;
  }

  return stage.nextStageIds;
}

/**
 * 2026-05-12 P3: 사용자 path 의 *실제 순서* 를 graph traversal 로 계산.
 *
 *  ── 왜 필요한가 ────────────────────────────────────────────────
 *  종전 useComputedDashboard 의 pathStageList 는 `roadmap.stages.filter(isPath)`
 *  로 계산됐는데, 이건 *배열 순서* 를 반환할 뿐 *navigation 순서* 가 아니었음.
 *  같은 stage 가 cluster 별로 다른 위치에서 방문될 수 있는데(예: biz-registration
 *  은 offline 에선 #9, online 에선 #7, startup 에선 #16) 배열 순서는 한 가지만
 *  반영하므로 다른 path 의 사장님께 *틀린 pathStepNumber* 표시되던 문제.
 *
 *  ── 동작 ────────────────────────────────────────────────────────
 *  1. 첫 stage (industry-selection) 에서 시작
 *  2. nextStageConditions 우선 → nextStageIds[0] fallback 으로 다음 stage 선택
 *  3. isPathStage(stageId) 가 true 인 것만 결과에 push (사용자 path 에 보이는 것)
 *  4. 사이클·반복 방문 차단 (visited Set)
 *  ────────────────────────────────────────────────────────────────
 */
export function traverseUserPath(
  stages: RoadmapStageState[],
  decisions: WorkflowDecisionMap,
  isPathStage: (stageId: string) => boolean,
): RoadmapStageState[] {
  if (stages.length === 0) return [];
  const stageById = new Map(stages.map((s) => [s.stageId, s]));
  const visited = new Set<string>();
  const result: RoadmapStageState[] = [];

  let current: RoadmapStageState | undefined = stages[0];
  while (current && !visited.has(current.stageId)) {
    visited.add(current.stageId);
    if (isPathStage(current.stageId)) {
      result.push(current);
    }
    // 다음 stage 결정 — 조건부 우선, 없으면 default nextStageIds[0]
    const nextIds = resolveNextStageIds(current, decisions);
    if (nextIds.length === 0) break;

    // 첫 번째 *path 에 속하는* 다음 stage 를 선택 (hidden stage skip).
    // 예: tax-guide.nextStageConditions 가 offline → hiring-setup 인데
    // user 가 online 이면 default → loan-guide. 어느 쪽이든 isPathStage 통과한 첫 stage.
    let next: RoadmapStageState | undefined;
    for (const id of nextIds) {
      const candidate = stageById.get(id);
      if (candidate) { next = candidate; break; }
    }
    current = next;
  }

  return result;
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

  // ⚠️ path-aware currentStageId: stages[0] 에서 출발해 nextStageIds 따라가며 *첫 미완료* stage 선택.
  // 종전엔 baseRoadmap.stages.find((s) => s.status === "available") 로 *배열 순서* 의 첫 available 을
  // 잡았는데, 이건 cluster·path 와 무관한 순서라 사용자가 8단계 완료 후 "다음" 을 누르면 배열상
  // 앞쪽의 다른 available (예: 15단계) 로 점프하던 버그. resolveNextStageIds 가 nextStageConditions
  // + decisions 를 따라가므로 user 가 실제로 navigate 할 다음 stage 가 정확히 잡힌다.
  const completedSet = completedStageIds;
  const nextCurrentStageId = (() => {
    if (baseRoadmap.stages.length === 0) return "";
    const stageById = new Map(baseRoadmap.stages.map((s) => [s.stageId, s]));
    const seen = new Set<string>();
    let cursor: RoadmapStageState | undefined = baseRoadmap.stages[0];
    while (cursor && !seen.has(cursor.stageId)) {
      seen.add(cursor.stageId);
      if (!completedSet.has(cursor.stageId)) return cursor.stageId;
      const nextIds = resolveNextStageIds(cursor, decisions);
      if (nextIds.length === 0) break;
      let next: RoadmapStageState | undefined;
      for (const id of nextIds) {
        const candidate = stageById.get(id);
        if (candidate) { next = candidate; break; }
      }
      cursor = next;
    }
    // 모든 path stage 가 완료된 경우 → 마지막 도달 stage 또는 path-aware fallback
    return cursor?.stageId
      ?? stageStatuses.find((s) => s.status === "available" && reachableIds.has(s.stageId))?.stageId
      ?? baseRoadmap.stages[baseRoadmap.stages.length - 1]?.stageId
      ?? "";
  })();

  const stages = baseRoadmap.stages.map((stage) => {
    const completion = evaluateStageCompletion(stage, decisions, tasks);
    return {
      ...stage,
      status: updateStageStatus(stage, completion, nextCurrentStageId, unlockedStageIds)
    };
  });

  // ⚠️ path-aware: progressPercent는 reachable(사용자 path) stage 기준으로 계산
  // 이전엔 stages.length(전체 ~46개) 기준이라 online 셀러가 9/9 완료해도 ~27% 표시되는 버그.
  const reachableTotal = reachableIds.size;
  const reachableCompleted = Array.from(completedStageIds).filter((id) => reachableIds.has(id)).length;
  const progressPercent =
    reachableTotal === 0 ? 0 : Math.round((reachableCompleted / reachableTotal) * 100);

  // ⚠️ path-aware totalSteps: 각 stage 의 totalSteps 를 reachable 카운트로 덮어씀.
  // 이전엔 totalSteps:14 가 하드코딩되어 사장님 화면에 항상 "14단계 중 X" 표시되었으나,
  // 실제 path 길이는 cluster 별로 다름 (offline=15, online=12, startup-tech=14, semiconductor=22 등).
  // path-aware 카운트로 사장님이 본인 path 의 정확한 단계 수를 봄.
  const stagesWithCorrectTotal = stages.map((stage) =>
    reachableIds.has(stage.stageId)
      ? { ...stage, totalSteps: reachableTotal }
      : stage,
  );

  return {
    ...baseRoadmap,
    // path-aware nextCurrentStageId 를 사용 — getFirstAvailableStageId 는 배열 순서를 따르므로 path 점프 버그 유발
    currentStageId: nextCurrentStageId,
    progressPercent,
    completedStageIds: Array.from(completedStageIds),
    unlockedStageIds: Array.from(unlockedStageIds),
    stages: stagesWithCorrectTotal,
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
