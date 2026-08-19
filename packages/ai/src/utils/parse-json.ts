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

// ─────────────────────────────────────────────────────────────
// parseLlmJson — 모든 AI 라우트 공용 robust 파서 (2026-08-19 "실패 확률 0 수렴")
//   1) 그대로 JSON.parse
//   2) 코드펜스·산문 제거(looseExtractJson) 후 파싱
//   3) 흔한 오염 수리: 후행 콤마 제거, 스마트 따옴표 → ", 문자열 내 개행 이스케이프
//   4) max_tokens 로 잘린 JSON 복구(닫히지 않은 {[" 보충) 후 파싱
//   전부 실패하면 AiParseError (호출처는 ai-guard 가 재시도·환불).
// ─────────────────────────────────────────────────────────────
export function repairTruncatedJson(s: string): string {
  let depth = 0, inString = false, escapeNext = false, lastValidEnd = -1;
  const stack: Array<"object" | "array"> = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === "\\") { escapeNext = true; continue; }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") { stack.push("object"); depth++; }
    else if (ch === "[") { stack.push("array"); depth++; }
    else if (ch === "}" || ch === "]") { stack.pop(); depth--; if (depth === 0) lastValidEnd = i; }
  }
  if (depth === 0) return s;
  if (lastValidEnd >= 0) return s.slice(0, lastValidEnd + 1);
  let out = s;
  if (inString) out += '"';
  // 마지막 미완성 키/값 꼬리("key": 또는 , ) 정리
  out = out.replace(/,\s*$/, "").replace(/"[^"]*"\s*:\s*$/, "").replace(/,\s*$/, "");
  while (stack.length > 0) out += stack.pop() === "object" ? "}" : "]";
  return out;
}

function fixCommonJsonDamage(s: string): string {
  return s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    // 문자열 안의 실제 개행 → \n (키/값 사이의 개행은 JSON.parse 가 허용하므로 문자열 안만 노린다)
    .replace(/"(?:[^"\\]|\\.)*"/g, (m) => m.replace(/\r?\n/g, "\\n"));
}

export function parseLlmJson<T = unknown>(raw: string): T {
  const attempts: Array<() => string> = [
    () => raw,
    () => looseExtractJson(raw),
    () => fixCommonJsonDamage(looseExtractJson(raw)),
    () => repairTruncatedJson(fixCommonJsonDamage(looseExtractJson(raw))),
  ];
  let lastErr: unknown = null;
  for (const get of attempts) {
    try {
      const txt = get().trim();
      if (!txt) continue;
      return JSON.parse(txt) as T;
    } catch (e) { lastErr = e; }
  }
  throw new AiParseError(`AI 응답 JSON 파싱 실패: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`, raw.slice(0, 200));
}

/** parseLlmJson + Zod 검증 (schema 실패도 AiParseError) */
export function parseLlmJsonWith<T>(raw: string, schema: ZodType<T>): T {
  const parsed = parseLlmJson<unknown>(raw);
  const r = schema.safeParse(parsed);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new AiParseError(`AI 응답이 예상 형식과 다릅니다: ${issues}`, raw.slice(0, 200));
  }
  return r.data;
}
