import { generateDashboardActions, enrichDashboardContext } from "@foundone/ai";
import type { DashboardContext } from "@foundone/ai";
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";
import { getAnthropicApiKey } from "../../../_lib/env";
import { fetchRecentNegativeFeedbackLines, buildNegativeFeedbackBlock } from "../../../_lib/coaching-feedback";
import { fetchBehaviorBlock } from "../../../_lib/coaching-behavior";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await checkSimpleRateLimit({
    key: `dashboard-actions:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
  }

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "dashboard-actions",
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
    // 자가개선: 사장님이 최근 "안 맞아요"로 표시한 코칭을 prompt 에 주입 → 비슷한 코칭 회피.
    const negativeFeedbackBlock = buildNegativeFeedbackBlock(
      await fetchRecentNegativeFeedbackLines(auth.userId, { source: "dashboard-actions" }),
    );
    // 행동 루프(2026-08-01): 코칭 일지 실행/무시 패턴 — 실행 유형 심화, 무시 유형 반복 금지
    const behaviorBlock = await fetchBehaviorBlock(auth.userId);
    const result = await generateDashboardActions(enrichedCtx, { apiKey, negativeFeedbackBlock, behaviorBlock });
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
