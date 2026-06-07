/**
 * POST /api/integrations/saas-metrics/pull/test
 *
 * 사장님이 endpoint 를 저장하기 전, 현재 응답을 한 번 호출해서 검증.
 * - https 강제
 * - Bearer 토큰 헤더
 * - 10초 타임아웃
 * - 응답 shape (step_1..4, as_of, mode) 파싱 + 그대로 echo
 *
 * Body:
 *   { "endpoint_url": "...", "secret_token": "..." }
 *
 * Response:
 *   { ok: true, http_status: 200, data: {...}, parsed: { step_1, step_2, ... } }
 *   { ok: false, error: "...", http_status?: number }
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../../_lib/auth";
import { assertSafeHttpsUrl } from "../../../../_lib/url-guard";

export const runtime = "nodejs";
export const maxDuration = 15;

const TIMEOUT_MS = 10_000;

type TestBody = {
  endpoint_url?: unknown;
  secret_token?: unknown;
};

function parseFunnelPayload(raw: unknown): {
  as_of: string | null;
  mode: string | null;
  step_1: number;
  step_2: number;
  step_3: number;
  step_4: number;
} | null {
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
  return {
    as_of: typeof r.as_of === "string" ? r.as_of : null,
    mode: typeof r.mode === "string" ? r.mode : null,
    step_1: s1,
    step_2: s2,
    step_3: s3,
    step_4: s4,
  };
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: TestBody;
  try {
    body = (await request.json()) as TestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const endpointUrl = typeof body.endpoint_url === "string" ? body.endpoint_url.trim() : "";
  const secretToken = typeof body.secret_token === "string" ? body.secret_token : "";

  if (!endpointUrl) {
    return NextResponse.json({ ok: false, error: "endpoint_url 이 비어 있습니다." }, { status: 400 });
  }
  if (!secretToken) {
    return NextResponse.json({ ok: false, error: "secret_token 이 비어 있습니다." }, { status: 400 });
  }
  // fetch 직전 SSRF 재검증 — https 강제 + DNS resolve 후 사설 IP 차단(재바인딩 방어).
  const safe = await assertSafeHttpsUrl(endpointUrl);
  if (!safe.ok) {
    return NextResponse.json(
      { ok: false, error: `endpoint_url 이 안전하지 않습니다 (https 필수, 사설 IP 차단): ${safe.reason}` },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpointUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretToken}`,
        Accept: "application/json",
        "User-Agent": "foundone-funnel-pull/1.0",
      },
      signal: controller.signal,
      // Vercel/Next 의 fetch 캐시 회피
      cache: "no-store",
    });
  } catch (e) {
    clearTimeout(timer);
    const err = e as Error;
    const timedOut = err.name === "AbortError";
    return NextResponse.json(
      {
        ok: false,
        error: timedOut
          ? "10초 안에 응답이 없었습니다 (timeout)."
          : `endpoint 호출 실패: ${err.message}`,
      },
      { status: 502 },
    );
  }
  clearTimeout(timer);

  const httpStatus = response.status;
  const text = await response.text();

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        http_status: httpStatus,
        error:
          httpStatus === 401 || httpStatus === 403
            ? "endpoint 가 Bearer 토큰을 거부했습니다 (401/403). 토큰 검증 로직을 확인하세요."
            : `endpoint 가 비정상 응답을 반환했습니다 (HTTP ${httpStatus}).`,
        body_preview: text.slice(0, 500),
      },
      { status: 200 }, // 진단 결과는 200, http_status 로 구분
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        http_status: httpStatus,
        error: "응답이 JSON 형식이 아닙니다.",
        body_preview: text.slice(0, 500),
      },
      { status: 200 },
    );
  }

  const parsed = parseFunnelPayload(data);
  if (!parsed) {
    return NextResponse.json(
      {
        ok: false,
        http_status: httpStatus,
        error:
          "응답 shape 이 올바르지 않습니다. step_1..step_4 (정수) 가 필요합니다. /sample 참고.",
        data,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    http_status: httpStatus,
    data,
    parsed,
    note: "정상 응답입니다. /connect 로 등록하시면 매일 자동 수집됩니다.",
  });
}
