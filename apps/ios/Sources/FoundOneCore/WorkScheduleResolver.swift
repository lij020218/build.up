//
//  WorkScheduleResolver.swift — 근무 일정 해석 SSOT (iOS)
//
//  웹 미러: packages/shared/src/team/work-schedule.ts (resolveShiftForDate)
//
//  왜 SSOT 인가 (2026-07-28): 사장 캘린더·직원 캘린더가 같은 규칙으로 근무일을 계산해야
//  한다. 종전엔 이 로직이 StaffDashboardView 안에 private 으로만 있었고, 사장 화면을
//  만들며 복붙하면 "사장은 출근이라 보는데 직원 화면엔 없는" 불일치가 난다 — 근무·급여가
//  걸린 화면이라 치명적.
//
//  해석 우선순위: ① 그 날짜의 예외행(is_off=휴무 / 시간지정) ② 없으면 그 요일 반복 규칙
//
//  ⚠️ active 방어: 사장 화면은 규칙을 active 필터 없이 로드해 두고 렌더 시점에 거른다.
//     호출처가 거르는 걸 잊어도 비활성 규칙이 근무일로 새지 않도록 여기서 항상 배제한다.
//

import Foundation

public struct BUResolvedShift: Sendable, Equatable {
    public let startTime: String
    public let endTime: String
    public let note: String?
    public init(startTime: String, endTime: String, note: String?) {
        self.startTime = startTime
        self.endTime = endTime
        self.note = note
    }
}

/// 해석에 필요한 최소 입력 — Repository 타입에 의존하지 않도록 프로토콜로 받는다.
public protocol BUWorkRule {
    var weekday: Int { get }
    var startTime: String { get }
    var endTime: String { get }
    var active: Bool { get }
}

public protocol BUWorkException {
    var workDate: String { get }
    var startTime: String? { get }
    var endTime: String? { get }
    var note: String? { get }
    var isOff: Bool? { get }
}

public enum BUWorkSchedule {

    /// 특정 날짜의 실제 근무 — 예외행 우선, 없으면 요일 반복 규칙. 근무 없으면 nil.
    public static func resolve(
        dateStr: String,
        weekday: Int,
        rules: [any BUWorkRule],
        exceptions: [any BUWorkException]
    ) -> BUResolvedShift? {
        if let ex = exceptions.first(where: { $0.workDate == dateStr }) {
            if ex.isOff == true { return nil }
            if let s = ex.startTime, let e = ex.endTime {
                return BUResolvedShift(startTime: s, endTime: e, note: ex.note)
            }
        }
        guard let r = rules.first(where: { $0.weekday == weekday && $0.active }) else { return nil }
        return BUResolvedShift(startTime: r.startTime, endTime: r.endTime, note: nil)
    }

    /// 연차 기간(시작~종료)을 날짜 키(yyyy-MM-dd) 집합으로 전개. 반려 건 제외.
    public static func expandLeaveDates(
        _ leaves: [(startDate: String, endDate: String, status: String)]
    ) -> Set<String> {
        var out = Set<String>()
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        let cal = Calendar(identifier: .gregorian)
        for l in leaves where l.status != "rejected" {
            guard var d = f.date(from: l.startDate), let end = f.date(from: l.endDate), d <= end else { continue }
            while d <= end {
                out.insert(f.string(from: d))
                guard let next = cal.date(byAdding: .day, value: 1, to: d) else { break }
                d = next
            }
        }
        return out
    }

    /// 연차 기간을 날짜 → 상태 맵으로 전개 (반려 제외).
    ///  ⚠️ 사장 화면은 "승인된 연차"와 "승인 대기"를 구분해야 한다 — 대기 건을 확정처럼
    ///  보여주면 사장이 그날 인력이 빠진다고 착각한다 (2026-07-28 냉정 리뷰).
    public static func expandLeaveDatesWithStatus(
        _ leaves: [(startDate: String, endDate: String, status: String)]
    ) -> [String: Bool] {   // value = isPending
        var out: [String: Bool] = [:]
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        let cal = Calendar(identifier: .gregorian)
        for l in leaves where l.status != "rejected" {
            let pending = l.status != "approved"
            guard var d = f.date(from: l.startDate), let end = f.date(from: l.endDate), d <= end else { continue }
            while d <= end {
                let key = f.string(from: d)
                // 같은 날 승인·대기가 겹치면 승인이 우선
                if out[key] != false { out[key] = pending }
                guard let next = cal.date(byAdding: .day, value: 1, to: d) else { break }
                d = next
            }
        }
        return out
    }

    // ── 교대 타임라인 (2026-07-28) ──────────────────────────────────
    //   "A 12–3시 / B 3–8시" 가 이어지는지·겹치는지·비는지는 텍스트로 안 보인다.

    /// "HH:MM[:SS]" → 자정 기준 분. 실패 시 nil
    public static func timeToMinutes(_ t: String) -> Int? {
        let parts = t.split(separator: ":")
        guard parts.count >= 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return nil }
        return h * 60 + m
    }

    /// 근무 시간 → 분 구간. 종료가 시작보다 이르면 자정 넘긴 야간 근무로 +24h
    public static func shiftSpan(start: String, end: String) -> (startMin: Int, endMin: Int)? {
        guard let s = timeToMinutes(start), let e = timeToMinutes(end) else { return nil }
        return (s, e <= s ? e + 24 * 60 : e)
    }

    /// 분 → "HH:mm" (24시 넘으면 "익일 HH:mm")
    public static func formatSpanTime(_ min: Int) -> String {
        let nextDay = min >= 24 * 60
        let m = min % (24 * 60)
        let label = String(format: "%02d:%02d", m / 60, m % 60)
        return nextDay ? "익일 \(label)" : label
    }

    /// 교대 사이 아무도 없는 구간. 근무 1개 이하면 빈 배열(영업시간 모르므로 단정 금지)
    public static func coverageGaps(_ spans: [(startMin: Int, endMin: Int)]) -> [(startMin: Int, endMin: Int)] {
        guard spans.count >= 2 else { return [] }
        let sorted = spans.sorted { $0.startMin < $1.startMin }
        var gaps: [(startMin: Int, endMin: Int)] = []
        var cursor = sorted[0].endMin
        for s in sorted.dropFirst() {
            if s.startMin > cursor { gaps.append((cursor, s.startMin)) }
            cursor = max(cursor, s.endMin)
        }
        return gaps
    }

    /// "HH:MM:SS" → "HH:MM" (표시용)
    public static func shortTime(_ t: String) -> String {
        String(t.prefix(5))
    }
}
