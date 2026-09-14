/**
 * acquisition.ts — 가입 유입 출처(first-touch) 수집 (2026-09-12).
 *
 * 왜: 메타 광고 2종(직원관리 67,084원 / 매출관리 2,163원)을 집행했는데 가입자가 어느
 *   소재로 왔는지 알 수 없었다. 측정이 "랜딩 조회"에서 끊겨 조회당 비용만 알고
 *   **가입자 1명당 비용**을 계산할 수 없었다(광고 분석 문서의 결론과 동일).
 *
 * 무엇을: 첫 방문의 utm_* 와 referrer 호스트만 저장한다.
 *   · first-touch — 이미 저장돼 있으면 덮어쓰지 않는다(광고로 왔다가 나중에 직접 들어와도 광고 기여 유지).
 *   · 캠페인 식별자만. 개인정보·전체 URL·쿼리 전체를 담지 않는다.
 *   · referrer 는 **호스트만** (경로에 검색어 등이 붙을 수 있어 버린다).
 */

const STORAGE_KEY = "foundone.acquisition.v1";
/** 필드당 길이 상한 — 광고 도구가 긴 문자열을 붙이는 경우가 있다. */
const MAX_FIELD = 120;

export type Acquisition = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  /** 유입 도메인만 (예: "l.facebook.com"). 경로·쿼리는 버린다. */
  referrer?: string;
  /** 첫 방문 시각 (ISO). */
  landedAt: string;
};

function clean(v: string | null | undefined): string | undefined {
  if (!v) return undefined;
  const t = v.trim().slice(0, MAX_FIELD);
  return t.length > 0 ? t : undefined;
}

function hostOf(raw: string): string | undefined {
  try {
    return clean(new URL(raw).host);
  } catch {
    return undefined;
  }
}

/** URL 쿼리 + referrer → Acquisition. 아무 신호도 없으면 null. */
export function parseAcquisition(search: string, referrer: string, now: Date = new Date()): Acquisition | null {
  const p = new URLSearchParams(search);
  const acq: Acquisition = {
    source: clean(p.get("utm_source")),
    medium: clean(p.get("utm_medium")),
    campaign: clean(p.get("utm_campaign")),
    content: clean(p.get("utm_content")),
    term: clean(p.get("utm_term")),
    landedAt: now.toISOString(),
  };
  // 같은 사이트 안에서의 이동은 유입이 아니다.
  const refHost = referrer ? hostOf(referrer) : undefined;
  const selfHost = typeof window !== "undefined" ? window.location.host : undefined;
  if (refHost && refHost !== selfHost) acq.referrer = refHost;

  const hasSignal = acq.source || acq.medium || acq.campaign || acq.content || acq.term || acq.referrer;
  return hasSignal ? acq : null;
}

/** 첫 방문에 한 번 호출. 이미 저장돼 있으면 아무것도 하지 않는다(first-touch). */
export function captureAcquisition(): Acquisition | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return JSON.parse(existing) as Acquisition;
    const acq = parseAcquisition(window.location.search, document.referrer);
    if (!acq) return null;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(acq));
    return acq;
  } catch {
    // 사파리 프라이빗 모드 등 — 측정 때문에 앱이 깨지면 안 된다.
    return null;
  }
}

/** 저장된 유입 출처. 없으면 null. */
export function readAcquisition(): Acquisition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Acquisition) : null;
  } catch {
    return null;
  }
}

/**
 * 세션이 생긴 뒤 user_profiles.acquisition 이 비어 있으면 채운다.
 *  이메일 가입은 signUp metadata → 트리거가 이미 채우지만, OAuth(애플·카카오)는
 *  metadata 를 넘길 수 없어 여기서만 채워진다. 이미 값이 있으면 덮어쓰지 않는다(first-touch).
 *  실패는 조용히 무시 — 측정 실패가 로그인을 막으면 안 된다.
 */
/** Supabase 클라이언트 중 여기서 쓰는 부분만. 제네릭 추론이 깊어 typecheck 가 터지므로 좁혀 받는다. */
type AcquisitionWriteClient = {
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

export async function backfillAcquisition(client: AcquisitionWriteClient): Promise<void> {
  const acq = readAcquisition();
  if (!acq) return;
  try {
    const { data: userData } = await client.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { data: row } = await client
      .from("user_profiles")
      .select("acquisition")
      .eq("user_id", userId)
      .maybeSingle();
    // 이미 기록됐으면 덮어쓰지 않는다(first-touch). 행이 아직 없으면 트리거가 만들 때까지 기다린다.
    if (!row || row.acquisition) return;
    await client
      .from("user_profiles")
      .update({ acquisition: acq })
      .eq("user_id", userId)
      .is("acquisition", null);
  } catch {
    // 조용히 무시 — 측정 실패가 로그인을 막으면 안 된다.
  }
}
