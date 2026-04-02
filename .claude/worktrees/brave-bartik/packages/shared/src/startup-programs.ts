/* ─────────────────────────────────────────────
 *  startup-programs.ts
 *  청년·소상공인 창업 지원 프로그램 데이터
 *  출처: K-Startup, 중소벤처기업부, 아산나눔재단, 각 기관 공식 사이트
 *  데이터 기준: 2026년 3월
 * ───────────────────────────────────────────── */

export type ProgramCategory = "government" | "private" | "local";

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
    season: { ko: "매년 초 공고 (1~3월)", en: "Annual early-year notice (Jan-Mar)" },
    url: "https://www.kised.or.kr/menu.es?mid=a10205010000",
    forSmallBiz: true,
    forFranchise: false,
    highlight: true,
    dataYear: "2026"
  },
  {
    id: "early-startup-package",
    category: "government",
    name: { ko: "초기창업패키지", en: "Early Startup Package" },
    organizer: { ko: "창업진흥원 (중소벤처기업부)", en: "KISED (MSS)" },
    target: { ko: "창업 3년 이내 기업", en: "Companies within 3 years of founding" },
    benefit: { ko: "사업화자금 + 전담 멘토링 + 투자 연계", en: "Biz funds + dedicated mentoring + investment linkage" },
    amount: "일반 최대 1억, 딥테크 최대 1.5억",
    season: { ko: "매년 초 공고", en: "Annual early-year notice" },
    url: "https://www.kised.or.kr/menu.es?mid=a10205020000",
    forSmallBiz: true,
    forFranchise: false,
    highlight: true,
    dataYear: "2026"
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
    dataYear: "2026"
  },
  {
    id: "youth-startup-academy",
    category: "government",
    name: { ko: "청년창업사관학교", en: "Youth Startup Academy" },
    organizer: { ko: "중소벤처기업진흥공단", en: "KOSMES" },
    target: { ko: "만 39세 이하, 창업 3년 이내", en: "Under 39, within 3 years of founding" },
    benefit: { ko: "사무공간 + 교육 + 사업비 패키지 지원", en: "Office space + education + business funds package" },
    amount: "사무공간+교육+사업비 통합",
    season: { ko: "매년 초 공고", en: "Annual early-year notice" },
    url: "https://start.kosmes.or.kr",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026"
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
    dataYear: "2026"
  },
  {
    id: "innovative-sme-support",
    category: "government",
    name: { ko: "혁신 소상공인 창업지원", en: "Innovative SME Startup Support" },
    organizer: { ko: "중소벤처기업부", en: "MSS" },
    target: { ko: "혁신 아이템 보유 소상공인", en: "SMEs with innovative items" },
    benefit: { ko: "브랜딩·시제품·마케팅·리모델링 + 정책자금 연계", en: "Branding, prototyping, marketing, remodeling + policy fund linkage" },
    season: { ko: "매년 초 공고", en: "Annual early-year notice" },
    url: "https://www.bizinfo.go.kr",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026"
  },
  {
    id: "startup-leap-package",
    category: "government",
    name: { ko: "창업도약패키지", en: "Startup Leap Package" },
    organizer: { ko: "창업진흥원", en: "KISED" },
    target: { ko: "창업 3~7년 기업 (매출 정체·모델 한계)", en: "3-7yr companies (revenue plateau)" },
    benefit: { ko: "사업모델 재설계 + 투자 연계 + 스케일업", en: "Biz model redesign + investment + scale-up" },
    season: { ko: "매년 초 공고", en: "Annual early-year notice" },
    url: "https://www.kised.or.kr/menu.es?mid=a10205030000",
    forSmallBiz: true,
    forFranchise: false,
    dataYear: "2026"
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
    dataYear: "2026"
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
    dataYear: "2026"
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
    dataYear: "2026"
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
    dataYear: "2026"
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
    dataYear: "2026"
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
    dataYear: "2026"
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
    dataYear: "2026"
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

/** Category label */
export function getProgramCategoryLabel(cat: ProgramCategory, lang: "ko" | "en"): string {
  if (cat === "government") return lang === "ko" ? "정부 지원" : "Government";
  if (cat === "private") return lang === "ko" ? "민간·재단" : "Private/Foundation";
  return lang === "ko" ? "지자체" : "Local Gov";
}

/** Category color */
export function getProgramCategoryColor(cat: ProgramCategory): string {
  if (cat === "government") return "#007aff";
  if (cat === "private") return "#ff9f0a";
  return "#34c759";
}
