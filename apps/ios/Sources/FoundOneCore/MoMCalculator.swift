//
//  MoMCalculator.swift — 전월 대비(MoM) 매출 계산.
//
//  웹 SSOT 1:1 미러: packages/shared/src/finance/dashboard.ts `calculateMoM()`
//    · 이번 달 누적(MTD) vs 전월 "동기"(같은 일자까지) 누적 매출
//    · 전월 동기 데이터가 없으면 비교 불가 → 호출부에서 "지난 달 데이터 없음" 표시.
//      ⚠️ 절대 이번 달에서 역산한 샘플(thisMonth × 0.92 등)을 표시하지 말 것.
//
//  날짜 경계는 Asia/Seoul 기준 — DailyEntry.date 가 KST "yyyy-MM-dd" 로 저장되므로
//  (ReportsCalculator 와 동일 convention).
//

import Foundation

/// 전월 대비(MoM) 결과 — 웹 `MoMComparison` 미러.
public struct MoMComparison: Sendable, Equatable {
    public let currentMonth: String       // "yyyy-MM"
    public let currentMTD: Double          // 이번 달 누적 매출
    public let prevMTD: Double             // 전월 동기(같은 일자까지) 누적 매출
    public let momChangePercent: Double    // MoM 변화율 %
    public let currentDays: Int            // 이번 달 기록일 수
    public let prevDays: Int               // 전월 동기 기록일 수
    public let projectedMonthEnd: Double   // 월말 예상 매출 (일평균 × 26영업일)

    /// 전월 동기 데이터가 실제로 있어야 비교가 정직하다 — 둘 다 0이면 "+0.0%" 거짓 방지.
    public var isComparable: Bool { prevDays > 0 && prevMTD > 0 }
}

public enum MoMCalculator {

    private static let cal: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        return c
    }()

    /// entries 가 비어있으면 nil. (호출부: nil 또는 currentDays==0 → 빈 상태)
    public static func calculate(entries: [DailyEntry], today: Date = Date()) -> MoMComparison? {
        guard !entries.isEmpty else { return nil }

        let cmps = cal.dateComponents([.year, .month, .day], from: today)
        guard let year = cmps.year, let month = cmps.month, let todayDay = cmps.day else { return nil }

        let currentKey = String(format: "%04d-%02d", year, month)

        // 전월 "yyyy-MM"
        guard let thisMonthStart = cal.date(from: DateComponents(year: year, month: month, day: 1)),
              let prevDate = cal.date(byAdding: .month, value: -1, to: thisMonthStart) else { return nil }
        let pc = cal.dateComponents([.year, .month], from: prevDate)
        let prevKey = String(format: "%04d-%02d", pc.year ?? year, pc.month ?? month)

        let currentEntries = entries.filter { $0.date.hasPrefix(currentKey) }
        // 전월 동기: 전월의 같은 일자(todayDay)까지만 — 웹 `day <= todayDay` 와 동일.
        let prevEntries = entries.filter { e in
            guard e.date.hasPrefix(prevKey), e.date.count >= 10 else { return false }
            let day = Int(e.date.dropFirst(8).prefix(2)) ?? 0
            return day <= todayDay
        }

        let currentMTD = currentEntries.reduce(0) { $0 + $1.sales }
        let prevMTD = prevEntries.reduce(0) { $0 + $1.sales }
        let momChange = prevMTD > 0 ? ((currentMTD - prevMTD) / prevMTD) * 100 : 0

        // 월말 예상: 현재 일평균 × 26영업일 (웹과 동일 가정)
        let avgDaily = currentEntries.isEmpty ? 0 : currentMTD / Double(currentEntries.count)
        let projectedMonthEnd = (avgDaily * 26).rounded()

        return MoMComparison(
            currentMonth: currentKey,
            currentMTD: currentMTD,
            prevMTD: prevMTD,
            momChangePercent: (momChange * 10).rounded() / 10,
            currentDays: currentEntries.count,
            prevDays: prevEntries.count,
            projectedMonthEnd: projectedMonthEnd
        )
    }
}
