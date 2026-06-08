/**
 * GET /api/integrations/saas-metrics/daily?fromDays=30
 *
 * 통합 view 에서 일별 SaaS 지표 반환. DailyKpiStrip 의 active-users / cumulative-users
 * 등 셀에 자동 주입하기 위한 hook (useUnifiedSaasMetrics) 가 사용.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const fromDays = clampInt(url.searchParams.get("fromDays"), 1, 365, 30);

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const since = new Date(Date.now() - fromDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("v_saas_metrics_unified")
    .select("date, source, active_users, weekly_active_users, monthly_active_users, new_users, signups, churns, cumulative_users")
    .eq("user_id", auth.userId)
    .gte("date", since)
    .order("date", { ascending: true });

  if (error) { console.warn("[saas-metrics/daily] graceful empty:", error.message); return NextResponse.json({ ok: true, entries: [] }); }

  return NextResponse.json({ ok: true, entries: data ?? [] });
}

function clampInt(v: string | null, min: number, max: number, def: number): number {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(Math.trunc(n), min), max);
}
