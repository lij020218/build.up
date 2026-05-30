import type { SupabaseClient } from "@supabase/supabase-js";
import type { FoundOneDatabase } from "./client";
import type { ProgramCategory, StartupProgram, ApplicationStatus } from "../startup-programs";

type Client = SupabaseClient<FoundOneDatabase>;
type ProgramRow = FoundOneDatabase["public"]["Tables"]["support_programs"]["Row"];

// ─── Row → Domain 매핑 ──────────────────────────────────────────────────────

function mapProgramRow(row: ProgramRow): StartupProgram {
  return {
    id: row.program_key,
    category: row.category as ProgramCategory,
    name: { ko: row.name_ko, en: row.name_en },
    organizer: { ko: row.organizer_ko, en: row.organizer_en },
    target: { ko: row.target_ko, en: row.target_en },
    benefit: { ko: row.benefit_ko, en: row.benefit_en },
    amount: row.amount ?? undefined,
    season: { ko: row.season_ko ?? "", en: row.season_en ?? "" },
    url: row.url ?? "",
    forSmallBiz: row.for_small_biz,
    forFranchise: row.for_franchise,
    highlight: row.highlight,
    dataYear: row.data_year ?? "",
    maxAge: row.max_age ?? undefined,
    businessYearRange: row.business_year_min != null && row.business_year_max != null
      ? [row.business_year_min, row.business_year_max]
      : undefined,
    industries: row.industries ?? undefined,
    regions: row.regions ?? undefined,
    applicationStatus: (row.application_status as ApplicationStatus) ?? undefined,
    requiredDocs: Array.isArray(row.required_docs)
      ? (row.required_docs as { ko: string; en: string }[])
      : undefined,
  };
}

// ─── 로드 함수들 ─────────────────────────────────────────────────────────────

export type LoadProgramsFilter = {
  category?: ProgramCategory;
  status?: ApplicationStatus;
  forSmallBiz?: boolean;
  forFranchise?: boolean;
};

export async function loadSupportPrograms(
  client: Client,
  filters?: LoadProgramsFilter
): Promise<StartupProgram[]> {
  let query = client
    .from("support_programs")
    .select("*")
    .eq("is_active", true)
    .order("application_status", { ascending: true })
    .order("highlight", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.status) {
    query = query.eq("application_status", filters.status);
  }
  if (filters?.forSmallBiz) {
    query = query.eq("for_small_biz", true);
  }
  if (filters?.forFranchise) {
    query = query.eq("for_franchise", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapProgramRow);
}

export async function loadProgramsByDeadline(
  client: Client,
  daysAhead: number
): Promise<StartupProgram[]> {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 86_400_000);

  const { data, error } = await client
    .from("support_programs")
    .select("*")
    .eq("is_active", true)
    .eq("application_status", "open")
    .lte("application_deadline", future.toISOString())
    .gte("application_deadline", now.toISOString())
    .order("application_deadline", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapProgramRow);
}

export async function loadProgramByKey(
  client: Client,
  programKey: string
): Promise<StartupProgram | null> {
  const { data, error } = await client
    .from("support_programs")
    .select("*")
    .eq("program_key", programKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProgramRow(data) : null;
}
