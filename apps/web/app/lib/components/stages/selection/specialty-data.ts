/**
 * Specialty 매핑 — 세부업종(industry) → 더 구체적인 specialty 옵션.
 *
 * 사용자 피드백 (2026-05-04): "한식/캐주얼을 골라도 국밥집인지 한정식인지 알아야 한다."
 * → industry 선택 후 specialty 단계 1개 추가.
 *
 * `selectedSpecialtyId` 는 이미 profile-store 에 정의됨 + vendor-setup-data 도 specialty 활용.
 *
 * 데이터: 한국 시장 실 구분 기준 (외식·소매·뷰티·피트니스·교육·펫·생활서비스·공간임대·온라인·스타트업).
 */

export type SpecialtyOption = {
  /** specialty ID — kebab-case */
  id: string;
  /** 한국어 라벨 */
  label: string;
  /** 한 줄 부연 설명 */
  desc: string;
  /** 영어 라벨 (선택) */
  labelEn?: string;
};

export const SPECIALTY_BY_INDUSTRY: Record<string, SpecialtyOption[]> = {
  // ── 외식업 ────────────────────────────────────────────────
  "korean-casual": [
    { id: "korean-gukbap", label: "국밥·해장국 전문점", desc: "순대국·돼지국밥·콩나물국밥 등 단일 메뉴 회전율 높음", labelEn: "Gukbap / hangover stew" },
    { id: "korean-hanjeongsik", label: "한정식·코스 한식", desc: "한 상 차림 / 코스 / 객단가 높은 정식", labelEn: "Korean course (Hanjeongsik)" },
    { id: "korean-baekban", label: "백반·가정식 한식", desc: "직장인 점심 백반 / 반찬 다양", labelEn: "Baekban / home-style" },
    { id: "korean-bunsik", label: "분식·김밥집", desc: "김밥·떡볶이·라면 — 객단가 낮고 회전율 높음", labelEn: "Korean snacks (Bunsik)" },
    { id: "korean-bibimbap", label: "비빔밥·덮밥 전문점", desc: "단일 카테고리 + 토핑 옵션 — 배달 강세", labelEn: "Bibimbap / rice bowl" },
    { id: "korean-pork-belly", label: "고깃집·삼겹살", desc: "삼겹살·돼지갈비 — 저녁 메인, 직원 다인원 필요", labelEn: "Korean BBQ" },
  ],
  "delivery-meals": [
    { id: "delivery-korean-lunch", label: "한식 도시락 전문", desc: "기업·단체 한식 도시락 정기 납품 가능", labelEn: "Korean bento" },
    { id: "delivery-diet-meal", label: "다이어트 도시락", desc: "고단백·저칼로리 — 정기 구독 모델", labelEn: "Diet meal box" },
    { id: "delivery-bulk-catering", label: "단체 도시락·케이터링", desc: "기업 회의·행사 — 50~200인분 단위", labelEn: "Bulk catering" },
    { id: "delivery-premium", label: "프리미엄 가정식", desc: "마켓컬리·쿠팡 정기 배송 또는 자체몰", labelEn: "Premium home meals" },
  ],
  "salad-healthy": [
    { id: "salad-bowl", label: "샐러드 전문점", desc: "토핑 커스텀 샐러드 / 포케 — 점심 객단가 1.2만~1.8만", labelEn: "Salad shop" },
    { id: "salad-poke-grain", label: "포케·그레인볼", desc: "하와이안 포케·곡물 베이스 그레인볼", labelEn: "Poke / grain bowl" },
    { id: "salad-vegan", label: "비건·플랜트베이스", desc: "100% 식물성 — 차별화 strong, 단가 ↑", labelEn: "Vegan / plant-based" },
    { id: "salad-juice-cleanse", label: "주스·클렌즈 전문", desc: "콜드프레스 주스·1일 클렌즈 패키지", labelEn: "Juice / cleanse" },
  ],
  "ramen-noodle": [
    { id: "ramen-japanese", label: "일본 라멘 전문", desc: "돈코츠·미소·쇼유 — 직접 육수 제조 필수", labelEn: "Japanese ramen" },
    { id: "noodle-kalguksu", label: "칼국수·만둣국", desc: "수제 면 + 닭·해물 — 한국식 면 요리", labelEn: "Kalguksu / mandu" },
    { id: "noodle-udon", label: "우동·소바 전문", desc: "일본식 우동·소바 — 점심 회전율 모델", labelEn: "Udon / soba" },
    { id: "noodle-pho", label: "쌀국수·아시안 면", desc: "베트남 쌀국수·태국 팟타이", labelEn: "Pho / Asian noodles" },
    { id: "noodle-jjajang", label: "중식 면·짜장면", desc: "짜장·짬뽕·탕수육 — 배달 강세", labelEn: "Chinese noodles" },
  ],
  "chicken-burger": [
    { id: "fb-chicken", label: "치킨 전문점", desc: "프라이드·양념·간장·로제 — 야간 배달 핵심", labelEn: "Chicken shop" },
    { id: "fb-pizza", label: "피자 전문점", desc: "프리미엄 피자·미국식 피자 — 가족 단위", labelEn: "Pizza" },
    { id: "fb-burger", label: "수제 햄버거 전문", desc: "프리미엄 패티 + 사이드 — 객단가 1.2만~1.8만", labelEn: "Premium burger" },
    { id: "fb-hotdog", label: "핫도그·코로케 전문", desc: "스트리트 푸드 — 회전율·테이크아웃", labelEn: "Hotdog / korroke" },
    { id: "fb-fried-chicken-bites", label: "닭강정·치킨 핑거 푸드", desc: "포장·테이크아웃 + 분식 hybrid", labelEn: "Korean fried chicken" },
  ],
  "western-pasta-brunch": [
    { id: "fb-pasta", label: "파스타·이탈리안", desc: "파스타·리조또·전식 — 디너 객단가 ↑", labelEn: "Pasta / Italian" },
    { id: "fb-steak", label: "스테이크하우스", desc: "프리미엄 스테이크 — 와인·디저트 객단가 5만+", labelEn: "Steakhouse" },
    { id: "fb-brunch", label: "브런치 카페", desc: "에그베네딕트·아보카도토스트 — 주말 강세", labelEn: "Brunch" },
    { id: "fb-mexican", label: "멕시칸·타코 전문", desc: "타코·부리또·퀘사디아 — 캐주얼", labelEn: "Mexican / taco" },
    { id: "fb-izakaya", label: "이자카야·사케 바", desc: "안주 + 사케·하이볼 — 야간 술 매출", labelEn: "Izakaya" },
  ],

  // ── 카페·디저트 ───────────────────────────────────────────
  "takeout-coffee": [
    { id: "coffee-low-price", label: "저가 커피 (메가·컴포즈 등)", desc: "1,500원 라떼 — 회전율 100명/일+", labelEn: "Low-price coffee" },
    { id: "coffee-franchise", label: "프랜차이즈 커피", desc: "스타벅스·이디야·투썸 — 가맹비·로열티", labelEn: "Franchise coffee" },
    { id: "coffee-local-mid", label: "동네 카페 (중가)", desc: "독립 운영 + 시그니처 — 단골 모델", labelEn: "Local mid-tier cafe" },
  ],
  "specialty-coffee": [
    { id: "coffee-roastery", label: "로스터리 카페", desc: "직접 로스팅 + 원두 도매 부가 매출", labelEn: "Roastery" },
    { id: "coffee-handdrip", label: "핸드드립·필터 전문", desc: "싱글 오리진·드립 바 — 객단가 ↑", labelEn: "Hand-drip" },
    { id: "coffee-coldbrew", label: "콜드브루·보틀커피", desc: "온라인몰 병행 — 정기 구독 가능", labelEn: "Cold brew bottled" },
  ],
  "dessert-cafe": [
    { id: "dessert-cake-shop", label: "케이크 전문점", desc: "생크림·치즈·시즌 케이크 — 예약·픽업 모델", labelEn: "Cake shop" },
    { id: "dessert-macaron", label: "마카롱·뺑오쇼콜라", desc: "프랑스 디저트 — 인스타 비주얼 강세", labelEn: "Macaron / pastry" },
    { id: "dessert-tart", label: "타르트·파이 전문", desc: "과일 타르트·치즈 타르트 — 시즌 메뉴", labelEn: "Tart / pie" },
    { id: "dessert-traditional", label: "한과·약과·전통 디저트", desc: "흑임자·약과·인절미 — Z세대 트렌드", labelEn: "Korean traditional" },
  ],
  "bakery-studio": [
    { id: "bakery-bread", label: "식빵·잡빵 전문", desc: "식빵·바게트·소금빵 — 일 회전율 모델", labelEn: "Bread shop" },
    { id: "bakery-pastry", label: "페이스트리·크루아상", desc: "버터 페이스트리 — 시간 단위 굽기", labelEn: "Pastry" },
    { id: "bakery-natural-yeast", label: "천연발효종 베이커리", desc: "사워도우·천연효모 — 프리미엄 단가", labelEn: "Natural yeast" },
  ],
  "icecream-bingsu": [
    { id: "ice-bingsu", label: "빙수 전문점", desc: "팥빙수·과일빙수 — 여름 시즌 강세", labelEn: "Korean shaved ice" },
    { id: "ice-icecream", label: "수제 아이스크림", desc: "젤라또·소프트 — 사계절 운영 가능", labelEn: "Artisan ice cream" },
    { id: "ice-self-serve", label: "무인 아이스크림 24시", desc: "무인 매장 + CCTV — 인건비 0", labelEn: "Unmanned ice cream" },
  ],
  "self-serve-cafe": [
    { id: "cafe-unmanned-24", label: "무인 카페 24시", desc: "무인 키오스크 + 셀프 머신 — 야간 매출", labelEn: "Unmanned 24h cafe" },
    { id: "cafe-shared-space", label: "스터디 카페·공유 카페", desc: "시간 단위 결제 + 음료 무제한 hybrid", labelEn: "Study/share cafe" },
  ],

  // ── 뷰티 ──────────────────────────────────────────────────
  "hair-salon": [
    { id: "hair-general", label: "일반 미용실", desc: "컷·펌·염색 풀서비스 — 디자이너 다수", labelEn: "Full-service salon" },
    { id: "hair-cut-only", label: "컷 전문점", desc: "1만원 컷 — 회전율·블루클럽 모델", labelEn: "Cut-only shop" },
    { id: "hair-color-perm", label: "펌·염색 전문", desc: "고가 펌·하이라이트 — 디자이너 1:1", labelEn: "Perm / color specialist" },
  ],
  "nail-studio": [
    { id: "nail-art", label: "네일아트 전문", desc: "젤·아크릴·연장 — 디자인 단가 ↑", labelEn: "Nail art" },
    { id: "nail-quick", label: "퀵 젤·홈케어", desc: "30분 젤 — 회전율 모델", labelEn: "Quick gel" },
    { id: "nail-pedicure", label: "페디큐어·발관리", desc: "발관리 hybrid — 여름 강세", labelEn: "Pedicure" },
  ],
  "skin-care-room": [
    { id: "skin-esthetic", label: "에스테틱 (얼굴 관리)", desc: "기본 관리·딥클렌징 — 회원제 모델", labelEn: "Esthetic" },
    { id: "skin-massage", label: "전신 마사지·바디", desc: "스웨디시·아로마 — 1회 60~90분", labelEn: "Body massage" },
    { id: "skin-acne-clinic", label: "여드름·트러블 전문", desc: "성인 여드름·등 트러블 — 회원제", labelEn: "Acne clinic" },
  ],
  "waxing-studio": [
    { id: "waxing-brazilian", label: "브라질리언 왁싱", desc: "비키니 라인 — 프라이빗 룸 필수", labelEn: "Brazilian wax" },
    { id: "waxing-partial", label: "부분 왁싱 (다리·팔)", desc: "여름 시즌 강세 — 30분 단위", labelEn: "Partial wax" },
  ],
  "eyelash-brow": [
    { id: "lash-extension", label: "속눈썹 연장 전문", desc: "1:1·1:N·러시안 — 2시간 단위", labelEn: "Eyelash extension" },
    { id: "brow-tattoo", label: "눈썹 반영구·문신", desc: "반영구 메이크업 — 단가 25~50만원", labelEn: "Brow tattoo" },
  ],
  "makeup-bridal": [
    { id: "makeup-general", label: "일반 메이크업", desc: "행사·증명사진 — 시간 단위", labelEn: "General makeup" },
    { id: "makeup-bridal", label: "웨딩 메이크업", desc: "신부 본식·리허설 — 패키지 50~150만원", labelEn: "Bridal makeup" },
    { id: "makeup-self-class", label: "셀프 메이크업 클래스", desc: "1:1·그룹 클래스 — 교육 매출 모델", labelEn: "Makeup class" },
  ],

  // ── 피트니스 ──────────────────────────────────────────────
  "pilates-studio": [
    { id: "pilates-group", label: "그룹 필라테스", desc: "8~12명 그룹 수업 — 회원제", labelEn: "Group pilates" },
    { id: "pilates-private", label: "1:1 필라테스 PT", desc: "1:1 리포머 — 단가 8~15만원/회", labelEn: "1:1 reformer pilates" },
    { id: "pilates-reformer", label: "리포머 전문 스튜디오", desc: "리포머·체어·바렐 — 풀 장비", labelEn: "Reformer studio" },
  ],
  "pt-gym": [
    { id: "pt-personal", label: "1:1 퍼스널 트레이닝", desc: "회당 5~10만원 — 트레이너 1~3명", labelEn: "1:1 PT" },
    { id: "pt-gym-pt-hybrid", label: "헬스장 + PT hybrid", desc: "월 회비 + PT 추가 — 가장 일반적", labelEn: "Gym + PT" },
    { id: "pt-unmanned-24", label: "무인 24시 헬스장", desc: "키카드 출입 + CCTV — 인건비 ↓", labelEn: "Unmanned 24h gym" },
  ],
  "yoga-studio": [
    { id: "yoga-general", label: "일반 요가", desc: "하타·빈야사·아쉬탕가 — 그룹 수업", labelEn: "General yoga" },
    { id: "yoga-hot", label: "핫요가·바이크람", desc: "고온 스튜디오 — 시설비 ↑, 차별화", labelEn: "Hot yoga" },
    { id: "yoga-meditation", label: "명상·요가 hybrid", desc: "MZ 세대 트렌드 — 명상 클래스 부가", labelEn: "Meditation+yoga" },
  ],
  "crossfit-box": [
    { id: "crossfit-box", label: "크로스핏 박스", desc: "공식 affiliate — 박스 단위", labelEn: "CrossFit box" },
    { id: "fitness-hiit", label: "HIIT·고강도 인터벌", desc: "20~40분 그룹 — 회원제", labelEn: "HIIT" },
  ],

  // ── 교육 ──────────────────────────────────────────────────
  "language-academy": [
    { id: "edu-english", label: "영어 학원", desc: "성인 회화·토익·유학 — 가장 큰 시장", labelEn: "English academy" },
    { id: "edu-japanese-chinese", label: "일본어·중국어", desc: "JLPT·HSK 시험 대비 + 회화", labelEn: "JP/CN academy" },
    { id: "edu-kids-language", label: "어린이·청소년 영어", desc: "초등·중학 영어 — 학부모 시장", labelEn: "Kids English" },
  ],
  "coding-class": [
    { id: "edu-coding-kids", label: "어린이 코딩 클래스", desc: "스크래치·파이썬 — SW 의무 교육 트렌드", labelEn: "Kids coding" },
    { id: "edu-coding-adult", label: "성인 코딩·부트캠프", desc: "프론트·백엔드·AI — 취업 연계", labelEn: "Adult coding bootcamp" },
  ],
  "small-study-room": [
    { id: "edu-private-tutor", label: "1:1 과외방", desc: "수학·영어 1:1 — 학부모 신뢰 모델", labelEn: "1:1 tutor" },
    { id: "edu-small-group", label: "소규모 공부방 (3~5명)", desc: "정원 제한 + 개인 진도", labelEn: "Small group academy" },
  ],
  "study-room": [
    { id: "edu-meeting-room", label: "스터디룸·회의실", desc: "시간 단위 대여 — 학생·직장인 mix", labelEn: "Study/meeting room" },
  ],
  "study-cafe-space": [
    { id: "edu-study-cafe", label: "스터디 카페", desc: "음료·간식 + 공부 공간 hybrid", labelEn: "Study cafe" },
    { id: "edu-unmanned-study", label: "무인 24시 스터디 카페", desc: "QR 출입 + CCTV — 인건비 0", labelEn: "Unmanned 24h study" },
  ],

  // ── 펫 ────────────────────────────────────────────────────
  "pet-grooming": [
    { id: "pet-grooming-general", label: "강아지·고양이 미용", desc: "전체 미용·부분 — 자격증 필수", labelEn: "Pet grooming" },
    { id: "pet-grooming-spa", label: "프리미엄 스파·아로마", desc: "마사지·에센스 — 객단가 ↑", labelEn: "Pet spa" },
  ],
  "pet-hotel": [
    { id: "pet-daycare", label: "펫 데이케어 (낮 보육)", desc: "출퇴근 시간대 — 보호자 직장인", labelEn: "Pet daycare" },
    { id: "pet-hotel-overnight", label: "펫호텔 (1박+)", desc: "여행·출장 — 1박 5~15만원", labelEn: "Pet hotel" },
  ],
  "pet-training-school": [
    { id: "pet-training-basic", label: "강아지 행동 교정", desc: "기본 훈련·문제행동 교정", labelEn: "Pet training" },
    { id: "pet-training-puppy", label: "퍼피 클래스 (사회화)", desc: "어린 강아지 사회화·기본 훈련", labelEn: "Puppy class" },
  ],
  "pet-walking-visit": [
    { id: "pet-walking", label: "산책·방문 케어", desc: "방문형 — 직장인 보호자 시장", labelEn: "Pet walk/visit" },
  ],

  // ── 소매 ──────────────────────────────────────────────────
  "convenience-small": [
    { id: "retail-cvs", label: "편의점 (프랜차이즈)", desc: "GS25·CU·세븐일레븐 — 가맹", labelEn: "Convenience store" },
    { id: "retail-mini-market", label: "동네 슈퍼·미니마트", desc: "독립 운영 — 단골 시장", labelEn: "Local mini-market" },
  ],
  "lifestyle-goods": [
    { id: "retail-lifestyle-shop", label: "라이프스타일 편집샵", desc: "큐레이션 — 객단가 + 인스타 비주얼", labelEn: "Lifestyle select shop" },
    { id: "retail-perfume-candle", label: "향수·캔들 전문", desc: "조향·시그니처 — 선물 수요", labelEn: "Perfume / candle" },
    { id: "retail-stationery", label: "문구·소품 전문", desc: "디자인 문구 — Z세대 시장", labelEn: "Stationery / goods" },
  ],
  "beauty-supplies": [
    { id: "retail-cosmetics", label: "화장품 매장", desc: "올리브영·세포라 또는 독립 — 마진 10~30%", labelEn: "Cosmetics shop" },
    { id: "retail-haircare", label: "헤어케어·살롱 제품", desc: "프로 제품 + 미용실 도매", labelEn: "Haircare retail" },
  ],
  "fashion-accessories": [
    { id: "retail-fashion", label: "의류 편집샵", desc: "브랜드 모음 — 시즌별 진열", labelEn: "Fashion select" },
    { id: "retail-vintage", label: "빈티지·구제 의류", desc: "Z세대 트렌드 — 단가 분산", labelEn: "Vintage clothing" },
    { id: "retail-accessories", label: "액세서리·주얼리", desc: "선물 수요 + 결혼식 시즌", labelEn: "Accessories" },
  ],
  "health-food-store": [
    { id: "retail-supplements", label: "건강기능식품 매장", desc: "프로바이오틱스·콜라겐 — 중장년 시장", labelEn: "Health supplements" },
    { id: "retail-organic", label: "비건·유기농 마켓", desc: "유기농 식품 + 비건 카테고리", labelEn: "Organic / vegan market" },
  ],
  "unmanned-retail": [
    { id: "retail-unmanned-icecream", label: "무인 아이스크림", desc: "24시 + 키오스크 + CCTV", labelEn: "Unmanned ice cream" },
    { id: "retail-unmanned-mealkit", label: "무인 밀키트·식자재", desc: "냉장 자판기 + 무인 결제", labelEn: "Unmanned mealkit" },
    { id: "retail-unmanned-stationery", label: "무인 문구·잡화", desc: "학교 근처 + 24시 — 학생 시장", labelEn: "Unmanned stationery" },
  ],

  // ── 생활서비스 ───────────────────────────────────────────
  "self-laundry": [
    { id: "ls-self-laundry", label: "무인 셀프 빨래방", desc: "동전·QR 결제 + 24시 + CCTV", labelEn: "Self laundry 24h" },
  ],
  "laundry-service": [
    { id: "ls-laundry-shop", label: "세탁편의점 (수거·배송)", desc: "방문 수거 + 익일 배송 모델", labelEn: "Laundry pickup" },
    { id: "ls-dry-cleaning", label: "드라이클리닝 전문", desc: "정장·코트 — 시즌 강세", labelEn: "Dry cleaning" },
  ],
  "cleaning-service": [
    { id: "ls-home-cleaning", label: "가정 청소 (방문)", desc: "주 1~4회 — 직장인 가구 시장", labelEn: "Home cleaning" },
    { id: "ls-office-cleaning", label: "사무실·매장 청소", desc: "B2B 정기 계약 — 야간 작업", labelEn: "Office cleaning" },
    { id: "ls-move-cleaning", label: "이사·입주 청소", desc: "1회성 고가 — 이사 시즌 강세", labelEn: "Move-in cleaning" },
  ],
  "repair-service": [
    { id: "ls-appliance-repair", label: "가전·세탁기 수리", desc: "방문 수리 — 부품 재고 핵심", labelEn: "Appliance repair" },
    { id: "ls-tailoring", label: "의류 수선·리폼", desc: "동네 수선·바지 줄임", labelEn: "Tailoring" },
  ],
  "print-copy": [
    { id: "ls-print-shop", label: "인쇄·복사 전문", desc: "학생·직장인 시장 — 시험 시즌 강세", labelEn: "Print / copy shop" },
    { id: "ls-print-package", label: "인쇄 + 택배 hybrid", desc: "프린트 + 편의점 택배 결합", labelEn: "Print + delivery" },
  ],
  "device-repair": [
    { id: "ls-phone-repair", label: "휴대폰 액정·배터리 수리", desc: "iPhone·갤럭시 — 액정 수리 핵심", labelEn: "Phone repair" },
    { id: "ls-pc-repair", label: "PC·노트북 수리", desc: "학생·직장인 — 데이터 복구 부가", labelEn: "PC repair" },
  ],

  // ── 공간/숙박 ─────────────────────────────────────────────
  "rental-studio": [
    { id: "space-photo-studio", label: "사진·영상 스튜디오", desc: "조명·배경지 + 시간 단위 대여", labelEn: "Photo studio rental" },
    { id: "space-self-studio", label: "셀프 사진관 (인생네컷+)", desc: "무인 + 즉석 인쇄 — Z세대", labelEn: "Self photo booth" },
  ],
  "party-room": [
    { id: "space-party-room", label: "파티룸·생일 모임", desc: "스피커·노래방 + 일회용품", labelEn: "Party room" },
    { id: "space-rooftop", label: "루프탑·테라스 공간", desc: "야경·바베큐 — 여름 강세", labelEn: "Rooftop space" },
  ],
  "shared-office": [
    { id: "space-coworking", label: "공유 오피스 (월 단위)", desc: "1인 오피스·회의실 — 프리랜서·스타트업", labelEn: "Coworking" },
    { id: "space-virtual-office", label: "사업자등록 가능 가상 오피스", desc: "주소만 — 법적 등록 가능", labelEn: "Virtual office" },
  ],
  "practice-room": [
    { id: "space-music-practice", label: "악기·합주 연습실", desc: "방음 + 악기 — 시간 단위", labelEn: "Music practice" },
    { id: "space-vocal-practice", label: "보컬·녹음 연습실", desc: "마이크·녹음 — 가수 지망생", labelEn: "Vocal / recording" },
  ],

  // ── 온라인·디지털 ────────────────────────────────────────
  // (smart-store / digital-products / creator-service / consignment-commerce /
  //  newsletter-membership / global-buying — 카테고리별 분기는 BusinessModel 단계에서.)

  // ── 스타트업 ─────────────────────────────────────────────
  // 키 이름은 starter-data.ts 의 industry option id 와 1:1 일치해야 함 (2026-05-04 audit).
  "ai-application": [
    { id: "su-ai-chatbot", label: "AI 챗봇·상담 자동화", desc: "GPT 기반 챗봇 — B2B 매출", labelEn: "AI chatbot" },
    { id: "su-ai-content", label: "AI 콘텐츠·카피 SaaS", desc: "마케팅 카피·이미지 생성", labelEn: "AI content" },
    { id: "su-ai-vertical", label: "버티컬 AI (특정 산업)", desc: "법률·의료·교육 등 산업 특화", labelEn: "Vertical AI" },
  ],
  "fintech-startup": [
    { id: "su-fintech-payment", label: "결제·송금 핀테크", desc: "PG·간편송금 — 라이선스 필요", labelEn: "Payment fintech" },
    { id: "su-fintech-investment", label: "투자·자산관리", desc: "로보어드바이저·증권 API", labelEn: "Investment fintech" },
  ],
  "healthtech-startup": [
    { id: "su-health-app", label: "건강·운동 앱", desc: "B2C 구독 모델", labelEn: "Health/fitness app" },
    { id: "su-medtech-device", label: "의료기기·하드웨어", desc: "MFDS 인증 — Class II/III", labelEn: "Medical device" },
  ],
  "creator-service": [
    { id: "su-creator-tools", label: "크리에이터 툴·에디터", desc: "영상·썸네일 자동화", labelEn: "Creator tools" },
    { id: "su-creator-marketplace", label: "크리에이터 매칭·MCN", desc: "광고주-크리에이터 매칭", labelEn: "Creator marketplace" },
  ],
  "semiconductor": [
    { id: "su-semi-fabless", label: "팹리스 (설계 전문)", desc: "TSMC·삼성 파운드리 활용", labelEn: "Fabless" },
    { id: "su-semi-design-tool", label: "EDA·설계 툴", desc: "반도체 설계 자동화 SW", labelEn: "EDA tool" },
  ],
  "biotech-medtech": [
    { id: "su-bio-drug", label: "신약·바이오 의약품", desc: "임상 1~3상 — 식약처·FDA", labelEn: "Drug development" },
    { id: "su-bio-diagnostic", label: "체외진단·진단키트", desc: "MFDS Class II/III", labelEn: "Diagnostic" },
  ],
  "climate-energy": [
    { id: "su-climate-renewable", label: "재생에너지·태양광", desc: "B2B·B2G 사업", labelEn: "Renewable energy" },
    { id: "su-climate-battery", label: "배터리·ESS", desc: "EV·ESS 셀·BMS", labelEn: "Battery / ESS" },
  ],
  "developer-tools": [
    { id: "su-dev-devops", label: "DevOps·CI/CD", desc: "배포 자동화·인프라 — B2B 매출", labelEn: "DevOps / CI-CD" },
    { id: "su-dev-monitoring", label: "모니터링·옵저버빌리티", desc: "APM·로그·트레이싱", labelEn: "Monitoring / observability" },
    { id: "su-dev-database", label: "데이터베이스·데이터 도구", desc: "DB·ETL·데이터 플랫폼", labelEn: "Database / data tools" },
    { id: "su-dev-testing", label: "테스트·QA 자동화", desc: "E2E·단위 테스트·QA", labelEn: "Test / QA automation" },
  ],
  "b2b-saas": [
    { id: "su-saas-hr", label: "HR·인사 SaaS", desc: "근태·급여·평가 — 한국 노동법 핵심", labelEn: "HR SaaS" },
    { id: "su-saas-crm", label: "CRM·세일즈 SaaS", desc: "영업·고객관리·마케팅 자동화", labelEn: "CRM SaaS" },
    { id: "su-saas-erp", label: "ERP·재무·회계", desc: "회계·재무·세무 자동화", labelEn: "ERP / Finance SaaS" },
    { id: "su-saas-vertical", label: "버티컬 SaaS (산업 특화)", desc: "병원·식당·미용·법률 등 도메인", labelEn: "Vertical SaaS" },
  ],
  "security-startup": [
    { id: "su-sec-network", label: "네트워크·엔드포인트 보안", desc: "방화벽·EDR·제로트러스트", labelEn: "Network / endpoint security" },
    { id: "su-sec-app", label: "애플리케이션·API 보안", desc: "WAF·SAST·DAST·API 보안", labelEn: "App / API security" },
    { id: "su-sec-data", label: "데이터·개인정보 보안", desc: "DLP·암호화·개인정보 컴플라이언스", labelEn: "Data / privacy" },
    { id: "su-sec-blockchain", label: "블록체인·암호자산 보안", desc: "스마트컨트랙트 감사·지갑 보안", labelEn: "Blockchain security" },
  ],
  "hardware-iot": [
    { id: "su-hw-smarthome", label: "스마트홈·가전 IoT", desc: "스마트 플러그·조명·센서 — B2C", labelEn: "Smart home IoT" },
    { id: "su-hw-wearable", label: "웨어러블·헬스 디바이스", desc: "스마트워치·헬스 센서", labelEn: "Wearable" },
    { id: "su-hw-industrial", label: "산업용 IoT·센서", desc: "공장·물류 IoT — B2B 매출", labelEn: "Industrial IoT" },
  ],
  "robotics-physical-ai": [
    { id: "su-robot-collab", label: "협업 로봇 (코봇)", desc: "공장·제조 협업 로봇", labelEn: "Collaborative robot" },
    { id: "su-robot-service", label: "서비스 로봇 (배달·청소)", desc: "F&B·청소·접객 로봇", labelEn: "Service robot" },
    { id: "su-robot-medical", label: "의료·재활 로봇", desc: "수술·재활·MFDS 인증", labelEn: "Medical robot" },
    { id: "su-robot-autonomous", label: "자율주행·드론", desc: "AV·드론·라이다", labelEn: "Autonomous / drone" },
  ],

  // ── 온라인·디지털 ────────────────────────────────────────
  "smart-store": [
    { id: "ec-smart-fashion", label: "패션·의류", desc: "여성·남성·아동 — 가장 큰 시장", labelEn: "Fashion" },
    { id: "ec-smart-beauty", label: "화장품·뷰티", desc: "K-뷰티 — 해외 직배 가능", labelEn: "Beauty / cosmetics" },
    { id: "ec-smart-food", label: "식품·가공식품", desc: "마켓컬리·새벽배송 모델", labelEn: "Food / packaged" },
    { id: "ec-smart-home", label: "홈·생활용품", desc: "오늘의집·자체몰 — 객단가 ↑", labelEn: "Home / lifestyle" },
    { id: "ec-smart-pet", label: "반려동물 용품", desc: "사료·간식·용품 — 정기 구독", labelEn: "Pet supplies" },
    { id: "ec-smart-health", label: "건강식품·영양제", desc: "프로바이오틱스·콜라겐", labelEn: "Health supplements" },
  ],
  "digital-products": [
    { id: "dp-ebook", label: "전자책·디지털 콘텐츠", desc: "노하우·강의 — 마진 90%+", labelEn: "Ebook / digital" },
    { id: "dp-template", label: "템플릿·디자인 에셋", desc: "노션·피그마·PPT — Etsy 모델", labelEn: "Template / asset" },
    { id: "dp-course", label: "온라인 강의·VOD", desc: "인프런·클래스101 — 패시브 인컴", labelEn: "Online course" },
    { id: "dp-saas-light", label: "라이트 SaaS·툴", desc: "1인 SaaS·생산성 도구", labelEn: "Lite SaaS / tool" },
  ],
  "consignment-commerce": [
    { id: "cc-dropship-fashion", label: "패션·잡화 위탁", desc: "도매처 사진 + 자체 마진", labelEn: "Fashion dropshipping" },
    { id: "cc-dropship-home", label: "홈·생활용품 위탁", desc: "오피스·홈 카테고리", labelEn: "Home dropshipping" },
    { id: "cc-dropship-food", label: "식품·간식 위탁", desc: "산지 직송·가공식품", labelEn: "Food dropshipping" },
  ],
  "newsletter-membership": [
    { id: "nm-knowledge", label: "지식·인사이트 뉴스레터", desc: "테크·경제·트렌드 큐레이션", labelEn: "Knowledge newsletter" },
    { id: "nm-hobby", label: "취미·라이프스타일", desc: "와인·커피·여행 등 큐레이션", labelEn: "Hobby / lifestyle" },
    { id: "nm-b2b-industry", label: "산업·업계 뉴스 (B2B)", desc: "특정 산업 인사이더 — 기업 구독", labelEn: "B2B industry news" },
  ],
  "global-buying": [
    { id: "gb-fashion", label: "해외 패션·잡화 구매대행", desc: "유럽·미국 명품·의류", labelEn: "Fashion buying" },
    { id: "gb-electronics", label: "해외 가전·전자제품", desc: "미·일·중 가전 — 환율·관세 핵심", labelEn: "Electronics buying" },
    { id: "gb-cosmetics", label: "해외 화장품·뷰티", desc: "유럽·일본 화장품 직구", labelEn: "Cosmetics buying" },
    { id: "gb-supplements", label: "해외 영양제·건강식품", desc: "iHerb·아마존 영양제 대행", labelEn: "Supplements buying" },
  ],

  // ── 교육 ──────────────────────────────────────────────────
  "kids-academy": [
    { id: "ka-music", label: "음악 학원 (피아노·바이올린)", desc: "악기 1:1 + 그룹 레슨", labelEn: "Music academy" },
    { id: "ka-art", label: "미술 학원", desc: "유아·아동 미술 + 입시미술 분리", labelEn: "Art academy" },
    { id: "ka-physical", label: "체육 학원 (태권도·축구)", desc: "태권도·축구·발레 — 가장 일반적", labelEn: "Sports academy" },
    { id: "ka-play", label: "놀이·창의 학원", desc: "유아 놀이 + STEAM 융합", labelEn: "Play / STEAM" },
  ],
  "adult-class": [
    { id: "ac-cooking", label: "요리·홈베이킹 클래스", desc: "원데이·정기 — 객단가 5~15만", labelEn: "Cooking class" },
    { id: "ac-craft", label: "공예·플라워·도예", desc: "플라워·도예·수공예 — 인스타 강세", labelEn: "Craft / flower" },
    { id: "ac-art-paint", label: "그림·드로잉 클래스", desc: "유화·수채화·드로잉 — 성인 시장", labelEn: "Drawing / paint" },
    { id: "ac-finance", label: "재테크·투자 클래스", desc: "주식·부동산·세무 — 직장인 시장", labelEn: "Finance class" },
  ],

  // ── 펫 ────────────────────────────────────────────────────
  "pet-cafe": [
    { id: "pc-dog", label: "강아지 카페", desc: "강아지 동반 + 음료 — 주말 강세", labelEn: "Dog cafe" },
    { id: "pc-cat", label: "고양이 카페", desc: "고양이 입양 가능 카페", labelEn: "Cat cafe" },
    { id: "pc-mixed", label: "복합 펫카페 (강아지·고양이)", desc: "강아지·고양이 + 분리 공간", labelEn: "Mixed pet cafe" },
  ],
  "pet-supplies": [
    { id: "ps-food", label: "사료·간식 전문", desc: "프리미엄 사료·수제 간식", labelEn: "Pet food / treats" },
    { id: "ps-fashion", label: "펫 의류·액세서리", desc: "옷·하네스·캐리어 — 인스타 강세", labelEn: "Pet fashion" },
    { id: "ps-toys", label: "펫 장난감·용품 종합", desc: "장난감·간식·생활용품 종합", labelEn: "Pet toys / supplies" },
  ],

  // ── 공간/숙박 ────────────────────────────────────────────
  "guesthouse": [
    { id: "gh-urban", label: "도심형 게스트하우스", desc: "외국인 관광객·홍대·이태원·강남", labelEn: "Urban guesthouse" },
    { id: "gh-hanok", label: "한옥·전통 게스트하우스", desc: "전주·북촌·경주 — 외국인 시장", labelEn: "Hanok guesthouse" },
    { id: "gh-rural", label: "시골·자연 펜션형", desc: "강원·제주 자연 — 가족·커플", labelEn: "Rural pension" },
  ],

  // ── 피트니스 ──────────────────────────────────────────────
  "golf-studio": [
    { id: "gs-screen", label: "스크린 골프", desc: "골프존·카카오 — 가장 보편", labelEn: "Screen golf" },
    { id: "gs-lesson-indoor", label: "실내 골프 레슨", desc: "1:1 레슨 + 스윙 분석", labelEn: "Indoor golf lesson" },
    { id: "gs-academy", label: "주니어·입시 골프 아카데미", desc: "체대·골프 입시 전문", labelEn: "Junior golf academy" },
  ],
  "unmanned-fitness": [
    { id: "uf-24h-gym", label: "무인 24시 헬스장", desc: "키카드 출입 + CCTV — 인건비 ↓", labelEn: "Unmanned 24h gym" },
    { id: "uf-kiosk-pt", label: "키오스크 셀프 PT", desc: "AI 코칭 + 셀프 운동", labelEn: "Kiosk self-PT" },
  ],
};

export function getSpecialtyOptions(industryId: string | undefined): SpecialtyOption[] {
  if (!industryId) return [];
  return SPECIALTY_BY_INDUSTRY[industryId] ?? [];
}
