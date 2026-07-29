//
//  AnnualLeave.swift — 연차 유급휴가 산정 SSOT (iOS)
//
//  웹 미러: packages/shared/src/team/annual-leave.ts (같은 규칙·같은 문구)
//
//  ── 법적 근거 (근로기준법, 조문 원문 확인 2026-07-28) ──
//   · 제60조 ①: 1년간 80% 이상 출근 → 15일
//   · 제60조 ②: 1년 미만 또는 80% 미만 → 1개월 개근 시 1일 (1년 미만 최대 11일)
//   · 제60조 ④: 3년 이상 → 최초 1년 초과 매 2년 1일 가산, 총 25일 한도
//   · 제11조: 이 법은 상시 5명 이상 사업장에 적용 → 연차는 5인 미만 미적용
//
//  정직성: 출근율 80%·상시인원 특칙(전 1년 계속 5인)·약정 연차는 앱이 모른다 → 항상 "예상".
//

import Foundation

public enum BULeaveBasis: String, Sendable, CaseIterable {
    case hireDate = "hire_date"       // 입사일 기준 (법 원칙)
    case fiscalYear = "fiscal_year"   // 회계연도 기준 (매년 1/1 일괄)

    public var labelKo: String {
        switch self {
        case .hireDate: return "입사일 기준"
        case .fiscalYear: return "회계연도 기준"
        }
    }
    public var descKo: String {
        switch self {
        case .hireDate: return "직원마다 입사일에 맞춰 연차가 생겨요 (법 원칙)"
        case .fiscalYear: return "매년 1월 1일에 모두 함께 생겨요 (관리 편해요)"
        }
    }
}

public struct BUAnnualLeaveResult: Sendable {
    public let statutory: Bool      // 법정 적용 대상 (5인 이상)
    public let days: Int            // 올해 발생 일수
    public let monthsWorked: Int
    public let yearsWorked: Int
    public let isEstimate: Bool     // 항상 true — 출근율 미확인
    public let basisNoteKo: String  // 근거 문구 (UI 노출)
}

public enum BUAnnualLeave {

    /// 근속 연수별 법정 연차 (제60조 ①④) — 1년 15일, 3년부터 2년마다 +1, 25일 상한
    public static func statutoryDays(yearsWorked: Int) -> Int {
        guard yearsWorked >= 1 else { return 0 }
        let bonus = yearsWorked >= 3 ? (yearsWorked - 1) / 2 : 0
        return min(25, 15 + bonus)
    }

    private static func monthsBetween(_ from: Date, _ to: Date) -> Int {
        let cal = Calendar(identifier: .gregorian)
        let comps = cal.dateComponents([.month, .day], from: from, to: to)
        return max(0, comps.month ?? 0)
    }

    private static func parseDate(_ s: String?) -> Date? {
        guard let s, !s.isEmpty else { return nil }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.date(from: String(s.prefix(10)))
    }

    /// 연차 발생 일수 — 입사일 + 기준 + 재직 인원(5인 판정)
    public static func calc(
        hireDate: String?,
        basis: BULeaveBasis,
        headcount: Int,
        today: Date = Date()
    ) -> BUAnnualLeaveResult {
        let statutory = headcount >= 5

        guard let hire = parseDate(hireDate), hire <= today else {
            return BUAnnualLeaveResult(
                statutory: statutory, days: 0, monthsWorked: 0, yearsWorked: 0, isEstimate: true,
                basisNoteKo: "입사일을 입력하면 연차를 계산해 드려요."
            )
        }

        let months = monthsBetween(hire, today)
        let years = months / 12

        guard statutory else {
            return BUAnnualLeaveResult(
                statutory: false, days: 0, monthsWorked: months, yearsWorked: years, isEstimate: true,
                basisNoteKo: "직원 5인 미만은 법정 연차 의무가 없어요 (근로기준법 제11조·제60조). 근로계약서나 취업규칙에 연차를 정했다면 그 약속대로 지급해야 해요."
            )
        }

        if years < 1 {
            let days = min(11, months)
            return BUAnnualLeaveResult(
                statutory: true, days: days, monthsWorked: months, yearsWorked: 0, isEstimate: true,
                basisNoteKo: "입사 \(months)개월 — 1개월 개근마다 1일씩 생겨요 (제60조 ②, 1년 미만 최대 11일). 개근 기준이라 결근이 있으면 줄어요."
            )
        }

        let days = statutoryDays(yearsWorked: years)
        let bonus = days - 15
        let base = bonus > 0
            ? "근속 \(years)년 — 기본 15일 + 장기근속 가산 \(bonus)일 (제60조 ①④, 3년째부터 2년마다 1일·최대 25일)."
            : "근속 \(years)년 — 기본 15일 (제60조 ①). 3년째부터 2년마다 1일씩 늘어요."
        return BUAnnualLeaveResult(
            statutory: true, days: days, monthsWorked: months, yearsWorked: years, isEstimate: true,
            basisNoteKo: "\(base) 직전 1년 출근율 80% 이상일 때 기준이라 실제와 다를 수 있어요."
        )
    }

    /// 사용 일수 — 승인된 연차/반차만 (반차 0.5). 대기·반려·병가는 차감 안 함.
    public static func usedDays(
        _ leaves: [(leaveType: String, startDate: String, endDate: String, status: String)],
        yearStart: String? = nil,
        yearEnd: String? = nil
    ) -> Double {
        var total = 0.0
        let rangeStart = parseDate(yearStart)
        let rangeEnd = parseDate(yearEnd)
        for l in leaves where l.status == "approved" {
            guard l.leaveType == "annual" || l.leaveType == "half" else { continue }
            guard var s = parseDate(l.startDate), var e = parseDate(l.endDate), s <= e else { continue }
            if let rs = rangeStart, s < rs { s = rs }
            if let re = rangeEnd, e > re { e = re }
            guard s <= e else { continue }
            let days = (Calendar(identifier: .gregorian).dateComponents([.day], from: s, to: e).day ?? 0) + 1
            total += l.leaveType == "half" ? Double(days) * 0.5 : Double(days)
        }
        return total
    }

    public static func remaining(granted: Int, used: Double) -> Double {
        max(0, Double(granted) - used)
    }

    /// 올해 연차 산정 구간 (기준별)
    public static func yearRange(basis: BULeaveBasis, hireDate: String?, today: Date = Date()) -> (start: String, end: String) {
        let cal = Calendar(identifier: .gregorian)
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        let year = cal.component(.year, from: today)

        guard basis == .hireDate, let hire = parseDate(hireDate) else {
            return ("\(year)-01-01", "\(year)-12-31")
        }
        let hm = cal.component(.month, from: hire)
        let hd = cal.component(.day, from: hire)
        let anniversaryThisYear = cal.date(from: DateComponents(year: year, month: hm, day: hd)) ?? today
        let start = anniversaryThisYear <= today
            ? anniversaryThisYear
            : (cal.date(from: DateComponents(year: year - 1, month: hm, day: hd)) ?? today)
        let endExclusive = cal.date(byAdding: .year, value: 1, to: start) ?? today
        let end = cal.date(byAdding: .day, value: -1, to: endExclusive) ?? endExclusive
        return (f.string(from: start), f.string(from: end))
    }
}
