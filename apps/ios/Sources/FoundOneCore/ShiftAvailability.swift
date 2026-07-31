//
//  ShiftAvailability.swift — 희망 근무 신청 SSOT (iOS)
//
//  웹 미러: packages/shared/src/team/shift-availability.ts (같은 규칙·같은 문구)
//  드리프트 가드: apps/web/__tests__/shift-availability-ios-sync.test.ts
//
//  ── 신청 창(window) 규칙 ──
//   대상 = 다음 달. 마감 = 이번 달 deadlineDay(사장 설정, 기본 31=말일).
//   마감이 지나면 그 다음 달분이 열린다. 마감 후 조회는 가능, 수정만 차단.
//
//  ── 이번 달을 열지 않는 이유 (사장님 결정 2026-07-30) ──
//   6월 중 6월 희망은 못 낸다 — 누락이 아니라 의도. 중간 변경("6/20 못 나가요")은
//   연차·반차 신청(leave_requests)이 이미 처리한다. 중복 기능을 만들지 않는다.
//
//  ── 확정과의 분리 ──
//   희망(shift_availability)은 근무표(staff_schedules)가 아니다.
//   문구에서 "희망/신청"과 "확정"을 절대 섞지 않는다 — 직원이 출근일을 오해하면 사고다.
//

import Foundation

/// 기본 마감일 = 31(말일 의도). 6월분을 5/25까지 받으면 너무 빡빡하다(사장님 지적 2026-07-30).
/// 31일이 없는 달은 말일로 보정한다. 사장은 화면에서 앞당길 수 있다.
public let BU_DEFAULT_SHIFT_REQUEST_DEADLINE_DAY = 31

/// 마감일 선택 목록 — 31 은 "말일"로 표기
public let BU_DEADLINE_DAY_CHOICES: [Int] = Array(1...31)

/// 마감일 표기 — 31 은 달마다 날짜가 달라 "말일"로 부른다
public func buDeadlineDayLabel(_ day: Int) -> String {
    day >= 31 ? "말일" : "\(day)일"
}

public struct BUShiftAvailability: Sendable, Identifiable, Equatable {
    public let memberUserId: String
    public let name: String
    public let workDate: String        // YYYY-MM-DD
    public let startTime: String?      // nil = 시간 무관
    public let endTime: String?
    public let note: String?
    public let mine: Bool

    public var id: String { "\(memberUserId)|\(workDate)" }

    public init(memberUserId: String, name: String, workDate: String,
                startTime: String?, endTime: String?, note: String?, mine: Bool) {
        self.memberUserId = memberUserId
        self.name = name
        self.workDate = workDate
        self.startTime = startTime
        self.endTime = endTime
        self.note = note
        self.mine = mine
    }
}

public struct BUShiftSubmission: Sendable, Identifiable, Equatable {
    public let memberUserId: String
    public let name: String
    public let submittedAt: String?    // nil = 아직 제출 안 함
    public let dayCount: Int
    public let mine: Bool

    public var id: String { memberUserId }

    public init(memberUserId: String, name: String, submittedAt: String?, dayCount: Int, mine: Bool) {
        self.memberUserId = memberUserId
        self.name = name
        self.submittedAt = submittedAt
        self.dayCount = dayCount
        self.mine = mine
    }
}

public struct BURequestWindow: Sendable, Equatable {
    public let period: String      // "YYYY-MM"
    public let closesOn: String    // "YYYY-MM-DD"
    public let daysLeft: Int
    public let urgent: Bool        // 3일 이내
}

public struct BUShiftPreset: Sendable, Identifiable, Equatable {
    public let key: String
    public let ko: String
    public let start: String
    public let end: String
    public var id: String { key }
}

/// 사장이 아직 시간대를 정하지 않았을 때의 폴백 — 일반적인 교대 구간.
/// ⚠️ "업종 표준"이 아니다. 앱이 그 업장 영업시간을 모르므로 출발점만 준다.
public let BU_SHIFT_PRESETS: [BUShiftPreset] = [
    BUShiftPreset(key: "morning", ko: "오전", start: "09:00", end: "13:00"),
    BUShiftPreset(key: "afternoon", ko: "오후", start: "13:00", end: "18:00"),
    BUShiftPreset(key: "evening", ko: "저녁", start: "18:00", end: "22:00"),
]

/// 사장이 정하는 근무 시간대 (2026-07-30 사장님 지시: "업장마다 운영 시간이 다 다르잖아").
/// 저장 위치 = payroll_settings.shift_slots. 직원은 RPC 로만 받는다.
public struct BUShiftSlot: Sendable, Equatable, Identifiable, Codable {
    public let label: String   // 사장이 부르는 이름 ("오픈", "미들", "마감")
    public let start: String   // "HH:MM"
    public let end: String

    public var id: String { "\(label)|\(start)|\(end)" }

    public init(label: String, start: String, end: String) {
        self.label = label
        self.start = start
        self.end = end
    }
}

/// 시간대 최대 개수 — 넘치면 버튼이 캘린더보다 커진다
public let BU_MAX_SHIFT_SLOTS = 6

/// "HH:MM" 형식·범위 검사 (초 붙은 "09:00:00" 도 앞 5자만 본다)
public func buIsValidSlotTime(_ t: String) -> Bool {
    let s = String(t.prefix(5))
    guard s.count == 5, Array(s)[2] == ":" else { return false }
    guard let h = Int(s.prefix(2)), let m = Int(s.suffix(2)) else { return false }
    return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

/// 저장된 시간대 정규화 — 깨진 항목은 조용히 버린다
/// (잘못된 시간대를 버튼으로 보여주면 직원이 그 시간에 신청하고 사장은 근무표에 그대로 넣는다)
public func buNormalizeShiftSlots(_ raw: [BUShiftSlot]) -> [BUShiftSlot] {
    var out: [BUShiftSlot] = []
    for s in raw {
        let label = s.label.trimmingCharacters(in: .whitespacesAndNewlines)
        let start = String(s.start.prefix(5))
        let end = String(s.end.prefix(5))
        guard !label.isEmpty, buIsValidSlotTime(start), buIsValidSlotTime(end), start != end else { continue }
        out.append(BUShiftSlot(label: label, start: start, end: end))
        if out.count >= BU_MAX_SHIFT_SLOTS { break }
    }
    return out
}

/// 직원 화면에 띄울 시간대 — 사장이 정한 게 있으면 그것, 없으면 폴백
public func buEffectiveShiftSlots(_ saved: [BUShiftSlot]) -> [BUShiftSlot] {
    saved.isEmpty
        ? BU_SHIFT_PRESETS.map { BUShiftSlot(label: $0.ko, start: $0.start, end: $0.end) }
        : saved
}

/// 사장이 정한 시간대인지
public func buHasOwnerSlots(_ saved: [BUShiftSlot]) -> Bool { !saved.isEmpty }

public struct BUDayAvailability: Sendable {
    public let date: String
    public let entries: [BUShiftAvailability]
    /// colorIndex = entries 안에서의 순번. 🔴 spans 순번으로 색을 고르면 "시간 무관" 참가자 때문에
    /// 색이 밀려 **막대 색과 명단 점 색이 다른 사람을 가리킨다**(2026-07-30 실렌더에서 발견).
    public let spans: [(memberUserId: String, name: String, span: (startMin: Int, endMin: Int), mine: Bool, colorIndex: Int)]
    public let anyTimeCount: Int
}

public enum BUShiftRequest {

    private static var cal: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        return c
    }

    public static func periodKey(year: Int, month: Int) -> String {
        String(format: "%04d-%02d", year, month)
    }

    public static func parsePeriod(_ period: String) -> (year: Int, month: Int)? {
        let parts = period.split(separator: "-")
        guard parts.count == 2, parts[0].count == 4, parts[1].count == 2,
              let y = Int(parts[0]), let m = Int(parts[1]), m >= 1, m <= 12 else { return nil }
        return (y, m)
    }

    /// "2026-06" → "6월"
    public static func periodLabel(_ period: String) -> String {
        guard let p = parsePeriod(period) else { return period }
        return "\(p.month)월"
    }

    private static func lastDay(year: Int, month: Int) -> Int {
        let c = cal
        guard let first = c.date(from: DateComponents(year: year, month: month, day: 1)),
              let range = c.range(of: .day, in: .month, for: first) else { return 28 }
        return range.count
    }

    /// 지금 열려 있는 신청 창. 마감일이 그 달에 없는 값(31일인데 2월)이면 말일로 보정.
    public static func currentWindow(
        today: Date = Date(),
        deadlineDay: Int = BU_DEFAULT_SHIFT_REQUEST_DEADLINE_DAY
    ) -> BURequestWindow {
        let c = cal
        let y = c.component(.year, from: today)
        let m = c.component(.month, from: today)
        let d = c.component(.day, from: today)

        let effectiveDeadline = min(max(1, deadlineDay), lastDay(year: y, month: m))
        let passed = d > effectiveDeadline

        // 마감 기준 달 (지났으면 다음 달)
        var anchorY = y
        var anchorM = m + (passed ? 1 : 0)
        if anchorM > 12 { anchorM -= 12; anchorY += 1 }

        let closeDay = min(max(1, deadlineDay), lastDay(year: anchorY, month: anchorM))
        let closesOn = String(format: "%04d-%02d-%02d", anchorY, anchorM, closeDay)

        // 대상 달 = 마감 기준 달의 다음 달
        var targetY = anchorY
        var targetM = anchorM + 1
        if targetM > 12 { targetM -= 12; targetY += 1 }

        let midnightToday = c.startOfDay(for: today)
        let closeDate = c.date(from: DateComponents(year: anchorY, month: anchorM, day: closeDay)) ?? midnightToday
        let diff = c.dateComponents([.day], from: midnightToday, to: closeDate).day ?? 0
        let daysLeft = max(0, diff)

        return BURequestWindow(
            period: periodKey(year: targetY, month: targetM),
            closesOn: closesOn,
            daysLeft: daysLeft,
            urgent: daysLeft <= 3
        )
    }

    /// 그 기간이 지금 수정 가능한지 (조회는 항상 가능, 쓰기만 이 게이트)
    public static func isEditable(
        period: String,
        today: Date = Date(),
        deadlineDay: Int = BU_DEFAULT_SHIFT_REQUEST_DEADLINE_DAY
    ) -> Bool {
        currentWindow(today: today, deadlineDay: deadlineDay).period == period
    }

    /// 그 달의 날짜 키 전부 (캘린더 렌더용)
    public static func periodDates(_ period: String) -> [String] {
        guard let p = parsePeriod(period) else { return [] }
        let last = lastDay(year: p.year, month: p.month)
        return (1...last).map { String(format: "%04d-%02d-%02d", p.year, p.month, $0) }
    }

    /// 그 달 1일의 요일 (0=일)
    public static func firstWeekday(_ period: String) -> Int {
        guard let p = parsePeriod(period),
              let first = cal.date(from: DateComponents(year: p.year, month: p.month, day: 1)) else { return 0 }
        return cal.component(.weekday, from: first) - 1
    }

    /// 기간 이동 (delta 개월)
    public static func shiftPeriod(_ period: String, by delta: Int) -> String {
        guard let p = parsePeriod(period) else { return period }
        var y = p.year
        var m = p.month + delta
        while m > 12 { m -= 12; y += 1 }
        while m < 1 { m += 12; y -= 1 }
        return periodKey(year: y, month: m)
    }

    /// 시간 무관 표기 — 없는 정보를 만들지 않는다
    public static func timeLabel(start: String?, end: String?) -> String {
        guard let s = start, let e = end, let span = BUWorkSchedule.shiftSpan(start: s, end: e) else {
            return "시간 무관"
        }
        return "\(BUWorkSchedule.formatSpanTime(span.startMin))–\(BUWorkSchedule.formatSpanTime(span.endMin))"
    }

    /// 날짜별로 묶기 — 캘린더 셀과 상세가 같은 계산을 두 번 하지 않도록
    public static func groupByDate(_ rows: [BUShiftAvailability]) -> [String: BUDayAvailability] {
        var entries: [String: [BUShiftAvailability]] = [:]
        for r in rows { entries[r.workDate, default: []].append(r) }

        var out: [String: BUDayAvailability] = [:]
        for (date, list) in entries {
            var spans: [(memberUserId: String, name: String, span: (startMin: Int, endMin: Int), mine: Bool, colorIndex: Int)] = []
            var anyTime = 0
            for (idx, r) in list.enumerated() {
                if let s = r.startTime, let e = r.endTime, let span = BUWorkSchedule.shiftSpan(start: s, end: e) {
                    spans.append((r.memberUserId, r.name, span, r.mine, idx))
                } else {
                    anyTime += 1
                }
            }
            out[date] = BUDayAvailability(date: date, entries: list, spans: spans, anyTimeCount: anyTime)
        }
        return out
    }

    /// 아직 안 낸 사람 (사장 화면의 핵심 정보 — 독촉 대상)
    public static func pendingSubmitters(_ subs: [BUShiftSubmission]) -> [BUShiftSubmission] {
        subs.filter { $0.submittedAt == nil }
    }

    /// 제출 현황 한 줄 요약.
    /// ⚠️ 필요 인원을 앱이 모르므로 "부족/충분" 판정은 하지 않는다 — 실제 인원 수만 말한다.
    public static func submissionSummary(_ subs: [BUShiftSubmission]) -> String {
        let total = subs.count
        let done = subs.filter { $0.submittedAt != nil }.count
        if total == 0 { return "등록된 직원이 없어요." }
        if done == total { return "직원 \(total)명 모두 제출했어요." }
        return "\(total)명 중 \(done)명 제출 · \(total - done)명 대기"
    }
}
