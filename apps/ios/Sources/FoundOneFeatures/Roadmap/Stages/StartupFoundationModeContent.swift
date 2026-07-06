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
                SFModeAction(label: "2단계: 공동창업자 SHA (주주간 계약서) 즉시 작성", detail: "벤처기업 인증 후 cliff 1년 적용 가능 (일반 회사는 2년 cliff 의무). 4년 베스팅 + 1-2년 cliff 표준. Drag-Along·Tag-Along·Right of First Refusal 포함."),
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
                "벤처기업 인증 시 옵션풀 50% 한도 + cliff 1년 적용 + 스톡옵션 비과세 (연 2억·누적 5억, 2027.12.31까지).",
            ],
            actions: [
                SFModeAction(label: "1단계: 변호사 위임 SHA 정비 (200-500만)", detail: "시드 VC 가 요구하는 표준 조항 반영: Liquidation Preference 1x non-participating · Anti-dilution Broad-Based · Pro-Rata Right · Drag-Along · Tag-Along · ROFR."),
                SFModeAction(label: "2단계: 옵션풀 10-15% 사전 발행 + ESOP 정책", detail: "시리즈A VC는 옵션풀 부족 시 추가 발행 요구 — 사전 확보가 핵심. 직원 별 grant 정책 (Engineer 0.1-1% / Senior 1-3% / VP 1-5%) 표준화."),
                SFModeAction(label: "3단계: 벤처기업 인증 (투자유치형, 시드 1억+)", detail: "VC·액셀러레이터 1억+ 투자 받았으면 자동 자격. 옵션풀 50% 한도 + 법인세 5년 50% 감면 + R&D 25% 세액공제 + 병역특례."),
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
                SFCorpTool(name: "벤처기업 인증 (벤처인)", desc: "투자유치형 자동 자격 (시드 1억+)", price: ""),
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
                "베스팅 4년 + cliff (한국 상법 2년 / 벤처기업 1년) 표준. 한 명 이탈 시 vesting 전 지분 회수 가능.",
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
                SFModeAction(label: "3단계: 옵션 grant 정책 표준화 (이전 채용에도 소급 적용)", detail: "Engineer 0.1-1% / Senior 1-3% / Founding 2-5%. cliff 1년 (벤처기업 인증 시) + 4년 베스팅. RSU vs 스톡옵션 결정 (한국은 보통 스톡옵션)."),
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
                SFModeResource(name: "벤처인 (벤처기업 인증)", desc: "시드 1억+ 후 자동 자격 → 옵션풀 50% 한도"),
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
                SFModeAction(label: "4단계: 옵션풀 추가 발행 (총 15-25%) + ESOP 정책", detail: "C-suite·VP grant 별도 풀. CTO 2-5% / CPO 1-3% / VP 0.5-2%. 4년 베스팅 + 1년 cliff (벤처기업)."),
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
