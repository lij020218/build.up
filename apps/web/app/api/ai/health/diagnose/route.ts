import { diagnoseBusinessHealth, AiParseError } from "@foundone/ai";
import type { HealthDiagnosisContext } from "@foundone/ai";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

type RequestBody = Partial<HealthDiagnosisContext>;

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

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

  const rateLimit = await checkSimpleRateLimit({
    key: `health:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "health-diagnose",
    limit: 3,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
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
      // 내부 오류 상세(error.message)는 서버 로그에만 — 클라이언트엔 고정 문자열.
      return NextResponse.json(
        { error: "AI 응답을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502, headers: { "x-request-id": requestId } }
      );
    }

    logApiError(route, "request_failed", error, {
      requestId, userId: auth.userId, status: 500,
    });
    return NextResponse.json(
      { error: "건강 진단 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
