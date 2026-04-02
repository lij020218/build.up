import { diagnoseBusinessHealth, AiParseError } from "@build-up/ai";
import type { HealthDiagnosisContext } from "@build-up/ai";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";

type RequestBody = Partial<HealthDiagnosisContext>;

export async function POST(request: Request) {
  const route = "/api/ai/health/diagnose";
  const requestId = getRequestId(request);
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    logApiEvent("warn", {
      area: "ai", route, requestId,
      event: "auth_failed", status: auth.status, detail: auth.error,
    });
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = checkSimpleRateLimit({
    key: `health:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI 서비스가 설정되지 않았습니다." }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const context: HealthDiagnosisContext = {
    businessType: body.businessType ?? "일반",
    monthsInBusiness: body.monthsInBusiness ?? 0,
    avgDailySales: body.avgDailySales ?? 0,
    avgDailyCustomers: body.avgDailyCustomers ?? 0,
    operatingMargin: body.operatingMargin ?? 0,
    primeCostRatio: body.primeCostRatio ?? 0,
    rentCostRatio: body.rentCostRatio ?? 0,
    salesTrend: body.salesTrend ?? "stable",
    salesTrendPercent: body.salesTrendPercent ?? 0,
    healthScore: body.healthScore ?? 50,
    cashRunwayMonths: body.cashRunwayMonths ?? 0,
    alerts: body.alerts ?? [],
  };

  try {
    const result = await diagnoseBusinessHealth(context, { apiKey });
    return NextResponse.json(result, {
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    if (error instanceof AiParseError) {
      logApiError(route, "parse_failed", error, {
        requestId, userId: auth.userId, status: 502,
      });
      return NextResponse.json(
        { error: "AI 응답 파싱 실패.", detail: error.message },
        { status: 502, headers: { "x-request-id": requestId } }
      );
    }

    logApiError(route, "request_failed", error, {
      requestId, userId: auth.userId, status: 500,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "건강 진단 중 오류가 발생했습니다." },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
