/**
 * POST /api/compliance/pg-precheck
 *
 * PG 입점심사 사전 검사 — 사장님 서비스 사이트 URL 을 서버가 받아 @foundone/shared runPgPrecheck 로 검사.
 * 심사관이 눈으로 보는 항목(사업자 정보 7항목·상품/가격·약관·환불·'곧 출시')을 제출 전에 기계가 먼저 본다.
 *
 * 보안(saas-metrics/pull/test 와 동일 패턴):
 *   - 로그인 필수(Bearer) · 분당 10회 레이트리밋
 *   - https 강제 + DNS resolve 후 사설 IP 차단(assertSafeHttpsUrl) · redirect 거부 · 10초 타임아웃 · 본문 1MB 상한
 *
 * Body:     { "url": "https://..." }
 * Response: { ok: true, http_status, result: PgPrecheckResult }
 *           { ok: false, error, http_status? }
 * iOS 미러: BUPgPrecheckCard → 같은 엔드포인트.
 */
import { NextResponse } from "next/server";
import { runPgPrecheck } from "@foundone/shared";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";
import { assertSafeHttpsUrl } from "../../_lib/url-guard";
import { withIosContract } from "../../_lib/ios-contract";

export const runtime = "nodejs";
export const maxDuration = 15;

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_000_000;

function json(payload: { ok: boolean; http_status?: number | null; [k: string]: unknown }, init?: ResponseInit) {
  return NextResponse.json(withIosContract(payload), init);
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({
    key: `pg-precheck:${auth.userId}`, limit: 10, windowMs: 60_000,
    message: "잠시 후 다시 시도해 주세요.",
  });
  if (!rl.ok) return json({ ok: false, error: rl.error }, { status: rl.status });

  let body: { url?: unknown };
  try {
    body = (await request.json()) as { url?: unknown };
  } catch {
    return json({ ok: false, error: "JSON 본문이 올바르지 않습니다." }, { status: 400 });
  }
  const raw = typeof body.url === "string" ? body.url.trim() : "";
  if (!raw) return json({ ok: false, error: "url 이 비어 있습니다." }, { status: 400 });
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  const safe = await assertSafeHttpsUrl(url);
  if (!safe.ok) {
    return json({ ok: false, error: `검사할 수 없는 주소입니다 (https 필수, 사설 IP 차단): ${safe.reason}` }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "foundone-pg-precheck/1.0 (+https://found.one)" },
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
  } catch (e) {
    clearTimeout(timer);
    const err = e as Error;
    const timedOut = err.name === "AbortError";
    return json(
      { ok: false, error: timedOut ? "10초 안에 응답이 없었습니다." : `사이트를 열 수 없습니다: ${err.message}. 리다이렉트(www ↔ 루트 도메인)가 있으면 최종 주소를 입력하세요.` },
      { status: 502 },
    );
  }

  let html = "";
  try {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("empty body");
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      received += value.byteLength;
      chunks.push(value);
      if (received >= MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
    html = new TextDecoder("utf-8").decode(concat(chunks, received));
  } catch (e) {
    clearTimeout(timer);
    return json({ ok: false, error: `본문을 읽지 못했습니다: ${(e as Error).message}`, http_status: response.status }, { status: 502 });
  }
  clearTimeout(timer);

  if (!response.ok) {
    return json({ ok: false, error: `사이트가 ${response.status} 로 응답했습니다 — 심사관도 같은 화면을 봅니다.`, http_status: response.status }, { status: 502 });
  }

  const result = runPgPrecheck({ url, html });
  return json({ ok: true, http_status: response.status, result });
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(Math.min(total, MAX_BYTES));
  let offset = 0;
  for (const c of chunks) {
    const slice = c.subarray(0, Math.max(0, out.length - offset));
    out.set(slice, offset);
    offset += slice.length;
    if (offset >= out.length) break;
  }
  return out;
}
