/**
 * POST /api/admin/ai-usage/reset 가드:
 *   ① 관리자 게이트(requireAdmin 실패 → 403, 원장·Redis 무접촉)
 *   ② 원장 zeroing — 오늘(KST) ai_daily_usage count=0 (feature 지정/전체)
 *   ③ Redis 일·주 키 삭제 (feature 지정 시 2개, 전체면 AI_FEATURE_LIMITS × 2)
 *   ④ 월예산 환불 — 바닥 0
 *   ⑤ 이메일 미존재 → 404
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const adminGate = vi.fn(async (): Promise<{ ok: true; userId: string; email: string } | { ok: false; status: number; error: string }> =>
  ({ ok: true, userId: "admin-0000-0000", email: "admin@x.com" }));
vi.mock("../app/api/_lib/admin-auth", () => ({ requireAdmin: (...a: unknown[]) => adminGate(...(a as [])) , maskEmail: (e: string) => e }));
vi.mock("../app/api/_lib/supabase-admin", () => ({ getSupabaseAdmin: vi.fn(() => mockAdmin) }));
vi.mock("../app/api/admin/_shared", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../app/api/admin/_shared")>();
  return { ...orig, adminRateLimit: vi.fn(async () => ({ ok: true, remaining: 1, limit: 120, resetAt: 0 })) };
});
const redisDel = vi.fn(async (...keys: string[]) => keys.length);
const redisDecrby = vi.fn(async () => 0);
const redisSet = vi.fn(async () => "OK");
let redisEnabled = true;
vi.mock("../app/api/_lib/rate-limit", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../app/api/_lib/rate-limit")>();
  return { ...orig, getRedisClient: () => (redisEnabled ? { del: redisDel, decrby: redisDecrby, set: redisSet } : null) };
});

import { POST } from "../app/api/admin/ai-usage/reset/route";
import { AI_FEATURE_LIMITS } from "../app/api/_lib/ai-guard";
import { kstWeekKey } from "../app/api/_lib/rate-limit";
import { kstMonthKey } from "../app/api/_lib/ai-cost";

const USER_ID = "11111111-2222-3333-4444-555555555555";
const TODAY = new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);

/** 원장 스텁 — update 호출을 기록하고 filter 에 따라 맞는 행 수를 돌려준다 */
const calls: { table: string; op: string; payload?: unknown; filters: Record<string, unknown> }[] = [];
let dailyRows: { user_id: string; feature: string; usage_date: string; count: number }[] = [];
let monthlySpent: number | null = 500;

const mockAdmin = {
  auth: { admin: { listUsers: vi.fn(async () => ({ data: { users: [{ id: USER_ID, email: "Boss@Example.com" }, { id: "other", email: "x@y.z" }] }, error: null })) } },
  from(table: string) {
    const rec = { table, op: "", payload: undefined as unknown, filters: {} as Record<string, unknown> };
    const q = {
      update(p: unknown) { rec.op = "update"; rec.payload = p; return q; },
      select(_cols?: string) {
        if (rec.op === "update") {
          calls.push(rec);
          const matched = dailyRows.filter((r) => Object.entries(rec.filters).every(([k, v]) => (r as Record<string, unknown>)[k] === v));
          return Promise.resolve({ data: matched.map((r) => ({ feature: r.feature })), error: null });
        }
        rec.op = "select"; return q;
      },
      eq(k: string, v: unknown) { rec.filters[k] = v; return q; },
      maybeSingle() { calls.push(rec); return Promise.resolve({ data: table === "ai_monthly_spend" && monthlySpent !== null ? { spent_won: monthlySpent } : null, error: null }); },
      then(res: (v: { data: unknown; error: null }) => void) { calls.push(rec); res({ data: null, error: null }); },
    };
    return q;
  },
};

const req = (body: unknown) => new Request("https://x/api/admin/ai-usage/reset", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

describe("POST /api/admin/ai-usage/reset", () => {
  beforeEach(() => {
    calls.length = 0; redisDel.mockClear(); redisDecrby.mockClear(); redisSet.mockClear(); redisEnabled = true; monthlySpent = 500;
    dailyRows = [
      { user_id: USER_ID, feature: "quick-query", usage_date: TODAY, count: 7 },
      { user_id: USER_ID, feature: "contract-analyze", usage_date: TODAY, count: 2 },
      { user_id: USER_ID, feature: "quick-query", usage_date: "2020-01-01", count: 9 },
    ];
    adminGate.mockResolvedValue({ ok: true, userId: "admin-0000-0000", email: "admin@x.com" });
  });

  it("① 비관리자 → 403, 원장·Redis 무접촉", async () => {
    adminGate.mockResolvedValueOnce({ ok: false, status: 403, error: "관리자 권한이 없습니다." });
    const r = await POST(req({ email: "boss@example.com" }));
    expect(r.status).toBe(403);
    expect(calls).toEqual([]);
    expect(redisDel).not.toHaveBeenCalled();
  });

  it("② feature 지정 — 오늘 원장 그 기능만 0, Redis 일·주 키 2개 삭제", async () => {
    const r = await POST(req({ email: " boss@example.com ", feature: "quick-query" }));
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.userId).toBe(USER_ID);
    expect(j.ledgerRowsZeroed).toBe(1);
    const upd = calls.find((c) => c.table === "ai_daily_usage" && c.op === "update")!;
    expect(upd.payload).toEqual({ count: 0 });
    expect(upd.filters).toEqual({ user_id: USER_ID, usage_date: TODAY, feature: "quick-query" });
    expect(redisDel).toHaveBeenCalledWith(
      `@buildup/aiq:day:${TODAY}:quick-query:${USER_ID}`,
      `@buildup/aiq:week:${kstWeekKey()}:quick-query:${USER_ID}`,
    );
    expect(j.redisKeysDeleted).toBe(2);
    expect(j.monthlyRefundedWon).toBe(0);
    expect(redisDecrby).not.toHaveBeenCalled();
  });

  it("③ feature 생략 — 오늘 전 기능 0, AI_FEATURE_LIMITS × 2 키 삭제", async () => {
    const r = await POST(req({ email: "boss@example.com" }));
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.ledgerRowsZeroed).toBe(2);
    const upd = calls.find((c) => c.table === "ai_daily_usage" && c.op === "update")!;
    expect(upd.filters).toEqual({ user_id: USER_ID, usage_date: TODAY });
    const n = Object.keys(AI_FEATURE_LIMITS).length;
    expect(j.featuresAffected).toBe(n);
    expect(redisDel.mock.calls[0]).toHaveLength(n * 2);
  });

  it("④ refundMonthlyWon — 이번 달 spent_won 차감(바닥 0) + Redis 월 미터 차감", async () => {
    monthlySpent = 300;
    const r = await POST(req({ email: "boss@example.com", feature: "quick-query", refundMonthlyWon: 1000 }));
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.monthlyRefundedWon).toBe(300);
    expect(j.monthlySpentAfter).toBe(0);
    const upd = calls.find((c) => c.table === "ai_monthly_spend" && c.op === "update")!;
    expect((upd.payload as { spent_won: number }).spent_won).toBe(0);
    expect(upd.filters).toEqual({ user_id: USER_ID, month_key: kstMonthKey() });
    expect(redisDecrby).toHaveBeenCalledWith(`@buildup/aicost:${kstMonthKey()}:${USER_ID}`, 1000);
  });

  it("⑤ Redis 미설정이면 redisKeysDeleted=null, 원장만 처리 / 미존재 이메일 404 / 잘못된 입력 400", async () => {
    redisEnabled = false;
    const r = await POST(req({ email: "boss@example.com", feature: "quick-query" }));
    expect((await r.json()).redisKeysDeleted).toBeNull();
    expect((await POST(req({ email: "nobody@example.com" }))).status).toBe(404);
    expect((await POST(req({ email: "" }))).status).toBe(400);
    expect((await POST(req({ email: "boss@example.com", feature: "../bad" }))).status).toBe(400);
    expect((await POST(req({ email: "boss@example.com", refundMonthlyWon: -5 }))).status).toBe(400);
  });
});
