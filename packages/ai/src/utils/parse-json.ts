import { z, type ZodType } from "zod";

export class AiParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse?: string,
  ) {
    super(message);
    this.name = "AiParseError";
  }
}

/**
 * AI 응답에서 JSON을 안전하게 추출하고 Zod 스키마로 검증.
 * 마크다운 코드블록, 앞뒤 텍스트 등을 자동 제거.
 */
export function parseAiJsonResponse<T>(raw: string, schema: ZodType<T>): T {
  // 1. 마크다운 코드블록 제거
  let cleaned = raw.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 2. JSON 객체/배열 경계 찾기
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let jsonStart = -1;

  if (firstBrace === -1 && firstBracket === -1) {
    throw new AiParseError("AI 응답에서 JSON을 찾을 수 없습니다.", raw.slice(0, 200));
  }

  if (firstBrace === -1) jsonStart = firstBracket;
  else if (firstBracket === -1) jsonStart = firstBrace;
  else jsonStart = Math.min(firstBrace, firstBracket);

  const isArray = cleaned[jsonStart] === "[";
  const closingChar = isArray ? "]" : "}";
  const lastClose = cleaned.lastIndexOf(closingChar);

  if (lastClose <= jsonStart) {
    throw new AiParseError("AI 응답에서 JSON 종료 문자를 찾을 수 없습니다.", raw.slice(0, 200));
  }

  const jsonStr = cleaned.slice(jsonStart, lastClose + 1);

  // 3. JSON 파싱
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new AiParseError("AI 응답의 JSON 파싱에 실패했습니다.", jsonStr.slice(0, 200));
  }

  // 4. Zod 스키마 검증
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new AiParseError(`AI 응답이 예상 형식과 다릅니다: ${issues}`, jsonStr.slice(0, 200));
  }

  return result.data;
}
