/**
 * 마케팅 트렌드 클러스터 매핑.
 *
 * 66개 세부업종(`starterIndustryOptions`)을 20개 그룹으로 묶어
 * 매일 1회 AI 생성 → fan-out 저장. 동일 소셜 포맷·밈 풀을 공유하는
 * 업종만 같은 그룹으로 묶음.
 *
 * 비용 절감 목적 — 66회 호출 → 20회 호출 (약 70% 절감).
 */

export type TrendGroupKey =
  | "food-delivery"         // 치킨·버거·피자·배달
  | "korean-homestyle"      // 한식·국밥·면류
  | "salad-healthy"         // 샐러드·건강식
  | "western-pasta-brunch"  // 양식·파스타·브런치
  | "coffee-budget"         // 저가·무인 테이크아웃 커피
  | "coffee-specialty"      // 스페셜티 커피
  | "dessert-bakery"        // 디저트·베이커리·빙수·아이스크림
  | "convenience"           // 편의점·무인 리테일
  | "lifestyle-fashion"     // 라이프스타일·패션 잡화
  | "beauty-supplies"       // 뷰티 용품 판매 (코스메틱)
  | "health-food-store"     // 건강식품 판매
  | "hair-salon"            // 미용실
  | "beauty-care"           // 네일·속눈썹·왁싱
  | "skin-care-room"        // 피부관리·시술
  | "makeup-bridal"         // 웨딩 메이크업
  | "mindful-fitness"       // 필라테스·요가
  | "strength-fitness"      // PT·크로스핏·무인 짐
  | "golf-studio"           // 스크린골프
  | "kids-academy"          // 아동·영어·코딩 학원
  | "study-space"           // 스터디카페·독서실
  | "adult-class"           // 성인 취미·자격증
  | "pet-care"              // 펫 그루밍·호텔·훈련·방문
  | "pet-supplies"          // 펫 용품
  | "pet-cafe"              // 펫 카페
  | "laundry"               // 세탁·코인세탁
  | "cleaning-service"      // 청소
  | "repair"                // 수리 서비스
  | "print-copy"            // 프린트·복사
  | "rental-space"          // 렌탈 스튜디오·파티룸·연습실
  | "guesthouse"            // 게스트하우스
  | "study-cafe-space"      // 공유 스터디 공간
  | "shared-office"         // 공유 오피스
  | "ecommerce"             // 스마트스토어·위탁·해외구매
  | "digital-subscription"  // 디지털 상품·뉴스레터 구독
  | "creator-service"       // 크리에이터·전문가 서비스
  | "b2b-tech";             // B2B SaaS·AI·핀테크·헬스테크·보안·개발툴

/** 66 세부업종 → 20 그룹 매핑. */
export const SUB_INDUSTRY_TO_GROUP: Record<string, TrendGroupKey> = {
  // food
  "chicken-burger": "food-delivery",
  "delivery-meals": "food-delivery",
  "korean-casual": "korean-homestyle",
  "ramen-noodle": "korean-homestyle",
  "salad-healthy": "salad-healthy",
  "western-pasta-brunch": "western-pasta-brunch",

  // cafe-dessert
  "takeout-coffee": "coffee-budget",
  "self-serve-cafe": "coffee-budget",
  "specialty-coffee": "coffee-specialty",
  "dessert-cafe": "dessert-bakery",
  "bakery-studio": "dessert-bakery",
  "icecream-bingsu": "dessert-bakery",

  // retail
  "convenience-small": "convenience",
  "unmanned-retail": "convenience",
  "lifestyle-goods": "lifestyle-fashion",
  "fashion-accessories": "lifestyle-fashion",
  "beauty-supplies": "beauty-supplies",
  "health-food-store": "health-food-store",

  // beauty
  "hair-salon": "hair-salon",
  "nail-studio": "beauty-care",
  "eyelash-brow": "beauty-care",
  "waxing-studio": "beauty-care",
  "skin-care-room": "skin-care-room",
  "makeup-bridal": "makeup-bridal",

  // fitness
  "pilates-studio": "mindful-fitness",
  "yoga-studio": "mindful-fitness",
  "pt-gym": "strength-fitness",
  "crossfit-box": "strength-fitness",
  "unmanned-fitness": "strength-fitness",
  "golf-studio": "golf-studio",

  // education
  "kids-academy": "kids-academy",
  "language-academy": "kids-academy",
  "coding-class": "kids-academy",
  "study-room": "study-space",
  "small-study-room": "study-space",
  "adult-class": "adult-class",

  // pet
  "pet-grooming": "pet-care",
  "pet-hotel": "pet-care",
  "pet-training-school": "pet-care",
  "pet-walking-visit": "pet-care",
  "pet-supplies": "pet-supplies",
  "pet-cafe": "pet-cafe",

  // living-service
  "laundry-service": "laundry",
  "self-laundry": "laundry",
  "cleaning-service": "cleaning-service",
  "repair-service": "repair",
  "device-repair": "repair",
  "print-copy": "print-copy",

  // space
  "rental-studio": "rental-space",
  "party-room": "rental-space",
  "practice-room": "rental-space",
  "guesthouse": "guesthouse",
  "study-cafe-space": "study-cafe-space",
  "shared-office": "shared-office",

  // online-digital
  "smart-store": "ecommerce",
  "consignment-commerce": "ecommerce",
  "global-buying": "ecommerce",
  "digital-products": "digital-subscription",
  "newsletter-membership": "digital-subscription",
  "creator-service": "creator-service",

  // startup-tech
  "ai-application": "b2b-tech",
  "developer-tools": "b2b-tech",
  "b2b-saas": "b2b-tech",
  "fintech-startup": "b2b-tech",
  "healthtech-startup": "b2b-tech",
  "security-startup": "b2b-tech",
};

/** 각 그룹의 라벨 — AI 프롬프트에 주입되는 한글/영문 업종명. */
export const TREND_GROUP_LABELS: Record<TrendGroupKey, { ko: string; en: string; categoryId: string }> = {
  "food-delivery":        { ko: "치킨·버거·배달음식",   en: "Chicken/Burger/Delivery", categoryId: "food" },
  "korean-homestyle":     { ko: "한식·국밥·면류",        en: "Korean homestyle",        categoryId: "food" },
  "salad-healthy":        { ko: "샐러드·건강식",         en: "Salad & healthy",         categoryId: "food" },
  "western-pasta-brunch": { ko: "양식·파스타·브런치",    en: "Western/Pasta/Brunch",    categoryId: "food" },
  "coffee-budget":        { ko: "저가·무인 테이크아웃 커피", en: "Budget takeout coffee", categoryId: "cafe-dessert" },
  "coffee-specialty":     { ko: "스페셜티 커피",         en: "Specialty coffee",        categoryId: "cafe-dessert" },
  "dessert-bakery":       { ko: "디저트·베이커리·빙수",  en: "Dessert & bakery",        categoryId: "cafe-dessert" },
  "convenience":          { ko: "편의점·무인 리테일",    en: "Convenience & unmanned",  categoryId: "retail" },
  "lifestyle-fashion":    { ko: "라이프스타일·패션 잡화", en: "Lifestyle & fashion",     categoryId: "retail" },
  "beauty-supplies":      { ko: "뷰티 용품",             en: "Beauty supplies",         categoryId: "retail" },
  "health-food-store":    { ko: "건강식품",              en: "Health food store",       categoryId: "retail" },
  "hair-salon":           { ko: "미용실",                en: "Hair salon",              categoryId: "beauty" },
  "beauty-care":          { ko: "네일·속눈썹·왁싱",      en: "Nail/Lash/Wax",           categoryId: "beauty" },
  "skin-care-room":       { ko: "피부관리",              en: "Skin care",               categoryId: "beauty" },
  "makeup-bridal":        { ko: "웨딩 메이크업",         en: "Bridal makeup",           categoryId: "beauty" },
  "mindful-fitness":      { ko: "필라테스·요가",         en: "Pilates & yoga",          categoryId: "fitness" },
  "strength-fitness":     { ko: "PT·크로스핏·무인 짐",   en: "Strength & gym",          categoryId: "fitness" },
  "golf-studio":          { ko: "스크린골프",            en: "Screen golf",             categoryId: "fitness" },
  "kids-academy":         { ko: "아동 학원·영어·코딩",   en: "Kids academy",            categoryId: "education" },
  "study-space":          { ko: "스터디카페·독서실",     en: "Study cafe",              categoryId: "education" },
  "adult-class":          { ko: "성인 취미·자격증",      en: "Adult class",             categoryId: "education" },
  "pet-care":             { ko: "펫 그루밍·호텔·훈련",   en: "Pet care service",        categoryId: "pet" },
  "pet-supplies":         { ko: "펫 용품",               en: "Pet supplies",            categoryId: "pet" },
  "pet-cafe":             { ko: "펫 카페",               en: "Pet cafe",                categoryId: "pet" },
  "laundry":              { ko: "세탁·코인세탁",         en: "Laundry",                 categoryId: "living-service" },
  "cleaning-service":     { ko: "청소 서비스",           en: "Cleaning service",        categoryId: "living-service" },
  "repair":               { ko: "수리 서비스",           en: "Repair service",          categoryId: "living-service" },
  "print-copy":           { ko: "프린트·복사",           en: "Print & copy",            categoryId: "living-service" },
  "rental-space":         { ko: "렌탈 스튜디오·파티룸",  en: "Rental studio",           categoryId: "space" },
  "guesthouse":           { ko: "게스트하우스",          en: "Guesthouse",              categoryId: "space" },
  "study-cafe-space":     { ko: "공유 스터디 공간",      en: "Shared study space",      categoryId: "space" },
  "shared-office":        { ko: "공유 오피스",           en: "Shared office",           categoryId: "space" },
  "ecommerce":            { ko: "스마트스토어·이커머스", en: "E-commerce",              categoryId: "online-digital" },
  "digital-subscription": { ko: "디지털 상품·구독",      en: "Digital subscription",    categoryId: "online-digital" },
  "creator-service":      { ko: "크리에이터·전문가 서비스", en: "Creator service",      categoryId: "online-digital" },
  "b2b-tech":             { ko: "B2B 테크·SaaS·AI",      en: "B2B Tech/SaaS",           categoryId: "startup-tech" },
};

/** 그룹별 소속 sub_industry_id 역매핑 (fan-out 저장용). */
export const GROUP_TO_SUB_INDUSTRIES: Record<TrendGroupKey, string[]> = (() => {
  const map = {} as Record<TrendGroupKey, string[]>;
  for (const [subId, groupKey] of Object.entries(SUB_INDUSTRY_TO_GROUP)) {
    if (!map[groupKey]) map[groupKey] = [];
    map[groupKey].push(subId);
  }
  return map;
})();

/** 모든 그룹 키 배열 (cron 순회용). */
export const ALL_TREND_GROUPS: TrendGroupKey[] = Object.keys(TREND_GROUP_LABELS) as TrendGroupKey[];

/** sub-industry ID → 그룹 키 조회 (없으면 null). */
export function resolveTrendGroup(subIndustryId: string | undefined | null): TrendGroupKey | null {
  if (!subIndustryId) return null;
  return SUB_INDUSTRY_TO_GROUP[subIndustryId] ?? null;
}
