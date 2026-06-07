// GET /api/insights/documents?category=...&limit=50
//
// List ingested insight documents (metadata only — no chunk bodies).
// Admin / service-role only — not exposed to general users.

import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { requireApiUser } from "../../_lib/auth";
import { getEnvVar } from "../../_lib/env";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) {
    return json({ error: auth.error }, auth.status);
  }

  // Admin token 체크 — 일반 사용자는 접근 불가
  const adminToken = request.headers.get("x-admin-token");
  const expectedAdminToken = getEnvVar("INSIGHT_INGEST_TOKEN");
  if (!expectedAdminToken || adminToken !== expectedAdminToken) {
    return json({ error: "Forbidden" }, 403);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return json({ error: "서버 설정 오류" }, 500);

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const limitRaw = url.searchParams.get("limit");
  const limitParsed = limitRaw ? Number(limitRaw) : NaN;
  const limit = Number.isFinite(limitParsed)
    ? Math.min(Math.max(Math.trunc(limitParsed), 1), 200)
    : 50;

  let query = supabase
    .from("insight_documents")
    .select(
      "id, title, source_name, source_url, category, tags, language, published_at, chunk_count, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[insights/documents] query error:", error.message);
    return json({ error: "문서 목록 조회에 실패했습니다." }, 500);
  }

  return json({ count: data?.length ?? 0, documents: data ?? [] }, 200);
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
