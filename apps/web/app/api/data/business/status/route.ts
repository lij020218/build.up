import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError } from "../../../_lib/observability";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { checkBusinessStatus, isValidBizNumber, normalizeBizNumber } from "@foundone/shared";

export async function POST(request: Request) {
  const route = "/api/data/business/status";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `data-biz-status:${auth.userId}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  const apiKey = process.env.NTS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "NTS_API_KEY 환경변수를 확인하세요." }, { status: 500 });

  try {
    const body = await request.json();
    // 입력 검증 — 비배열이면 .map 크래시(502 위장), 무제한 배열이면 임의번호 대량조회 통로
    const nums = Array.isArray(body?.businessNumbers)
      ? body.businessNumbers.filter((n: unknown): n is string => typeof n === "string").slice(0, 10)
      : [];
    // 체크섬 사전 필터 (2026-08-03 shared 승격) — 형식 오류를 국세청 호출·"미등록" 오판 전에 차단
    const invalid = nums.filter((n: string) => !isValidBizNumber(normalizeBizNumber(n)));
    if (nums.length > 0 && invalid.length === nums.length) {
      return NextResponse.json({ error: "사업자등록번호 형식이 올바르지 않습니다 (체크섬 불일치)." }, { status: 400 });
    }
    if (nums.length === 0) {
      return NextResponse.json({ error: "businessNumbers 배열이 필요합니다." }, { status: 400 });
    }
    const result = await checkBusinessStatus({ apiKey, baseUrl: "" }, nums);
    return NextResponse.json(result, { headers: { "x-request-id": requestId } });
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, userId: auth.userId, status: 502 });
    return NextResponse.json({ error: "사업자 상태조회 실패", detail: error instanceof Error ? error.message : "" }, { status: 502 });
  }
}
