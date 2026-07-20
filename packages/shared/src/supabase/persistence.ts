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

/**
 * orphan 삭제 가드 윈도우 (ms).
 *
 * ⚠️ 2026-06-10 P1-2 (정합성·동시성): 웹 autosave 의 "upsert + delete-orphans" 는 이번 payload 에
 *   *없는* stage_code/task_code row 를 orphan 으로 보고 지운다. 하지만 웹의 realtime 재조회는
 *   5초 throttle(usePersistence.ts onRemote) 이라, iOS 가 방금 새로 만든 단계 row 를 웹 로컬 상태가
 *   아직 모르는 사이 그 단계를 orphan 으로 *오인* 해 삭제 → iOS 진행 유실의 레이스 윈도우가 있다.
 *
 *   가드: 삭제 후보 row 의 updated_at 이 이 윈도우 내(=다른 기기가 방금 썼을 가능성)면 삭제 제외.
 *   - iOS RoadmapDecisionsRepository.upsert · 웹 saveRoadmapState 의 stage upsert **둘 다**
 *     매 저장 시 updated_at=now 를 명시 기록한다(2026-06-20: 웹도 기록하도록 통일).
 *     종전엔 웹이 안 찍어 웹↔웹 에서 가드가 무력 → A 가 완료한 단계를 B 의 stale payload 가
 *     고아삭제하던 race(G2). 이제 모든 기기가 updated_at 을 찍어 대칭적으로 서로의 최신 쓰기를 보호.
 *   - orphan 후보는 "이번 payload 에 없는 단계" 뿐이라, 방금 stamp 된 in-payload 단계는 후보가 아님
 *     → 자기 활동 오탐 없음(타 기기 보호만 강화).
 *
 *   트레이드오프: 사용자가 *경로를 바꿔* 더는 유효하지 않은 단계라도, 그게 직전 N분 내 (다른 기기에서)
 *     갱신됐다면 이번 save 에선 안 지워진다. 그러나 그 row 는 더 이상 어떤 기기도 payload 에 포함하지
 *     않으므로 updated_at 이 더는 갱신되지 않고, N분 경과 후 다음 save 에서 자연 정리된다 (영구 누적 없음).
 *   윈도우 길이: realtime throttle(5s) + 재조회 왕복 여유를 충분히 덮도록 2분.
 */
const ORPHAN_DELETE_GUARD_MS = 2 * 60 * 1000;

/**
 * orphan 삭제 후보 중 *최근 갱신된 row 의 키* 를 골라낸다 (다른 기기 동시 쓰기 보호).
 * updated_at 이 없거나 파싱 불가하면 보수적으로 "최근" 으로 간주해 보존 (삭제하지 않음).
 */
function recentlyTouchedKeys<K extends string>(
  rows: Array<Record<string, unknown>>,
  keyField: K,
  now: number = Date.now()
): Set<string> {
  const recent = new Set<string>();
  for (const row of rows) {
    const key = row[keyField];
    if (typeof key !== "string") continue;
    const rawUpdatedAt = row.updated_at;
    if (typeof rawUpdatedAt !== "string") {
      // updated_at 누락 — 알 수 없으므로 보존 측으로 (데이터 유실 방지 우선).
      recent.add(key);
      continue;
    }
    const ts = Date.parse(rawUpdatedAt);
    if (Number.isNaN(ts)) {
      recent.add(key);
      continue;
    }
    if (now - ts < ORPHAN_DELETE_GUARD_MS) {
      recent.add(key);
    }
  }
  return recent;
}

export { ORPHAN_DELETE_GUARD_MS, recentlyTouchedKeys };

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

/**
 * 업종 전환 purge — 사장님이 업종(세부업종)을 *다른 것으로* 바꿔 확정했을 때,
 * 이전 업종의 로드맵 진행(stage_decisions·stage_tasks)을 서버에서 즉시 전부 삭제한다.
 *
 * 왜 전부: stageId 가 업종 간 공유(biz-registration·tax-guide 등)라, 이전 업종의
 * completedAt 이 새 path 의 강신호가 되어 heal 이 사이 단계를 통째로 완료 처리하고
 * (재현: 외식 → b2b-saas 전환 시 미열람 9단계 자동완료·94%), inputs 잔재(permitType·
 * specialtyId·franchiseBrandId)가 새 업종에 오염된다. 사장님 결정(2026-07-21):
 * "업종이 달라지면 정보도 달라지므로 전부 삭제" — 선택 무효화가 아닌 전체 삭제.
 *
 * orphan-delete 의 최근-갱신 보호 가드(ORPHAN_DELETE_GUARD_MS)를 *의도적으로* 우회한다
 * (방금 완료한 단계일수록 오염원). industry-selection 행도 지운다 — 남기면 옛 inputs 를
 * 가진 행이 잔존하고, 새 선택은 직후 autosave(800ms) 가 fresh 하게 재-upsert 한다.
 * roadmaps.updated_at bump 로 realtime 메시를 태워 다른 기기(웹·iOS)가 즉시 재조회한다.
 *
 * 운영 데이터(user_store_data·매출·직원 등)는 건드리지 않는다 — 그건 "진행 초기화" 영역.
 */
export async function purgeRoadmapProgressForIndustrySwitch(
  client: Client,
  userId: string
): Promise<void> {
  const row = await getLatestRoadmapRow(client, userId);
  if (!row?.id) return;
  const [{ error: decErr }, { error: taskErr }] = await Promise.all([
    client.from("stage_decisions").delete().eq("roadmap_id", row.id),
    client.from("stage_tasks").delete().eq("roadmap_id", row.id),
  ]);
  if (decErr) throw decErr;
  if (taskErr) throw taskErr;
  const { error: bumpErr } = await client
    .from("roadmaps")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", row.id);
  if (bumpErr) throw bumpErr;
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

  // ⚠️ 2026-06-07 점검: 기존엔 delete→insert(비원자) 라, delete 성공 후 insert 가 (2회) 실패하면
  //   stage_decisions 가 통째로 비어 진행도가 소실되는 창이 있었다.
  //   → upsert(기존 row 유지하며 갱신/추가) 먼저 한 뒤, 이번 payload 에 *없는* 옛 stage 만 삭제하는
  //     "upsert + delete-orphans" 로 변경. 어느 단계에서 실패해도 기존 데이터가 사라지는 순간이 없다.
  //     (빈 payload 로 전체 비우는 경우는 위 forceReset / 빈-payload 가드가 이미 처리.)
  if (decisionPayload.length > 0) {
    // updated_at=now 명시 기록 → 다른 *웹* 기기의 orphan-delete 가드가 방금 쓴 단계를 보호.
    //   (종전엔 웹이 updated_at 을 안 찍어 웹↔웹 에서 가드가 무력 → A 가 완료한 단계를 B 의 stale
    //    payload 가 고아삭제할 수 있었음. iOS 는 이미 찍음 — 이제 웹·iOS 대칭.)
    const stampedAt = new Date().toISOString();
    const { error: upsertError } = await client
      .from("stage_decisions")
      .upsert(decisionPayload.map((dec) => ({ ...dec, updated_at: stampedAt })), { onConflict: "roadmap_id,stage_code" });
    if (upsertError) throw upsertError;

    // 이번 payload 에 없는 옛 stage_decisions 만 제거 (orphan). 실패해도 데이터 소실 아님(잔존만).
    // ⚠️ 레이스 가드 (2026-06-10 P1-2): 후보 중 최근 N분 내 갱신된 row (= iOS 등 다른 기기가 방금 쓴
    //   단계, 웹 로컬 상태가 아직 모르는) 는 삭제 제외. updated_at 도 함께 조회한다. (위 ORPHAN_DELETE_GUARD_MS)
    const keepCodes = new Set(decisionPayload.map((d) => d.stage_code));
    const { data: existingDecisionRows } = await client
      .from("stage_decisions")
      .select("stage_code,updated_at")
      .eq("roadmap_id", roadmapRow.id);
    const recentDecisionCodes = recentlyTouchedKeys(existingDecisionRows ?? [], "stage_code");
    const orphanCodes = (existingDecisionRows ?? [])
      .map((row: { stage_code: string }) => row.stage_code)
      .filter((code) => !keepCodes.has(code) && !recentDecisionCodes.has(code));
    if (orphanCodes.length > 0) {
      const { error: orphanError } = await client
        .from("stage_decisions")
        .delete()
        .eq("roadmap_id", roadmapRow.id)
        .in("stage_code", orphanCodes);
      if (orphanError) throw orphanError;
    }
  }

  if (taskPayload.length > 0) {
    const stampedAt = new Date().toISOString();
    const { error: upsertError } = await client
      .from("stage_tasks")
      .upsert(taskPayload.map((t) => ({ ...t, updated_at: stampedAt })), { onConflict: "roadmap_id,task_code" });
    if (upsertError) throw upsertError;

    // ⚠️ 레이스 가드 (2026-06-10 P1-2): decisions 와 동일 — 최근 N분 내 갱신된 task row 는 삭제 제외.
    //   (현재 stage_tasks 는 웹 전용 쓰기지만, 추후 타 기기가 쓰더라도 안전하도록 일관 적용.)
    const keepTaskCodes = new Set(taskPayload.map((t) => t.task_code));
    const { data: existingTaskRows } = await client
      .from("stage_tasks")
      .select("task_code,updated_at")
      .eq("roadmap_id", roadmapRow.id);
    const recentTaskCodes = recentlyTouchedKeys(existingTaskRows ?? [], "task_code");
    const orphanTaskCodes = (existingTaskRows ?? [])
      .map((row: { task_code: string }) => row.task_code)
      .filter((code) => !keepTaskCodes.has(code) && !recentTaskCodes.has(code));
    if (orphanTaskCodes.length > 0) {
      const { error: orphanError } = await client
        .from("stage_tasks")
        .delete()
        .eq("roadmap_id", roadmapRow.id)
        .in("task_code", orphanTaskCodes);
      if (orphanError) throw orphanError;
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
