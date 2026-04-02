import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TTL_MS } from "./types";

// persistence.ts 패턴을 따라 untyped client를 사용합니다.
// typed client(BuildUpDatabase)의 upsert/update 타입 추론 이슈를 회피합니다.
type Client = SupabaseClient;

// ─── 캐시 레이어 ─────────────────────────────────────────────────────────────
// knowledge_items 테이블을 범용 캐시로 활용합니다.
// 어댑터 이름을 domain으로, 파라미터 해시를 item_key로 사용합니다.

export type CacheOptions = {
  adapterName: string;
  cacheKey: string;
  ttlMs?: number;
};

export type CachedData<T> = {
  data: T;
  fromCache: boolean;
  stale: boolean;
  fetchedAt: string;
};

type KnowledgeItemRow = {
  payload: Record<string, unknown>;
  last_checked_at: string | null;
  created_at: string;
};

/** knowledge_items에서 캐시된 데이터 조회 */
export async function getCache<T>(
  client: Client,
  options: CacheOptions
): Promise<CachedData<T> | null> {
  const { data: row, error } = await client
    .from("knowledge_items")
    .select("payload, last_checked_at, created_at")
    .eq("domain", `cache:${options.adapterName}`)
    .eq("item_key", options.cacheKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !row) return null;

  const item = row as KnowledgeItemRow;
  const ttl = options.ttlMs ?? DEFAULT_TTL_MS[options.adapterName] ?? 24 * 60 * 60 * 1000;
  const fetchedAt = item.last_checked_at ?? item.created_at;
  const age = Date.now() - new Date(fetchedAt).getTime();
  const stale = age > ttl;

  return {
    data: item.payload as T,
    fromCache: true,
    stale,
    fetchedAt,
  };
}

/** knowledge_items에 캐시 데이터 저장 (upsert) */
export async function setCache<T extends Record<string, unknown>>(
  client: Client,
  options: CacheOptions & {
    data: T;
    sourceName: string;
    sourceUrl: string;
    title?: string;
  }
): Promise<void> {
  const ttl = options.ttlMs ?? DEFAULT_TTL_MS[options.adapterName] ?? 24 * 60 * 60 * 1000;
  const now = new Date().toISOString();
  const nextReview = new Date(Date.now() + ttl).toISOString();

  const { error } = await client
    .from("knowledge_items")
    .upsert(
      {
        item_key: options.cacheKey,
        domain: `cache:${options.adapterName}`,
        item_type: "api_cache",
        title: options.title ?? `${options.adapterName}:${options.cacheKey}`,
        payload: options.data,
        freshness_status: "fresh",
        last_checked_at: now,
        next_review_at: nextReview,
        is_active: true,
        summary: null,
        notes: `Auto-cached from ${options.sourceName}`,
      },
      { onConflict: "item_key" }
    );

  if (error) {
    console.warn(`[cache] Failed to set cache for ${options.adapterName}:${options.cacheKey}`, error.message);
  }
}

/** 캐시 무효화 */
export async function invalidateCache(
  client: Client,
  adapterName: string,
  cacheKey?: string
): Promise<void> {
  let query = client
    .from("knowledge_items")
    .update({ freshness_status: "stale" })
    .eq("domain", `cache:${adapterName}`);

  if (cacheKey) {
    query = query.eq("item_key", cacheKey);
  }

  await query;
}

/** 캐시 조회 → 미스 시 fetch → 캐시 저장 */
export async function getCachedOrFetch<T extends Record<string, unknown>>(
  client: Client,
  options: CacheOptions & {
    fetchFn: () => Promise<{ data: T; sourceName: string; sourceUrl: string; title?: string }>;
  }
): Promise<CachedData<T>> {
  // 1. Try cache
  const cached = await getCache<T>(client, options);
  if (cached && !cached.stale) {
    return cached;
  }

  // 2. Fetch fresh data
  try {
    const result = await options.fetchFn();
    await setCache(client, {
      ...options,
      data: result.data,
      sourceName: result.sourceName,
      sourceUrl: result.sourceUrl,
      title: result.title,
    });
    return {
      data: result.data,
      fromCache: false,
      stale: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (fetchError) {
    // 3. Fetch 실패 시 stale 캐시라도 반환
    if (cached) {
      return { ...cached, stale: true };
    }
    throw fetchError;
  }
}
