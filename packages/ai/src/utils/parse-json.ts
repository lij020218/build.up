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
 * 던지지 않는 best-effort JSON 추출 — 코드펜스 + 앞뒤 산문 제거.
 *  첫 `{`/`[` ~ 마지막 `}`/`]` 경계를 잘라냄. 경계를 못 찾으면 trim 된 원본을 반환
 *  (호출처의 JSON.parse 가 자체 에러를 던지도록 — 에러 클래스/문구를 호출처가 통제).
 *  gpt 가 "다음은 결과입니다:\n{...}" 처럼 산문을 붙여도 안전. 약한 펜스-only 클리너 대체용.
 */
export function looseExtractJson(raw: string): string {
  let cleaned = raw.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  if (firstBrace === -1 && firstBracket === -1) return cleaned;

  let jsonStart: number;
  if (firstBrace === -1) jsonStart = firstBracket;
  else if (firstBracket === -1) jsonStart = firstBrace;
  else jsonStart = Math.min(firstBrace, firstBracket);

  const closingChar = cleaned[jsonStart] === "[" ? "]" : "}";
  const lastClose = cleaned.lastIndexOf(closingChar);
  if (lastClose <= jsonStart) return cleaned;

  return cleaned.slice(jsonStart, lastClose + 1);
}

/**
 * AI 응답에서 JSON 텍스트(객체/배열)만 robust 추출. 못 찾으면 AiParseError.
 *  (parseAiJsonResponse 전용 — Zod 검증 경로.)
 */
export function extractJsonText(raw: string): string {
  const out = looseExtractJson(raw);
  const head = out.trimStart();
  if (!head.startsWith("{") && !head.startsWith("[")) {
    throw new AiParseError("AI 응답에서 JSON을 찾을 수 없습니다.", raw.slice(0, 200));
  }
  return out;
}

/**
 * AI 응답에서 JSON을 안전하게 추출하고 Zod 스키마로 검증.
 * 마크다운 코드블록, 앞뒤 텍스트 등을 자동 제거.
 */
export function parseAiJsonResponse<T>(raw: string, schema: ZodType<T>): T {
  const jsonStr = extractJsonText(raw);

  // JSON 파싱
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
