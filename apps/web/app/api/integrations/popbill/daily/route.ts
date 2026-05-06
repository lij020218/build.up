/**
 * GET /api/integrations/popbill/daily?fromDays=30
 *
 * 팝빌 (현금영수증 + 매출 세금계산서) 을 일별 매출로 합산.
 * useUnifiedRevenue 의 'popbill' source 로 들어감.
 *
 * 매입 세금계산서는 매출이 아니므로 제외.
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

  const since = new Date(Date.now() - fromDays * 24 * 60 * 60 * 1000).toISOString();

  const [cashbillRes, taxinvoiceRes] = await Promise.all([
    supabase
      .from("popbill_cashbills")
      .select("issue_date, total_amount")
      .eq("user_id", auth.userId)
      .gte("issue_date", since),
    supabase
      .from("popbill_tax_invoices")
      .select("issue_date, total_amount")
      .eq("user_id", auth.userId)
      .eq("direction", "sell")
      .gte("issue_date", since),
  ]);

  const byDate = new Map<string, { sales: number; count: number }>();
  for (const r of cashbillRes.data ?? []) addToBucket(byDate, r.issue_date, r.total_amount);
  for (const r of taxinvoiceRes.data ?? []) addToBucket(byDate, r.issue_date, r.total_amount);

  const entries = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, sales: v.sales, customers: v.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ ok: true, entries });
}

function addToBucket(
  map: Map<string, { sales: number; count: number }>,
  isoDate: string | null,
  amount: number | null
): void {
  if (!isoDate) return;
  const date = toKstDate(isoDate);
  const cur = map.get(date) ?? { sales: 0, count: 0 };
  cur.sales += amount ?? 0;
  cur.count += 1;
  map.set(date, cur);
}

function toKstDate(iso: string): string {
  // KST 기준 YYYY-MM-DD
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function clampInt(s: string | null, min: number, max: number, fallback: number): number {
  if (!s) return fallback;
  const n = Math.floor(Number(s));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
