// ─── 지방행정 인허가 데이터 어댑터 (localdata.go.kr) ─────────────────────────
// 전국 750만 인허가 기록: 경쟁 밀도, 생존율, 폐업 추이 분석용

import type { DataAdapterConfig, AdapterResult } from "./types";

export type LocaldataPermitConfig = DataAdapterConfig & {
  // baseUrl default: https://www.localdata.go.kr/platform/rest/GR0/openDataApi
};

export type LocaldataPermitParams = {
  opnSvcId?: string;        // 업종 서비스 ID (e.g., 07_24_04_P = 일반음식점)
  localCode?: string;       // 시군구 코드
  pageIndex?: number;
  pageSize?: number;
  resultType?: "json" | "xml";
};

export type LocaldataPermitData = {
  bizId: string;             // 관리번호
  bizName: string;           // 사업장명
  bizType: string;           // 업태구분명
  serviceName: string;       // 서비스명 (인허가 종류)
  address: string;           // 소재지전체주소
  roadAddress: string;       // 도로명전체주소
  permitDate: string;        // 인허가일자
  status: "operating" | "suspended" | "closed";
  statusDetail: string;      // 상세영업상태
  closureDate?: string;      // 폐업일자
  x?: number;                // 좌표 X (EPSG:5174)
  y?: number;                // 좌표 Y (EPSG:5174)
  lastModified: string;      // 최종수정일
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://www.localdata.go.kr/platform/rest/GR0/openDataApi";
const DEFAULT_TIMEOUT = 15_000;

function mapStatus(code: string): "operating" | "suspended" | "closed" {
  if (code === "01" || code === "1") return "operating";
  if (code === "03" || code === "3") return "suspended";
  return "closed";
}

// 업종별 서비스 ID 매핑
export const PERMIT_SERVICE_IDS: Record<string, { id: string; label: string }> = {
  "general-restaurant": { id: "07_24_04_P", label: "일반음식점" },
  "bakery": { id: "07_24_05_P", label: "휴게음식점" },
  "beauty-salon": { id: "05_24_01_P", label: "미용업" },
  "accommodation": { id: "05_23_01_P", label: "숙박업" },
  "fitness": { id: "04_12_01_P", label: "체육시설업" },
  "education": { id: "04_08_01_P", label: "학원" },
  "pet-grooming": { id: "02_01_01_P", label: "동물판매업" },
  "online-commerce": { id: "99_01_01_P", label: "통신판매업" },
};

export async function fetchLocaldataPermits(
  config: LocaldataPermitConfig,
  params: LocaldataPermitParams
): Promise<AdapterResult<LocaldataPermitData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    authKey: config.apiKey,
    resultType: params.resultType ?? "json",
    pageIndex: String(params.pageIndex ?? 1),
    pageSize: String(params.pageSize ?? 50),
  });

  if (params.opnSvcId) searchParams.set("opnSvcId", params.opnSvcId);
  if (params.localCode) searchParams.set("localCode", params.localCode);

  const url = `${baseUrl}?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`LOCALDATA API responded with ${response.status}`);

    const json = await response.json();
    const rows = json?.result?.body?.rows?.row ?? json?.rows?.row ?? [];
    const items = Array.isArray(rows) ? rows : [rows];
    const now = new Date().toISOString();

    const data: LocaldataPermitData[] = items
      .filter((item: Record<string, unknown>) => item && item.mgtNo)
      .map((item: Record<string, unknown>) => ({
        bizId: String(item.mgtNo ?? ""),
        bizName: String(item.bplcNm ?? ""),
        bizType: String(item.uptaeNm ?? ""),
        serviceName: String(item.opnSvcNm ?? ""),
        address: String(item.siteWhlAddr ?? ""),
        roadAddress: String(item.rdnWhlAddr ?? ""),
        permitDate: String(item.apvPermYmd ?? ""),
        status: mapStatus(String(item.trdStateGbn ?? "")),
        statusDetail: String(item.dtlStateNm ?? ""),
        closureDate: item.dcbYmd ? String(item.dcbYmd) : undefined,
        x: item.x ? Number(item.x) : undefined,
        y: item.y ? Number(item.y) : undefined,
        lastModified: String(item.lastModTs ?? ""),
        fetchedAt: now,
      }));

    return {
      data,
      fetchedAt: now,
      source: {
        name: "지방행정인허가데이터",
        url: "https://www.localdata.go.kr",
        confidence: "high",
      },
      totalCount: Number(json?.result?.body?.totalCount ?? data.length),
      hasMore: data.length >= (params.pageSize ?? 50),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 특정 지역+업종의 경쟁 밀도 요약 */
export async function fetchCompetitorDensity(
  config: LocaldataPermitConfig,
  params: { localCode: string; opnSvcId: string }
): Promise<{ total: number; operating: number; closed: number; closureRate: number }> {
  const result = await fetchLocaldataPermits(config, {
    localCode: params.localCode,
    opnSvcId: params.opnSvcId,
    pageSize: 1000,
  });

  const operating = result.data.filter((d) => d.status === "operating").length;
  const closed = result.data.filter((d) => d.status === "closed").length;
  const total = result.data.length;
  const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;

  return { total, operating, closed, closureRate };
}

export const localdataPermitAdapter = {
  name: "localdata-permit",
  fetch: fetchLocaldataPermits,
};
