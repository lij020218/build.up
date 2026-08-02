import { describe, it, expect } from "vitest";
import {
  findMarketRentDistricts,
  formatRentLine,
  representativeRent,
  extractSido,
  marketRentDistrictCount,
  MARKET_RENT_QUARTER,
  MARKET_RENT_QUARTER_LABEL,
} from "@foundone/shared";

/**
 * 상권 임대료 SSOT 가드 (2026-08-03).
 *  데이터: 한국부동산원 R-ONE 실수집 (2026-08-03, 대전>둔산 28.2천원/㎡ 실호출 대조).
 *  지키는 것: ① 데이터 무결성 ② 과잉 매칭 금지(남의 상권 시세 위조 방지) ③ 정직 라벨.
 */

describe("데이터 무결성", () => {
  it("전국 조사 상권 규모 (2024.3Q 개편 ~368개 체계, 유형 합집합 372 실측)", () => {
    expect(marketRentDistrictCount()).toBeGreaterThanOrEqual(200);
    expect(marketRentDistrictCount()).toBeLessThanOrEqual(500);
  });

  it("기준 분기가 2024.3Q 개편 이후다 — 옛 시리즈 혼입 방지", () => {
    expect(MARKET_RENT_QUARTER >= "202403").toBe(true);
    expect(MARKET_RENT_QUARTER_LABEL).toMatch(/^\d{4}년 [1-4]분기$/);
  });

  it("둔산(대전) — 감사에서 '환각 위험' 예시였던 그 상권에 실측값이 있다", () => {
    const m = findMarketRentDistricts("대전 둔산동");
    expect(m.length).toBeGreaterThan(0);
    expect(m[0]!.entry.fullName).toBe("대전>둔산");
    const rep = representativeRent(m[0]!.entry);
    expect(rep).not.toBeNull();
    expect(rep!.thousandWonPerM2).toBeGreaterThan(1);
    expect(rep!.thousandWonPerM2).toBeLessThan(500);
  });
});

describe("🔴 과잉 매칭 금지 — 남의 상권 시세를 내 후보지에 붙이는 위조 방지", () => {
  it("조사 상권 밖 동네는 빈 결과 (시도 평균 폴백·인근 확장 금지)", () => {
    expect(findMarketRentDistricts("경북 울릉군 울릉읍")).toEqual([]);
    expect(findMarketRentDistricts("전남 신안군 흑산면")).toEqual([]);
  });

  it("시도가 명시되면 다른 시도의 동명 상권과 매칭되지 않는다", () => {
    for (const m of findMarketRentDistricts("대전 둔산")) {
      expect(m.entry.sido).toBe("대전");
    }
    // "신촌"류 이름이 여러 시도에 있어도 서울 질의는 서울만
    for (const m of findMarketRentDistricts("서울 신촌 카페 자리")) {
      expect(m.entry.sido).toBe("서울");
    }
  });

  it("한 글자·조각 토큰으로는 매칭하지 않는다", () => {
    expect(findMarketRentDistricts("동")).toEqual([]);
    expect(findMarketRentDistricts("시")).toEqual([]);
    expect(findMarketRentDistricts("")).toEqual([]);
  });

  it("시도 이름만으로는 상권이 매칭되지 않는다 (시세 없는 지역에 아무 상권이나 주기 금지)", () => {
    // "광주" 시도 토큰이 상권명 매칭에 쓰이면 광주의 임의 상권이 나온다 — 금지
    const m = findMarketRentDistricts("광주");
    expect(m.filter((x) => x.confidence === "high")).toEqual([]);
  });
});

describe("정직 라벨", () => {
  it("문장에 출처·기준분기·한계(보증금·권리금 미포함)가 반드시 들어간다", () => {
    const m = findMarketRentDistricts("대전 둔산동")[0]!;
    const line = formatRentLine(m.entry)!;
    expect(line).toContain("한국부동산원");
    expect(line).toContain(MARKET_RENT_QUARTER_LABEL);
    expect(line).toContain("보증금·권리금 미포함");
    expect(line).toMatch(/㎡당 월 [\d.]+만원/);
    expect(line).toMatch(/평당 약 [\d.]+만원/);
  });

  it("extractSido — 축약·정식 명칭 모두", () => {
    expect(extractSido("대전 둔산동")).toBe("대전");
    expect(extractSido("서울특별시 성동구 성수동")).toBe("서울");
    expect(extractSido("강원특별자치도 강릉시")).toBe("강원");
    expect(extractSido("둔산동")).toBeNull();
  });
});
