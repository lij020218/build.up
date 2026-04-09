import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { analyzeInterviews } from "@build-up/ai";
import type { InterviewAnalysisInput } from "@build-up/ai";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const apiKey = getAnthropicApiKey();
  if (!apiKey) return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다." }, { status: 503 });

  let body: InterviewAnalysisInput;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  if (!body.interviewNotes?.trim()) {
    return NextResponse.json({ error: "인터뷰 노트를 입력해주세요." }, { status: 400 });
  }

  try {
    const result = await analyzeInterviews(body, { apiKey });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: `분석 실패: ${error instanceof Error ? error.message : String(error)}` }, { status: 503 });
  }
}
