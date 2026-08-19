/**
 * iOS 응답 계약 가드 (2026-08-19) — 출시된 iOS 앱 Decodable 이 기대하는 키·타입을
 * 서버 응답 정규화 헬퍼(app/api/_lib/ios-contract.ts)가 항상 만족하는지 단위 테스트.
 *   - success/http_status/httpStatus 보강
 *   - breakdown 정수·문자열 정규화
 *   - dailySummary / popbill summary 별칭
 *   - required string 키 null 금지
 */
import { describe, it, expect } from "vitest";
import {
  withIosContract,
  normalizeBreakdown,
  toDailySummary,
  toPopbillSummary,
  ensureStringKeys,
  toInt,
  toStr,
  MEME_ITEM_REQUIRED_STRINGS,
  INFLUENCER_REQUIRED_STRINGS,
  INFLUENCER_PLAY_REQUIRED_STRINGS,
} from "../app/api/_lib/ios-contract";

describe("withIosContract (saas-metrics/pull/test)", () => {
  it("adds success mirror of ok and numeric http_status + httpStatus alias", () => {
    const r = withIosContract({ ok: true, http_status: 200, data: { a: 1 } });
    expect(r.success).toBe(true);
    expect(r.http_status).toBe(200);
    expect(r.httpStatus).toBe(200);
    expect(r.data).toEqual({ a: 1 });
  });
  it("http_status is 0 (never undefined/null) when unknown", () => {
    const r1 = withIosContract({ ok: false, error: "x" });
    expect(r1.success).toBe(false);
    expect(r1.http_status).toBe(0);
    expect(r1.httpStatus).toBe(0);
    const r2 = withIosContract({ ok: false, http_status: null });
    expect(r2.http_status).toBe(0);
    const r3 = withIosContract({ ok: false, http_status: Number.NaN });
    expect(r3.http_status).toBe(0);
  });
});

describe("normalizeBreakdown (ai/funding/score)", () => {
  it("coerces weight/itemScore to ints and reason to string", () => {
    const out = normalizeBreakdown(
      [
        { item: "문제인식", weight: "20", itemScore: 14.6, reason: null },
        { item: "실현가능성", weight: 25, itemScore: "abc" },
        { item: 42, weight: 10, itemScore: 5, reason: "skip — item not string" },
        null,
        "junk",
      ],
      10,
    );
    expect(out).toEqual([
      { item: "문제인식", weight: 20, itemScore: 15, reason: "" },
      { item: "실현가능성", weight: 25, itemScore: 0, reason: "" },
    ]);
  });
  it("caps to maxItems and returns [] for non-arrays", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ item: `i${i}`, weight: 1, itemScore: 1, reason: "r" }));
    expect(normalizeBreakdown(many, 5)).toHaveLength(5);
    expect(normalizeBreakdown(undefined, 5)).toEqual([]);
    expect(normalizeBreakdown({ item: "x" }, 5)).toEqual([]);
  });
});

describe("toDailySummary (integrations/csv/list)", () => {
  it("maps dailyEntries to {date, sales, customers, source:'csv'} with numeric guards", () => {
    expect(
      toDailySummary([
        { date: "2026-08-01", sales: 120000, customers: 34 },
        { date: "2026-08-02", sales: "5000", customers: undefined },
        { date: "2026-08-03", sales: Number.NaN, customers: null },
      ]),
    ).toEqual([
      { date: "2026-08-01", sales: 120000, customers: 34, source: "csv" },
      { date: "2026-08-02", sales: 5000, customers: 0, source: "csv" },
      { date: "2026-08-03", sales: 0, customers: 0, source: "csv" },
    ]);
  });
});

describe("toPopbillSummary (integrations/popbill/sync)", () => {
  it("emits [{docType, collected}] from results", () => {
    expect(
      toPopbillSummary([
        { kind: "taxinvoice", collected: 12 },
        { kind: "cashbill", collected: undefined },
      ]),
    ).toEqual([
      { docType: "taxinvoice", collected: 12 },
      { docType: "cashbill", collected: 0 },
    ]);
  });
});

describe("ensureStringKeys (meme-pack / influencer-collab)", () => {
  it("never leaves required meme keys null/undefined", () => {
    const item = ensureStringKeys(
      { kind: "meme", title: "천연 위고비", originDesc: null, originUrl: undefined, sourceName: "고구마팜", industryFit: ["all"] },
      MEME_ITEM_REQUIRED_STRINGS,
    );
    for (const k of MEME_ITEM_REQUIRED_STRINGS) expect(typeof item[k]).toBe("string");
    expect(item.originDesc).toBe("");
    expect(item.originUrl).toBe("");
    expect(item.applyHint).toBe("");
    expect(item.title).toBe("천연 위고비");
    expect(item.industryFit).toEqual(["all"]);
  });
  it("influencer curated + play required keys are strings", () => {
    const cur = ensureStringKeys(
      { platform: "instagram", name: "라이현", handle: "ry.hyun", regionKo: undefined, profileUrl: null, followers: 10 },
      INFLUENCER_REQUIRED_STRINGS,
    );
    for (const k of INFLUENCER_REQUIRED_STRINGS) expect(typeof cur[k]).toBe("string");
    expect(cur.followers).toBe(10);
    const play = ensureStringKeys({ id: "p1", dmTemplateKo: null }, INFLUENCER_PLAY_REQUIRED_STRINGS);
    for (const k of INFLUENCER_PLAY_REQUIRED_STRINGS) expect(typeof play[k]).toBe("string");
  });
});

describe("primitives", () => {
  it("toInt / toStr", () => {
    expect(toInt("7.6")).toBe(8);
    expect(toInt(null)).toBe(0);
    expect(toInt(Infinity)).toBe(0);
    expect(toStr(null)).toBe("");
    expect(toStr(undefined)).toBe("");
    expect(toStr(3)).toBe("3");
  });
});
