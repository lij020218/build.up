//
//  OwnerActionsRegistry.swift — "사장님만 할 수 있는 일" 분업 명세 (iOS 미러)
//
//  ⚠️ SSOT = packages/shared/src/roadmap/owner-actions.ts — 문구·규칙 1:1.
//     한쪽 수정 시 반드시 양쪽 동시 + apps/web/__tests__/owner-actions.test.ts 의
//     iOS 패리티 가드 갱신. (사용자 스펙 원문: "AI가 어려운 건 해결해주고
//     내가 해야 할 부분만 남겨주면 좋겠다" — 2026-08-03)
//
//  원칙 (웹과 동일):
//   · 결정론 — LLM 산출물 아님. 같은 입력 → 같은 목록.
//   · 사장님 몫 = 물리적 실행(방문·서명·결제)·법적 본인 행위만.
//   · 완료 상태는 로드맵 단계가 소유 — 이 목록은 요약 뷰.
//

import Foundation

public enum BUOwnerActionTrack: String, Sendable {
    case offline, online, startup
}

public struct BUOwnerAction: Identifiable, Sendable {
    public let id: String
    public let title: String
    public let whyYou: String
    public let aiPrepared: String
    public let stageId: String
    public let estimate: String?
    public let cost: String?
}

public struct BUOwnerPermitInput: Sendable {
    public let name: String
    public let kind: String
    public let whereTo: String
    public let cost: String
    public let duration: String
    public let required: Bool

    public init(name: String, kind: String, whereTo: String, cost: String, duration: String, required: Bool) {
        self.name = name; self.kind = kind; self.whereTo = whereTo
        self.cost = cost; self.duration = duration; self.required = required
    }
}

public enum BUOwnerActions {

    /// industryCategoryId → 트랙 (웹 ownerActionTrackFor 미러)
    public static func track(for industryCategoryId: String) -> BUOwnerActionTrack {
        if industryCategoryId == "startup-tech" { return .startup }
        if industryCategoryId == "online-digital" { return .online }
        return .offline
    }

    /// moneyInfra.recommendedBank id → 표시명 (웹 bankLabel 미러)
    public static func bankLabel(_ id: String?) -> String? {
        guard let id else { return nil }
        let map: [String: String] = [
            "ibk": "IBK기업은행", "kakaobank": "카카오뱅크", "woori": "우리은행", "shinhan": "신한은행",
            "kb": "KB국민은행", "hana": "하나은행", "nh": "NH농협", "kbank": "케이뱅크", "toss": "토스뱅크",
        ]
        return map[id]
    }

    private static func permitStageId(_ permitName: String) -> String {
        if permitName.contains("사업자등록") || permitName.contains("사업자 등록") { return "registration-setup" }
        if permitName.contains("통신판매업") { return "online-registration" }
        return "permit-check"
    }

    // 웹 buildOwnerActions 미러 — 목록·순서·문구 동일
    public static func build(
        track: BUOwnerActionTrack,
        startupType: String?,
        permits: [BUOwnerPermitInput],
        recommendedBankLabel: String?,
        taxTypeLabel: String?
    ) -> [BUOwnerAction] {
        var actions: [BUOwnerAction] = []
        let isFranchise = startupType == "franchise"

        if track == .offline {
            actions.append(BUOwnerAction(
                id: "visit-candidates",
                title: "후보 자리 2~3곳을 직접 가서 보기",
                whyYou: "낮과 밤, 평일과 주말의 그 거리는 직접 서 봐야 압니다.",
                aiPrepared: "방문 시 확인할 체크리스트와 후보지 비교표를 입지 단계에 준비해뒀어요.",
                stageId: "location-candidates",
                estimate: "반나절 × 2~3회", cost: nil))
            actions.append(BUOwnerAction(
                id: "sign-lease",
                title: "임대차 계약서에 서명하기",
                whyYou: "계약 당사자는 사장님입니다. 서명 전 확인이 마지막 방어선이에요.",
                aiPrepared: "계약서 사진을 올리면 AI가 독소조항을 먼저 읽어드립니다. 확정일자(세무서) 안내 포함.",
                stageId: "contract-review",
                estimate: "1일", cost: nil))
            if isFranchise {
                actions.append(BUOwnerAction(
                    id: "franchise-contract",
                    title: "가맹 상담 후 정보공개서 숙려기간 지키고 계약하기",
                    whyYou: "가맹 계약도 본인 서명입니다. 14일 숙려기간은 법이 사장님께 준 시간이에요.",
                    aiPrepared: "브랜드별 공정위 등록 정보(가맹점 수·평균 매출)와 가맹문의 공식 링크를 정리해뒀어요.",
                    stageId: "franchise-application",
                    estimate: "2~3주 (숙려기간 포함)", cost: nil))
            }
        }

        for p in permits where p.required {
            let prepared: String
            if p.name.contains("사업자등록") || p.name.contains("사업자 등록") {
                prepared = "업종코드와 과세 유형 추천까지 채워뒀어요. 홈택스에서 그대로 입력하면 됩니다."
            } else if p.kind == "교육" {
                prepared = "교육 신청처와 준비물을 단계에 정리해뒀어요. 온라인 수료 가능 여부도 표시돼 있어요."
            } else {
                prepared = "필요 서류와 순서를 단계에 정리해뒀어요. 순서가 틀리면 반려되는 항목은 순서까지 잠궈뒀습니다."
            }
            actions.append(BUOwnerAction(
                id: "permit-\(p.name)",
                title: "\(p.name) \(p.kind == "허가" ? "받기" : "하기") — \(p.whereTo)",
                whyYou: "본인(또는 대표자) 신청이 원칙인 행정 절차입니다.",
                aiPrepared: prepared,
                stageId: permitStageId(p.name),
                estimate: p.duration.isEmpty ? nil : p.duration,
                cost: p.cost.isEmpty ? nil : p.cost))
        }

        let bankSuffix = recommendedBankLabel.map { " (추천: \($0))" } ?? ""
        actions.append(BUOwnerAction(
            id: "open-bank",
            title: "사업용 통장 만들기\(bankSuffix)",
            whyYou: "계좌 개설은 본인 확인이 필요해 사장님만 할 수 있어요.",
            aiPrepared: "어느 은행이 유리한지, 사업용 카드·홈택스 연동까지 순서를 정리해뒀어요.",
            stageId: track == .startup ? "company-setup" : "registration-setup",
            estimate: "30분 (모바일 개설 기준)", cost: nil))

        if track == .offline {
            actions.append(BUOwnerAction(
                id: "confirm-construction",
                title: "시공 업체 견적 비교하고 계약하기",
                whyYou: "견적 협상과 계약은 돈 주인의 일입니다. AI는 바가지 신호를 알려드릴 수 있을 뿐이에요.",
                aiPrepared: "업종에 맞는 검증 시공 체크리스트와 견적서에서 확인할 항목을 준비해뒀어요.",
                stageId: "construction-setup",
                estimate: "1~2주", cost: nil))
        }

        if track == .online {
            actions.append(BUOwnerAction(
                id: "open-store-account",
                title: "판매 채널 계정 만들고 본인 인증하기",
                whyYou: "스마트스토어·마켓 입점의 본인 인증과 정산 계좌 등록은 대표자 몫이에요.",
                aiPrepared: "채널별 입점 순서와 수수료 비교를 준비해뒀어요.",
                stageId: "platform-setup",
                estimate: "1~2시간", cost: nil))
        }

        if track == .startup {
            let taxSuffix = taxTypeLabel.map { "(추천: \($0))" } ?? ""
            actions.append(BUOwnerAction(
                id: "incorporate",
                title: "법인 설립(또는 개인사업자) 등기·등록 마치기",
                whyYou: "설립 등기는 발기인 본인 절차입니다. 온라인(법인설립시스템)으로 가능해요.",
                aiPrepared: "과세 유형\(taxSuffix)·업종코드·설립 순서를 정리해뒀어요.",
                stageId: "company-setup",
                estimate: "3~7일", cost: nil))
        }

        return actions
    }

    // 웹 buildAiDoneList 미러 — 실제로 있는 것만 (없는 걸 했다고 말하면 위조)
    public static func aiDoneList(
        hasIndustryMatch: Bool,
        budgetAllocated: Bool,
        permitCount: Int,
        supplierCount: Int,
        channelCount: Int,
        hasTaxType: Bool,
        hasInsurance: Bool,
        hasMenuOrProducts: Bool
    ) -> [String] {
        var done: [String] = []
        if hasIndustryMatch { done.append("업종 분류와 그에 맞는 로드맵 구성") }
        if budgetAllocated { done.append("예산 배분(보증금·인테리어·설비·운전자금)") }
        if permitCount > 0 { done.append("필수 인허가 \(permitCount)건의 순서·장소·비용 정리") }
        if hasTaxType { done.append("과세 유형 추천과 업종코드 준비") }
        if supplierCount > 0 { done.append("공급업체·시공 후보 \(supplierCount)곳 선별 (검증 풀 기반)") }
        if channelCount > 0 { done.append("운영 채널 \(channelCount)개 우선순위 결정") }
        if hasInsurance { done.append("필요 보험 목록과 대략 보험료") }
        if hasMenuOrProducts { done.append("첫 메뉴/상품 구성 초안") }
        return done
    }
}
