/**
 * Naver DataLab & Search API 어댑터 — 한국 트렌드 데이터 소스.
 *
 * 제공 기능:
 * 1. DataLab 검색어 트렌드: 키워드 그룹별 시계열 비교 (상대 수치 0~100)
 * 2. Search 블로그: 최근 블로그 포스트 (밈·유행 원천)
 * 3. Search 카페: 카페 글 (동네 상권 반응)
 *
 * 인증: NAVER_CLIENT_ID + NAVER_CLIENT_SECRET (무료, Naver Developer Center)
 * Rate limit: 25,000 requests/day (무료 티어)
 */

type NaverCreds = { clientId: string; clientSecret: string };

// ─── 1. DataLab 검색어 트렌드 ───

export type DataLabGroup = {
  groupName: string;
  keywords: string[];
};

export type DataLabResult = {
  title: string;                   // 기간 요약
  keywords: Array<{
    title: string;                   // 키워드 그룹 이름
    ratio: number;                   // 기간 평균 상대 수치 (0~100)
    trend: "up" | "down" | "flat";  // 최근 대비 방향성
  }>;
};

/**
 * 최근 30일 키워드 그룹 검색 추이 비교.
 * 트렌드 분석용 — 어떤 키워드가 "오르고 있는지" 파악.
 */
export async function fetchNaverDataLab(
  creds: NaverCreds,
  groups: DataLabGroup[],
  options: { days?: number } = {}
): Promise<DataLabResult | null> {
  const days = options.days ?? 30;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 86400000);
  const toStr = (d: Date) => d.toISOString().slice(0, 10);

  const body = {
    startDate: toStr(startDate),
    endDate: toStr(endDate),
    timeUnit: "date" as const,
    keywordGroups: groups.slice(0, 5).map((g) => ({
      groupName: g.groupName,
      keywords: g.keywords.slice(0, 20),
    })),
  };

  try {
    const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": creds.clientId,
        "X-Naver-Client-Secret": creds.clientSecret,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      startDate: string;
      endDate: string;
      results: Array<{
        title: string;
        keywords: string[];
        data: Array<{ period: string; ratio: number }>;
      }>;
    };

    const keywords = data.results.map((r) => {
      const points = r.data;
      if (points.length === 0) return { title: r.title, ratio: 0, trend: "flat" as const };
      const avg = points.reduce((s, p) => s + p.ratio, 0) / points.length;
      // 최근 7일 vs 이전 23일 비교
      const recent = points.slice(-7);
      const past = points.slice(0, -7);
      const recentAvg = recent.length > 0 ? recent.reduce((s, p) => s + p.ratio, 0) / recent.length : 0;
      const pastAvg = past.length > 0 ? past.reduce((s, p) => s + p.ratio, 0) / past.length : recentAvg;
      const delta = pastAvg > 0 ? ((recentAvg - pastAvg) / pastAvg) * 100 : 0;
      const trend: "up" | "down" | "flat" = delta > 10 ? "up" : delta < -10 ? "down" : "flat";
      return { title: r.title, ratio: Math.round(avg * 10) / 10, trend };
    });

    return {
      title: `${data.startDate} ~ ${data.endDate}`,
      keywords,
    };
  } catch (err) {
    console.warn("[Naver DataLab] fetch failed", err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── 2. Naver Search (블로그·카페) ───

export type NaverSearchItem = {
  title: string;        // HTML 태그 제거된 제목
  description: string;  // 발췌문
  link: string;
  bloggerName?: string;
  postdate?: string;    // YYYYMMDD
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

/**
 * 네이버 블로그 검색 — 업종·키워드로 최근 실제 포스트 수집.
 * 밈·유행·실사용 후기의 원천.
 */
export async function fetchNaverBlogSearch(
  creds: NaverCreds,
  query: string,
  options: { display?: number; sort?: "sim" | "date" } = {}
): Promise<NaverSearchItem[]> {
  const display = Math.min(options.display ?? 10, 30);
  const sort = options.sort ?? "date"; // 최신순 기본

  try {
    const url = new URL("https://openapi.naver.com/v1/search/blog.json");
    url.searchParams.set("query", query);
    url.searchParams.set("display", String(display));
    url.searchParams.set("sort", sort);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": creds.clientId,
        "X-Naver-Client-Secret": creds.clientSecret,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items: Array<{ title: string; description: string; link: string; bloggername?: string; postdate?: string }>;
    };
    return data.items.map((it) => ({
      title: stripHtml(it.title),
      description: stripHtml(it.description),
      link: it.link,
      bloggerName: it.bloggername,
      postdate: it.postdate,
    }));
  } catch (err) {
    console.warn("[Naver Blog] fetch failed", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── 3. 업종별 키워드 그룹 생성 헬퍼 ───

/**
 * 업종별 DataLab 분석용 키워드 그룹 세트.
 * 오르고 있는 키워드를 감지해 트렌드 프롬프트에 주입.
 */
export function getIndustryKeywordGroups(industryCategoryId: string): DataLabGroup[] {
  const groups: Record<string, DataLabGroup[]> = {
    food: [
      { groupName: "수제버거·아메리칸", keywords: ["수제버거", "스매시버거", "아메리칸다이너"] },
      { groupName: "한식 트렌드", keywords: ["한상차림", "반찬가게", "한식 파인다이닝"] },
      { groupName: "매운맛", keywords: ["매운맛", "마라탕", "엽기떡볶이"] },
      { groupName: "건강식", keywords: ["샐러드", "포케", "그레인볼"] },
      { groupName: "야식·심야", keywords: ["야식", "심야식당", "배달야식"] },
    ],
    "cafe-dessert": [
      { groupName: "스페셜티 커피", keywords: ["스페셜티커피", "에스프레소바", "핸드드립"] },
      { groupName: "디저트 트렌드", keywords: ["크로플", "두바이초콜릿", "일본디저트"] },
      { groupName: "브런치", keywords: ["브런치카페", "감성카페", "포토스팟"] },
      { groupName: "저당·건강", keywords: ["저당디저트", "비건디저트", "그릭요거트"] },
      { groupName: "음료 트렌드", keywords: ["말차라떼", "아인슈페너", "더티초코"] },
    ],
    retail: [
      { groupName: "프리미엄 소비", keywords: ["프리미엄", "한정판", "명품"] },
      { groupName: "친환경·제로웨이스트", keywords: ["제로웨이스트", "리필스테이션", "친환경"] },
      { groupName: "로컬 브랜드", keywords: ["로컬브랜드", "독립매장", "편집숍"] },
    ],
    beauty: [
      { groupName: "피부 트렌드", keywords: ["글래스스킨", "피부장벽", "수분광채"] },
      { groupName: "시술 트렌드", keywords: ["울쎄라", "볼륨라인", "레이저토닝"] },
      { groupName: "남성 뷰티", keywords: ["남자피부관리", "맨즈스킨케어"] },
    ],
    fitness: [
      { groupName: "운동 트렌드", keywords: ["필라테스", "크로스핏", "러닝"] },
      { groupName: "홈트레이닝", keywords: ["홈트", "홈짐", "실내운동"] },
    ],
    "online-digital": [
      { groupName: "커머스 트렌드", keywords: ["무신사", "에이블리", "라이브커머스"] },
      { groupName: "구독 경제", keywords: ["구독박스", "정기배송"] },
    ],
    "startup-tech": [
      { groupName: "AI SaaS", keywords: ["AI 툴", "ChatGPT", "Claude"] },
      { groupName: "스타트업", keywords: ["스타트업", "시드투자", "TIPS"] },
    ],
  };
  return groups[industryCategoryId] ?? groups.food;
}

/**
 * 업종별 블로그 검색 쿼리 세트.
 */
export function getIndustryBlogQueries(industryCategoryId: string): string[] {
  const queries: Record<string, string[]> = {
    food: ["맛집 트렌드", "요즘 인기 메뉴", "오픈 신상 음식점"],
    "cafe-dessert": ["요즘 카페", "디저트 트렌드", "감성카페 추천"],
    retail: ["요즘 뜨는 브랜드", "편집숍 추천"],
    beauty: ["피부관리 트렌드", "요즘 시술"],
    fitness: ["운동 트렌드", "PT 추천"],
    "online-digital": ["스마트스토어 트렌드", "라이브커머스"],
    "startup-tech": ["스타트업 트렌드", "AI 툴 추천"],
  };
  return queries[industryCategoryId] ?? queries.food;
}
