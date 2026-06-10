/**
 * 월 키 헬퍼 — prevMonthKey / getKstMonthKey 검증.
 *
 *  버그 패턴 (2026-06-10, P1-1 / P1-2):
 *    1) `d.setMonth(d.getMonth()-1)` → 7/31 에서 6/31 이 없어 7/1 로 정규화 →
 *       전월 키 = 이번 달 키 (월말 29~31일 매월 발생).
 *    2) `new Date().toISOString().slice(0,7)` = UTC 월 → KST 매월 1일 00~09시에 전월을 가리킴.
 *
 *  Fix: prevMonthKey 는 순수 문자열 산술(일자 없음 → 롤오버 불가),
 *       getKstMonthKey 는 KST 일자에서 추출.
 */

import { describe, expect, it } from "vitest";
import { prevMonthKey, getKstMonthKey } from "../app/lib/utils/business-day";

describe("prevMonthKey — 전월 키 (월말 롤오버 안전)", () => {
  it("일반 케이스: 2026-07 → 2026-06", () => {
    expect(prevMonthKey("2026-07")).toBe("2026-06");
  });

  it("연 경계: 2026-01 → 2025-12", () => {
    expect(prevMonthKey("2026-01")).toBe("2025-12");
  });

  it("3월 → 2월 (윤년·일수 무관, 문자열 산술이라 영향 없음)", () => {
    expect(prevMonthKey("2024-03")).toBe("2024-02");
    expect(prevMonthKey("2025-03")).toBe("2025-02");
  });

  it("회귀 가드: 31일까지 있는 달의 전월이 30/28일이어도 정확 (setMonth 롤오버 버그 방지)", () => {
    // 종전 버그: 7/31 에 setMonth(-1) → 6/31 없음 → 7/1 정규화 → "2026-07" (자기 자신)
    // 문자열 산술은 일자가 없으므로 항상 7→6.
    expect(prevMonthKey("2026-07")).toBe("2026-06");
    expect(prevMonthKey("2026-05")).toBe("2026-04");
    expect(prevMonthKey("2026-03")).toBe("2026-02"); // 2월(28일)로도 안전
  });

  it("12개월 연쇄 — 전월 키는 항상 이번 달과 다르고 한 칸씩 감소", () => {
    let key = "2026-12";
    for (let i = 0; i < 12; i++) {
      const prev = prevMonthKey(key);
      expect(prev).not.toBe(key);
      key = prev;
    }
    expect(key).toBe("2025-12"); // 2026-12 에서 12번 빼면 2025-12
  });

  it("잘못된 입력은 그대로 반환 (graceful)", () => {
    expect(prevMonthKey("garbage")).toBe("garbage");
    expect(prevMonthKey("2026")).toBe("2026");
  });
});

describe("getKstMonthKey — KST 기준 현재 월 키 (UTC 버그 방지)", () => {
  it("KST 매월 1일 00:30 (= 전날 UTC 15:30) 에도 이번 달을 가리킴", () => {
    // 2026-07-01 00:30 KST == 2026-06-30 15:30 UTC.
    // UTC 슬라이스면 "2026-06" (전월) → 버그. KST 추출이면 "2026-07".
    const kstFirstOfMonth = new Date("2026-06-30T15:30:00Z");
    expect(getKstMonthKey(kstFirstOfMonth)).toBe("2026-07");
    expect(kstFirstOfMonth.toISOString().slice(0, 7)).toBe("2026-06"); // 옛 버그 재현 확인
  });

  it("KST 월 중간은 UTC 와 동일 월", () => {
    const mid = new Date("2026-07-15T03:00:00Z"); // KST 12:00
    expect(getKstMonthKey(mid)).toBe("2026-07");
  });

  it("연 경계: 2026-01-01 02:00 KST (= 2025-12-31 17:00 UTC) → 2026-01", () => {
    const newYear = new Date("2025-12-31T17:00:00Z");
    expect(getKstMonthKey(newYear)).toBe("2026-01");
  });
});
