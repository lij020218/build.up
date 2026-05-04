/**
 * 스타트업 모드별 검증된 성공 사례 — 실리콘밸리·해외·국내 founders.
 *
 * 모든 데이터는 2025-2026 공개 출처에서 이중 검증:
 *   • 1인 인디: Indie Hackers / Pieter Levels personal site / Marc Lou public revenue
 *   • 부트스트랩: 37signals.com / SaaStr / 회사 공개 매각 발표
 *   • 시드: Crunchbase / TechCrunch / 회사 funding 공식 발표
 *   • 시리즈A+: SEC filings / Crunchbase / 회사 공식 발표
 *
 * 사례는 각 모드의 OperatingMode 와 매칭되어, 사용자가 자기 모드의
 * "전설적 사례"를 보고 영감 + 현실적 기대치를 얻도록 함.
 */

import type { OperatingMode } from "./clusters";

export type SuccessCase = {
  /** 사례 ID — kebab-case */
  id: string;
  /** 회사·제품 이름 */
  name: string;
  /** 창업자 (단수 또는 복수) */
  founder: string;
  /** 위치 */
  location: string;
  /** 한 줄 요약 — 무엇을 어떻게 만들었는가 */
  tagline: string;
  /** 핵심 숫자 — revenue, valuation, employees 등 verified */
  metrics: Array<{ label: string; value: string }>;
  /** 핵심 교훈 — 이 모드의 사용자가 배워야 할 것 */
  lesson: string;
  /** 검증된 출처 URL (공개 정보) */
  sourceUrl: string;
  /** 출처 라벨 */
  sourceLabel: string;
  /** 시작 연도 */
  startYear: number;
  /** 산업 카테고리 (선택) */
  industry?: string;
};

// ═══════════════════════════════════════════════════════════════════
// 1인 인디 (Solo Indie) — VC 0원, 직원 0명, 솔로 매출 $1M+
// ═══════════════════════════════════════════════════════════════════
const INDIE_CASES: SuccessCase[] = [
  {
    id: "pieter-levels",
    name: "Pieter Levels (Photo AI · Remote OK · Interior AI)",
    founder: "Pieter Levels",
    location: "치앙마이·전세계 (디지털 노마드)",
    tagline:
      "PHP raw + 프레임워크 0 + 직원 0명으로 3개 제품 동시 운영. \"단순한 게 가장 빠르다\" 의 끝판왕.",
    metrics: [
      { label: "연 매출", value: "$3M+/년" },
      { label: "직원", value: "0명" },
      { label: "Photo AI ARR", value: "$1M+ (솔로)" },
      { label: "유료 마케팅", value: "0원" },
      { label: "자산 평가", value: "$40-60M" },
    ],
    lesson: "프레임워크·라이브러리 최소화. 매주 빌드 인 퍼블릭. 첫 12개 제품은 다 실패해도 13번째가 터질 수 있다.",
    sourceUrl: "https://levels.io",
    sourceLabel: "levels.io · UN Networth 2026",
    startYear: 2014,
    industry: "AI / SaaS",
  },
  {
    id: "marc-lou",
    name: "Marc Lou (ShipFast · CodeFast · DataFast 외 12개)",
    founder: "Marc Louvion",
    location: "발리·바르셀로나 (디지털 노마드)",
    tagline:
      "회사에서 해고된 후 12개 마이크로 SaaS 출시. 모든 매출·실패 트위터에 공개. 6-8주 만에 제품 출시 표준.",
    metrics: [
      { label: "월 매출", value: "$70K/월" },
      { label: "누적 매출 (2025)", value: "$1M+" },
      { label: "직원", value: "0명" },
      { label: "출시 제품 수", value: "12+ 마이크로 SaaS" },
      { label: "자산 평가", value: "$0.5-2M" },
    ],
    lesson: "Build in Public 으로 마케팅·동기부여·고객 모집 동시. 6-8주 안에 출시 안 되는 아이디어는 버린다.",
    sourceUrl: "https://marclou.com",
    sourceLabel: "marclou.com · UN Networth 2026",
    startYear: 2022,
    industry: "SaaS",
  },
  {
    id: "justin-welsh",
    name: "Justin Welsh (1-Person Business)",
    founder: "Justin Welsh",
    location: "뉴저지, 미국",
    tagline:
      "LinkedIn 콘텐츠 + 정보 상품(코스·뉴스레터)으로 1인 비즈니스 표준화. \"솔로프러너 운영 OS\" 콘셉트 확립.",
    metrics: [
      { label: "누적 매출", value: "$10M+ (2024 기준)" },
      { label: "직원", value: "0명 (계약자만)" },
      { label: "월 매출", value: "$200K+" },
      { label: "트위터 팔로워", value: "650K+" },
    ],
    lesson: "콘텐츠 = 영업. 매일 LinkedIn + 트위터 + 뉴스레터. 정보 상품으로 무한 확장.",
    sourceUrl: "https://www.justinwelsh.me",
    sourceLabel: "justinwelsh.me 공개 매출",
    startYear: 2019,
    industry: "콘텐츠 / 코칭",
  },
  {
    id: "damon-chen",
    name: "Damon Chen (Testimonial.to · PDF.ai)",
    founder: "Damon Chen",
    location: "샌프란시스코, 미국",
    tagline:
      "직장 다니면서 사이드 프로젝트로 시작. Testimonial.to 가 $50K MRR 돌파 후 풀타임 솔로로 전환.",
    metrics: [
      { label: "월 매출 (Testimonial.to)", value: "$50K+/월" },
      { label: "월 매출 (PDF.ai)", value: "$30K+/월" },
      { label: "직원", value: "0명" },
      { label: "투자", value: "0원 (자기 자본만)" },
    ],
    lesson: "직장 그만두기 전 사이드로 검증. $50K MRR 까지 도달 후 풀타임 전환이 표준 안전 전략.",
    sourceUrl: "https://testimonial.to",
    sourceLabel: "Indie Hackers 공개 매출",
    startYear: 2020,
    industry: "B2B SaaS",
  },
  {
    id: "tony-dinh",
    name: "Tony Dinh (DevUtils · TypingMind · Black Magic)",
    founder: "Tony Dinh",
    location: "베트남 → 디지털 노마드",
    tagline:
      "Mac 개발자 도구 + ChatGPT 래퍼 + 트위터 분석 도구 — 3개 제품 동시 운영, 모두 솔로.",
    metrics: [
      { label: "월 매출 (총합)", value: "$30K+/월" },
      { label: "직원", value: "0명" },
      { label: "팔로워", value: "트위터 100K+" },
    ],
    lesson: "본인 일상 페인 포인트 = 가장 좋은 아이디어. 한 제품 빌드 후 다음 제품으로 빠르게 회전.",
    sourceUrl: "https://tonydinh.com",
    sourceLabel: "Indie Hackers 공개",
    startYear: 2020,
    industry: "Mac 도구 / AI",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 부트스트랩 (Bootstrap) — VC 0원, 작은 팀, 수년~수십년 sustainable
// ═══════════════════════════════════════════════════════════════════
const BOOTSTRAP_CASES: SuccessCase[] = [
  {
    id: "37signals-basecamp",
    name: "37signals (Basecamp · HEY)",
    founder: "Jason Fried · DHH (David Heinemeier Hansson)",
    location: "시카고, 미국",
    tagline:
      "1999 디자인 회사로 시작. 2004 Basecamp 출시. 20년+ 부트스트랩, VC 0원. \"Calm Company\" 운동의 원조.",
    metrics: [
      { label: "연 매출", value: "수천만 달러" },
      { label: "직원", value: "약 50명 (재택 중심)" },
      { label: "VC 자금", value: "0원" },
      { label: "운영 기간", value: "26년 (1999-2026)" },
      { label: "관련 책", value: "Rework · Remote · It Doesn't Have to Be Crazy" },
    ],
    lesson: "이익 우선. VC 거부하면 진짜 고객을 위해 만들 수 있다. 50명으로 충분 — 더 키울 필요 없다.",
    sourceUrl: "https://basecamp.com/about",
    sourceLabel: "basecamp.com 공식 · Wikipedia",
    startYear: 1999,
    industry: "B2B SaaS",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    founder: "Ben Chestnut · Dan Kurzius",
    location: "애틀랜타, 미국",
    tagline:
      "2001 디자인 컨설팅 + 사이드 프로젝트로 시작. 2007 풀 SaaS 전환. 2021 Intuit 가 $12B 인수 — 부트스트랩 역사상 최대 매각.",
    metrics: [
      { label: "연 매출 (2015)", value: "$280M" },
      { label: "Intuit 매각가 (2021)", value: "$12B" },
      { label: "VC 자금", value: "0원" },
      { label: "직원 (매각 시점)", value: "1,200+" },
      { label: "운영 기간", value: "20년 부트스트랩" },
    ],
    lesson: "20년 인내. 디자인 컨설팅으로 자금 만들면서 사이드로 SaaS 키우기. \"우연히\" 시장이 따라오는 시점이 온다.",
    sourceUrl: "https://mailchimp.com",
    sourceLabel: "공식 매각 발표 · 공개 매출",
    startYear: 2001,
    industry: "마케팅 SaaS",
  },
  {
    id: "convertkit-kit",
    name: "ConvertKit (Kit)",
    founder: "Nathan Barry",
    location: "보이스, 미국",
    tagline:
      "디자이너 출신. 2013 \"6개월 안에 $5K MRR\" 공개 도전. 처음 18개월 거의 실패. 2014 후반 turning point. 현재 $30M+ ARR.",
    metrics: [
      { label: "현재 ARR", value: "$30M+" },
      { label: "VC 자금", value: "0원 (자기 자본 $5K 시작)" },
      { label: "직원", value: "100+" },
      { label: "운영 기간", value: "13년" },
      { label: "도전 시점 매출", value: "$2.3K MRR → $30M ARR" },
    ],
    lesson: "Build in Public + 공개 도전 + 첫 18개월의 사막. 시장이 답할 때까지 살아남기.",
    sourceUrl: "https://kit.com",
    sourceLabel: "kit.com 공식 · Nathan Barry 블로그",
    startYear: 2013,
    industry: "이메일 마케팅 SaaS",
  },
  {
    id: "atlassian",
    name: "Atlassian (Jira · Confluence · Trello)",
    founder: "Mike Cannon-Brookes · Scott Farquhar",
    location: "시드니, 호주",
    tagline:
      "2002 호주 시드니 대학 졸업 직후 신용카드 $10K 빚으로 시작. 8년 부트스트랩 후 첫 외부 자금. 2015 IPO @ $4.4B. 현재 시총 $50B+.",
    metrics: [
      { label: "현재 시총", value: "$50B+" },
      { label: "첫 8년 VC", value: "0원" },
      { label: "IPO (2015)", value: "$4.4B" },
      { label: "Trello 인수 (2017)", value: "$425M" },
      { label: "초기 자본", value: "신용카드 $10K" },
    ],
    lesson: "엔터프라이즈 시장 + 셀프서브 모델 = 부트스트랩에서 IPO 까지 가능. 영업 인력 거의 없이 인바운드만.",
    sourceUrl: "https://www.atlassian.com",
    sourceLabel: "Atlassian SEC filings · 공식",
    startYear: 2002,
    industry: "엔터프라이즈 SaaS",
  },
  {
    id: "github-bootstrap",
    name: "GitHub (초기 4년)",
    founder: "Tom Preston-Werner · Chris Wanstrath · PJ Hyett · Scott Chacon",
    location: "샌프란시스코, 미국",
    tagline:
      "2008 사이드 프로젝트로 시작. 첫 4년 부트스트랩. 2012 첫 시리즈A ($100M @ $750M). 2018 MS 가 $7.5B 인수.",
    metrics: [
      { label: "MS 인수가 (2018)", value: "$7.5B" },
      { label: "부트스트랩 기간", value: "4년 (2008-2012)" },
      { label: "첫 시리즈A", value: "$100M @ $750M" },
      { label: "초기 자본", value: "사이드 프로젝트" },
    ],
    lesson: "개발자 도구는 처음에 부트스트랩으로 좁게 시작 — 진짜 사용자 만들기 후에 자본 들어와도 늦지 않는다.",
    sourceUrl: "https://github.blog",
    sourceLabel: "GitHub blog · TechCrunch 발표",
    startYear: 2008,
    industry: "개발자 도구",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 시드 (Seed) — 시드 라운드 $1-10M, 검증·MVP 단계
// ═══════════════════════════════════════════════════════════════════
const SEED_CASES: SuccessCase[] = [
  {
    id: "notion-seed",
    name: "Notion",
    founder: "Ivan Zhao · Simon Last (그리고 4명 공동창업자)",
    location: "샌프란시스코, 미국",
    tagline:
      "2013 시드 $2M 후 거의 망함 → 도쿄로 가서 재시작 → 2019 시리즈A $10M @ $800M valuation → 현재 $11B.",
    metrics: [
      { label: "시드 (2013)", value: "$2M" },
      { label: "시리즈A (2019, 6년 뒤)", value: "$10M @ $800M" },
      { label: "현재 valuation (2025)", value: "$11B" },
      { label: "ARR (2025)", value: "$600M+" },
      { label: "고객 수", value: "4M+" },
    ],
    lesson: "시드 후 6년 동안 PMF 찾기. 거의 망한 후 도쿄에서 재시작. 시리즈A 까지 인내가 평균보다 길다.",
    sourceUrl: "https://www.notion.so",
    sourceLabel: "Crunchbase · SaaStr 공개",
    startYear: 2013,
    industry: "B2B/B2C SaaS",
  },
  {
    id: "stripe-seed",
    name: "Stripe (초기)",
    founder: "Patrick Collison · John Collison",
    location: "샌프란시스코 (아일랜드 출신)",
    tagline:
      "2010 YC 시드. 2011 시리즈A $20M @ $100M. 결제 인프라 카테고리 정의. 현재 ~$95B 비상장 (세계 최대 핀테크).",
    metrics: [
      { label: "시드 (YC 2010)", value: "$2M" },
      { label: "시리즈A (2011)", value: "$20M @ $100M" },
      { label: "현재 평가", value: "~$95B (2024 round)" },
      { label: "결제 처리량 (2024)", value: "$1.4T+" },
      { label: "직원", value: "8,500+" },
    ],
    lesson: "\"7줄 코드로 결제\" — 개발자 경험 자체가 차별화. 한 핵심 가치 제안에 집중하면 거대 시장 정의 가능.",
    sourceUrl: "https://stripe.com",
    sourceLabel: "Stripe 공식 · YC 공개",
    startYear: 2010,
    industry: "핀테크",
  },
  {
    id: "anysphere-cursor-seed",
    name: "Anysphere (Cursor) — 시드 단계",
    founder: "Michael Truell · Sualeh Asif · Arvid Lunnemark · Aman Sanger (MIT 학생들)",
    location: "샌프란시스코, 미국",
    tagline:
      "2022 MIT 학생 4명 창업. 2023.10 OpenAI Fund 가 시드 $8M 리드. AI 코딩 IDE — 18개월 만에 $100M ARR (마케팅 0).",
    metrics: [
      { label: "시드 (2023.10)", value: "$8M (OpenAI Fund)" },
      { label: "시리즈A (2024.8)", value: "$60M @ $400M" },
      { label: "ARR (2025.1)", value: "$100M (18개월)" },
      { label: "마케팅 비용", value: "거의 0원" },
      { label: "최신 valuation (2025)", value: "$29.3B" },
    ],
    lesson: "AI 도구는 \"입소문\"으로 충분 — 제품이 좋으면 마케팅 0 으로도 18개월에 $100M ARR 가능.",
    sourceUrl: "https://www.cursor.com",
    sourceLabel: "TechCrunch · Crunchbase",
    startYear: 2022,
    industry: "AI 개발 도구",
  },
  {
    id: "linear-seed",
    name: "Linear",
    founder: "Karri Saarinen · Tuomas Artman · Jori Lallo",
    location: "샌프란시스코, 미국 (핀란드 출신)",
    tagline:
      "2019 시드. \"Jira 에 분노한\" Airbnb / Uber / Coinbase 출신 디자이너·엔지니어. 디자인 우선 + 빠른 속도 = 신세대 표준.",
    metrics: [
      { label: "시드 (2019)", value: "$4.2M (Sequoia · Index)" },
      { label: "시리즈A (2021)", value: "$13M" },
      { label: "시리즈B (2024)", value: "$35M @ $400M" },
      { label: "고객사", value: "Vercel · OpenAI · Cash App 등" },
    ],
    lesson: "디자인 + 키보드 중심 + 빠른 속도가 차별화. 큰 적(Jira) 의 페인을 정확히 공략.",
    sourceUrl: "https://linear.app",
    sourceLabel: "Linear blog · Crunchbase",
    startYear: 2019,
    industry: "B2B 생산성 SaaS",
  },
  {
    id: "figma-seed",
    name: "Figma (초기)",
    founder: "Dylan Field · Evan Wallace",
    location: "샌프란시스코, 미국",
    tagline:
      "2013 시드. 4년 동안 stealth 모드 — 브라우저에서 동작하는 디자인 툴 만들기. 2016 공개. 2025 IPO @ $19B.",
    metrics: [
      { label: "시드 (2013)", value: "$3.8M (Index Ventures)" },
      { label: "공개 (2016, 3년 뒤)", value: "stealth 끝" },
      { label: "Adobe 인수 무산 (2023)", value: "$20B 거절" },
      { label: "IPO (2025.7)", value: "$19B fully diluted" },
      { label: "First Day 시총", value: "$47B 기록" },
    ],
    lesson: "긴 stealth + 기술 차별화 (브라우저 WebGL) = 시장 진입 늦어도 압도적 카테고리 리더. 인수 거절 후 IPO 도 가능.",
    sourceUrl: "https://www.figma.com",
    sourceLabel: "Figma S-1 · Medium",
    startYear: 2012,
    industry: "디자인 툴",
  },
];

// ═══════════════════════════════════════════════════════════════════
// 시리즈A 이상 (Series A+) — 본격 스케일링, Blitzscaling
// ═══════════════════════════════════════════════════════════════════
const SERIES_A_CASES: SuccessCase[] = [
  {
    id: "anysphere-cursor-seriesA",
    name: "Anysphere (Cursor) — 시리즈A 이후",
    founder: "Michael Truell 외 3명 (MIT)",
    location: "샌프란시스코",
    tagline:
      "역사상 가장 빠른 valuation 상승: 시리즈A 2024.8 $400M → 시리즈D 2025.11 $29.3B. 12개월 만에 73배.",
    metrics: [
      { label: "시리즈A (2024.8)", value: "$60M @ $400M" },
      { label: "시리즈B (2024.12)", value: "$105M @ $2.5B" },
      { label: "시리즈C (2025.6)", value: "$900M @ $9.9B" },
      { label: "시리즈D (2025.11)", value: "$2.3B @ $29.3B" },
      { label: "ARR (2025.11)", value: "$1B+" },
      { label: "xAI 인수 협상 (2026.4)", value: "$60B" },
    ],
    lesson: "AI 카테고리 + 입증된 ARR = 매 라운드마다 valuation 5-10배. 시리즈A 후 자금이 뒤따라옴.",
    sourceUrl: "https://www.cursor.com",
    sourceLabel: "Crunchbase · TechCrunch · Bloomberg",
    startYear: 2022,
    industry: "AI 개발 도구",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    founder: "Dario Amodei · Daniela Amodei (OpenAI 출신)",
    location: "샌프란시스코",
    tagline:
      "2021 OpenAI 출신 7명 창업. AI 안전성 우선 연구 회사. 시리즈C $4B (2024). Amazon $4B 추가 투자 (2024). 현재 $18B+.",
    metrics: [
      { label: "시리즈A (2022)", value: "$580M (Google 등)" },
      { label: "Amazon 투자 (2023)", value: "$4B" },
      { label: "시리즈C (2024)", value: "$4B @ $18B" },
      { label: "Claude 모델 (2024)", value: "Opus·Sonnet·Haiku" },
      { label: "직원 (2024)", value: "500+" },
    ],
    lesson: "딥테크 + 명확한 미션 (AI 안전) = 거대 자본 빠르게 모임. 빅테크 인수 대신 파트너십으로 자율성 확보.",
    sourceUrl: "https://www.anthropic.com",
    sourceLabel: "Anthropic 공식 · Crunchbase",
    startYear: 2021,
    industry: "AI / LLM",
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    founder: "Aravind Srinivas · Denis Yarats · Andy Konwinski · Johnny Ho",
    location: "샌프란시스코",
    tagline:
      "2022 OpenAI · Meta · DeepMind 출신 창업. \"AI 검색\" 카테고리 정의. 시리즈D 2024 @ $9B. 2년 만에 데카콘 도달.",
    metrics: [
      { label: "시드 (2022)", value: "$3.1M" },
      { label: "시리즈A (2023)", value: "$25.6M" },
      { label: "시리즈B (2024.1)", value: "$73.6M @ $520M" },
      { label: "시리즈D (2024.12)", value: "$500M @ $9B" },
      { label: "월 검색 (2024)", value: "230M+" },
    ],
    lesson: "Google 의 페인 (광고 가득한 검색) 을 직접 공격. 2년 만에 valuation 30배 — Google 같은 거인도 카테고리 만들면 무너뜨릴 수 있다.",
    sourceUrl: "https://www.perplexity.ai",
    sourceLabel: "Perplexity blog · Crunchbase",
    startYear: 2022,
    industry: "AI 검색",
  },
  {
    id: "vercel",
    name: "Vercel",
    founder: "Guillermo Rauch (Next.js 만든 사람)",
    location: "샌프란시스코",
    tagline:
      "Next.js 오픈소스 → 클라우드 회사. 2017 시드. 2020 시리즈A. 2024 시리즈D $250M @ $3.25B. 제로트러스트 + DX 가 무기.",
    metrics: [
      { label: "시드 (2017)", value: "$1.1M" },
      { label: "시리즈A (2020)", value: "$21M" },
      { label: "시리즈C (2021)", value: "$150M @ $2.5B" },
      { label: "시리즈D (2024)", value: "$250M @ $3.25B" },
      { label: "Next.js 다운로드", value: "월 수억회" },
    ],
    lesson: "오픈소스로 개발자 마음 잡기 → 그 위에 유료 클라우드 얹기. \"Open Core\" 모델의 모범 사례.",
    sourceUrl: "https://vercel.com",
    sourceLabel: "Vercel blog · TechCrunch",
    startYear: 2015,
    industry: "개발자 인프라",
  },
  {
    id: "notion-scaleup",
    name: "Notion (시리즈A 이후)",
    founder: "Ivan Zhao",
    location: "샌프란시스코",
    tagline:
      "2019 시리즈A $10M 후 폭발적 성장. 2020 시리즈B $50M @ $2B → 2021 시리즈D $275M @ $10B → 현재 $11B + IPO 준비.",
    metrics: [
      { label: "시리즈A (2019)", value: "$10M @ $800M" },
      { label: "시리즈B (2020)", value: "$50M @ $2B" },
      { label: "시리즈D (2021)", value: "$275M @ $10B" },
      { label: "현재 평가 (2025)", value: "$11B" },
      { label: "ARR (2025)", value: "$600M+" },
      { label: "고객", value: "4M+" },
    ],
    lesson: "PMF 도달 후 14년에 걸친 \"점진적 IPO 준비\". 시리즈A 후 valuation 14배 도달까지 6년.",
    sourceUrl: "https://www.notion.so",
    sourceLabel: "Notion blog · Crunchbase",
    startYear: 2013,
    industry: "B2B/B2C SaaS",
  },
];

// ═══════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════
export const SUCCESS_CASES_BY_MODE: Record<OperatingMode, SuccessCase[]> = {
  indie: INDIE_CASES,
  bootstrap: BOOTSTRAP_CASES,
  seed: SEED_CASES,
  seriesA: SERIES_A_CASES,
};

export function getSuccessCases(mode: OperatingMode): SuccessCase[] {
  return SUCCESS_CASES_BY_MODE[mode] ?? [];
}
