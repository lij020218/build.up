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
    const message = err instanceof Error ? err.message : "Failed to generate actions.";
    // ⚡ Graceful fallback — Claude가 가끔 잘린 JSON / 빈 응답 / 비-JSON 텍스트 반환.
    //   500 throw 하면 대시보드 hero가 깨짐. 빈 actions 로 정상 응답 → AI 진단 카드 자체 안 보임.
    //   원인 분석은 server log 로 (사장님 화면 보호 우선).
    const isJsonParseFailure =
      message.includes("유효한 JSON") ||
      message.includes("JSON") ||
      message.includes("객체 형태");
    if (isJsonParseFailure) {
      console.warn("[ai/dashboard/actions] LLM response parse failed, returning empty fallback:", message);
      return NextResponse.json({
        todayActions: [],
        crisisActions: [],
        insight: "",
        _fallback: true,
        _reason: "llm_parse_failed",
      });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
