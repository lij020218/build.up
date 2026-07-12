/**
 * 스타트업 8단계 × 4 운영 모드 콘텐츠 매트릭스.
 *
 *  ── 핵심 원칙 ─────────────────────────────────────────────────
 *  같은 stage 라도 운영 모드(인디·부트스트랩·시드·시리즈A+)에 따라
 *  필요한 활동·결정·도구·일정이 완전히 다르다.
 *  이 파일은 사용자에게 자기 모드에 맞는 검증된 가이드를 보여주는 단일 출처.
 *  ─────────────────────────────────────────────────────────────
 *
 *  검증된 출처 (이중 삼중 교차):
 *    • Pieter Levels — Indie Hackers Podcast, $3M+/년 솔로
 *    • Marc Lou — $1,032,000/2025년, 0명 직원, 3개 제품 (ShipFast·CodeFast·DataFast)
 *    • Solo founders 36.3% of new ventures 2026 (vs 23.7% in 2019)
 *    • 37signals/Basecamp — 20년 무 VC, MicroConf 부트스트랩 중심 커뮤니티
 *    • Rob Walling Stair Step Approach (single sale → scale → SaaS)
 *    • YC: $500K (125K + 375K SAFE) for 7%, 시드 라운드 $1-5M (high-conviction $5-20M)
 *    • Reid Hoffman Blitzscaling — 시리즈A+ 거버넌스
 *    • Andrew Chen — compounding growth loops
 *    • 한국 시드 라운드: 5천만~5억, 시리즈A 30-100억 (딥테크 100-900억)
 *    • 한국 대표 지분 60% 미만 → 투자 거의 X (시드 70% 무난)
 *    • Cursor + Claude Code — 26% 빠른 개발 (2026 표준)
 *    • IP timing: 공개 전 filing, US 1년 grace, provisional $1500-2500
 */

import type { OperatingMode } from "./clusters";

/** 모드별 stage 콘텐츠 — UI 에서 모드 칩 + 동적 분기 */
export type ModeStageContent = {
  /** 왜 이 단계가 이 모드에서 중요한가 (Why) */
  why: string;
  /** 이 단계에서 어떻게 해야 하는가 — 핵심 행동 3-5개 (How) */
  actions: Array<{ title: string; detail: string }>;
  /** 일정·규모 가이드 (시작점 잡기) */
  pace: string;
  /** 흔한 함정 / 피해야 할 것 */
  pitfall?: string;
  /** 검증된 사례·통계 인용 (출처) */
  evidence?: string;
};

/**
 * 8개 핵심 startup stage × 4 modes 콘텐츠.
 *
 *  Stage 키:
 *   • startup-foundation: 팀·문제 정의
 *   • customer-discovery: 고객 발굴·문제 검증
 *   • company-setup: 사업자등록·법인·IP
 *   • mvp-build: MVP 빌드·IP 보호
 *   • launch-gtm: 출시·GTM
 *   • growth-engine: 성장·리텐션
 *   • fundraising-readiness: 펀딩 (이미 별도 mode-aware programs 데이터 있음 — 여기엔 메타 가이드)
 *   • venture-certification: 벤처인증·정부지원
 */
export const STARTUP_STAGE_MODE_CONTENT: Record<string, Record<OperatingMode, ModeStageContent>> = {
  // ─────────────────────────────────────────────────────────────
  "startup-foundation": {
    indie: {
      why: "혼자 일하기 때문에 '문제'와 '실행 환경'이 명확해야 합니다. 팀 정렬 이슈는 없지만, 동기부여·고립 관리·번아웃 방지가 핵심입니다. 시간이 곧 자본 — 잘못된 문제를 6개월 풀면 회복 어렵습니다.",
      actions: [
        { title: "본인이 직접 겪었거나 잘 아는 문제 1개로 좁히기", detail: "Pieter Levels·Marc Lou 패턴 — '내가 매일 쓰는 것' 또는 '내가 잘 아는 좁은 시장' 만 다룬다. 70개 실패 후 PhotoAI 가 그렇게 나옴." },
        { title: "Discord/X/Reddit 인디 커뮤니티 합류", detail: "고립 방지 + 빌드 인 퍼블릭 채널 확보. Indie Hackers·Build in Public·MicroConf Connect 추천." },
        { title: "솔로 워크플로 셋업 (Cursor + Claude Code)", detail: "2026 인디 표준: Cursor + Claude Code 조합으로 26% 빠른 개발. 처음부터 익숙해질 것." },
        { title: "공개 빌드 로그 시작 (X/Twitter, 또는 블로그)", detail: "마케팅 + 동기부여 + 고객 모집 동시. Marc Lou·Pieter Levels 모두 이 방식." },
      ],
      pace: "1-2주 내 결정 — 길게 끌수록 학습 손실. 6개월 안에 첫 제품 출시 목표.",
      pitfall: "'완벽한 첫 아이디어' 추구 — 인디는 출시·실패·학습의 반복이 핵심. 첫 제품이 망해도 정상.",
      evidence: "솔로 founder 비중 2019년 23.7% → 2026년 36.3% (역사적 최고). Marc Lou: $1M+/2025년 with 0 employees.",
    },
    bootstrap: {
      why: "1-3명 팀의 가장 큰 위험은 '암묵적 합의' 입니다. 지분·역할·의사결정 구조가 문서화되지 않으면 6-12개월 후 갈등으로 회사 끝납니다. 자비 부담이라 자본 압박도 큼.",
      actions: [
        { title: "공동창업자 지분 합의 + Vesting 계약 (4년 vesting · cliff 2년)", detail: "지분 비율 + 이탈 시 회수 조건 명시. 표준 4년 vesting + cliff 2년(스톡옵션 법정, 상법 §340-4 — 벤처기업도 완화 불가). 변호사 (윤앤장·세종 등) 검토 추천." },
        { title: "역할·의사결정 구조 문서화", detail: "CEO·CTO 역할 · 50/50 데드락 방지 (캐스팅 보트 또는 sole CEO 권장) · 주간 동기화 시간." },
        { title: "공유 운영 도구 (Notion + Slack + Linear/GitHub)", detail: "분산 작업 + 의사결정 로그. MicroConf 표준: 매주 1회 30분 동기화 + 분기별 retro." },
        { title: "37signals 모델 학습 (No-VC 20년 사례)", detail: "Basecamp 가 보여준 sustainable growth. Stair Step Approach (Walling): 단일 판매 제품 → 스케일 → SaaS." },
      ],
      pace: "지분·역할 결정 즉시 (1주). 첫 3개월 내 핵심 프로세스 정착.",
      pitfall: "지분 분배 후속 협상 미루기 — 입찰처럼 즉시 결정. 미루면 매출 발생 후 갈등 폭발.",
      evidence: "MicroConf Connect: 글로벌 최대 부트스트랩 SaaS 커뮤니티 (2011~). 37signals: VC 0원, 20년 흑자.",
    },
    seed: {
      why: "시드 자금 받았다면 '시간 vs 자본 효율' 균형이 핵심. 3-5명 팀은 가장 폭발적으로 성장할 수 있는 단계 — 잘못된 채용 1명이 6개월 진척을 망가뜨립니다. 한국 시드는 대표 지분 60% 이상 유지가 다음 라운드의 전제.",
      actions: [
        { title: "공동창업자 vesting + 옵션 풀 10-15% 확보", detail: "법인 설립 시 옵션 풀 사전 확보 (시리즈A 시 추가 발행 압력 줄임). 대표 지분 60% 이하 떨어지지 않도록 관리." },
        { title: "핵심 3-5명 채용 — engineer + product + GTM", detail: "YC 표준: 3-5명 팀이 1차 마일스톤. Peter Thiel: 'CEO 연봉 $150K 넘으면 정치인 시작' — 보수는 옵션 비중 높게." },
        { title: "주간 KPI · 월간 board update · 분기 retro", detail: "투자자 보고서 표준화. 공유 메트릭 대시보드 구축 (Mixpanel·PostHog 등). 첫 6개월에 정착해야 함." },
        { title: "Customer discovery 프로세스 정립 (Steve Blank)", detail: "주간 5-10명 인터뷰 + VOC 시스템. 시드 9개월 안에 PMF 또는 피벗 결정." },
      ],
      pace: "3-5명 코어 팀 6개월 내 완성. PMF 시그널 9-12개월 내.",
      pitfall: "'더 많은 사람 = 더 빠름' 함정. 잘못된 시니어 채용 1명 = 시드 자본 20% 손실. Customer Advisory 대신 채용 우선 = 폭망.",
      evidence: "YC: $500K for 7%, 시드 라운드 $1-5M (high-conviction $5-20M). 한국 시드: 5천만~5억, 463개 액셀러레이터.",
    },
    seriesA: {
      why: "시리즈A+ 단계의 founder 는 '실행자' 에서 '경영자' 로 전환되어야 합니다. C-suite 채용 + 이사회 구성 + 거버넌스가 핵심. Reid Hoffman: 'executives 가 스케일 못 하면 사업이 스케일 못 한다.'",
      actions: [
        { title: "C-suite 채용 시작 (CTO·CPO·VP Engineering 등)", detail: "founder 가 모든 역할 → 각 부문 leader 위임. 채용 사이클 6-12개월. CEO 가 60% 시간 채용에." },
        { title: "이사회 구성 + 분기별 운영 (Reid Hoffman)", detail: "투자자 1-2명 + 외부 이사 1명 + founder. 분기 board meeting + 월간 update + 연간 strategy off-site." },
        { title: "운영 OS: OKR + 주간 리뷰 + 부문 KPI", detail: "Andrew Chen: compounding growth loops 정착. Growth team + Data infra + Experimentation platform." },
        { title: "옵션 풀 확장 + 시리즈B 준비", detail: "옵션 풀 추가 발행 + ESOP 정책. 시리즈B 18-24개월 내 — 미리 메트릭 트래킹 (NRR·Gross Margin·Magic Number 등)." },
      ],
      pace: "C-suite 12-18개월 완성. 이사회 시리즈A 클로징 후 30일 내 첫 미팅.",
      pitfall: "Founder 가 모든 결정 직접 = bottleneck. C-suite 위임 못 하면 시리즈B 전 회사 멈춤. Reid Hoffman 의 핵심 경고.",
      evidence: "한국 시리즈A: 일반 30-100억 / 딥테크 100-900억 (디노티시아 900억·BOS 870억). Blitzscaling 표준 거버넌스.",
    },
  },

  // ─────────────────────────────────────────────────────────────
  "customer-discovery": {
    indie: {
      why: "솔로는 '내가 직접 인터뷰' 가 강점이자 약점. 강점은 PM·CS·세일즈 모두 본인이 보니 인사이트가 잃지 않음. 약점은 시간 한계 — 일주일 5명 인터뷰가 한계.",
      actions: [
        { title: "30-50명 인터뷰 → 패턴 1개 발견까지", detail: "Pieter Levels 패턴: 본인이 잘 아는 niche 의 정확한 1-3개 pain. Twitter DM·Reddit·Discord 에서 직접 모집." },
        { title: "유료 의향 확인 (가짜 결제 페이지 또는 사전주문)", detail: "Talk is cheap — 신용카드 정보까지 받는 사전주문이 가장 강한 신호. 인디는 자본이 없으니 false positive 회피 필수." },
        { title: "공개 인터뷰 노트 (X/blog)", detail: "build-in-public 마케팅 + 후속 고객 모집 효과 동시. Marc Lou 모델." },
      ],
      pace: "주 5-10명 인터뷰, 4-6주 내 100명 도달.",
      pitfall: "친구·가족 인터뷰 → 의미 없음. 모르는 사람만 카운트.",
      evidence: "솔로 founder 강점: 'AI 가 무엇을 풀지 알려주지 않는다' — fundamentals 는 동일 (FindSkill.ai 2026).",
    },
    bootstrap: {
      why: "1-3명 팀은 인터뷰 분담 가능 — 효율 2-3배. 단, 인사이트 통합 단계가 가장 중요 — 분담 후 한자리 모여 패턴 합의해야 같은 방향.",
      actions: [
        { title: "50-100명 인터뷰 분담 + 주 1회 인사이트 합의", detail: "founders 별 다른 페르소나 담당. 매주 30분 패턴 미팅 — Mom Test 표준 질문." },
        { title: "VOC 시스템 구축 (Notion + 태깅)", detail: "인터뷰 raw + 인용구 + 태그 (pain·workaround·budget·urgency)." },
        { title: "유료 사전판매 / Stripe 결제 페이지로 검증", detail: "Stripe + Carrd 1시간이면 셋업 가능. 결제까지 가는 conversion 이 진짜 검증." },
      ],
      pace: "분담 시 4주 내 100명, 주 1회 통합.",
      pitfall: "각자 인터뷰만 하고 통합 안 함 → 다른 PMF 가설 추구로 분열. 매주 30분 무조건 합의 미팅.",
      evidence: "Bootstrap 표준: 'Listen → Build → Listen' (37signals 모델).",
    },
    seed: {
      why: "시드는 PMF 시그널 강도를 검증하는 단계. 1년 뒤 시리즈A VC 가 가장 먼저 묻는 것: '진짜 고객 데이터 어디 있어?' VOC 시스템 + 정성·정량 양쪽 데이터 다 갖춰야 함.",
      actions: [
        { title: "Customer Discovery 프로세스화 (Steve Blank)", detail: "Customer Discovery → Validation → Creation → Building. 전담 1명 (PM 또는 founder)이 매주 인터뷰 10-20명." },
        { title: "Customer Advisory Board 구성 (5-10 deep users)", detail: "최우선 고객 5-10명을 정기 자문단으로. 분기 1회 미팅 + 베타 1순위 + 레퍼런스 활용." },
        { title: "정량 PMF 신호 트래킹 (NPS·retention·organic·word-of-mouth)", detail: "Sean Ellis Test: 사용 못 하면 매우 실망 ≥ 40% = PMF. 매월 측정." },
      ],
      pace: "9-12개월 내 PMF 또는 명확한 피벗.",
      pitfall: "Customer Discovery 단계 단축하고 채용·기능 빌드 우선 = 시드 소진 후에야 PMF 못 찾았음 깨달음.",
      evidence: "YC: PMF 가 시리즈A 의 전제. Sean Ellis Test 40%+ 가 표준.",
    },
    seriesA: {
      why: "시리즈A+ 는 '검증' 에서 '확장' 으로 전환. Customer Discovery → Customer Success 로 진화. 영업팀 분리 + CSM 역할 등장.",
      actions: [
        { title: "Customer Success Manager (CSM) 채용 + onboarding 프로세스", detail: "1:1 onboarding 콜 + adoption tracking + 분기 review. 90% retention 목표." },
        { title: "Customer Advisory Board 정식 운영", detail: "분기 1회 + 제품 로드맵 공유 + 베타 우선권. 영향력 큰 고객을 advocate 으로." },
        { title: "Voice of Customer (VOC) 분석 시스템", detail: "Gong·Chorus 등 통화 분석 + Mixpanel 행동 분석 통합. 매주 인사이트 → product team." },
      ],
      pace: "CSM 6개월 내 채용. Advisory Board 분기 운영.",
      pitfall: "Customer Discovery 멈춤 → 시장 변화 놓침. 시리즈A 후에도 founder 인터뷰 월 10명은 유지.",
      evidence: "Andrew Chen: compounding growth loops — customer feedback loop 가 핵심 자산.",
    },
  },

  // ─────────────────────────────────────────────────────────────
  "company-setup": {
    indie: {
      why: "1인이라면 '개인사업자' 가 가장 빠르고 저렴. 간이과세 가능 (연 1억 400만원 미만)으로 부가세 부담 작음. 법인 설립은 매출 1억 넘거나 외부 투자 받을 때.",
      actions: [
        { title: "개인사업자 등록 (홈택스 5분, 무료)", detail: "사업자등록번호 즉시 발급. 간이과세 자격 확인 (연 1억 400만원 미만 시 1.5–4% 부가세)." },
        { title: "트레이드마크 검색 + 출원 (KIPRIS·USPTO)", detail: "도메인 + 상호 동시 확보. 한국 출원비 자체 6.6만원, 변리사 위임 시 30-50만원." },
        { title: "Provisional patent 검토 (필요 시)", detail: "1년 grace period 활용 가능. 미국 provisional $1,500-2,500. 인디는 거의 불필요하지만 핵심 기술이면 검토." },
      ],
      pace: "사업자등록 1일. 트레이드마크 출원 1주.",
      pitfall: "법인 처음부터 만듦 → 자본금·등기·세무 부담 큰데 1인은 활용 못 함. 매출 1억 넘기 전에는 개인사업자 추천.",
      evidence: "한국 간이과세 기준 2026년 1억 400만원 (8천만 → 상향, 출처: 국세청). 솔로 founder $30/mo 시작 (FindSkill.ai 2026).",
    },
    bootstrap: {
      why: "팀이 있으면 처음부터 법인 (주식회사) 권장. 공동창업자 지분 = 주식. 법인이 없으면 지분 합의 자체가 법적 효력 약함. 매출 발생 시 4대보험·세무가 복잡해짐.",
      actions: [
        { title: "사업 형태 확정 (개인사업자 vs 주식회사) — 팀 있으면 법인 권장", detail: "법인 선택 시: 법무사 위임 30-50만원, 자본금 100만원~(1억 미만 신용출자 가능), 공동창업자 주식 발행 + vesting 동시. 개인사업자는 홈택스 5분·무료(간이과세 가능)." },
        { title: "트레이드마크 + 도메인 + 핵심 IP 출원", detail: "Pre-seed 라운드 전에 IP 정리 — 투자자 due diligence 첫 항목." },
        { title: "공동창업 계약서(동업계약서) — 법인 설립 시 주주간계약서(SHA)로 정식화", detail: "Drag-along·Tag-along·Right of First Refusal·Vesting·Non-compete. 변호사 위임 200-500만원 또는 ZUZU 템플릿. 설립 전이면 동업계약서, 설립 후 SHA로 승계." },
        { title: "지분 구조·인센티브 계획 사전 확보", detail: "법인 설립 시 옵션 풀 5-10% 사전 확보 → 직원 채용 시 즉시 인센티브, 시드 후 추가 발행 부담 감소." },
      ],
      pace: "법인 설립 2-4주. SHA 1개월. 옵션 풀 동시.",
      pitfall: "공동창업자와 '나중에 정리' → 6개월 후 갈등 시 거의 회복 불가. 법인 설립 즉시 SHA 작성.",
      evidence: "한국 시드 라운드 표준: 대표 지분 70% (60% 이하 시 투자 거의 X). 옵션 풀 사전 확보 = 시리즈A 협상력.",
    },
    seed: {
      why: "시드 직전·직후가 IP·법인 구조 정비의 마지막 골든 타임. 시리즈A 전 정리 안 되면 due diligence 통과 못 함.",
      actions: [
        { title: "정식 IP 전략 (변리사 + 출원 일정)", detail: "트레이드마크 + 핵심 특허 + 영업비밀. 미국·유럽·중국 동시 출원 검토 (글로벌 시장 진출 시)." },
        { title: "옵션 풀 10-15% 확보 + ESOP 정책 수립", detail: "시리즈A VC 가 옵션 풀 부족 시 추가 발행 요구 → 대표 지분 희석. 미리 충분히 확보." },
        { title: "Shareholder Agreement 업그레이드 (시드 VC 조항 반영)", detail: "Liquidation Preference 1x non-participating · Anti-dilution Broad-Based · Pro-Rata Right · Drag/Tag-Along." },
        { title: "정식 회계 시스템 + 월간 결산 (자비스·더존)", detail: "VC 보고용 표준 재무제표. 자비스는 SaaS 친화 + 영문 출력." },
      ],
      pace: "시드 클로징 후 60일 내 모두 정비.",
      pitfall: "옵션 풀 5% 만 확보 → 시리즈A 시 추가 5-10% 요구로 founder 지분 희석. 시드 단계에서 10-15% 미리.",
      evidence: "YC 표준 SAFE 구조: post-money valuation cap. 한국 옵션 풀 표준 10-15% (KAIST 분석).",
    },
    seriesA: {
      why: "시리즈A+ 는 거버넌스 구조 정착 단계. 추가 옵션 풀·IP 포트폴리오·법무팀이 운영 단위가 됨.",
      actions: [
        { title: "법무팀 구축 (인하우스 또는 외부 법인 fixed retainer)", detail: "월 retainer 200-500만원. 계약 검토 + IP 관리 + 노무 분쟁." },
        { title: "옵션 풀 추가 발행 + ESOP 확장", detail: "시리즈A 클로징과 동시에 추가 5-10% 발행. C-suite 채용용 별도 grant." },
        { title: "IP 포트폴리오 확대 (defensive + offensive)", detail: "특허 5-20개 + 상표 다국가 + Trade Secret 정책. 변리사 정기 자문." },
        { title: "이사회 + Subsidiary 구조 검토", detail: "글로벌 진출 시 미국 Delaware C-Corp 자회사 등 검토. 세무·환위험·exit 고려." },
      ],
      pace: "시리즈A 후 6개월 내 거버넌스 완성.",
      pitfall: "법무팀 없이 직접 처리 → CEO 가 노무·계약·IP 모두 보면 본업 마비. 시리즈A 직후 위임이 표준.",
      evidence: "Reid Hoffman: 시리즈A 후 거버넌스 미정비 = 시리즈B 실패 1순위. 표준 board governance 필수.",
    },
  },

  // ─────────────────────────────────────────────────────────────
  "mvp-build": {
    indie: {
      why: "솔로의 가장 큰 무기는 '속도'. 6주 내 MVP 못 내면 동기부여 잃음. 도구·프레임워크·UI 라이브러리 모두 '있는 것 그대로 사용' 원칙.",
      actions: [
        { title: "Cursor + Claude Code 셋업 (2026 표준)", detail: "Cursor: AI native IDE / Claude Code: terminal agent. 조합 시 26% 빠른 개발. Marc Lou·Pieter Levels 모두 사용." },
        { title: "Lovable·v0·Bolt 등 No-Code 검토 (단순 제품)", detail: "랜딩·내부 도구·간단 SaaS 는 No-Code 가 충분. AI 앱·복잡 백엔드는 코드. 처음부터 직접 코드 = 시간 낭비." },
        { title: "단일 워크플로 1개에 집중", detail: "Pieter Levels 패턴: 1 product = 1 핵심 액션. 부가 기능 0. PhotoAI = 사진 업로드 → AI 사진 생성. 끝." },
        { title: "출시 마감 6주 정하기 + 매주 빌드 로그", detail: "Marc Lou 패턴: 매주 X에 진행상황 공개. 마감이 없으면 영원히 미완. 6주 = 인디 평균 MVP 기간." },
      ],
      pace: "MVP 6주, 첫 유료 고객 8-12주.",
      pitfall: "'완벽한 MVP' 추구 → 12개월 후에도 미출시. 못생긴 v1 으로 5명 사용 받는게 1000배 가치.",
      evidence: "Cursor + Claude Code 26% 빠름 (FindSkill.ai 2026). Marc Lou: 3개 제품 모두 6-8주 내 출시.",
    },
    bootstrap: {
      why: "팀이 있으면 더 큰 MVP 가능 — 단, '필수 기능 1-2개' 원칙은 동일. 분담의 함정은 동기화 비용 증가. 코드베이스·brunch 전략·코드리뷰 미리 합의.",
      actions: [
        { title: "공통 코드베이스 + Git 컨벤션 + 코드리뷰", detail: "trunk-based + feature branches + 24h PR review SLA. CI/CD 파이프라인 (Vercel·Render). 매주 1회 30분 리뷰 회의." },
        { title: "1-2개 핵심 기능 + 1개 차별화 기능", detail: "Stair Step Approach: 기존 시장 + 1개 differentiator. 처음부터 다 만들면 출시 늦음." },
        { title: "빌드 vs 사기 결정 (auth·결제·email·analytics)", detail: "auth (Supabase·Clerk), 결제 (Stripe·Toss), 이메일 (Resend·Postmark), analytics (Posthog) — 무조건 외부 서비스. 직접 만들면 시간 폭발." },
        { title: "주간 데모 + 사용자 피드백 사이클", detail: "매주 금요일 30분 데모 + 베타 사용자 피드백 정리. 다음주 우선순위 결정." },
      ],
      pace: "MVP 3-6개월, 첫 유료 고객 5-8개월.",
      pitfall: "코드 컨벤션·리뷰 SLA 안 정함 → 4개월 후 코드베이스 카오스. 일주일 늦은 머지 = 갈등 시작.",
      evidence: "37signals/Basecamp 표준: '있는 도구 활용, 만드는 시간 최소화'. MicroConf 부트스트랩 SaaS 평균 출시 4-6개월.",
    },
    seed: {
      why: "시드 받았다면 '엔지니어링 표준' 정립의 골든 타임. MVP 출시 + 첫 사용자 + 정식 QA 사이클 완성. 6-9개월 안에 PMF 시그널 또는 피벗 결정해야 시리즈A 가능.",
      actions: [
        { title: "정식 엔지니어링 프로세스 (CI/CD + 자동 테스트 + Sentry)", detail: "Sentry·Datadog·OpenObserve 통합. 자동 테스트 커버리지 60-80%. PR review SLA 24h." },
        { title: "모듈화 + 확장 가능한 아키텍처", detail: "Microservices 까진 X (시기상조), but modular monolith. Database·API·UI 분리. Tech debt 매주 20% 시간 할당." },
        { title: "Beta program + 50-100 deep users", detail: "Customer Advisory Board (5-10) + Beta 사용자 (50-100) + Onboarding 표준화. NPS·retention 정량 트래킹." },
        { title: "PMF 시그널 측정 (Sean Ellis 40%+ test)", detail: "매월 'how disappointed if can't use' 설문. 40% 이상 'very disappointed' = PMF. 6-9개월 안에 도달 또는 피벗." },
      ],
      pace: "MVP 6-9개월. PMF 9-12개월. 시리즈A 18-24개월.",
      pitfall: "엔지니어 5명 채용 후 over-engineering → 출시 12개월 후로 미뤄짐 → 시드 자본 50% 소진. 'Ship weekly' 문화 정립 필수.",
      evidence: "YC 시드 → 시리즈A 표준 12-24개월. PMF Sean Ellis test 40% 가 표준.",
    },
    seriesA: {
      why: "시리즈A+ 는 'MVP 빌드' 보다 'platform 확장 + 안정성' 단계. 다중 제품 라인 검토 + SLA 보장 + 글로벌 인프라.",
      actions: [
        { title: "Platform 전환 (modular monolith → 부분 microservices)", detail: "병목 모듈만 분리. 전체 microservices 는 over-engineering. 명확한 service boundary + API contracts." },
        { title: "다중 제품 라인 또는 vertical 확장 검토", detail: "Andrew Chen: compounding growth. 기존 제품의 verticals + 인접 제품. 단, 핵심 1개가 30% 이상 확실해진 후." },
        { title: "Reliability + SLA (uptime 99.9%+ · response time SLA · incident response)", detail: "엔터프라이즈 고객 요구 사항. SOC 2 / ISO 27001 인증 시작. Status page 공개." },
        { title: "글로벌 인프라 (multi-region + CDN + i18n)", detail: "AWS multi-region · Cloudflare CDN · 다국어 지원. 글로벌 진출 전제." },
      ],
      pace: "Platform 전환 12개월. 다국가 출시 18-24개월.",
      pitfall: "전체 microservices 전환 → 6-12개월 마비. 병목만 분리 (Reid Hoffman Blitzscaling 원칙).",
      evidence: "Reid Hoffman Blitzscaling: 'over-engineer 절대 금지, but pain point 만 분리'.",
    },
  },

  // ─────────────────────────────────────────────────────────────
  "launch-gtm": {
    indie: {
      why: "솔로의 출시는 '커뮤니티 + 빌드 인 퍼블릭' 이 핵심. 광고 예산은 0 또는 매우 작음. X·Reddit·Indie Hackers·Product Hunt 가 1차 채널.",
      actions: [
        { title: "Product Hunt + Hacker News (Show HN) 셀프 런칭", detail: "Pieter Levels·Marc Lou 모두 사용. 화/수 12:01 PT 게시. 200+ first-hour supporters 사전 확보 (인디 커뮤니티)." },
        { title: "X (Twitter) 빌드 인 퍼블릭 6주", detail: "매주 진척·매출·실패 공개. 1만 팔로워 도달 시 매출 상관관계 강. Marc Lou 모델." },
        { title: "무료 티어 → 유료 (freemium 또는 free trial)", detail: "Stripe 결제 + Lemon Squeezy 등. 인디는 무료 티어 너무 관대하면 안 됨 (서버 비용 폭발)." },
        { title: "콘텐츠 마케팅 (블로그·YouTube)", detail: "Marc Lou: YouTube 채널 + 블로그 + 트위터 = 매출 30%. 광고비 0." },
      ],
      pace: "출시 = 1일. MRR $5K 도달 6-18개월.",
      pitfall: "유료 광고로 출시 → 인디 자본 빠르게 소진. Organic 채널 먼저 검증 후 광고는 PMF 후.",
      evidence: "Marc Lou 매출 분석: 트위터 + YouTube + 블로그 = 매출 70%. Pieter Levels: PH·HN + 트위터.",
    },
    bootstrap: {
      why: "1-3명 팀은 GTM 채널 1개에 집중 + 콘텐츠 마케팅 시작. 분담 가능 — but 채널 너무 많이 벌리면 분산.",
      actions: [
        { title: "1차 채널 1개 결정 + 6개월 집중", detail: "B2B SaaS = LinkedIn + 콘텐츠 / 인디 SaaS = X·HN·PH / 한국 = 네이버·인스타·카카오. 채널별 실험 후 정착." },
        { title: "콘텐츠 마케팅 시스템 (blog + SEO + social)", detail: "37signals 모델: 'sell the byproduct'. 블로그·책·팟캐스트로 brand awareness. 6-12개월 후 매출 30-50%." },
        { title: "유료 광고는 PMF 후 · 런웨이 되면만 (아니면 오가닉 우선)", detail: "광고 알고리즘 학습단계 이탈엔 채널당 주 ~50전환이 필요 → 사실상 월 130만원(~$1K)·일 $10~30+ 부터라야 데이터가 쌓임(Meta·Google 기준). 그 이하 소액은 학습 못 벗어나 돈만 낭비. 자비 런웨이가 이를 감당 못 하면 유료광고는 미루고 콘텐츠·커뮤니티(오가닉) 집중. 하면 한 채널만, ROAS 1.5+ 안 나오면 즉시 중단." },
        { title: "파트너십 / referral / affiliate 프로그램", detail: "Stair Step 전략 — 기존 ecosystem 활용 (Shopify·WordPress·Slack 마켓플레이스). MicroConf 표준." },
      ],
      pace: "출시 → 첫 매출 1-3개월. ARR $100K 12-18개월.",
      pitfall: "처음부터 5개 채널 → 모두 어정쩡. 1개 정착 후 다음 채널.",
      evidence: "MicroConf 분석: 부트스트랩 SaaS 평균 첫 채널 + 12개월 = 50% 매출. 37signals: 콘텐츠 = 영원한 자산.",
    },
    seed: {
      why: "시드 자금(특히 5천만~수억 초기 시드)에서 먼저 할 것은 '팀 채용'이 아니라 창업자 직접 세일즈(founder-led)로 첫 고객·PMF 확보. 채용·유료광고는 반복 가능한 세일즈 공식과 초기 지표가 검증된 뒤. 런웨이 관리가 최우선.",
      actions: [
        { title: "창업자 직접 세일즈(founder-led) 먼저 — 채용은 그 다음", detail: "첫 10~50 고객은 창업자가 직접 판매·온보딩(YC 표준: 50번째 고객까진 founder-led). Growth marketer·salesperson 채용은 반복 가능한 세일즈 공식이 검증된 뒤 1명씩." },
        { title: "무료 채널(오가닉) 먼저 — Build in Public·콘텐츠·커뮤니티", detail: "X 빌드 인 퍼블릭 + 블로그·SEO + 타깃 커뮤니티. 비용 0로 초기 유입·신뢰 축적. 유료광고는 PMF·전환율 확인 후 소액부터, ROAS 1.5+ 안 나오면 즉시 중단." },
        { title: "가벼운 GTM stack + 지표 계측", detail: "과한 CRM 대신 스프레드시트·경량 CRM + Posthog/Mixpanel 5개 핵심 이벤트. 데이터로 다음 채널 결정." },
        { title: "지표 확보 후 차기 투자 준비", detail: "유료 전환 고객·리텐션·MRR 우상향을 만든 뒤 PR·시리즈A 스토리 구성. TechCrunch·플래텀 노출은 지표가 뒷받침될 때." },
      ],
      pace: "초기 목표: 유료 전환 고객 50~100명 + MRR 300만~500만원 확보 후 차기 투자 준비. ※ ARR $1M(약 13억)은 '1년차 목표'가 아니라 자금·팀 갖춘 시드가 시리즈A로 넘어가는 신호(통상 12~24개월+).",
      pitfall: "시드 자금으로 채용·유료광고부터 태우면 몇 달 만에 런웨이 소진. Founder 가 sales 안 하면 '시장 안 맞아서' 자기 변명이 됨.",
      evidence: "YC: founder-led sales 50번째 고객까지 표준. $1M ARR 는 시리즈A '진입' 신호(초기 시드 1년차 목표 아님).",
    },
    seriesA: {
      why: "시리즈A+ 는 다채널 GTM + 글로벌 진출. Sales-led + Marketing engine + Partnership ecosystem 모두 필요. 채널 다양화 + 검증된 채널 자본 투입.",
      actions: [
        { title: "다채널 GTM (Inbound + Outbound + Partnership + PR)", detail: "검증된 채널 자본 50-100% 증액. 새 채널 실험 분기별 1-2개." },
        { title: "글로벌 진출 (특히 미국·일본·동남아)", detail: "한국 SaaS 표준 진출 순서: 미국 (큰 시장) 또는 일본 (가까운 enterprise). 현지화 + 영업 채용." },
        { title: "Strategic Partnership (Reseller·Integration·OEM)", detail: "대형 파트너 1-3개 락인. AWS·Microsoft·Google Cloud Marketplace 등록." },
        { title: "Brand 구축 (PR + thought leadership + community)", detail: "분기 1회 임팩트 PR. CEO·CPO LinkedIn thought leadership. Community 운영 (Discord·Slack)." },
      ],
      pace: "글로벌 진출 12-18개월. ARR $10M+ 도달 시 시리즈B.",
      pitfall: "Sales-led 만 → CAC 폭발. Sales + Marketing + Partnership 균형 필수 (Andrew Chen).",
      evidence: "Reid Hoffman Blitzscaling: 시리즈A 후 글로벌·다채널 동시 진행이 표준.",
    },
  },

  // ─────────────────────────────────────────────────────────────
  "growth-engine": {
    indie: {
      why: "솔로는 1개 지표만 본다 — 보통 MRR. 너무 많이 보면 결정 못 함. 매주 자기 데이터 검토 + 솔로 founder 일기.",
      actions: [
        { title: "북극성 지표 1개 (MRR 또는 DAU 또는 기타)", detail: "Pieter Levels: PhotoAI 의 MRR 만 봄. 그 외 다 부차적. 인디는 단순함이 무기." },
        { title: "주간 자기 리뷰 (30분, 일요일)", detail: "이번 주 매출 + 트래픽 + 피드백 + 다음주 1개 실험. Marc Lou 모델." },
        { title: "월간 시스템 (subscriber·churn·LTV·CAC)", detail: "Stripe 대시보드 + ChartMogul 무료 티어. 분기 1회 깊은 분석." },
      ],
      pace: "주간 30분, 월간 2시간.",
      pitfall: "지표 5개 이상 추적 → 결정 마비. 단일 지표 + 분기 분석 충분.",
      evidence: "Pieter Levels·Marc Lou 공통: 단순한 1지표 + 매주 검토. AI tooling 으로 분석 자동화.",
    },
    bootstrap: {
      why: "1-3명은 KPI 트리 합의 + 위클리 KPI 리뷰. 너무 정교한 cohort 분석 시기상조 — 핵심 KPI 4-5개 + 매주 동기화.",
      actions: [
        { title: "KPI 트리 (NSM → 보조 지표 4-5개)", detail: "예: NSM=MRR / 보조=signup·activation·retention·churn. 매주 동기화." },
        { title: "주간 리뷰 + 월간 retro", detail: "매주 30분 KPI 검토 + 1개 실험 결정. 월간 retro: 무엇이 효과 있었는가·왜·다음 달." },
        { title: "Posthog 또는 Mixpanel 무료 티어", detail: "이벤트 트래킹 + 퍼널 + retention. 부트스트랩은 무료 도구 충분." },
      ],
      pace: "매주 30분, 월간 1시간.",
      pitfall: "KPI 너무 많이 → 동기화 시간이 분석 시간보다 길어짐. NSM 1개 + 보조 4-5개.",
      evidence: "MicroConf 부트스트랩 SaaS NRR 100%, ARR/FTE $125K (2024).",
    },
    seed: {
      why: "시드는 Growth team 또는 dedicated PM 채용 단계. Cohort retention + experimentation platform 정착.",
      actions: [
        { title: "Growth/Product PM 1명 채용", detail: "정량 분석 + 실험 설계. 시드 자본의 best ROI 채용 1명." },
        { title: "Cohort retention 분석 (week-over-week + month-over-month)", detail: "사용자 cohort 별 유지율. SaaS PMF 시그널 = 6개월 retention 30%+ (B2C) / 90%+ (B2B SaaS)." },
        { title: "Experimentation platform (LaunchDarkly·Posthog feature flags)", detail: "A/B 테스트 + feature flag + gradual rollout. 매주 1-2개 실험 표준." },
        { title: "North Star + L1/L2 metrics tree (Sean Ellis 모델)", detail: "NSM → input metrics 4-5개 → leading indicators. 매월 board update 표준화." },
      ],
      pace: "Growth PM 3개월 내. Experimentation 시스템 6개월 내.",
      pitfall: "Cohort 안 보고 absolute number 만 → '신규 유입 늘어서 좋아' 착각. Cohort retention 이 진짜.",
      evidence: "Sean Ellis Growth Hacking 표준. YC 시리즈A 전 cohort retention 데이터 필수.",
    },
    seriesA: {
      why: "시리즈A+ 는 Growth team + Data infra + Experimentation platform 정식 운영. 데이터 엔지니어 + 분석가 + Growth PM 분리.",
      actions: [
        { title: "Growth team 5-10명 (Growth PM + Data + Engineer + Marketer)", detail: "Andrew Chen 표준: dedicated growth org. 분기별 OKR + 실험 계획." },
        { title: "Data infra (Snowflake/BigQuery + dbt + Looker)", detail: "ETL 표준화 + semantic layer + self-service analytics. 데이터팀 1-3명." },
        { title: "Compounding growth loops 설계 (referral·content·marketplace)", detail: "Reid Hoffman + Andrew Chen 표준: 1차 loop + 2차 loop + 3차 loop. 분기 1개 새 loop 추가." },
        { title: "Experimentation OS (월 50-100 실험)", detail: "Statsig·LaunchDarkly + 통계 검증 자동화. 모든 PM 이 실험 가능한 셀프 서비스." },
      ],
      pace: "Growth org 6-12개월. Data infra 6개월.",
      pitfall: "Data infra 없이 Growth team 만 → 실험 결과 의심받음. Data engineer 가 1순위.",
      evidence: "Andrew Chen Founder's Playbook + Reid Hoffman Blitzscaling 표준.",
    },
  },

  // ─────────────────────────────────────────────────────────────
  "fundraising-readiness": {
    indie: {
      why: "1인 인디라도 자금이 필요하면 받아야 함 — 다만 외부 투자(VC) 가 아니라 정부 지원·공모전·크라우드펀딩 이 적합.",
      actions: [
        { title: "예비창업패키지 (사업자등록 전) 또는 1인 창조기업 지원센터", detail: "예비창업: 평균 5천 / 최대 1억 (보조금). 1인 창조기업: 사무공간 + 컨설팅 3년 무료." },
        { title: "와디즈·텀블벅 크라우드펀딩", detail: "리워드형 — 제품/서비스를 리워드로. 1인 사업자 성공 사례 다수 (그릴스유니온 등)." },
        { title: "도전! K-스타트업 등 공모전 (최대 5억)", detail: "범부처 12개 분야 — 인디도 다수 분야 신청 가능." },
        { title: "유료 고객 매출로 자생", detail: "Pieter Levels·Marc Lou 모델: 외부 자금 0. 매출이 곧 런웨이." },
      ],
      pace: "공모전·지원금 신청 분기별. 매출 자생은 시작 즉시.",
      pitfall: "VC 만 자금이라 생각 — 1인은 dilution + 시간 부담 큼. 비-희석 자금 (정부·공모전·크라우드) 우선.",
      evidence: "한국 1인 창업 지원 + 와디즈 1.2조 거래 + Marc Lou $1M+ 0 employees.",
    },
    bootstrap: {
      why: "부트스트랩은 매출 자생 + 정부 지원금 (희석 X) 우선. VC 는 마지막 옵션 — 너무 일찍 받으면 control 잃음.",
      actions: [
        { title: "초기창업패키지 (1억 / 딥테크 1.5억)", detail: "사업자등록 후 3년 이내. 자기부담 30% + 정부 70%." },
        { title: "청년창업사관학교 (만 39세 이하, 1억)", detail: "850명 선발 (글로벌 330·지역 310·투자형 140). 사업비 + 공간 + 코칭 패키지." },
        { title: "소진공 정책자금 (저금리 2.96%)", detail: "최대 7천만, 시중은행 5-7% 대비 압도적. 운영자금·시설자금 모두 가능." },
        { title: "TIPS 검토 (운영사 1-2억 + 정부 7억)", detail: "운영사 (액셀러레이터) 시드 투자 후 정부 매칭. 부트스트랩 → 시드 전환 검토 시." },
      ],
      pace: "지원사업 신청 분기별 (보통 1월~3월 메인 모집).",
      pitfall: "지원금 1개에 의존 → 신청 fail 시 운영 멈춤. 동시 2-3개 병행 신청.",
      evidence: "한국 부트스트랩 + 정부 지원: 청년창업사관학교 850명 + 초기창업패키지 + 소진공.",
    },
    seed: {
      why: "시드 단계는 VC + TIPS + 정부지원 동시 진행. 18-24개월 런웨이 확보 + 시리즈A 마일스톤 명확화.",
      actions: [
        { title: "TIPS 매칭 (운영사 1-2억 + 정부 R&D 5억 + 사업화 2억)", detail: "총 8-9억 패키지. 한국 시드 표준 코스." },
        { title: "시드 VC 라운드 (5-20억 / 딥테크 50억+)", detail: "463개 한국 액셀러레이터 + VC. 투자유치는 18-24개월 런웨이 목표." },
        { title: "런웨이 모델링 + use-of-cash plan", detail: "월 번레이트 × 24개월 = 자본. 마일스톤별 (PMF·ARR·확장) 분배." },
        { title: "Investor materials (피치덱 + 데이터룸)", detail: "10장 deck + 메트릭 + 팀 + 비전. 데이터룸 (Notion 또는 DocSend)." },
      ],
      pace: "시드 라운드 3-6개월. 시리즈A 18-24개월 후.",
      pitfall: "런웨이 18개월 미만 → VC 협상력 0. 24개월 + 마일스톤 명확이 표준.",
      evidence: "YC: $500K + 시드 $1-5M. 한국: 5천만~5억 + TIPS 7억.",
    },
    seriesA: {
      why: "시리즈A+ 는 본격 VC 라운드 + 글로벌 펀드 + 후속 라운드 준비. Burn multiple + Magic Number + NRR 등 정량 시그널이 핵심.",
      actions: [
        { title: "시리즈A 라운드 (30-100억 / 딥테크 100-900억)", detail: "한국 시리즈A 일반 30-100억. 반도체·로보틱스·바이오는 100-900억대 (디노티시아 900억)." },
        { title: "글로벌 펀드 검토 (a16z·Sequoia·Tiger·SoftBank)", detail: "글로벌 진출 계획 시 글로벌 VC 동참. 한국 cap table 의 1-2개 자리 권장." },
        { title: "메트릭 정비 (NRR·Burn Multiple·Magic Number·Rule of 40)", detail: "NRR 110%+ / Burn Multiple <2 / Magic Number >0.7 / Rule of 40 ≥40. 시리즈B 시그널." },
        { title: "이사회 + 거버넌스 정착 (Reid Hoffman)", detail: "분기 board meeting + 월간 update + 연간 strategy off-site." },
      ],
      pace: "시리즈A 6-9개월 라운드. 시리즈B 18-24개월 후.",
      pitfall: "Vanity metrics (GMV·signup) 만 강조 → VC 의심. NRR·Burn Multiple 등 진짜 SaaS 메트릭 필요.",
      evidence: "Reid Hoffman Blitzscaling. 한국 시리즈A 평균 30-100억 (스타트업레시피·thevc.kr).",
    },
  },

  // ─────────────────────────────────────────────────────────────
  "venture-certification": {
    indie: {
      why: "1인 인디라도 벤처기업 인증은 R&D 비용·세금 감면 + 정부 사업 자격 측면에서 가치 있음. 단, 매출 자생 인디는 R&D 비용이 적어 효과 제한적.",
      actions: [
        { title: "벤처기업 R&D 유형 검토 (가장 단순)", detail: "직전 4분기 R&D 비용 ≥ 매출의 5% 또는 5천만원+ — 1인 인디는 본인 인건비 R&D 분류 가능." },
        { title: "1인 창조기업 활성화 지원 활용", detail: "벤처인증 별도 — 무료 사무공간·컨설팅·세제 혜택." },
        { title: "도전! K-스타트업 공모전 입상 시 자동 자격 검토", detail: "공모전 입상 + 멘토링 + 후속 지원 패키지." },
      ],
      pace: "벤처인증 1-3개월 (서류 준비).",
      pitfall: "벤처인증 자체가 목적이 됨 — 인디는 매출이 우선. 인증은 부수적 도구.",
      evidence: "한국 1인 창조기업 + 벤처인증 R&D 유형 결합 사례.",
    },
    bootstrap: {
      why: "부트스트랩은 벤처인증으로 세제 혜택 (법인세 5년 50% 감면) + 정부지원 + 병역특례 까지 활용 가치 큼.",
      actions: [
        { title: "벤처인증 신청 (R&D 유형 또는 혁신성장 유형)", detail: "벤처기업확인 — 매출 5%+ R&D 또는 혁신성장 평가. 부트스트랩은 R&D 유형이 일반적." },
        { title: "K-Startup 통합공고 + 부처별 사업 매칭", detail: "벤처기업확인 후 정부지원 매칭 폭 확대. 분기별 모집 트래킹." },
        { title: "병역특례 검토 (전문연구요원/산업기능요원)", detail: "공동창업자 병역 미필 시 — 벤처기업 자격 + 학력·전공 조건. 큰 전략적 자산." },
        { title: "정책자금·R&D 자금 추가 신청 (3-5개 동시)", detail: "벤처인증 → 정책자금 한도 확대 + R&D 매칭 가산점." },
      ],
      pace: "벤처인증 2-3개월. 정부지원 분기별 신청.",
      pitfall: "벤처인증 후 활용 안 함 → 인증료·갱신비 손실. 벤처인증 = 정부지원·세제·병역 활용 시작점.",
      evidence: "벤처기업법: 법인세 5년 50% 감면 + R&D 25% 세액공제. 병역특례: 핵심 인재 유지.",
    },
    seed: {
      why: "시드 단계는 투자유치형 벤처기업 인증 (1억+ 시드 받음 시) → 가장 강력한 카테고리. 정부지원·세제·해외진출까지 모두 매칭.",
      actions: [
        { title: "벤처투자유형 벤처인증 (적격투자 5천만+·자본금 10%+)", detail: "적격투자기관 5천만원 이상 + 자본금의 10% 이상 유치 시 신청 요건 충족. 이후 벤처기업확인기관 평가·심의 통과 시 확인(자동 아님)." },
        { title: "TIPS 매칭 + 후속 정부지원", detail: "TIPS 7억 + 정부 R&D 추가 + 해외진출 지원. 시드 직후 1년 내 신청." },
        { title: "벤처기업 글로벌 진출 지원 (KOTRA·중기부)", detail: "해외사무소 + 박람회 + 바이어 매칭. 시리즈A 전 글로벌 진출 시드." },
        { title: "인재 채용 시 벤처기업 혜택 활용 (병역·세제)", detail: "병역특례 + 스톡옵션 비과세 (연 2억·누적 5억, 2027.12.31 까지)." },
      ],
      pace: "벤처인증 1개월. 정부지원 분기별.",
      pitfall: "벤처인증만 받고 후속 사업 신청 안 함 → 자원 낭비. 분기별 K-Startup 통합공고 트래킹.",
      evidence: "스톡옵션 비과세 2026: 연 2억·누적 5억 (2027.12.31 부여 분).",
    },
    seriesA: {
      why: "시리즈A+ 는 벤처기업 본격 활용 + 글로벌 진출 자금 매칭 + 정부 R&D 대형 과제 신청.",
      actions: [
        { title: "정부 대형 R&D 과제 (10억+) 신청", detail: "산업부·과기부 신성장 R&D — 시리즈A+ 기업 우선 대상. 벤처기업 가산점 큼." },
        { title: "글로벌 진출 자금 매칭 (KOTRA·KEB·중기부)", detail: "해외법인 설립 + 글로벌 박람회 + 지사 운영 자금." },
        { title: "벤처기업 본격 활용 (세제·인력·자금)", detail: "법인세 감면 + 스톡옵션 비과세 + 병역특례 + 정책자금 우대." },
        { title: "코스닥·스팩·M&A exit 시그널 (국내 대기업·해외 PE)", detail: "벤처기업 인증 = 코스닥 상장 시 가산점. M&A 시 valuation 가산." },
      ],
      pace: "정부 R&D 분기별. Exit 시그널 18-36개월 모니터링.",
      pitfall: "벤처기업 자격 갱신 놓침 → 혜택 일괄 정지. 갱신 시기 (3년) 캘린더 알림 필수.",
      evidence: "벤처기업법 + 스톡옵션 비과세 + 코스닥 상장 가산점.",
    },
  },
};

/**
 * 모드 라벨 — UI 칩 표시용 (한국어 + 영어 + 설명)
 */
export const MODE_DISPLAY_INFO: Record<OperatingMode, { ko: string; en: string; descKo: string; descEn: string }> = {
  indie: {
    ko: "1인 인디",
    en: "Solo indie",
    descKo: "혼자, 인건비 X, 도구·서버만",
    descEn: "Solo, no salary, tools only",
  },
  bootstrap: {
    ko: "부트스트랩",
    en: "Bootstrapped",
    descKo: "1-3명, 자비 또는 낮은 인건비",
    descEn: "1-3 people, low salary",
  },
  seed: {
    ko: "시드 단계",
    en: "Seed-funded",
    descKo: "3-5명, 표준 인건비 + 시드 자금",
    descEn: "3-5 people, market salary",
  },
  seriesA: {
    ko: "시리즈A 이상",
    en: "Series A+",
    descKo: "5-10명, 정규 인건비 + 마케팅",
    descEn: "5-10 people, full team",
  },
};

/**
 * stage 와 mode 로 콘텐츠 lookup. 없으면 null.
 */
export function getStageModeContent(
  stageId: string,
  mode: OperatingMode,
): ModeStageContent | null {
  return STARTUP_STAGE_MODE_CONTENT[stageId]?.[mode] ?? null;
}
