import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getRequestId, logApiError } from "../../_lib/observability";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { fetchBuildingRegistry } from "@foundone/shared";

export async function GET(request: Request) {
  const route = "/api/data/building";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `data-building:${auth.userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.MOLIT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "MOLIT_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  const url = new URL(request.url);
  const sigunguCd = url.searchParams.get("sigunguCd");
  const bjdongCd = url.searchParams.get("bjdongCd");
  if (!sigunguCd || !bjdongCd) return NextResponse.json({ error: "sigunguCd, bjdongCd 필수" }, { status: 400 });

  try {
    const result = await fetchBuildingRegistry(
      { apiKey, baseUrl: "" },
      {
        sigunguCd,
        bjdongCd,
        bun: url.searchParams.get("bun") ?? undefined,
        ji: url.searchParams.get("ji") ?? undefined,
      }
    );
    return NextResponse.json(result, { headers: { "x-request-id": requestId, "Cache-Control": "public, max-age=86400" } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "건축물대장 조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
