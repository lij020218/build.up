import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "../../../_lib/env";
import { runAiFeature } from "../../../_lib/ai-guard";
import { analyzeInterviews } from "@foundone/ai";
import type { InterviewAnalysisInput } from "@foundone/ai";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  // 입력 검증은 게이트(차감) 전에 — 잘못된 입력은 절대 차감하지 않는다.
  let body: InterviewAnalysisInput;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  if (!body?.interviewNotes?.trim()) {
    return NextResponse.json({ error: "인터뷰 노트를 입력해주세요." }, { status: 400 });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다." }, { status: 503 });

  // 2026-08-19 ai-guard: 분·일·주·월 한도 + 실패(throw) 시 1회 재시도 후 전액 환불 + 503.
  return runAiFeature(
    { request, feature: "interview-analyze", failMessage: "인터뷰 분석에 실패했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요." },
    async () => {
      const result = await analyzeInterviews(body, { apiKey });
      return NextResponse.json(result);
    },
  );
}
