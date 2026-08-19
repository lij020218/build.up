import { generateReportInsight } from "@foundone/ai";
import type { ReportInsightInput } from "@foundone/ai";
import { NextResponse } from "next/server";
import { runAiFeature } from "../../../_lib/ai-guard";
import { getAnthropicApiKey } from "../../../_lib/env";

export const runtime = "nodejs";
export const maxDuration = 90; // Vercel function timeout

export async function POST(request: Request) {
  // 입력 검증은 게이트(차감) 전에 (2026-08-19 ai-guard 이관)
  let body: ReportInsightInput;
  try {
    body = (await request.json()) as ReportInsightInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.period || !body.periodLabel || !body.industry) {
    return NextResponse.json({ error: "period, periodLabel, industry are required." }, { status: 400 });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 500 });
  }

  return runAiFeature(
    { request, feature: "report-insight", failMessage: "인사이트 생성 중 오류가 발생했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요." },
    async () => {
      // 모델·파싱 실패는 throw → 가드가 1회 재시도 후 전액 환불 + 503 (내부 상세는 가드 로그에만)
      const insight = await generateReportInsight(body, { apiKey });
      return NextResponse.json({ insight });
    },
  );
}
