/**
 * GET /api/ai/jobs/[id] — 비동기 AI 작업 상태 폴링 (2026-08-19)
 *
 *  응답: { id, feature, status, progress, result?, error?, createdAt, finishedAt }
 *    status = queued | running | succeeded | failed
 *    result 는 succeeded 일 때만, error 는 failed 일 때만 포함.
 *  본인 작업만(타인·미존재 → 404). 쿼터·ai-guard 없음(저렴한 읽기 — LLM 호출 없음).
 *  클라이언트 폴링 권장: 2s → 30s 이후 4s, 최대 6분. Cache-Control: no-store.
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAiJobForUser, toAiJobView } from "../../../_lib/ai-jobs";

export const runtime = "nodejs";
export const maxDuration = 10;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

  const { id } = await params;
  if (!id || !UUID_RE.test(id)) return NextResponse.json({ error: "작업을 찾을 수 없어요." }, { status: 404, headers: NO_STORE });

  const row = await getAiJobForUser(id, auth.userId);
  if (!row) return NextResponse.json({ error: "작업을 찾을 수 없어요." }, { status: 404, headers: NO_STORE });

  return NextResponse.json(toAiJobView(row), { headers: NO_STORE });
}
