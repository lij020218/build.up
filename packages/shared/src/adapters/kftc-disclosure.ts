// ─── 공정거래위원회 프랜차이즈 정보공개서 + 업종 통계 어댑터 ─────────────
// API 출처: data.go.kr 15125571 (본문), 15110293 (창업비용), 15110302 (매출), 15125524 (증감)

import type { DataAdapterConfig, AdapterResult } from "./types";

export type KftcDisclosureConfig = DataAdapterConfig & {
  // baseUrl default: https://apis.data.go.kr/1130000
};

// ── 정보공개서 본문 ──
export type DisclosureBodyParams = {
  brandName?: string;
  year?: string;
  pageNo?: number;
  numOfRows?: number;
};

export type DisclosureBodyData = {
  brandName: string;
  companyName: string;
  year: string;
  violationHistory: string;
  franchiseeObligations: string;
  startupProcedures: string;
  fetchedAt: string;
};

// ── 업종별 창업비용 ──
export type IndustryStartupCostParams = {
  year?: string;
  industryCode?: string;
  pageNo?: number;
  numOfRows?: number;
};

export type IndustryStartupCostData = {
  industryCode: string;
  industryName: string;
  year: string;
  avgFranchiseFee: number;   // 만원
  avgEducationFee: number;
  avgDeposit: number;
  avgOtherCost: number;
  avgTotalStartupCost: number;
  fetchedAt: string;
};

// ── 지역별 업종별 평균 매출 ──
export type RegionalSalesParams = {
  year?: string;
  industryCode?: string;
  regionCode?: string;
  pageNo?: number;
  numOfRows?: number;
};

export type RegionalSalesData = {
  regionCode: string;
  regionName: string;
  industryCode: string;
  industryName: string;
  year: string;
  avgTotalSales: number;    // 만원
  fetchedAt: string;
};

// ── 업종별 가맹점 증감 ──
export type StoreChangeParams = {
  year?: string;
  industryCode?: string;
  pageNo?: number;
  numOfRows?: number;
};

export type StoreChangeData = {
  industryCode: string;
  industryName: string;
  year: string;
  avgNewOpenings: number;
  avgTerminations: number;
  avgCancellations: number;
  netChange: number;
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://apis.data.go.kr/1130000";
const DEFAULT_TIMEOUT = 10_000;

async function kftcFetch<T>(
  config: KftcDisclosureConfig,
  endpoint: string,
  queryParams: Record<string, string>,
  mapFn: (item: Record<string, unknown>, now: string) => T,
  sourceName: string
): Promise<AdapterResult<T>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({ serviceKey: config.apiKey, type: "json", ...queryParams });
  const url = `${baseUrl}/${endpoint}?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`KFTC ${endpoint} responded with ${response.status}`);

    const json = await response.json();
    const items = json?.response?.body?.items?.item ?? json?.body?.items ?? [];
    const arr = Array.isArray(items) ? items : [items];
    const now = new Date().toISOString();

    const data: T[] = arr.filter(Boolean).map((item: Record<string, unknown>) => mapFn(item, now));

    return {
      data,
      fetchedAt: now,
      source: { name: sourceName, url: "https://franchise.ftc.go.kr", confidence: "high" },
      totalCount: Number(json?.response?.body?.totalCount ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchDisclosureBody(
  config: KftcDisclosureConfig,
  params: DisclosureBodyParams = {}
): Promise<AdapterResult<DisclosureBodyData>> {
  return kftcFetch(config, "FftcJngIfrmpBodyService/getJngIfrmpBody", {
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 10),
    ...(params.brandName ? { brdNm: params.brandName } : {}),
    ...(params.year ? { yr: params.year } : {}),
  }, (item, now) => ({
    brandName: String(item.brdNm ?? ""),
    companyName: String(item.corpNm ?? ""),
    year: String(item.yr ?? ""),
    violationHistory: String(item.lwViolFctCn ?? ""),
    franchiseeObligations: String(item.frcsSlsBrdnCn ?? ""),
    startupProcedures: String(item.stpPrcdCn ?? ""),
    fetchedAt: now,
  }), "공정위 정보공개서 본문");
}

export async function fetchIndustryStartupCosts(
  config: KftcDisclosureConfig,
  params: IndustryStartupCostParams = {}
): Promise<AdapterResult<IndustryStartupCostData>> {
  return kftcFetch(config, "FftcIndutyStupCostStatsService/getIndutyStupCostStats", {
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 50),
    ...(params.year ? { yr: params.year } : {}),
    ...(params.industryCode ? { indutyLclsCd: params.industryCode } : {}),
  }, (item, now) => ({
    industryCode: String(item.indutyLclsCd ?? ""),
    industryName: String(item.indutyLclsNm ?? ""),
    year: String(item.yr ?? ""),
    avgFranchiseFee: Number(item.avrgJoinAmt ?? 0),
    avgEducationFee: Number(item.avrgEducAmt ?? 0),
    avgDeposit: Number(item.avrgDpstAmt ?? 0),
    avgOtherCost: Number(item.avrgEtcAmt ?? 0),
    avgTotalStartupCost: Number(item.avrgSmTotAmt ?? 0),
    fetchedAt: now,
  }), "공정위 업종별 창업비용");
}

export async function fetchRegionalSales(
  config: KftcDisclosureConfig,
  params: RegionalSalesParams = {}
): Promise<AdapterResult<RegionalSalesData>> {
  return kftcFetch(config, "FftcAreaIndutyAvrgSlsStatsService/getAreaIndutyAvrgSlsStats", {
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 50),
    ...(params.year ? { yr: params.year } : {}),
    ...(params.industryCode ? { indutyLclsCd: params.industryCode } : {}),
    ...(params.regionCode ? { areaCd: params.regionCode } : {}),
  }, (item, now) => ({
    regionCode: String(item.areaCd ?? ""),
    regionName: String(item.areaNm ?? ""),
    industryCode: String(item.indutyLclsCd ?? ""),
    industryName: String(item.indutyLclsNm ?? ""),
    year: String(item.yr ?? ""),
    avgTotalSales: Number(item.avrgSlsAmt ?? 0),
    fetchedAt: now,
  }), "공정위 지역별 평균매출");
}

export async function fetchStoreChanges(
  config: KftcDisclosureConfig,
  params: StoreChangeParams = {}
): Promise<AdapterResult<StoreChangeData>> {
  return kftcFetch(config, "FftcIndutyFrcsChgStatsService/getIndutyFrcsChgStats", {
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 50),
    ...(params.year ? { yr: params.year } : {}),
    ...(params.industryCode ? { indutyLclsCd: params.industryCode } : {}),
  }, (item, now) => {
    const newOpen = Number(item.avrgNewFrcsCo ?? 0);
    const terminated = Number(item.avrgCtrtEndFrcsCo ?? 0);
    const cancelled = Number(item.avrgCtrtCnclFrcsCo ?? 0);
    return {
      industryCode: String(item.indutyLclsCd ?? ""),
      industryName: String(item.indutyLclsNm ?? ""),
      year: String(item.yr ?? ""),
      avgNewOpenings: newOpen,
      avgTerminations: terminated,
      avgCancellations: cancelled,
      netChange: newOpen - terminated - cancelled,
      fetchedAt: now,
    };
  }, "공정위 가맹점 증감현황");
}

export const kftcDisclosureAdapter = {
  name: "kftc-disclosure",
  fetch: fetchDisclosureBody,
};
