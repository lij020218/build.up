//
//  FinanceSim.swift — 12개월 재무 투영 SSOT (2026-07-24 재무 페이지)
//
//  웹 SSOT: apps/web/app/lib/finance-sim.ts 완전 미러 (수식 드리프트 금지).
//  정직성: 예측이 아니라 "가정 유지 시 산술 결과". 화면에 가정 라벨 병기 필수.
//

import Foundation

public enum FinanceSim {

    public struct MonthPoint: Sendable {
        public let month: Int      // 1..12
        public let sales: Double
        public let net: Double
        public let endCash: Double
    }

    public struct Result: Sendable {
        public let points: [MonthPoint]
        public let cashOutMonth: Int?     // 현금 첫 음수 월
        public let breakEvenMonth: Int?   // 월 순익 첫 0 이상 월
        public let finalCash: Double
        public let shortfall: Double?     // 소진 시점 누적 부족액(양수)
    }

    public struct GrowthScenario: Sendable {
        public let id: String
        public let growthRatePct: Double
        public let labelKo: String
    }

    /// 보수/기준/낙관 — 웹 GROWTH_SCENARIOS 미러.
    public static let scenarios: [GrowthScenario] = [
        .init(id: "conservative", growthRatePct: -2, labelKo: "보수 (월 -2%)"),
        .init(id: "base", growthRatePct: 0, labelKo: "기준 (현재 유지)"),
        .init(id: "optimistic", growthRatePct: 3, labelKo: "낙관 (월 +3%)"),
    ]

    public static func projectTwelveMonths(
        startCash: Double,
        monthlySales: Double,
        variableCostRatio: Double,
        monthlyFixedCosts: Double,
        growthRatePct: Double
    ) -> Result {
        let start = max(0, startCash)
        let ratio = min(1, max(0, variableCostRatio))
        let fixed = max(0, monthlyFixedCosts)
        let g = growthRatePct / 100

        var points: [MonthPoint] = []
        var cash = start
        var cashOutMonth: Int? = nil
        var breakEvenMonth: Int? = nil
        var shortfall: Double? = nil

        for m in 1...12 {
            let sales = max(0, monthlySales * pow(1 + g, Double(m - 1)))
            let net = sales - sales * ratio - fixed
            cash += net
            if breakEvenMonth == nil && net >= 0 { breakEvenMonth = m }
            if cashOutMonth == nil && cash < 0 {
                cashOutMonth = m
                shortfall = abs(cash)
            }
            points.append(.init(month: m, sales: sales.rounded(), net: net.rounded(), endCash: cash.rounded()))
        }
        return .init(points: points, cashOutMonth: cashOutMonth, breakEvenMonth: breakEvenMonth,
                     finalCash: cash.rounded(), shortfall: shortfall.map { $0.rounded() })
    }
}
