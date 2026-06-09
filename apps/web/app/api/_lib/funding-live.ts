/**
 * funding-live.ts — 라이브 정부 지원사업(창업진흥원 K-Startup) 페치·정규화·병합 공용 헬퍼.
 *
 *  /api/funding/live (웹 GuidesView) 와 /api/funding/match (iOS) 가 공유 → 웹·앱 동일 데이터.
 *
 *  ▸ 캐시 전략 (2026-06-10 "클릭 즉시 342개" 요청 반영):
 *    기존 모듈-레벨 메모리 캐시는 Vercel 람다 인스턴스마다 따로라 cold instance 가 매번
 *    data.go.kr 를 인라인 호출(~10초) → 사용자에게 92개(큐레이션)만 보이다 뒤늦게 342개로 점프.
 *    → Next.js `unstable_cache`(Vercel 공유 Data Cache, 인스턴스 간 영속) 로 전환.
 *      · cold instance 도 재페치 없이 즉시 응답
 *      · 12h 만료 시 stale-while-revalidate — stale 즉시 반환 + 백그라운드 갱신(요청 비차단)
 *      · 실패/빈 응답은 throw 로 분리 → 캐시 미저장(전송 blip 으로 12h 잠김 방지)
 *
 *  키 없거나 실패 시 큐레이션(startupPrograms) 폴백(graceful 200).
 *
 *  ※ 데이터 소스: K-Startup 통합공고(getAnnouncementInformation01) — 중앙부처·지자체·공공기관·
 *    창조경제혁신센터 공고를 모두 집계(약 2.9만 건). 기업마당은 공개 API 미제공이라 미사용.
 */
import { unstable_cache } from "next/cache";
import {
  fetchKStartupPrograms,
  normalizeLiveProgram,
  mergeFundingPrograms,
  startupPrograms,
  type StartupProgram,
} from "@foundone/shared";

const FRESH_TTL_SEC = 12 * 60 * 60;           // 라이브 성공 시 12시간 (Data Cache revalidate)
// 라이브 페치 건수 — 모집중(Rcrt_prgs_yn=Y) 최근 공고. 현재 공고 중인 것만 노출하므로 과다 페치 불필요.
const KSTARTUP_FETCH = 500;

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
 * 라이브 공고만 캐시 (Vercel 공유 Data Cache, 인스턴스 영속 + SWR).
 *  - 성공(>0건) 만 캐시 → 12h 동안 cold instance 포함 전 요청 즉시 응답.
 *  - 빈 결과(키 없음/장애/마감뿐) 는 throw → 미캐시 → 다음 요청 재시도(빠른 회복).
 */
const getCachedLivePrograms = unstable_cache(
  async (): Promise<StartupProgram[]> => {
    const live = await fetchLiveNormalized();
    if (live.length === 0) {
      // 캐시하지 않기 위해 throw — 호출부에서 catch 후 큐레이션 폴백.
      throw new Error("funding-live: empty (no key / fetch fail / nothing open)");
    }
    return live;
  },
  ["funding-live-programs-v1"],
  { revalidate: FRESH_TTL_SEC, tags: ["funding-live"] },
);

/**
 * 큐레이션 + 라이브 병합 결과. `live` = 라이브 데이터가 실제로 합쳐졌는지.
 *  병합 자체는 순수 CPU(수백 건, sub-ms) 라 매 요청 수행 — 캐시는 느린 외부 페치 계층에만.
 */
export async function getMergedFundingPrograms(): Promise<{ programs: StartupProgram[]; live: boolean; at: number }> {
  let live: StartupProgram[] = [];
  let isLive = false;
  try {
    live = await getCachedLivePrograms();
    isLive = live.length > 0;
  } catch (e) {
    // 빈 결과/장애 → 큐레이션 폴백(캐시 안 됨, 다음 요청 재시도).
    if (!process.env.KSTARTUP_API_KEY) {
      console.warn("[funding-live] KSTARTUP_API_KEY 미설정 — 큐레이션만 반환");
    } else {
      console.warn("[funding-live] 라이브 페치 실패 — 큐레이션 폴백:", (e as Error).message);
    }
  }
  return { programs: mergeFundingPrograms(startupPrograms, live), live: isLive, at: Date.now() };
}
