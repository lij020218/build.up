import { analyzeContract, AiParseError } from "@build-up/ai";
import type { ContractAnalysisResult, ContractType } from "@build-up/ai";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";

const VALID_CONTRACT_TYPES: ContractType[] = ["commercial_lease", "franchise_agreement", "employment"];

type RequestBody = {
  contractText?: string;
  contractType?: ContractType;
};

const MIN_LENGTH = 100;
const MAX_LENGTH = 10_000;

export async function POST(request: Request) {
  const route = "/api/ai/contract/analyze";
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
    key: `contract:${auth.userId}`,
    limit: 5,
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI 서비스가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = body.contractText?.trim() ?? "";
  const contractType: ContractType = body.contractType && VALID_CONTRACT_TYPES.includes(body.contractType)
    ? body.contractType
    : "commercial_lease";

  if (text.length < MIN_LENGTH) {
    return NextResponse.json(
      { error: `계약서 내용이 너무 짧습니다. 최소 ${MIN_LENGTH}자 이상 입력해 주세요.` },
      { status: 400 }
    );
  }

  if (text.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `계약서 내용이 너무 깁니다. ${MAX_LENGTH.toLocaleString("ko-KR")}자 이하로 나눠서 분석해 주세요.` },
      { status: 413 }
    );
  }

  try {
    const result = await analyzeContract(text, { apiKey }, contractType);
    return NextResponse.json(result satisfies ContractAnalysisResult, {
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
        error: error instanceof Error ? error.message : "계약서 분석 중 오류가 발생했습니다."
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
