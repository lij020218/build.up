//
//  RetailSellThroughCard.swift — 소매 Sell-Through + Best Seller + Dead Stock
//
//  웹 SSOT 1:1 포팅: RetailSellThroughCard.tsx (dashboard/sections/)
//
//  공식: sell-through = monthlySold / (stock + monthlySold) × 100
//    80%+ excellent · 60–80% healthy · <60% slow mover · <20% dead stock
//
//  데이터: BUInventoryItem(itemType=="product") → SellThroughCalculator
//  monthlySold == 0 && dailyUsage > 0 → dailyUsage × 26 추정 + 배지
//
//  출처: Lightspeed 5 KPIs · Shopify ABC · i-boss 의류매장 재고관리 (2026-05-13)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

// MARK: - Card

public struct RetailSellThroughCard: View {

    let items: [BUInventoryItem]

    public init(items: [BUInventoryItem]) {
        self.items = items
    }

    // 소매 상품만 필터 (material 제외)
    private var products: [SellThroughProduct] {
        items
            .filter { $0.itemType == "product" }
            .map { $0.toSellThroughProduct() }
    }

    private var hasEstimate: Bool {
        products.contains { $0.isEstimated }
    }

    public var body: some View {
        if products.isEmpty {
            emptyState
        } else {
            filledCard
        }
    }

    // MARK: Empty state

    private var emptyState: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                cardHeader(count: nil, avgRate: nil)
                Text("상품 데이터를 입력하면 sell-through rate + best seller + dead stock 분석이 시작됩니다 (내 가게 > 재고 관리)")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: Filled card

    private var filledCard: some View {
        let dead     = SellThroughCalculator.deadStock(products)
        let low      = SellThroughCalculator.lowStock(products)
        let top5     = SellThroughCalculator.topSellers(products, n: 5)
        let avgRate  = SellThroughCalculator.averageRate(products)
        let (_, _, top5Pct) = SellThroughCalculator.topNRevenueShare(products, n: 5)
        let action   = topAction(dead: dead, low: low, avgRate: avgRate, top5Pct: top5Pct)

        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                cardHeader(count: products.count, avgRate: avgRate)

                // 추정 배지
                if hasEstimate {
                    estimateBadge
                }

                // ① Stats row
                HStack(spacing: 8) {
                    statTile(label: "Dead Stock", value: "\(dead.count)개",
                             tone: dead.count >= 5 ? .critical : dead.count >= 1 ? .caution : .healthy,
                             icon: "exclamationmark.triangle")
                    statTile(label: "품절 임박", value: "\(low.count)개",
                             tone: low.count >= 3 ? .critical : low.count >= 1 ? .caution : .healthy,
                             icon: "shippingbox")
                    statTile(label: "Top5 매출%", value: "\(top5Pct)%",
                             tone: top5Pct > 70 ? .caution : .healthy,
                             icon: "chart.line.uptrend.xyaxis")
                }

                // ② Best Seller Top 5
                if !top5.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("TOP 5 BEST SELLER (월 판매 + SELL-THROUGH)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                            .tracking(0.5)

                        ForEach(Array(top5.enumerated()), id: \.offset) { i, p in
                            bestSellerRow(rank: i + 1, item: p)
                        }
                    }
                }

                // ③ 행동
                if let act = action {
                    actionBlock(act)
                }

                footerLabel
            }
        }
    }

    // MARK: Sub-views

    private func cardHeader(count: Int?, avgRate: Int?) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle().fill(BUColor.midnight.opacity(0.12)).frame(width: 36, height: 36)
                Image(systemName: "bag")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("SELL-THROUGH · 소매")
                    .buSectionEyebrowStyle()
                if let c = count, let r = avgRate {
                    Text("상품 \(c)개 · 평균 \(r)%")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
            Spacer()
        }
    }

    private var estimateBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 10, weight: .semibold))
            Text("일 사용량 × 26일 추정값 포함 — 월 판매 수량 입력 시 정확도 향상")
                .font(.system(size: 10.5, weight: .medium))
        }
        .foregroundStyle(BUColor.midnight.opacity(0.7))
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8))
    }

    private func statTile(label: String, value: String, tone: HealthGrade, icon: String) -> some View {
        let palette = HealthColors.palette(for: tone)
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 3) {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(palette.dot)
                Text(label.uppercased())
                    .font(.system(size: 9.5, weight: .bold))
                    .foregroundStyle(palette.dot)
                    .tracking(0.3)
            }
            Text(value)
                .font(.system(size: 19, weight: .bold))
                .foregroundStyle(palette.text)
                .monospacedDigit()
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.dot.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(palette.dot.opacity(0.18), lineWidth: 1))
    }

    private func bestSellerRow(rank: Int, item: ProductWithRate) -> some View {
        let rateColor: Color = item.rate >= 80 ? HealthColors.palette(for: .healthy).text
            : item.rate >= 60 ? HealthColors.palette(for: .caution).text
            : HealthColors.palette(for: .critical).text
        return HStack(spacing: 10) {
            Text("\(rank)")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(BUColor.inkMuted)
                .frame(width: 16)
            Text(item.product.name)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)
            Spacer()
            if item.product.isEstimated {
                Text("추정")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(BUColor.midnight.opacity(0.55))
                    .padding(.horizontal, 5)
                    .padding(.vertical, 2)
                    .background(BUColor.midnight.opacity(0.07), in: Capsule())
            }
            Text("\(Int(item.product.monthlySold))개/월")
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
                .monospacedDigit()
            Text("\(item.rate)%")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(rateColor)
                .monospacedDigit()
                .frame(minWidth: 38, alignment: .trailing)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(BUColor.ink.opacity(0.02), in: RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(BUColor.midnight.opacity(0.06), lineWidth: 1))
    }

    private func actionBlock(_ act: TopAction) -> some View {
        let palette = HealthColors.palette(for: act.grade)
        return VStack(alignment: .leading, spacing: 6) {
            Text("오늘 가장 중요한 행동")
                .font(.system(size: 10.5, weight: .bold))
                .foregroundStyle(palette.dot)
                .tracking(0.5)
            Text(act.headline)
                .font(.system(size: 13.5, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            Text(act.body)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(palette.dot.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(palette.dot.opacity(0.18), lineWidth: 1))
    }

    private var footerLabel: some View {
        HStack(spacing: 4) {
            Image(systemName: "sparkles")
                .font(.system(size: 10, weight: .regular))
                .foregroundStyle(BUColor.midnight.opacity(0.5))
            Text("Lightspeed sell-through + Shopify ABC + i-boss 의류매장 — 한국 SaaS 거의 부재 차별점")
                .font(.system(size: 10.5, weight: .regular))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.ink.opacity(0.03), in: RoundedRectangle(cornerRadius: 8))
    }

    // MARK: Top Action logic (mirrors RetailSellThroughCard.tsx)

    private struct TopAction {
        let grade: HealthGrade
        let headline: String
        let body: String
    }

    private func topAction(dead: [ProductWithRate], low: [ProductWithRate], avgRate: Int, top5Pct: Int) -> TopAction? {
        if dead.count >= 5 {
            let capital = Int(SellThroughCalculator.deadStockCapital(products) / 10000)
            return TopAction(
                grade: .critical,
                headline: "Dead stock \(dead.count)개 — 자본 약 \(capital.formatted())만원 묶임",
                body: "이번 주: ① 30%+ 할인·번들·온라인 처분 ② 단종 결정 (cost 회수 우선) ③ 추후 발주 ABC analysis 도입"
            )
        } else if low.count >= 3 {
            return TopAction(
                grade: .critical,
                headline: "품절 임박 \(low.count)개 — 매출 손실 risk",
                body: "오늘: ① 공급처 발주 + 리드타임 확인 ② best seller 안전 재고 (lead time + 7일 buffer) 정책 도입"
            )
        } else if avgRate < 40 && products.count >= 5 {
            return TopAction(
                grade: .caution,
                headline: "전체 평균 sell-through \(avgRate)% — Lightspeed 표준 60% 미달",
                body: "이번 달: ① top 5 매출 비중 분석 (현재 \(top5Pct)%) ② Pareto 80/20 적용 — 하위 30% 단종"
            )
        } else if top5Pct > 60 {
            return TopAction(
                grade: .caution,
                headline: "Top 5 매출 비중 \(top5Pct)% — 집중 risk",
                body: "이번 분기: ① top seller 공급처 backup ② mid-tier 상품 마케팅 강화 (의존도 분산)"
            )
        } else if avgRate >= 70 {
            return TopAction(
                grade: .healthy,
                headline: "평균 sell-through \(avgRate)% — Lightspeed 상위 quartile",
                body: "이번 분기: 신규 상품 라인 확장 (인접 카테고리·시즌)"
            )
        }
        return nil
    }
}

// MARK: - Preview

#if DEBUG
#Preview("RetailSellThrough — 데이터 있음") {
    // init 인수 순서: name, quantity, unit, minThreshold, unitCost, category, itemType, sellingPrice, leadTimeDays, dailyUsage, monthlySold
    let items: [BUInventoryItem] = [
        BUInventoryItem(name: "청바지 슬림핏", quantity: 30, unitCost: 20000, itemType: "product", sellingPrice: 59000, monthlySold: 45),
        BUInventoryItem(name: "화이트 티셔츠", quantity: 5,  unitCost: 8000,  itemType: "product", sellingPrice: 29000, monthlySold: 60),
        BUInventoryItem(name: "린넨 셔츠",     quantity: 20, unitCost: 28000, itemType: "product", sellingPrice: 79000, monthlySold: 8),
        BUInventoryItem(name: "카고 팬츠",     quantity: 50, unitCost: 25000, itemType: "product", sellingPrice: 69000, monthlySold: 2),
        BUInventoryItem(name: "후드티",        quantity: 12, unitCost: 15000, itemType: "product", sellingPrice: 49000, monthlySold: 30),
        BUInventoryItem(name: "봄 재킷",       quantity: 25, unitCost: 50000, itemType: "product", sellingPrice: 129000, monthlySold: 0),
    ]
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            RetailSellThroughCard(items: items)
                .padding(BUSpacing.md)
        }
    }
}

#Preview("RetailSellThrough — 빈상태") {
    ZStack {
        BUBackgroundSurface()
        RetailSellThroughCard(items: [])
            .padding(BUSpacing.md)
    }
}
#endif
