/**
 * funding-normalizer.ts
 *
 * 라이브 정부 지원사업(K-Startup·기업마당, GovernmentSupportProgram) →
 * 펀딩 페이지의 StartupProgram 형태로 정규화.
 *
 *  텍스트 파싱으로 구조화 필드(연령·지역·업종·기간·상태)를 추출해 기존 매칭/필터에 흡수.
 *  추출 실패한 필드는 비워둔다(매칭에서 중립 처리 — 가짜값 금지).
 */

import type { GovernmentSupportProgram } from "../adapters/support-programs";
import type { StartupProgram, ApplicationStatus, ProgramCategory } from "../startup-programs";

/** 전국 17개 시·도 (지원대상/공고명에서 지역 제한 추출용) */
const REGION_DICT: string[] = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

/** 업종 키워드 → industryCategoryId (starter-data 카테고리와 일치) */
const INDUSTRY_KEYWORDS: Array<{ id: string; words: string[] }> = [
  { id: "food", words: ["음식", "외식", "요식", "식당", "food"] },
  { id: "cafe-dessert", words: ["카페", "디저트", "베이커리", "제과"] },
  { id: "retail", words: ["소매", "유통", "도소매", "판매업"] },
  { id: "beauty", words: ["미용", "뷰티", "헤어", "네일", "왁싱"] },
  { id: "fitness", words: ["헬스", "피트니스", "운동", "스포츠"] },
  { id: "education", words: ["교육", "학원", "에듀", "교습"] },
  { id: "pet", words: ["반려", "펫", "동물"] },
  { id: "living-service", words: ["생활서비스", "세탁", "청소", "수선"] },
  { id: "space", words: ["공간", "스터디카페", "임대"] },
  { id: "online-digital", words: ["온라인", "이커머스", "쇼핑몰", "전자상거래", "플랫폼"] },
  { id: "startup-tech", words: ["기술창업", "딥테크", "ai", "인공지능", "반도체", "바이오", "로보틱스", "it", "소프트웨어", "제조"] },
];

/**
 * 최대 나이(상한) 추출. "만 40세 이상"처럼 하한만 있으면 제한 없음(undefined).
 *  - "만 39세 이하/미만/까지" → 39 (상한 우선)
 *  - "만 20세 이상 ~ 만 39세 이하"(범위) → 39 (상한)
 *  - "청년" → 39
 */
export function extractMaxAge(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  // 0) "만 40세 이상" 브래킷이 포함되면 40대+도 신청 가능 → 사실상 연령 제한 없음.
  //    (K-Startup biz_trgt_age 가 "만 20세 미만,20~39,만 40세 이상" 식 전 연령대 나열 케이스)
  if (/(?:4\d|[5-9]\d)\s*세\s*이상/.test(text)) return undefined;
  // 1) 상한 명시 "N세 이하/미만/까지"
  const upper = text.match(/(\d{2})\s*세\s*(?:이하|미만|까지)/);
  if (upper) return Number(upper[1]);
  // 2) 범위 "N세 ~ M세" → 상한 M
  const range = text.match(/\d{2}\s*세[^0-9]{1,6}만?\s*(\d{2})\s*세/);
  if (range) return Number(range[1]);
  // 3) "만 N세 이상"(하한)만 있으면 상한 없음 → undefined
  if (/\d{2}\s*세\s*이상/.test(text) && !/이하|미만|까지/.test(text)) return undefined;
  if (t.includes("청년")) return 39; // 통상 청년 기준 만 39세
  return undefined;
}

/** 창업기간(biz_enyy "7년미만,3년미만,예비창업자") → [min, max] 연차. 없으면 undefined */
export function extractBusinessYearRange(text: string | undefined): [number, number] | undefined {
  if (!text) return undefined;
  const years = (text.match(/(\d+)\s*년/g) ?? []).map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
  if (years.length === 0) {
    // "예비창업자"만 있으면 0~0 (창업 전)
    if (text.includes("예비")) return [0, 0];
    return undefined;
  }
  return [0, Math.max(...years)];
}

/** 지원대상/공고명에서 지역 제한 추출 (없으면 전국 = undefined) */
export function extractRegions(text: string | undefined): string[] | undefined {
  if (!text) return undefined;
  const found = REGION_DICT.filter((r) => text.includes(r));
  return found.length > 0 ? found : undefined;
}

/** 텍스트에서 업종 추출 (없으면 전 업종 = undefined) */
export function extractIndustries(text: string | undefined): string[] | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  const ids = INDUSTRY_KEYWORDS.filter((g) => g.words.some((w) => t.includes(w.toLowerCase()))).map((g) => g.id);
  return ids.length > 0 ? Array.from(new Set(ids)) : undefined;
}

/** 시작/종료일 + 오늘 기준 모집 상태 산출 */
export function deriveStatus(start?: string, end?: string, todayISO?: string): ApplicationStatus {
  const today = (todayISO ?? new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  const s = start?.replace(/-/g, "");
  const e = end?.replace(/-/g, "");
  if (e && e < today) return "closed";
  if (s && s > today) return "upcoming";
  return "open";
}

/** 대기업·계열사 키워드 (기관명 기반 corporate 판별) */
const CORP_RE = /삼성|현대차?|기아|에스케이|sk\b|엘지|lg\b|네이버|naver|카카오|kakao|kt&g|kt\b|신한|국민은행|kb\b|우리은행|하나은행|롯데|포스코|posco|한화|cj\b|gs\b|두산|효성|아모레|토스|toss|배달의민족|우아한형제|당근|쿠팡|넥슨|엔씨|크래프톤|컴투스|넷마블|라인|line/i;

/**
 * 프로그램 분류 — 큐레이션·라이브 공통 규칙.
 *   우선순위: 대회(공모전류) > 대기업 > 지자체 > 민간·재단·대학 > 정부·공공.
 *   organizerType = K-Startup sprv_inst("공공기관"·"지자체"·"민간"·"교육기관").
 */
/** 17개 시·도 + 지역 산하기관 키워드 → 지자체(local) 신호 */
const LOCAL_RE = /서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|시청|도청|구청|군청|창조경제혁신센터|테크노파크|경제진흥원|산업진흥원|콘텐츠진흥원|관광공사|지역신용보증/;

export function classifyProgramCategory(
  programName: string,
  organizer: string,
  organizerType?: string,
): ProgramCategory {
  // 1. 대회/공모전 (프로그램 성격이 우선)
  if (/경진대회|공모전|해커톤|챌린지|오디션|콘테스트|경연|아이디어\s*공모/.test(programName)) return "competition";
  // 2. 대기업 (기관명)
  if (CORP_RE.test(organizer)) return "corporate";
  // 3. 지자체 — sprv_inst=지자체 OR 지역명·지역 산하기관(중앙 공공기관보다 우선해 직관적 분류)
  if (organizerType === "지자체" || LOCAL_RE.test(organizer)) return "local";
  // 4. 민간·재단·대학 (sprv_inst=민간/교육기관 또는 기관명)
  if (organizerType === "민간" || organizerType === "교육기관") return "private";
  if (/재단|벤처스|파트너스|액셀러|인큐베이|대학교?|투자조합|캐피탈|벤처투자/.test(organizer)) return "private";
  // 5. 정부·공공기관 (중앙) 또는 기본
  return "government";
}

/** 자금 성격 추정 */
function deriveFundingType(supportCategory: string): StartupProgram["fundingType"] {
  if (/자금|금융|융자|대출/.test(supportCategory)) return "cash";
  if (/보증/.test(supportCategory)) return "credit";
  if (/투자/.test(supportCategory)) return "equity";
  return "grant";
}

/**
 * 라이브 GovernmentSupportProgram → StartupProgram 정규화.
 *  @param todayISO 테스트 결정성용(미지정 시 오늘)
 */
export function normalizeLiveProgram(
  gov: GovernmentSupportProgram,
  todayISO?: string,
): StartupProgram {
  // 텍스트 파싱용 — 구조화 필드(K-Startup)가 있으면 그것을 우선, 없으면(기업마당) 텍스트에서 추출.
  const haystack = `${gov.programName} ${gov.targetDescription ?? ""}`;
  const start = gov.applicationStart;
  const end = gov.applicationEnd;
  const status = deriveStatus(start, end, todayISO);
  const seasonKo = start || end
    ? `신청 ${start ?? "?"} ~ ${end ?? "상시"}`
    : "상시·수시 (공고 확인)";

  // 연령: K-Startup biz_trgt_age(targetAge) 우선
  const maxAge = extractMaxAge(gov.targetAge) ?? extractMaxAge(haystack);
  // 지역: K-Startup supt_regin(region) 우선, "전국"이면 제한 없음
  const regions = gov.region && !gov.region.includes("전국")
    ? extractRegions(gov.region) ?? [gov.region.replace(/특별시|광역시|특별자치시|특별자치도|도$/g, "").slice(0, 2)]
    : extractRegions(haystack);
  // 창업기간: K-Startup biz_enyy(businessPeriod)
  const businessYearRange = extractBusinessYearRange(gov.businessPeriod);

  // 우대사항(prfn_matr)이 있으면 지원내용 뒤에 덧붙여 노출(유리한 점).
  const benefitKo = gov.preferentialNote
    ? `${gov.benefitDescription || gov.supportCategory} · 우대: ${gov.preferentialNote}`
    : (gov.benefitDescription || gov.supportCategory);

  return {
    id: gov.id,
    category: classifyProgramCategory(gov.programName, gov.organizerName, gov.organizerType),
    name: { ko: gov.programName, en: gov.programName },
    organizer: { ko: gov.organizerName || "정부·공공기관", en: gov.organizerName || "Government" },
    target: { ko: gov.targetDescription || gov.targetAge || "공고 상세 참조", en: gov.targetDescription || "See announcement" },
    benefit: { ko: benefitKo, en: benefitKo },
    season: { ko: seasonKo, en: seasonKo },
    url: gov.url || (gov.source === "bizinfo" ? "https://www.bizinfo.go.kr" : "https://www.k-startup.go.kr"),
    forSmallBiz: true,
    forFranchise: true,
    dataYear: (todayISO ?? new Date().toISOString()).slice(0, 4),
    maxAge,
    businessYearRange,
    industries: extractIndustries(haystack),
    regions,
    applicationStatus: status,
    applicationDeadline: end,
    fundingType: deriveFundingType(gov.supportCategory),
  };
}

/** 이름 정규화 (병합 중복제거용) — 공백·괄호·연도·차수 제거 */
export function normalizeName(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/\d{4}\s*년?/g, "")
    .replace(/제?\s*\d+\s*차/g, "")
    .replace(/[\s·\-_]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * 큐레이션 + 라이브(정규화 완료) 병합·중복제거.
 *  - 정규화 이름이 같으면 **큐레이션 우선**(루브릭·loanDetails 보유) 단, 라이브의 최신 마감일/상태로 갱신.
 *  - 큐레이션에 없는 라이브 프로그램은 추가(breadth).
 */
export function mergeFundingPrograms(
  curated: StartupProgram[],
  live: StartupProgram[],
): StartupProgram[] {
  const byKey = new Map<string, StartupProgram>();
  for (const p of curated) byKey.set(normalizeName(p.name.ko), p);

  for (const lp of live) {
    const key = normalizeName(lp.name.ko);
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      // 큐레이션 우선 + 라이브 최신 마감일/상태 반영(공고는 라이브가 최신).
      byKey.set(key, {
        ...existing,
        applicationDeadline: lp.applicationDeadline ?? existing.applicationDeadline,
        applicationStatus: lp.applicationStatus ?? existing.applicationStatus,
        season: lp.applicationDeadline ? lp.season : existing.season,
      });
    } else {
      byKey.set(key, lp);
    }
  }
  return Array.from(byKey.values());
}
