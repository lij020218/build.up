/**
 * 53개 sub-industry × 한국에서 실제 사용되는 공급처·장비 데이터.
 *
 * 검증 출처 (2026-05 기준 웹 재확인):
 *   • 가락시장 / 마장축산물시장 (음식점 도매 표준)
 *   • 푸드팡 (foodpang.co) — B2B 음식점 식자재 온라인 도매. 서울/경기/인천/대전/부산/창원/울산 등 확장
 *   • 토스플레이스 (tossplace.com) — 단말기 가격 인하(3만원), 가맹점 10만+
 *   • 황학동온라인 (hwangon.com) · 번개장터 (bunjang.co.kr) — 중고 업소용 장비
 *   • 헤어앤미 (hairnmi.co.kr) · 헤어2000 · 뱅크헤어 등 미용재료 도매 온라인몰
 *   • 라마르조코코리아 (lamarzoccokorea.co.kr) · 페마 · VBM (카페 에스프레소 머신 표준)
 *   • 바디코디 (bodycodi.com) — 헬스장 회원관리 1위 (4,000+ 헬스장)
 *   • 하이파이브 (hifive.im) — 필라테스/요가 SaaS (650+ 센터)
 *   • 클래스업 (classup.io) · 학원조아 (hakwonjoa.com) · 캠스몬 (camsmon.com) — 학원 SaaS
 *   • 펫도매 (petdome.co.kr) · 펫허그 (pethugb2b.co.kr) — 펫 B2B
 *   • 워시엔조이 (washenjoy.co.kr) — 1,200+ 점포 무인세탁 솔루션
 *   • 런드리24 (laundry24.net) · 런드리고 (laundrygo.com) — 의식주컴퍼니
 *   • 퍼시스 (fursys.com) · 시디즈 (퍼시스 그룹) · 일룸 · 데스커 (사무용 가구)
 *   • 캐치테이블 (new-biz.catchtable.co.kr) · 테이블링 (tabling.co.kr) — 식당 예약·웨이팅
 *   • 페이히어 (payhere.in) — 84,000+ 가맹점, 카페24 연동
 *   • 공비서 (gongbiz.kr) — 미용/네일/펫 8,000+ 매장 CRM
 *
 * 주요 변경 (2026-05):
 *   - "키위(KIVE)"는 미존재 → 캐치테이블·테이블링으로 교체
 *   - "라이즈로그"는 미존재 → 바디코디로 교체
 *   - "학원24·스쿨아이·아이마이로" 미존재/서비스종료 → 클래스업·학원조아·캠스몬으로 교체
 *   - "미러(헤어샵 1위)" 미존재 → 마메드네(구 카카오헤어샵)·공비서로 교체
 *   - "바리스타룰스"는 매일유업 RTD 컵커피, 카페 도매 X → 커피리브레·페리아 등으로 교체
 *   - "펫프렌즈" B2B X (소비자몰) → 펫도매·펫허그·더펫마트로 교체
 *   - "워시몰" 미존재 → 워시엔조이로 교체
 *   - "에어로파워·맥파워·코오롱헬스" 헬스도매 → 바디엑스·이고진·헬스119로 교체
 *   - "헤이펫" 미확인 → 공비서(펫지원)로 통합
 *   - 배달앱 차등 수수료(상위35% 7.8% / 중위 6.8% / 하위 2.0%) 반영
 *
 * 이 데이터는 VendorSetupStage 가 사용자가 선택한 세부업종에 맞게 실제 공급처와
 * 장비를 즉시 추천하는 데 쓰임. category-level 폴백도 제공.
 */

/** 예산 단계 — 사장님이 자기 예산에 맞는 업체를 한눈에 고르도록 하는 태그. */
export type BudgetTier = "value" | "standard" | "premium";

export type VendorItem = {
  /** 공급처/장비 이름 (브랜드명 포함) */
  name: string;
  /** 한 줄 설명 */
  desc: string;
  /** 가격대 (원 단위, 가능 시) */
  priceRange?: string;
  /** 우선순위 — primary/recommended/optional */
  priority?: "primary" | "recommended" | "optional";
  /** 공식 URL (있으면) */
  url?: string;
  /**
   * 예산 단계 태그 (가성비/표준/프리미엄). 명시값이 없으면 getVendorData 가
   * classifyBudgetTier 로 가격대·키워드에서 결정해 부여. 항목별로 직접 지정해 덮어쓸 수 있음.
   */
  budgetTier?: BudgetTier;
};

const BUDGET_VALUE_HINTS = [
  "중고", "황학동", "번개장터", "회원가", "코스트코", "트레이더스",
  "가성비", "저가", "1688", "알리", "도매꾹", "절감", "무료",
];
const BUDGET_PREMIUM_HINTS = [
  // "수입"(직수입 도매 등)은 너무 광범위 → "수입가"/"고가" 등 명시 프리미엄 신호만 사용
  "프리미엄", "하이엔드", "고가", "수입가", "라마르조코", "GB5", "KB90", "Hobart", "호바트",
  "발로나", "이즈니", "트러플", "화덕", "모렐로", "슬레이어", "Slayer", "오마카세",
];

/** priceRange 문자열에서 "N만" 표기들의 최댓값(만원 단위)을 추출. 없으면 null. */
function maxManwon(priceRange?: string): number | null {
  if (!priceRange) return null;
  const nums = [...priceRange.matchAll(/([\d,.]+)\s*만/g)].map((m) =>
    parseFloat(m[1].replace(/,/g, "")),
  );
  return nums.length ? Math.max(...nums) : null;
}

/**
 * 가격대·키워드로 예산 단계를 결정 (결정적·휴리스틱).
 *   value    — 중고·회원가·무료·월 0원·소액(≤50만) 등 가장 저렴한 선택지
 *   premium  — 수입·하이엔드 브랜드·고가(≥800만) 등 상위 선택지
 *   standard — 그 외 표준
 */
export function classifyBudgetTier(item: VendorItem): BudgetTier {
  if (item.budgetTier) return item.budgetTier;
  const pr = item.priceRange ?? "";
  const hay = `${item.name} ${item.desc} ${pr}`;
  if (/월\s*0원|(^|\s)0원/.test(pr) || /월\s*0원/.test(hay)) return "value";
  if (BUDGET_VALUE_HINTS.some((h) => hay.includes(h))) return "value";
  if (BUDGET_PREMIUM_HINTS.some((h) => hay.includes(h))) return "premium";
  // 단가 표기(kg당·병당·L당 등)는 총 투자액이 아니므로 금액 휴리스틱 제외 — 키워드로만 판정.
  const isUnitPrice = /kg|병당|개당|잔당|리터|L당|ml|인당/.test(pr);
  const mx = isUnitPrice ? null : maxManwon(pr);
  if (mx != null) {
    if (mx >= 800) return "premium";
    if (mx <= 50) return "value";
  }
  return "standard";
}

export type SubIndustryVendorData = {
  /** 식자재·원자재·소모품 공급처 */
  suppliers: VendorItem[];
  /** 핵심 장비 (구매·렌탈) */
  equipment: VendorItem[];
  /** POS·결제·관리 시스템 */
  pos: VendorItem[];
  /**
   * 추가 채널 (배달앱·예약·쇼핑몰 등) — ⚠️ vendor_setup 단계에서는 렌더링 안 함.
   * 이 필드는 14단계 operations_setup ("운영·마케팅 세팅") 에서 재활용 예정.
   * vendor_setup 은 공급망(식자재·장비·POS) 단계라 판매 채널과 책임 분리.
   */
  channels?: VendorItem[];
};

/** 카테고리별 공통 베이스라인 — sub-industry 데이터에 폴백 */
export const CATEGORY_VENDOR_BASE: Record<string, SubIndustryVendorData> = {
  // ═════════════════════════════════════════════════════════════
  // FOOD — 음식점 공통 베이스
  // ═════════════════════════════════════════════════════════════
  food: {
    suppliers: [
      { name: "푸드팡 (Foodpang)", desc: "외식업 사장님 1순위 B2B 도매. 전날 22시까지 주문 → 다음날 08시 이전 매장 냉장고로 직접 배송", priceRange: "도매가", priority: "primary", url: "https://foodpang.co/" },
      { name: "가락시장 (가락몰)", desc: "국내 최대 농수산물 도매시장. 청과·수산 도매권역 + 가락몰 소포장. 새벽 직접 매입 또는 위탁상 정기 배송", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
      { name: "마장축산물시장", desc: "수도권 정육 60%+ 유통. 약 2,000 점포 도소매. 새벽 4시~저녁 7시 운영, 당일배송 가능", priceRange: "도매가", priority: "primary", url: "http://www.mjmm.co.kr/" },
      { name: "CJ프레시웨이 (온리원푸드넷)", desc: "대형 외식 식자재 정기배송. B2B 주문 시스템 + 입고 검수 + 재고 관리. 3톤 이상 매장 추천", priceRange: "월정액 협의", priority: "recommended", url: "https://www.cjfreshway.com/" },
      { name: "이마트 트레이더스 / 코스트코", desc: "소형 매장 직접 매입 옵션. 회원가 도매", priceRange: "회원가", priority: "optional" },
    ],
    equipment: [
      { name: "업소용 냉장고 (LG·삼성·우성·라셀르)", desc: "테이블 냉장고 (1.2m) 100~180만, 4도어 직립형 250~450만 (2026 인상 반영)", priceRange: "100~450만원", priority: "primary" },
      { name: "가스레인지·튀김기 (린나이·동양매직·롯데기공)", desc: "2구 이상 업소용. 가스 안전점검 필수 (KC 인증 확인)", priceRange: "30~150만원", priority: "primary" },
      { name: "도어형 식기세척기 (한일·LG·세인·코웨이)", desc: "70-80초당 반찬 그릇 20개. 음식점 운영 효율 핵심", priceRange: "200~500만원", priority: "primary" },
      { name: "스테인리스 작업대·싱크대 (한일·우성)", desc: "2구 싱크 + 작업대 1.5m 표준", priceRange: "30~80만원", priority: "primary" },
      { name: "환기 후드 + 덕트", desc: "가스레인지 위 후드 필수. 시공 비용 별도", priceRange: "100~300만원", priority: "primary" },
      { name: "황학동온라인 (중고 1위)", desc: "업소용주방기기 새것/중고 통합 비교 견적. 50-70% 절감", priceRange: "신품 30-50%", priority: "recommended", url: "https://hwangon.com/" },
      { name: "번개장터 (개인 중고)", desc: "개인 매도 중심 중고 장터. 직거래 가능", priceRange: "신품 30-60%", priority: "optional", url: "https://m.bunjang.co.kr/" },
    ],
    pos: [
      { name: "토스플레이스 (가맹점 10만+)", desc: "카드+애플페이+QR 일체형. 단말기 3만원~ (2025-3 인하), 월 0원 가능", priceRange: "월 0원~", priority: "primary", url: "https://tossplace.com/" },
      { name: "오케이포스 (OK POS)", desc: "음식점 점유율 약 40%, 26만 가맹점. 메뉴 관리·매출 집계·배달앱 연동", priceRange: "월 3-5만 + 단말 50-80만", priority: "primary", url: "https://www.okpos.co.kr/" },
      { name: "페이히어 (PayHere)", desc: "올인원 단말기 1위, 84,000+ 가맹. 카페24 연동, 키오스크·테이블오더·웨이팅", priceRange: "월 0원~5만", priority: "recommended", url: "https://payhere.in/" },
      { name: "캐치테이블 비즈 (예약·웨이팅)", desc: "월 350만+ 사용자. 예약·웨이팅 통합 솔루션. 외식 특화", priceRange: "월 5-15만", priority: "recommended", url: "https://new-biz.catchtable.co.kr/" },
      { name: "테이블링 (Tabling)", desc: "맛집 원격 웨이팅·예약 + 알림톡. 매장 노출 채널 겸용", priceRange: "월 협의", priority: "optional", url: "https://www.tabling.co.kr/" },
    ],
    channels: [
      { name: "배민 (배달의민족)", desc: "차등 수수료 (2025 시행): 매출 상위 35% 7.8% / 중위 6.8% / 하위 20% 2.0%", priceRange: "수수료 2.0-7.8%", priority: "primary" },
      { name: "쿠팡이츠", desc: "배민과 동일 차등 구조 7.8/6.8/2.0%. 빠른 배달 강점", priceRange: "수수료 2.0-7.8%", priority: "primary" },
      { name: "요기요", desc: "차등 수수료 4.7-9.7%. 네이버플러스 멤버십 연동으로 부담 완화", priceRange: "수수료 4.7-9.7%", priority: "recommended" },
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "초기 진성 리뷰 10건 확보가 검색 노출 결정", priceRange: "무료", priority: "primary" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // CAFE-DESSERT — 카페·디저트 공통 베이스
  // ═════════════════════════════════════════════════════════════
  "cafe-dessert": {
    suppliers: [
      { name: "테라로사 (TERAROSA)", desc: "강릉 본사 스페셜티 표준. 학산 도매 채널 별도 운영. kg당 25,000-45,000원", priceRange: "kg당 2.5-4.5만", priority: "primary", url: "https://www.terarosa.com/" },
      { name: "커피 리브레 (Coffee Libre)", desc: "한국 1세대 스페셜티. 250+ 산지 다이렉트 트레이드, 매월 기술지원 세미나", priceRange: "kg당 3-6만", priority: "primary", url: "https://coffeelibre.kr/" },
      { name: "커피명가 (Coffee Myungga)", desc: "1990년 창립 한국 스페셜티 시작점. 원두 납품·카페 컨설팅", priceRange: "kg당 2.5-5만", priority: "recommended", url: "https://myungga.com/" },
      { name: "서울우유·매일유업·연세우유", desc: "1L 유통가 1,900-2,700원 (2026 인상 반영). 정기 배송", priceRange: "L당 1.9-2.7천", priority: "primary" },
      { name: "1883·모닌·다빈치 (시럽)", desc: "프리미엄 시럽. 750ml 13,000-19,000원", priceRange: "병당 1.3-1.9만", priority: "recommended" },
      { name: "기퍼드·홀리데이즈 (시럽)", desc: "중저가 시럽 옵션", priceRange: "병당 8-12천", priority: "optional" },
      { name: "삼립·뚜레쥬르 도매 (베이커리)", desc: "냉동 빵·디저트 도매 — 베이킹 안 하는 카페", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "에스프레소 머신 (라마르조코·페마·VBM)", desc: "라마르조코 GB5 800-1,300만 / 페마 E61 400-700만 / VBM 250-450만", priceRange: "250~1,300만", priority: "primary", url: "https://lamarzoccokorea.co.kr/" },
      { name: "그라인더 (말코닉·EUREKA·DITTING)", desc: "EK43 380-450만 / Mahlkönig E80 280-380만 / Eureka Atom 75 90-150만", priceRange: "90~450만", priority: "primary" },
      { name: "냉장 쇼케이스 (라셀르·우성)", desc: "디저트 진열용. 4단 글래스 도어 220-450만", priceRange: "220~450만", priority: "primary" },
      { name: "제빙기 (호시자키·스코츠만·카이저)", desc: "호시자키 IM-45 일 45kg 100만 / 100kg 240만 (한국 1위 점유)", priceRange: "100~250만", priority: "primary", url: "http://www.hoshizaki.co.kr/" },
      { name: "황학동온라인 (중고)", desc: "에스프레소 머신·그라인더 50-60% 절감", priceRange: "신품 40-60%", priority: "recommended", url: "https://hwangon.com/" },
    ],
    pos: [
      { name: "토스플레이스 카페 모드", desc: "카페 메뉴 옵션·할인쿠폰·스탬프 적립 통합", priceRange: "월 0원~", priority: "primary", url: "https://tossplace.com/" },
      { name: "페이히어 (PayHere) 카페형", desc: "키오스크·테이블오더 일체. 카페24 자체몰 연동 가능", priceRange: "월 0원~5만", priority: "primary", url: "https://payhere.in/" },
      { name: "오케이포스 카페형", desc: "음료 옵션 다양 + 적립카드 발급. 26만 가맹", priceRange: "월 3-5만", priority: "recommended", url: "https://www.okpos.co.kr/" },
    ],
    channels: [
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "카페 노출 1순위 채널. 초기 10건 진성 리뷰 핵심", priceRange: "무료", priority: "primary" },
      { name: "인스타그램 + 릴스", desc: "비주얼 카페 SNS 1순위. D-7부터 매일 1콘텐츠", priceRange: "무료", priority: "primary" },
      { name: "카카오맵 + 카카오톡 채널", desc: "예약·할인쿠폰 발송", priceRange: "무료~", priority: "recommended" },
      { name: "배민·쿠팡이츠 (배달 옵션)", desc: "테이크아웃 카페만. 매장형은 선택. 차등 수수료 2.0-7.8%", priceRange: "수수료 2.0-7.8%", priority: "optional" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // RETAIL — 소매 공통 베이스
  // ═════════════════════════════════════════════════════════════
  retail: {
    suppliers: [
      { name: "남대문 도매시장", desc: "잡화·생활용품·완구 도매 1번지", priceRange: "도매가", priority: "primary" },
      { name: "동대문 종합시장", desc: "패션·액세서리·생활잡화 도매", priceRange: "도매가", priority: "primary" },
      { name: "청계천8가 (전자·조명·기계)", desc: "전자제품·소재 도매 — 라이프스타일·인테리어 매장", priceRange: "도매가", priority: "recommended" },
      { name: "도매꾹 (Domeggook)", desc: "온라인 도매 1위. 1688닷컴 전용관 운영, 검증 상품 7만+. 소량 가능", priceRange: "온라인 도매가", priority: "primary", url: "https://www.domeggook.com/" },
      { name: "1688.com (알리바바 B2B)", desc: "중국 최대 B2B. 도매꾹 통한 한국어 전용관 가능", priceRange: "해외 도매가", priority: "recommended", url: "https://www.1688.com/" },
      { name: "이마트 트레이더스 / 코스트코", desc: "회원가 도매 (소형 매장)", priceRange: "회원가", priority: "optional" },
    ],
    equipment: [
      { name: "진열대·디스플레이 (한국매대·신성라텍)", desc: "벽면 진열대 1.8m 30-60만 / 아일랜드 진열대 50-100만", priceRange: "30~100만", priority: "primary" },
      { name: "냉장 쇼케이스 (라셀르·우성)", desc: "음료·식품 매장 필수. 글래스 도어 4단 220-450만", priceRange: "220~450만", priority: "recommended" },
      { name: "카운터·계산대·POS 거치대", desc: "L자형 카운터 80-150만", priceRange: "80~150만", priority: "primary" },
      { name: "보안 카메라 (한화·아이크론)", desc: "도난 방지. 4채널 NVR + 카메라 4대 50-100만", priceRange: "50~100만", priority: "primary" },
    ],
    pos: [
      { name: "토스플레이스 리테일 모드", desc: "바코드 스캐너 + 재고 관리 + 적립", priceRange: "월 0원~", priority: "primary", url: "https://tossplace.com/" },
      { name: "페이히어 (PayHere) 리테일", desc: "실시간 상품/재고 관리, 매출 분석. 카페24 자체몰 연동", priceRange: "월 0원~5만", priority: "primary", url: "https://payhere.in/" },
      { name: "오케이포스 리테일", desc: "재고 관리·바코드·반품 처리", priceRange: "월 3-5만", priority: "recommended", url: "https://www.okpos.co.kr/" },
    ],
    channels: [
      { name: "네이버 스마트스토어 + 플레이스", desc: "오프라인 + 온라인 동시 운영. 2025-6 개편: 판매수수료 1-3% (마케팅 링크 0.91%)", priceRange: "수수료 1-3%", priority: "primary" },
      { name: "인스타그램 + 카카오톡 채널", desc: "신상 알림·할인 쿠폰", priceRange: "무료", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // BEAUTY — 미용·뷰티 서비스 공통 베이스
  // ═════════════════════════════════════════════════════════════
  beauty: {
    suppliers: [
      { name: "헤어앤미 (Hair&Me)", desc: "프로페셔널 미용재료 도매 플랫폼. 정품 도매 헤어전문몰", priceRange: "도매가", priority: "primary", url: "https://hairnmi.co.kr/" },
      { name: "헤어2000 미용재료할인점", desc: "전국 최대규모 미용인전용 도매 할인점", priceRange: "도매가", priority: "primary", url: "https://m.hair2000.co.kr/" },
      { name: "뱅크헤어·헤어수·여신헤어", desc: "30년 전통 미용재료 쇼핑몰. 드라이기·매직기·염색약·파마약", priceRange: "도매가", priority: "recommended" },
      { name: "아모레퍼시픽·LG생활건강 (전문가용)", desc: "프로페셔널 헤어·스킨 라인. 매월 정기 납품", priceRange: "전문가가", priority: "primary" },
      { name: "올리브영·랄라블라 (전문가 카드)", desc: "소량 보충용 — 전문가 할인 카드 발급", priceRange: "전문가가", priority: "optional" },
    ],
    equipment: [
      { name: "헤어 의자·샴푸의자 (코스타·블루버드)", desc: "회전 유압식 의자 30-80만 / 샴푸의자 100-200만", priceRange: "30~200만", priority: "primary" },
      { name: "드라이기·매직기 (Dyson·BaByliss·Gama)", desc: "다이슨 슈퍼소닉 60만, 가마 IQ 35만, 바비리스 50만", priceRange: "30~80만", priority: "primary" },
      { name: "샴푸대·스팀기 (회전 + 마사지)", desc: "회전 샴푸대 + 스팀 + 두피 마사지 100-300만", priceRange: "100~300만", priority: "primary" },
      { name: "디지털 펌기 (Hair Pro·정수기형)", desc: "디지털 펌기 200-500만 (사용 시 적정)", priceRange: "200~500만", priority: "recommended" },
    ],
    pos: [
      { name: "공비서 (gongbiz) 원장님", desc: "8,000+ 뷰티샵 도입. 네이버 예약 연동, 매출 분석, 알림톡 자동", priceRange: "월 5-15만", priority: "primary", url: "https://gongbiz.kr/" },
      { name: "마메드네 (구 카카오헤어샵)", desc: "뷰티 예약 점유율 70%+, 6,000+ 매장. AI 헤어 시뮬레이션", priceRange: "월 입점 협의", priority: "primary", url: "https://apps.apple.com/kr/app/%EB%A7%88%EB%A9%94%EB%93%9C%EB%84%A4/id1173776109" },
      { name: "콜라보살롱 (Colla:vo)", desc: "헤어/네일/왁싱/속눈썹 통합 예약·고객관리(CRM). 네이버 예약·페이 결제·쿠폰 연동", priceRange: "무료~유료(플랜별)", priority: "recommended", url: "https://www.colavo.kr/" },
      { name: "토스플레이스 (결제만)", desc: "예약 앱과 분리 사용 — 결제만", priceRange: "월 0원~", priority: "recommended", url: "https://tossplace.com/" },
    ],
    channels: [
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "미용실 노출 핵심 — 초기 진성 리뷰 10건+. 가맹점 8만+", priceRange: "무료", priority: "primary" },
      { name: "인스타그램 + 릴스", desc: "헤어·네일 시술 비주얼 콘텐츠 효과 큼", priceRange: "무료", priority: "primary" },
      { name: "카카오톡 채널 (시술 후기·예약 알림)", desc: "재방문 유도 — 시술 사진 동의 후 발송", priceRange: "무료~", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // FITNESS — 피트니스·헬스케어 공통 베이스
  // ═════════════════════════════════════════════════════════════
  fitness: {
    suppliers: [
      { name: "바디엑스 (BODYX)", desc: "2004년 설립 헬스기구 전문. 스텝밀·에어바이크·웨이트벤치·레그프레스 풀라인", priceRange: "대당 50-500만", priority: "primary", url: "https://www.bodyx.co.kr/" },
      { name: "이고진 (egojin)", desc: "근력 운동기구 본사 직영몰. 헬스장 도매 다년", priceRange: "대당 80-400만", priority: "primary", url: "https://egojin.com/" },
      { name: "헬스119 / 스포플렉스 (lifegym)", desc: "신제품·중고 헬스기구 가성비. B2B 등록", priceRange: "대당 50-400만", priority: "recommended", url: "https://health119.kr/" },
      { name: "요가매트·소도구 도매", desc: "요가매트·블록·스트랩 도매. 수강생용 일괄 매트 1.5-5만", priceRange: "매트 1.5-5만", priority: "primary" },
    ],
    equipment: [
      { name: "트레드밀 (라이프피트니스·매트릭스·테크노짐)", desc: "라이프피트니스 95T 800-1,300만 / 매트릭스 T75 500-800만", priceRange: "500~1,300만", priority: "primary" },
      { name: "다용도 머신·케이블 (해머스트렝스·라이프피트니스)", desc: "멀티스테이션 1,500-3,000만", priceRange: "1.5~3천만", priority: "primary" },
      { name: "필라테스 리포머 (Balanced Body·Stott)", desc: "리포머 1대 400-800만 / 캐딜락 600-1,200만", priceRange: "400~1,200만", priority: "primary" },
      { name: "거울·바닥재", desc: "전신 거울 m당 5-8만 / 충격 흡수 바닥재 평당 8-15만", priceRange: "100-300만", priority: "primary" },
    ],
    pos: [
      { name: "바디코디 (BodyCodi) — 헬스 회원관리 1위", desc: "4,000+ 헬스장 도입. 회원·결제·출입(얼굴/QR)·키오스크·PT 통합 SaaS. 프로 요금제", priceRange: "월 4-15만 (2년 약정 시 월 3.7만~)", priority: "primary", url: "https://bodycodi.com/" },
      { name: "하이파이브 (Hi5) — 필라테스/요가", desc: "650+ 센터 도입. 예약·재등록 알림·출석·매출 리포트 카카오 일일 발송", priceRange: "월 5-20만", priority: "primary", url: "https://hifive.im/" },
      { name: "토스플레이스 (결제만)", desc: "회원관리 SaaS와 분리 사용", priceRange: "월 0원~", priority: "recommended", url: "https://tossplace.com/" },
    ],
    channels: [
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "지역 검색 1순위 채널", priceRange: "무료", priority: "primary" },
      { name: "인스타그램 + 비포-애프터", desc: "변화 사진 콘텐츠 강력 (동의서 필수)", priceRange: "무료", priority: "primary" },
      { name: "헬쓱 (Helssg) / 당근 (1일 무료체험권)", desc: "헬스장·PT 회원권 양도 + 신규 회원 유입", priceRange: "수수료 협의", priority: "recommended", url: "https://www.helssg.com/" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // EDUCATION — 교육·학원 공통 베이스
  // ═════════════════════════════════════════════════════════════
  education: {
    suppliers: [
      { name: "교보문고·예스24 (교재 도매)", desc: "초중고 교재 도매가 + 출판사 직거래 (시리즈 30%)", priceRange: "도매가", priority: "primary", url: "https://www.kyobobook.co.kr/" },
      { name: "에이프릴교구·교구코리아", desc: "키즈·유아 교구 도매. 영어·수학 교구", priceRange: "도매가", priority: "recommended" },
      { name: "알파문구·오피스디포 (사무용품)", desc: "프린트지·문구·인쇄용지 정기 매입", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "전자칠판 / IFP (LG·삼성)", desc: "교실 1대당 65인치 200-380만 / 75인치 320-550만", priceRange: "200~550만", priority: "primary" },
      { name: "학생 책상·의자 (퍼시스·시디즈·데스커)", desc: "1인용 책상 9-16만 / 의자 6-12만 (10명 1실 220-330만)", priceRange: "1실 220-330만", priority: "primary", url: "https://www.fursys.com/" },
      { name: "프린터·복합기 (HP·캐논·삼성)", desc: "흑백 레이저 30만 / 컬러 60-120만", priceRange: "30~120만", priority: "primary" },
      { name: "빔 프로젝터·스피커", desc: "1실 50-100만", priceRange: "50~100만", priority: "recommended" },
    ],
    pos: [
      { name: "클래스업 (ClassUp)", desc: "무료 학원 관리 프로그램. 출결·수납·키오스크 올인원", priceRange: "무료~월 협의", priority: "primary", url: "https://classup.io/" },
      { name: "학원조아 (Hakwonjoa)", desc: "학생관리·출결·수납 통합 SaaS. 학부모 알림", priceRange: "월 5-15만", priority: "primary", url: "https://hakwonjoa.com/" },
      { name: "캠스몬 (camsmon) — 입시·종합 학원", desc: "맞춤 LMS, 입시·종합·전문학원 통합 솔루션", priceRange: "월 10-30만", priority: "recommended", url: "https://camsmon.com/" },
      { name: "랠리즈·통통통·온하이", desc: "무료/소형 학원·예체능 특화 옵션", priceRange: "무료~월 8만", priority: "optional", url: "https://www.rallyz.co.kr/" },
    ],
    channels: [
      { name: "네이버 플레이스 + 학원 검색", desc: "지역+과목 검색 핵심", priceRange: "무료", priority: "primary" },
      { name: "맘카페 + 지역 카페 광고", desc: "초중고 학부모 도달 핵심 채널", priceRange: "건당 5-30만", priority: "primary" },
      { name: "당근마켓 동네 광고", desc: "1km 이내 학부모 노출", priceRange: "월 10-30만", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // PET — 반려동물 서비스 공통 베이스
  // ═════════════════════════════════════════════════════════════
  pet: {
    suppliers: [
      { name: "펫도매 (petdome)", desc: "펫 사료·간식·용품 B2B 입점형 도매 1순위. 정기 배송", priceRange: "도매가", priority: "primary", url: "https://petdome.co.kr/" },
      { name: "펫허그 B2B (pethugb2b)", desc: "사업자 전용 도매 플랫폼. 사료·간식·용품", priceRange: "B2B 도매", priority: "primary", url: "https://pethugb2b.co.kr/" },
      { name: "더펫마트 (thepetmart)", desc: "B2B 도매 쇼핑몰. 사료·간식·미용·각종 용품 도매가", priceRange: "도매가", priority: "recommended", url: "https://www.thepetmart.co.kr/" },
      { name: "비요세까이 (미용가위 전문)", desc: "프로 미용 가위 한국 제조. 펫 그루머 표준", priceRange: "30~100만", priority: "primary", url: "https://biyosekkai.com/" },
    ],
    equipment: [
      { name: "미용대 (그루밍 테이블)", desc: "유압식 30-80만 / 전동식 80-150만", priceRange: "30~150만", priority: "primary" },
      { name: "스탠드 드라이기·블로어", desc: "스탠드 드라이기 40-100만 / 블로어 30-80만", priceRange: "30~100만", priority: "primary" },
      { name: "샴푸 욕조 (스테인리스)", desc: "60x90cm 50-120만", priceRange: "50~120만", priority: "primary" },
      { name: "케이지 (5-10단 + 환기)", desc: "10단 케이지 100-200만 (호텔 운영)", priceRange: "100~200만", priority: "recommended" },
    ],
    pos: [
      { name: "공비서 (gongbiz) — 펫 그루밍 지원", desc: "펫 그루밍·뷰티 통합 CRM. 8,000+ 매장. 예약·매출·알림톡", priceRange: "월 5-15만", priority: "primary", url: "https://gongbiz.kr/" },
      { name: "토스플레이스 + 카카오 알림톡", desc: "결제 + 예약 알림톡 분리 운영", priceRange: "월 0원~", priority: "recommended", url: "https://tossplace.com/" },
    ],
    channels: [
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "지역 펫샵 검색 핵심", priceRange: "무료", priority: "primary" },
      { name: "인스타그램 + 강아지 사진 (동의)", desc: "펫 비포-애프터 시술 사진 강력", priceRange: "무료", priority: "primary" },
      { name: "당근마켓 동네 광고", desc: "지역 펫 가족 도달", priceRange: "월 5-20만", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // LIVING-SERVICE — 생활 서비스 공통 베이스
  // ═════════════════════════════════════════════════════════════
  "living-service": {
    suppliers: [
      { name: "월드워시·LG프로 (세제 도매)", desc: "세탁 / 청소 세제 정기 납품", priceRange: "도매가", priority: "primary" },
      { name: "다이슨·로보락·일렉트로룩스 (청소 장비)", desc: "사업자 등록 시 직거래·할인", priceRange: "B2B가", priority: "recommended" },
    ],
    equipment: [
      { name: "세탁기·건조기 (LG·삼성)", desc: "20kg 산업용 380-650만 / 건조기 270-430만 (2026 인상)", priceRange: "270~650만", priority: "primary" },
      { name: "프레스·다림질 장비", desc: "스팀 프레스 80-200만", priceRange: "80~200만", priority: "primary" },
      { name: "수납·행거 시스템", desc: "회전 행거 + 분류 시스템 50-150만", priceRange: "50~150만", priority: "recommended" },
    ],
    pos: [
      { name: "토스플레이스 + 카카오 알림톡", desc: "픽업·완료 알림톡 자동 발송", priceRange: "월 0원~", priority: "primary", url: "https://tossplace.com/" },
      { name: "워시엔조이 (셀프빨래방 솔루션 1위)", desc: "1,200+ 점포. 24시간 AI 도우미·창업 패키지·결제 연동", priceRange: "월 30-50만", priority: "recommended", url: "https://washenjoy.co.kr/" },
      { name: "런드리24 (laundry24)", desc: "365일 24시간 무인세탁편의점 솔루션. 의식주컴퍼니 운영", priceRange: "월 20-40만", priority: "optional", url: "https://laundry24.net/" },
      { name: "런드리고 (laundrygo)", desc: "픽업·배달형 모바일 세탁. 비대면 입점 가능", priceRange: "수수료 협의", priority: "optional", url: "https://www.laundrygo.com/" },
    ],
    channels: [
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "지역 세탁소·청소업체 검색 1순위", priceRange: "무료", priority: "primary" },
      { name: "당근마켓 동네 광고", desc: "1km 이내 가구 도달", priceRange: "월 5-20만", priority: "primary" },
      { name: "숨고 / 크몽 (방문 청소 서비스)", desc: "수수료 5-10%. 방문형만", priceRange: "수수료 5-10%", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // SPACE — 공간 임대 공통 베이스
  // ═════════════════════════════════════════════════════════════
  space: {
    suppliers: [
      { name: "퍼시스 (fursys) · 시디즈 · 데스커", desc: "퍼시스그룹 통합 라인업. 사무·SOHO·에르고노믹 의자 표준", priceRange: "B2B가", priority: "primary", url: "https://www.fursys.com/" },
      { name: "리바트·일룸 (인테리어 가구)", desc: "게스트하우스·파티룸 침구·소파. 일룸은 퍼시스그룹 라이프스타일", priceRange: "B2B가", priority: "recommended" },
    ],
    equipment: [
      { name: "출입통제·도어락 (NFC·QR 스마트락)", desc: "지문·QR·NFC 출입 시스템 50-150만", priceRange: "50~150만", priority: "primary" },
      { name: "프로젝터·디스플레이·스피커", desc: "회의실·스튜디오 1실 100-300만", priceRange: "100~300만", priority: "primary" },
      { name: "에어컨·환기 시스템", desc: "20-30평 5-8만 BTU 220-450만", priceRange: "220~450만", priority: "primary" },
    ],
    pos: [
      { name: "스페이스클라우드 (SpaceCloud) — 공간대여 1위", desc: "공간 예약·결제·관리 통합. 파티룸·연습실·촬영·공유주방·세미나실", priceRange: "월 5-30만", priority: "primary", url: "https://www.spacecloud.kr/" },
      { name: "패스트파이브 빌딩솔루션", desc: "공유오피스 1위(60지점) 운영 노하우 외부 제공. 사옥구축·플렉스", priceRange: "협의", priority: "recommended", url: "https://buildingsolution.co.kr/fastfive-launching" },
      { name: "토스플레이스 (결제만)", desc: "예약 앱과 분리 사용", priceRange: "월 0원~", priority: "recommended", url: "https://tossplace.com/" },
    ],
    channels: [
      { name: "스페이스클라우드 등록 (필수)", desc: "한국 공간 임대 1위 플랫폼. 수수료 15-20%", priceRange: "수수료 15-20%", priority: "primary", url: "https://www.spacecloud.kr/" },
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "지역 검색 노출", priceRange: "무료", priority: "primary" },
      { name: "에어비앤비 (게스트하우스만)", desc: "글로벌 게스트 유입. 수수료 14-16%", priceRange: "수수료 14-16%", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // ONLINE-DIGITAL — 온라인 베이스 (기존 store_setup·sourcing_setup 보완)
  // ═════════════════════════════════════════════════════════════
  "online-digital": {
    suppliers: [
      { name: "도매꾹 (Domeggook)", desc: "온라인 도매 1위. 1688닷컴 전용관 운영, 검증 상품 7만+. 소량 매입", priceRange: "도매가", priority: "primary", url: "https://www.domeggook.com/" },
      { name: "동대문 종합시장 + 사입삼촌", desc: "패션·잡화 온라인 셀러 1번지", priceRange: "도매가", priority: "primary" },
      { name: "1688·타오바오 (해외 도매)", desc: "구매대행·중국 도매. 도매꾹/희명무역 등 통한 한국어 지원", priceRange: "해외 도매", priority: "recommended", url: "https://www.1688.com/" },
    ],
    equipment: [
      { name: "포장 설비 (테이블·박스·완충재·송장 프린터)", desc: "초기 셋업 100-300만", priceRange: "100~300만", priority: "primary" },
      { name: "촬영 장비 (카메라·조명·배경지)", desc: "스마트폰 + LED 라이트 50-150만", priceRange: "50~150만", priority: "primary" },
      { name: "재고 보관 (선반·박스·라벨링)", desc: "초기 50-100만", priceRange: "50~100만", priority: "recommended" },
    ],
    pos: [
      { name: "네이버 스마트스토어", desc: "한국 1위 온라인몰. 2025-6 개편: 판매수수료 1-3%, 마케팅 링크 0.91% (외부 유입), 주문관리 수수료 별도. 정산 3-4일", priceRange: "수수료 1-3%", priority: "primary", url: "https://sell.smartstore.naver.com/" },
      { name: "쿠팡 (입점 + 로켓배송 옵션)", desc: "수수료 5-15%. 풀필먼트 위탁 가능", priceRange: "수수료 5-15%", priority: "primary", url: "https://wing.coupang.com/" },
      { name: "Cafe24 / 메이크샵 (자체몰)", desc: "월 5-50만. 브랜드몰 운영. 페이히어 POS 연동 가능", priceRange: "월 5-50만", priority: "recommended", url: "https://www.cafe24.com/" },
    ],
    channels: [
      { name: "인스타그램 릴스 + 콘텐츠", desc: "D2C 1순위 채널. 무료", priceRange: "무료", priority: "primary" },
      { name: "와디즈 (Wadiz) 크라우드펀딩", desc: "성공 시 7-10% 수수료. 신상 출시 효과 큼", priceRange: "수수료 7-10%", priority: "primary", url: "https://www.wadiz.kr/" },
      { name: "텀블벅 (Tumblbug) 크라우드펀딩", desc: "성공 시 플랫폼 5% + 결제 3%. 크리에이터 친화", priceRange: "수수료 8% (성공시)", priority: "primary", url: "https://tumblbug.com/" },
      { name: "당근마켓 비즈프로필", desc: "지역 셀러 + 동네 광고", priceRange: "월 5-30만", priority: "recommended" },
    ],
  },
};

// ═════════════════════════════════════════════════════════════
// SUB-INDUSTRY 전용 데이터 — 특화 항목만 추가/오버라이드
// (없으면 카테고리 베이스로 폴백)
// ═════════════════════════════════════════════════════════════

export const SUB_INDUSTRY_VENDOR_DATA: Record<string, Partial<SubIndustryVendorData>> = {
  // ─── FOOD (6) ──────────────────────────────────────────────
  "korean-casual": {
    suppliers: [
      { name: "푸드팡 — 한식 식자재 정기배송", desc: "쌀·잡곡·김치·반찬 묶음. 백반집 1순위. 전날 22시 주문 → 익일 8시 배송", priceRange: "월 200-500만", priority: "primary", url: "https://foodpang.co/" },
      { name: "마장축산물시장 (정육)", desc: "삼겹살·소고기·돼지뼈 도매. 백반·국밥 핵심 원자재", priceRange: "도매가", priority: "primary", url: "http://www.mjmm.co.kr/" },
      { name: "가락시장 청과·수산", desc: "야채·과일·생선 새벽 직접 매입. 위탁상 통한 정기 배송도 가능", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
      { name: "해천·청정원·CJ제일제당 (양념)", desc: "고추장·된장·간장·참기름 도매가 정기 납품", priceRange: "도매가", priority: "primary" },
      { name: "CJ프레시웨이 (온리원푸드넷)", desc: "한식 백반 패키지 (반찬 8-10종 묶음 일괄)", priceRange: "월 정기", priority: "recommended", url: "https://www.cjfreshway.com/" },
      { name: "경동시장 (서울 동대문구)", desc: "한약재·건어물·잡곡 도매. 약선 한식 추가 시", priceRange: "도매가", priority: "optional" },
    ],
    equipment: [
      { name: "업소용 밥솥 (린나이 RR-S250F·쿠쿠 CRP-EH)", desc: "30인용 가스 밥솥 90-160만 / 60인용 160-260만", priceRange: "90~260만", priority: "primary" },
      { name: "가스레인지 4구 + 튀김기", desc: "한식 백반 4-6개 메뉴 동시 조리. 4구 60-100만", priceRange: "60~100만", priority: "primary" },
      { name: "보온고 (반찬 보관)", desc: "다단 보온고 220-330만. 백반 반찬 8-10종 회전 보관", priceRange: "220~330만", priority: "primary" },
      { name: "김치냉장고 (위니아·삼성 BESPOKE)", desc: "스탠드형 4도어 220-450만. 김치 자체 발효 매장 필수", priceRange: "220~450만", priority: "primary" },
      { name: "스테인리스 작업대·싱크대 2조", desc: "한식 다종 메뉴 작업 동선. 1.8m+ 권장", priceRange: "60~120만", priority: "primary" },
    ],
  },
  "delivery-meals": {
    suppliers: [
      { name: "포장의신·다나와포장 (배달 포장재)", desc: "찌개컵·뚝배기 일회용·이중 단열 봉투. 월 50-100만 표준", priceRange: "월 50-100만", priority: "primary" },
      { name: "푸드팡 (식자재) — 도시락 패키지", desc: "1인분 단위 묶음 식자재", priceRange: "월 200-400만", priority: "primary", url: "https://foodpang.co/" },
    ],
    equipment: [
      { name: "도시락 자동포장기 (오토팩·KP)", desc: "1일 200-500개 도시락 자동 밀봉. 220-550만", priceRange: "220~550만", priority: "recommended" },
      { name: "배달 보온백·냉장백", desc: "배달원용 + 매장용. 50-100만", priceRange: "50~100만", priority: "primary" },
    ],
    channels: [
      { name: "배민 + 쿠팡이츠 (차등 수수료 2.0-7.8%)", desc: "배달 전문 매장 = 매출 80-100% 의존. 차등 요금제 비교 필수 (2025 시행)", priceRange: "수수료 2.0-7.8%", priority: "primary" },
      { name: "요기요 + 위메프오 (서브)", desc: "노출 다각화. 요기요 4.7-9.7% + 네이버플러스 멤버십 연동", priceRange: "수수료 4.7-9.7%", priority: "recommended" },
    ],
  },
  "salad-healthy": {
    suppliers: [
      { name: "가락몰 신선 채소", desc: "샐러드 베이스 채소·아보카도·과일. 신선도 핵심", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
      { name: "CJ프레시웨이 — 단백질 (닭가슴살·연어)", desc: "전처리된 단백질 정기 배송", priceRange: "월 정기", priority: "primary", url: "https://www.cjfreshway.com/" },
      { name: "닥터그래놀라·뽀로비커리 (드레싱)", desc: "건강 드레싱 전문 도매", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "샐러드용 디스플레이 냉장고 (4도어)", desc: "샐러드바 운영 시 핵심", priceRange: "320~550만", priority: "primary" },
      { name: "야채 슬라이서·푸드프로세서 (로보쿠프)", desc: "신선 채소 일괄 손질", priceRange: "100~250만", priority: "primary" },
    ],
  },
  "ramen-noodle": {
    suppliers: [
      { name: "면 도매 (면사랑·풍년면업)", desc: "라면·중면·소바 면 정기 납품. 면사랑은 마켓컬리·B2B 동시", priceRange: "도매가", priority: "primary" },
      { name: "농협하나로·해천 (육수 베이스)", desc: "닭·소·돼지 육수 액상·분말 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "라면냉장고·면 보관기", desc: "면류 저온 보관. 100-200만", priceRange: "100~200만", priority: "primary" },
      { name: "라멘기·면조리기", desc: "전문 라멘 매장. 220-450만", priceRange: "220~450만", priority: "recommended" },
    ],
  },
  "chicken-burger": {
    suppliers: [
      { name: "하림몰·마니커몰·체리부로 (닭고기)", desc: "치킨 닭고기 도매 3강. 하림 점유율 20%, 마니커 직거래 시 단가 우대", priceRange: "도매가", priority: "primary", url: "https://harimmall.com/" },
      { name: "오뚜기·청정원 (양념·소스)", desc: "치킨 양념·시즈닝 도매", priceRange: "도매가", priority: "primary" },
      { name: "포장의신 — 치킨박스·랩핑", desc: "치킨 전용 종이 박스·기름 차단 종이", priceRange: "월 30-80만", priority: "primary" },
    ],
    equipment: [
      { name: "튀김기 (3구 이상 가스 / 전기)", desc: "린나이·LG 3구 220-380만. 동시 조리 필수", priceRange: "220~380만", priority: "primary" },
      { name: "냉동·냉장 적재 (4도어)", desc: "닭 보관 냉장고 + 냉동고", priceRange: "320~550만", priority: "primary" },
    ],
    channels: [
      { name: "배민 1·쿠팡이츠 (치킨 카테고리)", desc: "치킨 매장 = 배달 매출 60-80%. 차등 수수료 2.0-7.8% + 광고 효율 측정 필수", priceRange: "수수료 2.0-7.8%", priority: "primary" },
    ],
  },
  "western-pasta-brunch": {
    suppliers: [
      { name: "마노이타·이태리 식자재 수입사", desc: "파스타·올리브오일·트러플·치즈 전문 수입 도매", priceRange: "수입 도매가", priority: "primary" },
      { name: "오뚜기·청정원 (소스 베이스)", desc: "한식화된 파스타·브런치 소스 도매", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "파스타 머신·도우 믹서 (KitchenAid·이마쿠나)", desc: "면 전문점 시 220-450만", priceRange: "220~450만", priority: "recommended" },
      { name: "피자 화덕·오븐 (모렐로·피카드)", desc: "전문 화덕 850-2,200만", priceRange: "850~2200만", priority: "optional" },
      { name: "에스프레소 머신 (브런치 카페 겸업 시)", desc: "라마르조코·VBM 250-1,300만", priceRange: "250~1300만", priority: "recommended", url: "https://lamarzoccokorea.co.kr/" },
    ],
  },

  // ─── CAFE-DESSERT (6) ──────────────────────────────────────
  "takeout-coffee": {
    suppliers: [
      { name: "커피몰·스미스바니 (블렌드 도매)", desc: "테이크아웃 카페 적합 블렌드. kg당 18,000-28,000원", priceRange: "kg당 1.8-2.8만", priority: "primary", url: "https://www.cofm.co.kr/" },
      { name: "포장의신 — 종이컵·홀더·봉투", desc: "테이크아웃 일회용품 1순위 도매", priceRange: "월 30-60만", priority: "primary" },
    ],
    equipment: [
      { name: "에스프레소 머신 (VBM·심팔리·페마)", desc: "VBM 250-450만 / 페마 E61 400-700만 (테이크아웃 적정 가격대)", priceRange: "250~700만", priority: "primary" },
      { name: "주문·결제 키오스크", desc: "테이크아웃 효율화. 200-400만", priceRange: "200~400만", priority: "recommended" },
    ],
  },
  "specialty-coffee": {
    suppliers: [
      { name: "테라로사·커피리브레 (스페셜티)", desc: "한국 1세대 스페셜티. kg당 35,000-60,000원. 다이렉트 트레이드", priceRange: "kg당 3.5-6만", priority: "primary", url: "https://www.terarosa.com/" },
      { name: "MOMOS·5BREWING·프롤로그 (싱글오리진)", desc: "마이크로 로스터 직거래. WBC 우승자급 매장", priceRange: "kg당 5-9만", priority: "primary" },
      { name: "페리아·코케비즈 (도매 플랫폼)", desc: "신선 로스팅 + 카페 컨설팅. 샘플 발송", priceRange: "kg당 2.5-5만", priority: "recommended", url: "https://www.parea.co.kr/WHOLESALE" },
    ],
    equipment: [
      { name: "에스프레소 머신 — 라마르조코 GB5·KB90", desc: "스페셜티 표준. 850-1,600만", priceRange: "850~1600만", priority: "primary", url: "https://lamarzoccokorea.co.kr/" },
      { name: "그라인더 — Mahlkönig EK43·Anfim", desc: "EK43 380-450만 (브루잉 표준)", priceRange: "200~450만", priority: "primary" },
      { name: "수동 추출 도구 — 케맥스·하리오·아에로프레스", desc: "메뉴 다각화", priceRange: "10~50만", priority: "recommended" },
    ],
  },
  "dessert-cafe": {
    suppliers: [
      { name: "삼립·뚜레쥬르 (냉동 베이커리 도매)", desc: "베이킹 안 하는 디저트 카페 표준", priceRange: "도매가", priority: "primary" },
      { name: "발로나·이즈니 (쇼콜라·초콜릿)", desc: "프리미엄 쇼콜라 디저트 시", priceRange: "수입 도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "디저트 진열 쇼케이스 (4단 글래스 도어)", desc: "디저트 카페 핵심 — 시각 노출", priceRange: "220~450만", priority: "primary" },
      { name: "오븐 (UNOX·BOSCH 업소용)", desc: "베이킹 카페 시 220-550만", priceRange: "220~550만", priority: "recommended" },
    ],
  },
  "bakery-studio": {
    suppliers: [
      { name: "CJ제일제당·대한제분 (밀가루)", desc: "강력분·박력분·이스트 정기 매입", priceRange: "도매가", priority: "primary" },
      { name: "발로나·페로니·이즈니 (쇼콜라·버터)", desc: "프리미엄 베이커리 핵심 자재", priceRange: "수입가", priority: "primary" },
    ],
    equipment: [
      { name: "도우 믹서 (Hobart·KitchenAid 60L)", desc: "Hobart H600 1,800만+ / Kitchenaid 7QT 100-200만", priceRange: "200~1800만", priority: "primary" },
      { name: "데크 오븐·컨벡션 오븐", desc: "베이커리 핵심. 데크 오븐 2단 850-1,600만", priceRange: "850~1600만", priority: "primary" },
      { name: "발효기 (도우 컨디셔너)", desc: "온습도 조절 발효. 320-650만", priceRange: "320~650만", priority: "recommended" },
    ],
  },
  "icecream-bingsu": {
    suppliers: [
      { name: "서울우유·매일·연세 (우유)", desc: "빙수용 우유 정기 납품", priceRange: "L당 1.9-2.7천", priority: "primary" },
      { name: "팥·인절미·과일 토핑 도매 (가락몰)", desc: "토핑 신선도 핵심", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
    ],
    equipment: [
      { name: "애프터눈 눈꽃빙수기 (DIM-200/300/400)", desc: "DIM-200NA 220-240만 / DIM-300NW 380-420만 (설빙 표준 / 100% 한국 제조)", priceRange: "220~420만", priority: "primary", url: "https://afternoon2014.co.kr/" },
      { name: "토핑 디스플레이 냉장고 (4도어)", desc: "팥·과일 토핑 시각화. 320-650만", priceRange: "320~650만", priority: "primary" },
      { name: "아이스크림 머신 (필립스 / 카르피지아니)", desc: "소프트 아이스크림 머신 220-550만", priceRange: "220~550만", priority: "recommended" },
    ],
  },
  "self-serve-cafe": {
    suppliers: [
      { name: "코라커피·리믹스커피 (대용량 원두 OEM)", desc: "카페 납품·OEM 원두 10kg부터. 사업자 전용", priceRange: "kg당 1.2-2만", priority: "primary", url: "https://www.koracoffee.co.kr" },
      { name: "보사노바 커피로스터스 (도매)", desc: "HACCP 로스팅팩토리 원두 도매 납품", priceRange: "도매가", priority: "recommended", url: "https://www.bncr.co.kr/wholesale" },
    ],
    equipment: [
      { name: "셀프 머신 (eversys·Schaerer·다토 빈투컵)", desc: "전자동 빈투컵 머신 1000-2500만", priceRange: "1000~2500만", priority: "primary" },
      { name: "키오스크·QR 주문 시스템", desc: "셀프 카페 핵심 — 인건비 절감", priceRange: "320~550만", priority: "primary" },
    ],
  },

  // ─── BEAUTY (6) ────────────────────────────────────────────
  "hair-salon": {
    suppliers: [
      { name: "헤어앤미·헤어2000 (도매 1번지)", desc: "프로페셔널 미용재료 도매. BAB·SOLPA·MISE EN SCENE 일괄 매입", priceRange: "도매가", priority: "primary", url: "https://hairnmi.co.kr/" },
      { name: "아모레 프로페셔널 (라네즈·아이오페·헤라)", desc: "전문가용 헤어·스킨 라인", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "디지털 펌기 (Hair Pro·정수기형)", desc: "디지털 펌기 220-550만 (사용 빈도 높을 때)", priceRange: "220~550만", priority: "recommended" },
      { name: "샴푸대 (회전 + 마사지)", desc: "회전 샴푸대 220-450만", priceRange: "220~450만", priority: "primary" },
    ],
  },
  "nail-studio": {
    suppliers: [
      { name: "헤어앤미·뷰카마켓 (젤·매니큐어)", desc: "젤·매니큐어 컬러 도매. 미용재료 도매몰 1번지", priceRange: "도매가", priority: "primary", url: "https://hairnmi.co.kr/" },
      { name: "OPI·CND·Gelish (수입 젤)", desc: "프리미엄 네일 살롱 수입 도매", priceRange: "수입가", priority: "recommended" },
    ],
    equipment: [
      { name: "네일 LED 램프·UV 큐어링", desc: "1구당 5-15만, 5-10구 일괄", priceRange: "30~100만", priority: "primary" },
      { name: "네일 의자 + 작업대 세트", desc: "회전 의자 + 작업대 통합 80-150만/세트", priceRange: "80~150만/세트", priority: "primary" },
      { name: "환기·집진 시스템", desc: "젤 분진 흡인. 1대당 30-80만", priceRange: "30~80만", priority: "primary" },
    ],
  },
  "skin-care-room": {
    suppliers: [
      { name: "우진코스메틱 (에스테틱 전문몰)", desc: "관리실 화장품·스파·미용기기 사업자 전용", priceRange: "전문가가", priority: "primary", url: "https://m.woojincosmetic.co.kr" },
      { name: "스킨도매·AWC 피부미용도매센터", desc: "에스테틱 화장품·재료·앰플 종합 도매", priceRange: "전문가가", priority: "recommended", url: "https://skindomae.co.kr" },
    ],
    equipment: [
      { name: "관리 베드 (전동 리프트)", desc: "전동식 관리 베드 110-220만", priceRange: "110~220만", priority: "primary" },
      { name: "고주파·LED 마스크·스팀기", desc: "고주파 220-550만 / LED 마스크 110-330만 / 스팀기 50-150만", priceRange: "110~550만", priority: "primary" },
    ],
  },
  "waxing-studio": {
    suppliers: [
      { name: "SB-SHOP·뷰티난다 (왁싱 소모품 도매)", desc: "슈가링/소프트/하드왁스·워머기·부직포·전후처리제", priceRange: "kg당 1-3만", priority: "primary", url: "https://sb-shop.co.kr" },
      { name: "사라센 (왁싱 부자재)", desc: "워머기·실리콘바스켓·부직포 페이퍼·왁스", priceRange: "도매가", priority: "recommended", url: "https://thesaracen.com" },
    ],
    equipment: [
      { name: "왁스 워머 (1구·2구·5구)", desc: "1구 5-15만 / 2구 10-25만 / 5구 30-60만", priceRange: "5~60만", priority: "primary" },
      { name: "관리 베드 + 일회용 시트", desc: "전동 베드 110-220만 + 시트 월 5-10만", priceRange: "110~220만", priority: "primary" },
    ],
  },
  "eyelash-brow": {
    suppliers: [
      { name: "속눈썹 익스텐션 도매 (코스타·블링크 브라운)", desc: "C·D컬·U컬 다양. kg당 5-15만", priceRange: "kg당 5-15만", priority: "primary" },
      { name: "브로우 염색·왁스 도매", desc: "브로우 헤나·라미네이션 자재", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "확대경·LED 작업등 (3X-5X)", desc: "10-30만 / 시술자 시야 핵심", priceRange: "10~30만", priority: "primary" },
      { name: "관리 베드 + 베개", desc: "110-220만", priceRange: "110~220만", priority: "primary" },
    ],
  },
  "makeup-bridal": {
    suppliers: [
      { name: "헤어2000·글로벌뷰티 (미용재료 도매)", desc: "메이크업·헤어재료 미용인 전용 최대 도매", priceRange: "전문가가", priority: "primary", url: "https://m.hair2000.co.kr" },
      { name: "CAC화장품·민팩토리 (브러쉬·툴)", desc: "전문가용 메이크업 제품·브러쉬 제조", priceRange: "전문가가", priority: "recommended", url: "https://caccosme.co.kr" },
    ],
    equipment: [
      { name: "메이크업 거울·LED 조명", desc: "스탠드 거울 + LED 50-150만", priceRange: "50~150만", priority: "primary" },
      { name: "메이크업 의자 (유압식)", desc: "회전 유압식 30-80만", priceRange: "30~80만", priority: "primary" },
    ],
  },

  // ─── RETAIL (6) — 2026-06 웹 검증 ──────────────────────────
  "convenience-small": {
    suppliers: [
      { name: "주류특공대 (9bottle1box)", desc: "사업자 전용 주류 발주. 맥주·소주·와인 소량발주 + 세금계산서", priceRange: "도매가", priority: "primary", url: "https://www.9bottle1box.com/" },
      { name: "고래마트 (음료 도매)", desc: "음료·생수 사업자 도매. 회원가 + 세금계산서", priceRange: "도매가", priority: "primary", url: "https://m.whalemart.co.kr/" },
      { name: "코카콜라·롯데칠성 지역대리점", desc: "음료 직거래 정기납품. 거래처 등록 후 공급가", priceRange: "대리점가", priority: "recommended" },
    ],
    equipment: [
      { name: "라셀르·한성 쇼케이스 (음료 냉장)", desc: "음료 쇼케이스 신품 60-250만 / 중고 30-120만", priceRange: "60~250만", priority: "primary", url: "https://lasselemall.com/" },
      { name: "오케이포스·포스뱅크 (소매 POS)", desc: "바코드·재고관리 국산 POS. 26만 가맹점", priceRange: "70~150만", priority: "primary", url: "https://www.okpos.co.kr/" },
    ],
    pos: [
      { name: "토스플레이스 POS", desc: "결제·재고·고객 통합. SW 무료", priceRange: "기기 별도", priority: "recommended", url: "https://tossplace.com/product/pos" },
    ],
  },
  "lifestyle-goods": {
    suppliers: [
      { name: "도매꾹 (B2B 도매 1위)", desc: "잡화·인테리어 소품 소량 사입", priceRange: "도매가", priority: "primary", url: "https://domeggook.com/" },
      { name: "오너클랜 (위탁·도매)", desc: "사업자 승인 후 도매가. 위탁 무재고 가능", priceRange: "도매가", priority: "recommended", url: "https://www.ownerclan.com/" },
      { name: "도매토피아 (직수입·직발송)", desc: "생활소품 다품종 종합 도매", priceRange: "도매가", priority: "recommended", url: "https://dometopia.com/" },
    ],
    equipment: [
      { name: "마켓비 (상업용 진열가구)", desc: "선반·진열대 5-30만. 매장 디스플레이", priceRange: "5~30만", priority: "recommended", url: "https://marketb.kr/" },
    ],
    pos: [
      { name: "토스플레이스 / 페이히어", desc: "소품샵 POS·재고·멤버십", priceRange: "구독+수수료", priority: "primary", url: "https://payhere.in/" },
    ],
  },
  "beauty-supplies": {
    suppliers: [
      { name: "화장품 도매마켓", desc: "기초·기능성·메이크업 종합 도매. 창업 지원", priceRange: "도매가", priority: "primary", url: "https://domaemarket.kr/" },
      { name: "화장품스토리 (CMT)", desc: "K-Beauty 브랜드 도매·위탁 B2B", priceRange: "도매가", priority: "recommended", url: "https://www.cmtstory.com/" },
      { name: "화곡동 화장품 도매단지", desc: "서울 최대 오프라인 도매. 직접 단가협상", priceRange: "현장 도매가", priority: "optional" },
    ],
    equipment: [
      { name: "마켓비 (진열·테스터대)", desc: "진열 선반·디스플레이 5-40만", priceRange: "5~40만", priority: "recommended", url: "https://marketb.kr/" },
    ],
    pos: [
      { name: "페이히어 (멤버십 강점)", desc: "단골 적립·멤버십 태블릿 POS", priceRange: "구독+수수료", priority: "primary", url: "https://payhere.in/" },
    ],
  },
  "fashion-accessories": {
    suppliers: [
      { name: "신상마켓 (동대문 도매 1위)", desc: "동대문 도매 80%+ 입점. 앱 사입·배송", priceRange: "도매가", priority: "primary", url: "https://sinsangmarket.kr/" },
      { name: "딜리버드 (사입·검수·배송 대행)", desc: "신상마켓 운영사. 사입대행 통합", priceRange: "대행 수수료", priority: "primary", url: "https://dealicious.kr/services" },
      { name: "남도마켓 (액세서리 강점)", desc: "남대문·동대문 도매 소싱", priceRange: "도매가", priority: "recommended", url: "https://www.ndmarket.co.kr/" },
    ],
    equipment: [
      { name: "마켓비 (행거·진열)", desc: "행거·전신거울·진열 테이블 3-20만", priceRange: "3~20만", priority: "recommended", url: "https://marketb.kr/" },
    ],
    pos: [
      { name: "오케이포스 (SKU 재고)", desc: "사이즈·컬러 SKU 재고관리 강점", priceRange: "70~150만", priority: "primary", url: "https://www.okpos.co.kr/" },
    ],
  },
  "health-food-store": {
    suppliers: [
      { name: "노바렉스 (건기식 ODM 1위)", desc: "개별인정원료 다수. 자체 브랜드 제조", priceRange: "OEM 견적", priority: "primary", url: "https://www.novarex.co.kr/" },
      { name: "코스맥스엔비티·콜마비앤에이치", desc: "건기식 OEM/ODM 대형 제조사", priceRange: "OEM 견적", priority: "recommended", url: "https://www.cosmaxnbt.com/" },
      { name: "QOEM (소량 OEM)", desc: "소규모 창업·초기물량 낮은 MOQ", priceRange: "소량 OEM", priority: "optional", url: "https://www.qoem.co.kr/OEM" },
    ],
    equipment: [
      { name: "마켓비 진열대 + 냉장 쇼케이스", desc: "상온 매대 5-30만 / 유산균 냉장 쇼케이스", priceRange: "5~200만", priority: "recommended" },
    ],
    pos: [
      { name: "오케이포스 (유통기한·로트)", desc: "다품목 재고·유통기한 관리", priceRange: "70~150만", priority: "primary", url: "https://www.okpos.co.kr/" },
    ],
  },
  "unmanned-retail": {
    suppliers: [
      { name: "지역 빙과 대리점 (빙그레·롯데웰푸드·해태)", desc: "무인 아이스크림점 핵심. 대리점 정기납품", priceRange: "대리점가", priority: "primary" },
      { name: "도매토피아·미성비즈몰 (스낵·음료)", desc: "무인 스낵점 보충 + 차별화 수입과자", priceRange: "도매가", priority: "recommended", url: "https://dometopia.com/" },
    ],
    equipment: [
      { name: "에어포스 무인매장 IoT", desc: "키오스크+CCTV+냉난방+출입문 앱 통합제어", priceRange: "패키지 견적", priority: "primary", url: "https://airpos.co.kr/" },
      { name: "테크맥스·넥스니즈 키오스크", desc: "셀프결제 키오스크 200-500만", priceRange: "200~500만", priority: "recommended" },
    ],
    pos: [
      { name: "토스플레이스 무인 셀프결제", desc: "바코드 셀프결제 24시 무인운영", priceRange: "기기 별도", priority: "primary", url: "https://tossplace.com/sector/cashierless" },
      { name: "ADT캡스·에스원 무인 AI CCTV", desc: "이상탐지·출동경비·게이트 통합 보안", priceRange: "월 구독", priority: "recommended", url: "https://www.adtcaps.co.kr/" },
    ],
  },

  // ─── FITNESS (6) — 2026-06 웹 검증 ─────────────────────────
  "pilates-studio": {
    suppliers: [
      { name: "요가몰 (매트·소도구 도매)", desc: "강사·센터 도매할인. 매트·링·볼", priceRange: "도매가", priority: "primary", url: "https://yogamall.co.kr/" },
    ],
    equipment: [
      { name: "케어필라테스 (국산 리포머)", desc: "국산 리포머·캐딜락·체어. 1,000+ 센터 납품", priceRange: "국산 중가", priority: "primary", url: "https://pilatesmall.kr/" },
      { name: "발란스드바디 (수입 리포머)", desc: "미국 프리미엄 정식수입. 2년 보증", priceRange: "수입 고가", priority: "recommended", url: "https://balancedbodyshop.co.kr/" },
    ],
    pos: [
      { name: "하이파이브 (필라테스 예약 강점)", desc: "협회 최다 지점. 무료 예약앱+매출관리", priceRange: "무료+유료", priority: "primary", url: "https://www.hifive.center/" },
      { name: "바디코디 (CRM 1위)", desc: "4,000+ 시설. 키오스크·출입 통합", priceRange: "월 구독", priority: "recommended", url: "https://bodycodi.com/" },
    ],
  },
  "pt-gym": {
    suppliers: [
      { name: "머슬팩토리 (보충제 도매)", desc: "단백질 보충제 위탁배송 도매", priceRange: "도매가", priority: "primary", url: "https://www.musclefactory.co.kr/" },
    ],
    equipment: [
      { name: "KO Health (헬스기구 제조·직수입)", desc: "300평 전시매장. 신규 일괄 셋업 견적", priceRange: "신품 견적", priority: "primary", url: "https://m.kohealthco.or.kr/" },
      { name: "헬스119 (신품+중고 가성비)", desc: "중고 머신으로 초기투자 절감", priceRange: "중고/신품", priority: "recommended", url: "https://health119.kr/" },
    ],
    pos: [
      { name: "바디코디 (헬스 CRM 1위)", desc: "회원·키오스크·출입통제 통합. 170만+ 사용자", priceRange: "월 구독", priority: "primary", url: "https://bodycodi.com/" },
      { name: "핏투비 (다업종 범용)", desc: "회원·예약·출석·정산·지점 관리", priceRange: "월 구독", priority: "recommended", url: "https://fittobe.oopy.io/" },
    ],
  },
  "yoga-studio": {
    suppliers: [
      { name: "요가몰 (매트·소도구 도매)", desc: "블록·스트랩·볼스터 강사 도매할인", priceRange: "도매가", priority: "primary", url: "https://yogamall.co.kr/" },
      { name: "만두카 (프리미엄 매트)", desc: "원장·강사 선호 프리미엄 매트", priceRange: "프리미엄", priority: "recommended", url: "https://manduka.co.kr/" },
    ],
    equipment: [
      { name: "요가 도구 일괄 (요가몰)", desc: "블록·스트랩·볼스터·해먹", priceRange: "도매가", priority: "primary", url: "https://yogamall.co.kr/" },
    ],
    pos: [
      { name: "하이파이브 / 바디코디", desc: "부티크 스튜디오 예약·회원관리", priceRange: "무료+유료", priority: "primary", url: "https://www.hifive.center/" },
    ],
  },
  "crossfit-box": {
    suppliers: [
      { name: "와드프렌즈코리아", desc: "그립·의류·바닥재 등 크로스핏 전문", priceRange: "도매가", priority: "primary", url: "https://wodfriendskorea.com/" },
    ],
    equipment: [
      { name: "와드프렌즈코리아 (박스 셋업)", desc: "바벨·케틀벨·리그·링·박스점프 일괄", priceRange: "견적", priority: "primary", url: "https://wodfriendskorea.com/equipment" },
      { name: "베스트유어즈 (Rogue 정품)", desc: "Rogue 리프팅벨트·짐네스틱 국내 판매", priceRange: "수입 정품", priority: "recommended", url: "https://bestyours.co.kr/" },
    ],
    pos: [
      { name: "하이파이브 (WOD·예약)", desc: "크로스핏 협회 최다. 클래스 예약·공석알림", priceRange: "무료+유료", priority: "primary", url: "https://www.hifive.center/" },
    ],
  },
  "golf-studio": {
    suppliers: [
      { name: "골프씨이오 (점주 도매)", desc: "스크린골프 점주 전용 도매 (공·장갑·소모품)", priceRange: "점주가", priority: "primary", url: "http://m.golfceo.co.kr/" },
      { name: "골프존마켓 (용품)", desc: "골프존커머스. 정품 용품 일괄", priceRange: "정품가", priority: "recommended", url: "https://golfzonmarket.com/" },
    ],
    equipment: [
      { name: "골프존 / 카카오VX (스크린 시스템)", desc: "구질분석 1·2위. 5룸 시스템+인테리어 약 5억", priceRange: "시스템 2.6억~", priority: "primary", url: "https://www.golfzon.com/" },
      { name: "SG골프 (가성비 시스템)", desc: "36개월 최대 80% 할부. 평당 120-130만", priceRange: "할부 가능", priority: "recommended", url: "http://www.sg-golf.kr/" },
    ],
    pos: [
      { name: "핏투비 (골프 회원·정산)", desc: "스크린골프 회원·예약·정산 관리", priceRange: "월 구독", priority: "recommended", url: "https://fittobe.oopy.io/" },
    ],
  },
  "unmanned-fitness": {
    suppliers: [
      { name: "머슬팩토리 (보충제 자판 도매)", desc: "무인 자판기·진열 보충용 보충제 도매", priceRange: "도매가", priority: "recommended", url: "https://www.musclefactory.co.kr/" },
    ],
    equipment: [
      { name: "헬스119 / KO Health (머신 셋업)", desc: "중고+신품 무인점 일괄 셋업", priceRange: "견적", priority: "primary", url: "https://health119.kr/" },
    ],
    pos: [
      { name: "트랩핏 (무인 헬스 전용)", desc: "회원+출입통제+예약+자동결제 올인원", priceRange: "월 구독", priority: "primary", url: "https://trepfit.co.kr/" },
      { name: "바디코디 (무인 운영 검증)", desc: "CRM+키오스크+출입통제 통합", priceRange: "월 구독", priority: "recommended", url: "https://bodycodi.com/" },
    ],
  },

  // ─── EDUCATION (6) — 2026-06 웹 검증 ───────────────────────
  "study-room": {
    suppliers: [
      { name: "쿠팡 비즈니스 (운영 소모품)", desc: "생수·간식·청소용품 정기배송 + 세금계산서", priceRange: "품목별", priority: "recommended", url: "https://biz.coupang.com" },
    ],
    equipment: [
      { name: "아하 (전자칠판·전자교탁)", desc: "회의실 55-86인치 디스플레이 200만대~", priceRange: "200만~", priority: "recommended", url: "https://i-aha.com/" },
      { name: "룸앤오피스 (B2B 가구)", desc: "회의 테이블·의자·캐비닛 위탁배송", priceRange: "품목별", priority: "recommended", url: "https://www.roomnoffice.com" },
    ],
    pos: [
      { name: "스페이스클라우드 (공간대여 1위)", desc: "예약·결제·정산. 수수료 10% (호스트)", priceRange: "수수료 10%", priority: "primary", url: "https://www.spacecloud.kr/" },
      { name: "제로아이즈·코보시스 (무인출입)", desc: "QR/지문 출입+결제 키오스크 무인운영", priceRange: "도입비", priority: "recommended", url: "https://www.zero-eyes.com/study-cafe" },
    ],
  },
  "kids-academy": {
    suppliers: [
      { name: "비상교육·천재교육 (교재 직판)", desc: "초·중 검인정 교재·문제집 학원 공급", priceRange: "교재별", priority: "primary", url: "https://book.visang.com/main" },
      { name: "화방넷 (예체능 교구)", desc: "아동미술 재료·교구 도매", priceRange: "품목별", priority: "recommended", url: "https://hwabang.net/" },
    ],
    equipment: [
      { name: "아하 (전자칠판)·룸앤오피스 (가구)", desc: "교실 전자칠판 + 아동 책걸상·사물함", priceRange: "견적", priority: "recommended", url: "https://i-aha.com/" },
    ],
    pos: [
      { name: "클래스업 (무료 학원관리)", desc: "출결·수납·키오스크 올인원. 알림톡", priceRange: "기본 무료", priority: "primary", url: "https://www.classup.io/" },
      { name: "학원조아 (수납·미납 관리)", desc: "출결·수납·상담·간편결제 통합", priceRange: "월 구독", priority: "recommended", url: "https://hakwonjoa.com/" },
    ],
  },
  "adult-class": {
    suppliers: [
      { name: "화방넷·크래프트피아 (원데이 재료)", desc: "미술·공예·캔들·가죽 등 키트 재료 도매", priceRange: "품목별", priority: "primary", url: "https://hwabang.net/" },
    ],
    equipment: [
      { name: "룸앤오피스 (작업 가구)", desc: "작업 테이블·스툴·수납 도매", priceRange: "품목별", priority: "recommended", url: "https://www.roomnoffice.com" },
    ],
    pos: [
      { name: "솜씨당 (원데이 집객 1위)", desc: "원데이클래스 집객·예약·결제 대표 플랫폼", priceRange: "수수료", priority: "primary", url: "https://www.sssd.co.kr" },
      { name: "프립 (취미·여가)", desc: "취미·액티비티 예약. 성인 클래스 집객", priceRange: "수수료", priority: "recommended", url: "https://www.frip.co.kr" },
    ],
  },
  "language-academy": {
    suppliers: [
      { name: "YBM (어학 교재 1위)", desc: "영어·중국어 교재·회화. 화상·전화영어 콘텐츠", priceRange: "교재별", priority: "primary", url: "https://www.ybm.co.kr/" },
      { name: "능률교육·다락원 (코스북)", desc: "초중고 영어·원서 ESL 코스북 공급", priceRange: "교재별", priority: "recommended", url: "https://www.neungyule.com" },
    ],
    equipment: [
      { name: "아하 (어학실 전자칠판)·룸앤오피스", desc: "오디오 연동 디스플레이 + 1:1 부스 가구", priceRange: "견적", priority: "recommended", url: "https://i-aha.com/" },
    ],
    pos: [
      { name: "클래스업·캠스몬 (학원관리)", desc: "출결·수납·알림 + LMS. 어학원 커스터마이즈", priceRange: "무료/구독", priority: "primary", url: "https://www.classup.io/" },
    ],
  },
  "coding-class": {
    suppliers: [
      { name: "에듀이노 (코딩 교구 전문)", desc: "아두이노·보드·키트·로봇 학원 공급", priceRange: "키트별", priority: "primary", url: "https://www.eduino.kr/" },
      { name: "디바이스마트 (교육용 키트)", desc: "아두이노·마이크로비트 대량. 스타터 1-3만", priceRange: "1~3만", priority: "recommended", url: "https://www.devicemart.co.kr/" },
    ],
    equipment: [
      { name: "롯데렌탈·AJ렌탈 (PC·태블릿 리스)", desc: "실습용 PC·태블릿 장기 렌탈. 초기비 절감", priceRange: "월 렌탈", priority: "recommended", url: "https://www.lotterental.com" },
    ],
    pos: [
      { name: "엔트리 (무료 코딩 LMS)", desc: "네이버 커넥트재단 블록코딩 국내 표준. 무료", priceRange: "무료", priority: "primary", url: "https://playentry.org/" },
      { name: "클래스업·학원조아 (학원관리)", desc: "출결·수납·알림 통합 SaaS", priceRange: "무료/구독", priority: "recommended", url: "https://www.classup.io/" },
    ],
  },
  "small-study-room": {
    suppliers: [
      { name: "EBS·천재교육·비상교육 (교재)", desc: "EBS 교재·보습 문제집 직판. 공부방 핵심", priceRange: "교재별", priority: "primary", url: "https://book.ebs.co.kr/" },
    ],
    equipment: [
      { name: "룸앤오피스 (소량 가구)", desc: "책걸상·화이트보드·수납 소량 도매", priceRange: "품목별", priority: "recommended", url: "https://www.roomnoffice.com" },
    ],
    pos: [
      { name: "클래스업 (1인 무료)", desc: "교습소·공부방 출결·수납·알림 무료", priceRange: "기본 무료", priority: "primary", url: "https://www.classup.io/" },
      { name: "자란다 (과외 매칭)", desc: "초등 과외·돌봄 튜터 매칭·집객", priceRange: "수수료", priority: "recommended", url: "https://www.jaranda.kr" },
    ],
  },

  // ─── PET (6) — 2026-06 웹 검증 ─────────────────────────────
  "pet-grooming": {
    suppliers: [
      { name: "펫도매·펫허그 B2B (소모품)", desc: "미용 소모품·약품·타올 사업자 도매", priceRange: "사업자가", priority: "primary", url: "https://petdome.co.kr/" },
      { name: "도쿠몰 (미용 커뮤니티몰)", desc: "미용가위·소모품·약품 전문", priceRange: "회원가", priority: "recommended", url: "https://dokumall.com/" },
    ],
    equipment: [
      { name: "하성아이몰 (미용 테이블·기기)", desc: "애견 미용테이블·미용기 직판 10-40만", priceRange: "10~40만", priority: "primary", url: "https://m.hasungimall.com/" },
      { name: "비요세까이 (미용가위)·벨라펫 (블로어)", desc: "전문 가위 10-50만 / 드라이·블로어 20-70만", priceRange: "10~70만", priority: "recommended", url: "https://biyosekkai.com/" },
    ],
    pos: [
      { name: "공비서 (애견미용 공식 지원)", desc: "예약·고객·매출 CRM. 네이버예약 연동", priceRange: "월 구독", priority: "primary", url: "https://gongbiz.kr/" },
      { name: "티피·반짝 (펫 예약)", desc: "예약·동의서·이용권·알림장 올인원", priceRange: "월 구독", priority: "recommended", url: "https://teepee.co.kr/" },
    ],
  },
  "pet-supplies": {
    suppliers: [
      { name: "더펫마트·펫비투비 (용품 도매)", desc: "사료·간식·용품 B2B 도매. 펫샵 납품", priceRange: "사업자가", priority: "primary", url: "https://thepetmart.co.kr/" },
      { name: "펫도매 (위탁·사입)", desc: "위탁배송 무재고 소매 가능", priceRange: "사업자가", priority: "recommended", url: "https://petdome.co.kr/" },
    ],
    equipment: [
      { name: "수진펫·포에버마이펫 (진열 용품)", desc: "진열·구색용 용품 대량 공급", priceRange: "도매가", priority: "recommended", url: "https://www.sujinpet.co.kr/" },
    ],
    pos: [
      { name: "마이포스 (애견샵 POS)", desc: "예약·고객관리·결제·통계", priceRange: "월 구독", priority: "primary", url: "http://my-pos.co.kr/" },
    ],
  },
  "pet-hotel": {
    suppliers: [
      { name: "펫허그 B2B·더펫마트 (소모품)", desc: "배변패드·식기·사료 사업자 도매", priceRange: "사업자가", priority: "primary", url: "https://pethugb2b.co.kr/" },
    ],
    equipment: [
      { name: "애니멀코드 (켄넬·케이지 제작)", desc: "맞춤 켄넬·견사 (대형견 포함) 제작", priceRange: "제작 견적", priority: "primary", url: "https://animalcage.creatorlink.net/" },
      { name: "CIP시스템 (CCTV 라이브)", desc: "호실별 실시간 모니터링 구축", priceRange: "설치 견적", priority: "primary", url: "https://cipsystem.co.kr/solution/cctv" },
    ],
    pos: [
      { name: "공비서 (애견호텔 공식 지원)", desc: "예약·입퇴실·고객관리 CRM", priceRange: "월 구독", priority: "primary", url: "https://gongbiz.kr/" },
      { name: "똑독 (유치원·호텔 관리)", desc: "예약·알림장·사진앨범 앱", priceRange: "월 구독", priority: "recommended", url: "https://home.knockdog.net/" },
    ],
  },
  "pet-cafe": {
    suppliers: [
      { name: "펫비투비·펫도매 (용품·간식)", desc: "매장 비치 간식·용품·위생용품 도매", priceRange: "사업자가", priority: "recommended", url: "https://petbtob.co.kr/" },
    ],
    equipment: [
      { name: "수진펫 (펜스·식기·놀이용품)", desc: "카페 비치 동물 용품 도매", priceRange: "도매가", priority: "recommended", url: "https://www.sujinpet.co.kr/" },
    ],
    pos: [
      { name: "오케이포스·토스플레이스 (카페 POS)", desc: "음료 결제·매출·재고. 카페 범용 POS", priceRange: "기기+월", priority: "primary", url: "https://tossplace.com/" },
    ],
  },
  "pet-training-school": {
    suppliers: [
      { name: "펫허그 B2B·펫비투비 (훈련 간식)", desc: "훈련 간식·배변패드·위생용품 도매", priceRange: "사업자가", priority: "primary", url: "https://pethugb2b.co.kr/" },
    ],
    equipment: [
      { name: "애구애구 (어질리티 기구)", desc: "허들·터널·시소 등 운동기구 제작", priceRange: "수만~수십만", priority: "primary", url: "https://eguegu.co.kr/" },
      { name: "CIP시스템 (운동장 CCTV)", desc: "운동장·견사 실시간 모니터링", priceRange: "설치 견적", priority: "recommended", url: "https://cipsystem.co.kr/solution/cctv" },
    ],
    pos: [
      { name: "다이얼독·똑독 (유치원 관리)", desc: "AI 알림장·예약·출결·회원관리", priceRange: "월 구독", priority: "primary", url: "https://www.dialodog.com/" },
    ],
  },
  "pet-walking-visit": {
    suppliers: [
      { name: "펫도매·수진펫 (케어용품)", desc: "산책줄·하네스·배변봉투 소량 사입", priceRange: "사업자가", priority: "recommended", url: "https://petdome.co.kr/" },
    ],
    equipment: [
      { name: "바램펫 라일리 (이동형 펫캠)", desc: "방문 케어 시 보호자 공유용 펫캠 10-20만", priceRange: "10~20만", priority: "optional", url: "https://www.varram.co.kr/" },
    ],
    pos: [
      { name: "도그메이트 (펫시터 매칭 1위)", desc: "방문돌봄·산책 매칭·예약·정산", priceRange: "건당 수수료", priority: "primary", url: "https://www.dogmate.co.kr" },
      { name: "펫트너·와요 (예약 슈퍼앱)", desc: "펫시터·방문미용 통합 예약", priceRange: "건당", priority: "recommended", url: "https://www.petner.kr/" },
    ],
  },

  // ─── LIVING-SERVICE (6) — 2026-06 웹 검증 ──────────────────
  "laundry-service": {
    suppliers: [
      { name: "세탁몰·오성크린몰 (용제·세제)", desc: "드라이클리닝 용제·세제·악취제거제 도매", priceRange: "도매가", priority: "primary", url: "https://setacmall.com" },
    ],
    equipment: [
      { name: "LG 상업용 세탁기 (B2B)", desc: "자동 세제공급·원격 코스설정 업소용", priceRange: "견적", priority: "primary", url: "https://www.lge.co.kr/" },
      { name: "런드리마켓 (세탁·건조 설비)", desc: "업소용 세탁기·건조기·다림질 설비", priceRange: "견적", priority: "recommended", url: "https://laundrymarket.co.kr" },
    ],
    pos: [
      { name: "세탁특공대·런드리고 (수거배송)", desc: "비대면 세탁 수거·배송 물량 연계 채널", priceRange: "제휴", priority: "recommended", url: "https://www.getwashswat.com" },
    ],
  },
  "cleaning-service": {
    suppliers: [
      { name: "크린글로벌·하나로종합 (청소용품)", desc: "전문세제·청소도구·건물관리 소모품 도소매", priceRange: "도매가", priority: "primary", url: "https://cleaniglobal.kr" },
    ],
    equipment: [
      { name: "한국카처 (고압·진공·스팀)", desc: "업소용 청소장비. 렌탈로 초기비 절감", priceRange: "구매/렌탈", priority: "primary", url: "https://karcher.co.kr" },
    ],
    pos: [
      { name: "미소 (홈서비스 매칭 1위)", desc: "입주·정기청소 매칭. 평당 1만원~ 견적", priceRange: "수수료", priority: "primary", url: "https://miso.kr" },
      { name: "숨고 (맞춤견적 매칭)", desc: "청소 도우미 실시간 견적 매칭", priceRange: "수수료", priority: "recommended", url: "https://soomgo.com" },
    ],
  },
  "repair-service": {
    suppliers: [
      { name: "슈미즈·슈토프 (신발 부자재)", desc: "비브람·아웃솔·굽 등 수선재료 도매", priceRange: "도매가", priority: "primary", url: "https://shoemiz.com" },
      { name: "슈닥터 (슈케어 용품)", desc: "가죽클리너·방수스프레이·수선재료", priceRange: "도매가", priority: "recommended", url: "https://www.shoedr.co.kr" },
    ],
    equipment: [
      { name: "수선 도구 (슈미즈 재단·접착)", desc: "재단판·접착도구 등 수선 공구", priceRange: "품목별", priority: "recommended", url: "https://shoemiz.com" },
    ],
    pos: [
      { name: "패피스 (명품 수선 견적)", desc: "가방·구두 수선 가격·견적 플랫폼", priceRange: "수수료", priority: "recommended", url: "https://fapis.io" },
    ],
  },
  "self-laundry": {
    suppliers: [
      { name: "세탁몰 (세제·용제 보충)", desc: "무인 빨래방 세제·섬유유연제 보충 도매", priceRange: "도매가", priority: "recommended", url: "https://setacmall.com" },
    ],
    equipment: [
      { name: "워시엔조이 (셀프빨래방 1위)", desc: "900호점+. 원격 매장관리·키오스크 솔루션", priceRange: "창업 ~1.8억", priority: "primary", url: "https://washenjoy.co.kr" },
      { name: "크린토피아 코인워시 (지르바우 장비)", desc: "코인빨래방 1위 1,148개. 지르바우 독점", priceRange: "복합 ~1.2억", priority: "primary", url: "https://www.cleantopia.com/kr/establish/coin.do" },
    ],
    pos: [
      { name: "워시엔조이 매장관리 솔루션", desc: "키오스크 원격관리·매출분석·고객관리", priceRange: "포함", priority: "primary", url: "https://washenjoy.co.kr" },
    ],
  },
  "print-copy": {
    suppliers: [
      { name: "한솔제지·한국제지 (복사용지)", desc: "A4 복사용지 박스(2,500매) 대량공급", priceRange: "박스가", priority: "primary", url: "https://www.hansolpaper.co.kr" },
    ],
    equipment: [
      { name: "신도리코 (디지털 복합기·인쇄기)", desc: "컬러 복합기·대형 디지털 인쇄기. 렌탈/판매", priceRange: "렌탈/구매", priority: "primary", url: "https://www.sindoh.com" },
      { name: "제록스마켓 (복합기 임대)", desc: "컬러복합기 임대 (토너·A/S 포함)", priceRange: "약정 임대", priority: "recommended", url: "https://xeroxmarket.co.kr" },
    ],
    pos: [
      { name: "성원애드피아·레드프린팅 (인쇄 발주)", desc: "명함·전단·책자 온라인 인쇄 발주 (1장~)", priceRange: "발주별", priority: "primary", url: "https://www.swadpia.co.kr" },
    ],
  },
  "device-repair": {
    suppliers: [
      { name: "YJCNC (액정·부품 도매)", desc: "수리업체 대상 액정·부품 도매 + 수입대행", priceRange: "도매가", priority: "primary", url: "https://www.yjcnc.co.kr" },
      { name: "디바이스마트 (부품·공구)", desc: "전자부품·분해공구 종합 (범용 수리)", priceRange: "품목별", priority: "recommended", url: "https://www.devicemart.co.kr" },
    ],
    equipment: [
      { name: "수리 공구 (디바이스마트)", desc: "핫플레이트·현미경·분해도구 소형 공구", priceRange: "품목별", priority: "recommended", url: "https://www.devicemart.co.kr" },
    ],
    pos: [
      { name: "청년폰 (수리 프랜차이즈)", desc: "휴대폰 수리 본사 공급·운영 (가맹 시)", priceRange: "가맹", priority: "optional", url: "https://www.cnphone.co.kr" },
    ],
  },

  // ─── SPACE (6) — 2026-06 웹 검증 ───────────────────────────
  "guesthouse": {
    suppliers: [
      { name: "호텔용품샵·신라어메니티 (어메니티)", desc: "객실 어메니티·일회용 비품 사업자 도매", priceRange: "B2B 도매", priority: "primary", url: "https://shillaamenity.kr/" },
      { name: "침구친구 (침구 도매)", desc: "이불·침구 도매·위탁. 소량 가능", priceRange: "세트 도매가", priority: "recommended", url: "https://xn--2e0ba904wlba.com/" },
    ],
    equipment: [
      { name: "비품넷 (객실 비품)", desc: "객실 소모품·청소용품·일회용 비품 도매", priceRange: "도매가", priority: "recommended", url: "https://www.bipum.net/" },
    ],
    pos: [
      { name: "야놀자·여기어때·에어비앤비 (OTA)", desc: "국내 OTA 1·2위 + 글로벌. 필수 입점", priceRange: "수수료 ~10%", priority: "primary", url: "https://www.yanolja.com/" },
      { name: "온다 (채널매니저+PMS)", desc: "OTA 16개+ 통합 연동 한국형 PMS", priceRange: "월 구독", priority: "recommended", url: "https://www.onda.me/" },
    ],
  },
  "rental-studio": {
    suppliers: [
      { name: "디지탈창신 (배경지·소품)", desc: "사베지 배경지·전동배경·포멕스 5-15만", priceRange: "5~15만", priority: "primary", url: "https://www.cscamera.co.kr/" },
    ],
    equipment: [
      { name: "키렌탈·콩렌탈 (촬영장비 렌탈)", desc: "카메라·렌즈·LED조명·짐벌 일 단위 대여", priceRange: "일 대여", priority: "primary", url: "https://keyrental.co.kr/" },
    ],
    pos: [
      { name: "아워플레이스 (촬영공간 예약)", desc: "촬영 공간 전문 시간제 예약. 채광·장비 필터", priceRange: "수수료 10%", priority: "primary", url: "https://hourplace.co.kr/" },
      { name: "스페이스클라우드 (공간 1위)", desc: "촬영 카테고리 포함 예약 플랫폼", priceRange: "수수료 10%", priority: "recommended", url: "https://www.spacecloud.kr/" },
    ],
  },
  "party-room": {
    suppliers: [
      { name: "조이파티B2B·파티클럽 (파티용품)", desc: "풍선·가랜드·일회용품 도매. 당일출고", priceRange: "도매가", priority: "primary", url: "https://www.joypartyb2b.co.kr/" },
    ],
    equipment: [
      { name: "TJ미디어·금영 (노래반주기)", desc: "올인원 이동식 노래방 기기 30-150만", priceRange: "30~150만", priority: "primary", url: "https://www.tjmedia.com/" },
    ],
    pos: [
      { name: "스페이스클라우드 (파티룸 예약 1위)", desc: "파티룸 예약 점유 1위. 입점 핵심", priceRange: "수수료 10%", priority: "primary", url: "https://www.spacecloud.kr/" },
    ],
  },
  "study-cafe-space": {
    suppliers: [
      { name: "옐로아이템 (운영 소모품)", desc: "음료·티슈·청소용품 사업자 도매", priceRange: "도매가", priority: "optional", url: "https://yelloitem.co.kr/" },
    ],
    equipment: [
      { name: "퍼시스·데스커 (좌석·파티션)", desc: "스터디카페 책상·파티션. 렌탈 가능", priceRange: "구매/렌탈", priority: "primary", url: "https://www.fursys.com/" },
    ],
    pos: [
      { name: "픽코 (스터디카페 무인 1위)", desc: "키오스크·좌석/출입/결제 통합. 3,500매장", priceRange: "설치+월", priority: "primary", url: "https://www.pickko.co.kr/studycafe-kiosk" },
      { name: "지오스크 (무인 공간임대)", desc: "자동문 원격·좌석 점등·회원/매출관리", priceRange: "설치+월", priority: "recommended", url: "https://gosk.co.kr/" },
    ],
  },
  "shared-office": {
    suppliers: [
      { name: "퍼시스 (사무가구)", desc: "데스크·의자·파티션 국내 대표 공급", priceRange: "구매/렌탈", priority: "primary", url: "https://www.fursys.com/" },
    ],
    equipment: [
      { name: "데스커 (모션데스크)·FURPLAB (중고)", desc: "스타트업 선호 가구 + 중고 매입 초기비 절감", priceRange: "20~50만", priority: "primary", url: "https://desker.co.kr/" },
    ],
    pos: [
      { name: "스파크플러스 SP워크스페이스", desc: "QR 출입·미팅룸 예약·근태 (자사 운영 검증)", priceRange: "멤버십", priority: "primary", url: "https://www.sparkplus.co/" },
      { name: "스페이스클라우드 (단기 회의실)", desc: "단기·시간제 회의실 외부 예약 채널", priceRange: "수수료 10%", priority: "recommended", url: "https://www.spacecloud.kr/" },
    ],
  },
  "practice-room": {
    suppliers: [
      { name: "뮬 (Mule) 중고악기 마켓", desc: "합주실 앰프·드럼·신디 중고 사입", priceRange: "중고 시세", priority: "primary", url: "https://mule.co.kr/" },
    ],
    equipment: [
      { name: "뮬 (음향장비)·방음 시공", desc: "앰프·드럼·믹서 + 방음부스 시공 평당 100만~", priceRange: "장비별/평당", priority: "primary", url: "https://mule.co.kr/" },
    ],
    pos: [
      { name: "스페이스클라우드 (연습실 예약 1위)", desc: "연습실·합주실 예약 점유 1위", priceRange: "수수료 10%", priority: "primary", url: "https://www.spacecloud.kr/" },
      { name: "방음방 (음악인 전용)", desc: "연습실/합주실 전용 검색·예약", priceRange: "건별", priority: "recommended", url: "https://bub.searchroom.kr/" },
    ],
  },

  // ─── ONLINE-DIGITAL (6) — 2026-06 웹 검증 ──────────────────
  "smart-store": {
    suppliers: [
      { name: "도매매 (위탁 1위)·온채널", desc: "위탁판매 최다 사용. 무재고 등록·판매", priceRange: "위탁가", priority: "primary", url: "https://domeme.domeggook.com/" },
      { name: "도매꾹 (사입 도매)", desc: "사입형 도매. MOQ 5-10개, 단가 흥정", priceRange: "MOQ 도매가", priority: "recommended", url: "https://domeggook.com/" },
    ],
    equipment: [
      { name: "박스공장닷컴·라로박스 (포장재)", desc: "택배박스·완충재·라벨 도매·제작", priceRange: "도매가", priority: "primary", url: "https://www.boxmake.co.kr/" },
    ],
    pos: [
      { name: "네이버 스마트스토어 (입점 무료)", desc: "초기 셀러 1순위 채널. 결제수수료 3.8-4.5%", priceRange: "수수료 3.8~4.5%", priority: "primary", url: "https://sell.smartstore.naver.com/" },
      { name: "사방넷·플레이오토 (멀티채널 OMS)", desc: "주문·재고·송장 통합관리", priceRange: "월 구독", priority: "recommended", url: "https://sabangnet.co.kr/" },
    ],
  },
  "digital-products": {
    suppliers: [
      { name: "Canva·노션 (제작 소스)", desc: "전자책·템플릿·디자인 디지털 상품 제작 도구", priceRange: "무료~구독", priority: "recommended", url: "https://www.canva.com/" },
    ],
    equipment: [],
    pos: [
      { name: "크몽 (디지털 마켓)", desc: "전자책·템플릿·서비스 마켓. 수수료 ~15%", priceRange: "수수료 ~15%", priority: "primary", url: "https://kmong.com/" },
      { name: "페이앱·부트페이 (자체 결제)", desc: "무료 주문서 링크·코딩없는 결제 연동", priceRange: "PG 수수료", priority: "recommended", url: "https://www.payapp.kr/" },
    ],
  },
  "creator-service": {
    suppliers: [],
    equipment: [
      { name: "키렌탈·콩렌탈 (촬영장비 렌탈)", desc: "카메라·마이크·LED조명·짐벌 (구매 전 테스트)", priceRange: "일 대여", priority: "primary", url: "https://keyrental.co.kr/" },
    ],
    pos: [
      { name: "투네이션 (국내 후원 1위)", desc: "크리에이터 후원·도네이션 대표 플랫폼", priceRange: "후원 수수료", priority: "primary", url: "https://toon.at/" },
      { name: "Buy Me a Coffee (해외 팬)", desc: "해외 후원·멤버십·디지털판매. 수수료 5%", priceRange: "수수료 5%", priority: "recommended", url: "https://buymeacoffee.com/" },
    ],
  },
  "consignment-commerce": {
    suppliers: [
      { name: "도매매·온채널 (위탁 도매)", desc: "재고 없이 등록·판매. 도매처 직배송", priceRange: "위탁가", priority: "primary", url: "https://domeme.domeggook.com/" },
      { name: "셀러나우 (발주 자동화)", desc: "도매사이트 모음·발주 자동화·통합관리", priceRange: "구독", priority: "recommended", url: "https://sellernow.co.kr/" },
    ],
    equipment: [
      { name: "라벨·송장 프린터", desc: "주문 송장·운송장 출력 10-30만", priceRange: "10~30만", priority: "optional", url: "https://www.boxmake.co.kr/" },
    ],
    pos: [
      { name: "사방넷·플레이오토·이지어드민 (OMS)", desc: "위탁 발주 자동화·멀티채널·재고연동", priceRange: "월 구독", priority: "primary", url: "https://www.ezadmin.co.kr/" },
    ],
  },
  "newsletter-membership": {
    suppliers: [],
    equipment: [
      { name: "Canva·노션 (콘텐츠 제작)", desc: "뉴스레터 본문·이미지·아카이브 제작", priceRange: "무료~구독", priority: "optional", url: "https://www.canva.com/" },
    ],
    pos: [
      { name: "스티비 (뉴스레터 1위)", desc: "발송·구독자 관리·유료구독. 무료 500명", priceRange: "PG 3.2%", priority: "primary", url: "https://stibee.com/" },
      { name: "메일리 (멤버십·후원)", desc: "노션형 UI. 유료 멤버십·개별판매·후원", priceRange: "7,900원~", priority: "recommended", url: "https://maily.so/" },
    ],
  },
  "global-buying": {
    suppliers: [
      { name: "1688 (알리바바 도매)", desc: "중국 최대 B2B 도매. 구매대행·사입 소싱", priceRange: "중국 도매가", priority: "primary", url: "https://www.1688.com/" },
      { name: "타오바오 (소량 소싱)", desc: "중국 소매·소량 소싱", priceRange: "소매가", priority: "recommended", url: "https://www.taobao.com/" },
    ],
    equipment: [
      { name: "박스공장닷컴 (검수·재포장)", desc: "검수·재포장·라벨 부착용 포장재", priceRange: "도매가", priority: "optional", url: "https://www.boxmake.co.kr/" },
    ],
    pos: [
      { name: "몰테일·오마이집 (배송대행지)", desc: "미·중·독·일 배대지+풀필먼트. 업계 최대", priceRange: "무게별 배송비", priority: "primary", url: "https://www.malltail.com/" },
      { name: "네이버 스마트스토어 (판매)", desc: "구매대행 상품 판매 오픈마켓", priceRange: "수수료", priority: "recommended", url: "https://sell.smartstore.naver.com/" },
    ],
  },
};

/**
 * sub-industry → 카테고리 매핑 (vendor-setup-data 폴백용)
 */
export const SUB_TO_CATEGORY: Record<string, string> = {
  // food (6)
  "korean-casual": "food", "delivery-meals": "food", "salad-healthy": "food",
  "ramen-noodle": "food", "chicken-burger": "food", "western-pasta-brunch": "food",
  // cafe-dessert (6)
  "takeout-coffee": "cafe-dessert", "specialty-coffee": "cafe-dessert",
  "dessert-cafe": "cafe-dessert", "bakery-studio": "cafe-dessert",
  "icecream-bingsu": "cafe-dessert", "self-serve-cafe": "cafe-dessert",
  // retail (6)
  "convenience-small": "retail", "lifestyle-goods": "retail", "beauty-supplies": "retail",
  "fashion-accessories": "retail", "health-food-store": "retail", "unmanned-retail": "retail",
  // beauty (6)
  "hair-salon": "beauty", "nail-studio": "beauty", "skin-care-room": "beauty",
  "waxing-studio": "beauty", "eyelash-brow": "beauty", "makeup-bridal": "beauty",
  // fitness (6)
  "pilates-studio": "fitness", "pt-gym": "fitness", "yoga-studio": "fitness",
  "crossfit-box": "fitness", "golf-studio": "fitness", "unmanned-fitness": "fitness",
  // education (6)
  "study-room": "education", "kids-academy": "education", "adult-class": "education",
  "language-academy": "education", "coding-class": "education", "small-study-room": "education",
  // pet (6)
  "pet-grooming": "pet", "pet-supplies": "pet", "pet-hotel": "pet",
  "pet-cafe": "pet", "pet-training-school": "pet", "pet-walking-visit": "pet",
  // living-service (6)
  "laundry-service": "living-service", "cleaning-service": "living-service",
  "repair-service": "living-service", "self-laundry": "living-service",
  "print-copy": "living-service", "device-repair": "living-service",
  // space (6)
  "guesthouse": "space", "rental-studio": "space", "party-room": "space",
  "study-cafe-space": "space", "shared-office": "space", "practice-room": "space",
  // online-digital (6)
  "smart-store": "online-digital", "digital-products": "online-digital",
  "creator-service": "online-digital", "consignment-commerce": "online-digital",
  "newsletter-membership": "online-digital", "global-buying": "online-digital",
};

/**
 * SPECIALTY (3차 분기) override — sub-industry 안에서 특정 컨셉만의 추가 공급처·장비.
 *
 * 흐름: specialty override → sub-industry override → 카테고리 베이스 (3-tier 머지).
 *
 * 모든 specialty 가 override 가질 필요는 없음 (희소). 명백히 다른 운영이 필요한 것만 추가.
 */
export const SPECIALTY_VENDOR_DATA: Record<string, Partial<SubIndustryVendorData>> = {
  // ═══════════════════════════════════════════════════════════════
  // 외식 — 한식 캐주얼 (korean-casual)
  // ═══════════════════════════════════════════════════════════════
  "korean-gukbap": {
    suppliers: [
      { name: "마장축산물시장 (사골·곰탕거리)", desc: "국밥 핵심 — 사골·잡뼈·돼지머리·내장 도매. 새벽 직접 매입 최저가", priceRange: "도매가", priority: "primary", url: "http://www.mjmm.co.kr/" },
      { name: "경동시장 (한약재·약선)", desc: "약선 국밥용 한약재 도매. 한방 차별화 시 필수", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "대형 곰솥·솥걸이 (50-100L)", desc: "사골 우려내기 핵심 장비. 50L 90-160만 / 100L 220-380만", priceRange: "90~380만", priority: "primary" },
      { name: "압력 곰솥 (린나이·동양매직)", desc: "사골 우림 시간 1/2 단축. 50L 압력솥 220-450만", priceRange: "220~450만", priority: "recommended" },
      { name: "보온 국솥 (다단)", desc: "메뉴별 국 보관·보온. 4-6구 270-490만", priceRange: "270~490만", priority: "primary" },
    ],
  },
  "korean-hanjeongsik": {
    suppliers: [
      { name: "한국도자기·놋담 (반상기·놋그릇)", desc: "한정식 핵심 — 백자·놋그릇 반상기 세트. 4년 연속 방짜유기 1위", priceRange: "세트 30-150만", priority: "primary", url: "https://notdam.com/" },
      { name: "더다주 (B2B 주방용품 도매)", desc: "식당 창업·레스토랑용 그릇·반상기 도매", priceRange: "도매가", priority: "primary", url: "https://thedaju.com/" },
      { name: "현대기물 (남대문 그릇 도매 30년)", desc: "남대문 그릇 도매 1번지 — 한정식 식기 대량 납품", priceRange: "도매가", priority: "recommended", url: "https://m.dish114.com/" },
      { name: "국내산 한우·한돈 도매 (마장)", desc: "코스 메인용 정육 도매. 한우 등심·갈비살", priceRange: "kg당 6-12만", priority: "primary", url: "http://www.mjmm.co.kr/" },
    ],
    equipment: [
      { name: "한식 코스 워머·찜기", desc: "코스 단계별 보온·찜 — 다단 워머 320-650만", priceRange: "320~650만", priority: "primary" },
      { name: "방짜유기 보온 트레이", desc: "놋그릇 코스용 보온 트레이 + 차림 도구", priceRange: "150~350만", priority: "recommended" },
    ],
  },
  "korean-baekban": {
    suppliers: [
      { name: "푸드팡 (반찬용 채소·김치)", desc: "백반 핵심 — 매일 반찬 식자재 새벽 배송", priceRange: "도매가", priority: "primary", url: "https://foodpang.co/" },
      { name: "종가집·풀무원 (김치·반찬 도매)", desc: "포장김치·기본 반찬 도매. 일정 품질 보증", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "반찬 진열 냉장고 (10~20구)", desc: "백반 핵심 — 반찬 진열·관리. 220-450만", priceRange: "220~450만", priority: "primary" },
      { name: "다구 밥솥 (10~20kg)", desc: "백반 회전율용 대용량 밥솥 2-3대. 1대 80-150만", priceRange: "80~150만/대", priority: "primary" },
    ],
  },
  "korean-bunsik": {
    suppliers: [
      { name: "남대문 떡볶이 떡·어묵 도매", desc: "분식 핵심 — 떡·어묵·만두피 도매. kg당 도매가", priceRange: "도매가", priority: "primary" },
      { name: "김 도매 (광천·완도김)", desc: "김밥용 김 도매. 100매 묶음 도매가", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "떡볶이 화구·전기팬 (1.5m+)", desc: "분식 핵심. 대형 전기팬 110-220만", priceRange: "110~220만", priority: "primary" },
      { name: "튀김기 (소형 2구)", desc: "튀김 메뉴 + 김말이용. 80-150만", priceRange: "80~150만", priority: "primary" },
      { name: "김밥 작업대 + 김 보관함", desc: "김밥 고속 작업용 1.5m 작업대 + 보관 시스템", priceRange: "60~120만", priority: "primary" },
    ],
  },
  "korean-bibimbap": {
    suppliers: [
      { name: "푸드팡 (나물·고추장 도매)", desc: "비빔밥 핵심 — 시금치·콩나물·도라지 등 나물류", priceRange: "도매가", priority: "primary", url: "https://foodpang.co/" },
      { name: "전주 고추장 도매 (순창·해찬들)", desc: "비빔밥 시그니처 양념. 5kg 통도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "돌솥 (1인분 다수)", desc: "돌솥비빔밥 핵심. 1개 1-2만 × 30-50개", priceRange: "30~100만", priority: "primary" },
      { name: "나물 진열 냉장 쇼케이스", desc: "토핑 다구 진열용 냉장. 220-380만", priceRange: "220~380만", priority: "primary" },
    ],
  },
  "korean-pork-belly": {
    suppliers: [
      { name: "한돈자조금 (한돈 인증 정육)", desc: "한국 한돈 공식. 삼겹살·갈비 인증 도매. 100% 국내산 보증", priceRange: "kg당 2.5-4만", priority: "primary", url: "https://www.koreanpork.or.kr/" },
      { name: "마장축산물시장 (구이용 정육)", desc: "삼겹살·갈비·곱창 도매 1번지. 새벽 직매입 최저가", priceRange: "도매가", priority: "primary", url: "http://www.mjmm.co.kr/" },
      { name: "쌈채소·반찬 도매 (가락몰)", desc: "상추·깻잎·쌈장 — 구이집 사이드 핵심", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
    ],
    equipment: [
      { name: "테이블 화로 (가스·숯)", desc: "테이블당 화로 + 매립 인덕션. 1테이블 80-150만", priceRange: "80~150만/테이블", priority: "primary" },
      { name: "강력 후드·덕트 시스템", desc: "구이매장 필수 — 일반 후드의 2-3배 풍량. 320-770만", priceRange: "320~770만", priority: "primary" },
      { name: "쌈채소 보냉 진열대", desc: "쌈·반찬 신선 유지. 150-280만", priceRange: "150~280만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 외식 — 도시락·배달 (delivery-meals)
  // ═══════════════════════════════════════════════════════════════
  "delivery-korean-lunch": {
    suppliers: [
      { name: "푸드팡·CJ프레시웨이 (정기 배송)", desc: "한식 도시락 식자재 정기 납품", priceRange: "도매가", priority: "primary", url: "https://foodpang.co/" },
      { name: "도시락 용기 도매 (한솔·삼광)", desc: "PP 도시락 용기·뚜껑·수저 일체", priceRange: "개당 200-500원", priority: "primary" },
    ],
    equipment: [
      { name: "대용량 밥솥 (20~50kg)", desc: "단체 도시락용 — 회당 100-300인분", priceRange: "150~350만", priority: "primary" },
      { name: "도시락 자동 포장기·실링기", desc: "용기 실링·날짜 인쇄 자동화. 280-650만", priceRange: "280~650만", priority: "recommended" },
    ],
  },
  "delivery-diet-meal": {
    suppliers: [
      { name: "닭가슴살·잡곡 도매 (인생닭가슴살·랭킹닭컴)", desc: "다이어트 도시락 핵심 단백질 + 잡곡", priceRange: "kg당 8천-1.2만", priority: "primary" },
      { name: "유기농 채소 도매 (한살림·초록마을)", desc: "프리미엄 다이어트 채소 정기 납품", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "스팀컨벡션·수비드 머신", desc: "단백질 저온 조리 핵심. 320-650만", priceRange: "320~650만", priority: "primary" },
      { name: "정량 저울·계량 시스템", desc: "칼로리·단백질 표기 정확도용", priceRange: "30~80만", priority: "primary" },
    ],
  },
  "delivery-bulk-catering": {
    suppliers: [
      { name: "CJ프레시웨이·아워홈 (대량 식자재)", desc: "50-200인분 단위 케이터링 식자재", priceRange: "월정액", priority: "primary", url: "https://www.cjfreshway.com/" },
      { name: "케이터링 트레이·일회용기 도매", desc: "버퍼식 진열용 트레이·랩 일체", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "이동식 보온고·핫박스", desc: "케이터링 운반용 — 1회 50인분. 150-280만", priceRange: "150~280만", priority: "primary" },
      { name: "대형 스팀솥 (100L+)", desc: "200인분 국·찌개. 380-750만", priceRange: "380~750만", priority: "primary" },
    ],
  },
  "delivery-premium": {
    suppliers: [
      { name: "마켓컬리·쿠팡 새벽배송 입점", desc: "프리미엄 가정식 정기 배송 채널", priceRange: "수수료 협의", priority: "primary" },
      { name: "프리미엄 식자재 (한우·자연산 수산)", desc: "고급 가정식용 차별화 식자재", priceRange: "프리미엄가", priority: "primary" },
    ],
    equipment: [
      { name: "급속 냉동·진공 포장 라인", desc: "신선도 유지 핵심. 진공 + 급냉 850-1500만", priceRange: "850~1500만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 외식 — 샐러드·헬시 (salad-healthy)
  // ═══════════════════════════════════════════════════════════════
  "salad-bowl": {
    suppliers: [
      { name: "샐러드 채소 도매 (가락몰·로컬푸드)", desc: "양상추·로메인·케일 — 샐러드 핵심 채소 매일 새벽 입고", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
      { name: "닭가슴살·연어 토핑 도매", desc: "프로틴 토핑 정기 공급", priceRange: "kg당 1-2.5만", priority: "primary" },
      { name: "드레싱 도매 (오뚜기·청정원·수입)", desc: "랜치·시저·발사믹 — B2B 패키지", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "샐러드 진열 쇼케이스 (10~20구)", desc: "토핑 진열·신선 유지 핵심. 280-550만", priceRange: "280~550만", priority: "primary" },
      { name: "야채 절단기·세척기", desc: "샐러드 작업 자동화. 150-320만", priceRange: "150~320만", priority: "primary" },
    ],
  },
  "salad-poke-grain": {
    suppliers: [
      { name: "수산 도매 (가락 수산·노량진)", desc: "포케용 연어·참치·새우 — 사시미급 신선도", priceRange: "kg당 3-7만", priority: "primary" },
      { name: "잡곡·곡물 도매 (현미·퀴노아)", desc: "그레인볼 베이스. 25kg 단위 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "사시미 냉장 진열대 (-2℃)", desc: "포케 회 진열 — 정밀 온도 제어. 320-650만", priceRange: "320~650만", priority: "primary" },
    ],
  },
  "salad-vegan": {
    suppliers: [
      { name: "한살림·초록마을 (유기농 비건)", desc: "100% 식물성 + 유기농 인증 — 비건 차별화", priceRange: "도매가", priority: "primary" },
      { name: "두부·템페·식물성 단백질 도매 (풀무원·언리미트)", desc: "비건 단백질 핵심", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "비건 전용 작업대·세척 라인", desc: "동물성 교차 오염 방지 (HACCP)", priceRange: "200~400만", priority: "primary" },
    ],
  },
  "salad-juice-cleanse": {
    suppliers: [
      { name: "친환경 과일·채소 (한살림)", desc: "콜드프레스용 유기농 과일 — 케일·셀러리 박스 단위", priceRange: "박스 단위", priority: "primary" },
      { name: "콜드프레스 병 도매 (350ml 유리)", desc: "프리미엄 유리병 + 라벨", priceRange: "병당 0.5-1.2천", priority: "primary" },
    ],
    equipment: [
      { name: "콜드프레스 주서기 (Goodnature·Angel)", desc: "상업용 콜드프레스 — 시간당 30-50병. 850-1800만", priceRange: "850~1800만", priority: "primary" },
      { name: "HPP (초고압 살균) 외주 또는 자체", desc: "유통기한 연장 — 초기 외주 권장", priceRange: "외주 병당 0.3-0.5천", priority: "recommended" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 외식 — 라멘·면 (ramen-noodle)
  // ═══════════════════════════════════════════════════════════════
  "ramen-japanese": {
    suppliers: [
      { name: "일본식 면 도매 (산수면·삼립)", desc: "라멘 전용 생면·중화면 도매", priceRange: "도매가", priority: "primary" },
      { name: "돈코츠 육수용 돼지뼈 (마장)", desc: "돈코츠 핵심 — 돼지머리·잡뼈·발골", priceRange: "도매가", priority: "primary", url: "http://www.mjmm.co.kr/" },
      { name: "차슈·멘마·계란 토핑 도매", desc: "라멘 토핑 일체 정기 공급", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "라멘 면 삶기 전용 솥 (4-6구)", desc: "회전율 핵심 — 30초 단위 면 삶기. 150-320만", priceRange: "150~320만", priority: "primary" },
      { name: "돈코츠 우림 압력솥 (100L+)", desc: "12-18시간 우림용 대형 압력솥. 380-850만", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "noodle-kalguksu": {
    suppliers: [
      { name: "면사랑·풍년면업 (수제면 도매)", desc: "칼국수·잔치국수 면 정기 납품", priceRange: "도매가", priority: "primary" },
      { name: "닭·해물 육수재료 (가락 수산)", desc: "닭한마리·바지락 칼국수용", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "수제면 반죽기·제면기", desc: "수제 면 자체 제조 시. 220-450만", priceRange: "220~450만", priority: "primary" },
      { name: "면 삶기 전용 솥 (4구 이상)", desc: "회전 빠른 면 삶기. 110-220만", priceRange: "110~220만", priority: "primary" },
    ],
  },
  "noodle-udon": {
    suppliers: [
      { name: "일본식 우동면 도매 (사누키·산수면)", desc: "쫄깃한 일본식 우동·소바 면", priceRange: "도매가", priority: "primary" },
      { name: "가츠오부시·다시마 도매", desc: "일본식 우동 다시 핵심", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "면 삶기 전용 솥 (4-6구)", desc: "우동 회전율용 다구 솥. 150-300만", priceRange: "150~300만", priority: "primary" },
    ],
  },
  "noodle-pho": {
    suppliers: [
      { name: "아시아마트 (베트남 식자재 도매)", desc: "쌀국수·라이스페이퍼·베트남 향신료 전문", priceRange: "도매가", priority: "primary", url: "https://asia-mart.co.kr/" },
      { name: "쇠고기 양지·사태 도매 (마장)", desc: "쌀국수 육수용 양지 도매", priceRange: "도매가", priority: "primary", url: "http://www.mjmm.co.kr/" },
      { name: "푸드엔 (식자재 직수입)", desc: "베트남·태국 향신료·쌀국수 면", priceRange: "도매가", priority: "recommended", url: "https://www.fooden.com/" },
    ],
    equipment: [
      { name: "쌀국수 육수 보온솥 (다단)", desc: "12시간 우림 + 보온. 280-580만", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "noodle-jjajang": {
    suppliers: [
      { name: "면사랑 (중화면 도매)", desc: "수타식·중화면 정기 공급", priceRange: "도매가", priority: "primary" },
      { name: "춘장·짜장 도매 (사자표·해표)", desc: "짜장면 핵심 양념 — 18kg 통도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "중화 웍 가스레인지 (고화력)", desc: "짜장·짬뽕 핵심 — 화력 50,000kcal+. 280-550만", priceRange: "280~550만", priority: "primary" },
      { name: "면 삶기 전용 솥 (4구)", desc: "중화면 회전율용. 110-220만", priceRange: "110~220만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 외식 — 치킨·버거·피자 (chicken-burger)
  // ═══════════════════════════════════════════════════════════════
  "fb-chicken": {
    suppliers: [
      { name: "하림 (생닭 공급 1위)", desc: "전국 가맹점 정기 납품. 위생 인증·콜드체인. kg당 4,200-4,500원 (2026 기준)", priceRange: "kg당 0.42-0.45만", priority: "primary", url: "https://harimmall.com/" },
      { name: "마니커·체리부로 (생닭 대체)", desc: "하림 외 생닭 공급 — 가격 협상력 ↑", priceRange: "kg당 0.4-0.45만", priority: "recommended" },
      { name: "치킨 양념·튀김가루 도매", desc: "양념·간장·로제 베이스 + 튀김가루 18kg 통", priceRange: "도매가", priority: "primary" },
      { name: "치킨무·콜라 도매 (롯데·코카콜라)", desc: "치킨 사이드 정기 납품", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "치킨 압력 튀김기 (Henny Penny)", desc: "치킨 전문 압력튀김기. 한국 공식 수입 오진양행 1983~. 650-1600만", priceRange: "650~1600만", priority: "primary", url: "https://ichef.co.kr/category/henny-penny/150/" },
      { name: "양념 회전기·코팅 텀블러", desc: "양념 치킨 코팅 자동화. 220-450만", priceRange: "220~450만", priority: "recommended" },
      { name: "배달 박스·포장 도매", desc: "보온 박스·종이 박스 일체 정기 공급", priceRange: "개당 300-800원", priority: "primary" },
    ],
  },
  "fb-pizza": {
    suppliers: [
      { name: "매일유업 (피자용 모짜렐라)", desc: "상하치즈·알라 모짜렐라 슈레드 — 피자 전용 모짜렐라 1순위", priceRange: "kg당 1.2-1.8만", priority: "primary", url: "https://www.maeil.com/" },
      { name: "서울우유·치즈퀸 (모짜렐라 도매)", desc: "치즈 전문 쇼핑몰 — 5kg 단위 도매", priceRange: "kg당 1.3-2만", priority: "primary", url: "https://cheesequeen.co.kr/" },
      { name: "피자 도우 도매 (생지·냉동)", desc: "프리미엄 도우 직거래 또는 자체 발효", priceRange: "장당 0.8-1.5천", priority: "primary" },
      { name: "토핑 도매 (페퍼로니·올리브·올리브유)", desc: "이탈리안 토핑 + 한식 토핑 (불고기·고구마)", priceRange: "도매가", priority: "primary" },
      { name: "피자 박스 도매 (10·12·15인치)", desc: "박스·매트·커터 일체. 박스 100매 단위", priceRange: "박스 200-500원", priority: "primary" },
    ],
    equipment: [
      { name: "피자 오븐 (Marsal·Moretti·국산)", desc: "데크 오븐 가스/전기 — 피자 매장 핵심. 380-1500만 (수입 1500만+)", priceRange: "380~1,500만", priority: "primary" },
      { name: "피자 도우 롤러·반죽기", desc: "도우 자동 펴기 + 반죽기. 280-550만", priceRange: "280~550만", priority: "primary" },
      { name: "냉장 토핑바 (10~16구)", desc: "주문 즉시 토핑 — 피자 작업 핵심. 320-650만", priceRange: "320~650만", priority: "primary" },
    ],
  },
  "fb-burger": {
    suppliers: [
      { name: "수제 패티 도매 (한우·앵거스)", desc: "프리미엄 패티용 정육 도매. 패티 150g 기준", priceRange: "kg당 3-5만", priority: "primary" },
      { name: "수제 번 (베이커리 직거래)", desc: "브리오슈·프레첼 번 베이커리 일일 납품", priceRange: "개당 1-2천", priority: "primary" },
      { name: "체다·아메리칸 치즈 도매", desc: "버거용 슬라이스 치즈 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "그리들·패티 그릴 (스테인리스)", desc: "패티 굽기 핵심. 1.2m 그리들 320-650만", priceRange: "320~650만", priority: "primary" },
      { name: "샐러맨더·치즈 멜트 그릴", desc: "치즈 녹임 + 번 토스트. 150-280만", priceRange: "150~280만", priority: "primary" },
    ],
  },
  "fb-hotdog": {
    suppliers: [
      { name: "핫도그 도우·소시지 도매", desc: "핫도그 전용 도우 + 소시지 정기 공급", priceRange: "도매가", priority: "primary" },
      { name: "케찹·머스타드 대용량 도매", desc: "5kg 단위 통도매 — 매장 사용 효율", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "튀김기 (소형~중형 2-4구)", desc: "핫도그 튀김 핵심. 150-320만", priceRange: "150~320만", priority: "primary" },
      { name: "도우 진열 쇼케이스", desc: "당일 도우 보관·진열. 150-280만", priceRange: "150~280만", priority: "recommended" },
    ],
  },
  "fb-fried-chicken-bites": {
    suppliers: [
      { name: "하림·체리부로 (닭다리살 도매)", desc: "닭강정용 다리살 — 작은 단위", priceRange: "kg당 0.6-0.9만", priority: "primary", url: "https://harimmall.com/" },
      { name: "양념 도매 (간장·매콤·허니버터)", desc: "닭강정 시그니처 양념", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "튀김기 (4구 이상·소형)", desc: "포장 회전율용 다구 튀김기. 280-550만", priceRange: "280~550만", priority: "primary" },
      { name: "양념 코팅 텀블러", desc: "닭강정 양념 자동화. 150-280만", priceRange: "150~280만", priority: "recommended" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 외식 — 양식·브런치 (western-pasta-brunch)
  // ═══════════════════════════════════════════════════════════════
  "fb-pasta": {
    suppliers: [
      { name: "이탈리안 식자재 도매 (몽뜨레·인터마켓)", desc: "파스타·올리브유·치즈·산마리노 토마토", priceRange: "도매가", priority: "primary" },
      { name: "라파엘라·바릴라 (파스타 면 도매)", desc: "이탈리아 정통 건면 도매. 5kg 단위", priceRange: "kg당 0.5-1.2만", priority: "primary" },
      { name: "마장 정육 (라구·스테이크용)", desc: "이탈리안 정통 라구 + 메인", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "파스타 솥 (4-6구·연속)", desc: "파스타 회전율 핵심. 220-450만", priceRange: "220~450만", priority: "primary" },
      { name: "이탈리안 가스 그리들·살라만더", desc: "스테이크·생선 그릴. 220-380만", priceRange: "220~380만", priority: "primary" },
    ],
  },
  "fb-steak": {
    suppliers: [
      { name: "한우·미국산 프라임 (마장·수입)", desc: "스테이크 컷 — 등심·안심·꽃등심", priceRange: "kg당 6-15만", priority: "primary", url: "http://www.mjmm.co.kr/" },
      { name: "와인 도매 (나라셀라·신세계L&B)", desc: "스테이크 페어링 와인 정기 입고", priceRange: "병당 협의", priority: "primary" },
    ],
    equipment: [
      { name: "차콜 그릴·스테이크 브로일러", desc: "프리미엄 스테이크 — 750℃ 고온. 850-1800만", priceRange: "850~1,800만", priority: "primary" },
      { name: "수비드·드라이에이징 챔버", desc: "프리미엄 차별화 — 숙성·정밀 조리. 380-1200만", priceRange: "380~1,200만", priority: "recommended" },
      { name: "와인 셀러 (200병+)", desc: "와인 전용 보관. 280-650만", priceRange: "280~650만", priority: "primary" },
    ],
  },
  "fb-brunch": {
    suppliers: [
      { name: "유정란·아보카도 도매 (가락몰)", desc: "브런치 핵심 — 에그·아보카도 매일 입고", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
      { name: "수제 베이커리 직거래", desc: "사워도우·브리오슈 — 매일 신선 납품", priceRange: "개당 1-3천", priority: "primary" },
    ],
    equipment: [
      { name: "에그쿠커·푸셔 (파스타 솥 변형)", desc: "에그베네딕트 수란 자동. 150-280만", priceRange: "150~280만", priority: "primary" },
      { name: "와플기·팬케이크 그리들", desc: "브런치 시그니처. 150-320만", priceRange: "150~320만", priority: "primary" },
    ],
  },
  "fb-mexican": {
    suppliers: [
      { name: "토르티야·콘 도매 (수입)", desc: "멕시칸 핵심 — 밀·콘 토르티야", priceRange: "도매가", priority: "primary" },
      { name: "할라피뇨·살사 소스 도매", desc: "멕시칸 시그니처 양념", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "토르티야 그리들·플랜차", desc: "멕시칸 핵심 — 토르티야 굽기. 220-450만", priceRange: "220~450만", priority: "primary" },
    ],
  },
  "fb-izakaya": {
    suppliers: [
      { name: "사케도·키햐 (사케·일본주 도매)", desc: "이자카야 핵심 — 일본 사케·하이볼 베이스", priceRange: "병당 협의", priority: "primary", url: "https://sakedoo.com/" },
      { name: "수산 도매 (가락 수산·노량진)", desc: "사시미·꼬치용 수산물", priceRange: "도매가", priority: "primary" },
      { name: "야키토리 닭꼬치 (하림·꼬치집)", desc: "이자카야 핵심 안주 — 닭꼬치", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "야키토리 그릴·로바타", desc: "꼬치구이 핵심 — 숯불 그릴. 280-650만", priceRange: "280~650만", priority: "primary" },
      { name: "사케 워머·하이볼 디스펜서", desc: "사케 데움 + 하이볼 자동화. 150-280만", priceRange: "150~280만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 카페·디저트 (takeout-coffee, specialty-coffee, dessert, bakery, ice, self-serve)
  // ═══════════════════════════════════════════════════════════════
  "coffee-low-price": {
    suppliers: [
      { name: "메가커피·컴포즈급 원두 도매", desc: "kg당 8,000-15,000원. 가격 경쟁력 1순위", priceRange: "kg당 0.8-1.5만", priority: "primary" },
    ],
    equipment: [
      { name: "전자동 머신 (eversys·Schaerer)", desc: "버튼 한 번 추출. 인건비 절감 핵심. 1100-2700만", priceRange: "1,100~2,700만", priority: "primary" },
    ],
  },
  "coffee-franchise": {
    suppliers: [
      { name: "본사 지정 원두 (스타벅스·이디야)", desc: "프랜차이즈 본사 직배 — 가맹 의무", priceRange: "본사가", priority: "primary" },
    ],
    equipment: [
      { name: "본사 지정 머신 (가맹 표준)", desc: "프랜차이즈 표준 장비 — 가맹비에 포함", priceRange: "가맹비 포함", priority: "primary" },
    ],
  },
  "coffee-local-mid": {
    suppliers: [
      { name: "테라로사·커피리브레 (스페셜티 원두)", desc: "동네 카페 시그니처 — 차별화 핵심", priceRange: "kg당 2.5-4.5만", priority: "primary", url: "https://www.terarosa.com/" },
    ],
    equipment: [
      { name: "에스프레소 머신 (페마·VBM)", desc: "중급 머신 — 250-700만", priceRange: "250~700만", priority: "primary" },
    ],
  },
  "coffee-roastery": {
    equipment: [
      { name: "로스터기 (Probat·Loring·Diedrich)", desc: "5kg 클래스 로스터기 1600-3700만 / 12kg 4200-7500만", priceRange: "1,600~7,500만", priority: "primary" },
      { name: "냉각·정선·보관 설비", desc: "원두 후처리 + 보관. 320-850만", priceRange: "320~850만", priority: "primary" },
    ],
  },
  "coffee-handdrip": {
    suppliers: [
      { name: "커피리브레·테라로사 (싱글 오리진)", desc: "다이렉트 트레이드 산지 원두 — 핸드드립 핵심", priceRange: "kg당 3-6만", priority: "primary", url: "https://coffeelibre.kr/" },
    ],
    equipment: [
      { name: "드립 바·드리퍼 풀세트 (하리오·칼리타)", desc: "드립 바 + 드리퍼·서버·필터", priceRange: "150~320만", priority: "primary" },
      { name: "정밀 드립 그라인더 (EK43·Comandante)", desc: "드립용 정밀 그라인더. 380-580만", priceRange: "380~580만", priority: "primary" },
    ],
  },
  "coffee-coldbrew": {
    suppliers: [
      { name: "원두 (블렌드·다크 로스트)", desc: "콜드브루 베이스 원두 — 다크 로스트", priceRange: "kg당 2-3.5만", priority: "primary" },
      { name: "콜드브루 병 도매 (250·500ml)", desc: "유리병 + 라벨 + 캡", priceRange: "병당 0.4-1천", priority: "primary" },
    ],
    equipment: [
      { name: "콜드브루 추출 탱크 (50L+)", desc: "콜드브루 핵심 — 12-18시간 침출. 280-650만", priceRange: "280~650만", priority: "primary" },
      { name: "병입·실링 라인", desc: "온라인몰 출하용 자동 병입. 380-850만", priceRange: "380~850만", priority: "recommended" },
    ],
  },
  "dessert-cake-shop": {
    suppliers: [
      { name: "베이커리 식자재 (한국제분·CJ)", desc: "박력분·생크림·계란 — 케이크 핵심", priceRange: "도매가", priority: "primary" },
      { name: "생크림·버터 도매 (서울우유·매일)", desc: "케이크 시그니처 — 프리미엄 유제품", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "데크 오븐·컨벡션 (Unox·Bongard)", desc: "케이크 굽기 핵심. 380-1500만", priceRange: "380~1,500만", priority: "primary" },
      { name: "스탠드 믹서 (Hobart·Spar)", desc: "생크림·반죽 — 30-60L. 280-650만", priceRange: "280~650만", priority: "primary" },
      { name: "케이크 진열 쇼케이스 (3-5단)", desc: "디저트 진열 핵심. 380-850만", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "dessert-macaron": {
    suppliers: [
      { name: "아몬드가루·식용 색소 도매", desc: "마카롱 핵심 — 프리미엄 아몬드가루", priceRange: "kg당 3-6만", priority: "primary" },
    ],
    equipment: [
      { name: "데크 오븐 (Bongard·Rotor)", desc: "마카롱 정밀 굽기 — 온도 제어 핵심. 580-1500만", priceRange: "580~1,500만", priority: "primary" },
      { name: "스탠드 믹서·머랭 메이커", desc: "머랭 자동화 — 30L 핀란드/독일", priceRange: "320~650만", priority: "primary" },
    ],
  },
  "dessert-tart": {
    suppliers: [
      { name: "과일 도매 (가락몰)", desc: "타르트 시즌 과일 — 딸기·블루베리·무화과", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
      { name: "버터·치즈 도매 (앵커·필라델피아)", desc: "치즈타르트 핵심 — 크림치즈", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "데크 오븐·컨벡션 (Unox)", desc: "타르트 굽기. 380-1200만", priceRange: "380~1,200만", priority: "primary" },
      { name: "타르트 틀·진열 쇼케이스", desc: "타르트 틀 다수 + 4단 쇼케이스", priceRange: "320~650만", priority: "primary" },
    ],
  },
  "dessert-traditional": {
    suppliers: [
      { name: "한과 재료 도매 (꿀·약과 베이스)", desc: "한과·약과 — 흑임자·꿀·계피", priceRange: "도매가", priority: "primary" },
      { name: "전통 디저트 식자재 (인절미·약과)", desc: "찹쌀·콩가루·조청 — 전통 디저트 핵심", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "한과 튀김기·약과 성형기", desc: "약과·유과 자동 성형 + 튀김. 220-450만", priceRange: "220~450만", priority: "primary" },
    ],
  },
  "bakery-bread": {
    suppliers: [
      { name: "한국제분·CJ 제일제당 (강력분)", desc: "식빵·소금빵 핵심 — 25kg 단위", priceRange: "kg당 0.15-0.25만", priority: "primary" },
      { name: "버터·이스트 도매 (앵커·산미겔)", desc: "식빵·바게트 핵심 부재료", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "데크 오븐 (Bongard·Tagliavini)", desc: "식빵·바게트 핵심 — 가스/전기. 850-2500만", priceRange: "850~2,500만", priority: "primary" },
      { name: "발효기·도우컨디셔너", desc: "1차·2차 발효 자동. 380-850만", priceRange: "380~850만", priority: "primary" },
      { name: "분할기·성형기 (식빵 자동)", desc: "식빵 분할·성형 자동화. 580-1200만", priceRange: "580~1,200만", priority: "recommended" },
    ],
  },
  "bakery-pastry": {
    suppliers: [
      { name: "프리미엄 버터 (앵커·이즈니)", desc: "크루아상·페이스트리 핵심 — 발효 버터", priceRange: "kg당 1.5-2.5만", priority: "primary" },
    ],
    equipment: [
      { name: "리트리버·시터 (Rondo·Rollmatic)", desc: "페이스트리 반죽 펴기 — 핵심. 850-1800만", priceRange: "850~1,800만", priority: "primary" },
      { name: "데크 오븐 + 회전 컨벡션", desc: "페이스트리 굽기. 580-1500만", priceRange: "580~1,500만", priority: "primary" },
    ],
  },
  "bakery-natural-yeast": {
    suppliers: [
      { name: "유기농 통밀가루 (한살림)", desc: "사워도우 핵심 — 유기농·통밀", priceRange: "kg당 0.4-0.8만", priority: "primary" },
    ],
    equipment: [
      { name: "스토니 오븐 (석재 데크 오븐)", desc: "사워도우 굽기 — 석재 바닥. 1200-2500만", priceRange: "1,200~2,500만", priority: "primary" },
      { name: "장시간 발효기 (저온)", desc: "12-48시간 저온 발효. 380-850만", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "ice-bingsu": {
    suppliers: [
      { name: "팥·과일 도매 (가락몰)", desc: "빙수 핵심 — 팥·딸기·망고", priceRange: "도매가", priority: "primary", url: "https://www.garak.co.kr/" },
      { name: "연유·시럽 도매 (서울우유·1883)", desc: "빙수 시그니처 토핑", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "빙수 머신 (눈꽃·전통)", desc: "빙수 핵심 — 눈꽃 빙수기. 220-650만", priceRange: "220~650만", priority: "primary" },
      { name: "냉동 쇼케이스·아이스 보관", desc: "빙수용 얼음·재료 냉동", priceRange: "280~650만", priority: "primary" },
    ],
  },
  "ice-icecream": {
    suppliers: [
      { name: "젤라또 베이스 도매 (수입·국산)", desc: "젤라또 베이스 시럽·과일 퓨레", priceRange: "도매가", priority: "primary" },
      { name: "유제품 도매 (서울우유·매일)", desc: "젤라또 핵심 — 우유·생크림", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "젤라또 머신 (Carpigiani·Bravo)", desc: "수제 젤라또 핵심. 850-2500만", priceRange: "850~2,500만", priority: "primary" },
      { name: "젤라또 진열 쇼케이스", desc: "젤라또 전용 -16℃. 580-1200만", priceRange: "580~1,200만", priority: "primary" },
    ],
  },
  "ice-self-serve": {
    suppliers: [
      { name: "OEM 아이스크림 도매 (롯데·해태)", desc: "무인용 — 이미 포장된 완제품 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "무인 결제 키오스크 + CCTV", desc: "무인 운영 핵심. 380-650만", priceRange: "380~650만", priority: "primary" },
      { name: "냉동 쇼케이스 (대형 4도어)", desc: "포장 아이스크림 진열. 280-580만", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "cafe-unmanned-24": {
    suppliers: [
      { name: "원두·시럽 도매 (대용량)", desc: "무인 카페 — 자동 머신 호환 원두", priceRange: "kg당 1-2만", priority: "primary" },
    ],
    equipment: [
      { name: "전자동 셀프 머신 (eversys·Schaerer)", desc: "무인 핵심 — 버튼 추출 + 우유 자동. 1500-3500만", priceRange: "1,500~3,500만", priority: "primary" },
      { name: "무인 키오스크 + CCTV + 출입 시스템", desc: "24시 무인 인프라. 480-850만", priceRange: "480~850만", priority: "primary" },
    ],
  },
  "cafe-shared-space": {
    suppliers: [
      { name: "원두 도매 (중가)", desc: "스터디 카페 — 음료 무제한용 중가 원두", priceRange: "kg당 1.2-2만", priority: "primary" },
      { name: "스낵·간식 도매", desc: "공부 시간 간식 — 쿠키·과자 다구", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "출입 시스템·시간 결제 키오스크", desc: "스터디 카페 핵심 — 시간 단위 결제. 280-580만", priceRange: "280~580만", priority: "primary" },
      { name: "음료 셀프 머신·냉장 음료 디스펜서", desc: "음료 무제한 인프라", priceRange: "380~850만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 뷰티 (hair, nail, skin, waxing, eyelash, makeup)
  // ═══════════════════════════════════════════════════════════════
  "hair-general": {
    suppliers: [
      { name: "헤어앤미·코제트 (살롱 도매 1위)", desc: "전문가용 펌제·염모제·드라이 케어", priceRange: "전문가가", priority: "primary", url: "https://hairnmi.co.kr/" },
      { name: "케라스타즈·로레알 프로페셔널", desc: "프리미엄 살롱 라인", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "샴푸대·세팅 의자 (3~5세트)", desc: "샴푸대 1대 150-280만 / 세팅 의자 1대 80-150만", priceRange: "1세트 250~400만", priority: "primary" },
      { name: "롤러·핫 컬·미스트 시스템", desc: "펌·드라이 핵심 장비", priceRange: "150~320만", priority: "primary" },
    ],
  },
  "hair-cut-only": {
    equipment: [
      { name: "셀프 샴푸대·간이 세트", desc: "컷 전문 — 미니 샴푸대로 비용 절감. 1대 80-150만", priceRange: "80~150만", priority: "primary" },
      { name: "고속 회전율 의자 (3-5대)", desc: "1만원 컷 회전율 모델", priceRange: "1대 50-100만", priority: "primary" },
    ],
  },
  "hair-color-perm": {
    suppliers: [
      { name: "이탈리아·일본 프리미엄 펌·염모제", desc: "디자이너 1:1 — 고가 펌·하이라이트", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "디지털 펌 머신·스팀러", desc: "디지털 펌·세팅 핵심. 280-580만", priceRange: "280~580만", priority: "primary" },
      { name: "하이라이트 호일·블리치 장비", desc: "하이라이트 전문 도구 풀세트", priceRange: "80~180만", priority: "primary" },
    ],
  },
  "nail-art": {
    suppliers: [
      { name: "OPI 코리아 (사업자 전용 도매)", desc: "국내 네일 점유율 1위 (1996~). 젤·매니큐어·전문가용 풀라인", priceRange: "전문가가", priority: "primary", url: "https://opidome.com/" },
      { name: "헤어앤미 (네일 카테고리)", desc: "젤·아크릴 — 전문가 도매 통합", priceRange: "전문가가", priority: "primary", url: "https://hairnmi.co.kr/" },
      { name: "젤·아크릴·연장 재료 도매 (일본·중국 수입)", desc: "디자인 단가용 — 인스타 트렌드 재료", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "네일 데스크 + LED 램프 (3-5세트)", desc: "네일아트 핵심 — 데스크 1대 80-150만 / LED 램프 5-15만", priceRange: "1세트 100~180만", priority: "primary" },
      { name: "에어브러시·드릴 머신", desc: "디자인 단가 ↑ — 에어브러시 + 핸드드릴", priceRange: "50~120만", priority: "primary" },
    ],
  },
  "nail-quick": {
    equipment: [
      { name: "고속 LED 램프·간이 데스크", desc: "30분 젤 회전율용 — 빠른 큐어링 LED. 5-12만", priceRange: "5~12만/대", priority: "primary" },
    ],
  },
  "nail-pedicure": {
    suppliers: [
      { name: "OPI·CND (페디용 라인)", desc: "페디큐어 전용 큐티클·각질 케어", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "페디 의자·풋스파", desc: "페디큐어 핵심 — 1대 280-580만", priceRange: "280~580만/대", priority: "primary" },
    ],
  },
  "skin-esthetic": {
    suppliers: [
      { name: "프로페셔널 화장품 도매 (Dermalogica·Sothys)", desc: "에스테틱 전문가 라인 — 클렌저·앰풀·마스크", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "스팀기·고주파·갈바닉 기기", desc: "에스테틱 핵심 — 딥클렌징 풀세트", priceRange: "180~450만", priority: "primary" },
      { name: "관리 베드 (전동·수동)", desc: "프리미엄 전동 베드 1대 220-450만", priceRange: "1대 220~450만", priority: "primary" },
    ],
  },
  "skin-massage": {
    suppliers: [
      { name: "마사지 오일 도매 (Weleda·아로마)", desc: "스웨디시·아로마 오일 도매", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "마사지 베드 (높낮이 조절)", desc: "전신 마사지 베드 — 1대 150-320만", priceRange: "1대 150~320만", priority: "primary" },
      { name: "온열 매트·핫스톤 워머", desc: "온열 케어 — 차별화 요소", priceRange: "30~80만", priority: "recommended" },
    ],
  },
  "skin-acne-clinic": {
    suppliers: [
      { name: "여드름 전문 화장품 (메디큐브·이지듀)", desc: "여드름·트러블 케어 라인", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "여드름 압출·LED 라이트 테라피", desc: "트러블 전문 장비 — LED 적·청 라이트", priceRange: "180~380만", priority: "primary" },
    ],
  },
  "waxing-brazilian": {
    suppliers: [
      { name: "왁싱 왁스 도매 (Lycon·Cirepil)", desc: "프리미엄 브라질리언 왁스 — 호주·프랑스 수입", priceRange: "kg당 8-15만", priority: "primary" },
    ],
    equipment: [
      { name: "왁스 워머·스파출라 도구", desc: "왁싱 핵심 — 왁스 워머 50-120만", priceRange: "50~120만", priority: "primary" },
      { name: "프라이빗 룸 베드 + 일회용품", desc: "비키니 라인 프라이버시 핵심", priceRange: "150~280만", priority: "primary" },
    ],
  },
  "waxing-partial": {
    equipment: [
      { name: "왁스 워머 + 베드 (간이)", desc: "다리·팔 30분 단위. 100-220만", priceRange: "100~220만", priority: "primary" },
    ],
  },
  "lash-extension": {
    suppliers: [
      { name: "속눈썹 연장모 도매 (J·C·D컬)", desc: "러시안·1:1 연장모 — 박스 단위", priceRange: "박스 0.8-2만", priority: "primary" },
      { name: "글루·리무버 도매 (전문가)", desc: "속눈썹 글루 — 알레르기 저감 프리미엄", priceRange: "병당 1.5-3만", priority: "primary" },
    ],
    equipment: [
      { name: "확대 LED 램프·전용 베드", desc: "속눈썹 정밀 작업 핵심 — 5-15만 램프 + 베드 150-280만", priceRange: "1세트 200~350만", priority: "primary" },
    ],
  },
  "brow-tattoo": {
    suppliers: [
      { name: "반영구 색소 도매 (Permablend·Tina Davies)", desc: "반영구 메이크업 색소 — 미국·영국 수입", priceRange: "병당 5-15만", priority: "primary" },
    ],
    equipment: [
      { name: "반영구 머신 (Cheyenne·BioTouch)", desc: "디지털 반영구 머신. 380-850만", priceRange: "380~850만", priority: "primary" },
      { name: "위생 라이센스·일회용 니들", desc: "위생 인증 + 일회용 카트리지", priceRange: "월 30-50만 소모", priority: "primary" },
    ],
  },
  "makeup-general": {
    suppliers: [
      { name: "MAC·Nars·Bobbi Brown (전문가 라인)", desc: "메이크업 전문가용 풀라인", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "메이크업 의자 + 라이트 거울", desc: "할리우드 라이트 거울 + 의자. 80-180만", priceRange: "80~180만", priority: "primary" },
    ],
  },
  "makeup-bridal": {
    suppliers: [
      { name: "신부 전용 베이스·립 (디올·샤넬)", desc: "웨딩 메이크업 프리미엄 라인", priceRange: "전문가가", priority: "primary" },
      { name: "헤어피스·티아라 도매", desc: "웨딩 헤어 액세서리", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "에어브러시 메이크업 시스템", desc: "웨딩 — 장시간 지속 에어브러시. 150-320만", priceRange: "150~320만", priority: "primary" },
    ],
  },
  "makeup-self-class": {
    equipment: [
      { name: "1:1 거울 좌석 (5-10석)", desc: "셀프 클래스용 — 라이트 거울 + 의자 5-10세트", priceRange: "1석 50-100만", priority: "primary" },
      { name: "수업용 영상·카메라 시스템", desc: "강사 시연 영상 송출", priceRange: "150~280만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 피트니스 (pilates, pt, yoga, crossfit)
  // ═══════════════════════════════════════════════════════════════
  "pilates-group": {
    equipment: [
      { name: "매트·소도구 (Balanced Body)", desc: "그룹 매트 8-12개 + 폼롤러·링·볼", priceRange: "150~320만", priority: "primary", url: "https://balancedbodyshop.co.kr/" },
      { name: "음향·거울·전신 마감", desc: "그룹 수업 — 음향 시스템 + 전면 거울", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "pilates-private": {
    equipment: [
      { name: "리포머 1대 (Balanced Body Allegro)", desc: "1:1 프라이빗 — 1대 420-850만 (수입). 한국 공식 매장 분당 위치", priceRange: "1대 420~850만", priority: "primary", url: "https://balancedbodyshop.co.kr/" },
      { name: "캐딜락·체어·바렐", desc: "1:1 풀패키지 — 보조 기구. 650-1300만", priceRange: "650~1,300만", priority: "primary" },
    ],
  },
  "pilates-reformer": {
    equipment: [
      { name: "리포머 머신 4-8대 (Balanced Body·Stott)", desc: "리포머 그룹 — 4-8대. 1대 420-850만 (수입), 인투필라테스 국산 200-400만", priceRange: "1대 200~850만", priority: "primary", url: "https://balancedbodyshop.co.kr/" },
      { name: "캐딜락·체어·바렐 (보조 기구)", desc: "풀세트 스튜디오 — 보조 기구 일체", priceRange: "650~1,300만", priority: "recommended" },
      { name: "스탓 한국 공식 (Stott Pilates)", desc: "스탓 정통 라인 — 디자이너 강사 양성", priceRange: "협의", priority: "recommended", url: "http://www.stott.kr/" },
    ],
  },
  "pt-personal": {
    equipment: [
      { name: "1:1 PT 풀세트 (덤벨·바벨·머신)", desc: "트레이너 1-3명 — 기본 머신 + 프리웨이트", priceRange: "850~1,800만", priority: "primary" },
      { name: "체성분 분석기 (InBody)", desc: "InBody 270/370/570. 380-1200만", priceRange: "380~1,200만", priority: "primary" },
    ],
  },
  "pt-gym-pt-hybrid": {
    equipment: [
      { name: "헬스 머신 풀세트 (Life Fitness·Technogym)", desc: "유산소 + 웨이트 머신 — 30-50대. 3000-8000만", priceRange: "3,000~8,000만", priority: "primary" },
      { name: "PT존 + 랙·바벨 풀세트", desc: "PT 전용 존 — 파워랙·올림픽 바벨 다수", priceRange: "850~1,800만", priority: "primary" },
    ],
  },
  "pt-unmanned-24": {
    equipment: [
      { name: "키카드·QR 출입 시스템", desc: "무인 핵심 — 24시 출입 통제. 280-580만", priceRange: "280~580만", priority: "primary" },
      { name: "CCTV 풀세트 (8-16채널)", desc: "무인 보안 — 24시 녹화. 150-380만", priceRange: "150~380만", priority: "primary" },
      { name: "헬스 머신 (중·기본)", desc: "유산소 + 기본 웨이트 — 인건비 ↓ 모델", priceRange: "1,500~4,000만", priority: "primary" },
    ],
  },
  "yoga-general": {
    equipment: [
      { name: "요가 매트·소도구 (Manduka·Liforme)", desc: "그룹 매트 12-20개 + 블록·스트랩", priceRange: "180~380만", priority: "primary" },
      { name: "음향 시스템 + 디퓨저", desc: "요가 — 명상 음향 + 아로마", priceRange: "150~320만", priority: "primary" },
    ],
  },
  "yoga-hot": {
    equipment: [
      { name: "온열·습도 시스템 (40℃·40%)", desc: "핫요가 핵심 — 정밀 온도·습도 제어. 850-1800만", priceRange: "850~1,800만", priority: "primary" },
      { name: "방수 매트·환기 시스템", desc: "고온 환경 전용", priceRange: "320~650만", priority: "primary" },
    ],
  },
  "yoga-meditation": {
    equipment: [
      { name: "명상 좌식 + 빔 프로젝터", desc: "MZ 명상 — 시각·음향 분위기", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "crossfit-box": {
    equipment: [
      { name: "크로스핏 풀세트 (Rogue·Eleiko)", desc: "올림픽 바벨·플레이트·랙·로프·박스 풀세트. 2000-4500만", priceRange: "2,000~4,500만", priority: "primary" },
      { name: "공식 affiliate 라이센스", desc: "CrossFit Inc. affiliate 가입 — 연 3,000달러", priceRange: "연 약 400만", priority: "primary" },
    ],
  },
  "fitness-hiit": {
    equipment: [
      { name: "HIIT 풀세트 (배틀로프·박스·로잉)", desc: "고강도 인터벌 — 다구 운동 도구", priceRange: "850~1,800만", priority: "primary" },
      { name: "타이머·심박수 디스플레이", desc: "그룹 HIIT 핵심 — 인터벌 타이머 + Polar/Myzone", priceRange: "180~380만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 교육 (language, test-prep, coding, study-room)
  // ═══════════════════════════════════════════════════════════════
  "edu-english": {
    suppliers: [
      { name: "교보문고·웅진씽크빅 (영어 교재)", desc: "성인·초중고 영어 교재 정기 납품. 출판사 직거래 30% 할인", priceRange: "도매가", priority: "primary", url: "https://www.kyobobook.co.kr/" },
      { name: "Cambridge·Oxford 원서 도매", desc: "회화·토익·유학 원서 정기 입고", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "원어민 화상 시스템 (Zoom·Meet)", desc: "화상 영어 수업 인프라. 카메라·스피커·마이크 1실 50-150만", priceRange: "1실 50~150만", priority: "recommended" },
      { name: "전자칠판·스마트 보드", desc: "수업 효율 핵심. 280-650만", priceRange: "280~650만", priority: "primary" },
    ],
  },
  "edu-japanese-chinese": {
    suppliers: [
      { name: "JLPT·HSK 교재 (시사일본어·동양북스)", desc: "일본어·중국어 시험 대비 교재", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "전자칠판 + 한자 입력 시스템", desc: "한자 교육 핵심 — 펜 입력 + 발음 음향", priceRange: "280~650만", priority: "primary" },
    ],
  },
  "edu-kids-language": {
    suppliers: [
      { name: "웅진·대교·교원 (어린이 영어)", desc: "초·중등 영어 교재 + 워크북", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "어린이 책상·의자 (12-20세트)", desc: "초등 사이즈 가구. 1세트 15-30만", priceRange: "180~600만", priority: "primary" },
    ],
  },
  "edu-csat": {
    suppliers: [
      { name: "메가·이투스 출판 (수능 교재)", desc: "수능·내신 교재 정기 납품 + 모의고사", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "강의 녹화 시스템·전자칠판", desc: "온라인 강의 녹화 + 오프 강의 동시. 580-1200만", priceRange: "580~1,200만", priority: "primary" },
    ],
  },
  "edu-civil-service": {
    suppliers: [
      { name: "공단기·해커스 (공무원 교재)", desc: "9급·7급·자격증 교재 정기 납품", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "강의실·자습실 책걸상 (30-60석)", desc: "공무원 학원 — 대규모 강의실", priceRange: "1세트 15-30만", priority: "primary" },
    ],
  },
  "edu-art-music": {
    suppliers: [
      { name: "미술·음악 교재·도구 도매", desc: "미술·실기 도구 + 악기 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "이젤·캔버스·악기 (실기 도구)", desc: "예체능 입시 — 실기 풀세트. 학생 1인당 30-80만", priceRange: "1인당 30~80만", priority: "primary" },
    ],
  },
  "edu-coding-kids": {
    equipment: [
      { name: "노트북·태블릿 (1인당 1대)", desc: "iPad / Chromebook 12-20대. 대당 50-100만", priceRange: "1대 50~100만", priority: "primary" },
      { name: "STEM 교구 (LEGO·아두이노·라즈베리파이)", desc: "코딩·로봇 교구 풀패키지", priceRange: "초기 220-550만", priority: "primary" },
    ],
  },
  "edu-coding-adult": {
    equipment: [
      { name: "강의 노트북 (1인당 1대)", desc: "성인 부트캠프 — 고사양 노트북 15-30대. 대당 120-200만", priceRange: "1대 120~200만", priority: "primary" },
      { name: "프로젝터·전자칠판", desc: "강의실 인프라. 380-850만", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "edu-private-tutor": {
    equipment: [
      { name: "1:1 책상·화이트보드", desc: "1:1 과외 — 미니 책상 + 보드. 30-80만", priceRange: "30~80만", priority: "primary" },
    ],
  },
  "edu-small-group": {
    equipment: [
      { name: "소그룹 책상·전자칠판", desc: "3-5명 — 미니 강의실. 150-380만", priceRange: "150~380만", priority: "primary" },
    ],
  },
  "edu-meeting-room": {
    equipment: [
      { name: "회의실 풀세트 (책상·의자·빔)", desc: "스터디룸 — 책상 + 빔프로젝터 + 화이트보드. 280-650만", priceRange: "280~650만", priority: "primary" },
      { name: "예약·결제 시스템 (스페이스클라우드)", desc: "시간 단위 예약·결제 자동화", priceRange: "월 5-15만", priority: "primary" },
    ],
  },
  "edu-study-cafe": {
    equipment: [
      { name: "스터디룸·1인 부스 (10-20석)", desc: "1인 좌석 + 그룹 룸. 1석 80-150만", priceRange: "1석 80~150만", priority: "primary" },
      { name: "음료·간식 셀프 디스펜서", desc: "셀프 음료 무제한 인프라", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "edu-unmanned-study": {
    equipment: [
      { name: "QR 출입·결제 키오스크", desc: "무인 24시 핵심 — 출입·결제. 380-650만", priceRange: "380~650만", priority: "primary" },
      { name: "CCTV 풀세트 + 좌석 부스", desc: "무인 보안 + 1인 좌석 다구", priceRange: "500~1,200만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 펫 (grooming, hotel, training, walking)
  // ═══════════════════════════════════════════════════════════════
  "pet-grooming-general": {
    suppliers: [
      { name: "펫 미용 도매 (이지펫·야옹이몰)", desc: "샴푸·트리트먼트·가위·블레이드 전문가용", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "펫 미용 테이블·드라이어", desc: "전동 테이블 + 산업용 드라이어. 280-650만", priceRange: "280~650만", priority: "primary" },
      { name: "클리퍼·가위 풀세트 (Andis·Wahl)", desc: "전문가 클리퍼 + 가위 다구. 50-180만", priceRange: "50~180만", priority: "primary" },
    ],
  },
  "pet-grooming-spa": {
    suppliers: [
      { name: "프리미엄 스파 제품 (TropiClean·Earthbath)", desc: "아로마·마사지 — 미국·유럽 수입", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "스파 욕조·마사지 테이블", desc: "프리미엄 스파 — 자쿠지 욕조. 580-1200만", priceRange: "580~1,200만", priority: "primary" },
    ],
  },
  "pet-daycare": {
    equipment: [
      { name: "분리 케이지 + 놀이공간 인테리어", desc: "데이케어 — 사이즈별 분리 + 놀이존. 380-850만", priceRange: "380~850만", priority: "primary" },
      { name: "CCTV + 보호자 실시간 영상", desc: "직장인 보호자용 실시간 영상 앱", priceRange: "180~380만", priority: "primary" },
    ],
  },
  "pet-hotel-overnight": {
    equipment: [
      { name: "프라이빗 룸 + 산책 공간", desc: "1박 5-15만 — 프라이빗 룸 + CCTV 인프라", priceRange: "850~1,800만", priority: "primary" },
      { name: "급식·자동 급수 시스템", desc: "야간 자동 급식·급수", priceRange: "180~380만", priority: "primary" },
    ],
  },
  "pet-training-basic": {
    equipment: [
      { name: "훈련 도구 풀세트 (리드·클리커·간식)", desc: "기본 훈련 + 행동 교정 도구", priceRange: "30~80만", priority: "primary" },
      { name: "훈련장 (방음·매트·울타리)", desc: "교정 핵심 공간. 280-650만", priceRange: "280~650만", priority: "primary" },
    ],
  },
  "pet-training-puppy": {
    equipment: [
      { name: "퍼피 사회화 놀이존", desc: "어린 강아지 — 안전 사회화 공간 + 매트", priceRange: "180~380만", priority: "primary" },
    ],
  },
  "pet-walking": {
    equipment: [
      { name: "방문용 차량·이동 케이지", desc: "방문 케어 — 차량 + 휴대용 케이지", priceRange: "차량 별도 + 50-120만", priority: "primary" },
      { name: "GPS·산책 기록 앱 (펫프렌즈·도그메이트)", desc: "보호자 실시간 공유", priceRange: "월 5-10만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 소매 (convenience, lifestyle, beauty, fashion, health, unmanned)
  // ═══════════════════════════════════════════════════════════════
  "retail-cvs": {
    suppliers: [
      { name: "본사 지정 (GS25·CU·세븐일레븐)", desc: "프랜차이즈 본사 직배 — 가맹 의무", priceRange: "본사가", priority: "primary" },
    ],
    equipment: [
      { name: "본사 지정 진열·POS (가맹 표준)", desc: "프랜차이즈 표준 — 가맹비에 포함", priceRange: "가맹비 포함", priority: "primary" },
    ],
  },
  "retail-mini-market": {
    suppliers: [
      { name: "동네 마트 도매 (이마트 트레이더스·코스트코)", desc: "독립 운영 — 회원가 도매", priceRange: "회원가", priority: "primary" },
    ],
    equipment: [
      { name: "진열 선반·냉장고 풀세트", desc: "동네 슈퍼 — 진열 선반 + 음료 냉장고. 580-1200만", priceRange: "580~1,200만", priority: "primary" },
    ],
  },
  "retail-lifestyle-shop": {
    suppliers: [
      { name: "29CM·텐바이텐 (큐레이션 도매)", desc: "라이프스타일 편집샵 — 큐레이션 브랜드 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "디스플레이 인테리어·조명", desc: "비주얼 핵심 — 디스플레이 가구 + 액센트 조명", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "retail-perfume-candle": {
    suppliers: [
      { name: "조향 베이스·왁스 도매", desc: "조향 — 베이스·향료·왁스 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "조향 작업대 + 시향 바", desc: "조향 핵심 — 작업대 + 시향 진열. 280-580만", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "retail-stationery": {
    suppliers: [
      { name: "디자인 문구 도매 (10x10·아르떼)", desc: "Z세대 디자인 문구 큐레이션", priceRange: "도매가", priority: "primary" },
    ],
  },
  "retail-cosmetics": {
    suppliers: [
      { name: "화장품 본사·도매 (아모레·LG생활건강)", desc: "독립 매장 — 본사 직거래 또는 올리브영 입점", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "테스터 진열대 + 거울 라이트", desc: "화장품 핵심 — 테스터 진열 + 라이트 거울", priceRange: "280~650만", priority: "primary" },
    ],
  },
  "retail-haircare": {
    suppliers: [
      { name: "프로 헤어케어 도매 (헤어앤미·미용실 도매)", desc: "살롱 제품 + 미용실 도매 입점", priceRange: "전문가가", priority: "primary", url: "https://hairnmi.co.kr/" },
    ],
  },
  "retail-fashion": {
    suppliers: [
      { name: "동대문 도매상가 (apM·청평화)", desc: "패션 편집샵 — 시즌별 진열", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "행거·피팅룸·전신 거울", desc: "패션 매장 핵심. 380-850만", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "retail-vintage": {
    suppliers: [
      { name: "빈티지·구제 도매 (광장시장·동묘)", desc: "구제·빈티지 도매시장 — Z세대 시장", priceRange: "도매가", priority: "primary" },
    ],
  },
  "retail-accessories": {
    suppliers: [
      { name: "남대문 액세서리 도매상가", desc: "주얼리·액세서리 도매 1번지", priceRange: "도매가", priority: "primary" },
    ],
  },
  "retail-supplements": {
    suppliers: [
      { name: "건강기능식품 도매 (종근당·고려은단)", desc: "프로바이오틱스·콜라겐 — 정식 인증", priceRange: "도매가", priority: "primary" },
    ],
  },
  "retail-organic": {
    suppliers: [
      { name: "한살림·초록마을 (유기농 도매)", desc: "유기농·비건 인증 식품 정기 납품", priceRange: "도매가", priority: "primary" },
    ],
  },
  "retail-unmanned-icecream": {
    suppliers: [
      { name: "OEM 아이스크림 도매 (롯데·해태)", desc: "무인용 — 포장 완제품 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "무인 키오스크 + CCTV 풀세트", desc: "24시 무인 핵심. 480-850만", priceRange: "480~850만", priority: "primary" },
      { name: "냉동 쇼케이스 (대형 4도어)", desc: "포장 아이스크림 진열. 280-580만", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "retail-unmanned-mealkit": {
    suppliers: [
      { name: "마이셰프·프레시지 (밀키트 도매)", desc: "냉장 밀키트 정기 입고", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "냉장 자판기 + 무인 결제", desc: "냉장 자판기 핵심. 850-1500만", priceRange: "850~1,500만", priority: "primary" },
    ],
  },
  "retail-unmanned-stationery": {
    equipment: [
      { name: "무인 키오스크 + CCTV", desc: "학교 근처 24시 — 출입·결제 자동화", priceRange: "380~650만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 생활서비스 (laundry, cleaning, repair, print, device)
  // ═══════════════════════════════════════════════════════════════
  "ls-self-laundry": {
    equipment: [
      { name: "LG 상업용 세탁기 (대형)", desc: "LG B2B — 상업용 세탁기 5-10대. 1대 380-650만", priceRange: "1대 380~650만", priority: "primary", url: "https://www.lge.co.kr/kr/business/" },
      { name: "건조기 (가스·전기)", desc: "상업용 건조기 5-10대. 1대 280-580만", priceRange: "1대 280~580만", priority: "primary" },
      { name: "동전·QR 결제 + CCTV", desc: "무인 운영 핵심", priceRange: "380~650만", priority: "primary" },
    ],
  },
  "ls-laundry-shop": {
    equipment: [
      { name: "수거·배송 차량·관리 시스템", desc: "방문 수거 — 차량 + 앱 관리", priceRange: "차량 별도 + 280만", priority: "primary" },
      { name: "산업용 세탁·건조기", desc: "대용량 세탁기 (런드리24 등 가맹 표준)", priceRange: "1,500~3,500만", priority: "primary" },
    ],
  },
  "ls-dry-cleaning": {
    equipment: [
      { name: "드라이클리닝 기계 (퍼클로)", desc: "드라이 핵심 — 퍼클로에틸렌 기계. 1500-3500만", priceRange: "1,500~3,500만", priority: "primary" },
      { name: "스팀 다리미·프레스기", desc: "정장·코트 마감 — 프레스기. 380-850만", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "ls-home-cleaning": {
    equipment: [
      { name: "방문 청소 도구 풀세트", desc: "친환경 세제 + 청소기·스팀기", priceRange: "150~380만", priority: "primary" },
      { name: "예약·매니저 매칭 앱 (청소연구소·미소)", desc: "B2B 플랫폼 입점 또는 자체 앱", priceRange: "수수료 협의", priority: "recommended" },
    ],
  },
  "ls-office-cleaning": {
    equipment: [
      { name: "산업용 청소 장비 (Karcher·Numatic)", desc: "사무실·매장 — 산업용 진공·스팀 청소기", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "ls-move-cleaning": {
    equipment: [
      { name: "고압 세척기·스팀기 풀세트", desc: "이사 청소 핵심 — 고압 세척", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "ls-appliance-repair": {
    equipment: [
      { name: "수리 도구·테스터 풀세트", desc: "전기 수리 — 멀티미터·테스터·드라이버 일체", priceRange: "150~380만", priority: "primary" },
      { name: "부품 재고 관리 시스템", desc: "주요 부품 재고 — 회전율 관리", priceRange: "월 200-500만 재고", priority: "primary" },
    ],
  },
  "ls-tailoring": {
    equipment: [
      { name: "산업용 재봉기 (Juki·Brother)", desc: "수선 핵심 — 본봉·오버록·자카드. 280-650만", priceRange: "280~650만", priority: "primary" },
      { name: "다림질·프레스기", desc: "수선 마감 — 스팀 다리미 + 프레스", priceRange: "150~380만", priority: "primary" },
    ],
  },
  "ls-print-shop": {
    equipment: [
      { name: "디지털 프린터 (Xerox·Konica Minolta)", desc: "프린트 핵심 — 컬러 디지털 프린터. 850-2500만", priceRange: "850~2,500만", priority: "primary" },
      { name: "제본·재단·코팅 장비", desc: "제본·코팅 마감 풀세트", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "ls-print-package": {
    equipment: [
      { name: "프린터 + 택배 시스템 (편의점급)", desc: "프린트 + CU·GS 택배 결합", priceRange: "850~1,500만", priority: "primary" },
    ],
  },
  "ls-phone-repair": {
    suppliers: [
      { name: "액정·배터리 도매 (정품·호환)", desc: "iPhone·갤럭시 액정 정품·호환 — 도매", priceRange: "액정 5-25만/배터리 1-5만", priority: "primary" },
    ],
    equipment: [
      { name: "액정 분리·진공 흡착 도구", desc: "수리 핵심 — 분리·접착 풀세트", priceRange: "180~380만", priority: "primary" },
    ],
  },
  "ls-pc-repair": {
    suppliers: [
      { name: "PC 부품 도매 (용산 전자상가)", desc: "메인보드·SSD·RAM 등 부품", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "수리 도구 + 데이터 복구 SW", desc: "분리 도구 + R-Studio 등 복구 SW", priceRange: "150~380만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 공간/숙박 (rental, party, shared, practice)
  // ═══════════════════════════════════════════════════════════════
  "space-photo-studio": {
    equipment: [
      { name: "조명·배경지·소품 풀세트 (Profoto·Godox)", desc: "전문 조명 — Profoto 또는 Godox. 580-1500만", priceRange: "580~1,500만", priority: "primary" },
      { name: "예약·결제 시스템 (스페이스클라우드)", desc: "시간 단위 예약 자동화", priceRange: "월 5-15만", priority: "primary" },
    ],
  },
  "space-self-studio": {
    equipment: [
      { name: "셀프 사진 부스 + 즉석 인쇄기", desc: "인생네컷류 — 부스 + 포토 프린터. 850-1800만", priceRange: "850~1,800만", priority: "primary" },
      { name: "QR 결제·무인 키오스크", desc: "무인 운영 핵심", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "space-party-room": {
    equipment: [
      { name: "스피커·마이크·프로젝터 풀세트", desc: "노래방 + 영상 — 음향·영상. 380-850만", priceRange: "380~850만", priority: "primary" },
      { name: "테이블·좌석 + 일회용품 비축", desc: "파티 — 테이블·좌석 + 종이컵·접시", priceRange: "280~580만", priority: "primary" },
    ],
  },
  "space-rooftop": {
    equipment: [
      { name: "야외 가구·조명 + 바베큐 그릴", desc: "루프탑 야외 — 조명 + 그릴. 380-850만", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "space-coworking": {
    equipment: [
      { name: "1인 오피스 가구 + 회의실 풀세트", desc: "코워킹 — 1인 책상 다수 + 회의실 풀패키지", priceRange: "1,500~4,000만", priority: "primary" },
      { name: "프린터·네트워크·로커", desc: "공용 인프라 — 프린터·기가 네트워크·로커", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "space-virtual-office": {
    suppliers: [
      { name: "사업자등록 가능 주소 + 우편물 관리", desc: "주소만 — 법적 등록 가능한 주소", priceRange: "월 협의", priority: "primary" },
    ],
  },
  "space-music-practice": {
    equipment: [
      { name: "방음 부스·악기 풀세트 (드럼·키보드)", desc: "합주실 — 방음 + 드럼·앰프. 부스당 1500-3500만", priceRange: "부스당 1,500~3,500만", priority: "primary" },
    ],
  },
  "space-vocal-practice": {
    equipment: [
      { name: "방음 + 마이크·녹음 시스템", desc: "보컬·녹음 — Apogee·Audient 인터페이스 + 마이크", priceRange: "850~1,800만", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 온라인·디지털 (fashion, beauty, food, lifestyle, content, service)
  // ═══════════════════════════════════════════════════════════════
  "ec-fashion-women": {
    suppliers: [
      { name: "동대문 도매 (apM·청평화·디오트)", desc: "여성 의류 도매 1번지 — 시즌별 입고", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "촬영 스튜디오·마네킹·조명", desc: "스마트스토어 — 촬영 인프라. 380-850만", priceRange: "380~850만", priority: "primary" },
    ],
  },
  "ec-fashion-men": {
    suppliers: [
      { name: "동대문 남성 도매 (디오트·apM)", desc: "남성 캐주얼·스트릿 도매", priceRange: "도매가", priority: "primary" },
    ],
  },
  "ec-fashion-kids": {
    suppliers: [
      { name: "남대문 아동복 도매상가", desc: "아동복 도매 1번지", priceRange: "도매가", priority: "primary" },
    ],
  },
  "ec-beauty-cosmetics": {
    suppliers: [
      { name: "K-뷰티 OEM (코스맥스·한국콜마)", desc: "자체 브랜드 OEM 제조 — MOQ 1만개", priceRange: "OEM 협의", priority: "primary" },
    ],
    equipment: [
      { name: "재고·물류 관리 (이지어드민·풀필먼트)", desc: "쿠팡·자체몰 통합 재고 관리", priceRange: "월 30-100만", priority: "primary" },
    ],
  },
  "ec-beauty-hair": {
    suppliers: [
      { name: "헤어·바디케어 OEM·도매", desc: "샴푸·바디 OEM 또는 브랜드 도매", priceRange: "OEM 협의", priority: "primary" },
    ],
  },
  "ec-food-snack": {
    suppliers: [
      { name: "수제 디저트 OEM·자체 제조", desc: "수제 디저트 — 자체 주방 또는 OEM", priceRange: "OEM 협의", priority: "primary" },
    ],
  },
  "ec-food-meal-kit": {
    suppliers: [
      { name: "마이셰프·프레시지 (밀키트 OEM)", desc: "밀키트 OEM 제조 또는 자체 제조", priceRange: "OEM 협의", priority: "primary" },
    ],
    equipment: [
      { name: "냉장·냉동 보관 + 새벽배송 인프라", desc: "마켓컬리·쿠팡 새벽 입점 + 자체 보관", priceRange: "1,500~4,000만", priority: "primary" },
    ],
  },
  "ec-food-health": {
    suppliers: [
      { name: "건강식품 OEM·도매 (종근당)", desc: "프로바이오틱스·콜라겐 OEM", priceRange: "OEM 협의", priority: "primary" },
    ],
  },
  "ec-lifestyle-home": {
    suppliers: [
      { name: "오늘의집 입점 + 자체 매입", desc: "홈데코 — 오늘의집 + 동대문 잡화 도매", priceRange: "수수료 + 도매가", priority: "primary" },
    ],
  },
  "ec-lifestyle-pet": {
    suppliers: [
      { name: "펫 사료·간식 OEM·도매", desc: "사료·간식·장난감 도매 또는 OEM", priceRange: "도매가", priority: "primary" },
    ],
  },
  "ec-content-ebook": {
    suppliers: [
      { name: "SaaS 인프라 (호스팅·결제)", desc: "전자책 자체몰 — 호스팅 + 결제 PG", priceRange: "월 5-30만", priority: "primary" },
      { name: "유페이먼츠·포트원 (한국 PG)", desc: "디지털 콘텐츠 결제 — 카드·간편결제", priceRange: "수수료 2.5-3.3%", priority: "primary", url: "https://portone.io/" },
    ],
  },
  "ec-content-template": {
    suppliers: [
      { name: "Etsy·Gumroad·자체몰 입점", desc: "디자인 에셋 — 글로벌 입점 또는 자체", priceRange: "수수료 협의", priority: "primary" },
    ],
  },
  "ec-content-course": {
    suppliers: [
      { name: "인프런·클래스101·탈잉 입점", desc: "온라인 강의 플랫폼 — 수수료 30-50%", priceRange: "수수료 30-50%", priority: "primary" },
    ],
    equipment: [
      { name: "강의 촬영·편집 풀세트", desc: "카메라·마이크·조명·편집 SW. 380-1200만", priceRange: "380~1,200만", priority: "primary" },
    ],
  },
  "ec-service-saas": {
    suppliers: [
      { name: "AWS·Vercel·Cloudflare (인프라)", desc: "SaaS 핵심 인프라 — 호스팅·CDN·DB", priceRange: "월 30-500만", priority: "primary" },
      { name: "포트원·토스페이먼츠 (한국 결제)", desc: "한국 SaaS 결제 PG — 카드·간편결제·정기결제", priceRange: "수수료 2.5-3.3%", priority: "primary", url: "https://portone.io/" },
      { name: "Paddle·Lemon Squeezy (글로벌 MoR)", desc: "Stripe 미진출 — MoR 모델로 해외 결제·세금 처리", priceRange: "수수료 5-7%", priority: "recommended" },
    ],
  },
  "ec-service-marketplace": {
    suppliers: [
      { name: "크몽·숨고 (전문가 매칭 플랫폼)", desc: "수수료 모델 — 자체 또는 입점", priceRange: "수수료 10-20%", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 스타트업 (ai-saas, fintech, healthtech, edutech, logistics, creator, deeptech, semi, bio, climate)
  // ═══════════════════════════════════════════════════════════════
  "su-ai-chatbot": {
    suppliers: [
      { name: "OpenAI API·Anthropic Claude API", desc: "AI 챗봇 핵심 LLM — GPT/Claude API. Anthropic Startup $25K credits 활용 가능", priceRange: "월 50-2000만", priority: "primary" },
      { name: "AWS·Vercel (배포 인프라)", desc: "Vercel AI SDK + AWS Bedrock — 서버리스 배포", priceRange: "월 30-500만", priority: "primary" },
      { name: "포트원·토스페이먼츠 (B2B 결제)", desc: "B2B SaaS 정기결제 — 빌링키 발급", priceRange: "수수료 2.5-3.3%", priority: "primary", url: "https://portone.io/" },
    ],
  },
  "su-ai-content": {
    suppliers: [
      { name: "OpenAI·Stable Diffusion·Midjourney API", desc: "콘텐츠 생성 — 텍스트·이미지 LLM", priceRange: "월 50-2000만", priority: "primary" },
      { name: "AWS S3·Cloudflare R2 (저장)", desc: "생성 콘텐츠 저장·CDN", priceRange: "월 10-200만", priority: "primary" },
    ],
  },
  "su-ai-vertical": {
    suppliers: [
      { name: "Anthropic·OpenAI Enterprise API", desc: "버티컬 AI — 산업 데이터 fine-tuning + RAG", priceRange: "월 200-5000만", priority: "primary" },
      { name: "Pinecone·Weaviate (벡터 DB)", desc: "RAG 핵심 — 벡터 검색 인프라", priceRange: "월 30-500만", priority: "primary" },
    ],
  },
  "su-fintech-payment": {
    suppliers: [
      { name: "PG 라이선스·금감원 인가", desc: "결제·송금 핀테크 — 전자금융업 등록 필수", priceRange: "라이선스 보증금", priority: "primary" },
      { name: "AWS·NHN Cloud (보안 인프라)", desc: "PCI DSS 인증 클라우드", priceRange: "월 200-2000만", priority: "primary" },
    ],
  },
  "su-fintech-investment": {
    suppliers: [
      { name: "한국투자증권·미래에셋 (증권 API)", desc: "로보어드바이저 — 증권사 API 연동", priceRange: "협의", priority: "primary" },
    ],
  },
  "su-health-app": {
    suppliers: [
      { name: "AWS·NHN Cloud (의료 데이터)", desc: "HIPAA·개인정보보호법 — 의료 데이터 보관", priceRange: "월 50-1000만", priority: "primary" },
      { name: "포트원·토스페이먼츠 (구독 결제)", desc: "B2C 정기 구독 — 빌링키", priceRange: "수수료 2.5-3.3%", priority: "primary" },
    ],
  },
  "su-medtech-device": {
    suppliers: [
      { name: "MFDS 인증 컨설팅 (Class II/III)", desc: "식약처 의료기기 인증 — 임상·인증 컨설팅", priceRange: "인증당 5,000-30,000만", priority: "primary" },
      { name: "EMS 제조 (PCB·외주 제조)", desc: "한국·중국 EMS — 시제품·양산", priceRange: "협의", priority: "primary" },
    ],
  },
  "su-edu-platform": {
    suppliers: [
      { name: "AWS·Vercel (LMS 인프라)", desc: "동영상 스트리밍 + DB", priceRange: "월 30-500만", priority: "primary" },
      { name: "동영상 CDN (Mux·Cloudflare Stream)", desc: "강의 스트리밍 핵심", priceRange: "월 30-300만", priority: "primary" },
    ],
  },
  "su-edu-ai-tutor": {
    suppliers: [
      { name: "Anthropic·OpenAI API (AI 튜터)", desc: "개인화 학습 추천 LLM", priceRange: "월 50-2000만", priority: "primary" },
    ],
  },
  "su-logi-lastmile": {
    suppliers: [
      { name: "배송 차량·물류 협력사", desc: "당일·지역배송 — 차량 + 외주 기사 매칭", priceRange: "협의", priority: "primary" },
      { name: "물류 SaaS (와이즈모바일·로지스팟)", desc: "배송 추적·관리 SaaS", priceRange: "월 30-200만", priority: "primary" },
    ],
  },
  "su-logi-platform": {
    suppliers: [
      { name: "화물·풀필먼트 매칭 SaaS", desc: "B2B 화물 매칭 플랫폼 자체 구축", priceRange: "초기 5,000만+", priority: "primary" },
    ],
  },
  "su-creator-tools": {
    suppliers: [
      { name: "GPU 인프라 (AWS·NCSOFT·Azure)", desc: "영상·썸네일 자동화 — GPU 클라우드", priceRange: "월 100-2000만", priority: "primary" },
    ],
  },
  "su-creator-marketplace": {
    suppliers: [
      { name: "광고주-크리에이터 매칭 SaaS", desc: "MCN 플랫폼 — 자체 구축 또는 화이트라벨", priceRange: "초기 5,000만+", priority: "primary" },
    ],
  },
  "su-dt-ai-research": {
    suppliers: [
      { name: "GPU 클러스터 (NVIDIA H100·A100)", desc: "AI 연구 — H100 8장 클러스터 또는 클라우드", priceRange: "월 5,000-30,000만", priority: "primary" },
      { name: "Hugging Face·OpenReview (논문·모델)", desc: "오픈소스 모델 + 논문 발표 채널", priceRange: "무료/유료", priority: "primary" },
    ],
  },
  "su-dt-quantum": {
    suppliers: [
      { name: "정부 R&D 과제 (KIST·ETRI)", desc: "양자 컴퓨팅 — 정부 과제 + 클라우드 양자 (IBM·AWS Braket)", priceRange: "과제 협의", priority: "primary" },
    ],
  },
  "su-semi-fabless": {
    suppliers: [
      { name: "TSMC·삼성 파운드리 (위탁 생산)", desc: "팹리스 — 설계 후 위탁 생산. MOQ 협의", priceRange: "MPW 1-3억", priority: "primary" },
      { name: "Cadence·Synopsys (EDA 툴)", desc: "반도체 설계 SW 라이선스", priceRange: "연 1-5억", priority: "primary" },
    ],
  },
  "su-semi-design-tool": {
    suppliers: [
      { name: "AWS GPU·EDA 라이선스", desc: "EDA 툴 자체 개발 — 대규모 컴퓨팅", priceRange: "월 1,000-5,000만", priority: "primary" },
    ],
  },
  "su-bio-drug": {
    suppliers: [
      { name: "임상·CRO 협력 (LSK·Crown)", desc: "신약 — 임상 1~3상 위탁 (CRO)", priceRange: "임상당 50-500억", priority: "primary" },
      { name: "식약처·FDA 인허가 컨설팅", desc: "임상 디자인 + 인허가 전략", priceRange: "협의", priority: "primary" },
    ],
  },
  "su-bio-diagnostic": {
    suppliers: [
      { name: "MFDS Class II/III 인증", desc: "체외진단 — 식약처 인증 필수", priceRange: "인증당 1,000-10,000만", priority: "primary" },
    ],
  },
  "su-climate-renewable": {
    suppliers: [
      { name: "한화큐셀·LG에너지솔루션 (태양광·ESS)", desc: "재생에너지 — 패널·ESS 제조 협력", priceRange: "협의", priority: "primary" },
    ],
  },
  "su-climate-battery": {
    suppliers: [
      { name: "LG에너지솔루션·삼성SDI (셀 공급)", desc: "EV·ESS 셀 — 대형 셀 제조사 협력", priceRange: "협의", priority: "primary" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ─── Legacy aliases (이전 키 호환 유지) ─────────────────────────
  // ═══════════════════════════════════════════════════════════════
  "korean-noodle": {
    suppliers: [
      { name: "면사랑·풍년면업 (면 도매)", desc: "칼국수·잔치국수 면 정기 납품", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "면 조리기·반죽기", desc: "칼국수 면 만들기 자체 반죽 시. 220-450만", priceRange: "220~450만", priority: "primary" },
      { name: "면 삶기 전용 솥 (4구 이상)", desc: "회전 빠른 면 삶기. 110-220만", priceRange: "110~220만", priority: "primary" },
    ],
  },
  "korean-grill": {
    suppliers: [
      { name: "마장축산물시장 (구이용 정육)", desc: "삼겹살·갈비·곱창 도매 1번지", priceRange: "도매가", priority: "primary", url: "http://www.mjmm.co.kr/" },
    ],
    equipment: [
      { name: "테이블 화로 (가스·숯)", desc: "테이블당 화로 + 후드. 1테이블 80-150만", priceRange: "80~150만/테이블", priority: "primary" },
      { name: "강력 후드·덕트 시스템", desc: "구이매장 필수 — 일반 후드의 2-3배 풍량. 320-770만", priceRange: "320~770만", priority: "primary" },
    ],
  },
  "fried-chicken": {
    equipment: [
      { name: "치킨 압력 튀김기 (Henny Penny)", desc: "치킨 전문 압력튀김기. 한국 공식 수입 오진양행 1983~ . 650-1600만", priceRange: "650~1600만", priority: "primary", url: "https://ichef.co.kr/category/henny-penny/150/" },
      { name: "양념 회전기·코팅 텀블러", desc: "양념 치킨 코팅 자동화. 220-450만", priceRange: "220~450만", priority: "recommended" },
    ],
  },
  "burger-gourmet": {
    suppliers: [
      { name: "수제 패티 도매 (한우·앵거스)", desc: "프리미엄 패티용 정육 도매", priceRange: "kg당 3-5만", priority: "primary" },
      { name: "수제 번 (베이커리 직거래)", desc: "브리오슈·프레첼 번 베이커리 일일 납품", priceRange: "개당 1-2천", priority: "primary" },
    ],
    equipment: [
      { name: "그리들·패티 그릴 (스테인리스)", desc: "패티 굽기 핵심. 1.2m 그리들 320-650만", priceRange: "320~650만", priority: "primary" },
    ],
  },
  "roastery-cafe": {
    equipment: [
      { name: "로스터기 (Probat·Loring·Diedrich)", desc: "5kg 클래스 로스터기 1600-3700만 / 12kg 4200-7500만", priceRange: "1600~7500만", priority: "primary" },
      { name: "냉각·정선·보관 설비", desc: "원두 후처리 + 보관. 320-850만", priceRange: "320~850만", priority: "primary" },
    ],
  },
  "low-cost-takeout": {
    suppliers: [
      { name: "메가커피·컴포즈급 원두 도매", desc: "kg당 8,000-15,000원. 가격 경쟁력 1순위", priceRange: "kg당 0.8-1.5만", priority: "primary" },
    ],
    equipment: [
      { name: "전자동 머신 (eversys·Schaerer)", desc: "버튼 한 번 추출. 인건비 절감 핵심. 1100-2700만", priceRange: "1100~2700만", priority: "primary" },
    ],
  },
  "barber-shop": {
    suppliers: [
      { name: "바버샵 도매 (헤어앤미 + 미국 수입)", desc: "포마드·셰이브 크림·면도용품 도매", priceRange: "전문가가", priority: "primary", url: "https://hairnmi.co.kr/" },
    ],
    equipment: [
      { name: "바버 의자 (전통 바버 체어)", desc: "전통식 바버 체어 220-550만 (아이콘성 인테리어)", priceRange: "220~550만", priority: "primary" },
      { name: "면도용 스팀 + 핫타올기", desc: "남성 셰이브 풀 서비스용", priceRange: "50~150만", priority: "recommended" },
    ],
  },
  "reformer-pilates": {
    equipment: [
      { name: "리포머 머신 (Balanced Body·Stott)", desc: "프리미엄 리포머 4-8대. 1대 420-850만", priceRange: "1대 420~850만", priority: "primary" },
      { name: "캐딜락·체어 (보조 기구)", desc: "리포머 + 보조 기구 풀세트. 650-1300만", priceRange: "650~1300만", priority: "recommended" },
    ],
  },
  "english-academy": {
    suppliers: [
      { name: "교보문고·웅진씽크빅 (영어 교재)", desc: "초중고 영어 교재 정기 납품. 출판사 직거래 30% 할인", priceRange: "도매가", priority: "primary", url: "https://www.kyobobook.co.kr/" },
    ],
    equipment: [
      { name: "원어민 화상 시스템 (Zoom·Meet)", desc: "화상 영어 수업 인프라. 카메라·스피커·마이크", priceRange: "1실 50-150만", priority: "recommended" },
    ],
  },
  "coding-stem-academy": {
    equipment: [
      { name: "노트북·태블릿 (1인당 1대)", desc: "iPad / Chromebook 12-20대. 대당 50-100만", priceRange: "1대 50-100만", priority: "primary" },
      { name: "STEM 교구 (LEGO·아두이노·라즈베리파이)", desc: "코딩·로봇 교구 풀패키지", priceRange: "초기 220-550만", priority: "primary" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  //  2026-05-09 audit: 신규 specialty 오버라이드 (사장님 요청 — 정확한 매핑)
  //  각 항목은 *해당 specialty 만의 차별적인* 공급처·장비만 추가; 공통 분모는
  //  sub-industry / 카테고리 fallback 으로 자동 머지됨.
  // ════════════════════════════════════════════════════════════════════

  // ── 외식: 신규 specialty ──
  "fb-chimaek-bar": {
    suppliers: [
      { name: "OB맥주·하이트진로 (생맥주 케그)", desc: "20L 케그 정기납품. 매장당 월 8-20케그", priceRange: "케그당 5-8만", priority: "primary" },
      { name: "안주 도매 (어묵·튀김 식자재)", desc: "치킨 외 술안주 — 어묵·감자튀김", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "생맥주 디스펜서 + 냉각기", desc: "2-4탭 디스펜서 + CO2 냉각기 일체", priceRange: "150~350만", priority: "primary" },
    ],
  },
  "fb-wine-bistro": {
    suppliers: [
      { name: "나라셀라·신세계L&B (와인 수입)", desc: "이탈리아·프랑스 와인 도매. 사업자 직거래", priceRange: "병당 1.5-8만", priority: "primary", url: "https://www.naracellar.com/" },
      { name: "치즈·샤퀴테리 도매 (코스트코·이마트 트레이더스)", desc: "와인 페어링 안주 — 치즈·하몽", priceRange: "회원가", priority: "recommended" },
    ],
    equipment: [
      { name: "와인 셀러·디캔터", desc: "100병+ 와인셀러 + 디캔터 풀세트", priceRange: "200~600만", priority: "primary" },
      { name: "리델·자페로니 와인잔", desc: "전용 와인잔 50-100개 + 보관함", priceRange: "잔당 1-3만", priority: "recommended" },
    ],
  },
  "delivery-protein-meal": {
    suppliers: [
      { name: "하림·체리부로 (닭가슴살 가공)", desc: "삶은 닭가슴살 진공팩 — 100g 단위", priceRange: "g당 13-18원", priority: "primary" },
      { name: "맥스프로틴·비비고 (건강식 PB)", desc: "고단백 도시락 PB 위탁생산 가능", priceRange: "협의", priority: "recommended" },
    ],
  },
  "noodle-naengmyeon": {
    suppliers: [
      { name: "한국제분 (메밀가루·전분)", desc: "냉면 면 자가제조용 메밀·녹말가루", priceRange: "kg당 4-8천", priority: "primary" },
      { name: "동치미·식초 도매", desc: "평양식 동치미 육수 베이스", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "냉면 압출기 (자동 면 뽑기)", desc: "분당 면발 50인분 — 평양식 가능", priceRange: "350~700만", priority: "primary" },
    ],
  },
  "salad-meal-prep": {
    suppliers: [
      { name: "다회용 밀프렙 용기 도매", desc: "BPA-free PP 1L·1.5L 정기 발주 — 1,000개 단위 단가↓", priceRange: "개당 600-1,200원", priority: "primary" },
    ],
    channels: [
      { name: "마켓컬리·쿠팡 새벽배송 입점", desc: "정기 구독 모델 안착 핵심 채널", priceRange: "입점 협의", priority: "primary" },
    ],
  },

  // ── 카페·디저트: 신규 specialty ──
  "coffee-drive-thru": {
    equipment: [
      { name: "드라이브 윈도우 + 인터컴", desc: "차량 통과 윈도우 + 양방향 음향. 시공 별도", priceRange: "1,500~3,500만", priority: "primary" },
      { name: "POS 스피드오더 단말기", desc: "주문→결제 30초 — 회전율 핵심", priceRange: "150~300만", priority: "primary" },
    ],
  },
  "coffee-mobile-cart": {
    suppliers: [
      { name: "푸드트럭 차량 제작 (이동영업소)", desc: "1톤 트럭 개조 — 식약처 영업신고 필수", priceRange: "차량+개조 3,000~5,000만", priority: "primary" },
    ],
    equipment: [
      { name: "LPG 가스시설 + 안전점검 (KGS)", desc: "이동영업소 LPG 1년마다 안전검사", priceRange: "검사료 30-50만", priority: "primary" },
    ],
  },
  "coffee-corp-bulk": {
    equipment: [
      { name: "대용량 자동 머신 (Necta·Saeco)", desc: "사무실 무인용 자동 머신 — 카운터 100잔/일", priceRange: "350~800만", priority: "primary" },
      { name: "정기 청소·필터 교체 계약", desc: "월 1회 필수 — B2B 신뢰 핵심", priceRange: "월 5-15만", priority: "recommended" },
    ],
  },
  "coffee-tea-hybrid": {
    suppliers: [
      { name: "오설록·티젠 (한국 차 도매)", desc: "녹차·홍차·우롱 한국 1순위. 사업자 직거래", priceRange: "kg당 2-8만", priority: "primary", url: "https://www.osulloc.com/" },
      { name: "Marriage Frères·TWG (수입 티)", desc: "프리미엄 수입 티 — 객단가↑", priceRange: "캔당 3-8만", priority: "recommended" },
    ],
  },
  "coffee-cafe-roastery": {
    suppliers: [
      { name: "생두 직수입 (직트레이드)", desc: "에티오피아·콜롬비아 생두 50kg 단위", priceRange: "kg당 8-25천", priority: "primary" },
    ],
    equipment: [
      { name: "소형 로스터 (Probat·Diedrich 1-5kg)", desc: "Probat 1kg 800만 / 5kg 1,500만 — 매장+도매 hybrid", priceRange: "800~2,500만", priority: "primary" },
    ],
  },
  "dessert-donut": {
    equipment: [
      { name: "도넛 튀김기 (자동 회전)", desc: "노티드·올드페리형 자동 회전 튀김기", priceRange: "350~800만", priority: "primary" },
      { name: "도우 믹서·발효기", desc: "20kg 스파이럴 믹서 + 발효기", priceRange: "250~500만", priority: "primary" },
    ],
  },
  "bakery-vegan": {
    suppliers: [
      { name: "비건·식물성 원료 (바이플랫·미라클빈)", desc: "비건 버터·식물성 우유·아쿠아파바", priceRange: "도매가", priority: "primary" },
      { name: "유기농 밀가루 (한국제분 유기농)", desc: "유기농 인증 + 비건 인증 밀가루", priceRange: "kg당 3-5천", priority: "primary" },
    ],
  },
  "bakery-french": {
    equipment: [
      { name: "프렌치 데크 오븐 (Bongard·Polin)", desc: "수증기 분사 + 데크 오븐 — 바게트·브리오슈", priceRange: "1,500~4,000만", priority: "primary" },
      { name: "분할기·롤러기 (바게트 성형)", desc: "프랑스 정통 빵 성형 자동화", priceRange: "300~700만", priority: "recommended" },
    ],
  },
  "ice-rolled": {
    equipment: [
      { name: "롤 아이스크림 머신 (-25℃ 콜드플레이트)", desc: "태국식 롤 아이스 — 1대당 30-50인분/시", priceRange: "150~350만", priority: "primary" },
    ],
  },
  "ice-frozen-yogurt": {
    equipment: [
      { name: "프로즌 요거트 머신 (Taylor·Stoelting)", desc: "셀프 토핑 — 무게 단위 결제 모델", priceRange: "800~1,800만", priority: "primary" },
      { name: "토핑 바·디스플레이", desc: "30+ 토핑 셀프 진열대", priceRange: "200~500만", priority: "primary" },
    ],
  },
  "cafe-book-cafe": {
    suppliers: [
      { name: "교보문고 도서 도매", desc: "신간·중고 도서 정기 입고. 회전율 30%", priceRange: "도매가", priority: "primary", url: "https://www.kyobobook.co.kr/" },
    ],
    equipment: [
      { name: "도서 책장·열람대", desc: "1,000+ 권 수용 + 좌석 배치", priceRange: "300~700만", priority: "primary" },
    ],
  },
  "cafe-coworking": {
    equipment: [
      { name: "콘센트·와이파이 인프라", desc: "좌석당 콘센트 2개 + 1Gbps 와이파이", priceRange: "1실 200-400만", priority: "primary" },
      { name: "방음·집중 부스 (Phone booth)", desc: "1인 부스 — 화상회의·통화 시간 단위", priceRange: "부스당 250-500만", priority: "recommended" },
    ],
  },

  // ── 뷰티: 신규 specialty ──
  "hair-bridal": {
    suppliers: [
      { name: "웨딩 헤어 액세서리 도매", desc: "티아라·머리꽃·핀 일괄 — 행사용 출장 키트", priceRange: "키트 50-150만", priority: "primary" },
    ],
  },
  "hair-mens-only": {
    suppliers: [
      { name: "바버 가위·면도기 도매 (J오타키·Wahl)", desc: "전통 바버 도구 풀세트", priceRange: "세트 80-200만", priority: "primary" },
    ],
    equipment: [
      { name: "바버 체어 (이탈리아·Belmont)", desc: "전통 가죽 의자 — 정통 바버샵 핵심", priceRange: "대당 250-600만", priority: "primary" },
    ],
  },
  "nail-russian": {
    equipment: [
      { name: "E-file·고급 비트 세트", desc: "러시안 매니큐어 핵심 도구 — 전동 큐티클 케어", priceRange: "150~350만", priority: "primary" },
    ],
  },
  "skin-anti-aging": {
    equipment: [
      { name: "리프팅 기기 (인모드·울쎄라급)", desc: "고주파·HIFU 리프팅 — 객단가↑", priceRange: "1,500~5,000만", priority: "primary" },
      { name: "프리미엄 앰풀·세럼 도매", desc: "닥터드레서·이오메디·필러러 — 의료용 화장품", priceRange: "병당 5-30만", priority: "primary" },
    ],
  },
  "waxing-mens": {
    suppliers: [
      { name: "남성용 하드왁스·스트립 도매", desc: "남성 강모용 — 일반 왁스보다 강력", priceRange: "kg당 3-6만", priority: "primary" },
    ],
  },
  "lash-perm": {
    suppliers: [
      { name: "속눈썹 펌 키트 (러시아·일본)", desc: "1회용 펌제·실리콘 패드", priceRange: "회당 2-5천원 원가", priority: "primary" },
    ],
  },
  "brow-microblading": {
    suppliers: [
      { name: "한올심기 블레이드·색소", desc: "FDA 인증 색소 + 일회용 블레이드", priceRange: "회당 8-15천원 원가", priority: "primary" },
    ],
  },

  // ── 피트니스: 신규 specialty ──
  "pilates-rehab": {
    suppliers: [
      { name: "재활 의료기기 (Balanced Body 메디컬)", desc: "필라테스 + 의료 결합 — 통증·자세 분석", priceRange: "대당 600-1,500만", priority: "primary" },
    ],
    channels: [
      { name: "지역 정형외과·재활병원 제휴", desc: "수술 후 재활 환자 referral 채널", priceRange: "수수료 협의", priority: "primary" },
    ],
  },
  "pilates-mat-only": {
    equipment: [
      { name: "매트·소도구 풀세트 (기구 X)", desc: "20명용 매트·블록·밴드 — 기구 비용 0", priceRange: "초기 100-200만", priority: "primary" },
    ],
  },
  "pilates-pre-natal": {
    equipment: [
      { name: "임산부 전용 리포머 액세서리", desc: "임산부 안전 키트 + 산후 회복 도구", priceRange: "키트 150-300만", priority: "primary" },
    ],
  },
  "pt-women-only": {
    channels: [
      { name: "여성 전용 매체 광고 (네이버 카페·인스타)", desc: "맘카페·여성 운동 인플루언서 협찬", priceRange: "월 30-100만", priority: "primary" },
    ],
  },
  "yoga-aerial": {
    equipment: [
      { name: "에어리얼 해먹·천장 후크 시공", desc: "1인용 해먹 8만 + 천장 후크 시공 평당 30만", priceRange: "시공 500-1,200만", priority: "primary" },
    ],
  },
  "fitness-boxing": {
    suppliers: [
      { name: "샌드백·글러브 도매 (Everlast·라스트)", desc: "샌드백 25-60kg + 글러브 사이즈별", priceRange: "샌드백 15-40만", priority: "primary" },
    ],
    equipment: [
      { name: "복싱 링·스피드백", desc: "1.8m 스피드백 + 풋워크 매트", priceRange: "300~700만", priority: "primary" },
    ],
  },
  "fitness-spinning": {
    equipment: [
      { name: "인도어 사이클 (Keiser·Schwinn)", desc: "Keiser M3i 1대 250만 / 20대 = 5,000만", priceRange: "대당 200-300만", priority: "primary" },
      { name: "수업 음향 시스템 (DJ급 + 마이크)", desc: "수업 음악 + 강사 헤드셋", priceRange: "300~700만", priority: "primary" },
    ],
  },

  // ── 펫: 신규 specialty ──
  "pet-grooming-cat-only": {
    equipment: [
      { name: "고양이 전용 케이지·핸들링 도구", desc: "스트레스 최소화 — 피토닉·자켓 lazor", priceRange: "150~350만", priority: "primary" },
    ],
  },
  "pet-grooming-mobile": {
    suppliers: [
      { name: "차량 개조 (이동 그루밍 트럭)", desc: "1톤 차량 + 욕조·드라이기 — 영업신고", priceRange: "차량+개조 2,500~4,000만", priority: "primary" },
    ],
  },
  "pet-camera-monitor": {
    equipment: [
      { name: "Furbo·페티즌 24h 라이브 카메라", desc: "방마다 1대 — 보호자 앱 알림 + 음성 양방향", priceRange: "대당 30-60만", priority: "primary", url: "https://www.furbo.com/" },
    ],
  },
  "pet-vet-stay": {
    channels: [
      { name: "지역 동물병원 협력", desc: "수의사 상주 — 노령·기저질환 펫 referral", priceRange: "수수료 협의", priority: "primary" },
    ],
  },

  // ── 생활서비스: 신규 specialty ──
  "ls-self-laundry-pet": {
    equipment: [
      { name: "펫 전용 세탁기 (대형 드럼 + 항균)", desc: "펫 털·진드기 전용 — 일반 세탁기와 구분 필수", priceRange: "대당 500-900만", priority: "primary" },
    ],
  },
  "ls-self-laundry-shoe": {
    equipment: [
      { name: "운동화 셀프 세탁기 (전용 슈즈워시)", desc: "운동화 1켤레 30분 — Sneakers Era·LG 슈케어", priceRange: "대당 400-700만", priority: "primary" },
    ],
  },
  "ls-shoe-cleaning": {
    suppliers: [
      { name: "운동화 복원 케미컬 (Jason Markk·Crep)", desc: "전문 클리너 + 발수 스프레이", priceRange: "병당 1.5-3만", priority: "primary" },
    ],
    equipment: [
      { name: "초음파 세정기 + UV 살균기", desc: "운동화 세밀 세정 + 살균 — 1.5만원 단가 정당화", priceRange: "200~500만", priority: "primary" },
    ],
  },
  "ls-3d-print": {
    equipment: [
      { name: "산업용 3D 프린터 (Bambu Lab·Ultimaker)", desc: "FDM 80-300만 / SLA 200-600만 / SLS 1,500만+", priceRange: "80~1,500만", priority: "primary" },
      { name: "3D 모델링 SW (Fusion360·Tinkercad)", desc: "고객 의뢰 모델링 + 슬라이서", priceRange: "월 5-30만", priority: "recommended" },
    ],
  },
  "ls-photo-print": {
    equipment: [
      { name: "사진 프린터 (Fuji Frontier·DNP)", desc: "사진 인화 전용 + 앨범 제본기", priceRange: "1,500~4,000만", priority: "primary" },
    ],
  },
  "ls-camera-repair": {
    suppliers: [
      { name: "카메라 부품 직수입 (니콘·캐논 정품)", desc: "센서·셔터·렌즈 부품", priceRange: "부품가", priority: "primary" },
    ],
  },

  // ── 공간: 신규 specialty ──
  "space-podcast-studio": {
    equipment: [
      { name: "팟캐스트 마이크·믹서 (Shure SM7B·Rodecaster)", desc: "Shure SM7B 50만 × 4 + Rodecaster Pro 100만", priceRange: "300~600만", priority: "primary" },
      { name: "방음 부스 + 어쿠스틱 트리트먼트", desc: "1인 부스 시공 — 평당 50-80만", priceRange: "1,500~3,500만", priority: "primary" },
    ],
  },
  "space-dance-studio": {
    equipment: [
      { name: "전신 거울 + 발레 바", desc: "벽면 전신거울 m당 5-8만 + 발레 바 시공", priceRange: "300~800만", priority: "primary" },
      { name: "댄스 바닥재 (스프링 플로어)", desc: "충격 흡수 — 평당 12-20만", priceRange: "평당 12-20만", priority: "primary" },
    ],
  },
  "space-rental-vlog": {
    equipment: [
      { name: "촬영 장비 풀세트 (조명·카메라·렌즈)", desc: "Aperture LED + Sony A7 + 렌즈 — 1인 미디어용", priceRange: "초기 1,500~3,000만", priority: "primary" },
    ],
  },

  // ── 교육: 신규 specialty ──
  "edu-coding-ai-llm": {
    suppliers: [
      { name: "OpenAI·Anthropic API 크레딧", desc: "수강생 GPT 실습 — 월 사용료 분배", priceRange: "월 10-50만", priority: "primary" },
    ],
  },
  "edu-coding-data": {
    suppliers: [
      { name: "Tableau·Power BI 라이센스 (교육용)", desc: "교육용 무료/할인 라이센스 신청", priceRange: "무료~월 10만", priority: "primary" },
    ],
  },
  "edu-test-prep": {
    suppliers: [
      { name: "토익·토플·아이엘츠 공식 교재 도매", desc: "ETS·British Council 공식 교재 직거래 30%↓", priceRange: "도매가", priority: "primary" },
    ],
  },

  // ── 소매: 신규 specialty ──
  "retail-protein-shop": {
    suppliers: [
      { name: "프로틴 공급사 (마이프로틴·옵티멈)", desc: "WPI·BCAA 직수입. 사업자 도매가", priceRange: "kg당 4-8만", priority: "primary" },
    ],
  },
  "retail-zerowaste": {
    suppliers: [
      { name: "리필 전용 도매 (벌크 액체·고체)", desc: "샴푸·세제·곡물 벌크 — 30L 단위 정기 납품", priceRange: "L당 30-60% 절감", priority: "primary" },
    ],
    equipment: [
      { name: "벌크 디스펜서·계량저울", desc: "리필 매장 핵심 — 계량 정확도 + 위생", priceRange: "전체 300-700만", priority: "primary" },
    ],
  },
  "retail-import-mart": {
    suppliers: [
      { name: "수입식품 직수입사 (포포몰·CV리테일)", desc: "유럽·일본 과자·라면·소스 도매", priceRange: "도매가", priority: "primary" },
    ],
  },

  // ── 게스트하우스: 신규 specialty ──
  "gh-resort-pension": {
    equipment: [
      { name: "수영장 시공·정수 시스템", desc: "10m 수영장 시공 + 매월 정수 관리", priceRange: "시공 4,000~8,000만", priority: "primary" },
      { name: "BBQ 시설 + 야외 가구", desc: "BBQ 그릴 + 테이블·의자 5-10세트", priceRange: "300~700만", priority: "recommended" },
    ],
  },
};

/**
 * sub-industry / specialty / 카테고리에 맞는 vendor 데이터 lookup (3-tier 머지).
 * 우선순위: specialty override → sub-industry override → 카테고리 베이스
 */
export function getVendorData(
  subIndustryId?: string,
  categoryId?: string,
  specialtyId?: string,
): SubIndustryVendorData {
  const cat = categoryId ?? (subIndustryId ? SUB_TO_CATEGORY[subIndustryId] : undefined) ?? "food";
  const base = CATEGORY_VENDOR_BASE[cat] ?? CATEGORY_VENDOR_BASE.food;
  const subOverride = subIndustryId ? SUB_INDUSTRY_VENDOR_DATA[subIndustryId] : undefined;
  const specialtyOverride = specialtyId ? SPECIALTY_VENDOR_DATA[specialtyId] : undefined;

  // 2026-06-26 fix: 같은 공급처가 tier별(specialty/sub/base) 다른 이름으로 중복 노출되던 버그
  //   (예: 미용 「헤어앤미·코제트」·「헤어앤미·헤어2000」·「헤어앤미」 가 모두 hairnmi.co.kr).
  //   → concat 후 url(없으면 name) 기준 dedup. 첫 항목(=가장 specific tier) 유지.
  const dedupe = (items: VendorItem[]): VendorItem[] => {
    const seen = new Set<string>();
    return items.filter((it) => {
      const key = it.url?.trim() || `name:${it.name.trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // 예산 단계 태그 부여 — 명시값 우선, 없으면 가격대·키워드에서 결정. (dedup 후 태깅)
  const withTier = (items: VendorItem[]): VendorItem[] =>
    dedupe(items).map((it) => ({ ...it, budgetTier: classifyBudgetTier(it) }));

  // 우선순위 머지: specialty (가장 우선) → sub → base
  return {
    suppliers: withTier([
      ...(specialtyOverride?.suppliers ?? []),
      ...(subOverride?.suppliers ?? []),
      ...base.suppliers,
    ]),
    equipment: withTier([
      ...(specialtyOverride?.equipment ?? []),
      ...(subOverride?.equipment ?? []),
      ...base.equipment,
    ]),
    pos: withTier([
      ...(specialtyOverride?.pos ?? []),
      ...(subOverride?.pos ?? []),
      ...base.pos,
    ]),
    channels: withTier([
      ...(specialtyOverride?.channels ?? []),
      ...(subOverride?.channels ?? []),
      ...(base.channels ?? []),
    ]),
  };
}
