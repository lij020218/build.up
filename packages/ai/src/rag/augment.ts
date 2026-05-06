// Inject retrieved insight chunks into AI prompts.
//
// The output is plain text the calling prompt builder can drop into a
// dedicated section (e.g., "## 참고 인사이트"). We deliberately keep this
// formatter-only — retrieval policy lives in retrieve.ts.

import type { RetrievedChunk } from "./types";

export type AugmentOptions = {
  /** Hard cap on total characters injected (prevents bloating prompts). */
  maxChars?: number;
  /** Max chunks to include even if under maxChars. */
  maxChunks?: number;
  /** Section heading. Defaults to Korean since the product is Korean-first. */
  heading?: string;
};

const DEFAULT_MAX_CHARS = 3500;
const DEFAULT_MAX_CHUNKS = 4;

export function formatInsightContext(
  chunks: RetrievedChunk[],
  options: AugmentOptions = {},
): string {
  if (chunks.length === 0) return "";

  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const maxChunks = options.maxChunks ?? DEFAULT_MAX_CHUNKS;
  const heading = options.heading ?? "참고 인사이트 (외부 자료)";

  const parts: string[] = [];
  let used = 0;

  for (let i = 0; i < Math.min(chunks.length, maxChunks); i++) {
    const c = chunks[i];
    const sourceLabel = formatSource(c);
    const block = `[${i + 1}] ${c.doc.title}${sourceLabel ? ` — ${sourceLabel}` : ""}\n${c.content}`;
    if (used + block.length > maxChars && parts.length > 0) break;
    parts.push(block);
    used += block.length;
  }

  if (parts.length === 0) return "";

  const usageNote =
    "위 인사이트는 답변의 깊이를 보강하는 외부 참고 자료입니다. 사장님 가게 데이터(매출·비용 등)가 있으면 그쪽이 우선이며, 인사이트는 거장의 지혜처럼 자연스럽게 인용 가능할 때만 활용하세요. 인용 시 출처를 짧게 표기하세요(예: \"bzcf의 AI 롤업 플레이북에 따르면…\"). 컨텍스트와 무관하면 무시하세요.";

  return [`## ${heading}`, "", parts.join("\n\n---\n\n"), "", usageNote].join("\n");
}

function formatSource(c: RetrievedChunk): string {
  const { sourceName } = c.doc;
  if (!sourceName) return "";
  const sim = `유사도 ${(c.similarity * 100).toFixed(0)}%`;
  return `${sourceName} (${sim})`;
}
