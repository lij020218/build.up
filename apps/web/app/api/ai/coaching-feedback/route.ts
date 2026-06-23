/**
 * POST /api/ai/coaching-feedback — AI 코칭 피드백 기록(도움됨/안맞음 + 이유).
 *   웹·iOS 공통. (user_id, insight_key) upsert → 재토글 시 갱신.
 *   기록된 '안맞음'은 다음 코칭 생성 시 prompt 에 주입돼 자가개선(fetchRecentNegativeFeedbackLines).
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import {
  recordCoachingFeedback,
  type FeedbackSource,
  type FeedbackVerdict,
  type FeedbackReason,
} from "../../_lib/coaching-feedback";

export const runtime = "nodejs";

const SOURCES: FeedbackSource[] = ["industry-daily", "dashboard-actions"];
const VERDICTS: FeedbackVerdict[] = ["up", "down"];
const REASONS: FeedbackReason[] = ["industry-mismatch", "already-know", "inaccurate", "hard-to-act"];

type Body = {
  source?: string;
  insightKey?: string;
  headline?: string;
  category?: string | null;
  targetCard?: string | null;
  industryCategoryId?: string | null;
  specialtyId?: string | null;
  verdict?: string;
  reason?: string | null;
};

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const source = body.source as FeedbackSource;
  const verdict = body.verdict as FeedbackVerdict;
  if (!SOURCES.includes(source)) return NextResponse.json({ ok: false, error: "Invalid source" }, { status: 400 });
  if (!VERDICTS.includes(verdict)) return NextResponse.json({ ok: false, error: "Invalid verdict" }, { status: 400 });
  if (!body.insightKey || !body.headline) {
    return NextResponse.json({ ok: false, error: "insightKey and headline required" }, { status: 400 });
  }
  const reason = body.reason && REASONS.includes(body.reason as FeedbackReason)
    ? (body.reason as FeedbackReason)
    : null;

  const result = await recordCoachingFeedback({
    userId: auth.userId,
    source,
    insightKey: String(body.insightKey).slice(0, 200),
    headline: String(body.headline).slice(0, 300),
    category: body.category ?? null,
    targetCard: body.targetCard ?? null,
    industryCategoryId: body.industryCategoryId ?? null,
    specialtyId: body.specialtyId ?? null,
    verdict,
    reason,
  });

  // 테이블 미존재 등은 graceful — UI 가 안 깨지도록 200 + ok:false 로 안내(저장 실패해도 코칭은 정상).
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
