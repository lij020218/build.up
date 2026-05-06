// Vector retrieval against insight_chunks via the match_insight_chunks RPC.
//
// We accept any Supabase-shaped client (from `@supabase/supabase-js`) so this
// module stays decoupled from Next.js. The caller (an API route, a script, or
// a Supabase Edge Function) supplies the client with the right auth.

import type { RetrievedChunk, RetrieveOptions } from "./types";
import { embedQuery, type EmbedOptions } from "./embed";

// Minimal structural type so we don't depend on @supabase/supabase-js here.
type SupabaseRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

type RpcRow = {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
  doc_title: string;
  doc_source_name: string | null;
  doc_source_url: string | null;
  doc_category: string;
  doc_tags: string[] | null;
};

export type RetrieveDeps = {
  supabase: SupabaseRpcClient;
  embed: EmbedOptions;
};

/**
 * Embed `query` and run cosine-similarity retrieval against insight_chunks.
 * Returns ordered, deduplicated chunks (best similarity first).
 */
export async function retrieveInsightChunks(
  query: string,
  deps: RetrieveDeps,
  options: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  if (!query.trim()) return [];

  const queryEmbedding = await embedQuery(query, deps.embed);

  const { data, error } = await deps.supabase.rpc("match_insight_chunks", {
    query_embedding: queryEmbedding,
    match_count: options.matchCount ?? 6,
    min_similarity: options.minSimilarity ?? 0.35,
    filter_category: options.category ?? null,
    filter_tags: options.tags && options.tags.length > 0 ? options.tags : null,
  });

  if (error) {
    throw new Error(`match_insight_chunks RPC failed: ${error.message}`);
  }

  const rows = (data as RpcRow[] | null) ?? [];
  return rows.map(rowToChunk);
}

function rowToChunk(r: RpcRow): RetrievedChunk {
  return {
    chunkId: r.chunk_id,
    documentId: r.document_id,
    chunkIndex: r.chunk_index,
    content: r.content,
    similarity: r.similarity,
    doc: {
      title: r.doc_title,
      sourceName: r.doc_source_name,
      sourceUrl: r.doc_source_url,
      category: r.doc_category,
      tags: r.doc_tags ?? [],
    },
  };
}
