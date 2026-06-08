/**
 * GET /api/admin/me — 현재 세션이 관리자인지 확인하는 경량 프로브.
 *   클라이언트 AdminGuard 가 호출: 200(관리자) / 401(미로그인) / 403(비관리자).
 *   allowlist 는 서버에만 있으므로 클라이언트는 이 응답으로만 관리자 여부를 안다.
 */
import { NextResponse } from "next/server";
import { requireAdmin, maskEmail } from "../../_lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  return NextResponse.json({ ok: true, email: maskEmail(gate.email) });
}
