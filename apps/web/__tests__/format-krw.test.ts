/**
 * formatKrw — 한국식 금액 표기 회귀 가드.
 *
 *  2026-07 사장님 지적: "1억이라고 나와야지 10000만원이라고 나오잖아".
 *  한국어는 만원을 5자리로 안 읽는다("15,000만원" ✗ → "1억 5,000만원" ✓).
 *  대시보드 카드들이 각자 만든 로컬 포맷터에 억 분기가 없어 1억 넘는 금액이 깨졌다.
 *  → SSOT 를 테스트로 고정해 같은 회귀를 막는다.
 */
import { describe, it, expect } from "vitest";
import { formatKrw } from "../app/lib/utils/format-krw";

describe("formatKrw — 억 단위 (사장님 지적 회귀 가드)", () => {
  it("1억 이상은 '억' 으로 끊는다 — 만원 5자리 금지", () => {
    expect(formatKrw(150_000_000)).toBe("1억 5,000만원");
    expect(formatKrw(104_360_000)).toBe("1억 436만원");
    expect(formatKrw(234_000_000)).toBe("2억 3,400만원");
  });

  it("딱 떨어지는 억은 만원을 붙이지 않는다", () => {
    expect(formatKrw(100_000_000)).toBe("1억원");
    expect(formatKrw(700_000_000)).toBe("7억원");
  });

  it("1억 미만은 만원 표기 유지", () => {
    expect(formatKrw(90_000_000)).toBe("9,000만원");
    expect(formatKrw(2_500_000)).toBe("250만원");
  });

  it("만원 미만 + 나머지", () => {
    expect(formatKrw(15_000)).toBe("1만 5,000원");
    expect(formatKrw(9_990)).toBe("9,990원");
    expect(formatKrw(0)).toBe("0원");
  });

  it("음수·비정상값", () => {
    expect(formatKrw(-50_000)).toBe("-5만원");
    expect(formatKrw(-150_000_000)).toBe("-1억 5,000만원");
    expect(formatKrw(NaN)).toBe("—");
    expect(formatKrw(Infinity)).toBe("—");
  });
});
