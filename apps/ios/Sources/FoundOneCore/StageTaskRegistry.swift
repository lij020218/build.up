//
//  StageTaskRegistry.swift — 단계별 액션 체크리스트 데이터 (웹 SSOT 미러)
//
//  웹 SSOT:
//    packages/shared/src/starter-data.ts  → starterTaskMap
//    packages/shared/src/i18n.ts          → taskTitleCopy (한국어 카피)
//
//  사용:
//    let tasks = BUStageTaskRegistry.tasks(for: "target-customer-definition")
//
//  industryCategoryId 가 있으면 "{taskId}__{categoryId}" override 우선 사용.
//

import Foundation

public struct BUStageTask: Identifiable, Sendable, Hashable {
    public let id: String
    public let title: String
    public let estimatedMinutes: Int?
    public let required: Bool

    public init(id: String, title: String, estimatedMinutes: Int? = nil, required: Bool = true) {
        self.id = id
        self.title = title
        self.estimatedMinutes = estimatedMinutes
        self.required = required
    }
}

public enum BUStageTaskRegistry {

    public static func tasks(for stageId: String, industryCategoryId: String? = nil) -> [BUStageTask] {
        guard let base = stageMap[stageId] else { return [] }
        guard let categoryId = industryCategoryId else { return base }
        // industry-specific title overrides
        return base.map { task in
            let overrideKey = "\(task.id)__\(categoryId)"
            if let overrideTitle = titleOverrides[overrideKey] {
                return BUStageTask(id: task.id, title: overrideTitle, estimatedMinutes: task.estimatedMinutes, required: task.required)
            }
            return task
        }
    }

    // MARK: - Stage → tasks (Korean titles)

    private static let stageMap: [String: [BUStageTask]] = [
        // ── shared ─────────────────────────────────────────────────────────────
        "target-customer-definition": [
            .init(id: "tc-age-narrowed",      title: "주 연령대(또는 산업·기업 규모) 한 명으로 좁힘 — 모호한 '20-50대' 정의 X", estimatedMinutes: 5),
            .init(id: "tc-lifestyle-specified", title: "라이프스타일·일상 동선 구체화 — 언제·어디서·왜 쓰는지 명시", estimatedMinutes: 8),
            .init(id: "tc-price-anchor",      title: "객단가·예산 한도 명시 — 절대 안 살 가격대까지 포함", estimatedMinutes: 5),
            .init(id: "tc-counter-example",   title: "반례 검증 — 이 페르소나가 절대 안 할 행동 4개 명시", estimatedMinutes: 10),
        ],
        "menu-design": [
            .init(id: "md-signature-items",      title: "시그니처 메뉴(또는 서비스) 3-5개 확정", estimatedMinutes: 30),
            .init(id: "md-side-items",           title: "사이드·보조 메뉴 2-3개 확정", estimatedMinutes: 15),
            .init(id: "md-pricing-set",          title: "각 항목 가격 책정 — 원가율 목표 설정 (외식업 기준 33% 이하)", estimatedMinutes: 30),
            .init(id: "md-categories-organized", title: "카테고리·노출 순서 정리 — 재고 카드에 자동 등록되는 베이스", estimatedMinutes: 15),
        ],
        "franchise-application": [
            .init(id: "fc-inquiry",    title: "본사 가맹 상담 신청 완료", estimatedMinutes: 30),
            .init(id: "fc-disclosure", title: "정보공개서 수령 및 검토 (14일 숙려기간)", estimatedMinutes: 480),
            .init(id: "fc-visit",      title: "인근 가맹점 방문 — 기존 점주 경험 확인", estimatedMinutes: 240),
            .init(id: "fc-legal",      title: "가맹 계약서 법률 검토 (변호사/가맹거래사)", estimatedMinutes: 120, required: false),
            .init(id: "fc-contract",   title: "가맹 계약 체결 및 가맹비 납부", estimatedMinutes: 60),
            .init(id: "fc-training",   title: "본사 교육 프로그램 이수 완료", estimatedMinutes: 2400),
        ],

        // ── startup-tech path ──────────────────────────────────────────────────
        "startup-foundation": [
            .init(id: "problem-defined",         title: "핵심 문제를 한 문장으로 정의 (Musk 원리 분해 + Thiel 반대 진실)", estimatedMinutes: 30),
            .init(id: "founder-alignment",       title: "팀 구성 결정 (솔로/공동) 및 역할·지분 베스팅·이탈 조항 문서화", estimatedMinutes: 60),
            .init(id: "company-formation-path",  title: "법인 vs 개인사업자 결정 (실제 등록은 다음 '법인 설립·등록' 단계에서)", estimatedMinutes: 30),
            .init(id: "case-study-review",       title: "본인 모드(인디/부트스트랩/시드/시리즈A)의 5개 검증 사례 검토 + 교훈 3개 메모", estimatedMinutes: 30, required: false),
            .init(id: "build-in-public-setup",   title: "마케팅 채널 사전 검토 — 출시 전 메이커 스토리를 공유할 빌드 인 퍼블릭(X/트위터·블로그) 채널 운영 계획 수립 (Marc Lou·Pieter Levels 패턴)", estimatedMinutes: 30, required: false),
        ],
        "customer-discovery": [
            .init(id: "customer-interviews-done", title: "초기 타겟 고객 인터뷰 10건 이상 완료", estimatedMinutes: 180),
            .init(id: "pain-pattern-documented",  title: "반복 문제·현재 대안·긴급성 문서화", estimatedMinutes: 60),
            .init(id: "narrow-wedge-defined",     title: "가장 좁고 절실한 첫 문제 정의", estimatedMinutes: 45),
        ],
        "mvp-build": [
            .init(id: "core-workflow-defined", title: "핵심 사용자 워크플로와 성공 기준 정의", estimatedMinutes: 60),
            .init(id: "mvp-shipped",           title: "가장 작은 MVP 출시", estimatedMinutes: 240),
            .init(id: "ip-protection-filed",   title: "공개 전 상표 등록 및 특허 출원 (가출원 포함)", estimatedMinutes: 90),
            .init(id: "pg-payment-ready",      title: "PG(전자결제) 가입 — 토스페이먼츠/KCP/이니시스. 사전 준비: 통신판매업 신고 + 사이트 완성. 심사 1~2주 (유료 결제 시작 시점에 신청)", estimatedMinutes: 30, required: false),
        ],
        "launch-gtm": [
            .init(id: "analytics-live",             title: "분석 도구 연결 (PostHog·Mixpanel) — 핵심 이벤트 5개 + 퍼널 + 주간 대시보드", estimatedMinutes: 60),
            .init(id: "billing-or-conversion-live", title: "결제·전환 흐름 세팅 (Stripe) — 가격 결정 + 무료→유료 트리거", estimatedMinutes: 45),
            .init(id: "error-monitoring-live",      title: "에러 모니터링 연결 (Sentry) + Slack 알림 (10분 셋업)", estimatedMinutes: 30),
            .init(id: "feedback-loop-live",         title: "피드백 루프 구축 — 인앱 버튼 + Discord/Cal.com + 24시간 환영 메일", estimatedMinutes: 45),
            .init(id: "first-100-users-acquired",   title: "첫 100명 사용자 직접 확보 — DM·콜드메일·커뮤니티·PH/HN 론칭", estimatedMinutes: 1200),
            .init(id: "marketing-content-cadence",  title: "마케팅 채널 1-2개 선택 + 매주 콘텐츠 1개+ (Build in Public·SEO 등)", estimatedMinutes: 240),
            .init(id: "security-checklist-reviewed", title: "보안 체크리스트 47개 검토 — 출시 전 권장", estimatedMinutes: 120, required: false),
        ],
        "go-live": [
            .init(id: "web-go-live",              title: "웹 출시 — 도메인 + SSL + SEO 메타 + Google Search Console (1-3시간)", estimatedMinutes: 180),
            .init(id: "launch-channel-active",    title: "최소 1개 채널 론칭 — Product Hunt / Hacker News / 디스콰이엇 빌드 로그", estimatedMinutes: 480),
            .init(id: "apple-app-store-submitted", title: "Apple App Store 제출 (iOS만) — Xcode 26 + iOS 26 SDK + TestFlight (2026.4.28부터 의무)", estimatedMinutes: 480, required: false),
            .init(id: "google-play-submitted",    title: "Google Play 제출 (Android만) — 12명 테스터 × 14일 폐쇄 테스트 의무", estimatedMinutes: 600, required: false),
            .init(id: "launch-day-monitored",     title: "론칭 데이 24시간 모니터링 — 모든 댓글 답변 + Twitter·HN·PH 동시 공유", estimatedMinutes: 480, required: false),
        ],
        "growth-engine": [
            .init(id: "north-star-set",         title: "북극성 지표 하나 선택 — 회사 전체가 추적할 핵심 숫자", estimatedMinutes: 30),
            .init(id: "weekly-review-running",  title: "매주 월요일 30분 성장 리뷰 — 지표 확인 + 실험 1개", estimatedMinutes: 30),
            .init(id: "retention-check-defined", title: "리텐션 체크 — D1/D7/D30 기준 확인 후 개선 집중", estimatedMinutes: 45),
        ],
        "company-setup": [
            .init(id: "business-structure-decided", title: "사업 형태 선택 — 개인사업자(대부분 초기) vs 법인(투자 유치 시)", estimatedMinutes: 30),
            .init(id: "startup-biz-registered",     title: "사업자등록 완료 — 홈택스 온라인 신청 (3영업일 소요)", estimatedMinutes: 60),
            .init(id: "ip-protection-planned",      title: "특허 출원 — 공개(데모·베타·보도자료) 전에 특허로에서 출원 필수", estimatedMinutes: 90),
            .init(id: "trademark-filed",            title: "상표 출원 — 브랜드명·로고를 특허로(patent.go.kr)에서 출원", estimatedMinutes: 60),
            .init(id: "tax-setup-basics",           title: "과세 유형 결정 — 간이과세(개인사업자 한정·매출 1억 400만원 미만) vs 일반과세 (법인은 매출 무관 일반과세)", estimatedMinutes: 45, required: false),
            .init(id: "security-basics",            title: "개인정보보호 정책 · 이용약관 · 고객 데이터 보안 계획 수립", estimatedMinutes: 45, required: false),
            .init(id: "terms-privacy-published",    title: "이용약관 · 개인정보처리방침 게시 — 유저 가입 전 법적 필수", estimatedMinutes: 60),
        ],
        "fundraising-readiness": [
            .init(id: "runway-model-ready",        title: "런웨이 모델링 — Best/Base/Worst 시나리오 + 18개월 목표 + Net Burn 비율 점검", estimatedMinutes: 60),
            .init(id: "fundraising-decision-made", title: "자금 조달 방식 결정 — 부트스트랩 vs 투자 유치 (Default Alive 검증)", estimatedMinutes: 45),
            .init(id: "funding-programs-matched",  title: "본인 모드별 자금 프로그램 1-3개 매칭 + 신청 시작 (TIPS·예비창업·액셀러레이터·VC)", estimatedMinutes: 90),
            .init(id: "investor-material-ready",   title: "AI 사업계획서 + 10장 피치덱 + 3년 재무 모델 + 제품 데모 준비", estimatedMinutes: 120),
        ],
        "venture-certification": [
            .init(id: "venture-cert-type-checked",   title: "벤처인증 유형 결정 — 투자유치형 / 연구개발형 / 혁신성장형 중 선택", estimatedMinutes: 30),
            .init(id: "application-submitted",       title: "벤처인 (venture.or.kr) 에서 신청서 제출 — 심사 30일 소요", estimatedMinutes: 90),
            .init(id: "venture-benefits-activated",  title: "인증 후 혜택 활성화 — 법인세 50% 감면 (5년) + 스톡옵션 비과세 + 옵션풀 50% + 병역특례", estimatedMinutes: 60),
        ],

        // ── Hardware/IoT cluster ───────────────────────────────────────────────
        "hardware-prototype": [
            .init(id: "evt-passed", title: "EVT 통과 — 10-50대, 4-6주, 핵심 회로/펌웨어 결함 검증", estimatedMinutes: 240),
            .init(id: "dvt-passed", title: "DVT 통과 — 50-200대, 양산 공정과 동일하게 제작, 내구성·신뢰성 테스트", estimatedMinutes: 240),
            .init(id: "pvt-passed", title: "PVT 통과 — 첫 양산의 5-10%, 최소 4주, 양산 가능성·목표 단가 확인", estimatedMinutes: 180),
        ],
        "bom-supply-chain": [
            .init(id: "bom-finalized",                    title: "BOM 완성 — 부품·하위조립·원재료 + 공급사·리드타임·대안 부품 명시", estimatedMinutes: 240),
            .init(id: "suppliers-locked",                 title: "공급사 락인 — 핵심 부품 1차/2차 공급사 계약 (dual-sourcing 권장)", estimatedMinutes: 180),
            .init(id: "single-source-risks-identified",   title: "Single-source 리스크 식별 — 대체 부품 없는 항목 명시 + 안전재고 계획", estimatedMinutes: 120),
        ],
        "certification-kc-ce": [
            .init(id: "pre-compliance-test-done",     title: "Pre-compliance 테스트 — 정식 KC 인증 전 자체 EMC/Safety 사전 검증", estimatedMinutes: 240),
            .init(id: "cert-bodies-selected",         title: "인증기관 선정 — 한국 RRA/NTC 등 공인 시험소 + 한국 대리인 지정 (KC 필수)", estimatedMinutes: 90),
            .init(id: "cert-application-submitted",   title: "KC 인증 신청 — 비무선 4-8주 / 무선 (KC-RRA + Safety + EMC) 8-16주", estimatedMinutes: 180),
        ],
        "manufacturing-partner": [
            .init(id: "ems-shortlist-done",   title: "EMS/CM 후보 3-5개 비교 — 능력·캐파·품질 표준·QC 시스템 점검", estimatedMinutes: 240),
            .init(id: "ems-audited",          title: "EMS 현장 감사 — 직접 방문 또는 화상 라인 점검, ISO 9001 등 인증 확인", estimatedMinutes: 480),
            .init(id: "first-run-planned",    title: "1차 양산 계획 — MOQ·결제조건·불량률 임계치·IPI 검사 포인트", estimatedMinutes: 180),
        ],

        // ── Deep Tech Lab ──────────────────────────────────────────────────────
        "lab-setup": [
            .init(id: "lab-facility-secured",     title: "랩/시제품 작업장 확보 — 로보틱스: 안전 펜스·EMC 차폐 / 바이오: GLP 또는 BSL-1/2", estimatedMinutes: 480),
            .init(id: "safety-protocol-defined",  title: "안전 매뉴얼 — 비상정지·전원 격리·화학물질·생물학적 폐기물 처리 절차", estimatedMinutes: 240),
            .init(id: "core-equipment-installed", title: "핵심 장비 설치·교정 — 모션캡처·계측 / 유전자 분석기·세포배양기 등", estimatedMinutes: 480),
        ],
        "prototype-iteration": [
            .init(id: "iteration-plan-set",       title: "반복 일정 + go/no-go 게이트 — 로봇 v0~v3 주간 / 바이오: 단계별 결정 기준", estimatedMinutes: 180),
            .init(id: "v1-prototype-shipped",     title: "v1 프로토타입 완성 — 핵심 기능 동작 + 실험 데이터 수집 가능 상태", estimatedMinutes: 720),
            .init(id: "feedback-cycle-running",   title: "피드백 사이클 가동 — 매주 사용자/실험 결과 → 다음 v 정의", estimatedMinutes: 120),
        ],
        "field-or-clinical-test": [
            .init(id: "test-protocol-approved",     title: "테스트 프로토콜 승인 — 로봇: 필드 안전 평가 / 바이오: IRB + 임상시험계획서", estimatedMinutes: 480),
            .init(id: "test-cohort-secured",        title: "참가자/환경 확보 — 임상기관·피험자·보상보험 (IND 제출 필수 요건)", estimatedMinutes: 360),
            .init(id: "first-results-collected",    title: "첫 결과 수집 — 동작 로그·고장 통계 또는 IND 4-6주 후 1상 데이터", estimatedMinutes: 240),
        ],
        "regulatory-submission": [
            .init(id: "pre-consultation-done",          title: "MFDS pre-consultation 완료 — 정식 심사 전 사전 협의 (최단 7일 단축 가능)", estimatedMinutes: 240),
            .init(id: "regulatory-package-submitted",   title: "인허가 패키지 제출 — KC + 안전인증 / MFDS Fast-Track (199개 카테고리)", estimatedMinutes: 480),
            .init(id: "approval-pathway-confirmed",     title: "승인 경로 확정 — 일반 (295일) vs Fast-Track (80-140일)", estimatedMinutes: 180),
        ],

        // ── Extreme Deep Tech ──────────────────────────────────────────────────
        "eda-tooling-setup": [
            .init(id: "eda-licenses-secured",         title: "EDA 라이선스 확보 — multi-year 협상 (10-25% 할인), token-based 옵션 비교", estimatedMinutes: 480),
            .init(id: "design-env-set-up",            title: "설계 환경 구축 — 서버·OS·백업·라이선스 서버·시뮬레이션 클러스터", estimatedMinutes: 480),
            .init(id: "ip-library-strategy-defined",  title: "IP/라이브러리 전략 — 자체 vs 라이선스, 표준셀·메모리·PHY·Analog IP 결정", estimatedMinutes: 240),
        ],
        "mpw-or-pilot-tape-out": [
            .init(id: "foundry-process-selected",  title: "공정 노드 선정 — TSMC/Samsung/UMC/X-FAB/SkyWater + 노드 (28nm·12nm·7nm)", estimatedMinutes: 240),
            .init(id: "tape-out-package-ready",    title: "테이프아웃 패키지 준비 — GDS-II, DRC/LVS clean, 검증 보고서, 일정 등록", estimatedMinutes: 720),
            .init(id: "tape-out-submitted",        title: "MPW shuttle 또는 full-mask 테이프아웃 제출 — MPW 90-95% 절감", estimatedMinutes: 120),
        ],
        "packaging-and-test": [
            .init(id: "osat-partner-selected",      title: "OSAT 파트너 선정 — ASE·Amkor·JCET·Powertech (2026 가격 5-30% 인상)", estimatedMinutes: 240),
            .init(id: "test-plan-defined",          title: "테스트 플랜 정의 — wafer-level/package-level, ATE, burn-in, yield 임계치", estimatedMinutes: 240),
            .init(id: "first-samples-validated",    title: "첫 샘플 검증 — 기능·성능·전력·온도, 고객 샘플 발송 준비", estimatedMinutes: 360),
        ],
        "partner-foundation-or-pilot-line": [
            .init(id: "foundry-partnership-discussion", title: "파운드리 파트너십 협의 — TSMC 2/3nm 2027-2028 매진, Samsung 대안", estimatedMinutes: 480),
            .init(id: "volume-production-plan",         title: "양산 수량 계획 — 첫 12개월 wafer-out + CoWoS leadtime 52-78주 반영", estimatedMinutes: 360),
            .init(id: "scale-up-budget-modeled",        title: "Scale-up 예산 모델링 — Full mask 전환비 + OSAT 캐파·인상률 + 채널 비용", estimatedMinutes: 240),
        ],

        // ── Offline path ───────────────────────────────────────────────────────
        "permit-check": [
            .init(id: "building-registry-checked",   title: "건축물대장 용도가 내 업종 영업을 허용하는지 확인 — 근린생활시설 등 코드 점검", estimatedMinutes: 15),
            .init(id: "permit-type-checked",         title: "위 패널에서 내 업종에 필요한 인허가·등록 종류를 모두 확인", estimatedMinutes: 20),
            .init(id: "hygiene-health-checked",      title: "위생교육·건강진단(보건증) 요건 확인 — 업종별 시간·절차·발급처 (식품 6시간+보건증 / 미용 3시간, 위생교육은 대표자)", estimatedMinutes: 15),
            .init(id: "license-registration-checked", title: "전문 면허·업종별 등록 요건 확인 (미용사 면허, 학원·체육시설·동물관련업 등록 등)", estimatedMinutes: 15),
            .init(id: "fire-safety-checked",         title: "소방·시설 안전 요건 확인 — 업종별 기준 (다중이용업〔음식점 100㎡↑·학원 등〕은 소방완비증명, 미용 등 그 외는 소화기·비상구)", estimatedMinutes: 15),
        ],
        "contract-review": [
            .init(id: "use-check",              title: "건물 용도와 업종 적합성 확인", estimatedMinutes: 20),
            .init(id: "facility-check",         title: "설비·환기·전기 상태 검토", estimatedMinutes: 30),
            .init(id: "restriction-check",      title: "임대차 조건·권리금·갱신 조항 확인", estimatedMinutes: 25),
            .init(id: "septic-tank-checked",    title: "정화조 용량 음식점 영업신고 가능 여부 확인 (음식·카페)", estimatedMinutes: 15, required: false),
            .init(id: "certified-date-obtained", title: "임대차 계약서 확정일자 받기 (보증금 보호)", estimatedMinutes: 20),
        ],
        "construction-setup": [
            .init(id: "interior-concept-selected", title: "디자인 컨셉 방향 선택 (인더스트리얼 / 내추럴 / 파리지앵 등)", estimatedMinutes: 10),
            .init(id: "contractor-selected",       title: "인테리어 업체 선정 및 견적 2곳 이상 수령", estimatedMinutes: 60),
            .init(id: "design-approved",           title: "최종 레이아웃 설계 및 공사 계획 확정", estimatedMinutes: 45),
            .init(id: "construction-complete",     title: "공사 완료 및 최종 현장 점검", estimatedMinutes: 30),
            .init(id: "fire-health-parallel",      title: "공사 중 소방필증·보건증 병행 신청 (인테리어 완료 전 미리 진행)", estimatedMinutes: 30),
        ],
        "vendor-setup": [
            .init(id: "supplier-identified", title: "주요 원자재·상품·소모품 공급처 확정", estimatedMinutes: 60),
            .init(id: "equipment-planned",   title: "장비 구매 또는 렌탈 계획 확정", estimatedMinutes: 40),
            .init(id: "pos-selected",        title: "POS 시스템 선택 및 운영 연동", estimatedMinutes: 30),
        ],
        "registration-setup": [
            .init(id: "tax-type-decided",     title: "간이과세 / 일반과세 선택 결정 (등록 전 필수)", estimatedMinutes: 15),
            .init(id: "business-registered",  title: "세무서에서 사업자등록 완료 (영업 시작 20일 이내)", estimatedMinutes: 40),
            .init(id: "permit-filed",         title: "관할 관청에 영업 신고 또는 허가 신청 완료", estimatedMinutes: 60),
        ],
        "insurance-tax-setup": [
            .init(id: "insurance-registered",   title: "4대보험 정보연계센터에서 4대보험 통합 신고 완료", estimatedMinutes: 40),
            .init(id: "withholding-tax-set",    title: "홈택스 간이세액표로 원천세 설정 완료", estimatedMinutes: 30),
            .init(id: "payroll-method-decided", title: "급여 지급 방식 결정 (수기/세무사/급여 SaaS)", estimatedMinutes: 20),
        ],
        "hiring-setup": [
            .init(id: "hiring-decision-made",       title: "직원·알바 필요 여부 및 인원 계획 확정", estimatedMinutes: 30),
            .init(id: "employment-contract-signed", title: "근로계약서 작성 및 교부 완료", estimatedMinutes: 40),
        ],
        "operations-setup": [
            .init(id: "delivery-app-registered",  title: "배달앱 입점 등록 (음식·카페 업종 해당 시)", estimatedMinutes: 45),
            .init(id: "pos-live",                 title: "POS 설치 + 카드결제 신청 + 실거래 테스트 완료 (개업 15일 전)", estimatedMinutes: 30),
            .init(id: "sns-setup",                title: "인스타그램·네이버 플레이스·카카오 채널 개설", estimatedMinutes: 60),
            .init(id: "brand-identity-offline",   title: "브랜드 자산 준비 — 간판 디자인·메뉴판·인테리어 브랜딩 요소", estimatedMinutes: 60),
            .init(id: "card-merchant-registered", title: "카드 가맹점 등록 — VAN사(나이스·KIS·스마트로) 통해 일괄 신청, 약 1주 소요", estimatedMinutes: 30),
            .init(id: "music-license-registered", title: "매장 배경음악 저작권 등록 — 50㎡(15평) 이상 매장 필수, 월 4천원~", estimatedMinutes: 15),
        ],
        "pre-launch": [
            .init(id: "soft-open-done",      title: "손님 초대 & 행사 기획 완료", estimatedMinutes: 120),
            .init(id: "feedback-collected",  title: "소프트 오픈 당일 운영 체크리스트 완료", estimatedMinutes: 30),
            .init(id: "final-checklist",     title: "피드백 수집 & 본오픈 마케팅 준비 완료", estimatedMinutes: 60),
        ],

        // ── Online / Digital path ──────────────────────────────────────────────
        "platform-setup": [
            .init(id: "platform-selected",       title: "판매 플랫폼 선택 (스마트스토어·쿠팡·자체몰)", estimatedMinutes: 40),
            .init(id: "seller-account-created",  title: "선택 플랫폼 판매자 계정 생성 및 인증", estimatedMinutes: 30),
        ],
        "online-registration": [
            .init(id: "business-registered-online", title: "세무서에서 사업자등록 완료", estimatedMinutes: 40),
            .init(id: "escrow-registered",          title: "사업용 통장 개설 + 구매안전서비스(에스크로) 가입 — 통신판매업 신고 전 필수", estimatedMinutes: 40),
            .init(id: "telecom-sale-filed",         title: "통신판매업 신고 (지자체)", estimatedMinutes: 30),
        ],
        "sourcing-setup": [
            .init(id: "kc-trademark-reviewed",  title: "KC인증 필요 여부 확인 + 상표권 검토 (소싱 전 필수 확인)", estimatedMinutes: 45, required: false),
            .init(id: "supplier-contracted",    title: "신뢰할 공급사 또는 도매상과 계약", estimatedMinutes: 60),
            .init(id: "product-photographed",   title: "초기 상품 전체 사진 촬영 완료", estimatedMinutes: 90),
            .init(id: "detail-page-created",    title: "상품 상세 페이지 설명 및 이미지 등록", estimatedMinutes: 90, required: false),
        ],
        "store-setup": [
            .init(id: "store-configured",        title: "스토어 카테고리·배너·반품 정책 구성", estimatedMinutes: 60),
            .init(id: "shipping-setup",          title: "택배사 연동 및 배송 옵션 설정", estimatedMinutes: 30),
            .init(id: "pg-connected",            title: "결제·정산 확인 — 마켓플레이스는 정산 대금 입금 계좌 등록 / 자체몰은 PG(토스·이니시스 등) 연동", estimatedMinutes: 30, required: false),
            .init(id: "brand-identity-online",   title: "브랜드 자산 준비 — 스토어 로고·배너·패키지 디자인", estimatedMinutes: 60, required: false),
            .init(id: "cs-channel-ready",        title: "고객 상담 채널 세팅 — 카카오톡 채널 또는 네이버 톡톡 개설 + 반품/교환 정책 작성", estimatedMinutes: 30),
            .init(id: "packaging-supplies-ready", title: "포장재 확보 — 택배 박스·완충재·테이프·송장 프린터. 실제 포장 → 발송 워크플로 테스트 필수", estimatedMinutes: 45),
        ],
        "online-marketing": [
            .init(id: "store-seo-done",       title: "네이버 쇼핑 검색 최적화 (상품명·태그)", estimatedMinutes: 60),
            .init(id: "first-ad-set",         title: "스마트스토어 또는 쿠팡 첫 광고 캠페인 설정", estimatedMinutes: 45),
            .init(id: "review-strategy-set",  title: "신상품 초기 리뷰 확보 전략 수립", estimatedMinutes: 30, required: false),
        ],

        // ── shared closing stages ──────────────────────────────────────────────
        "biz-registration": [
            .init(id: "biz-reg-confirmed",  title: "세무서 사업자등록 완료 여부 확인", estimatedMinutes: 20),
            .init(id: "biz-account-opened", title: "사업 전용 통장 개설 (개인 계좌와 분리)", estimatedMinutes: 30),
            .init(id: "cpa-decision-made",  title: "세무대리인(세무사) 선임 여부 결정", estimatedMinutes: 20, required: false),
        ],
        "pre-launch-final": [
            .init(id: "launch-date-locked",      title: "오픈 D-Day 확정 + 사전 알릴 단골·커뮤니티 10명 명단 (위생교육·단말기·식자재 입고 후 평일)", estimatedMinutes: 40),
            .init(id: "production-deployed",     title: "단말기·POS·Wi-Fi·간판·메뉴판 4중 점검 + 백업 핫스팟 자동전환 검증", estimatedMinutes: 90),
            .init(id: "payment-and-legal-ready", title: "카드 단말기 실제 결제·취소·영수증 1사이클 + 사업자 정보·환불 정책·전기·가스·수도 명의 변경", estimatedMinutes: 90),
            .init(id: "runbook-prepared",        title: "오픈 당일 매뉴얼 — 직원 1시간 모의운영 + 비상 연락처 5종 + 첫 손님 응대 5문장 + 역할 분담", estimatedMinutes: 60),
            .init(id: "calendar-alarms-set",     title: "D-28~D+14 13개 알림 + 네이버 플레이스·인스타 D-7 콘텐츠 7개 예약 + D-Day 일정 봉인", estimatedMinutes: 95),
        ],
    ]

    // MARK: - Industry-specific title overrides ({taskId}__{categoryId})

    private static let titleOverrides: [String: String] = [
        // biz-registration — startup-tech
        "biz-reg-confirmed__startup-tech":   "법인 등기 + 사업자등록 완료 확인",
        "biz-account-opened__startup-tech":  "법인 통장 개설 (개인 계좌 완전 분리)",

        // pre-launch-final — startup-tech
        "launch-date-locked__startup-tech":      "D-Day 화·수 12:01 PT 확정 (4~6주 후) + 베타 사용자 10명 명단 (인터뷰·waitlist 추출)",
        "production-deployed__startup-tech":     "프로덕션 배포 + 도메인·SSL + Sentry/Slack 알람 실제 에러 트리거 검증",
        "payment-and-legal-ready__startup-tech": "Stripe/Toss 라이브 100원 결제 1사이클 + 법적 풋터 + PIPA 2025 (이동권·동의 분리·국내대리인)",
        "runbook-prepared__startup-tech":        "D-Day 매뉴얼 — 시간대별 11슬롯 + 댓글 5종 템플릿 + 응급 5종 + 역할 분담",
        "calendar-alarms-set__startup-tech":     "13개 알림 (D-28~D+14) + Product Hunt 예약 (D-7 publish) + D-Day 24h·D-1·D+1 봉인",

        // pre-launch-final — online-digital
        "launch-date-locked__online-digital":      "오픈 D-Day 확정 (자기 주문 시뮬·재고 동기화 후) + 알림받기 100명 사전 모집",
        "production-deployed__online-digital":     "스토어 카테고리·상세페이지·반품정책 + 박스·완충재·라벨지 5묶음 백업 입고",
        "payment-and-legal-ready__online-digital": "본인 주문 → 포장 → 송장 → 발송 1번 완주 + 사업자·통신판매업 정보 + 환불 템플릿 5종",
        "runbook-prepared__online-digital":        "주문 알림 30분 룰 + 톡톡 12시간 SLA + 분쟁 대비 포장 사진 자동 저장 + CS 템플릿",
        "calendar-alarms-set__online-digital":     "D-7 매일 1콘텐츠 예약 + 첫 구매 쿠폰 + D+7 광고 시작 알림 + 발송 마감 시간 봉인",
    ]
}

// MARK: - @AppStorage persistence helpers
//
// 사용:
//   @AppStorage("stageTasks.target-customer-definition") private var raw: String = "[]"
//   private var doneBinding: Binding<Set<String>> { ... }
//
public enum BUStageTaskPersist {
    public static func decode(_ raw: String) -> [String] {
        guard let data = raw.data(using: .utf8),
              let arr = try? JSONSerialization.jsonObject(with: data) as? [String]
        else { return [] }
        return arr
    }

    public static func encode(_ arr: [String]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: arr),
              let s = String(data: data, encoding: .utf8)
        else { return "[]" }
        return s
    }
}
