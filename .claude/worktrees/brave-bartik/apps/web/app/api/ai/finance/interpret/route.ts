import { interpretFinancialSimulation, AiParseError } from "@build-up/ai";
import type { AiStructuredResponse } from "@build-up/ai";
import type { FinancialSimulationResult } from "@build-up/shared";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";

type RequestBody = {
  result?: FinancialSimulationResult;
  categoryLabel?: string;
};

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

  const rateLimit = checkSimpleRateLimit({
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
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
