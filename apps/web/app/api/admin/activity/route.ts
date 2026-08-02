/**
 * GET /api/admin/activity — 사용자별 일자 활동 로그 (2026-08-01 사장님 요청)
 *
 *   "그 날 그 날 어떤 사용자가 우리 서비스를 이용했는지 —
 *    a사용자 8월 3일 로드맵 사용 (최신 사용일 8월 3일) 이런 식으로"
 *
 * 데이터 소스 (전부 실데이터 원장 — 추정치 없음):
 *  · surface_daily_visits — 유저×화면×일(KST) 방문 카운터. 웹·iOS 공용 계측
 *  · ai_daily_usage       — 유저×기능×일 AI 호출 (계측이 아니라 집행 원장)
 *
 * ⚠️ 정직성 경계 — 이 화면이 말할 수 있는 것과 없는 것
 *  · 여기 없는 사용자 = "안 썼다"가 아니라 **"계측된 활동이 없다"**.
 *    계측(record_surface_visit)은 2026-07-28 부터, 그 이전 활동은 기록이 없다.
 *  · 화면 방문은 "탭 진입" 이지 체류·완료가 아니다. 횟수는 하루 1,000 상한(스팸 가드).
 *  · 이메일은 마스킹해서 내려준다 (운영자도 원문을 볼 이유가 없다).
 *  · **운영자 계정은 집계에서 제외** (2026-08-01 사장님 지시) — 테스트 사용이 실사용자
 *    통계를 부풀린다. 제외 인원 수는 응답에 실어 화면이 명시한다(조용한 제외 금지).
 */
import { NextResponse } from "next/server";
import { requireAdmin, maskEmail } from "../../_lib/admin-auth";
import { getSupabaseAdmin } from "../../_lib/supabase-admin";
import { adminRateLimit, buildEmailMap, buildAdminUserIdSet, kstRecentDateStrings } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 한 사용자의 하루 활동 */
type DayActivity = {
  date: string;                                   // YYYY-MM-DD (KST)
  surfaces: Array<{ surface: string; count: number }>;
  aiFeatures: Array<{ feature: string; count: number }>;
};

type UserActivity = {
  userId: string;
  email: string;                                  // 마스킹됨
  lastActiveDate: string;                         // 최신 사용일
  activeDays: number;                             // 기간 내 활동한 날 수
  days: DayActivity[];                            // 최신순
};

const MAX_DAYS = 60;

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const rl = await adminRateLimit(gate.userId);
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  const url = new URL(request.url);
  const rawDays = Number(url.searchParams.get("days") ?? 14);
  const days = Number.isFinite(rawDays) ? Math.min(Math.max(Math.trunc(rawDays), 1), MAX_DAYS) : 14;
  const dateSet = kstRecentDateStrings(days);
  const since = [...dateSet].sort()[0];

  // 운영자 계정 — 집계 진입 전에 걸러낸다 (사장님 지시 2026-08-01)
  const adminIds = await buildAdminUserIdSet(admin);
  const excludedAdminIds = new Set<string>();

  // 유저×날짜 → 활동 누적. 블록별 독립 실패 (한쪽이 죽어도 나머지는 보여준다)
  const byUser = new Map<string, Map<string, DayActivity>>();
  const touch = (userId: string, date: string): DayActivity | null => {
    if (adminIds.has(userId)) { excludedAdminIds.add(userId); return null; }
    let dayMap = byUser.get(userId);
    if (!dayMap) { dayMap = new Map(); byUser.set(userId, dayMap); }
    let day = dayMap.get(date);
    if (!day) { day = { date, surfaces: [], aiFeatures: [] }; dayMap.set(date, day); }
    return day;
  };

  // ── ① 화면 방문 ──
  let visitsFailed = false;
  try {
    const { data, error } = await admin
      .from("surface_daily_visits")
      .select("user_id, surface, visit_date, count")
      .gte("visit_date", since)
      .limit(50_000);
    if (error || !data) {
      visitsFailed = true;
    } else {
      for (const row of data) {
        const r = row as { user_id?: unknown; surface?: unknown; visit_date?: unknown; count?: unknown };
        const userId = typeof r.user_id === "string" ? r.user_id : "";
        const surface = typeof r.surface === "string" ? r.surface : "";
        const date = typeof r.visit_date === "string" ? r.visit_date.slice(0, 10) : "";
        const count = Number(r.count ?? 0);
        if (!userId || !surface || !dateSet.has(date) || !Number.isFinite(count) || count <= 0) continue;
        touch(userId, date)?.surfaces.push({ surface, count });
      }
    }
  } catch {
    visitsFailed = true;
  }

  // ── ② AI 사용 (집행 원장 — 계측과 별개로 "실제 무엇을 돌렸는지") ──
  let aiFailed = false;
  try {
    const { data, error } = await admin
      .from("ai_daily_usage")
      .select("user_id, feature, usage_date, count")
      .gte("usage_date", since)
      .limit(20_000);
    if (error || !data) {
      aiFailed = true;
    } else {
      for (const row of data) {
        const r = row as { user_id?: unknown; feature?: unknown; usage_date?: unknown; count?: unknown };
        const userId = typeof r.user_id === "string" ? r.user_id : "";
        const feature = typeof r.feature === "string" ? r.feature : "";
        const date = typeof r.usage_date === "string" ? r.usage_date.slice(0, 10) : "";
        const count = Number(r.count ?? 0);
        if (!userId || !feature || !dateSet.has(date) || !Number.isFinite(count) || count <= 0) continue;
        touch(userId, date)?.aiFeatures.push({ feature, count });
      }
    }
  } catch {
    aiFailed = true;
  }

  const emailMap = await buildEmailMap(admin);

  const users: UserActivity[] = [...byUser.entries()]
    .map(([userId, dayMap]) => {
      const dayList = [...dayMap.values()]
        .map((d) => ({
          ...d,
          surfaces: d.surfaces.sort((a, b) => b.count - a.count),
          aiFeatures: d.aiFeatures.sort((a, b) => b.count - a.count),
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
      return {
        userId,
        email: maskEmail(emailMap.get(userId) ?? ""),
        lastActiveDate: dayList[0]?.date ?? "",
        activeDays: dayList.length,
        days: dayList,
      };
    })
    // 최신 사용일 내림차순 — 오늘 쓴 사람이 맨 위
    .sort((a, b) => b.lastActiveDate.localeCompare(a.lastActiveDate) || b.activeDays - a.activeDays);

  // 날짜별 요약 (그 날 몇 명이 썼나) — 사장님이 "그 날 그 날" 보시는 뷰
  const byDate = new Map<string, Set<string>>();
  for (const u of users) {
    for (const d of u.days) {
      const set = byDate.get(d.date) ?? new Set<string>();
      set.add(u.userId);
      byDate.set(d.date, set);
    }
  }
  const daily = [...byDate.entries()]
    .map(([date, set]) => ({ date, users: set.size }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({
    ok: true,
    days,
    // 실패를 빈 목록으로 위장하지 않는다 — UI 가 "집계 불가 + 사유"를 표시한다
    visitsFailed,
    aiFailed,
    // 계측 시작일 — 이전 활동은 기록 자체가 없다는 사실을 화면이 말할 수 있게
    trackingSince: "2026-07-28",
    // 조용히 빼지 않는다 — 화면이 "운영자 N명 제외" 를 말한다
    excludedAdmins: excludedAdminIds.size,
    daily,
    users,
  });
}
