/**
 * GET /api/admin/applications?programId=&page= — 지원사업 신청 목록(최신순).
 *   앱 내부 신청(파운드원 운영 지원사업)으로 들어온 사장님 사업체 스냅샷을 정리해 반환.
 *   이메일 마스킹, snapshot(매출·사용자 변화 등) 그대로 전달.
 */
import { NextResponse } from "next/server";
import { requireAdmin, maskEmail } from "../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { adminRateLimit, buildEmailMap } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const url = new URL(request.url);
  const programId = url.searchParams.get("programId");
  const page = Math.max(0, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = admin
    .from("program_applications")
    .select("id, user_id, program_id, status, pitch, snapshot, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (programId) query = query.eq("program_id", programId);

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/applications] query failed:", error.message);
    return NextResponse.json({ ok: false, error: "조회 실패" }, { status: 500 });
  }

  const emailMap = await buildEmailMap(admin);

  const items = (data ?? []).map((row) => {
    const r = row as {
      id: string; user_id: string; program_id: string; status: string | null;
      pitch: string | null; snapshot: unknown; created_at: string;
    };
    const snap = (r.snapshot && typeof r.snapshot === "object" ? r.snapshot : {}) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const str = (v: unknown) => (typeof v === "string" ? v : null);
    const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
    return {
      id: r.id,
      programId: r.program_id,
      status: r.status ?? "submitted",
      pitch: r.pitch,
      storeName: str(snap.storeName),
      industryCategoryId: str(snap.industryCategoryId),
      businessLaunched: bool(snap.businessLaunched),
      businessLaunchedDate: str(snap.businessLaunchedDate),
      monthlyAvgRevenue: num(snap.monthlyAvgRevenue),
      hasUserSales: bool(snap.hasUserSales),
      weeklySalesChangePct: num(snap.weeklySalesChangePct),
      recentCustomers: num(snap.recentCustomers),
      customerChangePct: num(snap.customerChangePct),
      employeesCount: num(snap.employeesCount),
      createdAt: r.created_at,
      email: maskEmail(emailMap.get(r.user_id)),
    };
  });

  return NextResponse.json({
    ok: true,
    items,
    page,
    pageSize: PAGE_SIZE,
    total: count ?? null,
    hasMore: count != null ? to + 1 < count : items.length === PAGE_SIZE,
  });
}
