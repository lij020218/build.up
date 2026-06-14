/**
 * sub-industry 별 2026 인테리어 보강 데이터.
 *
 * 기존 sub-industry-interior-data.ts(materials/concepts) 위에 얹는
 * "2026 트렌드 + 추천 가구/브랜드 + 특화 업체" 레이어.
 * ConstructionSetupStage 가 subIndustryId 로 매칭해 추가 섹션을 렌더한다.
 *
 * 데이터 원칙(2026-06-13):
 *   - 5개 병렬 리서치 agent(WebSearch)가 카테고리별로 조사한 결과 통합.
 *   - 모든 트렌드/브랜드/업체는 실재하는 것만, 출처(sourceKo) 명시. 확인 안 된 항목은 제외.
 *   - Pantone 2026 올해의 색 = "Cloud Dancer"(PANTONE 11-4201, 2025.12 발표) 공통 앵커.
 *   - 브랜드/업체는 "광고가 아닌 참고용, 직접 견적/계약/검증 권장"(caveatKo) 프레이밍.
 *
 * 디지털/온라인 업종(ai-application/b2b-saas/핀테크 등)은 매장 인테리어가 불필요하므로
 * 공통 노트 _digital-home-office-note 로 대체한다(이 업종들은 construction-setup 단계를 거치지 않음).
 */

export type Interior2026TrendItem = {
  titleKo: string;
  descKo: string;
  sourceKo: string;
};

export type Interior2026FurnitureItem = {
  itemKo: string;
  descKo: string;
};

export type Interior2026BrandItem = {
  nameKo: string;
  noteKo: string;
  sourceKo?: string;
};

export type Interior2026FirmItem = {
  nameKo: string;
  typeKo: string;
  noteKo: string;
  sourceKo?: string;
};

export type SubIndustryInterior2026 = {
  /** _digital-home-office-note 전용 안내 문구 */
  noteKo?: string;
  colorTrend2026?: { nameKo: string; descKo: string; sourceKo: string };
  trends2026: Interior2026TrendItem[];
  furniture: Interior2026FurnitureItem[];
  furnitureBrands: Interior2026BrandItem[];
  specialistFirms?: Interior2026FirmItem[];
  caveatKo: string;
};

export const SUB_INDUSTRY_INTERIOR_2026: Record<string, SubIndustryInterior2026> = {
  // ─────────────────────────────────────────────────────────
  // 음식(FOOD) 6 + 카페(CAFE) 6
  // ─────────────────────────────────────────────────────────
"korean-casual": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "팬톤이 사상 처음으로 화이트를 올해의 색으로 선정. 절제·여백·정갈함을 강조하는 톤으로, 한식당의 단정한 백반·정식 이미지와 잘 맞는다. 베이스는 클라우드 댄서 화이트, 포인트는 2026 어스톤(클레이·테라코타·올리브) 우드 조합 권장.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12), TIME·ABC News 보도"
  },
  trends2026: [
    {
      titleKo: "테일러드 클래식 + 뉴트로 우드",
      descKo: "2026 인테리어 핵심 키워드 '테일러드 클래식'. 한식당은 티크·월넛 등 짙은 원목과 무몰딩 마감으로 '절제된 고급스러움'을 연출하는 흐름.",
      sourceKo: "보그 코리아 '2026 핵심 인테리어 디자인 트렌드 11'(2026.01), 오늘의집 advices"
    },
    {
      titleKo: "어스톤 + 천연 소재",
      descKo: "테라코타·카라멜·올리브 등 따뜻한 어스톤과 라탄·스톤·한지 등 천연 질감 마감이 한식 공간의 '자연과의 조화' 컨셉과 맞물림.",
      sourceKo: "마케팅 인사이드 '2026 인테리어 트렌드'(2026), Design+ 2026 디자인 트렌드"
    },
    {
      titleKo: "지속가능 마감(재생·업사이클 목재)",
      descKo: "FSC 인증·재생 목재, 리폼 가구가 새 표준으로. 노포 감성 한식당의 '오래된 멋'과 친환경 서사를 동시에 살릴 수 있음.",
      sourceKo: "꾸미고 '2026 인테리어 자재 트렌드', 오폴리아홈 2026 트렌드"
    }
  ],
  furniture: [
    { itemKo: "원목 4인 식탁(붙임·분리형)", descKo: "단체석 대응 위해 2인·4인 모듈로 붙였다 떼는 원목 테이블. 백반·정식 회전율 높은 한식당 기본." },
    { itemKo: "등받이 우드 의자 / 평상형 좌식 단", descKo: "좌식 수요가 있는 한식당은 평상형 단 + 방석, 입식은 등받이 우드 의자로 분리 배치." },
    { itemKo: "수저·반찬 정리 사이드 스테이션", descKo: "반찬 셀프바·수저통·물컵을 모은 스테이션으로 동선 단축." },
    { itemKo: "벽부 따뜻한 색온도 펜던트", descKo: "음식이 맛있게 보이는 2700~3000K 전구색 펜던트로 테이블 위 집중 조명." }
  ],
  furnitureBrands: [
    { nameKo: "인블루가구", noteKo: "목재·철제 식당/음식점 업소용 테이블 전문 쇼핑몰", sourceKo: "inblue.co.kr 업소용 카테고리" },
    { nameKo: "삐에노가구", noteKo: "구내식당·카페·식당용 업소용 테이블 전문 제작 공장", sourceKo: "pieno.kr" },
    { nameKo: "한국업소용가구", noteKo: "테이블·의자·집기 제작 + 창업 컨설팅", sourceKo: "upsogagu.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "업종별 전문 시공사 매칭, 예산·일정·지역 조건 비교", sourceKo: "qplace.kr" },
    { nameKo: "집닥", typeKo: "인테리어 견적·시공 매칭 플랫폼", noteKo: "상가/카페 등 상업공간 분리 운영, 검증 시공사 매칭", sourceKo: "zipdoc.co.kr, App Store" }
  ],
  caveatKo: "특정 업체 광고가 아닌 참고용입니다. 실제 시공은 현장 실측·복수 견적·계약서 검증을 직접 거치세요."
},

"delivery-meals": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "배달전문은 손님이 공간을 보지 않으므로 색은 '청결·위생' 신호용. 화이트 클라우드 댄서 기반 밝은 위생 마감 + 픽업존 사인 포인트 컬러 한 가지로 충분.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "홀 제로·픽업존 중심 레이아웃",
      descKo: "배달형 공유주방은 '홀 없는 푸드코트'. 라이더 픽업 동선·포장 대기존을 입구 가까이 배치하고 객석은 최소화/생략.",
      sourceKo: "나무위키 '공유주방', 소중함인사이트 '배달 창업 가이드 2026'"
    },
    {
      titleKo: "스마트 주방(수요예측·동선 효율)",
      descKo: "2026 배달은 하이퍼로컬·AI 물류 최적화 시대. 식자재 낭비를 줄이는 스마트 주방 동선과 포장 작업대 효율이 인테리어보다 핵심.",
      sourceKo: "소중함인사이트 ssjum.com '배달 창업 가이드 2026', foodopslab 2026 시장 분석"
    },
    {
      titleKo: "위생·청소 우선 마감",
      descKo: "2026 트렌드 전반이 '예쁜 디자인보다 내구성·관리 편의'로 이동. 배달주방은 스테인리스·에폭시 바닥 등 청소 쉬운 마감이 최우선.",
      sourceKo: "오늘의집 '2026 인테리어 트렌드 총정리'(관리 편의 우선 흐름)"
    }
  ],
  furniture: [
    { itemKo: "포장 작업대(스테인리스)", descKo: "용기 적재·라벨·포장 동선을 한 줄로 잇는 작업대. 위생·내구성 중심." },
    { itemKo: "픽업 선반/대기 랙", descKo: "완성 주문을 라이더가 빠르게 집어가도록 입구 쪽 픽업 선반." },
    { itemKo: "용기·부자재 수납 랙", descKo: "포장용기·수저·소스 적재용 다단 랙으로 작업 동선 단축." },
    { itemKo: "벽부 메뉴/주문 모니터 거치대", descKo: "배달앱 주문 모니터·주방 디스플레이(KDS) 거치." }
  ],
  furnitureBrands: [
    { nameKo: "한국업소용가구", noteKo: "주방 집기·작업대 등 업소용 집기 제작 및 컨설팅", sourceKo: "upsogagu.co.kr" },
    { nameKo: "삐에노가구", noteKo: "업소용 집기·테이블 제작 공장(소량 픽업존 가구 대응)", sourceKo: "pieno.kr" }
  ],
  specialistFirms: [
    { nameKo: "공유주방(109키친·키친42·헬로키친 등)", typeKo: "배달전문 공유주방 운영사", noteKo: "주방설비·인터넷·방역·보안 등 영업 인프라 패키지 제공, 초기 인테리어 부담 절감", sourceKo: "109kitchen.co.kr, kitchen42.kr, hellokitchen.co.kr" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "소형 주방·픽업존 시공 업체 매칭", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용 정보입니다. 공유주방 계약 시 독점·위약 조건을 반드시 확인하고, 시공은 복수 견적·계약서 검증을 직접 거치세요."
},

"salad-healthy": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "샐러드·건강식의 '깨끗하고 신선한' 이미지와 가장 잘 맞는 색. 화이트 베이스에 올리브그린·내추럴 우드를 더해 푸릇한 식재료가 돋보이는 밝은 공간.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "화이트+우드 밝은 미니멀",
      descKo: "화이트와 내추럴 우드 조합의 밝은 미니멀이 건강식 카페와 잘 맞음. 음식의 신선한 색을 배경이 받쳐주는 구성.",
      sourceKo: "LX Z:IN '클래식 화이트 우드' 스타일링, 사랑방 화이트&우드 카페 포트폴리오"
    },
    {
      titleKo: "천연 소재·식물 그린",
      descKo: "라탄·세라믹·린넨 등 천연 소재와 올리브그린·식물 요소로 웰니스 감성. 2026 어스톤(베이지·올리브) 흐름과 연결.",
      sourceKo: "LifeBase '홈카페 인테리어 소품', 마케팅 인사이드 2026 어스톤 트렌드"
    },
    {
      titleKo: "오픈 카운터·재료 비주얼",
      descKo: "샐러드 토핑·재료를 오픈 카운터에 진열해 '신선함'을 시각화하는 구성. 셀프 커스텀 동선과 결합.",
      sourceKo: "다음뉴스 샐러드 전문점 운영 사례, 비애티튜드 '샐러드보울' 인터뷰"
    }
  ],
  furniture: [
    { itemKo: "오픈 토핑 쇼케이스/냉장 카운터", descKo: "샐러드 재료를 보여주며 커스텀 주문받는 냉장 토핑바." },
    { itemKo: "라이트 우드 2인 테이블", descKo: "밝은 원목 소형 테이블로 1~2인 건강식 손님 회전 대응." },
    { itemKo: "하이 카운터 + 스툴", descKo: "혼밥·테이크아웃 대기용 창가 바 좌석." },
    { itemKo: "그린 플랜터/행잉 식물", descKo: "식물 요소로 신선·웰니스 분위기 강화." }
  ],
  furnitureBrands: [
    { nameKo: "영가구(younggagu)", noteKo: "카페 테이블·목재 테이블 등 업소용 원목 가구", sourceKo: "younggagu.com 카페테이블/목재테이블" },
    { nameKo: "인블루가구", noteKo: "목재·철제 업소용 카페/식당 테이블 전문", sourceKo: "inblue.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "오늘의집", typeKo: "인테리어 정보·시공 매칭 플랫폼", noteKo: "2026 트렌드·시공 사례 풍부, 밝은 미니멀 레퍼런스 탐색에 유용", sourceKo: "ohou.se" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적", noteKo: "카페·건강식 매장 시공사 비교", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용 정보로 특정 업체 광고가 아닙니다. 냉장 토핑바 등 핵심 집기는 직접 실측·견적·계약 검증을 권장합니다."
},

"ramen-noodle": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "라멘·면 전문점은 일식 노렌·목조 감성과 화이트의 절제미를 결합. 클라우드 댄서 화이트 벽 + 짙은 월넛 우드 + 포인트 인디고/벽돌색으로 따뜻하면서 정갈한 면 가게 무드.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "뉴트로 우드·짙은 원목",
      descKo: "티크·월넛 등 짙은 우드가 2026 핵심. 면 전문점의 카운터·바·격자 칸막이에 적용해 '오래된 노포' 같은 깊이감 연출.",
      sourceKo: "보그 코리아 '2026 인테리어 트렌드 11', Threads 레온디자인그룹 뉴트로 우드"
    },
    {
      titleKo: "바(카운터) 중심 동선",
      descKo: "혼밥·빠른 회전에 맞춘 ㄷ자/일자 카운터석 중심. 면류 즉석 제공 동선과 어울림.",
      sourceKo: "2026 외식 공간 '컨셉 일관성·동선' 흐름(보그 코리아 2026 트렌드)"
    },
    {
      titleKo: "곡선·아치 요소",
      descKo: "아치형 입구·둥근 칸막이 등 부드러운 곡선으로 좁은 면 가게도 넓고 편안하게.",
      sourceKo: "마케팅 인사이드 2026 곡선 트렌드, 오폴리아홈 2026"
    }
  ],
  furniture: [
    { itemKo: "일자/ㄷ자 카운터 + 등받이 스툴", descKo: "혼밥·빠른 회전을 위한 바 좌석 구성." },
    { itemKo: "2인 우드 테이블(붙임형)", descKo: "소규모 일행 대응 2인 모듈, 피크 때 붙여서 운용." },
    { itemKo: "면 그릇 트레이/사이드 선반", descKo: "그릇 회수·물·티슈 정리용 사이드 스테이션." },
    { itemKo: "노렌/목재 격자 칸막이", descKo: "일식 면 가게 무드를 살리는 가림막 겸 좌석 분리." }
  ],
  furnitureBrands: [
    { nameKo: "체어팩토리", noteKo: "인테리어 디자인 의자 전문(야외/실내 세트)", sourceKo: "chairfactory.co.kr" },
    { nameKo: "삐에노가구", noteKo: "식당·카페 업소용 테이블 전문 제작", sourceKo: "pieno.kr" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적", noteKo: "면·일식당 시공 경험 업체 매칭", sourceKo: "qplace.kr" },
    { nameKo: "인테리어젠틀맨(인젠)", typeKo: "상업공간 인테리어 플랫폼", noteKo: "음식점 등 상업공간 전문 시공 매칭", sourceKo: "interiorgentleman.com" }
  ],
  caveatKo: "참고용이며 광고가 아닙니다. 카운터·동선 설계는 좌석수·소방·환기 규정을 반영해 전문가와 직접 검증하세요."
},

"chicken-burger": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "치킨·버거는 브랜드 시그니처 컬러(레드·옐로 등)가 강한 업종이라 팬톤 화이트는 '배경 정리용'. 클라우드 댄서 화이트로 벽·천장을 비우고 브랜드 색을 포인트로 살리는 절제 구성.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "콤팩트형 매장 모델",
      descKo: "임대료·인건비 부담으로 좌석 줄인 콤팩트형·테이크아웃 비중 큰 매장이 확산. 신세계푸드 등 '콤팩트 매장 모델'로 창업 문턱 낮추는 흐름.",
      sourceKo: "뉴스핌 '노브랜드버거 출점'(2026.06), 마이프차 프랜차이즈 분석"
    },
    {
      titleKo: "카운터·키오스크 중심 동선",
      descKo: "주문 키오스크·픽업 카운터를 입구에 두고 좌석은 회전 빠른 패스트캐주얼 배치. 포장·배달 픽업존 분리.",
      sourceKo: "2026 패스트캐주얼 콤팩트 매장 흐름(뉴스핌·마이프차)"
    },
    {
      titleKo: "청소 쉬운 내구 마감",
      descKo: "유분·오염 많은 업종 특성상 타일·에폭시 등 관리 쉬운 마감 우선. 2026 '내구성·관리 편의 우선' 흐름과 일치.",
      sourceKo: "오늘의집 '2026 인테리어 트렌드 총정리'(관리 편의 우선)"
    }
  ],
  furniture: [
    { itemKo: "고정형 4인 테이블·벤치", descKo: "회전 빠른 패스트캐주얼용 내구성 강한 고정 좌석." },
    { itemKo: "창가 하이 카운터 + 스툴", descKo: "혼밥·짧은 체류 손님 대응 바 좌석." },
    { itemKo: "픽업 카운터/대기 선반", descKo: "포장·배달 픽업 분리 동선용 카운터." },
    { itemKo: "트레이 반납대", descKo: "셀프 반납으로 인건비 절감하는 회수 스테이션." }
  ],
  furnitureBrands: [
    { nameKo: "아르푸(arfu)", noteKo: "카페·업소용 의자·소파·테이블 디자인 가구(공장 직영)", sourceKo: "arfu.co.kr" },
    { nameKo: "체어팩토리", noteKo: "업소용 디자인 의자·세트 전문", sourceKo: "chairfactory.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적", noteKo: "프랜차이즈 외 개인 버거·치킨 매장 시공사 비교", sourceKo: "qplace.kr" },
    { nameKo: "집닥", typeKo: "인테리어 견적·시공 매칭", noteKo: "상업공간 검증 시공사 매칭·견적계산기", sourceKo: "zipdoc.co.kr" }
  ],
  caveatKo: "프랜차이즈 가맹은 본사 표준 인테리어가 적용되니 가맹 계약서를 우선 확인하세요. 위 정보는 참고용이며 광고가 아닙니다."
},

"western-pasta-brunch": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "브런치·파스타 공간의 밝고 여유로운 '오전 햇살' 무드와 화이트가 잘 맞음. 클라우드 댄서 화이트 + 따뜻한 우드 + 올리브/테라코타 포인트로 유러피언 캐주얼 다이닝.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "테일러드 클래식(유러피언 비스트로)",
      descKo: "절제된 고급스러움의 '테일러드 클래식'이 브런치/파스타 비스트로와 잘 맞음. 무몰딩 화이트 벽 + 클래식 디테일 가구.",
      sourceKo: "보그 코리아 '2026 인테리어 트렌드 11', 마케팅 인사이드 2026"
    },
    {
      titleKo: "곡선·아치와 자연광",
      descKo: "아치형 창·둥근 소파·물결 선반 등 부드러운 곡선과 큰 창의 자연광으로 브런치 특유의 화사함 연출.",
      sourceKo: "마케팅 인사이드 2026 곡선 트렌드, 오폴리아홈 2026"
    },
    {
      titleKo: "천연 소재·어스톤 포인트",
      descKo: "라탄·린넨·세라믹 등 천연 소재와 카라멜·올리브 어스톤으로 따뜻한 다이닝 무드.",
      sourceKo: "Design+ 2026 디자인 트렌드, 마케팅 인사이드 어스톤"
    }
  ],
  furniture: [
    { itemKo: "라탄/우드 다이닝 체어", descKo: "유러피언 비스트로 무드의 라탄·원목 의자." },
    { itemKo: "원목 2~4인 다이닝 테이블", descKo: "브런치 플레이팅이 돋보이는 넉넉한 원목 식탁." },
    { itemKo: "라운지형 소파석", descKo: "장시간 체류 브런치 손님용 둥근 소파 코너." },
    { itemKo: "와인/디저트 디스플레이 선반", descKo: "와인·디저트 진열로 객단가 유도하는 선반." }
  ],
  furnitureBrands: [
    { nameKo: "아르푸(arfu)", noteKo: "카페·다이닝 디자인 의자·소파·테이블(공장 직영)", sourceKo: "arfu.co.kr" },
    { nameKo: "영가구(younggagu)", noteKo: "카페·다이닝용 원목 테이블", sourceKo: "younggagu.com" }
  ],
  specialistFirms: [
    { nameKo: "인테리어젠틀맨(인젠)", typeKo: "상업공간 인테리어 플랫폼", noteKo: "카페·레스토랑 등 상업공간 전문 시공 매칭", sourceKo: "interiorgentleman.com" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 비교견적", noteKo: "브런치/다이닝 시공사 비교", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용 정보로 특정 업체 광고가 아닙니다. 자연광·곡선 구조는 건물 구조·창호 조건에 따라 가능 여부가 달라지니 현장 실측을 권장합니다."
},

"takeout-coffee": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "테이크아웃 커피는 좌석보다 '눈에 띄는 파사드·간판'이 핵심. 클라우드 댄서 화이트 벽 + 브랜드 포인트 컬러 1가지로 깔끔하게. 좁은 면적을 화이트로 넓어 보이게.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "픽업 카운터 중심 콤팩트 구성",
      descKo: "좌석 최소·픽업 동선 최대. 주문→대기→픽업 한 줄 동선으로 좁은 면적을 효율화.",
      sourceKo: "d5render '저예산 작은 카페 인테리어' 가이드"
    },
    {
      titleKo: "화이트+우드 밝은 미니멀",
      descKo: "화이트와 내추럴 우드의 밝은 미니멀이 소형 테이크아웃 매장에 효과적. 청결·신뢰 이미지.",
      sourceKo: "사랑방 화이트&우드 카페 포트폴리오, LX Z:IN 화이트 우드"
    },
    {
      titleKo: "관리 쉬운 마감 우선",
      descKo: "2026 흐름인 '내구성·관리 편의 우선'. 작은 매장일수록 청소·유지 쉬운 타일·우드패널 마감 권장.",
      sourceKo: "오늘의집 '2026 인테리어 트렌드 총정리'"
    }
  ],
  furniture: [
    { itemKo: "픽업 카운터/주문대", descKo: "주문·결제·픽업을 한 줄로 잇는 카운터." },
    { itemKo: "벽부 좁은 바 + 스툴 1~2개", descKo: "최소 면적에 잠깐 머무는 창가 바 좌석." },
    { itemKo: "테이크아웃 컵·뚜껑 디스펜서대", descKo: "컵·홀더·빨대 셀프 스테이션." },
    { itemKo: "메뉴 사인·간판 조명", descKo: "유동인구 시선을 잡는 파사드·메뉴 조명." }
  ],
  furnitureBrands: [
    { nameKo: "체어팩토리", noteKo: "카페 스툴·디자인 의자 전문", sourceKo: "chairfactory.co.kr" },
    { nameKo: "인블루가구", noteKo: "소형 카페용 업소용 테이블·바", sourceKo: "inblue.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "오늘의집", typeKo: "인테리어 정보·시공 매칭", noteKo: "소형 카페 시공 사례·견적 탐색", sourceKo: "ohou.se" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 비교견적", noteKo: "소형 카페 전문 시공사 매칭", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용이며 광고가 아닙니다. 소형 매장은 전기·급배수 용량이 관건이니 시공 전 직접 확인·견적 검증을 권장합니다."
},

"specialty-coffee": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "스페셜티는 원두·핸드드립의 '장인 감성'을 보여주는 공간. 클라우드 댄서 화이트 미니멀 배경에 짙은 월넛 바·우드슬랩 테이블·노출 콘크리트로 커피가 주인공이 되게.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "바(브루잉) 중심 오픈 구조",
      descKo: "핸드드립·로스팅 과정을 보여주는 오픈 바 중심 구성이 스페셜티 카페 문법. 손님이 추출을 관람하는 동선.",
      sourceKo: "나무위키 '스페셜티 커피', 블루리본 서울 스페셜티 전문점 매거진"
    },
    {
      titleKo: "뉴트로 우드·우드슬랩 자연 질감",
      descKo: "티크·월넛 등 짙은 우드와 우드슬랩(통원목) 테이블이 2026 뉴트로 우드 흐름과 맞물려 스페셜티의 자연·핸드메이드 감성 강조.",
      sourceKo: "보그 코리아 '2026 인테리어 트렌드 11', Threads 레온디자인그룹 뉴트로 우드"
    },
    {
      titleKo: "원두·기구 디스플레이",
      descKo: "원두 진열·드리퍼·저울 등 기구를 인테리어 요소로 노출해 전문성 시각화.",
      sourceKo: "언스페셜티 몰(스페셜티 플랫폼), 블루리본 스페셜티 매거진"
    }
  ],
  furniture: [
    { itemKo: "우드슬랩(통원목) 공유 테이블", descKo: "통원목 대형 공유 테이블로 노트북·작업 손님 수용 + 시그니처 비주얼." },
    { itemKo: "브루잉 바 + 하이 스툴", descKo: "핸드드립을 보며 마시는 바 좌석." },
    { itemKo: "원두 진열·리테일 선반", descKo: "원두 봉투·드립백 판매 진열대." },
    { itemKo: "1인 집중 우드 카운터석", descKo: "창가 1인 작업/집중 좌석." }
  ],
  furnitureBrands: [
    { nameKo: "영가구(younggagu)", noteKo: "카페·목재 테이블, 우드슬랩 등 원목 가구", sourceKo: "younggagu.com 카페테이블/목재테이블" },
    { nameKo: "아르푸(arfu)", noteKo: "카페 디자인 의자·테이블 공장 직영", sourceKo: "arfu.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "인테리어젠틀맨(인젠)", typeKo: "상업공간 인테리어 플랫폼", noteKo: "카페 전문 시공 매칭", sourceKo: "interiorgentleman.com" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 비교견적", noteKo: "카페·로스터리 시공사 비교", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용이며 광고가 아닙니다. 로스팅 병행 시 배기·소방 설비가 별도이니 전문 시공사와 직접 협의·견적 검증하세요."
},

"dessert-cafe": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "디저트 카페는 디저트 비주얼이 주인공이라 화이트 배경이 색감을 살려줌. 클라우드 댄서 화이트 + 우드/파스텔 포인트로 디저트가 SNS에서 예쁘게 찍히는 톤.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "쇼케이스 = 인테리어의 절반",
      descKo: "디저트 쇼케이스가 매장 브랜딩·SNS 콘텐츠의 핵심. 열선 유리·고연색성 조명·검증 콤프레셔 갖춘 쇼케이스 선택이 매출과 직결.",
      sourceKo: "한성쇼케이스 블로그 '제과 쇼케이스 2026 가이드', 큐플레이스 베이커리 가이드"
    },
    {
      titleKo: "포토존·시그니처 비주얼",
      descKo: "흑백/단색 톤 정돈, 포토존 등 SNS 확산용 시각 장치가 디저트 카페 핵심 트렌드. 일관된 색·질감으로 피드 통일감.",
      sourceKo: "BannerBoo '2026 인스타그램 피드 아이디어', 브런치 모비인사이드 F&B 디저트 트렌드"
    },
    {
      titleKo: "천연 소재·따뜻한 조명",
      descKo: "내추럴 우드·세라믹·따뜻한 조명으로 디저트가 맛있게 보이는 배경. 2026 어스톤·천연소재 흐름과 결합.",
      sourceKo: "LifeBase 홈카페 소품 가이드, 마케팅 인사이드 2026 트렌드"
    }
  ],
  furniture: [
    { itemKo: "디저트 냉장 쇼케이스(고연색 조명)", descKo: "케이크·디저트를 돋보이게 하는 고연색성 조명 쇼케이스." },
    { itemKo: "포토존 우드/파스텔 코너", descKo: "디저트+공간을 함께 찍는 SNS 포토 코너." },
    { itemKo: "소형 2인 카페 테이블", descKo: "디저트+음료 즐기는 2인 좌석." },
    { itemKo: "디저트 진열 우드 선반", descKo: "포장 디저트·굿즈 진열대." }
  ],
  furnitureBrands: [
    { nameKo: "한성쇼케이스", noteKo: "1994년 설립, 김포 소재 냉장·냉동 쇼케이스 제조사. 뚜레쥬르·빽다방·이디야 등 납품", sourceKo: "ko.wikipedia.org '한성쇼케이스', hansungshowcase.kr 카페/디저트 카테고리" },
    { nameKo: "영가구(younggagu)", noteKo: "카페·디저트용 원목 테이블", sourceKo: "younggagu.com" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 비교견적", noteKo: "디저트·베이커리 시공 가이드 및 업체 매칭", sourceKo: "qplace.kr" },
    { nameKo: "오늘의집", typeKo: "인테리어 정보·시공 매칭", noteKo: "포토존·미니멀 카페 레퍼런스", sourceKo: "ohou.se" }
  ],
  caveatKo: "참고용이며 광고가 아닙니다. 쇼케이스는 무조건 저가보다 열선 유리·조명·콤프레셔 사양을 직접 비교하고 A/S 조건을 확인하세요."
},

"bakery-studio": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "베이커리는 빵의 갈색·노릇한 색이 돋보이는 배경이 중요. 클라우드 댄서 화이트 + 따뜻한 우드 베이스로 빵 색이 살아나고 정갈·청결해 보이는 톤.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "빵 진열대·쇼케이스가 핵심",
      descKo: "빵 진열대·쇼케이스가 인테리어의 절반. 공간 효율적 진열과 SNS 확산형 비주얼이 매출과 직결. 베이커리는 오픈 진열+냉장 쇼케이스 혼합.",
      sourceKo: "큐플레이스 '베이커리 빵집 인테리어·쇼케이스 가이드', YouTube 공간효율 빵 진열"
    },
    {
      titleKo: "오픈 베이킹(주방 노출)",
      descKo: "빵 굽는 과정을 보여주는 오픈 주방·오븐 노출로 '갓 구운' 신뢰와 향 마케팅. 스튜디오형 베이커리 트렌드.",
      sourceKo: "큐플레이스 베이커리 인테리어 가이드, 보그 코리아 2026 '컨셉 일관성' 흐름"
    },
    {
      titleKo: "뉴트로 우드·천연 마감",
      descKo: "티크·월넛 우드와 천연 마감으로 빵의 따뜻한 색과 조화. 2026 뉴트로 우드·천연소재 흐름.",
      sourceKo: "보그 코리아 '2026 인테리어 트렌드 11', Design+ 2026"
    }
  ],
  furniture: [
    { itemKo: "오픈 빵 진열대(우드)", descKo: "빵을 집어가는 셀프 오픈 진열대(트레이·집게 동선)." },
    { itemKo: "빵 냉장 쇼케이스(고연색 조명)", descKo: "샌드위치·케이크 등 냉장 진열용 고연색성 쇼케이스." },
    { itemKo: "계산/포장 카운터", descKo: "셀프 빵 선택 후 계산·포장하는 카운터 동선." },
    { itemKo: "취식 우드 테이블(카페 병행 시)", descKo: "베이커리 카페형은 소형 취식 좌석 추가." }
  ],
  furnitureBrands: [
    { nameKo: "한성쇼케이스", noteKo: "1994년 설립 냉장·냉동 쇼케이스 제조사, 뚜레쥬르 등 베이커리 프랜차이즈 납품", sourceKo: "ko.wikipedia.org '한성쇼케이스', hansungshowcase.kr" },
    { nameKo: "세경(세경냉동)", noteKo: "제과·카페용 오픈 쇼케이스 등 냉장 진열 제조", sourceKo: "포인트몰 등 유통 '세경 제과 오픈쇼케이스'" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 비교견적·가이드", noteKo: "베이커리 빵 진열대·쇼케이스 제작 가이드 및 시공사 매칭", sourceKo: "qplace.kr 베이커리 가이드" },
    { nameKo: "집닥", typeKo: "인테리어 견적·시공 매칭", noteKo: "상업공간 검증 시공사·견적계산기", sourceKo: "zipdoc.co.kr" }
  ],
  caveatKo: "참고용이며 광고가 아닙니다. 제빵 설비(오븐·발효기) 전력·배기와 쇼케이스 사양은 직접 실측·견적·A/S 조건 검증을 권장합니다."
},

"icecream-bingsu": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "빙수·아이스크림은 '시원함·인스타 비주얼'이 핵심. 클라우드 댄서 화이트의 청량한 배경에 파스텔/민트 포인트로 빙수 비주얼이 돋보이고 더위에 시원해 보이는 톤.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "포토존·SNS 비주얼 중심",
      descKo: "빙수는 비주얼이 곧 마케팅. 포토존·시그니처 색 코너 등 SNS 확산 장치가 핵심. 단색·통일 톤으로 피드 리듬 만들기.",
      sourceKo: "BannerBoo '2026 인스타그램 피드 아이디어', 브런치 모비인사이드 F&B 트렌드"
    },
    {
      titleKo: "계절 가변 연출(여름 피크)",
      descKo: "빙수는 여름 집중 업종이라 시즌 가변형 소품·배너·좌석 확장이 유리. 비수기엔 디저트/음료 전환이 쉬운 레이아웃.",
      sourceKo: "킨텍스 '2026 카페디저트페어', 브런치 모비인사이드 디저트 트렌드"
    },
    {
      titleKo: "화이트+파스텔 청량 미니멀",
      descKo: "화이트 베이스에 민트·파스텔 포인트로 시원하고 밝은 미니멀. 빙수 색감을 받쳐주는 청량한 배경.",
      sourceKo: "사랑방 화이트&우드 카페 포트폴리오, BannerBoo 단색 피드 트렌드"
    }
  ],
  furniture: [
    { itemKo: "빙수 쇼케이스/토핑 냉장대", descKo: "토핑·빙수 베이스를 보여주는 냉장 진열대." },
    { itemKo: "포토존 파스텔 코너/네온 사인", descKo: "빙수+공간 함께 찍는 SNS 포토 코너." },
    { itemKo: "4인 테이블(빙수 공유)", descKo: "빙수는 나눠 먹는 경우가 많아 넉넉한 4인 좌석." },
    { itemKo: "여름 시즌 확장 좌석/테라스", descKo: "성수기 좌석 확장용 이동형/테라스 가구." }
  ],
  furnitureBrands: [
    { nameKo: "체어팩토리", noteKo: "야외세트 등 테라스·시즌 좌석에 맞는 디자인 의자", sourceKo: "chairfactory.co.kr 야외세트" },
    { nameKo: "한성쇼케이스", noteKo: "음료·냉장 쇼케이스 제조(빙수 토핑/음료 진열)", sourceKo: "ko.wikipedia.org '한성쇼케이스', hansungshowcase.kr" }
  ],
  specialistFirms: [
    { nameKo: "오늘의집", typeKo: "인테리어 정보·시공 매칭", noteKo: "포토존·파스텔 미니멀 카페 레퍼런스", sourceKo: "ohou.se" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 비교견적", noteKo: "디저트·빙수 카페 시공사 매칭", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용이며 광고가 아닙니다. 계절성이 큰 업종이라 비수기 전환·좌석 가변성을 고려해 시공 전 직접 견적·검증을 권장합니다."
},

"self-serve-cafe": {
  colorTrend2026: {
    nameKo: "클라우드 댄서(Cloud Dancer, PANTONE 11-4201)",
    descKo: "셀프형 카페는 '명확한 동선·청결'이 우선. 클라우드 댄서 화이트로 밝고 길찾기 쉬운 공간을 만들고, 키오스크·픽업존을 포인트 컬러로 구분.",
    sourceKo: "Pantone Color of the Year 2026 발표(2025.12)"
  },
  trends2026: [
    {
      titleKo: "키오스크·픽업존 명확 동선",
      descKo: "주문(키오스크)→픽업→셀프바→좌석이 한눈에 읽히는 동선이 셀프형 핵심. 인건비 절감과 회전 효율 동시 추구.",
      sourceKo: "d5render '작은 카페 인테리어' 가이드, 보그 코리아 2026 '동선·컨셉' 흐름"
    },
    {
      titleKo: "셀프 스테이션(물·시럽·반납)",
      descKo: "물·빨대·시럽 셀프바와 컵 반납대를 분리 배치해 손님 셀프 처리. 직원 동선 최소화.",
      sourceKo: "d5render 저예산 카페 가이드, 오늘의집 '관리 편의 우선' 흐름"
    },
    {
      titleKo: "화이트+우드 밝은 미니멀·내구 마감",
      descKo: "화이트+내추럴 우드의 밝은 미니멀에 청소 쉬운 내구 마감. 셀프 운영의 위생·관리 부담을 낮추는 구성.",
      sourceKo: "사랑방 화이트&우드 포트폴리오, 오늘의집 '2026 인테리어 트렌드'"
    }
  ],
  furniture: [
    { itemKo: "키오스크 스탠드/주문대", descKo: "셀프 주문 키오스크 거치 스탠드." },
    { itemKo: "픽업 카운터/진동벨 선반", descKo: "완성 음료 픽업 카운터·진동벨 회수대." },
    { itemKo: "셀프바(물·시럽·냅킨)", descKo: "손님 셀프 처리용 부자재 스테이션." },
    { itemKo: "컵 반납·분리수거대", descKo: "셀프 반납으로 인건비 절감하는 회수 스테이션." }
  ],
  furnitureBrands: [
    { nameKo: "인블루가구", noteKo: "카페·셀프바용 업소용 테이블·카운터", sourceKo: "inblue.co.kr" },
    { nameKo: "아르푸(arfu)", noteKo: "카페 의자·테이블 공장 직영 디자인 가구", sourceKo: "arfu.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 비교견적", noteKo: "셀프형 카페 동선 설계 시공사 매칭", sourceKo: "qplace.kr" },
    { nameKo: "오늘의집", typeKo: "인테리어 정보·시공 매칭", noteKo: "미니멀 셀프 카페 시공 레퍼런스", sourceKo: "ohou.se" }
  ],
  caveatKo: "참고용이며 광고가 아닙니다. 키오스크·POS 연동과 셀프바 급배수는 시공 전 직접 사양·견적을 검증하세요."
},

  // ─────────────────────────────────────────────────────────
  // 뷰티(BEAUTY) 6 + 헬스/피트니스(FITNESS) 6
  // ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
// BEAUTY (6) — 인테리어 강화 데이터 (2026)
// ═══════════════════════════════════════════════════════════

"hair-salon": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 모카 우드",
    descKo: "Pantone 2026 올해의 컬러 'Cloud Dancer'(11-4201, 로프티 화이트)를 벽·천장 베이스로, Benjamin Moore 2026 'Silhouette'(에스프레소·차콜 혼합)을 거울 프레임·트림 포인트로. 살롱은 컬러 시술 정확도 때문에 벽은 무채색 화이트 유지가 정석.",
    sourceKo: "Pantone Color of the Year 2026 / Benjamin Moore 2026 'Silhouette'"
  },
  trends2026: [
    { titleKo: "테일러드 클래식 + 어시 우드", descKo: "2026 국내 인테리어 핵심 키워드 '테일러드 클래식'(클래식 품격 + 모던). 캐러멜·머드·초콜릿 브라운 어시톤 우드를 거울대·대기존에 적용해 따뜻한 격조를 연출.", sourceKo: "ampm 인사이드 2026 인테리어 트렌드" },
    { titleKo: "곡선 디자인 (아치 거울·물결 셰이프)", descKo: "아치형 거울, 둥근 소파, 물결 선반 등 부드러운 곡선이 공간을 감싸는 디자인. 좁은 1인 살롱도 넓어 보이게 하고 시각적 편안함을 줌.", sourceKo: "Vogue Korea 2026 인테리어 디자인 트렌드 11 / 오늘의집" },
    { titleKo: "마이크로시멘트·헤링본 마감", descKo: "2026 자재 트렌드는 헤링본 마루와 마이크로시멘트 강세. 마이크로시멘트는 이음새 없는 매끈한 벽·바닥으로 모발·염모제 오염 청소가 쉬워 살롱에 실용적.", sourceKo: "ampm 인사이드 / 오늘의집 2026 자재 트렌드" }
  ],
  furniture: [
    { itemKo: "어시톤 가죽 승강식 미용 의자", descKo: "2026 트렌드 캐러멜·머드 톤 PU/가죽 회전·유압 승강 의자. 디자이너 1인당 1대 배치." },
    { itemKo: "아치형 우드프레임 거울대", descKo: "곡선 트렌드 반영 라운드/아치 상단 거울 + 월넛·모카 프레임 + 골드 트림." },
    { itemKo: "백·사이드 겸용 자동 샴푸 베드", descKo: "안마·매트형 자동 샴푸대(프리미엄 표준). 1샴푸당 매출에 직접 영향." },
    { itemKo: "무광 블랙/스테인리스 4단 시술 카트", descKo: "염색 왜건. 디자이너 수만큼 필요한 이동형 집기." }
  ],
  furnitureBrands: [
    { nameKo: "헤어2000 (미용 도매 할인점)", noteKo: "전국 최대 규모 미용인 전용 도매. 의자·샴푸대·카트 일괄 발주 시 가격 경쟁력. 브랜드라기보다 종합 유통.", sourceKo: "hair2000.co.kr" },
    { nameKo: "다이슨 프로페셔널", noteKo: "디지털 드라이기 라인. 살롱 스탠드 모델 채택 증가.", sourceKo: "" }
  ],
  specialistFirms: [
    { nameKo: "인테리어젠틀맨", typeKo: "상업공간 전문 매칭 플랫폼", noteKo: "No.1 상업공간 인테리어 플랫폼 표방. 미용실 등 업종별 무료 비교견적·당일 현장미팅.", sourceKo: "interiorgentleman.com" },
    { nameKo: "큐플레이스", typeKo: "업종별 시공 매칭", noteKo: "업종별 경험 시공사 소개. 디자인·예산·일정·지역 조건 매칭.", sourceKo: "qplace.kr" }
  ],
  caveatKo: "브랜드·업체는 참고용 예시이며 실제 발주 전 견적·시공 사례·AS 조건을 직접 검증하세요. 가격대는 모델·옵션별 편차가 큽니다."
},

"nail-studio": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 세이지/피치 파스텔",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트 베이스에 세이지·피치 어시 파스텔 포인트. 컬러 큐레이션(컬러 진열) 비주얼이 돋보이도록 벽은 차분한 톤 유지.",
    sourceKo: "Pantone Color of the Year 2026 / ampm 2026 컬러 트렌드(베이지+테라코타·세이지)"
  },
  trends2026: [
    { titleKo: "곡선·아치 진열장", descKo: "물결 선반·아치 니치(niche)에 젤 컬러 500종을 큐레이션. 곡선 트렌드가 인스타 비주얼과 직결.", sourceKo: "Vogue Korea 2026 인테리어 트렌드 11" },
    { titleKo: "마이크로시멘트 매끈 마감", descKo: "이음새 없는 마이크로시멘트 벽·작업대 상판. 파우더·분진 청소가 쉬워 위생 관리에 유리.", sourceKo: "ampm 인사이드 2026 자재 트렌드" },
    { titleKo: "어시 파스텔 + 라탄 내추럴", descKo: "2026 어시톤 트렌드에 맞춰 채도 낮춘 세이지·머드핑크 + 라탄/우드 소품. 기존 'MZ 인스타 성지'를 한 톤 차분하게 업데이트.", sourceKo: "오늘의집 2026 컬러·자재 트렌드" }
  ],
  furniture: [
    { itemKo: "환기구 내장 라운드코너 우드 작업대", descKo: "분진 집진구 일체형 + 라운드 코너 우드 1인 작업대." },
    { itemKo: "핸즈프리 듀얼광원 큐어링 램프", descKo: "젤 경화 효율 향상 핸즈프리 모델." },
    { itemKo: "리클라이너 페디 의자 + 풋스파", descKo: "페디 객단가 상승 핵심 집기." },
    { itemKo: "아크릴/우드 도어 젤 진열 캐비닛", descKo: "컬러 큐레이션 비주얼을 결정하는 진열장." }
  ],
  furnitureBrands: [
    { nameKo: "버킷플레이스 오늘의집(가구·소품)", noteKo: "라탄·우드 진열 소품·조명 큐레이션 소싱 채널로 활용. 가구 브랜드라기보다 종합 커머스.", sourceKo: "ohou.se" }
  ],
  specialistFirms: [
    { nameKo: "오늘의집시공", typeKo: "인테리어 시공 자회사", noteKo: "버킷플레이스가 2025년 설립한 시공 전문 자회사. 검증 시공사 매칭·견적.", sourceKo: "tech42 / 아시아경제 2025.11" },
    { nameKo: "집닥", typeKo: "견적·시공 매칭 플랫폼", noteKo: "검증 시공사 매칭 + 무료 견적계산기. 소형 상업공간 견적 비교에 활용.", sourceKo: "zipdoc.co.kr" }
  ],
  caveatKo: "플랫폼·브랜드는 참고용입니다. 네일샵은 분진 환기·전기 용량(램프 다수)이 시공 핵심이므로 업종 경험 있는 시공사로 검증하세요."
},

"skin-care-room": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 테라코타 코쿤",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트에 테라코타·캐러멜 어시톤을 1인룸 포인트로. 2026 스파 트렌드의 '조용한 럭셔리 코쿤' 무드와 일치.",
    sourceKo: "Pantone Color of the Year 2026 / eHotelier·Hotel Designs 'Spa design trends for 2026'"
  },
  trends2026: [
    { titleKo: "바이오필릭 + 음향 설계(어쿠스틱 코쿤)", descKo: "2026 스파 핵심: 자연광·물·식물·천연 소재 + '조용히 감싸인(cocooned)' 경험. 룸 간 방음·흡음재로 정적(靜寂)을 디자인.", sourceKo: "eHotelier / Hotel Designs 2026 Spa design trends" },
    { titleKo: "소프트 오가닉 폼·러그·월행잉", descKo: "부드러운 유기적 형태 가구, 러그·벽걸이, 물소리 사운드스케이프로 의료적 무드를 누그러뜨리는 'softer biophilic' 접근.", sourceKo: "premierconstructionnews 2026 Spa Design Trends" },
    { titleKo: "감정·멘탈 웰니스 디컴프레스 존", descKo: "관리 전후 마음을 비우는 별도 디컴프레스(decompress) 공간 도입. 2026 웰니스가 멘탈헬스로 확장되는 흐름.", sourceKo: "Spaways 2026 Spa & Wellness Trends" }
  ],
  furniture: [
    { itemKo: "3모터 전동 리클라이너 관리 베드", descKo: "헤드워머·메모리폼. 재방문율의 핵심 집기." },
    { itemKo: "방음 슬라이딩 도어 1인룸 파티션", descKo: "어쿠스틱 코쿤 무드의 토대. 프라이빗 케어 정체성." },
    { itemKo: "유기적 폼 라운지·디컴프레스 소파", descKo: "관리 전후 대기·디컴프레스 존용 곡선 소파." },
    { itemKo: "5단 스테인리스 카트 + 페이셜 스티머", descKo: "세팅 효율과 위생감을 좌우하는 이동 집기." }
  ],
  furnitureBrands: [
    { nameKo: "웰뷰(wellbeau)", noteKo: "에스테틱 피부미용 상품 전문 쇼핑몰. 관리 베드·카트·기기 소싱 채널.", sourceKo: "wellbeau.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스", typeKo: "업종별 시공 매칭", noteKo: "에스테틱·피부관리실 업종 경험 시공사 매칭. 1인룸 방음·환기 설계 사례 확인용.", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용 예시입니다. 시술 기기·온수·환기 전기·배관 용량이 핵심이므로 에스테틱 시공 경험 업체로 반드시 검증하세요."
},

"waxing-studio": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 차콜/올리브 젠더뉴트럴",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트 위생 베이스에 차콜·올리브 어시톤 포인트로 남녀 공용 무드. 남성 왁싱 수요 증가 대응.",
    sourceKo: "Pantone Color of the Year 2026 / ampm 2026 어시톤 컬러 트렌드"
  },
  trends2026: [
    { titleKo: "어쿠스틱 프라이버시(방음 코쿤)", descKo: "2026 웰니스 룸 트렌드인 방음·흡음 설계를 1인 왁싱룸에 적용. 시술 중 대화·소리 차단으로 부끄러움·신뢰 문제 해결.", sourceKo: "eHotelier 2026 Spa design trends(어쿠스틱)" },
    { titleKo: "소프트 바이오필릭 위생 무드", descKo: "메디컬 위생을 식물·우드·간접조명으로 누그러뜨리는 'softer biophilic'. 차갑지 않은 청결감.", sourceKo: "premierconstructionnews 2026 Spa Design Trends" },
    { titleKo: "마이크로시멘트 위생 마감", descKo: "이음새 없는 마이크로시멘트 벽·바닥으로 왁스 비산·각질 청소 용이. 위생 평가 대응.", sourceKo: "ampm 인사이드 2026 자재 트렌드" }
  ],
  furniture: [
    { itemKo: "브라질리언 전용 협폭 전동 베드", descKo: "각도 조절 + 위생 시트. 폭 좁은 모델 별도 권장." },
    { itemKo: "방음 1인 프라이빗 룸 파티션", descKo: "내부 잠금·흡음 마감. 신뢰감의 핵심." },
    { itemKo: "시술 후 진정 케어 카트", descKo: "냉찜·진정세럼·붕산수 비치. 재방문율·리뷰 직결." }
  ],
  furnitureBrands: [
    { nameKo: "웰뷰(wellbeau)", noteKo: "에스테틱·왁싱 소모품·베드·워머 소싱 가능한 피부미용 전문몰.", sourceKo: "wellbeau.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "인테리어젠틀맨", typeKo: "상업공간 매칭 플랫폼", noteKo: "1인룸 다실 구성·방음 시공 경험 업체 매칭. 무료 비교견적.", sourceKo: "interiorgentleman.com" }
  ],
  caveatKo: "참고용입니다. 왁싱은 방음·환기(왁스 향·HEPA)가 시공 핵심. 다실 1인룸 시공 사례 보유 업체로 검증하세요."
},

"eyelash-brow": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 캐러멜 코쿤",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트 베이스에 캐러멜·아이보리 어시톤. 1.5~2시간 장시간 시술을 편안히 견디는 따뜻한 코쿤 무드.",
    sourceKo: "Pantone Color of the Year 2026 / ampm 2026 어시톤 트렌드"
  },
  trends2026: [
    { titleKo: "장시간 시술용 어쿠스틱 코쿤", descKo: "2026 웰니스 방음·흡음 트렌드를 적용. 2시간 시술 중 고객이 잠들 수 있는 정적·간접조명 환경.", sourceKo: "eHotelier 2026 Spa design trends" },
    { titleKo: "곡선 라운지·아치 디테일", descKo: "아치 거울·물결 셰이프 등 곡선 트렌드로 좁은 시술 공간을 넓고 부드럽게.", sourceKo: "Vogue Korea 2026 인테리어 트렌드 11" }
  ],
  furniture: [
    { itemKo: "헤드받침 메모리폼 전동 시술 베드", descKo: "장시간 시술 편안함이 재방문 좌우." },
    { itemKo: "온습도 관리 속눈썹·글루 캐비닛", descKo: "C·D·L 컬, 0.05~0.20mm 100여 종 보관." },
    { itemKo: "그림자 없는 천장 링라이트", descKo: "양안 균형 시술용. 컬러래쉬 시술 필수." }
  ],
  furnitureBrands: [
    { nameKo: "웰뷰(wellbeau)", noteKo: "속눈썹 시술 베드·확대경·소모품 소싱 가능한 피부미용 전문몰.", sourceKo: "wellbeau.co.kr" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스", typeKo: "업종별 시공 매칭", noteKo: "소형 뷰티샵 시공 경험 업체 매칭. 환기(글루 휘발)·조명 설계 사례 확인.", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용입니다. 글루 휘발성분 환기·HEPA·그림자 없는 조명이 핵심. 뷰티샵 시공 경험 업체로 검증하세요."
},

"makeup-bridal": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + Silhouette 다크 트림",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트 갤러리 베이스 + Benjamin Moore 2026 'Silhouette'(에스프레소·차콜) 트림으로 '톤인톤 미니멀 갤러리'. 메이크업 컬러가 정확히 보이는 무채색 환경 필수.",
    sourceKo: "Pantone Color of the Year 2026 / Benjamin Moore 2026 'Silhouette'"
  },
  trends2026: [
    { titleKo: "미니멀 갤러리 + 곡선 아치 포토존", descKo: "화이트박스 갤러리에 아치형 거울·곡선 배경으로 포토존. 2026 곡선·톤인톤 트렌드 결합.", sourceKo: "Vogue Korea 2026 인테리어 트렌드 11" },
    { titleKo: "마이크로시멘트·헤링본 마감", descKo: "갤러리 무드를 완성하는 이음매 없는 마이크로시멘트 벽 + 헤링본 마루.", sourceKo: "ampm 인사이드 2026 자재 트렌드" }
  ],
  furniture: [
    { itemKo: "색온도 가변 할리우드 메이크업 미러", descKo: "3000~6500K 가변 14~24구. 2026 표준." },
    { itemKo: "곡선 아치 배경 포토존 + 링라이트", descKo: "비포·애프터 SNS 마케팅 필수 세트." },
    { itemKo: "브라이덜 드레스 행거 + 스팀기", descKo: "본식·리허설 패키지 매장 필수." }
  ],
  furnitureBrands: [
    { nameKo: "오늘의집(가구·조명 소싱)", noteKo: "드레서·라운지·조명 등 갤러리 무드 가구 큐레이션 채널.", sourceKo: "ohou.se" }
  ],
  specialistFirms: [
    { nameKo: "인테리어젠틀맨", typeKo: "상업공간 매칭 플랫폼", noteKo: "스튜디오·메이크업샵 조명·포토존 시공 경험 업체 매칭.", sourceKo: "interiorgentleman.com" }
  ],
  caveatKo: "참고용입니다. CRI 95+ 조명·전기 용량이 핵심. 스튜디오 조명 시공 경험 업체로 검증하세요."
},

// ═══════════════════════════════════════════════════════════
// FITNESS (6) — 인테리어 강화 데이터 (2026)
// ═══════════════════════════════════════════════════════════

"pilates-studio": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 세이지/라이트오크 웰니스",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트에 세이지 그린·라이트오크 어시톤. 바이오필릭 부티크 스튜디오 무드.",
    sourceKo: "Pantone Color of the Year 2026 / Indigo Fitness·biofit 2026 gym design"
  },
  trends2026: [
    { titleKo: "바이오필릭 부티크 스튜디오", descKo: "식물·리빙월·천연 텍스처를 들인 바이오필릭. 부티크 스튜디오의 커뮤니티·개인화 경험이 대형 시설까지 영향.", sourceKo: "Indigo Fitness / biofilico 2026 gym design trends" },
    { titleKo: "곡선·코르크 등 따뜻한 소재", descKo: "코르크 바닥 등 유기적 소재가 명상·필라테스 공간에서 인기. 2026 곡선 디자인과 결합.", sourceKo: "DreamHouse AI / Robert Hakes 2026 gym trends" },
    { titleKo: "리커버리·멀티존 구획", descKo: "리포머·스트레칭·리커버리를 존별로 구획. 존별 적합 바닥재 적용이 베스트 프랙티스.", sourceKo: "Robert Hakes Construction 2026 gym design" }
  ],
  furniture: [
    { itemKo: "리포머 정렬 배치 + 매트 수납", descKo: "4~8대 그룹 셋업. 스프링·소품 수납장 동반." },
    { itemKo: "캐딜락/타워 + 콤비체어·바렐", descKo: "1:1 룸·코너용 보조기구. 운동 다양성 확보." },
    { itemKo: "벽면 미러월 + 우드 발레바", descKo: "자세 교정 피드백 인프라." }
  ],
  furnitureBrands: [
    { nameKo: "Balanced Body (밸런스드바디)", noteKo: "전문가용 리포머의 골드 스탠다드. 빌드 품질·액세서리 생태계 광범위.", sourceKo: "peakprimalwellness / reformerregistry" },
    { nameKo: "Merrithew STOTT PILATES", noteKo: "캐나다 STOTT 메소드 본사. 생체역학 기반 정밀 설계, 인증 강사 신뢰.", sourceKo: "Merrithew / surprisepilates" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스", typeKo: "업종별 시공 매칭", noteKo: "필라테스 스튜디오 방음·바닥·환기 시공 경험 업체 매칭.", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용입니다. 리포머 가격대·바닥 하중·방음 시공은 견적·사례로 직접 검증하세요."
},

"pt-gym": {
  colorTrend2026: {
    nameKo: "Silhouette 차콜 + Cloud Dancer 화이트 대비",
    descKo: "Benjamin Moore 2026 'Silhouette'(에스프레소·차콜) 프로 짐 무드 + Pantone 2026 'Cloud Dancer' 화이트로 대비. 헤비 존은 다크, 라운지는 화이트.",
    sourceKo: "Benjamin Moore 2026 'Silhouette' / Pantone 2026"
  },
  trends2026: [
    { titleKo: "멀티존 + 존별 바닥재", descKo: "근력·펑셔널·카디오를 존별로 구획하고 상업용 고무 바닥을 존별 맞춤. 2026 짐 디자인 베스트 프랙티스.", sourceKo: "Robert Hakes Construction 2026 gym design" },
    { titleKo: "AI 스마트 머신 전면화", descKo: "Technogym Biostrength 등 AI가 체형·근력 측정 후 운동 강도를 화면 추천. 트레이너 코칭 보조.", sourceKo: "뉴시스·파이낸셜뉴스 테크노짐 / inthenews AI 헬스장" },
    { titleKo: "바이오필릭 리커버리 존", descKo: "식물·리빙월 + 별도 리커버리/스트레칭 존. 부티크 감성을 대형 짐에 이식.", sourceKo: "biofit / Indigo Fitness 2026 gym trends" }
  ],
  furniture: [
    { itemKo: "프리웨이트 랙 + 덤벨 스토리지", descKo: "프리웨이트 존 핵심. 스쿼트 랙·파워 케이지 동반." },
    { itemKo: "AI 스마트 웨이트 머신", descKo: "체형·근력 자동 조절·화면 가이드 머신." },
    { itemKo: "라운지·리커버리 소파·식물", descKo: "부티크 무드 + 객단가 상승 라운지." }
  ],
  furnitureBrands: [
    { nameKo: "Technogym (테크노짐)", noteKo: "이탈리아 프리미엄. Biostrength AI 머신, Artis 라인이 특급호텔·고급 주거에 설치. 한국 공식몰 운영.", sourceKo: "technogymkr.com / 뉴시스·파이낸셜뉴스" },
    { nameKo: "Life Fitness (라이프피트니스)", noteKo: "프리미엄 상업 피트니스. 한국 공식 수입 유통.", sourceKo: "라이프피트니스 한국" },
    { nameKo: "Matrix Fitness", noteKo: "상업용 카디오·근력·그룹 트레이닝. 한국 법인 운영.", sourceKo: "matrixfitness.com/kr" }
  ],
  specialistFirms: [
    { nameKo: "인테리어젠틀맨", typeKo: "상업공간 매칭 플랫폼", noteKo: "헬스장 방음·바닥 하중·환기 시공 경험 업체 매칭.", sourceKo: "interiorgentleman.com" }
  ],
  caveatKo: "참고용입니다. 머신 가격·리스 조건·바닥 하중/방음은 견적·사례로 검증하세요."
},

"yoga-studio": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 라이트우드/먹빛",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트 비움 베이스에 라이트우드·먹빛 어시톤. 미니멀 젠 + 바이오필릭.",
    sourceKo: "Pantone Color of the Year 2026 / biofilico yoga studio design"
  },
  trends2026: [
    { titleKo: "바이오필릭 명상 공간 + 코르크 바닥", descKo: "식물·천창·천연 텍스처 바이오필릭. 코르크 바닥이 요가·명상 공간에서 인기.", sourceKo: "DreamHouse AI / biofilico 2026 gym·yoga design" },
    { titleKo: "곡선·유기적 셰이프", descKo: "아치·물결 등 부드러운 곡선으로 명상 몰입을 돕는 공간.", sourceKo: "Vogue Korea 2026 인테리어 트렌드 11" }
  ],
  furniture: [
    { itemKo: "원적외선 핫요가 패널 + 매트 수납", descKo: "36~40도 유지. 매트·블록·볼스터 수납장 동반." },
    { itemKo: "조도·사운드 시나리오 시스템", descKo: "DMX 조명 + 다채널 사운드. 룸별 자동 전환." },
    { itemKo: "코르크/우드 명상 소품·오브제", descKo: "바이오필릭 무드 소품." }
  ],
  furnitureBrands: [
    { nameKo: "Manduka (만두카)", noteKo: "프리미엄 요가 매트·프롭 글로벌 브랜드. 핫·아쉬탕가 스튜디오 표준.", sourceKo: "" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스", typeKo: "업종별 시공 매칭", noteKo: "요가·명상 스튜디오 환기·온열패널·방음 시공 경험 업체 매칭.", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용입니다. 핫요가 온열패널 전기·환기·방음 시공은 견적·사례로 검증하세요. Manduka 외 브랜드는 직접 확인 권장."
},

"crossfit-box": {
  colorTrend2026: {
    nameKo: "Silhouette 차콜 + 원색 그래픽 포인트",
    descKo: "Benjamin Moore 2026 'Silhouette'(차콜·에스프레소) 인더스트리얼 베이스에 박스 브랜드 원색 그래픽 포인트. 정통 박스 무드 유지.",
    sourceKo: "Benjamin Moore 2026 'Silhouette' / Indigo Fitness 2026 gym trends"
  },
  trends2026: [
    { titleKo: "존별 헤비듀티 바닥 시스템", descKo: "근력·펑셔널·카디오 존별로 상업용 고무 바닥을 맞춤. 데드리프트 충격·소음 방어.", sourceKo: "Robert Hakes Construction 2026 gym design" },
    { titleKo: "커뮤니티·부티크 정체성", descKo: "장비 중심을 넘어 커뮤니티·개인화·고유 경험을 반영한 다목적 공간으로 진화.", sourceKo: "Indigo Fitness 2026 gym design trends" }
  ],
  furniture: [
    { itemKo: "멀티 리그 + 풀업 럭", descKo: "4~12인용. 박스 정체성을 결정하는 시그니처 구조물." },
    { itemKo: "올림픽 바벨·범퍼·케틀벨 스토리지", descKo: "와드 다양성 기본 자재 + 정리 수납." },
    { itemKo: "타이머·스피커 시스템", descKo: "와드 구령·동기부여 핵심." }
  ],
  furnitureBrands: [
    { nameKo: "Rogue Fitness", noteKo: "CrossFit Games·USA Weightlifting 공식 공급. 리그·랙·바벨 선두 제조.", sourceKo: "Rogue Fitness / namu.wiki 크로스핏" },
    { nameKo: "ELEIKO (엘리코)", noteKo: "1957 설립 스웨덴. 올림픽·파워리프팅 바벨·원판 표준. 국내 신세계몰·11번가 유통.", sourceKo: "신세계몰 / cbinsights ELEIKO" }
  ],
  specialistFirms: [
    { nameKo: "인테리어젠틀맨", typeKo: "상업공간 매칭 플랫폼", noteKo: "크로스핏 박스 천장고·바닥 하중·방음 시공 경험 업체 매칭.", sourceKo: "interiorgentleman.com" }
  ],
  caveatKo: "참고용입니다. 리그 하중·바닥·방음(데드리프트)은 구조 검토·견적으로 반드시 검증하세요."
},

"golf-studio": {
  colorTrend2026: {
    nameKo: "Silhouette 다크우드 + Cloud Dancer 라운지 화이트",
    descKo: "Benjamin Moore 2026 'Silhouette'(다크 우드·차콜) 타석·부스 + Pantone 2026 'Cloud Dancer' 화이트 라운지 대비. 클럽하우스 무드.",
    sourceKo: "Benjamin Moore 2026 'Silhouette' / Pantone 2026"
  },
  trends2026: [
    { titleKo: "소셜 라운지·F&B 결합", descKo: "타석 외 라운지·바 카운터로 객단가 상승. 부티크 커뮤니티 경험 트렌드와 부합.", sourceKo: "Indigo Fitness 2026 gym design trends(커뮤니티)" },
    { titleKo: "데이터 기반 테크 무드", descKo: "트랙맨·골프존 비전 등 데이터 레슨을 전면화한 테크 스튜디오. 블랙·LED 라인 무드.", sourceKo: "김캐디 스크린골프 브랜드별 특징" }
  ],
  furniture: [
    { itemKo: "방음·방진 타석 부스", descKo: "24시간·심야 운영을 가능케 하는 핵심. 1타석 단위." },
    { itemKo: "라운지·바 카운터 + 소파", descKo: "F&B·소셜 매출 동력. 객단가 +30%." },
    { itemKo: "스윙 매트 + 퍼팅 그린", descKo: "부상·소음 방지." }
  ],
  furnitureBrands: [
    { nameKo: "골프존 (Vision/Vision Plus)", noteKo: "국내 최대 스크린골프. 4~4.5세대 비전 플러스가 대부분 매장 표준.", sourceKo: "golfzon.com / 김캐디" },
    { nameKo: "카카오VX (프렌즈 스크린 T/G)", noteKo: "캐릭터 결합으로 영골퍼 선호. 프렌즈 스크린 T·G 라인.", sourceKo: "kakaovx.com / 김캐디" },
    { nameKo: "SG골프·트랙맨", noteKo: "SG골프(필드)·트랙맨 등 데이터 정밀 레슨용 시뮬레이터.", sourceKo: "sggolf.com / 김캐디" }
  ],
  specialistFirms: [
    { nameKo: "인테리어젠틀맨", typeKo: "상업공간 매칭 플랫폼", noteKo: "스크린골프 타석 방음·천장고 시공 경험 업체 매칭.", sourceKo: "interiorgentleman.com" }
  ],
  caveatKo: "참고용입니다. 시뮬레이터 가격·천장고·방음 부스 시공은 본사 가맹 조건·견적으로 검증하세요."
},

"unmanned-fitness": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + LED 라인 테크",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 24시간 새벽 안전감·청결감 + LED 라인 테크 무드. 무인 운영 신뢰의 시각 언어.",
    sourceKo: "Pantone Color of the Year 2026 / Robert Hakes 2026 gym design"
  },
  trends2026: [
    { titleKo: "AI 셀프·스마트 머신 무인화", descKo: "Technogym Biostrength·미러·펠로톤 등 AI가 자세 교정·강도 추천. 트레이너 없는 무인 운영을 보완.", sourceKo: "뉴시스 테크노짐 / Mordor 스마트 홈 피트니스 / inthenews AI 헬스장" },
    { titleKo: "센서 LED·존별 바닥", descKo: "모션 센서 LED로 새벽 안전·전기료 동시 해결 + 존별 고무 바닥. 2026 짐 베스트 프랙티스.", sourceKo: "Robert Hakes Construction 2026 gym design" }
  ],
  furniture: [
    { itemKo: "출입·결제 키오스크", descKo: "회원 가입·결제·출입을 한 번에. 무인 운영 게이트." },
    { itemKo: "스마트 전자 락커 + 비상벨", descKo: "분실·안전 사고 0건 목표 보안 집기." },
    { itemKo: "AI 스마트 머신 + 모션센서 조명", descKo: "셀프 가이드 머신 + 새벽 안전 조명." }
  ],
  furnitureBrands: [
    { nameKo: "벤브라더스 (Ven Brothers)", noteKo: "피트니스 무인 키오스크 솔루션. 가입·결제·출입 통합.", sourceKo: "ven-brothers.com" },
    { nameKo: "Technogym (테크노짐)", noteKo: "Biostrength AI 머신으로 무인 셀프 가이드 운영 보완. 한국 공식몰.", sourceKo: "technogymkr.com / 뉴시스" }
  ],
  specialistFirms: [
    { nameKo: "큐플레이스", typeKo: "업종별 시공 매칭", noteKo: "무인 헬스장 CCTV·출입통제·HVAC 원격 제어 시공 경험 업체 매칭.", sourceKo: "qplace.kr" }
  ],
  caveatKo: "참고용입니다. 무인 운영은 CCTV·출입통제·보안·원격 HVAC가 핵심. 무인 헬스장 시공 사례 업체로 검증하세요."
},

  // ─────────────────────────────────────────────────────────
  // 리테일(RETAIL) 6 + 펫(PET) 6
  // ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
// RETAIL (6) — 2026 트렌드·가구브랜드·전문업체 보강
// ═══════════════════════════════════════════════════════════

"convenience-small": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 어시톤 우드 악센트",
    descKo: "Pantone 2026 'Cloud Dancer'(PANTONE 11-4201, 차분한 화이트)를 천장·벽 베이스로, 따뜻한 우드·테라코타 어시톤을 신선식품 코너 포인트로. 24시간 점포의 청결·안전감을 화이트가, 신선강화 코너의 식욕은 어시톤이 담당.",
    sourceKo: "Pantone Color of the Year 2026 / 보그코리아 2026 인테리어 트렌드(어시톤)",
  },
  trends2026: [
    { titleKo: "프레시푸드 비주얼 머천다이징 강화", descKo: "CU 피빅·GS25 신선강화 흐름 — 즉석조리·과일·샐러드를 입구 정면 시선 동선에 배치해 차별화. 곤도라보다 오픈 냉장 진열을 전면에.", sourceKo: "ampm 마케팅 인사이드 2026 트렌드" },
    { titleKo: "친환경 모듈·재활용 소재 집기", descKo: "리사이클 우드·리사이클 플라스틱 곤도라/사인이 리테일 표준화. 모듈형 진열대로 시즌 교체 시 폐기 최소화.", sourceKo: "Storefront / shopPOPdisplays 2026 retail display" },
    { titleKo: "K스테이션 관광형 큐레이션", descKo: "외국인 2000만 시대 — 명동·홍대 점포는 K-푸드·기념품 별도 존과 다국어 사이니지로 객단가 상승.", sourceKo: "ampm 마케팅 인사이드 2026 트렌드" },
  ],
  furniture: [
    { itemKo: "오픈형 중력식 곤도라(자동 전진)", descKo: "상품 판매 시 중력으로 뒷줄이 앞으로 밀려 진열 빈자리 최소화 — 무인·소인력 운영에 유리." },
    { itemKo: "오픈 멀티덱 냉장 쇼케이스", descKo: "음료·신선·HMR용 5단 오픈 쇼케이스. 매출 비중 절반 코너라 시인성·동선 최우선." },
    { itemKo: "엔드캡(곤도라 끝단) 프로모션 매대", descKo: "행사·신상품 집중 노출 — 충동구매 견인. 시즌별 교체로 재방문 자극." },
    { itemKo: "카운터 일체형 프레시푸드 워머·커피 스테이션", descKo: "계산대 옆 즉석조리·원두커피 통합 — 동선 줄이고 연계구매 유도." },
  ],
  furnitureBrands: [
    { nameKo: "세대산전(AutoFront)", noteKo: "중력식 자동전진 곤도라 시스템 제조 — 진열 빈자리 자동 보충, 편의점·마트 집기.", sourceKo: "seidae.net" },
    { nameKo: "한성쇼케이스(한성아이스테크)", noteKo: "반찬·꽃·카페·편의점용 냉장 쇼케이스 제작 브랜드.", sourceKo: "hansungicetech.itpage.kr" },
    { nameKo: "대성팩(daesungpack)", noteKo: "중앙형·벽면형 곤도라 등 매장 진열집기 공급.", sourceKo: "daesungpack.com" },
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "시공실적·후기 보유 업체 약 400곳, 업종별 포트폴리오 7,000건+·무료 견적·하자 보상 안내. 편의점·소매점 시공사 매칭에 활용.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 자료 — 본사 표준 사양·집기 사양이 강제되는 경우가 많고, 브랜드·플랫폼 정보는 시점에 따라 변동되니 직접 검증 권장.",
},

"lifestyle-goods": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 베이스 + 어시톤·플랜테리어",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트를 깔끔한 갤러리 배경으로 두고, 모래·올리브·테라코타 어시톤과 식물(플랜테리어)로 감성 라이프스타일 무드. 잡화의 컬러를 죽이지 않는 중성 배경이 핵심.",
    sourceKo: "Pantone Color of the Year 2026 / 보그코리아 2026(어시톤)",
  },
  trends2026: [
    { titleKo: "소프트 미니멀리즘 + 부드러운 곡선", descKo: "차갑지 않은 미니멀 — 텍스처·웜 중성톤과 곡선 집기로 좁은 매장도 넓고 편안하게.", sourceKo: "Threads reon_design_group / 보그코리아 2026" },
    { titleKo: "업사이클·재활용 가구 진열", descKo: "리사이클 목재·업사이클 가구가 잡화 매장 진열대의 새 표준 — 친환경 가치 소비층 공략.", sourceKo: "Shopify 2026 홈퍼니싱 트렌드" },
    { titleKo: "경험형(experiential)·시즌 디스플레이", descKo: "월 1회 시즌 디스플레이 교체로 재방문·SNS 공유 유도. 단순 진열을 넘어 '둘러보는 경험'.", sourceKo: "Storefront Top 10 Retail Trends 2026" },
  ],
  furniture: [
    { itemKo: "목재·철망 혼합 오픈 진열대", descKo: "라이트우드 선반 + 철망 사이드로 잡화 고밀도 진열·시선 유도." },
    { itemKo: "쇼윈도·시즌 디스플레이 가구", descKo: "입구 쇼윈도 세트 — 매장 첫인상·시즌 테마 연출의 핵심." },
    { itemKo: "라탄·우드 수납 바스켓·큐브", descKo: "디스플레이 겸 수납 — 상품을 담은 채로 진열 효과." },
    { itemKo: "플랜테리어 행잉·스탠드", descKo: "드라이플라워·행잉플랜트로 자연친화 시그니처 무드." },
  ],
  furnitureBrands: [
    { nameKo: "진열샵(DisplayShop)", noteKo: "진열장·쇼케이스·카운터·피팅룸 등 목재 매장 집기 제작 공장.", sourceKo: "displayshop.kr" },
    { nameKo: "샵앤몰(ShopAndMall)", noteKo: "마네킹·행거·디스플레이 등 매장 진열 집기 전문 공급.", sourceKo: "shopandmall.co.kr" },
  ],
  specialistFirms: [
    { nameKo: "오늘의집(버킷플레이스)", typeKo: "라이프스타일·인테리어 슈퍼앱·커머스", noteKo: "인테리어 사진·시공·가구 커머스 통합 — 잡화 매장 무드보드·소품 소싱 레퍼런스로 활용. MAU 약 347만(2024).", sourceKo: "ohou.se / 버킷플레이스 회사소개" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "업종별 포트폴리오·시공사 매칭. 소매·편집숍 시공사 탐색에 활용.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 트렌드·브랜드 정보는 시점에 따라 변하므로 견적·시공 전 직접 검증 권장.",
},

"beauty-supplies": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 클리니컬 뉴트럴",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트를 청결·발색의 캔버스로 사용하고, 따뜻한 어시 뉴트럴로 'Self-Clinical' 무드 보완. 색조 제품의 실제 발색을 왜곡하지 않는 무채색 배경이 구매 전환의 전제.",
    sourceKo: "Pantone Color of the Year 2026 / 보그코리아 2026",
  },
  trends2026: [
    { titleKo: "셀프 클리니컬·진단형 체험", descKo: "AI 피부진단·셀프 테스터로 '데이터 기반 추천' 경험 제공 — 올리브영형 체험 매장의 핵심.", sourceKo: "NRF / Storefront 2026 retail trends(experiential)" },
    { titleKo: "피지털(Phygital) 통합", descKo: "QR·AR 가상 메이크업·앱 적립 연동으로 온·오프 경계 소멸. EuroShop 2026의 성숙기 트렌드.", sourceKo: "EuroShop 2026 / caad-design" },
    { titleKo: "재활용 아크릴·모듈 디스플레이", descKo: "리사이클 아크릴 테스터대·모듈 진열로 시즌 교체 폐기 절감 — 지속가능성 소구.", sourceKo: "shopPOPdisplays 2026 retail display" },
  ],
  furniture: [
    { itemKo: "유리·아크릴 컬러 큐레이션 진열대", descKo: "색상별 큐레이션 + 테스터 동선 — 발색 확인이 곧 구매." },
    { itemKo: "셀프 테스터·미러 카운터", descKo: "거울+링라이트 셀프 체험존 — 체류·후기 유도." },
    { itemKo: "CRI 95+ 스팟·트랙 조명 시스템", descKo: "색조 발색 정확도가 전환율을 좌우하는 조명 집기." },
    { itemKo: "포토·셀카 미러월", descKo: "인스타·틱톡 후기 노출용 셀프 포토존." },
  ],
  furnitureBrands: [
    { nameKo: "진열샵(DisplayShop)", noteKo: "유리·아크릴 진열장·쇼케이스·카운터 제작 — 화장품 컬러 큐레이션 진열에 활용.", sourceKo: "displayshop.kr" },
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "뷰티·소매 포트폴리오·시공사 매칭, 무료 견적·하자 보상 안내.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 화장품 매장 집기·조명은 발색 검증이 중요하므로 실물 샘플·시공사 직접 확인 권장.",
},

"fashion-accessories": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트박스 + 테일러드 클래식 톤",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트박스 갤러리 배경에 월넛·아이보리·슬레이트 등 '테일러드 클래식' 톤을 가구·집기로. 옷의 컬러·소재를 정확히 보여주는 중성 배경이 핵심.",
    sourceKo: "Pantone Color of the Year 2026 / ampm 마케팅 인사이드 2026(테일러드 클래식)",
  },
  trends2026: [
    { titleKo: "조용한 럭셔리·테일러드 클래식", descKo: "절제된 고급스러움 — 클래식 품격과 현대 감각의 공존이 2026 핵심 무드.", sourceKo: "ampm 마케팅 인사이드 2026" },
    { titleKo: "피지털 피팅·AR 트라이온", descKo: "AR 가상 피팅·모바일 체크아웃으로 피팅룸 대기 해소 — 매장 회전·전환 동시 개선.", sourceKo: "EuroShop 2026 / caad-design(phygital)" },
    { titleKo: "경험형 매장·포토 콘텐츠", descKo: "멀티센서리 경험·셀카 미러월로 체류시간·SNS 공유 극대화.", sourceKo: "Storefront Top 10 Retail Trends 2026" },
  ],
  furniture: [
    { itemKo: "시스템 폴·스탠드 행거", descKo: "벽면 시스템 폴 + 이동 행거로 SKU 유연 배치." },
    { itemKo: "마네킹·바디폼 세트", descKo: "핵심 룩 4~6세트가 매출을 견인하는 디스플레이 집기." },
    { itemKo: "삼면거울·피팅룸", descKo: "구매 전환의 마지막 관문 — 조명·거울 품질이 결정적." },
    { itemKo: "셀카 미러월·네온 사인", descKo: "Z세대 후기 노출용 포토존 집기." },
  ],
  furnitureBrands: [
    { nameKo: "샵앤몰(ShopAndMall)", noteKo: "마네킹·옷걸이·행거 등 의류매장 디스플레이 집기 전문.", sourceKo: "shopandmall.co.kr" },
    { nameKo: "진열샵(DisplayShop)", noteKo: "행거·카운터·피팅룸·알루미늄 진열장 제작 공장.", sourceKo: "displayshop.kr" },
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "패션·편집숍 포트폴리오·시공사 매칭. 무료 견적·하자 보상 안내.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 브랜드·플랫폼 정보는 변동되며 피팅·조명은 실물 확인이 중요하므로 직접 검증 권장.",
},

"health-food-store": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 세이지·우드 웰니스 톤",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 클리니컬한 신뢰감을, 세이지 그린·웜 우드 어시톤으로 웰니스·자연 신뢰감을 동시에. 건기식 라벨 시인성을 살리는 밝은 배경이 기본.",
    sourceKo: "Pantone Color of the Year 2026 / 보그코리아 2026(어시톤)",
  },
  trends2026: [
    { titleKo: "헬시 플레저·웰니스 라운지화", descKo: "단순 판매대를 넘어 시음·상담 라운지로 — 체류·신뢰가 객단가를 견인.", sourceKo: "ampm 마케팅 인사이드 2026 / 보그코리아 2026" },
    { titleKo: "체험형 헬스케어 진단", descKo: "체성분·혈압·AI 추천 키오스크로 데이터 기반 추천 — 약국·건기식 매장 차별화.", sourceKo: "NRF / Storefront 2026(experiential)" },
    { titleKo: "성분·효능 디지털 사이니지", descKo: "'필요한 것만 믿고 사는' 소비자에게 성분·근거 정보를 디지털 POP로 투명 제공.", sourceKo: "shopPOPdisplays 2026 retail display" },
  ],
  furniture: [
    { itemKo: "오픈 진열장(약국·서점식)", descKo: "전면 노출 + 라벨 시인성 중심의 오픈 셀프 진열." },
    { itemKo: "냉장 쇼케이스(프로바이오틱스·음료)", descKo: "신선 건강식·냉장 보관 제품 진열 집기." },
    { itemKo: "상담 카운터·시음 웰니스 라운지", descKo: "1:1 영양 상담·시음존 — 체류·재방문 동력." },
    { itemKo: "성분·효능 디지털 사이니지", descKo: "POP+사이니지로 근거 기반 정보 전달." },
  ],
  furnitureBrands: [
    { nameKo: "한성쇼케이스(한성아이스테크)", noteKo: "냉장 쇼케이스 제작 — 프로바이오틱스·음료 건강식 냉장 진열에 활용.", sourceKo: "hansungicetech.itpage.kr" },
    { nameKo: "진열샵(DisplayShop)", noteKo: "오픈 진열장·카운터·상담 데스크 등 목재 집기 제작.", sourceKo: "displayshop.kr" },
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "약국·건강식품 매장 포트폴리오·시공사 매칭, 무료 견적.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 건기식·약국은 의약외품 진열·표시 규정이 별도이며 정보는 변동되니 직접 검증 권장.",
},

"unmanned-retail": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 테크 라이트",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 24시간 무인 점포의 청결·안전감을, LED 라인·디지털 사이니지의 쿨 라이트로 테크 신뢰감을. 새벽 단독 고객의 안심감을 좌우하는 밝은 균질 조명이 핵심.",
    sourceKo: "Pantone Color of the Year 2026",
  },
  trends2026: [
    { titleKo: "AI 비전·이상행동 감지 보안", descKo: "지능형 CCTV가 피플카운팅·히트맵·이상행동 감지·알림까지 — 무인 운영의 1차 방어선이자 동선 데이터 자산.", sourceKo: "보안뉴스(슈프리마 AI 무인매장)" },
    { titleKo: "클라우드·원격 IoT 통합 제어", descKo: "조명·냉난방·POS·CCTV를 앱 하나로 원격 점검 — 다점포·부업 운영의 핵심.", sourceKo: "파이낸셜뉴스(토마토 키오스크) / 보안뉴스(성현시스템)" },
    { titleKo: "24h 동선·셀프 결제 최적화", descKo: "키오스크·셀프결제 동선과 야간 안전 조명 설계가 매출·도난율을 동시에 좌우.", sourceKo: "테크42 무인매장 / 한국소매 셀프서비스 키오스크 전망 2026~2033" },
  ],
  furniture: [
    { itemKo: "셀프 결제 키오스크·카운터", descKo: "무인 운영의 절대 핵심 — 동선 끝단 배치." },
    { itemKo: "오픈 냉장·아이스크림 냉동 쇼케이스", descKo: "무인 아이스크림·HMR 매출의 대부분을 담는 진열 집기." },
    { itemKo: "스마트 출입통제·전자도어록", descKo: "심야 무인 입출입 통제 인프라." },
    { itemKo: "AI CCTV·이상행동 감지 모듈", descKo: "도난·미결제 방어 + 동선 데이터 수집." },
  ],
  furnitureBrands: [
    { nameKo: "한성쇼케이스(한성아이스테크)", noteKo: "냉장 쇼케이스 제작 — 무인 매장 음료·신선 진열에 활용.", sourceKo: "hansungicetech.itpage.kr" },
  ],
  specialistFirms: [
    { nameKo: "슈프리마(Suprema)", typeKo: "AI 무인매장 통합 보안 솔루션", noteKo: "출입 인증·지능형 CCTV(피플카운팅·히트맵·이상행동 감지)·원격 제어·매장관리 앱 패키지. 2025 우수기술 패키지형 보급사업 도소매 공급기업.", sourceKo: "보안뉴스 2025" },
    { nameKo: "토마토 키오스크(리테일앤인사이트)", typeKo: "클라우드 무인매장 키오스크·ERP 솔루션", noteKo: "토마토솔루션 ERP 연동, 소비자·관리자 앱으로 무인 운영 지원.", sourceKo: "파이낸셜뉴스" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "무인 매장 시공사 탐색·견적 비교에 활용.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 솔루션 사양·월 사용료·보안 기능은 업체별 상이하고 변동되니 계약 전 직접 검증 권장.",
},

// ═══════════════════════════════════════════════════════════
// PET (6) — 2026 트렌드·펫가구브랜드·전문업체 보강
// ═══════════════════════════════════════════════════════════

"pet-grooming": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 세이지·우드 힐링 톤",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 위생·청결의 신뢰감을, 세이지 그린·원목 어시톤으로 펫·보호자 모두를 안정시키는 스파 무드. 시술 영상에서 깨끗하게 보이는 밝은 화이트가 신뢰의 전제.",
    sourceKo: "Pantone Color of the Year 2026 / 보그코리아 2026(어시톤)",
  },
  trends2026: [
    { titleKo: "펫테리어 시장 급성장", descKo: "반려동물 가구 시장 2023년 약 20억 달러→2033년 약 37억 달러(연 6.3% 성장) 전망 — 전용 가구·집기 수요 확대.", sourceKo: "데일리팝(반려동물 가구 시장)" },
    { titleKo: "시술 투명성·보호자 안심 모니터링", descKo: "시술 CCTV 실시간 공유가 신뢰 1순위 — 공간 설계 단계부터 카메라 동선·시야 확보.", sourceKo: "데일리벳(동물 시설 인테리어 일반론) ※일반 서술" },
    { titleKo: "펫 친화 바닥재 채택", descKo: "내구·저소음·고탄력 펫 전용 PVC 바닥재로 미끄럼·슬개골 부담 저감(예: 홈씨씨 '숲 도담').", sourceKo: "데일리팝(KCC글라스 홈씨씨 펫 바닥재)" },
  ],
  furniture: [
    { itemKo: "전동 승강 그루밍 테이블 + 안전 암", descKo: "허리 부담 저감·시술 효율 — 안전 거치대(암) 필수." },
    { itemKo: "스테인리스 그루밍 욕조 + 온수기", descKo: "허리 높이·미끄럼방지·대형견 사이즈 분리." },
    { itemKo: "고속 드라이어 + 환기 후드", descKo: "털 비산 차단 천장 후드로 호흡기 안전·인접 클레임 방지." },
    { itemKo: "사이즈별 대기 켄넬", descKo: "시술 전후 대기 — 항균·내수 바닥과 세트." },
  ],
  furnitureBrands: [
    { nameKo: "헤디스그루밍(Hedys Grooming)", noteKo: "대·중·소 및 원형/사각 상판 애견 미용 테이블 전문 브랜드.", sourceKo: "hedysgrooming.co.kr" },
    { nameKo: "하성(HASUNG)", noteKo: "이미용·반려동물 미용용품 제조 — 미용 테이블·집기 라인.", sourceKo: "hasungimall.com" },
    { nameKo: "오스터(모어플러스)", noteKo: "벽걸이형 반려동물 목욕 전용 테이블(최대 약 30kg 지지).", sourceKo: "linkonbiz.com 오스터" },
  ],
  specialistFirms: [
    { nameKo: "스탠다드플러스(Standard+)", typeKo: "동물 시설 전문 건축·인테리어", noteKo: "동물병원·동물 시설 특화 — 기획·설계·인허가·시공·오픈 원스톱. 그루밍·복합 펫 시설에 응용 가능.", sourceKo: "데일리벳" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "펫·동물 시설 시공사 매칭·견적 비교에 활용.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 동물미용업은 위생·환기 규정이 별도이며 브랜드·시장 수치는 변동되니 직접 검증 권장.",
},

"pet-supplies": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 우드·옐로 친화 악센트",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 청결·프리미엄감을, 웜 우드와 밝은 옐로/민트 악센트로 친근한 펫 무드. 사료·용품 패키지 컬러가 살아나는 중성 배경이 기본.",
    sourceKo: "Pantone Color of the Year 2026",
  },
  trends2026: [
    { titleKo: "펫테리어·전용 가구 수요 확대", descKo: "반려동물 가구 시장 연 6.3% 성장(2033년 약 5조원) — 용품점도 펫 전용 가구 코너를 별도 큐레이션.", sourceKo: "데일리팝(반려동물 가구 시장)" },
    { titleKo: "프리미엄 사료 냉장·생식 강화", descKo: "생식·동결건조·습식 냉장 진열로 객단가 상승 — 청결·신선 보관 동선 설계.", sourceKo: "데일리팝 / 보그코리아 2026(웰니스 흐름) ※일반 서술" },
    { titleKo: "복합화(용품+미용+호텔) 동선 분리", descKo: "한 매장 내 용품·미용·위탁을 연계하되 위생 동선은 명확히 분리 — 체류·연계매출 극대화.", sourceKo: "Storefront 2026(experiential) ※일반 서술" },
  ],
  furniture: [
    { itemKo: "카테고리별 오픈 곤도라 + 사료 바이저", descKo: "사료는 직사광 차단·밀폐 보관, 용품은 시인성 중심 배치." },
    { itemKo: "프리미엄 사료 냉장 쇼케이스", descKo: "생식·동결건조·습식 보관 — 프리미엄 객단가 견인." },
    { itemKo: "펫 전용 가구 큐레이션 매대", descKo: "방석·하우스·캣타워 등 펫테리어 가구 별도 존." },
    { itemKo: "분양·상담 분리룸 케이지", descKo: "동물판매업 시설 기준 충족 + 상담 분리." },
  ],
  furnitureBrands: [
    { nameKo: "4CAT", noteKo: "가구 제조 노하우 기반 펫 전용 가구 브랜드 — 캣타워·하우스 등.", sourceKo: "4cat.co.kr" },
    { nameKo: "딩동펫(DingdongPet)", noteKo: "자체제작 프리미엄 반려동물 용품·가구 브랜드.", sourceKo: "dingdongpet.net" },
    { nameKo: "한성쇼케이스(한성아이스테크)", noteKo: "냉장 쇼케이스 제작 — 프리미엄 사료·생식 냉장 진열에 활용.", sourceKo: "hansungicetech.itpage.kr" },
  ],
  specialistFirms: [
    { nameKo: "스탠다드플러스(Standard+)", typeKo: "동물 시설 전문 건축·인테리어", noteKo: "동물 시설 특화 원스톱 — 펫샵·복합 펫시설 응용.", sourceKo: "데일리벳" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "펫샵 시공사 매칭·견적 비교.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 동물판매업 시설 기준·사료법 보관 규정이 별도이며 시장 수치·브랜드는 변동되니 직접 검증 권장.",
},

"pet-hotel": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 캄 베이지·소프트 우드",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 위생·신뢰감을, 차분한 베이지·소프트 우드로 분리불안·노령견의 심리 안정. 라이브 스트리밍 화면에서 청결하게 보이는 밝은 톤이 보호자 신뢰의 전제.",
    sourceKo: "Pantone Color of the Year 2026 / 보그코리아 2026(어시톤)",
  },
  trends2026: [
    { titleKo: "펫 프렌들리 숙박·종합 케어 확산", descKo: "펫호텔·펫수영장·펫라운지를 갖춘 펫 프렌들리 숙박이 확산 — 단순 위탁을 넘어 종합 케어 공간화.", sourceKo: "한국아파트신문 / 비욘드아파트먼트(펫 프렌들리)" },
    { titleKo: "방음·개별 환기·온습도 분리 제어", descKo: "다견 동시 입실 — 룸별 방음·환기·온습도 분리가 동물복지·민원 방지의 핵심.", sourceKo: "데일리벳(동물 시설 환경 일반론) ※일반 서술" },
    { titleKo: "전 룸 실시간 스트리밍 신뢰 인프라", descKo: "보호자 앱 라이브 연동이 펫호텔 신뢰 1순위 — 설계 단계부터 카메라·네트워크 배선 반영.", sourceKo: "데일리팝/한국아파트신문(펫케어 서비스 일반) ※일반 서술" },
  ],
  furniture: [
    { itemKo: "사이즈별 스테인리스 켄넬 + 분리 룸", descKo: "견종별 분리(동물위탁관리업) — 소·중·대형 룸 구분." },
    { itemKo: "전 룸 CCTV + 보호자 스트리밍 시스템", descKo: "24h 라이브 — 분리불안 보호자 안심의 핵심 인프라." },
    { itemKo: "개별 환기·항균/항취·온습도 제어", descKo: "냄새·세균 차단과 동물복지 환경 유지." },
    { itemKo: "셀프 워시 부스 + 트렌치 배수", descKo: "체크인·아웃 간단 세척·청결 마무리." },
  ],
  furnitureBrands: [
    { nameKo: "4CAT", noteKo: "펫 전용 가구 브랜드 — 캄 캐빈·휴식 공간 가구 응용.", sourceKo: "4cat.co.kr" },
    { nameKo: "딩동펫(DingdongPet)", noteKo: "프리미엄 반려동물 가구·용품 — 스위트룸 비품 응용.", sourceKo: "dingdongpet.net" },
  ],
  specialistFirms: [
    { nameKo: "스탠다드플러스(Standard+)", typeKo: "동물 시설 전문 건축·인테리어", noteKo: "동물병원·동물 시설 특수 건축 — 방음·환기·켄넬 설계 노하우. 펫호텔에 응용 적합.", sourceKo: "데일리벳" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "펫호텔·펫유치원 시공사 매칭·견적 비교.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 동물위탁관리업은 견종 분리·환기 등 시설 기준이 별도이며 정보는 변동되니 직접 검증 권장.",
},

"pet-cafe": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 파스텔·플랜트 악센트",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 위생감을, 파스텔·식물 악센트로 SNS 친화 플레이풀 무드. 동물·취식 공간 분리 속에서도 청결하게 보이는 밝은 톤이 재방문을 좌우.",
    sourceKo: "Pantone Color of the Year 2026",
  },
  trends2026: [
    { titleKo: "펫 프렌들리·동반 공간 수요 확산", descKo: "반려동물 동반 카페·숙박 수요 증가 — 펫카페·펫파크가 보편화되는 흐름.", sourceKo: "한국아파트신문 / 비욘드아파트먼트(펫 프렌들리)" },
    { titleKo: "내구·저소음 펫 바닥재 채택", descKo: "배변·발톱·소음에 강한 펫 전용 PVC 바닥(고탄력·긁힘 강화)로 청결·내구 확보(예: 홈씨씨 '숲 도담').", sourceKo: "데일리팝(KCC글라스 펫 바닥재)" },
    { titleKo: "경험형·SNS 포토 공간화", descKo: "놀이공간·포토존으로 체류·SNS 공유 유도 — 입장료+음료 객단가 모델.", sourceKo: "Storefront 2026(experiential) ※일반 서술" },
  ],
  furniture: [
    { itemKo: "동물·취식 공간 분리 가림막 + 손소독기", descKo: "식품위생법상 분리 의무 — 별도 환기 세트." },
    { itemKo: "고용량 환기·대형 공기청정기", descKo: "다견+음식 공간의 냄새·털 비산 차단." },
    { itemKo: "내구·항균 PVC 바닥 + 트렌치 배수", descKo: "배변 사고 대비 청소·배수 동선." },
    { itemKo: "이중 도어·게이트(탈출 방지)", descKo: "동물 외부 이탈 방지 안전 집기." },
  ],
  furnitureBrands: [
    { nameKo: "4CAT", noteKo: "펫 전용 가구 — 캣타워·다층 구조 등 카페 놀이공간 가구 응용.", sourceKo: "4cat.co.kr" },
    { nameKo: "딩동펫(DingdongPet)", noteKo: "프리미엄 펫 용품·가구 — 카페 비품·놀이기구 응용.", sourceKo: "dingdongpet.net" },
  ],
  specialistFirms: [
    { nameKo: "스탠다드플러스(Standard+)", typeKo: "동물 시설 전문 건축·인테리어", noteKo: "동물 시설 환기·위생 설계 노하우 — 펫카페 동물/취식 분리 설계에 응용.", sourceKo: "데일리벳" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "펫카페·강아지/고양이 카페 시공사 매칭.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 펫카페는 식품위생법상 동물/취식 공간 분리·환기 규정이 핵심이며 정보는 변동되니 직접 검증 권장.",
},

"pet-training-school": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 그린·우드 집중 톤",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트 베이스에 세이지 그린·우드 어시톤으로 차분한 집중 환경. 훈련 영상·실내 인조잔디가 깔끔하게 보이는 밝은 톤이 보호자 신뢰의 전제.",
    sourceKo: "Pantone Color of the Year 2026 / 보그코리아 2026(어시톤)",
  },
  trends2026: [
    { titleKo: "펫 프렌들리·전문 훈련 수요 확대", descKo: "펫팸족 천만 시대 — 문제행동 교정·퍼피 클래스 등 전문 훈련 시설 수요 증가.", sourceKo: "하이마트 홈스매거진(펫팸족) / 비욘드아파트먼트" },
    { titleKo: "훈련 투명성·영상 공유", descKo: "일일 훈련 영상 공유가 위탁 신뢰 핵심 — 설계 단계부터 카메라 동선·녹화 인프라 반영.", sourceKo: "데일리벳(동물 시설 일반론) ※일반 서술" },
    { titleKo: "관절 보호 바닥·방음 강화", descKo: "충격흡수 매트·인조잔디로 슬개골 보호, 짖음·호각 소리 외부 차음으로 민원 방지.", sourceKo: "데일리팝(펫 바닥재) ※일반 서술" },
  ],
  furniture: [
    { itemKo: "어질리티 장비 + 인조잔디 트레이닝장", descKo: "터널·허들·시소 등 — 관절 보호 인조잔디 세트." },
    { itemKo: "충격흡수 매트 바닥", descKo: "점프·드롭 훈련 시 부상 방지." },
    { itemKo: "1:1 집중 룸 + 분리 켄넬", descKo: "위탁 훈련 1견 1켄넬·집중 분리 공간." },
    { itemKo: "외부 차음·방음 벽체", descKo: "짖음·호각 소음 인접 민원 차단." },
  ],
  furnitureBrands: [
    { nameKo: "4CAT", noteKo: "펫 전용 가구 — 휴식·대기 공간 가구 응용.", sourceKo: "4cat.co.kr" },
    { nameKo: "딩동펫(DingdongPet)", noteKo: "프리미엄 펫 용품 — 훈련 보조 용품·휴식 비품 응용.", sourceKo: "dingdongpet.net" },
  ],
  specialistFirms: [
    { nameKo: "스탠다드플러스(Standard+)", typeKo: "동물 시설 전문 건축·인테리어", noteKo: "동물 시설 방음·켄넬 설계 노하우 — 훈련소에 응용 적합.", sourceKo: "데일리벳" },
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "애견 훈련소·도그스쿨 시공사 매칭.", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 위탁훈련은 동물위탁관리업 시설 기준·방음 규정이 별도이며 정보는 변동되니 직접 검증 권장.",
},

"pet-walking-visit": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 웜 우드 (소규모 거점/홈오피스)",
    descKo: "매장 없는 방문·산책 서비스라 인테리어 비중은 낮음. 소규모 거점·홈오피스 기준 — Pantone 2026 'Cloud Dancer' 화이트 + 웜 우드로 상담·교육 공간만 깔끔하게. 보호자 첫 미팅 신뢰감만 확보하면 충분.",
    sourceKo: "Pantone Color of the Year 2026",
  },
  trends2026: [
    { titleKo: "거점 최소화·플랫폼 중심 운영", descKo: "방문 서비스 특성상 매장 투자 대신 매칭 앱·GPS 트래킹 등 운영 인프라에 집중하는 흐름.", sourceKo: "한국아파트신문/비욘드아파트먼트(펫케어 서비스) ※일반 서술" },
    { titleKo: "펫 프렌들리·돌봄 수요 확대", descKo: "펫팸족 증가로 산책·방문 돌봄 수요 확대 — 소규모 거점+커뮤니티 모델 등장.", sourceKo: "하이마트 홈스매거진(펫팸족)" },
  ],
  furniture: [
    { itemKo: "상담·교육용 멀티 데스크", descKo: "소규모 거점/홈오피스 — 신규 견주 상담·펫시터 교육 겸용." },
    { itemKo: "장비 보관 락커(리쉬·하네스)", descKo: "펫시터 개인 락커 + 공용 장비창고로 위생·분실 관리." },
    { itemKo: "반려동물 동반 상담석", descKo: "항균 매트·간식 비치한 소형 동반 상담 공간." },
  ],
  furnitureBrands: [
    { nameKo: "딩동펫(DingdongPet)", noteKo: "리쉬·하네스·캐리어 등 산책·방문 장비 소싱에 활용.", sourceKo: "dingdongpet.net" },
  ],
  specialistFirms: [
    { nameKo: "큐플레이스(Qplace)", typeKo: "상업공간 인테리어 비교견적 플랫폼", noteKo: "소규모 사무실·거점 시공이 필요할 때 시공사 매칭에 활용(인테리어 비중 낮음).", sourceKo: "qplace.kr" },
  ],
  caveatKo: "참고용 — 매장 없는 방문 서비스라 인테리어 비중이 낮으므로 거점 투자 최소화·운영 인프라 우선. 정보는 변동되니 직접 검증 권장.",
},

  // ─────────────────────────────────────────────────────────
  // 교육(EDUCATION) 6 + 생활서비스(LIVING-SERVICE) 6
  // ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
// EDUCATION (6) — 2026 트렌드 + 가구 브랜드 + 특화 업체
// ═══════════════════════════════════════════════════════════

"study-room": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 에스프레소 우드 대비",
    descKo: "Pantone 2026 올해의 컬러 'Cloud Dancer'(11-4201, 차분한 화이트)를 전체 톤으로, 벤자민무어 2026 'Silhouette'(에스프레소·차콜)을 부스 프레임·바닥에 대비로 사용. 화이트가 '집중을 돕고 외부 자극을 덜어준다'는 Pantone 해설이 독서실 콘셉트와 정확히 맞음.",
    sourceKo: "Pantone Color of the Year 2026 (pantone.com), Benjamin Moore 2026 Silhouette",
  },
  trends2026: [
    { titleKo: "소프트 미니멀리즘 (Soft Minimalism)",
      descKo: "차갑지 않은 미니멀 — 화이트·중성톤 베이스에 패브릭 흡음재·러그로 질감을 더해 부스 밀집 공간의 압박감을 완화. 2026 한국 인테리어 핵심 키워드.",
      sourceKo: "Vogue Korea 2026 인테리어 트렌드 11, reon_design_group" },
    { titleKo: "바이오필릭 집중 환경",
      descKo: "실내 환경(채광·식물·천장 높이)이 집중·창의에 미치는 영향을 다룬 신경건축 연구가 늘며, 장기 수험생 좌석 구역에 식물·자연광을 배치하는 흐름.",
      sourceKo: "NCBI PMC11645023 (Brain/Subjective Responses to Indoor Environments)" },
    { titleKo: "조도 분리 + 현수형 흡음 패널",
      descKo: "전체 저조도 + 좌석 고조도 분리에 더해, 천장 현수형 음향 패널이 음성 이해도·집중력의 핵심 물리 변수로 연구됨. 부스 위 흡음 패널 시공 확대.",
      sourceKo: "교실 음향 연구 (NCBI PMC4304827)" },
  ],
  furniture: [
    { itemKo: "방염 인증 1인 독립 부스 (모듈 조합형)",
      descKo: "평수에 맞춰 4·6·8석 모듈로 조합. 작심 등 프랜차이즈가 시그니처 모듈을 표준화 — 부스당 칸막이·도어·LED 일체형." },
    { itemKo: "인체공학 학습 의자 (장시간 착석)",
      descKo: "요추 지지·메시 등판의 사무/학생용 의자. 4~8시간 착석 전제 — 좌판 쿠션·높이 조절이 재방문율 직결." },
    { itemKo: "좌석 일체형 LED 스탠드 + 콘센트·USB",
      descKo: "좌석마다 색온도 조절 LED + 멀티탭(USB-C 포함). 노트북·태블릿 충전 부족이 클레임 1순위." },
    { itemKo: "공용 라운지 카페 가구 + 사물함",
      descKo: "캡슐머신·정수기 코너와 라운지 소파, 개인 사물함. 스터디카페 진화형 체류·재방문 유도." },
  ],
  furnitureBrands: [
    { nameKo: "시디즈 (SIDIZ)",
      noteKo: "T50은 사무·병원·학원에서 널리 쓰이는 베스트셀러 의자 — 헤드레스트·요추지지·조절 좌판. 학생용 '링고' 라인도 보유.",
      sourceKo: "sidiz.com, kr.sidiz.com" },
    { nameKo: "퍼시스 (FURSYS)",
      noteKo: "국내 대표 사무가구. '도서관&기숙사' 전용 카테고리로 열람 책상·칸막이·캐럴(독립열람석) 라인업 보유.",
      sourceKo: "fursys.com 도서관&기숙사 카테고리" },
    { nameKo: "코아스 (KOAS)",
      noteKo: "사무·교육·기숙사 가구 종합 — 책상·의자·서랍·파티션. 모듈 데스크 + 이동서랍 세트로 좌석 단가 절감.",
      sourceKo: "koasmall.com" },
  ],
  specialistFirms: [
    { typeKo: "프랜차이즈 인테리어",
      nameKo: "작심디자인그룹 (작심스터디카페)",
      noteKo: "국내 1위 스터디카페 브랜드 인테리어 담당 — 평수별 모듈 조합형 시그니처 공간 제공.",
      sourceKo: "zaksim.co.kr" },
    { typeKo: "전문 시공·매칭",
      nameKo: "굿테리어 / 916er (구공일육)",
      noteKo: "독서실·스터디카페 3D 사전 시각화·견적 비교 플랫폼. 방음·전기배선·사물함 수 등 체크포인트 표준화.",
      sourceKo: "goodterior.com, 916er.com, qplace.kr" },
  ],
  caveatKo: "참고용 정보입니다. 브랜드 라인업·가격은 변동되니 발주 전 공식몰·대리점에서 직접 검증하시기 바랍니다.",
},

"kids-academy": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 베이스 + 어스톤 포인트",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트를 안전·청결 베이스로, 테라코타·카라멜 등 2026 어스톤을 포인트 벽에 사용. 자극적 원색 대신 차분한 따뜻함 — 학부모 안심 + 아동 정서 안정.",
    sourceKo: "Pantone 2026, Vogue Korea 2026 어스톤 트렌드" },
  trends2026: [
    { titleKo: "곡선·라운딩 디자인 (Soft Curve)",
      descKo: "아치형·둥근 소파·물결 선반 등 부드러운 곡선이 2026 전반 트렌드 — 아동 안전(모서리 사고 예방)과 자연스럽게 결합.",
      sourceKo: "reon_design_group 2026 트렌드, Vogue Korea" },
    { titleKo: "친환경·무독성 소재 우선",
      descKo: "저탄소 인증·무독성 페인트·재활용 목재가 새 표준. 아토피·알러지 민감 아동 시설에서 KC·친환경 자재 선택이 마케팅 포인트.",
      sourceKo: "가구네닷컴 2025 트렌드, Shopify 2026 트렌드" },
    { titleKo: "체험·다기능 공간 (동시공간)",
      descKo: "한 공간에서 학습·놀이·휴식을 전환하는 모듈형 가구 구성. 미술·창의 학원에서 가변 레이아웃 수요 증가.",
      sourceKo: "accio 카페/공간 트렌드 2025" },
  ],
  furniture: [
    { itemKo: "성장단계별 라운드 모서리 책상·의자",
      descKo: "유아 H400 / 저학년 H520 / 고학년 H640 분리 + 모서리 라운딩. 인체공학 설계로 바른 자세 유도." },
    { itemKo: "아동 인체공학 의자·소파",
      descKo: "성장기 바른 자세용으로 설계된 아동 의자·소파. 작은 체구에 맞춘 아담한 사이즈." },
    { itemKo: "모듈형 수납·체험 가구",
      descKo: "낮은 오픈 수납장 + 이동형 체험 테이블. 아이 눈높이 수납으로 정리 습관·안전 동선 확보." },
    { itemKo: "학부모 대기 라운지 가구",
      descKo: "투명 도어 너머 수업 모니터링이 가능한 대기 라운지 소파·상담 테이블 — 상담 전환율 직결." },
  ],
  furnitureBrands: [
    { nameKo: "일룸 (iloom)",
      noteKo: "키즈룸·학생방 전문 라인 — 성장기 바른 자세 인체공학 아동 의자·소파, 높이조절 모션데스크·책상세트.",
      sourceKo: "iloom.com 키즈룸/학생방 카테고리" },
    { nameKo: "시디즈 (SIDIZ)",
      noteKo: "아동용 '링고/아띠' 등 키즈 체어 라인 — 자세교정·아담한 사이즈로 저학년 학원에 적합.",
      sourceKo: "kr.sidiz.com forkids" },
    { nameKo: "퍼시스 (FURSYS)",
      noteKo: "교육용 가구 라인 보유 — 방염·KC 기준 충족 책상·칸막이를 학원 규격으로 발주 가능.",
      sourceKo: "fursys.com" },
  ],
  specialistFirms: [
    { typeKo: "교육공간 시공·매칭",
      nameKo: "굿테리어 / 큐플레이스(qplace)",
      noteKo: "학원·교육공간 3D 시각화·포트폴리오 기반 견적. 방염·CCTV 안내판 등 학원법 체크포인트 반영.",
      sourceKo: "goodterior.com, qplace.kr" },
  ],
  caveatKo: "참고용 정보입니다. 학원 설립·운영법상 방염·안전 기준은 지역 교육청 기준이 우선이며, 자재·브랜드는 발주 전 검증 권장.",
},

"adult-class": {
  colorTrend2026: {
    nameKo: "테일러드 클래식 — Silhouette 에스프레소 + 화이트",
    descKo: "2026 키워드 '테일러드 클래식'(맞춤 정장의 절제된 고급). 벤자민무어 2026 'Silhouette'(에스프레소·차콜)을 강의실 포인트로, Pantone 'Cloud Dancer' 화이트와 대비. 자격증·실무 학원의 신뢰감·전문성 강조.",
    sourceKo: "Benjamin Moore 2026 Silhouette, Pantone 2026, 마케팅인사이드 ampm" },
  trends2026: [
    { titleKo: "뉴트로 우드 (Newtro Wood)",
      descKo: "월넛·티크 등 짙은 우드가 2026 트렌드 — 장기 수강생(고시·공시) 강의실의 차분하고 진중한 무드 조성.",
      sourceKo: "reon_design_group 2026 트렌드" },
    { titleKo: "절제된 고급스러움 (소프트 미니멀)",
      descKo: "차갑지 않은 미니멀 + 따뜻한 중성톤. 직장인 대상 자격증 학원의 프리미엄 포지셔닝에 부합.",
      sourceKo: "Vogue Korea 2026, reon_design_group" },
    { titleKo: "다기능 라운지·동시공간",
      descKo: "쉬는 시간 활용 라운지·자판기 코너를 학습 공간과 한 동선에 통합. 재등록률 직결 요소.",
      sourceKo: "accio 2025 공간 트렌드" },
  ],
  furniture: [
    { itemKo: "성인용 회의형 듀얼 책상 (W1200)",
      descKo: "노트북+교재 동시 거치 폭. 2인 셰어도 가능한 모듈 — 자격증·실무 강의 표준 사이즈." },
    { itemKo: "장시간 착석 사무용 의자",
      descKo: "요추지지·조절 좌판 사무 체어. 6개월+ 장기 수강 부담 완화." },
    { itemKo: "좌석별 멀티콘센트·USB 데스크",
      descKo: "노트북·태블릿 충전 — 성인 학원 필수. 케이블 그로멧 일체형 책상." },
    { itemKo: "라운지·휴게 가구",
      descKo: "정수기·자판기 코너 + 라운지 소파·바테이블. 직장인 수강생 짧은 휴식 회복." },
  ],
  furnitureBrands: [
    { nameKo: "퍼시스 (FURSYS)",
      noteKo: "사무가구 대표 — 회의형 책상·강의 테이블·캐비닛 종합. 학원 규격 일괄 발주에 적합.",
      sourceKo: "fursys.com" },
    { nameKo: "코아스 (KOAS)",
      noteKo: "전동 데스크·회의 테이블·사무 의자. V6 데스크+이동서랍 세트로 강의실 단가 효율화.",
      sourceKo: "koasmall.com" },
    { nameKo: "시디즈 (SIDIZ)",
      noteKo: "T50 등 사무·학원용 베스트셀러 의자 — 장시간 강의 착석 편의.",
      sourceKo: "sidiz.com" },
  ],
  specialistFirms: [
    { typeKo: "사무·교육공간 시공",
      nameKo: "굿테리어 / 916er",
      noteKo: "사무·강의실 인테리어 견적 비교·3D 시각화 플랫폼. 흡음 차음벽·방염 등 학원 요건 반영.",
      sourceKo: "goodterior.com, 916er.com" },
  ],
  caveatKo: "참고용 정보입니다. 방염·차음 기준과 자재·브랜드는 발주 전 공식 대리점에서 검증 권장.",
},

"language-academy": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 컬처룸 포인트 컬러",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트를 회화 집중 베이스로, 국가별 강의실에 브리티시 그린·골드, 재패니즈 우드톤 등 포인트. 화이트의 '명료함·집중' 콘셉트가 발화 집중 환경과 부합.",
    sourceKo: "Pantone 2026, Vogue Korea 2026" },
  trends2026: [
    { titleKo: "하이브리드 화상 수업 공간화",
      descKo: "원어민 화상·하이브리드 표준화로 전자칠판+PTZ 카메라 + 조명·배경 정돈이 강의실 설계 필수 요소로 정착.",
      sourceKo: "교육 트렌드 (happyedu.moe.go.kr 학교공간혁신)" },
    { titleKo: "현수형 흡음 패널 (음성 명료도)",
      descKo: "회화 수업의 음성 이해도는 천장 음향 패널·실 길이가 핵심 변수 — 어학원 동시 강의 간섭 차단의 과학적 근거.",
      sourceKo: "교실 음향 연구 (NCBI PMC4304827)" },
    { titleKo: "테일러드 클래식 프리미엄",
      descKo: "월넛·가죽·딥그린 등 절제된 고급 마감 — 프리미엄 영어·입시 어학원의 헤리티지 포지셔닝.",
      sourceKo: "마케팅인사이드 ampm 2026, reon_design_group" },
  ],
  furniture: [
    { itemKo: "회화용 라운드/오벌 테이블 (4~6인)",
      descKo: "시선 교환·발화량을 높이는 라운드 배치. 회화 수업 효과성의 핵심 가구." },
    { itemKo: "방음 1인 부스 (화상·녹음용)",
      descKo: "화상 면접·스피킹 녹음용 독립 부스. 벽체 두께별 모델 선택으로 통화·녹음 차음 확보." },
    { itemKo: "리셉션 카운터 + 분리 상담 가구",
      descKo: "신규 상담 전환을 결정하는 카운터 + 프라이버시 상담 테이블." },
    { itemKo: "어린이 어학원 KC 친환경 가구",
      descKo: "키즈 어학원용 라운드 모서리·KC 인증 책상·놀이매트 — 학부모 안심형." },
  ],
  furnitureBrands: [
    { nameKo: "퍼시스 (FURSYS)",
      noteKo: "회의·강의 테이블·리셉션 카운터 라인 — 라운드 테이블·상담 가구 일괄 발주.",
      sourceKo: "fursys.com" },
    { nameKo: "시디즈 (SIDIZ)",
      noteKo: "T50 사무·학원 의자, 키즈 라인 보유 — 성인·어린이 어학원 좌석 모두 커버.",
      sourceKo: "sidiz.com" },
    { nameKo: "쉿 (SHH21) 방음부스",
      noteKo: "벽체 두께 기준 6타입 방음부스 — 보컬·통화·녹음·독서실용. 어학원 스피킹·화상 부스 적용.",
      sourceKo: "shh21.com" },
  ],
  specialistFirms: [
    { typeKo: "교육공간 시공·매칭",
      nameKo: "큐플레이스(qplace) / 굿테리어",
      noteKo: "어학원·교육공간 포트폴리오·3D 견적. 방음·차음·KC 자재 등 어학원 요건 반영.",
      sourceKo: "qplace.kr, goodterior.com" },
  ],
  caveatKo: "참고용 정보입니다. 방음 성능·KC 인증·브랜드 라인업은 발주 전 직접 검증 권장.",
},

"coding-class": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 차콜 테크 무드",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 모니터 시인성·집중 환경을 확보하고, 벤자민무어 'Silhouette' 차콜을 부트캠프형 테크 무드 포인트로. 키즈 코딩은 어스톤·우드로 부드럽게 차별화.",
    sourceKo: "Pantone 2026, Benjamin Moore 2026" },
  trends2026: [
    { titleKo: "생성형 AI 교육의 공간화",
      descKo: "생성형 AI·디지털 도구가 교실에 본격 도입되며(2026 AI 디지털 교육 트렌드), 고사양·다중 디스플레이·협업 화이트보드 수요 증가.",
      sourceKo: "AI 디지털 교육 트렌드 리포트 2026 (교보문고)" },
    { titleKo: "오픈 메이커스페이스·협업존",
      descKo: "팀 프로젝트·페어 프로그래밍을 위한 오픈 레이아웃 + 벽 전체 화이트보드. 구글·MS 캠퍼스형 협업 무드.",
      sourceKo: "accio 2025 공간 트렌드 (다기능 동시공간)" },
    { titleKo: "소프트 미니멀 집중 부스",
      descKo: "화이트·우드 기반 1인 듀얼 모니터 부스 — 알고리즘·CS 중고급반 산만함 최소화. 2026 소프트 미니멀 반영.",
      sourceKo: "Vogue Korea 2026, reon_design_group" },
  ],
  furniture: [
    { itemKo: "듀얼 모니터 데스크 + VESA 모니터암",
      descKo: "좌석당 24~27인치 듀얼 거치. 모니터암으로 시야·자세·책상 면적 확보." },
    { itemKo: "케이블 정리 매립 데스크 (그로멧·트레이)",
      descKo: "좌석별 4구+USB-C, 케이블 그로멧·하부 트레이 일체. 안전·시인성 핵심." },
    { itemKo: "오픈 협업 테이블 + 화이트보드 벽",
      descKo: "페어 프로그래밍·해커톤용 대형 협업 테이블, 벽면 전체 화이트보드." },
    { itemKo: "장시간 착석 사무 의자",
      descKo: "발열·집중 환경에서 통기성 메시 + 요추지지 의자." },
  ],
  furnitureBrands: [
    { nameKo: "코아스 (KOAS)",
      noteKo: "전동 데스크·이동서랍·사무 의자 — 모니터암 호환 데스크로 코딩실 좌석 구성에 적합.",
      sourceKo: "koasmall.com" },
    { nameKo: "퍼시스 (FURSYS)",
      noteKo: "사무·교육 데스크·협업 테이블·캐비닛 종합 — 오픈 메이커스페이스 가구 일괄 발주.",
      sourceKo: "fursys.com" },
    { nameKo: "시디즈 (SIDIZ)",
      noteKo: "T50 등 통기성 메시 사무 의자 — 장시간 코딩 착석 편의.",
      sourceKo: "sidiz.com" },
  ],
  specialistFirms: [
    { typeKo: "IT·사무공간 시공",
      nameKo: "916er / 굿테리어",
      noteKo: "사무·교육 IT 공간 견적·3D 시각화. 전기배선·기가 네트워크·발열 냉방 등 코딩실 요건 반영.",
      sourceKo: "916er.com, goodterior.com" },
  ],
  caveatKo: "참고용 정보입니다. 전기·네트워크 용량과 가구 브랜드는 발주 전 검증 권장.",
},

"small-study-room": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 우드 웜 포인트",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트 베이스로 룸별 청결·집중감을 주고, 뉴트로 우드·웜 톤으로 미팅 공간의 편안함을 더함. 강남·판교는 차콜 모던, 대학가는 우드 웜으로 분기.",
    sourceKo: "Pantone 2026, Vogue Korea 2026" },
  trends2026: [
    { titleKo: "모듈형 가변 가구",
      descKo: "분리·결합 가능한 모듈 테이블로 인원수에 따라 룸 재구성. 2026 모듈형 가구 트렌드와 직결.",
      sourceKo: "가구네닷컴 2025, reon_design_group 2026" },
    { titleKo: "무인 예약·도어락 통합",
      descKo: "시간 단위 예약·결제 후 자동 도어락 — 토즈·스페이스클라우드형 무인 운영 표준화.",
      sourceKo: "qplace 스터디카페 운영 가이드" },
    { titleKo: "방음 부스·촬영 룸 차별화",
      descKo: "화상면접·유튜브·팟캐스트 수요로 방음 부스·조명 촬영 룸을 옵션화 — 객단가 1.5~2배.",
      sourceKo: "shh21.com 방음부스 용도(통화·회의·녹음)" },
  ],
  furniture: [
    { itemKo: "모듈형 회의 테이블 (4·6·8인 변형)",
      descKo: "분리·결합으로 룸 재구성. 가변형 운영 효율 핵심." },
    { itemKo: "회의용 의자 (적층·이동형)",
      descKo: "인원 변동 대응 적층·캐스터 의자 — 빠른 룸 전환." },
    { itemKo: "기성 방음 부스 (1~2인)",
      descKo: "화상회의·녹음용 독립 부스. 벽체 두께별 차음 모델 선택." },
    { itemKo: "무선 미러링 디스플레이 + 카트",
      descKo: "65~75인치 + 무선 동글. 발표·인강·회의 공용." },
  ],
  furnitureBrands: [
    { nameKo: "퍼시스 (FURSYS)",
      noteKo: "회의 테이블·캐비닛·리셉션 종합 — 룸별 회의 가구 일괄.",
      sourceKo: "fursys.com" },
    { nameKo: "코아스 (KOAS)",
      noteKo: "회의 테이블·이동서랍·의자 — 모듈 가변 운영에 적합.",
      sourceKo: "koasmall.com" },
    { nameKo: "쉿 (SHH21) 방음부스",
      noteKo: "통화·회의·녹음용 방음부스 6타입 — 스터디룸 차별화 옵션.",
      sourceKo: "shh21.com" },
  ],
  specialistFirms: [
    { typeKo: "공간 운영·매칭 플랫폼",
      nameKo: "스페이스클라우드 / 굿테리어",
      noteKo: "공간 예약 플랫폼 + 시공 매칭. 무인 예약·도어락·시간 결제 운영 연계.",
      sourceKo: "goodterior.com, qplace.kr" },
  ],
  caveatKo: "참고용 정보입니다. 방음 성능·예약 시스템·브랜드는 발주 전 검증 권장.",
},

// ═══════════════════════════════════════════════════════════
// LIVING-SERVICE (6) — 2026 트렌드 + 가구/기기 브랜드 + 특화 업체
// ═══════════════════════════════════════════════════════════

"laundry-service": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 에코 그린 (청결·친환경)",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트로 위생·청결 신뢰를 주고, 친환경 웻클리닝 콘셉트에 세이지 그린·우드를 더함. 명품·드레스 전문은 차콜·골드로 프리미엄 분기.",
    sourceKo: "Pantone 2026, Vogue Korea 2026" },
  trends2026: [
    { titleKo: "세탁편의점 + 무인 픽업 결합",
      descKo: "전통 세탁소 감소(2017년 약 2.7만→2023년 약 2만) 속, 크린토피아·런드리고형 24h 무인 세탁함·앱 픽업 결합이 생존 모델로 정착.",
      sourceKo: "namu.wiki 크린토피아, brunch.co.kr/@jskim-1004" },
    { titleKo: "친환경 웻클리닝 전환",
      descKo: "유기용제 규제·환경 의식 상승으로 퍼크 드라이 대신 친환경 웻클리닝 강조 매장 증가 — 임산부·아토피 소구.",
      sourceKo: "가구네닷컴 2025 친환경 소재 트렌드" },
    { titleKo: "비대면 스마트 세탁 UX",
      descKo: "런드리고형 앱 중심 비대면 — 매장은 픽업·드롭 동선과 무인 보관함 중심으로 최소화.",
      sourceKo: "laundrygo.com, brunch.co.kr/@jskim-1004" },
  ],
  furniture: [
    { itemKo: "픽업·드롭 카운터 + 무인 보관함",
      descKo: "24h 무인 픽업 보관함 + 키오스크 결제. 직장인 비대면 동선의 핵심 집기." },
    { itemKo: "회전 행거 보관 시스템",
      descKo: "천장 회전 행거로 다량 의류 보관·자동 픽업. 좁은 매장 수납 효율." },
    { itemKo: "접수·검품 작업대",
      descKo: "바코드 태그 부착·검품용 카운터 작업대 — 분실 방지·픽업 효율." },
  ],
  furnitureBrands: [
    { nameKo: "크린토피아 (Cleantopia)",
      noteKo: "코인세탁 점유율 1위·전국 1,100개+. 세탁편의점+코인+멀티숍 표준 집기·보관함·POS 패키지 공급(가맹).",
      sourceKo: "cleantopia.com, forbeskorea.co.kr" },
    { nameKo: "런드리고 (Laundrygo) / 런드리24",
      noteKo: "비대면 앱 세탁 + 무인세탁소 '런드리24'. 무인 보관함·앱 픽업 UX 레퍼런스.",
      sourceKo: "laundrygo.com" },
  ],
  specialistFirms: [
    { typeKo: "프랜차이즈 세탁편의점",
      nameKo: "크린토피아 / 에코런드렛",
      noteKo: "세탁편의점·멀티숍 표준 시공·집기. 에코런드렛은 유·무인 복합·샵인샵 멀티 빨래방 시공.",
      sourceKo: "cleantopia.com, eco-launderette.com" },
  ],
  caveatKo: "참고용 정보입니다. 유기용제 환기·환경부 등록 등 법규와 가맹 조건은 발주 전 직접 검증 권장.",
},

"cleaning-service": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 메탈 그레이 (거점·사무실 기준)",
    descKo: "방문 서비스라 매장 인테리어 비중이 낮음 — 소규모 거점/사무실 기준. Pantone 2026 'Cloud Dancer' 화이트 + 메탈 그레이로 전문성·청결 신뢰를 주고, 특수청소는 옐로 안전 컬러 포인트.",
    sourceKo: "Pantone 2026, Vogue Korea 2026" },
  trends2026: [
    { titleKo: "거점 경량화 + 차량 모바일화",
      descKo: "매장보다 장비 창고·차량 적재가 핵심. 사무실은 상담·매칭 운영 데스크 중심의 소규모 거점으로 충분.",
      sourceKo: "accio 2025 다기능 공간 트렌드" },
    { titleKo: "친환경·무독성 약품 소구",
      descKo: "무독성·저자극 약품과 분리 보관이 B2C 신뢰 요소로 부상 — 2026 친환경 우선 흐름과 연결.",
      sourceKo: "가구네닷컴 2025 친환경 트렌드" },
  ],
  furniture: [
    { itemKo: "상담·매칭 운영 데스크",
      descKo: "예약·매칭·출퇴근 관리용 사무 데스크. 소규모 거점의 운영 허브." },
    { itemKo: "약품 분리 보관 캐비닛",
      descKo: "산성·알칼리·중성 분리 잠금 캐비닛 — 산업안전보건법 화학물질 관리." },
    { itemKo: "장비 보관 선반·세척대",
      descKo: "청소기·고압세척기 정리 선반 + 세척대. 차량 적재 동선과 연결." },
  ],
  furnitureBrands: [
    { nameKo: "퍼시스 (FURSYS) / 코아스 (KOAS)",
      noteKo: "소규모 사무 거점용 운영 데스크·캐비닛·의자. 상담·매칭 데스크 일괄 발주.",
      sourceKo: "fursys.com, koasmall.com" },
  ],
  specialistFirms: [
    { typeKo: "사무공간 시공",
      nameKo: "916er / 굿테리어",
      noteKo: "소규모 사무·거점 인테리어 견적. 매장 비중 낮아 간이 사무·창고 분리 위주.",
      sourceKo: "916er.com, goodterior.com" },
  ],
  caveatKo: "참고용 정보입니다. 방문 서비스 특성상 매장 인테리어 비중이 낮으며, 약품 보관·산업안전 기준은 별도 검증 권장.",
},

"repair-service": {
  colorTrend2026: {
    nameKo: "Silhouette 에스프레소 우드 + 골드 (장인 아틀리에)",
    descKo: "벤자민무어 2026 'Silhouette'(에스프레소·차콜)에 골드·가죽을 더해 시계·정밀 수리의 장인 아틀리에 무드. 동네 다목적 수리방은 Pantone 'Cloud Dancer' 화이트·우드로 밝게 분기.",
    sourceKo: "Benjamin Moore 2026, Pantone 2026" },
  trends2026: [
    { titleKo: "뉴트로 우드·빈티지 무드",
      descKo: "월넛·티크 짙은 우드와 빈티지 소품이 2026 트렌드 — 시계·복원 전문점의 장인 신뢰감과 결합.",
      sourceKo: "reon_design_group 2026 트렌드" },
    { titleKo: "투명 진단 작업대 (신뢰 시각화)",
      descKo: "고객 앞 즉석 진단·견적을 보여주는 투명 카운터가 분쟁 예방·신뢰 확보 포인트로 부상.",
      sourceKo: "accio 2025 체험형 공간 트렌드" },
  ],
  furniture: [
    { itemKo: "정밀 작업대 + 확대경 LED",
      descKo: "정전기방지 매트 작업대 + 확대경·LED 스탠드. 시계·정밀 부품 수리 표준." },
    { itemKo: "부품 분류 다단 서랍 캐비닛",
      descKo: "수천 종 부품 분류 서랍 — 검색·재고 관리로 작업 시간 단축." },
    { itemKo: "강화유리 쇼케이스 + 잠금 보관함",
      descKo: "고가 접수품·시계 진열·보관. 도난·분실 보호." },
    { itemKo: "고객 상담·진단 카운터",
      descKo: "즉석 진단·견적 출력 투명 카운터 — 신뢰 결정." },
  ],
  furnitureBrands: [
    { nameKo: "코아스 (KOAS)",
      noteKo: "산업용 워크벤치·카트·서랍 캐비닛(XL PLUS 등) + 사무 가구 — 작업대·부품 수납 라인 보유.",
      sourceKo: "koasmall.com, koasgagu.kr" },
    { nameKo: "퍼시스 (FURSYS)",
      noteKo: "쇼케이스 대체용 상담 카운터·캐비닛·사무 가구. 상담·진열 구역 구성.",
      sourceKo: "fursys.com" },
  ],
  specialistFirms: [
    { typeKo: "소매·작업공간 시공",
      nameKo: "굿테리어 / 916er",
      noteKo: "소형 수리·작업 공간 견적·시공. 작업대 동선·진열·CCTV 등 요건 반영.",
      sourceKo: "goodterior.com, 916er.com" },
  ],
  caveatKo: "참고용 정보입니다. 작업대·산업용 가구 사양과 브랜드 라인업은 발주 전 직접 검증 권장.",
},

"self-laundry": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 우드 카페 라운지",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트·메탈로 청결·24h 무인 신뢰를 주고, 우드·식물로 카페형 라운지를 더함. 무인 매장은 야간 시인성 위해 밝은 화이트 베이스가 안전·신뢰 핵심.",
    sourceKo: "Pantone 2026, accio 2025 카페 트렌드" },
  trends2026: [
    { titleKo: "카페형·멀티숍 라운지화",
      descKo: "대기 30~60분을 카페형 라운지·자판기로 채우는 멀티 빨래방이 표준. 세탁편의점·코인 결합 멀티숍 확대.",
      sourceKo: "cleantopia.com 멀티숍, accio 2025 다기능 공간" },
    { titleKo: "AI 원격 관리 무인 운영",
      descKo: "AI 챗봇·오류코드 자동안내·원격제어로 24h 완전 무인 운영. 본사 시스템 연동이 표준화.",
      sourceKo: "워시엔조이/크린토피아 무인 운영 (cleantopia.com)" },
    { titleKo: "동선·환기 중심 설계",
      descKo: "세탁→건조→접이 동선과 고용량 환기·배수가 만족도·재방문의 핵심 — 입지 선정 시 전기·가스 인프라 우선 확인.",
      sourceKo: "lifeisgood.kr 코인빨래방 창업, cleantopia.com" },
  ],
  furniture: [
    { itemKo: "세탁·건조 배치 + 접이 카운터",
      descKo: "세탁→건조 동선에 맞춘 기기 배치 + 빨래 접이용 대형 카운터·선반." },
    { itemKo: "대기 라운지 가구 (카페형)",
      descKo: "의자·테이블·자판기·정수기. 30~60분 대기 체류·재방문 유도." },
    { itemKo: "무인 키오스크 + 세제 자판",
      descKo: "코인·카드·앱 결제 통합 키오스크 + 세제·유연제 자판." },
  ],
  furnitureBrands: [
    { nameKo: "지르바우 (GIRBAU)",
      noteKo: "스페인 50년 전통 세계 3대 상업용 세탁 장비. 크린토피아가 독점 수입 — 저진동·저소음 소프트 타입.",
      sourceKo: "cleantopia.com, metroseoul.co.kr" },
    { nameKo: "일렉트로룩스 (Electrolux) / 스피드퀸 (Speed Queen)",
      noteKo: "셀프 빨래방 상업용 세탁기·건조기 주요 브랜드. 대용량·내구성 모델로 사용.",
      sourceKo: "ukyung2.co.kr 셀프빨래방 장비" },
    { nameKo: "LG전자 B2B",
      noteKo: "상업용 건조기 등 B2B 세탁 장비 공급. 국내 A/S 접근성 강점.",
      sourceKo: "lge.co.kr B2B 건조기" },
  ],
  specialistFirms: [
    { typeKo: "프랜차이즈 코인세탁",
      nameKo: "크린토피아 코인워시365 / 워시엔조이 / 에코런드렛",
      noteKo: "코인·멀티 빨래방 표준 시공·기기·운영. 크린토피아 점유율 1위, 워시엔조이 소규모 창업, 에코런드렛 멀티숍.",
      sourceKo: "cleantopia.com, eco-launderette.com" },
  ],
  caveatKo: "참고용 정보입니다. 전기·가스·배수 인프라와 가맹 조건·기기 사양은 발주 전 직접 검증 권장.",
},

"print-copy": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 우드 (캠퍼스 vs 디자인 스튜디오)",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트·블루로 대학가 셀프 출력의 밝고 효율적인 무드, 디자인 스튜디오는 차콜·우드·갤러리 톤으로 분기.",
    sourceKo: "Pantone 2026, Vogue Korea 2026" },
  trends2026: [
    { titleKo: "셀프 무인 출력 + 24h",
      descKo: "USB·클라우드·이메일 셀프 출력 키오스크 + 24h 무인 운영이 대학가 표준. 인건비 절감·회전율.",
      sourceKo: "accio 2025 다기능 공간 트렌드" },
    { titleKo: "디자인 결합 부가가치화",
      descKo: "명함·청첩장·브로슈어 디자인 상담을 결합해 단순 복사에서 객단가 높은 디자인 인쇄로 차별화.",
      sourceKo: "redprinting.co.kr 상업 인쇄, brunch.co.kr/@morningwalk/1225" },
    { titleKo: "친환경 인증 용지·잉크",
      descKo: "저탄소·친환경 인증 용지·잉크 수요 상승 — 2026 지속가능성 흐름과 연결.",
      sourceKo: "가구네닷컴 2025 친환경 트렌드" },
  ],
  furniture: [
    { itemKo: "셀프 출력 키오스크 스테이션",
      descKo: "USB·클라우드 셀프 출력 + 무인 결제. 24h 운영 옵션." },
    { itemKo: "디자인 상담 테이블 + 색교정 모니터",
      descKo: "고객·디자이너 협업 — 시안·색교정 확인. 객단가 상승." },
    { itemKo: "후가공 작업대 (제본·코팅·재단)",
      descKo: "무선제본·코팅·재단 장비 동선용 작업대·선반." },
  ],
  furnitureBrands: [
    { nameKo: "퍼시스 (FURSYS) / 코아스 (KOAS)",
      noteKo: "상담 테이블·작업 데스크·캐비닛·의자 — 디자인 상담·후가공 작업 가구 일괄.",
      sourceKo: "fursys.com, koasmall.com" },
  ],
  specialistFirms: [
    { typeKo: "소매·사무공간 시공",
      nameKo: "916er / 굿테리어",
      noteKo: "인쇄·출력·사무 소매 공간 견적·시공. 환기·전기·동선 등 요건 반영.",
      sourceKo: "916er.com, goodterior.com" },
  ],
  caveatKo: "참고용 정보입니다. 인쇄 장비 환기·정전기 설비와 가구 브랜드는 발주 전 검증 권장.",
},

"device-repair": {
  colorTrend2026: {
    nameKo: "Cloud Dancer 화이트 + 블루 LED 테크 클리닉",
    descKo: "Pantone 2026 'Cloud Dancer' 화이트·블루 LED로 애플 스토어형 클린 테크 무드. 동네 가성비형은 우드·베이지로 친근하게 분기.",
    sourceKo: "Pantone 2026, Vogue Korea 2026" },
  trends2026: [
    { titleKo: "투명 작업·즉석 수리 시각화",
      descKo: "고객 앞 투명 카운터에서 즉석 진단·수리를 보여주는 체험형 — 신뢰·분쟁 예방 포인트.",
      sourceKo: "accio 2025 체험형 공간 트렌드" },
    { titleKo: "수리 + 액세서리 리테일 결합",
      descKo: "케이스·필름·충전기 진열을 결합해 객단가 상승. 2025 폰케이스 디자인 다양화와 연결.",
      sourceKo: "accio 2025 폰케이스 브랜드 트렌드" },
    { titleKo: "익스프레스 부스 (역세권 30분 수리)",
      descKo: "지하철·쇼핑몰 소형 부스에서 30분 즉석 수리 — 키오스크·미니멀 셀프 동선.",
      sourceKo: "accio 2025 다기능 공간 트렌드" },
  ],
  furniture: [
    { itemKo: "ESD 작업대 + 정전기방지 매트",
      descKo: "메인보드·반도체 정전기 손상 방지 ESD 워크벤치 + 손목 그라운드." },
    { itemKo: "부품 분류 다단 서랍 (정품·호환 분리)",
      descKo: "디스플레이·배터리·커넥터 분류 라벨 서랍 — 견적 투명성." },
    { itemKo: "투명 작업 카운터 (고객 모니터링)",
      descKo: "강화유리 카운터 — 고객 앞 즉석 수리·진단." },
    { itemKo: "액세서리 진열 곤돌라",
      descKo: "케이스·필름·충전기 진열 — 수리+판매 결합." },
  ],
  furnitureBrands: [
    { nameKo: "코아스 (KOAS)",
      noteKo: "산업용 워크벤치·카트·부품 서랍 캐비닛(XL PLUS 등) — ESD 작업대·부품 수납 라인 보유.",
      sourceKo: "koasmall.com, koasgagu.kr" },
    { nameKo: "퍼시스 (FURSYS)",
      noteKo: "상담 카운터·진열 캐비닛·사무 가구 — 카운터·액세서리 진열 구역 구성.",
      sourceKo: "fursys.com" },
  ],
  specialistFirms: [
    { typeKo: "소매·작업공간 시공",
      nameKo: "굿테리어 / 916er",
      noteKo: "휴대폰 수리·소매 작업 공간 견적·시공. 작업대 동선·진열·CCTV·환기 요건 반영.",
      sourceKo: "goodterior.com, 916er.com" },
  ],
  caveatKo: "참고용 정보입니다. ESD 작업대·산업용 가구 사양과 브랜드는 발주 전 직접 검증 권장.",
},

  // ─────────────────────────────────────────────────────────
  // 공간대여(SPACE) 6 + 디지털/홈오피스 공통 노트
  // ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// SPACE (6) — 2026 트렌드 + 가구/조명/음향 브랜드 + 특화 업체
// (기존 materials/concepts 와 중복 없음. 추가 보강용 메타데이터)
// ─────────────────────────────────────────────────────────

"guesthouse": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 (Cloud Dancer) + 어스톤 우드",
    descKo: "팬톤 2026 올해의 컬러는 1999년 이래 처음 선정된 화이트 계열 '클라우드 댄서'(11-4201). 객실은 차분한 소프트 화이트 베이스에 베이지·테라코타·머쉬룸 어스톤 우드를 더해 '조용한 쉼'을 연출하는 것이 외국인 부티크 스테이의 사진 품질을 좌우합니다.",
    sourceKo: "Pantone Color of the Year 2026 (pantone.com), NPR 2025-12-04",
  },
  trends2026: [
    { titleKo: "워밍 뉴트럴 + 곡선 디자인",
      descKo: "직선 미니멀에서 벗어나 아치형 거울·둥근 헤드보드·물결 선반 등 부드러운 곡선으로 심리적 안정을 주는 객실이 2026 핵심. 1인 단독여행 여성 인증샷 동선과 직결.",
      sourceKo: "Vogue Korea 2026 인테리어 트렌드 11 (vogue.co.kr), 오늘의집 2026 거실 트렌드" },
    { titleKo: "플랜테리어 + 천연소재(라탄·스톤)",
      descKo: "식물·라탄·돌 등 자연 요소를 로비·공용 라운지에 배치해 워케이션·롱스테이 게스트의 체류 만족도를 높이는 흐름.",
      sourceKo: "오늘의집 2026 거실 인테리어 트렌드 (ohou.se/advices/12448)" },
    { titleKo: "호텔식 침실 무드(레지머셜)",
      descKo: "시몬스가 2026 침실 트렌드로 제안한 '호텔 침실 분위기의 모던·고급 프레임' 흐름을 게스트하우스 객실에 이식 — 침구 비주얼이 후기 평점의 분기점.",
      sourceKo: "시몬스 2026 침실 라이프스타일 트렌드 보도 (ekn.kr 2026-01-30)" },
  ],
  furniture: [
    { itemKo: "호텔식 매트리스 + TSS 프레임", descKo: "슈퍼싱글 2개를 한 프레임에 올리는 트윈형 구성으로 도미토리·트윈룸 회전율과 청소 효율을 동시에 확보." },
    { itemKo: "벙커·이층 침대(도미토리)", descKo: "백패커 6~8인실용 원목·스틸 벙커. 개인 커튼·독서등·콘센트 내장형이 글로벌 OTA 후기에서 사생활 평점을 좌우." },
    { itemKo: "공용 라운지 소파·다이닝", descKo: "게스트 교류용 대형 소파·원목 다이닝 테이블. 라탄·우드 혼합으로 2026 워밍 뉴트럴 톤 통일." },
    { itemKo: "암막·차음 패키지", descKo: "암막 롤스크린 + 문하단 차음 스트립. 이른 새벽 빛·옆방 소음 차단이 별점 4.5 이상의 조건." },
  ],
  furnitureBrands: [
    { nameKo: "시몬스 (Simmons)", noteKo: "2026 호텔 침실 분위기 프레임 신제품 6종(하우티 등) 출시. 트윈슈퍼싱글 프레임이 게스트하우스 객실에 적합.", sourceKo: "ekn.kr 2026-01-30" },
    { nameKo: "에이스침대 (ACE)", noteKo: "국내 1위 침대 브랜드. 실리·설타·시몬스 라이선스 보유, 호텔용 매트리스 라인 운영.", sourceKo: "나무위키 에이스침대" },
    { nameKo: "이케아 (IKEA)", noteKo: "2026 브랜드 가구 트렌드 지수 상위. 공용공간 가구·라탄 소품·합리적 무드조명 일괄 공급.", sourceKo: "smarttoday.co.kr 2026 가구 순위" },
    { nameKo: "일룸 (iloom)", noteKo: "퍼시스그룹 생활가구 브랜드. 객실·라운지 수납·데스크 모듈 구성에 활용.", sourceKo: "fursys.com" },
  ],
  specialistFirms: [
    { nameKo: "스페이스클라우드 (앤스페이스/NSPACE)", typeKo: "공간대여 운영 플랫폼", noteKo: "No.1 생활공간 플랫폼. 게스트하우스·스테이 노출 채널이자 운영 데이터 참고처. 누적 예약 500만건+(2023).", sourceKo: "spacecloud.kr, nspace.co" },
  ],
  caveatKo: "참고용 데이터로 실제 발주·계약 전 가격·사양·브랜드 라인업을 반드시 직접 검증하세요.",
},

"rental-studio": {
  colorTrend2026: {
    nameKo: "뉴트럴 화이트 호리존 + 컬러 그레이딩 자유도",
    descKo: "팬톤 2026 '클라우드 댄서' 화이트 기조와 맞물려, 백호리존은 어떤 컬러 그레이딩에도 대응하는 순백 베이스가 표준. 그레이·블랙 호리존을 병행해 광고·룩북 양쪽 수요를 흡수.",
    sourceKo: "Pantone Color of the Year 2026 (pantone.com)",
  },
  trends2026: [
    { titleKo: "자연광 호리존 수요 증가",
      descKo: "남향 통창 자연채광 스튜디오가 화보·룩북 시장에서 강세. 헤이즈스튜디오 등 '자연채광 호리존' 전문 컨셉이 확산.",
      sourceKo: "헤이즈스튜디오 (hazestudio.kr), 스페이스클라우드 호리존 호스트 가이드" },
    { titleKo: "조명 풀세트 무료 제공 = 경쟁력",
      descKo: "스튜디오엘씨에이가 어퓨쳐(Aputure) 조명 18개 무료 제공을 내세우는 등, 장비 풀 보유 여부가 광고·영상 촬영팀 재방문을 결정.",
      sourceKo: "스튜디오엘씨에이 (studiolca.net)" },
    { titleKo: "라이브커머스·세로 촬영 대응",
      descKo: "쇼핑 라이브 확산으로 세로 프레임·다카메라·프롬프터 셋업 수요 증가. 셀러 단위 패키지 대관이 회전율을 높임.",
      sourceKo: "스페이스클라우드 촬영공간 카테고리 (spacecloud.kr)" },
  ],
  furniture: [
    { itemKo: "곡면 호리존(코브) 벽체", descKo: "가로 6~11m·높이 5~6m 곡면 시공. 매출 대부분을 책임지는 핵심 자산." },
    { itemKo: "소품·가구 라이브러리", descKo: "미드센추리 소파·우드 테이블·빈티지 소품. 컨셉 다양성이 시간당 단가 차이를 만듦." },
    { itemKo: "전동 블랙아웃 롤스크린", descKo: "자연광·인공광 듀얼 운영을 위한 통창 차광. 컬러 그레이딩 일관성 확보." },
  ],
  furnitureBrands: [
    { nameKo: "어퓨쳐 (Aputure)", noteKo: "스튜디오 LED 조명 표준 브랜드. 600D·LS300X 등이 호리존 스튜디오 기본 패키지로 채택.", sourceKo: "studiolca.net" },
    { nameKo: "고독스 (Godox)", noteKo: "가성비 스트로보·LED 라이트로 중소형 셀프·제품 스튜디오에서 폭넓게 사용.", sourceKo: "일반 촬영장비 시장 통용" },
    { nameKo: "맨프로토 (Manfrotto)", noteKo: "라이트스탠드·부방·삼각대 등 촬영 보조 장비 풀의 표준.", sourceKo: "일반 촬영장비 시장 통용" },
  ],
  specialistFirms: [
    { nameKo: "스튜디오엘씨에이 (Studio LCA)", typeKo: "대형 호리존 렌탈스튜디오(레퍼런스)", noteKo: "11×10×6m 대형 호리존 + 어퓨쳐 18개 무료 제공 모델. 강남 20분 입지.", sourceKo: "studiolca.net" },
    { nameKo: "아워플레이스 (Hourplace)", typeKo: "촬영공간 대여 플랫폼", noteKo: "촬영·렌탈스튜디오 특화 예약 플랫폼. 호리존 스튜디오 노출·예약 채널.", sourceKo: "hourplace.co.kr" },
    { nameKo: "스페이스클라우드", typeKo: "공간대여 플랫폼", noteKo: "촬영스튜디오·호리존·라이브방송 카테고리 운영.", sourceKo: "spacecloud.kr" },
  ],
  caveatKo: "참고용 데이터로 실제 발주·계약 전 가격·사양·브랜드 라인업을 반드시 직접 검증하세요.",
},

"party-room": {
  colorTrend2026: {
    nameKo: "다채로운 컬러·풍부한 질감 (개성·자기표현)",
    descKo: "2026은 차가운 미니멀리즘이 물러나고 '개성과 자기표현'을 찬미하는 다채로운 색채·질감이 주목받는 해. 파티룸은 팬톤 화이트 베이스보다 #방꾸미기·#캐릭터룸·#파스텔 같은 컬러풀·포토제닉 무드가 예약률에 직결.",
    sourceKo: "Vogue Korea 2026 인테리어 트렌드 (vogue.co.kr), Shopify 2026 홈 인테리어 트렌드",
  },
  trends2026: [
    { titleKo: "스마트 LED 무드월 포토존",
      descKo: "RGB 스마트 LED 패널·라인조명으로 색을 자유 연출하는 무드월이 SNS 인증샷 핵심. 게임·모임·휴식 모드 전환.",
      sourceKo: "IKEA 스마트 조명 (ikea.com/kr), 나노리프 제품 (nanoleaf.me)" },
    { titleKo: "빔프로젝터·홈시네마 어트랙션",
      descKo: "대형 스크린·빔프로젝터로 영화·게임·노래방을 한 공간에 묶는 멀티 어트랙션이 4시간 단가의 기본기.",
      sourceKo: "스페이스클라우드 모임공간 카테고리 (spacecloud.kr)" },
    { titleKo: "생활감 있는 '실제로 머무는' 공간",
      descKo: "2026 키워드 '누군가 실제로 살며 사랑하는 집' — 과한 세트보다 편안한 거실 무드의 파티룸이 가족·소모임 재방문을 견인.",
      sourceKo: "오늘의집 2026 거실 트렌드 (ohou.se)" },
  ],
  furniture: [
    { itemKo: "대형 모듈 소파·빈백", descKo: "10~12인 그룹 수용 가변 모듈 소파·빈백. 곡선형 배치로 2026 포토제닉 무드." },
    { itemKo: "빔프로젝터 + 대형 스크린", descKo: "영화·게임·노래방 통합 어트랙션. 단초점 모델은 좁은 공간 대응." },
    { itemKo: "스마트 무드조명 시스템", descKo: "RGB 패널·라인조명·디스코볼 — 색 전환으로 파티/영화/휴식 분위기 연출." },
    { itemKo: "공용 키친·바 카운터", descKo: "쿡탑·전기그릴·아일랜드 바. 홈파티·베이킹 콘텐츠 단가를 추가." },
  ],
  furnitureBrands: [
    { nameKo: "나노리프 (Nanoleaf)", noteKo: "모듈식 RGB 스마트 LED 패널·라인조명. 무드월 포토존 연출의 대표 브랜드(토론토 본사, 2012 설립).", sourceKo: "nanoleaf.me" },
    { nameKo: "필립스 휴 (Philips Hue)", noteKo: "색온도·색상 조절 스마트 조명·라이트스트립. 무드 전환 표준.", sourceKo: "philipslighting.kr, 퓨처테리어" },
    { nameKo: "이케아 (IKEA)", noteKo: "가성비 스탠드·LED 라인조명·무드등. 게임·모임·휴식별 조명 구성 가능.", sourceKo: "ikea.com/kr" },
  ],
  specialistFirms: [
    { nameKo: "스페이스클라우드 (앤스페이스)", typeKo: "공간대여 플랫폼", noteKo: "파티룸·연습실 대관 No.1 플랫폼. 모임공간(파티룸·세미나실 등) 노출·예약 채널.", sourceKo: "spacecloud.kr" },
  ],
  caveatKo: "참고용 데이터로 실제 발주·계약 전 가격·사양·브랜드 라인업을 반드시 직접 검증하세요. 입주 건물 방음·민원 규정은 별도 확인 필수.",
},

"study-cafe-space": {
  colorTrend2026: {
    nameKo: "클라우드 댄서 화이트 + 웜 우드(절제된 고급)",
    descKo: "팬톤 2026 '클라우드 댄서' 소프트 화이트와 웜 우드·브라스 디테일을 결합한 '절제된 고급스러움'이 프리미엄 라이브러리형의 객단가를 정당화. 눈 피로를 줄이는 고연색 조도와 톤 일관성이 핵심.",
    sourceKo: "Pantone Color of the Year 2026 (pantone.com), Threads reon_design 2026 트렌드",
  },
  trends2026: [
    { titleKo: "1층 상권 + 복합 수익 모델",
      descKo: "작심스터디카페가 2026 들어 1층 상가 진입을 확대하며 복합 수익 모델로 전환. 가시성·접근성이 무인 스터디카페 신규 입지 전략의 축.",
      sourceKo: "서울신문 2026-05-04 (seoul.co.kr)" },
    { titleKo: "완전 무인 통합 운영 솔루션",
      descKo: "출입·좌석예약·결제·시간관리를 한 솔루션으로 묶는 무인 운영(작심 '픽코파트너스' 등)이 표준화. 인건비 0원 구조.",
      sourceKo: "나무위키 작심스터디카페" },
    { titleKo: "플랜테리어·라운지 결합형 진화",
      descKo: "단순 독서실에서 식물·라운지·코워킹을 결합한 하이브리드 공간으로 진화(플랜트스터디카페 등). 체류·재방문 강화.",
      sourceKo: "플랜트스터디카페 (plantstudylounge.com)" },
  ],
  furniture: [
    { itemKo: "1인 부스·파티션 좌석", descKo: "좌석당 우드 책상 + 측면 파티션. 집중도와 사생활이 평점을 좌우." },
    { itemKo: "고연색 면조명(5000K)", descKo: "눈 피로 저감 고연색 LED 면조명. 조도 균일성이 재방문율과 직결." },
    { itemKo: "전화부스·흡음 천장", descKo: "통화·키보드 소음 차단용 부스 + 흡음 텍스 천장." },
    { itemKo: "셀프 카페·간식 스테이션", descKo: "전자동 에스프레소·정수기·간식대. 월 이용권 락인 포인트." },
  ],
  furnitureBrands: [
    { nameKo: "시디즈 (Sidiz)", noteKo: "퍼시스그룹 인간공학 의자 브랜드. 장시간 착석 학습 좌석의 표준.", sourceKo: "namu.wiki 시디즈, fursys.com" },
    { nameKo: "퍼시스 (Fursys)", noteKo: "국내 대표 사무가구. 1인 부스 책상·파티션 모듈 공급.", sourceKo: "fursys.com" },
    { nameKo: "데스커 (DESKER)", noteKo: "퍼시스그룹 SOHO·스타트업 가구. 학습 데스크·모션데스크 구성 가능.", sourceKo: "desker.co.kr" },
  ],
  specialistFirms: [
    { nameKo: "작심스터디카페 (아이엔지스토리)", typeKo: "무인 스터디카페 프랜차이즈(인테리어·운영 패키지)", noteKo: "최다 직영점 보유, 자체 무인 통합 솔루션 '픽코파트너스'. 2026 1층 복합형 확대.", sourceKo: "seoul.co.kr 2026-05-04" },
    { nameKo: "굿테리어 (Goodterior)", typeKo: "상업공간 인테리어 매칭 플랫폼", noteKo: "3D 미리보기 기반 스터디카페 등 상업공간 인테리어 포트폴리오 제공.", sourceKo: "goodterior.com" },
  ],
  caveatKo: "참고용 데이터로 실제 발주·계약 전 가격·사양·브랜드 라인업을 반드시 직접 검증하세요.",
},

"shared-office": {
  colorTrend2026: {
    nameKo: "레지머셜(레지던스+커머셜) 웜 톤",
    descKo: "오피스도 집처럼 편안한 '레지머셜' 트렌드가 2026 핵심 — 차가운 사무실에서 벗어나 웜 우드·패브릭·플랜트로 따뜻한 무드를 구현. 팬톤 '클라우드 댄서' 화이트 베이스 + 그린월이 시그니처.",
    sourceKo: "다음/데일리 2026-03-24(데스커 모션데스크 프리미엄·S03 소파), 퍼플식스 오피스 인테리어",
  },
  trends2026: [
    { titleKo: "모션데스크(전동 높이조절) 표준화",
      descKo: "데스커 '모션데스크 프리미엄' 등 앉고 서는 자세 전환 전동 데스크가 2026 홈·공유오피스 표준. 1400~1800mm 폭으로 공간 맞춤.",
      sourceKo: "데스커 모션데스크 (desker.co.kr), 다음 2026-03-24" },
    { titleKo: "집중부스·폰부스 모듈화",
      descKo: "오픈 코워킹에서 통화·화상회의용 1인 집중부스 수요 급증. 부스 부킹률이 객단가를 결정.",
      sourceKo: "퍼플식스 오피스 인테리어 (purple6.studio)" },
    { titleKo: "바이오필릭 그린월·라운지",
      descKo: "그린월·식물·라운지로 입주사 만족도를 높이는 바이오필릭 디자인이 패스트파이브·스파크플러스급 시그니처.",
      sourceKo: "퍼플식스 스튜디오 (purple6.studio)" },
  ],
  furniture: [
    { itemKo: "전동 모션데스크", descKo: "앉고 서는 전동 높이조절 데스크. 전용 데스크 단가를 정당화하는 핵심 집기." },
    { itemKo: "인간공학 의자", descKo: "장시간 업무용 인체공학 의자. 입주 만족도·해지율과 직결." },
    { itemKo: "폰부스·집중부스", descKo: "1인 통화·화상회의용 방음 부스. 오픈 코워킹 필수 모듈." },
    { itemKo: "라운지 소파·커피바", descKo: "레지머셜 무드 라운지 + 무한 커피머신. 추천 후기 1위 키워드." },
  ],
  furnitureBrands: [
    { nameKo: "데스커 (DESKER)", noteKo: "퍼시스그룹 스타트업·SOHO 가구. 2026 모션데스크 프리미엄(최저 630mm)·S03 소파로 레지머셜 트렌드 주도.", sourceKo: "desker.co.kr, 다음 2026-03-24" },
    { nameKo: "시디즈 (Sidiz)", noteKo: "퍼시스그룹 인간공학 의자 전문. 공유오피스 좌석 표준.", sourceKo: "namu.wiki 시디즈" },
    { nameKo: "퍼시스 (Fursys)", noteKo: "국내 대표 사무가구. 모듈 데스크·수납·회의 가구 일괄 공급.", sourceKo: "fursys.com" },
    { nameKo: "듀오백 (Duoback)", noteKo: "2026 '라이트오피스'·모션데스크 신제품 출시. 등받이 인간공학 의자 강점.", sourceKo: "asiae.co.kr 2026-05-20" },
  ],
  specialistFirms: [
    { nameKo: "퍼플식스 스튜디오 (purple6)", typeKo: "오피스 인테리어 전문(퍼시스 출발)", noteKo: "사무환경 리딩 그룹 퍼시스에서 출발한 오피스 인테리어 전문 브랜드. 코워킹·그린월 디자인.", sourceKo: "purple6.studio" },
    { nameKo: "스페이스클라우드", typeKo: "공간대여 플랫폼", noteKo: "독립오피스·코워킹오피스 카테고리 운영. 단기 오피스 대관 노출 채널.", sourceKo: "spacecloud.kr" },
  ],
  caveatKo: "참고용 데이터로 실제 발주·계약 전 가격·사양·브랜드 라인업을 반드시 직접 검증하세요.",
},

"practice-room": {
  colorTrend2026: {
    nameKo: "방음 우선 + 웜 우드 흡음 마감",
    descKo: "연습실은 컬러보다 음향 성능이 우선. 다만 마감재는 웜 우드·흡음 패브릭으로 2026 절제된 따뜻함을 더해 보컬·악기 연습 후기의 체감 쾌적도를 높이는 추세.",
    sourceKo: "Threads reon_design 2026 트렌드(뉴트로 우드), Pantone 2026(보조 화이트)",
  },
  trends2026: [
    { titleKo: "조립식 목재 방음부스 보급",
      descKo: "현장 타설보다 빠르고 이전 설치가 가능한 조립식 목재 방음부스가 표준화(조용한청년들 등). 24시간 운영·민원 0건 대응.",
      sourceKo: "조용한청년들 (hush.kr)" },
    { titleKo: "용도별 특화 부스(보컬·피아노·업라이트)",
      descKo: "VOCAL·VOCAL LIGHT·PIANO·UPRIGHT 등 용도별 차음 성능 최적화 모델 라인업화. 악기·예산별 선택.",
      sourceKo: "조용한청년들 제품 라인 (hush.kr)" },
    { titleKo: "무인 예약·매칭 앱 연동",
      descKo: "방음방·스튜디오파이 등 연습실 검색·예약 앱과 무인 출입 연동으로 새벽 시간대 매출까지 확보.",
      sourceKo: "방음방 (bub.searchroom.kr), 스튜디오파이 앱" },
  ],
  furniture: [
    { itemKo: "이중구조 방음부스", descKo: "이중 차음 부스. 드럼·그랜드피아노 24시간 운영 시 민원 0건의 절대 조건." },
    { itemKo: "악기 거치·보관 시스템", descKo: "그랜드/업라이트 피아노 위치·드럼 거치·앰프 랙. 악기 보호와 동선." },
    { itemKo: "환기·항습 시스템", descKo: "전열교환기 + 항습. 피아노 조율 안정성·보컬 컨디션 보호." },
    { itemKo: "전면 거울·디머 조명", descKo: "보컬·댄스 연습용 거울 벽 + 밝기 조절 LED." },
  ],
  furnitureBrands: [
    { nameKo: "야마하 (Yamaha)", noteKo: "그랜드/업라이트 피아노·드럼·믹서·모니터 스피커 등 연습실 음향·악기 표준 브랜드.", sourceKo: "일반 악기 시장 통용" },
    { nameKo: "조용한청년들 (Hush)", noteKo: "조립식 목재 방음부스 1등 업체. VOCAL·PIANO·UPRIGHT 등 용도별 모델. 3000건+ 설치(서울 성수).", sourceKo: "hush.kr" },
  ],
  specialistFirms: [
    { nameKo: "조용한청년들 (Hush)", typeKo: "방음부스 제작·시공 전문", noteKo: "법인 운영, 누적 3000건+ 설치. 연예인·유튜버·기관 레퍼런스. 조립식·이전설치 강점.", sourceKo: "hush.kr" },
    { nameKo: "뮤트홈 (Mutehome)", typeKo: "방음부스·방음 시공 전문기업", noteKo: "방음부스·맞춤 방음 시공. 연습실·녹음실 대응.", sourceKo: "mutehome.co.kr" },
    { nameKo: "하모니스 (Harmonis)", typeKo: "방음부스 전문 업체", noteKo: "음악 연습실·방음부스 제작 전문.", sourceKo: "harmonis.co.kr" },
  ],
  caveatKo: "참고용 데이터로 실제 발주·계약 전 가격·사양·차음 성능(dB)을 반드시 직접 검증하세요. 입주 건물 소음 규정 사전 확인 필수.",
},

// ─────────────────────────────────────────────────────────
// 디지털·홈오피스 업종 공통 참고 노트
// ─────────────────────────────────────────────────────────
"_digital-home-office-note": {
  noteKo: "ai-application·b2b-saas·핀테크 등 온라인/스타트업 업종은 고객을 맞는 물리 매장 인테리어가 불필요하며, 인테리어 예산은 홈오피스 또는 공유오피스 기준의 '집중 가능한 최소 셋업'으로 충분합니다. 핵심은 전동 모션데스크 + 인간공학 의자 + 화상회의용 조명·집중부스 정도이며, 사무가구는 공유오피스 항목과 동일하게 데스커·시디즈·퍼시스 등 사무가구 브랜드를 참고하면 됩니다(2026 '레지머셜' 웜 톤 트렌드).",
  colorTrend2026: {
    nameKo: "레지머셜 웜 뉴트럴",
    descKo: "오피스를 집처럼 편안하게 만드는 레지머셜 트렌드 + 팬톤 '클라우드 댄서' 화이트 베이스.",
    sourceKo: "다음 2026-03-24(데스커), Pantone 2026",
  },
  trends2026: [
    { titleKo: "모션데스크 데스크셋업(데스크테리어)",
      descKo: "재택·N잡 확산으로 전동 높이조절 데스크 중심의 개인 업무공간 꾸미기가 2026 표준. 글로벌 홈오피스 가구 시장 2025년 384억달러→2031년 586억달러 성장 전망.",
      sourceKo: "다음 2026-03-24, 나무위키 데스크테리어" },
  ],
  furniture: [
    { itemKo: "전동 모션데스크 + 인간공학 의자", descKo: "앉고 서는 전동 데스크 + 인체공학 의자. 1인 집중 업무의 최소 핵심 셋업." },
  ],
  furnitureBrands: [
    { nameKo: "데스커 (DESKER)", noteKo: "스타트업·1인 오피스 가구. 2026 모션데스크 프리미엄.", sourceKo: "desker.co.kr" },
    { nameKo: "시디즈 (Sidiz)", noteKo: "인간공학 의자 표준.", sourceKo: "namu.wiki 시디즈" },
  ],
  caveatKo: "참고용 데이터로 실제 발주 전 사양·가격을 직접 검증하세요. 온라인 업종은 매장 인테리어 비용 자체를 최소화하는 것이 원칙.",
},

};
