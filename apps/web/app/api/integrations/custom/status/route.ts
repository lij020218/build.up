/**
 * GET /api/integrations/custom/status — 사장님 Custom webhook 토큰 상태 + 30일 이벤트 카운트.
 * 평문 토큰은 절대 반환 X (mask 만).
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
    .from("custom_connections")
    .select("token_mask, description, status, last_sync_at, created_at, rotated_at")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!conn) return NextResponse.json({ ok: true, connected: false });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("subscription_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .eq("provider", "custom")
    .gte("occurred_at", thirtyDaysAgo);

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://buildup.example.com").replace(/\/$/, "");
  return NextResponse.json({
    ok: true,
    connected: conn.status === "active",
    tokenMask: conn.token_mask,
    description: conn.description,
    status: conn.status,
    lastSyncAt: conn.last_sync_at,
    rotatedAt: conn.rotated_at,
    createdAt: conn.created_at,
    eventCount30d: count ?? 0,
    webhookUrl: `${baseUrl}/api/webhooks/custom/${auth.userId}`,
  });
}
