//
//  CashflowHeroCard.swift — 현금흐름 레이더 카드 (웹 CashflowHeroCard.tsx 미러)
//
//  웹 정확 사양:
//   • opsCard: radius 20 / padding 22 / dual layer shadow
//   • 3개 잔고 tile (오늘 / 7일 후 / 14일 후) — gap 8, padding 10/12
//   • 14일 timeline 막대 차트 — 잔고 변동
//   • 위기 시 critical badge (rgba(255,59,48,0.10) bg)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents

// MARK: - CashflowHeroCard

public struct CashflowHeroCard: View {

    let currentBalance: Double
    let projectedBalances: [Double]   // 14일 잔고 예측
    let isCrisis: Bool
    let crisisDaysUntil: Int?
    let ko: Bool

    public init(
        currentBalance: Double,
        projectedBalances: [Double] = [],
        isCrisis: Bool = false,
        crisisDaysUntil: Int? = nil,
        ko: Bool = true
    ) {
        self.currentBalance = currentBalance
        self.projectedBalances = projectedBalances
        self.isCrisis = isCrisis
        self.crisisDaysUntil = crisisDaysUntil
        self.ko = ko
    }

    private var sevenDayBalance: Double {
        projectedBalances.count > 6 ? projectedBalances[6] : currentBalance
    }
    private var fourteenDayBalance: Double {
        projectedBalances.last ?? currentBalance
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                headerSection
                balanceTilesSection
                if !projectedBalances.isEmpty {
                    timelineSection
                }
            }
        }
    }

    // MARK: Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text(ko ? "현금 흐름" : "Cash Flow")
                    .buSectionEyebrowStyle()
                Spacer(minLength: 0)
                if isCrisis, let days = crisisDaysUntil {
                    CrisisBadge(daysUntil: days)
                }
            }
            Text(ko ? "통장 잔고 14일 예측" : "14-day Balance Forecast")
                .buDetailTitleStyle()
        }
    }

    // MARK: Balance tiles (3개)

    private var balanceTilesSection: some View {
        HStack(spacing: 8) {
            BalanceTile(
                label: ko ? "오늘" : "Today",
                value: currentBalance,
                tone: .neutral
            )
            BalanceTile(
                label: ko ? "7일 후" : "7d",
                value: sevenDayBalance,
                tone: tone(for: sevenDayBalance)
            )
            BalanceTile(
                label: ko ? "14일 후" : "14d",
                value: fourteenDayBalance,
                tone: tone(for: fourteenDayBalance)
            )
        }
    }

    // MARK: Timeline (14일 barchart)

    private var timelineSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(ko ? "14일 잔고 변동" : "14-day Balance")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.midnight.opacity(0.6))
                .tracking(1.0)
                .textCase(.uppercase)

            BUBarChart(
                bars: projectedBalances.enumerated().map { idx, balance in
                    BUBarChart.Bar(
                        value: max(0, balance),
                        label: idx % 3 == 0 ? "D+\(idx)" : nil,
                        tone: balance < currentBalance * 0.3 ? .negative : .positive,
                        highlighted: idx == 0
                    )
                },
                height: 80,
                showLabels: true
            )
        }
    }

    // MARK: Helpers

    private func tone(for balance: Double) -> BalanceTile.Tone {
        if balance < 0 { return .crisis }
        if balance < currentBalance * 0.3 { return .warning }
        return .neutral
    }
}

// MARK: - BalanceTile

private struct BalanceTile: View {

    enum Tone {
        case neutral, warning, crisis

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
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
                .textCase(.uppercase)

            Text(formatBalance(value))
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(tone.color)
                .tracking(-0.5)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            BUColor.midnight.opacity(0.03),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1)
        )
    }

    private func formatBalance(_ value: Double) -> String {
        let abs = Swift.abs(value)
        let sign = value < 0 ? "-" : ""
        if abs >= 100_000_000 {
            return "\(sign)\(String(format: "%.1f", abs / 100_000_000))억"
        }
        if abs >= 10_000 {
            return "\(sign)\(Int(abs / 10_000))만"
        }
        return "\(sign)\(Int(abs).formatted())원"
    }
}

// MARK: - CrisisBadge

private struct CrisisBadge: View {
    let daysUntil: Int

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 9, weight: .bold))
            Text("D-\(daysUntil)")
                .font(.system(size: 10, weight: .bold))
                .monospacedDigit()
                .tracking(0.4)
        }
        .foregroundStyle(BUColor.danger)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(BUColor.danger.opacity(0.10), in: Capsule())
    }
}

// MARK: - Preview

#if DEBUG
#Preview("CashflowHero — 정상") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            CashflowHeroCard(
                currentBalance: 35_000_000,
                projectedBalances: stride(from: 35_000_000.0, to: 28_000_000.0, by: -500_000).map { $0 },
                isCrisis: false
            )
            .padding(BUSpacing.md)
        }
    }
}

#Preview("CashflowHero — 위기") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            CashflowHeroCard(
                currentBalance: 8_000_000,
                projectedBalances: stride(from: 8_000_000.0, to: -2_000_000.0, by: -700_000).map { $0 },
                isCrisis: true,
                crisisDaysUntil: 7
            )
            .padding(BUSpacing.md)
        }
    }
}
#endif
