/**
 * GET /api/integrations/codef/bank/balance
 *
 * 사장님이 등록한 *모든 활성* 사업자 통장의 **현재 잔고**.
 *  데이터 출처: codef_bank_transactions.balance_after — 계좌별 가장 최근 거래 기준.
 *  잔고는 거래 시점의 스냅샷이므로 "asOf" 함께 반환.
 *
 *  Why this endpoint exists (2026-05-11):
 *   CashflowSetupSheet 의 "현재 통장 잔고" 입력을 사장님이 수동 입력하던 것을
 *   이미 연동된 사업자 통장에서 *자동 불러오기* 로 대체. 수동 입력은 fallback.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../../_lib/auth";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";

export const runtime = "nodejs";

type AccountBalance = {
  accountId: string;
  bankName: string | null;
  accountAlias: string | null;
  accountNumberMask: string | null;
  isPrimary: boolean;
  balance: number;            // 원
  asOf: string | null;        // ISO — 마지막 거래 시각 (잔고 스냅샷 시점)
  lastSyncAt: string | null;  // ISO — codef sync 가 마지막으로 성공한 시각
};

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  // 1. 활성 통장 목록
  const { data: accounts, error: accErr } = await supabase
    .from("codef_bank_accounts")
    .select("id, bank_name, account_alias, account_number_mask, is_primary, last_sync_at")
    .eq("user_id", auth.userId)
    .eq("status", "active")
    .order("is_primary", { ascending: false });

  if (accErr) { console.warn("[codef/bank/balance] graceful:", accErr.message); return NextResponse.json({ ok: true, connected: false, totalBalance: 0, accounts: [] }); }
  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ ok: true, connected: false, totalBalance: 0, accounts: [] });
  }

  // 2. 각 계좌의 가장 최근 거래 → balance_after 가 그 시점의 잔고.
  const balances: AccountBalance[] = [];
  for (const a of accounts) {
    const { data: latest } = await supabase
      .from("codef_bank_transactions")
      .select("balance_after, transaction_at")
      .eq("user_id", auth.userId)
      .eq("account_id", a.id)
      .order("transaction_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    balances.push({
      accountId: a.id,
      bankName: a.bank_name,
      accountAlias: a.account_alias,
      accountNumberMask: a.account_number_mask,
      isPrimary: !!a.is_primary,
      balance: Math.max(0, Math.round(Number(latest?.balance_after ?? 0))),
      asOf: latest?.transaction_at ?? null,
      lastSyncAt: a.last_sync_at,
    });
  }

  // 3. 가장 오래된 잔고 스냅샷 시점 = 신뢰도 lower bound (모든 계좌가 그만큼 오래됨)
  const asOfTimes = balances.map((b) => b.asOf).filter((t): t is string => !!t);
  const oldestAsOf = asOfTimes.length > 0
    ? asOfTimes.reduce((min, t) => (t < min ? t : min))
    : null;

  const totalBalance = balances.reduce((s, b) => s + b.balance, 0);

  return NextResponse.json({
    ok: true,
    connected: true,
    totalBalance,
    asOf: oldestAsOf,
    accounts: balances,
  });
}
