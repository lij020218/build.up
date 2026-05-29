import { interpretFinancialSimulation, AiParseError } from "@foundone/ai";
import type { AiStructuredResponse } from "@foundone/ai";
import type { FinancialSimulationResult } from "@foundone/shared";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

type RequestBody = {
  result?: FinancialSimulationResult;
  categoryLabel?: string;
};

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const route = "/api/ai/finance/interpret";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    logApiEvent("warn", {
      area: "ai",
      route,
      requestId,
      event: "auth_failed",
      status: auth.status,
      detail: auth.error
    });
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await checkSimpleRateLimit({
    key: `finance:${auth.userId}`,
    limit: 8,
    windowMs: 60_000
  });
  if (!rateLimit.ok) {
    logApiEvent("warn", {
      area: "ai",
      route,
      requestId,
      event: "rate_limited",
      userId: auth.userId,
      status: rateLimit.status,
      detail: rateLimit.error
    });
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "finance-interpret",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    logApiEvent("warn", {
      area: "ai",
      route,
      requestId,
      event: "rate_limited",
      userId: auth.userId,
      status: dailyLimit.status,
      detail: dailyLimit.error,
    });
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.result) {
    return NextResponse.json(
      { error: "result (FinancialSimulationResult) is required." },
      { status: 400 }
    );
  }

  try {
    const interpretation = await interpretFinancialSimulation(body.result, {
      apiKey,
      categoryLabel: body.categoryLabel
    });

    return NextResponse.json(interpretation satisfies AiStructuredResponse, {
      headers: {
        "x-request-id": requestId
      }
    });
  } catch (error) {
    if (error instanceof AiParseError) {
      logApiError(route, "parse_failed", error, {
        requestId,
        userId: auth.userId,
        status: 502
      });
      return NextResponse.json(
        { error: "AI 응답 파싱 실패.", detail: error.message },
        {
          status: 502,
          headers: {
            "x-request-id": requestId
          }
        }
      );
    }

    logApiError(route, "request_failed", error, {
      requestId,
      userId: auth.userId,
      status: 500
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "재무 해석 중 오류가 발생했습니다."
      },
      {
        status: 500,
        headers: {
          "x-request-id": requestId
        }
      }
    );
  }
}
