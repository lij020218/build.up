//
//  TodayView.swift — Today 화면 (웹 CEOMorningHero 1:1 미러)
//
//  웹 SSOT: apps/web/app/lib/components/dashboard/CEOMorningHero.tsx
//
//  구조 (3-Row hero outer card + nested cards):
//
//   ┌─ heroOuter (radius 24, 3-stop diagonal gradient, 2 radial glows) ─┐
//   │                                                                   │
//   │  Row 1 — 인사 영역                                                  │
//   │    [36×36 icon box] eyebrow(날짜·모드)                              │
//   │                     [pill 운영N일째] [pill 단계] [pill WoW%]          │
//   │                     "좋은 아침, 사장님"                              │
//   │                     "상호명 · 운영 N일째"                            │
//   │                                                                   │
//   │  Row 1.5 — 위험신호 박스 (HEALTH_COLORS, radius 14)                 │
//   │    [● dot] 제목   등급                                              │
//   │            메시지                                                  │
//   │                                                                   │
//   │  Row 2 — nested white card (radius 18) — NSM 메인 메트릭              │
//   │    NSM EYEBROW                                                    │
//   │    [큰 숫자 34pt]    [delta pill +18% WoW]                          │
//   │    "어제보다 +18% 성장 (description)"                                │
//   │                                                                   │
//   └───────────────────────────────────────────────────────────────────┘
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents

// MARK: - TodayView

public struct TodayView: View {

    let mock: MockData
    let healthResult: UnifiedHealthResult
    let hero: Hero
    @State private var showInputSheet = false

    public init(mock: MockData) {
        self.mock = mock
        self.healthResult = HealthScore.calculate(
            entries: mock.entries,
            costs: mock.costs,
            category: mock.category,
            stage: mock.stage,
            currentCash: mock.currentCash
        )
        self.hero = HeroResolver.resolve(mock.resolverInput)
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: BUSpacing.shellGap) {
                // Header (사장님 추가 — 카드 아님)
                StoreStatusHeader(mock: mock)
                HomeRitualBanner()

                // ─ 7 카드 (사장님 결정 2026-05-14) ─

                // 1. CEOMorningHero — 인사 + 위험신호 + NSM + AI 코칭
                HeroOuterCard(
                    mock: mock,
                    healthResult: healthResult,
                    hero: hero
                )

                // 2. DailyKpiStrip — 5칸 핵심 KPI
                DailyKpiStrip(cells: dailyKpiCells)

                // 3. ActivitySnapshotCard — 7일 매출 흐름
                ActivitySnapshotCard(
                    entries: mock.entries,
                    bepDailySales: bepDailySales
                )

                // 4. UserActivityCard — 고객 변화 ★ 사장님 명시
                UserActivityCard(
                    totalCustomers: totalCustomers,
                    newThisMonth: 32,
                    repeatRate: 42,
                    avgTicket: avgTicket
                )

                // 5. CashflowHeroCard — 14일 잔고 ★ 사장님 명시
                CashflowHeroCard(
                    currentBalance: mock.currentCash ?? 0,
                    projectedBalances: projected14,
                    isCrisis: (projected14.last ?? 0) < 0,
                    crisisDaysUntil: crisisDaysUntil()
                )

                // 6. DailyOpsRitualCard — 오늘 운영 의식
                DailyOpsRitualCard(category: mock.category)

                // 7. 업종 특화 (외식 → PrimeCost / 스타트업 → CashZero / 미용 → 예약 …)
                IndustryFocusCard(mock: mock)

                // 빠른 매출 입력
                QuickInputButton(action: { showInputSheet = true })

                // 하단 탭바 회피
                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.screenMargin)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.md)
        }
        .background(BUBackgroundSurface())
        .sheet(isPresented: $showInputSheet) {
            QuickInputSheet()
        }
    }

    // MARK: - Derived for cards

    private var ratios: CostRatiosResult {
        CostRatios.calculate(
            costs: mock.costs,
            totalRevenue: mock.entries.reduce(0) { $0 + $1.sales },
            days: mock.entries.count
        )
    }

    private var bepDailySales: Double {
        mock.costs.total > 0 ? mock.costs.total / 26 : 0
    }

    private var totalCustomers: Int {
        max(1, mock.entries.reduce(0) { $0 + $1.customers })
    }

    private var avgTicket: Double {
        let totalRev = mock.entries.reduce(0.0) { $0 + $1.sales }
        let totalCust = totalCustomers
        return totalCust > 0 ? totalRev / Double(totalCust) : 0
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

    private func crisisDaysUntil() -> Int? {
        for (idx, b) in projected14.enumerated() where b < 0 {
            return idx
        }
        return nil
    }

    private var dailyKpiCells: [KpiCellData] {
        let yesterdayEntry = mock.entries.sorted { $0.date < $1.date }.last
        let yesterdaySales = yesterdayEntry?.sales ?? 0
        let yesterdayCust = yesterdayEntry?.customers ?? 0
        let avgT = yesterdayCust > 0 ? yesterdaySales / Double(yesterdayCust) : 0
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
            .init(label: "객단가", value: avgT, grade: avgT > 0 ? .healthy : .unknown, unit: "원"),
        ]
    }
}

// MARK: - Tier 0 — store title + ritual, 웹 OperationalDashboard 상단 미러

private struct StoreStatusHeader: View {
    let mock: MockData

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            Text(mock.storeName.isEmpty ? "내 가게" : mock.storeName)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.66)
                .lineLimit(1)
                .minimumScaleFactor(0.72)

            if mock.resolverInput.businessLaunched {
                LivePill()
            }

            Spacer(minLength: 0)
        }
        .padding(.top, 4)
    }
}

private struct LivePill: View {
    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(Color(red: 0x05/255, green: 0x96/255, blue: 0x69/255))
                .frame(width: 6, height: 6)
                .shadow(color: Color(red: 0x05/255, green: 0x96/255, blue: 0x69/255).opacity(0.25), radius: 3)
            Text("운영 중")
                .font(.system(size: 11.5, weight: .semibold))
                .foregroundStyle(Color(red: 0x05/255, green: 0x96/255, blue: 0x69/255))
                .tracking(0.1)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Color(red: 0x05/255, green: 0x96/255, blue: 0x69/255).opacity(0.08), in: Capsule())
        .fixedSize()
    }
}

private struct HomeRitualBanner: View {
    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.08))
                    .frame(width: 32, height: 32)
                Image(systemName: "calendar")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("이번 주 목표를 세워보세요")
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .tracking(-0.13)
                Text("지난주 하이라이트를 돌아보고 한 가지 집중 목표를 정합니다.")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
        )
    }
}

// MARK: - Hero Outer Card (3-Row 통합)

private struct HeroOuterCard: View {
    let mock: MockData
    let healthResult: UnifiedHealthResult
    let hero: Hero

    var body: some View {
        BUCard(.heroOuter) {
            VStack(alignment: .leading, spacing: BUSpacing.heroGap) {
                Row1Greeting(mock: mock, healthResult: healthResult)
                Row1_5RiskSignals(healthResult: healthResult)
                Row2NSMNested(mock: mock, hero: hero, healthResult: healthResult)
                Row3CoachingNested(hero: hero)
            }
        }
    }
}

// MARK: - Row 1 — 인사 + chips + greeting (웹 정확 미러)

private struct Row1Greeting: View {
    let mock: MockData
    let healthResult: UnifiedHealthResult

    private var greetingLine1: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let timeOfDay: String
        switch hour {
        case 5..<11:  timeOfDay = "좋은 아침"
        case 11..<17: timeOfDay = "오늘도 수고하세요"
        case 17..<22: timeOfDay = "저녁이에요"
        default:      timeOfDay = "밤이에요"
        }
        return "\(timeOfDay), \(mock.userName)"
    }

    private var periodIcon: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<11:  return "sun.max"
        case 11..<17: return "sun.haze"
        case 17..<22: return "moon.haze"
        default:      return "moon.stars"
        }
    }

    private var dateString: String {
        let df = DateFormatter()
        df.locale = Locale(identifier: "ko_KR")
        df.dateFormat = "M월 d일 EEE"
        return df.string(from: Date())
    }

    private var modeLabel: String {
        switch mock.category {
        case .startupTech: return "스타트업 모드"
        case .ecommerce:   return "온라인 모드"
        default:           return "운영 모드"
        }
    }

    private var weeklyChangePct: Double? {
        guard mock.entries.count >= 14 else { return nil }
        let sorted = mock.entries.sorted { $0.date < $1.date }
        let recent7 = sorted.suffix(7).reduce(0.0) { $0 + $1.sales }
        let prior7 = sorted.suffix(14).prefix(7).reduce(0.0) { $0 + $1.sales }
        guard prior7 > 0 else { return nil }
        return ((recent7 - prior7) / prior7) * 100
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // 36×36 icon box (웹과 동일)
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(BUColor.midnight08)
                    .frame(width: 36, height: 36)
                Image(systemName: periodIcon)
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(BUColor.midnight)
            }

            VStack(alignment: .leading, spacing: 3) {
                // Eyebrow row (single line)
                Text("\(dateString) · \(modeLabel)")
                    .buHeroEyebrowStyle()
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)

                // chips — 짧게 + 한 줄 보장
                HStack(spacing: 5) {
                    if mock.resolverInput.businessLaunched {
                        ChipFilled(text: "\(mock.daysSinceLaunch + 1)일째")
                    }
                    ChipSoft(text: shortStageLabel)
                    if let wow = weeklyChangePct {
                        ChipTrend(pct: wow)
                    }
                    Spacer(minLength: 0)
                }
                .padding(.top, 2)

                Text(greetingLine1)
                    .buHeroGreetingStyle()
                    .padding(.top, 6)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text("\(mock.storeName) · 운영 \(mock.daysSinceLaunch + 1)일째")
                    .buHeroSubgreetingStyle()
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
            }
            Spacer(minLength: 0)
        }
    }

    /// 모바일 viewport 에 맞는 짧은 단계 라벨
    private var shortStageLabel: String {
        switch mock.stage {
        case .early:  return "초기"
        case .growth: return "성장"
        case .mature: return "성숙"
        }
    }
}

// MARK: - Row 1.5 — 다중 위험신호 박스

private struct Row1_5RiskSignals: View {
    let healthResult: UnifiedHealthResult

    private var signals: [RiskSignal] {
        guard healthResult.ready else { return [] }
        let order: [DomainKey] = [.cash, .profit, .efficiency, .growth]
        var out: [RiskSignal] = []
        for key in order {
            guard let dom = healthResult.domains[key],
                  dom.grade == .critical || dom.grade == .warning,
                  let worst = dom.components
                    .filter({ $0.score.isFinite })
                    .min(by: { $0.score < $1.score })
            else { continue }
            out.append(RiskSignal(
                grade: dom.grade,
                title: title(for: key),
                message: "\(worst.name) \(formatValue(name: worst.name, value: worst.value)) — 영역 점수 \(Int(dom.score))점"
            ))
            if out.count >= 3 { break }
        }
        return out
    }

    private func title(for key: DomainKey) -> String {
        switch key {
        case .cash:       return "현금 흐름 위험"
        case .profit:     return "수익성 위험"
        case .efficiency: return "비용 효율 위험"
        case .growth:     return "성장 둔화"
        }
    }
    private func formatValue(name: String, value: Double) -> String {
        guard value.isFinite else { return "—" }
        if name.contains("런웨이") { return String(format: "%.1f개월", value) }
        if name.contains("성장") { return "\(value > 0 ? "+" : "")\(String(format: "%.1f", value))%" }
        return "\(String(format: "%.1f", value))%"
    }

    var body: some View {
        if !signals.isEmpty {
            VStack(spacing: BUSpacing.xs) {
                ForEach(signals) { s in
                    let palette = HealthColors.palette(for: s.grade)
                    BUCard(.inner, tint: palette.dot) {
                        HStack(alignment: .top, spacing: 11) {
                            Circle()
                                .fill(palette.dot)
                                .frame(width: 9, height: 9)
                                .padding(.top, 5)
                                .shadow(color: palette.glow, radius: 4)
                            VStack(alignment: .leading, spacing: 3) {
                                HStack(spacing: 8) {
                                    Text(s.title)
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(palette.text)
                                        .lineLimit(1)
                                    Text(s.grade.labelKo)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(palette.text.opacity(0.7))
                                        .textCase(.uppercase)
                                        .tracking(0.5)
                                    Spacer(minLength: 0)
                                }
                                Text(s.message)
                                    .font(.system(size: 12.5, weight: .medium))
                                    .foregroundStyle(BUColor.ink.opacity(0.7))
                                    .lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Row 2 — NSM nested white card

private struct Row2NSMNested: View {
    let mock: MockData
    let hero: Hero
    let healthResult: UnifiedHealthResult

    private var nsmValue: String {
        let last = mock.entries.sorted(by: { $0.date < $1.date }).last
        let v = Int(last?.sales ?? 0)
        if v == 0 { return "—" }
        return v.formatted(.number.grouping(.automatic))
    }

    private var nsmLabel: String { "어제 매출" }

    private var weeklyChangePct: Double? {
        guard mock.entries.count >= 14 else { return nil }
        let sorted = mock.entries.sorted { $0.date < $1.date }
        let r7 = sorted.suffix(7).reduce(0.0) { $0 + $1.sales }
        let p7 = sorted.suffix(14).prefix(7).reduce(0.0) { $0 + $1.sales }
        guard p7 > 0 else { return nil }
        return ((r7 - p7) / p7) * 100
    }

    private var deltaTone: (color: Color, bg: Color) {
        guard let pct = weeklyChangePct else {
            return (BUColor.inkMuted, BUColor.midnight08)
        }
        if pct >= 0 { return (BUColor.success, BUColor.success08) }
        return (BUColor.danger, BUColor.danger08)
    }

    private var avgDaily7: Double {
        let sorted = mock.entries.sorted { $0.date < $1.date }
        let last7 = sorted.suffix(7)
        guard !last7.isEmpty else { return 0 }
        return last7.reduce(0) { $0 + $1.sales } / Double(last7.count)
    }

    private var recentRevenueBars: [BUBarChart.Bar] {
        let byDate = Dictionary(uniqueKeysWithValues: mock.entries.map { ($0.date, $0.sales) })
        return lastSevenDates.enumerated().map { index, date in
            BUBarChart.Bar(
                value: byDate[date] ?? 0,
                label: shortWeekday(date),
                tone: .midnight,
                highlighted: index == lastSevenDates.count - 1
            )
        }
    }

    private var lastSevenDates: [String] {
        let calendar = Calendar(identifier: .gregorian)
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        let today = Date()

        return (0..<7).reversed().compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: -offset, to: today) else { return nil }
            return formatter.string(from: date)
        }
    }

    var body: some View {
        BUCard(.nested) {
            VStack(alignment: .leading, spacing: 12) {
                // Eyebrow
                Text(nsmLabel).buNsmEyebrowStyle()

                // Value + delta pill
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    Text(nsmValue)
                        .buNsmValueStyle()

                    if let pct = weeklyChangePct {
                        DeltaPill(pct: pct, label: "WoW", tone: deltaTone)
                    }
                }

                // Description
                if avgDaily7 > 0 {
                    Text("최근 7일 일평균 \(Int(avgDaily7).formatted())원")
                        .buNsmDescriptionStyle()
                }

                // iOS-style mobile bar chart
                if mock.entries.count >= 3 {
                    BUBarChart(
                        bars: recentRevenueBars,
                        height: 68,
                        showLabels: true
                    )
                    .padding(.top, 6)
                }
            }
        }
    }

    private func shortWeekday(_ isoDate: String) -> String {
        let input = DateFormatter()
        input.dateFormat = "yyyy-MM-dd"
        input.timeZone = TimeZone(identifier: "Asia/Seoul")
        guard let date = input.date(from: isoDate) else { return "" }

        let output = DateFormatter()
        output.locale = Locale(identifier: "ko_KR")
        output.dateFormat = "E"
        return output.string(from: date)
    }
}

private struct DeltaPill: View {
    let pct: Double
    let label: String
    let tone: (color: Color, bg: Color)

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: pct >= 0 ? "arrow.up.right" : "arrow.down.right")
                .font(.system(size: 10, weight: .heavy))
            Text("\(pct >= 0 ? "+" : "")\(String(format: "%.1f", pct))%")
                .font(.system(size: 12.5, weight: .bold))
                .monospacedDigit()
        }
        .foregroundStyle(tone.color)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(tone.bg, in: Capsule())
        .fixedSize()
    }
}

// MARK: - Row 3 — AI 코칭 nested card (CEOMorningHero 의 hero CTA)

private struct Row3CoachingNested: View {
    let hero: Hero

    private var toneColor: Color {
        switch hero.tone {
        case .crisis:  return BUColor.danger
        case .warning: return BUColor.warn
        case .neutral: return BUColor.midnight
        }
    }

    private var toneIcon: String {
        switch hero.tone {
        case .crisis:  return "exclamationmark.octagon.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .neutral: return "sparkles"
        }
    }

    var body: some View {
        BUCard(.nested) {
            VStack(alignment: .leading, spacing: 10) {
                // Tag
                HStack(spacing: 6) {
                    Image(systemName: toneIcon)
                        .font(.system(size: 11, weight: .bold))
                    Text(hero.tagKo)
                        .font(.system(size: 10.5, weight: .bold))
                        .tracking(1.1)
                        .textCase(.uppercase)
                }
                .foregroundStyle(toneColor)

                // 분석문
                Text(hero.analysisKo)
                    .font(.system(size: 14.5, weight: .medium))
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(4)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // 액션문
                if !hero.actionKo.isEmpty {
                    Text(hero.actionKo)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                // Reference badge
                if let ref = hero.referencedCase {
                    HStack(spacing: 4) {
                        Image(systemName: "bookmark.fill")
                            .font(.system(size: 9))
                        Text("사례: \(ref.name)")
                            .font(.system(size: 10.5, weight: .bold))
                            .tracking(0.4)
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(BUColor.midnight08, in: Capsule())
                }

                // CTA (gradient)
                CTAButton(label: hero.ctaKo, tone: hero.tone)
                    .padding(.top, 4)
            }
        }
    }
}

private struct CTAButton: View {
    let label: String
    let tone: HeroTone

    private var bgGradient: LinearGradient {
        switch tone {
        case .crisis:
            return LinearGradient(
                colors: [BUColor.danger, BUColor.danger.opacity(0.85)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .warning:
            return LinearGradient(
                colors: [BUColor.warn, BUColor.warn.opacity(0.85)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .neutral:
            return LinearGradient(
                colors: [BUColor.primaryButtonStart, BUColor.primaryButtonEnd],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
    private var shadowColor: Color {
        switch tone {
        case .crisis:  return BUColor.danger.opacity(0.18)
        case .warning: return BUColor.warn.opacity(0.18)
        case .neutral: return BUColor.primaryButtonStart.opacity(0.18)
        }
    }

    var body: some View {
        Button {
            #if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            #endif
        } label: {
            HStack(spacing: 6) {
                Text(label)
                    .font(.system(size: 13, weight: .bold))
                    .tracking(-0.1)
                Image(systemName: "arrow.right")
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(bgGradient, in: Capsule())
            .shadow(color: shadowColor, radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - 빠른 입력 버튼 (Hero 아래)

private struct QuickInputButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(BUColor.midnight08)
                        .frame(width: 36, height: 36)
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("오늘 매출 기록")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                    Text("5초면 됩니다 — AI 코칭이 더 정확해져요")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.inkSubtle)
            }
            .padding(EdgeInsets(top: 14, leading: 16, bottom: 14, trailing: 16))
            .background(
                LinearGradient(
                    colors: [BUColor.cardGradientTop, BUColor.cardGradientBottom],
                    startPoint: .top,
                    endPoint: .bottom
                ),
                in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
            .buShadow(.card)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Quick Input Sheet

private struct QuickInputSheet: View {
    @State private var sales: Int = 0
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            BUNumberPad(amount: $sales) {
                dismiss()
            }
            .navigationTitle("매출 입력")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소") { dismiss() }
                        .foregroundStyle(BUColor.inkSecondary)
                }
            }
            #endif
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Chip helpers (Row 1)

private struct ChipFilled: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(.white)
            .tracking(0.6)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(BUColor.midnight, in: Capsule())
    }
}

private struct ChipSoft: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(BUColor.midnight)
            .tracking(0.5)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(BUColor.midnight08, in: Capsule())
    }
}

private struct ChipTrend: View {
    let pct: Double

    var body: some View {
        let positive = pct >= 0
        HStack(spacing: 2) {
            Image(systemName: positive ? "arrow.up.right" : "arrow.down.right")
                .font(.system(size: 9, weight: .heavy))
            Text("\(positive ? "+" : "")\(String(format: "%.0f", pct))%")
                .font(.system(size: 10, weight: .bold))
                .monospacedDigit()
        }
        .foregroundStyle(positive ? BUColor.success : BUColor.danger)
        .tracking(0.4)
        .padding(.horizontal, 8)
        .padding(.vertical, 2)
        .background(
            (positive ? BUColor.success : BUColor.danger).opacity(0.10),
            in: Capsule()
        )
        .fixedSize()
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Today — 안정 운영") {
    TodayView(mock: .healthyRestaurant)
}

#Preview("Today — 긴급 위기") {
    TodayView(mock: .criticalSaaS)
}

#Preview("Today — 주의 신호") {
    TodayView(mock: .warningCafe)
}

#Preview("Today — 첫 진입") {
    TodayView(mock: .empty)
}
#endif
