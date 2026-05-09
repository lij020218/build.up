/**
 * YouTube Data API v3 어댑터 — 한국 실시간 트렌딩 + 키워드 검색.
 *
 *  ── 왜 도입했나 ───────────────────────────────────────
 *  Tavily 는 Google 인덱스 기반 → 인스타·유튜브 *내부* 트렌딩 피드 접근 불가.
 *  대부분 결과가 "트렌드를 설명한 블로그 글" 이며 게시일 메타도 누락되는 경우가 많음.
 *  → YouTube Data API v3 의 `videos.list?chart=mostPopular` 는 KR 트렌딩 탭의
 *    *실제* 데이터를 무료(1 unit/호출·10k/일)로 제공.
 *  ────────────────────────────────────────────
 *
 *  ── Quota ─────────────────────────────────
 *  • videos.list (chart=mostPopular)   = 1 unit
 *  • search.list (q=…, type=video)     = 100 units
 *  → 한 트렌드 생성당 ~101 units → 일일 ~99 generations 가능
 *  ────────────────────────────────────────────
 *
 *  인증: YOUTUBE_API_KEY (Google Cloud Console → APIs & Services → Credentials)
 */

export type YoutubeTrendingItem = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string; // ISO
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
  url: string;
};

const API_BASE = "https://www.googleapis.com/youtube/v3";

type RawSnippet = {
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  tags?: string[];
};

type RawStatistics = {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
};

function toItem(id: string, snippet: RawSnippet, stats: RawStatistics): YoutubeTrendingItem {
  return {
    videoId: id,
    title: snippet.title,
    description: snippet.description,
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
    viewCount: Number(stats.viewCount ?? 0),
    likeCount: stats.likeCount != null ? Number(stats.likeCount) : undefined,
    commentCount: stats.commentCount != null ? Number(stats.commentCount) : undefined,
    tags: snippet.tags,
    url: `https://www.youtube.com/watch?v=${id}`,
  };
}

/**
 * KR 트렌딩 탭 — `chart=mostPopular`.
 * 카테고리 필터 가능 (videoCategoryId 가 주어지면 해당 카테고리의 KR 트렌딩만).
 */
export async function fetchYoutubeTrendingKR(
  apiKey: string,
  options: { regionCode?: string; videoCategoryId?: string; maxResults?: number } = {}
): Promise<YoutubeTrendingItem[]> {
  const { regionCode = "KR", videoCategoryId, maxResults = 10 } = options;

  const params = new URLSearchParams({
    part: "snippet,statistics",
    chart: "mostPopular",
    regionCode,
    maxResults: String(Math.min(maxResults, 50)),
    key: apiKey,
  });
  if (videoCategoryId) params.set("videoCategoryId", videoCategoryId);

  try {
    const res = await fetch(`${API_BASE}/videos?${params.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[YouTube] mostPopular non-OK", res.status, text.slice(0, 200));
      return [];
    }
    const data = (await res.json()) as {
      items: Array<{ id: string; snippet: RawSnippet; statistics: RawStatistics }>;
    };
    return data.items.map((it) => toItem(it.id, it.snippet, it.statistics));
  } catch (err) {
    console.warn("[YouTube] mostPopular failed", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * 키워드 검색 — search.list 후 videos.list 로 통계 조회 (2-step).
 * search.list 는 통계 미포함이므로 viewCount 정렬에 한계 있음 → order=viewCount + 통계 보강.
 */
export async function fetchYoutubeKeywordSearch(
  apiKey: string,
  query: string,
  options: { days?: number; regionCode?: string; maxResults?: number } = {}
): Promise<YoutubeTrendingItem[]> {
  const { days = 14, regionCode = "KR", maxResults = 10 } = options;
  const publishedAfter = new Date(Date.now() - days * 86_400_000).toISOString();

  // 1. search.list — videoId 만 모음
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    order: "viewCount",
    regionCode,
    relevanceLanguage: "ko",
    publishedAfter,
    maxResults: String(Math.min(maxResults, 25)),
    key: apiKey,
  });

  let videoIds: string[];
  try {
    const res = await fetch(`${API_BASE}/search?${searchParams.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[YouTube] search non-OK", res.status, text.slice(0, 200));
      return [];
    }
    const data = (await res.json()) as {
      items: Array<{ id: { videoId?: string }; snippet: RawSnippet }>;
    };
    videoIds = data.items
      .map((it) => it.id?.videoId)
      .filter((v): v is string => !!v);
  } catch (err) {
    console.warn("[YouTube] search failed", err instanceof Error ? err.message : err);
    return [];
  }

  if (videoIds.length === 0) return [];

  // 2. videos.list — 통계 포함 상세
  const videoParams = new URLSearchParams({
    part: "snippet,statistics",
    id: videoIds.join(","),
    key: apiKey,
  });
  try {
    const res = await fetch(`${API_BASE}/videos?${videoParams.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items: Array<{ id: string; snippet: RawSnippet; statistics: RawStatistics }>;
    };
    return data.items
      .map((it) => toItem(it.id, it.snippet, it.statistics))
      .sort((a, b) => b.viewCount - a.viewCount);
  } catch (err) {
    console.warn("[YouTube] videos.list failed", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * 마케팅 트렌드 그라운딩용 통합 페치.
 * 두 채널을 병렬로 조회 후 합본 — KR 전체 트렌딩 + 업종 키워드 트렌딩.
 */
export async function fetchYoutubeForIndustry(
  apiKey: string,
  industryLabel: string,
  options: { videoCategoryId?: string } = {}
): Promise<YoutubeTrendingItem[]> {
  const [trending, keyword] = await Promise.all([
    fetchYoutubeTrendingKR(apiKey, { videoCategoryId: options.videoCategoryId, maxResults: 6 }),
    fetchYoutubeKeywordSearch(apiKey, `${industryLabel} 쇼츠`, { days: 14, maxResults: 6 }),
  ]);

  const seen = new Set<string>();
  const merged: YoutubeTrendingItem[] = [];
  for (const list of [keyword, trending]) {
    for (const item of list) {
      if (seen.has(item.videoId)) continue;
      seen.add(item.videoId);
      merged.push(item);
    }
  }
  return merged.slice(0, 8);
}

/**
 * 11 대분류 → YouTube videoCategoryId 매핑.
 * 카테고리 트렌딩이 더 적합한 업종에만 지정 — 나머지는 전체 KR 트렌딩 사용.
 *
 * IDs 출처: https://developers.google.com/youtube/v3/docs/videoCategories/list
 *   15 = Pets & Animals · 17 = Sports · 22 = People & Blogs
 *   24 = Entertainment · 26 = Howto & Style · 27 = Education · 28 = Science & Tech
 */
export const YOUTUBE_CATEGORY_BY_INDUSTRY: Record<string, string | undefined> = {
  food: "26",            // Howto & Style — 먹방·레시피
  "cafe-dessert": "26",
  retail: "26",
  beauty: "26",
  pet: "15",             // Pets & Animals
  fitness: "17",         // Sports
  education: "27",       // Education
  space: undefined,      // 전체 트렌딩
  "online-digital": "24",// Entertainment
  "startup-tech": "28",  // Science & Tech
  "living-service": undefined,
};
