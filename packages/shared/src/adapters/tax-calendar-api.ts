// ─── 국세청 세금 일정 어댑터 ──────────────────────────────────────────────
// API 출처: data.go.kr 15101035 — 국세청 세금 신고/납부 일정
// 기존 정적 TAX_EVENTS 배열을 보완/대체합니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type TaxCalendarApiConfig = DataAdapterConfig & {
  // baseUrl: data.go.kr auto-converted file data API endpoint
};

export type TaxCalendarApiParams = {
  page?: number;
  perPage?: number;
  taxType?: string;     // 세목 필터 (부가가치세, 종합소득세 등)
  filingType?: string;  // 신고구분 필터
};

export type TaxCalendarApiData = {
  taxType: string;          // 세목 (부가가치세, 종합소득세, 원천세 등)
  filingType: string;       // 신고구분 (확정신고, 예정신고 등)
  periodStart: string;      // 귀속기간 시작
  periodEnd: string;        // 귀속기간 종료
  deadline: string;         // 신고/납부 기한
  description: string;      // 비고
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://api.odcloud.kr/api/15101035/v1/uddi:93121f82-1e6d-4e7e-8e71-429900e5c572";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchTaxCalendarData(
  config: TaxCalendarApiConfig,
  params: TaxCalendarApiParams = {}
): Promise<AdapterResult<TaxCalendarApiData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    serviceKey: config.apiKey,
    page: String(params.page ?? 1),
    perPage: String(params.perPage ?? 100),
  });

  if (params.taxType) searchParams.set("cond[세목::EQ]", params.taxType);
  if (params.filingType) searchParams.set("cond[신고구분::EQ]", params.filingType);

  const url = `${baseUrl}?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Tax Calendar API responded with ${response.status}`);

    const json = await response.json();
    const items = json?.data ?? [];
    const now = new Date().toISOString();

    const data: TaxCalendarApiData[] = items.map((item: Record<string, unknown>) => ({
      taxType: String(item["세목"] ?? item.taxType ?? ""),
      filingType: String(item["신고구분"] ?? item.filingType ?? ""),
      periodStart: String(item["귀속기간시작"] ?? item.periodStart ?? ""),
      periodEnd: String(item["귀속기간종료"] ?? item.periodEnd ?? ""),
      deadline: String(item["신고납부기한"] ?? item.deadline ?? ""),
      description: String(item["비고"] ?? item.description ?? ""),
      fetchedAt: now,
    }));

    return {
      data,
      fetchedAt: now,
      source: { name: "국세청 세금일정", url: "https://data.go.kr", confidence: "high" },
      totalCount: Number(json?.totalCount ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const taxCalendarApiAdapter = {
  name: "tax-calendar-api",
  fetch: fetchTaxCalendarData,
};
