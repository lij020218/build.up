// ─── 행정안전부 인구통계 어댑터 ──────────────────────────────────────────
// API 출처: data.go.kr 15108092 — 도로명 수준 인구/세대 데이터
// 상권 분석 시 타겟 인구 추정에 활용합니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type PopulationConfig = DataAdapterConfig & {
  // baseUrl default: https://apis.data.go.kr/1741000/rnPpltnHhStus
};

export type PopulationParams = {
  sido?: string;       // 시도명 (e.g., "서울특별시")
  sigungu?: string;    // 시군구명 (e.g., "강남구")
  roadName?: string;   // 도로명
  pageNo?: number;
  numOfRows?: number;
};

export type PopulationData = {
  sido: string;
  sigungu: string;
  roadName: string;
  totalPopulation: number;
  householdCount: number;
  populationPerHousehold: number;
  malePopulation: number;
  femalePopulation: number;
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://apis.data.go.kr/1741000/rnPpltnHhStus";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchPopulationData(
  config: PopulationConfig,
  params: PopulationParams
): Promise<AdapterResult<PopulationData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    serviceKey: config.apiKey,
    type: "json",
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 50),
  });

  if (params.sido) searchParams.set("sido", params.sido);
  if (params.sigungu) searchParams.set("sigungu", params.sigungu);
  if (params.roadName) searchParams.set("roadName", params.roadName);

  const url = `${baseUrl}/selectRnPpltnHhStus?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Population API responded with ${response.status}`);

    const json = await response.json();
    const items = json?.selectRnPpltnHhStus?.item ?? json?.response?.body?.items?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];
    const now = new Date().toISOString();

    const data: PopulationData[] = arr
      .filter((item: Record<string, unknown>) => item && item.roadName)
      .map((item: Record<string, unknown>) => ({
        sido: String(item.sido ?? ""),
        sigungu: String(item.sigungu ?? ""),
        roadName: String(item.roadName ?? ""),
        totalPopulation: Number(item.totalPpltn ?? 0),
        householdCount: Number(item.hhCnt ?? 0),
        populationPerHousehold: Number(item.ppltnPerHh ?? 0),
        malePopulation: Number(item.malePpltn ?? 0),
        femalePopulation: Number(item.femalePpltn ?? 0),
        fetchedAt: now,
      }));

    return {
      data,
      fetchedAt: now,
      source: { name: "행정안전부 도로명 인구통계", url: "https://data.go.kr", confidence: "high" },
      totalCount: Number(json?.selectRnPpltnHhStus?.totalCount ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const populationAdapter = {
  name: "population",
  fetch: fetchPopulationData,
};
