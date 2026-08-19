/**
 * ai-call-log — LLM 호출 관측 (2026-08-19)
 *
 *  packages/ai utils/client.ts 가 호출 1건마다 내는 LlmCallEvent 를 받아 ai_call_log 에 적재한다.
 *  · 등록은 모듈 로드 시 1회(멱등) — ai-guard.ts 가 import 하므로 가드된 모든 AI 라우트에서 켜진다.
 *  · feature·userId 는 llmCallContext(AsyncLocalStorage) 에서 — 컨텍스트 없으면 null.
 *  · fire-and-forget: 적재 실패가 사용자 응답에 영향을 주면 안 된다(로그만).
 *  · service role 전용 테이블. 마이그 20260819_000003. 30일 자동 파기.
 */
import { setLlmCallObserver, llmCallContext, type LlmCallEvent } from "@foundone/ai/utils/client";
import { getSupabaseAdmin } from "./supabase-admin";

const ERROR_MESSAGE_MAX = 500;
const g = globalThis as unknown as { __foAiCallLogRegistered?: boolean };

export type AiCallLogRow = {
  user_id: string | null;
  feature: string | null;
  requested_model: string;
  used_model: string;
  ms: number;
  ok: boolean;
  fallback: boolean;
  circuit_skipped: boolean;
  input_tokens: number;
  output_tokens: number;
  error_name: string | null;
  error_message: string | null;
};

/** 이벤트 + 컨텍스트 → 행 (순수 함수, 테스트용 export) */
export function toAiCallLogRow(e: LlmCallEvent, ctx?: { feature?: string; userId?: string }): AiCallLogRow {
  return {
    user_id: ctx?.userId ?? null,
    feature: ctx?.feature ?? null,
    requested_model: e.requestedModel,
    used_model: e.usedModel,
    ms: Math.max(0, Math.round(e.ms)),
    ok: e.ok,
    fallback: e.fallback,
    circuit_skipped: e.circuitSkipped,
    input_tokens: Math.max(0, Math.round(e.inputTokens || 0)),
    output_tokens: Math.max(0, Math.round(e.outputTokens || 0)),
    error_name: e.errorName ?? null,
    error_message: e.errorMessage ? e.errorMessage.slice(0, ERROR_MESSAGE_MAX) : null,
  };
}

function onLlmCall(e: LlmCallEvent): void {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const ctx = llmCallContext.getStore();
  const row = toAiCallLogRow(e, ctx);
  void sb.from("ai_call_log").insert(row).then(({ error }) => {
    if (error) console.warn("[ai-call-log] insert failed:", error.message);
  }, (err: unknown) => {
    console.warn("[ai-call-log] insert threw:", err instanceof Error ? err.message : String(err));
  });
}

/** 관찰자 등록 — 몇 번 불려도 1회만. */
export function ensureAiCallLogObserver(): void {
  if (g.__foAiCallLogRegistered) return;
  g.__foAiCallLogRegistered = true;
  setLlmCallObserver(onLlmCall);
}

ensureAiCallLogObserver();
