//
//  ReportsCalculator.swift — 보고서 period 별 집계 (웹 ReportView 의 useReportData 미러)
//
//  순수 함수 / Sendable / Foundation only — UI/Supabase 의존성 0.
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/ReportView.tsx + useReportData.ts
//
//  period 별:
//   • day      : 14일 라인 (일별) + 이전 7일 평균 대비 변화율
//   • week     : 8주 바    (주별) + 지난 주 대비 변화율
//   • month    : 6개월 바  (월별) + 지난 달 대비 + 비용 ×1.0
//   • quarter  : 4분기 바  (분기별) + 직전 분기 대비 + 비용 ×3.0
//

import Foundation

// MARK: - Public types

public enum ReportPeriod: String, Sendable, CaseIterable, Codable, Identifiable {
    case day, week, month, quarter
    public var id: String { rawValue }
    public var labelKo: String {
        switch self {
        case .day:     return "일"
        case .week:    return "주"
        case .month:   return "월"
        case .quarter: return "분기"
        }
    }
    public var displayKo: String {
        switch self {
        case .day:     return "오늘 (어제 대비)"
        case .week:    return "이번 주 (지난 주 대비)"
        case .month:   return "이번 달 (지난 달 대비)"
        case .quarter: return "이번 분기 (직전 분기 대비)"
        }
    }
    public var costMultiplier: Double {
        switch self {
        case .day:     return 1.0 / 26.0   // 월비용 → 일비용 (영업일 26)
        case .week:    return 7.0 / 30.0   // 월비용 → 주 비용 (월 30일 기준)
        case .month:   return 1.0
        case .quarter: return 3.0
        }
    }
}

public struct ReportChartPoint: Sendable, Hashable {
    public let label: String          // "월", "1주차", "1월", "1Q" 등
    public let value: Double
    public let isCurrent: Bool        // 현재 기간 (강조용)

    public init(label: String, value: Double, isCurrent: Bool = false) {
        self.label = label
        self.value = value
        self.isCurrent = isCurrent
    }
}

public struct ReportCostSlice: Sendable, Hashable, Identifiable {
    public let key: String            // "ingredients" | "labor" | "rent" | ...
    public let labelKo: String
    public let value: Double
    public let percent: Double        // 0-100
    public let colorHex: String

    public var id: String { key }
}

public struct AnomalySignal: Sendable, Hashable, Identifiable {
    public enum Severity: String, Sendable { case warning, danger }
    public let id: String
    public let severity: Severity
    public let title: String
    public let detail: String

    public init(id: String, severity: Severity, title: String, detail: String) {
        self.id = id
        self.severity = severity
        self.title = title
        self.detail = detail
    }
}

public struct WisdomQuote: Sendable, Hashable {
    public let text: String
    public let author: String

    public init(text: String, author: String) {
        self.text = text
        self.author = author
    }
}

public struct ReportPeriodData: Sendable {
    public let period: ReportPeriod
    public let heroLabel: String              // "이번 주 매출"
    public let heroValueWon: Double
    public let deltaPercent: Double           // 직전 period 대비
    public let headline: String               // "지난 주보다 12% 증가했어요"
    public let kpiCostWon: Double
    public let kpiMarginPercent: Double
    public let kpiPrimeRatePercent: Double
    public let chartPoints: [ReportChartPoint]
    public let costSlices: [ReportCostSlice]
    public let costSparkline: [Double]        // 최근 6개월 비용 총합 (sparkline)
    public let anomalies: [AnomalySignal]
    public let nextActionText: String
    public let wisdom: WisdomQuote
}

// MARK: - Calculator

public enum ReportsCalculator {

    private static let calendar: Calendar = {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        cal.firstWeekday = 2  // Monday
        return cal
    }()

    private static let isoFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()

    // MARK: - Entry point

    public static func compute(
        period: ReportPeriod,
        entries: [DailyEntry],
        costs: MonthlyCosts,
        today: Date = Date()
    ) -> ReportPeriodData {
        let sortedEntries = entries.sorted { $0.date < $1.date }

        // ── Hero + delta ──
        var (heroVal, prevVal, deltaPct) = aggregateHero(period: period, entries: sortedEntries, today: today)
        let heroLabel = heroLabel(for: period)
        // 2026-08-19 정직성: '일' 기간에 오늘 입력이 아직 없으면 0원·-100% 가 아니라 "미입력" (매일 아침 거짓 경보 방지)
        let todayStr = isoFormatter.string(from: today)
        let todayMissing = period == .day && !sortedEntries.contains { $0.date == todayStr }
        if todayMissing { deltaPct = 0 }
        let headline = todayMissing
            ? (prevVal > 0 ? "오늘 매출이 아직 입력되지 않았어요. 입력하면 최근 7일 평균(\(Int(prevVal).formatted())원)과 바로 비교돼요." : "오늘 매출을 입력하면 분석이 시작돼요.")
            : makeHeadline(period: period, current: heroVal, prev: prevVal, deltaPct: deltaPct)

        // ── KPI 보조 (비용·마진·프라임코스트) ──
        let costForPeriod = costs.total * period.costMultiplier
        let marginPct: Double = heroVal > 0 ? ((heroVal - costForPeriod) / heroVal) * 100 : 0
        // ⚠️ 2026-06-16 fix: 프라임코스트 = (재료+인건비)/**매출** (외식업 표준·SSOT cost-ratios.ts:230·웹 useReportSnapshot).
        //   종전 `/costs.total`(총비용 대비)은 비표준 + 자기 marginPct(매출기준)·웹과 불일치 → 65% 위험선이 틀린 값으로 동작.
        //   웹과 동일하게 기간 비례(costMultiplier) 적용한 prime 을 기간 매출로 나눔.
        let primeRate: Double = heroVal > 0
            ? (((costs.ingredients + costs.labor) * period.costMultiplier) / heroVal) * 100
            : 0

        // ── 차트 포인트 ──
        let chart = buildChart(period: period, entries: sortedEntries, today: today)

        // ── 비용 도넛 + sparkline ──
        let slices = buildCostSlices(costs: costs, multiplier: period.costMultiplier)
        let sparkline = buildCostSparkline(costs: costs)

        // ── 이상 신호 ──
        let anomalies = detectAnomalies(
            entries: sortedEntries,
            costs: costs,
            heroVal: heroVal,
            prevVal: prevVal,
            deltaPct: deltaPct,
            primeRate: primeRate,
            marginPct: marginPct
        )

        // ── 다음 액션 ──
        let nextAction = nextActionText(period: period, deltaPct: deltaPct, primeRate: primeRate, hasEntries: !entries.isEmpty)

        // ── 거장 인용 (정적 풀 + seed rotation) ──
        let quote = wisdomQuote(for: period, today: today)

        return ReportPeriodData(
            period: period,
            heroLabel: heroLabel,
            heroValueWon: heroVal,
            deltaPercent: deltaPct,
            headline: headline,
            kpiCostWon: costForPeriod,
            kpiMarginPercent: marginPct,
            kpiPrimeRatePercent: primeRate,
            chartPoints: chart,
            costSlices: slices,
            costSparkline: sparkline,
            anomalies: anomalies,
            nextActionText: nextAction,
            wisdom: quote
        )
    }

    // MARK: - Hero aggregation

    private static func aggregateHero(
        period: ReportPeriod,
        entries: [DailyEntry],
        today: Date
    ) -> (current: Double, previous: Double, deltaPct: Double) {
        switch period {
        case .day:
            // 오늘 vs 최근 7일 평균
            let todayStr = isoFormatter.string(from: today)
            let todaySales = entries.first { $0.date == todayStr }?.sales ?? 0
            let last7 = Array(entries.suffix(8).dropLast())  // exclude today
            let avg = last7.isEmpty ? 0 : last7.map(\.sales).reduce(0, +) / Double(last7.count)
            let delta = avg > 0 ? ((todaySales - avg) / avg) * 100 : 0
            return (todaySales, avg, delta)

        case .week:
            // 이번 주 (월~오늘) vs 지난 주
            let thisWeekStart = startOfWeek(today)
            let lastWeekStart = calendar.date(byAdding: .day, value: -7, to: thisWeekStart)!
            let thisWeekEnd = today
            let lastWeekEnd = calendar.date(byAdding: .day, value: -7, to: today)!
            let current = sumSales(in: thisWeekStart...thisWeekEnd, entries: entries)
            let previous = sumSales(in: lastWeekStart...lastWeekEnd, entries: entries)
            let delta = previous > 0 ? ((current - previous) / previous) * 100 : 0
            return (current, previous, delta)

        case .month:
            // 이번 달 (1일~오늘) vs 지난 달 같은 일자까지
            let cmps = calendar.dateComponents([.year, .month, .day], from: today)
            let thisMonthStart = calendar.date(from: DateComponents(year: cmps.year, month: cmps.month, day: 1))!
            let lastMonthStart = calendar.date(byAdding: .month, value: -1, to: thisMonthStart)!
            let lastMonthEnd = calendar.date(byAdding: .day, value: cmps.day! - 1, to: lastMonthStart)!
            let current = sumSales(in: thisMonthStart...today, entries: entries)
            let previous = sumSales(in: lastMonthStart...lastMonthEnd, entries: entries)
            let delta = previous > 0 ? ((current - previous) / previous) * 100 : 0
            return (current, previous, delta)

        case .quarter:
            // 이번 분기 vs 직전 분기
            let (qStart, _) = currentQuarterRange(today)
            let prevQStart = calendar.date(byAdding: .month, value: -3, to: qStart)!
            let prevQEnd = calendar.date(byAdding: .day, value: -1, to: qStart)!
            let current = sumSales(in: qStart...today, entries: entries)
            let previous = sumSales(in: prevQStart...prevQEnd, entries: entries)
            let delta = previous > 0 ? ((current - previous) / previous) * 100 : 0
            return (current, previous, delta)
        }
    }

    // MARK: - Chart points

    private static func buildChart(period: ReportPeriod, entries: [DailyEntry], today: Date) -> [ReportChartPoint] {
        switch period {
        case .day:
            // 최근 14일 일별 매출
            var points: [ReportChartPoint] = []
            for offset in stride(from: 13, through: 0, by: -1) {
                guard let d = calendar.date(byAdding: .day, value: -offset, to: today) else { continue }
                let dateStr = isoFormatter.string(from: d)
                let sales = entries.first { $0.date == dateStr }?.sales ?? 0
                let weekday = dayShortLabel(d)
                points.append(ReportChartPoint(label: weekday, value: sales, isCurrent: offset == 0))
            }
            return points

        case .week:
            // 최근 8주 합계
            var points: [ReportChartPoint] = []
            for offset in stride(from: 7, through: 0, by: -1) {
                let weekStart = calendar.date(byAdding: .day, value: -7 * offset, to: startOfWeek(today))!
                let weekEnd = calendar.date(byAdding: .day, value: 6, to: weekStart)!
                let endCapped = min(weekEnd, today)
                let total = sumSales(in: weekStart...endCapped, entries: entries)
                let label = offset == 0 ? "이번주" : "\(offset)주전"
                points.append(ReportChartPoint(label: label, value: total, isCurrent: offset == 0))
            }
            return points

        case .month:
            // 최근 6개월 합계
            var points: [ReportChartPoint] = []
            for offset in stride(from: 5, through: 0, by: -1) {
                guard let monthStart = calendar.date(byAdding: .month, value: -offset, to: startOfMonth(today)) else { continue }
                let monthEnd = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: monthStart)!
                let endCapped = min(monthEnd, today)
                let total = sumSales(in: monthStart...endCapped, entries: entries)
                let m = calendar.component(.month, from: monthStart)
                points.append(ReportChartPoint(label: "\(m)월", value: total, isCurrent: offset == 0))
            }
            return points

        case .quarter:
            // 최근 4분기 합계
            var points: [ReportChartPoint] = []
            let (currentQStart, _) = currentQuarterRange(today)
            for offset in stride(from: 3, through: 0, by: -1) {
                guard let qStart = calendar.date(byAdding: .month, value: -3 * offset, to: currentQStart) else { continue }
                let qEnd = calendar.date(byAdding: DateComponents(month: 3, day: -1), to: qStart)!
                let endCapped = min(qEnd, today)
                let total = sumSales(in: qStart...endCapped, entries: entries)
                let q = (calendar.component(.month, from: qStart) - 1) / 3 + 1
                points.append(ReportChartPoint(label: "\(q)Q", value: total, isCurrent: offset == 0))
            }
            return points
        }
    }

    // MARK: - Cost donut

    private static let costColors: [String: String] = [
        "ingredients": "#0a84ff",
        "labor":       "#34c759",
        "rent":        "#ff9f0a",
        "utilities":   "#5ac8fa",
        "marketing":   "#bf5af2",
        "sga":         "#ff375f",
        "other":       "#8e8e93",
        "interest":    "#cc6680",
    ]

    private static let costLabels: [String: String] = [
        "ingredients": "재료비",
        "labor":       "인건비",
        "rent":        "임대료",
        "utilities":   "공과금",
        "marketing":   "마케팅",
        "sga":         "SGA",
        "other":       "기타",
        "interest":    "이자",
    ]

    private static func buildCostSlices(costs: MonthlyCosts, multiplier: Double) -> [ReportCostSlice] {
        let total = costs.total
        guard total > 0 else { return [] }
        let raw: [(String, Double)] = [
            ("ingredients", costs.ingredients),
            ("labor",       costs.labor),
            ("rent",        costs.rent),
            ("utilities",   costs.utilities),
            ("marketing",   costs.marketing),
            ("sga",         costs.sga),
            ("other",       costs.other),
            ("interest",    costs.interest),
        ]
        return raw
            .filter { $0.1 > 0 }
            .sorted { $0.1 > $1.1 }
            .map { key, v in
                ReportCostSlice(
                    key: key,
                    labelKo: costLabels[key] ?? key,
                    value: v * multiplier,
                    percent: (v / total) * 100,
                    colorHex: costColors[key] ?? "#8e8e93"
                )
            }
    }

    private static func buildCostSparkline(costs: MonthlyCosts) -> [Double] {
        // 정직성: iOS 는 6개월 cost history 가 아직 저장되지 않음. 현재 비용을 6번 복제하면
        // "비용이 6개월간 평탄했다"는 가짜 추세를 만든다 → 빈 배열 반환(소비측에서 미표시).
        // cost_history 테이블 도입 시 실 월별 총비용으로 교체.
        []
    }

    // MARK: - Anomaly detection (rule-based)

    private static func detectAnomalies(
        entries: [DailyEntry],
        costs: MonthlyCosts,
        heroVal: Double,
        prevVal: Double,
        deltaPct: Double,
        primeRate: Double,
        marginPct: Double
    ) -> [AnomalySignal] {
        var out: [AnomalySignal] = []

        // 1. 프라임코스트 65% 초과 (외식 임계값)
        if costs.total > 0 && primeRate >= 65 {
            out.append(AnomalySignal(
                id: "prime-cost-high",
                severity: primeRate >= 75 ? .danger : .warning,
                title: "프라임코스트 \(Int(primeRate.rounded()))%",
                detail: "재료비+인건비 비율이 안정선(65%) 을 넘었어요. 비용 분해부터 점검하세요."
            ))
        }

        // 2. 매출 -10% 이상 하락
        if prevVal > 0 && deltaPct <= -10 {
            out.append(AnomalySignal(
                id: "revenue-drop",
                severity: deltaPct <= -20 ? .danger : .warning,
                title: "매출 하락 \(Int((-deltaPct).rounded()))%",
                detail: "직전 기간 대비 매출이 떨어졌어요. 요일·메뉴·리뷰 3축에서 1가지 가설을 세워보세요."
            ))
        }

        // 3. 마진 음수 (적자)
        if heroVal > 0 && marginPct < 0 {
            out.append(AnomalySignal(
                id: "loss",
                severity: .danger,
                title: "마진 \(Int(marginPct.rounded()))%",
                detail: "매출보다 비용이 큰 적자 구간이에요. 고정비 축소부터 시작하세요."
            ))
        }

        // 4. 매출 데이터 부족
        if entries.count < 3 {
            out.append(AnomalySignal(
                id: "low-data",
                severity: .warning,
                title: "매출 입력 부족",
                detail: "정확한 분석을 위해 매일 매출을 기록해주세요."
            ))
        }

        return out
    }

    // MARK: - Next action (rule-based, no LLM)

    private static func nextActionText(period: ReportPeriod, deltaPct: Double, primeRate: Double, hasEntries: Bool) -> String {
        if !hasEntries {
            return "매출 입력을 시작하면 다음 액션이 즉시 보여요. 첫 단계: 오늘 매출 등록."
        }
        if primeRate >= 65 {
            return "재료비·인건비 분해부터 점검하세요. 메뉴별 원가율, 인건비 비중 시간대별 분석."
        }
        if deltaPct <= -5 {
            return "요일·메뉴·리뷰 3축에서 1가지 가설을 세워 다음 \(period.labelKo) 단위로 검증."
        }
        if deltaPct >= 5 {
            return "상승 요인을 한 줄로 메모하세요. 다음 \(period.labelKo)에 동일하게 재현 가능한지 확인."
        }
        return "작은 실험 1가지를 준비하세요. 메뉴 가격 / 영업시간 / 채널 중 하나."
    }

    // MARK: - Wisdom quote (정적 풀 + seed-based rotation)

    private static let wisdomPool: [ReportPeriod: [WisdomQuote]] = [
        .day: [
            WisdomQuote(text: "매일의 한 줄 메모가 1년 후 자산이 된다.", author: "Jeff Bezos"),
            WisdomQuote(text: "오늘 하지 못한 결정이 가장 비싼 비용이다.", author: "Ben Horowitz"),
            WisdomQuote(text: "작은 일에 충실한 사람만이 큰 일에도 충실하다.", author: "Warren Buffett"),
            WisdomQuote(text: "데이터 없는 직관은 의견이지 전략이 아니다.", author: "Andy Grove"),
            WisdomQuote(text: "오늘의 매출은 결과, 어제의 결정은 원인.", author: "Peter Drucker"),
            WisdomQuote(text: "정확한 측정만이 정확한 개선을 부른다.", author: "Edwards Deming"),
            WisdomQuote(text: "고객 한 명의 피드백이 1년 데이터를 이긴다.", author: "Sam Altman"),
            WisdomQuote(text: "Done is better than perfect.", author: "Sheryl Sandberg"),
        ],
        .week: [
            WisdomQuote(text: "주간 회고가 없는 성장은 우연이다.", author: "Andy Grove"),
            WisdomQuote(text: "이번 주 가장 비싼 시간은 무엇이었나? 그게 답이다.", author: "Naval Ravikant"),
            WisdomQuote(text: "주 5번의 작은 실험이 한 번의 큰 결정보다 낫다.", author: "Eric Ries"),
            WisdomQuote(text: "프라임코스트 65% — 외식의 생존선이다.", author: "Danny Meyer"),
            WisdomQuote(text: "단골 1명이 신규 5명보다 매출이 안정적이다.", author: "Fred Reichheld"),
            WisdomQuote(text: "주간 KPI 3개만 정해라. 더는 노이즈다.", author: "Marcus Buckingham"),
            WisdomQuote(text: "현금흐름은 산소다. 매출은 음식이다.", author: "Bill Gates"),
            WisdomQuote(text: "이번 주 가장 잘한 일을 다음 주에 한 번 더 하라.", author: "James Clear"),
        ],
        .month: [
            WisdomQuote(text: "월 매출 그래프가 우상향이 아니면 비용 구조부터 점검하라.", author: "Charlie Munger"),
            WisdomQuote(text: "한 달의 손익이 다음 분기의 의사결정을 만든다.", author: "Howard Schultz"),
            WisdomQuote(text: "사장의 시간 1시간이 직원의 1주일을 결정한다.", author: "Ray Kroc"),
            WisdomQuote(text: "월말 정산이 마음의 평화다.", author: "Robert Kiyosaki"),
            WisdomQuote(text: "비용 절감보다 매출 성장이 항상 우선이다 — 마진이 0 이상이라면.", author: "Jeff Bezos"),
            WisdomQuote(text: "월간 P&L 을 직원과 공유하면 직원이 사장처럼 일한다.", author: "Jack Stack"),
            WisdomQuote(text: "재고가 매출을 가리지 않게 하라.", author: "Sam Walton"),
            WisdomQuote(text: "월 1회 가게에서 5미터 떨어져 봐라. 다르게 보인다.", author: "Howard Schultz"),
        ],
        .quarter: [
            WisdomQuote(text: "분기 회고가 1년 전략을 만든다.", author: "Jeff Bezos"),
            WisdomQuote(text: "한 분기에 3번 실패하지 못했으면 너무 안전한 운영이다.", author: "Ben Horowitz"),
            WisdomQuote(text: "분기 성장률이 시장 성장률을 넘는가? 그게 진짜 성장이다.", author: "Andy Grove"),
            WisdomQuote(text: "분기 우선순위는 3가지를 넘기지 말라.", author: "John Doerr"),
            WisdomQuote(text: "현금 런웨이 6개월 미만이면 분기 계획이 아니라 생존 계획이다.", author: "Paul Graham"),
            WisdomQuote(text: "분기마다 가게에서 가장 비싼 자원을 1가지 줄여라.", author: "Lean Startup"),
            WisdomQuote(text: "고객 NPS 가 분기마다 1점씩 오르면 5년 후 살아남는다.", author: "Fred Reichheld"),
            WisdomQuote(text: "분기마다 한 번은 가격을 다시 봐라.", author: "Hermann Simon"),
        ],
    ]

    private static func wisdomQuote(for period: ReportPeriod, today: Date) -> WisdomQuote {
        let pool = wisdomPool[period] ?? wisdomPool[.day]!
        let year = calendar.component(.year, from: today)
        let offset: Int
        switch period {
        case .day:     offset = calendar.ordinality(of: .day, in: .year, for: today) ?? 1
        case .week:    offset = calendar.component(.weekOfYear, from: today)
        case .month:   offset = calendar.component(.month, from: today)
        case .quarter: offset = (calendar.component(.month, from: today) - 1) / 3 + 1
        }
        let seed = abs(year &* 1000 &+ offset)
        return pool[seed % pool.count]
    }

    // MARK: - Helpers

    private static func sumSales(in range: ClosedRange<Date>, entries: [DailyEntry]) -> Double {
        var total: Double = 0
        for e in entries {
            guard let d = isoFormatter.date(from: e.date) else { continue }
            if range.contains(d) { total += e.sales }
        }
        return total
    }

    private static func startOfWeek(_ d: Date) -> Date {
        let cmps = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: d)
        return calendar.date(from: cmps) ?? d
    }

    private static func startOfMonth(_ d: Date) -> Date {
        let cmps = calendar.dateComponents([.year, .month], from: d)
        return calendar.date(from: cmps) ?? d
    }

    private static func currentQuarterRange(_ d: Date) -> (start: Date, end: Date) {
        let month = calendar.component(.month, from: d)
        let qStartMonth = ((month - 1) / 3) * 3 + 1
        var cmps = calendar.dateComponents([.year], from: d)
        cmps.month = qStartMonth
        cmps.day = 1
        let start = calendar.date(from: cmps) ?? d
        let end = calendar.date(byAdding: DateComponents(month: 3, day: -1), to: start) ?? d
        return (start, end)
    }

    private static func dayShortLabel(_ d: Date) -> String {
        let weekday = calendar.component(.weekday, from: d)
        // 1=Sun ... 7=Sat
        let labels = ["", "일", "월", "화", "수", "목", "금", "토"]
        return labels[weekday]
    }

    private static func heroLabel(for period: ReportPeriod) -> String {
        switch period {
        case .day:     return "오늘 매출"
        case .week:    return "이번 주 매출"
        case .month:   return "이번 달 매출"
        case .quarter: return "이번 분기 매출"
        }
    }

    private static func makeHeadline(period: ReportPeriod, current: Double, prev: Double, deltaPct: Double) -> String {
        if current <= 0 && prev <= 0 {
            return "매출 데이터가 부족해요. 입력을 시작하면 분석이 즉시 보여요."
        }
        let absDelta = Int(abs(deltaPct).rounded())
        let prevLabel: String = {
            switch period {
            case .day:     return "어제 평균"
            case .week:    return "지난 주"
            case .month:   return "지난 달"
            case .quarter: return "직전 분기"
            }
        }()
        if deltaPct >= 5 {
            return "\(prevLabel)보다 \(absDelta)% 증가했어요."
        }
        if deltaPct <= -5 {
            return "\(prevLabel)보다 \(absDelta)% 감소했어요. 원인 점검 필요."
        }
        return "\(prevLabel)와 비슷한 흐름이에요. 안정 구간."
    }
}
