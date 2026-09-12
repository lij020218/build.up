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
 * 매일 08:00 KST (23:00 UTC) Vercel cron 실행 — 밈·챌린지 팩 수집.
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
 * 2. 매체 RSS 최신 글 중 **아직 소개하지 않은 것**만 수집 → 새 글 없으면 LLM 호출 0
 *    (2026-09-12 재설계: Tavily 검색 주력 → RSS 주력. marketing-memes.ts 상단 주석 참고)
 *
 * 키 요건: OPENAI_API_KEY 필수(구조화). TAVILY_API_KEY 는 RSS 없는 매체(캐릿·위픽레터) 보조용으로 선택.
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

  // ── 밈·챌린지 팩 (2026-07-24 신설 · 2026-09-12 RSS 기반 재설계) ──
  // 매일 실행: 최근 8주에 소개한 링크를 제외하고 매체 RSS 최신 글만 수집 → 새 글 없으면 LLM 호출 0.
  // ?memes=force 로 중복 제거를 끄고 강제 재수집. 이번 주 팩이 없고 결과 3개 미만이면 저장 안 함
  // → 서빙이 지난주/시드로 폴백(없는 걸 있는 척하지 않는다).
  const openaiKey = getOpenAIApiKey();
  const tavilyKey = getTavilyApiKey();   // 선택 — RSS 가 없는 매체(캐릿·위픽레터·maily) 보조 검색용
  const memeForce = url.searchParams.get("memes") === "force";
  const weekKey = getMemeWeekKey();
  if (openaiKey) {
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
