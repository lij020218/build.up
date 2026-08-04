import { NextResponse } from "next/server";
import { getCronSecret } from "../../_lib/env";
import { timingSafeEqualStr } from "../../_lib/timing-safe";
import { rebuildAndStoreFundingSnapshot } from "../../_lib/funding-live";

/**
 * /api/cron/funding-live — K-Startup 라이브 공고를 미리 페치해 Supabase 스냅샷에 저장.
 *
 *  사용자 경로(/api/funding/live·/api/funding/match)는 이 스냅샷만 읽어 즉시 응답하므로,
 *  data.go.kr 인라인 호출(~10초)이 사용자에게 노출되지 않는다. 6시간마다 실행(vercel.json).
 *
 *  인증: Vercel cron 의 Authorization: Bearer <CRON_SECRET>. (수동 호출 방어 동일)
 */
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const secret = getCronSecret();
  if (!secret) return false;
  return timingSafeEqualStr(token, secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const t0 = Date.now();
  const result = await rebuildAndStoreFundingSnapshot();
  return NextResponse.json({
    ok: result.stored,
    count: result.count,
    live: result.live,
    stored: result.stored,
    // 실패 사유 노출 (2026-08-04 실사고: 사유 없는 count:0 이 이틀간 침묵) — Vercel 로그 진단용
    ...(result.error ? { error: result.error } : {}),
    ms: Date.now() - t0,
  });
}

/** 수동 트리거(배포 직후 즉시 시드)용 POST — 동일 동작. */
export async function POST(request: Request) {
  return GET(request);
}
