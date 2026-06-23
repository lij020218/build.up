/**
 * 코칭 피드백 자가개선 헬퍼 (서버).
 *
 *  - recordCoachingFeedback: 도움됨/안맞음(+이유) upsert.
 *  - fetchRecentNegativeFeedbackLines: 최근 '안맞음' 피드백을 코칭 prompt 주입용 한국어 라인으로.
 *    industry-daily(웹)·dashboard-actions(iOS) 코칭 라우트가 호출 → AI 가 사장님이 싫어한
 *    코칭·지표를 회피(사장님별 자가개선).
 *
 *  테이블 미존재(마이그레이션 미적용) 등은 graceful — 빈 결과 반환(코칭 자체는 정상 동작).
 */

import { getSupabaseAdmin } from "./supabase-admin";

export type FeedbackSource = "industry-daily" | "dashboard-actions";
export type FeedbackVerdict = "up" | "down";
export type FeedbackReason = "industry-mismatch" | "already-know" | "inaccurate" | "hard-to-act";

const REASON_KO: Record<FeedbackReason, string> = {
  "industry-mismatch": "우리 업종과 안 맞음",
  "already-know": "이미 알고 있음",
  "inaccurate": "부정확함",
  "hard-to-act": "실행하기 어려움",
};

export type RecordFeedbackInput = {
  userId: string;
  source: FeedbackSource;
  insightKey: string;
  headline: string;
  category?: string | null;
  targetCard?: string | null;
  industryCategoryId?: string | null;
  specialtyId?: string | null;
  verdict: FeedbackVerdict;
  reason?: FeedbackReason | null;
};

export async function recordCoachingFeedback(input: RecordFeedbackInput): Promise<{ ok: boolean; error?: string }> {
  const supa = getSupabaseAdmin();
  if (!supa) return { ok: false, error: "Supabase not configured" };
  const { error } = await supa
    .from("coaching_feedback")
    .upsert(
      {
        user_id: input.userId,
        source: input.source,
        insight_key: input.insightKey,
        headline: input.headline,
        category: input.category ?? null,
        target_card: input.targetCard ?? null,
        industry_category_id: input.industryCategoryId ?? null,
        specialty_id: input.specialtyId ?? null,
        verdict: input.verdict,
        reason: input.verdict === "down" ? (input.reason ?? null) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,insight_key" },
    );
  if (error) {
    console.warn("[coaching-feedback] upsert 실패:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * 최근 '안맞음' 피드백 → 코칭 prompt 주입용 라인. 비어 있으면 빈 배열.
 * @param limit 최근 몇 건 (기본 8)
 */
export async function fetchRecentNegativeFeedbackLines(
  userId: string,
  opts?: { source?: FeedbackSource; limit?: number },
): Promise<string[]> {
  const supa = getSupabaseAdmin();
  if (!supa) return [];
  try {
    let q = supa
      .from("coaching_feedback")
      .select("headline, reason, specialty_id, created_at")
      .eq("user_id", userId)
      .eq("verdict", "down")
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 8);
    if (opts?.source) q = q.eq("source", opts.source);
    const { data, error } = await q;
    if (error || !data) {
      if (error) console.warn("[coaching-feedback] fetch 실패 — graceful empty:", error.message);
      return [];
    }
    return data.map((r) => {
      const reasonKo = r.reason ? REASON_KO[r.reason as FeedbackReason] ?? r.reason : null;
      return reasonKo ? `"${r.headline}" (이유: ${reasonKo})` : `"${r.headline}"`;
    });
  } catch (e) {
    console.warn("[coaching-feedback] fetch 예외 — graceful empty:", e instanceof Error ? e.message : e);
    return [];
  }
}

/** prompt 주입 블록 — 비어 있으면 빈 문자열. */
export function buildNegativeFeedbackBlock(lines: string[]): string {
  if (lines.length === 0) return "";
  return `\n\n[사장님이 최근 "안 맞아요"로 표시한 코칭 — 비슷한 주제·지표·표현 회피, 같은 실수 반복 금지]\n${lines.map((l) => `- ${l}`).join("\n")}`;
}
