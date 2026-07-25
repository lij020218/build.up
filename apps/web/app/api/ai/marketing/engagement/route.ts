import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";

/**
 * 마케팅 실행 신호 계측 (2026-07-25) — POST { weekKey, event }.
 *
 * v2 개편의 성패 지표 수집: copy_click(실행물 복사) / meme_origin_click(밈 원본 보기).
 * append-only insert, 실패해도 클라이언트는 무시(fire-and-forget) — UX 에 절대 개입하지 않는 계측.
 * 집계: service_role 쿼리 (user_id·week_key group by). 웹·iOS 공용.
 */

export const runtime = "nodejs";

const EVENTS = new Set(["copy_click", "meme_origin_click"]);
const WEEK_RE = /^\d{4}-W\d{2}$/;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // 폭주 방어 — 계측이라 관대하되 무한 루프 클라이언트는 차단.
  const burst = await checkSimpleRateLimit({ key: `mkt-engagement:${auth.userId}`, limit: 120, windowMs: 60 * 60 * 1000 });
  if (!burst.ok) return NextResponse.json({ ok: false }, { status: burst.status });

  let body: { weekKey?: string; event?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const weekKey = typeof body.weekKey === "string" && WEEK_RE.test(body.weekKey) ? body.weekKey : null;
  const event = typeof body.event === "string" && EVENTS.has(body.event) ? body.event : null;
  if (!weekKey || !event) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supa = getSupabaseAdmin();
  if (supa) {
    const { error } = await supa
      .from("marketing_engagement_events")
      .insert({ user_id: auth.userId, week_key: weekKey, event });
    if (error) console.warn("[marketing-engagement] insert failed:", error.message);
  }
  return NextResponse.json({ ok: true });
}
