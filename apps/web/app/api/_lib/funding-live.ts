/**
 * funding-live.ts — 라이브 정부 지원사업(기업마당 + K-Startup) 페치·정규화·병합 공용 헬퍼.
 *
 *  /api/funding/live (웹 GuidesView) 와 /api/funding/match (iOS) 가 공유 → 웹·앱 동일 데이터.
 *  12시간 모듈 캐시(warm instance). API 키 없거나 실패 시 큐레이션(startupPrograms) 폴백.
 */
import {
  fetchBizinfoGov,
  fetchKStartupPrograms,
  normalizeLiveProgram,
  mergeFundingPrograms,
  startupPrograms,
  type StartupProgram,
  type GovernmentSupportProgram,
} from "@foundone/shared";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
let cache: { programs: StartupProgram[]; live: boolean; at: number } | null = null;

async function fetchLiveNormalized(): Promise<StartupProgram[]> {
  const bizKey = process.env.BIZINFO_API_KEY;
  const ksKey = process.env.KSTARTUP_API_KEY;
  const jobs: Promise<GovernmentSupportProgram[]>[] = [];
  if (bizKey) {
    jobs.push(fetchBizinfoGov({ apiKey: bizKey, baseUrl: "" }, { searchCnt: 100 }).then((r) => r.data).catch(() => []));
  }
  if (ksKey) {
    jobs.push(fetchKStartupPrograms({ apiKey: ksKey, baseUrl: "" }, { numOfRows: 100 }).then((r) => r.data).catch(() => []));
  }
  if (jobs.length === 0) return [];
  const gov = (await Promise.all(jobs)).flat();
  return gov.map((g) => normalizeLiveProgram(g)).filter((p) => p.applicationStatus !== "closed");
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
