import {
  answerGuideQuestion,
  buildGuideContextBlock,
  deriveGuideQaConfidence,
  loadKnowledgeRecordById,
  type GuideQaRequest,
  type GuideQaAnswer,
  type Language
} from "@foundone/shared";
import { interpretGuideQuestion } from "@foundone/ai";
import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";
import { getRequestId, logApiError, logApiEvent } from "../../../_lib/observability";
import { runAiFeature } from "../../../_lib/ai-guard";

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

  // 입력 검증·가이드 조회는 게이트(차감) 전에 — 400/404 는 절대 차감하지 않는다.
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body?.guideId || !body.question?.trim()) {
    return NextResponse.json({ error: "guideId and question are required." }, { status: 400 });
  }
  const question = body.question;
  const language = body.language ?? "ko";

  let guide: Awaited<ReturnType<typeof loadKnowledgeRecordById>>;
  try {
    guide = await loadKnowledgeRecordById(supabase, body.guideId);
  } catch (error) {
    logApiError(route, "fetch_failed", error, { requestId, status: 500 });
    return NextResponse.json(
      { error: "답변 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
  if (!guide) {
    return NextResponse.json({ error: "Guide not found." }, { status: 404 });
  }
  const loadedGuide = guide;

  const staticAnswer = (): GuideQaAnswer =>
    answerGuideQuestion({ question, language, guide: loadedGuide } satisfies GuideQaRequest);

  // 2026-08-19 ai-guard: 분·일·주·월 한도. LLM 실패 → 정적 가이드 답변(200)으로 내려가되
  //  우리 쪽 실패이므로 사용 횟수는 환불(refunded:true). 키 미설정도 LLM 0회 → 환불.
  return runAiFeature({ request, feature: "guides-ask" }, async ({ userId, refund }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let answer: GuideQaAnswer;
    let refunded = false;

    if (apiKey) {
      try {
        answer = await interpretWithLlm(loadedGuide, question, language, apiKey);
      } catch (error) {
        logApiEvent("warn", {
          area: "ai", route, requestId, event: "fallback_used", userId,
          meta: { mode: "model_failed", detail: error instanceof Error ? error.message.slice(0, 160) : String(error) },
        });
        await refund();
        refunded = true;
        answer = staticAnswer();
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
        area: "ai", route, requestId, event: "fallback_used", userId,
        meta: { mode: "missing_api_key" },
      });
      await refund();
      refunded = true;
      answer = { ...staticAnswer(), confidence: "check_needed" };
    }

    const payload: GuideQaAnswer & { refunded?: boolean } = refunded ? { ...answer, refunded: true } : answer;
    return NextResponse.json(payload, { headers: { "x-request-id": requestId } });
  });
}

/** LLM 해석 경로 — interpretGuideQuestion 결과를 GuideQaAnswer 로 정규화. 실패는 throw (호출자가 정적 폴백). */
async function interpretWithLlm(
  guide: NonNullable<Awaited<ReturnType<typeof loadKnowledgeRecordById>>>,
  question: string,
  language: Language,
  apiKey: string,
): Promise<GuideQaAnswer> {
  const interpreted = await interpretGuideQuestion(guide, question, language, { apiKey });
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
  const normalizedQuestionTokens = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const matchedSections = fallbackContext.sections.filter((section) => {
    const content = `${section.title} ${section.items.join(" ")}`.toLowerCase();
    return normalizedQuestionTokens.some((token) => content.includes(token));
  });

  return {
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
}
