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

/** ai-guard 등 외부 모듈이 같은 Redis 인스턴스를 쓰도록 노출 (없으면 null) */
export function getRedisClient(): Redis | null { return getRedis(); }

/**
 * 월간 AI 예산 환불 — 서버/모델 오류로 실패한 호출의 선차감을 되돌린다 (2026-08-19 사장님 지시:
 * "우리 실수는 우리가 책임진다"). Redis 카운터 decrby + Supabase 원장 spent_won 감소(바닥 0). best-effort.
 */
export async function refundMonthlyAiBudget(userId: string, feature: string): Promise<void> {
  const costWon = featureCostWon(feature);
  if (costWon <= 0) return;
  const monthKey = kstMonthKey();
  const redis = getRedis();
  if (redis) {
    try {
      const key = `@buildup/aicost:${monthKey}:${userId}`;
      const after = await redis.decrby(key, costWon);
      if (after < 0) await redis.set(key, 0);
    } catch { /* fallthrough to ledger */ }
  }
  try {
    const sb = await getDailyQuotaAdmin();
    if (!sb) return;
    const { data } = await sb.from("ai_monthly_spend").select("spent_won")
      .eq("user_id", userId).eq("month_key", monthKey).maybeSingle();
    const cur = Number((data as { spent_won?: unknown } | null)?.spent_won ?? 0);
    if (cur <= 0) return;
    await sb.from("ai_monthly_spend").update({ spent_won: Math.max(0, cur - costWon), updated_at: new Date().toISOString() })
      .eq("user_id", userId).eq("month_key", monthKey);
  } catch { /* best-effort */ }
}

/** 일일 원장(ai_daily_usage) 1건 환불 — 오늘 행 count-1 (바닥 0). RPC 경로 일일 쿼터와 원장을 동시에 되돌린다. */
export async function refundDailyLedger(userId: string, feature: string, n = 1): Promise<void> {
  try {
    const sb = await getDailyQuotaAdmin();
    if (!sb) return;
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = kst.toISOString().slice(0, 10);
    const { data } = await sb.from("ai_daily_usage").select("count")
      .eq("user_id", userId).eq("feature", feature).eq("usage_date", today).maybeSingle();
    const cur = Number((data as { count?: unknown } | null)?.count ?? 0);
    if (cur <= 0) return;
    await sb.from("ai_daily_usage").update({ count: Math.max(0, cur - n) })
      .eq("user_id", userId).eq("feature", feature).eq("usage_date", today);
  } catch { /* best-effort */ }
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
export async function recordDailyUsageLedger(userId: string, feature: string): Promise<void> {
  try {
    const sb = await getDailyQuotaAdmin();
    if (!sb) return;
    await sb.rpc("consume_ai_daily_quota", { p_user_id: userId, p_feature: feature, p_limit: 1_000_000_000 });
  } catch {
    /* 원장 실패 무시 */
  }
}

/**
 * 로드맵 생성 전용 쿼터 (2026-08-03 사장님 정책):
 *   무료 = 계정당 **총 3회** (평생) / 프로(premium 활성) = **주 3회** (최근 7일 롤링, KST).
 *
 * 판정 소스:
 *  · 사용량 = ai_daily_usage 원장 합산 (성공 게이트 통과분). 서버 게이트라 웹·iOS 동시 적용.
 *  · 프로 = foundone_subscriptions plan=premium && 기간 미만료 (billing/status 의 읽기 시점
 *    강등 로직과 동일 기준 — 만료됐으면 free 로 취급).
 *
 * 정직성:
 *  · 원장 조회 실패 ≠ 한도 초과 — fail-closed 하되 "확인 실패, 잠시 후" 로 말한다 (한도 사칭 금지).
 *  · 생성이 서버 오류로 실패하면 호출처가 refundRoadmapGenerationUse 로 차감을 되돌린다
 *    (평생 3회에서 실패가 크레딧을 먹으면 가혹).
 *  · 동시 요청 레이스로 ±1 초과 가능 — 시간당 12회 단순 리밋이 배수 남용은 막는다.
 */
export async function checkRoadmapGenerationQuota(userId: string): Promise<RateLimitResult> {
  const sb = await getDailyQuotaAdmin();
  if (!sb) {
    return { ok: false, status: 503, error: "사용량을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.", remaining: 0, limit: 3, resetAt: 0 };
  }

  // ── 프로 여부 ──
  let isPro = false;
  try {
    const { data, error } = await sb
      .from("foundone_subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data && data.plan === "premium") {
      const notExpired = !data.current_period_end || new Date(data.current_period_end) >= new Date();
      isPro = notExpired && data.status !== "canceled";
    }
  } catch {
    // 구독 조회 실패 → free 기준으로 판정 (더 엄격한 쪽 — 프로 혜택을 지어내지 않는다)
    isPro = false;
  }

  // ── 사용량 합산 ──
  try {
    let query = sb
      .from("ai_daily_usage")
      .select("count, usage_date")
      .eq("user_id", userId)
      .eq("feature", "roadmap-generate");
    if (isPro) {
      // 최근 7일 롤링 (KST 오늘 포함 7일)
      const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const since = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - 6));
      query = query.gte("usage_date", since.toISOString().slice(0, 10));
    }
    const { data, error } = await query;
    if (error) throw error;
    const used = (data ?? []).reduce((s, r) => s + Number((r as { count?: unknown }).count ?? 0), 0);

    if (isPro && used >= 3) {
      return {
        ok: false, status: 429,
        error: "이번 주 로드맵 생성 한도(3회)를 모두 사용했어요. 다음 주에 다시 생성할 수 있습니다. 만든 로드맵의 수정·진행은 계속 가능해요.",
        remaining: 0, limit: 3,
        resetAt: Date.now() + 7 * 24 * 60 * 60 * 1000,   // 롤링 7일 — 대략치
      };
    }
    if (!isPro && used >= 3) {
      return {
        ok: false, status: 429,
        error: "무료 계정의 로드맵 생성 횟수(총 3회)를 모두 사용했어요. 만든 로드맵의 수정·진행은 계속 가능하며, 프로에서는 매주 3회 생성할 수 있어요.",
        remaining: 0, limit: 3, resetAt: 0,   // 평생 한도 — 리셋 없음
      };
    }
  } catch {
    return { ok: false, status: 503, error: "사용량을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.", remaining: 0, limit: 3, resetAt: 0 };
  }

  // 통과 — 원장 기록·월 예산 차감은 ai-guard(runAiFeature)가 한 번만 한다.
  //   2026-08-19 실사고: 여기서도 기록해 한 번 생성에 원장 +2 → 일일 한도 3회가 사실상 1.5회가 되어 사용자가 차단됨.
  //   평생/주 3회 판정은 위의 원장 합산으로 계속 동작(가드가 성공 시 기록·실패 시 환불).
  return { ok: true, remaining: 3, limit: 3, resetAt: 0 };
}

/**
 * 로드맵 생성 실패 시 차감 환불 — 오늘 원장 count 를 1 줄인다 (바닥 0).
 *  평생 3회 체계에서 서버 오류가 크레딧을 먹지 않게. best-effort (실패 무시).
 */
export async function refundRoadmapGenerationUse(userId: string): Promise<void> {
  try {
    const sb = await getDailyQuotaAdmin();
    if (!sb) return;
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = kst.toISOString().slice(0, 10);
    const { data } = await sb
      .from("ai_daily_usage")
      .select("count")
      .eq("user_id", userId).eq("feature", "roadmap-generate").eq("usage_date", today)
      .maybeSingle();
    const cur = Number((data as { count?: unknown } | null)?.count ?? 0);
    if (cur <= 0) return;
    await sb
      .from("ai_daily_usage")
      .update({ count: cur - 1 })
      .eq("user_id", userId).eq("feature", "roadmap-generate").eq("usage_date", today);
  } catch {
    /* best-effort */
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

/** KST 기준 주간(월요일 시작) 키 — 주간 한도 카운터용. */
export function kstWeekKey(): string {
  const kst = new Date(Date.now() + 9 * 3_600_000);
  const day = (kst.getUTCDay() + 6) % 7; // 월=0
  const monday = new Date(kst.getTime() - day * 86_400_000);
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
}

/**
 * 주간 사용 한도 + 월간 AI 예산 선차감. (2026-08-14 공고 맞춤 사업계획서 — 주 2회 지시)
 *  일일 쿼터와 같은 구조: 카운터 통과 시 원장 기록 → 월간 예산 차감.
 *  카운터 키에 KST 주(월요일 시작)를 박아 슬라이딩이 아닌 "달력 주" 기준으로 초기화된다.
 */
export async function checkWeeklyRateLimit(params: {
  userId: string;
  feature: string;
  limit: number;
  message?: string;
}): Promise<RateLimitResult> {
  const week = kstWeekKey();
  const res = await checkSimpleRateLimit({
    key: `weekly:${params.feature}:${week}:${params.userId}`,
    limit: params.limit,
    windowMs: 7 * 24 * 60 * 60 * 1000,
    message: params.message ?? "이번 주 사용 한도를 모두 썼습니다. 다음 주 월요일에 초기화됩니다.",
  });
  if (!res.ok) return res;
  await recordDailyUsageLedger(params.userId, params.feature);
  const monthly = await consumeMonthlyAiBudget(params.userId, params.feature);
  return monthly ?? res;
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
