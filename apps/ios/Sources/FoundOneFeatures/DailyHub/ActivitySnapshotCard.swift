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
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneData

// MARK: - ActivitySnapshotCard

public struct ActivitySnapshotCard: View {

    let entries: [DailyEntry]
    let bepDailySales: Double?    // 손익분기 일매출
    let ko: Bool
    let autoSourceCount: Int      // 자동수집 연결 채널 수 (>0이면 "자동 N곳" 배지 — 웹 패리티)
    let autoBreakdown: [RevenueBreakdownEntry]  // 채널별 매출 내역
    let onTapBasis: (() -> Void)?  // "자동 N곳" 배지 탭 → 기준 선택 sheet (nil이면 탭 비활성)
    /// 날짜 선택 → 그 날짜 매출 입력 열기. 웹은 막대를 누르면 해당 날짜 입력이 채워진다 —
    /// iOS 는 카드에서 입력으로 가는 길이 아예 없어 사장님이 화면 맨 아래 버튼을 찾아야 했다 (2026-08-06 수정).
    let onSelectDate: ((Date) -> Void)?

    public init(
        entries: [DailyEntry],
        bepDailySales: Double? = nil,
        ko: Bool = true,
        autoSourceCount: Int = 0,
        autoBreakdown: [RevenueBreakdownEntry] = [],
        onTapBasis: (() -> Void)? = nil,
        onSelectDate: ((Date) -> Void)? = nil
    ) {
        self.entries = entries
        self.bepDailySales = bepDailySales
        self.ko = ko
        self.autoSourceCount = autoSourceCount
        self.autoBreakdown = autoBreakdown
        self.onTapBasis = onTapBasis
        self.onSelectDate = onSelectDate
    }

    /// 채널별 매출 내역 라벨 (웹 revenueSourceLabel 미러).
    private func sourceLabel(_ source: String) -> String {
        switch source {
        case "portone": return ko ? "포트원 (온라인)" : "PortOne (online)"
        case "tossplace": return ko ? "토스플레이스 (매장)" : "TossPlace (in-store)"
        case "codef": return ko ? "카드 매출 (통합)" : "Card sales (CODEF)"
        case "popbill": return ko ? "현금 매출" : "Cash sales"
        case "codef-bank": return ko ? "통장 입금" : "Bank deposits"
        case "csv": return ko ? "CSV 업로드" : "CSV upload"
        default: return source
        }
    }

    /// 오늘 기준 최근 7일 슬롯 (-6, -5, …, 0=오늘).
    /// 데이터가 없는 날도 슬롯은 유지 → 차트가 항상 7칸 출력.
    /// 사장님 피드백 (2026-05-14): "매출 흐름 카드를 7일(7칸으로)" — 캘린더처럼.
    private var weekSlots: [WeekSlot] {
        let cal = Calendar(identifier: .gregorian)
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "Asia/Seoul")
        let today = Date()
        let byDate = Dictionary(uniqueKeysWithValues: entries.map { ($0.date, $0) })

        return (0..<7).reversed().compactMap { offset in
            guard let date = cal.date(byAdding: .day, value: -offset, to: today) else { return nil }
            let dateStr = df.string(from: date)
            return WeekSlot(
                date: date,
                dateStr: dateStr,
                entry: byDate[dateStr],
                isToday: offset == 0
            )
        }
    }

    private var todaySales: Double {
        weekSlots.last?.entry?.sales ?? 0
    }

    private var weeklySales: Double {
        weekSlots.reduce(0) { $0 + ($1.entry?.sales ?? 0) }
    }

    /// 월 추정 — 데이터 있는 슬롯의 평균 × 26영업일.
    /// 빈 슬롯을 0 으로 평균에 포함시키면 추정이 비현실적으로 낮아짐.
    private var monthlyEstimate: Double {
        let recorded = weekSlots.compactMap { $0.entry?.sales }
        guard !recorded.isEmpty else { return 0 }
        let avg = recorded.reduce(0, +) / Double(recorded.count)
        return avg * 26
    }

    /// 일평균 — 데이터 있는 슬롯만 평균 (동일 이유).
    private var dailyAverage: Double {
        let recorded = weekSlots.compactMap { $0.entry?.sales }
        guard !recorded.isEmpty else { return 0 }
        return recorded.reduce(0, +) / Double(recorded.count)
    }

    /// WoW — 이전 7일(8~14일 전) 대비. 14건 이상 있어야 비교 가능.
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

                // ── 채널별 매출 내역 (자동수집 연결 시) ──
                if !autoBreakdown.isEmpty {
                    breakdownSection
                }
            }
        }
    }

    // MARK: Auto badge ("자동 N곳")

    private var autoBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(BUColor.midnightInk)
                .frame(width: 5, height: 5)
            Text(ko ? "자동 \(autoSourceCount)곳" : "Auto \(autoSourceCount)")
                .font(.system(size: 9.5, weight: .bold))
                .foregroundStyle(BUColor.midnight)
                .tracking(0.4)
            if onTapBasis != nil {
                Image(systemName: "chevron.right")
                    .font(.system(size: 7, weight: .bold))
                    .foregroundStyle(BUColor.midnight.opacity(0.5))
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 2.5)
        .background(Capsule().fill(BUColor.midnight.opacity(0.06)))
        .overlay(Capsule().stroke(BUColor.midnight.opacity(0.18), lineWidth: 0.5))
    }

    // MARK: Breakdown (채널별 매출)

    private var breakdownSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Divider().overlay(BUColor.midnight.opacity(0.06))
            Text(ko ? "채널별 매출 · 최근 30일" : "By channel · last 30d")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.4)
            ForEach(autoBreakdown) { item in
                HStack(spacing: 8) {
                    Circle().fill(BUColor.midnightInk).frame(width: 6, height: 6)
                    Text(sourceLabel(item.source))
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.ink)
                        .lineLimit(1)
                    Spacer(minLength: 8)
                    Text(formatKRW(item.sales))
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .monospacedDigit()
                }
            }
        }
        .padding(13)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(BUColor.midnight.opacity(0.025))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(BUColor.midnight.opacity(0.10), lineWidth: 0.5)
        )
    }

    // MARK: Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Text(ko ? "매출 흐름" : "Revenue Flow")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .tracking(-0.88)

                if autoSourceCount > 0 {
                    if let onTapBasis {
                        Button(action: onTapBasis) { autoBadge }
                            .buttonStyle(.plain)
                    } else {
                        autoBadge
                    }
                }

                Spacer(minLength: 0)

                // 상시 노출 입력 버튼 — 막대 탭만으로는 "여기서 기록할 수 있다"가 안 보인다.
                if let onSelectDate {
                    Button { onSelectDate(Date()) } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "plus.circle.fill").font(.system(size: 12, weight: .semibold))
                            Text(ko ? "기록" : "Log")
                                .font(.system(size: 12.5, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(BUColor.midnight, in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }

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
                value: formatKRWCompact(dailyAverage),
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
                showLabels: true,
                onSelect: onSelectDate.map { cb in
                    { idx in
                        guard weekSlots.indices.contains(idx) else { return }
                        cb(weekSlots[idx].date)
                    }
                }
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

    /// 7 슬롯 → 7 막대. 데이터 없는 슬롯은 value 0 (빈 막대 자리표시).
    private func makeBars() -> [BUBarChart.Bar] {
        let df = DateFormatter()
        df.locale = Locale(identifier: ko ? "ko_KR" : "en_US")
        df.dateFormat = "E"

        return weekSlots.map { slot in
            let label = df.string(from: slot.date)
            let sales = slot.entry?.sales ?? 0

            // tone: 데이터 없으면 .neutral (회색), BEP 미달이면 .negative, 그 외 .positive
            let tone: BUBarChart.Bar.Tone = {
                guard slot.entry != nil else { return .neutral }
                if let bep = bepDailySales, sales < bep { return .negative }
                return .positive
            }()

            return BUBarChart.Bar(
                value: sales,
                label: label,
                tone: tone,
                highlighted: slot.isToday
            )
        }
    }
}

// MARK: - WeekSlot

private struct WeekSlot {
    let date: Date
    let dateStr: String
    let entry: DailyEntry?
    let isToday: Bool
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
