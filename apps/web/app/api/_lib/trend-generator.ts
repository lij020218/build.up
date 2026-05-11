/**
 * 마케팅 트렌드 생성 — 공유 헬퍼.
 *
 * on-demand route(/api/ai/marketing/trends)와 cron route 둘 다 이 함수를 호출.
 * 동일 그라운딩 파이프라인 (Tavily + Naver + Claude web_search).
 */

import { createAiClient } from "@build-up/ai/utils/client";
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

  // ⚠️ 2026-05-11 사용자 요청 강화:
  //   "실제로 유튜브나 인스타그램에서 지금 조회수 잘 나오는 트렌디한 마케팅·밈·유행 영상"
  //   → 추상적 카테고리("쇼츠 트렌드") 가 아닌 *실제 영상 5개 직접 추천*.
  //   referenceUrl 필수 (null 금지), 조회수·게시일을 reason 에 직접 인용.
  const hasYoutubeData = grounding.youtubeVideos.length >= 3;
  const prompt = `오늘 ${today} · 한국 ${bizLabel} 업종 소셜 미디어 *실제 트렌딩 영상* 5개.

${groundingBlock}

🎯 **목표**: 사장님이 5초 안에 "오 이 영상 봐, 우리도 비슷하게 찍자" 느끼는 *실제 영상 5개*.
   추상적 트렌드 카테고리 금지. "쇼츠 트렌드 활용" 같은 일반론 X. **구체 영상 1개를 사례로 직접 인용**.

📌 **선정 기준** (반드시 위 grounding 데이터 또는 web_search 결과 기반):
${hasYoutubeData
    ? `1. 위 [YouTube KR 실시간 트렌딩] 목록에서 ${bizLabel} 업종과 *조금이라도 연결 가능한* 영상 5개 우선 선정.
2. 게시일 최근 14일 + 조회수 명시된 것만.
3. 그 영상에서 본 *포맷·밈·연출 패턴*을 사장님 가게에 어떻게 적용할지 1문장.`
    : `1. web_search 로 "${bizLabel} 쇼츠 조회수 100만" 등 검색해 최근 14일 실제 트렌딩 영상 5개 찾기.
2. 영상 URL·제목·게시일·조회수 명시 가능한 것만.`}
4. **각 영상 1개 = 트렌드 1개**. 일반화 X.

**필드** (각 트렌드):
- **title** — 영상에서 본 *포맷/밈 이름* 15자 이내 (예: "음식 ASMR 원테이크", "주문~플레이팅 컷")
- **reason** — 그 영상의 *조회수 + 게시일* 직접 인용 (예: "5일 전 게시, 850만회 조회 · 댓글 폭주"). grounding 데이터에 있는 숫자 그대로.
- **contentIdea** — 이 업종이 어떻게 따라할지 1문장 (예: "주문 받자마자 김밥 마는 모습을 30초 안에 원테이크로")
- **format** — reel / story / short / post / blog
- **hashtags** — 2~3개. 영상 제목에서 도출
- **referenceUrl** — **그 영상의 실제 URL (필수, null 금지)**. grounding 데이터의 URL 그대로.
- **strategyExample** — 그 영상의 *채널명/브랜드명* 1줄 또는 null (예: "백종원 유튜브 채널의 '5분 김밥' 영상")
- **tools** — 따라할 때 쓸 1~2개 도구 (CapCut/캡컷/InShot/Canva 등)

⚠️ 엄수:
- 5개 모두 *referenceUrl* 채울 것. 못 채우면 그 영상은 빼고 4개만 출력.
- 일반론("리뷰가 중요", "단골 만들기") 절대 금지. *영상 자체*가 중심.
- 코드블록·<cite> 태그 금지. 쌍따옴표 이스케이프.

JSON 배열만 응답:
[
  {
    "title": "포맷 이름 15자",
    "reason": "X일 전 게시, Y회 조회 — 핵심 매력 1문장",
    "contentIdea": "이 가게가 어떻게 따라할지 1문장",
    "format": "short",
    "hashtags": ["#태그1", "#태그2"],
    "referenceUrl": "https://www.youtube.com/watch?v=... (필수)",
    "strategyExample": "채널명 또는 브랜드명 1줄",
    "tools": [{"name": "CapCut", "purpose": "편집", "tier": "freemium", "url": "https://www.capcut.com"}]
  }
]`;

  // 3. Claude 호출 (Sonnet 4.6 · web_search 활성화 · 빠른 응답)
  const client = createAiClient(anthropicApiKey);
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3072,                         // 8192 → 3072 (짧은 응답)
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 3,                          // 8 → 3 (속도·안정성)
      } as unknown,
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
