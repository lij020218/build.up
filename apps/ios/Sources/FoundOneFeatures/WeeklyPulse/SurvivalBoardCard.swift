//
//  SurvivalBoardCard.swift — Tier 2 경영 건강 지표 (웹 SurvivalBoardCard.tsx 미러)
//
//  웹 정확 사양:
//   • 카드: radius 20 / padding 20 / 180deg gradient
//   • 헤더: 제목 + SVG circle gauge (36×36, stroke 3)
//   • 2×2 그리드:
//     - MTD 매출 / MTD 손익 / 런웨이 / 주간 성장
//     - 각 셀: radius 16 / padding 14 / linear-gradient(180deg, #f7f8fe → #eef0fb)
//     - 라벨 11px / 0.08em / uppercase / muted
//     - value 18-26px / weight 700 / -0.025em
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents

// MARK: - SurvivalBoardCard

public struct SurvivalBoardCard: View {

    let mock: MockData
    let healthResult: UnifiedHealthResult
    let ko: Bool

    public init(mock: MockData, healthResult: UnifiedHealthResult, ko: Bool = true) {
        self.mock = mock
        self.healthResult = healthResult
        self.ko = ko
    }

    private var totalSales: Double { mock.entries.reduce(0) { $0 + $1.sales } }
    private var totalCosts: Double { mock.costs.total }
    private var netProfit: Double { totalSales - totalCosts }

    private var runwayMonths: Double {
        guard let cash = mock.currentCash else { return .nan }
        let burn = totalCosts - totalSales
        return burn > 0 ? cash / burn : 999
    }

    private var weeklyChange: Double {
        let sorted = mock.entries.sorted { $0.date < $1.date }
        guard sorted.count >= 14 else { return 0 }
        let r7 = sorted.suffix(7).reduce(0.0) { $0 + $1.sales }
        let p7 = sorted.suffix(14).prefix(7).reduce(0.0) { $0 + $1.sales }
        guard p7 > 0 else { return 0 }
        return ((r7 - p7) / p7) * 100
    }

    private var last14: [Double] {
        Array(mock.entries.sorted { $0.date < $1.date }.suffix(14).map { $0.sales })
    }
    private var last7: [Double] { Array(last14.suffix(7)) }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                headerSection
                gridSection
            }
        }
    }

    // MARK: Header

    private var headerSection: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(ko ? "경영 건강" : "Business Health")
                    .buSectionEyebrowStyle()
                Text(ko ? "이번 주 핵심 지표 4개" : "Weekly Core Metrics")
                    .buDetailTitleStyle()
            }
            Spacer()
            if healthResult.ready {
                HealthGaugeRing(score: healthResult.score, grade: healthResult.grade)
            }
        }
    }

    // MARK: 2×2 Grid

    private var gridSection: some View {
        LazyVGrid(
            columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)],
            spacing: 8
        ) {
            // MTD 매출
            SurvivalMetricCell(
                label: ko ? "MTD 매출" : "MTD Revenue",
                value: formatKRWCompact(totalSales),
                note: totalSales > 0
                    ? (ko ? "일평균 \(formatKRWCompact(totalSales / Double(max(1, Date.dayOfMonth))))" : "Daily avg")
                    : (ko ? "데이터 없음" : "No data"),
                valueColor: totalSales > 0 ? BUColor.ink : BUColor.inkSubtle,
                sparkline: !last14.isEmpty ? last14 : nil,
                sparkColor: BUColor.midnight
            )

            // MTD 손익
            SurvivalMetricCell(
                label: ko ? "MTD 손익" : "MTD P&L",
                value: totalSales == 0 && totalCosts == 0
                    ? "—"
                    : "\(netProfit >= 0 ? "+" : "")\(formatKRWCompact(netProfit))",
                note: totalCosts > 0
                    ? (ko ? "비용 \(formatKRWCompact(totalCosts))" : "Costs")
                    : (ko ? "비용 미입력" : "No costs"),
                valueColor: netProfit >= 0 ? BUColor.success : BUColor.danger,
                sparkline: nil
            )

            // 런웨이
            SurvivalMetricCell(
                label: ko ? "런웨이" : "Runway",
                value: runwayMonths.isNaN
                    ? "—"
                    : runwayMonths < 0
                      ? (ko ? "흑자" : "Surplus")
                      : "\(Int(round(runwayMonths)))\(ko ? "개월" : "mo")",
                note: mock.currentCash != nil
                    ? (ko ? "현금 \(formatKRWCompact(mock.currentCash ?? 0))" : "Cash")
                    : (ko ? "현금 미입력" : "No cash"),
                valueColor: runwayMonths >= 0 && runwayMonths <= 3 ? BUColor.danger
                          : runwayMonths <= 6 ? BUColor.warn
                          : BUColor.ink,
                sparkline: nil
            )

            // 주간 성장
            SurvivalMetricCell(
                label: ko ? "주간 성장" : "Weekly",
                value: "\(weeklyChange >= 0 ? "+" : "")\(String(format: "%.0f", weeklyChange))%",
                note: ko ? "7일 vs 직전 7일" : "7d vs prev",
                valueColor: weeklyChange >= 0 ? BUColor.success : BUColor.danger,
                sparkline: !last7.isEmpty ? last7 : nil,
                sparkColor: weeklyChange >= 0 ? BUColor.success : BUColor.danger
            )
        }
    }
}

// MARK: - SurvivalMetricCell (16 radius inner block)

private struct SurvivalMetricCell: View {
    let label: String
    let value: String
    let note: String
    let valueColor: Color
    var sparkline: [Double]? = nil
    var sparkColor: Color = BUColor.midnight

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
                .lineLimit(1)
            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(valueColor)
                .tracking(-0.5)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(note)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            if let series = sparkline, series.count >= 2 {
                MiniSparkline(values: series, color: sparkColor)
                    .frame(height: 22)
                    .padding(.top, 2)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [
                    BUColor.heroGradientStart,
                    BUColor.heroGradientMid,
                ],
                startPoint: .top,
                endPoint: .bottom
            ),
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.05), lineWidth: 0.8)
        )
    }
}

// MARK: - MiniSparkline (cell 안 작은 sparkline)

private struct MiniSparkline: View {
    let values: [Double]
    let color: Color

    var body: some View {
        GeometryReader { geo in
            let maxV = (values.max() ?? 1) * 1.1
            let minV = max(0, (values.min() ?? 0) * 0.9)
            let range = max(maxV - minV, 1)
            let dx = geo.size.width / CGFloat(max(values.count - 1, 1))

            ZStack {
                // Fill
                Path { p in
                    p.move(to: CGPoint(x: 0, y: geo.size.height))
                    for (i, v) in values.enumerated() {
                        let x = CGFloat(i) * dx
                        let y = geo.size.height * (1 - CGFloat((v - minV) / range))
                        p.addLine(to: CGPoint(x: x, y: y))
                    }
                    p.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height))
                    p.closeSubpath()
                }
                .fill(
                    LinearGradient(
                        colors: [color.opacity(0.25), color.opacity(0.0)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                // Line
                Path { p in
                    for (i, v) in values.enumerated() {
                        let x = CGFloat(i) * dx
                        let y = geo.size.height * (1 - CGFloat((v - minV) / range))
                        if i == 0 { p.move(to: CGPoint(x: x, y: y)) }
                        else { p.addLine(to: CGPoint(x: x, y: y)) }
                    }
                }
                .stroke(color, style: StrokeStyle(lineWidth: 1.5, lineCap: .round, lineJoin: .round))
            }
        }
    }
}

// MARK: - Health Gauge Ring (SVG circle gauge 미러)

private struct HealthGaugeRing: View {
    let score: Double
    let grade: HealthGrade

    private var color: Color { HealthColors.palette(for: grade).dot }
    private var ratio: CGFloat {
        guard score.isFinite else { return 0 }
        return CGFloat(min(max(score / 100, 0), 1))
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(BUColor.midnight.opacity(0.10), lineWidth: 3)
            Circle()
                .trim(from: 0, to: ratio)
                .stroke(color, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(Int(round(score)))")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(color)
                .monospacedDigit()
        }
        .frame(width: 38, height: 38)
    }
}

// MARK: - Helpers

private extension Date {
    static var dayOfMonth: Int {
        Calendar(identifier: .gregorian).component(.day, from: Date())
    }
}

private func formatKRWCompact(_ value: Double) -> String {
    let v = Int(round(value))
    let abs = Swift.abs(v)
    let sign = v < 0 ? "-" : ""
    if abs >= 100_000_000 {
        return "\(sign)\(String(format: "%.1f", Double(abs) / 100_000_000))억"
    }
    if abs >= 10_000 {
        return "\(sign)\(abs / 10_000)만"
    }
    return "\(sign)\(abs.formatted())"
}

// MARK: - Preview

#if DEBUG
#Preview("SurvivalBoard — 안정") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            SurvivalBoardCard(
                mock: .healthyRestaurant,
                healthResult: HealthScore.calculate(
                    entries: MockData.healthyRestaurant.entries,
                    costs: MockData.healthyRestaurant.costs,
                    category: .restaurant,
                    stage: .growth,
                    currentCash: 35_000_000
                )
            )
            .padding(BUSpacing.md)
        }
    }
}
#endif
