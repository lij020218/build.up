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
  /** 모집 진행중(Rcrt_prgs_yn=Y)만 — 현재 공고 중 공고 우선 */
  recruitingOnly?: boolean;
};

export type GovernmentSupportProgram = {
  id: string;
  source: "kstartup" | "mss" | "bizinfo";
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
  // ── K-Startup getAnnouncementInformation01 구조화 필드 (공식 설계서 v2.0) ──
  /** 지역명 (supt_regin) — 예: "서울특별시" */
  region?: string;
  /** 대상 연령 (biz_trgt_age) — 예: "만 20세 이상 ~ 만 39세 이하" */
  targetAge?: string;
  /** 창업 기간 (biz_enyy) — 예: "7년미만,3년미만,예비창업자" */
  businessPeriod?: string;
  /** 우대 사항 (prfn_matr) — "유리한 점" */
  preferentialNote?: string;
  /** 주관기관 유형 (sprv_inst) — "공공기관"·"지자체"·"민간"·"교육기관" → 분류에 사용 */
  organizerType?: string;
  fetchedAt: string;
};

const KSTARTUP_BASE_URL = "https://apis.data.go.kr/B552735/kisedKstartupService01";
const DEFAULT_TIMEOUT = 10_000;

/** "2012-11-29 00:00:00" 또는 "20121129" → "2012-11-29" */
function normKstartupDate(raw: unknown): string | undefined {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  const m = s.match(/(\d{4})[-.]?(\d{2})[-.]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

/**
 * 창업진흥원 K-Startup 지원사업 공고 조회 — 공식 설계서 v2.0 기준.
 *   엔드포인트: /getAnnouncementInformation01 (구 getAnnouncementList 아님)
 *   요청: serviceKey + page/perPage/returnType=json (구 pageNo/numOfRows 아님)
 *   응답(신규 data.go.kr 포맷): { data:[...] } / 구포맷 items.item 도 robust 수용
 *   필드: biz_pbanc_nm·supt_biz_clsfc·supt_regin·biz_trgt_age·biz_enyy·prfn_matr·
 *         pbanc_rcpt_bgng_dt·pbanc_rcpt_end_dt·detl_pg_url·sprv_inst·pbanc_ntrp_nm·Rcrt_prgs_yn
 */
/**
 * K-Startup 응답의 HTML 엔티티(&apos;·&amp;·&#39; 등) 정리 — 원문이 인코딩된 채 내려와
 *  화면에 날것("&apos;")으로 노출되는 문제 교정. 신규 페치(어댑터)와
 *  기존 캐시 스냅샷 읽기(funding-live) 양쪽에서 사용. (2026-07-10)
 */
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"); // 마지막에 처리 — 이중 인코딩(&amp;apos;) 1단계 해제
}

export async function fetchKStartupPrograms(
  config: SupportProgramsConfig,
  params: SupportProgramsParams = {}
): Promise<AdapterResult<GovernmentSupportProgram>> {
  const baseUrl = config.baseUrl || KSTARTUP_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const searchParams = new URLSearchParams({
    serviceKey: config.apiKey,
    returnType: "json",
    page: String(params.pageNo ?? 1),
    perPage: String(params.numOfRows ?? 100),
  });
  if (params.searchKeyword) searchParams.set("biz_pbanc_nm", params.searchKeyword);
  if (params.recruitingOnly !== false) searchParams.set("Rcrt_prgs_yn", "Y"); // 기본: 모집중만

  const url = `${baseUrl}/getAnnouncementInformation01?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`K-Startup API responded with ${response.status}`);

    const json = await response.json();
    // 신규 포맷 { data:[...] } 우선, 구포맷(items.item) 폴백.
    const rawItems =
      (Array.isArray(json?.data) ? json.data : undefined) ??
      json?.items?.item ??
      json?.response?.body?.items?.item ??
      [];
    const arr: Record<string, unknown>[] = Array.isArray(rawItems) ? rawItems : [rawItems];
    const now = new Date().toISOString();
    const today = now.slice(0, 10).replace(/-/g, "");

    const data: GovernmentSupportProgram[] = arr
      .filter((it) => it && it.biz_pbanc_nm)
      .map((it) => {
        const start = normKstartupDate(it.pbanc_rcpt_bgng_dt);
        const end = normKstartupDate(it.pbanc_rcpt_end_dt);
        const rcrt = String(it.Rcrt_prgs_yn ?? it.rcrt_prgs_yn ?? "").toUpperCase();
        const isOpen = rcrt === "Y" || (end ? end.replace(/-/g, "") >= today : true);
        return {
          id: `kstartup-${it.pbanc_sn ?? it.biz_pbanc_nm}`,
          source: "kstartup" as const,
          programName: decodeHtmlEntities(String(it.biz_pbanc_nm ?? "")),
          organizerName: decodeHtmlEntities(String(it.pbanc_ntrp_nm || "창업지원기관")),
          organizerType: it.sprv_inst ? String(it.sprv_inst) : undefined,
          supportCategory: decodeHtmlEntities(String(it.supt_biz_clsfc ?? "창업")),
          applicationStart: start,
          applicationEnd: end,
          isOpen,
          targetDescription: decodeHtmlEntities(String(it.aply_trgt_ctnt || it.aply_trgt || "")) || undefined,
          benefitDescription: decodeHtmlEntities(String(it.pbanc_ctnt || "")) || undefined,
          applicationMethod: it.aply_mthd_onli_rcpt_istc ? String(it.aply_mthd_onli_rcpt_istc) : undefined,
          contactInfo: it.prch_cnpl_no ? String(it.prch_cnpl_no) : undefined,
          url: String(it.detl_pg_url || it.biz_gdnc_url || "") || undefined,
          region: it.supt_regin ? String(it.supt_regin) : undefined,
          targetAge: it.biz_trgt_age ? String(it.biz_trgt_age) : undefined,
          businessPeriod: it.biz_enyy ? String(it.biz_enyy) : undefined,
          preferentialNote: it.prfn_matr ? decodeHtmlEntities(String(it.prfn_matr)) : undefined,
          fetchedAt: now,
        };
      });

    return {
      data,
      fetchedAt: now,
      source: { name: "K-Startup 창업지원사업", url: "https://www.k-startup.go.kr", confidence: "high" },
      totalCount: Number(json?.totalCount ?? json?.matchCount ?? data.length),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const supportProgramsAdapter = {
  name: "support-programs",
  fetch: fetchKStartupPrograms,
};
