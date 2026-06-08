/**
 * 구독 기간 +1개월 계산 회귀 가드.
 *   setMonth 의 월말 롤오버(1/31 + 1개월 → 3/3) 버그를 클램프로 막는다.
 */
import { describe, it, expect } from "vitest";
import { addOneMonth } from "../app/api/_lib/subscription";

describe("addOneMonth — 월말 오버플로 클램프", () => {
  // 로컬타임 생성자(year, monthIdx, day) 로 TZ 독립 결정성 확보.
  it("1/31 → 2월 말일(윤년 2/29)", () => {
    const r = addOneMonth(new Date(2024, 0, 31)); // 2024 윤년
    expect(r.getMonth()).toBe(1);   // 2월(0-index)
    expect(r.getDate()).toBe(29);
  });

  it("1/31 → 2월 말일(평년 2/28)", () => {
    const r = addOneMonth(new Date(2026, 0, 31));
    expect(r.getMonth()).toBe(1);
    expect(r.getDate()).toBe(28);
  });

  it("일반 케이스: 6/9 → 7/9", () => {
    const r = addOneMonth(new Date(2026, 5, 9));
    expect(r.getMonth()).toBe(6); // 7월
    expect(r.getDate()).toBe(9);
  });

  it("12월 → 다음 해 1월(연도 롤오버)", () => {
    const r = addOneMonth(new Date(2026, 11, 15));
    expect(r.getFullYear()).toBe(2027);
    expect(r.getMonth()).toBe(0);
    expect(r.getDate()).toBe(15);
  });
});
