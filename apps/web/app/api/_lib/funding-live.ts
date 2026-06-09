/**
 * funding-live.ts — 라이브 정부 지원사업(창업진흥원 K-Startup) 페치·정규화·병합 공용 헬퍼.
 *
 *  /api/funding/live (웹 GuidesView) 와 /api/funding/match (iOS) 가 공유 → 웹·앱 동일 데이터.
 *  12시간 모듈 캐시(warm instance). 키 없거나 실패 시 큐레이션(startupPrograms) 폴백.
 *
 *  ※ 데이터 소스: K-Startup 통합공고(getAnnouncementInformation01) — 중앙부처·지자체·공공기관·
 *    창조경제혁신센터 공고를 모두 집계(약 2.9만 건). 기업마당은 공개 API 미제공이라 미사용.
 *    추가 소스(중소벤처24 등)는 공개 API 확인 시 동일 패턴으로 흡수 가능.
 */
import {
  fetchKStartupPrograms,
  normalizeLiveProgram,
  mergeFundingPrograms,
  startupPrograms,
  type StartupProgram,
} from "@foundone/shared";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
// 라이브 페치 건수 — 모집중(Rcrt_prgs_yn=Y) 최근 공고. 현재 공고 중인 것만 노출하므로 과다 페치 불필요.
const KSTARTUP_FETCH = 500;
let cache: { programs: StartupProgram[]; live: boolean; at: number } | null = null;

async function fetchLiveNormalized(): Promise<StartupProgram[]> {
  const ksKey = process.env.KSTARTUP_API_KEY;
  if (!ksKey) return [];
  const gov = await fetchKStartupPrograms(
    { apiKey: ksKey, baseUrl: "" },
    { numOfRows: KSTARTUP_FETCH, recruitingOnly: true },
  )
    .then((r) => r.data)
    .catch(() => []);
  // ★ 현재 "공고 중"(접수 진행) 인 것만 — 마감·예정 제외(사용자 요청).
  return gov.map((g) => normalizeLiveProgram(g)).filter((p) => p.applicationStatus === "open");
}

/**
 * 큐레이션 + 라이브 병합 결과(캐시). `live` = 라이브 데이터가 실제로 합쳐졌는지.
 */
export async function getMergedFundingPrograms(): Promise<{ programs: StartupProgram[]; live: boolean; at: number }> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache;
  let live: StartupProgram[] = [];
  let isLive = false;
  try {
    live = await fetchLiveNormalized();
    isLive = live.length > 0;
  } catch (e) {
    console.warn("[funding-live] 라이브 페치 실패 — 큐레이션 폴백:", (e as Error).message);
  }
  cache = { programs: mergeFundingPrograms(startupPrograms, live), live: isLive, at: Date.now() };
  return cache;
}
