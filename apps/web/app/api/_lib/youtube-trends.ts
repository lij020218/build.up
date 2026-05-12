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
 * 업종별 *최소 조회수* 임계값 — "트렌드" 라벨을 붙일 수 있는 최저 신뢰선.
 *
 *  ── 왜 임계값이 필요한가 ─────────────────────────────────────────
 *  2026-05-12 사장님 신고: 조회수 500회짜리 영상을 "트렌드" 로 추천하던 문제.
 *  YouTube 검색 결과는 default 로 게시일·관련도순이라 조회수 낮은 영상도 섞임.
 *  "트렌드" 라는 단어 의미상 *실제 화제* 가 된 것만 추천해야 점주께 의미가 있음.
 *
 *  ── 업종별 기준선 (경험적) ───────────────────────────────────────
 *  • 외식·뷰티·라이프스타일: 100,000+ (mass-market — 화제성 기준 높음)
 *  • 펫·교육·피트니스:        50,000+ (mid-market — 니치 화제성)
 *  • 스타트업·테크·B2B:       10,000+ (specialist — 적은 청중이라도 의미)
 *  • 미지정:                  30,000+ (안전한 중간선)
 *  ────────────────────────────────────────────────────────────
 */
export const MIN_VIEW_COUNT_BY_CATEGORY: Record<string, number> = {
  food: 100_000,
  "cafe-dessert": 100_000,
  retail: 100_000,
  beauty: 100_000,
  pet: 50_000,
  fitness: 50_000,
  education: 50_000,
  "online-digital": 50_000,
  space: 30_000,
  "living-service": 30_000,
  "startup-tech": 10_000,
};

export function getMinViewCount(categoryId: string | undefined): number {
  if (!categoryId) return 30_000;
  return MIN_VIEW_COUNT_BY_CATEGORY[categoryId] ?? 30_000;
}

/**
 * 마케팅 트렌드 그라운딩용 통합 페치.
 *
 *  ── 2026-05-12 정책 변경 ────────────────────────────────────────────
 *  사장님 의도: "유튜브 영상 다 가져오는게 아니라 *실제 마케팅 캠페인·광고 사례*
 *    (예: 제미나이 Hey Mom, Manus AI 데모) 매일 찾아서 알려달라"
 *  → 키워드를 "쇼츠" 에서 "광고 / 캠페인 / 브랜드" 로 전환.
 *  → 업종별 MIN_VIEW_COUNT 필터로 화제성 보장. 500회짜리 영상 추천 차단.
 *  ────────────────────────────────────────────────────────────────────
 */
export async function fetchYoutubeForIndustry(
  apiKey: string,
  industryLabel: string,
  options: { videoCategoryId?: string; categoryId?: string } = {}
): Promise<YoutubeTrendingItem[]> {
  // 키워드 전략 — "쇼츠" 가 아닌 *마케팅 캠페인·광고 사례* 중심.
  // 같은 점수대에서 가장 화제성 높은 마케팅 콘텐츠를 잡기 위한 4-way 검색.
  const queries = [
    `${industryLabel} 광고 캠페인`,
    `${industryLabel} 브랜드 마케팅`,
    `${industryLabel} 바이럴 영상`,
    `${industryLabel} 광고`,           // 단순 fallback
  ];

  const [trending, ...keywordSearches] = await Promise.all([
    fetchYoutubeTrendingKR(apiKey, { videoCategoryId: options.videoCategoryId, maxResults: 6 }),
    ...queries.map((q) => fetchYoutubeKeywordSearch(apiKey, q, { days: 30, maxResults: 6 })),
  ]);

  // 모든 키워드 결과 통합 후 조회수 내림차순 정렬
  const allKeywordResults = keywordSearches.flat();

  const minViews = getMinViewCount(options.categoryId);

  // ── 1) 화제성 임계값 필터 ──
  // viewCount < minViews 인 영상은 "트렌드" 라벨링 부적합 — 사장님에게 의미 없음.
  // 예외: mostPopular 차트에 올라온 영상은 KR 전체 트렌딩이라 통과시킴 (해당 업종 관련성은 LLM 이 판단).
  const trendingIds = new Set(trending.map((v) => v.videoId));
  const filtered = allKeywordResults.filter(
    (v) => v.viewCount >= minViews || trendingIds.has(v.videoId)
  );

  // ── 2) 중복 제거 + 조회수 내림차순 ──
  const seen = new Set<string>();
  const merged: YoutubeTrendingItem[] = [];
  // mostPopular 가 가장 신뢰도 높음 — 우선 채택
  for (const list of [trending, filtered]) {
    for (const item of list) {
      if (seen.has(item.videoId)) continue;
      seen.add(item.videoId);
      merged.push(item);
    }
  }
  merged.sort((a, b) => b.viewCount - a.viewCount);
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
