/**
 * POST /api/integrations/portone/connect
 *
 * 사장님이 입력한 포트원 V2 API Secret 을:
 *   1. 가벼운 호출 1회로 검증 (GET /payments size=1)
 *   2. 봉투 암호화 (AES-256-GCM + per-user DEK + KEK from env)
 *   3. portone_connections 테이블에 upsert
 *
 * Read-only 강제: PortOneClient 가 GET 메서드만 호출 가능.
 * Secret 평문은 우리 서버 디스크/로그/DB 어디에도 남지 않음.
 *
 * Request body:
 *   { apiSecret: string, storeId?: string }
 *
 * Response:
 *   { ok: true, status: "active", maskedSecret: string }  → 연결 성공
 *   { ok: false, error: string, code?: string }            → 검증 실패 / 저장 실패
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeEncrypt, isKekAvailable, maskSecret } from "../../../_lib/envelope-crypto";
import { PortOneClient, PortOneApiError } from "../../../_lib/portone-client";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  // 1. 인증
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  // 2. Rate limit (분당 5회 — 무차별 키 검증 방지)
  const rl = checkSimpleRateLimit({
    key: `portone-connect:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요.",
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });
  }

  // 3. KEK 사용 가능 확인
  if (!isKekAvailable(1)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "서버 암호화 키가 설정되지 않았습니다. 관리자에게 문의해 주세요. " +
          "(env: PORTONE_KEK_BASE64)",
        code: "KEK_MISSING",
      },
      { status: 500 }
    );
  }

  // 4. Body 파싱
  let body: { apiSecret?: string; storeId?: string };
  try {
    body = (await request.json()) as { apiSecret?: string; storeId?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }
  const apiSecret = (body.apiSecret ?? "").trim();
  const storeId = body.storeId?.trim() || undefined;
  if (!apiSecret || apiSecret.length < 20) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "API Secret 형식이 올바르지 않습니다. 포트원 콘솔 → 결제연동 → API Keys 에서 V2 Secret 을 발급받으세요.",
        code: "INVALID_FORMAT",
      },
      { status: 400 }
    );
  }

  // 5. 검증 호출 (read-only GET 1회)
  const client = new PortOneClient({ apiSecret, storeId });
  let validation: Awaited<ReturnType<typeof client.validate>>;
  try {
    validation = await client.validate();
  } catch (e) {
    if (e instanceof PortOneApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: humanizePortOneError(e),
          code: e.errorType,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "포트원 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        code: "NETWORK_ERROR",
      },
      { status: 502 }
    );
  }

  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: validation.testCallStatus === 401
          ? "Secret 이 유효하지 않거나 권한이 없습니다. 포트원 콘솔에서 새로 발급해 주세요."
          : `포트원 검증 실패 (HTTP ${validation.testCallStatus})`,
        code: "VALIDATION_FAILED",
      },
      { status: 400 }
    );
  }

  // 6. 봉투 암호화
  let enveloped;
  try {
    enveloped = envelopeEncrypt(apiSecret, 1);
  } catch (e) {
    console.error("[portone/connect] envelope encrypt failed", e);
    return NextResponse.json(
      { ok: false, error: "암호화 실패", code: "ENCRYPTION_FAILED" },
      { status: 500 }
    );
  }

  // 7. Supabase upsert (service_role)
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "데이터베이스 설정 오류 (SUPABASE_SERVICE_ROLE_KEY)", code: "DB_CONFIG" },
      { status: 500 }
    );
  }

  const masked = maskSecret(apiSecret);
  const { error: dbErr } = await supabase
    .from("portone_connections")
    .upsert(
      {
        user_id: auth.userId,
        store_id: storeId ?? null,
        encrypted_secret: enveloped.encryptedSecret,
        secret_iv: enveloped.secretIv,
        secret_auth_tag: enveloped.secretAuthTag,
        encrypted_dek: enveloped.encryptedDek,
        dek_iv: enveloped.dekIv,
        dek_auth_tag: enveloped.dekAuthTag,
        kek_version: enveloped.kekVersion,
        secret_mask: masked,
        status: "active",
        last_validated_at: new Date().toISOString(),
        last_sync_error: null,
      },
      { onConflict: "user_id" }
    );

  if (dbErr) {
    console.error("[portone/connect] db upsert failed", dbErr);
    return NextResponse.json(
      { ok: false, error: "연결 정보 저장 실패", code: "DB_WRITE" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: "active",
    maskedSecret: masked,
    sampleCount: validation.sampleCount,
    message:
      validation.sampleCount > 0
        ? `연결 성공! 최근 24시간 결제 ${validation.sampleCount}건 확인.`
        : "연결 성공! 아직 최근 24시간 결제가 없어요.",
  });
}

// ─── 에러 메시지 한국화 ─────────────────────────────────────────────────

function humanizePortOneError(e: PortOneApiError): string {
  if (e.status === 401 || e.errorType === "UNAUTHORIZED") {
    return "Secret 인증 실패 — 포트원 콘솔에서 V2 Secret 을 다시 확인해 주세요. (V1 키는 호환 안 됨)";
  }
  if (e.status === 403 || e.errorType === "FORBIDDEN") {
    return "Secret 의 권한이 부족합니다. Owner/Admin 계정으로 발급된 V2 Secret 이어야 합니다.";
  }
  if (e.errorType === "TIMEOUT") {
    return "포트원 서버 응답 시간 초과. 잠시 후 다시 시도해 주세요.";
  }
  return `포트원 API 오류 (${e.errorType}): ${e.message}`;
}
