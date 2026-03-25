import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "../../../../lib/supabase";

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

const SYSTEM_PROMPT = `당신은 한국 초보 창업자를 돕는 build.up 서비스의 전문 상담사입니다.

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.question?.trim()) {
      return new Response(JSON.stringify({ error: "질문을 입력해주세요." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    // ── Claude API streaming ──────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI 서비스가 아직 설정되지 않았습니다." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });
    const userPrompt = buildUserPrompt(question, finalChunks, industryCategoryId);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = client.messages.stream({
            model: "claude-haiku-4-5-20251001",
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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "스트림 오류가 발생했습니다.";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "요청 처리에 실패했습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
