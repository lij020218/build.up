/**
 * GET /api/admin/revenue — 구독 결제 현황(foundone_payments).
 *   ⚠️ 사용자 매출 동기화용 portone_payments 와 다름. 여기는 Found.One 구독 매출.
 *   PAID 합계·건수, 최근 31일 활성 구독자(추정), 최근 결제 10건(이메일 마스킹).
 */
import { NextResponse } from "next/server";
import { requireAdmin, maskEmail } from "../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { adminRateLimit, buildEmailMap } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  // 전체 PAID 행을 가져와 JS 집계 (소규모 기준; 스케일 시 RPC SUM).
  const { data, error } = await admin
    .from("foundone_payments")
    .select("id, user_id, amount, currency, status, plan, paid_at, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[admin/revenue] query failed:", error.message);
    return NextResponse.json({ ok: false, error: "조회 실패" }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{
    id: string; user_id: string; amount: number; currency: string;
    status: string; plan: string; paid_at: string | null; created_at: string;
  }>;

  const paid = rows.filter((r) => r.status === "PAID");
  const paidTotal = paid.reduce((sum, r) => sum + (Number.isFinite(r.amount) ? r.amount : 0), 0);

  // 최근 31일 활성 구독자(고유 user_id, PAID 기준)
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  const activeUserIds = new Set<string>();
  for (const r of paid) {
    const ts = r.paid_at ?? r.created_at;
    if (ts && new Date(ts).getTime() >= cutoff) activeUserIds.add(r.user_id);
  }

  const emailMap = await buildEmailMap(admin);
  const recent = rows.slice(0, 10).map((r) => ({
    id: r.id,
    email: maskEmail(emailMap.get(r.user_id)),
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    plan: r.plan,
    paidAt: r.paid_at,
    createdAt: r.created_at,
  }));

  return NextResponse.json({
    ok: true,
    metrics: {
      paidCount: paid.length,
      paidTotal,
      currency: paid[0]?.currency ?? "KRW",
      activeSubscribers: activeUserIds.size,
      totalRows: rows.length,
    },
    recent,
  });
}
