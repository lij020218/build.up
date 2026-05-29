import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError } from "../../../_lib/observability";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { fetchRegionalSales } from "@foundone/shared";

export async function GET(request: Request) {
  const route = "/api/data/franchise/regional-sales";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `data-regional-sales:${auth.userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.KFTC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "KFTC_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  const url = new URL(request.url);
  try {
    const result = await fetchRegionalSales(
      { apiKey, baseUrl: "" },
      {
        year: url.searchParams.get("year") ?? undefined,
        industryCode: url.searchParams.get("industryCode") ?? undefined,
        regionCode: url.searchParams.get("regionCode") ?? undefined,
        pageNo: url.searchParams.get("pageNo") ? Number(url.searchParams.get("pageNo")) : 1,
      }
    );
    return NextResponse.json(result, { headers: { "x-request-id": requestId, "Cache-Control": "public, max-age=86400" } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "지역별 매출 조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
