import { createAiClient } from "@foundone/ai/utils/client";
import { supabase } from "../../../../lib/supabase";
import { isTransientLlmError } from "@foundone/ai/utils/client";
import { guardAiFeature } from "../../_lib/ai-guard";
import { getAnthropicApiKey } from "../../_lib/env";

type RequestBody = {
  question?: string;
  domain?: "tax" | "loan";
  industryCategoryId?: string;
};

type KnowledgeChunk = {
  id: string;
  category: string;
  title: string;
  content: string;
  source_name: string | null;
  source_url: string | null;
  verified_at: string | null;
};

const SYSTEM_PROMPT = `당신은 한국 초보 창업자를 돕는 Found.One 서비스의 전문 상담사입니다.

역할:
- 세무(부가세, 종합소득세, 원천세, 4대보험 등)와 사업 대출(정책자금, 소진공, 중진공)에 대한 질문에 답합니다.
- 제공된 [지식 베이스] 내용을 근거로만 답변합니다.
- 초보 창업자도 바로 실행할 수 있도록 구체적이고 명확하게 설명합니다.

서식 규칙 (반드시 준수):
- *, **, #, -, > 같은 마크다운 기호를 절대 사용하지 않습니다.
- 강조가 필요하면 「」나 『』 기호를 사용합니다.
- 목록은 번호(1. 2. 3.) 또는 가운뎃점(·)으로 표현합니다.
- 줄바꿈과 빈 줄로만 구조를 나눕니다.

답변 원칙:
1. 지식 베이스에 있는 내용은 자신 있게, 정확하게 답합니다.
2. 지식 베이스에 없는 내용은 "정확한 확인을 위해 국세청(126) 또는 소진공(1357)에 문의하세요"라고 안내합니다.
3. 법률·세무·대출의 최종 판단은 전문가(세무사, 담당 기관)에게 확인하도록 안내합니다.
4. 답변은 친절하고 간결하게, 핵심 먼저 말합니다.
5. 필요하면 구체적인 수치, 기한, 금액을 포함합니다.`;

function buildUserPrompt(question: string, chunks: KnowledgeChunk[], industryCategoryId?: string): string {
  const chunkText = chunks
    .map((c, i) => `[${i + 1}] ${c.title}\n${c.content}${c.source_name ? `\n출처: ${c.source_name}${c.verified_at ? ` (${c.verified_at})` : ""}` : ""}`)
    .join("\n\n---\n\n");

  return [
    industryCategoryId ? `사용자 업종: ${industryCategoryId}` : "",
    `질문: ${question}`,
    "",
    "[지식 베이스]",
    chunkText || "(관련 지식 없음 — 일반적인 안내만 가능합니다)",
    "",
    "위 지식 베이스를 바탕으로 질문에 답변해주세요.",
  ]
    .filter(Boolean)
    .join("\n");
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

/**
 * SSE 스트리밍 라우트 — ai-guard 는 수동(guardAiFeature) 적용 (2026-08-19):
 *  · 분·일·주·월 한도 = AI_FEATURE_LIMITS["knowledge-qa"] (일 30 / 주 120 / 분당 6) + 월 예산(ai-cost "knowledge-qa").
 *  · 입력 검증은 게이트(차감) 전에.
 *  · 스트림이 **첫 토큰 전에** 실패하면(모델·네트워크) 1회 재시도 후에도 실패 시 ctx.refund() — 사용자에게 아무것도 못 준 건 우리 책임.
 */
export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  }
  if (!body.question?.trim()) {
    return jsonResponse({ error: "질문을 입력해주세요." }, 400);
  }
  if (body.question.length > 1_000) {
    return jsonResponse({ error: "질문이 너무 깁니다 (최대 1,000자)." }, 400);
  }

  //   getAnthropicApiKey(): OPENAI_API_KEY 우선 반환(메인 LLM) → ANTHROPIC 폴백.
  //   종전 process.env.ANTHROPIC_API_KEY 직접 참조 시 그 키가 비면 prod 에서 이 라우트만 503.
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return jsonResponse({ error: "AI 서비스가 아직 설정되지 않았습니다." }, 503);
  }

  // 한도 표(ai-guard AI_FEATURE_LIMITS)에 행이 없어 인라인 지정 — 일 30 / 주 120 / 분당 6
  const guard = await guardAiFeature({ request, feature: "knowledge-qa", limits: { daily: 30, weekly: 120, perMinute: 6 } });
  if (!guard.ok) return guard.response;

  try {
    const domain = body.domain ?? "tax";
    const question = body.question.trim();
    const industryCategoryId = body.industryCategoryId;

    // ── RAG: Supabase full-text search ──────────────────────────
    let chunksQuery = supabase
      .from("knowledge_chunks")
      .select("id, category, title, content, source_name, source_url, verified_at")
      .eq("domain", domain)
      .textSearch("search_vector", question.split(/\s+/).join(" | "), {
        type: "plain",
        config: "simple",
      })
      .limit(6);

    // Industry-specific filter: prefer chunks for this industry OR generic chunks
    // We fetch all matches and sort client-side to prefer industry-specific
    const { data: chunks, error: searchError } = await chunksQuery;

    if (searchError) {
      console.error("knowledge_chunks search error:", searchError);
    }

    // Fallback: if full-text search returns nothing, grab top chunks by domain
    let finalChunks: KnowledgeChunk[] = chunks ?? [];
    if (finalChunks.length === 0) {
      const { data: fallbackChunks } = await supabase
        .from("knowledge_chunks")
        .select("id, category, title, content, source_name, source_url, verified_at")
        .eq("domain", domain)
        .limit(4);
      finalChunks = fallbackChunks ?? [];
    }

    // Prioritize industry-specific chunks when available
    if (industryCategoryId && finalChunks.length > 0) {
      const { data: industryChunks } = await supabase
        .from("knowledge_chunks")
        .select("id, category, title, content, source_name, source_url, verified_at")
        .eq("domain", domain)
        .contains("industry_ids", [industryCategoryId])
        .limit(2);

      if (industryChunks && industryChunks.length > 0) {
        // Prepend industry-specific chunks, deduplicate by id
        const typedIndustryChunks = industryChunks as KnowledgeChunk[];
        const existingIds = new Set(finalChunks.map((c) => c.id));
        const newIndustryChunks = typedIndustryChunks.filter((c) => !existingIds.has(c.id));
        finalChunks = [...newIndustryChunks, ...finalChunks].slice(0, 7);
      }
    }

    // ── LLM streaming ─────────────────────────────────────────────
    const client = createAiClient(apiKey);
    const userPrompt = buildUserPrompt(question, finalChunks, industryCategoryId);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let emittedAny = false;
        // 첫 토큰 전 실패는 1회 재시도(일시 오류·빈 스트림). 토큰이 나간 뒤 끊기면 재시도 없이 오류 이벤트만.
        const runStream = async () => {
          const stream = client.messages.stream({
            model: "gpt-5.4-mini",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          });
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              "delta" in event &&
              (event.delta as { type: string }).type === "text_delta"
            ) {
              const text = (event.delta as { type: string; text: string }).text;
              emittedAny = true;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
        };
        try {
          try {
            await runStream();
          } catch (first) {
            if (emittedAny || !isTransientLlmError(first)) throw first;
            console.warn("[knowledge-qa] stream failed before first token → retry once:", first instanceof Error ? first.message : String(first));
            await runStream();
          }
          if (!emittedAny) throw new Error("empty response from model");
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "스트림 오류가 발생했습니다.";
          console.error("[knowledge-qa] stream error:", errMsg);
          if (!emittedAny) {
            // 사용자에게 한 글자도 못 줌 = 우리 실패 → 전액 환불
            await guard.refund();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "답변 생성에 실패했어요. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요.", refunded: true })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // 스트림 열기 전 서버 오류 — 차감 환불
    await guard.refund();
    return jsonResponse(
      { error: error instanceof Error ? error.message : "요청 처리에 실패했습니다.", refunded: true },
      500,
    );
  }
}
