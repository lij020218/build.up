// GET /api/insights/search?q=...&category=...&tags=a,b&limit=6
//
// Vector-based search over insight_chunks. Auth-required; rate-limited.
// 2026-08-19: 임베딩 호출도 미터링 — ai-guard "insights-search"(일 60 / 주 240 / 분당 20, ai-cost extraWon 1).
//   실패(임베딩·DB) 시 가드가 재시도 1회 후 환불 + 503.
// Returns the chunks the AI coach would inject — useful as a stand-alone
// API and for debugging retrieval quality.

import { NextResponse } from "next/server";
import { retrieveInsightChunks } from "@foundone/ai";
import { supabase } from "../../../../lib/supabase";
import { runAiFeature } from "../../_lib/ai-guard";
import { getOpenAiApiKey } from "../../_lib/env";

export async function GET(request: Request) {
  // 입력 검증은 게이트(차감) 전에
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (!query) return json({ error: "Query parameter 'q' is required." }, 400);
  if (query.length > 500) return json({ error: "Query too long (max 500 chars)." }, 400);

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

  return runAiFeature(
    { request, feature: "insights-search", limits: { daily: 60, weekly: 240, perMinute: 20 }, failMessage: "검색에 실패했어요. 사용 횟수는 차감되지 않았어요. 잠시 후 다시 시도해 주세요." },
    async () => {
      // 임베딩·DB 실패는 throw → 가드가 재시도 1회 후 환불 + 503
      const results = await retrieveInsightChunks(
        query,
        {
          supabase: supabase as unknown as Parameters<typeof retrieveInsightChunks>[1]["supabase"],
          embed: { apiKey },
        },
        { matchCount, category, tags },
      );
      return NextResponse.json({ query, count: results.length, results });
    },
  );
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
