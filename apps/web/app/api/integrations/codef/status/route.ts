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
    .from("codef_connections")
    .select("business_number_mask, business_name, status, last_sync_at, last_sync_error, created_at")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!conn) return NextResponse.json({ ok: true, connected: false });

  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("codef_card_sales")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .gte("approved_at", thirty);

  return NextResponse.json({
    ok: true,
    connected: true,
    businessNumberMask: conn.business_number_mask,
    businessName: conn.business_name,
    status: conn.status,
    lastSyncAt: conn.last_sync_at,
    lastSyncError: conn.last_sync_error,
    createdAt: conn.created_at,
    salesCount30d: count ?? 0,
  });
}
