/**
 * /api/coaching-history
 *
 *  GET  ?days=14    — 최근 N일 entry + 14d 통계 + (있으면) 30d 메타 인사이트
 *  POST { date, brief, signal, response? } — upsert (한 날·한 brief 당 1개)
 *
 * 사장님 lock-in moat 핵심 — localStorage 보다 영구 보관 (다중 디바이스 + 캐시
 * 청소 안전). RLS 본인 select/insert/update 만, delete 는 service_role 만.
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "../_lib/auth";
import { getSupabaseAdmin } from "../_lib/supabase-admin";

export const runtime = "nodejs";

type Body = {
  date: string;
  brief: "offline" | "startup";
  signal: {
    kind: "critical" | "important" | "notable" | "good";
    headline: string;
    action: string;
  };
  response?: {
    taken: boolean;
    note?: string | null;
    takenAt?: string | null;
  };
};

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("days") ?? "14", 10) || 14));

  const supa = getSupabaseAdmin();
  if (!supa) return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const [entriesRes, statsRes, metaRes] = await Promise.all([
    supa
      .from("coaching_history")
      .select("date, brief, signal_kind, signal_headline, signal_action, response_taken, response_note, response_taken_at")
      .eq("user_id", auth.userId)
      .gte("date", cutoffStr)
      .order("date", { ascending: false }),
    supa
      .from("v_coaching_stats_14d")
      .select("total_days, actions_taken, critical_signals, important_signals, good_signals, taken_rate_pct")
      .eq("user_id", auth.userId)
      .maybeSingle(),
    supa
      .from("v_coaching_meta_30d")
      .select("days_30, critical_taken_rate, weekend_days, weekend_actions, most_common_kind, recent_critical_7d")
      .eq("user_id", auth.userId)
      .maybeSingle(),
  ]);

  if (entriesRes.error) {
    // 테이블/뷰 미존재(마이그레이션 미적용) 등 → 500 대신 graceful empty.
    //   대시보드가 안 깨지고, 콘솔 500 도배도 방지(메모리 규칙: 500 throw 금지·graceful empty).
    console.warn("[coaching-history] GET 실패 — graceful empty:", entriesRes.error.message);
    return NextResponse.json({ ok: true, entries: [], stats14d: null, meta30d: null });
  }

  const entries = (entriesRes.data ?? []).map((r) => ({
    date: r.date,
    brief: r.brief,
    signal: {
      kind: r.signal_kind,
      headline: r.signal_headline,
      action: r.signal_action,
    },
    response: r.response_taken == null
      ? undefined
      : {
          taken: r.response_taken,
          note: r.response_note ?? undefined,
          takenAt: r.response_taken_at ?? undefined,
        },
  }));

  return NextResponse.json({
    ok: true,
    entries,
    stats14d: statsRes.data ?? null,
    meta30d: metaRes.data ?? null,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // validate
  if (
    !body.date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
    !["offline", "startup"].includes(body.brief) ||
    !body.signal ||
    !["critical", "important", "notable", "good"].includes(body.signal.kind) ||
    typeof body.signal.headline !== "string" ||
    typeof body.signal.action !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const supa = getSupabaseAdmin();
  if (!supa) return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });

  // upsert (한 날·한 brief 당 1개)
  const { error } = await supa
    .from("coaching_history")
    .upsert(
      {
        user_id: auth.userId,
        date: body.date,
        brief: body.brief,
        signal_kind: body.signal.kind,
        signal_headline: body.signal.headline.slice(0, 500),
        signal_action: body.signal.action.slice(0, 1000),
        response_taken: body.response?.taken ?? null,
        response_note: body.response?.note ?? null,
        response_taken_at: body.response?.takenAt ?? null,
      },
      { onConflict: "user_id,date,brief" },
    );

  if (error) {
    // 저장 실패(테이블 미존재 등)는 best-effort — 500 대신 200 ok:false 로 비치명 처리.
    console.warn("[coaching-history] POST 실패 — 비치명 처리:", error.message);
    return NextResponse.json({ ok: false, error: "saved-later" });
  }

  return NextResponse.json({ ok: true });
}
