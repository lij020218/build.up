/**
 * POST /api/integrations/tossplace/connect
 * Body: { accessKey, accessSecret, merchantId }
 * 검증 + 봉투 암호화 + tossplace_connections upsert.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";
import { envelopeEncrypt, isKekAvailable } from "../../../_lib/envelope-crypto";
import { TossPlaceClient, TossPlaceApiError } from "../../../_lib/tossplace-client";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({ key: `tossplace-connect:${auth.userId}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  if (!isKekAvailable(1)) {
    return NextResponse.json({ ok: false, error: "서버 암호화 키 미설정 (PORTONE_KEK_BASE64)", code: "KEK_MISSING" }, { status: 500 });
  }

  let body: { accessKey?: string; accessSecret?: string; merchantId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  const accessKey = (body.accessKey ?? "").trim();
  const accessSecret = (body.accessSecret ?? "").trim();
  const merchantId = (body.merchantId ?? "").trim();

  if (!accessKey || accessKey.length < 10) {
    return NextResponse.json({ ok: false, error: "Access Key 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (!accessSecret || accessSecret.length < 20) {
    return NextResponse.json({ ok: false, error: "Access Secret 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (!merchantId || merchantId.length < 4) {
    return NextResponse.json({ ok: false, error: "매장 ID 가 필요합니다." }, { status: 400 });
  }

  // 검증 호출 (read-only GET 1회)
  const client = new TossPlaceClient({ accessKey, accessSecret, merchantId });
  let validation;
  try {
    validation = await client.validate();
  } catch (e) {
    if (e instanceof TossPlaceApiError) {
      return NextResponse.json(
        { ok: false, error: humanize(e), code: e.errorCode },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: false, error: "TOSS Place 서버 연결 실패" }, { status: 502 });
  }

  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: validation.testCallStatus === 401
          ? "Access Key/Secret 또는 권한 오류 — 개발자센터에서 다시 확인해 주세요."
          : `검증 실패 (HTTP ${validation.testCallStatus})`,
      },
      { status: 400 }
    );
  }

  // 봉투 암호화
  let enveloped;
  try {
    enveloped = envelopeEncrypt(accessSecret, 1);
  } catch (e) {
    console.error("[tossplace/connect] encrypt failed", e);
    return NextResponse.json({ ok: false, error: "암호화 실패" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { error } = await supabase.from("tossplace_connections").upsert(
    {
      user_id: auth.userId,
      merchant_id: merchantId,
      access_key: accessKey,
      encrypted_secret: enveloped.encryptedSecret,
      secret_iv: enveloped.secretIv,
      secret_auth_tag: enveloped.secretAuthTag,
      encrypted_dek: enveloped.encryptedDek,
      dek_iv: enveloped.dekIv,
      dek_auth_tag: enveloped.dekAuthTag,
      kek_version: enveloped.kekVersion,
      status: "active",
      last_validated_at: new Date().toISOString(),
      last_sync_error: null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[tossplace/connect] upsert failed", error);
    return NextResponse.json({ ok: false, error: "연결 정보 저장 실패" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: "active",
    sampleCount: validation.sampleCount,
    message: validation.sampleCount > 0
      ? `연결 성공! 최근 24시간 주문 ${validation.sampleCount}건 확인.`
      : "연결 성공! 아직 최근 24시간 주문이 없어요.",
  });
}

function humanize(e: TossPlaceApiError): string {
  if (e.status === 401) return "인증 실패 — Access Key/Secret 다시 확인해 주세요.";
  if (e.status === 403) return "이 매장에 대한 권한이 없습니다. 매장 대시보드에서 앱 활성화 토글을 켜 주세요.";
  if (e.errorCode === "TIMEOUT") return "TOSS Place 서버 응답 시간 초과.";
  return `TOSS Place API 오류: ${e.message}`;
}
