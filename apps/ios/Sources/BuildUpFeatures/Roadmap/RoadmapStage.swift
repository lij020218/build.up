//
//  RoadmapStage.swift — 로드맵 단계 데이터 모델 (웹 SSOT 미러)
//
//  ⚠️ 웹 SSOT: packages/shared/src/starter-data.ts + roadmap/workflow.ts
//   traverseUserPath() 의 nextStageIds / nextStageConditions 분기 결과를
//   cluster 별로 그대로 펼친 정적 시퀀스.
//
//  cluster 별 총 단계 수 (웹 검증 기준):
//    offline-food:         21 단계
//    online-digital:       15 단계
//    startup-tech:         19 단계
//    hardware-iot:         23 단계
//    robotics-physical-ai: 23 단계
//    biotech-medtech:      23 단계
//    semiconductor:        23 단계
//    climate-energy:       23 단계
//

import Foundation

// MARK: - BusinessCluster

public enum BusinessCluster: String, CaseIterable, Sendable, Codable {
    case offlineFood        = "offline-food"
    case onlineDigital      = "online-digital"
    case startupTech        = "startup-tech"
    case hardwareIoT        = "hardware-iot"
    case roboticsPhysicalAI = "robotics-physical-ai"
    case biotechMedtech     = "biotech-medtech"
    case semiconductor      = "semiconductor"
    case climateEnergy      = "climate-energy"

    public var displayName: String {
        switch self {
        case .offlineFood:        return "음식점·카페·소매"
        case .onlineDigital:      return "온라인 커머스"
        case .startupTech:        return "기술 스타트업 (SaaS)"
        case .hardwareIoT:        return "하드웨어·IoT"
        case .roboticsPhysicalAI: return "로봇·물리 AI"
        case .biotechMedtech:     return "바이오·의료기기"
        case .semiconductor:      return "반도체"
        case .climateEnergy:      return "클린테크·에너지"
        }
    }

    public var icon: String {
        switch self {
        case .offlineFood:        return "fork.knife"
        case .onlineDigital:      return "cart"
        case .startupTech:        return "laptopcomputer"
        case .hardwareIoT:        return "cpu"
        case .roboticsPhysicalAI: return "gear.badge"
        case .biotechMedtech:     return "cross.case"
        case .semiconductor:      return "memorychip"
        case .climateEnergy:      return "leaf"
        }
    }

    public var groupLabel: String {
        switch self {
        case .offlineFood, .onlineDigital: return "오프라인·커머스"
        case .startupTech, .hardwareIoT:  return "기술 스타트업"
        case .roboticsPhysicalAI, .biotechMedtech: return "딥테크 (연구 중심)"
        case .semiconductor, .climateEnergy: return "반도체·클린테크"
        }
    }
}

// MARK: - StageStatus

public enum StageStatus: String, Sendable, Codable {
    case completed
    case current
    case upcoming
}

// MARK: - StagePhase
//
// 선언 순서 = UI 표시 순서.
// 각 cluster path 는 아래 phase 의 부분 집합만 사용 (empty phase 는 RoadmapView 에서 필터링).
public enum StagePhase: String, Sendable, CaseIterable, Codable {
    // 공통
    case preparation    = "준비"
    // Offline 전용
    case registration   = "사업 등록"
    case setup          = "오픈 준비"
    case launch         = "오픈·운영"
    // Online 전용
    case onlineSetup    = "플랫폼 셋업"
    case onlineGrowth   = "마케팅·성장"
    // Tech 공통: 기초·MVP
    case foundation     = "기초 구축"
    // Hardware-IoT
    case prototype      = "프로토타입"
    case manufacturing  = "인증·양산"
    // Lab (Robotics / Biotech)
    case labRD          = "연구·개발"
    case regulatory     = "규제·허가"
    // Semiconductor / Climate-Energy
    case designFab      = "설계·제작"
    case massProduction = "양산"
    // Tech 공통: 런치·성장
    case development    = "런치"
    case growth         = "성장·확장"

    public var labelKo: String { rawValue }

    public var subtitleKo: String {
        switch self {
        case .preparation:    return "업종·예산 결정"
        case .registration:   return "인허가·계약·자금"
        case .setup:          return "인테리어·인력"
        case .launch:         return "운영·점검"
        case .onlineSetup:    return "플랫폼·소싱"
        case .onlineGrowth:   return "SEO·마케팅"
        case .foundation:     return "팀·문제·MVP"
        case .prototype:      return "EVT·DVT·PVT"
        case .manufacturing:  return "KC·CE·양산"
        case .labRD:          return "연구소·프로토타입"
        case .regulatory:     return "임상·인허가"
        case .designFab:      return "EDA·테이프아웃"
        case .massProduction: return "OSAT·파운드리"
        case .development:    return "GTM·Go-Live"
        case .growth:         return "투자·인증·재무"
        }
    }
}

// MARK: - RoadmapStage

public struct RoadmapStage: Identifiable, Sendable, Hashable {
    public let id: String
    public let stepNumber: Int
    public let phase: StagePhase
    public let titleKo: String
    public let descriptionKo: String
    public let estimatedDays: Int?
    public let status: StageStatus

    public init(
        stageId: String,
        stepNumber: Int,
        phase: StagePhase,
        titleKo: String,
        descriptionKo: String,
        estimatedDays: Int? = nil,
        status: StageStatus = .upcoming
    ) {
        self.id = stageId
        self.stepNumber = stepNumber
        self.phase = phase
        self.titleKo = titleKo
        self.descriptionKo = descriptionKo
        self.estimatedDays = estimatedDays
        self.status = status
    }

    public var stageId: String { id }
}

// MARK: - RoadmapSampleData

public enum RoadmapSampleData {

    // 모든 cluster 의 stageId → 메타 매핑.
    // 같은 stageId 라도 phase 는 cluster 마다 달라질 수 있으므로 (예: biz-registration / tax-guide),
    // 각 cluster path 정의에서 phase 를 명시한다.
    private struct StageMeta {
        let title: String
        let desc: String
        let days: Int?
    }

    private static let stageMeta: [String: StageMeta] = [
        // 공통 준비
        "industry-selection":          .init(title: "업종 선택",          desc: "사업 분야를 결정합니다. (외식·카페·SaaS·하드웨어 등)", days: 1),
        "startup-type":                .init(title: "창업 유형 선택",      desc: "개인사업자 / 법인 / 프랜차이즈 / 무점포 등 형태를 정합니다.", days: 2),
        "business-model":              .init(title: "운영 방식 선택",      desc: "홀·배달·하이브리드 / 구독·라이선스·API 등 비즈니스 모델 결정.", days: 2),
        "target-customer-definition":  .init(title: "타깃 고객 정의",      desc: "주 연령대·라이프스타일·가격 민감도로 페르소나 한 명을 명시.", days: 1),
        "budget-setup":                .init(title: "예산·시점 설정",      desc: "총 창업 자본, 운영자금, 오픈 시점을 정합니다.", days: 3),

        // 공통 후반 (offline / online / tech 분기 후 공통)
        "biz-registration":            .init(title: "사업용 통장·세무사",    desc: "전용 통장 개설, 세무사 상담.", days: 3),
        "tax-guide":                   .init(title: "세금 신고 가이드",     desc: "홈택스 부가세·종합소득세 신고 캘린더 + 절세 포인트.", days: 3),
        "loan-guide":                  .init(title: "대출·정책자금 가이드", desc: "소진공·중진공·TIPS 등 자금 경로·기관·주의사항.", days: 2),
        "financial-review":            .init(title: "월 운영비 검토",       desc: "고정비·변동비·기타 비용 + Prime Cost·런웨이 시뮬레이션.", days: 3),
        "pre-launch-final":            .init(title: "오픈 최종 점검",       desc: "오픈 전 72시간 체크리스트 + 당일 운영 + 홍보 타임라인.", days: 3),

        // Offline 특화
        "permit-check":                .init(title: "인허가 사전 점검",     desc: "식품접객업 신고·소방·정화조 등 영업 전 필요 인허가 점검.", days: 7),
        "location-candidates":         .init(title: "입지 후보 비교",       desc: "유동인구·경쟁점·임차료를 비교해 2-3 곳 후보 추립니다.", days: 10),
        "contract-review":             .init(title: "임대 계약 전 점검",    desc: "권리금·임대 기간·원상복구 조건을 계약 전 확인합니다.", days: 7),
        "registration-setup":          .init(title: "사업자 등록",          desc: "국세청 홈택스 + 영업신고 + 카드 가맹 신청.", days: 3),
        "construction-setup":          .init(title: "인테리어·집기 셋업",   desc: "견적 3곳 비교, 주방 동선·간판·내장재 결정.", days: 21),
        "menu-design":                 .init(title: "메뉴 라인업 확정",      desc: "시그니처 3-5개 + 사이드 2-3개. 원가율 33% 이하.", days: 5),
        "vendor-setup":                .init(title: "공급처·식자재 확보",   desc: "주요 식자재 2-3 공급처 단가표 확보, 첫 발주 계획.", days: 10),
        "hiring-setup":                .init(title: "직원 채용·근로계약",   desc: "필요 인력 산정, 근로계약서 작성, 매뉴얼 초안.", days: 14),
        "insurance-tax-setup":         .init(title: "4대보험·원천세",       desc: "직원 4대보험 가입, 원천세 신고 셋업.", days: 3),
        "operations-setup":            .init(title: "POS·마케팅 셋업",      desc: "POS·키오스크 셋업, 네이버 플레이스·카카오 채널 개설.", days: 5),
        "pre-launch":                  .init(title: "프리오픈·그랜드 오픈",  desc: "지인 50명 시범 영업 → 피드백 반영 → 정식 오픈.", days: 7),

        // Online 특화
        "platform-setup":              .init(title: "판매 플랫폼 선택",     desc: "스마트스토어·쿠팡·자체몰 중 주력 채널을 결정합니다.", days: 3),
        "online-registration":         .init(title: "사업자등록 + 통신판매업 신고", desc: "국세청 사업자등록 + 공정위 통신판매업 신고.", days: 3),
        "sourcing-setup":              .init(title: "소싱·상품 준비",       desc: "공급사 계약, 상품 사진·설명 제작, 가격 정책 결정.", days: 14),
        "store-setup":                 .init(title: "스토어 셋업",          desc: "상품 등록, 배송 정책, PG·결제 게이트웨이 연동.", days: 7),
        "online-marketing":            .init(title: "SEO·광고·리뷰 전략",  desc: "키워드 최적화, 광고 채널 결정, 리뷰 첫 10개 목표.", days: 14),

        // Tech 공통 기초
        "startup-foundation":          .init(title: "스타트업 기초",         desc: "문제 정의, 창업팀 정렬, 법인 형태 결정.", days: 7),
        "customer-discovery":          .init(title: "고객 발굴",            desc: "고객 인터뷰 10+ 건 수행, 페인 패턴 문서화, 핵심 문제 정의.", days: 21),
        "company-setup":               .init(title: "법인 설립·IP 보호",    desc: "법인 설립 + 특허·상표 출원 (IP 는 MVP 전에).", days: 14),
        "mvp-build":                   .init(title: "MVP 개발",            desc: "핵심 워크플로우 정의 → MVP 출시 → IP 보호 출원.", days: 30),

        // Tech 공통 후반
        "launch-gtm":                  .init(title: "GTM 론칭",             desc: "애널리틱스·빌링·에러 모니터링, 첫 100 사용자 확보.", days: 21),
        "go-live":                     .init(title: "Go-Live",             desc: "웹 go-live + 런치 채널(PH·앱스토어·커뮤니티) 오픈.", days: 7),
        "growth-engine":               .init(title: "성장 엔진 구축",        desc: "북극성 지표 설정, 주간 리뷰 루틴, 리텐션 체크.", days: 30),
        "fundraising-readiness":       .init(title: "투자 준비",            desc: "런웨이 모델·IR 자료 완성, 정부 지원 프로그램 매칭.", days: 21),
        "venture-certification":       .init(title: "벤처 인증",            desc: "벤처 인증 종류 확인 → 신청 → 세제·보조금 혜택 활성화.", days: 14),

        // Hardware-IoT
        "hardware-prototype":          .init(title: "하드웨어 프로토타입",   desc: "EVT (공학 검증) → DVT (설계 검증) → PVT (양산 검증).", days: 60),
        "bom-supply-chain":            .init(title: "BOM·공급망 확정",      desc: "자재명세서 확정, 공급사 lock-in, 단일 소싱 리스크 파악.", days: 21),
        "certification-kc-ce":         .init(title: "KC·CE·FCC 인증",       desc: "무선: 8-16주 / 비무선: 4-8주. KC 의무·CE 유럽 수출 필수.", days: 70),
        "manufacturing-partner":       .init(title: "양산 파트너 선정",     desc: "EMS/CM 선정·공장 감사·첫 양산 계획.", days: 30),

        // Lab (Robotics / Biotech)
        "lab-setup":                   .init(title: "연구소 설립·설비",     desc: "연구소 설립, 안전 프로토콜, 핵심 장비 설치.", days: 30),
        "prototype-iteration":         .init(title: "프로토타입 반복",       desc: "반복 계획 + go/no-go 게이트 + v1 프로토타입.", days: 60),
        "field-or-clinical-test":      .init(title: "현장·임상 시험",        desc: "로봇: 현장 테스트 / 바이오: IND 제출 후 임상 (30영업일).", days: 90),
        "regulatory-submission":       .init(title: "규제 허가 신청",        desc: "MFDS 사전상담 → 규제 패키지 제출 → Fast-Track 80-140일.", days: 120),

        // Semiconductor / Climate-Energy
        "eda-tooling-setup":           .init(title: "EDA 환경 설정",         desc: "Synopsys/Cadence 라이선스, 설계 환경, IP·라이브러리 전략.", days: 21),
        "mpw-or-pilot-tape-out":       .init(title: "MPW·테이프아웃",        desc: "MPW (90-95% 비용 절감) or 풀마스크 (28nm: $1M+ / 7nm: $10M+).", days: 90),
        "packaging-and-test":          .init(title: "패키징·테스트",         desc: "OSAT 파트너 선정, 테스트 계획, 첫 샘플 검증.", days: 60),
        "partner-foundation-or-pilot-line": .init(title: "파운드리·양산",     desc: "TSMC/삼성/UMC 파운드리 파트너십, 양산 계획, 스케일업 예산.", days: 90),
    ]

    // ── cluster 별 정확한 시퀀스 (stageId, phase) ──

    private static let sharedPrefix: [(String, StagePhase)] = [
        ("industry-selection",         .preparation),
        ("startup-type",               .preparation),
        ("business-model",             .preparation),
        ("target-customer-definition", .preparation),
        ("budget-setup",               .preparation),
    ]

    // OFFLINE-FOOD: 21 stages.
    // 웹 SSOT 순서: ...biz-registration → tax-guide → loan-guide → construction-setup → ...
    private static let offlinePath: [(String, StagePhase)] = sharedPrefix + [
        ("permit-check",        .registration),
        ("location-candidates", .registration),
        ("contract-review",     .registration),
        ("registration-setup",  .registration),
        ("biz-registration",    .registration),
        ("tax-guide",           .registration),
        ("loan-guide",          .registration),
        ("construction-setup",  .setup),
        ("menu-design",         .setup),
        ("vendor-setup",        .setup),
        ("hiring-setup",        .setup),
        ("insurance-tax-setup", .setup),
        ("operations-setup",    .launch),
        ("pre-launch",          .launch),
        ("financial-review",    .launch),
        ("pre-launch-final",    .launch),
    ]

    // ONLINE-DIGITAL: 15 stages.
    // 웹 SSOT 순서: platform-setup → online-registration → biz-registration → tax-guide → loan-guide → sourcing-setup → store-setup → ...
    private static let onlinePath: [(String, StagePhase)] = sharedPrefix + [
        ("platform-setup",       .onlineSetup),
        ("online-registration",  .onlineSetup),
        ("biz-registration",     .onlineSetup),
        ("tax-guide",            .onlineSetup),
        ("loan-guide",           .onlineSetup),
        ("sourcing-setup",       .onlineSetup),
        ("store-setup",          .onlineSetup),
        ("online-marketing",     .onlineGrowth),
        ("financial-review",     .onlineGrowth),
        ("pre-launch-final",     .onlineGrowth),
    ]

    // STARTUP-TECH (SaaS default): 19 stages.
    private static let startupTechPath: [(String, StagePhase)] = sharedPrefix + [
        ("startup-foundation",      .foundation),
        ("customer-discovery",      .foundation),
        ("company-setup",           .foundation),
        ("mvp-build",               .foundation),
        ("launch-gtm",              .development),
        ("go-live",                 .development),
        ("growth-engine",           .growth),
        ("fundraising-readiness",   .growth),
        ("venture-certification",   .growth),
        ("tax-guide",               .growth),
        ("loan-guide",              .growth),
        ("biz-registration",        .growth),
        ("financial-review",        .growth),
        ("pre-launch-final",        .growth),
    ]

    // HARDWARE-IOT: 23 stages.
    // mvp-build 후 → hardware-prototype → bom-supply-chain → certification-kc-ce → manufacturing-partner → launch-gtm → ...
    private static let hardwarePath: [(String, StagePhase)] = sharedPrefix + [
        ("startup-foundation",      .foundation),
        ("customer-discovery",      .foundation),
        ("company-setup",           .foundation),
        ("mvp-build",               .foundation),
        ("hardware-prototype",      .prototype),
        ("bom-supply-chain",        .prototype),
        ("certification-kc-ce",     .manufacturing),
        ("manufacturing-partner",   .manufacturing),
        ("launch-gtm",              .development),
        ("go-live",                 .development),
        ("growth-engine",           .growth),
        ("fundraising-readiness",   .growth),
        ("venture-certification",   .growth),
        ("tax-guide",               .growth),
        ("loan-guide",              .growth),
        ("biz-registration",        .growth),
        ("financial-review",        .growth),
        ("pre-launch-final",        .growth),
    ]

    // LAB (Robotics / Biotech): 23 stages.
    // mvp-build 후 → lab-setup → prototype-iteration → field-or-clinical-test → regulatory-submission → launch-gtm → ...
    private static let labPath: [(String, StagePhase)] = sharedPrefix + [
        ("startup-foundation",       .foundation),
        ("customer-discovery",       .foundation),
        ("company-setup",            .foundation),
        ("mvp-build",                .foundation),
        ("lab-setup",                .labRD),
        ("prototype-iteration",      .labRD),
        ("field-or-clinical-test",   .regulatory),
        ("regulatory-submission",    .regulatory),
        ("launch-gtm",               .development),
        ("go-live",                  .development),
        ("growth-engine",            .growth),
        ("fundraising-readiness",    .growth),
        ("venture-certification",    .growth),
        ("tax-guide",                .growth),
        ("loan-guide",               .growth),
        ("biz-registration",         .growth),
        ("financial-review",         .growth),
        ("pre-launch-final",         .growth),
    ]

    // SEMICONDUCTOR / CLIMATE-ENERGY: 23 stages.
    // mvp-build 후 → eda-tooling-setup → mpw-or-pilot-tape-out → packaging-and-test → partner-foundation-or-pilot-line → launch-gtm → ...
    private static let semiPath: [(String, StagePhase)] = sharedPrefix + [
        ("startup-foundation",                    .foundation),
        ("customer-discovery",                    .foundation),
        ("company-setup",                         .foundation),
        ("mvp-build",                             .foundation),
        ("eda-tooling-setup",                     .designFab),
        ("mpw-or-pilot-tape-out",                 .designFab),
        ("packaging-and-test",                    .massProduction),
        ("partner-foundation-or-pilot-line",      .massProduction),
        ("launch-gtm",                            .development),
        ("go-live",                               .development),
        ("growth-engine",                         .growth),
        ("fundraising-readiness",                 .growth),
        ("venture-certification",                 .growth),
        ("tax-guide",                             .growth),
        ("loan-guide",                            .growth),
        ("biz-registration",                      .growth),
        ("financial-review",                      .growth),
        ("pre-launch-final",                      .growth),
    ]

    // MARK: - Public Factory

    public static func stages(for cluster: BusinessCluster) -> [RoadmapStage] {
        let path: [(String, StagePhase)]
        switch cluster {
        case .offlineFood:                          path = offlinePath
        case .onlineDigital:                        path = onlinePath
        case .startupTech:                          path = startupTechPath
        case .hardwareIoT:                          path = hardwarePath
        case .roboticsPhysicalAI, .biotechMedtech:  path = labPath
        case .semiconductor, .climateEnergy:        path = semiPath
        }

        let currentIndex = path.count - 1
        return path.enumerated().map { idx, entry in
            let meta = stageMeta[entry.0] ?? StageMeta(title: entry.0, desc: "", days: nil)
            let status: StageStatus
            if idx < currentIndex       { status = .completed }
            else if idx == currentIndex { status = .current }
            else                        { status = .upcoming }
            return RoadmapStage(
                stageId: entry.0,
                stepNumber: idx + 1,
                phase: entry.1,
                titleKo: meta.title,
                descriptionKo: meta.desc,
                estimatedDays: meta.days,
                status: status
            )
        }
    }

    public static let stages: [RoadmapStage] = stages(for: .offlineFood)

    public static func progressSummary(for cluster: BusinessCluster) -> (completed: Int, total: Int) {
        let s = stages(for: cluster)
        return (completed: s.filter { $0.status == .completed }.count, total: s.count)
    }

    public static let progressSummary: (completed: Int, total: Int) = progressSummary(for: .offlineFood)
}
