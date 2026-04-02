// ─── 건축물대장 어댑터 ──────────────────────────────────────────────────
// API 출처: data.go.kr 15134735 — 국토부 건축물대장 표제부
// 상가 건물 면적, 용도, 층수, 준공일 등 확인용

import type { DataAdapterConfig, AdapterResult } from "./types";

export type BuildingRegistryConfig = DataAdapterConfig & {
  // baseUrl default: https://apis.data.go.kr/1613000/BldRgstService
};

export type BuildingRegistryParams = {
  sigunguCd: string;     // 시군구코드 (5자리)
  bjdongCd: string;      // 법정동코드 (5자리)
  bun?: string;          // 본번 (4자리)
  ji?: string;           // 부번 (4자리)
  pageNo?: number;
  numOfRows?: number;
};

export type BuildingRegistryData = {
  buildingName: string;        // 건물명
  address: string;             // 대지위치
  mainUse: string;             // 주용도 (근린생활시설, 판매시설 등)
  mainUseCode: string;
  buildingArea: number;        // 건축면적 (㎡)
  totalFloorArea: number;      // 연면적 (㎡)
  landArea: number;            // 대지면적 (㎡)
  coverageRatio: number;       // 건폐율 (%)
  floorAreaRatio: number;      // 용적률 (%)
  aboveGroundFloors: number;
  undergroundFloors: number;
  structureType: string;       // 구조 (철근콘크리트 등)
  completionDate: string;      // 사용승인일
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://apis.data.go.kr/1613000/BldRgstService";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchBuildingRegistry(
  config: BuildingRegistryConfig,
  params: BuildingRegistryParams
): Promise<AdapterResult<BuildingRegistryData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    serviceKey: config.apiKey,
    sigunguCd: params.sigunguCd,
    bjdongCd: params.bjdongCd,
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 10),
  });

  if (params.bun) searchParams.set("bun", params.bun);
  if (params.ji) searchParams.set("ji", params.ji);

  const url = `${baseUrl}/getBrTitleInfo?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Building Registry API responded with ${response.status}`);

    const text = await response.text();
    const now = new Date().toISOString();

    // Parse XML response
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    const ext = (xml: string, tag: string): string => {
      const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m?.[1]?.trim() ?? "";
    };

    const data: BuildingRegistryData[] = itemMatches.map((itemXml) => ({
      buildingName: ext(itemXml, "bldNm"),
      address: ext(itemXml, "platPlc"),
      mainUse: ext(itemXml, "mainPurpsCdNm"),
      mainUseCode: ext(itemXml, "mainPurpsCd"),
      buildingArea: Number(ext(itemXml, "archArea")) || 0,
      totalFloorArea: Number(ext(itemXml, "totArea")) || 0,
      landArea: Number(ext(itemXml, "platArea")) || 0,
      coverageRatio: Number(ext(itemXml, "bcRat")) || 0,
      floorAreaRatio: Number(ext(itemXml, "vlRat")) || 0,
      aboveGroundFloors: Number(ext(itemXml, "grndFlrCnt")) || 0,
      undergroundFloors: Number(ext(itemXml, "ugrndFlrCnt")) || 0,
      structureType: ext(itemXml, "strctCdNm"),
      completionDate: ext(itemXml, "useAprDay"),
      fetchedAt: now,
    }));

    return {
      data,
      fetchedAt: now,
      source: { name: "국토부 건축물대장", url: "https://data.go.kr", confidence: "high" },
      totalCount: data.length,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const buildingRegistryAdapter = {
  name: "building-registry",
  fetch: fetchBuildingRegistry,
};
