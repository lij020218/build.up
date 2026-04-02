// ─── 소상공인시장진흥공단 상권정보 API 어댑터 ────────────────────────────────
// API 출처: data.go.kr 소상공인시장진흥공단_상가(상권)정보
// 유동인구, 매출, 업종별 점포수 등 상권 데이터를 정규화합니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type SemasMarketConfig = DataAdapterConfig & {
  // baseUrl default: https://apis.data.go.kr/B553077/api/open/sdsc
};

export type SemasMarketParams = {
  /** 행정동 코드 */
  divId?: "adongCd";
  key?: string;
  /** 업종 대분류 코드 (Q: 음식, D: 소매, R: 서비스, L: 생활) */
  indsLclsCd?: string;
  /** 페이지 번호 */
  pageNo?: number;
  numOfRows?: number;
};

export type SemasMarketData = {
  regionCode: string;
  regionName: string;
  storeCount: number;
  openCount: number;
  closeCount: number;
  franchiseCount: number;
  averageMonthlySales?: number;
  industryCode: string;
  industryName: string;
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://apis.data.go.kr/B553077/api/open/sdsc";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchSemasMarketData(
  config: SemasMarketConfig,
  params: SemasMarketParams
): Promise<AdapterResult<SemasMarketData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    serviceKey: config.apiKey,
    type: "json",
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 20),
  });

  if (params.divId) searchParams.set("divId", params.divId);
  if (params.key) searchParams.set("key", params.key);
  if (params.indsLclsCd) searchParams.set("indsLclsCd", params.indsLclsCd);

  const url = `${baseUrl}/storeStatsUpjongInAdmi?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`SEMAS API responded with ${response.status}`);
    }

    const json = await response.json();
    const items = json?.body?.items ?? [];
    const now = new Date().toISOString();

    const data: SemasMarketData[] = items.map((item: Record<string, unknown>) => ({
      regionCode: String(item.adongCd ?? ""),
      regionName: String(item.adongNm ?? ""),
      storeCount: Number(item.storeCo ?? 0),
      openCount: Number(item.openCo ?? 0),
      closeCount: Number(item.closeCo ?? 0),
      franchiseCount: Number(item.frcsCo ?? 0),
      averageMonthlySales: item.avrgSlsAmt ? Number(item.avrgSlsAmt) : undefined,
      industryCode: String(item.indsLclsCd ?? ""),
      industryName: String(item.indsLclsNm ?? ""),
      fetchedAt: now,
    }));

    return {
      data,
      fetchedAt: now,
      source: {
        name: "소상공인시장진흥공단 상가정보",
        url: "https://data.go.kr",
        confidence: "high",
      },
      totalCount: Number(json?.body?.totalCount ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const semasMarketAdapter = {
  name: "semas-market",
  fetch: fetchSemasMarketData,
};
