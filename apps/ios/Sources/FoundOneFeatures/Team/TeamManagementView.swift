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
    @State private var allowances: [TeamAllowanceRequest] = []   // 추가 수당 신청 (2026-07-13)
    @State private var rules: [TeamScheduleRule] = []
    @State private var loadFailed = false
    @State private var showPayrollSheet = false
    /// 직원 상세 시트 (시급·근태·연차 — 2026-07-13)
    @State private var detailMember: TeamMember? = nil

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }
    private var pendingLeaves: [TeamLeaveRequest] { leaves.filter { $0.status == "pending" } }
    private var pendingAllowances: [TeamAllowanceRequest] { allowances.filter { $0.status == "pending" } }

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
                                if !pendingAllowances.isEmpty { allowanceApprovalCard }
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
            .sheet(item: $detailMember) { m in
                StaffDetailSheet(
                    member: m,
                    rules: rules.filter { $0.memberUserId == m.memberUserId },
                    leaves: leaves.filter { $0.memberUserId == m.memberUserId },
                    onWageSaved: { Task { await load() } }
                )
            }
            .task { await load() }
        }
    }

    private func load() async {
        do {
            async let m = repo.members()
            async let l = repo.leaveRequests()
            async let r = repo.scheduleRules()
            async let al = repo.allowanceRequests()
            let (mm, ll, rr, aa) = try await (m, l, r, al)
            members = mm
            leaves = ll
            rules = rr
            allowances = aa
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

    private func allowanceLabel(_ type: String) -> String {
        switch type {
        case "overtime": return "연장근로"
        case "night": return "야간근로"
        case "holiday": return "휴일근로"
        default: return "기타"
        }
    }

    private func minLabel(_ min: Int) -> String {
        let h = min / 60, m = min % 60
        if h > 0 && m > 0 { return "\(h)시간 \(m)분" }
        if h > 0 { return "\(h)시간" }
        return "\(m)분"
    }

    private func mdLabel(_ d: String) -> String {
        let parts = d.split(separator: "-")
        guard parts.count == 3 else { return d }
        return "\(Int(parts[1]) ?? 0)월 \(Int(parts[2]) ?? 0)일"
    }

    // ── 추가 수당 승인 큐 (2026-07-13, 웹 TeamSurface 미러) ──
    private var allowanceApprovalCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "wonsign.circle")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    Text("추가 수당 승인")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("\(pendingAllowances.count)")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 7).padding(.vertical, 2)
                        .background(BUColor.midnight, in: Capsule())
                }
                ForEach(pendingAllowances) { a in
                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(memberName(a.memberUserId)) · \(allowanceLabel(a.allowanceType))")
                                .font(.system(size: 13.5, weight: .heavy))
                                .foregroundStyle(BUColor.ink)
                            Text("\(mdLabel(a.workDate)) · \(minLabel(a.minutes))")
                                .font(.system(size: 12))
                                .foregroundStyle(BUColor.inkSecondary)
                            if let reason = a.reason, !reason.isEmpty {
                                Text(reason).font(.system(size: 11.5)).foregroundStyle(BUColor.inkMuted).lineLimit(1)
                            }
                        }
                        Spacer(minLength: 0)
                        Button {
                            Task { try? await repo.decideAllowance(id: a.id, approved: true); await load() }
                        } label: {
                            Label("승인", systemImage: "checkmark")
                                .font(.system(size: 12.5, weight: .heavy))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 12).padding(.vertical, 7)
                                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 9))
                        }
                        Button {
                            Task { try? await repo.decideAllowance(id: a.id, approved: false); await load() }
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
                Text("연장·야간·휴일근로는 상시 5인 이상 사업장에서 통상임금 50% 가산(근로기준법 §56). 5인 미만은 초과분 시급 지급.")
                    .font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
            }
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
                        do {
                            try await repo.saveRules(memberId: member.memberUserId, weekdays: weekdays, start: start, end: end)
                            await load()
                            return true
                        } catch {
                            return false
                        }
                    },
                    onSetHireDate: { date in
                        Task { try? await repo.setHireDate(memberId: member.memberUserId, date: date); await load() }
                    },
                    onOpenDetail: { detailMember = member }
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

    private func create(invitedEmail: String?) {
        Task {
            status = .loading
            do {
                let newCode = try await repo.createInvite(invitedEmail: invitedEmail)
                code = newCode
                directedEmail = invitedEmail?.contains("@") == true ? invitedEmail?.lowercased() : nil
                status = .ready
                onInviteCreated()
            } catch {
                status = .error
            }
        }
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
                    // 이메일 초대 모드일 때만 입력란 노출 — 버튼 2개는 항상 같은 크기 (2026-07-12 UI 정리, 웹 미러)
                    if showEmailField {
                        TextField("직원 이메일 (그 계정만 수락 가능)", text: $email)
                            .font(.system(size: 13))
                            .textFieldStyle(.roundedBorder)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .autocorrectionDisabled()
                    }
                    HStack(spacing: 8) {
                        Button { create(invitedEmail: nil) } label: {
                            Text(status == .loading && !showEmailField ? "생성 중…" : "+ 초대 링크 생성")
                                .font(.system(size: 13, weight: .heavy))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 11)
                                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)
                        .disabled(status == .loading)

                        Button {
                            if !showEmailField { showEmailField = true; return }
                            if email.contains("@") { create(invitedEmail: email); return }
                            showEmailField = false // 빈 입력 상태에서 다시 누르면 접기
                        } label: {
                            let armed = showEmailField && email.contains("@")
                            Text(status == .loading && showEmailField
                                 ? "생성 중…"
                                 : armed ? "✉ 이 이메일로 초대" : "✉ 이메일로 초대")
                                .font(.system(size: 13, weight: .heavy))
                                .foregroundStyle(armed ? .white : BUColor.midnight)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 11)
                                .background(
                                    armed ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(.white),
                                    in: RoundedRectangle(cornerRadius: 10)
                                )
                                .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .disabled(status == .loading)
                    }
                    if showEmailField {
                        Text("이미 가입한 직원에게 추천 — 그 계정만 수락할 수 있고, 로그인하면 「받은 초대」로 표시됩니다.")
                            .font(.system(size: 11))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(2)
                    }
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
    /// 저장 결과를 반환 — saved/error 상태를 실제 결과로 표시 (optimistic 금지)
    var onSave: (Set<Int>, String, String) async -> Bool
    var onSetHireDate: (String) -> Void
    var onOpenDetail: () -> Void

    // ── 수정/저장 모드 (사장님 데이터 카드 표준 패턴, 2026-07-13 재작성 — 웹 미러) ──
    //   기본 = 읽기 전용 요약. 「수정」 탭 시에만 draft 편집 → 「저장」/「취소」.
    @State private var editing = false
    @State private var days: Set<Int> = []
    // 시간은 네이티브 휠(DatePicker) — 웹도 select 로 통일 (2026-07-13)
    @State private var startTime: Date = Self.time(17, 0)
    @State private var endTime: Date = Self.time(23, 0)
    @State private var hireDatePick = Date()
    @State private var saveStatus: SaveStatus = .idle

    private enum SaveStatus { case idle, saving, saved, error }

    private static func time(_ h: Int, _ m: Int) -> Date {
        Calendar.current.date(bySettingHour: h, minute: m, second: 0, of: Date()) ?? Date()
    }
    private static func parseTime(_ s: String) -> Date? {
        let parts = s.prefix(5).split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return nil }
        return time(parts[0], parts[1])
    }
    private static func formatTime(_ d: Date) -> String {
        let c = Calendar.current.dateComponents([.hour, .minute], from: d)
        return String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
    }

    /// 웹 WEEK_KO 미러 — index = weekday (0=일)
    private static let weekKo = ["일", "월", "화", "수", "목", "금", "토"]

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    // 이름 탭 → 직원 상세(시급·근태) 시트 (2026-07-13, 웹 미러)
                    Button(action: onOpenDetail) {
                        HStack(spacing: 4) {
                            Text(member.name)
                                .font(.system(size: 14, weight: .heavy))
                                .foregroundStyle(BUColor.ink)
                                .underline(true, color: BUColor.midnight.opacity(0.25))
                            Text("상세 ›")
                                .font(.system(size: 10.5, weight: .heavy))
                                .foregroundStyle(BUColor.inkMuted)
                        }
                    }
                    .buttonStyle(.plain)
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
                    if !editing {
                        if saveStatus == .saved {
                            Label("저장됨", systemImage: "checkmark.circle")
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(BUColor.midnight)
                        }
                        Button {
                            startEdit()
                        } label: {
                            Text("수정")
                                .font(.system(size: 12, weight: .heavy))
                                .foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 13).padding(.vertical, 6)
                                .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !editing {
                    // ── 읽기 모드 — 저장된 근무표 요약 ──
                    let savedDays = Set(rules.map(\.weekday))
                    HStack(spacing: 6) {
                        ForEach(0..<7, id: \.self) { wd in
                            let on = savedDays.contains(wd)
                            Text(Self.weekKo[wd])
                                .font(.system(size: 12, weight: .heavy))
                                .foregroundStyle(on ? .white : (wd == 0 ? Color(red: 139/255, green: 127/255, blue: 212/255) : BUColor.inkMuted))
                                .frame(width: 34, height: 34)
                                .background(
                                    on ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(BUColor.midnight.opacity(0.05)),
                                    in: Circle()
                                )
                        }
                    }
                    if let first = rules.first {
                        Text("\(readTimeLabel(first.startTime)) – \(readTimeLabel(first.endTime))\(member.hireDate.map { " · 입사일 \($0)" } ?? "")")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(BUColor.ink)
                    } else {
                        Text("근무표 미설정 — 「수정」을 눌러 요일과 시간을 배정하세요.")
                            .font(.system(size: 12.5))
                            .foregroundStyle(BUColor.inkSecondary)
                    }
                } else {
                    // ── 수정 모드 — draft 편집 + 저장/취소 ──
                    HStack(spacing: 8) {
                        Text("입사일").font(.system(size: 11.5, weight: .heavy)).foregroundStyle(BUColor.inkMuted)
                        DatePicker("", selection: $hireDatePick, displayedComponents: .date)
                            .datePickerStyle(.compact)
                            .labelsHidden()
                            .environment(\.locale, Locale(identifier: "ko_KR"))
                        Spacer(minLength: 0)
                    }

                    // 요일 칩 (0=일 … 6=토)
                    HStack(spacing: 6) {
                        ForEach(0..<7, id: \.self) { wd in
                            let selected = days.contains(wd)
                            Button {
                                if selected { days.remove(wd) } else { days.insert(wd) }
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
                        DatePicker("", selection: $startTime, displayedComponents: .hourAndMinute)
                            .datePickerStyle(.compact)
                            .labelsHidden()
                            .environment(\.locale, Locale(identifier: "ko_KR"))
                        Text("~").foregroundStyle(BUColor.inkMuted)
                        DatePicker("", selection: $endTime, displayedComponents: .hourAndMinute)
                            .datePickerStyle(.compact)
                            .labelsHidden()
                            .environment(\.locale, Locale(identifier: "ko_KR"))
                        Spacer(minLength: 0)
                    }

                    if saveStatus == .error {
                        Text("저장에 실패했어요. 네트워크 확인 후 다시 시도해 주세요.")
                            .font(.system(size: 12))
                            .foregroundStyle(BUColor.danger)
                    }

                    HStack(spacing: 8) {
                        Spacer(minLength: 0)
                        Button {
                            editing = false
                            saveStatus = .idle
                        } label: {
                            Text("취소")
                                .font(.system(size: 12.5, weight: .semibold))
                                .foregroundStyle(BUColor.inkSecondary)
                                .padding(.horizontal, 14).padding(.vertical, 9)
                                .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.midnight.opacity(0.14), lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .disabled(saveStatus == .saving)
                        Button {
                            Task { await commit() }
                        } label: {
                            Text(saveStatus == .saving ? "저장 중…" : "저장")
                                .font(.system(size: 13, weight: .heavy))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 18).padding(.vertical, 9)
                                .background(BUColor.midnight.opacity(saveStatus == .saving ? 0.6 : 1), in: RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)
                        .disabled(saveStatus == .saving || days.isEmpty)
                    }
                }
            }
        }
    }

    private func startEdit() {
        days = Set(rules.map(\.weekday))
        if let first = rules.first {
            if let s = Self.parseTime(first.startTime) { startTime = s }
            if let e = Self.parseTime(first.endTime) { endTime = e }
        }
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
        hireDatePick = member.hireDate.flatMap { f.date(from: $0) } ?? Date()
        saveStatus = .idle
        editing = true
    }

    private func commit() async {
        saveStatus = .saving
        let ok = await onSave(days, Self.formatTime(startTime), Self.formatTime(endTime))
        if ok {
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
            let hire = f.string(from: hireDatePick)
            if hire != member.hireDate { onSetHireDate(hire) }
            saveStatus = .saved
            editing = false
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            if saveStatus == .saved { saveStatus = .idle }
        } else {
            saveStatus = .error
        }
    }

    private func readTimeLabel(_ t: String) -> String {
        let parts = t.prefix(5).split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return String(t.prefix(5)) }
        let h = parts[0], m = parts[1]
        let h12 = h % 12 == 0 ? 12 : h % 12
        return "\(h < 12 ? "오전" : "오후") \(h12):\(String(format: "%02d", m))"
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
