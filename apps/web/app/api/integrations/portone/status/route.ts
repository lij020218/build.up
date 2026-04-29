/**
 * GET /api/integrations/portone/status
 *
 * 사장님의 포트원 연결 상태 조회.
 *  - 평문 Secret 은 절대 반환 안 함 (mask 만)
 *  - 마지막 동기화 시점, 활성 여부, 결제 건수 요약
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "DB 설정 오류" },
      { status: 500 }
    );
  }

  const { data: conn } = await supabase
    .from("portone_connections")
    .select("store_id, secret_mask, status, last_validated_at, last_sync_at, last_sync_error, created_at")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ ok: true, connected: false });
  }

  // 결제 건수 (최근 30일) — 가벼운 카운트
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("portone_payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .gte("paid_at", thirtyDaysAgo);

  return NextResponse.json({
    ok: true,
    connected: true,
    storeId: conn.store_id,
    maskedSecret: conn.secret_mask,
    status: conn.status,
    lastValidatedAt: conn.last_validated_at,
    lastSyncAt: conn.last_sync_at,
    lastSyncError: conn.last_sync_error,
    createdAt: conn.created_at,
    paymentCount30d: count ?? 0,
  });
}
