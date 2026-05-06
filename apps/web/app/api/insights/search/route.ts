// GET /api/insights/search?q=...&category=...&tags=a,b&limit=6
//
// Vector-based search over insight_chunks. Auth-required; rate-limited.
// Returns the chunks the AI coach would inject — useful as a stand-alone
// API and for debugging retrieval quality.

import { retrieveInsightChunks } from "@build-up/ai";
import { supabase } from "../../../../lib/supabase";
import { requireApiUser } from "../../_lib/auth";
import { getOpenAiApiKey } from "../../_lib/env";
import { checkSimpleRateLimit } from "../../_lib/rate-limit";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return json({ error: auth.error }, auth.status);
  }

  const rl = checkSimpleRateLimit({
    key: `insights-search:${auth.userId}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) return json({ error: rl.error }, rl.status);

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query) return json({ error: "Query parameter 'q' is required." }, 400);

  const apiKey = getOpenAiApiKey();
  if (!apiKey) return json({ error: "OpenAI API key not configured." }, 503);

  const category = url.searchParams.get("category") ?? undefined;
  const tagsRaw = url.searchParams.get("tags");
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;
  const limitRaw = url.searchParams.get("limit");
  const limitParsed = limitRaw ? Number(limitRaw) : NaN;
  const matchCount = Number.isFinite(limitParsed)
    ? Math.min(Math.max(Math.trunc(limitParsed), 1), 20)
    : 6;

  try {
    const results = await retrieveInsightChunks(
      query,
      {
        supabase: supabase as unknown as Parameters<typeof retrieveInsightChunks>[1]["supabase"],
        embed: { apiKey },
      },
      { matchCount, category, tags },
    );
    return json({ query, count: results.length, results }, 200);
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Search failed." },
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
