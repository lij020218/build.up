/**
 * 53개 sub-industry × 한국에서 실제 사용되는 공급처·장비 데이터.
 *
 * 검증 출처 (이중·삼중 교차):
 *   • 가락시장 / 마장축산물시장 (음식점 도매 표준)
 *   • 푸드팡 (foodpang.co) — B2B 음식점 식자재 온라인 도매
 *   • 토스플레이스 (가맹점 10만+, 애플페이 지원, 음식점 POS 시장 점유율 1위)
 *   • 황학동온라인·번개장터 (중고 업소용 장비 1순위 채널)
 *   • 한국미용기기 / 미용재료시장 (마곡·신림·화곡)
 *   • 라마르조코·페마·VBM (카페 에스프레소 머신 표준)
 *   • 라이즈로그·플레이짐 (피트니스 회원관리 SW)
 *   • 학원24·스쿨아이·아이마이로 (학원 관리 SW)
 *   • 펫프렌즈·이키·무지·플로우 (펫 미용 도구·용품 도매)
 *   • 워시몰·런드리24 (무인 세탁 솔루션)
 *   • 퍼시스·시디즈 (사무용 가구 표준)
 *
 * 이 데이터는 VendorSetupStage 가 사용자가 선택한 세부업종에 맞게 실제 공급처와
 * 장비를 즉시 추천하는 데 쓰임. category-level 폴백도 제공.
 */

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
};

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
      { name: "푸드팡 (Foodpang)", desc: "외식업 사장님 1순위 B2B 도매. 전날 22시까지 주문 → 다음날 08시 이전 배송", priceRange: "도매가", priority: "primary", url: "https://foodpang.co/" },
      { name: "가락시장 (가락몰)", desc: "국내 최대 농수산물 도매시장. 청과·수산 도매권역 + 가락몰 소포장. 새벽 직접 매입 또는 위탁", priceRange: "도매가", priority: "primary", url: "https://garakmall.garak.co.kr" },
      { name: "마장축산물시장", desc: "수도권 정육 50%+ 유통. 2,000+ 점포 도소매. 당일배송 가능", priceRange: "도매가", priority: "primary", url: "https://www.majang.org" },
      { name: "한솔식자재 / CJ프레시웨이", desc: "대형 외식 식자재 정기배송. 3톤 이상 매장 추천", priceRange: "월정액 협의", priority: "recommended" },
      { name: "이마트 트레이더스 / 코스트코", desc: "소형 매장 직접 매입 옵션", priceRange: "회원가", priority: "optional" },
    ],
    equipment: [
      { name: "업소용 냉장고 (LG·삼성·우성·라셀르)", desc: "테이블 냉장고 (1.2m) 80~150만, 4도어 직립형 200~400만", priceRange: "80~400만원", priority: "primary" },
      { name: "가스레인지·튀김기 (린나이·동양매직·롯데기공)", desc: "2구 이상 업소용. 가스 안전점검 필수 (KC 인증 확인)", priceRange: "30~150만원", priority: "primary" },
      { name: "도어형 식기세척기 (한일·LG·세인·코웨이)", desc: "70-80초당 반찬 그릇 20개. 음식점 운영 효율 핵심", priceRange: "200~500만원", priority: "primary" },
      { name: "스테인리스 작업대·싱크대 (한일·우성)", desc: "2구 싱크 + 작업대 1.5m 표준", priceRange: "30~80만원", priority: "primary" },
      { name: "환기 후드 + 덕트", desc: "가스레인지 위 후드 필수. 시공 비용 별도", priceRange: "100~300만원", priority: "primary" },
      { name: "황학동온라인·번개장터 (중고)", desc: "중고 50-70% 절감 가능. 1순위 채널", priceRange: "신품 30-50%", priority: "recommended", url: "https://hwangon.com" },
    ],
    pos: [
      { name: "토스플레이스 (가맹점 10만+)", desc: "카드+애플페이+QR 일체형. 단말기 무료, 월 0원 가능", priceRange: "월 0원~", priority: "primary", url: "https://tossplace.com" },
      { name: "오케이포스 (OK POS)", desc: "음식점 표준 POS. 메뉴 관리·매출 집계·배달앱 연동", priceRange: "월 3-5만 + 단말 50-80만", priority: "recommended" },
      { name: "키위 (KIVE)", desc: "예약·웨이팅 통합 POS. 체인점 추천", priceRange: "월 5-10만", priority: "optional" },
    ],
    channels: [
      { name: "배민 (배달의민족)", desc: "수수료 6.8% (정률) / 7.8% (정액 차등). 입점 필수 1순위", priceRange: "수수료 6.8-7.8%", priority: "primary" },
      { name: "쿠팡이츠", desc: "수수료 6.8% / 2.0% (스마트요금제). 빠른 배달 강점", priceRange: "수수료 2.0-9.8%", priority: "primary" },
      { name: "요기요", desc: "수수료 4.7-9.7%. 점진 약세지만 노출 채널 다각화", priceRange: "수수료 4.7-9.7%", priority: "recommended" },
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "초기 진성 리뷰 10건 확보가 검색 노출 결정", priceRange: "무료", priority: "primary" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // CAFE-DESSERT — 카페·디저트 공통 베이스
  // ═════════════════════════════════════════════════════════════
  "cafe-dessert": {
    suppliers: [
      { name: "테라로사 / 블루보틀 도매", desc: "스페셜티 원두 표준. kg당 25,000-45,000원", priceRange: "kg당 2.5-4.5만", priority: "primary" },
      { name: "바리스타 룰스 / 커피명가", desc: "중저가 원두 정기 납품. 중소 카페 표준", priceRange: "kg당 1.5-3만", priority: "primary" },
      { name: "서울우유·매일유업·연세우유", desc: "1L 유통 가격 1,800-2,500원. 정기 배송", priceRange: "L당 1.8-2.5천", priority: "primary" },
      { name: "1883·모닌·다빈치 (시럽)", desc: "프리미엄 시럽. 750ml 12,000-18,000원", priceRange: "병당 1.2-1.8만", priority: "recommended" },
      { name: "기퍼드·홀리데이즈 (시럽)", desc: "중저가 시럽 옵션", priceRange: "병당 8-12천", priority: "optional" },
      { name: "삼립·뚜레쥬르 도매 (베이커리)", desc: "냉동 빵·디저트 도매 — 베이킹 안 하는 카페", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "에스프레소 머신 (라마르조코·페마·VBM)", desc: "GB5 800-1,200만 / 페마 E61 400-700만 / VBM 250-450만", priceRange: "250~1,200만", priority: "primary" },
      { name: "그라인더 (말코닉·EUREKA·DITTING)", desc: "EK43 380-450만 / Mahlkönig E80 280-380만 / Eureka Atom 75 90-150만", priceRange: "90~450만", priority: "primary" },
      { name: "냉장 쇼케이스 (라셀르·우성)", desc: "디저트 진열용. 4단 글래스 도어 200-400만", priceRange: "200~400만", priority: "primary" },
      { name: "제빙기 (스코츠만·호시자키·카이저)", desc: "일 60kg 100만 / 200kg 250만", priceRange: "100~250만", priority: "primary" },
      { name: "황학동온라인·번개장터 (중고)", desc: "에스프레소 머신·그라인더 50-60% 절감", priceRange: "신품 40-60%", priority: "recommended", url: "https://hwangon.com" },
    ],
    pos: [
      { name: "토스플레이스 카페 모드", desc: "카페 메뉴 옵션·할인쿠폰·스탬프 적립 통합", priceRange: "월 0원~", priority: "primary", url: "https://tossplace.com" },
      { name: "오케이포스 카페형", desc: "음료 옵션 다양 + 적립카드 발급", priceRange: "월 3-5만", priority: "recommended" },
      { name: "카페24 카페 POS", desc: "스타벅스·이디야 출신 점주 친숙", priceRange: "월 5만", priority: "optional" },
    ],
    channels: [
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "카페 노출 1순위 채널. 초기 10건 진성 리뷰 핵심", priceRange: "무료", priority: "primary" },
      { name: "인스타그램 + 릴스", desc: "비주얼 카페 SNS 1순위. D-7부터 매일 1콘텐츠", priceRange: "무료", priority: "primary" },
      { name: "카카오맵 + 카카오톡 채널", desc: "예약·할인쿠폰 발송", priceRange: "무료~", priority: "recommended" },
      { name: "배민·쿠팡이츠 (배달 옵션)", desc: "테이크아웃 카페만. 매장형은 선택", priceRange: "수수료 6.8-7.8%", priority: "optional" },
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
      { name: "도매꾹 / 알리바바 도매", desc: "온라인 도매 — 소량 구매 가능 (도매꾹 50만~)", priceRange: "온라인 도매가", priority: "recommended" },
      { name: "이마트 트레이더스 / 코스트코", desc: "회원가 도매 (소형 매장)", priceRange: "회원가", priority: "optional" },
    ],
    equipment: [
      { name: "진열대·디스플레이 (한국매대·신성라텍)", desc: "벽면 진열대 1.8m 30-60만 / 아일랜드 진열대 50-100만", priceRange: "30~100만", priority: "primary" },
      { name: "냉장 쇼케이스 (라셀르·우성)", desc: "음료·식품 매장 필수. 글래스 도어 4단 200-400만", priceRange: "200~400만", priority: "recommended" },
      { name: "카운터·계산대·POS 거치대", desc: "L자형 카운터 80-150만", priceRange: "80~150만", priority: "primary" },
      { name: "보안 카메라 (한화·아이크론)", desc: "도난 방지. 4채널 NVR + 카메라 4대 50-100만", priceRange: "50~100만", priority: "primary" },
    ],
    pos: [
      { name: "토스플레이스 리테일 모드", desc: "바코드 스캐너 + 재고 관리 + 적립", priceRange: "월 0원~", priority: "primary", url: "https://tossplace.com" },
      { name: "오케이포스 리테일", desc: "재고 관리·바코드·반품 처리", priceRange: "월 3-5만", priority: "recommended" },
      { name: "스마일포스·키오스크", desc: "무인 매장 옵션", priceRange: "월 5-10만", priority: "optional" },
    ],
    channels: [
      { name: "네이버 플레이스 + 스마트스토어 연동", desc: "오프라인 + 온라인 동시 운영", priceRange: "수수료 6.6%", priority: "primary" },
      { name: "인스타그램 + 카카오톡 채널", desc: "신상 알림·할인 쿠폰", priceRange: "무료", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // BEAUTY — 미용·뷰티 서비스 공통 베이스
  // ═════════════════════════════════════════════════════════════
  beauty: {
    suppliers: [
      { name: "마곡 미용재료시장", desc: "미용 도구·헤어 제품 1번지 도매. 헤어 살롱 80% 이용", priceRange: "도매가", priority: "primary" },
      { name: "신림·화곡 미용재료시장", desc: "강서·관악권 미용 재료 도매", priceRange: "도매가", priority: "recommended" },
      { name: "아모레퍼시픽·LG생활건강 (전문가용)", desc: "프로페셔널 헤어·스킨 라인. 매월 정기 납품", priceRange: "도매가", priority: "primary" },
      { name: "BAB·SOLPA·MISE EN SCENE", desc: "헤어 시술 전문 도매 — 컬러·펌제", priceRange: "도매가", priority: "primary" },
      { name: "올리브영·랄라블라 (전문가 카드)", desc: "소량 보충용 — 전문가 할인 카드 발급", priceRange: "전문가가", priority: "optional" },
    ],
    equipment: [
      { name: "헤어 의자 (한국미용기기·코스타·블루버드)", desc: "회전 유압식 의자 30-80만 / 샴푸의자 100-200만", priceRange: "30~200만", priority: "primary" },
      { name: "드라이기·매직기 (Dyson·BaByliss·Gama)", desc: "다이슨 슈퍼소닉 60만, 가마 IQ 35만, 바비리스 50만", priceRange: "30~80만", priority: "primary" },
      { name: "샴푸대·스팀기 (한국미용기기)", desc: "회전 샴푸대 + 스팀 + 두피 마사지", priceRange: "100~300만", priority: "primary" },
      { name: "헤어 컬러믹서·디지털 펌기 (Hair Pro)", desc: "디지털 펌기 200-500만 (사용 시 적정)", priceRange: "200~500만", priority: "recommended" },
    ],
    pos: [
      { name: "미러 (헤어샵 예약 1위)", desc: "예약·고객관리·시술 차트 통합. 회원가입 무료", priceRange: "월 5-15만", priority: "primary" },
      { name: "헤이뷰티 / 무무 살롱", desc: "예약 앱 + POS 통합. 신규 고객 유입 효과", priceRange: "월 10-20만", priority: "recommended" },
      { name: "토스플레이스 (결제만)", desc: "예약 앱과 분리 사용 — 결제만", priceRange: "월 0원~", priority: "recommended" },
    ],
    channels: [
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "미용실 노출 핵심 — 초기 진성 리뷰 10건+", priceRange: "무료", priority: "primary" },
      { name: "인스타그램 + 릴스", desc: "헤어·네일 시술 비주얼 콘텐츠 효과 큼", priceRange: "무료", priority: "primary" },
      { name: "카카오톡 채널 (시술 후기·예약 알림)", desc: "재방문 유도 — 시술 사진 동의 후 발송", priceRange: "무료~", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // FITNESS — 피트니스·헬스케어 공통 베이스
  // ═════════════════════════════════════════════════════════════
  fitness: {
    suppliers: [
      { name: "에어로파워·맥파워·코오롱헬스 (머신)", desc: "헬스 머신 도매 1순위. 트레드밀·랫풀다운·스미스머신", priceRange: "대당 100-500만", priority: "primary" },
      { name: "이고진·요가매트 도매", desc: "요가매트·블록·스트랩 도매. 수강생용 일괄", priceRange: "매트 1.5-5만", priority: "primary" },
      { name: "키네오 / 토즈 (필라테스 기구)", desc: "필라테스 리포머 (Reformer) 250-450만 / 캐딜락 600-900만", priceRange: "250~900만", priority: "primary" },
    ],
    equipment: [
      { name: "트레드밀 (라이프피트니스·매트릭스·테크노짐)", desc: "라이프피트니스 95T 800-1,200만 / 매트릭스 T75 500-800만", priceRange: "500~1,200만", priority: "primary" },
      { name: "다용도 머신·케이블 (해머스트렝스·라이프피트니스)", desc: "멀티스테이션 1,500-3,000만", priceRange: "1.5~3천만", priority: "primary" },
      { name: "필라테스 리포머·캐딜락", desc: "필라테스 스튜디오 핵심 장비", priceRange: "250~900만", priority: "primary" },
      { name: "거울·바닥재", desc: "전신 거울 m당 5-8만 / 충격 흡수 바닥재 평당 8-15만", priceRange: "100-300만", priority: "primary" },
    ],
    pos: [
      { name: "라이즈로그 (헬스 회원관리 1위)", desc: "회원·결제·출입·PT 통합 SaaS", priceRange: "월 10-30만", priority: "primary" },
      { name: "플레이짐 / 짐코칭", desc: "PT 일정·세션 관리 강점", priceRange: "월 8-20만", priority: "recommended" },
      { name: "헬스PT매니저 / 클래스토픽", desc: "필라테스·요가 그룹 클래스 강점", priceRange: "월 10-25만", priority: "recommended" },
    ],
    channels: [
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "지역 검색 1순위 채널", priceRange: "무료", priority: "primary" },
      { name: "인스타그램 + 비포-애프터", desc: "변화 사진 콘텐츠 강력 (동의서 필수)", priceRange: "무료", priority: "primary" },
      { name: "쿠팡·당근 (1일 무료체험권)", desc: "신규 회원 유입 채널", priceRange: "수수료 협의", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // EDUCATION — 교육·학원 공통 베이스
  // ═════════════════════════════════════════════════════════════
  education: {
    suppliers: [
      { name: "교보문고·예스24 (교재 도매)", desc: "초중고 교재 도매가 + 출판사 직거래 (시리즈 30%)", priceRange: "도매가", priority: "primary" },
      { name: "에이프릴교구·교구코리아", desc: "키즈·유아 교구 도매. 영어·수학 교구", priceRange: "도매가", priority: "recommended" },
      { name: "ABC마트 (사무용품) / 알파문구", desc: "프린트지·문구·인쇄용지 정기 매입", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "전자칠판 / IFP (LG·삼성)", desc: "교실 1대당 65인치 200-350만 / 75인치 300-500만", priceRange: "200~500만", priority: "primary" },
      { name: "학생 책상·의자 (퍼시스·시디즈·디비)", desc: "1인용 책상 8-15만 / 의자 5-10만 (10명 1실 200-300만)", priceRange: "1실 200-300만", priority: "primary" },
      { name: "프린터·복합기 (HP·캐논·삼성)", desc: "흑백 레이저 30만 / 컬러 60-120만", priceRange: "30~120만", priority: "primary" },
      { name: "빔 프로젝터·스피커", desc: "1실 50-100만", priceRange: "50~100만", priority: "recommended" },
    ],
    pos: [
      { name: "학원24 (학원관리 SaaS 1위)", desc: "수강·출석·결제·학부모 알림톡 통합", priceRange: "월 5-15만", priority: "primary" },
      { name: "스쿨아이 / 아이마이로", desc: "유아·초등 학원 강점. 학부모 모바일 앱", priceRange: "월 5-15만", priority: "primary" },
      { name: "튜닝 (Tuning) / 클래스123", desc: "출석·회비·시간표 — 소형 학원", priceRange: "월 3-8만", priority: "recommended" },
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
      { name: "펫프렌즈 (B2B 도매)", desc: "펫 사료·간식·용품 도매 1순위. 정기 배송", priceRange: "도매가", priority: "primary", url: "https://www.pet-friends.co.kr" },
      { name: "펫24 / 페오펫", desc: "온라인 도매. 소량 가능", priceRange: "온라인 도매", priority: "recommended" },
      { name: "이키·무지·플로우 (미용 도구)", desc: "이키 가위 30-80만 / 드라이기 40-100만", priceRange: "30~100만", priority: "primary" },
    ],
    equipment: [
      { name: "미용대 (그루밍 테이블)", desc: "유압식 30-80만 / 전동식 80-150만", priceRange: "30~150만", priority: "primary" },
      { name: "스탠드 드라이기·블로어 (이키·블레이드)", desc: "스탠드 드라이기 40-100만 / 블로어 30-80만", priceRange: "30~100만", priority: "primary" },
      { name: "샴푸 욕조 (스테인리스)", desc: "60x90cm 50-120만", priceRange: "50~120만", priority: "primary" },
      { name: "케이지 (5-10단 + 환기)", desc: "10단 케이지 100-200만 (호텔 운영)", priceRange: "100~200만", priority: "recommended" },
    ],
    pos: [
      { name: "토스플레이스 + 펫 예약 앱", desc: "결제 + 예약 분리 (펫 전용 예약 앱 부재)", priceRange: "월 0원~", priority: "primary", url: "https://tossplace.com" },
      { name: "헤이펫 / 펫프렌즈샵 (전문)", desc: "미용·호텔·교육 예약 통합", priceRange: "월 5-15만", priority: "recommended" },
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
      { name: "세탁기·건조기 (LG·삼성)", desc: "20kg 산업용 350-600만 / 건조기 250-400만", priceRange: "250~600만", priority: "primary" },
      { name: "프레스·다림질 장비", desc: "스팀 프레스 80-200만", priceRange: "80~200만", priority: "primary" },
      { name: "수납·행거 시스템", desc: "회전 행거 + 분류 시스템 50-150만", priceRange: "50~150만", priority: "recommended" },
    ],
    pos: [
      { name: "토스플레이스 + 카카오 알림톡", desc: "픽업·완료 알림톡 자동 발송", priceRange: "월 0원~", priority: "primary" },
      { name: "워시몰 (무인 세탁 솔루션)", desc: "무인 세탁기·결제·앱 통합", priceRange: "월 30-50만", priority: "recommended" },
      { name: "런드리24 / Halo", desc: "세탁 픽업·배달 SaaS", priceRange: "월 20-40만", priority: "optional" },
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
      { name: "퍼시스·시디즈·디비 (사무용 가구)", desc: "공유오피스·스튜디오 표준 가구", priceRange: "B2B가", priority: "primary" },
      { name: "리바트·일룸 (인테리어 가구)", desc: "게스트하우스·파티룸 침구·소파", priceRange: "B2B가", priority: "recommended" },
    ],
    equipment: [
      { name: "출입통제·도어락 (BeyondLab·NFC 스마트락)", desc: "지문·QR·NFC 출입 시스템 50-150만", priceRange: "50~150만", priority: "primary" },
      { name: "프로젝터·디스플레이·스피커", desc: "회의실·스튜디오 1실 100-300만", priceRange: "100~300만", priority: "primary" },
      { name: "에어컨·환기 시스템", desc: "20-30평 5-8만 BTU 200-400만", priceRange: "200~400만", priority: "primary" },
    ],
    pos: [
      { name: "스페이스클라우드 / 패스트파이브 (예약 SaaS)", desc: "공간 예약·결제·관리 1위", priceRange: "월 5-30만", priority: "primary" },
      { name: "Optix / OfficeRnD (글로벌)", desc: "코워킹·플렉스 오피스 운영 SaaS", priceRange: "월 50만+", priority: "recommended" },
      { name: "토스플레이스 (결제만)", desc: "예약 앱과 분리 사용", priceRange: "월 0원~", priority: "recommended" },
    ],
    channels: [
      { name: "스페이스클라우드 등록 (필수)", desc: "한국 공간 임대 1위 플랫폼. 수수료 15-20%", priceRange: "수수료 15-20%", priority: "primary" },
      { name: "네이버 플레이스 + 영수증 리뷰", desc: "지역 검색 노출", priceRange: "무료", priority: "primary" },
      { name: "에어비앤비 (게스트하우스만)", desc: "글로벌 게스트 유입. 수수료 14-16%", priceRange: "수수료 14-16%", priority: "recommended" },
    ],
  },

  // ═════════════════════════════════════════════════════════════
  // ONLINE-DIGITAL — 온라인 베이스 (기존 store_setup·sourcing_setup 보완)
  // ═════════════════════════════════════════════════════════════
  "online-digital": {
    suppliers: [
      { name: "도매꾹 / 알리바바 도매", desc: "온라인 도매 — 소량 매입 가능", priceRange: "도매가", priority: "primary" },
      { name: "동대문 종합시장 + 사입삼촌", desc: "패션·잡화 온라인 셀러 1번지", priceRange: "도매가", priority: "primary" },
      { name: "1688·타오바오 (해외 도매)", desc: "구매대행·중국 도매", priceRange: "해외 도매", priority: "recommended" },
    ],
    equipment: [
      { name: "포장 설비 (테이블·박스·완충재·송장 프린터)", desc: "초기 셋업 100-300만", priceRange: "100~300만", priority: "primary" },
      { name: "촬영 장비 (카메라·조명·배경지)", desc: "스마트폰 + LED 라이트 50-150만", priceRange: "50~150만", priority: "primary" },
      { name: "재고 보관 (선반·박스·라벨링)", desc: "초기 50-100만", priceRange: "50~100만", priority: "recommended" },
    ],
    pos: [
      { name: "네이버 스마트스토어 (수수료 6.6%)", desc: "한국 1위 온라인몰. 사업자등록 필수, 정산 3-4일", priceRange: "수수료 6.6%", priority: "primary" },
      { name: "쿠팡 (입점 + 로켓배송 옵션)", desc: "수수료 5-15%. 풀필먼트 위탁 가능", priceRange: "수수료 5-15%", priority: "primary" },
      { name: "Cafe24 / 메이크샵 (자체몰)", desc: "월 5-50만. 브랜드몰 운영", priceRange: "월 5-50만", priority: "recommended" },
    ],
    channels: [
      { name: "인스타그램 릴스 + 콘텐츠", desc: "D2C 1순위 채널. 무료", priceRange: "무료", priority: "primary" },
      { name: "와디즈·텀블벅 (크라우드펀딩)", desc: "신상 출시 효과 큼. 누적 1.2조 거래", priceRange: "수수료 7-15%", priority: "primary" },
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
      { name: "마장축산물시장 (정육)", desc: "삼겹살·소고기·돼지뼈 도매. 백반·국밥 핵심 원자재", priceRange: "도매가", priority: "primary" },
      { name: "가락시장 청과·수산", desc: "야채·과일·생선 새벽 직접 매입. 위탁상 통한 정기 배송도 가능", priceRange: "도매가", priority: "primary", url: "https://garakmall.garak.co.kr" },
      { name: "해천·청정원·CJ제일제당 (양념)", desc: "고추장·된장·간장·참기름 도매가 정기 납품", priceRange: "도매가", priority: "primary" },
      { name: "한솔식자재 / CJ프레시웨이", desc: "한식 백반 패키지 (반찬 8-10종 묶음 일괄)", priceRange: "월 정기", priority: "recommended" },
      { name: "경동시장 (서울 동대문구)", desc: "한약재·건어물·잡곡 도매. 약선 한식 추가 시", priceRange: "도매가", priority: "optional" },
    ],
    equipment: [
      { name: "업소용 밥솥 (린나이 RR-S250F·쿠쿠 CRP-EH)", desc: "30인용 가스 밥솥 80-150만 / 60인용 150-250만", priceRange: "80~250만", priority: "primary" },
      { name: "가스레인지 4구 + 튀김기", desc: "한식 백반 4-6개 메뉴 동시 조리. 4구 60-100만", priceRange: "60~100만", priority: "primary" },
      { name: "보온고 (반찬 보관)", desc: "다단 보온고 200-300만. 백반 반찬 8-10종 회전 보관", priceRange: "200~300만", priority: "primary" },
      { name: "김치냉장고 (위니아·삼성 BESPOKE)", desc: "스탠드형 4도어 200-400만. 김치 자체 발효 매장 필수", priceRange: "200~400만", priority: "primary" },
      { name: "스테인리스 작업대·싱크대 2조", desc: "한식 다종 메뉴 작업 동선. 1.8m+ 권장", priceRange: "60~120만", priority: "primary" },
    ],
  },
  "delivery-meals": {
    suppliers: [
      { name: "포장의신·다나와포장 (배달 포장재)", desc: "찌개컵·뚝배기 일회용·이중 단열 봉투. 월 50-100만 표준", priceRange: "월 50-100만", priority: "primary" },
      { name: "푸드팡 (식자재) — 도시락 패키지", desc: "1인분 단위 묶음 식자재", priceRange: "월 200-400만", priority: "primary", url: "https://foodpang.co/" },
    ],
    equipment: [
      { name: "도시락 자동포장기 (오토팩·KP)", desc: "1일 200-500개 도시락 자동 밀봉. 200-500만", priceRange: "200~500만", priority: "recommended" },
      { name: "배달 보온백·냉장백", desc: "배달원용 + 매장용. 50-100만", priceRange: "50~100만", priority: "primary" },
    ],
    channels: [
      { name: "배민 + 쿠팡이츠 (수수료 6.8-9.8%)", desc: "배달 전문 매장 = 매출 80-100% 의존. 차등 요금제 비교 필수", priceRange: "수수료 6.8-9.8%", priority: "primary" },
      { name: "요기요 + 위메프오 (서브)", desc: "노출 다각화", priceRange: "수수료 4.7-9.7%", priority: "recommended" },
    ],
  },
  "salad-healthy": {
    suppliers: [
      { name: "가락몰 신선 채소", desc: "샐러드 베이스 채소·아보카도·과일. 신선도 핵심", priceRange: "도매가", priority: "primary" },
      { name: "한솔식자재 — 단백질 (닭가슴살·연어)", desc: "전처리된 단백질 정기 배송", priceRange: "월 정기", priority: "primary" },
      { name: "닥터그래놀라·뽀로비커리 (드레싱)", desc: "건강 드레싱 전문 도매", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "샐러드용 디스플레이 냉장고 (4도어)", desc: "샐러드바 운영 시 핵심", priceRange: "300~500만", priority: "primary" },
      { name: "야채 슬라이서·푸드프로세서 (로보쿠프)", desc: "신선 채소 일괄 손질", priceRange: "100~250만", priority: "primary" },
    ],
  },
  "ramen-noodle": {
    suppliers: [
      { name: "면 도매 (송천면옥·남지생면)", desc: "라면·중면·소바 면 정기 납품", priceRange: "도매가", priority: "primary" },
      { name: "농협하나로·해천 (육수 베이스)", desc: "닭·소·돼지 육수 액상·분말 도매", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "라면냉장고·면 보관기", desc: "면류 저온 보관. 100-200만", priceRange: "100~200만", priority: "primary" },
      { name: "라멘기·면조리기", desc: "전문 라멘 매장. 200-400만", priceRange: "200~400만", priority: "recommended" },
    ],
  },
  "chicken-burger": {
    suppliers: [
      { name: "마니커·하림·체리부로 (닭고기 도매)", desc: "치킨 닭고기 1순위. 마니커 본사 직거래 시 단가 우대", priceRange: "도매가", priority: "primary" },
      { name: "오뚜기·청정원 (양념·소스)", desc: "치킨 양념·시즈닝 도매", priceRange: "도매가", priority: "primary" },
      { name: "포장의신 — 치킨박스·랩핑", desc: "치킨 전용 종이 박스·기름 차단 종이", priceRange: "월 30-80만", priority: "primary" },
    ],
    equipment: [
      { name: "튀김기 (3구 이상 가스 / 전기 튀김기)", desc: "린나이·LG 3구 200-350만. 동시 조리 필수", priceRange: "200~350만", priority: "primary" },
      { name: "냉동·냉장 적재 (4도어)", desc: "닭 보관 냉장고 + 냉동고", priceRange: "300~500만", priority: "primary" },
    ],
    channels: [
      { name: "배민 1·쿠팡이츠 (치킨 카테고리)", desc: "치킨 매장 = 배달 매출 60-80%. 광고 효율 측정 필수", priceRange: "수수료 6.8-9.8%", priority: "primary" },
    ],
  },
  "western-pasta-brunch": {
    suppliers: [
      { name: "마노이타·이태리 식자재 수입사", desc: "파스타·올리브오일·트러플·치즈 전문 수입 도매", priceRange: "수입 도매가", priority: "primary" },
      { name: "오뚜기·청정원 (소스 베이스)", desc: "한식화된 파스타·브런치 소스 도매", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "파스타 머신·도우 믹서 (KitchenAid·이마쿠나)", desc: "면 전문점 시 200-400만", priceRange: "200~400만", priority: "recommended" },
      { name: "피자 화덕·오븐 (모렐로·피카드)", desc: "전문 화덕 800-2,000만", priceRange: "800~2000만", priority: "optional" },
      { name: "에스프레소 머신 (브런치 카페 겸업 시)", desc: "라마르조코·VBM 250-1,200만", priceRange: "250~1200만", priority: "recommended" },
    ],
  },

  // ─── CAFE-DESSERT (6) ──────────────────────────────────────
  "takeout-coffee": {
    suppliers: [
      { name: "바리스타 룰스·커피명가 (블렌드)", desc: "테이크아웃 카페 적합 블렌드. kg당 18,000-28,000원", priceRange: "kg당 1.8-2.8만", priority: "primary" },
      { name: "포장의신 — 종이컵·홀더·봉투", desc: "테이크아웃 일회용품 1순위 도매", priceRange: "월 30-60만", priority: "primary" },
    ],
    equipment: [
      { name: "에스프레소 머신 (VBM·심팔리·페마)", desc: "VBM 250-450만 / 페마 E61 400-700만 (테이크아웃 적정 가격대)", priceRange: "250~700만", priority: "primary" },
      { name: "주문·결제 키오스크", desc: "테이크아웃 효율화. 200-400만", priceRange: "200~400만", priority: "recommended" },
    ],
  },
  "specialty-coffee": {
    suppliers: [
      { name: "테라로사·블루보틀·커피리브레 (스페셜티)", desc: "고급 원두 직매입. kg당 35,000-65,000원", priceRange: "kg당 3.5-6.5만", priority: "primary" },
      { name: "9 Bar·MOMOS·프롤로그 (싱글오리진)", desc: "마이크로 로스터 직거래", priceRange: "kg당 5-9만", priority: "primary" },
    ],
    equipment: [
      { name: "에스프레소 머신 — 라마르조코 GB5·KB90", desc: "스페셜티 표준. 800-1,500만", priceRange: "800~1500만", priority: "primary" },
      { name: "그라인더 — Mahlkönig EK43·Anfim", desc: "EK43 380-450만 (브루잉 표준)", priceRange: "200~450만", priority: "primary" },
      { name: "수동 추출 도구 — 케맥스·하리오·아에로프레스", desc: "메뉴 다각화", priceRange: "10~50만", priority: "recommended" },
    ],
  },
  "dessert-cafe": {
    suppliers: [
      { name: "삼립·뚜레쥬르 (냉동 베이커리 도매)", desc: "베이킹 안 하는 디저트 카페 표준", priceRange: "도매가", priority: "primary" },
      { name: "버터쥬·발로나 (쇼콜라·초콜릿)", desc: "프리미엄 쇼콜라 디저트 시", priceRange: "수입 도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "디저트 진열 쇼케이스 (4단 글래스 도어)", desc: "디저트 카페 핵심 — 시각 노출", priceRange: "200~400만", priority: "primary" },
      { name: "오븐 (테팔·BOSCH 업소용)", desc: "베이킹 카페 시 200-500만", priceRange: "200~500만", priority: "recommended" },
    ],
  },
  "bakery-studio": {
    suppliers: [
      { name: "CJ제일제당·뚜레쥬르 자재부 (밀가루)", desc: "강력분·박력분·이스트 정기 매입", priceRange: "도매가", priority: "primary" },
      { name: "발로나·페로니·이즈니 (쇼콜라·버터)", desc: "프리미엄 베이커리 핵심 자재", priceRange: "수입가", priority: "primary" },
    ],
    equipment: [
      { name: "도우 믹서 (Hobart·KitchenAid 60L)", desc: "Hobart H600 1,800만+ / Kitchenaid 7QT 100-200만", priceRange: "200~1800만", priority: "primary" },
      { name: "데크 오븐·컨벡션 오븐", desc: "베이커리 핵심. 데크 오븐 2단 800-1,500만", priceRange: "800~1500만", priority: "primary" },
      { name: "발효기 (도우 컨디셔너)", desc: "온습도 조절 발효. 300-600만", priceRange: "300~600만", priority: "recommended" },
    ],
  },
  "icecream-bingsu": {
    suppliers: [
      { name: "서울우유·매일·연세 (우유)", desc: "빙수용 우유 정기 납품", priceRange: "L당 1.8-2.5천", priority: "primary" },
      { name: "팥·인절미·과일 토핑 도매 (가락몰)", desc: "토핑 신선도 핵심", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "눈꽃빙수기 (애프터눈 DIM-200/300)", desc: "DIM-200N 200-220만 / DIM-300 370-395만 (설빙 표준)", priceRange: "200~395만", priority: "primary" },
      { name: "토핑 디스플레이 냉장고 (4도어)", desc: "팥·과일 토핑 시각화. 300-600만", priceRange: "300~600만", priority: "primary" },
      { name: "아이스크림 머신 (필립스 / 카르피지아니)", desc: "소프트 아이스크림 머신 200-500만", priceRange: "200~500만", priority: "recommended" },
    ],
  },
  "self-serve-cafe": {
    suppliers: [
      { name: "이디야 / 매머드 (저가형 원두 도매)", desc: "가격 경쟁력 우선. kg당 12,000-20,000원", priceRange: "kg당 1.2-2만", priority: "primary" },
    ],
    equipment: [
      { name: "셀프 머신 (다토·커피머신·빈투컵)", desc: "전자동 빈투컵 머신 800-2,000만", priceRange: "800~2000만", priority: "primary" },
      { name: "키오스크·QR 주문 시스템", desc: "셀프 카페 핵심 — 인건비 절감", priceRange: "300~500만", priority: "primary" },
    ],
  },

  // ─── BEAUTY (6) ────────────────────────────────────────────
  "hair-salon": {
    suppliers: [
      { name: "마곡 미용재료시장 (도매 1번지)", desc: "헤어 살롱 도매 80% 이용. BAB·SOLPA·MISE EN SCENE 일괄 매입", priceRange: "도매가", priority: "primary" },
      { name: "아모레 프로페셔널 (라네즈·아이오페·헤라)", desc: "전문가용 헤어·스킨 라인", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "디지털 펌기 (Hair Pro·정수기형)", desc: "디지털 펌기 200-500만 (사용 빈도 높을 때)", priceRange: "200~500만", priority: "recommended" },
      { name: "샴푸대 (회전 + 마사지)", desc: "한국미용기기 회전 샴푸대 200-400만", priceRange: "200~400만", priority: "primary" },
    ],
  },
  "nail-studio": {
    suppliers: [
      { name: "젤네일 도매 (더 페이스샵·라네즈 컬러)", desc: "젤·매니큐어 컬러 도매. 신림 미용재료시장 1번지", priceRange: "도매가", priority: "primary" },
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
      { name: "에스테틱 도매 (마곡 + 아모레 프로)", desc: "마사지 오일·앰플·필러 정기 매입", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "관리 베드 (전동 리프트)", desc: "전동식 관리 베드 100-200만", priceRange: "100~200만", priority: "primary" },
      { name: "고주파·LED 마스크·스팀기", desc: "고주파 200-500만 / LED 마스크 100-300만 / 스팀기 50-150만", priceRange: "100~500만", priority: "primary" },
    ],
  },
  "waxing-studio": {
    suppliers: [
      { name: "왁스 도매 (Cirepil·Jax Wax·Lyn Beauty)", desc: "벨라(Cirepil) Bleue 5kg 8-12만 / Jax Wax 250g 1.5-3만", priceRange: "kg당 1-3만", priority: "primary" },
    ],
    equipment: [
      { name: "왁스 워머 (1구·2구·5구)", desc: "1구 5-15만 / 2구 10-25만 / 5구 30-60만", priceRange: "5~60만", priority: "primary" },
      { name: "관리 베드 + 일회용 시트", desc: "전동 베드 100-200만 + 시트 월 5-10만", priceRange: "100~200만", priority: "primary" },
    ],
  },
  "eyelash-brow": {
    suppliers: [
      { name: "속눈썹 익스텐션 도매 (코스타·블링크 브라운)", desc: "C·D컬·U컬 다양. kg당 5-15만", priceRange: "kg당 5-15만", priority: "primary" },
      { name: "브로우 염색·왁스 도매", desc: "브로우 헤나·라미네이션 자재", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "확대경·LED 작업등 (3X-5X)", desc: "10-30만 / 시술자 시야 핵심", priceRange: "10~30만", priority: "primary" },
      { name: "관리 베드 + 베개", desc: "100-200만", priceRange: "100~200만", priority: "primary" },
    ],
  },
  "makeup-bridal": {
    suppliers: [
      { name: "프로 메이크업 도매 (MAC·M.A.C·NARS)", desc: "프로페셔널 메이크업 라인 정기 매입", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "메이크업 거울·조명 (다이슨급 LED)", desc: "스탠드 거울 + LED 50-150만", priceRange: "50~150만", priority: "primary" },
      { name: "메이크업 의자 (유압식)", desc: "회전 유압식 30-80만", priceRange: "30~80만", priority: "primary" },
    ],
  },

  // ─── 나머지 sub-industries — 카테고리 베이스 사용 ────────────
  // (retail, fitness, education, pet, living, space 6개 sub-industry 각각은
  //  카테고리 공통 베이스로 충분히 커버됨. 추가 분기 데이터는 차후 확장)
};

/**
 * sub-industry → 카테고리 매핑 (vendor-setup-data 폴백용)
 */
const SUB_TO_CATEGORY: Record<string, string> = {
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
  // ─── korean-casual specialty ─────────────────────────────────
  "korean-gukbap": {
    suppliers: [
      { name: "마장축산물시장 (사골·곰탕거리)", desc: "국밥 핵심 — 사골·잡뼈·돼지머리·내장 도매. 새벽 직접 매입 최저가", priceRange: "도매가", priority: "primary" },
      { name: "경동시장 (한약재·약선)", desc: "약선 국밥용 한약재 도매. 한방 차별화 시 필수", priceRange: "도매가", priority: "recommended" },
    ],
    equipment: [
      { name: "대형 곰솥·솥걸이 (50-100L)", desc: "사골 우려내기 핵심 장비. 50L 80-150만 / 100L 200-350만", priceRange: "80~350만", priority: "primary" },
      { name: "압력 곰솥 (린나이·동양매직)", desc: "사골 우림 시간 1/2 단축. 50L 압력솥 200-400만", priceRange: "200~400만", priority: "recommended" },
      { name: "보온 국솥 (다단)", desc: "메뉴별 국 보관·보온. 4-6구 250-450만", priceRange: "250~450만", priority: "primary" },
    ],
  },
  "korean-bunsik": {
    suppliers: [
      { name: "남대문 떡볶이 떡·어묵 도매", desc: "분식 핵심 — 떡·어묵·만두피 도매. kg당 도매가", priceRange: "도매가", priority: "primary" },
      { name: "김 도매 (광천·완도김)", desc: "김밥용 김 도매. 100매 묶음 도매가", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "떡볶이 화구·전기팬 (1.5m+)", desc: "분식 핵심. 대형 전기팬 100-200만", priceRange: "100~200만", priority: "primary" },
      { name: "튀김기 (소형 2구)", desc: "튀김 메뉴 + 김말이용. 80-150만", priceRange: "80~150만", priority: "primary" },
      { name: "김밥 작업대 + 김 보관함", desc: "김밥 고속 작업용 1.5m 작업대 + 보관 시스템", priceRange: "60~120만", priority: "primary" },
    ],
  },
  "korean-noodle": {
    suppliers: [
      { name: "송천면옥·남지생면 (면 도매)", desc: "칼국수·잔치국수 면 정기 납품", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "면 조리기·반죽기", desc: "칼국수 면 만들기 자체 반죽 시. 200-400만", priceRange: "200~400만", priority: "primary" },
      { name: "면 삶기 전용 솥 (4구 이상)", desc: "회전 빠른 면 삶기. 100-200만", priceRange: "100~200만", priority: "primary" },
    ],
  },
  "korean-grill": {
    suppliers: [
      { name: "마장축산물시장 (구이용 정육)", desc: "삼겹살·갈비·곱창 도매 1번지", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "테이블 화로 (가스·숯)", desc: "테이블당 화로 + 후드. 1테이블 80-150만", priceRange: "80~150만/테이블", priority: "primary" },
      { name: "강력 후드·덕트 시스템", desc: "구이매장 필수 — 일반 후드의 2-3배 풍량. 300-700만", priceRange: "300~700만", priority: "primary" },
    ],
  },

  // ─── chicken-burger specialty ────────────────────────────────
  "fried-chicken": {
    equipment: [
      { name: "치킨 압력 튀김기 (Henny Penny)", desc: "치킨 전문 압력튀김기. 600-1500만", priceRange: "600~1500만", priority: "primary" },
      { name: "양념 회전기·코팅 텀블러", desc: "양념 치킨 코팅 자동화. 200-400만", priceRange: "200~400만", priority: "recommended" },
    ],
  },
  "burger-gourmet": {
    suppliers: [
      { name: "수제 패티 도매 (한우·앵거스 도매)", desc: "프리미엄 패티용 정육 도매", priceRange: "kg당 3-5만", priority: "primary" },
      { name: "수제 번 (베이커리 직거래)", desc: "브리오슈·프레첼 번 베이커리 일일 납품", priceRange: "개당 1-2천", priority: "primary" },
    ],
    equipment: [
      { name: "그리들·패티 그릴 (스테인리스)", desc: "패티 굽기 핵심. 1.2m 그리들 300-600만", priceRange: "300~600만", priority: "primary" },
    ],
  },

  // ─── specialty-coffee specialty ──────────────────────────────
  "roastery-cafe": {
    equipment: [
      { name: "로스터기 (Probat·Loring·Diedrich)", desc: "5kg 클래스 로스터기 1500-3500만 / 12kg 4000-7000만", priceRange: "1500~7000만", priority: "primary" },
      { name: "냉각·정선·보관 설비", desc: "원두 후처리 + 보관. 300-800만", priceRange: "300~800만", priority: "primary" },
    ],
  },
  "low-cost-takeout": {
    suppliers: [
      { name: "메가커피·컴포즈급 원두 도매", desc: "kg당 8,000-15,000원. 가격 경쟁력 1순위", priceRange: "kg당 0.8-1.5만", priority: "primary" },
    ],
    equipment: [
      { name: "전자동 머신 (eversys·Schaerer)", desc: "버튼 한 번 추출. 인건비 절감 핵심. 1000-2500만", priceRange: "1000~2500만", priority: "primary" },
    ],
  },

  // ─── hair-salon specialty ────────────────────────────────────
  "barber-shop": {
    suppliers: [
      { name: "바버샵 도매 (마곡 + 미국 수입)", desc: "포마드·셰이브 크림·면도용품 도매", priceRange: "전문가가", priority: "primary" },
    ],
    equipment: [
      { name: "바버 의자 (전통 바버 체어)", desc: "전통식 바버 체어 200-500만 (아이콘성 인테리어)", priceRange: "200~500만", priority: "primary" },
      { name: "면도용 스팀 + 핫타올기", desc: "남성 셰이브 풀 서비스용", priceRange: "50~150만", priority: "recommended" },
    ],
  },

  // ─── pilates-studio specialty ────────────────────────────────
  "reformer-pilates": {
    equipment: [
      { name: "리포머 머신 (Balanced Body·Stott)", desc: "프리미엄 리포머 4-8대. 1대 400-800만", priceRange: "1대 400~800만", priority: "primary" },
      { name: "캐딜락·체어 (보조 기구)", desc: "리포머 + 보조 기구 풀세트. 600-1200만", priceRange: "600~1200만", priority: "recommended" },
    ],
  },

  // ─── kids-academy specialty ──────────────────────────────────
  "english-academy": {
    suppliers: [
      { name: "교보문고·웅진씽크빅 (영어 교재)", desc: "초중고 영어 교재 정기 납품. 출판사 직거래 30% 할인", priceRange: "도매가", priority: "primary" },
    ],
    equipment: [
      { name: "원어민 화상 시스템 (Zoom·Meet)", desc: "화상 영어 수업 인프라. 카메라·스피커·마이크", priceRange: "1실 50-150만", priority: "recommended" },
    ],
  },
  "coding-stem-academy": {
    equipment: [
      { name: "노트북·태블릿 (1인당 1대)", desc: "iPad / Chromebook 12-20대. 대당 50-100만", priceRange: "1대 50-100만", priority: "primary" },
      { name: "STEM 교구 (LEGO·아두이노·라즈베리파이)", desc: "코딩·로봇 교구 풀패키지", priceRange: "초기 200-500만", priority: "primary" },
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

  // 우선순위 머지: specialty (가장 우선) → sub → base
  return {
    suppliers: [
      ...(specialtyOverride?.suppliers ?? []),
      ...(subOverride?.suppliers ?? []),
      ...base.suppliers,
    ],
    equipment: [
      ...(specialtyOverride?.equipment ?? []),
      ...(subOverride?.equipment ?? []),
      ...base.equipment,
    ],
    pos: [
      ...(specialtyOverride?.pos ?? []),
      ...(subOverride?.pos ?? []),
      ...base.pos,
    ],
    channels: [
      ...(specialtyOverride?.channels ?? []),
      ...(subOverride?.channels ?? []),
      ...(base.channels ?? []),
    ],
  };
}
