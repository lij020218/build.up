//
//  ProfileView.swift — 내 정보 surface (web ProfileView.tsx 1:1 미러)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/ProfileView.tsx (317 lines)
//
//  섹션 구성 (위→아래, 웹과 동일 순서):
//    1. header           — 아바타 + 사장님 이름 + 가게 이름
//    2. accountCard      — 이메일 / 로그인 방식 / 사용자 ID / 계정 유형 배지 (게스트/등록)
//    3. journeyCard      — 내 여정 진행도 (단계 N완료 + % + bar + 개업 상태)
//    4. storeCard        — 가게 이름 / 업종 / 운영 N일째 / 현재 단계 (탭 → StoreInfoEditSheet)
//    5. dataConnectionCard — 데이터 연결 (시트)
//    6. notificationCard — 4개 토글 (iOS 고유 — 푸시 알림)
//    7. languageCard     — 한국어 ↔ English 토글 (@AppStorage 영구)
//    8. supportCard      — 도움말 / 이용약관 / 개인정보 / 문의하기
//    9. accountActionsCard — 진행 초기화 (Supabase reset) + 로그아웃 / 계정 삭제
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneAuth
import FoundOneData

public struct ProfileView: View {
    let store: DashboardStore
    let coordinator: AuthCoordinator?
    /// 옵셔널 — 진행 초기화 시 in-memory state 도 함께 reset 하기 위해 필요.
    /// nil 이면 reset 시 dashboardStore 만 처리 (이전 동작 호환).
    let storeInfo: StoreInfoStore?

    public init(store: DashboardStore, coordinator: AuthCoordinator?, storeInfo: StoreInfoStore? = nil) {
        self.store = store
        self.coordinator = coordinator
        self.storeInfo = storeInfo
    }

    // 알림 토글
    @AppStorage("profile.notif.staleSales")     private var notifStaleSales:    Bool = true
    @AppStorage("profile.notif.taxDeadline")    private var notifTaxDeadline:   Bool = true
    @AppStorage("profile.notif.permitExpiry")   private var notifPermitExpiry:  Bool = true
    @AppStorage("profile.notif.weeklyCheckup")  private var notifWeeklyCheckup: Bool = true

    // 언어 — 웹과 동일하게 localStorage(@AppStorage) 만. Supabase 동기화 X (사용자별 디바이스 선호).
    @AppStorage("foundone.language") private var language: String = "ko"

    @Environment(RoadmapStore.self) private var roadmap
    @Environment(ResetCoordinator.self) private var resetCoordinator

    @State private var showDeleteConfirm: Bool = false
    /// 계정 삭제 실패 메시지 (AuthCoordinator.deleteError 미러) — alert 표시용.
    @State private var deleteFailedMsg: String? = nil
    @State private var showResetConfirm: Bool = false
    // 서버 초기화 실패 시 — 로컬을 지우지 않고 사장님께 명확히 알림(가짜 "완료" 금지).
    @State private var resetFailedMsg: String?
    @State private var showDataConnections: Bool = false
    @State private var showStoreConnect: Bool = false
    @State private var showFeedbackSheet: Bool = false
    @State private var showStoreEdit: Bool = false
    @State private var connectionCount: Int? = nil
    @State private var resetting: Bool = false
    @State private var storeBusinessOpen: String? = nil
    @State private var storeBusinessClose: String? = nil
    /// 운영자 여부 — allowlist 는 서버 전용이라 /api/admin/me 200 으로만 판정 (웹 ProfileView 미러).
    @State private var isAdminUser: Bool = false
    @Environment(\.openURL) private var openURL

    public var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // 공통 페이지 헤더 (2026-08-19 통일) — "내 정보" + 아바타 블록은 아래 header 로 축소 유지
                BUPageHeader(title: "내 정보", subtitle: profileSubtitle)
                // 2026-09-12 개편: 카드 11장이 각자 떠 있던 것을 **애플식 그룹 리스트**로 묶었다.
                //  종전 문제 — 제목이 세 번 나오고(`ACCOUNT · 계정` + `계정 정보` + 행 라벨),
                //  카드마다 반투명 흰색을 손으로 칠했고, 본문이 13pt 라 촘촘했다.
                VStack(alignment: .leading, spacing: BUSpacing.shellGap) {
                    header
                    accountCard
                    journeyCard
                    storeCard
                    connectionsSection
                    notificationCard
                    ownerProfileCard
                    languageCard
                    supportCard
                    accountActionsCard
                }
                .padding(.horizontal, BUSpacing.screenMargin)
            }
        }
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 이 풀스크린으로 깖.
        .sheet(isPresented: $showDataConnections, onDismiss: {
            Task { await refreshConnectionCount() }
        }) {
            DataConnectionSheet()
        }
        .sheet(isPresented: $showStoreConnect) {
            StoreConnectSheet()
        }
        .sheet(isPresented: $showFeedbackSheet) {
            FeedbackSheet()
        }
        .sheet(isPresented: $showStoreEdit) {
            StoreInfoEditSheet(
                initialStoreName: store.storeName,
                initialOpen: storeBusinessOpen,
                initialClose: storeBusinessClose,
                industryCategoryId: store.category.rawValue
            ) { newName, newOpen, newClose in
                // 저장 성공 → 로컬 캐시 갱신
                store.updateStoreName(newName)
                storeBusinessOpen = newOpen
                storeBusinessClose = newClose
            }
        }
        .task {
            // 온보딩 진단 "지금 연동하러 가기" 소비 — 데이터 연결 시트 자동 오픈 (1회성)
            if UserDefaults.standard.bool(forKey: "bu.openDataConnect") {
                UserDefaults.standard.removeObject(forKey: "bu.openDataConnect")
                showDataConnections = true
            }
            await refreshConnectionCount()
            await loadStoreHours()
            await probeAdminRole()
        }
        .alert("계정을 삭제하시겠어요?", isPresented: $showDeleteConfirm) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) {
                guard let coordinator else { return }
                Task {
                    let ok = await coordinator.deleteAccount()
                    if !ok { deleteFailedMsg = coordinator.deleteError }
                }
            }
        } message: {
            Text("계정·가게 데이터·업로드 문서·구독이 즉시 영구 삭제되며 되돌릴 수 없습니다. 직원 근로 기록만 법정 보존(근로기준법 3년)을 위해 계정과 분리해 보관 후 자동 파기됩니다.")
        }
        // 삭제 실패 — 세션·데이터는 그대로 유지된 채 alert 만 (거짓 실패 화면 금지: 로그인 화면으로 튕기지 않는다).
        .alert("계정 삭제에 실패했습니다", isPresented: Binding(get: { deleteFailedMsg != nil }, set: { if !$0 { deleteFailedMsg = nil } })) {
            Button("확인", role: .cancel) {
                deleteFailedMsg = nil
                coordinator?.clearDeleteError()
            }
        } message: {
            Text(deleteFailedMsg ?? "")
        }
        .alert("진행을 초기화하시겠어요?", isPresented: $showResetConfirm) {
            Button("취소", role: .cancel) {}
            Button("초기화", role: .destructive) {
                Task { await performReset() }
            }
        } message: {
            Text("모든 단계 결정·입력값·매출 기록이 삭제됩니다. 계정은 유지됩니다.")
        }
        .alert("초기화에 실패했습니다", isPresented: Binding(get: { resetFailedMsg != nil }, set: { if !$0 { resetFailedMsg = nil } })) {
            Button("확인", role: .cancel) { resetFailedMsg = nil }
        } message: {
            Text("서버 데이터가 그대로 유지되어 초기화를 중단했습니다. 데이터는 안전합니다 — 네트워크 확인 후 다시 시도해 주세요.\n\n\(resetFailedMsg ?? "")")
        }
    }

    // MARK: - 1. header (avatar + 이름 + 가게)

    private var header: some View {
        let session = coordinator?.currentSession
        let displayName: String = {
            if let n = session?.displayName, !n.isEmpty { return n }
            if let e = session?.email, !e.isEmpty { return e }
            return store.userName
        }()
        let initialChar: String = {
            let trimmed = displayName.trimmingCharacters(in: .whitespaces)
            return trimmed.first.map { String($0).uppercased() } ?? "?"
        }()
        let isAnonymous = session == nil

        return HStack(spacing: BUSpacing.md) {
            // 큰 아바타 원
            ZStack {
                Circle()
                    .fill(
                        isAnonymous
                        ? AnyShapeStyle(BUColor.midnight08)
                        : AnyShapeStyle(LinearGradient(
                            colors: [BUColor.midnight, BUColor.midnightDeep],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                    )
                    .frame(width: 52, height: 52)
                if isAnonymous {
                    Image(systemName: "person.crop.circle")
                        .font(.system(size: 24, weight: .regular))
                        .foregroundStyle(BUColor.inkMuted)
                } else {
                    Text(initialChar)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            VStack(alignment: .leading, spacing: 3) {
                // 페이지 타이틀은 BUPageHeader("내 정보") — 여기선 이름·가게만 (큰 글자 중복 금지, 2026-08-19)
                Text(isAnonymous ? "로그인이 필요합니다" : displayName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Text(store.storeName.isEmpty ? "가게 이름을 입력해 주세요" : store.storeName)
                    .font(.system(size: 13.5, weight: .regular))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
        .padding(.bottom, BUSpacing.xxs)
    }

    /// 헤더 부제 — 로그인 상태 한 줄 (계정 상세는 아래 카드).
    private var profileSubtitle: String {
        coordinator?.currentSession == nil ? "로그인하면 계정을 관리할 수 있어요" : "계정 · 가게 · 알림 · 데이터 연결"
    }

    // MARK: - 2. accountCard

    private var accountCard: some View {
        BUListSection("계정") {
            BUListRow.value("이메일", accountEmailLabel, monospaced: !isAnonymousAccount)
            BUListRow.value("로그인 방식", providerLabel)
            if let uid = coordinator?.currentSession?.userId {
                BUListRow.value("사용자 ID", shortUserId(uid), monospaced: true)
            }
            // 종전엔 주황/초록 캡슐 배지였다. 값이 두 가지뿐이라 색까지 쓸 이유가 없다.
            BUListRow.value("계정 유형", isAnonymousAccount ? "미로그인" : "이메일 계정")
        }
    }

    private var accountEmailLabel: String {
        guard let email = coordinator?.currentSession?.email, !email.isEmpty else { return "미로그인" }
        return email
    }

    private var providerLabel: String {
        guard let kind = coordinator?.currentSession?.provider else { return "—" }
        switch kind {
        case .apple: return "Apple"
        case .kakao: return "카카오"
        case .email: return "이메일"
        }
    }

    private var isAnonymousAccount: Bool {
        guard let session = coordinator?.currentSession else { return true }
        return session.email == nil || session.email?.isEmpty == true
    }

    private func shortUserId(_ uid: UUID) -> String {
        let prefix = uid.uuidString.prefix(8)
        return "\(prefix)…"
    }

    // MARK: - 3. journeyCard (내 여정 진행도 — 웹 156–184 미러)

    private var journeyCard: some View {
        BUListSection("진행 상황", footer: journeySubtitle) {
            BUListRow.content("완료한 단계", value: "\(roadmap.completedCount) / \(max(roadmap.totalCount, 1))") {
                ProgressBar(percent: progressPercent)
            }
            BUListRow.value("진행률", "\(progressPercent)%")
        }
    }

    private var progressPercent: Int {
        let total = max(1, roadmap.totalCount)
        let done = max(0, min(roadmap.completedCount, total))
        return Int((Double(done) / Double(total) * 100).rounded())
    }

    private var journeySubtitle: String {
        let total = roadmap.totalCount
        let prefix = total > 0 ? "전체 \(total)단계 중" : "단계 정보 로딩 중"
        let suffix = store.businessLaunched ? " · 개업 완료" : " · 창업 준비 중"
        return prefix + suffix
    }

    // MARK: - 4. storeCard (탭 → StoreInfoEditSheet)

    private var storeCard: some View {
        // "편집" 캡슐 칩 → 섹션 제목 오른쪽 링크 (애플이 섹션 동작을 두는 자리).
        BUListSection("가게", actionLabel: "편집", action: { showStoreEdit = true }) {
            BUListRow.value("가게 이름", store.storeName.isEmpty ? "미입력" : store.storeName)
            BUListRow.value("업종", store.category.labelKo)
            if !hideHoursForCategory {
                BUListRow.value("영업시간", businessHoursLabel)
            }
            BUListRow.value("운영 기간", store.businessLaunched ? "\(store.daysSinceLaunch)일째" : "운영 시작 안 함")
            BUListRow.value("현재 단계", stageLabel)
        }
    }

    private var hideHoursForCategory: Bool {
        let raw = store.category.rawValue
        return raw == "ecommerce" || raw == "startupTech"
    }

    private var businessHoursLabel: String {
        if let o = storeBusinessOpen, let c = storeBusinessClose, !o.isEmpty, !c.isEmpty {
            return "\(o) – \(c)"
        }
        return "24시간 / 미설정"
    }

    private var stageLabel: String {
        guard store.businessLaunched else { return "창업 준비 중" }
        switch store.stage {
        case .early:  return "초기 운영"
        case .growth: return "성장기"
        case .mature: return "안정 운영"
        }
    }

    // MARK: - 연결 및 지원 (종전: 40pt 아이콘 타일이 붙은 카드 3장이 각자 떠 있었다)

    private var connectionsSection: some View {
        BUListSection("연결") {
            BUListRow.link("데이터 연결",
                           subtitle: connectionSubtitle) { showDataConnections = true }
                .icon("antenna.radiowaves.left.and.right")
            BUListRow.link("가게 연결 (직원용)",
                           subtitle: "초대 코드로 근무표·연차를 함께 씁니다") { showStoreConnect = true }
                .icon("person.badge.key")
            BUListRow.link("의견 보내기",
                           subtitle: "불편한 점·제안 무엇이든 빠르게 반영합니다") { showFeedbackSheet = true }
                .icon("bubble.left.and.text.bubble.right")
        }
    }

    /// 연결 개수는 초록 캡슐 배지였다 → 부제 한 줄로. 숫자 하나에 색을 쓸 이유가 없다.
    private var connectionSubtitle: String {
        guard let n = connectionCount, n > 0 else { return "매일 새벽 자동 수집" }
        return "현재 \(n)개 연결 · 매일 새벽 자동 수집"
    }

    @MainActor
    /// 운영자 프로브 — 웹 /api/admin/me (200=운영자). 실패·403 = 미노출 (웹 ProfileView 미러).
    private func probeAdminRole() async {
        guard let token = await BUSupabase.shared.currentSession?.accessToken else { return }
        var request = URLRequest(url: BUSupabase.shared.env.webAppURL.appendingPathComponent("api/admin/me"))
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 10
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if (response as? HTTPURLResponse)?.statusCode == 200 {
                isAdminUser = true
            }
        } catch {
            // 네트워크 실패 = 미노출 (조용히 무시)
        }
    }

    private func refreshConnectionCount() async {
        // 로그인 안 됐을 땐 조회 skip — 0 표시.
        guard BUSupabase.shared.currentSession != nil else {
            connectionCount = nil
            return
        }
        let repo = FunnelConnectionRepository(supabase: BUSupabase.shared.client, baseURL: BUSupabase.shared.env.webAppURL)
        do {
            let rows = try await repo.listConnections()
            connectionCount = rows.count
        } catch {
            // 실패하면 배지 숨김 (조용히).
            connectionCount = nil
        }
    }

    // MARK: - 4. notificationCard

    private var notificationCard: some View {
        BUListSection("알림") {
            BUListRow.toggle("매출 미입력", subtitle: "3일 이상 매출이 비면 알려드려요", isOn: $notifStaleSales)
            BUListRow.toggle("세금 신고 임박", subtitle: "신고 마감 7일 전부터 안내", isOn: $notifTaxDeadline)
            BUListRow.toggle("인허가 만료 임박", subtitle: "만료 30일 전부터 안내", isOn: $notifPermitExpiry)
            BUListRow.toggle("매주 운영 점검", subtitle: "월요일 아침 한 주 미리보기", isOn: $notifWeeklyCheckup)
        }
    }

    // MARK: - 4.5 ownerProfileCard (지원사업 매칭 — 출생연도·신용·폐업·장애, 로컬 전용·서버 미전송)

    private var ownerProfileCard: some View {
        BUListSection(
            "지원사업 매칭",
            footer: "모두 선택 항목이며 기기에만 저장됩니다. 서버로 보내지 않습니다."
        ) {
            BUListRow.content(
                "해당하는 항목",
                subtitle: "청년(만 39세 이하)·시니어 전용 지원을 더 정확히 찾아드려요"
            ) {
                OwnerProfileChips(onChange: {}, showsHeader: false)
            }
        }
    }

    // MARK: - 7. languageCard (ko/en 실제 토글 — @AppStorage 영구)

    private var languageCard: some View {
        BUListSection("언어") {
            BUListRow.custom("표시 언어") {
                LanguageToggle(language: $language)
            }
        }
    }

    // MARK: - 6. supportCard

    private var supportCard: some View {
        BUListSection("도움말") {
            BUListRow.link("이용약관") { open("https://foundone.dev/terms") }
            BUListRow.link("개인정보처리방침") { open("https://foundone.dev/privacy") }
            // 문의 주소는 웹 푸터와 동일 (2026-08-06 지시) — support@ 는 수신함이 없어 유실된다.
            BUListRow.link("문의하기") { open("mailto:\(BusinessInfo.contactEmail)") }
            BUListRow.value("버전", appVersionString)
        }
    }

    private func open(_ raw: String) {
        guard let url = URL(string: raw) else { return }
        openURL(url)
    }

    private var appVersionString: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "—"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "—"
        return "\(v) (\(b))"
    }

    // MARK: - 9. accountActionsCard (진행 초기화 + 로그아웃 + 계정 삭제)

    private var accountActionsCard: some View {
        // 애플은 되돌리기 어려운 동작을 **빨간 글자 한 줄**로만 둔다 — 캡슐 버튼·테두리 없이.
        VStack(alignment: .leading, spacing: BUSpacing.shellGap) {
            if isAdminUser {
                BUListSection("운영자", footer: "가입·기능 사용량·피드백 관리. 웹 콘솔로 열립니다.") {
                    BUListRow.link("운영자 콘솔 열기") {
                        openURL(BUSupabase.shared.env.webAppURL.appendingPathComponent("admin"))
                    }
                    .icon("wrench.and.screwdriver")
                }
            }

            BUListSection(footer: "진행 초기화는 모든 단계 결정·매출·캠페인 기록을 지웁니다. 계정은 유지됩니다.") {
                BUListRow.destructive(resetting ? "초기화하는 중…" : "진행 초기화") {
                    showResetConfirm = true
                }
                if coordinator != nil {
                    BUListRow.button("로그아웃") {
                        guard let coordinator else { return }
                        Task { await coordinator.signOut() }
                    }
                    // 계정 삭제는 실계정만 — 익명 세션은 /api/account/delete 가 401.
                    if !isAnonymousAccount {
                        BUListRow.destructive("계정 삭제") { showDeleteConfirm = true }
                    }
                }
            }
        }
        .disabled(resetting)
    }

    // MARK: - Reset action

    @MainActor
    private func performReset() async {
        // 웹 패턴 미러 (resetDemo @ useSelectionHandlers.ts):
        //   1) 오버레이 표시 + 진행률 0 시작
        //   2) 서버 + 로컬 정리 작업 진행 (진행률 점진 증가)
        //   3) 진행률 1.0 도달 + "완료!" 잠시 유지
        //   4) 마지막 순간 store.resetAll() + clearAllAppStorage() 호출
        //      → AppRoot.needsOnboarding() = true → OnboardingFlow 마운트 (오버레이가 가려줌)
        //   5) 오버레이 fade-out → OnboardingChoiceView 가 자연스럽게 나타남
        //
        //   ⚠️ 4번을 마지막에 두는 이유: store.resetAll() 호출 즉시 AppRoot 가 ProfileView 를
        //      destroy 하므로 async 함수의 나머지 await 들이 끊어질 가능성. 모든 progress 애니메이션
        //      을 먼저 끝낸 뒤 마지막에 navigation 트리거.
        resetting = true
        resetCoordinator.start()
        defer { resetting = false }

        // ── ⓿ 준비 (0 → 0.20)
        await tick(to: 0.20, over: 0.25)

        // ── ① 서버 reset (0.20 → 0.85)
        //   ⚠️ 서버 삭제가 실패하면 *로컬을 지우지 않고 중단*. 로컬만 비우면 (a) 가짜 "완료" 표시,
        //      (b) 서버 데이터 잔존 → realtime/재로딩으로 부활 → "초기화 후 데이터 복구" 사장님 신고.
        //      web(useSelectionHandlers) 의 "검증 실패 시 reload 차단" 패턴 미러.
        let repo = AccountResetRepository(supabase: BUSupabase.shared.client)
        await tick(to: 0.30, over: 0.1)
        var serverFailMsg: String?
        var resetResultAt: String?
        do {
            let result = try await repo.resetAccount()
            if !result.coreFailures.isEmpty {
                serverFailMsg = "핵심 데이터가 서버에 남아있습니다: \(result.coreFailures.joined(separator: ", "))"
            } else {
                resetResultAt = result.resetAt
                await tick(to: 0.65, over: 0.25)
            }
        } catch {
            serverFailMsg = (error as? (any LocalizedError))?.errorDescription ?? error.localizedDescription
        }

        if let failMsg = serverFailMsg {
            // 서버 삭제 실패 → 로컬 보존 + 오버레이 중단 + 명확한 알림. (로컬·서버 일관성 유지)
            store.recordError("초기화 중단 — 서버 데이터 유지: \(failMsg)")
            resetCoordinator.stop()
            resetFailedMsg = failMsg
            return
        }

        // 초기화 표식(tombstone) — *이 기기*가 본 reset_at 저장. 없으면 재실행 시 본인 초기화를
        //   "다른 기기 초기화"로 오인해 불필요한 wipe 사이클. ("account." 접두사라 clearAllAppStorage 안 지움)
        if let ra = resetResultAt { UserDefaults.standard.set(ra, forKey: "account.reset.seen") }

        // ── ② 마무리 진행률 (0.65 → 1.0) — 시각적 완료감
        await tick(to: 0.95, over: 0.3)
        await tick(to: 1.0, over: 0.15)

        // "완료!" 메시지 잠시 유지
        try? await Task.sleep(nanoseconds: 600_000_000)

        // ── ③ 실제 로컬 정리 + navigation 트리거 (마지막에)
        //     이 시점에서 AppRoot 가 즉시 OnboardingFlow 로 전환되지만, 오버레이가 가려줌.
        store.resetAll()                  // DashboardStore — storeName / entries / costs 비움
        roadmap.clearAllAppStorage()      // 모든 stage @AppStorage 키 삭제
        storeInfo?.reset()                // 2026-05-25: StoreInfoStore in-memory state 초기화 —
                                          // 이걸 빠뜨리면 사장님 신고: "전부 초기화 후 상호명 잔존".

        // 짧은 holding — OnboardingFlow 가 mount 완료될 시간
        try? await Task.sleep(nanoseconds: 200_000_000)

        // ── ④ 오버레이 fade-out → OnboardingChoiceView 가 자연스럽게 노출
        resetCoordinator.stop()
    }

    /// progress 를 점진적으로 target 까지 증가 (over: 초). 60fps 가량.
    @MainActor
    private func tick(to target: Double, over seconds: Double) async {
        let steps = max(1, Int(seconds * 30))
        let start = resetCoordinator.progress
        let delta = target - start
        for i in 1...steps {
            let t = Double(i) / Double(steps)
            resetCoordinator.setProgress(start + delta * t)
            try? await Task.sleep(nanoseconds: UInt64((seconds / Double(steps)) * 1_000_000_000))
        }
    }

    // MARK: - Load store hours

    @MainActor
    private func loadStoreHours() async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let repo = StoreProfileRepository(supabase: BUSupabase.shared.client, userId: uid)
        if let info = try? await repo.load() {
            storeBusinessOpen = info.businessOpenTime
            storeBusinessClose = info.businessCloseTime
        }
    }

}

// MARK: - Helper components

/// 진행도 막대 — 0–100, 100% 면 초록.
private struct ProgressBar: View {
    let percent: Int

    var body: some View {
        GeometryReader { proxy in
            let w = proxy.size.width
            let clamped = max(0, min(100, percent))
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(BUColor.ink.opacity(0.07))
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        clamped >= 100
                            ? AnyShapeStyle(BUColor.success)
                            : AnyShapeStyle(LinearGradient(
                                colors: [BUColor.accent, BUColor.midnightBright],
                                startPoint: .leading, endPoint: .trailing
                            ))
                    )
                    .frame(width: w * CGFloat(clamped) / 100)
                    .animation(.easeOut(duration: 0.4), value: clamped)
            }
        }
        .frame(height: 6)
    }
}

/// 언어 토글 — 한국어 / English 두 버튼.
private struct LanguageToggle: View {
    @Binding var language: String

    var body: some View {
        HStack(spacing: 6) {
            languageButton(code: "ko", label: "한국어")
            languageButton(code: "en", label: "English")
        }
    }

    private func languageButton(code: String, label: String) -> some View {
        Button {
            language = code
        } label: {
            Text(label)
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(language == code ? .white : BUColor.inkMuted)
                .padding(.horizontal, 14).padding(.vertical, 6)
                .background(
                    language == code
                        ? AnyShapeStyle(BUColor.accent)
                        : AnyShapeStyle(Color.clear),
                    in: RoundedRectangle(cornerRadius: 8)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(language == code ? Color.clear : BUColor.cardBorder, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}
