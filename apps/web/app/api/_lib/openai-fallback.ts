/**
 * OpenAI 직접 호출(response_format json_object / json_schema / Responses API 등 LlmClient 미지원 기능)용
 * 로컬 폴백 — 일시 오류(429/5xx/타임아웃/네트워크)·빈 응답이면 gpt-5.4-mini 로 1회 더 시도한다.
 *  (2026-08-19 사장님 3원칙 ②: 실패 확률 0 수렴. 입력 오류(400 계열)는 같은 입력이면 같은 400 이라 폴백 안 함.)
 *
 *  사용:
 *    const r = await withOpenAiFallback("gpt-5.6-luna", (model) => client.chat.completions.create({ model, ... }), "[cardnews]");
 *  `new OpenAI({ apiKey, maxRetries: OPENAI_SDK_MAX_RETRIES })` 로 SDK 재시도도 함께 켤 것.
 */
import { EmptyLlmResponseError, isTransientLlmError } from "@foundone/ai/utils/client";

export const OPENAI_SDK_MAX_RETRIES = 3;
export const OPENAI_FALLBACK_MODEL = "gpt-5.4-mini";

export async function withOpenAiFallback<T>(
  primaryModel: string,
  run: (model: string) => Promise<T>,
  logTag = "[openai-fallback]",
): Promise<T> {
  try {
    return await run(primaryModel);
  } catch (e) {
    if (!isTransientLlmError(e) && !(e instanceof EmptyLlmResponseError)) throw e;
    const fb = primaryModel === OPENAI_FALLBACK_MODEL ? primaryModel : OPENAI_FALLBACK_MODEL;
    console.warn(`${logTag} ${primaryModel} transient failure → fallback ${fb}:`, e instanceof Error ? e.message : String(e));
    return run(fb);
  }
}
