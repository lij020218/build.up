/**
 * GET /api/integrations/portone/daily?fromDays=30
 *
 * 사장님의 PortOne 매출을 일별 집계로 반환.
 * 대시보드 매출 흐름 카드가 호출 → 자동 입력된 매출로 표시.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { getPortOneDailyEntries } from "../../../_lib/portone-revenue-bridge";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const rl = checkSimpleRateLimit({
    key: `portone-daily:${auth.userId}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });
  }

  const url = new URL(request.url);
  const fromDays = Number(url.searchParams.get("fromDays") ?? "30");
  const safeDays = Number.isFinite(fromDays) && fromDays > 0 && fromDays <= 365 ? fromDays : 30;
  const from = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const entries = await getPortOneDailyEntries(supabase, auth.userId, { from });
    return NextResponse.json({
      ok: true,
      entries,
      range: { fromDays: safeDays },
    }, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
