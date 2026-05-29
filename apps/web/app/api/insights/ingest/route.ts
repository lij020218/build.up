// POST /api/insights/ingest — add a new insight document to the RAG store.
//
// Auth: requires `x-ingest-token` header matching INSIGHT_INGEST_TOKEN env var.
// (Ingestion is a service-side operation — we don't expose it to end users.
// Once an admin role exists in the project, swap the token check for that.)

import { ingestInsightDocument, type InsightDocumentInput } from "@foundone/ai";
import { getEnvVar, getOpenAiApiKey } from "../../_lib/env";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";

type RequestBody = Partial<InsightDocumentInput> & { replace?: boolean };

export async function POST(request: Request) {
  const token = request.headers.get("x-ingest-token") ?? "";
  const expected = getEnvVar("INSIGHT_INGEST_TOKEN");
  if (!expected) {
    return json({ error: "Ingestion is not configured (missing INSIGHT_INGEST_TOKEN)." }, 503);
  }
  if (!token || token !== expected) {
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

  try {
    const result = await ingestInsightDocument(
      {
        title: body.title.trim(),
        body: body.body,
        category: body.category.trim(),
        tags: body.tags,
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
