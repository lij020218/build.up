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
 * 마케팅 캠페인·광고 사례 검색 — 2026-05-12 사장님 요청에 따라 재설계.
 *
 *  ── 변경 의도 ─────────────────────────────────────────────────────
 *  종전: "쇼츠·릴스·밈" 키워드 → 일반 사용자 콘텐츠가 다수 → 트렌드성 약함.
 *  변경: "광고 캠페인·브랜드 마케팅·바이럴 사례" 키워드 + 마케팅 전문 매체 우선.
 *  목표: 사장님이 *유명 마케팅 캠페인* (예: Gemini Hey Mom, Manus AI 데모)
 *        에서 배워올 만한 *사례*를 surfacing 하는 것.
 *  ─────────────────────────────────────────────────────────────────
 *
 *  ── 필터링 정책 (유지) ─────────────────────────────
 *  1. `publishedDate` 누락 결과는 **제외**.
 *     단, 원본 콘텐츠 URL (IG/YT/TikTok video) 인 경우 예외 통과.
 *  2. 마케팅 전문 매체 도메인 우선 정렬 → 일반 블로그는 후순위.
 *  ──────────────────────────────────────────────────
 */

/** 마케팅 캠페인 사례 큐레이션에 신뢰도 높은 매체 도메인 — 우선 정렬에 사용. */
const MARKETING_PUBLICATION_DOMAINS = [
  "adage.com",
  "adweek.com",
  "campaignlive.com",
  "campaignasia.com",
  "campaignbrief.com",
  "adsoftheworld.com",
  "adsofbrands.net",
  "mediapost.com",
  "marketingdive.com",
  "brand-news.kr",       // 브랜드뉴스 (Korean)
  "the-pr.co.kr",        // PR전문 (Korean)
  "campaignkorea.com",   // 캠페인코리아
  "kobaco.co.kr",        // 한국방송광고진흥공사
];

function isMarketingPublication(url: string): boolean {
  return MARKETING_PUBLICATION_DOMAINS.some((d) => url.includes(d));
}

export async function fetchTrendingSocialContent(
  apiKey: string,
  industryLabel: string,
  language: "ko" | "en" = "ko"
): Promise<{ results: TavilyResult[]; stats: TavilyTrendStats }> {
  // ── 마케팅 캠페인 사례 중심 쿼리 ──
  // "쇼츠/릴스" 키워드 제거. 대신 *광고·캠페인·사례* 키워드로 마케팅 전문 매체 도달.
  const queries = language === "ko"
    ? [
        `${industryLabel} 광고 캠페인 사례 2026`,
        `${industryLabel} 브랜드 마케팅 화제 2026`,
        `${industryLabel} 바이럴 광고 분석`,
        `${industryLabel} 마케팅 캠페인 사례 분석`,
      ]
    : [
        `${industryLabel} viral marketing campaign 2026 case study`,
        `${industryLabel} brand ad campaign analysis 2026`,
        `${industryLabel} best advertising campaigns May 2026`,
        `${industryLabel} marketing campaign breakdown 2026`,
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

  // 정렬 — 마케팅 전문 매체 1순위, 원본 콘텐츠 URL 2순위, score 3순위
  // 2026-05-12: 사장님이 학습 가능한 *분석 기사·캠페인 해설*을 우선 surfacing.
  fresh.sort((a, b) => {
    const ap = isMarketingPublication(a.url) ? 2 : isOriginalContentUrl(a.url) ? 1 : 0;
    const bp = isMarketingPublication(b.url) ? 2 : isOriginalContentUrl(b.url) ? 1 : 0;
    if (ap !== bp) return bp - ap;
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
