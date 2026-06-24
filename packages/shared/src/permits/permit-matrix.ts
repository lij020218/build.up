// ─── 업종별 인허가 매트릭스 ──────────────────────────────────────────────────
// Found.One 인허가 사전 확인 단계에서 사용자에게 업종별 필요 인허가를
// 자기완결적으로 안내하기 위한 데이터.
//
// 출처: 정부24, 찾기쉬운 생활법령정보, 한국외식업중앙회, 각 지자체 보건소
// 최종 검증: 2025-03

export type PermitPriority = "required" | "conditional" | "recommended";

export type PermitItem = {
  id: string;
  name: { ko: string; en: string };
  /** 필수 / 조건부(온라인 병행 시 등) / 권장 */
  priority: PermitPriority;
  /** 신청 기관 */
  agency: { ko: string; en: string };
  /** 비용 (원, 0이면 무료) */
  costWon: number;
  /** 비용 설명 */
  costNote?: { ko: string; en: string };
  /** 소요 기간 */
  duration: { ko: string; en: string };
  /** 온라인 신청 URL (있으면) */
  applyUrl?: string;
  /** 필요 서류 */
  documents: Array<{ ko: string; en: string }>;
  /** 절차 요약 (순서대로) */
  steps: Array<{ ko: string; en: string }>;
  /** 주의사항 */
  warnings?: Array<{ ko: string; en: string }>;
};

export type CategoryPermitSet = {
  categoryId: string;
  label: { ko: string; en: string };
  permits: PermitItem[];
};

// ── 공통 인허가 항목 (여러 업종에서 재사용) ─────────────────────────────────

const bizRegistration: PermitItem = {
  id: "biz-registration",
  name: { ko: "사업자등록", en: "Business Registration" },
  priority: "required",
  agency: { ko: "관할 세무서", en: "Local Tax Office" },
  costWon: 0,
  duration: { ko: "즉일~3일", en: "Same day to 3 days" },
  applyUrl: "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml",
  documents: [
    { ko: "임대차계약서 사본", en: "Lease contract copy" },
    { ko: "신분증", en: "ID card" },
    { ko: "사업자등록 신청서", en: "Business registration form" },
  ],
  steps: [
    { ko: "홈택스 또는 관할 세무서 방문", en: "Visit HomeTax online or local tax office" },
    { ko: "사업자등록 신청서 작성 및 제출", en: "Fill and submit registration form" },
    { ko: "사업자등록증 발급 (즉일~3일)", en: "Receive registration certificate (same day~3 days)" },
  ],
  warnings: [
    { ko: "임대차 계약 전에는 신청 불가 — 계약서 필수", en: "Cannot apply without lease — contract required" },
  ],
};

const healthCertificate: PermitItem = {
  id: "health-certificate",
  name: { ko: "건강진단결과서 (보건증)", en: "Health Certificate" },
  priority: "required",
  agency: { ko: "관할 보건소", en: "Local Health Center" },
  costWon: 3000,
  costNote: { ko: "보건소 약 3,000원 (지자체별 무료~3천원) · 민간병원 1.5~3만원", en: "~3,000 won at health center (free~3K by district) · 15~30K at private clinic" },
  duration: { ko: "검사 당일~3일", en: "Same day to 3 days" },
  documents: [
    { ko: "신분증", en: "ID card" },
  ],
  steps: [
    { ko: "관할 보건소 방문 (예약 불필요)", en: "Visit local health center (no reservation)" },
    { ko: "흉부 X-ray, 장티푸스 등 검사", en: "Chest X-ray, typhoid test, etc." },
    { ko: "결과서 수령 (당일~3일 후)", en: "Receive results (same day~3 days)" },
  ],
  warnings: [
    { ko: "유효기간 1년 — 매년 갱신 필요", en: "Valid 1 year — annual renewal required" },
  ],
};

const fireSafety: PermitItem = {
  id: "fire-safety",
  name: { ko: "소방안전교육 이수", en: "Fire Safety Training" },
  priority: "recommended",
  agency: { ko: "한국소방안전원", en: "Korea Fire Safety Institute" },
  costWon: 0,
  duration: { ko: "온라인 2시간", en: "Online 2 hours" },
  applyUrl: "https://www.kfsi.or.kr",
  documents: [],
  steps: [
    { ko: "한국소방안전원 온라인교육 신청", en: "Apply at KFSI online training" },
    { ko: "2시간 온라인 교육 이수", en: "Complete 2-hour online course" },
    { ko: "수료증 출력 보관", en: "Print and keep certificate" },
  ],
};

// ── 업종별 인허가 매트릭스 ──────────────────────────────────────────────────

export const PERMIT_MATRIX: CategoryPermitSet[] = [
  // ── 음식점 ──
  {
    categoryId: "food",
    label: { ko: "음식점", en: "Restaurant" },
    permits: [
      {
        id: "food-hygiene-training",
        name: { ko: "식품위생교육 이수", en: "Food Hygiene Training" },
        priority: "required",
        agency: { ko: "한국외식업중앙회", en: "Korea Foodservice Industry Association" },
        costWon: 26000,
        costNote: { ko: "신규영업자 26,000원 / 기존영업자 8,000원", en: "New business 26K / Existing 8K won" },
        duration: { ko: "온라인 3~6시간", en: "Online 3-6 hours" },
        applyUrl: "https://www.ifoodedu.or.kr",
        documents: [
          { ko: "신분증", en: "ID card" },
        ],
        steps: [
          { ko: "한국외식업중앙회 온라인교육 사이트 접속", en: "Access KFIA online training site" },
          { ko: "신규영업자 과정 수강 (12과목)", en: "Take new business course (12 subjects)" },
          { ko: "퀴즈 60점 이상 합격 → 수료증 발급", en: "Pass quiz 60+ → certificate issued" },
          { ko: "수료증 보관 (영업신고 시 필요)", en: "Keep certificate (needed for business report)" },
        ],
        warnings: [
          { ko: "영업신고 전 반드시 이수 — 미이수 시 신고 불가", en: "Must complete before business report — cannot report without it" },
          { ko: "매년 위생교육 갱신 필수 (기존영업자 과정)", en: "Annual renewal required (existing business course)" },
        ],
      },
      healthCertificate,
      {
        id: "food-business-report",
        name: { ko: "일반음식점 영업신고", en: "Restaurant Business Report" },
        priority: "required",
        agency: { ko: "관할 구청 위생과", en: "District Office Hygiene Dept" },
        costWon: 28000,
        costNote: { ko: "수수료 약 28,000원", en: "Fee ~28,000 won" },
        duration: { ko: "접수 후 7~14일", en: "7-14 days after submission" },
        applyUrl: "https://www.gov.kr/mw/AA020InfoCappView.do?HighCtgCD=A09006&CappBizCD=14600000021",
        documents: [
          { ko: "영업신고서", en: "Business report form" },
          { ko: "식품위생교육 수료증", en: "Hygiene training certificate" },
          { ko: "건강진단결과서 (보건증)", en: "Health certificate" },
          { ko: "영업장 평면도 (주방·객석 구분)", en: "Floor plan (kitchen/dining separated)" },
          { ko: "임대차계약서 사본", en: "Lease contract copy" },
          { ko: "수도시설 사용 증명 (상수도 지역)", en: "Water supply proof" },
        ],
        steps: [
          { ko: "위생교육 이수 + 보건증 발급 완료", en: "Complete hygiene training + health cert" },
          { ko: "정부24 또는 관할 구청 위생과 방문", en: "Visit Gov24 or district hygiene office" },
          { ko: "영업신고서 + 첨부서류 제출", en: "Submit report + attachments" },
          { ko: "현장 점검 (시설 기준 확인)", en: "On-site inspection (facility check)" },
          { ko: "영업신고증 발급", en: "Business report certificate issued" },
        ],
        warnings: [
          { ko: "주방과 객석이 벽·칸막이로 구분되어야 함", en: "Kitchen and dining must be separated by wall/partition" },
          { ko: "환기시설 (후드)·그리스트랩 설치 필수", en: "Ventilation hood and grease trap required" },
          { ko: "건물 용도가 '근린생활시설'이어야 — 사전 확인 필수", en: "Building use must be 'neighborhood facility' — verify first" },
        ],
      },
      bizRegistration,
      fireSafety,
    ],
  },

  // ── 카페·디저트 ──
  {
    categoryId: "cafe-dessert",
    label: { ko: "카페·디저트", en: "Cafe & Dessert" },
    permits: [
      {
        id: "cafe-hygiene-training",
        name: { ko: "식품위생교육 이수 (휴게음식점)", en: "Food Hygiene Training (Snack Bar)" },
        priority: "required",
        agency: { ko: "한국휴게음식업중앙회", en: "Korea Snack Bar Association" },
        costWon: 26000,
        costNote: { ko: "신규영업자 26,000원 (외식업중앙회와 별개 기관)", en: "New business 26K (separate from restaurant association)" },
        duration: { ko: "온라인 3~6시간", en: "Online 3-6 hours" },
        applyUrl: "https://kcraedu.or.kr",
        documents: [{ ko: "신분증", en: "ID card" }],
        steps: [
          { ko: "한국휴게음식업중앙회 온라인교육 접속", en: "Access snack bar association online training" },
          { ko: "신규영업자 과정 수강", en: "Take new business course" },
          { ko: "퀴즈 합격 → 수료증 발급", en: "Pass quiz → certificate issued" },
        ],
        warnings: [
          { ko: "음식점과 교육 기관이 다름 — '휴게음식업중앙회'에서 이수", en: "Different institution from restaurants — take at snack bar association" },
          { ko: "빵·케이크 제조 판매 시 '제과점' 별도 신고 필요할 수 있음", en: "Bakery/cake production may need separate 'bakery' report" },
        ],
      },
      healthCertificate,
      {
        id: "cafe-business-report",
        name: { ko: "휴게음식점 영업신고", en: "Snack Bar Business Report" },
        priority: "required",
        agency: { ko: "관할 구청 위생과", en: "District Office Hygiene Dept" },
        costWon: 28000,
        duration: { ko: "접수 후 7~14일", en: "7-14 days after submission" },
        applyUrl: "https://www.gov.kr",
        documents: [
          { ko: "영업신고서", en: "Business report form" },
          { ko: "위생교육 수료증", en: "Hygiene training certificate" },
          { ko: "건강진단결과서", en: "Health certificate" },
          { ko: "영업장 평면도", en: "Floor plan" },
          { ko: "임대차계약서 사본", en: "Lease contract copy" },
        ],
        steps: [
          { ko: "위생교육 + 보건증 완료", en: "Complete training + health cert" },
          { ko: "구청 위생과 방문 또는 정부24 온라인 신청", en: "Visit district office or apply on Gov24" },
          { ko: "서류 제출 + 시설 점검", en: "Submit docs + facility inspection" },
          { ko: "영업신고증 발급", en: "Certificate issued" },
        ],
        warnings: [
          { ko: "음식점과 달리 조리 공간 분리 기준이 완화됨", en: "Kitchen separation standards are relaxed vs restaurants" },
        ],
      },
      bizRegistration,
      fireSafety,
    ],
  },

  // ── 뷰티 ──
  {
    categoryId: "beauty",
    label: { ko: "뷰티", en: "Beauty" },
    permits: [
      {
        id: "beauty-license",
        name: { ko: "미용사 면허 확인", en: "Beautician License" },
        priority: "required",
        agency: { ko: "시·도지사 (시험: 한국산업인력공단)", en: "Provincial Governor (Exam: HRDKorea)" },
        costWon: 0,
        costNote: { ko: "면허 소지자만 개업 가능 (미용사 국가자격)", en: "Only licensed beauticians can open (national qualification)" },
        duration: { ko: "면허 소지 전제", en: "License prerequisite" },
        applyUrl: "https://www.q-net.or.kr",
        documents: [
          { ko: "미용사 면허증 사본", en: "Beautician license copy" },
        ],
        steps: [
          { ko: "미용사(일반/피부/네일) 국가자격 취득 확인", en: "Confirm beautician qualification (general/skin/nail)" },
          { ko: "면허증 사본 준비", en: "Prepare license copy" },
        ],
        warnings: [
          { ko: "면허 없이 개업 시 불법 — 행정처분 + 벌금", en: "Opening without license is illegal — penalties apply" },
          { ko: "왁싱·속눈썹은 '미용사(일반)' 면허 필요", en: "Waxing/lash requires 'general beautician' license" },
        ],
      },
      {
        id: "beauty-business-report",
        name: { ko: "미용업 신고", en: "Beauty Business Report" },
        priority: "required",
        agency: { ko: "관할 구청 위생과", en: "District Office Hygiene Dept" },
        costWon: 0,
        duration: { ko: "접수 후 3~7일", en: "3-7 days after submission" },
        applyUrl: "https://www.gov.kr",
        documents: [
          { ko: "미용업 신고서", en: "Beauty business report form" },
          { ko: "미용사 면허증 사본", en: "Beautician license copy" },
          { ko: "건강진단결과서", en: "Health certificate" },
          { ko: "영업장 평면도", en: "Floor plan" },
          { ko: "임대차계약서 사본", en: "Lease contract copy" },
        ],
        steps: [
          { ko: "면허 + 보건증 + 임대차계약 준비", en: "Prepare license + health cert + lease" },
          { ko: "구청 위생과 방문 또는 정부24 신청", en: "Visit district office or apply on Gov24" },
          { ko: "미용업 신고증 발급", en: "Beauty report certificate issued" },
        ],
      },
      healthCertificate,
      bizRegistration,
    ],
  },

  // ── 피트니스 ──
  {
    categoryId: "fitness",
    label: { ko: "피트니스", en: "Fitness" },
    permits: [
      {
        id: "fitness-registration",
        name: { ko: "체육시설업 등록/신고", en: "Sports Facility Registration" },
        priority: "required",
        agency: { ko: "관할 구청 체육과", en: "District Office Sports Dept" },
        costWon: 0,
        duration: { ko: "접수 후 7~14일", en: "7-14 days after submission" },
        applyUrl: "https://www.gov.kr",
        documents: [
          { ko: "체육시설업 등록/신고서", en: "Sports facility registration form" },
          { ko: "시설 배치도·평면도", en: "Facility layout plan" },
          { ko: "안전점검 확인서 (소방·전기)", en: "Safety inspection certificate (fire, electrical)" },
          { ko: "임대차계약서 사본", en: "Lease contract copy" },
          { ko: "체육지도자 자격증 (PT 전문)", en: "Sports instructor certificate (for PT)" },
        ],
        steps: [
          { ko: "시설 기준 확인 (면적·장비·환기)", en: "Check facility standards (area, equipment, ventilation)" },
          { ko: "소방 + 전기 안전점검 완료", en: "Complete fire + electrical safety inspection" },
          { ko: "구청 체육과에 등록 신청", en: "Apply to district sports dept" },
          { ko: "현장 점검 후 등록증 발급", en: "On-site inspection → certificate issued" },
        ],
        warnings: [
          { ko: "500㎡ 이상은 '등록', 미만은 '신고' 대상", en: "500㎡+ requires 'registration', below is 'report'" },
          { ko: "PT 전문 시설은 체육지도자 1인 이상 필수", en: "PT facilities require 1+ certified instructor" },
          { ko: "수영장은 별도 위생기준 적용 (수질검사 등)", en: "Swimming pools have separate hygiene standards" },
        ],
      },
      bizRegistration,
      fireSafety,
    ],
  },

  // ── 교육 ──
  {
    categoryId: "education",
    label: { ko: "교육", en: "Education" },
    permits: [
      {
        id: "academy-registration",
        name: { ko: "학원 설립·등록", en: "Academy Registration" },
        priority: "required",
        agency: { ko: "관할 교육청 (구청 교육지원과)", en: "District Education Office" },
        costWon: 0,
        duration: { ko: "접수 후 14~30일", en: "14-30 days after submission" },
        applyUrl: "https://www.gov.kr",
        documents: [
          { ko: "학원설립 등록신청서", en: "Academy registration form" },
          { ko: "교습과정 편성표 (커리큘럼)", en: "Curriculum plan" },
          { ko: "강사 자격증 사본", en: "Instructor qualification copies" },
          { ko: "시설 평면도 (교실·화장실 등)", en: "Facility floor plan" },
          { ko: "소방시설 완비증명 (구청 소방과)", en: "Fire facility certificate" },
          { ko: "임대차계약서 사본", en: "Lease contract copy" },
        ],
        steps: [
          { ko: "교습 과정 및 강사 자격 확인", en: "Verify curriculum and instructor qualifications" },
          { ko: "시설 기준 확인 (면적·방음·화장실)", en: "Check facility standards (area, soundproofing, restroom)" },
          { ko: "소방시설 완비증명 발급 (구청 소방과)", en: "Get fire safety certificate" },
          { ko: "교육청에 등록 신청 + 현장 점검", en: "Apply to education office + site inspection" },
          { ko: "학원 등록증 발급", en: "Academy registration issued" },
        ],
        warnings: [
          { ko: "건물 용도가 '교육연구시설' 또는 '근린생활시설'이어야 함", en: "Building must be zoned for education or neighborhood use" },
          { ko: "1개 교습과목·1인 강사는 '교습소'로 별도 신고", en: "Single subject/instructor may file as 'tutoring center' instead" },
          { ko: "방음 기준 미충족 시 등록 거부 — 사전 확인 필수", en: "Soundproofing failure = registration denied — verify first" },
        ],
      },
      bizRegistration,
      fireSafety,
    ],
  },

  // ── 소매·리테일 ──
  {
    categoryId: "retail",
    label: { ko: "소매", en: "Retail" },
    permits: [
      bizRegistration,
      {
        id: "telecom-sales-report",
        name: { ko: "통신판매업 신고", en: "Online Commerce Report" },
        priority: "conditional",
        agency: { ko: "관할 구청 (또는 공정거래위원회)", en: "District Office (or FTC)" },
        costWon: 0,
        duration: { ko: "접수 후 3~7일", en: "3-7 days after submission" },
        applyUrl: "https://www.ftc.go.kr",
        documents: [
          { ko: "통신판매업 신고서", en: "Online commerce report form" },
          { ko: "사업자등록증 사본", en: "Business registration copy" },
          { ko: "구매안전서비스(에스크로) 이용 확인증", en: "Purchase safety service confirmation" },
        ],
        steps: [
          { ko: "사업자등록 완료 후 신청", en: "Apply after business registration" },
          { ko: "구매안전서비스(에스크로) 가입", en: "Join purchase safety service (escrow)" },
          { ko: "정부24 또는 구청에 신고서 제출", en: "Submit to Gov24 or district office" },
          { ko: "통신판매업 신고증 발급", en: "Online commerce certificate issued" },
        ],
        warnings: [
          { ko: "온라인 판매를 병행할 경우 필수 — 오프라인만이면 불필요", en: "Required if selling online — not needed for offline only" },
        ],
      },
    ],
  },

  // ── 반려동물 ──
  {
    categoryId: "pet",
    label: { ko: "반려동물", en: "Pet" },
    permits: [
      {
        id: "animal-business-registration",
        name: { ko: "동물판매업/미용업/전시업 등록", en: "Animal Business Registration" },
        priority: "required",
        agency: { ko: "관할 시·군·구청 (축산과 또는 동물보호과)", en: "District Office (Livestock or Animal Protection)" },
        costWon: 0,
        duration: { ko: "접수 후 7~14일", en: "7-14 days after submission" },
        applyUrl: "https://www.gov.kr",
        documents: [
          { ko: "동물관련영업 등록신청서", en: "Animal business registration form" },
          { ko: "동물보호 관련 교육 이수증", en: "Animal protection training certificate" },
          { ko: "시설 배치도", en: "Facility layout plan" },
          { ko: "사업자등록증 사본", en: "Business registration copy" },
        ],
        steps: [
          { ko: "동물보호 교육 이수 (온라인 가능)", en: "Complete animal protection training (online OK)" },
          { ko: "시설 기준 확인 (환기·소음·위생)", en: "Check facility standards (ventilation, noise, hygiene)" },
          { ko: "구청에 등록 신청 + 현장 점검", en: "Apply + site inspection" },
          { ko: "등록증 발급", en: "Registration issued" },
        ],
        warnings: [
          { ko: "펫 카페는 '동물전시업', 펫샵은 '동물판매업', 미용은 '동물미용업'으로 구분", en: "Pet cafe = 'animal display', pet shop = 'animal sales', grooming = 'animal grooming'" },
          { ko: "2024년부터 동물보호교육 의무화 강화", en: "Animal protection training requirements strengthened from 2024" },
        ],
      },
      bizRegistration,
    ],
  },

  // ── 공간·숙박 ──
  {
    categoryId: "space",
    label: { ko: "공간·숙박", en: "Space & Accommodation" },
    permits: [
      bizRegistration,
      {
        id: "accommodation-report",
        name: { ko: "숙박업/공유숙박업 신고", en: "Accommodation Business Report" },
        priority: "conditional",
        agency: { ko: "관할 구청 관광과", en: "District Office Tourism Dept" },
        costWon: 0,
        duration: { ko: "접수 후 7~14일", en: "7-14 days after submission" },
        applyUrl: "https://www.gov.kr",
        documents: [
          { ko: "숙박업 신고서", en: "Accommodation report form" },
          { ko: "시설 평면도 + 객실 배치도", en: "Floor plan + room layout" },
          { ko: "소방시설 완비증명", en: "Fire safety certificate" },
          { ko: "임대차계약서 사본", en: "Lease contract copy" },
        ],
        steps: [
          { ko: "시설 기준 확인 (객실·화장실·소방)", en: "Check facility standards" },
          { ko: "소방시설 완비증명 발급", en: "Get fire safety certificate" },
          { ko: "구청 관광과에 신고서 제출", en: "Submit to district tourism dept" },
          { ko: "현장 점검 + 신고증 발급", en: "Site inspection + certificate issued" },
        ],
        warnings: [
          { ko: "게스트하우스/숙박업에만 해당 — 스터디카페·공유오피스는 불필요", en: "Only for accommodation — not needed for study cafe or coworking" },
        ],
      },
      fireSafety,
    ],
  },

  // ── 생활서비스 ──
  {
    categoryId: "living-service",
    label: { ko: "생활서비스", en: "Living Service" },
    permits: [
      bizRegistration,
      {
        id: "cleaning-laundry-report",
        name: { ko: "세탁업 신고", en: "Laundry Business Report" },
        priority: "conditional",
        agency: { ko: "관할 구청 위생과", en: "District Office Hygiene Dept" },
        costWon: 0,
        duration: { ko: "접수 후 3~7일", en: "3-7 days after submission" },
        applyUrl: "https://www.gov.kr",
        documents: [
          { ko: "세탁업 신고서", en: "Laundry report form" },
          { ko: "시설 배치도", en: "Facility layout" },
          { ko: "임대차계약서 사본", en: "Lease contract copy" },
        ],
        steps: [
          { ko: "시설 기준 확인 (배수·환기)", en: "Check standards (drainage, ventilation)" },
          { ko: "구청 위생과에 신고", en: "Report to district hygiene dept" },
          { ko: "신고증 발급", en: "Certificate issued" },
        ],
        warnings: [
          { ko: "무인 코인세탁소도 신고 대상", en: "Unmanned coin laundry also requires reporting" },
        ],
      },
    ],
  },

  // ── 온라인·디지털 ──
  {
    categoryId: "online-digital",
    label: { ko: "온라인·이커머스", en: "Online & E-commerce" },
    permits: [
      bizRegistration,
      {
        id: "telecom-sales-online",
        name: { ko: "통신판매업 신고", en: "Online Commerce Report" },
        priority: "required",
        agency: { ko: "관할 구청", en: "District Office" },
        costWon: 0,
        duration: { ko: "접수 후 3~7일", en: "3-7 days after submission" },
        applyUrl: "https://www.ftc.go.kr",
        documents: [
          { ko: "통신판매업 신고서", en: "Online commerce form" },
          { ko: "사업자등록증 사본", en: "Business registration copy" },
          { ko: "구매안전서비스(에스크로) 이용 확인증", en: "Escrow service confirmation" },
        ],
        steps: [
          { ko: "사업자등록 완료", en: "Complete business registration" },
          { ko: "구매안전서비스 가입 (전자결제대행 계약)", en: "Join escrow/PG service" },
          { ko: "정부24에서 통신판매업 신고", en: "Report on Gov24" },
        ],
        warnings: [
          { ko: "스마트스토어·쿠팡 입점도 통신판매업 신고 필수", en: "Smart Store/Coupang also requires this report" },
        ],
      },
    ],
  },

  // ── startup-tech ──────────────────────────────────────────────────────────
  {
    categoryId: "startup-tech",
    label: { ko: "IT·스타트업", en: "Tech Startup" },
    permits: [
      bizRegistration,
      {
        id: "corporate-registration",
        name: { ko: "법인 설립 등기", en: "Corporation Registration" },
        priority: "recommended",
        agency: { ko: "관할 등기소 (대법원 인터넷등기소)", en: "District Registry Office" },
        costWon: 450_000,
        costNote: { ko: "등록면허세 + 교육세 + 등기수수료 (자본금 규모에 따라 변동)", en: "Registration tax + education tax + filing fee (varies by capital)" },
        duration: { ko: "3~7일 (서류 준비 포함)", en: "3-7 days (including document prep)" },
        applyUrl: "http://www.iros.go.kr",
        documents: [
          { ko: "정관", en: "Articles of incorporation" },
          { ko: "발기인 총회 의사록", en: "Founders' meeting minutes" },
          { ko: "주금납입증명서 (은행)", en: "Capital deposit certificate (bank)" },
          { ko: "대표이사 취임승낙서 + 인감증명서", en: "CEO acceptance letter + seal certificate" },
          { ko: "법인인감도장", en: "Corporate seal" },
        ],
        steps: [
          { ko: "정관 작성 (사업 목적, 자본금, 주식 구조 결정)", en: "Draft articles of incorporation" },
          { ko: "발기인 총회 개최 및 의사록 작성", en: "Hold founders' meeting and record minutes" },
          { ko: "은행에 자본금 납입 → 납입증명서 발급", en: "Deposit capital at bank → get certificate" },
          { ko: "관할 등기소에 법인 설립 등기 신청", en: "File incorporation at district registry" },
          { ko: "법인 사업자등록 (세무서)", en: "Register corporate business (tax office)" },
        ],
        warnings: [
          { ko: "1인 법인도 가능하지만, 공동창업 시 주주간계약서 필수", en: "Solo corp OK, but shareholder agreement required for co-founders" },
          { ko: "법인 설립 후 2주 이내 사업자등록 필요 (지연 시 가산세)", en: "Must register for business within 2 weeks of incorporation (penalty for delay)" },
        ],
      },
      {
        id: "telecom-sales-report",
        name: { ko: "통신판매업 신고", en: "Telecom Sales Report" },
        priority: "conditional",
        agency: { ko: "관할 구청 (지역경제과)", en: "District Office (Local Economy Dept)" },
        costWon: 0,
        duration: { ko: "즉일~3일", en: "Same day to 3 days" },
        applyUrl: "https://www.gov.kr",
        documents: [
          { ko: "사업자등록증 사본", en: "Business registration copy" },
          { ko: "구매안전서비스 이용 확인증 (에스크로/PG)", en: "Purchase safety service confirmation" },
        ],
        steps: [
          { ko: "PG사 또는 에스크로 서비스 가입", en: "Sign up for PG or escrow service" },
          { ko: "정부24에서 통신판매업 신고", en: "Report on Gov24" },
        ],
        warnings: [
          { ko: "유료 SaaS, 앱 결제가 있으면 필수", en: "Required if you have paid SaaS or in-app purchases" },
          { ko: "무료 서비스만 제공하면 불필요", en: "Not required for free-only services" },
        ],
      },
      {
        id: "venture-certification",
        name: { ko: "벤처기업 확인 (벤처인증)", en: "Venture Certification" },
        priority: "recommended",
        agency: { ko: "벤처확인기관 (기보, 중진공 등)", en: "Venture verification agency (KIBO, KOSME, etc.)" },
        costWon: 0,
        costNote: { ko: "신청 무료, 확인서 발급 무료", en: "Application and certificate are free" },
        duration: { ko: "접수 후 15~30일", en: "15-30 days after submission" },
        applyUrl: "https://www.smes.go.kr/venturein",
        documents: [
          { ko: "사업계획서", en: "Business plan" },
          { ko: "재무제표 (창업 초기는 추정 재무제표 가능)", en: "Financial statements (projections OK for early-stage)" },
          { ko: "기술성 증빙 (특허, 소프트웨어 등록증 등)", en: "Tech proof (patents, SW registration, etc.)" },
        ],
        steps: [
          { ko: "벤처인 사이트에서 온라인 신청", en: "Apply online at VentureIn" },
          { ko: "기술성/사업성 평가 (서면 또는 대면)", en: "Tech/business evaluation (written or in-person)" },
          { ko: "벤처기업 확인서 발급", en: "Venture certificate issued" },
        ],
        warnings: [
          { ko: "벤처인증 시 소득세·법인세 50% 감면 (최대 5년), 병역특례 가능", en: "50% tax reduction (up to 5yr), military service exemption eligible" },
          { ko: "기술보증기금 보증 기반이 가장 빠른 경로", en: "KIBO technology guarantee is the fastest path" },
        ],
      },
      {
        id: "privacy-compliance",
        name: { ko: "개인정보 처리방침 수립", en: "Privacy Policy Compliance" },
        priority: "required",
        agency: { ko: "개인정보보호위원회 (자체 수립)", en: "PIPC (self-established)" },
        costWon: 0,
        duration: { ko: "1~3일 (자체 작성)", en: "1-3 days (self-drafted)" },
        applyUrl: "https://www.privacy.go.kr",
        documents: [
          { ko: "개인정보 처리방침 문서", en: "Privacy policy document" },
          { ko: "개인정보 처리 대장 (내부 관리용)", en: "Personal data processing log (internal)" },
        ],
        steps: [
          { ko: "수집하는 개인정보 항목 정리", en: "List all personal data collected" },
          { ko: "개인정보 처리방침 작성 (개인정보보호포털 템플릿 활용)", en: "Draft privacy policy (use PIPC template)" },
          { ko: "서비스 내 공개 게시 (웹사이트/앱)", en: "Publish in service (website/app)" },
        ],
        warnings: [
          { ko: "사용자 1명이라도 개인정보를 수집하면 즉시 의무 발생", en: "Obligation starts from collecting even 1 user's data" },
          { ko: "위반 시 과태료 최대 5천만원", en: "Up to 50M KRW penalty for violations" },
        ],
      },
      {
        id: "sw-registration",
        name: { ko: "소프트웨어 등록 (프로그램 등록)", en: "Software Registration" },
        priority: "recommended",
        agency: { ko: "한국저작권위원회", en: "Korea Copyright Commission" },
        costWon: 0,
        costNote: { ko: "온라인 신청 무료", en: "Free online application" },
        duration: { ko: "접수 후 7~14일", en: "7-14 days after submission" },
        applyUrl: "https://www.cros.or.kr",
        documents: [
          { ko: "프로그램 설명서", en: "Program description" },
          { ko: "소스코드 일부 (30페이지 이상)", en: "Partial source code (30+ pages)" },
        ],
        steps: [
          { ko: "한국저작권위원회 CROS 사이트에서 신청", en: "Apply at CROS website" },
          { ko: "프로그램 설명서 + 소스코드 제출", en: "Submit description + source code" },
          { ko: "등록증 발급", en: "Registration certificate issued" },
        ],
        warnings: [
          { ko: "벤처인증 신청 시 기술성 증빙으로 활용 가능", en: "Can be used as tech proof for venture certification" },
          { ko: "법적 분쟁 시 저작권 입증에 유리", en: "Helpful for proving copyright in legal disputes" },
        ],
      },
    ],
  },
];

// ── 유틸리티 함수 ──────────────────────────────────────────────────────────

/** 업종 카테고리ID로 인허가 목록 조회 */
export function getPermitsForCategory(categoryId: string): CategoryPermitSet | undefined {
  return PERMIT_MATRIX.find((p) => p.categoryId === categoryId);
}

/** 특정 업종의 필수 인허가만 필터 */
export function getRequiredPermits(categoryId: string): PermitItem[] {
  const set = getPermitsForCategory(categoryId);
  if (!set) return [];
  return set.permits.filter((p) => p.priority === "required");
}

/** 총 예상 비용 합산 */
export function getTotalPermitCost(categoryId: string): number {
  const set = getPermitsForCategory(categoryId);
  if (!set) return 0;
  return set.permits
    .filter((p) => p.priority === "required")
    .reduce((sum, p) => sum + p.costWon, 0);
}
