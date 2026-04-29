/**
 * POST /api/integrations/portone/disconnect
 *
 * 사장님이 포트원 연결을 해제.
 *  - portone_connections 행을 status='revoked' 로 마킹 + 봉투 비우기 (실제 삭제는 옵션)
 *  - 동기화된 결제 데이터(portone_payments) 는 보존 (사장님이 원할 때만 별도 삭제)
 *
 * Body: 없음
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const rl = checkSimpleRateLimit({
    key: `portone-disconnect:${auth.userId}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });
  }

  // 봉투 자체를 빈 문자열로 덮고 status='revoked' — 평문 복원 불가능 처리
  const { error } = await supabase
    .from("portone_connections")
    .update({
      status: "revoked",
      encrypted_secret: "",
      secret_iv: "",
      secret_auth_tag: "",
      encrypted_dek: "",
      dek_iv: "",
      dek_auth_tag: "",
    })
    .eq("user_id", auth.userId);

  if (error) {
    console.error("[portone/disconnect]", error);
    return NextResponse.json({ ok: false, error: "해제 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "revoked" });
}
