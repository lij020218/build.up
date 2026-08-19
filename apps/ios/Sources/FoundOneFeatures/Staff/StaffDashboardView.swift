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
import FoundOneCore
import FoundOneDesignSystem
import FoundOneData

private let LEAVE_COLOR = Color(red: 139 / 255, green: 127 / 255, blue: 212 / 255) // #8b7fd4

// 근무 해석 SSOT 에 Repository 타입 연결 (로직 중복 0)
extension StaffScheduleException: BUWorkException {}
private let WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"]

/// 재사용 포매터 — 1초 tick·body 마다 DateFormatter() 생성 방지 (성능 2026-08-19).
private enum StaffFormatters {
    static let ymd: DateFormatter = { let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f }()
    static let hm: DateFormatter = { let f = DateFormatter(); f.dateFormat = "HH:mm"; return f }()
    nonisolated(unsafe) static let isoFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f
    }()
    nonisolated(unsafe) static let isoPlain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime]; return f
    }()
}

private func ymd(_ d: Date) -> String { StaffFormatters.ymd.string(from: d) }

/// 특정 날짜의 실제 근무 = 예외행 우선(휴무/다른시간), 없으면 그 요일 반복 규칙 (웹 resolveShift 미러)
// 근무 해석은 BUWorkSchedule SSOT 사용 — 사장 캘린더와 같은 규칙 (FoundOneCore/WorkScheduleResolver)
private func resolveShift(dateStr: String, weekday: Int, rules: [TeamScheduleRule], exceptions: [StaffScheduleException]) -> (start: String, end: String, note: String?)? {
    guard let shift = BUWorkSchedule.resolve(dateStr: dateStr, weekday: weekday, rules: rules, exceptions: exceptions) else { return nil }
    return (shift.startTime, shift.endTime, shift.note)
}

public struct StaffDashboardView: View {

    private let onSignOut: () -> Void

    public init(onSignOut: @escaping () -> Void) {
        self.onSignOut = onSignOut
    }

    @State private var ctx: StaffStoreContext? = nil
    @State private var loading = true
    @State private var loadFailed = false   // 연결 조회 RPC 실패 — "미연결"과 구분 (2026-07-13)
    @State private var rules: [TeamScheduleRule] = []
    @State private var exceptions: [StaffScheduleException] = []
    @State private var monthAtt: [StaffAttendance] = []
    @State private var leaves: [TeamLeaveRequest] = []
    /// 잔여 계산 전용 — 승인된 연차·반차 원장 (표시 목록 myLeaves 는 limit 12 라 세면 안 됨)
    @State private var leaveLedger: [TeamLeaveRequest] = []
    /// 쓰기 실패 안내 (2026-08-01) — 조용한 실패는 결근·중복신청으로 이어진다
    @State private var actionError: String? = nil
    @State private var allowances: [TeamAllowanceRequest] = []   // 추가 수당 신청 (2026-07-13)
    @State private var showAllowanceSheet = false
    @State private var busy = false
    @State private var viewMonth: (y: Int, m: Int) = {
        let c = Calendar.current.dateComponents([.year, .month], from: Date())
        return (c.year ?? 2026, c.month ?? 1)
    }()
    @State private var showLeaveSheet = false
    @State private var showProfileSheet = false   // 내 정보 시트 (2026-07-13)
    @Environment(\.scenePhase) private var scenePhase   // 포그라운드 복귀 재조회 트리거

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }
    private var today: String { ymd(Date()) }
    private var todayAtt: StaffAttendance? { monthAtt.first(where: { $0.workDate == today }) }
    private var todayShift: (start: String, end: String, note: String?)? {
        resolveShift(dateStr: today, weekday: Calendar.current.component(.weekday, from: Date()) - 1,
                     rules: rules, exceptions: exceptions)
    }
    private var workdays: Set<Int> { Set(rules.map(\.weekday)) }
    // 정규 시간 초과 근무 자동 감지 (웹 overtimeCandidates 미러) — 이미 신청한 날짜 제외, 10분↑만
    private var overtimeCandidates: [OvertimeCandidate] {
        let requested = Set(allowances.map(\.workDate))
        let f = StaffFormatters.ymd
        let iso = StaffFormatters.isoFractional
        let isoPlain = StaffFormatters.isoPlain
        func parseClockOut(_ s: String) -> Date? { iso.date(from: s) ?? isoPlain.date(from: s) }
        var out: [OvertimeCandidate] = []
        for a in monthAtt {
            guard let outStr = a.clockOutAt, !requested.contains(a.workDate) else { continue }
            guard let day = f.date(from: a.workDate) else { continue }
            let weekday = Calendar.current.component(.weekday, from: day) - 1
            guard let sched = resolveShift(dateStr: a.workDate, weekday: weekday, rules: rules, exceptions: exceptions) else { continue }
            let ep = sched.end.prefix(5).split(separator: ":").compactMap { Int($0) }
            let sp = sched.start.prefix(5).split(separator: ":").compactMap { Int($0) }
            guard ep.count == 2, sp.count == 2 else { continue }
            var end = Calendar.current.date(bySettingHour: ep[0], minute: ep[1], second: 0, of: day) ?? day
            if ep[0] * 60 + ep[1] <= sp[0] * 60 + sp[1] { end = Calendar.current.date(byAdding: .day, value: 1, to: end) ?? end } // 자정 넘는 야간영업
            guard let clockOut = parseClockOut(outStr) else { continue }
            let otMin = Int(clockOut.timeIntervalSince(end) / 60)
            if otMin >= 10 { out.append(OvertimeCandidate(workDate: a.workDate, minutes: otMin)) }
        }
        return out.sorted { $0.workDate > $1.workDate }
    }
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
                    } else if loadFailed {
                        loadFailedCard
                    } else if let ctx, ctx.connected {
                        if let actionError {
                            Text(actionError)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(BUColor.danger)
                                .padding(11)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(BUColor.danger.opacity(0.06), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                        }
                        headerCard(ctx)
                        StaffTodayCard(
                            shift: todayShift, att: todayAtt, busy: busy,
                            onClockIn: { Task { await clockIn() } },
                            onClockOut: { Task { await clockOut() } }
                        )
                        calendarCard
                        // 다음 달 희망 근무 신청 — 캘린더 바로 뒤 (웹 StaffDashboard 와 같은 순서).
                        //   "동료가 이미 낸 시간을 보면서 조정" 이 핵심이라 같은 화면에 붙여 둔다.
                        ShiftAvailabilityCard(mode: .staff, ownerUserId: ctx.ownerUserId, repo: repo)
                        leaveCard
                        // 내 근로 권리 — 주휴수당·퇴직금·연차 자격 (사장 판정과 동일 SSOT, 2026-07-13)
                        StaffRightsCard(hourlyWage: ctx.hourlyWage, hireDate: ctx.hireDate, joinedAt: ctx.joinedAt, weeklyMinutes: weeklyMinutes)
                        // 추가 수당 신청 — 연장·야간·휴일근로 (2026-07-13)
                        StaffAllowanceCard(
                            allowances: allowances,
                            candidates: overtimeCandidates,
                            onQuickRequest: { c in Task { await submitAllowance(workDate: c.workDate, type: "overtime", minutes: c.minutes, reason: "") } },
                            onOpenForm: { showAllowanceSheet = true },
                            onCancel: { id in Task { await cancelAllowance(id: id) } }
                        )
                        // 급여일 + 미지급 문의 (2026-07-15) — 사장이 급여일을 정했을 때만 노출.
                        //   미설정이면 카드 자체를 숨긴다(추측값 표시 금지 = 가짜 숫자 금지 원칙).
                        if let payday = ctx.paydayDay {
                            StaffPaydayCard(paydayDay: payday) { await reportUnpaid() }
                        }
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
        // 포그라운드 복귀 시 재조회 — staff 테이블(근무표·출퇴근·연차·수당)은 realtime 미구독이라
        //   진입 1회 로드뿐. 웹 포커스 복귀 재조회와 동일 취지 (AppRoot scenePhase 패턴 미러).
        .onChange(of: scenePhase) { oldPhase, newPhase in
            guard newPhase == .active, oldPhase != .active, !loading else { return }
            Task { await load() }
        }
        .onReceive(NotificationCenter.default.publisher(for: .buildupRemoteDataChanged)) { _ in
            Task { await load() }
        }
        .sheet(isPresented: $showLeaveSheet) {
            StaffLeaveSheet { type, start, end, reason in
                guard let owner = ctx?.ownerUserId else { return }
                do {
                    try await repo.submitLeave(ownerUserId: owner, type: type, startDate: start, endDate: end, reason: reason)
                } catch {
                    // 실패를 삼키면 시트가 닫히고 목록이 비어 "신청됐다"고 믿은 채 결근한다
                    actionError = "연차 신청에 실패했어요. 잠시 후 다시 시도해 주세요."
                }
                await load()
            }
        }
        .sheet(isPresented: $showAllowanceSheet) {
            StaffAllowanceSheet { workDate, type, minutes, reason in
                await submitAllowance(workDate: workDate, type: type, minutes: minutes, reason: reason)
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
        loadFailed = false
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
            async let al = repo.myAllowances()
            let (rr, ee, aa, ll, alw) = try await (r, e, a, l, al)
            rules = rr; exceptions = ee; monthAtt = aa; leaves = ll; allowances = alw
            // 잔여 계산은 잘리지 않은 원장으로 (실패해도 화면은 살아 있어야 하므로 try?)
            leaveLedger = (try? await repo.myLeaveLedger()) ?? []
            loading = false
        } catch {
            // staffContext() RPC 실패 = 일시 오류일 수 있음 → "미연결"이 아니라 재시도 상태로.
            //   (2026-07-13 hire_date 컬럼 누락으로 서버엔 연결이 있는데 화면만 끊긴 사고 방지)
            loadFailed = true
            loading = false
        }
    }

    private func clockIn() async {
        guard let owner = ctx?.ownerUserId, !busy else { return }
        busy = true
        defer { busy = false }
        do {
            let rec = try await repo.clockIn(ownerUserId: owner, workDate: today)
            monthAtt.removeAll { $0.workDate == today }
            monthAtt.append(rec)
            actionError = nil
        } catch {
            // 출퇴근은 급여·연장수당 산정의 원천 — 실패를 숨기면 사장 화면엔 "미출근"으로 남는다
            actionError = "출근 기록에 실패했어요. 네트워크 확인 후 다시 눌러주세요."
        }
    }

    private func clockOut() async {
        guard let att = todayAtt, !busy else { return }
        busy = true
        defer { busy = false }
        do {
            try await repo.clockOut(attendanceId: att.id)
            actionError = nil
        } catch {
            actionError = "퇴근 기록에 실패했어요. 네트워크 확인 후 다시 눌러주세요."
        }
        await load()
    }

    // ── 추가 수당 (2026-07-13) ──
    private func submitAllowance(workDate: String, type: String, minutes: Int, reason: String) async {
        guard let owner = ctx?.ownerUserId else { return }
        do {
            let rec = try await repo.submitAllowance(ownerUserId: owner, workDate: workDate, type: type, minutes: minutes, reason: reason)
            allowances.insert(rec, at: 0)
        } catch {
            actionError = "수당 신청에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }

    private func cancelAllowance(id: UUID) async {
        // 🔴 실패해도 제거하면 "취소됨"으로 보이지만 서버엔 남아 승인·급여 반영된다 (2026-08-01)
        do {
            try await repo.cancelAllowance(id: id)
            allowances.removeAll { $0.id == id }
        } catch {
            actionError = "취소에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }

    /// "급여가 안 들어왔어요" — DEFINER RPC 경유(직접 INSERT 정책 없음 = 위조 방지). RPC 가
    ///   사장에게 푸시+인앱 알림까지 보낸다. 같은 달 재문의는 서버가 조용히 성공 처리(스팸 방지).
    private func reportUnpaid() async -> Bool {
        let d = Calendar.current.dateComponents([.year, .month], from: Date())
        let period = String(format: "%04d-%02d", d.year ?? 0, d.month ?? 0)
        return (try? await repo.reportPayrollUnpaid(period: period)) ?? false
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
                // 고용형태 · 직무 (사장 설정, 2026-07-13)
                if ctx.employmentType != nil || !ctx.jobDuties.isEmpty {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 60), spacing: 6)], alignment: .leading, spacing: 6) {
                        if let emp = JobDutyRegistry.employmentLabel(ctx.employmentType, ko: true) {
                            Text(emp).font(.system(size: 11.5, weight: .heavy)).foregroundStyle(.white)
                                .frame(maxWidth: .infinity).padding(.horizontal, 10).padding(.vertical, 5)
                                .background(BUColor.midnight, in: Capsule())
                        }
                        ForEach(ctx.jobDuties, id: \.self) { k in
                            Text(JobDutyRegistry.dutyLabel(k, ko: true)).font(.system(size: 11.5, weight: .semibold)).foregroundStyle(BUColor.midnight).lineLimit(1)
                                .frame(maxWidth: .infinity).padding(.horizontal, 10).padding(.vertical, 5)
                                .background(BUColor.midnight.opacity(0.06), in: Capsule())
                        }
                    }
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
        let f = StaffFormatters.ymd
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
            let f = StaffFormatters.ymd
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

                // 잔여 요약 — 신청 목록보다 먼저 (직원이 가장 궁금한 것). 웹 LeaveCard 미러.
                myLeaveSummary

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

    /// 내 연차 잔여 — 근로기준법 제60조 계산(BUAnnualLeave SSOT).
    /// 5인 미만은 법정 의무가 없어 숫자를 만들지 않고 안내만 한다 (제11조).
    @ViewBuilder
    private var myLeaveSummary: some View {
        let basis = BULeaveBasis(rawValue: ctx?.leaveBasis ?? "") ?? .hireDate
        // 🔴 미상을 0 으로 강등하지 않는다 — "5인 미만 = 연차 없음"이라는 법적 단정이 된다 (2026-08-01)
        let head = ctx?.staffHeadcount
        let calc = BUAnnualLeave.calc(hireDate: ctx?.hireDate, basis: basis, headcount: head ?? 0)
        let range = BUAnnualLeave.yearRange(basis: basis, hireDate: ctx?.hireDate)
        let used = BUAnnualLeave.usedDays(
            leaveLedger.map { (leaveType: $0.leaveType, startDate: $0.startDate, endDate: $0.endDate, status: $0.status) },
            yearStart: range.start, yearEnd: range.end
        )
        let left = BUAnnualLeave.remaining(granted: calc.days, used: used)

        VStack(alignment: .leading, spacing: 6) {
            if head == nil {
                Text("직원 수를 불러오지 못해 연차 일수를 계산할 수 없어요. 잠시 후 다시 열어보시거나 사장님께 문의해 주세요.")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            } else if calc.statutory && calc.days > 0 {
                HStack(alignment: .firstTextBaseline, spacing: 7) {
                    Text(leaveNum(left) + "일")
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundStyle(LEAVE_COLOR)
                        .monospacedDigit()
                    Text("남았어요")
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                    Text("올해 \(calc.days)일 중 \(leaveNum(used))일 사용")
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .monospacedDigit()
                    Text("예상")
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundStyle(BUColor.inkSecondary)
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(Color.black.opacity(0.06), in: Capsule())
                    Spacer(minLength: 0)
                }
            }
            Text(calc.basisNoteKo)
                .font(.system(size: 11))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(LEAVE_COLOR.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func leaveNum(_ v: Double) -> String {
        v == v.rounded() ? String(Int(v)) : String(format: "%.1f", v)
    }

    private func leaveLabel(_ t: String) -> String {
        switch t { case "annual": return "연차"; case "half": return "반차"; case "sick": return "병가"; default: return "기타" }
    }
    private func statusLabel(_ s: String) -> String {
        switch s { case "approved": return "승인"; case "rejected": return "반려"; default: return "대기" }
    }


    // 연결 조회 RPC 실패 — "미연결"과 구분해 재시도 유도(서버엔 연결이 있어도 일시 오류일 수 있음).
    private var loadFailedCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text("FOUND.ONE · 직원").font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.inkMuted).textCase(.uppercase).tracking(0.5)
                Text("연결 정보를 불러오지 못했어요").font(.system(size: 17, weight: .heavy)).foregroundStyle(BUColor.ink)
                Text("일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요. 연결은 그대로 유지됩니다.")
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                HStack(spacing: 8) {
                    Button { Task { loading = true; await load() } } label: {
                        Label("다시 시도", systemImage: "arrow.clockwise")
                            .font(.system(size: 13, weight: .heavy)).foregroundStyle(.white)
                            .padding(.horizontal, 16).padding(.vertical, 10)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                    Button(action: onSignOut) {
                        Label("로그아웃", systemImage: "rectangle.portrait.and.arrow.right")
                            .font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.inkSecondary)
                            .padding(.horizontal, 16).padding(.vertical, 10)
                            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.midnight.opacity(0.14), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
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
    private func hm(_ d: Date) -> String { StaffFormatters.hm.string(from: d) }
    private func timeToday(_ t: String, base: Date) -> Date? {
        let parts = t.split(separator: ":").compactMap { Int($0) }
        guard parts.count >= 2 else { return nil }
        return Calendar.current.date(bySettingHour: parts[0], minute: parts[1], second: 0, of: base)
    }
    private func isoDate(_ s: String) -> Date? {
        StaffFormatters.isoFractional.date(from: s) ?? StaffFormatters.isoPlain.date(from: s)
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
                BUFlatBackground()
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
        let f = StaffFormatters.ymd
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

// ═══ 추가 수당 신청 (웹 StaffAllowanceCard.tsx 미러) ═══════════════════════
//
//  정규 시간 초과 근무 자동 감지 → 원탭 신청. 야간·휴일은 직접 신청 폼.
//  냉정 리뷰: 가산 50%(§56)는 상시 5인 이상만 의무 → 금액 아닌 시간·유형만 신청.
//
struct OvertimeCandidate: Identifiable {
    let workDate: String
    let minutes: Int
    var id: String { workDate }
}

private func allowanceTypeLabel(_ t: String) -> String {
    switch t { case "overtime": return "연장근로"; case "night": return "야간근로"; case "holiday": return "휴일근로"; default: return "기타" }
}
private func minsLabel(_ min: Int) -> String {
    let h = min / 60, m = min % 60
    if h > 0 && m > 0 { return "\(h)시간 \(m)분" }
    if h > 0 { return "\(h)시간" }
    return "\(m)분"
}
private func mdShort(_ d: String) -> String {
    let p = d.split(separator: "-")
    guard p.count == 3 else { return d }
    return "\(Int(p[1]) ?? 0)월 \(Int(p[2]) ?? 0)일"
}

private struct StaffAllowanceCard: View {
    let allowances: [TeamAllowanceRequest]
    let candidates: [OvertimeCandidate]
    let onQuickRequest: (OvertimeCandidate) -> Void
    let onOpenForm: () -> Void
    let onCancel: (UUID) -> Void

    private let ok = Color(red: 26 / 255, green: 122 / 255, blue: 54 / 255)

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "wonsign.circle").font(.system(size: 15, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    Text("추가 수당 신청").font(.system(size: 15, weight: .heavy)).foregroundStyle(BUColor.ink)
                    Spacer(minLength: 0)
                    Button(action: onOpenForm) {
                        Label("직접 신청", systemImage: "plus")
                            .font(.system(size: 12, weight: .heavy)).foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }

                // ① 자동 감지 연장근로
                if !candidates.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("정규 시간을 초과한 근무가 있어요", systemImage: "clock")
                            .font(.system(size: 12.5, weight: .heavy)).foregroundStyle(LEAVE_COLOR)
                        ForEach(candidates) { c in
                            HStack(spacing: 10) {
                                Text(mdShort(c.workDate)).font(.system(size: 12.5, weight: .heavy)).foregroundStyle(BUColor.ink)
                                Text("연장 \(minsLabel(c.minutes))").font(.system(size: 12.5, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                Spacer(minLength: 0)
                                Button { onQuickRequest(c) } label: {
                                    Text("신청").font(.system(size: 12, weight: .heavy)).foregroundStyle(.white)
                                        .padding(.horizontal, 14).padding(.vertical, 6)
                                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 9))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(10)
                            .background(LEAVE_COLOR.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(LEAVE_COLOR.opacity(0.22), lineWidth: 1))
                        }
                    }
                }

                // ② 내 신청 목록
                if !allowances.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(allowances) { a in
                            HStack(spacing: 8) {
                                Text(allowanceTypeLabel(a.allowanceType))
                                    .font(.system(size: 11, weight: .heavy)).foregroundStyle(.white)
                                    .padding(.horizontal, 8).padding(.vertical, 3)
                                    .background(a.allowanceType == "night" ? LEAVE_COLOR : BUColor.midnight, in: Capsule())
                                Text("\(mdShort(a.workDate)) · \(minsLabel(a.minutes))")
                                    .font(.system(size: 12.5, weight: .semibold)).foregroundStyle(BUColor.ink)
                                Spacer(minLength: 0)
                                Text(a.status == "approved" ? "승인" : a.status == "rejected" ? "반려" : "대기")
                                    .font(.system(size: 11, weight: .heavy))
                                    .foregroundStyle(a.status == "approved" ? Color.white : BUColor.inkSecondary)
                                    .padding(.horizontal, 8).padding(.vertical, 3)
                                    .background(a.status == "approved" ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.midnight.opacity(0.07)), in: Capsule())
                                if a.status == "pending" {
                                    Button { onCancel(a.id) } label: {
                                        Image(systemName: "xmark").font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.inkMuted).padding(5)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.vertical, 2)
                        }
                    }
                }

                if candidates.isEmpty && allowances.isEmpty {
                    Text("연장·야간·휴일 근로가 있으면 여기서 신청하세요. 정규 시간을 초과해 근무하면 자동으로 감지됩니다.")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }

                Text("연장·야간·휴일근로는 상시 5인 이상 사업장에서 통상임금 50% 가산(근로기준법 §56). 5인 미만은 초과 시간분 시급 지급. 정확한 금액은 사장님과 확인하세요.")
                    .font(.system(size: 11)).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
            }
        }
    }
}

// ═══ 추가 수당 신청 시트 (직접 신청 — 유형·날짜·시간·사유) ══════════════════
private struct StaffAllowanceSheet: View {
    @Environment(\.dismiss) private var dismiss
    var onSubmit: (_ workDate: String, _ type: String, _ minutes: Int, _ reason: String) async -> Void

    @State private var type = "overtime"
    @State private var date = Date()
    @State private var hours = 1
    @State private var mins = 0
    @State private var reason = ""
    @State private var submitting = false

    private let types: [(String, String)] = [("overtime", "연장근로"), ("night", "야간근로"), ("holiday", "휴일근로"), ("other", "기타")]
    private var totalMin: Int { max(0, hours * 60 + mins) }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUFlatBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        HStack(spacing: 8) {
                            ForEach(types, id: \.0) { t in
                                let sel = type == t.0
                                Button { type = t.0 } label: {
                                    Text(t.1)
                                        .font(.system(size: 12.5, weight: .heavy))
                                        .foregroundStyle(sel ? .white : BUColor.inkSecondary)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(sel ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.midnight.opacity(0.05)), in: RoundedRectangle(cornerRadius: 10))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        BUCard(.outer) {
                            VStack(spacing: 12) {
                                DatePicker("근무일", selection: $date, in: ...Date(), displayedComponents: .date)
                                    .environment(\.locale, Locale(identifier: "ko_KR"))
                                HStack {
                                    Text("추가 근로시간").font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.ink)
                                    Spacer()
                                    Picker("시간", selection: $hours) {
                                        ForEach(0..<13, id: \.self) { Text("\($0)시간").tag($0) }
                                    }.pickerStyle(.menu).tint(BUColor.midnight)
                                    Picker("분", selection: $mins) {
                                        ForEach([0, 10, 15, 20, 30, 40, 45, 50], id: \.self) { Text("\($0)분").tag($0) }
                                    }.pickerStyle(.menu).tint(BUColor.midnight)
                                }
                                TextField("사유 (선택)", text: $reason).textFieldStyle(.roundedBorder)
                            }
                        }
                        Button {
                            submitting = true
                            Task {
                                let f = StaffFormatters.ymd
                                await onSubmit(f.string(from: date), type, totalMin, reason)
                                submitting = false
                                dismiss()
                            }
                        } label: {
                            Text(submitting ? "신청 중…" : "신청하기")
                                .font(.system(size: 14, weight: .heavy)).foregroundStyle(.white)
                                .frame(maxWidth: .infinity).padding(.vertical, 13)
                                .background(totalMin > 0 ? BUColor.midnight : BUColor.midnight.opacity(0.3), in: RoundedRectangle(cornerRadius: 12))
                        }
                        .disabled(submitting || totalMin <= 0)
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("추가 수당 신청")
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

/// 급여일 카드 (직원) — 웹 StaffPaydayCard 미러.
///   급여일 당일·경과에만 "안 들어왔어요" 노출(그 전엔 보낼 이유가 없다).
///   문의는 같은 달 1회 — 서버 UNIQUE 가 막고 duplicate 를 조용히 성공 처리하므로
///   사용자에겐 항상 '전달됨' 으로 보인다.
struct StaffPaydayCard: View {
    let paydayDay: Int
    let onReportUnpaid: () async -> Bool

    enum SendState { case idle, sending, sent, failed }
    @State private var state: SendState = .idle

    /// 이번 달 실제 급여일 — 31일 설정인데 2월이면 28일(서버 cron 의 LEAST 보정과 동일 규칙).
    private var effectivePayday: Int {
        let range = Calendar.current.range(of: .day, in: .month, for: Date())?.count ?? 31
        return min(paydayDay, range)
    }

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Label("급여일", systemImage: "wonsign.circle")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                    Spacer()
                    Text(effectivePayday != paydayDay
                         ? "매월 \(paydayDay)일 · 이번 달 \(effectivePayday)일"
                         : "매월 \(paydayDay)일")
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                }

                if Calendar.current.component(.day, from: Date()) < effectivePayday {
                    Text("이번 달 급여일은 \(effectivePayday)일이에요.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.inkSecondary)
                } else if state == .sent {
                    Text("✓ 사장님께 전달했어요. 확인하시면 연락이 올 거예요.")
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    Text("급여가 아직 안 들어왔다면 사장님께 알릴 수 있어요.")
                        .font(.system(size: 12.5))
                        .foregroundStyle(BUColor.inkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                    Button {
                        Task {
                            state = .sending
                            let ok = await onReportUnpaid()
                            state = ok ? .sent : .failed
                        }
                    } label: {
                        Text(state == .sending ? "보내는 중…" : "급여가 안 들어왔어요")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 16).padding(.vertical, 9)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(state == .sending)
                    .opacity(state == .sending ? 0.5 : 1)
                    if state == .failed {
                        Text("전달에 실패했어요. 잠시 후 다시 시도해 주세요.")
                            .font(.system(size: 11.5))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                }
            }
        }
    }
}
