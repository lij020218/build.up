/**
 * GET /api/cron/portone-sync
 *
 * 매시간 Vercel cron 실행. 활성 포트원 연결 모두 순회하며 직전 25시간 결제 동기화.
 *
 * 인증: Vercel cron 은 `Authorization: Bearer <CRON_SECRET>` 자동 추가.
 * 수동 호출 시도 방어 위해 별도 secret 검증.
 *
 * 처리 한도 (Hobby 60초·Pro 300초 고려):
 *  - 한 번에 최대 50명까지 처리. 그 이상은 다음 cron 사이클에서.
 *  - 페이지네이션 cursor 는 last_sync_at ASC 로 결정 (오래된 사장님 우선).
 */

import { NextResponse } from "next/server";
import { getCronSecret } from "../../_lib/env";
import { timingSafeEqualStr } from "../../_lib/timing-safe";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../_lib/envelope-crypto";
import { sealEmail, redactPaymentRaw } from "../../_lib/payment-pii";
import { PortOneClient, PortOneApiError, type PortOnePayment } from "../../_lib/portone-client";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_USERS_PER_RUN = 50;
const PAGE_SIZE = 100;
const MAX_PAGES_PER_USER = 5; // user 당 500건 (overlap 25시간)

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const secret = getCronSecret();
  if (!secret) return false;
  return timingSafeEqualStr(token, secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Missing SERVICE_ROLE_KEY" }, { status: 500 });
  }

  // 활성 연결 가져오기 (오래 안 동기화된 사장님 우선)
  const { data: conns, error: connErr } = await supabase
    .from("portone_connections")
    .select(
      "user_id, store_id, encrypted_secret, secret_iv, secret_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version"
    )
    .eq("status", "active")
    .order("last_sync_at", { ascending: true, nullsFirst: true })
    .limit(MAX_USERS_PER_RUN);

  if (connErr) {
    return NextResponse.json(
      { error: `select failed: ${connErr.message}` },
      { status: 500 }
    );
  }
  if (!conns || conns.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, skipped: 0, message: "no active connections" });
  }

  const startedAt = Date.now();
  const report = {
    ok: true,
    processed: 0,
    failed: 0,
    totalUpserted: 0,
    totalFetched: 0,
    perUser: [] as Array<{ userId: string; fetched: number; upserted: number; error?: string }>,
  };

  // 25시간 윈도우 (overlap 으로 누락 방지)
  const until = new Date();
  const from = new Date(until.getTime() - 25 * 60 * 60 * 1000);

  for (const conn of conns) {
    const userReport = { userId: conn.user_id, fetched: 0, upserted: 0, error: undefined as string | undefined };

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
      userReport.error = `decrypt: ${(e as Error).message}`;
      report.failed += 1;
      report.perUser.push(userReport);
      await supabase
        .from("portone_connections")
        .update({ last_sync_error: userReport.error })
        .eq("user_id", conn.user_id);
      continue;
    }

    const client = new PortOneClient({
      apiSecret: secret,
      storeId: conn.store_id ?? undefined,
    });

    try {
      for (let page = 0; page < MAX_PAGES_PER_USER; page++) {
        const resp = await client.getPayments({
          from: from.toISOString(),
          until: until.toISOString(),
          pageNumber: page,
          pageSize: PAGE_SIZE,
        });
        userReport.fetched += resp.items.length;
        if (resp.items.length === 0) break;

        const rows = resp.items.map((p: PortOnePayment) => ({
          id: p.id,
          user_id: conn.user_id,
          payment_id: p.paymentId,
          transaction_id: p.transactionId ?? null,
          status: p.status,
          amount_total: Math.round(p.amount?.total ?? 0),
          amount_tax_free: Math.round(p.amount?.taxFree ?? 0),
          amount_vat: Math.round(p.amount?.vat ?? 0),
          currency: p.currency ?? "KRW",
          customer_id: p.customer?.id ?? null,
          // 고객 이메일: 평문 저장 금지 → 봉투 암호화만 (2026-06-05 보안).
          customer_email: null,
          customer_email_enc: sealEmail(p.customer?.email),
          paid_at: p.paidAt ?? null,
          cancelled_at: p.cancelledAt ?? null,
          pg_provider: p.channel?.pgProvider ?? null,
          method_type: p.method?.type ?? null,
          raw: redactPaymentRaw(p),
        }));

        const { error: upErr } = await supabase
          .from("portone_payments")
          .upsert(rows, { onConflict: "id" });
        if (upErr) {
          userReport.error = `upsert: ${upErr.message}`;
          report.failed += 1;
          break;
        }
        userReport.upserted += rows.length;
        if (resp.items.length < PAGE_SIZE) break;
      }

      // ⚠️ upsert 실패(userReport.error)가 있으면 '성공 마킹'을 건너뛴다.
      //   종전엔 break 후에도 무조건 last_sync_at 을 갱신해(성공 오기록) 다음 cron 이
      //   이 사장님을 '최근 동기화됨'으로 인식 → 실패한 페이지 결제가 영구 누락될 수 있었다.
      if (userReport.error) {
        await supabase
          .from("portone_connections")
          .update({ last_sync_error: userReport.error })
          .eq("user_id", conn.user_id);
      } else {
        // 성공 마킹 (오류 없을 때만)
        await supabase
          .from("portone_connections")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_error: null,
          })
          .eq("user_id", conn.user_id);
        report.processed += 1;
      }
    } catch (e) {
      const errMsg = e instanceof PortOneApiError
        ? `${e.errorType}: ${e.message}`
        : (e as Error).message ?? "unknown";
      userReport.error = errMsg;
      report.failed += 1;
      // 401 이면 status='invalid' 로 마킹 → 사장님이 재발급해야 함
      if (e instanceof PortOneApiError && (e.status === 401 || e.errorType === "UNAUTHORIZED")) {
        await supabase
          .from("portone_connections")
          .update({ status: "invalid", last_sync_error: errMsg })
          .eq("user_id", conn.user_id);
      } else {
        await supabase
          .from("portone_connections")
          .update({ last_sync_error: errMsg })
          .eq("user_id", conn.user_id);
      }
    }

    report.totalFetched += userReport.fetched;
    report.totalUpserted += userReport.upserted;
    report.perUser.push(userReport);

    // 시간 초과 방어 — 280초 넘으면 멈춤 (다음 cron 에서 이어감)
    if (Date.now() - startedAt > 280_000) {
      break;
    }
  }

  if (report.failed > 0) report.ok = false;
  return NextResponse.json({
    ...report,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}

// 수동 호출 (관리자 디버깅) 도 같은 핸들러
export async function POST(request: Request) {
  return GET(request);
}
