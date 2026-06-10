/**
 * POST /api/integrations/saas-metrics/webhook/connect
 *
 * Custom webhook 채널 활성화. 사장님 백엔드가 매일 cron 으로
 * `/api/integrations/saas-metrics/webhook/ingest` 에 POST.
 *
 * 응답: { ok, webhookToken, ingestUrl, sample }
 *   webhookToken — 사장님이 X-Webhook-Token 헤더로 보낼 비밀값 (한 번만 노출).
 *                   서버는 SHA-256 해시만 저장.
 */
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { requireApiUser } from "../../../../_lib/auth";
import { getSupabaseAdmin } from "../../../../_lib/supabase-admin";
import { getEnvVar } from "../../../../_lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  // 새 토큰 발급 (32 bytes = 64 hex chars)
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error } = await supabase.from("saas_metrics_connections").upsert(
    {
      user_id: auth.userId,
      source: "webhook",
      webhook_token_hash: tokenHash,
      status: "active",
      last_sync_error: null,
    },
    { onConflict: "user_id,source" },
  );
  if (error) {
    console.error("[integrations/saas-metrics/webhook/connect] persist failed:", error);
    return NextResponse.json(
      { ok: false, error: "연결 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  const base = getEnvVar("APP_BASE_URL") ?? "http://localhost:3000";
  const ingestUrl = `${base}/api/integrations/saas-metrics/webhook/ingest`;
  const sample = {
    date: new Date().toISOString().slice(0, 10),
    activeUsers: 1234,
    newUsers: 42,
    cumulativeUsers: 56789,
    signups: 5,
    churns: 1,
  };

  return NextResponse.json({
    ok: true,
    webhookToken: token,                              // ⚠ 한 번만 노출
    ingestUrl,
    sampleCurl: `curl -X POST '${ingestUrl}' \\\n  -H 'X-Webhook-Token: ${token}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(sample)}'`,
    note: "이 토큰은 한 번만 표시됩니다. 안전한 곳에 저장하세요.",
  });
}
