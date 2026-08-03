/**
 * market-geo.ts — 카카오 Local 호출·지오코딩 공유 헬퍼 (2026-08-03 추출)
 *
 * market-recommend(후보 발굴+점수)와 market-snapshot(지역 실측 스냅샷)이 공유.
 *  추출만 — 동작 불변 (원본: market-recommend/route.ts).
 */
import { getEnvVar } from "./env";

const KAKAO_LOCAL = "https://dapi.kakao.com/v2/local";

export type KakaoPlace = {
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

export type KakaoSearchRes = { documents: KakaoPlace[]; meta?: { total_count?: number; pageable_count?: number } };

//  ⚠️ Kakao Local API 는 `KA` 헤더를 요구함 (2025+ 정책). os 와 origin 필드 둘 다 필요.
function kakaoKaHeader(): string {
  const origin = getEnvVar("NEXT_PUBLIC_APP_URL")
    ?? getEnvVar("VERCEL_URL")?.replace(/^/, "https://")
    ?? "http://localhost:3000";
  return `sdk/1.0.0 os/javascript origin/${origin}`;
}

export async function kakao<T = KakaoSearchRes>(
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
      headers: { Authorization: `KakaoAK ${apiKey}`, KA: kakaoKaHeader() },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[market-geo] kakao", path, res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn("[market-geo] kakao err", path, (e as Error).message);
    return null;
  }
}

/** 사용자 지역 텍스트 → 좌표. 주소 → 키워드 → 마지막 토큰 3단 폴백. */
export async function geocodeRegion(region: string, kakaoKey: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = region.trim();
  if (!trimmed) return null;

  const cityPrefixes = ["서울", "서울특별시", "부산", "대구", "인천", "광주", "대전", "울산", "세종"];
  const hasCityPrefix = cityPrefixes.some((c) => trimmed.startsWith(c));
  const variants = Array.from(new Set([
    trimmed,
    !hasCityPrefix ? `서울 ${trimmed}` : null,
    !hasCityPrefix ? `서울특별시 ${trimmed}` : null,
    !trimmed.endsWith("역") ? `${trimmed}역` : null,
  ].filter((v): v is string => typeof v === "string" && v.length > 0)));

  for (const q of variants) {
    const addr = await kakao("search/address.json", { query: q, size: 1 }, kakaoKey);
    if (addr?.documents?.[0]) {
      const d = addr.documents[0];
      const lat = parseFloat(d.y);
      const lng = parseFloat(d.x);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
  }
  for (const q of variants) {
    const kw = await kakao("search/keyword.json", { query: q, size: 1 }, kakaoKey);
    if (kw?.documents?.[0]) {
      const d = kw.documents[0];
      const lat = parseFloat(d.y);
      const lng = parseFloat(d.x);
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
  }
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

/**
 * 동/가/읍/면 단위 cluster 키 추출.
 *  ⚠️ 2026-06-11 fix: 현 Kakao Local API 응답 document 에 region_3depth_name 이 없음
 *  → region_3depth_name 있으면 그대로, 없으면 address_name 에서 동 토큰을 파생.
 */
export function districtKeyFromPlace(place: KakaoPlace): string | null {
  const fromField = place.region_3depth_name?.trim();
  if (fromField) return fromField;
  const addr = place.address_name?.trim();
  if (!addr) return null;
  const dong = addr.match(/(\S+(?:동|가|읍|면|리))/);
  if (dong) return dong[1];
  const gu = addr.match(/(\S+(?:구|시|군))/);
  return gu ? gu[1] : null;
}

/** Haversine (미터) */
export function distMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── 카테고리 → 동종업종 키워드 (경쟁 카운트용) ─────────────────────
export function competitionKeyword(categoryId: string, subIndustryId?: string): string {
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

