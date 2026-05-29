/**
 * dashboard-screen-marketing.ts
 *
 * 2026-05-27 Phase 2 — 모바일 마케팅 채널 상수 모음.
 *
 * 분리 목적:
 *   - i18n 문자열이 많아 dashboard-screen.tsx 의 상단 30+ 줄 차지
 *   - 채널 추가/제거가 잦으므로 별도 파일에서 관리하면 git diff 명확
 *
 * 포함:
 *   - mobileMarketingChannels: 채널 카드 메타 (key·label·body)
 *   - mobileRecommendedMarketingChannels: 업종별 추천 채널 순서
 *
 * 웹의 SSOT: industry-card-matrix.ts + 각 마케팅 카드 컴포넌트.
 * 모바일은 화면 면적 제약으로 채널 카드 형식으로 표현.
 */

// MarketingChannelKey 는 dashboard-screen.tsx 안에 정의되어 있음.
//   추후 더 많은 채널 확장 시 @foundone/shared 로 이동 검토.
export type MarketingChannelKey =
  | "naver-place"
  | "instagram"
  | "delivery-ads"
  | "naver-keyword"
  | "daangn"
  | "blog-review"
  | "kakao"
  | "google-ads"
  | "meta-ads"
  | "offline";

export const mobileMarketingChannels: Array<{
  key: MarketingChannelKey;
  label: { ko: string; en: string };
  body: { ko: string; en: string };
}> = [
  { key: "naver-place", label: { ko: "네이버 플레이스", en: "Naver Place" }, body: { ko: "지도 검색, 리뷰, 방문 전환을 관리합니다.", en: "Manage map search, reviews, and visit conversion." } },
  { key: "instagram", label: { ko: "인스타그램", en: "Instagram" }, body: { ko: "비주얼 콘텐츠와 첫 고객 반응을 만듭니다.", en: "Build visual demand and early customer response." } },
  { key: "delivery-ads", label: { ko: "배달앱 광고", en: "Delivery Ads" }, body: { ko: "배달·포장 매출의 노출과 수수료를 같이 봅니다.", en: "Track exposure and fees for delivery and pickup sales." } },
  { key: "naver-keyword", label: { ko: "네이버 키워드", en: "Naver Keyword" }, body: { ko: "검색 의도가 높은 고객을 잡습니다.", en: "Capture customers with active search intent." } },
  { key: "daangn", label: { ko: "당근", en: "Daangn" }, body: { ko: "반경 기반 동네 고객을 빠르게 만납니다.", en: "Reach neighborhood customers by radius." } },
  { key: "blog-review", label: { ko: "블로그·체험단", en: "Blog Review" }, body: { ko: "검색 신뢰와 방문 전 확신을 쌓습니다.", en: "Build search trust before the first visit." } },
  { key: "kakao", label: { ko: "카카오 채널", en: "Kakao Channel" }, body: { ko: "재방문, 예약, 공지 흐름을 만듭니다.", en: "Create repeat visit, booking, and notice loops." } },
  { key: "google-ads", label: { ko: "구글 애즈", en: "Google Ads" }, body: { ko: "온라인·테크 사업의 검색 수요를 검증합니다.", en: "Validate search demand for online and tech businesses." } },
  { key: "meta-ads", label: { ko: "Meta 광고", en: "Meta Ads" }, body: { ko: "타깃 테스트와 초기 전환 실험에 씁니다.", en: "Run targeting and early conversion tests." } },
  { key: "offline", label: { ko: "오프라인", en: "Offline" }, body: { ko: "전단, 제휴, 현장 프로모션을 기록합니다.", en: "Track flyers, partnerships, and local promotions." } },
];

export const mobileRecommendedMarketingChannels: Record<string, MarketingChannelKey[]> = {
  food: ["naver-place", "delivery-ads", "instagram", "daangn", "blog-review"],
  "cafe-dessert": ["instagram", "blog-review", "naver-place", "daangn"],
  retail: ["daangn", "naver-keyword", "instagram"],
  beauty: ["naver-place", "blog-review", "kakao", "instagram"],
  pet: ["naver-place", "blog-review", "kakao", "instagram"],
  fitness: ["daangn", "instagram", "naver-place", "kakao"],
  education: ["daangn", "instagram", "naver-place", "kakao"],
  space: ["naver-place", "instagram", "daangn"],
  "online-digital": ["naver-keyword", "meta-ads", "instagram", "google-ads"],
  "startup-tech": ["meta-ads", "google-ads", "instagram", "blog-review"],
  "living-service": ["daangn", "naver-place", "kakao"],
};
