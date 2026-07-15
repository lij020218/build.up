/* ─────────────────────────────────────────────
 *  franchise-benchmarks.ts
 *  프랜차이즈 브랜드별 상위 매장 벤치마크 + 업종별 벤치마크
 *
 *  ⚠️ 정직성 원칙 (가짜 숫자 금지):
 *   - avgMonthlyRevenue: 공정위 가맹사업 정보공개서 '가맹점 평균매출' 기반.
 *     정보공개서는 매년 공시되며 1~2년 시차가 있음 (FRANCHISE_BENCHMARK_PROVENANCE.disclosureYear).
 *   - topStoreMonthlyRevenue: '평균 × topStoreMultiplier'로 산출한 **모델 추정치**.
 *     특정 매장의 실측 매출이 아님 → UI 에서 "상위 추정"으로 표기할 것.
 *   - isEstimate: true 인 레코드는 공개 정보공개서 매출이 없어 업계 자료로 추정한 브랜드.
 *     UI 에 "추정" 라벨을 반드시 노출.
 *   - operationalInsights: 일반적 운영 베스트프랙티스이며 개별 매장 감사 결과가 아님.
 * ───────────────────────────────────────────── */

/** 벤치마크 데이터 출처/시점 공유 메타 — UI 출처표기 SSOT */
export const FRANCHISE_BENCHMARK_PROVENANCE = {
  /** 1차 출처 */
  source: "공정거래위원회 가맹사업거래 정보공개서 · 소상공인시장진흥공단 상가업소 실태조사",
  /** 매출 데이터 기준 영업연도 (최신 공시의 시차 반영) */
  disclosureYear: 2023,
  /** 상위매장 매출이 모델 추정임을 알리는 캡션 */
  modeledNoteKo: "상위 매장 매출은 평균×배수로 산출한 추정치이며, 특정 매장의 실측이 아닙니다.",
  /** isEstimate 레코드에 붙는 사유 */
  estimateNoteKo: "공개된 정보공개서 매출이 없어 업계 자료로 추정한 값입니다.",
} as const;

export type FranchiseCostStructure = {
  ingredientRatio: number;   // % (재료비/매출)
  laborRatio: number;        // % (인건비/매출)
  rentRatio: number;         // % (임대료/매출)
  deliveryRatio?: number;    // % (배달수수료/매출)
  royaltyRatio?: number;     // % (로열티/매출)
};

export type FranchiseBenchmark = {
  brandId: string;
  avgMonthlyRevenue: number;         // 만원 — 정보공개서 가맹점 평균매출 기반
  topStoreMonthlyRevenue: number;    // 만원 — ⚠️ 평균×배수 모델 추정치 (실측 아님)
  topStoreMultiplier: number;        // 평균 대비 배수
  costStructure: FranchiseCostStructure;
  operationalInsights: string[];     // 일반 운영 베스트프랙티스 (2-3 한국어, 개별 매장 감사 아님)
  /** 데이터 기준 영업연도 (미지정 시 FRANCHISE_BENCHMARK_PROVENANCE.disclosureYear 사용) */
  yearReported?: number;
  /** true = 공개 정보공개서 매출이 없어 업계 자료로 추정 → UI "추정" 라벨 노출 필수 */
  isEstimate?: boolean;
  regionalVariance?: {
    highRegion: string;
    highAnnualRevenue: number;       // 만원
    lowRegion: string;
    lowAnnualRevenue: number;        // 만원
  };
};

export type IndustryBenchmark = {
  categoryId: string;
  avgAnnualRevenue: number;          // 만원 — 업종 평균 연매출
  top10PctRevenue: number;           // 만원 (연간) — ⚠️ 분포 추정치
  bottom10PctRevenue: number;        // 만원 (연간) — ⚠️ 분포 추정치
  keyDifferentiators: string[];      // 상위 10% 차별화 요인
  /** true = 상·하위 분포가 직접 조사값이 아닌 추정 (대부분의 업종이 해당) */
  isEstimate?: boolean;

  /**
   * avgAnnualRevenue 의 출처. **필수** — 출처 없는 숫자는 사장님께 "업종 평균" 으로 보여줄 수 없다.
   *
   *  ⚠️ 2026-07 사고: food 에 23,400(=2.34억) 이 들어 있었는데, 이는 *소상공인 전체 평균*(2022년
   *     소상공인실태조사)이지 음식점 평균이 아니었다. 실제 음식점업 평균은 1억 1,700만원
   *     (2020년 소상공인실태조사) → 2배 과대. 대시보드·AI코치·경영인사이트·사업계획서 4곳에
   *     그대로 노출돼 사장님이 자기 매출을 절반으로 착각할 수 있었다.
   *     원인은 "출처 필드가 없어 어느 표에서 온 값인지 검증 불가" 였다 → 필드로 강제한다.
   */
  source: string;
  /** avgAnnualRevenue 기준 연도. null = 출처 미상(= avgIsEstimate 여야 함). */
  yearReported: number | null;
  /**
   * true = avgAnnualRevenue 가 공식 통계가 아닌 **내부 추정**.
   *   (isEstimate 는 상·하위 *분포* 추정 여부라 별개다 — 혼동 금지)
   *   추정치는 UI·프롬프트에서 반드시 "추정" 으로 표기할 것.
   */
  avgIsEstimate?: boolean;
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
    brandId: "goobne",
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
    avgMonthlyRevenue: 1826,
    topStoreMonthlyRevenue: 4382,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 40, laborRatio: 20, rentRatio: 10, deliveryRatio: 15 },
    operationalInsights: [
      "중가 포지셔닝으로 가성비 시장 공략",
      "스노윙치킨 등 시즌 메뉴로 화제성 확보",
    ],
  },
  {
    brandId: "hosik-chicken",
    avgMonthlyRevenue: 1946,
    topStoreMonthlyRevenue: 4670,
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
    brandId: "hansot-lunchbox",
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
    brandId: "kimgane",
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
    brandId: "paiks-dabang",
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
    avgMonthlyRevenue: 2908,
    topStoreMonthlyRevenue: 9747,
    topStoreMultiplier: 3.4,
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
    brandId: "ediya-coffee",
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
    brandId: "dominos",
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
    avgMonthlyRevenue: 4917,
    topStoreMonthlyRevenue: 11801,
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

  // ── 뷰티 ──
  {
    brandId: "juno-hair",
    isEstimate: true,
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
  {
    brandId: "leekajahair",
    isEstimate: true,
    avgMonthlyRevenue: 7500,
    topStoreMonthlyRevenue: 18000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 10, laborRatio: 42, rentRatio: 13 },
    operationalInsights: [
      "30년+ 브랜드 인지도 기반 안정적 고객 확보",
      "주니어→시니어 디자이너 육성 시스템 체계화",
    ],
  },
  {
    brandId: "blue-club",
    isEstimate: true,
    avgMonthlyRevenue: 3500,
    topStoreMonthlyRevenue: 7500,
    topStoreMultiplier: 2.1,
    costStructure: { ingredientRatio: 8, laborRatio: 35, rentRatio: 10 },
    operationalInsights: [
      "저가 남성 전문 — 빠른 회전율(15분 컷) 기반 수익 모델",
      "인건비 대비 매출 효율 극대화 (1인 운영 가능)",
    ],
  },

  // ── 피트니스 ──
  {
    brandId: "anytime-fitness",
    isEstimate: true,
    avgMonthlyRevenue: 5000,
    topStoreMonthlyRevenue: 12000,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 0, laborRatio: 25, rentRatio: 20 },
    operationalInsights: [
      "24시간 무인 운영으로 인건비 최소화",
      "월 회원비 모델 — 안정적 반복 매출",
      "글로벌 브랜드 인지도 + 상호 이용 혜택",
    ],
  },
  {
    brandId: "curves",
    isEstimate: true,
    avgMonthlyRevenue: 4200,
    topStoreMonthlyRevenue: 9000,
    topStoreMultiplier: 2.1,
    costStructure: { ingredientRatio: 0, laborRatio: 30, rentRatio: 18 },
    operationalInsights: [
      "여성 전용 소규모 서킷 트레이닝 — 낮은 진입 장벽",
      "소형 매장(20평)으로 임대료 절감",
    ],
  },

  // ── 교육·펫 (2026-06-05 제거) ──
  //  eye-level(눈높이)·kumon(구몬)은 방문학습지/교습소 위탁 모델이라 "가맹점 월평균 매출" 개념이
  //  부정확하고, petbox(반려동물 구독커머스)·dogmate(펫시터 매칭 플랫폼)는 가맹사업이 아니다.
  //  이 4개는 공정위 정보공개서 기반 가맹점 평균매출이 없어 추정 수치를 가맹 벤치마크로 둘 수 없음
  //  (가짜 숫자 금지). dogmate 는 vendor-setup 의 펫시터 플랫폼으로만, kumon 은 franchise-brands.json
  //  의 가맹비/창업비용 DB 로만 유지. 매출 벤치마크에서는 제외.

  // ── 생활서비스 ──
  // 클린바스켓 제거(2026-06-05): 세탁 O2O는 직영 플랫폼(런드리고·세탁특공대)이며
  //  클린바스켓은 가맹사업이 아님. 유일한 세탁 가맹은 크린토피아(별도). "가맹점 평균매출"
  //  데이터 모델이 성립하지 않아 벤치마크에서 제외(가짜 숫자 금지).
  {
    brandId: "washnjoy",
    isEstimate: true,
    avgMonthlyRevenue: 2800,
    topStoreMonthlyRevenue: 6000,
    topStoreMultiplier: 2.1,
    costStructure: { ingredientRatio: 15, laborRatio: 5, rentRatio: 20 },
    operationalInsights: [
      "셀프빨래방 — 무인 운영으로 인건비 제로",
      "장비 투자 대비 안정적 회수 (3-4년 BEP)",
    ],
  },

  // ── 공간 ──
  {
    // toc-study-cafe → zaksim-study 매핑 + 수치 정정(2026-06-05): 기존 월 5,000만은 과대.
    //  작심 정보공개서 기준 가맹점 평균 연 1.04억(월 약 867만). 카탈로그 zaksim-study와 일치.
    brandId: "zaksim-study",
    avgMonthlyRevenue: 1125,
    topStoreMonthlyRevenue: 2700,
    topStoreMultiplier: 2.4,
    costStructure: { ingredientRatio: 5, laborRatio: 15, rentRatio: 25 },
    operationalInsights: [
      "무인 픽코(Pickko) 시스템 — 출입·예약·결제·회원 전과정 무인화로 인건비 최소",
      "성인 이용 80% — 자격증·입시·업무 장기 수요로 매출 안정성 확보",
    ],
  },
  {
    brandId: "friends-screen",
    isEstimate: true,
    avgMonthlyRevenue: 6000,
    topStoreMonthlyRevenue: 14000,
    topStoreMultiplier: 2.3,
    costStructure: { ingredientRatio: 8, laborRatio: 15, rentRatio: 22 },
    operationalInsights: [
      "스크린골프 + F&B 복합 매출 모델",
      "시뮬레이터 장비 고정비 대비 높은 시간당 매출",
    ],
  },
];

// ─── 업종별 벤치마크 ──────────────────────────────────────

const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  {
    categoryId: "food",
    // ⚠️ 2026-07 정정: 종전 23400(2.34억) — 주석이 "소상공인 *전체* 평균" 이라고 스스로 밝히고
    //   있었는데 그 값이 food 칸에 들어가 있었다(2022년 소상공인실태조사 전체 평균).
    //   실제 음식점업 사업체당 평균은 1억 1,700만원(2020년 소상공인실태조사) → 2배 과대였다.
    //   교차검증: 음식점 창업비용이 소상공인실태조사 9,800만원 ↔ 한식진흥원 1억436만원으로 정합.
    avgAnnualRevenue: 11700,
    // ⚠️ 아래 분포는 잘못된 평균(2.34억) 기준으로 잡힌 값이라 정정된 평균과 모순된다
    //   (하위10% 1억 ≈ 평균 1.17억). 공식 분포 통계를 못 찾아 임의로 지어내지 않고 그대로 두고
    //   avgIsEstimate 와 별개로 isEstimate: true 로 표시한다. 공식 분포 확보 시 교체할 것.
    top10PctRevenue: 70000,
    bottom10PctRevenue: 10000,
    isEstimate: true,
    keyDifferentiators: [
      "메뉴 특화 (3-5개 시그니처)와 빠른 회전율",
      "식재료 원가 33% 이하 관리 (공급처 3곳+ 비교)",
      "배달앱 리뷰 관리 (평점 4.5 이상 유지)",
      "시간대별 매출 분석을 통한 인력 배치 최적화",
    ],
    source: "중소벤처기업부·통계청 소상공인실태조사 — 음식점업 사업체당 평균 매출(1억 1,700만원)",
    yearReported: 2020,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
    source: "내부 추정 — 공식 통계 미확인(2026-07 감사에서 출처 없음 확인)",
    yearReported: null,
    avgIsEstimate: true,
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
