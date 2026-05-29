//
//  GrowthCards.swift — Tier 4 성장 도구 + Tier 5 예측 (통합)
//
//  웹 SSOT:
//   • WhatIfSimulator       — 매출/비용 슬라이더 → 순익·런웨이 실시간 계산
//   • WeeklyReport          — 이번 주 vs 지난 주 매출 비교
//   • ProgressMilestonesCard — 손익분기·건강도·로드맵 진행도
//   • ForecastCard          — 7일 매출 예측 sparkline
//   • FirstCustomersCard    — 100명 고객 진행률
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents

// MARK: - WhatIfSimulator (시나리오 슬라이더)

public struct WhatIfSimulator: View {

    let baseSales: Double
    let baseCosts: Double
    let ko: Bool

    @State private var salesDelta: Double = 0      // -50% ~ +50%
    @State private var costsDelta: Double = 0

    public init(baseSales: Double, baseCosts: Double, ko: Bool = true) {
        self.baseSales = baseSales
        self.baseCosts = baseCosts
        self.ko = ko
    }

    private var projectedSales: Double { baseSales * (1 + salesDelta / 100) }
    private var projectedCosts: Double { baseCosts * (1 + costsDelta / 100) }
    private var projectedNet: Double { projectedSales - projectedCosts }
    private var baseNet: Double { baseSales - baseCosts }
    private var netChange: Double { projectedNet - baseNet }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "slider.horizontal.3")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ko ? "What-If" : "What-If")
                            .buSectionEyebrowStyle()
                        Text(ko ? "이대로 가면" : "Scenario")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                }

                // 슬라이더 2개
                VStack(spacing: 14) {
                    SliderRow(
                        label: ko ? "매출 변동" : "Sales",
                        value: $salesDelta,
                        range: -50...50,
                        tint: salesDelta >= 0 ? BUColor.success : BUColor.danger
                    )
                    SliderRow(
                        label: ko ? "비용 변동" : "Costs",
                        value: $costsDelta,
                        range: -30...50,
                        tint: costsDelta <= 0 ? BUColor.success : BUColor.danger
                    )
                }

                // 결과 영역
                VStack(spacing: 4) {
                    HStack {
                        Text(ko ? "예상 순익" : "Projected Net")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(BUColor.ink.opacity(0.48))
                            .tracking(0.4)
                            .textCase(.uppercase)
                        Spacer()
                    }
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text("\(projectedNet >= 0 ? "+" : "")\(formatKRW(projectedNet))")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(projectedNet >= 0 ? BUColor.success : BUColor.danger)
                            .tracking(-0.8)
                            .monospacedDigit()
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                        if abs(netChange) > 1000 {
                            Text("\(netChange >= 0 ? "+" : "")\(formatKRW(netChange))")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(netChange >= 0 ? BUColor.success : BUColor.danger)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 2)
                                .background(
                                    (netChange >= 0 ? BUColor.success : BUColor.danger).opacity(0.10),
                                    in: Capsule()
                                )
                        }
                        Spacer()
                    }
                }
                .padding(.top, 6)
                .padding(.horizontal, 10)
                .padding(.vertical, 12)
                .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}

private struct SliderRow: View {
    let label: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.ink.opacity(0.7))
                Spacer()
                Text("\(value >= 0 ? "+" : "")\(String(format: "%.0f", value))%")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(tint)
                    .monospacedDigit()
            }
            Slider(value: $value, in: range, step: 1)
                .tint(tint)
        }
    }
}

// MARK: - ProgressMilestonesCard

public struct ProgressMilestonesCard: View {

    public struct Milestone: Identifiable, Sendable {
        public let id = UUID()
        public let label: String
        public let current: Double
        public let target: Double
        public let unit: String
        public let achieved: Bool

        public init(label: String, current: Double, target: Double, unit: String, achieved: Bool) {
            self.label = label
            self.current = current
            self.target = target
            self.unit = unit
            self.achieved = achieved
        }
    }

    let milestones: [Milestone]
    let ko: Bool

    public init(milestones: [Milestone], ko: Bool = true) {
        self.milestones = milestones
        self.ko = ko
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.success08).frame(width: 36, height: 36)
                        Image(systemName: "flag.checkered")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.success)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ko ? "마일스톤" : "Milestones")
                            .buSectionEyebrowStyle()
                        Text(ko ? "\(milestones.filter { $0.achieved }.count) / \(milestones.count) 달성" : "")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                }

                VStack(spacing: 12) {
                    ForEach(milestones) { m in
                        milestoneRow(m)
                    }
                }
            }
        }
    }

    private func milestoneRow(_ m: Milestone) -> some View {
        let ratio = m.target > 0 ? min(1.0, m.current / m.target) : 0
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: m.achieved ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(m.achieved ? BUColor.success : BUColor.inkSubtle)
                Text(m.label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink.opacity(m.achieved ? 0.5 : 0.85))
                    .strikethrough(m.achieved, color: BUColor.inkSubtle)
                Spacer()
                Text("\(Int(m.current))/\(Int(m.target))\(m.unit)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)
                    .monospacedDigit()
            }
            BUGaugeBar(
                value: m.current,
                target: m.target,
                grade: m.achieved ? .healthy : ratio > 0.5 ? .caution : .warning,
                height: 4
            )
        }
    }
}

// MARK: - ForecastCard (Tier 5)

public struct ForecastCard: View {

    let recent7: [Double]
    let predicted7: [Double]
    let avgDailySales: Double
    let ko: Bool

    public init(recent7: [Double], predicted7: [Double], avgDailySales: Double, ko: Bool = true) {
        self.recent7 = recent7
        self.predicted7 = predicted7
        self.avgDailySales = avgDailySales
        self.ko = ko
    }

    private var trendPct: Double {
        let lastAvg = predicted7.reduce(0, +) / Double(max(1, predicted7.count))
        let baseAvg = avgDailySales
        guard baseAvg > 0 else { return 0 }
        return ((lastAvg - baseAvg) / baseAvg) * 100
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ko ? "매출 예측" : "Forecast")
                            .buSectionEyebrowStyle()
                        Text(ko ? "다음 7일 추세" : "Next 7 days")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                    // Trend pill
                    HStack(spacing: 3) {
                        Image(systemName: trendPct >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 9, weight: .heavy))
                        Text("\(trendPct >= 0 ? "+" : "")\(String(format: "%.0f", trendPct))%")
                            .font(.system(size: 11, weight: .bold))
                            .monospacedDigit()
                    }
                    .foregroundStyle(trendPct >= 0 ? BUColor.success : BUColor.danger)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background((trendPct >= 0 ? BUColor.success : BUColor.danger).opacity(0.10), in: Capsule())
                }

                // 14일 sparkline (실적 7 + 예측 7) - 점선 분리
                ForecastSparkline(
                    recent: recent7,
                    predicted: predicted7,
                    tint: trendPct >= 0 ? BUColor.success : BUColor.danger
                )
                .frame(height: 100)
            }
        }
    }
}

private struct ForecastSparkline: View {
    let recent: [Double]
    let predicted: [Double]
    let tint: Color

    var body: some View {
        GeometryReader { geo in
            let all = recent + predicted
            let maxV = (all.max() ?? 1) * 1.15
            let minV = max(0, (all.min() ?? 0) * 0.85)
            let range = max(maxV - minV, 1)
            let dx = geo.size.width / CGFloat(max(all.count - 1, 1))

            ZStack {
                // 실적 line
                Path { p in
                    for (i, v) in recent.enumerated() {
                        let x = CGFloat(i) * dx
                        let y = geo.size.height * (1 - CGFloat((v - minV) / range))
                        if i == 0 { p.move(to: CGPoint(x: x, y: y)) }
                        else { p.addLine(to: CGPoint(x: x, y: y)) }
                    }
                }
                .stroke(BUColor.midnight, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))

                // 예측 line (점선)
                Path { p in
                    let allPoints = recent + predicted
                    for (i, v) in allPoints.enumerated() {
                        let x = CGFloat(i) * dx
                        let y = geo.size.height * (1 - CGFloat((v - minV) / range))
                        if i == recent.count - 1 { p.move(to: CGPoint(x: x, y: y)) }
                        else if i >= recent.count - 1 { p.addLine(to: CGPoint(x: x, y: y)) }
                    }
                }
                .stroke(tint, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round, dash: [4, 3]))

                // 구분선
                Path { p in
                    let xMid = CGFloat(recent.count - 1) * dx
                    p.move(to: CGPoint(x: xMid, y: 0))
                    p.addLine(to: CGPoint(x: xMid, y: geo.size.height))
                }
                .stroke(BUColor.inkSubtle.opacity(0.3), style: StrokeStyle(lineWidth: 0.6, dash: [2, 2]))
            }
        }
    }
}

// MARK: - GrowthForecastView (Tier 4 + 5 통합)

public struct GrowthForecastView: View {

    let mock: MockData

    public init(mock: MockData) {
        self.mock = mock
    }

    private var totalSales: Double { mock.entries.reduce(0) { $0 + $1.sales } }
    private var avgDaily: Double {
        guard !mock.entries.isEmpty else { return 0 }
        return totalSales / Double(mock.entries.count)
    }

    private var recent7: [Double] {
        Array(mock.entries.sorted { $0.date < $1.date }.suffix(7).map { $0.sales })
    }

    private var predicted7: [Double] {
        guard !recent7.isEmpty else { return [] }
        let trend = recent7.last! / max(1, recent7.first!) - 1
        return (1...7).map { i in
            avgDaily * (1 + trend * Double(i) / 14)
        }
    }

    private var milestones: [ProgressMilestonesCard.Milestone] {
        [
            .init(label: "손익분기 달성", current: mock.entries.count > 7 ? 1 : 0, target: 1, unit: "", achieved: totalSales > mock.costs.total),
            .init(label: "월 매출 1000만 돌파", current: min(1000, totalSales / 10000), target: 1000, unit: "만", achieved: totalSales >= 10_000_000),
            .init(label: "재방문 30%+", current: 42, target: 30, unit: "%", achieved: true),
            .init(label: "100명 단골 확보", current: 67, target: 100, unit: "명", achieved: false),
        ]
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: BUSpacing.shellGap) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.midnight.opacity(0.7))
                    Text("성장 + 예측")
                        .buSectionEyebrowStyle()
                    Spacer()
                }
                .padding(.top, 4)

                WhatIfSimulator(
                    baseSales: avgDaily * 26,
                    baseCosts: mock.costs.total
                )

                if recent7.count >= 3 {
                    ForecastCard(
                        recent7: recent7,
                        predicted7: predicted7,
                        avgDailySales: avgDaily
                    )
                }

                ProgressMilestonesCard(milestones: milestones)

                // 마케팅 블록은 MarketingView 로 이전됨 (LoyaltyDonut / CampaignIdeas).
                // MarketingChannelROIBlock 는 실데이터 KPI + Campaigns List 로 대체.

                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.md)
        }
        .background(BUBackgroundSurface())
    }
}

// MARK: - MarketingChannelROIBlock

public struct MarketingChannelROIBlock: View {

    struct Channel: Identifiable {
        let id = UUID()
        let name: String
        let icon: String
        let tint: Color
        let cost: Int          // 이번 달 비용 (원)
        let visitors: Int      // 유입 고객 (명)
        let roas: Double       // %
    }

    private let channels: [Channel] = [
        .init(name: "네이버 플레이스", icon: "mappin.circle.fill", tint: Color(red: 0.13, green: 0.71, blue: 0.39),
              cost: 150_000, visitors: 84, roas: 312),
        .init(name: "인스타그램", icon: "camera.fill", tint: Color(red: 0.91, green: 0.30, blue: 0.55),
              cost: 220_000, visitors: 62, roas: 178),
        .init(name: "카카오 채널", icon: "bubble.left.and.bubble.right.fill", tint: Color(red: 0.99, green: 0.81, blue: 0.10),
              cost: 80_000, visitors: 45, roas: 245),
        .init(name: "배민 광고", icon: "bicycle", tint: Color(red: 0.18, green: 0.74, blue: 0.78),
              cost: 380_000, visitors: 128, roas: 142),
        .init(name: "쿠팡이츠", icon: "cart.fill", tint: Color(red: 0.93, green: 0.31, blue: 0.20),
              cost: 290_000, visitors: 91, roas: 165),
    ]

    private var totalCost: Int { channels.reduce(0) { $0 + $1.cost } }
    private var totalVisitors: Int { channels.reduce(0) { $0 + $1.visitors } }

    public init() {}

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "megaphone.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("MARKETING")
                            .buSectionEyebrowStyle()
                        Text("채널 ROI 요약")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                }

                // 상단 KPI
                HStack(spacing: 8) {
                    miniKPI(label: "이번 달 지출", value: formatKRW(Double(totalCost)))
                    miniKPI(label: "유입 고객", value: "\(totalVisitors)명")
                }

                VStack(spacing: 8) {
                    ForEach(channels) { ch in
                        channelRow(ch)
                    }
                }
            }
        }
    }

    private func miniKPI(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.ink.opacity(0.48))
                .tracking(0.4)
                .textCase(.uppercase)
            Text(value)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10))
    }

    private func channelRow(_ ch: Channel) -> some View {
        let roasGood = ch.roas >= 200
        let roasOk = ch.roas >= 150
        let roasTint: Color = roasGood ? BUColor.success : (roasOk ? BUColor.midnight : BUColor.danger)
        return HStack(spacing: 10) {
            ZStack {
                Circle().fill(ch.tint.opacity(0.12)).frame(width: 32, height: 32)
                Image(systemName: ch.icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(ch.tint)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(ch.name)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Text("\(formatKRW(Double(ch.cost))) · \(ch.visitors)명")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .monospacedDigit()
            }
            Spacer()
            Text("\(Int(ch.roas))%")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(roasTint)
                .monospacedDigit()
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(roasTint.opacity(0.10), in: Capsule())
        }
        .frame(minHeight: 44)
    }
}

// MARK: - LoyaltyDonutBlock

public struct LoyaltyDonutBlock: View {

    struct Segment {
        let label: String
        let value: Double
        let color: Color
    }

    private let segments: [Segment] = [
        .init(label: "단골", value: 38, color: BUColor.midnight),
        .init(label: "신규", value: 24, color: BUColor.success),
        .init(label: "일회성", value: 38, color: BUColor.inkSubtle),
    ]

    private var total: Double { segments.reduce(0) { $0 + $1.value } }

    public init() {}

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.success08).frame(width: 36, height: 36)
                        Image(systemName: "heart.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.success)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("LOYALTY")
                            .buSectionEyebrowStyle()
                        Text("단골 비율")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                }

                HStack(spacing: 18) {
                    LoyaltyDonut(segments: segments, total: total)
                        .frame(width: 110, height: 110)

                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(segments.indices, id: \.self) { i in
                            let s = segments[i]
                            HStack(spacing: 8) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(s.color)
                                    .frame(width: 10, height: 10)
                                Text(s.label)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(BUColor.ink.opacity(0.75))
                                Spacer()
                                Text("\(Int(s.value))%")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(s.color)
                                    .monospacedDigit()
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                Text("재방문 고객이 전체의 38%. 일회성 비중을 단골로 전환하면 매출이 안정됩니다.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .padding(.top, 4)
            }
        }
    }
}

private struct LoyaltyDonut: View {
    let segments: [LoyaltyDonutBlock.Segment]
    let total: Double

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let lw: CGFloat = size * 0.18
            ZStack {
                // ring background
                Circle()
                    .stroke(BUColor.midnight.opacity(0.05), lineWidth: lw)

                // segments
                let _: Double = 0
                ZStack {
                    ForEach(segments.indices, id: \.self) { i in
                        let start = startFraction(at: i)
                        let end = start + segments[i].value / total
                        Circle()
                            .trim(from: start, to: end)
                            .stroke(segments[i].color, style: StrokeStyle(lineWidth: lw, lineCap: .butt))
                            .rotationEffect(.degrees(-90))
                    }
                }

                // center value
                VStack(spacing: 0) {
                    if let primary = segments.first {
                        Text("\(Int(primary.value))%")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                            .monospacedDigit()
                        Text(primary.label)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BUColor.inkMuted)
                            .tracking(0.4)
                            .textCase(.uppercase)
                    }
                }
            }
            .frame(width: size, height: size)
        }
    }

    private func startFraction(at index: Int) -> Double {
        guard total > 0 else { return 0 }
        return segments.prefix(index).reduce(0) { $0 + $1.value } / total
    }
}

// MARK: - CampaignIdeasBlock

public struct CampaignIdeasBlock: View {

    struct Idea: Identifiable {
        let id = UUID()
        let title: String
        let icon: String
        let tint: Color
        let summary: String
        let details: String
    }

    private let ideas: [Idea] = [
        .init(
            title: "단골 win-back 메시지",
            icon: "envelope.badge.fill",
            tint: BUColor.midnight,
            summary: "30일 이상 방문 없는 단골 24명",
            details: "카카오 채널로 5,000원 할인 쿠폰 발송. 예상 회수율 18% (4-5명). 비용 약 25,000원."
        ),
        .init(
            title: "리뷰 답글 자동화",
            icon: "text.bubble.fill",
            tint: BUColor.success,
            summary: "이번 주 미답글 리뷰 6건",
            details: "네이버 플레이스 신규 리뷰에 24시간 내 답글. 검색 노출 +12% 평균치."
        ),
        .init(
            title: "점심 직장인 타임 광고",
            icon: "clock.fill",
            tint: Color(red: 0.18, green: 0.74, blue: 0.78),
            summary: "11:30-13:30 배민 광고 강화",
            details: "주변 오피스 1km 타겟. 일 1만원 × 5일 = 5만원. 예상 유입 +15-20명."
        ),
        .init(
            title: "주말 SNS 콘텐츠",
            icon: "camera.fill",
            tint: Color(red: 0.91, green: 0.30, blue: 0.55),
            summary: "신메뉴 릴스 1개",
            details: "인스타 릴스 1개 + 스토리 3개. 평균 도달 1,500-3,000명. 비용 0원."
        ),
    ]

    @State private var expanded: UUID?

    public init() {}

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "lightbulb.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("CAMPAIGN")
                            .buSectionEyebrowStyle()
                        Text("다음 캠페인 아이디어")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                }

                VStack(spacing: 8) {
                    ForEach(ideas) { idea in
                        ideaRow(idea)
                    }
                }
            }
        }
    }

    private func ideaRow(_ idea: Idea) -> some View {
        let isOpen = expanded == idea.id
        return VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.spring(response: 0.32, dampingFraction: 0.86)) {
                    expanded = isOpen ? nil : idea.id
                }
            } label: {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(idea.tint.opacity(0.12)).frame(width: 32, height: 32)
                        Image(systemName: idea.icon)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(idea.tint)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(idea.title)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                            .multilineTextAlignment(.leading)
                        Text(idea.summary)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                            .multilineTextAlignment(.leading)
                    }
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(BUColor.inkSubtle)
                        .rotationEffect(.degrees(isOpen ? 180 : 0))
                }
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if isOpen {
                Text(idea.details)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.ink.opacity(0.7))
                    .lineSpacing(3)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(idea.tint.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }
}

// MARK: - Helpers

private func formatKRW(_ value: Double) -> String {
    let v = Int(round(value))
    let abs = Swift.abs(v)
    let sign = v < 0 ? "-" : ""
    if abs >= 100_000_000 { return "\(sign)\(String(format: "%.1f", Double(abs) / 100_000_000))억" }
    if abs >= 10_000 { return "\(sign)\(abs / 10_000)만" }
    return "\(sign)\(abs)"
}

#if DEBUG
#Preview("GrowthForecastView") {
    GrowthForecastView(mock: .healthyRestaurant)
}
#endif
