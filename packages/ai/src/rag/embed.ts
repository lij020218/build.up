// OpenAI embeddings — text-embedding-3-small (1536 dim, cosine).
//
// We batch up to 96 inputs per request (well under OpenAI's 2048 cap) for
// throughput, and retry once on transient errors. The API itself caps a
// single request at 8191 tokens per input — our chunker stays well under
// that (~400 tokens per chunk), so we don't truncate here.

import OpenAI from "openai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;
const BATCH_SIZE = 96;

export type EmbedOptions = {
  apiKey: string;
  model?: string;
  /** Override the OpenAI client (for tests or proxying). */
  client?: OpenAI;
};

export async function embedTexts(
  texts: string[],
  options: EmbedOptions,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const client = options.client ?? new OpenAI({ apiKey: options.apiKey });
  const model = options.model ?? EMBEDDING_MODEL;

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(client, model, batch);
    out.push(...embeddings);
  }
  return out;
}

export async function embedQuery(
  query: string,
  options: EmbedOptions,
): Promise<number[]> {
  const [vec] = await embedTexts([query], options);
  return vec;
}

async function embedBatch(
  client: OpenAI,
  model: string,
  batch: string[],
): Promise<number[][]> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.embeddings.create({
        model,
        input: batch,
        encoding_format: "float",
      });
      // OpenAI returns embeddings in input order — preserve it.
      return res.data
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding as number[]);
    } catch (err) {
      lastError = err;
      // Brief backoff before the single retry.
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(
    `Embedding request failed after retry: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}
