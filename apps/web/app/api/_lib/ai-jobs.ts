/**
 * ai-jobs — 장시간 AI 생성의 비동기 작업 원장 헬퍼 (2026-08-19)
 *
 *  왜: 로드맵 생성(Pass1+Pass2)이 prod 에서 120s 를 넘겨 클라이언트/플랫폼 타임아웃이 났다.
 *    사장님 규칙 — "타임아웃은 정말 심각한 버그". 라우트는 202 {jobId} 를 즉시 돌려주고
 *    실제 생성은 같은 인보케이션의 `after()`(next/server, Next 15.1+ 안정) 에서 계속한다.
 *    `after` 는 라우트의 maxDuration 만큼 살아 있으므로(Vercel waitUntil) 별도 큐 없이도 된다.
 *    클라이언트(웹·iOS)는 GET /api/ai/jobs/[id] 로 폴링.
 *
 *  계약(웹·iOS 공통):
 *    POST <feature route>  + 헤더 `x-ai-async: 1`  → 202 { jobId, status:"queued" }
 *    GET  /api/ai/jobs/[id]                          → { id, status, progress, result?, error? }
 *      status: queued | running | succeeded | failed
 *
 *  쓰기는 전부 service role(RLS 우회) — 클라이언트 쓰기 정책 없음. 읽기는 user_id 필터 필수.
 *  DB 가 없으면(로컬 dev 미설정) null 을 돌려주고 라우트는 동기 모드로 폴백한다.
 */

import { getSupabaseAdmin } from "./supabase-admin";

export type AiJobStatus = "queued" | "running" | "succeeded" | "failed";

export type AiJobRow = {
  id: string;
  user_id: string;
  feature: string;
  status: AiJobStatus;
  input: unknown;
  result: unknown;
  error: string | null;
  progress: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  expires_at: string;
};

/** 클라이언트에 노출하는 형태 (user_id·input 제외) */
export type AiJobView = {
  id: string;
  feature: string;
  status: AiJobStatus;
  progress: string | null;
  result?: unknown;
  error?: string | null;
  createdAt: string;
  finishedAt: string | null;
};

export function toAiJobView(row: AiJobRow): AiJobView {
  return {
    id: row.id,
    feature: row.feature,
    status: row.status,
    progress: row.progress,
    ...(row.status === "succeeded" ? { result: row.result } : {}),
    ...(row.status === "failed" ? { error: row.error } : {}),
    createdAt: row.created_at,
    finishedAt: row.finished_at,
  };
}

/** 요청이 비동기 모드를 원하는지 — 헤더 `x-ai-async: 1` 만 인정(기본은 동기: 출시된 iOS 1.0.0(5) 호환). */
export function wantsAsyncJob(request: Request): boolean {
  const h = request.headers.get("x-ai-async");
  if (h === "1" || h === "true") {
    // 명시적 동기 강제(`x-ai-sync: 1` 또는 ?sync=1)가 같이 오면 동기 우선
    if (request.headers.get("x-ai-sync") === "1") return false;
    try { if (new URL(request.url).searchParams.get("sync") === "1") return false; } catch { /* ignore */ }
    return true;
  }
  return false;
}

/** queued 행 생성. DB 미설정/실패 시 null (호출부는 동기 모드로 폴백). */
export async function createAiJob(params: { userId: string; feature: string; input?: unknown }): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("ai_jobs")
      .insert({ user_id: params.userId, feature: params.feature, status: "queued", input: params.input ?? null })
      .select("id")
      .single();
    if (error || !data?.id) {
      console.error("[ai-jobs] insert failed:", error?.message);
      return null;
    }
    return String(data.id);
  } catch (e) {
    console.error("[ai-jobs] insert threw:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

async function patchJob(id: string, patch: Record<string, unknown>): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  try {
    const { error } = await sb.from("ai_jobs").update(patch).eq("id", id);
    if (error) console.error(`[ai-jobs] update ${id.slice(0, 8)} failed:`, error.message);
  } catch (e) {
    console.error(`[ai-jobs] update ${id.slice(0, 8)} threw:`, e instanceof Error ? e.message : String(e));
  }
}

export async function markAiJobRunning(id: string, progress?: string): Promise<void> {
  await patchJob(id, { status: "running", started_at: new Date().toISOString(), ...(progress ? { progress } : {}) });
}

/** 진행 문구만 갱신 (Pass1/Pass2 경계 등). 실패해도 무시 — 진행 표시는 best-effort. */
export async function setAiJobProgress(id: string, progress: string): Promise<void> {
  await patchJob(id, { progress });
}

export async function markAiJobSucceeded(id: string, result: unknown): Promise<void> {
  await patchJob(id, { status: "succeeded", result, error: null, progress: null, finished_at: new Date().toISOString() });
}

export async function markAiJobFailed(id: string, error: string): Promise<void> {
  await patchJob(id, { status: "failed", error: error.slice(0, 2_000), progress: null, finished_at: new Date().toISOString() });
}

/** 본인 것만. 없거나 타인 것이면 null. */
export async function getAiJobForUser(id: string, userId: string): Promise<AiJobRow | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("ai_jobs")
    .select("id, user_id, feature, status, input, result, error, progress, created_at, started_at, finished_at, expires_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error(`[ai-jobs] select ${id.slice(0, 8)} failed:`, error.message);
    return null;
  }
  return (data as AiJobRow | null) ?? null;
}
