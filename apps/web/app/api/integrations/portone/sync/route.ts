/**
 * POST /api/integrations/portone/sync
 *
 * 사장님이 "지금 동기화" 클릭 시 호출.
 *  1. portone_connections 에서 봉투 → 평문 Secret 복원
 *  2. PortOneClient (read-only) 로 GET /payments 페이지네이션
 *  3. portone_payments 테이블에 upsert (멱등 — 같은 paymentId 중복 안 들어감)
 *  4. last_sync_at 업데이트
 *
 * Body (옵션):
 *   { fromDays?: number, until?: string, fullBackfill?: boolean }
 *   - fromDays: 며칠 전부터 (기본 7일, fullBackfill=true 면 365일)
 *   - until: ISO datetime (기본 now)
 *   - fullBackfill: true 면 365일 백필 (느릴 수 있음)
 *
 * Response:
 *   { ok: true, fetched: number, upserted: number, latestPaidAt: string|null }
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../../_lib/envelope-crypto";
import {
  PortOneClient,
  PortOneApiError,
  type PortOnePayment,
} from "../../../_lib/portone-client";

export const runtime = "nodejs";
export const maxDuration = 60;

const PAGE_SIZE = 100;
const MAX_PAGES_PER_CALL = 30; // 안전장치 (3,000건 / 호출)

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const rl = await checkSimpleRateLimit({
    key: `portone-sync:${auth.userId}`,
    limit: 6,
    windowMs: 60_000,
    message: "동기화는 분당 6회까지 가능합니다.",
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });
  }

  // ── 1. 봉투 → 평문 ──
  const { data: conn, error: connErr } = await supabase
    .from("portone_connections")
    .select(
      "store_id, encrypted_secret, secret_iv, secret_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version, status"
    )
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (connErr || !conn) {
    return NextResponse.json(
      { ok: false, error: "포트원 연결을 먼저 설정해 주세요." },
      { status: 400 }
    );
  }
  if (conn.status !== "active") {
    return NextResponse.json(
      { ok: false, error: "연결이 비활성화되어 있습니다." },
      { status: 400 }
    );
  }

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
    console.error("[portone/sync] decrypt failed", e);
    return NextResponse.json(
      { ok: false, error: "보관된 Secret 을 복호화할 수 없습니다. 다시 연결해 주세요." },
      { status: 500 }
    );
  }

  // ── 2. 파라미터 ──
  let body: { fromDays?: number; until?: string; fullBackfill?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* body 없을 수 있음 */
  }
  const fullBackfill = body.fullBackfill === true;
  const fromDays = fullBackfill ? 365 : body.fromDays ?? 7;
  const until = body.until ? new Date(body.until) : new Date();
  const from = new Date(until.getTime() - fromDays * 24 * 60 * 60 * 1000);

  // ── 3. 페이지네이션 호출 ──
  const client = new PortOneClient({
    apiSecret: secret,
    storeId: conn.store_id ?? undefined,
  });

  let fetched = 0;
  let upserted = 0;
  let latestPaidAt: string | null = null;

  for (let page = 0; page < MAX_PAGES_PER_CALL; page++) {
    let resp;
    try {
      resp = await client.getPayments({
        from: from.toISOString(),
        until: until.toISOString(),
        pageNumber: page,
        pageSize: PAGE_SIZE,
      });
    } catch (e) {
      const errMsg =
        e instanceof PortOneApiError
          ? `${e.errorType}: ${e.message}`
          : (e as Error).message ?? "unknown";
      // 사장님 행에 마지막 에러 기록
      await supabase
        .from("portone_connections")
        .update({ last_sync_error: errMsg })
        .eq("user_id", auth.userId);
      return NextResponse.json(
        { ok: false, error: `포트원 API 오류: ${errMsg}`, fetched, upserted },
        { status: 502 }
      );
    }

    fetched += resp.items.length;
    if (resp.items.length === 0) break;

    // upsert
    const rows = resp.items.map((p) => paymentToRow(auth.userId, p));
    const { error: upErr } = await supabase
      .from("portone_payments")
      .upsert(rows, { onConflict: "id" });
    if (upErr) {
      console.error("[portone/sync] upsert failed", upErr);
      return NextResponse.json(
        { ok: false, error: "DB 저장 실패", fetched, upserted },
        { status: 500 }
      );
    }
    upserted += rows.length;
    for (const r of rows) {
      if (r.paid_at && (!latestPaidAt || r.paid_at > latestPaidAt)) latestPaidAt = r.paid_at;
    }

    // 마지막 페이지면 종료
    if (resp.items.length < PAGE_SIZE) break;
  }

  // ── 4. last_sync_at 업데이트 ──
  await supabase
    .from("portone_connections")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_error: null,
    })
    .eq("user_id", auth.userId);

  return NextResponse.json({
    ok: true,
    fetched,
    upserted,
    latestPaidAt,
    range: { from: from.toISOString(), until: until.toISOString() },
  });
}

// ─── 결제 → DB row 변환 ─────────────────────────────────────────────────

type PaymentRow = {
  id: string;
  user_id: string;
  payment_id: string;
  transaction_id: string | null;
  status: string;
  amount_total: number;
  amount_tax_free: number;
  amount_vat: number;
  currency: string;
  customer_id: string | null;
  customer_email: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  pg_provider: string | null;
  method_type: string | null;
  raw: PortOnePayment;
};

function paymentToRow(userId: string, p: PortOnePayment): PaymentRow {
  return {
    id: p.id,
    user_id: userId,
    payment_id: p.paymentId,
    transaction_id: p.transactionId ?? null,
    status: p.status,
    amount_total: Math.round(p.amount?.total ?? 0),
    amount_tax_free: Math.round(p.amount?.taxFree ?? 0),
    amount_vat: Math.round(p.amount?.vat ?? 0),
    currency: p.currency ?? "KRW",
    customer_id: p.customer?.id ?? null,
    customer_email: p.customer?.email ?? null,
    paid_at: p.paidAt ?? null,
    cancelled_at: p.cancelledAt ?? null,
    pg_provider: p.channel?.pgProvider ?? null,
    method_type: p.method?.type ?? null,
    raw: p,
  };
}
