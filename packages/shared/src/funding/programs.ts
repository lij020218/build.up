/**
 * 스타트업 자금 조달 프로그램 — 운영 모드별 분기.
 *
 *  ── 핵심 원칙 ────────────────────────────────────────────────
 *  어떤 모드의 창업자에게도 자금이 필요하다. 다만 "맞는 자금원" 이 다를 뿐.
 *    • 1인 인디: 예비창업패키지·1인 창조기업·공모전·크라우드펀딩 — 인건비 X 가정
 *    • 부트스트랩 (1-3명): 청년창업사관학교·초기창업패키지·소진공 정책자금
 *    • 시드 (3-5명): TIPS·VC 시드·액셀러레이터
 *    • 시리즈A+ (5-10명): VC 시리즈A·글로벌 펀드·후속 라운드
 *  ────────────────────────────────────────────────────────────
 *
 *  모든 데이터는 2026년 4월 기준 한국 공식 출처로 검증:
 *    • K-Startup (k-startup.go.kr) — 정부 통합 포털
 *    • 창업진흥원 (KISED, kised.or.kr) — 예비/초기창업패키지 운영
 *    • 중소벤처기업진흥공단 (KOSME) — 청년창업사관학교
 *    • 도전! K-Startup 통합공고 (challengek.org) — 최대 5억 상금
 *    • 와디즈·텀블벅 — 크라우드펀딩 플랫폼 (누적 거래 1.2조 / 3천억)
 *    • TIPS — 운영사 1-2억 + 정부 R&D 5억 + 사업화 2억
 *    • 더브이씨 (thevc.kr), ZUZU — VC 데이터
 */

import type { OperatingMode } from "../roadmap/clusters";

/** 자금 프로그램 카테고리 */
export type FundingProgramCategory =
  | "government-grant"   // 정부 보조금 (반환 의무 X)
  | "policy-loan"         // 정책 융자 (저금리 대출)
  | "matching-fund"       // 매칭 펀드 (TIPS 등)
  | "vc-investment"       // VC 투자 (지분)
  | "accelerator"         // 액셀러레이터
  | "crowdfunding"        // 크라우드펀딩
  | "competition"         // 공모전·경진대회
  | "facility-support"    // 시설·공간·컨설팅
  | "deeptech";           // 딥테크 특화

export type FundingProgram = {
  /** 프로그램 ID — 고유 식별자 */
  id: string;
  /** 한글 이름 */
  name: string;
  /** 운영 기관 (예: "창업진흥원", "중소벤처기업진흥공단") */
  organizer: string;
  /** 카테고리 */
  category: FundingProgramCategory;
  /** 적합한 운영 모드 (복수 가능) */
  modes: OperatingMode[];
  /** 지원 규모 (한글 라벨) */
  amount: string;
  /** 신청 자격·대상 */
  eligibility: string;
  /** 한 줄 요약 */
  summary: string;
  /** 상세 설명 (검증된 사실) */
  description: string;
  /** 공식 링크 */
  url: string;
  /** 추가 출처 (이중 검증) */
  sources?: Array<{ name: string; url: string }>;
  /** 우선순위 (1-5, 5=강력 추천) */
  priority: 1 | 2 | 3 | 4 | 5;
  /** 마감 시기 (있으면) */
  deadlineNote?: string;
};

/**
 * 검증된 한국 자금 프로그램 데이터베이스 (2026년 4월 기준).
 * 출처: K-Startup, KISED, KOSME, K-Startup 통합공고 (2026), 와디즈, 텀블벅, ZUZU 등.
 */
export const FUNDING_PROGRAMS: FundingProgram[] = [
  // ── 1인·인디 모드 우선 ──────────────────────────────────────
  {
    id: "preliminary-startup-package",
    name: "예비창업패키지",
    organizer: "창업진흥원 (KISED)",
    category: "government-grant",
    modes: ["indie", "bootstrap"],
    amount: "최대 1억원 (평균 5,000만원)",
    eligibility: "사업자등록 전 예비창업자 — 연령 제한 없음 (20대~50대)",
    summary: "사업자등록 전 예비창업자에게 평균 5천만원, 최대 1억원 보조금 (반환 의무 X)",
    description: "사업자등록을 아직 하지 않은 예비창업자 대상. 보조금이라 갚을 필요 없음. 평균 5천만원·최대 1억원 + 사업화·교육·멘토링. K-Startup 사업계획서 평가가 핵심.",
    url: "https://www.k-startup.go.kr/",
    sources: [
      { name: "창업진흥원 공식", url: "https://www.kised.or.kr/menu.es?mid=a10205010000" },
      { name: "예비창업패키지 2026 가이드", url: "https://jiwonfund.kr/%EC%98%88%EB%B9%84%EC%B0%BD%EC%97%85%ED%8C%A8%ED%82%A4%EC%A7%80-2026/" },
    ],
    priority: 5,
    deadlineNote: "2026년 통합공고 일정 확인 (보통 1월~2월 모집)",
  },
  {
    id: "one-person-creative-business-center",
    name: "1인 창조기업 지원센터",
    organizer: "창업진흥원 (KISED)",
    category: "facility-support",
    modes: ["indie", "bootstrap"],
    amount: "사무공간·컨설팅 3년 무료",
    eligibility: "1인 창조기업 (1인 창업자 또는 2명 이내 공동창업)",
    summary: "1인 창조기업 인프라 — 사무공간·컨설팅·판로개척 3년 무료 지원",
    description: "현금 지원 X. 대신 사무공간 + 전문가 컨설팅 + 경영지원 + 판로개척까지 최대 3년 무료. 인건비·임대료 절감 큼. 전국 지역 센터 운영.",
    url: "https://www.kised.or.kr/menu.es?mid=a10203050000",
    sources: [
      { name: "찾기쉬운 생활법령정보", url: "https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1505&ccfNo=2&cciNo=2&cnpClsNo=1" },
    ],
    priority: 4,
  },
  {
    id: "wadiz-reward",
    name: "와디즈 리워드형 크라우드펀딩",
    organizer: "와디즈 (Wadiz)",
    category: "crowdfunding",
    modes: ["indie", "bootstrap"],
    amount: "프로젝트별 자율 (목표액 100만~수억)",
    eligibility: "리워드 (제품·서비스) 제공 가능한 메이커 누구나",
    summary: "검증된 한국 No.1 리워드 크라우드펀딩 — 누적 1.2조원 거래, 7만+ 프로젝트",
    description: "메이커가 서포터에게 제품/서비스를 리워드로 제공. 1인 사업자도 성공 사례 많음 (그릴스유니온 등). 2026년 해외 거래 8배 성장. 청년 협력 프로그램 운영.",
    url: "https://www.wadiz.kr/",
    sources: [
      { name: "와디즈 청년 프로그램", url: "https://www.wadiz.kr/crowd/young" },
    ],
    priority: 4,
  },
  {
    id: "tumblbug",
    name: "텀블벅 (Tumblbug)",
    organizer: "텀블벅",
    category: "crowdfunding",
    modes: ["indie", "bootstrap"],
    amount: "프로젝트별 자율 (누적 3천억+)",
    eligibility: "창작·문화 프로젝트 (책·게임·디자인·예술 등)",
    summary: "창작·문화 중심 크라우드펀딩 — 5만+ 프로젝트 성공",
    description: "와디즈가 아이디어 상품·벤처 기술 위주라면, 텀블벅은 창작 문화 지원 중심. 책·일러스트·보드게임·전시 프로젝트 강함. 1인 창작자에게 적합.",
    url: "https://tumblbug.com/",
    priority: 3,
  },
  {
    id: "challenge-k-startup",
    name: "도전! K-Startup (창업경진대회)",
    organizer: "창업진흥원 + 범부처 협업",
    category: "competition",
    modes: ["indie", "bootstrap", "seed"],
    amount: "최우승팀 최대 5억원 상금",
    eligibility: "혁신창업·학생·국방·여성·기후·관광·IP·국방과학기술·AI·연구자·콘텐츠·스포츠 등",
    summary: "국내 최대 창업경진대회 — 부처별 12개 예선리그, 최대 상금 5억",
    description: "범부처 협업 통합공고. 2026년 1월 통합공고 시작 → 8월까지 부처별 예선. 다양한 분야별 모집 — 인디·1인 창업자도 다수 분야 지원 가능. 우승팀 사업화 지원·언론 노출 큼.",
    url: "https://www.challengek.org/",
    sources: [
      { name: "정책브리핑 2026", url: "https://www.korea.kr/news/policyNewsView.do?newsId=148961590" },
    ],
    priority: 5,
    deadlineNote: "2026년 1월~8월 부처별 예선",
  },

  // ── 부트스트랩 모드 우선 ────────────────────────────────────
  {
    id: "early-startup-package",
    name: "초기창업패키지",
    organizer: "창업진흥원 (KISED)",
    category: "government-grant",
    modes: ["bootstrap", "seed"],
    amount: "최대 1억원 (딥테크 1.5억) / 자기부담 30%",
    eligibility: "사업자등록 후 창업 3년 이내 — 1인 법인·개인사업자 모두",
    summary: "창업 3년 이내 기업용 — 정부 70% 지원, 일반 1억 / 딥테크 1.5억",
    description: "이미 사업자등록한 창업 3년 이내 기업. 자기부담금 30% 부담 후 정부 70% 매칭. 일반형 최대 1억, 딥테크 특화형 최대 1.5억. 해외진출 트랙도 있음.",
    url: "https://www.kised.or.kr/menu.es?mid=a10205020000",
    priority: 5,
    deadlineNote: "2026년 통합공고 (보통 1월~3월 모집)",
  },
  {
    id: "youth-startup-academy",
    name: "청년창업사관학교",
    organizer: "중소벤처기업진흥공단 (KOSME)",
    category: "government-grant",
    modes: ["bootstrap", "seed"],
    amount: "최대 1억원 (사업비 70%)",
    eligibility: "만 39세 이하, 창업 3년 이내 초기 창업자",
    summary: "청년 창업자 패키지 — 850명 선발 (글로벌 330·지역 310·투자형 140), 사업비 + 공간 + 코칭",
    description: "2026년 850명 선발: 글로벌형 330명·지역특화형 310명·투자형 140명. 최대 1억 사업비 (총 사업비 70% 이내). 창업공간 입주 + 코칭 프로그램 + 사무공간 + 교육 + 사업비 패키지.",
    url: "https://start.kosmes.or.kr/",
    sources: [
      { name: "KOSME 공식", url: "https://www.kosmes.or.kr/nsh/SH/SBI/SHSBI035M0.do" },
    ],
    priority: 5,
    deadlineNote: "2026년 1월~2월 모집",
  },
  {
    id: "sojin-policy-loan",
    name: "소상공인진흥공단 정책자금",
    organizer: "소상공인시장진흥공단",
    category: "policy-loan",
    modes: ["bootstrap", "seed"],
    amount: "최대 7천만원 (저금리 2.96%)",
    eligibility: "사업자등록 소상공인 (5인 미만 또는 10인 미만 제조업)",
    summary: "소상공인 저금리 정책자금 — 2.96% (시중은행 대비 압도적)",
    description: "사업자등록 소상공인 대상. 시중은행 대출 5-7% vs 정책자금 2.96%. 운영자금·시설자금 모두 가능. 신청은 정부24 또는 소진공 사이트.",
    url: "https://www.semas.or.kr/",
    priority: 4,
  },

  // ── 시드 모드 ──────────────────────────────────────────────
  {
    id: "tips-program",
    name: "TIPS (Tech Incubator Program for Startup)",
    organizer: "중소벤처기업부 + 운영사 (액셀러레이터)",
    category: "matching-fund",
    modes: ["seed", "seriesA"],
    amount: "운영사 1-2억 + 정부 R&D 5억 + 사업화 2억",
    eligibility: "기술창업 — 운영사로부터 1-2억 시드 투자 받은 기업",
    summary: "기술창업 매칭 펀드 — 운영사 1-2억 → 정부 7억 추가 매칭",
    description: "민간 액셀러레이터(운영사)가 1-2억 시드 투자 → 정부가 R&D 5억 + 사업화·해외마케팅 2억 추가 매칭. 총 8-9억 패키지. 2024년 기준 463개 액셀러레이터 활동 중.",
    url: "https://www.jointips.or.kr/",
    sources: [
      { name: "한국 액셀러레이터 현황 — ZUZU", url: "https://zuzu.network/resource/blog/korea-accelerator/" },
    ],
    priority: 5,
  },
  {
    id: "seed-vc",
    name: "시드 VC 라운드",
    organizer: "민간 VC·액셀러레이터",
    category: "vc-investment",
    modes: ["seed", "seriesA"],
    amount: "5억 ~ 20억 (산업별 차이)",
    eligibility: "MVP·초기 매출·검증된 시장 — 통상 시드 라운드",
    summary: "한국 시드 라운드 5-20억 — 2026년 시드 비중 29.6% (전체 라운드)",
    description: "2026년 2월 기준 시드 비중 29.6% (시리즈A 14.8%). 통상 액셀러레이터 + 시드 펀드 + 엔젤. 463개 한국 액셀러레이터 활동 중. 더브이씨 (thevc.kr) 에서 데이터 검색.",
    url: "https://thevc.kr/",
    sources: [
      { name: "스타트업레시피 투자 분석", url: "https://startuprecipe.co.kr/archives/5808011" },
      { name: "ZUZU 투자 라운드 가이드", url: "https://zuzu.network/resource/guide/investment-round/" },
    ],
    priority: 4,
  },

  // ── 시리즈A+ 모드 ──────────────────────────────────────────
  {
    id: "series-a",
    name: "시리즈 A 라운드",
    organizer: "민간 VC",
    category: "vc-investment",
    modes: ["seriesA"],
    amount: "30억 ~ 100억+ (딥테크 100-900억)",
    eligibility: "PMF 검증·매출 성장·확장 가능 단위경제",
    summary: "본격 성장 자금 — 일반 30-100억 / 딥테크 100억-900억대 (반도체 등)",
    description: "PMF 검증 + 단위경제 입증된 기업. 일반 SaaS 30-100억, 반도체 (디노티시아 900억·BOS 870억), 로보틱스·바이오 100-500억대. 평균 21개월 런웨이 확보 표준.",
    url: "https://thevc.kr/",
    sources: [
      { name: "ZUZU 런웨이 분석", url: "https://zuzu.network/resource/blog/runway-extension/" },
      { name: "한국 액셀러레이터 분석", url: "https://zuzu.network/resource/blog/korea-accelerator/" },
    ],
    priority: 5,
  },

  // ── 딥테크 특화 (모든 모드) ────────────────────────────────
  {
    id: "deeptech-special-package",
    name: "딥테크 특화 초기창업패키지",
    organizer: "창업진흥원 (KISED)",
    category: "deeptech",
    modes: ["bootstrap", "seed", "seriesA"],
    amount: "최대 1.5억원 (딥테크 트랙)",
    eligibility: "딥테크 분야 (AI·반도체·로보틱스·바이오·클린테크) 창업 3년 이내",
    summary: "딥테크 특화 — 일반 트랙 1억 → 딥테크 1.5억 상향",
    description: "초기창업패키지 일반 1억 → 딥테크 트랙 1.5억. 정부 7.45조 국가성장펀드 + 슈퍼-갭 12개 미래산업 우선 배정. 자기부담 30%.",
    url: "https://www.kised.or.kr/menu.es?mid=a10205020000",
    priority: 5,
  },
  {
    id: "super-gap-startup",
    name: "슈퍼-갭 스타트업 프로젝트",
    organizer: "중소벤처기업부",
    category: "deeptech",
    modes: ["seed", "seriesA"],
    amount: "120개 기업 선발",
    eligibility: "AI·반도체·핵융합·로보틱스 등 12개 미래산업 분야",
    summary: "딥테크 12개 미래산업 — 120개 기업 선발 (2026)",
    description: "AI·반도체·핵융합 에너지·로보틱스 등 12개 미래산업 고성장 스타트업 120개 발굴·지원. KDB 7.45조 국가성장펀드와 연계.",
    url: "https://www.k-startup.go.kr/",
    sources: [
      { name: "KoreaTechDesk 슈퍼-갭", url: "https://koreatechdesk.com/super-gap-startup-2026-korea-annoucement" },
    ],
    priority: 5,
  },
];

/**
 * 운영 모드 + 클러스터에 맞는 자금 프로그램 필터링·랭킹.
 *
 *  - mode 매치 필수
 *  - cluster 가 deeptech 면 deeptech 카테고리 우선
 *  - priority 내림차순으로 정렬
 */
export function getProgramsForMode(
  mode: OperatingMode,
  options?: { isDeeptech?: boolean; limit?: number },
): FundingProgram[] {
  const filtered = FUNDING_PROGRAMS.filter((p) => p.modes.includes(mode));
  const sorted = filtered.sort((a, b) => {
    // deeptech 클러스터면 deeptech 카테고리 우선
    if (options?.isDeeptech) {
      const aDeep = a.category === "deeptech" ? 1 : 0;
      const bDeep = b.category === "deeptech" ? 1 : 0;
      if (aDeep !== bDeep) return bDeep - aDeep;
    }
    return b.priority - a.priority;
  });
  return options?.limit ? sorted.slice(0, options.limit) : sorted;
}

/** 모드별 추천 프로그램 수 — 너무 많으면 결정 마비 */
export const RECOMMENDED_PROGRAM_COUNT_BY_MODE: Record<OperatingMode, number> = {
  indie: 5,
  bootstrap: 6,
  seed: 5,
  seriesA: 4,
};
