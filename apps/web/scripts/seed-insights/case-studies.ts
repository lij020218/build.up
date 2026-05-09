/**
 * Seed script: ingest all 124 success case studies into the insight RAG.
 *
 * Run from apps/web (so @build-up/* workspace deps resolve):
 *   cd apps/web && node --experimental-strip-types scripts/seed-insights/case-studies.ts
 *   cd apps/web && node --experimental-strip-types scripts/seed-insights/case-studies.ts --replace
 *
 * Required env (read from .env.local at repo root or apps/web/.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - OPENAI_API_KEY
 *
 * Idempotent on content_hash. Re-running skips already-ingested cases. Use
 * --replace to force re-ingest after edits to a case body.
 *
 * Each case becomes its own insight_document (1 chunk, since cases are short).
 * Tags = [situation, ...applicableTo] so retrieval can filter by situation.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestInsightDocument } from "@build-up/ai";
import type { InsightCategory } from "@build-up/ai";
import { getAllCaseStudies, type BusinessSituation, type CaseStudy } from "@build-up/shared";
import { createClient } from "@supabase/supabase-js";

const SOURCE_NAME = "case-studies-v1";

// situation → InsightCategory 매핑. RAG 카테고리 필터 시 사용.
const CATEGORY_BY_SITUATION: Record<BusinessSituation, InsightCategory> = {
  "funding-crisis": "finance",
  "pmf-not-found": "product",
  "revenue-decline": "growth",
  "competitor-pressure": "marketing",
  "cost-crisis": "finance",
  "scaling-decision": "growth",
  "small-biz-turnaround": "operations",
  "talent-acquisition": "leadership",
  "marketing-stagnant": "marketing",
  "menu-fatigue": "product",
  "delivery-dependency": "operations",
  "seasonal-slump": "marketing",
  "expansion-ready": "growth",
  "staff-crisis": "leadership",
  "rent-crisis": "finance",
};

function loadEnv(): Record<string, string> {
  const candidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "apps/web/.env.local"),
  ];
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  for (const path of candidates) {
    try {
      const content = readFileSync(path, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        if (!env[key] || env[key].length === 0) env[key] = val;
      }
    } catch {
      /* file missing — ok */
    }
  }
  return env;
}

function caseToDocument(c: CaseStudy) {
  // body 는 한 케이스 전체 — 검색 시 의미있는 매칭이 되도록 회사명·상황·교훈 모두 포함.
  // (chunker 는 1 chunk 로 처리; 짧기 때문)
  const body = [
    `회사: ${c.company}`,
    `상황: ${c.situation}`,
    `핵심: ${c.oneLiner}`,
    `교훈: ${c.lesson}`,
    `적용 업종: ${c.applicableTo.join(", ")}`,
  ].join("\n");

  return {
    title: `${c.company} — ${c.oneLiner}`,
    body,
    category: CATEGORY_BY_SITUATION[c.situation],
    tags: [c.situation, ...c.applicableTo],
    sourceName: SOURCE_NAME,
    language: "ko" as const,
  };
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiKey = env.OPENAI_API_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  if (!openAiKey) throw new Error("OPENAI_API_KEY is required.");

  const replace = process.argv.includes("--replace");

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const cases = getAllCaseStudies();
  console.log(`[seed-cases] total cases: ${cases.length} (replace=${replace})`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of cases) {
    const doc = caseToDocument(c);
    try {
      const result = await ingestInsightDocument(
        doc,
        {
          supabase: supabase as unknown as Parameters<typeof ingestInsightDocument>[1]["supabase"],
          embed: { apiKey: openAiKey },
        },
        { replace },
      );
      if (result.inserted) {
        inserted++;
        console.log(`  ✓ ${c.id}  ${c.company}  (chunks=${result.chunkCount})`);
      } else {
        skipped++;
        console.log(`  ↺ ${c.id}  ${c.company}  (already present)`);
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${c.id}  ${c.company}  —`, err instanceof Error ? err.message : err);
    }
  }

  console.log(
    `\n[seed-cases] done. inserted=${inserted} skipped=${skipped} failed=${failed} total=${cases.length}`,
  );
}

main().catch((err) => {
  console.error("[seed-cases] fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
