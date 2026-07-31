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
    /// 이 달의 희망 신청 (미확정) — 셀 힌트 점만. 확정과 절대 섞지 않는다 (2026-07-31)
    @State private var wishes: [TeamRepository.WishHint] = []
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

    /// 날짜 → (근무 명단, 연차 명단[승인여부 포함])
    ///  ⚠️ computed 라 매 렌더 재계산된다 — body 에서 1회만 호출해 grid·detail 로 넘긴다
    ///     (종전엔 grid·detail 이 각각 호출해 렌더당 2회 전체 순회. 2026-07-28 냉정 리뷰)
    private func computeByDate() -> [String: (work: [(name: String, time: String, worked: Bool, leavePending: Bool, span: (startMin: Int, endMin: Int)?)], leave: [(name: String, pending: Bool)])] {
        var map: [String: (work: [(name: String, time: String, worked: Bool, leavePending: Bool, span: (startMin: Int, endMin: Int)?)], leave: [(name: String, pending: Bool)])] = [:]
        let workedKeys = Set(atts.compactMap { $0.clockInAt != nil ? "\($0.memberUserId.uuidString)|\($0.workDate)" : nil })
        let cal = Calendar.current

        for m in members {
            let memberRules: [any BUWorkRule] = rules.filter { $0.memberUserId == m.memberUserId }
            let memberEx: [any BUWorkException] = exceptions.filter { $0.memberUserId == m.memberUserId }
            let memberLeaves = leaves
                .filter { $0.memberUserId == m.memberUserId }
                .map { (startDate: $0.startDate, endDate: $0.endDate, status: $0.status) }
            let leaveMap = BUWorkSchedule.expandLeaveDatesWithStatus(memberLeaves)

            for day in 1...daysInMonth {
                let key = String(format: "%04d-%02d-%02d", viewMonth.y, viewMonth.m, day)
                guard let date = DateComponents(calendar: cal, year: viewMonth.y, month: viewMonth.m, day: day).date else { continue }
                let weekday = cal.component(.weekday, from: date) - 1
                var slot = map[key] ?? (work: [], leave: [])
                let leaveState = leaveMap[key]   // nil=없음, false=승인, true=대기
                if leaveState == false {
                    // 승인된 연차만 근무에서 제외 — 확정된 사실
                    slot.leave.append((name: m.name, pending: false))
                } else if let shift = BUWorkSchedule.resolve(dateStr: key, weekday: weekday, rules: memberRules, exceptions: memberEx) {
                    // 승인 대기 연차는 근무 유지 — 승인 전까지 출근 예정 (냉정 리뷰 2026-07-28)
                    slot.work.append((
                        name: m.name,
                        time: "\(BUWorkSchedule.shortTime(shift.startTime))–\(BUWorkSchedule.shortTime(shift.endTime))",
                        worked: workedKeys.contains("\(m.memberUserId.uuidString)|\(key)"),
                        leavePending: leaveState == true,
                        span: BUWorkSchedule.shiftSpan(start: shift.startTime, end: shift.endTime)
                    ))
                } else if leaveState == true {
                    slot.leave.append((name: m.name, pending: true))
                }
                if !slot.work.isEmpty || !slot.leave.isEmpty { map[key] = slot }
            }
        }
        return map
    }

    /// 날짜 → 미확정 희망 수 (그날 이미 확정 근무가 있는 사람의 희망은 제외 — 이중 카운트 방지, 웹 미러)
    private func wishCountByDate(_ data: [String: (work: [(name: String, time: String, worked: Bool, leavePending: Bool, span: (startMin: Int, endMin: Int)?)], leave: [(name: String, pending: Bool)])]) -> [String: Int] {
        var map: [String: Int] = [:]
        let nameById = Dictionary(uniqueKeysWithValues: members.map { ($0.memberUserId, $0.name) })
        for w in wishes {
            guard let name = nameById[w.memberUserId] else { continue }
            let scheduled = data[w.workDate]?.work.contains { $0.name == name } ?? false
            if !scheduled { map[w.workDate, default: 0] += 1 }
        }
        return map
    }

    var body: some View {
        let data = computeByDate()   // 렌더당 1회만 (grid·detail 공용)
        let wishCounts = wishCountByDate(data)
        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                header
                grid(data, wishCounts: wishCounts)
                if let selected { detail(for: selected, data: data, wishCount: wishCounts[selected] ?? 0) }
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

    private func grid(_ data: [String: (work: [(name: String, time: String, worked: Bool, leavePending: Bool, span: (startMin: Int, endMin: Int)?)], leave: [(name: String, pending: Bool)])], wishCounts: [String: Int]) -> some View {
        let cal = Calendar.current
        let first = DateComponents(calendar: cal, year: viewMonth.y, month: viewMonth.m, day: 1).date ?? Date()
        let firstWeekday = cal.component(.weekday, from: first) - 1

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
                let approvedLeave = (slot?.leave ?? []).contains { !$0.pending }
                let pendingLeave = (slot?.leave ?? []).contains { $0.pending }
                    || (slot?.work ?? []).contains { $0.leavePending }
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
                        if approvedLeave {
                            Circle().fill(LEAVE_COLOR).frame(width: 5, height: 5).padding(.top, 3).padding(.trailing, 4)
                        } else if pendingLeave {
                            Circle().strokeBorder(LEAVE_COLOR, lineWidth: 1.5).frame(width: 5, height: 5).padding(.top, 3).padding(.trailing, 4)
                        }
                        if (wishCounts[key] ?? 0) > 0 {
                            RoundedRectangle(cornerRadius: 2)
                                .strokeBorder(LEAVE_COLOR.opacity(0.9), lineWidth: 1.5)
                                .frame(width: 5, height: 5)
                                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                                .padding(.top, 3).padding(.leading, 4)
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
    private func detail(for key: String, data: [String: (work: [(name: String, time: String, worked: Bool, leavePending: Bool, span: (startMin: Int, endMin: Int)?)], leave: [(name: String, pending: Bool)])], wishCount: Int) -> some View {
        let slot = data[key]
        let month = Int(key.dropFirst(5).prefix(2)) ?? 0
        let day = Int(key.suffix(2)) ?? 0
        VStack(alignment: .leading, spacing: 7) {
            Text("\(month)월 \(day)일")
                .font(.system(size: 12.5, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            if wishCount > 0 {
                Text("희망 근무 신청 \(wishCount)명 — 아직 근무표 아님, 「희망 근무 취합」에서 확정하세요.")
                    .font(.system(size: 11.5, weight: .heavy))
                    .foregroundStyle(LEAVE_COLOR)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if slot == nil || ((slot?.work.isEmpty ?? true) && (slot?.leave.isEmpty ?? true)) {
                Text("이날은 근무가 없어요.")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            } else {
                // 교대 타임라인 — 누가 언제 겹치고 언제 비는지 (텍스트 나열로는 안 보임)
                shiftTimeline(slot?.work ?? [])
                ForEach(Array((slot?.work ?? []).enumerated()), id: \.offset) { i, e in
                    HStack(spacing: 8) {
                        RoundedRectangle(cornerRadius: 2).fill(Self.shiftColor(i)).frame(width: 8, height: 8)
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
                        if e.leavePending {
                            Text("연차 신청 중")
                                .font(.system(size: 10, weight: .heavy))
                                .foregroundStyle(LEAVE_COLOR)
                                .padding(.horizontal, 7).padding(.vertical, 2)
                                .background(Capsule().strokeBorder(LEAVE_COLOR, lineWidth: 1))
                        }
                        Spacer(minLength: 0)
                    }
                }
                ForEach(Array((slot?.leave ?? []).enumerated()), id: \.offset) { _, lv in
                    HStack(spacing: 8) {
                        Text(lv.name).font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                        // 승인 대기를 확정 연차처럼 보이면 인력 배치를 그르친다 — 반드시 구분
                        Text(lv.pending ? "연차 승인 대기" : "연차")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(LEAVE_COLOR)
                            .padding(.horizontal, 7).padding(.vertical, 2)
                            .background(
                                Capsule()
                                    .fill(lv.pending ? Color.clear : LEAVE_COLOR.opacity(0.12))
                                    .overlay(lv.pending ? Capsule().strokeBorder(LEAVE_COLOR, lineWidth: 1) : nil)
                            )
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

    /// 교대 구분색 — 미드나잇 계열 명도 단계 (신호등 컬러 금지)
    static func shiftColor(_ i: Int) -> Color {
        let palette: [Color] = [
            Color(red: 29 / 255, green: 53 / 255, blue: 87 / 255),
            Color(red: 59 / 255, green: 92 / 255, blue: 140 / 255),
            Color(red: 107 / 255, green: 131 / 255, blue: 181 / 255),
            Color(red: 154 / 255, green: 171 / 255, blue: 208 / 255),
        ]
        return palette[i % palette.count]
    }

    /// 하루 교대를 가로 막대로 — 축 = 최소 시작 ~ 최대 종료. 공백은 빗금 + 문구.
    @ViewBuilder
    private func shiftTimeline(_ entries: [(name: String, time: String, worked: Bool, leavePending: Bool, span: (startMin: Int, endMin: Int)?)]) -> some View {
        let spans = entries.compactMap(\.span)
        if !spans.isEmpty {
            let minStart = spans.map(\.startMin).min() ?? 0
            let maxEnd = spans.map(\.endMin).max() ?? 1
            let total = max(1, maxEnd - minStart)
            let gaps = BUWorkSchedule.coverageGaps(spans)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(BUWorkSchedule.formatSpanTime(minStart))
                    Spacer()
                    Text(BUWorkSchedule.formatSpanTime(maxEnd))
                }
                .font(.system(size: 10.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .monospacedDigit()

                GeometryReader { geo in
                    let w = geo.size.width
                    ZStack(alignment: .topLeading) {
                        VStack(spacing: 4) {
                            ForEach(Array(entries.enumerated()), id: \.offset) { i, e in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 5).fill(BUColor.midnight.opacity(0.05))
                                        .frame(height: 18)
                                    if let sp = e.span {
                                        RoundedRectangle(cornerRadius: 5)
                                            .fill(Self.shiftColor(i))
                                            .frame(width: max(2, w * CGFloat(sp.endMin - sp.startMin) / CGFloat(total)), height: 18)
                                            .offset(x: w * CGFloat(sp.startMin - minStart) / CGFloat(total))
                                            .overlay(alignment: .leading) {
                                                Text(e.name)
                                                    .font(.system(size: 10, weight: .heavy))
                                                    .foregroundStyle(.white)
                                                    .padding(.leading, 6)
                                                    .offset(x: w * CGFloat(sp.startMin - minStart) / CGFloat(total))
                                                    .lineLimit(1)
                                            }
                                    }
                                }
                            }
                        }
                        // 공백 구간 — 근무 사이가 비어 있음
                        ForEach(Array(gaps.enumerated()), id: \.offset) { _, g in
                            RoundedRectangle(cornerRadius: 4)
                                .strokeBorder(BUColor.danger.opacity(0.45), style: StrokeStyle(lineWidth: 1, dash: [3, 3]))
                                .background(RoundedRectangle(cornerRadius: 4).fill(BUColor.danger.opacity(0.07)))
                                .frame(width: max(2, w * CGFloat(g.endMin - g.startMin) / CGFloat(total)),
                                       height: CGFloat(entries.count) * 22)
                                .offset(x: w * CGFloat(g.startMin - minStart) / CGFloat(total))
                        }
                    }
                }
                .frame(height: CGFloat(entries.count) * 22)

                if !gaps.isEmpty {
                    Text("교대 사이 빈 시간 " + gaps.map {
                        "\(BUWorkSchedule.formatSpanTime($0.startMin))–\(BUWorkSchedule.formatSpanTime($0.endMin))"
                    }.joined(separator: ", "))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.danger)
                }
            }
            .padding(.bottom, 2)
        }
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
                Text("연차(승인)").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
            }
            HStack(spacing: 5) {
                Circle().strokeBorder(LEAVE_COLOR, lineWidth: 1.5).frame(width: 6, height: 6)
                Text("승인 대기").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
            }
            HStack(spacing: 5) {
                RoundedRectangle(cornerRadius: 2).strokeBorder(LEAVE_COLOR, lineWidth: 1.5).frame(width: 6, height: 6)
                Text("희망 신청").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
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
        async let lv = try? repo.ownerMonthLeaves(monthStart: monthStart, monthEnd: monthEnd)
        // 희망 신청 힌트 — 실패(마이그레이션 미적용)면 힌트만 생략, 캘린더는 정상 (웹 미러)
        async let wi = try? repo.ownerMonthWishes(monthStart: monthStart, monthEnd: monthEnd)
        exceptions = await ex ?? []
        atts = await at ?? []
        leaves = await lv ?? []
        wishes = await wi ?? []
    }
}
