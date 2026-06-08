/**
 * POST /api/feedback — 인앱 사장님 피드백 적재 (user_feedback 테이블).
 *
 * 인증: requireApiUser. rate limit 5/분. 메시지 1~2000자, category 화이트리스트.
 * context(jsonb)는 진단 맥락(platform/screen/appVersion 등) — 크기 상한으로 비용·악용 방지.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../_lib/auth";
import { checkSimpleRateLimit } from "../_lib/rate-limit";
import { getSupabaseAdmin } from "../_lib/supabase-admin";

export const runtime = "nodejs";

const CATEGORIES = ["bug", "idea", "ux", "other"] as const;
const MAX_MESSAGE = 2000;
const MAX_CONTEXT_BYTES = 2000;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `feedback:${auth.userId}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { category?: string; message?: string; context?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE) : "";
  if (!message) return NextResponse.json({ ok: false, error: "내용을 입력해 주세요." }, { status: 400 });

  const category = CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])
    ? (body.category as string)
    : "other";

  // context 크기 상한 — 초과 시 버림(피드백 본문은 살림).
  let context: Record<string, unknown> = {};
  try {
    if (body.context && typeof body.context === "object") {
      const json = JSON.stringify(body.context);
      if (json.length <= MAX_CONTEXT_BYTES) context = body.context as Record<string, unknown>;
    }
  } catch {
    /* context 직렬화 실패 — 무시 */
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const { error } = await supabase.from("user_feedback").insert({
    user_id: auth.userId,
    category,
    message,
    context,
  });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    return NextResponse.json({ ok: false, error: "전송에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
