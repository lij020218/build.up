import type {
  CompletionCheck,
  CompletionRule,
  NextStageCondition,
  RoadmapBaseState,
  RoadmapStageState,
  RoadmapState,
  StageAdvancePatch,
  TaskState,
  StageDecisionState,
  StageStatus,
  StageTransitionResult,
  TaskTransitionResult,
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
  isProgressComplete: boolean,
  currentStageId: string,
  unlockedStageIds: Set<string>
): StageStatus {
  if (isProgressComplete) {
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

function isStageProgressComplete(
  stage: RoadmapStageState,
  decisions: WorkflowDecisionMap
): boolean {
  // Roadmap navigation/progress must only move after an explicit stage advance.
  // Task/input rules can enable the "next" button, but completedAt is the durable
  // signal that the user actually pressed it.
  return Boolean(decisions[stage.stageId]?.completedAt);
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

function getFirstExistingStage(
  stageById: Map<string, RoadmapStageState>,
  stageIds: string[]
): RoadmapStageState | undefined {
  for (const id of stageIds) {
    const candidate = stageById.get(id);
    if (candidate) return candidate;
  }
  return undefined;
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
    current = getFirstExistingStage(stageById, nextIds);
  }

  return result;
}

type RoadmapProgressSets = {
  completedStageIds: Set<string>;
  unlockedStageIds: Set<string>;
  reachableIds: Set<string>;
};

type StageStatusPreview = {
  stageId: string;
  completion: CompletionCheck;
  status: StageStatus;
};

function deriveProgressSets(
  stages: RoadmapStageState[],
  decisions: WorkflowDecisionMap
): RoadmapProgressSets {
  const unlockedStageIds = new Set<string>();
  const completedStageIds = new Set<string>();
  const reachableIds = new Set<string>();

  if (stages.length > 0) {
    unlockedStageIds.add(stages[0].stageId);
    reachableIds.add(stages[0].stageId);
  }

  for (const stage of stages) {
    if (!isStageProgressComplete(stage, decisions)) continue;

    completedStageIds.add(stage.stageId);
    const nextIds = resolveNextStageIds(stage, decisions);
    for (const nextStageId of nextIds) {
      unlockedStageIds.add(nextStageId);
      if (reachableIds.has(stage.stageId)) {
        reachableIds.add(nextStageId);
      }
    }
  }

  return { completedStageIds, unlockedStageIds, reachableIds };
}

function buildStageStatusPreview(
  stages: RoadmapStageState[],
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap,
  unlockedStageIds: Set<string>
): StageStatusPreview[] {
  return stages.map((stage) => {
    const completion = evaluateStageCompletion(stage, decisions, tasks);
    const isProgressComplete = isStageProgressComplete(stage, decisions);
    return {
      stageId: stage.stageId,
      completion,
      status: isProgressComplete
        ? "completed"
        : unlockedStageIds.has(stage.stageId)
          ? "available"
          : "locked"
    };
  });
}

function findCurrentStageId(
  stages: RoadmapStageState[],
  decisions: WorkflowDecisionMap,
  completedStageIds: Set<string>,
  stageStatuses: StageStatusPreview[],
  reachableIds: Set<string>
): string {
  if (stages.length === 0) return "";

  const stageById = new Map(stages.map((stage) => [stage.stageId, stage]));
  const seen = new Set<string>();
  let cursor: RoadmapStageState | undefined = stages[0];
  while (cursor && !seen.has(cursor.stageId)) {
    seen.add(cursor.stageId);
    if (!completedStageIds.has(cursor.stageId)) return cursor.stageId;
    const nextIds = resolveNextStageIds(cursor, decisions);
    if (nextIds.length === 0) break;
    cursor = getFirstExistingStage(stageById, nextIds);
  }

  return cursor?.stageId
    ?? stageStatuses.find((stage) => stage.status === "available" && reachableIds.has(stage.stageId))?.stageId
    ?? stages[stages.length - 1]?.stageId
    ?? "";
}

function applyRuntimeStageStatus(
  stages: RoadmapStageState[],
  decisions: WorkflowDecisionMap,
  currentStageId: string,
  unlockedStageIds: Set<string>
): RoadmapStageState[] {
  return stages.map((stage) => ({
    ...stage,
    status: updateStageStatus(
      stage,
      isStageProgressComplete(stage, decisions),
      currentStageId,
      unlockedStageIds
    )
  }));
}

export function buildRoadmapState(
  baseRoadmap: RoadmapBaseState,
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap
): RoadmapState {
  const { completedStageIds, unlockedStageIds, reachableIds } = deriveProgressSets(
    baseRoadmap.stages,
    decisions
  );
  const stageStatuses = buildStageStatusPreview(
    baseRoadmap.stages,
    decisions,
    tasks,
    unlockedStageIds
  );

  // ⚠️ path-aware currentStageId: stages[0] 에서 출발해 nextStageIds 따라가며 *첫 미완료* stage 선택.
  // 종전엔 baseRoadmap.stages.find((s) => s.status === "available") 로 *배열 순서* 의 첫 available 을
  // 잡았는데, 이건 cluster·path 와 무관한 순서라 사용자가 8단계 완료 후 "다음" 을 누르면 배열상
  // 앞쪽의 다른 available (예: 15단계) 로 점프하던 버그. resolveNextStageIds 가 nextStageConditions
  // + decisions 를 따라가므로 user 가 실제로 navigate 할 다음 stage 가 정확히 잡힌다.
  const nextCurrentStageId = findCurrentStageId(
    baseRoadmap.stages,
    decisions,
    completedStageIds,
    stageStatuses,
    reachableIds
  );

  const stages = applyRuntimeStageStatus(
    baseRoadmap.stages,
    decisions,
    nextCurrentStageId,
    unlockedStageIds
  );

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

/**
 * completedAt 백필(self-heal) — 사용자의 진행 흔적(completedAt 또는 완료된 task)이 있는 stage 와,
 * 그 *path 상 앞선* stage 들에 completedAt 을 채운다. 룰 강화·task-only 토글로 completedAt 이
 * 비어 stage 가 회귀하는 것을 막는 보정.
 *
 * ⚠️ path-aware 필수: stages 배열은 starter-data 정의 순서(offline → tech → cluster → franchise →
 *    online → tail)라 **path 순서와 다르다**. resolveNextStageIds 로 사용자의 실제 path 를 따라가며
 *    backfill 한다. off-path 신호는 chain backfill 을 유발하지 않는다.
 *
 * ⚠️ 강/약 신호 구분 (2026-06-23 근본 수정): chain backfill 은 **강신호(completedAt — 명시적 advance)
 *    가장 뒤까지만** 채운다. **약신호(완료 task 만)** 는 단발/유실로 path 말단에 stray 생길 수 있어
 *    (예: pre-launch-final 의 완료 task 1개) chain 을 끌면 "모두 완료 + 마지막 단계(21) 점프" 손상이
 *    난다(usePersistence 가 결과를 Supabase 저장 → 영구화·iOS 전파). 약신호는 *현재 진행 stage*
 *    (강신호 체인 바로 다음) 자기 완료만 인정. 종전(furthest *신호*)은 약신호도 chain 을 끌어 버그.
 */
export function healCompletedAtChain(
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap,
  stages: RoadmapStageState[],
): { decisions: WorkflowDecisionMap; healed: boolean } {
  const result: WorkflowDecisionMap = { ...decisions };
  if (stages.length === 0) return { decisions: result, healed: false };

  const stageById = new Map(stages.map((s) => [s.stageId, s]));
  const healedStageIds = new Set<string>();

  // 신호 분류 (2026-06-23 근본 수정 — "외부링크 복귀 시 모두 완료 + 21단계 점프" 데이터 손상):
  //   • 강신호(completedAt 보유) — 명시적 "다음 단계로"(advance)에서만 생기는 신뢰 신호.
  //     "사용자가 여기까지 실제로 통과함"을 의미하므로 그 앞 path 단계 전부 done 으로 인정해도 안전.
  //   • 약신호(completedAt 없고 완료 task 보유) — 단발/유실로 path 말단에 stray 로 생길 수 있다
  //     (예: 꼬리 stage 의 완료 task 1개). 종전엔 강·약 신호를 똑같이 취급해 약신호 하나가
  //     path 말단(pre-launch-final=idx20)에 생기면 그 앞 0..19 전부 완료 처리 → "모두 완료 + 마지막
  //     단계 점프" 손상(usePersistence 가 그 결과를 Supabase 에 저장해 영구화·iOS 전파). → chain
  //     backfill 은 *강신호* 가장 뒤까지만, 약신호는 *현재 진행 stage*(강신호 체인 바로 다음) 자기
  //     완료만 인정한다.
  const completedAtStageIds = new Set<string>();
  const taskOnlyStageIds = new Set<string>();
  const allStageIds = new Set<string>([...Object.keys(result), ...Object.keys(tasks)]);
  for (const sid of allStageIds) {
    if (!stageById.has(sid)) continue;
    if (result[sid]?.completedAt) { completedAtStageIds.add(sid); continue; }
    if ((tasks[sid] ?? []).some((t) => t.status === "completed")) taskOnlyStageIds.add(sid);
  }
  if (completedAtStageIds.size === 0 && taskOnlyStageIds.size === 0) {
    return { decisions: result, healed: false };
  }

  // 사용자의 실제 path 순서 (resolveNextStageIds 따라 stages[0] 부터). buildRoadmapState 와 동일 walk.
  const pathOrder: string[] = [];
  {
    const seen = new Set<string>();
    let cursor: RoadmapStageState | undefined = stages[0];
    while (cursor && !seen.has(cursor.stageId)) {
      seen.add(cursor.stageId);
      pathOrder.push(cursor.stageId);
      const nextIds = resolveNextStageIds(cursor, result);
      cursor = getFirstExistingStage(stageById, nextIds);
    }
  }
  const pathIndexOf = new Map(pathOrder.map((sid, i) => [sid, i] as const));

  // path 상 가장 뒤 *강신호(completedAt)* 위치 — chain backfill 상한. off-path completedAt 은 제외
  //   (pathIndexOf 없음 → maxCompletedPathIdx 에 반영 안 됨 → chain 유발 안 함).
  let maxCompletedPathIdx = -1;
  for (const sid of completedAtStageIds) {
    const pidx = pathIndexOf.get(sid);
    if (pidx !== undefined && pidx > maxCompletedPathIdx) maxCompletedPathIdx = pidx;
  }

  const baseTime = Date.now();
  // ② path 상 furthest 강신호 이전의 모든 path stage backfill — completedAt 은 명시적 진행이라
  //    "그 지점까지 실제로 통과함" → 사이 단계가 비어 있으면 채운다(룰 강화로 유실된 completedAt 보정).
  for (let i = 0; i < maxCompletedPathIdx; i++) {
    const sid = pathOrder[i];
    if (!result[sid]?.completedAt) {
      const ts = new Date(baseTime - (maxCompletedPathIdx - i) * 1000).toISOString();
      result[sid] = { ...(result[sid] ?? { stageId: sid }), stageId: sid, completedAt: ts };
      healedStageIds.add(sid);
    }
  }
  // ⚠️ 약신호(완료 task)로는 *어떤 stage 도* 완료(completedAt) 처리하지 않는다 (2026-06-29 근본 수정).
  //    원칙: "사용자가 '다음 단계로'를 누르기 전엔 절대 자동 advance 금지" (사장님 신고: 19단계
  //    [운영·마케팅] → 누르지도 않았는데 [소프트오픈]으로 넘어감). task 완료 ≠ 단계 통과 — task 는
  //    여러 개고 1개 완료가 통과를 뜻하지 않으며, '다음 단계로'(=completedAt 강신호)만이 통과의 유일한 근거.
  //    종전 "현재 stage 약신호 자기 완료 인정" 규칙은 초기로드/인증/복귀 시 heal 이 현재 stage 에
  //    completedAt 을 주입 → 다음 stage 로 자동 advance 시키는 버그의 원인이었다. 제거함.
  //    (유실된 *통과 이력* 복구는 위 강신호 chain backfill 이 담당 — 더 뒤에 강신호가 있으면 그 앞은
  //     실제 통과한 것이므로 안전. 현재 진행 중인 stage 를 약신호로 완료시키는 일은 없어야 한다.)
  //    taskOnlyStageIds 는 이제 상단 early-return(신호 전무 시 no-op) 판정에만 쓰인다.

  return { decisions: result, healed: healedStageIds.size > 0 };
}

function backfillPriorPathStages(
  baseRoadmap: RoadmapBaseState,
  decisions: WorkflowDecisionMap,
  targetStageId: string,
  completedAt: string
): WorkflowDecisionMap {
  const stageById = new Map(baseRoadmap.stages.map((stage) => [stage.stageId, stage]));
  const pathPrior: string[] = [];
  const seen = new Set<string>();
  let cursor = baseRoadmap.stages[0];

  while (cursor && cursor.stageId !== targetStageId && !seen.has(cursor.stageId)) {
    seen.add(cursor.stageId);
    pathPrior.push(cursor.stageId);
    const next = getFirstExistingStage(stageById, resolveNextStageIds(cursor, decisions));
    if (!next) break;
    cursor = next;
  }

  if (cursor?.stageId !== targetStageId || pathPrior.length === 0) {
    return decisions;
  }

  let nextDecisions = decisions;
  for (const [index, stageId] of pathPrior.entries()) {
    if (nextDecisions[stageId]?.completedAt) continue;
    const timestamp = new Date(Date.parse(completedAt) - (pathPrior.length - index) * 1000).toISOString();
    nextDecisions = upsertStageDecision(nextDecisions, stageId, {
      stageId,
      completedAt: timestamp
    });
  }

  return nextDecisions;
}

export function markStageAdvanced(
  baseRoadmap: RoadmapBaseState,
  roadmap: RoadmapState,
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap,
  stageId: string,
  patch?: StageAdvancePatch
): StageTransitionResult {
  const targetStage = baseRoadmap.stages.find((stage) => stage.stageId === stageId);
  if (!targetStage) {
    return {
      roadmap,
      decisions,
      completion: { isComplete: false, missingKeys: ["stage"], missingTaskIds: [] },
      nextCurrentStageId: roadmap.currentStageId,
      newlyUnlockedStageIds: []
    };
  }

  const completedAt = new Date().toISOString();
  const stageDecision = upsertStageDecision(decisions, stageId, {
    stageId,
    completedAt,
    ...(patch ?? {})
  });
  const nextDecisions = backfillPriorPathStages(baseRoadmap, stageDecision, stageId, completedAt);
  const previousUnlocked = new Set(roadmap.unlockedStageIds);
  const nextRoadmap = buildRoadmapState(baseRoadmap, nextDecisions, tasks);
  const newlyUnlockedStageIds = nextRoadmap.unlockedStageIds.filter(
    (unlockedStageId) => !previousUnlocked.has(unlockedStageId)
  );

  return {
    roadmap: nextRoadmap,
    decisions: nextDecisions,
    completion: evaluateStageCompletion(targetStage, nextDecisions, tasks),
    nextCurrentStageId: nextRoadmap.currentStageId,
    newlyUnlockedStageIds
  };
}

export function toggleStageTask(
  baseRoadmap: RoadmapBaseState,
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap,
  stageId: string,
  taskId: string
): TaskTransitionResult {
  const currentTask = (tasks[stageId] ?? []).find((task) => task.taskId === taskId);
  if (!currentTask) {
    return {
      roadmap: buildRoadmapState(baseRoadmap, decisions, tasks),
      decisions,
      tasks,
      stageId,
      taskId,
      changed: false
    };
  }

  const nextTasks = updateTaskStatus(
    tasks,
    stageId,
    taskId,
    currentTask.status === "completed" ? "todo" : "completed"
  );

  return {
    roadmap: buildRoadmapState(baseRoadmap, decisions, nextTasks),
    decisions,
    tasks: nextTasks,
    stageId,
    taskId,
    changed: true
  };
}

export function advanceCurrentStageIfComplete(
  roadmap: RoadmapState,
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap
): StageTransitionResult {
  const currentStage = roadmap.stages.find((stage) => stage.stageId === roadmap.currentStageId);

  if (!currentStage) {
    return {
      roadmap,
      decisions,
      completion: { isComplete: false, missingKeys: ["currentStage"], missingTaskIds: [] },
      nextCurrentStageId: roadmap.currentStageId,
      newlyUnlockedStageIds: []
    };
  }

  const completion = evaluateStageCompletion(currentStage, decisions, tasks);

  if (!completion.isComplete) {
    return {
      roadmap,
      decisions,
      completion,
      nextCurrentStageId: roadmap.currentStageId,
      newlyUnlockedStageIds: []
    };
  }

  const transition = markStageAdvanced(
    {
      roadmapId: roadmap.roadmapId,
      templateId: roadmap.templateId,
      stages: roadmap.stages
    },
    roadmap,
    decisions,
    tasks,
    currentStage.stageId
  );

  return {
    ...transition,
    completion,
  };
}

/**
 * @deprecated Use advanceCurrentStageIfComplete for checked current-stage advances,
 * or markStageAdvanced when a user action explicitly advances a known stage.
 */
export function completeCurrentStage(
  roadmap: RoadmapState,
  decisions: WorkflowDecisionMap,
  tasks: WorkflowTaskMap
): StageTransitionResult {
  return advanceCurrentStageIfComplete(roadmap, decisions, tasks);
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
