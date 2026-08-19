/**
 * POST /api/account/apple-link  { authorizationCode }
 *
 * Sign in with Apple 직후(iOS) authorizationCode 를 refresh_token 으로 교환해 저장.
 * 목적 = 계정 삭제 시 Apple 토큰 revoke (App Store 5.1.1(v)). 로그인 흐름과 무관 — 실패해도 로그인은 유지.
 *
 * 인증: requireApiUser (Supabase 세션의 사용자 = 방금 Apple 로 로그인한 사용자)
 * 서버 미설정(APPLE_SIGNIN_* 없음)이면 { ok:true, skipped:true } — 클라이언트는 신경 안 씀.
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { envelopeEncrypt, isKekAvailable } from "../../_lib/envelope-crypto";
import { exchangeAuthorizationCode, isAppleSignInConfigured } from "../../_lib/apple-signin";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `apple-link:${auth.userId}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  if (!isAppleSignInConfigured()) return NextResponse.json({ ok: true, skipped: "not-configured" });
  if (!isKekAvailable()) {
    console.warn("[apple-link] KEK 미설정 — refresh_token 저장 불가");
    return NextResponse.json({ ok: true, skipped: "no-kek" });
  }

  let code = "";
  try {
    const body = (await request.json()) as { authorizationCode?: unknown };
    code = typeof body.authorizationCode === "string" ? body.authorizationCode.trim() : "";
  } catch { /* fallthrough */ }
  if (!code || code.length > 2048) return NextResponse.json({ ok: false, error: "authorizationCode required" }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  try {
    const { refreshToken, sub } = await exchangeAuthorizationCode(code);
    const enc = envelopeEncrypt(refreshToken);
    const { error } = await sb.from("apple_auth_tokens").upsert({
      user_id: auth.userId,
      refresh_token_enc: enc,
      apple_sub: sub,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      console.error("[apple-link] upsert 실패:", error.message);
      return NextResponse.json({ ok: false, error: "저장 실패" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    // 코드 만료(5분)·재사용 등 — 로그인엔 영향 없음
    console.warn("[apple-link] exchange 실패:", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ ok: false, error: "apple token exchange failed" }, { status: 502 });
  }
}
