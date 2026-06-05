/**
 * GET /api/cron/tossplace-sync — 매시간 활성 TOSS Place 연결 일괄 동기화.
 */
import { NextResponse } from "next/server";
import { getCronSecret } from "../../_lib/env";
import { timingSafeEqualStr } from "../../_lib/timing-safe";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../_lib/envelope-crypto";
import {
  TossPlaceClient,
  TossPlaceApiError,
  type TossPlaceOrder,
  type TossPlacePayment,
} from "../../_lib/tossplace-client";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_USERS_PER_RUN = 50;
const PAGE_SIZE = 100;
const MAX_PAGES_PER_USER = 5;

function isAuthorized(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const secret = getCronSecret();
  return timingSafeEqualStr(token, secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Missing SERVICE_ROLE_KEY" }, { status: 500 });

  const { data: conns, error } = await supabase
    .from("tossplace_connections")
    .select("user_id, merchant_id, access_key, encrypted_secret, secret_iv, secret_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version")
    .eq("status", "active")
    .order("last_sync_at", { ascending: true, nullsFirst: true })
    .limit(MAX_USERS_PER_RUN);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!conns || conns.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const startedAt = Date.now();
  const report = { ok: true, processed: 0, failed: 0, totalUpserted: 0, totalFetched: 0 };
  const until = new Date();
  const from = new Date(until.getTime() - 25 * 60 * 60 * 1000); // 25h overlap

  for (const conn of conns) {
    let secret: string;
    try {
      secret = envelopeDecrypt({
        encryptedSecret: conn.encrypted_secret,
        secretIv: conn.secret_iv,
        secretAuthTag: conn.secret_auth_tag,
        encryptedDek: conn.encrypted_dek,
        dekIv: conn.dek_iv,
        dekAuthTag: conn.dek_auth_tag,
        kekVersion: conn.kek_version,
      });
    } catch (e) {
      report.failed += 1;
      await supabase.from("tossplace_connections").update({ last_sync_error: `decrypt: ${(e as Error).message}` }).eq("user_id", conn.user_id);
      continue;
    }

    const client = new TossPlaceClient({
      accessKey: conn.access_key,
      accessSecret: secret,
      merchantId: conn.merchant_id,
    });

    try {
      let cursor: string | undefined;
      for (let page = 0; page < MAX_PAGES_PER_USER; page++) {
        const resp = await client.getOrders({
          from: from.toISOString(),
          until: until.toISOString(),
          pageSize: PAGE_SIZE,
          cursor,
        });
        report.totalFetched += resp.items.length;
        if (resp.items.length === 0) break;

        const orderRows = resp.items.map((o) => orderToRow(conn.user_id, o));
        const paymentRows = resp.items.flatMap((o) =>
          (o.payments ?? []).map((p) => paymentToRow(conn.user_id, o, p))
        );

        if (orderRows.length > 0) {
          const { error } = await supabase.from("tossplace_orders").upsert(orderRows, { onConflict: "id" });
          if (error) throw new Error(`orders upsert: ${error.message}`);
        }
        if (paymentRows.length > 0) {
          const { error } = await supabase.from("tossplace_payments").upsert(paymentRows, { onConflict: "id" });
          if (error) throw new Error(`payments upsert: ${error.message}`);
        }
        report.totalUpserted += orderRows.length;
        if (resp.hasMore && resp.nextCursor) cursor = resp.nextCursor;
        else if (resp.items.length < PAGE_SIZE) break;
        else break;
      }
      await supabase.from("tossplace_connections").update({ last_sync_at: new Date().toISOString(), last_sync_error: null }).eq("user_id", conn.user_id);
      report.processed += 1;
    } catch (e) {
      const errMsg = e instanceof TossPlaceApiError ? `${e.errorCode}: ${e.message}` : (e as Error).message;
      report.failed += 1;
      const isAuthErr = e instanceof TossPlaceApiError && (e.status === 401 || e.status === 403);
      await supabase
        .from("tossplace_connections")
        .update({ last_sync_error: errMsg, ...(isAuthErr ? { status: "invalid" } : {}) })
        .eq("user_id", conn.user_id);
    }

    if (Date.now() - startedAt > 280_000) break;
  }

  if (report.failed > 0) report.ok = false;
  return NextResponse.json({ ...report, durationMs: Date.now() - startedAt, timestamp: new Date().toISOString() });
}

export async function POST(request: Request) { return GET(request); }

function orderToRow(userId: string, o: TossPlaceOrder) {
  return {
    id: o.orderId,
    user_id: userId,
    merchant_id: o.merchantId,
    status: o.status,
    channel: o.channel ?? null,
    total_amount: Math.round(o.totalAmount ?? 0),
    tax_free_amount: Math.round(o.taxFreeAmount ?? 0),
    vat: Math.round(o.vat ?? 0),
    service_charge: Math.round(o.serviceCharge ?? 0),
    discount: Math.round(o.discount ?? 0),
    requested_at: o.requestedAt ?? null,
    completed_at: o.completedAt ?? null,
    cancelled_at: o.cancelledAt ?? null,
    raw: o,
  };
}
function paymentToRow(userId: string, o: TossPlaceOrder, p: TossPlacePayment) {
  return {
    id: p.paymentId,
    user_id: userId,
    order_id: o.orderId,
    merchant_id: o.merchantId,
    amount: Math.round(p.amount ?? 0),
    vat: Math.round(p.vat ?? 0),
    service_charge: Math.round(p.serviceCharge ?? 0),
    approved_at: p.approvedAt ?? null,
    cancelled_at: p.cancelledAt ?? null,
    approval_number: p.approvalNumber ?? null,
    method: p.method,
    card_brand: p.card?.brand ?? null,
    card_type: p.card?.type ?? null,
    raw: p,
  };
}
