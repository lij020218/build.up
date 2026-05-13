//
//  ActivitySnapshotCard.swift — 매출 흐름 카드 (웹 ActivitySnapshotCard.tsx 미러)
//
//  웹 정확 사양:
//   • activityCard: radius 20 / padding 22 / 180deg gradient (#fff → #f7f8fe)
//   • activityTitle: 24px / weight 700 / -0.04em
//   • activityHero: clamp(26-32px) / weight 700 / -0.05em (오늘 매출 값)
//   • activityStatRail: mini stats (오늘 / 주간 / 월간) — radius 12, padding 12-14, bg rgba(25,25,112,0.03)
//   • activityChartWrap: height 138px / grid 7 columns / gap 10
//   • Bar: radius 10/10/3/3 / gradient / animation 0.45s
//   • BEP line (점선)
//
//  모바일 적응:
//   • padding 22 → 18 (1 col 화면 폭에 fit)
//   • chart height 138 → 120
//   • mini stat 3개 가로 → 모바일 viewport 폭에 따라 wrap
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents

// MARK: - ActivitySnapshotCard

public struct ActivitySnapshotCard: View {

    let entries: [DailyEntry]
    let bepDailySales: Double?    // 손익분기 일매출
    let ko: Bool

    public init(entries: [DailyEntry], bepDailySales: Double? = nil, ko: Bool = true) {
        self.entries = entries
        self.bepDailySales = bepDailySales
        self.ko = ko
    }

    private var last7: [DailyEntry] {
        Array(entries.sorted { $0.date < $1.date }.suffix(7))
    }

    private var todaySales: Double {
        last7.last?.sales ?? 0
    }

    private var weeklySales: Double {
        last7.reduce(0) { $0 + $1.sales }
    }

    private var monthlyEstimate: Double {
        guard !last7.isEmpty else { return 0 }
        let avg = weeklySales / Double(last7.count)
        return avg * 26  // 월 26영업일
    }

    private var weeklyChangePct: Double? {
        let sorted = entries.sorted { $0.date < $1.date }
        guard sorted.count >= 14 else { return nil }
        let r7 = sorted.suffix(7).reduce(0.0) { $0 + $1.sales }
        let p7 = sorted.suffix(14).prefix(7).reduce(0.0) { $0 + $1.sales }
        guard p7 > 0 else { return nil }
        return ((r7 - p7) / p7) * 100
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.activityGap) {
                // ── Header — 제목 + Hero 매출 ──
                headerSection

                // ── Mini stat rail (3개) ──
                statRailSection

                // ── 7일 막대 차트 ──
                chartSection
            }
        }
    }

    // MARK: Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(ko ? "매출 흐름" : "Revenue Flow")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.88)

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(formatKRW(todaySales))
                    .font(.system(size: 30, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .tracking(-1.5)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Text(ko ? "원" : "")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)

                Spacer(minLength: 0)

                if let pct = weeklyChangePct {
                    DeltaPill(pct: pct)
                }
            }
            Text(ko ? "오늘 매출" : "Today")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.88)
        }
    }

    // MARK: Stat rail

    private var statRailSection: some View {
        HStack(spacing: 8) {
            MiniStat(
                label: ko ? "주간" : "Weekly",
                value: formatKRWCompact(weeklySales),
                unit: ""
            )
            MiniStat(
                label: ko ? "월 추정" : "Monthly",
                value: formatKRWCompact(monthlyEstimate),
                unit: ""
            )
            MiniStat(
                label: ko ? "일평균" : "Avg",
                value: formatKRWCompact(weeklySales / max(1, Double(last7.count))),
                unit: ""
            )
        }
    }

    // MARK: Chart

    private var chartSection: some View {
        let bars = makeBars()
        return VStack(alignment: .leading, spacing: 6) {
            BUBarChart(
                bars: bars,
                height: 120,
                bepValue: bepDailySales,
                showLabels: true
            )

            if let bep = bepDailySales {
                HStack(spacing: 4) {
                    Rectangle()
                        .fill(BUColor.ink.opacity(0.18))
                        .frame(width: 12, height: 1)
                    Text(ko ? "손익분기 \(formatKRWCompact(bep))원" : "BEP \(formatKRWCompact(bep))")
                        .font(.system(size: 10.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                .padding(.top, 2)
            }
        }
    }

    private func makeBars() -> [BUBarChart.Bar] {
        let df = DateFormatter()
        df.locale = Locale(identifier: ko ? "ko_KR" : "en_US")
        df.dateFormat = "E"
        let parser = DateFormatter()
        parser.dateFormat = "yyyy-MM-dd"
        parser.timeZone = TimeZone(identifier: "Asia/Seoul")

        return last7.enumerated().map { idx, entry in
            let date = parser.date(from: entry.date)
            let label = date.map { df.string(from: $0) } ?? ""
            let isToday = idx == last7.count - 1

            let tone: BUBarChart.Bar.Tone = {
                if let bep = bepDailySales, entry.sales < bep { return .negative }
                return .positive
            }()

            return BUBarChart.Bar(
                value: entry.sales,
                label: label,
                tone: tone,
                highlighted: isToday
            )
        }
    }
}

// MARK: - MiniStat (activityMiniStat 미러)

private struct MiniStat: View {
    let label: String
    let value: String
    let unit: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
                .textCase(.uppercase)
                .lineLimit(1)

            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(BUColor.ink)
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
        .padding(.horizontal, 12)
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
}

// MARK: - DeltaPill

private struct DeltaPill: View {
    let pct: Double

    var body: some View {
        let positive = pct >= 0
        HStack(spacing: 3) {
            Image(systemName: positive ? "arrow.up.right" : "arrow.down.right")
                .font(.system(size: 9, weight: .heavy))
            Text("\(positive ? "+" : "")\(String(format: "%.1f", pct))%")
                .font(.system(size: 11, weight: .bold))
                .monospacedDigit()
        }
        .foregroundStyle(positive ? BUColor.success : BUColor.danger)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(
            (positive ? BUColor.success : BUColor.danger).opacity(0.10),
            in: Capsule()
        )
    }
}

// MARK: - Formatters

private func formatKRW(_ value: Double) -> String {
    let v = Int(round(value))
    if v >= 100_000_000 {
        return "\(String(format: "%.1f", Double(v) / 100_000_000))억"
    }
    return v.formatted(.number.grouping(.automatic))
}

private func formatKRWCompact(_ value: Double) -> String {
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
@MainActor
private func makeMockEntries() -> [DailyEntry] {
    let dates = ["2026-05-07", "2026-05-08", "2026-05-09", "2026-05-10",
                 "2026-05-11", "2026-05-12", "2026-05-13"]
    let values: [Double] = [520_000, 680_000, 580_000, 740_000, 820_000, 950_000, 870_000]
    return zip(dates, values).map { DailyEntry(date: $0.0, sales: $0.1, customers: Int($0.1 / 25_000)) }
}

#Preview("ActivitySnapshotCard") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            ActivitySnapshotCard(
                entries: makeMockEntries(),
                bepDailySales: 600_000
            )
            .padding(BUSpacing.md)
        }
    }
}
#endif
