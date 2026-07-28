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
import { featureCostWon, MONTHLY_AI_BUDGET_WON, kstMonthKey } from "./ai-cost";

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

/** 다음 KST 월초(1일 00:00)의 epoch(ms). 월간 예산 resetAt 표시용. */
function nextKstMonthStartMs(): number {
  const kst = new Date(Date.now() + 9 * 3_600_000);
  return Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth() + 1, 1) - 9 * 3_600_000;
}

/**
 * 1인당 월간 AI 비용 예산(₩6,000) 미터 — 2026-07-28 사장님 지시.
 *
 * 회당 "상한 원가"(ai-cost.ts SSOT)를 승인 시점에 선차감한다. 차감액 ≥ 실비용이므로
 * 월 합계가 예산에서 차단되면 실지출은 반드시 예산 이하다. 일일 쿼터만으로는 상한 보장이
 * 안 됨(예: 파서 10회/일 상한가 ₩130 → 월 최대 ₩39,000·기능 2개면 ₩78,000).
 *
 * 반환: null = 통과(차감 완료), RateLimitResult(ok:false) = 월 예산 초과 차단.
 * 우선순위는 일일 쿼터와 동일: Upstash 카운터 → Supabase RPC → in-memory(로컬 dev).
 */
export async function consumeMonthlyAiBudget(userId: string, feature: string): Promise<RateLimitResult | null> {
  const costWon = featureCostWon(feature);
  if (costWon <= 0) return null; // LLM 미사용 기능 — 차감 없음

  const monthKey = kstMonthKey();
  const budget = MONTHLY_AI_BUDGET_WON;
  const rejected = (): RateLimitResult => ({
    ok: false,
    status: 429,
    error: "이번 달 AI 사용 한도에 도달했습니다. 다음 달 1일(KST)에 초기화됩니다.",
    remaining: 0,
    limit: budget,
    resetAt: nextKstMonthStartMs(),
  });

  const redis = getRedis();
  if (redis) {
    try {
      const key = `@buildup/aicost:${monthKey}:${userId}`;
      const total = await redis.incrby(key, costWon);
      if (total === costWon) await redis.expire(key, 45 * 86_400); // 월 경과 후 자동 소멸
      if (total > budget) {
        await redis.decrby(key, costWon); // 차단된 호출은 미과금이므로 되돌림
        return rejected();
      }
      // 집행은 Redis, 원장은 Supabase — 운영 집계(/admin/usage)용. 실패해도 집행에 영향 없음.
      await recordMonthlySpendLedger(userId, monthKey, costWon);
      return null;
    } catch {
      // fall through to Supabase
    }
  }

  const sb = await getDailyQuotaAdmin();
  if (sb) {
    try {
      const { data, error } = await sb.rpc("consume_ai_monthly_budget", {
        p_user_id: userId,
        p_month: monthKey,
        p_cost_won: costWon,
        p_budget_won: budget,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (!error && row && typeof row.allowed === "boolean") {
        return row.allowed ? null : rejected();
      }
      // RPC 부재/에러는 아래 in-memory로 폴백 — 단 prod에서는 경고 (RPC 컬럼 의존 교훈)
      if (error && process.env.NODE_ENV === "production") {
        console.warn("[ai-cost] consume_ai_monthly_budget RPC error — monthly budget not enforced:", error.message);
      }
    } catch {
      // fall through to in-memory
    }
  }

  // in-memory (로컬 dev 전용)
  const cur = _monthlySpendMem.get(userId);
  const entry = cur && cur.monthKey === monthKey ? cur : { monthKey, spentWon: 0 };
  if (entry.spentWon + costWon > budget) {
    _monthlySpendMem.set(userId, entry);
    return rejected();
  }
  entry.spentWon += costWon;
  _monthlySpendMem.set(userId, entry);
  return null;
}

const _monthlySpendMem = new Map<string, { monthKey: string; spentWon: number }>();

/**
 * 운영 원장 기록 (집행과 분리) — Upstash 가 집행할 때도 Supabase 테이블에 사용·비용을 남겨
 * /admin/usage 집계가 어느 모드에서든 실데이터를 갖게 한다. 거대 한도 = 카운터 전용(차단 안 함).
 * best-effort: 실패는 무시(집행 결과에 영향 없음).
 */
async function recordDailyUsageLedger(userId: string, feature: string): Promise<void> {
  try {
    const sb = await getDailyQuotaAdmin();
    if (!sb) return;
    await sb.rpc("consume_ai_daily_quota", { p_user_id: userId, p_feature: feature, p_limit: 1_000_000_000 });
  } catch {
    /* 원장 실패 무시 */
  }
}

async function recordMonthlySpendLedger(userId: string, monthKey: string, costWon: number): Promise<void> {
  try {
    const sb = await getDailyQuotaAdmin();
    if (!sb) return;
    await sb.rpc("consume_ai_monthly_budget", {
      p_user_id: userId,
      p_month: monthKey,
      p_cost_won: costWon,
      p_budget_won: 1_000_000_000,
    });
  } catch {
    /* 원장 실패 무시 */
  }
}

/**
 * 아이디(uid)·기능별 일일 한도 + 월간 비용 예산(₩6,000) 동시 검사.
 * 일일 한도 우선순위:
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
  const daily = await checkDailyCallCount(params);
  if (!daily.ok) return daily;
  const monthly = await consumeMonthlyAiBudget(params.userId, params.feature);
  return monthly ?? daily;
}

async function checkDailyCallCount(params: {
  userId: string;
  feature: string;
  limit: number;
  message?: string;
}): Promise<RateLimitResult> {
  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (hasUpstash) {
    const res = await checkSimpleRateLimit({
      key: `daily:${params.feature}:${params.userId}`,
      limit: params.limit,
      windowMs: 24 * 60 * 60 * 1000,
      message: params.message,
    });
    // 집행은 Redis, 원장은 Supabase — /admin/usage 기능 사용량 집계용 (통과한 호출만 기록)
    if (res.ok) await recordDailyUsageLedger(params.userId, params.feature);
    return res;
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
