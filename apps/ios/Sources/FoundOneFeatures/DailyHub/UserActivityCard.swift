//
//  UserActivityCard.swift — 고객 변화 카드 (웹 UserActivityCard.tsx 미러)
//
//  웹 정확 사양:
//   • Hero: 누적 고객수 40px / 700 / -0.045em / midnightDeep + 단위 "명" 16px
//   • Trend chip: rgba(52,199,89,0.10) bg, success color
//   • Milestone next: 다음 목표 (10/50/100/500/1000명…) + 진행도
//   • 3 mini stat: 신규 / 재방문률 / 객단가
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents

// MARK: - UserActivityCard

public struct UserActivityCard: View {

    let totalCustomers: Int
    let newThisMonth: Int          // 이번 달 신규
    let repeatRate: Double         // 재방문률 (0-100)
    let avgTicket: Double          // 객단가
    let ko: Bool

    public init(
        totalCustomers: Int,
        newThisMonth: Int,
        repeatRate: Double,
        avgTicket: Double,
        ko: Bool = true
    ) {
        self.totalCustomers = totalCustomers
        self.newThisMonth = newThisMonth
        self.repeatRate = repeatRate
        self.avgTicket = avgTicket
        self.ko = ko
    }

    private let milestones: [(target: Int, label: String)] = [
        (10, "첫 10명"), (50, "50명 돌파"), (100, "100명 클럽"),
        (500, "500명 돌파"), (1_000, "1,000명"),
        (5_000, "5,000명"), (10_000, "10,000명"),
    ]

    private var nextMilestone: (target: Int, label: String)? {
        milestones.first { totalCustomers < $0.target }
    }

    private var milestoneProgress: Double {
        guard let next = nextMilestone else { return 1.0 }
        let prev = milestones.last { $0.target < next.target }?.target ?? 0
        let denom = max(1, next.target - prev)
        let numer = max(0, totalCustomers - prev)
        return min(1.0, Double(numer) / Double(denom))
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                headerSection
                heroSection
                if let next = nextMilestone {
                    milestoneSection(next: next)
                }
                statsRowSection
            }
        }
    }

    // MARK: Header

    private var headerSection: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(BUColor.midnight08)
                    .frame(width: 36, height: 36)
                Image(systemName: "person.2.fill")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(ko ? "고객 변화" : "Customers")
                    .buSectionEyebrowStyle()
                Text(ko ? "단골 한 명 한 명이 자산" : "Each customer = asset")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            Spacer()
        }
    }

    // MARK: Hero — 누적 고객수

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(ko ? "누적 고객" : "Total")
                .font(.system(size: 10.5, weight: .bold))
                .foregroundStyle(BUColor.midnight.opacity(0.65))
                .tracking(0.6)
                .textCase(.uppercase)

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(totalCustomers.formatted())
                    .font(.system(size: 34, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .tracking(-1.5)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Text(ko ? "명" : "")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.inkSecondary)

                Spacer(minLength: 0)

                if newThisMonth > 0 {
                    HStack(spacing: 3) {
                        Image(systemName: "plus")
                            .font(.system(size: 9, weight: .heavy))
                        Text("\(newThisMonth)")
                            .font(.system(size: 11.5, weight: .bold))
                            .monospacedDigit()
                        Text(ko ? "명" : "")
                            .font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(BUColor.success)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 3)
                    .background(BUColor.success.opacity(0.10), in: Capsule())
                    .fixedSize()
                }
            }
        }
    }

    // MARK: Milestone

    private func milestoneSection(next: (target: Int, label: String)) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 6) {
                Image(systemName: "flag.fill")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                Text(ko ? "다음 \(next.label)" : "Next: \(next.target)")
                    .font(.system(size: 11.5, weight: .bold))
                    .foregroundStyle(BUColor.ink.opacity(0.75))
                Spacer()
                Text("\(totalCustomers.formatted()) / \(next.target.formatted())")
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)
                    .monospacedDigit()
            }

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(BUColor.midnight08)
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [BUColor.midnight, BUColor.auroraBlue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * CGFloat(milestoneProgress))
                }
            }
            .frame(height: 5)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
        .background(
            LinearGradient(
                colors: [
                    BUColor.midnight.opacity(0.04),
                    BUColor.auroraBlue.opacity(0.05),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
    }

    // MARK: 3-stat row

    private var statsRowSection: some View {
        HStack(spacing: 6) {
            statTile(
                label: ko ? "신규" : "New",
                value: "+\(newThisMonth)",
                unit: ko ? "명" : "",
                tint: BUColor.success
            )
            statTile(
                label: ko ? "재방문" : "Repeat",
                value: String(format: "%.0f%%", repeatRate),
                unit: "",
                tint: repeatRate >= 30 ? BUColor.success : BUColor.warn
            )
            statTile(
                label: ko ? "객단가" : "ARPU",
                value: formatKRWCompact(avgTicket),
                unit: ko ? "원" : "",
                tint: BUColor.midnight
            )
        }
    }

    private func statTile(label: String, value: String, unit: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
                .textCase(.uppercase)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(tint)
                    .tracking(-0.5)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1)
        )
    }
}

// MARK: - Helpers

private func formatKRWCompact(_ value: Double) -> String {
    let v = Int(round(value))
    if v >= 100_000_000 { return "\(String(format: "%.1f", Double(v) / 100_000_000))억" }
    if v >= 10_000 { return "\(v / 10_000)만" }
    return v.formatted()
}

// MARK: - Preview

#if DEBUG
#Preview("UserActivityCard") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            UserActivityCard(
                totalCustomers: 847,
                newThisMonth: 32,
                repeatRate: 42,
                avgTicket: 27_500
            )
            .padding(BUSpacing.md)
        }
    }
}
#endif
