import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSPIRATION_QUOTES, inspirationForDate } from "@foundone/shared";

/**
 * "오늘의 영감" 명언 가드 (2026-08-06).
 *
 * 배경: iOS 가 출처 불명 문장 하나("가장 중요한 한 가지를…" — Drucker 저작에 없음)를
 * 하드코딩해 매일 같은 말만 보여줬다. 교체하면서 두 가지를 고정한다.
 *   ① 출처 없는 문장 금지 (가짜 인용 방지 — 정직성 원칙)
 *   ② 웹 SSOT ↔ iOS JSON 동기화 (codegen 재실행을 잊으면 두 플랫폼이 다른 말을 한다)
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const GENERATED_JSON = join(HERE, "..", "..", "..", "packages", "shared", "src", "inspiration-quotes.json");
const IOS_SYMLINK = join(HERE, "..", "..", "ios", "Sources", "FoundOneCore", "Resources", "inspiration-quotes.json");

describe("오늘의 영감 명언", () => {
  it("30개 이상이고 id 가 중복되지 않는다", () => {
    expect(INSPIRATION_QUOTES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(INSPIRATION_QUOTES.map((q) => q.id)).size).toBe(INSPIRATION_QUOTES.length);
  });

  it("모든 문장에 저자·출처·출처 URL 이 있다 (출처 없는 인용 금지)", () => {
    const bad = INSPIRATION_QUOTES.filter(
      (q) => !q.author.trim() || !q.source.trim() || !/^https?:\/\//.test(q.sourceUrl),
    );
    expect(bad.map((q) => q.id)).toEqual([]);
  });

  it("출처가 확인되지 않아 제외하기로 한 문장이 다시 들어오지 않는다", () => {
    // 조사 결과 misattributed/disputed 로 확인된 것들 — 다시 넣지 말 것.
    const banned = [
      /10,?000 ways/i,                       // Edison (Wikiquote: Disputed)
      /think you can'?t, you'?re right/i,    // Henry Ford (근거 없음)
      /quit talking and begin doing/i,       // Walt Disney (출처 미확인)
      /culture eats strategy/i,              // Drucker (본인 저작에 없음)
      /가장 중요한 한 가지를 정하고/,          // 종전 하드코딩 문장 (출처 불명)
    ];
    const joined = INSPIRATION_QUOTES.map((q) => `${q.text} ${q.original ?? ""}`).join("\n");
    expect(banned.filter((re) => re.test(joined)).map(String)).toEqual([]);
  });

  it("같은 날이면 같은 문장, 다음 날이면 다른 문장 (KST 자정 기준 순환)", () => {
    const d1 = new Date("2026-08-06T10:00:00+09:00");
    const d2 = new Date("2026-08-06T23:59:00+09:00");
    const d3 = new Date("2026-08-07T00:01:00+09:00");
    expect(inspirationForDate(d1).id).toBe(inspirationForDate(d2).id);
    expect(inspirationForDate(d3).id).not.toBe(inspirationForDate(d1).id);
  });

  it("iOS(Swift) 와 같은 날 같은 문장을 고른다 — 골든 벡터", () => {
    // 아래 기대값은 iOS 로더(BUInspiration.forDate)와 동일한 JSON·공식으로 실제 실행해 얻은 값이다.
    // 한쪽 공식만 바뀌면 여기서 깨진다 (웹·iOS 가 다른 말을 하는 사고 방지).
    const golden: Array<[string, string]> = [
      ["2026-08-06T10:00:00+09:00", "disney-goals"],
      ["2026-08-07T00:01:00+09:00", "drucker-create-customer"],
      ["2026-08-20T12:00:00+09:00", "yu-profit-sincerity"],
      ["2026-12-31T23:00:00+09:00", "yu-people"],
    ];
    for (const [iso, expected] of golden) {
      expect(inspirationForDate(new Date(iso)).id, iso).toBe(expected);
    }
  });

  it("iOS 가 읽는 JSON 이 SSOT 와 동기화돼 있다 (codegen 재실행 누락 방지)", () => {
    expect(existsSync(GENERATED_JSON), "codegen 미실행: npx tsx scripts/gen-inspiration-quotes-json.mts").toBe(true);
    const generated = JSON.parse(readFileSync(GENERATED_JSON, "utf8")) as { quotes: typeof INSPIRATION_QUOTES };
    expect(generated.quotes).toEqual(INSPIRATION_QUOTES);
    // iOS 리소스는 SSOT 로의 심볼릭 링크여야 한다 (복사본이면 조용히 낡는다)
    expect(realpathSync(IOS_SYMLINK)).toBe(realpathSync(GENERATED_JSON));
  });
});
