/**
 * 세액공제·감면 자격 매핑 SSOT (2026 기준) — 세부업종 70종 × 조특법 대상.
 *
 *  ── 사용자 지시 (2026-07-22) ──────────────────────────────
 *  "세액공제 기능을 세부업종 70종 전부 커버 가능하게 정밀 매핑하라."
 *  ────────────────────────────────────────────────
 *
 *  ⚠️ 이 매핑은 "참고용 운영 보조" — 세무 자문 아님. 최종 자격·금액은 세무사·홈택스.
 *      · 자격 판정 근거 = 조세특례제한법(§6 창업감면·§7 특별감면) 원문 + 국세청 안내
 *        (2026-07-22 law.go.kr·nts.go.kr 직접 확인). 대상은 KSIC 업종코드로 결정된다.
 *      · 우리는 세부업종별 *정확한* KSIC 코드를 보유하지 않는다(카테고리 힌트만).
 *        따라서 confidence 로 확신 수준을 구분하고, 애매건은 "세무사·홈택스 확인" 으로.
 *      · 값·대상은 일몰(sunset)이 항목마다 다르다 → 연 1회 세법개정 반영 필수.
 *
 *  정직성 3원칙 ([[labor-law-ssot]] 동일):
 *   ① 최종 절세액 단정 금지 — 산출세액·한도·중복배제·사후관리가 얽혀 앱은 확정 불가.
 *   ② 자격은 confidence 로만 — "eligible"(조문 명시)만 확정, 조금이라도 애매하면 "check".
 *   ③ 업종 매칭은 대표 KSIC 기준 안내 + "사업자등록증 업종코드로 확정" 유도.
 */

// ═══════════════════════════════════════════════════════════════
//   공통 세액공제·소득공제 — 업종 무관, 전 70종 공통 (개인사업자 기준)
// ═══════════════════════════════════════════════════════════════

export type CommonTaxBenefit = {
  id: string;
  titleKo: string;
  /** 한 줄 요약 — 공제율·한도 (값에는 반드시 적용연도 명시) */
  summaryKo: string;
  /** 근거 법조문 */
  basis: string;
  /** 일몰(적용기한) — null 이면 상시 */
  sunset: string | null;
  /** 홈택스/안내 링크 (공식) */
  link?: string;
};

/**
 * 전 업종 공통 — 개인사업자면 업종과 무관하게 자격이 있는 항목.
 * 이 4종 덕분에 70종 *어느 업종을 골라도* 최소 몇 개 혜택이 노출된다(빈 화면 없음).
 */
export const COMMON_TAX_BENEFITS: CommonTaxBenefit[] = [
  {
    id: "yellow-umbrella",
    titleKo: "노란우산공제 (소득공제)",
    summaryKo: "2026년 최대 600만원 소득공제 (사업소득 구간별 200~600만원). 폐업·퇴직 대비 목돈.",
    basis: "조세특례제한법 §86의3",
    sunset: null,
    link: "https://www.8899.or.kr",
  },
  {
    id: "pension-irp",
    titleKo: "연금저축·IRP 세액공제",
    summaryKo: "납입액의 13.2~16.5%(지방세 포함) 세액공제. 한도 연금저축 600만원 / IRP 합산 900만원.",
    basis: "소득세법 §59의3",
    sunset: null,
  },
  {
    id: "integrated-employment",
    titleKo: "통합고용세액공제 (고용 증가 시)",
    summaryKo: "상시근로자 증가분 1인당 중소기업 3년 지원 — 청년등 지방 1,550만·수도권 1,450만 / 그 외 지방 950만·수도권 850만.",
    basis: "조세특례제한법 §29의8",
    sunset: "2027-12-31",
    link: "https://www.nts.go.kr",
  },
  {
    id: "sincere-medical-edu",
    titleKo: "성실사업자 의료비·교육비 세액공제",
    summaryKo: "의료비·교육비 지출액의 15%(난임 30%·미숙아 20%) 세액공제. 월세는 종합소득 7천만원 이하.",
    basis: "소득세법 §122의3",
    sunset: "2026-12-31",
  },
];

// ═══════════════════════════════════════════════════════════════
//   업종특화 감면 — 세부업종 70종 × 조특법 §6(창업감면)·§7(특별감면)
// ═══════════════════════════════════════════════════════════════

/** 자격 확신 수준 — eligible=조문 명시 확정 / likely=대표코드상 해당 추정 / check=업종분류 애매·세무사 확인 / excluded=대상 아님 */
export type EligibilityLevel = "eligible" | "likely" | "check" | "excluded";

export type SpecialtyTaxMapping = {
  /** starterIndustryOptions.id */
  specialtyId: string;
  categoryId: string;
  /** 대표 KSIC(한국표준산업분류) 힌트 — 정확 코드는 사업자등록증 기준 */
  ksicHint: string;
  /** 창업중소기업 세액감면 (조특법 §6) — 창업 5년, 지역별 25~100% */
  startupReduction: EligibilityLevel;
  /** 중소기업 특별세액감면 (조특법 §7) — 규모·지역별 5~30%, 한도 1억 */
  specialReduction: EligibilityLevel;
  /** 근거·주의 (애매건은 왜 애매한지) */
  note: string;
};

// ── 카테고리 기본 규칙 (개별 override 로 조정) ──
//   §6 대상(조문 명시): 음식점업·정보통신업·이용미용업·개인소비용품수리업·직업기술학원·
//                       관광숙박업·예술스포츠여가(오락장 등 제외)·제조업·건설업·통신판매업.
//   §6 제외: 소매업·세탁업·부동산임대업.
//   §7 대상: 도소매·제조·의료·건설·운수·출판·IT·관광 등 28업종 (음식점 제외).

export const SPECIALTY_TAX_MAPPINGS: SpecialtyTaxMapping[] = [
  // ── 외식 (음식점업 56) — §6 O / §7 X ──
  ...["korean-casual", "delivery-meals", "salad-healthy", "ramen-noodle", "chicken-burger", "western-pasta-brunch"].map(
    (id) => ({ specialtyId: id, categoryId: "food", ksicHint: "일반/휴게음식점업 (56)", startupReduction: "eligible" as const, specialReduction: "excluded" as const, note: "음식점업 = 창업감면 대상(§6③7). 특별감면(§7) 대상 아님. 창업 5년 이내 신청." }),
  ),

  // ── 카페·디저트 (음식점업 중 비알코올음료점 56220 / 제과점 56191) — §6 O / §7 X ──
  ...["takeout-coffee", "specialty-coffee", "dessert-cafe", "icecream-bingsu", "self-serve-cafe"].map(
    (id) => ({ specialtyId: id, categoryId: "cafe-dessert", ksicHint: "비알코올음료점업 (56220)", startupReduction: "eligible" as const, specialReduction: "excluded" as const, note: "카페=음식점업으로 창업감면 대상(§6③7) 통상 인정. 정확 분류는 사업자등록 업종코드 확인." }),
  ),
  { specialtyId: "bakery-studio", categoryId: "cafe-dessert", ksicHint: "제과점업 (56191)", startupReduction: "eligible", specialReduction: "excluded", note: "제과점업=음식점업으로 창업감면 대상. 직접 제조 비중 크면 제조업 분류 가능성(세무사 확인 시 §7도)." },

  // ── 소매 (소매업 47) — §6 X(소매 제외) / §7 O(도소매 10%) ──
  ...["convenience-small", "lifestyle-goods", "beauty-supplies", "fashion-accessories", "health-food-store", "unmanned-retail"].map(
    (id) => ({ specialtyId: id, categoryId: "retail", ksicHint: "종합/전문 소매업 (47)", startupReduction: "excluded" as const, specialReduction: "eligible" as const, note: "소매업=창업감면 제외, 특별감면(§7) 도소매 대상(소기업 10%). 온라인 병행 시 통신판매업으로 §6 가능성(세무사 확인)." }),
  ),

  // ── 뷰티 (이용·미용업 96112 등) — §6 O / §7 X ──
  ...["hair-salon", "nail-studio", "skin-care-room", "waxing-studio", "eyelash-brow", "makeup-bridal"].map(
    (id) => ({ specialtyId: id, categoryId: "beauty", ksicHint: "이용 및 미용업 (9611)", startupReduction: "eligible" as const, specialReduction: "excluded" as const, note: "이용·미용업 = 창업감면 대상(§6③14나). 특별감면(§7) 대상 아님." }),
  ),

  // ── 피트니스 (스포츠서비스업 91) — §6 부분(오락장 제외) / §7 X ──
  ...["pilates-studio", "yoga-studio", "pt-gym", "crossfit-box", "unmanned-fitness"].map(
    (id) => ({ specialtyId: id, categoryId: "fitness", ksicHint: "체력단련시설/스포츠교육 (9139·8559)", startupReduction: "likely" as const, specialReduction: "excluded" as const, note: "스포츠서비스업은 창업감면 대상(§6③13)이나 오락장·사행시설은 제외 — 체력단련/스포츠교육 해당 여부 세무사 확인 권장." }),
  ),
  { specialtyId: "golf-studio", categoryId: "fitness", ksicHint: "스크린골프=오락장운영업 가능성 (91221)", startupReduction: "check", specialReduction: "excluded", note: "스크린골프는 '오락장 운영업'으로 창업감면 제외 대상일 수 있음(§6③13 단서). 골프교습이면 대상 가능 — 반드시 세무사 확인." },

  // ── 교육 (학원 85) — §6 직업기술학원만 O ──
  { specialtyId: "coding-class", categoryId: "education", ksicHint: "직업기술학원 (8550)", startupReduction: "likely", specialReduction: "excluded", note: "직업기술 분야 교습 학원은 창업감면 대상(§6③15). 코딩=직업기술 해당 가능, 정확 등록업종 확인 권장." },
  ...["kids-academy", "language-academy", "adult-class"].map(
    (id) => ({ specialtyId: id, categoryId: "education", ksicHint: "일반교과/외국어학원 (8550)", startupReduction: "check" as const, specialReduction: "excluded" as const, note: "일반 교습학원(입시·외국어)은 창업감면의 '직업기술 학원'에 해당하지 않으면 제외 — 세무사 확인 필요." }),
  ),
  ...["study-room", "small-study-room"].map(
    (id) => ({ specialtyId: id, categoryId: "education", ksicHint: "독서실운영업 (85)", startupReduction: "check" as const, specialReduction: "excluded" as const, note: "독서실은 교습이 아니라 창업감면 대상 여부 불명확 — 세무사 확인." }),
  ),

  // ── 펫 (업종 분류 제각각) — 대부분 check ──
  { specialtyId: "pet-grooming", categoryId: "pet", ksicHint: "반려동물 미용 (96 기타개인서비스)", startupReduction: "check", specialReduction: "excluded", note: "반려동물 미용은 '이용·미용업'(사람 대상)과 별개 분류 — 창업감면 대상 여부 세무사 확인." },
  { specialtyId: "pet-supplies", categoryId: "pet", ksicHint: "애완용품 소매 (47)", startupReduction: "excluded", specialReduction: "eligible", note: "용품 소매=특별감면(§7) 도소매 대상, 창업감면 제외(소매)." },
  { specialtyId: "pet-hotel", categoryId: "pet", ksicHint: "반려동물 위탁관리 (96)", startupReduction: "check", specialReduction: "excluded", note: "반려동물 위탁은 관광숙박업 아님 — 창업감면 대상 여부 불명확, 세무사 확인." },
  { specialtyId: "pet-cafe", categoryId: "pet", ksicHint: "음식점업+동물전시 혼합", startupReduction: "check", specialReduction: "excluded", note: "애견카페는 음식점업 비중에 따라 창업감면 가능성 있으나 혼합업종이라 세무사 확인 필요." },
  { specialtyId: "pet-training-school", categoryId: "pet", ksicHint: "반려동물 훈련 (96)", startupReduction: "check", specialReduction: "excluded", note: "반려동물 훈련은 직업기술학원 아님 — 창업감면 대상 여부 세무사 확인." },

  // ── 생활서비스 (세탁/수리/청소/인쇄) ──
  ...["laundry-service", "self-laundry"].map(
    (id) => ({ specialtyId: id, categoryId: "living-service", ksicHint: "세탁업 (9691)", startupReduction: "excluded" as const, specialReduction: "excluded" as const, note: "세탁업은 창업감면·특별감면 대상 아님 — 공통 4종(성실사업자·노란우산 등)만 해당." }),
  ),
  ...["repair-service", "device-repair"].map(
    (id) => ({ specialtyId: id, categoryId: "living-service", ksicHint: "개인·소비용품 수리업 (95)", startupReduction: "eligible" as const, specialReduction: "excluded" as const, note: "개인 및 소비용품 수리업 = 창업감면 대상(§6③14가)." }),
  ),
  { specialtyId: "cleaning-service", categoryId: "living-service", ksicHint: "사업시설관리/청소 (74)", startupReduction: "likely", specialReduction: "excluded", note: "사업시설 관리·사업지원 서비스업은 창업감면 대상(§6③)이나 세부 청소업 분류 확인 권장." },
  { specialtyId: "print-copy", categoryId: "living-service", ksicHint: "인쇄업(18) 또는 출력·복사 서비스", startupReduction: "check", specialReduction: "check", note: "인쇄업이면 제조업으로 §6·§7 대상 가능, 단순 출력·복사면 서비스 — 등록업종 확인 필요." },

  // ── 공간 (숙박/부동산임대/독서실) ──
  { specialtyId: "guesthouse", categoryId: "space", ksicHint: "일반/생활숙박업 (55)", startupReduction: "likely", specialReduction: "excluded", note: "관광진흥법상 '관광숙박업' 등록 시 창업감면 대상(§6③16). 일반 숙박업 등록이면 대상 여부 세무사 확인." },
  ...["rental-studio", "shared-office", "party-room", "practice-room"].map(
    (id) => ({ specialtyId: id, categoryId: "space", ksicHint: "부동산 임대업 (68)", startupReduction: "excluded" as const, specialReduction: "excluded" as const, note: "부동산 임대업은 창업감면·특별감면 대상 아님 — 공통 4종만 해당." }),
  ),
  { specialtyId: "study-cafe-space", categoryId: "space", ksicHint: "독서실/스터디카페 (85 또는 68)", startupReduction: "check", specialReduction: "excluded", note: "스터디카페는 독서실운영업/공간임대 혼합 — 창업감면 대상 여부 불명확, 세무사 확인." },

  // ── 온라인·디지털 (통신판매/정보통신) ──
  ...["smart-store", "consignment-commerce", "global-buying"].map(
    (id) => ({ specialtyId: id, categoryId: "online-digital", ksicHint: "전자상거래·통신판매업 (47912)", startupReduction: "likely" as const, specialReduction: "eligible" as const, note: "통신판매업은 창업감면 대상(§6③7)일 수 있고, 전자상거래 소매는 특별감면(§7) 도소매 대상. 판매 vs 중개 구조에 따라 다름 — 확인 권장." }),
  ),
  ...["digital-products", "newsletter-membership"].map(
    (id) => ({ specialtyId: id, categoryId: "online-digital", ksicHint: "정보통신업/디지털콘텐츠 (58·63)", startupReduction: "likely" as const, specialReduction: "likely" as const, note: "디지털콘텐츠·정보서비스는 정보통신업으로 §6·§7 대상 가능(비디오감상실·뉴스제공 등 제외 항목 주의)." }),
  ),
  { specialtyId: "creator-service", categoryId: "online-digital", ksicHint: "1인미디어/기타 정보서비스 (63)", startupReduction: "check", specialReduction: "check", note: "크리에이터·1인미디어는 등록업종이 정보통신/광고/기타로 갈려 대상 여부 불명확 — 세무사 확인." },

  // ── 스타트업·기술 (정보통신 SW / 제조) ──
  ...["ai-application", "developer-tools", "b2b-saas", "fintech-startup", "healthtech-startup", "security-startup"].map(
    (id) => ({ specialtyId: id, categoryId: "startup-tech", ksicHint: "소프트웨어 개발·정보통신업 (582·62·63)", startupReduction: "eligible" as const, specialReduction: "eligible" as const, note: "소프트웨어·정보통신업 = 창업감면(§6③8)·특별감면(§7) 모두 대상. 벤처확인 시 창업벤처 감면 추가 검토." }),
  ),
  ...["hardware-iot", "robotics-physical-ai", "semiconductor"].map(
    (id) => ({ specialtyId: id, categoryId: "startup-tech", ksicHint: "전자부품·기계 제조업 (26·29)", startupReduction: "eligible" as const, specialReduction: "eligible" as const, note: "제조업 = 창업감면(§6③1)·특별감면(§7) 모두 대상." }),
  ),
  ...["biotech-medtech", "climate-energy"].map(
    (id) => ({ specialtyId: id, categoryId: "startup-tech", ksicHint: "의료·화학 제조 또는 연구개발 (21·70)", startupReduction: "likely" as const, specialReduction: "likely" as const, note: "제조업이면 §6·§7 대상, 연구개발(R&D)업이면 대상 범위 다름 — 등록업종 확인 권장." }),
  ),
];

// ═══════════════════════════════════════════════════════════════
//   Resolve — 세부업종 → 받을 수 있는 세액공제 (공통 + 업종특화)
// ═══════════════════════════════════════════════════════════════

export type ResolvedTaxCredits = {
  common: CommonTaxBenefit[];
  /** 업종특화 감면 (제외·불명확 제외하고 유효한 것만) */
  industrySpecific: SpecialtyTaxMapping | null;
  /** 창업 후 5년 이내여야 창업감면(§6) 유효 — 호출부가 개업일로 판단 */
  startupReductionActive: boolean;
};

/** 세부업종 매핑 조회. specialtyId 우선, 없으면 categoryId 대표값 폴백. */
export function getSpecialtyTaxMapping(specialtyId?: string | null, categoryId?: string | null): SpecialtyTaxMapping | null {
  if (specialtyId) {
    const exact = SPECIALTY_TAX_MAPPINGS.find((m) => m.specialtyId === specialtyId);
    if (exact) return exact;
  }
  if (categoryId) {
    return SPECIALTY_TAX_MAPPINGS.find((m) => m.categoryId === categoryId) ?? null;
  }
  return null;
}

/** eligible/likely 만 "받을 가능성 있음"으로 취급 (check/excluded 는 카드 비노출·확인안내). */
export function isReductionSurfaced(level: EligibilityLevel): boolean {
  return level === "eligible" || level === "likely";
}

/**
 * 창업중소기업 세액감면(§6)은 창업 후 5년 이내 과세연도만 유효 — 개업일로 게이트.
 *  ⚠️ 2026-07-22 냉정리뷰 결함 수정: 종전엔 게이트 없이 매핑만 보고 노출 →
 *     창업 10년차에게도 "창업감면 대상"이라 뜨는 오분류. 개업일 있으면 5년 초과 시 비노출.
 *  개업일 미상이면 보수적으로 true(문구에 "5년 이내" 조건 병기) — 확정은 홈택스.
 */
export function isStartupReductionActive(launchDateISO?: string | null, now: Date = new Date()): boolean {
  if (!launchDateISO) return true;
  const launch = new Date(launchDateISO);
  if (isNaN(launch.getTime())) return true;
  const deadline = new Date(launch);
  deadline.setFullYear(launch.getFullYear() + 5);
  return now <= deadline;
}

/**
 * 연매출 추정 (웹·iOS 통일 SSOT) — 최근 영업일 매출 평균 × 26영업일 × 12개월.
 *  ⚠️ 2026-07-22 냉정리뷰 결함 수정: 종전 웹(MTD 일평균×365) ≠ iOS(monthlyAvgRevenue×12)로
 *     같은 사용자가 다른 연매출·부가세를 봄. iOS monthlyAvgRevenue(=최근7평균×26) 산정과 일치시킴.
 *  @param recentDailySales 0 초과인 최근 매출 기록(최대 7개 사용). 없으면 0.
 */
export function estimateAnnualRevenueWon(recentDailySales: number[]): number {
  const recent = recentDailySales.filter((s) => s > 0).slice(-7);
  if (recent.length === 0) return 0;
  const avgDaily = recent.reduce((s, v) => s + v, 0) / recent.length;
  return Math.round(avgDaily * 26 * 12);
}
