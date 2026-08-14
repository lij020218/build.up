import { NextResponse } from "next/server";
import { getCronSecret } from "../../_lib/env";
import { timingSafeEqualStr } from "../../_lib/timing-safe";
import { rebuildAndStoreFundingSnapshot, storeFundingSnapshotFromRawItems } from "../../_lib/funding-live";

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

/**
 * POST — 두 모드:
 *  · body 에 { items: [...K-Startup 원본 레코드] } 가 있으면 **릴레이 저장**: 한국 IP 환경
 *    (로컬 맥 launchd, scripts/funding-live-relay.mjs)이 수집한 원본을 서버가 SSOT 매핑·정규화해
 *    스냅샷 저장. (2026-08-14: data.go.kr 게이트웨이의 클라우드 IP 차단 우회 경로)
 *  · body 없거나 items 아님 → 기존 수동 트리거(GET 동일: 서버 직접 페치 시도).
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const t0 = Date.now();
  const body = await request.json().catch(() => null);
  if (body && Array.isArray(body.items)) {
    const result = await storeFundingSnapshotFromRawItems(body.items);
    return NextResponse.json({
      ok: result.stored,
      mode: "relay",
      received: body.items.length,
      count: result.count,
      stored: result.stored,
      ms: Date.now() - t0,
    });
  }
  const result = await rebuildAndStoreFundingSnapshot();
  return NextResponse.json({
    ok: result.stored,
    count: result.count,
    live: result.live,
    stored: result.stored,
    ...(result.error ? { error: result.error } : {}),
    ms: Date.now() - t0,
  });
}
