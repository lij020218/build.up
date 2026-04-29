/**
 * 프랜차이즈 브랜드 별 본사 공급 인테리어·자재·집기 데이터.
 *
 * 데이터 우선순위 (ConstructionSetupStage):
 *   ① selectedFranchiseBrandId 가 설정된 경우 → 본 파일의 FRANCHISE_INTERIOR_DATA[brandId]
 *      (본사 표준 패키지가 sub-industry 일반 트렌드보다 우선)
 *   ② sub-industry 별 데이터 (sub-industry-interior-data.ts)
 *   ③ category 폴백 (categoryDataMap)
 *
 * 각 프랜차이즈는 본사가 공급하는 품목·표준 컨셉·자율도가 다름.
 * - flexibility "strict": 본사 지정 인테리어 업체 강제 (BBQ, 메가커피 등)
 * - flexibility "moderate": 본사 표준 + 일부 점주 자율 (이디야, 컴포즈)
 * - flexibility "flexible": 컨셉만 가이드, 점주가 업체 선정 (소규모 브랜드)
 */

export type FranchiseInteriorItem = {
  iconName: string;        // ConstructionSetupStage 의 iconMap key
  nameKo: string;
  descriptionKo: string;
};

export type FranchiseInteriorData = {
  /** 본사가 공급/지정하는 핵심 자재·장비·집기 (5~7개) */
  hqSuppliedItems: FranchiseInteriorItem[];
  /** 표준 인테리어 컨셉 (1~2개, 보통 1개의 시그니처) */
  standardConcept: {
    iconName: string;
    nameKo: string;
    descriptionKo: string;
    signatureColors: string;       // "노란색 + 화이트" 등
  };
  /** 점주 자율도 */
  flexibility: "strict" | "moderate" | "flexible";
  /** 인테리어·집기 추정 비용 (만원 단위) — 본사 공식 정보 기준 */
  estimatedInteriorCostWon?: number;
  /** 핵심 주의사항 / 점주가 알아야 할 포인트 */
  notes: string[];
  /** 데이터 출처 신뢰도 */
  confidence: "high" | "medium" | "low";
  /** 출처 (URL 또는 정보공개서) */
  sources?: Array<{ label: string; url?: string }>;
};

export const FRANCHISE_INTERIOR_DATA: Record<string, FranchiseInteriorData> = {
  "bbq": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "본사 표준 후드 + 환기 시스템",
        descriptionKo: "BBQ 표준 — 상업용 후드 + 옥상 덕트, 본사 지정 시공업체 강제. 평수에 따라 600~900만원대." },
      { iconName: "Flame", nameKo: "BBQ 전용 압력튀김기·올리브유 시스템",
        descriptionKo: "BBQ는 100% 올리브유 사용 — 본사 전용 압력튀김기 강제. 정품 외 사용 시 계약 해지 사유." },
      { iconName: "Monitor", nameKo: "본사 표준 POS·콜센터 연동 시스템",
        descriptionKo: "BBQ 통합 POS + 자체 콜센터·배달 연동. 본사 지정 단말기만 사용 가능." },
      { iconName: "Megaphone", nameKo: "외부 황색 BBQ 사인·간판 패키지",
        descriptionKo: "BBQ 시그니처 황색 로고 사인 + 외부 채널 간판. 본사 지정 사양 강제." },
      { iconName: "Table2", nameKo: "BBQ 표준 다이닝 가구·집기",
        descriptionKo: "치킨대학 표준 매뉴얼 기반 의자·테이블 패키지. 본사 지정 공급사." },
      { iconName: "Package", nameKo: "포장박스·소스·시즈닝 본사 독점 공급",
        descriptionKo: "BBQ 시그니처 박스·소스·시즈닝은 본사 독점 공급, 외부 구매 금지." },
    ],
    standardConcept: {
      iconName: "Flame",
      nameKo: "BBQ 시그니처 다이닝",
      descriptionKo: "황색·빨강·우드 톤의 캐주얼 패스트푸드 다이닝 — 치킨대학 표준 매뉴얼 기반. 외관 황색 BBQ 채널 사인 강제.",
      signatureColors: "황색 + 빨강 + 우드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 4200,
    notes: [
      "본사 지정 인테리어 업체 사용 강제 — 견적 비교·자체 시공 불가",
      "기준 평수 약 15평, 평당 인테리어 약 280만원",
      "100% 올리브유·시즈닝·박스 등 시그니처 자재 본사 독점 공급",
      "재계약·리뉴얼 시 본사 가이드라인에 따라 추가 인테리어 비용 발생",
    ],
    confidence: "high",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "BBQ 창업센터", url: "https://m.bbqchangup.co.kr/brand/bbq_bsk.asp" },
      { label: "비비큐(BBQ) 마이프차", url: "https://myfranchise.kr/20161241/BBQ" },
    ],
  },
  "bhc": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "본사 표준 후드·환기 시스템",
        descriptionKo: "BHC 표준 후드 + 덕트, 본사 지정 시공업체 사용. 약 500~700만원대." },
      { iconName: "Flame", nameKo: "본사 지정 튀김기·주방설비 패키지",
        descriptionKo: "BHC 전용 튀김기 + 주방설비 패키지. 정보공개서 기준 본사가 일괄 공급." },
      { iconName: "Monitor", nameKo: "본사 표준 POS·주문 시스템",
        descriptionKo: "BHC 통합 POS·배달앱 연동, 본사 지정 단말기 강제." },
      { iconName: "Megaphone", nameKo: "외부 빨강 BHC 사인·간판",
        descriptionKo: "BHC 시그니처 빨강·검정 사인. 본사 지정 사양·시공." },
      { iconName: "Package", nameKo: "뿌링클 시즈닝·소스·박스 독점 공급",
        descriptionKo: "BHC 시그니처 뿌링클·맛초킹 소스·시즈닝은 본사 독점 공급." },
      { iconName: "Table2", nameKo: "표준 가구·홀 집기 패키지",
        descriptionKo: "BHC 가맹 표준 의자·테이블·집기 — 본사 지정 공급사." },
    ],
    standardConcept: {
      iconName: "Sparkles",
      nameKo: "BHC 캐주얼 빨강 다이닝",
      descriptionKo: "빨강·검정 시그니처 — '화사한 분위기와 세련된 디자인의 젊은 공간' 컨셉. 외부 빨강 사인 강제.",
      signatureColors: "빨강 + 검정 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 3500,
    notes: [
      "본사 지정 시공업체·자재 공급 강제 — 단가가 일반 시공 대비 높을 수 있음",
      "냉장고·튀김기·POS·간판 등 별도 항목으로 청구되는 경우 多",
      "뿌링클·맛초킹 등 시그니처 시즈닝은 본사 독점 공급",
      "정보공개서 창업비용에 임차 보증금·권리금은 미포함",
    ],
    confidence: "medium",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "BHC 가맹점 개설 비용", url: "http://www.bhc.co.kr/foundation/cost.asp" },
      { label: "치킨 프랜차이즈 가이드 — 장사하자", url: "https://jshj.net/blog/chicken-franchise-startup-guide" },
    ],
  },
  "kyochon-chicken": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "교촌 표준 후드·덕트 시스템",
        descriptionKo: "교촌 표준 후드 + 덕트 시공, 본사 도면·감리 기반 시공업체 강제." },
      { iconName: "Flame", nameKo: "교촌 전용 튀김기 + 양념 작업대",
        descriptionKo: "교촌은 손으로 양념 바르는 공정 — 전용 튀김기 + 양념 작업대 본사 공급." },
      { iconName: "Monitor", nameKo: "교촌 통합 POS·주문 관리 시스템",
        descriptionKo: "본사 통합 POS, 배달·콜·매장 주문 통합. 본사 지정 단말기 사용." },
      { iconName: "Megaphone", nameKo: "버건디·오렌지 외부 사인 패키지",
        descriptionKo: "교촌 시그니처 버건디 + 오렌지 외부 사인. 본사 BI 가이드 강제." },
      { iconName: "Package", nameKo: "교촌 시그니처 간장·허니 소스 독점 공급",
        descriptionKo: "교촌 오리지날 간장 소스·허니 시즈닝은 본사 독점 공급." },
      { iconName: "Table2", nameKo: "표준형 매장 다이닝 가구",
        descriptionKo: "기준점포면적 약 66㎡(20평), 표준형 가구·집기 본사 지정." },
      { iconName: "Lightbulb", nameKo: "표준 조명·인테리어 마감재",
        descriptionKo: "최근 BI 리뉴얼로 모던 조명·코르크·금속 타공 등 본사 가이드 마감재 적용." },
    ],
    standardConcept: {
      iconName: "Crown",
      nameKo: "교촌 모던 다이닝",
      descriptionKo: "버건디 + 오렌지 포인트 — 전통 정성 + 젊은 감각 모던 다이닝. 화이트·블랙 마감, 친환경 코르크·금속 타공 적용.",
      signatureColors: "버건디 + 오렌지 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 9600,
    notes: [
      "치킨 3사 중 창업비용 가장 높음 — 업계 평균 1.2배 (66㎡ 기준 인테리어 9,600~11,900만원)",
      "본사 도면 설계 + 감리 강제, 시공업체 본사 협력사 위주",
      "9년 만에 BI·매장 인테리어 전면 리뉴얼(2023) — 기존 점주 리뉴얼 비용 부담 발생 가능",
      "보증금·권리금 별도 — 표준형 총 창업 2.4억~2.7억",
    ],
    confidence: "high",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "교촌치킨 국내사업", url: "https://www.kyochonfnb.com/business/domestic.do" },
      { label: "교촌치킨 마이프차", url: "https://myfranchise.kr/20080600002/%EA%B5%90%EC%B4%8C%EC%B9%98%ED%82%A8" },
      { label: "스카이데일리 — 교촌 창업비용 1.2배", url: "https://m.skyedaily.com/news_view.html?ID=234508" },
    ],
  },
  "goobne": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "오븐 환기·후드 시스템",
        descriptionKo: "굽네는 오븐 구이 전용 — 후드 + 덕트, 본사 표준 사양." },
      { iconName: "Flame", nameKo: "굽네 전용 컨베이어 오븐",
        descriptionKo: "굽네 시그니처 — 튀김기 대신 본사 전용 컨베이어 오븐 강제 공급." },
      { iconName: "Monitor", nameKo: "굽네 POS·배달 시스템",
        descriptionKo: "본사 통합 POS·배달앱 연동 단말기." },
      { iconName: "Megaphone", nameKo: "굽네 외부 사인·간판",
        descriptionKo: "굽네 시그니처 사인. 본사 지정 사양." },
      { iconName: "Package", nameKo: "고추바사삭·갈비천왕 등 시그니처 양념 독점",
        descriptionKo: "굽네 시그니처 양념·치즈는 본사 독점 공급." },
      { iconName: "Table2", nameKo: "주방집기·홀 가구 패키지",
        descriptionKo: "15평 기준 주방집기·홀 가구 — 본사 권장 사양." },
    ],
    standardConcept: {
      iconName: "Leaf",
      nameKo: "굽네 헬시 캐주얼",
      descriptionKo: "그린·옐로우 톤 — '구워서 더 맛있다' 헬시 컨셉의 캐주얼 매장. 배달 중심 콤팩트 매장.",
      signatureColors: "그린 + 옐로우 + 화이트"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3630,
    notes: [
      "본사는 도면 제작·감리만 지원 — 점주가 인테리어 업체 자율 선택 가능 (드문 케이스)",
      "주방집기·인테리어 비교 견적이 가능해 투자비 절감 여지 有",
      "단, 컨베이어 오븐·시즈닝 등 핵심 자재는 본사 독점 공급",
      "기준 평수 15평, 평당 약 242만원 인테리어",
    ],
    confidence: "high",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "굽네치킨 마이프차", url: "https://myfranchise.kr/20080200030/%EA%B5%BD%EB%84%A4%EC%B9%98%ED%82%A8" },
      { label: "굽네치킨 창업코리아", url: "https://bizk.co.kr/sub.html?soho_code=40&sort_code=198" },
    ],
  },
  "nene-chicken": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "표준 후드·덕트 시스템",
        descriptionKo: "본사 표준 후드 + 덕트. 12평 기준 콤팩트 사양." },
      { iconName: "Flame", nameKo: "네네 전용 튀김기·주방설비",
        descriptionKo: "본사 지정 튀김기 + 주방설비. 12평 배달 중심 매장에 최적화." },
      { iconName: "Monitor", nameKo: "본사 통합 POS",
        descriptionKo: "네네 본사 POS·배달앱 연동 단말기." },
      { iconName: "Megaphone", nameKo: "노랑·빨강 외부 사인",
        descriptionKo: "네네 시그니처 노랑·빨강 외부 사인. 본사 지정 사양." },
      { iconName: "Package", nameKo: "스노윙치즈·핫블링 등 시즈닝 독점 공급",
        descriptionKo: "네네 시그니처 시즈닝·소스는 본사 독점 공급." },
      { iconName: "Table2", nameKo: "표준 주방집기 + 간판 패키지",
        descriptionKo: "본사 표준 패키지 — 가맹비 0원 정책." },
    ],
    standardConcept: {
      iconName: "Sparkles",
      nameKo: "네네 캐주얼 옐로우",
      descriptionKo: "노랑·빨강 — 친근한 동네 치킨 컨셉. 12평 배달 중심 콤팩트 매장.",
      signatureColors: "노랑 + 빨강 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 1980,
    notes: [
      "가맹비 0원 정책 — 진입 장벽 낮음",
      "기준 평수 약 12평(40㎡), 배달 중심 매장이 표준",
      "본사 표준 패키지 가격은 저렴하나, 시즈닝·물류는 본사 독점 공급",
      "총 창업비용 약 6,000만~1억원 (정보공개서)",
    ],
    confidence: "medium",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "네네치킨 가맹 안내", url: "https://nenechicken.com/17_new/sub_business01_02.asp" },
      { label: "네네치킨 마이프차", url: "https://myfranchise.kr/20080100061/%EB%84%A4%EB%84%A4%EC%B9%98%ED%82%A8" },
    ],
  },
  "60gye-chicken": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "표준 후드·덕트 시스템",
        descriptionKo: "60계 표준 후드 + 덕트, 본사 지정 사양." },
      { iconName: "Flame", nameKo: "60계 전용 튀김기·주방설비",
        descriptionKo: "60계는 '하루 60마리 한정' 컨셉 — 신선유 튀김기 + 주방설비 1,200만원대." },
      { iconName: "Monitor", nameKo: "본사 표준 POS",
        descriptionKo: "60계 통합 POS·배달 시스템." },
      { iconName: "Megaphone", nameKo: "외부 간판·사인",
        descriptionKo: "60계 시그니처 사인 — 약 400만원." },
      { iconName: "Package", nameKo: "시그니처 양념·소스 본사 공급",
        descriptionKo: "60계 시즈닝·소스 본사 독점 공급. 초도비품 약 400만원." },
      { iconName: "Table2", nameKo: "주방집기·홀 가구",
        descriptionKo: "감리비 200만원 별도, 평당 192만원 인테리어." },
    ],
    standardConcept: {
      iconName: "Star",
      nameKo: "60계 깨끗한 매장",
      descriptionKo: "화이트·옐로우 톤 — '하루 60마리만, 신선한 기름' 청결 컨셉. 모던 캐주얼.",
      signatureColors: "화이트 + 옐로우 + 블랙"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3840,
    notes: [
      "복수 인테리어 업체 비교 견적 후 가맹점주 선택 가능 (드문 케이스)",
      "기본 창업비용 약 8,000만원(VAT포함), 추가 공사 10% 이상 발생",
      "임대보증금·권리금 포함 총 창업 약 2억~2.8억",
      "감리비 200만원 별도 — 본사가 시공 감독",
    ],
    confidence: "medium",
    sources: [
      { label: "60계치킨 창업안내", url: "http://60chicken.co.kr/bbs/content.php?co_id=fran01" },
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "60계 창업비용 — 머니타임", url: "https://money.anytimetopic.com/entry/60%EA%B3%84-%EC%B9%98%ED%82%A8-%EC%B0%BD%EC%97%85%EB%B9%84%EC%9A%A9-%EB%B0%8F-%EC%88%98%EC%9D%B5-%EC%9D%B4-%EC%A0%95%EB%8F%84-%EB%82%98%EC%98%B5%EB%8B%88%EB%8B%A4" },
    ],
  },
  "hosik-chicken": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "닥트·환기공사",
        descriptionKo: "10평 기준 필수 닥트 공사 — 본사 표준." },
      { iconName: "Flame", nameKo: "튀김기 + 전기증설 공사",
        descriptionKo: "튀김기 + 전기증설 — 두마리 동시 튀김 가능 설비." },
      { iconName: "Monitor", nameKo: "본사 POS·주문 단말기",
        descriptionKo: "호식이 통합 POS." },
      { iconName: "Bike", nameKo: "배달 오토바이",
        descriptionKo: "배달 중심 — 오토바이 1~2대 별도 비용." },
      { iconName: "Package", nameKo: "양념·소스 본사 독점 공급",
        descriptionKo: "레드페퍼·핫치즈·어니언 등 시그니처 양념 본사 독점." },
      { iconName: "Megaphone", nameKo: "외부 간판·사인",
        descriptionKo: "호식이 시그니처 사인." },
    ],
    standardConcept: {
      iconName: "Smile",
      nameKo: "호식이 동네 배달형",
      descriptionKo: "옐로우·레드 — 친근한 동네 치킨 컨셉. 10평 배달 중심 콤팩트 매장.",
      signatureColors: "옐로우 + 레드 + 화이트"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 1530,
    notes: [
      "기준 평수 10평으로 진입 장벽 매우 낮음 (총 창업 2,270만원)",
      "닥트·전기증설 등 필수 공사 추가 비용 발생",
      "오토바이·배달박스 등 배달 운영 자재 별도",
      "20년 이상 장수 프랜차이즈 — 노후 매장 리뉴얼 부담 발생 가능",
    ],
    confidence: "medium",
    sources: [
      { label: "호식이두마리치킨 공식", url: "https://www.9922.co.kr/" },
      { label: "호식이 마이프차", url: "https://myfranchise.kr/20080600014/%ED%98%B8%EC%8B%9D%EC%9D%B4%EB%91%90%EB%A7%88%EB%A6%AC%EC%B9%98%ED%82%A8" },
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
    ],
  },
  "norang-tongdak": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "노랑통닭 시그니처 가마솥",
        descriptionKo: "노랑통닭 트레이드마크 — 가마솥 튀김기 본사 독점 공급. 배달형 410만원, 카페형 630만원." },
      { iconName: "Wind", nameKo: "후드·덕트 시스템",
        descriptionKo: "가마솥 환기에 특화된 후드·덕트, 본사 지정." },
      { iconName: "Monitor", nameKo: "본사 표준 POS",
        descriptionKo: "노랑통닭 통합 POS·배달 시스템." },
      { iconName: "Megaphone", nameKo: "노랑 외부 사인·간판",
        descriptionKo: "시그니처 노랑 사인 — 약 350만원. 추억·복고 컨셉." },
      { iconName: "Package", nameKo: "양념·소스·종이봉투 패키지",
        descriptionKo: "시그니처 양념·복고풍 종이봉투·박스 본사 독점 공급." },
      { iconName: "Table2", nameKo: "카페형 의탁자·주방기기",
        descriptionKo: "카페형(20~30평) 의탁자 200~350만원, 주방기기 540만원." },
    ],
    standardConcept: {
      iconName: "Sun",
      nameKo: "노랑통닭 추억 빈티지",
      descriptionKo: "노랑·빈티지 우드 — '추억의 옛날통닭' 복고 컨셉. 가마솥 + 종이봉투 시그니처.",
      signatureColors: "노랑 + 우드 + 빈티지 브라운"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 2900,
    notes: [
      "가마솥은 본사 독점 공급 — 노랑통닭 시그니처, 외부 구매 불가",
      "배달형 10평·카페형 20~30평 두 가지 표준 모델",
      "MOU 은행 통한 최대 3,000만원 창업대출 지원",
      "5년마다 리뉴얼 의무로 추가 비용 부담 사례 보도",
    ],
    confidence: "high",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "노랑통닭 마이프차", url: "https://myfranchise.kr/20130176/%EB%85%B8%EB%9E%91%ED%86%B5%EB%8B%AD" },
      { label: "비즈한국 — 5년마다 리뉴얼 의무", url: "https://www.bizhankook.com/bk/article/25869" },
    ],
  },
  "puradak": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "표준 후드·덕트 시스템",
        descriptionKo: "푸라닭 표준 후드. 10평 배달 중심 사양." },
      { iconName: "Flame", nameKo: "푸라닭 전용 튀김기·주방설비",
        descriptionKo: "본사 지정 튀김기·주방설비 — 약 4,774만원 패키지." },
      { iconName: "Monitor", nameKo: "본사 통합 POS",
        descriptionKo: "푸라닭 POS·배달앱 연동." },
      { iconName: "Megaphone", nameKo: "블랙·골드 외부 사인",
        descriptionKo: "푸라닭 시그니처 블랙 + 골드 럭셔리 사인. 본사 강제." },
      { iconName: "Package", nameKo: "시그니처 소스·박스 독점 공급",
        descriptionKo: "푸라닭 블랙 패키지·소스·시즈닝은 본사 독점 공급." },
      { iconName: "Lightbulb", nameKo: "프리미엄 조명·마감재",
        descriptionKo: "딥블랙 매장은 라운지형 조명·고급 마감재 본사 가이드." },
      { iconName: "Table2", nameKo: "다이닝 가구·집기",
        descriptionKo: "푸라닭 2.0 딥블랙 — 라운지형 의탁자 본사 지정." },
    ],
    standardConcept: {
      iconName: "Gem",
      nameKo: "푸라닭 블랙 럭셔리",
      descriptionKo: "블랙 + 골드 — '치킨 다이닝 라운지' 럭셔리 컨셉. 푸라닭 2.0 딥블랙은 레스토랑 수준 라운지형.",
      signatureColors: "블랙 + 골드 + 다크 브라운"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 1880,
    notes: [
      "10평 기준 총 창업 약 7,570만원 (임대료·보증금 별도)",
      "푸라닭 2.0 딥블랙은 별도 프리미엄 모델 — 라운지형 인테리어 비용 추가 大",
      "블랙·골드 시그니처 색상·패키지·박스는 본사 독점 공급",
      "선착순 한정 창업 지원 혜택은 조건부 — 1:1 상담 필수",
    ],
    confidence: "medium",
    sources: [
      { label: "푸라닭 치킨 공식", url: "https://puradakchicken.com/main/index.asp" },
      { label: "푸라닭 마이프차", url: "https://myfranchise.kr/20150218/%ED%91%B8%EB%9D%BC%EB%8B%AD%EC%B9%98%ED%82%A8" },
      { label: "푸라닭 2.0 딥블랙 — 스마트투데이", url: "https://www.smarttoday.co.kr/news/articleView.html?idxno=97542" },
    ],
  },
  "cheogapjib": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "표준 후드·덕트 시스템",
        descriptionKo: "처갓집 표준 후드 + 덕트, 본사 지정 시공." },
      { iconName: "Flame", nameKo: "표준 튀김기·주방설비",
        descriptionKo: "양념치킨 전문 — 양념 작업대 + 튀김기 본사 공급." },
      { iconName: "Monitor", nameKo: "본사 표준 POS",
        descriptionKo: "처갓집 통합 POS·배달앱 연동." },
      { iconName: "Megaphone", nameKo: "외부 간판·사인",
        descriptionKo: "처갓집 시그니처 사인 — 빨강·화이트 톤." },
      { iconName: "Package", nameKo: "원조 양념소스 독점 공급",
        descriptionKo: "처갓집 시그니처 양념소스 — 본사 독점 공급. 양념치킨 원조 브랜드." },
      { iconName: "Table2", nameKo: "주방집기·홀 가구",
        descriptionKo: "10평 배달형 기준 주방집기·홀 가구 패키지." },
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "처갓집 양념 캐주얼",
      descriptionKo: "빨강·화이트 — 1979년 시작된 원조 양념치킨 브랜드. 친근한 동네 치킨 컨셉.",
      signatureColors: "빨강 + 화이트 + 옐로우"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 1500,
    notes: [
      "초기 창업비용 약 2,685만원으로 매우 저렴 (10평 배달형 기준)",
      "원조 양념치킨 — 시그니처 양념 본사 독점 공급",
      "정보공개서 창업비용에 임차 보증금·권리금 미포함",
      "월 매출 평균 2,655만원, 영업이익률 낮은 편 (24년 공정위)",
    ],
    confidence: "low",
    sources: [
      { label: "처갓집 양념치킨 공식", url: "https://www.cheogajip.co.kr/" },
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "처갓집 나무위키", url: "https://namu.wiki/w/%EC%B2%98%EA%B0%93%EC%A7%91%20%EC%96%91%EB%85%90%EC%B9%98%ED%82%A8" },
    ],
  },
  "moms-touch": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "표준 후드·덕트 시스템",
        descriptionKo: "맘스터치 표준 후드 — 본사 지정 시공." },
      { iconName: "Flame", nameKo: "버거·치킨 통합 주방설비",
        descriptionKo: "버거 그릴 + 치킨 튀김기 통합 — 본사 지정 패키지." },
      { iconName: "Monitor", nameKo: "본사 통합 POS·키오스크",
        descriptionKo: "맘스터치 POS·키오스크·배달앱 연동." },
      { iconName: "Megaphone", nameKo: "맘스터치 외부 사인·간판",
        descriptionKo: "맘스터치 시그니처 빨강·노랑 외부 사인." },
      { iconName: "Package", nameKo: "패티·번·소스 독점 공급",
        descriptionKo: "싸이패티·번·시그니처 소스는 본사 독점 공급." },
      { iconName: "Table2", nameKo: "다이닝 가구·집기 패키지",
        descriptionKo: "브라운·그레이 톤 가구. 인테리어 약 5,892만원." },
      { iconName: "Lightbulb", nameKo: "표준 조명·마감재",
        descriptionKo: "엄마의 따뜻함 컨셉 — 따뜻한 톤 조명·마감재." },
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "맘스터치 따뜻한 다이닝",
      descriptionKo: "브라운·그레이 + 빨강·노랑 — '엄마의 따뜻한 마음과 편안함' 컨셉. 따뜻한 톤 캐주얼 패스트푸드.",
      signatureColors: "브라운 + 그레이 + 빨강 + 노랑"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 5892,
    notes: [
      "본사 직접 투자 '창업 인큐베이팅' 운영 — 60개월 분할 상환 (초기 부담 50% 이하)",
      "기존 1.4억 → 효율화로 약 1억 수준으로 인하 (20평 기준)",
      "버거 + 치킨 통합 매장 — 주방설비 패키지가 일반 치킨보다 큼",
      "패티·번·소스 등 본사 독점 공급 자재 비중 큼",
    ],
    confidence: "high",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "맘스터치 마이프차", url: "https://myfranchise.kr/20080100157/%EB%A7%98%EC%8A%A4%ED%84%B0%EC%B9%98" },
      { label: "맘스터치 창업 인큐베이팅 — 한국경제", url: "https://www.hankyung.com/article/202206149466i" },
    ],
  },
  "lotteria": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "표준 후드·덕트 + 환기 패키지",
        descriptionKo: "롯데리아 표준 후드 + 덕트, 본사 지정 시공." },
      { iconName: "Flame", nameKo: "버거 통합 주방설비",
        descriptionKo: "그릴·튀김기·번 토스터 통합 — 본사 지정 패키지." },
      { iconName: "Monitor", nameKo: "본사 통합 POS + 키오스크",
        descriptionKo: "롯데리아 POS·키오스크·배달 통합 시스템." },
      { iconName: "Megaphone", nameKo: "스칼렛 빨강 외부 사인·간판",
        descriptionKo: "롯데리아 시그니처 빨강 사인 — 새 BI(2024) 적용." },
      { iconName: "Package", nameKo: "패티·번·시즈닝 본사 독점 공급",
        descriptionKo: "롯데GRS 통합 물류 — 패티·번·소스·시즈닝 본사 독점." },
      { iconName: "Table2", nameKo: "패밀리형/정규형 다이닝 가구",
        descriptionKo: "25~80평 면적별 표준 가구·집기 패키지. 인테리어 평당 약 226만원." },
      { iconName: "Lightbulb", nameKo: "신규 매장 디자인 컨셉(2024 BI)",
        descriptionKo: "패키지·매장 내·외부 그래픽 통합 리뉴얼 — 본사 가이드 강제." },
    ],
    standardConcept: {
      iconName: "Flame",
      nameKo: "롯데리아 모던 패스트푸드",
      descriptionKo: "스칼렛 빨강 + 화이트 — '맛있는 즐거움' 컨셉. 2024 새 BI 모던 패스트푸드 다이닝.",
      signatureColors: "빨강 + 화이트 + 옐로우"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 5950,
    notes: [
      "80평 기준 창업비용 약 3.8억원(VAT 별도, 임차보증금 별도)",
      "면적별 표준화 — 25평 5,950만원 ~ 80평 1억8,150만원 인테리어",
      "본사 지정 자체공사 시 매뉴얼비 추가 — 자율 시공 사실상 불가",
      "2024년 새 BI 적용 — 기존 점주 그래픽·외부 사인 교체 부담 발생",
    ],
    confidence: "high",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "롯데리아 가맹점안내", url: "https://www.lotteeatz.com/footer/affilGuideRia" },
      { label: "롯데리아 마이프차", url: "https://myfranchise.kr/20080100155/%EB%A1%AF%EB%8D%B0%EB%A6%AC%EC%95%84" },
      { label: "롯데GRS 가맹점안내", url: "https://www.lottegrs.com/kor/company/franchisee.jsp" },
    ],
  },
  "subway": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "오븐 환기·후드 시스템",
        descriptionKo: "샌드위치 오븐 환기 — 본사 지정 사양." },
      { iconName: "Flame", nameKo: "샌드위치 오븐 + 야채 쿨러",
        descriptionKo: "본사 승인 오븐·쿨러·작업대. 장비/기자재 약 1억2,000만원." },
      { iconName: "Monitor", nameKo: "글로벌 표준 POS",
        descriptionKo: "써브웨이 글로벌 표준 POS — 본사 지정 단말기." },
      { iconName: "Megaphone", nameKo: "그린·옐로우 외부 사인",
        descriptionKo: "써브웨이 시그니처 그린·옐로우 사인. 글로벌 BI 강제." },
      { iconName: "Package", nameKo: "빵·소스·야채 본사 지정 공급망",
        descriptionKo: "글로벌 표준 — 빵·소스·시그니처 야채 본사 승인 공급사만 사용." },
      { iconName: "Table2", nameKo: "오픈 키친 카운터·다이닝",
        descriptionKo: "오픈 키친 컨셉 — 카운터형 가구·집기 본사 지정. 평당 약 210만원." },
    ],
    standardConcept: {
      iconName: "Leaf",
      nameKo: "써브웨이 그린 오픈키친",
      descriptionKo: "그린·옐로우·화이트 — '신선한 채소' 헬시 컨셉. 오픈 키친 카운터형 글로벌 표준 디자인.",
      signatureColors: "그린 + 옐로우 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 5250,
    notes: [
      "글로벌 본사 BI·표준 강제 — 자율도 가장 낮음",
      "장비/기자재 약 1.2억원으로 치킨 대비 매우 높음 (총 창업 2.5억~4억)",
      "로열티 매출 8% + 광고분담금 4.5% (글로벌 표준)",
      "빵·야채·소스 본사 승인 공급사만 사용 — 자체 매입 불가",
    ],
    confidence: "medium",
    sources: [
      { label: "써브웨이 코리아 가맹", url: "https://www.subway.co.kr/franchise" },
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "서브웨이 창업비용 — 머니타임", url: "https://money.anytimetopic.com/entry/서브웨이-창업비용-및-월수익률-100-총정리" },
    ],
  },
  "dominos": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "도우 오븐 환기·후드",
        descriptionKo: "도미노 표준 — 피자 오븐 전용 후드·덕트." },
      { iconName: "Flame", nameKo: "전용 컨베이어 피자 오븐",
        descriptionKo: "도미노 글로벌 표준 컨베이어 오븐 — 본사 독점 공급." },
      { iconName: "Monitor", nameKo: "글로벌 통합 POS·주문 시스템",
        descriptionKo: "도미노 글로벌 GPS 트래킹·POS — 본사 지정 시스템." },
      { iconName: "Bike", nameKo: "배달 오토바이·박스",
        descriptionKo: "30분 배달 컨셉 — 오토바이·보온 박스 패키지." },
      { iconName: "Megaphone", nameKo: "파랑·빨강 외부 사인",
        descriptionKo: "도미노 시그니처 파랑·빨강 글로벌 BI 사인." },
      { iconName: "Package", nameKo: "도우·치즈·소스 본사 독점 공급",
        descriptionKo: "글로벌 표준 도우·치즈·소스 본사 독점 공급망." },
      { iconName: "Table2", nameKo: "오픈키친·다이닝 가구",
        descriptionKo: "25평 표준 — 오픈키친 카운터·다이닝 가구 본사 지정." },
    ],
    standardConcept: {
      iconName: "Compass",
      nameKo: "도미노 글로벌 다이닝",
      descriptionKo: "파랑 + 빨강 — '30분 안 배달' 글로벌 BI 컨셉. 오픈 키친·콤팩트 다이닝.",
      signatureColors: "파랑 + 빨강 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 9000,
    notes: [
      "표준 25평 기준 인테리어 평당 약 360만원 — 피자 카테고리 최상위",
      "총 창업비용 2.5억~4억(점포 포함) — 가맹비 3,520만원, 보증금 500만원",
      "월 로열티 6% + 광고분담금 별도 — 가맹점 부담 큼",
      "글로벌 표준 — 오븐·도우·치즈 등 본사 독점, 자체 매입 불가",
    ],
    confidence: "high",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "도미노피자 마이프차", url: "https://myfranchise.kr/20080100159/%EB%8F%84%EB%AF%B8%EB%85%B8%ED%94%BC%EC%9E%90" },
      { label: "비즈한국 — 피자 창업비용", url: "https://www.bizhankook.com/bk/article/12685" },
    ],
  },
  "pizza-hut": {
    hqSuppliedItems: [
      { iconName: "Wind", nameKo: "표준 후드·덕트 시스템",
        descriptionKo: "피자헛 표준 후드 — 본사 지정 시공." },
      { iconName: "Flame", nameKo: "피자헛 전용 컨베이어 오븐",
        descriptionKo: "피자헛 글로벌 표준 오븐 — 본사 독점 공급." },
      { iconName: "Monitor", nameKo: "글로벌 통합 POS",
        descriptionKo: "피자헛 글로벌 POS·콜수수료 시스템 (건당 1,059원)." },
      { iconName: "Megaphone", nameKo: "빨강 외부 사인·간판",
        descriptionKo: "피자헛 시그니처 빨강 사인 — 글로벌 BI." },
      { iconName: "Package", nameKo: "도우·치즈·소스 본사 독점 공급",
        descriptionKo: "글로벌 표준 — 도우·치즈·시그니처 소스 본사 독점." },
      { iconName: "Table2", nameKo: "레스토랑형 다이닝 가구",
        descriptionKo: "레스토랑형 198㎡ 기준 인테리어·집기 약 3.78억원." },
      { iconName: "Lightbulb", nameKo: "다이닝 조명·인테리어",
        descriptionKo: "레스토랑형 — 조명·바닥재·테이블 본사 가이드 강제." },
    ],
    standardConcept: {
      iconName: "Crown",
      nameKo: "피자헛 레스토랑 다이닝",
      descriptionKo: "빨강 + 우드 — 글로벌 레스토랑 컨셉. 패스트푸드 + 다이닝 하이브리드.",
      signatureColors: "빨강 + 화이트 + 우드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 8019,
    notes: [
      "레스토랑형 198㎡ 창업비용 약 4.66억원 — 국내 피자 최상위",
      "평당 인테리어 — 레스토랑 325만원, 배달형 260만원",
      "로열티 6% + 광고판촉비 매출의 5% + 콜수수료 건당 1,059원",
      "글로벌 BI 강제 — 자체 시공·외관 변경 불가",
    ],
    confidence: "medium",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "비즈한국 — 피자 창업비용", url: "https://www.bizhankook.com/bk/article/12685" },
      { label: "비즈워치 — 도미노·피자헛", url: "http://news.bizwatch.co.kr/article/consumer/2018/02/26/0024" },
    ],
  },
  "pizza-school": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "피자스쿨 표준 오븐",
        descriptionKo: "피자스쿨 표준 오븐 — 본사 지정 사양." },
      { iconName: "Wind", nameKo: "후드·덕트 + 가스 공사",
        descriptionKo: "피자 오븐 후드·덕트, 가스공사 본사 지정 시공." },
      { iconName: "Monitor", nameKo: "본사 표준 POS",
        descriptionKo: "피자스쿨 POS·배달 단말기 패키지." },
      { iconName: "Megaphone", nameKo: "외부 간판",
        descriptionKo: "피자스쿨 시그니처 사인 — 약 350만원." },
      { iconName: "Package", nameKo: "도우·치즈·토핑 독점 공급",
        descriptionKo: "피자스쿨 시그니처 도우·치즈·토핑 본사 독점 공급. 주방설비 + 홍보 약 2,500만원." },
      { iconName: "Table2", nameKo: "10평 콤팩트 매장 가구",
        descriptionKo: "10평 기준 인테리어 1,500만원, 평당 추가 150만원." },
    ],
    standardConcept: {
      iconName: "BookOpen",
      nameKo: "피자스쿨 캐주얼 콤팩트",
      descriptionKo: "옐로우·레드 — '저렴한 가성비 피자' 컨셉. 10평 배달 중심 콤팩트 매장.",
      signatureColors: "옐로우 + 레드 + 화이트"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 1500,
    notes: [
      "10평 기준 기본 창업 약 5,350만원 — 피자 카테고리 진입 장벽 가장 낮음",
      "평당 인테리어 약 150만원 — 도미노·피자헛 대비 1/2 이하",
      "정수기·냉난방·가스·전기 추가 공사 5~10% 별도 발생",
      "보증금·권리금 포함 총 약 1억원 (서울/경기 기준)",
    ],
    confidence: "medium",
    sources: [
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "피자스쿨 마이프차", url: "https://myfranchise.kr/20080100190/%ED%94%BC%EC%9E%90%EC%8A%A4%EC%BF%A8" },
      { label: "피자스쿨 — 장사하자", url: "https://jshj.net/brands/%ED%94%BC%EC%9E%90%EC%8A%A4%EC%BF%A8-BRD_20120600009" },
    ],
  },
  "dookki": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "두끼 무한리필 떡볶이 조리대",
        descriptionKo: "테이블별 인덕션 + 떡볶이 냄비 — 본사 지정 사양." },
      { iconName: "Wind", nameKo: "환기·후드 + 테이블 인덕션 전기증설",
        descriptionKo: "테이블 인덕션 다수 사용 — 전기증설·후드 본사 지정 시공." },
      { iconName: "Monitor", nameKo: "본사 통합 POS·키오스크",
        descriptionKo: "뷔페 입장권 시스템 — 본사 지정 POS·키오스크." },
      { iconName: "Megaphone", nameKo: "외부 사인·간판",
        descriptionKo: "두끼 시그니처 사인 — 본사 표준." },
      { iconName: "Package", nameKo: "떡·소스·재료 본사 독점 공급",
        descriptionKo: "두끼만의 노하우 식재료·기물 — 본사 독점 공급망." },
      { iconName: "Table2", nameKo: "뷔페형 셀프바 + 다이닝 가구",
        descriptionKo: "30~70평 — 셀프바·다이닝 가구 본사 표준 패키지." },
      { iconName: "Lightbulb", nameKo: "표준 조명·마감재",
        descriptionKo: "뷔페형 캐주얼 다이닝 조명·마감재 본사 가이드." },
    ],
    standardConcept: {
      iconName: "Sparkles",
      nameKo: "두끼 무한리필 뷔페",
      descriptionKo: "레드·화이트 + 우드 — '즉석 무한리필 떡볶이 뷔페' 캐주얼 다이닝. 30~70평 대형 매장.",
      signatureColors: "레드 + 화이트 + 우드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 8000,
    notes: [
      "기준 평수 30~70평으로 떡볶이 카테고리 최대 — 임대료 200~500만원 권장",
      "테이블 인덕션 다수 — 전기증설·환기 공사 비용 多",
      "30평 1.38억~3억, 40평 1.61억~3.11억 (정보공개서)",
      "로열티 0원, 월 매출 평균 4억대 — 단, 뷔페 운영 노동 강도 높음",
    ],
    confidence: "medium",
    sources: [
      { label: "두끼 떡볶이 창업", url: "https://dookki.co.kr/competive/cost" },
      { label: "공정거래위원회 정보공개서", url: "https://franchise.ftc.go.kr" },
      { label: "두끼 마이프차", url: "https://myfranchise.kr/20150385/%EB%91%90%EB%81%BC" },
      { label: "한국공정거래조정원 두끼", url: "https://www.k-franchise.or.kr/brand/bprl/detail?brndCd=BR00010596&frcsorNo=F000007523" },
    ],
  },

  "compose-coffee": {
    hqSuppliedItems: [
      { iconName: "Coffee", nameKo: "에스프레소 머신·그라인더 패키지",
        descriptionKo: "본사 지정 — 신품 머신·그라인더·정수기·온수기 일괄 공급. 평균 기기·장비비 3,000만~4,000만원대." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 지정 POS·키오스크 — 무좌석 컴팩트 매장 회전율의 핵심." },
      { iconName: "Megaphone", nameKo: "보라색 시그니처 간판·외부 사인",
        descriptionKo: "보라+화이트 컬러의 표준 외부 사인. 본사 통일 디자인 강제." },
      { iconName: "Package", nameKo: "로고 컵·빨대·홀더 등 패키징 풀세트",
        descriptionKo: "본사 일괄 공급 — 단일 디자인 강제, 점주 임의 변경 불가." },
      { iconName: "Paintbrush", nameKo: "인테리어·내장 시공 (지정업체)",
        descriptionKo: "10평 기준 평당 약 160만원, 표준 1,600만원선 — 본사 협력업체 시공." },
      { iconName: "Box", nameKo: "원두·시럽·파우더 등 원부자재",
        descriptionKo: "본사 또는 지정 업체 통한 의무 매입 — 유통 마진이 본사 주 수익원." },
    ],
    standardConcept: {
      iconName: "Sparkles",
      nameKo: "보라색 컴팩트 스마트 매장",
      descriptionKo: "보라+화이트 톤·키오스크 중심 5~10평 컴팩트 매장. 뉴트로 감성과 운영 효율을 결합한 무좌석/소좌석 형태.",
      signatureColors: "보라 + 화이트 + 우드 액센트",
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 1600,
    notes: [
      "10평 기준 공식 창업비용 약 6,708만원 — 점포비·권리금 별도",
      "본사 지정 시공업체 사용이 원칙, 단가 비교 협상 어려움",
      "원·부자재 본사 일괄 공급 — 본사 영업이익률 41.2%로 가맹점 수익은 박리다매 구조",
      "표준 매장은 5~10평 컴팩트, 그 이상 시 평당 추가 비용",
    ],
    confidence: "high",
    sources: [
      { label: "컴포즈커피 공식 창업비용", url: "https://composecoffee.com/startupcost" },
      { label: "더스쿠프 — 본사 영업이익률 41.2%", url: "https://www.thescoop.co.kr/news/articleView.html?idxno=302254" },
      { label: "마이프차 컴포즈커피", url: "https://myfranchise.kr/20141250/%EC%BB%B4%ED%8F%AC%EC%A6%88%EC%BB%A4%ED%94%BC-COMPOSE-COFFEE-" },
    ],
  },

  "mega-coffee": {
    hqSuppliedItems: [
      { iconName: "Coffee", nameKo: "표준 에스프레소 머신·그라인더",
        descriptionKo: "본사 지정 모델 — 기기·장비 패키지 약 3,300만원선." },
      { iconName: "Monitor", nameKo: "POS·키오스크 (별도사항)",
        descriptionKo: "본사 지정. POS&키오스크는 기본 창업비용과 별도 청구." },
      { iconName: "Megaphone", nameKo: "노란색 시그니처 간판·외부 사인",
        descriptionKo: "노랑+검정 강한 비주얼 — 외부 사인 약 1,000만원." },
      { iconName: "LayoutGrid", nameKo: "10~15평 표준 매장 도면",
        descriptionKo: "10평 기준 표준 설계 — 그 이상은 평당 추가 인테리어비." },
      { iconName: "Package", nameKo: "로고 컵·홀더·빨대 등 패키징",
        descriptionKo: "MEGA 로고 패키지 본사 공급 — 단일 디자인." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공 (본사 협력)",
        descriptionKo: "기준점포 평당 약 154만원 — 저가 커피 중 인테리어비 낮은 편." },
    ],
    standardConcept: {
      iconName: "Sun",
      nameKo: "노란색 시그니처 표준 매장",
      descriptionKo: "노랑+검정 강렬한 컬러 + 키오스크 중심 컴팩트 매장. 10~15평 회전율형.",
      signatureColors: "노랑 + 검정 + 화이트",
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 1540,
    notes: [
      "10평 기준 약 1.2억~1.6억원 (VAT 별도, 점포비 제외)",
      "POS·키오스크·냉난방·전기증설은 모두 별도 — 추가 비용 부풀려짐",
      "본사 정보공개서 vs 홈페이지 표기 1,250만원 차이 논란 (시장경제 보도)",
      "원부자재 본사 일괄 매입 의무 — 마진율 가맹점 압박 요소",
    ],
    confidence: "high",
    sources: [
      { label: "메가커피 공식 창업비용", url: "https://www.mega-mgccoffee.com/startup/cost/" },
      { label: "시장경제 — 정보공개서 논평", url: "https://www.meconomynews.com/news/articleView.html?idxno=30513" },
      { label: "뉴시스 — 저가커피 창업비 비교", url: "https://www.newsis.com/view/NISX20230818_0002418932" },
    ],
  },

  "ediya-coffee": {
    hqSuppliedItems: [
      { iconName: "Coffee", nameKo: "에스프레소 머신·그라인더·온수기",
        descriptionKo: "초도물품으로 머신·정수기·그라인더·온수기 등 일괄 공급." },
      { iconName: "Monitor", nameKo: "POS·키오스크 시스템",
        descriptionKo: "본사 지정 POS — 본사 통합 매출 관리 연동." },
      { iconName: "Megaphone", nameKo: "블루 시그니처 외부 사인·간판",
        descriptionKo: "EDIYA 블루 컬러 외부 사인 — 본사 표준 디자인." },
      { iconName: "Package", nameKo: "로고 컵·홀더·MD 패키징",
        descriptionKo: "단일 디자인 본사 공급." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공 (자체 가능, 본사 검수)",
        descriptionKo: "자체공사 가능하나 본사가 시공업체 적정성 검수. 계약 후 20일 내 시공." },
      { iconName: "Box", nameKo: "원·부재료 (매일유업·동원 협력)",
        descriptionKo: "본사 협력사 통한 안정적 원부자재 공급 — 점주 임의 변경 불가." },
    ],
    standardConcept: {
      iconName: "Coffee",
      nameKo: "EDIYA 블루 동네카페",
      descriptionKo: "블루 시그니처 + 우드 톤 — 좌석을 갖춘 동네 사랑방형 중간 규모 매장.",
      signatureColors: "EDIYA 블루 + 우드 + 화이트",
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4500,
    notes: [
      "평균 창업비용 약 1.29억원 — 20평대 메인상권은 2억원 가까이",
      "가맹비 1,200만원, 인테리어 자체 시공은 가능하나 본사 검수 통과 필요",
      "정보공개서 기준 가맹점 연평균 매출 약 1.98억원 — 매출 회전율 한계 인지 필수",
      "5년 단위 리뉴얼 요구 보고 — 갱신 시 추가 인테리어 비용 발생",
    ],
    confidence: "high",
    sources: [
      { label: "이디야커피 공식 창업안내", url: "https://ediya.com/C/contents/franchise_01.html" },
      { label: "마이프차 이디야커피", url: "https://myfranchise.kr/20080100014/%EC%9D%B4%EB%94%94%EC%95%BC%EC%BB%A4%ED%94%BC" },
      { label: "랭킹인투데이 — 이디야 창업비용", url: "https://rank.intoday.kr/450" },
    ],
  },

  "paiks-dabang": {
    hqSuppliedItems: [
      { iconName: "Coffee", nameKo: "주방·기물 풀세트",
        descriptionKo: "더본코리아 본사 지정 — 머신·그라인더·블렌더 등 약 7,800만원." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 지정 POS — 통합 매출 모니터링." },
      { iconName: "Megaphone", nameKo: "갈색·옐로 시그니처 간판",
        descriptionKo: "빽다방 시그니처 외부 사인 약 500만원 — 표준 디자인." },
      { iconName: "Package", nameKo: "초도 비품·홍보물·패키지 컵",
        descriptionKo: "초기 비품·홍보물 약 400만원 패키지." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공 (지정업체)",
        descriptionKo: "평당 약 192만원 — 15평 기준 약 2,887만원." },
      { iconName: "RefreshCw", nameKo: "주 3회 통합 물류 배송",
        descriptionKo: "더본코리아 전국 통합 물류 — 원·부재료 주 3회 정기 공급." },
    ],
    standardConcept: {
      iconName: "Coffee",
      nameKo: "빽다방 갈·옐로 컴팩트 매장",
      descriptionKo: "갈색+옐로 시그니처 + 백종원 캐릭터 노출 — 10~15평 테이크아웃 중심.",
      signatureColors: "갈색 + 옐로 + 화이트",
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 2900,
    notes: [
      "15평 기준 총 창업비용 약 1억 80만원, 점포·권리금 별도",
      "본사 또는 지정 업체에서만 자재 매입 가능 — 단가 협상 불가",
      "주 3회 정기 배송 시스템 — 재고관리 및 발주 패턴 본사 종속",
      "최근 백종원 리스크로 브랜드 평판 변동성 — 점주는 본사 공시 모니터링 필수",
    ],
    confidence: "high",
    sources: [
      { label: "빽다방 공식 가맹정보", url: "https://paikdabang.com/franchise/franchise/" },
      { label: "마이프차 빽다방", url: "https://myfranchise.kr/20090100502/%EB%B9%BD%EB%8B%A4%EB%B0%A9" },
      { label: "한국경제 — 빽다방 승부수", url: "https://www.hankyung.com/article/202510159206i" },
    ],
  },

  "the-venti": {
    hqSuppliedItems: [
      { iconName: "Coffee", nameKo: "표준 에스프레소 머신·기물",
        descriptionKo: "본사 지정 머신·그라인더·블렌더 등 — 기기·기물·가구 합산 약 6,400만원." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 지정 시스템 — 별도 청구 항목." },
      { iconName: "Megaphone", nameKo: "더벤티 시그니처 외부 사인",
        descriptionKo: "그린 톤 외부 사인 — 표준 디자인 강제." },
      { iconName: "Package", nameKo: "로고 컵·1L 대용량 패키지",
        descriptionKo: "더벤티 시그니처 1L 컵 등 본사 공급 — 차별화 포인트." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공 (본사 협력)",
        descriptionKo: "정보공개서 기준 평당 약 160만원 — 10평 약 1,600만원." },
      { iconName: "Box", nameKo: "원두·원·부재료",
        descriptionKo: "본사 일괄 공급 — 점주 임의 매입 금지." },
    ],
    standardConcept: {
      iconName: "Sprout",
      nameKo: "더벤티 그린 컴팩트 매장",
      descriptionKo: "그린 톤 + 1L 대용량 패키지 강조 — 10평 기준 무좌석/컴팩트 회전형.",
      signatureColors: "그린 + 화이트 + 우드",
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 1600,
    notes: [
      "10평 기준 약 7,000만원 — 가맹비 500만원·교육 300만원·보증금 500만원",
      "정보공개서 평당 160만원 — 면적 확대 시 비례 증가",
      "POS·키오스크·냉난방·철거·전기증설 모두 별도 — 실투자 1억 이상",
      "본사 매출 약 780억(2022) — 안정성은 있으나 가맹점 마진은 박리다매",
    ],
    confidence: "medium",
    sources: [
      { label: "더벤티 공식 개설비용", url: "https://www.theventi.co.kr/new2022/fran/about/cost.html" },
      { label: "공정위 가맹사업거래", url: "https://franchise.ftc.go.kr" },
    ],
  },

  "hollys": {
    hqSuppliedItems: [
      { iconName: "Coffee", nameKo: "기기·장비 패키지",
        descriptionKo: "본사 지정 머신·그라인더·정수기·블렌더 — 약 6,000만원선." },
      { iconName: "Table2", nameKo: "집기·가구 풀세트",
        descriptionKo: "테이블·의자·바·디스플레이 가구 약 5,500만원 — 본사 통일 디자인." },
      { iconName: "Crown", nameKo: "할리스 크라운 외부 사인·간판",
        descriptionKo: "왕관 BI 적용 외부 사인 약 1,500만원 — 할리스 레드 강제." },
      { iconName: "Paintbrush", nameKo: "표준 인테리어 시공",
        descriptionKo: "약 9,500만원 패키지 — 따뜻한 우드+레드 컨셉." },
      { iconName: "Monitor", nameKo: "POS·키오스크 시스템",
        descriptionKo: "본사 지정 POS." },
      { iconName: "Box", nameKo: "원두·시럽·MD",
        descriptionKo: "본사 또는 지정 업체 매입 의무." },
    ],
    standardConcept: {
      iconName: "Crown",
      nameKo: "할리스 크라운 — 따뜻한 휴식 공간",
      descriptionKo: "할리스 레드 + 우드 톤의 따뜻한 인테리어 — 좌석 충분한 중대형 카페 라운지.",
      signatureColors: "할리스 레드 + 우드 + 화이트",
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 9500,
    notes: [
      "기본 가맹창업비용 약 2.35억원 — 보증금·권리금 포함 시 3.6억~4억원",
      "최소 30평 이상 좌석 매장 — 도심 메인상권 입지 요구",
      "전기증설·냉난방·철거 등 별도공사로 추가 비용 발생",
      "리뉴얼 주기·인테리어 갱신 비용 점주 부담 발생 가능",
    ],
    confidence: "medium",
    sources: [
      { label: "할리스 공식", url: "https://www.hollys.co.kr/" },
      { label: "할리스 BI", url: "https://www.hollys.co.kr/hollysIs/hollys/bi.do" },
      { label: "공정위 가맹사업거래", url: "https://franchise.ftc.go.kr" },
    ],
  },

  "twosome-place": {
    hqSuppliedItems: [
      { iconName: "Coffee", nameKo: "에스프레소 머신·디저트 쇼케이스",
        descriptionKo: "장비·설치류 7,590만~8,380만원 — 머신·쇼케이스·블렌더·오븐 풀세트." },
      { iconName: "Table2", nameKo: "집기·가구 (우드+검정 톤)",
        descriptionKo: "투썸 2.0 우드+검정 톤 가구 — 본사 표준." },
      { iconName: "Megaphone", nameKo: "외부 사인·간판",
        descriptionKo: "투썸 시그니처 사인 — 본사 디자인 매뉴얼 강제." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공 (본사 협력업체)",
        descriptionKo: "8,650만~9,840만원 — 본사 SI 감리 필수." },
      { iconName: "Monitor", nameKo: "POS·키오스크·주방 시스템",
        descriptionKo: "최초 오픈비 2,300만~2,800만원 별도." },
      { iconName: "Thermometer", nameKo: "냉난방 시스템 (본사 거래 시)",
        descriptionKo: "본사 거래 선택 시 520만~670만원(설치비 별도)." },
      { iconName: "Box", nameKo: "디저트·케이크·원두 일괄 공급",
        descriptionKo: "본사 통합 물류 — 디저트 카페 핵심 차별화." },
    ],
    standardConcept: {
      iconName: "Gem",
      nameKo: "투썸 2.0 — 프리미엄 디저트 카페",
      descriptionKo: "우드+검정+유리 미니멀 톤 + 전면 케이크 쇼케이스 — 45평 이상 라운지형.",
      signatureColors: "검정 + 우드 + 화이트",
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 9000,
    notes: [
      "45평 기준 총 창업비용 약 3.125억원 — 보증금·권리금 별도",
      "본사 협력업체 입찰 시공이 원칙, 자체 시공 시 SI 감리비 별도",
      "디저트 SKU 본사 의존 — 점주 자체 메뉴 개발 불가",
      "최소 45평 이상 — 소형 입지 진입 불가, 보증금·임대료 부담 큼",
    ],
    confidence: "high",
    sources: [
      { label: "투썸플레이스 공식 창업안내", url: "https://www.twosome.co.kr/so/storeStartupInfo.do" },
      { label: "마이프차 투썸플레이스", url: "https://myfranchise.kr/20080100618/%ED%88%AC%EC%8D%B8%ED%94%8C%EB%A0%88%EC%9D%B4%EC%8A%A4" },
      { label: "CEO스코어데일리 — 투썸 2.0", url: "https://m.ceoscoredaily.com/page/view/2025021312075549973" },
    ],
  },

  "gongcha": {
    hqSuppliedItems: [
      { iconName: "Coffee", nameKo: "주방용품·티 추출 장비",
        descriptionKo: "본사 지정 — 약 3,440만원 주방·기기 패키지." },
      { iconName: "Megaphone", nameKo: "공차 시그니처 외부 사인",
        descriptionKo: "공차 레드+다크우드 외부 사인 약 800만원." },
      { iconName: "Table2", nameKo: "가구·집기",
        descriptionKo: "약 480만원 — 본사 통일 디자인." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공 (자체 가능)",
        descriptionKo: "약 3,490만원 — 자체 시공 가능하나 본사 디자인 매뉴얼 준수." },
      { iconName: "Package", nameKo: "공차 시그니처 컵·빨대·홀더",
        descriptionKo: "공차 통일 패키지 — 본사 공급." },
      { iconName: "Box", nameKo: "찻잎·타피오카·시럽",
        descriptionKo: "본사 일괄 공급 — 글로벌 표준 레시피." },
    ],
    standardConcept: {
      iconName: "Crown",
      nameKo: "공차 레드+다크우드 프리미엄 티 매장",
      descriptionKo: "레드·갈·고동·검정 톤의 따뜻하고 고급스러운 분위기 — 매장 규모 다양.",
      signatureColors: "레드 + 다크우드 + 검정",
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3490,
    notes: [
      "기본 가맹점 비용 약 1.05억원 — 보증금·권리금 포함 시 2.45억원선",
      "별도공사(전기·화장실·철거·계단 등) 5~10% 추가 발생",
      "타피오카·찻잎 본사 일괄 공급 — 원가율 점주 통제 한계",
      "글로벌 브랜드 — 본사 디자인 매뉴얼 변경 시 리뉴얼 비용 점주 부담 가능",
    ],
    confidence: "medium",
    sources: [
      { label: "공차 공식 창업비용", url: "https://www.gong-cha.co.kr/franchise/open/cost.php" },
      { label: "나무위키 공차", url: "https://namu.wiki/w/%EA%B3%B5%EC%B0%A8(%EC%B2%B4%EC%9D%B8%EC%A0%90)" },
    ],
  },

  "baskin-robbins": {
    hqSuppliedItems: [
      { iconName: "Box", nameKo: "아이스크림 디스플레이 케이스·냉동고",
        descriptionKo: "본사 지정 디핑 케이스·냉동고 — BR CI 핵심 장비." },
      { iconName: "Package", nameKo: "31가지 아이스크림 패키지 공급",
        descriptionKo: "본사에서 패키지화된 아이스크림 — 인력 최소화 운영." },
      { iconName: "Megaphone", nameKo: "BR 핑크·브라운 시그니처 사인",
        descriptionKo: "BR 시그니처 핑크 외부 사인 — 본사 감리 필수." },
      { iconName: "Paintbrush", nameKo: "BR CI 표준 인테리어",
        descriptionKo: "25평 기준 약 6,500만원, 평당 약 360만원 — 본사 감리 필수." },
      { iconName: "Table2", nameKo: "표준 가구·집기",
        descriptionKo: "BR 통일 가구·진열대." },
      { iconName: "Monitor", nameKo: "POS·재고관리 시스템",
        descriptionKo: "본사 통합 시스템." },
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "BR 핑크·브라운 — 31가지 아이스크림 매장",
      descriptionKo: "핑크+브라운 BR CI + 디핑 케이스 전면 배치 — 22~25평 로드샵 표준.",
      signatureColors: "BR 핑크 + 브라운 + 화이트",
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 6500,
    notes: [
      "도심지 1층 22~25평·전면 6m 이상 — 입지 제약 큼",
      "총 창업비용 2.5억~3억원, 메인상권 1.5배 이상 가능",
      "계약 후 60일 내 인테리어 완료 — 본사 감리 필수",
      "아이스크림은 SPC 본사 패키지 의존 — 점주 자체 메뉴 불가",
    ],
    confidence: "high",
    sources: [
      { label: "마이프차 배스킨라빈스", url: "https://myfranchise.kr/20080500015/%EB%B0%B0%EC%8A%A4%ED%82%A8%EB%9D%BC%EB%B9%88%EC%8A%A4" },
      { label: "점포라인 배스킨라빈스", url: "https://www.jumpoline.com/franch/FranchView.aspx?frnc=20080500015&mcode=B&scode=03" },
    ],
  },

  "sulbing": {
    hqSuppliedItems: [
      { iconName: "Box", nameKo: "빙수 제빙기·조리기기",
        descriptionKo: "본사 지정 — 조리기기 약 2,800만원, 주방기기 약 2,400만원." },
      { iconName: "Megaphone", nameKo: "설빙 시그니처 외부 사인·간판",
        descriptionKo: "한글 로고+한국전통 컨셉 사인 — 약 700만원, 내외부 사인 550만원." },
      { iconName: "Table2", nameKo: "가구·의탁자 (한국 전통 톤)",
        descriptionKo: "약 1,100만원 — 본사 통일 한식 톤." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공",
        descriptionKo: "40평 기준 약 6,800만원 — 한국 전통 모티프 마감." },
      { iconName: "Package", nameKo: "콩가루·인절미·과일 시럽 등 원·부재료",
        descriptionKo: "본사 일괄 공급 — 시그니처 메뉴 표준화." },
      { iconName: "Monitor", nameKo: "POS·통합 시스템",
        descriptionKo: "본사 지정 POS." },
    ],
    standardConcept: {
      iconName: "Sprout",
      nameKo: "한국 전통 디저트 카페",
      descriptionKo: "한글 로고·우드·화이트·전통 모티프 톤 — K-디저트 컨셉의 40평 좌석형.",
      signatureColors: "화이트 + 우드 + 그린 액센트",
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 6800,
    notes: [
      "40평 기준 약 1.77억원 (VAT 포함) — 보증금·권리금 별도",
      "여름 빙수 시즌 매출 집중 — 비수기 매출 대책 필수",
      "원재료 본사 의존 — 단가 협상 불가",
      "한국 전통 컨셉 매장 톤 임의 변경 불가 — 본사 디자인 매뉴얼",
    ],
    confidence: "medium",
    sources: [
      { label: "설빙 정보공개서 (PDF)", url: "https://assa-franchise.s3.amazonaws.com/franchise_218334.pdf" },
      { label: "한국경제 — K디저트 설빙", url: "https://www.hankyung.com/article/2023051705251" },
    ],
  },

  "paris-baguette": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "베이커리 오븐·발효기·도우 라인",
        descriptionKo: "본사 지정 — SPC 통합 베이커리 장비 풀세트." },
      { iconName: "Box", nameKo: "초도물량(제품) 1.35억원",
        descriptionKo: "오픈 시 본사 통합 공급 빵·케이크 초도 물량." },
      { iconName: "Megaphone", nameKo: "프렌치 블루 시그니처 사인",
        descriptionKo: "파리바게뜨 프렌치 블루 BI — 본사 디자인 매뉴얼 강제." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공 (본사 협력)",
        descriptionKo: "30평 기준 평당 약 329만원, 약 9,880만원." },
      { iconName: "Table2", nameKo: "쇼케이스·진열대·가구",
        descriptionKo: "본사 통일 디자인." },
      { iconName: "Monitor", nameKo: "POS·SPC 통합 시스템",
        descriptionKo: "본사 통합 매출·재고 관리 시스템." },
      { iconName: "Palette", nameKo: "디자인 매뉴얼비",
        descriptionKo: "약 3,000만원 — SPC 디자인센터 매뉴얼 적용비." },
    ],
    standardConcept: {
      iconName: "Star",
      nameKo: "프렌치 블루 베이커리 카페",
      descriptionKo: "프렌치 블루+화이트+우드 — 30평 이상 베이커리+카페 결합형 표준.",
      signatureColors: "프렌치 블루 + 화이트 + 우드",
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 9880,
    notes: [
      "총 창업비용 약 3.14억원, 임대·권리금 포함 4억~7억원",
      "보증금 1억~2억원 별도 (계약 종료 시 반환)",
      "초도 제품 1.35억원 + 개점비 1억원 — 초기 자본 부담 매우 큼",
      "리뉴얼·디자인 매뉴얼 갱신 시 추가 비용 — SPC 정책 종속",
    ],
    confidence: "high",
    sources: [
      { label: "파리바게뜨 공식 개설비용", url: "https://www.paris.co.kr/franchise/opening-costs/" },
      { label: "마이프차 파리바게뜨", url: "https://myfranchise.kr/20080200064/%ED%8C%8C%EB%A6%AC%EB%B0%94%EA%B2%8C%EB%9C%A8" },
      { label: "전자신문 — 파리바게뜨 BI 교체", url: "https://www.etnews.com/20181213000249" },
    ],
  },

  "tous-les-jours": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "베이커리 오븐·발효기·도우 라인",
        descriptionKo: "본사 지정 CJ 통합 베이커리 장비 — 집기·설비·초도물품 약 2.17억원에 포함." },
      { iconName: "Box", nameKo: "초도물품·원·부재료",
        descriptionKo: "CJ 통합 물류 — 빵·케이크 SKU 본사 공급." },
      { iconName: "Megaphone", nameKo: "뚜레쥬르 외부 사인·간판",
        descriptionKo: "프렌치 카페 톤 시그니처 — 본사 표준 디자인." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공",
        descriptionKo: "40평 기준 약 8,317만원." },
      { iconName: "Table2", nameKo: "쇼케이스·가구",
        descriptionKo: "본사 통일 디자인 (집기·설비 합산)." },
      { iconName: "Monitor", nameKo: "POS·CJ 통합 시스템",
        descriptionKo: "본사 통합 시스템." },
    ],
    standardConcept: {
      iconName: "Wine",
      nameKo: "프렌치 베이커리 카페",
      descriptionKo: "베이지·우드·블랙 톤의 프렌치 카페 분위기 — 25~40평 표준.",
      signatureColors: "베이지 + 다크우드 + 화이트",
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 8317,
    notes: [
      "40평 약 4.2억원, 30평 약 2.3억~2.7억원, 25평 약 2.2억~2.5억원",
      "최소 25평 이상 — 본사 점포 평가 통과 필수",
      "초도물품·집기·설비 약 2.17억원 — 자본 부담 큼",
      "CJ 통합 시스템 의존 — 점주 자율도 제한적",
    ],
    confidence: "high",
    sources: [
      { label: "마이프차 뚜레쥬르", url: "https://myfranchise.kr/20080100039/%EB%9A%9C%EB%A0%88%EC%A5%AC%EB%A5%B4" },
      { label: "소상공 뚜레쥬르 창업비용", url: "https://sosangong.com/franchise-startup-costs/%EB%9A%9C%EB%A0%88%EC%A5%AC%EB%A5%B4" },
    ],
  },

  "anaden": {
    hqSuppliedItems: [
      { iconName: "Box", nameKo: "디저트 쇼케이스·냉장 진열대",
        descriptionKo: "본사 지정 — 디저트 카페 핵심 장비. 정확한 단가 비공개." },
      { iconName: "Coffee", nameKo: "음료·커피 장비",
        descriptionKo: "본사 지정 머신·블렌더 — 정확한 모델 비공개." },
      { iconName: "Megaphone", nameKo: "ANADEN 외부 사인·간판",
        descriptionKo: "본사 디자인 적용 — 모던 디저트 카페 톤. 단가 비공개." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공",
        descriptionKo: "본사 협력업체 시공 — 일반 디저트 카페 평당 200만원대 추정." },
      { iconName: "Package", nameKo: "마카롱·디저트 SKU",
        descriptionKo: "본사 공급 디저트 — 점주 자체 메뉴 개발 불가." },
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "모던 디저트 카페",
      descriptionKo: "모던·미니멀 톤의 디저트 전문 카페 — 정확한 컬러 컨셉은 본사 비공개.",
      signatureColors: "모던 미니멀 톤 (본사 비공개)",
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4000,
    notes: [
      "본사 공식 정보 제한적 — 정확한 창업비용·인테리어비 비공개",
      "마이프차 등록 브랜드이나 공정위 정보공개서 일반 정보 부족",
      "디저트 카페 표준 평당 200만원 적용한 추정치 — 실제 견적 본사 상담 필수",
      "유사 브랜드명(아나덴 뷰티)과 혼동 주의 — 디저트 브랜드 특정 확인",
    ],
    confidence: "low",
    sources: [
      { label: "ANADEN 마이프차", url: "https://myfranchise.kr/20181228/ANADEN-%EC%95%84%EB%82%98%EB%8D%B4-" },
      { label: "ANADEN Mall", url: "https://anadenmall.com/category/shop/47/" },
    ],
  },

  "bonjuk": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "주방기기·솥·인덕션",
        descriptionKo: "본사 지정 — 죽 조리 장비 풀세트, 주방·기기 패키지에 포함." },
      { iconName: "Box", nameKo: "원·부재료 (전복·해산물·곡류)",
        descriptionKo: "본사 일괄 공급 — 신선도 핵심, 공급 주기 본사 관리." },
      { iconName: "Megaphone", nameKo: "본죽 시그니처 외부 사인",
        descriptionKo: "본 그룹 통일 디자인." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공",
        descriptionKo: "10평 기준 평당 약 280만원, 약 1,900만원. 본사 미지정 업체 시 평당 15만원 기획관리비." },
      { iconName: "Table2", nameKo: "의탁자·집기",
        descriptionKo: "본사 표준 — 가맹비·교육 1,650만원 패키지에 포함." },
      { iconName: "Monitor", nameKo: "POS 시스템",
        descriptionKo: "본사 지정." },
    ],
    standardConcept: {
      iconName: "Sprout",
      nameKo: "본죽 한식 컴팩트 매장",
      descriptionKo: "그린+화이트 한식 톤 — 10평 이상 테이크아웃·배달 중심.",
      signatureColors: "그린 + 화이트 + 우드",
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 1900,
    notes: [
      "10평 기준 총 창업비용 약 9,000만~1.3억원",
      "본사 미지정 업체 시공 시 평당 15만원 기획관리비 별도",
      "월 로열티 30만원 — 정기 본사 의무",
      "원재료 신선도 의존 — 본사 공급 주기·재고 관리 점주 부담",
    ],
    confidence: "high",
    sources: [
      { label: "본죽&비빔밥 공식", url: "https://www.bonif.co.kr/founding/info?brdCd=BF102" },
      { label: "마이프차 본죽", url: "https://myfranchise.kr/20080100243/%EB%B3%B8%EC%A3%BD" },
    ],
  },

  "sinjeon": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "주방기기·인덕션·후드",
        descriptionKo: "본사 지정 떡볶이 조리 장비 풀세트." },
      { iconName: "Box", nameKo: "떡·어묵·고추장 양념",
        descriptionKo: "본사 일괄 공급 — 시그니처 청양고추 양념." },
      { iconName: "Megaphone", nameKo: "신전 그린 외부 사인",
        descriptionKo: "녹색(청양고추 모티브) 시그니처 사인." },
      { iconName: "Paintbrush", nameKo: "일반형 / 고급형 인테리어",
        descriptionKo: "본사 2가지 옵션 제공 — 일반형/고급형 선택." },
      { iconName: "Table2", nameKo: "테이블·바·집기",
        descriptionKo: "본사 표준." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 지정." },
    ],
    standardConcept: {
      iconName: "Sprout",
      nameKo: "신전 그린 떡볶이 매장",
      descriptionKo: "녹색 청양고추 모티브 + 화이트 톤 — 일반형/고급형 옵션의 컴팩트 매장.",
      signatureColors: "그린(청양고추) + 화이트 + 블랙",
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3000,
    notes: [
      "월 로열티 없음 — 점주 부담 낮은 편",
      "재계약 시 리모델링 강요 없음 — 추가 가맹비 없음",
      "가맹금 500만원 — 가맹비 부담 적음",
      "원재료 본사 공급 의무 — 단가 협상 한계",
    ],
    confidence: "medium",
    sources: [
      { label: "신전떡볶이 공식 가맹", url: "http://sinjeon.co.kr/doc/franchise03.php" },
      { label: "신전떡볶이 매장 인테리어", url: "https://www.sinjeon.co.kr/doc/franchise02.php" },
      { label: "나무위키 신전떡볶이", url: "https://namu.wiki/w/%EC%8B%A0%EC%A0%84%EB%96%A1%EB%B3%B6%EC%9D%B4" },
    ],
  },

  "kimbap-cheonguk": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "주방기기·인덕션·튀김기",
        descriptionKo: "본사 또는 지정 업체 공급 — 분식 종합 조리 장비." },
      { iconName: "Box", nameKo: "원·부재료 일부",
        descriptionKo: "본사 권장 공급망 — 다브랜드 분파 구조로 일부 점주 자체 매입 허용." },
      { iconName: "Megaphone", nameKo: "외부 사인·간판",
        descriptionKo: "오렌지·빨강 시그니처 — 최근 모던 톤으로 리뉴얼 진행 중." },
      { iconName: "Paintbrush", nameKo: "인테리어 시공",
        descriptionKo: "최근 모던 톤 리뉴얼 — 평당 비용 본사 비공개." },
      { iconName: "Table2", nameKo: "테이블·의자·바·진열대",
        descriptionKo: "본사 또는 점주 자율 선택." },
      { iconName: "Monitor", nameKo: "POS 시스템",
        descriptionKo: "본사/점주 자율." },
    ],
    standardConcept: {
      iconName: "Home",
      nameKo: "동네 분식·김밥 매장",
      descriptionKo: "오렌지·빨강 전통 톤 → 최근 모던 톤으로 진화 중 — 다양한 가맹본부 분파.",
      signatureColors: "오렌지 + 화이트 (전통) / 모던 톤 (신규)",
    },
    flexibility: "flexible",
    estimatedInteriorCostWon: 2500,
    notes: [
      "총 창업비용 약 4,840만~8,000만원 — 다른 프랜차이즈 대비 저렴",
      "'정다믄', 'kimbab1009' 등 다수 가맹본부 분파 존재 — 본사별 정책 상이",
      "자율도 비교적 높음 — 점주 자체 메뉴 추가·자체 매입 일부 허용",
      "본사 공식 표준이 가장 약함 — 가맹본부 선택 시 정보공개서 면밀 검토 필수",
    ],
    confidence: "low",
    sources: [
      { label: "김밥천국 공식", url: "https://kimbab1009.com/" },
      { label: "정다믄 김밥천국 창업", url: "http://www.kimbabcheongug.co.kr/franchise/price.php" },
      { label: "마이프차 김밥천국", url: "https://myfranchise.kr/20080100087/%EA%B9%80%EB%B0%A5%EC%B2%9C%EA%B5%AD" },
      { label: "나무위키 김밥천국", url: "https://namu.wiki/w/%EA%B9%80%EB%B0%A5%EC%B2%9C%EA%B5%AD" },
    ],
  },

  "juno-hair": {
    hqSuppliedItems: [
      { iconName: "Scissors", nameKo: "준오 표준 미용 의자 (디자이너 지정 모델)",
        descriptionKo: "본사가 청담동 사옥 산하 준오디포를 통해 미용 상품·기자재를 일괄 유통. 직영 표준 가죽 의자가 디자이너 인원수만큼 의무 배치된다." },
      { iconName: "Droplets", nameKo: "준오 시그니처 샴푸대",
        descriptionKo: "본사 지정 모델만 설치 가능. 청담동 본점 기준 호텔급 샴푸대 표준이 매장 평수에 따라 4~12대 배치." },
      { iconName: "Frame", nameKo: "월넛톤 거울대 + 골드 트림",
        descriptionKo: "전 직영점 통일된 거울 프레임. 디자이너석마다 1대 의무." },
      { iconName: "Monitor", nameKo: "준오 통합 POS·예약 시스템",
        descriptionKo: "전국 직영점 매출·고객DB가 본사 ERP로 실시간 통합. 점주 임의 교체 불가." },
      { iconName: "Sparkles", nameKo: "준오 헤어 전용 제품 라인",
        descriptionKo: "준오디포 자체 유통 — 샴푸·트리트먼트·스타일링제 본사 매입가만 사용." },
      { iconName: "Crown", nameKo: "월넛·아이보리·골드 사이니지",
        descriptionKo: "외부 간판·로고·픽토그램 본사 디자인팀이 100% 시공." }
    ],
    standardConcept: {
      iconName: "Crown",
      nameKo: "준오 프리미엄 클래식",
      descriptionKo: "월넛·아이보리·골드 트림의 호텔급 살롱 — 직영 180여 개 매장이 청담 본점 무드를 동일하게 유지.",
      signatureColors: "월넛 + 아이보리 + 골드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 30800,
    notes: [
      "100% 직영 + 반가맹 — 일반 사장님 가맹 진입 불가, 재직 10년 이상 직원 공동투자 모델",
      "본사·매장 5:5 투자·수익 분배 구조라 일반 점주 자율도 사실상 0",
      "공정위 정보공개서 미등록 (가맹사업이 아닌 직영시스템)",
      "인테리어비 약 3.08억 — 30평 기준, 본사 직영 시공 의무"
    ],
    confidence: "medium",
    sources: [
      { label: "myfranchise.kr", url: "https://myfranchise.kr/20080100448/%EC%A4%80%EC%98%A4%ED%97%A4%EC%96%B4" },
      { label: "www.newstof.com", url: "https://www.newstof.com/news/articleView.html?idxno=29316" },
      { label: "bizk.co.kr", url: "https://bizk.co.kr/c_brand.php?sno=5356" },
      { label: "www.junohair.com", url: "https://www.junohair.com/junohair/about/location" }
    ]
  },

  "lian-hair": {
    hqSuppliedItems: [
      { iconName: "Scissors", nameKo: "리안 표준 디자이너 의자",
        descriptionKo: "본사 지정 모델, 디자이너 인원수만큼 의무 배치. 20년 표준화된 살롱 의자 라인업." },
      { iconName: "Droplets", nameKo: "리안 샴푸대",
        descriptionKo: "본사 지정 모델 — 매장 평수에 따라 3~6대." },
      { iconName: "Frame", nameKo: "표준 거울대 + 디자이너 작업대",
        descriptionKo: "452개 가맹점 통일 디자인. 본사 일괄 공급." },
      { iconName: "Monitor", nameKo: "리안 통합 POS",
        descriptionKo: "본사 시스템 의무 도입, 매출·재고 본사 연동." },
      { iconName: "Sparkles", nameKo: "리안 본사 공급 헤어 제품",
        descriptionKo: "지정 샴푸·펌·염색제 — 본사 매입 의무 비율 있음." },
      { iconName: "Megaphone", nameKo: "본사 표준 간판·외부 사인",
        descriptionKo: "리안 통일 간판 본사 시공." }
    ],
    standardConcept: {
      iconName: "Scissors",
      nameKo: "리안 클래식 우먼 살롱",
      descriptionKo: "20년 이상 운영된 여성 중심 보급형 표준 살롱 — 화이트·우드 톤의 친근한 동네 미용실 무드.",
      signatureColors: "화이트 + 라이트 우드 + 블랙"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 5000,
    notes: [
      "총 창업비 약 9,845만원 (마이프차 기준) — 인테리어 외 가맹비·교육비·보증금 포함",
      "전국 452개 가맹점 — 한국에서 가장 큰 미용실 가맹망 중 하나",
      "본사 지정 제품·집기 의무 매입 비율 확인 필요",
      "정보공개서는 공정위·jumpoline 통해 별도 조회 권장"
    ],
    confidence: "medium",
    sources: [
      { label: "myfranchise.kr", url: "https://myfranchise.kr/20080100743/%EB%A6%AC%EC%95%88%ED%97%A4%EC%96%B4" },
      { label: "riahn.co.kr", url: "http://riahn.co.kr/" },
      { label: "m.jumpoline.com", url: "https://m.jumpoline.com/jumpo_view.asp?s=jp&webjofrsid=650135" }
    ]
  },

  "blue-club": {
    hqSuppliedItems: [
      { iconName: "Scissors", nameKo: "남성 컷 전용 의자",
        descriptionKo: "본사 지정 모델, 컷 중심 매장 회전율을 위한 슬림형. 인원수만큼 본사 직매." },
      { iconName: "Droplets", nameKo: "스피드 샴푸대",
        descriptionKo: "남성 컷·세팅 중심 회전형 샴푸대 본사 공급." },
      { iconName: "Frame", nameKo: "블랙·블루 거울대",
        descriptionKo: "354개 가맹점 통일 디자인 — 화이트·블랙·블루 컬러 트림." },
      { iconName: "Megaphone", nameKo: "블루 시그니처 간판",
        descriptionKo: "1998년부터 이어진 블루 컬러 외부 사이니지, 본사 100% 시공." },
      { iconName: "Monitor", nameKo: "POS·고객 관리 시스템",
        descriptionKo: "본사 통합 POS 의무 도입." },
      { iconName: "Sparkles", nameKo: "남성 토탈 뷰티 케어 제품 라인",
        descriptionKo: "본사 공급 남성 그루밍 제품 — 컷·셰이빙·스타일링." },
      { iconName: "Users", nameKo: "본사 아카데미 인력 매칭",
        descriptionKo: "블루클럽 아카데미 출신 디자이너 본사 알선." }
    ],
    standardConcept: {
      iconName: "Scissors",
      nameKo: "블루클럽 모던 맨즈 살롱",
      descriptionKo: "화이트·블랙·블루 트림의 1세대 남성 전용 미용실 — 이발소·미용실 중간 포지션의 정형 매장.",
      signatureColors: "화이트 + 블랙 + 블루"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3000,
    notes: [
      "창업비 약 5,938만원 (마이프차) — 10평 소형 매장 기준",
      "4가지 창업 타입 — 순수 가맹/실속형/소자본형/위탁 경영형 중 선택",
      "현재 354개 매장 (2026년 2월 기준), 1세대 남성 미용실 브랜드 — 토마토디앤씨 운영",
      "본사 상권 분석(전국 1,500개) + 점포 매칭 시스템 활용 가능"
    ],
    confidence: "medium",
    sources: [
      { label: "namu.wiki", url: "https://namu.wiki/w/%EB%B8%94%EB%A3%A8%ED%81%B4%EB%9F%BD" },
      { label: "myfranchise.kr", url: "https://myfranchise.kr/20080100542/%EB%B8%94%EB%A3%A8%ED%81%B4%EB%9F%BD" },
      { label: "www.cfe.org", url: "https://www.cfe.org/20151127_10603" },
      { label: "blueclub-changup.com", url: "https://blueclub-changup.com/" }
    ]
  },

  "park-seungchul": {
    hqSuppliedItems: [
      { iconName: "Scissors", nameKo: "박승철 표준 디자이너 의자",
        descriptionKo: "본사 지정 가죽 의자, 디자이너 인원수만큼 의무 배치 (기타 설비 7,700만원에 포함)." },
      { iconName: "Droplets", nameKo: "박승철 시그니처 샴푸대",
        descriptionKo: "본사 지정 모델 — 30평 기준 4~6대 배치." },
      { iconName: "Frame", nameKo: "여성 살롱 무드 거울대",
        descriptionKo: "168개 가맹점 통일 디자인, 본사 일괄 공급." },
      { iconName: "Monitor", nameKo: "PSC 통합 POS",
        descriptionKo: "본사 (피에스씨네트웍스) 운영 통합 시스템 — 매출·예약 연동." },
      { iconName: "Sparkles", nameKo: "박승철 전용 살롱 제품",
        descriptionKo: "본사 공급 펌·염색제 등 살롱 제품 의무 사용." },
      { iconName: "Megaphone", nameKo: "표준 간판·로고 사인",
        descriptionKo: "본사 디자인팀 100% 시공." },
      { iconName: "Users", nameKo: "PSC 아카데미 디자이너 매칭",
        descriptionKo: "본사 아카데미 출신 인력 알선 시스템." }
    ],
    standardConcept: {
      iconName: "Scissors",
      nameKo: "박승철 우먼 프리미엄 살롱",
      descriptionKo: "여성 고객 신뢰도 1위(리얼미터) — 화이트·라이트우드 톤의 30평 표준 살롱.",
      signatureColors: "화이트 + 라이트 우드 + 블랙 트림"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 7590,
    notes: [
      "총 창업비 약 1억 9,490만원 (30평 기준): 가맹비 1,100만 + 교육비 1,100만 + 보증금 2,000만 + 기타설비 7,700만 + 인테리어 7,590만",
      "월 평균 매출 약 3,061만원 (마이프차 공시)",
      "여성 미용실 부문 신뢰도·인지도 1위 (리얼미터)",
      "본사 ㈜피에스씨네트웍스, 강남 신사동 — 본사 시공 의무"
    ],
    confidence: "high",
    sources: [
      { label: "www.pschair.co.kr", url: "https://www.pschair.co.kr/" },
      { label: "hi-franchise.com", url: "https://hi-franchise.com/bbs/board.php?bo_table=franchise&wr_id=175" },
      { label: "www.realmeter.net", url: "http://www.realmeter.net/%EB%AF%B8%EC%9A%A9%EC%8B%A4-%EB%82%A8%EC%9E%90%EB%8A%94-%EB%B8%94%EB%A3%A8%ED%81%B4%EB%9F%BD" },
      { label: "xn--v69ap5so3hsnb81e1wfh6z.com", url: "https://xn--v69ap5so3hsnb81e1wfh6z.com/franchise/brand/0230a05f0850df55a1f9f99c118d331f" }
    ]
  },

  "golden-nail": {
    hqSuppliedItems: [
      { iconName: "Palette", nameKo: "골든네일 표준 시술 테이블",
        descriptionKo: "본사 직영 인테리어팀이 직접 공급 — 하청 없이 거품 제거." },
      { iconName: "Frame", nameKo: "고객용 페디·매니큐어 좌석",
        descriptionKo: "150개+ 가맹점 통일 디자인, 매장 규모별 4~10석." },
      { iconName: "Sparkles", nameKo: "네일·왁싱·속눈썹 통합 시술 도구",
        descriptionKo: "본사 직매 — 네일아트·왁싱·속눈썹 연장 멀티 시술 지원." },
      { iconName: "Monitor", nameKo: "POS·고객 예약 시스템",
        descriptionKo: "본사 통합 시스템." },
      { iconName: "Megaphone", nameKo: "골든 컬러 간판",
        descriptionKo: "본사 디자인팀 직접 시공." }
    ],
    standardConcept: {
      iconName: "Sparkles",
      nameKo: "골든네일 보급형 멀티 뷰티샵",
      descriptionKo: "네일·왁싱·속눈썹 모두 가능한 보급형 매장 — 골드·화이트 톤으로 친근한 동네 뷰티샵 무드.",
      signatureColors: "화이트 + 골드 + 핑크"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 1900,
    notes: [
      "1,900만원대 소자본 창업 (프로모션 적용 시) — 본사 공식 발표",
      "본사 직영 인테리어팀 운영 — 하청업체 없어 인테리어 비용 거품 적음",
      "150개 이상 가맹점 — 상권/규모/연령층별 인테리어 커스터마이즈 허용",
      "네일+왁싱+속눈썹 멀티 시술 — 단일 카테고리 매장보다 매출 다변화 가능"
    ],
    confidence: "medium",
    sources: [
      { label: "www.datanet.co.kr", url: "https://www.datanet.co.kr/news/articleView.html?idxno=90873" },
      { label: "www.changupdo.com", url: "http://www.changupdo.com/franchise/214" }
    ]
  },

  "yuhu-nail": {
    hqSuppliedItems: [
      { iconName: "Palette", nameKo: "유후네일 시술 테이블",
        descriptionKo: "본사 지정 모델, 디자이너 인원수만큼 배치 (확정 정보 부족 — 직접 문의 필요)." },
      { iconName: "Frame", nameKo: "고객 좌석·페디 의자",
        descriptionKo: "매장별 추정 4~6석 (공식 정보공개서 미확인)." },
      { iconName: "Sparkles", nameKo: "젤·네일아트 시술 도구",
        descriptionKo: "본사 공급 여부 미확인 — 점주 자율 매입 가능성 있음." },
      { iconName: "Monitor", nameKo: "POS·예약 시스템",
        descriptionKo: "본사 시스템 도입 여부 미확인." },
      { iconName: "Megaphone", nameKo: "유후네일 간판",
        descriptionKo: "노원·수락산·신사·신논현·잠실·홍대·강남 등 통일된 간판 운영." }
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "유후네일 영캐주얼 네일샵",
      descriptionKo: "20대 여성 SNS 트렌드 중심 네일샵 — 인스타 6.2만 팔로워, 강남·홍대 등 핵심 상권 중심.",
      signatureColors: "화이트 + 파스텔 톤 (확인 필요)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3000,
    notes: [
      "공정위 정보공개서·공식 가맹 페이지 미확인 — 가맹사업이 아닐 가능성 있음 (직영/지점 운영 추정)",
      "강남·홍대·신사·잠실 등 8개 이상 매장 운영 (인스타그램 기준)",
      "구체 창업비·본사 공급품 정보 부재 — 본사 직접 문의 필수",
      "네일아트 SNS 마케팅 강세 — 인스타 팔로워 6.2만"
    ],
    confidence: "low",
    sources: [
      { label: "www.instagram.com", url: "https://www.instagram.com/youwho__nail/" },
      { label: "www.facebook.com", url: "https://www.facebook.com/yuhuneil" }
    ]
  },

  "7days-sugaring": {
    hqSuppliedItems: [
      { iconName: "Sparkles", nameKo: "유기농 슈가링 페이스트",
        descriptionKo: "본사 직영 유기농 설탕 베이스 시술재 — 단, 본사는 전용 제품 강매하지 않는다고 명시." },
      { iconName: "Frame", nameKo: "왁싱 시술 베드",
        descriptionKo: "본사 공급 표준 베드 — 1:1 프라이빗 룸 단위로 배치." },
      { iconName: "Lightbulb", nameKo: "프라이빗 룸 조명·집기",
        descriptionKo: "여성 친화 톤의 조명·미러·수납장 본사 패키지." },
      { iconName: "Monitor", nameKo: "POS·예약 관리 시스템",
        descriptionKo: "회원 관리·시술 이력 본사 연동." },
      { iconName: "Megaphone", nameKo: "세븐데이즈 간판·인테리어 시그니처",
        descriptionKo: "본사 표준 매장 무드 적용." },
      { iconName: "Users", nameKo: "본사 시술 교육 + 마케팅 지원",
        descriptionKo: "'시스템형 마케팅'으로 BEP 단축 강조 — 본사 제공 마케팅 패키지." }
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "세븐데이즈 슈가링 프라이빗 왁싱",
      descriptionKo: "유기농 슈가링 1:1 프라이빗 룸 — 시술 + 후 케어 프로그램 결합형 매장.",
      signatureColors: "화이트 + 핑크 + 우드 (브랜드 표준 추정)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4000,
    notes: [
      "본사가 '전용 제품 강매하지 않음' 명시 — 일반 왁싱 가맹 대비 점주 자율도 ↑",
      "'시스템형 마케팅'으로 BEP 단축 강조 — 본사 마케팅 의존도 검증 필요",
      "구체적 창업비·정보공개서 공시 부족 — 본사 7dayssugaring.com 직접 문의 권장",
      "전국 가맹점 수 미공시 (대전·전주 등 지역 매장 확인됨)"
    ],
    confidence: "low",
    sources: [
      { label: "7dayssugaring.co.kr", url: "https://7dayssugaring.co.kr/" },
      { label: "www.7dayssugaring.com", url: "https://www.7dayssugaring.com/" }
    ]
  },

  "noonnoppi": {
    hqSuppliedItems: [
      { iconName: "BookOpen", nameKo: "눈높이 학습관 교재·교구 패키지",
        descriptionKo: "대교 본사 41년 노하우 학습 프로그램 — 본사 100% 공급, 교재 매입가 = 본사 정가." },
      { iconName: "Table2", nameKo: "학습관 책상·의자",
        descriptionKo: "본사 표준 구성 — 회원 25명 기준 책상 8~10개." },
      { iconName: "Monitor", nameKo: "회원 관리·진도 추적 시스템",
        descriptionKo: "대교 본사 학습 관리 ERP 의무 사용." },
      { iconName: "Megaphone", nameKo: "눈높이 학습관 간판·시그니처",
        descriptionKo: "본사 통일 간판 시공." },
      { iconName: "Users", nameKo: "본사 신규 회원 모집 지원",
        descriptionKo: "본사·본부 협업으로 회원 모집 관리 — 점주 단독 운영 부담 완화." }
    ],
    standardConcept: {
      iconName: "BookOpen",
      nameKo: "대교 눈높이 자기주도 학습관",
      descriptionKo: "옐로우 시그니처 컬러의 41년 자기주도 학습 브랜드 — 회원 25명 단위 소형 학습관 표준.",
      signatureColors: "옐로우 + 화이트 + 블루 트림"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 1500,
    notes: [
      "초기 창업비 0원 시스템 — 가맹비·교육비·교구비 무료, 본사 지원형 모델",
      "회원 25명만 모집해도 월 300만원 수준 수익 보장 (본사 발표)",
      "공부방·교습소 형태로 자택 운영 가능 → 인테리어 비용 1,000~1,500만 추정",
      "본사 (대교) 학습 콘텐츠 100% 의존 — 점주 자율 커리큘럼 변경 불가"
    ],
    confidence: "medium",
    sources: [
      { label: "recruit.daekyo.com", url: "https://recruit.daekyo.com/brand/NC" },
      { label: "company.daekyo.com", url: "https://company.daekyo.com/kr/business/noonnoppi.aspx?pgmId=DK20002" },
      { label: "m.earticle.net", url: "https://m.earticle.net/Article/A285841" }
    ]
  },

  "anytime-fitness": {
    hqSuppliedItems: [
      { iconName: "Dumbbell", nameKo: "본사 지정 머신 패키지 (Life Fitness/Hammer Strength 계열)",
        descriptionKo: "글로벌 표준 카디오·웨이트 머신 본사 직매. 미국 본사 라이센스 기준 구성." },
      { iconName: "Lock", nameKo: "24시간 키카드 출입 시스템",
        descriptionKo: "Anytime의 핵심 인프라 — 회원 카드 1장으로 전 세계 5,000개 지점 출입. 본사 의무 도입." },
      { iconName: "Camera", nameKo: "CCTV·시큐리티 패키지",
        descriptionKo: "무인 24시간 운영을 위한 본사 표준 보안 시스템." },
      { iconName: "Monitor", nameKo: "키오스크·통합 회원 관리",
        descriptionKo: "본사 통합 ERP 의무 사용 — 글로벌 회원 DB 연동." },
      { iconName: "Box", nameKo: "퍼플 컬러 락커룸",
        descriptionKo: "본사 표준 락커 패키지 — 보라색 시그니처 컬러 통일." },
      { iconName: "Megaphone", nameKo: "퍼플 시그니처 간판·로고",
        descriptionKo: "본사 디자인팀 글로벌 BI 100% 적용." }
    ],
    standardConcept: {
      iconName: "Dumbbell",
      nameKo: "애니타임 24시 글로벌 무인 짐",
      descriptionKo: "퍼플·블랙 컬러의 24시 키카드 무인 짐 — 전 세계 5,000개 매장 표준 동일.",
      signatureColors: "퍼플 + 블랙 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 30000,
    notes: [
      "글로벌 라이센스 fee: 약 $29,999 + 월 로열티 $499 (미국 기준, 한국은 본사 문의)",
      "총 투자비: $56K~$354K (5,600만~3.5억원, 매장 규모 따라 차이)",
      "한국 가맹비·로열티 정확 수치 비공개 — 한국 본사 1588-6911 문의 필수",
      "글로벌 표준 100% 적용 — 머신·BI·시스템 점주 변경 불가"
    ],
    confidence: "medium",
    sources: [
      { label: "www.anytimefitness.kr", url: "https://www.anytimefitness.kr/" },
      { label: "namu.wiki", url: "https://namu.wiki/w/%EC%95%A0%EB%8B%88%ED%83%80%EC%9E%84%20%ED%94%BC%ED%8A%B8%EB%8B%88%EC%8A%A4" },
      { label: "www.changupdo.com", url: "https://www.changupdo.com/franchise/13045" }
    ]
  },

  "curves": {
    hqSuppliedItems: [
      { iconName: "Dumbbell", nameKo: "30분 순환운동 전용 머신 12종",
        descriptionKo: "여성 신체 전용 유압식 머신 — 본사 가맹비(5,900만원)에 운동장비 포함." },
      { iconName: "Box", nameKo: "여성 전용 락커·파우더룸",
        descriptionKo: "여성 친화 인테리어 — 35~50평 표준." },
      { iconName: "Monitor", nameKo: "회원 관리 + 코칭 시스템",
        descriptionKo: "본사 표준 회원 관리 ERP — 30분 순환 코칭 매뉴얼 통합." },
      { iconName: "Users", nameKo: "본사 코치 교육·매출 부진점 긴급출동",
        descriptionKo: "본사 코칭 + 매출 부진 가맹점 본사 직접 지원 시스템." },
      { iconName: "Megaphone", nameKo: "커브스 핑크 간판",
        descriptionKo: "여성 친화 핑크·화이트 시그니처 사인." }
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "커브스 30분 순환운동 여성 전용 짐",
      descriptionKo: "1992년 텍사스 시작 — 핑크·화이트 컬러의 35~50평 여성 전용 30분 순환 운동 매장.",
      signatureColors: "핑크 + 화이트 + 라이트우드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 4600,
    notes: [
      "총 창업비 약 1.2억 — 가맹비 5,900만(머신 포함) + 인테리어 4,600만 + 사무집기 600만 + 마케팅 600만 (40평 기준)",
      "전기증설·간판·냉난방 별도",
      "최소 실평수 35~50평 필요 — 30분 순환 동선 확보 필수",
      "본사 매출 부진점 긴급 지원 시스템 운영 (한경 보도)"
    ],
    confidence: "high",
    sources: [
      { label: "www.curveskorea.co.kr", url: "https://www.curveskorea.co.kr/establishment/conditions-and-procedures.html" },
      { label: "m.curveskorea.co.kr", url: "https://m.curveskorea.co.kr/business-info.html" },
      { label: "www.hankyung.com", url: "https://www.hankyung.com/economy/article/2017101542821" }
    ]
  },

  "golfzon-park": {
    hqSuppliedItems: [
      { iconName: "Cpu", nameKo: "TWOVISION PLUS 시스템 (5대)",
        descriptionKo: "골프존 자체 개발 스크린골프 시스템 — 5대 기준 3.1억원 (대당 6,200만원). 본사 직매 의무." },
      { iconName: "Monitor", nameKo: "레이저 프로젝터 + 바닥 프로젝터",
        descriptionKo: "이중 프로젝터 구성 — 시스템 가격에 포함." },
      { iconName: "Maximize2", nameKo: "듀얼플레이트 (움직이는 타석)",
        descriptionKo: "골프존 시그니처 — 경사 시뮬레이션 가능 자동 타석." },
      { iconName: "Box", nameKo: "골프 용품 패키지 (볼·클럽·장갑·골프화)",
        descriptionKo: "본사 1,200만원 상당 초기 용품 공급." },
      { iconName: "Megaphone", nameKo: "골프존파크 간판 + 시그니처 사인",
        descriptionKo: "200만원 본사 시공." },
      { iconName: "Users", nameKo: "GTOUR 토너먼트 운영 시스템",
        descriptionKo: "본사 GTOUR 회원 자동 유입 — 가맹점 매출 시너지." }
    ],
    standardConcept: {
      iconName: "Cpu",
      nameKo: "골프존파크 프리미엄 스크린골프",
      descriptionKo: "100평 5룸 표준 — TWOVISION PLUS + 듀얼플레이트로 PGA 코스 구현하는 국내 1위 스크린골프.",
      signatureColors: "그린 + 블랙 + 우드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 14000,
    notes: [
      "총 창업비 약 4.79억 (VAT 별도, 100평 5룸 기준): 가맹금 1,500만 + 시스템 5대 31,000만 + 인테리어 14,000만 + 간판 200만 + 골프용품 1,200만",
      "수익성 우려 — 평균 매출 3억 vs 창업비 5.6억 (소비자가만드는신문)",
      "본사 시스템 100% 의무 — 타사 스크린 사용 불가",
      "본사: 강남구 영동대로 골프존타워서울 (청담동) + 대전 본사"
    ],
    confidence: "high",
    sources: [
      { label: "www.golfzonpark.com", url: "https://www.golfzonpark.com/" },
      { label: "blog.donnamu.com", url: "https://blog.donnamu.com/54" },
      { label: "www.consumernews.co.kr", url: "https://www.consumernews.co.kr/news/articleView.html?idxno=522089" },
      { label: "lifeisgood.kr", url: "https://lifeisgood.kr/%EC%8A%A4%ED%81%AC%EB%A6%B0%EA%B3%A8%ED%94%84-%EC%B0%BD%EC%97%85%EB%B9%84%EC%9A%A9-%ED%9B%84%EA%B8%B0-%EB%B9%84%EA%B5%90/" }
    ]
  },

  "friends-screen": {
    hqSuppliedItems: [
      { iconName: "Cpu", nameKo: "프렌즈스크린 시스템 (타석당 1,500~2,500만원)",
        descriptionKo: "카카오VX 자체 개발 시스템 — 50평 5룸 기준 7,500만~1.25억원." },
      { iconName: "Monitor", nameKo: "프로젝터·스크린 패키지",
        descriptionKo: "타석당 시스템에 포함, 본사 직매." },
      { iconName: "Megaphone", nameKo: "카카오프렌즈 IP 간판",
        descriptionKo: "라이언·어피치 등 카카오프렌즈 캐릭터 사이니지 — 룸당 100만원 본사 지원금." },
      { iconName: "Users", nameKo: "카카오톡 연동 회원 관리",
        descriptionKo: "카카오톡·카카오게임즈 회원 자동 연동." },
      { iconName: "Box", nameKo: "골프 용품 + 세팅 집기",
        descriptionKo: "본사 표준 패키지." },
      { iconName: "Sparkles", nameKo: "프로모션 시스템 할인 + 신규 매장 간판비 일부 지원",
        descriptionKo: "신규 오픈 시 본사 지원금 적용." }
    ],
    standardConcept: {
      iconName: "Cpu",
      nameKo: "프렌즈스크린 캐주얼 스크린골프",
      descriptionKo: "50평 4~5룸 표준 — 카카오프렌즈 IP를 활용한 골프존 대비 캐주얼·여성 친화 무드.",
      signatureColors: "옐로우 + 화이트 + 블랙 (카카오 톤)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 9000,
    notes: [
      "가맹 계약비 2,500~4,000만 + 시스템 7,500만~1.25억 (5룸) + 인테리어 8,250만~1억750만 (50평)",
      "총 창업비 약 2~3.5억 — 골프존 대비 1~2억 저렴",
      "신규 매장 룸당 100만원 간판 지원금 + 시스템 할인 프로모션",
      "카카오톡 IP·회원 연동 시너지 — 단, 본사 정책 변경 리스크 존재"
    ],
    confidence: "medium",
    sources: [
      { label: "www.friendsscreen.kr", url: "https://www.friendsscreen.kr/main/business_info" },
      { label: "www.golfstlazare.com", url: "https://www.golfstlazare.com/2023-%EC%B9%B4%EC%B9%B4%EC%98%A4-%ED%94%84%EB%A0%8C%EC%A6%88-%EC%8A%A4%ED%81%AC%EB%A6%B0%EA%B3%A8%ED%94%84-%EC%B0%BD%EC%97%85%EB%B9%84%EC%9A%A9-%EC%B4%9D%EC%A0%95%EB%A6%AC/" },
      { label: "www.friendsscreen.kr", url: "https://www.friendsscreen.kr/main/business_new" }
    ]
  },

  "polypark": {
    hqSuppliedItems: [
      { iconName: "Heart", nameKo: "폴리파크 표준 진열 시스템",
        descriptionKo: "프리미엄 펫샵 진열장·매대 — 본사 직매 (가맹 문의 1544-8127)." },
      { iconName: "Box", nameKo: "반려동물 용품 본사 도매 공급",
        descriptionKo: "사료·간식·용품·악세서리 본사 통합 매입가." },
      { iconName: "Scissors", nameKo: "그루밍 테이블·도구",
        descriptionKo: "그루밍 서비스 운영 매장에 본사 공급." },
      { iconName: "Monitor", nameKo: "POS·재고 관리 시스템",
        descriptionKo: "본사 통합 시스템 의무 도입." },
      { iconName: "Megaphone", nameKo: "폴리파크 시그니처 간판",
        descriptionKo: "본사 통일 간판 시공." }
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "폴리파크 프리미엄 펫샵",
      descriptionKo: "프리미엄 반려동물 용품·악세서리 전문점 — 자체 쇼핑몰 + 오프라인 매장 결합형.",
      signatureColors: "화이트 + 우드 + 핑크 (브랜드 톤)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4000,
    notes: [
      "본사: ㈜폴리파크 — 자체 온라인몰(polypark.kr) + 오프라인 가맹 운영",
      "공정위 정보공개서 미확인 — 가맹점 수·창업비 정확 수치 본사 직접 문의 필수",
      "프리미엄 펫 악세서리 전문 — 일반 펫마트 대비 단가 ↑",
      "POS 시스템(polypark.net) 자체 운영 — 본사 ERP 일원화"
    ],
    confidence: "low",
    sources: [
      { label: "polypark.co.kr", url: "https://polypark.co.kr/" },
      { label: "polypark.kr", url: "https://polypark.kr/" },
      { label: "polypark.net", url: "https://polypark.net/" }
    ]
  },

  "pet-friends": {
    hqSuppliedItems: [
      { iconName: "Globe", nameKo: "펫프렌즈 — 가맹 사업 미운영 (이커머스 모델)",
        descriptionKo: "국내 1위 펫커머스(매출 1,030억, 2023) — 새벽배송·이커머스 중심으로 오프라인 가맹점은 운영하지 않음." },
      { iconName: "Box", nameKo: "(참고) 자사몰 입점 도매 공급 모델",
        descriptionKo: "오프라인 펫샵에 본사 도매 공급은 가능하나, 별도 가맹 패키지 부재." },
      { iconName: "Monitor", nameKo: "(참고) 펫프렌즈 앱·심쿵배송",
        descriptionKo: "B2C 새벽배송 중심 — 일반 사장님 가맹 진입 경로 없음." }
    ],
    standardConcept: {
      iconName: "Globe",
      nameKo: "펫프렌즈 = 이커머스 (가맹 X)",
      descriptionKo: "오프라인 매장이 아닌 새벽배송 펫커머스 — 가맹 사업 모델 부재.",
      signatureColors: "옐로우 + 화이트 (앱 BI)"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 0,
    notes: [
      "펫프렌즈는 가맹사업이 아닌 이커머스(새벽배송) — 일반 점주 가맹 진입 불가",
      "2024년 월 BEP 돌파, 2025년 상반기 흑자전환",
      "오프라인 펫샵 창업을 원하면 펫마트·폴리파크 등 다른 브랜드 검토 필수",
      "본사: ㈜펫프렌즈, 강남구 삼성동"
    ],
    confidence: "high",
    sources: [
      { label: "thevc.kr", url: "https://thevc.kr/petfriends" },
      { label: "m.pet-friends.co.kr", url: "https://m.pet-friends.co.kr/" },
      { label: "zdnet.co.kr", url: "https://zdnet.co.kr/view/?no=20190827145631" }
    ]
  },

  "petmart": {
    hqSuppliedItems: [
      { iconName: "Box", nameKo: "펫마트 표준 진열 매대 + 캐셔",
        descriptionKo: "본사 (㈜선진펫) 직매 — 반려동물 용품 유통 전국 1위 매대 표준." },
      { iconName: "Package", nameKo: "사료·간식·용품 본사 도매 공급",
        descriptionKo: "선진그룹 자체 사료 + 외부 브랜드 통합 공급가." },
      { iconName: "Scissors", nameKo: "그루밍 코너 집기 (선택)",
        descriptionKo: "그루밍 운영 매장 본사 공급." },
      { iconName: "Monitor", nameKo: "POS·재고 관리 시스템",
        descriptionKo: "본사 통합 ERP 도입." },
      { iconName: "Megaphone", nameKo: "펫마트 그린 간판·외관",
        descriptionKo: "본사 표준 시공." }
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "펫마트 보급형 동네 펫샵",
      descriptionKo: "선진그룹 산하 — 그린·화이트 톤의 동네 보급형 반려동물 용품 매장. 전국 1위 펫 유통망.",
      signatureColors: "그린 + 화이트 + 옐로우"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4000,
    notes: [
      "본사: ㈜선진펫(청도) — 선진그룹 자체 사료 + 외부 브랜드 동시 공급",
      "전국 매출 1위 펫샵 유통망",
      "구체 창업비·정보공개서 본사 직접 문의 필수 (1588-1684 / anstn784@sunjinpet.co.kr)",
      "선진사료 의무 매입 비율 확인 필요 — 점주 자율 매입 한도 검증 권장"
    ],
    confidence: "medium",
    sources: [
      { label: "www.withpetmart.com", url: "https://www.withpetmart.com/" },
      { label: "www.petmart.co.kr", url: "https://www.petmart.co.kr/service/company.php" },
      { label: "www.changupdo.com", url: "https://www.changupdo.com/franchise/6331" }
    ]
  },

  "london-pet": {
    hqSuppliedItems: [
      { iconName: "Heart", nameKo: "런던펫 — 공식 가맹 정보 미확인",
        descriptionKo: "공정위 정보공개서·공식 본사 페이지 검색 결과 부재 — 가맹사업이 아닌 단일 매장/브랜드 가능성." },
      { iconName: "Box", nameKo: "(추정) 펫 용품·악세서리",
        descriptionKo: "공식 본사 정보 부재 — 다른 펫샵 가맹(펫마트·폴리파크·견생냥품) 검토 권장." }
    ],
    standardConcept: {
      iconName: "Heart",
      nameKo: "런던펫 (정보 부재)",
      descriptionKo: "공식 가맹 본사·정보공개서 미확인. 단일 펫샵 또는 소규모 운영 가능성.",
      signatureColors: "확인 불가"
    },
    flexibility: "flexible",
    estimatedInteriorCostWon: 3000,
    notes: [
      "공정위 정보공개서·공식 가맹 본사 페이지 미확인",
      "타 펫샵 가맹 (펫마트·폴리파크·견생냥품·도그마캣) 대안 검토 권장",
      "본사 직접 문의 또는 브랜드 정확성 재확인 필수",
      "단일 매장 또는 비공식 가맹 가능성 — 정보공개서 제공 여부 확인 필요"
    ],
    confidence: "low",
    sources: [
      { label: "namu.wiki", url: "https://namu.wiki/w/%ED%8E%AB%EC%88%8D" },
      { label: "petgz.com", url: "https://petgz.com/" }
    ]
  },

  "kumon": {
    hqSuppliedItems: [
      { iconName: "BookOpen", nameKo: "구몬 학습 교재 본사 100% 공급",
        descriptionKo: "교원구몬 본사 — 일본 구몬 라이센스 기반 수학·국어·영어 교재. 점주 임의 매입 불가." },
      { iconName: "Table2", nameKo: "표준 학습 책상·의자",
        descriptionKo: "공부방·교습소 형태 — 회원 25~50명 기준 책상 8~15개." },
      { iconName: "Monitor", nameKo: "구몬 회원 관리 시스템",
        descriptionKo: "주 1회 방문 채점·진도 관리 본사 ERP — 1만 2천명 전문교사 통합 운영." },
      { iconName: "Megaphone", nameKo: "구몬 옐로우 시그니처 간판",
        descriptionKo: "본사 통일 BI — 글로벌 48개국 동일 옐로우 톤." },
      { iconName: "Users", nameKo: "본사 교사 교육·코칭 시스템",
        descriptionKo: "구몬교사 표준 교육 + 정기 코칭." }
    ],
    standardConcept: {
      iconName: "BookOpen",
      nameKo: "구몬 글로벌 자기주도 학습",
      descriptionKo: "옐로우·화이트의 글로벌 표준 학습관 — 48개국 420만 회원, 한국 180만 회원 보유한 1위 학습지.",
      signatureColors: "옐로우 + 화이트 + 블랙"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 1500,
    notes: [
      "교원구몬 본사: 서울 중구 을지로 51 (장평순 회장)",
      "주 1회 회원 가정 방문 + 구몬교실(공부방) 형태 — 일반 학원 대비 인테리어 비용 ↓",
      "교재·시스템 100% 본사 의존 — 점주 자율 커리큘럼 변경 불가",
      "1991년 일본 구몬 판권 체결 후 30년+ 운영 — 글로벌 BI 엄격 적용"
    ],
    confidence: "high",
    sources: [
      { label: "www.kumon.co.kr", url: "https://www.kumon.co.kr/" },
      { label: "namu.wiki", url: "https://namu.wiki/w/%EA%B5%AC%EB%AA%AC" },
      { label: "ko.wikipedia.org", url: "https://ko.wikipedia.org/wiki/%EA%B5%AC%EB%AA%AC%EA%B5%90%EC%9C%A1%EC%97%B0%EA%B5%AC%ED%9A%8C" }
    ]
  },

  "milal-coding": {
    hqSuppliedItems: [
      { iconName: "Cpu", nameKo: "밀알코딩 — 공식 가맹 정보 미확인",
        descriptionKo: "공정위 정보공개서·공식 본사 페이지 검색 부재. 단일 학원 또는 소규모 운영 가능성." },
      { iconName: "Monitor", nameKo: "(참고) 일반 코딩학원 표준",
        descriptionKo: "PC·태블릿 + 코딩 교재 + 표준 책상 — 코딩놀자/플레이코딩/씨큐브코딩 등 타 브랜드 대안 검토 권장." }
    ],
    standardConcept: {
      iconName: "Cpu",
      nameKo: "밀알코딩 (정보 부재)",
      descriptionKo: "공식 가맹 본사·정보공개서 미확인 — 단일 학원 또는 비프랜차이즈 가능성.",
      signatureColors: "확인 불가"
    },
    flexibility: "flexible",
    estimatedInteriorCostWon: 3000,
    notes: [
      "공정위 정보공개서·공식 가맹 본사 페이지 미확인",
      "어린이 코딩 가맹 — 코딩놀자·플레이코딩·씨큐브코딩·디랩코딩 등 검증된 대안 다수",
      "일반 소자본 학원 창업비 2,000~8,000만원 (소중함인사이트)",
      "본사 직접 문의 또는 브랜드 정확성 재확인 필수"
    ],
    confidence: "low",
    sources: [
      { label: "ssjum.com", url: "https://ssjum.com/startup-guide-academy.html" },
      { label: "help.academy.prompie.com", url: "https://help.academy.prompie.com/hc/ko/articles/360052550852" }
    ]
  },

  "toz-study": {
    hqSuppliedItems: [
      { iconName: "Table2", nameKo: "토즈 표준 1인 부스 + 그룹 스터디룸",
        descriptionKo: "본사 표준 60평 168㎡ 기준 — 1인 좌석 + 그룹룸 통합 구성. 본사 인테리어 의무 시공." },
      { iconName: "Lightbulb", nameKo: "조도 설계 + 동선 인테리어",
        descriptionKo: "토즈 노하우 조도·동선 — 인테리어비가 창업비 대부분 차지(1.8억대)." },
      { iconName: "Monitor", nameKo: "스터디토즈 앱 + 무인 키오스크",
        descriptionKo: "회원 결제·좌석 예약 자동화. 본사 시스템 의무." },
      { iconName: "Lock", nameKo: "사물함·키카드 출입 시스템",
        descriptionKo: "본사 표준 보안·사물함 패키지." },
      { iconName: "Coffee", nameKo: "스터디카페 음료 디스펜서·집기",
        descriptionKo: "본사 표준 음료 코너 패키지." },
      { iconName: "Megaphone", nameKo: "토즈 시그니처 사인",
        descriptionKo: "본사 통일 간판 시공." }
    ],
    standardConcept: {
      iconName: "BookOpen",
      nameKo: "토즈 프리미엄 스터디센터",
      descriptionKo: "60평 표준 — 1인 부스 + 그룹 스터디룸 결합형, 화이트·우드 톤의 프리미엄 스터디 카페.",
      signatureColors: "화이트 + 우드 + 그린"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 13000,
    notes: [
      "총 창업비 약 1억 8,480만원 (마이프차) — 점포 보증금 합산 시 2.5~3억",
      "기준 점포 168㎡(60평) — 60평 미만 매장 진입 불가",
      "전국 80개 가맹점 — 10년+ 중견 프랜차이즈, 박명수 창업 매장 화제",
      "본사 인테리어 100% 의무 — 점주 자율 시공 불가"
    ],
    confidence: "high",
    sources: [
      { label: "myfranchise.kr", url: "https://myfranchise.kr/20130100183/%ED%86%A0%EC%A6%88-%EC%8A%A4%ED%84%B0%EB%94%94%EC%84%BC%ED%84%B0" },
      { label: "study.toz.co.kr", url: "https://study.toz.co.kr/" },
      { label: "namu.wiki", url: "https://namu.wiki/w/%ED%86%A0%EC%A6%88" },
      { label: "www.junsungki.com", url: "https://www.junsungki.com/magazine/post-detail.do?id=2420" }
    ]
  },

  "zaksim-study": {
    hqSuppliedItems: [
      { iconName: "Table2", nameKo: "작심 표준 1인 부스 (50평 200석 표준)",
        descriptionKo: "338개 가맹점 통일 부스 — 본사 직매. 인테리어비가 창업비 대부분 차지(약 2억)." },
      { iconName: "Lightbulb", nameKo: "조도·동선 표준 인테리어",
        descriptionKo: "본사 인테리어팀 100% 시공 — 점주 변경 불가." },
      { iconName: "Monitor", nameKo: "무인 키오스크 + 24시 자동화 시스템",
        descriptionKo: "회원 결제·좌석 예약·CCTV 통합 본사 ERP." },
      { iconName: "Lock", nameKo: "사물함·키카드 보안",
        descriptionKo: "본사 표준 보안 패키지." },
      { iconName: "Coffee", nameKo: "음료·간식 디스펜서",
        descriptionKo: "본사 표준 카페 코너." },
      { iconName: "Megaphone", nameKo: "작심 그린 시그니처 간판",
        descriptionKo: "본사 통일 BI 시공." }
    ],
    standardConcept: {
      iconName: "BookOpen",
      nameKo: "작심 24시 무인 스터디카페",
      descriptionKo: "50평 200석 표준 — 그린·우드 톤의 24시 무인 운영 + 르하임과 함께 스터디카페 1위 그룹.",
      signatureColors: "그린 + 우드 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 14000,
    notes: [
      "총 창업비 약 1억 9,910만원 (마이프차) — 인테리어 비중이 ~70%",
      "전국 338개 가맹점 — 토즈와 함께 중상위권 스터디카페 브랜드",
      "본사 인테리어팀 직접 시공 — 점주 자율 시공·변경 불가",
      "5년 단위 리뉴얼 의무 가능성 — 정보공개서로 사전 확인 필수 (비즈한국 보도)"
    ],
    confidence: "high",
    sources: [
      { label: "myfranchise.kr", url: "https://myfranchise.kr/20190640/%EC%9E%91%EC%8B%AC%EC%8A%A4%ED%84%B0%EB%94%94%EC%B9%B4%ED%8E%98" },
      { label: "www.bizhankook.com", url: "https://www.bizhankook.com/bk/article/25869" },
      { label: "www.junsungki.com", url: "https://www.junsungki.com/magazine/post-detail.do?id=2420" }
    ]
  },

  "seldog24-study": {
    hqSuppliedItems: [
      { iconName: "Table2", nameKo: "셀독24 표준 1인 부스 (24시 무인)",
        descriptionKo: "20년+ 독서실 운영 노하우 기반 부스 설계. 본사 직매." },
      { iconName: "Monitor", nameKo: "24시 365일 무인 자동화 시스템",
        descriptionKo: "결제·출입·예약 본사 통합 시스템 — 인건비 최소화 핵심." },
      { iconName: "Lock", nameKo: "키카드 출입 + CCTV",
        descriptionKo: "무인 운영을 위한 본사 표준 보안 패키지." },
      { iconName: "Coffee", nameKo: "무료 커피·편의시설",
        descriptionKo: "셀독24 차별화 — 본사 음료 디스펜서 패키지." },
      { iconName: "Lightbulb", nameKo: "독서실 노하우 조도 설계",
        descriptionKo: "독서실 전문가 출신 본사 인테리어 표준." },
      { iconName: "Megaphone", nameKo: "셀독24 시그니처 간판",
        descriptionKo: "본사 통일 시공." }
    ],
    standardConcept: {
      iconName: "BookOpen",
      nameKo: "셀독24 24시 무인 스터디카페",
      descriptionKo: "독서실 20년 노하우 + 카페 결합 — 다크우드·블랙 톤의 24시 365일 무인 자동화 매장.",
      signatureColors: "다크우드 + 블랙 + 옐로우"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 9000,
    notes: [
      "총 창업비 약 1억 4,454만원 (마이프차) — 토즈·작심 대비 약 4~5천만원 저렴",
      "전국 70개 가맹점, 70호점 목표 (성장 중)",
      "20년+ 독서실 운영 전문가 출신 본사 — 학습 효율 차별화 강조",
      "본사: 02-877-7311, 무인 운영으로 인건비 최소화가 핵심 셀링 포인트"
    ],
    confidence: "medium",
    sources: [
      { label: "www.selldok24.com", url: "http://www.selldok24.com/" },
      { label: "myfranchise.kr", url: "https://myfranchise.kr/20200560/%EC%85%80%EB%8F%8524%EC%8A%A4%ED%84%B0%EB%94%94%EC%B9%B4%ED%8E%98" },
      { label: "www.ksilbo.co.kr", url: "https://www.ksilbo.co.kr/news/articleView.html?idxno=759545" },
      { label: "www.changupdo.com", url: "https://www.changupdo.com/franchise/16718" }
    ]
  },

  "cu": {
    hqSuppliedItems: [
      { iconName: "Box", nameKo: "본사 지정 냉장 쇼케이스 (오픈·도어형)",
        descriptionKo: "BGF리테일 표준 5단 쇼케이스 — 본사 물류로 일괄 배송, 계약형태(완전가맹·자유가맹)별 임대·구매 옵션 상이." },
      { iconName: "Monitor", nameKo: "본사 통합 POS·재고관리 시스템",
        descriptionKo: "포켓CU·발주·CCTV·매출 데이터 연동된 BGF 자체 POS — 수수료 본사 일괄 부담, 점주 임의 교체 불가." },
      { iconName: "LayoutGrid", nameKo: "표준 곤도라(매대) 세트",
        descriptionKo: "신선강화 매장 표준 매대 — 채소·과일·즉석조리 전면 배치를 위한 본사 설계 도면 강제." },
      { iconName: "Camera", nameKo: "본사 표준 CCTV·EAS 도난방지",
        descriptionKo: "사각지대 없는 카메라 배치 + 도난방지 게이트 — 본사 감리 통과 필수." },
      { iconName: "Megaphone", nameKo: "보라색·라임 시그니처 간판·사인",
        descriptionKo: "CU 5세대 BI 간판 — 외부 사인·점등·LED 모두 본사 지정 업체 시공." },
      { iconName: "Thermometer", nameKo: "워크인 냉장·냉동고",
        descriptionKo: "주류·음료 대량 보관용 워크인 — 본사 발주, 매장 평수에 따라 표준 사양 다름." },
      { iconName: "Coffee", nameKo: "GET 커피·즉석조리 카운터",
        descriptionKo: "GET 커피머신·온장고·핫바 워머 — 본사 무상 임대 또는 매월 사용료." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "CU 신선강화 표준 매장",
      descriptionKo: "보라+라임+화이트 시그니처 + 채소·과일·즉석조리 전면 배치 — 5세대 BI 적용.",
      signatureColors: "보라색 + 라임 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 6000,
    notes: [
      "본사 지정 시공업체 + 표준 매뉴얼 강제 (감리 통과 필수)",
      "위탁가맹·자유가맹 계약 형태별 인테리어·집기 비용 부담 주체 다름",
      "5년 주기 리뉴얼 의무 — 비용 분담 비율 계약서 확인 필수",
      "10평 기준 인테리어 5,000~6,600만원, 평당 150~200만원 범위",
    ],
    confidence: "high",
    sources: [
      { label: "공정위 정보공개서 + BGF리테일 공식 가맹페이지 (cu.bgfretail.com)" },
      { label: "iF Design CU 브랜드 디자인 시스템" },
      { label: "비즈한국 '5년마다 리뉴얼 의무' 기사" }
    ],
  },

  "gs25": {
    hqSuppliedItems: [
      { iconName: "Monitor", nameKo: "GS25 통합 POS·발주 시스템",
        descriptionKo: "GS리테일 자체 개발 POS — 발주·재고·매출·간편결제 통합, 본사 임대 사용." },
      { iconName: "Box", nameKo: "본사 표준 오픈 쇼케이스·워크인",
        descriptionKo: "신선식품·음료·주류 진열 표준 사양 — 본사 지정 업체 설치." },
      { iconName: "Megaphone", nameKo: "파란색 BI 간판·외장 사인",
        descriptionKo: "2019년 개편 'LIFESTYLE PLATFORM' BI — 신규·리뉴얼 매장 의무 적용, 본사 지정." },
      { iconName: "Camera", nameKo: "표준 CCTV·EAS 게이트",
        descriptionKo: "본사 감리 통과 필요한 보안 시스템 — 사각지대 차단 배치." },
      { iconName: "Coffee", nameKo: "카페25·즉석조리 장비",
        descriptionKo: "원두커피·핫바·튀김기 본사 일괄 공급, 매월 사용료 정산." },
      { iconName: "LayoutGrid", nameKo: "표준 곤도라·진열대 세트",
        descriptionKo: "1인 가구 라이프스타일 동선 설계 — 본사 도면 강제." },
      { iconName: "Smile", nameKo: "AI 퍼스널컬러·뷰티존 등 신규 모듈",
        descriptionKo: "2025년 도입된 화장품 플랫폼·키오스크 — 일부 매장 본사 무상 설치." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "GS25 라이프스타일 플랫폼 매장",
      descriptionKo: "파란색 시그니처 + 1인 가구 친화 동선 + 신선·즉석·뷰티 통합 매대.",
      signatureColors: "파란색 (Primary Blue) + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 5000,
    notes: [
      "가맹비 770만원(VAT 포함), 보증금 5,000만원, 인테리어·집기 별도 약 1,533만원 본사 견적",
      "수익추구 특약형은 점주 시설 투자 부담, 일반형은 본사 부담 비율 다름",
      "계약기간 7년 — 중도 해지 시 위약금 발생 가능",
      "인테리어 자의적 변경 금지 (본사 매뉴얼 위반 시 계약 해지 사유)",
    ],
    confidence: "high",
    sources: [
      { label: "GS25 공식 가맹페이지 (gs25.gsretail.com/franchise-info)" },
      { label: "마이프차 GS25 창업비용 정보" },
      { label: "전자신문 GS25 BI 개편 보도 (2019)" }
    ],
  },

  "seven-eleven": {
    hqSuppliedItems: [
      { iconName: "Monitor", nameKo: "롯데 세븐일레븐 POS·발주 시스템",
        descriptionKo: "롯데정보통신 기반 통합 POS — 본사 임대, 점주 교체 불가." },
      { iconName: "Box", nameKo: "본사 표준 쇼케이스·워크인",
        descriptionKo: "음료·주류·신선 진열 — 본사 발주 단일 사양." },
      { iconName: "Megaphone", nameKo: "주황·초록·빨강 5세대 BI 간판",
        descriptionKo: "세계 표준 3색 + 'n' 소문자 로고 — 본사 지정 업체 시공." },
      { iconName: "Camera", nameKo: "표준 CCTV·EAS 보안",
        descriptionKo: "본사 감리 통과 필수, 사각지대 차단 배치." },
      { iconName: "LayoutGrid", nameKo: "표준 곤도라·진열대",
        descriptionKo: "도시락·삼각김밥 핫코너 중심 동선 — 본사 도면 강제." },
      { iconName: "Coffee", nameKo: "세븐카페·즉석조리 장비",
        descriptionKo: "원두커피·튀김기·핫바 워머 — 본사 임대 또는 사용료." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "세븐일레븐 5세대 표준 매장",
      descriptionKo: "주황·초록·빨강 3색 띠 + 도시락·즉석조리 핫코너 중심 매장 동선.",
      signatureColors: "주황 + 초록 + 빨강"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 5500,
    notes: [
      "본사 감리 4~6주 공사 — 자의적 변경 시 위약금",
      "본사 지정 시공업체·매뉴얼 강제",
      "5세대 BI 적용 신규 매장 의무 — 기존 매장 리뉴얼 비용 분담",
      "구체적 본사 공급 비용 표준은 정보공개서 직접 확인 필요",
    ],
    confidence: "medium",
    sources: [
      { label: "이코노믹리뷰 세븐일레븐 5세대 BI 보도" },
      { label: "나무위키 세븐일레븐 / 대한민국" },
      { label: "아시아경제 세븐일레븐 로고 분석" }
    ],
  },

  "emart24": {
    hqSuppliedItems: [
      { iconName: "Monitor", nameKo: "이마트24 통합 POS·SSG 연동",
        descriptionKo: "신세계 그룹 SSG·이마트24 자체 POS — 본사 임대." },
      { iconName: "Box", nameKo: "본사 표준 쇼케이스·워크인 냉장",
        descriptionKo: "신선·음료·주류 — 본사 일괄 공급, 매장 평수 표준 사양." },
      { iconName: "Megaphone", nameKo: "노랑·검정 BI 간판·사인",
        descriptionKo: "이마트24 노란색 시그니처 외장 — 본사 지정 시공." },
      { iconName: "Camera", nameKo: "표준 CCTV·EAS 게이트",
        descriptionKo: "본사 감리 통과 필수." },
      { iconName: "Coffee", nameKo: "프리미엄 와인존·이프레쏘 커피",
        descriptionKo: "와인 셀러·원두 머신 — 일부 매장 본사 무상 임대." },
      { iconName: "LayoutGrid", nameKo: "표준 곤도라·진열대",
        descriptionKo: "PB 상품(아임e) 중심 동선 — 본사 도면 강제." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "이마트24 노란색 표준 매장",
      descriptionKo: "노랑·검정 시그니처 + 와인·PB 상품 강화 매장 — 신세계 라이프스타일 반영.",
      signatureColors: "노랑 + 검정 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 7500,
    notes: [
      "가맹비 2,370만원, 보증금 5,000만원, 인테리어·기타 약 7,556만원 — 4대 편의점 중 인테리어 부담 가장 큼",
      "본사 지정 시공업체 강제",
      "총 창업비용 약 1억 4,926만원 (4대 중 상위)",
      "5년 주기 리뉴얼 의무 가능성 — 계약서 확인 필수",
    ],
    confidence: "high",
    sources: [
      { label: "이마트24 공식 창업절차 (emart24.co.kr/founded)" },
      { label: "랭킹 인투데이 이마트24 창업비용 분석" }
    ],
  },

  "hansot-lunchbox": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "본사 지정 주방장비 패키지",
        descriptionKo: "15평 기준 약 1,560만원 — 가스레인지·튀김기·국솥·밥솥 본사 표준 사양." },
      { iconName: "Monitor", nameKo: "POS + 무인주문기(키오스크)",
        descriptionKo: "POS 약 160만원 + 키오스크 약 400만원 — 본사 발주." },
      { iconName: "Megaphone", nameKo: "본사 지정 간판·DID 메뉴보드",
        descriptionKo: "간판 약 450만원 + DID 메뉴보드 약 80만원 — 한솥 BI 강제." },
      { iconName: "Wind", nameKo: "냉난방기",
        descriptionKo: "약 600만원 — 본사 지정 사양." },
      { iconName: "Table2", nameKo: "표준 가구(테이블·의자)",
        descriptionKo: "약 250만원 — 한솥의 집 컨셉 기준 본사 디자인." },
      { iconName: "Box", nameKo: "진열·포장 카운터",
        descriptionKo: "도시락 진열·포장 흐름 최적화된 본사 설계." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "한솥의 집 (Hansot's House)",
      descriptionKo: "빨강·노랑 따뜻한 톤 + 도시락 진열·조리·포장 동선 일체화 — 소규모 점포 효율 운영.",
      signatureColors: "빨강 + 노랑 + 우드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 3500,
    notes: [
      "15평 기준 총 창업 약 8,300만원 — 인테리어 3,500만원이 최대 비중",
      "공정위 동의의결 사례 — 인테리어 비용 점주 떠넘김 이슈 있었음, 계약서 비용 분담 명확화 필요",
      "본사 인테리어팀이 주방 동선·구조 직접 설계",
      "가맹비 500만원, 보증금 300만원, 교육비 300만원",
    ],
    confidence: "high",
    sources: [
      { label: "한솥도시락 공식 가맹페이지 (franchise.hsd.co.kr)" },
      { label: "더퍼블릭 — 공정위 동의의결 보도" },
      { label: "Design+ 한솥 청담 플래그십 인테리어 기사" }
    ],
  },

  "bon-dosirak": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "본사 지정 주방장비 세트",
        descriptionKo: "본도시락(본아이에프) 표준 가스·국솥·튀김기 — 본사 발주." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본아이에프 통합 시스템 — 본사 임대 또는 일괄 구매." },
      { iconName: "Box", nameKo: "도시락 진열 쇼케이스·포장 카운터",
        descriptionKo: "한식 도시락 진열에 맞춘 본사 표준 설계." },
      { iconName: "Megaphone", nameKo: "본도시락 BI 간판·사인",
        descriptionKo: "본아이에프 시그니처 외장 — 본사 지정 시공." },
      { iconName: "Table2", nameKo: "표준 테이블·가구",
        descriptionKo: "테이크아웃 중심 동선의 작은 홀 가구 패키지." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "본도시락 한정식 도시락 매장",
      descriptionKo: "본아이에프 시그니처 톤 + 한정식 프리미엄 도시락 진열 중심.",
      signatureColors: "다크그린 + 우드 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 4000,
    notes: [
      "총 창업비용 약 8,609만원 (마이프차 기준)",
      "440개 이상 가맹점 — 본사 표준 시공 매뉴얼 강제",
      "본사 직접 공급 식자재 의무 — 자율 식자재 구매 금지",
      "구체적 인테리어·집기 항목별 비용은 본사 정보공개서 직접 확인 필요",
    ],
    confidence: "medium",
    sources: [
      { label: "마이프차 본도시락 창업비용 (myfranchise.kr)" },
      { label: "본도시락 공식 가맹페이지 (bondosirak-start.co.kr)" }
    ],
  },

  "hongkong-banjum": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "본사 지정 중식 주방장비",
        descriptionKo: "더본코리아 지정 웍 화구·튀김기 — 웍 자동화 로봇 50% 지원 (현재 특전)." },
      { iconName: "Monitor", nameKo: "POS·키오스크 패키지",
        descriptionKo: "더본 통합 POS — 최대 3,000만원까지 36개월 분납 금융지원." },
      { iconName: "Box", nameKo: "냉장·냉동 보관 장비",
        descriptionKo: "본사 지정 사양 — 식자재 본사 일괄 공급에 맞춤." },
      { iconName: "Table2", nameKo: "표준 테이블·의자",
        descriptionKo: "30평 기준 약 60석 배치 — 더본 매뉴얼." },
      { iconName: "Megaphone", nameKo: "홍콩반점0410 간판·외장 사인",
        descriptionKo: "빨강 시그니처 BI — 본사 지정 시공." },
      { iconName: "Wind", nameKo: "후드·덕트·냉난방기",
        descriptionKo: "중식 화구 강력 후드 — 점포 여건에 따라 추가 비용." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "홍콩반점0410 차이나타운 컨셉",
      descriptionKo: "빨강·노랑 차이나타운 톤 + 30평 표준 + 웍 화구 오픈 주방.",
      signatureColors: "빨강 + 노랑 + 검정"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 5100,
    notes: [
      "30평 기준 평당 인테리어 약 170만원 — 시설비 5,100만원 수준",
      "총 창업비용 약 1억 400만원 (점포 구입비 별도)",
      "30평 이하 매장 가맹비 지원 + 웍 로봇 50% 할인 진행 중 (시점별 상이)",
      "더본 식자재 본사 의무 공급 — 마진 구조 사전 확인 필수",
    ],
    confidence: "high",
    sources: [
      { label: "더본창업센터 홍콩반점0410 (start.theborn.co.kr)" },
      { label: "BUZA.BIZ 홍콩반점 창업비용 분석" }
    ],
  },

  "hyundaeok": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "콩나물국밥 전용 주방장비",
        descriptionKo: "본사 지정 국솥·튀김기·밥솥 — 전주 남부시장식 조리법 표준화." },
      { iconName: "Box", nameKo: "본사 일괄 공급 식자재 보관 냉장고",
        descriptionKo: "완제품·반제품 보관 — 주방장 불필요 운영 모델." },
      { iconName: "Monitor", nameKo: "POS·주문 시스템",
        descriptionKo: "본사 표준 POS — 매출·발주 연동." },
      { iconName: "Table2", nameKo: "한식 표준 테이블·의자",
        descriptionKo: "국밥 회전율 최적화 4인석 중심 배치." },
      { iconName: "Megaphone", nameKo: "현대옥 간판·메뉴판",
        descriptionKo: "전주 35년 전통 BI — 본사 지정 시공." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "현대옥 전주 남부시장식 국밥집",
      descriptionKo: "전통 한옥 톤 + 회전율 중심 4인석 + 오픈 주방으로 신뢰감 강조.",
      signatureColors: "다크우드 + 빨강"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4500,
    notes: [
      "초기 창업비용 비교적 높은 편 — 가맹비·교육비·인테리어비(설계감리비) 별도",
      "본사 완제품·반제품 공급으로 주방장 불필요 — 인건비 절감",
      "구체적 본사 공급 집기 비용 표준은 본사 직접 문의 필수",
      "전북 전주 본점 기반 — 본사 위치(전주 효자로) 멀리 떨어진 매장은 물류비 가산",
    ],
    confidence: "low",
    sources: [
      { label: "현대옥 공식 (hyundaiok.com/franchise/04)" },
      { label: "나무위키 현대옥" }
    ],
  },

  "jungsang": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "본사 지정 한식 주방장비",
        descriptionKo: "한식당 표준 — 가스레인지 2구·국솥·밥솥·식기세척기 (구체 사양 비공개)." },
      { iconName: "Box", nameKo: "냉장·김치냉장고 세트",
        descriptionKo: "반찬·김치 보관 한식당 표준 사양." },
      { iconName: "Monitor", nameKo: "POS·주문 시스템",
        descriptionKo: "표준 POS — 매출 연동." },
      { iconName: "Table2", nameKo: "한식 테이블·의자",
        descriptionKo: "반찬 다수 수용 가능한 큰 테이블." },
      { iconName: "Megaphone", nameKo: "정상 BI 간판",
        descriptionKo: "브랜드 시그니처 외장 — 본사 지정." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "정상 한식·도시락 매장",
      descriptionKo: "한식 전통톤 + 반찬·도시락 중심 동선 — 회전율과 포장 동선 분리.",
      signatureColors: "우드 + 다크그린"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4000,
    notes: [
      "구체 본사 공급 집기·비용 정보 공개 자료 부족 — 정보공개서 직접 확인 필수",
      "20평 기준 한식당 일반 인테리어 3,600~5,000만원, 주방까지 5,000~7,000만원 (업종 평균)",
      "동명 브랜드 다수 — 정확한 법인명 확인 필요",
      "본사 직접 상담 권장",
    ],
    confidence: "low",
    sources: [
      { label: "큐플레이스 한식 인테리어 비용 가이드" },
      { label: "소중함인사이트 식당 인테리어 2026 가이드" }
    ],
  },

  "keunmal-halmae": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "본사 지정 순대국 주방장비",
        descriptionKo: "대형 국솥·가스레인지·밥솥 — 본사 마진 0의 5無 정책 적용 공급." },
      { iconName: "Box", nameKo: "냉장·냉동·보관 장비",
        descriptionKo: "본사 직배송 식자재 보관 — 대량공급 물류 시스템." },
      { iconName: "Monitor", nameKo: "POS·주문 시스템",
        descriptionKo: "본사 통합 POS — 마진 없이 공급." },
      { iconName: "Table2", nameKo: "한식 표준 테이블·의자",
        descriptionKo: "회전율 중심 4~6인석." },
      { iconName: "Megaphone", nameKo: "큰맘할매 시그니처 간판",
        descriptionKo: "1937년 전통 BI — 본사 지정 시공." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "큰맘할매순대국 전통 국밥집",
      descriptionKo: "전통 한식 톤 + 회전율 중심 — 1937년 전통 모티브 BI.",
      signatureColors: "다크우드 + 빨강"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3500,
    notes: [
      "5無 정책 — 가맹비·로열티·교육비·광고비·인테리어 본사 마진 0",
      "전국 약 400개 가맹점 — 동종 업계 1위, 1인 다점포 비율 20%+",
      "본사 대량공급 시스템으로 물류비 절감 강점",
      "구체적 인테리어·집기 항목별 비용은 본사 직접 견적 필수",
    ],
    confidence: "medium",
    sources: [
      { label: "큰맘할매순대국 공식 (keunmam.co.kr)" },
      { label: "마이파운디드 큰맘할매순대국 창업정보" }
    ],
  },

  "misoya": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "일본가정식 주방장비",
        descriptionKo: "튀김기·밥솥·돈가스 라이너·국솥 — 본사 지정 사양." },
      { iconName: "Box", nameKo: "냉장·냉동 보관 장비",
        descriptionKo: "일식 식자재 보관 표준." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 통합 POS — 임대 또는 구매." },
      { iconName: "Table2", nameKo: "일식 테이블·의자",
        descriptionKo: "원목·차분한 톤 일식 가구 패키지." },
      { iconName: "Megaphone", nameKo: "미소야 시그니처 간판",
        descriptionKo: "일식 가정식 컨셉 BI — 본사 지정." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "미소야 일본가정식 매장",
      descriptionKo: "원목 우드톤 + 차분한 일식 가정식 분위기 — 평온한 일식 인테리어.",
      signatureColors: "우드 + 베이지 + 다크그린"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4500,
    notes: [
      "총 창업비용 약 9,584만원 (마이프차 기준)",
      "20년 이상 장수 브랜드 — 가맹점 약 190개",
      "구체적 본사 공급 집기 비용 항목은 정보공개서 직접 확인 필요",
      "일식 인테리어 평당 단가는 한식 대비 다소 높음 — 원목 자재 비중 고려",
    ],
    confidence: "low",
    sources: [
      { label: "마이프차 미소야 (myfranchise.kr/20080100430)" },
      { label: "나무위키 미소야" }
    ],
  },

  "yeokjeon-udon": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "우동 전용 주방장비",
        descriptionKo: "면 삶기 워머·튀김기·국솥 — 본사 지정 사양 (비공개)." },
      { iconName: "Box", nameKo: "냉장·냉동 보관",
        descriptionKo: "면·식자재 보관 표준." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 통합 POS — 회전율 중심 매장 운영." },
      { iconName: "Table2", nameKo: "분식·우동 테이블",
        descriptionKo: "역전(역 옆) 컨셉 회전율 중심 4인석." },
      { iconName: "Megaphone", nameKo: "역전우동 시그니처 간판",
        descriptionKo: "복고풍·역사 컨셉 BI — 본사 지정 시공." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "역전우동 복고풍 분식 매장",
      descriptionKo: "복고 옐로우+레드 + 역사·기차역 모티브 — 회전율 중심 캐주얼.",
      signatureColors: "노랑 + 빨강 + 우드"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3500,
    notes: [
      "공개 정보공개서 정보 매우 부족 — 본사 직접 상담 필수",
      "분식 평당 인테리어 일반 단가 80~120만원 수준",
      "면류 회전율이 매출의 핵심 — 좌석 배치 본사 가이드 강제 가능성",
      "동명 브랜드 가능성 있어 정확한 법인명 확인 필요",
    ],
    confidence: "low",
    sources: [
      { label: "큐플레이스 식당 인테리어 비용 가이드" },
      { label: "비즈한국 프랜차이즈 인테리어 비용 기사" }
    ],
  },

  "yupdduk": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "엽기떡볶이 전용 주방장비",
        descriptionKo: "대형 떡볶이 솥·튀김기·국솥 — 본사 지정 사양." },
      { iconName: "Box", nameKo: "냉장·냉동·포장 카운터",
        descriptionKo: "배달·포장 비중 높은 매장 동선 — 본사 설계 강제." },
      { iconName: "Monitor", nameKo: "POS·배달 통합 시스템",
        descriptionKo: "엽떡 자체 POS + 배달앱 연동 — 본사 임대." },
      { iconName: "Table2", nameKo: "분식 표준 테이블·의자",
        descriptionKo: "홀+배달+포장 운영 — 좌석 비중 작음." },
      { iconName: "Megaphone", nameKo: "엽기떡볶이 시그니처 간판",
        descriptionKo: "빨강·검정 강렬한 BI — 본사 지정 시공." },
      { iconName: "Wind", nameKo: "후드·덕트·냉난방기",
        descriptionKo: "고추 매운 향 강한 환기 시스템 필수." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "엽기떡볶이 매콤 강렬 컨셉",
      descriptionKo: "빨강·검정 강렬한 시그니처 + 18평+ 홀+배달+포장 통합 운영 모델.",
      signatureColors: "빨강 + 검정"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 4000,
    notes: [
      "최소 18평 이상 — 홀+배달+포장 동시 운영 의무",
      "15평 기준 7,283~8,183만원, 25평 9,413~10,813만원 — 평당 약 220만원",
      "가맹비 1,100만원, 교육비 330만원, 로열티 월 44만원",
      "본사 식자재(소스·면) 의무 공급 — 자율 구매 금지",
    ],
    confidence: "high",
    sources: [
      { label: "엽기떡볶이 공식 (yupdduk.com)" },
      { label: "BUZA.BIZ 동대문엽기떡볶이 매출·창업비용 분석" }
    ],
  },

  "yoonsaeng": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "분식 주방장비 패키지",
        descriptionKo: "떡볶이솥·튀김기·국솥 — 본사 지정 사양 (비공개)." },
      { iconName: "Box", nameKo: "냉장·냉동·포장 카운터",
        descriptionKo: "분식 매장 표준 보관 시설." },
      { iconName: "Monitor", nameKo: "POS·배달 시스템",
        descriptionKo: "본사 통합 POS — 배달앱 연동." },
      { iconName: "Table2", nameKo: "표준 테이블·의자",
        descriptionKo: "포장 중심 작은 홀." },
      { iconName: "Megaphone", nameKo: "윤생 시그니처 간판",
        descriptionKo: "분식 캐주얼 BI — 본사 지정." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "윤생 캐주얼 분식 매장",
      descriptionKo: "캐주얼·젊은 톤 분식 인테리어 — 포장·배달 비중 중심.",
      signatureColors: "캐주얼 색상 (구체 미공개)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 3000,
    notes: [
      "공개 가맹 정보 매우 부족 — 정확한 법인명·본사 확인 필요",
      "분식 평당 인테리어 80~120만원, 15평 기준 약 2,000~2,500만원",
      "운영 기계 설비 일반 분식 기준 약 1,100만원",
      "동명 브랜드 가능성 있어 본사 직접 상담 필수",
    ],
    confidence: "low",
    sources: [
      { label: "MUNCH.press 떡볶이 분식점 마진율·창업비용" },
      { label: "큐플레이스 분식 인테리어 비용 가이드" }
    ],
  },

  "vips": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "스테이크 전문 주방장비",
        descriptionKo: "그릴·샐러드바·디스플레이 워머 — CJ푸드빌 표준 사양." },
      { iconName: "Box", nameKo: "샐러드바 디스플레이 시스템",
        descriptionKo: "온·냉 분리 다단 샐러드바 — VIPS 핵심 자산." },
      { iconName: "Monitor", nameKo: "POS·예약 통합 시스템",
        descriptionKo: "CJ푸드빌 자체 POS·CJONE 연동." },
      { iconName: "Table2", nameKo: "패밀리 레스토랑 가구 패키지",
        descriptionKo: "프리미엄 가구·조명 — CJ 디자인팀 직접 설계." },
      { iconName: "Megaphone", nameKo: "VIPS BI 간판·외장",
        descriptionKo: "프리미엄 스테이크 시그니처 — CJ 지정 시공." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "VIPS 프리미엄 스테이크 & 시즈널 샐러드바",
      descriptionKo: "프리미엄 다이닝 톤 + 시즈널 샐러드바 중심 — 전국 약 35개 매장.",
      signatureColors: "다크그린 + 골드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 30000,
    notes: [
      "VIPS는 사실상 CJ푸드빌 직영 중심 — 일반 가맹모집은 매우 제한적",
      "전국 매장 수 약 35개 (대폭 축소된 상태)",
      "구체적 가맹 비용·인테리어 표준 공개 자료 부재 — 본사(CJ푸드빌) 직접 문의 필수",
      "패밀리 레스토랑 평당 인테리어 200만원+, 50평 매장 기준 2~2.5억원 추정",
    ],
    confidence: "low",
    sources: [
      { label: "VIPS 공식 (ivips.co.kr)" },
      { label: "나무위키 VIPS" }
    ],
  },

  "new-maeul": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "고깃집 주방·홀 화구",
        descriptionKo: "테이블 화구·환기 후드·냉장 숙성고 — 더본코리아 표준." },
      { iconName: "Box", nameKo: "냉장·숙성·냉동 보관",
        descriptionKo: "본사 일괄 공급 식자재 보관 — 새마을 7분 돼지김치찜 등." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "더본 통합 POS — 매출·발주 연동." },
      { iconName: "Table2", nameKo: "복고풍 테이블·의자",
        descriptionKo: "1970년대 새마을운동 모티브 — 본사 디자인 강제." },
      { iconName: "Megaphone", nameKo: "새마을식당 BI 간판",
        descriptionKo: "초록 새마을 깃발 모티브 — 본사 지정 시공." },
      { iconName: "Wind", nameKo: "고기 화구 후드·덕트",
        descriptionKo: "강력 환기 시스템 — 점포 여건별 추가 공사 필요." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "새마을식당 복고 고깃집",
      descriptionKo: "1970년대 새마을운동 복고 톤 + 7분 돼지김치찜 시그니처 — 더본 대표 브랜드.",
      signatureColors: "초록 + 노랑 + 우드"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 5500,
    notes: [
      "총 창업비용 약 8,779만원 (마이프차 기준), 최소 10평 이상",
      "철거·냉난방·전기·가스·덕트·소방 등 점포 여건별 추가 비용 큼",
      "더본 식자재 본사 의무 공급 — 마진 구조 사전 확인 필수",
      "가맹비·교육비·매뉴얼제공비 별도",
    ],
    confidence: "high",
    sources: [
      { label: "더본창업센터 새마을식당 (start.theborn.co.kr)" },
      { label: "새마을식당 공식 (newmaul.com/sub/franchise02)" },
      { label: "마이프차 새마을식당" }
    ],
  },

  "pasta-bilrun": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "이탈리안 주방장비",
        descriptionKo: "파스타 보일러·화덕·가스레인지 — 표준 사양 (비공개)." },
      { iconName: "Box", nameKo: "냉장·냉동·식자재 보관",
        descriptionKo: "이탈리안 식자재 보관 표준." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 표준 POS — 임대." },
      { iconName: "Table2", nameKo: "이탈리안 가구 패키지",
        descriptionKo: "원목·수입 자재 강조 톤." },
      { iconName: "Megaphone", nameKo: "파스타빌런 BI 간판",
        descriptionKo: "캐주얼 이탈리안 시그니처." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "파스타빌런 캐주얼 이탈리안",
      descriptionKo: "캐주얼 이탈리안 톤 + 원목 자재 — 합리적 가격대 파스타.",
      signatureColors: "우드 + 다크그린"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 5500,
    notes: [
      "공개 정보공개서·창업 정보 매우 부족 — 본사 직접 상담 필수",
      "이탈리안 평당 인테리어 일반 160~250만원 (원목·수입 자재 사용 시)",
      "정확한 법인명·본사 위치 확인 필요",
      "이 브랜드 명으로 일반 검색 결과는 거의 없음 — 동명 브랜드 가능성",
    ],
    confidence: "low",
    sources: [
      { label: "BUZA.BIZ 이탈리안 레스토랑 업종 분석" },
      { label: "큐플레이스 40평 이탈리안 인테리어 견적" }
    ],
  },

  "pasta-eyo": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "파스타 주방장비",
        descriptionKo: "보일러·소스 워머 — 캐주얼 매장 기준." },
      { iconName: "Box", nameKo: "식자재 보관 냉장",
        descriptionKo: "이탈리안 표준 보관." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 임대 POS." },
      { iconName: "Table2", nameKo: "캐주얼 가구",
        descriptionKo: "저가형 가벼운 이탈리안 톤." },
      { iconName: "Megaphone", nameKo: "파스타예요 BI 간판",
        descriptionKo: "본사 지정 시공." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "파스타예요 저비용 캐주얼 파스타",
      descriptionKo: "초저비용 인테리어 + 캐주얼 분식형 파스타 — 평당 약 66만원 수준.",
      signatureColors: "캐주얼 색상 (구체 미공개)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 700,
    notes: [
      "인테리어 비용 약 660만원 — 동종 업계 평균 대비 매우 낮음",
      "가맹비 약 330만원, 교육비 약 330만원, 보증금 약 200만원, 기타 약 843만원",
      "초저비용 모델 — 매장 면적·집기 사양 매우 제한적",
      "동종 업계 평균 가맹비 1,106만원 대비 1/3 수준",
    ],
    confidence: "medium",
    sources: [
      { label: "frandly.kr 파스타예요 브랜드 정보" },
      { label: "마이프차 파스타예요 비교" }
    ],
  },

  "pasta-ibnida": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "파스타 주방장비",
        descriptionKo: "보일러·화구·소스 워머 (구체 비공개)." },
      { iconName: "Box", nameKo: "냉장·냉동 보관",
        descriptionKo: "이탈리안 식자재 표준 보관." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "본사 표준 POS." },
      { iconName: "Table2", nameKo: "이탈리안 가구",
        descriptionKo: "원목·우드톤 캐주얼 가구." },
      { iconName: "Megaphone", nameKo: "파스타입니다 BI 간판",
        descriptionKo: "본사 지정." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "파스타입니다 캐주얼 이탈리안",
      descriptionKo: "캐주얼 톤 + 합리적 가격 파스타 — 일반 이탈리안 동종 평균.",
      signatureColors: "우드 + 다크그린"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 5000,
    notes: [
      "공개 정보공개서 매우 부족 — 본사 직접 상담 필수",
      "동명·유사명 브랜드 다수 — 정확한 법인명 확인 필요",
      "이탈리안 평당 인테리어 160~250만원 일반 단가 기준 추정",
      "검색 결과에 직접 정보 없음",
    ],
    confidence: "low",
    sources: [
      { label: "BUZA.BIZ 이탈리안 레스토랑 업종 분석" },
      { label: "큐플레이스 식당 인테리어 가이드" }
    ],
  },

  "pasta-jibiya": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "파스타 주방장비",
        descriptionKo: "보일러·화구 (구체 비공개)." },
      { iconName: "Box", nameKo: "냉장·냉동 식자재 보관",
        descriptionKo: "이탈리안 표준." },
      { iconName: "Monitor", nameKo: "POS",
        descriptionKo: "본사 임대 POS." },
      { iconName: "Table2", nameKo: "캐주얼 가구",
        descriptionKo: "원목·우드톤." },
      { iconName: "Megaphone", nameKo: "BI 간판",
        descriptionKo: "본사 지정." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "파스타집이야 캐주얼 이탈리안",
      descriptionKo: "캐주얼 동네 이탈리안 톤 — 합리적 가격 모델.",
      signatureColors: "우드 + 베이지"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4500,
    notes: [
      "정확한 브랜드명 확인 필요 — '파스타집이야' (마이프차 기준 24개 가맹점)일 가능성",
      "총 창업비용 약 8,275만원 (마이프차 '파스타집이야' 기준)",
      "구체적 본사 공급 집기 항목별 비용 비공개 — 정보공개서 직접 확인 필수",
      "가맹점 24개 소규모 브랜드",
    ],
    confidence: "low",
    sources: [
      { label: "마이프차 파스타집이야 (myfranchise.kr/20211561)" },
      { label: "큐플레이스 이탈리안 인테리어 가이드" }
    ],
  },

  "rolling-pasta": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "본사 지정 파스타 주방장비",
        descriptionKo: "더본 표준 보일러·화구·소스 워머." },
      { iconName: "Box", nameKo: "냉장·냉동 보관",
        descriptionKo: "더본 일괄 공급 소스·면 보관." },
      { iconName: "Monitor", nameKo: "POS·키오스크",
        descriptionKo: "더본 통합 POS — 매출·발주 연동." },
      { iconName: "Table2", nameKo: "30~40평 캐주얼 가구",
        descriptionKo: "회전율 중심 4인석 + 일부 2인석 구성." },
      { iconName: "Megaphone", nameKo: "롤링파스타 BI 간판",
        descriptionKo: "5주년 합리적 가격 BI — 본사 지정." },
      { iconName: "Wind", nameKo: "후드·덕트·냉난방기",
        descriptionKo: "점포 여건별 추가 공사 비용 발생." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "롤링파스타 합리적 이탈리안",
      descriptionKo: "캐주얼 우드톤 + 30~40평 표준 + 합리적 가격 파스타·피자 — 더본 대표 브랜드.",
      signatureColors: "우드 + 빨강 + 화이트"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 7000,
    notes: [
      "1층 30평(99㎡) 이상 또는 2층 40평(132㎡) 이상 매장 의무",
      "철거·냉난방·전기·가스·덕트·소방 등 점포 여건별 추가 비용 큼",
      "출점 정책·상권보호 분쟁 사례 보고됨 — 가맹점 보호 조항 사전 확인 필수",
      "더본 식자재(소스·면) 본사 의무 공급",
    ],
    confidence: "medium",
    sources: [
      { label: "더본창업센터 롤링파스타 (start.theborn.co.kr)" },
      { label: "더본코리아 공식 보도자료" },
      { label: "보배드림 점주 호소문 / Threads 보도" }
    ],
  },

  "cleantopia": {
    hqSuppliedItems: [
      { iconName: "Droplets", nameKo: "지르바우(GIRBAU) 상업용 세탁기",
        descriptionKo: "코인워시365 모델 — 본사 독점 수입 스페인 프리미엄, 약 7천만원 상당 본사 임대." },
      { iconName: "Wind", nameKo: "상업용 건조기·콤보",
        descriptionKo: "LG전자 신규 공급 (잠원 메이플자이점 등) — 세탁·건조·콤보 3종 신규 도입." },
      { iconName: "Monitor", nameKo: "무인 키오스크·결제 시스템",
        descriptionKo: "코인워시365 무인 결제·앱 연동 — 본사 임대." },
      { iconName: "Droplets", nameKo: "세제 자동공급 시스템",
        descriptionKo: "본사 지정 세제·유연제 — 점주 별도 구매 불가." },
      { iconName: "Box", nameKo: "세탁물 접수 카운터",
        descriptionKo: "세탁편의점 모델용 — 본사 표준." },
      { iconName: "Megaphone", nameKo: "크린토피아 BI 간판",
        descriptionKo: "1992년부터 시그니처 외장 — 본사 지정." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "크린토피아 세탁편의점·코인워시365",
      descriptionKo: "본사-지사(공장)-대리점 3단 구조 + 무인 24시간 운영 가능 — 한국 1위 세탁 프랜차이즈.",
      signatureColors: "노랑 + 파랑"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 4000,
    notes: [
      "세탁편의점 약 2,000만원, 멀티숍 1억원, 코인워시365 7~8천만원, 복합 멀티숍 1억 2천만원+",
      "기계 임대료 논란 — 기계값의 최대 7배까지 임대료 + 계약 종료시 반납 의무",
      "세제·유연제 본사 의무 구매",
      "본사-지사 공장 발송 구조 — 대리점은 접수만",
    ],
    confidence: "high",
    sources: [
      { label: "크린토피아 공식 (cleantopia.com)" },
      { label: "TTL뉴스 LG전자 크린토피아 상업용 세탁기 공급" },
      { label: "나무위키 크린토피아" },
      { label: "비즈워치 크린토피아 가격 인상 보도" }
    ],
  },

  "washnjoy": {
    hqSuppliedItems: [
      { iconName: "Droplets", nameKo: "본사 공동투자 세탁장비 일체",
        descriptionKo: "20평+ 매장 시 본사가 세탁기·건조기 공동투자 — 점주 부담 경감." },
      { iconName: "Wind", nameKo: "상업용 건조기",
        descriptionKo: "본사 지정 사양 (구체 모델 비공개)." },
      { iconName: "Monitor", nameKo: "무인 키오스크·결제",
        descriptionKo: "24시간 100% 무인 운영 시스템 — 본사 표준." },
      { iconName: "Droplets", nameKo: "세제·유연제 자동공급",
        descriptionKo: "세제·섬유유연제·항균제 자동 투입 — 점주 별도 구매·투입 불필요." },
      { iconName: "Box", nameKo: "벤치·작업대",
        descriptionKo: "세탁물 분류·접기 작업대 표준 사양." },
      { iconName: "Megaphone", nameKo: "워시엔조이 BI 간판",
        descriptionKo: "본사 지정 외장." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "워시엔조이 24시간 셀프 빨래방",
      descriptionKo: "100% 무인 + 세제 자동공급 + 20평 본사 공동투자 — 한국 코인세탁 대표 브랜드.",
      signatureColors: "파랑 + 노랑"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 4000,
    notes: [
      "20평 이상 시 본사 세탁장비 공동투자 — 부담 경감 핵심 강점",
      "세제·유연제·항균제 자동공급 — 점주 별도 구매 불필요",
      "전 임직원 세탁기능사 자격증 보유 — 기술 지원 강점",
      "코인세탁 일반 창업비용 1억~2.5억원 (브랜드별 상이)",
    ],
    confidence: "medium",
    sources: [
      { label: "워시엔조이 공식 (washenjoy.co.kr)" },
      { label: "나무위키 코인 세탁소" },
      { label: "alpha.mindtrip.kr 워시엔조이 vs 크린토피아 비교" }
    ],
  },

  "mr-wash": {
    hqSuppliedItems: [
      { iconName: "Droplets", nameKo: "상업용 세탁기·건조기",
        descriptionKo: "구체 본사 공급 모델 정보 부족 — 일반 코인세탁 표준 사양 추정." },
      { iconName: "Monitor", nameKo: "무인 키오스크·결제",
        descriptionKo: "24시간 무인 운영 시스템." },
      { iconName: "Droplets", nameKo: "세제 자동공급",
        descriptionKo: "일반 코인세탁 표준." },
      { iconName: "Box", nameKo: "분류·접기 작업대",
        descriptionKo: "고객 셀프 작업 공간." },
      { iconName: "Megaphone", nameKo: "BI 간판",
        descriptionKo: "본사 지정 외장." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "미스터워시 코인세탁 매장",
      descriptionKo: "24시간 셀프 빨래방 — 구체 컨셉 정보 부족.",
      signatureColors: "파랑 (추정)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 8000,
    notes: [
      "공개 가맹 정보 매우 부족 — 정확한 법인명·본사 확인 필요",
      "코인세탁 일반 창업비용 7,000만원~2.5억원 (브랜드별 상이)",
      "세탁기·건조기가 비용 비중 최대 — 인테리어 포함 7,000만원+",
      "동명 브랜드 가능성 — 본사 직접 상담 필수",
    ],
    confidence: "low",
    sources: [
      { label: "junsungki.com 코인세탁소 2년차 창업 성적표" },
      { label: "나무위키 코인 세탁소" }
    ],
  },

  "clean-lab": {
    hqSuppliedItems: [
      { iconName: "Droplets", nameKo: "상업용 세탁·드라이 장비",
        descriptionKo: "구체 본사 공급 모델 비공개." },
      { iconName: "Monitor", nameKo: "POS·결제 시스템",
        descriptionKo: "세탁편의점 표준 POS." },
      { iconName: "Box", nameKo: "세탁물 접수·보관 카운터",
        descriptionKo: "세탁편의점 모델 표준." },
      { iconName: "Wind", nameKo: "건조기",
        descriptionKo: "본사 지정 사양." },
      { iconName: "Megaphone", nameKo: "BI 간판",
        descriptionKo: "본사 지정 외장." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "클린랩 / 크린에이드 세탁편의점",
      descriptionKo: "세탁편의점 모델 — 본사 공장 발송 구조.",
      signatureColors: "파랑 + 화이트 (추정)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 6000,
    notes: [
      "크린에이드(clean-aid.co.kr) 가맹은 초기부담금 약 1억 3,102만원 — 가입비 220만원, 교육비 110만원, 기타 1억 2,572만원",
      "'클린랩'(clean-lab) 명확한 가맹 브랜드 정보 매우 부족 — 동명 브랜드 가능성",
      "정확한 법인명·본사 위치 확인 필수",
      "세탁 평균 동종 업계 대비 부담 큰 편",
    ],
    confidence: "low",
    sources: [
      { label: "크린에이드 공식 (clean-aid.co.kr)" },
      { label: "news2day 세탁 프랜차이즈 TOP3 비교" }
    ],
  },

  "seven-star-coin": {
    hqSuppliedItems: [
      { iconName: "Droplets", nameKo: "상업용 세탁기·건조기",
        descriptionKo: "코인세탁 표준 사양 (구체 모델 비공개)." },
      { iconName: "Monitor", nameKo: "무인 키오스크·결제",
        descriptionKo: "24시간 무인 운영." },
      { iconName: "Droplets", nameKo: "세제 자동공급",
        descriptionKo: "코인세탁 표준." },
      { iconName: "Box", nameKo: "셀프 작업대·벤치",
        descriptionKo: "고객 셀프 공간." },
      { iconName: "Megaphone", nameKo: "BI 간판",
        descriptionKo: "본사 지정 외장." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "세븐스타코인워시 셀프 빨래방",
      descriptionKo: "24시간 코인세탁 — 구체 컨셉 정보 부족.",
      signatureColors: "파랑 + 노랑 (추정)"
    },
    flexibility: "moderate",
    estimatedInteriorCostWon: 10000,
    notes: [
      "공개 가맹 정보 매우 부족 — 정확한 법인명·본사 확인 필요",
      "코인세탁 일반 창업비용 1억~2.5억원",
      "동명 브랜드 가능성 — 본사 직접 상담 필수",
      "세탁기·건조기 본사 임대 vs 구매 옵션 사전 확인",
    ],
    confidence: "low",
    sources: [
      { label: "나무위키 코인 세탁소" },
      { label: "junsungki.com 코인세탁소 창업 성적표" }
    ],
  },

  "tutti-cucina": {
    hqSuppliedItems: [
      { iconName: "Flame", nameKo: "화덕 피자 오븐",
        descriptionKo: "뚜띠쿠치나 시그니처 화덕 — 본사 지정 사양." },
      { iconName: "Flame", nameKo: "파스타·리조또 주방장비",
        descriptionKo: "보일러·화구·소스 워머 — 이탈리안 표준." },
      { iconName: "Box", nameKo: "냉장·냉동·식자재 보관",
        descriptionKo: "이탈리안 식자재 보관 표준." },
      { iconName: "Monitor", nameKo: "POS·예약 시스템",
        descriptionKo: "본사 임대 POS." },
      { iconName: "Table2", nameKo: "이탈리안 다이닝 가구",
        descriptionKo: "원목·우드톤 다이닝 가구 — 본사 디자인." },
      { iconName: "Megaphone", nameKo: "뚜띠쿠치나 BI 간판",
        descriptionKo: "이탈리안 시그니처 외장 — 본사 지정." },
    ],
    standardConcept: {
      iconName: "Store",
      nameKo: "뚜띠쿠치나 화덕피자·이탈리안 다이닝",
      descriptionKo: "화덕피자·파스타·리조또·스테이크 통합 — 이탈리안 다이닝 톤.",
      signatureColors: "다크그린 + 우드 + 빨강"
    },
    flexibility: "strict",
    estimatedInteriorCostWon: 8000,
    notes: [
      "가맹문의 1577-4993 — 구체 비용 본사 직접 상담",
      "화덕 오븐 설치 시 후드·덕트·전기 증설 비용 추가 발생",
      "이탈리안 평당 인테리어 160~250만원 (원목·수입 자재 기준)",
      "공개된 정보공개서 정보 부족 — 본사 직접 확인 필수",
    ],
    confidence: "low",
    sources: [
      { label: "뚜띠쿠치나 공식 (tutticucina.net)" },
      { label: "BUZA.BIZ 이탈리안 레스토랑 분석" }
    ],
  },
};
