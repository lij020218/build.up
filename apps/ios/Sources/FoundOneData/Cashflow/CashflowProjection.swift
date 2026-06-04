//
//  CashflowProjection.swift — 14일 현금흐름 예측 + 위기 감지 엔진.
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/services/cashflow-projection.ts (projectCashflow / detectCrisis)
//  재무 정확성 핵심 — 웹 알고리즘을 *그대로* 포팅(임의 개선 금지). 동일 입력 → 동일 출력이어야 함.
//
//  주의(웹과 동일한 단순화):
//   • computeDayInflow 는 settlementDays 로 입금일을 시프트하지 않고, 영업일마다
//     "그 날 평균매출 × 채널비율 × (1-수수료)" 를 입금으로 잡는다. (웹 현행과 1:1)
//   • 입금은 영업일(월~금)만, 출금(고정비)은 주말 포함 모든 날.
//

import Foundation

public struct CashflowDailyEntry: Sendable, Hashable {
    public let date: String       // "yyyy-MM-dd"
    public let sales: Double
    public init(date: String, sales: Double) { self.date = date; self.sales = sales }
}

public struct CashflowProjEvent: Sendable, Hashable, Identifiable {
    public let id: String
    public let type: String        // "inflow" | "outflow"
    public let amount: Double
    public let labelKo: String
    public let labelEn: String
    public let sourceChannel: String?
    public let sourceExpenseId: String?
}

public struct CashflowDayProjection: Sendable, Hashable, Identifiable {
    public let date: String
    public let dayOfWeek: Int       // 0(Sun)~6(Sat) — 웹 getDay() 동일
    public let isWeekend: Bool
    public let inflow: Double
    public let outflow: Double
    public let startBalance: Double
    public let endBalance: Double
    public let events: [CashflowProjEvent]
    public var id: String { date }
}

public struct CashflowCrisis: Sendable, Hashable {
    public let willCrisis: Bool
    public let crisisDay: String?
    public let daysUntilCrisis: Int?
    public let shortfallAmount: Double
    public let safeDays: Int
    public let lowestBalance: Double
    public let lowestDay: String?
}

public enum CashflowProjection {

    /// 로컬(기기 타임존) 기준 그레고리안 캘린더 — 웹 브라우저 로컬(KST) 과 동일 의미.
    private static var cal: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone.current
        return c
    }

    private static func toIso(_ date: Date) -> String {
        let comp = cal.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", comp.year ?? 0, comp.month ?? 0, comp.day ?? 0)
    }

    /// 0(Sun)~6(Sat) — JS getDay() 와 동일. (Calendar weekday: 1=Sun..7=Sat)
    private static func jsDay(_ date: Date) -> Int { cal.component(.weekday, from: date) - 1 }

    private static func computeAverageDailySales(_ entries: [CashflowDailyEntry], windowDays: Int = 14) -> Double {
        if entries.isEmpty { return 0 }
        let sorted = entries.sorted { $0.date < $1.date }
        let recent = sorted.suffix(windowDays)
        if recent.isEmpty { return 0 }
        let sum = recent.reduce(0.0) { $0 + $1.sales }
        return sum / Double(recent.count)
    }

    private static func computeDayInflow(
        _ predictDate: Date, _ averageDailySales: Double,
        _ channels: [CashflowSalesChannel], _ vatReserveEnabled: Bool, _ vatRate: Double
    ) -> [CashflowProjEvent] {
        var events: [CashflowProjEvent] = []
        for ch in channels {
            if !ch.isActive || ch.salesRatio <= 0 { continue }
            let gross = averageDailySales * (ch.salesRatio / 100)
            if gross <= 0 { continue }
            let feeRate = (ch.commissionRate + ch.paymentFeeRate) / 100
            var net = gross * (1 - feeRate)
            if vatReserveEnabled { net = net * (1 - vatRate) }
            events.append(CashflowProjEvent(
                id: "inflow-\(ch.id)-\(toIso(predictDate))",
                type: "inflow",
                amount: net.rounded(),
                labelKo: "\(ch.label.ko) 정산",
                labelEn: "\(ch.label.en) settlement",
                sourceChannel: ch.id,
                sourceExpenseId: nil
            ))
        }
        return events
    }

    private static func computeDayOutflow(_ predictDate: Date, _ expenses: [CashflowFixedExpense]) -> [CashflowProjEvent] {
        var events: [CashflowProjEvent] = []
        let dayOfMonth = cal.component(.day, from: predictDate)
        let lastDayOfMonth = cal.range(of: .day, in: .month, for: predictDate)?.count ?? 31
        for e in expenses {
            if !e.isActive || e.amount <= 0 { continue }
            let triggers = e.dayOfMonth == dayOfMonth
                || (e.dayOfMonth > lastDayOfMonth && dayOfMonth == lastDayOfMonth)
            if !triggers { continue }
            events.append(CashflowProjEvent(
                id: "outflow-\(e.id)-\(toIso(predictDate))",
                type: "outflow",
                amount: e.amount,
                labelKo: e.label,
                labelEn: e.label,
                sourceChannel: nil,
                sourceExpenseId: e.id
            ))
        }
        return events
    }

    /// 메인: 14일 예측 시퀀스.
    public static func project(
        currentBalance: Double,
        recentDailyEntries: [CashflowDailyEntry],
        salesChannels: [CashflowSalesChannel],
        fixedExpenses: [CashflowFixedExpense],
        vatReserveEnabled: Bool,
        vatRate: Double = 0.10,
        projectionDays: Int = 14,
        today: Date = Date(),
        fallbackMonthlyCostsTotal: Double = 0
    ) -> [CashflowDayProjection] {
        let startOfToday = cal.startOfDay(for: today)
        let avgDailySales = computeAverageDailySales(recentDailyEntries)
        var projections: [CashflowDayProjection] = []
        var runningBalance = currentBalance

        let useFallbackOutflow = fixedExpenses.isEmpty && fallbackMonthlyCostsTotal > 0
        let fallbackDailyOutflow = useFallbackOutflow ? (fallbackMonthlyCostsTotal / 26).rounded() : 0

        for i in 0..<projectionDays {
            guard let date = cal.date(byAdding: .day, value: i, to: startOfToday) else { continue }
            let dow = jsDay(date)
            let isWeekend = dow == 0 || dow == 6

            let inflowEvents = isWeekend
                ? []
                : computeDayInflow(date, avgDailySales, salesChannels, vatReserveEnabled, vatRate)
            var outflowEvents = computeDayOutflow(date, fixedExpenses)

            if useFallbackOutflow && !isWeekend && fallbackDailyOutflow > 0 {
                outflowEvents.append(CashflowProjEvent(
                    id: "outflow-fallback-\(toIso(date))",
                    type: "outflow", amount: fallbackDailyOutflow,
                    labelKo: "월 고정비 (일할)", labelEn: "Daily fixed costs",
                    sourceChannel: nil, sourceExpenseId: nil
                ))
            }

            let dayInflow = inflowEvents.reduce(0.0) { $0 + $1.amount }
            let dayOutflow = outflowEvents.reduce(0.0) { $0 + $1.amount }
            let startBalance = runningBalance
            let endBalance = startBalance + dayInflow - dayOutflow
            runningBalance = endBalance

            projections.append(CashflowDayProjection(
                date: toIso(date), dayOfWeek: dow, isWeekend: isWeekend,
                inflow: dayInflow, outflow: dayOutflow,
                startBalance: startBalance, endBalance: endBalance,
                events: inflowEvents + outflowEvents
            ))
            _ = inflowEvents; _ = outflowEvents
        }
        return projections
    }

    /// 위기 감지: thresholdDays 내 잔고가 음수로 가는 첫 날.
    public static func detectCrisis(_ projections: [CashflowDayProjection], thresholdDays: Int = 3) -> CashflowCrisis {
        let within = projections.prefix(thresholdDays)
        let negative = within.first { $0.endBalance < 0 }

        var lowestBalance = projections.first?.startBalance ?? 0
        var lowestDay: String? = nil
        for p in projections where p.endBalance < lowestBalance {
            lowestBalance = p.endBalance
            lowestDay = p.date
        }

        if negative == nil {
            let fullNeg = projections.first { $0.endBalance < 0 }
            let idx = fullNeg.flatMap { fn in projections.firstIndex { $0.date == fn.date } }
            return CashflowCrisis(
                willCrisis: false, crisisDay: nil,
                daysUntilCrisis: idx,
                shortfallAmount: fullNeg.map { abs($0.endBalance) } ?? 0,
                safeDays: idx ?? projections.count,
                lowestBalance: lowestBalance, lowestDay: lowestDay
            )
        }
        let crisisIndex = projections.firstIndex { $0.date == negative!.date } ?? 0
        return CashflowCrisis(
            willCrisis: true, crisisDay: negative!.date,
            daysUntilCrisis: crisisIndex,
            shortfallAmount: abs(negative!.endBalance),
            safeDays: crisisIndex,
            lowestBalance: lowestBalance, lowestDay: lowestDay
        )
    }
}
