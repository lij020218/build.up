// ─── 서울 열린데이터광장 상권 API 어댑터 ─────────────────────────────────────
// API 출처: openapi.seoul.go.kr
// 서울시 자치구별 상권 분석 데이터를 정규화합니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type SeoulOpenDataConfig = DataAdapterConfig & {
  // baseUrl default: http://openapi.seoul.go.kr:8088
};

export type SeoulMarketParams = {
  /** 서비스명 (예: VwsmTrdarSelngIem — 상권 매출 항목) */
  serviceName?: string;
  /** 시작 인덱스 */
  startIndex?: number;
  /** 종료 인덱스 */
  endIndex?: number;
  /** 기준 년분기 코드 (예: 20243) */
  stdrYyquCd?: string;
  /** 상권 코드 */
  trdarCd?: string;
};

export type SeoulMarketData = {
  trdarCd: string;        // 상권 코드
  trdarNm: string;        // 상권명
  trdarIndutyNm: string;  // 상권 업종명
  monthSales: number;     // 월 평균 매출
  storeCnt: number;       // 점포 수
  openRate: number;       // 개업률
  closeRate: number;      // 폐업률
  avgRent: number;        // 평균 임대료
  floatingPop: number;    // 유동인구
  quarter: string;        // 기준 분기
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "http://openapi.seoul.go.kr:8088";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchSeoulMarketData(
  config: SeoulOpenDataConfig,
  params: SeoulMarketParams
): Promise<AdapterResult<SeoulMarketData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const serviceName = params.serviceName ?? "VwsmTrdarSelngIem";
  const start = params.startIndex ?? 1;
  const end = params.endIndex ?? 20;

  // 서울 열린데이터 URL 패턴: /{key}/json/{serviceName}/{start}/{end}/
  let url = `${baseUrl}/${config.apiKey}/json/${serviceName}/${start}/${end}`;

  if (params.stdrYyquCd) url += `/${params.stdrYyquCd}`;
  if (params.trdarCd) url += `/${params.trdarCd}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Seoul Open Data API responded with ${response.status}`);
    }

    const json = await response.json();
    const resultKey = serviceName;
    const rows = json?.[resultKey]?.row ?? [];
    const now = new Date().toISOString();

    const data: SeoulMarketData[] = rows.map((row: Record<string, unknown>) => ({
      trdarCd: String(row.TRDAR_CD ?? ""),
      trdarNm: String(row.TRDAR_CD_NM ?? ""),
      trdarIndutyNm: String(row.SVC_INDUTY_CD_NM ?? ""),
      monthSales: Number(row.THSMON_SELNG_AMT ?? 0),
      storeCnt: Number(row.STOR_CO ?? 0),
      openRate: Number(row.OPBIZ_RT ?? 0),
      closeRate: Number(row.CLSBIZ_RT ?? 0),
      avgRent: Number(row.AVGR_RENT ?? 0),
      floatingPop: Number(row.TOT_FLPOP_CO ?? 0),
      quarter: String(row.STDR_YYQU_CD ?? ""),
      fetchedAt: now,
    }));

    return {
      data,
      fetchedAt: now,
      source: {
        name: "서울 열린데이터광장",
        url: "https://data.seoul.go.kr",
        confidence: "high",
      },
      totalCount: Number(json?.[resultKey]?.list_total_count ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const seoulOpenDataAdapter = {
  name: "seoul-opendata",
  fetch: fetchSeoulMarketData,
};
