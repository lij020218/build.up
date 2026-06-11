import { createAiClient } from "../utils/client";
import { AiParseError } from "../types/ai";
import type { AiCallOptions } from "../types/ai";
import { systemWithCache } from "../utils/client";
import { looseExtractJson } from "../utils/parse-json";
import { getSystemPromptForType, buildContractUserPrompt } from "./prompt";
import type { ContractAnalysisResult, ContractClause, ContractType } from "./prompt";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 2048;

// 계약서는 분석 내용이 많을 수 있어 다른 기능보다 max_tokens를 높게 설정합니다.

// ─── 응답 파싱 & 검증 ─────────────────────────────────────────────────────────

function parseContractResponse(raw: string): ContractAnalysisResult {
  const cleaned = looseExtractJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AiParseError("계약서 분석 응답이 유효한 JSON이 아닙니다.", raw);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AiParseError("계약서 분석 응답이 객체 형태가 아닙니다.", raw);
  }

  const obj = parsed as Record<string, unknown>;

  const validRiskLevels = ["low", "medium", "high", "critical"];
  if (!validRiskLevels.includes(String(obj.riskLevel))) {
    throw new AiParseError("riskLevel 필드가 올바르지 않습니다.", raw);
  }

  if (!Array.isArray(obj.flaggedClauses)) {
    throw new AiParseError("flaggedClauses 필드가 배열이 아닙니다.", raw);
  }

  const flaggedClauses: ContractClause[] = (obj.flaggedClauses as unknown[]).map((item, i) => {
    if (typeof item !== "object" || item === null) {
      throw new AiParseError(`flaggedClauses[${i}]가 객체가 아닙니다.`, raw);
    }
    const clause = item as Record<string, unknown>;
    if (typeof clause.excerpt !== "string" || typeof clause.issue !== "string") {
      throw new AiParseError(`flaggedClauses[${i}] 필드가 올바르지 않습니다.`, raw);
    }
    const severity = clause.severity === "danger" ? "danger" : "warning";
    return {
      excerpt: clause.excerpt.trim(),
      issue: clause.issue.trim(),
      severity
    };
  });

  if (!Array.isArray(obj.missingItems) || !obj.missingItems.every((v) => typeof v === "string")) {
    throw new AiParseError("missingItems 필드가 string[] 형태가 아닙니다.", raw);
  }

  if (!Array.isArray(obj.unusualTerms) || !obj.unusualTerms.every((v) => typeof v === "string")) {
    throw new AiParseError("unusualTerms 필드가 string[] 형태가 아닙니다.", raw);
  }

  if (typeof obj.summary !== "string" || obj.summary.trim() === "") {
    throw new AiParseError("summary 필드가 없거나 비어있습니다.", raw);
  }

  if (!Array.isArray(obj.nextActions) || !obj.nextActions.every((v) => typeof v === "string")) {
    throw new AiParseError("nextActions 필드가 string[] 형태가 아닙니다.", raw);
  }

  return {
    riskLevel: obj.riskLevel as ContractAnalysisResult["riskLevel"],
    flaggedClauses,
    missingItems: (obj.missingItems as string[]).map((s) => s.trim()).filter(Boolean),
    unusualTerms: (obj.unusualTerms as string[]).map((s) => s.trim()).filter(Boolean),
    summary: obj.summary.trim(),
    nextActions: (obj.nextActions as string[]).map((s) => s.trim()).filter(Boolean)
  };
}

// ─── 메인 함수 ────────────────────────────────────────────────────────────────
// 계약서 원문을 받아 위험 조항 분석 결과를 반환합니다.
//
// 설계 원칙:
// - 최대 10,000자로 입력을 제한합니다 (토큰 폭발 방지).
// - 파싱 실패 시 AiParseError를 throw합니다.

const MAX_CONTRACT_LENGTH = 10_000;

export async function analyzeContract(
  contractText: string,
  options: AiCallOptions,
  contractType: ContractType = "commercial_lease"
): Promise<ContractAnalysisResult> {
  const truncated = contractText.slice(0, MAX_CONTRACT_LENGTH);
  const client = createAiClient(options.apiKey);

  const userMessage = buildContractUserPrompt(truncated, contractType);
  const systemPrompt = getSystemPromptForType(contractType);

  const message = await client.messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    // ✦ Prompt Caching — 같은 contract type 반복 분석 시 90% 절감
    system: systemWithCache(systemPrompt),
    messages: [{ role: "user", content: userMessage }]
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiParseError("AI 응답에 텍스트 블록이 없습니다.", JSON.stringify(message.content));
  }

  return parseContractResponse(textBlock.text);
}
