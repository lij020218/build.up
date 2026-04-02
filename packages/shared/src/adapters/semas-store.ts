// ─── 소상공인시장진흥공단 개별 상가 데이터 어댑터 ────────────────────────────
// API 출처: data.go.kr 15012005 — 개별 점포 좌표/업종/주소 조회
// semas-market.ts(집계)와 별도로, 점포 단위 데이터를 제공합니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type SemasStoreConfig = DataAdapterConfig & {
  // baseUrl default: https://apis.data.go.kr/B553077/api/open/sdsc
};

export type SemasStoreParams = {
  divId?: "ctprvnCd" | "signguCd" | "adongCd";
  key?: string;
  indsLclsCd?: string;   // 대분류 (Q=음식, D=소매, R=서비스, L=생활)
  indsMclsCd?: string;   // 중분류
  indsSclsCd?: string;   // 소분류
  pageNo?: number;
  numOfRows?: number;
};

export type SemasStoreData = {
  storeId: string;
  storeName: string;
  industryMajorCode: string;
  industryMajorName: string;
  industryMidCode: string;
  industryMidName: string;
  industrySubCode: string;
  industrySubName: string;
  roadAddress: string;
  lotAddress: string;
  latitude: number;
  longitude: number;
  dongCode: string;
  dongName: string;
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://apis.data.go.kr/B553077/api/open/sdsc";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchSemasStores(
  config: SemasStoreConfig,
  params: SemasStoreParams
): Promise<AdapterResult<SemasStoreData>> {
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
  if (params.indsMclsCd) searchParams.set("indsMclsCd", params.indsMclsCd);
  if (params.indsSclsCd) searchParams.set("indsSclsCd", params.indsSclsCd);

  const url = `${baseUrl}/baroApi?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`SEMAS Store API responded with ${response.status}`);

    const json = await response.json();
    const items = json?.body?.items ?? [];
    const now = new Date().toISOString();

    const data: SemasStoreData[] = items.map((item: Record<string, unknown>) => ({
      storeId: String(item.bizesId ?? ""),
      storeName: String(item.bizesNm ?? ""),
      industryMajorCode: String(item.indsLclsCd ?? ""),
      industryMajorName: String(item.indsLclsNm ?? ""),
      industryMidCode: String(item.indsMclsCd ?? ""),
      industryMidName: String(item.indsMclsNm ?? ""),
      industrySubCode: String(item.indsSclsCd ?? ""),
      industrySubName: String(item.indsSclsNm ?? ""),
      roadAddress: String(item.rdnmAdr ?? ""),
      lotAddress: String(item.lnoAdr ?? ""),
      latitude: Number(item.lat ?? 0),
      longitude: Number(item.lon ?? 0),
      dongCode: String(item.adongCd ?? ""),
      dongName: String(item.adongNm ?? ""),
      fetchedAt: now,
    }));

    return {
      data,
      fetchedAt: now,
      source: {
        name: "소상공인시장진흥공단 상가정보(개별)",
        url: "https://data.go.kr",
        confidence: "high",
      },
      totalCount: Number(json?.body?.totalCount ?? data.length),
      hasMore: data.length >= (params.numOfRows ?? 20),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const semasStoreAdapter = {
  name: "semas-store",
  fetch: fetchSemasStores,
};
