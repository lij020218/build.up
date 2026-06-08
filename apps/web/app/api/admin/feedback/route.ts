/**
 * GET /api/admin/feedback?category=&page= — 인앱 피드백 수신함(최신순).
 *   category 화이트리스트 필터, 이메일 마스킹, platform/screen 맥락 포함.
 */
import { NextResponse } from "next/server";
import { requireAdmin, maskEmail } from "../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { adminRateLimit, buildEmailMap } from "../_shared";
import { isFeedbackArea } from "../../../lib/feedback/areas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["bug", "idea", "ux", "other"] as const;
const STATUSES = ["new", "reviewing", "resolved", "wontfix"] as const;
const PAGE_SIZE = 30;

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const url = new URL(request.url);
  const categoryParam = url.searchParams.get("category");
  const category = CATEGORIES.includes(categoryParam as (typeof CATEGORIES)[number]) ? categoryParam : null;
  const areaParam = url.searchParams.get("area");
  const area = isFeedbackArea(areaParam) ? areaParam : null;
  const statusParam = url.searchParams.get("status");
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number]) ? statusParam : null;
  const page = Math.max(0, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = admin
    .from("user_feedback")
    .select("id, user_id, category, area, status, message, context, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (category) query = query.eq("category", category);
  if (area) query = query.eq("area", area);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin/feedback] query failed:", error.message);
    return NextResponse.json({ ok: false, error: "조회 실패" }, { status: 500 });
  }

  const emailMap = await buildEmailMap(admin);

  const items = (data ?? []).map((row) => {
    const r = row as {
      id: string; user_id: string; category: string; area: string | null; status: string | null;
      message: string; context: unknown; created_at: string;
    };
    const ctx = (r.context && typeof r.context === "object" ? r.context : {}) as Record<string, unknown>;
    return {
      id: r.id,
      category: r.category,
      area: r.area ?? null,
      status: r.status ?? "new",
      message: r.message,
      platform: typeof ctx.platform === "string" ? ctx.platform : null,
      screen: typeof ctx.screen === "string" ? ctx.screen : null,
      createdAt: r.created_at,
      email: maskEmail(emailMap.get(r.user_id)),
    };
  });

  return NextResponse.json({
    ok: true,
    items,
    page,
    pageSize: PAGE_SIZE,
    total: count ?? null,
    hasMore: count != null ? to + 1 < count : items.length === PAGE_SIZE,
  });
}
