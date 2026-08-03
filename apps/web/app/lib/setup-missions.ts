/**
 * 가게 세팅 미션 — 노출 판정 SSOT (2026-07-28 사장님 지시)
 *
 *  ⚠️ 노출 대상은 "기존 가게 등록"으로 들어온 사장님뿐이다.
 *     로드맵·AI 로드맵으로 진행한 신규 창업자에게 보이면 안 됨 (지시 원문:
 *     "로드맵이나 ai 로드맵으로 진행한 사람들에게는 다르게 보여야 해").
 *
 *  판정 2단:
 *   1) 마커 — 기존 등록 완료 시 industrySpecifics.__setupMeta = { path: "existing" }
 *      (store-info 파이프라인 경유라 동기화·계정격리·초기화가 자동 커버, 마이그레이션 0)
 *   2) 휴리스틱(마커 도입 전 구 유저) — 기존 등록 핸들러는 전 스테이지를 "같은 순간"에
 *      완료 처리한다 → 동일 completedAt 타임스탬프가 15개 이상이면 기존 등록.
 *      · AI 위저드는 prefill 단계 몇 개만 같은 시각 완료(15개 미만) → 미해당
 *      · 로드맵 실완주는 수일~수주에 걸쳐 완료 → 타임스탬프가 흩어짐 → 미해당
 */

export type SetupMeta = {
  path?: string;
  registeredAt?: string;
  dismissed?: boolean;
  /** 국세청 사업자번호 확인 시각 (YYYY-MM-DD) — "언제 확인했는지"가 함께 저장돼야 정직 */
  bizVerifiedAt?: string;
  /** registration-setup 게이트에서 「나중에 확인」 선택 — 세팅 미션으로 후속 */
  bizVerifySkipped?: boolean;
};

export const SETUP_META_KEY = "__setupMeta";

/** 동일 completedAt 판정 임계 — 전 스테이지 일괄 완료(기존 등록)만 넘는 수 */
export const IDENTICAL_COMPLETION_THRESHOLD = 15;

export function readSetupMeta(industrySpecifics: Record<string, unknown> | null | undefined): SetupMeta | null {
  const raw = industrySpecifics?.[SETUP_META_KEY];
  if (!raw || typeof raw !== "object") return null;
  return raw as SetupMeta;
}

export function isExistingBusinessRegistration(
  meta: SetupMeta | null,
  decisions: Record<string, { completedAt?: string | null } | undefined> | null | undefined,
): boolean {
  if (meta?.path === "existing") return true;
  if (!decisions) return false;
  const counts = new Map<string, number>();
  for (const d of Object.values(decisions)) {
    const t = d?.completedAt;
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  for (const n of counts.values()) {
    if (n >= IDENTICAL_COMPLETION_THRESHOLD) return true;
  }
  return false;
}
