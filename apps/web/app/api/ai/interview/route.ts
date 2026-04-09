import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getAnthropicApiKey } from "../../_lib/env";
import { generateInterviewScript } from "@build-up/ai";
import type { InterviewInput } from "@build-up/ai";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
