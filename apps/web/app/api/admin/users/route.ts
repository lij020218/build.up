/**
 * GET /api/admin/users?page=&q= — 가입자 목록.
 *   auth.users(페이지) + user_store_data/business_profiles/roadmaps 배치 조인.
 *   이메일 마스킹. q 는 현재 페이지 이메일 부분일치(소규모 기준 — 스케일 시 RPC).
 */
import { NextResponse } from "next/server";
import { requireAdmin, maskEmail } from "../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { adminRateLimit } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
  if (listErr || !list) {
    console.error("[admin/users] listUsers failed:", listErr?.message);
    return NextResponse.json({ ok: false, error: "조회 실패" }, { status: 500 });
  }

  let users = list.users;
  if (q) users = users.filter((u) => (u.email ?? "").toLowerCase().includes(q));
  const ids = users.map((u) => u.id);

  // 배치 조인 (ids 비면 빈 결과)
  const [stores, profiles, roadmaps] = ids.length
    ? await Promise.all([
        admin.from("user_store_data").select("user_id, store_name, daily_entries").in("user_id", ids),
        admin.from("business_profiles").select("user_id, industry_category_id").in("user_id", ids),
        admin.from("roadmaps").select("user_id, current_stage_code, progress_percent").in("user_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const storeMap = new Map<string, { store_name?: string; daily_entries?: unknown }>();
  for (const s of (stores.data ?? []) as Array<{ user_id: string; store_name?: string; daily_entries?: unknown }>) {
    storeMap.set(s.user_id, s);
  }
  const industryMap = new Map<string, string>();
  for (const p of (profiles.data ?? []) as Array<{ user_id: string; industry_category_id?: string }>) {
    if (p.industry_category_id) industryMap.set(p.user_id, p.industry_category_id);
  }
  const roadmapMap = new Map<string, { current_stage_code?: string; progress_percent?: number }>();
  for (const r of (roadmaps.data ?? []) as Array<{ user_id: string; current_stage_code?: string; progress_percent?: number }>) {
    roadmapMap.set(r.user_id, r);
  }

  const items = users.map((u) => {
    const store = storeMap.get(u.id);
    const lastEntryDate = lastDailyEntryDate(store?.daily_entries);
    return {
      id: u.id,
      email: maskEmail(u.email),
      createdAt: u.created_at ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: Boolean(u.email_confirmed_at),
      storeName: store?.store_name ?? null,
      industry: industryMap.get(u.id) ?? null,
      stage: roadmapMap.get(u.id)?.current_stage_code ?? null,
      progress: roadmapMap.get(u.id)?.progress_percent ?? null,
      lastEntryDate,
    };
  });

  return NextResponse.json({
    ok: true,
    items,
    page,
    pageSize: PAGE_SIZE,
    hasMore: list.users.length === PAGE_SIZE,
  });
}

function lastDailyEntryDate(entries: unknown): string | null {
  if (!Array.isArray(entries)) return null;
  let max: string | null = null;
  for (const e of entries) {
    const d = (e as { date?: unknown })?.date;
    if (typeof d === "string" && (max === null || d > max)) max = d;
  }
  return max;
}
