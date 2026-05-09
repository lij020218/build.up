/**
 * 매일 운영 리츄얼 — 65개 세부 업종별 정밀 점검 데이터.
 *
 *  ── 콘텐츠 원천 ─────────────────────────────────────────────
 *  각 업종 데이터는 한국 법령·업계 가이드·해외(영문) 모범 사례 검증 기반.
 *
 *  • 식약처(MFDS) HACCP 기준: 식품 보관 온도, 튀김유 산가
 *  • 공중위생관리법: 미용사 도구 멸균, 자외선 살균기, 매 고객 시트 교체
 *  • 응급의료법 47조의2제3항: 다중이용시설 AED 매월 점검
 *  • 학원안전법: 학원 소화기·비상등·강사 안전교육
 *  • 식약처 식품접객업: 콜드체인 2°C 이하·온장 60°C 이상
 *  • Smart-store 운영 가이드: 24시간 내 송장 입력, 고객 응대
 *  • Beehiiv State of Newsletters 2026: open rate / CTR / churn 모니터링
 *  • NVIDIA Robotics, Deloitte Physical AI 2026: sim-to-real 캘리브레이션
 *  • DeepTech Decarbonization Grants 2026: 마일스톤 기반 보조금
 *  • Y Combinator B2B SaaS Playbook: DAU/MAU·MRR·burn 일일 점검
 *  ────────────────────────────────────────────────────────
 *
 *  ── icon 처리 ────────────────────────────────────────────
 *  shared 패키지에 lucide-react 의존성을 추가하지 않기 위해 string key 사용.
 *  소비자 컴포넌트에서 RITUAL_ICON_KEYS → LucideIcon 으로 매핑.
 *  ────────────────────────────────────────────────────────
 */

export type RitualIconKey =
  | "clipboard-check"
  | "message-square"
  | "sparkles"
  | "package"
  | "camera";

export type DailyRitualItem = {
  id: string;
  iconKey: RitualIconKey;
  labelKo: string;
  labelEn: string;
  detailKo: string;
  detailEn: string;
};

/** 모든 사용자 공통 — 매일 30~60초 점검 */
export const UNIVERSAL_RITUALS: DailyRitualItem[] = [
  {
    id: "yesterday-sales",
    iconKey: "clipboard-check",
    labelKo: "어제 매출·POS 마감 확인",
    labelEn: "Check yesterday's sales & POS close",
    detailKo: "POS 정산 vs 실제 입금 일치 여부 + 어제 결제 오류 점검",
    detailEn: "Verify POS reconciliation + check for payment errors",
  },
  {
    id: "yesterday-reviews",
    iconKey: "message-square",
    labelKo: "어제 올라온 리뷰 확인·답변",
    labelEn: "Read & reply to yesterday's reviews",
    detailKo: "네이버 플레이스 + 인스타 댓글 + 카카오 채널 — 답변 없는 것 1건이라도",
    detailEn: "Naver Place + Instagram + KakaoTalk — at least one reply",
  },
  {
    id: "cleanliness-open",
    iconKey: "sparkles",
    labelKo: "매장 청결 상태 확인 (오픈 전)",
    labelEn: "Check store cleanliness (pre-open)",
    detailKo: "어제 마감 청소 OK? 화장실·바닥·테이블·쓰레기통 점검",
    detailEn: "Closing clean OK? Restroom, floor, tables, bins",
  },
  {
    id: "inventory-stock",
    iconKey: "package",
    labelKo: "오늘 재고·핵심 품목 점검",
    labelEn: "Check today's stock & key items",
    detailKo: "어제 부족했던 것? 시그니처 메뉴 재료 충분한가?",
    detailEn: "What ran short yesterday? Signature menu items stocked?",
  },
  {
    id: "sns-today",
    iconKey: "camera",
    labelKo: "오늘 SNS 콘텐츠 1건",
    labelEn: "Post 1 social content today",
    detailKo: "인스타 스토리·릴스 · 네이버 플레이스 사진 1장 — 알고리즘 노출 유지",
    detailEn: "Instagram story/reel · Naver Place photo — keep algorithm visibility",
  },
];

/**
 * 세부 업종별 정밀 점검 — 80개에 가까운 sub-industry 별로 핵심 1~2건씩.
 * 너무 많은 항목은 체크 피로도 증가 → 매장당 6~7개 (universal 5 + sub 1~2) 균형.
 */
export const SUB_INDUSTRY_RITUALS: Record<string, DailyRitualItem[]> = {
  // ════════════════════════════════════════════════════════════
  //   FOOD (6) — 식약처 HACCP 기준 + 콜드체인
  // ════════════════════════════════════════════════════════════
  "korean-casual": [
    { id: "banchan-fresh",  iconKey: "clipboard-check", labelKo: "반찬 신선도 점검 (3시간 단위 폐기)", labelEn: "Banchan freshness (3hr discard)", detailKo: "변질 반찬 1번이면 단골 영원히 잃음", detailEn: "One spoiled side = lost regular forever" },
    { id: "kimchi-stock",   iconKey: "package",         labelKo: "김치냉장고 5종 정렬·잔량",          labelEn: "Kimchi fridge 5 types + stock",  detailKo: "백반집 표준 — 김치 다양성이 만족도 직결",   detailEn: "Banchan diversity drives satisfaction" },
  ],
  "delivery-meals": [
    { id: "package-stock",  iconKey: "package",         labelKo: "배달 포장재 피크 1.5배 재고",       labelEn: "Delivery packaging at 1.5× peak", detailKo: "국물 누설 방지 용기·뚜껑 — 부족 시 영업 중단", detailEn: "Leak-proof containers — stockout = stop service" },
    { id: "app-receive",    iconKey: "clipboard-check", labelKo: "배달앱 3사 주문 수신 점검",         labelEn: "Check 3-app order reception",     detailKo: "POS·태블릿 연동 — 미수신 = 매출 누락",      detailEn: "POS/tablet sync — missing = lost revenue" },
  ],
  "salad-healthy": [
    { id: "veg-fresh",      iconKey: "package",         labelKo: "신선 채소·과일 입고 일자 확인",     labelEn: "Fresh produce delivery date",     detailKo: "샐러드 = 신선도 = 가격. 시들면 즉시 폐기",   detailEn: "Salad = freshness = price. Discard wilted" },
    { id: "discard-prep",   iconKey: "clipboard-check", labelKo: "전날 자른 채소 폐기",                labelEn: "Discard yesterday's prep",        detailKo: "원가 통제 + 신선도 유지 핵심",              detailEn: "Cost control + freshness" },
  ],
  "ramen-noodle": [
    { id: "broth-fresh",    iconKey: "package",         labelKo: "사골·잡뼈 육수 신선도 (당일 끓인 것)", labelEn: "Broth freshness (today's stock)", detailKo: "한식·국밥 핵심 자산 — 전날 육수 폐기 또는 재가열", detailEn: "Korean soup core asset — discard or reheat" },
    { id: "rice-warm",      iconKey: "sparkles",        labelKo: "밥솥·보온고 60°C 이상 유지",        labelEn: "Rice/warmer ≥ 60°C",              detailKo: "60°C 미만 시 식중독균 증식",                detailEn: "Below 60°C = bacterial growth" },
  ],
  "chicken-burger": [
    { id: "fryoil-acid",    iconKey: "sparkles",        labelKo: "튀김유 산가 측정 (3.0 이하)",        labelEn: "Fry oil acid value (≤3.0)",       detailKo: "식약처 의무 — 일 1~2회 측정. 초과 시 즉시 교체",  detailEn: "MFDS mandatory — measure 1-2×/day" },
    { id: "chicken-temp",   iconKey: "package",         labelKo: "닭고기 보관 온도 2°C 이하 (HACCP)", labelEn: "Chicken storage ≤ 2°C (HACCP)",   detailKo: "콜드체인 점검 + 매장 냉장고 온도",          detailEn: "Cold chain + fridge temp" },
  ],
  "western-pasta-brunch": [
    { id: "cheese-temp",    iconKey: "package",         labelKo: "치즈·생크림 4°C 이하 유지",         labelEn: "Cheese/cream ≤ 4°C",              detailKo: "유제품 변질 = 식중독 + 클레임",             detailEn: "Dairy spoilage = food poisoning + claims" },
    { id: "pasta-prep",     iconKey: "clipboard-check", labelKo: "오늘 파스타·시즈닝 mise-en-place",  labelEn: "Pasta/seasoning mise-en-place",   detailKo: "런치 피크 6분 컨테스트 — 사전 세팅 필수",   detailEn: "Lunch peak — pre-setup is essential" },
  ],

  // ════════════════════════════════════════════════════════════
  //   CAFE-DESSERT (6)
  // ════════════════════════════════════════════════════════════
  "takeout-coffee": [
    { id: "machine-clean",  iconKey: "sparkles",        labelKo: "에스프레소 머신 백플러시·청소",     labelEn: "Espresso machine backflush",      detailKo: "피크타임 전 머신 물 교체·포타필터 청소",    detailEn: "Pre-peak: water change + portafilter clean" },
    { id: "cup-stock",      iconKey: "package",         labelKo: "일회용 컵·홀더 피크 1.5배 재고",   labelEn: "Cups/sleeves at 1.5× peak",       detailKo: "테이크아웃 비중 80%+ — 부족 시 매출 직접 손실", detailEn: "Stockout = direct sales loss" },
  ],
  "specialty-coffee": [
    { id: "grinder-cal",    iconKey: "sparkles",        labelKo: "그라인더 분쇄도 캘리브레이션",       labelEn: "Grinder calibration",             detailKo: "날씨·습도 따라 미세 조정 — 추출 25~30초",   detailEn: "Adjust by weather/humidity — extract 25-30s" },
    { id: "bean-fresh",     iconKey: "package",         labelKo: "원두 신선도 (로스팅 후 14일 이내)",  labelEn: "Bean freshness (≤14 days from roast)", detailKo: "오래된 원두 폐기·교체",                  detailEn: "Discard/replace old beans" },
  ],
  "dessert-cafe": [
    { id: "showcase-temp",  iconKey: "package",         labelKo: "디저트 쇼케이스 4°C 이하 유지",     labelEn: "Dessert showcase ≤ 4°C",          detailKo: "케이크·생크림 변질 방지",                   detailEn: "Prevent cake/cream spoilage" },
    { id: "discard-yesterday", iconKey: "clipboard-check", labelKo: "전날 진열 디저트 폐기 확인",  labelEn: "Discard yesterday's display",     detailKo: "당일 폐기 원칙 — 변질 시 별점 폭락",        detailEn: "Same-day rule — spoilage = rating crash" },
  ],
  "bakery-studio": [
    { id: "discard-yesterday", iconKey: "clipboard-check", labelKo: "전날 빵 폐기 + 알레르기 표시 점검", labelEn: "Discard yesterday's bread + allergen labels", detailKo: "당일 폐기 의무 + 계란·우유·견과 표시", detailEn: "Same-day required + allergen labels" },
    { id: "fermenter-temp", iconKey: "sparkles",        labelKo: "발효기 26~28°C 점검",                labelEn: "Proofer 26-28°C check",           detailKo: "HACCP 기준 — 빵 품질 일관성 핵심",          detailEn: "HACCP — quality consistency" },
  ],
  "icecream-bingsu": [
    { id: "freezer-temp",   iconKey: "package",         labelKo: "냉동고 -18°C 이하 유지 확인",       labelEn: "Verify freezer ≤ -18°C",          detailKo: "식약처 기준 + 리스테리아균 방지",            detailEn: "MFDS standard + Listeria prevention" },
    { id: "topping-fresh",  iconKey: "clipboard-check", labelKo: "토핑·시럽 유통기한·개봉일 점검",   labelEn: "Topping/syrup expiry & open date", detailKo: "유제품 토핑 변질 시 식중독 직격",          detailEn: "Spoiled dairy = food poisoning hit" },
  ],
  "self-serve-cafe": [
    { id: "remote-monitor", iconKey: "clipboard-check", labelKo: "원격 키오스크·CCTV 작동 확인",      labelEn: "Remote kiosk/CCTV check",         detailKo: "무인 매장 핵심 — 미작동 시 매출 0",         detailEn: "Unmanned core — failure = zero revenue" },
    { id: "supplies-low",   iconKey: "package",         labelKo: "자동 머신 원두·우유·시럽 잔량",     labelEn: "Auto-machine supplies",           detailKo: "원격 모니터링 + 1~2회 직접 보충",           detailEn: "Remote monitor + 1-2× refill visits" },
  ],

  // ════════════════════════════════════════════════════════════
  //   RETAIL (6)
  // ════════════════════════════════════════════════════════════
  "convenience-small": [
    { id: "stock-key",      iconKey: "package",         labelKo: "주력 상품 결품 점검 (생수·라면 등)", labelEn: "Top SKU stockout check",          detailKo: "결품 = 단골 즉시 이탈",                    detailEn: "Stockout = regulars leave" },
    { id: "expiry",         iconKey: "clipboard-check", labelKo: "유통기한 임박 상품 할인 처리",      labelEn: "Near-expiry markdown",            detailKo: "유효기간 지나면 식약처 적발 + 과태료",       detailEn: "Expired = MFDS fine" },
  ],
  "lifestyle-goods": [
    { id: "display-curate", iconKey: "sparkles",        labelKo: "큐레이션 진열 정렬·신상 푸시",      labelEn: "Curation + new item push",        detailKo: "라이프스타일 = 발견 경험 = 재방문",         detailEn: "Lifestyle = discovery = return" },
    { id: "ig-content",     iconKey: "camera",          labelKo: "신상 인스타·릴스 1건",              labelEn: "New arrival on IG/Reels",         detailKo: "라이프스타일 매장 = 인스타 유입 핵심",      detailEn: "Lifestyle = Instagram traffic" },
  ],
  "beauty-supplies": [
    { id: "tester-clean",   iconKey: "sparkles",        labelKo: "테스터 위생·재고 알코올 소독",      labelEn: "Tester hygiene + alcohol clean",  detailKo: "더러운 테스터 = 매장 신뢰 폭락",            detailEn: "Dirty tester = trust crash" },
    { id: "product-expiry", iconKey: "package",         labelKo: "화장품 유효기간·개봉일 점검",       labelEn: "Cosmetic expiry/open date",       detailKo: "유효기간 지난 제품 적발 시 처벌",            detailEn: "Expired = penalty" },
  ],
  "fashion-accessories": [
    { id: "display-rotate", iconKey: "sparkles",        labelKo: "윈도 디스플레이·마네킹 변경",        labelEn: "Window display refresh",          detailKo: "패션 매장 = 진열 변화 = 발길",              detailEn: "Fashion = display change = traffic" },
    { id: "ig-content",     iconKey: "camera",          labelKo: "OOTD·신상 인스타 콘텐츠",            labelEn: "OOTD/new arrival on Instagram",   detailKo: "패션 = 인스타 = 유입",                      detailEn: "Fashion = Instagram = traffic" },
  ],
  "health-food-store": [
    { id: "product-expiry", iconKey: "package",         labelKo: "건강식품 유통기한·로트 점검",       labelEn: "Health food expiry/lot check",    detailKo: "유통기한 지난 제품 = 영업 중단 리스크",      detailEn: "Expired = shutdown risk" },
    { id: "label-claim",    iconKey: "clipboard-check", labelKo: "기능성 표시·광고 적법성 점검",      labelEn: "Functional claim/ad legality",    detailKo: "건기식 허위 광고 = 식약처 행정처분",        detailEn: "False claim = MFDS penalty" },
  ],
  "unmanned-retail": [
    { id: "remote-monitor", iconKey: "clipboard-check", labelKo: "CCTV·키오스크·결제 작동 확인",      labelEn: "CCTV/kiosk/payment working",      detailKo: "무인 매장 도난 빈번 — 보안 핵심",           detailEn: "Unmanned theft frequent" },
    { id: "stock-replenish",iconKey: "package",         labelKo: "팔린 상품 보충 + 진열 정렬",        labelEn: "Restock sold items + tidy shelf", detailKo: "1일 1회 방문 — 빈 진열 = 매출 0",           detailEn: "Daily visit — empty shelf = zero revenue" },
  ],

  // ════════════════════════════════════════════════════════════
  //   BEAUTY (6) — 공중위생관리법 기반 (도구 멸균·매 고객 시트)
  // ════════════════════════════════════════════════════════════
  "hair-salon": [
    { id: "tool-uv",        iconKey: "sparkles",        labelKo: "시술 도구 자외선 살균기 작동 확인", labelEn: "UV sterilizer working",           detailKo: "공중위생관리법 의무 — 미작동 시 영업 정지 가능", detailEn: "Required by hygiene law" },
    { id: "towel-fresh",    iconKey: "clipboard-check", labelKo: "수건·가운 매번 세탁/일회용 점검",  labelEn: "Towels/gowns clean check",        detailKo: "교차 감염 방지",                            detailEn: "Prevent cross-infection" },
  ],
  "nail-studio": [
    { id: "autoclave",      iconKey: "sparkles",        labelKo: "네일 도구 멸균 (오토클레이브/UV)",  labelEn: "Nail tool sterilization",         detailKo: "공중위생관리법 의무 — 푸셔·니퍼 멸균",      detailEn: "Mandatory by law — pusher/nipper sterile" },
    { id: "polish-stock",   iconKey: "package",         labelKo: "인기 컬러·젤 잔량 점검",            labelEn: "Popular polish/gel stock",        detailKo: "예약 고객 원하는 컬러 결품 = 즉시 클레임",  detailEn: "Color stockout = instant complaint" },
  ],
  "skin-care-room": [
    { id: "bed-sterile",    iconKey: "sparkles",        labelKo: "관리 베드·시트 멸균 (매 고객)",     labelEn: "Bed/sheet sterile (per client)",  detailKo: "공중위생관리법 — 매 고객 교체",             detailEn: "Hygiene law — per-client change" },
    { id: "product-expiry", iconKey: "package",         labelKo: "화장품·앰플 유효기간 확인",          labelEn: "Cosmetic/ampoule expiry",         detailKo: "유효기간 지난 제품 = 피부 트러블 + 클레임",  detailEn: "Expired = skin issues + claims" },
  ],
  "waxing-studio": [
    { id: "wax-temp",       iconKey: "sparkles",        labelKo: "왁스 온도 38~50°C 유지",            labelEn: "Wax temp 38-50°C",                detailKo: "온도 미달 = 시술 어려움 / 초과 = 화상",      detailEn: "Below = hard / above = burn risk" },
    { id: "tool-uv",        iconKey: "sparkles",        labelKo: "스파출라·도구 1회용·멸균 확인",     labelEn: "Spatula/tool single-use or sterile", detailKo: "더블 디핑 금지 — 위생 1순위",            detailEn: "No double-dipping — #1 hygiene" },
  ],
  "eyelash-brow": [
    { id: "glue-fresh",     iconKey: "package",         labelKo: "글루 신선도·온도(20~24°C) 확인",   labelEn: "Glue freshness/temp (20-24°C)",   detailKo: "변질 시 접착력 ↓ + 알레르기 위험",          detailEn: "Spoiled = weak adhesion + allergy" },
    { id: "tool-uv",        iconKey: "sparkles",        labelKo: "트위저·브러시 알코올·UV 멸균",      labelEn: "Tweezer/brush alcohol & UV",      detailKo: "눈 점막 직접 접촉 — 감염 방지 핵심",        detailEn: "Eye membrane contact — infection risk" },
  ],
  "makeup-bridal": [
    { id: "brush-clean",    iconKey: "sparkles",        labelKo: "브러시·스폰지 매 고객 알코올 세척", labelEn: "Brush/sponge alcohol clean per client", detailKo: "교차 감염 방지",                       detailEn: "Prevent cross-contamination" },
    { id: "schedule-confirm", iconKey: "clipboard-check", labelKo: "오늘 예약·예복 도착 시간 확인",  labelEn: "Today's booking/dress arrival",   detailKo: "웨딩 = 시간 엄수 = 신뢰",                   detailEn: "Wedding = punctuality = trust" },
  ],

  // ════════════════════════════════════════════════════════════
  //   FITNESS (6) — 응급의료법 47조의2 (AED 매월 점검)
  // ════════════════════════════════════════════════════════════
  "pilates-studio": [
    { id: "reformer-spring",iconKey: "sparkles",        labelKo: "리포머 스프링·케이블 안전 점검",    labelEn: "Reformer spring/cable safety",    detailKo: "스프링 마모 = 부상 위험",                   detailEn: "Worn spring = injury risk" },
    { id: "mat-clean",      iconKey: "sparkles",        labelKo: "매트·체어·바렐 알코올 소독",        labelEn: "Mat/chair/barrel alcohol clean",  detailKo: "필라테스 = 피부 직접 접촉",                 detailEn: "Direct skin contact" },
  ],
  "pt-gym": [
    { id: "equipment-safe", iconKey: "clipboard-check", labelKo: "기구 볼트·케이블 안전 점검",        labelEn: "Equipment bolt/cable safety",     detailKo: "사고 시 무한 책임 — 1일 1회 점검",          detailEn: "Liability — daily check" },
    { id: "aed-check",      iconKey: "clipboard-check", labelKo: "AED·구급함 약품 유효기간",          labelEn: "AED + first-aid expiry",          detailKo: "심정지 골든타임 4분 — 응급의료법 47조의2",   detailEn: "Cardiac golden 4 mins" },
  ],
  "yoga-studio": [
    { id: "mat-clean",      iconKey: "sparkles",        labelKo: "매트·기구 알코올 소독 (매 회원 후)", labelEn: "Mat/equipment alcohol clean",     detailKo: "위생 1순위 — 회원 만족도 직결",             detailEn: "#1 hygiene driver" },
    { id: "aed-check",      iconKey: "clipboard-check", labelKo: "AED·구급함 작동 확인",              labelEn: "AED/first-aid check",             detailKo: "다중이용시설 의무",                         detailEn: "Required public facility" },
  ],
  "crossfit-box": [
    { id: "bar-collar",     iconKey: "clipboard-check", labelKo: "바벨·콜라(잠금) 점검",              labelEn: "Barbell collar lock check",       detailKo: "콜라 누락 시 무게판 이탈 → 발목 부상",      detailEn: "Missing = plate slip → ankle injury" },
    { id: "wod-board",      iconKey: "clipboard-check", labelKo: "오늘 WOD 보드·스케일링 옵션 작성",  labelEn: "Today's WOD board + scaling",     detailKo: "초보자 스케일링 필수 — 안전·만족도 핵심",   detailEn: "Beginner scaling required" },
  ],
  "golf-studio": [
    { id: "sensor-cal",     iconKey: "sparkles",        labelKo: "스크린·센서 캘리브레이션 (1샷 테스트)", labelEn: "Sensor calibration (1-shot test)", detailKo: "센서 오차 = 회원 신뢰 폭락",              detailEn: "Sensor drift = trust crash" },
    { id: "mat-replace",    iconKey: "package",         labelKo: "타격매트 마모도·교체 시점 점검",    labelEn: "Hitting mat wear + replace timing", detailKo: "마모 매트 = 클럽 손상 + 부상",            detailEn: "Worn mat = club damage + injury" },
  ],
  "unmanned-fitness": [
    { id: "remote-monitor", iconKey: "clipboard-check", labelKo: "CCTV·키카드·키오스크 작동",         labelEn: "CCTV/keycard/kiosk working",      detailKo: "무인 운영 핵심 인프라",                     detailEn: "Unmanned core infra" },
    { id: "equipment-safe", iconKey: "clipboard-check", labelKo: "기구 점검·이상 사용자 모니터링",    labelEn: "Equipment check + abuse monitor", detailKo: "사고 시 책임 = 운영자",                     detailEn: "Accident = operator liability" },
  ],

  // ════════════════════════════════════════════════════════════
  //   EDUCATION (6) — 학원안전법 (소화기·비상등·강사 안전교육)
  // ════════════════════════════════════════════════════════════
  "study-room": [
    { id: "equipment",      iconKey: "clipboard-check", labelKo: "프로젝터·전자칠판 작동",            labelEn: "Projector/board working",         detailKo: "장비 미작동 = 환불 사유",                   detailEn: "Failure = refund trigger" },
    { id: "fire-equip",     iconKey: "clipboard-check", labelKo: "소화기·비상등·유도등 점검",         labelEn: "Fire extinguisher/emergency light", detailKo: "학원안전법 의무",                         detailEn: "Required by law" },
  ],
  "kids-academy": [
    { id: "fire-equip",     iconKey: "clipboard-check", labelKo: "방염·소화기·비상등 작동",            labelEn: "Fire equipment check",            detailKo: "어린이 안전 = 1순위. 미달 시 영업 정지",     detailEn: "Kids safety = #1. Failure = shutdown" },
    { id: "instructor",     iconKey: "clipboard-check", labelKo: "강사 출근·수업 자료 준비",          labelEn: "Instructor + materials",          detailKo: "결근 = 학부모 신뢰 폭락",                   detailEn: "Absence = parent trust crash" },
  ],
  "adult-class": [
    { id: "tools-prep",     iconKey: "clipboard-check", labelKo: "수업 재료·도구 사전 세팅",          labelEn: "Class materials pre-setup",       detailKo: "성인 클래스 = 시간 효율 민감",              detailEn: "Adult class = time-efficient" },
    { id: "attendee-list",  iconKey: "clipboard-check", labelKo: "오늘 출석·결석자 사전 연락",        labelEn: "Today's attendance + absentee call", detailKo: "결석 사유 확인 → 환불 분쟁 예방",        detailEn: "Confirm absence → prevent disputes" },
  ],
  "language-academy": [
    { id: "instructor",     iconKey: "clipboard-check", labelKo: "원어민·내국인 강사 출근 확인",      labelEn: "Native/local instructor arrival", detailKo: "결강 시 환불 사유",                         detailEn: "Absence = refund trigger" },
    { id: "fire-equip",     iconKey: "clipboard-check", labelKo: "소화기·비상등 점검 (학원안전법)",  labelEn: "Fire equipment (academy law)",    detailKo: "월 1회 — 매월 첫 주 권장",                   detailEn: "Monthly — first week recommended" },
  ],
  "coding-class": [
    { id: "pc-test",        iconKey: "clipboard-check", labelKo: "전 PC·인터넷 작동 확인",            labelEn: "All PC/internet working",         detailKo: "코딩 핵심 인프라 — 1대 고장 = 1명 수업 X",   detailEn: "Coding core infra" },
    { id: "env-setup",      iconKey: "clipboard-check", labelKo: "오늘 수업 IDE·라이브러리 사전 설치", labelEn: "Today's IDE/library pre-install", detailKo: "수업 시작 후 환경 설정 = 시간 낭비",        detailEn: "Setup at class start = time loss" },
  ],
  "small-study-room": [
    { id: "prep-mat",       iconKey: "clipboard-check", labelKo: "교재·과제·진도표 준비",             labelEn: "Material/homework/progress",      detailKo: "1:1·소수 정예 = 개인 맞춤 진도",            detailEn: "1:1 = personalized progress" },
    { id: "fire-equip",     iconKey: "clipboard-check", labelKo: "소화기·비상등 점검",                 labelEn: "Fire extinguisher/emergency light", detailKo: "학원안전법 — 소형 교습소도 의무",         detailEn: "Required even for small academies" },
  ],

  // ════════════════════════════════════════════════════════════
  //   PET (6)
  // ════════════════════════════════════════════════════════════
  "pet-grooming": [
    { id: "blade-clean",    iconKey: "sparkles",        labelKo: "블레이드 알코올 소독 + 오일링",     labelEn: "Blade alcohol + oiling",          detailKo: "교차 감염 방지 + 수명 연장",                detailEn: "Prevent cross-infection + life" },
    { id: "vaccine-record", iconKey: "clipboard-check", labelKo: "오늘 예약 펫 백신 기록 확인",       labelEn: "Today's pet vaccine record check", detailKo: "전염병 예방 + 보험 분쟁 예방",            detailEn: "Disease prevention + insurance" },
  ],
  "pet-supplies": [
    { id: "animal-health",  iconKey: "clipboard-check", labelKo: "매장 동물 건강 점검 (식욕·배변)",   labelEn: "Store animal health (appetite/stool)", detailKo: "이상 시 즉시 동물병원",                detailEn: "Issue = vet immediately" },
    { id: "vent-deodor",    iconKey: "sparkles",        labelKo: "환기·탈취 시스템 작동",              labelEn: "Ventilation/deodorizer",          detailKo: "냄새 = 1순위 불만 요인",                    detailEn: "Odor = #1 complaint" },
  ],
  "pet-hotel": [
    { id: "animal-checkin", iconKey: "clipboard-check", labelKo: "입실 동물 건강·식이 기록 확인",     labelEn: "Check-in health/diet records",    detailKo: "다른 동물 감염 방지",                       detailEn: "Prevent transmission" },
    { id: "room-clean",     iconKey: "sparkles",        labelKo: "객실·침구 매일 청소·소독",          labelEn: "Daily room/bedding clean",        detailKo: "위생 = 펫호텔 신뢰의 99%",                  detailEn: "Hygiene = 99% of pet hotel trust" },
  ],
  "pet-cafe": [
    { id: "animal-health",  iconKey: "clipboard-check", labelKo: "거주 동물 컨디션 + 백신 기록",      labelEn: "Resident animals + vaccine records", detailKo: "펫카페 신뢰도 핵심",                     detailEn: "Pet cafe trust core" },
    { id: "vent-deodor",    iconKey: "sparkles",        labelKo: "환기·탈취 작동 (시간당 환기량)",    labelEn: "Ventilation (air changes/hr)",    detailKo: "냄새 = 펫카페 1순위 불만",                  detailEn: "Odor = pet cafe #1 complaint" },
  ],
  "pet-training-school": [
    { id: "trainer-prep",   iconKey: "clipboard-check", labelKo: "트레이너 출근·교육 자료 준비",      labelEn: "Trainer arrival + materials",     detailKo: "행동 교정 = 일관성 핵심",                   detailEn: "Consistency is key" },
    { id: "session-log",    iconKey: "clipboard-check", labelKo: "어제 세션 로그·진도 기록 확인",     labelEn: "Yesterday's session log check",   detailKo: "보호자 보고서 = 재등록 결정 요인",          detailEn: "Owner report drives renewal" },
  ],
  "pet-walking-visit": [
    { id: "route-confirm",  iconKey: "clipboard-check", labelKo: "당일 방문 루트·시간 확정",          labelEn: "Today's route/time confirm",      detailKo: "방문형 = 시간 약속 = 신뢰",                 detailEn: "Visit-type = punctual = trust" },
    { id: "key-emergency",  iconKey: "clipboard-check", labelKo: "고객 키·비상연락처 보유 확인",      labelEn: "Customer keys + emergency contacts", detailKo: "키 분실 = 무한 책임",                    detailEn: "Lost key = unlimited liability" },
  ],

  // ════════════════════════════════════════════════════════════
  //   LIVING-SERVICE (6)
  // ════════════════════════════════════════════════════════════
  "laundry-service": [
    { id: "tag-system",     iconKey: "clipboard-check", labelKo: "고객 태그·라벨 누락 점검",          labelEn: "Customer tag/label check",        detailKo: "분실 = 무한 책임",                          detailEn: "Loss = unlimited liability" },
    { id: "delivery-route", iconKey: "clipboard-check", labelKo: "오늘 픽업·배송 루트 확정",          labelEn: "Today's pickup/delivery route",   detailKo: "약속 시간 = 재이용률 직결",                 detailEn: "On-time = retention" },
  ],
  "cleaning-service": [
    { id: "staff-schedule", iconKey: "clipboard-check", labelKo: "청소 인력 배정·도구 차량별 확인",   labelEn: "Cleaner schedule + vehicle tools", detailKo: "방문 시간 = 신뢰 + 도구 부족 = 시간 낭비", detailEn: "Punctuality + tools" },
    { id: "supply-stock",   iconKey: "package",         labelKo: "세제·소모품 차량별 재고 점검",      labelEn: "Vehicle supply stock check",      detailKo: "현장 부족 = 다시 방문 = 인건비 손실",       detailEn: "On-site shortage = re-visit cost" },
  ],
  "repair-service": [
    { id: "parts-stock",    iconKey: "package",         labelKo: "주요 부품·소모품 재고 확인",        labelEn: "Key parts/supplies stock",        detailKo: "결품 시 고객 대기 → 클레임",                detailEn: "Stockout = wait → claim" },
    { id: "appointment",    iconKey: "clipboard-check", labelKo: "오늘 방문·점포 예약 시간 확정",     labelEn: "Today's visit/in-shop schedule",  detailKo: "방문 시간 변경 = 신뢰 직격",                detailEn: "Schedule change = trust hit" },
  ],
  "self-laundry": [
    { id: "machine-test",   iconKey: "clipboard-check", labelKo: "전 세탁기·건조기 작동 점검",        labelEn: "All washer/dryer working",        detailKo: "1대 고장 = 매출 즉시 손실",                 detailEn: "1 failure = immediate loss" },
    { id: "filter-clean",   iconKey: "sparkles",        labelKo: "건조기 먼지 필터 청소 (화재 방지)", labelEn: "Dryer lint filter clean",         detailKo: "1일 1회 — 미청소 시 화재 위험",             detailEn: "Daily — fire risk" },
  ],
  "print-copy": [
    { id: "toner-stock",    iconKey: "package",         labelKo: "토너·잉크·용지 피크 1.5배 재고",   labelEn: "Toner/ink/paper at 1.5× peak",    detailKo: "시험·과제 시즌 결품 = 매출 직격",            detailEn: "Exam season stockout = direct loss" },
    { id: "machine-test",   iconKey: "clipboard-check", labelKo: "복합기·인쇄기 시운전 (1매 출력)",   labelEn: "Test print on each machine",      detailKo: "오류 시 손님 대기 → 즉시 이탈",             detailEn: "Error = customer leave" },
  ],
  "device-repair": [
    { id: "parts-stock",    iconKey: "package",         labelKo: "iPhone·갤럭시 액정·배터리 재고",    labelEn: "iPhone/Galaxy LCD/battery stock", detailKo: "인기 모델 부품 사전 보유",                  detailEn: "Pre-stock popular models" },
    { id: "diagnostic",     iconKey: "clipboard-check", labelKo: "어제 보관 기기 진단·연락 상태",     labelEn: "Yesterday's device status + customer contact", detailKo: "수리 지연 = 고객 분노 직격",            detailEn: "Delay = customer anger" },
  ],

  // ════════════════════════════════════════════════════════════
  //   SPACE (6) — 2026.3 소공동 게스트하우스 화재 사고 후 강화
  // ════════════════════════════════════════════════════════════
  "guesthouse": [
    { id: "fire-equip",     iconKey: "clipboard-check", labelKo: "소화기·자동소화기·완강기·CO 경보기 점검", labelEn: "Fire extinguisher/CO alarm check", detailKo: "2026.3 게스트하우스 화재 사고 — 안전 1순위", detailEn: "Post-2026.3 Seoul fire — safety #1" },
    { id: "checkin-clean",  iconKey: "sparkles",        labelKo: "체크인 객실 청소·침구 교체 확인",   labelEn: "Check-in room clean/bedding swap", detailKo: "리뷰 별점 결정 = 청결",                    detailEn: "Review stars driven by clean" },
  ],
  "rental-studio": [
    { id: "prev-clean",     iconKey: "sparkles",        labelKo: "이전 사용자 사용 후 청소·점검",     labelEn: "Post-prior-use clean",            detailKo: "예약 사이 청소 + 분실물 확인",              detailEn: "Inter-booking clean + lost items" },
    { id: "equipment-test", iconKey: "clipboard-check", labelKo: "조명·카메라·음향 작동 확인",        labelEn: "Lighting/camera/audio check",     detailKo: "촬영 중단 = 환불 + 별점 폭락",              detailEn: "Shoot stop = refund + bad review" },
  ],
  "party-room": [
    { id: "prev-clean",     iconKey: "sparkles",        labelKo: "이전 행사 후 청소·소독",             labelEn: "Post-event clean",                detailKo: "다음 고객 즉시 입실 가능 상태",             detailEn: "Ready for next guest" },
    { id: "noise",          iconKey: "clipboard-check", labelKo: "방음·소음 측정·이웃 민원 점검",     labelEn: "Soundproof/noise check",          detailKo: "파티룸 1순위 리스크",                       detailEn: "#1 risk" },
  ],
  "study-cafe-space": [
    { id: "kiosk-remote",   iconKey: "clipboard-check", labelKo: "무인 키오스크·QR 출입 작동",        labelEn: "Kiosk/QR entry working",          detailKo: "스터디카페 매출 핵심 인프라",               detailEn: "Core infra" },
    { id: "cleanliness",    iconKey: "sparkles",        labelKo: "좌석·룸 청소 (1일 1~2회 직접)",    labelEn: "Seat/room clean (1-2× daily)",    detailKo: "청결 = 재방문률 결정",                      detailEn: "Cleanliness = retention" },
  ],
  "shared-office": [
    { id: "internet",       iconKey: "clipboard-check", labelKo: "Wi-Fi·인터넷·복합기 작동",          labelEn: "Wi-Fi/internet/printer",          detailKo: "다운 시 회원 즉시 환불·해지",               detailEn: "Down = instant refund/cancel" },
    { id: "common-area",    iconKey: "sparkles",        labelKo: "공용 공간·회의실 청소·소모품 보충", labelEn: "Common area clean + supplies",    detailKo: "커피·휴지 부족 = 회원 만족도 폭락",         detailEn: "Coffee/tissue out = sat crash" },
  ],
  "practice-room": [
    { id: "equipment",      iconKey: "clipboard-check", labelKo: "악기·앰프·스피커 작동 점검",        labelEn: "Instrument/amp/speaker check",    detailKo: "장비 미작동 = 환불",                        detailEn: "Failure = refund" },
    { id: "noise",          iconKey: "clipboard-check", labelKo: "방음 상태·이웃 민원 점검",          labelEn: "Soundproof + neighbor complaint", detailKo: "민원 누적 = 영업 위험",                     detailEn: "Complaints accumulate = risk" },
  ],

  // ════════════════════════════════════════════════════════════
  //   ONLINE-DIGITAL (6) — 스마트스토어·뉴스레터 등
  //   네이버 스마트스토어 가이드 + Beehiiv 2026 기준
  // ════════════════════════════════════════════════════════════
  "smart-store": [
    { id: "order-process",  iconKey: "clipboard-check", labelKo: "신규 주문 24시간 내 송장 입력",     labelEn: "Input tracking within 24h",       detailKo: "네이버 가이드 — 미입력 = 페널티 + 별점 직격", detailEn: "Naver rule — penalty + bad review" },
    { id: "ad-bid",         iconKey: "package",         labelKo: "쇼핑광고·CPC 입찰가·예산 점검",     labelEn: "Shopping ad CPC bid/budget",      detailKo: "경쟁사 단가 변동 → 일 1회 조정 권장",       detailEn: "Competitor CPC drift — adjust daily" },
  ],
  "digital-products": [
    { id: "license-issue",  iconKey: "clipboard-check", labelKo: "라이선스·다운로드 키 자동 발송 점검", labelEn: "License/download key auto-send check", detailKo: "발송 실패 = 즉시 환불 사유",            detailEn: "Failure = refund trigger" },
    { id: "version-update", iconKey: "package",         labelKo: "신버전·핫픽스 배포 노트 발송",      labelEn: "Version/hotfix release notes send", detailKo: "구매자 알림 = 만족도 + 재구매",            detailEn: "Notify buyers = satisfaction + repurchase" },
  ],
  "creator-service": [
    { id: "comment-reply",  iconKey: "message-square",  labelKo: "유튜브·인스타 댓글 24시간 내 답변", labelEn: "YouTube/IG comments < 24h",       detailKo: "초기 응답 = 알고리즘 노출 부스트",          detailEn: "Early reply = algo boost" },
    { id: "content-plan",   iconKey: "camera",          labelKo: "오늘 1건 + 이번 주 2건 콘텐츠 점검", labelEn: "Today 1 + week 2 content check",  detailKo: "주 3회 업로드가 알고리즘 임계점",            detailEn: "3×/week is algo threshold" },
  ],
  "consignment-commerce": [
    { id: "supplier-stock", iconKey: "package",         labelKo: "공급처·위탁 파트너 재고 동기화",    labelEn: "Supplier/consignment stock sync", detailKo: "비동기 재고 = 품절 후 주문 → 환불 분쟁",    detailEn: "Async stock = oversell → dispute" },
    { id: "settlement",     iconKey: "clipboard-check", labelKo: "어제 정산·수수료 계산 확인",        labelEn: "Yesterday's settlement check",    detailKo: "정산 누락 = 파트너 신뢰 직격",              detailEn: "Missed = partner trust hit" },
  ],
  "newsletter-membership": [
    { id: "open-rate",      iconKey: "clipboard-check", labelKo: "어제 발송 open rate·CTR 확인",      labelEn: "Yesterday's open rate / CTR",     detailKo: "Beehiiv 기준 open 35-45%·CTR 2%+ 정상",      detailEn: "Beehiiv: open 35-45%, CTR 2%+ healthy" },
    { id: "churn-watch",    iconKey: "message-square",  labelKo: "구독 해지·취소 사유 점검",           labelEn: "Unsubscribe/cancel reasons check", detailKo: "월 churn 5% 이내가 건전선",                 detailEn: "Monthly churn ≤5% is healthy" },
  ],
  "global-buying": [
    { id: "exchange-rate",  iconKey: "clipboard-check", labelKo: "환율·관세·배송비 변동 점검",        labelEn: "FX/customs/shipping fee check",   detailKo: "환율 1% 변동 = 마진 즉시 영향",             detailEn: "1% FX shift = margin hit" },
    { id: "ship-track",     iconKey: "package",         labelKo: "국제 운송·통관 진행 추적",          labelEn: "Int'l shipment/customs tracking", detailKo: "통관 지연 = 고객 분노 1순위 사유",           detailEn: "Customs delay = #1 complaint" },
  ],

  // ════════════════════════════════════════════════════════════
  //   STARTUP-TECH: SOFTWARE (6)
  //   Y Combinator B2B SaaS Playbook 기반 (DAU/MAU·MRR·burn)
  // ════════════════════════════════════════════════════════════
  "ai-application": [
    { id: "model-eval",     iconKey: "clipboard-check", labelKo: "어제 LLM 호출 비용·실패율 점검",    labelEn: "Yesterday's LLM cost/failure rate", detailKo: "토큰 폭증 → 즉시 burn 압박",              detailEn: "Token spike → burn pressure" },
    { id: "user-feedback",  iconKey: "message-square",  labelKo: "사용자 피드백·hallucination 리포트", labelEn: "User feedback / hallucination reports", detailKo: "AI 신뢰도 = 리텐션 직결",                 detailEn: "AI trust = retention" },
  ],
  "developer-tools": [
    { id: "github-issues",  iconKey: "message-square",  labelKo: "GitHub issue·Discord 응답 < 24h",   labelEn: "GitHub issue / Discord reply < 24h", detailKo: "DX 지연 = 평판 폭락 (개발자 입소문)",      detailEn: "DX lag = reputation crash" },
    { id: "ci-status",      iconKey: "clipboard-check", labelKo: "CI·릴리즈 파이프라인 상태 점검",    labelEn: "CI / release pipeline status",    detailKo: "빌드 깨짐 = 신규 사용자 즉시 이탈",         detailEn: "Build break = new user drop" },
  ],
  "b2b-saas": [
    { id: "dau-mau",        iconKey: "clipboard-check", labelKo: "DAU/MAU·error rate 대시보드 점검",  labelEn: "DAU/MAU + error rate check",      detailKo: "DAU/MAU 20%+ = 끈적한(sticky) 제품",        detailEn: "DAU/MAU 20%+ = sticky" },
    { id: "support-inbox",  iconKey: "message-square",  labelKo: "고객 지원 inbox + Slack 채널 응답", labelEn: "Support inbox + Slack channel",   detailKo: "B2B = 1건 무응답 = 갱신 위험",              detailEn: "B2B = 1 ignored = renewal risk" },
  ],
  "fintech-startup": [
    { id: "tx-monitor",     iconKey: "clipboard-check", labelKo: "거래 실패율·이상 거래 모니터링",    labelEn: "TX failure rate / anomaly monitor", detailKo: "결제 0.1% 실패 = 누적 손실 + 평판",       detailEn: "0.1% fail = compound loss + rep" },
    { id: "compliance",     iconKey: "clipboard-check", labelKo: "AML·KYC 알림·금감원 신고 대기",     labelEn: "AML/KYC alerts + FSC filing queue", detailKo: "규제 미준수 = 영업 정지 직결",            detailEn: "Non-compliance = shutdown" },
  ],
  "healthtech-startup": [
    { id: "hipaa-audit",    iconKey: "clipboard-check", labelKo: "HIPAA·개인정보 접근 로그 점검",     labelEn: "HIPAA / PHI access log",          detailKo: "의료데이터 유출 = 회사 종결 수준 리스크",   detailEn: "PHI leak = company-ending risk" },
    { id: "clinical-data",  iconKey: "package",         labelKo: "임상·환자 데이터 수집 진행 상황",   labelEn: "Clinical / patient data ingest",  detailKo: "임상 마일스톤 = 다음 라운드 핵심 지표",     detailEn: "Clinical milestones = next-round metric" },
  ],
  "security-startup": [
    { id: "incident-feed",  iconKey: "clipboard-check", labelKo: "고객 환경 이상 탐지·incident 응답", labelEn: "Customer env anomaly / incident",  detailKo: "보안 = 응답 속도 = 계약 갱신",              detailEn: "Security = response speed = renewal" },
    { id: "cve-watch",      iconKey: "message-square",  labelKo: "신규 CVE·OSS 취약점 모니터링",      labelEn: "New CVE / OSS vuln monitor",      detailKo: "Zero-day 대응 속도 = 차별화 핵심",          detailEn: "Zero-day speed = differentiator" },
  ],

  // ════════════════════════════════════════════════════════════
  //   STARTUP-TECH: HARDWARE-IoT (1)
  //   NPI (EVT/DVT/PVT) + KC/CE/FCC + EMS partner
  // ════════════════════════════════════════════════════════════
  "hardware-iot": [
    { id: "build-status",   iconKey: "clipboard-check", labelKo: "EVT/DVT/PVT 빌드·테스트 상태",      labelEn: "EVT/DVT/PVT build/test status",   detailKo: "각 단계 yield 80%+ 가 통과 기준",            detailEn: "Each stage yield 80%+ passes" },
    { id: "supply-eta",     iconKey: "package",         labelKo: "BOM·핵심 부품 공급사 ETA 추적",     labelEn: "BOM / supplier ETA tracking",     detailKo: "1개 부품 지연 = 전체 라인 정지",            detailEn: "1 part delay = whole line stop" },
    { id: "ota-status",     iconKey: "clipboard-check", labelKo: "필드 디바이스 OTA 펌웨어 상태",     labelEn: "Field device OTA firmware status", detailKo: "OTA 실패 = 필드 출장 비용 폭증",           detailEn: "OTA fail = field visit cost spike" },
  ],

  // ════════════════════════════════════════════════════════════
  //   STARTUP-TECH: DEEPTECH-LAB (2)
  //   GLP/GMP + sim-to-real calibration
  // ════════════════════════════════════════════════════════════
  "robotics-physical-ai": [
    { id: "sensor-cal",     iconKey: "sparkles",        labelKo: "센서 stack 캘리브레이션·sim-to-real", labelEn: "Sensor stack cal / sim-to-real",  detailKo: "Deloitte 2026 — 디지털 트윈 fidelity 검증",  detailEn: "Deloitte 2026 — digital twin fidelity" },
    { id: "field-test-log", iconKey: "clipboard-check", labelKo: "필드 테스트 failure 로그·재현 분석", labelEn: "Field test failure log / replay", detailKo: "failure → 학습 데이터 = 차세대 모델 핵심",  detailEn: "Failure → training data" },
    { id: "safety-stop",    iconKey: "clipboard-check", labelKo: "비상 정지·인터락 회로 작동 점검",   labelEn: "E-stop / interlock circuit test", detailKo: "사고 시 회사 종결 — 일일 점검 필수",        detailEn: "Accident = company-ending — daily check" },
  ],
  "biotech-medtech": [
    { id: "glp-audit",      iconKey: "clipboard-check", labelKo: "GLP/GMP 감사 추적·ELN 기록 점검",   labelEn: "GLP/GMP audit trail / ELN check", detailKo: "FDA·식약처 감사 시 1건 누락 = 임상 중단",   detailEn: "1 gap = clinical halt" },
    { id: "sample-integrity", iconKey: "package",      labelKo: "샘플 보관 온도·세포 패시지 기록",   labelEn: "Sample temp / cell passage log",  detailKo: "콜드체인 1회 깨짐 = 전체 배치 폐기",        detailEn: "Cold chain break = batch loss" },
    { id: "equipment-cal",  iconKey: "sparkles",        labelKo: "분석기·세포 배양기 캘리브레이션",  labelEn: "Analyzer/incubator calibration",  detailKo: "캘리브레이션 누락 = 데이터 reject",         detailEn: "Missed cal = data reject" },
  ],

  // ════════════════════════════════════════════════════════════
  //   STARTUP-TECH: EXTREME-DEEPTECH (2)
  //   Semiconductor (EDA·MPW·tape-out) + Climate (pilot plant·grant)
  // ════════════════════════════════════════════════════════════
  "semiconductor": [
    { id: "tapeout-schedule", iconKey: "clipboard-check", labelKo: "Tape-out·MPW 슬롯 일정 점검",    labelEn: "Tape-out / MPW slot schedule",    detailKo: "MPW 1슬롯 누락 = 6개월 지연 + 수억 원",     detailEn: "1 missed MPW = 6mo delay + ₩100M+" },
    { id: "eda-license",     iconKey: "package",         labelKo: "EDA 라이선스·시뮬레이션 잡 큐",   labelEn: "EDA license / sim job queue",     detailKo: "$100K-500K/년 라이선스 — 활용도 추적 필수", detailEn: "$100K-500K/yr — track utilization" },
    { id: "yield-report",    iconKey: "clipboard-check", labelKo: "Foundry yield 리포트·DRC 결과",    labelEn: "Foundry yield report / DRC result", detailKo: "Yield 5% 차이 = 사업성 결정",              detailEn: "5% yield delta = viability" },
  ],
  "climate-energy": [
    { id: "pilot-metrics",  iconKey: "clipboard-check", labelKo: "파일럿 플랜트 운전 지표 (효율·가동률)", labelEn: "Pilot plant metrics (eff/uptime)", detailKo: "TRL 6+ 도달이 다음 그랜트의 게이트",      detailEn: "TRL 6+ gates next grant" },
    { id: "grant-milestone",iconKey: "clipboard-check", labelKo: "그랜트 마일스톤·보고서 마감 점검",  labelEn: "Grant milestone / report deadline", detailKo: "DeepTech Decarb 그랜트 = 마일스톤 미달 = 환수", detailEn: "Miss milestone = clawback" },
    { id: "regulatory",     iconKey: "message-square",  labelKo: "규제·인허가·환경영향평가 진행상황", labelEn: "Regulatory / permit / EIA status", detailKo: "허가 지연 = 상업 가동 1년 단위 슬립",      detailEn: "Permit delay = year-scale slip" },
  ],
};

/** 카테고리 폴백 — sub-industry 미선택 시 */
export const CATEGORY_RITUALS: Record<string, DailyRitualItem[]> = {
  food: [
    { id: "ingredient-fresh", iconKey: "package", labelKo: "식재료 신선도·유통기한 점검", labelEn: "Ingredient freshness/expiry", detailKo: "신선도 = 별점 = 매출", detailEn: "Freshness = stars = sales" },
  ],
  "cafe-dessert": [
    { id: "machine-clean", iconKey: "sparkles", labelKo: "에스프레소 머신·진열대 청소", labelEn: "Espresso machine/display clean", detailKo: "음료 품질 + 위생", detailEn: "Quality + hygiene" },
  ],
  beauty: [
    { id: "tool-sterile", iconKey: "sparkles", labelKo: "시술 도구 멸균·소독 확인", labelEn: "Tool sterilization", detailKo: "공중위생관리법 의무", detailEn: "Required by law" },
  ],
  fitness: [
    { id: "equipment-safe", iconKey: "clipboard-check", labelKo: "운동 기구 안전 점검", labelEn: "Equipment safety check", detailKo: "사고 시 무한 책임", detailEn: "Liability" },
  ],
  education: [
    { id: "instructor", iconKey: "clipboard-check", labelKo: "강사 출근·수업 자료 점검", labelEn: "Instructor + materials", detailKo: "결근 = 학부모 신뢰 직격", detailEn: "Absence = trust impact" },
  ],
  pet: [
    { id: "vent-deodor", iconKey: "sparkles", labelKo: "환기·탈취 시스템 작동", labelEn: "Ventilation/deodorizer", detailKo: "냄새 = 1순위 불만", detailEn: "Odor = #1 complaint" },
  ],
  retail: [
    { id: "stock-key", iconKey: "package", labelKo: "주력 상품 결품 점검", labelEn: "Top SKU stockout check", detailKo: "결품 = 즉시 매출 손실", detailEn: "Stockout = immediate loss" },
  ],
  "living-service": [
    { id: "machine-test", iconKey: "clipboard-check", labelKo: "기기·시설 작동 점검", labelEn: "Equipment/facility check", detailKo: "고장 = 매출 직접 손실", detailEn: "Failure = direct loss" },
  ],
  space: [
    { id: "prev-clean", iconKey: "sparkles", labelKo: "이전 사용자 후 청소·점검", labelEn: "Post-prior-use clean", detailKo: "다음 고객 첫인상", detailEn: "Next guest first impression" },
  ],
  "online-digital": [
    { id: "order-process", iconKey: "clipboard-check", labelKo: "어제 주문·CS 처리 상태 점검", labelEn: "Yesterday's orders/CS status", detailKo: "온라인 = 응답 속도 = 별점", detailEn: "Online = speed = rating" },
  ],
  "startup-tech": [
    { id: "metrics-dash", iconKey: "clipboard-check", labelKo: "DAU·error rate·burn 대시보드 점검", labelEn: "DAU / error / burn dashboard", detailKo: "지표 = 다음 라운드 = 생존", detailEn: "Metrics = next round = survival" },
  ],
};

// ════════════════════════════════════════════════════════════════════
//   상황·시기별 조건부 리츄얼
//
//   고정 리츄얼만으로는 "오픈 30일차 신규 사장님" 과 "100일차 정착 단계"
//   "매출 -20% 위기 주" 의 현실이 같지 않다.
//   아래 항목은 trigger 가 만족될 때만 그날의 체크리스트에 추가된다.
//
//   ── 트리거 분류 ─────────────────────────────────────────
//   • lifecycle  : 개업 N일차 (소상공인) / 창업 N일차 (스타트업) — 마일스톤 회고
//   • signal     : 매출·고객·리뷰 신호 변화 — 위기 / 호황 / 평탄 분기
//   ──────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════

export type RitualConditionContext = {
  /** 개업·창업 후 일수 */
  daysSinceLaunch?: number;
  /**
   * 최근 매출 추세(%) — 양수면 증가, 음수면 감소.
   * `useDashboardComputed.weeklySalesChange` 와 동일 단위.
   */
  weeklySalesChangePct?: number;
  /** 최근 7일 활성 사용자 추세(%) — 스타트업 SaaS 용 */
  weeklyUserChangePct?: number;
  /** 최근 30일 평균 별점 (5점 만점) — 네이버 플레이스 등 */
  reviewAvgRating?: number;
  /** 시작일이 미설정인 경우 false 로 두면 lifecycle trigger 모두 비활성 */
  isStartup?: boolean;
};

export type ConditionalRitual = DailyRitualItem & {
  /** 이 항목이 등장한 이유 — UI 배지로 표시 */
  triggerLabelKo: string;
  triggerLabelEn: string;
  /** trigger 평가 — true 이면 오늘의 리스트에 추가 */
  match: (ctx: RitualConditionContext) => boolean;
};

/**
 * 시기별 마일스톤 — 일정 days 범위 내일 때 1회 노출.
 * 좁은 ±5일 윈도우로 잡아, 지나갔거나 멀었을 땐 사라지게.
 */
const within = (n: number, target: number, window = 5) =>
  Math.abs(n - target) <= window;

export const CONDITIONAL_RITUALS: ConditionalRitual[] = [
  // ── 시기 마일스톤 (소상공인·스타트업 공통, 표현만 다름) ──
  {
    id: "milestone-day30",
    iconKey: "clipboard-check",
    labelKo: "오픈 30일 회고 — 단골 후보 5명 인터뷰",
    labelEn: "Day 30 retro — interview 5 regulars",
    detailKo: "재방문 고객에게 \"왜 다시 왔는지\" 직접 듣기. 이 답이 30~100일 전략을 결정",
    detailEn: "Ask returning customers WHY. Their answer shapes Day 30-100 plan",
    triggerLabelKo: "30일차",
    triggerLabelEn: "Day 30",
    match: (ctx) => ctx.daysSinceLaunch != null && within(ctx.daysSinceLaunch, 30) && !ctx.isStartup,
  },
  {
    id: "milestone-day100",
    iconKey: "clipboard-check",
    labelKo: "100일 데이터 분석 — 시그니처·시간대 정의",
    labelEn: "Day 100 analysis — define signature & peak hours",
    detailKo: "3개월치 매출·메뉴 데이터로 \"가장 잘 팔리는 1개\" + \"가장 마진 높은 1개\" 확정. 본격 마케팅 시작점",
    detailEn: "3mo data → pick best-seller + best-margin item. Marketing kickoff point",
    triggerLabelKo: "100일차",
    triggerLabelEn: "Day 100",
    match: (ctx) => ctx.daysSinceLaunch != null && within(ctx.daysSinceLaunch, 100) && !ctx.isStartup,
  },
  {
    id: "milestone-day365",
    iconKey: "sparkles",
    labelKo: "1주년 — 단골 감사 이벤트 + 1년 손익 회고",
    labelEn: "1-year — thank-you event + P&L retro",
    detailKo: "1년치 매출·비용·세무 정리. 단골에게 1주년 인사 (인스타·카톡 채널) — 재방문 부스트",
    detailEn: "1yr P&L close + thank-you to regulars (IG/Kakao) — return boost",
    triggerLabelKo: "1주년",
    triggerLabelEn: "1 year",
    match: (ctx) => ctx.daysSinceLaunch != null && within(ctx.daysSinceLaunch, 365, 7) && !ctx.isStartup,
  },
  {
    id: "milestone-startup-day90",
    iconKey: "clipboard-check",
    labelKo: "창업 90일 — PMF 체크 (DAU/MAU·NPS)",
    labelEn: "Startup Day 90 — PMF check (DAU/MAU, NPS)",
    detailKo: "DAU/MAU 20%+ 및 NPS 30+ 이 PMF 신호. 미달이면 핵심 가설 재검증 (Y Combinator 가이드)",
    detailEn: "DAU/MAU 20%+ & NPS 30+ signal PMF. Below = revisit core hypothesis (YC playbook)",
    triggerLabelKo: "90일차",
    triggerLabelEn: "Day 90",
    match: (ctx) => ctx.daysSinceLaunch != null && within(ctx.daysSinceLaunch, 90) && !!ctx.isStartup,
  },
  {
    id: "milestone-startup-day180",
    iconKey: "clipboard-check",
    labelKo: "창업 180일 — 런웨이 재계산 + 다음 라운드 준비",
    labelEn: "Startup Day 180 — runway recalc + next round prep",
    detailKo: "월 burn 기반 12개월 런웨이 확보 여부 점검. 6개월 미만 → 즉시 펀딩 활동 시작",
    detailEn: "12-mo runway? <6mo = start fundraising NOW",
    triggerLabelKo: "180일차",
    triggerLabelEn: "Day 180",
    match: (ctx) => ctx.daysSinceLaunch != null && within(ctx.daysSinceLaunch, 180) && !!ctx.isStartup,
  },

  // ── 신호 트리거 — 매출 · 사용자 · 리뷰 ──
  {
    id: "signal-sales-drop",
    iconKey: "message-square",
    labelKo: "매출 급락 원인 분석 — 최근 변동 사항 점검",
    labelEn: "Sales-drop root cause check",
    detailKo: "메뉴·가격 변경? 경쟁사 신규 오픈? 부정 리뷰? 지난 4주 변경 항목 1건씩 후보 정리",
    detailEn: "Menu/price change? New competitor? Bad reviews? List candidates from last 4 weeks",
    triggerLabelKo: "매출 위험",
    triggerLabelEn: "Sales risk",
    match: (ctx) => ctx.weeklySalesChangePct != null && ctx.weeklySalesChangePct <= -15,
  },
  {
    id: "signal-sales-surge",
    iconKey: "package",
    labelKo: "매출 급증 — 재고·인력 보강 점검",
    labelEn: "Sales surge — stock & staff reinforcement",
    detailKo: "급증 패턴 (요일·시간대·메뉴) 식별 → 결품 방지 발주 + 피크 알바 1명 충원 검토",
    detailEn: "Identify spike pattern (day/hour/menu) → prevent stockout + add 1 part-timer for peak",
    triggerLabelKo: "성장 중",
    triggerLabelEn: "Growth",
    match: (ctx) => ctx.weeklySalesChangePct != null && ctx.weeklySalesChangePct >= 20,
  },
  {
    id: "signal-user-drop",
    iconKey: "message-square",
    labelKo: "사용자 급감 — 코호트별 dropoff 분석",
    labelEn: "User-drop cohort analysis",
    detailKo: "DAU/리텐션 어느 단계에서 끊기는지? onboarding·핵심 기능·결제 깔때기 단계별 점검",
    detailEn: "Where does retention break? Onboarding / core feature / payment funnel step",
    triggerLabelKo: "사용자 위험",
    triggerLabelEn: "User risk",
    match: (ctx) => ctx.weeklyUserChangePct != null && ctx.weeklyUserChangePct <= -10 && !!ctx.isStartup,
  },
  {
    id: "signal-rating-low",
    iconKey: "message-square",
    labelKo: "별점 4.0 미만 — 부정 리뷰 패턴 분석",
    labelEn: "Rating <4.0 — negative review pattern",
    detailKo: "최근 30일 리뷰 중 ★1~3 모아 빈도 높은 키워드 3개 도출. 답변 + 운영 조치 1건 결정",
    detailEn: "Cluster ★1-3 keywords from last 30d → top 3 → reply + 1 fix action",
    triggerLabelKo: "리뷰 경고",
    triggerLabelEn: "Review alert",
    match: (ctx) => ctx.reviewAvgRating != null && ctx.reviewAvgRating < 4.0,
  },
];

/** 컨텍스트에 매칭되는 조건부 리츄얼 추출 — 매칭 0개면 빈 배열 */
export function evaluateConditionalRituals(
  ctx: RitualConditionContext
): ConditionalRitual[] {
  return CONDITIONAL_RITUALS.filter((r) => {
    try {
      return r.match(ctx);
    } catch {
      return false;
    }
  });
}
