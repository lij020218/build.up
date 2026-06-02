//
//  CashflowRadarCard.swift — 설정 완료 후 14일 현금흐름 레이더 카드 + 14일 상세 시트.
//
//  웹 SSOT: apps/web/app/lib/components/dashboard/CashflowHeroCard.tsx (+ CashflowDetailSheet.tsx)
//  엔진: CashflowProjection.project / detectCrisis (1:1 포팅, 회귀 기준값 보존).
//
//  카드 표시 순서 (웹 동일):
//   1. 헤더 — "현금 흐름" eyebrow + "통장 잔고 14일 예측" + (설정 톱니) + 위기 배지
//   2. 3 잔고 타일 — 오늘 / 7일 후 / 14일 후 (projections endBalance @ 0/6/13)
//   3. 14일 미니 타임라인 — endBalance 막대 (정상 midnight, 위기<0 negative red)
//   4. 다음 입금 / 다음 지출 이벤트
//   5. 위기 경고 (willCrisis 시 — D-day·날짜·부족액)
//   6. stale 잔고 경고 (currentBalanceUpdatedAt 3일+ 경과)
//   7. "14일 상세 보기" → CashflowDetailSheet
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - CashflowRadarCard

struct CashflowRadarCard: View {

    let projections: [CashflowDayProjection]
    // FoundOneCore.HeroResolver 에도 동명 타입이 있어 모듈 한정 (엔진 타입은 FoundOneData).
    let crisis: FoundOneData.CashflowCrisis
    let currentBalanceUpdatedAt: String?
    var ko: Bool = true
    let onDetail: () -> Void
    let onEditSettings: () -> Void

    private var todayBalance: Double { projections.first?.endBalance ?? 0 }
    private var sevenDayBalance: Double { projections.count > 6 ? projections[6].endBalance : todayBalance }
    private var fourteenDayBalance: Double { projections.last?.endBalance ?? todayBalance }
    /// 막대 톤 임계 기준 — 오늘 시작 잔고(=설정 통장 잔고).
    private var baseBalance: Double { projections.first?.startBalance ?? 0 }

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                tiles
                if !projections.isEmpty { timeline }
                nextEventsRow
                if crisis.willCrisis { crisisBlock }
                if isBalanceStale { staleBlock }
                detailButton
            }
        }
    }

    // MARK: Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text(ko ? "현금 흐름" : "Cash Flow")
                    .buSectionEyebrowStyle()
                Spacer(minLength: 0)
                if crisis.willCrisis, let d = crisis.daysUntilCrisis {
                    CFCrisisBadge(daysUntil: d)
                }
                Button(action: onEditSettings) {
                    Image(systemName: "slider.horizontal.3")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.midnight.opacity(0.55))
                }
                .buttonStyle(.plain)
            }
            Text(ko ? "통장 잔고 14일 예측" : "14-day Balance Forecast")
                .buDetailTitleStyle()
        }
    }

    // MARK: Tiles

    private var tiles: some View {
        HStack(spacing: 8) {
            CFBalanceTile(label: ko ? "오늘" : "Today", value: todayBalance, tone: tone(todayBalance))
            CFBalanceTile(label: ko ? "7일 후" : "7d", value: sevenDayBalance, tone: tone(sevenDayBalance))
            CFBalanceTile(label: ko ? "14일 후" : "14d", value: fourteenDayBalance, tone: tone(fourteenDayBalance))
        }
    }

    // MARK: Timeline

    private var timeline: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(ko ? "14일 잔고 변동" : "14-day Balance")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.midnight.opacity(0.6))
                .tracking(1.0)
                .textCase(.uppercase)
            BUBarChart(
                bars: projections.enumerated().map { idx, p in
                    BUBarChart.Bar(
                        value: max(0, abs(p.endBalance)),
                        label: idx % 3 == 0 ? "D+\(idx)" : nil,
                        // 신호등 컬러 금지 — 정상은 브랜드 midnight, 실제 위기(<0)만 red.
                        tone: p.endBalance < 0 ? .negative : .midnight,
                        highlighted: idx == 0
                    )
                },
                height: 80,
                showLabels: true
            )
        }
    }

    // MARK: Next events (다음 입금 / 지출)

    private var nextEventsRow: some View {
        HStack(spacing: 8) {
            if let inflow = nextEvent(type: "inflow") {
                EventTile(kind: .inflow, dateLabel: shortDate(inflow.date), label: inflow.event.labelKo, amount: inflow.event.amount, ko: ko)
            }
            if let outflow = nextEvent(type: "outflow") {
                EventTile(kind: .outflow, dateLabel: shortDate(outflow.date), label: outflow.event.labelKo, amount: outflow.event.amount, ko: ko)
            }
        }
    }

    // MARK: Crisis block

    private var crisisBlock: some View {
        let shortfall = formatMoney(crisis.shortfallAmount)
        let dayLabel = crisis.crisisDay.map(shortDate) ?? "—"
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: "exclamationmark.octagon.fill")
                    .font(.system(size: 12, weight: .bold))
                Text(ko ? "현금 위기 경고" : "Cash crisis")
                    .font(.system(size: 12.5, weight: .bold))
                Spacer(minLength: 0)
                if let d = crisis.daysUntilCrisis {
                    Text("D-\(d)")
                        .font(.system(size: 11, weight: .heavy))
                        .monospacedDigit()
                }
            }
            .foregroundStyle(BUColor.danger)
            Text(ko
                 ? "\(dayLabel)에 통장이 \(shortfall) 부족해질 수 있어요. 광고비·발주를 조정하거나 정산을 앞당겨 보세요."
                 : "Balance may fall short by \(shortfall) on \(dayLabel).")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.ink.opacity(0.72))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 12).padding(.vertical, 11)
        .background(BUColor.danger.opacity(0.06), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
                .strokeBorder(BUColor.danger.opacity(0.18), lineWidth: 1)
        )
    }

    // MARK: Stale block

    private var staleBlock: some View {
        Button(action: onEditSettings) {
            HStack(spacing: 8) {
                Image(systemName: "clock.arrow.circlepath")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.warn)
                Text(ko ? "통장 잔고가 3일 이상 업데이트되지 않았어요" : "Balance is 3+ days stale")
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.ink.opacity(0.7))
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
                Text(ko ? "수정" : "Update")
                    .font(.system(size: 11.5, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .frame(maxWidth: .infinity)
            .background(BUColor.warn.opacity(0.07), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
                    .strokeBorder(BUColor.warn.opacity(0.20), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: Detail button

    private var detailButton: some View {
        Button(action: onDetail) {
            HStack(spacing: 5) {
                Text(ko ? "14일 상세 보기" : "14-day detail")
                    .font(.system(size: 13, weight: .bold))
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(BUColor.midnight)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: BURadius.button, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    // MARK: Helpers

    private func tone(_ balance: Double) -> CFBalanceTile.Tone {
        if balance < 0 { return .crisis }
        if baseBalance > 0 && balance < baseBalance * 0.3 { return .warning }
        return .neutral
    }

    /// 첫 입금/지출 이벤트 + 그 날짜.
    private func nextEvent(type: String) -> (date: String, event: CashflowProjEvent)? {
        for p in projections {
            if let e = p.events.first(where: { $0.type == type && $0.amount > 0 }) {
                return (p.date, e)
            }
        }
        return nil
    }

    private var isBalanceStale: Bool {
        guard let iso = currentBalanceUpdatedAt else { return true }
        let date = Self.parseISO(iso)
        guard let date else { return true }
        let days = Calendar.current.dateComponents([.day], from: date, to: Date()).day ?? 0
        return days >= 3
    }

    private static func parseISO(_ s: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        f.formatOptions = [.withInternetDateTime]
        if let d = f.date(from: s) { return d }
        // "yyyy-MM-dd" fallback
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"; df.locale = Locale(identifier: "en_US_POSIX")
        return df.date(from: s)
    }

    /// "yyyy-MM-dd" → "M/d" (오늘이면 "오늘").
    private func shortDate(_ iso: String) -> String {
        let todayIso = projections.first?.date
        if iso == todayIso { return ko ? "오늘" : "Today" }
        let parts = iso.split(separator: "-")
        guard parts.count == 3, let m = Int(parts[1]), let d = Int(parts[2]) else { return iso }
        return "\(m)/\(d)"
    }
}

// MARK: - EventTile (다음 입금 / 지출)

private struct EventTile: View {
    enum Kind { case inflow, outflow }
    let kind: Kind
    let dateLabel: String
    let label: String
    let amount: Double
    let ko: Bool

    private var color: Color { kind == .inflow ? BUColor.success : BUColor.danger }
    private var title: String { kind == .inflow ? (ko ? "다음 입금" : "Next in") : (ko ? "다음 지출" : "Next out") }
    private var sign: String { kind == .inflow ? "+" : "−" }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Image(systemName: kind == .inflow ? "arrow.down.left.circle.fill" : "arrow.up.right.circle.fill")
                    .font(.system(size: 10, weight: .bold))
                Text(title)
                    .font(.system(size: 10, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(0.4)
                Spacer(minLength: 0)
                Text(dateLabel)
                    .font(.system(size: 10, weight: .semibold))
                    .monospacedDigit()
            }
            .foregroundStyle(color)
            Text(label)
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(BUColor.ink.opacity(0.7))
                .lineLimit(1)
            Text("\(sign)\(formatMoney(amount))")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(color)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(.horizontal, 11).padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(color.opacity(0.12), lineWidth: 1)
        )
    }
}

// MARK: - CFBalanceTile (잔고 타일)

private struct CFBalanceTile: View {
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
            Text(formatMoney(value))
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(tone.color)
                .tracking(-0.5)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .padding(.horizontal, 10).padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1)
        )
    }
}

// MARK: - CFCrisisBadge

private struct CFCrisisBadge: View {
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
        .padding(.horizontal, 8).padding(.vertical, 3)
        .background(BUColor.danger.opacity(0.10), in: Capsule())
    }
}

// MARK: - 공용 금액 포맷 (억/만/원)

func formatMoney(_ value: Double) -> String {
    let absV = Swift.abs(value)
    let sign = value < 0 ? "-" : ""
    if absV >= 100_000_000 {
        return "\(sign)\(String(format: "%.1f", absV / 100_000_000))억"
    }
    if absV >= 10_000 {
        return "\(sign)\(Int(absV / 10_000))만"
    }
    return "\(sign)\(Int(absV).formatted())원"
}

// MARK: - CashflowDetailSheet (14일 상세)

struct CashflowDetailSheet: View {

    let projections: [CashflowDayProjection]
    let settings: CashflowSettings
    var ko: Bool = true
    @Environment(\.dismiss) private var dismiss

    private var totalInflow: Double { projections.reduce(0) { $0 + $1.inflow } }
    private var totalOutflow: Double { projections.reduce(0) { $0 + $1.outflow } }
    private var netChange: Double { totalInflow - totalOutflow }

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        summaryGrid
                        if settings.vatReserveEnabled { vatNote }
                        if !channelTotals.isEmpty { channelSummary }
                        if !expenseTotals.isEmpty { expenseSummary }
                        dailyTimeline
                        Color.clear.frame(height: 32)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle(ko ? "앞으로 14일" : "Next 14 days")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button(ko ? "닫기" : "Close") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: Summary

    private var summaryGrid: some View {
        BUCard(.outer) {
            HStack(spacing: 8) {
                SummaryTile(label: ko ? "총 입금 예상" : "Inflow", value: totalInflow, color: BUColor.success, sign: "+")
                SummaryTile(label: ko ? "총 지출 예상" : "Outflow", value: totalOutflow, color: BUColor.danger, sign: "−")
                SummaryTile(label: ko ? "순 변화" : "Net", value: netChange, color: netChange >= 0 ? BUColor.success : BUColor.danger, sign: netChange >= 0 ? "+" : "−")
            }
        }
    }

    private var vatNote: some View {
        HStack(spacing: 8) {
            Image(systemName: "info.circle")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
            Text(ko ? "부가세 적립이 켜져 있어 입금액의 일부를 세금으로 미리 빼고 계산했어요." : "VAT reserve is on.")
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(BUColor.ink.opacity(0.7))
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous))
    }

    // MARK: Channel summary

    private var channelTotals: [(channel: CashflowSalesChannel, total: Double)] {
        settings.salesChannels
            .filter { $0.isActive && $0.salesRatio > 0 }
            .map { ch in
                let total = projections.reduce(0.0) { sum, p in
                    sum + (p.events.first { $0.sourceChannel == ch.id }?.amount ?? 0)
                }
                return (ch, total)
            }
            .filter { $0.total > 0 }
            .sorted { $0.total > $1.total }
    }

    private var channelSummary: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text(ko ? "채널별 14일 입금" : "Inflow by channel")
                    .buSectionEyebrowStyle()
                let maxTotal = channelTotals.map(\.total).max() ?? 1
                ForEach(channelTotals, id: \.channel.id) { item in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(ko ? item.channel.label.ko : item.channel.label.en)
                                .font(.system(size: 12.5, weight: .semibold))
                                .foregroundStyle(BUColor.ink)
                            Text("D+\(item.channel.settlementDays) · \(String(format: "%.1f", item.channel.commissionRate + item.channel.paymentFeeRate))%")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                            Spacer(minLength: 0)
                            Text("+\(formatMoney(item.total))")
                                .font(.system(size: 12.5, weight: .bold))
                                .foregroundStyle(BUColor.success)
                                .monospacedDigit()
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(BUColor.midnight.opacity(0.06)).frame(height: 5)
                                Capsule().fill(BUColor.midnight.opacity(0.5))
                                    .frame(width: max(4, geo.size.width * (item.total / maxTotal)), height: 5)
                            }
                        }
                        .frame(height: 5)
                    }
                }
            }
        }
    }

    // MARK: Expense summary

    private var expenseTotals: [(expense: CashflowFixedExpense, total: Double)] {
        settings.fixedExpenses
            .filter(\.isActive)
            .map { e in
                let total = projections.reduce(0.0) { sum, p in
                    sum + (p.events.first { $0.sourceExpenseId == e.id }?.amount ?? 0)
                }
                return (e, total)
            }
            .sorted { $0.total > $1.total }
    }

    private var expenseSummary: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text(ko ? "고정비 14일 출금" : "Outflow by expense")
                    .buSectionEyebrowStyle()
                ForEach(expenseTotals, id: \.expense.id) { item in
                    HStack {
                        Text(item.expense.label)
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(BUColor.ink)
                        Text(ko ? "매월 \(item.expense.dayOfMonth)일" : "Day \(item.expense.dayOfMonth)")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                        Spacer(minLength: 0)
                        Text(item.total > 0 ? "−\(formatMoney(item.total))" : (ko ? "해당 없음" : "—"))
                            .font(.system(size: 12.5, weight: .bold))
                            .foregroundStyle(item.total > 0 ? BUColor.danger : BUColor.inkMuted)
                            .monospacedDigit()
                    }
                }
            }
        }
    }

    // MARK: Daily timeline

    private var dailyTimeline: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 8) {
                Text(ko ? "일별 흐름" : "Daily flow")
                    .buSectionEyebrowStyle()
                ForEach(projections) { p in
                    DayRow(projection: p, isToday: p.date == projections.first?.date, ko: ko)
                    if p.date != projections.last?.date {
                        Divider().opacity(0.4)
                    }
                }
            }
        }
    }
}

// MARK: - SummaryTile

private struct SummaryTile: View {
    let label: String
    let value: Double
    let color: Color
    let sign: String
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .textCase(.uppercase)
                .tracking(0.3)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text("\(sign)\(formatMoney(value))")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(color)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .padding(.horizontal, 10).padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

// MARK: - DayRow (일별 타임라인 행)

private struct DayRow: View {
    let projection: CashflowDayProjection
    let isToday: Bool
    let ko: Bool

    private var dateLabel: String {
        if isToday { return ko ? "오늘" : "Today" }
        let parts = projection.date.split(separator: "-")
        guard parts.count == 3, let m = Int(parts[1]), let d = Int(parts[2]) else { return projection.date }
        return "\(m)/\(d)"
    }

    private var weekdayLabel: String {
        let symbols = ko ? ["일", "월", "화", "수", "목", "금", "토"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
        return symbols[max(0, min(6, projection.dayOfWeek))]
    }

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 1) {
                Text(dateLabel)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .monospacedDigit()
                Text(weekdayLabel)
                    .font(.system(size: 9.5, weight: .semibold))
                    .foregroundStyle(projection.isWeekend ? BUColor.danger.opacity(0.7) : BUColor.inkMuted)
            }
            .frame(width: 40, alignment: .leading)

            VStack(alignment: .leading, spacing: 2) {
                if projection.events.isEmpty {
                    Text(ko ? "변동 없음" : "No change")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(BUColor.inkSubtle)
                } else {
                    ForEach(Array(projection.events.prefix(3))) { e in
                        HStack(spacing: 4) {
                            Text(e.type == "inflow" ? "+" : "−")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(e.type == "inflow" ? BUColor.success : BUColor.danger)
                            Text(e.labelKo)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(BUColor.ink.opacity(0.65))
                                .lineLimit(1)
                            Spacer(minLength: 4)
                            Text(formatMoney(e.amount))
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(e.type == "inflow" ? BUColor.success : BUColor.danger)
                                .monospacedDigit()
                        }
                    }
                    if projection.events.count > 3 {
                        Text(ko ? "+\(projection.events.count - 3)개 더" : "+\(projection.events.count - 3) more")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text(formatMoney(projection.endBalance))
                .font(.system(size: 12.5, weight: .bold))
                .foregroundStyle(projection.endBalance < 0 ? BUColor.danger : BUColor.ink)
                .monospacedDigit()
                .frame(width: 64, alignment: .trailing)
        }
        .padding(.vertical, 4)
        .background(isToday ? BUColor.midnight.opacity(0.03) : Color.clear)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("CashflowRadar — 정상") {
    let proj = CashflowProjection.project(
        currentBalance: 12_000_000,
        recentDailyEntries: (0..<14).map { CashflowDailyEntry(date: String(format: "2026-05-%02d", $0 + 1), sales: 400_000) },
        salesChannels: CashflowRepository.defaultChannels(forCategoryKey: "food"),
        fixedExpenses: [CashflowFixedExpense(id: "r", label: "월세", amount: 3_000_000, dayOfMonth: 5, category: "rent", isActive: true)],
        vatReserveEnabled: false
    )
    let crisis = CashflowProjection.detectCrisis(proj, thresholdDays: 3)
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            CashflowRadarCard(projections: proj, crisis: crisis, currentBalanceUpdatedAt: nil, onDetail: {}, onEditSettings: {})
                .padding(BUSpacing.md)
        }
    }
}
#endif
