/**
 * POST /api/data/market-recommend
 *
 * 사용자가 입력한 「상권 희망 지역」 → 카카오 Local API 로 실시간 sub-area 후보 발굴 →
 *  각 후보의 경쟁/유동인구 proxy 메트릭 수집 → Claude 가 점수·이유·경고 생성.
 *
 * Why: 기존 buildRecommendedMarkets 는 정적 서울 행정동 데이터만 다뤄, 사용자가
 *  "마포구 망원동" / "수원 영통구" / "제주 애월" 처럼 특정 동을 입력하면 매칭 실패 →
 *  legacy fallback 으로 전락. Kakao 라이브 데이터를 쓰면 어느 지역이든 3+ 후보 보장.
 *
 * 인증: requireApiUser (Bearer token)
 * 레이트: 분당 10회 / 일 50회 (Kakao quota + Anthropic 비용 보호)
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { RecommendationItem } from "@build-up/shared";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../_lib/rate-limit";
import { getAnthropicApiKey, getEnvVar } from "../../_lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── 카카오 Local 카테고리 코드 (참고용) ────────────────────────────
//  FD6 = 음식점 / CE7 = 카페 / SW8 = 지하철역 / SC4 = 학교 / AC5 = 학원
//  CT1 = 문화시설 / AT4 = 관광명소 / CS2 = 편의점 / MT1 = 대형마트
//  HP8 = 병원 / BK9 = 은행 / PK6 = 주차장
const KAKAO_LOCAL = "https://dapi.kakao.com/v2/local";

type KakaoPlace = {
  id?: string;
  place_name: string;
  category_name?: string;
  category_group_code?: string;
  address_name?: string;
  road_address_name?: string;
  region_3depth_name?: string;
  x: string; // longitude
  y: string; // latitude
  distance?: string;
};

type KakaoSearchRes = { documents: KakaoPlace[]; meta?: { total_count?: number; pageable_count?: number } };

type SubAreaCandidate = {
  id: string;             // 안정적 id (district + lat coord)
  name: string;           // 사용자에게 보여줄 명칭
  districtName: string;   // 행정 동/면/리
  lat: number;
  lng: number;
  // metrics (수집됨)
  competitionCount?: number;       // 동종업종 매장 수 (500m 반경)
  cafeCount?: number;              // CE7 카페 수 (500m, 유동인구 proxy)
  subwayCount?: number;            // SW8 지하철역 (500m, 접근성)
  cultureCount?: number;           // CT1 문화시설 (500m, 앵커)
  totalCount?: number;             // 총 상가 밀도 proxy (CE7 + FD6, 300m)
};

// ── 카카오 호출 헬퍼 ────────────────────────────────────────────────
//  ⚠️ Kakao Local API 는 `KA` 헤더를 요구함 (2025+ 정책). 헤더에 `os` 와 `origin` 필드
//   둘 다 들어가야 함. 없으면 401 "KA Header is required but neither os nor origin field is given".
//   서버사이드에서도 동일 정책이라 origin 값으로 배포 URL (혹은 localhost) 을 넣어야 함.
function kakaoKaHeader(): string {
  const origin = getEnvVar("NEXT_PUBLIC_APP_URL")
    ?? getEnvVar("VERCEL_URL")?.replace(/^/, "https://")
    ?? "http://localhost:3000";
  return `sdk/1.0.0 os/javascript origin/${origin}`;
}

async function kakao<T = KakaoSearchRes>(
  path: string,
  params: Record<string, string | number | undefined>,
  apiKey: string,
): Promise<T | null> {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const url = `${KAKAO_LOCAL}/${path}?${sp.toString()}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
        KA: kakaoKaHeader(),
      },
      // Kakao Local API 는 캐시 가능
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[market-recommend] kakao", path, res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn("[market-recommend] kakao err", path, (e as Error).message);
    return null;
  }
}

// ── 카테고리 → 동종업종 키워드 (경쟁 카운트용) ─────────────────────
function competitionKeyword(categoryId: string, subIndustryId?: string): string {
  // sub-industry 가 있으면 더 정밀
  const subMap: Record<string, string> = {
    "korean-casual": "한식",
    "delivery-meals": "배달",
    "salad-healthy": "샐러드",
    "ramen-noodle": "국밥",
    "chicken-burger": "치킨",
    "western-pasta-brunch": "양식",
    "takeout-coffee": "카페",
    "specialty-coffee": "스페셜티 커피",
    "dessert-cafe": "디저트 카페",
    "bakery-studio": "베이커리",
    "icecream-bingsu": "빙수",
    "self-serve-cafe": "셀프 카페",
    "convenience-small": "편의점",
    "lifestyle-goods": "잡화",
    "beauty-supplies": "화장품",
    "fashion-accessories": "패션",
    "health-food-store": "건강식품",
    "hair-salon": "미용실",
    "nail-studio": "네일",
    "skin-care-room": "피부관리",
    "waxing-studio": "왁싱",
    "eyelash-brow": "속눈썹",
    "makeup-bridal": "메이크업",
    "pilates-studio": "필라테스",
    "pt-gym": "헬스장",
    "yoga-studio": "요가",
    "crossfit-box": "크로스핏",
    "golf-studio": "골프",
    "study-room": "독서실",
    "kids-academy": "어린이 학원",
    "adult-class": "성인 학원",
    "language-academy": "어학원",
    "coding-class": "코딩 학원",
    "small-study-room": "스터디룸",
    "pet-grooming": "애견 미용",
    "pet-supplies": "펫샵",
    "pet-hotel": "애견 호텔",
    "pet-cafe": "애견 카페",
    "pet-training-school": "애견 훈련",
    "laundry-service": "세탁소",
    "cleaning-service": "청소 서비스",
    "repair-service": "수리",
    "self-laundry": "코인세탁",
    "print-copy": "복사 출력",
    "device-repair": "휴대폰 수리",
    "guesthouse": "게스트하우스",
    "rental-studio": "스튜디오 대여",
    "party-room": "파티룸",
    "study-cafe-space": "스터디카페",
    "shared-office": "공유오피스",
  };
  if (subIndustryId && subMap[subIndustryId]) return subMap[subIndustryId];
  const catMap: Record<string, string> = {
    food: "음식점",
    cafe: "카페",
    retail: "소매",
    beauty: "미용",
    fitness: "헬스",
    education: "학원",
    pet: "펫샵",
    "living-service": "세탁",
    space: "스터디카페",
  };
  return catMap[categoryId] ?? "가게";
}

// ── 거리 helper (Haversine, 미터) ─────────────────────────────────
function distMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── 1. 지역명 → 중심 좌표 ─────────────────────────────────────────
//  Kakao address API 는 "도봉구 창동" 처럼 시 prefix 없는 부분 주소에 빈 응답 줄 수 있음 →
//  여러 변형을 순차 시도. 광역시 prefix 추가 / 키워드 검색 / 역 키워드 fallback.
async function geocodeRegion(region: string, kakaoKey: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = region.trim();
  if (!trimmed) return null;

  // 변형 후보 — 사용자 입력이 다양함 ("창동", "도봉구 창동", "서울 강남", "강남역", "수원 영통구" …)
  const cityPrefixes = ["서울", "서울특별시", "부산", "대구", "인천", "광주", "대전", "울산", "세종"];
  const hasCityPrefix = cityPrefixes.some((c) => trimmed.startsWith(c));
  const variants = Array.from(new Set([
    trimmed,
    !hasCityPrefix ? `서울 ${trimmed}` : null,           // 서울 도봉구 창동
    !hasCityPrefix ? `서울특별시 ${trimmed}` : null,      // 정식
    !trimmed.endsWith("역") ? `${trimmed}역` : null,     // 창동역 (지역명 = 역세권 가능)
  ].filter((v): v is string => typeof v === "string" && v.length > 0)));

  // ① 주소 검색 — 변형들 순차 시도 (첫 hit 즉시 반환)
  for (const q of variants) {
    const addr = await kakao("search/address.json", { query: q, size: 1 }, kakaoKey);
    if (addr?.documents?.[0]) {
      const d = addr.documents[0];
      const lat = parseFloat(d.y);
      const lng = parseFloat(d.x);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
  }

  // ② 키워드 검색 fallback — POI/역/명소 매칭 (강남, 창동역, 망원역 등에 강함)
  for (const q of variants) {
    const kw = await kakao("search/keyword.json", { query: q, size: 1 }, kakaoKey);
    if (kw?.documents?.[0]) {
      const d = kw.documents[0];
      const lat = parseFloat(d.y);
      const lng = parseFloat(d.x);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
  }

  // ③ 마지막 fallback — 입력에서 마지막 토큰만 키워드 검색 (예: "도봉구 창동" → "창동")
  const lastToken = trimmed.split(/\s+/).pop();
  if (lastToken && lastToken !== trimmed) {
    const kw = await kakao("search/keyword.json", { query: lastToken, size: 1 }, kakaoKey);
    if (kw?.documents?.[0]) {
      const d = kw.documents[0];
      const lat = parseFloat(d.y);
      const lng = parseFloat(d.x);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
  }

  return null;
}

// ── 2. 후보 sub-area 발굴 ─────────────────────────────────────────
//  전략: 사용자 입력 지역 중심에서 반경 ~3km 안의 "상가가 밀집한 동" 들을 찾는다.
//   ① CE7(카페) / FD6(음식점) / SW8(지하철역) 카테고리 코드로 numerous POI 수집
//   ② 키워드 "상권" / "맛집" 으로도 보강 (단순 키워드, 지역명 안 붙임 — 좌표가 이미 잡혀있음)
//   ③ region_3depth_name (동) 단위로 cluster — 동 별 첫 등장 place 의 좌표를 cluster 중심으로
//   ④ 사용자 입력 중심에서 가까운 동 우선, 단 같은 동만 나오면 인접 동도 포함되도록 radius 넉넉히
async function discoverSubAreas(
  region: string,
  center: { lat: number; lng: number },
  kakaoKey: string,
): Promise<SubAreaCandidate[]> {
  void region;  // 좌표가 이미 있으므로 region 텍스트는 더 안 씀 (compound 쿼리 회피)

  // 카테고리 코드 + 단순 키워드 모두 병렬. 각 검색은 size=15, sort=distance.
  const RADIUS = 3000;  // 3km — 도봉/마포/제주 같은 어떤 동도 인접 동까지 포함되는 적정 반경
  const requests: Array<Promise<KakaoSearchRes | null>> = [
    // 카테고리 코드 — 가장 신뢰도 높음
    kakao("search/category.json", {
      category_group_code: "CE7", x: center.lng, y: center.lat, radius: RADIUS, size: 15, sort: "distance",
    }, kakaoKey),
    kakao("search/category.json", {
      category_group_code: "FD6", x: center.lng, y: center.lat, radius: RADIUS, size: 15, sort: "distance",
    }, kakaoKey),
    kakao("search/category.json", {
      category_group_code: "SW8", x: center.lng, y: center.lat, radius: RADIUS, size: 15, sort: "distance",
    }, kakaoKey),
    // 키워드 보조 — "상권"/"맛집"/"거리" 같은 단순 키워드 (지역명 prefix 없이)
    kakao("search/keyword.json", {
      query: "맛집", x: center.lng, y: center.lat, radius: RADIUS, size: 15, sort: "distance",
    }, kakaoKey),
    kakao("search/keyword.json", {
      query: "거리", x: center.lng, y: center.lat, radius: RADIUS, size: 15, sort: "distance",
    }, kakaoKey),
  ];
  const results = await Promise.all(requests);

  // region_3depth_name (동) 단위 cluster. 같은 동의 첫 place 좌표가 cluster 중심.
  const byDistrict = new Map<string, SubAreaCandidate>();
  for (const r of results) {
    if (!r?.documents) continue;
    for (const place of r.documents) {
      const district = place.region_3depth_name?.trim();
      if (!district) continue;
      if (byDistrict.has(district)) continue;
      const lat = parseFloat(place.y);
      const lng = parseFloat(place.x);
      if (!isFinite(lat) || !isFinite(lng)) continue;
      byDistrict.set(district, {
        id: `kakao-${district.replace(/\s+/g, "-")}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        name: place.place_name,
        districtName: district,
        lat,
        lng,
      });
    }
  }

  // ── Fallback: 동 dedupe 결과가 1개 이하면 (예: 사용자 입력이 외진 곳) 키워드 ──
  //   "맛집"/"상권" 으로 더 넓은 5km 반경 한 번 더.
  if (byDistrict.size <= 1) {
    const fallback = await Promise.all([
      kakao("search/keyword.json", { query: "맛집", x: center.lng, y: center.lat, radius: 5000, size: 15, sort: "distance" }, kakaoKey),
      kakao("search/keyword.json", { query: "상권", x: center.lng, y: center.lat, radius: 5000, size: 15, sort: "distance" }, kakaoKey),
      kakao("search/category.json", { category_group_code: "CE7", x: center.lng, y: center.lat, radius: 5000, size: 15, sort: "distance" }, kakaoKey),
    ]);
    for (const r of fallback) {
      if (!r?.documents) continue;
      for (const place of r.documents) {
        const district = place.region_3depth_name?.trim();
        if (!district) continue;
        if (byDistrict.has(district)) continue;
        const lat = parseFloat(place.y);
        const lng = parseFloat(place.x);
        if (!isFinite(lat) || !isFinite(lng)) continue;
        byDistrict.set(district, {
          id: `kakao-${district.replace(/\s+/g, "-")}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
          name: place.place_name,
          districtName: district,
          lat,
          lng,
        });
      }
    }
  }

  // ── 최종 안전망: 그래도 1개 이하면, 입력 지역 중심점 자체를 단일 후보로 ──
  //   "도봉구 창동" 처럼 dedupe 결과가 같은 동 1개뿐이어도 점수화는 가능.
  if (byDistrict.size === 0) {
    return [{
      id: `kakao-center-${center.lat.toFixed(4)}-${center.lng.toFixed(4)}`,
      name: region,
      districtName: region,
      lat: center.lat,
      lng: center.lng,
    }];
  }

  // 중심에 가까운 순 정렬, 최대 6개
  return Array.from(byDistrict.values())
    .map((c) => ({ ...c, _d: distMeters(center.lat, center.lng, c.lat, c.lng) }))
    .sort((a, b) => a._d - b._d)
    .slice(0, 6)
    .map(({ _d: _omit, ...rest }) => { void _omit; return rest; });
}

// ── 3. 각 sub-area 메트릭 수집 ────────────────────────────────────
async function gatherMetrics(
  sub: SubAreaCandidate,
  competitionKw: string,
  kakaoKey: string,
): Promise<SubAreaCandidate> {
  // 4개 카테고리 검색을 병렬 — 각 검색은 size=15 로 limit (실제 수치는 meta.total_count 사용)
  const [comp, cafe, subway, culture] = await Promise.all([
    // 동종업종 경쟁
    kakao("search/keyword.json", {
      query: competitionKw,
      x: sub.lng, y: sub.lat, radius: 500, size: 15, sort: "accuracy",
    }, kakaoKey),
    // CE7 카페 (유동 proxy)
    kakao("search/category.json", {
      category_group_code: "CE7",
      x: sub.lng, y: sub.lat, radius: 500, size: 15,
    }, kakaoKey),
    // SW8 지하철역 (접근성)
    kakao("search/category.json", {
      category_group_code: "SW8",
      x: sub.lng, y: sub.lat, radius: 500, size: 15,
    }, kakaoKey),
    // CT1 문화시설 (앵커)
    kakao("search/category.json", {
      category_group_code: "CT1",
      x: sub.lng, y: sub.lat, radius: 500, size: 15,
    }, kakaoKey),
  ]);

  return {
    ...sub,
    competitionCount: comp?.meta?.pageable_count ?? comp?.documents?.length ?? 0,
    cafeCount: cafe?.meta?.pageable_count ?? cafe?.documents?.length ?? 0,
    subwayCount: subway?.documents?.length ?? 0,
    cultureCount: culture?.documents?.length ?? 0,
    totalCount:
      (cafe?.meta?.pageable_count ?? cafe?.documents?.length ?? 0) +
      (comp?.meta?.pageable_count ?? comp?.documents?.length ?? 0),
  };
}

// ── 4. Claude 점수화 ────────────────────────────────────────────
type ScoredItem = {
  id: string;
  title: string;
  score: number;
  summary: string;
  reasons: string[];
  warnings: string[];
};

/**
 * Static 한국 창업 상권 도메인 지식 — Sonnet 4.6 cache breakpoint 활성화 (≥1024 토큰).
 *  ⚡ Prompt caching:
 *    - 5분 TTL 기본 (March 2026~). 한 사용자가 여러 지역을 비교 검색할 때 90% 비용 절감.
 *    - 5-min cache write: 1.25× / cache read: 0.1× / no cache: 1.0× (대비 약 88% 절감 hit 시).
 *    - tools → system → messages 순서. 우리는 tools 없으므로 system 의 마지막 블록에 cache_control.
 *  ※ 사용자별 가변 컨텍스트 (지역/자본금/메트릭) 는 이 블록 밖 (user message) 에 둬야 캐시 깨지지 않음.
 */
const SCORING_SYSTEM_PROMPT = `당신은 한국 창업 상권 분석 전문가입니다. 사용자의 희망 지역 주변 후보 sub-area 들을 Kakao Local API 라이브 메트릭 + 한국 창업 도메인 경험으로 0~100점 점수화합니다.

## 평가 프레임워크 (5축)
**1. 동종업종 경쟁 강도 (Competition Density)** — 500m 반경 동종업종 매장 수
- 0~3개: 시장 미성숙 또는 부적합 입지 → 시작점 60점, 위험 시그널
- 4~15개: 적정 경쟁 → 기준점수 그대로
- 16~35개: 활성 시장, 차별화 필요 → 그대로 (단 차별화 reasons 강조)
- 36~60개: 과밀 시장 → -10~-15점, 차별화 전략 강력 요구
- 61개+: 레드오션 → -20점, 명확한 차별화 없으면 진입 비추천

**2. 유동인구 Proxy (CE7 카페 밀도, 500m 반경)**
- 30개+: 강력한 유동 → +10점 (스타벅스·이디야 등 브랜드가 1차로 검증한 자리)
- 10~29개: 양호 → +5점
- 5~9개: 보통 → ±0
- 0~4개: 유동 부족 → -5~-10점, "방문자가 발견하기 어려움" warning

**3. 접근성 (SW8 지하철역, 500m 반경)**
- 1개+: +5점 (역세권 효과)
- 0개: ±0 (단 차량 접근성/주거지 입지면 OK, 따로 reason 보강)

**4. 앵커 시설 (CT1 문화시설, 500m 반경)**
- 5개+: +5점 (영화관/도서관/공연장 = 사람이 머무르는 시간 증가)
- 1~4개: ±0
- 0개: -3점 only if 업종이 앵커 의존적 (카페/디저트/엔터)

**5. 업종-입지 적합성 (정성 판단)**
- 미용/뷰티: 주거지+상권 혼합 동 (망원/연남/성수) > 유흥가
- 학원·교육: 주거지 + 학교 인접 > 유흥가/오피스가
- 헬스/필라테스: 주거지 + 오피스 혼합 > 관광지
- 카페·디저트: 유동 + 문화시설 가까울수록 ↑
- 한식/국밥: 오피스가/주거지 점심 수요 > 유흥가
- 펫: 주거지 (특히 30~40대 거주율 높은 동) > 오피스가
- 게스트하우스/숙박: 관광지/역세권 > 주거지

## 한국 임대료 밴드 참고 (자본금 매칭)
- **1군 (월 임대 800만+)**: 강남/명동/홍대/성수동 메인 / 가로수길 / 청담 / 이태원 메인
- **2군 (월 임대 300~700만)**: 망원/연남/한남/익선동 / 합정 / 신촌 / 건대입구
- **3군 (월 임대 100~250만)**: 일반 주거지 동, 비-강남 행정동, 외곽 신도시
- **자본금 1억 미만 + 1군 후보** = warning ("월 고정비 부담 + 회수 기간 길어짐")
- **자본금 1억 미만 + 2군 후보** = neutral
- **자본금 3억+ + 3군 후보** = warning ("자본 활용 비효율, 더 좋은 입지 가능성")

## 자주 발생하는 실패 시그널
- 동종업종 60개+ + 카페 밀도 5개 미만 = "과밀 + 유동 부족" 최악 조합 (점수 50 이하)
- 지하철역 0 + 문화시설 0 + 카페 5개 미만 = 외진 입지 (-15)
- 한적 주거지에 "유흥/엔터" 업종 추천 = 업종 mismatch warning
- 학원·교육 업종에 유흥가 추천 = 학부모 거부감 + 야간 안전 issue warning

## 출력 형식
JSON 배열만 출력. 점수 높은 순으로 정렬. 5개 후보 입력 시 5개 모두 평가 (3개 미만이면 입력만큼만).

[
  {
    "districtName": "후보의 정확한 동 이름 (입력 그대로 — 매칭 키)",
    "title": "사용자에게 보여줄 매력적 명칭 (예: '망원역 카페거리', '서교동 메인 골목')",
    "score": 0~100 정수,
    "summary": "한 문장 요약 — 이 sub-area 의 정체성 + 사용자 업종 적합도 (60자 내외)",
    "reasons": ["메트릭에 근거한 강점 2~3개. 구체적 숫자 인용. 예: '카페 32개로 유동 검증된 상권', '경쟁 12개로 차별화 여지 있음'"],
    "warnings": ["주의 0~2개. 메트릭 + 자본금 + 업종 적합성 기반. 없으면 빈 배열"]
  }
]

JSON 외 어떤 텍스트도 출력하지 마세요. \`\`\`json 마크다운 펜스도 사용 금지. 첫 글자가 [ 로 시작.`;

async function scoreWithClaude(
  candidates: SubAreaCandidate[],
  ctx: { region: string; categoryId: string; subIndustryId?: string; capital?: number; language: "ko" | "en" },
  apiKey: string,
): Promise<{ items: ScoredItem[]; usage: Anthropic.Messages.Usage | null }> {
  const ko = ctx.language === "ko";
  const candidateLines = candidates.map((c, i) => {
    return `${i + 1}. ${c.districtName} (lat=${c.lat.toFixed(4)}, lng=${c.lng.toFixed(4)})
   - 동종업종 매장: ${c.competitionCount ?? 0}개 (500m 반경)
   - 카페 밀도: ${c.cafeCount ?? 0}개 (유동인구 proxy)
   - 지하철역: ${c.subwayCount ?? 0}개 (접근성)
   - 문화시설: ${c.cultureCount ?? 0}개 (앵커 시설)`;
  }).join("\n\n");

  // 사용자 메시지 — dynamic 부분만. 캐시 깨지지 않게 system 과 분리.
  const userPrompt = `## 사용자 컨텍스트
- 희망 지역: "${ctx.region}"
- 업종 카테고리: ${ctx.categoryId}${ctx.subIndustryId ? ` (세부: ${ctx.subIndustryId})` : ""}
- 자본금: ${ctx.capital ? `${(ctx.capital / 10000).toLocaleString()}만원` : "미설정"}
- 응답 언어: ${ko ? "한국어" : "English"}

## 후보 sub-area 메트릭 (Kakao Local API 라이브)
${candidateLines}

위 평가 프레임워크에 따라 ${Math.min(candidates.length, 5)}개를 점수화하세요. JSON 배열만 출력.`;

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    // ⚡ system 을 array 로 두고 마지막 블록에 cache_control — 5분 TTL 기본
    //    static 도메인 지식 (~2-3K 토큰) 이 매 호출마다 캐시에서 재사용됨.
    system: [
      {
        type: "text",
        text: SCORING_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("\n");
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) {
    console.warn("[market-recommend] claude returned no JSON array | first 300:", text.slice(0, 300));
    return { items: [], usage: response.usage };
  }
  let parsed: Array<{ districtName: string; title: string; score: number; summary: string; reasons?: string[]; warnings?: string[] }> = [];
  try {
    parsed = JSON.parse(m[0].replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, ""));
  } catch (e) {
    console.warn("[market-recommend] claude json parse fail:", (e as Error).message);
    return { items: [], usage: response.usage };
  }
  // candidate 와 매칭해서 id 부여
  const items: ScoredItem[] = parsed.map((p) => {
    const cand = candidates.find((c) => c.districtName === p.districtName) ?? candidates[0];
    return {
      id: cand?.id ?? `kakao-${p.districtName}`,
      title: p.title,
      score: Math.max(0, Math.min(100, Math.round(p.score))),
      summary: p.summary,
      reasons: Array.isArray(p.reasons) ? p.reasons.slice(0, 4) : [],
      warnings: Array.isArray(p.warnings) ? p.warnings.slice(0, 3) : [],
    };
  });
  return { items, usage: response.usage };
}

// ── 라우트 ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  // 분당 10회 — 프롬프트 비용·Kakao quota 보호
  const rl = checkSimpleRateLimit({
    key: `market-recommend:${auth.userId}`,
    limit: 10, windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요. (분당 10회 한도)",
  });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });
  // 일 50회
  const dl = checkDailyRateLimit({
    userId: auth.userId, feature: "market-recommend", limit: 50,
    message: "오늘의 상권 추천 한도(50회)를 모두 사용했습니다.",
  });
  if (!dl.ok) return NextResponse.json({ ok: false, error: dl.error }, { status: dl.status });

  let body: { region?: string; categoryId?: string; subIndustryId?: string; capital?: number; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const region = (body.region ?? "").trim();
  const categoryId = (body.categoryId ?? "food").trim();
  const subIndustryId = body.subIndustryId?.trim();
  const capital = typeof body.capital === "number" ? body.capital : undefined;
  const language: "ko" | "en" = body.language === "en" ? "en" : "ko";
  if (!region) {
    return NextResponse.json({ ok: false, error: "region required" }, { status: 400 });
  }

  // ⚠ process.env 직접 접근 금지 — Claude Code 등이 ANTHROPIC_API_KEY="" 로 덮어쓰는
  //    알려진 이슈가 있어 _lib/env.ts 의 getter 가 .env.local 을 fallback 으로 읽음.
  const kakaoKey = getEnvVar("KAKAO_REST_API_KEY");
  if (!kakaoKey) return NextResponse.json({ ok: false, error: "Kakao API 키가 설정되지 않았습니다." }, { status: 500 });
  const anthropicKey = getAnthropicApiKey();
  if (!anthropicKey) return NextResponse.json({ ok: false, error: "Anthropic API 키가 설정되지 않았습니다." }, { status: 500 });

  const startedAt = Date.now();

  // ① 지오코딩
  const center = await geocodeRegion(region, kakaoKey);
  if (!center) {
    return NextResponse.json({
      ok: false,
      error: `"${region}" 위치를 찾을 수 없습니다. 더 구체적으로 입력해 주세요 (예: "마포구 망원동").`,
    }, { status: 404 });
  }

  // ② 후보 sub-area 발굴
  const candidates = await discoverSubAreas(region, center, kakaoKey);
  if (candidates.length < 1) {
    return NextResponse.json({
      ok: false,
      error: `"${region}" 주변에서 상권을 찾지 못했습니다. 더 넓은 범위로 입력해 주세요.`,
    }, { status: 404 });
  }

  // ③ 메트릭 수집 (병렬, 단 후보 수 제한해 quota 보호)
  const targetCandidates = candidates.slice(0, 5);
  const competitionKw = competitionKeyword(categoryId, subIndustryId);
  const enriched = await Promise.all(targetCandidates.map((c) => gatherMetrics(c, competitionKw, kakaoKey)));

  // ④ Claude 점수화 (prompt caching: static system 프롬프트 = ephemeral cached)
  const { items: scored, usage } = await scoreWithClaude(enriched, { region, categoryId, subIndustryId, capital, language }, anthropicKey);
  if (scored.length === 0) {
    return NextResponse.json({
      ok: false,
      error: "AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    }, { status: 502 });
  }

  // ⑤ RecommendationItem 형태로 정리 (lat/lng meta 에 포함 → 지도에서 즉시 핀 가능)
  const items: RecommendationItem[] = scored.map((s) => {
    const cand = enriched.find((e) => e.id === s.id);
    const meta: Record<string, string | number> = {};
    if (cand) {
      meta.districtName = cand.districtName;
      meta.lat = cand.lat;
      meta.lng = cand.lng;
      if (cand.competitionCount !== undefined) meta.competitionCount = cand.competitionCount;
      if (cand.cafeCount !== undefined) meta.cafeCount = cand.cafeCount;
      if (cand.subwayCount !== undefined) meta.subwayCount = cand.subwayCount;
      if (cand.cultureCount !== undefined) meta.cultureCount = cand.cultureCount;
    }
    return {
      id: s.id,
      title: s.title,
      score: s.score,
      summary: s.summary,
      reasons: s.reasons,
      warnings: s.warnings,
      meta,
      freshness: {
        status: "fresh",
        label: language === "ko" ? "Kakao Local + AI 실시간 분석" : "Kakao Local + AI live",
        sources: [{
          sourceName: "Kakao Local API",
          sourceUrl: "https://developers.kakao.com/docs/latest/en/local/dev-guide",
          verifiedAt: new Date().toISOString().slice(0, 10),
          confidence: "high",
        }],
        lastCheckedAt: new Date().toISOString().slice(0, 10),
      },
    };
  });

  // Cache hit/miss telemetry — 디버깅·비용 모니터링용. 클라이언트는 무시해도 OK.
  //  cache_creation_input_tokens > 0 = 캐시 새로 생성 (첫 호출 / 5분 만료 후)
  //  cache_read_input_tokens > 0    = 캐시 재사용 (90% 비용 절감)
  const cacheStats = usage ? {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
  } : null;

  return NextResponse.json({
    ok: true,
    items,
    centerLat: center.lat,
    centerLng: center.lng,
    source: "kakao+ai",
    tookMs: Date.now() - startedAt,
    cache: cacheStats,
  });
}
