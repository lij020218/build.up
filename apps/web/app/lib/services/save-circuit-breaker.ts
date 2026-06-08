/**
 * Save Circuit Breaker — 저장 회로 차단기 (채널별).
 *
 * 마이그레이션 미적용 / 서버 영구 오류 같은 "재시도해도 무의미한" 상황에서 자동 저장을 잠시 멈춘다.
 *
 * ⚠️ 2026-06-08 수정 (사장님 신고: "로드맵 데이터가 슈퍼베이스에 저장조차 안 됨"):
 *   이전엔 (1) 전역 단일 플래그라 **매장데이터 저장 오류 1건이 로드맵 저장까지 영구 마비**시켰고,
 *   (2) 새로고침 전까지 절대 안 풀려서, 무관한 테이블의 컬럼 누락이 전체 저장을 죽였다.
 *   → (A) **채널 분리**(roadmap / store) — 한 채널 실패가 다른 채널을 막지 않음.
 *     (B) **쿨다운 자동복구**(half-open) — 트립 후 COOLDOWN_MS 지나면 1회 재시도 허용.
 *        마이그레이션이 적용되면 새로고침 없이 자동 재개. 여전히 실패면 다시 트립.
 *
 * 거짓 기능 0 — 사용자가 SaveStatusBadge 로 원인 확인 가능.
 */

const RETRY_THRESHOLD = 3; // 3회 연속 실패 시 트립(transient)
const COOLDOWN_MS = 45_000; // 트립 후 재시도 허용까지

type ChannelState = {
  broken: boolean;
  reason: string | null;
  consecutiveFailures: number;
  brokenAt: number;
  breakCount: number;
};

const channels = new Map<string, ChannelState>();

function ch(channel: string): ChannelState {
  let c = channels.get(channel);
  if (!c) {
    c = { broken: false, reason: null, consecutiveFailures: 0, brokenAt: 0, breakCount: 0 };
    channels.set(channel, c);
  }
  return c;
}

/** 회로가 열렸나 (저장 시도하지 말아야 하나). 쿨다운 경과 시 half-open 으로 자동 해제. */
export function isCircuitBroken(channel = "default"): boolean {
  const c = ch(channel);
  if (!c.broken) return false;
  if (Date.now() - c.brokenAt >= COOLDOWN_MS) {
    // half-open: 한 번 재시도 허용. 성공하면 recordSaveSuccess 가 완전 해제,
    //   실패하면 recordSaveFailure 가 brokenAt 갱신해 다시 쿨다운.
    c.broken = false;
    c.consecutiveFailures = 0;
    return false;
  }
  return true;
}

export function getBreakReason(channel = "default"): string | null {
  return ch(channel).reason;
}

/** 저장 성공 — 해당 채널 회로 완전 해제. */
export function recordSaveSuccess(channel = "default"): void {
  const c = ch(channel);
  c.consecutiveFailures = 0;
  c.broken = false;
  c.reason = null;
}

/**
 * 저장 실패 기록 — 영구 에러(PGRST204 등)면 즉시 트립, transient 는 3회 연속 시 트립.
 * 트립은 채널 단위 — 다른 채널 저장은 영향받지 않는다.
 */
export function recordSaveFailure(err: unknown, channel = "default"): { isPermanent: boolean; tripped: boolean; message: string } {
  const c = ch(channel);
  c.consecutiveFailures += 1;
  const message = extractMessage(err);
  const code = extractCode(err);
  const isPermanent =
    code === "PGRST204" ||
    /schema cache|column .* does not exist|relation .* does not exist|could not find the/i.test(message);

  if (isPermanent || c.consecutiveFailures >= RETRY_THRESHOLD) {
    c.brokenAt = Date.now(); // 쿨다운 시작/갱신
    if (!c.broken) {
      c.broken = true;
      c.reason = message;
      c.breakCount += 1;
      // eslint-disable-next-line no-console
      console.warn(
        `[save-circuit:${channel}] tripped (${isPermanent ? "permanent" : "after " + c.consecutiveFailures + " failures"}). ` +
        `Auto-retry in ${COOLDOWN_MS / 1000}s. Reason: ${message}`,
      );
    }
    return { isPermanent, tripped: true, message };
  }
  return { isPermanent: false, tripped: false, message };
}

/** 수동 reset — 채널 미지정 시 전체. (SaveStatusBadge "다시 시도" + 마이그레이션 적용 후) */
export function resetCircuit(channel?: string): void {
  if (channel) {
    const c = ch(channel);
    c.broken = false; c.reason = null; c.consecutiveFailures = 0;
    return;
  }
  for (const c of channels.values()) {
    c.broken = false; c.reason = null; c.consecutiveFailures = 0;
  }
}

/** 디버그용 — 트립 횟수(채널). */
export function getBreakCount(channel = "default"): number {
  return ch(channel).breakCount;
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

function extractCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return "";
}
