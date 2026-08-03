import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError } from "../../../_lib/observability";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { verifyBusinessRegistration } from "@foundone/shared";

export async function POST(request: Request) {
  const route = "/api/data/business/verify";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `data-biz-verify:${auth.userId}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.NTS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "NTS_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  try {
    const body = await request.json();
    // 입력 검증 (2026-08-03 하드닝) — status 라우트와 동일 규율: 비배열 = .map 크래시 방지, 상한 10
    const businesses = (Array.isArray(body?.businesses) ? body.businesses : [])
      .filter((b: unknown): b is Record<string, unknown> => !!b && typeof b === "object")
      .slice(0, 10);
    if (businesses.length === 0) {
      return NextResponse.json({ error: "businesses 배열이 필요합니다." }, { status: 400 });
    }
    const result = await verifyBusinessRegistration({ apiKey, baseUrl: "" }, businesses as never);
    return NextResponse.json(result, { headers: { "x-request-id": requestId } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "사업자 진위확인 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
