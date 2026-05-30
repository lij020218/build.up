import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  const { data, error } = await supabase
    .from("foundone_subscriptions")
    .select("plan, status, current_period_start, current_period_end, cancel_at_period_end, billing_method_label")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) {
    console.error("[billing/status]", error);
    return NextResponse.json({ error: "구독 정보를 불러올 수 없습니다." }, { status: 500 });
  }

  // 구독 레코드 없으면 무료 플랜
  if (!data) {
    return NextResponse.json({ plan: "free", status: "active" });
  }

  // 기간이 지났으면 past_due 처리
  const now = new Date();
  const isPastDue =
    data.status === "active" &&
    data.current_period_end &&
    new Date(data.current_period_end) < now;

  if (isPastDue) {
    await supabase!
      .from("foundone_subscriptions")
      .update({ status: "past_due" })
      .eq("user_id", auth.userId);
    return NextResponse.json({ ...data, status: "past_due" });
  }

  return NextResponse.json(data);
}
