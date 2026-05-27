/**
 * POST /api/integrations/saas-metrics/pull/connect
 *  → 사장님이 자체 운영하는 GET endpoint 를 funnel 데이터 소스로 등록.
 *    매일 04:00 KST cron 이 endpoint_url 을 호출 → saas_funnel_source_daily 적재.
 *
 * DELETE /api/integrations/saas-metrics/pull/connect
 *  → 연결 해제. row 는 status='revoked' 로 유지 (감사 추적).
 *
 * Body (POST):
 *   {
 *     "endpoint_url": "https://api.example.com/buildup/funnel",
 *     "secret_token": "shared-bearer-token",
 *     "funnel_mode": "saas" | "commerce",
 *     "label": "내 SaaS"
 *   }
 *
 * 비밀 토큰은 envelope encryption (DEK + KEK) 으로 봉투 암호화 후 저장.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../../_lib/auth";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";
import { envelopeEncrypt, isKekAvailable, maskSecret } from "../../../../_lib/envelope-crypto";
import { isValidHttpsUrl } from "../../../../_lib/url-guard";

export const runtime = "nodejs";
export const maxDuration = 15;

type ConnectBody = {
  endpoint_url?: unknown;
  secret_token?: unknown;
  funnel_mode?: unknown;
  label?: unknown;
};

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: ConnectBody;
  try {
    body = (await request.json()) as ConnectBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const endpointUrl = typeof body.endpoint_url === "string" ? body.endpoint_url.trim() : "";
  const secretToken = typeof body.secret_token === "string" ? body.secret_token : "";
  const funnelMode = typeof body.funnel_mode === "string" ? body.funnel_mode : "";
  const label = typeof body.label === "string" ? body.label.trim() : "";

  if (!endpointUrl) {
    return NextResponse.json({ ok: false, error: "endpoint_url 이 비어 있습니다." }, { status: 400 });
  }
  if (!isValidHttpsUrl(endpointUrl)) {
    return NextResponse.json(
      { ok: false, error: "endpoint_url 은 https:// 로 시작해야 합니다." },
      { status: 400 },
    );
  }
  if (!secretToken || secretToken.length < 8) {
    return NextResponse.json(
      { ok: false, error: "secret_token 은 최소 8자 이상이어야 합니다." },
      { status: 400 },
    );
  }
  if (funnelMode !== "saas" && funnelMode !== "commerce") {
    return NextResponse.json(
      { ok: false, error: "funnel_mode 는 'saas' 또는 'commerce' 여야 합니다." },
      { status: 400 },
    );
  }
  if (!isKekAvailable(1)) {
    return NextResponse.json(
      { ok: false, error: "서버 암호화 키(KEK)가 설정되지 않았습니다. 관리자에게 문의하세요." },
      { status: 500 },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });
  }

  let enc;
  try {
    enc = envelopeEncrypt(secretToken, 1);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `암호화 실패: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  const { error } = await supabase.from("saas_metrics_connections").upsert(
    {
      user_id: auth.userId,
      source: "custom_pull",
      endpoint_url: endpointUrl,
      funnel_mode: funnelMode,
      connection_label: label || null,
      encrypted_secret: enc.encryptedSecret,
      secret_iv: enc.secretIv,
      secret_auth_tag: enc.secretAuthTag,
      encrypted_dek: enc.encryptedDek,
      dek_iv: enc.dekIv,
      dek_auth_tag: enc.dekAuthTag,
      kek_version: enc.kekVersion,
      status: "active",
      last_sync_error: null,
    },
    { onConflict: "user_id,source" },
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: `저장 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    source: "custom_pull",
    endpoint_url: endpointUrl,
    funnel_mode: funnelMode,
    label: label || null,
    masked_token: maskSecret(secretToken),
    status: "active",
    note: "매일 04:00 KST 에 endpoint 를 호출하여 funnel 데이터를 수집합니다.",
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });
  }

  const { error } = await supabase
    .from("saas_metrics_connections")
    .update({
      status: "revoked",
      last_sync_error: null,
    })
    .eq("user_id", auth.userId)
    .eq("source", "custom_pull");

  if (error) {
    return NextResponse.json(
      { ok: false, error: `해제 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, status: "revoked" });
}
