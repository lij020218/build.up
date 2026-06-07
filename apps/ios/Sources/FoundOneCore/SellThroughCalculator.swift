//
//  SellThroughCalculator.swift — 소매 Sell-Through Rate 계산 SSOT (iOS)
//
//  웹 SSOT 1:1 포팅: packages/shared/src/finance/sell-through.ts
//
//  공식: sell-through = monthlySold / (stock + monthlySold) × 100
//    80%+ excellent (Lightspeed) · 60–80% healthy · <60% slow mover · <20% dead stock
//
//  출처: Lightspeed·Shopify·Square Retail·TruRating·i-boss·Fanruan (2026-05-13 검증)
//

import Foundation

// MARK: - Input

public struct SellThroughProduct: Sendable {
    public let id: String
    public let name: String
    public let category: String
    public let price: Double
    public let cost: Double
    public let stock: Double
    /// 실제 입력 시 그대로 사용. 0이면 호출측이 dailyUsage × 26 추정값 주입.
    public let monthlySold: Double
    /// 추정값 여부 (dailyUsage × 26 으로 채운 경우 true)
    public let isEstimated: Bool

    public init(
        id: String, name: String, category: String = "",
        price: Double, cost: Double, stock: Double,
        monthlySold: Double, isEstimated: Bool = false
    ) {
        self.id = id; self.name = name; self.category = category
        self.price = price; self.cost = cost; self.stock = stock
        self.monthlySold = monthlySold; self.isEstimated = isEstimated
    }
}

public struct ProductWithRate: Sendable {
    public let product: SellThroughProduct
    public let rate: Int
}

// MARK: - Calculations (mirrors sell-through.ts exactly)

public enum SellThroughCalculator {

    /// 단일 상품 sell-through rate (정수 %)
    public static func rate(_ p: SellThroughProduct) -> Int {
        let denom = p.stock + p.monthlySold
        guard denom > 0 else { return 0 }
        return Int((p.monthlySold / denom * 100).rounded())
    }

    /// 전체 상품 평균 sell-through rate
    public static func averageRate(_ products: [SellThroughProduct]) -> Int {
        guard !products.isEmpty else { return 0 }
        let sum = products.reduce(0) { $0 + rate($1) }
        return Int((Double(sum) / Double(products.count)).rounded())
    }

    /// Top N best seller (월 판매 수량 desc)
    public static func topSellers(_ products: [SellThroughProduct], n: Int = 5) -> [ProductWithRate] {
        products
            .map { ProductWithRate(product: $0, rate: rate($0)) }
            .sorted { $0.product.monthlySold > $1.product.monthlySold }
            .prefix(n)
            .map { $0 }
    }

    /// Dead stock: 재고 있는데 rate < 20 또는 monthlySold == 0
    public static func deadStock(_ products: [SellThroughProduct]) -> [ProductWithRate] {
        products
            .map { ProductWithRate(product: $0, rate: rate($0)) }
            .filter { $0.product.stock > 0 && ($0.rate < 20 || $0.product.monthlySold == 0) }
    }

    /// 품절 임박: top seller 중 stock / monthlySold < ratio (기본 0.3)
    public static func lowStock(_ products: [SellThroughProduct], ratio: Double = 0.3) -> [ProductWithRate] {
        products
            .map { ProductWithRate(product: $0, rate: rate($0)) }
            .filter { $0.product.monthlySold > 0 && $0.product.stock > 0
                        && $0.product.stock / $0.product.monthlySold < ratio }
    }

    /// Top N 상품 매출 비중 (전체 대비 %)
    public static func topNRevenueShare(_ products: [SellThroughProduct], n: Int = 5) -> (top: Double, total: Double, sharePct: Int) {
        let revenues = products.map { $0.monthlySold * $0.price }
        let total = revenues.reduce(0, +)
        let topN = revenues.sorted(by: >).prefix(n).reduce(0, +)
        let pct = total > 0 ? Int((topN / total * 100).rounded()) : 0
        return (topN, total, pct)
    }

    /// Dead stock 묶인 자본 (cost 기준, 원)
    public static func deadStockCapital(_ products: [SellThroughProduct]) -> Double {
        deadStock(products).reduce(0) { $0 + $1.product.stock * $1.product.cost }
    }
}

