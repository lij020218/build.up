/**
 * 온보딩 업종 분기 SSOT — 기존 사업자 온보딩(5화면)의 용어·질문·CTA를 업종별로 정의.
 *
 * 원칙 (2026-07-28 사장님 지시): "SaaS 기획자에게 프랜차이즈형·쿠팡이츠를 물으면 웃긴다.
 * 각 업종에 맞는 채널과 용어가 쓰여야 한다." — 질문 자체를 업종이 결정한다.
 *
 *  - placeNoun: 사업장을 부르는 말 (가게/매장/스토어/회사) — 화면 타이틀·카피 전반
 *  - asks: 질문 노출 플래그 — false 면 그 질문은 렌더 자체가 안 됨 (숨김이 아니라 부재)
 *  - revenueSyncCta: 첫 진단의 매출 연동 카드 종류 (오프라인=POS, 온라인=커머스/CSV, 스타트업=지표)
 *
 * 커버리지 가드: onboarding-profile-coverage.test.ts 가 offering-kinds 의
 * CATEGORY_OFFERING_FALLBACK 전 카테고리와 1:1 대조 — 새 업종 추가 시 여기도 강제.
 * 채널 화면(배달앱/마켓플레이스/툴스택)의 분기는 기존 온보딩 컴포넌트 로직을 유지한다.
 */

export type OnboardingAddressAsk = "required" | "optional" | "skip";
export type RevenueSyncCta = "pos" | "ecommerce-csv" | "saas-metrics";

export type OnboardingCategoryProfile = {
  /** 사업장을 부르는 말 */
  placeNoun: { ko: string; en: string };
  /** 운영자를 부르는 말 — 오프라인·온라인 "사장님", 스타트업 "대표님" */
  ownerTitle: { ko: string; en: string };
  /** "함께 일하는 사람" 두 번째 선택지 라벨 — 오프라인 "가족과", 스타트업 "공동창업자와" (id 는 동일) */
  secondBandLabel: { ko: string; en: string };
  /** 월매출 구간 질문 라벨 */
  revenueLabel: { ko: string; en: string };
  /** 함께 일하는 사람 질문 라벨 */
  teamLabel: { ko: string; en: string };
  asks: {
    /** 독립/프랜차이즈 질문 — 가맹 모델이 실존하는 업종만 */
    franchise: boolean;
    /** 영업시간·정기휴무 — 물리적 영업장이 있는 업종만 */
    businessHours: boolean;
    /** 주소 — 오프라인은 필수(상권·지역 맞춤), 온라인·스타트업은 선택(지역 혜택용) */
    address: OnboardingAddressAsk;
  };
  /** 첫 진단 화면의 매출 연동 CTA */
  revenueSyncCta: RevenueSyncCta;
};

const OFFLINE_STORE_BASE = {
  ownerTitle: { ko: "사장님", en: "Owner" },
  secondBandLabel: { ko: "가족과", en: "With family" },
  revenueLabel: { ko: "월매출", en: "Monthly revenue" },
  teamLabel: { ko: "함께 일하는 사람", en: "People working with you" },
  asks: { franchise: true, businessHours: true, address: "required" as const },
  revenueSyncCta: "pos" as const,
};

export const ONBOARDING_CATEGORY_PROFILES: Record<string, OnboardingCategoryProfile> = {
  "food":         { ...OFFLINE_STORE_BASE, placeNoun: { ko: "가게", en: "restaurant" } },
  "cafe-dessert": { ...OFFLINE_STORE_BASE, placeNoun: { ko: "가게", en: "cafe" } },
  "retail":       { ...OFFLINE_STORE_BASE, placeNoun: { ko: "매장", en: "store" } },
  "beauty":       { ...OFFLINE_STORE_BASE, placeNoun: { ko: "매장", en: "shop" } },
  "fitness":      { ...OFFLINE_STORE_BASE, placeNoun: { ko: "센터", en: "studio" } },
  "education":    { ...OFFLINE_STORE_BASE, placeNoun: { ko: "학원", en: "academy" } },
  "pet":          { ...OFFLINE_STORE_BASE, placeNoun: { ko: "매장", en: "shop" } },
  "living-service": { ...OFFLINE_STORE_BASE, placeNoun: { ko: "매장", en: "shop" } },
  "space":        { ...OFFLINE_STORE_BASE, placeNoun: { ko: "공간", en: "space" } },

  // ── 온라인 셀러 — 물리 매장 없음: 프랜차이즈·영업시간 질문 부재, 주소는 선택 ──
  "online-digital": {
    placeNoun: { ko: "스토어", en: "store" },
    ownerTitle: { ko: "사장님", en: "Owner" },
    secondBandLabel: { ko: "가족과", en: "With family" },
    revenueLabel: { ko: "월매출", en: "Monthly revenue" },
    teamLabel: { ko: "함께 일하는 사람", en: "People working with you" },
    asks: { franchise: false, businessHours: false, address: "optional" },
    revenueSyncCta: "ecommerce-csv",
  },

  // ── 기술 스타트업 — 회사 용어·팀 규모·지표 연동 ──
  "startup-tech": {
    placeNoun: { ko: "회사", en: "company" },
    ownerTitle: { ko: "대표님", en: "Founder" },
    secondBandLabel: { ko: "공동창업자와", en: "With co-founders" },
    revenueLabel: { ko: "월 매출 (MRR 포함)", en: "Monthly revenue (incl. MRR)" },
    teamLabel: { ko: "팀 규모", en: "Team size" },
    asks: { franchise: false, businessHours: false, address: "optional" },
    revenueSyncCta: "saas-metrics",
  },
};

/** 안전 폴백 — 미지의 카테고리는 오프라인 기본형 (질문을 빼먹기보다 넉넉히 묻는 쪽이 안전) */
const DEFAULT_PROFILE: OnboardingCategoryProfile = {
  ...OFFLINE_STORE_BASE,
  placeNoun: { ko: "가게", en: "business" },
  ownerTitle: { ko: "사장님", en: "Owner" },
};

export function resolveOnboardingProfile(categoryId: string | null | undefined): OnboardingCategoryProfile {
  if (categoryId && ONBOARDING_CATEGORY_PROFILES[categoryId]) return ONBOARDING_CATEGORY_PROFILES[categoryId];
  return DEFAULT_PROFILE;
}
