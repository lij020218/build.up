//
//  RoadmapStage.swift — 로드맵 단계 데이터 모델 (웹 SSOT 미러)
//
//  ⚠️ 웹 SSOT: packages/shared/src/starter-data.ts + roadmap/workflow.ts
//   46 stage 전체 풀에서 cluster 별 reachable stage 만 노출.
//
//  cluster 별 총 단계 수:
//    offline-food:         22 단계
//    online-digital:       15 단계
//    startup-tech:         19 단계
//    hardware-iot:         22 단계
//    robotics-physical-ai: 22 단계
//    biotech-medtech:      22 단계
//    semiconductor:        22 단계
//    climate-energy:       22 단계
//
//  공통 앞 5 단계 (industry-selection → budget-setup) 는 모든 cluster 에 동일.
//  이후 cluster 별로 분기.
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

public enum StagePhase: String, Sendable, CaseIterable, Codable {
    // 공통 (전 cluster)
    case preparation    = "준비"
    // Offline 전용
    case registration   = "사업 등록"
    case setup          = "오픈 준비"
    case launch         = "오픈·운영"
    // Tech 경로 (startup-tech / hardware / lab / semi)
    case foundation     = "기초 구축"
    case development    = "제품 개발"
    case growth         = "성장·확장"
    // Hardware-IoT 추가
    case prototype      = "프로토타입"
    case manufacturing  = "인증·양산"
    // Lab (biotech / robotics) 추가
    case labRD          = "연구·개발"
    case regulatory     = "규제·허가"
    // Semiconductor / Climate 추가
    case designFab      = "설계·제작"
    case massProduction = "양산"
    // Online 전용
    case onlineSetup    = "플랫폼 셋업"
    case onlineGrowth   = "마케팅·성장"

    public var labelKo: String { rawValue }

    public var subtitleKo: String {
        switch self {
        case .preparation:    return "업종·예산 결정"
        case .registration:   return "인허가·계약"
        case .setup:          return "인테리어·인력"
        case .launch:         return "운영 시작"
        case .foundation:     return "팀·법인·IP"
        case .development:    return "MVP·런치"
        case .growth:         return "투자·인증"
        case .prototype:      return "EVT·DVT·PVT"
        case .manufacturing:  return "KC·CE·양산"
        case .labRD:          return "연구소·프로토타입"
        case .regulatory:     return "임상·인허가"
        case .designFab:      return "EDA·테이프아웃"
        case .massProduction: return "OSAT·파운드리"
        case .onlineSetup:    return "플랫폼·소싱"
        case .onlineGrowth:   return "SEO·마케팅"
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

    // ── 공통 앞 5 단계 (모든 cluster) ──
    private static let sharedPrefix: [(String, StagePhase, String, String, Int?)] = [
        ("industry-selection", .preparation,
         "업종 선택",
         "사업 분야를 결정합니다. (외식·카페·SaaS·하드웨어 등)",
         1),
        ("startup-type", .preparation,
         "창업 유형 선택",
         "개인사업자 / 법인 / 프랜차이즈 / 무점포 등 형태를 정합니다.",
         2),
        ("business-model", .preparation,
         "운영 방식 선택",
         "홀·배달·하이브리드 / 구독·라이선스·API 등 비즈니스 모델 결정.",
         2),
        ("target-customer-definition", .preparation,
         "타깃 고객 정의",
         "주 연령대·라이프스타일·가격 민감도로 페르소나 한 명을 명시.",
         1),
        ("budget-setup", .preparation,
         "예산·시점 설정",
         "총 창업 자본, 운영자금, 오픈 시점을 정합니다.",
         3),
    ]

    // ── Offline 특화 단계 ──
    private static let offlineTail: [(String, StagePhase, String, String, Int?)] = [
        ("permit-check", .registration,
         "인허가 사전 점검",
         "식품접객업 신고·소방·정화조 등 영업 전 필요 인허가 점검.",
         7),
        ("location-candidates", .registration,
         "입지 후보 비교",
         "유동인구·경쟁점·임차료를 비교해 2-3 곳 후보 추립니다.",
         10),
        ("contract-review", .registration,
         "임대 계약 전 점검",
         "권리금·임대 기간·원상복구 조건을 계약 전 확인합니다.",
         7),
        ("registration-setup", .registration,
         "사업자 등록",
         "국세청 홈택스 + 영업신고 + 카드 가맹 신청.",
         3),
        ("biz-registration", .registration,
         "사업용 통장·세무사",
         "전용 통장 개설, 세무사 상담 1-2곳 미팅.",
         3),
        ("construction-setup", .setup,
         "인테리어·집기 셋업",
         "견적 3곳 비교, 주방 동선·간판·내장재 결정.",
         21),
        ("menu-design", .setup,
         "메뉴 라인업 확정",
         "시그니처 3-5개 + 사이드 2-3개. 원가율 33% 이하.",
         5),
        ("vendor-setup", .setup,
         "공급처·식자재 확보",
         "주요 식자재 2-3 공급처 단가표 확보, 첫 발주 계획.",
         10),
        ("hiring-setup", .setup,
         "직원 채용·근로계약",
         "필요 인력 산정, 근로계약서 작성, 매뉴얼 초안.",
         14),
        ("insurance-tax-setup", .setup,
         "4대보험·원천세",
         "직원 4대보험 가입, 원천세 신고 셋업.",
         3),
        ("operations-setup", .launch,
         "POS·마케팅 셋업",
         "POS·키오스크 셋업, 네이버 플레이스·카카오 채널 개설.",
         5),
        ("pre-launch", .launch,
         "프리오픈·그랜드 오픈",
         "지인 50명 시범 영업 → 피드백 반영 → 정식 오픈.",
         7),
        ("tax-guide", .launch,
         "세금 신고 가이드",
         "홈택스 부가세·종합소득세 신고 캘린더 + 절세 포인트.",
         3),
        ("loan-guide", .launch,
         "대출 가이드",
         "소진공 정책자금 경로·기관·주의사항 — 2.96% 저금리 활용법.",
         2),
        ("financial-review", .launch,
         "월 운영비 검토",
         "고정비·변동비·기타 비용 입력 및 Prime Cost 시뮬레이션.",
         3),
        ("pre-launch-final", .launch,
         "오픈 최종 점검",
         "오픈 전 72시간 체크리스트 + 당일 운영 스크립트 + 홍보 타임라인.",
         3),
        ("first-month-check", .launch,
         "첫 달 점검",
         "비상금 런웨이 계산 + 주간 KPI 트래커 + 주간 루틴.",
         30),
    ]

    // ── Online Digital 특화 단계 ──
    private static let onlineTail: [(String, StagePhase, String, String, Int?)] = [
        ("platform-setup", .onlineSetup,
         "판매 플랫폼 선택",
         "스마트스토어·쿠팡·자체몰 중 주력 채널을 결정합니다.",
         3),
        ("online-registration", .onlineSetup,
         "사업자등록 + 통신판매업 신고",
         "국세청 사업자등록 + 공정위 통신판매업 신고 (14일 이내).",
         3),
        ("biz-registration", .onlineSetup,
         "사업용 통장·세무사",
         "전용 통장 개설, 세무사 상담.",
         2),
        ("sourcing-setup", .onlineSetup,
         "소싱·상품 준비",
         "공급사 계약, 상품 사진·설명 제작, 가격 정책 결정.",
         14),
        ("store-setup", .onlineSetup,
         "스토어 셋업",
         "상품 등록, 배송 정책, PG·결제 게이트웨이 연동.",
         7),
        ("tax-guide", .onlineGrowth,
         "세금 신고 가이드",
         "홈택스 부가세·종합소득세 신고 캘린더 + 절세 포인트.",
         3),
        ("loan-guide", .onlineGrowth,
         "대출·정부지원 가이드",
         "소진공·중진공 e-커머스 특화 정책자금 활용법.",
         2),
        ("financial-review", .onlineGrowth,
         "월 운영비 검토",
         "플랫폼 수수료·물류비·광고비 구조 점검.",
         3),
        ("online-marketing", .onlineGrowth,
         "SEO·광고·리뷰 전략",
         "키워드 최적화, 쿠팡 로켓배송 입점, 리뷰 5개 목표.",
         14),
        ("pre-launch-final", .onlineGrowth,
         "론칭 최종 점검",
         "결제 테스트·배송 테스트·CS 프로세스 점검.",
         3),
    ]

    // ── Tech 공통 기초 단계 (startup-tech / hardware / lab / semi) ──
    private static let techFoundation: [(String, StagePhase, String, String, Int?)] = [
        ("startup-foundation", .foundation,
         "스타트업 기초",
         "문제 정의, 창업팀 정렬, 법인 형태 결정.",
         7),
        ("customer-discovery", .foundation,
         "고객 발굴",
         "고객 인터뷰 10+ 건 수행, 페인 패턴 문서화, 핵심 문제 정의.",
         21),
        ("company-setup", .foundation,
         "법인 설립·IP 보호",
         "법인 설립 + 특허·상표 출원 (IP 는 MVP 전에).",
         14),
        ("mvp-build", .development,
         "MVP 개발",
         "핵심 워크플로우 정의 → MVP 출시 → IP 보호 출원.",
         30),
    ]

    // ── Tech 공통 후반 단계 (launch-gtm 이후) ──
    private static let techGrowthTail: [(String, StagePhase, String, String, Int?)] = [
        ("launch-gtm", .development,
         "GTM 론칭",
         "애널리틱스·빌링·에러 모니터링 셋업, 첫 100 사용자 확보.",
         21),
        ("go-live", .development,
         "Go-Live",
         "웹 go-live + 런치 채널(PH·앱스토어·커뮤니티) 오픈.",
         7),
        ("growth-engine", .growth,
         "성장 엔진 구축",
         "북극성 지표 설정, 주간 리뷰 루틴, 리텐션 체크.",
         30),
        ("fundraising-readiness", .growth,
         "투자 준비",
         "런웨이 모델·IR 자료 완성, 정부 지원 프로그램 매칭.",
         21),
        ("venture-certification", .growth,
         "벤처 인증",
         "벤처 인증 종류 확인 → 신청 → 세제·보조금 혜택 활성화.",
         14),
        ("tax-guide", .growth,
         "세금 신고 가이드",
         "법인세·부가세 신고 캘린더, R&D 세액공제 포인트.",
         3),
        ("loan-guide", .growth,
         "정책자금·투자 가이드",
         "중진공·팁스(TIPS)·소진공 스타트업 특화 지원.",
         2),
        ("biz-registration", .growth,
         "사업용 통장·세무사",
         "전용 통장 개설, 법인 세무사 선임.",
         2),
        ("financial-review", .growth,
         "월 운영비 검토",
         "번레이트·런웨이·MRR 기반 재무 구조 점검.",
         3),
        ("pre-launch-final", .growth,
         "상용화 최종 점검",
         "보안 점검·SLA 설정·CS 프로세스·결제 테스트.",
         5),
    ]

    // ── Hardware-IoT 특화 단계 ──
    private static let hardwareTail: [(String, StagePhase, String, String, Int?)] = [
        ("hardware-prototype", .prototype,
         "하드웨어 프로토타입",
         "EVT (공학 검증) → DVT (설계 검증) → PVT (양산 검증).",
         60),
        ("bom-supply-chain", .prototype,
         "BOM·공급망 확정",
         "자재명세서 확정, 공급사 lock-in, 단일 소싱 리스크 파악.",
         21),
        ("certification-kc-ce", .manufacturing,
         "KC·CE·FCC 인증",
         "무선: 8-16주 / 비무선: 4-8주. KC 의무·CE 유럽 수출 필수.",
         70),
        ("manufacturing-partner", .manufacturing,
         "양산 파트너 선정",
         "EMS/CM 선정·공장 감사·첫 양산 계획.",
         30),
    ]

    // ── Lab (Robotics / Biotech) 특화 단계 ──
    private static let labTail: [(String, StagePhase, String, String, Int?)] = [
        ("lab-setup", .labRD,
         "연구소 설립·설비",
         "연구소 설립, 안전 프로토콜, 핵심 장비 설치.",
         30),
        ("prototype-iteration", .labRD,
         "프로토타입 반복",
         "반복 계획 + go/no-go 게이트 + v1 프로토타입.",
         60),
        ("field-or-clinical-test", .regulatory,
         "현장·임상 시험",
         "로봇: 현장 테스트 / 바이오: IND 제출 후 임상 (30영업일).",
         90),
        ("regulatory-submission", .regulatory,
         "규제 허가 신청",
         "MFDS 사전상담 → 규제 패키지 제출 → Fast-Track 80-140일.",
         120),
    ]

    // ── Semiconductor / Climate-Energy 특화 단계 ──
    private static let semiTail: [(String, StagePhase, String, String, Int?)] = [
        ("eda-tooling-setup", .designFab,
         "EDA 환경 설정",
         "Synopsys/Cadence 라이선스, 설계 환경, IP·라이브러리 전략.",
         21),
        ("mpw-or-pilot-tape-out", .designFab,
         "MPW·테이프아웃",
         "MPW (90-95% 비용 절감) or 풀마스크 (28nm: $1M+ / 7nm: $10M+).",
         90),
        ("packaging-and-test", .massProduction,
         "패키징·테스트",
         "OSAT 파트너 선정, 테스트 계획, 첫 샘플 검증.",
         60),
        ("partner-foundation-or-pilot-line", .massProduction,
         "파운드리 파트너십·양산",
         "TSMC/삼성/UMC 파운드리 파트너십, 양산 계획, 스케일업 예산.",
         90),
    ]

    // MARK: - Public Factory

    public static func stages(for cluster: BusinessCluster) -> [RoadmapStage] {
        let raw: [(String, StagePhase, String, String, Int?)]
        switch cluster {
        case .offlineFood:
            raw = sharedPrefix + offlineTail
        case .onlineDigital:
            raw = sharedPrefix + onlineTail
        case .startupTech:
            raw = sharedPrefix + techFoundation + techGrowthTail
        case .hardwareIoT:
            raw = sharedPrefix + techFoundation + hardwareTail + techGrowthTail
        case .roboticsPhysicalAI, .biotechMedtech:
            raw = sharedPrefix + techFoundation + labTail + techGrowthTail
        case .semiconductor, .climateEnergy:
            raw = sharedPrefix + techFoundation + semiTail + techGrowthTail
        }

        let currentIndex = raw.count - 1
        return raw.enumerated().map { idx, entry in
            let status: StageStatus
            if idx < currentIndex       { status = .completed }
            else if idx == currentIndex { status = .current }
            else                        { status = .upcoming }
            return RoadmapStage(
                stageId: entry.0,
                stepNumber: idx + 1,
                phase: entry.1,
                titleKo: entry.2,
                descriptionKo: entry.3,
                estimatedDays: entry.4,
                status: status
            )
        }
    }

    // 기본값 (외식)
    public static let stages: [RoadmapStage] = stages(for: .offlineFood)

    public static func progressSummary(for cluster: BusinessCluster) -> (completed: Int, total: Int) {
        let s = stages(for: cluster)
        return (completed: s.filter { $0.status == .completed }.count, total: s.count)
    }

    public static let progressSummary: (completed: Int, total: Int) = progressSummary(for: .offlineFood)
}
