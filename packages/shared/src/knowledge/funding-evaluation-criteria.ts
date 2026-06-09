/* ─────────────────────────────────────────────────────────────────
 *  funding-evaluation-criteria.ts
 *
 *  한국 정부지원사업·정책자금 평가 기준 SSOT (2026 기준).
 *
 *  출처 (2026-05-10 web research):
 *   - 창업진흥원 PSST 평가 표준 (예비창업·초기창업·청창사 공통)
 *   - TIPS 운영지침 2026 (가점 3→5점 확대, 지속가능·기술인증 신설)
 *   - 소상공인진흥공단 정책자금 융자계획 (NCB 839/919 기준)
 *   - 합격 사업계획서 100개 분석 (2026 — PoC 검증 + 매출 준비도)
 *   - 합격/탈락 키워드 TOP 10 AI 분석
 *
 *  사용처: AI 점수 보기 (/api/ai/funding/score) 시스템 프롬프트.
 *
 *  ⚠️ 환각 방지: AI 가 평가 시 *반드시 이 모듈 기준* 으로 점수 산출.
 *      "막연하게 좋아보입니다" 같은 일반론 금지.
 * ───────────────────────────────────────────────────────────────── */

export type EvaluationFramework =
  | "psst"           // 예비/초기/청창사 — Problem-Solution-Scale-Team
  | "tips"           // 민간주도형 기술창업 — 기술성·시장성·성장가능성
  | "policy-loan"    // 소상공인 정책자금 — 신용·매출·사업계획
  | "redo-fund"      // 재도전 특별자금 — 폐업 경력·재기 의지
  | "emergency-fund" // 긴급경영안정자금 — 매출 하락 증명
  | "competition"    // 창업경진대회 — 사업성·발표력
  | "corporate-vc";  // 기업·VC 액셀러레이팅 — 시장·팀

/** 평가 항목별 배점 (100점 만점 기준) */
export type RubricItem = {
  key: string;
  label: string;
  weight: number; // 0-100 합 ≈ 100
  description: string;
  /** 합격 기준 — 이 항목에서 *반드시* 보여야 하는 증거 */
  evidence: string[];
  /** 탈락 신호 — 이 항목이 약하면 점수 하락 */
  redFlags: string[];
};

export type Rubric = {
  framework: EvaluationFramework;
  programs: string[];     // 적용 프로그램 라벨
  totalPoints: number;    // 보통 100
  passingScore: number;   // 추정 합격선 (서류 기준)
  items: RubricItem[];
  bonusFactors: BonusFactor[];
  disqualifyingFactors: string[];
  stageGuide: string;     // 어떤 사업 단계의 사장님께 적합한지
};

export type BonusFactor = {
  key: string;
  label: string;
  points: number; // 단일 가점 (보통 1-3점)
  category: "personal" | "biz-cert" | "ip" | "employment" | "region" | "track-record";
};

// ═══════════════════════════════════════════════════════════════════
//  ① PSST — 예비창업패키지·초기창업패키지·청년창업사관학교 공통
// ═══════════════════════════════════════════════════════════════════
//  심사 단계: 서류(2배수) → 인큐베이팅 → 발표평가 (20분 + 10분 Q&A)
//  서류 비중: P+S 가 핵심 (Team 은 점수차 적음 — 공식 가이드 확인)
//  합격선: 비공개. 추정 — 서류 70+ / 발표 75+
export const PSST_RUBRIC: Rubric = {
  framework: "psst",
  programs: ["예비창업패키지", "초기창업패키지", "청년창업사관학교", "창업도약패키지", "민관협력 창업지원"],
  totalPoints: 100,
  passingScore: 75,
  items: [
    {
      key: "problem",
      label: "문제 인식 (Problem)",
      weight: 25,
      description: "왜 이 문제가 존재하는지, 누구의 어떤 고통을 해결하는지 명확히",
      evidence: [
        "타겟 고객 인터뷰 N건 + 정량적 페인포인트",
        "시장 데이터 (보고서·공식 통계 인용)",
        "기존 솔루션의 한계를 구체 수치로 입증",
      ],
      redFlags: [
        "막연한 '많은 사람들이 불편해한다' 진술",
        "고객 검증 없이 추정만",
        "문제 정의가 추상적·일반론",
      ],
    },
    {
      key: "solution",
      label: "실현 가능성 (Solution)",
      weight: 30,
      description: "사업기간 내 개발/구체화 계획. 가장 비중 높은 항목.",
      evidence: [
        "MVP 또는 시제품 *이미* 운영 중 (가장 강력한 신호)",
        "PoC 검증 — 고객 인터뷰 + 시제품 반응",
        "단계별 마일스톤 (월별 KPI)",
        "기술적 구현 가능성 — 핵심 기술·특허·논문",
      ],
      redFlags: [
        "아이디어만 있고 시제품 0",
        "막연한 '개발 예정'",
        "기술 용어 나열 + 비즈니스 모델 연결고리 X",
      ],
    },
    {
      key: "scale-up",
      label: "성장 전략 (Scale-up)",
      weight: 25,
      description: "사업화 차별성·수익모델·자금조달 방안",
      evidence: [
        "초기 매출 또는 LOI/MOU 확보",
        "TAM·SAM·SOM 단계적 시장 정의",
        "수익모델 (단가·예상 객수·마진)",
        "경쟁사 대비 명확한 차별점 (가격·기술·UX·네트워크)",
      ],
      redFlags: [
        "'시장 규모 100조' 같은 부풀린 TAM",
        "수익모델 모호 (구독 vs 광고 vs 수수료 — 한 가지로 명확)",
        "경쟁사 분석 부재 또는 'no competitor'",
      ],
    },
    {
      key: "team",
      label: "팀 구성 (Team)",
      weight: 20,
      description: "대표자 + 고용예정 인력의 기술 역량·노하우",
      evidence: [
        "대표자 직접 관련 경력 (해당 산업 N년+)",
        "공동창업자 역할 분담 명확",
        "외부 자문/멘토링 네트워크",
        "전문가·교수·VC 추천서",
      ],
      redFlags: [
        "1인 창업 + 미숙련 (단, 산업 전문성 있으면 OK)",
        "역할 분담 모호",
        "기술 부재 (개발 외주 100%)",
      ],
    },
  ],
  bonusFactors: [
    { key: "youth", label: "청년 (만 39세 이하)", points: 1, category: "personal" },
    { key: "female", label: "여성 창업자", points: 1, category: "personal" },
    { key: "non-capital", label: "비수도권 본사·사업장", points: 1, category: "region" },
    { key: "veteran", label: "보훈대상자·국가유공자", points: 1, category: "personal" },
    { key: "disability", label: "장애인 창업자", points: 1, category: "personal" },
    { key: "venture-cert", label: "벤처기업 인증", points: 2, category: "biz-cert" },
    { key: "innobiz", label: "이노비즈·메인비즈 인증", points: 1, category: "biz-cert" },
    { key: "social-enterprise", label: "사회적기업 인증", points: 2, category: "biz-cert" },
    { key: "patent", label: "특허·실용신안 (출원·등록)", points: 1, category: "ip" },
    { key: "naeil-fund", label: "내일채움공제 가입", points: 1, category: "employment" },
    { key: "contest-win", label: "창업경진대회 수상", points: 1, category: "track-record" },
  ],
  disqualifyingFactors: [
    "사업자 등록일이 모집 공고일 *기준 자격 범위 밖* (예비: 등록 X / 초기: 3년 초과)",
    "체납 또는 신용 회생 절차 진행 중",
    "동일·유사 정부지원사업 *중복 수혜 중* (예: 청창사 + 예창패 동시 X)",
    "정부지원금 부정수급 이력",
    "지원 분야와 사업 아이템 불일치 (예: 소비재인데 딥테크 트랙 신청)",
  ],
  stageGuide:
    "예비창업패키지: 사업자등록 전 / 초기창업: 등록 후 0-3년 / 청창사: 등록 후 0-3년 + 만 39세 이하 + 기술기반",
};

// ═══════════════════════════════════════════════════════════════════
//  ② TIPS — 민간주도형 기술창업 (가장 경쟁률 높음, 합격 시 5억+)
// ═══════════════════════════════════════════════════════════════════
//  운영사(VC) 추천 → 서면 → 발표(IR) 평가
//  2026 변경: 가점 3 → 5 점 / 지속가능·기술인증 영역 신설
//  합격선: 비공개. 추정 — 서류 75+ / 발표 80+
export const TIPS_RUBRIC: Rubric = {
  framework: "tips",
  programs: ["TIPS 일반트랙", "TIPS 딥테크트랙", "프리TIPS", "포스트TIPS", "시드TIPS"],
  totalPoints: 100,
  passingScore: 80,
  items: [
    {
      key: "tech",
      label: "기술성 (Technology)",
      weight: 35,
      description: "핵심 기술의 차별성·진입장벽·고도성. 평가위원 7명 중 5명이 기술 전문가.",
      evidence: [
        "특허/논문/PoC 진행 경험",
        "벤치마크 대비 정량 우위 (속도·정확도·비용)",
        "딥테크의 경우 — Class II/III 인증, 임상 진행, FDA·MFDS 협의",
        "재현 가능한 기술 — 데이터·실험·코드",
      ],
      redFlags: [
        "'AI 활용' 같은 일반 키워드만 나열",
        "기술 차별성 = 단순 기능 나열",
        "특허·논문 0 + PoC 미실행",
      ],
    },
    {
      key: "market",
      label: "시장성 (Market)",
      weight: 30,
      description: "시장 검증과 잠재력. LOI·MOU·초기 매출이 강력 신호.",
      evidence: [
        "LOI / MOU / 초기 매출 — 실제 고객 검증",
        "TAM 1조+ + SAM·SOM 단계적 정의",
        "고객 페인포인트 정량화 (시간·비용 절감 N%)",
        "글로벌 진출 가능성 (특히 딥테크·글로벌트랙)",
      ],
      redFlags: [
        "TAM 부풀리기 (전 세계 인구 곱하기)",
        "고객 0 + 검증 없는 '잠재 시장'",
        "글로벌 트랙인데 한국 시장만",
      ],
    },
    {
      key: "growth",
      label: "성장 가능성 (Scalability)",
      weight: 20,
      description: "확장 가능한 BM + 5년 성장 경로",
      evidence: [
        "수익모델 명확 + 단가/마진 산출",
        "5년 매출/MAU/단위경제 (LTV/CAC) 시뮬레이션",
        "확장 메커니즘 (네트워크 효과·플랫폼·반복구매)",
      ],
      redFlags: [
        "5년 매출 = 'X * Y' 단순 곱셈",
        "확장 메커니즘 부재 (전부 영업 인력 투입)",
      ],
    },
    {
      key: "team",
      label: "팀 역량 (Team)",
      weight: 15,
      description: "기술 + 시장 + 운영의 3-leg 균형",
      evidence: [
        "CTO 또는 핵심 개발자 + 박사/현직 전문가",
        "산업 전문가 (해당 도메인 10년+)",
        "공동창업자 역할 분담 명확",
        "VC 추천서 (TIPS 운영사)",
      ],
      redFlags: [
        "1인 + 외주 100%",
        "기술자 0 (운영사 추천 어려움)",
      ],
    },
  ],
  bonusFactors: [
    { key: "non-capital-tips", label: "비수도권 본사·공장", points: 1, category: "region" },
    { key: "naeil-fund-tips", label: "내일채움공제(플러스) 도입", points: 1, category: "employment" },
    { key: "seed-tips", label: "시드TIPS·프리TIPS 통과", points: 2, category: "track-record" },
    { key: "patent-tips", label: "특허·실용신안 보유", points: 1, category: "ip" },
    { key: "esg", label: "ESG·지속가능 (신설 2026)", points: 1, category: "biz-cert" },
    { key: "tech-cert", label: "기술 인증 (KS·KC·국제표준 신설 2026)", points: 1, category: "biz-cert" },
  ],
  disqualifyingFactors: [
    "TIPS 운영사 (VC) 추천 부재",
    "창업 7년 초과",
    "기술 기반이 아닌 단순 서비스/유통",
    "딥테크 트랙: 임상/인증 로드맵 부재",
  ],
  stageGuide:
    "창업 0-7년 + 기술 기반 + VC 투자 유치 가능성 있는 스타트업. 일반 SMB·외식·소매 X.",
};

// ═══════════════════════════════════════════════════════════════════
//  ③ 소상공인 정책자금 — 일반경영안정·신용취약·성장기반
// ═══════════════════════════════════════════════════════════════════
//  대출이며 *지원금 아님*. 신용평가 + 매출 + 사업계획.
//  공단 직접 심사 → 대출 가능 여부 + 한도 결정
export const POLICY_LOAN_RUBRIC: Rubric = {
  framework: "policy-loan",
  programs: ["일반경영안정자금", "신용취약소상공인자금", "성장기반자금", "특별경영안정자금"],
  totalPoints: 100,
  passingScore: 70, // 신용·재무 충족 시 통과율 높음
  items: [
    {
      key: "credit",
      label: "신용평가 (NCB)",
      weight: 40,
      description: "NICE·KCB 신용점수. 자금 종류별 컷오프 다름.",
      evidence: [
        "일반경영안정: NCB 740점+ 권장",
        "신용취약: NCB 839점 이하 (역으로 자격 충족)",
        "대환: NCB 919점 이하",
        "체납·연체 0",
      ],
      redFlags: [
        "현재 연체 중",
        "신용회복 절차 미진행",
        "동일인 대출 한도 5억 초과",
      ],
    },
    {
      key: "revenue",
      label: "매출·재무 안정성",
      weight: 30,
      description: "최근 12개월 매출 + 운영 안정성",
      evidence: [
        "운영 12개월+ 매출 데이터 (홈택스 신고)",
        "월 매출 변동성 낮음",
        "운전자금 사용 계획 명확",
      ],
      redFlags: [
        "휴업 중",
        "최근 매출 -30% 이상 급락 (긴급경영안정자금 트랙으로 이전 권장)",
        "사업장 임대차 계약 만료 임박",
      ],
    },
    {
      key: "plan",
      label: "사업계획·자금 활용",
      weight: 20,
      description: "자금 사용 용도 + 매출 회복 로드맵",
      evidence: [
        "자금 활용 항목별 분배 (재고·인건비·마케팅 N%)",
        "매출 회복·확장 로드맵",
        "상환 가능성 (월별 현금흐름 시뮬레이션)",
      ],
      redFlags: [
        "막연한 '운영자금'",
        "상환 계획 부재",
      ],
    },
    {
      key: "industry-fit",
      label: "업종·자격 적합성",
      weight: 10,
      description: "융자 지원 대상 업종 + 자격",
      evidence: [
        "소상공인기본법 기준 상시근로자 5명 미만 (도소매 10명)",
        "사행성·유흥업 X",
      ],
      redFlags: [
        "지원 제외 업종",
      ],
    },
  ],
  bonusFactors: [
    { key: "employment-create", label: "고용창출 (신규 N명)", points: 2, category: "employment" },
    { key: "export", label: "수출 실적", points: 2, category: "track-record" },
    { key: "norangusan", label: "노란우산공제 가입", points: 1, category: "biz-cert" },
    { key: "credit-edu", label: "신용관리 교육 이수 (신용취약 필수)", points: 1, category: "personal" },
  ],
  disqualifyingFactors: [
    "현재 연체 + 채무 불이행",
    "체납 (국세·지방세·4대보험)",
    "사행성·유흥업종",
    "동일인 대출 5억 초과",
  ],
  stageGuide:
    "운영 12개월+ 소상공인 (개인 1인 + 인원 5명 미만 / 도소매 10명 미만). 운전자금·시설자금.",
};

// ═══════════════════════════════════════════════════════════════════
//  ④ 재도전 특별자금 — 폐업 경력 + 재기 의지
// ═══════════════════════════════════════════════════════════════════
export const REDO_FUND_RUBRIC: Rubric = {
  framework: "redo-fund",
  programs: ["재도전 특별자금"],
  totalPoints: 100,
  passingScore: 70,
  items: [
    {
      key: "redo-eligibility",
      label: "재도전 자격",
      weight: 50,
      description: "폐업 경력 + 재창업 7년 미만 + 동일/유사 업종 또는 채무조정",
      evidence: [
        "폐업기업 대표(이사) 본인 + 재창업기업 대표 동일",
        "재창업 7년 미만 (사업자등록 기준)",
        "폐업기업의 매출실적 보유 (휴업 3개월+ 후 재개도 인정)",
        "재창업교육 (희망리턴 패키지) 이수",
      ],
      redFlags: [
        "폐업 후 재창업 7년 초과",
        "재창업교육 미이수",
        "폐업기업이 동일/유사 업종 아님",
      ],
    },
    {
      key: "recovery-plan",
      label: "재기 계획",
      weight: 30,
      description: "이전 폐업 원인 분석 + 개선 방안",
      evidence: [
        "폐업 원인 자가 분석 (시장·실행·자금)",
        "이번엔 무엇이 다른지 — 구체 변경점",
        "초기 매출 또는 LOI",
      ],
      redFlags: [
        "이전 폐업 분석 없이 '이번엔 잘할 것'",
      ],
    },
    {
      key: "credit-recovery",
      label: "신용회복 진행 상태",
      weight: 20,
      description: "채무조정 성실상환 또는 신용회복",
      evidence: [
        "채무해소 재기지원종합패키지 참여 + 성실상환",
        "신용 점수 회복 (이전 대비 N점+)",
      ],
      redFlags: [
        "채무조정 진행 중인데 성실상환 X",
      ],
    },
  ],
  bonusFactors: [
    { key: "redo-edu", label: "희망리턴 패키지 재창업교육 이수", points: 2, category: "personal" },
    { key: "naeil-redo", label: "내일채움공제 신규 가입", points: 1, category: "employment" },
  ],
  disqualifyingFactors: [
    "폐업 후 재창업 7년 초과",
    "재창업교육 미이수",
    "현재 연체 중 (성실상환 트랙 아니면)",
  ],
  stageGuide: "이전 사업 폐업 후 재창업 0-7년차. 폐업 트라우마 극복 + 재기 의지.",
};

// ═══════════════════════════════════════════════════════════════════
//  ⑤ 긴급경영안정자금 — 매출 -10%+ 하락 / 재난 피해
// ═══════════════════════════════════════════════════════════════════
export const EMERGENCY_FUND_RUBRIC: Rubric = {
  framework: "emergency-fund",
  programs: ["긴급경영안정자금", "특별경영안정자금"],
  totalPoints: 100,
  passingScore: 75,
  items: [
    {
      key: "decline-evidence",
      label: "매출 하락 증명",
      weight: 60,
      description: "최근 매출 -10% 이상 (전년 동기 대비) + 운영 12개월+",
      evidence: [
        "전년 동기 대비 -10% 이상 하락",
        "홈택스 매출 신고 자료 첨부",
        "지역 경제 위기 / 감염병 / 재난 등 외부 요인 (선택)",
      ],
      redFlags: [
        "매출 하락 -10% 미만",
        "운영 12개월 미만",
      ],
    },
    {
      key: "recovery-plan",
      label: "회복 계획",
      weight: 25,
      description: "단기 회복 로드맵 + 자금 사용 계획",
      evidence: [
        "3-6개월 회복 마일스톤",
        "자금 사용 우선순위 (재고·인건비·마케팅)",
      ],
      redFlags: ["회복 계획 막연"],
    },
    {
      key: "credit-fit",
      label: "신용·재무 적격",
      weight: 15,
      description: "체납 0 + NCB 기본 자격",
      evidence: ["체납·연체 0", "NCB 700+ 권장"],
      redFlags: ["체납 진행 중"],
    },
  ],
  bonusFactors: [
    { key: "disaster-area", label: "재난·감염병 지정 지역", points: 3, category: "region" },
    { key: "norangusan", label: "노란우산공제 가입", points: 1, category: "biz-cert" },
  ],
  disqualifyingFactors: [
    "매출 하락 -10% 미만",
    "운영 12개월 미만",
    "체납 중",
  ],
  stageGuide: "운영 12개월+ + 최근 매출 -10% 이상 하락한 사장님. '오늘 사업이 흔들린다' 신호.",
};

// ═══════════════════════════════════════════════════════════════════
//  Catalog — framework lookup
// ═══════════════════════════════════════════════════════════════════
export const ALL_RUBRICS: Rubric[] = [
  PSST_RUBRIC,
  TIPS_RUBRIC,
  POLICY_LOAN_RUBRIC,
  REDO_FUND_RUBRIC,
  EMERGENCY_FUND_RUBRIC,
];

/** 프로그램 이름·카테고리 → Rubric 자동 매칭. */
export function detectRubric(programName: string, category?: string): Rubric {
  const name = programName.toLowerCase();
  if (/tips|팁스/i.test(name)) return TIPS_RUBRIC;
  if (/재도전|희망리턴|재창업/.test(name)) return REDO_FUND_RUBRIC;
  if (/긴급경영|특별경영|재난|감염병/.test(name)) return EMERGENCY_FUND_RUBRIC;
  if (/정책자금|운영자금|일반경영|신용취약|성장기반/.test(name) || category === "loan") return POLICY_LOAN_RUBRIC;
  // 기본 — PSST (예비/초기/청창사/도약 등 가장 보편적인 창업지원)
  return PSST_RUBRIC;
}

/**
 * 프로그램 → "이 지원사업을 얻기 위해 유리한 점"(가점 요소) 목록.
 *  카드/모달이 "비수도권·청년·여성·특허·벤처인증…" 칩으로 노출.
 */
export function getProgramBonusFactors(programName: string, category?: string): BonusFactor[] {
  return detectRubric(programName, category).bonusFactors;
}

/** 프로그램 → "어떤 단계의 사장님께 유리한지" 한 줄 가이드 */
export function getProgramStageGuide(programName: string, category?: string): string {
  return detectRubric(programName, category).stageGuide;
}

/**
 * 이 프로그램이 *피칭형 자금지원*(AI 점수·가점이 의미있는)인지 판정.
 *   false = 행사·교육·네트워크·시설·멘토링·인력 등 정보/참가형 → 점수·유리점 미노출(혼선 방지).
 *   라이브 K-Startup 공고(supt_biz_clsfc)와 큐레이션 모두에 적용.
 */
export function isFundableProgram(programName: string, category?: string): boolean {
  const t = `${programName} ${category ?? ""}`;
  // 명시적 자금지원형 키워드 → 점수 의미 있음
  if (/예비창업|초기창업|창업도약|청년창업사관|사업화|R&D|기술개발|tips|팁스|정책자금|융자|투자유치|보증|운영자금|재도전|희망리턴|긴급경영|바우처|지원금|보조금/i.test(t)) {
    return true;
  }
  // 정보·참가·인프라형 → 점수 무의미(피칭 평가가 안 맞음)
  if (/행사|네트워크|교육|세미나|설명회|박람회|컨설팅|멘토링|입주|공간|시설|보육|인력|채용|수출상담|판로|글로벌\s*진출|콘텐츠|esg|인증$/i.test(t)) {
    return false;
  }
  // 분야 코드 기반 (K-Startup supt_biz_clsfc 한글값)
  if (/시설ㆍ공간ㆍ보육|행사ㆍ네트워크|멘토링ㆍ컨설팅ㆍ교육|창업교육|판로ㆍ해외진출|인력/.test(t)) {
    return false;
  }
  // 기본 — 사업화/자금 계열로 간주(점수 가능)
  return true;
}

// ═══════════════════════════════════════════════════════════════════
//  합격/탈락 키워드 — AI 가 사장님 데이터 평가 시 인용 가능
//  출처: 사업계획서 100개 분석 (2026)
// ═══════════════════════════════════════════════════════════════════
export const PASS_SIGNALS: string[] = [
  "구체적 실행 방안 (단계별 프로세스 + 월별 마일스톤)",
  "타겟 고객 인터뷰 N건 + 정량적 페인포인트",
  "MVP/시제품 *이미 운영 중* (가장 강력)",
  "초기 매출 또는 LOI/MOU 확보",
  "팀 역량 객관적 입증 (경력·자격·실적)",
  "재무 계획 (단가·마진·BEP·5년 시뮬레이션)",
  "사회적 가치·지속 가능성 명시",
  "PoC 검증 — 가설 → 실험 → 데이터 → 다음 단계",
];

export const FAIL_SIGNALS: string[] = [
  "막연한 희망 ('많은 사람들이 좋아할 것')",
  "모호한 표현 ('다양한', '여러')",
  "과도한 자화자찬 ('최고', '혁신적', '독보적' 객관 근거 X)",
  "기술 용어 나열 + 비즈니스 모델 연결고리 X",
  "단순 기능 나열 ('A 기능, B 기능, C 기능 제공')",
  "TAM 부풀리기 ('전 세계 인구 × 객단가')",
  "고객 검증 0 + 시제품 0",
  "경쟁사 분석 부재 또는 'no competitor' 주장",
];
