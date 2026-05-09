/**
 * 마케팅 트렌드 생성 — 공유 헬퍼.
 *
 * on-demand route(/api/ai/marketing/trends)와 cron route 둘 다 이 함수를 호출.
 * 동일 그라운딩 파이프라인 (Tavily + Naver + Claude web_search).
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  fetchNaverDataLab,
  fetchNaverBlogSearch,
  getIndustryKeywordGroups,
  getIndustryBlogQueries,
  type DataLabResult,
  type NaverSearchItem,
} from "./naver-trends";
import { fetchTrendingSocialContent, type TavilyResult, type TavilyTrendStats } from "./tavily";
import {
  fetchYoutubeForIndustry,
  YOUTUBE_CATEGORY_BY_INDUSTRY,
  type YoutubeTrendingItem,
} from "./youtube-trends";

export type TrendToolRecommendation = {
  name: string;
  purpose: string;
  tier: "free" | "paid" | "freemium";
  url?: string;
};

export type TrendItem = {
  title: string;
  reason: string;
  contentIdea: string;
  format: "reel" | "story" | "short" | "post" | "blog";
  hashtags: string[];
  referenceUrl: string | null;
  howToExecute?: string[];
  strategyExample?: string;
  effectiveness?: string;
  tools?: TrendToolRecommendation[];
};

export type TrendSource = { name: string; url: string; publishedDate?: string };

export type TrendMeta = {
  usedDataLab: boolean;
  usedNaverBlog: boolean;
  usedTavily: boolean;
  /** YouTube Data API v3 결과 사용 여부 (chart=mostPopular + 키워드 search) */
  usedYoutube: boolean;
  /** YouTube 에서 가져온 영상 수 — UI 정직성 신호 */
  youtubeVideos: number;
  webSearches: number;
  /** Tavily 필터링 결과 — 게시일 누락으로 제외된 수, 원본 콘텐츠 URL 수 */
  tavilyStats?: TavilyTrendStats;
};

export type GenerateTrendsInput = {
  anthropicApiKey: string;
  naverCreds?: { clientId: string; clientSecret: string };
  tavilyKey?: string;
  /** YouTube Data API v3 키 (없으면 YouTube 그라운딩 비활성) */
  youtubeKey?: string;
  /** 프롬프트 주입용 업종 라벨 (예: "치킨·버거·배달음식") */
  bizLabel: string;
  /** Naver 키워드 그룹·블로그 쿼리 조회용 — 11 대분류 중 하나 (food, cafe-dessert, ...) */
  categoryId: string;
  language: "ko" | "en";
};

export type GenerateTrendsOutput = {
  trends: TrendItem[];
  sources: TrendSource[];
  meta: TrendMeta;
};

export async function generateTrends(input: GenerateTrendsInput): Promise<GenerateTrendsOutput> {
  const { anthropicApiKey, naverCreds, tavilyKey, youtubeKey, bizLabel, categoryId, language } = input;
  const ko = language === "ko";
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  // 1. 외부 소스 병렬 수집
  type Grounding = {
    dataLab: DataLabResult | null;
    blogPosts: NaverSearchItem[];
    socialContent: TavilyResult[];
    youtubeVideos: YoutubeTrendingItem[];
    tavilyStats: TavilyTrendStats | undefined;
    sources: TrendSource[];
  };
  const grounding: Grounding = {
    dataLab: null,
    blogPosts: [],
    socialContent: [],
    youtubeVideos: [],
    tavilyStats: undefined,
    sources: [],
  };

  const tasks: Array<Promise<void>> = [];

  // ★ YouTube Data API — 가장 신뢰도 높은 실제 트렌딩 신호 (KR mostPopular + 키워드 검색)
  if (youtubeKey) {
    tasks.push((async () => {
      const videoCategoryId = YOUTUBE_CATEGORY_BY_INDUSTRY[categoryId];
      const videos = await fetchYoutubeForIndustry(youtubeKey, bizLabel, { videoCategoryId });
      grounding.youtubeVideos = videos;
      grounding.sources.push(
        ...videos.slice(0, 4).map((v) => ({
          name: `YT · ${v.title.slice(0, 40)}`,
          url: v.url,
          publishedDate: v.publishedAt,
        }))
      );
    })());
  }

  // Tavily — 보조 (블로그 요약·플랫폼 검색 페이지)
  if (tavilyKey) {
    tasks.push((async () => {
      const { results, stats } = await fetchTrendingSocialContent(tavilyKey, bizLabel, language);
      grounding.socialContent = results;
      grounding.tavilyStats = stats;
      grounding.sources.push(
        ...results.slice(0, 4).map((r) => ({
          name: r.title.slice(0, 40),
          url: r.url,
          publishedDate: r.publishedDate,
        }))
      );
    })());
  }

  // Naver (보조)
  if (naverCreds) {
    tasks.push((async () => {
      const groups = getIndustryKeywordGroups(categoryId);
      const result = await fetchNaverDataLab(naverCreds, groups, { days: 30 });
      grounding.dataLab = result;
    })());
    tasks.push((async () => {
      const queries = getIndustryBlogQueries(categoryId);
      const results = await Promise.all(
        queries.slice(0, 2).map((q) =>
          fetchNaverBlogSearch(naverCreds, q, { display: 3, sort: "date" })
        )
      );
      grounding.blogPosts = results.flat().slice(0, 6);
      grounding.sources.push(
        ...grounding.blogPosts.slice(0, 2).map((b) => ({
          name: `Naver Blog · ${b.title.slice(0, 30)}`,
          url: b.link,
          publishedDate: b.postdate,
        }))
      );
    })());
  }

  await Promise.all(tasks);

  // 2. 프롬프트 구성
  let groundingBlock = "";

  // ★★ 1순위 — YouTube 실제 트렌딩 데이터 (조회수 정렬, 게시일 100% 보장)
  if (grounding.youtubeVideos.length > 0) {
    groundingBlock += `\n[★★ 최우선 근거 · YouTube KR 실시간 트렌딩 + 키워드 쇼츠]\n`;
    for (const v of grounding.youtubeVideos.slice(0, 8)) {
      const date = v.publishedAt.slice(0, 10);
      const views = v.viewCount.toLocaleString();
      groundingBlock += `- "${v.title}" (${date}, ${views}회) [${v.url}]: ${v.description.slice(0, 120)}\n`;
    }
  }

  if (grounding.socialContent.length > 0) {
    groundingBlock += `\n[★ 보조 근거 · Tavily 웹 검색 (인스타·유튜브·블로그 요약, 게시일 검증됨)]\n`;
    for (const item of grounding.socialContent.slice(0, 6)) {
      groundingBlock += `- "${item.title}"${item.publishedDate ? ` (${item.publishedDate})` : " (원본 콘텐츠)"} [${item.url}]: ${item.content.slice(0, 120)}\n`;
    }
  }
  if (grounding.dataLab && grounding.dataLab.keywords.length > 0) {
    groundingBlock += `\n[보조 근거 · 네이버 DataLab 검색어 추이 (${grounding.dataLab.title})]\n`;
    for (const kw of grounding.dataLab.keywords) {
      const arrow = kw.trend === "up" ? "↑ 상승" : kw.trend === "down" ? "↓ 하락" : "→ 유지";
      groundingBlock += `- ${kw.title}: 평균 ${kw.ratio} · 최근 ${arrow}\n`;
    }
  }
  if (grounding.blogPosts.length > 0) {
    groundingBlock += `\n[보조 근거 · 네이버 블로그 최근 포스트 (실사용자 후기)]\n`;
    for (const post of grounding.blogPosts.slice(0, 4)) {
      const dateStr = post.postdate
        ? ` (${post.postdate.slice(0, 4)}-${post.postdate.slice(4, 6)}-${post.postdate.slice(6, 8)})`
        : "";
      groundingBlock += `- "${post.title}"${dateStr}: ${post.description.slice(0, 100)}\n`;
    }
  }
  if (groundingBlock === "") {
    groundingBlock = "\n[외부 데이터 소스 미구성 — web_search 툴로 직접 수집하세요]\n";
  }

  const prompt = `오늘은 ${today}입니다.
당신은 한국 ${bizLabel} 업종의 소셜 미디어 마케팅 전문가입니다.

${groundingBlock}

🚨 **절대 준수 — 할루시네이션 금지**:
- 모든 사실·수치·브랜드 사례는 **반드시 위의 Tavily 결과 또는 web_search 결과에 명시된 정보**만 사용.
- 웹에서 검증되지 않은 **모든 구체 수치(+34% 등)·브랜드 이름·캠페인명 언급 절대 금지**.
- web_search에서 못 찾은 브랜드 사례는 **아예 언급 안 함** — 추측·일반 지식·상상 금지.
- 검증 불가능한 영역은 **방향성 문구**("효과적이다", "주목받고 있다")로만 서술. 수치 없이.
- strategyExample·effectiveness 필드에 등장하는 **모든 브랜드·수치는 web_search 결과의 실제 URL 인용** 필수. 없으면 필드를 null로 남기기.

**생성 절차**:
1. web_search 툴로 "한국 [업종] 인스타그램 릴스 트렌드 최근 2주" 등 검색 실행
2. Tavily 결과 + web_search 결과에 있는 **구체적으로 인용 가능한** 내용만 추려냄
3. 그 중 위 ${bizLabel} 업종에 적용 가능한 실제 포맷·밈 5개 선정
4. 각 트렌드에 대해 아래 필드 작성 — **근거 없으면 해당 필드는 null**

**각 트렌드 필드**:
- **title** — 15자 이내. 검색 결과에서 나온 실제 포맷/밈 이름
- **reason** — 왜 지금 유행인가 1문장. Tavily/web_search 결과의 구체 인용·URL 기반
- **contentIdea** — 이 업종이 따라할 구체 적용법 1~2문장
- **format** — reel / story / short / post / blog 중 하나
- **hashtags** — 3~5개. 검색 결과에 실제로 등장한 태그 우선
- **referenceUrl** — Tavily/web_search 결과의 실제 URL. 없으면 null
- **howToExecute** — 3~5단계 실행. 검증 불가능한 구체 수치 없이 절차적 행동만 기술
- **strategyExample** — **web_search/Tavily에서 확인 가능한 브랜드 사례**가 있을 때만 기술. 없으면 null. 구체 수치 포함 시 그 수치가 인용된 URL을 referenceUrl에 명시
- **effectiveness** — 검색 결과에서 인용된 기대 효과만. 출처 없으면 null 또는 방향성 문구만
- **tools** — 2~4개 도구. **해당 포맷에 실제로 필요한 도구만** (CapCut/Midjourney/Gemini/Meta Business Suite/Canva/YouTube Audio Library 등 널리 알려진 도구)

⚠️ 출력 형식 엄수:
- **코드블록(${"```"}) 금지**
- **JSON 값 안에 <cite>, </cite> 같은 XML/HTML 태그 절대 넣지 말 것** — citation은 referenceUrl 필드로만
- **쌍따옴표는 반드시 이스케이프** (\\")
- **검증 안 된 필드는 null** — 빈 문자열·추측 금지

반드시 아래 JSON 배열로만 응답:
[
  {
    "title": "트렌드 제목 (15자 이내)",
    "reason": "웹에서 확인된 유행 이유 1문장 (출처 URL은 referenceUrl에)",
    "contentIdea": "구체 적용법 1~2문장",
    "format": "reel" | "story" | "short" | "post" | "blog",
    "hashtags": ["#태그1", "#태그2", "#태그3"],
    "referenceUrl": "https://... (실제 검색 결과 URL) 또는 null",
    "howToExecute": ["① ...", "② ...", "③ ..."],
    "strategyExample": "검색 결과에서 확인된 브랜드 사례 또는 null",
    "effectiveness": "검색 결과에서 인용된 효과 또는 null",
    "tools": [
      {"name": "CapCut", "purpose": "용도", "tier": "freemium", "url": "https://www.capcut.com"}
    ]
  }
]`;

  // 3. Claude 호출 (Sonnet 4.6 · web_search 활성화 · 할루시네이션 방지)
  const client = new Anthropic({ apiKey: anthropicApiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 8,
      } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [{ role: "user", content: prompt }],
  });

  // JSON 추출
  const textBlocks = response.content.filter((c) => c.type === "text");
  const combinedText = textBlocks
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("\n");
  const jsonMatch = combinedText.match(/\[[\s\S]*\]/);
  let trends: TrendItem[] = [];
  if (jsonMatch) {
    // Claude가 가끔 <cite index="...">text</cite> XML 태그를 값 안에 넣어 JSON을 깨뜨림 — 제거
    const sanitized = jsonMatch[0]
      .replace(/<cite[^>]*>/g, "")
      .replace(/<\/cite>/g, "");
    try {
      trends = JSON.parse(sanitized) as TrendItem[];
    } catch (parseErr) {
      console.warn(
        "[trend-generator] JSON parse failed after sanitize:",
        parseErr instanceof Error ? parseErr.message : parseErr,
        "| stop_reason:",
        response.stop_reason,
        "| raw (last 300):",
        sanitized.slice(-300)
      );
    }
  } else {
    console.warn(
      "[trend-generator] No JSON array found | stop_reason:",
      response.stop_reason,
      "| text blocks:",
      textBlocks.length,
      "| first 500 chars:",
      combinedText.slice(0, 500)
    );
  }

  // web_search citations 수집
  const citationSources: TrendSource[] = [];
  for (const block of response.content as Array<{ type: string; content?: unknown }>) {
    if (block.type !== "web_search_tool_result") continue;
    const results = block.content;
    if (!Array.isArray(results)) continue;
    for (const r of results) {
      if (r && typeof r === "object" && "url" in r && "title" in r) {
        citationSources.push({
          name: String((r as { title: unknown }).title).slice(0, 60),
          url: String((r as { url: unknown }).url),
        });
      }
    }
  }

  return {
    trends,
    sources: [...citationSources, ...grounding.sources].slice(0, 10),
    meta: {
      usedDataLab: !!grounding.dataLab,
      usedNaverBlog: grounding.blogPosts.length > 0,
      usedTavily: grounding.socialContent.length > 0,
      usedYoutube: grounding.youtubeVideos.length > 0,
      youtubeVideos: grounding.youtubeVideos.length,
      webSearches: citationSources.length,
      tavilyStats: grounding.tavilyStats,
    },
  };
}
