import type { SupabaseClient, User } from "@supabase/supabase-js";
import { buildRoadmapState } from "../roadmap/workflow";
import {
  starterDecisionMap,
  starterRoadmap,
  starterStageFlow,
  starterTaskMap
} from "../starter-data";
import type {
  RoadmapState,
  StageDecisionState,
  TaskState,
  UserBusinessProfile,
  WorkflowDecisionMap,
  WorkflowTaskMap
} from "../types/roadmap";

type Client = SupabaseClient;

export type PersistedRoadmapState = {
  roadmap: RoadmapState;
  decisions: WorkflowDecisionMap;
  tasks: WorkflowTaskMap;
};

const baseRoadmap = {
  roadmapId: starterRoadmap.roadmapId,
  templateId: starterRoadmap.templateId,
  stages: starterStageFlow
};

type RoadmapRow = {
  id: string;
  user_id: string;
  template_id: string;
  current_stage_code: string;
  progress_percent: number;
  status: string;
};

export type BootstrappedWorkspace = {
  user: User;
  state: PersistedRoadmapState;
  isNew: boolean;
};

type BusinessProfileRow = {
  user_id: string;
  industry_category_id?: string | null;
  sub_industry_id?: string | null;
  selected_specialty_id?: string | null;
  startup_type?: "franchise" | "independent" | "undecided" | null;
  business_model_id?: string | null;
  capital?: number | null;
  target_open_date?: string | null;
  preferred_regions?: string[] | null;
  target_customer_types?: string[] | null;
  location_priorities?: string[] | null;
};

export type PersistedBusinessProfile = UserBusinessProfile;

/**
 * 현재 로그인 사용자 조회.
 *
 *  ⚠️ CRITICAL (2026-05-11, 사장님 신고: "로그인을 2번 해야 운영 대시보드가 보임"):
 *
 *   종전 구현: `auth.getUser()` 만 호출. 이건 supabase auth 서버로 *네트워크 호출* 해서
 *     JWT 검증. Vercel cold start / 라우팅 직후 네트워크 호출이 일시적으로 null 반환 →
 *     사장님이 로그인 직후 /auth 로 다시 튕김 → 한번 더 로그인해야 메인 진입.
 *
 *   수정: 1단계로 `auth.getSession()` (로컬 localStorage 동기 읽기, 네트워크 X) 호출.
 *         session 있고 JWT 만료 안 됐으면 그 안의 user 반환 — 네트워크 의존 0.
 *         session 없거나 만료된 경우만 `getUser()` 로 폴백.
 *
 *   결과: 로그인 직후 cookie 가 localStorage 에 set 되면 즉시 user 인식. race condition 차단.
 */
export async function getCurrentUser(client: Client): Promise<User | null> {
  // 1단계 — 로컬 세션 (네트워크 X). 로그인 직후엔 항상 이걸로 잡힘.
  const { data: { session } } = await client.auth.getSession();
  if (session?.user) {
    // JWT 만료 검사 — 만료됐거나 60초 내 만료 임박이면 다음 단계로 (강제 refresh).
    // ⚠️ 2026-06-05 보안: 버퍼 없이 expiresAt>now 만 보면 만료 직전 토큰으로 통과 → 직후
    //   첫 쓰기(autosave/saveStoreData)가 401. autoRefresh 가 따라잡기 전 race 방지용 60초 버퍼.
    const expiresAt = session.expires_at; // unix seconds
    const nowSec = Math.floor(Date.now() / 1000);
    if (!expiresAt || expiresAt > nowSec + 60) {
      return session.user;
    }
  }

  // 2단계 — 세션 없거나 만료. auth 서버 호출 (refresh + verify).
  const { data: { user } } = await client.auth.getUser();
  return user;
}

// ⚠️ 익명 인증(`signInAnonymously`) 은 *기기별 user_id* 가 발급돼 모바일·웹·다른 도메인에서
//    같은 데이터에 접근 불가능. 의도적으로 제거됨 (2026-05-09). 모든 진입은 ensureAccountUser
//    (이메일·비밀번호 영구 계정) 만 사용. 같은 이메일로 어디서 로그인하든 동일 user_id.
export async function ensureAccountUser(client: Client): Promise<User> {
  const user = await getCurrentUser(client);

  if (!user || user.is_anonymous) {
    throw new Error("AUTH_REQUIRED");
  }

  return user;
}

function serializeDecisions(decisions: WorkflowDecisionMap, roadmapId: string) {
  return Object.values(decisions)
    .filter((decision): decision is StageDecisionState => Boolean(decision))
    .map((decision) => ({
      roadmap_id: roadmapId,
      stage_code: decision.stageId,
      selected_primary_option_id: decision.selectedPrimaryOptionId ?? null,
      selected_option_ids: decision.selectedOptionIds ?? [],
      inputs: (decision.inputs ?? {}) as Record<string, string | number | boolean | string[] | null>,
      notes: decision.notes ?? null,
      completed_at: decision.completedAt ?? null
    }));
}

function serializeTasks(tasks: WorkflowTaskMap, roadmapId: string) {
  return Object.entries(tasks).flatMap(([stageCode, stageTasks]) =>
    stageTasks.map((task) => ({
      roadmap_id: roadmapId,
      stage_code: stageCode,
      task_code: task.taskId,
      title: task.title,
      status: task.status,
      required: task.required,
      estimated_minutes: task.estimatedMinutes ?? null
    }))
  );
}

function hydrateDecisions(
  rows: Array<Record<string, any>>
): WorkflowDecisionMap {
  return rows.reduce<WorkflowDecisionMap>((acc, row) => {
    acc[row.stage_code] = {
      stageId: row.stage_code,
      selectedPrimaryOptionId: row.selected_primary_option_id ?? undefined,
      selectedOptionIds: row.selected_option_ids ?? undefined,
      inputs: (row.inputs as StageDecisionState["inputs"]) ?? undefined,
      notes: row.notes ?? undefined,
      completedAt: row.completed_at ?? undefined
    };
    return acc;
  }, {});
}

function hydrateTasks(
  rows: Array<Record<string, any>>
): WorkflowTaskMap {
  const grouped: WorkflowTaskMap = {};

  for (const row of rows) {
    if (!grouped[row.stage_code]) {
      grouped[row.stage_code] = [];
    }

    grouped[row.stage_code].push({
      taskId: row.task_code,
      title: row.title,
      status: row.status as TaskState["status"],
      required: row.required,
      estimatedMinutes: row.estimated_minutes ?? undefined
    });
  }

  return {
    ...starterTaskMap,
    ...grouped
  };
}

function createStarterWorkspaceState(roadmapId = starterRoadmap.roadmapId): PersistedRoadmapState {
  return {
    roadmap: buildRoadmapState(
      {
        ...baseRoadmap,
        roadmapId
      },
      starterDecisionMap,
      starterTaskMap
    ),
    decisions: starterDecisionMap,
    tasks: starterTaskMap
  };
}

async function getLatestRoadmapRow(client: Client, userId: string): Promise<RoadmapRow | null> {
  const { data, error } = await client
    .from("roadmaps")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as RoadmapRow | null;
}

async function ensureBusinessProfile(client: Client, user: User) {
  const { error } = await client.from("business_profiles").upsert(
    {
      user_id: user.id
    },
    {
      onConflict: "user_id"
    }
  );

  if (error) {
    throw error;
  }
}

function extractStringList(inputs: StageDecisionState["inputs"] | undefined, key: string) {
  const candidate = inputs?.[key];

  return Array.isArray(candidate) ? candidate.filter((item): item is string => typeof item === "string") : undefined;
}

function buildProfilePatchFromState(
  userId: string,
  decisions: WorkflowDecisionMap
): BusinessProfileRow {
  const industryDecision = decisions["industry-selection"];
  const startupTypeDecision = decisions["startup-type"];
  const businessModelDecision = decisions["business-model"];
  const budgetDecision = decisions["budget-setup"];
  const locationDecision = decisions["location-candidates"];

  const capitalValue = budgetDecision?.inputs?.capital;
  const targetOpenDateValue = budgetDecision?.inputs?.targetOpenDate;
  const startupTypeValue =
    startupTypeDecision?.selectedPrimaryOptionId ?? startupTypeDecision?.inputs?.startupType;

  // ⚠️ writers (useSelectionHandlers·useOnboardingHandlers)는 `inputs.categoryId`로 저장.
  // 과거 코드는 `industryCategoryId`로 잘못 읽어 항상 NULL이 저장됨 (백워드 호환 위해 둘 다 시도).
  const industryCategoryId =
    typeof industryDecision?.inputs?.categoryId === "string"
      ? industryDecision.inputs.categoryId
      : typeof industryDecision?.inputs?.industryCategoryId === "string"
        ? industryDecision.inputs.industryCategoryId
        : null;

  // specialty(세부업종): industry-selection 의 inputs.specialtyId 에 저장됨.
  //   useSelectionHandlers.handleIndustryContinue 에서 selectedSpecialtyId 를 inputs 에 포함.
  //   specialty 분기가 없는 industry 는 null.
  const selectedSpecialtyId =
    typeof industryDecision?.inputs?.specialtyId === "string" && industryDecision.inputs.specialtyId.length > 0
      ? industryDecision.inputs.specialtyId
      : null;

  return {
    user_id: userId,
    industry_category_id: industryCategoryId,
    sub_industry_id:
      industryDecision?.selectedPrimaryOptionId ??
      (typeof industryDecision?.inputs?.subIndustryId === "string"
        ? industryDecision.inputs.subIndustryId
        : null),
    selected_specialty_id: selectedSpecialtyId,
    startup_type:
      startupTypeValue === "franchise" ||
      startupTypeValue === "independent" ||
      startupTypeValue === "undecided"
        ? startupTypeValue
        : null,
    business_model_id: businessModelDecision?.selectedPrimaryOptionId ?? null,
    capital: typeof capitalValue === "number" ? capitalValue : null,
    target_open_date: typeof targetOpenDateValue === "string" ? targetOpenDateValue : null,
    // ⚠ 빈 문자열 가드: typeof "" === "string" 이라 trim 없이는 [""] 가 저장돼
    //   useDataLoading 의 contractor 검색 useEffect (`if (!preferredRegion) return`) 가
    //   조용히 early-return → 인테리어 업체가 검색되지 않는 버그가 발생함.
    preferred_regions: (() => {
      const inputRegion =
        typeof locationDecision?.inputs?.preferredRegion === "string"
          ? locationDecision.inputs.preferredRegion.trim()
          : "";
      if (inputRegion.length > 0) return [inputRegion];
      const customName =
        typeof locationDecision?.inputs?.customMarketName === "string"
          ? locationDecision.inputs.customMarketName.trim()
          : "";
      if (customName.length > 0) return [customName];
      const finalTitle =
        typeof locationDecision?.inputs?.finalMarketTitle === "string"
          ? locationDecision.inputs.finalMarketTitle.trim()
          : "";
      if (finalTitle.length > 0) return [finalTitle];
      if (locationDecision?.selectedPrimaryOptionId) {
        return [locationDecision.selectedPrimaryOptionId];
      }
      return null;
    })(),
    target_customer_types: extractStringList(locationDecision?.inputs, "targetCustomerTypes") ?? null,
    location_priorities: extractStringList(locationDecision?.inputs, "locationPriorities") ?? null
  };
}

async function syncBusinessProfileFromState(
  client: Client,
  user: User,
  state: PersistedRoadmapState
) {
  const profilePatch = buildProfilePatchFromState(user.id, state.decisions);

  const { error } = await client.from("business_profiles").upsert(profilePatch, {
    onConflict: "user_id"
  });

  if (error) {
    throw error;
  }
}

function hydrateBusinessProfile(row: BusinessProfileRow | null): PersistedBusinessProfile | null {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    industryCategoryId: row.industry_category_id ?? undefined,
    subIndustryId: row.sub_industry_id ?? undefined,
    selectedSpecialtyId: row.selected_specialty_id ?? undefined,
    startupType: row.startup_type ?? undefined,
    businessModelId: row.business_model_id ?? undefined,
    capital: row.capital ?? undefined,
    targetOpenDate: row.target_open_date ?? undefined,
    preferredRegions: row.preferred_regions ?? undefined,
    targetCustomerTypes: row.target_customer_types ?? undefined,
    locationPriorities: row.location_priorities ?? undefined
  };
}

export async function saveRoadmapState(
  client: Client,
  state: PersistedRoadmapState,
  userOverride?: User,
  options?: { forceReset?: boolean }
): Promise<PersistedRoadmapState> {
  const user = userOverride ?? (await ensureAccountUser(client));
  await ensureBusinessProfile(client, user);
  let roadmapId = state.roadmap.roadmapId;

  if (roadmapId === starterRoadmap.roadmapId) {
    const existingRoadmap = await getLatestRoadmapRow(client, user.id);

    roadmapId = existingRoadmap?.id ?? roadmapId;
  }

  const roadmapPayload = {
    user_id: user.id,
    template_id: state.roadmap.templateId,
    current_stage_code: state.roadmap.currentStageId,
    progress_percent: state.roadmap.progressPercent,
    status: "in_progress",
    updated_at: new Date().toISOString()
  };

  let { data: roadmapRow, error: roadmapError } = await client
    .from("roadmaps")
    .upsert(
      { ...(roadmapId === starterRoadmap.roadmapId ? {} : { id: roadmapId }), ...roadmapPayload },
      { onConflict: "id" }
    )
    .select()
    .single();

  // ⚠️ 2026-06-05: roadmaps.unique(user_id)(20260604 마이그레이션) 도입으로, 신규 INSERT 가
  //   웹·다른 기기와의 레이스에서 user_id 중복(23505)으로 실패할 수 있다. 그 경우 이미 만들어진
  //   row 를 재조회해 그 id 로 UPDATE 재시도(중복 생성 대신 공유) — 가입/진행저장 실패 방지.
  if (roadmapError && (roadmapError as { code?: string }).code === "23505") {
    const existing = await getLatestRoadmapRow(client, user.id);
    if (existing?.id) {
      ({ data: roadmapRow, error: roadmapError } = await client
        .from("roadmaps")
        .upsert({ id: existing.id, ...roadmapPayload }, { onConflict: "id" })
        .select()
        .single());
    }
  }

  if (roadmapError || !roadmapRow) {
    throw roadmapError ?? new Error("Failed to upsert roadmap.");
  }

  const decisionPayload = serializeDecisions(state.decisions, roadmapRow.id);
  const taskPayload = serializeTasks(state.tasks, roadmapRow.id);

  // ⚠️ 데이터 유실 방지 가드 (2026-04-21 추가, 2026-04-27 forceReset 옵션 추가)
  // 기존에 발생한 심각한 버그: 빈 decisions/tasks 상태가 autosave 레이스로 Supabase에 반영되어
  // 18/18 완료된 유저의 로드맵이 0단계로 리셋되는 문제.
  //
  // 규칙:
  //   - payload가 비어 있을 때(delete만 일어나는 상황)는 DB에 기존 row가 있는지 먼저 확인.
  //   - DB에 기존 진행 상태가 존재하면 이 save를 전체 skip → 자동 race 가 기존 진행을 덮어쓰는 것을 차단.
  //   - payload에 내용이 있다면 정상적으로 delete → insert 수행.
  //   - 단, 사용자가 명시적으로 reset 한 경우 (forceReset=true) 는 가드 우회 + DB 비우기.
  //     (이 가드가 reset 도 막아서 "초기화 후에도 20단계 완료 상태로 복구되는" 버그 발생했었음)
  if (decisionPayload.length === 0 && taskPayload.length === 0) {
    if (options?.forceReset) {
      // 명시적 reset: 기존 decisions / tasks 강제 DELETE
      await Promise.all([
        client.from("stage_decisions").delete().eq("roadmap_id", roadmapRow.id),
        client.from("stage_tasks").delete().eq("roadmap_id", roadmapRow.id),
      ]);
      await syncBusinessProfileFromState(client, user, state);
      return {
        ...state,
        roadmap: { ...state.roadmap, roadmapId: roadmapRow.id }
      };
    }
    const [{ count: existingDecisions }, { count: existingTasks }] = await Promise.all([
      client.from("stage_decisions").select("*", { count: "exact", head: true }).eq("roadmap_id", roadmapRow.id),
      client.from("stage_tasks").select("*", { count: "exact", head: true }).eq("roadmap_id", roadmapRow.id)
    ]);
    if ((existingDecisions ?? 0) > 0 || (existingTasks ?? 0) > 0) {
      // 기존 진행 상태가 있는데 빈 payload로 저장하려는 상황 → 절대 덮어쓰지 않음
      await syncBusinessProfileFromState(client, user, state);
      return {
        ...state,
        roadmap: { ...state.roadmap, roadmapId: roadmapRow.id }
      };
    }
  }

  // 기존 rows를 먼저 삭제 후 재삽입합니다.
  // upsert만 사용하면 빈 decisions(초기화 상태)일 때 삭제가 일어나지 않아
  // 이전 진행 상태가 DB에 남는 버그가 있습니다.
  //
  // delete → insert는 원자적이지 않으므로, insert 실패 시 재삽입을 시도합니다.
  if (decisionPayload.length > 0) {
    const { error: deleteDecisionsError } = await client
      .from("stage_decisions")
      .delete()
      .eq("roadmap_id", roadmapRow.id);

    if (deleteDecisionsError) {
      throw deleteDecisionsError;
    }

    const { error } = await client.from("stage_decisions").insert(decisionPayload);

    if (error) {
      // 삭제 후 insert 실패 — 데이터 유실 방지를 위해 한번 더 시도
      const { error: retryError } = await client.from("stage_decisions").insert(decisionPayload);
      if (retryError) throw retryError;
    }
  }

  if (taskPayload.length > 0) {
    const { error: deleteTasksError } = await client
      .from("stage_tasks")
      .delete()
      .eq("roadmap_id", roadmapRow.id);

    if (deleteTasksError) {
      throw deleteTasksError;
    }

    const { error } = await client.from("stage_tasks").insert(taskPayload);

    if (error) {
      const { error: retryError } = await client.from("stage_tasks").insert(taskPayload);
      if (retryError) throw retryError;
    }
  }

  // ⚠️ business_profiles 동기화 실패는 ROADMAP 저장을 망가뜨리면 안 됨.
  //   사용자 보고 (2026-05-03): business_profiles 400 (= 마이그레이션 미적용 컬럼 등) 에서
  //   throw 하면, stage_decisions/stage_tasks 는 이미 위에서 INSERT 완료된 상태인데
  //   호출자(autosave Promise.all) 가 saveRoadmapState 실패로 인지 → 다음 새로고침 시
  //   "저장 안 된 줄" 알고 사용자가 회귀로 인식. 실제론 progress 는 저장됐음.
  //   → profile sync 실패는 콘솔 1회만 경고하고 silently 통과.
  try {
    await syncBusinessProfileFromState(client, user, state);
  } catch (profileErr) {
    // eslint-disable-next-line no-console
    console.warn(
      "[saveRoadmapState] business_profiles sync failed (non-fatal — roadmap data already persisted):",
      profileErr instanceof Error ? profileErr.message : profileErr,
    );
  }

  return {
    ...state,
    roadmap: {
      ...state.roadmap,
      roadmapId: roadmapRow.id
    }
  };
}

export async function loadRoadmapState(client: Client): Promise<PersistedRoadmapState | null> {
  const user = await ensureAccountUser(client);
  const roadmapRow = await getLatestRoadmapRow(client, user.id);

  if (!roadmapRow) {
    return null;
  }

  const [{ data: decisionRows, error: decisionError }, { data: taskRows, error: taskError }] =
    await Promise.all([
      client.from("stage_decisions").select("*").eq("roadmap_id", roadmapRow.id),
      client.from("stage_tasks").select("*").eq("roadmap_id", roadmapRow.id)
    ]);

  if (decisionError) {
    throw decisionError;
  }

  if (taskError) {
    throw taskError;
  }

  const decisions = hydrateDecisions(decisionRows ?? []);
  const tasks = hydrateTasks(taskRows ?? []);
  const roadmap = buildRoadmapState(
    {
      roadmapId: roadmapRow.id,
      templateId: roadmapRow.template_id,
      stages: starterStageFlow
    },
    decisions,
    tasks
  );

  return {
    roadmap,
    decisions,
    tasks
  };
}

export async function loadBusinessProfile(
  client: Client,
  userOverride?: User
): Promise<PersistedBusinessProfile | null> {
  const user = userOverride ?? (await ensureAccountUser(client));
  const { data, error } = await client
    .from("business_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return hydrateBusinessProfile((data as BusinessProfileRow | null) ?? null);
}

export async function bootstrapWorkspace(client: Client): Promise<BootstrappedWorkspace> {
  const user = await ensureAccountUser(client);
  await ensureBusinessProfile(client, user);

  const persisted = await loadRoadmapState(client);

  if (persisted) {
    return {
      user,
      state: persisted,
      isNew: false
    };
  }

  const saved = await saveRoadmapState(client, createStarterWorkspaceState(), user);

  return {
    user,
    state: saved,
    isNew: true
  };
}

// ─── AI 보고서 인사이트 캐시 ──────────────────────────────────────────────────

function makeSnapshotHash(revenue: number, costs: number, primeCostPct: number | null): string {
  return `${Math.round(revenue)}_${Math.round(costs)}_${primeCostPct ?? "null"}`;
}

export async function getReportInsightCache(
  client: Client,
  userId: string,
  period: string,
  periodKey: string,
  snapshotHash: string
): Promise<string | null> {
  const { data, error } = await client
    .from("ai_report_insights")
    .select("insight, snapshot_hash, expires_at")
    .eq("user_id", userId)
    .eq("period", period)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (error || !data) return null;

  const isExpired = new Date(data.expires_at) < new Date();
  if (isExpired) return null;

  if (data.snapshot_hash !== snapshotHash) return null;

  return data.insight as string;
}

export async function setReportInsightCache(
  client: Client,
  userId: string,
  period: string,
  periodKey: string,
  snapshotHash: string,
  insight: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await client.from("ai_report_insights").upsert(
    {
      user_id: userId,
      period,
      period_key: periodKey,
      snapshot_hash: snapshotHash,
      insight,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "user_id,period,period_key" }
  );
}

export { makeSnapshotHash };

export async function bootstrapAccountWorkspace(client: Client): Promise<BootstrappedWorkspace> {
  const user = await ensureAccountUser(client);
  await ensureBusinessProfile(client, user);

  const persisted = await loadRoadmapState(client);

  if (persisted) {
    return {
      user,
      state: persisted,
      isNew: false
    };
  }

  const saved = await saveRoadmapState(client, createStarterWorkspaceState(), user);

  return {
    user,
    state: saved,
    isNew: true
  };
}
