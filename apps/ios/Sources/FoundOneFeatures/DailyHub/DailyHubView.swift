//
//  DailyHubView.swift — Tier 1.2 통합 (웹 sections/Tier1DailyHub.tsx 미러)
//
//  웹 카드 순서:
//   1. DailyKpiStrip (5칸 KPI 가로 strip)
//   2. ActivitySnapshotCard (매출 흐름 7일 막대)
//   3. CashflowHeroCard (현금 잔고 14일 timeline)
//   4. PLHeroCard (손익 + 비용 비율)
//
//  모바일 적응:
//   • 모든 카드 세로 1-col 스택
//   • DailyKpiStrip 만 가로 스크롤 (edge-to-edge)
//   • Tier 간 gap 18pt (shellGap)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents

// MARK: - DailyHubView

public struct DailyHubView: View {

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

    private var kpiCells: [KpiCellData] {
        // ⚠️ 2026-05-25 fix: 이전 `.sorted.last` 는 "가장 최근 entry" 라 어제 미입력 시
        //    3일 전 데이터가 "어제 매출" 로 표시되는 거짓말 버그. 정확히 어제 날짜로 검색.
        let yesterdayEntry = mock.entries.yesterdayEntry()
        let yesterdaySales = yesterdayEntry?.sales ?? 0
        let yesterdayCust = yesterdayEntry?.customers ?? 0
        let avgTicket = yesterdayCust > 0 ? yesterdaySales / Double(yesterdayCust) : 0
        let runwayMonths: Double = {
            guard let cash = mock.currentCash, mock.costs.total > 0 else { return .nan }
            let monthlyBurn = mock.costs.total - ratios.monthlyRevenueEquivalent
            return monthlyBurn > 0 ? cash / monthlyBurn : 99
        }()

        return [
            .init(label: "어제매출", value: yesterdaySales, grade: yesterdaySales > 0 ? .healthy : .unknown, unit: "원"),
            .init(label: "어제고객", value: Double(yesterdayCust), grade: yesterdayCust > 0 ? .healthy : .unknown, unit: "명"),
            .init(label: "원가율", value: ratios.primeCostRatio,
                  grade: IndustryThresholds.thresholds(for: mock.category).primeCost?.grade(ratios.primeCostRatio) ?? .unknown,
                  unit: "%"),
            .init(label: "런웨이", value: runwayMonths.isFinite ? runwayMonths : nil,
                  displayOverride: runwayMonths.isFinite ? nil : "—",
                  grade: HealthGrade.from(score: runwayMonths * 10), unit: "개월"),
            .init(label: "객단가", value: avgTicket, grade: avgTicket > 0 ? .healthy : .unknown, unit: "원"),
        ]
    }

    private var bepDailySales: Double {
        let totalCosts = mock.costs.total
        return totalCosts > 0 ? totalCosts / 26 : 0
    }

    private var projected14: [Double] {
        guard let cash = mock.currentCash else { return [] }
        let avgDaily = ratios.monthlyRevenueEquivalent / 26
        let dailyBurn = mock.costs.total / 26
        let dailyNet = avgDaily - dailyBurn
        return (0..<14).map { day in
            cash + dailyNet * Double(day)
        }
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: BUSpacing.shellGap) {
                sectionEyebrow

                DailyKpiStrip(cells: kpiCells)

                ActivitySnapshotCard(
                    entries: mock.entries,
                    bepDailySales: bepDailySales
                )

                CashflowHeroCard(
                    currentBalance: mock.currentCash ?? 0,
                    projectedBalances: projected14,
                    isCrisis: projected14.last ?? 0 < 0,
                    crisisDaysUntil: crisisDaysUntil()
                )

                if mock.category != .startupTech {
                    PLHeroCard(
                        totalSales: ratios.monthlyRevenueEquivalent,
                        totalCosts: mock.costs.total,
                        ingredientRatio: ratios.ingredientRatio,
                        laborRatio: ratios.laborRatio,
                        rentRatio: ratios.rentRatio,
                        thresholds: IndustryThresholds.thresholds(for: mock.category)
                    )
                }

                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.md)
        }
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 이 풀스크린으로 깖.
    }

    private var sectionEyebrow: some View {
        HStack(spacing: 6) {
            Image(systemName: "sun.haze.fill")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(BUColor.midnight.opacity(0.7))
            Text("매일 30초 점검")
                .buSectionEyebrowStyle()
            Spacer()
        }
        .padding(.top, 4)
    }

    private func crisisDaysUntil() -> Int? {
        guard !projected14.isEmpty else { return nil }
        for (idx, b) in projected14.enumerated() where b < 0 {
            return idx
        }
        return nil
    }
}

// MARK: - Preview

#if DEBUG
#Preview("DailyHub — 안정 운영") {
    DailyHubView(mock: .healthyRestaurant)
}

#Preview("DailyHub — 주의 신호") {
    DailyHubView(mock: .warningCafe)
}

#Preview("DailyHub — 긴급 위기") {
    DailyHubView(mock: .criticalSaaS)
}
#endif
