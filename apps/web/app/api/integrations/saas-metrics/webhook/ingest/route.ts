/**
 * POST /api/integrations/saas-metrics/webhook/ingest
 *
 * 인증: X-Webhook-Token 헤더 (사장님 발급 토큰).
 *
 * Body (JSON):
 *   {
 *     date: "YYYY-MM-DD",
 *     activeUsers?: number,         // DAU
 *     weeklyActiveUsers?: number,   // WAU (선택)
 *     monthlyActiveUsers?: number,  // MAU (선택)
 *     newUsers?: number,
 *     cumulativeUsers?: number,
 *     signups?: number,
 *     churns?: number
 *   }
 *
 * 동일 (user, source=webhook, date) 는 upsert.
 */
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";
import { checkSimpleRateLimit } from "../../../../_lib/rate-limit";

export const runtime = "nodejs";

type Body = {
  date?: string;
  activeUsers?: number;
  weeklyActiveUsers?: number;
  monthlyActiveUsers?: number;
  newUsers?: number;
  cumulativeUsers?: number;
  signups?: number;
  churns?: number;
};

export async function POST(request: Request) {
  // ⚠️ 인증(DB 조회) 전에 IP 기반 rate limit 을 먼저 적용 — 미인증 요청(무효 토큰)이
  //   DB 조회를 무제한 유발하는 것을 차단. (종전엔 인증 성공 후에만 rate limit 이 걸려,
  //   32자 이상 무효 토큰으로 saas_metrics_connections 조회를 남용할 수 있었음.)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const ipRl = await checkSimpleRateLimit({
    key: `saas-webhook-ingest-anon:${ip}`, limit: 120, windowMs: 60_000,
    message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  });
  if (!ipRl.ok) return NextResponse.json({ ok: false, error: ipRl.error }, { status: ipRl.status });

  const token = request.headers.get("x-webhook-token") ?? "";
  if (!token || token.length < 32) {
    return NextResponse.json({ ok: false, error: "X-Webhook-Token 헤더 필요" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: conn } = await supabase
    .from("saas_metrics_connections")
    .select("user_id, status")
    .eq("source", "webhook")
    .eq("webhook_token_hash", tokenHash)
    .maybeSingle();
  if (!conn || conn.status !== "active") {
    return NextResponse.json({ ok: false, error: "유효하지 않거나 비활성 토큰" }, { status: 401 });
  }

  // 인증된 사용자 단위 추가 rate limit (정상 사용자 보호).
  const rl = await checkSimpleRateLimit({ key: `saas-webhook-ingest:${conn.user_id}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: Body;
  try { body = (await request.json()) as Body; } catch {
    return NextResponse.json({ ok: false, error: "JSON 본문 필요" }, { status: 400 });
  }
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ ok: false, error: "date YYYY-MM-DD 필수" }, { status: 400 });
  }

  const row = {
    user_id: conn.user_id,
    source: "webhook",
    date: body.date,
    active_users: body.activeUsers ?? null,
    weekly_active_users: body.weeklyActiveUsers ?? null,
    monthly_active_users: body.monthlyActiveUsers ?? null,
    new_users: body.newUsers ?? null,
    signups: body.signups ?? null,
    churns: body.churns ?? null,
    cumulative_users: body.cumulativeUsers ?? null,
    raw: body as unknown as Record<string, unknown>,
  };
  const { error } = await supabase
    .from("saas_metrics_daily")
    .upsert(row, { onConflict: "user_id,source,date" });
  if (error) {
    console.error("[saas-metrics/webhook/ingest] upsert failed:", error.message);
    return NextResponse.json({ ok: false, error: "저장 실패" }, { status: 500 });
  }

  await supabase
    .from("saas_metrics_connections")
    .update({ last_sync_at: new Date().toISOString(), last_sync_error: null })
    .eq("user_id", conn.user_id)
    .eq("source", "webhook");

  return NextResponse.json({ ok: true });
}
