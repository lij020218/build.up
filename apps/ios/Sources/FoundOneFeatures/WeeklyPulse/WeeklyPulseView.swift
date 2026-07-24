//
//  WeeklyPulseView.swift — Tier 2 통합 (웹 sections/Tier2WeeklyPulse.tsx 미러)
//
//  웹 카드 순서:
//   1. SurvivalBoardCard — 4셀 + 헬스 게이지
//   2. Cashflow13WeekForecastCard — 13주 잔고 예측
//   3. CostStructureCard — 비용 구조 (외식만)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneData

public struct WeeklyPulseView: View {

    let mock: MockData
    /// SaaS 사용자 지표 store (스타트업 전용). nil = 데모/프리뷰.
    var saas: SaasMetricsStore? = nil
    /// 구독 운영 store. usesSubscriptions=true 일 때만 구독관리 카드 노출.
    var subscription: SubscriptionStore? = nil

    /// 선택한 프랜차이즈 브랜드 id (창업유형/프랜차이즈 단계에서 영속) — 브랜드 벤치마크 비교용.
    @AppStorage("stage.franchise.selectedBrandId") private var selectedFranchiseBrandId: String = ""

    public init(mock: MockData, saas: SaasMetricsStore? = nil, subscription: SubscriptionStore? = nil) {
        self.mock = mock
        self.saas = saas
        self.subscription = subscription
    }

    private var ratios: CostRatiosResult {
        CostRatios.calculate(
            costs: mock.costs,
            totalRevenue: mock.entries.reduce(0) { $0 + $1.sales },
            days: mock.entries.count
        )
    }

    private var healthResult: UnifiedHealthResult {
        HealthScore.calculate(
            entries: mock.entries,
            costs: mock.costs,
            category: mock.category,
            stage: mock.stage,
            currentCash: mock.currentCash
        )
    }

    private var weeklyBalances: [Double] {
        guard let cash = mock.currentCash else { return [] }
        let weeklyNet = (ratios.monthlyRevenueEquivalent - mock.costs.total) / 4.33
        return (0..<13).map { week in
            cash + weeklyNet * Double(week)
        }
    }

    private var isCrisis: Bool {
        weeklyBalances.contains(where: { $0 < 0 })
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: BUSpacing.shellGap) {
                sectionEyebrow

                // 생존 보드·13주 예측 → "재무" 탭으로 이관 (2026-07-24 재무 페이지 신설, 웹 미러)
                HStack(spacing: 8) {
                    Text("재무 전망 — 손익분기 · 13주 자금흐름 · 12개월 시뮬레이션")
                        .font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    Spacer()
                    Text("재무 탭 →").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.midnight)
                }
                .padding(.horizontal, 14).padding(.vertical, 12)
                .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                if ratios.ready && mock.category != .startupTech {
                    CostStructureCard(
                        ingredientRatio: ratios.ingredientRatio,
                        laborRatio: ratios.laborRatio,
                        rentRatio: ratios.rentRatio,
                        primeCostRatio: ratios.primeCostRatio,
                        thresholds: IndustryThresholds.thresholds(for: mock.category)
                    )
                }

                // 업종 비교 (공정위 기반) — 매출 기준 있는 업종 + 기록 3일+ 일 때만 (가짜 백분위 방지)
                if let benchmark = IndustryBenchmarkRegistry.benchmark(for: mock.category),
                   mock.entries.count >= 3 {
                    IndustryBenchmarkCard(benchmark: benchmark, entries: mock.entries)
                }

                // 브랜드 비교 (선택 프랜차이즈 + 벤치마크 존재 + 기록 3일+) — 웹 AiCoachCard 1:1
                if !selectedFranchiseBrandId.isEmpty,
                   let fb = FranchiseBenchmarkRegistry.benchmark(brandId: selectedFranchiseBrandId),
                   mock.entries.count >= 3 {
                    FranchiseBenchmarkCard(
                        benchmark: fb,
                        brandName: FranchiseBrandRegistry.brand(by: selectedFranchiseBrandId)?.name.ko ?? selectedFranchiseBrandId,
                        entries: mock.entries
                    )
                }

                // SaaS 사용자 지표 (스타트업 전용) — 연동되면 실데이터, 아니면 정직한 "연동 필요"
                if mock.category == .startupTech, let saas {
                    SaasMetricsCard(store: saas)
                }

                // 구독 관리 — 구독형 수익 모델 선택(uses_subscriptions) 사용자에게만 (웹과 동일 게이팅)
                if let subscription, subscription.usesSubscriptions {
                    SubscriptionManagementCard(store: subscription)
                }

                // ━━━ 추가 블록 (웹 ReportsSurface 미러) ━━━
                WeeklyChecklistBlock()
                MonthlyRevenueProgressBlock(entries: mock.entries)
                WeeklyInsightsBlock(entries: mock.entries, ratios: ratios, category: mock.category)

                Color.clear.frame(height: 110)
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, BUSpacing.md)
            .padding(.bottom, BUSpacing.md)
        }
        .background(BUBackgroundSurface())
    }

    private var sectionEyebrow: some View {
        HStack(spacing: 6) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(BUColor.midnight.opacity(0.7))
            Text("이번 주 점검")
                .buSectionEyebrowStyle()
            Spacer()
        }
        .padding(.top, 4)
    }
}

// MARK: - IndustryBenchmarkCard (업종 비교 — 공정위 기반 백분위)
//
//  웹 SSOT 미러: apps/web/.../dashboard/SocialBenchmarkCard.tsx
//  데이터·백분위: FoundOneCore IndustryBenchmarkRegistry (공정거래위원회 정보공개서·소상공인실태조사).
//  정직성: 데이터 <3일 또는 매출 기준 없는 업종(스타트업)이면 호출부에서 비표시.
//
public struct IndustryBenchmarkCard: View {

    let benchmark: IndustryBenchmark
    let entries: [DailyEntry]

    public init(benchmark: IndustryBenchmark, entries: [DailyEntry]) {
        self.benchmark = benchmark
        self.entries = entries
    }

    /// 월 환산 매출 추정 = 일평균 × 26 영업일 (웹과 동일 가정).
    private var projectedMonthly: Double {
        guard !entries.isEmpty else { return 0 }
        let total = entries.reduce(0) { $0 + $1.sales }
        return (total / Double(entries.count)) * 26
    }

    private var pos: IndustryBenchmarkPosition {
        IndustryBenchmarkCalc.position(benchmark: benchmark, projectedMonthly: projectedMonthly)
    }

    private var isPositive: Bool { pos.percentile >= 75 }
    /// 디자인 토큰: 신호등 컬러 회피 — 상위권만 success 강조, 나머지는 미드나잇.
    private var toneColor: Color { isPositive ? BUColor.success : BUColor.midnight }

    private var message: String {
        if pos.percentile >= 75 {
            return "같은 업종 상위 \(100 - pos.percentile)% 수준이에요. 이 페이스를 유지하세요."
        }
        if pos.percentile >= 40 {
            let gap = max(0, pos.top10Monthly - pos.projectedMonthly)
            return "업종 평균 근처에요. 상위 10%까지 월 \(fmtWon(gap)) 더 필요합니다."
        }
        let gap = max(0, pos.avgMonthly - pos.projectedMonthly)
        return "업종 평균보다 아래에요. 평균까지 월 \(fmtWon(gap)) 추가 필요."
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                // 헤더 + 상위 % pill
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(toneColor.opacity(0.10)).frame(width: 36, height: 36)
                        Image(systemName: isPositive ? "rosette" : "chart.bar.xaxis")
                            .font(.system(size: 14, weight: .semibold)).foregroundStyle(toneColor)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("업종 비교").buSectionEyebrowStyle()
                        Text("같은 업종에서 내 위치").font(.system(size: 15, weight: .bold)).foregroundStyle(BUColor.ink)
                    }
                    Spacer(minLength: 0)
                    HStack(spacing: 4) {
                        Image(systemName: isPositive ? "trophy.fill" : "arrow.up.right")
                            .font(.system(size: 10, weight: .heavy))
                        Text("상위 \(100 - pos.percentile)%").font(.system(size: 12, weight: .bold)).monospacedDigit()
                    }
                    .foregroundStyle(toneColor)
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .background(toneColor.opacity(0.10), in: Capsule())
                }

                benchmarkBar

                // 인사이트 메시지
                Text(message)
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(toneColor).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .background(toneColor.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))

                // 출처 (정직성: 출처·기준연도·분포추정 명시)
                Text("※ 기준 \(String(IndustryBenchmarkProvenance.disclosureYear))년 · \(IndustryBenchmarkProvenance.source)\n\(IndustryBenchmarkProvenance.distributionNoteKo)")
                    .font(.system(size: 10, weight: .medium)).foregroundStyle(BUColor.inkSubtle)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var benchmarkBar: some View {
        let barMax = max(pos.top10Monthly, pos.projectedMonthly * 1.1, 1)
        let userPct = min(1, pos.projectedMonthly / barMax)
        let avgPct = min(1, pos.avgMonthly / barMax)
        let top10Pct = min(1, pos.top10Monthly / barMax)
        return VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text("내 매장 (이번 달 예상)").font(.system(size: 11.5, weight: .semibold)).foregroundStyle(BUColor.inkSecondary)
                Spacer()
                Text(fmtWon(pos.projectedMonthly)).font(.system(size: 14, weight: .bold)).monospacedDigit().foregroundStyle(toneColor)
            }
            GeometryReader { geo in
                let w = geo.size.width
                ZStack(alignment: .leading) {
                    Capsule().fill(BUColor.midnight.opacity(0.06))
                    Capsule().fill(toneColor.opacity(0.85)).frame(width: max(4, w * userPct))
                    // 평균 기준선
                    Rectangle().fill(BUColor.ink.opacity(0.4)).frame(width: 1.5)
                        .offset(x: w * avgPct)
                    // 상위 10% 기준선
                    Rectangle().fill(BUColor.success.opacity(0.7)).frame(width: 1.5)
                        .offset(x: w * top10Pct)
                }
            }
            .frame(height: 7)
            HStack {
                Text("0").font(.system(size: 10, weight: .semibold)).foregroundStyle(BUColor.inkSubtle)
                Spacer()
                Text("평균 \(fmtWon(pos.avgMonthly))").font(.system(size: 10, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                Spacer()
                Text("상위10% \(fmtWon(pos.top10Monthly))").font(.system(size: 10, weight: .semibold)).foregroundStyle(BUColor.success.opacity(0.85))
            }
        }
    }

    /// 웹 fmt 1:1 — 억원(소수1)/만원/원.
    private func fmtWon(_ n: Double) -> String {
        let abs = Swift.abs(n.rounded())
        if abs >= 100_000_000 { return "\(String(format: "%.1f", n / 100_000_000))억원" }
        if abs >= 10_000 { return "\(Int((n / 10_000).rounded()).formatted())만원" }
        return "\(Int(abs).formatted())원"
    }
}

// MARK: - WeeklyChecklistBlock

public struct WeeklyChecklistBlock: View {

    struct Item: Identifiable {
        let id = UUID()
        let label: String
        let hint: String
    }

    private let items: [Item] = [
        .init(label: "매출 입력 7일", hint: "주 7일 모두 매출 기록 완료"),
        .init(label: "비용 결산", hint: "재료비·인건비·임대료 확인"),
        .init(label: "재고 정산", hint: "주요 품목 실재고 카운트"),
        .init(label: "직원 미팅", hint: "주간 1회 짧은 공유"),
        .init(label: "다음 주 목표 설정", hint: "한 줄 목표·1개 액션")
    ]

    @State private var checked: Set<UUID> = []

    public init() {}

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                        Image(systemName: "checklist")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("CHECKLIST")
                            .buSectionEyebrowStyle()
                        Text("주간 점검 5가지")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                    Text("\(checked.count)/\(items.count)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(checked.count == items.count ? BUColor.success : BUColor.midnight)
                        .monospacedDigit()
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(
                            (checked.count == items.count ? BUColor.success : BUColor.midnight).opacity(0.10),
                            in: Capsule()
                        )
                }

                VStack(spacing: 6) {
                    ForEach(items) { item in
                        row(item)
                    }
                }
            }
        }
    }

    private func row(_ item: Item) -> some View {
        let isOn = checked.contains(item.id)
        return Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.85)) {
                if isOn { checked.remove(item.id) } else { checked.insert(item.id) }
            }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(isOn ? BUColor.success : BUColor.inkSubtle)
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.label)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.ink.opacity(isOn ? 0.5 : 0.9))
                        .strikethrough(isOn, color: BUColor.inkSubtle)
                    Text(item.hint)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Spacer()
            }
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - MonthlyRevenueProgressBlock
//
//  웹 SSOT 미러: apps/web/.../dashboard/MonthlyProgressCard.tsx + packages/shared `calculateMoM`.
//
//  정직성 (가짜 숫자 금지):
//   · 이번 달 누적 매출(MTD) vs 전월 "동기"(같은 일자까지) — 실데이터(mock.entries)에서만 계산.
//   · 전월 동기 데이터가 없으면 "지난 달 데이터 없음" — 절대 이번 달에서 역산한 샘플 금지.
//   · 비용·순이익 비교는 표시하지 않음: iOS 는 월별 cost history 가 없어 정직한 비교가 불가
//     (웹의 동일 카드도 매출만 비교). cost_history 도입 시 행 추가.
//
public struct MonthlyRevenueProgressBlock: View {

    let entries: [DailyEntry]

    public init(entries: [DailyEntry]) {
        self.entries = entries
    }

    private var mom: MoMComparison? { MoMCalculator.calculate(entries: entries) }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                header
                if let mom, mom.currentDays > 0 {
                    content(mom)
                } else {
                    emptyState
                }
            }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle().fill(BUColor.midnight08).frame(width: 36, height: 36)
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("MONTHLY")
                    .buSectionEyebrowStyle()
                Text("이번 달 진행")
                    .font(.system(size: 15, weight: .bold))
            }
            Spacer()
        }
    }

    @ViewBuilder
    private func content(_ mom: MoMComparison) -> some View {
        // 이번 달 누적 매출
        VStack(alignment: .leading, spacing: 2) {
            Text("이번 달 누적 매출")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
            Text(formatKRWLocal(mom.currentMTD))
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(BUColor.midnight)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }

        Divider().background(BUColor.midnight.opacity(0.08))

        // 전월 동기 대비 + 현재 페이스
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("전월 동기 대비")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                if mom.isComparable {
                    let positive = mom.momChangePercent >= 0
                    Text("\(positive ? "+" : "")\(String(format: "%.1f", mom.momChangePercent))%")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(positive ? BUColor.success : BUColor.danger)
                        .monospacedDigit()
                } else {
                    // 전월 동기 데이터 없음 — "+0.0%" 거짓 표시 방지
                    Text("지난 달 데이터 없음")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.inkSubtle)
                }
            }
            Spacer(minLength: 0)
            VStack(alignment: .trailing, spacing: 3) {
                Text("현재 페이스")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                Text("월말 \(formatKRWLocal(mom.projectedMonthEnd)) 예상")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
    }

    private var emptyState: some View {
        Text("이번 달 매출을 1건 이상 기록하면 진행률이 표시됩니다")
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(BUColor.inkMuted)
            .lineSpacing(2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 14)
    }
}

// MARK: - WeeklyInsightsBlock
//
//  웹 SSOT 미러: 요일별 매출 패턴(packages/shared simulation.ts `dayOfWeekAvg`),
//               비용 비율(cost-ratios.ts + IndustryThresholds).
//
//  정직성 (가짜 숫자 금지):
//   · 모든 인사이트는 실데이터(entries·ratios)에서 계산. 계산 불가하면 그 항목을 생략.
//   · 단골 win-back("단골 N명 미방문")은 표시하지 않음 — iOS·웹 모두 per-customer(고객 식별)
//     데이터가 없어 정직하게 계산 불가. 고객 단위 데이터 도입 시 추가.
//   · 보여줄 인사이트가 하나도 없으면 정직한 빈 상태.
//
public struct WeeklyInsightsBlock: View {

    let entries: [DailyEntry]
    let ratios: CostRatiosResult
    let category: IndustryCategory

    public init(entries: [DailyEntry], ratios: CostRatiosResult, category: IndustryCategory) {
        self.entries = entries
        self.ratios = ratios
        self.category = category
    }

    struct Insight: Identifiable {
        let id = UUID()
        let icon: String
        let tint: Color
        let title: String
        let body: String
    }

    private static let kstCalendar: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        return c
    }()

    private static let isoFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    /// 실데이터에서 계산 가능한 인사이트만 모음 — 빈 배열이면 빈 상태.
    private var insights: [Insight] {
        var result: [Insight] = []
        if let weekend = weekendVsWeekdayInsight() { result.append(weekend) }
        if let cost = costRatioInsight() { result.append(cost) }
        return result
    }

    /// 주말(토·일) vs 평일(월~금) 일평균 매출 비교 — 실 entries 요일별 평균.
    ///   표본이 충분(주말 2일+, 평일 3일+)하고 차이가 의미 있을 때만 표시.
    private func weekendVsWeekdayInsight() -> Insight? {
        // 0=일 … 6=토 (Calendar weekday 1=일 → index 0)
        var buckets: [[Double]] = Array(repeating: [], count: 7)
        for e in entries {
            guard let d = Self.isoFormatter.date(from: e.date) else { continue }
            let wd = Self.kstCalendar.component(.weekday, from: d)  // 1...7
            buckets[wd - 1].append(e.sales)
        }
        let weekendSales = buckets[0] + buckets[6]          // 일 + 토
        let weekdaySales = buckets[1...5].flatMap { $0 }    // 월~금
        guard weekendSales.count >= 2, weekdaySales.count >= 3 else { return nil }

        let weekendAvg = weekendSales.reduce(0, +) / Double(weekendSales.count)
        let weekdayAvg = weekdaySales.reduce(0, +) / Double(weekdaySales.count)
        guard weekendAvg > 0, weekdayAvg > 0 else { return nil }

        let ratio = weekendAvg / weekdayAvg
        if ratio >= 1.3 {
            return Insight(
                icon: "arrow.up.right.circle.fill",
                tint: BUColor.success,
                title: "주말 매출이 평일의 \(String(format: "%.1f", ratio))배",
                body: "주말 객수·객단가가 높아요. 주말 인력·재고를 평일보다 더 확보해 보세요."
            )
        }
        if ratio <= 0.77 {
            let inv = weekdayAvg / weekendAvg
            return Insight(
                icon: "calendar",
                tint: BUColor.midnight,
                title: "평일 매출이 주말의 \(String(format: "%.1f", inv))배",
                body: "평일 수요가 더 커요. 평일 점심·저녁 시간대 프로모션에 집중해 보세요."
            )
        }
        return nil  // 차이 미미 — 인사이트 없음
    }

    /// 재료비 비율 vs 업종 권장 — ratios.ready + 업종에 식자재 기준이 있을 때만.
    private func costRatioInsight() -> Insight? {
        guard ratios.ready,
              let ing = IndustryThresholds.thresholds(for: category).ingredients else { return nil }
        let ratio = ratios.ingredientRatio   // percent (0-100)
        let recommended = ing.healthy         // 권장 상한 (lowerIsBetter)

        if ratio > ing.caution {
            return Insight(
                icon: "exclamationmark.triangle.fill",
                tint: BUColor.warn,
                title: "재료비 비율 \(pct(ratio))% → 권장 \(pct(recommended))% 초과",
                body: "주요 품목 단가를 재점검하거나 레시피 표준화로 식자재 손실을 줄여 보세요."
            )
        }
        if ratio <= ing.healthy {
            return Insight(
                icon: "checkmark.seal.fill",
                tint: BUColor.success,
                title: "재료비 비율 \(pct(ratio))% — 권장 \(pct(recommended))% 이내",
                body: "식자재 관리가 잘 되고 있어요. 이 수준을 유지하세요."
            )
        }
        return nil  // 권장~주의 사이 — 평이, 생략
    }

    private func pct(_ v: Double) -> String { "\(Int(v.rounded()))" }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(BUColor.success08).frame(width: 36, height: 36)
                        Image(systemName: "sparkles")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.success)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text("FOR THE OWNER")
                            .buSectionEyebrowStyle()
                        Text("사장님께 보내드릴 인사이트")
                            .font(.system(size: 15, weight: .bold))
                    }
                    Spacer()
                }

                let items = insights
                if items.isEmpty {
                    Text("아직 보내드릴 인사이트가 충분히 쌓이지 않았어요. 매출·비용을 꾸준히 기록하면 자동으로 분석해 드려요.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineSpacing(2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 14)
                } else {
                    VStack(spacing: 10) {
                        ForEach(items) { ins in
                            HStack(alignment: .top, spacing: 10) {
                                ZStack {
                                    Circle().fill(ins.tint.opacity(0.12)).frame(width: 30, height: 30)
                                    Image(systemName: ins.icon)
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundStyle(ins.tint)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(ins.title)
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(BUColor.ink)
                                    Text(ins.body)
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundStyle(BUColor.inkMuted)
                                        .lineSpacing(2)
                                }
                                Spacer()
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Helpers

private func formatKRWLocal(_ value: Double) -> String {
    let v = Int(round(value))
    let abs = Swift.abs(v)
    let sign = v < 0 ? "-" : ""
    if abs >= 100_000_000 { return "\(sign)\(String(format: "%.1f", Double(abs) / 100_000_000))억" }
    if abs >= 10_000 { return "\(sign)\(abs / 10_000)만" }
    return "\(sign)\(abs)"
}

#if DEBUG
#Preview("WeeklyPulse — 위기") {
    WeeklyPulseView(mock: .criticalSaaS)
}
#Preview("WeeklyPulse — 안정") {
    WeeklyPulseView(mock: .healthyRestaurant)
}
#endif
