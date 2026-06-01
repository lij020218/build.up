/**
 * POST /api/account/reset
 *
 * 사용자의 모든 가게/진행 데이터를 풀-와이프 (auth.users 본체는 유지 — 로그인 유지).
 * 구독·결제(foundone_subscriptions/payments)는 보존 — 계정 자체 삭제는 /api/account/delete.
 *
 * 인증: requireApiUserAllowAnon (데모 모드 사용자도 자기 데이터 초기화 허용)
 * 삭제 로직은 _lib/account-wipe.ts 의 wipeUserData 공유.
 */

import { NextResponse } from "next/server";
import { requireApiUserAllowAnon } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { wipeUserData } from "../../_lib/account-wipe";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const auth = await requireApiUserAllowAnon(request);
    if (!auth.ok) {
      console.warn("[/api/account/reset] auth failed:", auth.error);
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    // 분당 3회 — 실수 방지
    const rl = await checkSimpleRateLimit({
      key: `account-reset:${auth.userId}`, limit: 3, windowMs: 60_000,
      message: "잠시 후 다시 시도해 주세요.",
    });
    if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error("[/api/account/reset] getSupabaseAdmin returned null — service role key missing");
      return NextResponse.json({ ok: false, error: "DB 설정 오류 (service role key 미설정)" }, { status: 500 });
    }

    const { deleted, failures, totalDeleted } = await wipeUserData(supabase, auth.userId, {
      logPrefix: "[/api/account/reset]",
    });

    return NextResponse.json({ ok: failures.length === 0, deleted, failures, totalDeleted });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[/api/account/reset] FATAL — uncaught exception:", msg, error instanceof Error ? error.stack : undefined);
    return NextResponse.json({ ok: false, error: `서버 예외: ${msg}` }, { status: 500 });
  }
}
