import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError } from "../../../_lib/observability";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { fetchCommercialTransactions } from "@build-up/shared";

export async function GET(request: Request) {
  const route = "/api/data/real-estate/transactions";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `data-realestate:${auth.userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.MOLIT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "MOLIT_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  const url = new URL(request.url);
  const lawdCd = url.searchParams.get("lawdCd");
  const dealYm = url.searchParams.get("dealYm");
  if (!lawdCd || !dealYm) return NextResponse.json({ error: "lawdCd, dealYm 필수" }, { status: 400 });

  try {
    const result = await fetchCommercialTransactions({ apiKey, baseUrl: "" }, { lawdCd, dealYm });
    return NextResponse.json(result, { headers: { "x-request-id": requestId, "Cache-Control": "public, max-age=86400" } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "부동산 실거래가 조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
