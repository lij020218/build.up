// ─── 국토교통부 상업업무용 부동산 매매 실거래가 어댑터 ─────────────────────
// API 출처: data.go.kr — 국토교통부_상업업무용 부동산 매매 실거래 자료

import type { DataAdapterConfig, AdapterResult } from "./types";

export type CommercialRentConfig = DataAdapterConfig & {
  // baseUrl default: https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade
};

export type CommercialTransactionParams = {
  lawdCd: string;         // 법정동코드 앞 5자리 (e.g., "11680" = 강남구)
  dealYm: string;         // 거래년월 (e.g., "202601")
  pageNo?: number;
  numOfRows?: number;
};

export type CommercialTransactionData = {
  district: string;
  dong: string;
  buildingName: string;
  buildingType: string;
  floorArea: number;         // 전용면적 (㎡)
  transactionPrice: number;  // 거래금액 (만원)
  pricePerSqm: number;       // ㎡당 가격 (만원)
  transactionDate: string;
  floor: number;
  buildYear: string;
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchCommercialTransactions(
  config: CommercialRentConfig,
  params: CommercialTransactionParams
): Promise<AdapterResult<CommercialTransactionData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    serviceKey: config.apiKey,
    LAWD_CD: params.lawdCd,
    DEAL_YMD: params.dealYm,
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 50),
  });

  const url = `${baseUrl}/getRTMSDataSvcNrgTrade?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`MOLIT Commercial Transaction API responded with ${response.status}`);

    const text = await response.text();
    const now = new Date().toISOString();

    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    const ext = (xml: string, tag: string): string => {
      const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m?.[1]?.trim() ?? "";
    };

    const data: CommercialTransactionData[] = itemMatches.map((itemXml) => {
      const area = Number(ext(itemXml, "전용면적") || ext(itemXml, "excluUseAr")) || 0;
      const price = Number((ext(itemXml, "거래금액") || ext(itemXml, "dealAmount")).replace(/,/g, "")) || 0;
      return {
        district: ext(itemXml, "시군구") || ext(itemXml, "sggNm"),
        dong: ext(itemXml, "법정동") || ext(itemXml, "umdNm"),
        buildingName: ext(itemXml, "건물명") || ext(itemXml, "buildingNm"),
        buildingType: ext(itemXml, "건물용도") || ext(itemXml, "buildingUse"),
        floorArea: area,
        transactionPrice: price,
        pricePerSqm: area > 0 ? Math.round(price / area) : 0,
        transactionDate: `${ext(itemXml, "년") || ext(itemXml, "dealYear")}-${(ext(itemXml, "월") || ext(itemXml, "dealMonth")).padStart(2, "0")}`,
        floor: Number(ext(itemXml, "층") || ext(itemXml, "floor")) || 0,
        buildYear: ext(itemXml, "건축년도") || ext(itemXml, "buildYear"),
        fetchedAt: now,
      };
    });

    return {
      data,
      fetchedAt: now,
      source: { name: "국토부 상업업무용 부동산 매매 실거래가", url: "https://data.go.kr", confidence: "high" },
      totalCount: data.length,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const commercialRentAdapter = {
  name: "commercial-rent",
  fetch: fetchCommercialTransactions,
};
