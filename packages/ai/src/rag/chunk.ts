// Semantic-aware chunking for insight articles.
//
// Strategy: split on paragraph boundaries (Korean articles use blank lines or
// numbered list markers). Each output chunk targets ~800 chars with a soft
// max of 1100 and ~120 char overlap by carrying the previous paragraph's tail.
//
// Why paragraph-first: arbitrary char windows break sentences mid-thought and
// degrade retrieval quality. Numbered lists (1. … 2. …) are common in the
// playbooks we ingest, so we treat each item as a natural unit too.

import type { InsightChunk } from "./types";

const TARGET_CHARS = 800;
const SOFT_MAX_CHARS = 1100;
const OVERLAP_CHARS = 120;

export type ChunkOptions = {
  targetChars?: number;
  softMaxChars?: number;
  overlapChars?: number;
};

export function chunkInsightBody(
  body: string,
  options: ChunkOptions = {},
): InsightChunk[] {
  const target = options.targetChars ?? TARGET_CHARS;
  const softMax = options.softMaxChars ?? SOFT_MAX_CHARS;
  const overlap = options.overlapChars ?? OVERLAP_CHARS;

  const normalized = body.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Split on blank lines OR on numbered-list markers at line start.
  // We keep the marker by splitting before it (lookbehind on \n).
  const paragraphs = normalized
    .split(/\n{2,}|(?=\n\s*\d+\.\s)/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = "";

  const flush = () => {
    const trimmed = buf.trim();
    if (trimmed) chunks.push(trimmed);
    buf = "";
  };

  for (const p of paragraphs) {
    // Paragraph alone is huge — split it by sentence as a safety net.
    if (p.length > softMax) {
      if (buf) flush();
      const sentences = p.split(/(?<=[.!?。!?])\s+|(?<=\.)\n+/g);
      let inner = "";
      for (const s of sentences) {
        if ((inner + " " + s).length > softMax) {
          if (inner) chunks.push(inner.trim());
          inner = s;
        } else {
          inner = inner ? `${inner} ${s}` : s;
        }
      }
      if (inner.trim()) chunks.push(inner.trim());
      continue;
    }

    if (!buf) {
      buf = p;
      continue;
    }

    const candidate = `${buf}\n\n${p}`;
    if (candidate.length <= target) {
      buf = candidate;
    } else if (candidate.length <= softMax && buf.length < target * 0.6) {
      // Buffer is small — let it grow up to soft max rather than emit a tiny chunk.
      buf = candidate;
    } else {
      flush();
      buf = p;
    }
  }
  flush();

  // Add overlap: prepend the tail of chunk[i-1] to chunk[i] for context continuity.
  const withOverlap: InsightChunk[] = [];
  for (let i = 0; i < chunks.length; i++) {
    let content = chunks[i];
    if (i > 0 && overlap > 0) {
      const prev = chunks[i - 1];
      const tail = prev.slice(-overlap).trim();
      if (tail && !content.startsWith(tail)) {
        content = `…${tail}\n\n${content}`;
      }
    }
    withOverlap.push({
      index: i,
      content,
      tokenEstimate: estimateTokens(content),
    });
  }

  return withOverlap;
}

// Rough token estimate. Korean ~3 chars/token, English ~4 chars/token.
// Used only for logging/diagnostics — not for hard limits.
export function estimateTokens(text: string): number {
  const koreanRatio = (text.match(/[ㄱ-힝]/gu) ?? []).length / text.length;
  const cpt = koreanRatio > 0.3 ? 3 : 4;
  return Math.ceil(text.length / cpt);
}
