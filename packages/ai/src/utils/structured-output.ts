/**
 * structured-output.ts — OpenAI Structured Outputs(response_format: json_schema, strict:true) 공용 타입·가드.
 *
 *  배경 (2026-08-19): parseLlmJson 4단계 복구 파서로도 "JSON 파싱 실패" 가 남는다 — 모델이 산문을 섞거나
 *  잘라 보내는 한 파서는 사후 처치일 뿐. Structured Outputs 는 디코딩 단계에서 스키마를 강제해
 *  **문법적으로 유효하고 스키마와 일치하는 JSON 만** 생성한다(거부 refusal 제외). parseLlmJson 은 안전망으로 유지.
 *
 *  strict 모드 제약 (OpenAI 문서 https://developers.openai.com/api/docs/guides/structured-outputs 기준):
 *   · 모든 object 는 `additionalProperties: false` + `required` 에 **모든** 키 나열(선택 필드 = `["T","null"]` 유니온)
 *   · 루트는 object (배열 루트·anyOf 루트 불가) → 배열 응답은 `{ items: [...] }` 로 감싼다
 *   · 지원 타입: string·number·integer·boolean·object·array·enum·anyOf / 미지원: allOf·not·if/then/else·dependentRequired
 *   · 중첩 10단계·총 속성 5,000개·enum 1,000개 상한
 *  아래 `validateStrictJsonSchema` 가 이 중 구조 규칙을 검사한다 — 단위 테스트(structured-output-schemas.test.ts)가
 *  모든 export 스키마에 대해 실행하므로, 스키마를 고치면 strict 를 깨뜨리기 전에 테스트가 잡는다.
 */

export type JsonSchemaObject = Record<string, unknown>;

/** LlmClient.messages.create 의 `response_schema` 필드 형식 */
export type ResponseSchema = {
  /** a-z A-Z 0-9 _ - , 최대 64자 */
  name: string;
  schema: JsonSchemaObject;
  /** 기본 true. 스키마가 strict 제약을 어기면 클라이언트가 false 로 1회 재시도 */
  strict?: boolean;
};

/** OpenAI chat.completions `response_format` 파라미터 생성 (직접 OpenAI 호출 라우트용) */
export function jsonSchemaResponseFormat(rs: ResponseSchema, strict: boolean = rs.strict ?? true) {
  return {
    type: "json_schema" as const,
    json_schema: { name: rs.name, strict, schema: rs.schema },
  };
}

/**
 * OpenAI 가 "스키마 자체" 를 거부한 400 인지 — 이 경우 strict:false 로 재시도할 가치가 있다.
 *  (입력 오류 400 일반과 구분: 메시지에 schema / response_format 언급)
 */
export function isSchemaRejectedError(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | undefined;
  if (!e || e.status !== 400) return false;
  const msg = String(e.message ?? "").toLowerCase();
  return msg.includes("schema") || msg.includes("response_format");
}

/** 모델이 구조화 출력을 거부(refusal)한 경우 — 같은 입력이면 같은 결과라 재시도·폴백 대상 아님 */
export class LlmRefusalError extends Error {
  readonly transient = false as const;
  constructor(public readonly model: string, public readonly refusal: string) {
    super(`LLM refused structured output (${model}): ${refusal.slice(0, 200)}`);
    this.name = "LlmRefusalError";
  }
}

// ─── strict 스키마 검증기 ─────────────────────────────────────────────────────

const SUPPORTED_TYPES = new Set(["string", "number", "integer", "boolean", "object", "array", "null"]);
const UNSUPPORTED_KEYWORDS = ["allOf", "not", "if", "then", "else", "dependentRequired", "patternProperties", "oneOf"];
const MAX_DEPTH = 10;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * strict 모드 구조 규칙 재귀 검사. 위반 목록을 반환(빈 배열 = 통과).
 *  · object: additionalProperties === false, required 가 properties 키와 집합으로 동일
 *  · type 은 지원 타입(또는 지원 타입 배열), enum/anyOf 는 허용, allOf·not·if 등은 금지
 *  · 루트는 object, 깊이 ≤ 10
 */
export function validateStrictJsonSchema(schema: unknown, path = "$", depth = 0): string[] {
  const errors: string[] = [];
  if (!isPlainObject(schema)) return [`${path}: schema must be an object`];
  if (depth > MAX_DEPTH) errors.push(`${path}: nesting deeper than ${MAX_DEPTH}`);
  if (depth === 0 && schema.type !== "object") errors.push(`${path}: root must be type "object"`);

  for (const kw of UNSUPPORTED_KEYWORDS) {
    if (kw in schema) errors.push(`${path}: unsupported keyword "${kw}"`);
  }

  // $ref 는 자식 검사 생략 (재귀 스키마)
  if (typeof schema.$ref === "string") return errors;

  const types = Array.isArray(schema.type) ? schema.type : schema.type !== undefined ? [schema.type] : [];
  for (const t of types) {
    if (typeof t !== "string" || !SUPPORTED_TYPES.has(t)) errors.push(`${path}: unsupported type ${JSON.stringify(t)}`);
  }
  if (types.length === 0 && !Array.isArray(schema.enum) && !Array.isArray(schema.anyOf)) {
    errors.push(`${path}: missing type/enum/anyOf`);
  }

  if (Array.isArray(schema.anyOf)) {
    if (depth === 0) errors.push(`${path}: root may not use anyOf`);
    schema.anyOf.forEach((s, i) => errors.push(...validateStrictJsonSchema(s, `${path}.anyOf[${i}]`, depth + 1)));
  }

  if (types.includes("object")) {
    if (schema.additionalProperties !== false) errors.push(`${path}: additionalProperties must be false`);
    const props = isPlainObject(schema.properties) ? schema.properties : null;
    if (!props) {
      errors.push(`${path}: object must declare properties`);
    } else {
      const keys = Object.keys(props);
      const required = Array.isArray(schema.required) ? (schema.required as unknown[]).map(String) : [];
      const missing = keys.filter((k) => !required.includes(k));
      const extra = required.filter((k) => !keys.includes(k));
      if (missing.length) errors.push(`${path}: required is missing ${JSON.stringify(missing)}`);
      if (extra.length) errors.push(`${path}: required lists unknown ${JSON.stringify(extra)}`);
      for (const k of keys) errors.push(...validateStrictJsonSchema(props[k], `${path}.${k}`, depth + 1));
    }
  }

  if (types.includes("array")) {
    if (schema.items === undefined) errors.push(`${path}: array must declare items`);
    else errors.push(...validateStrictJsonSchema(schema.items, `${path}[]`, depth + 1));
  }

  if (isPlainObject(schema.$defs)) {
    for (const [k, v] of Object.entries(schema.$defs)) errors.push(...validateStrictJsonSchema(v, `${path}.$defs.${k}`, depth + 1));
  }
  return errors;
}

/** 테스트·개발용 — 위반 시 throw */
export function assertStrictJsonSchema(rs: ResponseSchema): void {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(rs.name)) throw new Error(`response_schema name invalid: ${rs.name}`);
  const errs = validateStrictJsonSchema(rs.schema);
  if (errs.length) throw new Error(`response_schema "${rs.name}" violates strict mode:\n  ${errs.join("\n  ")}`);
}
