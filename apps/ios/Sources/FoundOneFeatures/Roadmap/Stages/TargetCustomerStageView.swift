//
//  TargetCustomerStageView.swift — 타깃 고객 정의 단계 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/TargetCustomerStage.tsx
//  stageId: "target-customer-definition"
//  cluster: offline (외식 path 기본 — 연령대·라이프스타일·가격 민감도)
//
//  3페이지 구조 (웹 탭 → iOS 세그먼트 컨트롤 + 스크롤):
//    pg 0 — Why:    왜 타깃 정의가 모든 후속 결정의 기준선인가
//    pg 1 — Define: 오프라인 페르소나 입력 (연령대 / 라이프스타일 / 가격 민감도)
//    pg 2 — Verify: 반례 검증 체크리스트
//
//  데이터: @AppStorage "stage.tc.*" (추후 DashboardStore.decisions 연동)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - TargetCustomerStageView

public struct TargetCustomerStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @Environment(\.dismiss) private var dismiss
    @State private var page = 0
    private let stageId = "target-customer-definition"

    @AppStorage("stage.tc.primaryAgeRange")  private var primaryAgeRange  = ""
    @AppStorage("stage.tc.lifestyleHint")    private var lifestyleHint    = ""
    @AppStorage("stage.tc.priceSensitivity") private var priceSensitivity = ""
    @AppStorage("stage.tc.whyTarget")        private var whyTarget        = ""
    @AppStorage("roadmap.selectedIndustryId") private var industryId      = ""

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    private var helperText: String {
        switch cluster.category {
        case .onlineDigital:
            return "온라인 폐업 사유 1위는 'CAC > LTV'. 정확한 페르소나가 광고 ROAS·전환·리텐션 모두를 결정합니다."
        case .startupTech:
            return "스타트업 실패 42% = '시장이 원하지 않는 제품'. ICP(Ideal Customer Profile) 한 명 명시가 PMF 의 출발점."
        default:
            return oc.heroSub // offline — 업종군별(외식만 KFRI 28%, 나머지 KOSME 일반)
        }
    }

    // KEY ACTION 히어로 제목 — cluster-aware (웹 heroTitle 미러). detail 은 helperText 재사용.
    //   ⚠️ 2026-07-02: 레지스트리 기본값(외식 28%)이 전 업종 노출되던 것을 override 로 대체.
    private var heroTitle: String {
        switch clusterGroup {
        case .tech:    return "ICP 없이 코드 한 줄도 쓰지 마세요"
        case .online:  return "타깃이 모호하면 광고비만 새어 나갑니다"
        case .offline: return "타깃이 없는 가게는 평균값으로 회귀합니다"
        }
    }

    /// onAdvance/onEditSave 공유 입력 — whyTarget 도 포함 (이전엔 누락).
    private var currentInputs: [String: String] {
        [
            "ageRange": primaryAgeRange,
            "lifestyle": lifestyleHint,
            "priceSensitivity": priceSensitivity,
            "whyTarget": whyTarget,
        ]
    }

    // MARK: - Cluster-aware Define labels/placeholders/chips
    //   웹 SSOT (TargetCustomerStage.tsx:218-305) 와 동일하게 tech/online/offline 별로 분기.

    private enum ClusterGroup { case offline, online, tech }
    private var clusterGroup: ClusterGroup {
        switch cluster.category {
        case .startupTech:   return .tech
        case .onlineDigital: return .online
        default:             return .offline
        }
    }
    // 2026-07-03 정합: offline/online/tech 별 문구 선택 (입지·메뉴·방문 등 오프라인 표현이 online·tech에 새던 것 교정, 웹 pick 미러).
    private func pick<T>(_ off: T, _ on: T, _ tech: T) -> T {
        switch clusterGroup {
        case .offline: return off
        case .online:  return on
        case .tech:    return tech
        }
    }

    // ── offline 업종군 세분 (2026-07-02 업종 정합 수정, 웹 TargetCustomerStage 미러) ──
    //   offline 전체가 외식(통계·객단가·예시)으로 하드코딩되던 문제 → 업종군 분기.
    //   통계 가짜 금지: 외식만 KFRI 실통계, 나머지는 KOSME 일반 SMB(실존).
    private struct OfflineTC {
        let heroSub: String
        let example: String
        let smbFact0: (tag: String, text: String)
        let tiers: [(label: String, value: String)]
        let neverBuy: String
        let agePlaceholder: String
        let lifestylePlaceholder: String
    }
    private var offlineKind: String {
        switch cluster.category {
        case .food, .cafeDessert: return "food"
        case .retail:             return "retail"
        case .beauty:             return "beauty"
        case .fitness:            return "fitness"
        case .pet:                return "pet"
        case .education, .space:  return "space"
        default:                  return "service"
        }
    }
    private var oc: OfflineTC {
        let genericFact: (String, String) = ("폐업 핵심 사유", "\"타깃 불명확 + 차별화 실패\" — 업종 불문 소상공인 폐업의 최상위 원인 (KOSME 소상공인 실태조사)")
        switch offlineKind {
        case "food":
            return OfflineTC(
                heroSub: "외식업 폐업 사유 1위(28%)는 '타깃 불명확 + 차별화 실패' — 한국외식산업연구원 2024. 페르소나 정의한 사장님 폐업률은 정의 안 한 사장님의 절반.",
                example: "예: 20대 1인 직장인 타깃 → 도심·테이크아웃·1만원 객단가 → 평수 작아도 OK. 4인 가족이면 → 주차장·4인석·2-3만원 → 큰 평수 필수. 같은 외식업이라도 타깃이 모든 선택을 갈라놓습니다.",
                smbFact0: ("외식 폐업 사유", "1위 \"타깃 불명확 + 차별화 실패\" 28% — 한국외식산업연구원 2024"),
                tiers: [("가성비 5천~1만원", "value-budget"), ("중간 1만~2만원", "mid-quality"), ("프리미엄 2만~4만원", "premium"), ("럭셔리 4만원↑", "luxury")],
                neverBuy: "범위 명시 (예: 20대 직장인 → 점심 3만원↑ X)",
                agePlaceholder: "예: 28-38세 (월급쟁이 직장인 + 자녀 없는 부부)",
                lifestylePlaceholder: "예: 평일 출근 점심 12-13시 (8분 도보권 내) / 주말 브런치 (SNS 업로드)")
        case "retail":
            return OfflineTC(
                heroSub: "타깃을 좁히지 않은 매장은 상품 구성·가격·입지가 평균값으로 회귀합니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).",
                example: "예: 실속형 1인 가구 타깃 → 소용량·가성비 SKU·온라인 최저가 접점. 프리미엄 선물 수요 → 고가 큐레이션·포장·매장 경험. 같은 소매라도 타깃이 상품 구성·입지를 완전히 가릅니다.",
                smbFact0: genericFact,
                tiers: [("가성비 1만원↓", "value-budget"), ("실속 1만~3만원", "mid-quality"), ("프리미엄 3만~7만원", "premium"), ("럭셔리 7만원↑", "luxury")],
                neverBuy: "범위 명시 (예: 실속형 고객 → 단일 상품 5만원↑ X)",
                agePlaceholder: "예: 30-45세 (가성비·실속 중시 주부·직장인)",
                lifestylePlaceholder: "예: 퇴근길·주말 오프라인 구경 / 필요 시 온라인 최저가 비교 후 구매")
        case "beauty":
            return OfflineTC(
                heroSub: "타깃이 모호한 미용실은 시술 구성·가격·인테리어가 경쟁점과 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).",
                example: "예: 20대 학생 타깃 → 가성비 커트·트렌디 스타일·SNS 예약. 3040 직장인 타깃 → 프리미엄 클리닉·두피케어·재방문 관리. 같은 미용실이라도 타깃이 시술 구성·가격을 완전히 가릅니다.",
                smbFact0: genericFact,
                tiers: [("가성비 1만~3만원", "value-budget"), ("중간 3만~7만원", "mid-quality"), ("프리미엄 7만~15만원", "premium"), ("럭셔리 15만원↑", "luxury")],
                neverBuy: "범위 명시 (예: 학생 타깃 → 10만원↑ 시술 X)",
                agePlaceholder: "예: 20-35세 (스타일·트렌드 민감, 재방문 주기 4~6주)",
                lifestylePlaceholder: "예: 4~6주 주기 재방문 / 시술 전후 SNS 후기 확인·업로드")
        case "fitness":
            return OfflineTC(
                heroSub: "타깃이 모호한 헬스장은 프로그램·가격·시설이 옆 센터와 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).",
                example: "예: 다이어트 입문자 타깃 → 그룹 GX·저가 월 회원권·초보 코칭. 퍼포먼스 지향 타깃 → 1:1 PT·고가 패키지·기능성 장비. 같은 헬스장이라도 타깃이 프로그램·가격을 완전히 가릅니다.",
                smbFact0: genericFact,
                tiers: [("가성비 월 3만~7만원", "value-budget"), ("중간 월 7만~13만원", "mid-quality"), ("프리미엄 13만~25만원", "premium"), ("럭셔리 25만원↑(PT)", "luxury")],
                neverBuy: "범위 명시 (예: 입문자 → 월 20만원↑ 프로그램 X)",
                agePlaceholder: "예: 25-40세 (건강·체형 관리 직장인)",
                lifestylePlaceholder: "예: 평일 저녁·주말 오전 운동 / 인바디·기록 앱으로 동기 관리")
        case "pet":
            return OfflineTC(
                heroSub: "타깃이 모호한 펫샵은 서비스 구성·가격이 경쟁점과 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).",
                example: "예: 소형견 1인 가구 타깃 → 미용·데이케어·소용량 사료. 대형견·다견 가정 타깃 → 호텔·훈련·용품 정기배송. 같은 펫샵이라도 타깃이 서비스 구성을 완전히 가릅니다.",
                smbFact0: genericFact,
                tiers: [("가성비 1만~3만원", "value-budget"), ("중간 3만~7만원", "mid-quality"), ("프리미엄 7만~15만원", "premium"), ("럭셔리 15만원↑", "luxury")],
                neverBuy: "범위 명시 (예: 소형견 보호자 → 15만원↑ 스파 패키지 X)",
                agePlaceholder: "예: 25-45세 (반려견 1~2마리, 도심 거주)",
                lifestylePlaceholder: "예: 주중 산책·주말 미용/병원 / 반려 커뮤니티·앱으로 정보 탐색")
        case "space":
            return OfflineTC(
                heroSub: "타깃이 모호한 무인·공간업은 좌석·요금제·운영시간이 옆 매장과 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).",
                example: "예: 시험 준비 학생 타깃 → 장시간 좌석·정기권·조용한 존. 직장인 스터디모임 타깃 → 룸 단위·야간 이용·예약제. 같은 공간업이라도 타깃이 좌석 구성·요금제를 완전히 가릅니다.",
                smbFact0: genericFact,
                tiers: [("가성비 시간 1천~3천원", "value-budget"), ("중간 시간 3천~6천원", "mid-quality"), ("프리미엄 일 1만~2만원", "premium"), ("럭셔리 2만원↑", "luxury")],
                neverBuy: "범위 명시 (예: 학생 타깃 → 시간당 5천원↑ X)",
                agePlaceholder: "예: 10대~20대 (수험생·대학생) 또는 인근 직장인",
                lifestylePlaceholder: "예: 시험기간 장시간 체류 / 정기권·앱 예약 선호")
        default:
            return OfflineTC(
                heroSub: "타깃이 모호한 서비스업은 상품 구성·가격이 경쟁점과 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).",
                example: "예: 1인 가구 타깃 → 소규모·단건 서비스·즉시 예약. 가족 단위 타깃 → 정기·패키지 계약·방문 서비스. 같은 서비스업이라도 타깃이 상품 구성·가격을 완전히 가릅니다.",
                smbFact0: genericFact,
                tiers: [("가성비 1만~3만원", "value-budget"), ("중간 3만~7만원", "mid-quality"), ("프리미엄 7만~15만원", "premium"), ("럭셔리 15만원↑", "luxury")],
                neverBuy: "범위 명시 (예: 1인 가구 → 회당 10만원↑ X)",
                agePlaceholder: "예: 30-50세 (맞벌이·1인 가구)",
                lifestylePlaceholder: "예: 필요 발생 시 검색·비교 후 예약 / 후기·평점 중시")
        }
    }

    private var ageRangeLabel: String {
        switch clusterGroup {
        case .tech:    return "1. 타깃 산업·기업 규모 *"
        case .online:  return "1. 주 사용자 (연령 + 유입 채널) *"
        case .offline: return "1. 주 연령대 *"
        }
    }
    private var ageRangePlaceholder: String {
        switch clusterGroup {
        case .tech:    return "예: 50-200인 B2B SaaS / 핀테크 스타트업 (시리즈 A-B)"
        case .online:  return "예: 25-35세 여성 + 인스타·유튜브 유입 + 모바일 80%"
        case .offline: return oc.agePlaceholder
        }
    }

    private var lifestyleLabel: String {
        switch clusterGroup {
        case .tech:    return "2. 핵심 사용자 역할 + 일상 워크플로 *"
        case .online:  return "2. 구매 동선 + 사용 맥락 *"
        case .offline: return "2. 라이프스타일 + 일상 동선 *"
        }
    }
    private var lifestylePlaceholder: String {
        switch clusterGroup {
        case .tech:    return "예: 운영팀 PM — Slack/Notion 풀데이 사용, 매주 화요일 회고에서 우리 도구 데이터 확인"
        case .online:  return "예: 인스타 광고 → 상세페이지 → 장바구니 7일 → 가족 추천 후 결제. 모바일 80%, 야간 21-23시 피크."
        case .offline: return oc.lifestylePlaceholder
        }
    }

    private var priceLabel: String {
        switch clusterGroup {
        case .tech:             return "3. 예산 권한 + 가격 한도 *"
        case .online, .offline: return "3. 객단가 기대치 + 가격 민감도 *"
        }
    }
    private var priceChips: [(label: String, value: String)] {
        switch clusterGroup {
        case .tech: return [
            ("셀프서비스 월 5만원↓", "self-serve-low"),
            ("팀 월 5~30만원",      "team-mid"),
            ("연 30만원↑",         "annual-contract"),
            ("기업 (PO)",          "enterprise"),
        ]
        case .online: return [
            ("가성비 5천~1만원",   "value-budget"),
            ("중간 1만~2만원",     "mid-quality"),
            ("프리미엄 2만~4만원", "premium"),
            ("럭셔리 4만원↑",      "luxury"),
        ]
        case .offline: return oc.tiers
        }
    }

    /// online 안에서도 디지털 콘텐츠(무배송) 서브타입 — 상권·주문 대신 키워드·검색 수요가 근거. (웹 isDigitalFulfillment 미러)
    private var isDigitalContent: Bool {
        if case .online = clusterGroup { return isDigitalFulfillment(industryId) }
        return false
    }
    private var whyTargetPlaceholder: String {
        if isDigitalContent {
            return "예: 키워드 검색량 분석에서 직장인 실무 템플릿 니즈 급증 / 기존 상품은 이론 중심 → 실무 양식 미공급"
        }
        switch clusterGroup {
        case .tech:    return "예: 50-200인 SaaS 팀이 우리 ICP. PMF 인터뷰 12건 중 9건이 같은 페인."
        case .online:  return "예: 인스타 광고 ROAS 280% 채널이 이 페르소나. 첫 100 주문 60%가 동일 세그먼트."
        case .offline: return "예: 상권 분석에서 28-38세 직장인 비중 42% / 경쟁점은 모두 가족 타깃"
        }
    }

    private var filledCount: Int {
        [primaryAgeRange, lifestyleHint, priceSensitivity]
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
            .count
    }

    /// 게이트: 페르소나 3 항목 모두 입력.
    private var canContinue: Bool { filledCount == 3 }

    private var advanceHint: String {
        switch filledCount {
        case 0: return "페르소나 3항목을 정의하세요"
        case 1, 2: return "\(filledCount)/3 입력됨 — 모두 입력 후 진행"
        default: return "페르소나 정의 완료 — 다음 단계로"
        }
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "타깃 고객 정의",
            stageEyebrow: "단계 4 · 타깃 고객",
            helperText: nil, // 히어로(keyActionOverride.detail)로 이동 — 중복 방지
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs)
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: pick("1. 주 연령대·산업 명시", "1. 주 연령대·산업 명시", "1. 타깃 산업·기업 규모"), detail: "한 명에게 팔린다는 의지로 좁혔는지 확인"),
                    .init(label: pick("2. 라이프스타일·일상 동선", "2. 라이프스타일·구매 동기", "2. 핵심 역할·업무 워크플로우"), detail: pick("언제·어디서·왜 쓰는지 구체화", "언제·왜 구매하는지 구체화", "어떤 업무에서·왜 도입하는지 구체화")),
                    .init(label: pick("3. 객단가·예산 한도", "3. 객단가·예산 한도", "3. 도입 예산·지불 의사"), detail: pick("안 살 가격대까지 명확", "안 살 가격대까지 명확", "안 낼 가격대까지 명확")),
                    .init(label: "4. 반례 검증", detail: "이 페르소나가 절대 안 할 행동 4개"),
                ],
                verifyItems: [
                    "'20-50대 여성' 같은 모호한 정의 X — 한 명의 구체 페르소나로 좁혔는가",
                    pick("이 페르소나가 절대 안 갈 위치·안 살 가격대 명시했는가", "이 페르소나가 절대 이탈할 채널·안 살 가격대 명시했는가", "이 페르소나가 절대 도입 안 할 조건·안 낼 가격대 명시했는가"),
                    pick("경쟁점 중 같은 페르소나 타깃 가게 1곳 이상 있는가 (없으면 시장 위험)", "경쟁 스토어 중 같은 페르소나 타깃 브랜드 1곳 이상 있는가 (없으면 시장 위험)", "같은 페르소나 타깃 경쟁 제품 1곳 이상 있는가 (없으면 시장 위험)"),
                    pick("후속 결정 (입지·메뉴·가격·광고) 의 기준선이 될 수 있을 만큼 구체적인가", "후속 결정 (소싱 상품·상세페이지·가격·광고) 의 기준선이 될 수 있을 만큼 구체적인가", "후속 결정 (제품·가격·온보딩·채널) 의 기준선이 될 수 있을 만큼 구체적인가"),
                    "주변 지인 의견이 아닌 실제 잠재 고객 5명+ 대화로 검증했는가",
                ],
                nextStageLabel: "예산·시점 설정",
                nextSummary: "타깃 페르소나 확정 → 예산·시점 설정 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
            totalPages: 3,
            keyActionOverride: BUStageKeyAction(title: heroTitle, detail: helperText)
        ) {
            VStack(alignment: .leading, spacing: 16) {
                pageNav
                pageContent
                    .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }
}

// MARK: - Page nav

private extension TargetCustomerStageView {

    var pageNav: some View {
        BUWizardPageNav(
            page: page,
            totalPages: 3,
            labels: ["왜 중요한가", "페르소나 정의", "검증"],
            onChange: { newPage in
                withAnimation(.easeInOut(duration: 0.22)) { page = newPage }
            }
        )
    }

    @ViewBuilder
    var pageContent: some View {
        if page == 0 {
            whyPage
        } else if page == 1 {
            definePage
        } else {
            verifyPage
        }
    }
}

// MARK: - pg 0: Why

private extension TargetCustomerStageView {

    var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
            // 메인 메시지 카드
            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(BUColor.midnight)
                        Text("왜 이게 예산·시점 설정 전인가")
                            .font(.system(size: 11, weight: .heavy))
                            .tracking(0.6)
                            .textCase(.uppercase)
                            .foregroundStyle(BUColor.midnight)
                    }

                    Text("타깃 페르소나가 없으면 모든 후속 결정 — \(pick("입지·메뉴·가격대·광고 채널", "소싱 상품·상세페이지·가격·광고 채널", "제품·가격·온보딩·채널")) — 이 평균값(=경쟁점과 동일)으로 회귀합니다.")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 2)

                    Text(clusterGroup == .offline
                         ? oc.example
                         : "예: SaaS 마케팅 매니저를 타깃하면 → 광고 대시보드·리포트 자동화 중심 → 셀프서비스 온보딩. 대기업 구매 담당이면 → 보안·SLA·PO 결제 → 세일즈 주도 온보딩. 같은 제품이라도 타깃이 온보딩·가격을 완전히 가릅니다.")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            // 한국 SMB 데이터 박스
            VStack(alignment: .leading, spacing: 10) {
                Text(clusterGroup == .tech ? "스타트업 실패 데이터" : "한국 SMB 데이터")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.6)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.inkMuted.opacity(0.55))

                VStack(alignment: .leading, spacing: 9) {
                    // 외식만 KFRI 실통계 노출. online·tech는 신뢰할 단일 출처 통계가 없어 지어내지 않고 생략.
                    // 아래 KOSME·메타는 업종 불문 실통계라 그대로 유지. (2026-07-03)
                    if clusterGroup == .offline {
                        DataPointRow(tag: oc.smbFact0.tag, text: oc.smbFact0.text)
                    }
                    if clusterGroup == .tech {
                        DataPointRow(tag: "PMF 실패", text: "시장이 원하지 않는 제품(타깃·수요 불명확)이 스타트업 실패 1위 요인 — 42% (CB Insights)")
                    } else {
                        DataPointRow(tag: "페르소나 효과", text: "정의한 사장님 폐업률 11% vs 미정의 22% — KOSME 2023")
                    }
                    DataPointRow(tag: "광고 ROAS",    text: "타깃 좁힌 캠페인 ROAS 3.2배 — 메타 광고 효율 보고서 2024")
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                Color(red: 0.95, green: 0.96, blue: 0.98),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(BUColor.inkMuted.opacity(0.10), lineWidth: 1)
            )
        }
    }
}

// MARK: - pg 1: Define

private extension TargetCustomerStageView {

    /// AI 위저드 프리필 (decision inputs.targetCustomer) — 웹 TargetCustomerStage 참고 카드 미러.
    ///  한 문장을 4필드로 쪼개 넣는 건 위조라, 원문을 보여주고 사장님이 채운다 (2026-08-03 UX U1).
    var aiSuggestedTarget: String? {
        let v = roadmapStore.decisions["target-customer-definition"]?.inputs["targetCustomer"]
        return (v?.isEmpty == false) ? v : nil
    }

    var definePage: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                if let suggested = aiSuggestedTarget {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("AI 추천 타깃 (참고)")
                            .font(.system(size: 10.5, weight: .heavy))
                            .tracking(0.7)
                            .foregroundStyle(BUColor.midnight)
                        Text("\u{201C}\(suggested)\u{201D}")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)
                            .lineSpacing(2)
                        Text("이 추천을 참고해 아래 항목을 사장님 언어로 채워주세요 — 여기서 정한 사람이 입지·메뉴·마케팅의 기준이 됩니다.")
                            .font(BUFont.bodyCaption)
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(2)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1))
                }
                HStack(spacing: BUSpacing.xs) {
                    Circle()
                        .fill(BUColor.midnight)
                        .frame(width: 24, height: 24)
                        .overlay(
                            Text("1")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white)
                        )
                    Text("타깃 페르소나 한 명을 명시")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .tracking(-0.3)
                }

                inputField(label: ageRangeLabel) {
                    TextField(ageRangePlaceholder, text: $primaryAgeRange, axis: .vertical)
                        .lineLimit(1...3)
                        .buTextFieldStyle()
                }

                inputField(label: lifestyleLabel) {
                    TextField(lifestylePlaceholder, text: $lifestyleHint, axis: .vertical)
                        .lineLimit(2...5)
                        .buTextFieldStyle()
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text(priceLabel)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                        .tracking(0.3)

                    LazyVGrid(
                        columns: [GridItem(.flexible()), GridItem(.flexible())],
                        spacing: 8
                    ) {
                        ForEach(priceChips, id: \.value) { chip in
                            PriceChip(label: chip.label, value: chip.value, selected: $priceSensitivity)
                        }
                    }
                }

                inputField(label: "4. 왜 이 타깃인가 (선택)", isOptional: true) {
                    TextField(whyTargetPlaceholder, text: $whyTarget, axis: .vertical)
                        .lineLimit(2...4)
                        .buTextFieldStyle()
                }

                HStack(spacing: BUSpacing.xs) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(BUColor.midnight.opacity(0.55))
                    Text("필수 3개 중 \(filledCount) 완료")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                }
                .padding(.horizontal, BUSpacing.sm)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    BUColor.midnight.opacity(0.04),
                    in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                )
            }
        }
    }

    @ViewBuilder
    func inputField<Content: View>(
        label: String,
        isOptional: Bool = false,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(isOptional ? BUColor.inkMuted : BUColor.midnight)
                .tracking(0.3)
            content()
        }
    }
}

// MARK: - pg 2: Verify

private extension TargetCustomerStageView {

    var verifyPage: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack(spacing: BUSpacing.xs) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.midnight)
                    Text("반례로 검증하세요")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                }

                Text("좋은 페르소나는 '누구를 안 받을 것인가' 가 명확합니다. 아래 4개 질문에 모두 답할 수 있어야 페르소나가 의사결정 기준선이 됩니다.")
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)

                VStack(spacing: 8) {
                    VerifyCard(
                        number: 1,
                        question: "이 페르소나가 절대 안 살 가격대는?",
                        hint: clusterGroup == .offline ? oc.neverBuy : "범위 명시 (예: 20대 직장인 → 3만원↑ X)"
                    )
                    VerifyCard(
                        number: 2,
                        question: pick("이 페르소나가 절대 안 갈 위치는?", "이 페르소나가 절대 구매 안 할 채널·환경은?", "이 페르소나가 절대 도입 안 할 조건은?"),
                        hint: pick("구체 (예: 차량 접근만 가능한 외곽)", "예: UI 복잡한 해외 직구몰, 배송 3일+ 사이트", "예: 지불 의사 없는 세그먼트, 규제·인증이 막는 시장")
                    )
                    VerifyCard(
                        number: 3,
                        question: pick("이 페르소나가 정말 매주 1회+ 올까?", "이 페르소나가 정말 월·분기 1회+ 재구매할까?", "이 페르소나가 정말 유료 전환·지속 사용할까?"),
                        hint: pick("오면 안 되는 이유 1개라도 떠오르면 재정의", "재구매 이유 1개도 안 떠오르면 재정의", "계속 쓸 이유 1개도 안 떠오르면 재정의")
                    )
                    VerifyCard(
                        number: 4,
                        question: pick("경쟁점 중 같은 타깃 가게는?", "경쟁 스토어 중 같은 타깃 브랜드는?", "같은 타깃의 경쟁 제품은?"),
                        hint: pick("이름·차별점 — 안 보이면 시장 없음 신호", "스토어명·차별점 — 없으면 시장 없음 신호", "제품명·차별점 — 없으면 시장 없음 신호")
                    )
                }
            }
        }
    }
}

// MARK: - Wrapup

private extension TargetCustomerStageView {

    var wrapupSection: some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            Text("완료 체크리스트")
                .buEyebrowStyle()

            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    wrapupRow(pick("1. 주 연령대·산업 명시", "1. 주 연령대·산업 명시", "1. 타깃 산업·기업 규모"),    detail: "한 명에게 팔린다는 의지로 좁혔는지 확인")
                    wrapupRow(pick("2. 라이프스타일·일상 동선", "2. 라이프스타일·구매 동기", "2. 핵심 역할·업무 워크플로우"), detail: pick("언제·어디서·왜 쓰는지 구체화", "언제·왜 구매하는지 구체화", "어떤 업무에서·왜 도입하는지 구체화"))
                    wrapupRow(pick("3. 객단가·예산 한도", "3. 객단가·예산 한도", "3. 도입 예산·지불 의사"),       detail: pick("안 살 가격대까지 명확", "안 살 가격대까지 명확", "안 낼 가격대까지 명확"))
                    wrapupRow("4. 반례 검증",             detail: "이 페르소나가 절대 안 할 행동 4개")
                }
            }

            Text("다음: 예산·시점 설정")
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkMuted)
                .padding(.top, 4)
        }
    }

    @ViewBuilder
    func wrapupRow(_ label: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.xs) {
            Image(systemName: filledCount >= 3 ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 14))
                .foregroundStyle(filledCount >= 3 ? BUColor.success : BUColor.inkMuted)
                .frame(width: 18)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(BUFont.labelSmall)
                    .foregroundStyle(BUColor.ink)
                Text(detail)
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
    }
}

// MARK: - Sub-components

private struct HeroMiniCard: View {
    let icon: String
    let label: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(.white.opacity(0.85))
            Text(label)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.white)
                .tracking(0.5)
                .textCase(.uppercase)
            Text(detail)
                .font(.system(size: 10.5))
                .foregroundStyle(.white.opacity(0.65))
                .lineSpacing(1.5)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
        .background(
            .white.opacity(0.10),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
    }
}

private struct DataPointRow: View {
    let tag: String
    let text: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            // ⚠️ 2026-05-20 alignment fix:
            //   기존엔 HStack(alignment:.top) + tag.padding(.vertical, 2) 조합으로
            //   tag 의 텍스트 baseline 이 body 텍스트 첫 줄보다 2pt 아래에 와서
            //   "들쑥날쑥" 보임. 웹 SSOT 의 marginTop:1px 미러 + firstTextBaseline 으로 정렬.
            Text(tag)
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.2)
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(
                    BUColor.midnight.opacity(0.10),
                    in: RoundedRectangle(cornerRadius: 4, style: .continuous)
                )
                .fixedSize(horizontal: true, vertical: false)
                .alignmentGuide(.firstTextBaseline) { d in d[.bottom] - 3 } // 텍스트 baseline 보정

            Text(text)
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct PriceChip: View {
    let label: String
    let value: String
    @Binding var selected: String

    var body: some View {
        Button { selected = value } label: {
            Text(label)
                .font(.system(size: 12, weight: selected == value ? .bold : .medium))
                .foregroundStyle(selected == value ? BUColor.midnight : BUColor.inkSecondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .padding(.horizontal, 8)
                .background(
                    selected == value ? BUColor.midnight.opacity(0.08) : BUColor.surfaceElevated,
                    in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                        .strokeBorder(
                            selected == value ? BUColor.midnight : BUColor.cardBorder,
                            lineWidth: selected == value ? 1.5 : 1
                        )
                )
        }
        .buttonStyle(.plain)
    }
}

private struct VerifyCard: View {
    let number: Int
    let question: String
    let hint: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("\(number). \(question)")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.ink)
            Text(hint)
                .font(.system(size: 11.5))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, BUSpacing.sm)
        .padding(.vertical, BUSpacing.sm)
        .background(
            BUColor.midnight.opacity(0.03),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.08), lineWidth: 1)
        )
    }
}

// MARK: - View helpers (file-private)

private extension View {
    func buTextFieldStyle() -> some View {
        self
            .font(BUFont.bodySmall)
            .foregroundStyle(BUColor.ink)
            .padding(.horizontal, BUSpacing.sm)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                BUColor.surfaceElevated,
                in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
            )
    }
}

// MARK: - Preview

#if DEBUG
#Preview("TargetCustomerStageView — Why") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["target-customer-definition"] }
    return TargetCustomerStageView().environment(store)
}
#endif
