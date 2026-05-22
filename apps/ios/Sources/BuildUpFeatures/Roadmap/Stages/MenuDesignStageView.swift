//
//  MenuDesignStageView.swift — 메뉴/서비스 라인업 확정 단계 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/MenuDesignStage.tsx
//  stageId: "menu-design"
//
//  Cluster 분기 (웹 classifyCluster 미러):
//   • food         → 메뉴 (메인/사이드/주류·음료/디저트/세트)         · 원가율 33% 황금률
//   • cafe         → 음료 (커피/논커피/디저트/원두/MD)               · 원가율 33%
//   • service      → 서비스 (시그니처 시술/사이드 시술/패키지/멤버십) · 객단가 = 시간 × 시급 × 2
//   • retail       → 상품 (시그니처 SKU/번들/한정/체험)              · 마진율 40% 목표
//   • online       → 상품 (메인/번들/체험/리필)                       · 마진율 50% 목표
//   • saas         → 구독 (Free/Starter/Pro/Enterprise 4티어)         · CAC < 12개월 LTV
//
//  3페이지: Why → Add → Cost Check + 자동 wrap-up + 자동 task list
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpCore
import BuildUpData

// MARK: - Cluster 분기 copy

private enum MenuCluster: String {
    case food, cafe, service, retail, online, saas

    static func from(industryId: String) -> MenuCluster {
        let cid = StarterIndustryData.option(by: industryId)?.categoryId ?? ""
        switch cid {
        case "food":                                            return .food
        case "cafe-dessert":                                    return .cafe
        case "beauty", "fitness", "pet", "education",
             "living-service", "space":                         return .service
        case "retail":                                          return .retail
        case "online-digital":                                  return .online
        case "startup-tech":                                    return .saas
        default:                                                return .food
        }
    }

    var noun: String {
        switch self {
        case .food:    return "메뉴"
        case .cafe:    return "음료"
        case .service: return "서비스"
        case .retail, .online: return "상품"
        case .saas:    return "구독 티어"
        }
    }

    var categories: [String] {
        switch self {
        case .food:    return ["메인", "사이드", "주류/음료", "디저트", "세트"]
        case .cafe:    return ["커피", "논커피", "디저트", "원두", "MD"]
        case .service: return ["시그니처 시술", "사이드 시술", "패키지", "멤버십"]
        case .retail:  return ["시그니처 SKU", "번들", "한정", "체험"]
        case .online:  return ["메인", "번들", "체험", "리필"]
        case .saas:    return ["Free", "Starter", "Pro", "Enterprise"]
        }
    }

    var nameFieldPlaceholder: String {
        switch self {
        case .food:    return "메뉴 이름 (예: 김치찌개 정식)"
        case .cafe:    return "음료 이름 (예: 아이스 아메리카노)"
        case .service: return "서비스명 (예: 시그니처 페디큐어)"
        case .retail:  return "상품명 (예: 아크릴 키링 12종)"
        case .online:  return "상품명 (예: 시그니처 디톡스 키트)"
        case .saas:    return "티어명 (예: Pro)"
        }
    }

    var priceFieldPlaceholder: String { "판매가 (원)" }

    var costFieldPlaceholder: String {
        switch self {
        case .food, .cafe:     return "1인분 원가 (원)"
        case .service:         return "재료·세션 원가 (원)"
        case .retail, .online: return "매입가 (원)"
        case .saas:            return "월 인프라 비용 (원)"
        }
    }

    var iconSF: String {
        switch self {
        case .food:    return "fork.knife.circle.fill"
        case .cafe:    return "cup.and.saucer.fill"
        case .service: return "sparkles"
        case .retail:  return "bag.fill"
        case .online:  return "shippingbox.fill"
        case .saas:    return "rectangle.stack.badge.person.crop.fill"
        }
    }

    /// 황금 원가율 (%, 초과 시 마진 경보).
    var costRatioGoldenMax: Double {
        switch self {
        case .food, .cafe:     return 33    // 한국외식산업연구원 표준
        case .service:         return 25    // 미용·피트니스 객단가 25%↓ 재료/세션비
        case .retail, .online: return 60    // 매입 60%↓ → 마진 40%↑
        case .saas:            return 30    // 인프라 매출의 30%↓ → 70% gross margin
        }
    }

    var heroTitle: String {
        switch self {
        case .food:    return "시그니처 3-5개 + 사이드로 메뉴 락"
        case .cafe:    return "음료 라인업 + 원가 황금률"
        case .service: return "시그니처 시술 3-5개 + 패키지 락"
        case .retail:  return "시그니처 SKU 5-10개 + 번들로 카탈로그 락"
        case .online:  return "메인 3-5개 + 번들·체험으로 상품 락"
        case .saas:    return "Free → Starter → Pro → Enterprise 4티어 락"
        }
    }

    var heroSubtitle: String {
        switch self {
        case .food, .cafe:
            return "Prime Cost 황금률: 식자재 30-35% + 인건비 28-32% = 65% 이하. 원가율 33% 초과 메뉴는 영업이익 마이너스 — 한국외식산업연구원 2024."
        case .service:
            return "서비스 객단가 = 시간 × 시급 × 2~3 (원가율 25% 목표). 패키지·멤버십이 재방문 LTV 의 80%."
        case .retail:
            return "매입가 대비 판매가 1.7배 (마진 40%+) 목표. 시그니처 SKU 5-10개로 시작, 번들로 객단가 올리기."
        case .online:
            return "온라인은 마진 50%+ 목표 (배송·플랫폼 수수료 15-20% 흡수). 메인·번들·체험·리필 4축으로 LTV 설계."
        case .saas:
            return "Free→Starter→Pro→Enterprise 4-티어 표준. CAC < 12개월 LTV / 월 인프라 매출의 30%↓ 유지."
        }
    }

    var helperText: String { heroSubtitle }

    var stageTitleKo: String { "\(noun)·서비스 라인업 확정" }

    // Why-page copy (cluster-aware)
    var whyEyebrow: String {
        switch self {
        case .food, .cafe:     return "왜 공급처 셋업 전인가"
        case .service:         return "왜 가격 결정 전인가"
        case .retail, .online: return "왜 소싱 전인가"
        case .saas:            return "왜 가격 결정·GTM 전인가"
        }
    }
    var whyHeadline: String {
        switch self {
        case .food, .cafe:     return "\(noun) 없이 공급처·식자재 협상 불가능합니다."
        case .service:         return "서비스 항목·가격 락 없이는 채용·예약 시스템 결정 불가."
        case .retail:          return "상품 카탈로그 락 없이는 매입·진열·재고 추정 불가."
        case .online:          return "상품 락 없이는 사진·상세페이지·광고 카피 모두 작업 불가."
        case .saas:            return "티어·가격 락 없이는 결제·랜딩페이지·GTM 모두 시작 불가."
        }
    }
    var whyDetail: String {
        switch self {
        case .food, .cafe:
            return "공급처는 '월 사용량 + 단가 + 결제 조건' 으로 계약합니다. \(noun) 미확정 = 사용량 추정 불가 = 단가 협상 불리. 락 후 공급처 미팅 = 협상 우위."
        case .service:
            return "서비스명·소요시간·가격 → 시급·재료비·예약 슬롯 모두 계산 가능. 시그니처 시술 락 = 가격 신뢰도 + 단골 LTV 기반."
        case .retail:
            return "시그니처 SKU 5-10개 락 → 매입가 협상 + 진열 동선 + 재고 회전 모두 추정. 번들·한정으로 객단가 30%+ 상승."
        case .online:
            return "상품 락 → 사진·상세페이지·SEO 키워드·광고 카피·CS 템플릿 일괄 작업. 메인·번들·체험·리필 4축으로 LTV 설계."
        case .saas:
            return "Free → Paid 전환 funnel 의 출발점. Free 한도·Starter 가격·Pro feature·Enterprise 영업 가격 4단 락 = 결제 페이지·랜딩·CAC 모델 모두 작성 가능."
        }
    }

    var benchmarkEyebrow: String {
        switch self {
        case .food, .cafe:     return "한국 외식 표준 (KFRI 2024)"
        case .service:         return "서비스업 표준 (소상공인진흥공단 2024)"
        case .retail:          return "오프라인 리테일 표준 (중소기업청 2024)"
        case .online:          return "온라인 커머스 표준 (네이버 쇼핑 2024)"
        case .saas:            return "SaaS 표준 (OpenView 2024)"
        }
    }

    struct BenchmarkSpec { let value: String; let label: String; let detail: String }
    var benchmark1: BenchmarkSpec {
        switch self {
        case .food:    return .init(value: "5-8개", label: "총 메뉴 수", detail: "소형 매장")
        case .cafe:    return .init(value: "8-12개", label: "음료 SKU", detail: "테이크아웃")
        case .service: return .init(value: "3-5개", label: "시그니처", detail: "10평 매장")
        case .retail:  return .init(value: "5-10개", label: "시그니처 SKU", detail: "10평 매장")
        case .online:  return .init(value: "3-7개", label: "메인 상품", detail: "스마트스토어")
        case .saas:    return .init(value: "3-4개", label: "가격 티어", detail: "Free→Ent")
        }
    }
    var benchmark2: BenchmarkSpec {
        switch self {
        case .food, .cafe: return .init(value: "30-35%", label: "원가율", detail: "황금률 상한")
        case .service:     return .init(value: "≤25%", label: "재료·세션 원가", detail: "객단가 대비")
        case .retail:      return .init(value: "≥40%", label: "마진율", detail: "매입가 대비 ×1.7")
        case .online:      return .init(value: "≥50%", label: "마진율", detail: "수수료·배송 흡수")
        case .saas:        return .init(value: "≤30%", label: "인프라 비중", detail: "Gross 70%+")
        }
    }
    var benchmark3: BenchmarkSpec {
        switch self {
        case .food, .cafe: return .init(value: "× 3", label: "단가 배수", detail: "원가→판매가")
        case .service:     return .init(value: "× 2-3", label: "단가 배수", detail: "시급×시간×k")
        case .retail:      return .init(value: "× 1.7+", label: "단가 배수", detail: "매입→판매")
        case .online:      return .init(value: "× 2-3", label: "단가 배수", detail: "수수료 포함")
        case .saas:        return .init(value: "< 12mo", label: "CAC 회수", detail: "LTV 표준")
        }
    }
}

// MARK: - LineupItem

struct LineupItem: Identifiable, Codable {
    let id: String
    var name: String
    var category: String
    var price: Int
    var cost: Int
    var notes: String

    var costRatio: Double { price > 0 ? Double(cost) / Double(price) * 100 : 0 }
    var isWarning: Bool { costRatio > 33 }
}

// MARK: - MenuDesignStageView

public struct MenuDesignStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "menu-design"

    // Form state
    @State private var fName = ""
    @State private var fCategory = ""
    @State private var fPriceText = ""
    @State private var fCostText = ""
    @State private var fNotes = ""

    @AppStorage("stage.menu.itemsJson") private var itemsJson = "[]"

    private var cluster: MenuCluster { MenuCluster.from(industryId: industryId) }
    private var categories: [String] { cluster.categories }
    private var goldenRatio: Double { cluster.costRatioGoldenMax }

    private var items: [LineupItem] { parseItems(itemsJson) }

    private var totalRevenue: Double { items.reduce(0) { $0 + Double($1.price) } }
    private var totalCostSum: Double  { items.reduce(0) { $0 + Double($1.cost) } }
    private var avgCostRatio: Double  { totalRevenue > 0 ? totalCostSum / totalRevenue * 100 : 0 }
    private var canAdd: Bool {
        !fName.trimmingCharacters(in: .whitespaces).isEmpty && !fPriceText.isEmpty && !fCostText.isEmpty
    }

    private var canCompleteStage: Bool { items.count >= 1 }

    private var advanceHint: String {
        let noun = cluster.noun
        if items.isEmpty { return "\(noun) 항목을 최소 1개 추가하세요" }
        if items.count < 3 { return "\(noun) \(items.count)개 — 시그니처 3-5개 권장" }
        if avgCostRatio > goldenRatio {
            return String(format: "원가율 %.1f%% 초과 — 단가/원가 점검", avgCostRatio)
        }
        return "\(noun) \(items.count)개 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "메뉴·서비스 라인업 확정",
            stageEyebrow: "단계 · \(cluster.noun) 라인업",
            helperText: cluster.helperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["menuCount": "\(items.count)"])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["menuCount": "\(items.count)"]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. 메뉴 라인업 확정", detail: "시그니처 3-5개 + 사이드 2-3개 입력 완료"),
                    .init(label: "2. 원가율 점검", detail: "메뉴별 평균 원가율 33% 이하 (황금률)"),
                    .init(label: "3. 재고 카드 자동 연동", detail: "메뉴 → 재고 product 로 자동 등록"),
                    .init(label: "4. 공급처 협상 준비", detail: "월 사용량 추정 가능 → vendor-setup 에서 단가 협상"),
                ],
                verifyItems: [
                    "메뉴 3개 이상 등록했는가 (시그니처 3-5개 + 사이드 2-3개 표준)",
                    "각 메뉴 원가율 33% 이하인가 (초과 시 인건비 합산 시 영업적자)",
                    "메뉴별 주재료 명시 — vendor-setup 에서 공급처별 단가 비교 가능한가",
                    "객단가 타깃 페르소나 가격 민감도와 일치하는가 (target-customer-definition 결과 참조)",
                    "주방 동선·집기 (construction-setup 완료) 으로 실제 조리 가능한 메뉴인가",
                ],
                nextStageLabel: "공급처·식자재 셋업",
                nextSummary: "메뉴 라인업 확정 → 공급처·식자재 셋업 단계로 진입"
            ),
            currentPage: page,
            totalPages: 3
        ) {
            VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
                pageNav
                pageContent
                    .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }
}

// MARK: - Page nav

private extension MenuDesignStageView {

    var pageNav: some View {
        BUWizardPageNav(
            page: page,
            totalPages: 3,
            labels: ["왜 중요한가", "메뉴 추가", "원가 점검"],
            onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
        )
    }

    @ViewBuilder
    var pageContent: some View {
        if page == 0 {
            whyPage
        } else if page == 1 {
            addPage
        } else {
            costCheckPage
        }
    }
}

// MARK: - pg 0: Why

private extension MenuDesignStageView {

    var whyPage: some View {
        VStack(spacing: BUSpacing.cardGap) {
            BUCard(.outer) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: BUSpacing.xs) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.midnight)
                        Text(cluster.whyEyebrow)
                            .buEyebrowStyle()
                    }
                    Text(cluster.whyHeadline)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(cluster.whyDetail)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            BUCard(.outer) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Text(cluster.benchmarkEyebrow)
                        .buEyebrowStyle()

                    HStack(spacing: 8) {
                        BenchmarkStat(value: cluster.benchmark1.value, label: cluster.benchmark1.label, detail: cluster.benchmark1.detail)
                        BenchmarkStat(value: cluster.benchmark2.value, label: cluster.benchmark2.label, detail: cluster.benchmark2.detail)
                        BenchmarkStat(value: cluster.benchmark3.value, label: cluster.benchmark3.label, detail: cluster.benchmark3.detail)
                    }
                }
            }
        }
    }
}

// MARK: - pg 1: Add

private extension MenuDesignStageView {

    var addPage: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: BUSpacing.xs) {
                    Image(systemName: cluster.iconSF)
                        .font(.system(size: 16))
                        .foregroundStyle(BUColor.midnight)
                    Text("\(cluster.noun) 항목 추가")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                }

                // 이름
                TextField(cluster.nameFieldPlaceholder, text: $fName)
                    .buTextFieldStyle()

                // 판매가 / 원가
                HStack(spacing: 8) {
                    TextField(cluster.priceFieldPlaceholder, text: $fPriceText)
                        .keyboardType(.numberPad)
                        .buTextFieldStyle()
                    TextField(cluster.costFieldPlaceholder, text: $fCostText)
                        .keyboardType(.numberPad)
                        .buTextFieldStyle()
                }

                // 카테고리 칩
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(categories, id: \.self) { cat in
                            CategoryChip(
                                label: cat,
                                isSelected: fCategory == cat,
                                onTap: { fCategory = cat }
                            )
                        }
                    }
                }

                // 주재료 (선택)
                TextField("주재료 (예: 김치 100g, 돼지고기 60g) — 선택", text: $fNotes, axis: .vertical)
                    .lineLimit(1...2)
                    .buTextFieldStyle()

                // 추가 버튼
                Button {
                    addItem()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "plus")
                            .font(.system(size: 14, weight: .bold))
                        Text("메뉴 추가 + 재고 자동 등록")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(canAdd ? BUColor.midnight : BUColor.midnight.opacity(0.15), in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous))
                    .foregroundStyle(canAdd ? Color.white : BUColor.midnight.opacity(0.35))
                }
                .buttonStyle(.plain)
                .disabled(!canAdd)

                // 등록 목록
                if !items.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("등록된 메뉴 \(items.count)개")
                            .buEyebrowStyle()
                        ForEach(items) { item in
                            MenuItemRow(item: item, onDelete: { deleteItem(id: item.id) })
                        }
                    }
                }
            }
        }
    }

    func addItem() {
        guard canAdd else { return }
        let newItem = LineupItem(
            id: UUID().uuidString,
            name: fName.trimmingCharacters(in: .whitespaces),
            category: fCategory,
            price: Int(fPriceText) ?? 0,
            cost: Int(fCostText) ?? 0,
            notes: fNotes.trimmingCharacters(in: .whitespaces)
        )
        var current = items
        current.append(newItem)
        itemsJson = encodeItems(current)
        fName = ""; fCategory = ""; fPriceText = ""; fCostText = ""; fNotes = ""
    }

    func deleteItem(id: String) {
        itemsJson = encodeItems(items.filter { $0.id != id })
    }
}

// MARK: - pg 2: Cost Check

private extension MenuDesignStageView {

    var costCheckPage: some View {
        VStack(spacing: BUSpacing.cardGap) {
            if items.isEmpty {
                BUCard(.outer) {
                    Text("먼저 메뉴를 등록하세요 (메뉴 추가 탭)")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkMuted)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, BUSpacing.lg)
                }
            } else {
                // 평균 원가율 banner
                let tint: Color = avgCostRatio > 35 ? BUColor.danger : avgCostRatio > 30 ? BUColor.warn : BUColor.success
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    Text("메뉴 평균 식자재 원가율")
                        .buEyebrowStyle()
                    Text(String(format: "%.1f%%", avgCostRatio))
                        .font(.system(size: 34, weight: .bold))
                        .foregroundStyle(tint)
                        .tracking(-1.0)
                    Text(avgCostRatio > 35
                        ? "⚠ 35% 초과. 인건비 더하면 영업이익 마이너스 위험. 단가 인상 또는 원가 절감 필요."
                        : avgCostRatio > 30
                            ? "⚠ 30-35%. 황금률 상한. 인건비 + 임대료 합산해 BEP 점검 권장."
                            : "✓ 30% 이하. 황금률 안. 인건비 28-32% 이내로 유지하면 BEP 안정."
                    )
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                }
                .padding(BUSpacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(tint.opacity(0.06), in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                        .strokeBorder(tint.opacity(0.20), lineWidth: 1.5)
                )

                // 33% 초과 경보
                let warningItems = items.filter { $0.isWarning }
                if !warningItems.isEmpty {
                    BUCard(.outer) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("원가율 33% 초과 메뉴")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(BUColor.danger)
                                .tracking(0.8)
                                .textCase(.uppercase)
                            ForEach(warningItems) { item in
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(item.name) — \(Int(item.costRatio))%")
                                        .font(.system(size: 12.5, weight: .semibold))
                                        .foregroundStyle(BUColor.danger.opacity(0.85))
                                    let targetPrice = item.cost > 0 ? Int(ceil(Double(item.cost) / 0.33 / 100) * 100) : 0
                                    let targetCost  = Int(Double(item.price) * 0.33)
                                    Text("단가 ₩\(targetPrice.formatted()) 로 인상 또는 원가 ₩\(targetCost.formatted()) 로 절감 필요")
                                        .font(.system(size: 11))
                                        .foregroundStyle(BUColor.danger.opacity(0.65))
                                        .lineSpacing(2)
                                }
                                .padding(.horizontal, BUSpacing.sm)
                                .padding(.vertical, 9)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(BUColor.danger.opacity(0.04), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
                                        .strokeBorder(BUColor.danger.opacity(0.16), lineWidth: 1)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Sub-components

private struct BenchmarkStat: View {
    let value: String
    let label: String
    let detail: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .tracking(-0.5)
            Text(label)
                .font(.system(size: 11.5, weight: .semibold))
                .foregroundStyle(BUColor.ink)
            Text(detail)
                .font(.system(size: 10))
                .foregroundStyle(BUColor.inkMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, BUSpacing.sm)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
    }
}

private struct CategoryChip: View {
    let label: String
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            Text(label)
                .font(.system(size: 11.5, weight: isSelected ? .bold : .medium))
                .foregroundStyle(isSelected ? BUColor.midnight : BUColor.inkSecondary)
                .padding(.horizontal, 11)
                .padding(.vertical, 5)
                .background(
                    isSelected ? BUColor.midnight.opacity(0.08) : BUColor.surfaceElevated,
                    in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .strokeBorder(
                            isSelected ? BUColor.midnight : BUColor.cardBorder,
                            lineWidth: isSelected ? 1.5 : 1
                        )
                )
        }
        .buttonStyle(.plain)
    }
}

private struct MenuItemRow: View {
    let item: LineupItem
    let onDelete: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: BUSpacing.xs) {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                HStack(spacing: 4) {
                    if !item.category.isEmpty {
                        Text(item.category)
                            .font(.system(size: 10.5))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("·")
                            .font(.system(size: 10.5))
                            .foregroundStyle(BUColor.inkSubtle)
                    }
                    Text("₩\(item.price.formatted()) 판매 · ₩\(item.cost.formatted()) 원가 · \(Int(item.costRatio))%")
                        .font(.system(size: 11))
                        .foregroundStyle(item.isWarning ? BUColor.danger : BUColor.inkMuted)
                }
                if !item.notes.isEmpty {
                    Text(item.notes)
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkSubtle)
                }
            }
            Spacer(minLength: 0)
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.danger.opacity(0.7))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, BUSpacing.sm)
        .padding(.vertical, 10)
        .background(
            item.isWarning ? BUColor.danger.opacity(0.03) : BUColor.midnight.opacity(0.025),
            in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
                .strokeBorder(
                    item.isWarning ? BUColor.danger.opacity(0.20) : BUColor.midnight.opacity(0.08),
                    lineWidth: 1
                )
        )
    }
}

// MARK: - Helpers

private func parseItems(_ json: String) -> [LineupItem] {
    guard let data = json.data(using: .utf8),
          let items = try? JSONDecoder().decode([LineupItem].self, from: data) else { return [] }
    return items
}

private func encodeItems(_ items: [LineupItem]) -> String {
    guard let data = try? JSONEncoder().encode(items),
          let str = String(data: data, encoding: .utf8) else { return "[]" }
    return str
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
            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
            )
    }
}

// MARK: - Preview

#if DEBUG
#Preview("MenuDesignStageView") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["menu-design"] }
    return MenuDesignStageView().environment(store)
}
#endif
