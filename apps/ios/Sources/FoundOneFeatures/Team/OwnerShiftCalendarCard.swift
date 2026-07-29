//
//  OwnerShiftCalendarCard.swift — 사장용 근무 캘린더 (2026-07-28 사장님 요청)
//
//    "사장 입장에서는 캘린더에 어떤 직원들이 출근하는지"
//
//  웹 미러: apps/web/app/lib/components/team/OwnerScheduleCalendar.tsx (동일 구성·동일 해석)
//  근무 해석은 BUWorkSchedule SSOT — 직원 캘린더와 같은 규칙 (복붙 금지, active 방어 포함).
//
//  데이터: 규칙(rules)은 부모(TeamManagementView)가 이미 로드한 것을 받고,
//  예외·연차·출퇴근은 보는 달 범위로 이 카드가 직접 조회한다
//  (부모는 예외를 오늘 이후만 들고 있어 지난달이 부정확해지기 때문).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

private let LEAVE_COLOR = Color(red: 139 / 255, green: 127 / 255, blue: 212 / 255) // #8b7fd4
private let WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"]

// 근무 해석 SSOT 에 Repository 타입 연결 (프로토콜 conformance — 로직 중복 0)
extension TeamScheduleRule: BUWorkRule {}
extension OwnerScheduleException: BUWorkException {}

struct OwnerShiftCalendarCard: View {
    let members: [TeamMember]          // 재직자
    let rules: [TeamScheduleRule]      // 부모가 로드 (active 혼재 — SSOT 가 방어)
    let repo: TeamRepository

    @State private var viewMonth: (y: Int, m: Int) = {
        let c = Calendar.current.dateComponents([.year, .month], from: Date())
        return (c.year ?? 2026, c.month ?? 1)
    }()
    @State private var exceptions: [OwnerScheduleException] = []
    @State private var leaves: [TeamLeaveRequest] = []
    @State private var atts: [OwnerMonthAttendance] = []
    @State private var selected: String?
    @State private var loading = false

    /// KST 기준 오늘 — work_date 저장 기준과 동일 (TeamRepository.kstToday 와 같은 규칙)
    private var todayKey: String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Asia/Seoul") ?? .current
        let c = cal.dateComponents([.year, .month, .day], from: Date())
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    private var monthStart: String { String(format: "%04d-%02d-01", viewMonth.y, viewMonth.m) }
    private var daysInMonth: Int {
        let cal = Calendar.current
        let first = DateComponents(calendar: cal, year: viewMonth.y, month: viewMonth.m, day: 1).date ?? Date()
        return cal.range(of: .day, in: .month, for: first)?.count ?? 28
    }
    private var monthEnd: String { String(format: "%04d-%02d-%02d", viewMonth.y, viewMonth.m, daysInMonth) }

    /// 날짜 → (근무 명단, 연차 명단)
    private var byDate: [String: (work: [(name: String, time: String, worked: Bool)], leave: [String])] {
        var map: [String: (work: [(name: String, time: String, worked: Bool)], leave: [String])] = [:]
        let workedKeys = Set(atts.compactMap { $0.clockInAt != nil ? "\($0.memberUserId.uuidString)|\($0.workDate)" : nil })
        let cal = Calendar.current

        for m in members {
            let memberRules: [any BUWorkRule] = rules.filter { $0.memberUserId == m.memberUserId }
            let memberEx: [any BUWorkException] = exceptions.filter { $0.memberUserId == m.memberUserId }
            let memberLeaves = leaves
                .filter { $0.memberUserId == m.memberUserId }
                .map { (startDate: $0.startDate, endDate: $0.endDate, status: $0.status) }
            let leaveSet = BUWorkSchedule.expandLeaveDates(memberLeaves)

            for day in 1...daysInMonth {
                let key = String(format: "%04d-%02d-%02d", viewMonth.y, viewMonth.m, day)
                guard let date = DateComponents(calendar: cal, year: viewMonth.y, month: viewMonth.m, day: day).date else { continue }
                let weekday = cal.component(.weekday, from: date) - 1
                var slot = map[key] ?? (work: [], leave: [])
                if leaveSet.contains(key) {
                    slot.leave.append(m.name)
                } else if let shift = BUWorkSchedule.resolve(dateStr: key, weekday: weekday, rules: memberRules, exceptions: memberEx) {
                    slot.work.append((
                        name: m.name,
                        time: "\(BUWorkSchedule.shortTime(shift.startTime))–\(BUWorkSchedule.shortTime(shift.endTime))",
                        worked: workedKeys.contains("\(m.memberUserId.uuidString)|\(key)")
                    ))
                }
                if !slot.work.isEmpty || !slot.leave.isEmpty { map[key] = slot }
            }
        }
        return map
    }

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                header
                grid
                if let selected { detail(for: selected) }
                legendRow
            }
        }
        .task(id: "\(viewMonth.y)-\(viewMonth.m)") { await load() }
        .onAppear { if selected == nil { selected = todayKey } }
    }

    private var header: some View {
        HStack(spacing: 6) {
            Text("\(String(viewMonth.y))년 \(viewMonth.m)월")
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            if loading {
                Text("불러오는 중")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            Spacer()
            Button { moveMonth(-1) } label: {
                Image(systemName: "chevron.left").font(.system(size: 13, weight: .bold))
                    .foregroundStyle(BUColor.midnight).padding(6)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("이전 달")
            Button { moveMonth(1) } label: {
                Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold))
                    .foregroundStyle(BUColor.midnight).padding(6)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("다음 달")
        }
    }

    private var grid: some View {
        let cal = Calendar.current
        let first = DateComponents(calendar: cal, year: viewMonth.y, month: viewMonth.m, day: 1).date ?? Date()
        let firstWeekday = cal.component(.weekday, from: first) - 1
        let data = byDate

        return LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: 7), spacing: 4) {
            ForEach(0..<7, id: \.self) { wd in
                Text(WEEKDAYS_KO[wd])
                    .font(.system(size: 10.5, weight: .heavy))
                    .foregroundStyle(wd == 0 ? LEAVE_COLOR : BUColor.inkMuted)
            }
            ForEach(0..<firstWeekday, id: \.self) { _ in Color.clear.frame(height: 42) }
            ForEach(1...daysInMonth, id: \.self) { day in
                let key = String(format: "%04d-%02d-%02d", viewMonth.y, viewMonth.m, day)
                let slot = data[key]
                let count = slot?.work.count ?? 0
                let hasLeave = !(slot?.leave.isEmpty ?? true)
                Button {
                    selected = (selected == key) ? nil : key
                } label: {
                    ZStack(alignment: .topTrailing) {
                        VStack(spacing: 2) {
                            Text("\(day)")
                                .font(.system(size: 12.5, weight: key == todayKey ? .heavy : .semibold))
                                .foregroundStyle(count > 0 ? BUColor.midnight : BUColor.inkMuted)
                            if count > 0 {
                                Text("\(count)명")
                                    .font(.system(size: 10, weight: .heavy))
                                    .foregroundStyle(BUColor.midnight.opacity(0.75))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        if hasLeave {
                            Circle().fill(LEAVE_COLOR).frame(width: 5, height: 5).padding(.top, 3).padding(.trailing, 4)
                        }
                    }
                    .frame(height: 42)
                    .background(
                        count > 0 ? BUColor.midnight.opacity(0.06) : .clear,
                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .strokeBorder(
                                selected == key ? BUColor.midnight : (key == todayKey ? BUColor.midnight.opacity(0.3) : .clear),
                                lineWidth: selected == key ? 1.5 : 1
                            )
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder
    private func detail(for key: String) -> some View {
        let slot = byDate[key]
        let month = Int(key.dropFirst(5).prefix(2)) ?? 0
        let day = Int(key.suffix(2)) ?? 0
        VStack(alignment: .leading, spacing: 7) {
            Text("\(month)월 \(day)일")
                .font(.system(size: 12.5, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            if slot == nil || ((slot?.work.isEmpty ?? true) && (slot?.leave.isEmpty ?? true)) {
                Text("이날은 근무가 없어요.")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            } else {
                ForEach(Array((slot?.work ?? []).enumerated()), id: \.offset) { _, e in
                    HStack(spacing: 8) {
                        Text(e.name).font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.ink)
                        Text(e.time).font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                            .monospacedDigit()
                        if e.worked {
                            Text("출근함")
                                .font(.system(size: 10, weight: .heavy))
                                .foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 7).padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.08), in: Capsule())
                        }
                        Spacer(minLength: 0)
                    }
                }
                ForEach(Array((slot?.leave ?? []).enumerated()), id: \.offset) { _, name in
                    HStack(spacing: 8) {
                        Text(name).font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                        Text("연차")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(LEAVE_COLOR)
                            .padding(.horizontal, 7).padding(.vertical, 2)
                            .background(LEAVE_COLOR.opacity(0.12), in: Capsule())
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.7), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1)
        )
    }

    private var legendRow: some View {
        HStack(spacing: 14) {
            HStack(spacing: 5) {
                RoundedRectangle(cornerRadius: 4).fill(BUColor.midnight.opacity(0.06))
                    .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1))
                    .frame(width: 14, height: 14)
                Text("근무 있는 날").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
            }
            HStack(spacing: 5) {
                Circle().fill(LEAVE_COLOR).frame(width: 6, height: 6)
                Text("연차").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
            }
            Spacer(minLength: 0)
        }
    }

    private func moveMonth(_ delta: Int) {
        selected = nil
        var m = viewMonth.m + delta
        var y = viewMonth.y
        if m < 1 { m = 12; y -= 1 }
        if m > 12 { m = 1; y += 1 }
        viewMonth = (y, m)
    }

    private func load() async {
        loading = true
        defer { loading = false }
        async let ex = try? repo.ownerMonthExceptions(monthStart: monthStart, monthEnd: monthEnd)
        async let at = try? repo.ownerMonthAttendance(monthStart: monthStart, monthEnd: monthEnd)
        async let lv = try? repo.leaveRequests(limit: 200)
        exceptions = await ex ?? []
        atts = await at ?? []
        leaves = await lv ?? []
    }
}
