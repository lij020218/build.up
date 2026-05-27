/**
 * Rate limiter — Upstash Redis sliding window (production) / in-memory fallback (local dev).
 *
 * Upstash 활성화 조건: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN 환경변수 설정.
 * 미설정 시 in-memory Map fallback (단일 인스턴스 전용).
 *
 * 모든 함수가 async: Vercel Edge 환경에서 Redis HTTP 호출 필요.
 */
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ──────────────────────────────────────────────
// Upstash 초기화
// ──────────────────────────────────────────────

let _redis: Redis | null = null;
const _limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

function msToUpstashDuration(ms: number): `${number} ${"ms" | "s" | "m" | "h" | "d"}` {
  if (ms % 86_400_000 === 0) return `${ms / 86_400_000} d`;
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000} h`;
  if (ms % 60_000 === 0) return `${ms / 60_000} m`;
  if (ms % 1_000 === 0) return `${ms / 1_000} s`;
  return `${ms} ms`;
}

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const cacheKey = `${limit}:${windowMs}`;
  if (_limiterCache.has(cacheKey)) return _limiterCache.get(cacheKey)!;
  const rl = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, msToUpstashDuration(windowMs)),
    analytics: false,
    prefix: "@buildup/rl",
  });
  _limiterCache.set(cacheKey, rl);
  return rl;
}

// ──────────────────────────────────────────────
// In-memory fallback (로컬 개발용)
// ──────────────────────────────────────────────

type Bucket = { count: number; windowStartedAt: number; windowMs: number };
const _buckets = new Map<string, Bucket>();
let _lastCleanup = Date.now();

function _evictStale(now: number) {
  if (now - _lastCleanup < 60_000 && _buckets.size < 10_000) return;
  _lastCleanup = now;
  for (const [key, bucket] of _buckets) {
    if (now - bucket.windowStartedAt >= bucket.windowMs + 30_000) _buckets.delete(key);
  }
}

function _memCheck(params: { key: string; limit: number; windowMs: number; message?: string }): RateLimitResult {
  const now = Date.now();
  _evictStale(now);
  const current = _buckets.get(params.key);
  if (!current || now - current.windowStartedAt >= params.windowMs) {
    _buckets.set(params.key, { count: 1, windowStartedAt: now, windowMs: params.windowMs });
    return { ok: true, remaining: params.limit - 1, limit: params.limit, resetAt: now + params.windowMs };
  }
  if (current.count >= params.limit) {
    return {
      ok: false, status: 429,
      error: params.message ?? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      remaining: 0, limit: params.limit,
      resetAt: current.windowStartedAt + params.windowMs,
    };
  }
  current.count += 1;
  _buckets.set(params.key, current);
  return { ok: true, remaining: params.limit - current.count, limit: params.limit, resetAt: current.windowStartedAt + params.windowMs };
}

// ──────────────────────────────────────────────
// 공개 타입 + 함수
// ──────────────────────────────────────────────

export type RateLimitResult =
  | { ok: true; remaining: number; limit: number; resetAt: number }
  | { ok: false; status: number; error: string; remaining: number; limit: number; resetAt: number };

export async function checkSimpleRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
}): Promise<RateLimitResult> {
  const limiter = getLimiter(params.limit, params.windowMs);
  if (!limiter) return _memCheck(params);

  const { success, remaining, limit, reset } = await limiter.limit(params.key);
  if (!success) {
    return {
      ok: false, status: 429,
      error: params.message ?? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      remaining: 0, limit, resetAt: reset,
    };
  }
  return { ok: true, remaining, limit, resetAt: reset };
}

export async function checkDailyRateLimit(params: {
  userId: string;
  feature: string;
  limit: number;
  message?: string;
}): Promise<RateLimitResult> {
  return await checkSimpleRateLimit({
    key: `daily:${params.feature}:${params.userId}`,
    limit: params.limit,
    windowMs: 24 * 60 * 60 * 1000,
    message: params.message,
  });
}

export async function peekRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ remaining: number; limit: number; resetAt: number }> {
  const limiter = getLimiter(params.limit, params.windowMs);
  if (!limiter) {
    const now = Date.now();
    const current = _buckets.get(params.key);
    if (!current || now - current.windowStartedAt >= params.windowMs) {
      return { remaining: params.limit, limit: params.limit, resetAt: now + params.windowMs };
    }
    return { remaining: Math.max(0, params.limit - current.count), limit: params.limit, resetAt: current.windowStartedAt + params.windowMs };
  }
  const { remaining, limit, reset } = await limiter.getRemaining(params.key);
  return { remaining, limit, resetAt: reset };
}
