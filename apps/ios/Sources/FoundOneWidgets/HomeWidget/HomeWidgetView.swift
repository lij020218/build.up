//
//  HomeWidgetView.swift — 홈 화면 위젯 뷰 (small / medium / accessoryCircular)
//
//  사장님 잠금화면/홈화면에 노출:
//   • Small: 오늘 매출 + WoW chip
//   • Medium: + sparkline + 1개 행동
//   • accessoryCircular (잠금화면): 건강도 점수 게이지
//
//  실제 Widget Extension 의 EntryView 가 이 View 를 마운트.
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem

// MARK: - Small Widget

public struct HomeWidgetSmall: View {

    let snapshot: TodaySnapshot

    public init(snapshot: TodaySnapshot) {
        self.snapshot = snapshot
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("어제 매출".uppercased())
                .buEyebrowStyle()

            Text(formatKRW(snapshot.yesterdaySales))
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
                .tracking(-0.5)
                .monospacedDigit()
                .minimumScaleFactor(0.7)
                .lineLimit(1)

            if let pct = snapshot.weeklyChangePct {
                HStack(spacing: 3) {
                    Image(systemName: pct >= 0 ? "arrow.up.right" : "arrow.down.right")
                        .font(.system(size: 10, weight: .bold))
                    Text("\(pct >= 0 ? "+" : "")\(String(format: "%.0f", pct))%")
                        .font(BUFont.eyebrow)
                        .monospacedDigit()
                }
                .foregroundStyle(pct >= 0 ? BUColor.success : BUColor.danger)
            }

            Spacer(minLength: 0)

            if let grade = snapshot.healthGrade, let score = snapshot.healthScore {
                HStack(spacing: 5) {
                    Circle()
                        .fill(HealthColors.palette(for: grade).dot)
                        .frame(width: 6, height: 6)
                    Text("건강도 \(Int(score))점")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                }
            }
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Medium Widget

public struct HomeWidgetMedium: View {

    let snapshot: TodaySnapshot

    public init(snapshot: TodaySnapshot) {
        self.snapshot = snapshot
    }

    public var body: some View {
        HStack(spacing: BUSpacing.sm) {
            // Left: 매출 + 건강도
            VStack(alignment: .leading, spacing: 6) {
                Text("어제 매출".uppercased())
                    .buEyebrowStyle()

                Text(formatKRW(snapshot.yesterdaySales))
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .monospacedDigit()
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)

                if let pct = snapshot.weeklyChangePct {
                    HStack(spacing: 3) {
                        Image(systemName: pct >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 10, weight: .bold))
                        Text("\(pct >= 0 ? "+" : "")\(String(format: "%.0f", pct))% 주간")
                            .font(BUFont.eyebrow)
                            .monospacedDigit()
                    }
                    .foregroundStyle(pct >= 0 ? BUColor.success : BUColor.danger)
                }

                Spacer(minLength: 0)

                Text("일평균 \(formatKRW(snapshot.avgDaily7))")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // Right: 행동 + 건강도
            VStack(alignment: .leading, spacing: 4) {
                if let grade = snapshot.healthGrade, let score = snapshot.healthScore {
                    HStack(spacing: 5) {
                        Circle()
                            .fill(HealthColors.palette(for: grade).dot)
                            .frame(width: 7, height: 7)
                        Text("\(Int(score))점")
                            .font(BUFont.label)
                            .foregroundStyle(HealthColors.palette(for: grade).text)
                            .monospacedDigit()
                    }
                }
                Text("오늘의 행동".uppercased())
                    .buEyebrowStyle()
                Text(snapshot.heroAction)
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(3)
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(BUSpacing.sm + 2)
    }
}

// MARK: - Accessory Circular (잠금화면)

public struct HomeWidgetAccessoryCircular: View {

    let snapshot: TodaySnapshot

    public init(snapshot: TodaySnapshot) {
        self.snapshot = snapshot
    }

    public var body: some View {
        // 건강도 점수 게이지 (0-100)
        if let score = snapshot.healthScore, let grade = snapshot.healthGrade {
            ZStack {
                Circle()
                    .stroke(BUColor.inkSubtle, lineWidth: 4)
                Circle()
                    .trim(from: 0, to: score / 100)
                    .stroke(
                        HealthColors.palette(for: grade).dot,
                        style: StrokeStyle(lineWidth: 4, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(Int(score))")
                        .font(.system(size: 14, weight: .bold))
                        .monospacedDigit()
                    Text("건강")
                        .font(.system(size: 8, weight: .medium))
                }
            }
        } else {
            VStack(spacing: 0) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 16, weight: .bold))
                Text("입력")
                    .font(.system(size: 8, weight: .medium))
            }
        }
    }
}

// MARK: - Helpers

internal func formatKRW(_ value: Double) -> String {
    let v = Int(round(value))
    if v >= 100_000_000 {
        return "\(String(format: "%.1f", Double(v) / 100_000_000))억"
    }
    if v >= 10_000 {
        return "\(v / 10_000)만"
    }
    return v.formatted()
}

// MARK: - Preview

#if DEBUG
#Preview("HomeWidget Small") {
    HomeWidgetSmall(snapshot: .preview)
        #if os(iOS)
        .background(BUColor.surface)
        #endif
        .frame(width: 165, height: 165)
}

#Preview("HomeWidget Medium") {
    HomeWidgetMedium(snapshot: .preview)
        #if os(iOS)
        .background(BUColor.surface)
        #endif
        .frame(width: 345, height: 165)
}

#Preview("HomeWidget Circular") {
    HomeWidgetAccessoryCircular(snapshot: .preview)
        .frame(width: 60, height: 60)
}
#endif
