//
//  RoadmapStage.swift — 로드맵 단계 데이터 모델 (웹 SSOT 미러)
//
//  ⚠️ 웹 SSOT: packages/shared/src/starter-data.ts
//   웹은 stageId(string) 기반 path-aware roadmap.
//   46 stage 는 모든 cluster(외식·카페·SaaS·하드웨어 등) 의 합집합.
//   사장님이 실제로 보는 단계 수는 cluster 별로 다름 (workflow.ts:318):
//     • offline (외식·카페·미용 등): 15 단계
//     • online (스마트스토어 등):    12 단계
//     • startup-tech (SaaS 등):      14 단계
//     • semiconductor:               22 단계
//
//  iOS 현재 구현: 사장님(사랑의 도시락 — 외식) 기준 17-stage path 를 기본 데이터로.
//  추후 cluster 자동 매핑 + Supabase roadmap 테이블 연동 예정.
//
//  2026-05-14 신규 stage 2개 (사장님 신고 "타깃 고객·메뉴 결정 누락"):
//    · target-customer-definition (Phase 1, shared) — 타깃 페르소나 명시
//    · menu-design (Phase 3, offline) — 메뉴 라인업 + 재고 카드 자동 연동
//

import Foundation

public enum StageStatus: String, Sendable, Codable {
    case completed   // 완료
    case current     // 진행 중
    case upcoming    // 예정
}

/// 외식 path 단계 그룹 (4 phase — 웹 cluster 시퀀스에 맞춤).
public enum StagePhase: String, Sendable, CaseIterable, Codable {
    case preparation  = "준비 (업종·예산 결정)"
    case registration = "사업 등록 (인허가·계약)"
    case setup        = "오픈 준비 (인테리어·인력)"
    case launch       = "오픈 (운영 시작)"

    public var labelKo: String {
        switch self {
        case .preparation:  return "준비"
        case .registration: return "사업 등록"
        case .setup:        return "오픈 준비"
        case .launch:       return "오픈"
        }
    }

    public var subtitleKo: String {
        // rawValue 의 괄호 안 부분만 뽑기
        rawValue
            .replacingOccurrences(of: "[^(]+ \\(", with: "", options: .regularExpression)
            .replacingOccurrences(of: ")", with: "")
    }
}

public struct RoadmapStage: Identifiable, Sendable, Hashable {
    /// 웹 stageId — Supabase roadmap.stages[].stageId 와 1:1 매칭.
    public let id: String
    /// path 내 순서 (1~15) — UI 표시용. 웹의 totalSteps 와 일치.
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

    /// 웹과의 호환 — stageId 별칭.
    public var stageId: String { id }
}

// MARK: - 외식 path 15-stage roadmap (웹 SSOT 미러)

public enum RoadmapSampleData {

    /// 외식 path — 웹 `starter-data.ts` 의 offline-food 클러스터 reachable stage 시퀀스.
    /// 한국어 콘텐츠는 웹 `localizeStage()` 의 ko 번역을 모바일 viewport 에 맞게 압축.
    public static let stages: [RoadmapStage] = {
        let raw: [(String, StagePhase, String, String, Int?)] = [
            // ── Phase 1: 준비 (1-5) ── shared 1-5 ──
            ("industry-selection", .preparation,
             "업종 선택",
             "사업 분야를 결정합니다. (외식·카페·미용·온라인 등)",
             1),
            ("startup-type", .preparation,
             "창업 유형 선택",
             "개인사업자 / 법인 / 프랜차이즈 / 무점포 등 형태를 정합니다.",
             2),
            ("business-model", .preparation,
             "운영 방식 선택",
             "홀 위주 / 배달 위주 / 하이브리드 — 비용 구조에 큰 영향.",
             2),
            ("target-customer-definition", .preparation,
             "타깃 고객 정의",
             "주 연령대·라이프스타일·가격 민감도로 페르소나 한 명을 명시. 모든 후속 결정의 기준선.",
             1),
            ("budget-setup", .preparation,
             "예산·시점 설정",
             "총 창업 자본, 운영자금, 오픈 시점을 정합니다.",
             3),

            // ── Phase 2: 사업 등록 (5-9) ── offline-food 5-9 ──
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

            // ── Phase 3: 오픈 준비 (11-15) ── offline-food 12-16 ──
            ("construction-setup", .setup,
             "인테리어·집기 셋업",
             "견적 3곳 비교, 주방 동선·간판·내장재 결정.",
             21),
            ("menu-design", .setup,
             "메뉴 라인업 확정",
             "시그니처 3-5개 + 사이드 2-3개. 원가율 33% 이하 + 재고 카드 자동 연동.",
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

            // ── Phase 4: 오픈 (14-22) ── offline-food 16-17 + shared-tail ──
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

        // 데모: 사장님(사랑의 도시락 운영 6일째) — 모두 완료 + 마지막 stage 가 current
        // 추후 Supabase roadmap.currentStageId 와 동기화.
        let currentIndex = raw.count - 1
        return raw.enumerated().map { idx, entry in
            let status: StageStatus
            if idx < currentIndex      { status = .completed }
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
    }()

    public static let progressSummary: (completed: Int, total: Int) = {
        let stages = Self.stages
        return (
            completed: stages.filter { $0.status == .completed }.count,
            total: stages.count
        )
    }()
}
