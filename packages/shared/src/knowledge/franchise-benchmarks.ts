/* ─────────────────────────────────────────────
 *  franchise-benchmarks.ts
 *  프랜차이즈 브랜드별 상위 매장 벤치마크 + 업종별 벤치마크
 *  Data sources: 2024-2025 정보공개서, 한국경제, 헤럴드경제, 마이프차
 * ───────────────────────────────────────────── */

export type FranchiseCostStructure = {
  ingredientRatio: number;   // % (재료비/매출)
  laborRatio: number;        // % (인건비/매출)
  rentRatio: number;         // % (임대료/매출)
  deliveryRatio?: number;    // % (배달수수료/매출)
  royaltyRatio?: number;     // % (로열티/매출)
};

export type FranchiseBenchmark = {
  brandId: string;
  avgMonthlyRevenue: number;         // 만원
  topStoreMonthlyRevenue: number;    // 만원
  topStoreMultiplier: number;        // 평균 대비 배수
  costStructure: FranchiseCostStructure;
  operationalInsights: string[];     // 상위 매장 비결 (2-3 한국어)
  regionalVariance?: {
    highRegion: string;
    highAnnualRevenue: number;       // 만원
    lowRegion: string;
    lowAnnualRevenue: number;        // 만원
  };
};

export type IndustryBenchmark = {
  categoryId: string;
  avgAnnualRevenue: number;          // 만원
  top10PctRevenue: number;           // 만원 (연간)
  bottom10PctRevenue: number;        // 만원 (연간)
  keyDifferentiators: string[];      // 상위 10% 차별화 요인
};

// ─── 브랜드별 벤치마크 ──────────────────────────────────────

const FRANCHISE_BENCHMARKS: FranchiseBenchmark[] = [
  // ── 치킨 ──
  {
    brandId: "kyochon-chicken",
    avgMonthlyRevenue: 5783,
    topStoreMonthlyRevenue: 14000,
    topStoreMultiplier: 2.5,
    costStructure: { ingredientRatio: 38, laborRatio: 22, rentRatio: 10, deliveryRatio: 15, royaltyRatio: 2.5 },
    operationalInsights: [
      "프리미엄 포지셔닝으로 객단가 극대화 — 업계 최고 객단가",
      "매장 청결도·서비스 품질 관리 철저 (본사 미스터리 쇼퍼)",
      "배달과 홀 매출 비율 최적화 (6:4 배달 우세 지역에서 강세)",
    ],
    regionalVariance: { highRegion: "서울", highAnnualRevenue: 89300, lowRegion: "제주/경남", lowAnnualRevenue: 40000 },
  },
  {
    brandId: "bhc",
    avgMonthlyRevenue: 4558,
    topStoreMonthlyRevenue: 11000,
    topStoreMultiplier: 2.5,
    costStructure: { ingredientRatio: 40, laborRatio: 20, rentRatio: 10, deliveryRatio: 15, royaltyRatio: 2 },
    operationalInsights: [
      "뿌링클 등 차별화 메뉴로 MZ세대 고객 확보",
      "배달앱 상위노출 전략 (리뷰 관리 + 프로모션 타이밍)",
      "시간대별 프로모션으로 비피크타임 매출 보완",
    ],
  },
  {
    brandId: "bbq",
    avgMonthlyRevenue: 4142,
    topStoreMonthlyRevenue: 12000,
    topStoreMultiplier: 3.0,
    costStructure: { ingredientRatio: 42, laborRatio: 18, rentRatio: 10, deliveryRatio: 17, royaltyRatio: 2 },
    operationalInsights: [
      "배달 비중 극대화 (주거밀집 상권에서 배달 70%+)",
      "올리브 오일 프리미엄 이미지 활용한 가격 전략",
      "배달앱 3사(배민/쿠팡이츠/요기요) 동시 운영으로 노출 극대화",
    ],
  },
  {
    brandId: "goobne-chicken",
    avgMonthlyRevenue: 4108,
    topStoreMonthlyRevenue: 10000,
    topStoreMultiplier: 2.5,
    costStructure: { ingredientRatio: 36, laborRatio: 20, rentRatio: 10, deliveryRatio: 15 },
    operationalInsights: [
      "오븐구이 차별화로 건강 트렌드 고객 확보",
      "재료비 비율이 타 브랜드보다 낮아 마진율 우수",
    ],
  },
  {
    brandId: "nene-chicken",
    avgMonthlyRevenue: 2917,
    topStoreMonthlyRevenue: 7000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 40, laborRatio: 20, rentRatio: 10, deliveryRatio: 15 },
    operationalInsights: [
      "중가 포지셔닝으로 가성비 시장 공략",
      "스노윙치킨 등 시즌 메뉴로 화제성 확보",
    ],
  },
  {
    brandId: "hosik-two-chicken",
    avgMonthlyRevenue: 2500,
    topStoreMonthlyRevenue: 6000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 45, laborRatio: 18, rentRatio: 10, deliveryRatio: 15 },
    operationalInsights: [
      "두마리 전략으로 가격 대비 양 극대화",
      "저가 시장에서의 가격 리더십 유지",
    ],
  },

  // ── 버거/패스트푸드 ──
  {
    brandId: "moms-touch",
    avgMonthlyRevenue: 5083,
    topStoreMonthlyRevenue: 20600,
    topStoreMultiplier: 4.0,
    costStructure: { ingredientRatio: 48, laborRatio: 18, rentRatio: 7.2, deliveryRatio: 15, royaltyRatio: 2.2 },
    operationalInsights: [
      "상권 리로케이션으로 매출 평균 265% 증가 (목동점 786%)",
      "시간대별 메뉴 전략: 점심 버거 → 저녁 치킨으로 매출 보완",
      "학원가·주거밀집 상권에서 배달 비중 극대화",
    ],
    regionalVariance: { highRegion: "서울", highAnnualRevenue: 68600, lowRegion: "울산/경남", lowAnnualRevenue: 30000 },
  },
  {
    brandId: "lotteria",
    avgMonthlyRevenue: 4458,
    topStoreMonthlyRevenue: 10000,
    topStoreMultiplier: 2.2,
    costStructure: { ingredientRatio: 42, laborRatio: 22, rentRatio: 10, deliveryRatio: 12 },
    operationalInsights: [
      "전국 최다 매장망 활용한 접근성 우위",
      "로컬 메뉴(불고기버거) 기반 충성 고객 확보",
    ],
  },

  // ── 한식 ──
  {
    brandId: "hansot",
    avgMonthlyRevenue: 3841,
    topStoreMonthlyRevenue: 9000,
    topStoreMultiplier: 2.3,
    costStructure: { ingredientRatio: 40, laborRatio: 20, rentRatio: 8, deliveryRatio: 12 },
    operationalInsights: [
      "평당매출 한식 1위 — 소형 매장 고효율 운영",
      "5년 이상 운영 가맹점 80% — 안정적 수익 구조",
      "도시락 + 매장 식사 + 배달 3채널 매출 분산",
    ],
  },
  {
    brandId: "bonjuk-bibimbap",
    avgMonthlyRevenue: 3258,
    topStoreMonthlyRevenue: 7500,
    topStoreMultiplier: 2.3,
    costStructure: { ingredientRatio: 35, laborRatio: 22, rentRatio: 10 },
    operationalInsights: [
      "본죽 대비 1.5배 매출 — 비빔밥 추가로 점심 매출 보완",
      "식재료 원가 관리 용이 (죽+비빔밥 재료 공유)",
    ],
  },
  {
    brandId: "gimgane",
    avgMonthlyRevenue: 3175,
    topStoreMonthlyRevenue: 7000,
    topStoreMultiplier: 2.2,
    costStructure: { ingredientRatio: 38, laborRatio: 22, rentRatio: 10, deliveryRatio: 12 },
    operationalInsights: [
      "김밥 프랜차이즈 매출 1위 — 메뉴 다양성 차별화",
      "오피스가·학원가에서 점심 집중 매출",
    ],
  },
  {
    brandId: "bonjuk",
    avgMonthlyRevenue: 2367,
    topStoreMonthlyRevenue: 5500,
    topStoreMultiplier: 2.3,
    costStructure: { ingredientRatio: 32, laborRatio: 25, rentRatio: 12 },
    operationalInsights: [
      "죽 전문점 특성상 아침·환자식 시장 안정적",
      "재료비 비율 낮지만 객단가도 낮아 회전율이 핵심",
    ],
  },

  // ── 카페/디저트 ──
  {
    brandId: "twosome-place",
    avgMonthlyRevenue: 4350,
    topStoreMonthlyRevenue: 10000,
    topStoreMultiplier: 2.3,
    costStructure: { ingredientRatio: 35, laborRatio: 30, rentRatio: 12 },
    operationalInsights: [
      "프리미엄 디저트 매출 비중 40%+ → 객단가 극대화",
      "넓은 매장 면적 활용한 체류시간·추가 주문 유도",
      "케이크 사전주문 시스템으로 폐기율 최소화",
    ],
  },
  {
    brandId: "hollys",
    avgMonthlyRevenue: 3000,
    topStoreMonthlyRevenue: 7000,
    topStoreMultiplier: 2.3,
    costStructure: { ingredientRatio: 33, laborRatio: 30, rentRatio: 13 },
    operationalInsights: [
      "프리미엄 인테리어로 체류형 고객 확보",
      "브런치·디저트 메뉴 비중 확대로 객단가 향상",
    ],
  },
  {
    brandId: "baskin-robbins",
    avgMonthlyRevenue: 2500,
    topStoreMonthlyRevenue: 6000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 40, laborRatio: 25, rentRatio: 12 },
    operationalInsights: [
      "시즌 한정 메뉴(아이스크림 케이크)로 이벤트 수요 흡수",
      "여름 성수기 대비 겨울 비수기 전략(핫초코 등)이 관건",
    ],
  },
  {
    brandId: "paik-dabang",
    avgMonthlyRevenue: 2417,
    topStoreMonthlyRevenue: 6000,
    topStoreMultiplier: 2.5,
    costStructure: { ingredientRatio: 30, laborRatio: 25, rentRatio: 10 },
    operationalInsights: [
      "저가 커피 중 가맹점 매출 1위 — 백종원 브랜드 파워",
      "원가율 30%로 저가 대비 마진 우수",
      "소형 매장 테이크아웃 중심 운영으로 임대료 비중 낮음",
    ],
  },
  {
    brandId: "mega-coffee",
    avgMonthlyRevenue: 2383,
    topStoreMonthlyRevenue: 6000,
    topStoreMultiplier: 2.5,
    costStructure: { ingredientRatio: 32, laborRatio: 25, rentRatio: 10 },
    operationalInsights: [
      "매장 수 3,038개 전국 1위 — 브랜드 인지도 급성장",
      "대용량 음료로 가성비 이미지 + 객단가 유지",
      "본사 영업이익 업계 1위 — 안정적 지원 체계",
    ],
  },
  {
    brandId: "compose-coffee",
    avgMonthlyRevenue: 2042,
    topStoreMonthlyRevenue: 5000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 30, laborRatio: 22, rentRatio: 8 },
    operationalInsights: [
      "면적당 효율 저가 커피 1위 — 초소형 매장 극한 효율",
      "1인 운영 최적화 설계로 인건비 최소화",
      "로열티 0원, 원두 직매입 체계로 가맹점 부담 최소",
    ],
  },
  {
    brandId: "ediya",
    avgMonthlyRevenue: 1558,
    topStoreMonthlyRevenue: 4000,
    topStoreMultiplier: 2.6,
    costStructure: { ingredientRatio: 35, laborRatio: 28, rentRatio: 12 },
    operationalInsights: [
      "1세대 카페 브랜드 — 충성 고객 기반 안정적",
      "면적당 매출이 낮아 소형화·테이크아웃 전환이 관건",
    ],
  },

  // ── 베이커리 ──
  {
    brandId: "paris-baguette",
    avgMonthlyRevenue: 6250,
    topStoreMonthlyRevenue: 15000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 45, laborRatio: 20, rentRatio: 10, royaltyRatio: 1.5 },
    operationalInsights: [
      "업종 평균(3.4억)의 2배+ — 베이커리 압도적 1위",
      "시간대별 상품 구성: 아침 식빵·샌드위치 → 오후 케이크·선물",
      "시즌 이벤트(발렌타인, 크리스마스) 매출 비중 15%+",
    ],
  },
  {
    brandId: "tous-les-jours",
    avgMonthlyRevenue: 4308,
    topStoreMonthlyRevenue: 10000,
    topStoreMultiplier: 2.3,
    costStructure: { ingredientRatio: 43, laborRatio: 22, rentRatio: 10 },
    operationalInsights: [
      "해외 매출 30%+ 성장 — 글로벌 브랜드 가치",
      "빵+카페 복합 매장으로 체류시간 증가",
    ],
  },

  // ── 피자 ──
  {
    brandId: "dominos-pizza",
    avgMonthlyRevenue: 6242,
    topStoreMonthlyRevenue: 15000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 35, laborRatio: 25, rentRatio: 8, deliveryRatio: 10 },
    operationalInsights: [
      "피자 매출 효율 1위 — 배달 시스템 최적화",
      "자체 배달 앱 비중 높여 수수료 절감",
      "시간 보장 프로모션으로 배달 수요 집중",
    ],
  },
  {
    brandId: "papa-johns",
    avgMonthlyRevenue: 3333,
    topStoreMonthlyRevenue: 8000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 38, laborRatio: 22, rentRatio: 10, deliveryRatio: 12 },
    operationalInsights: [
      "6년 연속 매출 확대 — 프리미엄 재료 전략 성공",
      "NFL 등 스포츠 마케팅 기반 브랜드 인지도",
    ],
  },

  // ── 편의점 ──
  {
    brandId: "gs25",
    avgMonthlyRevenue: 5383,
    topStoreMonthlyRevenue: 12000,
    topStoreMultiplier: 2.2,
    costStructure: { ingredientRatio: 54.3, laborRatio: 15, rentRatio: 10 },
    operationalInsights: [
      "전국 평균매출 1위 — 마진율 45.7%",
      "PB 상품 비중 확대로 마진 극대화",
      "심야 매출 비중이 높은 매장은 무인화 도입 검토",
    ],
    regionalVariance: { highRegion: "서울", highAnnualRevenue: 74200, lowRegion: "전남", lowAnnualRevenue: 42000 },
  },
  {
    brandId: "cu",
    avgMonthlyRevenue: 5233,
    topStoreMonthlyRevenue: 12000,
    topStoreMultiplier: 2.3,
    costStructure: { ingredientRatio: 53, laborRatio: 15, rentRatio: 10 },
    operationalInsights: [
      "점포 수 전국 1위 — 서울 매출 GS25 역전",
      "택배·ATM 등 부가서비스 매출 비중 확대",
    ],
    regionalVariance: { highRegion: "서울", highAnnualRevenue: 74600, lowRegion: "경남", lowAnnualRevenue: 40000 },
  },

  // ── 뷰티/피트니스 ──
  {
    brandId: "juno-hair",
    avgMonthlyRevenue: 10417,
    topStoreMonthlyRevenue: 25000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 12, laborRatio: 45, rentRatio: 12 },
    operationalInsights: [
      "프리미엄 미용 최상위 — 디자이너 개인 역량이 핵심",
      "VIP 멤버십 기반 단골 재방문율 관리",
      "스타일리스트 교육·리텐션이 매출 직결",
    ],
  },
];

// ─── 업종별 벤치마크 ──────────────────────────────────────

const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  {
    categoryId: "food",
    avgAnnualRevenue: 23400,   // 소상공인 전체 평균 2.34억
    top10PctRevenue: 70000,    // 상위 10% 약 7억+
    bottom10PctRevenue: 10000,
    keyDifferentiators: [
      "메뉴 특화 (3-5개 시그니처)와 빠른 회전율",
      "식재료 원가 33% 이하 관리 (공급처 3곳+ 비교)",
      "배달앱 리뷰 관리 (평점 4.5 이상 유지)",
      "시간대별 매출 분석을 통한 인력 배치 최적화",
    ],
  },
  {
    categoryId: "cafe-dessert",
    avgAnnualRevenue: 18000,
    top10PctRevenue: 55000,
    bottom10PctRevenue: 8000,
    keyDifferentiators: [
      "테이크아웃 비중 60%+ 매장은 소형화로 임대료 절감",
      "디저트·브런치 추가로 객단가 1.5배 향상",
      "SNS 마케팅 (인스타 주 3회+)으로 신규 유입",
      "원두 직접 로스팅 또는 스페셜티로 차별화",
    ],
  },
  {
    categoryId: "retail",
    avgAnnualRevenue: 52000,
    top10PctRevenue: 130000,
    bottom10PctRevenue: 20000,
    keyDifferentiators: [
      "재고 회전율 월 6-8회 유지 (데드스톡 월 1회 정리)",
      "온·오프라인 동시 판매 (네이버 스마트스토어 병행)",
      "PB 상품 비중 확대로 마진 10%p 향상",
      "시즌 상품 선제 입고 (2개월 전 준비)",
    ],
  },
  {
    categoryId: "beauty",
    avgAnnualRevenue: 25000,
    top10PctRevenue: 75000,
    bottom10PctRevenue: 10000,
    keyDifferentiators: [
      "예약 충전율 80%+ 유지 (빈 시간대 프로모션)",
      "단골 재방문율 40% 이상 (멤버십·리마인드 메시지)",
      "시술 메뉴 가격 분석 — 고마진 시술 비중 확대",
      "인스타 비포/애프터 포트폴리오 운영",
    ],
  },
  {
    categoryId: "fitness",
    avgAnnualRevenue: 20000,
    top10PctRevenue: 60000,
    bottom10PctRevenue: 8000,
    keyDifferentiators: [
      "회원 리텐션율 60%+ (3개월 이상 유지)",
      "PT 매출 비중 50%+ — 트레이너 역량이 핵심",
      "비수기(여름 후, 연말) 프로모션으로 이탈 방지",
      "소규모 그룹 수업으로 효율 극대화",
    ],
  },
  {
    categoryId: "education",
    avgAnnualRevenue: 22000,
    top10PctRevenue: 65000,
    bottom10PctRevenue: 9000,
    keyDifferentiators: [
      "수강생 유지율 70%+ (학부모 만족도 관리)",
      "입시 실적·수상 실적 기반 브랜딩",
      "온·오프 하이브리드 수업으로 지역 제한 극복",
      "방학 특강·캠프로 비수기 매출 보완",
    ],
  },
  {
    categoryId: "pet",
    avgAnnualRevenue: 20000,
    top10PctRevenue: 60000,
    bottom10PctRevenue: 8000,
    keyDifferentiators: [
      "반려동물 1인 가구 증가에 따른 프리미엄 수요",
      "미용+용품+호텔 복합 서비스로 객단가 극대화",
      "SNS 귀여운 콘텐츠로 바이럴 마케팅",
    ],
  },
  {
    categoryId: "living-service",
    avgAnnualRevenue: 18000,
    top10PctRevenue: 50000,
    bottom10PctRevenue: 7000,
    keyDifferentiators: [
      "단골 기반 안정적 반복 매출 (세탁·수선 등)",
      "무인 매장(셀프빨래방)으로 인건비 제로 모델",
      "지역 커뮤니티 기반 입소문 마케팅",
    ],
  },
  {
    categoryId: "space",
    avgAnnualRevenue: 24000,
    top10PctRevenue: 70000,
    bottom10PctRevenue: 10000,
    keyDifferentiators: [
      "플랫폼(에어비앤비/야놀자) 노출 최적화",
      "인테리어·사진 품질이 예약 전환율 직결",
      "비수기 장기 할인 + 성수기 프리미엄 가격 전략",
    ],
  },
  {
    categoryId: "online-digital",
    avgAnnualRevenue: 30000,
    top10PctRevenue: 100000,
    bottom10PctRevenue: 8000,
    keyDifferentiators: [
      "광고비 대비 ROAS 300%+ 유지",
      "상품 사진·상세페이지 품질이 전환율 직결",
      "리뷰 100개+ 확보 후 매출 급증 패턴",
      "네이버/쿠팡/자사몰 3채널 동시 운영",
    ],
  },
  {
    categoryId: "startup-tech",
    avgAnnualRevenue: 0,  // 스타트업은 매출 기준이 아님
    top10PctRevenue: 0,
    bottom10PctRevenue: 0,
    keyDifferentiators: [
      "PMF 달성 후 MoM 성장률 15%+ 유지",
      "런웨이 12개월+ 확보 (시드 5-10억, 시리즈A 20-50억)",
      "핵심 지표(North Star Metric) 1개에 집중",
      "고객 인터뷰 주 5회+ — 제품 시장 적합성 검증",
    ],
  },
];

// ─── 조회 함수 ──────────────────────────────────────

const benchmarkMap = new Map<string, FranchiseBenchmark>();
for (const b of FRANCHISE_BENCHMARKS) benchmarkMap.set(b.brandId, b);

const industryMap = new Map<string, IndustryBenchmark>();
for (const b of INDUSTRY_BENCHMARKS) industryMap.set(b.categoryId, b);

export function getFranchiseBenchmark(brandId: string): FranchiseBenchmark | undefined {
  return benchmarkMap.get(brandId);
}

export function getIndustryBenchmark(categoryId: string): IndustryBenchmark | undefined {
  return industryMap.get(categoryId);
}

export function getAllFranchiseBenchmarks(): FranchiseBenchmark[] {
  return FRANCHISE_BENCHMARKS;
}

export function getAllIndustryBenchmarks(): IndustryBenchmark[] {
  return INDUSTRY_BENCHMARKS;
}
