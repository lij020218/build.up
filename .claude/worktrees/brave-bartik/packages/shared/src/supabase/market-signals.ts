import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecommendationItem } from "../types/roadmap";
import type { FreshnessMeta, FreshnessStatus } from "../types/freshness";
import type { BuildUpDatabase } from "./client";

type Client = SupabaseClient<BuildUpDatabase>;
type MarketLocationSignalRow = BuildUpDatabase["public"]["Tables"]["market_location_signals"]["Row"];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function mapFreshness(row: MarketLocationSignalRow): FreshnessMeta | undefined {
  if (!row.last_checked_at) {
    return undefined;
  }

  return {
    status: row.freshness_status as FreshnessStatus,
    label:
      row.freshness_status === "fresh"
        ? "Official source reviewed"
        : row.freshness_status === "review_soon"
          ? "Review due soon"
          : row.freshness_status === "stale"
            ? "Stale information"
            : "Blocked until review",
    sources: [],
    lastCheckedAt: row.last_checked_at,
    nextReviewAt: row.next_review_at ?? undefined,
    notes: row.notes ?? undefined
  };
}

function scoreBand(level: string) {
  if (level === "high" || level === "strong") return 20;
  if (level === "mid-high") return 17;
  if (level === "mid") return 15;
  if (level === "mid-low" || level === "balanced") return 13;
  return 11;
}

function getSignalMatchScore(
  row: MarketLocationSignalRow,
  query: string,
  categoryId?: string
) {
  const normalizedRegion = normalizeText(row.region_name);
  const keywordExact = row.search_keywords.some(
    (keyword: string) => normalizeText(keyword) === query
  );
  const keywordContains = row.search_keywords.some(
    (keyword: string) =>
      normalizeText(keyword).includes(query) || query.includes(normalizeText(keyword))
  );

  let score = 0;
  if (row.category_id && categoryId && row.category_id === categoryId) {
    score += 20;
  }
  if (normalizedRegion === query) {
    score += 40;
  } else if (normalizedRegion.includes(query) || query.includes(normalizedRegion)) {
    score += 24;
  }
  if (keywordExact) {
    score += 28;
  } else if (keywordContains) {
    score += 16;
  }
  score += row.base_score / 10;

  return score;
}

export async function loadMarketSignalRecommendations(
  client: Client,
  params: {
    regionQuery: string;
    categoryId?: string;
  }
): Promise<RecommendationItem[]> {
  const query = normalizeText(params.regionQuery);
  if (!query) {
    return [];
  }

  const { data, error } = await client
    .from("market_location_signals")
    .select("*")
    .eq("is_active", true)
    .order("base_score", { ascending: false });

  if (error) {
    throw error;
  }

  const matched = ((data ?? []) as MarketLocationSignalRow[]).filter((row) => {
    const matchesRegion =
      normalizeText(row.region_name).includes(query) ||
      query.includes(normalizeText(row.region_name)) ||
      row.search_keywords.some((keyword: string) => normalizeText(keyword).includes(query) || query.includes(normalizeText(keyword)));

    const matchesCategory = !params.categoryId || !row.category_id || row.category_id === params.categoryId;
    return matchesRegion && matchesCategory;
  }).sort(
    (a, b) =>
      getSignalMatchScore(b, query, params.categoryId) -
      getSignalMatchScore(a, query, params.categoryId)
  );

  return matched.slice(0, 3).map((row) => {
    const evidence = row.evidence && typeof row.evidence === "object" ? row.evidence : {};
    const reasons = Array.isArray((evidence as Record<string, unknown>).reasons)
      ? ((evidence as Record<string, unknown>).reasons as string[])
      : [];
    const warnings = Array.isArray((evidence as Record<string, unknown>).warnings)
      ? ((evidence as Record<string, unknown>).warnings as string[])
      : [];

    return {
      id: row.region_key,
      title: row.region_name,
      score: row.base_score,
      summary: row.summary ?? undefined,
      reasons,
      warnings,
      meta: {
        districtName: row.district_name ?? "",
        marketStyle: row.market_style,
        rentBand: row.rent_band,
        competitionLevel: row.competition_level,
        customerFit: row.category_fit_level,
        scoreBudgetFit: scoreBand(row.rent_band),
        scoreCompetition: scoreBand(row.competition_level),
        scoreDemand: scoreBand(row.demand_level),
        scoreCategoryFit: scoreBand(row.category_fit_level),
        scoreAccess: scoreBand(row.access_level)
      },
      freshness: mapFreshness(row)
    };
  });
}

export async function loadBestMarketSignal(
  client: Client,
  params: {
    regionQuery?: string;
    marketQuery: string;
    categoryId?: string;
  }
): Promise<RecommendationItem | null> {
  const marketQuery = normalizeText(params.marketQuery);
  const regionQuery = normalizeText(params.regionQuery ?? "");

  if (!marketQuery) {
    return null;
  }

  const { data, error } = await client
    .from("market_location_signals")
    .select("*")
    .eq("is_active", true)
    .order("base_score", { ascending: false });

  if (error) {
    throw error;
  }

  const matched = ((data ?? []) as MarketLocationSignalRow[])
    .filter((row) => {
      const matchesCategory =
        !params.categoryId || !row.category_id || row.category_id === params.categoryId;
      if (!matchesCategory) {
        return false;
      }

      const keywordMatch =
        normalizeText(row.region_name).includes(marketQuery) ||
        marketQuery.includes(normalizeText(row.region_name)) ||
        row.search_keywords.some(
          (keyword: string) =>
            normalizeText(keyword).includes(marketQuery) ||
            marketQuery.includes(normalizeText(keyword))
        );

      const regionMatch =
        !regionQuery ||
        normalizeText(row.region_name).includes(regionQuery) ||
        regionQuery.includes(normalizeText(row.region_name)) ||
        row.search_keywords.some(
          (keyword: string) =>
            normalizeText(keyword).includes(regionQuery) ||
            regionQuery.includes(normalizeText(keyword))
        );

      return keywordMatch || regionMatch;
    })
    .sort(
      (a, b) =>
        getSignalMatchScore(b, marketQuery || regionQuery, params.categoryId) -
        getSignalMatchScore(a, marketQuery || regionQuery, params.categoryId)
    )
    .slice(0, 1);

  return matched.length > 0
    ? loadMarketSignalRecommendations(client, {
        regionQuery: matched[0].region_name,
        categoryId: params.categoryId
      }).then((items) => items[0] ?? null)
    : null;
}
