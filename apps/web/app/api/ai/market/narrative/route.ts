import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "../../../_lib/env";
import { interpretMarketScore } from "@foundone/ai";
import type { RecommendationItem } from "@foundone/shared";
import { runAiFeature } from "../../../_lib/ai-guard";

type RequestBody = {
  item?: unknown;
  categoryId?: string;
  startupType?: string;
};

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  // 입력 검증은 게이트(차감) 전에 — 잘못된 요청은 절대 차감되지 않는다 (2026-08-19 ai-guard 이관)
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "요청 본문이 유효한 JSON이 아닙니다." }, { status: 400 });
  }

  if (!body.item || typeof body.item !== "object") {
    return NextResponse.json({ error: "item 필드가 필요합니다." }, { status: 400 });
  }

  const apiKey = getAnthropicApiKey(); // OPENAI_API_KEY 우선(메인 LLM) — 종전 process.env.ANTHROPIC 직접 참조는 OpenAI 셔임에 Anthropic 키를 넘겨 401 (2026-08-19 prod 실측)
  if (!apiKey) {
    return NextResponse.json({ error: "AI가 설정되지 않았습니다." }, { status: 500 });
  }

  return runAiFeature(
    { request, feature: "market-narrative", failMessage: "내러티브 생성에 실패했습니다. 사용 횟수는 차감되지 않았어요." },
    async () => {
      // 실패(모델·파싱)는 throw → 가드가 1회 재시도 후 전액 환불 + 503
      const narrative = await interpretMarketScore(
        body.item as RecommendationItem,
        { categoryId: body.categoryId, startupType: body.startupType },
        { apiKey }
      );
      return NextResponse.json({ narrative });
    },
  );
}
