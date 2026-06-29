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
  if (!url || !token) {
    // serverless 환경에서 in-memory fallback 은 인스턴스 간 공유가 안 됨 — rate limit 무력화.
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured. " +
        "Falling back to in-memory rate limiter — ineffective across multiple serverless instances.",
      );
    }
    return null;
  }
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

/** 다음 KST(UTC+9, DST 없음) 자정의 epoch(ms). 일일 한도 resetAt 표시용. */
function nextKstMidnightMs(): number {
  const dayMs = 86_400_000;
  const kstNow = Date.now() + 9 * 3_600_000;
  const nextKstMidnight = Math.floor(kstNow / dayMs) * dayMs + dayMs;
  return nextKstMidnight - 9 * 3_600_000;
}

/** supabase-admin 동적 로드 — edge 번들에 service_role 클라이언트가 끌려들어가지 않도록. */
async function getDailyQuotaAdmin() {
  try {
    const mod = await import("./supabase-admin");
    return mod.getSupabaseAdmin();
  } catch {
    return null;
  }
}

/**
 * 아이디(uid)·기능별 일일 한도. 우선순위:
 *  1) Upstash 설정 시 슬라이딩 24h 윈도우 (가장 정확).
 *  2) 미설정 시 Supabase 원자적 카운터(consume_ai_daily_quota) — 서버리스 cross-instance 안전, KST 자정 리셋.
 *  3) 둘 다 불가 시 in-memory(로컬 dev 전용; prod 서버리스에선 2)가 잡음).
 */
export async function checkDailyRateLimit(params: {
  userId: string;
  feature: string;
  limit: number;
  message?: string;
}): Promise<RateLimitResult> {
  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (hasUpstash) {
    return await checkSimpleRateLimit({
      key: `daily:${params.feature}:${params.userId}`,
      limit: params.limit,
      windowMs: 24 * 60 * 60 * 1000,
      message: params.message,
    });
  }

  const sb = await getDailyQuotaAdmin();
  if (sb) {
    try {
      const { data, error } = await sb.rpc("consume_ai_daily_quota", {
        p_user_id: params.userId,
        p_feature: params.feature,
        p_limit: params.limit,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (!error && row && typeof row.allowed === "boolean") {
        const resetAt = nextKstMidnightMs();
        if (!row.allowed) {
          return {
            ok: false,
            status: 429,
            error: params.message ?? "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
            remaining: 0,
            limit: params.limit,
            resetAt,
          };
        }
        return {
          ok: true,
          remaining: Math.max(0, params.limit - Number(row.used ?? 0)),
          limit: params.limit,
          resetAt,
        };
      }
    } catch {
      // fall through to in-memory
    }
  }

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
