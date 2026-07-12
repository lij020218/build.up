import { describe, it, expect } from "vitest";
import { getMatchedProgramsV2 } from "../startup-programs";

// 2026-07-10 회귀 가드: 도메인 특화 지원사업(제조·바이오)이 무관 세부업종에 새지 않도록.
//   배경: 스마트공장(제조)이 industries=["startup-tech"] 라 B2B SaaS 등 전 SW 세부업종에 노출됐음.
//   subIndustries 화이트리스트 + criteria.subIndustryId 필터로 격리. (project_startup_program_subindustry_filter)
const eligibleIds = (subIndustryId?: string) =>
  getMatchedProgramsV2({ industryCategoryId: "startup-tech", subIndustryId, capital: 50_000_000 })
    .filter((p) => p.eligible)
    .map((p) => p.id);

describe("지원사업 세부업종 필터 (도메인 특화 격리)", () => {
  it("SW 세부업종(b2b-saas)에는 제조·바이오 전용 프로그램이 안 뜬다", () => {
    const ids = eligibleIds("b2b-saas");
    expect(ids).not.toContain("smart-factory-2026");
    expect(ids).not.toContain("k-bio-labhub-2026");
  });
  it("제조형 세부업종(hardware-iot)에는 스마트공장이 뜬다", () => {
    expect(eligibleIds("hardware-iot")).toContain("smart-factory-2026");
  });
  it("바이오 세부업종(biotech-medtech)에는 K-바이오 랩허브가 뜬다", () => {
    expect(eligibleIds("biotech-medtech")).toContain("k-bio-labhub-2026");
  });
  it("subIndustryId 미전달 시 필터 미적용(후방호환) — 카테고리 매칭만", () => {
    expect(eligibleIds(undefined)).toContain("smart-factory-2026");
  });
});
