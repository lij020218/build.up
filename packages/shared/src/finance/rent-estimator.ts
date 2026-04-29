/**
 * 월 임대료 추정 유틸.
 *
 * 입력: 선택된 상권 ID (seoul-districts) + 업종 + (선택) 평수
 * 출력: 보증금·월세·관리비 추정치
 *
 * 출처:
 *   - 상권별 rentBand: seoul-districts.ts의 meta.rentBand ("low" ~ "high")
 *   - 평당 월세: KB부동산·점포라인·소상공인시장진흥공단 2024-2025 평균
 *   - 업종별 권장 평수: 업계 표준 + 프랜차이즈 정보공개서 평균
 *
 * 모든 값은 FinancialReviewStage의 자동 추정 기본값으로만 사용되며,
 * 사용자는 언제든 UI에서 수정 가능.
 */

import { seoulMarketDistricts, type MarketDistrict } from "../market/seoul-districts";

/** rentBand별 평당 월세 (원/평) — 서울 상업용 상가 기준 */
const RENT_PER_PYEONG_KRW: Record<MarketDistrict["meta"]["rentBand"], number> = {
  low: 80_000,       // 예: 구로·금천·도봉 외곽
  "mid-low": 120_000, // 예: 성북·은평·노원 주요 역세권
  mid: 180_000,      // 예: 망원·방배·연신내
  "mid-high": 260_000, // 예: 연남·합정·이태원·용리단길
  high: 400_000,     // 예: 강남역·홍대·압구정·한남
};

/** rentBand별 보증금 (월세 대비 배수) */
const DEPOSIT_MULTIPLIER: Record<MarketDistrict["meta"]["rentBand"], number> = {
  low: 10,
  "mid-low": 12,
  mid: 15,
  "mid-high": 18,
  high: 24,
};

/** 업종별 권장 평수 (평) */
const RECOMMENDED_PYEONG: Record<string, number> = {
  food: 20,
  "cafe-dessert": 15,
  retail: 12,
  beauty: 12,
  pet: 15,
  fitness: 30,
  education: 30,
  space: 40,
  "online-digital": 6,        // 사무실 최소
  "startup-tech": 10,
  "living-service": 10,
};

export type RentEstimate = {
  /** 월세 (원) */
  monthlyRentKrw: number;
  /** 관리비 (원/월) — 보통 월세의 10-15% */
  managementFeeKrw: number;
  /** 보증금 (원) */
  depositKrw: number;
  /** 적용된 평수 */
  pyeong: number;
  /** 평당 월세 (원) */
  ratePerPyeongKrw: number;
  /** 상권명·구명 */
  districtLabel: string;
  /** rentBand 레벨 */
  rentBand: MarketDistrict["meta"]["rentBand"];
};

/**
 * 상권 ID + 업종 → 월 임대료 추정.
 *
 * @param districtId seoulMarketDistricts의 id (예: "gangnam-station", "hongdae")
 * @param categoryId 11 대분류 ID (food, cafe-dessert, ...)
 * @param customPyeong 사용자 지정 평수 (없으면 업종 권장 평수 사용)
 */
export function estimateMonthlyRent(
  districtId: string | null | undefined,
  categoryId: string,
  customPyeong?: number,
): RentEstimate | null {
  if (!districtId) return null;

  const district = seoulMarketDistricts.find((d) => d.id === districtId);
  if (!district) return null;

  const pyeong = customPyeong && customPyeong > 0
    ? customPyeong
    : (RECOMMENDED_PYEONG[categoryId] ?? 15);

  const ratePerPyeongKrw = RENT_PER_PYEONG_KRW[district.meta.rentBand];
  const monthlyRentKrw = ratePerPyeongKrw * pyeong;
  const managementFeeKrw = Math.round(monthlyRentKrw * 0.12); // 12% 평균
  const depositKrw = monthlyRentKrw * DEPOSIT_MULTIPLIER[district.meta.rentBand];

  return {
    monthlyRentKrw,
    managementFeeKrw,
    depositKrw,
    pyeong,
    ratePerPyeongKrw,
    districtLabel: district.title.ko,
    rentBand: district.meta.rentBand,
  };
}

/**
 * 평수만으로 추정 (상권 미선택 시). 업종 평균 band(mid) 적용.
 */
export function estimateRentByPyeongOnly(pyeong: number, rentBand: MarketDistrict["meta"]["rentBand"] = "mid"): RentEstimate {
  const ratePerPyeongKrw = RENT_PER_PYEONG_KRW[rentBand];
  const monthlyRentKrw = ratePerPyeongKrw * pyeong;
  return {
    monthlyRentKrw,
    managementFeeKrw: Math.round(monthlyRentKrw * 0.12),
    depositKrw: monthlyRentKrw * DEPOSIT_MULTIPLIER[rentBand],
    pyeong,
    ratePerPyeongKrw,
    districtLabel: "—",
    rentBand,
  };
}
