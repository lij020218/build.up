import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getRequestId, logApiError } from "../../_lib/observability";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { fetchKftcFranchiseData } from "@build-up/shared";
import type { KftcFranchiseParams } from "@build-up/shared";

export async function GET(request: Request) {
  const route = "/api/data/franchise";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = checkSimpleRateLimit({
    key: `data-franchise:${auth.userId}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  const apiKey = process.env.KFTC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "프랜차이즈 데이터 API가 설정되지 않았습니다. KFTC_API_KEY 환경변수를 확인하세요." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const params: KftcFranchiseParams = {
    brdNm: url.searchParams.get("brandName") ?? undefined,
    indutyLclsCd: url.searchParams.get("industryCode") ?? undefined,
    yr: url.searchParams.get("year") ?? undefined,
    pageNo: url.searchParams.get("pageNo") ? Number(url.searchParams.get("pageNo")) : 1,
    numOfRows: url.searchParams.get("numOfRows") ? Number(url.searchParams.get("numOfRows")) : 20,
  };

  try {
    const result = await fetchKftcFranchiseData(
      { apiKey, baseUrl: "" },
      params
    );

    return NextResponse.json(result, {
      headers: {
        "x-request-id": requestId,
        "Cache-Control": "public, max-age=86400", // 프랜차이즈 데이터는 1일 캐시
      },
    });
  } catch (error) {
    logApiError(route, "fetch_failed", error, {
      requestId,
      userId: auth.userId,
      status: 502,
    });
    return NextResponse.json(
      { error: "프랜차이즈 데이터 조회 중 오류가 발생했습니다.", detail: error instanceof Error ? error.message : "" },
      { status: 502, headers: { "x-request-id": requestId } }
    );
  }
}
