//
//  MenuProfitabilityCard.swift — 메뉴·서비스 라인업 수익성 (음식·카페·서비스)
//
//  웹 SSOT 미러: apps/web/app/lib/components/dashboard/MenuProfitabilityCard.tsx
//
//  왜: 로드맵 menu-design 에서 입력한 메뉴(판매가·원가)가 재고 카드에 "재고 0개" 로 묻혀
//      의미가 깨졌다(메뉴 ≠ 재고). 메뉴는 *판매 품목* → per-item 원가율·마진으로 별도 표시.
//
//  데이터(위조 0): StoreInfoStore.inventory 중 itemType=="product"
//      (MenuDesignStageView.syncMenuToInventory 가 기록). 판매가·원가 → 원가율·마진.
//  forward-compat: 메뉴별 판매량(monthlySold) 쌓이면 메뉴 엔지니어링 매트릭스(스타/간판/퍼즐/도그)로
//      업그레이드 — 지금은 판매량 없어 위조 안 함(가짜숫자 금지).
//
//  색: 신호등 금지 — 양호=미드나잇, 위험=벽돌(BUColor.danger).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneData

public struct MenuProfitabilityCard: View {

    let items: [BUInventoryItem]
    let category: IndustryCategory
    /// 있으면 "메뉴 레시피 관리" 버튼 노출 → 레시피(BOM) 편집 시트. (2026-07-22)
    let onManageRecipes: (() -> Void)?

    public init(items: [BUInventoryItem], category: IndustryCategory, onManageRecipes: (() -> Void)? = nil) {
        self.items = items
        self.category = category
        self.onManageRecipes = onManageRecipes
    }

    // 로드맵 menu-design 이 product 로 기록한 항목만.
    private var menu: [BUInventoryItem] { items.filter { $0.itemType == "product" } }
    // 재료(material) — 레시피 원가 계산용.
    private var materials: [BUInventoryItem] { items.filter { $0.itemType != "product" } }
    // 메뉴 원가 = 레시피 있으면 재료 합산(자동), 없으면 수동 unitCost. (2026-07-22 레시피/BOM)
    private func costOf(_ m: BUInventoryItem) -> Double { RecipeCost.menuCostPerServing(m, materials: materials) }

    private var noun: String {
        switch category {
        case .cafe: return "음료"
        case .beauty, .fitness, .pet, .education, .livingService, .space: return "서비스"
        default: return "메뉴"
        }
    }

    /// 황금 원가율(%) — 음식·카페 33% / 서비스 25%.
    private var goldenMax: Double {
        switch category {
        case .beauty, .fitness, .pet, .education, .livingService, .space: return 25
        default: return 33
        }
    }

    private var iconSF: String {
        switch category {
        case .cafe: return "cup.and.saucer.fill"
        case .beauty, .fitness, .pet, .education, .livingService, .space: return "sparkles"
        default: return "fork.knife"
        }
    }

    private var totalRevenue: Double { menu.reduce(0) { $0 + $1.sellingPrice } }
    private var totalCost: Double { menu.reduce(0) { $0 + costOf($1) } }
    private var avgRatio: Double { totalRevenue > 0 ? totalCost / totalRevenue * 100 : 0 }
    private var avgPrice: Double { menu.isEmpty ? 0 : totalRevenue / Double(menu.count) }
    private var avgRatioWarn: Bool { avgRatio > goldenMax }

    private struct Metric: Identifiable {
        let id: String; let name: String; let price: Double; let cost: Double
        let ratio: Double; let margin: Double
    }

    private var metrics: [Metric] {
        menu.map { m in
            let cost = costOf(m)
            let ratio = m.sellingPrice > 0 ? cost / m.sellingPrice * 100 : 0
            return Metric(id: m.id, name: m.name, price: m.sellingPrice, cost: cost,
                          ratio: ratio, margin: m.sellingPrice - cost)
        }
    }

    private var overItems: [Metric] {
        metrics.filter { $0.price > 0 && $0.ratio > goldenMax }.sorted { $0.ratio > $1.ratio }
    }
    private var topMargin: [Metric] {
        Array(metrics.sorted { $0.margin > $1.margin }.prefix(3))
    }

    public var body: some View {
        // 빈 카드 금지 — 메뉴 입력 전이면 렌더 안 함.
        if menu.isEmpty {
            EmptyView()
        } else {
            BUCard(.outer) {
                VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                    header
                    kpiRow
                    if !overItems.isEmpty { overSection }
                    topMarginSection
                    if let onManageRecipes { recipeButton(onManageRecipes) }
                    forwardNote
                }
            }
        }
    }
}

// MARK: - Sections

private extension MenuProfitabilityCard {

    var header: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle().fill(BUColor.midnight.opacity(0.12)).frame(width: 36, height: 36)
                Image(systemName: iconSF)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("\(noun) 수익성")
                    .buSectionEyebrowStyle()
                Text("판매가 · 원가 · 원가율 · 마진")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            Spacer()
        }
    }

    var kpiRow: some View {
        HStack(spacing: 8) {
            KpiTile(value: "\(menu.count)개", label: "\(noun) 수", tone: .midnight, sub: nil)
            KpiTile(value: String(format: "%.0f%%", avgRatio), label: "평균 원가율",
                    tone: avgRatioWarn ? .brick : .midnight, sub: "황금률 \(Int(goldenMax))%")
            KpiTile(value: "₩\(Int(avgPrice).formatted())", label: "평균 객단가", tone: .midnight, sub: nil)
        }
    }

    var overSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(BUColor.danger)
                Text("원가율 \(Int(goldenMax))% 초과 \(overItems.count)개")
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(BUColor.danger)
                    .tracking(0.4)
                    .textCase(.uppercase)
            }
            ForEach(overItems.prefix(3)) { m in
                let targetPrice = m.cost > 0 ? Int(ceil(m.cost / (goldenMax / 100) / 100) * 100) : 0
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(m.name)
                            .font(.system(size: 12.5, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                        Spacer()
                        Text(String(format: "%.0f%%", m.ratio))
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(BUColor.danger)
                    }
                    Text("₩\(Int(m.price).formatted()) 판매 · ₩\(Int(m.cost).formatted()) 원가 → 단가 ₩\(targetPrice.formatted()) 로 인상 권장")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.danger.opacity(0.75))
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.horizontal, 11)
                .padding(.vertical, 9)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.danger.opacity(0.04), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
                        .strokeBorder(BUColor.danger.opacity(0.18), lineWidth: 1)
                )
            }
        }
    }

    var topMarginSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                Text("마진 기여 상위")
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                    .tracking(0.4)
                    .textCase(.uppercase)
            }
            ForEach(topMargin) { m in
                HStack {
                    Text(m.name)
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                    Spacer()
                    Text("마진 ₩\(Int(m.margin).formatted()) · 원가율 \(Int(m.ratio))%")
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                }
                .padding(.horizontal, 11)
                .padding(.vertical, 7)
                .background(BUColor.midnight.opacity(0.025), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
            }
        }
    }

    func recipeButton(_ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: "list.bullet.rectangle").font(.system(size: 12, weight: .semibold))
                Text("메뉴 레시피 관리 · 원가율 · 재고 차감").font(.system(size: 12.5, weight: .semibold))
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold))
            }
            .foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    var forwardNote: some View {
        Text("판매량이 쌓이면 인기 × 수익으로 ‘스타·간판·퍼즐·정리’ 메뉴를 자동 분류합니다.")
            .font(.system(size: 10.5))
            .foregroundStyle(BUColor.inkSubtle)
            .lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 4)
    }
}

// MARK: - KPI Tile

private struct KpiTile: View {
    enum Tone { case midnight, brick }
    let value: String
    let label: String
    let tone: Tone
    let sub: String?

    private var valueColor: Color { tone == .brick ? BUColor.danger : BUColor.midnight }

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(valueColor)
                .tracking(-0.5)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(label)
                .font(.system(size: 10.5, weight: .semibold))
                .foregroundStyle(BUColor.ink)
            if let sub {
                Text(sub)
                    .font(.system(size: 9.5))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, BUSpacing.sm)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
    }
}
