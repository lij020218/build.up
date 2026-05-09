/* ─────────────────────────────────────────────
 *  startup-programs.ts
 *  청년·소상공인 창업 지원 프로그램 데이터
 *  출처: K-Startup, 중소벤처기업부, 아산나눔재단, 각 기관 공식 사이트
 *  데이터 기준: 2026년 3월
 * ───────────────────────────────────────────── */

export type ProgramCategory = "government" | "private" | "local" | "corporate" | "competition";

export type ApplicationStatus = "open" | "upcoming" | "closed";

export type StartupProgram = {
  id: string;
  category: ProgramCategory;
  name: { ko: string; en: string };
  organizer: { ko: string; en: string };
  target: { ko: string; en: string };
  benefit: { ko: string; en: string };
  amount?: string;
  season: { ko: string; en: string };
  url: string;
  /** 소상공인/자영업에 특히 적합한지 */
  forSmallBiz: boolean;
  /** 프랜차이즈 창업에도 해당되는지 */
  forFranchise: boolean;
  highlight?: boolean;
  dataYear: string;
  /** 최대 나이 제한 (null = 무제한) */
  maxAge?: number;
  /** 사업 연차 범위 [min, max] (null = 무제한) */
  businessYearRange?: [number, number];
  /** 해당 업종 (null = 전 업종) */
  industries?: string[];
  /** 지역 제한 (null = 전국) */
  regions?: string[];
  /** 모집 상태 */
  applicationStatus?: ApplicationStatus;
  /** 필요 서류 */
  requiredDocs?: { ko: string; en: string }[];
  /**
   * 신청 마감일 (ISO YYYY-MM-DD). 알려진 마감일이 있을 때만 채움.
   * 채워진 경우 D-N 알림 + 우선순위 배지에 사용.
   */
  applicationDeadline?: string;
  /**
   * 자금 성격 — 매칭 시 사장님 *현금 위기* 상황과 연결.
   *  - "cash"   : 운영자금/정책자금 (위기 시 최우선)
   *  - "equity" : 투자 (성장기 우선)
   *  - "grant"  : 보조금 (반환 X)
   *  - "credit" : 보증/대출
   *  - "other"  : 기타
   */
  fundingType?: "cash" | "equity" | "grant" | "credit" | "other";
};

export type MatchCriteria = {
  startupType?: string;
  industryCategoryId?: string;
  age?: number;
  businessYears?: number;
  region?: string;
  capital?: number;
  businessStage?: "idea" | "pre-startup" | "early" | "growth" | "established";
  /**
   * 사장님 *현재 상황* — 매칭 점수에 직접 반영.
   *  - 런웨이 < 6개월 / 매출 -15% 이상 하락 → 위기형 → 운영자금·정책자금 부스트
   *  - 런웨이 < 3개월 → 긴급 위기 → 응급 자금 최상위
   */
  runwayMonths?: number;
  weeklySalesChangePct?: number;
  /**
   * 직원 수 — 일부 프로그램은 인력 규모 조건 (예: 5인 이상 사업자만).
   */
  employeesCount?: number;
};

export type ProgramMatchResult = {
  program: StartupProgram;
  matchScore: number;
  eligible: boolean;
  matchReasons: string[];
  ineligibleReasons: string[];
  daysUntilDeadline?: number;
};

export const startupPrograms: StartupProgram[] = [
  // ── Government ──
  {
    id: "pre-startup-package",
    category: "government",
    name: { ko: "예비창업패키지", en: "Pre-Startup Package" },
    organizer: { ko: "창업진흥원 (중소벤처기업부)", en: "KISED (MSS)" },
    target: { ko: "혁신 기술 아이디어를 가진 예비창업자", en: "Pre-founders with innovative tech ideas" },
    benefit: { ko: "시제품 제작, 마케팅, 지식재산권 등 사업화자금 + 멘토링", en: "Prototyping, marketing, IP registration + mentoring" },
    amount: "최대 8,000만원",
    season: { ko: "매년 초 공고 (1~3월), 2026 접수: 3/6~3/26 마감", en: "Annual early-year (Jan-Mar), 2026 deadline: Mar 26" },
    url: "https://www.kised.or.kr/menu.es?mid=a10205010000",
    forSmallBiz: true,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    businessYearRange: [0, 0],
    applicationStatus: "closed",
    fundingType: "grant",
    applicationDeadline: "2026-03-26",
    requiredDocs: [{ ko: "사업계획서", en: "Business plan" }, { ko: "신분증", en: "ID" }],
  },
  {
    id: "early-startup-package",
    category: "government",
    name: { ko: "초기창업패키지", en: "Early Startup Package" },
    organizer: { ko: "창업진흥원 (중소벤처기업부)", en: "KISED (MSS)" },
    target: { ko: "창업 3년 이내 기업", en: "Companies within 3 years of founding" },
    benefit: { ko: "사업화자금 + 전담 멘토링 + 투자 연계", en: "Biz funds + dedicated mentoring + investment linkage" },
    amount: "일반 최대 1억, 딥테크 최대 1.5억",
    season: { ko: "매년 초 공고, 2026 일반형 접수: 1/23~2/13 마감", en: "Annual early-year, 2026 deadline: Feb 13" },
    url: "https://www.kised.or.kr/menu.es?mid=a10205020000",
    forSmallBiz: true,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    businessYearRange: [0, 3],
    applicationStatus: "closed",
    fundingType: "grant",
    applicationDeadline: "2026-02-13",
    requiredDocs: [{ ko: "사업계획서", en: "Business plan" }, { ko: "사업자등록증", en: "Business registration" }],
  },
  {
    id: "youth-startup-fund",
    category: "government",
    name: { ko: "청년전용 창업자금", en: "Youth Startup Fund" },
    organizer: { ko: "중소벤처기업진흥공단", en: "KOSMES" },
    target: { ko: "만 39세 이하, 업력 3년 미만", en: "Under 39, less than 3 years in business" },
    benefit: { ko: "저금리 융자 (연 2.5% 고정금리)", en: "Low-interest loan (2.5% fixed)" },
    amount: "최대 1억원 (제조업 2억)",
    season: { ko: "상시 신청", en: "Year-round applications" },
    url: "https://start.kosmes.or.kr",
    forSmallBiz: true,
    forFranchise: true,
    highlight: true,
    dataYear: "2026",
    maxAge: 39,
    businessYearRange: [0, 3],
    applicationStatus: "open",
    fundingType: "cash",
    requiredDocs: [{ ko: "사업계획서", en: "Business plan" }, { ko: "사업자등록증", en: "Business registration" }, { ko: "신분증", en: "ID" }],
  },
  {
    id: "youth-startup-academy",
    category: "government",
    name: { ko: "청년창업사관학교", en: "Youth Startup Academy" },
    organizer: { ko: "중소벤처기업진흥공단", en: "KOSMES" },
    target: { ko: "만 39세 이하, 창업 3년 이내", en: "Under 39, within 3 years of founding" },
    benefit: { ko: "사무공간 + 교육 + 사업비 최대 1억원", en: "Office space + education + up to 100M KRW biz funds" },
    amount: "사업비 최대 1억원 (총사업비 70%)",
    season: { ko: "매년 2월 공고, 4월 선정, 2026 접수 마감", en: "Annual Feb notice, Apr selection, 2026 closed" },
    url: "https://start.kosmes.or.kr",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026",
    maxAge: 39,
    businessYearRange: [0, 3],
    applicationStatus: "closed",
    fundingType: "grant",
    applicationDeadline: "2026-02-13",
  },
  {
    id: "sme-policy-fund",
    category: "government",
    name: { ko: "소상공인 정책자금", en: "SME Policy Fund" },
    organizer: { ko: "소상공인시장진흥공단", en: "SEMAS" },
    target: { ko: "소상공인 요건 충족 사업자", en: "Registered small business owners" },
    benefit: { ko: "저금리 융자 (운전·시설자금)", en: "Low-interest loan (working capital & facilities)" },
    amount: "운전 최대 5억, 시설 포함 최대 10억",
    season: { ko: "상시 신청 (연 초 공고)", en: "Year-round (annual notice)" },
    url: "https://www.semas.or.kr/web/SUP01/SUP0103/SUP010301.kmdc",
    forSmallBiz: true,
    forFranchise: true,
    dataYear: "2026",
    applicationStatus: "open",
    fundingType: "cash",
    requiredDocs: [{ ko: "사업계획서", en: "Business plan" }, { ko: "사업자등록증", en: "Business registration" }, { ko: "소상공인확인서", en: "SME certificate" }],
  },
  {
    id: "innovative-sme-support",
    category: "government",
    name: { ko: "혁신 소상공인 창업지원", en: "Innovative SME Startup Support" },
    organizer: { ko: "중소벤처기업부", en: "MSS" },
    target: { ko: "혁신 아이템 보유 소상공인", en: "SMEs with innovative items" },
    benefit: { ko: "브랜딩·시제품·마케팅·리모델링 + 정책자금 연계", en: "Branding, prototyping, marketing, remodeling + policy fund linkage" },
    season: { ko: "매년 초 공고, 2026 접수 마감", en: "Annual early-year, 2026 closed" },
    url: "https://www.bizinfo.go.kr",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026",
    applicationStatus: "closed",
    fundingType: "grant",
  },
  {
    id: "startup-leap-package",
    category: "government",
    name: { ko: "창업도약패키지", en: "Startup Leap Package" },
    organizer: { ko: "창업진흥원", en: "KISED" },
    target: { ko: "창업 3~7년 기업 (매출 정체·모델 한계)", en: "3-7yr companies (revenue plateau)" },
    benefit: { ko: "사업모델 재설계 + 투자 연계 + 스케일업", en: "Biz model redesign + investment + scale-up" },
    season: { ko: "매년 초 공고, 2026 접수 마감", en: "Annual early-year, 2026 closed" },
    url: "https://www.kised.or.kr/menu.es?mid=a10205030000",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026",
    businessYearRange: [3, 7],
    applicationStatus: "closed",
    fundingType: "grant",
  },

  // ── Private (Foundation / Accelerator) ──
  {
    id: "asan-doers",
    category: "private",
    name: { ko: "아산 두어스", en: "Asan Doers" },
    organizer: { ko: "아산나눔재단", en: "Asan Nanum Foundation" },
    target: { ko: "만 19~29세 예비창업가 (법인 미설립)", en: "Ages 19-29, pre-incorporation" },
    benefit: { ko: "해외 진출 지원금 100만원 + 7개월 인큐베이팅 + 멘토링 + MARU 네트워크", en: "1M KRW overseas fund + 7-month incubation + mentoring + MARU network" },
    amount: "1인 100만원 + 멘토링",
    season: { ko: "연 1~2회 모집 (3~4월)", en: "1-2 batches/year (Mar-Apr)" },
    url: "https://doers.asan-nanum.org",
    forSmallBiz: false,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    maxAge: 29,
    businessYearRange: [0, 0],
    applicationStatus: "upcoming",
  },
  {
    id: "jjy-competition",
    category: "private",
    name: { ko: "정주영 창업경진대회", en: "Chung Ju-yung Startup Competition" },
    organizer: { ko: "아산나눔재단", en: "Asan Nanum Foundation" },
    target: { ko: "전 연령 (글로벌·다양성·기후테크·예비창업 4개 트랙)", en: "All ages (4 tracks: Global, Diversity, ClimateTech, Pre-startup)" },
    benefit: { ko: "총 상금 4억원 + 멘토링 + 해외진출 + MARU 입주 + 투자 연계", en: "4B KRW prize + mentoring + overseas + MARU + investment" },
    amount: "총 상금 4억원",
    season: { ko: "상반기 모집, 하반기 데모데이", en: "H1 recruitment, H2 demo day" },
    url: "https://asan-nanum.org/program/startup/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    fundingType: "grant",
    applicationDeadline: "2026-05-30",
  },
  {
    id: "sparklabs-batch",
    category: "private",
    name: { ko: "스파크랩 배치 프로그램", en: "SparkLabs Batch Program" },
    organizer: { ko: "스파크랩", en: "SparkLabs" },
    target: { ko: "초기 스타트업 (글로벌 진출 의향)", en: "Early startups (global ambition)" },
    benefit: { ko: "22주 1:1 맞춤 코칭 + 데모데이 + 투자 연계 + 글로벌 네트워크", en: "22-week 1:1 coaching + demo day + investment + global network" },
    season: { ko: "연 2회 배치", en: "2 batches/year" },
    url: "https://sparklabs.co.kr/kr/program",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    fundingType: "equity",
  },
  {
    id: "bluepoint-demo",
    category: "private",
    name: { ko: "블루포인트 데모데이", en: "BluePoint Demo Day" },
    organizer: { ko: "블루포인트파트너스", en: "BluePoint Partners" },
    target: { ko: "딥테크·초기 스타트업", en: "DeepTech & early startups" },
    benefit: { ko: "시드 투자 + 국내 최대 규모 데모데이 + 멘토링", en: "Seed investment + Korea's largest demo day + mentoring" },
    season: { ko: "연 1~2회", en: "1-2 times/year" },
    url: "https://www.bluepoint.ac",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    fundingType: "equity",
  },
  {
    id: "samsung-clab",
    category: "private",
    name: { ko: "삼성 C-Lab Outside", en: "Samsung C-Lab Outside" },
    organizer: { ko: "삼성전자 / 삼성금융네트웍스", en: "Samsung Electronics / Samsung Financial" },
    target: { ko: "혁신 기술 보유 스타트업 (AI·핀테크·업무효율화)", en: "Tech startups (AI, FinTech, efficiency)" },
    benefit: { ko: "PoC 지원금 최대 4,000만원 + 시상금 1,000만원 + CES 출품 + 삼성 협업·투자 검토", en: "Up to 40M PoC fund + 10M prize + CES support + Samsung collaboration/investment" },
    amount: "최대 5,000만원",
    season: { ko: "연 1회 (3~4월 모집)", en: "Annual (Mar-Apr recruitment)" },
    url: "https://samsungfnstartup.com",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026"
  },
  {
    id: "dcamp-dday",
    category: "private",
    name: { ko: "D.CAMP 디데이 (D.DAY)", en: "D.CAMP D.DAY" },
    organizer: { ko: "은행권청년창업재단", en: "Banks Youth Startup Foundation" },
    target: { ko: "초기 스타트업 (매월 선발)", en: "Early startups (monthly selection)" },
    benefit: { ko: "월간 피칭 대회 + 투자 연계 + 디캠프/프론트원 입주 기회 (최대 1년)", en: "Monthly pitch + investment linkage + D.CAMP/FRONT1 residency (up to 1yr)" },
    season: { ko: "매월 진행", en: "Monthly" },
    url: "https://dcamp.kr/dday",
    forSmallBiz: false,
    forFranchise: false,
    highlight: true,
    dataYear: "2026"
  },
  {
    id: "naver-d2sf",
    category: "private",
    name: { ko: "네이버 D2SF", en: "NAVER D2SF" },
    organizer: { ko: "네이버", en: "NAVER" },
    target: { ko: "기술 기반 초기 스타트업 (AI·로보틱스·데이터)", en: "Tech-based early startups (AI, robotics, data)" },
    benefit: { ko: "기술개발 자금 1,000만원 (지분 희석 없음) + GPU·클라우드 + 네이버 멘토링 + 캠퍼스 공모전", en: "10M dev fund (no dilution) + GPU/cloud + NAVER mentoring + campus competition" },
    amount: "1,000만원 (지분 희석 없음)",
    season: { ko: "캠퍼스 공모전 연 1회 (5월), 투자는 상시", en: "Campus competition annual (May), investment year-round" },
    url: "https://d2startup.com/ko",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    fundingType: "equity",
  },
  {
    id: "hyundai-cmk",
    category: "private",
    name: { ko: "CMK 임팩트프러너 (구 H-온드림)", en: "CMK Impactpreneur (fmr H-OnDream)" },
    organizer: { ko: "현대차 정몽구 재단", en: "Hyundai CMK Foundation" },
    target: { ko: "사회문제 해결 임팩트 스타트업", en: "Social impact startups" },
    benefit: { ko: "사업화 자금 + 멘토링 + UNDP 글로벌 프로그램 연계 + 투자", en: "Biz funds + mentoring + UNDP global linkage + investment" },
    season: { ko: "연 1회 모집 (상반기)", en: "Annual recruitment (H1)" },
    url: "https://www.h-ondream.kr",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026"
  },
  {
    id: "sk-lookie",
    category: "private",
    name: { ko: "SK LOOKIE", en: "SK LOOKIE" },
    organizer: { ko: "SK 행복나눔재단", en: "SK Happiness Foundation" },
    target: { ko: "대학생 소셜 이노베이터 (비즈니스 모델로 사회문제 해결)", en: "University social innovators (solving social problems via biz models)" },
    benefit: { ko: "소셜 비즈니스 모델 개발 + 멘토링 + 네트워크 (2017년~ 1,000명+ 양성)", en: "Social biz model dev + mentoring + network (1,000+ alumni since 2017)" },
    season: { ko: "연 1회 모집", en: "Annual recruitment" },
    url: "https://www.sklookie.com",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026"
  },
  {
    id: "primer-batch",
    category: "private",
    name: { ko: "프라이머 배치", en: "Primer Batch" },
    organizer: { ko: "프라이머 (국내 최초 액셀러레이터)", en: "Primer (Korea's first accelerator)" },
    target: { ko: "초기 스타트업 (선호도 1위 액셀러레이터)", en: "Early startups (#1 preferred accelerator)" },
    benefit: { ko: "시드 투자 + 멘토링 + 네트워킹 + 데모데이", en: "Seed investment + mentoring + networking + demo day" },
    season: { ko: "연 2회 배치", en: "2 batches/year" },
    url: "https://www.primer.kr",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    fundingType: "equity",
  },

  // ── Local Government (Seoul / Regional) ──
  {
    id: "seoul-startup-hub",
    category: "local",
    name: { ko: "서울창업허브", en: "Seoul Startup Hub" },
    organizer: { ko: "서울산업진흥원 (SBA)", en: "Seoul Business Agency (SBA)" },
    target: { ko: "서울 소재 (예비)창업자", en: "Seoul-based (pre-)founders" },
    benefit: { ko: "사무공간 6개월~1년 무상 + 창업 프로그램 + 네트워킹", en: "Free office 6-12mo + programs + networking" },
    season: { ko: "연 1~2회 공고 (3월, 9월)", en: "1-2 notices/year (Mar, Sep)" },
    url: "https://seoulstartuphub.com",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026",
    regions: ["서울"],
    applicationStatus: "upcoming",
  },
  {
    id: "campus-town",
    category: "local",
    name: { ko: "캠퍼스타운", en: "Campus Town" },
    organizer: { ko: "서울시", en: "Seoul Metropolitan Government" },
    target: { ko: "만 39세 이하, 창업 7년 미만 (신산업 10년)", en: "Under 39, less than 7yr (10yr for new industries)" },
    benefit: { ko: "창업활동비 최대 2,500만원 + 대학 인근 사무공간 최대 4년 입주", en: "Up to 25M activity fund + 4yr office near university" },
    amount: "최대 2,500만원",
    season: { ko: "매년 초 공고", en: "Annual early-year notice" },
    url: "https://youth.seoul.go.kr",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026"
  },
  {
    id: "seoul-youth-cook",
    category: "local",
    name: { ko: "서울 청년쿡 비즈니스센터", en: "Seoul Youth Cook Business Center" },
    organizer: { ko: "서울시", en: "Seoul Metropolitan Government" },
    target: { ko: "외식업 청년 창업자", en: "Young F&B entrepreneurs" },
    benefit: { ko: "공유주방 + 외식 창업 교육 + 인큐베이팅", en: "Shared kitchen + F&B startup education + incubation" },
    season: { ko: "수시 모집", en: "Rolling recruitment" },
    url: "https://youth.seoul.go.kr/content.do?key=2310100028",
    forSmallBiz: true,
    forFranchise: false,
    highlight: true,
    dataYear: "2026"
  },
  {
    id: "k-startup-portal",
    category: "government",
    name: { ko: "K-Startup 창업지원포털 (통합 검색)", en: "K-Startup Portal (Search All)" },
    organizer: { ko: "중소벤처기업부", en: "MSS" },
    target: { ko: "모든 (예비)창업자 — 단계·분야별 사업 검색", en: "All founders — search by stage & field" },
    benefit: { ko: "전국 모든 정부·지자체 창업지원사업 통합 검색 + 신청", en: "Search & apply for all government startup support programs" },
    season: { ko: "상시", en: "Always open" },
    url: "https://www.k-startup.go.kr",
    forSmallBiz: true,
    forFranchise: true,
    dataYear: "2026"
  },

  // ═══════════════════════════════════════════════════════════════
  // 공모전·경진대회 (Competition) — 상금 큰 정부·민간 대회
  // ═══════════════════════════════════════════════════════════════
  {
    id: "challenge-k-startup-2026",
    category: "competition",
    name: { ko: "올해의 K-스타트업 2026 (구 도전! K-스타트업)", en: "K-Startup of the Year 2026" },
    organizer: { ko: "중소벤처기업부 + 9개 부처 공동", en: "MSS + 8 ministries" },
    target: { ko: "예비창업자 + 7년 이내 창업기업 — 분야별 12개 리그", en: "Pre-founders + 7-yr companies, 12 leagues" },
    benefit: { ko: "대상 5억(대통령상), 최우수상 1억, 우수상 5천만원, 부처 장관상 다수", en: "Grand 500M KRW + Presidential Award" },
    amount: "최대 5억원 (총 상금 11억+)",
    season: { ko: "예선 3-6월, 본선 9-10월, 왕중왕전 11월", en: "Prelim Mar-Jun, Final Sep-Nov" },
    url: "https://www.challengek.org/",
    forSmallBiz: true,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    businessYearRange: [0, 7],
    applicationStatus: "open",
    requiredDocs: [
      { ko: "사업계획서 + 발표자료", en: "Business plan + pitch deck" },
      { ko: "사업자등록증 (해당시)", en: "Business registration (if any)" },
    ],
  },
  {
    id: "modoo-startup-2026",
    category: "government",
    name: { ko: "모두의 창업 프로젝트 2026", en: "Modoo Startup Project 2026" },
    organizer: { ko: "중소벤처기업부 + 창업진흥원", en: "MSS + KISED" },
    target: { ko: "예비창업자 + 7년 이내 창업기업 (5,000명 모집)", en: "Pre-founders + 7-yr companies (5,000 selected)" },
    benefit: { ko: "사업화 자금 + 글로벌 진출 + 멘토링 + 투자 연계", en: "Biz funds + global expansion + mentoring + investment" },
    amount: "최대 10억원 (단계별 차등)",
    season: { ko: "2026 1Q 통합 공고, 2-5월 신청", en: "Integrated launch 2026 Q1" },
    url: "https://www.k-startup.go.kr",
    forSmallBiz: true,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    businessYearRange: [0, 7],
    applicationStatus: "open",
  },
  {
    id: "kaist-deeptech-competition",
    category: "competition",
    name: { ko: "KAIST 딥테크 창업경진대회", en: "KAIST DeepTech Startup Competition" },
    organizer: { ko: "KAIST 창업원", en: "KAIST StartUp" },
    target: { ko: "딥테크·과학기술 기반 (예비)창업자", en: "DeepTech/Science-based pre-founders" },
    benefit: { ko: "상금 + KAIST 인큐베이팅 + 멘토링", en: "Prize + KAIST incubation + mentoring" },
    amount: "최대 1억원",
    season: { ko: "매년 봄 (3-4월 마감)", en: "Annual spring (Mar-Apr deadline)" },
    url: "https://startup.kaist.ac.kr/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "upcoming",
  },
  {
    id: "postech-gssc",
    category: "competition",
    name: { ko: "POSTECH 글로벌 학생 창업 경진대회 (GSSC)", en: "POSTECH Global Student Startup Competition" },
    organizer: { ko: "포스텍 창업지원팀", en: "POSTECH Startup Team" },
    target: { ko: "국내·해외 대학생 창업팀 (서울대·이화여대·POSTECH·하버드·UC버클리 등)", en: "Korean & global university student teams" },
    benefit: { ko: "상금 + 글로벌 액셀러레이팅 + 해외 데모데이", en: "Prize + global acceleration + overseas demo day" },
    amount: "최대 5천만원",
    season: { ko: "매년 1-2월 모집", en: "Annual Jan-Feb" },
    url: "https://startup.postech.ac.kr/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    maxAge: 35,
    applicationStatus: "upcoming",
  },
  {
    id: "naver-ai-hackathon",
    category: "competition",
    name: { ko: "네이버 AI 해커톤", en: "NAVER AI Hackathon" },
    organizer: { ko: "네이버 클라우드", en: "NAVER Cloud" },
    target: { ko: "AI·머신러닝 개발자·연구자", en: "AI/ML developers & researchers" },
    benefit: { ko: "상금 1천만원 + 네이버 클라우드 크레딧 1억원 + 입사 기회", en: "10M KRW prize + 100M cloud credits + job offers" },
    amount: "총 상금·크레딧 1.1억원",
    season: { ko: "매년 하반기 (8-10월)", en: "Annual H2 (Aug-Oct)" },
    url: "https://github.com/naver/ai-hackathon",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "upcoming",
  },
  {
    id: "snowflake-hackathon-2026",
    category: "competition",
    name: { ko: "Snowflake 해커톤 2026 Korea", en: "Snowflake Hackathon 2026 Korea" },
    organizer: { ko: "Snowflake Korea", en: "Snowflake Korea" },
    target: { ko: "데이터·AI 활용 솔루션 개발자·창업자", en: "Data/AI solution developers & founders" },
    benefit: { ko: "상금 + Snowflake 글로벌 네트워킹", en: "Prize + Snowflake global networking" },
    season: { ko: "2026 신청 3/17~4/5, 결선 4/29 (강남)", en: "Reg Mar 17 - Apr 5, Final Apr 29 (Gangnam)" },
    url: "https://www.snowflake.com/snowflake-hackathon-2026-korea/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "closed",
  },
  {
    id: "k-digital-hackathon",
    category: "competition",
    name: { ko: "K-디지털 트레이닝 해커톤", en: "K-Digital Training Hackathon" },
    organizer: { ko: "고용노동부 + 한국산업인력공단", en: "MOEL + HRDK" },
    target: { ko: "K-디지털 트레이닝 수료생·디지털 인재", en: "K-Digital Training graduates & digital talents" },
    benefit: { ko: "상금 + 채용 연계 + 현업 멘토링", en: "Prize + hiring + mentoring" },
    season: { ko: "매년 하반기", en: "Annual H2" },
    url: "http://www.k-digitalhackathon.kr/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    applicationStatus: "upcoming",
  },

  // ═══════════════════════════════════════════════════════════════
  // 대기업 액셀러레이터 (Corporate)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "lg-nova",
    category: "corporate",
    name: { ko: "LG NOVA (LG 글로벌 이노베이션 센터)", en: "LG NOVA" },
    organizer: { ko: "LG", en: "LG" },
    target: { ko: "헬스케어·청정테크·AI·스마트라이프 분야 글로벌 스타트업", en: "Healthcare, cleantech, AI, smart-life startups" },
    benefit: { ko: "투자 + LG 사업부 협업 + 글로벌 시장 진출 지원", en: "Investment + LG biz unit collab + global expansion" },
    amount: "투자 규모: 시드~시리즈A",
    season: { ko: "상시 검토 + 연 2회 코호트 모집", en: "Always reviewing + 2 cohorts/year" },
    url: "https://www.lgnova.com/",
    forSmallBiz: false,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "open",
  },
  {
    id: "lg-superstart-rookie",
    category: "corporate",
    name: { ko: "LG 슈퍼스타트 루키 프로그램", en: "LG SuperStart Rookie Program" },
    organizer: { ko: "LG", en: "LG" },
    target: { ko: "서울대·POSTECH·한양대 등 대학 창업팀", en: "University student teams (SNU, POSTECH, Hanyang etc)" },
    benefit: { ko: "LG 사이언스파크 인큐베이팅 + 멘토링 + 투자 검토", en: "LG Science Park incubation + mentoring + investment review" },
    season: { ko: "연 1회 (4월 슈퍼스타트 데이)", en: "Annual (April SuperStart Day)" },
    url: "https://www.lgnova.com/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    maxAge: 35,
    industries: ["startup-tech"],
    applicationStatus: "upcoming",
  },
  {
    id: "kakao-impact",
    category: "corporate",
    name: { ko: "카카오임팩트 (소셜·임팩트 액셀러레이팅)", en: "Kakao Impact" },
    organizer: { ko: "카카오재단", en: "Kakao Foundation" },
    target: { ko: "사회 문제 해결 임팩트 스타트업 (교육·환경·접근성)", en: "Social impact startups" },
    benefit: { ko: "투자·기부 + 카카오 플랫폼 노출 + 멘토링", en: "Investment/grant + Kakao platform exposure + mentoring" },
    season: { ko: "연 1-2회 코호트", en: "1-2 cohorts/year" },
    url: "https://www.kakaoimpact.org/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    applicationStatus: "open",
  },
  {
    id: "toss-incubating",
    category: "corporate",
    name: { ko: "토스 인큐베이팅 (Toss Lab)", en: "Toss Incubating" },
    organizer: { ko: "비바리퍼블리카 (Toss)", en: "Viva Republica (Toss)" },
    target: { ko: "핀테크·금융 인프라 분야 (예비)창업자", en: "Fintech & financial infra founders" },
    benefit: { ko: "투자 + 토스 인프라·고객 연계 + 멘토링", en: "Investment + Toss infra/customer + mentoring" },
    season: { ko: "상시", en: "Always open" },
    url: "https://toss.im/career",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "open",
  },
  {
    id: "hyundai-zer01ne",
    category: "corporate",
    name: { ko: "현대차 ZER01NE (제로원)", en: "Hyundai ZER01NE" },
    organizer: { ko: "현대자동차그룹", en: "Hyundai Motor Group" },
    target: { ko: "모빌리티·로보틱스·에너지·스마트시티 분야 창업자", en: "Mobility, robotics, energy, smart city founders" },
    benefit: { ko: "투자 + 현대차 사업부 PoC + 멘토링", en: "Investment + Hyundai PoC + mentoring" },
    amount: "투자 + PoC 자금",
    season: { ko: "연 1-2회 코호트", en: "1-2 cohorts/year" },
    url: "https://www.zer01ne.com/",
    forSmallBiz: false,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "open",
  },
  {
    id: "hanwha-dreamplus",
    category: "corporate",
    name: { ko: "한화 드림플러스", en: "Hanwha DreamPlus" },
    organizer: { ko: "한화", en: "Hanwha" },
    target: { ko: "광역 분야 시드~시리즈A 스타트업", en: "Broad-field seed to Series A" },
    benefit: { ko: "투자 + 강남·여의도 사무공간 + 멘토링", en: "Investment + Gangnam/Yeouido space + mentoring" },
    season: { ko: "상시", en: "Always open" },
    url: "https://dreamplus.asia/ko",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    applicationStatus: "open",
  },
  {
    id: "kb-starters",
    category: "corporate",
    name: { ko: "KB 스타터스", en: "KB Starters" },
    organizer: { ko: "KB금융그룹", en: "KB Financial Group" },
    target: { ko: "핀테크·금융 혁신 (예비)창업자", en: "Fintech & financial innovation founders" },
    benefit: { ko: "투자 + KB 데이터·고객 연계 + 멘토링", en: "Investment + KB data/customer + mentoring" },
    season: { ko: "연 2회 모집", en: "2 cohorts/year" },
    url: "https://www.kbfg.com/kbresearch/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "upcoming",
  },
  {
    id: "shinhan-sol",
    category: "corporate",
    name: { ko: "신한 SOL 인큐베이팅", en: "Shinhan SOL Incubating" },
    organizer: { ko: "신한금융그룹", en: "Shinhan Financial Group" },
    target: { ko: "핀테크·디지털금융 (예비)창업자", en: "Fintech & digital finance founders" },
    benefit: { ko: "투자 + 신한 인프라·고객 연계", en: "Investment + Shinhan infra/customer" },
    season: { ko: "연 1-2회", en: "1-2 cohorts/year" },
    url: "https://www.shinhanfutureslab.com/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "upcoming",
  },
  {
    id: "sk-truelnnovation",
    category: "corporate",
    name: { ko: "SK 트루이노베이션", en: "SK True Innovation" },
    organizer: { ko: "SK 텔레콤", en: "SK Telecom" },
    target: { ko: "ICT·AI·통신 인프라 활용 창업자", en: "ICT/AI/telecom-leveraging founders" },
    benefit: { ko: "투자 + SK 인프라 PoC + 글로벌 진출", en: "Investment + SK infra PoC + global expansion" },
    season: { ko: "연 1-2회 모집", en: "1-2 cohorts/year" },
    url: "https://truinnovation.sktelecom.com/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "upcoming",
  },

  // ═══════════════════════════════════════════════════════════════
  // VC (Private — 본격 투자)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "altos-ventures",
    category: "private",
    name: { ko: "알토스벤처스 (Altos Ventures)", en: "Altos Ventures" },
    organizer: { ko: "Altos Ventures", en: "Altos Ventures" },
    target: { ko: "한국 시리즈A~C 스타트업 (메가 라운드)", en: "Korean Series A-C startups (mega rounds)" },
    benefit: { ko: "$3M~$50M 투자 + 글로벌 네트워크 + 미국 진출", en: "$3-50M + global network + US expansion" },
    amount: "Series A-C ($3M~$50M)",
    season: { ko: "상시 검토 — IR 데크 직접 컨택 권장", en: "Always — direct IR pitch recommended" },
    url: "https://www.altos.vc/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "open",
    fundingType: "equity",
  },
  {
    id: "bon-angels",
    category: "private",
    name: { ko: "본엔젤스 (Bon Angels)", en: "Bon Angels Venture Partners" },
    organizer: { ko: "Bon Angels", en: "Bon Angels" },
    target: { ko: "시드~시리즈A 한국 스타트업", en: "Korean seed to Series A" },
    benefit: { ko: "1억~30억 투자 + 멘토링 + 후속 라운드 연계", en: "100M-3B KRW + mentoring + follow-on" },
    amount: "Seed-Series A (1억-30억)",
    season: { ko: "상시 검토", en: "Always reviewing" },
    url: "https://bonangels.net/",
    forSmallBiz: false,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    applicationStatus: "open",
    fundingType: "equity",
  },
  {
    id: "kakao-ventures",
    category: "private",
    name: { ko: "카카오벤처스 (Kakao Ventures)", en: "Kakao Ventures" },
    organizer: { ko: "Kakao Ventures (CVC)", en: "Kakao Ventures (CVC)" },
    target: { ko: "초기 단계 한국 스타트업 (특히 카카오 시너지)", en: "Early-stage Korean startups (Kakao synergy)" },
    benefit: { ko: "시드~시리즈A 투자 + 카카오 생태계 연계", en: "Seed-Series A + Kakao ecosystem" },
    amount: "Seed-Series A (5억-50억)",
    season: { ko: "상시", en: "Always" },
    url: "https://www.kakao.vc/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    applicationStatus: "open",
    fundingType: "equity",
  },
  {
    id: "mashup-angels",
    category: "private",
    name: { ko: "매쉬업엔젤스 (Mashup Angels)", en: "Mashup Angels" },
    organizer: { ko: "Mashup Angels", en: "Mashup Angels" },
    target: { ko: "초기 단계 (시드) 한국 스타트업 — 30+개 포트폴리오", en: "Early seed Korean startups, 30+ portfolio" },
    benefit: { ko: "1억-5억 시드 투자 + 멘토링", en: "100M-500M KRW seed + mentoring" },
    amount: "Seed (1억-5억)",
    season: { ko: "상시", en: "Always" },
    url: "https://mashupangels.com/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    applicationStatus: "open",
    fundingType: "equity",
  },
  {
    id: "softbank-ventures-asia",
    category: "private",
    name: { ko: "소프트뱅크 벤처스 아시아", en: "SoftBank Ventures Asia" },
    organizer: { ko: "SoftBank Ventures Asia", en: "SoftBank Ventures Asia" },
    target: { ko: "시리즈A~C 한국·아시아 스타트업", en: "Korea & Asia Series A-C" },
    benefit: { ko: "대규모 투자 + 글로벌 네트워크 + 일본·아시아 진출", en: "Mega investment + global network + Japan/Asia entry" },
    amount: "Series A-C (10억-100억+)",
    season: { ko: "상시", en: "Always" },
    url: "https://www.sbva.com/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    applicationStatus: "open",
    fundingType: "equity",
  },
  {
    id: "futureplay",
    category: "private",
    name: { ko: "퓨처플레이 (FuturePlay)", en: "FuturePlay" },
    organizer: { ko: "FuturePlay", en: "FuturePlay" },
    target: { ko: "Tech·AI·블록체인 초기 스타트업", en: "Tech/AI/Blockchain early-stage" },
    benefit: { ko: "시드 투자 + 인큐베이팅 + 코파운더 매칭", en: "Seed + incubation + co-founder matching" },
    season: { ko: "상시", en: "Always" },
    url: "https://www.futureplay.co/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "open",
    fundingType: "equity",
  },

  // ═══════════════════════════════════════════════════════════════
  // 글로벌 (한국 신청 가능)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "google-startups-korea",
    category: "private",
    name: { ko: "Google for Startups Accelerator: Korea", en: "Google for Startups Accelerator: Korea" },
    organizer: { ko: "Google for Startups", en: "Google for Startups" },
    target: { ko: "Seed~Series A 단계 한국 AI 스타트업", en: "Korean AI startups (Seed-Series A)" },
    benefit: { ko: "구글 클라우드·AI 도구 + 멘토링 + 글로벌 네트워크", en: "Google Cloud/AI tools + mentoring + global network" },
    season: { ko: "연 1회 코호트 (모집 공고 시 신청)", en: "Annual cohort" },
    url: "https://startup.google.com/intl/ko_ALL/programs/accelerator/korea/",
    forSmallBiz: false,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "upcoming",
  },
  {
    id: "y-combinator",
    category: "private",
    name: { ko: "Y Combinator (YC)", en: "Y Combinator" },
    organizer: { ko: "Y Combinator", en: "Y Combinator" },
    target: { ko: "글로벌 초기 스타트업 — 한국 출신 다수 합격", en: "Global early-stage startups (many Korean alumni)" },
    benefit: { ko: "$500k 투자 + YC 멘토 + 글로벌 데모데이 + 동문 네트워크", en: "$500k + YC mentors + Demo Day + alumni" },
    amount: "$500,000 (지분 7%)",
    season: { ko: "Winter (겨울 1월), Summer (여름 6월) 배치", en: "Winter (Jan), Summer (Jun) batches" },
    url: "https://www.ycombinator.com/apply",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    industries: ["startup-tech"],
    applicationStatus: "open",
    fundingType: "equity",
    applicationDeadline: "2026-09-30",
  },
  {
    id: "antler-korea",
    category: "private",
    name: { ko: "Antler Korea", en: "Antler Korea" },
    organizer: { ko: "Antler", en: "Antler" },
    target: { ko: "예비창업자·1인 창업자 — 코파운더 매칭 + 시드 투자", en: "Pre-founders/solo founders — co-founder match + seed" },
    benefit: { ko: "10주 인큐베이션 + 시드 투자 + 글로벌 네트워크", en: "10-week residency + seed + global network" },
    amount: "$100k+ 시드",
    season: { ko: "연 2회 코호트", en: "2 cohorts/year" },
    url: "https://www.antler.co/locations/seoul",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    applicationStatus: "open",
  },

  // ═══════════════════════════════════════════════════════════════
  // 추가 정부·특수 (사회적·여성·재기·R&D)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "social-entrepreneur-academy",
    category: "government",
    name: { ko: "사회적기업가 육성사업", en: "Social Entrepreneur Incubation" },
    organizer: { ko: "한국사회적기업진흥원 (고용노동부)", en: "KoSEA (MOEL)" },
    target: { ko: "사회·환경 문제 해결 (예비)사회적기업가", en: "Social/env problem-solving social entrepreneurs" },
    benefit: { ko: "사업화 자금 + 멘토링 + 사회적기업 인증 연계", en: "Biz funds + mentoring + social enterprise cert" },
    amount: "최대 5천만원",
    season: { ko: "매년 1-2월 모집", en: "Annual Jan-Feb" },
    url: "http://www.sestartup.or.kr/",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    businessYearRange: [0, 0],
    applicationStatus: "upcoming",
  },
  {
    id: "tips-program",
    category: "government",
    name: { ko: "TIPS (Tech Incubator Program)", en: "TIPS Program" },
    organizer: { ko: "중소벤처기업부", en: "MSS" },
    target: { ko: "민간 운영사 매칭 + R&D 정부 매칭 — 시리즈A 직전 기술기업", en: "Tech companies pre-Series A (private + R&D matching)" },
    benefit: { ko: "최대 9억원 R&D + 5억원 사업화 + 멘토링", en: "Up to 900M R&D + 500M biz + mentoring" },
    amount: "최대 14억원",
    season: { ko: "운영사별 상시 모집", en: "Always (per operator)" },
    url: "https://www.jointips.or.kr/",
    forSmallBiz: false,
    forFranchise: false,
    highlight: true,
    dataYear: "2026",
    businessYearRange: [0, 7],
    industries: ["startup-tech"],
    applicationStatus: "open",
    fundingType: "equity",
  },
  {
    id: "global-acceleration-gmep",
    category: "government",
    name: { ko: "글로벌 액셀러레이팅 (GMEP)", en: "Global Acceleration (GMEP)" },
    organizer: { ko: "창업진흥원", en: "KISED" },
    target: { ko: "해외진출 희망 7년 이내 창업기업", en: "7-yr companies seeking overseas expansion" },
    benefit: { ko: "분야별 특화 액셀러레이팅 + 법인설립·투자유치 멘토링", en: "Field-specific acceleration + legal/IR mentoring" },
    season: { ko: "매년 상반기 모집", en: "Annual H1" },
    url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000116762",
    forSmallBiz: false,
    forFranchise: false,
    dataYear: "2026",
    businessYearRange: [0, 7],
    applicationStatus: "upcoming",
  },
  {
    id: "ktng-sangsangmadang-eco",
    category: "competition",
    name: { ko: "KT&G 상상마당 친환경 화장품 창업 공모전", en: "KT&G Eco-Cosmetics Startup Competition" },
    organizer: { ko: "KT&G 상상마당", en: "KT&G Sangsangmadang" },
    target: { ko: "친환경·지속가능 화장품·뷰티 (예비)창업자", en: "Eco/sustainable cosmetics & beauty founders" },
    benefit: { ko: "상금 + 멘토링 + KT&G 채널 노출", en: "Prize + mentoring + KT&G channel exposure" },
    season: { ko: "매년 봄", en: "Annual spring" },
    url: "https://sangsangmadang.com/",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026",
    industries: ["beauty"],
    applicationStatus: "upcoming",
  },
  {
    id: "seoul-women-startup",
    category: "local",
    name: { ko: "서울여성 창업아이디어 공모전", en: "Seoul Women Startup Idea Competition" },
    organizer: { ko: "서울시", en: "Seoul Metropolitan Government" },
    target: { ko: "서울 거주 여성 (예비)창업자", en: "Seoul-resident women founders" },
    benefit: { ko: "상금 + 서울창업허브 입주 우선권 + 멘토링", en: "Prize + Seoul Startup Hub priority + mentoring" },
    season: { ko: "매년 여름", en: "Annual summer" },
    url: "https://www.seoulwoman.or.kr/",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026",
    regions: ["서울"],
    applicationStatus: "upcoming",
    fundingType: "grant",
    applicationDeadline: "2026-07-15",
  },
];

/** Get programs filtered by category */
export function getProgramsByCategory(cat: ProgramCategory): StartupProgram[] {
  return startupPrograms.filter(p => p.category === cat);
}

/** Get highlighted programs (for home surface) */
export function getHighlightedPrograms(): StartupProgram[] {
  return startupPrograms.filter(p => p.highlight);
}

/** Get programs relevant to small business / self-employed */
export function getSmallBizPrograms(): StartupProgram[] {
  return startupPrograms.filter(p => p.forSmallBiz);
}

/** Get programs matched to user profile — franchise-relevant first, then smallBiz */
export function getMatchedPrograms(startupType?: string): StartupProgram[] {
  const isFranchise = startupType === "franchise";
  return [...startupPrograms].sort((a, b) => {
    // Franchise users: forFranchise items first
    if (isFranchise) {
      if (a.forFranchise && !b.forFranchise) return -1;
      if (!a.forFranchise && b.forFranchise) return 1;
    }
    // Then highlight items
    if (a.highlight && !b.highlight) return -1;
    if (!a.highlight && b.highlight) return 1;
    return 0;
  });
}

/** Get highlighted programs matched to profile */
export function getMatchedHighlights(startupType?: string): StartupProgram[] {
  const isFranchise = startupType === "franchise";
  const all = startupPrograms.filter(p => p.highlight);
  if (!isFranchise) return all;
  // For franchise: include forFranchise programs even if not highlighted
  const franchiseRelevant = startupPrograms.filter(p => p.forFranchise && !p.highlight);
  return [...all, ...franchiseRelevant.slice(0, 2)].slice(0, 6);
}

/**
 * Enhanced program matching with situation-aware scoring.
 *
 *  ── 점수 가중치 (요지) ──────────────────────────────
 *  • 자격 미달 (eligible = false) → 정렬 맨 뒤
 *  • 위기 상황 (런웨이 < 6개월 / 매출 -15% 이상 하락) → 운영자금·cash 프로그램 +30~50
 *  • 마감 임박 (D-7 이내) → +25, D-3 이내 → +50
 *  • 업종·지역·연차 매칭 → 기본 +10~15
 *  • highlight / 모집 중 → 일반 부스트
 *  ─────────────────────────────────────────
 */
export function getMatchedProgramsV2(criteria: MatchCriteria): (StartupProgram & { matchScore: number; eligible: boolean; daysUntilDeadline?: number })[] {
  const isFranchise = criteria.startupType === "franchise";
  // 위기 신호 — 런웨이 부족 + 매출 하락. 둘 중 하나만 강해도 위기로 분류.
  const isCashCrisis = (criteria.runwayMonths != null && criteria.runwayMonths < 6) ||
                       (criteria.weeklySalesChangePct != null && criteria.weeklySalesChangePct <= -15);
  const isUrgentCrisis = (criteria.runwayMonths != null && criteria.runwayMonths < 3);

  const today = new Date();

  return startupPrograms.map(p => {
    let score = 0;
    let eligible = true;

    // ── 기본 자격 체크 ──
    if (p.maxAge && criteria.age && criteria.age > p.maxAge) eligible = false;
    else if (p.maxAge && criteria.age && criteria.age <= p.maxAge) score += 15;

    if (p.businessYearRange && criteria.businessYears !== undefined) {
      const [min, max] = p.businessYearRange;
      if (criteria.businessYears < min || criteria.businessYears > max) eligible = false;
      else score += 15;
    }

    // ── 매칭 ──
    if (isFranchise && p.forFranchise) score += 10;
    if (isFranchise && !p.forFranchise && !p.forSmallBiz) score -= 5;
    if (p.forSmallBiz) score += 10;

    if (p.regions && criteria.region) {
      if (p.regions.some(r => criteria.region!.includes(r))) score += 10;
      else score -= 3;
    }
    if (p.industries && criteria.industryCategoryId) {
      if (p.industries.includes(criteria.industryCategoryId)) score += 10;
    }

    // ── 모집 상태 ──
    if (p.applicationStatus === "open") score += 20;
    else if (p.applicationStatus === "upcoming") score += 5;
    else if (p.applicationStatus === "closed") score -= 10;

    if (p.highlight) score += 5;

    // ── 위기 상황 부스트 — 사장님 현금 위기 시 cash 자금 최상위로 ──
    if (isCashCrisis && p.fundingType === "cash") score += 30;
    if (isUrgentCrisis && p.fundingType === "cash") score += 20; // 누적 +50
    // 위기 시 보증·대출 (단기 현금 확보 가능) 도 약하게 부스트
    if (isCashCrisis && p.fundingType === "credit") score += 15;
    // 위기 아닐 땐 투자(equity) 부스트 — 성장 모드
    if (!isCashCrisis && p.fundingType === "equity" && (criteria.businessStage === "growth" || criteria.businessStage === "early")) {
      score += 15;
    }

    // ── 마감 임박 부스트 — D-7 이내면 화면 상단 노출 ──
    let daysUntilDeadline: number | undefined;
    if (p.applicationDeadline) {
      const deadlineMs = new Date(p.applicationDeadline).getTime();
      daysUntilDeadline = Math.ceil((deadlineMs - today.getTime()) / 86_400_000);
      if (daysUntilDeadline >= 0 && daysUntilDeadline <= 3) score += 50;
      else if (daysUntilDeadline > 3 && daysUntilDeadline <= 7) score += 25;
      else if (daysUntilDeadline > 7 && daysUntilDeadline <= 14) score += 10;
      else if (daysUntilDeadline < 0) score -= 30; // 마감 지남
    }

    return { ...p, matchScore: score, eligible, daysUntilDeadline };
  })
  .sort((a, b) => {
    // 자격 보유 우선
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    // 마감 임박 (양수, D-7 이내) 최우선
    const aDeadlineUrgent = a.daysUntilDeadline != null && a.daysUntilDeadline >= 0 && a.daysUntilDeadline <= 7;
    const bDeadlineUrgent = b.daysUntilDeadline != null && b.daysUntilDeadline >= 0 && b.daysUntilDeadline <= 7;
    if (aDeadlineUrgent && !bDeadlineUrgent) return -1;
    if (!aDeadlineUrgent && bDeadlineUrgent) return 1;
    // 모집 상태
    const statusOrder = { open: 0, upcoming: 1, closed: 2 };
    const aStatus = statusOrder[a.applicationStatus ?? "upcoming"] ?? 1;
    const bStatus = statusOrder[b.applicationStatus ?? "upcoming"] ?? 1;
    if (aStatus !== bStatus) return aStatus - bStatus;
    // 점수
    return b.matchScore - a.matchScore;
  });
}

/** Get application status label */
export function getApplicationStatusLabel(status: ApplicationStatus | undefined, lang: "ko" | "en"): { label: string; color: string } {
  if (status === "open") return { label: lang === "ko" ? "신청 가능" : "Open", color: "#34c759" };
  if (status === "closed") return { label: lang === "ko" ? "마감" : "Closed", color: "#8e8e93" };
  return { label: lang === "ko" ? "공고 예정" : "Upcoming", color: "#ff9f0a" };
}

/** Category label */
export function getProgramCategoryLabel(cat: ProgramCategory, lang: "ko" | "en"): string {
  if (cat === "government") return lang === "ko" ? "정부 지원" : "Government";
  if (cat === "private") return lang === "ko" ? "민간·재단" : "Private/Foundation";
  if (cat === "corporate") return lang === "ko" ? "대기업" : "Corporate";
  if (cat === "competition") return lang === "ko" ? "대회·경진대회" : "Competition";
  return lang === "ko" ? "지자체" : "Local Gov";
}

/** Category color */
export function getProgramCategoryColor(cat: ProgramCategory): string {
  if (cat === "government") return "#007aff";
  if (cat === "private") return "#ff9f0a";
  if (cat === "corporate") return "#5856d6";
  if (cat === "competition") return "#ff2d55";
  return "#34c759";
}
