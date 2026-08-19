import { NextResponse } from "next/server";
import { requireApiUser } from "../../_lib/auth";
import { getRedisClient } from "../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { runAiFeature, limitsFor } from "../../_lib/ai-guard";
import { getAnthropicApiKey, getOpenAiApiKey } from "../../_lib/env";
import {
  askQuickQuery,
  formatInsightContext,
  retrieveInsightChunks,
} from "@foundone/ai";
import type { QuickQueryContext } from "@foundone/ai";
import { matchKHitCases } from "@foundone/shared";
import { supabase as supabaseAnon } from "../../../../lib/supabase";

const FEATURE = "quick-query";

/**
 * AI 채팅 한도 정책 (2026-08-19 ai-guard 이관):
 *  분당·일일·주간·월간 한도 = AI_FEATURE_LIMITS["quick-query"] (일 20 / 주 80 / 분당 6) + 월 ₩6,000 예산.
 *  서버·모델·파싱 실패 시 전액 환불(가드). 응답 헤더 X-RateLimit-* 는 일일 기준으로 유지 → UI 남은 횟수 표시.
 */

export const runtime = "nodejs";
export const maxDuration = 30; // Vercel function timeout

export async function POST(request: Request) {
  // ── 입력 검증은 게이트(차감) 전에 — 잘못된 요청은 절대 차감되지 않는다
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

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 500 });
  }

  return runAiFeature(
    { request, feature: FEATURE, failMessage: "답변 생성에 실패했습니다. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요." },
    async (ctx) => {
      const daily = {
        remaining: Math.max(0, ctx.limits.daily - ctx.usage.dayUsed),
        limit: ctx.limits.daily,
        resetAt: nextKstMidnightMs(),
      };

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

      // 모델·파싱 실패는 throw → 가드가 1회 재시도 후 전액 환불 + 503
      const result = await askQuickQuery(enrichedBody, { apiKey });
      return NextResponse.json(
        { ...result, remaining: daily.remaining, limit: daily.limit, resetAt: daily.resetAt },
        { headers: rateLimitHeaders(daily) }
      );
    },
  );
}

/**
 * GET — 현재 남은 횟수만 조회 (UI 가 채팅창 열 때 표시용). 차감 없음.
 *  ai-guard 의 일일 카운터를 읽기만 한다 (Redis 키 → Supabase 원장 → 한도 그대로).
 */
export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const limit = limitsFor(FEATURE).daily;
  const used = await peekDailyUsed(auth.userId);
  const status = { remaining: Math.max(0, limit - used), limit, resetAt: nextKstMidnightMs() };
  return NextResponse.json(status, { headers: rateLimitHeaders(status) });
}

/** ai-guard consumePeriod("day") 와 동일한 저장소 순서로 오늘 사용량을 읽는다 (키 포맷: ai-guard periodKey 미러). */
async function peekDailyUsed(userId: string): Promise<number> {
  const day = new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
  const redis = getRedisClient();
  if (redis) {
    try {
      const n = await redis.get<number | string | null>(`@buildup/aiq:day:${day}:${FEATURE}:${userId}`);
      return Math.max(0, Number(n ?? 0) || 0);
    } catch { /* fallthrough */ }
  }
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { data } = await sb.from("ai_daily_usage").select("count")
        .eq("user_id", userId).eq("feature", FEATURE).eq("usage_date", day).maybeSingle();
      return Math.max(0, Number((data as { count?: unknown } | null)?.count ?? 0) || 0);
    } catch { /* fallthrough */ }
  }
  return 0;
}

function nextKstMidnightMs(): number {
  const kst = new Date(Date.now() + 9 * 3_600_000);
  const nextKst = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + 1);
  return nextKst - 9 * 3_600_000;
}

function rateLimitHeaders(s: { remaining: number; limit: number; resetAt: number }): HeadersInit {
  return {
    "X-RateLimit-Remaining": String(s.remaining),
    "X-RateLimit-Limit": String(s.limit),
    "X-RateLimit-Reset": String(Math.floor(s.resetAt / 1000)),
  };
}
