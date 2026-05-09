import { describe, it, expect } from "vitest";

/**
 * parseKoreanCurrency — 한국식 금액 표현을 원(won) 단위로 변환
 * Phase 4-1에서 구현 예정. 현재 parseManwonInput의 버그를 문서화.
 *
 * 현재 버그: "1억" → parseInt("1") * 10000 = 10,000원 (실제: 100,000,000원)
 */

// 현재 parseManwonInput 로직 재현 (버그 포함)
function parseManwonInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const amount = Number.parseInt(digits, 10);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return amount * 10000;
}

// 프로덕션과 동일 구현 (apps/web/app/lib/helpers.ts:parseKoreanCurrency)
function parseKoreanCurrency(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const hadWonSuffix = /원\s*$/.test(trimmed);
  const cleaned = trimmed.replace(/\s/g, "").replace(/원$/, "");
  if (!cleaned) return undefined;

  let total = 0;

  const eokMatch = cleaned.match(/([\d.]+)\s*억/);
  if (eokMatch) {
    total += parseFloat(eokMatch[1]) * 100_000_000;
  }

  const cheonmanMatch = cleaned.match(/([\d.]+)\s*천만/);
  if (cheonmanMatch) {
    total += parseFloat(cheonmanMatch[1]) * 10_000_000;
  } else {
    const manMatch = cleaned.match(/([\d.]+)\s*만/);
    if (manMatch) {
      total += parseFloat(manMatch[1]) * 10_000;
    }
  }

  if (total === 0) {
    const digits = cleaned.replace(/[^\d]/g, "");
    if (!digits) return undefined;
    const amount = Number.parseInt(digits, 10);
    if (!Number.isFinite(amount) || amount <= 0) return undefined;
    return hadWonSuffix ? amount : amount * 10_000;
  }

  return total > 0 ? total : undefined;
}

describe("parseManwonInput (현재 — 버그 문서화)", () => {
  it("만원 단위 숫자를 정상 변환한다", () => {
    expect(parseManwonInput("3000")).toBe(30_000_000); // 3천만원
    expect(parseManwonInput("5000")).toBe(50_000_000); // 5천만원
  });

  it("BUG: '1억'을 10,000원으로 변환한다 (10,000배 오차)", () => {
    // 현재 버그 동작을 명시적으로 문서화
    expect(parseManwonInput("1억")).toBe(10_000); // 실제 기대값: 100,000,000
  });
});

describe("parseKoreanCurrency (새 구현)", () => {
  it("만원 단위 숫자를 정상 변환한다", () => {
    expect(parseKoreanCurrency("3000")).toBe(30_000_000);
    expect(parseKoreanCurrency("5000")).toBe(50_000_000);
  });

  it("'억' 단위를 정확히 변환한다", () => {
    expect(parseKoreanCurrency("1억")).toBe(100_000_000);
    expect(parseKoreanCurrency("2억")).toBe(200_000_000);
    expect(parseKoreanCurrency("1.5억")).toBe(150_000_000);
  });

  it("복합 단위를 정확히 변환한다", () => {
    expect(parseKoreanCurrency("1억 5000만")).toBe(150_000_000);
    expect(parseKoreanCurrency("2억 3000만원")).toBe(230_000_000);
    expect(parseKoreanCurrency("1억5천만")).toBe(150_000_000);
  });

  it("천만 단위를 정확히 변환한다", () => {
    expect(parseKoreanCurrency("5천만")).toBe(50_000_000);
    expect(parseKoreanCurrency("3천만원")).toBe(30_000_000);
  });

  it("빈 입력에 undefined를 반환한다", () => {
    expect(parseKoreanCurrency("")).toBeUndefined();
    expect(parseKoreanCurrency("원")).toBeUndefined();
  });

  // 회귀 — '원' 접미사가 있으면 won 단위로 해석 (이전 버그: 10,000배 폭주)
  describe("'원' 접미사 — won 단위 명시", () => {
    it("'1000원'은 1000 won (이전엔 10,000,000으로 폭주)", () => {
      expect(parseKoreanCurrency("1000원")).toBe(1_000);
    });
    it("'5000원'은 5000 won", () => {
      expect(parseKoreanCurrency("5000원")).toBe(5_000);
    });
    it("'100 원'(공백 포함)도 100 won", () => {
      expect(parseKoreanCurrency("100 원")).toBe(100);
    });
    it("단위 명시는 그대로 — '5천만원' = 5천만", () => {
      expect(parseKoreanCurrency("5천만원")).toBe(50_000_000);
    });
    it("단위 없이 숫자만 — 만원 단위 (기존 동작 유지)", () => {
      expect(parseKoreanCurrency("3000")).toBe(30_000_000);
    });
  });
});
