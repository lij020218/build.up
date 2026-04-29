/**
 * POST /api/integrations/tossplace/sync
 * 사장님이 "지금 동기화" 클릭 시. 주문 + 결제 둘 다 가져오기.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../../_lib/envelope-crypto";
import {
  TossPlaceClient,
  TossPlaceApiError,
  type TossPlaceOrder,
  type TossPlacePayment,
} from "../../../_lib/tossplace-client";

export const runtime = "nodejs";
export const maxDuration = 60;

const PAGE_SIZE = 100;
const MAX_PAGES_PER_CALL = 30;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = checkSimpleRateLimit({ key: `tossplace-sync:${auth.userId}`, limit: 6, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { data: conn } = await supabase
    .from("tossplace_connections")
    .select("merchant_id, access_key, encrypted_secret, secret_iv, secret_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version, status")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!conn) return NextResponse.json({ ok: false, error: "TOSS Place 연결을 먼저 설정해 주세요." }, { status: 400 });
  if (conn.status !== "active") return NextResponse.json({ ok: false, error: "연결이 비활성 상태입니다." }, { status: 400 });

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
  } catch {
    return NextResponse.json({ ok: false, error: "Secret 복호화 실패. 다시 연결해 주세요." }, { status: 500 });
  }

  let body: { fromDays?: number; fullBackfill?: boolean } = {};
  try { body = (await request.json()) as typeof body; } catch { /* empty */ }
  const fromDays = body.fullBackfill ? 365 : body.fromDays ?? 7;
  const until = new Date();
  const from = new Date(until.getTime() - fromDays * 24 * 60 * 60 * 1000);

  const client = new TossPlaceClient({
    accessKey: conn.access_key,
    accessSecret: secret,
    merchantId: conn.merchant_id,
  });

  let fetched = 0;
  let upserted = 0;
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES_PER_CALL; page++) {
    let resp;
    try {
      resp = await client.getOrders({
        from: from.toISOString(),
        until: until.toISOString(),
        pageSize: PAGE_SIZE,
        cursor,
      });
    } catch (e) {
      const errMsg = e instanceof TossPlaceApiError ? `${e.errorCode}: ${e.message}` : (e as Error).message;
      await supabase.from("tossplace_connections").update({ last_sync_error: errMsg }).eq("user_id", auth.userId);
      return NextResponse.json({ ok: false, error: errMsg, fetched, upserted }, { status: 502 });
    }

    fetched += resp.items.length;
    if (resp.items.length === 0) break;

    // orders + payments 분리 저장
    const orderRows = resp.items.map((o) => orderToRow(auth.userId, o));
    const paymentRows = resp.items.flatMap((o) =>
      (o.payments ?? []).map((p) => paymentToRow(auth.userId, o, p))
    );

    if (orderRows.length > 0) {
      const { error } = await supabase.from("tossplace_orders").upsert(orderRows, { onConflict: "id" });
      if (error) {
        console.error("[tossplace/sync] orders upsert", error);
        return NextResponse.json({ ok: false, error: "주문 DB 저장 실패", fetched, upserted }, { status: 500 });
      }
    }
    if (paymentRows.length > 0) {
      const { error } = await supabase.from("tossplace_payments").upsert(paymentRows, { onConflict: "id" });
      if (error) {
        console.error("[tossplace/sync] payments upsert", error);
        return NextResponse.json({ ok: false, error: "결제 DB 저장 실패", fetched, upserted }, { status: 500 });
      }
    }
    upserted += orderRows.length;

    if (resp.hasMore && resp.nextCursor) {
      cursor = resp.nextCursor;
    } else if (resp.items.length < PAGE_SIZE) {
      break;
    } else {
      // cursor 미지원 + 페이지 가득 → 추가 가능성 가정
      break;
    }
  }

  await supabase
    .from("tossplace_connections")
    .update({ last_sync_at: new Date().toISOString(), last_sync_error: null })
    .eq("user_id", auth.userId);

  return NextResponse.json({
    ok: true,
    fetched,
    upserted,
    range: { from: from.toISOString(), until: until.toISOString() },
  });
}

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
