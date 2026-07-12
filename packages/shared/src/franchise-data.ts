/* ─────────────────────────────────────────────
 *  franchise-data.ts
 *  Sub-industry-level franchise brand database
 *  Scores: 0–100 per axis
 *  Data sources: KFTC 정보공개서, 마이프차, 각 브랜드 공식 자료 (2024–2025)
 * ───────────────────────────────────────────── */

export type FranchiseScores = {
  profitability: number;
  stability: number;
  accessibility: number;
  brandPower: number;
  support: number;
};

export type FranchiseCostItem = {
  label: { ko: string; en: string };
  amountWon: number; // 만원 단위
};

export type FranchiseBrand = {
  id: string;
  /**
   * 데이터 출처 티어. 미설정/"curated" = 손큐레이션(편집 검증). "kftc" = 공정위 공개데이터
   *  자동 생성(점수는 실데이터 산출, confidence "low"). UI 가 배지로 구분.
   */
  tier?: "curated" | "kftc";
  /**
   * 사업 형태. 미설정 = "franchise"(가맹). "consignment-tutor" = 위탁 학습지(방문교사·공부방)
   *  — 대교 눈높이·교원 구몬처럼 가맹점이 아닌 위탁 교사 모델(공정위 가맹 등록 대상 아님).
   *  프랜차이즈 브랜드 피커/매칭에서 제외되지만, 기록은 보존해 재추가·오분류 방지.
   */
  businessModel?: "franchise" | "consignment-tutor";
  subIndustryIds: string[];
  specialtyIds?: string[];
  categoryId: string;
  name: { ko: string; en: string };
  tagline: { ko: string; en: string };
  startupCostWon: number;
  franchiseFee: number;
  /** 정액 로열티(만원/월). 정률(%) 브랜드는 royaltyPercent 를 쓰고 이 값은 0. */
  monthlyRoyalty: number;
  /** 정률 로열티 — 매출의 N%. 설정 시 UI 가 "매출의 N%" 로 표시(예: 도미노 6, 투썸 3). */
  royaltyPercent?: number;
  avgAnnualRevenueWon: number;
  storeCount: number;
  closureRate: number;
  scores: FranchiseScores;
  roadmapNotes: { ko: string[]; en: string[] };
  /** 검증된 비용 내역 — 없으면 미검증 */
  costBreakdown?: FranchiseCostItem[];
  /** 비용 데이터 검증 여부 */
  costVerified: boolean;
  /** 비용 출처 */
  costSource?: string;
  /** 권장 최소 평수 */
  minPyeong?: number;
  /** 기준 평수 (비용 산정 기준) */
  basePyeong?: number;
  storeLocatorUrl?: string;
  /** 가맹 문의/창업 안내 페이지 */
  franchiseUrl?: string;
  dataYear: string;
  /**
   * 데이터 출처 — 사장님이 정보 신뢰성 확인 가능.
   * tier 구분으로 1차 소스 보유 여부 사장님이 즉시 판단 가능.
   *   primary    : 공정위 정보공개서 · DART · 회사 공식 IR/newsroom
   *   industry   : 한국프랜차이즈산업협회 · 업계지 (식품외식경제 등)
   *   media      : 일반 보도 (한경·매경·이데일리 등)
   *   aggregator : 마이프차·장사하자 등 가공 매체 (보조)
   * 권장 구성: primary/industry 최소 1개 + media 최소 2개 (총 3+).
   */
  sources?: Array<{
    label: string;       // "공정거래위원회 정보공개서 2024" 등
    url?: string;
    accessedAt?: string; // YYYY-MM-DD
    tier?: "primary" | "industry" | "media" | "aggregator";
  }>;
  /**
   * 데이터 신뢰도 자체 평가 (검증 후 수동 부여).
   *   high   : primary 1+ + media 2+ 모두 충족, 핵심 fact 교차 검증
   *   medium : 보조 출처 위주, 일부 추정 포함
   *   low    : 단일 출처 또는 미검증 부분 다수
   */
  confidence?: "high" | "medium" | "low";
  /** 장점 — 사장님이 이 브랜드 선택 시 얻는 강점 */
  pros?: { ko: string[]; en: string[] };
  /** 단점 — 사장님이 이 브랜드 선택 시 감수해야 하는 리스크 */
  cons?: { ko: string[]; en: string[] };
  /**
   * 브랜드 한 줄 설명 (5줄 정도) — 모달 상단에 표시.
   * 정체성·시장 위치·핵심 강약점·적합 운영자 톤 통합.
   * 2025년 이후 검증된 정보만, sources 에 출처 명시.
   */
  description?: { ko: string[]; en: string[] };
  /**
   * 적합 상권 — "어떤 위치에 입점하면 잘 맞는가" (오피스·주거·역세권·대학가 등).
   */
  bestLocation?: { ko: string[]; en: string[] };
  /**
   * 공정거래위원회 브랜드별 가맹점 현황 (공식). data.go.kr 15110241 자동 보강.
   *  손큐레이션 storeCount/avgAnnualRevenueWon 을 덮어쓰지 않고 *공식 출처*로 병기.
   *  scripts/enrich-franchise-official-stats.mts 가 채운다(연 1회). 미매칭 브랜드는 없음.
   */
  officialStats?: {
    /** 기준년도 (예: "2024") */
    year: string;
    /** 전국 가맹점수 (공식) */
    storeCount: number;
    /** 그 해 신규개점 수 */
    newOpenings: number;
    /** 그 해 계약종료 수 */
    terminations: number;
    /** 그 해 계약해지 수 */
    cancellations: number;
    /** 가맹점 연 평균매출 (만원). 0/미공개면 미설정. */
    avgSalesWon?: number;
    /** 면적(3.3㎡)당 연 평균매출 (만원). 0/미공개면 미설정. */
    avgSalesPerAreaWon?: number;
    /** 데이터 수집 시점 (YYYY-MM-DD) */
    fetchedAt: string;
  };
};

export type FranchiseCostBreakdown = {
  franchiseFee: number;
  education: number;
  deposit: number;
  interior: number;
  equipment: number;
  signage: number;
  initialStock: number;
  other: number;
  total: number;
  monthlyRoyalty: number;
};

// ── franchise brands SSOT ──
// 2026-05-29: 웹·iOS 동기화 영구 보장을 위해 JSON 파일로 통합.
//   - 진짜 SSOT: packages/shared/src/franchise-brands.json (이 파일)
//   - iOS:       apps/ios/Sources/FoundOneCore/Resources/franchise-brands.json → 이 파일로 symlink
//   - 웹:        이 import 로 직접 로드
import franchiseBrandsJson from "./franchise-brands.json";
import franchiseBrandsKftcJson from "./franchise-brands-kftc.json";
/** 손큐레이션 브랜드 (편집 검증). 기존 소비처 호환을 위해 이 export 는 큐레이션만 유지. */
export const franchiseBrands: FranchiseBrand[] = franchiseBrandsJson as unknown as FranchiseBrand[];
/** 공정위 공개데이터 자동 생성 브랜드 (tier "kftc", 점수는 실데이터 산출). */
export const franchiseBrandsKftc: FranchiseBrand[] = franchiseBrandsKftcJson as unknown as FranchiseBrand[];
/** 전체 = 큐레이션 + 공정위. 큐레이션이 항상 앞(우선 노출). 브라우즈·lookup 의 기본 풀. */
export const franchiseBrandsAll: FranchiseBrand[] = [...franchiseBrands, ...franchiseBrandsKftc];

// ── 독립 창업 평균 비용 데이터 (프랜차이즈 아닌 독립 개인 창업 시) ──────────
// 출처: 소상공인시장진흥공단 창업비용 통계, 업종별 평균 (2024–2025)
// 단위: 만원

export type IndependentStartupCost = {
  subIndustryId: string;
  label: { ko: string; en: string };
  deposit: number;       // 보증금
  interior: number;      // 인테리어
  equipment: number;     // 장비·설비
  workingCapital: number; // 운전자금 (3개월)
  totalEstimate: number; // 합계
  basePyeong: number;    // 기준 평수
  note: { ko: string; en: string };
};

export const INDEPENDENT_STARTUP_COSTS: IndependentStartupCost[] = [
  // ── FOOD ──
  { subIndustryId: "korean-casual", label: { ko: "한식 일반", en: "Korean Casual" }, deposit: 3000, interior: 4500, equipment: 2500, workingCapital: 2000, totalEstimate: 12000, basePyeong: 20, note: { ko: "주방 환기·배관 공사비 별도. 위생교육 필수", en: "Kitchen ventilation/plumbing extra. Hygiene training required" } },
  { subIndustryId: "delivery-meals", label: { ko: "배달 전문점", en: "Delivery Kitchen" }, deposit: 1000, interior: 1500, equipment: 2000, workingCapital: 1500, totalEstimate: 6000, basePyeong: 10, note: { ko: "공유주방 활용 시 2,000만원대 가능", en: "Ghost kitchen option: ~20M won possible" } },
  { subIndustryId: "chicken-burger", label: { ko: "치킨·버거", en: "Chicken & Burger" }, deposit: 2000, interior: 3500, equipment: 3000, workingCapital: 2000, totalEstimate: 10500, basePyeong: 15, note: { ko: "튀김기·후드 설비가 비용 핵심", en: "Fryer and hood equipment are main cost drivers" } },
  { subIndustryId: "ramen-noodle", label: { ko: "라멘·면 전문", en: "Ramen & Noodle" }, deposit: 2500, interior: 4000, equipment: 2000, workingCapital: 1500, totalEstimate: 10000, basePyeong: 15, note: { ko: "국물 장비·면 삶는 설비 필수", en: "Broth equipment and noodle cooker required" } },
  { subIndustryId: "salad-healthy", label: { ko: "샐러드·건강식", en: "Salad & Healthy" }, deposit: 2000, interior: 3000, equipment: 1500, workingCapital: 1500, totalEstimate: 8000, basePyeong: 12, note: { ko: "신선 식재료 관리가 핵심 — 냉장 설비 중요", en: "Fresh ingredient management key — refrigeration critical" } },
  { subIndustryId: "western-pasta-brunch", label: { ko: "양식·파스타", en: "Western & Pasta" }, deposit: 3000, interior: 5000, equipment: 3000, workingCapital: 2000, totalEstimate: 13000, basePyeong: 20, note: { ko: "오픈 키친 인테리어 시 비용 상승", en: "Open kitchen interior increases cost" } },
  // ── CAFE ──
  { subIndustryId: "takeout-coffee", label: { ko: "테이크아웃 커피", en: "Takeout Coffee" }, deposit: 2000, interior: 3500, equipment: 3000, workingCapital: 1500, totalEstimate: 10000, basePyeong: 10, note: { ko: "에스프레소 머신이 설비비 50%+", en: "Espresso machine is 50%+ of equipment cost" } },
  { subIndustryId: "specialty-coffee", label: { ko: "스페셜티 카페", en: "Specialty Coffee" }, deposit: 3000, interior: 5000, equipment: 4000, workingCapital: 2000, totalEstimate: 14000, basePyeong: 20, note: { ko: "로스팅 장비 추가 시 +2,000만원", en: "Add ~20M won for roasting equipment" } },
  { subIndustryId: "dessert-cafe", label: { ko: "디저트 카페", en: "Dessert Cafe" }, deposit: 3000, interior: 5000, equipment: 3500, workingCapital: 2000, totalEstimate: 13500, basePyeong: 20, note: { ko: "쇼케이스·오븐·데코 설비 필수", en: "Showcase, oven, decoration equipment required" } },
  // ── BEAUTY ──
  { subIndustryId: "hair-salon", label: { ko: "헤어살롱", en: "Hair Salon" }, deposit: 3000, interior: 4000, equipment: 2000, workingCapital: 1500, totalEstimate: 10500, basePyeong: 20, note: { ko: "미용사 면허 필수. 의자·샴푸대가 설비 핵심", en: "Hairdresser license required. Chairs and shampoo units key" } },
  { subIndustryId: "nail-studio", label: { ko: "네일 스튜디오", en: "Nail Studio" }, deposit: 1500, interior: 2000, equipment: 1000, workingCapital: 1000, totalEstimate: 5500, basePyeong: 10, note: { ko: "소자본 창업 가능. 미용사(네일) 자격증 필요", en: "Low-capital possible. Nail technician license needed" } },
  { subIndustryId: "waxing-studio", label: { ko: "왁싱 전문", en: "Waxing Studio" }, deposit: 1500, interior: 2000, equipment: 800, workingCapital: 700, totalEstimate: 5000, basePyeong: 10, note: { ko: "1인 운영 가능. 계절 변동(여름 성수기) 주의", en: "Solo operation possible. Watch seasonal variation (summer peak)" } },
  { subIndustryId: "eyelash-brow", label: { ko: "속눈썹·눈썹", en: "Lash & Brow" }, deposit: 1000, interior: 1500, equipment: 500, workingCapital: 500, totalEstimate: 3500, basePyeong: 8, note: { ko: "초소자본 창업 가능. 미용사 면허 필수", en: "Ultra-low-capital possible. Beautician license required" } },
  // ── FITNESS ──
  { subIndustryId: "pilates-studio", label: { ko: "필라테스", en: "Pilates Studio" }, deposit: 3000, interior: 5000, equipment: 6000, workingCapital: 2000, totalEstimate: 16000, basePyeong: 30, note: { ko: "리포머·캐딜락 등 장비비가 핵심. 자격증 강사 확보 중요", en: "Reformer/Cadillac equipment key. Certified instructors critical" } },
  { subIndustryId: "pt-gym", label: { ko: "PT 전문 헬스장", en: "PT Gym" }, deposit: 3000, interior: 4000, equipment: 5000, workingCapital: 2000, totalEstimate: 14000, basePyeong: 40, note: { ko: "머신·프리웨이트 장비비 비중 높음", en: "Machine and free weight equipment dominant cost" } },
  { subIndustryId: "yoga-studio", label: { ko: "요가 스튜디오", en: "Yoga Studio" }, deposit: 2000, interior: 3000, equipment: 1000, workingCapital: 1500, totalEstimate: 7500, basePyeong: 25, note: { ko: "장비비 적음. 바닥 난방·방음이 핵심", en: "Low equipment cost. Floor heating and soundproofing key" } },
  { subIndustryId: "golf-studio", label: { ko: "골프 스크린", en: "Screen Golf" }, deposit: 5000, interior: 8000, equipment: 30000, workingCapital: 3000, totalEstimate: 46000, basePyeong: 50, note: { ko: "스크린 장비가 투자비 60%+ 차지. 대형 투자", en: "Screen equipment is 60%+ of investment. Large scale" } },
  // ── EDUCATION ──
  { subIndustryId: "kids-academy", label: { ko: "아동 학원", en: "Kids Academy" }, deposit: 2000, interior: 3000, equipment: 1500, workingCapital: 1500, totalEstimate: 8000, basePyeong: 25, note: { ko: "학원등록 필수 (관할 교육청). 방음 필수", en: "Academy registration required. Soundproofing needed" } },
  { subIndustryId: "language-academy", label: { ko: "어학원", en: "Language Academy" }, deposit: 2500, interior: 3500, equipment: 1500, workingCapital: 2000, totalEstimate: 9500, basePyeong: 30, note: { ko: "원어민 강사 채용 시 비자 지원 필요", en: "Native instructor hiring requires visa sponsorship" } },
  { subIndustryId: "coding-class", label: { ko: "코딩 교육", en: "Coding Class" }, deposit: 1500, interior: 2000, equipment: 2000, workingCapital: 1500, totalEstimate: 7000, basePyeong: 20, note: { ko: "PC·모니터 장비비 비중 높음. 학원등록 필요", en: "PC/monitor equipment dominant. Academy registration needed" } },
  // ── PET ──
  { subIndustryId: "pet-grooming", label: { ko: "펫 미용", en: "Pet Grooming" }, deposit: 1500, interior: 2000, equipment: 1500, workingCapital: 1000, totalEstimate: 6000, basePyeong: 15, note: { ko: "반려동물 관련 교육 이수 권장. 방음·환기 중요", en: "Pet training recommended. Soundproofing and ventilation important" } },
  { subIndustryId: "pet-cafe", label: { ko: "펫 카페", en: "Pet Cafe" }, deposit: 3000, interior: 4000, equipment: 2000, workingCapital: 2000, totalEstimate: 11000, basePyeong: 30, note: { ko: "동물전시업 등록 필수. 위생·소독 관리 핵심", en: "Animal display registration required. Hygiene management critical" } },
  // ── SPACE ──
  { subIndustryId: "shared-office", label: { ko: "공유오피스", en: "Shared Office" }, deposit: 5000, interior: 8000, equipment: 3000, workingCapital: 3000, totalEstimate: 19000, basePyeong: 60, note: { ko: "대형 면적 필요. 회의실·라운지·네트워크 설비 핵심", en: "Large area needed. Meeting rooms, lounge, network key" } },
  { subIndustryId: "study-room", label: { ko: "독서실·스터디룸", en: "Reading Room" }, deposit: 3000, interior: 5000, equipment: 3000, workingCapital: 1500, totalEstimate: 12500, basePyeong: 40, note: { ko: "좌석 관리 키오스크·CCTV·조명 설비 핵심", en: "Seat management kiosk, CCTV, lighting key" } },
  // ── LIVING SERVICE ──
  { subIndustryId: "self-laundry", label: { ko: "셀프 빨래방", en: "Self Laundry" }, deposit: 2000, interior: 2000, equipment: 5000, workingCapital: 1000, totalEstimate: 10000, basePyeong: 15, note: { ko: "세탁기·건조기 장비가 투자비 50%. 무인 운영 가능", en: "Washer/dryer equipment 50% of cost. Unmanned possible" } },

  // ── CAFE-DESSERT (추가) ──
  { subIndustryId: "self-serve-cafe", label: { ko: "무인카페(셀프카페)", en: "Self-Serve Cafe" }, deposit: 2000, interior: 1500, equipment: 2500, workingCapital: 500, totalEstimate: 6500, basePyeong: 10, note: { ko: "커피머신·키오스크·CCTV 필수. 무인 운영으로 인건비 절감", en: "Coffee machine, kiosk, CCTV required. Unmanned for labor savings" } },
  { subIndustryId: "icecream-bingsu", label: { ko: "아이스크림·빙수", en: "Ice Cream & Bingsu" }, deposit: 2000, interior: 3000, equipment: 2500, workingCapital: 1500, totalEstimate: 9000, basePyeong: 12, note: { ko: "냉동 쇼케이스·빙수기 장비 핵심. 여름 성수기 매출 편중 주의", en: "Freezer showcase & bingsu machine key. Summer-heavy revenue risk" } },
  { subIndustryId: "bakery-studio", label: { ko: "베이커리·제과", en: "Bakery Studio" }, deposit: 3000, interior: 5000, equipment: 5000, workingCapital: 2000, totalEstimate: 15000, basePyeong: 20, note: { ko: "오븐·반죽기·발효기 등 고가 장비 필수. 제과기능사 또는 제조책임자 필요", en: "Oven, mixer, proofer essential. Baker certification or production manager needed" } },

  // ── BEAUTY (추가) ──
  { subIndustryId: "skin-care-room", label: { ko: "피부관리실", en: "Skin Care Room" }, deposit: 1500, interior: 2500, equipment: 2000, workingCapital: 1000, totalEstimate: 7000, basePyeong: 15, note: { ko: "피부관리 베드·LED 장비 핵심. 1인 운영 시 소자본 가능", en: "Treatment beds & LED devices key. Solo operation low-capital possible" } },
  { subIndustryId: "makeup-bridal", label: { ko: "메이크업·브라이덜", en: "Makeup & Bridal" }, deposit: 1500, interior: 2000, equipment: 1000, workingCapital: 800, totalEstimate: 5300, basePyeong: 10, note: { ko: "미용사(메이크업) 면허 필수. 예약 기반 운영으로 고정비 절감 가능", en: "Makeup artist license required. Reservation-based for lower fixed costs" } },

  // ── FITNESS (추가) ──
  { subIndustryId: "crossfit-box", label: { ko: "크로스핏 박스", en: "CrossFit Box" }, deposit: 3000, interior: 3000, equipment: 8000, workingCapital: 2000, totalEstimate: 16000, basePyeong: 50, note: { ko: "CrossFit 본사 연회비 약 400만원. 바벨·링·로잉머신 등 다종 장비 필요", en: "CrossFit HQ annual fee ~$3K. Barbells, rings, rowers, multi-equipment required" } },
  { subIndustryId: "unmanned-fitness", label: { ko: "무인 헬스장(24시)", en: "Unmanned Fitness 24h" }, deposit: 5000, interior: 5000, equipment: 15000, workingCapital: 2000, totalEstimate: 27000, basePyeong: 60, note: { ko: "체력단련장 생활체육지도자 1인 상주 법적 요건 확인. 스마트 출입·CCTV 필수", en: "Legal requirement: sports instructor on-site. Smart access & CCTV required" } },

  // ── EDUCATION (추가) ──
  { subIndustryId: "adult-class", label: { ko: "성인 클래스·공방", en: "Adult Class & Workshop" }, deposit: 1500, interior: 2000, equipment: 1000, workingCapital: 1000, totalEstimate: 5500, basePyeong: 15, note: { ko: "원데이 클래스·공방 형태. 학원등록 필요 여부 확인(교육청)", en: "One-day class format. Check academy registration requirement" } },
  { subIndustryId: "small-study-room", label: { ko: "소형 독서실", en: "Small Study Room" }, deposit: 2000, interior: 3000, equipment: 2000, workingCapital: 1000, totalEstimate: 8000, basePyeong: 25, note: { ko: "좌석 칸막이·조명·냉난방 핵심. 무인 키오스크 운영 가능", en: "Seat partitions, lighting, HVAC key. Unmanned kiosk operation possible" } },

  // ── PET (추가) ──
  { subIndustryId: "pet-supplies", label: { ko: "펫 용품점", en: "Pet Supplies Store" }, deposit: 2000, interior: 2500, equipment: 1000, workingCapital: 2500, totalEstimate: 8000, basePyeong: 15, note: { ko: "초기 재고 비중 높음. 온라인 병행 판매 권장", en: "High initial inventory cost. Online parallel sales recommended" } },
  { subIndustryId: "pet-hotel", label: { ko: "펫 호텔·위탁돌봄", en: "Pet Hotel & Boarding" }, deposit: 3000, interior: 4000, equipment: 2000, workingCapital: 1500, totalEstimate: 10500, basePyeong: 25, note: { ko: "동물위탁관리업 등록 필수. 방음·환기·위생 설비 핵심", en: "Animal boarding registration required. Soundproofing, ventilation, hygiene key" } },
  { subIndustryId: "pet-training-school", label: { ko: "펫 훈련소", en: "Pet Training School" }, deposit: 2000, interior: 2000, equipment: 1000, workingCapital: 1500, totalEstimate: 6500, basePyeong: 30, note: { ko: "반려동물행동지도사 자격 권장. 실내+야외 운동장 확보 필요", en: "Pet behavior specialist cert recommended. Indoor+outdoor space needed" } },

  // ── LIVING-SERVICE (추가) ──
  { subIndustryId: "laundry-service", label: { ko: "세탁편의점", en: "Laundry Service Shop" }, deposit: 1500, interior: 1500, equipment: 3000, workingCapital: 1000, totalEstimate: 7000, basePyeong: 8, note: { ko: "본사 세탁공장 연계 모델. 접수·인도만 수행하는 소규모 점포", en: "HQ factory-linked model. Small reception/delivery storefront" } },
  { subIndustryId: "cleaning-service", label: { ko: "청소 대행", en: "Cleaning Service" }, deposit: 0, interior: 0, equipment: 500, workingCapital: 500, totalEstimate: 1000, basePyeong: 0, note: { ko: "차량+장비만으로 창업 가능. 매장 불필요 — 출장형 서비스", en: "Vehicle + equipment only. No storefront needed — mobile service" } },
  { subIndustryId: "repair-service", label: { ko: "수선·수리점", en: "Repair & Alteration" }, deposit: 1000, interior: 1000, equipment: 500, workingCapital: 500, totalEstimate: 3000, basePyeong: 8, note: { ko: "의류 수선·구두 수선 등. 기술 숙련도가 핵심 경쟁력", en: "Clothing/shoe alteration. Craftsmanship is core competitiveness" } },
  { subIndustryId: "print-copy", label: { ko: "인쇄·복사 매장", en: "Print & Copy Shop" }, deposit: 1500, interior: 1500, equipment: 3000, workingCapital: 1000, totalEstimate: 7000, basePyeong: 10, note: { ko: "복합기·대형프린터 장비 핵심. 무인 키오스크 운영 가능", en: "Multifunction printer & large-format key. Unmanned kiosk possible" } },
  { subIndustryId: "device-repair", label: { ko: "전자기기 수리", en: "Device Repair" }, deposit: 1000, interior: 1000, equipment: 1000, workingCapital: 1000, totalEstimate: 4000, basePyeong: 8, note: { ko: "스마트폰·노트북 수리. 부품 재고 확보 및 기술 교육 필수", en: "Phone & laptop repair. Parts inventory and technical training essential" } },

  // ── SPACE (추가) ──
  { subIndustryId: "guesthouse", label: { ko: "게스트하우스", en: "Guesthouse" }, deposit: 5000, interior: 7000, equipment: 2000, workingCapital: 2000, totalEstimate: 16000, basePyeong: 40, note: { ko: "숙박업 등록 필수 (소방·위생 기준). 외국인관광도시민박업 별도 규정", en: "Accommodation registration required. Fire/hygiene standards apply" } },
  { subIndustryId: "rental-studio", label: { ko: "렌탈 스튜디오", en: "Rental Studio" }, deposit: 2000, interior: 3000, equipment: 1500, workingCapital: 1000, totalEstimate: 7500, basePyeong: 20, note: { ko: "촬영용 조명·배경 설비 필수. 스페이스클라우드 등 플랫폼 활용", en: "Photo lighting & backdrop essential. Use platforms like SpaceCloud" } },
  { subIndustryId: "party-room", label: { ko: "파티룸", en: "Party Room" }, deposit: 2000, interior: 3000, equipment: 1500, workingCapital: 1000, totalEstimate: 7500, basePyeong: 20, note: { ko: "프로젝터·스피커·주방시설 필수. 스마트락 무인 운영 가능", en: "Projector, speakers, kitchen required. Smart lock unmanned possible" } },
  { subIndustryId: "study-cafe-space", label: { ko: "스터디카페 공간", en: "Study Cafe Space" }, deposit: 3000, interior: 5000, equipment: 3000, workingCapital: 1500, totalEstimate: 12500, basePyeong: 40, note: { ko: "좌석 관리 키오스크·CCTV·조명 설비 핵심. 무인 운영 가능", en: "Seat management kiosk, CCTV, lighting key. Unmanned possible" } },
  { subIndustryId: "practice-room", label: { ko: "연습실(댄스·음악)", en: "Practice Room" }, deposit: 2000, interior: 3000, equipment: 2000, workingCapital: 1000, totalEstimate: 8000, basePyeong: 20, note: { ko: "방음 공사 필수. 거울·음향 장비·환기 시설 핵심", en: "Soundproofing mandatory. Mirrors, audio, ventilation key" } },

  // ── RETAIL (추가) ──
  { subIndustryId: "convenience-small", label: { ko: "소형 편의점·마트", en: "Small Convenience Store" }, deposit: 3000, interior: 3000, equipment: 2000, workingCapital: 3000, totalEstimate: 11000, basePyeong: 15, note: { ko: "담배·주류 판매허가 별도. 초기 상품 재고비 비중 높음", en: "Tobacco/liquor license separate. High initial inventory cost" } },
  { subIndustryId: "lifestyle-goods", label: { ko: "라이프스타일 잡화", en: "Lifestyle Goods Shop" }, deposit: 2000, interior: 3000, equipment: 500, workingCapital: 2500, totalEstimate: 8000, basePyeong: 15, note: { ko: "디퓨저·캔들·문구 등 큐레이션 콘셉트. 초기 재고 확보 중요", en: "Diffuser, candle, stationery curation. Initial inventory critical" } },
  { subIndustryId: "beauty-supplies", label: { ko: "뷰티 용품점", en: "Beauty Supply Store" }, deposit: 2000, interior: 2500, equipment: 500, workingCapital: 3000, totalEstimate: 8000, basePyeong: 12, note: { ko: "화장품·미용도구 전문 매장. 유통기한 관리 필수", en: "Cosmetics & beauty tools. Expiration date management essential" } },
  { subIndustryId: "fashion-accessories", label: { ko: "패션 액세서리", en: "Fashion Accessories" }, deposit: 2000, interior: 2500, equipment: 500, workingCapital: 2500, totalEstimate: 7500, basePyeong: 10, note: { ko: "동대문·남대문 사입 구조. 트렌드 변화 빠름 — 재고 리스크 주의", en: "Dongdaemun/Namdaemun sourcing. Fast trend changes — inventory risk" } },
  { subIndustryId: "health-food-store", label: { ko: "건강식품 매장", en: "Health Food Store" }, deposit: 2000, interior: 2000, equipment: 1000, workingCapital: 3000, totalEstimate: 8000, basePyeong: 12, note: { ko: "건강기능식품 판매업 신고 필요. 유통기한·보관 온도 관리 핵심", en: "Health food sales registration needed. Shelf life & temp control key" } },
  { subIndustryId: "unmanned-retail", label: { ko: "무인 매장(리테일)", en: "Unmanned Retail Store" }, deposit: 2000, interior: 2000, equipment: 2500, workingCapital: 1500, totalEstimate: 8000, basePyeong: 10, note: { ko: "키오스크·CCTV·RFID 필수. 도난 방지 시스템 핵심", en: "Kiosk, CCTV, RFID required. Anti-theft system critical" } },

  // ── ONLINE-DIGITAL (추가) ──
  { subIndustryId: "smart-store", label: { ko: "스마트스토어·쇼핑몰", en: "Smart Store / E-commerce" }, deposit: 0, interior: 0, equipment: 200, workingCapital: 500, totalEstimate: 700, basePyeong: 0, note: { ko: "네이버 스마트스토어 기준. 위탁판매 시 재고 0원 가능. 통신판매업 신고 필수", en: "Based on Naver Smart Store. Zero inventory via consignment. Telecom sales registration required" } },
  { subIndustryId: "digital-products", label: { ko: "디지털 제품(템플릿·강의)", en: "Digital Products" }, deposit: 0, interior: 0, equipment: 300, workingCapital: 300, totalEstimate: 600, basePyeong: 0, note: { ko: "노트북+디자인 툴로 시작 가능. 플랫폼(크몽·클래스101) 활용", en: "Laptop + design tools to start. Use platforms like Kmong/Class101" } },
  { subIndustryId: "creator-service", label: { ko: "크리에이터 서비스", en: "Creator Service" }, deposit: 0, interior: 0, equipment: 500, workingCapital: 500, totalEstimate: 1000, basePyeong: 0, note: { ko: "영상 촬영·편집 장비 핵심. 유튜브·인스타 기반 수익화", en: "Camera & editing equipment key. YouTube/Instagram monetization" } },
  { subIndustryId: "consignment-commerce", label: { ko: "위탁판매·구독커머스", en: "Consignment & Subscription" }, deposit: 0, interior: 0, equipment: 200, workingCapital: 1000, totalEstimate: 1200, basePyeong: 0, note: { ko: "재고 부담 없음. 마케팅·광고비가 핵심 비용", en: "No inventory burden. Marketing & ads are main cost" } },

  // ── STARTUP-TECH (추가) ──
  { subIndustryId: "ai-application", label: { ko: "AI 애플리케이션", en: "AI Application" }, deposit: 0, interior: 0, equipment: 500, workingCapital: 3000, totalEstimate: 3500, basePyeong: 0, note: { ko: "클라우드 GPU·API 비용 핵심. 정부 AI 바우처 활용 가능", en: "Cloud GPU & API costs key. Government AI voucher available" } },
  { subIndustryId: "b2b-saas", label: { ko: "B2B SaaS", en: "B2B SaaS" }, deposit: 0, interior: 0, equipment: 500, workingCapital: 5000, totalEstimate: 5500, basePyeong: 0, note: { ko: "개발 인건비가 비용 70%+. NIPA SaaS 개발 지원사업 활용 권장", en: "Dev salaries 70%+ of cost. NIPA SaaS support program recommended" } },
  { subIndustryId: "developer-tools", label: { ko: "개발자 도구", en: "Developer Tools" }, deposit: 0, interior: 0, equipment: 500, workingCapital: 4000, totalEstimate: 4500, basePyeong: 0, note: { ko: "오픈소스 커뮤니티 빌딩 필수. 클라우드 인프라 비용 주의", en: "Open source community building essential. Watch cloud infra costs" } },
  { subIndustryId: "fintech-startup", label: { ko: "핀테크 스타트업", en: "Fintech Startup" }, deposit: 0, interior: 0, equipment: 1000, workingCapital: 8000, totalEstimate: 9000, basePyeong: 0, note: { ko: "금융 라이선스·보안 인증 비용 높음. 전자금융업 등록 필수", en: "High licensing & security cert costs. E-finance registration required" } },
];

export function getIndependentCostForSubIndustry(subIndustryId: string): IndependentStartupCost | undefined {
  return INDEPENDENT_STARTUP_COSTS.find((c) => c.subIndustryId === subIndustryId);
}

// ════════════════════════════════════════════════════════════════════════
// 프랜차이즈 ↔ 세부업종 매칭 (2026-06-26 재설계 — 사장님 신고:
//   "스터디카페 골랐는데 눈높이·구몬(아동교육)이 뜬다")
//
// 근본 원인 3가지:
//   1) study cafe 세부업종 id 가 둘로 갈림: study-room(교육 클러스터) /
//      study-cafe-space(공간 클러스터). 브랜드(작심·토즈)는 한쪽만 태깅됨.
//   2) 매칭 실패 시 categoryId 전체로 폴백 → 무관 브랜드 오염(교육 카테고리의
//      눈높이·구몬 등 학습지 브랜드가 스터디카페 자리에 노출).
//   3) 공정위 자동 브랜드 1,400+ 중 스터디카페(하우스터디·르하임 등)가
//      subIndustryIds: [] 라 영영 매칭 불가.
//
// 해결: ① 세부업종 동의어 그룹으로 확장 ② 이름 기반 분류기로 브랜드 업종
//   보강 ③ 큐레이션+공정위 통합 풀에서 그룹 매칭 + 중복 병합 ④ 카테고리
//   오염 폴백 제거(없으면 정직하게 빈 결과 → UI 가 빈 상태 안내).
// ════════════════════════════════════════════════════════════════════════

/**
 * 세부업종 동의어 그룹 — 같은 실제 업종을 가리키는 id 들을 하나의 브랜드 풀로 묶음.
 * 사용자가 어느 진입 경로(교육 클러스터 study-room vs 공간 클러스터 study-cafe-space)로
 * 들어와도 동일한 프랜차이즈가 뜨도록. 각 그룹의 모든 id 가 서로 별칭.
 */
export const SUB_INDUSTRY_GROUPS: string[][] = [
  ["study-cafe-space", "study-room", "small-study-room"],
];

const SUB_GROUP_INDEX: Record<string, string[]> = (() => {
  const idx: Record<string, string[]> = {};
  for (const grp of SUB_INDUSTRY_GROUPS) for (const id of grp) idx[id] = grp;
  return idx;
})();

/** 조회 id → 동의어 그룹(자기 자신 포함). 그룹 미정의면 [id]. */
export function expandSubIndustryGroup(subIndustryId: string): string[] {
  return SUB_GROUP_INDEX[subIndustryId] ?? [subIndustryId];
}

/**
 * 이름 기반 세부업종 분류기 — 고정밀 키워드만 사용.
 *  공정위 자동 브랜드는 업종 분류(중분류)가 거칠어 스터디카페·독서실 등이
 *  "기타 서비스/교육"으로 빠지며 subIndustryIds 가 비어 매칭 불가. 영업표지(이름)에
 *  명확한 신호가 있으면 보강한다. exclude 가드로 오분류(학습지·학원) 방지.
 *  ⚠️ 새 규칙은 *오탐 0* 을 원칙으로 — 모호하면 추가하지 말 것.
 */
const NAME_SUBINDUSTRY_RULES: Array<{ test: RegExp; exclude?: RegExp; subs: string[] }> = [
  // 스터디카페·독서실 — "교육/학원/과외/어학/아카데미"(학습지·교습소)는 제외
  {
    test: /(스터디|독서실|스터디\s*카페|스터디\s*센터|스터디\s*룸|스터디\s*라운지)/,
    exclude: /(교육|학원|과외|어학|아카데미|학습)/,
    subs: ["study-cafe-space"],
  },
];

/** 브랜드 이름에서 추론한 세부업종 id 들(0개 이상). 규칙 미매칭이면 []. */
export function classifySubIndustriesByName(nameKo: string): string[] {
  const out = new Set<string>();
  for (const rule of NAME_SUBINDUSTRY_RULES) {
    if (rule.test.test(nameKo) && !(rule.exclude && rule.exclude.test(nameKo))) {
      for (const s of rule.subs) out.add(s);
    }
  }
  return [...out];
}

/** 브랜드의 subIndustryIds 를 이름 분류 결과와 합집합으로 보강. 원본 불변. */
function enrichBrandSubIndustries(b: FranchiseBrand): FranchiseBrand {
  const inferred = classifySubIndustriesByName(b.name.ko);
  if (inferred.length === 0) return b;
  const merged = Array.from(new Set([...(b.subIndustryIds ?? []), ...inferred]));
  if (merged.length === (b.subIndustryIds?.length ?? 0)) return b;
  return { ...b, subIndustryIds: merged };
}

/** 보강된 전체 풀(큐레이션 우선 + 공정위). 매칭의 기준 데이터.
 *  위탁 학습지(consignment-tutor)는 가맹점이 아니므로 프랜차이즈 매칭 풀에서 제외. */
export const franchiseBrandsAllEnriched: FranchiseBrand[] =
  franchiseBrandsAll
    .filter((b) => b.businessModel !== "consignment-tutor")
    .map(enrichBrandSubIndustries);

// 교차명 중복 — 공정위 영업표지와 큐레이션 마케팅명이 다른 동일 브랜드.
//  접미사 제거(스터디카페·치킨 등) 자동 매칭은 위험(피자마루↔치킨마루 오병합)하므로
//  검증된 쌍만 명시. 키/값 모두 공백 제거·소문자 정규화된 이름.
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
const KFTC_CURATED_ALIAS: Record<string, string> = {
  [norm("작심")]: norm("작심스터디카페"),
  [norm("토즈 스터디센터")]: norm("토즈"),
};
const brandIdentityKey = (b: FranchiseBrand): string => {
  const n = norm(b.name.ko);
  return KFTC_CURATED_ALIAS[n] ?? n;
};

/**
 * 중복 병합 — 큐레이션을 베이스(검증 비용·공식 가맹문의 URL·로드맵 노트 보존)로,
 *  공정위 공식 통계(officialStats)는 비어있을 때만 overlay. franchiseBrandsAllEnriched
 *  가 큐레이션 우선 정렬이라 같은 키의 첫 등장이 곧 큐레이션.
 */
function dedupeMergeBrands(brands: FranchiseBrand[]): FranchiseBrand[] {
  const byKey = new Map<string, FranchiseBrand>();
  const order: string[] = [];
  for (const b of brands) {
    const k = brandIdentityKey(b);
    const prev = byKey.get(k);
    if (!prev) {
      byKey.set(k, b);
      order.push(k);
      continue;
    }
    // prev = 먼저 등장(큐레이션 우선). 공정위 공식 통계만 보강.
    if (!prev.officialStats && b.officialStats) {
      byKey.set(k, { ...prev, officialStats: b.officialStats });
    }
  }
  return order.map((k) => byKey.get(k)!);
}

/**
 * subIndustryId + (선택) specialtyId 매칭 브랜드 (로드맵 선택 + 탐색 공용).
 *  - 동의어 그룹으로 id 확장 → 어느 진입 경로든 동일 풀.
 *  - 큐레이션 + 공정위 통합(보강된 분류 사용) → 중복 병합.
 *  - specialtyId 있음 + brand.specialtyIds 정의: specialty 포함 brand 만(정확 필터).
 *  - specialtyId 있음 + brand.specialtyIds 미정의: 노출(fallback).
 *  - specialty 결과 0개: sub-industry 전체로 graceful fallback(빈 화면 방지).
 *  - ⚠️ categoryId 전체 폴백은 제거 — 무관 업종 브랜드 오염 방지. 매칭 0개면
 *    빈 배열 반환(UI 가 "등록된 프랜차이즈 없음" 안내).
 *  정렬: 검증 비용 우선 → 가맹점수 큰 순(실재·신뢰 신호).
 */
export function getFranchiseBrandsForSubIndustry(
  subIndustryId: string,
  specialtyId?: string,
  limit = 60,
): FranchiseBrand[] {
  const group = expandSubIndustryGroup(subIndustryId);
  const inSubRaw = franchiseBrandsAllEnriched.filter((fb) =>
    fb.subIndustryIds.some((s) => group.includes(s)),
  );
  const inSub = sortBrandsForPicker(dedupeMergeBrands(inSubRaw));
  // specialty 필터
  const result = (() => {
    if (!specialtyId) return inSub;
    const matched = inSub.filter((fb) =>
      fb.specialtyIds !== undefined
        ? fb.specialtyIds.includes(specialtyId)
        : true, // specialtyIds 미정의 → fallback 노출
    );
    return matched.length > 0 ? matched : inSub;
  })();
  // 인기 sub-industry 는 공정위 포함 수백 개 → 선택 UI 범람 방지 상한.
  //  정렬상 검증 큐레이션 + 가맹점수 큰 순이라 상한 내에 핵심 브랜드 포함. limit<=0 이면 전체.
  return limit > 0 ? result.slice(0, limit) : result;
}

/** 선택 UI 정렬: 검증 비용(큐레이션) 우선 → 가맹점수 내림차순. */
function sortBrandsForPicker(brands: FranchiseBrand[]): FranchiseBrand[] {
  return [...brands].sort((a, b) => {
    if (a.costVerified !== b.costVerified) return a.costVerified ? -1 : 1;
    return (b.storeCount ?? 0) - (a.storeCount ?? 0);
  });
}

/** Get franchise brands for a category (fallback) — 로드맵 선택용이라 큐레이션만 (탐색은 franchiseBrandsAll) */
export function getFranchiseBrandsForCategory(categoryId: string): FranchiseBrand[] {
  return franchiseBrands.filter(
    (fb) => fb.categoryId === categoryId && fb.businessModel !== "consignment-tutor",
  );
}

/** Get a single franchise brand by ID — 큐레이션 + 공정위 전체에서 조회 */
export function getFranchiseBrandById(brandId: string): FranchiseBrand | undefined {
  return franchiseBrandsAll.find((fb) => fb.id === brandId);
}

/** Compute overall score (weighted average) */
export function computeOverallScore(scores: FranchiseScores): number {
  const w = { profitability: 0.3, stability: 0.25, accessibility: 0.15, brandPower: 0.15, support: 0.15 };
  return Math.round(
    scores.profitability * w.profitability +
    scores.stability * w.stability +
    scores.accessibility * w.accessibility +
    scores.brandPower * w.brandPower +
    scores.support * w.support
  );
}

/** Format KRW in 만원 / 억원 */
export function formatFranchiseCost(won10k: number): string {
  if (won10k >= 10000) return `${(won10k / 10000).toFixed(1)}억`;
  return `${won10k.toLocaleString()}만`;
}

/** Score label */
export function getScoreLabel(score: number, lang: "ko" | "en"): string {
  if (score >= 90) return lang === "ko" ? "최우수" : "Excellent";
  if (score >= 80) return lang === "ko" ? "우수" : "Very Good";
  if (score >= 70) return lang === "ko" ? "양호" : "Good";
  if (score >= 60) return lang === "ko" ? "보통" : "Average";
  return lang === "ko" ? "주의" : "Caution";
}

/**
 * Estimate cost breakdown for a franchise brand.
 * Uses startupCostWon + franchiseFee + industry norms to produce realistic estimates.
 */
export function estimateFranchiseCost(brand: FranchiseBrand, pyeong?: number): FranchiseCostBreakdown {
  const p = pyeong ?? brand.minPyeong ?? (brand.categoryId === "retail" ? 20 : brand.categoryId === "beauty" ? 15 : brand.categoryId === "fitness" ? 60 : 15);
  const total = brand.startupCostWon;
  const fee = brand.franchiseFee;

  // Education: typically 5-10% of total, min 100만
  const education = Math.max(100, Math.round(total * 0.06));

  // Deposit: typically 300-5000만 depending on industry
  const deposit = brand.categoryId === "retail" ? 5000
    : total >= 20000 ? Math.round(total * 0.12)
    : total >= 10000 ? Math.round(total * 0.08)
    : Math.max(200, Math.round(total * 0.06));

  // Signage: typically 300-600만
  const signage = Math.max(200, Math.round(total * 0.05));

  // Initial stock: food 10-15%, retail 20%, others 5-8%
  const stockRate = brand.categoryId === "food" || brand.categoryId === "cafe-dessert" ? 0.12
    : brand.categoryId === "retail" ? 0.20
    : 0.06;
  const initialStock = Math.round(total * stockRate);

  // Other: design, marketing, etc. ~3-5%
  const other = Math.round(total * 0.04);

  // Equipment: from remaining after known costs
  const knownCosts = fee + education + deposit + signage + initialStock + other;
  const remainForInteriorAndEquip = Math.max(0, total - knownCosts);

  // Interior: ~55% of remainder, Equipment: ~45%
  const interior = Math.round(remainForInteriorAndEquip * 0.55);
  const equipment = remainForInteriorAndEquip - interior;

  return {
    franchiseFee: fee,
    education,
    deposit,
    interior,
    equipment,
    signage,
    initialStock,
    other,
    total,
    monthlyRoyalty: brand.monthlyRoyalty
  };
}

/** Format cost breakdown as localized label array */
export function formatCostBreakdownItems(
  bd: FranchiseCostBreakdown,
  lang: "ko" | "en"
): Array<{ label: string; value: string; highlight?: boolean }> {
  const f = (won: number) => formatFranchiseCost(won);
  const ko = lang === "ko";
  return [
    { label: ko ? "가맹비" : "Franchise Fee", value: `${f(bd.franchiseFee)}원` },
    { label: ko ? "교육비" : "Training", value: `${f(bd.education)}원` },
    { label: ko ? "보증금" : "Deposit", value: `${f(bd.deposit)}원` },
    { label: ko ? "인테리어" : "Interior", value: `${f(bd.interior)}원` },
    { label: ko ? "주방장비·집기" : "Equipment", value: `${f(bd.equipment)}원` },
    { label: ko ? "간판·외부" : "Signage", value: `${f(bd.signage)}원` },
    { label: ko ? "초도물품" : "Initial Stock", value: `${f(bd.initialStock)}원` },
    { label: ko ? "기타" : "Other", value: `${f(bd.other)}원` },
    { label: ko ? "예상 총 비용" : "Estimated Total", value: `${f(bd.total)}원`, highlight: true },
    { label: ko ? "월 로열티" : "Monthly Royalty", value: bd.monthlyRoyalty > 0 ? `${bd.monthlyRoyalty}만원/월` : (ko ? "없음" : "None") }
  ];
}

/** Score color */
export function getScoreColor(score: number): string {
  if (score >= 90) return "#34c759";
  if (score >= 80) return "#30d158";
  if (score >= 70) return "#007aff";
  if (score >= 60) return "#ff9f0a";
  return "#ff3b30";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  FRANCHISE SUPPLY STRUCTURE
 *  프랜차이즈 공급 구조
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export type SupplyType = "hq-exclusive" | "hq-designated" | "free-purchase";

export type FranchiseSupplyItem = {
  category: { ko: string; en: string };
  type: SupplyType;
  items: { ko: string; en: string }[];
  note?: { ko: string; en: string };
};

/** 업종별 공통 프랜차이즈 공급 구조 */
const categorySupplyPatterns: Record<string, FranchiseSupplyItem[]> = {
  "cafe-dessert": [
    { category: { ko: "원두·시럽·파우더", en: "Beans, syrup, powder" }, type: "hq-exclusive", items: [{ ko: "본사 자체 로스팅 원두", en: "HQ-roasted beans" }, { ko: "시럽·파우더·소스류", en: "Syrups, powders, sauces" }], note: { ko: "브랜드 맛 일관성 유지를 위해 본사 독점 공급", en: "HQ exclusive for taste consistency" } },
    { category: { ko: "기계·장비", en: "Machines & equipment" }, type: "hq-designated", items: [{ ko: "에스프레소 머신", en: "Espresso machine" }, { ko: "제빙기·블렌더", en: "Ice maker, blender" }, { ko: "DID 메뉴보드", en: "DID menu board" }], note: { ko: "본사 지정 모델 사용 필수", en: "HQ-specified models required" } },
    { category: { ko: "컵·포장재", en: "Cups & packaging" }, type: "hq-designated", items: [{ ko: "브랜드 로고 컵·슬리브", en: "Branded cups & sleeves" }, { ko: "테이크아웃 봉투·캐리어", en: "Takeout bags & carriers" }], note: { ko: "브랜드 디자인 통일을 위해 지정 업체 구매 (일부 자유 구매 가능)", en: "Designated for brand consistency (some free purchase possible)" } },
    { category: { ko: "인테리어·간판", en: "Interior & signage" }, type: "hq-designated", items: [{ ko: "본사 시공팀 또는 지정 업체", en: "HQ construction or designated contractor" }, { ko: "외부 간판·내부 사인물", en: "Exterior signage, interior signs" }] },
    { category: { ko: "소모품·위생용품", en: "Consumables & hygiene" }, type: "free-purchase", items: [{ ko: "냅킨·빨대·물티슈", en: "Napkins, straws, wet wipes" }, { ko: "세제·청소용품", en: "Detergent, cleaning supplies" }, { ko: "직원 유니폼 (일부 본사 지급)", en: "Staff uniform (some provided by HQ)" }] },
    { category: { ko: "POS·키오스크", en: "POS & kiosk" }, type: "hq-designated", items: [{ ko: "본사 지정 POS 시스템", en: "HQ-designated POS" }, { ko: "키오스크 (본사 연동 필수)", en: "Kiosk (HQ integration required)" }] },
  ],
  "food": [
    { category: { ko: "핵심 식재료·소스", en: "Core ingredients & sauce" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 소스·양념", en: "HQ recipe sauce & seasoning" }, { ko: "메인 식재료 (치킨·패티·면 등)", en: "Main ingredients (chicken, patty, noodle, etc.)" }], note: { ko: "브랜드 맛 보장을 위해 본사 물류센터에서 직배송", en: "Direct delivery from HQ logistics center for taste guarantee" } },
    { category: { ko: "주방 장비", en: "Kitchen equipment" }, type: "hq-designated", items: [{ ko: "튀김기·오븐·그릴 (본사 사양)", en: "Fryer, oven, grill (HQ spec)" }, { ko: "냉장·냉동고", en: "Refrigerator, freezer" }] },
    { category: { ko: "포장재·배달용품", en: "Packaging & delivery" }, type: "hq-designated", items: [{ ko: "브랜드 박스·봉투", en: "Branded boxes & bags" }, { ko: "배달 보온팩", en: "Delivery insulated packs" }] },
    { category: { ko: "인테리어·간판", en: "Interior & signage" }, type: "hq-designated", items: [{ ko: "본사 시공 또는 지정 업체", en: "HQ construction or designated" }, { ko: "간판·메뉴보드", en: "Signage, menu board" }] },
    { category: { ko: "부재료·소모품", en: "Sub-ingredients & consumables" }, type: "free-purchase", items: [{ ko: "야채·쌀 등 일반 식재료", en: "Vegetables, rice, etc." }, { ko: "세제·위생용품", en: "Detergent, hygiene supplies" }, { ko: "일회용 장갑·앞치마", en: "Disposable gloves, aprons" }] },
    { category: { ko: "POS·키오스크", en: "POS & kiosk" }, type: "hq-designated", items: [{ ko: "본사 연동 POS", en: "HQ-linked POS" }, { ko: "배달앱 태블릿", en: "Delivery app tablet" }] },
  ],
  "retail": [
    { category: { ko: "상품 공급", en: "Product supply" }, type: "hq-exclusive", items: [{ ko: "본사 물류센터 자동 발주", en: "Auto-order from HQ logistics" }, { ko: "PB 상품", en: "Private brand products" }], note: { ko: "편의점은 본사 ERP로 자동 발주 — 가맹점이 직접 선택하는 폭이 제한적", en: "Convenience stores use HQ ERP auto-order — limited franchisee selection" } },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·온장고", en: "Refrigerated displays, warmers" }, { ko: "POS·CCTV", en: "POS, CCTV" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품·봉투", en: "Cleaning supplies, bags" }] },
  ],
  "beauty": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "hq-designated", items: [{ ko: "염색제·펌제·트리트먼트", en: "Hair color, perm, treatment" }, { ko: "네일 젤·아트 재료", en: "Nail gel, art materials" }], note: { ko: "브랜드 품질 유지를 위해 본사 지정 제품 사용 권장 (일부 자유)", en: "HQ-designated products recommended for quality (some flexible)" } },
    { category: { ko: "장비·가구", en: "Equipment & furniture" }, type: "hq-designated", items: [{ ko: "시술 의자·샴푸대", en: "Styling chair, shampoo unit" }, { ko: "인테리어 (본사 시공)", en: "Interior (HQ construction)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·케이프·장갑", en: "Towels, capes, gloves" }, { ko: "세제·위생용품", en: "Detergent, hygiene" }] },
  ],
};

/** Brand-specific supply overrides (실제 조사 기반) */
const brandSupplyOverrides: Record<string, FranchiseSupplyItem[]> = {
  "mega-coffee": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "100% 아라비카 프리미엄 원두", en: "100% Arabica premium beans" }], note: { ko: "CK코페레이션 위탁 로스팅 → 본사 독점 공급, 상품매출 4,672억원(2024)", en: "CK Corporation contract roasting → HQ exclusive, 4,672B product revenue (2024)" } },
    { category: { ko: "시럽·파우더·소스·드링크 베이스", en: "Syrup, powder, sauce, drink base" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 전용 시럽·파우더 — 메뉴 표준화 핵심", en: "HQ-recipe exclusive syrup/powder — menu standardization" }] },
    { category: { ko: "메가 브랜드 일회용품 (권장품목)", en: "Mega-branded disposables (recommended)" }, type: "hq-designated", items: [{ ko: "메가 로고 컵·홀더·캐리어·테이크아웃 박스·종이가방", en: "Mega-logo cups, sleeves, carriers, take-out boxes, paper bags" }], note: { ko: "가맹사업법상 '권장 품목' (필수 아님). 2025년 점주협의회가 본사 공급가 절반에 컵 자체 조달 시작 — 정보공개서 확인 권장", en: "Legally 'recommended' (not mandatory). 2025 owner association self-sources cups at half HQ price — review disclosure" } },
    { category: { ko: "장비·POS·키오스크·DID", en: "Equipment, POS, kiosk, DID" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·제빙기·블렌더·POS·키오스크·DID 메뉴보드", en: "Espresso machine, ice maker, blender, POS, kiosk, DID" }], note: { ko: "본사 지정 모델 필수, DID 메뉴보드 약 321만원", en: "HQ-specified models required, DID menu board ~3.21M" } },
    { category: { ko: "유니폼·앞치마", en: "Uniform & apron" }, type: "hq-designated", items: [{ ko: "메가 공식 유니폼·앞치마 — 본사 지정 업체", en: "Official Mega uniform/apron from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올·화장실 휴지", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels, toilet paper" }], note: { ko: "메가 로고가 없는 일반 위생·청소용품만 자유 구매 가능", en: "Only non-branded generic supplies are free-purchase" } },
  ],
  "compose-coffee": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "자체 스마트팩토리 로스팅 (월 500톤)", en: "In-house smart factory roasting (500t/mo)" }], note: { ko: "생두 수입→로스팅→포장→물류 원스톱 (충북 증평), 독일 프로밧·이탈리아 페트론치니 대형로스터", en: "Bean import→roast→pack→logistics one-stop, Probat/Petroncini roasters" } },
    { category: { ko: "시럽·파우더·드링크 베이스", en: "Syrup, powder, drink base" }, type: "hq-exclusive", items: [{ ko: "본사 자체 생산 — 음료 메뉴 표준화 핵심", en: "HQ in-house production — menu standardization core" }] },
    { category: { ko: "컴포즈 브랜드 일회용품", en: "Compose-branded disposables" }, type: "hq-designated", items: [{ ko: "컴포즈 로고 컵·홀더·캐리어·아이스크림컵·테이크아웃 박스", en: "Compose-logo cups, sleeves, carriers, ice cream cups, take-out boxes" }], note: { ko: "권장품목 — 브랜드 디자인 통일을 위해 본사 공급. 외부 매입은 점주 협의회 차원에서 일부 시도", en: "Recommended item — HQ-supplied for brand uniformity. Some owner association self-sourcing" } },
    { category: { ko: "장비·POS·인테리어", en: "Equipment, POS & interior" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·제빙기·POS·DID·인테리어 본사 디자인 시공 필수", en: "Espresso machine, ice maker, POS, DID, interior HQ-designed build mandatory" }] },
    { category: { ko: "유니폼·앞치마", en: "Uniform & apron" }, type: "hq-designated", items: [{ ko: "컴포즈 공식 유니폼 — 본사 지정 업체", en: "Official Compose uniform from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels" }], note: { ko: "컴포즈 로고가 없는 일반 위생·청소용품만 자유 구매 가능", en: "Only non-branded generic supplies are free-purchase" } },
  ],
  "paiks-dabang": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "콜롬비아 수프리모 베이스 자체 로스팅", en: "Colombia Supremo base, in-house roast" }], note: { ko: "더본코리아 자체 로스팅, 로스팅 2일 내 배송 → 2주 내 사용 의무. 2025년 원두 교체 진행", en: "The Born Korea roasting, 2-day delivery → 2-week use mandate. 2025 bean change" } },
    { category: { ko: "간식 메뉴 식재료", en: "Snack ingredients" }, type: "hq-exclusive", items: [{ ko: "에그토스트·샌드위치·딸기라떼 시그니처 메뉴 재료", en: "Egg toast, sandwich, strawberry latte signature menu materials" }], note: { ko: "더본코리아 자체 식자재 공급망 (대구 더본물류센터)", en: "The Born Korea supply chain (Daegu logistics center)" } },
    { category: { ko: "시럽·파우더·드링크 베이스", en: "Syrup, powder, drink base" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 시럽·파우더 — 메뉴 표준화 핵심", en: "HQ-recipe syrups, powders — menu standardization" }] },
    { category: { ko: "빽다방 브랜드 일회용품", en: "Paik's-branded disposables" }, type: "hq-exclusive", items: [{ ko: "빽다방 로고 컵·홀더·캐리어·테이크아웃 박스·종이가방", en: "Paik's-logo cups, sleeves, carriers, take-out boxes, paper bags" }], note: { ko: "더본코리아 통합 물류로 본사 일괄 공급 — 외부 매입 금지", en: "The Born Korea unified logistics — external purchase prohibited" } },
    { category: { ko: "장비·POS·인테리어", en: "Equipment, POS & interior" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·제빙기·POS·DID·인테리어 본사 시공", en: "Espresso machine, ice maker, POS, DID, HQ interior build" }] },
    { category: { ko: "유니폼·앞치마", en: "Uniform & apron" }, type: "hq-designated", items: [{ ko: "빽다방 공식 유니폼 — 본사 지정 업체", en: "Official Paik's uniform from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels" }], note: { ko: "빽다방 로고가 없는 일반 위생·청소용품만 자유 구매 가능", en: "Only non-branded generic supplies are free-purchase" } },
  ],
  "bbq": [
    { category: { ko: "닭고기·올리브유", en: "Chicken & olive oil" }, type: "hq-exclusive", items: [{ ko: "본사 물류센터 직배송", en: "HQ logistics direct delivery" }], note: { ko: "올리브유: HY인터내셔널 독점 공급, 원부자재 39개 품목 본사 공급", en: "Olive oil: HY International exclusive, 39 items HQ-supplied" } },
    { category: { ko: "소스·파우더·패키지", en: "Sauce, powder, packaging" }, type: "hq-exclusive", items: [{ ko: "양념 소스류·치킨 파우더·브랜드 박스", en: "Seasoning sauce, chicken powder, branded boxes" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기·여과기 (본사 사양)", en: "Fryer, filter (HQ spec)" }] },
    { category: { ko: "부재료·소모품", en: "Sub-materials" }, type: "free-purchase", items: [{ ko: "세제·장갑·앞치마·청소용품", en: "Detergent, gloves, aprons, cleaning" }] },
  ],
  "kyochon-chicken": [
    { category: { ko: "원육·소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "주 6일 배송 (업계 최초)", en: "6-day delivery (industry first)" }], note: { ko: "WMS/TMS 도입, 원육 신선도 극대화. 3PL 사업 확대 중", en: "WMS/TMS deployed, max freshness. Expanding 3PL" } },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "모던 빈티지 인테리어 (본사 시공)", en: "Modern vintage interior (HQ build)" }] },
    { category: { ko: "수제 맥주", en: "Craft beer" }, type: "hq-exclusive", items: [{ ko: "교촌 자체 수제 맥주 라인", en: "Kyochon in-house craft beer" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·위생용품·일회용품", en: "Detergent, hygiene, disposables" }] },
  ],
  "moms-touch": [
    { category: { ko: "버거 번·패티·치킨", en: "Burger bun, patty, chicken" }, type: "hq-exclusive", items: [{ ko: "빔보큐에스알코리아(번), 패티·치킨 본사 공급", en: "BimboQSR Korea (bun), patty/chicken HQ supply" }], note: { ko: "중앙화 구매·물류·위생 시스템 (맥도날드 출신 대표 구축)", en: "Centralized purchase/logistics/hygiene (ex-McDonald's CEO built)" } },
    { category: { ko: "소스·양념", en: "Sauce & seasoning" }, type: "hq-exclusive", items: [{ ko: "싸이버거 전용 소스 등 본사 레시피", en: "Cyburger sauce etc. HQ recipe" }] },
    { category: { ko: "장비·POS", en: "Equipment & POS" }, type: "hq-designated", items: [{ ko: "튀김기·그릴·POS·키오스크", en: "Fryer, grill, POS, kiosk" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·위생용품", en: "Detergent, gloves, hygiene" }] },
  ],
  "cu": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "본사 ERP 자동발주 시스템", en: "HQ ERP auto-order system" }], note: { ko: "BGF리테일 물류센터 직배송, 2026년 부산 대형 물류센터 가동 예정 (2,200억 투자)", en: "BGF Retail logistics center, 2026 Busan mega-center planned (220B investment)" } },
    { category: { ko: "PB상품", en: "Private brand" }, type: "hq-exclusive", items: [{ ko: "CU 자체 브랜드 상품", en: "CU private brand products" }] },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·온장고·POS·CCTV", en: "Refrigerated displays, warmers, POS, CCTV" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품·봉투", en: "Cleaning supplies, bags" }] },
  ],
  "gs25": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "GS리테일 ERP·데이터 기반 자동발주", en: "GS Retail ERP/data-driven auto-order" }], note: { ko: "업계 최고 수준 디지털 발주 시스템, PB상품 데이터 기반 MD 기획", en: "Best-in-class digital ordering, data-driven PB product planning" } },
    { category: { ko: "PB상품", en: "Private brand" }, type: "hq-exclusive", items: [{ ko: "유어스(YOU US) 등 자체 브랜드", en: "YOU US and other private brands" }] },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·커피머신·POS", en: "Refrigerated displays, coffee machine, POS" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품", en: "Cleaning supplies" }] },
  ],
  // ── Group A: Remaining cafe/dessert/bakery ──
  "ediya-coffee": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "드림팩토리 자체 로스팅 (평택, 연 6,000톤)", en: "Dream Factory in-house roasting (Pyeongtaek, 6,000t/yr)" }], note: { ko: "스위스 뷸러·독일 프로밧 설비, 4단계 이물 선별 → 전자동 로스팅·포장. 물류는 이천 드림물류센터", en: "Swiss Bühler/German Probat equipment, 4-stage sorting → auto roast/pack. Icheon logistics center" } },
    { category: { ko: "파우더·스틱커피·시럽", en: "Powder, stick coffee & syrup" }, type: "hq-exclusive", items: [{ ko: "드림팩토리 자체 생산 — 음료 베이스·파우더·스틱커피", en: "Dream Factory in-house — drink base, powder, stick coffee" }] },
    { category: { ko: "이디야 브랜드 일회용품", en: "EDIYA-branded disposables" }, type: "hq-exclusive", items: [{ ko: "이디야 로고 컵·홀더·캐리어·테이크아웃 박스·머그", en: "EDIYA-logo cups, sleeves, carriers, take-out boxes, mugs" }], note: { ko: "브랜드 로고 인쇄 일회용품은 본사 일괄 공급 — 외부 매입 금지", en: "Branded disposables HQ-only — external purchase prohibited" } },
    { category: { ko: "장비·POS·인테리어", en: "Equipment, POS & interior" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·제빙기·POS·인테리어 본사 사양", en: "Espresso machine, ice maker, POS, interior HQ spec" }] },
    { category: { ko: "유니폼·앞치마", en: "Uniform & apron" }, type: "hq-designated", items: [{ ko: "이디야 공식 유니폼 — 본사 지정 업체", en: "Official EDIYA uniform from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels" }], note: { ko: "이디야 로고가 없는 일반 위생·청소용품만 자유 구매 가능", en: "Only non-branded generic supplies are free-purchase" } },
  ],
  "the-venti": [
    { category: { ko: "원두·파우더·액상", en: "Beans, powder, liquid" }, type: "hq-exclusive", items: [{ ko: "퍼플랜드 자체 생산 (충북 증평, 원두 5,000t·파우더 10,000t·액상 5,000t/년)", en: "Purpleland in-house (Jeungpyeong, 5,000t beans·10,000t powder·5,000t liquid/yr)" }], note: { ko: "생두 직접 수입, 8단계 선별, 로스팅 후 블랜딩 방식. 매년 원두+부자재 가격 인하 실현", en: "Direct green bean import, 8-stage sorting, post-roast blending. Annual price reductions" } },
    { category: { ko: "더벤티 브랜드 일회용품", en: "The Venti-branded disposables" }, type: "hq-designated", items: [{ ko: "더벤티 로고 컵(20oz·32oz)·홀더·캐리어·테이크아웃 박스", en: "The Venti-logo cups (20/32oz), sleeves, carriers, take-out boxes" }], note: { ko: "32oz 시그니처 사이즈 컵은 본사 디자인 통일 — 본사 공급 의무", en: "32oz signature size cup is HQ-design — supply mandatory" } },
    { category: { ko: "외부 사이니지·간판", en: "External signage" }, type: "hq-designated", items: [{ ko: "더벤티 시그니처 보라+노랑 간판·외장", en: "The Venti signature purple+yellow signage/exterior" }] },
    { category: { ko: "장비·POS", en: "Equipment & POS" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·제빙기·POS·DID (무이자 할부 지원)", en: "Espresso machine, ice maker, POS, DID (interest-free installment)" }] },
    { category: { ko: "유니폼·앞치마", en: "Uniform & apron" }, type: "hq-designated", items: [{ ko: "더벤티 공식 유니폼 — 본사 지정 업체", en: "Official The Venti uniform from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels" }], note: { ko: "더벤티 로고가 없는 일반 위생·청소용품만 자유 구매 가능", en: "Only non-branded generic supplies are free-purchase" } },
  ],
  "twosome-place": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "큐그레이더 선별 3종 블랜드 (블랙그라운드·아로마노트·디카페인)", en: "Q-Grader curated 3 blends" }], note: { ko: "칼라일 그룹 인수 후에도 원두·레시피 변경 없음 (자체 로스팅)", en: "No bean/recipe changes after Carlyle acquisition (in-house roasting)" } },
    { category: { ko: "디저트·케이크", en: "Dessert & cake" }, type: "hq-exclusive", items: [{ ko: "충북 음성 '어썸 페어링 플랜트' 자체 생산 (스초생·피치생 등)", en: "Eumseong 'Awesome Pairing Plant' in-house" }] },
    { category: { ko: "음료 베이스·시럽·파우더", en: "Drink base, syrup, powder" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 시럽·파우더·드링크 베이스", en: "HQ-recipe syrups, powders, drink bases" }] },
    { category: { ko: "투썸 브랜드 일회용품", en: "Twosome-branded disposables" }, type: "hq-exclusive", items: [{ ko: "투썸 로고 컵·홀더·캐리어·디저트 박스·케이크 상자·쇼핑백", en: "Twosome-logo cups, sleeves, carriers, dessert boxes, cake boxes, shopping bags" }], note: { ko: "브랜드 로고 인쇄 일회용품·포장재는 본사 일괄 공급 — 외부 매입 금지", en: "Branded disposables/packaging HQ-only — external purchase prohibited" } },
    { category: { ko: "인테리어·장비", en: "Interior & equipment" }, type: "hq-designated", items: [{ ko: "디저트 쇼케이스 필수, 본사 인테리어 설계, POS 본사 지정", en: "Dessert showcase required, HQ interior design, HQ-designated POS" }] },
    { category: { ko: "유니폼·앞치마", en: "Uniform & apron" }, type: "hq-designated", items: [{ ko: "투썸 공식 유니폼·앞치마 — 본사 지정 업체", en: "Official Twosome uniform/apron from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올·화장실 휴지", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels, toilet paper" }], note: { ko: "투썸 로고가 없는 일반 위생·청소용품만 자유 구매 가능", en: "Only non-branded generic supplies are free-purchase" } },
  ],
  "baskin-robbins": [
    // ── 본사 독점 공급 (hq-exclusive) ──
    { category: { ko: "아이스크림 31종 + 시즌 신메뉴", en: "31 flavors + seasonal new" }, type: "hq-exclusive",
      items: [{ ko: "비알코리아 충북 음성 HACCP 인증 공장 — 매월 시즌 신메뉴 자동 공급", en: "BR Korea Eumseong HACCP plant — monthly seasonal auto-supply" }],
      note: { ko: "본사 배송차로 패키지 일괄 공급. 차액가맹금(공급가 마진) 점주 417명 부당이득 반환소송 진행 — 정보공개서 사전 검토 필수", en: "HQ delivery trucks, packaged supply. 417 owners filed lawsuit over supply mark-up — review franchise disclosure" } },
    { category: { ko: "아이스크림 케이크·롤 케이크", en: "Ice cream cake & roll cake" }, type: "hq-exclusive",
      items: [{ ko: "본사 레시피 OEM 생산 — 점주 자체 제조·외부 매입 불가", en: "OEM by HQ recipe — no in-store/external sourcing" }] },
    { category: { ko: "음료 베이스·커피 원두", en: "Drink base & coffee beans" }, type: "hq-exclusive",
      items: [{ ko: "비알코리아 자체 로스팅 센터, 음료용 시럽·파우더", en: "BR Korea in-house roasting + drink syrups/powder" }] },
    { category: { ko: "BR 브랜드 일회용품", en: "BR-branded disposables" }, type: "hq-exclusive",
      items: [{ ko: "핑크 시식 스푼·BR 로고 스푼·아이스크림 컵·테이크아웃 박스·드라이아이스 봉투", en: "Pink sample spoon, BR-logo spoon, ice cream cup, take-out box, dry-ice bag" }],
      note: { ko: "BR 핑크 스푼은 브랜드 자산 — 본사 일괄 공급, 외부 구매 절대 불가", en: "Pink BR spoon is brand asset — HQ-only, external purchase prohibited" } },

    // ── 본사 지정 업체 (hq-designated) ──
    { category: { ko: "판매장비·인테리어", en: "Sales equipment & interior" }, type: "hq-designated",
      items: [{ ko: "31픽 아이스크림 냉동 쇼케이스(-25°C)·POS·인테리어 본사 시공", en: "31-flavor freezer showcase (-25°C), POS, HQ interior build" }],
      note: { ko: "정보공개서: 가구 1,200만 + 사이니지 850만 + 인테리어 5,900만 + 판매장비 7,000만 + 냉난방·CCTV 950만 (15평 기준)", en: "Disclosure: furniture 12M + signage 8.5M + interior 59M + sales eq 70M + HVAC/CCTV 9.5M (15py)" } },
    { category: { ko: "유니폼·앞치마", en: "Uniform & apron" }, type: "hq-designated",
      items: [{ ko: "BR 공식 유니폼·앞치마·모자 — 본사 지정 업체 매입", en: "BR official uniform/apron/cap from designated vendor" }] },

    // ── 자유 구매 (free-purchase) — 정말 일반 소모품만 ──
    { category: { ko: "일반 위생·청소용품 (BR 로고 無)", en: "Generic non-BR-logo supplies" }, type: "free-purchase",
      items: [{ ko: "화장실 휴지·손세정제·주방세제·고무장갑·쓰레기봉투·청소포·페이퍼타올", en: "Toilet paper, hand soap, dish soap, gloves, trash bags, cleaning cloth" }],
      note: { ko: "BR 로고가 인쇄된 모든 일회용품(스푼·컵·박스 등)은 본사 독점 공급 — 절대 외부 구매 금지", en: "All BR-logo disposables (spoons, cups, boxes) are HQ-exclusive — external purchase prohibited" } },
  ],
  "sulbing": [
    { category: { ko: "빙수 재료·토핑", en: "Bingsu ingredients & topping" }, type: "hq-exclusive", items: [{ ko: "인절미·팥·우유 아이스·과일 시즌 토핑 등 핵심 재료 본사 공급", en: "Injeolmi, red bean, milk ice, seasonal fruit toppings — HQ supplied" }], note: { ko: "다수 메뉴 OEM 생산, 시즌별 신메뉴 본사 자동 공급", en: "Many items OEM-produced, seasonal new menus auto-supplied" } },
    { category: { ko: "토스트·음료 재료", en: "Toast & drink ingredients" }, type: "hq-exclusive", items: [{ ko: "토스트 식빵·잼·음료 파우더·시럽", en: "Toast bread, jam, drink powder, syrup" }] },
    { category: { ko: "설빙 브랜드 일회용품·포장재", en: "Sulbing-branded disposables" }, type: "hq-exclusive", items: [{ ko: "설빙 로고 빙수 그릇 일회용 버전·테이크아웃 컵·박스·종이가방", en: "Sulbing-logo disposable bowls, take-out cups, boxes, paper bags" }], note: { ko: "브랜드 디자인 통일 일회용품은 본사 일괄 공급 — 외부 매입 금지", en: "Branded disposables HQ-supplied — external purchase prohibited" } },
    { category: { ko: "장비·POS·인테리어", en: "Equipment, POS & interior" }, type: "hq-designated", items: [{ ko: "빙삭기·냉동고(-25°C)·POS·인테리어 본사 사양 시공", en: "Ice shaver, freezer (-25°C), POS, HQ interior spec build" }] },
    { category: { ko: "유니폼·앞치마", en: "Uniform & apron" }, type: "hq-designated", items: [{ ko: "설빙 공식 유니폼·앞치마 — 본사 지정 업체", en: "Official Sulbing uniform/apron from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels" }], note: { ko: "설빙 로고가 없는 일반 위생·청소용품만 자유 구매 가능. 빙수 그릇 일회용 버전은 본사 공급", en: "Only non-branded generic supplies. Disposable bingsu bowls are HQ-supplied" } },
  ],
  "paris-baguette": [
    { category: { ko: "냉동생지·빵 재료", en: "Frozen dough & bread" }, type: "hq-exclusive", items: [{ ko: "SPL(구 SPC로지스틱스) 냉동생지·소스 생산", en: "SPL (fmr SPC Logistics) frozen dough/sauce" }], note: { ko: "SPC그룹 계열 SPL이 전국 파리바게뜨용 냉동생지·샌드위치 소스 등 생산. 미국 텍사스 공장 2027년 가동 예정", en: "SPC Group's SPL produces frozen dough/sandwich sauce. Texas factory planned 2027" } },
    { category: { ko: "케이크·디저트·샌드위치", en: "Cake, dessert, sandwich" }, type: "hq-exclusive", items: [{ ko: "SPC그룹 통합 생산·물류 — 케이크·샌드위치·샐러드 완제품", en: "SPC Group integrated production/logistics — cakes, sandwiches, salads" }] },
    { category: { ko: "음료·커피 원두", en: "Drinks & coffee beans" }, type: "hq-exclusive", items: [{ ko: "파바카페 음료 베이스·커피 원두 본사 공급", en: "Paris Baguette Café drink base & coffee beans HQ-supplied" }] },
    { category: { ko: "파리바게뜨 브랜드 포장재", en: "Paris Baguette-branded packaging" }, type: "hq-exclusive", items: [{ ko: "파바 로고 케이크 박스·빵 봉투·쇼핑백·리본·캔들·생일 모자", en: "PB-logo cake boxes, bread bags, shopping bags, ribbons, candles, hats" }], note: { ko: "케이크 박스·빵 봉투 등 모든 포장재가 본사 디자인 — 외부 매입 절대 금지", en: "All packaging is HQ-designed — external purchase strictly prohibited" } },
    { category: { ko: "제빵 장비·오븐", en: "Baking equipment & oven" }, type: "hq-designated", items: [{ ko: "본사 지정 오븐·발효기·쇼케이스·POS·인테리어", en: "HQ-designated oven, proofer, showcase, POS, interior" }] },
    { category: { ko: "유니폼·앞치마·모자", en: "Uniform, apron, cap" }, type: "hq-designated", items: [{ ko: "파바 공식 유니폼·앞치마·모자 — 본사 지정 업체", en: "Official PB uniform/apron/cap from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels" }], note: { ko: "파리바게뜨 로고가 없는 일반 위생·청소용품만 자유 구매 가능", en: "Only non-branded generic supplies are free-purchase" } },
  ],
  "tous-les-jours": [
    { category: { ko: "냉동생지·빵 재료", en: "Frozen dough & bread" }, type: "hq-exclusive", items: [{ ko: "CJ푸드빌 자체 생산 (한국 공장 + 베트남 롱안 공장)", en: "CJ Foodville in-house (Korea + Vietnam Long An factory)" }], note: { ko: "미국 조지아 게인스빌에 신규 공장 건설 중 (연 1억개 생산, 2025년 12월 가동 목표)", en: "New Georgia Gainesville factory under construction (100M/yr, Dec 2025 target)" } },
    { category: { ko: "케이크·디저트·샌드위치", en: "Cake, dessert, sandwich" }, type: "hq-exclusive", items: [{ ko: "CJ푸드빌 통합 생산 — 완제품 케이크·샌드위치·샐러드", en: "CJ Foodville integrated production — cakes, sandwiches, salads" }] },
    { category: { ko: "음료·커피 원두", en: "Drinks & coffee beans" }, type: "hq-exclusive", items: [{ ko: "뚜레쥬르 카페 음료 베이스·커피 원두 본사 공급", en: "TLJ Café drink base & coffee beans HQ-supplied" }] },
    { category: { ko: "뚜레쥬르 브랜드 포장재", en: "TLJ-branded packaging" }, type: "hq-exclusive", items: [{ ko: "뚜레쥬르 로고 케이크 박스·빵 봉투·쇼핑백·리본·생일 캔들", en: "TLJ-logo cake boxes, bread bags, shopping bags, ribbons, candles" }], note: { ko: "모든 브랜드 포장재는 본사 디자인 — 외부 매입 금지", en: "All branded packaging is HQ-designed — external purchase prohibited" } },
    { category: { ko: "제빵 장비·POS·인테리어", en: "Baking equipment, POS & interior" }, type: "hq-designated", items: [{ ko: "본사 지정 오븐·발효기·쇼케이스·POS·인테리어", en: "HQ-designated oven, proofer, showcase, POS, interior" }] },
    { category: { ko: "유니폼·앞치마·모자", en: "Uniform, apron, cap" }, type: "hq-designated", items: [{ ko: "뚜레쥬르 공식 유니폼·앞치마·모자 — 본사 지정 업체", en: "Official TLJ uniform/apron/cap from designated vendor" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cleaning cloth, gloves, trash bags, paper towels" }], note: { ko: "뚜레쥬르 로고가 없는 일반 위생·청소용품만 자유 구매 가능", en: "Only non-branded generic supplies are free-purchase" } },
  ],
  // ── Group B: Remaining food brands ──
  "bhc": [
    { category: { ko: "닭고기·소스·파우더", en: "Chicken, sauce, powder" }, type: "hq-exclusive", items: [{ ko: "다이닝브랜드그룹 물류 직배송 (국내산 닭)", en: "Dining Brands Group logistics direct (domestic chicken)" }], note: { ko: "뿌링클 파우더·소스 등 시그니처 메뉴 재료 본사 독점. 포장재도 본사 공급", en: "Ppurinkle powder/sauce HQ exclusive. Packaging also HQ-supplied" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기·인테리어 본사 시공", en: "Fryer, HQ interior build" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·위생용품", en: "Detergent, gloves, hygiene" }] },
  ],
  "goobne": [
    { category: { ko: "닭고기·소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "오븐구이용 염지 닭 + 전용 소스 본사 공급", en: "Oven-roast marinated chicken + exclusive sauce HQ supply" }], note: { ko: "굽네 시그니처 오븐 조리 — 전용 오븐 사양 필수", en: "Goobne signature oven cooking — dedicated oven spec required" } },
    { category: { ko: "오븐·장비", en: "Oven & equipment" }, type: "hq-designated", items: [{ ko: "굽네 전용 오븐·인테리어", en: "Goobne dedicated oven, interior" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·위생용품", en: "Detergent, gloves, hygiene" }] },
  ],
  "60gye-chicken": [
    { category: { ko: "닭고기·소스·파우더", en: "Chicken, sauce, powder" }, type: "hq-exclusive", items: [{ ko: "장스푸드 본사 물류 공급 (9호 닭 사용)", en: "Jangs Food HQ logistics (size 9 chicken)" }] },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 박스·봉투", en: "Branded boxes/bags" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑", en: "Detergent, gloves" }] },
  ],
  "dominos": [
    { category: { ko: "도우·토핑·치즈", en: "Dough, topping, cheese" }, type: "hq-exclusive", items: [{ ko: "도미노 전용 도우·소스·치즈 본사 물류", en: "Domino's exclusive dough/sauce/cheese HQ logistics" }], note: { ko: "글로벌 표준 레시피, 30분 배달 보장 시스템", en: "Global standard recipe, 30-min delivery guarantee" } },
    { category: { ko: "오븐·장비", en: "Oven & equipment" }, type: "hq-designated", items: [{ ko: "컨베이어 오븐·POS·배달 시스템", en: "Conveyor oven, POS, delivery system" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·위생용품", en: "Detergent, hygiene" }] },
  ],
  "nene-chicken": [
    { category: { ko: "닭고기·소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "스노윙 파우더·반반 소스 등 본사 공급 (10호 닭)", en: "Snowing powder, half-half sauce HQ supply (size 10)" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기·인테리어", en: "Fryer, interior" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·위생용품", en: "Detergent, gloves, hygiene" }] },
  ],
  "hosik-chicken": [
    { category: { ko: "닭고기·소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "두마리 전용 9호 닭 + 양념 소스 본사 공급", en: "Two-chicken size 9 + seasoning sauce HQ supply" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기", en: "Fryer" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑·포장지", en: "Detergent, gloves, wrapping" }] },
  ],
  "norang-tongdak": [
    { category: { ko: "닭고기·기름", en: "Chicken & oil" }, type: "hq-exclusive", items: [{ ko: "가마솥 튀김용 12호 닭 + 전용 기름 본사 공급", en: "Iron pot frying size 12 chicken + exclusive oil HQ supply" }], note: { ko: "노랑통닭은 12호 닭 사용 — 업계 최대 크기", en: "Norang uses size 12 — largest in industry" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "가마솥 튀김기 3대 (본사 사양)", en: "3 iron pot fryers (HQ spec)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·장갑", en: "Detergent, gloves" }] },
  ],
  "hongkong-banjum": [
    { category: { ko: "핵심 소스·식재료", en: "Core sauce & ingredients" }, type: "hq-exclusive", items: [{ ko: "더본코리아 통합 물류 (짬뽕 육수·짜장 소스 등)", en: "The Born Korea logistics (jjamppong broth, jjajang sauce)" }], note: { ko: "웍 자동 로봇 도입으로 주방 운영 간소화, 메뉴 집중화로 품질 극대화", en: "Wok auto-robot for simplified kitchen, menu focus for max quality" } },
    { category: { ko: "장비·인테리어", en: "Equipment & interior" }, type: "hq-designated", items: [{ ko: "웍 로봇·주방설비·인테리어 본사 시공", en: "Wok robot, kitchen, HQ interior" }] },
    { category: { ko: "야채·부재료", en: "Vegetables & sub-materials" }, type: "free-purchase", items: [{ ko: "현지 구매 가능 신선 식재료", en: "Locally purchasable fresh ingredients" }] },
  ],
  "new-maeul": [
    { category: { ko: "핵심 소스·양념", en: "Core sauce & seasoning" }, type: "hq-exclusive", items: [{ ko: "더본코리아 통합 물류 (열탄불고기 소스·7분 돼지김치 양념 등)", en: "The Born Korea logistics (bulgogi sauce, pork kimchi seasoning)" }] },
    { category: { ko: "인테리어", en: "Interior" }, type: "hq-designated", items: [{ ko: "새마을식당 콘셉트 인테리어 본사 시공", en: "Saemaeul concept interior HQ build" }] },
    { category: { ko: "식재료·주류", en: "Ingredients & alcohol" }, type: "free-purchase", items: [{ ko: "쌀·야채·주류 등 현지 구매", en: "Rice, vegetables, alcohol — local purchase" }] },
  ],
  "yeokjeon-udon": [
    { category: { ko: "육수·면·소스", en: "Broth, noodle, sauce" }, type: "hq-exclusive", items: [{ ko: "더본코리아 통합 물류 (특제 육수팩·우동면)", en: "The Born Korea logistics (special broth pack, udon noodle)" }] },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "주방기물 (3천만원 장기렌탈 가능)", en: "Kitchen equipment (30M long-term rental available)" }] },
    { category: { ko: "부재료", en: "Sub-materials" }, type: "free-purchase", items: [{ ko: "야채·계란 등 현지 구매", en: "Vegetables, eggs — local purchase" }] },
  ],
  "yupdduk": [
    { category: { ko: "떡·소스·분말", en: "Rice cake, sauce, powder" }, type: "hq-exclusive", items: [{ ko: "엽기 전용 고추장 소스·떡·분말 본사 공급", en: "Yupdduk exclusive gochujang sauce/rice cake/powder HQ supply" }], note: { ko: "로열티 44만원/월, 초도 식자재 약 800만원 별도", en: "Royalty 440K/mo, initial ingredients ~8M separate" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "인덕션·POS·키오스크", en: "Induction, POS, kiosk" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "야채·계란·세제", en: "Vegetables, eggs, detergent" }] },
  ],
  "sinjeon": [
    { category: { ko: "떡·소스", en: "Rice cake & sauce" }, type: "hq-exclusive", items: [{ ko: "신전 전용 떡볶이 소스·떡 본사 공급", en: "Sinjeon exclusive tteokbokki sauce/rice cake HQ supply" }], note: { ko: "로열티 없음 — 식재료 납품 마진 구조", en: "No royalty — ingredient supply margin structure" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "조리 설비·POS", en: "Cooking equipment, POS" }] },
    { category: { ko: "소모품·부재료", en: "Consumables & sub-materials" }, type: "free-purchase", items: [{ ko: "야채·어묵·튀김·세제", en: "Vegetables, fish cake, fried, detergent" }] },
  ],
  // ── Group C+D: Remaining brands (beauty, fitness, education, pet, living, space) ──
  "juno-hair": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "hq-designated", items: [{ ko: "본사 지정 염색제·펌제·트리트먼트", en: "HQ-designated color, perm, treatment" }], note: { ko: "블랙스톤 인수 후 글로벌 공급망 확대 중, 디자이너 채용·교육 본사 지원", en: "Expanding global supply after Blackstone acquisition, HQ designer support" } },
    { category: { ko: "장비·가구", en: "Equipment & furniture" }, type: "hq-designated", items: [{ ko: "시술 의자·샴푸대·인테리어 (프리미엄 사양)", en: "Styling chair, shampoo unit, interior (premium spec)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·케이프·장갑·세제", en: "Towels, capes, gloves, detergent" }] },
  ],
  "cleantopia": [
    { category: { ko: "세탁기·건조기", en: "Washer & dryer" }, type: "hq-designated", items: [{ ko: "세탁기·건조기 각 3대 (본사 사양, 7,348만원)", en: "3 washers + 3 dryers (HQ spec, 73.48M)" }], note: { ko: "로열티 0원 — 세탁 물량 수수료 구조. POS 무상대여, 초도물품 무상대여", en: "Zero royalty — laundry volume fee. Free POS/initial supplies rental" } },
    { category: { ko: "부대 설비", en: "Auxiliary equipment" }, type: "hq-designated", items: [{ ko: "스마트락커·키오스크·세제자동투입기", en: "Smart locker, kiosk, auto detergent dispenser" }] },
    { category: { ko: "세제·소모품", en: "Detergent & consumables" }, type: "free-purchase", items: [{ ko: "세제 (자동투입기 호환 제품)", en: "Detergent (auto-dispenser compatible)" }] },
  ],
  "washnjoy": [
    { category: { ko: "코인세탁기·건조기", en: "Coin washer & dryer" }, type: "hq-designated", items: [{ ko: "워시엔조이 지정 세탁·건조 장비", en: "WashEnJoy designated wash/dry equipment" }], note: { ko: "가맹비·로열티 0원 — 장비 구매 수익 구조. 완전 무인 운영", en: "Zero fee/royalty — equipment purchase model. Fully unmanned" } },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·섬유유연제 (자판기용)", en: "Detergent, fabric softener (for vending)" }] },
  ],
  // ── Remaining 25 brands ──
  "kimbap-cheonguk": [
    { category: { ko: "식재료 전체", en: "All ingredients" }, type: "free-purchase", items: [{ ko: "점포별 자율 구매 (인근 식자재마트·도매시장)", en: "Store-level free purchase (nearby wholesale/market)" }], note: { ko: "단일 본사 강제력 없음 — 점포별 식재료 품질·원산지 상이. 자율성이 높은 대신 본사 물류 지원 없음", en: "No single HQ enforcement — quality varies by store. High autonomy but no HQ logistics" } },
    { category: { ko: "간판", en: "Signage" }, type: "hq-designated", items: [{ ko: "김밥천국 간판 (상표 사용)", en: "Kimbap Cheonguk signage (trademark use)" }] },
  ],
  "bonjuk": [
    { category: { ko: "죽 재료·소스", en: "Porridge ingredients & sauce" }, type: "hq-exclusive", items: [{ ko: "본아이에프 본사 공급 (전용 죽 베이스·양념)", en: "Bonif HQ supply (exclusive porridge base/seasoning)" }], note: { ko: "조리 교육 3주 필수 이수, 본죽&비빔밥 복합 모델 가능", en: "3-week cooking training mandatory, Bonjuk & Bibimbap combo available" } },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 용기·포장", en: "Brand containers/packaging" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·쌀·해산물 등", en: "Vegetables, rice, seafood" }] },
  ],
  "hansot-lunchbox": [
    { category: { ko: "핵심 식재료", en: "Core ingredients" }, type: "hq-exclusive", items: [{ ko: "한솥 본사 식자재 공급 (김치: 해남·평창산 배추, 불고기: 호주산 S급 목심)", en: "Hansot HQ supply (kimchi: Korean cabbage, bulgogi: Australian S-grade)" }], note: { ko: "로열티 0원 — 원재료 납품 마진 구조. HACCP 인증 가공장 생산, 이력추적 가능", en: "Zero royalty — ingredient margin model. HACCP-certified, traceable" } },
    { category: { ko: "장비·POS", en: "Equipment & POS" }, type: "hq-designated", items: [{ ko: "주방장비·POS 본사 사양", en: "Kitchen equipment, POS HQ spec" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "세제·위생용품", en: "Detergent, hygiene" }] },
  ],
  "salady": [
    { category: { ko: "샐러드 재료·드레싱", en: "Salad ingredients & dressing" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 드레싱·토핑 공급", en: "HQ recipe dressing/topping supply" }] },
    { category: { ko: "신선 채소", en: "Fresh vegetables" }, type: "free-purchase", items: [{ ko: "채소·과일 현지 구매 (신선도 관리 핵심)", en: "Vegetables/fruit local purchase (freshness critical)" }], note: { ko: "식재료 신선도 관리가 핵심 — 오피스 상권 필수", en: "Freshness management is key — office district essential" } },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 용기·봉투", en: "Brand containers/bags" }] },
  ],
  "rolling-pasta": [
    { category: { ko: "파스타 소스·면", en: "Pasta sauce & noodles" }, type: "hq-exclusive", items: [{ ko: "더본코리아 통합 물류 공급 (소스·면·토핑)", en: "The Born integrated supply (sauce, noodles, toppings)" }], note: { ko: "더본코리아 계열 — 백종원 레시피 기반. 배달 비중 높아 포장재 소모 많음", en: "The Born brand — Baek Jongwon recipes. High delivery = high packaging use" } },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 전용 배달 용기·봉투", en: "Brand delivery containers/bags" }] },
    { category: { ko: "부자재", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·치즈 등 신선재료", en: "Vegetables, cheese, fresh ingredients" }] },
  ],
  "pasta-eyo": [
    { category: { ko: "핵심 식재료", en: "Core ingredients" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 소스·면 공급", en: "HQ recipe sauce & noodle supply" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·해산물·치즈 현지 구매", en: "Vegetables, seafood, cheese local purchase" }] },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 전용 용기", en: "Brand containers" }] },
  ],
  "pasta-ibnida": [
    { category: { ko: "면·소스", en: "Noodles & sauce" }, type: "hq-exclusive", items: [{ ko: "본사 통일 레시피 소스·면 공급", en: "HQ unified recipe sauce & noodle supply" }], note: { ko: "배달 전문 모델 — 조리 난이도 낮음, 1인 운영 가능", en: "Delivery-focused — easy cooking, solo-operation possible" } },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "배달 전용 용기·봉투", en: "Delivery containers/bags" }] },
  ],
  "pasta-jibiya": [
    { category: { ko: "핵심 식재료", en: "Core ingredients" }, type: "hq-exclusive", items: [{ ko: "본사 소스·리조또 베이스 공급", en: "HQ sauce & risotto base supply" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·육류·치즈", en: "Vegetables, meat, cheese" }] },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 용기", en: "Brand containers" }] },
  ],
  "tutti-cucina": [
    { category: { ko: "핵심 식재료", en: "Core ingredients" }, type: "hq-exclusive", items: [{ ko: "피자 도우·파스타 소스·토핑 본사 공급", en: "Pizza dough, pasta sauce, toppings HQ supply" }], note: { ko: "피자+파스타 듀얼 메뉴 — 30평+ 중대형 매장 필수. 가족형 외식 타겟", en: "Pizza+pasta dual — 30+ pyeong required. Family dining target" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "피자 오븐·파스타 쿠커 본사 사양", en: "Pizza oven, pasta cooker HQ spec" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·음료", en: "Vegetables, beverages" }] },
  ],
  "pasta-bilrun": [
    { category: { ko: "면·소스", en: "Noodles & sauce" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 소스·면 패키지", en: "HQ recipe sauce & noodle package" }], note: { ko: "배달 전문 초저가 모델 — 공유주방 가능, 1인 운영 최적화", en: "Delivery-only ultra-low-cost — ghost kitchen OK, solo-optimized" } },
    { category: { ko: "포장재", en: "Packaging" }, type: "hq-designated", items: [{ ko: "브랜드 배달 용기", en: "Brand delivery containers" }] },
  ],
  "seven-eleven": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "코리아세븐 물류센터 자동발주", en: "Korea Seven logistics auto-order" }], note: { ko: "글로벌 표준 발주 시스템, 저효율 점포 구조조정 진행 중 (2024년 978개 순감)", en: "Global standard ordering, low-efficiency store cleanup ongoing (978 net closures 2024)" } },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·POS·CCTV", en: "Refrigerated displays, POS, CCTV" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품", en: "Cleaning supplies" }] },
  ],
  "emart24": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "신세계그룹 SSG 물류센터 자동발주", en: "Shinsegae SSG logistics auto-order" }], note: { ko: "정액 회원비(15~60만/월) → 정률제 전환 중. SSG PB상품 접근 가능", en: "Flat fee (150K-600K/mo) transitioning to percentage. SSG PB access" } },
    { category: { ko: "매장 설비", en: "Store fixtures" }, type: "hq-designated", items: [{ ko: "냉장 진열대·POS", en: "Refrigerated displays, POS" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품", en: "Cleaning supplies" }] },
  ],
  "lian-hair": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "hq-designated", items: [{ ko: "본사 권장 염색제·펌제 (일부 자율)", en: "HQ-recommended color/perm (some flexible)" }], note: { ko: "전국 최다 가맹점(470개), 서울형 상생프랜차이즈 선정", en: "Largest network (470), Seoul-type coexistence franchise" } },
    { category: { ko: "장비·가구", en: "Equipment & furniture" }, type: "hq-designated", items: [{ ko: "시술 의자·샴푸대·인테리어", en: "Styling chair, shampoo unit, interior" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·케이프·세제", en: "Towels, capes, detergent" }] },
  ],
  "blue-club": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "free-purchase", items: [{ ko: "이발 용품 자유 구매 (남성 커트 전문)", en: "Barber supplies free purchase (men's cut specialist)" }], note: { ko: "남성 전문 — 커트 위주 단순 운영, 1인 운영 가능", en: "Men-only — simple cut-focused, solo operation viable" } },
    { category: { ko: "인테리어", en: "Interior" }, type: "hq-designated", items: [{ ko: "블루클럽 표준 인테리어", en: "Blue Club standard interior" }] },
  ],
  "anytime-fitness": [
    { category: { ko: "운동 기구", en: "Fitness equipment" }, type: "hq-designated", items: [{ ko: "본사 글로벌 표준 사양 (Life Fitness·Precor 등)", en: "HQ global standard spec (Life Fitness, Precor, etc.)" }], note: { ko: "글로벌 회원 상호 이용 — 전 세계 동일 장비 사양 필수. 최소 100평 이상", en: "Global member reciprocal use — worldwide identical equipment required. Min 100+ pyeong" } },
    { category: { ko: "출입·보안 시스템", en: "Access & security" }, type: "hq-designated", items: [{ ko: "24시간 무인 출입 시스템·CCTV", en: "24h unmanned access system, CCTV" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·세제·음료자판기", en: "Towels, detergent, beverage vending" }] },
  ],
  "curves": [
    { category: { ko: "유압식 운동기구", en: "Hydraulic equipment" }, type: "hq-designated", items: [{ ko: "커브스 전용 유압식 순환운동 기구 세트", en: "Curves exclusive hydraulic circuit training set" }], note: { ko: "여성 전용 — 유압식으로 부상 위험 낮음. 30분 순환운동 전용 기구", en: "Women-only — hydraulic for low injury risk. 30-min circuit dedicated equipment" } },
    { category: { ko: "운영 매뉴얼", en: "Operations manual" }, type: "hq-exclusive", items: [{ ko: "본사 체계적 운영 매뉴얼·프로그램", en: "HQ systematic operations manual/program" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·세제·음료", en: "Towels, detergent, beverages" }] },
  ],
  "noonnoppi": [
    { category: { ko: "교재·학습지", en: "Textbooks & worksheets" }, type: "hq-exclusive", items: [{ ko: "대교 본사 100% 자체 제작 교재 공급", en: "Daekyo HQ 100% in-house textbook supply" }], note: { ko: "방문학습 — 별도 매장 불필요. 대교그룹 1976년 설립, 20년 연속 교육브랜드 대상", en: "Home-visit — no store needed. Daekyo Group est. 1976, 20-year consecutive education brand award" } },
    { category: { ko: "디지털 학습 도구", en: "Digital learning tools" }, type: "hq-exclusive", items: [{ ko: "눈높이 러닝센터 태블릿·앱", en: "Noonnoppi Learning Center tablet/app" }] },
  ],
  "kumon": [
    { category: { ko: "교재·프린트", en: "Textbooks & worksheets" }, type: "hq-exclusive", items: [{ ko: "교원구몬 본사 100% 자체 제작 학습지 공급", en: "Kyowon Kumon HQ 100% in-house worksheet supply" }], note: { ko: "글로벌 자기주도학습 프로그램, 50개국 진출. 교실형 소규모 운영 가능", en: "Global self-paced learning, 50 countries. Small classroom operation viable" } },
  ],
  "polypark": [
    { category: { ko: "반려동물 용품·간식", en: "Pet supplies & treats" }, type: "hq-designated", items: [{ ko: "본사 지정 용품·간식 브랜드 (일부 자유)", en: "HQ-designated supplies/treat brands (some free)" }], note: { ko: "반려동물 시장 연 15% 성장, 용품+간식+미용 복합 모델", en: "Pet market ~15% annual growth, supplies+treats+grooming combo" } },
    { category: { ko: "미용 장비", en: "Grooming equipment" }, type: "hq-designated", items: [{ ko: "미용 테이블·드라이어·클리퍼", en: "Grooming table, dryer, clipper" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "위생용품·청소도구", en: "Hygiene, cleaning tools" }] },
  ],
  "petmart": [
    { category: { ko: "반려동물 용품·사료", en: "Pet supplies & food" }, type: "hq-exclusive", items: [{ ko: "펫마트 본사 물류 일괄 공급 (100평 대형 매장)", en: "PetMart HQ logistics bulk supply (100-pyeong large store)" }], note: { ko: "점당 매출 5.25억으로 펫 업계 최고, 용품+식품+미용+호텔 복합 모델", en: "5.25B per-store — highest in pet, supplies+food+grooming+hotel combo" } },
    { category: { ko: "미용·호텔 설비", en: "Grooming & hotel facilities" }, type: "hq-designated", items: [{ ko: "미용실·호텔 설비 본사 사양", en: "Grooming/hotel facilities HQ spec" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "위생용품", en: "Hygiene supplies" }] },
  ],
  "toz-study": [
    { category: { ko: "스터디룸 시스템", en: "Study room system" }, type: "hq-designated", items: [{ ko: "토즈 예약·결제 시스템 + 좌석 관리", en: "Toz reservation/payment system + seat management" }] },
    { category: { ko: "인테리어·가구", en: "Interior & furniture" }, type: "hq-designated", items: [{ ko: "스터디룸+카페 복합 인테리어 (대학가·오피스 최적)", en: "Study room + cafe hybrid interior (university/office optimal)" }] },
    { category: { ko: "커피·음료", en: "Coffee & beverages" }, type: "free-purchase", items: [{ ko: "카페 메뉴 자율 구성 가능", en: "Cafe menu freely configurable" }] },
  ],
  "misoya": [
    { category: { ko: "소스·육수·면", en: "Sauce, broth, noodle" }, type: "hq-exclusive", items: [{ ko: "미소야 전용 돈까스 소스·우동 육수·소바 면 본사 공급", en: "Misoya exclusive tonkatsu sauce, udon broth, soba noodle HQ supply" }], note: { ko: "190개 가맹점, 점당 매출 3.6억. 간단 조리 — 주방 인력 최소화", en: "190 stores, 3.6B per-store. Simple cooking — min labor" } },
    { category: { ko: "장비", en: "Equipment" }, type: "hq-designated", items: [{ ko: "튀김기·면 삶는 기계 본사 사양", en: "Fryer, noodle cooker HQ spec" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·쌀·세제", en: "Vegetables, rice, detergent" }] },
  ],
  "keunmal-halmae": [
    { category: { ko: "육수·순대", en: "Broth & sundae" }, type: "hq-exclusive", items: [{ ko: "본사 육수 팩·순대 직배송", en: "HQ broth pack/sundae direct delivery" }], note: { ko: "순대국밥 전문 — 본사 육수 팩으로 맛 일관성 유지", en: "Sundae soup specialist — HQ broth pack for taste consistency" } },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·양념·쌀", en: "Vegetables, seasoning, rice" }] },
  ],
  "hyundaeok": [
    { category: { ko: "국밥 육수·소스", en: "Soup broth & sauce" }, type: "hq-exclusive", items: [{ ko: "현대옥 전용 콩나물국밥 육수 본사 직배송", en: "Hyundae Ok exclusive bean sprout soup broth HQ delivery" }], note: { ko: "전주 콩나물국밥 원조 35년 전통. 관광지·출장 상권 최적", en: "35-year Jeonju tradition. Tourist/business districts optimal" } },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "콩나물·쌀·반찬 재료", en: "Bean sprouts, rice, side dish ingredients" }] },
  ],
  "dookki": [
    { category: { ko: "떡볶이 소스·재료", en: "Tteokbokki sauce & ingredients" }, type: "hq-exclusive", items: [{ ko: "두끼 전용 떡볶이 소스·떡·라면 본사 공급", en: "Dookki exclusive sauce/rice cake/ramen HQ supply" }], note: { ko: "무한리필 뷔페 콘셉트 — 홀 필수 (20평+). 젊은 층 타겟", en: "Unlimited buffet concept — dine-in required (20+pyeong). Youth target" } },
    { category: { ko: "뷔페 설비", en: "Buffet equipment" }, type: "hq-designated", items: [{ ko: "뷔페 진열대·인덕션·인테리어", en: "Buffet display, induction, interior" }] },
    { category: { ko: "부재료", en: "Sub-ingredients" }, type: "free-purchase", items: [{ ko: "야채·김밥 재료·음료", en: "Vegetables, kimbap ingredients, beverages" }] },
  ],
  "park-seungchul": [
    { category: { ko: "시술 제품", en: "Treatment products" }, type: "hq-designated", items: [{ ko: "본사 지정 염색제·펌제·트리트먼트", en: "HQ-designated color, perm, treatment" }] },
    { category: { ko: "장비·가구", en: "Equipment & furniture" }, type: "hq-designated", items: [{ ko: "시술 의자·샴푸대·인테리어 (30평+ 권장)", en: "Styling chair, shampoo unit, interior (30+ pyeong)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "타월·케이프·장갑·세제", en: "Towels, capes, gloves, detergent" }] },
  ],
  "golden-nail": [
    { category: { ko: "네일 젤·재료", en: "Nail gel & materials" }, type: "hq-designated", items: [{ ko: "본사 지정 젤·아트 재료", en: "HQ-designated gel/art materials" }] },
    { category: { ko: "인테리어", en: "Interior" }, type: "hq-designated", items: [{ ko: "골든네일 표준 인테리어 (5평~ 소규모)", en: "Golden Nail standard interior (5+ pyeong small)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "리무버·코튼·위생용품", en: "Remover, cotton, hygiene" }] },
  ],
  "yuhu-nail": [
    { category: { ko: "네일 제품", en: "Nail products" }, type: "hq-designated", items: [{ ko: "본사 교육 프로그램 연계 지정 제품", en: "HQ training-linked designated products" }], note: { ko: "프리미엄 네일 서비스, 예약제 운영 — 안정적 매출", en: "Premium nail, reservation-based — stable revenue" } },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "리무버·코튼·위생용품", en: "Remover, cotton, hygiene" }] },
  ],
  "seldog24-study": [
    { category: { ko: "좌석 관리 시스템", en: "Seat management system" }, type: "hq-designated", items: [{ ko: "셀독24 IoT 좌석 관리 + 무인 결제", en: "Seldog24 IoT seat management + unmanned payment" }] },
    { category: { ko: "인테리어", en: "Interior" }, type: "hq-designated", items: [{ ko: "본사 표준 인테리어 (40평~)", en: "HQ standard interior (40+ pyeong)" }] },
    { category: { ko: "커피머신", en: "Coffee machine" }, type: "free-purchase", items: [{ ko: "무인 커피머신·자판기", en: "Unmanned coffee machine, vending" }] },
  ],
  "seven-star-coin": [
    { category: { ko: "노래방 기기", en: "Noraebang equipment" }, type: "hq-designated", items: [{ ko: "노래방 기기 (금영·TJ) + 코인 결제 시스템", en: "Noraebang machine (Kumyoung/TJ) + coin payment system" }], note: { ko: "코인노래방 가맹점 수 1위 (320개). 24시간 무인 운영, MZ세대 타겟", en: "#1 coin noraebang by count (320). 24h unmanned, MZ generation target" } },
    { category: { ko: "인테리어·방음", en: "Interior & soundproofing" }, type: "hq-designated", items: [{ ko: "방음 시공·인테리어 본사 사양", en: "Soundproofing, interior HQ spec" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "마이크 커버·청소용품", en: "Mic covers, cleaning supplies" }] },
  ],
  "zaksim-study": [
    { category: { ko: "좌석 관리 시스템", en: "Seat management system" }, type: "hq-designated", items: [{ ko: "작심 중앙관제 + IoT 좌석 시스템", en: "Zaksim central control + IoT seat system" }], note: { ko: "무인 운영 — 중앙관제 시스템으로 고객 문의·결제 오류 원격 대응", en: "Unmanned — central control for remote customer/payment support" } },
    { category: { ko: "인테리어·가구", en: "Interior & furniture" }, type: "hq-designated", items: [{ ko: "본사 표준 인테리어 (60평+ 권장)", en: "HQ standard interior (60+ pyeong recommended)" }] },
    { category: { ko: "커피머신·자판기", en: "Coffee machine & vending" }, type: "free-purchase", items: [{ ko: "무인 커피머신·자판기 (작심커피 연동 가능)", en: "Unmanned coffee machine, vending (Zaksim Coffee linkable)" }] },
  ],
  // ── 2026-06 추가 조사: 전국 대형 QSR·커피·리테일 (FTC·물류 구조 기반) ──
  "lotteria": [
    { category: { ko: "번·패티·식자재", en: "Bun, patty, ingredients" }, type: "hq-exclusive", items: [{ ko: "롯데GRS 통합 물류 직배송 — 패티·소스·식자재", en: "Lotte GRS unified logistics — patty, sauce, ingredients" }], note: { ko: "햄버거 번은 1979년부터 샤니(SPC삼립) 납품, 식자재는 롯데GRS 물류센터 정기 배송", en: "Buns supplied by Shany (SPC Samlip) since 1979; ingredients via Lotte GRS logistics" } },
    { category: { ko: "소스·시즈닝", en: "Sauce & seasoning" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 전용 소스·시즈닝 — 메뉴 표준화 핵심", en: "HQ-recipe exclusive sauce/seasoning — menu standardization" }] },
    { category: { ko: "장비·POS·키오스크", en: "Equipment, POS, kiosk" }, type: "hq-designated", items: [{ ko: "튀김기·그릴·POS·키오스크 (본사 사양)", en: "Fryer, grill, POS, kiosk (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cloth, gloves, trash bags, paper towels" }] },
  ],
  "burger-king-kr": [
    { category: { ko: "번·패티·식자재", en: "Bun, patty, ingredients" }, type: "hq-exclusive", items: [{ ko: "삼립GFS 3자물류(3PL) 통합 배송 — 냉동·냉장·상온 일 3회", en: "Samlip GFS 3PL unified delivery — frozen/chilled/ambient 3x/day" }], note: { ko: "전국 250+ 점포 대상 24개 배송센터·1,400여 냉동차량. 와퍼 번은 삼립(SPC) 공급, 2026년 롯데웰푸드 등 공급사 다변화 진행", en: "24 centers, 1,400+ trucks for 250+ stores. Whopper buns from Samlip (SPC); supplier diversification (Lotte Wellfood) underway 2026" } },
    { category: { ko: "와퍼 소스·패티", en: "Whopper sauce & patty" }, type: "hq-exclusive", items: [{ ko: "직화 패티·전용 소스 본사 공급 — 브랜드 맛 보장", en: "Flame-grilled patty, exclusive sauce HQ supply" }] },
    { category: { ko: "장비·POS·키오스크", en: "Equipment, POS, kiosk" }, type: "hq-designated", items: [{ ko: "브로일러·POS·키오스크 (본사 사양)", en: "Broiler, POS, kiosk (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cloth, gloves, trash bags, paper towels" }] },
  ],
  "kfc-korea": [
    { category: { ko: "닭고기·치킨 파우더·소스", en: "Chicken, batter, sauce" }, type: "hq-exclusive", items: [{ ko: "본사 물류 직공급 — 염지 닭·전용 튀김 파우더·오리지널 시즈닝", en: "HQ logistics — marinated chicken, exclusive batter, original seasoning" }], note: { ko: "2024년 4월 가맹 1호점(문정역) 시작한 신생 가맹 모델. 2026년 칼라일 인수 — 본사 매각 이력상 로열티·물류 마진 정책 변동 가능, 정보공개서 사전 확인 필수", en: "Franchise model launched Apr 2024 (Munjeong). Carlyle acquired 2026 — royalty/logistics-margin policy may shift; review disclosure first" } },
    { category: { ko: "장비·POS·키오스크", en: "Equipment, POS, kiosk" }, type: "hq-designated", items: [{ ko: "압력 튀김기·POS·키오스크 (본사 사양)", en: "Pressure fryer, POS, kiosk (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cloth, gloves, trash bags, paper towels" }] },
  ],
  "dunkin": [
    { category: { ko: "도넛·생지·식재료", en: "Donut, dough, ingredients" }, type: "hq-exclusive", items: [{ ko: "SPC 비알코리아 통합 공급 — DD음성·부산물류센터, DD안양공장 + 허브키친(수제도넛 제조기지) 인근 점포 배송", en: "SPC BR Korea — DD Eumseong/Busan centers, Anyang plant + Hub Kitchen (handmade donut base) local delivery" }], note: { ko: "프리미엄 수제도넛은 허브키친(성남 사송·부산) 반경 15km 내 점포 공급. SPC GFS 물류", en: "Premium handmade donuts via Hub Kitchens within 15km radius; SPC GFS logistics" } },
    { category: { ko: "원두·시럽·파우더", en: "Beans, syrup, powder" }, type: "hq-exclusive", items: [{ ko: "비알코리아 공급 — 음료 메뉴 표준화", en: "BR Korea supply — beverage standardization" }] },
    { category: { ko: "던킨 브랜드 일회용품", en: "Dunkin-branded disposables" }, type: "hq-designated", items: [{ ko: "던킨 로고 컵·박스·캐리어·종이가방", en: "Dunkin-logo cups, boxes, carriers, paper bags" }] },
    { category: { ko: "장비·POS·인테리어", en: "Equipment, POS, interior" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·쇼케이스·POS·인테리어 본사 사양", en: "Espresso machine, showcase, POS, interior HQ spec" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cloth, gloves, trash bags, paper towels" }] },
  ],
  "hollys": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "KG에프앤비 자체 로스팅 — 파주 문산 '커피클럽 로스팅센터'(연 1,700톤)", en: "KG F&B in-house roasting — Paju 'Coffee Club Roasting Center' (1,700t/yr)" }], note: { ko: "연 1,700톤(에스프레소 약 1억 잔) 규모 자체 로스팅·물류로 안정 공급", en: "1,700t/yr (~100M shots) in-house roasting & logistics" } },
    { category: { ko: "시럽·파우더·원부자재", en: "Syrup, powder, materials" }, type: "hq-exclusive", items: [{ ko: "B2B 전용 원두·카페 원부자재 본사 공급", en: "B2B beans & cafe materials HQ supply" }] },
    { category: { ko: "할리스 브랜드 일회용품", en: "Hollys-branded disposables" }, type: "hq-designated", items: [{ ko: "할리스 로고 컵·홀더·캐리어·테이크아웃 박스", en: "Hollys-logo cups, sleeves, carriers, boxes" }] },
    { category: { ko: "장비·POS·인테리어", en: "Equipment, POS, interior" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·제빙기·POS·인테리어 본사 사양", en: "Espresso machine, ice maker, POS, interior HQ spec" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cloth, gloves, trash bags, paper towels" }] },
  ],
  "gongcha": [
    { category: { ko: "차·펄·토핑·파우더", en: "Tea, pearls, topping, powder" }, type: "hq-exclusive", items: [{ ko: "공차코리아 본사 표준 원료 — 찻잎·타피오카 펄·토핑·밀크티 파우더", en: "Gongcha Korea standard ingredients — tea, tapioca pearls, toppings, milk tea powder" }], note: { ko: "글로벌 밀크티 맛 표준화를 위해 본사 지정 원료 공급(직영 60·가맹 800여 점)", en: "HQ-designated ingredients for global milk-tea consistency (60 direct, 800+ franchise)" } },
    { category: { ko: "공차 브랜드 일회용품", en: "Gongcha-branded disposables" }, type: "hq-designated", items: [{ ko: "공차 로고 컵·실링 필름·빨대·캐리어", en: "Gongcha-logo cups, sealing film, straws, carriers" }] },
    { category: { ko: "장비·POS", en: "Equipment & POS" }, type: "hq-designated", items: [{ ko: "실링기·제빙기·정수 시스템·POS (본사 사양)", en: "Sealing machine, ice maker, water system, POS (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품 (로고 無)", en: "Generic hygiene (no logo)" }, type: "free-purchase", items: [{ ko: "주방세제·청소포·고무장갑·쓰레기봉투·페이퍼타올", en: "Dish soap, cloth, gloves, trash bags, paper towels" }] },
  ],
  "daiso": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "아성다이소 자체 물류망 본사 일괄 공급 (용인 남사·부산·안성 + 세종·양주 신규)", en: "Asung Daiso in-house logistics — HQ bulk supply (Yongin, Busan, Anseong + new Sejong, Yangju)" }], note: { ko: "1,000~5,000원 균일가. 가맹점은 본사 물류·MD에 100% 의존(자체 발주 폭 제한적) — 마진은 균일가 구조상 박리다매. 가맹 초기투자 큼", en: "Flat ₩1,000–5,000 pricing. Franchisees fully rely on HQ logistics/MD (limited self-ordering); thin-margin high-volume. High initial investment" } },
    { category: { ko: "매장 설비·POS", en: "Store fixtures & POS" }, type: "hq-designated", items: [{ ko: "진열 집기·POS·CCTV (본사 표준)", en: "Display fixtures, POS, CCTV (HQ standard)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "청소용품·봉투", en: "Cleaning supplies, bags" }] },
  ],
  "olive-young": [
    { category: { ko: "전체 상품", en: "All products" }, type: "hq-exclusive", items: [{ ko: "CJ올리브영 물류 직공급 — 양지센터(수도권)·경산센터(영남·제주·충청·호남 600+점)", en: "CJ Olive Young logistics — Yangji (metro) + Gyeongsan (Yeongnam/Jeju/Chungcheong/Honam 600+ stores)" }], note: { ko: "경산센터 90% 자동화(AMR·로봇 피킹). 구매 패턴·재고 분석 기반 데이터 자동발주 — 본사 MD가 상품 구성 주도", en: "Gyeongsan 90% automated (AMR, robotic picking). Data-driven auto-ordering; HQ MD drives assortment" } },
    { category: { ko: "매장 설비·진열·POS", en: "Fixtures, display, POS" }, type: "hq-designated", items: [{ ko: "진열대·테스터존·POS·CCTV (본사 표준)", en: "Displays, tester zone, POS, CCTV (HQ standard)" }] },
    { category: { ko: "소모품", en: "Consumables" }, type: "free-purchase", items: [{ ko: "쇼핑백·청소용품", en: "Shopping bags, cleaning supplies" }] },
  ],
  // ── 2026-06 추가 조사 30개: 전국 치킨·피자·버거·한식·분식·카페 (WebSearch·공정위 검증) ──
  // 치킨
  "perikana": [
    { category: { ko: "양념소스·시즈닝", en: "Sauce & seasoning" }, type: "hq-exclusive", items: [{ ko: "본사 자체 양념소스·파우더 — 1979년 양념치킨 원조, 시판 유통할 만큼 제조 역량", en: "HQ sauce/powder — 1979 seasoned-chicken originator, retail-grade production" }] },
    { category: { ko: "닭 원육", en: "Chicken" }, type: "hq-exclusive", items: [{ ko: "본사 또는 본사 지정 계육업체 공급(업종 표준)", en: "HQ or HQ-designated poultry supplier (industry standard)" }] },
    { category: { ko: "장비·POS·포장재", en: "Equipment, POS, packaging" }, type: "hq-designated", items: [{ ko: "튀김기·POS·브랜드 박스 (본사 사양)", en: "Fryer, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "cheogapjib": [
    { category: { ko: "닭 원육·양념·원부재료", en: "Chicken, sauce, materials" }, type: "hq-exclusive", items: [{ ko: "㈜한국일오삼 본사 1차 공급 — 10호닭·순살·양념소스", en: "Korea153 HQ primary supply — size-10 chicken, boneless, sauce" }], note: { ko: "본사→지역지사→가맹점 다단계 유통. 차액가맹금이 본사·지사 2중 부과되고 지역별 납품가 격차 보도. 2026년 점주협의회 공정위 신고 — 지사계약·정보공개서 면밀 확인", en: "HQ→regional sub-HQ→store multi-tier. Double supply mark-up & regional price gaps reported; 2026 owner-association FTC complaint — review sub-HQ contract & disclosure" } },
    { category: { ko: "장비·POS·포장재", en: "Equipment, POS, packaging" }, type: "hq-designated", items: [{ ko: "튀김기·POS·브랜드 박스 (본사 사양)", en: "Fryer, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "mexicana": [
    { category: { ko: "양념소스·시즈닝", en: "Sauce & seasoning" }, type: "hq-exclusive", items: [{ ko: "㈜멕시카나 본사 양념소스·파우더 (1985년 안동 시작)", en: "Mexicana HQ sauce/powder (est. 1985 Andong)" }] },
    { category: { ko: "닭 원육", en: "Chicken" }, type: "hq-exclusive", items: [{ ko: "본사 지정 계육 공급", en: "HQ-designated poultry supply" }], note: { ko: "본사 물품공급 의존도 높음(매출 추정식상 ~40%). 과거 무항생제 닭 미공급 미고지 보도(2023) — 원육 소싱 확인 권장", en: "High HQ-supply dependence (~40% of sales by estimate); 2023 antibiotic-free chicken disclosure issue — verify sourcing" } },
    { category: { ko: "장비·POS·포장재", en: "Equipment, POS, packaging" }, type: "hq-designated", items: [{ ko: "튀김기·POS·브랜드 박스 (본사 사양)", en: "Fryer, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "toraeorae": [
    { category: { ko: "닭 원육·튀김유", en: "Chicken & frying oil" }, type: "hq-exclusive", items: [{ ko: "㈜농협목우촌(농협 계열) 국내산 1등급 냉장닭 + 해바라기·카놀라 혼합유", en: "Nonghyup Mokuchon (Nonghyup affiliate) domestic grade-1 chilled chicken + sunflower/canola blend oil" }], note: { ko: "농협경제지주 100% 출자 계열사 — 원육이 농협 계육 인프라와 직결", en: "100% Nonghyup-owned — chicken tied to Nonghyup poultry infrastructure" } },
    { category: { ko: "양념·소스", en: "Sauce" }, type: "hq-exclusive", items: [{ ko: "본사 레시피 양념·소스", en: "HQ-recipe sauce" }] },
    { category: { ko: "장비·POS·포장재", en: "Equipment, POS, packaging" }, type: "hq-designated", items: [{ ko: "튀김기·POS·브랜드 박스 (본사 사양)", en: "Fryer, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "puradak": [
    { category: { ko: "원육·소스·파우더", en: "Chicken, sauce, powder" }, type: "hq-exclusive", items: [{ ko: "㈜아이더스에프앤비 본사 공급 — 소스·파우더·지정 계육", en: "Idus F&B HQ supply — sauce, powder, designated chicken" }] },
    { category: { ko: "장비·POS", en: "Equipment & POS" }, type: "hq-designated", items: [{ ko: "튀김기·POS (본사 사양)", en: "Fryer, POS (HQ spec)" }] },
    { category: { ko: "POS용지·스티커 등 일반 소모품", en: "Generic consumables" }, type: "free-purchase", items: [{ ko: "영수증용지·보안스티커·라벨·세제·장갑 — 자유 구매", en: "Receipt paper, security stickers, labels, detergent, gloves — free purchase" }], note: { ko: "2018~2024년 본사가 POS용지·치킨박스 보안스티커·라벨을 지정구매 강제(위반 시 공급중단/위약금) → 2025년 공정위 '거래상대방 구속' 위법 시정명령. 통일성에 필수 아닌 품목은 자유구매가 원칙", en: "2018–2024 HQ forced exclusive purchase of receipt paper/security stickers/labels → 2025 FTC corrective order; non-essential items should be free-purchase" } },
  ],
  "kkanbu-chicken": [
    { category: { ko: "초벌 가공육·양념", en: "Pre-cooked chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "㈜깐부 본사 가공·직배송(일일배송) — 초벌육·양념", en: "Kkanbu HQ-processed daily direct delivery — pre-cooked chicken, sauce" }], note: { ko: "전국 무리한 확장 지양, 수도권 중심 직영 물류망으로 품질 통제", en: "Limits expansion; metro-focused in-house logistics for quality control" } },
    { category: { ko: "장비·POS·포장재", en: "Equipment, POS, packaging" }, type: "hq-designated", items: [{ ko: "튀김기·POS·브랜드 박스 (본사 사양)", en: "Fryer, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "ziccoba-chicken": [
    { category: { ko: "계육·양념소스", en: "Chicken & sauce" }, type: "hq-exclusive", items: [{ ko: "㈜지코바 본사 물류센터(양산+중부권) 공급 — 계육 100수당 양념 1통(22kg) 비율", en: "Ziccoba HQ centers (Yangsan+central) — sauce 22kg per 100 birds" }], note: { ko: "차액가맹금 반환소송(점주 72명) 진행. 양념-계육 비율 분쟁 중 정보공개서 사후 수정·공급중단 후 해지 절차 위반 지적 — 계약서·정보공개서 면밀 확인", en: "72-owner mark-up refund lawsuit; disclosure amended mid-dispute, contract-termination procedure issues — review carefully" } },
    { category: { ko: "장비·POS", en: "Equipment & POS" }, type: "hq-designated", items: [{ ko: "튀김기·POS (본사 사양)", en: "Fryer, POS (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  // 피자
  "pizza-hut": [
    { category: { ko: "도우·치즈·소스", en: "Dough, cheese, sauce" }, type: "hq-exclusive", items: [{ ko: "본사 중앙 공급 — 도우·치즈·소스 (Yum! 글로벌 사양, 한국 PH코리아)", en: "HQ central supply — dough, cheese, sauce (Yum! global spec, PH Korea)" }], note: { ko: "차액가맹금 분쟁 — 2026.1 대법원 본사 패소, 약 215억 반환 확정. 회생 후 PH코리아로 영업권 이전돼 공급 정책 변동 가능 — 정보공개서 확인", en: "Mark-up lawsuit — Jan 2026 Supreme Court ruled against HQ (~₩21.5B refund). Ops transferred to PH Korea post-rehabilitation; policy may change" } },
    { category: { ko: "오븐·POS·포장재", en: "Oven, POS, packaging" }, type: "hq-designated", items: [{ ko: "오븐·POS·브랜드 박스 (본사 사양)", en: "Oven, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "papa-johns": [
    { category: { ko: "치즈·도우·소스", en: "Cheese, dough, sauce" }, type: "hq-exclusive", items: [{ ko: "치즈는 미국 Leprino(세계 최대 모차렐라) 본사 직공수 + 도우·소스 본사 공급", en: "Cheese direct-imported from Leprino (US) + HQ dough/sauce" }], note: { ko: "한국파파존스(마스터 프랜차이즈). 치즈 직수입이 저가 브랜드와의 차별점", en: "Korea Papa John's (master franchise); direct cheese import differentiates vs budget brands" } },
    { category: { ko: "오븐·POS·포장재", en: "Oven, POS, packaging" }, type: "hq-designated", items: [{ ko: "오븐·POS·브랜드 박스 (본사 사양)", en: "Oven, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "mister-pizza": [
    { category: { ko: "치즈·도우·소스", en: "Cheese, dough, sauce" }, type: "hq-exclusive", items: [{ ko: "본사 공급 — 치즈·도우·소스", en: "HQ supply — cheese, dough, sauce" }], note: { ko: "과거 '치즈 통행세'(친인척 중간업체 끼움)·갑질로 전 회장 구속·공정위 과징금. 매장 전성기 1/3로 급감 — 본사 안정성·정보공개서 확인 필수", en: "Past 'cheese toll' (related-party middleman) & abuse: ex-chairman jailed, FTC fines. Stores shrank to ~1/3 — verify HQ stability & disclosure" } },
    { category: { ko: "오븐·POS·포장재", en: "Oven, POS, packaging" }, type: "hq-designated", items: [{ ko: "오븐·POS·브랜드 박스 (본사 사양)", en: "Oven, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "pizza-school": [
    { category: { ko: "도우·소스·치즈", en: "Dough, sauce, cheese" }, type: "hq-exclusive", items: [{ ko: "본사 대량계약 일괄 공급 (저가 테이크아웃 모델)", en: "HQ bulk-contract supply (budget takeout model)" }], note: { ko: "본사/피자스쿨남부(㈜씨에이치컴퍼니) 2개 법인 분리 — 가맹 지역에 따라 계약 주체 다름. 저가 표방하나 본사 영업이익률 높아 공급 마진 점검 권장", en: "Two entities (HQ + Pizza School South/CH Company) by region; high HQ margin despite budget claim — check supply markup" } },
    { category: { ko: "오븐·POS·포장재", en: "Oven, POS, packaging" }, type: "hq-designated", items: [{ ko: "오븐·POS·브랜드 박스 (본사 사양)", en: "Oven, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "pizza-maru": [
    { category: { ko: "도우(특허 웰빙도우)·치즈·소스", en: "Dough (patented), cheese, sauce" }, type: "hq-exclusive", items: [{ ko: "㈜푸드죤 자체생산 — 특허 그린티·12곡 웰빙도우(사실상 본사 독점) + 치즈·소스", en: "FoodZone in-house — patented green-tea/12-grain dough (HQ-only) + cheese/sauce" }] },
    { category: { ko: "오븐·POS·인테리어", en: "Oven, POS, interior" }, type: "hq-designated", items: [{ ko: "오븐·POS·인테리어 본사 사양 (간판·전기·가스 추가공사는 점주 부담)", en: "Oven, POS, interior HQ spec (signage/electric/gas extra at owner's cost)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "pizza-alvolo": [
    { category: { ko: "도우(흑미)·치즈·소스", en: "Dough (black rice), cheese, sauce" }, type: "hq-exclusive", items: [{ ko: "㈜알볼로에프앤씨 논산 직영 도우공장·물류센터 생산 — 흑미 도우 + 치즈(매일유업)·소스", en: "Alvolo F&C Nonsan in-house dough plant & center — black-rice dough + cheese (Maeil)/sauce" }], note: { ko: "본사 직영 도우공장+물류센터 보유. 치즈 공급사 변경 이력(남양→매일유업) — 공급가·품질 정책 변동 가능", en: "HQ-owned dough plant & center; cheese vendor changed (Namyang→Maeil)" } },
    { category: { ko: "오븐·POS·포장재", en: "Oven, POS, packaging" }, type: "hq-designated", items: [{ ko: "오븐·POS·브랜드 박스 (본사 사양)", en: "Oven, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "gopizza": [
    { category: { ko: "파베이크 도우·치즈·소스", en: "Par-bake dough, cheese, sauce" }, type: "hq-exclusive", items: [{ ko: "㈜고피자 충북 음성 자체 HACCP 공장 생산 — 파베이크 도우(매장 숙성 불필요) + 치즈·소스", en: "GOPIZZA Eumseong HACCP plant — par-bake dough (no in-store proofing) + cheese/sauce" }] },
    { category: { ko: "자동화 화덕·AI 조리 장비", en: "Automated oven & AI cooking" }, type: "hq-designated", items: [{ ko: "자체 개발 화덕 '고븐(GOVEN)' + AI 토핑 'GOVISION' + 키오스크·POS — 본사 패키지", en: "In-house 'GOVEN' oven + AI 'GOVISION' topping + kiosk/POS — HQ package" }], note: { ko: "비숙련도 5분 조리 — 푸드테크 모델상 본사 장비·도우 종속도가 가장 높음", en: "Non-expert 5-min cooking — highest HQ equipment/dough dependence (foodtech model)" } },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  // 버거·샌드위치
  "nobrand-burger": [
    { category: { ko: "번·패티·소스", en: "Bun, patty, sauce" }, type: "hq-exclusive", items: [{ ko: "신세계푸드 직접 제조·원가 공급 — 상품 공급 마진 없음(수익은 로열티)", en: "Shinsegae Food in-house, cost-based supply — no product markup (revenue via royalty)" }], note: { ko: "로열티 8.8% + 광고비 2.2%(실질 ~11%). 콤팩트 모델로 창업비 인하", en: "Royalty 8.8% + ad fee 2.2% (~11% effective); compact model lowers startup cost" } },
    { category: { ko: "자동 그릴·POS·포장재", en: "Auto grill, POS, packaging" }, type: "hq-designated", items: [{ ko: "자동 그릴·POS·브랜드 박스 (본사 사양)", en: "Auto grill, POS, branded boxes (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "subway": [
    { category: { ko: "빵·소스·식자재", en: "Bread, sauce, ingredients" }, type: "hq-exclusive", items: [{ ko: "글로벌 승인 공급망 — 구매협동조합(IPC) 경유, 승인 공급업체에서만 구매 의무", en: "Global approved-supplier network via IPC co-op; purchase only from approved suppliers" }], note: { ko: "채소도 원칙상 승인 채널(임의 현지조달 제한). 한국 마스터 프랜차이즈는 청오SW. 2025년 양상추 폭등 시 전국 샐러드 일시 중단", en: "Vegetables also via approved channel (limited local sourcing). Korea master franchise: Cheongoh SW; 2025 lettuce spike paused salads nationwide" } },
    { category: { ko: "오븐·토스터·POS·포장재", en: "Oven, toaster, POS, packaging" }, type: "hq-designated", items: [{ ko: "오븐·토스터·POS·브랜드 포장재 (글로벌 표준)", en: "Oven, toaster, POS, branded packaging (global standard)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "frank-burger": [
    { category: { ko: "패티·번·소스", en: "Patty, bun, sauce" }, type: "hq-exclusive", items: [{ ko: "㈜프랭크에프앤비 자체 생산·직영 물류 — 패티·번·소스", en: "Frank F&B in-house production & logistics — patty, bun, sauce" }] },
    { category: { ko: "그릴·POS", en: "Grill & POS" }, type: "hq-designated", items: [{ ko: "그릴·POS (본사 사양)", en: "Grill, POS (HQ spec)" }] },
    { category: { ko: "일반 공산품·위생용품", en: "Generic goods & hygiene" }, type: "free-purchase", items: [{ ko: "포크·나이프 등 시중 대체 가능 공산품·세제·장갑 — 자유 구매", en: "Forks, knives & other generic goods, detergent, gloves — free purchase" }], note: { ko: "2025.11 공정위 과징금 6.4억 — 포크·나이프 등 13개 일반 공산품 구매강제(차액 9~22% 수취)·허위 수익정보·판촉비 전가. 일반 공산품은 자유구매 영역", en: "Nov 2025 FTC fine ₩641M — forced exclusive purchase of 13 generic items (9–22% markup), false revenue claims, ad-cost shifting; generic goods are free-purchase" } },
  ],
  "isaac-toast": [
    { category: { ko: "소스", en: "Sauce" }, type: "hq-exclusive", items: [{ ko: "본사 소스 공급(물류 마진 최소화 표방)", en: "HQ sauce supply (minimal logistics margin)" }] },
    { category: { ko: "신선식품(계란·양배추·과일)", en: "Fresh items (egg, cabbage, fruit)" }, type: "free-purchase", items: [{ ko: "계란·양배추·과일 등 일부 신선식품 현지 조달 허용 — 자유 구매", en: "Egg, cabbage, fruit etc. allowed local sourcing — free purchase" }], note: { ko: "신선식품 현지조달 자유도가 동종 대비 높음. 가맹비는 정액 모델", en: "Higher local-sourcing freedom than peers; flat franchise fee model" } },
    { category: { ko: "장비·POS·포장재", en: "Equipment, POS, packaging" }, type: "hq-designated", items: [{ ko: "철판·POS·브랜드 포장재 (인테리어 부담 낮은 모델)", en: "Griddle, POS, branded packaging (low-interior-cost model)" }] },
  ],
  // 한식·정식
  "myungryun-galbi": [
    { category: { ko: "양념·양념육", en: "Marinade & marinated meat" }, type: "hq-exclusive", items: [{ ko: "㈜명륜당 본사 공장 가공·공급 — 양념·양념육(갈비 30%+목살·앞다리 70% 구성)", en: "Myungryundang HQ plant — marinade & marinated meat (rib 30% + pork 70%)" }], note: { ko: "무한리필 모델. 2025년 본사의 가맹점 대상 고리(15%) 대출 영업 공정위 제재 착수 — 금융 모델 리스크 별도 점검", en: "All-you-can-eat model; 2025 FTC review of HQ's 15% high-rate lending to owners — financial-model risk" } },
    { category: { ko: "불판·로스터·POS·포장재", en: "Grill, roaster, POS, packaging" }, type: "hq-designated", items: [{ ko: "무한리필 불판·로스터·POS (본사 사양)", en: "Grill, roaster, POS (HQ spec)" }] },
    { category: { ko: "야채·쌈·쌀·위생용품", en: "Vegetables, rice, hygiene" }, type: "free-purchase", items: [{ ko: "쌈채소·공깃밥 재료·세제·청소용품", en: "Leaf vegetables, rice, detergent, cleaning supplies" }] },
  ],
  "hancheon-seolleongtang": [
    { category: { ko: "육수·사골 베이스", en: "Broth & bone base" }, type: "hq-exclusive", items: [{ ko: "㈜이연에프엔씨 충북 오송 자체 식품공장 생산·독점 — 설렁탕 육수·사골 베이스", en: "Iyeon F&C Osong in-house plant — exclusive seolleongtang broth/bone base" }], note: { ko: "오송 공장은 국내 최대 규모 육수 공장(연 육수 약 3.6만톤)", en: "Osong is Korea's largest broth plant (~36,000t/yr)" } },
    { category: { ko: "뚝배기·주방장비·POS·포장재", en: "Pot, kitchen, POS, packaging" }, type: "hq-designated", items: [{ ko: "뚝배기·주방장비·POS (본사 사양)", en: "Earthen pot, kitchen equipment, POS (HQ spec)" }] },
    { category: { ko: "반찬채소·쌀·위생용품", en: "Side veg, rice, hygiene" }, type: "free-purchase", items: [{ ko: "깍두기·반찬 채소·공깃밥·세제·청소용품", en: "Kkakdugi, side vegetables, rice, detergent, cleaning supplies" }] },
  ],
  "bon-dosirak": [
    { category: { ko: "반찬·소스·반조리 식자재", en: "Side dishes, sauce, semi-prepped" }, type: "hq-exclusive", items: [{ ko: "본아이에프(본그룹) — 물류 자회사 본푸드서비스가 전국 4개 물류센터(용인·논산·창녕·장성) 콜드체인 공급", en: "Bon IF (Bon Group) — Bon Food Service 4 centers (Yongin/Nonsan/Changnyeong/Jangseong) cold-chain supply" }], note: { ko: "물류 구조가 명확히 공개됨(자체 물류 법인 + 4개 센터, 약 2,200개 가맹점). 본죽=본아이에프 모회사", en: "Transparent logistics (own logistics arm + 4 centers, ~2,200 stores). Bonjuk shares parent Bon IF" } },
    { category: { ko: "도시락 용기·포장재·POS", en: "Lunchbox container, packaging, POS" }, type: "hq-designated", items: [{ ko: "도시락 용기·브랜드 포장재·POS (본사 사양)", en: "Lunchbox container, branded packaging, POS (HQ spec)" }] },
    { category: { ko: "쌀·일부 신선채소·위생용품", en: "Rice, some fresh veg, hygiene" }, type: "free-purchase", items: [{ ko: "쌀·일부 신선채소·세제·청소용품", en: "Rice, some fresh vegetables, detergent, cleaning supplies" }] },
  ],
  "kimgane": [
    { category: { ko: "소스·양념·가공 식자재", en: "Sauce, seasoning, processed" }, type: "hq-exclusive", items: [{ ko: "㈜김가네 본사 직배송(자체 물류 차량·인원) — 소스·양념·단무지 등", en: "Gimgane HQ direct delivery (own fleet) — sauce, seasoning, pickled radish" }], note: { ko: "본사가 '모든 식자재 본사 공급'을 표방 — 실제 필수구매 vs 자유구매 경계는 정보공개서 확인 권장", en: "HQ claims 'all ingredients HQ-supplied' — verify mandatory vs free in disclosure" } },
    { category: { ko: "주방장비·POS·포장재", en: "Kitchen, POS, packaging" }, type: "hq-designated", items: [{ ko: "주방장비·POS·브랜드 포장재 (본사 사양)", en: "Kitchen equipment, POS, branded packaging (HQ spec)" }] },
    { category: { ko: "신선채소·쌀·위생용품", en: "Fresh veg, rice, hygiene" }, type: "free-purchase", items: [{ ko: "오이·당근 등 신선채소·쌀·세제·청소용품", en: "Cucumber, carrot etc., rice, detergent, cleaning supplies" }] },
  ],
  "barda-kimsunsaeng": [
    { category: { ko: "소스·반조리 식자재", en: "Sauce & semi-prepped" }, type: "hq-exclusive", items: [{ ko: "㈜죠스푸드 본사 공급 — 김밥 소스·반조리 식자재", en: "Jaws Food HQ supply — kimbap sauce & semi-prepped" }], note: { ko: "2014~2016년 일반공산품 15개+주문생산품 3개(총 18품목)를 시중가보다 높게 필수공급 강제 → 공정위 과징금 약 6.4억. 통일성에 불필요한 공산품은 자유구매가 원칙 — 정보공개서 확인", en: "2014–2016 forced 18 items (15 generic + 3 made-to-order) above market → FTC fine ~₩640M; non-essential goods should be free-purchase" } },
    { category: { ko: "장비·POS·포장재", en: "Equipment, POS, packaging" }, type: "hq-designated", items: [{ ko: "주방장비·POS·브랜드 포장재 (본사 사양)", en: "Kitchen equipment, POS, branded packaging (HQ spec)" }] },
    { category: { ko: "신선채소·쌀·위생용품", en: "Fresh veg, rice, hygiene" }, type: "free-purchase", items: [{ ko: "신선채소·쌀·세제·청소용품", en: "Fresh vegetables, rice, detergent, cleaning supplies" }] },
  ],
  "chaesundang": [
    { category: { ko: "육수·소스·식육 가공품", en: "Broth, sauce, processed meat" }, type: "hq-exclusive", items: [{ ko: "㈜채선당 남양주 통합물류센터+식육 가공센터 생산·독점 — 육수 5종·소스 약 30종·샤브용 식육", en: "Chaesundang Namyangju integrated center + meat-processing — 5 broths, ~30 sauces, shabu meat" }], note: { ko: "식육 가공센터까지 수직계열화 — 육수·소스·육류 본사 독점도 높음", en: "Vertically integrated incl. meat processing — high HQ exclusivity" } },
    { category: { ko: "인덕션·냄비·POS·포장재", en: "Induction, pot, POS, packaging" }, type: "hq-designated", items: [{ ko: "샤브 인덕션·냄비·POS (본사 사양)", en: "Shabu induction, pot, POS (HQ spec)" }] },
    { category: { ko: "신선채소·고명·위생용품", en: "Fresh veg, garnish, hygiene" }, type: "free-purchase", items: [{ ko: "샤브용 신선채소·고명·세제·청소용품", en: "Shabu vegetables, garnish, detergent, cleaning supplies" }] },
  ],
  "hanampigjib": [
    { category: { ko: "돼지고기·명이나물·참숯·육수", en: "Pork, myungi, charcoal, broth" }, type: "hq-exclusive", items: [{ ko: "㈜하남에프앤비 본사 직공급 — 돼지고기·명이나물·참숯·육수", en: "Hanam F&B HQ direct supply — pork, myungi greens, charcoal, broth" }], note: { ko: "2025년 공정위 과징금 8천만 — 계약서 미기재 김치·소면·육수·배달용기 등 26개를 위법 필수지정, 미준수 시 공급중단·해지. 필수품목 무단 확대 — 계약서·정보공개서 확인", en: "2025 FTC fine ₩80M — illegally added 26 undisclosed items (kimchi, noodles, broth, delivery containers); review contract & disclosure" } },
    { category: { ko: "배달용기·POS·초벌장비", en: "Delivery container, POS, grill" }, type: "hq-designated", items: [{ ko: "배달용기·POS·초벌용 장비 (본사 사양)", en: "Delivery container, POS, pre-grill equipment (HQ spec)" }] },
    { category: { ko: "일반채소·쌈·위생용품", en: "Vegetables, ssam, hygiene" }, type: "free-purchase", items: [{ ko: "일반 채소·쌈·반찬·세제·청소용품", en: "General vegetables, ssam, sides, detergent, cleaning supplies" }] },
  ],
  // 분식·핫도그·카페
  "jaws-tteokbokki": [
    { category: { ko: "떡·어묵·떡볶이 소스", en: "Rice cake, fish cake, sauce" }, type: "hq-exclusive", items: [{ ko: "㈜죠스푸드(바르다김선생과 동일 운영사) 본사 공급 — 떡·어묵·소스", en: "Jaws Food (same operator as Barda Kimsunsaeng) HQ supply — rice cake, fish cake, sauce" }], note: { ko: "2015년 매장 리뉴얼 비용 점주 전가로 공정위 시정명령 이력", en: "2015 FTC corrective order for shifting remodel costs to owners" } },
    { category: { ko: "튀김기·POS·포장재", en: "Fryer, POS, packaging" }, type: "hq-designated", items: [{ ko: "튀김기·POS·브랜드 일회용품 (본사 사양)", en: "Fryer, POS, branded disposables (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "youngdabang": [
    { category: { ko: "소스·핵심 재료", en: "Sauce & core ingredients" }, type: "hq-exclusive", items: [{ ko: "㈜한경기획 — 핵심 소스·재료는 일정한 맛 위해 본사 지정업체 구매 의무(공식 명시). 식자재 일요 제외 매일 직배송", en: "Hankyung Planning — core sauce/ingredients must be bought from HQ-designated suppliers (official); daily delivery exc. Sundays" }], note: { ko: "지정구매 범위가 넓을 수 있어 차액가맹금 점검 권장", en: "Wide designated-purchase scope — check supply markup" } },
    { category: { ko: "장비·POS·포장재", en: "Equipment, POS, packaging" }, type: "hq-designated", items: [{ ko: "튀김기·POS·브랜드 포장재 (본사 사양)", en: "Fryer, POS, branded packaging (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "myungrang-hotdog": [
    { category: { ko: "쌀가루·소스·소시지·치즈", en: "Rice flour, sauce, sausage, cheese" }, type: "hq-exclusive", items: [{ ko: "본사(명랑시대 협동조합·㈜케이푸드 제조 연관) 공급 — 쌀가루·전용 소스·시그니처 소시지/치즈", en: "HQ (Myungrang co-op / K-Food manufacturing) — rice flour, sauce, signature sausage/cheese" }], note: { ko: "반죽은 매장에서 매일 직접 제조 — 본사 완제품 마진보다 부재료(쌀가루·소스 등) 공급 마진 중심", en: "Dough made fresh in-store daily — margin centered on sub-ingredients, not finished dough" } },
    { category: { ko: "튀김기·집기·POS·포장재", en: "Fryer, tools, POS, packaging" }, type: "hq-designated", items: [{ ko: "튀김기·집기·POS·브랜드 포장재 (본사 사양)", en: "Fryer, tools, POS, branded packaging (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "tomntoms": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "㈜탐앤탐스 자체 로스팅 공장 생산·공급 (토종 커피전문점 최초 로스팅 공장)", en: "TOM N TOMS in-house roasting plant (first among Korean coffee chains)" }] },
    { category: { ko: "프레즐·베이커리 재료", en: "Pretzel & bakery materials" }, type: "hq-exclusive", items: [{ ko: "매장 제조 프레즐 등 시그니처 베이커리 재료 본사 공급", en: "Signature pretzel/bakery materials HQ supply" }] },
    { category: { ko: "장비·POS·브랜드 컵·인테리어", en: "Equipment, POS, cup, interior" }, type: "hq-designated", items: [{ ko: "에스프레소 머신·그라인더·POS·브랜드 컵·인테리어 (본사 사양)", en: "Espresso machine, grinder, POS, branded cups, interior (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
  "mammoth-coffee": [
    { category: { ko: "원두", en: "Coffee beans" }, type: "hq-exclusive", items: [{ ko: "㈜매머드커피랩 자체 로스팅(경기 광주) 생산·공급", en: "Mammoth Coffee Lab in-house roasting (Gwangju, Gyeonggi)" }], note: { ko: "저가 카페 모델 — 원두·부자재 공급 마진이 본사 수익 핵심. 동종업계 차액가맹금 반환 소송 사례 있어 정보공개서·공급가 점검 권장", en: "Budget-cafe model — bean/material supply margin is HQ's core revenue; peer brands faced refund lawsuits — review disclosure" } },
    { category: { ko: "시럽·파우더", en: "Syrup & powder" }, type: "hq-exclusive", items: [{ ko: "음료 베이스 시럽·파우더 본사 공급", en: "Beverage base syrup/powder HQ supply" }] },
    { category: { ko: "자동 머신·키오스크·POS·브랜드 컵", en: "Auto machine, kiosk, POS, cup" }, type: "hq-designated", items: [{ ko: "자동 에스프레소 머신·키오스크(익스프레스)·POS·브랜드 컵 (본사 사양)", en: "Auto espresso machine, kiosk (Express), POS, branded cups (HQ spec)" }] },
    { category: { ko: "일반 위생·청소용품", en: "Generic hygiene" }, type: "free-purchase", items: [{ ko: "세제·장갑·청소용품", en: "Detergent, gloves, cleaning supplies" }] },
  ],
};

/** Get supply structure for a franchise brand — brand-specific first, then category fallback */
export function getFranchiseSupplyInfo(brand: FranchiseBrand): FranchiseSupplyItem[] {
  return brandSupplyOverrides[brand.id] ?? categorySupplyPatterns[brand.categoryId] ?? categorySupplyPatterns["food"] ?? [];
}

/** Supply type label */
export function getSupplyTypeLabel(type: SupplyType, lang: "ko" | "en"): string {
  if (type === "hq-exclusive") return lang === "ko" ? "본사 독점 공급" : "HQ Exclusive";
  if (type === "hq-designated") return lang === "ko" ? "본사 지정 업체" : "HQ Designated";
  return lang === "ko" ? "자유 구매 가능" : "Free Purchase";
}

/** Supply type color */
export function getSupplyTypeColor(type: SupplyType): string {
  if (type === "hq-exclusive") return "#ff3b30";
  if (type === "hq-designated") return "#ff9f0a";
  return "#34c759";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  FRANCHISE APPLICATION GUIDE
 *  가맹 절차 안내 데이터
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export type FranchiseChecklistItem = {
  id: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  estimatedDays?: number;
};

export const franchiseApplicationChecklist: FranchiseChecklistItem[] = [
  {
    id: "inquiry",
    title: { ko: "본사 가맹 상담 신청", en: "Request HQ franchise consultation" },
    description: {
      ko: "브랜드 공식 홈페이지 또는 전화로 가맹 상담을 신청하세요. 창업 설명회가 있다면 참석을 권장합니다.",
      en: "Apply for consultation via the brand's official website or phone. Attend startup seminars if available."
    },
    estimatedDays: 3
  },
  {
    id: "disclosure",
    title: { ko: "정보공개서 수령 및 검토", en: "Receive & review disclosure document" },
    description: {
      ko: "가맹사업법에 따라 본사는 계약 체결 14일 전에 정보공개서를 제공해야 합니다. 가맹비, 영업지역, 계약 해지 조건 등을 꼼꼼히 확인하세요.",
      en: "By law, HQ must provide the disclosure document 14 days before signing. Carefully review franchise fees, territory protection, and termination terms."
    },
    estimatedDays: 14
  },
  {
    id: "visit-stores",
    title: { ko: "인근 가맹점 방문 확인", en: "Visit nearby franchise stores" },
    description: {
      ko: "본사가 제공한 인근 가맹점 10곳의 목록을 활용하여 실제 점주들의 경험을 직접 확인하세요. 매출, 본사 지원, 불만사항 등을 솔직하게 물어보세요.",
      en: "Use the list of 10 nearby stores provided by HQ to hear real experiences from existing owners about revenue, support, and complaints."
    },
    estimatedDays: 7
  },
  {
    id: "legal-review",
    title: { ko: "계약서 법률 검토", en: "Legal review of contract" },
    description: {
      ko: "변호사 또는 가맹거래사에게 계약서 검토를 의뢰하세요. 14일 숙려기간이 7일로 단축됩니다. 독소조항, 위약금, 필수물품 강제 등을 확인하세요.",
      en: "Have a lawyer or franchise consultant review the contract. This reduces the cooling period to 7 days. Check for unfair terms, penalties, and mandatory purchases."
    },
    estimatedDays: 5
  },
  {
    id: "sign-contract",
    title: { ko: "가맹 계약 체결", en: "Sign franchise agreement" },
    description: {
      ko: "정보공개서 수령 14일(변호사 검토 시 7일) 이후에만 계약이 가능합니다. 가맹비를 납부하고 본사와 정식 계약을 체결하세요.",
      en: "Contract signing is only allowed 14 days (7 with legal review) after receiving disclosure. Pay the franchise fee and sign officially."
    },
    estimatedDays: 1
  },
  {
    id: "training",
    title: { ko: "본사 교육 이수", en: "Complete HQ training" },
    description: {
      ko: "브랜드별로 1~4주의 교육 과정이 있습니다. 조리, 위생, POS 운영, 고객 응대 등을 배우게 됩니다.",
      en: "Brands require 1-4 weeks of training covering cooking, hygiene, POS, and customer service."
    },
    estimatedDays: 14
  }
];

export type ContractCheckpoint = {
  id: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  riskLevel: "critical" | "important" | "info";
};

export const contractCheckpoints: ContractCheckpoint[] = [
  {
    id: "contract-period",
    title: { ko: "계약 기간 및 갱신 조건", en: "Contract period & renewal" },
    description: {
      ko: "계약 기간이 초기 투자금 회수에 충분한지 확인하세요. 보통 3~5년이며, 갱신 조건(추가 비용, 인테리어 리뉴얼 등)을 반드시 확인하세요.",
      en: "Ensure contract length covers your investment recovery. Usually 3-5 years. Check renewal conditions (additional costs, interior renewal, etc.)."
    },
    riskLevel: "critical"
  },
  {
    id: "fee-refund",
    title: { ko: "가맹비 반환 조건", en: "Franchise fee refund policy" },
    description: {
      ko: "계약 해지 시 가맹비 반환 여부와 조건을 확인하세요. 정보공개서 미제공·허위정보 제공 시 가맹금 반환을 청구할 수 있으나, 반드시 계약 체결일로부터 4개월 이내에 서면으로 요구해야 효력이 있습니다 (가맹사업법 §10 · 무조건 전액은 아님).",
      en: "Check refund conditions upon termination. Full refund is possible if disclosure was not provided or contained false information."
    },
    riskLevel: "critical"
  },
  {
    id: "territory",
    title: { ko: "영업지역 보호 범위", en: "Territory protection scope" },
    description: {
      ko: "본사가 보장하는 영업지역 범위와 동일 브랜드 출점 제한을 명확히 확인하세요. 모호한 표현은 분쟁의 원인이 됩니다.",
      en: "Verify the protected territory range and same-brand opening restrictions. Vague wording causes disputes."
    },
    riskLevel: "critical"
  },
  {
    id: "royalty-structure",
    title: { ko: "로열티 구조", en: "Royalty structure" },
    description: {
      ko: "월 정액인지, 매출 비율인지, 별도 광고 분담금이 있는지 확인하세요. 광고 모델료 점주 분담 여부도 중요합니다.",
      en: "Determine if royalty is flat fee or revenue percentage. Check for separate ad contributions and model fee sharing."
    },
    riskLevel: "important"
  },
  {
    id: "mandatory-purchase",
    title: { ko: "필수 물품 구매 의무", en: "Mandatory purchase requirements" },
    description: {
      ko: "본사에서 반드시 구매해야 하는 물품(원재료, 포장재 등)의 범위와 가격 적정성을 확인하세요. 시중 대비 과도하게 높지 않은지 비교하세요.",
      en: "Review mandatory purchases (ingredients, packaging) and verify price fairness vs. market alternatives."
    },
    riskLevel: "important"
  },
  {
    id: "interior-mandate",
    title: { ko: "인테리어·시설 강제 여부", en: "Interior/facility mandates" },
    description: {
      ko: "본사 지정 업체 시공 의무, 리뉴얼 주기, 비용 부담 주체를 확인하세요. 계약 갱신 시 인테리어 재시공 조건도 중요합니다.",
      en: "Check HQ-designated contractor requirements, renewal cycles, and who bears the cost. Interior redo terms at renewal matter."
    },
    riskLevel: "important"
  },
  {
    id: "ad-cost-share",
    title: { ko: "광고·홍보 분담금", en: "Advertising cost sharing" },
    description: {
      ko: "전국 광고비, 지역 광고비, 오프닝 광고비가 별도로 부과되는지 확인하세요. 광고비가 매출 대비 과도하지 않은지 검토하세요.",
      en: "Verify national, regional, and opening ad costs charged separately. Ensure ad spend is proportional to expected revenue."
    },
    riskLevel: "important"
  },
  {
    id: "termination",
    title: { ko: "계약 해지 조건 및 위약금", en: "Termination terms & penalties" },
    description: {
      ko: "본사의 일방적 해지 사유, 가맹점의 해지 가능 조건, 위약금 규모를 반드시 확인하세요. 부당한 해지 조항은 분쟁조정 대상입니다.",
      en: "Must check HQ's unilateral termination grounds, franchisee's termination rights, and penalty amounts."
    },
    riskLevel: "critical"
  },
  {
    id: "transfer-restrict",
    title: { ko: "사업 양도 제한", en: "Business transfer restrictions" },
    description: {
      ko: "제3자에게 양도 시 본사 승인 절차와 제한 조건을 확인하세요. 양도 시 추가 비용이 발생하는지도 확인하세요.",
      en: "Check HQ approval process and restrictions for third-party transfer. Verify additional transfer costs."
    },
    riskLevel: "info"
  },
  {
    id: "dispute-resolution",
    title: { ko: "분쟁 해결 방식", en: "Dispute resolution method" },
    description: {
      ko: "분쟁 발생 시 중재/소송 절차와 비용 부담을 확인하세요. 한국공정거래조정원의 가맹사업거래분쟁조정협의회(공정위 산하 법정 기구)를 활용할 수 있습니다.",
      en: "Check arbitration/litigation procedures and cost allocation. Use the Franchise Dispute Mediation Council at the Korea Fair Trade Mediation Agency (KOFAIR), the official statutory body."
    },
    riskLevel: "info"
  }
];
