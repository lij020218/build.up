// ─── 국세청 사업자등록 진위확인/상태조회 어댑터 ────────────────────────────
// API 출처: data.go.kr 15081808 — 사업자번호 유효성 검증 + 영업/폐업 상태 조회

import type { DataAdapterConfig, AdapterResult } from "./types";

export type NtsBusinessConfig = DataAdapterConfig & {
  // baseUrl default: https://api.odcloud.kr/api/nts-businessman/v1
};

export type NtsVerifyInput = {
  businessNumber: string;       // 사업자등록번호 (10자리)
  startDate: string;            // 개업일자 (YYYYMMDD)
  representativeName: string;   // 대표자명
  businessName?: string;        // 상호
};

export type NtsVerifyResult = {
  businessNumber: string;
  valid: boolean;
  validMessage: string;
  fetchedAt: string;
};

export type NtsBusinessStatus = {
  businessNumber: string;
  taxType: string;                // 과세유형 (일반/간이/면세 등)
  taxTypeCode: string;
  operatingStatus: "active" | "suspended" | "closed";
  operatingStatusCode: string;
  closureDate?: string;
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://api.odcloud.kr/api/nts-businessman/v1";
const DEFAULT_TIMEOUT = 10_000;

function mapOperatingStatus(code: string): "active" | "suspended" | "closed" {
  if (code === "01") return "active";
  if (code === "02") return "suspended";
  return "closed";
}

/** 사업자등록 진위확인 (최대 100건) */
export async function verifyBusinessRegistration(
  config: NtsBusinessConfig,
  inputs: NtsVerifyInput[]
): Promise<AdapterResult<NtsVerifyResult>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const body = {
    businesses: inputs.map((i) => ({
      b_no: i.businessNumber.replace(/-/g, ""),
      start_dt: i.startDate,
      p_nm: i.representativeName,
      b_nm: i.businessName ?? "",
    })),
  };

  const url = `${baseUrl}/validate?serviceKey=${encodeURIComponent(config.apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Infuser ${config.apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`NTS Verify API responded with ${response.status}`);

    const json = await response.json();
    const items = json?.data ?? [];
    const now = new Date().toISOString();

    const data: NtsVerifyResult[] = items.map((item: Record<string, unknown>) => ({
      businessNumber: String(item.b_no ?? ""),
      valid: String(item.valid ?? "") === "01",
      validMessage: String(item.valid_msg ?? ""),
      fetchedAt: now,
    }));

    return {
      data,
      fetchedAt: now,
      source: { name: "국세청 사업자등록 진위확인", url: "https://data.go.kr", confidence: "high" },
      totalCount: data.length,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 사업자 상태조회 (최대 100건) */
export async function checkBusinessStatus(
  config: NtsBusinessConfig,
  businessNumbers: string[]
): Promise<AdapterResult<NtsBusinessStatus>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const body = { b_no: businessNumbers.map((n) => n.replace(/-/g, "")) };
  const url = `${baseUrl}/status?serviceKey=${encodeURIComponent(config.apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Infuser ${config.apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`NTS Status API responded with ${response.status}`);

    const json = await response.json();
    const items = json?.data ?? [];
    const now = new Date().toISOString();

    const data: NtsBusinessStatus[] = items.map((item: Record<string, unknown>) => ({
      businessNumber: String(item.b_no ?? ""),
      taxType: String(item.tax_type ?? ""),
      taxTypeCode: String(item.tax_type_cd ?? ""),
      operatingStatus: mapOperatingStatus(String(item.b_stt_cd ?? "03")),
      operatingStatusCode: String(item.b_stt_cd ?? ""),
      closureDate: item.end_dt ? String(item.end_dt) : undefined,
      fetchedAt: now,
    }));

    return {
      data,
      fetchedAt: now,
      source: { name: "국세청 사업자 상태조회", url: "https://data.go.kr", confidence: "high" },
      totalCount: data.length,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const ntsBusinessAdapter = {
  name: "nts-business",
  fetch: (config: NtsBusinessConfig, params: { businessNumbers: string[] }) =>
    checkBusinessStatus(config, params.businessNumbers),
};
