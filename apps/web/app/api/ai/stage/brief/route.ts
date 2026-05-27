import { NextResponse } from "next/server";
import { generateStageBrief } from "@build-up/ai";
import type { StageBriefParams } from "@build-up/ai";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

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
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await checkSimpleRateLimit({
    key: `stage-brief:${auth.userId}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "stage-brief",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
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

  try {
    const brief = await generateStageBrief(params, { apiKey });
    return NextResponse.json({ stageId: body.stageId, brief });
  } catch (error) {
    return NextResponse.json(
      { error: "단계 브리핑 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
