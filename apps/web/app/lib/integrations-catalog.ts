/**
 * 자동 데이터 수집 채널 SSOT — 사장님 수기 입력 마찰을 최소화하기 위한 카탈로그.
 *
 *  ── 왜 만들었나 (2026-05-12) ──────────────────────────────────────────
 *  build.up 최대 약점 = 사장님이 매출·비용을 수기 입력해야 룰엔진이 작동.
 *  → OfflineFounderBrief 의 신호 90%가 "data not ready" 로 끝날 위험.
 *  → 캐시노트는 카드사·VAN 자동연동 — 압도적 우위.
 *
 *  해결: 업종별 *무료 OAuth + 사장님 본인 동의* 채널을 카탈로그로 명시 →
 *       「마이페이지 > 데이터 연결」 에서 1-click 연동 (v1 placeholder, v2 OAuth).
 *
 *  ── 비용 정책 (메모리 SSOT: `feedback_integration_cost_policy.md`) ──
 *  - free: 즉시 활성화 (사용자 본인 OAuth · 무료 API)
 *  - freemium: 무료 한도 내 사용
 *  - paid-gated: 사용자 100명+ & 가치 입증 후 활성화 (CODEF·팝빌·KFTC)
 *
 *  ── 출처 ─────────────────────────────────────────────────────────
 *  · 네이버 커머스 API (OAuth2 client_credentials, 완전 무료)
 *  · 네이버 예약 (스마트플레이스 OAuth · 뷰티·피트니스·펫·생활서비스 통합)
 *  · GA4 Data API + Meta Conversions API (무료 OAuth)
 *  · Stripe·Slack·Sentry·Linear webhook (스타트업; SaaS metrics 아키텍처)
 *  · 카드사 매출 스크래핑 (사용자 위임 — 무료 v1 / 정식 API v2)
 *  · KFTC 오픈뱅킹·CODEF/팝빌 홈택스 (paid-gated)
 *  ────────────────────────────────────────────────────────────────
 */

export type IntegrationStatus =
  | "available"        // 즉시 연결 가능 (v1 OAuth 구현 완료 또는 placeholder)
  | "coming-soon"     // 다음 분기 활성화 예정
  | "paid-gated";     // 비용 정책상 사용자 100명+ 이후

export type IntegrationCostTier = "free" | "freemium" | "paid";

export type IntegrationDataDepth =
  | "revenue"            // 매출만
  | "revenue+customer"   // 매출 + 고객/예약 정보
  | "revenue+inventory"  // 매출 + 재고/상품
  | "cost"               // 비용/매입
  | "full";              // 매출+비용+고객

export type IntegrationChannel = {
  id: string;
  labelKo: string;
  labelEn: string;
  /** 어떤 데이터가 자동 수집되는지 사장님께 보여줄 1줄 */
  dataKo: string;
  /** 어떤 업종에서 의미 있는지 — DashboardCardMeta industryHint 와 동일한 키 사용 */
  industries: string[]; // 빈 배열이면 모든 업종 공통
  cost: IntegrationCostTier;
  /** 사용자 100명+ & 비용·계약 정리 끝나면 활성화 */
  costNote?: string;
  status: IntegrationStatus;
  authType: "oauth" | "api-key" | "scrape-via-user" | "webhook" | "csv-upload";
  dataDepth: IntegrationDataDepth;
  /** 사장님이 이미 쓸 가능성 (시장 점유율 추정) */
  marketReach: "very-high" | "high" | "medium" | "low";
  /** 사장님이 봤을 때 우선순위 (1 가장 추천) */
  priority: 1 | 2 | 3;
};

export const INTEGRATION_CHANNELS: IntegrationChannel[] = [
  // ─── 모든 업종 공통 ───────────────────────────────────────────────
  {
    id: "naver-place",
    labelKo: "네이버 플레이스 (스마트플레이스)",
    labelEn: "Naver Place (Smart Place)",
    dataKo: "리뷰 · 방문자 통계 · 검색 노출 · 영업시간 알림",
    industries: ["food", "cafe-dessert", "beauty", "fitness", "pet", "living-service", "retail"],
    cost: "free",
    status: "coming-soon",
    authType: "oauth",
    dataDepth: "revenue+customer",
    marketReach: "very-high",
    priority: 1,
  },
  {
    id: "kakao-channel",
    labelKo: "카카오톡 채널 (알림톡)",
    labelEn: "Kakao Channel (AlimTalk)",
    dataKo: "고객 알림 발송 · 단골 win-back 캠페인 (수집 X)",
    industries: [], // 모든 업종
    cost: "freemium",
    costNote: "소상공인 지원사업 — 연매출 10억↓ 시 30만원 무상캐시 + 건당 8-20원",
    status: "coming-soon",
    authType: "oauth",
    dataDepth: "revenue+customer", // 발신 데이터 기반 캠페인
    marketReach: "very-high",
    priority: 2,
  },

  // ─── P0-1: 네이버 커머스 API (이커머스·소매·디지털 일부) ────────────────
  {
    id: "naver-commerce",
    labelKo: "네이버 스마트스토어 (커머스 API)",
    labelEn: "Naver Smart Store (Commerce API)",
    dataKo: "주문 · 매출 · 재고 · 정산 · 환불 — 풀스택 자동 수집",
    industries: ["ecommerce", "retail", "online-digital"],
    cost: "free",
    status: "available",
    authType: "oauth",
    dataDepth: "full",
    marketReach: "very-high",
    priority: 1,
  },
  {
    id: "coupang-wing",
    labelKo: "쿠팡 윙 (Open API)",
    labelEn: "Coupang Wing (Open API)",
    dataKo: "주문 · 매출 · 정산 · 광고비",
    industries: ["ecommerce", "retail"],
    cost: "free",
    costNote: "셀러 본인 키 발급 위임 — 180일 키",
    status: "coming-soon",
    authType: "api-key",
    dataDepth: "full",
    marketReach: "high",
    priority: 2,
  },
  {
    id: "11st-seller",
    labelKo: "11번가 셀러 API",
    labelEn: "11st Seller API",
    dataKo: "주문 · 매출 · 정산",
    industries: ["ecommerce", "retail"],
    cost: "free",
    status: "coming-soon",
    authType: "api-key",
    dataDepth: "revenue",
    marketReach: "medium",
    priority: 3,
  },
  {
    id: "cafe24",
    labelKo: "카페24 · 메이크샵 (자사몰)",
    labelEn: "Cafe24 / Makeshop (own shop)",
    dataKo: "주문 · 매출 · 재고 · 회원",
    industries: ["ecommerce", "retail"],
    cost: "free",
    status: "coming-soon",
    authType: "oauth",
    dataDepth: "full",
    marketReach: "high",
    priority: 2,
  },

  // ─── P0-2: 네이버 예약 (뷰티·피트니스·펫·생활서비스 통합) ─────────────────
  {
    id: "naver-booking",
    labelKo: "네이버 예약 (스마트플레이스)",
    labelEn: "Naver Booking (Smart Place)",
    dataKo: "예약 · 고객 · 결제 · 노쇼율 — 4개 업종 통합 채널",
    industries: ["beauty", "fitness", "pet", "living-service", "food"],
    cost: "free",
    status: "available",
    authType: "oauth",
    dataDepth: "revenue+customer",
    marketReach: "very-high",
    priority: 1,
  },

  // ─── P0-3: GA4 + Meta CAPI (디지털·스타트업·이커머스 보조) ─────────────
  {
    id: "ga4",
    labelKo: "Google Analytics 4 (GA4 Data API)",
    labelEn: "Google Analytics 4 (Data API)",
    dataKo: "트래픽 · 전환 · 사용자 행동 · 채널 ROI",
    industries: ["online-digital", "startup-tech", "ecommerce", "education"],
    cost: "free",
    status: "available",
    authType: "oauth",
    dataDepth: "revenue+customer",
    marketReach: "very-high",
    priority: 1,
  },
  {
    id: "meta-capi",
    labelKo: "Meta Conversions API (페이스북·인스타)",
    labelEn: "Meta Conversions API",
    dataKo: "광고 전환 · CPA · ROAS",
    industries: ["online-digital", "ecommerce", "startup-tech", "beauty", "fitness"],
    cost: "free",
    status: "coming-soon",
    authType: "oauth",
    dataDepth: "revenue+customer",
    marketReach: "high",
    priority: 2,
  },
  {
    id: "naver-ads",
    labelKo: "네이버 광고 API",
    labelEn: "Naver Ads API",
    dataKo: "광고비 · 노출 · 클릭 · 전환",
    industries: ["online-digital", "ecommerce", "retail", "beauty", "fitness", "food", "cafe-dessert"],
    cost: "free",
    status: "coming-soon",
    authType: "api-key",
    dataDepth: "cost",
    marketReach: "very-high",
    priority: 2,
  },

  // ─── 스타트업·SaaS 채널 (메모리 SaaS metrics 아키텍처) ─────────────────
  {
    id: "stripe",
    labelKo: "Stripe (구독·결제)",
    labelEn: "Stripe (subscriptions)",
    dataKo: "MRR · 이탈률 · 결제·환불 · ARPU",
    industries: ["startup-tech", "online-digital"],
    cost: "free",
    status: "available",
    authType: "oauth",
    dataDepth: "full",
    marketReach: "high",
    priority: 1,
  },
  {
    id: "slack",
    labelKo: "Slack (팀 이벤트)",
    labelEn: "Slack (team events)",
    dataKo: "팀 활동 · 인시던트 알림 (옵션)",
    industries: ["startup-tech"],
    cost: "free",
    status: "coming-soon",
    authType: "oauth",
    dataDepth: "revenue+customer",
    marketReach: "high",
    priority: 3,
  },
  {
    id: "mixpanel",
    labelKo: "Mixpanel · Amplitude (제품 분석)",
    labelEn: "Mixpanel / Amplitude",
    dataKo: "활성 사용자 · 리텐션 · 기능 사용",
    industries: ["startup-tech", "online-digital"],
    cost: "freemium",
    status: "coming-soon",
    authType: "api-key",
    dataDepth: "revenue+customer",
    marketReach: "medium",
    priority: 2,
  },
  {
    id: "saas-webhook",
    labelKo: "Custom Webhook (자체 서버 → build.up)",
    labelEn: "Custom Webhook",
    dataKo: "임의 이벤트 직접 푸시 — saas_metrics_* 테이블 입력",
    industries: ["startup-tech", "online-digital"],
    cost: "free",
    status: "available",
    authType: "webhook",
    dataDepth: "full",
    marketReach: "medium",
    priority: 2,
  },

  // ─── 외식·카페 채널 ────────────────────────────────────────────────
  {
    id: "baemin",
    labelKo: "배달의민족 사장님광장",
    labelEn: "Baemin Ceo",
    dataKo: "배달 매출 · 메뉴별 판매 · 리뷰 · 광고비",
    industries: ["food", "cafe-dessert"],
    cost: "free",
    costNote: "공식 API 미공개 — 사장님 본인 로그인 위임 스크래핑 (v1)",
    status: "coming-soon",
    authType: "scrape-via-user",
    dataDepth: "full",
    marketReach: "very-high",
    priority: 1,
  },
  {
    id: "coupang-eats",
    labelKo: "쿠팡이츠 스토어",
    labelEn: "Coupang Eats Store",
    dataKo: "배달 매출 · 메뉴 · 리뷰",
    industries: ["food", "cafe-dessert"],
    cost: "free",
    status: "coming-soon",
    authType: "scrape-via-user",
    dataDepth: "full",
    marketReach: "high",
    priority: 2,
  },
  {
    id: "yogiyo",
    labelKo: "요기요 사장님",
    labelEn: "Yogiyo Ceo",
    dataKo: "배달 매출 · 메뉴 · 리뷰",
    industries: ["food", "cafe-dessert"],
    cost: "free",
    status: "coming-soon",
    authType: "scrape-via-user",
    dataDepth: "full",
    marketReach: "high",
    priority: 2,
  },
  {
    id: "payhere",
    labelKo: "페이히어 POS",
    labelEn: "PayHere POS",
    dataKo: "POS 매출 · 메뉴별 · 시간대",
    industries: ["food", "cafe-dessert", "beauty", "retail"],
    cost: "free",
    costNote: "B2B 파트너 연동 협의 중",
    status: "coming-soon",
    authType: "api-key",
    dataDepth: "revenue",
    marketReach: "medium",
    priority: 3,
  },

  // ─── 식자재·재고 (외식·카페·펫) ─────────────────────────────────────
  {
    id: "marketbom",
    labelKo: "마켓봄 (식자재 ERP)",
    labelEn: "Marketbom (F&B inventory)",
    dataKo: "식자재 매입 · 재고 회전 · 원가",
    industries: ["food", "cafe-dessert"],
    cost: "free",
    status: "coming-soon",
    authType: "api-key",
    dataDepth: "cost",
    marketReach: "medium",
    priority: 2,
  },
  {
    id: "freshen",
    labelKo: "CJ 프레시엔 (식자재)",
    labelEn: "CJ Freshen (F&B supply)",
    dataKo: "식자재 매입 · 원가",
    industries: ["food", "cafe-dessert"],
    cost: "free",
    status: "coming-soon",
    authType: "api-key",
    dataDepth: "cost",
    marketReach: "medium",
    priority: 3,
  },

  // ─── 카드사·금융 (모든 업종) ─────────────────────────────────────────
  {
    id: "card-merchant",
    labelKo: "카드사 매출 (BC·신한·KB·삼성)",
    labelEn: "Card Issuer Sales",
    dataKo: "일별 카드 매출 · 정산 일자 · 수수료",
    industries: [], // 모든 업종
    cost: "free",
    costNote: "사용자 위임 스크래핑 v1 / 정식 API v2",
    status: "coming-soon",
    authType: "scrape-via-user",
    dataDepth: "revenue",
    marketReach: "very-high",
    priority: 1,
  },
  {
    id: "open-banking",
    labelKo: "오픈뱅킹 (KFTC)",
    labelEn: "Open Banking (KFTC)",
    dataKo: "입출금 · 카드 입금 · 매입 자동 식별",
    industries: [],
    cost: "paid",
    costNote: "초기 보안점검 1천만원대 + 건당 20-30원 종량제 — 사용자 100명+ 후",
    status: "paid-gated",
    authType: "oauth",
    dataDepth: "full",
    marketReach: "very-high",
    priority: 2,
  },
  {
    id: "hometax-codef",
    labelKo: "홈택스 (CODEF · 팝빌)",
    labelEn: "Hometax (CODEF / Popbill)",
    dataKo: "전자세금계산서 · 현금영수증 · 부가세 신고",
    industries: [],
    cost: "paid",
    costNote: "CODEF 건당 50-150원 / 팝빌 월 5천원~ — 사용자 100명+ 후",
    status: "paid-gated",
    authType: "oauth",
    dataDepth: "full",
    marketReach: "very-high",
    priority: 2,
  },

  // ─── 업종 전용 SaaS (스크래핑·수동 fallback) ─────────────────────────
  {
    id: "edu-erp",
    labelKo: "학원 ERP (구르미·아이소핫·MM·이지엣지)",
    labelEn: "Academy ERP",
    dataKo: "학생 명단 · 출결 · 수강료 정산",
    industries: ["education"],
    cost: "free",
    costNote: "CSV export 수동 업로드 (v1) / API 협의 (v2)",
    status: "coming-soon",
    authType: "csv-upload",
    dataDepth: "revenue+customer",
    marketReach: "high",
    priority: 2,
  },
  {
    id: "fitness-saas",
    labelKo: "피트니스 SaaS (휘트니스링크·짐브로·핏데이)",
    labelEn: "Fitness SaaS",
    dataKo: "회원 · 회원권 갱신율 · 출석",
    industries: ["fitness"],
    cost: "free",
    status: "coming-soon",
    authType: "csv-upload",
    dataDepth: "revenue+customer",
    marketReach: "medium",
    priority: 2,
  },
  {
    id: "space-cloud",
    labelKo: "스페이스클라우드 / 스페이스마켓",
    labelEn: "Space Cloud / Space Market",
    dataKo: "예약 · 정산 · 점유율 · 평균 객단가",
    industries: ["space"],
    cost: "free",
    costNote: "공식 API 없음 — 호스트 대시보드 스크래핑 위임",
    status: "coming-soon",
    authType: "scrape-via-user",
    dataDepth: "revenue+customer",
    marketReach: "very-high",
    priority: 1,
  },
  {
    id: "soomgo",
    labelKo: "숨고 · 크몽 (서비스 마켓)",
    labelEn: "Soomgo / Kmong",
    dataKo: "수주 정산 · 의뢰 건수",
    industries: ["living-service", "online-digital"],
    cost: "free",
    status: "coming-soon",
    authType: "csv-upload",
    dataDepth: "revenue",
    marketReach: "high",
    priority: 3,
  },
];

/** id 빠른 조회 맵 */
export const INTEGRATION_CHANNELS_BY_ID: Record<string, IntegrationChannel> = Object.fromEntries(
  INTEGRATION_CHANNELS.map((c) => [c.id, c]),
);

/** 특정 업종 사장님께 추천할 채널 — priority + status 정렬 */
export function getChannelsForIndustry(industryCategoryId: string): IntegrationChannel[] {
  return INTEGRATION_CHANNELS.filter(
    (c) => c.industries.length === 0 || c.industries.includes(industryCategoryId),
  ).sort((a, b) => {
    // available 먼저, 그 후 coming-soon, 마지막 paid-gated
    const statusRank = { available: 0, "coming-soon": 1, "paid-gated": 2 };
    const sa = statusRank[a.status], sb = statusRank[b.status];
    if (sa !== sb) return sa - sb;
    return a.priority - b.priority;
  });
}

/** 즉시 활성화 가능 (사장님이 지금 바로 1-click 연동) 채널만 */
export function getAvailableChannelsForIndustry(industryCategoryId: string): IntegrationChannel[] {
  return getChannelsForIndustry(industryCategoryId).filter((c) => c.status === "available");
}
