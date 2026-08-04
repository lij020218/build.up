/**
 * 전국인테리어업체표준데이터 연동 — 지역 파싱 가드 (2026-08-04).
 *  extractSigungu 가 억지 매칭 없이 시군구만 뽑는지 고정.
 */
import { describe, it, expect } from "vitest";
import { extractSigungu, normalizeFirmName } from "../app/api/_lib/interior-firms";

describe("extractSigungu", () => {
  it("'서울 강남구' → 강남구", () => {
    expect(extractSigungu("서울 강남구")).toBe("강남구");
  });
  it("'성남시 분당구' → 분당구 (구가 시보다 우선)", () => {
    expect(extractSigungu("성남시 분당구")).toBe("분당구");
  });
  it("'강남구' 단독 입력", () => {
    expect(extractSigungu("강남구")).toBe("강남구");
  });
  it("'수원시' — 일반시는 허용", () => {
    expect(extractSigungu("수원시")).toBe("수원시");
  });
  it("광역·특별시 단독은 시군구가 아니다 → null", () => {
    expect(extractSigungu("서울특별시")).toBeNull();
    expect(extractSigungu("부산광역시")).toBeNull();
    expect(extractSigungu("서울시")).toBeNull();
  });
  it("동 단위·빈 값은 null (억지 매칭 금지)", () => {
    expect(extractSigungu("성수동")).toBeNull();
    expect(extractSigungu("")).toBeNull();
    expect(extractSigungu(null)).toBeNull();
  });
});

describe("normalizeFirmName — 카카오 검색 × 등록 대장 이름 교차 대조", () => {
  it("법인 표기·공백·괄호 부기를 무시하고 같게 본다", () => {
    expect(normalizeFirmName("㈜한빛디자인")).toBe(normalizeFirmName("한빛디자인(주)"));
    expect(normalizeFirmName("주식회사 한빛 디자인")).toBe(normalizeFirmName("한빛디자인"));
    expect(normalizeFirmName("한빛디자인(강남점)")).toBe(normalizeFirmName("한빛디자인"));
  });
  it("다른 상호는 다르게 남는다", () => {
    expect(normalizeFirmName("한빛디자인")).not.toBe(normalizeFirmName("한솔디자인"));
  });
});
