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
  format: "reel" | "story" | "short" | "post" | "blog" | "campaign" | "ad";
  hashtags: string[];
  referenceUrl: string | null;
  howToExecute?: string[];
  strategyExample?: string;
  effectiveness?: string;
  tools?: TrendToolRecommendation[];
  // ── 2026-05-12 추가: 마케팅 캠페인 사례 모드 (쇼츠 밈 베끼기 → 캠페인 학습) ──
  /** 캠페인·광고 이름 (예: "Gemini Hey Mom", "Manus AI 데모") */
  campaignName?: string;
  /** 캠페인 운영 브랜드 (예: "Google", "Manus", "삼성전자") */
  brandName?: string;
  /** 검증된 조회수·도달 지표 (예: 1_200_000) — UI 가 표시 여부 결정 */
  viewCount?: number;
  /**
   * 이 캠페인에서 사장님이 *배워올 점* 1~2문장.
   * "어떻게 따라할지" 가 아니라 "왜 이 사례가 너의 업종에 의미 있는지" 강조.
   */
  lesson?: string;
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
  // 2026-05-12: categoryId 전달로 업종별 MIN_VIEW_COUNT 필터 적용 (조회수 500회 영상 차단)
  if (youtubeKey) {
    tasks.push((async () => {
      const videoCategoryId = YOUTUBE_CATEGORY_BY_INDUSTRY[categoryId];
      const videos = await fetchYoutubeForIndustry(youtubeKey, bizLabel, {
        videoCategoryId,
        categoryId,
      });
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

  // ⚠️ 2026-05-12 *대대적* 재설계 — 사장님 신고:
  //   "유튜브 영상 다 가져오는게 아니라 *마누스* 같은 AI 에이전트 데모,
  //    *제미나이 Hey Mom* 어버이날 광고처럼 실제 마케팅 캠페인 매일 찾아서 알려달라.
  //    지금 500회짜리 영상을 트렌드라고 알려주는데 이러면 안돼."
  //   →
  //   기존: 쇼츠 밈 베끼기 모드 ("주문~플레이팅 컷 따라하자")
  //   변경: 마케팅 *캠페인 학습* 모드 ("이 캠페인 사례가 너의 업종에 의미 있다, 배워라")
  //
  //   주요 변화:
  //   • title → 영상 포맷 이름이 아니라 *캠페인·광고 이름* (예: "Gemini Hey Mom")
  //   • brandName + campaignName 분리 — 어떤 브랜드의 어떤 캠페인인지 명시
  //   • lesson — "왜 이 사례가 너의 업종에 의미 있는가" (단순 베끼기 X)
  //   • viewCount — 조회수 명시 (UI 에 신뢰성 신호로 표시)
  //   • 화제성 기준선: 업종에 따라 1만~10만 이상만 트렌드로 라벨링
  const hasYoutubeData = grounding.youtubeVideos.length >= 3;
  const prompt = `오늘 ${today} · 한국 ${bizLabel} 업종 사장님이 *배워야 할* 마케팅 캠페인/광고 사례 5개.

${groundingBlock}

🎯 **목표**: 사장님이 "오 이런 광고가 화제구나, 우리 업종에도 의미 있겠다" 라고 *학습* 할 캠페인 5개.
   ⚠ **추상적 트렌드 카테고리·쇼츠 밈 베끼기 절대 금지**.
   ⚠ **조회수 적은 영상 (3만 미만, 테크는 1만 미만) 추천 절대 금지** — "트렌드" 라벨링 부적합.
   ✓ **실제로 화제된 광고·캠페인·바이럴 마케팅 사례** — 그 캠페인이 뭐였는지, 누가 했는지, 왜 화제였는지.

📌 **선정 기준**:
${hasYoutubeData
    ? `1. 위 [YouTube KR 실시간 트렌딩] 목록에서 ${bizLabel} 업종과 의미 있게 연결되는 *광고·캠페인·브랜드 콘텐츠* 우선.
2. 일반 사용자 콘텐츠(개인 vlog 등) 보다 *브랜드 마케팅* 우선.
3. 조회수 명시된 것만, 게시일 최근 30일 이내.`
    : `1. web_search 로 검색: "${bizLabel} 광고 캠페인 2026", "${bizLabel} 바이럴 마케팅 사례", "${bizLabel} brand viral ad May 2026"
2. 마케팅 전문 매체 (adage.com, adweek.com, adsofbrands.net, mediapost.com, 브랜드뉴스, 캠페인코리아 등) 우선 인용.
3. 게시일·조회수·평가 가능한 캠페인만 선정.`}
4. ${bizLabel} 업종에 직접 의미 있는 사례 우선 — 다른 업종이라도 보편적 마케팅 교훈이 있으면 OK.
5. **각 캠페인 1개 = 트렌드 1개**. 일반론 X.

📚 **참고 사례 톤** (이런 *수준*의 캠페인 찾으세요):
   • "Gemini Hey Mom" — Google 어버이날 캠페인, 감성 스토리텔링 + AI 제품 시연 결합
   • "Manus AI 데모 영상" — 2025년 출시 데모가 20시간 만에 100만뷰 (제품 자체가 광고)
   • 유명 패션·F&B 브랜드의 SNS 바이럴 (도브 #StopTheBeautyTest 등)
   ⚠ 이건 *참고 톤*일 뿐 — 매일 실제 검색해 *오늘 화제된* 캠페인을 찾으세요.

**필드** (각 트렌드):
- **title** — 캠페인·광고 별칭 25자 이내 (예: "Gemini Hey Mom 어버이날", "Manus AI 데모 영상")
- **brandName** — 캠페인 운영 브랜드 (예: "Google", "Manus", "삼성전자", "도브")
- **campaignName** — 캠페인 공식·통용 이름 (예: "Hey Mom", "Manus Launch Demo")
- **reason** — 왜 화제인지 1~2문장. *조회수·게시일·반응* 등 *구체 수치* 인용.
   (예: "2026-05-08 게시, 1,200,000회 조회, 댓글 8천 — 감성 스토리텔링이 AI 제품 시연과 결합되며 'AI도 따뜻할 수 있다' 메시지로 호평")
- **lesson** — ${bizLabel} 업종 사장님이 *배워올 점* 1~2문장.
   "어떻게 따라 만들지" 가 아니라 "*왜 이 사례가 의미 있는지·전략적 시사점*" 강조.
   (예: "감정 트리거(엄마) 를 제품 데모와 묶으면 광고가 광고처럼 느껴지지 않는다 — 같은 원리를 가게 스토리텔링에 적용 가능")
- **contentIdea** — 사장님 가게에 적용 가능한 *전술* 1문장. lesson 보다 구체적·실행 가능.
   (예: "어버이날 단골 손님 어머니께 보내는 손편지 영상 — 가게 정체성 + 가족 감성")
- **viewCount** — 정수로 조회수 (모르면 null). grounding 데이터의 숫자 그대로.
- **format** — "campaign" (광고 캠페인) / "ad" (광고 영상) / "reel" / "short" / "post" / "blog" 중 하나
- **hashtags** — 2~3개. 캠페인 관련 실제 해시태그
- **referenceUrl** — **실제 URL (필수, null 금지)**. grounding 또는 web_search 결과의 URL.
- **strategyExample** — 캠페인의 *핵심 전략 한 줄* (예: "감성 + AI 제품 시연의 결합")
- **tools** — 사장님이 비슷한 캠페인 만들 때 쓸 도구 1~2개 (CapCut, Canva, ChatGPT 등)

⚠️ 엄수:
- *referenceUrl* 비우면 그 트렌드는 빼고 4개만 출력. 5개 출력 무리하지 마세요.
- 일반론("리뷰가 중요") 금지. *구체 캠페인 사례 1개* 가 중심.
- 조회수 임계 미만 (외식 10만 / 테크 1만 / 기타 3만) 영상은 캠페인 사례여도 추천 금지.
- 코드블록·<cite> 태그 금지. 쌍따옴표 이스케이프.

JSON 배열만 응답:
[
  {
    "title": "캠페인 이름 25자",
    "brandName": "브랜드명",
    "campaignName": "캠페인 공식명",
    "reason": "구체 수치·반응 인용 1~2문장",
    "lesson": "이 업종이 배워올 전략적 시사점 1~2문장",
    "contentIdea": "실제 가게에 적용 가능한 전술 1문장",
    "viewCount": 1200000,
    "format": "campaign",
    "hashtags": ["#태그1", "#태그2"],
    "referenceUrl": "https://... (필수)",
    "strategyExample": "핵심 전략 한 줄",
    "tools": [{"name": "CapCut", "purpose": "편집", "tier": "freemium", "url": "https://www.capcut.com"}]
  }
]`;

  // 3. Claude 호출 (Sonnet 4.6 · web_search 활성화)
  // 2026-05-12: 캠페인 사례 모드 — web_search 횟수 3→5 로 증가 (마케팅 매체 도달 보장),
  // max_tokens 3072→4096 (lesson + brandName + campaignName 추가 필드 수용).
  const client = createAiClient(anthropicApiKey);
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 5,
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
