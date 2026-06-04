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

// MARK: - CustomerInterviewCard (고객 인터뷰 — Mom Test, 정적 질문)
//
//  웹 SSOT: apps/web/.../CustomerInterviewCard.tsx. iOS 컴팩트본 — 핵심 가치(질문지)만.
//  정적 콘텐츠(가짜 아님). AI 생성·CSV 등 백엔드 기능은 웹 전용.
//
public struct CustomerInterviewCard: View {
    public init() {}

    private let questions = [
        "이 가게에 처음 오신 게 언제였어요?",
        "오늘 말고 가장 최근에는 언제 오셨어요?",
        "보통 우리 가게 말고 어디를 가시나요?",
        "여기에 다시 오시는 가장 큰 이유가 뭐예요?",
        "혹시 불편하거나 아쉬운 점이 있나요?",
    ]

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 11, style: .continuous)
                            .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                        Image(systemName: "quote.bubble.fill").font(.system(size: 15, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("고객 인터뷰").buSectionEyebrowStyle()
                        Text("Mom Test · 의견 말고 과거 행동을 묻기").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer(minLength: 0)
                }
                Text("\"맛있어요?\"(의견) 대신 \"최근에 어디 가셨어요?\"(행동)를 물어야 진짜 답이 나와요.")
                    .font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                VStack(alignment: .leading, spacing: 7) {
                    ForEach(Array(questions.enumerated()), id: \.offset) { idx, q in
                        HStack(alignment: .top, spacing: 9) {
                            Text("\(idx + 1)").font(.system(size: 11, weight: .heavy)).monospacedDigit()
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 18, height: 18)
                                .background(BUColor.midnight08, in: Circle())
                            Text(q).font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                                .fixedSize(horizontal: false, vertical: true)
                            Spacer(minLength: 0)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - FirstCustomersCard (첫 100명 고객 확보 — 진행률 실데이터 + 정적 전술)
public struct FirstCustomersCard: View {
    let cumulativeCustomers: Int
    public init(cumulativeCustomers: Int) { self.cumulativeCustomers = cumulativeCustomers }

    private let tactics = [
        "지인·단골 10명에게 직접 알리기 (오픈 소식 + 첫 방문 혜택)",
        "네이버 플레이스 등록 + 사진 10장 + 첫 리뷰 5개 모으기",
        "당근 동네홍보 / 전단 — 반경 500m 집중",
        "재방문 쿠폰(2번째 방문 할인)으로 단골 전환",
    ]
    private var pct: Double { min(1, Double(cumulativeCustomers) / 100) }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 11, style: .continuous)
                            .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                        Image(systemName: "flag.checkered").font(.system(size: 15, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("첫 100명 고객").buSectionEyebrowStyle()
                        Text("초기 확보 플레이북").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer(minLength: 0)
                    Text("\(cumulativeCustomers) / 100").font(.system(size: 14, weight: .heavy)).monospacedDigit().foregroundStyle(BUColor.midnight)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(BUColor.midnight.opacity(0.08))
                        Capsule().fill(LinearGradient(colors: [BUColor.midnight, BUColor.midnightDeep], startPoint: .leading, endPoint: .trailing))
                            .frame(width: max(6, geo.size.width * pct))
                    }
                }
                .frame(height: 8)
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(Array(tactics.enumerated()), id: \.offset) { _, t in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "circle").font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.inkSubtle)
                            Text(t).font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary)
                                .fixedSize(horizontal: false, vertical: true)
                            Spacer(minLength: 0)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - InsuranceSimulatorCard (4대보험 시뮬레이터 — 채용 결정 즉답)
//
//  웹 SSOT 미러: apps/web/.../dashboard/InsuranceSimulatorCard.tsx
//  계산은 FoundOneCore `simulateInsurance` (요율 단일 정의 — 중복정의 금지).
//  월급은 사용자 입력(what-if), 산재 0.7% 일반서비스업 가정 — 웹과 동일.
//
public struct InsuranceSimulatorCard: View {

    /// 현재 사업장 직원 수 (두루누리 10인 미만 자격 판단). 실데이터: user_store_data.employees → storeInfo.state.employees.count.
    let currentEmployeeCount: Int
    public init(currentEmployeeCount: Int = 0) { self.currentEmployeeCount = currentEmployeeCount }

    private struct Preset: Identifiable {
        let id: String
        let label: String
        let salary: Int
        let hours: Double
    }

    private static let minWageMonthly = hourlyToMonthly(MINIMUM_WAGE_2026, weeklyHours: 40)
    private static let presets: [Preset] = [
        .init(id: "min-fulltime", label: "최저시급 풀타임", salary: minWageMonthly, hours: 40),
        .init(id: "common-3m",    label: "월 300만 정규직", salary: 3_000_000, hours: 40),
        .init(id: "part-25h",     label: "파트타임 25시간", salary: Int((Double(MINIMUM_WAGE_2026) * 25 * 4.345).rounded()), hours: 25),
        .init(id: "part-14h",     label: "주 14시간 단시간", salary: Int((Double(MINIMUM_WAGE_2026) * 14 * 4.345).rounded()), hours: 14),
    ]

    @State private var salary: Int = InsuranceSimulatorCard.minWageMonthly
    @State private var salaryText: String = "\(InsuranceSimulatorCard.minWageMonthly)"
    @State private var weeklyHours: Double = 40
    @State private var duruduri: Bool = true
    @State private var showBreakdown: Bool = false

    private var sim: InsuranceSimResult {
        simulateInsurance(InsuranceSimInput(
            monthlySalary: salary,
            weeklyHours: weeklyHours,
            totalEmployeeCount: currentEmployeeCount + 1,   // 시뮬 직원 1명 추가 가정
            isDuruduriEligible: duruduri
        ))
    }

    private var employerBurdenPct: Double {
        salary > 0 ? Double(sim.employer.afterDuruduri) / Double(salary) * 100 : 0
    }
    private var takeHomePct: Double {
        salary > 0 ? Double(salary - sim.employee.afterDuruduri) / Double(salary) * 100 : 0
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                presetChips
                inputRow
                duruduriToggle
                statsRow
                if !sim.warnings.isEmpty { warningsBox }
                breakdownToggle
                if showBreakdown { breakdown }
                footer
            }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 11, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                Image(systemName: "person.2.badge.gearshape").font(.system(size: 15, weight: .semibold)).foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("4대보험 시뮬레이터").buSectionEyebrowStyle()
                Text("직원 1명 채용하면 실제 얼마?").font(.system(size: 15, weight: .bold)).foregroundStyle(BUColor.ink)
            }
            Spacer(minLength: 0)
        }
    }

    private var presetChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(Self.presets) { p in
                    let on = salary == p.salary && weeklyHours == p.hours
                    Button {
                        salary = p.salary
                        salaryText = "\(p.salary)"
                        weeklyHours = p.hours
                    } label: {
                        Text(p.label)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(on ? BUColor.midnight : BUColor.inkMuted)
                            .padding(.horizontal, 11).padding(.vertical, 6)
                            .background(on ? BUColor.midnight08 : BUColor.surface, in: Capsule())
                            .overlay(Capsule().strokeBorder(on ? BUColor.midnight.opacity(0.35) : BUColor.inkSubtle.opacity(0.4), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var inputRow: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                Text("월급 (원)").font(.system(size: 10.5, weight: .bold)).foregroundStyle(BUColor.inkMuted).tracking(0.4).textCase(.uppercase)
                TextField("월급여", text: $salaryText)
                    .font(.system(size: 14, weight: .bold)).monospacedDigit()
                    .keyboardType(.numberPad)
                    .foregroundStyle(BUColor.midnightDeep)
                    .padding(.horizontal, 10).padding(.vertical, 8)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10))
                    .onChange(of: salaryText) { _, new in
                        let digits = new.filter(\.isNumber)
                        salary = min(20_000_000, Int(digits) ?? 0)
                    }
            }
            VStack(alignment: .leading, spacing: 4) {
                Text("주 근무시간").font(.system(size: 10.5, weight: .bold)).foregroundStyle(BUColor.inkMuted).tracking(0.4).textCase(.uppercase)
                HStack(spacing: 8) {
                    Text("\(Int(weeklyHours))시간").font(.system(size: 14, weight: .bold)).monospacedDigit().foregroundStyle(BUColor.midnightDeep)
                    Spacer(minLength: 0)
                    Stepper("", value: $weeklyHours, in: 1...60, step: 1).labelsHidden()
                }
                .padding(.horizontal, 10).padding(.vertical, 4)
                .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    private var duruduriToggle: some View {
        let active = duruduri && sim.duruduriEligible
        return Button { duruduri.toggle() } label: {
            HStack(spacing: 9) {
                Image(systemName: duruduri ? "checkmark.square.fill" : "square")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(active ? BUColor.midnight : BUColor.inkSubtle)
                VStack(alignment: .leading, spacing: 1) {
                    Text("두루누리 80% 지원 적용").font(.system(size: 12.5, weight: .bold)).foregroundStyle(BUColor.midnightDeep)
                    Text("월 270만 미만 + 10인 미만 + 신규 가입 36개월").font(.system(size: 10.5, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(active ? BUColor.midnight08 : BUColor.surface, in: RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(active ? BUColor.midnight.opacity(0.3) : BUColor.inkSubtle.opacity(0.3), lineWidth: 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var statsRow: some View {
        HStack(spacing: 8) {
            statBox(label: "사장님 실부담", value: formatKRW(Double(sim.totalMonthlyCostToEmployer)),
                    sub: "급여 +\(String(format: "%.1f", employerBurdenPct))%", emphasize: true)
            statBox(label: "직원 실수령", value: formatKRW(Double(salary - sim.employee.afterDuruduri)),
                    sub: "\(String(format: "%.1f", takeHomePct))% 수령", emphasize: false)
            statBox(label: "두루누리 절감", value: formatKRW(Double(sim.duruduriMonthlySaving)),
                    sub: sim.duruduriEligible ? "/ 월" : "자격 X", emphasize: false)
        }
    }

    private func statBox(label: String, value: String, sub: String, emphasize: Bool) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label).font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.inkMuted).tracking(0.3).textCase(.uppercase)
            Text(value).font(.system(size: 16, weight: .bold)).monospacedDigit()
                .foregroundStyle(emphasize ? BUColor.midnightDeep : BUColor.ink)
                .lineLimit(1).minimumScaleFactor(0.6)
            Text(sub).font(.system(size: 10, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10).padding(.vertical, 10)
        .background(emphasize ? BUColor.midnight08 : BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10))
    }

    private var warningsBox: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(Array(sim.warnings.enumerated()), id: \.offset) { _, w in
                HStack(alignment: .top, spacing: 6) {
                    Image(systemName: "sparkles").font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                    Text(w).font(.system(size: 11.5, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10))
    }

    private var breakdownToggle: some View {
        Button { withAnimation(.easeInOut(duration: 0.2)) { showBreakdown.toggle() } } label: {
            HStack {
                Text("보험료 항목별 분해").font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnightDeep)
                Spacer()
                Image(systemName: "chevron.down").font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.inkMuted)
                    .rotationEffect(.degrees(showBreakdown ? 180 : 0))
            }
            .padding(.horizontal, 12).padding(.vertical, 9)
            .background(BUColor.surface, in: RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.inkSubtle.opacity(0.3), lineWidth: 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var breakdown: some View {
        VStack(spacing: 0) {
            breakdownRow("국민연금", employer: sim.employer.pension, employee: sim.employee.pension)
            breakdownRow("건강보험", employer: sim.employer.health, employee: sim.employee.health)
            breakdownRow("장기요양", employer: sim.employer.longTermCare, employee: sim.employee.longTermCare)
            breakdownRow("고용보험", employer: sim.employer.employment, employee: sim.employee.employment)
            breakdownRow("산재보험", employer: sim.employer.workers, employee: 0, note: "사업주 100%")
            Divider().padding(.vertical, 4)
            breakdownRow("합계 (적용 전)", employer: sim.employer.total, employee: sim.employee.total, bold: true)
            if sim.duruduriEligible {
                breakdownRow("두루누리 적용 후", employer: sim.employer.afterDuruduri, employee: sim.employee.afterDuruduri, bold: true)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
        .background(BUColor.surface, in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.inkSubtle.opacity(0.25), lineWidth: 1))
    }

    private func breakdownRow(_ label: String, employer: Int, employee: Int, note: String? = nil, bold: Bool = false) -> some View {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                Text(label).font(.system(size: 11.5, weight: bold ? .bold : .medium)).foregroundStyle(bold ? BUColor.midnightDeep : BUColor.ink)
                if let note { Text("· \(note)").font(.system(size: 10, weight: .regular)).foregroundStyle(BUColor.inkMuted) }
            }
            Spacer(minLength: 0)
            Text("사장 \(employer.formatted())").font(.system(size: 11, weight: bold ? .bold : .medium)).monospacedDigit().foregroundStyle(BUColor.midnightDeep)
            Text("직원 \(employee.formatted())").font(.system(size: 11, weight: bold ? .bold : .medium)).monospacedDigit().foregroundStyle(BUColor.inkMuted)
                .frame(minWidth: 78, alignment: .trailing)
        }
        .padding(.vertical, 4)
    }

    private var footer: some View {
        Text("2026 요율 기준 (산재 0.7% 일반 서비스업 가정). 정확한 산재 요율은 근로복지공단(1588-0075)에서 업종별 확인하세요.")
            .font(.system(size: 10.5, weight: .medium)).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 6)
            .overlay(alignment: .top) { Divider().opacity(0.5) }
    }
}

public struct GrowthForecastView: View {

    let mock: MockData
    /// 현재 사업장 직원 수 (실데이터 — storeInfo.state.employees.count). 두루누리 자격·게이팅용.
    let currentEmployeeCount: Int

    public init(mock: MockData, currentEmployeeCount: Int = 0) {
        self.mock = mock
        self.currentEmployeeCount = currentEmployeeCount
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

    private var cumulativeCustomers: Int { mock.entries.reduce(0) { $0 + $1.customers } }

    // ⚠️ 2026-06-04: 종전 "재방문 42% / 단골 67명" 은 하드코딩 가짜였음 → 전부 실데이터로 교체.
    private var milestones: [ProgressMilestonesCard.Milestone] {
        [
            .init(label: "손익분기 달성", current: totalSales > mock.costs.total ? 1 : 0, target: 1, unit: "", achieved: totalSales > mock.costs.total),
            .init(label: "월 매출 1000만 돌파", current: min(1000, totalSales / 10000), target: 1000, unit: "만", achieved: totalSales >= 10_000_000),
            .init(label: "매출 기록 30일+", current: min(30, Double(mock.entries.count)), target: 30, unit: "일", achieved: mock.entries.count >= 30),
            .init(label: "100명 고객 확보", current: min(100, Double(cumulativeCustomers)), target: 100, unit: "명", achieved: cumulativeCustomers >= 100),
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

                // 첫 100명 고객 확보 — 개업 90일 이내 또는 아직 100명 미만 (진행률 실데이터)
                if mock.daysSinceLaunch <= 90 || cumulativeCustomers < 100 {
                    FirstCustomersCard(cumulativeCustomers: cumulativeCustomers)
                }

                // 고객 인터뷰 (Mom Test) — 전 업종
                CustomerInterviewCard()

                // 4대보험 시뮬레이터 — 웹 게이팅 1:1 (직원 ≥1 또는 인건비 입력)
                if currentEmployeeCount > 0 || mock.costs.labor > 0 {
                    InsuranceSimulatorCard(currentEmployeeCount: currentEmployeeCount)
                }

                // 마케팅 블록은 MarketingView 로 이전됨 (LoyaltyDonut / CampaignIdeas).

                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.md)
        }
        .background(BUBackgroundSurface())
    }
}

// 삭제됨: MarketingChannelROIBlock — 채널별 비용·방문·ROAS 가 전부 허구 상수였고
//   어디에서도 렌더링되지 않는 dead code 였음 (가짜 숫자 금지). 실 마케팅 지출은
//   MarketingView 의 MarketingCampaignsList(실 캠페인 repository) 가 담당한다.

// MARK: - LoyaltyDonutBlock

//  정직성 (가짜 숫자 금지): 단골/신규/일회성 비율은 고객별 방문 이력(per-customer)이 있어야
//   계산 가능. iOS·웹 모두 DailyEntry 는 일별 고객 "수"만 보유 → 비율 산출 불가.
//   기존 "단골 38% / 신규 24% / 일회성 38%" 는 모든 사용자에게 동일하게 박힌 허구였음.
//   가짜 도넛 대신 정직한 안내를 보여주고, 고객 단위 데이터 연동 시 실 비율로 교체.
public struct LoyaltyDonutBlock: View {

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

                Text("단골·신규·일회성 비율은 고객별 방문 이력이 쌓이면 자동으로 분석해 드려요. 멤버십·예약 연동이나 재방문 기록이 모이면 여기에 실제 비율이 표시됩니다.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 6)
            }
        }
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

    // 정직성: 아래는 업종 공통 "예시 플레이북"(일반 가이드)이며 특정 가게 데이터로 계산된 값이 아님.
    //   기존엔 "단골 24명·회수율 18%·미답글 6건·유입 +15-20명" 같은 허구 수치를 가게별 실측처럼
    //   보여줬음. 고객·리뷰·광고 데이터가 연동되기 전까지는 가짜 수치 없이 행동 가이드만 제공한다.
    private let ideas: [Idea] = [
        .init(
            title: "단골 win-back 메시지",
            icon: "envelope.badge.fill",
            tint: BUColor.midnight,
            summary: "한동안 안 오신 단골 다시 부르기",
            details: "마지막 방문일이 오래된 고객에게 카카오 채널·문자로 할인 쿠폰(예: 5,000원)을 보내 재방문을 유도하세요. 대상은 좁게, 메시지는 짧고 따뜻하게."
        ),
        .init(
            title: "리뷰 답글 관리",
            icon: "text.bubble.fill",
            tint: BUColor.success,
            summary: "새 리뷰에 빠르게 답글",
            details: "네이버 플레이스·배민 신규 리뷰에 24시간 안에 답글을 달면 신뢰도와 노출에 도움이 됩니다. 부정 리뷰일수록 정중하고 빠른 응대가 중요해요."
        ),
        .init(
            title: "점심 직장인 타임 광고",
            icon: "clock.fill",
            tint: Color(red: 0.18, green: 0.74, blue: 0.78),
            summary: "피크 시간대 집중 노출",
            details: "주변 오피스 상권을 타겟으로 배달앱·지역 광고를 점심 시간대(11:30~13:30)에 집중하세요. 예산은 소액(예: 일 1만원)으로 시작해 반응을 보고 조정합니다."
        ),
        .init(
            title: "주말 SNS 콘텐츠",
            icon: "camera.fill",
            tint: Color(red: 0.91, green: 0.30, blue: 0.55),
            summary: "신메뉴·매장 분위기 릴스",
            details: "인스타 릴스·스토리로 신메뉴나 매장 분위기를 보여주세요. 비용 없이 시작할 수 있고, 꾸준히 올릴수록 도달이 늘어납니다."
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
                        Text("캠페인 아이디어 (예시 가이드)")
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
