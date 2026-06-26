// ─── 공정거래위원회 브랜드별 가맹점 현황 어댑터 ────────────────────────────
// API 출처: data.go.kr 15110241 — 공정거래위원회_가맹정보_브랜드별 가맹점 현황 제공 서비스
//   Endpoint: https://apis.data.go.kr/1130000/FftcBrandFrcsStatsService/getBrandFrcsStats
//   기존 kftc-franchise(정보공개서 비용)·kftc-disclosure(업종/지역 통계)와 보완 관계:
//   이 서비스는 *브랜드 단위*의 연도별 가맹점수·신규개점·계약종료·평균매출(공식)을 제공.
//
// ⚠️ 응답은 type=json 을 넣어도 XML(EgovMap)로 내려온다 → 경량 정규식 파서로 처리.
// ⚠️ brandNm 파라미터는 서버에서 무시된다(필터 안 됨) → 전 페이지 수집 후 클라이언트 매칭.
// ⚠️ 필수 파라미터: serviceKey, pageNo, numOfRows, yr.

import type { DataAdapterConfig, AdapterResult } from "./types";

export type KftcBrandStatsConfig = DataAdapterConfig;

export type KftcBrandStatsParams = {
  /** 가맹사업 기준년도 (필수, 예: "2024") */
  yr: string;
  pageNo?: number;
  numOfRows?: number;
};

export type BrandFrcsStatsData = {
  year: string;
  industryL: string;        // 업종 대분류 (외식/도소매/서비스)
  industryM: string;        // 업종 중분류 (한식/커피 등)
  companyName: string;      // 가맹본부 상호명
  brandName: string;        // 브랜드명
  storeCount: number;       // 가맹점수 (전국)
  newOpenings: number;      // 신규개점 수
  terminations: number;     // 계약종료 수
  cancellations: number;    // 계약해지 수
  nameChanges: number;      // 명의변경 수
  avgSalesThousandWon: number;       // 평균매출액 (천원 단위, 0 = 미공개)
  avgSalesPerAreaThousandWon: number; // 면적(3.3㎡)당 평균매출액 (천원, 0 = 미공개)
  fetchedAt: string;
};

const DEFAULT_BASE_URL = "https://apis.data.go.kr/1130000/FftcBrandFrcsStatsService";
const DEFAULT_TIMEOUT = 15_000;

/** EgovMap XML 의 <item>…</item> 블록을 평면 객체 배열로 추출 (자식 노드가 전부 스칼라라 정규식으로 안전). */
function parseItems(xml: string): Array<Record<string, string>> {
  const items: Array<Record<string, string>> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const fieldRe = /<([a-zA-Z][\w]*)>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const obj: Record<string, string> = {};
    let f: RegExpExecArray | null;
    while ((f = fieldRe.exec(m[1])) !== null) {
      obj[f[1]] = f[2].trim();
    }
    items.push(obj);
  }
  return items;
}

function readResultMsg(xml: string): { code: string; msg: string; totalCount: number } {
  const code = /<resultCode>([^<]*)<\/resultCode>/.exec(xml)?.[1] ?? "";
  const msg = /<resultMsg>([^<]*)<\/resultMsg>/.exec(xml)?.[1] ?? "";
  const totalCount = Number(/<totalCount>([0-9]*)<\/totalCount>/.exec(xml)?.[1] ?? 0);
  return { code, msg, totalCount };
}

/** 한 페이지 조회 (raw items). */
export async function fetchBrandFrcsStatsPage(
  config: KftcBrandStatsConfig,
  params: KftcBrandStatsParams
): Promise<AdapterResult<BrandFrcsStatsData>> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const sp = new URLSearchParams({
    serviceKey: config.apiKey,
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 100),
    yr: params.yr,
    type: "json", // 무시되지만 관례상 유지
  });
  const url = `${baseUrl}/getBrandFrcsStats?${sp.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`KFTC brand-stats responded with ${res.status}`);
    const xml = await res.text();
    const { code, msg, totalCount } = readResultMsg(xml);
    if (code && code !== "00") throw new Error(`KFTC brand-stats error ${code}: ${msg}`);

    const now = new Date().toISOString();
    const data: BrandFrcsStatsData[] = parseItems(xml)
      .filter((it) => it.brandNm)
      .map((it) => ({
        year: String(it.yr ?? params.yr),
        industryL: String(it.indutyLclasNm ?? ""),
        industryM: String(it.indutyMlsfcNm ?? ""),
        companyName: String(it.corpNm ?? ""),
        brandName: String(it.brandNm ?? ""),
        storeCount: Number(it.frcsCnt ?? 0),
        newOpenings: Number(it.newFrcsRgsCnt ?? 0),
        terminations: Number(it.ctrtEndCnt ?? 0),
        cancellations: Number(it.ctrtCncltnCnt ?? 0),
        nameChanges: Number(it.nmChgCnt ?? 0),
        avgSalesThousandWon: Number(it.avrgSlsAmt ?? 0),
        avgSalesPerAreaThousandWon: Number(it.arUnitAvrgSlsAmt ?? 0),
        fetchedAt: now,
      }));

    return {
      data,
      fetchedAt: now,
      source: {
        name: "공정거래위원회 브랜드별 가맹점 현황",
        url: "https://www.data.go.kr/data/15110241/openapi.do",
        confidence: "high",
      },
      totalCount,
      hasMore: (params.pageNo ?? 1) * (params.numOfRows ?? 100) < totalCount,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 한 연도의 전 브랜드를 페이지네이션으로 모두 수집. */
export async function fetchAllBrandFrcsStats(
  config: KftcBrandStatsConfig,
  yr: string,
  opts: { numOfRows?: number; onPage?: (p: number, total: number) => void } = {}
): Promise<BrandFrcsStatsData[]> {
  const numOfRows = opts.numOfRows ?? 1000;
  const all: BrandFrcsStatsData[] = [];
  let pageNo = 1;
  // 첫 페이지로 totalCount 파악 후 끝까지.
  for (;;) {
    const res = await fetchBrandFrcsStatsPage(config, { yr, pageNo, numOfRows });
    all.push(...res.data);
    const total = res.totalCount ?? all.length;
    opts.onPage?.(pageNo, total);
    if (pageNo * numOfRows >= total || res.data.length === 0) break;
    pageNo += 1;
  }
  return all;
}

export const kftcBrandStatsAdapter = {
  name: "kftc-brand-stats",
  fetch: fetchBrandFrcsStatsPage,
};
