// GET /api/insights/documents?category=...&limit=50
//
// List ingested insight documents (metadata only — no chunk bodies).

import { supabase } from "../../../../lib/supabase";
import { requireApiUser } from "../../_lib/auth";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return json({ error: auth.error }, auth.status);
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const limitRaw = url.searchParams.get("limit");
  const limitParsed = limitRaw ? Number(limitRaw) : NaN;
  const limit = Number.isFinite(limitParsed)
    ? Math.min(Math.max(Math.trunc(limitParsed), 1), 200)
    : 50;

  let query = supabase
    .from("insight_documents")
    .select(
      "id, title, source_name, source_url, category, tags, language, published_at, chunk_count, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ count: data?.length ?? 0, documents: data ?? [] }, 200);
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
