// POST /api/insights/ingest — add a new insight document to the RAG store.
//
// Auth: requires `x-ingest-token` header matching INSIGHT_INGEST_TOKEN env var.
// (Ingestion is a service-side operation — we don't expose it to end users.
// Once an admin role exists in the project, swap the token check for that.)

import { timingSafeEqual } from "node:crypto";
import OpenAI from "openai";
import { chunkInsightBody, ingestInsightDocument, type InsightDocumentInput } from "@foundone/ai";
import { getEnvVar, getOpenAiApiKey } from "../../_lib/env";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";

const MAX_BODY_CHARS = 50_000;
const MAX_TITLE_CHARS = 500;
const MAX_CATEGORY_CHARS = 200;
const MAX_TAG_CHARS = 200;
/** 요청당 임베딩 청크 하드캡 (2026-08-19 내부 라우트 비용 상한 — 50KB 본문 ≈ 50~120 청크, 400 이면 충분) */
const MAX_CHUNKS_PER_REQUEST = 400;
/** 임베딩 OpenAI SDK 재시도 (embed.ts 자체 1회 재시도와 별개 — 일시 오류 흡수) */
const EMBED_SDK_MAX_RETRIES = 3;

type RequestBody = Partial<InsightDocumentInput> & { replace?: boolean };

export async function POST(request: Request) {
  const token = request.headers.get("x-ingest-token") ?? "";
  const expected = getEnvVar("INSIGHT_INGEST_TOKEN");
  if (!expected) {
    return json({ error: "Ingestion is not configured (missing INSIGHT_INGEST_TOKEN)." }, 503);
  }
  // timing-safe 비교 — 단순 === 는 조기 종료로 timing oracle 가능
  const expBuf = Buffer.from(expected, "utf8");
  const tokPad = Buffer.from(token.slice(0, expected.length).padEnd(expected.length, "\0"), "utf8");
  const valid = token.length === expected.length && timingSafeEqual(tokPad, expBuf);
  if (!valid) {
    return json({ error: "Unauthorized" }, 401);
  }

  const openAiKey = getOpenAiApiKey();
  if (!openAiKey) {
    return json({ error: "OpenAI API key not configured." }, 503);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return json({ error: "Supabase service-role client not configured." }, 503);
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  if (!body.title?.trim() || !body.body?.trim() || !body.category?.trim()) {
    return json({ error: "title, body, category are required." }, 400);
  }

  // 크기 제한 — 비용 폭탄 방지
  const titleTrimmed = body.title.trim().slice(0, MAX_TITLE_CHARS);
  const bodyTrimmed = body.body.slice(0, MAX_BODY_CHARS);
  const categoryTrimmed = body.category.trim().slice(0, MAX_CATEGORY_CHARS);
  const tagsTrimmed = body.tags?.map(t => t.slice(0, MAX_TAG_CHARS));

  // 청크 하드캡 — 임베딩 호출량 상한 (내부 라우트지만 무제한 금지)
  const chunkCount = chunkInsightBody(bodyTrimmed).length;
  if (chunkCount > MAX_CHUNKS_PER_REQUEST) {
    return json({ error: `Document too large: ${chunkCount} chunks (max ${MAX_CHUNKS_PER_REQUEST}). Split the document.` }, 413);
  }

  try {
    const result = await ingestInsightDocument(
      {
        title: titleTrimmed,
        body: bodyTrimmed,
        category: categoryTrimmed,
        tags: tagsTrimmed,
        sourceName: body.sourceName,
        sourceUrl: body.sourceUrl,
        language: body.language,
        publishedAt: body.publishedAt,
      },
      {
        supabase: supabase as unknown as Parameters<typeof ingestInsightDocument>[1]["supabase"],
        embed: { apiKey: openAiKey, client: new OpenAI({ apiKey: openAiKey, maxRetries: EMBED_SDK_MAX_RETRIES }) },
      },
      { replace: body.replace === true },
    );
    return json(result, 200);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Ingestion failed." },
      500,
    );
  }
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
