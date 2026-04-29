import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { getTossPlaceDailyEntries } from "../../../_lib/tossplace-revenue-bridge";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const rl = checkSimpleRateLimit({ key: `tossplace-daily:${auth.userId}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const url = new URL(request.url);
  const fromDays = Number(url.searchParams.get("fromDays") ?? "30");
  const safeDays = Number.isFinite(fromDays) && fromDays > 0 && fromDays <= 365 ? fromDays : 30;
  const from = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const entries = await getTossPlaceDailyEntries(supabase, auth.userId, { from });
    return NextResponse.json(
      { ok: true, entries, range: { fromDays: safeDays } },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
