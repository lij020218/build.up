//
//  BusinessModelStageView.swift — 운영 모델 선택 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/BusinessModelSelectionStage.tsx
//  stageId: "business-model"
//
//  레이아웃 (BUStageShell):
//   ① helper line
//   ② 2-col 운영 모델 그리드 (배달·홀·테이크아웃·셀프)
//   ③ 배달 선택 시 주의 카드 (수수료·인허가·포장재)
//   ④ 영업시간 — 오픈/마감 시간 wheel picker
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents
import BuildUpData

private struct BizModelOption: Identifiable {
    let id: String
    let icon: String
    let color: Color
    let titleKo: String
    let descKo: String
    let tagKo: String?
}

public struct BusinessModelStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @Environment(\.dismiss) private var dismiss
    @AppStorage("stage.bizModel.selected")       private var selected       = ""
    @AppStorage("stage.bizModel.revenueModelId") private var revenueModelId = ""
    @AppStorage("stage.bizModel.openHour")       private var openHour       = 9
    @AppStorage("stage.bizModel.closeHour")      private var closeHour      = 21
    @AppStorage("roadmap.selectedIndustryId")    private var industryId     = ""
    private let stageId = "business-model"

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    /// 수익 모델 selector 표시 여부 — startup-tech / online-digital 만 (웹 SSOT showRevenueModel).
    private var showRevenueModel: Bool {
        (cluster.isStartupTech || cluster.isOnline) && !selected.isEmpty
    }

    /// 영업시간 selector 표시 여부 — 오프라인 매장형만. 온라인·스타트업은 24시간 운영이라 무의미.
    private var showBusinessHours: Bool {
        !cluster.isStartupTech && !cluster.isOnline
    }

    /// 수익 모델 옵션 (웹 REVENUE_OPTIONS, applicableTo 필터링).
    private struct RevenueOption: Identifiable {
        let id: String
        let titleKo: String
        let subKo: String
        let exampleKo: String
        let applicableTo: Set<String>
    }
    private var revenueOptions: [RevenueOption] {
        let all: [RevenueOption] = [
            .init(id: "subscription",
                  titleKo: "정기 구독 (월·연)", subKo: "매월/매년 자동 결제", exampleKo: "예: 넷플릭스 · 노션 · 토스",
                  applicableTo: ["startup-tech", "online-digital"]),
            .init(id: "api-usage",
                  titleKo: "API 사용량 (호출·토큰 단위)", subKo: "쓴 만큼 청구", exampleKo: "예: OpenAI · Stripe · Twilio",
                  applicableTo: ["startup-tech"]),
            .init(id: "one-time",
                  titleKo: "일회 구매", subKo: "한 번 결제, 그 후 사용", exampleKo: "예: 음식점 · 옷가게 · 디지털 상품 단건",
                  applicableTo: []),
            .init(id: "freemium",
                  titleKo: "무료 + 프리미엄", subKo: "무료 체험 후 유료 전환", exampleKo: "예: 디스코드 · 줌 · 노션 무료 플랜",
                  applicableTo: ["startup-tech", "online-digital"]),
            .init(id: "marketplace-fee",
                  titleKo: "거래 수수료", subKo: "매출 발생 시 % 수수료", exampleKo: "예: 우버이츠 · 에어비앤비 · 크몽",
                  applicableTo: ["startup-tech", "online-digital"]),
            .init(id: "hybrid",
                  titleKo: "복합 (둘 이상)", subKo: "구독 + API · 무료 + 광고 등", exampleKo: "예: AWS · Slack · Spotify",
                  applicableTo: ["startup-tech", "online-digital"]),
        ]
        return all.filter { $0.applicableTo.isEmpty || $0.applicableTo.contains(cluster.category.rawValue) }
    }

    /// 웹 SSOT: packages/shared/starter-data.ts category 별 businessModelOptions.
    /// food/cafe → 외식 운영 모델 / 서비스업 → 매장·예약·방문 / 리테일 → 오프·온·하이브리드 /
    /// 온라인 → 채널 / 스타트업 → SaaS 수익 모델.
    private var models: [BizModelOption] {
        switch cluster.category {
        case .food, .cafeDessert: return [
            .init(id: "delivery-hybrid",    icon: "box.truck.fill", color: Color(red: 0.918, green: 0.345, blue: 0.047),
                  titleKo: "하이브리드 (홀+배달)", descKo: "홀 식사·배달·픽업 모두 운영", tagKo: "추천"),
            .init(id: "dine-in-restaurant", icon: "fork.knife",      color: Color(red: 0.149, green: 0.388, blue: 0.922),
                  titleKo: "홀 매장 중심",     descKo: "테이블 식사·홀 서비스 위주",   tagKo: nil),
            .init(id: "takeout-focused",    icon: "bag.fill",        color: Color(red: 0.020, green: 0.588, blue: 0.412),
                  titleKo: "테이크아웃 전문",  descKo: "픽업·포장 위주·좌석 최소",     tagKo: nil),
        ]
        case .beauty, .fitness, .pet, .education: return [
            .init(id: "in-shop",   icon: "building.2.fill",       color: Color(red: 0.149, green: 0.388, blue: 0.922),
                  titleKo: "매장 운영",     descKo: "예약·방문 위주 — 단골·LTV 모델",       tagKo: "추천"),
            .init(id: "mobile",    icon: "car.fill",              color: Color(red: 0.918, green: 0.345, blue: 0.047),
                  titleKo: "출장·방문",     descKo: "고객 위치로 이동 (반려동물·청소·뷰티)", tagKo: nil),
            .init(id: "hybrid",    icon: "arrow.triangle.swap",   color: Color(red: 0.486, green: 0.227, blue: 0.929),
                  titleKo: "매장 + 출장 혼합", descKo: "매장 + 출장 양쪽 가능",               tagKo: nil),
            .init(id: "membership", icon: "creditcard.fill",      color: Color(red: 0.020, green: 0.588, blue: 0.412),
                  titleKo: "회원제·구독",    descKo: "월 정기·시즌권 — 리텐션 중심",          tagKo: nil),
        ]
        case .livingService: return [
            .init(id: "mobile",  icon: "car.fill",         color: Color(red: 0.918, green: 0.345, blue: 0.047),
                  titleKo: "출장·방문 위주",  descKo: "세탁·청소·수리 등 고객 위치 이동", tagKo: "추천"),
            .init(id: "in-shop", icon: "building.2.fill",  color: Color(red: 0.149, green: 0.388, blue: 0.922),
                  titleKo: "매장 운영",      descKo: "코인세탁·수리 매장 등 고정 매장",  tagKo: nil),
            .init(id: "hybrid",  icon: "arrow.triangle.swap", color: Color(red: 0.486, green: 0.227, blue: 0.929),
                  titleKo: "매장 + 출장",    descKo: "매장 운영 + 출장 병행",            tagKo: nil),
        ]
        case .space: return [
            .init(id: "manned",   icon: "person.fill",     color: Color(red: 0.149, green: 0.388, blue: 0.922),
                  titleKo: "유인 운영",       descKo: "체크인·청소·운영 직접",        tagKo: nil),
            .init(id: "unmanned", icon: "key.fill",        color: Color(red: 0.918, green: 0.345, blue: 0.047),
                  titleKo: "무인 (스마트락)",  descKo: "스마트락 + 예약 자동화",       tagKo: "추천"),
            .init(id: "hybrid",   icon: "arrow.triangle.swap", color: Color(red: 0.486, green: 0.227, blue: 0.929),
                  titleKo: "혼합 운영",       descKo: "주말 유인 + 평일 무인",         tagKo: nil),
        ]
        case .retail: return [
            .init(id: "offline-shop", icon: "building.2.fill", color: Color(red: 0.149, green: 0.388, blue: 0.922),
                  titleKo: "오프라인 매장",   descKo: "고정 매장 — 진열·직접 판매",      tagKo: nil),
            .init(id: "online-shop",  icon: "globe",            color: Color(red: 0.020, green: 0.588, blue: 0.412),
                  titleKo: "온라인 전용",     descKo: "스마트스토어·자체몰만 운영",     tagKo: nil),
            .init(id: "omni-channel", icon: "arrow.triangle.swap", color: Color(red: 0.918, green: 0.345, blue: 0.047),
                  titleKo: "옴니채널",        descKo: "오프라인 + 온라인 통합 운영",    tagKo: "추천"),
            .init(id: "popup-only",   icon: "calendar.badge.clock", color: Color(red: 0.486, green: 0.227, blue: 0.929),
                  titleKo: "팝업·기간한정",   descKo: "단기 임대 + 기간한정 마케팅",     tagKo: nil),
        ]
        case .onlineDigital: return [
            .init(id: "marketplace",  icon: "cart.fill",  color: Color(red: 0.149, green: 0.388, blue: 0.922),
                  titleKo: "마켓플레이스 입점", descKo: "스마트스토어·쿠팡·11번가 등",    tagKo: "추천"),
            .init(id: "direct-store", icon: "globe",      color: Color(red: 0.020, green: 0.588, blue: 0.412),
                  titleKo: "자체몰 직판매",     descKo: "카페24·Shopify 등 자체 도메인", tagKo: nil),
            .init(id: "multi-channel", icon: "arrow.triangle.swap", color: Color(red: 0.918, green: 0.345, blue: 0.047),
                  titleKo: "멀티 채널",         descKo: "마켓+자체몰+SNS 동시 운영",       tagKo: nil),
            .init(id: "subscription",  icon: "creditcard.fill",  color: Color(red: 0.486, green: 0.227, blue: 0.929),
                  titleKo: "구독 박스·리필",     descKo: "정기배송 + 멤버십 LTV 중심",       tagKo: nil),
        ]
        case .startupTech: return [
            // 웹 SSOT (getStarterBusinessModelOptions("startup-tech")) — biz model 은 제품 형태.
            //   수익 모델 (어떻게 돈 받는가) 은 별도 selector 로 분리됨.
            .init(id: "saas-product",   icon: "macbook.and.iphone", color: Color(red: 0.149, green: 0.388, blue: 0.922),
                  titleKo: "SaaS 제품",   descKo: "웹·모바일 앱 형태로 사용자에게 직접 제공",       tagKo: "추천"),
            .init(id: "platform-model", icon: "rectangle.connected.to.line.below", color: Color(red: 0.918, green: 0.345, blue: 0.047),
                  titleKo: "플랫폼·마켓플레이스", descKo: "공급자·수요자 매칭 — 거래 수수료 기반",   tagKo: nil),
            .init(id: "api-infra",      icon: "bolt.horizontal.fill", color: Color(red: 0.020, green: 0.588, blue: 0.412),
                  titleKo: "API·인프라",   descKo: "개발자 대상 API·SDK — Stripe·Twilio 패턴",   tagKo: nil),
        ]
        }
    }

    public init() {}

    /// 게이트: model 선택 + (오프라인이면) 영업시간 + (tech/online 이면) 수익 모델.
    private var canContinue: Bool {
        guard !selected.isEmpty else { return false }
        if showBusinessHours && openHour == closeHour { return false }
        if showRevenueModel && revenueModelId.isEmpty { return false }
        return true
    }

    private var hoursPerDay: Int {
        closeHour > openHour ? closeHour - openHour : (24 - openHour + closeHour)
    }

    private var advanceHint: String {
        if selected.isEmpty { return "운영 방식을 선택하세요" }
        if showRevenueModel && revenueModelId.isEmpty { return "수익 모델을 선택하세요" }
        if showBusinessHours { return "하루 \(hoursPerDay)시간 영업 — 다음 단계로 진행" }
        return "선택 완료 — 다음 단계로 진행"
    }

    private var currentInputs: [String: String] {
        var m: [String: String] = ["model": selected]
        if showBusinessHours {
            m["openHour"] = "\(openHour)"
            m["closeHour"] = "\(closeHour)"
        }
        if showRevenueModel, !revenueModelId.isEmpty {
            m["revenueModel"] = revenueModelId
        }
        return m
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "운영 방식 선택",
            stageEyebrow: "단계 3 · 운영 모델",
            helperText: "운영 방식에 따라 인허가·인건비·POS 구성이 달라집니다.",
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
                .init(label: "1. 운영 모델 선택", detail: "고정매장 / 배달 중심 / 하이브리드 / 무인 등 업종별 운영 모델 결정"),
                .init(label: "2. 시그니처 메뉴·서비스 확정", detail: "스페셜티 4-tier(코어·시그니처·확장·실험) 분기로 메뉴 우선순위 정의"),
                .init(label: "3. 영업시간·요일 설정", detail: "주중·주말·휴무일 패턴 + 피크타임 시간대 정의"),
                .init(label: "4. 수익 모델 결정", detail: "단품 판매·구독·멤버십·시간제 등 카테고리별 매출 흐름 모델 확정"),
                ],
                verifyItems: [
                "운영 모델별 인허가 차이 확인 — 배달 전문은 「휴게음식점 미허가 시」 영업불가, 무인은 24시간 신고 별도",
                "시그니처 메뉴 — 식자재 원가율 30% 이내 + 조리 시간 5분 이내 + 폐기율 10% 이하 모두 충족 검증",
                "영업시간 — 근로기준법 1주 52시간 한도 + 1일 11시간 휴게(주휴) 사전 시뮬",
                "수익 모델 — 객단가 × 회전수 × 영업일수로 월매출 시뮬 후 손익분기 계산 (BEP < 보유자본 6개월)",
                "프랜차이즈인 경우 본사 정해진 메뉴·시간 변경 가능 여부 (계약서 「본사 동의 필수」 조항 확인)",
                "배달 중심 모델 — 배민·쿠팡이츠 수수료(평균 17~28%) 반영 후에도 마진 20% 이상 확보 가능한지",
                ],
                nextStageLabel: "자본·일정 설정",
                nextSummary: "운영 모델·메뉴·시간 확정 → 자본·일정 설정 단계로 진입"
            )
        ) {
            VStack(alignment: .leading, spacing: 16) {
                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                    spacing: 12
                ) {
                    ForEach(models) { model in
                        BizModelCard(option: model, isSelected: selected == model.id) {
                            withAnimation(.snappy(duration: 0.18)) { selected = model.id }
                        }
                    }
                }

                if selected == "delivery-hybrid" {
                    deliveryNote
                }

                if showRevenueModel {
                    revenueModelSection
                }

                if showBusinessHours {
                    businessHoursSection
                }
            }
        }
    }

    // MARK: - 수익 모델 section (startup-tech / online-digital 만)

    private var revenueModelSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Text("수익 모델")
                        .font(.system(size: 10.5, weight: .heavy))
                        .tracking(0.6)
                        .textCase(.uppercase)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 3)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                    Text("어떻게 돈을 받으실 건가요?")
                        .font(.system(size: 15, weight: .heavy))
                        .tracking(-0.2)
                        .foregroundStyle(BUColor.ink)
                }
                Text("수익 모델은 운영 대시보드의 KPI (MRR · 재구매율 · ARPU) 와 가격 설계 단계의 추천을 결정합니다. 결합 모델이면 \"복합\"을 선택하세요.")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)],
                    spacing: 10
                ) {
                    ForEach(revenueOptions) { opt in
                        revenueOptionCard(opt)
                    }
                }
            }
        }
    }

    private func revenueOptionCard(_ opt: RevenueOption) -> some View {
        let isSelected = revenueModelId == opt.id
        return Button {
            withAnimation(.snappy(duration: 0.18)) { revenueModelId = opt.id }
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Text(opt.titleKo)
                    .font(.system(size: 13.5, weight: .heavy))
                    .tracking(-0.15)
                    .foregroundStyle(isSelected ? BUColor.midnight : BUColor.ink)
                Text(opt.subKo)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                Text(opt.exampleKo)
                    .font(.system(size: 10.5))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.85))
                    .lineSpacing(2)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .frame(maxWidth: .infinity, minHeight: 78, alignment: .topLeading)
            .background(
                isSelected ? BUColor.midnight.opacity(0.06) : Color.white,
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(
                        isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.10),
                        lineWidth: isSelected ? 1.5 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }

    private var deliveryNote: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 7) {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(Color.orange)
                    .font(.system(size: 13, weight: .bold))
                Text("하이브리드 운영 — 주의사항")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
            }
            VStack(alignment: .leading, spacing: 6) {
                noteRow("배민·쿠팡이츠 수수료 평균 17~28% — 원가 설계에 반드시 반영")
                noteRow("일반음식점 허가 필수 — 홀 좌석 1석 이상이면 휴게음식점 불가")
                noteRow("포장재 + 배달비 별도 — 메뉴 가격 책정에 포함")
                noteRow("주방 동선: 홀 서빙 + 픽업 + 배달 라이더 픽업 3 흐름 분리 권장")
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color.orange.opacity(0.07), Color.orange.opacity(0.02)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Color.orange.opacity(0.22), lineWidth: 1)
        )
    }

    private func noteRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 7) {
            Circle().fill(Color.orange).frame(width: 4, height: 4).padding(.top, 7)
            Text(text)
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
    }

    private var businessHoursSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            BUStageSectionHeader(
                eyebrow: "Step 2 — 영업 시간",
                hint: "오픈·마감을 정하면 주 영업 시간 자동 계산"
            )

            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("오픈")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                    Picker("오픈", selection: $openHour) {
                        ForEach(0..<24, id: \.self) { h in
                            Text(String(format: "%02d:00", h)).tag(h)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(height: 100)
                    .clipped()
                }
                .frame(maxWidth: .infinity)

                Text("~")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)

                VStack(alignment: .leading, spacing: 4) {
                    Text("마감")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                    Picker("마감", selection: $closeHour) {
                        ForEach(0..<24, id: \.self) { h in
                            Text(String(format: "%02d:00", h)).tag(h)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(height: 100)
                    .clipped()
                }
                .frame(maxWidth: .infinity)
            }

            HStack(spacing: 6) {
                Image(systemName: hoursPerDay > 12 ? "exclamationmark.triangle" : "checkmark.circle")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(hoursPerDay > 12 ? Color.orange : BUColor.success)
                Text("하루 \(hoursPerDay)시간 · 주 6일 기준 주 \(hoursPerDay * 6)시간")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                if hoursPerDay > 12 {
                    Text("(주 52시간 검토 필요)")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(Color.orange)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(Color.black.opacity(0.05), lineWidth: 1)
        )
    }
}

private struct BizModelCard: View {
    let option: BizModelOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    ZStack {
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(option.color.opacity(isSelected ? 0.18 : 0.08))
                        Image(systemName: option.icon)
                            .font(.system(size: 20, weight: .regular))
                            .foregroundStyle(option.color.opacity(isSelected ? 1.0 : 0.8))
                    }
                    .frame(width: 44, height: 44)
                    Spacer()
                    if let tag = option.tagKo {
                        Text(tag)
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(option.color)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(option.color.opacity(0.1), in: Capsule())
                    }
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(option.titleKo)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(isSelected ? option.color : BUColor.ink)
                    Text(option.descKo)
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                        .multilineTextAlignment(.leading)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity, minHeight: 130, alignment: .topLeading)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: isSelected
                                ? [option.color.opacity(0.08), option.color.opacity(0.04)]
                                : [option.color.opacity(0.03), Color.white.opacity(0.9)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(
                        isSelected ? option.color.opacity(0.4) : option.color.opacity(0.1),
                        lineWidth: 1.5
                    )
            )
            .shadow(color: isSelected ? option.color.opacity(0.08) : .clear, radius: 4, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
#Preview("BusinessModel") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["business-model"] }
    return BusinessModelStageView().environment(store)
}
#endif
