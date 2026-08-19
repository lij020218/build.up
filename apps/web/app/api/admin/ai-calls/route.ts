/**
 * GET /api/admin/ai-calls — AI 호출 품질 (ai_call_log 관측 원장, 마이그 20260819_000003).
 *
 *  · 기능별 집계(24h / 7d): 호출수·성공률·폴백률·서킷스킵·p50/p95 ms·토큰 — SQL 함수 ai_call_stats(p_since)
 *    (원시 행을 앱으로 끌어오지 않는다. service role 전용 RPC).
 *  · 최근 실패 30건: feature·model·error·when.
 *  정직성: 블록별 독립 실패 → null → UI 에서 "—" + 사유. 내부 계정 제외는 하지 않는다(운영 품질 지표는
 *    운영자 호출도 똑같이 실패·지연을 겪으므로 — 사용량 통계와 다름).
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { adminRateLimit } from "../_shared";
import { AI_FEATURE_LIMITS } from "../../_lib/ai-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type AiCallStatRow = {
  feature: string;
  calls: number;
  okCalls: number;
  successPct: number;      // 0~100
  fallbackCalls: number;
  fallbackPct: number;     // 0~100
  circuitSkipped: number;
  p50Ms: number | null;
  p95Ms: number | null;
  inputTokens: number;
  outputTokens: number;
};
export type AiCallFailureRow = {
  at: string;
  feature: string | null;
  requestedModel: string | null;
  usedModel: string | null;
  fallback: boolean;
  circuitSkipped: boolean;
  ms: number | null;
  errorName: string | null;
  errorMessage: string | null;
};

const pct = (n: number, d: number): number => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
const num = (v: unknown): number => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

async function statsSince(admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>, sinceIso: string): Promise<AiCallStatRow[] | null> {
  try {
    const { data, error } = await admin.rpc("ai_call_stats", { p_since: sinceIso });
    if (error || !Array.isArray(data)) return null;
    return data.map((row) => {
      const r = row as Record<string, unknown>;
      const calls = num(r.calls);
      const okCalls = num(r.ok_calls);
      const fallbackCalls = num(r.fallback_calls);
      return {
        feature: typeof r.feature === "string" ? r.feature : "(unknown)",
        calls, okCalls, successPct: pct(okCalls, calls),
        fallbackCalls, fallbackPct: pct(fallbackCalls, calls),
        circuitSkipped: num(r.circuit_skipped),
        p50Ms: numOrNull(r.p50_ms), p95Ms: numOrNull(r.p95_ms),
        inputTokens: num(r.input_tokens), outputTokens: num(r.output_tokens),
      };
    }).sort((a, b) => b.calls - a.calls);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const now = Date.now();
  const since24h = new Date(now - 24 * 3_600_000).toISOString();
  const since7d = new Date(now - 7 * 86_400_000).toISOString();

  const [stats24h, stats7d] = await Promise.all([statsSince(admin, since24h), statsSince(admin, since7d)]);

  let recentFailures: AiCallFailureRow[] | null = null;
  try {
    const { data, error } = await admin
      .from("ai_call_log")
      .select("created_at, feature, requested_model, used_model, fallback, circuit_skipped, ms, error_name, error_message")
      .eq("ok", false)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error && Array.isArray(data)) {
      recentFailures = data.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          at: typeof r.created_at === "string" ? r.created_at : "",
          feature: str(r.feature),
          requestedModel: str(r.requested_model),
          usedModel: str(r.used_model),
          fallback: Boolean(r.fallback),
          circuitSkipped: Boolean(r.circuit_skipped),
          ms: numOrNull(r.ms),
          errorName: str(r.error_name),
          errorMessage: str(r.error_message),
        };
      });
    }
  } catch {
    recentFailures = null;
  }

  // 초기화 폼의 기능 select 용 — 한도 표 SSOT(ai-guard) 를 클라이언트에 복제하지 않는다
  const features = Object.keys(AI_FEATURE_LIMITS);
  return NextResponse.json({ ok: true, stats24h, stats7d, recentFailures, features, generatedAt: new Date(now).toISOString() });
}
