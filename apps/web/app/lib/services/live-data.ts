// ─── 라이브 공공데이터 서비스 레이어 ─────────────────────────────────────
// 클라이언트에서 /api/data/* 라우트를 호출하는 타입 안전 래퍼
// 각 함수는 인증 토큰을 자동으로 포함합니다.

import type {
  AdapterResult,
  LocaldataPermitData,
  SemasStoreData,
  PopulationData,
  CommercialTransactionData,
  IndustryStartupCostData,
  RegionalSalesData,
  GovernmentSupportProgram,
  StoreChangeData,
  BuildingRegistryData,
  TaxCalendarApiData,
} from "@build-up/shared";

async function apiFetch<T>(path: string, token?: string): Promise<AdapterResult<T>> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(path, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── 상권 분석 ──

export async function fetchLiveCompetitorStores(params: {
  divId?: string; key?: string; indsLclsCd?: string; numOfRows?: number;
}, token?: string) {
  const sp = new URLSearchParams();
  if (params.divId) sp.set("divId", params.divId);
  if (params.key) sp.set("key", params.key);
  if (params.indsLclsCd) sp.set("indsLclsCd", params.indsLclsCd);
  if (params.numOfRows) sp.set("numOfRows", String(params.numOfRows));
  return apiFetch<SemasStoreData>(`/api/data/stores?${sp}`, token);
}

export async function fetchLivePermits(params: {
  opnSvcId?: string; localCode?: string; pageSize?: number;
}, token?: string) {
  const sp = new URLSearchParams();
  if (params.opnSvcId) sp.set("opnSvcId", params.opnSvcId);
  if (params.localCode) sp.set("localCode", params.localCode);
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  return apiFetch<LocaldataPermitData>(`/api/data/permits?${sp}`, token);
}

export async function fetchLivePopulation(params: {
  sido?: string; sigungu?: string;
}, token?: string) {
  const sp = new URLSearchParams();
  if (params.sido) sp.set("sido", params.sido);
  if (params.sigungu) sp.set("sigungu", params.sigungu);
  return apiFetch<PopulationData>(`/api/data/population?${sp}`, token);
}

// ── 부동산 ──

export async function fetchLiveTransactions(params: {
  lawdCd: string; dealYm: string;
}, token?: string) {
  return apiFetch<CommercialTransactionData>(
    `/api/data/real-estate/transactions?lawdCd=${params.lawdCd}&dealYm=${params.dealYm}`, token
  );
}

// ── 프랜차이즈/업종 통계 ──

export async function fetchLiveIndustryCosts(params: {
  industryCode?: string; year?: string;
}, token?: string) {
  const sp = new URLSearchParams();
  if (params.industryCode) sp.set("industryCode", params.industryCode);
  if (params.year) sp.set("year", params.year);
  return apiFetch<IndustryStartupCostData>(`/api/data/franchise/industry-costs?${sp}`, token);
}

export async function fetchLiveRegionalSales(params: {
  industryCode?: string; regionCode?: string; year?: string;
}, token?: string) {
  const sp = new URLSearchParams();
  if (params.industryCode) sp.set("industryCode", params.industryCode);
  if (params.regionCode) sp.set("regionCode", params.regionCode);
  if (params.year) sp.set("year", params.year);
  return apiFetch<RegionalSalesData>(`/api/data/franchise/regional-sales?${sp}`, token);
}

export async function fetchLiveStoreChanges(params: {
  industryCode?: string; year?: string;
}, token?: string) {
  const sp = new URLSearchParams();
  if (params.industryCode) sp.set("industryCode", params.industryCode);
  if (params.year) sp.set("year", params.year);
  return apiFetch<StoreChangeData>(`/api/data/franchise/store-changes?${sp}`, token);
}

// ── 정부 지원사업 ──

export async function fetchLiveSupportPrograms(params: {
  keyword?: string; numOfRows?: number;
}, token?: string) {
  const sp = new URLSearchParams();
  if (params.keyword) sp.set("keyword", params.keyword);
  if (params.numOfRows) sp.set("numOfRows", String(params.numOfRows));
  return apiFetch<GovernmentSupportProgram>(`/api/data/support-programs?${sp}`, token);
}

// ── 건축물대장 ──

export async function fetchLiveBuilding(params: {
  sigunguCd: string; bjdongCd: string; bun?: string; ji?: string;
}, token?: string) {
  const sp = new URLSearchParams({ sigunguCd: params.sigunguCd, bjdongCd: params.bjdongCd });
  if (params.bun) sp.set("bun", params.bun);
  if (params.ji) sp.set("ji", params.ji);
  return apiFetch<BuildingRegistryData>(`/api/data/building?${sp}`, token);
}

// ── 세금 일정 ──

export async function fetchLiveTaxCalendar(params?: {
  taxType?: string;
}, token?: string) {
  const sp = new URLSearchParams();
  if (params?.taxType) sp.set("taxType", params.taxType);
  return apiFetch<TaxCalendarApiData>(`/api/data/tax-calendar?${sp}`, token);
}
