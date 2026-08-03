/**
 * franchise-context.ts — 프랜차이즈 선택자 컨텍스트 (2026-08-03 추출, 동작 불변)
 *  market-recommend / market-snapshot 공유: 브랜드 확정자만 반경 실측 활성화.
 */
import { getFranchiseBrandById, franchiseBrandsAll } from "@foundone/shared";
import { findBrandRegional, formatBrandRegionalLine } from "./franchise-regional";

export type FranchiseCtx = {
  brand: NonNullable<ReturnType<typeof getFranchiseBrandById>>;
  /** 같은 세부업종의 동종 브랜드 한글명 (최대 12) */
  peerNames: string[];
  /** 시도 분포 라인 (신형 가족 단일 SSOT) — 시도 못 갈라내면 null */
  regionalLine: string | null;
};

export function buildFranchiseCtx(franchiseBrandId: string, regionText: string): FranchiseCtx | null {
  const brand = franchiseBrandId ? getFranchiseBrandById(franchiseBrandId) : undefined;
  if (!brand) return null;
  const regional = findBrandRegional(brand.id, regionText);
  return {
    brand,
    peerNames: franchiseBrandsAll
      .filter((b) => b.id !== brand.id && (b.subIndustryIds ?? []).some((sid) => (brand.subIndustryIds ?? []).includes(sid)))
      .map((b) => b.name.ko)
      .slice(0, 12),
    regionalLine: regional ? formatBrandRegionalLine(brand.name.ko, regional) : null,
  };
}
