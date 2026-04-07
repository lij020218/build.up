import { generateDashboardActions, enrichDashboardContext } from "@build-up/ai";
import type { DashboardContext } from "@build-up/ai";
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
    key: `dashboard-actions:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 500 });
  }

  let body: DashboardContext;
  try {
    body = (await request.json()) as DashboardContext;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.industryCategoryId || !body.storeName) {
    return NextResponse.json({ error: "industryCategoryId and storeName are required." }, { status: 400 });
  }

  try {
    const enrichedCtx = enrichDashboardContext(body);
    const result = await generateDashboardActions(enrichedCtx, { apiKey });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate actions." },
      { status: 500 }
    );
  }
}
