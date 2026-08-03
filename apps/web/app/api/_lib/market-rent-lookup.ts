/**
 * market-rent-lookup.ts — 후보 동명 → 부동산원 조사상권 실측 매칭 (2026-08-03 추출, 동작 불변)
 *  372개 조사상권, 분기 갱신 SSOT (packages/shared market-rent).
 *  매칭 없으면 null — 폴백·추정 금지 (조사상권 밖은 임대료를 말하지 않는 게 정직).
 */
import { findMarketRentDistricts, representativeRent, BUILDING_TYPE_LABEL } from "@foundone/shared";

export type MeasuredRent = {
  district: string; bldgLabel: string; manwonPerM2: string; vacancyPct: number | null;
};

export function measuredRentFor(regionText: string, districtName: string): MeasuredRent | null {
  const matches = findMarketRentDistricts(`${regionText} ${districtName}`, 1);
  const top = matches[0];
  if (!top || top.confidence !== "high") return null;   // partial 매칭으로 남의 상권 시세 부착 금지
  const rep = representativeRent(top.entry);
  if (!rep) return null;
  const vac = top.entry.vacancyPct[rep.bldg];
  return {
    district: top.entry.district,
    bldgLabel: BUILDING_TYPE_LABEL[rep.bldg],
    manwonPerM2: (rep.thousandWonPerM2 / 10).toFixed(1),
    vacancyPct: typeof vac === "number" ? vac : null,
  };
}
