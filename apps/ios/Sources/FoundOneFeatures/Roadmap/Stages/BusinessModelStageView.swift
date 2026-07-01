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
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneData

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

    /// 운영 모델 — 웹 SSOT (packages/shared/starter-data.ts `starterBusinessModelOptionsByCategory`
    ///   + i18n.ts 한국어) 1:1 미러. id·한국어 라벨·설명을 웹과 정확히 일치시켜 양쪽 통일.
    ///   업종마다 운영 모델이 다름 (음식=홀/테이크아웃/하이브리드, 요가=멤버십/코치드/무인 등).
    private var models: [BizModelOption] {
        let blue   = Color(red: 0.149, green: 0.388, blue: 0.922)
        let orange = BUColor.warn
        let green  = BUColor.success
        switch cluster.category {
        case .food: return [
            .init(id: "dine-in-restaurant", icon: "fork.knife",     color: blue,
                  titleKo: "매장 식사형", descKo: "한식·파스타·브런치처럼 매장 내 식사 경험이 중요한 외식형", tagKo: nil),
            .init(id: "takeout-focused",    icon: "bag.fill",       color: green,
                  titleKo: "테이크아웃 중심", descKo: "작은 공간·빠른 세팅·단순 인력 구조에 유리", tagKo: nil),
            .init(id: "delivery-hybrid",    icon: "box.truck.fill", color: orange,
                  titleKo: "하이브리드 (홀+배달)", descKo: "홀 식사·배달·픽업 모두 운영 — 한국 외식 가장 흔한 운영", tagKo: "추천"),
        ]
        case .cafeDessert: return [
            .init(id: "storefront-cafe",  icon: "cup.and.saucer.fill", color: blue,
                  titleKo: "매장형 카페", descKo: "브랜드 노출·좌석 운영·지역 충성도까지 균형", tagKo: "추천"),
            .init(id: "takeout-focused",  icon: "bag.fill",            color: green,
                  titleKo: "테이크아웃 중심", descKo: "작은 공간·빠른 세팅·단순 인력 구조에 유리", tagKo: nil),
            .init(id: "cafe-delivery-hybrid", icon: "box.truck.fill",  color: orange,
                  titleKo: "하이브리드 (매장+배달)", descKo: "매장 + 배달앱·픽업 병행 — 음료·디저트 배달 수요까지 흡수", tagKo: nil),
            .init(id: "self-serve-light", icon: "cube.box.fill",       color: Color(red: 0.486, green: 0.227, blue: 0.929),
                  titleKo: "무인/셀프 운영형", descKo: "인건비↓ — 기기 품질·입지 적합도가 더 중요", tagKo: nil),
        ]
        case .beauty: return [
            .init(id: "appointment-studio",  icon: "calendar",        color: blue,
                  titleKo: "예약 중심 스튜디오형", descKo: "미용실·네일·왁싱 — 예약 반복이 핵심", tagKo: "추천"),
            .init(id: "premium-private-room", icon: "sparkles",        color: orange,
                  titleKo: "프라이빗 프리미엄형", descKo: "피부관리·브라이덜 — 신뢰·프라이버시·고가", tagKo: nil),
            .init(id: "beauty-retail-hybrid", icon: "bag.fill", color: green,
                  titleKo: "시술+제품 하이브리드형", descKo: "서비스 + 홈케어 제품 판매로 업셀·재구매", tagKo: nil),
        ]
        case .fitness: return [
            .init(id: "membership-studio", icon: "figure.yoga",       color: blue,
                  titleKo: "멤버십 스튜디오형", descKo: "필라테스·요가 — 반복 수강·멤버십에 강한 모델", tagKo: "추천"),
            .init(id: "coach-led-premium", icon: "figure.strengthtraining.traditional", color: orange,
                  titleKo: "코치 중심 프리미엄형", descKo: "PT·골프 — 개인 코칭 가치가 큰 고단가", tagKo: nil),
            .init(id: "low-touch-fitness", icon: "key.fill",          color: green,
                  titleKo: "저접촉/무인 피트니스형", descKo: "인력↓ — 출입·장비 관리가 더 중요", tagKo: nil),
        ]
        case .education: return [
            .init(id: "academy-classroom",   icon: "studentdesk",     color: blue,
                  titleKo: "클래스룸/학원형", descKo: "어학·학습·기술 — 반복 수업 구조가 분명", tagKo: "추천"),
            .init(id: "small-group-tutoring", icon: "person.2.fill",  color: green,
                  titleKo: "소규모 튜터링형", descKo: "공부방·소그룹 — 작은 공간에서 시작하기 좋음", tagKo: nil),
            .init(id: "hybrid-learning",      icon: "laptopcomputer", color: orange,
                  titleKo: "오프라인+온라인 교육형", descKo: "코딩·성인 교육처럼 온라인을 함께 쓰는 혼합형", tagKo: nil),
        ]
        case .pet: return [
            .init(id: "pet-service-studio", icon: "pawprint.fill",    color: blue,
                  titleKo: "예약형 펫 서비스 스튜디오", descKo: "펫미용처럼 반복 예약·소형 공간 운영이 핵심", tagKo: "추천"),
            .init(id: "pet-care-center",    icon: "house.fill",       color: orange,
                  titleKo: "펫 돌봄 센터형", descKo: "호텔·데이케어·유치원 — 돌봄·관리가 핵심", tagKo: nil),
            .init(id: "pet-retail-hybrid",  icon: "bag.fill", color: green,
                  titleKo: "서비스+용품 하이브리드형", descKo: "펫 서비스 + 용품·소모품 반복 판매", tagKo: nil),
        ]
        case .livingService: return [
            .init(id: "utility-storefront",  icon: "building.2.fill", color: blue,
                  titleKo: "생활 밀착 점포형", descKo: "세탁·수리·인쇄처럼 오프라인 실용 수요", tagKo: "추천"),
            .init(id: "self-service-model",  icon: "cube.box.fill",   color: green,
                  titleKo: "셀프서비스형", descKo: "셀프 빨래방처럼 저접촉 운영 가능", tagKo: nil),
            .init(id: "visit-service-model", icon: "car.fill",        color: orange,
                  titleKo: "방문/출동 서비스형", descKo: "청소·수리 — 점포보다 스케줄·대응력이 중요", tagKo: nil),
        ]
        case .space: return [
            .init(id: "reservation-space",      icon: "calendar.badge.clock", color: blue,
                  titleKo: "예약형 공간 대여", descKo: "스튜디오·파티룸·연습실 — 시간 단위 예약 중심", tagKo: "추천"),
            .init(id: "membership-space",       icon: "person.badge.key.fill", color: green,
                  titleKo: "멤버십 공간형", descKo: "스터디카페·공유오피스 — 반복 이용 중심", tagKo: nil),
            .init(id: "hospitality-operations", icon: "bed.double.fill", color: orange,
                  titleKo: "숙박/호스피탈리티 운영형", descKo: "게스트하우스처럼 운영 난도가 더 높은 숙박형", tagKo: nil),
        ]
        case .retail: return [
            .init(id: "small-storefront-retail", icon: "building.2.fill", color: blue,
                  titleKo: "오프라인 소형 매장형", descKo: "큐레이션·동네 재방문 수요를 살리는 기본 소매", tagKo: "추천"),
            .init(id: "unmanned-retail-model",   icon: "cube.box.fill",   color: green,
                  titleKo: "무인 소매형", descKo: "저접촉 — 상품 회전·위치 적합도가 더 중요", tagKo: nil),
            .init(id: "omni-retail",             icon: "arrow.triangle.swap", color: orange,
                  titleKo: "오프라인+온라인 병행형", descKo: "매장 판매 + 온라인 유입을 함께 가져가는 혼합", tagKo: nil),
        ]
        case .onlineDigital: return [
            .init(id: "marketplace-seller",       icon: "cart.fill", color: blue,
                  titleKo: "마켓플레이스 판매형", descKo: "스마트스토어·위탁판매처럼 입점형 판매 중심", tagKo: "추천"),
            .init(id: "brand-storefront-online",  icon: "globe",     color: green,
                  titleKo: "브랜드 자사몰형", descKo: "브랜드 경험·반복 구매·고객 데이터를 직접 관리", tagKo: nil),
            .init(id: "content-membership-model", icon: "newspaper.fill", color: orange,
                  titleKo: "콘텐츠/멤버십형", descKo: "디지털 상품·뉴스레터·크리에이터 — 구독 중심", tagKo: nil),
        ]
        case .startupTech: return [
            // 웹 SSOT — GTM 모션 (제품 형태가 아니라 시장 진입 방식). 수익 모델은 별도 selector.
            .init(id: "plg-saas",                icon: "macbook.and.iphone", color: blue,
                  titleKo: "제품 주도형 SaaS", descKo: "셀프서브·가벼운 터치 — 활성화 속도가 중요할 때", tagKo: "추천"),
            .init(id: "sales-led-b2b",           icon: "briefcase.fill",     color: orange,
                  titleKo: "영업 주도형 B2B", descKo: "고가 페인·소수 구매자·파일럿→확장", tagKo: nil),
            .init(id: "usage-based-api",         icon: "bolt.horizontal.fill", color: green,
                  titleKo: "사용량 기반 API/인프라", descKo: "개발자 대상 — 사용량·자동화 볼륨에 가치 비례", tagKo: nil),
            .init(id: "hybrid-software-service", icon: "person.2.fill", color: Color(red: 0.486, green: 0.227, blue: 0.929),
                  titleKo: "소프트웨어+서비스 하이브리드", descKo: "수동 서비스로 수요 증명 후 제품화", tagKo: nil),
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
                // openHour/closeHour 는 currentInputs(showBusinessHours 시 포함) → StageInputProjector 가
                // business_open/close_time 컬럼에 자동 투영(웹 SSOT).
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs)
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 운영 모델 선택", detail: "매장형 · 배달·온라인 · 하이브리드 · 무인 등 업종에 맞는 운영 모델 결정"),
                .init(label: "2. 핵심 상품·서비스 확정", detail: "코어·시그니처·확장·실험 4-tier로 상품·서비스 우선순위 정의"),
                .init(label: "3. 영업시간·요일 설정", detail: "주중·주말·휴무일 패턴 + 피크타임 시간대 정의"),
                .init(label: "4. 수익 모델 결정", detail: "단품 판매·구독·멤버십·시간제 등 카테고리별 매출 흐름 모델 확정"),
                ],
                verifyItems: [
                "운영 모델별 인허가·신고 차이 확인 (예: 무인 매장은 24시간 별도 신고, 온라인은 통신판매업, 배달 전문은 영업신고 형태 상이)",
                "핵심 상품·서비스 — 원가율·제공 시간(조리·시술·처리)·손실률을 업종 기준으로 점검",
                "영업시간 — 근로기준법 1주 52시간 한도 + 1일 11시간 휴게(주휴) 사전 시뮬",
                "수익 모델 — 객단가·이용료 × 이용 빈도(회전·재방문) × 영업일수로 월매출 시뮬 후 손익분기 계산 (BEP < 보유자본 6개월)",
                "프랜차이즈인 경우 본사 규정(상품·운영·시간) 변경 가능 여부 (계약서 「본사 동의 필수」 조항 확인)",
                "플랫폼 의존 모델(배달·오픈마켓 등) — 플랫폼 수수료·광고비·결제·VAT 합산 매출 비중 반영 후에도 마진 확보 가능한지 (예: 배달앱 17~28%)",
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
                    .foregroundStyle(BUColor.warn)
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
                colors: [BUColor.warn.opacity(0.07), BUColor.warn.opacity(0.02)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(BUColor.warn.opacity(0.22), lineWidth: 1)
        )
    }

    private func noteRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 7) {
            Circle().fill(BUColor.warn).frame(width: 4, height: 4).padding(.top, 7)
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
                    .foregroundStyle(hoursPerDay > 12 ? BUColor.warn : BUColor.success)
                Text("하루 \(hoursPerDay)시간 · 주 6일 기준 주 \(hoursPerDay * 6)시간")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                if hoursPerDay > 12 {
                    Text("(주 52시간 검토 필요)")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(BUColor.warn)
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
