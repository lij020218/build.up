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
  recommended: boolean;      // Found.One 추천
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

  // ── 4. Launch Stack + GTM ──
  {
    stageId: "launch-gtm",
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

// ── 헬스테크 추가 (의료 워크플로) ──
export const HEALTHTECH_STARTUP_EXTRA_TOOLS: SubCategoryToolOverride = {
  subIndustryId: "healthtech-startup",
  additionalTools: [
    { name: "Medplum", category: "FHIR 임상 백엔드", description: { ko: "FHIR 네이티브 오픈소스 헤드리스 EHR. 자체 EHR을 짓지 않고 임상 워크플로를 표준 리소스로 구현.", en: "FHIR-native open-source headless EHR — build clinical workflows on standard resources instead of a custom EHR." }, url: "https://www.medplum.com/pricing", pricing: "Free / Production $2,000/mo(BAA) / 셀프호스팅 무료", monthlyEstimate: "$0~$2,000", koreanSupport: false, aiPowered: false, recommended: true, tags: ["FHIR", "EHR", "오픈소스", "HIPAA", "BAA"] },
    { name: "Paubox Email API", category: "HIPAA 준수 통신", description: { ko: "PHI 포함 환자 알림을 암호화로 안전 발송하는 HIPAA 준수 트랜잭션 이메일 API.", en: "HIPAA-compliant transactional email API to safely send PHI-containing patient notifications." }, url: "https://www.paubox.com/pricing/paubox-email-api", pricing: "월 300건 무료, 이후 유료", monthlyEstimate: "$0~사용량", koreanSupport: false, aiPowered: false, recommended: true, tags: ["HIPAA", "이메일", "PHI", "BAA"] },
    { name: "AWS HealthLake", category: "관리형 FHIR 데이터스토어", description: { ko: "HL7 FHIR로 임상·행정 데이터를 적재·정규화·검색하는 HIPAA 적격 관리형 서비스.", en: "HIPAA-eligible managed service to ingest/normalize/query data in HL7 FHIR." }, url: "https://aws.amazon.com/healthlake/pricing/", pricing: "$0.27/데이터스토어-시간 + 저장료", monthlyEstimate: "약 $195+/mo", koreanSupport: false, aiPowered: true, recommended: false, tags: ["FHIR", "AWS", "HIPAA"] },
  ],
  specificTip: { ko: "진단·치료 판단 로직이 들어가면 식약처 SaMD(소프트웨어 의료기기) 해당 여부부터 판정하라(분류·등급 가이드 2026.3 개정). 비대면진료는 의료법 개정으로 2026.12.24 정식 시행되니 전자처방전·약배송 연동을 처음부터 설계에 반영할 것. 의료데이터는 BAA 가능한 클라우드에만 올리고, 동의·접근 감사로그는 FHIR Consent/AuditEvent로 표준화하라.", en: "If diagnostic/therapeutic logic is involved, first assess MFDS SaMD classification. Telehealth becomes law on 2026-12-24 — design e-prescription/Rx-delivery from day one. Keep medical data only on BAA-capable clouds; standardize consent/audit logs via FHIR Consent/AuditEvent." },
};

// ── 보안 추가 (트러스트·컴플라이언스) ──
export const SECURITY_STARTUP_EXTRA_TOOLS: SubCategoryToolOverride = {
  subIndustryId: "security-startup",
  additionalTools: [
    { name: "Aikido Security", category: "올인원 AppSec", description: { ko: "SAST·SCA·DAST·IaC·CSPM·시크릿·컨테이너를 한 대시보드로 통합한 개발자 친화 보안 플랫폼.", en: "Developer-friendly platform unifying SAST/SCA/DAST/IaC/CSPM/secrets/containers in one dashboard." }, url: "https://www.aikido.dev/", pricing: "Free(2명·10repo) / Basic $300/mo / Pro $600/mo", monthlyEstimate: "$0~$600", koreanSupport: false, aiPowered: true, recommended: true, tags: ["AppSec", "SAST", "DAST", "CSPM"] },
    { name: "Vanta", category: "컴플라이언스 자동화", description: { ko: "SOC2·ISO27001·HIPAA·GDPR 증적을 상시 자동 수집해 첫 엔터프라이즈 딜의 보안 실사를 통과시키는 GRC 자동화.", en: "GRC automation continuously collecting SOC2/ISO27001/HIPAA/GDPR evidence to pass enterprise security reviews." }, url: "https://www.vanta.com/", pricing: "Core ~$10,000/yr(<50명), 스타트업 할인", monthlyEstimate: "약 $800+/mo", koreanSupport: false, aiPowered: true, recommended: true, tags: ["SOC2", "ISO27001", "GRC", "트러스트센터"] },
    { name: "GitGuardian", category: "시크릿 유출 탐지", description: { ko: "코드·CI/CD·git 히스토리·협업툴 전반에서 하드코딩된 API키·시크릿(420+종)을 탐지.", en: "Detect hardcoded API keys/secrets (420+ types) across code, CI/CD, git history and collab tools." }, url: "https://www.gitguardian.com/", pricing: "개인/공개 repo 무료, 비공개·팀 유료", monthlyEstimate: "$0~개발자당", koreanSupport: false, aiPowered: true, recommended: true, tags: ["시크릿", "유출탐지", "git"] },
    { name: "Cobalt (PTaaS)", category: "펜테스트", description: { ko: "SOC2/ISO27001·고객 실사용 컴플라이언스 펜테스트를 온디맨드로 제공하는 PTaaS.", en: "PTaaS delivering on-demand compliance pentests for SOC2/ISO27001 and customer security reviews." }, url: "https://www.cobalt.io/", pricing: "$2,500/mo + 크레딧", monthlyEstimate: "약 $2,500+/mo", koreanSupport: false, aiPowered: false, recommended: false, tags: ["펜테스트", "PTaaS", "SOC2"] },
  ],
  specificTip: { ko: "보안 제품을 파는 회사일수록 자기 보안을 먼저 증명해야 한다. 글로벌 SOC2/ISO27001(Vanta)은 해외 딜용, 한국 공공·금융·SaaS 조달엔 ISMS-P 인증과 CSAP가 사실상 필수다. CSAP는 ISMS 기반 민간 자율인증으로 개편 중이고, ISMS-P 2026 개편은 CTEM·AI 거버넌스·실시간 자동스캔을 요구하니 Cloud SIEM 상시 모니터링을 일찍 깔아두라.", en: "A company selling security must prove its own first. Global SOC2/ISO27001 (Vanta) is for overseas deals; Korean public/finance/SaaS procurement needs ISMS-P and CSAP. ISMS-P 2026 mandates CTEM/AI-governance/real-time auto-scan — stand up Cloud SIEM early." },
};

// ── 모든 서브카테고리 오버라이드 맵 ──
export const SUB_CATEGORY_TOOL_OVERRIDES: Record<string, SubCategoryToolOverride> = {
  "ai-application": AI_STARTUP_EXTRA_TOOLS,
  "b2b-saas": SAAS_STARTUP_EXTRA_TOOLS,
  "developer-tools": DEVTOOL_STARTUP_EXTRA_TOOLS,
  "fintech-startup": FINTECH_STARTUP_EXTRA_TOOLS,
  "healthtech-startup": HEALTHTECH_STARTUP_EXTRA_TOOLS,
  "security-startup": SECURITY_STARTUP_EXTRA_TOOLS,
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

// ─── 추천 기술 스택 조합 (2026) ──────────────────────────────────────────

export type StackLayer = {
  role: string;           // "프론트엔드", "백엔드", "데이터베이스" 등
  roleEn: string;
  tool: string;
  why: { ko: string; en: string };
  url: string;
  pricing: string;
  icon: string;           // 1글자 아이콘
  color: string;
};

export type RecommendedStack = {
  id: string;
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  targetSubIndustries: string[];  // 해당하는 세부 업종 ID
  layers: StackLayer[];
  totalMonthlyCost: string;
  startupCredits: { ko: string; en: string };
};

export const RECOMMENDED_STACKS: RecommendedStack[] = [
  // ── AI 앱 / 에이전트 스택 ──
  {
    id: "ai-app-stack",
    name: { ko: "AI 앱 스택", en: "AI App Stack" },
    description: { ko: "AI 기반 제품을 빠르게 구축하기 위한 최적 조합", en: "Optimal stack for building AI products fast" },
    targetSubIndustries: ["ai-application"],
    layers: [
      { role: "디자인", roleEn: "Design", tool: "Figma + v0", why: { ko: "Figma로 설계, v0으로 React 컴포넌트 즉시 생성", en: "Design in Figma, generate React with v0" }, url: "https://v0.dev", pricing: "무료", icon: "🎨", color: "#7c3aed" },
      { role: "프론트엔드", roleEn: "Frontend", tool: "Next.js + Tailwind + shadcn/ui", why: { ko: "React 풀스택. SSR/ISR 기본 지원. Vercel과 최적 통합", en: "React fullstack. SSR/ISR built-in. Best with Vercel" }, url: "https://nextjs.org", pricing: "무료 (오픈소스)", icon: "⚛️", color: "#0f172a" },
      { role: "배포", roleEn: "Deployment", tool: "Vercel", why: { ko: "Next.js 공식 호스팅. Git push → 자동 배포. Edge Functions", en: "Official Next.js hosting. Git push → auto deploy" }, url: "https://vercel.com", pricing: "$20/월 (Pro)", icon: "▲", color: "#000000" },
      { role: "백엔드 + DB", roleEn: "Backend + DB", tool: "Supabase", why: { ko: "PostgreSQL + Auth + Storage + Realtime + pgvector(RAG). 올인원", en: "PostgreSQL + Auth + Storage + Realtime + pgvector. All-in-one" }, url: "https://supabase.com", pricing: "$25/월 (Pro)", icon: "⚡", color: "#3ecf8e" },
      { role: "AI 엔진", roleEn: "AI Engine", tool: "Anthropic Claude API", why: { ko: "가장 안정적인 LLM. 200K 토큰 컨텍스트. 도구 호출 지원", en: "Most reliable LLM. 200K context. Tool use support" }, url: "https://docs.anthropic.com", pricing: "사용량 기반 (~$10-50/월)", icon: "🧠", color: "#d97706" },
      { role: "AI 프레임워크", roleEn: "AI Framework", tool: "Vercel AI SDK", why: { ko: "스트리밍 + 도구 호출 + 멀티모달. Next.js와 네이티브 통합", en: "Streaming + tool use + multimodal. Native Next.js" }, url: "https://sdk.vercel.ai", pricing: "무료 (오픈소스)", icon: "🔗", color: "#2563eb" },
      { role: "벡터 검색 (RAG)", roleEn: "Vector Search", tool: "Supabase pgvector", why: { ko: "별도 벡터 DB 불필요. PostgreSQL 안에서 바로 RAG 구현", en: "No separate vector DB. RAG inside PostgreSQL" }, url: "https://supabase.com/docs/guides/ai", pricing: "Supabase 포함", icon: "🔍", color: "#059669" },
      { role: "코딩 AI", roleEn: "Coding AI", tool: "Claude Code + Cursor", why: { ko: "Claude Code: 터미널 자동화/Skills. Cursor: AI IDE. 병행 사용 최적", en: "Claude Code: terminal automation. Cursor: AI IDE" }, url: "https://claude.ai/code", pricing: "$20+$20/월", icon: "💻", color: "#7c3aed" },
      { role: "분석", roleEn: "Analytics", tool: "PostHog", why: { ko: "이벤트 분석 + 퍼널 + 세션 리플레이. 100만 이벤트/월 무료", en: "Events + funnels + session replay. 1M events free" }, url: "https://posthog.com", pricing: "무료", icon: "📊", color: "#1d4ed8" },
      { role: "에러 추적", roleEn: "Error Tracking", tool: "Sentry", why: { ko: "실시간 에러 감지 + AI 자동 분류. 5K 이벤트/월 무료", en: "Real-time errors + AI classification. 5K free" }, url: "https://sentry.io", pricing: "무료", icon: "🛡️", color: "#362d59" },
      { role: "결제 (한국)", roleEn: "Payments (KR)", tool: "Toss Payments", why: { ko: "한국 결제 1위. 카드/간편결제 통합. API 문서 우수", en: "Korea #1 payments. Card/easy pay. Great API docs" }, url: "https://www.tosspayments.com", pricing: "거래당 수수료", icon: "💳", color: "#0064ff" },
      { role: "고객 지원", roleEn: "Support", tool: "채널톡 (Channel Talk)", why: { ko: "실시간 채팅 + AI 봇 + CRM. 한국 스타트업 표준", en: "Live chat + AI bot + CRM. Korean standard" }, url: "https://channel.io", pricing: "무료~$36/월", icon: "💬", color: "#3b5998" },
    ],
    totalMonthlyCost: "$85~135/월 (약 11~18만원)",
    startupCredits: { ko: "Vercel $3,500 + Supabase $500 + AWS $5,000 = 스타트업 크레딧 총 $9,000+ 가능", en: "Startup credits: Vercel $3.5K + Supabase $500 + AWS $5K = $9K+ available" },
  },

  // ── B2B SaaS 스택 ──
  {
    id: "saas-stack",
    name: { ko: "B2B SaaS 스택", en: "B2B SaaS Stack" },
    description: { ko: "구독 기반 비즈니스 소프트웨어 구축용", en: "For subscription-based business software" },
    targetSubIndustries: ["b2b-saas", "developer-tools"],
    layers: [
      { role: "디자인", roleEn: "Design", tool: "Figma", why: { ko: "팀 협업 디자인. 컴포넌트 라이브러리 + Dev Mode", en: "Team design collaboration. Components + Dev Mode" }, url: "https://figma.com", pricing: "무료~$15/월", icon: "🎨", color: "#7c3aed" },
      { role: "프론트엔드", roleEn: "Frontend", tool: "Next.js + Tailwind + shadcn/ui", why: { ko: "대시보드 UI에 최적. SSR로 SEO 지원. 마케팅 페이지 겸용", en: "Best for dashboards. SSR for SEO. Marketing pages too" }, url: "https://nextjs.org", pricing: "무료", icon: "⚛️", color: "#0f172a" },
      { role: "배포", roleEn: "Deployment", tool: "Vercel", why: { ko: "프리뷰 배포 → 팀 리뷰 → 프로덕션. CI/CD 내장", en: "Preview deploy → team review → production. CI/CD built-in" }, url: "https://vercel.com", pricing: "$20/월", icon: "▲", color: "#000000" },
      { role: "백엔드 + DB", roleEn: "Backend + DB", tool: "Supabase", why: { ko: "Auth + RLS + 실시간 구독. 멀티테넌시 구현 용이", en: "Auth + RLS + realtime subscriptions. Easy multi-tenancy" }, url: "https://supabase.com", pricing: "$25/월", icon: "⚡", color: "#3ecf8e" },
      { role: "구독 결제", roleEn: "Billing", tool: "Stripe (글로벌) / Toss (한국)", why: { ko: "Stripe: 글로벌 구독 관리. Toss: 한국 카드/계좌이체", en: "Stripe: global subscriptions. Toss: Korean payments" }, url: "https://stripe.com", pricing: "2.9%+30¢/건", icon: "💳", color: "#635bff" },
      { role: "코딩 AI", roleEn: "Coding AI", tool: "Claude Code + Cursor", why: { ko: "보일러플레이트 자동 생성. CRUD API 10분 내 구현", en: "Auto-generate boilerplate. CRUD API in 10 min" }, url: "https://claude.ai/code", pricing: "$20+$20/월", icon: "💻", color: "#7c3aed" },
      { role: "분석", roleEn: "Analytics", tool: "PostHog + Mixpanel", why: { ko: "PostHog: 제품 분석. Mixpanel: 코호트/리텐션 심층 분석", en: "PostHog: product. Mixpanel: cohort/retention deep dive" }, url: "https://posthog.com", pricing: "무료", icon: "📊", color: "#1d4ed8" },
      { role: "고객 성공", roleEn: "Customer Success", tool: "채널톡 / Intercom", why: { ko: "한국 고객: 채널톡. 글로벌: Intercom. AI 봇으로 자동 응대", en: "Korean: Channel Talk. Global: Intercom. AI bot auto-reply" }, url: "https://channel.io", pricing: "무료~$39/월", icon: "💬", color: "#3b5998" },
      { role: "이메일", roleEn: "Email", tool: "Resend + React Email", why: { ko: "트랜잭션 이메일 API. React로 이메일 템플릿 작성", en: "Transactional email API. React email templates" }, url: "https://resend.com", pricing: "무료~$20/월", icon: "📧", color: "#0f172a" },
    ],
    totalMonthlyCost: "$85~120/월 (약 11~16만원)",
    startupCredits: { ko: "Stripe Atlas: 법인설립 + $5,000+ 크레딧 패키지", en: "Stripe Atlas: incorporation + $5,000+ credits package" },
  },

  // ── 핀테크 스택 ──
  {
    id: "fintech-stack",
    name: { ko: "핀테크 스택", en: "Fintech Stack" },
    description: { ko: "금융 서비스 규제 환경에서 안전하게 구축", en: "Build safely in financial regulatory environment" },
    targetSubIndustries: ["fintech-startup"],
    layers: [
      { role: "프론트엔드", roleEn: "Frontend", tool: "Next.js + Tailwind", why: { ko: "보안 헤더 + CSP 설정이 쉬움. 금융 서비스 UI 표준", en: "Easy security headers + CSP. Financial UI standard" }, url: "https://nextjs.org", pricing: "무료", icon: "⚛️", color: "#0f172a" },
      { role: "배포", roleEn: "Deployment", tool: "AWS (ECS/Lambda)", why: { ko: "금융 규제 준수에 필요한 VPC, WAF, 감사 로그 지원", en: "VPC, WAF, audit logs for financial compliance" }, url: "https://aws.amazon.com", pricing: "사용량 기반", icon: "☁️", color: "#ff9900" },
      { role: "백엔드", roleEn: "Backend", tool: "Supabase + AWS RDS", why: { ko: "Supabase로 빠른 개발, AWS RDS로 금융 등급 DB 이중화", en: "Supabase for speed, AWS RDS for financial-grade DB" }, url: "https://supabase.com", pricing: "$25+/월", icon: "⚡", color: "#3ecf8e" },
      { role: "금융 API", roleEn: "Finance API", tool: "오픈뱅킹 API", why: { ko: "은행 계좌 조회/이체. 핀테크센터 등록 필수 (3~6개월)", en: "Bank account inquiry/transfer. Registration required" }, url: "https://www.open-platform.or.kr", pricing: "등록 필요", icon: "🏦", color: "#059669" },
      { role: "규제 샌드박스", roleEn: "Sandbox", tool: "혁신금융서비스", why: { ko: "2년간 규제 면제. MVP 테스트 필수 경로. 심사 3~6개월", en: "2-year exemption. Required for MVP testing" }, url: "https://www.fss.or.kr", pricing: "무료 (신청)", icon: "🏛️", color: "#1d4ed8" },
      { role: "보안", roleEn: "Security", tool: "AWS WAF + CloudTrail", why: { ko: "금융 서비스 필수 보안. DDoS 방어 + 감사 추적", en: "Financial security essentials. DDoS + audit trail" }, url: "https://aws.amazon.com/waf", pricing: "$5+/월", icon: "🛡️", color: "#dc2626" },
      { role: "코딩 AI", roleEn: "Coding AI", tool: "Claude Code", why: { ko: "보안 코드 리뷰 + 규정 준수 체크에 활용", en: "Security code review + compliance checking" }, url: "https://claude.ai/code", pricing: "$20/월", icon: "💻", color: "#7c3aed" },
    ],
    totalMonthlyCost: "$100~200+/월 (+ 자본금 5억원 필요)",
    startupCredits: { ko: "AWS Activate: 최대 $100,000 크레딧 (스타트업 프로그램)", en: "AWS Activate: up to $100K credits" },
  },

  // ── 헬스테크 스택 ──
  {
    id: "healthtech-startup-stack",
    name: { ko: "헬스테크 의료 워크플로 스택", en: "Healthtech Clinical Workflow Stack" },
    description: { ko: "FHIR 표준 임상 데이터, 의료정보 보안(HIPAA·개인정보), 한국 의료 규제(비대면진료·식약처 SaMD)를 동시에 만족시키는 의료 B2B SaaS 인프라. 제네릭 SaaS 스택 위에 '규제 가능한 의료 데이터 레이어'를 얹는 구성.", en: "Clinical B2B SaaS infra satisfying FHIR data, medical-grade security, and Korean medical regulation — a regulated health-data layer on the generic SaaS stack." },
    targetSubIndustries: ["healthtech-startup"],
    layers: [
      { role: "FHIR 임상 백엔드", roleEn: "FHIR Clinical Backend", tool: "Medplum", why: { ko: "FHIR 네이티브 헤드리스 EHR. 차팅·오더·동의를 FHIR 리소스로 직접 다뤄 자체 EHR 불필요. 오픈소스 셀프호스팅 또는 BAA 호스팅.", en: "FHIR-native headless EHR — no custom EHR needed. Open-source self-host or BAA hosting." }, url: "https://www.medplum.com", pricing: "Free / Production $2,000/mo / 셀프호스팅 무료", icon: "🩺", color: "#1A6FE3" },
      { role: "HIPAA 적격 클라우드", roleEn: "HIPAA-Eligible Cloud", tool: "Google Cloud Healthcare API / AWS HealthLake", why: { ko: "FHIR/HL7v2/DICOM을 BAA 하에 운영. 제네릭 Vercel/Supabase로 못 채우는 의료데이터 BAA 요건을 메움.", en: "Run FHIR/HL7v2/DICOM under a BAA — fills the medical-data BAA gap generic clouds can't." }, url: "https://cloud.google.com/healthcare-api", pricing: "종량제", icon: "☁️", color: "#4285F4" },
      { role: "한국 의료 클라우드", roleEn: "Korean Medical Cloud", tool: "NAVER Cloud (의료) / NHN Cloud", why: { ko: "국내 병원·공공의료 데이터 거주 필요 시. CSAP·ISMS-P·의료정보보호 인증 보유 — 글로벌 클라우드만으론 한국 조달 미충족.", en: "For Korean hospital/public data residency. CSAP/ISMS-P/medical-security certified." }, url: "https://www.ncloud.com/v2/solution/industry/medical", pricing: "종량제", icon: "🇰🇷", color: "#03C75A" },
      { role: "HIPAA 준수 통신", roleEn: "HIPAA-Compliant Comms", tool: "Paubox Email API", why: { ko: "환자 알림을 PHI 포함 상태로 암호화 발송. 제네릭 Resend는 BAA·PHI 발송을 보장하지 않음.", en: "Send PHI-containing patient notifications encrypted — generic Resend doesn't guarantee BAA/PHI." }, url: "https://www.paubox.com", pricing: "월 300건 무료~", icon: "📧", color: "#0B5FFF" },
      { role: "의료데이터 보안 스캐닝", roleEn: "Security Scanning", tool: "Snyk", why: { ko: "PHI를 다루는 코드·의존성·컨테이너 취약점 상시 스캔. HIPAA 보안규칙의 개발 단계 통제.", en: "Continuously scan code/deps/containers handling PHI — a dev-stage control for the HIPAA Security Rule." }, url: "https://snyk.io/plans/", pricing: "Free / Team $25/dev/mo", icon: "🛡️", color: "#4C4A73" },
      { role: "한국 의료 규제 (SaMD·비대면)", roleEn: "Korean Medical Regulatory", tool: "식약처 디지털헬스 가이드라인 + 비대면진료 대응", why: { ko: "진단·치료 알고리즘은 SaMD 해당 여부 판정 필요(가이드 2026.3 개정). 비대면진료 2026.12.24 시행 — 전자처방전·약배송 연동 설계.", en: "Diagnostic algorithms need SaMD assessment. Telehealth law effective 2026-12-24 — design e-prescription/Rx-delivery." }, url: "https://www.mfds.go.kr", pricing: "가이드 무료(허가심사 별도)", icon: "📋", color: "#005BAC" },
      { role: "동의·감사로그", roleEn: "Consent & Audit", tool: "FHIR Consent/AuditEvent (Medplum 내장)", why: { ko: "처리 동의·접근 감사로그를 FHIR 표준 리소스로 기록. ISMS-P/HIPAA가 요구하는 'PHI 접근 증적'을 표준 스키마로 확보.", en: "Record consent/access audit as standard FHIR resources — the PHI-access evidence ISMS-P/HIPAA demand." }, url: "https://www.medplum.com/docs/compliance/hipaa", pricing: "백엔드 플랜 포함", icon: "🔐", color: "#2E7D6B" },
    ],
    totalMonthlyCost: "초기 $0~150 / 성장기 $2,500~3,500 + 한국 클라우드 종량제",
    startupCredits: { ko: "AWS Activate 최대 $100,000 + AWS Healthcare Accelerator. Google for Startups Cloud 크레딧. 식약처 디지털헬스규제지원과 무료 컨설팅.", en: "AWS Activate up to $100K + Healthcare Accelerator. Google for Startups Cloud credits. MFDS free regulatory consultation." },
  },

  // ── 사이버보안 스택 ──
  {
    id: "security-startup-stack",
    name: { ko: "사이버보안 트러스트 스택", en: "Security Trust Stack" },
    description: { ko: "보안 제품을 파는 회사일수록 자신의 보안·컴플라이언스를 증명해야 함. SOC2/ISO27001 자동화 + 한국 ISMS-P/CSAP 대응 + 코드·클라우드·시크릿 전 구간 방어.", en: "A company selling security must prove its own. SOC2/ISO27001 automation + Korean ISMS-P/CSAP + end-to-end code/cloud/secrets defense." },
    targetSubIndustries: ["security-startup"],
    layers: [
      { role: "컴플라이언스 자동화", roleEn: "Compliance Automation", tool: "Vanta (또는 Drata)", why: { ko: "SOC2·ISO27001·HIPAA·GDPR 증적 상시 자동 수집. 첫 엔터프라이즈 딜의 게이트키퍼.", en: "Continuously auto-collect SOC2/ISO27001 evidence — the gatekeeper for the first enterprise deal." }, url: "https://www.vanta.com/", pricing: "~$10,000/yr(Core)", icon: "✅", color: "#6A5CFF" },
      { role: "올인원 AppSec", roleEn: "All-in-One AppSec", tool: "Aikido Security", why: { ko: "SAST·SCA·DAST·IaC·CSPM·시크릿·컨테이너를 한 대시보드로. 시트 무관 정액제라 작은 팀에 현실적.", en: "SAST/SCA/DAST/IaC/CSPM/secrets in one dashboard. Flat pricing realistic for small teams." }, url: "https://www.aikido.dev/", pricing: "Free / Basic $300/mo / Pro $600/mo", icon: "🥋", color: "#FF6B35" },
      { role: "클라우드 보안 (Cloud SIEM)", roleEn: "Cloud SIEM", tool: "Datadog Cloud SIEM", why: { ko: "클라우드 로그·이벤트 기반 위협 탐지. ISMS-P 2026이 요구하는 실시간 스캔·CTEM에 부합.", en: "Cloud log/event threat detection — aligns with ISMS-P 2026 real-time scan/CTEM." }, url: "https://www.datadoghq.com/product/cloud-siem/", pricing: "$5~7.50/100만 이벤트, Free 티어", icon: "📡", color: "#632CA6" },
      { role: "시크릿 관리", roleEn: "Secrets Management", tool: "Doppler", why: { ko: "환경별 시크릿·API키 중앙 관리·로테이션·접근통제. Vault 대비 예측 가능한 정액.", en: "Centralized per-env secrets/key management with predictable pricing vs Vault." }, url: "https://www.doppler.com/", pricing: "Free / Team ~$18~21/user/mo", icon: "🔑", color: "#3B0FB0" },
      { role: "시크릿 유출 탐지", roleEn: "Secrets Leak Detection", tool: "GitGuardian", why: { ko: "코드·CI/CD·git 히스토리·협업툴의 하드코딩 시크릿 탐지(420+종). 보안 회사가 자기 키를 흘리면 치명적.", en: "Detect hardcoded secrets (420+) across code/CI-CD/git/collab — fatal for a security firm to leak its own." }, url: "https://www.gitguardian.com/", pricing: "개인/공개 무료", icon: "🕵️", color: "#222B45" },
      { role: "펜테스트 (PTaaS)", roleEn: "Penetration Testing", tool: "Cobalt", why: { ko: "SOC2/ISO27001·고객 실사용 컴플라이언스 펜테스트를 온디맨드로. 전통 펜테스트 대비 빠르고 저렴.", en: "On-demand compliance pentests for SOC2/ISO27001 — faster/cheaper than traditional firms." }, url: "https://www.cobalt.io/", pricing: "$2,500/mo + 크레딧", icon: "💥", color: "#1F2A44" },
      { role: "한국 인증 (ISMS-P / CSAP)", roleEn: "Korean Certification", tool: "ISMS-P + CSAP (KISA/NIS) + 국내 컨설팅", why: { ko: "한국 공공·금융·SaaS 조달의 사실상 필수. CSAP는 ISMS 기반 민간 자율인증으로 개편 중, ISMS-P 2026은 CTEM·AI 거버넌스 추가.", en: "De facto required for Korean public/finance/SaaS procurement. CSAP moving to ISMS-based self-cert; ISMS-P 2026 adds CTEM/AI-governance." }, url: "https://isms-p.or.kr/main.do", pricing: "심사 수수료 + 컨설팅", icon: "🇰🇷", color: "#003478" },
    ],
    totalMonthlyCost: "초기 $0~300 / 성장기 $2,000~4,500/mo + ISMS-P 인증 비용 별도",
    startupCredits: { ko: "Vanta/Drata 스타트업·YC 할인. AWS Activate $100,000. KISA·과기정통부 정보보호 스타트업 지원·CSAP 전환 지원.", en: "Vanta/Drata startup/YC discounts. AWS Activate $100K. KISA/MSIT infosec startup & CSAP transition support." },
  },

  // ── 하드웨어·IoT 출시 스택 ──
  {
    id: "hardware-iot-launch-gtm",
    name: { ko: "하드웨어·IoT 출시 스택", en: "Hardware / IoT Launch Stack" },
    description: { ko: "양산 직전~출시(GTM) 단계의 IoT 하드웨어 스타트업을 위한 펌웨어 OTA·클라우드·디바이스 관리·앱·크라우드펀딩 표준 조합.", en: "Firmware OTA, cloud, device management, app, and crowdfunding for IoT hardware startups at the pre-mass-production / GTM stage." },
    targetSubIndustries: ["hardware-iot"],
    layers: [
      { role: "IoT 클라우드", roleEn: "IoT Cloud", tool: "AWS IoT Core", why: { ko: "디바이스 연결·메시징·Device Shadow를 종량제로 제공. 초기 소량 디바이스에서 비용이 낮고 생태계가 가장 넓다.", en: "Pay-as-you-go connectivity/messaging/Device Shadow — low cost at small scale, widest ecosystem." }, url: "https://aws.amazon.com/iot-core/", pricing: "종량제 (1만 대 base ~$596/월)", icon: "☁️", color: "#FF9900" },
      { role: "IoT 클라우드 (대안)", roleEn: "IoT Cloud (alt)", tool: "Azure IoT Hub", why: { ko: "device twin·direct method로 OTA·설정 푸시가 티어에 포함 — 디바이스 관리가 잦으면 총비용이 낮아질 수 있다.", en: "Device twins/direct methods include OTA/config push — heavy device mgmt can total lower." }, url: "https://azure.microsoft.com/en-us/products/iot-hub", pricing: "티어 정액 (1만 대 ~$751/월)", icon: "🔧", color: "#0078D4" },
      { role: "펌웨어 OTA", roleEn: "Firmware OTA", tool: "Mender", why: { ko: "AWS·Azure 양쪽과 연동되는 시장 표준 OTA. 멀티 클라우드여도 단일 UI에서 펌웨어 배포·롤백.", en: "Market-leading OTA integrating with both AWS and Azure — rollout/rollback from one UI." }, url: "https://mender.io", pricing: "오픈소스 무료 + 호스팅 유료", icon: "🔄", color: "#2B66F6" },
      { role: "디바이스 관측·디버깅", roleEn: "Device Observability", tool: "Memfault", why: { ko: "양산 펌웨어의 크래시·메트릭을 원격 수집해 필드 이슈를 조기 발견. 출시 후 품질 사고 감소.", en: "Remotely collect crashes/metrics from production firmware — catch field issues early." }, url: "https://memfault.com", pricing: "디바이스 수 기반 (무료 평가)", icon: "📈", color: "#5B2A86" },
      { role: "모바일 앱·생태계", roleEn: "Mobile App / Ecosystem", tool: "Samsung SmartThings (연동)", why: { ko: "국내 2천만+ IoT 앱. 자체 앱 준비 전이거나 한국 스마트홈 진입이 목표면 가장 빠른 도달.", en: "Korea's largest IoT app (20M+). Fastest reach if your own app isn't ready or you target Korean smart home." }, url: "https://www.samsung.com/sec/business/b-iot-solutions/smart-home-solution-iot/", pricing: "무료 (연동)", icon: "📱", color: "#1428A0" },
      { role: "크라우드펀딩 (국내)", roleEn: "Crowdfunding (KR)", tool: "와디즈 (Wadiz)", why: { ko: "국내 1위 리워드형 펀딩. 한국 소비자 대상 선주문·시장검증·초기 매출을 한 번에.", en: "Korea's #1 reward crowdfunding — domestic pre-orders, validation, initial revenue at once." }, url: "https://www.wadiz.kr", pricing: "수수료형", icon: "🚀", color: "#00C2B3" },
      { role: "크라우드펀딩 (글로벌·양산자금)", roleEn: "Crowdfunding (global)", tool: "Kickstarter / Indiegogo", why: { ko: "글로벌 하드웨어 펀딩의 표준. 해외 선주문으로 초도양산(금형·부품) 자금을 미리 모음.", en: "Global hardware crowdfunding standard — overseas pre-orders pre-fund first-run production." }, url: "https://www.kickstarter.com", pricing: "수수료형 (~5% + 결제)", icon: "🌐", color: "#05CE78" },
      { role: "양산 파트너 연결", roleEn: "Manufacturing Sourcing", tool: "캐파 (CAPA) / Seeed Fusion", why: { ko: "펀딩 자금을 실제 양산으로 잇는 마지막 레이어. 국내는 CAPA 매칭, 해외 소량양산은 Seeed.", en: "Turns crowdfunded capital into production — CAPA for domestic, Seeed for overseas low-volume." }, url: "https://capa.ai", pricing: "무료 매칭 (양산비 별도)", icon: "🏭", color: "#111827" },
    ],
    totalMonthlyCost: "클라우드+OTA+관측 약 $150~600/월 + 펀딩·양산비는 프로젝트성",
    startupCredits: { ko: "AWS Activate(IoT Core 포함 최대 $10만), Microsoft for Startups(Azure 크레딧), 중기부 제조전문형 메이커스페이스(시제품~초도양산 정부지원).", en: "AWS Activate (up to $100K incl. IoT Core), Microsoft for Startups (Azure credits), MSS Makerspace (prototype→first-run support)." },
  },
];

/** 서브 업종 ID에 맞는 추천 스택 반환 */
export function getRecommendedStack(subIndustryId: string): RecommendedStack | undefined {
  return RECOMMENDED_STACKS.find(s => s.targetSubIndustries.includes(subIndustryId));
}

/** 모든 스타트업 서브 업종에 해당하는 기본 스택 (AI/SaaS 공통) */
export function getDefaultStartupStack(): RecommendedStack {
  return RECOMMENDED_STACKS[0]; // ai-app-stack as default
}
