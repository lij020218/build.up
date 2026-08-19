/**
 * ai-guard — 모든 AI 기능의 공통 게이트 (2026-08-19 사장님 3원칙)
 *
 *  ① 모든 AI 기능은 **일일·주간·월간 한도**를 가진다 (기능별 표 AI_FEATURE_LIMITS, 없으면 기본값).
 *  ② 실패 확률 0 수렴: LLM 클라이언트(packages/ai utils/client.ts)가 SDK 재시도 3회 + 모델 폴백을 담당하고,
 *     여기서는 라우트 레벨에서 **1회 추가 재시도**(일시 오류만) 후에도 실패하면 정직한 503 JSON 을 준다.
 *  ③ 우리 시스템 문제(서버/모델/파싱 오류)로 실패하면 **일일·주간·월간 차감을 전부 환불**한다.
 *     사용자 입력 오류(400)·한도 초과(429)는 차감 자체가 없거나 정당하므로 환불 대상이 아니다.
 *
 *  사용:
 *    export async function POST(request: Request) {
 *      return runAiFeature({ request, feature: "quick-query" }, async ({ userId }) => {
 *        ... LLM 호출 ...
 *        return NextResponse.json({ ok: true, ... });
 *      });
 *    }
 *  핸들러가 throw 하거나 status ≥ 500 응답을 돌려주면 자동 환불 + 표준 503(핸들러 응답이 있으면 그대로 반환).
 *  핸들러 안에서 "이건 사용자 잘못" 인 400/422 는 그냥 반환하면 된다 — 환불하지 않는다(차감은 유지: 남용 방지).
 *  ⚠️ 정책상 400 도 환불하고 싶은 기능은 opts.refundOn4xx = true.
 *
 *  카운터 저장소: Upstash Redis(INCR + TTL — 환불 가능한 단순 카운터) → 없으면 Supabase 원장(ai_daily_usage)
 *  → 없으면 프로세스 메모리(로컬 dev). 월간 예산은 rate-limit.ts consumeMonthlyAiBudget 그대로.
 */

import { NextResponse } from "next/server";
import { requireApiUser, requireApiUserAllowAnon } from "./auth";
import {
  checkSimpleRateLimit, consumeMonthlyAiBudget, refundMonthlyAiBudget, refundDailyLedger, recordDailyUsageLedger,
  getRedisClient, kstWeekKey, type RateLimitResult,
} from "./rate-limit";
import { getSupabaseAdmin } from "./supabase-admin";
import { isTransientLlmError, llmCallContext } from "@foundone/ai/utils/client";
// 관측: 이 모듈을 import 하는 순간 LLM 호출 관찰자가 등록돼 ai_call_log 에 적재된다(부작용 import, 멱등).
import "./ai-call-log";

// ─────────────────────────────────────────────────────────────
// 기능별 한도 표 — 일/주/분당. 월간은 ₩6,000 예산 미터(ai-cost.ts)가 담당.
//   원칙: 주간 = 일일 × 4 안팎(하루 몰아쓰기 허용하되 주 총량은 묶는다). 분당은 연타·오작동 방지.
// ─────────────────────────────────────────────────────────────
/** timeoutMs/maxRetries = 이 기능 안에서 만들어지는 모든 LlmClient 의 기본 (AsyncLocalStorage 로 주입, 2026-08-19 P0) */
export type AiFeatureLimit = { daily: number; weekly: number; perMinute?: number; timeoutMs?: number; maxRetries?: number };
export const DEFAULT_AI_LIMIT: AiFeatureLimit = { daily: 20, weekly: 80, perMinute: 6, timeoutMs: 30_000, maxRetries: 2 };
export const AI_FEATURE_LIMITS: Record<string, AiFeatureLimit> = {
  // 로드맵 — 별도 평생/주 3회 정책(checkRoadmapGenerationQuota)이 있어 여기선 상한만
  "roadmap-generate":        { daily: 3,  weekly: 6,   perMinute: 2, timeoutMs: 110_000, maxRetries: 1 },
  "roadmap-classify":        { daily: 12, weekly: 40,  perMinute: 6 },
  // 파서·짧은 생성
  "quick-query":             { daily: 20, weekly: 80,  perMinute: 6 },
  "members-parse":           { daily: 10, weekly: 30,  perMinute: 4, timeoutMs: 25_000 },
  "products-parse":          { daily: 10, weekly: 30,  perMinute: 4, timeoutMs: 25_000 },
  "agents-content-draft":    { daily: 10, weekly: 40,  perMinute: 4 },
  "agents-coupon-copy":      { daily: 10, weekly: 40,  perMinute: 4 },
  "agents-feedback-form":    { daily: 6,  weekly: 24,  perMinute: 3 },
  // 무거운 판단형
  "contract-analyze":        { daily: 3,  weekly: 8,   perMinute: 2, timeoutMs: 90_000,  maxRetries: 1 },
  "business-plan-generate":  { daily: 2,  weekly: 4,   perMinute: 1, timeoutMs: 110_000, maxRetries: 1 },
  "business-plan-program":   { daily: 2,  weekly: 4,   perMinute: 1, timeoutMs: 110_000, maxRetries: 1 },
  "interview":               { daily: 6,  weekly: 20,  perMinute: 4 },
  "interview-analyze":       { daily: 3,  weekly: 10,  perMinute: 2 },
  "health-diagnose":         { daily: 4,  weekly: 12,  perMinute: 2 },
  "finance-interpret":       { daily: 6,  weekly: 20,  perMinute: 3 },
  "market-narrative":        { daily: 6,  weekly: 20,  perMinute: 3 },
  "market-recommend":        { daily: 8,  weekly: 24,  perMinute: 3 },
  "market-snapshot":         { daily: 12, weekly: 40,  perMinute: 4 },
  "report-insight":          { daily: 6,  weekly: 20,  perMinute: 3 },
  "stage-brief":             { daily: 12, weekly: 40,  perMinute: 4 },
  "programs-match":          { daily: 8,  weekly: 24,  perMinute: 3 },
  "funding-score":           { daily: 8,  weekly: 24,  perMinute: 3 },
  "guides-ask":              { daily: 12, weekly: 40,  perMinute: 4 },
  "dashboard-actions":       { daily: 6,  weekly: 24,  perMinute: 2 },
  "insights-industry-daily": { daily: 3,  weekly: 12,  perMinute: 2, timeoutMs: 40_000,  maxRetries: 1 },
  // 마케팅
  "marketing-cases":         { daily: 4,  weekly: 12,  perMinute: 2, timeoutMs: 55_000,  maxRetries: 1 },
  "marketing-cardnews":      { daily: 6,  weekly: 20,  perMinute: 2, timeoutMs: 40_000,  maxRetries: 1 },
  "marketing-memes":         { daily: 4,  weekly: 12,  perMinute: 2 },
  "marketing-engagement":    { daily: 60, weekly: 300, perMinute: 20 },
  // 코칭
  "coaching-feedback":       { daily: 30, weekly: 120, perMinute: 10 },
};
export function limitsFor(feature: string): AiFeatureLimit {
  return { ...DEFAULT_AI_LIMIT, ...(AI_FEATURE_LIMITS[feature] ?? {}) };
}

// ─────────────────────────────────────────────────────────────
// 환불 가능한 기간 카운터 (일/주)
// ─────────────────────────────────────────────────────────────
type Period = "day" | "week";
const _mem = new Map<string, { n: number; exp: number }>();

function kstDayKey(): string {
  return new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
}
function periodKey(period: Period, feature: string, userId: string): string {
  const p = period === "day" ? kstDayKey() : kstWeekKey();
  return `@buildup/aiq:${period}:${p}:${feature}:${userId}`;
}
function ttlSec(period: Period): number { return period === "day" ? 2 * 86_400 : 8 * 86_400; }

/** +1 하고 한도 판정. 초과면 즉시 -1 되돌리고 false. */
async function consumePeriod(period: Period, feature: string, userId: string, limit: number): Promise<{ ok: boolean; used: number }> {
  const key = periodKey(period, feature, userId);
  const redis = getRedisClient();
  if (redis) {
    try {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, ttlSec(period));
      if (n > limit) { await redis.decr(key); return { ok: false, used: n - 1 }; }
      // 집행은 Redis, 원장(ai_daily_usage)은 운영 통계·로드맵 쿼터용 — 일일만 기록(실패 무시)
      if (period === "day") void recordDailyUsageLedger(userId, feature);
      return { ok: true, used: n };
    } catch { /* fallthrough */ }
  }
  // Supabase 원장 경로 — 일: consume_ai_daily_quota RPC(원자적) / 주: 최근 7일 합산(비원자, ±1 허용)
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      if (period === "day") {
        const { data, error } = await sb.rpc("consume_ai_daily_quota", { p_user_id: userId, p_feature: feature, p_limit: limit });
        if (!error) {
          const row = Array.isArray(data) ? data[0] : data;
          const allowed = Boolean((row as { allowed?: boolean } | undefined)?.allowed);
          const used = Number((row as { used?: number } | undefined)?.used ?? 0);
          return { ok: allowed, used };
        }
      } else {
        const kst = new Date(Date.now() + 9 * 3_600_000);
        const since = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - 6)).toISOString().slice(0, 10);
        const { data, error } = await sb.from("ai_daily_usage").select("count")
          .eq("user_id", userId).eq("feature", feature).gte("usage_date", since);
        if (!error) {
          const used = (data ?? []).reduce((s, r) => s + Number((r as { count?: unknown }).count ?? 0), 0);
          // 일일 RPC 가 이미 오늘 1을 더했으므로 주간은 판정만 (used 에 오늘분 포함)
          return { ok: used <= limit, used };
        }
      }
    } catch { /* fallthrough */ }
  }
  const now = Date.now();
  const cur = _mem.get(key);
  const n = cur && cur.exp > now ? cur.n + 1 : 1;
  _mem.set(key, { n, exp: now + ttlSec(period) * 1000 });
  if (n > limit) { _mem.set(key, { n: n - 1, exp: now + ttlSec(period) * 1000 }); return { ok: false, used: n - 1 }; }
  return { ok: true, used: n };
}

async function refundPeriod(period: Period, feature: string, userId: string): Promise<void> {
  const key = periodKey(period, feature, userId);
  const redis = getRedisClient();
  if (redis) {
    try {
      const after = await redis.decr(key); if (after < 0) await redis.set(key, 0);
      if (period === "day") await refundDailyLedger(userId, feature);   // 원장도 함께 되돌린다
      return;
    } catch { /* fallthrough */ }
  }
  // Supabase 원장 경로: 일=오늘 행 -1 (주간 합산은 오늘 행에서 자동 반영) / 메모리 경로: 카운터 -1
  const sb = getSupabaseAdmin();
  if (sb) { if (period === "day") await refundDailyLedger(userId, feature); return; }
  const cur = _mem.get(key);
  if (cur && cur.n > 0) _mem.set(key, { n: cur.n - 1, exp: cur.exp });
}

/** ③ 전액 환불 — 일·주·월. 어떤 단계가 실패해도 나머지는 계속. */
export async function refundAiUse(userId: string, feature: string): Promise<void> {
  await Promise.allSettled([
    refundPeriod("day", feature, userId),
    refundPeriod("week", feature, userId),
    refundMonthlyAiBudget(userId, feature),
  ]);
}

// ─────────────────────────────────────────────────────────────
// 게이트
// ─────────────────────────────────────────────────────────────
export type AiGuardOptions = {
  request: Request;
  feature: string;
  /** 익명 세션 허용 (기본 false = 실계정만) */
  allowAnon?: boolean;
  /** 표를 덮어쓸 한도 */
  limits?: Partial<AiFeatureLimit>;
  /** 4xx 응답도 환불할지 (기본 false) */
  refundOn4xx?: boolean;
  /** 핸들러 1회 재시도 여부 (기본 true — 일시 오류·빈 응답·파싱 실패 시) */
  retryOnce?: boolean;
  /** 실패 시 사용자에게 보여줄 문구 */
  failMessage?: string;
};

export type AiGuardOk = {
  ok: true;
  userId: string;
  email?: string;
  limits: AiFeatureLimit;
  usage: { dayUsed: number; weekUsed: number };
  /** 핸들러가 스스로 실패를 판정했을 때 호출 — 전액 환불 */
  refund: () => Promise<void>;
};
export type AiGuardFail = { ok: false; response: NextResponse };

function limitResponse(kind: "minute" | "day" | "week", limits: AiFeatureLimit, feature: string): NextResponse {
  const msg = kind === "minute" ? "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요."
    : kind === "day" ? `오늘 사용 한도(${limits.daily}회)를 모두 썼어요. 내일 자정(KST) 이후 다시 쓸 수 있어요.`
    : `이번 주 사용 한도(${limits.weekly}회)를 모두 썼어요. 다음 주 월요일에 초기화돼요.`;
  return NextResponse.json({ ok: false, error: msg, code: `limit_${kind}`, feature, limits }, { status: 429 });
}

/** 인증 + 분·일·주·월 한도 소비. 실패 시 이미 소비한 것은 되돌린다. */
export async function guardAiFeature(opts: AiGuardOptions): Promise<AiGuardOk | AiGuardFail> {
  const auth = opts.allowAnon ? await requireApiUserAllowAnon(opts.request) : await requireApiUser(opts.request);
  if (!auth.ok) return { ok: false, response: NextResponse.json({ ok: false, error: auth.error }, { status: auth.status }) };
  const userId = auth.userId;
  const limits: AiFeatureLimit = { ...limitsFor(opts.feature), ...(opts.limits ?? {}) };

  if (limits.perMinute && limits.perMinute > 0) {
    const rl = await checkSimpleRateLimit({ key: `ai-min:${opts.feature}:${userId}`, limit: limits.perMinute, windowMs: 60_000 });
    if (!rl.ok) return { ok: false, response: limitResponse("minute", limits, opts.feature) };
  }
  const day = await consumePeriod("day", opts.feature, userId, limits.daily);
  if (!day.ok) return { ok: false, response: limitResponse("day", limits, opts.feature) };
  const week = await consumePeriod("week", opts.feature, userId, limits.weekly);
  if (!week.ok) { await refundPeriod("day", opts.feature, userId); return { ok: false, response: limitResponse("week", limits, opts.feature) }; }
  const monthly: RateLimitResult | null = await consumeMonthlyAiBudget(userId, opts.feature);
  if (monthly && !monthly.ok) {
    await Promise.allSettled([refundPeriod("day", opts.feature, userId), refundPeriod("week", opts.feature, userId)]);
    return { ok: false, response: NextResponse.json({ ok: false, error: monthly.error, code: "limit_month", feature: opts.feature }, { status: monthly.status }) };
  }
  return {
    ok: true, userId, email: auth.email, limits,
    usage: { dayUsed: day.used, weekUsed: week.used },
    refund: () => refundAiUse(userId, opts.feature),
  };
}

const DEFAULT_FAIL_MESSAGE = "AI 처리 중 문제가 생겼어요. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.";

/**
 * 게이트 + 실행 + (실패 시) 환불을 한 번에.
 *   handler 가 throw → 일시 오류면 1회 재시도 → 그래도 실패면 환불 + 503.
 *   handler 가 status ≥ 500 응답 반환 → 환불(응답은 그대로 전달하되 refunded:true 는 헤더로).
 */
export async function runAiFeature(
  opts: AiGuardOptions,
  handler: (ctx: AiGuardOk) => Promise<NextResponse>,
): Promise<NextResponse> {
  const g = await guardAiFeature(opts);
  if (!g.ok) return g.response;
  const retryOnce = opts.retryOnce !== false;

  // 재시도 1층 원칙(P0): 일시 오류(429/5xx/타임아웃)는 SDK 가 이미 재시도+폴백 — 여기선 **파싱/빈 응답**에만 1회 더.
  const attempt = async (): Promise<NextResponse> =>
    llmCallContext.run({ feature: opts.feature, timeoutMs: g.limits.timeoutMs, maxRetries: g.limits.maxRetries, userId: g.userId }, () => handler(g));
  let res: NextResponse | null = null;
  let lastErr: unknown = null;
  try {
    res = await attempt();
    // 5xx 응답은 핸들러(LLM 층)가 이미 재시도·폴백을 소진한 결과 — 여기서 또 돌리면 지연·비용 2배. 재시도 없이 환불.
  } catch (e) {
    lastErr = e;
    if (retryOnce && isParseLikeError(e) && !isTransientLlmError(e)) {
      console.warn(`[ai-guard] ${opts.feature} threw (${(e as Error)?.name}: ${String((e as Error)?.message ?? "").slice(0, 120)}) → retry once`);
      try { res = await attempt(); lastErr = null; } catch (e2) { lastErr = e2; }
    }
  }

  if (lastErr) {
    await g.refund();
    console.error(`[ai-guard] ${opts.feature} FAILED (refunded) user=${g.userId.slice(0, 8)}:`, lastErr instanceof Error ? lastErr.message : String(lastErr));
    return NextResponse.json({ ok: false, error: opts.failMessage ?? DEFAULT_FAIL_MESSAGE, code: "ai_failed", refunded: true, retryable: true }, { status: 503 });
  }
  if (res && (res.status >= 500 || (opts.refundOn4xx && res.status >= 400))) {
    await g.refund();
    res.headers.set("x-ai-refunded", "1");
    console.warn(`[ai-guard] ${opts.feature} status ${res.status} → refunded user=${g.userId.slice(0, 8)}`);
  }
  return res!;
}

function isParseLikeError(e: unknown): boolean {
  const msg = String((e as Error)?.message ?? "").toLowerCase();
  const name = String((e as Error)?.name ?? "");
  return name === "SyntaxError" || name === "EmptyLlmResponseError" || msg.includes("json") || msg.includes("parse") || msg.includes("empty response") || msg.includes("schema");
}
