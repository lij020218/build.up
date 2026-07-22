import { describe, it, expect } from "vitest";
import { SPECIALTY_TAX_MAPPINGS, COMMON_TAX_BENEFITS, getSpecialtyTaxMapping, isReductionSurfaced, isStartupReductionActive, estimateAnnualRevenueWon } from "../finance/tax-credits";
import { starterIndustryOptions } from "../starter-data";

/**
 * 세액공제 매핑 SSOT 회귀 가드 (2026-07-22 신설).
 *  세부업종 70종 전부가 매핑돼야 한다 — 새 세부업종 추가 시 세액공제 누락 방지.
 *  세금 데이터라 오분류·누락이 특히 위험 → 커버리지·구조를 CI 에서 강제.
 */
describe("세액공제 매핑 SSOT", () => {
  it("모든 세부업종(70종)이 매핑에 존재 — 누락 0", () => {
    const mapped = new Set(SPECIALTY_TAX_MAPPINGS.map((m) => m.specialtyId));
    const missing = starterIndustryOptions.map((o) => o.id).filter((id) => !mapped.has(id));
    expect(missing).toEqual([]);
  });

  it("매핑에 잉여(오타) specialtyId 없음", () => {
    const allIds = new Set(starterIndustryOptions.map((o) => o.id));
    const extra = SPECIALTY_TAX_MAPPINGS.filter((m) => !allIds.has(m.specialtyId)).map((m) => m.specialtyId);
    expect(extra).toEqual([]);
  });

  it("중복 매핑 없음", () => {
    const ids = SPECIALTY_TAX_MAPPINGS.map((m) => m.specialtyId);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("모든 매핑에 근거 note 존재 (자격 판정 근거 필수)", () => {
    const noteMissing = SPECIALTY_TAX_MAPPINGS.filter((m) => !m.note || m.note.trim().length < 10);
    expect(noteMissing.map((m) => m.specialtyId)).toEqual([]);
  });

  it("공통 4종은 전 업종 노출용 — 값에 적용연도 또는 상시 명시, 근거 조문 존재", () => {
    expect(COMMON_TAX_BENEFITS.length).toBeGreaterThanOrEqual(4);
    for (const b of COMMON_TAX_BENEFITS) {
      expect(b.basis.length).toBeGreaterThan(0);
      expect(b.summaryKo.length).toBeGreaterThan(0);
    }
  });

  it("조문 확정 대표 케이스 — 음식점=§6 대상·§7 제외, 소매=§7 대상·§6 제외, SW=둘 다", () => {
    const food = getSpecialtyTaxMapping("korean-casual", "food")!;
    expect(food.startupReduction).toBe("eligible");
    expect(food.specialReduction).toBe("excluded");

    const retail = getSpecialtyTaxMapping("convenience-small", "retail")!;
    expect(retail.startupReduction).toBe("excluded");
    expect(retail.specialReduction).toBe("eligible");

    const saas = getSpecialtyTaxMapping("b2b-saas", "startup-tech")!;
    expect(saas.startupReduction).toBe("eligible");
    expect(saas.specialReduction).toBe("eligible");

    // 부동산임대는 둘 다 제외(공통만) — excluded 확정
    const rental = getSpecialtyTaxMapping("rental-studio", "space")!;
    expect(rental.startupReduction).toBe("excluded");
    expect(rental.specialReduction).toBe("excluded");
  });

  it("check/excluded 는 카드 비노출(확인안내), eligible/likely 만 노출", () => {
    expect(isReductionSurfaced("eligible")).toBe(true);
    expect(isReductionSurfaced("likely")).toBe(true);
    expect(isReductionSurfaced("check")).toBe(false);
    expect(isReductionSurfaced("excluded")).toBe(false);
  });

  it("specialtyId 미스 시 categoryId 폴백", () => {
    const fallback = getSpecialtyTaxMapping("nonexistent-id", "food");
    expect(fallback?.categoryId).toBe("food");
  });

  // ── 냉정리뷰(2026-07-22) 결함 회귀 가드 ──
  it("[결함1 가드] 창업감면 5년 게이트 — 5년 초과 개업일은 비활성", () => {
    const now = new Date("2026-07-22");
    expect(isStartupReductionActive("2026-01-01", now)).toBe(true);   // 올해 창업 = 활성
    expect(isStartupReductionActive("2022-06-01", now)).toBe(true);   // 4년차 = 활성
    expect(isStartupReductionActive("2020-01-01", now)).toBe(false);  // 6년차 = 비활성(과거 오분류)
    expect(isStartupReductionActive(null, now)).toBe(true);           // 개업일 미상 = 보수적 노출
  });

  it("[결함2 가드] 연매출 추정 = 최근7평균 × 26 × 12 (웹·iOS 동일 산정)", () => {
    // 일 100만 균일 → 월 2,600만 → 연 3.12억
    expect(estimateAnnualRevenueWon([1_000_000, 1_000_000, 1_000_000])).toBe(312_000_000);
    // 0 매출은 제외
    expect(estimateAnnualRevenueWon([0, 0])).toBe(0);
    expect(estimateAnnualRevenueWon([])).toBe(0);
    // 최근 7개만 사용 (앞선 큰 값 무시)
    const many = [99_000_000, ...Array(7).fill(500_000)];
    expect(estimateAnnualRevenueWon(many)).toBe(Math.round(500_000 * 26 * 12));
  });
});
