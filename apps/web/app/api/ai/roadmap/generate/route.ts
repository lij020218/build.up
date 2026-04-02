import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { generateRoadmap } from "@build-up/ai";
import type { RoadmapGenerationInput } from "@build-up/ai";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI 서비스가 설정되지 않았습니다." }, { status: 500 });
  }

  let body: RoadmapGenerationInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.ideaText?.trim()) {
    return NextResponse.json({ error: "사업 아이디어를 입력해주세요." }, { status: 400 });
  }

  try {
    const result = await generateRoadmap(body, { apiKey });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[roadmap/generate] Error:", message);
    return NextResponse.json({ error: `로드맵 생성 중 오류: ${message}` }, { status: 500 });
  }
}
