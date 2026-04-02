import { NextResponse } from "next/server";
import { interpretMarketScore } from "@build-up/ai";
import type { RecommendationItem } from "@build-up/shared";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";

type RequestBody = {
  item?: unknown;
  categoryId?: string;
  startupType?: string;
};

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = checkSimpleRateLimit({
    key: `market-narrative:${auth.userId}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "요청 본문이 유효한 JSON이 아닙니다." }, { status: 400 });
  }

  if (!body.item || typeof body.item !== "object") {
    return NextResponse.json({ error: "item 필드가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const narrative = await interpretMarketScore(
      body.item as RecommendationItem,
      { categoryId: body.categoryId, startupType: body.startupType },
      { apiKey }
    );

    return NextResponse.json({ narrative });
  } catch (error) {
    return NextResponse.json(
      { error: "내러티브 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
