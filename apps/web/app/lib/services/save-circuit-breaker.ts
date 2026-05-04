/**
 * Save Circuit Breaker — 전역 저장 회로 차단기.
 *
 * 마이그레이션 미적용 / 서버 영구 오류 / 인증 끊김 같은 "재시도해도 무의미한" 상황에서
 * 모든 자동 저장 경로 (5s interval, roadmap autosave 800ms, useStoreInfoSaver 600ms,
 * flushStoreDataImmediate) 가 한 번 트립되면 모두 멈추도록 통일.
 *
 * 새로고침으로 reset.
 *
 * 거짓 기능 0 — 사용자가 SaveStatusBadge 로 원인 명확히 확인 가능.
 */

let broken = false;
let breakReason: string | null = null;
let breakCount = 0;

const RETRY_THRESHOLD = 3; // 3회 연속 실패 시 트립

let consecutiveFailures = 0;

/** 회로가 열렸나 (저장 시도하지 말아야 하나) */
export function isCircuitBroken(): boolean {
  return broken;
}

export function getBreakReason(): string | null {
  return breakReason;
}

/** 저장 성공 — counter 리셋 */
export function recordSaveSuccess(): void {
  consecutiveFailures = 0;
}

/**
 * 저장 실패 기록 — 영구 에러 (PGRST204 등) 면 즉시 회로 트립.
 * 그 외 transient 에러는 3회 연속 실패해야 트립.
 */
export function recordSaveFailure(err: unknown): { isPermanent: boolean; tripped: boolean; message: string } {
  consecutiveFailures += 1;
  const message = extractMessage(err);
  const code = extractCode(err);
  // PostgREST 에러 코드는 모두 PG로 시작 (PGRST204 = schema mismatch, PGRST116 = no rows, etc).
  // schema/relation/column 누락 메시지도 모두 영구 실패로 간주.
  const isPermanent =
    code === "PGRST204" ||
    /schema cache|column .* does not exist|relation .* does not exist|could not find the/i.test(message);

  if (isPermanent || consecutiveFailures >= RETRY_THRESHOLD) {
    if (!broken) {
      broken = true;
      breakReason = message;
      breakCount += 1;
      // 사용자 가시성: 1회만 콘솔 경고
      // eslint-disable-next-line no-console
      console.warn(
        `[save-circuit] tripped (${isPermanent ? "permanent" : "after " + consecutiveFailures + " failures"}). ` +
        `All auto-save paused until page refresh. Reason: ${message}`,
      );
    }
    return { isPermanent, tripped: true, message };
  }
  return { isPermanent: false, tripped: false, message };
}

/** 페이지 새로고침 외 수동 reset 도 가능하게 — 마이그레이션 적용 후 즉시 재시도용 */
export function resetCircuit(): void {
  broken = false;
  breakReason = null;
  consecutiveFailures = 0;
}

/** 디버그용 — 트립 횟수 */
export function getBreakCount(): number {
  return breakCount;
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
