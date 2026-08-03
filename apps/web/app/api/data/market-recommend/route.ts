/**
 * POST /api/data/market-recommend
 *
 * 사용자가 입력한 「상권 희망 지역」 → 카카오 Local API 로 실시간 sub-area 후보 발굴 →
 *  실측(소진공·부동산원·행안부·프랜차이즈) 결정론 점수(market-scoring.ts) →
 *  LLM 은 해설만(market-narrator.ts, 실패 시 템플릿 — 2026-08-03 역할 축소).
 *
 * Why: 기존 buildRecommendedMarkets 는 정적 서울 행정동 데이터만 다뤄, 사용자가
 *  "마포구 망원동" / "수원 영통구" / "제주 애월" 처럼 특정 동을 입력하면 매칭 실패 →
 *  legacy fallback 으로 전락. Kakao 라이브 데이터를 쓰면 어느 지역이든 3+ 후보 보장.
 *
 * 인증: requireApiUser (Bearer token)
 * 레이트: 분당 10회 / 일 50회 (Kakao quota + Anthropic 비용 보호)
 */

import { NextResponse } from "next/server";
import { scoreCandidateDeterministic } from "../../_lib/market-scoring";
import { buildFactLines, narrateCandidates, buildTemplateNarration, mergeWarnings } from "../../_lib/market-narrator";
import type { RecommendationItem } from "@foundone/shared";
import { findDongPopulation, formatDongPopulationLine, DONG_POP_YM_LABEL } from "../../_lib/dong-population";
import {
  sbizCountsInRadius, areaKeyFor, upjongSigFor, recordAreaSnapshot, findAreaTrend, type AreaTrend,
  franchisePresenceInRadius, type FranchisePresence,
} from "../../_lib/sbiz-store";
import { getFranchiseBrandById, franchiseBrandsAll } from "@foundone/shared";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { findBrandRegional, formatBrandRegionalLine } from "../../_lib/franchise-regional";
import {
  findMarketRentDistricts,
  representativeRent,
  BUILDING_TYPE_LABEL,
  MARKET_RENT_QUARTER_LABEL,
} from "@foundone/shared";
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

/**
 * 동/가/읍/면 단위 cluster 키 추출.
 *  ⚠️ 2026-06-11 fix: 현 Kakao Local API 응답 document 에 region_3depth_name 이 없음
 *  → 항상 빈 cluster → 상권 후보가 입력 지역 1개로만 떨어지던 조용한 기능 저하.
 *  region_3depth_name 이 있으면 그대로, 없으면 address_name 에서 동 토큰을 파생.
 */
function districtKeyFromPlace(place: KakaoPlace): string | null {
  const fromField = place.region_3depth_name?.trim();
  if (fromField) return fromField;
  const addr = place.address_name?.trim();
  if (!addr) return null;
  const dong = addr.match(/(\S+(?:동|가|읍|면|리))/);
  if (dong) return dong[1];
  const gu = addr.match(/(\S+(?:구|시|군))/);
  return gu ? gu[1] : null;
}

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
  // 소진공 공식 카운트 (국세청 원천, 사업자 기준 — 카카오 지도보다 systematically 높음)
  officialSameCount?: number | null;
  officialTotalCount?: number | null;
  trend?: AreaTrend | null;   // 60일+ 이전 자체 스냅샷 대비 델타 (없으면 미표시)
  franchise?: FranchisePresence | null;   // 프랜차이즈 선택자만 — 같은 브랜드·동종 브랜드 반경 실측
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
      const district = districtKeyFromPlace(place);
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
        const district = districtKeyFromPlace(place);
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

// ── 4. 점수(결정론) + 해설(LLM) 조립 ─────────────────────────────
//  점수 = market-scoring.ts (실측 결정론) / 서술 = market-narrator.ts (LLM, 실패 시 템플릿).
//  실측 meta 는 여기서 결정론 부착 — LLM 미경유 (문구 왜곡·수치 변형 차단).

type ScoredItem = {
  id: string;
  title: string;
  score: number;
  summary: string;
  reasons: string[];
  warnings: string[];
  /** 결정론 실측 부착 (LLM 미경유) — 응답 조립 시 반드시 병합할 것.
   *  ⚠️ 2026-08-03 사고: 이 필드가 타입에 없어 스프레드가 tsc 를 우회했고,
   *  응답 조립부가 meta 를 새로 만들면서 실측 칩 전체가 유실됐다. */
  meta?: Record<string, string | number>;
};

/**
 * 후보 동명 → 부동산원 조사상권 실측 매칭 (372개, 분기 갱신 SSOT).
 *  시도 게이트를 위해 사용자의 지역 텍스트를 질의에 합친다 ("대전 둔산동" + "둔산동").
 *  매칭 없으면 null — 폴백·추정 금지 (조사상권 밖은 임대료를 말하지 않는 게 정직).
 */
function measuredRentFor(regionText: string, districtName: string): {
  district: string; bldgLabel: string; manwonPerM2: string; vacancyPct: number | null;
} | null {
  const matches = findMarketRentDistricts(`${regionText} ${districtName}`, 1);
  const top = matches[0];
  if (!top || top.confidence !== "high") return null;   // partial 매칭으로 남의 상권 시세 부착 금지
  const rep = representativeRent(top.entry);
  if (!rep) return null;
  const vac = top.entry.vacancyPct[rep.bldg];
  return {
    district: top.entry.district,
    bldgLabel: BUILDING_TYPE_LABEL[rep.bldg],
    manwonPerM2: (rep.thousandWonPerM2 / 10).toFixed(1),
    vacancyPct: typeof vac === "number" ? vac : null,
  };
}

/**
 * 후보별 실측 팩트 + 결정론 점수 + 서술을 조립.
 *  LLM 실패 시에도 전 후보 템플릿 서술로 성공 응답 (LLM 0 의존 경로).
 */
async function scoreAndNarrate(
  candidates: SubAreaCandidate[],
  ctx: { region: string; categoryId: string; subIndustryId?: string; capital?: number; language: "ko" | "en"; franchiseRegionalLine?: string | null },
  apiKey: string | null,
): Promise<{ items: ScoredItem[]; narration: "ai" | "template"; usage: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number } | null }> {
  // ① 후보별 실측 수집 + 결정론 점수
  const facts = candidates.map((cand) => {
    const rent = measuredRentFor(ctx.region, cand.districtName);
    const pop = findDongPopulation(ctx.region, cand.districtName);
    const det = scoreCandidateDeterministic({
      officialSameCount: cand.officialSameCount,
      competitionCount: cand.competitionCount,
      cafeCount: cand.cafeCount,
      subwayCount: cand.subwayCount,
      cultureCount: cand.cultureCount,
      franchise: cand.franchise ?? null,
      vacancyPct: rent?.vacancyPct ?? null,
      population: pop ? { age2030Pct: pop.age2030Pct, age40PlusPct: pop.age40PlusPct } : null,
      categoryId: ctx.categoryId,
      subIndustryId: ctx.subIndustryId,
    });
    const factLines = buildFactLines({
      districtName: cand.districtName, lat: cand.lat, lng: cand.lng,
      officialSameCount: cand.officialSameCount, officialTotalCount: cand.officialTotalCount,
      competitionCount: cand.competitionCount,
      cafeCount: cand.cafeCount, subwayCount: cand.subwayCount, cultureCount: cand.cultureCount,
      rent, pop, trend: cand.trend ?? null, franchise: cand.franchise ?? null,
    });
    return { cand, rent, pop, det, factLines };
  });

  // ② LLM 해설 (실패 = null → 템플릿)
  const narrated = apiKey
    ? await narrateCandidates(
        facts.map((f) => ({ districtName: f.cand.districtName, det: f.det, factLines: f.factLines })),
        ctx, apiKey,
      )
    : null;

  // ③ 조립 — 점수·경고는 서버 확정, LLM 은 서술만
  const items: ScoredItem[] = facts.map((f) => {
    const n = narrated?.byDistrict.get(f.cand.districtName) ?? buildTemplateNarration(f.cand.districtName, f.det);
    // 실측 meta — LLM 미경유 결정론 부착
    const meta: Record<string, string | number> = {
      scoreEngine: "measured-v1",
      scoreBreakdown: f.det.breakdown,
    };
    if (f.rent) {
      meta.measuredRent = `${f.rent.district} 상권 ${f.rent.bldgLabel} ㎡당 월 ${f.rent.manwonPerM2}만원 — 한국부동산원 ${MARKET_RENT_QUARTER_LABEL}`;
      if (f.rent.vacancyPct != null) meta.vacancyPct = f.rent.vacancyPct;
    }
    if (f.pop) meta.backPopulation = formatDongPopulationLine(f.pop);
    if (typeof f.cand.officialSameCount === "number") {
      meta.officialCompetition = `동종 ${f.cand.officialSameCount}곳${typeof f.cand.officialTotalCount === "number" ? ` · 전체 업소 ${f.cand.officialTotalCount.toLocaleString()}곳` : ""} — 소상공인시장진흥공단(국세청 원천), 500m`;
    }
    if (f.cand.franchise) {
      const fr = f.cand.franchise;
      meta.franchisePresence = `같은 브랜드 ${fr.sameBrand}개${fr.peers.length > 0 ? ` · 동종: ${fr.peers.map((x) => `${x.name} ${x.count}`).join(", ")}` : ""} — 소진공 상호명 매칭, 500m${fr.sampled ? " (동종 300개 표본)" : ""}`;
    }
    if (f.cand.trend) {
      meta.areaTrend = `${f.cand.trend.daysAgo}일 전 대비 동종 ${f.cand.trend.sameDelta >= 0 ? "+" : ""}${f.cand.trend.sameDelta}곳${f.cand.trend.totalDelta != null ? ` · 전체 ${f.cand.trend.totalDelta >= 0 ? "+" : ""}${f.cand.trend.totalDelta}곳` : ""} — 자체 관측 실측`;
    }
    return {
      id: f.cand.id,
      title: n.title,
      score: f.det.score,
      summary: n.summary,
      reasons: n.reasons,
      warnings: mergeWarnings(f.det.mandatoryWarnings, n.warnings),
      meta,
    };
  }).sort((a, b) => b.score - a.score);

  return { items, narration: narrated ? "ai" : "template", usage: narrated?.usage ?? null };
}

// ── 라우트 ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  // 분당 10회 — 프롬프트 비용·Kakao quota 보호
  const rl = await checkSimpleRateLimit({
    key: `market-recommend:${auth.userId}`,
    limit: 10, windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요. (분당 10회 한도)",
  });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });
  // 일 50회
  const dl = await checkDailyRateLimit({
    userId: auth.userId, feature: "market-recommend", limit: 50,
    message: "오늘의 상권 추천 한도(50회)를 모두 사용했습니다.",
  });
  if (!dl.ok) return NextResponse.json({ ok: false, error: dl.error }, { status: dl.status });

  let body: { region?: string;
    franchiseBrandId?: string; categoryId?: string; subIndustryId?: string; capital?: number; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const region = (body.region ?? "").trim();
  const categoryId = (body.categoryId ?? "food").trim();
  const subIndustryId = body.subIndustryId?.trim();
  const franchiseBrandId = typeof body.franchiseBrandId === "string" ? body.franchiseBrandId.trim() : "";
  const capital = typeof body.capital === "number" ? body.capital : undefined;
  const language: "ko" | "en" = body.language === "en" ? "en" : "ko";
  if (!region) {
    return NextResponse.json({ ok: false, error: "region required" }, { status: 400 });
  }

  // ⚠ process.env 직접 접근 금지 — Claude Code 등이 ANTHROPIC_API_KEY="" 로 덮어쓰는
  //    알려진 이슈가 있어 _lib/env.ts 의 getter 가 .env.local 을 fallback 으로 읽음.
  const kakaoKey = getEnvVar("KAKAO_REST_API_KEY");
  if (!kakaoKey) return NextResponse.json({ ok: false, error: "Kakao API 키가 설정되지 않았습니다." }, { status: 500 });
  // LLM 키 없어도 동작 — 점수는 결정론, 서술은 템플릿 폴백 (LLM 0 의존 경로)
  const anthropicKey = getAnthropicApiKey() ?? null;

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

  // 소진공 공식 카운트 보강 (2026-08-03 Phase A-1) — 후보당 ≤3콜, 일 10,000 쿼터 대비 미미.
  //   오류 ≠ 0개: 실패는 null 로 남겨 카카오 카운트로 폴백 (부분 실패도 합산 위조 금지).
  const sbizKey = process.env.MOIS_API_KEY;
  // 프랜차이즈 컨텍스트 (2026-08-03 사장님 스펙) — 브랜드 확정자만
  const fBrand = franchiseBrandId ? getFranchiseBrandById(franchiseBrandId) : undefined;
  // 시도 분포 — 공정위 신형 가족 단일 SSOT (전국수=시도합, 기준년도 라벨 필수. 구형 수치와 병기 금지)
  const fRegional = fBrand ? findBrandRegional(fBrand.id, region) : null;
  const fRegionalLine = fBrand && fRegional ? formatBrandRegionalLine(fBrand.name.ko, fRegional) : null;
  const peerNames = fBrand
    ? franchiseBrandsAll
        .filter((b) => b.id !== fBrand.id && (b.subIndustryIds ?? []).some((sid) => (fBrand.subIndustryIds ?? []).includes(sid)))
        .map((b) => b.name.ko)
        .slice(0, 12)
    : [];

  if (candidates.length < 1) {
    return NextResponse.json({
      ok: false,
      error: `"${region}" 주변에서 상권을 찾지 못했습니다. 더 넓은 범위로 입력해 주세요.`,
    }, { status: 404 });
  }

  // ③ 점수화 대상 확정 후에만 보강 — slice 밖 후보에 소진공 콜·추이 기록을 쓰지 않는다 (쿼터·지연)
  const targetCandidates = candidates.slice(0, 5);

  if (sbizKey) {
    const admin = getSupabaseAdmin();
    const sig = subIndustryId ? upjongSigFor(subIndustryId) : null;
    await Promise.all(targetCandidates.map(async (c) => {
      const counts = await sbizCountsInRadius(subIndustryId ?? "", c.lng, c.lat, 500, sbizKey);
      c.officialSameCount = counts.sameUpjong;
      c.officialTotalCount = counts.totalStores;
      // 개폐업 추이 — 스냅샷 축적 + 60일+ 델타 (개업일 필드가 없어 라이브 계산 불가 → 자체 원장이 유일)
      if (admin && sig && typeof counts.sameUpjong === "number") {
        const areaKey = areaKeyFor(c.lng, c.lat, 500);
        void recordAreaSnapshot(admin, { areaKey, upjongSig: sig, sameCount: counts.sameUpjong, totalCount: counts.totalStores });
        c.trend = await findAreaTrend(admin, { areaKey, upjongSig: sig, currentSame: counts.sameUpjong, currentTotal: counts.totalStores });
      }
      if (fBrand && subIndustryId) {
        c.franchise = await franchisePresenceInRadius(subIndustryId, fBrand.name.ko, peerNames, c.lng, c.lat, 500, sbizKey);
      }
    }));
  }

  // 메트릭 수집 (병렬)
  const competitionKw = competitionKeyword(categoryId, subIndustryId);
  const enriched = await Promise.all(targetCandidates.map((c) => gatherMetrics(c, competitionKw, kakaoKey)));

  // ④ 점수(결정론) + 해설(LLM, 실패 시 템플릿) — 항상 성공 응답
  const { items: scored, narration, usage } = await scoreAndNarrate(enriched, { region, categoryId, subIndustryId, capital, language, franchiseRegionalLine: fRegionalLine }, anthropicKey);

  // ⑤ RecommendationItem 형태로 정리 (lat/lng meta 에 포함 → 지도에서 즉시 핀 가능)
  const items: RecommendationItem[] = scored.map((s) => {
    const cand = enriched.find((e) => e.id === s.id);
    // ⚠️ 실측 meta(s.meta: measuredRent·backPopulation·officialCompetition·franchisePresence·areaTrend)
    //    를 먼저 깔고 지도용 필드를 얹는다 — 새로 만들면 실측 칩 전체 유실 (2026-08-03 P0 사고)
    const meta: Record<string, string | number> = { ...(s.meta ?? {}) };
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
        label: language === "ko"
          ? (narration === "ai" ? "실측 점수 + AI 해설" : "실측 점수 + 템플릿 해설")
          : (narration === "ai" ? "Measured score + AI narration" : "Measured score + template narration"),
        // 실측 축이 실제 붙은 원천만 인용 — 안 붙은 원천을 병기하면 그것도 위조
        sources: [
          {
            sourceName: "Kakao Local API",
            sourceUrl: "https://developers.kakao.com/docs/latest/en/local/dev-guide",
            verifiedAt: new Date().toISOString().slice(0, 10),
            confidence: "high" as const,
          },
          ...(meta.officialCompetition ? [{
            sourceName: "소상공인시장진흥공단 상가(상권)정보",
            sourceUrl: "https://www.data.go.kr/data/15012005/openapi.do",
            verifiedAt: new Date().toISOString().slice(0, 10),
            confidence: "high" as const,
          }] : []),
          ...(meta.measuredRent ? [{
            sourceName: "한국부동산원 상업용부동산 임대동향",
            sourceUrl: "https://www.reb.or.kr/r-one/",
            verifiedAt: new Date().toISOString().slice(0, 10),
            confidence: "high" as const,
          }] : []),
          ...(meta.backPopulation ? [{
            sourceName: "행정안전부 주민등록 인구통계",
            sourceUrl: "https://jumin.mois.go.kr/",
            verifiedAt: new Date().toISOString().slice(0, 10),
            confidence: "high" as const,
          }] : []),
        ],
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
    narration,
    franchiseRegional: fRegionalLine,
    items,
    centerLat: center.lat,
    centerLng: center.lng,
    source: "kakao+ai",
    tookMs: Date.now() - startedAt,
    cache: cacheStats,
  });
}
