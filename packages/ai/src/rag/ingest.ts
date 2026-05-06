// End-to-end ingestion: chunk → embed → upsert document + chunks.
//
// Idempotent on `content_hash`: re-ingesting the same body returns the
// existing document_id and inserts no new chunks. To force a re-ingest after
// content changes, the hash will differ — caller can delete the old document
// (the cascade clears chunks) before calling again, or pass `replace: true`.

import { createHash } from "crypto";

import { chunkInsightBody } from "./chunk";
import { embedTexts, EMBEDDING_DIM, type EmbedOptions } from "./embed";
import type { InsightDocumentInput } from "./types";

type SupabaseWriteClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
    insert: (
      rows: Record<string, unknown> | Record<string, unknown>[],
    ) => {
      select: (cols: string) => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    } & Promise<{ data: unknown; error: { message: string } | null }>;
    delete: () => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export type IngestDeps = {
  /** Must be a service-role client — RLS allows writes only for service_role. */
  supabase: SupabaseWriteClient;
  embed: EmbedOptions;
};

export type IngestResult = {
  documentId: string;
  chunkCount: number;
  inserted: boolean; // false when the doc was already present (skipped)
};

export type IngestOptions = {
  /** If true and a doc with the same content_hash exists, delete and re-ingest. */
  replace?: boolean;
};

export async function ingestInsightDocument(
  input: InsightDocumentInput,
  deps: IngestDeps,
  options: IngestOptions = {},
): Promise<IngestResult> {
  const body = input.body.trim();
  if (!body) throw new Error("ingestInsightDocument: empty body");
  if (!input.title.trim()) throw new Error("ingestInsightDocument: empty title");
  if (!input.category.trim()) throw new Error("ingestInsightDocument: empty category");

  const contentHash = sha256(`${input.title}\n\n${body}`);

  // Idempotency check.
  const existing = await deps.supabase
    .from("insight_documents")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (existing.error) {
    throw new Error(`insight_documents lookup failed: ${existing.error.message}`);
  }

  if (existing.data) {
    if (!options.replace) {
      return { documentId: existing.data.id, chunkCount: 0, inserted: false };
    }
    // Replace: cascade-deletes the old chunks too.
    const del = await deps.supabase
      .from("insight_documents")
      .delete()
      .eq("id", existing.data.id);
    if (del.error) {
      throw new Error(`insight_documents replace failed: ${del.error.message}`);
    }
  }

  // 1. Chunk.
  const chunks = chunkInsightBody(body);
  if (chunks.length === 0) {
    throw new Error("ingestInsightDocument: chunker produced 0 chunks");
  }

  // 2. Embed.
  const embeddings = await embedTexts(
    chunks.map((c) => c.content),
    deps.embed,
  );
  if (embeddings.length !== chunks.length) {
    throw new Error(
      `embedding count mismatch: ${embeddings.length} vs ${chunks.length} chunks`,
    );
  }
  for (const v of embeddings) {
    if (v.length !== EMBEDDING_DIM) {
      throw new Error(`embedding dim mismatch: got ${v.length}, expected ${EMBEDDING_DIM}`);
    }
  }

  // 3. Insert document.
  const docInsert = await deps.supabase
    .from("insight_documents")
    .insert({
      title: input.title.trim(),
      source_url: input.sourceUrl ?? null,
      source_name: input.sourceName ?? null,
      category: input.category.trim(),
      tags: input.tags ?? [],
      language: input.language ?? "ko",
      published_at: input.publishedAt ?? null,
      content_hash: contentHash,
      chunk_count: 0, // trigger will sync after chunk insert
    })
    .select("id")
    .single();

  if (docInsert.error || !docInsert.data) {
    throw new Error(
      `insight_documents insert failed: ${docInsert.error?.message ?? "no row returned"}`,
    );
  }
  const documentId = docInsert.data.id;

  // 4. Insert chunks.
  const chunkRows = chunks.map((c, i) => ({
    document_id: documentId,
    chunk_index: c.index,
    content: c.content,
    token_estimate: c.tokenEstimate,
    embedding: embeddings[i],
    metadata: {},
  }));

  const chunkInsert = await deps.supabase.from("insight_chunks").insert(chunkRows);
  if (chunkInsert.error) {
    throw new Error(`insight_chunks insert failed: ${chunkInsert.error.message}`);
  }

  return { documentId, chunkCount: chunks.length, inserted: true };
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
