//
//  TodayView.swift — Today 화면 (CEOMorningHero 모바일 버전)
//
//  웹 CEOMorningHero.tsx 의 핵심 5섹션을 모바일 1-col 세로 스택으로 재배치:
//
//   Row 1   — 시간대 인사 + 운영 N일째 + WoW chip
//   Row 1.5 — 다중 위험신호 박스 (HEALTH_COLORS) ← 신규 (2026-05-13)
//   Row 2   — 메인 메트릭 (NSM) + 14일 sparkline
//   Row 3   — AI 경영 코칭 카드 (HeroResolver 결과)
//   Row 4   — 빠른 매출 입력 진입 버튼
//
//  모바일 최적화:
//   • 카드 full-width, 좌우 margin 16pt
//   • 텍스트 자동 wrap, Dynamic Type 지원
//   • Hero 그라디언트 대체 → Liquid Glass material
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
        ZStack {
            BUBackgroundSurface()

            ScrollView {
                VStack(spacing: BUSpacing.cardGap) {
                    GreetingSection(mock: mock, healthResult: healthResult)
                    RiskSignalsSection(healthResult: healthResult, mock: mock)
                    MetricHeroSection(mock: mock, healthResult: healthResult)
                    CoachingCardSection(hero: hero)
                    QuickInputButton(action: { showInputSheet = true })
                }
                .padding(.horizontal, BUSpacing.md)
                .padding(.vertical, BUSpacing.md)
            }
        }
        .sheet(isPresented: $showInputSheet) {
            QuickInputSheet()
        }
    }
}

// MARK: - Row 1 — 인사 (시간대 + 운영 N일째 + WoW)

private struct GreetingSection: View {
    let mock: MockData
    let healthResult: UnifiedHealthResult

    private var greeting: (line1: String, line2: String) {
        let hour = Calendar.current.component(.hour, from: Date())
        let timeOfDay: String
        switch hour {
        case 5..<11:  timeOfDay = "좋은 아침"
        case 11..<17: timeOfDay = "오늘도 수고하세요"
        case 17..<22: timeOfDay = "저녁이에요"
        default:      timeOfDay = "밤이에요"
        }
        return (
            line1: "\(timeOfDay), \(mock.userName)",
            line2: "\(mock.storeName) · 운영 \(mock.daysSinceLaunch)일째"
        )
    }

    private var dateString: String {
        let df = DateFormatter()
        df.locale = Locale(identifier: "ko_KR")
        df.dateFormat = "M월 d일 EEEE"
        return df.string(from: Date())
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
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                // Eyebrow + chips row
                HStack(spacing: BUSpacing.xs) {
                    BUEyebrow(dateString.uppercased())
                    Spacer(minLength: BUSpacing.xs)
                    BUTagBadge("운영 \(mock.daysSinceLaunch)일째", style: .solid)
                    if let wow = weeklyChangePct {
                        BUTrendChip(changePct: wow, label: "WoW")
                    }
                }
                // 인사
                VStack(alignment: .leading, spacing: 2) {
                    Text(greeting.line1)
                        .buCardTitleStyle()
                    Text(greeting.line2)
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                }
                // 건강도 pill (있을 때만)
                if healthResult.ready {
                    HStack(spacing: BUSpacing.xs) {
                        BUHealthDot(grade: healthResult.grade, size: 8)
                        Text("건강도 \(Int(healthResult.score))점 · \(healthResult.grade.labelKo)")
                            .font(BUFont.labelSmall)
                            .foregroundStyle(HealthColors.palette(for: healthResult.grade).text)
                    }
                    .padding(.top, 2)
                }
            }
        }
    }
}

// MARK: - Row 1.5 — 다중 위험신호 박스

private struct RiskSignalsSection: View {
    let healthResult: UnifiedHealthResult
    let mock: MockData

    private var riskSignals: [RiskSignal] {
        // 데이터 불충분 시 빈 배열
        guard healthResult.ready else { return [] }

        // 도메인 우선순위 (cash → profit → efficiency → growth)
        let order: [DomainKey] = [.cash, .profit, .efficiency, .growth]
        var signals: [RiskSignal] = []

        for key in order {
            guard let domain = healthResult.domains[key],
                  domain.grade == .critical || domain.grade == .warning,
                  let worst = domain.components
                    .filter({ $0.score.isFinite })
                    .min(by: { $0.score < $1.score })
            else { continue }

            let valueText = formatComponentValue(name: worst.name, value: worst.value)
            signals.append(RiskSignal(
                grade: domain.grade,
                title: titleByDomain(key),
                message: "\(worst.name) \(valueText) — 영역 점수 \(Int(domain.score))점"
            ))
            if signals.count >= 3 { break }
        }
        return signals
    }

    private func titleByDomain(_ key: DomainKey) -> String {
        switch key {
        case .cash:       return "현금 흐름 위험"
        case .profit:     return "수익성 위험"
        case .efficiency: return "비용 효율 위험"
        case .growth:     return "성장 둔화"
        }
    }

    private func formatComponentValue(name: String, value: Double) -> String {
        guard value.isFinite else { return "—" }
        if name.contains("런웨이") { return String(format: "%.1f개월", value) }
        if name.contains("성장")  { return "\(value > 0 ? "+" : "")\(String(format: "%.1f", value))%" }
        return "\(String(format: "%.1f", value))%"
    }

    var body: some View {
        if !riskSignals.isEmpty {
            VStack(spacing: BUSpacing.xs) {
                ForEach(riskSignals) { signal in
                    BUCard(.subtle, tint: HealthColors.palette(for: signal.grade).dot) {
                        HStack(alignment: .top, spacing: 11) {
                            BUHealthDot(grade: signal.grade, animated: signal.grade == .critical)
                                .padding(.top, 5)
                            VStack(alignment: .leading, spacing: 3) {
                                HStack(spacing: 8) {
                                    Text(signal.title)
                                        .font(BUFont.label)
                                        .foregroundStyle(HealthColors.palette(for: signal.grade).text)
                                    Text(signal.grade.labelKo)
                                        .font(BUFont.eyebrow)
                                        .foregroundStyle(HealthColors.palette(for: signal.grade).text.opacity(0.7))
                                        .textCase(.uppercase)
                                        .tracking(0.5)
                                }
                                Text(signal.message)
                                    .font(BUFont.labelSmall)
                                    .foregroundStyle(BUColor.inkSecondary)
                                    .lineSpacing(2)
                            }
                            Spacer(minLength: 0)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Row 2 — 메인 메트릭 + sparkline

private struct MetricHeroSection: View {
    let mock: MockData
    let healthResult: UnifiedHealthResult

    private var todayLabel: String {
        if mock.entries.isEmpty { return "최근 입력 없음" }
        return "어제 매출"
    }

    private var todayValue: String {
        let last = mock.entries.sorted(by: { $0.date < $1.date }).last
        guard let v = last?.sales, v > 0 else { return "—" }
        return formatKRW(Int(v))
    }

    private var avgDaily7: Double {
        let sorted = mock.entries.sorted { $0.date < $1.date }
        let last7 = sorted.suffix(7)
        guard !last7.isEmpty else { return 0 }
        return last7.reduce(0) { $0 + $1.sales } / Double(last7.count)
    }

    private func formatKRW(_ value: Int) -> String {
        if value >= 100_000_000 {
            return "\(String(format: "%.1f", Double(value) / 100_000_000))억"
        }
        if value >= 10_000 {
            return "\(value / 10_000)만"
        }
        return value.formatted()
    }

    var body: some View {
        BUCard(.hero) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                // 라벨
                BUEyebrow(todayLabel)

                // 큰 숫자
                HStack(alignment: .bottom, spacing: 6) {
                    Text(todayValue)
                        .buHeroNumberStyle()
                    if todayValue != "—" {
                        Text("원")
                            .font(BUFont.cardTitleSmall)
                            .foregroundStyle(BUColor.inkMuted)
                            .padding(.bottom, 6)
                    }
                }

                // 보조 정보
                if avgDaily7 > 0 {
                    HStack(spacing: 6) {
                        Image(systemName: "chart.bar.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(BUColor.midnight.opacity(0.5))
                        Text("최근 7일 일평균 \(formatKRW(Int(avgDaily7)))원")
                            .font(BUFont.bodyCaption)
                            .foregroundStyle(BUColor.inkSecondary)
                    }
                }

                // Sparkline (14일)
                if mock.entries.count >= 3 {
                    BUSparkline(
                        entries: mock.entries,
                        tint: HealthColors.palette(for: healthResult.grade).dot,
                        height: 44
                    )
                    .padding(.top, BUSpacing.xs)
                }
            }
        }
    }
}

// MARK: - Row 3 — AI 코칭 카드

private struct CoachingCardSection: View {
    let hero: Hero

    private var toneColor: Color {
        switch hero.tone {
        case .crisis:  return BUColor.toneCrisis
        case .warning: return BUColor.toneWarning
        case .neutral: return BUColor.toneNeutral
        }
    }

    var body: some View {
        BUCard(.card, tint: hero.tone == .neutral ? nil : toneColor) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                // Tag
                HStack(spacing: 6) {
                    Image(systemName: tagIcon)
                        .font(.system(size: 11, weight: .bold))
                    Text(hero.tagKo)
                        .font(BUFont.eyebrow)
                        .tracking(0.5)
                }
                .foregroundStyle(toneColor)

                // 분석문
                Text(hero.analysisKo)
                    .font(BUFont.body)
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(3)
                    .multilineTextAlignment(.leading)

                // 액션문
                if !hero.actionKo.isEmpty {
                    Text(hero.actionKo)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }

                // 사례 배지
                if let ref = hero.referencedCase {
                    HStack(spacing: 4) {
                        Image(systemName: "bookmark.fill")
                            .font(.system(size: 9))
                        Text("사례: \(ref.name)")
                            .font(BUFont.eyebrow)
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(BUColor.midnight.opacity(0.08), in: Capsule())
                }

                // CTA 버튼
                CTAButton(label: hero.ctaKo, tone: hero.tone)
                    .padding(.top, BUSpacing.xxs)
            }
        }
    }

    private var tagIcon: String {
        switch hero.tone {
        case .crisis:  return "exclamationmark.octagon.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .neutral: return "sparkles"
        }
    }
}

// MARK: - CTAButton

private struct CTAButton: View {
    let label: String
    let tone: HeroTone

    private var bg: Color {
        switch tone {
        case .crisis:  return BUColor.toneCrisis
        case .warning: return BUColor.toneWarning
        case .neutral: return BUColor.midnight
        }
    }

    var body: some View {
        Button {
            // CTA action — 추후 ctaTarget 라우팅 연결
            #if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            #endif
        } label: {
            HStack(spacing: 6) {
                Text(label)
                    .font(BUFont.label)
                Image(systemName: "arrow.right")
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(bg, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Row 4 — 빠른 입력 진입 버튼

private struct QuickInputButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: BUSpacing.sm) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(BUColor.midnight)
                VStack(alignment: .leading, spacing: 1) {
                    Text("오늘 매출 기록")
                        .font(BUFont.label)
                        .foregroundStyle(BUColor.ink)
                    Text("5초면 됩니다 — AI 코칭이 더 정확해져요")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkMuted)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.inkSubtle)
            }
            .padding(BUSpacing.md)
            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.lg, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.lg, style: .continuous)
                    .strokeBorder(BUColor.border, lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - QuickInputSheet (BUNumberPad)

private struct QuickInputSheet: View {
    @State private var sales: Int = 0
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            BUNumberPad(amount: $sales) {
                // TODO: Supabase 동기화 호출
                dismiss()
            }
            .navigationTitle("매출 입력")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소") { dismiss() }
                        .foregroundStyle(BUColor.inkSecondary)
                }
                #else
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                        .foregroundStyle(BUColor.inkSecondary)
                }
                #endif
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Today — 안정 운영") {
    TodayView(mock: .healthyRestaurant)
}

#Preview("Today — 주의 신호 (카페)") {
    TodayView(mock: .warningCafe)
}

#Preview("Today — 긴급 위기 (SaaS)") {
    TodayView(mock: .criticalSaaS)
}

#Preview("Today — 매출 미기록 5일") {
    TodayView(mock: .staleSalesRestaurant)
}

#Preview("Today — 첫 진입 (empty)") {
    TodayView(mock: .empty)
}

#Preview("Today — Dark Mode") {
    TodayView(mock: .warningCafe)
        .preferredColorScheme(.dark)
}
#endif
