/**
 * Specialty (특화 컨셉) 옵션 — sub-industry 와 business model 사이의 4번째 분기 레벨.
 *
 * 흐름:
 *   1. industryCategory  (food / cafe-dessert / beauty / retail / ...)
 *   2. subIndustry       (korean-casual / chicken-burger / hair-salon / ...)
 *   3. specialty         ← ★ 이 파일이 정의 (국밥집 / 김밥집 / 백반집 / 분식점)
 *   4. businessModel     (매장 / 테이크아웃 / 배달)
 *
 * 모든 sub-industry 가 specialty 옵션을 가질 필요는 없음 (선택 사항).
 * SPECIALTY_BY_SUB_INDUSTRY 에 키가 없으면 specialty 단계 자체를 스킵.
 *
 * 검증 출처:
 *   • 한식·분식·치킨·미용·소매 카테고리 한국 시장 표준 분류
 *   • 한국외식업중앙회 / 통계청 표준산업분류
 *   • 푸드팡·배민 카테고리 분류 참고
 */

export type SpecialtyOption = {
  /** 고유 ID — kebab-case */
  id: string;
  /** 한국어 라벨 */
  ko: string;
  /** 영어 라벨 */
  en: string;
  /** 한 줄 설명 */
  desc: { ko: string; en: string };
  /** 키워드 — 검색·매칭용 */
  keywords?: string[];
};

export const SPECIALTY_BY_SUB_INDUSTRY: Record<string, SpecialtyOption[]> = {
  // ═════════════════════════════════════════════════════════════
  // FOOD
  // ═════════════════════════════════════════════════════════════
  "korean-casual": [
    {
      id: "korean-gukbap",
      ko: "국밥·해장국",
      en: "Gukbap / Hangover Soup",
      desc: { ko: "설렁탕·뼈해장국·순대국 — 새벽·점심·저녁 다 잡히는 회전 모델", en: "Gukbap, hangover soup — high-rotation model" },
      keywords: ["국밥", "해장국", "설렁탕", "뼈해장국", "순대국"],
    },
    {
      id: "korean-baekban",
      ko: "백반·한정식",
      en: "Baekban / Hanjeongsik",
      desc: { ko: "정식·찌개·반찬 8-10종 — 점심 직장인 안정 매출", en: "Set meal, side dishes — stable lunch revenue" },
      keywords: ["백반", "한정식", "정식", "찌개", "집밥"],
    },
    {
      id: "korean-bunsik",
      ko: "분식·김밥",
      en: "Bunsik / Kimbap",
      desc: { ko: "김밥·떡볶이·라볶이·튀김 — 소형 매장·테이크아웃 강점", en: "Kimbap, tteokbokki, ramen — small footprint" },
      keywords: ["분식", "김밥", "떡볶이", "라볶이", "튀김"],
    },
    {
      id: "korean-noodle",
      ko: "칼국수·국수",
      en: "Kalguksu / Noodles",
      desc: { ko: "칼국수·잔치국수·콩국수·메밀 — 면 전문점", en: "Knife-cut noodles, banquet noodles" },
      keywords: ["칼국수", "잔치국수", "콩국수", "메밀국수"],
    },
    {
      id: "korean-grill",
      ko: "구이·고기집",
      en: "Korean BBQ",
      desc: { ko: "삼겹살·갈비·곱창 — 주류 비중 큰 저녁 영업 강점", en: "Samgyeopsal, galbi — dinner-heavy with alcohol" },
      keywords: ["삼겹살", "갈비", "곱창", "구이"],
    },
    {
      id: "korean-jjim-jjigae",
      ko: "찌개·전골 전문",
      en: "Stew / Hot Pot",
      desc: { ko: "김치찌개·부대찌개·전골 — 점심·저녁 양립 가능", en: "Kimchi jjigae, budae jjigae" },
      keywords: ["찌개", "전골", "부대찌개", "김치찌개"],
    },
    {
      id: "korean-dosirak",
      ko: "한식 도시락",
      en: "Korean Lunchbox",
      desc: { ko: "도시락 전문 — 점심 배달·픽업 위주, 사무 밀집 지역 강점", en: "Lunchbox specialist — delivery / pickup" },
      keywords: ["도시락", "런치박스"],
    },
    {
      id: "korean-fusion",
      ko: "모던·퓨전 한식",
      en: "Modern / Fusion Korean",
      desc: { ko: "창작·퓨전·플레이팅 강조 — 객단가 1.5-2배, SNS 마케팅 핵심", en: "Modern Korean, plating-forward" },
      keywords: ["모던한식", "퓨전한식", "창작한식"],
    },
  ],

  "chicken-burger": [
    {
      id: "fried-chicken",
      ko: "프라이드·양념 치킨",
      en: "Fried Chicken (Korean style)",
      desc: { ko: "한국식 치킨 — 프랜차이즈 대안 또는 독립 브랜드", en: "Korean fried chicken" },
    },
    {
      id: "chicken-rotisserie",
      ko: "전기·로티세리 치킨",
      en: "Rotisserie Chicken",
      desc: { ko: "통닭·전기구이 — 매장 + 마트형 픽업 모델", en: "Whole rotisserie chicken — pickup model" },
    },
    {
      id: "burger-gourmet",
      ko: "수제·고메 버거",
      en: "Gourmet Burger",
      desc: { ko: "프리미엄 패티·수제 번 — 객단가 12-18천원", en: "Gourmet burger with house-made bun" },
    },
    {
      id: "burger-quick",
      ko: "패스트 버거 (쉐이크쉑·맘스터치급)",
      en: "Fast Burger",
      desc: { ko: "객단가 7-12천원 — 회전 빠른 매장형", en: "Fast turnover, mid-tier price" },
    },
    {
      id: "wings-tenders",
      ko: "윙·텐더 전문",
      en: "Wings / Tenders",
      desc: { ko: "윙·텐더·콤보 — 배달·테이크아웃 80%+", en: "Wings & tenders — delivery-focused" },
    },
    {
      id: "korean-chicken-pub",
      ko: "치킨 호프 (생맥주 페어링)",
      en: "Chicken & Beer Pub",
      desc: { ko: "치킨 + 생맥주 — 저녁·심야 매출 강점", en: "Chicken with draft beer — evening" },
    },
  ],

  "ramen-noodle": [
    {
      id: "japanese-ramen",
      ko: "일본 라멘 (돈코츠·시오·쇼유)",
      en: "Japanese Ramen",
      desc: { ko: "정통 일본식 라멘 — 객단가 11-15천원", en: "Authentic Japanese ramen" },
    },
    {
      id: "tonkatsu-don",
      ko: "돈가스·덮밥",
      en: "Tonkatsu / Donburi",
      desc: { ko: "돈가스·규동·치킨가츠동 — 점심 회전 강점", en: "Tonkatsu, donburi — lunch rotation" },
    },
    {
      id: "udon-soba",
      ko: "우동·소바",
      en: "Udon / Soba",
      desc: { ko: "우동·소바 전문점 — 사이드 텐푸라 페어링", en: "Udon & soba" },
    },
    {
      id: "izakaya",
      ko: "이자카야 (저녁·주류)",
      en: "Izakaya",
      desc: { ko: "꼬치·일식 술안주 + 사케·하이볼 — 저녁 영업", en: "Japanese pub with skewers & sake" },
    },
  ],

  "delivery-meals": [
    {
      id: "lunchbox-office",
      ko: "오피스 도시락 (대량)",
      en: "Office Lunchbox",
      desc: { ko: "기업 단체 주문 50개+ — B2B 정기 계약 모델", en: "Bulk corporate lunchbox" },
    },
    {
      id: "lunchbox-individual",
      ko: "개인 도시락 배달",
      en: "Individual Lunchbox Delivery",
      desc: { ko: "1인 주문 위주 — 배달앱 + 자체 픽업", en: "Individual delivery via apps" },
    },
    {
      id: "diet-meal-prep",
      ko: "다이어트·식단 도시락",
      en: "Diet / Meal Prep",
      desc: { ko: "정기 구독 5-7끼 묶음 — 객단가 8-15천원/끼", en: "Subscription meal prep" },
    },
    {
      id: "kids-baby-meal",
      ko: "유아·키즈 식단",
      en: "Kids / Baby Meals",
      desc: { ko: "이유식·유아식 정기 배송 — 안전 인증 핵심", en: "Baby food subscription" },
    },
  ],

  "salad-healthy": [
    {
      id: "salad-bowl",
      ko: "샐러드 보울 전문",
      en: "Salad Bowl Specialist",
      desc: { ko: "객단가 11-16천원 — 점심 직장인 회전", en: "Salad bowl — office lunch" },
    },
    {
      id: "poke-bowl",
      ko: "포케 보울",
      en: "Poke Bowl",
      desc: { ko: "하와이안 포케 — 사시미·아보카도 베이스", en: "Hawaiian poke bowl" },
    },
    {
      id: "smoothie-bowl",
      ko: "스무디·아사이 보울",
      en: "Smoothie / Acai Bowl",
      desc: { ko: "디저트형 헬시 보울 — 카페 라인업 가능", en: "Smoothie & acai bowls" },
    },
    {
      id: "vegan-vegetarian",
      ko: "비건·채식 식당",
      en: "Vegan / Vegetarian",
      desc: { ko: "전 메뉴 비건 — 인증·라벨링 + 마케팅 핵심", en: "Vegan/vegetarian restaurant" },
    },
  ],

  "western-pasta-brunch": [
    {
      id: "pasta-italian",
      ko: "이태리 파스타·피자",
      en: "Italian Pasta / Pizza",
      desc: { ko: "정통 이태리 — 객단가 14-22천원", en: "Authentic Italian" },
    },
    {
      id: "brunch-cafe",
      ko: "브런치 카페",
      en: "Brunch Cafe",
      desc: { ko: "에그베네딕트·팬케이크 — 주말·아침 강점", en: "Brunch cafe — weekend mornings" },
    },
    {
      id: "steak-house",
      ko: "스테이크·그릴",
      en: "Steak / Grill",
      desc: { ko: "스테이크 전문 — 객단가 25-50천원, 저녁 영업", en: "Steak house — dinner-heavy" },
    },
    {
      id: "fastcasual-western",
      ko: "패스트 캐주얼 양식",
      en: "Fast Casual Western",
      desc: { ko: "샌드위치·랩·샐러드 — 점심 회전", en: "Fast casual sandwich/wrap" },
    },
  ],

  // ═════════════════════════════════════════════════════════════
  // CAFE-DESSERT
  // ═════════════════════════════════════════════════════════════
  "specialty-coffee": [
    {
      id: "third-wave-coffee",
      ko: "스페셜티 (3rd wave)",
      en: "Third-wave Specialty",
      desc: { ko: "싱글오리진·핸드드립 강조 — 객단가 6-9천원", en: "Single-origin & hand-drip" },
    },
    {
      id: "roastery-cafe",
      ko: "로스터리 카페 (자가 로스팅)",
      en: "Roastery Cafe",
      desc: { ko: "원두 자가 로스팅 + 도매 — 객단가 + B2B 매출", en: "In-house roasting + B2B" },
    },
    {
      id: "espresso-bar",
      ko: "에스프레소 바 (이태리식)",
      en: "Espresso Bar",
      desc: { ko: "이태리 에스프레소 + 스탠딩 — 객단가 4-6천원, 회전 빠름", en: "Italian espresso bar" },
    },
  ],

  "takeout-coffee": [
    {
      id: "low-cost-takeout",
      ko: "저가 테이크아웃 (메가커피·컴포즈급)",
      en: "Low-cost Takeout",
      desc: { ko: "객단가 2-4천원 — 회전·입지가 핵심", en: "Low-cost — rotation & location" },
    },
    {
      id: "specialty-takeout",
      ko: "프리미엄 테이크아웃",
      en: "Premium Takeout",
      desc: { ko: "객단가 5-7천원 — 작은 매장 + 양질 원두", en: "Premium takeout — quality beans" },
    },
    {
      id: "drink-only-kiosk",
      ko: "음료 전문 키오스크",
      en: "Drinks-only Kiosk",
      desc: { ko: "주스·스무디·티 전문 — 카페 인접 보완", en: "Drinks-only kiosk" },
    },
  ],

  "dessert-cafe": [
    {
      id: "patisserie-cake",
      ko: "케이크·파티시에 카페",
      en: "Cake / Patisserie",
      desc: { ko: "조각·홀케이크 + 음료 — 객단가 12-18천원", en: "Cake & patisserie" },
    },
    {
      id: "macaron-pastry",
      ko: "마카롱·구움과자",
      en: "Macaron / Pastry",
      desc: { ko: "마카롱·휘낭시에 — 선물·테이크아웃 강점", en: "Macarons & baked goods" },
    },
    {
      id: "tea-dessert",
      ko: "차·티룸 (디저트 페어링)",
      en: "Tea Room",
      desc: { ko: "전통차·홍차 + 디저트 페어링", en: "Tea room with dessert pairing" },
    },
    {
      id: "studio-dessert",
      ko: "스튜디오형 (예약제)",
      en: "Studio Dessert",
      desc: { ko: "소수 예약제 디저트 코스 — 프리미엄 포지셔닝", en: "Reservation-based dessert studio" },
    },
  ],

  "bakery-studio": [
    {
      id: "european-bakery",
      ko: "유럽식 베이커리 (천연발효)",
      en: "European Bakery",
      desc: { ko: "사워도·바게트 — 천연발효 강조", en: "Sourdough & baguette" },
    },
    {
      id: "korean-bakery",
      ko: "한국식 베이커리 (단팥빵·식빵)",
      en: "Korean Bakery",
      desc: { ko: "단팥빵·소보로·식빵 — 동네 회전", en: "Korean-style bakery" },
    },
    {
      id: "bagel-sandwich",
      ko: "베이글·샌드위치",
      en: "Bagel / Sandwich",
      desc: { ko: "베이글 + 샌드위치 — 점심 + 카페 페어링", en: "Bagel & sandwich" },
    },
    {
      id: "cake-only",
      ko: "케이크 전문 (예약제)",
      en: "Cake-only",
      desc: { ko: "디자인 케이크·기념일 케이크 예약 전용", en: "Custom cake studio" },
    },
  ],

  // ═════════════════════════════════════════════════════════════
  // BEAUTY
  // ═════════════════════════════════════════════════════════════
  "hair-salon": [
    {
      id: "designer-salon",
      ko: "디자이너 살롱 (프리미엄)",
      en: "Designer Salon",
      desc: { ko: "객단가 8-15만 — 단골·예약 위주", en: "Premium designer salon" },
    },
    {
      id: "neighborhood-salon",
      ko: "동네 미용실 (가성비)",
      en: "Neighborhood Salon",
      desc: { ko: "객단가 1.5-4만 — 회전 + 단골", en: "Neighborhood salon — value pricing" },
    },
    {
      id: "barber-shop",
      ko: "바버샵 (남성 전문)",
      en: "Barber Shop",
      desc: { ko: "남성 전용 — 컷·셰이브·페이드", en: "Men's barber shop" },
    },
    {
      id: "hair-color-specialist",
      ko: "컬러 전문 살롱",
      en: "Color Specialist",
      desc: { ko: "발레아쥬·하이라이트 전문 — 시술 시간 길고 객단가 10-25만", en: "Color specialist — high-ticket" },
    },
  ],

  "nail-studio": [
    {
      id: "korean-gel-nail",
      ko: "한국식 젤네일",
      en: "Korean Gel Nail",
      desc: { ko: "젤네일 + 아트 — 객단가 4-8만", en: "Korean-style gel nail" },
    },
    {
      id: "nail-art-studio",
      ko: "프리미엄 아트 (예약제)",
      en: "Premium Nail Art",
      desc: { ko: "디자인 아트 전문 — 예약 1주+ 대기", en: "Premium nail art studio" },
    },
    {
      id: "express-nail",
      ko: "익스프레스 네일 (15-30분)",
      en: "Express Nail",
      desc: { ko: "케어·기본 네일 빠르게 — 회전 강점", en: "Express nail service" },
    },
  ],

  // ═════════════════════════════════════════════════════════════
  // RETAIL
  // ═════════════════════════════════════════════════════════════
  "convenience-small": [
    {
      id: "neighborhood-mart",
      ko: "동네 슈퍼·마트",
      en: "Neighborhood Mart",
      desc: { ko: "생필품·식료품 — 단골 회전 모델", en: "Neighborhood mart" },
    },
    {
      id: "premium-grocery",
      ko: "프리미엄 식료품·델리",
      en: "Premium Grocery",
      desc: { ko: "수입·유기농·델리 — 객단가 높음", en: "Premium grocery & deli" },
    },
    {
      id: "convenience-24hr",
      ko: "24시간 편의점형",
      en: "24-hour Convenience",
      desc: { ko: "심야 매출 + 담배·주류 — 인력 부담 큼", en: "24/7 convenience" },
    },
  ],

  "fashion-accessories": [
    {
      id: "vintage-thrift",
      ko: "빈티지·세컨핸드",
      en: "Vintage / Thrift",
      desc: { ko: "빈티지 의류·소품 — SNS 마케팅 핵심", en: "Vintage & thrift" },
    },
    {
      id: "designer-boutique",
      ko: "디자이너 부티크",
      en: "Designer Boutique",
      desc: { ko: "단독 디자이너·소량 — 큐레이션 강점", en: "Designer boutique" },
    },
    {
      id: "street-casual",
      ko: "스트릿·캐주얼",
      en: "Street / Casual",
      desc: { ko: "스트릿 브랜드 편집 — 20-30대 타깃", en: "Street casual edit shop" },
    },
    {
      id: "kids-apparel",
      ko: "키즈 의류·잡화",
      en: "Kids Apparel",
      desc: { ko: "유아·키즈 패션 — 맘카페 마케팅 핵심", en: "Kids apparel" },
    },
  ],

  // ═════════════════════════════════════════════════════════════
  // FITNESS — 필요시 추가
  // ═════════════════════════════════════════════════════════════
  "pilates-studio": [
    {
      id: "reformer-pilates",
      ko: "리포머 필라테스 (그룹·1:1)",
      en: "Reformer Pilates",
      desc: { ko: "리포머 머신 4-8대 — 객단가 4-8만/세션", en: "Reformer pilates" },
    },
    {
      id: "mat-pilates",
      ko: "매트 필라테스 (그룹 8-12명)",
      en: "Mat Pilates",
      desc: { ko: "공간 효율 + 회전 강점 — 객단가 1.5-3만", en: "Mat pilates groups" },
    },
    {
      id: "rehab-pilates",
      ko: "재활 필라테스 (1:1)",
      en: "Rehab Pilates",
      desc: { ko: "병원 연계 + 1:1 시술 — 자격증 필수", en: "1:1 rehab pilates" },
    },
  ],

  // ═════════════════════════════════════════════════════════════
  // EDUCATION — 필요시 추가
  // ═════════════════════════════════════════════════════════════
  "kids-academy": [
    {
      id: "english-academy",
      ko: "영어 학원",
      en: "English Academy",
      desc: { ko: "초중고 영어 — 회화·문법·시험 분기", en: "English academy" },
    },
    {
      id: "math-academy",
      ko: "수학 학원",
      en: "Math Academy",
      desc: { ko: "초중고 수학 — 학년·시험 분기", en: "Math academy" },
    },
    {
      id: "music-art-academy",
      ko: "음악·미술 학원",
      en: "Music / Art Academy",
      desc: { ko: "피아노·미술·발레 — 1:1 또는 소그룹", en: "Music & art" },
    },
    {
      id: "coding-stem-academy",
      ko: "코딩·STEM 학원",
      en: "Coding / STEM",
      desc: { ko: "초중등 코딩·로봇 — 트렌디한 분야", en: "Coding & STEM" },
    },
  ],

  // ═════════════════════════════════════════════════════════════
  // PET — 필요시 추가
  // ═════════════════════════════════════════════════════════════
  "pet-grooming": [
    {
      id: "small-dog-grooming",
      ko: "소형견 전문",
      en: "Small Dog Grooming",
      desc: { ko: "푸들·말티즈·시츄 등 — 회전 강점", en: "Small dog grooming" },
    },
    {
      id: "large-dog-grooming",
      ko: "대형견 전문",
      en: "Large Dog Grooming",
      desc: { ko: "리트리버·시바 등 — 시술 시간 + 단가 높음", en: "Large dog grooming" },
    },
    {
      id: "all-breed-cat-grooming",
      ko: "고양이 + 전 견종",
      en: "Cat + All Breeds",
      desc: { ko: "고양이 + 다양 견종 — 자격·경험 필수", en: "Cat + all breeds" },
    },
  ],
};

/**
 * sub-industry 에 specialty 옵션이 정의돼 있는지 확인.
 * UI 가 specialty 단계를 보여줄지 여부 결정.
 */
export function hasSpecialties(subIndustryId?: string): boolean {
  if (!subIndustryId) return false;
  const list = SPECIALTY_BY_SUB_INDUSTRY[subIndustryId];
  return !!list && list.length > 0;
}

/**
 * sub-industry 의 specialty 옵션 조회 (없으면 빈 배열).
 */
export function getSpecialties(subIndustryId?: string): SpecialtyOption[] {
  if (!subIndustryId) return [];
  return SPECIALTY_BY_SUB_INDUSTRY[subIndustryId] ?? [];
}

/**
 * specialty ID 로 라벨·설명 조회.
 */
export function getSpecialtyById(specialtyId?: string): SpecialtyOption | undefined {
  if (!specialtyId) return undefined;
  for (const list of Object.values(SPECIALTY_BY_SUB_INDUSTRY)) {
    const found = list.find((s) => s.id === specialtyId);
    if (found) return found;
  }
  return undefined;
}
