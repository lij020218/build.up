//
//  MenuProfitabilityDetailSheet.swift — 메뉴 수익성 상세 팝업 (2026-07-22 사장님 지시)
//
//  웹 SSOT: apps/web/.../dashboard/MenuProfitabilityModal.tsx 완전 미러.
//  MenuRecipeSheet 의 [자세히 보기] → KPI(메뉴 수·평균 원가율·평균 객단가) +
//  원가율 황금률 초과 경보(인상 권장 단가) + 메뉴별 원가율·마진 전체 목록 + 마진 기여 상위.
//  원가 = RecipeCost SSOT(레시피 있으면 재료 합산).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

private let brick = Color(red: 0.71, green: 0.30, blue: 0.30)
private func won(_ n: Double) -> String { "₩\(Int(n.rounded()).formatted())" }

struct MenuProfitabilityDetailSheet: View {
    let menus: [BUInventoryItem]
    let materials: [BUInventoryItem]
    let goldenMax: Double
    let noun: String
    @Environment(\.dismiss) private var dismiss

    private struct Metric: Identifiable {
        let id: String; let name: String; let category: String
        let price: Double; let cost: Double; let ratio: Double; let margin: Double
        let sold: Double; let hasRecipe: Bool
    }

    private var metrics: [Metric] {
        menus.map { m in
            let cost = RecipeCost.menuCostPerServing(m, materials: materials)
            let ratio = m.sellingPrice > 0 ? cost / m.sellingPrice * 100 : 0
            return Metric(id: m.id, name: m.name, category: m.displayCategory ?? "",
                          price: m.sellingPrice, cost: cost, ratio: ratio,
                          margin: m.sellingPrice - cost, sold: m.monthlySold,
                          hasRecipe: !(m.recipe ?? []).isEmpty)
        }
    }

    private var totalRevenue: Double { metrics.reduce(0) { $0 + $1.price } }
    private var totalCost: Double { metrics.reduce(0) { $0 + $1.cost } }
    private var avgRatio: Double { totalRevenue > 0 ? totalCost / totalRevenue * 100 : 0 }
    private var avgPrice: Double { metrics.isEmpty ? 0 : totalRevenue / Double(metrics.count) }
    private var overItems: [Metric] { metrics.filter { $0.price > 0 && $0.ratio > goldenMax }.sorted { $0.ratio > $1.ratio } }
    private var topMargin: [Metric] { Array(metrics.sorted { $0.margin > $1.margin }.prefix(3)) }
    private var sorted: [Metric] { metrics.sorted { $0.ratio > $1.ratio } }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(spacing: BUSpacing.md) {
                        kpiCard
                        if !overItems.isEmpty { overCard }
                        detailCard
                        if !topMargin.isEmpty { topMarginCard }
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("\(noun) 수익성 상세")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight) } }
        }
        .presentationDragIndicator(.visible)
    }

    private var kpiCard: some View {
        BUCard(.outer) {
            HStack(spacing: 8) {
                kpiTile("\(noun) 수", "\(metrics.count)개", BUColor.midnight)
                kpiTile("평균 원가율", "\(Int(avgRatio.rounded()))%", avgRatio > goldenMax ? brick : BUColor.midnight, sub: "황금률 \(Int(goldenMax))%")
                kpiTile("평균 객단가", won(avgPrice), BUColor.midnight)
            }
        }
    }

    private func kpiTile(_ label: String, _ value: String, _ color: Color, sub: String? = nil) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 17, weight: .heavy)).foregroundStyle(color)
            Text(label).font(.system(size: 10.5, weight: .semibold)).foregroundStyle(BUColor.ink)
            if let sub { Text(sub).font(.system(size: 9)).foregroundStyle(BUColor.inkMuted) }
        }.frame(maxWidth: .infinity)
    }

    private var overCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 8) {
                Label("원가율 \(Int(goldenMax))% 초과 \(overItems.count)개", systemImage: "exclamationmark.triangle.fill")
                    .font(.system(size: 11, weight: .bold)).foregroundStyle(brick)
                ForEach(overItems) { m in
                    let target = m.cost > 0 ? Int((m.cost / (goldenMax / 100) / 100).rounded(.up)) * 100 : 0
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(m.name).font(.system(size: 12.5, weight: .bold)).foregroundStyle(BUColor.ink)
                            Spacer()
                            Text("\(Int(m.ratio.rounded()))%").font(.system(size: 12, weight: .heavy)).foregroundStyle(brick)
                        }
                        Text("\(won(m.price)) 판매 · \(won(m.cost)) 원가 → 단가 ₩\(target.formatted()) 로 인상 권장")
                            .font(.system(size: 11)).foregroundStyle(brick.opacity(0.75))
                    }
                    .padding(10)
                    .background(brick.opacity(0.03), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(brick.opacity(0.18), lineWidth: 1))
                }
            }
        }
    }

    private var detailCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 8) {
                Text("\(noun)별 원가율·마진")
                    .font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.midnight)
                ForEach(sorted) { m in
                    VStack(alignment: .leading, spacing: 5) {
                        HStack(spacing: 6) {
                            Text(m.name).font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink).lineLimit(1)
                            if !m.category.isEmpty {
                                Text(m.category).font(.system(size: 9.5, weight: .semibold))
                                    .foregroundStyle(BUColor.inkSecondary)
                                    .padding(.horizontal, 6).padding(.vertical, 1)
                                    .background(BUColor.midnight.opacity(0.06), in: Capsule())
                            }
                            Spacer()
                            if m.price > 0 {
                                Text("\(Int(m.ratio.rounded()))%")
                                    .font(.system(size: 12.5, weight: .heavy))
                                    .foregroundStyle(m.ratio > goldenMax ? brick : BUColor.midnight)
                            }
                        }
                        if m.price > 0 {
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Color.black.opacity(0.07))
                                    Capsule().fill(m.ratio > goldenMax ? brick : BUColor.midnight)
                                        .frame(width: geo.size.width * min(1, max(0, m.ratio / 100)))
                                }
                            }.frame(height: 3)
                        }
                        Text("판매 \(won(m.price)) · 원가 \(m.cost > 0 ? won(m.cost) : "미입력")\(m.hasRecipe ? " (레시피)" : "") · 마진 \(won(m.margin))\(m.sold > 0 ? " · 이달 \(Int(m.sold))개" : "")")
                            .font(.system(size: 10.5)).foregroundStyle(BUColor.inkSecondary)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }

    private var topMarginCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 8) {
                Label("마진 기여 상위", systemImage: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.midnight)
                ForEach(topMargin) { m in
                    HStack {
                        Text(m.name).font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                        Spacer()
                        Text("마진 \(won(m.margin)) · 원가율 \(Int(m.ratio.rounded()))%")
                            .font(.system(size: 11)).foregroundStyle(BUColor.inkSecondary)
                    }
                }
            }
        }
    }
}
