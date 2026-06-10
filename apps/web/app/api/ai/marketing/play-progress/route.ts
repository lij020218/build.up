/**
 * 마케팅 플레이 실행 체크 ("했어요") — 실행→측정 피드백 루프.
 *
 *   GET  /api/ai/marketing/play-progress?weekKey=YYYY-Www  → { done: string[] } (이번 주 완료 제목)
 *   POST /api/ai/marketing/play-progress { weekKey, playTitle, done } → 체크/해제
 *
 * 저장: marketing_play_progress (RLS 본인). 웹/iOS 동일 체크 상태.
 * 다음 주 cases 엔진이 지난주 완료 제목을 읽어 "이어서" 추천(중복 회피).
 */
import { NextResponse } from "next/server";
import { requireApiUser, getUserScopedClient } from "../../../_lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEEK_RE = /^\d{4}-W\d{2}$/;

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const weekKey = new URL(request.url).searchParams.get("weekKey") ?? "";
  if (!WEEK_RE.test(weekKey)) return NextResponse.json({ error: "weekKey 형식 오류" }, { status: 400 });

  const client = getUserScopedClient(request);
  if (!client) return NextResponse.json({ error: "세션 오류" }, { status: 401 });

  const { data, error } = await client
    .from("marketing_play_progress")
    .select("play_title")
    .eq("week_key", weekKey);
  if (error) {
    console.error("[play-progress GET] failed:", error.message);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, done: (data ?? []).map((r) => (r as { play_title: string }).play_title) });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { weekKey?: string; playTitle?: string; done?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const weekKey = typeof body.weekKey === "string" ? body.weekKey : "";
  const playTitle = typeof body.playTitle === "string" ? body.playTitle.trim().slice(0, 120) : "";
  if (!WEEK_RE.test(weekKey) || !playTitle) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const client = getUserScopedClient(request);
  if (!client) return NextResponse.json({ error: "세션 오류" }, { status: 401 });

  if (body.done === false) {
    const { error } = await client
      .from("marketing_play_progress")
      .delete()
      .eq("week_key", weekKey)
      .eq("play_title", playTitle);
    if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    return NextResponse.json({ ok: true, done: false });
  }

  const { error } = await client
    .from("marketing_play_progress")
    .upsert({ user_id: auth.userId, week_key: weekKey, play_title: playTitle }, { onConflict: "user_id,week_key,play_title" });
  if (error) {
    console.error("[play-progress POST] failed:", error.message);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, done: true });
}
