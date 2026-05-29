import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getAnthropicApiKey } from "../../_lib/env";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../_lib/rate-limit";
import { generateInterviewScript } from "@foundone/ai";
import type { InterviewInput } from "@foundone/ai";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const rl = await checkSimpleRateLimit({
    key: `ai-interview:${auth.userId}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "interview",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다." }, { status: 503 });
  }

  let body: InterviewInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.problemStatement?.trim() || !body.targetCustomer?.trim()) {
    return NextResponse.json({ error: "문제 정의와 타겟 고객을 입력해주세요." }, { status: 400 });
  }

  try {
    const result = await generateInterviewScript(body, { apiKey });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `인터뷰지 생성 실패: ${message}` }, { status: 503 });
  }
}
