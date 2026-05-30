import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });

  const { data: sub, error: fetchErr } = await supabase
    .from("foundone_subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (fetchErr || !sub) {
    return NextResponse.json({ error: "구독 정보를 찾을 수 없습니다." }, { status: 404 });
  }
  if (sub.plan === "free") {
    return NextResponse.json({ error: "무료 플랜은 취소할 수 없습니다." }, { status: 400 });
  }
  if (sub.status === "canceled") {
    return NextResponse.json({ error: "이미 취소된 구독입니다." }, { status: 400 });
  }

  // 즉시 취소가 아니라 기간 종료 후 만료 (cancel_at_period_end)
  const { error: updateErr } = await supabase
    .from("foundone_subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("user_id", auth.userId);

  if (updateErr) {
    console.error("[billing/cancel]", updateErr);
    return NextResponse.json({ error: "취소 처리에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `구독이 취소 예정으로 설정됐습니다. ${sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("ko-KR") + "까지" : ""} 프리미엄을 계속 이용할 수 있습니다.`,
    currentPeriodEnd: sub.current_period_end,
  });
}
