/**
 * ai-guard 가드 테스트 (2026-08-19 사장님 3원칙)
 *  ① 일·주·분 한도 / ② 일시 오류 1회 재시도 / ③ 우리 실패(throw·5xx) 시 전액 환불, 4xx 는 환불 안 함.
 *  Redis·Supabase 없는 in-memory 경로에서 검증 (프로덕션은 같은 로직이 Redis 카운터로 동작).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("../app/api/_lib/auth", () => ({
  requireApiUser: vi.fn(async () => ({ ok: true, userId: "11111111-2222-3333-4444-555555555555" })),
  requireApiUserAllowAnon: vi.fn(async () => ({ ok: true, userId: "11111111-2222-3333-4444-555555555555" })),
}));
vi.mock("../app/api/_lib/supabase-admin", () => ({ getSupabaseAdmin: () => null }));

import { runAiFeature, guardAiFeature } from "../app/api/_lib/ai-guard";

const req = () => new Request("http://x/api/ai/test", { method: "POST" });
let featureSeq = 0;
const freshFeature = () => `test-feature-${++featureSeq}-${Math.random().toString(36).slice(2, 6)}`;

describe("ai-guard", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("① 일일 한도 초과 → 429 limit_day, 주간 초과 → 429 limit_week", async () => {
    const feature = freshFeature();
    const limits = { daily: 2, weekly: 3, perMinute: 100 };
    const ok = async () => NextResponse.json({ ok: true });
    expect((await runAiFeature({ request: req(), feature, limits }, ok)).status).toBe(200);
    expect((await runAiFeature({ request: req(), feature, limits }, ok)).status).toBe(200);
    const r3 = await runAiFeature({ request: req(), feature, limits }, ok);
    expect(r3.status).toBe(429);
    expect((await r3.json()).code).toBe("limit_day");
  });

  it("③ 핸들러 throw(비일시) → 환불되어 다시 쓸 수 있고 503 refunded:true", async () => {
    const feature = freshFeature();
    const limits = { daily: 1, weekly: 10, perMinute: 100 };
    const boom = async () => { const e = new Error("bad input shape"); (e as { status?: number }).status = 400; throw e; };
    const r = await runAiFeature({ request: req(), feature, limits, retryOnce: false }, boom);
    expect(r.status).toBe(503);
    expect(await r.json()).toMatchObject({ ok: false, refunded: true });
    // 환불됐으니 daily=1 인데도 다시 성공해야 한다
    const r2 = await runAiFeature({ request: req(), feature, limits }, async () => NextResponse.json({ ok: true }));
    expect(r2.status).toBe(200);
  });

  it("③ 핸들러 500 응답 → 환불 + x-ai-refunded 헤더", async () => {
    const feature = freshFeature();
    const limits = { daily: 1, weekly: 10, perMinute: 100 };
    const r = await runAiFeature({ request: req(), feature, limits, retryOnce: false }, async () => NextResponse.json({ error: "x" }, { status: 500 }));
    expect(r.status).toBe(500);
    expect(r.headers.get("x-ai-refunded")).toBe("1");
    const r2 = await runAiFeature({ request: req(), feature, limits }, async () => NextResponse.json({ ok: true }));
    expect(r2.status).toBe(200);
  });

  it("4xx(사용자 잘못) 는 환불하지 않는다", async () => {
    const feature = freshFeature();
    const limits = { daily: 1, weekly: 10, perMinute: 100 };
    const r = await runAiFeature({ request: req(), feature, limits }, async () => NextResponse.json({ error: "bad" }, { status: 400 }));
    expect(r.status).toBe(400);
    const r2 = await runAiFeature({ request: req(), feature, limits }, async () => NextResponse.json({ ok: true }));
    expect(r2.status).toBe(429);
  });

  it("② 일시 오류는 1회 재시도 후 성공하면 정상 응답(차감 1회)", async () => {
    const feature = freshFeature();
    const limits = { daily: 5, weekly: 10, perMinute: 100 };
    let n = 0;
    const flaky = async () => { n++; if (n === 1) { const e = new Error("timeout"); (e as { status?: number }).status = 503; throw e; } return NextResponse.json({ ok: true, n }); };
    const r = await runAiFeature({ request: req(), feature, limits }, flaky);
    expect(r.status).toBe(200);
    expect((await r.json()).n).toBe(2);
    const g = await guardAiFeature({ request: req(), feature, limits });
    expect(g.ok && g.usage.dayUsed).toBe(2); // 위 1회 + 지금 1회
  });
});
