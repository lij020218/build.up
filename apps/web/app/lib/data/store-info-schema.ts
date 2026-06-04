/**
 * Store Info Schema — "내 가게" 페이지의 모든 입력/표시 정의.
 *
 * 회계·정적 정보 관점:
 *   · 운영 대시보드 = 오늘·이번주 (운영 KPI, AI 코칭)
 *   · 내 가게         = 누적·분기·연간 (회계 + 정체성 + 자산·계약·관계)
 *
 * 3-Layer 구조:
 *   1) 공통 코어 7섹션 (모든 80개 세부업종)
 *   2) 카테고리별 동적 섹션 (11개)
 *   3) 세부업종 modifier (80개 — 필드/섹션 추가, 권장 인허가/보험)
 *
 * AI 호출 0건 — 모두 사용자 입력 + 정적 schema lookup + 산수.
 */

/* ─────────────────────────────────────────────────────────────────────
 * Field type primitives
 * ───────────────────────────────────────────────────────────────────── */

export type FieldType =
  | "text"           // single line
  | "textarea"       // multi line
  | "number"         // currency·int·float
  | "won"            // 원 단위 입력 (만원 helper)
  | "percent"        // % 입력 (0~100)
  | "date"           // YYYY-MM-DD
  | "time"           // HH:MM
  | "select"         // single choice
  | "multiselect"    // multi choice
  | "phone"
  | "url"
  | "email";

export type FieldSpec = {
  /** state key (jsonb 안의 키) */
  key: string;
  /** 한국어 라벨 */
  label: string;
  /** 영어 라벨 (i18n) */
  labelEn?: string;
  type: FieldType;
  /** 설명·hint */
  helper?: string;
  /** select·multiselect 옵션 */
  options?: Array<{ value: string; label: string; labelEn?: string }>;
  /** 만료일 추적 — D-day 위젯에 포함됨 */
  trackExpiry?: boolean;
  /** 선택적인 필드인지 — false 면 핵심 필드 (UI 강조) */
  optional?: boolean;
  placeholder?: string;
  /** 단위 표시 (예: "원/월", "건", "년") */
  unit?: string;
};

export type SectionSpec = {
  /** anchor id (sticky TOC 점프) */
  id: string;
  /** 섹션 한국어 제목 */
  title: string;
  titleEn?: string;
  /** 섹션 부제 (선택) */
  subtitle?: string;
  /** lucide 아이콘 이름 (string — 컴포넌트가 lookup) */
  icon: string;
  /** 섹션 안의 필드 (단일 객체용) */
  fields?: FieldSpec[];
  /** 배열 형태 입력 (예: 인허가 목록·자산대장·보험 목록) */
  arrayItem?: {
    /** 각 항목 한 줄 요약에 쓸 필드 키 */
    titleField: string;
    /** 각 항목의 필드들 */
    fields: FieldSpec[];
    /** 항목 추가 버튼 라벨 */
    addLabel: string;
    addLabelEn?: string;
    /** 빈 상태 텍스트 */
    emptyText?: string;
    emptyTextEn?: string;
    /** 만료 추적 필드 키 (D-day 위젯에 자동 추가) */
    expiryKey?: string;
  };
};

/* ─────────────────────────────────────────────────────────────────────
 * 카테고리 ID type
 * ───────────────────────────────────────────────────────────────────── */
export type CategoryId =
  | "food" | "cafe-dessert" | "retail" | "beauty" | "fitness"
  | "education" | "pet" | "living-service" | "space"
  | "online-digital" | "startup-tech";

/* ─────────────────────────────────────────────────────────────────────
 * LAYER 1 — 공통 코어 (모든 80개 세부업종)
 *   Identity 와 Financial Snapshot, Footprint 는 페이지에서 직접 렌더
 *   (단순 폼이 아니라 사진·지도·차트 결합) — schema 에는 텍스트/데이터 필드만
 * ───────────────────────────────────────────────────────────────────── */

const COMMON_IDENTITY: SectionSpec = {
  id: "identity",
  title: "가게 소개 · 위치",
  titleEn: "Profile & Location",
  icon: "Building2",
  subtitle: "내 가게의 얼굴 — 사진·소개·연락처·위치",
  fields: [
    { key: "mission", label: "미션 (Why) — 우리 가게가 존재하는 이유", type: "textarea", optional: true, placeholder: "예: '바쁜 청년에게 집밥의 따뜻함을 5천원에' / 'Increase the GDP of the internet' — 사업 의사결정의 북극성. 1~2문장 권장.", helper: "장기 의사결정·채용·브랜드의 기준" },
    { key: "shortDescription", label: "한 줄 소개", type: "text", placeholder: "예: 청년 사장의 든든한 한 끼", optional: true },
    { key: "longDescription", label: "긴 소개 (메뉴판·SNS·홈페이지에 사용)", type: "textarea", optional: true, placeholder: "5~10줄 정도, 가게의 컨셉·강점·운영 철학" },
    { key: "addressRoad", label: "도로명 주소", type: "text", placeholder: "예: 서울 마포구 양화로 162" },
    { key: "addressDetail", label: "상세 주소", type: "text", placeholder: "예: 빌딩명·층·호수", optional: true },
    { key: "regionCode", label: "행정동 / 시군구", type: "text", placeholder: "예: 서울 마포구 합정동", optional: true },
    { key: "phone", label: "가게 전화", type: "phone", placeholder: "02-XXXX-XXXX", optional: true },
    { key: "ownerPhone", label: "사장 핸드폰 (대내외 비공개 가능)", type: "phone", optional: true },
    { key: "websiteUrl", label: "홈페이지 / 자체몰", type: "url", optional: true },
    { key: "instagramUrl", label: "인스타그램", type: "url", optional: true },
    { key: "naverPlaceUrl", label: "네이버 플레이스", type: "url", optional: true },
    { key: "kakaoPlaceUrl", label: "카카오맵", type: "url", optional: true },
    { key: "weeklyHolidays", label: "정기 휴무일", type: "multiselect", options: [
      { value: "mon", label: "월" }, { value: "tue", label: "화" }, { value: "wed", label: "수" },
      { value: "thu", label: "목" }, { value: "fri", label: "금" }, { value: "sat", label: "토" }, { value: "sun", label: "일" },
    ], optional: true },
    { key: "breakTime", label: "브레이크 타임", type: "text", placeholder: "예: 15:00–17:00", optional: true },
  ],
};

const COMMON_LEGAL: SectionSpec = {
  id: "legal",
  title: "법적 · 인허가",
  titleEn: "Legal & Compliance",
  icon: "ShieldCheck",
  subtitle: "사업자등록 · 인허가 · 4대보험 · 위생 등 만료일 통합 관리",
  fields: [
    { key: "bizRegistrationNumber", label: "사업자등록번호", type: "text", placeholder: "000-00-00000" },
    { key: "bizRegistrationDate", label: "사업자등록 발급일", type: "date" },
    { key: "bizRegistrationType", label: "과세 유형", type: "select", options: [
      { value: "simplified", label: "간이과세" },
      { value: "standard", label: "일반과세" },
      { value: "vat-exempt", label: "면세" },
      { value: "corporation", label: "법인" },
    ]},
    { key: "industryCode", label: "업종코드", type: "text", placeholder: "예: 552111", optional: true },
    { key: "telecomSalesNumber", label: "통신판매업 신고번호", type: "text", optional: true, helper: "온라인 판매·예약 시 필수" },
    { key: "fourInsuranceEstablished", label: "4대보험 사업장 성립신고", type: "select", options: [
      { value: "done", label: "완료" },
      { value: "in-progress", label: "진행 중" },
      { value: "not-required", label: "해당 없음 (1인)" },
    ]},
  ],
  arrayItem: {
    titleField: "name",
    addLabel: "+ 인허가/면허 추가",
    addLabelEn: "+ Add permit/license",
    emptyText: "영업신고·인허가·자격증·교육수료 등 만료일이 있는 항목을 추가하세요",
    expiryKey: "expiresAt",
    fields: [
      { key: "name", label: "인허가/면허명", type: "text", placeholder: "예: 일반음식점 영업신고" },
      { key: "issuedAt", label: "발급일", type: "date" },
      { key: "expiresAt", label: "만료일", type: "date", trackExpiry: true, optional: true },
      { key: "issuedBy", label: "발급기관", type: "text", placeholder: "예: 마포구청 위생과", optional: true },
      { key: "certNumber", label: "증서 번호", type: "text", optional: true },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
};

const COMMON_MONEY_INFRA: SectionSpec = {
  id: "money-infra",
  title: "자금 인프라",
  titleEn: "Money Infrastructure",
  icon: "Wallet",
  subtitle: "통장 · 카드 · 결제 단말기 · 세무 처리 — 가게의 자금 동맥",
  fields: [
    { key: "bizBankName", label: "사업용 통장 (은행)", type: "select", options: [
      { value: "ibk", label: "IBK 기업은행" },
      { value: "kakaobank", label: "카카오뱅크" },
      { value: "woori", label: "우리은행" },
      { value: "shinhan", label: "신한은행" },
      { value: "kb", label: "국민은행" },
      { value: "hana", label: "하나은행" },
      { value: "nh", label: "농협" },
      { value: "kbank", label: "케이뱅크" },
      { value: "toss", label: "토스뱅크" },
      { value: "other", label: "기타" },
    ]},
    { key: "bizBankAccountMasked", label: "계좌번호 (뒷 4자리)", type: "text", placeholder: "예: ****-1234", optional: true },
    { key: "bizCardIssued", label: "사업용 카드 분리 여부", type: "select", options: [
      { value: "yes", label: "분리됨" },
      { value: "no", label: "개인카드 혼용" },
    ]},
    { key: "posTerminal", label: "카드 단말기 / PG", type: "select", options: [
      { value: "tossplace", label: "토스플레이스" },
      { value: "kis", label: "KIS정보통신" },
      { value: "nice", label: "나이스정보통신" },
      { value: "smartro", label: "스마트로" },
      { value: "kcp", label: "KCP" },
      { value: "inicis", label: "이니시스" },
      { value: "kakaopay", label: "카카오페이" },
      { value: "naverpay", label: "네이버페이" },
      { value: "stripe", label: "Stripe" },
      { value: "other", label: "기타" },
    ], optional: true },
    { key: "taxHandling", label: "세무 처리 방식", type: "select", options: [
      { value: "self", label: "셀프 신고" },
      { value: "cpa", label: "세무사 위임" },
      { value: "hybrid", label: "혼합 (월 셀프 + 연 세무사)" },
    ]},
    { key: "cpaName", label: "세무사 사무소명 / 담당자", type: "text", optional: true },
    { key: "cpaPhone", label: "세무사 연락처", type: "phone", optional: true },
  ],
};

const COMMON_PEOPLE: SectionSpec = {
  id: "people",
  title: "사람 · 거래처",
  titleEn: "People & Vendors",
  icon: "Users",
  subtitle: "직원 · 거래처(공급처) · 외주 — 가게를 굴리는 사람들",
  arrayItem: {
    titleField: "name",
    addLabel: "+ 직원/거래처/외주 추가",
    addLabelEn: "+ Add person/vendor",
    emptyText: "직원·핵심 거래처·세무사·노무사·디자이너 등 추가",
    fields: [
      { key: "name", label: "이름 / 상호", type: "text" },
      { key: "kind", label: "구분", type: "select", options: [
        { value: "employee-fulltime", label: "직원 (정규)" },
        { value: "employee-parttime", label: "직원 (아르바이트)" },
        { value: "freelancer", label: "프리랜서/외주" },
        { value: "vendor-supplier", label: "공급처" },
        { value: "vendor-service", label: "서비스 (세무/노무/디자인)" },
        { value: "landlord", label: "임대인" },
      ]},
      { key: "role", label: "역할 / 품목", type: "text", placeholder: "예: 매니저 / 식자재 도매 / 노무 자문" },
      { key: "phone", label: "연락처", type: "phone", optional: true },
      { key: "startDate", label: "시작일 / 입사일", type: "date", optional: true },
      { key: "fourInsurance", label: "4대보험 가입 (직원만)", type: "select", options: [
        { value: "yes", label: "가입" },
        { value: "no", label: "미가입" },
        { value: "na", label: "해당없음" },
      ], optional: true },
      { key: "wage", label: "시급/월급/단가 (원)", type: "won", optional: true },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
};

const COMMON_INSURANCE: SectionSpec = {
  id: "insurance",
  title: "보험",
  titleEn: "Insurance",
  icon: "Umbrella",
  subtitle: "화재 · 배상책임 · 근재 · 자동차 — 위험 헷지의 핵심",
  arrayItem: {
    titleField: "name",
    addLabel: "+ 보험 추가",
    addLabelEn: "+ Add policy",
    emptyText: "권장 보험은 업종별 specialized 섹션에서 자동 제안됩니다",
    expiryKey: "expiresAt",
    fields: [
      { key: "name", label: "보험명", type: "text", placeholder: "예: 화재배상책임보험" },
      { key: "type", label: "종류", type: "select", options: [
        { value: "fire", label: "화재" },
        { value: "general-liability", label: "배상책임" },
        { value: "workers-comp", label: "근로자재해 (근재)" },
        { value: "product-liability", label: "생산물책임" },
        { value: "auto", label: "자동차" },
        { value: "property", label: "재산종합" },
        { value: "professional", label: "전문직 책임" },
        { value: "cyber", label: "사이버" },
        { value: "other", label: "기타" },
      ]},
      { key: "insurer", label: "보험사", type: "text", placeholder: "예: 삼성화재" },
      { key: "policyNumber", label: "증권번호", type: "text", optional: true },
      { key: "startDate", label: "가입일", type: "date", optional: true },
      { key: "expiresAt", label: "갱신/만료일", type: "date", trackExpiry: true },
      { key: "annualPremium", label: "연 보험료 (원)", type: "won", optional: true },
      { key: "coverageAmount", label: "보상한도 (원)", type: "won", optional: true },
      { key: "memo", label: "특약·비고", type: "textarea", optional: true },
    ],
  },
};

/**
 * Footprint — 오프라인은 임대차, 온라인은 도메인·물류, 출장형은 차량.
 * Page 에서 categoryId 기반으로 적절한 변형 선택해 렌더 (또는 모두 옵션 표시).
 */
const COMMON_FOOTPRINT_TENANCY: SectionSpec = {
  id: "footprint",
  title: "임대차 · 거점",
  titleEn: "Lease & Footprint",
  icon: "Building",
  subtitle: "임대 계약 · D-day · 보증금/월세",
  fields: [
    { key: "leaseStartDate", label: "임대 시작일", type: "date" },
    { key: "leaseEndDate", label: "임대 종료일", type: "date", trackExpiry: true, helper: "갱신 협의 기점" },
    { key: "depositKrw", label: "보증금 (원)", type: "won" },
    { key: "monthlyRentKrw", label: "월세 (원)", type: "won" },
    { key: "monthlyMaintenanceKrw", label: "관리비 (원)", type: "won", optional: true },
    { key: "areaSqm", label: "면적 (m²)", type: "number", optional: true, unit: "m²" },
    { key: "areaPyeong", label: "평수 (평)", type: "number", optional: true, unit: "평" },
    { key: "floor", label: "층수", type: "text", placeholder: "예: 1층 / 2층 / B1", optional: true },
    { key: "landlordName", label: "임대인 / 건물주", type: "text", optional: true },
    { key: "landlordPhone", label: "임대인 연락처", type: "phone", optional: true },
    { key: "renewalIntent", label: "갱신 의향", type: "select", options: [
      { value: "auto-renew", label: "자동 갱신 예정" },
      { value: "negotiate", label: "갱신 협의 중" },
      { value: "move-out", label: "이전 검토 중" },
      { value: "undecided", label: "미정" },
    ], optional: true },
  ],
};

const COMMON_FOOTPRINT_DIGITAL: SectionSpec = {
  id: "footprint",
  title: "디지털 거점",
  titleEn: "Digital Footprint",
  icon: "Globe",
  subtitle: "도메인 · 호스팅 · 물류 — 온라인 가게의 거점",
  arrayItem: {
    titleField: "name",
    addLabel: "+ 도메인/호스팅/물류 추가",
    addLabelEn: "+ Add domain/hosting/logistics",
    emptyText: "도메인 · 자체몰 호스팅 · 택배사 계약 등 추가",
    expiryKey: "expiresAt",
    fields: [
      { key: "name", label: "이름 / 서비스명", type: "text", placeholder: "예: example.co.kr / 카페24 호스팅 / CJ대한통운" },
      { key: "kind", label: "구분", type: "select", options: [
        { value: "domain", label: "도메인" },
        { value: "hosting", label: "호스팅 (자체몰)" },
        { value: "platform", label: "쇼핑몰 플랫폼 (Cafe24·메이크샵)" },
        { value: "cdn", label: "CDN" },
        { value: "logistics", label: "택배사 / 물류" },
        { value: "fulfillment", label: "풀필먼트 (3PL)" },
      ]},
      { key: "vendorName", label: "공급사 / 등록기관", type: "text", optional: true },
      { key: "monthlyFeeKrw", label: "월 비용 (원)", type: "won", optional: true },
      { key: "expiresAt", label: "갱신/만료일", type: "date", trackExpiry: true, optional: true },
      { key: "memo", label: "메모", type: "textarea", optional: true },
    ],
  },
};

/* ─────────────────────────────────────────────────────────────────────
 * LAYER 2 — 카테고리별 동적 섹션
 * ───────────────────────────────────────────────────────────────────── */

const CATEGORY_SECTIONS: Record<CategoryId, SectionSpec[]> = {
  food: [
    {
      id: "menu-ingredients",
      title: "메뉴 · 식자재",
      icon: "Utensils",
      subtitle: "시그니처 메뉴 · 가격 · 식자재 공급처",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 메뉴/식자재 추가",
        emptyText: "시그니처 메뉴와 핵심 식자재를 등록하세요",
        fields: [
          { key: "name", label: "이름", type: "text", placeholder: "예: 김치찌개 / 한우 등심 식자재" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "menu", label: "메뉴 (판매)" },
            { value: "ingredient", label: "식자재 (매입)" },
          ]},
          { key: "priceKrw", label: "판매가 / 매입가 (원)", type: "won", optional: true },
          { key: "costKrw", label: "원가 (원)", type: "won", optional: true },
          { key: "supplierName", label: "공급처 (식자재만)", type: "text", optional: true },
          { key: "memo", label: "메모", type: "textarea", optional: true },
        ],
      },
    },
    {
      id: "kitchen-assets",
      title: "주방 자산",
      icon: "ChefHat",
      subtitle: "오븐 · 냉장고 · 인덕션 · POS — 핵심 장비",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 자산 추가",
        emptyText: "오븐·냉장고·인덕션·POS·환기시설 등 핵심 자산 추가",
        expiryKey: "replacementDate",
        fields: [
          { key: "name", label: "자산명", type: "text", placeholder: "예: 냉장고 / 인덕션 / POS" },
          { key: "model", label: "모델", type: "text", optional: true },
          { key: "purchaseDate", label: "구입일", type: "date", optional: true },
          { key: "purchasePriceKrw", label: "구입가 (원)", type: "won", optional: true },
          { key: "lifespanYears", label: "내용연수 (년)", type: "number", unit: "년", optional: true },
          { key: "replacementDate", label: "교체 예정일", type: "date", trackExpiry: true, optional: true },
          { key: "supplierAS", label: "AS / 공급처 연락처", type: "text", optional: true },
        ],
      },
    },
    {
      id: "delivery-channels",
      title: "배달 채널",
      icon: "Bike",
      subtitle: "배민 · 쿠팡이츠 · 요기요 — 수수료·정산일",
      arrayItem: {
        titleField: "platform",
        addLabel: "+ 배달 채널 추가",
        emptyText: "배민·쿠팡이츠·요기요·땡겨요 등 입점 채널 추가",
        fields: [
          { key: "platform", label: "플랫폼", type: "select", options: [
            { value: "baemin", label: "배달의민족" },
            { value: "coupangeats", label: "쿠팡이츠" },
            { value: "yogiyo", label: "요기요" },
            { value: "ddaengyeoyo", label: "땡겨요 (신한)" },
            { value: "other", label: "기타" },
          ]},
          { key: "commissionPct", label: "수수료율 (%)", type: "percent", optional: true },
          { key: "settlementDay", label: "정산일", type: "text", placeholder: "예: 매주 수 / 매월 10일", optional: true },
          { key: "monthlyOrders", label: "월 주문 수", type: "number", unit: "건", optional: true },
          { key: "memo", label: "메모", type: "textarea", optional: true },
        ],
      },
    },
  ],
  "cafe-dessert": [
    {
      id: "menu-ingredients",
      title: "메뉴 · 원두 · 베이커리",
      icon: "Coffee",
      subtitle: "시그니처 음료/디저트 · 원두 로스터 · 베이커리 식자재",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 메뉴/원두/식자재 추가",
        emptyText: "시그니처 메뉴 · 원두 로스터 · 베이커리 식자재 등록",
        fields: [
          { key: "name", label: "이름", type: "text", placeholder: "예: 시그니처 라떼 / 에티오피아 원두" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "drink", label: "음료" },
            { value: "dessert", label: "디저트/베이커리" },
            { value: "bean", label: "원두" },
            { value: "ingredient", label: "기타 식자재" },
          ]},
          { key: "priceKrw", label: "판매가 / 매입가 (원)", type: "won", optional: true },
          { key: "supplierName", label: "공급처/로스터", type: "text", optional: true },
          { key: "roastDate", label: "로스팅일 (원두)", type: "date", optional: true },
        ],
      },
    },
    {
      id: "bar-assets",
      title: "주방 · 바 자산",
      icon: "Coffee",
      subtitle: "에스프레소 · 그라인더 · 쇼케이스 · 오븐",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 장비 추가",
        emptyText: "에스프레소 머신·그라인더·블렌더·오븐·쇼케이스 추가",
        expiryKey: "replacementDate",
        fields: [
          { key: "name", label: "장비명", type: "text" },
          { key: "model", label: "모델", type: "text", optional: true },
          { key: "purchaseDate", label: "구입일", type: "date", optional: true },
          { key: "purchasePriceKrw", label: "구입가 (원)", type: "won", optional: true },
          { key: "lifespanYears", label: "내용연수 (년)", type: "number", unit: "년", optional: true },
          { key: "replacementDate", label: "교체 예정일", type: "date", trackExpiry: true, optional: true },
        ],
      },
    },
  ],
  retail: [
    {
      id: "product-catalog",
      title: "상품 카탈로그",
      icon: "Tag",
      subtitle: "SKU · 바코드 · 매입가/소비자가",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 상품 추가",
        emptyText: "주력 상품·SKU 등록 (전체 카탈로그는 별도 재고 관리 사용)",
        fields: [
          { key: "name", label: "상품명", type: "text" },
          { key: "sku", label: "SKU/바코드", type: "text", optional: true },
          { key: "costKrw", label: "매입가 (원)", type: "won", optional: true },
          { key: "priceKrw", label: "소비자가 (원)", type: "won", optional: true },
          { key: "supplierName", label: "공급처", type: "text", optional: true },
        ],
      },
    },
    {
      id: "wholesale",
      title: "공급처 · 도매",
      icon: "Truck",
      subtitle: "브랜드/도매상 · 계약 · 결제조건",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 공급처 추가",
        emptyText: "주요 도매상·브랜드 공식 유통 등록",
        expiryKey: "contractEndDate",
        fields: [
          { key: "name", label: "공급처명", type: "text" },
          { key: "contractStartDate", label: "계약 시작", type: "date", optional: true },
          { key: "contractEndDate", label: "계약 종료", type: "date", trackExpiry: true, optional: true },
          { key: "paymentTerms", label: "결제 조건", type: "text", placeholder: "예: 월말 정산 / 선결제", optional: true },
          { key: "phone", label: "연락처", type: "phone", optional: true },
        ],
      },
    },
  ],
  beauty: [
    {
      id: "service-menu",
      title: "시술 메뉴",
      icon: "Scissors",
      subtitle: "서비스명 · 소요시간 · 가격",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 시술 메뉴 추가",
        emptyText: "주력 시술과 가격을 등록하세요",
        fields: [
          { key: "name", label: "시술명", type: "text", placeholder: "예: 컷 + 펌 / 젤네일" },
          { key: "durationMin", label: "소요시간 (분)", type: "number", unit: "분", optional: true },
          { key: "priceKrw", label: "가격 (원)", type: "won" },
          { key: "materialCostKrw", label: "재료 원가 (원)", type: "won", optional: true },
        ],
      },
    },
    {
      id: "equipment-products",
      title: "장비 · 제품",
      icon: "Sparkles",
      subtitle: "체어 · 베드 · 헤어컬러/네일/왁싱제",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 장비/제품 추가",
        emptyText: "체어·베드·헤어컬러·네일제·왁싱제 추가",
        expiryKey: "replacementDate",
        fields: [
          { key: "name", label: "이름", type: "text" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "equipment", label: "장비" },
            { value: "product", label: "제품 (소모)" },
          ]},
          { key: "brand", label: "브랜드", type: "text", optional: true },
          { key: "supplierName", label: "공급처", type: "text", optional: true },
          { key: "purchasePriceKrw", label: "가격 (원)", type: "won", optional: true },
          { key: "replacementDate", label: "교체/재구매 예정", type: "date", trackExpiry: true, optional: true },
        ],
      },
    },
    {
      id: "booking-loyalty",
      title: "예약 · 단골",
      icon: "Calendar",
      subtitle: "네이버 예약 · 카카오 · 재방문",
      fields: [
        { key: "naverBookingUrl", label: "네이버 예약 URL", type: "url", optional: true },
        { key: "kakaoChannelUrl", label: "카카오 채널", type: "url", optional: true },
        { key: "designedTotalCustomers", label: "누적 고객 수", type: "number", unit: "명", optional: true },
        { key: "memo", label: "단골 관리 메모", type: "textarea", optional: true },
      ],
    },
  ],
  fitness: [
    {
      id: "instructors",
      title: "강사 · 자격증",
      icon: "Award",
      subtitle: "전공 · 자격(STOTT·BASI·RYT 등) · 시급",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 강사 추가",
        emptyText: "강사·트레이너 추가",
        expiryKey: "certExpiry",
        fields: [
          { key: "name", label: "이름", type: "text" },
          { key: "specialty", label: "전공/특화", type: "text", placeholder: "예: 필라테스 / 골프 / 요가", optional: true },
          { key: "certName", label: "자격증명", type: "text", placeholder: "예: STOTT 1급 / BASI / RYT-200", optional: true },
          { key: "certIssuedAt", label: "자격 발급일", type: "date", optional: true },
          { key: "certExpiry", label: "자격 갱신일", type: "date", trackExpiry: true, optional: true },
          { key: "wage", label: "시급/세션비 (원)", type: "won", optional: true },
          { key: "phone", label: "연락처", type: "phone", optional: true },
        ],
      },
    },
    {
      id: "memberships",
      title: "회원권 상품",
      icon: "Ticket",
      subtitle: "1·3·6개월 · PT 패키지 · 환불 정책",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 회원권 상품 추가",
        emptyText: "1개월·3개월·6개월·PT 10회 등 상품 추가",
        fields: [
          { key: "name", label: "상품명", type: "text", placeholder: "예: 3개월 무제한 / PT 10회" },
          { key: "durationMonths", label: "기간 (개월)", type: "number", unit: "개월", optional: true },
          { key: "sessionCount", label: "세션 수 (PT)", type: "number", unit: "회", optional: true },
          { key: "priceKrw", label: "가격 (원)", type: "won" },
          { key: "refundPolicy", label: "환불 정책", type: "textarea", optional: true },
        ],
      },
    },
    {
      id: "equipment-schedule",
      title: "기구 · 시간표",
      icon: "Dumbbell",
      subtitle: "리포머 · 머신 · 매트 · 시뮬레이터 — 시간표",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 기구/클래스 추가",
        emptyText: "리포머·머신·시뮬레이터·정기 클래스 시간표 추가",
        expiryKey: "replacementDate",
        fields: [
          { key: "name", label: "이름", type: "text", placeholder: "예: 리포머 #1 / 월 19시 필라테스" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "equipment", label: "기구/장비" },
            { value: "class", label: "정기 클래스" },
          ]},
          { key: "manufacturer", label: "제조사 (기구)", type: "text", optional: true },
          { key: "purchaseDate", label: "구입일 (기구)", type: "date", optional: true },
          { key: "purchasePriceKrw", label: "구입가 (원)", type: "won", optional: true },
          { key: "replacementDate", label: "교체 예정일 (기구)", type: "date", trackExpiry: true, optional: true },
          { key: "scheduleText", label: "시간표 (클래스)", type: "text", placeholder: "예: 월·수·금 19:00", optional: true },
        ],
      },
    },
  ],
  education: [
    {
      id: "instructors-curriculum",
      title: "강사 · 커리큘럼",
      icon: "GraduationCap",
      subtitle: "학력 · 과목 · 교재",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 강사/커리큘럼 추가",
        emptyText: "강사 명부와 과목별 커리큘럼·교재 추가",
        fields: [
          { key: "name", label: "이름 / 과목", type: "text" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "instructor", label: "강사" },
            { value: "course", label: "과목/커리큘럼" },
          ]},
          { key: "education", label: "학력 (강사)", type: "text", optional: true },
          { key: "subject", label: "담당 과목 (강사) / 대상 (과목)", type: "text", optional: true },
          { key: "textbook", label: "교재", type: "text", optional: true },
          { key: "wage", label: "강사료 (원)", type: "won", optional: true },
          { key: "phone", label: "연락처", type: "phone", optional: true },
        ],
      },
    },
    {
      id: "academy-license",
      title: "학원 등록증 · 시간표",
      icon: "FileText",
      subtitle: "교육청 신고번호 · 강의실 평수 · 정원 · 시간표",
      fields: [
        { key: "academyLicenseNumber", label: "학원 등록번호", type: "text" },
        { key: "issuedBy", label: "발급기관 (교육청)", type: "text", placeholder: "예: 서울특별시 마포구청" },
        { key: "issuedAt", label: "등록일", type: "date" },
        { key: "classroomCount", label: "강의실 수", type: "number", unit: "실", optional: true },
        { key: "totalCapacity", label: "총 정원", type: "number", unit: "명", optional: true },
        { key: "scheduleNote", label: "전체 시간표 / 학기 운영", type: "textarea", optional: true },
      ],
    },
  ],
  pet: [
    {
      id: "qualifications-charts",
      title: "자격 · 동물 차트",
      icon: "Heart",
      subtitle: "미용사·훈련사 자격 · 보호자/반려동물 차트",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 자격/차트 추가",
        emptyText: "미용사·훈련사 자격증 / 단골 보호자·반려동물 차트 추가",
        expiryKey: "expiresAt",
        fields: [
          { key: "name", label: "이름 / 항목", type: "text", placeholder: "예: 펫미용사 1급 / 단골 견공 코코" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "qualification", label: "자격증/면허" },
            { value: "client-chart", label: "보호자/반려동물 차트" },
          ]},
          { key: "issuedAt", label: "발급일/등록일", type: "date", optional: true },
          { key: "expiresAt", label: "갱신일", type: "date", trackExpiry: true, optional: true },
          { key: "phone", label: "연락처 (보호자)", type: "phone", optional: true },
          { key: "memo", label: "메모 (특이사항·알러지 등)", type: "textarea", optional: true },
        ],
      },
    },
    {
      id: "supplies-meds",
      title: "케이지 · 약품 · 소모품",
      icon: "PackageOpen",
      subtitle: "유효기간 · 수량 관리",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 약품/소모품 추가",
        emptyText: "약품·미용제·케이지 등 추가 (유효기간 관리)",
        expiryKey: "expiresAt",
        fields: [
          { key: "name", label: "품목명", type: "text" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "medication", label: "약품" },
            { value: "grooming", label: "미용제" },
            { value: "cage", label: "케이지/장비" },
            { value: "consumable", label: "소모품" },
          ]},
          { key: "quantity", label: "수량", type: "number", optional: true },
          { key: "expiresAt", label: "유효기간", type: "date", trackExpiry: true, optional: true },
          { key: "supplierName", label: "공급처", type: "text", optional: true },
        ],
      },
    },
  ],
  "living-service": [
    {
      id: "equipment-chemicals",
      title: "장비 · 화학물질",
      icon: "Wrench",
      subtitle: "세탁기 · 드라이클리닝 솔벤트 · 세제 · 수리 부품 — MSDS 포함",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 장비/약품 추가",
        emptyText: "주요 장비·화학물질·수리 부품 등록 (MSDS 권장)",
        expiryKey: "msdsExpiresAt",
        fields: [
          { key: "name", label: "이름", type: "text" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "equipment", label: "장비" },
            { value: "chemical", label: "화학물질" },
            { value: "consumable", label: "소모품/부품" },
          ]},
          { key: "model", label: "모델/규격", type: "text", optional: true },
          { key: "msdsAvailable", label: "MSDS 보유 (화학물질)", type: "select", options: [
            { value: "yes", label: "보유" }, { value: "no", label: "없음" }, { value: "na", label: "해당없음" },
          ], optional: true },
          { key: "msdsExpiresAt", label: "MSDS 갱신일 / 유효기한", type: "date", trackExpiry: true, optional: true },
          { key: "supplierName", label: "공급처", type: "text", optional: true },
          { key: "memo", label: "메모", type: "textarea", optional: true },
        ],
      },
    },
  ],
  space: [
    {
      id: "space-spec",
      title: "공간 스펙",
      icon: "Home",
      subtitle: "평수 · 수용인원 · 평면도 · 층수",
      fields: [
        { key: "areaSqm", label: "면적 (m²)", type: "number", unit: "m²", optional: true },
        { key: "areaPyeong", label: "평수 (평)", type: "number", unit: "평", optional: true },
        { key: "capacity", label: "수용 인원", type: "number", unit: "명", optional: true },
        { key: "roomCount", label: "공간 수 (멀티 룸)", type: "number", unit: "실", optional: true },
        { key: "floorPlanUrl", label: "평면도 URL (Google Drive 등)", type: "url", optional: true },
        { key: "specialFeatures", label: "특징 (방음·자연광·주차 등)", type: "textarea", optional: true },
      ],
    },
    {
      id: "booking-channels",
      title: "예약 채널",
      icon: "CalendarCheck",
      subtitle: "스페이스클라우드 · 에어비앤비 · 자체 예약 — 요금제",
      arrayItem: {
        titleField: "platform",
        addLabel: "+ 예약 채널 추가",
        emptyText: "스페이스클라우드·에어비앤비·아워플레이스·자체 예약 추가",
        fields: [
          { key: "platform", label: "플랫폼", type: "select", options: [
            { value: "spacecloud", label: "스페이스클라우드" },
            { value: "airbnb", label: "에어비앤비" },
            { value: "ourplace", label: "아워플레이스" },
            { value: "naver-booking", label: "네이버 예약" },
            { value: "self", label: "자체 예약" },
            { value: "other", label: "기타" },
          ]},
          { key: "url", label: "URL", type: "url", optional: true },
          { key: "commissionPct", label: "수수료율 (%)", type: "percent", optional: true },
          { key: "hourlyRateKrw", label: "시간당 요금 (원)", type: "won", optional: true },
          { key: "monthlyRevenueKrw", label: "월 매출 (원)", type: "won", optional: true },
        ],
      },
    },
    {
      id: "furniture-equipment",
      title: "가구 · 음향 · 장비",
      icon: "Speaker",
      subtitle: "의자/테이블/프로젝터/조명/방음 — 실별",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 가구/장비 추가",
        emptyText: "의자·테이블·프로젝터·조명·방음·악기 등 추가",
        expiryKey: "replacementDate",
        fields: [
          { key: "name", label: "이름", type: "text" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "furniture", label: "가구" },
            { value: "av", label: "음향/영상" },
            { value: "lighting", label: "조명" },
            { value: "instrument", label: "악기/장비" },
          ]},
          { key: "quantity", label: "수량", type: "number", optional: true },
          { key: "purchaseDate", label: "구입일", type: "date", optional: true },
          { key: "purchasePriceKrw", label: "구입가 (원)", type: "won", optional: true },
          { key: "replacementDate", label: "교체 예정", type: "date", trackExpiry: true, optional: true },
        ],
      },
    },
  ],
  "online-digital": [
    {
      id: "sales-channels",
      title: "판매 채널",
      icon: "ShoppingBag",
      subtitle: "스마트스토어 · 쿠팡 · 11번가 · 자체몰 — 입점 상태·평점",
      arrayItem: {
        titleField: "platform",
        addLabel: "+ 판매 채널 추가",
        emptyText: "스마트스토어·쿠팡·11번가·G마켓·자체몰 등 입점 채널 추가",
        fields: [
          { key: "platform", label: "플랫폼", type: "select", options: [
            { value: "smartstore", label: "네이버 스마트스토어" },
            { value: "coupang", label: "쿠팡" },
            { value: "11st", label: "11번가" },
            { value: "gmarket", label: "G마켓" },
            { value: "auction", label: "옥션" },
            { value: "wemakeprice", label: "위메프" },
            { value: "tmon", label: "티몬" },
            { value: "ssg", label: "SSG.COM" },
            { value: "29cm", label: "29CM" },
            { value: "ohouse", label: "오늘의집" },
            { value: "self", label: "자체몰" },
            { value: "etsy", label: "Etsy (해외)" },
            { value: "amazon", label: "Amazon (해외)" },
            { value: "shopify", label: "Shopify (해외)" },
            { value: "other", label: "기타" },
          ]},
          { key: "storeName", label: "스토어명/상점명", type: "text", optional: true },
          { key: "url", label: "스토어 URL", type: "url", optional: true },
          { key: "rating", label: "평점", type: "number", optional: true },
          { key: "reviewCount", label: "리뷰 수", type: "number", unit: "건", optional: true },
          { key: "commissionPct", label: "수수료율 (%)", type: "percent", optional: true },
          { key: "monthlyRevenueKrw", label: "월 매출 (원)", type: "won", optional: true },
        ],
      },
    },
    // 디지털 거점 (도메인·호스팅·물류) 는 공통 Footprint 가 담당
  ],
  "startup-tech": [
    /* ─── 1. 회사 기본정보 — startup identity (Stage / Domain / One-liner) ─── */
    {
      id: "startup-identity",
      title: "회사 기본정보",
      titleEn: "Company Identity",
      icon: "Building2",
      subtitle: "법인명 · 단계 · 도메인 · 한 줄 피치 — 투자자 자료의 기본",
      fields: [
        { key: "legalNameKo", label: "법인명 (한글)", type: "text", placeholder: "예: 주식회사 파운드원" },
        { key: "legalNameEn", label: "법인명 (영문)", type: "text", optional: true, placeholder: "Found.One Inc." },
        { key: "incorporatedAt", label: "법인 설립일", type: "date", optional: true },
        { key: "corporateRegistrationNumber", label: "법인등록번호", type: "text", optional: true, helper: "상업등기 13자리" },
        { key: "entityType", label: "법인 형태", type: "select", optional: true, options: [
          { value: "kr-stock", label: "주식회사 (KR)" },
          { value: "kr-llc", label: "유한회사 (KR)" },
          { value: "us-c-corp", label: "Delaware C-Corp (US)" },
          { value: "sg-pte", label: "Pte. Ltd. (SG)" },
          { value: "jp-kk", label: "株式会社 (JP)" },
          { value: "other", label: "기타" },
        ]},
        { key: "stage", label: "현재 단계", type: "select", options: [
          { value: "idea", label: "아이디어" },
          { value: "pre-seed", label: "프리시드" },
          { value: "seed", label: "시드" },
          { value: "series-a", label: "시리즈 A" },
          { value: "series-b-plus", label: "시리즈 B+" },
          { value: "growth", label: "Growth (Series C+)" },
        ]},
        { key: "primaryDomain", label: "주 도메인", type: "url", optional: true, placeholder: "buildup.io" },
        { key: "oneLinerKo", label: "한 줄 피치 (한글)", type: "textarea", optional: true, placeholder: "한 문장으로 회사가 무엇을 하는지" },
        { key: "oneLinerEn", label: "한 줄 피치 (영문)", type: "textarea", optional: true, placeholder: "Single-line elevator pitch" },
        { key: "headquarters", label: "본사 소재지", type: "text", optional: true },
        { key: "deckUrl", label: "최신 IR 덱 URL", type: "url", optional: true, helper: "Notion·Google Slides·Pitch 등" },
      ],
    },

    /* ─── 2. 창업자 & 팀 — Founders, Vesting, 83(b), Headcount ─── */
    {
      id: "founders-team",
      title: "창업자 & 팀",
      titleEn: "Founders & Team",
      icon: "Users",
      subtitle: "공동창업자 · 베스팅 · 클리프 · 83(b) — 딜 죽이는 항목 0순위",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 공동창업자/핵심 인력 추가",
        emptyText: "공동창업자·핵심 인력 추가 — 베스팅·클리프·83(b) 추적",
        expiryKey: "cliffDate",
        fields: [
          { key: "name", label: "이름", type: "text" },
          { key: "role", label: "직책", type: "text", placeholder: "예: CEO / CTO / Founding Engineer" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "founder", label: "공동창업자" },
            { value: "early-employee", label: "초기 멤버 (1~10번)" },
            { value: "advisor", label: "어드바이저" },
            { value: "key-hire-open", label: "채용 진행 중 (오픈 포지션)" },
          ]},
          { key: "equityPct", label: "지분율 (%)", type: "percent", optional: true },
          { key: "vestingStartDate", label: "베스팅 시작일", type: "date", optional: true, helper: "보통 입사일/주식 매수일" },
          { key: "cliffDate", label: "클리프 도래일", type: "date", trackExpiry: true, optional: true, helper: "보통 베스팅 시작 + 1년" },
          { key: "vestingScheduleYears", label: "베스팅 기간 (년)", type: "number", optional: true, placeholder: "4" },
          { key: "filed83b", label: "83(b) Election 제출 (US 법인 한정)", type: "select", optional: true, options: [
            { value: "yes", label: "제출 완료" },
            { value: "no", label: "미제출" },
            { value: "na", label: "해당 없음 (KR 법인)" },
          ]},
          { key: "ipAssignmentSigned", label: "IP 양도 계약 체결", type: "select", optional: true, options: [
            { value: "yes", label: "서명 완료" },
            { value: "no", label: "미체결" },
          ]},
          { key: "linkedin", label: "LinkedIn URL", type: "url", optional: true },
          { key: "memo", label: "메모", type: "textarea", optional: true },
        ],
      },
    },

    /* ─── 3. 캡 테이블 — Cap Table & ESOP ─── */
    {
      id: "cap-table-summary",
      title: "캡 테이블 요약",
      titleEn: "Cap Table Summary",
      icon: "PieChart",
      subtitle: "발행/수권 주식 · ESOP 풀 · 409A — 다음 라운드 직전에 정리",
      fields: [
        { key: "authorizedShares", label: "수권 주식 수", type: "number", optional: true, placeholder: "10,000,000" },
        { key: "issuedShares", label: "발행 주식 수", type: "number", optional: true, placeholder: "8,000,000" },
        { key: "esopPoolPct", label: "ESOP 옵션 풀 (%)", type: "percent", optional: true, placeholder: "10" },
        { key: "esopPoolAvailablePct", label: "ESOP 미사용 잔여 (%)", type: "percent", optional: true, helper: "신규 채용 시 부여 가능한 풀" },
        { key: "lastValuationKrw", label: "최근 기업가치 (post-money, 원)", type: "won", optional: true },
        { key: "lastValuationDate", label: "기업가치 산정일", type: "date", optional: true },
        { key: "last409ADate", label: "409A 평가일 (US 법인)", type: "date", optional: true, helper: "옵션 행사가 결정 — 12개월마다 갱신" },
        { key: "captableToolUrl", label: "캡테이블 도구 URL", type: "url", optional: true, placeholder: "Carta·Pulley·Captable.io" },
        { key: "fullyDilutedNote", label: "Fully-diluted 메모", type: "textarea", optional: true, helper: "SAFE/CB 전환 시 희석 시뮬레이션" },
      ],
    },

    /* ─── 4. IP — 기존 유지 (특허·상표·SW저작권) ─── */
    {
      id: "ip",
      title: "IP (특허·상표·SW저작권)",
      titleEn: "IP & Brand Assets",
      icon: "Copyright",
      subtitle: "특허 · 상표 · 디자인 · SW 저작권 출원/등록 상태 — 실사 체크리스트 0순위",
      arrayItem: {
        titleField: "title",
        addLabel: "+ IP 추가",
        emptyText: "특허/상표/디자인/SW저작권 출원·등록 항목 추가",
        expiryKey: "renewalDate",
        fields: [
          { key: "title", label: "제목", type: "text", placeholder: "예: 핵심 알고리즘 특허" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "patent", label: "특허" },
            { value: "trademark", label: "상표" },
            { value: "design", label: "디자인" },
            { value: "software", label: "SW 저작권" },
            { value: "copyright", label: "저작권" },
          ]},
          { key: "jurisdiction", label: "출원 국가", type: "select", optional: true, options: [
            { value: "kr", label: "한국 (KIPO)" },
            { value: "us", label: "미국 (USPTO)" },
            { value: "ep", label: "유럽 (EPO)" },
            { value: "pct", label: "PCT 국제출원" },
            { value: "other", label: "기타" },
          ]},
          { key: "status", label: "상태", type: "select", options: [
            { value: "draft", label: "준비 중" },
            { value: "filed", label: "출원" },
            { value: "registered", label: "등록 완료" },
            { value: "rejected", label: "거절" },
          ]},
          { key: "applicationNumber", label: "출원번호", type: "text", optional: true, helper: "KIPRIS 검색용" },
          { key: "registrationNumber", label: "등록번호", type: "text", optional: true },
          { key: "filedAt", label: "출원일", type: "date", optional: true },
          { key: "registeredAt", label: "등록일", type: "date", optional: true },
          { key: "renewalDate", label: "갱신/연차료 납부일", type: "date", trackExpiry: true, optional: true },
          { key: "agentFirm", label: "변리사 사무소", type: "text", optional: true },
        ],
      },
    },
    {
      id: "cloud-saas",
      title: "클라우드 · SaaS 인프라",
      icon: "Cloud",
      subtitle: "AWS · GCP · Vercel · Datadog · Stripe — 월 비용 · 계약 종료",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 인프라 추가",
        emptyText: "AWS·GCP·Vercel·Datadog·Stripe·OpenAI 등 핵심 SaaS 추가",
        expiryKey: "contractEndDate",
        fields: [
          { key: "name", label: "서비스명", type: "text", placeholder: "예: AWS / Vercel / OpenAI API" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "cloud", label: "클라우드 (AWS·GCP·Azure)" },
            { value: "deploy", label: "배포 (Vercel·Netlify·Railway)" },
            { value: "monitoring", label: "모니터링 (Datadog·Sentry)" },
            { value: "ai-api", label: "AI API (OpenAI·Anthropic)" },
            { value: "payment", label: "결제 (Stripe·토스)" },
            { value: "comm", label: "커뮤니케이션 (Slack·Notion)" },
            { value: "analytics", label: "분석 (Mixpanel·Amplitude)" },
            { value: "other", label: "기타" },
          ]},
          { key: "monthlyCostKrw", label: "월 비용 (원)", type: "won", optional: true },
          { key: "contractEndDate", label: "계약 종료/갱신", type: "date", trackExpiry: true, optional: true },
          { key: "memo", label: "메모", type: "textarea", optional: true },
        ],
      },
    },
    /* ─── 5. 펀딩 라운드 히스토리 — Funding Rounds (SAFE/SAFE-K/Priced) ─── */
    {
      id: "captable",
      title: "투자 라운드 히스토리",
      titleEn: "Funding Rounds",
      icon: "TrendingUp",
      subtitle: "라운드 · 가치평가 · 지분 · SAFE/SAFE-K — instrument 별 변환 mechanic 다름",
      arrayItem: {
        titleField: "round",
        addLabel: "+ 투자 라운드 추가",
        emptyText: "시드/시리즈A 등 투자 라운드별 정보 추가",
        fields: [
          { key: "round", label: "라운드", type: "select", options: [
            { value: "founders", label: "창업자 출자" },
            { value: "preseed", label: "프리시드" },
            { value: "seed", label: "시드" },
            { value: "seriesA", label: "시리즈 A" },
            { value: "seriesB", label: "시리즈 B" },
            { value: "seriesC", label: "시리즈 C+" },
            { value: "bridge", label: "브릿지 라운드" },
          ]},
          { key: "instrument", label: "Instrument", type: "select", options: [
            { value: "priced-equity", label: "Priced Equity (보통주/우선주)" },
            { value: "safe-us", label: "SAFE (US — Y Combinator 표준)" },
            { value: "safe-k", label: "SAFE-K (한국형 — KIPC)" },
            { value: "kiss", label: "KISS Note" },
            { value: "convertible-note", label: "전환사채 (CB)" },
            { value: "convertible-bond", label: "전환증권 (BW)" },
          ]},
          { key: "amountKrw", label: "투자 금액 (원)", type: "won" },
          { key: "valuationCapKrw", label: "Valuation Cap (원)", type: "won", optional: true, helper: "SAFE/CB 전용 — Cap 가격 한도" },
          { key: "valuationKrw", label: "기업가치 / Post-money (원)", type: "won", optional: true, helper: "Priced 라운드용" },
          { key: "discountPct", label: "Discount (%)", type: "percent", optional: true, helper: "SAFE/CB — 다음 라운드 가격 할인" },
          { key: "mfn", label: "MFN 조항", type: "select", optional: true, options: [
            { value: "yes", label: "포함" },
            { value: "no", label: "없음" },
          ]},
          { key: "closedAt", label: "클로징일", type: "date", optional: true },
          { key: "leadInvestor", label: "리드 투자자", type: "text", optional: true },
          { key: "otherInvestors", label: "참여 투자자", type: "textarea", optional: true, helper: "쉼표로 구분" },
          { key: "memo", label: "조건/특약", type: "textarea", optional: true },
        ],
      },
    },

    /* ─── 6. 런웨이 & 번 — Runway, Burn, Cash, Next Raise ─── */
    {
      id: "runway-burn",
      title: "런웨이 · 번 · 다음 라운드",
      titleEn: "Runway & Burn",
      icon: "Wallet",
      subtitle: "Cash in bank · 월 burn · 런웨이 개월 · 다음 라운드 시점 — 매월 업데이트",
      fields: [
        { key: "cashInBankKrw", label: "통장 잔고 (원)", type: "won", optional: true },
        { key: "cashAsOf", label: "기준일", type: "date", optional: true },
        { key: "monthlyGrossBurnKrw", label: "월 Gross Burn (원)", type: "won", optional: true, helper: "총 지출 (매출 무관)" },
        { key: "monthlyNetBurnKrw", label: "월 Net Burn (원)", type: "won", optional: true, helper: "지출 - 매출" },
        { key: "runwayMonths", label: "런웨이 (개월)", type: "number", optional: true, helper: "잔고 ÷ 월 net burn" },
        { key: "defaultAliveDate", label: "Default-alive 도달 예정일", type: "date", optional: true, helper: "PG 기준: 매출 성장만으로 흑자 도달" },
        { key: "nextRaiseTargetKrw", label: "다음 라운드 목표 (원)", type: "won", optional: true },
        { key: "nextRaiseTiming", label: "다음 라운드 시점", type: "select", optional: true, options: [
          { value: "now", label: "현재 진행 중" },
          { value: "1-3m", label: "1~3개월 내" },
          { value: "3-6m", label: "3~6개월 내" },
          { value: "6-12m", label: "6~12개월 내" },
          { value: "12m-plus", label: "12개월 이상" },
          { value: "no-plan", label: "계획 없음 (자생력 우선)" },
        ]},
      ],
    },

    /* ─── 7. 핵심 지표 — North-Star, ARR/MRR, Growth ─── */
    {
      id: "north-star-metrics",
      title: "핵심 지표 (North-Star · ARR · 성장)",
      titleEn: "North-Star & Growth",
      icon: "Target",
      subtitle: "북극성 지표 · ARR/MRR · 성장률 · Rule of 40 — 시리즈 A 바: $1.5~3M ARR + 2~3× YoY",
      fields: [
        { key: "northStarMetricLabel", label: "북극성 지표 정의", type: "text", optional: true, placeholder: "예: 주간 활성 가맹점 수" },
        { key: "northStarMetricValue", label: "현재 값", type: "number", optional: true },
        { key: "mrrKrw", label: "MRR (원)", type: "won", optional: true, helper: "월 반복 매출" },
        { key: "arrKrw", label: "ARR (원)", type: "won", optional: true, helper: "MRR × 12" },
        { key: "momGrowthPct", label: "MoM 성장률 (%)", type: "percent", optional: true },
        { key: "qoqGrowthPct", label: "QoQ 성장률 (%)", type: "percent", optional: true },
        { key: "yoyGrowthPct", label: "YoY 성장률 (%)", type: "percent", optional: true },
        { key: "yearEndArrTargetKrw", label: "연말 ARR 목표 (원)", type: "won", optional: true },
        { key: "ruleOf40", label: "Rule of 40 (%)", type: "percent", optional: true, helper: "성장률 % + FCF 마진 % — 40 이상이 건강 지표" },
        { key: "trialToPaidPct", label: "Trial → Paid 전환율 (%)", type: "percent", optional: true },
      ],
    },

    /* ─── 8. 단위 경제성 — Unit Economics (CAC/LTV/Payback) ─── */
    {
      id: "unit-economics",
      title: "단위 경제성 (CAC · LTV · 마진)",
      titleEn: "Unit Economics",
      icon: "Calculator",
      subtitle: "LTV:CAC < 3 = 고객 한 명마다 손실. Scaling 직전 게이트.",
      fields: [
        { key: "blendedCacKrw", label: "Blended CAC (원)", type: "won", optional: true, helper: "유료 + 오가닉 포함 평균 획득 비용" },
        { key: "paidCacKrw", label: "Paid CAC (원)", type: "won", optional: true, helper: "유료 채널만" },
        { key: "ltvKrw", label: "LTV (원)", type: "won", optional: true, helper: "고객 평생 가치" },
        { key: "ltvToCacRatio", label: "LTV : CAC 비율", type: "number", optional: true, helper: "3 이상 권장 / 5 이상 우수" },
        { key: "cacPaybackMonths", label: "CAC Payback (개월)", type: "number", optional: true, helper: "Top-quartile ≤ 5개월" },
        { key: "grossMarginPct", label: "Gross Margin (%)", type: "percent", optional: true, helper: "SaaS 75%+ 이상이 일반적" },
        { key: "contributionMarginPct", label: "Contribution Margin (%)", type: "percent", optional: true },
        { key: "acvKrw", label: "ACV (원, 연 평균 계약가)", type: "won", optional: true },
        { key: "pricingTiersNote", label: "가격 구조 메모", type: "textarea", optional: true, placeholder: "예: Free / Pro $29 / Team $99 / Enterprise" },
      ],
    },

    /* ─── 9. 고객 & 리텐션 — Active Users, Churn, NRR/GRR, NPS ─── */
    {
      id: "customers-retention",
      title: "고객 & 리텐션",
      titleEn: "Customers & Retention",
      icon: "Heart",
      subtitle: "리텐션은 PMF의 단일 최고 지표. 코호트가 평탄해지는지 확인.",
      fields: [
        { key: "totalActiveCustomers", label: "활성 고객 수", type: "number", optional: true },
        { key: "mau", label: "MAU (월 활성)", type: "number", optional: true },
        { key: "wau", label: "WAU (주 활성)", type: "number", optional: true },
        { key: "dau", label: "DAU (일 활성)", type: "number", optional: true },
        { key: "logoChurnPct", label: "Logo Churn (%)", type: "percent", optional: true, helper: "고객 수 기준 이탈률" },
        { key: "revenueChurnPct", label: "Revenue Churn (%)", type: "percent", optional: true },
        { key: "nrrPct", label: "NRR — Net Revenue Retention (%)", type: "percent", optional: true, helper: "100%+ = 기존 고객만으로 성장" },
        { key: "grrPct", label: "GRR — Gross Revenue Retention (%)", type: "percent", optional: true, helper: "Expansion 제외 순 보유" },
        { key: "npsScore", label: "NPS 점수", type: "number", optional: true, helper: "-100 ~ +100" },
        { key: "top10ConcentrationPct", label: "상위 10 고객 ARR 집중도 (%)", type: "percent", optional: true, helper: "30% 이상이면 집중 리스크" },
      ],
    },

    /* ─── 10. 제품 & 로드맵 — Product, Stack, OKRs ─── */
    {
      id: "product-roadmap",
      title: "제품 & 로드맵",
      titleEn: "Product & Roadmap",
      icon: "Code2",
      subtitle: "이번 분기에 무엇을 만드는가 — 단일 진실 소스",
      fields: [
        { key: "productName", label: "제품명", type: "text", optional: true },
        { key: "productLiveUrl", label: "제품 URL (live)", type: "url", optional: true },
        { key: "currentVersion", label: "현재 버전", type: "text", optional: true, placeholder: "예: v1.4.2" },
        { key: "repoUrl", label: "코드 저장소 URL", type: "url", optional: true, placeholder: "GitHub / GitLab" },
        { key: "techStack", label: "기술 스택", type: "textarea", optional: true, placeholder: "예: Next.js · Supabase · Vercel · Anthropic API" },
        { key: "deploymentInfra", label: "배포 인프라", type: "text", optional: true, placeholder: "예: Vercel + Cloudflare + AWS S3" },
        { key: "publicRoadmapUrl", label: "공개 로드맵 URL", type: "url", optional: true },
        { key: "lastReleaseDate", label: "최근 릴리즈일", type: "date", optional: true },
        { key: "quarterPriority1", label: "이번 분기 우선순위 1", type: "text", optional: true },
        { key: "quarterPriority2", label: "이번 분기 우선순위 2", type: "text", optional: true },
        { key: "quarterPriority3", label: "이번 분기 우선순위 3", type: "text", optional: true },
      ],
    },
    /* ─── 11. 한국 스타트업 인증 & 정부지원 — KR-specific Grants/Certs ─── */
    {
      id: "gov-programs",
      title: "벤처인증 · 정부지원",
      titleEn: "KR Certifications & Grants",
      icon: "Stamp",
      subtitle: "예비/초기창업·TIPS·벤처기업·이노비즈·R&D — 자기부담금 미충족 시 환수 위험",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 인증/지원사업 추가",
        emptyText: "예비창업·초기창업·TIPS·벤처인증·이노비즈·기업부설연구소 추가",
        expiryKey: "endDate",
        fields: [
          { key: "name", label: "사업/인증명", type: "text", placeholder: "예: 초기창업패키지 / 벤처기업 인증" },
          { key: "kind", label: "구분", type: "select", options: [
            { value: "preliminary-startup", label: "예비창업패키지" },
            { value: "early-startup", label: "초기창업패키지 (창업 ≤3년, 최대 1억)" },
            { value: "leap-startup", label: "창업도약패키지 (창업 3~7년)" },
            { value: "youth-startup", label: "청년창업사관학교" },
            { value: "tips", label: "TIPS (최대 5억 R&D)" },
            { value: "post-tips", label: "Post-TIPS" },
            { value: "venture-cert", label: "벤처기업 인증 (3년 갱신)" },
            { value: "innobiz", label: "이노비즈 인증" },
            { value: "mainbiz", label: "메인비즈 인증" },
            { value: "rnd-center", label: "기업부설연구소 등록" },
            { value: "rnd", label: "R&D 과제" },
            { value: "women-biz", label: "여성기업 인증" },
            { value: "disabled-biz", label: "장애인기업 인증" },
            { value: "local-grant", label: "지자체 사업" },
            { value: "other", label: "기타" },
          ]},
          { key: "status", label: "상태", type: "select", optional: true, options: [
            { value: "applying", label: "지원 진행 중" },
            { value: "selected", label: "선정 (집행 중)" },
            { value: "completed", label: "완료" },
            { value: "rejected", label: "탈락" },
            { value: "expired", label: "만료" },
          ]},
          { key: "supportAmountKrw", label: "지원금 (원)", type: "won", optional: true },
          { key: "selfBurdenCashKrw", label: "자기부담금 — 현금 (원)", type: "won", optional: true, helper: "초창패: 최소 10% 현금 필수" },
          { key: "selfBurdenInKindKrw", label: "자기부담금 — 현물 (원)", type: "won", optional: true, helper: "초창패: 30% 중 20%까지 현물 가능" },
          { key: "startDate", label: "시작일", type: "date", optional: true },
          { key: "endDate", label: "종료일/갱신일", type: "date", trackExpiry: true, optional: true, helper: "벤처인증은 3년마다 갱신" },
          { key: "agency", label: "주관 기관", type: "text", optional: true, placeholder: "예: 창업진흥원 / 중소벤처기업부" },
          { key: "reportingNote", label: "보고 일정 메모", type: "textarea", optional: true, helper: "중간점검·최종보고 마감일" },
        ],
      },
    },

    /* ─── 12. 거버넌스 & 운영 — Governance, Bank, Cadence ─── */
    {
      id: "governance-ops",
      title: "거버넌스 & 운영",
      titleEn: "Governance & Ops Hygiene",
      icon: "Landmark",
      subtitle: "은행 · 회계 · 법무 · 이사회 · 투자자 업데이트 — 실사 직전 점검 항목",
      fields: [
        { key: "primaryBank", label: "주거래 은행", type: "text", optional: true, placeholder: "예: 신한은행 (서초중앙지점)" },
        { key: "primaryBankAccountLast4", label: "주거래 계좌 (마지막 4자리)", type: "text", optional: true },
        { key: "secondaryBank", label: "외화/세컨드 계좌", type: "text", optional: true, helper: "달러 계좌·해외 송금용" },
        { key: "accountingTool", label: "회계 도구", type: "text", optional: true, placeholder: "예: 더존 · SAP B1 · QuickBooks · Stripe" },
        { key: "payrollProvider", label: "급여 처리", type: "text", optional: true, placeholder: "예: 자체 / 더존 / Gusto" },
        { key: "lawFirmName", label: "주 법무법인", type: "text", optional: true },
        { key: "lawFirmContact", label: "법무 담당 연락처", type: "phone", optional: true },
        { key: "accountantName", label: "주 회계사 / 세무사", type: "text", optional: true },
        { key: "accountantContact", label: "회계 담당 연락처", type: "phone", optional: true },
        { key: "boardCadence", label: "이사회 주기", type: "select", optional: true, options: [
          { value: "monthly", label: "월간" },
          { value: "quarterly", label: "분기" },
          { value: "biannual", label: "반기" },
          { value: "annual", label: "연간" },
          { value: "none", label: "정기 미수립" },
        ]},
        { key: "lastBoardMeetingDate", label: "최근 이사회 일자", type: "date", optional: true },
        { key: "nextBoardMeetingDate", label: "다음 이사회 일자", type: "date", trackExpiry: true, optional: true },
        { key: "investorUpdateCadence", label: "투자자 업데이트 주기", type: "select", optional: true, options: [
          { value: "monthly", label: "월간" },
          { value: "quarterly", label: "분기" },
          { value: "ad-hoc", label: "수시" },
          { value: "none", label: "미발송" },
        ]},
        { key: "lastInvestorUpdateDate", label: "최근 투자자 업데이트 발송일", type: "date", optional: true },
        { key: "boardObservers", label: "이사회 옵저버", type: "textarea", optional: true, helper: "쉼표로 구분" },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────────
 * LAYER 3 — 세부업종별 modifier
 *   각 세부업종에 대해 (a) 추가 필드 (b) 추가 권장 인허가 (c) 추가 권장 보험
 *   schema 가 그대로 노출 — UI 에서 "권장" 배지 + prefill
 * ───────────────────────────────────────────────────────────────────── */

export type SubIndustryModifier = {
  /** Identity 섹션에 노출될 short 라벨 (UI hint) */
  hint?: string;
  /** 필수 인허가 권장 — Legal 섹션의 arrayItem 에 prefill candidate */
  recommendedPermits?: Array<{ name: string; helper?: string }>;
  /** 권장 보험 — Insurance 섹션의 arrayItem 에 prefill candidate */
  recommendedInsurance?: Array<{ name: string; type: string; helper?: string }>;
  /** Footprint 변형 — "tenancy" | "digital" | "mobile" (출장형) */
  footprintMode?: "tenancy" | "digital" | "mobile" | "none";
  /** 추가 필드 (Identity 또는 카테고리 섹션에 inject) */
  extraFields?: Array<{ section: string; field: FieldSpec }>;
  /** "무인" 운영 토글 — CCTV·키오스크 자산 추가 권장 */
  unmanned?: boolean;
};

export const SUBINDUSTRY_MODIFIERS: Record<string, SubIndustryModifier> = {
  // ── food ──
  "korean-casual": {
    hint: "한식 (국밥·김밥·백반·분식)",
    recommendedPermits: [
      { name: "일반음식점 영업신고" },
      { name: "위생교육 수료증" },
      { name: "보건증 (영업주)" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire", helper: "음식점업 의무" },
      { name: "근로자재해보험", type: "workers-comp", helper: "직원 1명 이상 시 의무" },
    ],
    footprintMode: "tenancy",
  },
  "delivery-meals": {
    hint: "배달 전문 (공유주방·소형)",
    recommendedPermits: [
      { name: "일반음식점 영업신고 (배달가능 표시)" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
      { name: "생산물책임보험", type: "product-liability", helper: "식중독 사고 대응" },
    ],
    footprintMode: "tenancy",
  },
  "salad-healthy": {
    hint: "샐러드·헬시푸드",
    recommendedPermits: [
      { name: "일반음식점 영업신고" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
      { name: "생산물책임보험", type: "product-liability" },
    ],
    footprintMode: "tenancy",
  },
  "ramen-noodle": {
    hint: "라멘·국수",
    recommendedPermits: [
      { name: "일반음식점 영업신고" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "chicken-burger": {
    hint: "치킨·버거 (주류 가능)",
    recommendedPermits: [
      { name: "일반음식점 영업신고" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
      { name: "주류 면허 (판매 시)", helper: "관할 세무서 주류 판매업" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
      { name: "생산물책임보험", type: "product-liability" },
    ],
    footprintMode: "tenancy",
  },
  "western-pasta-brunch": {
    hint: "양식·파스타·브런치 (와인 옵션)",
    recommendedPermits: [
      { name: "일반음식점 영업신고" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
      { name: "주류 판매업 면허 (와인 판매 시)" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },

  // ── cafe-dessert ──
  "takeout-coffee": {
    hint: "테이크아웃 커피 (소형)",
    recommendedPermits: [
      { name: "휴게음식점 영업신고", helper: "커피·차·과자류" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [{ name: "화재배상책임보험", type: "fire" }],
    footprintMode: "tenancy",
  },
  "specialty-coffee": {
    hint: "스페셜티 커피",
    recommendedPermits: [
      { name: "휴게음식점 영업신고" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [{ name: "화재배상책임보험", type: "fire" }],
    footprintMode: "tenancy",
  },
  "dessert-cafe": {
    hint: "디저트 카페",
    recommendedPermits: [
      { name: "휴게음식점 영업신고" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [{ name: "화재배상책임보험", type: "fire" }],
    footprintMode: "tenancy",
  },
  "bakery-studio": {
    hint: "베이커리 스튜디오 (식자재 비중 ↑)",
    recommendedPermits: [
      { name: "제과점 영업신고", helper: "직접 제조·판매" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
      { name: "생산물책임보험", type: "product-liability" },
    ],
    footprintMode: "tenancy",
  },
  "icecream-bingsu": {
    hint: "아이스크림·빙수 (계절성)",
    recommendedPermits: [
      { name: "휴게음식점 영업신고" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [{ name: "화재배상책임보험", type: "fire" }],
    footprintMode: "tenancy",
  },
  "self-serve-cafe": {
    hint: "무인 셀프서브 카페",
    recommendedPermits: [
      { name: "휴게음식점 영업신고" },
      { name: "위생교육 수료증" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
      { name: "재산종합 (절도)", type: "property", helper: "무인 — 도난 대비" },
    ],
    footprintMode: "tenancy",
    unmanned: true,
  },

  // ── retail ──
  "convenience-small": {
    hint: "동네 편의점·소매",
    recommendedPermits: [
      { name: "통신판매업 신고 (온라인 판매 시)" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
      { name: "재산종합", type: "property" },
    ],
    footprintMode: "tenancy",
  },
  "lifestyle-goods": {
    hint: "라이프스타일·잡화",
    recommendedPermits: [
      { name: "통신판매업 신고 (온라인 병행 시)" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "beauty-supplies": {
    hint: "화장품·뷰티 용품",
    recommendedPermits: [
      { name: "화장품 책임판매업 등록", helper: "식약처" },
      { name: "통신판매업 신고" },
    ],
    recommendedInsurance: [
      { name: "생산물책임보험", type: "product-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "fashion-accessories": {
    hint: "패션·액세서리",
    recommendedPermits: [{ name: "통신판매업 신고" }],
    recommendedInsurance: [{ name: "화재배상책임보험", type: "fire" }],
    footprintMode: "tenancy",
  },
  "health-food-store": {
    hint: "건강식품 판매 (식약처)",
    recommendedPermits: [
      { name: "건강기능식품 일반판매업 신고", helper: "관할 시·군·구청" },
      { name: "통신판매업 신고" },
    ],
    recommendedInsurance: [
      { name: "생산물책임보험", type: "product-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "unmanned-retail": {
    hint: "무인 매장",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "재산종합 (절도 강조)", type: "property" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
    unmanned: true,
  },

  // ── beauty ──
  "hair-salon": {
    hint: "헤어 (미용사 면허)",
    recommendedPermits: [
      { name: "미용업 영업신고" },
      { name: "미용사 (일반) 면허" },
      { name: "위생교육 수료증" },
    ],
    recommendedInsurance: [
      { name: "배상책임보험", type: "general-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "nail-studio": {
    hint: "네일 (환기·화학 안전)",
    recommendedPermits: [
      { name: "미용업 영업신고 (네일)" },
      { name: "위생교육 수료증" },
    ],
    recommendedInsurance: [
      { name: "배상책임보험", type: "general-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "skin-care-room": {
    hint: "피부관리실",
    recommendedPermits: [
      { name: "미용업 영업신고 (피부)" },
      { name: "위생교육 수료증" },
    ],
    recommendedInsurance: [
      { name: "배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "waxing-studio": {
    hint: "왁싱",
    recommendedPermits: [
      { name: "미용업 영업신고" },
      { name: "위생교육 수료증" },
    ],
    recommendedInsurance: [{ name: "배상책임보험", type: "general-liability" }],
    footprintMode: "tenancy",
  },
  "eyelash-brow": {
    hint: "속눈썹·눈썹 (반영구)",
    recommendedPermits: [
      { name: "미용업 영업신고" },
      { name: "위생교육 수료증" },
    ],
    recommendedInsurance: [{ name: "배상책임보험", type: "general-liability" }],
    footprintMode: "tenancy",
  },
  "makeup-bridal": {
    hint: "출장 메이크업 (이동·차량)",
    recommendedPermits: [
      { name: "미용업 영업신고" },
      { name: "위생교육 수료증" },
    ],
    recommendedInsurance: [
      { name: "배상책임보험", type: "general-liability" },
      { name: "자동차보험 (영업용)", type: "auto" },
    ],
    footprintMode: "mobile",
  },

  // ── fitness ──
  "pilates-studio": {
    hint: "필라테스 (리포머)",
    recommendedPermits: [
      { name: "체육시설업 신고", helper: "체력단련장 등 — 시·군·구청" },
    ],
    recommendedInsurance: [
      { name: "체육시설 배상책임보험", type: "general-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "pt-gym": {
    hint: "PT 짐 (1:1)",
    recommendedPermits: [
      { name: "체육시설업 신고" },
    ],
    recommendedInsurance: [
      { name: "체육시설 배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "yoga-studio": {
    hint: "요가",
    recommendedPermits: [
      { name: "체육시설업 신고" },
    ],
    recommendedInsurance: [
      { name: "체육시설 배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "crossfit-box": {
    hint: "크로스핏 박스 (대형 기구)",
    recommendedPermits: [
      { name: "체육시설업 신고" },
    ],
    recommendedInsurance: [
      { name: "체육시설 배상책임보험", type: "general-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "golf-studio": {
    hint: "골프 (시뮬레이터 라이선스)",
    recommendedPermits: [
      { name: "체육시설업 신고" },
    ],
    recommendedInsurance: [
      { name: "체육시설 배상책임보험", type: "general-liability" },
      { name: "재산종합 (시뮬레이터)", type: "property" },
    ],
    footprintMode: "tenancy",
  },
  "unmanned-fitness": {
    hint: "무인 피트니스 (24h)",
    recommendedPermits: [
      { name: "체육시설업 신고" },
    ],
    recommendedInsurance: [
      { name: "체육시설 배상책임보험", type: "general-liability" },
      { name: "재산종합 (CCTV·출입통제)", type: "property" },
    ],
    footprintMode: "tenancy",
    unmanned: true,
  },

  // ── education ──
  "study-room": {
    hint: "독서실·스터디카페 (공간 성격)",
    recommendedPermits: [
      { name: "독서실 등록증", helper: "교육청" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "kids-academy": {
    hint: "유아·어린이 학원",
    recommendedPermits: [
      { name: "학원 등록증 (교육청)" },
      { name: "어린이 통학버스 신고 (운영 시)" },
    ],
    recommendedInsurance: [
      { name: "어린이 안전공제 / 배상책임", type: "general-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "adult-class": {
    hint: "성인 평생교육",
    recommendedPermits: [
      { name: "평생교육 신고 또는 학원 등록증" },
    ],
    recommendedInsurance: [
      { name: "배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "language-academy": {
    hint: "어학원 (외국인 강사 비자)",
    recommendedPermits: [
      { name: "학원 등록증" },
      { name: "외국인 강사 비자 (E-2)", helper: "원어민 채용 시" },
    ],
    recommendedInsurance: [
      { name: "배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "coding-class": {
    hint: "코딩 학원",
    recommendedPermits: [{ name: "학원 등록증" }],
    recommendedInsurance: [{ name: "배상책임보험", type: "general-liability" }],
    footprintMode: "tenancy",
  },
  "small-study-room": {
    hint: "소형 스터디룸",
    recommendedPermits: [{ name: "독서실 등록증 또는 공간 임대" }],
    recommendedInsurance: [{ name: "화재배상책임보험", type: "fire" }],
    footprintMode: "tenancy",
  },

  // ── pet ──
  "pet-grooming": {
    hint: "펫 미용",
    recommendedPermits: [
      { name: "동물미용업 신고", helper: "농림축산식품부 — 시·군·구청" },
      { name: "동물미용사 자격" },
    ],
    recommendedInsurance: [
      { name: "동물 사고 배상책임", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "pet-supplies": {
    hint: "펫 용품 소매",
    recommendedPermits: [
      { name: "통신판매업 신고 (온라인 병행)" },
    ],
    recommendedInsurance: [{ name: "화재배상책임보험", type: "fire" }],
    footprintMode: "tenancy",
  },
  "pet-hotel": {
    hint: "펫 호텔 (숙박·24h)",
    recommendedPermits: [
      { name: "동물위탁관리업 신고", helper: "농림축산식품부" },
    ],
    recommendedInsurance: [
      { name: "동물 사고/탈출 배상책임", type: "general-liability", helper: "분실·사고 대응" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "pet-cafe": {
    hint: "펫 카페 (음식 + 동물)",
    recommendedPermits: [
      { name: "휴게음식점 영업신고" },
      { name: "동물전시업 또는 위탁관리업 신고" },
      { name: "위생교육 수료증" },
      { name: "보건증" },
    ],
    recommendedInsurance: [
      { name: "동물 사고 배상책임", type: "general-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "pet-training-school": {
    hint: "펫 훈련소",
    recommendedPermits: [
      { name: "동물훈련업 신고" },
      { name: "훈련사 자격 (KKF·PADT 등)" },
    ],
    recommendedInsurance: [
      { name: "동물 사고/사람 상해 배상", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "pet-walking-visit": {
    hint: "펫 산책·방문 (출장)",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "동물 사고/분실 배상책임", type: "general-liability" },
      { name: "자동차보험 (이동)", type: "auto" },
    ],
    footprintMode: "mobile",
  },

  // ── living-service ──
  "laundry-service": {
    hint: "세탁·드라이클리닝 (화학물질)",
    recommendedPermits: [
      { name: "세탁업 신고" },
      { name: "유해화학물질 영업허가 (해당 시)" },
    ],
    recommendedInsurance: [
      { name: "배상책임보험 (의류 손상)", type: "general-liability" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
  },
  "cleaning-service": {
    hint: "청소 출장",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "배상책임보험 (고객 시설 손상)", type: "general-liability" },
      { name: "근로자재해", type: "workers-comp" },
      { name: "자동차보험", type: "auto" },
    ],
    footprintMode: "mobile",
  },
  "repair-service": {
    hint: "수리 서비스",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "배상책임보험 (고객 장비 손상)", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "self-laundry": {
    hint: "무인 빨래방",
    recommendedPermits: [
      { name: "세탁업 신고" },
    ],
    recommendedInsurance: [
      { name: "재산종합 (장비)", type: "property" },
      { name: "화재배상책임보험", type: "fire" },
    ],
    footprintMode: "tenancy",
    unmanned: true,
  },
  "print-copy": {
    hint: "인쇄·복사 (무인 가능)",
    recommendedPermits: [],
    recommendedInsurance: [{ name: "재산종합", type: "property" }],
    footprintMode: "tenancy",
  },
  "device-repair": {
    hint: "휴대폰·전자제품 수리",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "배상책임보험 (고객 장비)", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },

  // ── space ──
  "guesthouse": {
    hint: "게스트하우스 (숙박업)",
    recommendedPermits: [
      { name: "외국인관광 도시민박업 또는 숙박업 신고" },
      { name: "외국인 등록 의무 (외국인 손님 시)" },
    ],
    recommendedInsurance: [
      { name: "화재배상책임보험 (숙박업)", type: "fire" },
      { name: "배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "rental-studio": {
    hint: "촬영 스튜디오",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "재산종합 (장비)", type: "property" },
      { name: "배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "party-room": {
    hint: "파티룸",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "화재배상책임보험", type: "fire" },
      { name: "배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "study-cafe-space": {
    hint: "스터디카페 (공간+커피)",
    recommendedPermits: [
      { name: "독서실 등록증 또는 공간 임대" },
      { name: "휴게음식점 영업신고 (음료 판매 시)" },
    ],
    recommendedInsurance: [{ name: "화재배상책임보험", type: "fire" }],
    footprintMode: "tenancy",
  },
  "shared-office": {
    hint: "공유 오피스",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "재산종합", type: "property" },
      { name: "배상책임보험", type: "general-liability" },
    ],
    footprintMode: "tenancy",
  },
  "practice-room": {
    hint: "연습실 (방음·악기·저작권)",
    recommendedPermits: [
      { name: "음악 저작권 (한국음악저작권협회) 신고" },
    ],
    recommendedInsurance: [
      { name: "재산종합 (악기)", type: "property" },
    ],
    footprintMode: "tenancy",
  },

  // ── online-digital ──
  "smart-store": {
    hint: "스마트스토어 (네이버)",
    recommendedPermits: [
      { name: "통신판매업 신고", helper: "구매안전서비스(에스크로) 가입증명 첨부" },
    ],
    recommendedInsurance: [
      { name: "전자상거래 책임보험 (해당 시)", type: "general-liability" },
    ],
    footprintMode: "digital",
  },
  "digital-products": {
    hint: "디지털 상품 (호스팅·CDN 비중 ↑)",
    recommendedPermits: [
      { name: "통신판매업 신고" },
    ],
    recommendedInsurance: [
      { name: "사이버 책임보험", type: "cyber" },
    ],
    footprintMode: "digital",
  },
  "creator-service": {
    hint: "크리에이터 서비스",
    recommendedPermits: [],
    recommendedInsurance: [],
    footprintMode: "digital",
  },
  "consignment-commerce": {
    hint: "위탁판매·셀렉트샵",
    recommendedPermits: [
      { name: "통신판매업 신고" },
    ],
    recommendedInsurance: [
      { name: "생산물책임보험", type: "product-liability" },
    ],
    footprintMode: "digital",
  },
  "newsletter-membership": {
    hint: "뉴스레터·멤버십 (구독)",
    recommendedPermits: [
      { name: "통신판매업 신고 (유료 구독 시)" },
    ],
    recommendedInsurance: [],
    footprintMode: "digital",
  },
  "global-buying": {
    hint: "구매대행·해외직구",
    recommendedPermits: [
      { name: "통신판매업 신고" },
      { name: "관세사 자문 권장", helper: "통관·관세" },
    ],
    recommendedInsurance: [
      { name: "사이버 책임보험", type: "cyber" },
    ],
    footprintMode: "digital",
  },

  // ── startup-tech ──
  "ai-application": {
    hint: "AI 애플리케이션 (API 비용 관리)",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "사이버 책임보험", type: "cyber" },
      { name: "전문직 책임보험 (E&O)", type: "professional" },
    ],
    footprintMode: "digital",
  },
  "developer-tools": {
    hint: "개발자 도구 (오픈소스 라이선스)",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "사이버 책임보험", type: "cyber" },
    ],
    footprintMode: "digital",
  },
  "b2b-saas": {
    hint: "B2B SaaS (SLA·SOC2)",
    recommendedPermits: [],
    recommendedInsurance: [
      { name: "사이버 책임보험", type: "cyber" },
      { name: "전문직 책임보험 (E&O)", type: "professional" },
    ],
    footprintMode: "digital",
  },
  "fintech-startup": {
    hint: "핀테크 (전자금융업·ISMS·PCI-DSS)",
    recommendedPermits: [
      { name: "전자금융업 신고/등록 (금융위)" },
      { name: "ISMS 인증" },
      { name: "PCI-DSS 인증 (카드 결제 시)" },
    ],
    recommendedInsurance: [
      { name: "사이버 책임보험", type: "cyber" },
      { name: "전문직 책임보험 (E&O)", type: "professional" },
    ],
    footprintMode: "digital",
  },
  "healthtech-startup": {
    hint: "헬스테크 (의료기기 인증)",
    recommendedPermits: [
      { name: "의료기기 인증 (식약처)" },
      { name: "GMP 인증 (제조 시)" },
    ],
    recommendedInsurance: [
      { name: "생산물책임보험", type: "product-liability" },
      { name: "사이버 책임보험", type: "cyber" },
    ],
    footprintMode: "digital",
  },
  "security-startup": {
    hint: "보안 (ISMS-P·정부조달)",
    recommendedPermits: [
      { name: "ISMS-P 인증" },
      { name: "정부조달 등록 (조달청)" },
      { name: "CC 인증 (Common Criteria)" },
    ],
    recommendedInsurance: [
      { name: "사이버 책임보험", type: "cyber" },
      { name: "전문직 책임보험 (E&O)", type: "professional" },
    ],
    footprintMode: "digital",
  },
  "hardware-iot": {
    hint: "하드웨어/IoT (KC·전파)",
    recommendedPermits: [
      { name: "KC 인증 (안전·전자파)" },
      { name: "전파 적합성 평가" },
    ],
    recommendedInsurance: [
      { name: "생산물책임보험", type: "product-liability" },
    ],
    footprintMode: "digital",
  },
  "robotics-physical-ai": {
    hint: "로보틱스/Physical AI (Lab·안전)",
    recommendedPermits: [
      { name: "Lab 임차 계약" },
      { name: "안전 인증 (KC·CE)" },
    ],
    recommendedInsurance: [
      { name: "생산물책임보험", type: "product-liability" },
      { name: "근로자재해 (Lab)", type: "workers-comp" },
    ],
    footprintMode: "tenancy",
  },
  "semiconductor": {
    hint: "반도체 (Fab·MPW·EDA)",
    recommendedPermits: [
      { name: "EDA 라이선스 계약" },
      { name: "Fab 파트너 계약" },
    ],
    recommendedInsurance: [
      { name: "사이버 책임보험", type: "cyber" },
      { name: "전문직 책임보험", type: "professional" },
    ],
    footprintMode: "digital",
  },
  "biotech-medtech": {
    hint: "바이오/메드테크 (식약처·임상)",
    recommendedPermits: [
      { name: "임상시험 IND 승인 (식약처)" },
      { name: "IRB / IACUC 승인" },
      { name: "GMP 인증" },
    ],
    recommendedInsurance: [
      { name: "임상시험 배상책임", type: "general-liability" },
      { name: "전문직 책임보험", type: "professional" },
    ],
    footprintMode: "tenancy",
  },
  "climate-energy": {
    hint: "기후/에너지 (탄소·환경)",
    recommendedPermits: [
      { name: "환경 인증 (해당 시)" },
      { name: "정부 R&D 과제 등록" },
    ],
    recommendedInsurance: [
      { name: "환경배상책임", type: "general-liability" },
    ],
    footprintMode: "digital",
  },
};

/* ─────────────────────────────────────────────────────────────────────
 * Resolver — categoryId + subIndustryId 기반으로 최종 섹션 구조 반환
 * ───────────────────────────────────────────────────────────────────── */

export const COMMON_SECTIONS_PRIMARY: SectionSpec[] = [
  COMMON_IDENTITY,
  COMMON_LEGAL,
  COMMON_MONEY_INFRA,
  COMMON_PEOPLE,
  COMMON_INSURANCE,
];

/** Footprint 섹션을 footprintMode 에 맞춰 반환 */
export function resolveFootprintSection(mode: SubIndustryModifier["footprintMode"] | undefined): SectionSpec | null {
  if (mode === "digital") return COMMON_FOOTPRINT_DIGITAL;
  if (mode === "tenancy") return COMMON_FOOTPRINT_TENANCY;
  if (mode === "mobile") {
    return {
      id: "footprint",
      title: "차량 · 출장 거점",
      icon: "Car",
      subtitle: "출장형 — 차량·이동수단·출장 운영비",
      arrayItem: {
        titleField: "name",
        addLabel: "+ 차량/이동수단 추가",
        emptyText: "영업용 차량·이동수단·출장 운영비 추가",
        expiryKey: "insuranceExpiresAt",
        fields: [
          { key: "name", label: "차량/이동수단", type: "text", placeholder: "예: 영업용 1톤 트럭" },
          { key: "plateNumber", label: "차량번호", type: "text", optional: true },
          { key: "purchaseDate", label: "구입/리스 시작", type: "date", optional: true },
          { key: "purchasePriceKrw", label: "구입가/리스료 (원)", type: "won", optional: true },
          { key: "insuranceExpiresAt", label: "자동차 보험 만료", type: "date", trackExpiry: true, optional: true },
          { key: "memo", label: "메모", type: "textarea", optional: true },
        ],
      },
    };
  }
  if (mode === "none") return null;
  return COMMON_FOOTPRINT_TENANCY; // default
}

export function resolveCategorySections(categoryId: CategoryId | string | undefined): SectionSpec[] {
  if (!categoryId) return [];
  return CATEGORY_SECTIONS[categoryId as CategoryId] ?? [];
}

export function resolveSubIndustryModifier(subIndustryId: string | undefined): SubIndustryModifier | null {
  if (!subIndustryId) return null;
  return SUBINDUSTRY_MODIFIERS[subIndustryId] ?? null;
}

export function getAllSubIndustryIds(): string[] {
  return Object.keys(SUBINDUSTRY_MODIFIERS);
}
