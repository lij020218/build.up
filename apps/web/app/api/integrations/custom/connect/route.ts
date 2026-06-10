/**
 * POST   /api/integrations/custom/connect    — 새 webhook 토큰 발급 (회전 시 기존 무효화)
 * DELETE /api/integrations/custom/connect    — 연결 해제 (토큰 무효)
 *
 * 토큰은 1회 평문 반환 후 해시만 DB 에 저장.
 * 형식: "bup_<32 random chars>"
 */

import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({
    key: `custom-connect:${auth.userId}`, limit: 5, windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요.",
  });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { description?: string };
  try { body = (await request.json()) as typeof body; } catch { body = {}; }

  // 토큰 생성
  const tokenSuffix = randomBytes(24).toString("base64url"); // 32 chars
  const plaintextToken = `bup_${tokenSuffix}`;
  const tokenHash = createHash("sha256").update(plaintextToken).digest("hex");
  const tokenMask = `${plaintextToken.slice(0, 8)}...${plaintextToken.slice(-4)}`;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB config" }, { status: 500 });

  const { error } = await supabase.from("custom_connections").upsert({
    user_id: auth.userId,
    token_hash: tokenHash,
    token_mask: tokenMask,
    description: body.description?.trim() || null,
    status: "active",
    rotated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) {
    console.error("[integrations/custom/connect] persist failed:", error);
    return NextResponse.json(
      { ok: false, error: "연결 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://foundone.dev").replace(/\/$/, "");
  return NextResponse.json({
    ok: true,
    token: plaintextToken,                         // ⚠ 1회만 반환 — 사장님이 안전한 곳에 복사 필요
    tokenMask,
    webhookUrl: `${baseUrl}/api/webhooks/custom/${auth.userId}`,
    instructions: "이 토큰은 다시 표시되지 않습니다. 즉시 안전한 곳에 복사하세요. POST 시 Authorization: Bearer <token> 헤더로 전송.",
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB config" }, { status: 500 });

  const { error } = await supabase
    .from("custom_connections")
    .update({ status: "revoked" })
    .eq("user_id", auth.userId);
  if (error) {
    console.error("[integrations/custom/connect] revoke failed:", error);
    return NextResponse.json(
      { ok: false, error: "연결 해제에 실패했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
