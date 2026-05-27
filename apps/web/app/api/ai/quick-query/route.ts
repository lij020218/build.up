import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { checkSimpleRateLimit, checkDailyRateLimit, peekRateLimit } from "../../_lib/rate-limit";
import { getAnthropicApiKey, getOpenAiApiKey } from "../../_lib/env";
import {
  askQuickQuery,
  formatInsightContext,
  retrieveInsightChunks,
} from "@build-up/ai";
import type { QuickQueryContext } from "@build-up/ai";
import { matchKHitCases } from "@build-up/shared";
import { supabase as supabaseAnon } from "../../../../lib/supabase";

const DAILY_LIMIT = 10;
const DAILY_KEY = (userId: string) => `daily:quick-query:${userId}`;

/**
 * AI 채팅 한도 정책:
 *  1) **일일 10회** — 사장님이 AI 의존도가 과해지지 않도록 + Anthropic API 비용 통제
 *  2) **분당 5회 (burst)** — 빠르게 연타하는 행위 방지 (사람은 천천히 생각하고 묻습니다)
 *
 * 응답 헤더로 X-RateLimit-Remaining / X-RateLimit-Reset 동봉 → UI 가 실시간으로 남은 횟수 표시.
 */

export const runtime = "nodejs";
export const maxDuration = 30; // Vercel function timeout

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // ── 1. 일일 한도 (가장 먼저 체크 — 매우 중요)
  const daily = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "quick-query",
    limit: DAILY_LIMIT,
    message: `오늘의 AI 채팅 횟수(${DAILY_LIMIT}회)를 모두 사용하셨습니다. 내일 다시 만나요.`,
  });
  if (!daily.ok) {
    return NextResponse.json(
      { error: daily.error, remaining: 0, limit: daily.limit, resetAt: daily.resetAt },
      { status: 429, headers: rateLimitHeaders(daily) }
    );
  }

  // ── 2. 버스트 방지 (분당 5회)
  const burst = await checkSimpleRateLimit({
    key: `quick-query-burst:${auth.userId}`,
    limit: 5,
    windowMs: 60_000,
    message: "잠깐 너무 빠릅니다. 1분만 기다려 주세요.",
  });
  if (!burst.ok) {
    return NextResponse.json(
      { error: burst.error, remaining: daily.remaining, limit: daily.limit, resetAt: daily.resetAt },
      { status: 429, headers: rateLimitHeaders(daily) }
    );
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 500 });
  }

  let body: QuickQueryContext;
  try {
    body = (await request.json()) as QuickQueryContext;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.question?.trim()) {
    return NextResponse.json({ error: "질문을 입력해주세요." }, { status: 400 });
  }
  // 너무 긴 질문 차단 (악의적 prompt injection 방지)
  if (body.question.length > 500) {
    return NextResponse.json({ error: "질문이 너무 깁니다 (최대 500자)." }, { status: 400 });
  }

  // 서버에서 K-히트 사례 자동 매칭 (사장님 업종 기반) — AI 가 답변 시 인용 가능
  const enrichedBody: QuickQueryContext = {
    ...body,
    matchedKHitCases: body.matchedKHitCases ?? matchKHitCases({
      categoryId: body.industryCategoryId,
      subIndustryId: body.industrySubIndustryId,
      limit: 3,
    }).map((c) => ({
      id: c.id,
      name: c.name.ko,
      oneLiner: c.oneLiner.ko,
      lesson: c.lesson.ko,
    })),
  };

  // ── RAG: 외부 인사이트 자료 검색 (실패해도 메인 답변은 진행) ──
  const openAiKey = getOpenAiApiKey();
  if (openAiKey && !enrichedBody.insightContext) {
    try {
      const chunks = await retrieveInsightChunks(
        body.question,
        {
          supabase: supabaseAnon as unknown as Parameters<typeof retrieveInsightChunks>[1]["supabase"],
          embed: { apiKey: openAiKey },
        },
        { matchCount: 4, minSimilarity: 0.4 },
      );
      const insightContext = formatInsightContext(chunks);
      if (insightContext) enrichedBody.insightContext = insightContext;
    } catch (err) {
      // RAG 실패는 답변 차단 사유가 아님 — 로그만 남기고 계속.
      console.warn("[quick-query] insight retrieval skipped:", err instanceof Error ? err.message : err);
    }
  }

  try {
    const result = await askQuickQuery(enrichedBody, { apiKey });
    return NextResponse.json(
      { ...result, remaining: daily.remaining, limit: daily.limit, resetAt: daily.resetAt },
      { headers: rateLimitHeaders(daily) }
    );
  } catch (err) {
    console.error("[quick-query] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to answer." },
      { status: 500 },
    );
  }
}

/**
 * GET — 현재 남은 횟수만 조회 (UI 가 채팅창 열 때 표시용)
 */
export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const status = await peekRateLimit({
    key: DAILY_KEY(auth.userId),
    limit: DAILY_LIMIT,
    windowMs: 24 * 60 * 60 * 1000,
  });
  return NextResponse.json(status, { headers: rateLimitHeaders(status) });
}

function rateLimitHeaders(s: { remaining: number; limit: number; resetAt: number }): HeadersInit {
  return {
    "X-RateLimit-Remaining": String(s.remaining),
    "X-RateLimit-Limit": String(s.limit),
    "X-RateLimit-Reset": String(Math.floor(s.resetAt / 1000)),
  };
}
