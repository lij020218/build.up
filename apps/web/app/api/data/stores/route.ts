import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getRequestId, logApiError } from "../../_lib/observability";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { fetchSemasStores } from "@foundone/shared";

export async function GET(request: Request) {
  const route = "/api/data/stores";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `data-stores:${auth.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.SEMAS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "SEMAS_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  const url = new URL(request.url);
  try {
    const result = await fetchSemasStores(
      { apiKey, baseUrl: "" },
      {
        divId: (url.searchParams.get("divId") as "ctprvnCd" | "signguCd" | "adongCd") ?? undefined,
        key: url.searchParams.get("key") ?? undefined,
        indsLclsCd: url.searchParams.get("indsLclsCd") ?? undefined,
        indsMclsCd: url.searchParams.get("indsMclsCd") ?? undefined,
        indsSclsCd: url.searchParams.get("indsSclsCd") ?? undefined,
        pageNo: url.searchParams.get("pageNo") ? Number(url.searchParams.get("pageNo")) : 1,
        numOfRows: url.searchParams.get("numOfRows") ? Number(url.searchParams.get("numOfRows")) : 20,
      }
    );
    return NextResponse.json(result, { headers: { "x-request-id": requestId, "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "상가 데이터 조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
