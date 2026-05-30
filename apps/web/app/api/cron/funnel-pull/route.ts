/**
 * GET /api/cron/funnel-pull
 *
 * 매일 04:00 KST (= 19:00 UTC 전날) Vercel cron.
 * source='custom_pull' & status='active' 인 모든 connection 순회 →
 * endpoint_url 을 GET → saas_funnel_source_daily upsert.
 *
 * 인증: Authorization: Bearer <CRON_SECRET>
 * 시간 한도: 한 실행 최대 280초 (Pro 300초 cap 방어).
 *
 * 처리 한도:
 *  - 한 번에 최대 100명 (오래 안 동기화된 사용자 우선).
 *  - 호출당 10초 타임아웃.
 *  - 401/403 → status='invalid' 마킹.
 *  - 그 외 실패 → last_sync_error 갱신, status 유지.
 */

import { NextResponse } from "next/server";
import { getCronSecret } from "../../_lib/env";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { envelopeDecrypt } from "../../_lib/envelope-crypto";
import { isValidHttpsUrl } from "../../_lib/url-guard";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_USERS_PER_RUN = 100;
const FETCH_TIMEOUT_MS = 10_000;
const TIME_BUDGET_MS = 280_000;

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const secret = getCronSecret();
  if (!secret) return false;
  return token === secret;
}

type Connection = {
  user_id: string;
  endpoint_url: string | null;
  funnel_mode: string | null;
  encrypted_secret: string;
  secret_iv: string;
  secret_auth_tag: string;
  encrypted_dek: string;
  dek_iv: string;
  dek_auth_tag: string;
  kek_version: number;
};

type FunnelPayload = {
  as_of: string | null;
  mode: "saas" | "commerce";
  step_1: number;
  step_2: number;
  step_3: number;
  step_4: number;
};

function parseFunnelPayload(
  raw: unknown,
  fallbackMode: string | null,
): FunnelPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const toInt = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) return Math.floor(n);
    }
    return null;
  };
  const s1 = toInt(r.step_1);
  const s2 = toInt(r.step_2);
  const s3 = toInt(r.step_3);
  const s4 = toInt(r.step_4);
  if (s1 === null || s2 === null || s3 === null || s4 === null) return null;
  const modeRaw = typeof r.mode === "string" ? r.mode : fallbackMode;
  if (modeRaw !== "saas" && modeRaw !== "commerce") return null;
  return {
    as_of: typeof r.as_of === "string" ? r.as_of : null,
    mode: modeRaw,
    step_1: s1,
    step_2: s2,
    step_3: s3,
    step_4: s4,
  };
}

async function fetchEndpoint(
  url: string,
  secret: string,
): Promise<{ status: number; body: unknown; bodyText: string; error?: string }> {
  // 2026-05-27 보안 (P1-2): defense-in-depth — write-time 검증 외에 fetch-time 에도 재검증.
  //   DB 변조·코드 변경으로 사설 IP 가 endpoint_url 에 들어가면 SSRF 가능.
  if (!isValidHttpsUrl(url)) {
    return {
      status: 0,
      body: null,
      bodyText: "",
      error: "endpoint_url 이 안전하지 않은 URL 입니다 (https 필수, 사설 IP 차단)",
    };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
        "User-Agent": "foundone-funnel-pull/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    return { status: response.status, body: parsed, bodyText: text };
  } catch (e) {
    const err = e as Error;
    return {
      status: 0,
      body: null,
      bodyText: "",
      error: err.name === "AbortError" ? "timeout (10s)" : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

function todayKstIso(): string {
  // KST = UTC+9. 04:00 KST cron 이면 KST 기준 "오늘" 날짜 사용.
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const { data: conns, error: connErr } = await supabase
    .from("saas_metrics_connections")
    .select(
      "user_id, endpoint_url, funnel_mode, encrypted_secret, secret_iv, secret_auth_tag, encrypted_dek, dek_iv, dek_auth_tag, kek_version",
    )
    .eq("source", "custom_pull")
    .eq("status", "active")
    .order("last_sync_at", { ascending: true, nullsFirst: true })
    .limit(MAX_USERS_PER_RUN);

  if (connErr) {
    return NextResponse.json(
      { error: `select failed: ${connErr.message}` },
      { status: 500 },
    );
  }

  if (!conns || conns.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      message: "no active custom_pull connections",
    });
  }

  const startedAt = Date.now();
  const today = todayKstIso();
  const report = {
    ok: true,
    processed: 0,
    succeeded: 0,
    failed: 0,
    perUser: [] as Array<{
      userId: string;
      ok: boolean;
      http_status?: number;
      error?: string;
    }>,
  };

  for (const raw of conns as Connection[]) {
    const userId = raw.user_id;
    const entry = {
      userId,
      ok: false,
      http_status: undefined as number | undefined,
      error: undefined as string | undefined,
    };

    if (!raw.endpoint_url) {
      entry.error = "endpoint_url 이 비어 있습니다";
      report.failed += 1;
      report.perUser.push(entry);
      await supabase
        .from("saas_metrics_connections")
        .update({ last_sync_error: entry.error })
        .eq("user_id", userId)
        .eq("source", "custom_pull");
      continue;
    }

    let secret: string;
    try {
      secret = envelopeDecrypt({
        encryptedSecret: raw.encrypted_secret,
        secretIv: raw.secret_iv,
        secretAuthTag: raw.secret_auth_tag,
        encryptedDek: raw.encrypted_dek,
        dekIv: raw.dek_iv,
        dekAuthTag: raw.dek_auth_tag,
        kekVersion: raw.kek_version,
      });
    } catch (e) {
      entry.error = `decrypt: ${(e as Error).message}`;
      report.failed += 1;
      report.perUser.push(entry);
      await supabase
        .from("saas_metrics_connections")
        .update({ last_sync_error: entry.error })
        .eq("user_id", userId)
        .eq("source", "custom_pull");
      continue;
    }

    const fetched = await fetchEndpoint(raw.endpoint_url, secret);
    entry.http_status = fetched.status || undefined;

    if (fetched.error) {
      entry.error = `fetch: ${fetched.error}`;
      report.failed += 1;
      report.perUser.push(entry);
      await supabase
        .from("saas_metrics_connections")
        .update({ last_sync_error: entry.error })
        .eq("user_id", userId)
        .eq("source", "custom_pull");
      continue;
    }

    if (fetched.status === 401 || fetched.status === 403) {
      entry.error = `Bearer token rejected (HTTP ${fetched.status})`;
      report.failed += 1;
      report.perUser.push(entry);
      await supabase
        .from("saas_metrics_connections")
        .update({ status: "invalid", last_sync_error: entry.error })
        .eq("user_id", userId)
        .eq("source", "custom_pull");
      continue;
    }

    if (fetched.status < 200 || fetched.status >= 300) {
      entry.error = `HTTP ${fetched.status}`;
      report.failed += 1;
      report.perUser.push(entry);
      await supabase
        .from("saas_metrics_connections")
        .update({ last_sync_error: entry.error })
        .eq("user_id", userId)
        .eq("source", "custom_pull");
      continue;
    }

    const parsed = parseFunnelPayload(fetched.body, raw.funnel_mode);
    if (!parsed) {
      entry.error = "응답 shape 오류 (step_1..4 + mode 필요)";
      report.failed += 1;
      report.perUser.push(entry);
      await supabase
        .from("saas_metrics_connections")
        .update({ last_sync_error: entry.error })
        .eq("user_id", userId)
        .eq("source", "custom_pull");
      continue;
    }

    const dateKey = parsed.as_of && /^\d{4}-\d{2}-\d{2}$/.test(parsed.as_of)
      ? parsed.as_of
      : today;

    const { error: upErr } = await supabase
      .from("saas_funnel_source_daily")
      .upsert(
        {
          user_id: userId,
          date: dateKey,
          mode: parsed.mode,
          source: "pull",
          step_1: parsed.step_1,
          step_2: parsed.step_2,
          step_3: parsed.step_3,
          step_4: parsed.step_4,
          raw: fetched.body as object,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,date,mode,source" },
      );

    if (upErr) {
      entry.error = `upsert: ${upErr.message}`;
      report.failed += 1;
      report.perUser.push(entry);
      await supabase
        .from("saas_metrics_connections")
        .update({ last_sync_error: entry.error })
        .eq("user_id", userId)
        .eq("source", "custom_pull");
      continue;
    }

    entry.ok = true;
    report.succeeded += 1;
    report.perUser.push(entry);
    await supabase
      .from("saas_metrics_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
      })
      .eq("user_id", userId)
      .eq("source", "custom_pull");

    if (Date.now() - startedAt > TIME_BUDGET_MS) break;
  }

  report.processed = report.succeeded + report.failed;
  if (report.failed > 0) report.ok = false;

  return NextResponse.json({
    ...report,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return handle(request);
}

// 수동 호출 (관리자 디버깅) — 같은 핸들러
export async function POST(request: Request) {
  return handle(request);
}
