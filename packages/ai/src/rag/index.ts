// Public surface for the insight-RAG pipeline.

export { chunkInsightBody, estimateTokens } from "./chunk";
export type { ChunkOptions } from "./chunk";

export { embedTexts, embedQuery, EMBEDDING_MODEL, EMBEDDING_DIM } from "./embed";
export type { EmbedOptions } from "./embed";

export { retrieveInsightChunks } from "./retrieve";
export type { RetrieveDeps } from "./retrieve";

export { formatInsightContext } from "./augment";
export type { AugmentOptions } from "./augment";

export { ingestInsightDocument } from "./ingest";
export type { IngestDeps, IngestResult, IngestOptions } from "./ingest";

export type {
  InsightCategory,
  InsightDocumentInput,
  InsightChunk,
  EmbeddedChunk,
  RetrievedChunk,
  RetrieveOptions,
} from "./types";
