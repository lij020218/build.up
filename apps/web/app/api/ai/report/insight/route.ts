import { generateReportInsight } from "@build-up/ai";
import type { ReportInsightInput } from "@build-up/ai";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getAnthropicApiKey } from "../../../_lib/env";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = checkSimpleRateLimit({
    key: `report-insight:${auth.userId}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
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
