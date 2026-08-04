import { getEnvVar } from "./env";

/**
 * Kakao Local 키워드 검색 — 지역 실명 업체 조회 공용 헬퍼 (2026-08-04).
 *  기존 /api/contractors/local 의 구현을 추출해 SSOT 화 — 시공업체 검색과
 *  로드맵 생성(지역 공급처·인테리어 실명 부착)이 같은 코드를 쓴다.
 */

export type KakaoLocalPlace = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  category: string;
  mapUrl: string | null;
  /** 중심 좌표를 준 검색에서만 — 미터 단위 거리 */
  distanceM: number | null;
};

type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  category_name: string;
  place_url: string;
  x: string;   // 경도
  y: string;   // 위도
  /** x/y 중심을 준 요청에서만 내려옴 — 미터 */
  distance?: string;
};

/** 원시 검색 — x/y 좌표 포함 (지오코딩·거리 계산용). center 를 주면 거리순 정렬 + distance 포함. */
async function searchKakaoPlacesRaw(
  region: string,
  keyword: string,
  apiKey: string,
  opts: { size?: number; timeoutMs?: number; center?: { lng: number; lat: number } } = {},
): Promise<KakaoPlace[]> {
  const query = keyword ? `${region} ${keyword}` : region;
  const searchParams = new URLSearchParams({
    query,
    size: String(opts.size ?? 5),
    sort: opts.center ? "distance" : "accuracy",
  });
  if (opts.center) {
    searchParams.set("x", String(opts.center.lng));
    searchParams.set("y", String(opts.center.lat));
  }

  // ⚠️ Kakao Local API 정책 (2025+): `KA` 헤더에 `os` + `origin` 필드 둘 다 필수.
  const origin = getEnvVar("NEXT_PUBLIC_APP_URL")
    ?? getEnvVar("VERCEL_URL")?.replace(/^/, "https://")
    ?? "http://localhost:3000";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 6_000);
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
          KA: `sdk/1.0.0 os/javascript origin/${origin}`,
        },
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Kakao Local API error ${res.status}: ${err}`);
    }
    const data = (await res.json()) as { documents: KakaoPlace[] };
    return data.documents;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchKakaoPlaces(
  region: string,
  keyword: string,
  apiKey: string,
  opts: { size?: number; timeoutMs?: number; center?: { lng: number; lat: number } } = {},
): Promise<KakaoLocalPlace[]> {
  const docs = await searchKakaoPlacesRaw(region, keyword, apiKey, opts);
  return docs.map((place) => {
    const d = Number(place.distance);
    return {
      id: `kakao-${place.id}`,
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      phone: place.phone || null,
      category: place.category_name.split(" > ").slice(-1)[0] || "",
      mapUrl: place.place_url || null,
      distanceM: place.distance != null && Number.isFinite(d) ? d : null,
    };
  });
}

/**
 * 지역 텍스트 → 대표 좌표 (키워드 검색 1건의 x/y). 소진공 반경 조회의 중심점용.
 *  실패 시 null — 호출부는 반경 조회를 스킵.
 */
export async function geocodeRegion(
  region: string,
  apiKey: string,
): Promise<{ lng: number; lat: number } | null> {
  try {
    const docs = await searchKakaoPlacesRaw(region, "", apiKey, { size: 1 });
    const p = docs[0];
    if (!p) return null;
    const lng = Number(p.x), lat = Number(p.y);
    return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
  } catch {
    return null;
  }
}
