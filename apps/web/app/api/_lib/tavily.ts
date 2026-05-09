/**
 * Tavily AI 검색 어댑터.
 *
 * LLM 친화적 웹 검색 — URL만이 아니라 정제된 콘텐츠 요약까지 반환.
 * 소셜 밈·릴스·숏츠 트렌드 같은 실시간 웹 데이터 검색에 특화.
 *
 * 인증: TAVILY_API_KEY (https://tavily.com)
 * 가격: $30/월 10K credits ($0.003/검색)
 */

export type TavilyResult = {
  title: string;
  url: string;
  content: string;      // 정제된 요약 (200-500자)
  score: number;         // 관련도 0~1
  publishedDate?: string;
};

export type TavilyResponse = {
  query: string;
  answer?: string;       // AI 종합 응답 (include_answer=true일 때)
  results: TavilyResult[];
};

export async function tavilySearch(
  apiKey: string,
  query: string,
  options: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    includeAnswer?: boolean;
    includeDomains?: string[];
    excludeDomains?: string[];
    days?: number;        // 최근 N일만 (time-sensitive 검색)
  } = {}
): Promise<TavilyResponse | null> {
  const {
    maxResults = 5,
    searchDepth = "basic",
    includeAnswer = true,
    includeDomains,
    excludeDomains,
    days,
  } = options;

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: searchDepth,
        include_answer: includeAnswer,
        max_results: Math.min(maxResults, 10),
        include_domains: includeDomains,
        exclude_domains: excludeDomains,
        days,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[Tavily] non-OK", res.status, text.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return {
      query,
      answer: data.answer,
      results: (data.results ?? []).map((r: { title: string; url: string; content: string; score: number; published_date?: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
        publishedDate: r.published_date,
      })),
    };
  } catch (err) {
    console.warn("[Tavily] fetch failed", err instanceof Error ? err.message : err);
    return null;
  }
}

/** 메메 신호가 큰 *원본 콘텐츠* URL 패턴 — 블로그 요약보다 우선순위 ↑ */
const ORIGINAL_CONTENT_PATTERNS = [
  /instagram\.com\/(p|reel|reels)\//i,
  /youtube\.com\/(shorts|watch)/i,
  /youtu\.be\//i,
  /tiktok\.com\/@[^/]+\/video\//i,
];

function isOriginalContentUrl(url: string): boolean {
  return ORIGINAL_CONTENT_PATTERNS.some((re) => re.test(url));
}

export type TavilyTrendStats = {
  raw: number;          // 전체 결과 수
  undated: number;      // publishedDate 누락으로 제외된 수
  kept: number;         // 최종 채택 수
  originals: number;    // 원본 콘텐츠 URL (IG/YT/TikTok) 수
};

/**
 * 마케팅 트렌드 전용 검색 — 여러 쿼리 병렬 수행 + 게시일 필터링 강화.
 *
 *  ── 필터링 정책 ───────────────────────────────────
 *  1. `publishedDate` 누락 결과는 **제외** (Tavily days 필터가 작동 안 한 결과)
 *      → 단, 원본 콘텐츠 URL (IG reel·YT shorts·TikTok video) 인 경우 예외 통과.
 *      이런 URL 은 플랫폼 자체 인덱스에서 노출되며 콘텐츠 신선도가 일반적으로 보장됨.
 *  2. 원본 콘텐츠 URL 우선 정렬 → 블로그 요약은 후순위.
 *  ────────────────────────────────────────
 */
export async function fetchTrendingSocialContent(
  apiKey: string,
  industryLabel: string,
  language: "ko" | "en" = "ko"
): Promise<{ results: TavilyResult[]; stats: TavilyTrendStats }> {
  const queries = language === "ko"
    ? [
        `${industryLabel} 인스타그램 릴스 site:instagram.com`,
        `${industryLabel} 유튜브 쇼츠 site:youtube.com`,
        `${industryLabel} 밈 해시태그 2026`,
      ]
    : [
        `${industryLabel} Instagram Reels site:instagram.com`,
        `${industryLabel} YouTube Shorts site:youtube.com`,
        `${industryLabel} memes hashtags 2026`,
      ];

  const results = await Promise.all(
    queries.map((q) =>
      tavilySearch(apiKey, q, {
        maxResults: 5,
        searchDepth: "basic",
        includeAnswer: false,
        days: 14,
      })
    )
  );

  const seen = new Set<string>();
  const all: TavilyResult[] = [];
  for (const r of results) {
    if (!r) continue;
    for (const item of r.results) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      all.push(item);
    }
  }

  // 게시일 필터 — 누락 결과는 원본 콘텐츠 URL 만 통과
  let undated = 0;
  const fresh: TavilyResult[] = [];
  for (const item of all) {
    const isOriginal = isOriginalContentUrl(item.url);
    if (!item.publishedDate && !isOriginal) {
      undated++;
      continue;
    }
    fresh.push(item);
  }

  // 정렬 — 원본 URL 우선, 그 안에서 score 내림차순
  fresh.sort((a, b) => {
    const ao = isOriginalContentUrl(a.url) ? 1 : 0;
    const bo = isOriginalContentUrl(b.url) ? 1 : 0;
    if (ao !== bo) return bo - ao;
    return b.score - a.score;
  });

  const kept = fresh.slice(0, 8);
  return {
    results: kept,
    stats: {
      raw: all.length,
      undated,
      kept: kept.length,
      originals: kept.filter((r) => isOriginalContentUrl(r.url)).length,
    },
  };
}
