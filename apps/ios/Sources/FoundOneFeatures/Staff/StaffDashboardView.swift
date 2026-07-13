//
//  StaffDashboardView.swift — 직원 전용 대시보드 (2026-07-12)
//
//  웹 SSOT 미러: apps/web/app/lib/components/surfaces/StaffDashboard.tsx
//    ① 가게 헤더 — 가게명·역할·근속 칩 + 근무 요일 스트립
//    ② 오늘 카드 — 일정 + 출근/퇴근 + 실시간 경과, 야근은 라벤더(LEAVE) 액센트
//       · 출근 버튼은 근무 10분 전부터 활성화 (일정 없으면 항상 허용)
//    ③ 출근 기록 캘린더 — 월별 점 코딩 (근무=미드나잇 채움 · 연차=라벤더 · 예정=아웃라인)
//    ④ 연차·휴가 — 내 신청 목록(4종) + 신청 시트 + pending 취소
//
//  원칙(웹과 동일): 가짜 데이터 0 — 없으면 정직한 빈 상태. 신호등 컬러 금지
//    (대기/승인/반려 = 미드나잇 톤, 연차·야근 = 라벤더 #8b7fd4).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

private let LEAVE_COLOR = Color(red: 139 / 255, green: 127 / 255, blue: 212 / 255) // #8b7fd4
private let WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"]

private func ymd(_ d: Date) -> String {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: d)
}

/// 특정 날짜의 실제 근무 = 예외행 우선(휴무/다른시간), 없으면 그 요일 반복 규칙 (웹 resolveShift 미러)
private func resolveShift(dateStr: String, weekday: Int, rules: [TeamScheduleRule], exceptions: [StaffScheduleException]) -> (start: String, end: String, note: String?)? {
    if let ex = exceptions.first(where: { $0.workDate == dateStr }) {
        if ex.isOff == true { return nil }
        if let s = ex.startTime, let e = ex.endTime { return (s, e, ex.note) }
    }
    guard let r = rules.first(where: { $0.weekday == weekday }) else { return nil }
    return (r.startTime, r.endTime, nil)
}

public struct StaffDashboardView: View {

    private let onSignOut: () -> Void

    public init(onSignOut: @escaping () -> Void) {
        self.onSignOut = onSignOut
    }

    @State private var ctx: StaffStoreContext? = nil
    @State private var loading = true
    @State private var rules: [TeamScheduleRule] = []
    @State private var exceptions: [StaffScheduleException] = []
    @State private var monthAtt: [StaffAttendance] = []
    @State private var leaves: [TeamLeaveRequest] = []
    @State private var busy = false
    @State private var viewMonth: (y: Int, m: Int) = {
        let c = Calendar.current.dateComponents([.year, .month], from: Date())
        return (c.year ?? 2026, c.month ?? 1)
    }()
    @State private var showLeaveSheet = false
    @State private var showProfileSheet = false   // 내 정보 시트 (2026-07-13)

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }
    private var today: String { ymd(Date()) }
    private var todayAtt: StaffAttendance? { monthAtt.first(where: { $0.workDate == today }) }
    private var todayShift: (start: String, end: String, note: String?)? {
        resolveShift(dateStr: today, weekday: Calendar.current.component(.weekday, from: Date()) - 1,
                     rules: rules, exceptions: exceptions)
    }
    private var workdays: Set<Int> { Set(rules.map(\.weekday)) }
    // 주 근무 분 — 반복 규칙 합산 (웹 StaffDashboard weeklyMinutes 미러)
    private var weeklyMinutes: Int {
        rules.reduce(0) { sum, r in
            let s = r.startTime.prefix(5).split(separator: ":").compactMap { Int($0) }
            let e = r.endTime.prefix(5).split(separator: ":").compactMap { Int($0) }
            guard s.count == 2, e.count == 2 else { return sum }
            var d = e[0] * 60 + e[1] - (s[0] * 60 + s[1])
            if d <= 0 { d += 1440 }
            return sum + d
        }
    }

    public var body: some View {
        ZStack(alignment: .top) {
            BUBackgroundSurface()
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    // 로고 + 내 정보 헤더 바 (2026-07-13, 웹 미러) — 연결됐을 때만 내 정보 노출
                    logoHeaderBar(showProfileBtn: ctx?.connected == true)
                    if loading {
                        ProgressView().frame(maxWidth: .infinity).padding(.vertical, 60)
                    } else if let ctx, ctx.connected {
                        headerCard(ctx)
                        StaffTodayCard(
                            shift: todayShift, att: todayAtt, busy: busy,
                            onClockIn: { Task { await clockIn() } },
                            onClockOut: { Task { await clockOut() } }
                        )
                        calendarCard
                        leaveCard
                        // 내 근로 권리 — 주휴수당·퇴직금·연차 자격 (사장 판정과 동일 SSOT, 2026-07-13)
                        StaffRightsCard(hourlyWage: ctx.hourlyWage, hireDate: ctx.hireDate, joinedAt: ctx.joinedAt, weeklyMinutes: weeklyMinutes)
                        // 로그아웃은 「내 정보」 시트로 통합 (2026-07-13)
                    } else {
                        notConnectedCard
                    }
                    Color.clear.frame(height: 40)
                }
                .padding(.horizontal, BUSpacing.md)
                .padding(.top, BUSpacing.sm)
            }
        }
        .task { await load() }
        .onReceive(NotificationCenter.default.publisher(for: .buildupRemoteDataChanged)) { _ in
            Task { await load() }
        }
        .sheet(isPresented: $showLeaveSheet) {
            StaffLeaveSheet { type, start, end, reason in
                guard let owner = ctx?.ownerUserId else { return }
                try? await repo.submitLeave(ownerUserId: owner, type: type, startDate: start, endDate: end, reason: reason)
                await load()
            }
        }
        // 「내 정보」 — 팝업(sheet) 아닌 전체 화면(사장 ProfileView 탭과 동일 취지, 2026-07-13).
        .fullScreenCover(isPresented: $showProfileSheet) {
            if let ctx {
                StaffProfileSheet(
                    storeName: ctx.storeName?.trimmingCharacters(in: .whitespaces).isEmpty == false ? ctx.storeName! : "가게",
                    role: ctx.role ?? "staff",
                    onSignOut: onSignOut
                )
            }
        }
    }

    // ── 로고 + 내 정보 헤더 바 ──
    private func logoHeaderBar(showProfileBtn: Bool) -> some View {
        HStack(spacing: 10) {
            FoundOneSpiralLogo(size: 26, color: BUColor.midnightBright)
            (Text("Found").foregroundColor(BUColor.ink)
             + Text(".").foregroundColor(BUColor.midnight)
             + Text("One").fontWeight(.heavy).foregroundColor(BUColor.ink))
                .font(.system(size: 15, weight: .bold))
            Spacer(minLength: 0)
            if showProfileBtn {
                Button { showProfileSheet = true } label: {
                    Label("내 정보", systemImage: "person.crop.circle")
                        .font(.system(size: 12.5, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 14).padding(.vertical, 7)
                        .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 4)
    }

    // ── 데이터 로드 (웹 loadAll 미러) ──
    private func load() async {
        do {
            let context = try await repo.staffContext()
            ctx = context
            guard context.connected else { loading = false; return }
            let (y, m) = viewMonth
            let lastDay = Calendar.current.range(of: .day, in: .month,
                for: DateComponents(calendar: .current, year: y, month: m).date ?? Date())?.count ?? 28
            let monthStart = String(format: "%04d-%02d-01", y, m)
            let monthEnd = String(format: "%04d-%02d-%02d", y, m, lastDay)
            async let r = repo.myScheduleRules()
            async let e = repo.myScheduleExceptions(monthStart: monthStart, monthEnd: monthEnd)
            async let a = repo.myAttendance(monthStart: monthStart, monthEnd: monthEnd)
            async let l = repo.myLeaves()
            let (rr, ee, aa, ll) = try await (r, e, a, l)
            rules = rr; exceptions = ee; monthAtt = aa; leaves = ll
            loading = false
        } catch {
            loading = false
        }
    }

    private func clockIn() async {
        guard let owner = ctx?.ownerUserId, !busy else { return }
        busy = true
        defer { busy = false }
        if let rec = try? await repo.clockIn(ownerUserId: owner, workDate: today) {
            monthAtt.removeAll { $0.workDate == today }
            monthAtt.append(rec)
        }
    }

    private func clockOut() async {
        guard let att = todayAtt, !busy else { return }
        busy = true
        defer { busy = false }
        try? await repo.clockOut(attendanceId: att.id)
        await load()
    }

    // ── ① 가게 헤더 ──
    private func headerCard(_ ctx: StaffStoreContext) -> some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text("FOUND.ONE · 직원 대시보드")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
                    .textCase(.uppercase)
                    .tracking(0.5)
                (Text(ctx.storeName?.trimmingCharacters(in: .whitespaces).isEmpty == false ? ctx.storeName! : "가게")
                    .foregroundColor(BUColor.midnight)
                 + Text("에서 일하고 있어요").foregroundColor(BUColor.ink))
                    .font(.system(size: 19, weight: .heavy))
                HStack(spacing: 6) {
                    chip(ctx.role == "manager" ? "역할 · 매니저" : "역할 · 직원")
                    if let t = tenure(ctx), t >= 1 { chip("근속 · \(t)일차") }
                }
                // 근무 요일 스트립
                VStack(alignment: .leading, spacing: 6) {
                    Text("근무 요일")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                        .textCase(.uppercase)
                        .tracking(0.4)
                    HStack(spacing: 6) {
                        ForEach(0..<7, id: \.self) { wd in
                            let on = workdays.contains(wd)
                            Text(WEEKDAYS_KO[wd])
                                .font(.system(size: 12.5, weight: .heavy))
                                .foregroundStyle(on ? .white : (wd == 0 ? LEAVE_COLOR : BUColor.inkMuted))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 7)
                                .background(
                                    on ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.midnight.opacity(0.06)),
                                    in: RoundedRectangle(cornerRadius: 10)
                                )
                        }
                    }
                    if workdays.isEmpty {
                        Text("근무 요일 미정 — 사장님이 근무표를 등록하면 표시됩니다.")
                            .font(.system(size: 11.5))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
                .padding(.top, 4)
            }
        }
    }

    private func chip(_ label: String) -> some View {
        Text(label)
            .font(.system(size: 11.5, weight: .semibold))
            .foregroundStyle(BUColor.inkSecondary)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(BUColor.midnight.opacity(0.05), in: Capsule())
    }

    private func tenure(_ ctx: StaffStoreContext) -> Int? {
        let base = ctx.hireDate ?? ctx.joinedAt.map { String($0.prefix(10)) }
        guard let base else { return nil }
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        guard let d = f.date(from: String(base.prefix(10))) else { return nil }
        return max(1, (Calendar.current.dateComponents([.day], from: d, to: Date()).day ?? 0) + 1)
    }

    // ── ③ 출근 기록 캘린더 ──
    private var calendarCard: some View {
        let (y, m) = viewMonth
        let cal = Calendar.current
        let firstDate = DateComponents(calendar: cal, year: y, month: m, day: 1).date ?? Date()
        let firstWeekday = cal.component(.weekday, from: firstDate) - 1
        let daysInMonth = cal.range(of: .day, in: .month, for: firstDate)?.count ?? 28
        let workedSet = Set(monthAtt.map(\.workDate))
        var leaveSet = Set<String>()
        for l in leaves where l.status != "rejected" {
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
            if var d = f.date(from: l.startDate), let e = f.date(from: l.endDate) {
                while d <= e { leaveSet.insert(ymd(d)); d = cal.date(byAdding: .day, value: 1, to: d) ?? e.addingTimeInterval(1) }
            }
        }

        return BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("\(String(y))년 \(m)월")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Spacer()
                    Button { moveMonth(-1) } label: {
                        Image(systemName: "chevron.left").font(.system(size: 13, weight: .bold)).foregroundStyle(BUColor.midnight).padding(6)
                    }
                    Button { moveMonth(1) } label: {
                        Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold)).foregroundStyle(BUColor.midnight).padding(6)
                    }
                }
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 7), spacing: 4) {
                    ForEach(0..<7, id: \.self) { wd in
                        Text(WEEKDAYS_KO[wd])
                            .font(.system(size: 10.5, weight: .heavy))
                            .foregroundStyle(wd == 0 ? LEAVE_COLOR : BUColor.inkMuted)
                    }
                    ForEach(0..<firstWeekday, id: \.self) { _ in Color.clear.frame(height: 34) }
                    ForEach(1...daysInMonth, id: \.self) { day in
                        let ds = String(format: "%04d-%02d-%02d", y, m, day)
                        let weekday = (firstWeekday + day - 1) % 7
                        let worked = workedSet.contains(ds)
                        let onLeave = leaveSet.contains(ds)
                        let scheduled = !worked && !onLeave && resolveShift(dateStr: ds, weekday: weekday, rules: rules, exceptions: exceptions) != nil
                        VStack(spacing: 3) {
                            Text("\(day)")
                                .font(.system(size: 12, weight: ds == today ? .heavy : .medium))
                                .foregroundStyle(BUColor.ink)
                            HStack(spacing: 2) {
                                if worked { Circle().fill(BUColor.midnight).frame(width: 5, height: 5) }
                                if onLeave { Circle().fill(LEAVE_COLOR).frame(width: 5, height: 5) }
                                if scheduled { Circle().strokeBorder(BUColor.inkMuted, lineWidth: 1.5).frame(width: 5, height: 5) }
                            }
                            .frame(height: 6)
                        }
                        .frame(height: 34)
                        .background(ds == today ? BUColor.midnight.opacity(0.08) : .clear, in: RoundedRectangle(cornerRadius: 8))
                    }
                }
                HStack(spacing: 12) {
                    legend(fill: BUColor.midnight, label: "근무")
                    legend(fill: LEAVE_COLOR, label: "연차·휴가")
                    legend(fill: nil, label: "예정 근무")
                }
            }
        }
    }

    private func legend(fill: Color?, label: String) -> some View {
        HStack(spacing: 5) {
            if let fill { Circle().fill(fill).frame(width: 6, height: 6) }
            else { Circle().strokeBorder(BUColor.inkMuted, lineWidth: 1.5).frame(width: 6, height: 6) }
            Text(label).font(.system(size: 11.5, weight: .semibold)).foregroundStyle(BUColor.inkSecondary)
        }
    }

    private func moveMonth(_ delta: Int) {
        var m = viewMonth.m + delta
        var y = viewMonth.y
        if m < 1 { m = 12; y -= 1 }
        if m > 12 { m = 1; y += 1 }
        viewMonth = (y, m)
        Task { await load() }
    }

    // ── ④ 연차·휴가 ──
    private var leaveCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("연차 · 휴가")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Spacer()
                    Button { showLeaveSheet = true } label: {
                        Text("+ 신청")
                            .font(.system(size: 12.5, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12).padding(.vertical, 7)
                            .background(LEAVE_COLOR, in: RoundedRectangle(cornerRadius: 9))
                    }
                }
                if leaves.isEmpty {
                    Text("신청 내역이 없어요. 연차·반차·병가를 신청하면 사장님이 승인합니다.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.inkSecondary)
                } else {
                    ForEach(leaves) { l in
                        HStack(spacing: 8) {
                            Text(leaveLabel(l.leaveType))
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 3)
                                .background(LEAVE_COLOR, in: Capsule())
                            Text(l.startDate == l.endDate ? l.startDate : "\(l.startDate) ~ \(l.endDate)")
                                .font(.system(size: 12.5, weight: .semibold))
                                .foregroundStyle(BUColor.ink)
                            Spacer(minLength: 0)
                            Text(statusLabel(l.status))
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(l.status == "approved" ? Color.white : BUColor.inkSecondary)
                                .padding(.horizontal, 8).padding(.vertical, 3)
                                .background(
                                    l.status == "approved" ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.midnight.opacity(0.07)),
                                    in: Capsule()
                                )
                            if l.status == "pending" {
                                Button {
                                    Task { try? await repo.cancelLeave(id: l.id); await load() }
                                } label: {
                                    Image(systemName: "xmark")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(BUColor.inkMuted)
                                        .padding(5)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        }
    }

    private func leaveLabel(_ t: String) -> String {
        switch t { case "annual": return "연차"; case "half": return "반차"; case "sick": return "병가"; default: return "기타" }
    }
    private func statusLabel(_ s: String) -> String {
        switch s { case "approved": return "승인"; case "rejected": return "반려"; default: return "대기" }
    }


    private var notConnectedCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text("FOUND.ONE · 직원").font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.inkMuted).textCase(.uppercase).tracking(0.5)
                Text("아직 가게에 연결되지 않았어요").font(.system(size: 17, weight: .heavy)).foregroundStyle(BUColor.ink)
                Text("사장님께 받은 초대 링크를 다시 열거나, 초대 코드를 다시 확인해 주세요. 초대는 7일간 유효합니다.")
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                Button(action: onSignOut) {
                    Label("로그아웃", systemImage: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// ═══ ② 오늘 카드 (출퇴근 4상태 + 실시간 경과 + 야근 라벤더) ═══════════════

private struct StaffTodayCard: View {
    let shift: (start: String, end: String, note: String?)?
    let att: StaffAttendance?
    let busy: Bool
    var onClockIn: () -> Void
    var onClockOut: () -> Void

    private var done: Bool { att?.clockOutAt != nil }
    private var clockedIn: Bool { att != nil && att?.clockOutAt == nil }

    var body: some View {
        BUCard(.outer) {
            // TimelineView 가 1분마다 재계산 (경과·야근·10분 게이트 — 웹 tick 미러)
            TimelineView(.periodic(from: .now, by: clockedIn ? 1 : 30)) { timeline in
                content(now: timeline.date)
            }
        }
    }

    @ViewBuilder
    private func content(now: Date) -> some View {
        let cal = Calendar.current
        let dateLabel = "\(cal.component(.month, from: now))월 \(cal.component(.day, from: now))일 (\(WEEKDAYS_KO[cal.component(.weekday, from: now) - 1]))"

        // 정규 근무 창 (자정 넘는 야간 보정 — 웹 미러)
        let startDate = shift.flatMap { timeToday($0.start, base: now) }
        let endDate: Date? = {
            guard let e = shift.flatMap({ timeToday($0.end, base: now) }) else { return nil }
            guard let s = startDate, e <= s else { return e }
            return cal.date(byAdding: .day, value: 1, to: e)
        }()

        let openAt = startDate.map { $0.addingTimeInterval(-10 * 60) }
        let canClockIn = openAt.map { now >= $0 } ?? true
        let minsUntilOpen = openAt.map { max(0, Int(ceil($0.timeIntervalSince(now) / 60))) } ?? 0

        let clockInDate = att.flatMap { isoDate($0.clockInAt) }
        let clockOutDate = att?.clockOutAt.flatMap { isoDate($0) }
        let elapsedMin = clockInDate.map { max(0, Int((clockOutDate ?? now).timeIntervalSince($0) / 60)) } ?? 0
        let otMin: Int = {
            guard att != nil, let e = endDate else { return 0 }
            return max(0, Int(((clockOutDate ?? now).timeIntervalSince(e)) / 60))
        }()
        let overtime = otMin >= 1

        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(dateLabel).font(.system(size: 15, weight: .heavy)).foregroundStyle(BUColor.ink)
                Spacer()
                Text(shift != nil ? "오늘 근무" : "일정 미등록")
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
            }

            // 일정 박스
            HStack(spacing: 10) {
                Image(systemName: "calendar")
                    .font(.system(size: 15, weight: .semibold)).foregroundStyle(BUColor.midnight)
                if let shift {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 8) {
                            Text("\(hhmm(shift.start)) – \(hhmm(shift.end))")
                                .font(.system(size: 15, weight: .heavy)).foregroundStyle(BUColor.midnight)
                            if let s = startDate, let e = endDate {
                                Text("정규 \(fmtDur(Int(e.timeIntervalSince(s) / 60)))")
                                    .font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                    .padding(.horizontal, 8).padding(.vertical, 2)
                                    .background(.white, in: Capsule())
                            }
                        }
                        if let note = shift.note, !note.isEmpty {
                            Text(note).font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary)
                        }
                    }
                } else {
                    Text("오늘 등록된 근무 일정이 없어요. 사장님이 근무표를 등록하면 여기에 표시됩니다.")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
                Spacer(minLength: 0)
            }
            .padding(12)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 14))

            // 4상태
            if done, let att, let inD = clockInDate, let outD = clockOutDate {
                HStack(spacing: 12) {
                    Image(systemName: "checkmark.circle").font(.system(size: 20)).foregroundStyle(.white)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("오늘 근무 완료").font(.system(size: 14, weight: .heavy)).foregroundStyle(.white)
                        Text("\(hm(inD)) → \(hm(outD)) · 총 \(fmtDur(elapsedMin))\(overtime ? " · 야근 \(fmtDur(otMin))" : "")")
                            .font(.system(size: 12)).foregroundStyle(.white.opacity(0.85))
                    }
                    Spacer(minLength: 0)
                }
                .padding(14)
                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 14))
                let _ = att
            } else if clockedIn, let inD = clockInDate {
                VStack(spacing: 10) {
                    HStack(spacing: 12) {
                        Image(systemName: overtime ? "moon" : "timer")
                            .font(.system(size: 20)).foregroundStyle(overtime ? LEAVE_COLOR : BUColor.midnight)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(overtime ? "야근 · 추가 근무" : "근무 중")
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(overtime ? LEAVE_COLOR : BUColor.inkMuted)
                                .textCase(.uppercase).tracking(0.4)
                            Text("\(elapsedMin / 60):\(String(format: "%02d", elapsedMin % 60)) 경과")
                                .font(.system(size: 21, weight: .heavy).monospacedDigit())
                                .foregroundStyle(overtime ? LEAVE_COLOR : BUColor.midnight)
                            Text("출근 \(hm(inD))\(overtime ? " · 정규 초과 +\(fmtDur(otMin))" : "")")
                                .font(.system(size: 11.5)).foregroundStyle(BUColor.inkSecondary)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(14)
                    .background(
                        overtime ? AnyShapeStyle(LEAVE_COLOR.opacity(0.12)) : AnyShapeStyle(BUColor.midnight.opacity(0.05)),
                        in: RoundedRectangle(cornerRadius: 14)
                    )
                    actionButton("퇴근하기", icon: "rectangle.portrait.and.arrow.right", action: onClockOut)
                }
            } else if canClockIn {
                actionButton("출근하기", icon: "arrow.right.to.line", action: onClockIn)
            } else {
                VStack(spacing: 8) {
                    Text("출근 대기")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
                    if let openAt {
                        Text("\(hm(openAt))부터 출근 가능 · \(minsUntilOpen)분 후 활성화 (근무 10분 전)")
                            .font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary)
                            .frame(maxWidth: .infinity)
                    }
                }
            }
        }
    }

    private func actionButton(_ label: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(busy ? "처리 중…" : label, systemImage: icon)
                .font(.system(size: 14, weight: .heavy))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12))
        }
        .disabled(busy)
        .buttonStyle(.plain)
    }

    private func hhmm(_ t: String) -> String { String(t.prefix(5)) }
    private func hm(_ d: Date) -> String {
        let f = DateFormatter(); f.dateFormat = "HH:mm"; return f.string(from: d)
    }
    private func timeToday(_ t: String, base: Date) -> Date? {
        let parts = t.split(separator: ":").compactMap { Int($0) }
        guard parts.count >= 2 else { return nil }
        return Calendar.current.date(bySettingHour: parts[0], minute: parts[1], second: 0, of: base)
    }
    private func isoDate(_ s: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: s)
    }
    private func fmtDur(_ min: Int) -> String {
        let h = min / 60, m = min % 60
        if h > 0 && m > 0 { return "\(h)시간 \(m)분" }
        if h > 0 { return "\(h)시간" }
        return "\(m)분"
    }
}

// ═══ 연차 신청 시트 (웹 LeaveSheet 미러) ═══════════════════════════════

private struct StaffLeaveSheet: View {
    @Environment(\.dismiss) private var dismiss
    var onSubmit: (String, String, String, String?) async -> Void

    @State private var type = "annual"
    @State private var start = Date()
    @State private var end = Date()
    @State private var reason = ""
    @State private var submitting = false

    private let types: [(String, String)] = [("annual", "연차"), ("half", "반차"), ("sick", "병가"), ("other", "기타")]

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        HStack(spacing: 8) {
                            ForEach(types, id: \.0) { t in
                                let sel = type == t.0
                                Button { type = t.0 } label: {
                                    Text(t.1)
                                        .font(.system(size: 13, weight: .heavy))
                                        .foregroundStyle(sel ? .white : BUColor.inkSecondary)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(
                                            sel ? AnyShapeStyle(LEAVE_COLOR) : AnyShapeStyle(BUColor.midnight.opacity(0.05)),
                                            in: RoundedRectangle(cornerRadius: 10)
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        BUCard(.outer) {
                            VStack(spacing: 8) {
                                DatePicker("시작일", selection: $start, displayedComponents: .date)
                                    .environment(\.locale, Locale(identifier: "ko_KR"))
                                DatePicker("종료일", selection: $end, in: start..., displayedComponents: .date)
                                    .environment(\.locale, Locale(identifier: "ko_KR"))
                                TextField("사유 (선택)", text: $reason)
                                    .textFieldStyle(.roundedBorder)
                            }
                        }
                        Button {
                            submitting = true
                            Task {
                                await onSubmit(type, ymd(start), ymd(max(start, end)), reason)
                                submitting = false
                                dismiss()
                            }
                        } label: {
                            Text(submitting ? "신청 중…" : "신청하기")
                                .font(.system(size: 14, weight: .heavy))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .background(LEAVE_COLOR, in: RoundedRectangle(cornerRadius: 12))
                        }
                        .disabled(submitting)
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("연차 · 휴가 신청")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #endif
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

// ═══ 내 근로 권리 (웹 StaffRightsCard.tsx 미러) ═══════════════════════════
//
//  "몰랐다가 서로 얼굴 붉히는 상황" 방지 — 조건 충족 시 직원에게도 자격 표시.
//  금액 "계산기" 아님(퇴직금은 평균임금 기반이라 앱은 추정만) → 자격·근거·기한 안내 +
//  공식 계산기 링크. 판정 로직은 웹 labor-law-checks(checkSeveranceObligation) 동일.
//
private struct StaffRightsCard: View {
    let hourlyWage: Int?
    let hireDate: String?
    let joinedAt: String?
    let weeklyMinutes: Int

    private static let minimumWage2026 = 10_320  // 웹 MINIMUM_WAGE_2026 미러
    private let ok = Color(red: 26 / 255, green: 122 / 255, blue: 54 / 255)     // 자격 충족
    private let warn = Color(red: 182 / 255, green: 76 / 255, blue: 76 / 255)   // 미달 경고
    private let moelSeverance = URL(string: "https://www.moel.go.kr/retirementpayCal.do")!
    private let minwageCalc = URL(string: "https://www.minimumwage.go.kr/")!

    private var weeklyHours: Double { Double(weeklyMinutes) / 60 }
    private var daysSinceHire: Int {
        let base = hireDate ?? joinedAt.map { String($0.prefix(10)) }
        guard let base else { return 0 }
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        guard let d = f.date(from: String(base.prefix(10))) else { return 0 }
        return max(0, Calendar.current.dateComponents([.day], from: d, to: Date()).day ?? 0)
    }
    private var juhyuEligible: Bool { weeklyHours >= 15 }
    // checkSeveranceObligation level 미러: below-15h / eligible(≥365) / approaching(≥305) / not-eligible
    private var severanceEligible: Bool { weeklyHours >= 15 && daysSinceHire >= 365 }
    private var severanceApproaching: Bool { weeklyHours >= 15 && daysSinceHire >= 305 && daysSinceHire < 365 }
    private var belowMinimum: Bool { (hourlyWage ?? 0) > 0 && (hourlyWage ?? 0) < Self.minimumWage2026 }
    private var dDay: Int { max(0, 365 - daysSinceHire) }

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.shield")
                        .font(.system(size: 15, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    Text("내 근로 권리").font(.system(size: 15, weight: .heavy)).foregroundStyle(BUColor.ink)
                }
                if hourlyWage == nil {
                    Text("사장님이 시급을 등록하면 주휴수당·퇴직금 자격이 여기 표시됩니다.")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }

                // ① 주휴수당
                rightRow(
                    title: "주휴수당",
                    badge: juhyuEligible ? "대상" : "비대상",
                    on: juhyuEligible,
                    body: juhyuEligible
                        ? "주 \(Int(weeklyHours))시간 근무 — 매주 개근 시 주휴수당 대상입니다."
                        : "주 \(Int(weeklyHours))시간 — 주 15시간 이상 근무 시 대상이 됩니다.",
                    law: "근로기준법 §55 · 주 15시간↑ + 개근. 정확한 금액은 급여명세서 확인."
                )

                // ② 퇴직금
                rightRow(
                    title: "퇴직금",
                    badge: severanceEligible ? "대상 도달" : (severanceApproaching ? "임박" : "미도달"),
                    on: severanceEligible,
                    body: weeklyHours < 15
                        ? "주 15시간 미만 — 퇴직금 비대상입니다."
                        : (severanceEligible
                            ? "근속 \(daysSinceHire / 30)개월 — 퇴직 시 퇴직금 지급 대상입니다."
                            : "근속 \(daysSinceHire)일 — 1년(365일) 도달 시 대상이 됩니다. D-\(dDay)"),
                    law: "근로자퇴직급여법 §4 · 1년↑ + 주 15시간↑. 사장님은 퇴직 후 14일 이내 지급 의무.",
                    link: (severanceEligible || severanceApproaching) ? (moelSeverance, "고용노동부 퇴직금 계산기") : nil
                )

                // ③ 연차
                rightRow(
                    title: "연차유급휴가",
                    badge: daysSinceHire >= 365 ? "15일 발생" : "1년 미만",
                    on: daysSinceHire >= 365,
                    body: daysSinceHire >= 365
                        ? "근속 1년 이상 — 연차 15일 발생. 미사용분은 수당으로 받을 수 있어요."
                        : "근속 1년 도달 시 연차 15일이 발생합니다. D-\(dDay)",
                    law: "근로기준법 §60 · 상시 5인 이상 사업장 한정 (4인 이하 미적용)."
                )

                // 최저임금 미달 경고
                if belowMinimum {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("⚠ 현재 시급 \((hourlyWage ?? 0).formatted())원 — 2026 최저시급 \(Self.minimumWage2026.formatted())원 미달")
                            .font(.system(size: 12.5, weight: .heavy)).foregroundStyle(warn)
                        Link(destination: minwageCalc) {
                            HStack(spacing: 3) {
                                Text("최저임금 확인").font(.system(size: 11, weight: .semibold))
                                Image(systemName: "arrow.up.right.square").font(.system(size: 10))
                            }.foregroundStyle(BUColor.midnight)
                        }
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(warn.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(warn.opacity(0.22), lineWidth: 1))
                }
            }
        }
    }

    @ViewBuilder
    private func rightRow(title: String, badge: String, on: Bool, body: String, law: String, link: (URL, String)? = nil) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(title).font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                Spacer(minLength: 0)
                Text(badge)
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(on ? ok : BUColor.inkMuted)
                    .padding(.horizontal, 9).padding(.vertical, 2)
                    .background((on ? ok : BUColor.inkMuted).opacity(0.10), in: Capsule())
                    .overlay(Capsule().strokeBorder((on ? ok : BUColor.inkMuted).opacity(0.22), lineWidth: 1))
            }
            Text(body).font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink).lineSpacing(2)
            Text(law).font(.system(size: 11)).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
            if let link {
                Link(destination: link.0) {
                    HStack(spacing: 3) {
                        Text(link.1).font(.system(size: 11, weight: .semibold))
                        Image(systemName: "arrow.up.right.square").font(.system(size: 10))
                    }.foregroundStyle(BUColor.midnight)
                }
                .padding(.top, 2)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background((on ? ok.opacity(0.06) : BUColor.midnight.opacity(0.05)), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(on ? ok.opacity(0.25) : Color.clear, lineWidth: 1))
    }
}
