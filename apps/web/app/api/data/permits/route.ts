import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getRequestId, logApiError } from "../../_lib/observability";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { fetchLocaldataPermits } from "@build-up/shared";

export async function GET(request: Request) {
  const route = "/api/data/permits";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = checkSimpleRateLimit({ key: `data-permits:${auth.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.LOCALDATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "LOCALDATA_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  const url = new URL(request.url);
  try {
    const result = await fetchLocaldataPermits(
      { apiKey, baseUrl: "" },
      {
        opnSvcId: url.searchParams.get("opnSvcId") ?? undefined,
        localCode: url.searchParams.get("localCode") ?? undefined,
        pageIndex: url.searchParams.get("pageIndex") ? Number(url.searchParams.get("pageIndex")) : 1,
        pageSize: url.searchParams.get("pageSize") ? Number(url.searchParams.get("pageSize")) : 50,
      }
    );
    return NextResponse.json(result, { headers: { "x-request-id": requestId, "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "인허가 데이터 조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
