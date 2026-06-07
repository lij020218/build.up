/**
 * GET /api/integrations/saas-metrics/ga4/callback?code=...&state=...
 *
 * Google OAuth redirect 수신:
 *   1. state 검증 (HMAC)
 *   2. code → refresh token 교환
 *   3. property 목록 조회 → 일단 첫 항목 자동 선택 (사장님이 나중에 변경 가능)
 *   4. saas_metrics_connections 에 봉투 암호화 후 upsert
 *   5. /profile 으로 redirect (success / error 쿼리)
 */
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";
import { envelopeEncrypt, isKekAvailable } from "../../../../_lib/envelope-crypto";
import {
  exchangeCodeForRefreshToken,
  listProperties,
  Ga4ApiError,
} from "../../../../_lib/ga4-client";
import { getEnvVar } from "../../../../_lib/env";

export const runtime = "nodejs";
export const maxDuration = 30;

function redirectWith(status: "ok" | "error", reason?: string): NextResponse {
  const base = getEnvVar("APP_BASE_URL") ?? "/";
  const url = new URL("/profile", base.startsWith("http") ? base : `http://localhost:3000${base}`);
  url.searchParams.set("ga4", status);
  if (reason) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) return redirectWith("error", errorParam);
  if (!code || !state) return redirectWith("error", "missing_code_or_state");

  // state 검증
  const parts = state.split("|");
  if (parts.length !== 3) return redirectWith("error", "bad_state");
  const [userId, nonce, hmac] = parts;
  // ⚠️ 2026-05-25 audit fix: 이전 `?? "fallback"` 은 환경 변수 누락 시 HMAC 위조 가능 (모든 공격자가
  //   "fallback" 으로 같은 HMAC 생성 → state 검증 우회). 환경 변수 없으면 명시적 에러 반환.
  const stateSecret = getEnvVar("GA4_STATE_SECRET") ?? getEnvVar("PORTONE_KEK_BASE64");
  if (!stateSecret) {
    console.error("[ga4/callback] GA4_STATE_SECRET / PORTONE_KEK_BASE64 모두 미설정 — state HMAC 검증 불가");
    return redirectWith("error", "server_misconfigured");
  }
  const expected = createHmac("sha256", stateSecret).update(`${userId}|${nonce}`).digest("hex").slice(0, 24);
  if (hmac !== expected) return redirectWith("error", "state_mismatch");

  // Nonce replay 방어 — ga4_oauth_nonces 에서 미사용·미만료 nonce 확인 후 즉시 소비(mark consumed).
  const supabaseForNonce = getSupabaseAdmin();
  if (supabaseForNonce) {
    const { data: nonceRow } = await supabaseForNonce
      .from("ga4_oauth_nonces")
      .select("nonce, consumed_at, expires_at")
      .eq("nonce", nonce)
      .eq("user_id", userId)
      .maybeSingle();

    if (!nonceRow) {
      // nonce 테이블이 아직 없거나 레코드가 없으면 경고만 (하위호환) — strict 모드로 전환 시 거부로 변경
      console.warn("[ga4/callback] nonce not found in DB — skipping replay check (migrate ga4_oauth_nonces table first)");
    } else if (nonceRow.consumed_at) {
      console.error(`[ga4/callback] Nonce replay attempt: nonce=${nonce} userId=${userId}`);
      return redirectWith("error", "nonce_replayed");
    } else if (new Date(nonceRow.expires_at) < new Date()) {
      return redirectWith("error", "nonce_expired");
    } else {
      // 소비 처리 — 이후 재사용 불가
      await supabaseForNonce
        .from("ga4_oauth_nonces")
        .update({ consumed_at: new Date().toISOString() })
        .eq("nonce", nonce);
    }
  }

  if (!isKekAvailable(1)) return redirectWith("error", "kek_missing");

  let refreshToken: string;
  try {
    const tokens = await exchangeCodeForRefreshToken(code);
    refreshToken = tokens.refreshToken;
  } catch (e) {
    return redirectWith("error", e instanceof Ga4ApiError ? e.code : "token_exchange_failed");
  }

  // 첫 property 자동 선택 (사장님이 UI 에서 변경 가능)
  let property = "";
  let propertyLabel = "";
  try {
    const props = await listProperties(refreshToken);
    if (props.length > 0) {
      property = props[0].property;
      propertyLabel = `${props[0].accountName} — ${props[0].displayName}`;
    }
  } catch (e) {
    console.warn("[ga4/callback] listProperties failed:", e);
  }

  const enc = envelopeEncrypt(refreshToken, 1);
  const supabase = getSupabaseAdmin();
  if (!supabase) return redirectWith("error", "db_misconfigured");

  const { error } = await supabase.from("saas_metrics_connections").upsert(
    {
      user_id: userId,
      source: "ga4",
      encrypted_secret: enc.encryptedSecret,
      secret_iv: enc.secretIv,
      secret_auth_tag: enc.secretAuthTag,
      encrypted_dek: enc.encryptedDek,
      dek_iv: enc.dekIv,
      dek_auth_tag: enc.dekAuthTag,
      kek_version: enc.kekVersion,
      property_id: property || null,
      property_label: propertyLabel || null,
      status: "active",
      last_sync_error: null,
    },
    { onConflict: "user_id,source" },
  );
  if (error) {
    console.error("[ga4/callback] upsert", error);
    return redirectWith("error", "db_save_failed");
  }

  return redirectWith("ok");
}
