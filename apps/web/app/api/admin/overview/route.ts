/**
 * GET /api/admin/overview — 관리자 개요 지표.
 *
 * 정직성 원칙: 계산 불가/표본 부족은 null 로 반환 → UI 에서 "—". 가짜 숫자 금지.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { adminRateLimit, kstMidnightUtcIso, kstRecentDateStrings } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StageBucket = { stage: string; count: number };

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  // 총 가입자 (user_profiles = 가입 트리거로 1인 1행)
  const totalUsers = await safeCount(
    admin.from("user_profiles").select("*", { count: "exact", head: true }),
  );

  // 오늘 가입 (KST 자정 이후)
  const todayUsers = await safeCount(
    admin.from("user_profiles").select("*", { count: "exact", head: true }).gte("created_at", kstMidnightUtcIso()),
  );

  // 총 피드백
  const totalFeedback = await safeCount(
    admin.from("user_feedback").select("*", { count: "exact", head: true }),
  );

  // 활성 사장님 (최근 7일 daily_entries 입력) — jsonb JS 집계
  let activeUsers7d: number | null = null;
  try {
    const recent = kstRecentDateStrings(7);
    const { data, error } = await admin
      .from("user_store_data")
      .select("user_id, daily_entries")
      .limit(5000);
    if (!error && data) {
      activeUsers7d = data.filter((row) => {
        const entries = (row as { daily_entries?: unknown }).daily_entries;
        if (!Array.isArray(entries)) return false;
        return entries.some((e) => {
          const date = (e as { date?: unknown })?.date;
          return typeof date === "string" && recent.has(date.slice(0, 10));
        });
      }).length;
    }
  } catch {
    activeUsers7d = null;
  }

  // 로드맵 단계 분포
  let stageDistribution: StageBucket[] | null = null;
  try {
    const { data, error } = await admin
      .from("roadmaps")
      .select("current_stage_code")
      .limit(5000);
    if (!error && data) {
      const counts = new Map<string, number>();
      for (const row of data) {
        const code = (row as { current_stage_code?: unknown }).current_stage_code;
        const key = typeof code === "string" && code ? code : "(미지정)";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      stageDistribution = [...counts.entries()]
        .map(([stage, count]) => ({ stage, count }))
        .sort((a, b) => b.count - a.count);
    }
  } catch {
    stageDistribution = null;
  }

  return NextResponse.json({
    ok: true,
    metrics: {
      totalUsers,
      todayUsers,
      activeUsers7d,
      totalFeedback,
      stageDistribution,
    },
  });
}

/** count(exact, head) 결과를 안전 추출 — 실패 시 null(가짜숫자 금지) */
async function safeCount(
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  try {
    const { count, error } = await query;
    return error ? null : count ?? null;
  } catch {
    return null;
  }
}
