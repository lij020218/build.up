// Shared types for the insight-RAG pipeline.

export type InsightCategory =
  | "ai_strategy"
  | "fundraising"
  | "operations"
  | "marketing"
  | "leadership"
  | "product"
  | "growth"
  | "finance"
  | "sales"
  | "other";

export type InsightDocumentInput = {
  title: string;
  body: string;
  category: InsightCategory | string;
  tags?: string[];
  sourceName?: string;
  sourceUrl?: string;
  language?: "ko" | "en";
  publishedAt?: string; // ISO date — YYYY-MM-DD
};

export type InsightChunk = {
  index: number;
  content: string;
  tokenEstimate: number;
};

export type EmbeddedChunk = InsightChunk & {
  embedding: number[];
};

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
  doc: {
    title: string;
    sourceName: string | null;
    sourceUrl: string | null;
    category: string;
    tags: string[];
  };
};

export type RetrieveOptions = {
  matchCount?: number;
  minSimilarity?: number;
  category?: string;
  tags?: string[];
};
