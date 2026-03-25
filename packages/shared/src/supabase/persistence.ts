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
  sub_industry_id?: string | null;
  startup_type?: "franchise" | "independent" | "undecided" | null;
  business_model_id?: string | null;
  capital?: number | null;
  target_open_date?: string | null;
  preferred_regions?: string[] | null;
  target_customer_types?: string[] | null;
  location_priorities?: string[] | null;
};

export type PersistedBusinessProfile = UserBusinessProfile;

export async function getCurrentUser(client: Client): Promise<User | null> {
  const {
    data: { user }
  } = await client.auth.getUser();

  return user;
}

export async function ensureSignedIn(client: Client): Promise<User> {
  const user = await getCurrentUser(client);

  if (user) {
    return user;
  }

  const { data, error } = await client.auth.signInAnonymously();

  if (error || !data.user) {
    throw error ?? new Error("Anonymous sign-in failed.");
  }

  return data.user;
}

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

  return {
    user_id: userId,
    sub_industry_id:
      industryDecision?.selectedPrimaryOptionId ??
      (typeof industryDecision?.inputs?.subIndustryId === "string"
        ? industryDecision.inputs.subIndustryId
        : null),
    startup_type:
      startupTypeValue === "franchise" ||
      startupTypeValue === "independent" ||
      startupTypeValue === "undecided"
        ? startupTypeValue
        : null,
    business_model_id: businessModelDecision?.selectedPrimaryOptionId ?? null,
    capital: typeof capitalValue === "number" ? capitalValue : null,
    target_open_date: typeof targetOpenDateValue === "string" ? targetOpenDateValue : null,
    preferred_regions:
      typeof locationDecision?.inputs?.preferredRegion === "string"
        ? [locationDecision.inputs.preferredRegion]
        : locationDecision?.selectedPrimaryOptionId
          ? [locationDecision.selectedPrimaryOptionId]
          : null,
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
    subIndustryId: row.sub_industry_id ?? undefined,
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
  userOverride?: User
): Promise<PersistedRoadmapState> {
  const user = userOverride ?? (await ensureAccountUser(client));
  await ensureBusinessProfile(client, user);
  let roadmapId = state.roadmap.roadmapId;

  if (roadmapId === starterRoadmap.roadmapId) {
    const existingRoadmap = await getLatestRoadmapRow(client, user.id);

    roadmapId = existingRoadmap?.id ?? roadmapId;
  }

  const { data: roadmapRow, error: roadmapError } = await client
    .from("roadmaps")
    .upsert(
      {
        ...(roadmapId === starterRoadmap.roadmapId ? {} : { id: roadmapId }),
        user_id: user.id,
        template_id: state.roadmap.templateId,
        current_stage_code: state.roadmap.currentStageId,
        progress_percent: state.roadmap.progressPercent,
        status: "in_progress",
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "id"
      }
    )
    .select()
    .single();

  if (roadmapError || !roadmapRow) {
    throw roadmapError ?? new Error("Failed to upsert roadmap.");
  }

  const decisionPayload = serializeDecisions(state.decisions, roadmapRow.id);
  const taskPayload = serializeTasks(state.tasks, roadmapRow.id);

  // 기존 rows를 먼저 삭제 후 재삽입합니다.
  // upsert만 사용하면 빈 decisions(초기화 상태)일 때 삭제가 일어나지 않아
  // 이전 진행 상태가 DB에 남는 버그가 있습니다.
  const { error: deleteDecisionsError } = await client
    .from("stage_decisions")
    .delete()
    .eq("roadmap_id", roadmapRow.id);

  if (deleteDecisionsError) {
    throw deleteDecisionsError;
  }

  if (decisionPayload.length > 0) {
    const { error } = await client.from("stage_decisions").insert(decisionPayload);

    if (error) {
      throw error;
    }
  }

  const { error: deleteTasksError } = await client
    .from("stage_tasks")
    .delete()
    .eq("roadmap_id", roadmapRow.id);

  if (deleteTasksError) {
    throw deleteTasksError;
  }

  if (taskPayload.length > 0) {
    const { error } = await client.from("stage_tasks").insert(taskPayload);

    if (error) {
      throw error;
    }
  }

  await syncBusinessProfileFromState(client, user, state);

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
