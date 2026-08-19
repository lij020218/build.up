import { generateDashboardActions, enrichDashboardContext } from "@foundone/ai";
import type { DashboardContext } from "@foundone/ai";
import { NextResponse } from "next/server";
import { runAiFeature } from "../../../_lib/ai-guard";
import { getAnthropicApiKey } from "../../../_lib/env";
import { fetchRecentNegativeFeedbackLines, buildNegativeFeedbackBlock } from "../../../_lib/coaching-feedback";
import { fetchBehaviorBlock } from "../../../_lib/coaching-behavior";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  // 입력 검증은 게이트(차감) 전에 — 잘못된 입력은 절대 차감하지 않는다.
  let body: DashboardContext;
  try {
    body = (await request.json()) as DashboardContext;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.industryCategoryId || !body.storeName) {
    return NextResponse.json({ error: "industryCategoryId and storeName are required." }, { status: 400 });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 500 });
  }

  // 2026-08-19 ai-guard: 분·일·주·월 한도 + 실패 시 전액 환불.
  //  파싱 실패는 throw → 게이트가 1회 재시도, 그래도 실패면 빈 fallback(200) + 환불(대시보드 히어로 보호).
  return runAiFeature({ request, feature: "dashboard-actions" }, async ({ userId, refund }) => {
    const enrichedCtx = enrichDashboardContext(body);
    // 자가개선: 사장님이 최근 "안 맞아요"로 표시한 코칭을 prompt 에 주입 → 비슷한 코칭 회피.
    const negativeFeedbackBlock = buildNegativeFeedbackBlock(
      await fetchRecentNegativeFeedbackLines(userId, { source: "dashboard-actions" }),
    );
    // 행동 루프(2026-08-01): 코칭 일지 실행/무시 패턴 — 실행 유형 심화, 무시 유형 반복 금지
    const behaviorBlock = await fetchBehaviorBlock(userId);
    const isJsonParseFailure = (message: string) =>
      message.includes("유효한 JSON") || message.includes("JSON") || message.includes("객체 형태");
    try {
      let result;
      try {
        result = await generateDashboardActions(enrichedCtx, { apiKey, negativeFeedbackBlock, behaviorBlock });
      } catch (first) {
        // 파싱 실패는 라우트 레벨 1회 재시도 (게이트 재시도는 200 fallback 을 못 보므로 여기서)
        if (!isJsonParseFailure(first instanceof Error ? first.message : "")) throw first;
        console.warn("[ai/dashboard/actions] parse failed → retry once");
        result = await generateDashboardActions(enrichedCtx, { apiKey, negativeFeedbackBlock, behaviorBlock });
      }
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate actions.";
      // ⚡ Graceful fallback — LLM 이 가끔 잘린 JSON / 빈 응답 / 비-JSON 텍스트 반환.
      //   500 throw 하면 대시보드 hero가 깨짐. 빈 actions 로 정상 응답 → AI 진단 카드 자체 안 보임.
      //   우리 쪽 실패이므로 사용 횟수는 환불(refunded:true). 원인 분석은 server log 로.
      if (isJsonParseFailure(message)) {
        console.warn("[ai/dashboard/actions] LLM response parse failed, returning empty fallback (refunded):", message);
        await refund();
        return NextResponse.json({
          todayActions: [],
          crisisActions: [],
          insight: "",
          _fallback: true,
          _reason: "llm_parse_failed",
          refunded: true,
        });
      }
      // 모델·서버 오류 → 500 → 게이트가 환불 + 표준 재시도
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
