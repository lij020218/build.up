/**
 * POST /api/integrations/saas-metrics/sync
 *
 * GA4 연결의 최근 N일 일별 지표(DAU/newUsers/totalUsers) 자동 수집 → saas_metrics_daily upsert.
 *
 * Body: { fromDays?: number }
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../../_lib/envelope-crypto";
import { fetchDailyMetrics, Ga4ApiError } from "../../../_lib/ga4-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `saas-metrics-sync:${auth.userId}`, limit: 4, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { fromDays?: number } = {};
  try { body = (await request.json()) as typeof body; } catch { /* empty */ }
  const fromDays = Math.min(Math.max(body.fromDays ?? 30, 1), 365);

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { data: conn, error: connErr } = await supabase
    .from("saas_metrics_connections")
    .select("encrypted_secret, secret_iv, secret_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version, property_id, status")
    .eq("user_id", auth.userId)
    .eq("source", "ga4")
    .maybeSingle();
  if (connErr || !conn) {
    return NextResponse.json({ ok: false, error: "GA4 연결을 먼저 등록해 주세요." }, { status: 400 });
  }
  if (conn.status !== "active") {
    return NextResponse.json({ ok: false, error: "GA4 연결이 비활성 상태입니다." }, { status: 400 });
  }
  if (!conn.property_id) {
    return NextResponse.json({ ok: false, error: "GA4 property 가 선택되지 않았습니다." }, { status: 400 });
  }

  let refreshToken: string;
  try {
    refreshToken = envelopeDecrypt({
      encryptedSecret: conn.encrypted_secret,
      secretIv: conn.secret_iv,
      secretAuthTag: conn.secret_auth_tag,
      encryptedDek: conn.encrypted_dek,
      dekIv: conn.dek_iv,
      dekAuthTag: conn.dek_auth_tag,
      kekVersion: conn.kek_version ?? 1,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "토큰 복호화 실패" }, { status: 500 });
  }

  const until = new Date();
  const from = new Date(until.getTime() - fromDays * 24 * 60 * 60 * 1000);
  const startDate = toYmd(from);
  const endDate = toYmd(until);

  let metrics;
  try {
    metrics = await fetchDailyMetrics({
      refreshToken,
      propertyId: conn.property_id,
      startDate,
      endDate,
    });
  } catch (e) {
    const err = e instanceof Ga4ApiError ? e : new Error(String(e));
    await supabase
      .from("saas_metrics_connections")
      .update({ last_sync_error: err.message, last_sync_at: new Date().toISOString() })
      .eq("user_id", auth.userId)
      .eq("source", "ga4");
    return NextResponse.json({ ok: false, error: err.message }, { status: 502 });
  }

  if (metrics.length === 0) {
    await supabase
      .from("saas_metrics_connections")
      .update({ last_sync_at: new Date().toISOString(), last_sync_error: null })
      .eq("user_id", auth.userId)
      .eq("source", "ga4");
    return NextResponse.json({ ok: true, fetched: 0 });
  }

  const rows = metrics.map((m) => ({
    user_id: auth.userId,
    source: "ga4",
    date: m.date,
    active_users: m.activeUsers,
    new_users: m.newUsers,
    cumulative_users: m.totalUsers ?? null,
    raw: m,
  }));
  const { error: insErr } = await supabase
    .from("saas_metrics_daily")
    .upsert(rows, { onConflict: "user_id,source,date" });
  if (insErr) {
    return NextResponse.json({ ok: false, error: `저장 실패: ${insErr.message}` }, { status: 500 });
  }

  await supabase
    .from("saas_metrics_connections")
    .update({ last_sync_at: new Date().toISOString(), last_sync_error: null })
    .eq("user_id", auth.userId)
    .eq("source", "ga4");

  return NextResponse.json({ ok: true, fetched: rows.length });
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
