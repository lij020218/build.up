/**
 * 가드 누락 방지 — LLM/AI 패키지를 쓰는 모든 사용자 라우트는 runAiFeature/guardAiFeature 를 거쳐야 한다
 * (2026-08-19 3원칙: 일·주·월 한도 + 실패 시 환불). 내부 라우트(CRON_SECRET/ingest-token)는 예외.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const API = join(HERE, "..", "app", "api");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name === "route.ts") out.push(p);
  }
  return out;
}

const LLM_MARKERS = /createAiClient|createLongAiClient|new OpenAI\(|new Anthropic\(|withOpenAiFallback|from "@foundone\/ai|from '@foundone\/ai|messages\.(create|stream)\(/;
const GUARD_MARKERS = /runAiFeature\(|guardAiFeature\(/;
const INTERNAL_MARKERS = /CRON_SECRET|ingest-token|INGEST_TOKEN/;

describe("AI 라우트 가드 커버리지", () => {
  it("LLM 을 쓰는 사용자 라우트는 전부 ai-guard 를 거친다", () => {
    const offenders: string[] = [];
    for (const file of walk(API)) {
      const src = readFileSync(file, "utf8");
      if (!LLM_MARKERS.test(src)) continue;
      if (INTERNAL_MARKERS.test(src)) continue;
      if (!GUARD_MARKERS.test(src)) offenders.push(file.replace(API, "app/api"));
    }
    expect(offenders, `가드 없는 AI 라우트: ${offenders.join(", ")}`).toEqual([]);
  });
});
