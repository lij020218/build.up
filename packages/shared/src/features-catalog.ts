/**
 * Features Catalog — AI 경영 코칭이 사장님께 추천할 수 있는 Found.One 서비스 기능 목록.
 *
 * 흐름:
 *  1. AI 가 todayActions / crisisActions 에 `feature` 필드로 ID 를 넣음 (예: "cashflow-hero")
 *  2. AiCoachCard UI 에서 그 feature 의 라벨을 "→ [기능 이름] 보러 가기" CTA 배지로 노출
 *  3. 클릭 시 surface 전환 + (옵션) 해당 카드 ID 로 부드러운 scroll
 *
 * 추가/제거 시:
 *  - 새 기능 추가 시: 여기에 항목 추가 → AI 가 자동으로 추천 가능
 *  - 기능 제거 시: AI 응답 검증에서 미등록 ID 는 자동으로 무시 (parseResponse 가드)
 *
 * Surface 종류 (apps/web/app/starter-stage-demo.tsx 의 SurfaceId 와 일치):
 *  home / current / franchise / profile / guides / analytics / marketing
 */

export type FeatureSurface =
  | "home"        // 운영 대시보드 (메인)
  | "current"     // 로드맵·단계별 진행
  | "franchise"   // 프랜차이즈 비교
  | "profile"     // 내 정보·연결·구독
  | "guides"      // 가이드·플레이북
  | "analytics"   // 심화 분석
  | "marketing";  // 마케팅 트렌드·캠페인

export type FeatureCatalogItem = {
  /** AI 응답에서 사용할 ID — 안정 키, 변경 금지 */
  id: string;
  /** AI 가 추천 시 표시할 라벨 (한국어) */
  labelKo: string;
  /** AI 가 추천 시 표시할 라벨 (영어) */
  labelEn: string;
  /** 어느 surface 로 이동해야 이 기능을 볼 수 있는지 */
  surface: FeatureSurface;
  /** (옵션) 이동 후 부드럽게 scroll 할 DOM ID — 없으면 surface 최상단 */
  scrollTargetId?: string;
  /** AI 가 추천 시점을 판단할 때 참고할 한 줄 설명 */
  description: string;
  /** AI 프롬프트 카탈로그 출력에 사용 — 어떤 상황에서 쓰는지 핵심 단서 */
  whenToUse: string;
};

/**
 * AI 가 추천 가능한 기능 카탈로그.
 *
 * ⚠ 새 기능 추가 시 ID 는 kebab-case + 1단어 또는 2단어 (짧을수록 토큰 절약).
 * ⚠ AI 가 헷갈리지 않도록 description / whenToUse 는 명확하게.
 */
export const FEATURES_CATALOG: FeatureCatalogItem[] = [
  // ─── 캐시플로우 / 손익 / 생존성 (가장 중요한 코어) ─────────────────
  {
    id: "cashflow-hero",
    labelKo: "캐시플로우 보러 가기",
    labelEn: "Open Cash Flow",
    surface: "home",
    scrollTargetId: "card-cashflow-hero",
    description: "14일 정산 예정 + 위기 감지 + 시나리오",
    whenToUse: "런웨이가 짧거나, 매출 하락이 현금 위기로 번질 수 있을 때. 정산 예정·자본 잔여 점검 필요할 때.",
  },
  {
    id: "pl-hero",
    labelKo: "손익 분석 보러 가기",
    labelEn: "Open P&L Analysis",
    surface: "home",
    scrollTargetId: "card-pl-hero",
    description: "월간 손익 + 추세 + 비용 항목별 분해",
    whenToUse: "비용 구조가 무너지거나, 프라임코스트가 65% 초과·재료비 급등 등 손익 진단 필요할 때.",
  },
  {
    id: "survival-board",
    labelKo: "생존지표 보러 가기",
    labelEn: "Open Survival Board",
    surface: "home",
    scrollTargetId: "card-survival-board",
    description: "런웨이 / 이자보상배수 / 한계기업 위험 등 4지표",
    whenToUse: "재무 안정성·생존 위험 점검 필요할 때.",
  },
  {
    id: "forecast",
    labelKo: "매출 예측 보러 가기",
    labelEn: "Open Revenue Forecast",
    surface: "home",
    scrollTargetId: "card-forecast",
    description: "현재 페이스 기반 다음 달 매출·현금 잔여 예상",
    whenToUse: "다음 달 매출이 불확실하거나, 계절성·이벤트 영향 추정 필요할 때.",
  },
  {
    id: "what-if-simulator",
    labelKo: "What-If 시뮬레이션 해보기",
    labelEn: "Run What-If Simulator",
    surface: "home",
    scrollTargetId: "card-whatif",
    description: "가격/비용/객수 시나리오 변경 시 손익 변화 즉시 계산",
    whenToUse: "가격 인상·메뉴 정리·인력 감축 등 큰 결정을 시뮬레이션해야 할 때.",
  },

  // ─── 첫 고객·인터뷰·성장 (Pre-PMF) ───────────────────────────────
  {
    id: "first-customers",
    labelKo: "첫 100명 플레이북 보기",
    labelEn: "Open First-100 Playbook",
    surface: "home",
    scrollTargetId: "card-first-customers",
    description: "초기 단골 50~100명 만들기 체크리스트 + 채널별 전술",
    whenToUse: "단골 부족·신규 매장·매출 0~3개월·재방문율 낮을 때.",
  },
  {
    id: "customer-interview",
    labelKo: "고객 인터뷰 작성하기",
    labelEn: "Add Customer Interview",
    surface: "home",
    scrollTargetId: "card-customer-interview",
    description: "고객 1명 인터뷰 기록 + 핵심 인사이트 정리 (3~5분)",
    whenToUse: "왜 손님이 줄었는지 모를 때, 신메뉴/가격 검증 필요할 때, 페르소나 명확화가 필요할 때.",
  },
  {
    id: "daily-improvement",
    labelKo: "오늘의 개선 과제 확인",
    labelEn: "Today's Improvement Task",
    surface: "home",
    scrollTargetId: "card-daily-improvement",
    description: "Bezos Day-1 정신 — 오늘 작은 1개 개선 실행",
    whenToUse: "정체기·매너리즘·매일 같은 운영 반복 중일 때.",
  },

  // ─── 비용·재고·인력 (운영 효율) ─────────────────────────────────
  {
    id: "cost-composition",
    labelKo: "비용 구조 보러 가기",
    labelEn: "Open Cost Composition",
    surface: "home",
    scrollTargetId: "card-cost-composition",
    description: "월 비용 8칸 도넛 — 카테고리별 비율",
    whenToUse: "비용 비율이 평균 대비 높을 때, 어디서 새는지 짚어야 할 때.",
  },
  {
    id: "inventory-ops",
    labelKo: "재고 관리 보러 가기",
    labelEn: "Open Inventory",
    surface: "home",
    scrollTargetId: "card-inventory-ops",
    description: "재고 회전 + 임계값 알림 + 폐기 로그",
    whenToUse: "재료비 급등·폐기율 높음·결품 발생·재고 회전 둔화 시.",
  },
  {
    id: "staff-ops",
    labelKo: "인건비·스케줄 보러 가기",
    labelEn: "Open Staff & Schedule",
    surface: "home",
    scrollTargetId: "card-staff-ops",
    description: "인건비 비율·시간당 매출·4대보험 자동 계산",
    whenToUse: "인건비 비율 30%+ 또는 피크타임 인력 부족·과잉 의심 시.",
  },

  // ─── 성장 / 로드맵 / 마일스톤 ────────────────────────────────────
  {
    id: "progress-milestones",
    labelKo: "성장 목표 체크",
    labelEn: "Check Growth Milestones",
    surface: "home",
    scrollTargetId: "card-progress-milestones",
    description: "성장 단계별 마일스톤 진행률 + 다음 목표",
    whenToUse: "단계별 목표 점검·다음 분기 방향성 결정 필요할 때.",
  },
  {
    id: "roadmap",
    labelKo: "로드맵 단계 확인",
    labelEn: "Open Roadmap",
    surface: "current",
    description: "전체 창업/운영 로드맵 단계별 가이드",
    whenToUse: "어떤 단계 일을 빠뜨리고 있는지·다음 무엇을 해야 할지 막막할 때.",
  },

  // ─── 외부 자료 / 매칭 ──────────────────────────────────────────
  {
    id: "support-programs",
    labelKo: "정부 지원사업 보기",
    labelEn: "Browse Support Programs",
    surface: "guides",
    description: "BIZINFO·K-Startup 매칭 정부 지원사업 리스트",
    whenToUse: "자금 필요할 때, 시설·키오스크·고용 지원 활용 가능할 때, 신청 마감 임박 시.",
  },
  {
    id: "franchise-compare",
    labelKo: "프랜차이즈 비교 보기",
    labelEn: "Compare Franchises",
    surface: "franchise",
    description: "80개 브랜드 매출·폐점률·신뢰도 + 카테고리 트렌드",
    whenToUse: "프랜차이즈 가입 검토·업종 전환 고민·동종 평균 벤치마크 필요할 때.",
  },
  {
    id: "marketing-trends",
    labelKo: "마케팅 트렌드 보기",
    labelEn: "Open Marketing Trends",
    surface: "marketing",
    description: "채널별 트렌드 + ROI + 캠페인 추천",
    whenToUse: "신규 고객 확보 채널 결정·광고 예산 배분 점검 시.",
  },

  // ─── 데이터 연결 / 자동화 ──────────────────────────────────────
  {
    id: "revenue-sync",
    labelKo: "매출 자동 연결하기",
    labelEn: "Connect Auto Revenue Sync",
    surface: "profile",
    description: "포트원·TOSS Place·CSV 업로드 — 매일 입력 자동화",
    whenToUse: "매출 기록이 빠지거나·수기 입력 부담 큼·데이터 정합성 의심 시.",
  },
  {
    id: "export-panel",
    labelKo: "데이터 내보내기",
    labelEn: "Export Data",
    surface: "home",
    scrollTargetId: "card-export-panel",
    description: "월별 손익·매출·세금 신고용 자료 PDF/CSV",
    whenToUse: "세무 신고·투자자 미팅·은행 대출 자료 준비 필요 시.",
  },
];

/** ID → 카탈로그 lookup */
export const FEATURES_BY_ID: Record<string, FeatureCatalogItem> = Object.fromEntries(
  FEATURES_CATALOG.map((f) => [f.id, f])
);

/** AI 프롬프트에 삽입할 카탈로그 텍스트 (토큰 절약을 위해 압축) */
export function getFeatureCatalogPromptText(): string {
  return FEATURES_CATALOG.map(
    (f) => `- ${f.id} (${f.labelKo}) — ${f.whenToUse}`
  ).join("\n");
}

/** AI 가 반환한 feature ID 가 카탈로그에 있는지 검증 */
export function isValidFeatureId(id: unknown): id is string {
  return typeof id === "string" && id in FEATURES_BY_ID;
}
