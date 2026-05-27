import {
  answerGuideQuestion,
  buildGuideContextBlock,
  deriveGuideQaConfidence,
  loadKnowledgeRecordById,
  type GuideQaRequest,
  type GuideQaAnswer,
  type Language
} from "@build-up/shared";
import { interpretGuideQuestion } from "@build-up/ai";
import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";
import { requireApiUser } from "../../../_lib/auth";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

type RequestBody = {
  guideId?: string;
  question?: string;
  language?: Language;
};

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: Request) {
  const route = "/api/ai/guides/ask";
  const requestId = getRequestId(request);
  try {
    const auth = await requireApiUser(request);
    if (!auth.ok) {
      logApiEvent("warn", {
        area: "ai",
        route,
        requestId,
        event: "auth_failed",
        status: auth.status,
        detail: auth.error
      });
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rateLimit = await checkSimpleRateLimit({
      key: `guide:${auth.userId}`,
      limit: 20,
      windowMs: 60_000
    });
    if (!rateLimit.ok) {
      logApiEvent("warn", {
        area: "ai",
        route,
        requestId,
        event: "rate_limited",
        userId: auth.userId,
        status: rateLimit.status,
        detail: rateLimit.error
      });
      return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
    }

    // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
    const dailyLimit = await checkDailyRateLimit({
      userId: auth.userId,
      feature: "guides-ask",
      limit: 30,
      message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
    });
    if (!dailyLimit.ok) {
      logApiEvent("warn", {
        area: "ai",
        route,
        requestId,
        event: "rate_limited",
        userId: auth.userId,
        status: dailyLimit.status,
        detail: dailyLimit.error,
      });
      return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
    }

    const body = (await request.json()) as RequestBody;

    if (!body.guideId || !body.question?.trim()) {
      return NextResponse.json(
        {
          error: "guideId and question are required."
        },
        { status: 400 }
      );
    }

    const guide = await loadKnowledgeRecordById(supabase, body.guideId);

    if (!guide) {
      return NextResponse.json(
        {
          error: "Guide not found."
        },
        { status: 404 }
      );
    }

    const language = body.language ?? "ko";
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let answer: GuideQaAnswer;

    if (apiKey) {
      try {
        const interpreted = await interpretGuideQuestion(guide, body.question, language, {
          apiKey
        });
        const firstSource = interpreted.context.sources[0];
        const citations = interpreted.context.sources.length
          ? interpreted.context.sections.slice(0, 2).map((section) => ({
              guideId: interpreted.context.guideId,
              title: interpreted.context.title,
              sourceName: firstSource?.sourceName ?? "",
              sourceUrl: firstSource?.sourceUrl,
              sectionTitle: section.title
            }))
          : [];
        const fallbackContext = buildGuideContextBlock(guide, language);
        const normalizedQuestionTokens = body.question
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .split(/\s+/)
          .map((token) => token.trim())
          .filter(Boolean);
        const matchedSections = fallbackContext.sections.filter((section) => {
          const content = `${section.title} ${section.items.join(" ")}`.toLowerCase();
          return normalizedQuestionTokens.some((token) => content.includes(token));
        });

        answer = {
          shortAnswer: interpreted.answer.shortAnswer,
          explanation: interpreted.answer.explanation,
          reasons: [],
          cautions: interpreted.answer.cautions,
          nextActions: interpreted.answer.nextActions,
          confidence: deriveGuideQaConfidence({
            proposedConfidence: interpreted.answer.confidence,
            matchedSectionsCount: matchedSections.length,
            topMatchScore: matchedSections.length > 0 ? 2 : 0,
            hasCitations: citations.length > 0,
            freshness: fallbackContext.freshness,
            sourceConfidence: guide.sources[0]?.confidence
          }),
          citations
        };
      } catch {
        logApiEvent("warn", {
          area: "ai",
          route,
          requestId,
          event: "fallback_used",
          userId: auth.userId,
          meta: {
            mode: "model_failed"
          }
        });
        answer = answerGuideQuestion({
          question: body.question,
          language,
          guide
        } satisfies GuideQaRequest);
        answer = {
          ...answer,
          confidence: "check_needed",
          cautions: [
            ...(answer.cautions ?? []),
            language === "ko"
              ? "AI 해석 경로에 문제가 있어 기본 가이드 답변으로 전환되었습니다."
              : "The AI path failed, so the answer fell back to the built-in guide interpreter."
          ]
        };
      }
    } else {
      logApiEvent("info", {
        area: "ai",
        route,
        requestId,
        event: "fallback_used",
        userId: auth.userId,
        meta: {
          mode: "missing_api_key"
        }
      });
      answer = answerGuideQuestion({
        question: body.question,
        language,
        guide
      } satisfies GuideQaRequest);
      answer = {
        ...answer,
        confidence: "check_needed"
      };
    }

    return NextResponse.json(answer satisfies GuideQaAnswer, {
      headers: {
        "x-request-id": requestId
      }
    });
  } catch (error) {
    logApiError(route, "request_failed", error, {
      requestId,
      status: 500
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to answer guide question."
      },
      {
        status: 500,
        headers: {
          "x-request-id": requestId
        }
      }
    );
  }
}
