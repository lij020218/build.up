//
//  StartupFoundationModeContent.swift — 운영 모드별 팀 구성 콘텐츠 (iOS)
//
//  웹 SSOT 미러: apps/web/app/lib/components/stages/startup/StartupFoundationStage.tsx
//    § 2 "팀 구성" modeContent (indie / bootstrap / seed / seriesA).
//  iOS 는 한국어 전용 — 웹 KO 문자열을 그대로 전사 (2026-07-06 정정 반영).
//  모드 값: @AppStorage("stage.budget.startupOperatingMode") String (indie/bootstrap/seed/seriesA).
//

import Foundation

struct SFModeAction: Identifiable { let id = UUID(); let label: String; let detail: String }
struct SFModeDecision: Identifiable { let id = UUID(); let item: String; let recommendation: String }
struct SFModeResource: Identifiable { let id = UUID(); let name: String; let desc: String }

struct SFModeContent {
    let headline: String
    let why: [String]
    let actions: [SFModeAction]
    let decisions: [SFModeDecision]
    let resources: [SFModeResource]
}

// Block 2 — 법인 vs 개인사업자 의사결정 (모드별 권장)
struct SFDecisionGuide { let recommend: String; let headline: String; let reason: String } // recommend: "sole"|"corp"

// 페이지 0 "핵심 원칙" — ModePathCard 가이드 (웹 SSOT: packages/shared startup-mode-content.ts "startup-foundation")
struct SFStageGuide {
    let why: String
    let actions: [SFModeAction]   // label = title
    let pace: String
    let pitfall: String
    let evidence: String
}

// 페이지 4 "사례" — 모드별 검증 사례 (웹 SSOT: packages/shared startup-success-cases.ts)
struct SFSuccessMetric: Identifiable { let id = UUID(); let label: String; let value: String }
struct SFSuccessCase: Identifiable {
    let id: String
    let name: String
    let founder: String
    let location: String
    let tagline: String
    let metrics: [SFSuccessMetric]
    let lesson: String
    let sourceUrl: String
    let sourceLabel: String
    let startYear: Int
    let industry: String
}

// Block 3 — 법인 형태 상세 (모드별)
struct SFCorpTool: Identifiable { let id = UUID(); let name: String; let desc: String; let price: String }
struct SFCorpDetail {
    let headline: String
    let why: [String]
    let actions: [SFModeAction]
    let advantages: [String]
    let tools: [SFCorpTool]
}

enum StartupFoundationModeContent {

    static func content(for mode: String) -> SFModeContent {
        byMode[mode] ?? byMode["bootstrap"]!
    }

    static func decisionGuide(for mode: String) -> SFDecisionGuide {
        decisionByMode[mode] ?? decisionByMode["bootstrap"]!
    }

    static func corpDetail(for mode: String) -> SFCorpDetail {
        corpByMode[mode] ?? corpByMode["bootstrap"]!
    }

    static func stageGuide(for mode: String) -> SFStageGuide {
        guideByMode[mode] ?? guideByMode["bootstrap"]!
    }

    static func successCases(for mode: String) -> [SFSuccessCase] {
        casesByMode[mode] ?? casesByMode["bootstrap"]!
    }

    static func casesHeadline(for mode: String) -> String {
        casesHeadlineByMode[mode] ?? casesHeadlineByMode["bootstrap"]!
    }

    static func modeLabel(for mode: String) -> String {
        ["indie": "1인 인디", "bootstrap": "부트스트랩", "seed": "시드", "seriesA": "시리즈A+"][mode] ?? "부트스트랩"
    }

    // MARK: - 페이지 0 "핵심 원칙" 모드 가이드 (웹 STARTUP_STAGE_MODE_CONTENT["startup-foundation"] 미러)
    private static let guideByMode: [String: SFStageGuide] = [
        "indie": SFStageGuide(
            why: "혼자 일하기 때문에 '문제'와 '실행 환경'이 명확해야 합니다. 팀 정렬 이슈는 없지만, 동기부여·고립 관리·번아웃 방지가 핵심입니다. 시간이 곧 자본 — 잘못된 문제를 6개월 풀면 회복 어렵습니다.",
            actions: [
                SFModeAction(label: "본인이 직접 겪었거나 잘 아는 문제 1개로 좁히기", detail: "Pieter Levels·Marc Lou 패턴 — '내가 매일 쓰는 것' 또는 '내가 잘 아는 좁은 시장' 만 다룬다. 70개 실패 후 PhotoAI 가 그렇게 나옴."),
                SFModeAction(label: "Discord/X/Reddit 인디 커뮤니티 합류", detail: "고립 방지 + 빌드 인 퍼블릭 채널 확보. Indie Hackers·Build in Public·MicroConf Connect 추천."),
                SFModeAction(label: "솔로 워크플로 셋업 (Cursor + Claude Code)", detail: "2026 인디 표준: Cursor + Claude Code 조합으로 26% 빠른 개발. 처음부터 익숙해질 것."),
                SFModeAction(label: "공개 빌드 로그 시작 (X/Twitter, 또는 블로그)", detail: "마케팅 + 동기부여 + 고객 모집 동시. Marc Lou·Pieter Levels 모두 이 방식."),
            ],
            pace: "1-2주 내 결정 — 길게 끌수록 학습 손실. 6개월 안에 첫 제품 출시 목표.",
            pitfall: "'완벽한 첫 아이디어' 추구 — 인디는 출시·실패·학습의 반복이 핵심. 첫 제품이 망해도 정상.",
            evidence: "솔로 founder 비중 2019년 23.7% → 2026년 36.3% (역사적 최고). Marc Lou: $1M+/2025년 with 0 employees."
        ),
        "bootstrap": SFStageGuide(
            why: "1-3명 팀의 가장 큰 위험은 '암묵적 합의' 입니다. 지분·역할·의사결정 구조가 문서화되지 않으면 6-12개월 후 갈등으로 회사 끝납니다. 자비 부담이라 자본 압박도 큼.",
            actions: [
                SFModeAction(label: "공동창업자 지분 합의 + Vesting 계약 (4년 vesting · cliff 2년)", detail: "지분 비율 + 이탈 시 회수 조건 명시. 표준 4년 vesting + cliff 2년(스톡옵션 법정, 상법 §340-4 — 벤처기업도 완화 불가). 변호사 (윤앤장·세종 등) 검토 추천."),
                SFModeAction(label: "역할·의사결정 구조 문서화", detail: "CEO·CTO 역할 · 50/50 데드락 방지 (캐스팅 보트 또는 sole CEO 권장) · 주간 동기화 시간."),
                SFModeAction(label: "공유 운영 도구 (Notion + Slack + Linear/GitHub)", detail: "분산 작업 + 의사결정 로그. MicroConf 표준: 매주 1회 30분 동기화 + 분기별 retro."),
                SFModeAction(label: "37signals 모델 학습 (No-VC 20년 사례)", detail: "Basecamp 가 보여준 sustainable growth. Stair Step Approach (Walling): 단일 판매 제품 → 스케일 → SaaS."),
            ],
            pace: "지분·역할 결정 즉시 (1주). 첫 3개월 내 핵심 프로세스 정착.",
            pitfall: "지분 분배 후속 협상 미루기 — 입찰처럼 즉시 결정. 미루면 매출 발생 후 갈등 폭발.",
            evidence: "MicroConf Connect: 글로벌 최대 부트스트랩 SaaS 커뮤니티 (2011~). 37signals: VC 0원, 20년 흑자."
        ),
        "seed": SFStageGuide(
            why: "시드 자금 받았다면 '시간 vs 자본 효율' 균형이 핵심. 3-5명 팀은 가장 폭발적으로 성장할 수 있는 단계 — 잘못된 채용 1명이 6개월 진척을 망가뜨립니다. 한국 시드는 대표 지분 60% 이상 유지가 다음 라운드의 전제.",
            actions: [
                SFModeAction(label: "공동창업자 vesting + 옵션 풀 10-15% 확보", detail: "법인 설립 시 옵션 풀 사전 확보 (시리즈A 시 추가 발행 압력 줄임). 대표 지분 60% 이하 떨어지지 않도록 관리."),
                SFModeAction(label: "핵심 3-5명 채용 — engineer + product + GTM", detail: "YC 표준: 3-5명 팀이 1차 마일스톤. Peter Thiel: 'CEO 연봉 $150K 넘으면 정치인 시작' — 보수는 옵션 비중 높게."),
                SFModeAction(label: "주간 KPI · 월간 board update · 분기 retro", detail: "투자자 보고서 표준화. 공유 메트릭 대시보드 구축 (Mixpanel·PostHog 등). 첫 6개월에 정착해야 함."),
                SFModeAction(label: "Customer discovery 프로세스 정립 (Steve Blank)", detail: "주간 5-10명 인터뷰 + VOC 시스템. 시드 9개월 안에 PMF 또는 피벗 결정."),
            ],
            pace: "3-5명 코어 팀 6개월 내 완성. PMF 시그널 9-12개월 내.",
            pitfall: "'더 많은 사람 = 더 빠름' 함정. 잘못된 시니어 채용 1명 = 시드 자본 20% 손실. Customer Advisory 대신 채용 우선 = 폭망.",
            evidence: "YC: $500K for 7%, 시드 라운드 $1-5M (high-conviction $5-20M). 한국 시드: 5천만~5억, 463개 액셀러레이터."
        ),
        "seriesA": SFStageGuide(
            why: "시리즈A+ 단계의 founder 는 '실행자' 에서 '경영자' 로 전환되어야 합니다. C-suite 채용 + 이사회 구성 + 거버넌스가 핵심. Reid Hoffman: 'executives 가 스케일 못 하면 사업이 스케일 못 한다.'",
            actions: [
                SFModeAction(label: "C-suite 채용 시작 (CTO·CPO·VP Engineering 등)", detail: "founder 가 모든 역할 → 각 부문 leader 위임. 채용 사이클 6-12개월. CEO 가 60% 시간 채용에."),
                SFModeAction(label: "이사회 구성 + 분기별 운영 (Reid Hoffman)", detail: "투자자 1-2명 + 외부 이사 1명 + founder. 분기 board meeting + 월간 update + 연간 strategy off-site."),
                SFModeAction(label: "운영 OS: OKR + 주간 리뷰 + 부문 KPI", detail: "Andrew Chen: compounding growth loops 정착. Growth team + Data infra + Experimentation platform."),
                SFModeAction(label: "옵션 풀 확장 + 시리즈B 준비", detail: "옵션 풀 추가 발행 + ESOP 정책. 시리즈B 18-24개월 내 — 미리 메트릭 트래킹 (NRR·Gross Margin·Magic Number 등)."),
            ],
            pace: "C-suite 12-18개월 완성. 이사회 시리즈A 클로징 후 30일 내 첫 미팅.",
            pitfall: "Founder 가 모든 결정 직접 = bottleneck. C-suite 위임 못 하면 시리즈B 전 회사 멈춤. Reid Hoffman 의 핵심 경고.",
            evidence: "한국 시리즈A: 일반 30-100억 / 딥테크 100-900억 (디노티시아 900억·BOS 870억). Blitzscaling 표준 거버넌스."
        ),
    ]

    // MARK: - 페이지 4 "사례" 헤드라인 (웹 HEADLINE_BY_MODE 미러)
    private static let casesHeadlineByMode: [String: String] = [
        "indie": "1인 인디의 전설들 — 실리콘밸리·디지털 노마드 검증된 솔로 founders",
        "bootstrap": "부트스트랩 전설 — VC 0원으로 IPO·매각까지 간 회사들",
        "seed": "시드 → 시리즈A 표준 — Notion · Stripe · Cursor · Linear · Figma 의 시작",
        "seriesA": "시리즈A 이후 폭발 — Cursor · Anthropic · Perplexity · Vercel · Notion 의 스케일링",
    ]

    // MARK: - 페이지 4 "사례" 데이터 (웹 SUCCESS_CASES_BY_MODE 미러)
    private static let casesByMode: [String: [SFSuccessCase]] = [
        "indie": [
            SFSuccessCase(id: "pieter-levels", name: "Pieter Levels (Photo AI · Remote OK · Interior AI)", founder: "Pieter Levels", location: "치앙마이·전세계 (디지털 노마드)",
                tagline: "PHP raw + 프레임워크 0 + 직원 0명으로 3개 제품 동시 운영. \"단순한 게 가장 빠르다\" 의 끝판왕.",
                metrics: [.init(label: "연 매출", value: "$3M+/년"), .init(label: "직원", value: "0명"), .init(label: "Photo AI ARR", value: "$1M+ (솔로)"), .init(label: "유료 마케팅", value: "0원"), .init(label: "자산 평가", value: "$40-60M")],
                lesson: "프레임워크·라이브러리 최소화. 매주 빌드 인 퍼블릭. 첫 12개 제품은 다 실패해도 13번째가 터질 수 있다.",
                sourceUrl: "https://levels.io", sourceLabel: "levels.io · UN Networth 2026", startYear: 2014, industry: "AI / SaaS"),
            SFSuccessCase(id: "marc-lou", name: "Marc Lou (ShipFast · CodeFast · DataFast 외 12개)", founder: "Marc Louvion", location: "발리·바르셀로나 (디지털 노마드)",
                tagline: "회사에서 해고된 후 12개 마이크로 SaaS 출시. 모든 매출·실패 트위터에 공개. 6-8주 만에 제품 출시 표준.",
                metrics: [.init(label: "월 매출", value: "$70K/월"), .init(label: "누적 매출 (2025)", value: "$1M+"), .init(label: "직원", value: "0명"), .init(label: "출시 제품 수", value: "12+ 마이크로 SaaS"), .init(label: "자산 평가", value: "$0.5-2M")],
                lesson: "Build in Public 으로 마케팅·동기부여·고객 모집 동시. 6-8주 안에 출시 안 되는 아이디어는 버린다.",
                sourceUrl: "https://marclou.com", sourceLabel: "marclou.com · UN Networth 2026", startYear: 2022, industry: "SaaS"),
            SFSuccessCase(id: "justin-welsh", name: "Justin Welsh (1-Person Business)", founder: "Justin Welsh", location: "뉴저지, 미국",
                tagline: "LinkedIn 콘텐츠 + 정보 상품(코스·뉴스레터)으로 1인 비즈니스 표준화. \"솔로프러너 운영 OS\" 콘셉트 확립.",
                metrics: [.init(label: "누적 매출", value: "$10M+ (2024 기준)"), .init(label: "직원", value: "0명 (계약자만)"), .init(label: "월 매출", value: "$200K+"), .init(label: "트위터 팔로워", value: "650K+")],
                lesson: "콘텐츠 = 영업. 매일 LinkedIn + 트위터 + 뉴스레터. 정보 상품으로 무한 확장.",
                sourceUrl: "https://www.justinwelsh.me", sourceLabel: "justinwelsh.me 공개 매출", startYear: 2019, industry: "콘텐츠 / 코칭"),
            SFSuccessCase(id: "damon-chen", name: "Damon Chen (Testimonial.to · PDF.ai)", founder: "Damon Chen", location: "샌프란시스코, 미국",
                tagline: "직장 다니면서 사이드 프로젝트로 시작. Testimonial.to 가 $50K MRR 돌파 후 풀타임 솔로로 전환.",
                metrics: [.init(label: "월 매출 (Testimonial.to)", value: "$50K+/월"), .init(label: "월 매출 (PDF.ai)", value: "$30K+/월"), .init(label: "직원", value: "0명"), .init(label: "투자", value: "0원 (자기 자본만)")],
                lesson: "직장 그만두기 전 사이드로 검증. $50K MRR 까지 도달 후 풀타임 전환이 표준 안전 전략.",
                sourceUrl: "https://testimonial.to", sourceLabel: "Indie Hackers 공개 매출", startYear: 2020, industry: "B2B SaaS"),
            SFSuccessCase(id: "tony-dinh", name: "Tony Dinh (DevUtils · TypingMind · Black Magic)", founder: "Tony Dinh", location: "베트남 → 디지털 노마드",
                tagline: "Mac 개발자 도구 + ChatGPT 래퍼 + 트위터 분석 도구 — 3개 제품 동시 운영, 모두 솔로.",
                metrics: [.init(label: "월 매출 (총합)", value: "$30K+/월"), .init(label: "직원", value: "0명"), .init(label: "팔로워", value: "트위터 100K+")],
                lesson: "본인 일상 페인 포인트 = 가장 좋은 아이디어. 한 제품 빌드 후 다음 제품으로 빠르게 회전.",
                sourceUrl: "https://tonydinh.com", sourceLabel: "Indie Hackers 공개", startYear: 2020, industry: "Mac 도구 / AI"),
        ],
        "bootstrap": [
            SFSuccessCase(id: "37signals-basecamp", name: "37signals (Basecamp · HEY)", founder: "Jason Fried · DHH (David Heinemeier Hansson)", location: "시카고, 미국",
                tagline: "1999 디자인 회사로 시작. 2004 Basecamp 출시. 20년+ 부트스트랩, VC 0원. \"Calm Company\" 운동의 원조.",
                metrics: [.init(label: "연 매출", value: "수천만 달러"), .init(label: "직원", value: "약 50명 (재택 중심)"), .init(label: "VC 자금", value: "0원"), .init(label: "운영 기간", value: "26년 (1999-2026)"), .init(label: "관련 책", value: "Rework · Remote · It Doesn't Have to Be Crazy")],
                lesson: "이익 우선. VC 거부하면 진짜 고객을 위해 만들 수 있다. 50명으로 충분 — 더 키울 필요 없다.",
                sourceUrl: "https://basecamp.com/about", sourceLabel: "basecamp.com 공식 · Wikipedia", startYear: 1999, industry: "B2B SaaS"),
            SFSuccessCase(id: "mailchimp", name: "Mailchimp", founder: "Ben Chestnut · Dan Kurzius", location: "애틀랜타, 미국",
                tagline: "2001 디자인 컨설팅 + 사이드 프로젝트로 시작. 2007 풀 SaaS 전환. 2021 Intuit 가 $12B 인수 — 부트스트랩 역사상 최대 매각.",
                metrics: [.init(label: "연 매출 (2015)", value: "$280M"), .init(label: "Intuit 매각가 (2021)", value: "$12B"), .init(label: "VC 자금", value: "0원"), .init(label: "직원 (매각 시점)", value: "1,200+"), .init(label: "운영 기간", value: "20년 부트스트랩")],
                lesson: "20년 인내. 디자인 컨설팅으로 자금 만들면서 사이드로 SaaS 키우기. \"우연히\" 시장이 따라오는 시점이 온다.",
                sourceUrl: "https://mailchimp.com", sourceLabel: "공식 매각 발표 · 공개 매출", startYear: 2001, industry: "마케팅 SaaS"),
            SFSuccessCase(id: "convertkit-kit", name: "ConvertKit (Kit)", founder: "Nathan Barry", location: "보이스, 미국",
                tagline: "디자이너 출신. 2013 \"6개월 안에 $5K MRR\" 공개 도전. 처음 18개월 거의 실패. 2014 후반 turning point. 현재 $30M+ ARR.",
                metrics: [.init(label: "현재 ARR", value: "$30M+"), .init(label: "VC 자금", value: "0원 (자기 자본 $5K 시작)"), .init(label: "직원", value: "100+"), .init(label: "운영 기간", value: "13년"), .init(label: "도전 시점 매출", value: "$2.3K MRR → $30M ARR")],
                lesson: "Build in Public + 공개 도전 + 첫 18개월의 사막. 시장이 답할 때까지 살아남기.",
                sourceUrl: "https://kit.com", sourceLabel: "kit.com 공식 · Nathan Barry 블로그", startYear: 2013, industry: "이메일 마케팅 SaaS"),
            SFSuccessCase(id: "atlassian", name: "Atlassian (Jira · Confluence · Trello)", founder: "Mike Cannon-Brookes · Scott Farquhar", location: "시드니, 호주",
                tagline: "2002 호주 시드니 대학 졸업 직후 신용카드 $10K 빚으로 시작. 8년 부트스트랩 후 첫 외부 자금. 2015 IPO @ $4.4B. 현재 시총 $50B+.",
                metrics: [.init(label: "현재 시총", value: "$50B+"), .init(label: "첫 8년 VC", value: "0원"), .init(label: "IPO (2015)", value: "$4.4B"), .init(label: "Trello 인수 (2017)", value: "$425M"), .init(label: "초기 자본", value: "신용카드 $10K")],
                lesson: "엔터프라이즈 시장 + 셀프서브 모델 = 부트스트랩에서 IPO 까지 가능. 영업 인력 거의 없이 인바운드만.",
                sourceUrl: "https://www.atlassian.com", sourceLabel: "Atlassian SEC filings · 공식", startYear: 2002, industry: "엔터프라이즈 SaaS"),
            SFSuccessCase(id: "github-bootstrap", name: "GitHub (초기 4년)", founder: "Tom Preston-Werner · Chris Wanstrath · PJ Hyett · Scott Chacon", location: "샌프란시스코, 미국",
                tagline: "2008 사이드 프로젝트로 시작. 첫 4년 부트스트랩. 2012 첫 시리즈A ($100M @ $750M). 2018 MS 가 $7.5B 인수.",
                metrics: [.init(label: "MS 인수가 (2018)", value: "$7.5B"), .init(label: "부트스트랩 기간", value: "4년 (2008-2012)"), .init(label: "첫 시리즈A", value: "$100M @ $750M"), .init(label: "초기 자본", value: "사이드 프로젝트")],
                lesson: "개발자 도구는 처음에 부트스트랩으로 좁게 시작 — 진짜 사용자 만들기 후에 자본 들어와도 늦지 않는다.",
                sourceUrl: "https://github.blog", sourceLabel: "GitHub blog · TechCrunch 발표", startYear: 2008, industry: "개발자 도구"),
        ],
        "seed": [
            SFSuccessCase(id: "notion-seed", name: "Notion", founder: "Ivan Zhao · Simon Last (그리고 4명 공동창업자)", location: "샌프란시스코, 미국",
                tagline: "2013 시드 $2M 후 거의 망함 → 도쿄로 가서 재시작 → 2019 시리즈A $10M @ $800M valuation → 현재 $11B.",
                metrics: [.init(label: "시드 (2013)", value: "$2M"), .init(label: "시리즈A (2019, 6년 뒤)", value: "$10M @ $800M"), .init(label: "현재 valuation (2025)", value: "$11B"), .init(label: "ARR (2025)", value: "$600M+"), .init(label: "고객 수", value: "4M+")],
                lesson: "시드 후 6년 동안 PMF 찾기. 거의 망한 후 도쿄에서 재시작. 시리즈A 까지 인내가 평균보다 길다.",
                sourceUrl: "https://www.notion.so", sourceLabel: "Crunchbase · SaaStr 공개", startYear: 2013, industry: "B2B/B2C SaaS"),
            SFSuccessCase(id: "stripe-seed", name: "Stripe (초기)", founder: "Patrick Collison · John Collison", location: "샌프란시스코 (아일랜드 출신)",
                tagline: "2010 YC 시드. 2011 시리즈A $20M @ $100M. 결제 인프라 카테고리 정의. 현재 ~$95B 비상장 (세계 최대 핀테크).",
                metrics: [.init(label: "시드 (YC 2010)", value: "$2M"), .init(label: "시리즈A (2011)", value: "$20M @ $100M"), .init(label: "현재 평가", value: "~$95B (2024 round)"), .init(label: "결제 처리량 (2024)", value: "$1.4T+"), .init(label: "직원", value: "8,500+")],
                lesson: "\"7줄 코드로 결제\" — 개발자 경험 자체가 차별화. 한 핵심 가치 제안에 집중하면 거대 시장 정의 가능.",
                sourceUrl: "https://stripe.com", sourceLabel: "Stripe 공식 · YC 공개", startYear: 2010, industry: "핀테크"),
            SFSuccessCase(id: "anysphere-cursor-seed", name: "Anysphere (Cursor) — 시드 단계", founder: "Michael Truell · Sualeh Asif · Arvid Lunnemark · Aman Sanger (MIT 학생들)", location: "샌프란시스코, 미국",
                tagline: "2022 MIT 학생 4명 창업. 2023.10 OpenAI Fund 가 시드 $8M 리드. AI 코딩 IDE — 18개월 만에 $100M ARR (마케팅 0).",
                metrics: [.init(label: "시드 (2023.10)", value: "$8M (OpenAI Fund)"), .init(label: "시리즈A (2024.8)", value: "$60M @ $400M"), .init(label: "ARR (2025.1)", value: "$100M (18개월)"), .init(label: "마케팅 비용", value: "거의 0원"), .init(label: "최신 valuation (2025)", value: "$29.3B")],
                lesson: "AI 도구는 \"입소문\"으로 충분 — 제품이 좋으면 마케팅 0 으로도 18개월에 $100M ARR 가능.",
                sourceUrl: "https://www.cursor.com", sourceLabel: "TechCrunch · Crunchbase", startYear: 2022, industry: "AI 개발 도구"),
            SFSuccessCase(id: "linear-seed", name: "Linear", founder: "Karri Saarinen · Tuomas Artman · Jori Lallo", location: "샌프란시스코, 미국 (핀란드 출신)",
                tagline: "2019 시드. \"Jira 에 분노한\" Airbnb / Uber / Coinbase 출신 디자이너·엔지니어. 디자인 우선 + 빠른 속도 = 신세대 표준.",
                metrics: [.init(label: "시드 (2019)", value: "$4.2M (Sequoia · Index)"), .init(label: "시리즈A (2021)", value: "$13M"), .init(label: "시리즈B (2024)", value: "$35M @ $400M"), .init(label: "고객사", value: "Vercel · OpenAI · Cash App 등")],
                lesson: "디자인 + 키보드 중심 + 빠른 속도가 차별화. 큰 적(Jira) 의 페인을 정확히 공략.",
                sourceUrl: "https://linear.app", sourceLabel: "Linear blog · Crunchbase", startYear: 2019, industry: "B2B 생산성 SaaS"),
            SFSuccessCase(id: "figma-seed", name: "Figma (초기)", founder: "Dylan Field · Evan Wallace", location: "샌프란시스코, 미국",
                tagline: "2013 시드. 4년 동안 stealth 모드 — 브라우저에서 동작하는 디자인 툴 만들기. 2016 공개. 2025 IPO @ $19B.",
                metrics: [.init(label: "시드 (2013)", value: "$3.8M (Index Ventures)"), .init(label: "공개 (2016, 3년 뒤)", value: "stealth 끝"), .init(label: "Adobe 인수 무산 (2023)", value: "$20B 거절"), .init(label: "IPO (2025.7)", value: "$19B fully diluted"), .init(label: "First Day 시총", value: "$47B 기록")],
                lesson: "긴 stealth + 기술 차별화 (브라우저 WebGL) = 시장 진입 늦어도 압도적 카테고리 리더. 인수 거절 후 IPO 도 가능.",
                sourceUrl: "https://www.figma.com", sourceLabel: "Figma S-1 · Medium", startYear: 2012, industry: "디자인 툴"),
        ],
        "seriesA": [
            SFSuccessCase(id: "anysphere-cursor-seriesA", name: "Anysphere (Cursor) — 시리즈A 이후", founder: "Michael Truell 외 3명 (MIT)", location: "샌프란시스코",
                tagline: "역사상 가장 빠른 valuation 상승: 시리즈A 2024.8 $400M → 시리즈D 2025.11 $29.3B. 12개월 만에 73배.",
                metrics: [.init(label: "시리즈A (2024.8)", value: "$60M @ $400M"), .init(label: "시리즈B (2024.12)", value: "$105M @ $2.5B"), .init(label: "시리즈C (2025.6)", value: "$900M @ $9.9B"), .init(label: "시리즈D (2025.11)", value: "$2.3B @ $29.3B"), .init(label: "ARR (2025.11)", value: "$1B+"), .init(label: "xAI 인수 협상 (2026.4)", value: "$60B")],
                lesson: "AI 카테고리 + 입증된 ARR = 매 라운드마다 valuation 5-10배. 시리즈A 후 자금이 뒤따라옴.",
                sourceUrl: "https://www.cursor.com", sourceLabel: "Crunchbase · TechCrunch · Bloomberg", startYear: 2022, industry: "AI 개발 도구"),
            SFSuccessCase(id: "anthropic", name: "Anthropic", founder: "Dario Amodei · Daniela Amodei (OpenAI 출신)", location: "샌프란시스코",
                tagline: "2021 OpenAI 출신 7명 창업. AI 안전성 우선 연구 회사. 시리즈C $4B (2024). Amazon $4B 추가 투자 (2024). 현재 $18B+.",
                metrics: [.init(label: "시리즈A (2022)", value: "$580M (Google 등)"), .init(label: "Amazon 투자 (2023)", value: "$4B"), .init(label: "시리즈C (2024)", value: "$4B @ $18B"), .init(label: "Claude 모델 (2024)", value: "Opus·Sonnet·Haiku"), .init(label: "직원 (2024)", value: "500+")],
                lesson: "딥테크 + 명확한 미션 (AI 안전) = 거대 자본 빠르게 모임. 빅테크 인수 대신 파트너십으로 자율성 확보.",
                sourceUrl: "https://www.anthropic.com", sourceLabel: "Anthropic 공식 · Crunchbase", startYear: 2021, industry: "AI / LLM"),
            SFSuccessCase(id: "perplexity", name: "Perplexity AI", founder: "Aravind Srinivas · Denis Yarats · Andy Konwinski · Johnny Ho", location: "샌프란시스코",
                tagline: "2022 OpenAI · Meta · DeepMind 출신 창업. \"AI 검색\" 카테고리 정의. 시리즈D 2024 @ $9B. 2년 만에 데카콘 도달.",
                metrics: [.init(label: "시드 (2022)", value: "$3.1M"), .init(label: "시리즈A (2023)", value: "$25.6M"), .init(label: "시리즈B (2024.1)", value: "$73.6M @ $520M"), .init(label: "시리즈D (2024.12)", value: "$500M @ $9B"), .init(label: "월 검색 (2024)", value: "230M+")],
                lesson: "Google 의 페인 (광고 가득한 검색) 을 직접 공격. 2년 만에 valuation 30배 — Google 같은 거인도 카테고리 만들면 무너뜨릴 수 있다.",
                sourceUrl: "https://www.perplexity.ai", sourceLabel: "Perplexity blog · Crunchbase", startYear: 2022, industry: "AI 검색"),
            SFSuccessCase(id: "vercel", name: "Vercel", founder: "Guillermo Rauch (Next.js 만든 사람)", location: "샌프란시스코",
                tagline: "Next.js 오픈소스 → 클라우드 회사. 2017 시드. 2020 시리즈A. 2024 시리즈D $250M @ $3.25B. 제로트러스트 + DX 가 무기.",
                metrics: [.init(label: "시드 (2017)", value: "$1.1M"), .init(label: "시리즈A (2020)", value: "$21M"), .init(label: "시리즈C (2021)", value: "$150M @ $2.5B"), .init(label: "시리즈D (2024)", value: "$250M @ $3.25B"), .init(label: "Next.js 다운로드", value: "월 수억회")],
                lesson: "오픈소스로 개발자 마음 잡기 → 그 위에 유료 클라우드 얹기. \"Open Core\" 모델의 모범 사례.",
                sourceUrl: "https://vercel.com", sourceLabel: "Vercel blog · TechCrunch", startYear: 2015, industry: "개발자 인프라"),
            SFSuccessCase(id: "notion-scaleup", name: "Notion (시리즈A 이후)", founder: "Ivan Zhao", location: "샌프란시스코",
                tagline: "2019 시리즈A $10M 후 폭발적 성장. 2020 시리즈B $50M @ $2B → 2021 시리즈D $275M @ $10B → 현재 $11B + IPO 준비.",
                metrics: [.init(label: "시리즈A (2019)", value: "$10M @ $800M"), .init(label: "시리즈B (2020)", value: "$50M @ $2B"), .init(label: "시리즈D (2021)", value: "$275M @ $10B"), .init(label: "현재 평가 (2025)", value: "$11B"), .init(label: "ARR (2025)", value: "$600M+"), .init(label: "고객", value: "4M+")],
                lesson: "PMF 도달 후 14년에 걸친 \"점진적 IPO 준비\". 시리즈A 후 valuation 14배 도달까지 6년.",
                sourceUrl: "https://www.notion.so", sourceLabel: "Notion blog · Crunchbase", startYear: 2013, industry: "B2B/B2C SaaS"),
        ],
    ]

    // 페이지 4 보조 — 영감용 한국 사례 (웹 StartupFoundationStage page 4 하단 미러)
    static let koreanCases: [(year: String, name: String, story: String)] = [
        ("2010", "배달의민족", "바닥에 떨어진 전단지를 스캔해서 앱을 만듦. 회사 설립은 앱 출시 5개월 후. 2019년 DH(독일) 가 ₩4.8조 인수."),
        ("2015", "토스 (비바리퍼블리카)", "8번 실패 후 통장 잔고 2만원. 송금 앱으로 시작 → 현재 시총 ₩7조+ (시리즈G $410M @ $7B)."),
        ("2015", "당근마켓", "판교 직원 8명 사이드 프로젝트로 시작. 2024 시리즈D $2B valuation. 월 사용자 1,800만+."),
        ("2010", "쿠팡", "그루폰 클론으로 시작 → 로켓배송 전환. 2021 NYSE 상장 시총 $69B (역대 한국 IPO 최대)."),
    ]

    // MARK: - Block 2: 법인 vs 개인사업자 의사결정 (모드별 권장)
    private static let decisionByMode: [String: SFDecisionGuide] = [
        "indie": SFDecisionGuide(recommend: "sole", headline: "1인 인디 → 개인사업자 우선",
            reason: "매출 1억 400만 미만이면 간이과세로 부가세 1.5%만 부담. 법인 설립 비용 50-100만원 + 법인 통장·세무·노무 부담은 솔로한테 ROI 안 맞음. 매출 7억+, 외부 투자, 직원 채용 시 법인 전환."),
        "bootstrap": SFDecisionGuide(recommend: "corp", headline: "부트스트랩 → 법인 + SHA 동시 권장",
            reason: "공동창업자가 있으면 법인이 표준. 지분 = 주식 = 법적 효력. 개인사업자에서 '지분 합의' 는 거의 무효. 1차 매출 없어도 SHA 통한 베스팅·근속 의무 사전 확보가 6-12개월 후 갈등 회복 어려움 방지."),
        "seed": SFDecisionGuide(recommend: "corp", headline: "시드 단계 → 법인 + 옵션풀 10-15% + 벤처기업 인증",
            reason: "시드 받은 시점부터 시리즈A 마감 18-24개월. 이 기간 안에 법인 + SHA + 옵션풀 + IP + 벤처기업 인증 모두 정비해야 due diligence 통과. 옵션풀 부족 시 시리즈A 시 5-10% 추가 희석."),
        "seriesA": SFDecisionGuide(recommend: "corp", headline: "시리즈A+ → 법인 + 옵션풀 추가 5-10% + Delaware C-Corp 검토",
            reason: "시리즈A 클로징 시 옵션풀 추가 5-10% (총 15-25%). 글로벌 진출 시 Delaware C-Corp 자회사 검토. 한국 본사 + 미국 sub 가 글로벌 VC·세무·exit 표준."),
    ]

    // MARK: - Block 3: 법인 형태 상세 (모드별)
    private static let corpByMode: [String: SFCorpDetail] = [

        "indie": SFCorpDetail(
            headline: "1인 인디 — 개인사업자 우선, 법인은 나중",
            why: [
                "1인 솔로는 매출 1억 400만원 미만이면 간이과세로 부가세 1.5%만 부담 (일반 10% 대비 압도적). 법인은 매출 무관 일반과세.",
                "개인사업자는 종합소득세 6-45% 누진세 — 매출 5천만 이하 단계는 법인 9% 보다 실효세율 낮을 수 있음.",
                "법인 설립 비용 50-100만원 + 법인 통장·세무·노무 부담 — 인디한테 ROI 안 맞음.",
            ],
            actions: [
                SFModeAction(label: "1단계: 홈택스 개인사업자 등록 (5분, 무료)", detail: "사업자등록번호 즉시 발급. 간이과세 자격 자동 확인 (직전 연도 매출 1억 400만 미만 — 부가가치세법 시행령 §109)."),
                SFModeAction(label: "2단계: 사업용 통장 + 카드 분리", detail: "토스뱅크·카카오뱅크 사업자 통장 무료 개설. 모든 매출·경비 분리 — 종합소득세 신고 시 비용 인정."),
                SFModeAction(label: "3단계: KIPRIS 상표 직접 출원 (4-6만원)", detail: "변리사 30-50만 위임 vs 직접 출원 4-6만원 (수수료만). 1인 인디는 직접 권장 — 절차 단순."),
                SFModeAction(label: "법인 전환 트리거", detail: "(a) 순이익 연 2억+ → 건강보험 부담 폭발 / (b) 첫 외부 투자 / (c) 첫 직원 고용 / (d) 매출 7억+ → 성실신고확인대상 전환 전"),
            ],
            advantages: [
                "✓ 등록 비용 0원 (개인사업자) vs 법인 50-100만원",
                "✓ 간이과세로 부가세 1.5% (매출 1억 400만 미만)",
                "✓ 종소세는 비용 처리 폭 넓음 — 솔로 인디 도구비 (Cursor·Claude) 모두 비용",
                "✓ 폐업도 1일 — 법인은 청산 절차 6개월+",
            ],
            tools: [
                SFCorpTool(name: "홈택스 (개인사업자 등록)", desc: "5분 온라인 무료 등록", price: ""),
                SFCorpTool(name: "KIPRIS (상표 검색·출원)", desc: "직접 출원 4-6만원", price: ""),
                SFCorpTool(name: "삼쩜삼 (종소세 환급)", desc: "1인 종소세 자동 신고", price: ""),
            ]
        ),

        "bootstrap": SFCorpDetail(
            headline: "부트스트랩 — 법인 + SHA 동시 권장",
            why: [
                "공동창업자가 있으면 법인이 표준. 지분 = 주식 = 법적 효력. 개인사업자에서 '지분 합의' 는 거의 무효 (인적회사 구조).",
                "1차 매출 없어도 법인 먼저 권장 — SHA 통한 베스팅·근속 의무·매각 제한 사전 확보. 6-12개월 후 갈등 시 회복 어려움.",
                "유한책임 — 법인 채무는 출자금 한도. 개인 자산 보호 (인디는 무한책임).",
            ],
            actions: [
                SFModeAction(label: "1단계: 주식회사 설립 (자본금 100만~2천만)", detail: "헬프미·자비스 등 온라인 30-50만 (DIY) 또는 법무사 위임 80-120만. 등록면허세 11.25만 + 지방교육세 (20%) + 법원수수료 2-3.5만."),
                SFModeAction(label: "⚠️ 과밀억제권역 (서울·수도권) 중과세 주의", detail: "수도권 본점 설립 시 등록면허세 3배. 자본금 1천만 → 등록면허세 33.75만 (수도권). 비수도권 설립 후 본점 이전도 옵션."),
                SFModeAction(label: "2단계: 공동창업자 SHA (주주간 계약서) 즉시 작성", detail: "cliff 2년 의무(주총 결의일부터 2년 재직 — 상법 §340-4, 벤처기업도 완화 불가). 4년 베스팅 + 2년 cliff 표준. Drag-Along·Tag-Along·Right of First Refusal 포함."),
                SFModeAction(label: "3단계: 옵션풀 5-10% 사전 확보", detail: "벤처기업 인증 + 옵션풀 50% 한도까지 가능. 부트스트랩은 5-10% 시작 — 시드 시 추가 발행 협상력."),
                SFModeAction(label: "4단계: 상표·도메인 출원 (변리사 30-50만)", detail: "법인 명의 출원 — 회사 자산. 시드 라운드 due diligence 1순위 항목."),
            ],
            advantages: [
                "✓ 유한책임 — 개인 자산 보호 (인디 무한책임 대비)",
                "✓ 법인세 10-25% (2026.1 인상, 개인사업자 6-45% — 고소득 구간에서 절세)",
                "✓ SHA 통한 공동창업자 분쟁 사전 차단",
                "✓ 시드 라운드 시 'corp + SHA + IP' 패키지 = 즉시 due diligence 통과",
                "✓ 정부지원사업 (예비창업·초기창업·청년창업사관학교) 자격 폭 넓어짐",
            ],
            tools: [
                SFCorpTool(name: "헬프미 (법인설립 온라인)", desc: "원스톱 등기·사업자등록", price: "30~50만원"),
                SFCorpTool(name: "자비스 (법인설립 + 회계)", desc: "법인설립 + 월 회계", price: "30만~"),
                SFCorpTool(name: "ZUZU (주주관리·SHA)", desc: "캡테이블·SHA·옵션풀 관리", price: "무료~"),
                SFCorpTool(name: "Notion (창업자 합의서)", desc: "지분 구조·SHA 초안 템플릿", price: "무료~$10/월"),
            ]
        ),

        "seed": SFCorpDetail(
            headline: "시드 단계 — 옵션풀 10-15% + 벤처기업 인증",
            why: [
                "시드 자금 받은 시점부터 시리즈A 마감 18-24개월. 이 기간 안에 법인 + SHA + 옵션풀 + IP + 벤처기업 인증 모두 정비해야 due diligence 통과.",
                "옵션풀 부족 시 시리즈A 시 추가 발행 → 대표 지분 5-10% 추가 희석. 시드 시 미리 10-15% 확보가 협상력.",
                "벤처기업 인증 시 옵션풀 50% 한도 + 스톡옵션 비과세 (연 2억·누적 5억, 2027.12.31까지). ※ cliff 2년은 법정이라 벤처기업도 단축 불가.",
            ],
            actions: [
                SFModeAction(label: "1단계: 변호사 위임 SHA 정비 (200-500만)", detail: "시드 VC 가 요구하는 표준 조항 반영: Liquidation Preference 1x non-participating · Anti-dilution Broad-Based · Pro-Rata Right · Drag-Along · Tag-Along · ROFR."),
                SFModeAction(label: "2단계: 옵션풀 10-15% 사전 발행 + ESOP 정책", detail: "시리즈A VC는 옵션풀 부족 시 추가 발행 요구 — 사전 확보가 핵심. 직원 별 grant 정책 (Engineer 0.1-1% / Senior 1-3% / VP 1-5%) 표준화."),
                SFModeAction(label: "3단계: 벤처기업 인증 (벤처투자유형)", detail: "적격투자기관으로부터 5천만원 이상 + 자본금의 10% 이상 유치 시 신청 요건 충족 → 벤처기업확인기관 평가·심의 통과 시 확인(자동 아님). 옵션풀 50% 한도 + 법인세 5년 50% 감면 + R&D 25% 세액공제 + 병역특례."),
                SFModeAction(label: "4단계: 정식 IP 전략 (변리사 정기 자문 50-100만/월)", detail: "트레이드마크 다국가 (한국·미국·EU·중국) + 핵심 특허 출원 + Trade Secret 정책. 스타트업 (사업개시 3년 이내) 우선심사 신청료 70% 감면 (연 10건 한정) 활용."),
                SFModeAction(label: "5단계: 회계 시스템 + 월간 결산 (자비스·더존)", detail: "VC 보고용 표준 재무제표. 자비스 SaaS 친화 + 영문 출력. 월 30-50만원."),
            ],
            advantages: [
                "✓ 벤처기업 옵션풀 50% 한도 (일반 10% 대비 5배)",
                "✓ 스톡옵션 비과세 연 2억/누적 5억 (2027.12.31 부여 분)",
                "✓ 법인세 5년 50% 감면 (벤처기업)",
                "✓ R&D 세액공제 25% (중소기업)",
                "✓ 병역특례 (전문연구요원/산업기능요원) — 핵심 인재 유지",
                "✓ 대표 지분 60% 유지 (시리즈A 협상 마지노선)",
            ],
            tools: [
                SFCorpTool(name: "ZUZU (캡테이블·SHA)", desc: "시드 VC 표준 SHA 템플릿 + 옵션풀 관리", price: "무료~ 유료"),
                SFCorpTool(name: "벤처기업 인증 (벤처인)", desc: "벤처투자유형 — 적격투자 5천만+·자본금 10%+ 요건 + 평가·심의", price: ""),
                SFCorpTool(name: "자비스·더존 (회계 SaaS)", desc: "VC 보고 표준 재무제표", price: "30-50만원/월"),
                SFCorpTool(name: "법무법인 위임 (SHA 정비)", desc: "표준 VC 조항 반영", price: "200-500만원"),
            ]
        ),

        "seriesA": SFCorpDetail(
            headline: "시리즈A+ — 추가 옵션풀 + 글로벌 구조",
            why: [
                "시리즈A 클로징과 동시에 옵션풀 추가 5-10% 발행 (총 15-25%). C-suite·VP 채용용 별도 grant pool 분리.",
                "글로벌 진출 시 미국 Delaware C-Corp 자회사 검토. 한국 본사 + 미국 sub 구조가 글로벌 VC·세무·exit 면에서 표준.",
                "법무팀 인하우스 또는 외부 fixed retainer 200-500만/월. C-Suite·이사회·해외 진출·M&A 모두 법무 비중 큼.",
            ],
            actions: [
                SFModeAction(label: "1단계: 옵션풀 추가 발행 + ESOP 확장", detail: "시리즈A 클로징 시 추가 5-10% 발행. C-suite (CTO 2-5% / CPO 1-3% / VP 0.5-2%) 별도 grant 정책."),
                SFModeAction(label: "2단계: 정관 개정 + 종류주식 (Series A 우선주) 발행", detail: "투자자 권리 (전환·우선매수·동의 사항) 명시. 변호사 위임 500만원~ 1천만원."),
                SFModeAction(label: "3단계: 미국 Delaware C-Corp 자회사 (글로벌 진출 시)", detail: "Stripe Atlas $500 또는 변호사 위임 $5K-$10K. 한국 본사 + 미국 sub flip 또는 Korea-side. 세무·환위험·exit 영향."),
                SFModeAction(label: "4단계: 법무팀 구축 (인하우스 또는 외부 retainer)", detail: "월 200-500만 retainer. 계약·IP·노무·해외·이사회·M&A 모두 처리. 시리즈B 전 정착이 표준."),
                SFModeAction(label: "5단계: IP 포트폴리오 확대 (defensive + offensive)", detail: "특허 5-20개 + 다국가 트레이드마크 + 영업비밀 정책. Trade Secret 명문화 (NDA + Non-compete + 자료 분류)."),
            ],
            advantages: [
                "✓ 옵션풀 15-25% — C-suite·VP 채용 무기",
                "✓ Series A 우선주 — 투자자 권리 + 일반주 보호 분리",
                "✓ 글로벌 자회사 (Delaware C-Corp) — 미국 VC·exit·환위험 헤지",
                "✓ 인하우스 법무 — CEO 본업 집중 가능",
                "✓ IP 포트폴리오 — 시리즈B·M&A·IPO 모두 가산점",
            ],
            tools: [
                SFCorpTool(name: "법무법인 인하우스 또는 외부 retainer", desc: "월 200-500만", price: ""),
                SFCorpTool(name: "Stripe Atlas (Delaware C-Corp)", desc: "글로벌 자회사 $500 셋업", price: ""),
                SFCorpTool(name: "Carta (글로벌 캡테이블)", desc: "글로벌 표준 cap table·옵션 관리", price: ""),
                SFCorpTool(name: "변리사 사무소 (IP 포트폴리오)", desc: "정기 자문 + 다국가 출원", price: ""),
            ]
        ),
    ]

    private static let byMode: [String: SFModeContent] = [

        "indie": SFModeContent(
            headline: "1인 인디 — 본인 1명 + 멘토 + 외주 (★ 2026 Agentic Leverage 시대)",
            why: [
                "★ 솔로 파운더 36.3% (2019: 23.7%) — 신생 스타트업 1/3+. Sequoia Capital 이 'Agentic Leverage' 라는 새 underwriting 모델 도입 (작은 팀이 AI agent 로 큰 산출).",
                "★ Anthropic Dario Amodei: \"2026년 안에 첫 1인 십억달러 회사 등장 — 70-80% 확신\". 실리콘밸리 30개 솔로 스타트업이 직원 1인당 $10M 매출. Medvi 사례: 2명이 첫해 $401M (인큐먼트 3배 마진).",
                "AI 도구 (Cursor·Claude Code·Lovable·v0) 덕분에 1인이 5인 팀 일 처리. 공동창업자 = 지분 50% 희석 + 갈등 리스크.",
                "단점은 고립 + 번아웃. '공동창업자' 대신 '멘토 + 커뮤니티 + AI agent + 외주' 4종 조합으로 충분.",
            ],
            actions: [
                SFModeAction(label: "1단계: 멘토 1명 확보 (월 1-2회 1시간)", detail: "같은 산업의 시니어 또는 시드 단계 수료한 founder. K-Startup 멘토링 포털 무료 매칭. Antler Korea·Founder Institute 액셀러레이터 멘토 풀 활용."),
                SFModeAction(label: "2단계: 글로벌·국내 커뮤니티 가입 (고립 방지)", detail: "Indie Hackers (글로벌), MicroConf Connect (부트스트랩), 한국: Startup Grind Seoul, 디스콰이엇, EO 슬랙. 매주 1회 active 참여."),
                SFModeAction(label: "3단계: 외주 매핑 (본인 약점 영역만)", detail: "디자인 = Wishket·Fiverr / 마케팅 컨설팅 = K-Startup 멘토링 / 회계·세무 = 자비스·삼쩜삼. 외주는 매출 발생 후 시작 (인디는 자본 절약 우선)."),
                SFModeAction(label: "4단계: 외주 전환 트리거 — 본인 시간 < 외주비용 시", detail: "예: 디자인에 주 10시간 → 30만원/월 외주 vs 본인 시간 가치 (예상 시급 5만+). 시간 가치가 외주비 넘으면 즉시 외주."),
            ],
            decisions: [
                SFModeDecision(item: "공동창업자 들이지 않는 결정", recommendation: "지분 100% 유지 + 의사결정 빠름. 단, 1년 후에도 솔로면 멘토·외주 시스템이 작동해야 함."),
                SFModeDecision(item: "외주 vs 풀타임 첫 채용", recommendation: "제품이 유료 매출·트랙션을 내고 내 시간가치 > 외주비가 될 때 contractor → 6개월 검증 후 full-time. 그 전에는 본인 + 외주만."),
            ],
            resources: [
                SFModeResource(name: "Indie Hackers", desc: "글로벌 인디 해커 커뮤니티"),
                SFModeResource(name: "MicroConf Connect", desc: "부트스트랩 SaaS 글로벌 최대 커뮤니티"),
                SFModeResource(name: "K-Startup 멘토링", desc: "정부 무료 멘토링 매칭 (2026 통합 포털)"),
                SFModeResource(name: "Antler Korea", desc: "최대 $260K 투자 + 시니어 멘토"),
                SFModeResource(name: "Startup Grind Seoul", desc: "글로벌 120개국 커뮤니티 한국 챕터"),
            ]
        ),

        "bootstrap": SFModeContent(
            headline: "부트스트랩 — 1-3명 공동창업 + 동업계약 즉시",
            why: [
                "공동창업자 있으면 분담으로 속도 2-3배. 단 함의·합의·문서화 안 하면 6-12개월 후 갈등 폭발 (스타트업 폐업 사유 1순위 — 'co-founder dispute').",
                "지분 비율은 결정 즉시 — 입찰 처럼. 미루면 매출·외부 투자 후 협상력 0. YC 권장: 동등 또는 근접 배분 (예: 50/50 또는 55/45).",
                "베스팅 4년 + cliff 2년(주총 결의일부터 2년 재직 법정 — 상법 §340-4, 벤처기업도 완화 불가) 표준. 한 명 이탈 시 vesting 전 지분 회수 가능.",
            ],
            actions: [
                SFModeAction(label: "1단계: 공동창업자 역할·책임 명시 (서면)", detail: "CEO·CTO·CPO 역할 분담 명문화. '의견 불일치 시 누가 최종 결정?' 캐스팅 보트 필수 (50/50 데드락 방지). Notion·Google Doc 으로 기록 + 모두 서명."),
                SFModeAction(label: "2단계: 지분 비율 즉시 결정 (Co-Founder Equity Calculator 활용)", detail: "YC: 50/50 또는 55/45. 차이 작을수록 좋음. 시간 ≠ 가치 (먼저 시작했어도 동등). 기여가 계속 바뀔 팀은 Slicing Pie(고정 분배 대신 기여 비례 동적 분배)를 대안으로 검토."),
                SFModeAction(label: "3단계: 공동창업 계약서(동업계약서) 즉시 작성 — 변호사 위임 200-500만 또는 ZUZU 무료 템플릿", detail: "필수 조항: 베스팅 + 이탈 시 지분 회수 + 매각 제한 (Drag-Along, Tag-Along, ROFR) + 비경쟁 의무 + 기밀 유지. (법인 설립 후 주주간계약서(SHA)로 정식화)"),
                SFModeAction(label: "4단계: 첫 채용 = 본인이 못 하는 영역 (MVP·runway 확보 후)", detail: "tech founder = 디자이너/마케터 / non-tech founder = 엔지니어. 첫 1명은 contractor (월 200-300만) → 6개월 검증 → full-time. 옵션 grant 0.5-2%."),
            ],
            decisions: [
                SFModeDecision(item: "공동창업자 수 (1명 vs 2명)", recommendation: "2명 = 스피드 + 보완 / 3명 = 의사결정 느려짐 (한국 정서 합의 문화). 2명이 표준."),
                SFModeDecision(item: "지분 분배", recommendation: "근접 배분 + 베스팅. 동등 (50/50) 시 캐스팅 보트 (CEO 권한 강화) 별도 명시."),
                SFModeDecision(item: "첫 채용 시점", recommendation: "MVP 출시 + 채용 인건비를 감당할 runway(매출·자본) 확보 후. 그 전에는 본인+공동창업자(+외주)만."),
            ],
            resources: [
                SFModeResource(name: "ZUZU (캡테이블·계약서 템플릿)", desc: "동업·주주간 계약서 무료 템플릿 + 캡테이블 관리"),
                SFModeResource(name: "Foundrs (Co-Founder Equity Calculator)", desc: "고정 분배 계산기 — 기여 요인별 가중으로 지분 산출"),
                SFModeResource(name: "Slicing Pie (Mike Moyer)", desc: "동적 분배 모델 — 기여 변동에 맞춰 자동 조정 (고정 분배의 대안)"),
                SFModeResource(name: "Notion (공동창업자 합의서)", desc: "역할·지분·의사결정 문서 템플릿"),
                SFModeResource(name: "Wishket / 크몽", desc: "한국 외주 마켓플레이스 (디자인·개발)"),
                SFModeResource(name: "MicroConf Connect", desc: "부트스트랩 SaaS 커뮤니티 (37signals 모델)"),
            ]
        ),

        "seed": SFModeContent(
            headline: "시드 단계 — 코어 3-5명 + 옵션 grant 정책",
            why: [
                "시드 받았다면 24개월 안에 시리즈A 마일스톤 도달이 목표. 3-5명 코어 팀이 가장 폭발적으로 성장.",
                "잘못된 시니어 채용 1명 = 시드 자본 20% 손실 (3-6개월 분 인건비). 채용 결정 = founder의 가장 중요한 일.",
                "옵션 grant 정책 사전 확보 — 시리즈A 시 추가 발행 = founder 지분 5-10% 희석. 시드 시 옵션풀 10-15% 미리 잡아야 함.",
            ],
            actions: [
                SFModeAction(label: "1단계: 첫 채용 = founding engineer (tech 스타트업)", detail: "시드 클로징 직후. 직접 빌드 + 의사결정 자율 + 최소 가이드. 0.5-1% equity + 시중 base 80% (옵션 풀 활용). YC 표준 첫 채용."),
                SFModeAction(label: "2단계: 두 번째 채용 = 본인이 약한 영역", detail: "B2B SaaS ACV $50K+ → founding salesperson. B2C/PLG sub-$10K → founding marketer. tech-first product → founding designer."),
                SFModeAction(label: "3단계: 옵션 grant 정책 표준화 (이전 채용에도 소급 적용)", detail: "Engineer 0.1-1% / Senior 1-3% / Founding 2-5%. cliff 2년(법정 — 벤처기업도 동일, 완화 불가) + 4년 베스팅. RSU vs 스톡옵션 결정 (한국은 보통 스톡옵션)."),
                SFModeAction(label: "4단계: 채용 프로세스 표준화 (founder 60% 시간)", detail: "Job spec 작성 → ATS (Greenhouse·Workable·자체 Notion) → 4-step 면접 (recruiter·hiring manager·peer·founder) → 레퍼런스 콜 3명. 채용 결정 만장일치 권장."),
                SFModeAction(label: "5단계: 코어 팀 도구·문화 셋업", detail: "Slack + Linear/GitHub + Notion + Google Workspace. 주간 1on1 + 분기 OKR + 월간 all-hands. 빠른 의사결정 문화 (Amazon 'disagree and commit')."),
            ],
            decisions: [
                SFModeDecision(item: "첫 채용 직무", recommendation: "tech founder = founding engineer 첫 채용. non-tech founder = engineer 첫 채용. (가장 약한 영역이 아니라, 가장 중요한 영역)."),
                SFModeDecision(item: "옵션풀 비율", recommendation: "10-15% 사전 확보. 벤처기업 인증 시 50% 한도 가능 — 미국 VC 협상 시 유리."),
                SFModeDecision(item: "시니어 vs 주니어 첫 채용", recommendation: "시드는 시니어 1명 > 주니어 3명. 시니어가 시스템·문화 정립."),
            ],
            resources: [
                SFModeResource(name: "ZUZU (옵션 grant 관리)", desc: "스톡옵션·캡테이블·베스팅 자동"),
                SFModeResource(name: "원티드 (스타트업 표준)", desc: "IT 집중 + 추천 보상금. 시드~시리즈B 1순위"),
                SFModeResource(name: "리멤버 커리어 (시니어·경력직)", desc: "MAU 506만, 명함 기반 시니어 헤드헌팅 1순위"),
                SFModeResource(name: "점핏 (개발자 전문)", desc: "사람인 운영. 개발자 채용 + 연봉 인사이트"),
                SFModeResource(name: "로켓펀치 (초기 스타트업)", desc: "초기 스타트업 채용·투자자 매칭"),
                SFModeResource(name: "잡플래닛·크레딧잡 (연봉·평판 검증)", desc: "회사 평판 + 4대보험 기반 연봉 시세 검증"),
                SFModeResource(name: "OKKY / GeekNews / 디스콰이엇", desc: "개발자 커뮤니티 채용 게시판 + GitHub-based 추천"),
                SFModeResource(name: "사람인·잡코리아 (비개발 직군)", desc: "마케터·디자이너·세일즈는 일반 잡포털이 효과적"),
                SFModeResource(name: "LinkedIn", desc: "글로벌 시니어·외국인 채용 (K-Startup Grand Challenge 트랙)"),
                SFModeResource(name: "Greenhouse / Workable / Notion ATS", desc: "채용 프로세스 표준화 (지원자 추적)"),
                SFModeResource(name: "벤처인 (벤처기업 인증)", desc: "적격투자 5천만+·자본금 10%+ 요건 후 평가·심의 통과 시 → 옵션풀 50% 한도"),
            ]
        ),

        "seriesA": SFModeContent(
            headline: "시리즈A+ — C-suite 채용 + 이사회 + 운영 OS",
            why: [
                "시리즈A 후 founder는 '실행자' → '경영자' 전환. 모든 결정 직접 = bottleneck. C-suite 위임 못 하면 시리즈B 전 회사 멈춤 (Reid Hoffman).",
                "C-suite 채용 사이클 6-12개월. CEO 시간 60% 채용에 — 잘못된 VP 1명 = 18개월 손실.",
                "이사회 구성 (투자자 1-2 + 외부 이사 1 + founder) + 분기 운영 + 월간 update. 거버넌스 미정비 = 시리즈B 실패 1순위.",
            ],
            actions: [
                SFModeAction(label: "1단계: C-suite 채용 (CTO·CPO·VP Engineering·VP Sales)", detail: "총 12-18개월 사이클. 첫 1명 = CTO 또는 VP Engineering (tech 스타트업). 다음 = CPO·VP Sales (각 산업별 우선순위). C-suite equity 0.5-2% + 시장 base + 시그닝."),
                SFModeAction(label: "2단계: Growth marketer 첫 채용 (mid-senior)", detail: "VP/Head of Growth 는 premature (팀 없으면 무의미). Mid-senior IC (4-7yr 경력) 1-2명 시작. base $110K-$150K + 0.1-0.5% equity. 6-12개월 후 VP 승격 또는 외부 영입."),
                SFModeAction(label: "3단계: 이사회 구성 + 분기 운영", detail: "시리즈A 클로징 후 30일 내 첫 board meeting. 분기 정기 미팅 + 월간 update + 연간 strategy off-site. Reid Hoffman 표준: investor 1-2 + 외부 1 + founder."),
                SFModeAction(label: "4단계: 옵션풀 추가 발행 (총 15-25%) + ESOP 정책", detail: "C-suite·VP grant 별도 풀. CTO 2-5% / CPO 1-3% / VP 0.5-2%. 4년 베스팅 + cliff 2년(법정 — 벤처기업도 동일)."),
                SFModeAction(label: "5단계: 운영 OS 정립 (OKR + 부문 KPI + 주간 리뷰)", detail: "Andrew Chen 표준: compounding growth loops. Growth team + Data infra + Experimentation platform. 시리즈B 18-24개월 내 — 메트릭 트래킹 (NRR·Burn Multiple·Magic Number 등) 정착."),
            ],
            decisions: [
                SFModeDecision(item: "C-suite 채용 순서", recommendation: "tech 스타트업 = CTO 1순위. B2B SaaS = VP Sales 1순위. B2C/PLG = CPO 1순위."),
                SFModeDecision(item: "이사회 구성", recommendation: "투자자 1-2 + 외부 이사 1 + founder. 외부 이사는 산업 베테랑 (CEO 경험자) 권장."),
                SFModeDecision(item: "Growth marketer 시점", recommendation: "PMF 검증 후 즉시. ARR $1M+ 시. 더 늦으면 시리즈B 마일스톤 못 잡음."),
            ],
            resources: [
                SFModeResource(name: "외부 헤드헌터 (C-suite 전문)", desc: "Heidrick & Struggles, Korn Ferry — C-suite 채용 8-12주"),
                SFModeResource(name: "Carta (글로벌 캡테이블·옵션)", desc: "글로벌 표준 옵션 grant + ESOP 관리"),
                SFModeResource(name: "원티드 + LinkedIn + 추천", desc: "C-suite 70% 추천 채용 (한국)"),
                SFModeResource(name: "이사회 운영 도구 (Diligent·Boardable)", desc: "분기 미팅·자료·의결 표준화"),
                SFModeResource(name: "Reid Hoffman 'Blitzscaling'", desc: "C-suite·이사회·스케일 표준 참고서"),
            ]
        ),
    ]
}
