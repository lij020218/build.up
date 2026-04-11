import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { generateRoadmap } from "@build-up/ai";
import type { RoadmapGenerationInput } from "@build-up/ai";

// Vercel serverless 함수 타임아웃: 120초 (Pro 플랜 필요)
export const maxDuration = 120;

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error("[roadmap/generate] ANTHROPIC_API_KEY missing. env value length:", process.env.ANTHROPIC_API_KEY?.length ?? 0);
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
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

  // 1차 시도 + 타임아웃 시 1회 리트라이
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generateRoadmap(body, { apiKey });
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = message.toLowerCase().includes("timeout") || message.toLowerCase().includes("timed out");
      console.error(`[roadmap/generate] Attempt ${attempt + 1} error:`, message);

      if (isTimeout && attempt === 0) {
        console.log("[roadmap/generate] Retrying after timeout...");
        continue; // 1회 리트라이
      }

      return NextResponse.json(
        { error: isTimeout
          ? "AI 분석에 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해 주세요."
          : `로드맵 생성 중 오류: ${message}` },
        { status: 503 }
      );
    }
  }
  return NextResponse.json({ error: "로드맵 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 503 });
}
