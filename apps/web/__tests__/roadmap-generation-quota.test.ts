import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 로드맵 생성 쿼터 가드 (2026-08-03 사장님 정책):
 *   무료 = 계정당 총 3회 / 프로 = 주 3회(롤링 7일).
 *  가짜 Supabase 로 판정 로직을 행동 검증 — 만료 구독 강등·주간 창·오류≠한도초과까지.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

// ── 가짜 Supabase — 체인 빌더 (select().eq().gte() → thenable / maybeSingle) ──
type Row = Record<string, unknown>;
const state: {
  subscription: Row | null;
  usageRows: Row[];          // { count, usage_date }
  failUsageQuery: boolean;
  rpcCalls: Array<{ fn: string; args: Row }>;
} = { subscription: null, usageRows: [], failUsageQuery: false, rpcCalls: [] };

function makeBuilder(table: string) {
  const filters: Array<{ op: string; col: string; val: unknown }> = [];
  const b = {
    select: () => b,
    update: () => b,
    eq: (col: string, val: unknown) => { filters.push({ op: "eq", col, val }); return b; },
    gte: (col: string, val: unknown) => { filters.push({ op: "gte", col, val }); return b; },
    maybeSingle: async () => {
      if (table === "foundone_subscriptions") return { data: state.subscription, error: null };
      return { data: null, error: null };
    },
    then: (resolve: (v: { data: Row[] | null; error: unknown }) => void) => {
      if (table === "ai_daily_usage") {
        if (state.failUsageQuery) return resolve({ data: null, error: new Error("boom") });
        const gte = filters.find((f) => f.op === "gte" && f.col === "usage_date");
        const rows = state.usageRows.filter((r) => !gte || String(r.usage_date) >= String(gte.val));
        return resolve({ data: rows, error: null });
      }
      return resolve({ data: [], error: null });
    },
  };
  return b;
}

vi.mock("../app/api/_lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => makeBuilder(table),
    rpc: async (fn: string, args: Row) => {
      state.rpcCalls.push({ fn, args });
      if (fn === "consume_ai_monthly_budget") return { data: [{ allowed: true }], error: null };
      if (fn === "consume_ai_daily_quota") return { data: [{ allowed: true, current_count: 1 }], error: null };
      return { data: null, error: null };
    },
  }),
}));

const { checkRoadmapGenerationQuota } = await import("../app/api/_lib/rate-limit");

const kstToday = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
const kstDaysAgo = (n: number) =>
  new Date(Date.now() + 9 * 3600_000 - n * 86_400_000).toISOString().slice(0, 10);

beforeEach(() => {
  state.subscription = null;
  state.usageRows = [];
  state.failUsageQuery = false;
  state.rpcCalls = [];
});

describe("무료 — 계정당 총 3회 (평생)", () => {
  it("누적 3회면 차단 — 옛날 사용분도 센다 (일일 리셋 아님)", async () => {
    state.usageRows = [
      { count: 1, usage_date: "2026-05-01" },
      { count: 2, usage_date: kstDaysAgo(30) },
    ];
    const r = await checkRoadmapGenerationQuota("u1");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(429);
      expect(r.error).toContain("총 3회");
      expect(r.error).toContain("수정·진행은 계속 가능");
    }
  });

  it("누적 2회면 통과 + 원장 기록·월예산 차감", async () => {
    state.usageRows = [{ count: 2, usage_date: "2026-06-01" }];
    const r = await checkRoadmapGenerationQuota("u1");
    expect(r.ok).toBe(true);
    expect(state.rpcCalls.some((c) => c.fn === "consume_ai_daily_quota")).toBe(true);
    expect(state.rpcCalls.some((c) => c.fn === "consume_ai_monthly_budget")).toBe(true);
  });
});

describe("프로 — 주 3회 (롤링 7일)", () => {
  const activePro = () => ({
    plan: "premium", status: "active",
    current_period_end: new Date(Date.now() + 20 * 86_400_000).toISOString(),
  });

  it("이번 주 3회면 차단", async () => {
    state.subscription = activePro();
    state.usageRows = [
      { count: 2, usage_date: kstToday() },
      { count: 1, usage_date: kstDaysAgo(3) },
    ];
    const r = await checkRoadmapGenerationQuota("u1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("이번 주");
  });

  it("옛날 사용분(7일 밖)은 안 센다 — 무료였다면 차단됐을 누적도 프로는 통과", async () => {
    state.subscription = activePro();
    state.usageRows = [
      { count: 5, usage_date: kstDaysAgo(10) },   // 창 밖
      { count: 2, usage_date: kstDaysAgo(2) },    // 창 안 2회
    ];
    const r = await checkRoadmapGenerationQuota("u1");
    expect(r.ok).toBe(true);
  });

  it("만료된 프리미엄은 무료 기준(평생 합산)으로 강등", async () => {
    state.subscription = {
      plan: "premium", status: "active",
      current_period_end: new Date(Date.now() - 86_400_000).toISOString(),   // 어제 만료
    };
    state.usageRows = [{ count: 3, usage_date: kstDaysAgo(60) }];   // 주간 창 밖이지만 평생 3회
    const r = await checkRoadmapGenerationQuota("u1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("총 3회");
  });
});

describe("정직성 — 오류 ≠ 한도 초과", () => {
  it("원장 조회 실패는 503 '확인 실패' — 429 한도 사칭 금지", async () => {
    state.failUsageQuery = true;
    const r = await checkRoadmapGenerationQuota("u1");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(503);
      expect(r.error).toContain("확인할 수 없어요");
      expect(r.error).not.toContain("한도");
    }
  });
});

describe("라우트 배선 — 게이트 교체 + 실패 환불", () => {
  const route = readFileSync(join(HERE, "..", "app", "api", "ai", "roadmap", "generate", "route.ts"), "utf8");

  it("일일 한도 대신 쿼터 게이트를 쓴다", () => {
    expect(route).toContain("checkRoadmapGenerationQuota(auth.userId)");
    expect(route).not.toContain('feature: "roadmap-generate",\n    limit: 3');
  });

  it("서버 오류 경로 2곳에서 차감을 환불한다 (평생 3회에서 실패가 크레딧을 먹지 않게)", () => {
    const refunds = route.match(/refundRoadmapGenerationUse\(auth\.userId\)/g) ?? [];
    expect(refunds.length).toBeGreaterThanOrEqual(2);
  });
});
