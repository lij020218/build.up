import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const rl = checkSimpleRateLimit({ key: `tossplace-disconnect:${auth.userId}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { error } = await supabase
    .from("tossplace_connections")
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

  if (error) return NextResponse.json({ ok: false, error: "해제 실패" }, { status: 500 });
  return NextResponse.json({ ok: true, status: "revoked" });
}
