//
//  TodayRoster.swift — 오늘의 근무 명단 SSOT (iOS)
//
//  웹 미러: packages/shared/src/team/today-roster.ts
//   (동기화 가드: apps/web/__tests__/today-roster-ios-sync.test.ts)
//
//  왜 SSOT 인가 (2026-09-14): 홈 "오늘 출근" 카드가 웹·iOS 에서 같은 판정을 써야 한다.
//  근무 시간 해석은 BUWorkSchedule.resolve 를 그대로 재사용하고, 그 위에
//  연차·출퇴근 기록만 얹는다 — 시간 판정을 여기서 새로 만들지 않는다.
//
//  판정 우선순위: ① 승인 연차 ② 출퇴근 기록(근무중/완료) ③ 배정된 근무 ④ 휴무
//   기록이 근무표를 이긴다 — 대타·급한 호출로 근무표에 없어도 실제로 찍었으면 사실이다.
//

import Foundation

/// 근무 상태 — 화면 라벨은 각 플랫폼이 붙인다(다국어).
public enum BUTodayShiftStatus: String, Sendable, Equatable {
    case leave, working, done, scheduled, off
}

/// 판정 입력 — 규칙/예외는 프로토콜(any)로 받아 Repository 타입에 의존하지 않는다.
///  그래서 Sendable 이 아니다: 호출 직전에 만들어 바로 쓰는 값이라 스레드를 건너지 않는다.
public struct BURosterMemberInput {
    public let memberUserId: String
    public let name: String
    public let rules: [any BUWorkRule]
    public let exceptions: [any BUWorkException]

    public init(memberUserId: String, name: String, rules: [any BUWorkRule], exceptions: [any BUWorkException]) {
        self.memberUserId = memberUserId
        self.name = name
        self.rules = rules
        self.exceptions = exceptions
    }
}

/// 출퇴근 기록 — clockOutAt 이 없으면 근무 중.
public struct BURosterAttendance: Sendable, Equatable {
    public let memberUserId: String
    public let clockInAt: String
    public let clockOutAt: String?
    public init(memberUserId: String, clockInAt: String, clockOutAt: String?) {
        self.memberUserId = memberUserId
        self.clockInAt = clockInAt
        self.clockOutAt = clockOutAt
    }
}

/// 연차·휴가 — 승인된 것만 반영(신청 중은 아직 근무 예정).
public struct BURosterLeave: Sendable, Equatable {
    public let memberUserId: String
    public let startDate: String
    public let endDate: String
    public let status: String
    public init(memberUserId: String, startDate: String, endDate: String, status: String) {
        self.memberUserId = memberUserId
        self.startDate = startDate
        self.endDate = endDate
        self.status = status
    }
}

public struct BUTodayRosterEntry: Sendable, Equatable, Identifiable {
    public let memberUserId: String
    public let name: String
    public let status: BUTodayShiftStatus
    /// 배정된 근무 시간. 배정이 없으면 nil (기록만 있는 대타 등).
    public let startTime: String?
    public let endTime: String?
    /// 정렬·시간대 구분용. 배정이 없으면 nil.
    public let startMinutes: Int?
    public let clockInAt: String?
    public let clockOutAt: String?

    public var id: String { memberUserId }

    public init(
        memberUserId: String,
        name: String,
        status: BUTodayShiftStatus,
        startTime: String?,
        endTime: String?,
        startMinutes: Int?,
        clockInAt: String?,
        clockOutAt: String?
    ) {
        self.memberUserId = memberUserId
        self.name = name
        self.status = status
        self.startTime = startTime
        self.endTime = endTime
        self.startMinutes = startMinutes
        self.clockInAt = clockInAt
        self.clockOutAt = clockOutAt
    }
}

public enum BUTodayRoster {

    /// 오늘 명단 — 이른 시간부터 왼쪽에 오도록 정렬.
    ///  정렬: 시작시간 오름차순 → 시간 없는 사람(기록만·휴무·연차) → 이름순.
    public static func build(
        dateStr: String,
        weekday: Int,
        members: [BURosterMemberInput],
        attendance: [BURosterAttendance],
        leaves: [BURosterLeave]
    ) -> [BUTodayRosterEntry] {

        let onLeave = Set(
            leaves
                .filter { $0.status == "approved" && $0.startDate <= dateStr && dateStr <= $0.endDate }
                .map(\.memberUserId)
        )
        var attByMember: [String: BURosterAttendance] = [:]
        for a in attendance { attByMember[a.memberUserId] = a }

        let entries: [BUTodayRosterEntry] = members.map { m in
            let shift = BUWorkSchedule.resolve(
                dateStr: dateStr, weekday: weekday, rules: m.rules, exceptions: m.exceptions
            )
            let att = attByMember[m.memberUserId]

            let status: BUTodayShiftStatus
            if onLeave.contains(m.memberUserId) {
                status = .leave
            } else if let att {
                status = att.clockOutAt != nil ? .done : .working
            } else if shift != nil {
                status = .scheduled
            } else {
                status = .off
            }

            return BUTodayRosterEntry(
                memberUserId: m.memberUserId,
                name: m.name,
                status: status,
                startTime: shift?.startTime,
                endTime: shift?.endTime,
                startMinutes: shift.flatMap { BUWorkSchedule.timeToMinutes($0.startTime) },
                clockInAt: att?.clockInAt,
                clockOutAt: att?.clockOutAt
            )
        }

        return entries.sorted { a, b in
            if let am = a.startMinutes, let bm = b.startMinutes, am != bm { return am < bm }
            if a.startMinutes != nil && b.startMinutes == nil { return true }
            if a.startMinutes == nil && b.startMinutes != nil { return false }
            return a.name.localizedCompare(b.name) == .orderedAscending
        }
    }

    // ── 날짜 헬퍼 ────────────────────────────────────────────────
    //  근무일 판정은 **사용자가 보는 달력**(로컬) 기준이어야 한다. UTC 로 계산하면
    //  자정 전후에 하루가 밀려 "오늘 근무"가 통째로 어긋난다.

    /// 로컬 기준 "yyyy-MM-dd" (웹 toDateKey 미러)
    public static func localDateKey(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.string(from: date)
    }

    /// "yyyy-MM-dd" → 요일 0=일 … 6=토. 파싱 실패 시 오늘 요일.
    public static func weekday(of dateStr: String) -> Int {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        let date = f.date(from: dateStr) ?? Date()
        return Calendar(identifier: .gregorian).component(.weekday, from: date) - 1
    }

    /// 홈에 보일 사람 — 오늘과 무관한 휴무자는 뺀다.
    ///  연차는 남긴다: "오늘 왜 안 보이지"의 답이 화면에 있어야 사장이 다시 찾지 않는다.
    public static func visibleForHome(_ entries: [BUTodayRosterEntry]) -> [BUTodayRosterEntry] {
        entries.filter { $0.status != .off }
    }

    /// 오늘 실제로 출근한(또는 마친) 사람 수.
    public static func clockedInCount(_ entries: [BUTodayRosterEntry]) -> Int {
        entries.filter { $0.status == .working || $0.status == .done }.count
    }

    /// 오늘 근무 예정 인원(연차 제외) — "3명 중 1명 출근"의 분모.
    public static func expectedCount(_ entries: [BUTodayRosterEntry]) -> Int {
        entries.filter { $0.status == .working || $0.status == .done || $0.status == .scheduled }.count
    }
}
