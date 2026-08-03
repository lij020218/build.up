/**
 * POST /api/ai/roadmap/classify — 업종 분류 후보 (2026-08-03 분류 분리)
 *
 * AI 위저드의 "업종 확인" 스텝 전용: 아이디어 텍스트 → 후보 1~3개.
 * 확정은 사용자가 한다 (직접 로드맵의 업종 선택과 같은 행위) — 여기서는 추천만.
 *
 * 쿼터: 생성(3회)과 별도 — luna 회당 ~₩2 라 재분류를 부담 없이 허용하되
 *  하루 30회로 남용만 차단. 월 ₩6,000 예산 미터에는 포함.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";
import { classifyIndustry } from "@foundone/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rl = await checkSimpleRateLimit({
    key: `ai-roadmap-classify:${auth.userId}`, limit: 10, windowMs: 60_000,
  });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const daily = await checkDailyRateLimit({
    userId: auth.userId, feature: "roadmap-classify", limit: 30,
    message: "오늘 업종 분석 횟수를 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!daily.ok) return NextResponse.json({ ok: false, error: daily.error }, { status: daily.status });

  const apiKey = getAnthropicApiKey();
  if (!apiKey) return NextResponse.json({ ok: false, error: "AI 서비스를 일시적으로 사용할 수 없습니다." }, { status: 503 });

  let ideaText = "";
  try {
    const body = await request.json();
    ideaText = String(body?.ideaText ?? "").trim().slice(0, 2000);
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (ideaText.length < 5) {
    return NextResponse.json({ ok: false, error: "아이디어를 조금 더 적어주세요." }, { status: 400 });
  }

  try {
    const result = await classifyIndustry(ideaText, { apiKey });
    return NextResponse.json({ ok: true, candidates: result.candidates });
  } catch (e) {
    console.error("[roadmap/classify] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "업종 분석에 실패했어요. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
}
