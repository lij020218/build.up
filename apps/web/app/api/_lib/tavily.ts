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

/**
 * 마케팅 트렌드 전용 검색 — 여러 쿼리 병렬 수행.
 */
export async function fetchTrendingSocialContent(
  apiKey: string,
  industryLabel: string,
  language: "ko" | "en" = "ko"
): Promise<TavilyResult[]> {
  const queries = language === "ko"
    ? [
        `${industryLabel} 인스타그램 릴스 트렌드 최근`,
        `${industryLabel} 틱톡 숏츠 유행 요즘`,
        `${industryLabel} 밈 해시태그 2026`,
      ]
    : [
        `${industryLabel} Instagram Reels trending recent`,
        `${industryLabel} TikTok viral hashtags`,
        `${industryLabel} memes 2026`,
      ];

  const results = await Promise.all(
    queries.map((q) =>
      tavilySearch(apiKey, q, {
        maxResults: 5,
        searchDepth: "basic",
        includeAnswer: false,
        days: 14, // 최근 2주 강조
      })
    )
  );

  // 모든 결과 통합 + 스코어 정렬 + 중복 URL 제거
  const seen = new Set<string>();
  const merged: TavilyResult[] = [];
  for (const r of results) {
    if (!r) continue;
    for (const item of r.results) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }
  }
  return merged.sort((a, b) => b.score - a.score).slice(0, 8);
}
