import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getRequestId, logApiError } from "../../_lib/observability";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { fetchPopulationData } from "@build-up/shared";

export async function GET(request: Request) {
  const route = "/api/data/population";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = checkSimpleRateLimit({ key: `data-pop:${auth.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.MOIS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "MOIS_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  const url = new URL(request.url);
  try {
    const result = await fetchPopulationData(
      { apiKey, baseUrl: "" },
      {
        sido: url.searchParams.get("sido") ?? undefined,
        sigungu: url.searchParams.get("sigungu") ?? undefined,
        roadName: url.searchParams.get("roadName") ?? undefined,
        pageNo: url.searchParams.get("pageNo") ? Number(url.searchParams.get("pageNo")) : 1,
        numOfRows: url.searchParams.get("numOfRows") ? Number(url.searchParams.get("numOfRows")) : 50,
      }
    );
    return NextResponse.json(result, { headers: { "x-request-id": requestId, "Cache-Control": "public, max-age=86400" } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "인구 데이터 조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
