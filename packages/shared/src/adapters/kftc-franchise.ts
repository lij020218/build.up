// ─── 공정거래위원회 가맹사업 정보공개서 API 어댑터 ──────────────────────────
// API 출처: data.go.kr 공정거래위원회_가맹사업정보제공시스템
// 프랜차이즈 브랜드 정보 (가맹비, 점포수, 폐점률, 매출 등)를 정규화합니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type KftcFranchiseConfig = DataAdapterConfig & {
  // baseUrl default: https://apis.data.go.kr/1130000/FftcBrandFrcsInfoService
};

export type KftcFranchiseParams = {
  /** 브랜드명 검색 */
  brdNm?: string;
  /** 업종 대분류 코드 */
  indutyLclsCd?: string;
  /** 정보공개서 등록년도 */
  yr?: string;
  pageNo?: number;
  numOfRows?: number;
};

export type KftcFranchiseData = {
  brandName: string;
  companyName: string;
  industryCategory: string;
  industrySubCategory: string;
  totalStores: number;
  newStores: number;
  closedStores: number;
  closureRate: number;       // 폐점률 (계산값)
  franchiseFee: number;      // 가맹비 (만원)
  educationFee: number;      // 교육비 (만원)
  deposit: number;           // 보증금 (만원)
  otherCost: number;         // 기타 비용 (만원)
  totalStartupCost: number;  // 합계 (만원)
  avgMonthlySales?: number;  // 평균 월 매출 (만원)
  disclosureYear: string;
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://apis.data.go.kr/1130000/FftcBrandFrcsInfoService";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchKftcFranchiseData(
  config: KftcFranchiseConfig,
  params: KftcFranchiseParams
): Promise<AdapterResult<KftcFranchiseData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    serviceKey: config.apiKey,
    type: "json",
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 20),
  });

  if (params.brdNm) searchParams.set("brdNm", params.brdNm);
  if (params.indutyLclsCd) searchParams.set("indutyLclsCd", params.indutyLclsCd);
  if (params.yr) searchParams.set("yr", params.yr);

  const url = `${baseUrl}/getBrandFrcsInfo?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`KFTC API responded with ${response.status}`);
    }

    const json = await response.json();
    const items = json?.response?.body?.items?.item ?? [];
    const itemList = Array.isArray(items) ? items : [items];
    const now = new Date().toISOString();

    const data: KftcFranchiseData[] = itemList
      .filter((item: Record<string, unknown>) => item.brdNm)
      .map((item: Record<string, unknown>) => {
        const totalStores = Number(item.frcsCo ?? 0);
        const closedStores = Number(item.clsBizCo ?? 0);
        const closureRate = totalStores > 0 ? (closedStores / totalStores) * 100 : 0;

        const franchiseFee = Number(item.jnFee ?? 0);
        const educationFee = Number(item.eduFee ?? 0);
        const deposit = Number(item.assrncFee ?? 0);
        const otherCost = Number(item.etcFee ?? 0);

        return {
          brandName: String(item.brdNm ?? ""),
          companyName: String(item.corpNm ?? ""),
          industryCategory: String(item.indutyLclsNm ?? ""),
          industrySubCategory: String(item.indutySclsNm ?? ""),
          totalStores,
          newStores: Number(item.nwBizCo ?? 0),
          closedStores,
          closureRate: Math.round(closureRate * 10) / 10,
          franchiseFee,
          educationFee,
          deposit,
          otherCost,
          totalStartupCost: franchiseFee + educationFee + deposit + otherCost,
          avgMonthlySales: item.avrgSlsAmt ? Number(item.avrgSlsAmt) : undefined,
          disclosureYear: String(item.yr ?? ""),
          fetchedAt: now,
        };
      });

    return {
      data,
      fetchedAt: now,
      source: {
        name: "공정거래위원회 가맹사업 정보공개서",
        url: "https://franchise.ftc.go.kr",
        confidence: "high",
      },
      totalCount: Number(json?.response?.body?.totalCount ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const kftcFranchiseAdapter = {
  name: "kftc-franchise",
  fetch: fetchKftcFranchiseData,
};
