import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecommendationItem } from "../types/roadmap";
import type {
  FreshnessMeta,
  FreshnessStatus,
  KnowledgeItemRecord,
  KnowledgeItemSourceRecord
} from "../types/freshness";
import type {
  StageGuideContent,
  StageGuideStep,
  StageGuideWarning,
  StageGuideAiTool
} from "../types/stage-guide";
import type { FoundOneDatabase } from "./client";

type Client = SupabaseClient<FoundOneDatabase>;

type LoadKnowledgeRecommendationsParams = {
  domain: string;
  itemType: string;
  categoryId?: string;
};

export type LoadKnowledgeRecordsParams = LoadKnowledgeRecommendationsParams;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function mapKnowledgeItemRow(
  row: FoundOneDatabase["public"]["Tables"]["knowledge_items"]["Row"]
): KnowledgeItemRecord {
  return {
    id: row.id,
    itemKey: row.item_key,
    itemType: row.item_type,
    domain: row.domain,
    title: row.title,
    summary: row.summary ?? undefined,
    payload: row.payload ?? {},
    freshnessStatus: row.freshness_status,
    lastCheckedAt: row.last_checked_at ?? undefined,
    nextReviewAt: row.next_review_at ?? undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active
  };
}

function mapKnowledgeSourceRow(
  row: FoundOneDatabase["public"]["Tables"]["knowledge_item_sources"]["Row"]
): KnowledgeItemSourceRecord {
  return {
    id: row.id,
    knowledgeItemId: row.knowledge_item_id,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    verifiedAt: row.verified_at,
    expiresAt: row.expires_at ?? undefined,
    confidence: row.confidence
  };
}

function buildFreshnessMeta(
  item: KnowledgeItemRecord,
  sources: KnowledgeItemSourceRecord[]
): FreshnessMeta | undefined {
  if (!item.lastCheckedAt) {
    return undefined;
  }

  return {
    status: item.freshnessStatus as FreshnessStatus,
    label:
      item.freshnessStatus === "fresh"
        ? "Official source reviewed"
        : item.freshnessStatus === "review_soon"
          ? "Review due soon"
          : item.freshnessStatus === "stale"
            ? "Stale information"
            : "Blocked until review",
    sources: sources.map((source) => ({
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      verifiedAt: source.verifiedAt,
      expiresAt: source.expiresAt,
      confidence: source.confidence
    })),
    lastCheckedAt: item.lastCheckedAt,
    nextReviewAt: item.nextReviewAt,
    notes: item.notes
  };
}

function mapRecommendationItem(
  item: KnowledgeItemRecord,
  sources: KnowledgeItemSourceRecord[]
): RecommendationItem {
  const payload = item.payload ?? {};

  return {
    id: item.itemKey,
    title: item.title,
    score: typeof payload.score === "number" ? payload.score : undefined,
    summary: item.summary,
    reasons: isStringArray(payload.reasons) ? payload.reasons : undefined,
    warnings: isStringArray(payload.warnings) ? payload.warnings : undefined,
    meta:
      payload.meta && typeof payload.meta === "object" && !Array.isArray(payload.meta)
        ? (payload.meta as Record<string, string | number>)
        : undefined,
    freshness: buildFreshnessMeta(item, sources)
  };
}

export async function loadKnowledgeRecommendations(
  client: Client,
  params: LoadKnowledgeRecommendationsParams
): Promise<RecommendationItem[]> {
  const { data: itemRows, error: itemError } = await client
    .from("knowledge_items")
    .select("*")
    .eq("domain", params.domain)
    .eq("item_type", params.itemType)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (itemError) {
    throw itemError;
  }

  const items = (itemRows ?? []).map(mapKnowledgeItemRow).filter((item) => {
    if (!params.categoryId) {
      return true;
    }

    return item.payload?.categoryId === params.categoryId;
  });

  if (items.length === 0) {
    return [];
  }

  const itemIds = items.map((item) => item.id);
  const { data: sourceRows, error: sourceError } = await client
    .from("knowledge_item_sources")
    .select("*")
    .in("knowledge_item_id", itemIds);

  if (sourceError) {
    throw sourceError;
  }

  const sources = (sourceRows ?? []).map(mapKnowledgeSourceRow);

  return items.map((item) =>
    mapRecommendationItem(
      item,
      sources.filter((source) => source.knowledgeItemId === item.id)
    )
  );
}

export async function loadKnowledgeRecords(
  client: Client,
  params: LoadKnowledgeRecordsParams
): Promise<Array<KnowledgeItemRecord & { sources: KnowledgeItemSourceRecord[]; freshness?: FreshnessMeta }>> {
  const { data: itemRows, error: itemError } = await client
    .from("knowledge_items")
    .select("*")
    .eq("domain", params.domain)
    .eq("item_type", params.itemType)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (itemError) {
    throw itemError;
  }

  const allItems = (itemRows ?? []).map(mapKnowledgeItemRow);
  const categoryMatches = params.categoryId
    ? allItems.filter((item) => item.payload?.categoryId === params.categoryId)
    : allItems;
  // categoryId가 명시된 경우 해당 카테고리만 반환, 없으면 빈 배열
  const items = categoryMatches.length > 0
    ? categoryMatches
    : params.categoryId
      ? []
      : allItems.slice(0, 1);

  if (items.length === 0) {
    return [];
  }

  const itemIds = items.map((item) => item.id);
  const { data: sourceRows, error: sourceError } = await client
    .from("knowledge_item_sources")
    .select("*")
    .in("knowledge_item_id", itemIds);

  if (sourceError) {
    throw sourceError;
  }

  const sources = (sourceRows ?? []).map(mapKnowledgeSourceRow);

  return items.map((item) => {
    const itemSources = sources.filter((source) => source.knowledgeItemId === item.id);

    return {
      ...item,
      sources: itemSources,
      freshness: buildFreshnessMeta(item, itemSources)
    };
  });
}

export async function loadKnowledgeRecordById(client: Client, guideId: string) {
  const { data: itemRow, error: itemError } = await client
    .from("knowledge_items")
    .select("*")
    .eq("id", guideId)
    .eq("is_active", true)
    .maybeSingle();

  if (itemError) {
    throw itemError;
  }

  if (!itemRow) {
    return null;
  }

  const item = mapKnowledgeItemRow(itemRow);
  const { data: sourceRows, error: sourceError } = await client
    .from("knowledge_item_sources")
    .select("*")
    .eq("knowledge_item_id", guideId);

  if (sourceError) {
    throw sourceError;
  }

  const sources = (sourceRows ?? []).map(mapKnowledgeSourceRow);

  return {
    ...item,
    sources,
    freshness: buildFreshnessMeta(item, sources)
  };
}

export async function loadPermitKnowledge(client: Client, categoryId?: string) {
  return loadKnowledgeRecords(client, {
    domain: "permit-guide",
    itemType: "permit_summary",
    categoryId
  });
}

export async function loadTaxKnowledge(client: Client, categoryId?: string) {
  return loadKnowledgeRecords(client, {
    domain: "tax-guide",
    itemType: "tax_summary",
    categoryId
  });
}

export async function loadLoanKnowledge(client: Client, categoryId?: string) {
  return loadKnowledgeRecords(client, {
    domain: "loan-guide",
    itemType: "loan_product",
    categoryId
  });
}

function mapStageGuideRow(
  row: FoundOneDatabase["public"]["Tables"]["stage_guide_content"]["Row"]
): StageGuideContent {
  return {
    id: row.id,
    stageCode: row.stage_code,
    categoryId: row.category_id,
    locale: row.locale,
    summary: row.summary,
    whyNow: row.why_now,
    steps: Array.isArray(row.steps) ? (row.steps as StageGuideStep[]) : [],
    costRange: row.cost_range,
    timeEstimate: row.time_estimate,
    warnings: Array.isArray(row.warnings) ? (row.warnings as StageGuideWarning[]) : [],
    aiTools: Array.isArray(row.ai_tools) ? (row.ai_tools as StageGuideAiTool[]) : [],
    expertWhen: row.expert_when,
    expertType: row.expert_type
  };
}

export async function loadStageGuideContent(
  client: Client,
  stageCode: string,
  categoryId?: string,
  locale = "ko"
): Promise<StageGuideContent | null> {
  // Try category-specific first, fall back to general (null category_id)
  if (categoryId) {
    const { data, error } = await client
      .from("stage_guide_content")
      .select("*")
      .eq("stage_code", stageCode)
      .eq("category_id", categoryId)
      .eq("locale", locale)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (data) return mapStageGuideRow(data);
  }

  const { data, error } = await client
    .from("stage_guide_content")
    .select("*")
    .eq("stage_code", stageCode)
    .is("category_id", null)
    .eq("locale", locale)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data ? mapStageGuideRow(data) : null;
}

// ── 인테리어 디자인 가이드 (업종별 자재·컨셉) ─────────────────────────────

export type InteriorGuideItem = {
  id: string;
  guideType: "material" | "concept";
  nameKo: string;
  nameEn?: string;
  descriptionKo: string;
  descriptionEn?: string;
  iconName?: string;
  tags: string[];
  pros?: string[];
  cons?: string[];
  costRangeKo?: string;
  costRangeEn?: string;
  trendSource?: string;
  priority: number;
};

export type InteriorGuideResult = {
  materials: InteriorGuideItem[];
  concepts: InteriorGuideItem[];
};

/**
 * 업종별 인테리어 자재·디자인 컨셉 로드.
 * 3단계 폴백: sub_industry_id → category_id → 전체(null)
 */
export async function loadInteriorGuides(
  client: Client,
  categoryId: string,
  subIndustryId?: string
): Promise<InteriorGuideResult> {
  type InteriorRow = FoundOneDatabase["public"]["Tables"]["interior_design_guides"]["Row"];

  const mapRow = (row: InteriorRow): InteriorGuideItem => ({
    id: row.id,
    guideType: row.guide_type,
    nameKo: row.name_ko,
    nameEn: row.name_en ?? undefined,
    descriptionKo: row.description_ko,
    descriptionEn: row.description_en ?? undefined,
    iconName: row.icon_name ?? undefined,
    tags: row.tags ?? [],
    pros: row.pros ?? undefined,
    cons: row.cons ?? undefined,
    costRangeKo: row.cost_range_ko ?? undefined,
    costRangeEn: row.cost_range_en ?? undefined,
    trendSource: row.trend_source ?? undefined,
    priority: row.priority,
  });

  const split = (rows: InteriorGuideItem[]): InteriorGuideResult => ({
    materials: rows.filter((r) => r.guideType === "material").sort((a, b) => a.priority - b.priority),
    concepts: rows.filter((r) => r.guideType === "concept").sort((a, b) => a.priority - b.priority),
  });

  // 1차: sub_industry_id 매칭
  if (subIndustryId) {
    const { data, error } = await client
      .from("interior_design_guides")
      .select("*")
      .eq("category_id", categoryId)
      .eq("sub_industry_id", subIndustryId)
      .eq("is_active", true)
      .order("priority", { ascending: true });
    if (!error && data && data.length > 0) {
      return split(data.map(mapRow));
    }
  }

  // 2차: category_id만 매칭 (sub_industry_id IS NULL)
  const { data: catData, error: catError } = await client
    .from("interior_design_guides")
    .select("*")
    .eq("category_id", categoryId)
    .is("sub_industry_id", null)
    .eq("is_active", true)
    .order("priority", { ascending: true });
  if (!catError && catData && catData.length > 0) {
    return split(catData.map(mapRow));
  }

  // 3차: category_id만으로 전체 (sub_industry_id 무관)
  const { data: allData, error: allError } = await client
    .from("interior_design_guides")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("priority", { ascending: true });
  if (!allError && allData && allData.length > 0) {
    return split(allData.map(mapRow));
  }

  return { materials: [], concepts: [] };
}
