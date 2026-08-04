/**
 * 대표 공급 브랜드 SSOT 가드 (2026-08-04).
 *  원칙 고정: 실명·근거·출처 없으면 등재 불가 / 근거 없는 업종은 빈 배열(억지 매칭 금지).
 */
import { describe, it, expect } from "vitest";
import { getSupplyBrands } from "../app/api/_lib/supply-brands";

describe("supply-brands SSOT", () => {
  it("치킨 → 계육 점유율 상위 (하림 1위)", () => {
    const groups = getSupplyBrands("chicken-burger");
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].brands[0].name).toBe("하림");
    expect(groups[0].brands[0].note).toContain("점유율 1위");
  });

  it("한식·배달식은 한돈 브랜드 포함", () => {
    for (const sub of ["korean-casual", "delivery-meals"]) {
      const cats = getSupplyBrands(sub).map((g) => g.category);
      expect(cats.some((c) => c.includes("한돈")), sub).toBe(true);
    }
  });

  it("모든 항목은 근거·출처·기준 문구를 갖는다 (위조 차단 게이트)", () => {
    for (const sub of ["chicken-burger", "korean-casual", "bakery-studio", "specialty-coffee", "ramen-noodle"]) {
      for (const g of getSupplyBrands(sub)) {
        expect(g.basis.length, `${sub}/${g.category} basis`).toBeGreaterThan(10);
        expect(g.sourceUrl.startsWith("http"), `${sub}/${g.category} source`).toBe(true);
        for (const b of g.brands) {
          expect(b.name.length).toBeGreaterThan(0);
          expect(b.note.length, `${sub}/${b.name} note`).toBeGreaterThan(3);
        }
      }
    }
  });

  it("근거 없는 세부업종은 빈 배열 — 억지 매칭 금지", () => {
    expect(getSupplyBrands("icecream-bingsu")).toEqual([]);
    expect(getSupplyBrands("hair-salon")).toEqual([]);
    expect(getSupplyBrands(null)).toEqual([]);
  });
});
