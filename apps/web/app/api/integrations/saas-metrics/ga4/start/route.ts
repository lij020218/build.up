/**
 * GET /api/integrations/saas-metrics/ga4/start
 *
 * GA4 OAuth 시작점. state 토큰 발급 후 Google consent 페이지로 redirect.
 */
import { NextResponse } from "next/server";
import { randomBytes, createHmac } from "crypto";
import { requireApiUser } from "../../../../_lib/auth";
import { buildAuthUrl, isGa4Configured, Ga4ApiError } from "../../../../_lib/ga4-client";
import { getEnvVar } from "../../../../_lib/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (!isGa4Configured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "GA4 OAuth 설정이 완료되지 않았습니다.",
        code: "GA4_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  // state = userId|nonce|hmac — callback 에서 사용자 확인 + CSRF 방지
  const nonce = randomBytes(16).toString("hex");
  const stateSecret = getEnvVar("GA4_STATE_SECRET") ?? getEnvVar("PORTONE_KEK_BASE64") ?? "fallback";
  const payload = `${auth.userId}|${nonce}`;
  const hmac = createHmac("sha256", stateSecret).update(payload).digest("hex").slice(0, 24);
  const state = `${payload}|${hmac}`;

  try {
    const url = buildAuthUrl(state);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    if (e instanceof Ga4ApiError) {
      return NextResponse.json({ ok: false, error: e.message, code: e.code }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "OAuth URL 생성 실패" }, { status: 500 });
  }
}
