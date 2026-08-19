/**
 * POST /api/ai/roadmap/classify — 업종 분류 후보 (2026-08-03 분류 분리)
 *
 * AI 위저드의 "업종 확인" 스텝 전용: 아이디어 텍스트 → 후보 1~3개.
 * 확정은 사용자가 한다 (직접 로드맵의 업종 선택과 같은 행위) — 여기서는 추천만.
 *
 * 쿼터: 생성(3회)과 별도 — luna 회당 ~₩2 라 재분류를 부담 없이 허용.
 *  한도(분·일·주·월)·실패 환불은 ai-guard(AI_FEATURE_LIMITS "roadmap-classify") 가 담당 (2026-08-19).
 */
import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "../../../_lib/env";
import { runAiFeature } from "../../../_lib/ai-guard";
import { classifyIndustry } from "@foundone/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  // 입력 검증은 게이트(차감) 전에
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

  const apiKey = getAnthropicApiKey();
  if (!apiKey) return NextResponse.json({ ok: false, error: "AI 서비스를 일시적으로 사용할 수 없습니다." }, { status: 503 });

  return runAiFeature(
    { request, feature: "roadmap-classify", failMessage: "업종 분석에 실패했어요. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요." },
    async () => {
      // 실패는 throw → 가드가 1회 재시도 후 환불 + 503
      const result = await classifyIndustry(ideaText, { apiKey });
      return NextResponse.json({ ok: true, candidates: result.candidates });
    },
  );
}
