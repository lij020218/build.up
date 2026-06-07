// POST /api/insights/ingest — add a new insight document to the RAG store.
//
// Auth: requires `x-ingest-token` header matching INSIGHT_INGEST_TOKEN env var.
// (Ingestion is a service-side operation — we don't expose it to end users.
// Once an admin role exists in the project, swap the token check for that.)

import { timingSafeEqual } from "node:crypto";
import { ingestInsightDocument, type InsightDocumentInput } from "@foundone/ai";
import { getEnvVar, getOpenAiApiKey } from "../../_lib/env";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";

const MAX_BODY_CHARS = 50_000;
const MAX_TITLE_CHARS = 500;
const MAX_CATEGORY_CHARS = 200;
const MAX_TAG_CHARS = 200;

type RequestBody = Partial<InsightDocumentInput> & { replace?: boolean };

export async function POST(request: Request) {
  const token = request.headers.get("x-ingest-token") ?? "";
  const expected = getEnvVar("INSIGHT_INGEST_TOKEN");
  if (!expected) {
    return json({ error: "Ingestion is not configured (missing INSIGHT_INGEST_TOKEN)." }, 503);
  }
  // timing-safe 비교 — 단순 === 는 조기 종료로 timing oracle 가능
  const tokBuf = Buffer.from(token.padEnd(expected.length, "\0"), "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  const tokPad = Buffer.from(token.slice(0, expected.length).padEnd(expected.length, "\0"), "utf8");
  const valid = token.length === expected.length && timingSafeEqual(tokPad, expBuf);
  void tokBuf; // suppress unused warning
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
        embed: { apiKey: openAiKey },
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
