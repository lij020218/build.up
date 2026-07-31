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
    @Environment(\.scenePhase) private var scenePhase   // 포그라운드 복귀 재조회 트리거

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
    /// 연차 부여 기준 (2026-07-28) — 사장이 버튼 선택. 일수는 근로기준법 제60조 계산
    @State private var leaveBasis: BULeaveBasis = .hireDate
    @State private var leaves: [TeamLeaveRequest] = []
    /// 연차 잔여 계산 전용 — 승인된 연차·반차 원장 (목록과 달리 limit 로 잘리지 않는다)
    @State private var leaveLedger: [TeamLeaveRequest] = []
    /// 로그인한 사장 자신의 id — 희망 근무 취합이 owner_user_id 로 쓴다
    @State private var ownerId: UUID? = nil
    @State private var allowances: [TeamAllowanceRequest] = []   // 추가 수당 신청 (2026-07-13)
    @State private var todayAtt: [OwnerTodayAttendance] = []     // 오늘 출퇴근 — 직원별 출근여부 배지 (2026-07-14)
    @State private var rules: [TeamScheduleRule] = []
    @State private var categoryId: String? = nil   // 직무 목록 업종 분기 (2026-07-13)
    @State private var loadFailed = false
    @State private var showPayrollSheet = false
    @State private var showDaangnGuide = false   // 당근 구인 가이드 시트 (2026-07-25, 웹 showDaangnGuide 미러)
    // 급여일 (2026-07-15, 웹 TeamSurface 미러) — paidThisMonth: true=보냄 / false=아직 / nil=무응답
    @State private var paydayDay: Int? = nil
    @State private var paidThisMonth: Bool? = nil
    @State private var savingPayroll = false
    @State private var editingPayday = false
    /// 직원 상세 시트 (시급·근태·연차 — 2026-07-13)
    @State private var detailMember: TeamMember? = nil

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }
    private var pendingLeaves: [TeamLeaveRequest] { leaves.filter { $0.status == "pending" } }
    private var pendingAllowances: [TeamAllowanceRequest] { allowances.filter { $0.status == "pending" } }
    /// 재직자 — 퇴사자는 근무표 대상이 아니다(웹과 동일).
    private var activeMembers: [TeamMember] { (members ?? []).filter { !$0.hasLeft } }
    /// 퇴사·미정산자. 정산 완료하면 RPC 가 안 내려줘 자동으로 사라진다.
    private var leavers: [TeamMember] { (members ?? []).filter { $0.hasLeft } }

    /// 급여 기간 키 'YYYY-MM' — 서버 cron·웹과 동일 형식이어야 재알림이 멈춘다.
    private var currentPeriod: String {
        let d = Calendar.current.dateComponents([.year, .month], from: Date())
        return String(format: "%04d-%02d", d.year ?? 0, d.month ?? 0)
    }
    /// 이번 달 실제 급여일 — 31일 설정인데 2월이면 28일(서버 cron 의 LEAST 보정과 동일 규칙).
    private func effectivePayday(_ day: Int) -> Int {
        let cal = Calendar.current
        let range = cal.range(of: .day, in: .month, for: Date())?.count ?? 31
        return min(day, range)
    }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        headerBlock

                        // 구인구직 바로가기 — 직원이 없거나 더 필요할 때의 다음 행동
                        // (2026-07-24 사장님 지시, 웹 TeamSurface 정합. URL 공식 도메인만)
                        // ⚠️ SSOT = packages/shared/src/team/hiring-channels.ts HIRING_QUICK_CHANNELS —
                        //    목록·순서·배지 1:1 수동 미러. 드리프트는 hiring-channels-ios-sync.test.ts 가 차단.
                        // 2026-07-25: 당근알바 추가(2순위) + "당근으로 구하는 법" 가이드 시트.
                        BUQuickLinksCard(
                            title: "직원 구인 바로가기",
                            caption: "공고 등록·지원자 관리는 각 사이트에서 하세요.",
                            links: [
                                BUQuickLink(label: "알바몬", url: "https://www.albamon.com"),
                                BUQuickLink(label: "당근알바", url: "https://www.daangn.com/kr/jobs/", badge: "동네 기반"),
                                BUQuickLink(label: "알바천국", url: "https://www.alba.co.kr"),
                                BUQuickLink(label: "사람인", url: "https://www.saramin.co.kr"),
                                BUQuickLink(label: "잡코리아", url: "https://www.jobkorea.co.kr"),
                                BUQuickLink(label: "고용24", url: "https://www.work24.go.kr", badge: "정부·무료"),
                            ],
                            actionLabel: "당근으로 구하는 법 →",
                            onAction: { showDaangnGuide = true }
                        )

                        if let members {
                            if members.isEmpty {
                                emptyState
                            } else {
                                // 시간에 걸린 액션이라 맨 위 (웹 TeamSurface 와 동일 순서)
                                paydayCard
                                if !leavers.isEmpty { offboardingCard }
                                if !pendingLeaves.isEmpty { leaveApprovalCard }
                                if !pendingAllowances.isEmpty { allowanceApprovalCard }
                                // 연차 관리 — 법정 일수(제60조) + 직원별 잔여 (웹 TeamSurface 미러)
                                AnnualLeaveCard(
                                    members: activeMembers,
                                    leaves: leaveLedger,
                                    basis: leaveBasis,
                                    onChangeBasis: { b in
                                        let prev = leaveBasis
                                        leaveBasis = b
                                        Task {
                                            do { try await repo.setLeaveBasis(b.rawValue) }
                                            catch { leaveBasis = prev }   // 실패 시 되돌림
                                        }
                                    }
                                )
                                // 근무 캘린더 — 어느 날 누가 나오는지 (웹 TeamSurface 미러).
                                //   배정 편집보다 앞 — 현황 파악이 편집보다 먼저.
                                OwnerShiftCalendarCard(members: activeMembers, rules: rules, repo: repo)

                                // 희망 근무 취합 — 확정 캘린더 뒤, 배정 편집 앞 (웹 TeamSurface 와 같은 순서)
                                ShiftAvailabilityCard(mode: .owner, ownerUserId: ownerId, repo: repo)
                                memberScheduleList(activeMembers)
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
            .sheet(isPresented: $showDaangnGuide) {
                DaangnHiringGuideSheet()
            }
            .sheet(item: $detailMember) { m in
                StaffDetailSheet(
                    member: m,
                    rules: rules.filter { $0.memberUserId == m.memberUserId },
                    leaves: leaves.filter { $0.memberUserId == m.memberUserId },
                    categoryId: categoryId,
                    onWageSaved: { Task { await load() } },
                    onJobSaved: { Task { await load() } }
                )
            }
            .task { await load() }
            // 포그라운드 복귀 시 재조회 — staff 테이블은 realtime 미구독이라 진입 1회 로드뿐.
            //   웹 포커스 복귀 재조회와 동일 취지 (AppRoot scenePhase 패턴 미러).
            .onChange(of: scenePhase) { oldPhase, newPhase in
                guard newPhase == .active, oldPhase != .active, members != nil else { return }
                Task { await load() }
            }
        }
    }

    private func load() async {
        do {
            async let m = repo.members()
            async let l = repo.leaveRequests()
            async let r = repo.scheduleRules()
            async let al = repo.allowanceRequests()
            async let at = repo.ownerTodayAttendance()   // 출근여부 배지 (2026-07-14)
            let (mm, ll, rr, aa) = try await (m, l, r, al)
            members = mm
            leaves = ll
            rules = rr
            allowances = aa
            todayAtt = (try? await at) ?? []   // 출근 조회 실패는 핵심 로드 무영향 (배지만 미표시)
            // 급여일 — 마이그레이션 미적용/미설정이면 nil (카드가 '설정' 상태로 뜬다). 실패해도 핵심 로드 무영향.
            paydayDay = (try? await repo.payday()) ?? nil
            // 연차 기준 — 미설정/마이그레이션 미적용이면 법 원칙(입사일 기준) 유지
            if let raw = (try? await repo.leaveBasis()) ?? nil, let b = BULeaveBasis(rawValue: raw) { leaveBasis = b }
            // 잔여 계산은 잘리지 않은 원장으로 — 목록(leaves, limit 30)으로 세면 잔여가 부풀려진다
            leaveLedger = (try? await repo.leaveLedger()) ?? []
            ownerId = try? await repo.currentUserId()
            paidThisMonth = (try? await repo.payrollPaid(period: currentPeriod)) ?? nil
            loadFailed = false
            // 직무 목록 업종 분기용 — 사장 본인 category (실패 시 공통 직무만 노출)
            if let uid = BUSupabase.shared.currentUser?.id {
                struct Row: Decodable { let industry_category_id: String? }
                let rows: [Row] = (try? await BUSupabase.shared.client
                    .from("business_profiles").select("industry_category_id")
                    .eq("user_id", value: uid.uuidString).limit(1).execute().value) ?? []
                categoryId = rows.first?.industry_category_id
            }
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

    // ── 급여일 (2026-07-15, 웹 TeamSurface 「급여일」 카드 미러) ──
    //   읽기 default + 「수정」 (사장님 데이터 카드 표준 패턴). 미설정이면 바로 입력.
    private var paydayCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                Label("급여일", systemImage: "wonsign.circle")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.ink)

                if paydayDay == nil || editingPayday {
                    if paydayDay == nil {
                        Text("급여일을 정하면 그날 사장님과 직원 모두에게 알림이 갑니다. 지급 확인을 안 하시면 3일 간격으로 다시 알려드려요.")
                            .font(.system(size: 12.5))
                            .foregroundStyle(BUColor.inkSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    paydayEditor
                } else if let day = paydayDay {
                    HStack {
                        Text("매월 \(day)일")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.ink)
                        Spacer()
                        Button("수정") { editingPayday = true }
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(BUColor.midnight)
                    }
                    if effectivePayday(day) != day {
                        Text("이번 달은 \(effectivePayday(day))일(말일)에 알려드려요.")
                            .font(.system(size: 11.5))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    payrollConfirmBlock(day: day)
                }
            }
        }
    }

    private var paydayEditor: some View {
        HStack(spacing: 8) {
            Picker("급여일", selection: Binding(
                get: { paydayDay ?? 25 },
                set: { paydayDay = $0 }
            )) {
                ForEach(1...31, id: \.self) { d in
                    Text(d == 31 ? "31일 (말일)" : "\(d)일").tag(d)
                }
            }
            .pickerStyle(.menu)
            .tint(BUColor.midnight)

            Spacer()

            Button {
                guard let d = paydayDay else { return }
                Task {
                    savingPayroll = true
                    try? await repo.setPayday(d)
                    savingPayroll = false
                    editingPayday = false
                }
            } label: {
                Text(savingPayroll ? "저장 중…" : "저장")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16).padding(.vertical, 8)
                    .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
            }
            .disabled(savingPayroll)
            .opacity(savingPayroll ? 0.45 : 1)
        }
    }

    /// 급여일 당일·경과 + 미확인 → "보내셨나요?" / 확인됨 → ✓ / 그 전 → 안내
    @ViewBuilder
    private func payrollConfirmBlock(day: Int) -> some View {
        let today = Calendar.current.component(.day, from: Date())
        if today >= effectivePayday(day) && paidThisMonth != true {
            VStack(alignment: .leading, spacing: 10) {
                Text("\(currentPeriod) 급여를 보내셨나요?")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                HStack(spacing: 8) {
                    Button {
                        Task { savingPayroll = true; try? await repo.confirmPayroll(period: currentPeriod, paid: true); paidThisMonth = true; savingPayroll = false }
                    } label: {
                        Text("네, 보냈어요").font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 18).padding(.vertical, 9)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                    }
                    Button {
                        Task { savingPayroll = true; try? await repo.confirmPayroll(period: currentPeriod, paid: false); paidThisMonth = false; savingPayroll = false }
                    } label: {
                        Text("아직이요").font(.system(size: 13, weight: .bold)).foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 18).padding(.vertical, 9)
                            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(BUColor.midnight.opacity(0.2)))
                    }
                }
                .disabled(savingPayroll)
                if paidThisMonth == false {
                    Text("3일 간격으로 다시 알려드릴게요. 임금은 매월 1회 이상 일정한 날짜에 지급해야 합니다(근로기준법 §43).")
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(12)
            .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
        } else if paidThisMonth == true {
            Text("✓ \(currentPeriod) 급여 지급 확인됨")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
        } else {
            Text("급여일에 사장님과 직원 모두에게 알려드려요.")
                .font(.system(size: 12.5))
                .foregroundStyle(BUColor.inkSecondary)
        }
    }

    // ── 퇴사자 정산 (2026-07-15, 웹 미러) ──
    private var offboardingCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack(spacing: 8) {
                    Label("퇴사자 정산", systemImage: "person.badge.minus")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                    Text("\(leavers.count)")
                        .font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(BUColor.inkMuted, in: Capsule())
                }
                Text("퇴직 시 임금·퇴직금 등 일체의 금품은 퇴사일부터 14일 이내에 지급해야 합니다(근로기준법 §36). 정산을 마치면 완료 표시해 주세요.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                ForEach(leavers) { m in
                    LeaverRowView(member: m) { amount in
                        Task { try? await repo.markSettled(memberId: m.memberUserId, severance: amount); await load() }
                    }
                }
            }
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
                    attToday: todayAtt.first { $0.memberUserId == member.memberUserId },
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
    let attToday: OwnerTodayAttendance?   // 오늘 출퇴근 — nil=미출근 (2026-07-14)
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

    /// 오늘 출근여부 배지 — 신호등 색 대신 채움 강조: 근무중=채운 네이비 · 완료=소프트 · 미출근=아웃라인 (웹 미러)
    @ViewBuilder private var attendanceBadge: some View {
        if let att = attToday {
            if att.clockOutAt == nil {
                Label("출근 \(Self.hhmmKST(att.clockInAt))", systemImage: "clock.fill")
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8).padding(.vertical, 2.5)
                    .background(BUColor.midnight, in: Capsule())
            } else {
                Label("근무 완료", systemImage: "checkmark.circle.fill")
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 8).padding(.vertical, 2.5)
                    .background(BUColor.midnight.opacity(0.10), in: Capsule())
            }
        } else {
            Text("미출근")
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .padding(.horizontal, 8).padding(.vertical, 2.5)
                .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.18), lineWidth: 1))
        }
    }

    /// ISO timestamptz → KST HH:mm (초 유무 모두 파싱)
    private static func hhmmKST(_ iso: String) -> String {
        let parsed: Date? = {
            let f1 = ISO8601DateFormatter(); f1.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let d = f1.date(from: iso) { return d }
            let f2 = ISO8601DateFormatter(); f2.formatOptions = [.withInternetDateTime]
            return f2.date(from: iso)
        }()
        guard let date = parsed else { return "" }
        let out = DateFormatter()
        out.dateFormat = "HH:mm"
        out.timeZone = TimeZone(identifier: "Asia/Seoul")
        out.locale = Locale(identifier: "en_US_POSIX")
        return out.string(from: date)
    }

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
                    attendanceBadge   // 오늘 출근여부 (2026-07-14)
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

/// 퇴사자 1행 — [퇴사] 배지 + 금품청산 D-day + 정산 완료(금액 선택 입력). 웹 LeaverRow 미러.
///   ⚠️ 긴급도는 신호등 색이 아니라 **대비·굵기**로 — 브랜드 토큰은 미드나잇 네이비 + 라벤더뿐이고
///      빨강/노랑은 금지다(웹과 동일 규칙). 기한 초과는 배경 tint 를 진하게 + 문구를 풀강도로.
private struct LeaverRowView: View {
    let member: TeamMember
    let onSettle: (Int?) -> Void

    @State private var open = false
    @State private var amount = ""

    /// 금품청산 기한까지 남은 일수(음수=초과). 서버가 내려준 settle_due_at(퇴사일+14일) 기준.
    private var daysLeft: Int? {
        guard let due = member.settleDueAt else { return nil }
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let d = fmt.date(from: due) ?? ISO8601DateFormatter().date(from: due)
        guard let d else { return nil }
        let cal = Calendar.current
        return cal.dateComponents([.day], from: cal.startOfDay(for: Date()), to: cal.startOfDay(for: d)).day
    }

    var body: some View {
        let left = daysLeft
        let overdue = (left ?? 0) < 0
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text(member.name)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                Text("퇴사")
                    .font(.system(size: 10.5, weight: .heavy)).foregroundStyle(.white)
                    .padding(.horizontal, 7).padding(.vertical, 2)
                    .background(BUColor.inkMuted, in: Capsule())
                if let left {
                    Text(overdue ? "정산 기한 \(-left)일 초과 · 지연이자 발생" : "정산 기한 D-\(left)")
                        .font(.system(size: 11.5, weight: overdue ? .heavy : .semibold))
                        .foregroundStyle(overdue ? BUColor.midnight : BUColor.midnight.opacity(0.45))
                }
                Spacer(minLength: 0)
            }

            if !open {
                Button { open = true } label: {
                    Text("정산 완료 표시")
                        .font(.system(size: 12.5, weight: .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 16).padding(.vertical, 8)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                }
            } else {
                TextField("지급액(원) — 선택 입력", text: $amount)
                    #if os(iOS)
                    .keyboardType(.numberPad)
                    #endif
                    .font(.system(size: 13))
                    .padding(.horizontal, 12).padding(.vertical, 9)
                    .background(BUColor.surface, in: RoundedRectangle(cornerRadius: 10))
                HStack(spacing: 8) {
                    Button { onSettle(Int(amount)) } label: {
                        Text("완료").font(.system(size: 12.5, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 16).padding(.vertical, 8)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10))
                    }
                    Button("취소") { open = false }
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.inkMuted)
                }
                Text("완료 표시하면 명단에서 사라집니다. 근태·연차 기록은 법정 보존을 위해 유지됩니다.")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(12)
        .background(BUColor.midnight.opacity(overdue ? 0.10 : 0.06), in: RoundedRectangle(cornerRadius: 12))
        // 기한 초과는 좌측 미드나잇 액센트 바로 위계를 준다 — 웹 실렌더로 확인한 결과 배경 tint
        //   차이만으로는 구분이 약했다(웹 LeaverRow 와 동일 처리). 브랜드 토큰이라 신호등 규칙 준수.
        .overlay(alignment: .leading) {
            if overdue {
                RoundedRectangle(cornerRadius: 2)
                    .fill(BUColor.midnight)
                    .frame(width: 3)
                    .padding(.vertical, 2)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
