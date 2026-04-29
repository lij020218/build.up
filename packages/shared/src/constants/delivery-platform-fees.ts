/**
 * 한국 배달앱·POS 수수료 테이블 (2026년 기준 추정치).
 *
 * 각 플랫폼의 실제 수수료는 계약 조건·지역·프로모션에 따라 상이.
 * 여기 제공되는 값은 공개 자료·업계 표준을 기반한 추정이며,
 * FinancialReviewStage의 "자동 추정" 기본값으로만 사용.
 * 사용자는 UI에서 언제든 수정 가능.
 */

export type DeliveryPlatformFee = {
  id: string;
  label: { ko: string; en: string };
  /** 중개 수수료 (%) — 음식값 기준 */
  commissionPercent: number;
  /** 결제 수수료 (%) */
  paymentPercent: number;
  /** 월 고정 광고비 (0이면 미운영 가능) */
  monthlyAdFeeKrw: number;
};

/**
 * 3대 배달앱 2026년 추정 수수료.
 * 출처: 각 사 공시 + 소상공인 커뮤니티 실사례.
 */
export const DELIVERY_PLATFORM_FEES: DeliveryPlatformFee[] = [
  {
    id: "baemin",
    label: { ko: "배달의민족", en: "Baemin" },
    commissionPercent: 6.8,
    paymentPercent: 3.0,
    monthlyAdFeeKrw: 88_000,
  },
  {
    id: "coupang-eats",
    label: { ko: "쿠팡이츠", en: "Coupang Eats" },
    commissionPercent: 7.5,
    paymentPercent: 3.0,
    monthlyAdFeeKrw: 100_000,
  },
  {
    id: "yogiyo",
    label: { ko: "요기요", en: "Yogiyo" },
    commissionPercent: 9.8,
    paymentPercent: 3.3,
    monthlyAdFeeKrw: 77_000,
  },
];

export type PosProviderFee = {
  id: string;
  label: { ko: string; en: string };
  /** 월 기기 렌탈료 */
  monthlyRentalKrw: number;
  /** 카드 수수료 (%) — 신용카드 평균 */
  cardFeePercent: number;
};

/** 주요 POS 공급사 수수료 */
export const POS_PROVIDER_FEES: PosProviderFee[] = [
  { id: "bizon",   label: { ko: "비즈온",      en: "BizOn" },   monthlyRentalKrw: 33_000, cardFeePercent: 1.60 },
  { id: "smartro", label: { ko: "스마트로",    en: "Smartro" }, monthlyRentalKrw: 35_000, cardFeePercent: 1.55 },
  { id: "kicc",    label: { ko: "KICC",        en: "KICC" },    monthlyRentalKrw: 30_000, cardFeePercent: 1.50 },
  { id: "toss",    label: { ko: "토스 페이먼츠", en: "Toss" },   monthlyRentalKrw: 0,       cardFeePercent: 1.70 },
];

export type OperationsSelections = {
  /** 선택된 배달앱 ID들 */
  deliveryPlatformIds?: string[];
  /** 선택된 POS 공급사 ID */
  posProviderId?: string;
  /** 배달 매출 비율 (기본 0.3 = 30%) — 오프라인 50%, 배달 30%, 기타 20% */
  deliveryRevenueRatio?: number;
};

export type SgaBreakdownItem = { label: string; amount: number; type: "commission" | "payment" | "ad" | "rental" | "card"; };

/**
 * 운영 설정(배달앱·POS) + 예상 월매출 → 월 SG&A(수수료·렌탈) 추정.
 *
 * @returns total: 월 SG&A 총액, breakdown: 항목별 상세
 */
export function estimateMonthlySgaFromOperations(
  selections: OperationsSelections,
  expectedMonthlyRevenueKrw: number,
): { total: number; breakdown: SgaBreakdownItem[] } {
  const breakdown: SgaBreakdownItem[] = [];

  const deliveryRatio = selections.deliveryRevenueRatio ?? 0.3;
  const deliveryPlatformIds = selections.deliveryPlatformIds ?? [];
  const deliveryRevenue = expectedMonthlyRevenueKrw * deliveryRatio;
  const perPlatformRevenue = deliveryPlatformIds.length > 0
    ? deliveryRevenue / deliveryPlatformIds.length
    : 0;

  for (const platformId of deliveryPlatformIds) {
    const p = DELIVERY_PLATFORM_FEES.find((x) => x.id === platformId);
    if (!p) continue;
    const commission = Math.round((perPlatformRevenue * p.commissionPercent) / 100);
    const payment = Math.round((perPlatformRevenue * p.paymentPercent) / 100);
    if (commission > 0) breakdown.push({ label: `${p.label.ko} 중개수수료`, amount: commission, type: "commission" });
    if (payment > 0) breakdown.push({ label: `${p.label.ko} 결제수수료`, amount: payment, type: "payment" });
    if (p.monthlyAdFeeKrw > 0) breakdown.push({ label: `${p.label.ko} 광고`, amount: p.monthlyAdFeeKrw, type: "ad" });
  }

  if (selections.posProviderId) {
    const pos = POS_PROVIDER_FEES.find((x) => x.id === selections.posProviderId);
    if (pos) {
      const offlineRevenue = expectedMonthlyRevenueKrw * (1 - deliveryRatio);
      const cardFee = Math.round((offlineRevenue * pos.cardFeePercent) / 100);
      if (pos.monthlyRentalKrw > 0) breakdown.push({ label: `POS 렌탈 (${pos.label.ko})`, amount: pos.monthlyRentalKrw, type: "rental" });
      if (cardFee > 0) breakdown.push({ label: `POS 카드수수료 (${pos.label.ko})`, amount: cardFee, type: "card" });
    }
  }

  const total = breakdown.reduce((sum, b) => sum + b.amount, 0);
  return { total, breakdown };
}
