//
//  Cashflow13WeekCard.swift — 13주 현금흐름 예측 (웹 Cashflow13WeekForecastCard.tsx 미러)
//
//  웹 정확 사양:
//   • 카드: radius 20 / padding 22 / 180deg gradient
//   • 헤더: 제목 + 위기 시 critical badge
//   • 핵심 지표 3개: 현재 잔고 / 13주 후 / 최저 잔고
//   • 13주 막대 차트 (각 막대: weekly inflow - outflow)
//   • AI 처방 (위기 시): 광고비 감액 / 공급처 연기 등
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents

// MARK: - Cashflow13WeekCard

public struct Cashflow13WeekCard: View {

    let currentBalance: Double
    let weeklyBalances: [Double]   // 13주 (week 0 = 현재)
    let isCrisis: Bool
    let ko: Bool

    public init(
        currentBalance: Double,
        weeklyBalances: [Double],
        isCrisis: Bool = false,
        ko: Bool = true
    ) {
        self.currentBalance = currentBalance
        self.weeklyBalances = weeklyBalances
        self.isCrisis = isCrisis
        self.ko = ko
    }

    private var thirteenWeekBalance: Double {
        weeklyBalances.last ?? currentBalance
    }
    private var lowestBalance: Double {
        weeklyBalances.min() ?? currentBalance
    }
    private var crisisWeek: Int? {
        for (i, b) in weeklyBalances.enumerated() where b < 0 {
            return i
        }
        return nil
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                headerSection
                metricsSection
                chartSection
                if isCrisis {
                    crisisPrescriptionSection
                }
            }
        }
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(ko ? "현금흐름 13주" : "Cashflow 13W")
                    .buSectionEyebrowStyle()
                Spacer()
                if isCrisis, let w = crisisWeek {
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 9))
                        Text("\(w)주 후 위기")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(0.4)
                    }
                    .foregroundStyle(BUColor.danger)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(BUColor.danger.opacity(0.10), in: Capsule())
                }
            }
            Text(ko ? "통장 잔고 91일 예측" : "91-day Balance Forecast")
                .buDetailTitleStyle()
        }
    }

    // MARK: 3 metrics

    private var metricsSection: some View {
        HStack(spacing: 8) {
            MetricTile(label: ko ? "현재" : "Now",
                       value: currentBalance,
                       tone: .neutral)
            MetricTile(label: ko ? "13주 후" : "13w",
                       value: thirteenWeekBalance,
                       tone: thirteenWeekBalance < 0 ? .crisis : thirteenWeekBalance < currentBalance * 0.3 ? .warning : .neutral)
            MetricTile(label: ko ? "최저" : "Lowest",
                       value: lowestBalance,
                       tone: lowestBalance < 0 ? .crisis : .warning)
        }
    }

    private var chartSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(ko ? "13주 잔고 추이" : "13-week trend")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.midnight.opacity(0.6))
                .tracking(1.0)
                .textCase(.uppercase)

            BUBarChart(
                bars: weeklyBalances.enumerated().map { idx, balance in
                    BUBarChart.Bar(
                        value: max(0, balance),
                        label: idx % 3 == 0 ? "W\(idx)" : nil,
                        tone: balance < 0 ? .negative : balance < currentBalance * 0.3 ? .neutral : .positive,
                        highlighted: idx == 0
                    )
                },
                height: 80,
                showLabels: true
            )
        }
    }

    private var crisisPrescriptionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "stethoscope")
                    .font(.system(size: 11, weight: .semibold))
                Text(ko ? "AI 처방 — 위기 회피 7가지" : "AI Solutions")
                    .font(.system(size: 11, weight: .bold))
                    .tracking(0.4)
                    .textCase(.uppercase)
            }
            .foregroundStyle(BUColor.danger)
            .padding(.top, 4)

            ForEach(prescriptions, id: \.self) { item in
                HStack(alignment: .top, spacing: 6) {
                    Text("•")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.danger.opacity(0.6))
                    Text(item)
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(BUColor.ink.opacity(0.75))
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(BUColor.danger.opacity(0.04), in: RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(BUColor.danger.opacity(0.18), lineWidth: 0.6)
        )
    }

    private var prescriptions: [String] {
        [
            "광고비 50% 감액 (즉시 효과)",
            "공급처 결제 14일 연기 협상",
            "긴급 운영자금 대출 검토",
        ]
    }
}

// MARK: - MetricTile

private struct MetricTile: View {
    enum Tone { case neutral, warning, crisis
        var color: Color {
            switch self {
            case .neutral: return BUColor.ink
            case .warning: return BUColor.warn
            case .crisis:  return BUColor.danger
            }
        }
    }

    let label: String
    let value: Double
    let tone: Tone

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label.uppercased())
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
            Text(formatBalance(value))
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(tone.color)
                .tracking(-0.5)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1))
    }

    private func formatBalance(_ value: Double) -> String {
        let abs = Swift.abs(value)
        let sign = value < 0 ? "-" : ""
        if abs >= 100_000_000 { return "\(sign)\(String(format: "%.1f", abs / 100_000_000))억" }
        if abs >= 10_000 { return "\(sign)\(Int(abs / 10_000))만" }
        return "\(sign)\(Int(abs))원"
    }
}

#if DEBUG
#Preview("Cashflow13W — 위기") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            Cashflow13WeekCard(
                currentBalance: 8_000_000,
                weeklyBalances: stride(from: 8_000_000.0, to: -10_000_000.0, by: -1_500_000).map { $0 },
                isCrisis: true
            )
            .padding(BUSpacing.md)
        }
    }
}
#endif
