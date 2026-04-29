/**
 * In-memory rate limiter
 *  - 단일 Next.js 인스턴스 가정 (개발/프로토타입 단계 적합)
 *  - 프로덕션 다중 인스턴스 환경에서는 Redis/Supabase 백업 필요 (TODO)
 *  - windowMs 를 버킷에 저장해 정확한 만료 처리 → 일일 한도(24h) 도 안전하게 작동
 */
type Bucket = {
  count: number;
  windowStartedAt: number;
  windowMs: number;
};

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // 1분마다 정리
const MAX_BUCKETS = 10_000;

function evictStale(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL && buckets.size < MAX_BUCKETS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    // 버킷의 windowMs 가 만료됐으면 (그리고 약간의 grace 30초 후) 삭제
    if (now - bucket.windowStartedAt >= bucket.windowMs + 30_000) {
      buckets.delete(key);
    }
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number; limit: number; resetAt: number }
  | { ok: false; status: number; error: string; remaining: number; limit: number; resetAt: number };

export function checkSimpleRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  /** 메시지 커스터마이즈 (한도 초과 시 사용자에게 보여줄 안내) */
  message?: string;
}): RateLimitResult {
  const now = Date.now();
  evictStale(now);

  const current = buckets.get(params.key);

  // 새 윈도우 (없거나 만료됨)
  if (!current || now - current.windowStartedAt >= params.windowMs) {
    buckets.set(params.key, { count: 1, windowStartedAt: now, windowMs: params.windowMs });
    return {
      ok: true,
      remaining: params.limit - 1,
      limit: params.limit,
      resetAt: now + params.windowMs,
    };
  }

  // 한도 초과
  if (current.count >= params.limit) {
    return {
      ok: false,
      status: 429,
      error: params.message ?? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      remaining: 0,
      limit: params.limit,
      resetAt: current.windowStartedAt + params.windowMs,
    };
  }

  current.count += 1;
  buckets.set(params.key, current);
  return {
    ok: true,
    remaining: params.limit - current.count,
    limit: params.limit,
    resetAt: current.windowStartedAt + params.windowMs,
  };
}

/**
 * 일일 한도 — 자정(KST) 기준 리셋이 아니라 첫 요청 시점부터 24h 윈도우.
 *  - 단순/예측 가능: 사장님이 "오전 10시에 처음 썼으면 다음날 오전 10시에 리셋"
 *  - 자정 리셋이 필요하면 별도 함수로 확장 가능
 */
export function checkDailyRateLimit(params: {
  userId: string;
  feature: string;     // "quick-query" 등
  limit: number;
  message?: string;
}): RateLimitResult {
  return checkSimpleRateLimit({
    key: `daily:${params.feature}:${params.userId}`,
    limit: params.limit,
    windowMs: 24 * 60 * 60 * 1000, // 24h
    message: params.message,
  });
}

/**
 * 현재 사용량만 조회 (count 증가 없음). UI 에서 "남은 횟수" 표시용.
 */
export function peekRateLimit(params: { key: string; limit: number; windowMs: number }):
  { remaining: number; limit: number; resetAt: number } {
  const now = Date.now();
  const current = buckets.get(params.key);
  if (!current || now - current.windowStartedAt >= params.windowMs) {
    return { remaining: params.limit, limit: params.limit, resetAt: now + params.windowMs };
  }
  return {
    remaining: Math.max(0, params.limit - current.count),
    limit: params.limit,
    resetAt: current.windowStartedAt + params.windowMs,
  };
}
