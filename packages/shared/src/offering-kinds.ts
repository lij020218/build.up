/**
 * 오퍼링 유형 SSOT — "내가 파는 것" 페이지의 업종 분기 정본 (2026-07-25 사장님 승인).
 *
 * 배경: "재고·메뉴 관리를 따로 페이지로" 피드백. 페이지의 정체성은 '재고'가 아니라
 * **오퍼링(내가 파는 것) 관리**다 — 업종에 따라 그 형태가 메뉴/상품/시술/이용권/플랜로
 * 다를 뿐이다. "비표시가 아니라 맞게 표시" 원칙: 재고가 없는 업종엔 재고 섹션이 없어야 하고,
 * 그 업종의 판매 단위가 1급 시민으로 보여야 한다.
 *
 * 사장님 결정 사항 (2026-07-25):
 *  - 스터디카페: 정기권 갱신 관리가 아니라 **권종(시간권·금액권)별 판매 수** 중심
 *    (매번 달라지는 이용객). → membership 유형 전체에 "권종별 판매 수" 섹션을 기본화.
 *  - 경계 4건 확정: 스터디카페·독서실=membership / 공유오피스=membership /
 *    펫호텔=space-booking / 펫카페=menu-bom(입장료는 메뉴 항목).
 *  - startup-tech 계열은 탭 숨김 — SaaS 요금제는 재무·지표 쪽이 자리, 딥테크는 수주 단계.
 *
 * 정합: 세부업종 목록 = starter-data.ts starterIndustryOptions (70개).
 *  누락·초과는 offering-kinds-coverage.test.ts 가 CI 에서 차단 (wipe 커버리지 가드 방식).
 * 데이터 정본: inventory 스토어(itemType=product) — 이 파일은 **UI 구성 분기**만 담당,
 *  데이터 모델은 바꾸지 않는다 (2026-07-22 상품·메뉴 통합 유지).
 */

/** 오퍼링 유형 — 페이지의 섹션 구성을 결정한다. */
export type OfferingKind =
  | "menu-bom"          // 메뉴 판매 + 재료 재고(BOM 차감·원가율) — 외식·카페
  | "stocked-goods"     // 상품 재고 판매(수량 추적·마진) — 소매·이커머스
  | "service-menu"      // 시술·서비스 가격표(재고 없음, 소모품 옵션) — 뷰티·생활서비스
  | "membership"        // 회원권·수강권·이용권 권종 + 권종별 판매 수 — 피트니스·교육·스터디카페
  | "space-booking"     // 공간·시간 단위 요금표 — 파티룸·게스트하우스·연습실
  | "digital-goods"     // 무재고 디지털 상품 카탈로그
  | "subscription-plan" // 구독 플랜(가격·주기)
  | "project-service"   // 건별 용역·패키지(견적 단가)
  | "hidden";           // 오퍼링 탭 미노출 (startup-tech 계열)

export type OfferingKindMeta = {
  kind: OfferingKind;
  /** 탭·페이지 제목 (업종 눈높이 언어) */
  tabLabel: { ko: string; en: string };
  /** 판매 단위 명칭 — "메뉴" / "상품" / "시술" / "이용권" … 섹션 카피에 사용 */
  unitLabel: { ko: string; en: string };
  /** 페이지 헤더 서브 카피 — 웹·iOS 동일 문구 (codegen 으로 Swift 전파) */
  pageSub: { ko: string; en: string };
  /** 재고 수량 섹션: "none"=없음, "core"=핵심(상품/재료), "optional"=접힘 옵션(소모품·부품) */
  stockSection: "none" | "core" | "optional";
  /** 원가율 자동 계산 노출 — 재료 BOM 이 실재하는 업종만 (정직성: 서비스 원가 자동계산 금지) */
  showCostRatio: boolean;
  /** 판매 수 카운트 섹션 — 권종/메뉴/상품별 판매량 (membership 은 "권종별 회원 수"로 읽힘) */
  showSalesCount: boolean;
};

export const OFFERING_KIND_META: Record<Exclude<OfferingKind, "hidden">, OfferingKindMeta> = {
  "menu-bom": {
    kind: "menu-bom",
    tabLabel: { ko: "메뉴·재료", en: "Menu & Ingredients" },
    unitLabel: { ko: "메뉴", en: "Menu item" },
    pageSub: { ko: "메뉴 가격·레시피 원가율·재료 재고를 한곳에서. 판매를 기록하면 재료가 자동 차감돼요.", en: "Menu prices, recipe cost ratios, and ingredient stock in one place." },
    stockSection: "core",      // 재료 재고 (BOM 차감)
    showCostRatio: true,
    showSalesCount: true,
  },
  "stocked-goods": {
    kind: "stocked-goods",
    tabLabel: { ko: "상품·재고", en: "Products & Stock" },
    unitLabel: { ko: "상품", en: "Product" },
    pageSub: { ko: "상품·수량·마진을 한곳에서. 발주가 필요한 상품을 놓치지 않게.", en: "Products, quantities, and margins — never miss a reorder." },
    stockSection: "core",      // 상품 수량
    showCostRatio: false,      // 매입가 기반 마진은 표시하되 '원가율 자동계산' 배지는 menu-bom 전용
    showSalesCount: true,
  },
  "service-menu": {
    kind: "service-menu",
    tabLabel: { ko: "시술·서비스", en: "Services" },
    unitLabel: { ko: "서비스", en: "Service" },
    pageSub: { ko: "시술·서비스 가격표를 정리하세요. 소모품 재고는 아래에서 함께 관리돼요.", en: "Your service price list, with optional supplies tracking." },
    stockSection: "optional",  // 소모품·부품 (기본 접힘)
    showCostRatio: false,      // 서비스 원가는 인건비 중심 — 자동계산은 위조
    showSalesCount: true,
  },
  membership: {
    kind: "membership",
    tabLabel: { ko: "이용권·회원권", en: "Passes & Memberships" },
    unitLabel: { ko: "권종", en: "Pass" },
    pageSub: { ko: "권종(시간권·기간권·금액권)을 등록하고, 권종별로 이번 달 몇 명인지 기록하세요.", en: "Register pass types and track how many sold this month." },
    stockSection: "none",
    showCostRatio: false,
    // 사장님 결정(2026-07-25): 스터디카페처럼 뜨내기 중심 업종은 "시간대별·권종별 판매 수"가
    // 관리의 핵심 — 갱신 관리가 아니라 권종 카탈로그 + 판매 수 카운트를 기본 섹션으로.
    showSalesCount: true,
  },
  "space-booking": {
    kind: "space-booking",
    tabLabel: { ko: "요금·이용권", en: "Rates & Passes" },
    unitLabel: { ko: "요금제", en: "Rate" },
    pageSub: { ko: "공간·시간 단위 요금을 정리하고 이용 건수를 기록하세요.", en: "Organize rates by time slot and track bookings." },
    stockSection: "none",
    showCostRatio: false,
    showSalesCount: true,
  },
  "digital-goods": {
    kind: "digital-goods",
    tabLabel: { ko: "상품 카탈로그", en: "Catalog" },
    unitLabel: { ko: "상품", en: "Product" },
    pageSub: { ko: "디지털 상품 카탈로그 — 재고 걱정 없이 상품과 가격, 판매 수만.", en: "Digital catalog — products, prices, and sales counts." },
    stockSection: "none",      // 무재고
    showCostRatio: false,
    showSalesCount: true,
  },
  "subscription-plan": {
    kind: "subscription-plan",
    tabLabel: { ko: "플랜·구독", en: "Plans" },
    unitLabel: { ko: "플랜", en: "Plan" },
    pageSub: { ko: "플랜 구성과 가격, 플랜별 구독자 수를 정리하세요.", en: "Plan tiers, pricing, and subscriber counts." },
    stockSection: "none",
    showCostRatio: false,
    showSalesCount: true,      // 플랜별 구독자 수(수동 입력) — 자동 집계는 데이터 생기면
  },
  "project-service": {
    kind: "project-service",
    tabLabel: { ko: "서비스·패키지", en: "Packages" },
    unitLabel: { ko: "패키지", en: "Package" },
    pageSub: { ko: "서비스 패키지와 견적 단가를 정리하고 수주 건수를 기록하세요.", en: "Service packages, quote rates, and won projects." },
    stockSection: "none",
    showCostRatio: false,
    showSalesCount: true,
  },
};

/** 보조 플래그 — primary 유형 위에 얹는 업종별 옵션 섹션. */
export type OfferingFlags = {
  /** 회차권 판매(피부관리 10회권 등) — service-menu 업종의 접힘 섹션 */
  supportsPasses?: boolean;
  /** 소모품·부품 재고가 실질 중요(휴대폰 수리 부품 등) — optional 재고 섹션 기본 펼침 */
  consumablesImportant?: boolean;
  /** 위탁 판매 — 재고 수량이 '실보유'가 아님을 표기 */
  consignment?: boolean;
};

/** 세부업종 → 오퍼링 유형 전수 매핑 (70개 — 2026-07-25 사장님 승인 분류). */
export const SUB_INDUSTRY_OFFERING: Record<string, { kind: OfferingKind; flags?: OfferingFlags }> = {
  // ── 외식 (menu-bom) ──
  "korean-casual":        { kind: "menu-bom" },
  "delivery-meals":       { kind: "menu-bom" },
  "salad-healthy":        { kind: "menu-bom" },
  "ramen-noodle":         { kind: "menu-bom" },
  "chicken-burger":       { kind: "menu-bom" },
  "western-pasta-brunch": { kind: "menu-bom" },
  // ── 카페·디저트 (menu-bom) ──
  "takeout-coffee":       { kind: "menu-bom" },
  "specialty-coffee":     { kind: "menu-bom" },
  "dessert-cafe":         { kind: "menu-bom" },
  "bakery-studio":        { kind: "menu-bom" },
  "icecream-bingsu":      { kind: "menu-bom" },
  "self-serve-cafe":      { kind: "menu-bom" },
  // ── 소매 (stocked-goods) ──
  "convenience-small":    { kind: "stocked-goods" },
  "lifestyle-goods":      { kind: "stocked-goods" },
  "beauty-supplies":      { kind: "stocked-goods" },
  "fashion-accessories":  { kind: "stocked-goods" },
  "health-food-store":    { kind: "stocked-goods" },
  "unmanned-retail":      { kind: "stocked-goods" },
  // ── 뷰티 (service-menu + 회차권) ──
  "hair-salon":           { kind: "service-menu", flags: { supportsPasses: true } },
  "nail-studio":          { kind: "service-menu", flags: { supportsPasses: true } },
  "skin-care-room":       { kind: "service-menu", flags: { supportsPasses: true } },
  "waxing-studio":        { kind: "service-menu", flags: { supportsPasses: true } },
  "eyelash-brow":         { kind: "service-menu", flags: { supportsPasses: true } },
  "makeup-bridal":        { kind: "service-menu" },
  // ── 피트니스 (membership) ──
  "pilates-studio":       { kind: "membership" },
  "pt-gym":               { kind: "membership" },
  "yoga-studio":          { kind: "membership" },
  "crossfit-box":         { kind: "membership" },
  "golf-studio":          { kind: "membership" },
  "unmanned-fitness":     { kind: "membership" },
  // ── 교육 (membership — 수강권·이용권) ──
  "study-room":           { kind: "membership" },   // 좌석 이용권 (사장님 확정)
  "kids-academy":         { kind: "membership" },
  "adult-class":          { kind: "membership" },
  "language-academy":     { kind: "membership" },
  "coding-class":         { kind: "membership" },
  "small-study-room":     { kind: "membership" },
  // ── 펫 ──
  "pet-grooming":         { kind: "service-menu", flags: { supportsPasses: true } },
  "pet-supplies":         { kind: "stocked-goods" },
  "pet-hotel":            { kind: "space-booking" },  // 1박·데이케어 단위 (사장님 확정)
  "pet-cafe":             { kind: "menu-bom" },       // 입장료는 메뉴 항목으로 (사장님 확정)
  "pet-training-school":  { kind: "membership" },
  // ── 생활서비스 (service-menu) ──
  "laundry-service":      { kind: "service-menu" },
  "cleaning-service":     { kind: "service-menu" },
  "repair-service":       { kind: "service-menu" },
  "self-laundry":         { kind: "service-menu" },
  "print-copy":           { kind: "service-menu", flags: { consumablesImportant: true } },
  "device-repair":        { kind: "service-menu", flags: { consumablesImportant: true } }, // 부품=실재고
  // ── 공간 ──
  "guesthouse":           { kind: "space-booking" },
  "rental-studio":        { kind: "space-booking" },
  "party-room":           { kind: "space-booking" },
  "study-cafe-space":     { kind: "membership" },   // 권종(시간권·금액권)별 판매 수 중심 (사장님 확정)
  "shared-office":        { kind: "membership" },   // 월 멤버십 (사장님 확정)
  "practice-room":        { kind: "space-booking" },
  // ── 온라인·디지털 ──
  "smart-store":            { kind: "stocked-goods" },
  "digital-products":       { kind: "digital-goods" },
  "creator-service":        { kind: "project-service" },
  "consignment-commerce":   { kind: "stocked-goods", flags: { consignment: true } },
  "newsletter-membership":  { kind: "subscription-plan" },
  "global-buying":          { kind: "stocked-goods" },
  // ── startup-tech (탭 숨김 — 요금제는 재무·지표가 자리, 딥테크는 수주 단계) ──
  "ai-application":       { kind: "hidden" },
  "developer-tools":      { kind: "hidden" },
  "b2b-saas":             { kind: "hidden" },
  "fintech-startup":      { kind: "hidden" },
  "healthtech-startup":   { kind: "hidden" },
  "security-startup":     { kind: "hidden" },
  "hardware-iot":         { kind: "hidden" },
  "robotics-physical-ai": { kind: "hidden" },
  "semiconductor":        { kind: "hidden" },
  "biotech-medtech":      { kind: "hidden" },
  "climate-energy":       { kind: "hidden" },
};

/** 대분류 폴백 — 세부업종 미선택/미매핑 시 안전값 (categoryId 기준). */
export const CATEGORY_OFFERING_FALLBACK: Record<string, OfferingKind> = {
  "food": "menu-bom",
  "cafe-dessert": "menu-bom",
  "retail": "stocked-goods",
  "beauty": "service-menu",
  "fitness": "membership",
  "education": "membership",
  "pet": "service-menu",
  "living-service": "service-menu",
  "space": "space-booking",
  "online-digital": "stocked-goods",
  "startup-tech": "hidden",
};

/** 세부업종(우선) → 대분류 폴백 순으로 오퍼링 유형 해석. 못 찾으면 menu-bom (food 기본값 관례). */
export function resolveOfferingKind(subIndustryId: string | null | undefined, categoryId: string | null | undefined): OfferingKind {
  if (subIndustryId && SUB_INDUSTRY_OFFERING[subIndustryId]) return SUB_INDUSTRY_OFFERING[subIndustryId].kind;
  if (categoryId && CATEGORY_OFFERING_FALLBACK[categoryId]) return CATEGORY_OFFERING_FALLBACK[categoryId];
  return "menu-bom";
}

export function resolveOfferingFlags(subIndustryId: string | null | undefined): OfferingFlags {
  return (subIndustryId && SUB_INDUSTRY_OFFERING[subIndustryId]?.flags) || {};
}

/** 탭 노출 여부 — hidden 업종은 오퍼링 탭 자체를 렌더하지 않는다. */
export function offeringTabVisible(subIndustryId: string | null | undefined, categoryId: string | null | undefined): boolean {
  return resolveOfferingKind(subIndustryId, categoryId) !== "hidden";
}

export function offeringMeta(kind: Exclude<OfferingKind, "hidden">): OfferingKindMeta {
  return OFFERING_KIND_META[kind];
}
