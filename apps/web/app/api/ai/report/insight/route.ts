import { generateReportInsight } from "@foundone/ai";
import type { ReportInsightInput } from "@foundone/ai";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";
import { getAnthropicApiKey } from "../../../_lib/env";

export const runtime = "nodejs";
export const maxDuration = 90; // Vercel function timeout

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await checkSimpleRateLimit({
    key: `report-insight:${auth.userId}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "report-insight",
    limit: 30,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 500 });
  }

  let body: ReportInsightInput;
  try {
    body = (await request.json()) as ReportInsightInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.period || !body.periodLabel || !body.industry) {
    return NextResponse.json({ error: "period, periodLabel, industry are required." }, { status: 400 });
  }

  try {
    const insight = await generateReportInsight(body, { apiKey });
    return NextResponse.json({ insight });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate insight." },
      { status: 500 }
    );
  }
}
