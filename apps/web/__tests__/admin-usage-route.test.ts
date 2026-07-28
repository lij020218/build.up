/**
 * /api/admin/usage 집계 정직성 가드 — 실데이터 원장 집계가 맞는지:
 *   ① 기능별 30일/7일 호출·유저 집계 (윈도우 밖 날짜 제외)
 *   ② 비용 합계·상위 유저(이메일 마스킹)·예산 근접 카운트
 *   ③ 쿼리 실패 블록은 0 이 아니라 null (가짜 0 금지)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../app/api/_lib/admin-auth", () => ({
  requireAdmin: vi.fn(async () => ({ ok: true, userId: "admin-1", email: "admin@x.com" })),
  maskEmail: (email: string | null | undefined) => (email ? `${email[0]}***` : "—"),
}));
vi.mock("../app/api/_lib/supabase-admin", () => ({
  getSupabaseAdmin: vi.fn(() => mockAdmin),
}));
vi.mock("../app/api/admin/_shared", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../app/api/admin/_shared")>();
  return {
    ...orig,
    adminRateLimit: vi.fn(async () => ({ ok: true, remaining: 1, limit: 120, resetAt: 0 })),
    buildEmailMap: vi.fn(async () => new Map([["u1", "boss@naver.com"], ["u2", "cafe@daum.net"]])),
  };
});

import { GET } from "../app/api/admin/usage/route";
import { kstRecentDateStrings } from "../app/api/admin/_shared";
import { kstMonthKey } from "../app/api/_lib/ai-cost";

/** 테이블별 응답을 지정하는 체이너블 쿼리 스텁 */
type TableResult = { data: unknown[] | null; error: unknown };
let tableResults: Record<string, TableResult>;

const mockAdmin = {
  from(table: string) {
    const result = tableResults[table] ?? { data: null, error: { message: "no stub" } };
    const q = {
      select: () => q,
      gte: () => q,
      eq: () => q,
      limit: () => Promise.resolve(result),
    };
    return q;
  },
};

const req = new Request("https://x/api/admin/usage");

describe("GET /api/admin/usage", () => {
  beforeEach(() => {
    tableResults = {};
  });

  it("기능별 30일/7일 호출·유저를 집계하고 윈도우 밖 날짜는 제외한다", async () => {
    const today = [...kstRecentDateStrings(1)][0];
    const tenDaysAgo = [...kstRecentDateStrings(11)].sort()[0];
    tableResults["ai_daily_usage"] = {
      data: [
        { feature: "quick-query", usage_date: today, count: 5, user_id: "u1" },
        { feature: "quick-query", usage_date: tenDaysAgo, count: 3, user_id: "u2" },
        { feature: "contract-analyze", usage_date: today, count: 2, user_id: "u1" },
        // 윈도우 밖(40일 전) — 집계 제외되어야 함
        { feature: "quick-query", usage_date: "2020-01-01", count: 99, user_id: "u9" },
      ],
      error: null,
    };
    tableResults["ai_monthly_spend"] = { data: [], error: null };
    tableResults["marketing_engagement_events"] = { data: [], error: null };

    const res = await GET(req);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.aiUsage.totalCalls30d).toBe(10); // 5+3+2, 99 제외
    expect(body.aiUsage.aiUsers30d).toBe(2); // u1, u2
    const qq = body.aiUsage.features.find((f: { feature: string }) => f.feature === "quick-query");
    expect(qq).toMatchObject({ calls30d: 8, calls7d: 5, users30d: 2 }); // 10일 전 건은 7일 밖
    expect(body.aiUsage.features[0].feature).toBe("quick-query"); // 호출수 내림차순
  });

  it("비용 합계·상위 유저(마스킹)·예산 근접을 집계한다", async () => {
    tableResults["ai_daily_usage"] = { data: [], error: null };
    tableResults["ai_monthly_spend"] = {
      data: [
        { user_id: "u1", spent_won: 5100 }, // 6000 의 80% 이상 → 근접
        { user_id: "u2", spent_won: 300 },
      ],
      error: null,
    };
    tableResults["marketing_engagement_events"] = {
      data: [
        { event: "copy_click", user_id: "u1" },
        { event: "copy_click", user_id: "u2" },
        { event: "meme_origin_click", user_id: "u1" },
      ],
      error: null,
    };

    const res = await GET(req);
    const body = await res.json();
    expect(body.spend.monthKey).toBe(kstMonthKey());
    expect(body.spend.totalWon).toBe(5400);
    expect(body.spend.users).toBe(2);
    expect(body.spend.nearBudgetUsers).toBe(1);
    expect(body.spend.top[0]).toEqual({ email: "b***", spentWon: 5100 }); // 마스킹 + 내림차순
    const copy = body.engagement.find((e: { event: string }) => e.event === "copy_click");
    expect(copy).toMatchObject({ count30d: 2, users30d: 2 });
  });

  it("쿼리 실패 블록은 null (가짜 0 금지) — 다른 블록은 살아있다", async () => {
    tableResults["ai_daily_usage"] = { data: null, error: { message: "relation does not exist" } };
    tableResults["ai_monthly_spend"] = { data: [{ user_id: "u1", spent_won: 100 }], error: null };
    tableResults["marketing_engagement_events"] = { data: null, error: { message: "boom" } };

    const res = await GET(req);
    const body = await res.json();
    expect(body.aiUsage).toBeNull();
    expect(body.engagement).toBeNull();
    expect(body.spend.totalWon).toBe(100); // 독립 블록은 정상 집계
    expect(body.surfaceVisits).toBeNull(); // 스텁 없음 → 실패 → null
    // 파생 지표도 개별 실패 시 null (스텁 없는 테이블들)
    expect(body.derived).toEqual({ salesEntryUsers30d: null, roadmapActiveUsers30d: null, attendanceStores30d: null });
  });

  it("화면 방문: 유저×화면×일 행을 방문일·유저수로 집계하고 윈도우 밖은 제외한다", async () => {
    const today = [...kstRecentDateStrings(1)][0];
    const tenDaysAgo = [...kstRecentDateStrings(11)].sort()[0];
    tableResults["ai_daily_usage"] = { data: [], error: null };
    tableResults["ai_monthly_spend"] = { data: [], error: null };
    tableResults["marketing_engagement_events"] = { data: [], error: null };
    tableResults["surface_daily_visits"] = {
      data: [
        { surface: "tax", visit_date: today, user_id: "u1" },
        { surface: "tax", visit_date: tenDaysAgo, user_id: "u1" }, // 같은 유저 다른 날 = 방문일 2
        { surface: "tax", visit_date: today, user_id: "u2" },
        { surface: "finance", visit_date: today, user_id: "u1" },
        { surface: "tax", visit_date: "2020-01-01", user_id: "u9" }, // 윈도우 밖 제외
      ],
      error: null,
    };

    const res = await GET(req);
    const body = await res.json();
    const tax = body.surfaceVisits.find((s: { surface: string }) => s.surface === "tax");
    expect(tax).toMatchObject({ visitDays30d: 3, visitDays7d: 2, users30d: 2 });
    expect(body.surfaceVisits[0].surface).toBe("tax"); // 방문일 내림차순
  });

  it("저장 기반 파생 지표: 매출입력·로드맵·근태를 각각 집계한다", async () => {
    const today = [...kstRecentDateStrings(1)][0];
    tableResults["ai_daily_usage"] = { data: [], error: null };
    tableResults["ai_monthly_spend"] = { data: [], error: null };
    tableResults["marketing_engagement_events"] = { data: [], error: null };
    tableResults["surface_daily_visits"] = { data: [], error: null };
    tableResults["user_store_data"] = {
      data: [
        { user_id: "u1", daily_entries: [{ date: today }] },
        { user_id: "u2", daily_entries: [{ date: "2020-01-01" }] }, // 옛 입력만 → 제외
        { user_id: "u3", daily_entries: null },
      ],
      error: null,
    };
    tableResults["roadmaps"] = {
      data: [{ user_id: "u1" }, { user_id: "u2" }, { user_id: "u1" }], // distinct 2
      error: null,
    };
    tableResults["attendance_records"] = {
      data: [{ owner_user_id: "o1" }, { owner_user_id: "o1" }], // distinct 1
      error: null,
    };

    const res = await GET(req);
    const body = await res.json();
    expect(body.derived).toEqual({ salesEntryUsers30d: 1, roadmapActiveUsers30d: 2, attendanceStores30d: 1 });
  });
});
