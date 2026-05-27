/**
 * 업종 × 카드 매핑 SSOT — 11 업종 사장님 맞춤 카드 라우터.
 *
 *  ── 왜 만들었나 (2026-05-12 Phase 2a) ─────────────────────────────────
 *  종전: Tier 1.5 13 카드를 *모든 업종* 에 동일 노출 → 11 업종 × 13 카드 =
 *       누구나 9-10개가 본인 업종과 무관. 인지 부하 임계 5-9 초과.
 *
 *  현재: 200+ 자료 (Agent A 37 + Agent B 60 + Agent C 105) 교차 검증 후
 *       업종별로 *진짜 매일 필요한* 카드만 default 노출.
 *       나머지는 hide() 토글로 사장님이 켜기 가능.
 *
 *  ── 200+ 자료 (요약) ──────────────────────────────────────────────────
 *  Universal Essential (Agent A):
 *    · Bezos WBR · Brian Chesky Founder Mode · 토스 이승건 1시간 모니터링
 *    · HBR KPI · MIT Sloan AI KPI · McKinsey SMB tech ROI
 *    · 중기중앙회 폐업 실태조사 (자금악화 15.1%, 매출부진 86.7%)
 *    · Miller 7±2 → Cowan 3-4 → 실무 5-7 → 모바일 5 상한
 *    · 캐시노트·토스 사장님·배민·오늘얼마 4개 모두 매출 raw 가 첫 화면
 *
 *  업종별 (Agent B + C):
 *    · 외식: Toast·R365·NetSuite·식약처·KOSIS·외식업중앙회
 *    · 카페: Crimson Cup·Fresh Cup·페이히어·OKPOS·KB 자영업 보고서
 *    · 뷰티: Zenoti·Meevo·Mindbody·공비서·카카오헤어샵·KB 미용실 보고서
 *    · 소매: Shopify·Lightspeed·Square Retail·TruRating·i-boss
 *    · 이커머스: Polar·Shopify·Daymark·쿠팡·스마트스토어
 *    · 피트니스: Mindbody·MarianaTek·Glofox·WellnessLiving·FIA Retention
 *    · 교육: 학원조아·공선학관·클래스업·에듀OK·Spider Strategies
 *    · 펫: Gingr·VetPort·DaySmart·펫프렌즈·플러스벳·KPMG 반려동물
 *    · 생활서비스: ServiceTitan·Housecall Pro·Praxedo·IBM FTFR·KCA
 *    · 공간임대: OfficeRnD·스페이스클라우드·쏘플·무인연구소
 *    · 온라인 디지털: Stripe·Patreon·ConvertKit·Geckoboard·Communipass
 *    · 스타트업: Brex·Mercury·Ramp·Pry·Finmark·a16z·Datadrivenvc
 *  ────────────────────────────────────────────────────────────────────
 */

/** 11 업종 ID (DashboardHook.industryCategoryId 와 일치) */
export type IndustryId =
  | "food"
  | "cafe-dessert"
  | "beauty"
  | "retail"
  | "ecommerce"
  | "fitness"
  | "education"
  | "pet"
  | "living-service"
  | "space"
  | "online-digital"
  | "startup-tech";

/** 카드 ID — dashboard-cards-meta 와 일치 */
export type CardId =
  // Universal Essential (모든 업종 default 노출)
  | "ceo-morning-hero"
  | "activity-snapshot"
  | "user-activity"
  | "cashflow-hero"
  | "pl-hero"
  | "daily-kpi-strip"
  | "coaching-history"
  | "daily-ops-ritual"
  // 업종별 기존 카드 (Tier 1.5)
  | "inventory-ops"
  | "team-card"
  | "food-safety"
  | "prime-cost"
  | "daily-improvement"
  | "avg-ticket-upsell"
  | "policy-fund-match"
  | "startup-founder-brief"
  | "startup-health"
  | "saas-key-metrics"
  | "integration-hub"
  // 2026-05-12 Phase 2 (startup-tech 보강) — 30+ 실리콘밸리 자료 검증
  | "cash-zero-date"
  // 신규 카드 (Phase 2b-f 에서 추가 예정 — 매트릭스에 슬롯만 예약)
  | "cafe-hourly-sales"          // 카페 — 시간대별 매출 + 메뉴 카테고리 + 폐기
  | "beauty-booking-noshow"      // 뷰티 — 예약·노쇼·점유율·rebook
  | "retail-sell-through"        // 소매 — sell-through·시즌 D-day·best seller
  | "ecommerce-conversion"       // 이커머스 — CVR·ROAS·반품률·리뷰
  | "fitness-retention"          // 피트니스 — 출석·노쇼·회원권 만료·90일 잔존
  | "education-enrollment"       // 교육 — 출석·미수금·재등록·반별 충원
  | "pet-booking"                // 펫 — 예약·서비스 mix·케이지 점유·재방문
  | "living-service-dispatch"    // 생활서비스 — 의뢰·FTFR·시간당 매출·기사 가동
  | "space-occupancy"            // 공간임대 — POR·시간대·청소
  | "online-digital-metrics";    // 온라인 디지털 — MRR breakdown·DAU·전환퍼널·완료율

/**
 * 모든 업종 공통 (universal essential) — 11 업종 default 매일 노출.
 * Agent A 37 자료 합의: 매출·현금·KPI 5칸·AI 해석·체크리스트.
 * UserActivity 는 사장님 결정으로 유지 (2026-05-12).
 */
export const UNIVERSAL_ESSENTIAL_CARDS: readonly CardId[] = [
  "ceo-morning-hero",
  "activity-snapshot",
  "user-activity",
  "cashflow-hero",
  "pl-hero",
  "daily-kpi-strip",
  "coaching-history",
  "daily-ops-ritual",
] as const;

/**
 * 업종별 매일 필수 추가 카드 (Tier 1.5).
 * 200+ 자료 교차 검증 결과 — 각 업종 본업에 직결되는 KPI 만.
 *
 * 우선순위 (배열 순서):
 *   1. 기존 카드 (이미 build.up 에 존재) — 즉시 노출 가능
 *   2. 신규 카드 (Phase 2b-f 에서 작성 예정) — *부재 상태* 표시
 */
export const INDUSTRY_CARDS: Record<IndustryId, readonly CardId[]> = {
  // 외식 — Prime Cost (이미 있음), Food Safety (이미 있음), Inventory, Team
  //   신규 필요: 배달비중·PMIX (Phase 2b)
  food: [
    "prime-cost",
    "food-safety",
    "inventory-ops",
    "team-card",
    "daily-improvement",
    "policy-fund-match",
  ],

  // 카페 — Prime Cost·Food Safety (외식 공유), Inventory (원두·유제품·시럽 발주), Team
  //   신규 필요: 시간대별 매출 + 메뉴 카테고리 + 원두 폐기 (Phase 2c)
  "cafe-dessert": [
    "prime-cost",
    "food-safety",
    "cafe-hourly-sales", // 신규
    "inventory-ops",     // 원두·우유·시럽·컵 등 발주 필수 (2026-05-26 추가)
    "team-card",
    "avg-ticket-upsell",
    "policy-fund-match",
  ],

  // 뷰티 — Team, 객단가 업셀
  //   신규 필요: 예약·노쇼·디자이너 rebook (Phase 2d)
  beauty: [
    "beauty-booking-noshow", // 신규
    "team-card",
    "avg-ticket-upsell",
    "saas-key-metrics",      // 멤버십 운영 시
    "daily-improvement",
    "policy-fund-match",
  ],

  // 소매 — Inventory, AvgTicketUpsell
  //   신규 필요: sell-through·시즌 D-day (Phase 2e)
  retail: [
    "retail-sell-through", // 신규
    "inventory-ops",
    "avg-ticket-upsell",
    "team-card",
    "daily-improvement",
    "policy-fund-match",
  ],

  // 이커머스 — Inventory
  //   신규 필요: CVR·ROAS·반품률 (Phase 2f)
  ecommerce: [
    "ecommerce-conversion", // 신규
    "inventory-ops",
    "avg-ticket-upsell",
    "daily-improvement",
    "policy-fund-match",
  ],

  // 피트니스 — Team, SaaSKeyMetrics (회원권)
  //   신규 필요: 출석·노쇼·회원권 만료·90일 잔존 (Phase 2g)
  fitness: [
    "fitness-retention",  // 신규
    "team-card",
    "saas-key-metrics",
    "avg-ticket-upsell",
    "daily-improvement",
    "policy-fund-match",
  ],

  // 교육 — Team
  //   신규 필요: 출석·미수금·재등록·반별 충원 (Phase 2h)
  education: [
    "education-enrollment", // 신규
    "team-card",
    "saas-key-metrics",     // 정기 결제 시
    "daily-improvement",
    "policy-fund-match",
  ],

  // 펫 — Inventory (사료 등), Team
  //   신규 필요: 예약·서비스 mix·케이지 점유·재방문 (Phase 2i)
  pet: [
    "pet-booking",   // 신규
    "inventory-ops",
    "team-card",
    "avg-ticket-upsell",
    "daily-improvement",
    "policy-fund-match",
  ],

  // 생활서비스 — Team
  //   신규 필요: 의뢰·FTFR·시간당 매출·기사 가동 (Phase 2j)
  "living-service": [
    "living-service-dispatch", // 신규
    "team-card",
    "daily-improvement",
    "policy-fund-match",
  ],

  // 공간임대 — Inventory (청소 소모품)
  //   신규 필요: POR·시간대·청소 (Phase 2k)
  space: [
    "space-occupancy", // 신규
    "inventory-ops",
    "daily-improvement",
    "policy-fund-match",
  ],

  // 온라인 디지털 — SaaSKeyMetrics
  //   신규 필요: MRR breakdown·DAU·전환퍼널·완료율 (Phase 2l)
  "online-digital": [
    "online-digital-metrics", // 신규
    "saas-key-metrics",
    "daily-improvement",
    "policy-fund-match",
  ],

  // 스타트업 — 2026 실리콘밸리 표준 (30+ 자료) 보강:
  //   기존: StartupFounderBrief·StartupHealth·SaaSKeyMetrics (2023-2024 Sacks·Feld 표준 정합)
  //   신규: CashZeroDate (절대 날짜 + 채용 시뮬, 2026 SV daily KPI #1)
  //   향후 P0: AICostMargin (inference %·cost-per-token), TTFV (D7/D30 cohort)
  //   향후 P1: ARRPerEmployee ($500K=새 $200K), NRRByUseCase (AI-native 48% 함정)
  "startup-tech": [
    "cash-zero-date",
    "startup-founder-brief",
    "startup-health",
    "saas-key-metrics",
    "policy-fund-match",
  ],
};

/**
 * 카드 ID → 메타데이터 (자료 인용 + 상태).
 */
export type CardStatus = "existing" | "planned"; // existing = build.up 에 이미 존재 / planned = Phase 2b-f 작성 예정

export type CardMeta = {
  id: CardId;
  status: CardStatus;
  /** 어느 업종에 의미 있는지 (universal = 모든 업종) */
  industries: readonly IndustryId[] | "universal";
  /** 200+ 자료 중 주요 인용 (3개) — 카드 가치 근거 */
  sources: readonly string[];
};

export const CARD_META: Record<CardId, CardMeta> = {
  // ─── Universal Essential ───────────────────────────────────────
  "ceo-morning-hero": {
    id: "ceo-morning-hero", status: "existing", industries: "universal",
    sources: [
      "Bezos Day 1 + WBR (metrics as proxy)",
      "Brian Chesky Founder Mode (in the details)",
      "MIT Sloan: AI-summarized dashboards for decision-making",
    ],
  },
  "activity-snapshot": {
    id: "activity-snapshot", status: "existing", industries: "universal",
    sources: [
      "캐시노트·토스 사장님·배민·오늘얼마 4 한국 앱 첫 화면 #1",
      "SCORE / business.com: daily bank balance + sales = daily",
      "F-pattern: 좌상단 시선 첫 도착점",
    ],
  },
  "user-activity": {
    id: "user-activity", status: "existing", industries: "universal",
    sources: [
      "사장님 결정 (2026-05-12): 매일 사용자 수 변화 그래프 유지",
      "객수 = 매출 ÷ 객단가의 leading indicator",
      "Reforge: NSM input metric 분리 가시화",
    ],
  },
  "cashflow-hero": {
    id: "cashflow-hero", status: "existing", industries: "universal",
    sources: [
      "SCORE: 82% SMB 폐업 원인 = 현금흐름",
      "중기중앙회 폐업 실태조사: 자금악화 15.1%",
      "캐시노트 USP: '언제 얼마나 입금될까?'",
    ],
  },
  "pl-hero": {
    id: "pl-hero", status: "existing", industries: "universal",
    sources: [
      "Pilot: 6 essential SMB metrics — 손익은 monthly cadence",
      "Reforge: ARR/CLV는 monthly·quarterly",
      "일간 손익은 noise — 월말 -5일 강조 권장",
    ],
  },
  "daily-kpi-strip": {
    id: "daily-kpi-strip", status: "existing", industries: "universal",
    sources: [
      "Tabular Editor: KPI card 4-5개가 working memory 상한",
      "DataDes: 5칸 strip = F-pattern 두 번째 row",
      "a16z 16 metrics: 업종별 5칸 분기 (외식 vs 미용 vs 도소매)",
    ],
  },
  "coaching-history": {
    id: "coaching-history", status: "existing", industries: "universal",
    sources: [
      "First Round: weekly review = reflection",
      "build.up moat: lock-in 자산 누적",
      "30일+ 메타 인사이트 (자기 의사결정 패턴)",
    ],
  },
  "daily-ops-ritual": {
    id: "daily-ops-ritual", status: "existing", industries: "universal",
    sources: [
      "TimeWellScheduled: 10-15분 morning huddle",
      "Parabol: 행동 개시 트리거",
      "Restaurant Owner: Daily Opening Checklist",
    ],
  },

  // ─── 업종 공통 (조건부) ───────────────────────────────────────
  "inventory-ops": {
    id: "inventory-ops", status: "existing",
    industries: ["food", "cafe-dessert", "retail", "ecommerce", "pet", "space"],
    sources: [
      "Shopify retail inventory management",
      "Crunchtime restaurant inventory",
      "외식·소매·이커머스·펫 재고 운영 표준",
    ],
  },
  "team-card": {
    id: "team-card", status: "existing",
    industries: ["food", "cafe-dessert", "beauty", "retail", "fitness", "education", "pet", "living-service"],
    sources: [
      "한국 4대보험·퇴직금 의무 알림",
      "ServiceTitan: 기사 가동률",
      "Mindbody: trainer utilization",
    ],
  },
  "food-safety": {
    id: "food-safety", status: "existing", industries: ["food", "cafe-dessert"],
    sources: [
      "식약처 음식점 위생등급제 자체위생관리일지 의무",
      "Crunchtime daily temp monitoring",
      "care1 위생 매뉴얼",
    ],
  },
  "prime-cost": {
    id: "prime-cost", status: "existing", industries: ["food", "cafe-dessert"],
    sources: [
      "Restaurant365 daily prime cost",
      "한국 식재료비 36.3→40.7% 급증 (KOSIS)",
      "Sage·NetSuite·Toast 외식 1순위 KPI",
    ],
  },
  "daily-improvement": {
    id: "daily-improvement", status: "existing", industries: "universal",
    sources: [
      "Jeff Bezos Day-1 mindset",
      "매출 추세 분기 (Phase 2): 평상시 노출",
      "5분 안에 1개 개선 가능한 액션",
    ],
  },
  "avg-ticket-upsell": {
    id: "avg-ticket-upsell", status: "existing",
    industries: ["food", "cafe-dessert", "beauty", "retail", "ecommerce", "fitness", "education", "pet"],
    sources: [
      "Meevo: retail attach rate",
      "Restaurant365: upsell on top menus",
      "매출 정체 (WoW -5% ~ +5%) 시 분기 노출",
    ],
  },
  "policy-fund-match": {
    id: "policy-fund-match", status: "existing", industries: "universal",
    sources: [
      "중기부·sbiz.or.kr 2026 정책자금",
      "사장님 자격 자동 매칭 + 대환 시뮬",
      "위기 시 elevation (cashflowCriticalElevation)",
    ],
  },
  "startup-founder-brief": {
    id: "startup-founder-brief", status: "existing", industries: ["startup-tech"],
    sources: [
      "Mercury Insights / Brex KPI Dashboard",
      "Datadrivenvc Burn Multiple",
      "Paul Graham Default Alive",
    ],
  },
  "startup-health": {
    id: "startup-health", status: "existing", industries: ["startup-tech"],
    sources: [
      "a16z 16 Startup Metrics",
      "Burn Multiple + Rule of 40",
      "Equals SaaS Engagement Metrics",
    ],
  },
  "saas-key-metrics": {
    id: "saas-key-metrics", status: "existing",
    industries: ["startup-tech", "online-digital", "beauty", "fitness", "education"],
    sources: [
      "Stripe Subscription Analytics",
      "ConvertKit / Patreon Insights",
      "Geckoboard MRR breakdown",
    ],
  },
  "integration-hub": {
    id: "integration-hub", status: "existing", industries: "universal",
    sources: [
      "Agent A 권고: 설정 1회 후 숨김",
      "마이페이지 > 데이터 연결로 이동 권장 (Phase 2 후속)",
    ],
  },

  // 2026-05-12 Phase 2 startup-tech 신규 카드 — 30+ 실리콘밸리 자료 검증
  "cash-zero-date": {
    id: "cash-zero-date", status: "existing", industries: ["startup-tech"],
    sources: [
      "Puzzle.io Founder's Guide to Burn & Runway (절대 날짜 표시)",
      "Mercury Default Alive Calculator (Paul Graham)",
      "Bessemer State of AI 2025 (cash zero as #1 daily metric)",
    ],
  },

  // ─── 신규 카드 (Phase 2b-l 작성 예정) ──────────────────────────
  "cafe-hourly-sales": {
    id: "cafe-hourly-sales", status: "planned", industries: ["cafe-dessert"],
    sources: [
      "Square coffee shop data: 1/5 same-day 재방문",
      "페이히어 시간대별 매출 + OKPOS 시간 단위",
      "ESG Economy: 2026 카페 트렌드 원두 비용 관리",
    ],
  },
  "beauty-booking-noshow": {
    id: "beauty-booking-noshow", status: "existing", industries: ["beauty"],
    sources: [
      "카카오헤어샵: 노쇼 20% → 0.09% 사례",
      "Zenoti Service Provider Utilization Rate",
      "Meevo: 업계 평균 rebook 75%, 목표 85%",
    ],
  },
  "retail-sell-through": {
    id: "retail-sell-through", status: "existing", industries: ["retail"],
    sources: [
      "Lightspeed sell-through 5 KPI",
      "Shopify retail metrics + sell-through rate",
      "한국일보 꽃집 5월=연간 매출 1/5 (시즌 D-day)",
    ],
  },
  "ecommerce-conversion": {
    id: "ecommerce-conversion", status: "existing", industries: ["ecommerce"],
    sources: [
      "Shopify 평균 CVR 1.4%, 가이드 2.5-3%",
      "OSC 쿠팡 광고 ROAS / Sellerking",
      "Polar 평균 반품률 20-30%",
    ],
  },
  "fitness-retention": {
    id: "fitness-retention", status: "existing", industries: ["fitness"],
    sources: [
      "Mindbody Analytics 2.0 Visit Trends",
      "FIA Retention Report: 50%가 90일 내 이탈",
      "MarianaTek class utilization + 회원권 만료 D-7",
    ],
  },
  "education-enrollment": {
    id: "education-enrollment", status: "existing", industries: ["education"],
    sources: [
      "학원조아·공선학관·클래스업·에듀OK",
      "Spider Strategies Education KPI",
      "한국 학원 미수금 5-10% / 월 단위 재등록 D-14",
    ],
  },
  "pet-booking": {
    id: "pet-booking", status: "existing", industries: ["pet"],
    sources: [
      "Gingr boarding+grooming+daycare 대시보드",
      "VetPort KPI / Petfolk / DaySmart Vet",
      "펫프렌즈 재구매 85% / KPMG 반려동물 시장 보고서",
    ],
  },
  "living-service-dispatch": {
    id: "living-service-dispatch", status: "existing", industries: ["living-service"],
    sources: [
      "ServiceTitan dispatch board",
      "IBM First-Time Fix Rate (industry 80%, top 85%+)",
      "청소연구소 재구매 88% / KCA 청소대행 실태",
    ],
  },
  "space-occupancy": {
    id: "space-occupancy", status: "existing", industries: ["space"],
    sources: [
      "OfficeRnD Space Occupancy (POR)",
      "무인스터디카페 BEP 60-70% POR",
      "스페이스클라우드 호스트 대시보드",
    ],
  },
  "online-digital-metrics": {
    id: "online-digital-metrics", status: "planned", industries: ["online-digital"],
    sources: [
      "Stripe Subscription Analytics (MRR breakdown)",
      "Patreon Insights / ConvertKit metrics",
      "Geckoboard DAU/MAU stickiness",
    ],
  },
};

/**
 * 특정 업종에 default 노출할 카드 리스트 — UNIVERSAL + 업종별.
 *
 * 사장님 hide() 토글은 따로 적용 — 이 함수는 *default* 만 반환.
 */
export function getDefaultCardsForIndustry(industryId: IndustryId | undefined): readonly CardId[] {
  if (!industryId) return UNIVERSAL_ESSENTIAL_CARDS;
  const universal = UNIVERSAL_ESSENTIAL_CARDS;
  const industry = INDUSTRY_CARDS[industryId] ?? [];
  // 중복 제거 (universal 이 industry 에 포함된 경우 — 현재는 없지만 안전망)
  const set = new Set<CardId>([...universal, ...industry]);
  return Array.from(set);
}

/** 특정 카드가 특정 업종에 default 노출 여부 — Tier1_5Coaching 의 라우터 가드에서 사용 */
export function shouldShowCardByIndustry(cardId: CardId, industryId: IndustryId | undefined): boolean {
  const meta = CARD_META[cardId];
  if (!meta) return true; // 정의 안 된 카드는 기본 노출 (안전 fallback)
  if (meta.industries === "universal") return true;
  if (!industryId) return false;
  return meta.industries.includes(industryId);
}

/** 신규 카드 (Phase 2b-l 작성 예정) 목록 — 우선순위 별도 PR 계획 */
export function getPlannedCards(): readonly CardMeta[] {
  return Object.values(CARD_META).filter((m) => m.status === "planned");
}
