// ─── 기업마당 (BizInfo) 정부 지원사업 공고 API 어댑터 ────────────────────────
// API 출처: bizinfo.go.kr
// 정부 지원사업 공고 목록을 가져와 정규화합니다.

import type { DataAdapterConfig, AdapterResult } from "./types";
import type { GovernmentSupportProgram } from "./support-programs";

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

// ─── 통합 펀딩용: GovernmentSupportProgram 형태로 반환(robust) ────────────────
//   하이브리드 펀딩 페이지(/api/funding/live)가 K-Startup 과 동일 형태로 다루도록 정규화.
//   실제 bizinfo 응답은 신청기간이 결합형(reqstBeginEndDe "YYYYMMDD ~ YYYYMMDD") 또는
//   분리형(reqstBeginDt/reqstEndDt)으로 올 수 있어 둘 다 수용. 분야명도 변형(pldir.../areaNm) 수용.
const BIZINFO_HOST = "https://www.bizinfo.go.kr";

/** "20260613 ~ 20260627" / "20260613~20260627" / "20260613" → [start, end] (YYYY-MM-DD) */
export function parseBizinfoPeriod(raw: string | undefined): { start?: string; end?: string } {
  if (!raw) return {};
  const dates = String(raw).match(/\d{8}/g);
  if (!dates || dates.length === 0) return {};
  const fmt = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return { start: fmt(dates[0]), end: dates[1] ? fmt(dates[1]) : undefined };
}

export async function fetchBizinfoGov(
  config: BizInfoConfig,
  params: { searchCnt?: number } = {}
): Promise<AdapterResult<GovernmentSupportProgram>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  const search = new URLSearchParams({
    crtfcKey: config.apiKey,
    dataType: "json",
    searchCnt: String(params.searchCnt ?? 100),
  });
  const url = `${baseUrl}?${search.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`BizInfo API responded with ${res.status}`);
    const json = await res.json();
    if (json?.reqErr) throw new Error(`기업마당 API: ${json.reqErr}`);
    const items: Record<string, unknown>[] = Array.isArray(json?.jsonArray) ? json.jsonArray : [];
    const now = new Date().toISOString();
    const today = now.slice(0, 10).replace(/-/g, "");

    const data: GovernmentSupportProgram[] = items
      .filter((it) => it && it.pblancNm)
      .map((it) => {
        // 기간: 결합형 우선, 없으면 분리형
        let start: string | undefined;
        let end: string | undefined;
        if (it.reqstBeginEndDe) {
          const p = parseBizinfoPeriod(it.reqstBeginEndDe as string);
          start = p.start; end = p.end;
        } else {
          const b = parseBizinfoPeriod(it.reqstBeginDt as string);
          const e = parseBizinfoPeriod(it.reqstEndDt as string);
          start = b.start; end = e.start;
        }
        const rawUrl = String(it.pblancUrl ?? "");
        const fullUrl = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `${BIZINFO_HOST}${rawUrl}`) : undefined;
        return {
          id: `bizinfo-${it.pblancId ?? it.pblancNm}`,
          source: "bizinfo" as const,
          programName: String(it.pblancNm ?? ""),
          organizerName: String(it.jrsdInsttNm ?? it.excInsttNm ?? ""),
          supportCategory: String(it.pldirSportRealmLclasCodeNm ?? it.areaNm ?? "지원사업"),
          applicationStart: start,
          applicationEnd: end,
          isOpen: end ? end.replace(/-/g, "") >= today : true,
          targetDescription: it.trgetNm ? String(it.trgetNm) : undefined,
          benefitDescription: (it.bsnsSumryCn ?? it.sprtCn) ? String(it.bsnsSumryCn ?? it.sprtCn) : undefined,
          url: fullUrl,
          fetchedAt: now,
        };
      });
    return {
      data,
      fetchedAt: now,
      source: { name: "기업마당 지원사업정보", url: BIZINFO_HOST, confidence: "high" },
      totalCount: data.length,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
