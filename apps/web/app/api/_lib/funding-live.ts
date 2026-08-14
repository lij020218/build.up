/**
 * funding-live.ts — 라이브 정부 지원사업(창업진흥원 K-Startup) 페치·정규화·병합 공용 헬퍼.
 *
 *  /api/funding/live (웹 GuidesView) 와 /api/funding/match (iOS) 가 공유 → 웹·앱 동일 데이터.
 *
 *  ▸ 캐시 전략 (2026-06-10 "클릭 즉시 342개" 요청 반영):
 *    예전: 람다 인스턴스마다 따로인 모듈 메모리 캐시 → cold instance 가 매 방문 data.go.kr 를
 *          인라인 호출(~10초) → 92개(큐레이션)만 보이다 뒤늦게 342개 점프.
 *    지금: cron(/api/cron/funding-live)이 사용자 경로 밖에서 미리 페치 → Supabase
 *          `funding_live_snapshot`(단일 global row) 저장. 라우트는 그 row 만 읽어(수십 ms) 즉시 응답.
 *      · Supabase = 인스턴스 간 영속 공유 캐시 → cold instance 도 빠름
 *      · 큐레이션(startupPrograms 정적)과는 *읽기 시점*에 병합 → 큐레이션 코드 변경 즉시 반영
 *      · 60초 in-process memo 로 warm instance 의 반복 DB 읽기 절감
 *      · 스냅샷 없음/만료(첫 배포 직후 등)면 인라인 빌드로 self-heal + 스냅샷 기록(다음 요청부터 빠름)
 *
 *  키 없거나 실패 시 큐레이션(startupPrograms) 폴백(graceful 200).
 *
 *  ※ 데이터 소스: K-Startup 통합공고 — 중앙부처·지자체·공공기관·창조경제혁신센터 공고(약 2.9만 건).
 *    기업마당은 공개 API 미제공이라 미사용.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  decodeHtmlEntities,
  fetchKStartupPrograms,
  mapKstartupRawItems,
  normalizeLiveProgram,
  mergeFundingPrograms,
  startupPrograms,
  type StartupProgram,
} from "@foundone/shared";
import { getSupabaseAdmin } from "./supabase-admin";

const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;  // 스냅샷 사용 가능 한도(cron 은 6h 마다 갱신)
const MEMO_TTL_MS = 60 * 1000;                // warm instance in-process memo
const KSTARTUP_FETCH = 500;
const SNAPSHOT_ID = "global";

type MergedResult = { programs: StartupProgram[]; live: boolean; at: number };
let memo: { result: MergedResult; at: number } | null = null;

// ── 공개 읽기 전용 anon 클라이언트 (funding_live_snapshot 은 public SELECT 정책) ──
let _readClient: SupabaseClient | null = null;
function getReadClient(): SupabaseClient | null {
  if (_readClient) return _readClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  _readClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return _readClient;
}

/** 직전 라이브 페치 실패 사유 — cron 응답에 실어 Vercel 로그에서 원인이 보이게 한다. */
let lastFetchFailReason: string | null = null;

/** K-Startup 라이브 페치 → 현재 "공고 중"(접수 진행) 인 것만 정규화. */
async function fetchLiveNormalized(): Promise<StartupProgram[]> {
  const ksKey = process.env.KSTARTUP_API_KEY;
  // ⚠️ 침묵 실패 금지 (2026-08-04 실사고): prod 키 문제로 8/2 부터 크론이 조용히 count:0 을
  //   반환하며 스냅샷이 썩었고, 사용자에겐 큐레이션(하드코딩)만 보였다. 실패 사유를 남긴다.
  if (!ksKey) {
    lastFetchFailReason = "KSTARTUP_API_KEY 미설정";
    console.error("[funding-live] KSTARTUP_API_KEY 미설정 — 라이브 페치 불가");
    return [];
  }
  const gov = await fetchKStartupPrograms(
    { apiKey: ksKey, baseUrl: "" },
    { numOfRows: KSTARTUP_FETCH, recruitingOnly: true },
  )
    .then((r) => {
      lastFetchFailReason = null;
      return r.data;
    })
    .catch((e: unknown) => {
      lastFetchFailReason = e instanceof Error ? e.message : String(e);
      console.error("[funding-live] K-Startup 페치 실패:", lastFetchFailReason);
      return [];
    });
  return gov.map((g) => normalizeLiveProgram(g)).filter((p) => p.applicationStatus === "open");
}

/** 스냅샷 행의 문자열 필드 HTML 엔티티 정리 — 어댑터 디코드(2026-07-10) 이전에 저장된
 *  구캐시 행에 &apos; 등이 남아 있어, 다음 cron 재수집 전까지 읽기 경로에서도 교정. */
function decodeProgramStrings<T>(value: T): T {
  if (typeof value === "string") return decodeHtmlEntities(value) as unknown as T;
  if (Array.isArray(value)) return value.map(decodeProgramStrings) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = decodeProgramStrings(v);
    return out as unknown as T;
  }
  return value;
}

/** Supabase 스냅샷 읽기(빠른 경로). 없거나 손상 시 null. */
async function readSnapshot(): Promise<{ live: StartupProgram[]; at: number } | null> {
  const sb = getReadClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("funding_live_snapshot")
      .select("live_programs, fetched_at")
      .eq("id", SNAPSHOT_ID)
      .maybeSingle();
    if (error || !data || !Array.isArray(data.live_programs)) return null;
    return {
      live: (data.live_programs as StartupProgram[]).map(decodeProgramStrings),
      at: data.fetched_at ? new Date(data.fetched_at as string).getTime() : 0,
    };
  } catch {
    return null;
  }
}

/** service_role 로 스냅샷 기록 (cron / self-heal 에서만). */
async function writeSnapshot(live: StartupProgram[]): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const now = new Date().toISOString();
  const { error } = await sb
    .from("funding_live_snapshot")
    .upsert(
      { id: SNAPSHOT_ID, live_programs: live, live: live.length > 0, total: live.length, fetched_at: now, updated_at: now },
      { onConflict: "id" },
    );
  return !error;
}

/**
 * cron 전용 — 라이브 강제 재페치 후 스냅샷 저장. (사용자 경로 밖)
 *  @returns 저장된 라이브 공고 수 + 성공 여부.
 */
export async function rebuildAndStoreFundingSnapshot(): Promise<{ count: number; live: boolean; stored: boolean; error?: string }> {
  const live = await fetchLiveNormalized();
  const stored = live.length > 0 ? await writeSnapshot(live) : false;
  // memo 무효화 — 다음 사용자 요청이 새 스냅샷 반영
  memo = null;
  return {
    count: live.length,
    live: live.length > 0,
    stored,
    // 0건이면 사유를 응답에 실어 크론 로그만으로 진단 가능하게 (2026-08-04 실사고 재발 방지)
    ...(live.length === 0 ? { error: lastFetchFailReason ?? "페치 성공했으나 모집중 공고 0건" } : {}),
  };
}

/**
 * 릴레이 경로 — 한국 IP 환경(로컬 맥 launchd)이 K-Startup 원본(data 배열)을 받아 POST 로 넘기면,
 *  서버가 SSOT 매핑·정규화 후 스냅샷 저장. (2026-08-14: data.go.kr 게이트웨이가 클라우드 IP 를
 *  차단해 Vercel 직접 페치가 400 → 원본 수집만 밖에서, 가공은 여기서.)
 */
export async function storeFundingSnapshotFromRawItems(
  rawItems: unknown[],
): Promise<{ count: number; stored: boolean }> {
  const live = mapKstartupRawItems(rawItems)
    .map((g) => normalizeLiveProgram(g))
    .filter((p) => p.applicationStatus === "open");
  const stored = live.length > 0 ? await writeSnapshot(live) : false;
  memo = null; // 다음 사용자 요청이 새 스냅샷 반영
  return { count: live.length, stored };
}

/**
 * 큐레이션 + 라이브 병합 결과. `live` = 라이브 데이터가 실제로 합쳐졌는지.
 *  병합은 순수 CPU(수백 건, sub-ms). 느린 외부 페치는 cron + Supabase 스냅샷으로 분리.
 */
export async function getMergedFundingPrograms(): Promise<MergedResult> {
  // 1) in-process memo (warm instance) — DB 왕복 절감.
  if (memo && Date.now() - memo.at < MEMO_TTL_MS) return memo.result;

  // 2) Supabase 스냅샷 (cross-instance, 빠름) — cron 이 채워둔 정상 경로.
  const snap = await readSnapshot();
  if (snap && snap.live.length > 0 && Date.now() - snap.at < SNAPSHOT_TTL_MS) {
    const result: MergedResult = { programs: mergeFundingPrograms(startupPrograms, snap.live), live: true, at: snap.at };
    memo = { result, at: Date.now() };
    return result;
  }

  // 3) 스냅샷 없음/만료(첫 배포 직후 등) → 인라인 빌드 self-heal + 스냅샷 기록.
  let live: StartupProgram[] = [];
  let isLive = false;
  try {
    live = await fetchLiveNormalized();
    isLive = live.length > 0;
  } catch (e) {
    console.warn("[funding-live] 라이브 페치 실패 — 큐레이션 폴백:", (e as Error).message);
  }
  if (!isLive && !process.env.KSTARTUP_API_KEY) {
    console.warn("[funding-live] KSTARTUP_API_KEY 미설정 — 큐레이션만 반환");
  }
  if (isLive) void writeSnapshot(live).catch(() => {}); // fire-and-forget — 다음 요청부터 빠름

  const result: MergedResult = { programs: mergeFundingPrograms(startupPrograms, live), live: isLive, at: Date.now() };
  if (isLive) memo = { result, at: Date.now() }; // 실패는 짧게(memo 안 함) → 빠른 재시도
  return result;
}
