/**
 * GET /api/integrations/toss/status — 사장님 Toss Payments 연결 상태 + 최근 30일 이벤트 요약.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { data: conn } = await supabase
    .from("toss_connections")
    .select("secret_mask, client_key, status, last_validated_at, last_sync_at, last_sync_error, created_at")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!conn) return NextResponse.json({ ok: true, connected: false });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("subscription_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .eq("provider", "toss")
    .gte("occurred_at", thirtyDaysAgo);

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://buildup.example.com").replace(/\/$/, "");
  return NextResponse.json({
    ok: true,
    connected: conn.status === "active",
    maskedSecret: conn.secret_mask,
    clientKey: conn.client_key,
    status: conn.status,
    lastValidatedAt: conn.last_validated_at,
    lastSyncAt: conn.last_sync_at,
    lastSyncError: conn.last_sync_error,
    createdAt: conn.created_at,
    eventCount30d: count ?? 0,
    webhookUrl: `${baseUrl}/api/webhooks/toss/${auth.userId}`,
  });
}
