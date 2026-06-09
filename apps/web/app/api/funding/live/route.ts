import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { getMergedFundingPrograms } from "../../_lib/funding-live";

export const runtime = "nodejs";

/**
 * GET /api/funding/live
 *
 * 기업마당(bizinfo) + K-Startup 라이브 공고 + 큐레이션 병합 결과.
 *  - 키 없거나 라이브 실패 → 큐레이션만 graceful 200(출시 차단 X).
 *  - 응답: { programs: StartupProgram[], live: boolean, fetchedAt }
 */
export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `funding-live:${auth.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const { programs, live, at } = await getMergedFundingPrograms();
  return NextResponse.json(
    { programs, live, fetchedAt: new Date(at).toISOString() },
    { headers: { "Cache-Control": "private, max-age=600" } },
  );
}
