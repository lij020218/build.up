import { NextResponse } from "next/server";
import {
  getCronSecret,
  getOpenAIApiKey,
  getTavilyApiKey,
} from "../../_lib/env";
import { timingSafeEqualStr } from "../../_lib/timing-safe";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { buildWeeklyMemePack, getMemeWeekKey } from "../../_lib/marketing-memes";

/**
 * 매일 08:00 KST (23:00 UTC) Vercel cron 실행 — 주간 밈·챌린지 팩 수집.
 *
 * 경로가 "marketing-trends" 인 이유(2026-08-03 정리):
 *  원래 이 cron 은 20개 트렌드 그룹 × 2언어의 마케팅 트렌드를 생성해
 *  marketing_trend_cache 에 fan-out 저장했다. 그 트렌드를 읽던
 *  /api/ai/marketing/trends 라우트가 UI 에서 제거되어(호출자 0) 트렌드 생성
 *  루프를 삭제했고, 같은 라우트에 얹혀 있던 밈팩 수집만 남겼다.
 *  경로를 바꾸면 vercel.json cron 등록과 동시 배포가 필요해 유지한다.
 *
 * 흐름:
 * 1. CRON_SECRET 검증 (Vercel cron은 Authorization: Bearer <CRON_SECRET> 자동 첨부)
 * 2. 주 1회 전체 수집 + 매일 증분 top-up (marketing-memes.ts 참고)
 */

export const runtime = "nodejs";
export const maxDuration = 300; // 5분 (Vercel Pro 최대). Hobby면 10초로 강등됨.

function isAuthorized(request: Request): boolean {
  // Vercel cron은 Authorization: Bearer <CRON_SECRET>을 자동으로 보냄
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

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);

  const report = {
    memePack: null as null | { weekKey: string; status: string; itemCount: number; error?: string },
    failed: [] as Array<{ group: string; error: string }>,
  };

  // ── 밈·챌린지 팩 (2026-07-24 신설 · 2026-08-03 일간 top-up) ──
  // 주 1회 전체 수집 + 매일 증분: 이번 주 팩이 있으면 최근 7일 신규 URL 만 가볍게 수집해
  // addedAt 찍어 추가(topped-up). 신규 없으면 LLM 호출 없이 exists. ?memes=force 로 강제 재수집 가능.
  // 소스 = 업자용 화이트리스트(고구마팜·캐릿 등). 수집 3개 미만이면 저장 안 함 → 서빙이 지난주/시드 폴백.
  const openaiKey = getOpenAIApiKey();
  const tavilyKey = getTavilyApiKey();
  const memeForce = url.searchParams.get("memes") === "force";
  const weekKey = getMemeWeekKey();
  if (openaiKey && tavilyKey) {
    const r = await buildWeeklyMemePack(supabase, { openaiKey, tavilyKey, weekKey, force: memeForce });
    report.memePack = { weekKey, ...r };
    if (r.status === "error") {
      report.failed.push({ group: "meme-pack", error: r.error ?? "unknown" });
    }
  } else {
    report.memePack = { weekKey, status: "skipped-no-keys", itemCount: 0 };
  }

  return NextResponse.json({
    ok: report.failed.length === 0,
    ...report,
  });
}

/** 수동 트리거를 위한 POST — 동일 동작. */
export async function POST(request: Request) {
  return GET(request);
}
