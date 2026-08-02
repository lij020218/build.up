/**
 * GET /api/admin/usage — 기능 사용량 + AI 비용 집계.
 *
 * 데이터 소스 (전부 실데이터 원장 — 추정치 없음):
 *  · ai_daily_usage           — 유저×기능×일 AI 호출 카운터 (집행 겸 원장; Upstash 모드에선
 *                               rate-limit.ts 가 원장 기록을 별도로 남김)
 *  · ai_monthly_spend         — 월간 AI 비용 미터 (상한가 선차감 — 실비용은 이보다 낮음)
 *  · marketing_engagement_events — 마케팅 실행 신호 (복사 클릭·밈 원본 클릭)
 *
 * 정직성 원칙: 블록별 독립 실패 → null → UI 에서 "—" + 사유. 0 은 쿼리 성공 시에만.
 * 운영자 계정 제외 (2026-08-01 사장님 지시): 운영자의 테스트 호출·비용이 실사용자
 *   통계에 섞이면 사용량·비용·인원이 부풀려진다. /admin/activity 와 같은 기준(getAdminEmails).
 */
import { NextResponse } from "next/server";
import { requireAdmin, maskEmail } from "../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { adminRateLimit, buildEmailMap, buildExcludedUserIdSet, kstRecentDateStrings } from "../_shared";
import { internalExclusionRules } from "../../_lib/internal-accounts";
import { kstMonthKey, MONTHLY_AI_BUDGET_WON } from "../../_lib/ai-cost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeatureUsageRow = { feature: string; calls7d: number; calls30d: number; users30d: number };
type SpendRow = { email: string; spentWon: number };
type EngagementRow = { event: string; count30d: number; users30d: number };
type SurfaceVisitRow = { surface: string; visitDays30d: number; visitDays7d: number; users30d: number };

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  // 운영자 계정 — 모든 집계에서 제외 (사장님 지시 2026-08-01)
  const excludedIds = await buildExcludedUserIdSet(admin);
  const isAdminUser = (id: unknown): boolean => typeof id === "string" && excludedIds.has(id);

  // ── ① 기능별 AI 사용량 (최근 30일 / 7일) ──
  let aiUsage: { features: FeatureUsageRow[]; totalCalls30d: number; aiUsers30d: number } | null = null;
  try {
    const days30 = kstRecentDateStrings(30);
    const days7 = kstRecentDateStrings(7);
    const since = [...days30].sort()[0];
    const { data, error } = await admin
      .from("ai_daily_usage")
      .select("feature, usage_date, count, user_id")
      .gte("usage_date", since)
      .limit(20_000);
    if (!error && data) {
      const byFeature = new Map<string, { calls7d: number; calls30d: number; users: Set<string> }>();
      const allUsers = new Set<string>();
      let total = 0;
      for (const row of data) {
        const r = row as { feature?: unknown; usage_date?: unknown; count?: unknown; user_id?: unknown };
        const feature = typeof r.feature === "string" ? r.feature : "";
        const date = typeof r.usage_date === "string" ? r.usage_date.slice(0, 10) : "";
        const count = Number(r.count ?? 0);
        if (!feature || !days30.has(date) || !Number.isFinite(count) || count <= 0) continue;
        if (isAdminUser(r.user_id)) continue;   // 운영자 테스트 호출 제외
        const agg = byFeature.get(feature) ?? { calls7d: 0, calls30d: 0, users: new Set<string>() };
        agg.calls30d += count;
        if (days7.has(date)) agg.calls7d += count;
        if (typeof r.user_id === "string") {
          agg.users.add(r.user_id);
          allUsers.add(r.user_id);
        }
        byFeature.set(feature, agg);
        total += count;
      }
      aiUsage = {
        features: [...byFeature.entries()]
          .map(([feature, a]) => ({ feature, calls7d: a.calls7d, calls30d: a.calls30d, users30d: a.users.size }))
          .sort((a, b) => b.calls30d - a.calls30d),
        totalCalls30d: total,
        aiUsers30d: allUsers.size,
      };
    }
  } catch {
    aiUsage = null;
  }

  // ── ② 이번 달 AI 비용 (상한가 선차감 원장 — 실비용은 이보다 낮음) ──
  let spend: {
    monthKey: string;
    budgetWon: number;
    totalWon: number;
    users: number;
    nearBudgetUsers: number;
    top: SpendRow[];
  } | null = null;
  try {
    const monthKey = kstMonthKey();
    const { data, error } = await admin
      .from("ai_monthly_spend")
      .select("user_id, spent_won")
      .eq("month_key", monthKey)
      .limit(10_000);
    if (!error && data) {
      const rows = data
        .map((row) => {
          const r = row as { user_id?: unknown; spent_won?: unknown };
          return { userId: typeof r.user_id === "string" ? r.user_id : "", spentWon: Number(r.spent_won ?? 0) };
        })
        .filter((r) => r.userId && Number.isFinite(r.spentWon) && r.spentWon > 0)
        .filter((r) => !excludedIds.has(r.userId));   // 내부 계정 테스트 비용 제외
      const emailMap = await buildEmailMap(admin);
      spend = {
        monthKey,
        budgetWon: MONTHLY_AI_BUDGET_WON,
        totalWon: rows.reduce((s, r) => s + r.spentWon, 0),
        users: rows.length,
        nearBudgetUsers: rows.filter((r) => r.spentWon >= MONTHLY_AI_BUDGET_WON * 0.8).length,
        top: rows
          .sort((a, b) => b.spentWon - a.spentWon)
          .slice(0, 10)
          .map((r) => ({ email: maskEmail(emailMap.get(r.userId) ?? null), spentWon: Math.round(r.spentWon) })),
      };
    }
  } catch {
    spend = null;
  }

  // ── ③ 마케팅 실행 신호 (최근 30일) ──
  let engagement: EngagementRow[] | null = null;
  try {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { data, error } = await admin
      .from("marketing_engagement_events")
      .select("event, user_id")
      .gte("created_at", since)
      .limit(20_000);
    if (!error && data) {
      const byEvent = new Map<string, { count: number; users: Set<string> }>();
      for (const row of data) {
        const r = row as { event?: unknown; user_id?: unknown };
        if (typeof r.event !== "string") continue;
        if (isAdminUser(r.user_id)) continue;   // 운영자 제외
        const agg = byEvent.get(r.event) ?? { count: 0, users: new Set<string>() };
        agg.count += 1;
        if (typeof r.user_id === "string") agg.users.add(r.user_id);
        byEvent.set(r.event, agg);
      }
      engagement = [...byEvent.entries()]
        .map(([event, a]) => ({ event, count30d: a.count, users30d: a.users.size }))
        .sort((a, b) => b.count30d - a.count30d);
    }
  } catch {
    engagement = null;
  }

  // ── ④ 화면 방문 (surface_daily_visits — 탭 진입 일 카운터, 웹·iOS 공용) ──
  let surfaceVisits: SurfaceVisitRow[] | null = null;
  try {
    const days30 = kstRecentDateStrings(30);
    const days7 = kstRecentDateStrings(7);
    const since = [...days30].sort()[0];
    const { data, error } = await admin
      .from("surface_daily_visits")
      .select("surface, visit_date, user_id")
      .gte("visit_date", since)
      .limit(50_000);
    if (!error && data) {
      const bySurface = new Map<string, { d30: number; d7: number; users: Set<string> }>();
      for (const row of data) {
        const r = row as { surface?: unknown; visit_date?: unknown; user_id?: unknown };
        const surface = typeof r.surface === "string" ? r.surface : "";
        const date = typeof r.visit_date === "string" ? r.visit_date.slice(0, 10) : "";
        if (!surface || !days30.has(date)) continue;
        if (isAdminUser(r.user_id)) continue;   // 운영자 제외
        const agg = bySurface.get(surface) ?? { d30: 0, d7: 0, users: new Set<string>() };
        agg.d30 += 1; // 행 = 유저×화면×일 → 방문일 수
        if (days7.has(date)) agg.d7 += 1;
        if (typeof r.user_id === "string") agg.users.add(r.user_id);
        bySurface.set(surface, agg);
      }
      surfaceVisits = [...bySurface.entries()]
        .map(([surface, a]) => ({ surface, visitDays30d: a.d30, visitDays7d: a.d7, users30d: a.users.size }))
        .sort((a, b) => b.visitDays30d - a.visitDays30d);
    }
  } catch {
    surfaceVisits = null;
  }

  // ── ⑤ 저장 기반 활동 (계측 없이 기존 데이터에서 파생 — "저장 발생 기준" 명시 필수) ──
  //  · salesEntryUsers: daily_entries 에 최근 30일 날짜가 있는 유저 (매출 입력)
  //  · roadmapActiveUsers: roadmaps.updated_at 30일 내 (로드맵 진행·수정)
  //  · attendanceStores: attendance_records.work_date 30일 내 distinct 사장 (출퇴근 기록 가게)
  let derived: { salesEntryUsers30d: number | null; roadmapActiveUsers30d: number | null; attendanceStores30d: number | null } | null = null;
  {
    let salesEntryUsers30d: number | null = null;
    try {
      const days30 = kstRecentDateStrings(30);
      const { data, error } = await admin.from("user_store_data").select("user_id, daily_entries").limit(5_000);
      if (!error && data) {
        salesEntryUsers30d = data.filter((row) => {
          const entries = (row as { daily_entries?: unknown }).daily_entries;
          if (!Array.isArray(entries)) return false;
          return entries.some((e) => {
            const date = (e as { date?: unknown })?.date;
            return typeof date === "string" && days30.has(date.slice(0, 10));
          });
        }).length;
      }
    } catch {
      salesEntryUsers30d = null;
    }

    let roadmapActiveUsers30d: number | null = null;
    try {
      const sinceIso = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data, error } = await admin.from("roadmaps").select("user_id, updated_at").gte("updated_at", sinceIso).limit(10_000);
      if (!error && data) {
        roadmapActiveUsers30d = new Set(
          data.map((r) => (r as { user_id?: unknown }).user_id).filter((v): v is string => typeof v === "string"),
        ).size;
      }
    } catch {
      roadmapActiveUsers30d = null;
    }

    let attendanceStores30d: number | null = null;
    try {
      const days30 = kstRecentDateStrings(30);
      const since = [...days30].sort()[0];
      const { data, error } = await admin.from("attendance_records").select("owner_user_id, work_date").gte("work_date", since).limit(20_000);
      if (!error && data) {
        attendanceStores30d = new Set(
          data.map((r) => (r as { owner_user_id?: unknown }).owner_user_id).filter((v): v is string => typeof v === "string"),
        ).size;
      }
    } catch {
      attendanceStores30d = null;
    }

    derived = { salesEntryUsers30d, roadmapActiveUsers30d, attendanceStores30d };
  }

  // 조용히 빼지 않는다 — 화면이 "운영자 N명 제외"를 명시한다
  return NextResponse.json({ ok: true, aiUsage, spend, engagement, surfaceVisits, derived, excludedAccounts: excludedIds.size, excludedRules: internalExclusionRules() });
}
