import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getRequestId, logApiError } from "../../_lib/observability";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { fetchSemasMarketData } from "@build-up/shared";
import type { SemasMarketParams } from "@build-up/shared";

export async function GET(request: Request) {
  const route = "/api/data/market";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = checkSimpleRateLimit({
    key: `data-market:${auth.userId}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  const apiKey = process.env.SEMAS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "상권 데이터 API가 설정되지 않았습니다. SEMAS_API_KEY 환경변수를 확인하세요." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const params: SemasMarketParams = {
    divId: (url.searchParams.get("divId") as "adongCd") ?? undefined,
    key: url.searchParams.get("key") ?? undefined,
    indsLclsCd: url.searchParams.get("indsLclsCd") ?? undefined,
    pageNo: url.searchParams.get("pageNo") ? Number(url.searchParams.get("pageNo")) : 1,
    numOfRows: url.searchParams.get("numOfRows") ? Number(url.searchParams.get("numOfRows")) : 20,
  };

  try {
    const result = await fetchSemasMarketData(
      { apiKey, baseUrl: "" },
      params
    );

    return NextResponse.json(result, {
      headers: {
        "x-request-id": requestId,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    logApiError(route, "fetch_failed", error, {
      requestId,
      userId: auth.userId,
      status: 502,
    });
    return NextResponse.json(
      { error: "상권 데이터 조회 중 오류가 발생했습니다.", detail: error instanceof Error ? error.message : "" },
      { status: 502, headers: { "x-request-id": requestId } }
    );
  }
}
