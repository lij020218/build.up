/**
 * BuildMethodData — task 별 여러 빌드 방법을 자세히 설명하는 데이터.
 *
 * 영어 웹 검증 출처 (2026-04 기준):
 *   • Anthropic Claude Code & Artifacts (figma.com/blog/introducing-claude-code-to-figma)
 *   • Lovable / Cursor / Bolt comparison (lovable.dev/guides/cursor-vs-bolt-vs-lovable-comparison)
 *   • OpenAI GPT Image 2 (community.openai.com — 2026.4.21 출시)
 *   • Codex + GPT Image 2 native integration (skywork.ai, buildfastwithai)
 *   • Claude + GPT Image 2 prompt engineering workflow (medium ai-systems-lab)
 *   • Figma to Framer 70% time reduction (xhtmlteam, gola.supply)
 */

export type BuildMethodTool = {
  name: string;
  url?: string;
  /** 비용 라벨 (예: "$20/mo", "무료", "$10~") */
  pricing?: string;
};

export type BuildMethodStep = {
  /** 스텝 제목 */
  title: string;
  /** 자세한 설명 */
  detail: string;
};

export type BuildMethod = {
  /** 고유 ID */
  id: string;
  /** 방법 이름 */
  name: string;
  /** 난이도 */
  difficulty: "초급" | "중급" | "고급";
  /** 적합한 사용자 */
  bestFor: string;
  /** 예상 시간 */
  timeEstimate: string;
  /** 예상 비용 */
  costEstimate: string;
  /** 한 줄 요약 */
  tagline: string;
  /** 사용 도구 */
  tools: BuildMethodTool[];
  /** 단계별 절차 */
  steps: BuildMethodStep[];
  /** 장점 */
  pros: string[];
  /** 단점 */
  cons: string[];
  /** 실제 사용 예 */
  example?: string;
};

export type BuildTask = {
  /** task ID */
  id: string;
  /** 한국어 task 이름 */
  name: string;
  /** 한 줄 도입 */
  intro: string;
  /** 방법 목록 */
  methods: BuildMethod[];
};

// ═════════════════════════════════════════════════════════════════════
// 1. MVP 코딩 — 5가지 방법
// ═════════════════════════════════════════════════════════════════════
const MVP_CODING_METHODS: BuildMethod[] = [
  {
    id: "lovable-fullstack",
    name: "Lovable 풀스택 (가장 빠름·비개발자)",
    difficulty: "초급",
    bestFor: "비개발자·1인 인디·디자이너",
    timeEstimate: "프로토타입 2~6시간, MVP 1~3일",
    costEstimate: "무료 시작 → $20/mo (Pro)",
    tagline: "채팅으로 풀스택 앱 (프론트+백+DB+인증+배포) 한 번에. 코드 1줄 안 써도 됨.",
    tools: [
      { name: "Lovable", url: "https://lovable.dev", pricing: "$20/mo" },
      { name: "Supabase (자동 통합)", url: "https://supabase.com", pricing: "무료 50K MAU" },
      { name: "Stripe (1-클릭)", url: "https://stripe.com", pricing: "거래당 2.9% + $0.3" },
    ],
    steps: [
      { title: "Lovable 가입 후 \"What do you want to build?\" 프롬프트 입력", detail: "예: \"한국 카페 사장님이 매출 분석할 수 있는 SaaS\". Lovable 가 데이터 모델·UI·API 자동 설계." },
      { title: "Supabase 연결 (1-클릭)", detail: "Lovable 가 자동으로 PostgreSQL 테이블 생성·인증 설정·RLS 정책 까지." },
      { title: "Stripe 연결 (구독 결제)", detail: "체크박스 1개로 결제 페이지 자동 생성. 한국 신용카드 OK." },
      { title: "도메인 연결·배포", detail: "Lovable 자체 호스팅 또는 Vercel·Netlify 으로 export. 1-클릭 배포." },
      { title: "사용자 5-10명에게 보여주고 반응 확인", detail: "반응 좋으면 그대로 운영. 부족하면 Cursor + Claude Code 로 프로덕션 재작성 (방법 4 참고)." },
    ],
    pros: [
      "코딩 0줄 — 디자이너·창업자도 가능",
      "프론트+백+DB+인증+결제 한 번에 (Bolt 처럼 export 후 재구축 불필요)",
      "한국어 프롬프트 OK, 깨끗한 React 코드 생성",
      "Marc Lou 패턴 — 6-8주 안에 출시 가능",
    ],
    cons: [
      "복잡한 비즈니스 로직·커스텀 백엔드는 한계",
      "월 $20 이상 사용 시 Cursor 보다 장기 비용 큼",
      "특정 패턴에 갇혀서 '깊은 차별화' 어려움",
    ],
    example: "Marc Lou — ShipFast·CodeFast 등 12+ SaaS 모두 6-8주 내 출시. Lovable + Cursor 조합.",
  },
  {
    id: "v0-vercel",
    name: "v0 by Vercel (Next.js·React 친화)",
    difficulty: "초급",
    bestFor: "프론트엔드 개발자·Vercel 스택 사용자",
    timeEstimate: "랜딩 1-2시간, 풀앱 2-5일",
    costEstimate: "무료 (Hobby) → $20/mo (Premium)",
    tagline: "프롬프트 → Next.js + Tailwind + shadcn/ui 프로덕션 코드. Vercel 1-클릭 배포.",
    tools: [
      { name: "v0 by Vercel", url: "https://v0.app", pricing: "무료~$20/mo" },
      { name: "Vercel 호스팅", url: "https://vercel.com", pricing: "무료 시작" },
      { name: "shadcn/ui (자동 사용)", url: "https://ui.shadcn.com" },
    ],
    steps: [
      { title: "v0.app 에서 프롬프트 입력 (무료 시작)", detail: "예: \"SaaS 랜딩 페이지 + 가격 테이블 + 회원가입\". v0 가 컴포넌트 단위로 React + Tailwind 코드 생성." },
      { title: "코드 export → 로컬 또는 GitHub", detail: "v0 가 npm 명령어 제공 (`npx shadcn add ...`). VS Code/Cursor 에서 바로 사용." },
      { title: "Supabase·DB 연결 (수동)", detail: "v0 는 프론트엔드 중심 — 백엔드는 본인이 추가. Supabase·Stripe SDK 직접 import." },
      { title: "Vercel 배포", detail: "GitHub push → Vercel 자동 배포. PR 마다 preview URL 자동 생성." },
    ],
    pros: [
      "shadcn/ui 표준 컴포넌트 → 코드 품질·일관성 압도적",
      "Vercel·Next.js·React 사용 시 가장 자연스러움",
      "코드 소유 (Lovable 처럼 락인 X)",
      "디자인 → 프로덕션 React 코드 변환 정확도 1위",
    ],
    cons: [
      "백엔드·DB는 본인이 구축 (전체 풀스택 아님)",
      "Next.js·Tailwind 모르면 후속 개발 어려움",
      "Vercel 스택에 종속적 (다른 호스팅과 친화성 낮음)",
    ],
    example: "Pieter Levels — RemoteOK 신규 페이지 v0 로 30분 만에. 대형 스타트업도 Vercel + v0 표준.",
  },
  {
    id: "bolt-stackblitz",
    name: "Bolt.new (브라우저, 설치 0)",
    difficulty: "초급",
    bestFor: "PC 환경 안 되는 외부·여행 중 빠른 실험",
    timeEstimate: "프로토타입 1-3시간",
    costEstimate: "무료 1M 토큰/월 → $20/mo",
    tagline: "브라우저에서 즉시. Anthropic Claude 기반. 설치 X, 로컬 환경 X.",
    tools: [
      { name: "Bolt.new (StackBlitz)", url: "https://bolt.new", pricing: "무료~$20/mo" },
    ],
    steps: [
      { title: "bolt.new 접속 후 프롬프트 입력", detail: "WebContainers 위에서 Node.js 환경 즉시 부팅 (브라우저 안 가상 OS)." },
      { title: "코드·미리보기 동시 확인", detail: "왼쪽 코드 / 오른쪽 미리보기. Claude 가 멀티파일 동시 편집." },
      { title: "GitHub export 또는 Stackblitz 호스팅", detail: "1-클릭 GitHub Push 또는 Stackblitz 자체 호스팅 (무료)." },
      { title: "복잡해지면 로컬로 옮겨 Cursor·Claude Code 사용", detail: "Bolt 는 빠른 실험에 최적, 장기 유지보수는 IDE 권장." },
    ],
    pros: [
      "설치 0 — Chromebook·iPad 에서도 가능",
      "Anthropic Claude 직접 사용 (품질 좋음)",
      "무료 1M 토큰/월 — 실험에 충분",
    ],
    cons: [
      "복잡한 백엔드·환경 변수 관리 어려움",
      "장기 유지보수에는 부적합",
      "Lovable 대비 통합 기능 부족",
    ],
  },
  {
    id: "cursor-claude-code",
    name: "Cursor + Claude Code (실전 풀스택, 표준 패턴)",
    difficulty: "중급",
    bestFor: "개발자·진지한 SaaS 빌더",
    timeEstimate: "MVP 2~4주, 프로덕션 6~12주",
    costEstimate: "$40/mo ($20 Cursor + $20 Claude Code)",
    tagline: "2026 인디 해커 표준 조합. Cursor 인라인 편집 + Claude Code 백그라운드 자동화.",
    tools: [
      { name: "Cursor", url: "https://cursor.com", pricing: "$20/mo (Pro)" },
      { name: "Claude Code", url: "https://claude.com/claude-code", pricing: "$20/mo (Pro)" },
      { name: "shadcn/ui", url: "https://ui.shadcn.com", pricing: "무료" },
      { name: "Supabase + Stripe", pricing: "무료 시작" },
    ],
    steps: [
      { title: "프로젝트 초기 세팅 (15분)", detail: "Cursor 에서 `create-next-app` → Tailwind + shadcn/ui 설치. Supabase 클라이언트 추가." },
      { title: "Claude Code 로 아키텍처 + 기본 구조 자동 생성", detail: "터미널에서 `claude` 실행. \"Build SaaS skeleton with auth, dashboard, billing\" → 멀티파일 자동 생성·테스트 작성." },
      { title: "Cursor 에서 시각적으로 UI 다듬기", detail: "각 페이지 컴포넌트를 Cursor `Cmd+K` 로 인라인 편집. Pieter Levels 패턴." },
      { title: "Claude Code 로 복잡한 리팩토링", detail: "DB schema 변경, API 일관성 검증, 테스트 자동화는 Claude Code 가 잘 함. \"Refactor X across all files\"." },
      { title: "매일 git commit + Vercel 자동 배포", detail: "feature branch → PR → preview URL → main merge. 인디 해커 표준 워크플로우." },
    ],
    pros: [
      "코드 100% 소유 + 깊은 커스터마이징 가능",
      "Marc Lou·Pieter Levels 패턴 (Cursor + Claude Code 26% 빠른 개발)",
      "복잡한 비즈니스 로직·외부 API 통합에 강함",
      "장기 유지보수 표준",
    ],
    cons: [
      "Lovable 대비 초기 셋업 시간 큼 (한나절~1일)",
      "Next.js·React·Tailwind·Supabase 기본 지식 필요",
      "월 $40 비용 (Lovable 단일 $20 대비 2배)",
    ],
    example: "Found.One 본 서비스도 이 조합으로 빌드됨. Cursor 인라인 편집 + Claude Code 멀티파일 리팩토링.",
  },
  {
    id: "claude-code-only",
    name: "Claude Code 단독 (터미널 우선, 시니어 개발자)",
    difficulty: "고급",
    bestFor: "터미널 친화 시니어 개발자·인프라 작업",
    timeEstimate: "MVP 1~3주",
    costEstimate: "$20/mo (Claude Pro)",
    tagline: "Anthropic 의 에이전트 도구. 터미널 + 멀티파일 + 테스트 자동.",
    tools: [
      { name: "Claude Code (Anthropic)", url: "https://claude.com/claude-code", pricing: "$20/mo" },
      { name: "VS Code 또는 Vim (선호 IDE)", pricing: "무료" },
    ],
    steps: [
      { title: "Claude Code 설치 (npm install -g @anthropic/claude-code)", detail: "터미널에 `claude` 명령어 등록. API 키 셋업 (또는 Pro 구독)." },
      { title: "프로젝트 디렉터리에서 `claude` 실행", detail: "에이전트가 codebase 전체 읽고 컨텍스트 파악. CLAUDE.md 파일에 프로젝트 규칙 기록." },
      { title: "자연어로 요구사항 → 자동 실행", detail: "\"Add Stripe webhook handler with idempotency\" → 멀티파일 편집·테스트 작성·git commit 자동." },
      { title: "리뷰 + 승인", detail: "Claude Code 가 변경사항을 diff 로 보여줌. 승인 시 적용, 거부 시 재시도." },
    ],
    pros: [
      "복잡한 멀티파일 리팩토링 1위 (Cursor 보다 강함)",
      "테스트·git·shell 명령 자동 (백그라운드 작업)",
      "토큰 효율 (Cursor 대비 5.5배 절약)",
      "서버 인프라·데브옵스 작업에 최적",
    ],
    cons: [
      "시각적 편집 X (Cursor 처럼 빠른 UI 수정 어려움)",
      "터미널 친화 필요 — 비개발자 어려움",
      "초보 개발자에게는 출력 압도적",
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// 2. 랜딩 페이지 제작 — 5가지 방법
// ═════════════════════════════════════════════════════════════════════
const LANDING_PAGE_METHODS: BuildMethod[] = [
  {
    id: "claude-artifacts",
    name: "Claude Artifacts 직접 제작 (가장 빠름)",
    difficulty: "초급",
    bestFor: "1인 인디·디자인 시안 빠르게 보고 싶은 사람",
    timeEstimate: "30분~2시간",
    costEstimate: "Claude Pro $20/mo (Free 플랜도 가능)",
    tagline: "Claude 에 \"SaaS 랜딩 만들어줘\" → 바로 작동하는 React 코드 + 미리보기.",
    tools: [
      { name: "Claude (Anthropic)", url: "https://claude.ai", pricing: "무료~$20/mo" },
    ],
    steps: [
      { title: "claude.ai 접속 → 새 채팅", detail: "예: \"한국 1인 SaaS 랜딩 페이지. 헤드라인·서브헤딩·스크린샷 3개·CTA·가격표·FAQ. shadcn/ui 컴포넌트.\"" },
      { title: "Artifacts 패널에서 즉시 미리보기", detail: "오른쪽에 렌더링된 페이지 + 코드 동시 표시. 스크롤·클릭 가능한 실제 React." },
      { title: "프롬프트로 반복 수정", detail: "\"색상을 미드나이트 블루로\", \"hero 에 애니메이션 추가\", \"가격을 한국 원화로\" — 매 수정마다 자동 재렌더링." },
      { title: "코드 export → 로컬 프로젝트로", detail: "코드 복사 → Cursor·VS Code 에 붙여넣기. 또는 Vercel 에 직접 배포 (Claude 가 npm 명령어 제공)." },
    ],
    pros: [
      "0초 설치 — 채팅만으로 시작",
      "원하는 디자인 즉시 확인 + 무한 반복 수정",
      "shadcn/ui·Tailwind 표준 코드 (재사용 가능)",
      "프로토타이핑·아이디어 검증에 최적",
    ],
    cons: [
      "한 페이지 정도가 적정 — 풀 사이트는 한계",
      "이미지·고품질 사진은 별도 (다른 방법 결합)",
      "복잡한 인터랙션·백엔드 연결은 부족",
    ],
  },
  {
    id: "framer-design-first",
    name: "Framer (디자이너 픽, 코드 0)",
    difficulty: "초급",
    bestFor: "디자이너·브랜딩 강조 매장·SaaS",
    timeEstimate: "1~3일",
    costEstimate: "$10~$30/mo",
    tagline: "Webflow 후속 표준. AI 레이아웃 + 정밀 애니메이션. 개발자 없이도 픽셀 완벽.",
    tools: [
      { name: "Framer", url: "https://framer.com", pricing: "$10~30/mo" },
      { name: "Framer AI", pricing: "포함" },
    ],
    steps: [
      { title: "Framer 가입 → 새 프로젝트", detail: "AI 프롬프트 \"SaaS 랜딩\" 으로 초기 레이아웃 자동 생성." },
      { title: "디자인 정밀 조정 (시각 편집)", detail: "Figma 처럼 드래그·텍스트·이미지 편집. 반응형은 자동." },
      { title: "Framer 모션 (Framer Motion 라이브러리 통합)", detail: "스크롤 트리거·hover·페이지 트랜지션 시각적으로 설정. 코드 1줄 X." },
      { title: "도메인 연결 + 배포", detail: "Framer 호스팅 자체 사용 또는 자체 도메인 연결. CDN 자동." },
    ],
    pros: [
      "디자이너 출신에게 가장 자연스러움",
      "Framer Motion 애니메이션 표준 (시각 편집)",
      "70% 시간 단축 (Webflow·코딩 대비)",
      "Figma 디자인 → Framer import 정확도 압도적",
    ],
    cons: [
      "월 비용 ($10-30/mo) — 무료 SaaS 대비 비쌈",
      "코드 export 어려움 (lock-in)",
      "복잡한 동적 데이터·DB 연결 한계",
    ],
  },
  {
    id: "v0-shadcn-cursor",
    name: "v0 + shadcn/ui + Cursor (개발자 표준)",
    difficulty: "중급",
    bestFor: "프론트엔드 개발자·코드 소유 중요",
    timeEstimate: "1~3일",
    costEstimate: "$20/mo (Cursor) — v0·shadcn 무료",
    tagline: "v0 로 컴포넌트 생성 → shadcn 으로 표준화 → Cursor 로 통합.",
    tools: [
      { name: "v0 by Vercel", url: "https://v0.app", pricing: "무료~$20/mo" },
      { name: "shadcn/ui", url: "https://ui.shadcn.com", pricing: "무료" },
      { name: "Cursor", url: "https://cursor.com", pricing: "$20/mo" },
    ],
    steps: [
      { title: "v0 에서 hero 섹션 프롬프트 → 코드 받기", detail: "\"SaaS hero with gradient + CTA\" → React + Tailwind + shadcn 컴포넌트." },
      { title: "shadcn add 명령으로 필요 컴포넌트 설치", detail: "`npx shadcn add card button dialog` 등. 코드가 본인 프로젝트에 복사됨 (락인 X)." },
      { title: "Cursor 에서 페이지 합치고 콘텐츠 채우기", detail: "Cmd+K 로 인라인 편집·반응형 조정. Tailwind 클래스 자동완성." },
      { title: "Vercel 배포 + 도메인 연결", detail: "GitHub push → Vercel 자동 배포. PR preview URL 활용." },
    ],
    pros: [
      "코드 100% 소유 + 영구 사용",
      "shadcn/ui = 2026 표준 (Apple 수준 컴포넌트 무료)",
      "Vercel·Next.js 풀 스택 친화",
      "장기 유지보수 표준",
    ],
    cons: [
      "Next.js·Tailwind 기본 지식 필요",
      "초기 셋업 시간 (vs Lovable 즉시)",
    ],
    example: "Cursor 자체 랜딩 (cursor.com), Vercel 자체 (vercel.com) 등 — 모두 이 패턴.",
  },
  {
    id: "figma-claude-code",
    name: "Figma → Claude Code (디자인 우선)",
    difficulty: "중급",
    bestFor: "디자이너·개발자 협업·기존 Figma 시안 있는 경우",
    timeEstimate: "2~5일",
    costEstimate: "Figma 무료 + Claude Code $20/mo",
    tagline: "Figma 에서 디자인 → Claude Code 가 코드로 변환. 양방향 (Code → Figma 도 가능).",
    tools: [
      { name: "Figma", url: "https://figma.com", pricing: "무료~$15/mo" },
      { name: "Claude Code", url: "https://claude.com/claude-code", pricing: "$20/mo" },
      { name: "Anthropic Figma plugin", pricing: "무료" },
    ],
    steps: [
      { title: "Figma 에서 디자인 시안 작성", detail: "프레임·컴포넌트·variants 활용. Auto Layout 권장 (코드 변환 정확도↑)." },
      { title: "Claude Code 에서 \"Build this Figma design\" 명령", detail: "Anthropic Figma 플러그인 활성화 → 프레임 선택 → Claude Code 가 React + Tailwind 코드로 변환." },
      { title: "역방향: 코드 변경 → Figma 자동 동기화 (2026 신규)", detail: "Claude Code 에서 \"Send this to Figma\" → 작동하는 React UI 가 Figma 의 편집 가능한 layer 로 캡처." },
      { title: "디자이너·개발자 양방향 반복", detail: "디자이너는 Figma 에서 수정, 개발자는 Claude Code 에서 코드 수정 — 자동 동기화." },
    ],
    pros: [
      "디자이너·개발자 협업 최적",
      "기존 Figma 자산 재사용",
      "양방향 동기화 (2026 출시) — 디자인·코드 분리 없음",
      "엔터프라이즈·대규모 팀에 강함",
    ],
    cons: [
      "Figma 학습 필요 (개발자 입장)",
      "1인 인디에게는 과한 워크플로우",
      "Auto Layout 안 쓴 디자인은 변환 정확도↓",
    ],
  },
  {
    id: "gpt-image-codex",
    name: "GPT Image 2 + Codex (비주얼 콘셉트 우선)",
    difficulty: "고급",
    bestFor: "비주얼·아트 강조 SaaS·캠페인 페이지",
    timeEstimate: "2~4일",
    costEstimate: "ChatGPT Plus $20/mo + Codex $20/mo",
    tagline: "GPT Image 2 로 hero 이미지·OG·일러스트 생성 → Codex 가 코드 생성.",
    tools: [
      { name: "GPT Image 2 (ChatGPT)", url: "https://chatgpt.com", pricing: "$20/mo" },
      { name: "OpenAI Codex", url: "https://openai.com/codex", pricing: "$20/mo+" },
    ],
    steps: [
      { title: "Claude 에 \"Hero 이미지 콘셉트 + 프롬프트 5개 만들어줘\"", detail: "Claude 가 비주얼 디렉션 + GPT Image 2 가 알아듣는 형태로 프롬프트 다듬어줌 (verified workflow: 'Claude 가 prompt engineering, GPT Image 2 가 generation')." },
      { title: "GPT Image 2 로 hero 이미지·OG 이미지·아이콘 생성", detail: "1536×1024 hero / 1200×630 OG / 1024×1024 icon — 정확한 픽셀 사이즈 지정. 한국어 텍스트 99% 정확." },
      { title: "Codex 에 \"이 이미지로 랜딩 페이지 만들어\"", detail: "Codex (OpenAI) 가 GPT Image 2 와 native 통합. 이미지 → React 코드 자동 변환." },
      { title: "Vercel 배포 + 캠페인 자산 한 번에", detail: "Codex 가 OG·favicon·Twitter card 까지 자동 생성." },
    ],
    pros: [
      "비주얼 콘셉트 강력 (Midjourney 수준 + 코드)",
      "GPT Image 2 의 한국어 텍스트 99% 정확도",
      "캠페인 자산 (OG·SNS·banner) 일괄 생성",
      "OpenAI 생태계 안에서 한 번에 끝",
    ],
    cons: [
      "월 $40+ 비용 (ChatGPT Plus + Codex)",
      "프롬프트 엔지니어링 학습 곡선",
      "이미지 일관성 (브랜드 동일 톤 유지) 어려움",
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// 3. 디자인·이미지 생성 — 4가지 방법
// ═════════════════════════════════════════════════════════════════════
const DESIGN_IMAGE_METHODS: BuildMethod[] = [
  {
    id: "gpt-image-2-direct",
    name: "GPT Image 2 직접 (한국어 텍스트 강력)",
    difficulty: "초급",
    bestFor: "한국 SaaS·한글 텍스트 포함 자산",
    timeEstimate: "이미지당 30초~3분",
    costEstimate: "ChatGPT Plus $20/mo (이미지당 약 30 credits)",
    tagline: "2026.4.21 출시 — DALL-E 후속, 4K, 한국어 99% 정확.",
    tools: [
      { name: "GPT Image 2 (ChatGPT)", url: "https://chatgpt.com", pricing: "$20/mo" },
    ],
    steps: [
      { title: "ChatGPT 에서 이미지 프롬프트", detail: "\"미니멀 SaaS 로고, 미드나이트 블루, '파운드원' 한글 포함\" — 한국어 텍스트 99% 정확하게 렌더링." },
      { title: "사이즈·비율 명시", detail: "1024×1024 (square), 1536×1024 (hero), 1024×1792 (vertical), 1200×630 (OG)." },
      { title: "Thinking 모드로 캠페인 자산 일괄", detail: "한 프롬프트로 Instagram 1:1 + Twitter 3:1 + LinkedIn wide + Facebook OG 동시 생성. 브랜드 일관성." },
      { title: "다운로드 → Figma·Canva 에서 마무리", detail: "필요 시 텍스트 추가 편집." },
    ],
    pros: [
      "한국어 텍스트 99% 정확 (DALL-E 시대 한글 깨짐 해소)",
      "4K 해상도·3초 생성",
      "Thinking 모드 — 캠페인 일괄",
      "OpenAI Codex 와 native 통합",
    ],
    cons: [
      "ChatGPT Plus 구독 필수",
      "Midjourney 대비 \"손맛\" 부족 (사진·일러스트 표준)",
      "이미지당 30 credits (월 1500 무료, 이후 추가 결제)",
    ],
  },
  {
    id: "midjourney-figma",
    name: "Midjourney v7 + Figma (디자이너 표준)",
    difficulty: "중급",
    bestFor: "비주얼 강조·아트 디렉션 중요",
    timeEstimate: "이미지당 1-5분, 캠페인 1일",
    costEstimate: "Midjourney $10~30/mo + Figma 무료",
    tagline: "디자이너 픽 — 의도적 라이팅·구성·텍스처 \"손맛\" 압도적.",
    tools: [
      { name: "Midjourney v7", url: "https://midjourney.com", pricing: "$10~30/mo" },
      { name: "Figma", url: "https://figma.com", pricing: "무료" },
    ],
    steps: [
      { title: "Midjourney 웹 (2026 출시) 또는 Discord 에서 프롬프트", detail: "\"isometric SaaS dashboard, midnight blue, glassmorphism --v 7 --ar 16:9\"." },
      { title: "변형·반복으로 톤 통일", detail: "Vary·Remix 로 같은 스타일 다양한 변형. 브랜드 가이드 만들기." },
      { title: "Figma 에 import 후 텍스트·로고 추가", detail: "Midjourney 는 텍스트 약함 → Figma 에서 정확한 한글 텍스트 입힘." },
      { title: "OG·SNS·banner 다양 export", detail: "Figma 에서 export at 1x·2x·3x." },
    ],
    pros: [
      "아트 퀄리티 절대 1위 — 디자이너급 결과",
      "스타일 일관성 (브랜드 가이드 적용)",
      "Discord·Web 양쪽 가능",
    ],
    cons: [
      "텍스트 정확도 약함 (한글 깨짐)",
      "월 $10+ 구독 필수",
      "프롬프트 엔지니어링 학습",
    ],
  },
  {
    id: "claude-design",
    name: "Claude Design (디자인 시스템 자동)",
    difficulty: "초급",
    bestFor: "전체 브랜드 시스템 한 번에 만들고 싶을 때",
    timeEstimate: "1-2시간",
    costEstimate: "Claude Pro $20/mo",
    tagline: "Anthropic 의 신규 디자인 도구. 컬러·타이포·컴포넌트 시스템 일괄 생성.",
    tools: [
      { name: "Claude Design", url: "https://claude.ai", pricing: "$20/mo" },
    ],
    steps: [
      { title: "Claude 에 브랜드 콘셉트 입력", detail: "\"미드나이트 블루 SaaS, Apple-style, B2B\" — Claude 가 컬러 팔레트·타이포그래피·컴포넌트 동시 제안." },
      { title: "디자인 시스템 export", detail: "Tailwind config·shadcn 테마·Figma 토큰 형태로 export." },
      { title: "Claude Code·Cursor 와 결합", detail: "디자인 시스템을 코드 안에서 즉시 사용 — 프로토타입 코드 생성까지 한 번에." },
    ],
    pros: [
      "디자인 시스템 전체 일관성 (단일 도구)",
      "Tailwind·shadcn 코드 즉시 export",
      "Anthropic 생태계 통합 (Claude Code 와 결합)",
    ],
    cons: [
      "복잡한 일러스트·이미지는 한계 (그림은 GPT Image 2·Midjourney)",
      "Claude Pro 필수",
    ],
  },
  {
    id: "canva-looka",
    name: "Canva AI + Looka (비개발자 만능)",
    difficulty: "초급",
    bestFor: "비개발자·디자인 외주 대신 본인 빠르게",
    timeEstimate: "30분~2시간",
    costEstimate: "Canva 무료 / Looka $20~",
    tagline: "한국어 UI·템플릿 풍부. 로고·OG·SNS 한 번에.",
    tools: [
      { name: "Canva (Magic Design)", url: "https://canva.com", pricing: "무료~$15/mo" },
      { name: "Looka", url: "https://looka.com", pricing: "$20~" },
    ],
    steps: [
      { title: "Looka 에 브랜드 정보 입력", detail: "이름·업종·키워드·컬러 → AI 가 로고 후보 100+개 생성. 선호도 학습." },
      { title: "선택한 로고 + 브랜드킷 다운로드", detail: "PNG·SVG·favicon·소셜 cover 자동." },
      { title: "Canva 에서 OG·banner·이메일 헤더 제작", detail: "한국어 템플릿 풍부. Magic Design AI 로 1-클릭 생성." },
      { title: "프린트·SNS·웹 다용도 export", detail: "1x·2x·PDF·MP4 등 자유 export." },
    ],
    pros: [
      "비개발자 친화 — 디자인 외주 비용 절감",
      "한국어 UI·템플릿 풍부",
      "Looka 로고·Canva 마케팅 분업 표준",
    ],
    cons: [
      "고품질 일러스트는 부족",
      "Looka 로고는 \"AI 풍\" 알아채기 쉬움 (브랜드 차별화↓)",
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// 4. 이름·미션 — 4가지 방법
// ═════════════════════════════════════════════════════════════════════
const NAME_MISSION_METHODS: BuildMethod[] = [
  {
    id: "claude-naming",
    name: "Claude/ChatGPT 직접 (가장 빠름)",
    difficulty: "초급",
    bestFor: "1인 인디·이름·슬로건 빠르게",
    timeEstimate: "30분~2시간",
    costEstimate: "Claude/ChatGPT 무료~$20/mo",
    tagline: "한 번의 프롬프트로 이름 30개 + 미션 + 슬로건 + 도메인 후보 생성.",
    tools: [
      { name: "Claude (Anthropic)", url: "https://claude.ai", pricing: "무료~$20/mo" },
      { name: "ChatGPT", url: "https://chatgpt.com", pricing: "무료~$20/mo" },
    ],
    steps: [
      { title: "Claude 에 컨텍스트 + 제약 입력", detail: "예: \"한국 카페 사장님 매출 분석 SaaS, 미드나이트 톤, 영문 5-7자, 도메인 가능, 한국 발음 좋음\". Claude 가 30개+ 후보 생성." },
      { title: "도메인 가용성 확인 (Namelix·Domainr)", detail: "후보 5-10개 → namelix.com / domainr.com 에서 .com·.io·.app 도메인 동시 확인." },
      { title: "친구 10명 블라인드 테스트", detail: "\"이름만 보고 무슨 서비스 같아?\" 1초 안에 직관 파악. 다수가 동일하게 답 = 합격." },
      { title: "미션 한 문장 + 슬로건 1줄 확정", detail: "\"우리는 [WHO]가 [PROBLEM]을 [SOLUTION]으로 해결하도록 합니다\" 템플릿. 슬로건은 5-7자." },
    ],
    pros: [
      "30분 안에 30+ 후보 생성",
      "한국어·영어 양쪽 동시 검토",
      "프리·즉시 시작",
      "수정 무한 반복",
    ],
    cons: [
      "AI 생성 이름은 차별성 약할 수 있음 (다듬기 필요)",
      "도메인 가용성은 별도 확인",
    ],
    example: "Pieter Levels: \"Photo AI\" / \"Remote OK\" — 단순한 직관 이름이 강력. AI 가 만들기 쉬움.",
  },
  {
    id: "namelix-domain",
    name: "Namelix (AI 브랜드명 + 도메인 동시)",
    difficulty: "초급",
    bestFor: "도메인 확보 핵심·짧은 영문 이름 원할 때",
    timeEstimate: "20분~1시간",
    costEstimate: "무료",
    tagline: "AI 브랜드명 100개 + 즉시 도메인 가능 여부 표시.",
    tools: [
      { name: "Namelix", url: "https://namelix.com", pricing: "무료" },
      { name: "Brandmark (로고 동반)", url: "https://brandmark.io", pricing: "$25 일회성" },
    ],
    steps: [
      { title: "Namelix 키워드·산업·스타일 입력", detail: "예: \"cafe analytics, modern, short\" → AI 가 브랜드명 후보 100+개." },
      { title: "도메인 가능 여부 즉시 확인", detail: "각 후보에 .com 가능 표시. 가능한 것만 필터." },
      { title: "선호도 학습 + 재생성", detail: "마음에 드는 거 hearted → AI 가 비슷한 톤 더 생성." },
      { title: "(선택) Brandmark 로고 동시 생성", detail: "Namelix 와 통합 — 이름 선택 후 Brandmark 가 즉시 로고 후보 제공 ($25 일회성)." },
    ],
    pros: [
      "도메인 + 이름 한 번에 (시간 절약 핵심)",
      "Brandmark 로고 통합 — 풀 브랜드킷",
      "100% 무료 (이름 부분)",
    ],
    cons: [
      "한국어 이름 제한적 (영문 중심)",
      "AI 생성 풍 — \"-ly\", \"-ify\" 같은 흔한 패턴 다수",
    ],
  },
  {
    id: "looka-fullkit",
    name: "Looka (이름 + 로고 + 풀 브랜드킷)",
    difficulty: "초급",
    bestFor: "디자인 외주 대신 빠르게 통합 패키지",
    timeEstimate: "2-4시간",
    costEstimate: "Basic $20 / Premium $96 일회성",
    tagline: "이름 + 로고 + 컬러 팔레트 + 폰트 + 명함·SNS·이메일 헤더 한 번에.",
    tools: [
      { name: "Looka", url: "https://looka.com", pricing: "$20~$96 일회성" },
    ],
    steps: [
      { title: "Looka 가입 + 브랜드 정보 입력", detail: "이름·산업·키워드·선호 컬러·스타일 → AI 가 로고 후보 100+개 생성." },
      { title: "선호도 학습 (좋아요/싫어요)", detail: "후보 보면서 클릭 → AI 가 본인 스타일 학습 + 더 정확한 후보 생성." },
      { title: "최종 로고 선택 + 풀 브랜드킷 다운로드", detail: "PNG·SVG·favicon·SNS cover·명함·이메일 시그니처 일괄 PDF·zip 다운로드." },
      { title: "한국어 폰트 별도 적용", detail: "Looka 폰트는 영문 위주 → 한국 사용 시 Pretendard·Spoqa Han Sans 등 한글 폰트 별도 적용." },
    ],
    pros: [
      "이름·로고·풀 브랜드킷 한 번에 (디자인 외주 비용 1/10)",
      "수정 무한, 재다운로드 가능",
      "비개발자 친화",
    ],
    cons: [
      "AI 풍 로고 (브랜드 차별화 한계)",
      "한국어 텍스트 통합 약함",
      "투자 받는 스타트업에는 추천 안 함 (디자이너 위임)",
    ],
  },
  {
    id: "test-and-validate",
    name: "검증 워크시트 (이름 결정 후 필수)",
    difficulty: "초급",
    bestFor: "이름 후보 좁히기 단계",
    timeEstimate: "1-2일",
    costEstimate: "무료",
    tagline: "이름 정한 다음 친구·잠재 고객·SNS 검증 — 출시 후 바꾸면 SEO·브랜드 손실 큼.",
    tools: [
      { name: "Google Forms 또는 Typeform", url: "https://typeform.com", pricing: "무료" },
      { name: "USPTO·KIPRIS (상표 검색)", url: "https://www.kipris.or.kr", pricing: "무료" },
    ],
    steps: [
      { title: "10명 블라인드 테스트 (이름만 보여주기)", detail: "\"이 이름만 보고 무슨 서비스인지 추측해주세요\" 1초 안에 답하라고. 같은 답 5명 이상 = 합격." },
      { title: "도메인 가능 + .com 우선 (없으면 .io / .app)", detail: "namecheap·gandi 에서 가격 확인. 신규 도메인 1-2만원/년." },
      { title: "KIPRIS·USPTO 상표 검색", detail: "동일·유사 상표 사전 확인. 이미 등록된 이름이면 거절·법적 리스크." },
      { title: "SNS 핸들 동시 확보", detail: "Twitter·Instagram·LinkedIn 같은 핸들 가능 여부 확인. 이름과 일치하면 가산점." },
      { title: "최종 결정 후 즉시 도메인 + SNS 핸들 매입", detail: "결정 후 1시간 안에 — 다른 사람이 먼저 차지할 수 있음." },
    ],
    pros: [
      "출시 후 이름 변경 비용 (SEO·브랜드 손실) 회피",
      "법적 분쟁 사전 차단",
      "고객 직관 일치 검증",
    ],
    cons: [
      "1-2일 시간 투자 필요",
      "친구 10명 모집 어려운 경우 — 디스콰이엇 등 커뮤니티 활용",
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// 5. 핵심 워크플로우 + 와이어프레임 — 4가지 방법
// ═════════════════════════════════════════════════════════════════════
const CORE_WORKFLOW_METHODS: BuildMethod[] = [
  {
    id: "excalidraw-claude",
    name: "Excalidraw + Claude (가장 빠름·자유)",
    difficulty: "초급",
    bestFor: "1인 인디·종이 스케치 좋아하는 사람",
    timeEstimate: "1-3시간",
    costEstimate: "무료 (Excalidraw+ $7/mo 선택)",
    tagline: "개발자 픽 — 손그림 스타일 와이어프레임 + Claude 가 React 코드로 변환.",
    tools: [
      { name: "Excalidraw", url: "https://excalidraw.com", pricing: "무료" },
      { name: "Claude", url: "https://claude.ai", pricing: "무료~$20/mo" },
    ],
    steps: [
      { title: "Excalidraw 에서 메인 화면 와이어프레임 그리기", detail: "회원가입 → 대시보드 → 핵심 액션 화면 3-5개. 박스·텍스트·화살표만으로 충분. 손그림 스타일이라 빠름." },
      { title: "각 화면에 사용자 액션·데이터 흐름 메모", detail: "\"버튼 클릭 → POST /api/X → DB 업데이트 → 화면 갱신\" 같은 메모 함께." },
      { title: "Claude 에 와이어프레임 이미지 + 설명 업로드", detail: "Claude 멀티모달 → \"이 와이어프레임을 React + Tailwind 코드로 만들어줘\" → Artifacts 에서 즉시 코드." },
      { title: "Excalidraw+ AI 사용 시 'wireframe to code' 직접", detail: "$7/mo 구독 시 Excalidraw 자체에서 AI 가 와이어프레임 → 코드 변환." },
    ],
    pros: [
      "정말 빠름 — 종이·펜 수준 속도",
      "개발자 친화, 자유 형식",
      "Claude 가 코드로 즉시 변환",
      "무료",
    ],
    cons: [
      "정밀 디자인은 부족 (다음 단계에서 다듬기)",
      "협업 시 Figma 보다 약함",
    ],
    example: "Pieter Levels·Marc Lou — Excalidraw 초안 → Cursor 로 직접 코딩.",
  },
  {
    id: "figma-ai-wireframe",
    name: "Figma + AI Wireframe Generator (정밀·협업)",
    difficulty: "중급",
    bestFor: "디자이너·개발자 협업·시드 이상 팀",
    timeEstimate: "1-3일",
    costEstimate: "Figma 무료 (Pro $15/mo 선택)",
    tagline: "Figma AI Wireframe Generator (2026 출시) — 텍스트 → 인터랙티브 레이아웃.",
    tools: [
      { name: "Figma", url: "https://figma.com", pricing: "무료~$15/mo" },
      { name: "Figma AI Wireframe", url: "https://figma.com/solutions/ai-wireframe-generator/", pricing: "포함" },
      { name: "UX Pilot (Figma plugin)", url: "https://uxpilot.ai", pricing: "무료~$20/mo" },
    ],
    steps: [
      { title: "Figma 가입 → AI Wireframe Generator", detail: "프롬프트: \"SaaS 대시보드 + 차트 + 사이드바 + 모달\" → 인터랙티브 레이아웃 자동 생성." },
      { title: "Auto Layout 활용해 반응형 정리", detail: "Figma 의 Auto Layout 으로 모바일·태블릿·데스크톱 자동 대응. 디자이너 표준." },
      { title: "(선택) UX Pilot 플러그인 — 디자인 시스템 자동", detail: "컬러·타이포그래피·컴포넌트 시스템 일괄 생성. shadcn 호환 export." },
      { title: "Claude Code → Figma 양방향 동기화 (2026 신규)", detail: "Anthropic Figma 플러그인 → 코드 ↔ 디자인 자동 동기. 디자이너·개발자 분리 X." },
    ],
    pros: [
      "프로페셔널 정밀도 (디자이너 표준)",
      "팀 협업 (실시간 multi-cursor)",
      "Auto Layout = 반응형 자동",
      "거대한 플러그인·컴포넌트 생태계",
    ],
    cons: [
      "1인 인디에게는 학습 곡선 있음",
      "Excalidraw 대비 느림",
      "Pro $15/mo (팀 협업 시)",
    ],
  },
  {
    id: "google-stitch",
    name: "Google Stitch (텍스트 → UI + 프론트엔드 코드)",
    difficulty: "초급",
    bestFor: "Gemini 사용자·구글 생태계",
    timeEstimate: "30분~2시간",
    costEstimate: "무료 (350회/월)",
    tagline: "Google Labs — 텍스트·이미지·와이어프레임 → UI + 코드, Gemini 모델 기반.",
    tools: [
      { name: "Google Stitch", url: "https://stitch.withgoogle.com", pricing: "무료 350/월" },
    ],
    steps: [
      { title: "stitch.withgoogle.com 접속 → 프롬프트", detail: "예: \"한국 카페 매출 분석 SaaS 대시보드, 모바일 우선\". Gemini 가 UI 디자인 + HTML/React 코드 동시 생성." },
      { title: "이미지·와이어프레임 업로드 (선택)", detail: "참고 이미지나 손그림 스케치 업로드 시 더 정확한 결과." },
      { title: "Figma 로 export (편집 가능)", detail: "Figma 플러그인 으로 import — Auto Layout 구조 유지." },
      { title: "프론트엔드 코드 다운로드", detail: "HTML/CSS 또는 React 코드 export. Cursor·Claude Code 에서 통합." },
    ],
    pros: [
      "무료 350회/월 — 실험에 충분",
      "Gemini 멀티모달 (이미지·와이어프레임 입력 가능)",
      "Figma export 깨끗함",
    ],
    cons: [
      "Google Labs 실험 단계 — 프로덕션 SLA 없음",
      "협업 X (single-user)",
      "Stitch + Figma 결합 워크플로우 필요",
    ],
  },
  {
    id: "v0-shadcn-direct",
    name: "v0 by Vercel 직접 (Next.js 프로덕션 코드)",
    difficulty: "초급",
    bestFor: "프론트엔드 개발자·Vercel 스택",
    timeEstimate: "1-3시간",
    costEstimate: "무료~$20/mo",
    tagline: "와이어프레임 단계 건너뛰고 — 프롬프트 → 즉시 React + shadcn/ui 프로덕션 코드.",
    tools: [
      { name: "v0 by Vercel", url: "https://v0.app", pricing: "무료~$20/mo" },
      { name: "shadcn/ui (자동)", url: "https://ui.shadcn.com" },
    ],
    steps: [
      { title: "v0.app 에서 페이지·컴포넌트 별로 프롬프트", detail: "\"login form\", \"dashboard with charts\", \"pricing table\" 등 단위로." },
      { title: "shadcn 컴포넌트 자동 사용 + 코드 export", detail: "v0 가 `npx shadcn add` 명령어 제공. 본인 프로젝트에 즉시 통합." },
      { title: "Cursor·Claude Code 에서 페이지 합치기", detail: "v0 컴포넌트들을 Next.js app router 구조로 조립." },
      { title: "Vercel 자동 배포 + preview URL", detail: "PR 마다 preview URL 자동 — 사용자 피드백 받기에 최적." },
    ],
    pros: [
      "와이어프레임 → 코드 단계 압축",
      "shadcn = 2026 표준 (UI 통일성)",
      "Next.js·Vercel 친화",
      "코드 100% 소유",
    ],
    cons: [
      "Next.js·Tailwind 기본 지식 필요",
      "디자이너 협업 약함 (Figma 만큼 정밀 X)",
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// 6. 아키텍처 + DB 설계 — 5가지 방법
// ═════════════════════════════════════════════════════════════════════
const ARCHITECTURE_DB_METHODS: BuildMethod[] = [
  {
    id: "supabase-postgres-new",
    name: "Supabase Postgres.new (자연어 → 스키마 → 배포)",
    difficulty: "초급",
    bestFor: "Supabase 사용자·MVP 빠르게",
    timeEstimate: "30분~1시간",
    costEstimate: "무료 (Supabase 50K MAU)",
    tagline: "ChatGPT 자연어 → PostgreSQL 스키마 → Supabase 즉시 배포.",
    tools: [
      { name: "Supabase Postgres.new", url: "https://postgres.new", pricing: "무료" },
      { name: "Supabase Studio 3.0 AI SQL Editor", url: "https://supabase.com", pricing: "무료" },
    ],
    steps: [
      { title: "postgres.new 접속 → 자연어 입력", detail: "\"카페 매출 SaaS — 사용자, 매장, 일별 매출, 메뉴, 주문 테이블\" → AI 가 PostgreSQL 스키마 + 관계 자동 생성." },
      { title: "ER 다이어그램 자동 생성 (Supabase Studio 3.0)", detail: "Studio 3.0 의 schema visualizer 가 즉시 다이어그램 표시. 잘못된 관계 시각적 확인." },
      { title: "RLS (Row-Level Security) 정책 자동 제안", detail: "\"각 사용자는 자기 데이터만 조회\" 같은 RLS 정책 자동 생성. 보안 사전 적용." },
      { title: "1-클릭으로 Supabase 프로젝트에 배포", detail: "테이블·정책·트리거 모두 즉시 라이브. 클라이언트 SDK 자동 생성." },
    ],
    pros: [
      "자연어 → 프로덕션 DB 한 번에",
      "Supabase 풀 스택 통합 (Auth·Storage·Edge Functions)",
      "RLS 보안 사전 자동",
      "무료 50K MAU + 500MB DB",
    ],
    cons: [
      "Supabase 종속적 (다른 DB 마이그레이션 어려움)",
      "복잡한 비즈니스 로직은 수동 보완",
    ],
  },
  {
    id: "eraser-ai-erd",
    name: "Eraser.io AI ERD (시각적 + 협업)",
    difficulty: "초급",
    bestFor: "팀 협업·복잡한 도메인",
    timeEstimate: "1-3시간",
    costEstimate: "무료 (Pro $14/mo 선택)",
    tagline: "평문/코드 → ERD. Lucidchart 후속 표준.",
    tools: [
      { name: "Eraser.io", url: "https://eraser.io", pricing: "무료~$14/mo" },
    ],
    steps: [
      { title: "Eraser.io 가입 → AI ERD Generator", detail: "\"전자상거래 SaaS 데이터 모델\" 같은 평문 입력 → ERD 시각적 생성." },
      { title: "수동 편집 + 관계 다듬기", detail: "AI 결과를 화이트보드 스타일로 직접 수정. 팀과 실시간 협업." },
      { title: "DBML / SQL / Mermaid 코드 export", detail: "다양한 형식 export — Supabase Studio·dbdiagram·코드에 직접 붙여넣기." },
      { title: "GitHub PR 통합 (Pro)", detail: "ERD 변경사항을 PR 에 자동 첨부 — 팀 리뷰 워크플로우 표준화." },
    ],
    pros: [
      "팀 협업 1순위",
      "AI + 수동 편집 균형",
      "다양한 export 포맷",
      "GitHub 통합",
    ],
    cons: [
      "Pro $14/mo (개인 무료 한계)",
      "Supabase 처럼 즉시 배포 X (export 후 적용)",
    ],
  },
  {
    id: "dbdiagram-dbml",
    name: "dbdiagram.io (DBML 코드 → 시각화, 무료)",
    difficulty: "초급",
    bestFor: "텍스트 위주 개발자·간단한 스키마",
    timeEstimate: "30분-1시간",
    costEstimate: "무료",
    tagline: "DBML(Database Markup Language) 코드 → 즉시 시각화. 깃과 친화.",
    tools: [
      { name: "dbdiagram.io", url: "https://dbdiagram.io", pricing: "무료" },
    ],
    steps: [
      { title: "dbdiagram.io → 새 다이어그램", detail: "DBML 문법으로 테이블 작성. 예: `Table users { id int [pk] email varchar }`." },
      { title: "관계·인덱스·코멘트 추가", detail: "`Ref: posts.user_id > users.id` 한 줄로 외래키. 변경 즉시 시각화." },
      { title: "PNG/PDF/SQL/DBML export", detail: "PostgreSQL·MySQL·MSSQL SQL DDL 자동 생성. 그대로 DB 에 적용 가능." },
      { title: "GitHub 에 .dbml 파일 커밋 → PR 리뷰", detail: "DBML 은 텍스트 → git diff 가능. 팀이 스키마 변경 PR 로 리뷰." },
    ],
    pros: [
      "100% 무료 + 빠름",
      "텍스트 → 시각화 (개발자 친화)",
      "Git 친화 (텍스트 diff)",
      "다중 DB SQL export",
    ],
    cons: [
      "AI 자동 생성 X (DBML 직접 작성)",
      "협업 기능 약함",
      "복잡한 마이그레이션 X",
    ],
  },
  {
    id: "mermaid-markdown",
    name: "Mermaid in Markdown (코드 안에 ERD)",
    difficulty: "중급",
    bestFor: "GitHub README·기술 문서·개발자 친화",
    timeEstimate: "30분",
    costEstimate: "무료",
    tagline: "Markdown 안에 ERD 코드 — GitHub·Notion·VS Code 모두 자동 렌더링.",
    tools: [
      { name: "Mermaid", url: "https://mermaid.js.org", pricing: "무료" },
      { name: "Claude Code (mermaid 자동 생성)", url: "https://claude.com/claude-code", pricing: "$20/mo" },
    ],
    steps: [
      { title: "Claude Code 에 \"DB schema 를 mermaid 로\"", detail: "Claude 가 `erDiagram` 코드 자동 생성. README.md 에 붙여넣기." },
      { title: "GitHub README·docs 에 자동 렌더링", detail: "GitHub 가 Mermaid 자동 지원 — 문서 보면 즉시 ERD 시각화." },
      { title: "VS Code/Cursor preview 에서도 렌더링", detail: "Markdown Preview 확장으로 IDE 에서 즉시 확인." },
      { title: "코드와 함께 git 관리", detail: "스키마 변경 → diff 로 추적. 별도 도구 불필요." },
    ],
    pros: [
      "코드와 동시 관리 (별도 도구 X)",
      "GitHub·Notion·VS Code 모두 지원",
      "Claude Code 가 자동 생성",
      "100% 무료",
    ],
    cons: [
      "복잡한 다이어그램은 가독성 떨어짐",
      "Mermaid 문법 학습 (간단함)",
      "협업 시 시각 편집 X",
    ],
  },
  {
    id: "claude-natural-design",
    name: "Claude/ChatGPT 자연어 설계 (와이어프레임 단계)",
    difficulty: "초급",
    bestFor: "DB 모르는 비개발자·아이디어 단계",
    timeEstimate: "1-2시간",
    costEstimate: "무료~$20/mo",
    tagline: "DB 지식 0 — Claude 와 대화하며 데이터 모델·API·인증 흐름 한 번에 설계.",
    tools: [
      { name: "Claude", url: "https://claude.ai", pricing: "무료~$20/mo" },
    ],
    steps: [
      { title: "Claude 에 제품 요구사항 자세히 입력", detail: "\"카페 사장님이 매일 매출 입력 + AI 가 분석 + 알림\" — 사용자·기능·데이터를 자연어로." },
      { title: "Claude 가 데이터 모델 + API 라우트 + 페이지 구조 설계", detail: "Mermaid ERD + REST API 엔드포인트 목록 + 페이지 라우팅 + 인증 플로우 한 번에 출력." },
      { title: "검토 후 보완 질문", detail: "\"여기서 RLS 정책은?\", \"실시간 업데이트는?\" 등 추가 질문 — Claude 가 즉시 보완." },
      { title: "결과 → Lovable·Cursor·v0 에 입력", detail: "Claude 의 설계 출력을 다음 단계 도구에 그대로 붙여넣기 — 일관성 유지." },
    ],
    pros: [
      "DB 지식 없어도 설계 가능",
      "전체 시스템 (DB·API·페이지·인증) 한 번에",
      "코딩 단계로 자연스럽게 연결",
    ],
    cons: [
      "AI 출력 검증 필요 (RLS 누락 등)",
      "복잡한 시스템은 수동 검토 필수",
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// 7. 백엔드 + 배포 — 5가지 방법
// ═════════════════════════════════════════════════════════════════════
const BACKEND_DEPLOY_METHODS: BuildMethod[] = [
  {
    id: "supabase-vercel",
    name: "Supabase + Vercel (인디 표준 #1)",
    difficulty: "초급",
    bestFor: "1인 인디·MVP·시드 단계",
    timeEstimate: "1-2시간 셋업",
    costEstimate: "무료 (월 $0~$200 at $1K MRR)",
    tagline: "2026 인디 해커 70%+ 사용. PostgreSQL + Auth + Storage + Edge Functions + Vercel 호스팅.",
    tools: [
      { name: "Supabase", url: "https://supabase.com", pricing: "무료 50K MAU + 500MB DB" },
      { name: "Vercel", url: "https://vercel.com", pricing: "무료 Hobby + Pro $20/mo" },
    ],
    steps: [
      { title: "Supabase 프로젝트 생성 + Postgres 셋업", detail: "supabase.com → New Project. 자동으로 PostgreSQL 인스턴스 + Auth + Storage + Edge Functions 활성화." },
      { title: "Auth 설정 (이메일·소셜·매직링크)", detail: "Settings → Authentication → Providers. Google·Apple·Kakao OAuth 1-클릭." },
      { title: "Vercel 에 Next.js 프로젝트 배포", detail: "GitHub repo → Vercel import → Supabase 환경 변수 자동 동기화. 1-클릭 배포." },
      { title: "도메인 연결 + SSL 자동", detail: "Vercel 에서 커스텀 도메인 연결. Let's Encrypt SSL 자동." },
    ],
    pros: [
      "인디 해커 표준 — 200+ 사례 검증",
      "전체 스택 무료 시작 가능",
      "$1K MRR 까지 < $200/mo",
      "1-클릭 배포 + preview URL",
    ],
    cons: [
      "Supabase 종속적 (다른 DB 마이그 어려움)",
      "Vercel 서버리스 제약 (10초 타임아웃, function size)",
    ],
    example: "Found.One 본 서비스도 Supabase + Vercel. Marc Lou·Pieter Levels 도 동일 스택.",
  },
  {
    id: "cloudflare-pages-workers",
    name: "Cloudflare Pages + Workers + D1 (글로벌 엣지)",
    difficulty: "중급",
    bestFor: "글로벌 사용자·고성능·무료 한도 큼",
    timeEstimate: "2-4시간 셋업",
    costEstimate: "무료 (Workers 100K req/일 + D1 5GB)",
    tagline: "Cloudflare 의 엣지 컴퓨팅 — 전세계 200+ 데이터센터에서 < 50ms 응답.",
    tools: [
      { name: "Cloudflare Pages", url: "https://pages.cloudflare.com", pricing: "무료 무제한" },
      { name: "Cloudflare Workers", url: "https://workers.cloudflare.com", pricing: "무료 100K req/일" },
      { name: "Cloudflare D1 (SQLite)", url: "https://developers.cloudflare.com/d1", pricing: "무료 5GB" },
    ],
    steps: [
      { title: "Cloudflare 가입 + Wrangler CLI 설치", detail: "`npm install -g wrangler` → 로컬 개발 환경." },
      { title: "Pages 에 프론트엔드 배포", detail: "GitHub 연결 → 자동 빌드·배포. SvelteKit·Next.js·Astro 모두 지원." },
      { title: "Workers 로 API 작성", detail: "TypeScript 함수로 API. D1 (SQLite) 와 직접 연동." },
      { title: "Workers KV·R2·Queues 통합", detail: "캐시·파일·큐 모두 Cloudflare 안에서. 외부 서비스 의존성 X." },
    ],
    pros: [
      "글로벌 엣지 — 한국·미국·유럽 < 50ms",
      "무료 한도 압도적 (100K req/일)",
      "DDoS 방어 자동",
      "Vercel 대비 $0 비용 가능성 큼",
    ],
    cons: [
      "Workers 환경 제약 (Node.js 일부 API X)",
      "D1 (SQLite) 는 PostgreSQL 대비 기능 적음",
      "학습 곡선 (Wrangler·환경 다름)",
    ],
  },
  {
    id: "railway-allinone",
    name: "Railway (모든 it 한 박스)",
    difficulty: "초급",
    bestFor: "Heroku 대안·모든 백엔드 한 곳",
    timeEstimate: "1-2시간",
    costEstimate: "사용량 과금 ($5 starter)",
    tagline: "Heroku 후속 — Postgres·Redis·앱·크론·워커 모두 한 프로젝트.",
    tools: [
      { name: "Railway", url: "https://railway.app", pricing: "$5 starter" },
    ],
    steps: [
      { title: "Railway 가입 + GitHub 연결", detail: "GitHub repo 선택 → Railway 가 자동 빌드·배포. Dockerfile 자동 감지." },
      { title: "PostgreSQL·Redis 1-클릭 추가", detail: "프로젝트에 DB·캐시·큐 즉시 추가. 환경 변수 자동 주입." },
      { title: "크론 워커·백그라운드 잡 설정", detail: "Vercel 서버리스 제약 없음 — 장시간 실행되는 워커 OK." },
      { title: "도메인 연결 + Auto-deploy on push", detail: "git push 마다 자동 배포 + preview." },
    ],
    pros: [
      "백엔드·DB·캐시·워커 한 곳",
      "사용량 과금 (유휴 시 0원)",
      "Vercel 서버리스 제약 없음",
      "Docker 친화 (모든 언어 지원)",
    ],
    cons: [
      "$5 minimum (Vercel·Cloudflare 무료 티어 대비)",
      "프론트엔드 호스팅은 별도 (Vercel 권장)",
    ],
  },
  {
    id: "neon-vercel",
    name: "Neon + Vercel (서버리스 Postgres)",
    difficulty: "중급",
    bestFor: "서버리스 + Postgres 풀 기능 원할 때",
    timeEstimate: "1-2시간",
    costEstimate: "무료 (Pro $19/mo)",
    tagline: "서버리스 Postgres — branching·preview DB 가능 (git 처럼).",
    tools: [
      { name: "Neon", url: "https://neon.tech", pricing: "무료 (Pro $19/mo)" },
      { name: "Vercel", url: "https://vercel.com", pricing: "무료~$20/mo" },
    ],
    steps: [
      { title: "Neon 프로젝트 생성", detail: "PostgreSQL 인스턴스 즉시. 자동 sleep (사용 안 할 때 비용 0)." },
      { title: "Vercel 에 환경 변수 연결", detail: "Neon 통합 plugin → 자동 동기화. PR 마다 preview branch DB." },
      { title: "PR 마다 preview DB branch 생성", detail: "git 처럼 DB branching — 마이그레이션 안전 테스트 가능." },
      { title: "프로덕션 merge 시 자동 main DB 적용", detail: "Vercel preview 와 동기화 — 코드+DB 동시 review." },
    ],
    pros: [
      "Postgres 풀 기능 (Supabase 대비 더 표준)",
      "Branching = git 처럼 DB 실험 안전",
      "서버리스 (auto-scale)",
      "Vercel + Neon = 완벽 통합",
    ],
    cons: [
      "Auth·Storage·Edge Functions 별도 (Supabase 대비 통합도↓)",
      "$19/mo Pro (Supabase $25/mo 대비 비슷)",
    ],
  },
  {
    id: "render-fly",
    name: "Render / Fly.io (Heroku 후속, 풀스택)",
    difficulty: "중급",
    bestFor: "복잡한 백엔드·여러 컨테이너·Docker",
    timeEstimate: "2-4시간",
    costEstimate: "$7~ (Render starter)",
    tagline: "Heroku 폐쇄 후 Render·Fly.io 가 표준 후속. Docker 친화.",
    tools: [
      { name: "Render", url: "https://render.com", pricing: "$7~" },
      { name: "Fly.io", url: "https://fly.io", pricing: "사용량 과금" },
    ],
    steps: [
      { title: "Render·Fly.io 가입 + GitHub 연결", detail: "Dockerfile 또는 buildpack 자동 감지. 빌드·배포 자동." },
      { title: "PostgreSQL·Redis 추가", detail: "Managed DB·Redis 1-클릭. Vercel 처럼 환경 변수 자동." },
      { title: "Fly.io 의 경우 글로벌 멀티 리전 배포", detail: "한국·미국·유럽 동시 배포 — 사용자 위치별 라우팅." },
      { title: "도메인 연결 + 자동 SSL", detail: "Let's Encrypt 자동." },
    ],
    pros: [
      "Heroku 친숙성 (12-factor app)",
      "Docker 풀 지원",
      "복잡한 백엔드·워커·웹소켓 OK",
      "Fly.io = 글로벌 멀티 리전",
    ],
    cons: [
      "$7+ minimum (Vercel·Cloudflare 무료 대비)",
      "프론트엔드는 별도 (Vercel·Cloudflare Pages 권장)",
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// 8. 실제 출시 (Go Live) — 5가지 방법
//   영어 검증: Apple Developer 2026 / Google Play 14-day policy / Product Hunt / HN Show HN
// ═════════════════════════════════════════════════════════════════════
const APP_LAUNCH_METHODS: BuildMethod[] = [
  {
    id: "web-go-live",
    name: "웹 출시 (Vercel·Cloudflare 배포)",
    difficulty: "초급",
    bestFor: "웹 SaaS·랜딩 페이지·1인 인디",
    timeEstimate: "1-3시간",
    costEstimate: "도메인 1-2만/년 + 호스팅 무료~$20/mo",
    tagline: "도메인 연결·SSL·SEO 메타·Search Console 등록까지. 1시간이면 끝.",
    tools: [
      { name: "Vercel", url: "https://vercel.com", pricing: "무료 Hobby + $20/mo Pro" },
      { name: "Namecheap·Gandi (도메인)", url: "https://namecheap.com", pricing: "1-2만/년" },
      { name: "Google Search Console", url: "https://search.google.com/search-console", pricing: "무료" },
    ],
    steps: [
      { title: "도메인 구매 (.com 우선, .io / .app 차선)", detail: "Namecheap·Gandi 에서 1-2만원/년. 신규는 5천원 프로모도 있음. WHOIS 프라이버시 무료 켜기." },
      { title: "Vercel 또는 Cloudflare Pages 에 배포", detail: "GitHub repo 연결 → 1-클릭 배포. main branch push = 자동 배포 + preview URL." },
      { title: "도메인 연결 + SSL 자동 (Let's Encrypt)", detail: "Vercel Settings → Domains → 자기 도메인 입력 → DNS 레코드 안내. 보통 30분 내 적용." },
      { title: "SEO 메타 + OG 이미지 + sitemap.xml + robots.txt", detail: "Next.js: app/layout.tsx 에 metadata, app/sitemap.ts, app/robots.ts. OG 이미지 1200×630 (GPT Image 2 활용 가능)." },
      { title: "Google Search Console + Analytics 등록", detail: "search.google.com/search-console → 도메인 인증 (DNS TXT 또는 HTML 메타) → sitemap 제출. 인덱싱 1-2주." },
    ],
    pros: [
      "1시간 안에 라이브",
      "SSL·CDN 자동 (Let's Encrypt + Vercel Edge)",
      "Push = 자동 배포 + preview URL",
      "한국 사용자 대상도 < 100ms 응답 (Vercel Edge)",
    ],
    cons: [
      "도메인 비용 1-2만/년",
      "Vercel Pro 유료 transition 시점 ($20/mo)",
    ],
    example: "Marc Lou·Pieter Levels — 모든 마이크로 SaaS 가 이 패턴. ShipFast·Photo AI 도 동일.",
  },
  {
    id: "apple-app-store",
    name: "Apple App Store 제출 (iOS)",
    difficulty: "고급",
    bestFor: "iOS 모바일 앱",
    timeEstimate: "3-7일 (준비 1주 + 리뷰 1-30일)",
    costEstimate: "$99/년 (Apple Developer Program)",
    tagline: "2026 정책: iOS 26 SDK + Xcode 26 필수 (2026.4.28부터). 평균 24h 리뷰지만 최근 7-30일 지연 빈발.",
    tools: [
      { name: "Apple Developer Program", url: "https://developer.apple.com/programs", pricing: "$99/년" },
      { name: "Xcode 26", url: "https://apps.apple.com/app/xcode/id497799835", pricing: "무료" },
      { name: "App Store Connect", url: "https://appstoreconnect.apple.com", pricing: "포함" },
      { name: "TestFlight", url: "https://developer.apple.com/testflight/", pricing: "포함" },
    ],
    steps: [
      { title: "Apple Developer Program 가입 ($99/년)", detail: "developer.apple.com/programs. 개인·회사 선택 (회사는 D-U-N-S 번호 필요, 발급 1-2주). 결제 후 즉시 활성화." },
      { title: "App ID + Distribution Certificate + Provisioning Profile", detail: "Bundle Identifier 신중히 (한번 설정 후 변경 불가). \"Apple Distribution\" 인증서 + App Store provisioning." },
      { title: "Xcode 26 에서 archive → App Store Connect 업로드", detail: "2026.4.28 이후 모든 신규/업데이트 앱은 iOS 26 SDK + Xcode 26 필수 (Xcode 16은 iOS 26 SDK 미지원). archive → Validate → Upload." },
      { title: "App Store Connect 메타데이터 + 스크린샷", detail: "이름·설명·키워드·카테고리·연령등급·개인정보처리방침 URL·데모 계정 (필요 시). 스크린샷 6.7\"·6.5\"·5.5\" iPhone + iPad 필수." },
      { title: "TestFlight 내부 테스트 (100명 무리뷰 즉시) + 외부 (10,000명, 첫 빌드 Beta App Review)", detail: "출시 전 TestFlight 로 크래시 탐지. 내부 테스터는 등록 즉시 가능. 외부 테스터는 첫 빌드만 Beta Review." },
      { title: "Submit for Review → 결과 대기", detail: "2026: 90% 가 24h 내, 복잡한 앱은 2-5일. 단 2026.3 부터 7-30일 지연 빈발. 거절 시 사유에 따라 메타데이터 보정 또는 코드 수정." },
    ],
    pros: [
      "iOS 사용자 도달 (글로벌 25%+ 시장)",
      "고품질 사용자 (LTV 평균 안드로이드 2-3배)",
      "TestFlight = 친구·팀 사전 테스트 표준",
      "결제는 Apple In-App Purchase 30% 수수료지만 자동",
    ],
    cons: [
      "$99/년 등록비",
      "리뷰 거절 흔함 — 메타데이터·크래시·\"너무 단순\" 사유",
      "2026.3 기준 리뷰 지연 7-30일",
      "iOS 26 SDK 의무 (구버전 기기 일부 미지원)",
    ],
    example: "Cursor (앱 X) / Lovable (앱 X) — 대부분 인디 SaaS 는 웹 우선. Apple 에 가는 건 모바일이 핵심 시장일 때만.",
  },
  {
    id: "google-play-store",
    name: "Google Play Console 제출 (Android)",
    difficulty: "고급",
    bestFor: "Android 모바일 앱",
    timeEstimate: "2-3주 (12 테스터 14일 의무 + 리뷰 7일)",
    costEstimate: "$25 일회성 (Google Play Developer)",
    tagline: "2026 정책: 개인 계정은 12명 테스터 14일 의무. 폐쇄 테스팅 통과 후 프로덕션.",
    tools: [
      { name: "Google Play Console", url: "https://play.google.com/console", pricing: "$25 일회성" },
      { name: "Android Studio", url: "https://developer.android.com/studio", pricing: "무료" },
      { name: "Internal/Closed/Open Testing", pricing: "포함" },
    ],
    steps: [
      { title: "Google Play Developer 계정 ($25 일회성, 영구)", detail: "Apple 의 $99/년 vs Google $25 일회성. 신규 개인 계정은 추가 검증 (D-U-N-S 또는 정부 ID)." },
      { title: "앱 패키지 (AAB) 빌드 + Play Console 업로드", detail: "Android Studio Build → Generate Signed Bundle (AAB 권장, APK X). Play Console → Production 또는 Testing 트랙에 업로드." },
      { title: "내부 테스트 (100명 즉시) → 폐쇄 테스트 (12명·14일 필수)", detail: "2026 정책: 개인 계정 = 폐쇄 테스트 12명+ 14일 연속 활성 사용 필수. User Engagement Time 측정 — 설치만 X, 정기 사용 필요." },
      { title: "Content Rating 설문 + 개인정보 정책 + 데이터 안전 선언", detail: "IARC 콘텐츠 등급 (10분), 개인정보 정책 URL, 데이터 안전 (어떤 데이터 수집·공유) 명시 필수." },
      { title: "프로덕션 리뷰 신청 → 7일 이내 (최대 30일)", detail: "첫 폐쇄 테스트 빌드는 Google 수동 리뷰 (최대 7일). 프로덕션 리뷰는 보통 몇 시간~7일." },
    ],
    pros: [
      "$25 일회성 (Apple $99/년 대비 영구)",
      "내부 테스트 100명 즉시 (Apple TestFlight 와 비슷)",
      "글로벌 75% Android 시장 도달",
      "결제 수수료 30% (소액 결제 15%로 낮춰짐)",
    ],
    cons: [
      "12명 14일 폐쇄 테스트 의무 (개인 계정)",
      "User Engagement Time 측정 — 가짜 테스터 안 됨",
      "Emulator 자동 감지 (실기기 권장)",
      "콘텐츠 등급·데이터 안전 선언 까다로움",
    ],
  },
  {
    id: "product-hunt-launch",
    name: "Product Hunt 론칭 (글로벌 1순위)",
    difficulty: "중급",
    bestFor: "글로벌 SaaS·B2B·론칭 데이 화제성",
    timeEstimate: "준비 2주 + 론칭 데이 24시간 풀가동",
    costEstimate: "무료",
    tagline: "Top 5 = 주간 5K-10K 방문. 화·수 0시 PT 론칭 + 헌터 사전 섭외 필수.",
    tools: [
      { name: "Product Hunt", url: "https://producthunt.com", pricing: "무료" },
    ],
    steps: [
      { title: "출시 2주 전: Product Hunt 프로필 + Maker 인증", detail: "프로필 정성 채우기. 다른 제품 댓글·upvote 활동 (\"good citizen\" 알고리즘)." },
      { title: "출시 1주 전: 헌터 (Hunter) 섭외", detail: "Top hunter (followers 10K+) 가 launch 해주면 가산점. Twitter/X DM 으로 1-2주 전 부드럽게 컨택. 'My Friends' 활용." },
      { title: "출시 1일 전: 자산 준비 (썸네일 240×240·갤러리·gif·30초 영상)", detail: "썸네일 = upvote 결정 요인. 미드나이트 + 단순 일러 스타일 정답. 영상은 30-60초 product walkthrough." },
      { title: "출시 데이 (화·수 0시 PT — 한국 시간 오후 5시)", detail: "0:01 시점에 자동 발행. 첫 8시간이 \"Daily Top\" 결정. 팀·친구 50명+ 미리 알림 → upvote 동시 + 진정성 댓글." },
      { title: "24시간 풀가동: 모든 댓글 답변 + Twitter·HN 동시 공유", detail: "Top 5 = 주간 5K-10K 방문 + Tech Crunch·newsletter 자동 픽업. Top 1 = 50K+ 가능." },
    ],
    pros: [
      "단일 이벤트로 가장 큰 화제성",
      "기자·VC·early adopter 한 번에 도달",
      "Top 5 진입 시 newsletter·blog 자동 픽업",
      "무료",
    ],
    cons: [
      "준비 2주+ 필요 (헌터·자산·커뮤니티)",
      "0시 PT = 한국 새벽~오전 풀가동",
      "1회성 — 효과 1주일",
      "거짓 upvote 검출 시 영구 차단",
    ],
    example: "Cursor — PH Top 1 후 24시간 신규 가입 50K+. Lovable·Bolt 도 PH 1위 후 폭발.",
  },
  {
    id: "hn-show",
    name: "Hacker News \"Show HN\" 론칭",
    difficulty: "중급",
    bestFor: "개발자 도구·B2B SaaS·기술 깊이",
    timeEstimate: "준비 1일 + 게시 후 모니터링 8시간",
    costEstimate: "무료",
    tagline: "Top 30 = 100K+ 방문. 솔직한 한 문장 + 직접 제작 스토리. 화·수 미국 오전.",
    tools: [
      { name: "Hacker News", url: "https://news.ycombinator.com", pricing: "무료" },
      { name: "Show HN 가이드라인", url: "https://news.ycombinator.com/showhn.html", pricing: "무료" },
    ],
    steps: [
      { title: "HN 계정 만들기 + 1주+ 활동 (\"karma\" 쌓기)", detail: "신규 계정 = 자동 의심. 다른 글 upvote·comment 로 karma 50+ 만들고 게시. 진정성 핵심." },
      { title: "Show HN 가이드라인 정독", detail: "\"Show HN: \" 접두사 필수. 자랑·과장 X, 직접 만든 것·작동 가능한 데모 필수. URL 또는 스크린샷." },
      { title: "제목 = 솔직한 한 문장", detail: "예: \"Show HN: I built a tool that analyzes Korean cafe sales\" — 과장 없이 사실. 클릭베이트 X." },
      { title: "첫 댓글에 \"Why I built this\" 스토리", detail: "본인이 겪은 문제 + 해결 과정 + 기술 스택. HN 사용자 = 메이커 출신 많음, 진정성에 반응." },
      { title: "화·수 미국 오전 9-11 PT (한국 새벽 1-3시) 게시 → 8시간 모니터링", detail: "첫 30분에 upvote 5-10개 = 알고리즘 push. Top 30 = 100K+ 방문 가능. 모든 댓글에 24h 내 답변." },
    ],
    pros: [
      "개발자·VC 도달 — 기술 신뢰도 가산",
      "Top 30 = 100K+ 방문",
      "1주 후에도 SEO 효과 (HN 백링크 강함)",
      "무료",
    ],
    cons: [
      "HN 사용자 까다로움 — 과장·마케팅 톤 X",
      "신규 계정 자동 차단 위험",
      "한국 새벽 시간대 게시·모니터링",
      "\"메이커\" 이미지 필요 (대기업·외주 제품 거부감)",
    ],
    example: "Cursor·Linear·Vercel — 모두 Show HN 으로 첫 100K+ 사용자. 장수 지속.",
  },
];

// ═════════════════════════════════════════════════════════════════════
// EXPORT
// ═════════════════════════════════════════════════════════════════════
export const BUILD_TASKS: Record<string, BuildTask> = {
  "name-mission": {
    id: "name-mission",
    name: "이름 · 미션 · 슬로건",
    intro: "출시 후 이름 변경 = SEO·브랜드 손실. 4가지 방법으로 빠르고 안전하게 결정.",
    methods: NAME_MISSION_METHODS,
  },
  "core-workflow": {
    id: "core-workflow",
    name: "핵심 워크플로우 + 와이어프레임",
    intro: "회원가입 → '아하 모먼트' 까지 최단 경로. 4가지 방법 중 본인 환경 선택.",
    methods: CORE_WORKFLOW_METHODS,
  },
  "architecture-db": {
    id: "architecture-db",
    name: "아키텍처 + DB 설계",
    intro: "코드 한 줄 쓰기 전에 전체 구조 잡기. 5가지 방법 중 선택.",
    methods: ARCHITECTURE_DB_METHODS,
  },
  "backend-deploy": {
    id: "backend-deploy",
    name: "백엔드 + 배포 인프라",
    intro: "서버 직접 관리 X. BaaS·서버리스로 인프라 비용 0 시작.",
    methods: BACKEND_DEPLOY_METHODS,
  },
  "mvp-coding": {
    id: "mvp-coding",
    name: "MVP 코딩",
    intro: "AI 도구가 게임을 바꿨습니다. 본인 프로필에 맞는 방법을 골라 2-6주 안에 출시하세요.",
    methods: MVP_CODING_METHODS,
  },
  "landing-page": {
    id: "landing-page",
    name: "랜딩 페이지 제작",
    intro: "랜딩은 24시간 작동하는 영업사원. 5가지 방법 중 본인 환경에 맞는 것 선택.",
    methods: LANDING_PAGE_METHODS,
  },
  "design-image": {
    id: "design-image",
    name: "디자인·이미지 생성",
    intro: "로고·hero·OG·SNS 자산 모두. 한국어 텍스트 핵심이면 GPT Image 2.",
    methods: DESIGN_IMAGE_METHODS,
  },
  "app-launch": {
    id: "app-launch",
    name: "실제 출시 (Go Live) — 웹·앱·플랫폼",
    intro: "출시는 어렵습니다. 5가지 방법 (웹·iOS·Android·Product Hunt·Hacker News) 각각 다른 절차·기간·전략.",
    methods: APP_LAUNCH_METHODS,
  },
};

export function getBuildTask(taskId: string): BuildTask | undefined {
  return BUILD_TASKS[taskId];
}
