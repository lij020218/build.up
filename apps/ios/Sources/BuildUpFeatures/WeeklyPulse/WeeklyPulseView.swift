//
//  WeeklyPulseView.swift — Tier 2 통합 (웹 sections/Tier2WeeklyPulse.tsx 미러)
//
//  웹 카드 순서:
//   1. SurvivalBoardCard — 4셀 + 헬스 게이지
//   2. Cashflow13WeekForecastCard — 13주 잔고 예측
//   3. CostStructureCard — 비용 구조 (외식만)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents

public struct WeeklyPulseView: View {

    let mock: MockData

    public init(mock: MockData) {
        self.mock = mock
    }

    private var ratios: CostRatiosResult {
        CostRatios.calculate(
            costs: mock.costs,
            totalRevenue: mock.entries.reduce(0) { $0 + $1.sales },
            days: mock.entries.count
        )
    }

    private var healthResult: UnifiedHealthResult {
        HealthScore.calculate(
            entries: mock.entries,
            costs: mock.costs,
            category: mock.category,
            stage: mock.stage,
            currentCash: mock.currentCash
        )
    }

    private var weeklyBalances: [Double] {
        guard let cash = mock.currentCash else { return [] }
        let weeklyNet = (ratios.monthlyRevenueEquivalent - mock.costs.total) / 4.33
        return (0..<13).map { week in
            cash + weeklyNet * Double(week)
        }
    }

    private var isCrisis: Bool {
        weeklyBalances.contains(where: { $0 < 0 })
    }

    public var body: some View {
        GeometryReader { proxy in
            ZStack {
                BUBackgroundSurface()

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: BUSpacing.shellGap) {
                        sectionEyebrow

                        SurvivalBoardCard(
                            mock: mock,
                            healthResult: healthResult
                        )

                        if !weeklyBalances.isEmpty {
                            Cashflow13WeekCard(
                                currentBalance: mock.currentCash ?? 0,
                                weeklyBalances: weeklyBalances,
                                isCrisis: isCrisis
                            )
                        }

                        if ratios.ready && mock.category != .startupTech {
                            CostStructureCard(
                                ingredientRatio: ratios.ingredientRatio,
                                laborRatio: ratios.laborRatio,
                                rentRatio: ratios.rentRatio,
                                primeCostRatio: ratios.primeCostRatio,
                                thresholds: IndustryThresholds.thresholds(for: mock.category)
                            )
                        }

                        Spacer(minLength: 110)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.xl + proxy.safeAreaInsets.top)
                    .padding(.bottom, BUSpacing.md)
                    .frame(width: proxy.size.width)
                }
                .frame(width: proxy.size.width)
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
    }

    private var sectionEyebrow: some View {
        HStack(spacing: 6) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(BUColor.midnight.opacity(0.7))
            Text("이번 주 점검")
                .buSectionEyebrowStyle()
            Spacer()
        }
        .padding(.top, 4)
    }
}

#if DEBUG
#Preview("WeeklyPulse — 위기") {
    WeeklyPulseView(mock: .criticalSaaS)
}
#Preview("WeeklyPulse — 안정") {
    WeeklyPulseView(mock: .healthyRestaurant)
}
#endif
