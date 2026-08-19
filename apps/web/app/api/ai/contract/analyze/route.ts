import { analyzeContract, AiParseError } from "@foundone/ai";
import type { ContractAnalysisResult, ContractType } from "@foundone/ai";
import { NextResponse } from "next/server";
import { getAnthropicApiKey, getRealAnthropicApiKey } from "../../../_lib/env";
import { getRequestId, logApiError } from "../../../_lib/observability";
import { runAiFeature } from "../../../_lib/ai-guard";

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

  // 입력 검증은 게이트(차감) 전에 — 잘못된 입력(400/413)은 절대 차감하지 않는다.
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

  // 2026-08-19 ai-guard: 분·일·주·월 한도 + 실패(파싱·모델·서버) 시 전액 환불.
  //  analyzeContract 안에 Opus→terra 폴백이 이미 있으므로 게이트 재시도는 끈다(90s 예산 보호).
  return runAiFeature(
    {
      request, feature: "contract-analyze", retryOnce: false,
      failMessage: "계약서 분석 중 오류가 발생했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.",
    },
    async ({ userId }) => {
      try {
        // fallbackApiKey: Opus 실패 시 gpt-5.6-terra 재시도용 (getAnthropicApiKey = OpenAI 우선 셔임 키)
        const result = await analyzeContract(text, { apiKey, useRealClaude, fallbackApiKey: getAnthropicApiKey() ?? undefined }, contractType);
        return NextResponse.json(result satisfies ContractAnalysisResult, {
          headers: { "x-request-id": requestId },
        });
      } catch (error) {
        // ≥500 응답 → 게이트가 환불(x-ai-refunded 헤더). 사용자 문구는 유지.
        if (error instanceof AiParseError) {
          logApiError(route, "parse_failed", error, { requestId, userId, status: 502 });
          return NextResponse.json(
            { error: "AI 응답을 처리하지 못했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.", refunded: true },
            { status: 502, headers: { "x-request-id": requestId } }
          );
        }
        logApiError(route, "request_failed", error, { requestId, userId, status: 500 });
        return NextResponse.json(
          { error: "계약서 분석 중 오류가 발생했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.", refunded: true },
          { status: 500, headers: { "x-request-id": requestId } }
        );
      }
    },
  );
}
