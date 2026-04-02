// ─── 스타트업 스테이지별 도구·AI 추천 데이터 (2026) ───────────────────────
// 각 로드맵 스테이지에서 필요한 도구, AI 서비스, 비용, 한국 지원 여부

export type StartupTool = {
  name: string;
  category: string;
  description: { ko: string; en: string };
  url: string;
  pricing: string;           // 무료, 프리미엄, 등
  monthlyEstimate?: string;  // 월 예상 비용
  koreanSupport: boolean;
  aiPowered: boolean;
  recommended: boolean;      // build.up 추천
  tags: string[];
};

export type StageToolKit = {
  stageId: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  essentialTools: StartupTool[];
  optionalTools: StartupTool[];
  aiTip: { ko: string; en: string };
  estimatedMonthlyCost: string;
};

// ── 서브카테고리별 추가 도구 (AI / SaaS / DevTool / Fintech) ──
export type SubCategoryToolOverride = {
  subIndustryId: string;
  additionalTools: StartupTool[];
  specificTip: { ko: string; en: string };
};

// ─── 스테이지별 도구 키트 ───────────────────────────────────────────────

export const STARTUP_STAGE_TOOLS: StageToolKit[] = [
  // ── 1. Founder & Company Setup ──
  {
    stageId: "startup-foundation",
    title: { ko: "창업 기반 구축", en: "Foundation Setup" },
    description: {
      ko: "법인 설립, 지분 구조, 공동창업자 합의를 위한 도구",
      en: "Tools for incorporation, equity structure, and co-founder alignment",
    },
    essentialTools: [
      { name: "헬프미 (법인설립)", category: "법률", description: { ko: "온라인 법인설립 대행 — 등기, 사업자등록 원스톱", en: "Online incorporation service" }, url: "https://www.help-me.kr", pricing: "30~50만원", koreanSupport: true, aiPowered: false, recommended: true, tags: ["법인설립", "등기"] },
      { name: "Notion", category: "협업", description: { ko: "창업자 합의서, 지분 구조 문서화, 프로젝트 위키", en: "Co-founder agreement, equity docs, wiki" }, url: "https://notion.so", pricing: "무료~$10/월", monthlyEstimate: "$0", koreanSupport: true, aiPowered: true, recommended: true, tags: ["문서", "협업", "AI"] },
      { name: "Carta (한국 대안: ZUZU)", category: "지분관리", description: { ko: "주주명부, 스톡옵션, 캡테이블 관리", en: "Cap table, stock options management" }, url: "https://zuzu.network", pricing: "무료~", koreanSupport: true, aiPowered: false, recommended: true, tags: ["지분", "스톡옵션"] },
    ],
    optionalTools: [
      { name: "Linear", category: "프로젝트관리", description: { ko: "이슈 트래커 — 스타트업 표준 PM 도구", en: "Issue tracker — startup standard" }, url: "https://linear.app", pricing: "무료~$8/월", monthlyEstimate: "$0", koreanSupport: false, aiPowered: true, recommended: true, tags: ["PM", "이슈"] },
    ],
    aiTip: { ko: "Claude/ChatGPT로 주주간계약서 초안을 작성하고, 변호사에게 최종 검토를 받으세요. AI가 90%를 커버하지만 법적 효력은 전문가 확인이 필수.", en: "Draft shareholder agreements with AI, but get final legal review." },
    estimatedMonthlyCost: "0~5만원",
  },

  // ── 2. Customer Discovery ──
  {
    stageId: "customer-discovery",
    title: { ko: "고객 검증", en: "Customer Discovery" },
    description: {
      ko: "고객 인터뷰, 문제 검증, 웨지 정의를 위한 도구",
      en: "Tools for customer interviews, pain validation, wedge definition",
    },
    essentialTools: [
      { name: "Claude / ChatGPT", category: "AI 리서치", description: { ko: "시장 리서치, 경쟁사 분석, 인터뷰 질문 설계", en: "Market research, competitor analysis, interview design" }, url: "https://claude.ai", pricing: "무료~$20/월", monthlyEstimate: "$20", koreanSupport: true, aiPowered: true, recommended: true, tags: ["리서치", "AI"] },
      { name: "Perplexity", category: "AI 검색", description: { ko: "실시간 웹 검색 기반 시장 분석 — 소스 인용 포함", en: "Real-time web search with source citations" }, url: "https://perplexity.ai", pricing: "무료~$20/월", monthlyEstimate: "$0", koreanSupport: true, aiPowered: true, recommended: true, tags: ["검색", "리서치"] },
      { name: "Typeform / Tally", category: "설문", description: { ko: "고객 인터뷰 사전 설문, 문제 검증 서베이", en: "Pre-interview surveys, pain validation" }, url: "https://tally.so", pricing: "무료", monthlyEstimate: "$0", koreanSupport: false, aiPowered: false, recommended: true, tags: ["설문", "검증"] },
      { name: "Disquiet", category: "커뮤니티", description: { ko: "한국 스타트업 커뮤니티 — 초기 유저 확보, 피드백", en: "Korean startup community — early users, feedback" }, url: "https://disquiet.io", pricing: "무료", koreanSupport: true, aiPowered: false, recommended: true, tags: ["커뮤니티", "한국"] },
    ],
    optionalTools: [
      { name: "Otter.ai", category: "녹음/전사", description: { ko: "인터뷰 자동 녹음 + AI 전사 + 요약", en: "Auto transcription + AI summary" }, url: "https://otter.ai", pricing: "무료~$17/월", koreanSupport: false, aiPowered: true, recommended: false, tags: ["인터뷰", "전사"] },
    ],
    aiTip: { ko: "인터뷰 후 Claude에 전사본을 넣고 '반복되는 불만 패턴 3가지를 뽑아줘'라고 요청하세요. 패턴 감지가 핵심.", en: "Feed interview transcripts to Claude and ask for recurring pain patterns." },
    estimatedMonthlyCost: "0~2만원",
  },

  // ── 3. MVP Build ──
  {
    stageId: "mvp-build",
    title: { ko: "MVP 개발", en: "MVP Build" },
    description: {
      ko: "핵심 기능 구현, 디자인, 배포를 위한 도구",
      en: "Tools for core feature development, design, and deployment",
    },
    essentialTools: [
      { name: "Claude Code", category: "AI 코딩", description: { ko: "터미널 기반 AI 코딩 어시스턴트 — Skills로 반복 작업 자동화", en: "Terminal AI coding assistant — automate with Skills" }, url: "https://claude.ai/code", pricing: "$20/월 (Pro)", monthlyEstimate: "$20", koreanSupport: true, aiPowered: true, recommended: true, tags: ["코딩", "AI", "자동화"] },
      { name: "Cursor", category: "AI IDE", description: { ko: "AI 네이티브 코드 에디터 — 코드 이해 + 자동 완성", en: "AI-native code editor" }, url: "https://cursor.com", pricing: "무료~$20/월", monthlyEstimate: "$20", koreanSupport: false, aiPowered: true, recommended: true, tags: ["IDE", "AI"] },
      { name: "v0 by Vercel", category: "AI UI 생성", description: { ko: "텍스트→React 컴포넌트 자동 생성. 빠른 프로토타이핑", en: "Text to React component generation" }, url: "https://v0.dev", pricing: "무료~$20/월", monthlyEstimate: "$0", koreanSupport: false, aiPowered: true, recommended: true, tags: ["UI", "AI", "프로토타입"] },
      { name: "Figma", category: "디자인", description: { ko: "UI/UX 디자인 표준. AI 플러그인으로 에셋 자동 생성", en: "UI/UX design standard with AI plugins" }, url: "https://figma.com", pricing: "무료~$15/월", monthlyEstimate: "$0", koreanSupport: true, aiPowered: true, recommended: true, tags: ["디자인", "UI/UX"] },
      { name: "Framer", category: "랜딩페이지", description: { ko: "노코드 랜딩페이지 빌더 — 30분 내 출시 가능", en: "No-code landing page — ship in 30 min" }, url: "https://framer.com", pricing: "무료~$15/월", monthlyEstimate: "$0", koreanSupport: false, aiPowered: true, recommended: true, tags: ["랜딩", "노코드"] },
      { name: "Next.js + Vercel", category: "프론트엔드", description: { ko: "React 풀스택 프레임워크 + 자동 배포. 스타트업 표준", en: "React fullstack framework + auto deploy" }, url: "https://vercel.com", pricing: "무료~$20/월", monthlyEstimate: "$20", koreanSupport: false, aiPowered: false, recommended: true, tags: ["프론트엔드", "배포"] },
      { name: "Supabase", category: "백엔드", description: { ko: "PostgreSQL + Auth + Storage + Realtime. Firebase 대안", en: "PostgreSQL + Auth + Storage. Firebase alternative" }, url: "https://supabase.com", pricing: "무료~$25/월", monthlyEstimate: "$25", koreanSupport: false, aiPowered: false, recommended: true, tags: ["백엔드", "DB", "인증"] },
      { name: "GitHub", category: "버전관리", description: { ko: "코드 저장소 + CI/CD + Copilot", en: "Code repository + CI/CD + Copilot" }, url: "https://github.com", pricing: "무료", monthlyEstimate: "$0", koreanSupport: false, aiPowered: true, recommended: true, tags: ["Git", "CI/CD"] },
    ],
    optionalTools: [
      { name: "Tailwind CSS + shadcn/ui", category: "UI 프레임워크", description: { ko: "유틸리티 CSS + 복사-붙여넣기 컴포넌트", en: "Utility CSS + copy-paste components" }, url: "https://ui.shadcn.com", pricing: "무료", koreanSupport: false, aiPowered: false, recommended: true, tags: ["CSS", "컴포넌트"] },
      { name: "Railway / Fly.io", category: "배포", description: { ko: "Vercel 대안 — 백엔드/서비스 배포", en: "Backend deployment alternative" }, url: "https://railway.app", pricing: "$5~/월", koreanSupport: false, aiPowered: false, recommended: false, tags: ["배포", "백엔드"] },
    ],
    aiTip: { ko: "Claude Code Skills로 테스트 작성, 린팅, 배포를 자동화하세요. 반복 작업에 시간을 쓰지 마세요. v0으로 UI 프로토타입을 빠르게 만들고, Cursor에서 세부 구현하세요.", en: "Automate tests, linting, deploy with Claude Code Skills. Use v0 for UI prototypes, Cursor for implementation." },
    estimatedMonthlyCost: "6~10만원",
  },

  // ── 4. Launch Stack ──
  {
    stageId: "launch-stack",
    title: { ko: "런칭 인프라", en: "Launch Stack" },
    description: {
      ko: "결제, 분석, 에러 추적, 고객 피드백 루프 구축",
      en: "Set up billing, analytics, error tracking, customer feedback",
    },
    essentialTools: [
      { name: "PostHog", category: "제품 분석", description: { ko: "이벤트 분석, 퍼널, 세션 리플레이 — 100만 이벤트/월 무료", en: "Event analytics, funnels, session replay — 1M events free" }, url: "https://posthog.com", pricing: "무료~", monthlyEstimate: "$0", koreanSupport: false, aiPowered: true, recommended: true, tags: ["분석", "퍼널"] },
      { name: "Sentry", category: "에러 모니터링", description: { ko: "실시간 에러 추적 + AI 자동 분류. 5K 이벤트/월 무료", en: "Real-time error tracking + AI classification" }, url: "https://sentry.io", pricing: "무료~$26/월", monthlyEstimate: "$0", koreanSupport: false, aiPowered: true, recommended: true, tags: ["에러", "모니터링"] },
      { name: "Toss Payments / PortOne", category: "결제", description: { ko: "한국 결제 연동. PortOne은 멀티PG (구 아임포트)", en: "Korean payment integration" }, url: "https://www.tosspayments.com", pricing: "거래당 수수료", koreanSupport: true, aiPowered: false, recommended: true, tags: ["결제", "한국"] },
      { name: "Channel Talk (채널톡)", category: "고객 지원", description: { ko: "실시간 채팅 + AI 봇 + CRM — 한국 스타트업 표준", en: "Live chat + AI bot + CRM — Korean standard" }, url: "https://channel.io", pricing: "무료~$36/월", monthlyEstimate: "$0", koreanSupport: true, aiPowered: true, recommended: true, tags: ["고객지원", "채팅", "한국"] },
    ],
    optionalTools: [
      { name: "Stripe", category: "글로벌 결제", description: { ko: "글로벌 결제. 해외 고객 대상 시 필수", en: "Global payments for international customers" }, url: "https://stripe.com", pricing: "2.9%+30¢/건", koreanSupport: true, aiPowered: false, recommended: false, tags: ["결제", "글로벌"] },
      { name: "Lemon Squeezy", category: "디지털 판매", description: { ko: "디지털 상품 판매 + 구독 관리 + 세금 자동 처리", en: "Digital product sales + subscriptions + tax" }, url: "https://lemonsqueezy.com", pricing: "5%+50¢/건", koreanSupport: false, aiPowered: false, recommended: false, tags: ["디지털", "구독"] },
    ],
    aiTip: { ko: "PostHog의 AI 기능으로 퍼널 이탈 원인을 자동 분석하세요. 채널톡 AI 봇으로 반복 문의를 자동 응대하면 초기에 CS 인력 없이 운영 가능합니다.", en: "Use PostHog AI for funnel analysis, Channel Talk AI bot for automated support." },
    estimatedMonthlyCost: "0~3만원",
  },

  // ── 5. Growth Engine ──
  {
    stageId: "growth-engine",
    title: { ko: "성장 엔진", en: "Growth Engine" },
    description: {
      ko: "노스스타 메트릭 설정, 주간 리뷰, 리텐션 검증",
      en: "North star metric, weekly reviews, retention verification",
    },
    essentialTools: [
      { name: "Mixpanel / Amplitude", category: "고급 분석", description: { ko: "코호트 분석, 리텐션 차트, A/B 테스트", en: "Cohort analysis, retention charts, A/B tests" }, url: "https://mixpanel.com", pricing: "무료~$25/월", monthlyEstimate: "$0", koreanSupport: false, aiPowered: true, recommended: true, tags: ["분석", "리텐션"] },
      { name: "Google Search Console", category: "SEO", description: { ko: "검색 노출 모니터링, 키워드 분석 — 무료", en: "Search visibility, keyword analysis — free" }, url: "https://search.google.com/search-console", pricing: "무료", koreanSupport: true, aiPowered: false, recommended: true, tags: ["SEO", "검색"] },
      { name: "Claude / ChatGPT", category: "콘텐츠", description: { ko: "블로그, 소셜 미디어, 이메일 마케팅 콘텐츠 생성", en: "Blog, social, email marketing content" }, url: "https://claude.ai", pricing: "$20/월", monthlyEstimate: "$20", koreanSupport: true, aiPowered: true, recommended: true, tags: ["콘텐츠", "마케팅"] },
    ],
    optionalTools: [
      { name: "Resend", category: "이메일", description: { ko: "개발자 친화적 이메일 API. React Email 지원", en: "Developer-friendly email API" }, url: "https://resend.com", pricing: "무료~$20/월", koreanSupport: false, aiPowered: false, recommended: false, tags: ["이메일", "API"] },
    ],
    aiTip: { ko: "매주 월요일 아침, Claude에 주간 데이터(MAU, 전환율, 이탈률)를 넣고 '가장 큰 레버리지 포인트 1개'를 물으세요. 데이터 기반 의사결정의 핵심.", en: "Every Monday, feed weekly data to Claude and ask for the #1 leverage point." },
    estimatedMonthlyCost: "2~5만원",
  },

  // ── 6. Company Setup ──
  {
    stageId: "company-setup",
    title: { ko: "회사 인프라", en: "Company Infrastructure" },
    description: {
      ko: "법인 등기, 계좌, 재무, 보안, 개인정보 기반 구축",
      en: "Incorporation, banking, finance, security, privacy foundations",
    },
    essentialTools: [
      { name: "자비스 (JOBIS)", category: "세무/회계", description: { ko: "AI 자동 장부 기장 + 세무 신고. 스타트업 전용 플랜", en: "AI automated bookkeeping + tax filing" }, url: "https://jobis.co", pricing: "월 5.5만원~", monthlyEstimate: "5.5만원", koreanSupport: true, aiPowered: true, recommended: true, tags: ["세무", "회계", "AI"] },
      { name: "flex", category: "HR/급여", description: { ko: "급여 자동 계산 + 근태 관리 + 전자 계약", en: "Payroll + attendance + e-contracts" }, url: "https://flex.team", pricing: "무료~", monthlyEstimate: "$0", koreanSupport: true, aiPowered: false, recommended: true, tags: ["급여", "HR"] },
      { name: "토스 비즈니스", category: "법인 계좌", description: { ko: "법인 계좌 + 카드 + 경비 관리 올인원", en: "Business account + card + expense management" }, url: "https://business.toss.im", pricing: "무료", koreanSupport: true, aiPowered: false, recommended: true, tags: ["계좌", "경비"] },
    ],
    optionalTools: [
      { name: "Vanta", category: "보안 인증", description: { ko: "SOC 2, ISO 27001 자동화. B2B SaaS 필수", en: "SOC 2, ISO 27001 automation" }, url: "https://vanta.com", pricing: "$10K+/년", koreanSupport: false, aiPowered: true, recommended: false, tags: ["보안", "인증"] },
    ],
    aiTip: { ko: "자비스 AI가 매입/매출 세금계산서를 자동 분류합니다. 초기에 직접 기장하지 마세요 — AI 세무 서비스가 월 5만원으로 시간을 절약해줍니다.", en: "Use AI bookkeeping from day one. Don't do manual accounting — it's $40/month to save hours." },
    estimatedMonthlyCost: "5~10만원",
  },

  // ── 7. Fundraising ──
  {
    stageId: "fundraising-readiness",
    title: { ko: "투자 준비", en: "Fundraising Readiness" },
    description: {
      ko: "런웨이 모델링, 마일스톤 정의, 투자자 자료 준비",
      en: "Runway modeling, milestones, investor materials",
    },
    essentialTools: [
      { name: "Claude / ChatGPT", category: "피치덱", description: { ko: "투자 피치덱 스토리라인 설계, 시장 규모 추정, 경쟁 분석", en: "Pitch deck storyline, TAM/SAM/SOM, competitive analysis" }, url: "https://claude.ai", pricing: "$20/월", monthlyEstimate: "$20", koreanSupport: true, aiPowered: true, recommended: true, tags: ["피치", "AI"] },
      { name: "Google Slides / Figma", category: "피치덱 제작", description: { ko: "투자 발표 자료 디자인", en: "Investor presentation design" }, url: "https://figma.com", pricing: "무료", monthlyEstimate: "$0", koreanSupport: true, aiPowered: false, recommended: true, tags: ["프레젠테이션"] },
      { name: "TIPS 신청", category: "정부 지원", description: { ko: "최대 5억원 (R&D 3억 + 운영 2억). 50+ 운영사", en: "Up to 500M KRW. 50+ operators" }, url: "https://www.k-startup.go.kr", pricing: "무료 (지원금)", koreanSupport: true, aiPowered: false, recommended: true, tags: ["TIPS", "정부", "투자"] },
    ],
    optionalTools: [
      { name: "DocSend", category: "피치덱 공유", description: { ko: "피치덱 링크 공유 + 열람 분석 (누가, 얼마나 봤는지)", en: "Pitch deck sharing + view analytics" }, url: "https://docsend.com", pricing: "$10/월~", koreanSupport: false, aiPowered: false, recommended: false, tags: ["피치", "분석"] },
    ],
    aiTip: { ko: "피치덱 초안을 Claude에 넣고 '투자자 관점에서 가장 약한 슬라이드 3개'를 물으세요. 그리고 TIPS 운영사별 투자 성향을 Perplexity로 조사하세요.", en: "Ask Claude to identify the 3 weakest slides from an investor's perspective." },
    estimatedMonthlyCost: "0~2만원",
  },
];

// ── AI 스타트업 추가 도구 ──
export const AI_STARTUP_EXTRA_TOOLS: SubCategoryToolOverride = {
  subIndustryId: "ai-application",
  additionalTools: [
    { name: "Anthropic Claude API", category: "LLM", description: { ko: "가장 안정적인 LLM API. claude-sonnet-4-5 기본 추천", en: "Most reliable LLM API" }, url: "https://docs.anthropic.com", pricing: "사용량 기반", monthlyEstimate: "$10~50", koreanSupport: true, aiPowered: true, recommended: true, tags: ["LLM", "API"] },
    { name: "Vercel AI SDK", category: "AI 프레임워크", description: { ko: "스트리밍 + 도구 호출 + 멀티모달. Next.js와 최적 통합", en: "Streaming + tool use + multimodal" }, url: "https://sdk.vercel.ai", pricing: "무료 (오픈소스)", koreanSupport: false, aiPowered: true, recommended: true, tags: ["프레임워크", "스트리밍"] },
    { name: "Supabase pgvector", category: "벡터 DB", description: { ko: "PostgreSQL 벡터 검색. RAG 구현 시 별도 DB 불필요", en: "Vector search in PostgreSQL. No separate DB for RAG" }, url: "https://supabase.com/docs/guides/ai", pricing: "Supabase 포함", koreanSupport: false, aiPowered: false, recommended: true, tags: ["벡터", "RAG"] },
    { name: "LangSmith / Braintrust", category: "LLM Eval", description: { ko: "LLM 출력 품질 평가, A/B 테스트, 프롬프트 관리", en: "LLM output evaluation, A/B testing, prompt management" }, url: "https://smith.langchain.com", pricing: "무료~$39/월", koreanSupport: false, aiPowered: true, recommended: true, tags: ["평가", "품질"] },
  ],
  specificTip: { ko: "2026년 AI 스타트업의 80%는 자체 모델 훈련 대신 API-first 접근을 사용합니다. Claude API + pgvector RAG로 시작하고, PMF 검증 후 파인튜닝을 고려하세요.", en: "80% of 2026 AI startups use API-first. Start with Claude API + pgvector RAG." },
};

// ── B2B SaaS 추가 도구 ──
export const SAAS_STARTUP_EXTRA_TOOLS: SubCategoryToolOverride = {
  subIndustryId: "b2b-saas",
  additionalTools: [
    { name: "Stripe / Paddle", category: "구독 결제", description: { ko: "반복 결제 + 구독 관리 + 세금 자동 처리", en: "Recurring billing + subscription management" }, url: "https://stripe.com", pricing: "2.9%+30¢/건", koreanSupport: true, aiPowered: false, recommended: true, tags: ["구독", "결제"] },
    { name: "Intercom", category: "고객 성공", description: { ko: "AI 챗봇 + 온보딩 투어 + 이메일 자동화", en: "AI chatbot + onboarding tours + email automation" }, url: "https://intercom.com", pricing: "$39/월~", monthlyEstimate: "$39", koreanSupport: false, aiPowered: true, recommended: true, tags: ["CS", "온보딩"] },
  ],
  specificTip: { ko: "B2B SaaS는 첫 10명의 유료 고객이 핵심입니다. 가격보다 '이 사람이 돈을 내는가?'에 집중하세요. usage-based 가격이 2026년 트렌드.", en: "Focus on first 10 paying customers. Usage-based pricing is the 2026 trend." },
};

// ── 개발자 도구 추가 ──
export const DEVTOOL_STARTUP_EXTRA_TOOLS: SubCategoryToolOverride = {
  subIndustryId: "developer-tools",
  additionalTools: [
    { name: "GitHub (OSS 전략)", category: "오픈소스", description: { ko: "오픈소스 커뮤니티 구축 → 유료 클라우드 전환 모델", en: "Open source community → paid cloud conversion" }, url: "https://github.com", pricing: "무료", koreanSupport: false, aiPowered: false, recommended: true, tags: ["오픈소스", "커뮤니티"] },
    { name: "npm / PyPI", category: "패키지 배포", description: { ko: "라이브러리/SDK 배포. 개발자 도달의 핵심 채널", en: "Library/SDK distribution" }, url: "https://npmjs.com", pricing: "무료", koreanSupport: false, aiPowered: false, recommended: true, tags: ["배포", "SDK"] },
  ],
  specificTip: { ko: "개발자 도구는 5분 안에 가치를 보여줘야 합니다. README → 설치 → 첫 결과까지 5분 이내. 문서가 곧 마케팅.", en: "5-minute rule: README → install → first result in under 5 minutes. Docs are your marketing." },
};

// ── 핀테크 추가 ──
export const FINTECH_STARTUP_EXTRA_TOOLS: SubCategoryToolOverride = {
  subIndustryId: "fintech-startup",
  additionalTools: [
    { name: "혁신금융서비스 (샌드박스)", category: "규제", description: { ko: "2년간 규제 면제. 핀테크 MVP 테스트 필수 경로", en: "2-year regulatory exemption for fintech testing" }, url: "https://www.fss.or.kr", pricing: "무료 (신청)", koreanSupport: true, aiPowered: false, recommended: true, tags: ["규제", "샌드박스"] },
    { name: "오픈뱅킹 API", category: "금융 데이터", description: { ko: "은행 계좌 조회/이체. 핀테크센터 등록 필수", en: "Bank account inquiry/transfer" }, url: "https://www.open-platform.or.kr", pricing: "등록 필요", koreanSupport: true, aiPowered: false, recommended: true, tags: ["오픈뱅킹", "API"] },
  ],
  specificTip: { ko: "핀테크는 규제가 가장 큰 장벽입니다. 혁신금융서비스 샌드박스를 먼저 신청하세요 (심사 3-6개월). 전자금융업 등록에는 자본금 5억원이 필요합니다.", en: "Regulation is the biggest barrier. Apply for sandbox first (3-6 month review). E-finance license requires 500M KRW capital." },
};

// ── 모든 서브카테고리 오버라이드 맵 ──
export const SUB_CATEGORY_TOOL_OVERRIDES: Record<string, SubCategoryToolOverride> = {
  "ai-application": AI_STARTUP_EXTRA_TOOLS,
  "b2b-saas": SAAS_STARTUP_EXTRA_TOOLS,
  "developer-tools": DEVTOOL_STARTUP_EXTRA_TOOLS,
  "fintech-startup": FINTECH_STARTUP_EXTRA_TOOLS,
};

// ── 유틸리티 ──

export function getStageTools(stageId: string): StageToolKit | undefined {
  return STARTUP_STAGE_TOOLS.find(s => s.stageId === stageId);
}

export function getSubCategoryExtras(subIndustryId: string): SubCategoryToolOverride | undefined {
  return SUB_CATEGORY_TOOL_OVERRIDES[subIndustryId];
}

/** 스테이지 + 서브카테고리 결합된 도구 목록 반환 */
export function getFullToolKit(stageId: string, subIndustryId?: string): {
  essential: StartupTool[];
  optional: StartupTool[];
  aiTip: { ko: string; en: string };
  monthlyCost: string;
} {
  const base = getStageTools(stageId);
  if (!base) return { essential: [], optional: [], aiTip: { ko: "", en: "" }, monthlyCost: "—" };

  const extra = subIndustryId ? getSubCategoryExtras(subIndustryId) : undefined;
  return {
    essential: [...base.essentialTools, ...(extra?.additionalTools ?? [])],
    optional: base.optionalTools,
    aiTip: extra?.specificTip ?? base.aiTip,
    monthlyCost: base.estimatedMonthlyCost,
  };
}
