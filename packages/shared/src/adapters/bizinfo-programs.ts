// ─── 기업마당 (BizInfo) 정부 지원사업 공고 API 어댑터 ────────────────────────
// API 출처: bizinfo.go.kr
// 정부 지원사업 공고 목록을 가져와 정규화합니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type BizInfoConfig = DataAdapterConfig & {
  // baseUrl default: https://www.bizinfo.go.kr/uss/rss
};

export type BizInfoParams = {
  /** 검색어 */
  searchKeyword?: string;
  /** 지원분야 (01: 자금, 02: 기술, 03: 인력, 04: 수출, 05: 내수, 06: 경영, 07: 기타) */
  areaCd?: string;
  /** 모집 상태 (01: 모집예정, 02: 모집중, 03: 모집마감) */
  pblancBgngYmd?: string;
  pblancEndYmd?: string;
  pageNo?: number;
  numOfRows?: number;
};

export type BizInfoProgramData = {
  pblancId: string;         // 공고 ID
  pblancNm: string;         // 공고명
  jrsdInsttNm: string;      // 주관 기관명
  reqstBeginDt: string;     // 신청 시작일
  reqstEndDt: string;       // 신청 종료일
  areaNm: string;           // 지원 분야명
  pblancUrl: string;        // 공고 URL
  sprtCn: string;           // 지원 내용 요약
  isOpen: boolean;          // 현재 모집중 여부
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://www.bizinfo.go.kr/uss/rss/bizInfoApi.do";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchBizInfoPrograms(
  config: BizInfoConfig,
  params: BizInfoParams
): Promise<AdapterResult<BizInfoProgramData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    crtfcKey: config.apiKey,
    dataType: "json",
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 20),
  });

  if (params.searchKeyword) searchParams.set("searchKeyword", params.searchKeyword);
  if (params.areaCd) searchParams.set("areaCd", params.areaCd);
  if (params.pblancBgngYmd) searchParams.set("pblancBgngYmd", params.pblancBgngYmd);
  if (params.pblancEndYmd) searchParams.set("pblancEndYmd", params.pblancEndYmd);

  const url = `${baseUrl}?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`BizInfo API responded with ${response.status}`);
    }

    const json = await response.json();
    const items = json?.jsonArray ?? [];
    const now = new Date().toISOString();
    const today = new Date();

    const data: BizInfoProgramData[] = items.map((item: Record<string, unknown>) => {
      const endDate = String(item.reqstEndDt ?? "");
      const isOpen = endDate ? new Date(endDate) >= today : false;

      return {
        pblancId: String(item.pblancId ?? ""),
        pblancNm: String(item.pblancNm ?? ""),
        jrsdInsttNm: String(item.jrsdInsttNm ?? ""),
        reqstBeginDt: String(item.reqstBeginDt ?? ""),
        reqstEndDt: endDate,
        areaNm: String(item.areaNm ?? ""),
        pblancUrl: String(item.pblancUrl ?? ""),
        sprtCn: String(item.sprtCn ?? ""),
        isOpen,
        fetchedAt: now,
      };
    });

    return {
      data,
      fetchedAt: now,
      source: {
        name: "기업마당 (BizInfo)",
        url: "https://www.bizinfo.go.kr",
        confidence: "high",
      },
      totalCount: Number(json?.totalCount ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const bizInfoAdapter = {
  name: "bizinfo-programs",
  fetch: fetchBizInfoPrograms,
};
