//
//  RoadmapStage.swift — 로드맵 단계 데이터 모델
//
//  웹의 46단계 로드맵을 모바일에 이식. 단순화된 데이터 구조.
//

import Foundation

public enum StageStatus: String, Sendable, Codable {
    case completed   // 완료
    case current     // 진행 중
    case upcoming    // 예정
}

public enum StagePhase: String, Sendable, CaseIterable, Codable {
    case preparation  = "준비 (시장조사·아이템 검증)"
    case launch       = "오픈 (개업·인테리어·세팅)"
    case firstMonth   = "첫 달 (운영 안착)"
    case scaling      = "성장 (안정·매출 확보)"
    case mature       = "성숙 (효율·확장)"

    public var labelKo: String {
        switch self {
        case .preparation: return "준비"
        case .launch:      return "오픈"
        case .firstMonth:  return "첫 달"
        case .scaling:     return "성장"
        case .mature:      return "성숙"
        }
    }

    public var subtitleKo: String { rawValue.replacingOccurrences(of: "[^(]+ \\(", with: "", options: .regularExpression).replacingOccurrences(of: ")", with: "") }
}

public struct RoadmapStage: Identifiable, Sendable, Hashable {
    public let id = UUID()
    public let stageNumber: Int   // 1~46
    public let phase: StagePhase
    public let titleKo: String
    public let descriptionKo: String
    public let estimatedDays: Int?
    public let status: StageStatus

    public init(
        stageNumber: Int,
        phase: StagePhase,
        titleKo: String,
        descriptionKo: String,
        estimatedDays: Int? = nil,
        status: StageStatus = .upcoming
    ) {
        self.stageNumber = stageNumber
        self.phase = phase
        self.titleKo = titleKo
        self.descriptionKo = descriptionKo
        self.estimatedDays = estimatedDays
        self.status = status
    }
}

// MARK: - Sample 46-stage roadmap (preview / 데모용)

public enum RoadmapSampleData {

    public static let stages: [RoadmapStage] = {
        let raw: [(Int, StagePhase, String, String, Int?)] = [
            // 준비 단계 (1-10)
            (1,  .preparation, "사업 아이디어 정리",        "왜 이 사업인지 한 문장으로 적어보세요.", 1),
            (2,  .preparation, "타깃 고객 정의",            "주 고객층의 나이·라이프스타일·예산 정의.", 2),
            (3,  .preparation, "경쟁점 5곳 답사",           "반경 500m 내 경쟁점 직접 방문 + 메뉴/가격 비교.", 5),
            (4,  .preparation, "예상 매출·비용 시뮬",       "월 손익 분석으로 BEP 일매출 계산.", 3),
            (5,  .preparation, "상권 분석",                 "유동인구·임차료·경쟁밀도 종합 점검.", 7),
            (6,  .preparation, "사업자등록·통신판매업",     "국세청 홈택스에서 사업자등록 + 카드사 가맹점 신청.", 2),
            (7,  .preparation, "통장·세무사 선정",          "사업용 통장 개설, 세무사 미팅 1-2곳.", 3),
            (8,  .preparation, "정책자금 신청",             "소상공인진흥공단 / 신용보증재단 매칭 신청.", 14),
            (9,  .preparation, "인테리어 견적 3곳",         "VAT 별도 견적 비교, 사례 사진 요청.", 7),
            (10, .preparation, "공급처 협상",               "주요 식자재 2-3 공급처 견적 + 단가표 확보.", 10),

            // 오픈 단계 (11-20)
            (11, .launch, "POS·키오스크 셋업",              "정산주기·수수료·환불 절차 사전 점검.", 2),
            (12, .launch, "메뉴 최종 결정",                 "Prime cost 65% 이하로 메뉴 단가 설정.", 3),
            (13, .launch, "사진·간판 제작",                 "구글 비즈·네이버 플레이스용 고품질 사진.", 5),
            (14, .launch, "직원 채용·교육",                 "근로계약 + 4대보험 가입 + 매뉴얼 작성.", 14),
            (15, .launch, "프리오픈 (시범 영업)",           "지인 50명 초청, 피드백 수집.", 3),
            (16, .launch, "그랜드 오픈",                    "오픈 이벤트 + SNS 라이브.", 1),
            (17, .launch, "네이버 플레이스 등록",           "정확한 영업시간·메뉴·사진 등록.", 1),
            (18, .launch, "카카오톡 채널 개설",             "단골 알림 채널 + 첫 쿠폰 발행.", 1),
            (19, .launch, "리뷰 요청 시스템",               "테이블 QR 코드 + 직원 안내 멘트.", 2),
            (20, .launch, "오픈 첫 주 회고",                "예상 vs 실제 매출 비교, 메뉴 인기도 점검.", 7),

            // 첫 달 (21-26)
            (21, .firstMonth, "일 매출 매일 기록",          "build.up 앱에 매일 5초 입력.", 1),
            (22, .firstMonth, "월 비용 입력",               "재료비·인건비·임대료·공과금 완료.", 1),
            (23, .firstMonth, "BEP 일매출 도달",            "손익분기점 매출 달성.", 14),
            (24, .firstMonth, "고객 단골화 시작",           "재방문 고객 5명+ 확보.", 14),
            (25, .firstMonth, "첫 광고비 집행",             "네이버 플레이스 광고 또는 인스타.", 7),
            (26, .firstMonth, "첫 달 결산",                 "매출·비용·순익 종합 점검.", 30),

            // 성장 (27-36)
            (27, .scaling, "메뉴 인기도 분석",              "상위 3개·하위 3개 식별, 단가 조정.", 7),
            (28, .scaling, "단골 마케팅 자동화",            "카카오 채널 정기 메시지 + 쿠폰 캠페인.", 14),
            (29, .scaling, "원가 협상",                     "공급처 단가 재협상 또는 대체 공급처.", 14),
            (30, .scaling, "리뷰 100개 달성",               "네이버 + 카카오맵 합산.", 60),
            (31, .scaling, "직원 보너스 정책",              "매출 연동 인센티브 설계.", 7),
            (32, .scaling, "두 번째 직원 채용",             "필요 시점 진단 + 4대보험 부담 계산.", 14),
            (33, .scaling, "운영 표준 매뉴얼",              "조리·서빙·청소 SOP 작성.", 14),
            (34, .scaling, "프라임코스트 65% 달성",         "재료비 + 인건비 비율 안정화.", 30),
            (35, .scaling, "런웨이 6개월 확보",             "현금 잔고 = 6개월 burn 이상.", 90),
            (36, .scaling, "월 순익 흑자 3개월 연속",       "안정성 확보.", 90),

            // 성숙 (37-46)
            (37, .mature, "두 번째 매장 검토",              "위치·자금·인력 시뮬레이션.", 30),
            (38, .mature, "재무제표 정리",                  "세무사와 함께 손익계산서 검토.", 14),
            (39, .mature, "정책자금 만기 갱신",             "조건 비교 + 추가 자금 검토.", 14),
            (40, .mature, "직원 복지 제도",                 "퇴직연금·식대·휴가 정비.", 14),
            (41, .mature, "온라인 채널 확장",               "배달 플랫폼 + 자체 주문 시스템.", 30),
            (42, .mature, "메뉴 시즌 리뉴얼",               "분기마다 신메뉴 1-2개.", 90),
            (43, .mature, "고객 데이터 분석",               "CRM 도구 도입 + 연간 단골 분석.", 30),
            (44, .mature, "브랜드 정체성 정립",             "로고·톤·매장 인테리어 일관성.", 60),
            (45, .mature, "프랜차이즈 가능성 검토",         "법무·자금·운영 시스템 점검.", 90),
            (46, .mature, "은퇴/매도 계획",                 "장기 출구 전략.", 365),
        ]

        // 현재 단계: 23 (BEP 도달) 를 current 로, 1-22 완료, 24-46 upcoming 처리
        let currentStage = 23
        return raw.map { entry in
            let status: StageStatus
            if entry.0 < currentStage { status = .completed }
            else if entry.0 == currentStage { status = .current }
            else { status = .upcoming }
            return RoadmapStage(
                stageNumber: entry.0,
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
