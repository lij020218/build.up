/**
 * GET /api/integrations/codef/bank/status
 *
 * 사장님이 등록한 사업자 통장 목록 + 최근 30일 거래 통계.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../../_lib/auth";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { data: accounts, error } = await supabase
    .from("codef_bank_accounts")
    .select(
      "id, organization, bank_name, account_number_mask, account_holder, account_alias, is_primary, status, last_sync_at, last_sync_error, created_at"
    )
    .eq("user_id", auth.userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) { console.warn("[codef/bank/status] graceful:", error.message); return NextResponse.json({ ok: true, accounts: [] }); }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const accountsWithStats = await Promise.all(
    (accounts ?? []).map(async (a) => {
      const { count } = await supabase
        .from("codef_bank_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .eq("account_id", a.id)
        .gte("transaction_at", since);
      return { ...a, txCount30d: count ?? 0 };
    })
  );

  return NextResponse.json({ ok: true, accounts: accountsWithStats });
}
