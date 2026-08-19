import { interpretFinancialSimulation, AiParseError } from "@foundone/ai";
import type { AiStructuredResponse } from "@foundone/ai";
import type { FinancialSimulationResult } from "@foundone/shared";
import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "../../../_lib/env";
import { getRequestId, logApiError } from "../../../_lib/observability";
import { runAiFeature } from "../../../_lib/ai-guard";

type RequestBody = {
  result?: FinancialSimulationResult;
  categoryLabel?: string;
};

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const route = "/api/ai/finance/interpret";
  const requestId = getRequestId(request);

  // 입력 검증은 게이트(차감) 전에 — 잘못된 입력은 절대 차감하지 않는다.
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
  const simResult = body.result;

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." },
      { status: 503 }
    );
  }

  // 2026-08-19 ai-guard: 분·일·주·월 한도 + ≥500 이면 1회 재시도 후 전액 환불.
  return runAiFeature({ request, feature: "finance-interpret" }, async ({ userId }) => {
    try {
      const interpretation = await interpretFinancialSimulation(simResult, {
        apiKey,
        categoryLabel: body.categoryLabel
      });

      return NextResponse.json(interpretation satisfies AiStructuredResponse, {
        headers: { "x-request-id": requestId },
      });
    } catch (error) {
      if (error instanceof AiParseError) {
        logApiError(route, "parse_failed", error, { requestId, userId, status: 502 });
        return NextResponse.json(
          { error: "AI 응답을 처리하지 못했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.", refunded: true },
          { status: 502, headers: { "x-request-id": requestId } }
        );
      }

      logApiError(route, "request_failed", error, { requestId, userId, status: 500 });
      return NextResponse.json(
        { error: "재무 해석 중 오류가 발생했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.", refunded: true },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }
  });
}
