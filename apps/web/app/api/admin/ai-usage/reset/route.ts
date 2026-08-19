/**
 * POST /api/admin/ai-usage/reset — 특정 사용자의 AI 사용량 초기화 (관리자 전용).
 *   body: { email: string, feature?: string, refundMonthlyWon?: number }
 *
 *  하는 일 (ai-guard 의 카운터 저장소 3층 중 Redis·원장 두 층을 같이 되돌린다):
 *   ① ai_daily_usage 오늘(KST) 행 count=0 — feature 지정 시 그 기능만, 없으면 전 기능
 *   ② Redis 가 있으면 집행 카운터 삭제: @buildup/aiq:day:<kstDay>:<feature>:<uid>, @buildup/aiq:week:<kstWeek>:<feature>:<uid>
 *      (feature 없으면 AI_FEATURE_LIMITS 의 모든 기능 키)
 *   ③ refundMonthlyWon > 0 이면 ai_monthly_spend 이번 달 spent_won 을 그만큼 차감(바닥 0) + Redis 월 미터도 동일 차감
 *  감사 로그는 console.info (이메일 원문 금지 — uid 앞 8자리만).
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { adminRateLimit } from "../../_shared";
import { getRedisClient, kstWeekKey } from "../../../_lib/rate-limit";
import { AI_FEATURE_LIMITS } from "../../../_lib/ai-guard";
import { kstMonthKey } from "../../../_lib/ai-cost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIST_USERS_MAX_PAGES = 5;
const LIST_USERS_PER_PAGE = 1000;

/** KST 오늘 yyyy-mm-dd (ai-guard kstDayKey 와 동일 규칙) */
function kstDayKey(now: number = Date.now()): string {
  return new Date(now + 9 * 3_600_000).toISOString().slice(0, 10);
}
function aiqDayKey(feature: string, userId: string): string { return `@buildup/aiq:day:${kstDayKey()}:${feature}:${userId}`; }
function aiqWeekKey(feature: string, userId: string): string { return `@buildup/aiq:week:${kstWeekKey()}:${feature}:${userId}`; }

type SupabaseAdmin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function findUserIdByEmail(admin: SupabaseAdmin, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= LIST_USERS_MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: LIST_USERS_PER_PAGE });
    if (error || !data) return null;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < LIST_USERS_PER_PAGE) break;
  }
  return null;
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { email?: unknown; feature?: unknown; refundMonthlyWon?: unknown };
  try { body = (await request.json()) as typeof body; } catch { return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 }); }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) return NextResponse.json({ ok: false, error: "이메일이 필요합니다." }, { status: 400 });
  const feature = typeof body.feature === "string" && body.feature.trim() ? body.feature.trim() : null;
  if (feature && !/^[a-z0-9-]{1,64}$/.test(feature)) return NextResponse.json({ ok: false, error: "feature 형식이 올바르지 않습니다." }, { status: 400 });
  const refundMonthlyWon = body.refundMonthlyWon === undefined || body.refundMonthlyWon === null || body.refundMonthlyWon === ""
    ? 0 : Number(body.refundMonthlyWon);
  if (!Number.isFinite(refundMonthlyWon) || refundMonthlyWon < 0 || refundMonthlyWon > 1_000_000) {
    return NextResponse.json({ ok: false, error: "월예산 환불액은 0~1,000,000 사이 숫자여야 합니다." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const userId = await findUserIdByEmail(admin, email);
  if (!userId) return NextResponse.json({ ok: false, error: "해당 이메일의 사용자를 찾지 못했습니다." }, { status: 404 });

  const features = feature ? [feature] : Object.keys(AI_FEATURE_LIMITS);
  const today = kstDayKey();
  const result = { ledgerRowsZeroed: 0, redisKeysDeleted: 0 as number | null, monthlyRefundedWon: 0, monthlySpentAfter: null as number | null, warnings: [] as string[] };

  // ① 원장(ai_daily_usage) 오늘 행 count=0
  try {
    let q = admin.from("ai_daily_usage").update({ count: 0 }).eq("user_id", userId).eq("usage_date", today);
    if (feature) q = q.eq("feature", feature);
    const { data, error } = await q.select("feature");
    if (error) result.warnings.push(`ai_daily_usage 갱신 실패: ${error.message}`);
    else result.ledgerRowsZeroed = Array.isArray(data) ? data.length : 0;
  } catch (e) {
    result.warnings.push(`ai_daily_usage 갱신 예외: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ② Redis 집행 카운터 삭제
  const redis = getRedisClient();
  if (redis) {
    try {
      const keys = features.flatMap((f) => [aiqDayKey(f, userId), aiqWeekKey(f, userId)]);
      result.redisKeysDeleted = keys.length > 0 ? Number(await redis.del(...keys)) : 0;
    } catch (e) {
      result.redisKeysDeleted = null;
      result.warnings.push(`Redis 키 삭제 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    result.redisKeysDeleted = null;   // 미설정 — 원장 경로만 유효
  }

  // ③ 월간 예산 환불
  if (refundMonthlyWon > 0) {
    const monthKey = kstMonthKey();
    try {
      const { data } = await admin.from("ai_monthly_spend").select("spent_won").eq("user_id", userId).eq("month_key", monthKey).maybeSingle();
      const cur = Number((data as { spent_won?: unknown } | null)?.spent_won ?? 0);
      const next = Math.max(0, cur - refundMonthlyWon);
      if (cur > 0) {
        const { error } = await admin.from("ai_monthly_spend").update({ spent_won: next, updated_at: new Date().toISOString() })
          .eq("user_id", userId).eq("month_key", monthKey);
        if (error) result.warnings.push(`ai_monthly_spend 갱신 실패: ${error.message}`);
        else { result.monthlyRefundedWon = cur - next; result.monthlySpentAfter = next; }
      } else {
        result.monthlySpentAfter = 0;
      }
    } catch (e) {
      result.warnings.push(`ai_monthly_spend 갱신 예외: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (redis) {
      try {
        const key = `@buildup/aicost:${monthKey}:${userId}`;
        const after = await redis.decrby(key, Math.round(refundMonthlyWon));
        if (after < 0) await redis.set(key, 0);
      } catch (e) {
        result.warnings.push(`Redis 월 미터 차감 실패: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  console.info(`[admin/ai-usage/reset] by=${gate.userId.slice(0, 8)} target=${userId.slice(0, 8)} feature=${feature ?? "ALL"} ledgerZeroed=${result.ledgerRowsZeroed} redisDel=${result.redisKeysDeleted ?? "n/a"} refundWon=${result.monthlyRefundedWon}`);

  return NextResponse.json({ ok: true, userId, feature: feature ?? null, featuresAffected: features.length, day: today, ...result });
}
