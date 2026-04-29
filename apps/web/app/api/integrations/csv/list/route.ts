/**
 * GET /api/integrations/csv/list — 사장님이 업로드한 CSV 이력 + 일별 합계
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

  const { data: uploads } = await supabase
    .from("csv_revenue_uploads")
    .select("id, filename, source_label, row_count, total_amount, uploaded_at")
    .eq("user_id", auth.userId)
    .order("uploaded_at", { ascending: false })
    .limit(20);

  const url = new URL(request.url);
  const fromDays = Number(url.searchParams.get("fromDays") ?? "30");
  const safeDays = Number.isFinite(fromDays) && fromDays > 0 && fromDays <= 365 ? fromDays : 30;
  const from = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: entries } = await supabase
    .from("csv_revenue_entries")
    .select("date, amount, customer_count")
    .eq("user_id", auth.userId)
    .gte("date", from)
    .order("date", { ascending: true });

  // 일별 합계 (같은 날짜 여러 업로드면 합산)
  const dailyMap = new Map<string, { date: string; sales: number; customers: number; source: "csv" }>();
  for (const e of entries ?? []) {
    const existing = dailyMap.get(e.date);
    if (existing) {
      existing.sales += Number(e.amount);
      existing.customers += Number(e.customer_count ?? 0);
    } else {
      dailyMap.set(e.date, { date: e.date, sales: Number(e.amount), customers: Number(e.customer_count ?? 0), source: "csv" });
    }
  }

  return NextResponse.json({
    ok: true,
    uploads: uploads ?? [],
    dailyEntries: Array.from(dailyMap.values()),
  });
}
