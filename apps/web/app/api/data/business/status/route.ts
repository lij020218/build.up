import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError } from "../../../_lib/observability";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { checkBusinessStatus } from "@build-up/shared";

export async function POST(request: Request) {
  const route = "/api/data/business/status";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = checkSimpleRateLimit({ key: `data-biz-status:${auth.userId}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.NTS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "NTS_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  try {
    const body = await request.json();
    const result = await checkBusinessStatus({ apiKey, baseUrl: "" }, body.businessNumbers ?? []);
    return NextResponse.json(result, { headers: { "x-request-id": requestId } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "사업자 상태조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
