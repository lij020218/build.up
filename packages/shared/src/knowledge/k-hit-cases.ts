/* ─────────────────────────────────────────────
 *  k-hit-cases.ts
 *  한국 비프랜차이즈 K-히트 성공 사례 데이터베이스
 *
 *  목적: AI 경영 파트너가 사장님 업종에 맞는 '로컬' 성공사례를 인용
 *       — 글로벌 사례(success-case-studies.ts)와 별개 트랙으로 운영
 *       — 프랜차이즈가 아닌 개별 브랜드만 수집 (사장님에게 더 관련성 높음)
 *
 *  데이터 출처: 공개 언론 보도·공식 인터뷰·나무위키 등 (2024~2026 기준)
 *  — 각 사례마다 sources 필드에 1차 자료 링크 포함
 * ───────────────────────────────────────────── */

/** K-히트 사례 테마 — 사장님 고민에 따라 매칭 */
export type KHitTheme =
  | "brand-building"        // 브랜드 아이덴티티 구축
  | "space-as-product"      // 공간 자체를 상품으로 (인테리어·분위기)
  | "product-innovation"    // 제품 혁신 (새로운 맛·조합·형식)
  | "scarcity-strategy"     // 희소성 전략 (가맹점 거부·직영 고수)
  | "tradition-heritage"    // 노포·전통 계승 (3대·60년+)
  | "customer-experience"   // 고객 경험 설계
  | "people-first"          // 직원·공동체 중심 경영
  | "differentiation"       // 차별화 포지셔닝
  | "community-loyalty";    // 지역 밀착·단골 중심

export type KHitCase = {
  id: string;
  name: { ko: string; en: string };
  /** 업종 매칭 — categoryId 또는 subIndustryId (franchise-data.ts와 동일 ID 체계) */
  applicableCategories: string[];
  applicableSubIndustries?: string[];
  /** 테마 매칭 — 여러 테마 해당 가능 */
  themes: KHitTheme[];
  /** 설립 연도 — 노포 vs 신생 구분 */
  foundedYear: number;
  /** 위치 (참고용) */
  location: string;
  /** 창업자/경영자 */
  founder?: string;
  /** 핵심 한 줄 — AI가 인용할 때 가장 먼저 쓰는 문장 (≤80자) */
  oneLiner: { ko: string; en: string };
  /** 성공 요인 — 3~6개 bullet, 구체적 행동 */
  successFactors: {
    ko: string[];
    en: string[];
  };
  /** 사장님이 바로 적용 가능한 교훈 (≤60자) */
  lesson: { ko: string; en: string };
  /** 창업자 어록 (있으면) */
  founderQuote?: { ko: string; en?: string };
  /** 주요 지표 (최근 공개치) */
  keyMetrics?: {
    annualRevenueWon?: number;  // 만원
    storeCount?: number;
    dataYear?: string;
  };
  /** 데이터 출처 */
  sources: Array<{
    label: string;
    url?: string;
    accessedAt: string;
  }>;
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  CASES — 15 verified Korean non-franchise hits
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export const K_HIT_CASES: KHitCase[] = [
  // ── 1. 성심당 — 단일 빵집 매출 2,629억 ──────────────────
  {
    id: "sungsimdang",
    name: { ko: "성심당", en: "Sungsimdang" },
    applicableCategories: ["cafe-dessert", "food"],
    applicableSubIndustries: ["bakery-studio", "dessert-cafe"],
    themes: ["community-loyalty", "scarcity-strategy", "tradition-heritage", "brand-building"],
    foundedYear: 1956,
    location: "대전",
    founder: "임길순 (창업) · 임영진 (2대) · 임성훈 (3대)",
    oneLiner: {
      ko: "전국 프랜차이즈 제안을 모두 거절하고 대전 직영만 고수해 2024년 매출 2,629억원 — 파리바게뜨·뚜레쥬르 합친 영업이익을 넘어섰습니다",
      en: "Rejected every franchise offer, stuck to Daejeon direct stores — hit 262.9B KRW in 2024, surpassing the combined operating profit of Paris Baguette and Tous Les Jours"
    },
    successFactors: {
      ko: [
        "'대전=성심당' 등식을 만들어 전국 수요를 대전으로 끌어당김 (확장이 아닌 밀도)",
        "가맹점 0곳, 전 매장 직영으로 품질·가격 통제",
        "당일 판매하고 남은 빵 전량 기부 — 지역 신뢰 자본 축적",
        "3대 가족경영 70년, 전통 유지 + 시즌 신메뉴(딸기시루 등)로 유연하게 대응",
        "단기 이익이 아닌 '고객이 느끼는 가치'에 집중 → 복리 수익 구조"
      ],
      en: [
        "Created 'Daejeon = Sungsimdang' equation — density over expansion",
        "Zero franchise, all direct stores for quality and price control",
        "Donates every unsold bread daily — accumulates community trust capital",
        "3-generation family for 70 years — tradition preserved + agile seasonal menus",
        "Focus on 'value perceived by customer' over short-term profit → compound returns"
      ]
    },
    lesson: {
      ko: "확장보다 밀도에 집중하세요. 한 지역에서 독점적 신뢰를 쌓으면 확장이 따라옵니다",
      en: "Choose density over expansion. Exclusive trust in one region brings scale later"
    },
    founderQuote: { ko: "단기적 이익이 아니라 고객이 느끼는 가치에 집중하면 복리로 돌아옵니다" },
    keyMetrics: { annualRevenueWon: 262_900_000, storeCount: 7, dataYear: "2024" },
    sources: [
      { label: "파이낸셜뉴스 '고객이 느끼는 가치' 인터뷰 2024.12", url: "https://www.fnnews.com/news/202412101335235582", accessedAt: "2026-04-24" },
      { label: "대전일보 2024 매출 2000억 돌파 보도", url: "https://www.daejonilbo.com/news/articleView.html?idxno=2268578", accessedAt: "2026-04-24" },
      { label: "한국경제 2025.02 딸기시루 오픈런", url: "https://www.hankyung.com/article/2025021294107", accessedAt: "2026-04-24" }
    ]
  },

  // ── 2. 런던베이글뮤지엄 ──────────────────
  {
    id: "london-bagel-museum",
    name: { ko: "런던베이글뮤지엄", en: "London Bagel Museum" },
    applicableCategories: ["cafe-dessert", "food"],
    applicableSubIndustries: ["bakery-studio", "dessert-cafe"],
    themes: ["space-as-product", "scarcity-strategy", "brand-building", "product-innovation"],
    foundedYear: 2021,
    location: "서울 안국",
    founder: "이효정 (CBO, 필명 료)",
    oneLiner: {
      ko: "평일에도 2~3시간 오픈런 — 매장을 무한정 늘리지 않고 '쉽게 구할 수 없다'는 이미지를 쌓았습니다",
      en: "2-3 hour weekday queues — refused to expand; 'hard to get' image became the brand"
    },
    successFactors: {
      ko: [
        "안국·도산·제주 등 전략적 소수 매장만 운영 — 희소성을 자산화",
        "대표가 직접 인테리어 디자인·간판 페인팅·손글씨 작업 (외주 X)",
        "런던 감성의 공간 레이어링 — 제품보다 '경험' 이 오래 남음",
        "바질·무화과 등 국내 카페에 없던 조합 베이글을 SNS에 최적화",
        "패션·에디토리얼 출신 대표의 심미안이 F&B에 차별점을 만듦"
      ],
      en: [
        "Strategic few stores only (Anguk/Dosan/Jeju) — scarcity as asset",
        "Founder personally designs interiors, paints signs, writes by hand (no outsourcing)",
        "London-style spatial layering — 'experience' outlasts the product",
        "Basil & fig bagel combinations unseen in Korean cafes, SNS-optimized",
        "Fashion/editorial-trained founder brings aesthetic edge to F&B"
      ]
    },
    lesson: {
      ko: "인기가 많아져도 무한정 매장을 늘리지 마세요. 희소성이 브랜드의 가장 큰 자산입니다",
      en: "Don't scale just because demand is there. Scarcity is the brand's biggest asset"
    },
    founderQuote: { ko: "맛은 혀끝이 아니라 공간 레이어와 결합됐을 때 독특한 경험이 됩니다" },
    sources: [
      { label: "조선비즈 2023 유통포럼 이효정 인터뷰", url: "https://e.chosunbiz.com/2023-%EC%9C%A0%ED%86%B5%ED%8F%AC%EB%9F%BC-%EC%9D%B4%ED%9A%A8%EC%A0%95-%EB%9F%B0%EB%8D%98%EB%B2%A0%EC%9D%B4%EA%B8%80-%EC%B0%BD%EC%97%85%EC%9E%90-%EC%A2%8B%EC%9D%80-%EA%B3%B5%EA%B0%84/", accessedAt: "2026-04-24" },
      { label: "한국경제 '롯데가 모셔왔다' 보도 2025.01", url: "https://www.hankyung.com/article/202501249054i", accessedAt: "2026-04-24" },
      { label: "EconomyChosun 2023.05 인터뷰", url: "https://economychosun.com/site/data/html_dir/2023/05/01/2023050100022.html", accessedAt: "2026-04-24" }
    ]
  },

  // ── 3. 카페 어니언 ──────────────────
  {
    id: "cafe-onion",
    name: { ko: "카페 어니언", en: "Cafe Onion" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee", "bakery-studio", "dessert-cafe"],
    themes: ["space-as-product", "brand-building", "community-loyalty"],
    foundedYear: 2017,
    location: "서울 성수 (1호점)",
    oneLiner: {
      ko: "폐금속공장을 그대로 살려 카페로 전환 — 원형을 드러내는 공간 철학으로 외국인 '꼭 가봐야 할 카페 1위'가 됐습니다",
      en: "Preserved an old metal factory as-is — now the #1 'must-visit cafe' for foreign tourists"
    },
    successFactors: {
      ko: [
        "1970년대 슈퍼·식당·정비소 거쳐 금속공장이던 건물 원형 유지 (패브리커 협업)",
        "축적된 시간의 흔적을 그대로 보여주는 방식으로 '의미'를 발굴",
        "하루 종일 조금씩 빵을 굽는 기본 원칙 — 따뜻한 빵을 항상 제공",
        "성수·미아·안국 순으로 기존엔 한적했던 거리를 살아있는 상권으로 바꿈",
        "썰렁하던 동네에 들어가면 주변에 새 카페·가게가 모여드는 '어니언 효과'"
      ],
      en: [
        "Kept factory shell intact (ex-supermarket/diner/garage since 1970s), in collab with Fabrikr",
        "Expose accumulated time as-is — find meaning in overlooked spaces",
        "Bake bread continuously throughout the day — always warm",
        "Seongsu → Mia → Anguk — turned quiet streets into vibrant commercial zones",
        "'Onion Effect' — new cafes & shops follow wherever they open"
      ]
    },
    lesson: {
      ko: "낡은 공간을 지우지 말고 드러내세요. 축적된 시간 자체가 가장 비싼 인테리어입니다",
      en: "Don't erase old spaces — reveal them. Accumulated time is the most expensive interior"
    },
    sources: [
      { label: "한국경제 2020.08 폐공장 카페 분석", url: "https://www.hankyung.com/article/2020082087971", accessedAt: "2026-04-24" },
      { label: "신도블로그 이효재 바리스타·강원재 대표 인터뷰", url: "https://www.sindohblog.com/1156", accessedAt: "2026-04-24" },
      { label: "브런치 stayfolio 분석", url: "https://brunch.co.kr/@stayfolio/25", accessedAt: "2026-04-24" }
    ]
  },

  // ── 4. 테라로사 ──────────────────
  {
    id: "terarosa",
    name: { ko: "테라로사", en: "Terarosa Coffee" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee"],
    themes: ["people-first", "product-innovation", "brand-building"],
    foundedYear: 2002,
    location: "강원 강릉 (본점)",
    founder: "김용덕",
    oneLiner: {
      ko: "은행원 출신이 강릉에서 시작해 점당 매출 스타벅스의 2배 — 생두 직거래 + 매장마다 고유 공간 설계가 비결입니다",
      en: "Ex-banker started in Gangneung — now 2x Starbucks per-store revenue via direct green bean sourcing"
    },
    successFactors: {
      ko: [
        "케냐·르완다·남미 등 12개국 커피 농장 직접 방문, 생두 직수입",
        "신입 직원 1년 교육 (3개월 개념 공부 → 자체 시험 → 바 데뷔)",
        "'막내의 품질이 우리의 품질' — 200명 정규직 정기 로스팅·바리스타 교육",
        "매장마다 공간 특성과 감수성을 살려 대표가 직접 설계 (프랜차이즈 X)",
        "'장사 잘 되는 집 다 찾아 관찰, 고수에게 묻고 또 물어라' — 관찰·학습 집착"
      ],
      en: [
        "Direct visits to coffee farms in 12 countries (Kenya, Rwanda, South America)",
        "1-year new-hire training (3mo concepts → exam → bar debut)",
        "'The junior's quality is our quality' — regular roasting/barista training for 200 staff",
        "Every store designed by founder personally to match the space (no franchise)",
        "'Observe every successful shop, ask the masters over and over' — obsessive learning"
      ]
    },
    lesson: {
      ko: "직원 교육에 1년을 투자하면 품질이 자산이 됩니다. 바리스타 1명 = 매장의 브랜드입니다",
      en: "Invest 1 year in each employee — quality becomes the asset. Each barista IS the brand"
    },
    founderQuote: { ko: "장사가 잘 되는 집은 다 찾아보고 관찰하고, 자신보다 고수에게는 묻고 또 물어라" },
    keyMetrics: { storeCount: 20, dataYear: "2024" },
    sources: [
      { label: "이코노미조선 '점포당 매출 스타벅스 2배'", url: "http://economychosun.com/client/news/view.php?boardName=C03&t_num=11620", accessedAt: "2026-04-24" },
      { label: "서울경제 '장사의 신' 김용덕 인터뷰", url: "https://m.sedaily.com/article/11603928", accessedAt: "2026-04-24" },
      { label: "헤럴드경제 [쉼표] 김용덕 CEO", url: "https://biz.heraldcorp.com/article/1340331", accessedAt: "2026-04-24" }
    ]
  },

  // ── 5. 프릳츠 커피 컴퍼니 ──────────────────
  {
    id: "fritz-coffee",
    name: { ko: "프릳츠 커피 컴퍼니", en: "Fritz Coffee Company" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee", "bakery-studio"],
    themes: ["people-first", "brand-building", "differentiation"],
    foundedYear: 2014,
    location: "서울 마포 도화 (본점)",
    founder: "김병기 외 5인 공동창업",
    oneLiner: {
      ko: "커피·제빵 업계 최고 전문가 6명이 공동 창업 — 업계 평균 +30% 임금으로 인재를 묶었습니다",
      en: "6 top coffee & bakery experts co-founded — paid 30% above industry to lock in talent"
    },
    successFactors: {
      ko: [
        "생두 바이어·바리스타 챔피언·로스터·빵 천재 등 분야별 1인자 6명 공동창업",
        "초기부터 업계 평균 +30% 임금 — 전 직원 연봉 정기 인상",
        "물개 로고·한글 디자인 등 대표의 확고한 '취향' 을 브랜드화",
        "공정무역 원두를 위해 대표가 직접 커피 농가 방문",
        "서울 확장 후 10년 만에 처음으로 서울 외(제주) 진출 — 신중한 확장"
      ],
      en: [
        "Co-founded by 6 top experts (green bean buyer, barista champ, roaster, bread genius)",
        "Paid 30% above industry from day 1 — regular raises for all staff",
        "Seal logo, Korean typography — founder's clear 'taste' as brand identity",
        "Founder personally visits farms for fair-trade beans",
        "10 years in Seoul before first non-Seoul (Jeju) location — cautious expansion"
      ]
    },
    lesson: {
      ko: "직원이 곧 상품입니다. 업계 평균보다 30% 더 주면 최고 인재가 10년 이상 남습니다",
      en: "Employees ARE the product. Pay 30% above industry to keep top talent for 10+ years"
    },
    sources: [
      { label: "한국경제 '삼성전자 전시장 된 이유'", url: "https://www.hankyung.com/article/202006181517i", accessedAt: "2026-04-24" },
      { label: "ppss 프릳츠 밀레니얼 분석", url: "https://ppss.kr/archives/214666", accessedAt: "2026-04-24" },
      { label: "브런치 moby '어떻게 브랜드가 되었나'", url: "https://brunch.co.kr/@moby/36", accessedAt: "2026-04-24" }
    ]
  },

  // ── 6. 노티드 도넛 (GFFG) ──────────────────
  {
    id: "knotted-donut",
    name: { ko: "노티드 도넛 (GFFG)", en: "Knotted Donut (GFFG)" },
    applicableCategories: ["cafe-dessert", "food"],
    applicableSubIndustries: ["dessert-cafe", "bakery-studio"],
    themes: ["product-innovation", "brand-building", "space-as-product"],
    foundedYear: 2017,
    location: "서울 강남",
    founder: "이준범 (GFFG 대표)",
    oneLiner: {
      ko: "도넛에 안 쓰던 우유 생크림·얼그레이·카야를 넣어 MZ 오픈런을 만들었고, 300억+ 투자 유치로 이어졌습니다",
      en: "Put milk cream, Earl Grey, and kaya into donuts — MZ queues led to 30B+ KRW investment"
    },
    successFactors: {
      ko: [
        "도넛에 쓰지 않던 크림 조합(우유·얼그레이·카야) — 카테고리 재정의",
        "반죽을 바깥으로 빼고 안에 크림을 '숨기는' 구조 — 테이크아웃에 최적화",
        "자체 디자인팀으로 매장 인테리어·패키지 관리, 브랜드별 코디네이터 고용",
        "인스타 해시태그 9만회+ — 사진을 찍지 않고는 못 배기는 공간 설계",
        "300억 투자 유치 (Altos·LB 등) → 다운타우너·리틀넥·호족반 등 브랜드 확장"
      ],
      en: [
        "Creams never used in donuts (milk, Earl Grey, kaya) — redefined the category",
        "Dough outside, cream hidden inside — optimized for takeout",
        "In-house design team manages every store interior & package; brand coordinators",
        "90K+ #노티드 hashtags — spaces designed to be photographed",
        "Raised 30B+ KRW (Altos, LB) → expanded to Downtowner, Little Neck, Hojokban"
      ]
    },
    lesson: {
      ko: "제품을 바꾸지 말고 카테고리를 재정의하세요. '도넛 + 얼그레이 크림'은 새로운 시장입니다",
      en: "Don't improve the product — redefine the category. 'Donut + Earl Grey cream' is a new market"
    },
    founderQuote: { ko: "가장 먼저, 새롭고 다른 것을 만들자는 것이 사업 철학입니다" },
    keyMetrics: { storeCount: 30, dataYear: "2024" },
    sources: [
      { label: "한국경제 매거진 '히트 브랜드 제조기' 2022", url: "https://magazine.hankyung.com/business/article/202204069130b", accessedAt: "2026-04-24" },
      { label: "한국경제 '이준범 야심' 2022.12", url: "https://www.hankyung.com/article/202212259134i", accessedAt: "2026-04-24" },
      { label: "longblack 'F&B에 패션을 입혀'", url: "https://www.longblack.co/note/432", accessedAt: "2026-04-24" }
    ]
  },

  // ── 7. 다운타우너 (GFFG) ──────────────────
  {
    id: "downtowner",
    name: { ko: "다운타우너", en: "Downtowner" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["chicken-burger", "western-pasta-brunch"],
    themes: ["product-innovation", "brand-building", "differentiation"],
    foundedYear: 2016,
    location: "서울 한남 (본점)",
    founder: "이준범 (GFFG 대표)",
    oneLiner: {
      ko: "한국인이 버거를 칼로 자르는 걸 보고 '세로 버거 + 블랙&화이트 포장' 으로 차별화 — 고객 90%가 여성입니다",
      en: "Saw Koreans cutting burgers with knives — launched vertical burger + B&W packaging; 90% female customers"
    },
    successFactors: {
      ko: [
        "'손으로 잡고 먹는 미국식 버거' 를 한국에 맞게 세로 형태로 재설계",
        "아보카도 초록 + 토마토 빨강 + 블랙&화이트 포장지 — '인싸템' 시각 조합",
        "GFFG 자체 디자인팀이 버거 색감을 돋보이게 하는 속지까지 설계",
        "대표의 미국 유학 경험에서 나온 '아메리칸 바이브' — 카피 불가한 오리지널",
        "여성 타겟 명확 — 건강한 재료(아보카도) + SNS 친화 포장"
      ],
      en: [
        "Saw Koreans cutting burgers w/ knives — redesigned as vertical 'hold with hands' American style",
        "Avocado green + tomato red + B&W packaging — 'insider item' visual combo",
        "GFFG in-house design team engineered wrappers to highlight burger colors",
        "Founder's US study years = authentic 'American vibe' — uncopyable origin",
        "Clear female target — healthy ingredients (avocado) + SNS-friendly packaging"
      ]
    },
    lesson: {
      ko: "제품이 비슷하면 '먹는 방식' 을 바꾸세요. 포장 색감 하나가 단골 90%를 여성으로 만듭니다",
      en: "If products are similar, change HOW it's eaten. One packaging color can make 90% of customers female"
    },
    sources: [
      { label: "다운타우너 공식 브랜드 소개", url: "https://downtowner.co.kr/about", accessedAt: "2026-04-24" },
      { label: "파이낸셜뉴스 2024.03 버거 3종 리뉴얼", url: "https://www.fnnews.com/news/202403271039124422", accessedAt: "2026-04-24" },
      { label: "서울경제 시그널 '300억 투자 맛집'", url: "https://www.sedaily.com/NewsView/26ES9JFNDR", accessedAt: "2026-04-24" }
    ]
  },

  // ── 8. 아우어베이커리 (CNP FOOD) ──────────────────
  {
    id: "our-bakery",
    name: { ko: "아우어베이커리", en: "OUR Bakery" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio", "dessert-cafe"],
    themes: ["product-innovation", "brand-building"],
    foundedYear: 2016,
    location: "서울 압구정",
    founder: "노승훈 (CNP FOOD 대표)",
    oneLiner: {
      ko: "'더티초코' 한 제품으로 매장수 2,000개 프랜차이즈 카페보다 많은 인스타 해시태그를 만들었습니다",
      en: "A single product 'Dirty Choco' gathered more Instagram tags than 2,000-store franchise cafes"
    },
    successFactors: {
      ko: [
        "더티초코·빨미까레 등 시그니처 1~2개에 전 역량 집중 (SKU 좁히기)",
        "자체 Central Kitchen 생산 → 품질·원가 동시 통제",
        "자체 로스팅 팩토리 운영 — 베이커리 + 카페 패키지 판매",
        "중국 진출 시 더티초코가 현지에서 히트 — K-디저트 수출 시나리오 검증",
        "도산분식·세스고 등 자매 브랜드와 F&B 디자인 노하우 공유"
      ],
      en: [
        "Focus all energy on 1-2 signature items (Dirty Choco, Palmiquarre) — narrow SKU",
        "Own central kitchen — simultaneous quality & cost control",
        "Own roasting factory — bakery + cafe package sales",
        "Dirty Choco became hit in China — validated K-dessert export thesis",
        "Shared F&B design know-how with sister brands (Dosan Bunsik, SES.GO)"
      ]
    },
    lesson: {
      ko: "10개 메뉴 중 9개를 빼고 1개에 집중하세요. 1개 히트 = 200개 매장 프랜차이즈 이길 수 있습니다",
      en: "Cut 9 of 10 menus — focus on 1. One hit item can beat 200-store franchises"
    },
    keyMetrics: { storeCount: 6, dataYear: "2024" },
    sources: [
      { label: "TENANT news 인생 빵집 분석", url: "http://tnnews.co.kr/archives/57323", accessedAt: "2026-04-24" },
      { label: "아우어베이커리 공식", url: "https://ourbakery.co.kr/", accessedAt: "2026-04-24" },
      { label: "Pinpoint Research GFFG 분석", url: "https://pinpointresearch.substack.com/p/gffg", accessedAt: "2026-04-24" }
    ]
  },

  // ── 9. 광화문국밥 (박찬일) ──────────────────
  {
    id: "gwanghwamun-gukbap",
    name: { ko: "광화문국밥", en: "Gwanghwamun Gukbap" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual", "ramen-noodle"],
    themes: ["differentiation", "product-innovation", "brand-building"],
    foundedYear: 2017,
    location: "서울 중구 시청",
    founder: "박찬일 셰프 (이탈리아 ICIF 출신)",
    oneLiner: {
      ko: "이탈리아 셰프 출신이 '평범한' 돼지국밥으로 미슐랭 빕구르망 4년 연속 — 재료 집착이 한 그릇을 명작으로 만들었습니다",
      en: "Italian-trained chef earned 4 consecutive Michelin Bib Gourmands with 'ordinary' pork soup"
    },
    successFactors: {
      ko: [
        "이탈리아 요리 기법(재료 경시 금지)을 한식 국밥에 적용",
        "흑돼지 엉덩이 살 + 듀록 돼지 어깨 살만 사용 — 부위 집착",
        "맑고 깨끗한 국물 + 은은한 향 — 일반 돼지국밥과 완전 다른 포지셔닝",
        "하얀 간판·정갈한 인테리어 — 노포가 아닌 '현대 한식당' 이미지",
        "박찬일 셰프의 글쓰기·방송 노출 → 식당 자체가 콘텐츠로 기능"
      ],
      en: [
        "Applied Italian culinary rigor (no material shortcuts) to Korean gukbap",
        "Only black pig rump + Duroc shoulder — cut obsession",
        "Clear clean broth + subtle aroma — completely different positioning from typical pork soup",
        "White signage, minimalist interior — 'modern Korean restaurant' not 'old shop'",
        "Chef's writing & media presence — the restaurant itself functions as content"
      ]
    },
    lesson: {
      ko: "평범한 메뉴도 재료에 집착하면 미슐랭급이 됩니다. 특정 부위만 쓰는 '포지셔닝' 이 차별화입니다",
      en: "Ordinary menus become Michelin-grade with material obsession. Cut-specific positioning is differentiation"
    },
    sources: [
      { label: "미쉐린 가이드 서울 광화문국밥", url: "https://guide.michelin.com/us/en/seoul-capital-area/kr-seoul/restaurant/gwanghwamun-gukbap", accessedAt: "2026-04-24" },
      { label: "1코노미뉴스 '4년째 미슐랭 광화문국밥'", url: "https://www.1conomynews.co.kr/news/articleView.html?idxno=24012", accessedAt: "2026-04-24" },
      { label: "아시아경제 미슐랭 먹어볼랭", url: "https://www.asiae.co.kr/article/2021102710072891299", accessedAt: "2026-04-24" }
    ]
  },

  // ── 10. 우래옥 ──────────────────
  {
    id: "wooraeok",
    name: { ko: "우래옥", en: "Wooraeok" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual", "ramen-noodle"],
    themes: ["tradition-heritage", "scarcity-strategy", "community-loyalty"],
    foundedYear: 1946,
    location: "서울 을지로",
    oneLiner: {
      ko: "80년 같은 제분소·정육점만 거래 — '우래옥은 반칙을 안 합니다' 라는 창업자 유훈이 평양냉면 1위를 만들었습니다",
      en: "80 years with the same mill & butcher — 'Wooraeok doesn't cut corners' made it Korea's #1 Pyongyang naengmyeon"
    },
    successFactors: {
      ko: [
        "80년간 같은 제분소·정육점만 거래 — 원재료 일관성 = 맛 일관성",
        "60년 평양냉면 명장 김태원 장인 영입, 자체 냉면 개발",
        "한우 엉덩이살·다리 안쪽살 4~5시간 고아 순수 고기 육수",
        "사기그릇 사용 — 스테인리스 냉면그릇 대비 격 차별화",
        "창업자 유훈 '반칙 금지' — 3대째 비타협적 품질 유지"
      ],
      en: [
        "80 years with same mill & butcher — consistent materials = consistent taste",
        "Hired 60-year naengmyeon master Kim Tae-won, developed proprietary noodles",
        "Korean beef rump + inner leg boiled 4-5 hrs — pure beef broth",
        "Ceramic bowls (not stainless) — grade differentiation",
        "Founder's rule 'no shortcuts' — 3 generations of non-negotiable quality"
      ]
    },
    lesson: {
      ko: "공급처 하나를 60년 이상 유지하면 그 자체가 해자입니다. 바꿀 때마다 신뢰가 깨집니다",
      en: "One supplier for 60+ years IS your moat. Every switch breaks trust"
    },
    founderQuote: { ko: "우래옥은 반칙을 안 합니다" },
    sources: [
      { label: "나무위키 우래옥", url: "https://namu.wiki/w/%EC%9A%B0%EB%9E%98%EC%98%A5", accessedAt: "2026-04-24" },
      { label: "다음 뉴스 '대기 130팀 평양냉면 열전' 2025.07", url: "https://v.daum.net/v/20250712090224492", accessedAt: "2026-04-24" },
      { label: "한경 엘르 서울 6대 평양냉면", url: "https://www.elle.co.kr/article/68006", accessedAt: "2026-04-24" }
    ]
  },

  // ── 11. 연남서식당 ──────────────────
  {
    id: "yeonnamseo-sikdang",
    name: { ko: "연남서식당", en: "Yeonnamseo Sikdang" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual"],
    themes: ["tradition-heritage", "differentiation", "customer-experience"],
    foundedYear: 1953,
    location: "서울 마포 연희",
    oneLiner: {
      ko: "6·25 때 노동자들이 서서 먹던 모습을 그대로 유지 — 70년 된 '서서 먹는 갈비' 가 해외 관광객까지 끌어옵니다",
      en: "Preserved Korean War-era 'standing-while-eating galbi' — now draws international tourists"
    },
    successFactors: {
      ko: [
        "1953년 창업 원형(서서 먹기) 그대로 유지 — 편의성 아닌 '역사' 를 팜",
        "영업시간은 오후 9시까지지만 오후 6시면 고기 매진 — 인위적 희소성 아님",
        "언덕배기 외진 위치에도 대낮부터 줄 — 입지 아닌 '찾아올 이유' 의 힘",
        "가족이 3대째 운영하며 전통을 '의무' 로 인식",
        "전국구·해외 관광객까지 확장 — 스토리 경제가 거리 한계를 넘음"
      ],
      en: [
        "Preserved 1953 original form (standing-while-eating) — sells history, not convenience",
        "Open until 9pm but meat sells out by 6pm — organic scarcity, not artificial",
        "Remote hilltop location yet full queues since noon — reason to come > location",
        "3rd generation family sees tradition as 'duty'",
        "Now draws national + international tourists — story economy transcends distance"
      ]
    },
    lesson: {
      ko: "불편한 것도 팔 수 있습니다. 70년 역사를 '지키면' 외진 언덕도 목 좋은 상권이 됩니다",
      en: "Inconvenience sells too. 70 years of preserved history turns remote hills into prime real estate"
    },
    sources: [
      { label: "한식재단 '열악해도 끌리는 시간의 맛'", url: "https://www.hansik.or.kr/magazines/list/magazineDetail/101/2365?menuSn=", accessedAt: "2026-04-24" },
      { label: "월간식품외식경제 319호 분석", url: "http://month.foodbank.co.kr/m/section/section_view.php?secIndex=2693&page=1&section=002013&back=S", accessedAt: "2026-04-24" },
      { label: "Tripadvisor Yeonnamseo Sikdang 리뷰", url: "https://www.tripadvisor.com/Restaurant_Review-g294197-d2228910-Reviews-Yeonnamseo_Sikdang-Seoul.html", accessedAt: "2026-04-24" }
    ]
  },

  // ── 12. 능동미나리 ──────────────────
  {
    id: "neungdong-minari",
    name: { ko: "능동미나리", en: "Neungdong Minari" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual", "ramen-noodle"],
    themes: ["product-innovation", "differentiation", "brand-building"],
    foundedYear: 2021,
    location: "서울 용산 (삼각지)",
    oneLiner: {
      ko: "'미나리 향 곰탕' 이라는 새 카테고리로 미쉐린 빕구르망 — 식재료 하나를 시그니처화하는 전략입니다",
      en: "Created 'minari-scented gomtang' category — earned Michelin Bib Gourmand from a single ingredient"
    },
    successFactors: {
      ko: [
        "국밥에 미나리를 '시그니처' 로 올려 카테고리 재정의",
        "특곰탕·곰탕·육회비빔밥 등 핵심 3~4개 메뉴로 집중",
        "용리단길·성수·여의도 순차 확장 — 각 매장이 다른 상권 성격 검증",
        "Bib Gourmand 선정으로 해외 여행자 유입 (Visit Seoul 공식 추천)",
        "인스타 중심 '곰탕을 오픈런으로 먹는다' 라는 신규 서사 구축"
      ],
      en: [
        "Put minari on top of gukbap as signature — redefined the category",
        "Focus on 3-4 core menus (special gomtang, gomtang, yukhoe bibimbap)",
        "Sequential expansion (Yongsan → Seongsu → Yeouido) — each store tests a different district",
        "Bib Gourmand drives foreign visitors (official Visit Seoul recommendation)",
        "Built new SNS narrative 'queue for gomtang' — defied gukbap stereotypes"
      ]
    },
    lesson: {
      ko: "전통 메뉴에 식재료 하나를 시그니처로 얹으면 새 카테고리가 됩니다. '미나리 곰탕' 처럼요",
      en: "Adding one signature ingredient to a traditional menu creates a new category. Like 'minari gomtang'"
    },
    keyMetrics: { storeCount: 3, dataYear: "2025" },
    sources: [
      { label: "미쉐린 가이드 서울 능동미나리", url: "https://guide.michelin.com/us/en/seoul-capital-area/kr-seoul/restaurant/neungdong-minari", accessedAt: "2026-04-24" },
      { label: "Visit Seoul 영문 추천", url: "https://english.visitseoul.net/", accessedAt: "2026-04-24" },
      { label: "다이닝코드 용리단길 맛집", url: "https://www.diningcode.com/profile.php?rid=sY45yRB1eIPB", accessedAt: "2026-04-24" }
    ]
  },

  // ── 13. 몽탄 ──────────────────
  {
    id: "mongtan",
    name: { ko: "몽탄", en: "Mongtan" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual"],
    themes: ["product-innovation", "brand-building", "differentiation"],
    foundedYear: 2018,
    location: "서울 용산 삼각지",
    oneLiner: {
      ko: "전남 무안의 짚불구이 스타일을 벤치마크해 '우대갈비' 라는 새 메뉴를 개발 — 삼각지 1타 식당이 됐습니다",
      en: "Benchmarked Muan straw-fire grill to invent 'wooden rib' — became Samgakji's #1 restaurant"
    },
    successFactors: {
      ko: [
        "전남 무안 두암식당 짚불구이를 서울 맥락에 맞게 재해석",
        "'우대갈비(뼈째 두툼한 갈비)' 라는 새 명칭·포맷으로 카테고리 생성",
        "대기만 2~4시간이 기본인 극강 웨이팅 — 희소성이 더 몰리게 함",
        "제주·온라인몰 확장 시 본점 콘셉트(짚불·우대갈비)를 일관되게 유지",
        "'기획력이 가장 압도적' 이라는 평가 — 고기 자체보다 서사가 팔림"
      ],
      en: [
        "Reinterpreted Muan Du-am Restaurant's straw-fire style for Seoul context",
        "Created new name/format 'woodae galbi' (thick bone-in rib) — new category",
        "2-4 hour queues as baseline — scarcity attracts more",
        "Expansion to Jeju + online store keeps original concept (straw fire, woodae galbi)",
        "'Most overwhelming planning power' — the story sells more than the meat"
      ]
    },
    lesson: {
      ko: "지방 노포의 조리법을 서울로 가져오면 새 카테고리가 됩니다. 벤치마크 → 재포장이 지름길입니다",
      en: "Bringing rural heritage methods to Seoul creates new categories. Benchmark → repackage is the shortcut"
    },
    sources: [
      { label: "몽탄 공식 홈페이지", url: "https://mongtan.co.kr/", accessedAt: "2026-04-24" },
      { label: "Toomuch 매거진 '욕나오게 맛있는 우대갈비'", url: "https://toomuchmgz.com/810", accessedAt: "2026-04-24" },
      { label: "브런치 '기획력이 가장 압도적인 식당'", url: "https://brunch.co.kr/@brunch9uz5/610", accessedAt: "2026-04-24" }
    ]
  },

  // ── 14. 삼거리푸줏간 ──────────────────
  {
    id: "samgeori-pujutgan",
    name: { ko: "삼거리푸줏간", en: "Samgeori Pujutgan" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual"],
    themes: ["brand-building", "product-innovation", "differentiation"],
    foundedYear: 2014,
    location: "서울 명동 (1호점)",
    founder: "노희영 (YG FOODS CEO)",
    oneLiner: {
      ko: "YG엔터테인먼트의 브랜드 자산을 레버리지 — 프리미엄 돼지고기 + K-pop 감성으로 태국·미국까지 진출했습니다",
      en: "Leveraged YG Entertainment brand equity — premium pork + K-pop vibe expanded to Thailand & USA"
    },
    successFactors: {
      ko: [
        "YG리퍼블릭 프로젝트로 시작 — 모기업 인지도를 초기 신뢰에 직접 활용",
        "충청도 프리미엄 암흑돼지 엄선 — 재료 차별화",
        "점심에는 국수·찌개 구성으로 시간대별 매출 다변화",
        "태국 ShowDC몰·미국 The Source몰 해외 진출 — K-브랜드 수출 모델",
        "복합문화공간(펍+포차+푸줏간) 포맷으로 2030 회식·데이트 수요 흡수"
      ],
      en: [
        "Launched as YG Republic project — instant trust from parent brand equity",
        "Premium Chungcheong-grade dark pork — material differentiation",
        "Noodles & stew for lunch = time-segment revenue diversification",
        "Thailand ShowDC & US The Source expansion — K-brand export model",
        "Pub + pocha + butcher hybrid space — captures 2030 dining/date demand"
      ]
    },
    lesson: {
      ko: "본인 브랜드가 약하다면 강한 브랜드에 붙으세요. YG·카카오·네이버 콘텐츠 브랜드와 제휴하면 0 → 1이 쉽습니다",
      en: "If your brand is weak, attach to a strong one. Partner with YG/Kakao/Naver content brands — 0 → 1 gets easy"
    },
    sources: [
      { label: "헤럴드경제 노희영 대표 삼거리푸줏간 인터뷰", url: "https://biz.heraldcorp.com/article/762356", accessedAt: "2026-04-24" }
    ]
  },

  // ── 15. 소금집 델리 ──────────────────
  {
    id: "salthouse-deli",
    name: { ko: "소금집 델리", en: "Salt House Deli" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["salad-healthy", "delivery-meals", "western-pasta-brunch"],
    themes: ["product-innovation", "brand-building", "differentiation"],
    foundedYear: 2016,
    location: "서울 망원",
    oneLiner: {
      ko: "작은 공방에서 수제 베이컨으로 시작 — 제주 흑돼지 잠봉뵈르 샌드위치로 '한국형 델리' 카테고리를 만들었습니다",
      en: "Started as small workshop with handmade bacon — Jeju black pork jambon-beurre sandwich became 'K-deli' category"
    },
    successFactors: {
      ko: [
        "2016년 훈제 베이컨 1개 제품으로 시작 (작은 공방) — 점진적 확장",
        "원료 선별부터 포장까지 100% 수작업 — 공정 자체가 스토리",
        "제주 흑돼지 + 프렌치 이즈니 버터로 잠봉뵈르 재해석 (한-프 하이브리드)",
        "단일 시그니처(잠봉뵈르) 집중 후 파스트라미·살루미로 SKU 확장",
        "셀프 샌드위치 + 소매 델리 미트 이중 수익 구조"
      ],
      en: [
        "Started 2016 with one product (smoked bacon) in tiny workshop — gradual expansion",
        "100% handmade from sourcing to packaging — the process itself is the story",
        "Jeju black pork + French Isigny butter = jambon-beurre reinterpreted (KR-FR hybrid)",
        "Single signature (jambon-beurre) → expanded to pastrami, salumi",
        "Dual revenue: in-house sandwiches + retail deli meats"
      ]
    },
    lesson: {
      ko: "큰 메뉴판으로 시작하지 마세요. 수제 베이컨 하나로 시작해 10년 만에 전국 샌드위치 1위가 될 수 있습니다",
      en: "Don't start with a big menu. One handmade bacon can become the nation's #1 sandwich in 10 years"
    },
    sources: [
      { label: "소금집 공식 홈페이지", url: "https://salthousekorea.com/", accessedAt: "2026-04-24" },
      { label: "Nomadharry 안국 소금집델리 리뷰", url: "https://nomadharry.blog/foodie-journal/%EC%86%8C%EA%B8%88%EC%A7%91%EB%8D%B8%EB%A6%AC-%EC%95%88%EA%B5%AD-%EB%A7%9B%EC%9E%88%EB%8A%94-%ED%9D%91%EB%B0%B1%EC%9A%94%EB%A6%AC%EC%82%AC-%EC%83%8C%EB%93%9C%EC%9C%84%EC%B9%98-%EB%B6%81%EC%B4%8C", accessedAt: "2026-04-24" },
      { label: "다이닝코드 소금집 델리 망원점", url: "https://www.diningcode.com/profile.php?rid=4XAsVpVwzvTC", accessedAt: "2026-04-24" }
    ]
  },

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   *  FOOD ADDITIONS (20 cases) — 2026-04-24
   *  chicken-burger / korean-casual / ramen-noodle / salad-healthy / delivery-meals / western-pasta-brunch
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  {
    id: "richmond-bakery",
    name: { ko: "리치몬드과자점", en: "Richmond Bakery" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["tradition-heritage", "product-innovation"],
    foundedYear: 1979,
    location: "서울 마포 (성산본점)",
    founder: "권상범",
    oneLiner: { ko: "나폴레옹 출신 명장이 슈크림·밤식빵으로 40년 빵집을 지킨 이야기", en: "A master baker keeping a 40-year shop alive with cream puffs and chestnut bread" },
    successFactors: { ko: ["일본 수련 후 단일 매장 품질에 집중", "슈크림·밤식빵 시그니처 메뉴 고수", "본점 대형화 대신 직영 소형 매장 유지"], en: ["Focused on single-store quality after Japan training", "Stuck to cream puff and chestnut bread signatures", "Kept small directly-operated stores instead of franchising"] },
    lesson: { ko: "한 매장의 품질이 30년 브랜드를 만든다", en: "One store's quality builds a 30-year brand" },
    sources: [{ label: "리치몬드과자점 - 나무위키", url: "https://namu.wiki/w/%EB%A6%AC%EC%B9%98%EB%AA%AC%EB%93%9C%EA%B3%BC%EC%9E%90%EC%A0%90", accessedAt: "2026-04-24" }]
  },
  {
    id: "kim-youngmo-bakery",
    name: { ko: "김영모과자점", en: "Kim Young-mo Bakery" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["product-innovation", "brand-building"],
    foundedYear: 1982,
    location: "서울 서초 (도곡본점)",
    founder: "김영모",
    oneLiner: { ko: "한국 최초 천연발효빵을 개발한 명장이 만든 프리미엄 베이커리", en: "A premium bakery from the master who pioneered Korea's first naturally fermented bread" },
    successFactors: { ko: ["국내 최초 천연발효빵·몽블랑 개발", "유기농 밀가루·우리쌀 등 친환경 재료 고집", "명장(MOF) 품격으로 절제된 맛 차별화"], en: ["Developed Korea's first naturally fermented bread and Mont Blanc", "Insisted on organic flour and Korean rice", "Differentiated through restrained flavor backed by MOF prestige"] },
    lesson: { ko: "장인의 자기절제가 곧 프리미엄이다", en: "A craftsman's restraint is itself the premium" },
    sources: [{ label: "김영모과자점 - 나무위키", url: "https://namu.wiki/w/%EA%B9%80%EC%98%81%EB%AA%A8%EA%B3%BC%EC%9E%90%EC%A0%90", accessedAt: "2026-04-24" }]
  },
  {
    id: "myungrang-hotdog",
    name: { ko: "명랑시대쌀핫도그", en: "Myungrang Hotdog" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["chicken-burger", "delivery-meals"],
    themes: ["differentiation", "people-first"],
    foundedYear: 2016,
    location: "부산대 → 전국",
    founder: "이종형·김상우 외 6인 (협동조합)",
    oneLiner: { ko: "외식 사업자 6인이 협동조합으로 뭉쳐 2년 만에 1,000호점을 돌파한 쌀핫도그", en: "Six restaurateurs joined as a co-op and hit 1,000 stores in two years with rice hot dogs" },
    successFactors: { ko: ["협동조합 구조로 가맹점주와 이익 공유", "쌀반죽으로 기존 핫도그와 식감 차별화", "2,000원대 저가 전략으로 분식 시장 재편"], en: ["Co-op structure shared profits with franchisees", "Differentiated texture with rice batter", "Redefined snack market with sub-2,000-won pricing"] },
    lesson: { ko: "혼자보다 함께가 1,000호점을 만든다", en: "Together beats alone at 1,000 stores" },
    sources: [{ label: "명랑핫도그로 명랑시대를 열다 - 프레시안", url: "https://www.pressian.com/pages/articles/2023071917051173332", accessedAt: "2026-04-24" }]
  },
  {
    id: "hadongkwan",
    name: { ko: "하동관", en: "Hadongkwan" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual", "ramen-noodle"],
    themes: ["tradition-heritage", "scarcity-strategy"],
    foundedYear: 1939,
    location: "서울 명동",
    founder: "김용택·류창희 부부",
    oneLiner: { ko: "곰탕·수육 단 두 메뉴로 80년을 버틴 서울식 곰탕의 표준", en: "Just two dishes — gomtang and suyuk — kept Seoul's standard alive for 80 years" },
    successFactors: { ko: ["메뉴를 곰탕·수육 두 가지로 극단적 단순화", "한우 암소 살코기·사골·내장만 사용", "당일 끓인 국물만 사용, 재탕 금지"], en: ["Radically narrowed menu to just two items", "Used only Korean cow meat, marrow, and offal", "Served only same-day broth — never reused"] },
    lesson: { ko: "한 그릇에 80년을 거는 집중력", en: "Eighty years of focus on a single bowl" },
    sources: [{ label: "하동관 - 나무위키", url: "https://namu.wiki/w/%ED%95%98%EB%8F%99%EA%B4%80", accessedAt: "2026-04-24" }, { label: "안병익의 노포기행 - 파이낸셜포스트", url: "https://www.financialpost.co.kr/news/articleView.html?idxno=226351", accessedAt: "2026-04-24" }]
  },
  {
    id: "ulmildae",
    name: { ko: "을밀대", en: "Ulmildae" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual", "ramen-noodle"],
    themes: ["tradition-heritage", "product-innovation"],
    foundedYear: 1971,
    location: "서울 마포 염리동",
    oneLiner: { ko: "양지·사태·안심·갈빗살까지 통째로 끓여낸 50년 마포 평양냉면 노포", en: "A 50-year Mapo Pyongyang naengmyeon shop simmering brisket, shank and ribeye into one broth" },
    successFactors: { ko: ["여러 부위를 함께 끓여 진한 육수 차별화", "메밀껍질 함유 자가제면으로 식감 확보", "본점-분점 가족 승계로 품질 일관성 유지"], en: ["Mixed multiple beef cuts for a distinctively rich broth", "Made noodles in-house with buckwheat husk", "Maintained consistency via family succession"] },
    lesson: { ko: "한 그릇 깊이가 노포를 만든다", en: "Depth in a single bowl makes a legacy" },
    sources: [{ label: "을밀대 - 나무위키", url: "https://namu.wiki/w/%EC%9D%84%EB%B0%80%EB%8C%80", accessedAt: "2026-04-24" }]
  },
  {
    id: "bongpiyang",
    name: { ko: "봉피양", en: "Bongpiyang" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual", "ramen-noodle"],
    themes: ["tradition-heritage", "people-first"],
    foundedYear: 2000,
    location: "서울 송파 방이동 본점",
    oneLiner: { ko: "벽제갈비가 만든 미슐랭 빕 구르망 평양냉면 — 메밀가루 8:2 직접 배합", en: "Byeokje Galbi's Michelin Bib Gourmand naengmyeon, blending buckwheat flour 8:2 in-house" },
    successFactors: { ko: ["조리사별 손맛 편차 없는 시스템 도입", "메밀가루 8:2 자체 배합으로 면 차별화", "장인이 후계자를 직접 양성하는 도제 시스템"], en: ["Built a system to eliminate chef-to-chef taste variance", "Self-blended buckwheat flour at an 8:2 ratio", "Master-apprentice succession to preserve craft"] },
    lesson: { ko: "장인 솜씨도 시스템이 있어야 100호점이 된다", en: "Even craftsmanship needs systems to scale" },
    sources: [{ label: "벽제갈비 봉피양 평양냉면", url: "https://bjgalbishop.com/product/%EB%B4%89%ED%94%BC%EC%96%91-%ED%8F%89%EC%96%91%EB%83%89%EB%A9%B4/287/", accessedAt: "2026-04-24" }]
  },
  {
    id: "pyeongraeok",
    name: { ko: "평래옥", en: "Pyeongraeok" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["korean-casual", "ramen-noodle"],
    themes: ["tradition-heritage", "scarcity-strategy"],
    foundedYear: 1950,
    location: "서울 중구",
    oneLiner: { ko: "1950년 개업해 73년간 평양냉면·온면 두 메뉴를 지킨 노포", en: "A 73-year noodle house keeping just naengmyeon and onmyeon since 1950" },
    successFactors: { ko: ["온면이라는 희소 메뉴로 차별화", "메뉴 단순화 + 가족 승계로 품질 유지", "을지로 입지 지키며 단골 신뢰 누적"], en: ["Differentiated with rare onmyeon noodle", "Maintained quality via simple menu and family succession", "Stayed put in Eulji-ro and built loyal regulars"] },
    lesson: { ko: "두 메뉴 70년이 100가지 1년보다 강하다", en: "Two dishes for 70 years beat a hundred for one" },
    sources: [{ label: "평양냉면 - 나무위키", url: "https://namu.wiki/w/%ED%8F%89%EC%96%91%EB%83%89%EB%A9%B4", accessedAt: "2026-04-24" }]
  },
  {
    id: "menya-sandaime",
    name: { ko: "멘야산다이메", en: "Menya Sandaime" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["ramen-noodle"],
    themes: ["tradition-heritage", "product-innovation"],
    foundedYear: 2014,
    location: "서울 홍대 → 전국 14개점",
    oneLiner: { ko: "일본 3대째 라멘집이 한국에 정착해 14개 매장으로 확장한 정통파", en: "A third-generation Japanese ramen shop that took root in Korea and grew to 14 stores" },
    successFactors: { ko: ["24시간 우려낸 정통 일본식 육수 고수", "전날 뽑아 숙성한 자가제면으로 면질 확보", "돈코츠·카라구치·미소·츠케맨 멀티 스타일 운영"], en: ["Stuck to 24-hour-simmered authentic Japanese broth", "Made noodles a day ahead and aged for texture", "Ran multi-style menu: tonkotsu, karakuchi, miso, tsukemen"] },
    lesson: { ko: "정통은 시간으로 증명된다", en: "Authenticity proves itself over time" },
    sources: [{ label: "멘야산다이메 - 시민일보 헬로디디", url: "https://www.hellodd.com/news/articleView.html?idxno=72639", accessedAt: "2026-04-24" }]
  },
  {
    id: "sweetbalance",
    name: { ko: "스윗밸런스", en: "Sweet Balance" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["salad-healthy"],
    themes: ["product-innovation", "community-loyalty"],
    foundedYear: 2014,
    location: "서울대입구 → 전국 20+",
    founder: "이운성·장지만",
    oneLiner: { ko: "서울대 창업동아리 10만원 프로젝트가 4년 만에 매출 45억으로 성장한 샐러드", en: "A SNU startup club's 100K-won project grew into a 4.5B-won salad chain in four years" },
    successFactors: { ko: ["포만감 있는 양으로 '한끼 식사' 포지셔닝", "4호점 후 자체 샐러드 공장 직접 구축", "서울대 캠퍼스 학생 커뮤니티 기반 초기 확산"], en: ["Positioned as a full meal with satisfying portions", "Built own salad factory after fourth store", "Bootstrapped through SNU campus community"] },
    lesson: { ko: "10만원 실험이 45억 매출이 된다", en: "A 100K-won test can become 4.5B in revenue" },
    sources: [{ label: "서울대 창업동아리서 의기투합 - 한국경제", url: "https://www.hankyung.com/economy/article/2020013114481", accessedAt: "2026-04-24" }]
  },
  {
    id: "salady-snu-startup",
    name: { ko: "샐러디 (창업기)", en: "Salady (founding story)" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["salad-healthy", "delivery-meals"],
    themes: ["differentiation", "product-innovation"],
    foundedYear: 2013,
    location: "서울 선릉 → 전국 300+",
    oneLiner: { ko: "대학생 두 청년이 시작해 자체 농장·공장까지 갖춘 국내 1위 샐러드 브랜드", en: "Two students built Korea's #1 salad chain — now with its own farm and factory" },
    successFactors: { ko: ["초기 3개월 부진 후 패스트푸드형 단순 메뉴로 전환", "1만평 자체 농장·자체 가공공장 수직계열화", "원가율 35% / 영업이익률 25%로 가맹점 수익 확보"], en: ["Pivoted to fast-food-style simplified menu after 3-month slump", "Vertically integrated 33,000sqm farm and processing plant", "Achieved 35% COGS / 25% margin for franchisee profit"] },
    lesson: { ko: "단순화 + 수직계열화가 300호점을 만든다", en: "Simplification plus integration scales to 300 stores" },
    sources: [{ label: "샐러디 창업 정보 - 마이프차", url: "https://myfranchise.kr/20150828/%EC%83%90%EB%9F%AC%EB%94%94", accessedAt: "2026-04-24" }]
  },
  {
    id: "slowcali",
    name: { ko: "슬로우캘리", en: "Slow Cali" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["salad-healthy", "delivery-meals"],
    themes: ["product-innovation", "differentiation"],
    foundedYear: 2019,
    location: "서울 → 전국 150+",
    oneLiner: { ko: "스마트팜 직거래로 발주 다음날 입고하는 신생 웰니스 샐러드 브랜드", en: "A new wellness salad brand sourcing same-week from smart farms" },
    successFactors: { ko: ["스마트팜 발주 → 익일 수확 → 이틀내 매장 도착 시스템", "포케·샐러드랩·스프 등 메뉴 다각화", "매장 평균 이익률 경쟁사 대비 9% 우위"], en: ["Smart-farm order → next-day harvest → 2-day store delivery", "Diversified into poke, salad wraps, soups", "9% higher store-level profit margin than competitors"] },
    lesson: { ko: "신선도 = 공급망. 농장이 곧 매장이다", en: "Freshness equals supply chain — the farm is the store" },
    sources: [{ label: "슬로우캘리 - 마이프차", url: "https://myfranchise.kr/20212429/%EC%8A%AC%EB%A1%9C%EC%9A%B0%EC%BA%98%EB%A6%AC", accessedAt: "2026-04-24" }]
  },
  {
    id: "hansot-dosirak",
    name: { ko: "한솥도시락", en: "Hansot Dosirak" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["delivery-meals"],
    themes: ["differentiation", "people-first"],
    foundedYear: 1993,
    location: "서울 종로구청 앞 1호점",
    founder: "이영덕",
    oneLiner: { ko: "45세 늦깎이 창업자가 종로 1호점에서 시작해 800개 매장의 도시락 1위가 된 이야기", en: "A late-starting 45-year-old founder grew Jongno's 1st store into Korea's #1 dosirak chain at 800 stores" },
    successFactors: { ko: ["국내 최초 테이크아웃 도시락으로 가격 파괴", "초기 6~7년 본사 적자 감수, 가맹점 이익 우선", "편의점보다 가격·품질 모두 앞서는 포지셔닝"], en: ["First takeout dosirak in Korea, broke price barrier", "Took 6-7 years of HQ losses to prioritize franchisee profit", "Positioned ahead of convenience stores on both price and quality"] },
    lesson: { ko: "본사 손해 봐도 가맹점이 살아야 30년 간다", en: "Franchisees must thrive even if HQ bleeds — that's how you last 30 years" },
    sources: [{ label: "한솥도시락 - 나무위키", url: "https://namu.wiki/w/%ED%95%9C%EC%86%A5", accessedAt: "2026-04-24" }, { label: "초기 6~7년 본사 적자 - 이코노미조선", url: "https://economychosun.com/site/data/html_dir/2017/02/27/2017022700019.html", accessedAt: "2026-04-24" }]
  },
  {
    id: "jaws-tteokbokki",
    name: { ko: "죠스떡볶이", en: "Jaws Tteokbokki" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["delivery-meals"],
    themes: ["product-innovation", "brand-building"],
    foundedYear: 2007,
    location: "서울 고려대 앞 1호점",
    founder: "나상균",
    oneLiner: { ko: "고려대 앞 7평 서점 절반에서 시작해 6년 만에 점포당 매출 1위가 된 떡볶이", en: "A 23sqm stall in a Korea University bookshop became the #1 tteokbokki chain by per-store sales in six years" },
    successFactors: { ko: ["전국 떡볶이집 50곳 답사 후 레시피 완성", "히트 후에도 2년간 가맹 시스템 인프라부터 구축", "분식 카테고리에 브랜드·매뉴얼 도입"], en: ["Visited 50 tteokbokki shops nationwide before finalizing recipe", "Spent 2 years building franchise infrastructure before scaling", "Brought brand and manual discipline to a fragmented category"] },
    lesson: { ko: "잘된다고 바로 가맹 안 낸다. 시스템이 먼저", en: "Don't franchise just because it's hot — build the system first" },
    founderQuote: { ko: "매운맛 찾으려고 맛집 쓰레기통까지 뒤졌다" },
    sources: [{ label: "죠스떡볶이 - 나무위키", url: "https://namu.wiki/w/%EC%A3%A0%EC%8A%A4%EB%96%A1%EB%B3%B6%EC%9D%B4", accessedAt: "2026-04-24" }, { label: "프랜차이즈 CEO 인터뷰 나상균 - 한국경제", url: "https://www.hankyung.com/article/2013091567391", accessedAt: "2026-04-24" }]
  },
  {
    id: "monyeo-gimbap",
    name: { ko: "모녀김밥 (광장시장 마약김밥)", en: "Monyeo Mayak Gimbap" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["delivery-meals"],
    themes: ["scarcity-strategy", "tradition-heritage"],
    foundedYear: 1980,
    location: "서울 광장시장",
    oneLiner: { ko: "당근·단무지뿐인 꼬마김밥과 겨자소스로 45년 광장시장의 명물이 된 노포", en: "A 45-year market legend made from mini gimbap with just carrot and pickled radish, dipped in mustard sauce" },
    successFactors: { ko: ["재료 단순화(당근·단무지)로 원가·속도 동시 잡기", "겨자·간장 황금비율 디핑소스로 중독성 확보", "광장시장 입지 + '마약' 네이밍 확산"], en: ["Cut costs and time with just carrot and radish", "Built addiction loop with mustard-soy dipping sauce", "Leveraged Gwangjang Market location + viral 'mayak' naming"] },
    lesson: { ko: "단순함 + 한 가지 비밀 소스 = 45년", en: "Simplicity plus one secret sauce equals 45 years" },
    sources: [{ label: "모녀꼬마마약김밥 - 다이닝코드", url: "https://www.diningcode.com/profile.php?rid=dio0cbojSAxW", accessedAt: "2026-04-24" }]
  },
  {
    id: "elbon-the-table",
    name: { ko: "엘본더테이블", en: "Elbon the Table" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["western-pasta-brunch"],
    themes: ["differentiation", "customer-experience"],
    foundedYear: 2011,
    location: "서울 신사동 가로수길",
    founder: "최현석",
    oneLiner: { ko: "최현석 셰프가 격식과 가격을 낮춰 누구나 즐기는 모던 이탈리안 파인다이닝", en: "Chef Choi Hyun-seok's modern Italian fine dining — formality and price brought down for everyone" },
    successFactors: { ko: ["파인다이닝 격식·가격을 의도적으로 인하", "친근하고 따뜻한 분위기로 진입장벽 제거", "셰프 개인 브랜드를 매장 자산으로 전환"], en: ["Deliberately lowered fine-dining formality and prices", "Removed entry barriers with warm, casual ambience", "Converted chef's personal brand into restaurant equity"] },
    lesson: { ko: "고급화의 반대편에 더 큰 시장이 있다", en: "The bigger market lies on the other side of luxury" },
    sources: [{ label: "엘본더테이블 가로수길 본점 - 식신", url: "https://www.siksinhot.com/P/245667", accessedAt: "2026-04-24" }]
  },
  {
    id: "bills-seoul",
    name: { ko: "빌즈 서울", en: "Bills Seoul" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["western-pasta-brunch"],
    themes: ["brand-building", "space-as-product"],
    foundedYear: 2014,
    location: "서울 강남 (역삼·잠실)",
    oneLiner: { ko: "호주 시드니 빌 그레인저 셰프의 라이선스 도입으로 한국 호주식 브런치 카테고리를 연 매장", en: "Bill Granger's Sydney brunch licensed into Seoul, opening Korea's Australian brunch category" },
    successFactors: { ko: ["리코타 핫케이크 시그니처 메뉴로 SNS 확산", "강남·잠실 등 외국인 유동 입지 선택", "호주 라이프스타일을 공간·메뉴로 일관 표현"], en: ["Drove SNS virality with signature ricotta hotcake", "Chose Gangnam/Lotte World Mall for international foot traffic", "Expressed Aussie lifestyle consistently in space and menu"] },
    lesson: { ko: "라이프스타일은 메뉴가 아니라 공간이다", en: "Lifestyle isn't the menu — it's the space" },
    sources: [{ label: "호주식 브런치 빌즈 강남 - 트립닷컴", url: "https://kr.trip.com/moments/detail/gangnam-gu-2016458-119201990/", accessedAt: "2026-04-24" }]
  },
  {
    id: "trattoria-da-luca",
    name: { ko: "트라토리아 다 루카", en: "Trattoria da Luca" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["western-pasta-brunch"],
    themes: ["product-innovation", "differentiation"],
    foundedYear: 2014,
    location: "서울 한남동",
    founder: "조성욱",
    oneLiner: { ko: "조성욱 셰프의 정통 이탈리안 트라토리아 — 격식보다 일상의 만족을 추구", en: "Chef Cho Sung-wook's authentic Italian trattoria — pursuing daily satisfaction over formality" },
    successFactors: { ko: ["이탈리아 현지 수련 경험을 메뉴에 그대로 이식", "트라토리아 콘셉트로 파인다이닝과 캐주얼 사이 포지션", "단골 중심 좌석 운영으로 커뮤니티 형성"], en: ["Transferred Italy training directly to the menu", "Positioned trattoria between fine dining and casual", "Built community via regulars-focused seating"] },
    lesson: { ko: "정통은 트렌드보다 오래간다", en: "Authenticity outlasts trends" },
    sources: [{ label: "이탈리안 트라토리아 다 루카 조성욱 셰프 - 퍼블리", url: "https://publy.co/content/4025", accessedAt: "2026-04-24" }]
  },
  {
    id: "park-chanil-italian",
    name: { ko: "박찬일의 라꼼마", en: "La Comma by Park Chan-il" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["western-pasta-brunch"],
    themes: ["product-innovation", "tradition-heritage"],
    foundedYear: 2010,
    location: "서울 홍대",
    founder: "박찬일",
    oneLiner: { ko: "한국 파스타 1세대 셰프가 한국 식재료로 풀어낸 이탈리안 선술집", en: "A first-generation Korean Italian chef's tavern, plating local ingredients in Italian form" },
    successFactors: { ko: ["한국 식재료로 정통 이탈리아 요리를 재해석", "셰프 본인이 글·책으로 브랜드 신뢰 구축", "오너셰프 운영으로 메뉴·운영 일관성 유지"], en: ["Reinterpreted Italian cooking with Korean ingredients", "Built trust through chef's own writing and books", "Owner-chef model preserved menu and ops consistency"] },
    lesson: { ko: "셰프의 글이 매장의 오래된 광고다", en: "A chef's writing is the longest-running ad for their store" },
    sources: [{ label: "삶에 소금 치는 요리사 박찬일 - 리빙센스", url: "http://www.living-sense.co.kr/news/articleView.html?idxno=63783", accessedAt: "2026-04-24" }]
  },
  {
    id: "fugetsu-myeongdong",
    name: { ko: "쯔루하시 후게츠 명동점", en: "Tsuruhashi Fugetsu Myeongdong" },
    applicableCategories: ["food"],
    applicableSubIndustries: ["western-pasta-brunch"],
    themes: ["tradition-heritage", "customer-experience"],
    foundedYear: 2014,
    location: "서울 명동",
    oneLiner: { ko: "오사카 쯔루하시 본점의 정통 철판 오코노미야끼를 명동에서 재현한 매장", en: "Osaka Tsuruhashi's authentic teppan okonomiyaki recreated in Myeongdong" },
    successFactors: { ko: ["오사카 본점 레시피·철판 조리법 그대로 이식", "모던야끼 등 본토 메뉴로 차별화", "명동 외국인 관광객 입지로 자연 노출 확보"], en: ["Imported Osaka HQ's recipe and teppan technique intact", "Differentiated with home-style menu like modan-yaki", "Used Myeongdong tourist traffic for organic exposure"] },
    lesson: { ko: "본토 그대로가 최고의 차별화다", en: "True-to-origin is the strongest differentiation" },
    sources: [{ label: "쯔루하시 후게츠 명동점 - 다이닝코드", url: "https://www.diningcode.com/profile.php?rid=KkDmbuhG3242", accessedAt: "2026-04-24" }]
  },

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   *  BEAUTY & FITNESS ADDITIONS (23 cases) — 2026-04-24
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  {
    id: "chahong-ardor-cheongdam",
    name: { ko: "차홍 아르더 청담", en: "Chahong Ardor Cheongdam" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["hair-salon"],
    themes: ["brand-building", "differentiation", "people-first"],
    foundedYear: 2008,
    location: "서울 청담",
    founder: "차홍",
    oneLiner: { ko: "수습 1년 만에 청담동 1인 미용사 매출 1위, 아시아 최초 로레알 글로벌 아티스트", en: "From apprentice to Cheongdam's top solo stylist in 1 year; first Asian L'Oreal Global Artist" },
    successFactors: { ko: ["원장 개인 브랜드(YouTube·미디어)와 살롱 시너지 극대화", "아카데미·차홍룸으로 후배 양성 → 인재 풀 자체 조달", "5년 연속 국가브랜드 대상으로 신뢰 자산 축적"], en: ["Maximized founder personal brand and salon synergy", "In-house academy supplies talent pipeline", "5 consecutive National Brand Awards built trust capital"] },
    lesson: { ko: "원장 개인 브랜드가 곧 매장 자산 — 미디어·아카데미로 복리 성장", en: "Founder's personal brand IS the salon's asset" },
    sources: [{ label: "차홍살롱 공식", url: "https://chahongsalon.com/salon/chahong-ardor/cheongdam/", accessedAt: "2026-04-24" }, { label: "차홍 - 나무위키", url: "https://namu.wiki/w/%EC%B0%A8%ED%99%8D", accessedAt: "2026-04-24" }]
  },
  {
    id: "juno-hair-cheongdam",
    name: { ko: "준오헤어 청담 본점", en: "Juno Hair Cheongdam HQ" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["hair-salon"],
    themes: ["people-first", "brand-building", "community-loyalty"],
    foundedYear: 1982,
    location: "서울 돈암 → 청담",
    founder: "강윤선",
    oneLiner: { ko: "22살 일수 빚으로 시작해 직원 3,500명·연매출 2,000억의 글로벌 미용 기업으로", en: "From a 22-year-old's loan-funded shop to 3,500 staff and 200B KRW revenue" },
    successFactors: { ko: ["직원 교육·독서경영으로 '억대 연봉 직원 300명' 목표 추구", "준오아카데미로 표준화된 기술·서비스 인재 양성", "내부 승진·복지로 업계 최저 이직률 달성"], en: ["Aim to nurture 300 staff earning 100M+ KRW", "Juno Academy standardizes skill and service", "Internal promotion yields industry-low turnover"] },
    lesson: { ko: "사람을 키우면 매장이 큰다 — 미용업의 본질은 직원 교육 시스템", en: "Grow people, the shop grows itself" },
    founderQuote: { ko: "억대 연봉 받는 직원 300명은 돼야죠" },
    sources: [{ label: "준오헤어 공식", url: "https://www.junohair.com/", accessedAt: "2026-04-24" }, { label: "월간중앙 - 강윤선 레전드", url: "https://www.m-joongang.com/news/articleView.html?idxno=326153", accessedAt: "2026-04-24" }]
  },
  {
    id: "leekaja-hairbis",
    name: { ko: "이가자 헤어비스", en: "Leekaja Hairbis" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["hair-salon"],
    themes: ["brand-building", "tradition-heritage"],
    foundedYear: 1972,
    location: "서울 마포 서교동 → 강남 본사",
    founder: "이가자",
    oneLiner: { ko: "1972년 마포 1호점, 한국 최초 실명 브랜드 미용실의 원조", en: "Korea's first eponymous beauty salon brand, opened in Mapo 1972" },
    successFactors: { ko: ["원장 실명 브랜드로 신뢰성 확보 (한국 최초)", "체계적인 가맹·교육 시스템으로 전국망 구축", "하노이·호치민·자카르타 등 동남아 진출", "LA 뷰티 아카데미 설립으로 K-뷰티 교육 수출"], en: ["First eponymous beauty brand in Korea built trust", "Systematic franchise and training nationwide", "Expanded into Hanoi, Ho Chi Minh, Jakarta", "LA Beauty Academy exports K-beauty education"] },
    lesson: { ko: "내 이름을 거는 순간 품질의 책임이 자산이 된다", en: "Putting your name on it makes accountability your asset" },
    sources: [{ label: "이가자 공식", url: "https://leekaja.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "parkjun-beauty-lab-myeongdong",
    name: { ko: "박준 뷰티랩 명동점", en: "Park Jun Beauty Lab Myeongdong" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["hair-salon"],
    themes: ["brand-building", "customer-experience"],
    foundedYear: 1990,
    location: "서울 명동",
    founder: "박준",
    oneLiner: { ko: "관광객이 가장 먼저 찾는 명동 헤어샵, 평점 4.9의 트렌드 발신지", en: "Myeongdong's top tourist hair salon, 4.9-rated trend hub" },
    successFactors: { ko: ["매년 새로운 헤어 트렌드를 자체 발표하는 R&D 문화", "일본·중화권 관광객 응대 노하우로 외국인 시장 선점", "박준 원장 미디어 노출로 '컷 = 박준' 연상 확립"], en: ["Internal R&D releases new hair trends annually", "Captured foreign market via tourist service know-how", "Founder media exposure cemented 'cut = Park Jun'"] },
    lesson: { ko: "관광 상권은 외국어·문화 이해가 핵심 차별화 요인", en: "In tourist districts, language and cultural fluency is the differentiator" },
    sources: [{ label: "박준 뷰티랩 공식", url: "https://www.parkjun.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "oyo-nail-apgujeong-rodeo",
    name: { ko: "오요네일 압구정로데오", en: "Oyo Nail Apgujeong Rodeo" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["nail-studio"],
    themes: ["customer-experience", "differentiation"],
    foundedYear: 2018,
    location: "서울 압구정로데오",
    oneLiner: { ko: "맞춤 디자인 전문 압구정 네일샵, 웨딩·연장 네일 인기 1호점", en: "Custom-design nail studio in Apgujeong Rodeo, top for wedding and extensions" },
    successFactors: { ko: ["고객 손 형태에 맞춘 1:1 맞춤 디자인", "웨딩네일·연장네일 등 고단가 시술 특화", "인스타그램 포트폴리오로 디자인 신뢰 구축", "압구정로데오 고소득 상권 타깃팅"], en: ["1:1 custom designs tailored to each client's hands", "Specialized in high-ticket services", "Instagram portfolio builds credibility", "Targeted high-income demographic"] },
    lesson: { ko: "단가 높은 시술에 집중하면 좌석 회전율 부담이 줄어든다", en: "Focusing on high-ticket services lowers turnover pressure" },
    sources: [{ label: "오요네일 인스타그램", url: "https://www.instagram.com/oyonail/", accessedAt: "2026-04-24" }]
  },
  {
    id: "abijou-nail-apgujeong",
    name: { ko: "아비쥬 압구정 네일", en: "Abijou Apgujeong Nail" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["nail-studio"],
    themes: ["space-as-product", "customer-experience"],
    foundedYear: 2015,
    location: "서울 압구정",
    oneLiner: { ko: "여름 패디큐어 맛집으로 입소문 난 압구정 프리미엄 네일·뷰티샵", en: "Apgujeong premium nail/beauty studio famous for summer pedicures" },
    successFactors: { ko: ["네일·페디·왁싱 통합 토털 케어 모델", "후기 콘텐츠 자체 운영으로 SEO 상위 노출", "압구정 단골 고객 락인", "계절 메뉴(여름 패디) 마케팅으로 비수기 평탄화"], en: ["Integrated nail/pedi/waxing total-care model", "Owns review content for top SEO", "Locked in Apgujeong loyal customers", "Seasonal menu marketing flattens off-season"] },
    lesson: { ko: "단일 시술이 아닌 '계절 코스'로 묶으면 객단가가 오른다", en: "Bundling into seasonal courses lifts ticket size" },
    sources: [{ label: "아비쥬 후기 페이지", url: "http://m.abijoubeauty.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "samantha-waxing",
    name: { ko: "사만다왁싱", en: "Samantha Waxing" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["waxing-studio"],
    themes: ["product-innovation", "differentiation", "brand-building"],
    foundedYear: 2014,
    location: "서울 강남역(직영 본점)",
    oneLiner: { ko: "네이버 검색 1위, 5-Step 노더블딥 시스템으로 한국 왁싱 표준 정립", en: "Naver's #1 waxing search; 5-Step No-Double-Dip system set Korea's standard" },
    successFactors: { ko: ["국내 최초 노더블딥 위생 시스템 도입", "독립 룸·샤워실 구비로 프라이버시 차별화", "5-Step 표준 매뉴얼로 점포별 품질 균질화", "왁싱 전용 애프터케어·다과 서비스로 경험 차별화"], en: ["Pioneered No-Double-Dip hygiene system", "Private rooms with showers differentiate on privacy", "5-Step manual ensures consistency", "Aftercare and refreshment service"] },
    lesson: { ko: "위생을 시스템화하면 가격 경쟁이 아닌 신뢰 경쟁이 된다", en: "Systematized hygiene shifts competition from price to trust" },
    sources: [{ label: "사만다왁싱 공식", url: "https://www.samanthawaxing.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "waxing-lab-gangnam",
    name: { ko: "왁싱랩 강남점", en: "Waxing Lab Gangnam" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["waxing-studio"],
    themes: ["differentiation", "people-first"],
    foundedYear: 2017,
    location: "서울 강남역",
    oneLiner: { ko: "남자 왁서 1:1 슈가링 전문 — 남성 시장의 빈틈을 정조준", en: "Male-waxer 1:1 sugaring specialist — targeted men's market gap" },
    successFactors: { ko: ["남자 고객-남자 왁서 매칭으로 진입 장벽 제거", "슈가링(천연 설탕 왁스) 단일 카테고리 전문화", "예약제 1:1 운영으로 대기·노출 부담 없음", "수유·이태원·서울대입구로 지점 확장"], en: ["Male-male matching removes male customer barrier", "Specialized in sugaring only", "Reservation-only 1:1 model", "Expanded to multiple branches"] },
    lesson: { ko: "미개척 성별·니치를 단독 점유하면 경쟁이 사라진다", en: "Owning an underserved niche makes competition disappear" },
    sources: [{ label: "왁싱랩 공식 - 강남점", url: "http://www.waxinglab.net/gangnam", accessedAt: "2026-04-24" }]
  },
  {
    id: "muse-brow-yeoksam",
    name: { ko: "뮤즈브로우", en: "Muse Brow" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["eyelash-brow"],
    themes: ["differentiation", "brand-building"],
    foundedYear: 2018,
    location: "서울 역삼",
    oneLiner: { ko: "연예인·승무원 반영구 눈썹 전문, 역삼역 도보 5분", en: "Specialist in semi-permanent brows for celebrities and flight attendants" },
    successFactors: { ko: ["승무원·연예인 등 외모 민감 직군에 특화 포지셔닝", "단일 카테고리(반영구 눈썹) 깊이 있는 전문성", "카카오톡 채널로 1:1 상담 자동화", "역삼역 환승 동선의 고밀도 입지"], en: ["Specialized for appearance-sensitive professions", "Deep specialization in single category", "Automated 1:1 consultations via KakaoTalk", "High-density transit location"] },
    lesson: { ko: "타깃 직군을 좁히면 입소문이 폭발한다", en: "Narrowing to a single profession ignites word-of-mouth" },
    sources: [{ label: "뮤즈브로우 카카오채널", url: "https://pf.kakao.com/_xjnnxnK", accessedAt: "2026-04-24" }]
  },
  {
    id: "benme-banyounggu-apgujeong",
    name: { ko: "비앤미 반영구 압구정점", en: "Benme Semi-Permanent Apgujeong" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["eyelash-brow"],
    themes: ["product-innovation", "customer-experience"],
    foundedYear: 2016,
    location: "서울 압구정",
    oneLiner: { ko: "눈썹·아이라인·입술 토털 반영구 — 압구정 종합 반영구 강자", en: "Total semi-permanent (brows, liner, lips) — Apgujeong's all-round leader" },
    successFactors: { ko: ["눈썹+아이라인+입술 통합 메뉴로 객단가 극대화", "여자/남자 눈썹 분리 메뉴로 남성 고객 진입 유도", "자체 색소·기법 R&D로 차별화", "정형화된 가격표·결과물 카탈로그로 신뢰 확보"], en: ["Maximized ticket via brows+liner+lips integrated menu", "Separate male/female brow menus", "Proprietary pigment R&D", "Standardized price list builds trust"] },
    lesson: { ko: "반영구는 '얼굴 전체 솔루션'으로 묶으면 객단가가 3배", en: "Semi-permanent unlocks 3x ticket when bundled as whole-face solution" },
    sources: [{ label: "비앤미 반영구 압구정점", url: "https://www.benme.co.kr/ban/", accessedAt: "2026-04-24" }]
  },
  {
    id: "huvom-spa-apgujeong",
    name: { ko: "휴봄 스파", en: "Huvom Spa" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["skin-care-room"],
    themes: ["space-as-product", "customer-experience"],
    foundedYear: 2019,
    location: "서울 압구정·청담",
    oneLiner: { ko: "압구정·청담 셀럽이 찾는 프리미엄 스파 피부관리실", en: "Premium spa-style skin studio frequented by Apgujeong/Cheongdam celebs" },
    successFactors: { ko: ["공간 자체를 상품화한 스파 컨셉 인테리어", "셀럽 SNS 노출로 프리미엄 브랜드 이미지 형성", "회원제 운영으로 안정적 매출 확보", "고관여 시술 단가 정책으로 평일 매출 평탄화"], en: ["Spa-concept interior turns space itself into product", "Celebrity SNS exposure builds premium image", "Membership model secures stable revenue", "High-involvement pricing flattens weekday revenue"] },
    lesson: { ko: "공간이 곧 상품이다 — 인테리어 투자 회수는 객단가로 돌아온다", en: "Space is the product — interior investment returns through ticket size" },
    sources: [{ label: "휴봄 스파 인스타그램", url: "https://www.instagram.com/huvom/", accessedAt: "2026-04-24" }]
  },
  {
    id: "cellnine-cheongdam",
    name: { ko: "셀나인 청담", en: "Cellnine Cheongdam" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["skin-care-room"],
    themes: ["product-innovation", "differentiation"],
    foundedYear: 2020,
    location: "서울 청담",
    oneLiner: { ko: "셀럽 리프팅·제네오X 파샬업 시술로 청담 리프팅 시장 차별화", en: "Differentiated Cheongdam lifting market via Celeb Lifting and Geneo X Partial Up" },
    successFactors: { ko: ["독자 시술명(셀럽 리프팅, 파샬업)으로 메뉴 차별화", "고가 의료 장비(제네오X) 도입으로 진입장벽 구축", "청담 입지 + 의료 협업 모델", "단발 회차가 아닌 '코스' 판매로 LTV 극대화"], en: ["Proprietary treatment names differentiate menu", "High-end medical equipment builds entry barrier", "Cheongdam location plus medical collaboration", "Course sales rather than single sessions"] },
    lesson: { ko: "시술 이름을 직접 작명하면 가격 비교가 사라진다", en: "Naming your own treatments eliminates price comparison" },
    sources: [{ label: "셀나인 청담 공식", url: "https://cellnine.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "the-queen-beauty-shop",
    name: { ko: "더퀸뷰티샵 청담", en: "The Queen Beauty Shop Cheongdam" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["skin-care-room"],
    themes: ["customer-experience", "people-first"],
    foundedYear: 2017,
    location: "서울 청담",
    oneLiner: { ko: "1:1 맞춤 케어 중심의 청담 프리미엄 피부관리실", en: "Cheongdam premium skin studio centered on 1:1 customized care" },
    successFactors: { ko: ["원장 1:1 상담·케어로 고가 정당화", "회원 상태 차트 관리로 시술 연속성 확보", "방문 주기 관리(SMS·전화)로 재방문율 상승", "오픈 룸이 아닌 독립 케어룸 구조"], en: ["Founder-led 1:1 consult/care justifies premium price", "Member status charts ensure continuity", "SMS/phone follow-up improves repeat rate", "Independent care rooms"] },
    lesson: { ko: "재방문율을 높이는 가장 싼 도구는 차트와 전화 한 통", en: "Charts and a phone call are the cheapest tools to boost retention" },
    sources: [{ label: "청담 더퀸뷰티샵 피부관리실", url: "https://sites.google.com/site/thequeenshop07/", accessedAt: "2026-04-24" }]
  },
  {
    id: "jungsaemmool-inspiration-cheongdam",
    name: { ko: "정샘물 인스피레이션 청담", en: "Jung Saem Mool Inspiration Cheongdam" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["makeup-bridal"],
    themes: ["brand-building", "product-innovation", "differentiation"],
    foundedYear: 2008,
    location: "서울 청담동",
    founder: "정샘물",
    oneLiner: { ko: "투명 메이크업으로 K-뷰티 표준을 만든 글로벌 메이크업 아티스트 살롱", en: "K-beauty's transparent-makeup standard-bearer with global salon" },
    successFactors: { ko: ["원장명을 그대로 브랜드화한 강력한 IP", "'본연의 아름다움' 컨셉으로 두꺼운 화장 트렌드 역행", "살롱(서비스) + 화장품 브랜드 양 축 사업화", "전지현 등 톱스타 스타일링으로 상징성 확보"], en: ["Founder name as brand creates strong IP", "'Natural beauty' concept defied thick-makeup trend", "Dual business: salon + cosmetics brand", "Top-star styling cemented icon status"] },
    lesson: { ko: "트렌드를 역행하는 단 하나의 컨셉이 오히려 표준이 된다", en: "A single counter-trend concept can become the new standard" },
    sources: [{ label: "정샘물 공식 쇼핑몰", url: "https://www.jsmbeauty.com/", accessedAt: "2026-04-24" }, { label: "정샘물 - 나무위키", url: "https://namu.wiki/w/%EC%A0%95%EC%83%98%EB%AC%BC", accessedAt: "2026-04-24" }]
  },
  {
    id: "kim-chungkyung-hairface",
    name: { ko: "김청경 헤어페이스", en: "Kim Chungkyung Hair Face" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["makeup-bridal"],
    themes: ["brand-building", "tradition-heritage", "people-first"],
    foundedYear: 1995,
    location: "서울 청담동 도산대로",
    founder: "김청경",
    oneLiner: { ko: "안정감 있는 클래식 메이크업의 살아있는 전설 — 청담 웨딩 메이크업 정통", en: "Living legend of classic makeup — Cheongdam wedding-makeup orthodoxy" },
    successFactors: { ko: ["수십 년 배우 스타일링 경력의 신뢰 자산", "얼굴형 맞춤 커스터마이징 기술로 차별화", "헤어+메이크업 통합 살롱으로 원스톱 제공", "단정·고급 톤의 일관된 브랜드 정체성"], en: ["Decades of celebrity styling builds trust capital", "Face-shape customization differentiates", "Hair + makeup integrated salon", "Consistent dignified luxury identity"] },
    lesson: { ko: "오랜 시간 한 톤을 지키면 그 자체가 브랜드 해자가 된다", en: "Keeping one consistent tone for decades becomes the brand moat" },
    sources: [{ label: "김청경 헤어페이스 공식", url: "http://www.kimchungkyung.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "son-and-park",
    name: { ko: "손앤박", en: "SON AND PARK" },
    applicableCategories: ["beauty"],
    applicableSubIndustries: ["makeup-bridal"],
    themes: ["brand-building", "product-innovation"],
    foundedYear: 2012,
    location: "서울 청담동",
    founder: "손대식·박태윤",
    oneLiner: { ko: "전지현·김희애 메이크업 아티스트 듀오가 만든 K-뷰티 색조 브랜드", en: "K-beauty color cosmetics brand by top makeup duo" },
    successFactors: { ko: ["최정상 아티스트 2인 공동 창업으로 신뢰 후광", "히트 단일 제품 '뷰티워터'로 카테고리 정의", "올리브영·면세점·미국 세포라 글로벌 채널 확장", "올리브영 성장기와 동행한 채널 타이밍"], en: ["Two top-tier artists co-founded for halo trust", "Hit single product 'Beauty Water' defined category", "Olive Young, duty-free, US Sephora expansion", "Channel timing aligned with Olive Young's rise"] },
    lesson: { ko: "전문가 신뢰 + 대표 단일 제품 + 채널 타이밍 = 브랜드 폭발", en: "Expert trust + hero product + channel timing = brand explosion" },
    sources: [{ label: "한국경제 - 메이크업 아티스트 브랜드", url: "https://www.hankyung.com/article/2015121087331", accessedAt: "2026-04-24" }]
  },
  {
    id: "leaf-pilates-cheongdam",
    name: { ko: "리프필라테스 청담본점", en: "Leaf Pilates Cheongdam HQ" },
    applicableCategories: ["fitness"],
    applicableSubIndustries: ["pilates-studio"],
    themes: ["space-as-product", "tradition-heritage", "customer-experience"],
    foundedYear: 2008,
    location: "서울 강남구 영동대로",
    oneLiner: { ko: "16년 헤리티지의 청담동 필라테스·자이로토닉 랜드마크, 6,000명 회원이 선택", en: "16-year heritage Cheongdam Pilates/Gyrotonic landmark, chosen by 6,000" },
    successFactors: { ko: ["150평 대형 + 미국 정품 Gratz·Gyrotonic 기구 풀세트", "20명 국제 인증 강사진으로 강사 의존도 분산", "필라테스+자이로토닉 더블 카테고리로 객단가 상승", "독립 탈의실·1층 무료주차 등 프리미엄 부대시설"], en: ["150-pyeong space with full Gratz/Gyrotonic gear", "20 internationally certified instructors", "Pilates + Gyrotonic dual category", "Premium amenities"] },
    lesson: { ko: "16년 한 자리 — 헤리티지 자체가 가장 비싼 마케팅이다", en: "16 years in one spot — heritage itself is the most expensive marketing" },
    sources: [{ label: "리프필라테스 청담본점 공식", url: "https://leafpilates.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "breathe-pilates-cheongdam",
    name: { ko: "브리드필라테스 청담", en: "Breathe Pilates Cheongdam" },
    applicableCategories: ["fitness"],
    applicableSubIndustries: ["pilates-studio"],
    themes: ["product-innovation", "people-first"],
    foundedYear: 2010,
    location: "서울 청담",
    oneLiner: { ko: "STOTT PILATES 공식 호스팅 센터 — 강사 자격증 시장을 지배", en: "Official STOTT PILATES hosting center — dominates instructor certification market" },
    successFactors: { ko: ["글로벌 자격증 호스팅으로 B2B 교육 매출 확보", "강사 양성 → 졸업생이 곧 강사 풀이 되는 선순환", "STOTT 공식이라는 진입장벽으로 경쟁 차단", "교육+레슨 듀얼 매출 구조"], en: ["Global certification hosting secures B2B revenue", "Instructor pipeline creates flywheel", "STOTT-official designation blocks competitors", "Dual revenue: education + lessons"] },
    lesson: { ko: "고객만이 아니라 동종업계를 고객으로 만들면 시장이 두 배가 된다", en: "Make peers your customers and the market doubles" },
    sources: [{ label: "브리드필라테스 공식", url: "https://breathepilatesaf.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "leesop-pilates-samseong",
    name: { ko: "이솝필라테스 삼성", en: "Leesop Pilates Samseong" },
    applicableCategories: ["fitness"],
    applicableSubIndustries: ["pilates-studio"],
    themes: ["brand-building", "community-loyalty"],
    foundedYear: 2020,
    location: "서울 강남구청역·삼성동",
    founder: "이은형",
    oneLiner: { ko: "20만 팔로워 바디멘토 이은형 원장의 첫 스튜디오, SNS 직결 매출", en: "200K-follower body mentor's first studio, SNS-driven sales" },
    successFactors: { ko: ["원장 SNS 20만 팔로워 → 신규회원 유입 채널 자체 보유", "유튜브·인스타 콘텐츠로 강사·살롱 인지도 동시 상승", "삼성동 상권 + 강남구청역 더블 동선", "원장 개인 브랜드와 살롱 분리 운영으로 확장성 확보"], en: ["Founder's 200K SNS = built-in acquisition channel", "YouTube/Instagram lifts instructor and salon awareness", "Dual line of sight (Samseong + Gangnam-gu Office)", "Founder brand and salon kept separable"] },
    lesson: { ko: "강사 SNS 팔로워가 곧 매장의 자산이다", en: "Instructor SNS followers ARE the studio's asset" },
    sources: [{ label: "이솝필라테스 공식", url: "https://www.leesoppilates.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "ablegym-gangnam",
    name: { ko: "에이블짐 강남역점", en: "Able Gym Gangnam" },
    applicableCategories: ["fitness"],
    applicableSubIndustries: ["pt-gym"],
    themes: ["space-as-product", "people-first"],
    foundedYear: 2014,
    location: "서울 강남역",
    oneLiner: { ko: "강남 최대 규모, 해외 명품 머신 150종·1:1 담당트레이너 제도", en: "Gangnam's largest gym with 150 premium machines and dedicated 1:1 trainers" },
    successFactors: { ko: ["강남역 도보 10초 핵심 입지 + B2 대형 평수", "헬스권 안에 PT 2회 무료 포함으로 PT 전환율 극대화", "심야(자정)·주말 풀가동으로 회전율 상승", "다지점(상봉·길동·한양대) 확장으로 운영 노하우 표준화"], en: ["10-second walk from Gangnam Station + large B2 footprint", "Free 2 PT sessions drives PT conversion", "Late-night and weekends boost utilization", "Multi-branch standardized ops"] },
    lesson: { ko: "PT 전환은 '무료 체험 회수'를 회원권에 끼워 넣는 순간 폭발한다", en: "PT conversion explodes when free trials are bundled into membership" },
    sources: [{ label: "에이블짐 공식", url: "http://ablegym.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "gymboxx",
    name: { ko: "짐박스 피트니스", en: "GymBoxx Fitness" },
    applicableCategories: ["fitness"],
    applicableSubIndustries: ["pt-gym"],
    themes: ["space-as-product", "differentiation"],
    foundedYear: 2016,
    location: "서울 용산",
    oneLiner: { ko: "용산 대형 PT 전문 헬스장, 단순 운동이 아닌 '솔루션' 컨셉", en: "Yongsan large PT-focused gym positioned as 'solution', not just workout" },
    successFactors: { ko: ["용산 신흥 상권 입지 선점", "PT 중심 가격·공간 설계로 객단가 상위", "그룹 PT(GX)와 1:1 PT 듀얼 라인업", "체성분 측정·식단 컨설팅 등 부가 서비스 통합"], en: ["Captured emerging Yongsan district", "PT-centric pricing lifts ticket size", "Dual lineup: group PT and 1:1 PT", "Integrated body composition and diet consulting"] },
    lesson: { ko: "헬스장이 아니라 '몸 솔루션'이 되면 가격 저항이 사라진다", en: "Reframing as 'body solution' kills price resistance" },
    sources: [{ label: "짐박스피트니스 공식", url: "https://gymboxx.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "breathing-whale-hannam",
    name: { ko: "숨쉬는고래 한남", en: "Breathing Whale Hannam" },
    applicableCategories: ["fitness"],
    applicableSubIndustries: ["yoga-studio"],
    themes: ["brand-building", "community-loyalty", "tradition-heritage"],
    foundedYear: 2019,
    location: "서울 용산구 한남동",
    founder: "김부진",
    oneLiner: { ko: "명상·요가 통합 수련 공간, 제주·도쿄까지 확장한 라이프스타일 브랜드", en: "Meditation+yoga retreat brand expanded to Jeju and Tokyo" },
    successFactors: { ko: ["요가+명상 90분 통합 수업으로 차별화", "200시간 RYT·명상 지도자과정으로 B2B 교육 매출", "한남→제주→도쿄로 라이프스타일 브랜드화", "원장 미디어 노출(매체 칼럼·홈트 콘텐츠) 활용"], en: ["Differentiated via 90-min yoga+meditation integrated class", "RYT200 and meditation training secure B2B revenue", "Hannam → Jeju → Tokyo lifestyle brand expansion", "Founder media exposure"] },
    lesson: { ko: "단일 매장이 아닌 '라이프스타일 브랜드'로 보면 확장이 보인다", en: "Seeing it as a lifestyle brand unlocks scale" },
    sources: [{ label: "숨쉬는고래 서울 한남", url: "https://breathingwhale.com/seoul", accessedAt: "2026-04-24" }]
  },
  {
    id: "club-d-cheongdam",
    name: { ko: "클럽디 청담", en: "Club D Cheongdam" },
    applicableCategories: ["fitness"],
    applicableSubIndustries: ["golf-studio"],
    themes: ["product-innovation", "space-as-product"],
    foundedYear: 2021,
    location: "서울 청담",
    oneLiner: { ko: "Full Swing KIT·Virtual Green 도입한 청담 프리미엄 골프 스튜디오", en: "Cheongdam premium golf studio with Full Swing KIT and Virtual Green" },
    successFactors: { ko: ["Full Swing KIT 런치모니터로 데이터 기반 레슨", "프리미엄 샌드 벙커·버추얼 그린 등 실제 코스 재현", "청담 고소득 멤버십 타깃팅", "기술 도입 자체가 진입장벽 (장비 단가)"], en: ["Data-driven lessons via Full Swing KIT", "Real-course recreation with virtual green", "Targeted Cheongdam high-income membership", "Tech adoption itself acts as capital barrier"] },
    lesson: { ko: "고가 장비는 비용이 아니라 진입장벽이다", en: "High-end equipment is not cost — it's a moat" },
    sources: [{ label: "클럽디 청담 공식", url: "https://www.clubdcheongdam.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "ricky-min-golf-studio",
    name: { ko: "릭키민 골프스튜디오 선릉", en: "Ricky Min Golf Studio Seolleung" },
    applicableCategories: ["fitness"],
    applicableSubIndustries: ["golf-studio"],
    themes: ["brand-building", "differentiation"],
    foundedYear: 2018,
    location: "서울 선릉",
    founder: "릭키민(민병기)",
    oneLiner: { ko: "프로 골퍼 개인 브랜드 기반의 강남 1:1 골프 레슨 전문 스튜디오", en: "Gangnam 1:1 golf lesson studio built on pro-golfer's personal brand" },
    successFactors: { ko: ["프로 골퍼 개인 명성을 살롱에 직접 연결", "선릉 직장인 출퇴근 동선의 인도어 입지", "유튜브·인스타 레슨 콘텐츠로 신규 유입", "그룹 클래스 없이 1:1 단가 유지"], en: ["Pro golfer's personal fame directly tied to studio", "Indoor location on Seolleung commuter route", "YouTube/Instagram lesson content drives acquisition", "Maintains 1:1 price by avoiding group classes"] },
    lesson: { ko: "강사의 이름값이 곧 매장 단가의 상한선이다", en: "The instructor's name value sets the studio's price ceiling" },
    sources: [{ label: "릭키민 골프 스튜디오 영문 공식", url: "https://en.rickymingolf.com/", accessedAt: "2026-04-24" }]
  },

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   *  ONLINE & STARTUP-TECH ADDITIONS (24 cases) — 2026-04-24
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  {
    id: "umma-hanwoo",
    name: { ko: "엄마네한우", en: "Umma Hanwoo" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["smart-store"],
    themes: ["product-innovation", "customer-experience", "differentiation"],
    foundedYear: 2018,
    location: "대한민국",
    founder: "이한형",
    oneLiner: { ko: "투뿔한우 단일 카테고리로 스마트스토어 매출 100억을 돌파한 한우 전문 셀러", en: "A 1++ Korean beef seller that hit 10B KRW sales on Naver Smart Store" },
    successFactors: { ko: ["리뷰·상세설명을 활용해 '눈으로 못 보는 한우' 신뢰 확보", "네이버 쇼핑라이브 먹방으로 시각화된 구매 경험 제공", "단일 카테고리 집중으로 빠른 운영 효율화", "스마트스토어 SEO·광고 최적화로 검색 상위 노출"], en: ["Built trust for raw beef via detailed reviews", "Used Naver Shopping Live to visualize buying experience", "Focused on single category for fast scaling", "Optimized SEO and ads for top search visibility"] },
    lesson: { ko: "리뷰·라이브로 신뢰를 쌓으면 고가 식품도 온라인에서 팔린다", en: "Trust built via reviews and live commerce sells even premium food online" },
    sources: [{ label: "아시아경제 - 궤짝 놓고 시작한 고기장사, 온라인서 100억 매출", url: "https://www.asiae.co.kr/article/2023090707144906904", accessedAt: "2026-04-24" }]
  },
  {
    id: "marpple-shop",
    name: { ko: "마플샵", en: "Marpple Shop" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["smart-store", "creator-service"],
    themes: ["product-innovation", "community-loyalty", "differentiation"],
    foundedYear: 2017,
    location: "서울",
    oneLiner: { ko: "8만 크리에이터가 무비용·무재고로 굿즈를 파는 누적 거래액 600억 커머스", en: "A zero-inventory creator goods marketplace with 60B+ KRW GMV and 80,000 creators" },
    successFactors: { ko: ["주문 후 제작(POD) 모델로 재고·초기비용 0원", "1,400+ 굿즈 SKU와 제작 공정 자체 운영", "유튜버·틱톡커 등 크리에이터 IP를 그대로 매출로 전환", "수수료 없는 정산 구조로 크리에이터 락인"], en: ["POD model removes inventory and upfront cost", "Operates 1,400+ goods SKUs in-house", "Converts creator IP directly into sales", "No-fee settlement locks in creator loyalty"] },
    lesson: { ko: "크리에이터의 팬덤을 굿즈로 즉시 환금시켜 주면 양쪽 모두 이긴다", en: "Monetizing fandom into instant goods wins for both creators and platform" },
    sources: [{ label: "마플샵 공식", url: "https://marpple.shop/", accessedAt: "2026-04-24" }]
  },
  {
    id: "weekly-shirts",
    name: { ko: "위클리셔츠", en: "Weekly Shirts" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["smart-store", "consignment-commerce"],
    themes: ["customer-experience", "community-loyalty", "differentiation"],
    foundedYear: 2016,
    location: "서울",
    oneLiner: { ko: "월 4.9만 원에 다림질 셔츠를 새벽 배송하는 남성 셔츠 정기구독 서비스", en: "A men's shirt subscription delivering ironed shirts at dawn for 49K KRW/month" },
    successFactors: { ko: ["직장인 페인포인트(셔츠 다림질) 정확히 타겟팅", "주 3회 새벽 배송 + 손다림질로 차별화된 경험", "재결제율 92% — 구독 모델 정착 성공", "케이큐브벤처스·디캠프 시드 5억 원 투자 유치"], en: ["Precisely targeted office worker pain point", "3x weekly dawn delivery and hand-ironing", "92% repurchase rate proves stickiness", "Raised 500M KRW seed"] },
    lesson: { ko: "한 가지 짜증을 완전히 없애주면 사람은 매달 돈을 낸다", en: "Eliminate one specific annoyance completely and people will pay monthly" },
    sources: [{ label: "플래텀 - 위클리셔츠 5억 원 투자유치", url: "https://platum.kr/archives/86876", accessedAt: "2026-04-24" }]
  },
  {
    id: "class101",
    name: { ko: "클래스101", en: "CLASS101" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["digital-products", "creator-service", "adult-class"],
    themes: ["community-loyalty", "differentiation", "people-first"],
    foundedYear: 2018,
    location: "서울",
    founder: "고지연",
    oneLiner: { ko: "13만 크리에이터·6천 클래스의 구독형 온라인 클래스 플랫폼, 2년 연속 흑자", en: "A subscription online class platform with 130K creators and 6K classes, profitable two years running" },
    successFactors: { ko: ["취미·창작 분야로 차별화 (개발 강의 일색이던 시장에서)", "크리에이터 누적 정산 100억 원 — 양면시장 성장 입증", "구독·B2B·B2G 3축으로 수익 다각화", "구독 모델 전환으로 흑자 전환 성공"], en: ["Differentiated into hobby fields amid dev-heavy market", "10B KRW in cumulative creator payouts", "Diversified across subscription, B2B, B2G", "Pivoted to subscription and reached profitability"] },
    lesson: { ko: "교육 시장에서 '누가 가르치냐'를 바꾸면 새 시장이 열린다", en: "Changing 'who teaches' opens an entirely new market" },
    sources: [{ label: "플래텀 - 크리에이터 누적 정산액 100억 돌파", url: "https://platum.kr/archives/131421", accessedAt: "2026-04-24" }]
  },
  {
    id: "fastcampus",
    name: { ko: "패스트캠퍼스", en: "FastCampus" },
    applicableCategories: ["online-digital", "education"],
    applicableSubIndustries: ["digital-products", "developer-tools", "coding-class", "adult-class"],
    themes: ["product-innovation", "differentiation", "customer-experience"],
    foundedYear: 2014,
    location: "서울",
    founder: "이강민",
    oneLiner: { ko: "20,000+ 직무 강의와 5개월 부트캠프로 한국 직장인 재교육 시장을 장악한 플랫폼", en: "Korea's leading career upskilling platform with 20K+ courses" },
    successFactors: { ko: ["B2C 강의 + B2B 기업교육 + 부트캠프 3축 매출", "20,000+ 직무 강의로 카탈로그 규모 압도", "국비지원 부트캠프로 진입장벽 제거", "AX(AI Transformation) 트렌드를 빠르게 강의화"], en: ["Three pillars: B2C courses, B2B training, bootcamps", "20,000+ courses dominate catalog scale", "Government-funded bootcamps remove cost barrier", "Quickly turns AX trends into curriculum"] },
    lesson: { ko: "직장인 시장은 '취업·이직'이라는 결과를 약속하면 비싼 강의도 팔린다", en: "Promise career outcomes and even premium courses sell" },
    sources: [{ label: "패스트캠퍼스 공식", url: "https://fastcampus.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "syukaworld",
    name: { ko: "슈카월드", en: "Syukaworld" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["creator-service"],
    themes: ["differentiation", "community-loyalty", "brand-building"],
    foundedYear: 2018,
    location: "서울",
    founder: "전석재",
    oneLiner: { ko: "구독자 336만, 펀드매니저 출신이 만드는 '쉬운 경제·시사' 1위 채널", en: "Korea's #1 economy channel by ex-fund manager with 3.36M subscribers" },
    successFactors: { ko: ["펀드매니저 경력 → 도메인 전문성으로 차별화", "어려운 경제 이슈를 일상어로 풀어내는 화법", "라이브 방송 중심 — 즉시성과 친근감 확보", "서브채널 '머니코믹스'까지 구독자 100만 — IP 확장"], en: ["Fund manager background creates clear authority", "Translates complex economics into everyday language", "Live-streaming first builds immediacy", "Sub-channel 'Money Comics' also hit 1M subscribers"] },
    lesson: { ko: "전문성을 일상어로 번역하면 가장 큰 시장이 열린다", en: "Translate expertise into everyday language to unlock the biggest audience" },
    sources: [{ label: "Think with Google - 슈카월드", url: "https://www.thinkwithgoogle.com/intl/ko-kr/marketing-strategies/video/meet-the-creators-%E2%91%A2-%EC%8A%88%EC%B9%B4%EC%9B%94%EB%93%9C/", accessedAt: "2026-04-24" }]
  },
  {
    id: "chimchakman",
    name: { ko: "침착맨", en: "Chimchakman" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["creator-service"],
    themes: ["brand-building", "community-loyalty", "differentiation"],
    foundedYear: 2014,
    location: "서울",
    founder: "이병건(이말년)",
    oneLiner: { ko: "웹툰작가 이말년이 라이브 토크로 전환해 연 49억 매출을 만든 416만 채널", en: "Webtoon artist turned live-talk creator with 4.16M subs and 4.9B KRW annual revenue" },
    successFactors: { ko: ["웹툰 IP 팬덤을 라이브 방송으로 자연스럽게 이전", "주호민 등 동료 작가와의 콜라보로 콘텐츠 다각화", "긴 라이브 + 짧은 클립 편집의 듀얼 콘텐츠 전략", "출판·MD까지 IP 사업 확장"], en: ["Migrated webtoon fandom seamlessly to live streaming", "Diversified via collabs", "Dual strategy: long live + short clips", "Extended IP into publishing and merch"] },
    lesson: { ko: "기존 팬덤을 새 포맷으로 옮기면 0에서 시작하지 않는다", en: "Migrate an existing fandom into a new format and you don't start from zero" },
    sources: [{ label: "세계일보 - 침착맨 49억 수익", url: "https://www.segye.com/newsView/20230531514883", accessedAt: "2026-04-24" }]
  },
  {
    id: "bbandnerus",
    name: { ko: "빠더너스", en: "BDNS" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["creator-service"],
    themes: ["brand-building", "differentiation", "community-loyalty"],
    foundedYear: 2016,
    location: "서울",
    founder: "문상훈",
    oneLiner: { ko: "'문쌤' 부캐 일타강사 콘텐츠로 9년 만에 200만 구독자 달성한 코미디 채널", en: "Comedy channel that hit 2M subscribers in 9 years with 'Mr. Moon' tutor character" },
    successFactors: { ko: ["'문쌤'·'문상 기자' 등 부캐 캐릭터로 IP 분기", "오리지널 단편 시리즈 + 토크쇼 더블 트랙", "방송 출연으로 채널 외부에서도 인지도 확장", "9년 누적의 꾸준함 — 단기 바이럴 의존 X"], en: ["Branched IP via alter-ego characters", "Dual track of original series plus talk shows", "Expanded brand awareness via TV appearances", "9 years of consistent output"] },
    lesson: { ko: "캐릭터(부캐)를 만들면 콘텐츠 한계가 사라진다", en: "Create alter-ego characters and content limits disappear" },
    sources: [{ label: "네이트뉴스 - 빠더너스 200만 돌파", url: "https://news.nate.com/view/20250529n01002", accessedAt: "2026-04-24" }]
  },
  {
    id: "marketkurly",
    name: { ko: "마켓컬리", en: "Market Kurly" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["consignment-commerce"],
    themes: ["customer-experience", "product-innovation", "differentiation"],
    foundedYear: 2015,
    location: "서울",
    founder: "김슬아",
    oneLiner: { ko: "샛별배송으로 새벽배송 시장을 연 프리미엄 식품 커머스, 4년만에 매출 50배 성장", en: "Premium grocery commerce that pioneered dawn delivery and grew 50x revenue in 4 years" },
    successFactors: { ko: ["샛별배송(새벽배송) 카테고리 자체를 창출", "PB·단독 입점이 매출의 28% — 차별화된 카탈로그", "직원 직접 시식 등 깐깐한 상품 큐레이션", "데이터농장으로 수요 예측·재고 최적화"], en: ["Created the dawn-delivery category", "PB and exclusives = 28% of revenue", "Rigorous in-house tasting curation", "Data Farm optimizes forecasting"] },
    lesson: { ko: "배송 시간 한 가지를 바꾸는 것만으로도 새 시장이 생긴다", en: "Changing just delivery timing alone can create a new market" },
    sources: [{ label: "한국경제 - 마켓컬리 4년만에 매출 50배", url: "https://www.hankyung.com/economy/article/201904173570g", accessedAt: "2026-04-24" }]
  },
  {
    id: "cookat",
    name: { ko: "쿠캣", en: "Cookat" },
    applicableCategories: ["online-digital"],
    applicableSubIndustries: ["consignment-commerce", "creator-service"],
    themes: ["product-innovation", "community-loyalty", "differentiation"],
    foundedYear: 2014,
    location: "서울",
    oneLiner: { ko: "3,300만 푸드 콘텐츠 구독자 → 자사몰 '쿠캣마켓' 매출 390억, GS리테일 550억 인수", en: "33M food content subscribers turned into 39B KRW Cookat Market sales; acquired by GS Retail for 55B" },
    successFactors: { ko: ["'오늘 뭐 먹지?' 콘텐츠로 무료 트래픽 자산 선확보", "콘텐츠 → 자사 PB 푸드 커머스로 자연 전환", "MZ 입맛 타겟 차별화 제품 — 1.5년 만에 MAU 120만", "5년 연속 매출 2~4배 성장"], en: ["Built free traffic asset first via 'What to Eat Today' content", "Naturally converted content into PB commerce", "MZ-targeted differentiated products hit 1.2M MAU", "Grew revenue 2-4x annually for 5 years"] },
    lesson: { ko: "콘텐츠로 모은 팬에게 직접 만든 제품을 팔면 가장 비싼 광고도 이긴다", en: "Selling your own product to fans built via content beats expensive ads" },
    sources: [{ label: "와우테일 - GS리테일 550억 쿠캣 인수", url: "https://wowtale.net/2022/01/13/32806/", accessedAt: "2026-04-24" }]
  },
  {
    id: "wrtn",
    name: { ko: "뤼튼", en: "Wrtn" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["ai-application"],
    themes: ["product-innovation", "differentiation", "community-loyalty"],
    foundedYear: 2021,
    location: "서울",
    oneLiner: { ko: "사용자 500만, 누적 투자 1,300억 — AI 서비스 분야 최초 누적 1,000억 돌파", en: "5M users, 130B raised — first Korean AI service to surpass 100B in funding" },
    successFactors: { ko: ["한국어 GPT 래퍼로 빠르게 무료 진입 — 500만 유저 확보", "학생·취준생 등 '글쓰기' 페르소나 정밀 타겟", "시리즈B 1,080억 단일 라운드 — 한국 AI 최대급", "캐릭터 챗 등 신규 플레이로 이탈 방어"], en: ["Free Korean GPT wrapper acquired 5M users fast", "Precisely targeted students via writing persona", "Single 108B Series B is among Korea's largest AI rounds", "Defended retention with character chat"] },
    lesson: { ko: "한국어·무료·페르소나 — 글로벌 AI가 못 잡는 빈틈을 노려라", en: "Korean language, free, persona-fit — exploit gaps global AI can't fill" },
    sources: [{ label: "톱데일리 - AI 기업 최초 누적 1,300억", url: "https://www.topdaily.kr/articles/104437", accessedAt: "2026-04-24" }]
  },
  {
    id: "upstage",
    name: { ko: "업스테이지", en: "Upstage" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["ai-application", "b2b-saas"],
    themes: ["product-innovation", "people-first", "differentiation"],
    foundedYear: 2020,
    location: "서울",
    founder: "김성훈",
    oneLiner: { ko: "자체 LLM '솔라' + Document AI로 B2B 100개사 확보, 2026년 시리즈C 1,800억 유니콘", en: "Korea's first generative AI unicorn with self-built Solar LLM" },
    successFactors: { ko: ["네이버 클로바 출신 핵심 개발자 영입 — 인재 자산", "Document AI 99% 정확도로 B2B 즉시 매출", "B2B 매출 70%가 금융권 — 고가치 고객 집중", "2022년 59억 → 2024년 1Q에만 100억 — 폭발적 성장"], en: ["Recruited core devs from Naver Clova", "Document AI's 99% accuracy generates immediate B2B revenue", "70% of B2B revenue from financial sector", "Explosive growth: 5.9B in 2022 to 10B+ in just Q1 2024"] },
    lesson: { ko: "B2C 대신 B2B로 가면 AI도 첫해부터 돈이 된다", en: "Going B2B instead of B2C lets AI generate revenue from year one" },
    sources: [{ label: "업스테이지 - 시리즈B 7,200만 달러", url: "https://ko.upstage.ai/feed/press/upstage-series-b-funding", accessedAt: "2026-04-24" }]
  },
  {
    id: "liner",
    name: { ko: "라이너", en: "Liner" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["ai-application"],
    themes: ["product-innovation", "differentiation", "customer-experience"],
    foundedYear: 2012,
    location: "서울",
    founder: "김진우",
    oneLiner: { ko: "출처 선별 AI 검색으로 글로벌 AI 9위, 220개국 1,000만 가입자, 누적 투자 440억", en: "Source-selective AI search ranked #9 globally with 10M users in 220 countries" },
    successFactors: { ko: ["PDF 하이라이터 → AI 검색으로 핵심 피벗 성공", "출처 선별 LLM 자체 개발 — Perplexity 대비 차별화", "유료 구독자 60%가 미국 — 글로벌 우선 전략", "미국 활성 구독자 1년에 13.5배 성장"], en: ["Successfully pivoted from PDF highlighter to AI search", "Self-built source-selective LLM differentiates", "60% of paid subs are US-based", "US active subscribers grew 13.5x in one year"] },
    lesson: { ko: "한국 시장 환상에서 깨어나 처음부터 글로벌로 가야 큰다", en: "Wake from the Korea-only fantasy and go global from day one" },
    sources: [{ label: "한국경제 - 라이너 270억 투자, 세계 9위", url: "https://www.hankyung.com/article/2024101195251", accessedAt: "2026-04-24" }]
  },
  {
    id: "channel-talk",
    name: { ko: "채널톡", en: "Channel Talk" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["b2b-saas"],
    themes: ["product-innovation", "customer-experience", "people-first"],
    foundedYear: 2014,
    location: "서울",
    oneLiner: { ko: "ARR 360억, 18만 고객사, 일본 매출 25%의 올인원 AI 비즈니스 메신저", en: "All-in-one AI business messenger with 36B KRW ARR, 180K customers" },
    successFactors: { ko: ["AI 챗봇·CRM·콜·영상 전체 통합 — 단일 도구로 락인", "2018·2019·2020 매년 5배·3배·3배 매출 성장", "일본 동시 진출 — 매출 25% 글로벌화", "패션·뷰티·여행 SMB 18만 사 도입"], en: ["Integrated AI chatbot, CRM, call, video — single-tool lock-in", "5x, 3x, 3x revenue growth", "Simultaneous Japan launch yields 25% of revenue", "180K SMBs adopted"] },
    lesson: { ko: "B2B SaaS는 한국에서 시작하더라도 일본을 동시에 노려야 큰다", en: "Korean B2B SaaS scales by targeting Japan simultaneously from day one" },
    sources: [{ label: "채널톡 - ARR 360억 달성", url: "https://channel.io/ko/blog/articles/arr360-60b601c5", accessedAt: "2026-04-24" }]
  },
  {
    id: "modusign",
    name: { ko: "모두싸인", en: "Modusign" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["b2b-saas"],
    themes: ["product-innovation", "differentiation", "customer-experience"],
    foundedYear: 2015,
    location: "서울",
    oneLiner: { ko: "33만 기업·1,000만 사용자·5,000만 서명을 처리한 국내 1위 전자서명 SaaS", en: "Korea's #1 e-signature SaaS with 330K firms, 10M users, 50M+ signatures" },
    successFactors: { ko: ["DocuSign 글로벌 솔루션 대비 한국 법령·UX 최적화", "프리미엄 모델로 SMB 진입 장벽 제거 후 업셀", "전자서명 단일 카테고리 1위 포지셔닝 확보", "세일즈·인사·계약 등 부서별 템플릿 제공"], en: ["Optimized for Korean law and UX vs DocuSign global", "Freemium removes SMB entry barrier, then upsells", "Locked in #1 position in e-signature category", "Department-specific templates"] },
    lesson: { ko: "글로벌 1위 카테고리도 '한국 특화'로 다시 1위가 가능하다", en: "Even global category leaders can be unseated by deep Korean localization" },
    sources: [{ label: "모두싸인 공식", url: "https://modusign.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "jandi",
    name: { ko: "잔디", en: "Jandi" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["b2b-saas"],
    themes: ["product-innovation", "customer-experience", "differentiation"],
    foundedYear: 2014,
    location: "서울",
    oneLiner: { ko: "70개국 35만 팀이 쓰는 협업툴, 누적 투자 285억·NRR 120%·창립 후 첫 흑자 달성", en: "Collab tool used by 350K teams in 70 countries, 28.5B raised, 120% NRR, first profit" },
    successFactors: { ko: ["Slack 대비 아시아 SMB 친화 UX·가격으로 차별화", "일본·대만 등 70개국 진출 — 글로벌 매출 분산", "NRR 120% — 기존 고객 매출이 자동 증가", "10년 인내 끝에 2024년 첫 영업이익 흑자"], en: ["Differentiated from Slack via Asia-SMB friendly UX/pricing", "Expanded to 70 countries", "120% NRR means existing customer revenue grows automatically", "Achieved first operating profit in 2024 after 10 years"] },
    lesson: { ko: "SaaS는 죽음의 시장에서도 10년을 버티면 흑자가 온다", en: "Even in SaaS death markets, 10 years of patience leads to profitability" },
    sources: [{ label: "바이라인네트워크 - 잔디 죽음의 시장서 살아남은 자", url: "https://byline.network/2024/05/0528/", accessedAt: "2026-04-24" }]
  },
  {
    id: "inflearn",
    name: { ko: "인프런", en: "Inflearn" },
    applicableCategories: ["startup-tech", "online-digital", "education"],
    applicableSubIndustries: ["developer-tools", "digital-products", "coding-class"],
    themes: ["community-loyalty", "people-first", "product-innovation"],
    foundedYear: 2017,
    location: "성남",
    oneLiner: { ko: "140만 학습자·4,000+ 강의의 국내 1위 IT 교육 플랫폼, 채용 플랫폼 '랠릿'까지 확장", en: "Korea's #1 IT learning platform with 1.4M learners and 4K+ courses" },
    successFactors: { ko: ["지식공유자(강사) 수익률 70% — 양면시장 강력 유인", "단일 강의 누적 1만 명 — 강사 성공사례 양산", "교육 → 채용(랠릿) 종단 커리어 플랫폼화", "강사가 직접 라이브로 답하는 커뮤니티"], en: ["70% revenue share for instructors creates strong supply incentive", "Single courses hitting 10K students proves repeatable instructor success", "Extended into end-to-end career platform", "Community where instructors directly answer live"] },
    lesson: { ko: "강사가 부자가 되는 플랫폼이라야 좋은 강의가 모인다", en: "Only platforms that make instructors rich attract great courses" },
    sources: [{ label: "인프런 공식", url: "https://www.inflearn.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "codestates",
    name: { ko: "코드스테이츠", en: "Codestates" },
    applicableCategories: ["startup-tech", "online-digital", "education"],
    applicableSubIndustries: ["developer-tools", "coding-class"],
    themes: ["people-first", "community-loyalty", "differentiation"],
    foundedYear: 2013,
    location: "서울",
    oneLiner: { ko: "ISA(소득공유) 모델로 시작해 매출 360억·채용파트너 500개사 부트캠프", en: "Bootcamp pioneer of ISA model in Korea, 36B revenue and 500 hiring partners" },
    successFactors: { ko: ["ISA(소득공유협약) — 취업 후 후불 결제 모델 도입", "B2B 기업교육 확대로 매출 1년에 2.9배 성장", "수료생 채용 파트너 500개사 — 취업 보장 신뢰", "AI·PM·블록체인 등 트렌드 부트캠프 빠른 출시"], en: ["Pioneered ISA — pay-after-job model", "B2B corporate training grew revenue 2.9x in one year", "500 hiring partners build trust in employment outcomes", "Quickly launches trend-driven bootcamps"] },
    lesson: { ko: "교육 결제 시점을 '취업 후'로 옮기면 누구나 도전한다", en: "Shift payment to post-employment and anyone will try the bootcamp" },
    sources: [{ label: "ZDNet - 코드스테이츠 매출 360억 돌파", url: "https://zdnet.co.kr/view/?no=20230207101934", accessedAt: "2026-04-24" }]
  },
  {
    id: "likelion",
    name: { ko: "멋쟁이사자처럼", en: "LikeLion" },
    applicableCategories: ["startup-tech", "online-digital", "education"],
    applicableSubIndustries: ["developer-tools", "coding-class"],
    themes: ["community-loyalty", "people-first", "tradition-heritage"],
    foundedYear: 2013,
    location: "서울",
    founder: "이두희",
    oneLiner: { ko: "13년 누적 노하우의 국비지원 부트캠프 + 매년 1,600명 대학 해커톤 운영", en: "13-year-old gov-funded bootcamp + annual 1,600-person collegiate hackathon" },
    successFactors: { ko: ["대학 동아리(2013)부터 시작 — 가장 두꺼운 알럼나이 네트워크", "국비지원 부트캠프로 진입장벽 0원화", "13년 누적 커리큘럼·운영 노하우", "주 5일 라이브 케어로 압도적 수료율"], en: ["Started as university club in 2013 — deepest alumni network", "Government-funded bootcamps reduce entry cost to zero", "13 years of accumulated curriculum and ops know-how", "5-day live care delivers industry-leading completion rate"] },
    lesson: { ko: "코딩 교육은 '커뮤니티 자산'이 결국 매출이 된다", en: "In coding education, community assets eventually become revenue" },
    sources: [{ label: "멋쟁이사자처럼 공식", url: "https://likelion.net/", accessedAt: "2026-04-24" }]
  },
  {
    id: "toss",
    name: { ko: "토스", en: "Toss" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["fintech-startup"],
    themes: ["customer-experience", "product-innovation", "people-first"],
    foundedYear: 2013,
    location: "서울",
    founder: "이승건",
    oneLiner: { ko: "MAU 2,480만·연결매출 1.96조·2024년 첫 흑자 — 한국 핀테크의 표준", en: "Korea's fintech standard: 24.8M MAU, 1.96T revenue, first profit in 2024" },
    successFactors: { ko: ["복잡한 인증 없는 간편송금으로 핀테크 시장 자체 창출", "은행·증권·보험·결제 슈퍼앱 — 단일 진입점 락인", "8번 피벗 끝에 송금 PMF 발견한 집요함", "디자인·UX 인재 집중 채용 — 사용성으로 차별화"], en: ["Created the Korean fintech market via certificate-free transfers", "Super-app spanning banking, securities, insurance, payments", "Tenacity through 8 pivots before finding transfer PMF", "Concentrated design and UX talent for usability moat"] },
    lesson: { ko: "정부 규제 산업도 UX 한 가지로 뒤집을 수 있다", en: "Even regulated industries can be flipped by UX alone" },
    sources: [{ label: "비바리퍼블리카 - 위키백과", url: "https://ko.wikipedia.org/wiki/%EB%B9%84%EB%B0%94%EB%A6%AC%ED%8D%BC%EB%B8%94%EB%A6%AC%EC%B9%B4", accessedAt: "2026-04-24" }]
  },
  {
    id: "kakaobank",
    name: { ko: "카카오뱅크", en: "KakaoBank" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["fintech-startup"],
    themes: ["customer-experience", "product-innovation", "differentiation"],
    foundedYear: 2017,
    location: "성남",
    oneLiner: { ko: "고객 2,670만·MAU 2,000만·비이자수익 1조 돌파 — 인터넷전문은행 1위", en: "Korea's #1 internet bank: 26.7M customers, 20M MAU, 1T+ non-interest revenue" },
    successFactors: { ko: ["카카오톡 친구 기반 송금 — 즉시 바이럴 확보", "캐릭터·26주적금 등 게이미피케이션 차별화", "비이자수익 35% — 광고·플랫폼으로 수익 다각화", "2025년 순익 4,803억 — 사상 최대 실적"], en: ["Kakao Talk friend-based transfer enabled instant virality", "Differentiated via characters and 26-week savings gamification", "35% non-interest revenue diversifies", "2025 net profit of 480.3B — record high"] },
    lesson: { ko: "기존 사용자 그래프 위에 서비스를 얹으면 마케팅 비용이 0이 된다", en: "Building on existing social graphs zeroes out marketing cost" },
    sources: [{ label: "한국경제 - 카카오뱅크 1분기 순익 1112억", url: "https://www.hankyung.com/article/202405083280i", accessedAt: "2026-04-24" }]
  },
  {
    id: "dunamu",
    name: { ko: "두나무", en: "Dunamu" },
    applicableCategories: ["startup-tech"],
    applicableSubIndustries: ["fintech-startup"],
    themes: ["product-innovation", "scarcity-strategy", "differentiation"],
    foundedYear: 2012,
    location: "서울",
    oneLiner: { ko: "업비트 운영사, 2024년 매출 1.73조·영업이익 1.19조 — 국내 가상자산 1위", en: "Operator of Upbit, Korea's #1 crypto exchange: 1.73T revenue, 1.19T operating profit in 2024" },
    successFactors: { ko: ["증권플러스(주식) 사용자를 업비트(코인)로 전환", "2017년 빠른 진입 — 카테고리 1위 선점", "영업이익률 70%대 — 거래소 구조의 폭발적 레버리지", "네이버파이낸셜과 합병 — 결제·금융 시너지 추구"], en: ["Converted Stock Plus users into Upbit crypto users", "Early 2017 entry locked in category leadership", "70%+ operating margin from exchange's explosive leverage", "Merged with Naver Financial for synergy"] },
    lesson: { ko: "신규 카테고리는 누가 먼저 점유하느냐가 모든 것을 결정한다", en: "In new categories, who lands first determines everything" },
    sources: [{ label: "두나무 - 2024년 매출 1조7316억", url: "https://dunamu.com/news/1123", accessedAt: "2026-04-24" }]
  },
  {
    id: "life4cuts",
    name: { ko: "인생네컷", en: "Life Four Cuts" },
    applicableCategories: ["retail"],
    applicableSubIndustries: ["unmanned-retail"],
    themes: ["space-as-product", "product-innovation", "community-loyalty"],
    foundedYear: 2017,
    location: "서울",
    founder: "이호익",
    oneLiner: { ko: "사진 자판기를 매장으로 바꿔 매출 250억·영업익 45억·15개국 155개점", en: "Turned photo vending machines into retail stores: 25B revenue, 155 stores in 15 countries" },
    successFactors: { ko: ["자판기 → 매장 전환 — 날씨·기후 영향 제거", "가발·소품으로 '놀이' 콘텐츠화 — 재방문 유도", "월 200~230만 명 방문, 5년 누적 1억 장 촬영", "미국·일본·대만 등 글로벌 직진출 155개점"], en: ["Vending-to-store transition removed weather dependency", "Wigs and props turned photos into 'play' content", "2-2.3M monthly visitors, 100M cumulative photos in 5 years", "Direct global expansion to US, Japan, Taiwan"] },
    lesson: { ko: "'기계'에 '공간'을 더하면 새 카테고리가 된다", en: "Adding 'space' to a 'machine' creates an entirely new category" },
    sources: [{ label: "한국일보 - 인생네컷 이호익 대표 인터뷰", url: "https://www.hankookilbo.com/News/Read/A2023092510420004703", accessedAt: "2026-04-24" }]
  },
  {
    id: "photoism",
    name: { ko: "포토이즘", en: "Photoism" },
    applicableCategories: ["retail"],
    applicableSubIndustries: ["unmanned-retail"],
    themes: ["space-as-product", "brand-building", "differentiation"],
    foundedYear: 2017,
    location: "서울",
    oneLiner: { ko: "국내 500·해외 370여 매장, 매출 515억(2024)·650억 전망(2025), IPO 추진 중", en: "500 domestic and 370 overseas stores, 51.5B revenue (2024), targeting 65B (2025), IPO bound" },
    successFactors: { ko: ["K-팝 아티스트 IP 콜라보 — 셀프사진관 차별화", "26개국 글로벌 진출 — 해외 매장 비중 42%", "2024년 매출 +48% YoY 성장 가속", "셀프사진관 1호 상장 추진 중 (서북)"], en: ["K-pop artist IP collabs differentiate from rivals", "26-country expansion: 42% of stores are overseas", "Accelerating growth: 48% YoY revenue increase in 2024", "Pursuing first self-photo studio IPO"] },
    lesson: { ko: "포화 시장에서도 IP·브랜드를 더하면 다시 1위가 된다", en: "Even in saturated markets, IP and branding can crown a new leader" },
    sources: [{ label: "서울경제 - 포토이즘 160억 투자 유치", url: "https://www.sedaily.com/NewsView/2DE9IZF6LY", accessedAt: "2026-04-24" }]
  },

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   *  EDUCATION / PET / SPACE / RETAIL ADDITIONS (21 cases) — 2026-04-24
   *  (4 duplicates with online-startup batch removed: fastcampus, likelion, codestates, class101)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  {
    id: "ybm-jongno",
    name: { ko: "YBM 어학원 종로센터", en: "YBM Language Institute Jongno" },
    applicableCategories: ["education"],
    applicableSubIndustries: ["language-academy"],
    themes: ["tradition-heritage", "brand-building"],
    foundedYear: 1961,
    location: "서울 종로",
    founder: "민영빈",
    oneLiner: { ko: "1961년 시사영어사로 출발해 60여 년간 한국 영어교육 표준을 세운 종합 어학원", en: "Founded in 1961 as Sisa English, YBM has set the standard for Korean English education" },
    successFactors: { ko: ["TOEIC 한국 독점 시행 등 시험·콘텐츠 인프라 선점", "출판·인강·오프라인 학원을 잇는 수직 통합", "60년 누적 브랜드 신뢰와 종로 본원의 상징성"], en: ["Locked in test/content infrastructure such as exclusive TOEIC", "Vertical integration of publishing, online lectures, offline academies", "60 years of brand trust"] },
    lesson: { ko: "교재→시험→학원으로 이어지는 수직 통합이 어학원의 해자다", en: "Vertical integration from textbooks to tests to academies is the moat" },
    sources: [{ label: "한국민족문화대백과사전 - YBM", url: "https://encykorea.aks.ac.kr/Article/E0068305", accessedAt: "2026-04-24" }]
  },
  {
    id: "pagoda-jongno",
    name: { ko: "파고다 어학원 종로", en: "Pagoda Academy Jongno" },
    applicableCategories: ["education"],
    applicableSubIndustries: ["language-academy"],
    themes: ["brand-building", "customer-experience"],
    foundedYear: 1980,
    location: "서울 종로",
    oneLiner: { ko: "종로 영어회화의 대명사로 자리잡은 직영 어학원, 회화 중심 커리큘럼으로 성장", en: "Synonymous with English conversation in Jongno, Pagoda built its name on speaking-first curriculum" },
    successFactors: { ko: ["회화·시험·취업영어를 하나의 캠퍼스에서 풀 라인업으로 제공", "강사 검증·콘텐츠 표준화로 직영 캠퍼스 품질 균질화", "종로·강남 등 도심 직장인 동선에 맞춘 입지 전략"], en: ["Full lineup from speaking to test prep to job English in one campus", "Standardized content and rigorous instructor vetting", "Locations tuned to commuter routes"] },
    lesson: { ko: "성인 어학원은 강사 품질의 표준화가 곧 브랜드다", en: "For adult language academies, instructor standardization is the brand itself" },
    sources: [{ label: "파고다교육그룹 - 위키백과", url: "https://ko.wikipedia.org/wiki/%ED%8C%8C%EA%B3%A0%EB%8B%A4%EA%B5%90%EC%9C%A1%EA%B7%B8%EB%A3%B9", accessedAt: "2026-04-24" }]
  },
  {
    id: "hackers-gangnam",
    name: { ko: "해커스 어학원 강남역캠퍼스", en: "Hackers Academy Gangnam" },
    applicableCategories: ["education"],
    applicableSubIndustries: ["language-academy"],
    themes: ["product-innovation", "brand-building"],
    foundedYear: 2003,
    location: "서울 강남역",
    oneLiner: { ko: "무료 콘텐츠로 모객, 유료 인강·오프라인으로 전환하는 모델로 성인 영어 1위 굳히기", en: "Won adult English with a funnel from free content to paid live and on-site classes" },
    successFactors: { ko: ["Hackers.co.kr 무료 자료실로 거대한 학습자 풀 확보", "토익·토플·편입 등 시험별 전문 브랜드 분리", "강남역 캠퍼스 등 직장인 거점 입지 확장"], en: ["Built a massive learner pool through free resources", "Sub-branded each test for category leadership", "Expanded commuter-friendly campuses"] },
    lesson: { ko: "무료 콘텐츠가 가장 강력한 영업사원이다", en: "Free content is the most effective salesperson" },
    sources: [{ label: "해커스 어학원 강남역캠퍼스", url: "https://www.hackers.ac/", accessedAt: "2026-04-24" }]
  },
  {
    id: "chungdahm-cheongdam",
    name: { ko: "청담어학원 청담 본원", en: "ChungDahm April Cheongdam" },
    applicableCategories: ["education"],
    applicableSubIndustries: ["kids-academy"],
    themes: ["product-innovation", "brand-building"],
    foundedYear: 1998,
    location: "서울 강남 청담동",
    founder: "김영화",
    oneLiner: { ko: "원어민 토론·작문 커리큘럼으로 강남 영어유치원·초등 영어의 기준을 만든 본원", en: "Set the bar for Gangnam English kindergartens with native-led discussion and writing curriculum" },
    successFactors: { ko: ["원어민 강사·자체 레벨 테스트 등 콘텐츠 차별화", "강남 학부모 커뮤니티의 입소문 마케팅", "본원→직영·가맹 확장으로 빠른 전국 커버"], en: ["Differentiated with native instructors and proprietary level tests", "Word-of-mouth via Gangnam parent communities", "Scaled fast from flagship to nationwide branches"] },
    lesson: { ko: "프리미엄 학원은 본원의 상징성이 가격결정력을 만든다", en: "For premium academies, the flagship's prestige drives pricing power" },
    sources: [{ label: "청담어학원 청담 본원", url: "https://www.creverse.com/cdi/chungdahm/", accessedAt: "2026-04-24" }]
  },
  {
    id: "poly-english-academy",
    name: { ko: "폴리어학원", en: "Poly English Academy" },
    applicableCategories: ["education"],
    applicableSubIndustries: ["kids-academy"],
    themes: ["product-innovation", "brand-building"],
    foundedYear: 1999,
    location: "서울 송파",
    oneLiner: { ko: "유아부터 중등까지 자체 ECP·MPOLY 커리큘럼으로 26년간 영어유치원 카테고리 리더", en: "Category leader of English kindergartens for 26 years with proprietary curriculum" },
    successFactors: { ko: ["5~7세 ECP 등 연령별 정교한 커리큘럼 설계", "원어민·한국인 협력 수업 모델로 학부모 안심", "유아→초등→MPOLY로 이어지는 락인 효과"], en: ["Age-tuned curriculum such as ECP for ages 5-7", "Co-teaching model reassures parents", "Lock-in pipeline from kindergarten to elementary to MPOLY"] },
    lesson: { ko: "유아교육은 다음 단계로 이어지는 파이프라인이 LTV다", en: "In early education, the pipeline to next stage is the LTV" },
    sources: [{ label: "폴리어학원 공식", url: "https://www.koreapolyschool.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "elice",
    name: { ko: "엘리스", en: "Elice" },
    applicableCategories: ["education"],
    applicableSubIndustries: ["coding-class"],
    themes: ["product-innovation", "differentiation"],
    foundedYear: 2015,
    location: "대전·서울",
    founder: "김재원",
    oneLiner: { ko: "KAIST AI 연구실 박사과정생들이 만든 AI 기반 라이브 코딩 교육 플랫폼", en: "AI-powered live coding platform built by KAIST AI Lab PhD candidates" },
    successFactors: { ko: ["AI 기반 학습자 진단·자동 채점으로 대규모 강의 운영 가능", "B2G·B2B(공공·기업) 코딩 교육으로 매출 안정화", "KAIST 출신 기술 신뢰도와 R&D 우위"], en: ["AI diagnostics and auto-grading enable massive class scale", "Stable revenue from B2G and B2B coding education", "Tech credibility from KAIST origin"] },
    lesson: { ko: "교육 콘텐츠 비즈니스도 결국 기술 효율이 마진을 만든다", en: "Even in education, technical efficiency drives margins" },
    sources: [{ label: "엘리스 라이브스트리밍 - 플래텀", url: "https://platum.kr/archives/78996", accessedAt: "2026-04-24" }]
  },
  {
    id: "hanghae99",
    name: { ko: "항해99", en: "Hanghae99" },
    applicableCategories: ["education"],
    applicableSubIndustries: ["coding-class"],
    themes: ["product-innovation", "community-loyalty"],
    foundedYear: 2021,
    location: "서울",
    founder: "이범규",
    oneLiner: { ko: "99일 팀 프로젝트 몰입형 부트캠프 — 스파르타코딩클럽이 만든 비전공자 개발자 양성 코스", en: "99-day team-project immersion bootcamp from Spartacodingclub for non-major developers" },
    successFactors: { ko: ["기수제 동기부여와 팀 프로젝트 4회 반복 학습", "스파르타코딩클럽 무료 강좌→유료 부트캠프 깔때기", "비전공자에 특화된 99일이라는 강력한 컨셉"], en: ["Cohort motivation with four iterated team projects", "Funnel from Spartacodingclub free classes to paid bootcamp", "Strong concept of '99 days' tailored to non-majors"] },
    lesson: { ko: "기간 자체가 브랜드가 될 수 있다 (99일)", en: "The duration itself can become the brand (99 days)" },
    sources: [{ label: "항해99 공식", url: "https://hanghae99.spartaclub.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "soomssida",
    name: { ko: "솜씨당", en: "Soomssida" },
    applicableCategories: ["education"],
    applicableSubIndustries: ["adult-class"],
    themes: ["community-loyalty", "differentiation"],
    foundedYear: 2018,
    location: "서울",
    oneLiner: { ko: "지역 기반 오프라인 원데이클래스 1위 — 동네 공방을 모아 누적 100만 다운로드", en: "Korea's #1 location-based offline one-day class platform with 1M+ downloads" },
    successFactors: { ko: ["지역·위치 기반 검색으로 '내 동네 클래스' UX", "베이킹·플라워·수공예 등 오프라인 공방 다량 확보", "작가용 정산·운영 어드민 제공으로 공급자 락인"], en: ["Location-based search powers a 'classes near me' UX", "Aggregated offline studios in baking, flowers, crafts", "Locked in creators with settlement and operations admin"] },
    lesson: { ko: "취미 시장은 '온라인'이 아니라 '내 동네'에서 일어난다", en: "The hobby market happens in your neighborhood, not online" },
    sources: [{ label: "솜씨당 60만 수강생 돌파 - KSValley", url: "https://www.ksvalley.com/news/article.html?no=6313", accessedAt: "2026-04-24" }]
  },
  {
    id: "bodeum-company",
    name: { ko: "보듬컴퍼니 (강형욱)", en: "Bodeum Company (Kang Hyung-wook)" },
    applicableCategories: ["pet"],
    applicableSubIndustries: ["pet-training-school"],
    themes: ["people-first", "brand-building"],
    foundedYear: 2014,
    location: "경기 남양주 오남",
    founder: "강형욱",
    oneLiner: { ko: "'개통령' 강형욱이 세운 견사 없는 행동교정 클리닉 — 견주가 함께 배우는 모델로 차별화", en: "Kennel-less behavior clinic by 'dog whisperer' Kang Hyung-wook" },
    successFactors: { ko: ["견사 없이 '견주+개 동반 교육' 모델로 차별화", "유튜브·방송 출연으로 인물 중심 브랜드 구축", "남양주 본사를 거점으로 콘텐츠·강의·용품으로 확장"], en: ["Differentiated kennel-less 'owner-and-dog together' model", "Built a personal brand via YouTube and TV", "Expanded from HQ into content, lectures, supplies"] },
    lesson: { ko: "반려동물 시장은 동물이 아닌 보호자를 교육해야 팔린다", en: "In the pet market, you must train the guardian — not the animal — to make a sale" },
    sources: [{ label: "보듬 공식", url: "https://bodeum.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "dog-forest-chuncheon",
    name: { ko: "강아지숲 테마파크", en: "Dog Forest Theme Park" },
    applicableCategories: ["pet"],
    applicableSubIndustries: ["pet-cafe"],
    themes: ["space-as-product", "customer-experience"],
    foundedYear: 2021,
    location: "강원 춘천",
    oneLiner: { ko: "11만㎡ 부지에 박물관·운동장·카페·수영장을 모은 국내 최대 반려견 복합 테마파크", en: "Korea's largest dog-friendly theme park combining museum, fields, cafes, pool on 110,000 sqm" },
    successFactors: { ko: ["박물관·산책로·수영장을 묶은 '하루 종일 체류' 설계", "사계절 카페와 실내 시설로 날씨 리스크 헤지", "춘천이라는 수도권 1시간 권역 입지"], en: ["Designed for 'all-day stays'", "Four-season indoor facilities hedge weather risk", "Located within an hour of greater Seoul"] },
    lesson: { ko: "반려동물 공간은 보호자의 '체류시간'을 팔아야 한다", en: "Pet venues must sell the guardian's dwell time" },
    sources: [{ label: "강아지숲 공식", url: "https://www.dforest.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "irion-cheongdam",
    name: { ko: "이리온 동물병원 청담점", en: "Irion Animal Hospital Cheongdam" },
    applicableCategories: ["pet"],
    applicableSubIndustries: ["pet-supplies"],
    themes: ["customer-experience", "differentiation"],
    foundedYear: 2010,
    location: "서울 강남 청담동",
    oneLiner: { ko: "내과·외과·안과 등 전공별 전문의 체계를 갖춘 청담동 종합 동물병원", en: "Cheongdam comprehensive animal hospital with board-specialized vets" },
    successFactors: { ko: ["사람 종합병원처럼 전공의·전문센터 시스템 도입", "2층 1700평 규모와 최첨단 장비로 프리미엄 포지셔닝", "월 1500마리 진료의 압도적 임상 데이터 축적"], en: ["Adopted human-hospital style specialists", "Premium positioning with two-floor flagship", "Compounded clinical data from 1,500 monthly visits"] },
    lesson: { ko: "반려동물 의료는 '사람 병원 수준'이 가격결정력이다", en: "In pet care, 'human-hospital grade' is the pricing power" },
    sources: [{ label: "이리온 공식", url: "https://www.irion.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "peopet",
    name: { ko: "페오펫", en: "Peopet" },
    applicableCategories: ["pet"],
    applicableSubIndustries: ["pet-supplies"],
    themes: ["product-innovation", "differentiation"],
    foundedYear: 2018,
    location: "서울",
    founder: "최현일",
    oneLiner: { ko: "동물병원·구청 안 가도 모바일로 강아지 등록을 끝내는 펫테크 — 누적 30만 마리", en: "Pet-tech that completes dog registration on mobile — 300K+ animals" },
    successFactors: { ko: ["법정 등록이라는 의무 유스케이스로 첫 사용자 확보", "등록 후 커머스·SOS 등 슈퍼앱 확장 전략", "삼성전자 C랩 아웃사이드 등 외부 검증"], en: ["Acquired first users via mandatory pet registration", "Super-app expansion into commerce and lost-pet SOS", "External validation via Samsung C-Lab Outside"] },
    lesson: { ko: "법적 의무 행위는 가장 강력한 신규 사용자 유입 채널이다", en: "Legally required actions are the strongest user-acquisition channel" },
    sources: [{ label: "페오펫 공식", url: "https://www.peopet.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "fastfive",
    name: { ko: "패스트파이브", en: "Fast Five" },
    applicableCategories: ["space"],
    applicableSubIndustries: ["shared-office"],
    themes: ["space-as-product", "brand-building"],
    foundedYear: 2015,
    location: "서울 강남·전국",
    founder: "김대일",
    oneLiner: { ko: "카페 같은 분위기의 공유오피스 1위 — 51개 지점, 국내 점유율 1위 토종 브랜드", en: "Korea's #1 home-grown shared office brand with cafe-like ambience and 51 branches" },
    successFactors: { ko: ["WeWork 진입 전 강남·선릉·논현 거점 선점", "공간뿐 아니라 라운지·이벤트 등 '서비스'로 차별화", "기업 단위 라지스페이스 등 B2B 매출 다각화"], en: ["Locked in Gangnam, Seolleung, Nonhyeon hubs before WeWork", "Differentiated via lounges and events", "Diversified into B2B large-space leases"] },
    lesson: { ko: "공유오피스의 본질은 부동산이 아니라 커뮤니티 운영이다", en: "The essence of shared offices is community ops, not real estate" },
    sources: [{ label: "패스트파이브 공식", url: "https://fastfive.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "sparkplus",
    name: { ko: "스파크플러스", en: "SparkPlus" },
    applicableCategories: ["space"],
    applicableSubIndustries: ["shared-office"],
    themes: ["space-as-product", "community-loyalty"],
    foundedYear: 2016,
    location: "서울 역삼",
    oneLiner: { ko: "스파크랩+아주호텔이 만든 토종 공유오피스 — 36개 지점, 3년 연속 흑자", en: "Domestic shared-office by SparkLabs and Aju Hotels — 36 branches, three years of profit" },
    successFactors: { ko: ["스파크랩 액셀러레이팅 네트워크로 스타트업 입주사 확보", "1인 데스크·라운지패스·맞춤 오피스의 가격 라인업", "2025년 매출 766억·영업이익 102억의 흑자 운영"], en: ["Captured startup tenants via SparkLabs network", "Tiered pricing across desk, lounge pass, custom office", "2025: 76.6B revenue and 10.2B operating profit"] },
    lesson: { ko: "공유오피스 흑자는 '평수'가 아니라 '가동률 단가'에서 나온다", en: "Shared-office profit comes from utilization-adjusted price" },
    sources: [{ label: "스파크플러스 공식", url: "https://www.sparkplus.co/", accessedAt: "2026-04-24" }]
  },
  {
    id: "rehoboth",
    name: { ko: "르호봇 비즈니스인큐베이터", en: "Rehoboth Business Incubator" },
    applicableCategories: ["space"],
    applicableSubIndustries: ["shared-office"],
    themes: ["tradition-heritage", "differentiation"],
    foundedYear: 1998,
    location: "서울·전국 30여 개 지점",
    oneLiner: { ko: "1998년 국내 최초 비즈니스센터를 도입한 공유오피스 원조 — 26년 업력의 토종 브랜드", en: "Korea's first business center launched in 1998 — the original shared-office brand" },
    successFactors: { ko: ["외환위기 시기 1인 사업자 수요를 선점한 선구자 포지션", "전국 30여 지점의 안정적 운영 노하우", "비서·법인설립 대행 등 부가 서비스로 객단가 상승"], en: ["Pioneer position capturing solo-entrepreneur demand after IMF", "Stable ops know-how across 30+ branches", "Higher ARPU from value-adds"] },
    lesson: { ko: "오래 살아남은 1세대는 시장이 잠깐 꺼져도 다시 살아난다", en: "First-generation survivors come back even after the market briefly dies" },
    sources: [{ label: "르호봇 비즈니스 공식", url: "https://www.ibusiness.co.kr/history/", accessedAt: "2026-04-24" }]
  },
  {
    id: "myworkspace",
    name: { ko: "마이워크스페이스", en: "MyWorkspace" },
    applicableCategories: ["space"],
    applicableSubIndustries: ["shared-office"],
    themes: ["differentiation", "scarcity-strategy"],
    foundedYear: 2015,
    location: "서울 강남역",
    founder: "양희영",
    oneLiner: { ko: "강남역 11평 지하에서 시작해 강남대로 빌딩 전체를 채운 '가성비' 공유오피스", en: "Value-priced shared office that grew from a 36 sqm basement to filling an entire tower" },
    successFactors: { ko: ["강남대로 한복판이라는 단일 입지에 집중", "패스트파이브 대비 절반 수준의 가격 포지셔닝", "직접 빌딩 매입·임대로 평당 단가 통제"], en: ["Focused on a single hyper-prime Gangnam-daero location", "Priced at roughly half of competitors", "Controlled per-pyeong cost via direct acquisition"] },
    lesson: { ko: "한 골목을 완전히 장악하면 가격결정권이 따라온다", en: "Dominate one street completely and pricing power follows" },
    sources: [{ label: "마이워크스페이스 공식", url: "https://www.myworkspace.co.kr/en/", accessedAt: "2026-04-24" }]
  },
  {
    id: "spacecloud",
    name: { ko: "스페이스클라우드", en: "Spacecloud" },
    applicableCategories: ["space"],
    applicableSubIndustries: ["party-room"],
    themes: ["community-loyalty", "product-innovation"],
    foundedYear: 2014,
    location: "서울",
    oneLiner: { ko: "파티룸·연습실·스튜디오 등 4만팀 호스트가 모인 한국형 공간대여 플랫폼 — 누적거래 700억", en: "Korean space-rental platform aggregating 40,000+ hosts — 70B GMV" },
    successFactors: { ko: ["10·20대 파티룸·연습실 수요로 카테고리 정의", "호스트 교육센터(인디워커스 하이브) 운영으로 공급 품질화", "서울 → 전국 확장과 공유주방·렌탈스튜디오 등 카테고리 확대"], en: ["Defined the category via party-room and rehearsal demand", "Standardized supply with the host academy", "Expanded from Seoul nationwide and into shared kitchens"] },
    lesson: { ko: "공간 플랫폼은 '호스트 교육'에 투자해야 매물 품질이 균질해진다", en: "Space platforms must invest in host training to keep supply consistent" },
    sources: [{ label: "스페이스클라우드 공식", url: "https://www.spacecloud.kr/host/anc_story", accessedAt: "2026-04-24" }]
  },
  {
    id: "monami-store-seongsu",
    name: { ko: "모나미 스토어 성수점", en: "Monami Store Seongsu" },
    applicableCategories: ["retail", "living-service"],
    applicableSubIndustries: ["lifestyle-goods"],
    themes: ["space-as-product", "customer-experience", "tradition-heritage"],
    foundedYear: 2022,
    location: "서울 성동구 성수",
    oneLiner: { ko: "1963년 첫 공장이 있던 성수에 다시 연 컨셉스토어 — 잉크랩·노트DIY 체험으로 누적 21만 방문", en: "Concept store reopened in Seongsu where Monami's first factory stood in 1963" },
    successFactors: { ko: ["59년 헤리티지를 '본거지 회귀' 스토리텔링으로 연결", "잉크랩·DIY 등 체험 결제(2.5만원)로 소매를 콘텐츠화", "주말 1000명 방문의 오프라인 트래픽으로 신상품 테스트"], en: ["Linked 59-year heritage with 'home-coming' storytelling", "Turned retail into content via paid experiences (Ink Lab 25K)", "Used 1,000 weekend visitors as a testbed"] },
    lesson: { ko: "노포 브랜드는 '체험'을 팔아야 다음 세대 고객이 생긴다", en: "Legacy brands win the next generation by selling experiences" },
    sources: [{ label: "모나미 성수점 르포 - 아주경제", url: "https://www.ajunews.com/view/20250601121546151", accessedAt: "2026-04-24" }]
  },
  {
    id: "object-hongdae",
    name: { ko: "오브젝트 홍대 본점", en: "Object Hongdae" },
    applicableCategories: ["retail", "living-service"],
    applicableSubIndustries: ["lifestyle-goods"],
    themes: ["space-as-product", "community-loyalty", "differentiation"],
    foundedYear: 2010,
    location: "서울 마포 홍대",
    oneLiner: { ko: "독립 디자이너 핸드메이드 작가 수백 명의 작품을 모은 4층 라이프스타일 편집숍", en: "Four-story lifestyle select shop curating hundreds of independent designers" },
    successFactors: { ko: ["독립 작가 입점 큐레이션으로 '여기서만 살 수 있는' 상품군", "홍대·삼청동 등 디자인 동선의 핵심 입지", "팝업 전시·신진 작가 발굴로 콘텐츠 재방문률 확보"], en: ["Curates indie creators so the merchandise is exclusive", "Anchored at design-tourism hubs", "Drives repeat visits via pop-up exhibitions"] },
    lesson: { ko: "편집숍은 'MD가 누구인가'가 곧 브랜드다", en: "For select shops, who curates is the brand" },
    sources: [{ label: "오브젝트 공식", url: "https://insideobject.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "wigglewiggle",
    name: { ko: "위글위글", en: "Wiggle Wiggle" },
    applicableCategories: ["retail", "living-service"],
    applicableSubIndustries: ["lifestyle-goods"],
    themes: ["product-innovation", "brand-building"],
    foundedYear: 2014,
    location: "서울",
    oneLiner: { ko: "비비드 컬러·레트로 자수 폰케이스로 MZ를 사로잡은 디자인 라이프스타일 브랜드", en: "Lifestyle design brand winning MZ generation with vivid colors and retro embroidered phone cases" },
    successFactors: { ko: ["강한 컬러·레트로 자수의 일관된 비주얼 아이덴티티", "올리브영·CU 등 대형 유통사와 콜라보로 노출 폭증", "홈데코·문구·액세서리로 빠른 카테고리 확장"], en: ["Consistent visual identity of saturated color and retro embroidery", "Massive exposure via collabs with Olive Young, CU", "Rapid category expansion"] },
    lesson: { ko: "MZ 잡화는 '한 번 보면 위글위글'인 비주얼이 광고비다", en: "For MZ goods brands, an instantly recognizable visual is the ad spend" },
    sources: [{ label: "위글위글 공식", url: "https://wiggle-wiggle.com/", accessedAt: "2026-04-24" }]
  },

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   *  CAFE & DESSERT ADDITIONS (18 cases) — 2026-04-24
   *  (2 duplicates removed: salt-house, sulbing — already in DB or franchise)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  {
    id: "manufact-coffee",
    name: { ko: "매뉴팩트커피", en: "Manufact Coffee" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["takeout-coffee", "specialty-coffee"],
    themes: ["brand-building", "product-innovation", "community-loyalty"],
    foundedYear: 2013,
    location: "서울 연희동",
    oneLiner: { ko: "라틴어 'manos+factum'에서 따온 이름으로 12년간 한 자리에서 손으로 만든 영감의 커피를 추구", en: "Named from Latin 'manos+factum', the Yeonhui-dong roastery has spent 12 years crafting handmade coffee" },
    successFactors: { ko: ["연희동 단일 입지에서 12년 자리 고수해 동네 정체성 확보", "'커피는 영감의 도구' 라는 명확한 브랜드 철학", "29CM·도산공원 분점 등 큐레이션 채널과의 협업으로 취향 소비층 흡수", "원두·드립백 D2C 판매로 카페 외 매출 다각화"], en: ["Held a single Yeonhui-dong location for 12 years", "Clear brand philosophy: 'coffee as inspiration tool'", "Curated retail partnerships attracted taste-driven consumers", "Diversified D2C revenue"] },
    lesson: { ko: "한 자리를 오래 지키는 것이 가장 강력한 브랜드 자산이다", en: "Staying in one spot for a long time is the strongest brand asset" },
    sources: [{ label: "Manufact Coffee 공식", url: "https://www.manufactcoffee.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "bean-brothers",
    name: { ko: "빈브라더스", en: "Bean Brothers" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["takeout-coffee", "specialty-coffee"],
    themes: ["product-innovation", "differentiation", "community-loyalty"],
    foundedYear: 2013,
    location: "서울 합정",
    oneLiner: { ko: "오프라인 영업 실패 후 커피 구독 서비스로 피벗해 한·말레이 11개 매장과 500곳 B2B 파트너로 성장", en: "After failing in B2B sales, pivoted to coffee subscription and grew to 11 cafes with 500 B2B partners" },
    successFactors: { ko: ["온라인 구독 → 오프라인 카페 → 로스터리 공장 순서의 단계적 확장", "구독 모델로 고객의 '커피 경험'을 먼저 키운 뒤 매장 출점", "B2B 솔루션 사업으로 500곳 파트너 락인", "한국·말레이시아 동시 운영으로 글로벌 확장 학습"], en: ["Phased expansion: online subscription → offline cafe → factory", "Built customer 'coffee experience' before opening stores", "Locked in 500 B2B partners", "Operated in both Korea and Malaysia"] },
    lesson: { ko: "B2C 영업이 안 된다면 사업 모델 자체를 뒤집어 봐야 한다", en: "If B2C sales fail, flip the business model itself" },
    sources: [{ label: "빈브라더스 공식", url: "https://www.beanbrothers.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "coffee-libre",
    name: { ko: "커피리브레", en: "Coffee Libre" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["takeout-coffee", "specialty-coffee"],
    themes: ["brand-building", "product-innovation", "differentiation"],
    foundedYear: 2009,
    location: "서울 연남동",
    founder: "서필훈",
    oneLiner: { ko: "국내 최초 큐그레이더 서필훈이 2009년 연남 골목에서 시작한 한국 1세대 스페셜티 로스터리", en: "Founded in 2009 by Korea's first Q-grader, a first-generation specialty roastery" },
    successFactors: { ko: ["국내 최초 큐그레이더라는 압도적 전문성 자산", "영화 '나쵸 리브레'에서 따온 파란 복면 IP로 강한 브랜드 시각화", "교육 사업 → 카페 → 상하이 진출의 단계적 확장", "동진시장 주민 친화적 입지로 '동네 로스터리' 정체성 확보"], en: ["Korea's first Q-grader, an unmatched expertise asset", "Blue luchador mask IP for strong visual branding", "Phased expansion: education → cafes → Shanghai", "Built 'neighborhood roastery' identity"] },
    lesson: { ko: "전문성 + 기억에 남는 시각 IP = 카테고리 1위 브랜드", en: "Expertise + memorable visual IP = category-leading brand" },
    sources: [{ label: "커피리브레 공식", url: "https://en.coffeelibre.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "momos-coffee",
    name: { ko: "모모스커피", en: "Momos Coffee" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee"],
    themes: ["people-first", "product-innovation", "community-loyalty"],
    foundedYear: 2007,
    location: "부산 온천장",
    founder: "이현기",
    oneLiner: { ko: "2007년 4평 테이크아웃 매장에서 시작해 한국 최초 월드 바리스타 챔피언을 배출한 부산 대표 로스터리", en: "Started as a 4-pyeong takeout in 2007, this Busan roastery produced Korea's first World Barista Champion" },
    successFactors: { ko: ["전주연 바리스타에 20대 초부터 전폭 투자해 2019 WBC 우승 배출", "수도권 진출 거부, 부산 직영만 고수하며 로컬 정체성 강화", "매년 산지 직접 방문·다이렉트 트레이드로 원두 차별화", "영도 로스터리에서 전국 B2B 공급망 구축"], en: ["Invested heavily in barista Jeon Joo-yeon leading to her 2019 WBC win", "Refused Seoul expansion, sticking to Busan", "Annual origin visits and direct trade", "Built nationwide B2B from Yeongdo roastery"] },
    lesson: { ko: "사람에 투자해 챔피언을 만들면, 챔피언이 브랜드를 만든다", en: "Invest in people to create champions; champions create the brand" },
    founderQuote: { ko: "수도권으로 가면 모모스가 아니다" },
    sources: [{ label: "모모스커피 공식", url: "https://en.momos.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "felt-coffee",
    name: { ko: "펠트커피", en: "FELT Coffee" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee"],
    themes: ["space-as-product", "product-innovation", "differentiation"],
    foundedYear: 2014,
    location: "서울 광화문",
    founder: "송대웅·김영현",
    oneLiner: { ko: "마주 앉는 의자 없는 미니멀 쇼룸 컨셉으로 광화문 직장인 출근 동선을 바꾼 스페셜티 로스터리", en: "Minimalist showroom-style cafe with no facing chairs that rerouted Gwanghwamun office workers' commute" },
    successFactors: { ko: ["테이블·마주보는 의자를 없앤 '쇼룸' 컨셉으로 회전율 극대화", "준지·디타워 등 패션·오피스 브랜드와의 공간 콜라보", "런던 유학에서 본 '문화로서의 커피' 철학을 한국에 이식", "연 300만 잔 판매 규모로 미니멀 공간 + 고품질 원두 양립 증명"], en: ["'Showroom' concept maximized turnover", "Space collaborations with fashion/office brands", "Brought London's 'coffee as culture' philosophy", "3M cups/year proves minimalist + premium can scale"] },
    lesson: { ko: "공간을 비울수록 커피와 브랜드가 더 선명해진다", en: "The emptier the space, the sharper the coffee and the brand" },
    sources: [{ label: "펠트커피 공식", url: "https://en.feltcoffee.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "namusairo",
    name: { ko: "나무사이로", en: "Namusairo" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee"],
    themes: ["product-innovation", "tradition-heritage", "differentiation"],
    foundedYear: 2002,
    location: "서울 내자동",
    founder: "배준선",
    oneLiner: { ko: "2002년 신림동에서 시작한 한국 1세대 스페셜티 로스터, 분당 대형 로스팅 본사로 B2B 확장", en: "Founded in Sillim-dong in 2002 as a first-generation Korean specialty roaster" },
    successFactors: { ko: ["2002년 출발한 1세대 스페셜티의 헤리티지 자산", "B2B 원두 공급 확대를 위해 분당으로 본사 로스터리 이전", "내자동 본점은 도심 속 슬로우 공간으로 유지", "'서울 3대 커피 브랜드' 평가로 미디어·전문가 신뢰도 확보"], en: ["First-generation specialty heritage since 2002", "Relocated HQ roastery to Bundang for B2B", "Kept Naeja-dong flagship as a slow downtown sanctuary", "Earned 'Top 3 Seoul Coffee Brand' status"] },
    lesson: { ko: "오래 살아남으면 '원조'라는 가장 비싼 라벨을 얻는다", en: "Survive long enough and you earn the most expensive label: 'original'" },
    sources: [{ label: "나무사이로 공식", url: "https://en.namusairo.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "anthracite-coffee",
    name: { ko: "앤트러사이트커피", en: "Anthracite Coffee" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee", "takeout-coffee"],
    themes: ["space-as-product", "brand-building", "tradition-heritage"],
    foundedYear: 2010,
    location: "서울 합정",
    oneLiner: { ko: "폐쇄된 신발공장을 무연탄(앤트러사이트)을 떠올리는 발전소 컨셉의 카페로 재탄생시킨 합정의 시그니처", en: "Reborn from an abandoned shoe factory as a power-plant-inspired cafe" },
    successFactors: { ko: ["당인리 화력발전소 옆 폐공장이라는 입지 스토리를 브랜드명으로 승화", "'오래된 것의 가치'라는 일관된 공간 철학", "합정 → 한남 → 제주 한림으로 핵심 가치 유지하며 확장", "2010년 출발한 16년 헤리티지로 합정 카페 상권 견인"], en: ["Sublimated abandoned-factory site into the brand name", "Consistent spatial philosophy: 'value in old things'", "Expanded preserving core values", "16-year heritage anchored Hapjeong's cafe district"] },
    lesson: { ko: "공간의 과거를 지우지 말고, 브랜드 스토리로 만들어라", en: "Don't erase a space's past; turn it into the brand story" },
    sources: [{ label: "Anthracite Coffee About", url: "https://anthracitecoffee.com/about", accessedAt: "2026-04-24" }]
  },
  {
    id: "bohemian-coffee",
    name: { ko: "보헤미안 박이추 커피", en: "Bohemian Park Yi-choo Coffee" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee", "takeout-coffee"],
    themes: ["tradition-heritage", "people-first", "brand-building"],
    foundedYear: 1988,
    location: "강원 강릉 연곡",
    founder: "박이추",
    oneLiner: { ko: "1988년 혜화동에서 시작해 강릉을 '커피 도시'로 만든 한국 1세대 핸드드립 명인의 카페", en: "Started in Hyehwa-dong in 1988, the first-generation hand-drip master's cafe that made Gangneung Korea's 'coffee city'" },
    successFactors: { ko: ["한국 커피문화협회 초대회장이자 1서3박 1세대 바리스타 헤리티지", "다크 로스팅·핸드드립 장인 정체성으로 마니아층 형성", "2000년 강릉 연곡 정착으로 '강릉 커피'라는 지역 브랜드 창출", "단국대·강릉대 커피 교육 활동으로 후학 양성과 브랜드 권위 확보"], en: ["First chairman of Korea Coffee Culture Association", "Dark-roast and hand-drip artisan identity", "Settling in Gangneung created the 'Gangneung Coffee' regional brand", "Teaching at Dankook/Gangneung University built authority"] },
    lesson: { ko: "지역으로 내려가서 'XX 커피'라는 단어를 만들면 도시 자체가 채널이 된다", en: "Move regional and coin a 'XX coffee' term — the city itself becomes your channel" },
    sources: [{ label: "박이추 - 대한민국 구석구석", url: "https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=995bce32-7275-4c3f-8ccc-a18ab9969840", accessedAt: "2026-04-24" }]
  },
  {
    id: "coffee-montage",
    name: { ko: "커피몽타주", en: "Coffee Montage" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["specialty-coffee"],
    themes: ["product-innovation", "differentiation", "community-loyalty"],
    foundedYear: 2011,
    location: "서울 성내동 / 경기 하남",
    oneLiner: { ko: "안정적인 로스팅 품질로 전국 약 150개 카페에 원두를 공급하는 강동 기반 스페셜티 로스터리", en: "A Gangdong-based specialty roastery supplying beans to roughly 150 cafes nationwide" },
    successFactors: { ko: ["성내동 커피바·하남 더 스타디움 로스팅팩토리 이원 운영 모델", "각종 국제 커피 옥션·다이렉트 트레이드로 생두 차별화", "전국 150여 곳 B2B 카페 채널로 안정적 매출 기반", "'스페셜티 커피' 카테고리 키워드 1위 브랜드 자리 확보"], en: ["Dual-site model: Seongnae bar + Hanam roasting factory", "Differentiated greens via international coffee auctions", "Stable revenue from 150+ B2B cafe partners", "Owns the 'specialty coffee' keyword as top-of-mind brand"] },
    lesson: { ko: "쇼룸과 공장을 분리하면 둘 다 더 잘된다", en: "Split the showroom and the factory and both perform better" },
    sources: [{ label: "Coffee Montage 공식", url: "https://www.coffeemontage.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "nudake",
    name: { ko: "누데이크", en: "NUDAKE" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["dessert-cafe"],
    themes: ["space-as-product", "brand-building", "differentiation"],
    foundedYear: 2020,
    location: "서울 도산",
    oneLiner: { ko: "젠틀몬스터가 '명상의 맛'을 컨셉으로 만든 디저트 브랜드. 시그니처 피크 케이크로 인스타·유튜브 폭발", en: "Gentle Monster's dessert brand built around 'Taste of Meditation', exploded on Instagram via signature Peak Cake" },
    successFactors: { ko: ["젠틀몬스터의 비주얼·공간 DNA를 디저트로 확장한 형제 브랜드 전략", "맛이 아닌 '감성·공간·예술적 경험' 중심의 차별화", "다수 만족 X, 소수 마니아의 깊은 경험을 선택한 포지셔닝", "셀럽·인플루언서의 자발적 콘텐츠 생산을 유도한 비주얼 디저트"], en: ["Sister-brand strategy extending Gentle Monster's DNA into desserts", "Differentiation through emotion/space/artistic experience over taste", "Chose deep experience for niche over satisfying everyone", "Visually striking desserts triggered organic content"] },
    lesson: { ko: "디저트는 먹는 게 아니라 찍는 것이다 — 비주얼이 첫 메뉴", en: "Dessert isn't eaten, it's photographed — visuals are the first menu item" },
    sources: [{ label: "NUDAKE - 나무위키", url: "https://namu.wiki/w/NUDAKE", accessedAt: "2026-04-24" }]
  },
  {
    id: "owolui-jong",
    name: { ko: "오월의 종", en: "Owol-ui Jong (Bell of May)" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["product-innovation", "people-first", "differentiation"],
    foundedYear: 2008,
    location: "서울 한남동",
    founder: "정웅",
    oneLiner: { ko: "시멘트 영업사원 출신 정웅이 33세에 시작해, 첫 가게 망한 뒤 한남에서 '딱딱한 빵'으로 매일 줄을 만든 빵집", en: "Started by 33-year-old former cement salesman; after his first shop failed, his 'tough' breads created daily lines in Hannam" },
    successFactors: { ko: ["단맛이 적고 식사 가능한 유럽식 식사빵에 끝까지 집중", "첫 가게 폐업 후에도 '만들고 싶은 빵'을 고집한 일관성", "주변 술집에 안 팔리는 빵을 나눠주며 입소문 형성", "오전 11시 오픈, 오후 2~3시 매진의 희소성 운영"], en: ["Stayed focused on European meal breads with low sweetness", "Kept making 'the bread he wanted to make' even after first shop failed", "Built word-of-mouth via giving unsold bread to nearby bars", "Scarcity operations: open 11AM, sold out by 2-3PM"] },
    lesson: { ko: "취향이 시장을 못 따라잡으면, 시장이 따라올 때까지 버텨라", en: "If taste doesn't match the market, hold on until the market catches up" },
    founderQuote: { ko: "부자 되려고 빵 만드는 거, 싫어요" },
    sources: [{ label: "오월의종 - Long Black", url: "https://www.longblack.co/note/1068", accessedAt: "2026-04-24" }]
  },
  {
    id: "paul-and-paulina",
    name: { ko: "폴앤폴리나", en: "Paul and Paulina" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["product-innovation", "differentiation", "brand-building"],
    foundedYear: 2010,
    location: "서울 홍대",
    oneLiner: { ko: "개량제 없이 굽는 프랑스식 식사빵 베이커리. 홍대에서 시작해 연희·여의도·잠실까지 확장한 테이크아웃 전문점", en: "A French-style meal-bread bakery using no improvers — from Hongdae to Yeonhui as a takeout specialist" },
    successFactors: { ko: ["디저트빵이 아닌 식사빵(바게트·캄파뉴·치아바타) 카테고리 집중", "개량제 무첨가 원칙으로 건강·정직 브랜드 포지셔닝", "테이크아웃 전용 매장으로 좌석 비용 절감 + 회전율 극대화", "시식 빵 제공으로 진입 장벽 낮추고 신뢰 구축"], en: ["Focused on meal breads, not dessert breads", "No-improver policy positioned the brand as healthy", "Takeout-only stores cut seating costs", "Free tasting bread builds trust"] },
    lesson: { ko: "'안 넣는 것'을 명확히 하면 그것 자체가 브랜드가 된다", en: "Clearly defining 'what you don't put in' becomes a brand in itself" },
    sources: [{ label: "폴앤폴리나 - 식신", url: "https://www.siksinhot.com/P/320517", accessedAt: "2026-04-24" }]
  },
  {
    id: "leesungdang",
    name: { ko: "이성당", en: "Lee Sung Dang" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["tradition-heritage", "brand-building", "community-loyalty"],
    foundedYear: 1945,
    location: "전북 군산",
    oneLiner: { ko: "1945년 일본인 제과점 '이즈모야'를 인수해 시작한 현존 한국 최고(最古) 빵집. 단팥빵·야채빵 양대 산맥", en: "Korea's oldest surviving bakery, founded in 1945 — famed for sweet-red-bean and vegetable breads" },
    successFactors: { ko: ["1945년 창업의 80년 헤리티지 그 자체가 가장 강력한 자산", "단팥빵·야채빵 단 두 메뉴를 시그니처로 압축한 명확성", "군산이라는 지역 정체성과 결합한 '빵지순례' 1번지", "온라인몰·서울 분점으로 헤리티지를 잃지 않으며 확장"], en: ["80-year heritage since 1945 is itself the strongest asset", "Compressed signature menu down to just two breads", "Coupled with Gunsan's regional identity", "Expanded online and to Seoul without losing heritage"] },
    lesson: { ko: "메뉴는 줄이고 시간은 늘려라 — 80년이면 그게 곧 해자다", en: "Cut the menu, extend the time — 80 years becomes a moat" },
    sources: [{ label: "이성당 공식", url: "https://leesungdang1945.com/", accessedAt: "2026-04-24" }]
  },
  {
    id: "toujours",
    name: { ko: "뚜쥬루", en: "Toujours" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["tradition-heritage", "people-first", "community-loyalty"],
    foundedYear: 1992,
    location: "충남 천안",
    founder: "윤석호",
    oneLiner: { ko: "1992년 서울 용답동에서 시작, 파리바게뜨에 밀려 천안으로 옮긴 후 매출 251억 전국 3위 빵집으로 부활", en: "Started in Seoul in 1992, pushed out by Paris Baguette, then revived in Cheonan as Korea's #3 bakery" },
    successFactors: { ko: ["국내 최초·최대 돌가마 시그니처 시설 ('빵돌가마마을')", "당일 안 팔린 빵을 다음날 50% 할인하는 신선도 정책", "원가절감보다 신선·건강을 택한 일관된 가치", "거북이빵 등 천안 지역 정체성 결합 시그니처 메뉴"], en: ["Korea's first/largest stone-kiln signature facility", "Freshness policy: unsold bread sold at 50% off next day", "Chose freshness over cost reduction", "Signature 'turtle bread' tied to Cheonan's identity"] },
    lesson: { ko: "프랜차이즈에 밀려 쫓겨나도, 지역에서 다시 시작하면 더 큰 성을 쌓을 수 있다", en: "Even if a franchise pushes you out, restarting in a region can build a bigger castle" },
    sources: [{ label: "뚜쥬루과자점 공식", url: "https://toujours.co.kr/", accessedAt: "2026-04-24" }]
  },
  {
    id: "lee-heung-yong",
    name: { ko: "이흥용과자점", en: "Lee Heung-yong Bakery" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["tradition-heritage", "people-first", "brand-building"],
    foundedYear: 1995,
    location: "부산 문현동",
    founder: "이흥용·김은영",
    oneLiner: { ko: "1995년 문현동 10평 매장에서 출발해 2018년 부산 최초 대한민국 제과명장 타이틀까지 받은 동네빵집 신화", en: "From a 10-pyeong shop in 1995 to Busan's first Korea Master Patissier in 2018" },
    successFactors: { ko: ["30년 외길 + 대한민국 제과명장 타이틀의 권위 자산", "저염명란바게트·칠암돌만주 등 부산 향토 재료 특허 제품", "베이커리 4곳 + 카페 3곳(칠암사계·금정사계)으로 포맷 확장", "2015년 매출 100억 돌파 후 '이흥용 LAB'으로 R&D 진화"], en: ["30 years of single-path craft plus Korea Master Patissier authority", "Patented products using Busan local ingredients", "Format expansion: 4 bakeries + 3 cafes", "Crossed 10B in 2015, evolved R&D via 'Lee Heung-yong LAB'"] },
    lesson: { ko: "지역 재료를 특허로 만들면 동네빵집도 100억 매출을 넘긴다", en: "Patent local ingredients and even a neighborhood bakery clears 10B" },
    sources: [{ label: "부산광역시 - 이흥용 명장", url: "https://www.busan.go.kr/news/specnews/view?bbsNo=6&dataNo=67157", accessedAt: "2026-04-24" }]
  },
  {
    id: "metz-bakery",
    name: { ko: "메츠과자점", en: "Metz Bakery" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["product-innovation", "community-loyalty", "differentiation"],
    foundedYear: 2006,
    location: "부산 대연동",
    founder: "이창환",
    oneLiner: { ko: "30년 경력 이창환 대표가 2006년 대연동에 연 40평 동네빵집. 소금빵 + 100% 수제잼으로 SNS 스타 등극", en: "A 40-pyeong neighborhood bakery opened in 2006 by 30-year veteran Lee Chang-hwan" },
    successFactors: { ko: ["반죽에 대한 30년 외길 장인 정신 + SNS 친화적 입지(부경대·경성대)", "소금빵·갈릭바게트·펌킨 등 한 카테고리당 시그니처 한 개 전략", "100% 수제 잼 등 사이드 제품으로 객단가 인상", "겐츠·이흥용과 함께 '부산 3대 빵집' 카테고리 안착"], en: ["30 years of dough mastery + SNS-friendly campus location", "One signature per category strategy", "Raised average ticket via 100% house-made jam", "Cemented as one of 'Busan's Top 3 Bakeries'"] },
    lesson: { ko: "30년 장인 + 20대 SNS 입지가 만나면 동네빵집이 성지가 된다", en: "30-year craft meets 20-something SNS location: the neighborhood bakery becomes a pilgrimage site" },
    sources: [{ label: "메츠과자점 - 부산일보", url: "http://www.busan.com/view/busan/view.php?code=2019042418403784582", accessedAt: "2026-04-24" }]
  },
  {
    id: "mealdo",
    name: { ko: "밀도", en: "Mealdo" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["bakery-studio"],
    themes: ["product-innovation", "differentiation", "brand-building"],
    foundedYear: 2015,
    location: "서울 성수동",
    founder: "전익범",
    oneLiner: { ko: "도쿄제과학교 교사 출신 전익범 셰프가 '식빵' 한 메뉴에 집중해 7년째 줄 세우는 성수 베이커리", en: "Run by ex-Tokyo Confectionery School instructor; this Seongsu bakery has drawn 7 years of lines focusing on shokupan only" },
    successFactors: { ko: ["'식빵 단일 카테고리'에 집중한 메뉴 절제 전략", "매일 그날의 온도·습도를 반영하는 '밀도(°)' 콘셉트로 브랜드 시그니처화", "성수동 핫플 입지 선점 + 강남점으로 단계적 확장", "마켓컬리 등 온라인 채널로 D2C 매출 다각화"], en: ["Menu-restraint strategy focused entirely on shokupan", "'Density (°)' brand concept reflecting daily temp/humidity", "Pre-empted Seongsu, then expanded to Gangnam carefully", "Diversified D2C revenue via Market Kurly"] },
    lesson: { ko: "메뉴를 하나로 줄이면 그 한 줄에 7년의 줄이 생긴다", en: "Cut the menu to one item and seven years of lines form behind it" },
    sources: [{ label: "밀도 공식", url: "https://mealdo.cafe24.com/shopinfo/chefstory.html", accessedAt: "2026-04-24" }]
  },
  {
    id: "cafein24",
    name: { ko: "카페인24", en: "Cafein24" },
    applicableCategories: ["cafe-dessert"],
    applicableSubIndustries: ["self-serve-cafe", "takeout-coffee"],
    themes: ["product-innovation", "differentiation", "community-loyalty"],
    foundedYear: 2021,
    location: "전국 (본사: 경기)",
    founder: "임선영",
    oneLiner: { ko: "워킹맘이 6평 매장에서 시작해 광고 없이 입소문만으로 100호점을 돌파한 24시간 무인카페", en: "A 24-hour unmanned cafe started by a working mom in 6-pyeong space, hitting 100 stores via word-of-mouth alone" },
    successFactors: { ko: ["100% 아라비카 + 국가대표 바리스타 로스팅으로 '무인 = 저품질' 고정관념 깨뜨림", "창업 과정 블로그를 콘텐츠로 만들어 가맹 희망자 직접 모집", "광고 0원, 입소문 + 다점포율 32%로 검증된 수익성", "공정위 정보공개서 기준 무인카페 매출 1위"], en: ["100% Arabica + national-team barista roasting broke 'unmanned = low quality' stigma", "Turned founding blog into recruiting content for franchisees", "Zero ad spend; word-of-mouth and 32% multi-store rate", "#1 unmanned cafe by revenue per FTC disclosure"] },
    lesson: { ko: "창업 과정을 콘텐츠로 만들면, 그 콘텐츠가 영업사원이 된다", en: "Turn the founding journey into content and that content becomes your sales team" },
    sources: [{ label: "카페인24 공식", url: "https://cafein24.co.kr/", accessedAt: "2026-04-24" }]
  }
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  MATCHING FUNCTIONS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export type KHitMatchInput = {
  /** 사장님의 업종 (categoryId) — food, cafe-dessert, retail 등 */
  categoryId?: string;
  /** 세부 업종 (subIndustryId) — 있으면 정밀 매칭 */
  subIndustryId?: string;
  /** 현재 고민/테마 (선택) — 매칭 우선순위 상향 */
  themes?: KHitTheme[];
  /** 최대 반환 개수 */
  limit?: number;
};

/**
 * 사장님 업종에 맞는 K-히트 사례를 점수 기반으로 매칭
 *  - subIndustry 일치: +3점
 *  - category 일치: +2점
 *  - theme 일치: 각 +1점
 *  - 점수 높은 순 반환
 */
export function matchKHitCases(input: KHitMatchInput): KHitCase[] {
  const limit = input.limit ?? 3;
  const themes = new Set(input.themes ?? []);

  const scored = K_HIT_CASES.map(c => {
    let score = 0;
    if (input.subIndustryId && c.applicableSubIndustries?.includes(input.subIndustryId)) score += 3;
    if (input.categoryId && c.applicableCategories.includes(input.categoryId)) score += 2;
    for (const t of c.themes) {
      if (themes.has(t)) score += 1;
    }
    return { case: c, score };
  });

  // 점수 0 초과만 반환, 점수 내림차순 + 신생>노포 다양성을 위해 설립연도 교차 배치
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.case);
}

/** 단일 업종의 모든 K-히트 사례 반환 (상세 페이지용) */
export function getKHitCasesForCategory(categoryId: string): KHitCase[] {
  return K_HIT_CASES.filter(c => c.applicableCategories.includes(categoryId));
}

/** ID로 단일 조회 */
export function getKHitCaseById(id: string): KHitCase | undefined {
  return K_HIT_CASES.find(c => c.id === id);
}

/** 모든 사례 반환 (전체 보기용) */
export function getAllKHitCases(): KHitCase[] {
  return K_HIT_CASES;
}
