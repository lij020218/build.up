/**
 * POST /api/admin/feedback/status — 피드백 처리 상태 변경(관리자 전용).
 *   body: { id: string, status: 'new'|'reviewing'|'resolved'|'wontfix' }
 *   service-role 로 RLS 우회 업데이트. requireAdmin 이 보안 경계.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { adminRateLimit } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["new", "reviewing", "resolved", "wontfix"] as const;

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { id?: string; status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const status = body.status;
  if (!id) return NextResponse.json({ ok: false, error: "id 누락" }, { status: 400 });
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ ok: false, error: "허용되지 않은 상태" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const { error } = await admin.from("user_feedback").update({ status }).eq("id", id);
  if (error) {
    console.error("[admin/feedback/status] update failed:", error.message);
    return NextResponse.json({ ok: false, error: "변경 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, status });
}
