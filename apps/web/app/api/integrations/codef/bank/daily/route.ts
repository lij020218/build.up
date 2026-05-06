/**
 * GET /api/integrations/codef/bank/daily?fromDays=30
 *
 * CODEF 사업자 통장 입금 거래내역 → 일별 매출로 환산.
 *
 * 카테고리 'card_settlement', 'sales_cash', 'transfer_in' 만 매출로 간주.
 * 'salary', 'rent', 'utility', 'tax', 'loan', 'purchase', 'transfer_out' 은 비용 → 제외.
 *
 * useUnifiedRevenue 의 'codef-bank' source. 정확도가 낮으므로 우선순위 낮음.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../../_lib/auth";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";

export const runtime = "nodejs";

const REVENUE_CATEGORIES = ["card_settlement", "sales_cash", "transfer_in"];

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const fromDays = clampInt(url.searchParams.get("fromDays"), 1, 365, 30);

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const since = new Date(Date.now() - fromDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("codef_bank_transactions")
    .select("transaction_at, amount_in, category")
    .eq("user_id", auth.userId)
    .gte("transaction_at", since)
    .gt("amount_in", 0)
    .in("category", REVENUE_CATEGORIES);
  if (error) return NextResponse.json({ ok: false, error: "조회 실패" }, { status: 500 });

  const byDate = new Map<string, { sales: number; count: number }>();
  for (const r of rows ?? []) {
    const date = toKstDate(r.transaction_at);
    const cur = byDate.get(date) ?? { sales: 0, count: 0 };
    cur.sales += r.amount_in ?? 0;
    cur.count += 1;
    byDate.set(date, cur);
  }

  const entries = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, sales: v.sales, customers: v.count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ ok: true, entries });
}

function toKstDate(iso: string): string {
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
