//
//  MenuDesignStageView.swift — 메뉴/서비스 라인업 확정 단계 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/MenuDesignStage.tsx
//  stageId: "menu-design"
//  cluster: food (외식 path 기본 — FoodMenuPanel)
//
//  4페이지 구조 (세그먼트 컨트롤):
//    pg 0 — Why:        vendor 전에 메뉴 락이 필요한 이유 + KFRI 벤치마크
//    pg 1 — Add:        메뉴 항목 추가 폼 + 등록 목록
//    pg 2 — Cost Check: 평균 원가율 banner + 33% 초과 경보
//    pg 3 — Wrapup:     완료 체크리스트
//
//  데이터: @AppStorage "stage.menu.itemsJson" (추후 DashboardStore.inventory 연동)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

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
    @State private var page = 0

    // Form state
    @State private var fName = ""
    @State private var fCategory = ""
    @State private var fPriceText = ""
    @State private var fCostText = ""
    @State private var fNotes = ""

    @AppStorage("stage.menu.itemsJson") private var itemsJson = "[]"

    private var items: [LineupItem] { parseItems(itemsJson) }

    private var totalRevenue: Double { items.reduce(0) { $0 + Double($1.price) } }
    private var totalCostSum: Double  { items.reduce(0) { $0 + Double($1.cost) } }
    private var avgCostRatio: Double  { totalRevenue > 0 ? totalCostSum / totalRevenue * 100 : 0 }
    private var canAdd: Bool {
        !fName.trimmingCharacters(in: .whitespaces).isEmpty && !fPriceText.isEmpty && !fCostText.isEmpty
    }

    private let categories = ["메인", "사이드", "주류/음료", "디저트", "세트"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
                        heroSection
                            .padding(.horizontal, BUSpacing.md)
                        pageNav
                            .padding(.horizontal, BUSpacing.md)
                        pageContent
                            .padding(.horizontal, BUSpacing.md)
                            .animation(.easeInOut(duration: 0.22), value: page)
                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("메뉴 라인업 확정")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Hero

private extension MenuDesignStageView {

    var heroSection: some View {
        ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: BURadius.heroOuter, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [BUColor.midnight, BUColor.midnightDeep],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: BURadius.heroOuter, style: .continuous)
                        .strokeBorder(.white.opacity(0.10), lineWidth: 1)
                )

            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                Text("KEY ACTION")
                    .font(BUFont.heroEyebrow)
                    .foregroundStyle(.white.opacity(0.60))
                    .tracking(1.5)
                    .textCase(.uppercase)

                Text("시그니처 3-5개 + 사이드로\n메뉴를 확정하세요")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
                    .tracking(-0.4)
                    .lineSpacing(3)

                Text("Prime Cost 황금률: 식자재 30-35% + 인건비 28-32% ≤ 65%. 원가율 33% 초과 메뉴는 영업이익 마이너스 — KFRI 2024.")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.72))
                    .lineSpacing(3)

                HStack(spacing: 8) {
                    HeroMiniCard(icon: "fork.knife",          label: "시그니처", detail: "3-5개로 시작")
                    HeroMiniCard(icon: "percent",             label: "원가율",   detail: "33% 이하 목표")
                    HeroMiniCard(icon: "arrow.trianglehead.2.clockwise", label: "재고 연동",  detail: "자동 등록 예정")
                }
                .padding(.top, 4)
            }
            .padding(BUSpacing.heroOuterPadding)
        }
        .buShadow(.hero)
    }
}

// MARK: - Page nav

private extension MenuDesignStageView {

    var pageNav: some View {
        Picker("", selection: $page) {
            Text("왜 중요한가").tag(0)
            Text("메뉴 추가").tag(1)
            Text("원가 점검").tag(2)
            Text("마무리").tag(3)
        }
        .pickerStyle(.segmented)
    }

    @ViewBuilder
    var pageContent: some View {
        if page == 0 {
            whyPage
        } else if page == 1 {
            addPage
        } else if page == 2 {
            costCheckPage
        } else {
            wrapupSection
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
                        Text("왜 vendor-setup 전인가")
                            .buEyebrowStyle()
                    }
                    Text("메뉴 없이 공급처와 식자재 협상 불가능합니다.")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(3)
                    Text("공급처는 '월 사용량 + 단가 + 결제 조건' 으로 계약합니다. 메뉴 미확정 = 사용량 추정 불가 = 단가 협상 불리. 메뉴 락 후 공급처 미팅 = 협상 우위.")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.outer) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Text("한국 외식 표준 (KFRI 2024)")
                        .buEyebrowStyle()

                    HStack(spacing: 8) {
                        BenchmarkStat(value: "5-8개", label: "총 메뉴 수", detail: "소형 매장")
                        BenchmarkStat(value: "30-35%", label: "식자재 원가율", detail: "황금률 상한")
                        BenchmarkStat(value: "× 3", label: "단가 배수", detail: "원가 → 판매가")
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
                    Image(systemName: "fork.knife.circle.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(BUColor.midnight)
                    Text("메뉴 항목 추가")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                }

                // 이름
                TextField("메뉴 이름 (예: 김치찌개 정식)", text: $fName)
                    .buTextFieldStyle()

                // 판매가 / 원가
                HStack(spacing: 8) {
                    TextField("판매가 (원)", text: $fPriceText)
                        .keyboardType(.numberPad)
                        .buTextFieldStyle()
                    TextField("1인분 원가 (원)", text: $fCostText)
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

// MARK: - Wrapup

private extension MenuDesignStageView {

    var wrapupSection: some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            Text("완료 체크리스트")
                .buEyebrowStyle()
            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    wrapupRow(
                        "1. 메뉴 라인업 확정",
                        detail: "\(items.count)개 메뉴 입력 완료 (시그니처 3-5개 권장)",
                        done: items.count >= 3
                    )
                    wrapupRow(
                        "2. 원가율 점검",
                        detail: String(format: "평균 %.1f%% (33%% 이하 황금률)", avgCostRatio),
                        done: avgCostRatio > 0 && avgCostRatio <= 33
                    )
                    wrapupRow(
                        "3. 재고 카드 자동 연동",
                        detail: "메뉴 → inventory product 자동 등록 (DashboardStore 연동 예정)",
                        done: items.count > 0
                    )
                    wrapupRow(
                        "4. 공급처 협상 준비",
                        detail: "월 사용량 추정 가능 → vendor-setup 에서 단가 협상",
                        done: items.count >= 3
                    )
                }
            }
            Text("다음: 공급처·식자재 확보")
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkMuted)
                .padding(.top, 4)
        }
    }

    @ViewBuilder
    func wrapupRow(_ label: String, detail: String, done: Bool) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.xs) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 14))
                .foregroundStyle(done ? BUColor.success : BUColor.inkMuted)
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
        .background(.white.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

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
    MenuDesignStageView()
}
#endif
