// ─── 데이터 어댑터 공통 타입 ──────────────────────────────────────────────────
// 각 외부 API 어댑터가 준수하는 인터페이스입니다.

export type DataAdapterConfig = {
  apiKey: string;
  baseUrl: string;
  timeout?: number;  // default 10_000ms
};

export type AdapterResult<T> = {
  data: T[];
  fetchedAt: string;          // ISO datetime
  source: {
    name: string;
    url: string;
    confidence: "high" | "medium" | "low";
  };
  totalCount?: number;
  hasMore?: boolean;
};

export type DataAdapter<TConfig extends DataAdapterConfig, TParams, TResult> = {
  name: string;
  fetch(config: TConfig, params: TParams): Promise<AdapterResult<TResult>>;
};

// ─── 캐시 설정 ──────────────────────────────────────────────────────────────

export type CacheEntry<T> = {
  data: T;
  fetchedAt: string;
  expiresAt: string;
  source: string;
  stale: boolean;
};

export const DEFAULT_TTL_MS: Record<string, number> = {
  "semas-market": 24 * 60 * 60 * 1000,       // 24시간
  "seoul-opendata": 24 * 60 * 60 * 1000,      // 24시간
  "kftc-franchise": 7 * 24 * 60 * 60 * 1000,  // 7일 (정보공개서는 연 1회 갱신)
  "bizinfo-programs": 12 * 60 * 60 * 1000,    // 12시간
  "localdata-permit": 24 * 60 * 60 * 1000,    // 24시간
  "semas-store": 24 * 60 * 60 * 1000,         // 24시간
  "nts-business": 1 * 60 * 60 * 1000,         // 1시간 (상태 변동 가능)
  "tax-calendar-api": 7 * 24 * 60 * 60 * 1000, // 7일
  "population": 7 * 24 * 60 * 60 * 1000,      // 7일
  "support-programs": 12 * 60 * 60 * 1000,    // 12시간
  "kftc-disclosure": 7 * 24 * 60 * 60 * 1000, // 7일
  "commercial-rent": 24 * 60 * 60 * 1000,     // 24시간
  "building-registry": 7 * 24 * 60 * 60 * 1000, // 7일
};
