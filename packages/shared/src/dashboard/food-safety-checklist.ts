/**
 * 식약처 음식점 자율 위생점검 체크리스트.
 *
 * 출처: 식품의약품안전처 위생등급제 매뉴얼 (https://www.foodsafetykorea.go.kr/)
 *   - "매우 우수" 97항목 / "우수" 86항목 / "좋음" 71항목 기반
 *   - 핵심 항목 22개를 일별·주별·월별·서류별로 분류 (사장님 부담 최소화)
 *   - 점수 기준: 매우 우수 90점+ / 우수 85점+ / 좋음 80점+
 *
 * 적용 대상: 휴게음식점·일반음식점·제과점 (휴게/일반: food, 제과점: cafe-dessert)
 *
 * 데이터 소스 = 정적 (오픈데이터). 비용 0원.
 */

export type FoodSafetyCheckCategory =
  | "documents"     // 필수 서류 (영업신고증·위생교육·보건증) — 만료 추적
  | "daily"         // 매일 점검 (개점 전·마감 후)
  | "weekly"        // 주간 점검
  | "monthly"       // 월간 점검
  | "facility";     // 시설 (조리장·화장실·객석)

export type FoodSafetyFrequency = "daily" | "weekly" | "monthly" | "annual" | "biannual";

export type FoodSafetyCheckItem = {
  id: string;
  category: FoodSafetyCheckCategory;
  frequency: FoodSafetyFrequency;
  /** 항목 점수 (식약처 매뉴얼 가중치 — 합계 100점 정렬) */
  weight: number;
  labelKo: string;
  labelEn: string;
  /** 식약처 매뉴얼 인용/근거 — 사장님이 "왜 이걸?" 물을 때 즉답 */
  rationaleKo: string;
  rationaleEn: string;
  /** 위반 시 처분 (식품위생법) — 경각심 유도 */
  penaltyKo?: string;
  /** 휴게음식점만 / 일반음식점만 등 분기. undefined = 모두 적용 */
  appliesTo?: Array<"food" | "cafe-dessert">;
};

/**
 * 핵심 22개 항목 (식약처 매우우수 97항목 중 점수 가중 큰 것 위주 + 사장님이 매일 자주 놓치는 것).
 *
 * 점수 가중치 정합성: weight 합 = 100.
 */
export const FOOD_SAFETY_CHECKLIST: FoodSafetyCheckItem[] = [
  // ─── A. 필수 서류 (만료 추적 필수) ──────────────────────────
  {
    id: "biz-license-posted",
    category: "documents",
    frequency: "annual",
    weight: 4,
    labelKo: "영업신고증 게시",
    labelEn: "Business license posted",
    rationaleKo: "식품위생법 시행규칙 — 영업장 잘 보이는 곳에 게시 의무",
    rationaleEn: "Required by Food Sanitation Act",
    penaltyKo: "1차 시정명령 → 2차 영업정지 7일",
  },
  {
    id: "hygiene-edu-cert",
    category: "documents",
    frequency: "annual",
    weight: 6,
    labelKo: "위생교육 수료증 (대표·종업원 매년)",
    labelEn: "Hygiene education cert (annual)",
    rationaleKo: "식품위생법 — 매년 6시간 교육 의무. 미이수 시 과태료",
    rationaleEn: "Annual mandatory training",
    penaltyKo: "과태료 20–50만원",
  },
  {
    id: "health-cert",
    category: "documents",
    frequency: "annual",
    weight: 6,
    labelKo: "건강진단결과서 (보건증) — 모든 종사자 매년",
    labelEn: "Health cert (all staff, annual)",
    rationaleKo: "식품위생법 — 모든 식품 취급자 보건증 의무. 미보유 시 즉시 영업정지 가능",
    rationaleEn: "All food handlers — annual",
    penaltyKo: "1차 30만원 → 2차 60만원 → 3차 영업정지",
  },
  {
    id: "haccp-cert",
    category: "documents",
    frequency: "biannual",
    weight: 2,
    labelKo: "HACCP 인증 (해당 시)",
    labelEn: "HACCP certification (if applicable)",
    rationaleKo: "선택 인증 — 위생등급제 추가 점수",
    rationaleEn: "Optional — bonus points",
  },

  // ─── B. 일별 점검 (매일 개점 전 / 마감 후) ──────────────────────
  {
    id: "fridge-temp",
    category: "daily",
    frequency: "daily",
    weight: 8,
    labelKo: "냉장 5°C 이하 / 냉동 -18°C 이하 확인",
    labelEn: "Fridge ≤5°C / Freezer ≤-18°C",
    rationaleKo: "식약처 핵심 점검 항목 — 단속 1순위. 온도 일지 권장",
    rationaleEn: "Top inspection priority",
    penaltyKo: "1차 시정명령 → 2차 영업정지 7일",
  },
  {
    id: "expiry-check",
    category: "daily",
    frequency: "daily",
    weight: 8,
    labelKo: "유통기한 만료 식자재 폐기",
    labelEn: "Discard expired ingredients",
    rationaleKo: "유통기한 경과 보관·사용 = 식품위생법 위반",
    rationaleEn: "Storing expired = violation",
    penaltyKo: "영업정지 15일 + 과태료",
  },
  {
    id: "handwash",
    category: "daily",
    frequency: "daily",
    weight: 4,
    labelKo: "종업원 손씻기 / 위생복·앞치마 착용",
    labelEn: "Staff handwash + uniform",
    rationaleKo: "식약처 매뉴얼 기본 — 손씻기 표지 부착 권장",
    rationaleEn: "Hand-wash signage required",
  },
  {
    id: "knife-board-separate",
    category: "daily",
    frequency: "daily",
    weight: 5,
    labelKo: "도마·칼 식재료별 분리 (생고기 / 채소 / 익힌 음식)",
    labelEn: "Cutting board separation (raw/cooked/veg)",
    rationaleKo: "교차오염 방지 — 색깔별 도마 권장",
    rationaleEn: "Cross-contamination prevention",
  },
  {
    id: "kitchen-clean",
    category: "daily",
    frequency: "daily",
    weight: 4,
    labelKo: "조리대·바닥·싱크대 청소",
    labelEn: "Counter/floor/sink clean",
    rationaleKo: "마감 후 매일 청소 — 점검 시 즉시 확인 항목",
    rationaleEn: "Daily after-close cleaning",
  },
  {
    id: "trash-managed",
    category: "daily",
    frequency: "daily",
    weight: 3,
    labelKo: "음식물쓰레기·일반쓰레기 분리 + 뚜껑",
    labelEn: "Waste separated with lid",
    rationaleKo: "벌레·악취 방지. 뚜껑 없는 통 = 감점",
    rationaleEn: "Lidded bins required",
  },
  {
    id: "drinking-water",
    category: "daily",
    frequency: "daily",
    weight: 3,
    labelKo: "음용수 관리 (정수기 필터·물 끓임)",
    labelEn: "Drinking water management",
    rationaleKo: "정수기 필터 교체 주기 확인. 지하수 사용 시 별도 검사",
    rationaleEn: "Filter cycle / well-water test",
  },

  // ─── C. 주간 점검 ──────────────────────────────────────────
  {
    id: "hood-grease",
    category: "weekly",
    frequency: "weekly",
    weight: 5,
    labelKo: "후드·환기시설 기름때 청소",
    labelEn: "Hood/vent grease clean",
    rationaleKo: "화재 1순위 원인 + 위생 감점. 주 1회 권장",
    rationaleEn: "Fire risk + hygiene",
  },
  {
    id: "dishwasher-temp",
    category: "weekly",
    frequency: "weekly",
    weight: 4,
    labelKo: "식기세척기 살균 온도 (75°C 이상) 또는 살균 소독",
    labelEn: "Dishwasher 75°C+ sterilize",
    rationaleKo: "식기 살균 — 끓는물 1분 이상 또는 락스 200ppm",
    rationaleEn: "Boil 1min OR bleach 200ppm",
  },
  {
    id: "pest-check",
    category: "weekly",
    frequency: "weekly",
    weight: 4,
    labelKo: "방충·방서 (바퀴·쥐) 흔적 확인",
    labelEn: "Pest inspection",
    rationaleKo: "흔적 발견 시 즉시 방제 — 발견 시 영업정지 직결",
    rationaleEn: "Immediate pest control if found",
    penaltyKo: "영업정지 7일+",
  },

  // ─── D. 월간 점검 ──────────────────────────────────────────
  {
    id: "freezer-defrost",
    category: "monthly",
    frequency: "monthly",
    weight: 3,
    labelKo: "냉장·냉동고 성에 제거 + 내부 청소",
    labelEn: "Fridge/freezer defrost+clean",
    rationaleKo: "온도 효율 + 위생. 월 1회 권장",
    rationaleEn: "Temp efficiency + hygiene",
  },
  {
    id: "supplier-cert",
    category: "monthly",
    frequency: "monthly",
    weight: 4,
    labelKo: "식자재 공급처 위생 증명 확인",
    labelEn: "Supplier hygiene cert review",
    rationaleKo: "공급처 등록 + 신선도 보증서 보관",
    rationaleEn: "Verified supplier registry",
  },
  {
    id: "fire-extinguisher",
    category: "monthly",
    frequency: "monthly",
    weight: 2,
    labelKo: "소화기 압력 게이지 정상 + 유효기간",
    labelEn: "Fire extinguisher OK",
    rationaleKo: "소방법 — 유효기간 만료 시 교체",
    rationaleEn: "Fire safety law",
  },

  // ─── E. 시설 (상시 유지) ────────────────────────────────────
  {
    id: "restroom-clean",
    category: "facility",
    frequency: "daily",
    weight: 5,
    labelKo: "화장실 청결 + 손씻기 비누·휴지",
    labelEn: "Restroom clean + soap/paper",
    rationaleKo: "고객 만족도 + 위생점검 필수 항목",
    rationaleEn: "Customer + inspector check",
  },
  {
    id: "lighting-ventilation",
    category: "facility",
    frequency: "weekly",
    weight: 3,
    labelKo: "조명 · 환기 적정 (조리장 220 lux 이상)",
    labelEn: "Lighting/vent adequate",
    rationaleKo: "조리장 조도 부족 = 위생점검 감점",
    rationaleEn: "Kitchen lighting standard",
  },
  {
    id: "no-pest-entry",
    category: "facility",
    frequency: "weekly",
    weight: 3,
    labelKo: "출입구 방충망 / 문틈 차단",
    labelEn: "Pest entry blocked",
    rationaleKo: "방충망 파손 시 즉시 수리",
    rationaleEn: "Repair damaged screens",
  },
  {
    id: "allergen-display",
    category: "facility",
    frequency: "monthly",
    weight: 4,
    labelKo: "알레르기 유발 식품 표시 (메뉴판 또는 푯말)",
    labelEn: "Allergen labeling on menu",
    rationaleKo: "식약처 의무 표시 — 22개 알레르기 유발물질",
    rationaleEn: "Mandatory 22 allergens",
    penaltyKo: "과태료 50만원",
  },
  {
    id: "no-smoking",
    category: "facility",
    frequency: "monthly",
    weight: 2,
    labelKo: "금연 표지 부착 + 흡연구역 분리",
    labelEn: "No-smoking sign + zone",
    rationaleKo: "국민건강증진법 — 모든 음식점 금연",
    rationaleEn: "All restaurants smoke-free",
    penaltyKo: "과태료 170만원",
  },
];

// 카테고리 라벨
export const CATEGORY_LABELS: Record<FoodSafetyCheckCategory, { ko: string; en: string }> = {
  documents: { ko: "필수 서류", en: "Documents" },
  daily: { ko: "매일 점검", en: "Daily" },
  weekly: { ko: "주간 점검", en: "Weekly" },
  monthly: { ko: "월간 점검", en: "Monthly" },
  facility: { ko: "시설 상시", en: "Facility" },
};

// 등급 평가
export type FoodSafetyGrade = "excellent" | "good" | "fair" | "poor";

export function calculateFoodSafetyGrade(scorePct: number): FoodSafetyGrade {
  if (scorePct >= 90) return "excellent";  // 매우 우수
  if (scorePct >= 85) return "good";        // 우수
  if (scorePct >= 80) return "fair";        // 좋음
  return "poor";                              // 미달
}

export const GRADE_LABELS: Record<FoodSafetyGrade, { ko: string; en: string; color: string }> = {
  excellent: { ko: "매우 우수 (90점+)", en: "Excellent (90+)", color: "#1F46A8" },
  good:      { ko: "우수 (85점+)",       en: "Good (85+)",      color: "#3B5BBF" },
  fair:      { ko: "좋음 (80점+)",       en: "Fair (80+)",      color: "#D69121" },
  poor:      { ko: "기준 미달",           en: "Below standard",  color: "#B42334" },
};

// 적용 가능 업종 필터
export function filterByCategory(
  industryCategoryId: string | null | undefined,
): FoodSafetyCheckItem[] {
  if (industryCategoryId !== "food" && industryCategoryId !== "cafe-dessert") return [];
  const cat = industryCategoryId as "food" | "cafe-dessert";
  return FOOD_SAFETY_CHECKLIST.filter(
    (item) => !item.appliesTo || item.appliesTo.includes(cat),
  );
}
