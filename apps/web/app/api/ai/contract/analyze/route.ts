import { analyzeContract, AiParseError } from "@foundone/ai";
import type { ContractAnalysisResult, ContractType } from "@foundone/ai";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey, getRealAnthropicApiKey } from "../../../_lib/env";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

const VALID_CONTRACT_TYPES: ContractType[] = ["commercial_lease", "franchise_agreement", "employment"];

type RequestBody = {
  contractText?: string;
  contractType?: ContractType;
};

const MIN_LENGTH = 100;
const MAX_LENGTH = 10_000;

export const runtime = "nodejs";
export const maxDuration = 90; // Vercel function timeout

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

  const rateLimit = await checkSimpleRateLimit({
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

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "contract-analyze",
    limit: 3,
    message: "오늘 계약서 분석 사용량(하루 3회)을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  // 계약서 분석은 법률 고위험 기능 — 진짜 Claude(Opus 4.8) 우선. 키 없으면 OpenAI 셔임으로 graceful fallback.
  const realClaudeKey = getRealAnthropicApiKey();
  const apiKey = realClaudeKey ?? getAnthropicApiKey();
  const useRealClaude = !!realClaudeKey;
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
    const result = await analyzeContract(text, { apiKey, useRealClaude }, contractType);
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
        { error: "AI 응답을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
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
        error: "계약서 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
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
