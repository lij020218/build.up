/**
 * POST /api/integrations/codef/bank/sync
 *
 * 등록된 사업자 통장 거래내역 동기화.
 * Body: { accountId?: string; fromDays?: number; fullBackfill?: boolean }
 *
 * accountId 미입력 → primary 계좌. 그것도 없으면 모든 active 계좌.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../../../_lib/envelope-crypto";
import { CodefClient, CodefApiError, type CodefBankTxRaw } from "../../../../_lib/codef-client";
import { normalizeCodefBankTx } from "@build-up/integrations";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = checkSimpleRateLimit({ key: `codef-bank-sync:${auth.userId}`, limit: 6, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { accountId?: string; fromDays?: number; fullBackfill?: boolean } = {};
  try { body = (await request.json()) as typeof body; } catch { /* empty */ }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  // CODEF connectedId 복호화
  const { data: conn } = await supabase
    .from("codef_connections")
    .select("encrypted_connected_id, cid_iv, cid_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version, status")
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!conn || conn.status !== "active") {
    return NextResponse.json({ ok: false, error: "CODEF 위임 등록 필요" }, { status: 400 });
  }
  let connectedId: string;
  try {
    connectedId = envelopeDecrypt({
      encryptedSecret: conn.encrypted_connected_id,
      secretIv: conn.cid_iv,
      secretAuthTag: conn.cid_auth_tag,
      encryptedDek: conn.encrypted_dek,
      dekIv: conn.dek_iv,
      dekAuthTag: conn.dek_auth_tag,
      kekVersion: conn.kek_version,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "토큰 복호화 실패" }, { status: 500 });
  }

  // 동기화 대상 계좌
  let query = supabase
    .from("codef_bank_accounts")
    .select("id, organization, account_number")
    .eq("user_id", auth.userId)
    .eq("status", "active");
  if (body.accountId) query = query.eq("id", body.accountId);
  const { data: accounts } = await query;
  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ ok: false, error: "동기화할 통장이 없습니다." }, { status: 400 });
  }

  let client: CodefClient;
  try {
    client = new CodefClient({ env: "sandbox" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message, code: "CODEF_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const fromDays = body.fullBackfill ? 365 : body.fromDays ?? 30;
  const until = new Date();
  const from = new Date(until.getTime() - fromDays * 24 * 60 * 60 * 1000);

  let totalFetched = 0;
  let totalUpserted = 0;
  const perAccount: Array<{ accountId: string; fetched: number; upserted: number; error?: string }> = [];

  for (const acc of accounts) {
    try {
      const result = await client.getBusinessBankTransactions({
        connectedId,
        organization: acc.organization,
        account: acc.account_number,
        startDate: toYmd(from),
        endDate: toYmd(until),
      });
      const rawList: CodefBankTxRaw[] = result.resTrHistoryList ?? [];
      totalFetched += rawList.length;

      const rows = rawList.map((r) => {
        const norm = normalizeCodefBankTx({ accountId: acc.id, raw: r });
        return {
          user_id: auth.userId,
          account_id: acc.id,
          transaction_at: norm.transactionAt,
          amount_in: norm.amountIn,
          amount_out: norm.amountOut,
          balance_after: norm.balanceAfter,
          description1: r.resAccountDesc1 ?? null,
          description2: r.resAccountDesc2 ?? null,
          description3: r.resAccountDesc3 ?? null,
          description4: r.resAccountDesc4 ?? null,
          category: norm.category ?? null,
          counterparty: norm.counterparty ?? null,
          raw: norm.raw ?? r,
        };
      });

      if (rows.length > 0) {
        const { error } = await supabase
          .from("codef_bank_transactions")
          .upsert(rows, { onConflict: "user_id,account_id,transaction_at,amount_in,amount_out,balance_after" });
        if (error) {
          console.error("[codef/bank/sync] upsert", error);
          perAccount.push({ accountId: acc.id, fetched: rows.length, upserted: 0, error: "DB 저장 실패" });
          continue;
        }
      }

      totalUpserted += rows.length;
      perAccount.push({ accountId: acc.id, fetched: rows.length, upserted: rows.length });
      await supabase
        .from("codef_bank_accounts")
        .update({ last_sync_at: new Date().toISOString(), last_sync_error: null })
        .eq("id", acc.id);
    } catch (e) {
      const errMsg =
        e instanceof CodefApiError ? `${e.resultCode}: ${e.resultMessage}` : (e as Error).message;
      await supabase
        .from("codef_bank_accounts")
        .update({ last_sync_error: errMsg })
        .eq("id", acc.id);
      perAccount.push({ accountId: acc.id, fetched: 0, upserted: 0, error: errMsg });
    }
  }

  return NextResponse.json({
    ok: true,
    fetched: totalFetched,
    upserted: totalUpserted,
    range: { from: from.toISOString(), until: until.toISOString() },
    accounts: perAccount,
  });
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
