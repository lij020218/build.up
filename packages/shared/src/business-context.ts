export type BusinessCategory =
  | "food"
  | "cafe-dessert"
  | "retail"
  | "beauty"
  | "fitness"
  | "education"
  | "pet"
  | "living-service"
  | "space"
  | "online-digital"
  | "startup-tech";

/**
 * inventoryMode — 업종별 재고-제품 관계:
 *   separate : 원재료(재고) + 완성품(메뉴) 분리  → food, cafe-dessert
 *   unified  : 판매상품 = 재고, 하나의 카드       → retail, online-digital, pet, startup-tech
 *   service  : 소모품(재고) + 서비스메뉴(제품) 분리 → beauty, living-service
 *   minimal  : 소모품만(선택적), 제품→회원관리     → fitness, education, space
 */
export type InventoryMode = "separate" | "unified" | "service" | "minimal";

/**
 * customerMode — 업종별 고객관리 유형:
 *   membership  : 회원제 (월정액, 이용권, 반복 방문) → fitness, education, space
 *   appointment : 예약·시술 기반 (방문 이력, 시술 기록, 선호도) → beauty, pet
 *   repeat      : 단골 관리 (재방문 유도, 포인트, 쿠폰) → food, cafe-dessert, living-service
 *   pipeline    : 영업 파이프라인 (리드→미팅→계약→온보딩) → startup-tech
 *   ecommerce   : 구매자 관리 (주문 이력, 리뷰, 재구매) → retail, online-digital
 *   none        : 고객관리 불필요 또는 최소
 */
export type CustomerMode = "membership" | "appointment" | "repeat" | "pipeline" | "ecommerce" | "none";

/**
 * expenseMode — 업종별 비용 관리 유형:
 *   food-cogs : 식재료 + 포장재 + 배달수수료         → food, cafe-dessert
 *   purchase  : 상품매입 + 배송비 + 플랫폼수수료      → retail, online-digital
 *   supply    : 시술재료 + 소모품 + 교육비           → beauty, pet
 *   facility  : 시설유지 + 장비 + 소모품             → fitness, space
 *   content   : 교재/교구 + 콘텐츠 제작              → education
 *   infra     : 서버/클라우드 + SaaS + 외주           → startup-tech
 *   general   : 일반 비용                            → living-service
 *
 * 내부 데이터 구조(MonthlyCosts)는 변경하지 않음.
 * ingredients = 주요 변동비(COGS), UI에서만 업종별 레이블로 표시.
 */
export type ExpenseMode = "food-cogs" | "purchase" | "supply" | "facility" | "content" | "infra" | "general";

export type ExpenseFieldConfig = {
  fieldKey: "ingredients" | "labor" | "rent" | "utilities" | "other";
  label: { ko: string; en: string };
  placeholder: string;
  description: { ko: string; en: string };
};

export type BusinessContext = {
  categoryId: BusinessCategory | null;
  isDeliveryRelevant: boolean;
  isOnlineStore: boolean;
  isServiceBusiness: boolean;
  isRecurringRevenue: boolean;
  hasPhysicalInventory: boolean;
  inventoryMode: InventoryMode;
  inventoryLabel: { ko: string; en: string };
  productLabel: { ko: string; en: string };
  showProductCard: boolean;
  showInventoryCard: boolean;
  /** 고객관리 유형 */
  customerMode: CustomerMode;
  /** 고객관리 카드 표시 여부 */
  showCustomerCard: boolean;
  /** 고객관리 카드 라벨 */
  customerLabel: { ko: string; en: string };
  /** 비용 관리 유형 */
  expenseMode: ExpenseMode;
  /** 비용 입력 필드 설정 (항상 5개, core MonthlyCosts 필드에 매핑) */
  expenseFields: ExpenseFieldConfig[];
  /** 비용 관리 섹션 라벨 */
  expenseLabel: { ko: string; en: string };
};

export function resolveBusinessContext(categoryId: string | null | undefined): BusinessContext {
  const id = (categoryId ?? null) as BusinessCategory | null;

  const inventoryMode: InventoryMode =
    id === "food" || id === "cafe-dessert" ? "separate"
    : id === "retail" || id === "online-digital" || id === "pet" || id === "startup-tech" ? "unified"
    : id === "beauty" || id === "living-service" ? "service"
    : "minimal";

  const inventoryLabel =
    inventoryMode === "separate" ? { ko: "식재료 재고", en: "Ingredients" }
    : inventoryMode === "unified" && id === "startup-tech" ? { ko: "운영 자산", en: "Ops Assets" }
    : inventoryMode === "unified" ? { ko: "내 제품", en: "My Products" }
    : inventoryMode === "service" ? { ko: "소모품 관리", en: "Supplies" }
    : { ko: "소모품", en: "Supplies" };

  const productLabel =
    inventoryMode === "separate" ? { ko: "메뉴 관리", en: "Menu" }
    : inventoryMode === "unified" && id === "startup-tech" ? { ko: "제품·플랜", en: "Product Plans" }
    : inventoryMode === "unified" ? { ko: "내 제품", en: "My Products" }
    : inventoryMode === "service" ? { ko: "서비스 메뉴", en: "Services" }
    : { ko: "", en: "" };

  // unified 모델: 제품=재고이므로 카드 1개만 표시 (재고 카드를 "내 제품"으로 표시)
  // separate 모델: 재고(원재료) + 제품(메뉴) 2개 카드
  // service 모델: 소모품(재고) + 서비스메뉴(제품) 2개 카드
  // minimal 모델: 재고 카드 선택적 (소모품), 제품 카드 없음
  const showProductCard = inventoryMode === "separate" || inventoryMode === "service";
  const showInventoryCard = inventoryMode !== "minimal" || id === "pet";

  // ── 고객관리 모델 ──
  // membership: 헬스장·학원·스터디카페 등 회원제 (월정액, 이용권, 출석 관리)
  // appointment: 미용실·네일·펫미용 등 예약제 (방문 이력, 시술 기록, 선호도)
  // repeat: 음식점·카페·생활서비스 등 단골 관리 (재방문 유도, 적립, 쿠폰)
  // pipeline: B2B SaaS·스타트업 등 영업 파이프라인 (리드→미팅→계약→온보딩)
  // ecommerce: 소매·온라인몰 등 구매자 관리 (주문 이력, 리뷰, 재구매율)
  // none: 고객관리 불필요
  const customerMode: CustomerMode =
    id === "fitness" || id === "education" || id === "space" ? "membership"
    : id === "beauty" || id === "pet" ? "appointment"
    : id === "food" || id === "cafe-dessert" || id === "living-service" ? "repeat"
    : id === "startup-tech" ? "pipeline"
    : id === "retail" || id === "online-digital" ? "ecommerce"
    : "none";

  const showCustomerCard = customerMode !== "none";

  const customerLabel: { ko: string; en: string } =
    customerMode === "membership" ? { ko: "회원 관리", en: "Members" }
    : customerMode === "appointment" ? { ko: "고객·예약 관리", en: "Clients & Bookings" }
    : customerMode === "repeat" ? { ko: "단골 관리", en: "Regulars" }
    : customerMode === "pipeline" ? { ko: "고객·파이프라인", en: "Leads & Pipeline" }
    : customerMode === "ecommerce" ? { ko: "구매자 관리", en: "Customers" }
    : { ko: "", en: "" };

  // ── 비용 관리 모델 ──
  const expenseMode: ExpenseMode =
    id === "food" || id === "cafe-dessert" ? "food-cogs"
    : id === "retail" || id === "online-digital" ? "purchase"
    : id === "beauty" || id === "pet" ? "supply"
    : id === "fitness" || id === "space" ? "facility"
    : id === "education" ? "content"
    : id === "startup-tech" ? "infra"
    : "general";

  const expenseFields = getExpenseFields(expenseMode, id);

  const expenseLabel: { ko: string; en: string } =
    expenseMode === "food-cogs" ? { ko: "원가 관리", en: "Cost Management" }
    : expenseMode === "purchase" ? { ko: "매입·비용 관리", en: "Purchase & Costs" }
    : expenseMode === "infra" ? { ko: "번레이트 관리", en: "Burn Rate" }
    : { ko: "비용 관리", en: "Cost Management" };

  return {
    categoryId: id,
    isDeliveryRelevant: id === "food" || id === "cafe-dessert",
    isOnlineStore: id === "online-digital",
    isServiceBusiness: id === "beauty" || id === "fitness" || id === "pet" || id === "living-service",
    isRecurringRevenue: id === "fitness" || id === "education" || id === "space",
    hasPhysicalInventory: id === "food" || id === "cafe-dessert" || id === "retail" || id === "pet" || id === "online-digital",
    inventoryMode,
    inventoryLabel,
    productLabel,
    showProductCard,
    showInventoryCard,
    customerMode,
    showCustomerCard,
    customerLabel,
    expenseMode,
    expenseFields,
    expenseLabel,
  };
}

// ─── 업종별 비용 입력 필드 설정 ─────────────────────────────────────────────

function getExpenseFields(mode: ExpenseMode, categoryId: BusinessCategory | null): ExpenseFieldConfig[] {
  // labor, rent, utilities는 모든 업종 공통
  const labor: ExpenseFieldConfig = {
    fieldKey: "labor",
    label: { ko: "인건비", en: "Labor" },
    placeholder: "200",
    description: { ko: "직원 급여, 4대보험 사업주 부담분, 아르바이트비", en: "Staff wages, employer insurance contributions, part-time pay" },
  };
  const rent: ExpenseFieldConfig = {
    fieldKey: "rent",
    label: { ko: "임대료", en: "Rent" },
    placeholder: "150",
    description: { ko: "월 임대료, 관리비, 주차비 등 고정 공간 비용", en: "Monthly rent, building management fee, parking" },
  };
  const utilities: ExpenseFieldConfig = {
    fieldKey: "utilities",
    label: { ko: "공과금", en: "Utilities" },
    placeholder: "30",
    description: { ko: "전기, 수도, 가스, 인터넷, 전화 요금", en: "Electricity, water, gas, internet, phone" },
  };

  // ingredients(COGS)와 other는 업종별로 다름
  switch (mode) {
    case "food-cogs": {
      const isCafe = categoryId === "cafe-dessert";
      return [
        {
          fieldKey: "ingredients",
          label: isCafe ? { ko: "원재료비", en: "Raw Materials" } : { ko: "식재료비", en: "Ingredients" },
          placeholder: isCafe ? "80" : "120",
          description: isCafe
            ? { ko: "원두, 우유, 시럽, 디저트 재료 등 매출에 비례하는 변동비", en: "Coffee beans, milk, syrup, dessert ingredients — variable costs" }
            : { ko: "식재료, 양념, 포장재 등 매출에 비례하는 변동비", en: "Food ingredients, seasonings, packaging — variable costs" },
        },
        labor, rent, utilities,
        {
          fieldKey: "other",
          label: { ko: "배달수수료·기타", en: "Delivery Fees & Other" },
          placeholder: "50",
          description: { ko: "배달앱 수수료, 카드수수료, 포장재, 소모품 등", en: "Delivery platform fees, card processing, packaging, misc" },
        },
      ];
    }
    case "purchase": {
      const isOnline = categoryId === "online-digital";
      return [
        {
          fieldKey: "ingredients",
          label: { ko: "상품 매입원가", en: "Product Purchase" },
          placeholder: isOnline ? "200" : "300",
          description: { ko: "판매할 상품의 도매/제조 매입 비용", en: "Wholesale or manufacturing cost of products for sale" },
        },
        labor, rent, utilities,
        {
          fieldKey: "other",
          label: isOnline
            ? { ko: "광고·플랫폼수수료", en: "Ads & Platform Fees" }
            : { ko: "배송비·기타", en: "Shipping & Other" },
          placeholder: isOnline ? "100" : "50",
          description: isOnline
            ? { ko: "네이버/쿠팡 수수료, 키워드 광고비, 택배비", en: "Platform commissions, keyword ads, shipping costs" }
            : { ko: "택배비, 포장재, 카드수수료, 마케팅비", en: "Shipping, packaging, card fees, marketing" },
        },
      ];
    }
    case "supply":
      return [
        {
          fieldKey: "ingredients",
          label: categoryId === "pet"
            ? { ko: "미용재료·소모품", en: "Grooming Supplies" }
            : { ko: "시술재료·소모품", en: "Treatment Supplies" },
          placeholder: "30",
          description: categoryId === "pet"
            ? { ko: "미용 도구, 샴푸, 소모품, 사료/간식 매입", en: "Grooming tools, shampoo, supplies, food/treats" }
            : { ko: "염색약, 시술 도구, 화장품, 소모품 등", en: "Hair dye, treatment tools, cosmetics, supplies" },
        },
        labor, rent, utilities,
        {
          fieldKey: "other",
          label: { ko: "교육비·기타", en: "Training & Other" },
          placeholder: "20",
          description: { ko: "직원 교육/연수비, 마케팅비, 카드수수료", en: "Staff training, marketing, card processing fees" },
        },
      ];
    case "facility":
      return [
        {
          fieldKey: "ingredients",
          label: { ko: "장비유지·소모품", en: "Equipment & Supplies" },
          placeholder: "30",
          description: categoryId === "space"
            ? { ko: "시설 유지보수, 가구/집기 교체, 청소용품", en: "Facility maintenance, furniture replacement, cleaning supplies" }
            : { ko: "운동기구 유지보수, 수건/소모품, 음료 등", en: "Equipment maintenance, towels/supplies, beverages" },
        },
        labor, rent, utilities,
        {
          fieldKey: "other",
          label: { ko: "시설관리·기타", en: "Facility & Other" },
          placeholder: "20",
          description: { ko: "청소 외주, 보험료, 마케팅비, 카드수수료", en: "Cleaning service, insurance, marketing, card fees" },
        },
      ];
    case "content":
      return [
        {
          fieldKey: "ingredients",
          label: { ko: "교재·교구비", en: "Teaching Materials" },
          placeholder: "40",
          description: { ko: "교재, 교구, 프린트 비용, 온라인 콘텐츠 제작비", en: "Textbooks, teaching aids, printing, content production" },
        },
        labor, rent, utilities,
        {
          fieldKey: "other",
          label: { ko: "콘텐츠제작·기타", en: "Content & Other" },
          placeholder: "20",
          description: { ko: "LMS 구독, 학습 플랫폼 비용, 마케팅비", en: "LMS subscriptions, learning platform fees, marketing" },
        },
      ];
    case "infra":
      return [
        {
          fieldKey: "ingredients",
          label: { ko: "서버·클라우드·SaaS", en: "Server & SaaS" },
          placeholder: "50",
          description: { ko: "AWS/GCP, Vercel, GitHub, Figma, Slack 등 인프라·SaaS 구독 비용", en: "Cloud hosting, SaaS subscriptions (AWS, Vercel, GitHub, etc.)" },
        },
        labor, rent, utilities,
        {
          fieldKey: "other",
          label: { ko: "외주비·기타", en: "Outsourcing & Other" },
          placeholder: "100",
          description: { ko: "외주 개발/디자인, 법률 자문, 마케팅, 기타 운영비", en: "Outsourced dev/design, legal, marketing, operations" },
        },
      ];
    case "general":
    default:
      return [
        {
          fieldKey: "ingredients",
          label: { ko: "재료·소모품", en: "Materials & Supplies" },
          placeholder: "50",
          description: { ko: "영업에 필요한 재료, 소모품, 차량 유지비 등", en: "Business materials, supplies, vehicle maintenance" },
        },
        labor, rent, utilities,
        {
          fieldKey: "other",
          label: { ko: "차량비·기타", en: "Vehicle & Other" },
          placeholder: "30",
          description: { ko: "차량 유류비, 보험료, 마케팅비, 카드수수료", en: "Vehicle fuel, insurance, marketing, card fees" },
        },
      ];
  }
}
