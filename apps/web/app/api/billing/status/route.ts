import { NextResponse } from "next/server";
import { requireApiUser, getUserScopedClient } from "../../_lib/auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // 읽기는 사용자 JWT 클라이언트로 — RLS 가 본인 행만 반환(defense-in-depth).
  const supabase = getUserScopedClient(request);
  if (!supabase) return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  const { data, error } = await supabase
    .from("foundone_subscriptions")
    .select("plan, status, current_period_start, current_period_end, cancel_at_period_end, billing_method_label")
    .eq("user_id", auth.userId)
    .maybeSingle();

  // 조회 실패(테이블 미존재=마이그레이션 미적용 등) → 무료 플랜으로 graceful.
  //   (500 던지면 대시보드 콘솔 도배 + 결제카드 깨짐. 메모리 규칙: 500 금지·graceful empty)
  if (error) {
    console.warn("[billing/status] 조회 실패 — free 폴백:", error.message);
    return NextResponse.json({ plan: "free", status: "active" });
  }

  // 구독 레코드 없으면 무료 플랜
  if (!data) {
    return NextResponse.json({ plan: "free", status: "active" });
  }

  // GET 핸들러에서 DB 쓰기 금지 — REST 멱등성 위반 + concurrent tab race 야기.
  // effectiveStatus 는 응답 시점에 계산해 클라이언트에 전달하고,
  // 실제 status 컬럼 갱신은 웹훅/cron 이 담당한다.
  const now = new Date();
  const isPastDue =
    data.status === "active" &&
    data.current_period_end &&
    new Date(data.current_period_end) < now;

  const effectiveStatus = isPastDue ? "past_due" : data.status;

  return NextResponse.json({ ...data, status: effectiveStatus });
}
