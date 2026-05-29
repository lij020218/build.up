import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getRequestId, logApiError } from "../../_lib/observability";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { fetchTaxCalendarData } from "@foundone/shared";

export async function GET(request: Request) {
  const route = "/api/data/tax-calendar";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `data-tax:${auth.userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.NTS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "NTS_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  const url = new URL(request.url);
  try {
    const result = await fetchTaxCalendarData(
      { apiKey, baseUrl: "" },
      { taxType: url.searchParams.get("taxType") ?? undefined, page: 1, perPage: 100 }
    );
    return NextResponse.json(result, { headers: { "x-request-id": requestId, "Cache-Control": "public, max-age=604800" } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "세금 일정 조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
