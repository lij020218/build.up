import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "../../../_lib/env";
import { generateStageBrief } from "@foundone/ai";
import type { StageBriefParams } from "@foundone/ai";
import { runAiFeature } from "../../../_lib/ai-guard";

const VALID_STAGE_IDS = [
  "industry-selection",
  "startup-type",
  "business-model",
  "budget-setup",
  "location-candidates",
  "contract-review",
  "opening-preparation",
  "permit-guide",
  "tax-guide",
  "loan-guide"
] as const;

type RequestBody = {
  stageId?: string;
  categoryId?: string;
  startupType?: string;
  capital?: number;
  businessModelId?: string;
};

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  // 입력 검증은 게이트(차감) 전에 (2026-08-19 ai-guard 이관 — 한도·환불은 AI_FEATURE_LIMITS "stage-brief")
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "요청 본문이 유효한 JSON이 아닙니다." }, { status: 400 });
  }

  if (!body.stageId || !VALID_STAGE_IDS.includes(body.stageId as (typeof VALID_STAGE_IDS)[number])) {
    return NextResponse.json(
      { error: `stageId는 필수이며 유효한 단계 ID여야 합니다: ${VALID_STAGE_IDS.join(", ")}` },
      { status: 400 }
    );
  }

  const apiKey = getAnthropicApiKey(); // OPENAI_API_KEY 우선(메인 LLM) — 종전 process.env.ANTHROPIC 직접 참조는 OpenAI 셔임에 Anthropic 키를 넘겨 401 (2026-08-19 prod 실측)
  if (!apiKey) {
    return NextResponse.json({ error: "AI가 설정되지 않았습니다." }, { status: 500 });
  }

  const params: StageBriefParams = {
    stageId: body.stageId,
    categoryId: body.categoryId,
    startupType: body.startupType,
    capital: typeof body.capital === "number" ? body.capital : undefined,
    businessModelId: body.businessModelId
  };

  return runAiFeature(
    { request, feature: "stage-brief", failMessage: "단계 브리핑 생성에 실패했습니다. 사용 횟수는 차감되지 않았어요." },
    async () => {
      // 실패는 throw → 가드가 1회 재시도 후 전액 환불 + 503
      const brief = await generateStageBrief(params, { apiKey });
      return NextResponse.json({ stageId: body.stageId, brief });
    },
  );
}
