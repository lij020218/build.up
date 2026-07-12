//
//  TeamManagementView.swift — 사장용 직원 관리 (초대·연차 승인·근무표) (2026-07-12)
//
//  웹 SSOT 미러: apps/web/app/lib/components/surfaces/TeamSurface.tsx
//               + components/InviteLinkSection.tsx (초대 3경로: 링크/코드/이메일 지정)
//  데이터 계층: FoundOneData/TeamRepository (RPC get_store_members 등 — iOS 첫 RPC 도입)
//  셸 관례:   TeamManagementSheet (NavigationStack + BUBackgroundSurface + BUCard(.outer))
//
//  ⚠️ 수동 급여 명단(user_store_data.employees, 인건비 계산)과 초대 직원(store_members)은
//    별개 모집단 — 하단 「급여·인건비 명단」 버튼으로 기존 TeamManagementSheet 연결.
//

import SwiftUI
import FoundOneCore
import FoundOneDesignSystem
import FoundOneData

public struct TeamManagementView: View {

    @Environment(\.dismiss) private var dismiss

    /// sheet 로 띄울 때만 true — 닫기 버튼 노출.
    private let isSheet: Bool
    /// 수동 급여 명단(TeamManagementSheet) 연결용 — 없으면 버튼 숨김.
    private let storeInfoStore: StoreInfoStore?

    public init(isSheet: Bool = false, storeInfoStore: StoreInfoStore? = nil) {
        self.isSheet = isSheet
        self.storeInfoStore = storeInfoStore
    }

    // ── 데이터 상태 ──
    @State private var members: [TeamMember]? = nil     // nil = 로딩 전
    @State private var leaves: [TeamLeaveRequest] = []
    @State private var rules: [TeamScheduleRule] = []
    @State private var loadFailed = false
    @State private var showPayrollSheet = false

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }
    private var pendingLeaves: [TeamLeaveRequest] { leaves.filter { $0.status == "pending" } }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        headerBlock

                        if let members {
                            if members.isEmpty {
                                emptyState
                            } else {
                                if !pendingLeaves.isEmpty { leaveApprovalCard }
                                memberScheduleList(members)
                            }
                        } else if loadFailed {
                            loadErrorCard
                        } else {
                            ProgressView().frame(maxWidth: .infinity).padding(.vertical, 30)
                        }

                        // 직원 추가 초대 — 웹 TeamSurface 하단 「직원 추가」 섹션 미러
                        InviteCreateCard(onInviteCreated: { Task { await load() } })

                        if storeInfoStore != nil { payrollLinkCard }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("직원 관리")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                if isSheet {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                    }
                }
                #endif
            }
            .sheet(isPresented: $showPayrollSheet) {
                if let si = storeInfoStore { TeamManagementSheet(storeInfoStore: si) }
            }
            .task { await load() }
        }
    }

    private func load() async {
        do {
            async let m = repo.members()
            async let l = repo.leaveRequests()
            async let r = repo.scheduleRules()
            let (mm, ll, rr) = try await (m, l, r)
            members = mm
            leaves = ll
            rules = rr
            loadFailed = false
        } catch {
            if members == nil { loadFailed = true }
        }
    }

    // ── 헤더 ──
    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("FOUND.ONE · 직원 관리")
                .font(.system(size: 11, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.5)
            Text("근무표 · 연차 관리")
                .font(.system(size: 19, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            Text("직원별 근무 요일·시간을 정하고, 연차 신청을 승인/반려하세요. 여기서 정한 근무표는 직원 화면에 그대로 표시됩니다.")
                .font(.system(size: 12.5))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(3)
                .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // ── 빈 상태 (웹 미러: 초대 유도) ──
    private var emptyState: some View {
        BUCard(.outer) {
            VStack(spacing: 10) {
                Image(systemName: "person.badge.plus")
                    .font(.system(size: 30, weight: .light))
                    .foregroundStyle(BUColor.inkMuted)
                Text("아직 연결된 직원이 없어요")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("아래에서 초대를 만들어 직원에게 보내세요.\n직원이 연결되면 여기서 근무표·연차·출퇴근을 관리할 수 있어요.")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    private var loadErrorCard: some View {
        BUCard(.outer) {
            Text("직원 목록을 불러오지 못했어요. 네트워크 확인 후 다시 열어주세요.")
                .font(.system(size: 13))
                .foregroundStyle(BUColor.inkSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
        }
    }

    // ── 연차 승인 큐 ──
    private var leaveApprovalCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "clock.badge.checkmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    Text("연차·휴가 승인")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("\(pendingLeaves.count)")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(BUColor.midnight, in: Capsule())
                }
                ForEach(pendingLeaves) { leave in
                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(memberName(leave.memberUserId)) · \(leaveLabel(leave.leaveType))")
                                .font(.system(size: 13.5, weight: .heavy))
                                .foregroundStyle(BUColor.ink)
                            Text(leave.startDate == leave.endDate ? leave.startDate : "\(leave.startDate) ~ \(leave.endDate)")
                                .font(.system(size: 12))
                                .foregroundStyle(BUColor.inkSecondary)
                            if let reason = leave.reason, !reason.isEmpty {
                                Text(reason).font(.system(size: 11.5)).foregroundStyle(BUColor.inkMuted).lineLimit(1)
                            }
                        }
                        Spacer(minLength: 0)
                        Button {
                            Task { try? await repo.decideLeave(id: leave.id, approved: true); await load() }
                        } label: {
                            Label("승인", systemImage: "checkmark")
                                .font(.system(size: 12.5, weight: .heavy))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 12).padding(.vertical, 7)
                                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 9))
                        }
                        Button {
                            Task { try? await repo.decideLeave(id: leave.id, approved: false); await load() }
                        } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 12.5, weight: .heavy))
                                .foregroundStyle(BUColor.inkSecondary)
                                .padding(8)
                                .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 9))
                        }
                    }
                    .padding(10)
                    .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }

    private func memberName(_ id: UUID) -> String {
        members?.first(where: { $0.memberUserId == id })?.name ?? "직원"
    }

    private func leaveLabel(_ type: String) -> String {
        switch type {
        case "annual": return "연차"
        case "half": return "반차"
        case "sick": return "병가"
        default: return "휴가"
        }
    }

    // ── 직원별 근무표 배정 ──
    private func memberScheduleList(_ members: [TeamMember]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "calendar.badge.clock")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                Text("근무표 배정")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
            }
            ForEach(members) { member in
                MemberScheduleCard(
                    member: member,
                    rules: rules.filter { $0.memberUserId == member.memberUserId },
                    onSave: { weekdays, start, end in
                        Task {
                            try? await repo.saveRules(memberId: member.memberUserId, weekdays: weekdays, start: start, end: end)
                            await load()
                        }
                    },
                    onSetHireDate: { date in
                        Task { try? await repo.setHireDate(memberId: member.memberUserId, date: date); await load() }
                    }
                )
            }
        }
    }

    // ── 수동 급여 명단 연결 (별개 모집단 안내) ──
    private var payrollLinkCard: some View {
        Button { showPayrollSheet = true } label: {
            BUCard(.outer) {
                HStack(spacing: 10) {
                    Image(systemName: "wonsign.circle")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("급여·인건비 명단 (수동 입력)")
                            .font(.system(size: 13.5, weight: .heavy))
                            .foregroundStyle(BUColor.ink)
                        Text("월 인건비·4대보험 계산용 직원 명단은 여기서 관리해요")
                            .font(.system(size: 11.5))
                            .foregroundStyle(BUColor.inkSecondary)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

// ─── 초대 생성 카드 (웹 InviteLinkSection 미러) ────────────────────────

private struct InviteCreateCard: View {
    var onInviteCreated: () -> Void

    @State private var status: InviteStatus = .idle
    @State private var code: String? = nil
    @State private var directedEmail: String? = nil
    @State private var showEmailField = false
    @State private var email = ""
    @State private var copied = false

    private enum InviteStatus { case idle, loading, ready, error }

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }
    private var inviteUrl: String {
        guard let code else { return "" }
        return "\(BUSupabase.shared.env.webAppURL)/invite/\(code)"
    }

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    Text("직원 추가")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                }
                Text("직원이 링크를 열거나, 이미 Found.One 회원이면 내 정보 › 가게 연결에서 코드만 입력해도 연결됩니다. 7일간 유효, 1회 사용.")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)

                if status != .ready {
                    if showEmailField {
                        TextField("직원 이메일 (그 계정만 수락 가능)", text: $email)
                            .font(.system(size: 13))
                            .textFieldStyle(.roundedBorder)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .autocorrectionDisabled()
                    } else {
                        Button { showEmailField = true } label: {
                            Text("+ 이메일로 지정 초대 (이미 가입한 직원에게 추천)")
                                .font(.system(size: 11.5, weight: .semibold))
                                .foregroundStyle(BUColor.midnight)
                        }
                        .buttonStyle(.plain)
                    }
                    Button {
                        Task {
                            status = .loading
                            do {
                                let newCode = try await repo.createInvite(invitedEmail: showEmailField ? email : nil)
                                code = newCode
                                directedEmail = (showEmailField && email.contains("@")) ? email.lowercased() : nil
                                status = .ready
                                onInviteCreated()
                            } catch {
                                status = .error
                            }
                        }
                    } label: {
                        Text(status == .loading ? "생성 중…" : "+ 새 초대 생성")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 11)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(status == .loading)
                    if status == .error {
                        Text("초대 생성에 실패했어요. 네트워크 확인 후 다시 시도해 주세요.")
                            .font(.system(size: 12))
                            .foregroundStyle(BUColor.danger)
                    }
                } else if let readyCode = code {
                    // 코드 크게 + 링크 공유/복사
                    HStack(spacing: 8) {
                        Text("초대 코드")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                        Text(readyCode)
                            .font(.system(size: 17, weight: .heavy, design: .monospaced))
                            .tracking(2)
                            .foregroundStyle(BUColor.ink)
                        Spacer(minLength: 0)
                    }
                    .padding(10)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10))

                    HStack(spacing: 8) {
                        ShareLink(item: URL(string: inviteUrl) ?? URL(string: "https://foundone.dev")!) {
                            Label("링크 공유", systemImage: "square.and.arrow.up")
                                .font(.system(size: 12.5, weight: .heavy))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                        }
                        Button {
                            UIPasteboard.general.string = inviteUrl
                            copied = true
                            Task { try? await Task.sleep(nanoseconds: 1_800_000_000); copied = false }
                        } label: {
                            Label(copied ? "복사됨" : "복사", systemImage: copied ? "checkmark" : "doc.on.doc")
                                .font(.system(size: 12.5, weight: .heavy))
                                .foregroundStyle(copied ? .white : BUColor.midnight)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(
                                    copied ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.midnight.opacity(0.07)),
                                    in: RoundedRectangle(cornerRadius: 10)
                                )
                        }
                    }

                    Text(directedEmail != nil
                         ? "\(directedEmail!) 계정만 수락할 수 있어요. 해당 직원이 로그인하면 「받은 초대」에도 표시됩니다."
                         : "링크를 카톡·문자로 보내거나, 코드만 불러줘도 돼요 — 직원이 내 정보 › 가게 연결에서 입력하면 연결됩니다.")
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineSpacing(2)

                    Button {
                        code = nil; directedEmail = nil; email = ""; showEmailField = false; status = .idle
                    } label: {
                        Text("다른 직원용 새 초대 생성")
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// ─── 직원별 근무표 카드 (웹 MemberScheduleEditor 미러) ─────────────────

private struct MemberScheduleCard: View {
    let member: TeamMember
    let rules: [TeamScheduleRule]
    var onSave: (Set<Int>, String, String) -> Void
    var onSetHireDate: (String) -> Void

    @State private var days: Set<Int> = []
    @State private var start = "09:00"
    @State private var end = "18:00"
    @State private var editingHireDate = false
    @State private var hireDatePick = Date()
    @State private var saved = false

    /// 웹 WEEK_KO 미러 — index = weekday (0=일)
    private static let weekKo = ["일", "월", "화", "수", "목", "금", "토"]

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Text(member.name)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text(member.role == "manager" ? "매니저" : "직원")
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(BUColor.midnight.opacity(0.07), in: Capsule())
                    if let tenure = tenureDays {
                        Text("근속 \(tenure)일차")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer(minLength: 0)
                    Button {
                        editingHireDate.toggle()
                    } label: {
                        Text(member.hireDate ?? "입사일 지정")
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundStyle(BUColor.inkSecondary)
                    }
                    .buttonStyle(.plain)
                }

                if editingHireDate {
                    HStack(spacing: 8) {
                        DatePicker("", selection: $hireDatePick, displayedComponents: .date)
                            .datePickerStyle(.compact)
                            .labelsHidden()
                            .environment(\.locale, Locale(identifier: "ko_KR"))
                        Button("저장") {
                            let fmt = DateFormatter()
                            fmt.dateFormat = "yyyy-MM-dd"
                            onSetHireDate(fmt.string(from: hireDatePick))
                            editingHireDate = false
                        }
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                    }
                }

                // 요일 칩 (0=일 … 6=토)
                HStack(spacing: 6) {
                    ForEach(0..<7, id: \.self) { wd in
                        let selected = days.contains(wd)
                        Button {
                            if selected { days.remove(wd) } else { days.insert(wd) }
                            saved = false
                        } label: {
                            Text(Self.weekKo[wd])
                                .font(.system(size: 12, weight: .heavy))
                                .foregroundStyle(selected ? .white : BUColor.inkSecondary)
                                .frame(width: 34, height: 34)
                                .background(
                                    selected ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.midnight.opacity(0.05)),
                                    in: Circle()
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }

                HStack(spacing: 8) {
                    TextField("09:00", text: $start)
                        .font(.system(size: 13, design: .monospaced))
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 76)
                    Text("~").foregroundStyle(BUColor.inkMuted)
                    TextField("18:00", text: $end)
                        .font(.system(size: 13, design: .monospaced))
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 76)
                    Spacer(minLength: 0)
                    Button {
                        onSave(days, start, end)
                        saved = true
                    } label: {
                        Text(saved ? "저장됨" : "근무표 저장")
                            .font(.system(size: 12.5, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(saved ? BUColor.midnight.opacity(0.5) : BUColor.midnight, in: RoundedRectangle(cornerRadius: 9))
                    }
                    .disabled(days.isEmpty)
                }
            }
        }
        .onAppear { syncFromRules() }
        .onChange(of: rules) { _, _ in syncFromRules() }
    }

    private func syncFromRules() {
        days = Set(rules.map(\.weekday))
        if let first = rules.first {
            start = String(first.startTime.prefix(5))
            end = String(first.endTime.prefix(5))
        }
    }

    private var tenureDays: Int? {
        let base = member.hireDate ?? member.joinedAt.map { String($0.prefix(10)) }
        guard let base else { return nil }
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        guard let d = fmt.date(from: String(base.prefix(10))) else { return nil }
        let days = Calendar.current.dateComponents([.day], from: d, to: Date()).day ?? 0
        return max(1, days + 1) // 입사일 = 1일차 (웹 tenureDays 미러)
    }
}
