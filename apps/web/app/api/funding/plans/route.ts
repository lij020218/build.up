/**
 * /api/funding/plans — 내 사업계획서 초안 목록·삭제 (2026-08-14)
 *
 *  GET    ?limit=30        → 본인 초안 목록(최신순). 목록은 요약 필드만, 본문(sections)은 포함
 *                            (건당 수 KB × 30 = 수백 KB 이하 — 별도 상세 API 없이 팝업에서 바로 열람)
 *  DELETE ?id=<uuid>       → 본인 초안 삭제 (RLS 가 소유권 보장)
 *
 *  인증: Supabase Bearer (requireApiUser) + 사용자 스코프 클라이언트(RLS). 웹·iOS 공용.
 */
import { NextResponse } from "next/server";
import { requireApiUser, getUserScopedClient } from "../../_lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const client = getUserScopedClient(request);
  if (!client) return NextResponse.json({ ok: false, error: "세션 오류" }, { status: 401 });

  const limitRaw = Number(new URL(request.url).searchParams.get("limit") ?? "30");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 100) : 30;

  const { data, error } = await client
    .from("business_plan_drafts")
    .select("id, program_id, program_name, purpose, summary, sections, missing_info, model, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[funding/plans GET] query failed:", error.message);
    return NextResponse.json({ ok: false, error: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    drafts: (data ?? []).map((d) => ({
      id: d.id,
      programId: d.program_id,
      programName: d.program_name,
      purpose: d.purpose,
      summary: d.summary,
      sections: d.sections,
      missingInfo: d.missing_info,
      model: d.model,
      createdAt: d.created_at,
    })),
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  const client = getUserScopedClient(request);
  if (!client) return NextResponse.json({ ok: false, error: "세션 오류" }, { status: 401 });

  const { error } = await client.from("business_plan_drafts").delete().eq("id", id);
  if (error) {
    console.error("[funding/plans DELETE] failed:", error.message);
    return NextResponse.json({ ok: false, error: "삭제 실패" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
