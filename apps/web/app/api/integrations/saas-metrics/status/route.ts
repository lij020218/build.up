/**
 * GET /api/integrations/saas-metrics/status
 *
 * 연결된 채널(들)과 최근 30일 통계.
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

  const { data: conns } = await supabase
    .from("saas_metrics_connections")
    .select("source, property_id, property_label, status, last_sync_at, last_sync_error, created_at")
    .eq("user_id", auth.userId);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: recent } = await supabase
    .from("v_saas_metrics_unified")
    .select("date, source, active_users, new_users, cumulative_users")
    .eq("user_id", auth.userId)
    .gte("date", since)
    .order("date", { ascending: false });

  // 30일 통계 — 최신 일별 row 우선
  const latest = (recent ?? [])[0];
  const totalNewUsers = (recent ?? []).reduce((s, r) => s + (r.new_users ?? 0), 0);
  const avgDau = recent && recent.length > 0
    ? Math.round((recent.reduce((s, r) => s + (r.active_users ?? 0), 0) / recent.length) * 10) / 10
    : 0;

  return NextResponse.json({
    ok: true,
    connections: conns ?? [],
    stats30d: {
      latestDate: latest?.date ?? null,
      latestActiveUsers: latest?.active_users ?? null,
      latestCumulativeUsers: latest?.cumulative_users ?? null,
      avgDau,
      totalNewUsers,
    },
  });
}
