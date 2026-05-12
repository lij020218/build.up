/**
 * Kakao Maps SDK 부분 타입 정의 (any 19개 → 0개 정리, 2026-05-13).
 *
 *  ── 왜 만들었나 ───────────────────────────────────────────────────
 *  Kakao Maps SDK 가 npm 패키지 X (CDN 로드). @types/kakao-maps 없음.
 *  LocationMapPanel·LocationCandidatesStage·useDataLoading 가 `as any` /
 *  `(callback: any[])` 다수 사용 → 타입 안전성 손실.
 *
 *  사용 메서드만 부분 정의 (전체 SDK 정의는 불필요).
 *
 *  출처: https://apis.map.kakao.com/web/documentation/
 *  ────────────────────────────────────────────────────────────────
 */

export type KakaoLatLng = {
  getLat(): number;
  getLng(): number;
};

export type KakaoLatLngBounds = {
  extend(latlng: KakaoLatLng): void;
};

export type KakaoMap = {
  setBounds(bounds: KakaoLatLngBounds): void;
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number, options?: { animate?: boolean | { duration?: number } }): void;
  panTo(latlng: KakaoLatLng): void;
};

export type KakaoMarker = {
  setMap(map: KakaoMap | null): void;
};

export type KakaoCustomOverlay = {
  setMap(map: KakaoMap | null): void;
};

export type KakaoGeocoderResult = {
  address_name: string;
  x: string;            // longitude
  y: string;            // latitude
  road_address?: { address_name: string };
};

export type KakaoPlacesResult = {
  id: string;
  place_name: string;
  category_name?: string;
  address_name: string;
  road_address_name?: string;
  x: string;            // longitude
  y: string;            // latitude
  phone?: string;
};

export type KakaoStatus = "OK" | "ZERO_RESULT" | "ERROR";

export type KakaoPagination = {
  current: number;
  totalCount: number;
  nextPage(): void;
  prevPage(): void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type KakaoGeocoder = {
  addressSearch(
    addr: string,
    callback: (result: KakaoGeocoderResult[], status: KakaoStatus) => void,
  ): void;
};

export type KakaoPlaces = {
  keywordSearch(
    keyword: string,
    callback: (
      data: KakaoPlacesResult[],
      status: KakaoStatus,
      pagination?: KakaoPagination,
    ) => void,
    options?: { location?: KakaoLatLng; radius?: number; size?: number },
  ): void;
};

export type KakaoMapsNamespace = {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker;
  CustomOverlay: new (options: {
    position: KakaoLatLng;
    content: string | HTMLElement;
    yAnchor?: number;
    xAnchor?: number;
  }) => KakaoCustomOverlay;
  services: {
    Geocoder: new () => KakaoGeocoder;
    Places: new () => KakaoPlaces;
    Status: { OK: "OK"; ZERO_RESULT: "ZERO_RESULT"; ERROR: "ERROR" };
  };
  load?: (callback: () => void) => void;
};

export type KakaoSDK = {
  maps?: KakaoMapsNamespace;
};

/** window.kakao 전역 확장. */
declare global {
  interface Window {
    kakao?: KakaoSDK;
  }
}

// Re-export for component imports
export {};
