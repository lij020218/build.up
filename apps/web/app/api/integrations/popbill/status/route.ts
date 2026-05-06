/**
 * GET /api/integrations/popbill/status
 *
 * 팝빌 연결 상태 + 최근 30일 수집 통계.
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
    .from("popbill_connections")
    .select(
      "business_number_mask, business_name, hometax_cert_registered, status, last_sync_at, last_sync_error, created_at"
    )
    .eq("user_id", auth.userId)
    .maybeSingle();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [taxSell, taxBuy, cashbill, recentJobs] = await Promise.all([
    supabase
      .from("popbill_tax_invoices")
      .select("id, total_amount", { count: "exact" })
      .eq("user_id", auth.userId)
      .eq("direction", "sell")
      .gte("issue_date", since),
    supabase
      .from("popbill_tax_invoices")
      .select("id, total_amount", { count: "exact" })
      .eq("user_id", auth.userId)
      .eq("direction", "buy")
      .gte("issue_date", since),
    supabase
      .from("popbill_cashbills")
      .select("id, total_amount", { count: "exact" })
      .eq("user_id", auth.userId)
      .gte("issue_date", since),
    supabase
      .from("popbill_jobs")
      .select("job_id, job_kind, state, collect_count, collect_total, requested_at, finished_at, error_message")
      .eq("user_id", auth.userId)
      .order("requested_at", { ascending: false })
      .limit(10),
  ]);

  const sumAmount = (rows: Array<{ total_amount?: number | null }> | null | undefined) =>
    (rows ?? []).reduce((sum, r) => sum + (r.total_amount ?? 0), 0);

  return NextResponse.json({
    ok: true,
    connection: conn ?? { status: "not_connected" },
    stats30d: {
      taxinvoiceSell: { count: taxSell.count ?? 0, amount: sumAmount(taxSell.data) },
      taxinvoiceBuy: { count: taxBuy.count ?? 0, amount: sumAmount(taxBuy.data) },
      cashbill: { count: cashbill.count ?? 0, amount: sumAmount(cashbill.data) },
    },
    recentJobs: recentJobs.data ?? [],
  });
}
