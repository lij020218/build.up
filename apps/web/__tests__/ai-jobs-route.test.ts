/**
 * GET /api/ai/jobs/[id] 권한 가드 — 본인 작업만 보이고, 타인·미존재·비UUID 는 404, 미인증 401.
 *   + toAiJobView: result 는 succeeded 일 때만, error 는 failed 일 때만 노출(user_id·input 비노출).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let currentUser: { ok: true; userId: string } | { ok: false; status: number; error: string } = { ok: true, userId: "u1" };
vi.mock("../app/api/_lib/auth", () => ({
  requireApiUser: vi.fn(async () => currentUser),
}));

/** ai_jobs 행 저장소 — select().eq(id).eq(user_id).maybeSingle() 체인 스텁 */
type Row = { id: string; user_id: string; feature: string; status: string; result?: unknown; error?: string | null; progress?: string | null; input?: unknown };
let rows: Row[] = [];
const mockAdmin = {
  from(table: string) {
    expect(table).toBe("ai_jobs");
    const filters: Record<string, unknown> = {};
    const q = {
      select: () => q,
      eq: (col: string, val: unknown) => { filters[col] = val; return q; },
      maybeSingle: async () => {
        const hit = rows.find((r) => Object.entries(filters).every(([k, v]) => (r as Record<string, unknown>)[k] === v));
        return { data: hit ? { created_at: "2026-08-19T00:00:00Z", started_at: null, finished_at: null, expires_at: "2026-08-20T00:00:00Z", error: null, progress: null, result: null, input: null, ...hit } : null, error: null };
      },
    };
    return q;
  },
};
vi.mock("../app/api/_lib/supabase-admin", () => ({
  getSupabaseAdmin: vi.fn(() => mockAdmin),
}));

import { GET } from "../app/api/ai/jobs/[id]/route";

const JOB_A = "11111111-1111-4111-8111-111111111111";
const JOB_B = "22222222-2222-4222-8222-222222222222";
const req = (id: string) => GET(new Request(`https://x/api/ai/jobs/${id}`), { params: Promise.resolve({ id }) });

describe("GET /api/ai/jobs/[id]", () => {
  beforeEach(() => {
    currentUser = { ok: true, userId: "u1" };
    rows = [
      { id: JOB_A, user_id: "u1", feature: "roadmap-generate", status: "succeeded", result: { ok: 1 }, input: { ideaText: "secret" } },
      { id: JOB_B, user_id: "u2", feature: "roadmap-generate", status: "running", progress: "업종 분석 중…" },
    ];
  });

  it("본인 작업은 200 + result(성공 시) — user_id·input 은 노출하지 않는다", async () => {
    const res = await req(JOB_A);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ id: JOB_A, status: "succeeded", result: { ok: 1 } });
    expect(body.user_id).toBeUndefined();
    expect(body.input).toBeUndefined();
    expect(body.error).toBeUndefined();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("타인 작업은 404 (존재 여부 비노출)", async () => {
    const res = await req(JOB_B);
    expect(res.status).toBe(404);
  });

  it("타인 작업도 소유자에게는 보이고 진행 문구가 내려간다", async () => {
    currentUser = { ok: true, userId: "u2" };
    const res = await req(JOB_B);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "running", progress: "업종 분석 중…" });
  });

  it("미존재·비UUID 는 404, 미인증은 401", async () => {
    expect((await req("33333333-3333-4333-8333-333333333333")).status).toBe(404);
    expect((await req("not-a-uuid")).status).toBe(404);
    currentUser = { ok: false, status: 401, error: "login" };
    expect((await req(JOB_A)).status).toBe(401);
  });

  it("실패 작업은 error 만 노출하고 result 는 없다", async () => {
    rows.push({ id: "44444444-4444-4444-8444-444444444444", user_id: "u1", feature: "roadmap-generate", status: "failed", error: "로드맵 생성에 실패했습니다. 사용 횟수는 차감되지 않았어요.", result: { leaked: true } });
    const res = await req("44444444-4444-4444-8444-444444444444");
    const body = await res.json();
    expect(body.status).toBe("failed");
    expect(body.error).toContain("차감되지 않았어요");
    expect(body.result).toBeUndefined();
  });
});
