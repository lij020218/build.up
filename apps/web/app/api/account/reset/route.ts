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
import { wipeUserData, isMissingTableError } from "../../_lib/account-wipe";

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

    // ── 초기화 표식 기록 — 다른 기기가 "이 시점 이후로 내 stale 데이터를 서버에 되살리지 말고
    //    따라 비워라"를 알 수 있게. account_reset_markers 는 USER_TABLES 에 없어 wipe 에 안 지워짐.
    //    핵심 삭제가 성공한 경우에만 표식(부분 실패로 핵심 데이터가 남았으면 표식 안 함). best-effort.
    const coreFailed = failures.some((f) =>
      f.table === "business_profiles" || f.table === "user_store_data" || f.table === "roadmaps",
    );
    let resetAt: string | null = null;
    if (!coreFailed) {
      try {
        const nowIso = new Date().toISOString();
        const { error: markerErr } = await supabase
          .from("account_reset_markers")
          .upsert({ user_id: auth.userId, reset_at: nowIso, updated_at: nowIso }, { onConflict: "user_id" });
        if (markerErr) {
          if (!isMissingTableError(markerErr.code, markerErr.message)) {
            console.warn("[/api/account/reset] reset marker upsert failed:", markerErr.message);
          }
        } else {
          resetAt = nowIso;
        }
      } catch (e) {
        console.warn("[/api/account/reset] reset marker exception:", (e as Error).message);
      }
    }

    return NextResponse.json({ ok: failures.length === 0, deleted, failures, totalDeleted, resetAt });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // 내부 오류 상세는 서버 로그에만 — 클라이언트엔 고정 문자열.
    console.error("[/api/account/reset] FATAL — uncaught exception:", msg, error instanceof Error ? error.stack : undefined);
    return NextResponse.json({ ok: false, error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
