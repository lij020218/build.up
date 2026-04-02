// ─── 정부 지원사업 통합 어댑터 ──────────────────────────────────────────
// API 출처: data.go.kr 15125364 (K-Startup) + 3034791 (중소기업 지원사업 목록)
// 기존 bizinfo-programs.ts를 보완하는 추가 소스입니다.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type SupportProgramsConfig = DataAdapterConfig & {
  // baseUrl default: https://apis.data.go.kr/B552735/kisedKstartupService01
};

export type SupportProgramsParams = {
  pageNo?: number;
  numOfRows?: number;
  searchKeyword?: string;
};

export type GovernmentSupportProgram = {
  id: string;
  source: "kstartup" | "mss";
  programName: string;
  organizerName: string;
  supportCategory: string;     // 지원분야 (금융/기술/인력/창업/경영)
  applicationStart?: string;
  applicationEnd?: string;
  isOpen: boolean;
  targetDescription?: string;  // 지원대상
  benefitDescription?: string; // 지원내용
  applicationMethod?: string;
  contactInfo?: string;
  url?: string;
  fetchedAt: string;
};

const KSTARTUP_BASE_URL = "https://apis.data.go.kr/B552735/kisedKstartupService01";
const DEFAULT_TIMEOUT = 10_000;

export async function fetchKStartupPrograms(
  config: SupportProgramsConfig,
  params: SupportProgramsParams = {}
): Promise<AdapterResult<GovernmentSupportProgram>> {
  const baseUrl = config.baseUrl || KSTARTUP_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    serviceKey: config.apiKey,
    dataType: "json",
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 50),
  });

  if (params.searchKeyword) searchParams.set("searchKeyword", params.searchKeyword);

  const url = `${baseUrl}/getAnnouncementList?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`K-Startup API responded with ${response.status}`);

    const json = await response.json();
    const items = json?.response?.body?.items?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];
    const now = new Date().toISOString();

    const data: GovernmentSupportProgram[] = arr
      .filter((item: Record<string, unknown>) => item && item.pblancNm)
      .map((item: Record<string, unknown>) => ({
        id: `kstartup-${item.pblancId ?? item.pblancNm}`,
        source: "kstartup" as const,
        programName: String(item.pblancNm ?? ""),
        organizerName: String(item.jrsdInsttNm ?? ""),
        supportCategory: String(item.sprtFieldNm ?? "창업"),
        applicationStart: item.reqstBeginDe ? String(item.reqstBeginDe) : undefined,
        applicationEnd: item.reqstEndDe ? String(item.reqstEndDe) : undefined,
        isOpen: (() => {
          const end = String(item.reqstEndDe ?? "");
          if (!end) return true;
          return end.replace(/-/g, "") >= now.slice(0, 10).replace(/-/g, "");
        })(),
        targetDescription: item.trgetNm ? String(item.trgetNm) : undefined,
        benefitDescription: item.sprtCn ? String(item.sprtCn) : undefined,
        url: item.pblancUrl ? String(item.pblancUrl) : undefined,
        fetchedAt: now,
      }));

    return {
      data,
      fetchedAt: now,
      source: { name: "K-Startup 창업지원사업", url: "https://www.k-startup.go.kr", confidence: "high" },
      totalCount: Number(json?.response?.body?.totalCount ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const supportProgramsAdapter = {
  name: "support-programs",
  fetch: fetchKStartupPrograms,
};
