/**
 * POST /api/push/dispatch — 푸시 발송 허브 (Phase A+B, 2026-07-12)
 *
 * 호출자: Supabase pg_net 트리거 (마이그레이션 20260712_000002 — 초대장·연차 신청·승인/반려).
 *   SQL 이 수신자·제목·본문을 완성해 보내고, 이 라우트는 토큰 조회 + 채널별 발송만 담당.
 *
 * 인증: `x-push-secret` 헤더 == env PUSH_WEBHOOK_SECRET (DB app_config 의 값과 동일하게 등록).
 *   env 미설정 시 503 fail-closed — 임의 호출로 푸시 스팸 불가.
 *
 * 채널:
 *   web — web-push(VAPID). env: NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
 *   ios — APNs HTTP/2 직접 (jose ES256 JWT, .p8). env: APNS_KEY_BASE64 / APNS_KEY_ID /
 *         APNS_TEAM_ID / (선택) APNS_TOPIC(기본 com.foundone.mobile) / APNS_SANDBOX=1(개발)
 *   만료 토큰(410/Unregistered)은 즉시 삭제 — user_push_tokens 위생 유지.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { importPKCS8, SignJWT } from "jose";
import { connect as http2Connect } from "node:http2";
import { getSupabaseServiceRoleKey } from "../../_lib/env";
import { timingSafeEqualStr } from "../../_lib/timing-safe";

export const runtime = "nodejs";

type DispatchBody = {
  recipient_user_id?: string;
  title?: string;
  body?: string;
  url?: string;
};

type TokenRow = { id: string; platform: "ios" | "web"; token: string };

export async function POST(req: NextRequest) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }
  // constant-time 비교 — cron 라우트들과 동일 규율 (문자열 !== 는 timing side-channel)
  if (!timingSafeEqualStr(req.headers.get("x-push-secret") ?? "", secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: DispatchBody;
  try {
    payload = (await req.json()) as DispatchBody;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { recipient_user_id: recipient, title, body, url } = payload;
  if (!recipient || !title || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const serviceKey = getSupabaseServiceRoleKey();
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supaUrl) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  }
  const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });

  const { data: tokens, error } = await admin
    .from("user_push_tokens")
    .select("id, platform, token")
    .eq("user_id", recipient);
  if (error) {
    console.error("[push] token fetch failed:", error.message);
    return NextResponse.json({ error: "token fetch failed" }, { status: 500 });
  }
  const rows = (tokens ?? []) as TokenRow[];
  if (rows.length === 0) return NextResponse.json({ sent: 0, reason: "no tokens" });

  const staleIds: string[] = [];
  let sent = 0;

  for (const row of rows) {
    try {
      if (row.platform === "web") {
        const ok = await sendWebPush(row.token, { title, body, url: url ?? "/current" });
        if (ok === "stale") staleIds.push(row.id);
        else if (ok === "sent") sent++;
      } else {
        const ok = await sendApns(row.token, title, body);
        if (ok === "stale") staleIds.push(row.id);
        else if (ok === "sent") sent++;
      }
    } catch (e) {
      console.error(`[push] ${row.platform} send error:`, e instanceof Error ? e.message : e);
    }
  }

  if (staleIds.length > 0) {
    await admin.from("user_push_tokens").delete().in("id", staleIds);
  }
  return NextResponse.json({ sent, stale: staleIds.length, total: rows.length });
}

// ── web-push (VAPID) ──────────────────────────────────────────────

async function sendWebPush(
  subscriptionJson: string,
  data: { title: string; body: string; url: string },
): Promise<"sent" | "stale" | "skipped"> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return "skipped"; // 키 미설정 — 조용히 skip (iOS 만 운영하는 기간 허용)

  webpush.setVapidDetails("mailto:lki720412@gmail.com", pub, priv);
  try {
    await webpush.sendNotification(JSON.parse(subscriptionJson), JSON.stringify(data));
    return "sent";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "stale"; // 구독 만료 — 토큰 삭제
    throw e;
  }
}

// ── APNs (HTTP/2 + ES256 JWT) ─────────────────────────────────────

async function sendApns(
  deviceToken: string,
  title: string,
  body: string,
): Promise<"sent" | "stale" | "skipped"> {
  const keyB64 = process.env.APNS_KEY_BASE64;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  if (!keyB64 || !keyId || !teamId) return "skipped"; // .p8 미등록 — 사장님 액션 대기

  const topic = process.env.APNS_TOPIC ?? "com.foundone.mobile";
  const host = process.env.APNS_SANDBOX === "1"
    ? "https://api.sandbox.push.apple.com"
    : "https://api.push.apple.com";

  const pem = Buffer.from(keyB64, "base64").toString("utf8");
  const key = await importPKCS8(pem, "ES256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuedAt()
    .setIssuer(teamId)
    .sign(key);

  const payload = JSON.stringify({
    aps: { alert: { title, body }, sound: "default" },
  });

  return new Promise((resolve, reject) => {
    const client = http2Connect(host);
    client.on("error", reject);
    const stream = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });
    let status = 0;
    let responseBody = "";
    stream.on("response", (headers) => { status = Number(headers[":status"] ?? 0); });
    stream.on("data", (chunk: Buffer) => { responseBody += chunk.toString(); });
    stream.on("end", () => {
      client.close();
      if (status === 200) return resolve("sent");
      if (status === 410) return resolve("stale"); // Unregistered — 토큰 삭제
      if (status === 400 && responseBody.includes("BadDeviceToken")) return resolve("stale");
      reject(new Error(`APNs ${status}: ${responseBody.slice(0, 120)}`));
    });
    stream.on("error", (e) => { client.close(); reject(e); });
    stream.end(payload);
  });
}
