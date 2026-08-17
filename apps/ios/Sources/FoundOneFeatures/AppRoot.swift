//
//  AppRoot.swift — 앱 최상위 컨테이너
//
//  Xcode App target 의 `@main` App struct 가 `AppRoot()` 를 body 로 사용.
//
//   @main
//   struct FoundOneApp: App {
//       var body: some Scene {
//           WindowGroup {
//               AppRoot()
//           }
//       }
//   }
//
//  AppRoot 는:
//   • AuthCoordinator 생성 + 로그인 상태 따라 분기
//   • 로그인 후 DashboardStore 로드 + TodayView/RoadmapView 탭 전환
//   • 알림 권한 sheet 자동 표시
//

import SwiftUI
import Combine
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneAuth
import FoundOneData
import FoundOneNotifications

public struct AppRoot: View {

    @State private var coordinator: AuthCoordinator
    @State private var dashboardStore: DashboardStore?
    /// 내 가게 페이지 store — DashboardStore 와 분리. 로그인 후 Supabase load.
    /// MyStoreView 에 prop 으로 주입 (ObservableObject — environment 가 아닌 직접 전달).
    @State private var storeInfoStore: StoreInfoStore?
    /// 안정적 fallback — storeInfoStore 가 아직 nil 일 때 .environmentObject 용 (재생성 방지).
    @State private var storeInfoFallback = StoreInfoStore(repository: FallbackStoreInfoRepository())
    /// 현금흐름 store — TodayView 게이팅(설정 프롬프트 ↔ HeroCard) + 설정 시트 공유. 로그인 후 Supabase load.
    @State private var cashflowStore: CashflowStore?
    @State private var coachingStore: CoachingHistoryStore?
    @State private var saasStore: SaasMetricsStore?
    @State private var subscriptionStore: SubscriptionStore?
    /// 전역 로드맵 store — TodayView / RoadmapView / Stage 시트 모두에서 공유.
    /// AppRoot 에서 한 번 생성 → .environment 로 자식 트리에 주입. 로그인 시 Supabase 동기화.
    @State private var roadmapStore: RoadmapStore = {
        let s = RoadmapStore()
        s.pathProvider = { raw in
            let c = BusinessCluster(rawValue: raw) ?? .offlineFood
            return RoadmapSampleData.stageIds(for: c)
        }
        return s
    }()
    @State private var notificationFlow = NotificationPermissionFlow()
    @State private var showNotificationSheet = false
    @State private var selectedTab: Tab = .home
    @Environment(\.scenePhase) private var scenePhase   // 포그라운드 복귀 시 원격 재동기화 트리거
    @State private var realtimeSync: RealtimeSyncManager? = nil   // 2단계 실시간 동기화 구독
    /// 전역 "진행 초기화" 코디네이터 — ProfileView 가 트리거, AppRoot 가 오버레이 표시.
    @State private var resetCoordinator = ResetCoordinator()
    /// DEBUG 빌드에서 SignInView 우회 — 시뮬레이터 시각 검증용.
    @State private var demoMode: MockScenario? = nil
    /// 기존 가게 등록 완료 후 loadDashboardIfNeeded 에서 StoreInfo / AppStorage 에 적용할 임시 저장.
    @State private var pendingRegistration: StoreRegistration? = nil
    /// 계정 역할 (business_profiles.user_role) — nil=미확정(스켈레톤), "staff"/"manager"=직원 대시보드,
    ///   그 외("owner"·행 없음·조회 실패)=사장 화면. 웹 fast-gate(roleResolved) 미러 (2026-07-12).
    @State private var userRole: String? = nil
    /// 역할 조회 실패 (재시도 1회 포함) — fail-open 금지: owner 로 가정하지 않고 재시도 화면 (2026-08-01)
    @State private var roleResolveFailed = false
    /// 받은 채용 초대장 — owner 역할 확정 시 my_pending_invites 체크 → 자동 표시 (웹 InviteOfferModal 미러).
    @State private var offeredInvite: TeamPendingInvite? = nil
    /// 프로필 세부업종(business_profiles.subIndustryId) — 오퍼링 탭 라벨의 세부업종 정밀 해석용
    ///   (웹 useComputedDashboard offeringKind 패리티: pet-supplies=상품·재고 등 categoryId 폴백과 다른 예외).
    ///   원격 스냅샷 로드·refresh 시 갱신 → 웹에서 업종 변경해도 탭 라벨이 따라온다.
    @State private var profileSubIndustryId: String? = nil
    /// 「나중에」 누른 초대 코드 — 이 세션 동안 재표시 안 함.
    @State private var dismissedInviteCodes: Set<String> = []

    public enum Tab: Hashable, Sendable {
        case home
        case current
        case roadmap
        case guides
        case franchise
        case marketing
        case tax
        case reports
        case finance
        case offerings
        case analytics
        case team
        case profile
    }

    public init() {
        // 실제 Supabase 인스턴스 사용 (Info.plist 에서 환경 로드)
        let supabase = BUSupabase.shared.client
        self._coordinator = State(initialValue: AuthCoordinator(supabase: supabase))

        #if DEBUG
        // BU_DEMO_SCENARIO 환경변수 → 데모 진입 (디자인 미리보기 전용)
        //   ⚠️ 기본 동작은 항상 실제 Supabase 인증 경로. 사장님이 실제 데이터를
        //      입력했는데 데모로 보이는 사고를 막기 위해 이중 가드:
        //      BU_DEMO_SCENARIO + BU_DEMO_ALLOW=1 두 변수 모두 있어야 진입.
        if let raw = ProcessInfo.processInfo.environment["BU_DEMO_SCENARIO"],
           ProcessInfo.processInfo.environment["BU_DEMO_ALLOW"] == "1",
           let scenario = MockScenario(envValue: raw) {
            self._demoMode = State(initialValue: scenario)
        }
        // BU_DEMO_TAB
        if let tab = ProcessInfo.processInfo.environment["BU_DEMO_TAB"] {
            switch tab.lowercased() {
            case "home", "today": self._selectedTab = State(initialValue: .home)
            case "current":       self._selectedTab = State(initialValue: .current)
            case "roadmap":       self._selectedTab = State(initialValue: .roadmap)
            case "guides", "funding": self._selectedTab = State(initialValue: .guides)
            case "franchise":     self._selectedTab = State(initialValue: .franchise)
            case "marketing":     self._selectedTab = State(initialValue: .marketing)
            case "tax":           self._selectedTab = State(initialValue: .tax)
            case "reports":       self._selectedTab = State(initialValue: .reports)
            case "finance":       self._selectedTab = State(initialValue: .finance)
            case "offerings", "inventory": self._selectedTab = State(initialValue: .offerings)
            case "team", "staff":  self._selectedTab = State(initialValue: .team)
            case "analytics", "store": self._selectedTab = State(initialValue: .analytics)
            case "profile", "settings": self._selectedTab = State(initialValue: .profile)
            default: break
            }
        }
        #endif
    }

    /// 데모 탭 — DemoTabs 는 `#if DEBUG` 안에만 정의되므로 호출부도 같이 갈라야 한다.
    /// (Release 아카이브에서 "cannot find 'DemoTabs' in scope" 로 빌드가 깨졌다 — 2026-08-06)
    /// Release 에서는 demoMode 가 절대 nil 이 아닌 값이 되지 않으므로 이 경로는 도달 불가.
    @ViewBuilder
    private func demoTabs(scenario: MockScenario) -> some View {
        #if DEBUG
        DemoTabs(scenario: scenario, selectedTab: $selectedTab) {
            demoMode = nil
        }
        #else
        EmptyView()
        #endif
    }

    public var body: some View {
        Group {
            if let scenario = demoMode {
                // ── DEBUG 데모 모드 ── (Release 에서는 DemoTabs 자체가 컴파일되지 않는다)
                demoTabs(scenario: scenario)
            } else if coordinator.isAuthenticated {
                if let store = dashboardStore {
                    // ── 역할 게이트 (2026-07-12, 웹 fast-gate 미러) ──
                    //   business_profiles.user_role 확정 전엔 스켈레톤(사장 화면 flash 방지),
                    //   staff/manager 면 직원 대시보드만 노출 (웹 starter-stage-demo staff routing 미러).
                    if userRole == nil {
                        if roleResolveFailed {
                            // 🔴 fail-open 수정 (2026-08-01): 종전엔 조회 실패 시 "owner" 가정 —
                            //   직원 계정이 일시 오류로 사장 셸(빈 가게)을 보게 되는 방향성 결함.
                            //   실패는 실패라고 말하고 재시도한다 (거짓 실패 화면 금지의 역방향 동일 원칙).
                            RoleResolveRetryView {
                                roleResolveFailed = false   // nil 게이트로 복귀 → .task 재실행
                            }
                        } else {
                            AuthenticatedLoadingView()
                                .task { await resolveUserRole() }
                        }
                    } else if userRole == "staff" || userRole == "manager" {
                        StaffDashboardView(onSignOut: {
                            Task { await coordinator.signOut() }
                        })
                    } else {
                    // 신규 사장님 — 아무것도 안 한 상태 → OnboardingChoiceView
                    // (웹과 동일: category 미정 + 영업 미시작 + 매출/비용 데이터 0)
                    // ⚠️ 2026-05-25: .animation + .transition 추가 — "진행 초기화" 후
                    //   clearAllAppStorage() → needsOnboarding() 재평가 시 fade 전환.
                    Group {
                    if needsOnboarding(store: store) {
                        OnboardingFlow(
                            store: store,
                            selectedTab: $selectedTab,
                            pendingRegistration: $pendingRegistration
                        )
                        .transition(.opacity)
                    } else {
                        MainTabs(
                            store: store,
                            subIndustryId: profileSubIndustryId,
                            storeInfo: storeInfoStore ?? Self.makeFallbackStoreInfo(),
                            cashflow: cashflowStore,
                            coaching: coachingStore,
                            saas: saasStore,
                            subscription: subscriptionStore,
                            coordinator: coordinator,
                            selectedTab: $selectedTab
                        )
                        .transition(.opacity)
                        // 화면 방문 계측 — Tab case 이름 = 웹 DashboardSurface 슬러그 1:1 (13종 동일)
                        .onChange(of: selectedTab) { _, newTab in
                            SurfaceVisitRecorder.record(String(describing: newTab))
                        }
                        .task {
                            SurfaceVisitRecorder.record(String(describing: selectedTab)) // 첫 진입 탭
                            await notificationFlow.refresh()
                            #if DEBUG
                            // 디자인 검증 모드 (BU_DEMO_TAB 또는 BU_DEMO_STAGE) 에서는 sheet skip.
                            let demoMode = ProcessInfo.processInfo.environment["BU_DEMO_TAB"] != nil
                                || ProcessInfo.processInfo.environment["BU_DEMO_STAGE"] != nil
                            if demoMode { return }
                            #endif
                            if notificationFlow.status != .granted {
                                showNotificationSheet = true
                            }
                        }
                        .sheet(isPresented: $showNotificationSheet) {
                            NotificationOptInView(flow: notificationFlow) {
                                showNotificationSheet = false
                            }
                        }
                    }
                    } // Group
                    .animation(.easeInOut(duration: 0.45), value: needsOnboarding(store: store))
                    } // 역할 게이트 else (owner)
                } else {
                    AuthenticatedLoadingView()
                        .task {
                            await loadDashboardIfNeeded(coordinator: coordinator)
                        }
                }
            } else {
                SignInView(coordinator: coordinator)
                    .overlay(alignment: .bottomTrailing) {
                        #if DEBUG
                        // 디자인 미리보기 전용 — 실제 데이터 아님. 작은 회색
                        // 텍스트로 눈에 띄지 않게 둠. 사장님이 실수로 누르면
                        // 진입 시 큰 "데모 데이터" 배너로 즉시 인지 가능.
                        DemoModeMenu { scenario in
                            demoMode = scenario
                        }
                        .padding(.bottom, 6)
                        .padding(.trailing, BUSpacing.sm)
                        #endif
                    }
                    .task {
                        // 인증 상태를 *지속* 관측 + 계정 전환 격리.
                        //   세션 uid 가 직전 영구저장된 계정과 다르면(다른 계정 로그인·앱 재실행 후 전환)
                        //   이전 계정의 로컬 데이터(@AppStorage 로드맵·스테이지·PII)를 *먼저 wipe* 하고
                        //   dashboardStore(메모리 매출·비용)도 리셋해 강제 재로드 → cross-account 누출 차단.
                        //   (웹 hydrateStoresForUser/__foundone_uid 대응. 2026-06-22 P0: 동명이인 누출 신고.)
                        var loadedUid: String? = nil
                        for await change in BUSupabase.shared.authStateChanges {
                            if let uid = change.session?.user.id.uuidString {
                                if loadedUid != uid {
                                    let lastKey = "__foundone_last_uid"  // wipe prefix 에 안 걸리는 키
                                    if UserDefaults.standard.string(forKey: lastKey) != uid {
                                        // 다른 계정 — 이전 계정 로컬 데이터 제거(서버 로드로만 다시 채워짐).
                                        LocalDataWipe.wipeAllLocalUserData()
                                        UserDefaults.standard.set(uid, forKey: lastKey)
                                    }
                                    dashboardStore = nil  // 새 계정 데이터로 강제 재로드(가드 해제)
                                    userRole = nil        // 역할 게이트 재확정 (계정 전환 시 직원↔사장 누출 방지)
                                    loadedUid = uid
                                    await loadDashboardIfNeeded(coordinator: coordinator)
                                }
                            } else {
                                // signedOut / tokenRefreshFailed — 비인증 전환 + 로컬 정리(self-gated)
                                loadedUid = nil
                                userRole = nil
                                coordinator.handleSessionLost()
                            }
                        }
                    }
            }
        }
        .environment(roadmapStore)
        // 포그라운드 복귀 시 원격 재동기화 — 웹에서 저장한 내용이 앱에 바로 반영되게.
        //   초기 로드(dashboardStore==nil) 전에는 skip — loadDashboardIfNeeded 가 담당.
        .onChange(of: scenePhase) { oldPhase, newPhase in
            guard newPhase == .active, oldPhase != .active, dashboardStore != nil else { return }
            Task { await refreshAllFromRemote() }
        }
        // 2단계 실시간 — RealtimeSyncManager 가 원격 변경 수신 시 알림 → 안전한 재조회.
        .onReceive(NotificationCenter.default.publisher(for: .buildupRemoteDataChanged)) { _ in
            Task { await refreshAllFromRemote() }
        }
        // 역할 변경 가능성(초대 수락 owner→staff 등) → 역할 게이트 재조회 (2026-07-12).
        .onReceive(NotificationCenter.default.publisher(for: .buildupRoleMayHaveChanged)) { _ in
            Task { await resolveUserRole() }
        }
        // 받은 채용 초대장 — 수락 시 시트 내부에서 역할 알림 발신 → 위 onReceive 가 직원 화면 전환.
        .sheet(item: $offeredInvite) { inv in
            InviteOfferSheet(invite: inv, onDismissLater: {
                dismissedInviteCodes.insert(inv.inviteCode)
            })
        }
        // 다른 기기에서 초기화(core 행 DELETE) → 이 기기도 따라서 로컬 wipe.
        //   refreshAllFromRemote(flush-우선/key-merge)를 타면 stale 로컬이 서버에 부활하므로 그 경로 대신 wipe.
        .onReceive(NotificationCenter.default.publisher(for: .buildupRemoteWipe)) { _ in
            wipeLocalForRemoteReset()
        }
        // 단계 번호를 경로 위치 기준으로 계산하도록 현재 클러스터 경로 주입 (5→11 점프 버그 방지).
        .environment(\.roadmapStageOrder, roadmapStore.pathStageIds)
        .environment(resetCoordinator)
        // 로드맵 위저드(VendorSetupStageView 등)에서 재고 store 접근용 — 발주 계획 → 재고 자동 반영.
        .environmentObject(storeInfoStore ?? storeInfoFallback)
        .overlay {
            // "진행 초기화" 풀스크린 오버레이 — fade-in/out.
            //   오버레이가 표시되는 동안 store.resetAll() + clearAllAppStorage() 가 호출되어
            //   AppRoot.body 가 needsOnboarding() = true 로 재평가 → MainTabs → OnboardingFlow 전환.
            //   오버레이가 가려주므로 사용자는 깔끔한 fade 만 봄.
            if resetCoordinator.isResetting {
                ResetAnimationOverlay(progress: resetCoordinator.progress)
                    .transition(.opacity)
                    .zIndex(999)
            }
        }
        .animation(.easeInOut(duration: 0.35), value: resetCoordinator.isResetting)
        // 비밀번호 재설정 딥링크 — 메일 링크(foundone://auth/reset?code=…)가 앱을 다시 열면
        //   복구 세션을 만들고 isPasswordRecovery=true → 아래 cover 로 앱 내 새 비번 화면 표시.
        .onOpenURL { url in
            guard url.scheme == "foundone" else { return }
            Task { await coordinator.handlePasswordRecoveryURL(url) }
        }
        .fullScreenCover(isPresented: Binding(
            get: { coordinator.isPasswordRecovery },
            set: { presented in
                // 인터랙티브 dismiss 로 닫히면 복구 세션 정리 (정상 완료는 completePasswordRecovery 가 직접 해제).
                if !presented && coordinator.isPasswordRecovery {
                    Task { await coordinator.cancelPasswordRecovery() }
                }
            }
        )) {
            ResetPasswordView(coordinator: coordinator)
        }
    }

    @MainActor
    /// business_profiles.user_role 1행 조회 — 역할 게이트 해제.
    ///   실패·행 없음은 "owner"(기존 iOS 동작 유지 — 웹은 역할선택 화면이 backstop, iOS 신규가입은 웹에서 처리).
    private func resolveUserRole() async {
        // 진입 시 실패 상태를 리셋 — 안 하면 과거 실패가 남아, 이후 계정 전환으로 게이트가
        //   열릴 때 조회를 시도조차 않고 "불러오지 못했어요" 화면에 갇힌다 (2026-08-01 감사)
        roleResolveFailed = false
        guard let uid = BUSupabase.shared.currentUser?.id else {
            // 세션 복원 타이밍에 currentUser 가 아직 비어 있을 수 있다. 조용히 빠져나가면
            //   .task 가 재실행되지 않아 스켈레톤에 영구히 갇힌다(= fail-open 을 fail-hang 으로 바꾼 셈).
            //   짧게 기다렸다 한 번 더 보고, 그래도 없으면 재시도 화면으로.
            try? await Task.sleep(nanoseconds: 600_000_000)
            guard let retryUid = BUSupabase.shared.currentUser?.id else {
                roleResolveFailed = true
                return
            }
            await resolveRole(for: retryUid)
            return
        }
        await resolveRole(for: uid)
    }

    @MainActor
    private func resolveRole(for uid: UUID) async {
        struct Row: Decodable { let user_role: String? }
        func fetchRole() async throws -> String {
            let rows: [Row] = try await BUSupabase.shared.client
                .from("business_profiles")
                .select("user_role")
                .eq("user_id", value: uid.uuidString)
                .limit(1)
                .execute().value
            // 행 없음 = 프로필 미생성 레거시/신규 계정 → owner 가 정상 기본값 (실패가 아님)
            return rows.first?.user_role ?? "owner"
        }
        do {
            userRole = try await fetchRole()
        } catch {
            // 일시 오류 가능성 → 1회 재시도 후에도 실패면 owner 가정 대신 재시도 화면.
            //   (2026-07-13 hire_date 사고 교훈: 에러 ≠ 기본값 — 에러는 재시도 상태로)
            try? await Task.sleep(nanoseconds: 800_000_000)
            do {
                userRole = try await fetchRole()
            } catch {
                roleResolveFailed = true
                return   // 초대 확인도 역할 확정 후에만
            }
        }
        // 지정 초대가 와 있으면 초대장 자동 표시 — 역할 무관.
        //   종전엔 사장(미지정)만 체크해, 이미 staff 인 계정이 (연결이 끊긴 뒤) 새 초대를 받아도
        //   못 봤음(버그, 2026-07-13). 연결이 끊긴 직원의 재수락(재연결) 경로가 여기서 열린다.
        await offerPendingInviteIfAny()
    }

    /// my_pending_invites 체크 — 있으면 초대장 시트 (마이그레이션 20260712 미적용 환경에선 조용히 skip).
    private func offerPendingInviteIfAny() async {
        guard offeredInvite == nil else { return }
        let repo = TeamRepository(supabase: BUSupabase.shared.client)
        guard let invites = try? await repo.pendingInvites() else { return }
        if let first = invites.first(where: { !dismissedInviteCodes.contains($0.inviteCode) }) {
            offeredInvite = first
        }
    }

    private func loadDashboardIfNeeded(coordinator: AuthCoordinator) async {
        guard let session = coordinator.currentSession, dashboardStore == nil else { return }

        // 콜드 런치 시에도 다른 기기 초기화를 감지해 stale 로컬을 비운다(이후 빈 서버 로드 → 온보딩).
        //   dashboardStore 생성 전이라 roadmapStore.decisions(@AppStorage)로 hasLocalData 판단.
        _ = await checkResetMarkerAndWipe()

        let supabase = BUSupabase.shared.client
        let userId = session.userId

        let dailyRepo = DailyEntryRepository(
            supabase: supabase,
            getUserId: { userId }
        )
        let costsRepo = MonthlyCostsRepository(
            supabase: supabase,
            getUserId: { userId }
        )
        let store = DashboardStore(dailyRepo: dailyRepo, costsRepo: costsRepo)
        await store.loadAll()

        // 로드맵 cluster hydration 용 — 원격 업종 (아래 do 블록에서 채움).
        var remoteCategoryId: String?
        var remoteSubIndustryId: String?
        var remoteStartupType: String?

        do {
            let dashboardRepo = UserDashboardRepository(
                supabase: supabase,
                userId: userId,
                fallbackUserName: session.displayName ?? session.email ?? "사장님"
            )
            let snapshot = try await dashboardRepo.fetchSnapshot()
            store.applyRemoteData(
                profile: snapshot.profile,
                entries: snapshot.entries,
                costs: snapshot.costs
            )
            remoteCategoryId = snapshot.industryCategoryId
            remoteSubIndustryId = snapshot.subIndustryId
            remoteStartupType = snapshot.startupType
            profileSubIndustryId = snapshot.subIndustryId
        } catch {
            store.recordError("Supabase 데이터 로딩 실패: \(Self.readableError(error))")
            store.setProfile(
                storeName: "내 가게",
                userName: session.displayName ?? session.email ?? "사장님",
                daysSinceLaunch: 0,
                category: .general,
                currentCash: nil,
                businessLaunched: false
            )
        }
        self.dashboardStore = store

        // 현금흐름 store — store.category 기반 업종 기본 채널 믹스로 초기화 후 Supabase hydrate.
        //   webCategoryId: iOS IndustryCategory → 웹 카테고리 id (presets 키와 동일, 예: "food").
        let cashflowRepo = CashflowRepository(supabase: supabase, userId: userId)
        let cashflow = CashflowStore(
            repository: cashflowRepo,
            defaultCategoryKey: webCategoryId(from: store.category)
        )
        await cashflow.load()
        self.cashflowStore = cashflow

        // 자동수집 매출 통합 — PortOne·TossPlace·CODEF·팝빌 일별 매출을 구간별 합산해 매출 카드에 반영.
        //   basis = cashflow_settings.revenueBasis (웹·iOS 공용). 매출 카드는 store.entries 를 읽으므로
        //   머지만 하면 UI 변경 없이 자동 합산값이 즉시 표시된다. best-effort(실패 시 수동 entries 유지).
        let unifiedService = UnifiedRevenueService(supabase: supabase)
        let unified = await unifiedService.fetch(basis: cashflow.settings.revenueBasis, fromDays: 30)
        store.mergeAutoEntries(
            unified.entries, sourceCount: unified.sources.count,
            breakdown: unified.breakdown, cardOverlap: unified.cardOverlap,
            hasPopbill: unified.sources.popbill, basis: unified.basis
        )

        // 코칭 일지 — 웹과 동일 Supabase coaching_history 테이블. 14일 로드 (best-effort).
        let coachingRepo = CoachingHistoryRepository(supabase: supabase, getUserId: { userId })
        let coaching = CoachingHistoryStore(repository: coachingRepo)
        await coaching.load()
        self.coachingStore = coaching

        // SaaS 사용자 지표 — 웹과 동일 Supabase saas_metrics_daily. 스타트업만 fetch, 그 외 빈 결과.
        let saasRepo = SaasMetricsRepository(supabase: supabase, getUserId: { userId })
        let saas = SaasMetricsStore(repository: saasRepo)
        await saas.load(isStartup: store.category == .startupTech)
        self.saasStore = saas

        // 구독 운영 상태 — 웹과 동일 Supabase user_store_data(uses_subscriptions/subscription_plans).
        let subRepo = StoreProfileRepository(supabase: supabase, userId: userId)
        let subscription = SubscriptionStore(repository: subRepo)
        await subscription.load()
        self.subscriptionStore = subscription

        // 내 가게 store — Supabase 연결 + 즉시 load.
        // MyStoreView 의 .task { store.load() } 가 다시 호출돼도 isLoaded guard 로 no-op.
        let storeInfoRepo = StoreInfoRepository(
            supabase: supabase,
            getUserId: { userId }
        )
        let storeInfo = StoreInfoStore(repository: storeInfoRepo)
        await storeInfo.load()
        // 기존 가게 등록 경로 — 등록 시 수집한 StoreInfo 필드 적용 (Supabase 아직 없는 경우)
        if let reg = pendingRegistration {
            storeInfo.commit { s in
                // 가게 세팅 미션 마커 — "기존 가게 등록" 경로 식별 (로드맵·AI 위저드 유저 카드 오노출 금지)
                s.industrySpecifics["__setupMeta"] = AnyCodableValue(AnyCodable(.object([
                    "path": AnyCodable(.string("existing")),
                    "registeredAt": AnyCodable(.string(ISO8601DateFormatter().string(from: Date()))),
                ])))
                if !reg.weeklyHolidays.isEmpty   { s.weeklyHolidays = reg.weeklyHolidays }
                if !reg.addressRoad.isEmpty       { s.addressRoad = reg.addressRoad }
                if !reg.bizRegistrationNumber.isEmpty { s.bizRegistrationNumber = reg.bizRegistrationNumber }
                if !reg.obtainedPermits.isEmpty {
                    s.permits = reg.obtainedPermits.map {
                        Permit(id: $0.id, name: $0.name)
                    }
                }
            }
            await storeInfo.flushImmediate()
            // 월 비용
            if reg.monthlyCosts.total > 0 {
                await store.upsertCosts(reg.monthlyCosts)
            }
            pendingRegistration = nil
        }
        self.storeInfoStore = storeInfo

        // 로드맵 store 도 Supabase 연결 — 기존 로컬 decisions 보존 + 원격 hydrate.
        let roadmapRepo = RoadmapDecisionsRepository(
            supabase: supabase,
            getUserId: { userId }
        )
        let connectedRoadmap = RoadmapStore(repo: roadmapRepo)
        connectedRoadmap.pathProvider = { raw in
            let c = BusinessCluster(rawValue: raw) ?? .offlineFood
            return RoadmapSampleData.stageIds(for: c)
        }
        // ⚠️ cluster(=로드맵 경로 선택자)를 원격 업종에서 hydrate. 이게 없으면 웹에서 업종 선택한
        //   사용자가 iOS 로그인 시 cluster 가 기본값(offline-food)에 머물러, syncFromRemote 로 받은
        //   stage_decisions 가 경로에 매핑되지 않아 진행도가 틀어진다. (decisions 머지보다 먼저 실행)
        Self.hydrateRoadmapIndustry(categoryId: remoteCategoryId, subIndustryId: remoteSubIndustryId, startupType: remoteStartupType, into: connectedRoadmap)
        self.roadmapStore = connectedRoadmap
        await connectedRoadmap.syncFromRemote()
        #if DEBUG
        // 투영 커버리지 감사 — stage 입력이 정식 컬럼에 반영됐는지 경고(개발 빌드 전용, best-effort).
        await connectedRoadmap.auditProjectionCoverage()
        #endif

        // 2단계 실시간 동기화 — user_store_data·business_profiles 본인 행 변경 구독.
        //   수신 시 .buildupRemoteDataChanged 알림 → onReceive 가 refreshAllFromRemote 호출.
        if realtimeSync == nil {
            let rt = RealtimeSyncManager(client: supabase, userId: userId.uuidString.lowercased())
            self.realtimeSync = rt
            await rt.start()
        }

        // owner 프로필 서버 복원 — 기기 전환·재설치 시 birthYear/ncbScore/closure/disabled 보존.
        //   best-effort: KEK 미설정·네트워크 실패 시 로컬 UserDefaults 값 유지.
        let ownerSync = OwnerProfileSyncRepository(supabase: supabase)
        await ownerSync.load()
    }

    /// 포그라운드 복귀 시 원격 재동기화 — 웹·다른 기기에서 저장한 내용을 앱에 반영.
    ///   순서: (1) 미저장 로컬 편집 flush → (2) 재조회. 기존 store 인스턴스에 재주입(재생성 X).
    ///   syncFromRemote 는 key-merge(로컬-only 입력 보존), storeInfo.refresh 는 flush-우선이라
    ///   진행 중 편집을 덮어쓰지 않는다. best-effort — 네트워크 오류는 무시(기존 값 유지).
    /// 다른 기기 초기화(core 행 DELETE) 수신 → 로컬을 따라서 비운다 (performReset 의 로컬 정리와 동일).
    ///   refreshAllFromRemote(flush-우선/key-merge)를 타면 stale 로컬이 서버에 부활하므로 이 경로를 쓴다.
    @MainActor
    private func wipeLocalForRemoteReset() {
        dashboardStore?.resetAll()
        roadmapStore.clearAllAppStorage()
        storeInfoStore?.reset()
    }

    private struct ResetMarkerRow: Decodable { let reset_at: String }

    /// 초기화 표식(tombstone) 확인 — 서버 reset_at 이 내가 마지막으로 본 값보다 최신이면 = 다른 기기에서
    ///   초기화됨 → 로컬을 *따라서* 비운다(부활 차단). realtime DELETE 전달 여부와 무관한 권위적 신호.
    ///   표 부재(마이그레이션 미적용)·네트워크 오류 시 graceful no-op. wipe 했으면 true 반환.
    @MainActor
    private func checkResetMarkerAndWipe() async -> Bool {
        guard let session = coordinator.currentSession else { return false }
        let uid = session.userId.uuidString.lowercased()
        var serverResetAt: String?
        do {
            let rows: [ResetMarkerRow] = try await BUSupabase.shared.client
                .from("account_reset_markers")
                .select("reset_at")
                .eq("user_id", value: uid)
                .limit(1)
                .execute()
                .value
            serverResetAt = rows.first?.reset_at
        } catch {
            return false
        }
        guard let serverResetAt else { return false }
        let seen = UserDefaults.standard.string(forKey: "account.reset.seen")
        guard seen == nil || serverResetAt > seen! else { return false }
        // 로컬에 실제 데이터(로드맵 진행·매출 입력)가 있을 때만 wipe. 빈 상태면 표식만 적용.
        let hasLocalData = !roadmapStore.decisions.isEmpty || !(dashboardStore?.entries.isEmpty ?? true)
        if hasLocalData { wipeLocalForRemoteReset() }
        UserDefaults.standard.set(serverResetAt, forKey: "account.reset.seen")
        return hasLocalData
    }

    private func refreshAllFromRemote() async {
        guard let session = coordinator.currentSession else { return }
        // 다른 기기 초기화 표식 확인 — 감지 시 로컬 wipe 후 flush-우선 refresh 스킵(stale 부활 차단).
        if await checkResetMarkerAndWipe() { return }
        let supabase = BUSupabase.shared.client
        let userId = session.userId

        // 1. 내 가게 — 미저장분 flush 후 재조회 (웹에서 바꾼 상호명·주소·서류 등 반영)
        await storeInfoStore?.refresh()

        // 2. 로드맵 decisions/stage 입력 — 원격과 key-merge (웹에서 완료한 단계 반영)
        await roadmapStore.syncFromRemote()

        // 3. 대시보드 스냅샷 — 프로필(상호명·업종·영업여부)·매출·비용 재조회
        if let store = dashboardStore {
            do {
                let repo = UserDashboardRepository(
                    supabase: supabase,
                    userId: userId,
                    fallbackUserName: session.displayName ?? session.email ?? "사장님"
                )
                let snapshot = try await repo.fetchSnapshot()
                store.applyRemoteData(
                    profile: snapshot.profile,
                    entries: snapshot.entries,
                    costs: snapshot.costs
                )
                // 업종 변경(웹·다른 기기)도 로드맵 경로에 반영 — cluster re-hydrate.
                Self.hydrateRoadmapIndustry(categoryId: snapshot.industryCategoryId, subIndustryId: snapshot.subIndustryId, startupType: snapshot.startupType, into: roadmapStore)
                // 오퍼링 탭 라벨도 세부업종 변경을 따라오도록 갱신 (nil 이면 기존 값 보존 — hydrate 와 동일 방침).
                if let sub = snapshot.subIndustryId { profileSubIndustryId = sub }
            } catch { /* best-effort — 기존 값 유지 */ }
        }

        // 4. 코칭 일지 — 웹·다른 기기에서 저장한 일지가 즉시 반영되게.
        //   coaching_history 는 realtime publication 에 포함(20260607_000002 마이그레이션)되므로
        //   포그라운드 복귀·realtime 이벤트 시 항상 최신 14일치를 재조회한다.
        await coachingStore?.load()

        // 5. 현금흐름 설정 — user_store_data(cashflow_settings) 기반. realtime 발화하므로 재조회.
        //   load() 는 isLoaded 가드로 no-op 이라 가드 우회하는 refresh() 사용.
        await cashflowStore?.refresh()

        // 6. 구독 운영 — user_store_data(uses_subscriptions/subscription_plans). load() 가 매번 재조회.
        await subscriptionStore?.load()

        // 7. SaaS 사용자 지표 — saas_metrics_daily(스타트업만). 포커스 복귀 시 최신 수집분 반영.
        if let store = dashboardStore {
            await saasStore?.load(isStartup: store.category == .startupTech)
        }

        // 8. owner 프로필(birthYear/ncbScore/closure/disabled) — 웹 connectAndLoad 와 패리티.
        //   봉투암호화 API 경유, best-effort. 변경 빈도 낮으나 기기 전환 시 최신 유지.
        let ownerSync = OwnerProfileSyncRepository(supabase: supabase)
        await ownerSync.load()

        // 9. 자동수집 매출 재합산 — 위 applyRemoteData(수동 entries) 후 자동매출 overlay.
        //    포커스 복귀·realtime 시 PortOne·TossPlace 등 최신 매출이 매출 카드에 반영.
        if let store = dashboardStore {
            let unifiedService = UnifiedRevenueService(supabase: supabase)
            let unified = await unifiedService.fetch(basis: cashflowStore?.settings.revenueBasis, fromDays: 30)
            store.mergeAutoEntries(
                unified.entries, sourceCount: unified.sources.count,
                breakdown: unified.breakdown, cardOverlap: unified.cardOverlap,
                hasPopbill: unified.sources.popbill, basis: unified.basis
            )
        }
    }

    /// 로딩 완료 전 임시 — 빈 state. load() 가 끝나면 즉시 storeInfoStore 가 set 되어
    /// MainTabs 가 새 store 로 리렌더됨. (FallbackRepo 는 read 시 즉시 빈 state 반환.)
    @MainActor
    private static func makeFallbackStoreInfo() -> StoreInfoStore {
        StoreInfoStore(repository: FallbackStoreInfoRepository())
    }

    /// 원격 업종(business_profiles)에서 로드맵 cluster/selectedIndustryId 를 hydrate.
    /// 웹·다른 기기에서 선택한 업종을 iOS 로드맵 경로에 반영 — 진행도 매핑 정합성의 핵심.
    /// 세부 업종 id 가 있으면 정밀 cluster(딥테크 포함), 카테고리만 있으면 coarse 매핑.
    /// 원격 업종 정보가 전혀 없으면 로컬 유지(온보딩 중 사용자 보호).
    @MainActor
    private static func hydrateRoadmapIndustry(categoryId: String?, subIndustryId: String?, startupType: String? = nil, into roadmap: RoadmapStore) {
        let ud = UserDefaults.standard
        // 창업유형 hydrate — franchise 분기(RoadmapStage.pathFor)가 이 UD 키를 읽어 franchise-application
        //   단계를 삽입. 웹에서 franchise 로 온보딩한 사용자가 iOS 로그인 시 단계 누락되던 것 복원.
        //   (빈/nil 이면 기존 로컬값 보존 — 덮어쓰지 않음.)
        if let st = startupType, !st.isEmpty {
            ud.set(st, forKey: "stage.startupType.selected")
        }
        if let sub = subIndustryId, let option = StarterIndustryData.option(by: sub) {
            let clusterRaw = StarterIndustryData.cluster(for: option)
            ud.set(clusterRaw, forKey: "roadmap.cluster")
            ud.set(option.id, forKey: "roadmap.selectedIndustryId")
            roadmap.setCluster(clusterRaw)
        } else if let cat = categoryId, !cat.isEmpty {
            let clusterRaw: String
            switch cat {
            case "online-digital": clusterRaw = "online-digital"
            case "startup-tech":   clusterRaw = "startup-tech"
            default:               clusterRaw = "offline-food"
            }
            ud.set(clusterRaw, forKey: "roadmap.cluster")
            roadmap.setCluster(clusterRaw)
        }
    }

    private static func readableError(_ error: any Error) -> String {
        if let localized = (error as? any LocalizedError)?.errorDescription {
            return localized
        }
        return String(describing: error)
    }

    /// 신규 사장님 판정 — 아직 아무 진입 액션도 안 한 상태:
    ///   · category == .general (업종 미선택)
    ///   · businessLaunched == false (영업 미시작)
    ///   · entries / costs 모두 비어있음 (운영 데이터 0)
    ///   · roadmap.selectedIndustryId 빈값 (manual wizard 시작 안 함)
    ///
    /// ⚠️ 2026-05-21 사장님 신고: "나갔다 들어오면 항상 온보딩 페이지가 나옴".
    ///   원인: manual 모드는 wizard 끝까지 완주해야 DashboardStore.category 가 세팅됨.
    ///   사용자가 industry-selection 후 앱 종료 → 다시 켜면 category == .general → 온보딩 노출.
    ///   → roadmap.selectedIndustryId 영속값을 추가 신호로 확인하여 wizard 진행 중인 사용자는
    ///     로드맵 홈으로 바로 복귀시킨다.
    @MainActor
    private func needsOnboarding(store: DashboardStore) -> Bool {
        #if DEBUG
        // 디자인 검증용 — BU_DEMO_ONBOARDING=1 → 데이터 있어도 OnboardingFlow 강제.
        //   SIMCTL_CHILD_BU_DEMO_ONBOARDING=1 xcrun simctl launch ...
        if ProcessInfo.processInfo.environment["BU_DEMO_ONBOARDING"] == "1" {
            return true
        }
        #endif
        // Manual wizard 진입 자국: 사용자가 업종 선택 1번이라도 했으면 온보딩 X.
        let industryPicked = !(UserDefaults.standard.string(forKey: "roadmap.selectedIndustryId") ?? "").isEmpty
        if industryPicked { return false }

        return store.category == .general
            && !store.businessLaunched
            && store.entries.isEmpty
            && store.costs.total == 0
    }
}

// MARK: - FallbackStoreInfoRepository
//
// MyStoreView 가 storeInfoStore 가 nil 일 때 즉시 빈 state 로 렌더되도록 하는
// no-op 저장소. load() 는 빈 state 반환, save() 는 silent no-op (실제 동기화는
// loadDashboardIfNeeded 가 끝나면 real StoreInfoStore 로 swap).
private actor FallbackStoreInfoRepository: StoreInfoRepositoryProtocol {
    func load() async throws -> StoreInfoState { StoreInfoState() }
    func save(_ state: StoreInfoState) async throws {}
}

// MARK: - OnboardingFlow — 3 선택 → 업종 선택 / 기존 가게 / AI 로드맵

private struct OnboardingFlow: View {
    let store: DashboardStore
    @Binding var selectedTab: AppRoot.Tab
    @Binding var pendingRegistration: StoreRegistration?
    @Environment(RoadmapStore.self) private var roadmapStore

    @State private var path: OnboardingPath? = nil
    /// Wizard navigation path — stage view 끼리 자동 chain.
    @State private var wizardPath: [String] = []

    var body: some View {
        Group {
            switch path {
            case .none:
                OnboardingChoiceView { choice in
                    path = choice
                }
            case .manual:
                // ⚠️ 2026-05-20 단순화 (사장님 신고: 대분류·세부업종 두 화면 중복):
                //   기존: IndustrySelectionView (대분류 12) → IndustrySelectionStageView (세부 + 대분류 탭) → wizard
                //   현재: 곧바로 IndustrySelectionStageView 만 표시 — 11 카테고리 탭이 이미 대분류 역할.
                //         사용자는 탭 + 카드 선택 한 화면에서 끝.
                NavigationStack(path: $wizardPath) {
                    IndustrySelectionStageView()
                        .environment(\.wizardOnAdvance, advanceClosure())
                        .navigationDestination(for: String.self) { stageId in
                            wizardStageView(for: stageId)
                                .environment(\.wizardOnAdvance, advanceClosure())
                        }
                        .toolbar {
                            ToolbarItem(placement: .topBarLeading) {
                                Button {
                                    if wizardPath.isEmpty {
                                        path = nil                  // OnboardingChoice 로 복귀
                                    } else {
                                        wizardPath.removeLast()
                                    }
                                } label: {
                                    Image(systemName: "chevron.left")
                                        .font(.system(size: 17, weight: .semibold))
                                }
                                .accessibilityLabel("뒤로")
                            }
                        }
                }
            case .existing:
                ExistingStoreRegistrationView(
                    onComplete: { reg in
                        // DashboardStore — 즉시 적용 가능
                        store.setProfile(
                            storeName: reg.storeName,
                            userName: store.userName,
                            daysSinceLaunch: reg.daysSinceLaunch,
                            category: reg.category,
                            currentCash: nil,
                            businessLaunched: true
                        )
                        // 웹·앱 SSOT: 상호명을 Supabase 에도 저장 → 웹에서 동일하게 표시.
                        StoreProfileRepository.persistStoreNameForCurrentUser(reg.storeName)
                        // 웹·앱 SSOT: 업종·창업유형·영업개시도 Supabase 에 즉시 반영.
                        OnboardingProfileSync.persistIndustry(
                            categoryId: StarterIndustryData.option(by: reg.industryOptionId)?.categoryId,
                            subIndustryId: reg.industryOptionId,
                            startupType: reg.startupType
                        )
                        OnboardingProfileSync.persistBusinessLaunched(
                            true,
                            launchedDate: Calendar.current.date(byAdding: .day, value: -reg.daysSinceLaunch, to: Date())
                        )

                        // AppStorage 키 — UserDefaults 직접 기록
                        // (RoadmapStage 뷰들이 @AppStorage 로 이 값을 읽음)
                        let ud = UserDefaults.standard
                        // 로드맵 cluster
                        ud.set(StarterIndustryData.cluster(
                            for: StarterIndustryData.options.first { $0.id == reg.industryOptionId }
                                ?? StarterIndustryData.options[0]
                        ), forKey: "roadmap.cluster")
                        ud.set(reg.industryOptionId, forKey: "roadmap.selectedIndustryId")
                        ud.set(reg.startupType, forKey: "stage.startupType.selected")
                        // 세무·보험
                        ud.set(reg.vatType, forKey: "reg.taxTypeChoice")
                        ud.set(reg.cpaDecision, forKey: "insTax.cpaChoice")
                        // 영업 시간 (BusinessModelStage AppStorage 키)
                        if let openHour = Int(reg.businessOpenTime.prefix(2)) {
                            ud.set(openHour, forKey: "stage.bizModel.openHour")
                        }
                        if let closeHour = Int(reg.businessCloseTime.prefix(2)) {
                            ud.set(closeHour, forKey: "stage.bizModel.closeHour")
                        }
                        // POS
                        if !reg.posId.isEmpty && reg.posId != "none" {
                            ud.set(reg.posId, forKey: "ops.pos.selected")
                        }
                        // 운영 방식 (2026-07-28 온보딩 개편 — BusinessModelStage AppStorage 키와 동일)
                        if !reg.businessModelId.isEmpty {
                            ud.set(reg.businessModelId, forKey: "stage.bizModel.selected")
                        }
                        // 배달 플랫폼
                        for pid in reg.deliveryPlatforms {
                            ud.set(true, forKey: "ops.delivery.\(pid)")
                        }
                        // SNS
                        for sid in reg.snsChannels {
                            ud.set(true, forKey: "ops.sns.\(sid)")
                        }

                        // StoreInfo / 비용 — loadDashboardIfNeeded 이후에 적용
                        pendingRegistration = reg

                        if reg.wantsDataConnect {
                            // 진단 "지금 연동하러 가기" — 내 정보 탭 + 데이터 연결 시트 자동 오픈 (ProfileView 가 소비)
                            ud.set(true, forKey: "bu.openDataConnect")
                            selectedTab = .profile
                        } else {
                            selectedTab = .home  // 운영 대시보드로
                        }
                    },
                    onBack: { path = nil }
                )
            case .ai:
                AIRoadmapWizardView(
                    webAppURL: BUSupabase.shared.env.webAppURL,
                    onComplete: { result, nameInput in
                        let parsed = result.parsed
                        // cluster: industryCategoryId → BusinessCluster rawValue
                        let clusterRaw: String
                        switch parsed.industryCategoryId {
                        case "online-digital": clusterRaw = "online-digital"
                        case "startup-tech":   clusterRaw = "startup-tech"
                        default:               clusterRaw = "offline-food"
                        }
                        // ⚠️ franchise 분기(RoadmapStage.pathFor)는 이 UD 키를 읽음 → setCluster/path 계산 전에 먼저 기록.
                        let ud = UserDefaults.standard
                        if !parsed.startupType.isEmpty { ud.set(parsed.startupType, forKey: "stage.startupType.selected") }
                        if !parsed.subIndustryId.isEmpty { ud.set(parsed.subIndustryId, forKey: "roadmap.selectedIndustryId") }
                        ud.set(clusterRaw, forKey: "roadmap.cluster")
                        roadmapStore.setCluster(clusterRaw)

                        // 상호명: 사용자 입력 → AI 추천 → 기본값
                        let aiName = result.identity?.suggestedStoreName ?? ""
                        let finalName = !nameInput.isEmpty ? nameInput : (!aiName.isEmpty ? aiName : "내 가게")

                        // industryCategoryId → IndustryCategory
                        let cat: IndustryCategory
                        switch result.parsed.industryCategoryId {
                        case "food":           cat = .restaurant
                        case "cafe-dessert":   cat = .cafe
                        case "retail":         cat = .retail
                        case "beauty":         cat = .beauty
                        case "fitness":        cat = .fitness
                        case "education":      cat = .education
                        case "pet":            cat = .pet
                        case "living-service": cat = .livingService
                        case "space":          cat = .space
                        case "online-digital": cat = .ecommerce
                        case "startup-tech":   cat = .startupTech
                        default:               cat = .restaurant
                        }
                        store.setProfile(
                            storeName: finalName,
                            userName: store.userName,
                            daysSinceLaunch: 0,
                            category: cat,
                            currentCash: nil,
                            businessLaunched: false
                        )
                        // 웹·앱 SSOT: 상호명을 Supabase 에도 저장 → 웹에서 동일하게 표시.
                        StoreProfileRepository.persistStoreNameForCurrentUser(finalName)
                        // 웹·앱 SSOT: AI 위저드 결과(업종·세부업종·창업유형·자본)를 business_profiles 에 반영.
                        //   (종전 버그: subIndustryId=nil·startupType 미전달 → 세부업종·창업유형 유실.)
                        OnboardingProfileSync.persistIndustry(
                            categoryId: parsed.industryCategoryId,
                            subIndustryId: parsed.subIndustryId.isEmpty ? nil : parsed.subIndustryId,
                            startupType: parsed.startupType.isEmpty ? nil : parsed.startupType,
                            capitalKrw: result.budgetAllocation.displayTotal > 0 ? result.budgetAllocation.displayTotal : nil
                        )
                        OnboardingProfileSync.persistBusinessLaunched(false)

                        // 웹 패리티(useOnboardingHandlers, 2026-08-03 인수인계 감사로 재정렬):
                        //   완료 = 위저드에서 실제 검토한 기획 3단계(업종·형태·운영방식)만 — 연속이라
                        //   heal 이 사이를 못 메꾼다. 예산·타깃고객·입지는 **프리필만**(완료는 사용자) —
                        //   완료를 띄엄띄엄 찍으면 heal 무단완료·4→6 점프가 생긴다(웹 감사 F1·F2).
                        if !parsed.subIndustryId.isEmpty {
                            roadmapStore.completeStage(
                                "industry-selection",
                                inputs: ["subIndustryId": parsed.subIndustryId, "categoryId": parsed.industryCategoryId],
                                selectedPrimaryOptionId: parsed.subIndustryId
                            )
                        }
                        if !parsed.startupType.isEmpty {
                            roadmapStore.completeStage("startup-type", selectedPrimaryOptionId: parsed.startupType)
                        }
                        if let model = parsed.businessModelId, !model.isEmpty {
                            roadmapStore.completeStage("business-model", selectedPrimaryOptionId: model)
                        }
                        // 예산 두 통 분리 (웹과 동일): total 에서 ②운영예비(workingCapital)를 뺀 ①만 capital
                        let total = result.budgetAllocation.displayTotal
                        let working = result.budgetAllocation.workingCapital
                        let facility = (working > 0 && working < total) ? total - working : total
                        if facility > 0 {
                            var budgetInputs = ["capital": String(facility), "aiGenerated": "true"]
                            if let open = result.timeline.targetOpenDate, !open.isEmpty {
                                budgetInputs["targetOpenDate"] = open
                            }
                            roadmapStore.prefillStage("budget-setup", inputs: budgetInputs)
                        }
                        if let target = result.identity?.targetCustomer, !target.isEmpty {
                            roadmapStore.prefillStage("target-customer-definition", inputs: ["targetCustomer": target])
                        }
                        if !parsed.preferredRegion.isEmpty {
                            // 입지는 발품 전 — 완료 금지 (웹 2026-08-02 P1 수정의 iOS 미러)
                            roadmapStore.prefillStage(
                                "location-candidates",
                                inputs: ["preferredRegion": parsed.preferredRegion, "selectionMode": "direct"]
                            )
                        }
                        // AI 추천 공급처·장비·POS·인테리어 시공 → vendor-setup 프리필
                        // (웹 useOnboardingHandlers 미러, 2026-08-05 감사 후속 — 종전엔 iOS 에서 통째로 버려짐)
                        AIVendorHandoff.apply(
                            result: result,
                            subIndustryId: parsed.subIndustryId,
                            categoryId: parsed.industryCategoryId
                        )
                        selectedTab = .roadmap
                    },
                    onBack: { path = nil }
                )
            }
        }
    }

    /// Wizard chain 의 핵심 클로저 — stage 완료 후 호출:
    ///   1. 다음 stageId 가 있으면 wizardPath 에 push → 자동 navigation.
    ///   2. 없으면 wizard 종료 → category 저장 + main tab (.roadmap) 진입.
    ///
    /// ⚠️ 2026-05-20 fix: store.setProfile (category 저장) 을 wizard *끝날 때* 호출.
    ///   종전엔 industry-selection 직후 setProfile → needsOnboarding=false → OnboardingFlow
    ///   가 unmount → wizardPath State 손실 → 다음 stage push 실패 → MainTabs 의 RoadmapView 노출.
    private func advanceClosure() -> () -> Void {
        return {
            if let next = roadmapStore.currentStageId, !wizardPath.contains(next) {
                wizardPath.append(next)
            } else {
                // wizard 끝 — category 저장 + 메인 탭 진입
                let id = UserDefaults.standard.string(forKey: "roadmap.selectedIndustryId") ?? ""
                if let opt = StarterIndustryData.option(by: id),
                   let cat = Self.iosCategory(for: opt.categoryId) {
                    store.setProfile(
                        storeName: store.storeName.isEmpty ? "내 가게" : store.storeName,
                        userName: store.userName,
                        daysSinceLaunch: 0,
                        category: cat,
                        currentCash: nil,
                        businessLaunched: false
                    )
                    // 웹·앱 SSOT: 매뉴얼 위저드에서 정한 업종·창업유형도 business_profiles 에 반영.
                    OnboardingProfileSync.persistIndustry(
                        categoryId: opt.categoryId,
                        subIndustryId: id,
                        startupType: UserDefaults.standard.string(forKey: "stage.startupType.selected")
                    )
                    OnboardingProfileSync.persistBusinessLaunched(false)
                }
                selectedTab = .roadmap
            }
        }
    }

    /// StarterIndustryData.categoryId (kebab) → iOS IndustryCategory enum.
    private static func iosCategory(for categoryId: String) -> IndustryCategory? {
        switch categoryId {
        case "food":           return .restaurant
        case "cafe-dessert":   return .cafe
        case "retail":         return .retail
        case "beauty":         return .beauty
        case "fitness":        return .fitness
        case "education":      return .education
        case "pet":            return .pet
        case "living-service": return .livingService
        case "space":          return .space
        case "online-digital": return .ecommerce
        case "startup-tech":   return .startupTech
        default:               return nil
        }
    }

    /// IndustryCategory(iOS enum) → StarterIndustryData.categoryId (kebab/string).
    private static func starterCategoryId(for cat: IndustryCategory) -> String {
        switch cat {
        case .restaurant:    return "food"
        case .cafe:          return "cafe-dessert"
        case .beauty:        return "beauty"
        case .retail:        return "retail"
        case .ecommerce:     return "online-digital"
        case .fitness:       return "fitness"
        case .education:     return "education"
        case .pet:           return "pet"
        case .livingService: return "living-service"
        case .space:         return "space"
        case .startupTech:   return "startup-tech"
        case .general:       return "food"
        }
    }

}

private /// 역할 조회 실패 시 재시도 화면 — owner 로 가정하지 않는다 (fail-open 금지, 2026-08-01)
struct RoleResolveRetryView: View {
    let onRetry: () -> Void
    var body: some View {
        ZStack {
            BUBackgroundSurface()
            VStack(spacing: 14) {
                Image(systemName: "wifi.exclamationmark")
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(BUColor.inkSecondary)
                Text("계정 정보를 불러오지 못했어요")
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("네트워크 상태를 확인하고 다시 시도해 주세요.")
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkSecondary)
                Button(action: onRetry) {
                    Text("다시 시도")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 26).padding(.vertical, 12)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(24)
        }
    }
}

struct AuthenticatedLoadingView: View {
    var body: some View {
        ZStack {
            BUBackgroundSurface()
            VStack(spacing: 10) {
                ProgressView()
                    .controlSize(.regular)
                Text("워크스페이스를 불러오는 중")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
    }
}

// MARK: - MainTabs

private struct MainTabs: View {
    let store: DashboardStore
    /// 프로필 세부업종 — 오퍼링 탭 라벨 정밀 해석 (AppRoot 원격 스냅샷에서 주입, nil=미로드).
    let subIndustryId: String?
    @ObservedObject var storeInfo: StoreInfoStore
    /// nil = 아직 로드 전 (TodayView 가 mock 예측 카드로 fallback). 로드 후 게이팅 동작.
    let cashflow: CashflowStore?
    let coaching: CoachingHistoryStore?
    let saas: SaasMetricsStore?
    let subscription: SubscriptionStore?
    let coordinator: AuthCoordinator
    @Binding var selectedTab: AppRoot.Tab

    private var mockData: MockData {
        // 스타트업 신호용 — 모두 실데이터 기반(가짜 금지).
        let ratios = CostRatios.calculate(
            costs: store.costs,
            totalRevenue: store.entries.reduce(0) { $0 + $1.sales },
            days: store.entries.count
        )
        let monthlyNetBurn = store.costs.total - ratios.monthlyRevenueEquivalent
        let runway: Double? = {
            guard let cash = store.currentCash, cash > 0, monthlyNetBurn > 0 else { return nil }
            return cash / monthlyNetBurn
        }()
        let weeklyChange: Double? = {
            let sorted = store.entries.sorted { $0.date < $1.date }
            guard sorted.count >= 14 else { return nil }
            let r7 = sorted.suffix(7).reduce(0.0) { $0 + $1.sales }
            let p7 = sorted.suffix(14).prefix(7).reduce(0.0) { $0 + $1.sales }
            guard p7 > 0 else { return nil }
            return (r7 - p7) / p7 * 100
        }()
        return MockData(
            entries: store.entries,
            costs: store.costs,
            category: store.category,
            stage: store.stage,
            currentCash: store.currentCash,
            storeName: store.storeName,
            daysSinceLaunch: store.daysSinceLaunch,
            userName: store.userName,
            resolverInput: HeroResolverInput(
                ko: true,
                businessLaunched: store.businessLaunched,
                totalEntries: store.entries.count,
                daysSinceLastSalesEntry: store.daysSinceLastEntry,
                monthlyBurn: store.costs.total,
                categoryId: webCategoryId(from: store.category),
                runwayMonths: runway,
                weeklySalesChangePct: weeklyChange
            )
        )
    }

    var body: some View {
        // 세부업종 우선순위 — 웹 useComputedDashboard 미러(selectedIndustryId ?? profile.subIndustryId):
        //   UD "roadmap.selectedIndustryId"(위저드·원격 hydrate 공용 미러) → 프로필 스냅샷 폴백.
        let resolvedSubIndustryId: String? = {
            if let ud = UserDefaults.standard.string(forKey: "roadmap.selectedIndustryId"), !ud.isEmpty {
                return ud
            }
            return subIndustryId
        }()
        FoundOneMobileShell(
            selectedTab: $selectedTab,
            tabs: webSurfaceTabs(businessLaunched: store.businessLaunched, offeringCategoryId: mockData.resolverInput.categoryId, offeringSubIndustryId: resolvedSubIndustryId),
            bottomTabs: bottomQuickTabs(businessLaunched: store.businessLaunched, offeringCategoryId: mockData.resolverInput.categoryId, offeringSubIndustryId: resolvedSubIndustryId),
            // 사이드바 푸터 — 계정 정보 + 로그아웃 (웹 .bup-sidebar-footer 미러, 2026-08-14)
            accountName: coordinator.currentSession?.displayName,
            accountEmail: coordinator.currentSession?.email,
            onSignOut: { Task { await coordinator.signOut() } }
        ) {
            switch selectedTab {
            case .home:
                if store.businessLaunched {
                    TodayView(mock: mockData, dashboardStore: store, storeInfo: storeInfo, cashflowStore: cashflow, coaching: coaching, saas: saas, subscription: subscription, onSwitchTab: { selectedTab = $0 })
                } else {
                    PreLaunchHomeView(
                        store: store,
                        onOpenCurrentStage: { selectedTab = .roadmap }
                    )
                }
            case .current:
                RoadmapView()
            case .roadmap:
                RoadmapView()
            case .guides:
                GuidesView(store: store)
            case .franchise:
                FranchiseView()
            case .marketing:
                MarketingView(store: store, mock: mockData)
            case .tax:
                TaxView(store: store)
            case .reports:
                ReportsView(mock: mockData)
            case .finance:
                FinanceView(mock: mockData)
            case .offerings:
                OfferingsView(storeInfoStore: storeInfo, fallbackCategoryId: mockData.resolverInput.categoryId)
            case .analytics:
                MyStoreView(store: store, storeInfo: storeInfo)
            case .team:
                TeamManagementView(storeInfoStore: storeInfo)
            case .profile:
                ProfileView(store: store, coordinator: coordinator, storeInfo: storeInfo)
            }
        }
        .overlay(alignment: .bottom) {
            if let message = store.lastError {
                Text(message)
                    .font(.system(size: 11.5, weight: .semibold))
                    .foregroundStyle(BUColor.danger)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(BUColor.danger.opacity(0.22), lineWidth: 1)
                    )
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.bottom, 12)
            }
        }
    }
}

// MARK: - TodayDashboardView (DashboardStore 와 연결된 실제 Today)

private struct TodayDashboardView: View {
    @Bindable var store: DashboardStore

    var body: some View {
        // TodayView 는 MockData 기반 — 실제 데이터 연결은 향후 단계.
        // 일단 store 의 entries 로 mock 만들어서 전달.
        let mockData = MockData(
            entries: store.entries,
            costs: store.costs,
            category: store.category,
            stage: store.stage,
            currentCash: store.currentCash,
            storeName: store.storeName,
            daysSinceLaunch: store.daysSinceLaunch,
            userName: store.userName,
            resolverInput: HeroResolverInput(
                ko: true,
                businessLaunched: store.businessLaunched,
                totalEntries: store.entries.count,
                daysSinceLastSalesEntry: store.daysSinceLastEntry,
                monthlyBurn: store.costs.total
            )
        )

        TodayView(mock: mockData)
    }
}

// MARK: - Web-parity Mobile Shell

private struct FoundOneSurfaceTab: Identifiable, Sendable {
    let id: AppRoot.Tab
    let label: String
    let systemImage: String
}

private func webSurfaceTabs(businessLaunched: Bool, offeringCategoryId: String? = nil, offeringSubIndustryId: String? = nil) -> [FoundOneSurfaceTab] {
    // 오퍼링 탭 — 업종별 라벨(메뉴·재료/상품·재고/이용권·회원권…), hidden(startup-tech)은 미노출.
    //   SSOT: OfferingKindsRegistry(자동 생성). 세부업종 우선 해석(펫용품=상품·재고,
    //   스터디카페=이용권·회원권 등 categoryId 폴백과 다른 예외) — 웹 탭 라벨과 1:1.
    let offeringKind = BUOfferingKinds.resolve(subIndustryId: offeringSubIndustryId, categoryId: offeringCategoryId)
    let offeringTab: FoundOneSurfaceTab? = (businessLaunched && offeringKind != "hidden")
        ? .init(id: .offerings, label: BUOfferingKinds.metaFor(offeringKind)?.tabLabelKo ?? "내가 파는 것", systemImage: "tag")
        : nil
    return [
        .init(id: .home, label: "홈", systemImage: "house"),
        businessLaunched ? nil : .init(id: .current, label: "현재 단계", systemImage: "doc.text"),
        .init(id: .roadmap, label: "로드맵", systemImage: "list.bullet"),
        businessLaunched ? .init(id: .guides, label: "펀딩", systemImage: "doc.text.magnifyingglass") : nil,
        .init(id: .franchise, label: "프랜차이즈", systemImage: "storefront"),
        businessLaunched ? .init(id: .marketing, label: "마케팅", systemImage: "megaphone") : nil,
        businessLaunched ? .init(id: .tax, label: "세금", systemImage: "wonsign.circle") : nil,
        businessLaunched ? .init(id: .reports, label: "보고서", systemImage: "doc.richtext") : nil,
        businessLaunched ? .init(id: .finance, label: "재무", systemImage: "chart.xyaxis.line") : nil,
        offeringTab,
        businessLaunched ? .init(id: .analytics, label: "내 가게", systemImage: "chart.bar") : nil,
        businessLaunched ? .init(id: .team, label: "직원", systemImage: "person.2") : nil,
        .init(id: .profile, label: "내 정보", systemImage: "person.crop.circle"),
    ].compactMap { $0 }
}

/// 하단 고정 탭 4개 (2026-07-25 사장님 지시) — 자주 쓰는 페이지를 사이드바 없이 상시 노출.
///  HIG(2026-06-08 개정) 준수: 탭 바=top-level 내비게이션, 라벨 필수(짧게), filled 심볼 선호,
///  탭 수는 적게 + 복잡한 전체 구조는 사이드바 병행("consider a sidebar … as an alternative").
///  구성: 홈 / 로드맵(오픈 후엔 마케팅) / 직원 / 내 정보.
///  2026-07-27 시장조사(5곳 전부 "재고 관리 안 한다" + 인터뷰#1 "마케팅=1위 페인") 반영:
///  2번 슬롯 오퍼링 → 마케팅 교체. 오퍼링은 사이드바·대시보드 "자세히"로 접근 유지(강등이지 제거 아님).
///  세무·펀딩은 계절성·이벤트성이라 상시 탭 부적합 — 신고철엔 홈 알림이 담당.
///  ⚠️ HIG "Don't disable or hide tab bar buttons" — 2번 슬롯 교체는 세션 내 토글이 아니라
///  사업 단계(오픈 전/후) 기반 고정 구성이라 허용 범위 (재무·마케팅 탭 gating 과 동일 원칙).
private func bottomQuickTabs(businessLaunched: Bool, offeringCategoryId: String?, offeringSubIndustryId: String?) -> [FoundOneSurfaceTab] {
    let second: FoundOneSurfaceTab = businessLaunched
        ? .init(id: .marketing, label: "마케팅", systemImage: "megaphone.fill")
        : .init(id: .roadmap, label: "로드맵", systemImage: "map.fill")
    return [
        .init(id: .home, label: "홈", systemImage: "house.fill"),
        second,
        .init(id: .team, label: "직원", systemImage: "person.2.fill"),
        .init(id: .profile, label: "내 정보", systemImage: "person.crop.circle.fill"),
    ]
}

private struct FoundOneMobileShell<Content: View, Accessory: View>: View {
    @Binding var selectedTab: AppRoot.Tab
    @State private var sidebarOpen = false
    let tabs: [FoundOneSurfaceTab]
    /// 하단 고정 탭 (비어 있으면 미표시) — 전체 내비는 사이드바(tabs), 자주 쓰는 4개만 하단 상시.
    let bottomTabs: [FoundOneSurfaceTab]
    let accessory: Accessory
    let content: Content
    /// 사이드바 푸터 계정 정보 + 로그아웃 (실계정 쉘만 — 데모 쉘은 nil) 2026-08-14
    let accountName: String?
    let accountEmail: String?
    let onSignOut: (() -> Void)?

    init(
        selectedTab: Binding<AppRoot.Tab>,
        tabs: [FoundOneSurfaceTab],
        bottomTabs: [FoundOneSurfaceTab] = [],
        accountName: String? = nil,
        accountEmail: String? = nil,
        onSignOut: (() -> Void)? = nil,
        @ViewBuilder accessory: () -> Accessory,
        @ViewBuilder content: () -> Content
    ) {
        self._selectedTab = selectedTab
        self.tabs = tabs
        self.bottomTabs = bottomTabs
        self.accountName = accountName
        self.accountEmail = accountEmail
        self.onSignOut = onSignOut
        self.accessory = accessory()
        self.content = content()
    }

    var body: some View {
        ZStack {
            BUBackgroundSurface()
            VStack(spacing: 8) {
                FoundOneBrandBar(
                    accessory: accessory,
                    onOpenSidebar: { sidebarOpen = true }
                )
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, 6)

                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .accessibilityHidden(sidebarOpen)

            if sidebarOpen {
                Color.black.opacity(0.18)
                    .ignoresSafeArea()
                    .transition(.opacity)
                    .onTapGesture {
                        withAnimation(.snappy(duration: 0.24)) {
                            sidebarOpen = false
                        }
                    }

                HStack(spacing: 0) {
                    FoundOneLiquidSidebar(
                        tabs: tabs,
                        selectedTab: $selectedTab,
                        accountName: accountName,
                        accountEmail: accountEmail,
                        onSignOut: onSignOut.map { signOut in
                            {
                                withAnimation(.snappy(duration: 0.24)) { sidebarOpen = false }
                                signOut()
                            }
                        },
                        onClose: {
                            withAnimation(.snappy(duration: 0.24)) {
                                sidebarOpen = false
                            }
                        }
                    )
                    .transition(.move(edge: .leading).combined(with: .opacity))

                    Spacer(minLength: 0)
                }
                .ignoresSafeArea(edges: .vertical)
            }
        }
        .overlay(alignment: .bottom) {
            // 하단 고정 탭 바 — HIG: "floats above content … Liquid Glass background
            //   that allows content beneath to peek through". 사이드바 열림 중엔 숨김(모달 예외 규칙).
            if !bottomTabs.isEmpty && !sidebarOpen {
                FoundOneBottomTabBar(tabs: bottomTabs, selectedTab: $selectedTab)
                    .padding(.horizontal, 28)
                    .padding(.bottom, 6)
            }
        }
        .tint(BUColor.midnightInk)
        .animation(.snappy(duration: 0.24), value: sidebarOpen)
    }
}

/// 하단 플로팅 탭 바 — Liquid Glass(ultraThinMaterial) 캡슐 위 4탭.
///  HIG 준수: 아이콘 위 라벨(compact), filled 심볼, 선택 상태는 미드나잇 틴트(신호등 컬러 X).
private struct FoundOneBottomTabBar: View {
    let tabs: [FoundOneSurfaceTab]
    @Binding var selectedTab: AppRoot.Tab

    var body: some View {
        HStack(spacing: 2) {
            ForEach(tabs) { tab in
                let selected = selectedTab == tab.id
                Button {
                    withAnimation(.snappy(duration: 0.2)) { selectedTab = tab.id }
                } label: {
                    VStack(spacing: 3) {
                        Image(systemName: tab.systemImage)
                            .font(.system(size: 17, weight: .medium))
                            .symbolVariant(selected ? .fill : .none)
                        Text(tab.label)
                            .font(.system(size: 10, weight: selected ? .bold : .semibold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .foregroundStyle(selected ? BUColor.midnightInk : BUColor.inkMuted.opacity(0.72))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(
                        selected ? AnyShapeStyle(BUColor.midnight.opacity(0.08)) : AnyShapeStyle(Color.clear),
                        in: Capsule()
                    )
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.label)
                .accessibilityAddTraits(selected ? [.isSelected] : [])
            }
        }
        .padding(6)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(Capsule().strokeBorder(Color.white.opacity(0.55), lineWidth: 0.7))
        .shadow(color: BUColor.midnight.opacity(0.12), radius: 18, y: 8)
    }
}

private extension FoundOneMobileShell where Accessory == EmptyView {
    init(
        selectedTab: Binding<AppRoot.Tab>,
        tabs: [FoundOneSurfaceTab],
        bottomTabs: [FoundOneSurfaceTab] = [],
        accountName: String? = nil,
        accountEmail: String? = nil,
        onSignOut: (() -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.init(
            selectedTab: selectedTab,
            tabs: tabs,
            bottomTabs: bottomTabs,
            accountName: accountName,
            accountEmail: accountEmail,
            onSignOut: onSignOut,
            accessory: { EmptyView() },
            content: content
        )
    }
}

private struct FoundOneBrandBar<Accessory: View>: View {
    let accessory: Accessory
    let onOpenSidebar: () -> Void

    var body: some View {
        // 사장님 피드백 (2026-05-14): 상단 BrandBar 와 본문 배경이 따로 논다.
        //   기존: ultraThinMaterial 캡슐 + 흰 border + shadow → 별도 글래스 띠로 분리.
        //   변경: 배경 캡슐 제거. 로고/햄버거/타이틀이 Aurora lavender mist 위에
        //     자연스럽게 떠있는 floating 요소로. 햄버거 버튼 Circle 도
        //     강한 white fill → 옅은 midnight tint 로 톤 일치.
        HStack(spacing: 10) {
            Button(action: onOpenSidebar) {
                Image(systemName: "sidebar.leading")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.midnightInk)
                    .frame(width: 34, height: 34)
                    .background(BUColor.midnight.opacity(0.06), in: Circle())
                    .overlay(
                        Circle()
                            .strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 0.6)
                    )
            }
            .buttonStyle(.plain)
            .accessibilityLabel("메뉴")

            FoundOneSpiralLogo(size: 30, color: BUColor.midnightBright)
                .frame(width: 30, height: 30)

            FoundOneWordmark(height: 15, color: BUColor.ink, dotColor: BUColor.midnightBright)

            Spacer(minLength: 0)
            accessory
        }
        .frame(minHeight: 34)
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
        // 배경 캡슐 제거 — Aurora lavender mist 가 그대로 보이게.
    }
}

private struct FoundOneLiquidSidebar: View {
    let tabs: [FoundOneSurfaceTab]
    @Binding var selectedTab: AppRoot.Tab
    /// 사이드바 푸터 계정 정보 + 로그아웃 (2026-08-14 사장님 지시 — 웹 사이드바 푸터 미러)
    var accountName: String? = nil
    var accountEmail: String? = nil
    var onSignOut: (() -> Void)? = nil
    let onClose: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 10) {
                FoundOneSpiralLogo(size: 34, color: BUColor.midnightBright)
                    .frame(width: 34, height: 34)

                VStack(alignment: .leading, spacing: 2) {
                    FoundOneWordmark(height: 16, color: BUColor.ink, dotColor: BUColor.midnightBright)
                    Text("Surface")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                        .tracking(0.4)
                        .textCase(.uppercase)
                }

                Spacer(minLength: 0)

                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .frame(width: 32, height: 32)
                        .background(BUColor.midnight.opacity(0.08), in: Circle())
                        .overlay(
                            Circle().strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 0.6)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityLabel("사이드바 닫기")
            }
            .padding(.top, 54)

            VStack(alignment: .leading, spacing: 6) {
                ForEach(tabs) { tab in
                    FoundOneSidebarRow(
                        tab: tab,
                        selected: selectedTab == tab.id
                    ) {
                        selectedTab = tab.id
                        onClose()
                    }
                }
            }

            Spacer(minLength: 0)

            // 2026-05-25 사장님 신고: "웹 surface와 동일한 순서" 개발자 문구 노출 — 제거.

            // ── 푸터: 간단한 계정 정보 + 로그아웃 (2026-08-14, 웹 .bup-sidebar-footer 미러) ──
            if onSignOut != nil {
                sidebarFooter
            }
        }
        .padding(.horizontal, 18)
        .frame(width: 292)
        .frame(maxHeight: .infinity)
        // ⚠️ 2026-05-25 사장님 피드백 (Claude 앱 스타일):
        //   "다이나믹 아일랜드나 아래 하단의 채움도 신경써서" — 사이드바가 전체 화면 높이로
        //   safe area (상태바·홈 인디케이터) 까지 배경이 깔리도록. 둥근 모서리 제거.
        //   이전: cornerRadius 30 + padding 10 → 떠있는 카드처럼 보임.
        //   변경: 직사각형 풀-높이 + 좌측 0 padding. 우측 미세 그림자만 유지.
        .background(
            Rectangle()
                .fill(Color.white)
                .overlay(
                    // 상단 미세 틴트 — 브랜드감 + 깊이감 유지
                    LinearGradient(
                        colors: [
                            Color.white,
                            Color(red: 0.98, green: 0.98, blue: 0.99),
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    // 우측 경계선 — 본문과 구분
                    HStack {
                        Spacer()
                        Rectangle()
                            .fill(BUColor.midnight.opacity(0.08))
                            .frame(width: 0.5)
                    }
                )
                .shadow(color: Color.black.opacity(0.12), radius: 24, x: 4, y: 0)
                .ignoresSafeArea()
        )
    }

    // MARK: - Footer (계정 + 로그아웃)

    private var sidebarFooter: some View {
        let name = (accountName ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let email = (accountEmail ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let initial = String((name.isEmpty ? (email.isEmpty ? "?" : email) : name).prefix(1)).uppercased()
        return VStack(alignment: .leading, spacing: 4) {
            Rectangle()
                .fill(BUColor.midnight.opacity(0.08))
                .frame(height: 0.5)
                .padding(.bottom, 8)

            // 계정 행 — 탭하면 내 정보로
            Button {
                selectedTab = .profile
                onClose()
            } label: {
                HStack(spacing: 10) {
                    Text(initial)
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(.white)
                        .frame(width: 30, height: 30)
                        .background(
                            LinearGradient(colors: [BUColor.midnight, BUColor.midnightBright], startPoint: .topLeading, endPoint: .bottomTrailing),
                            in: RoundedRectangle(cornerRadius: 9, style: .continuous)
                        )
                    VStack(alignment: .leading, spacing: 1) {
                        Text(name.isEmpty ? "내 계정" : name)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                            .lineLimit(1)
                        if !email.isEmpty {
                            Text(email)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                                .lineLimit(1)
                                .truncationMode(.middle)
                        }
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 10)
                .frame(minHeight: 46)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("내 정보")

            // 로그아웃
            Button {
                onSignOut?()
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 15, weight: .semibold))
                        .frame(width: 22, height: 22)
                    Text("로그아웃")
                        .font(.system(size: 14, weight: .semibold))
                    Spacer(minLength: 0)
                }
                .foregroundStyle(BUColor.inkSecondary)
                .padding(.horizontal, 13)
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("로그아웃")
        }
        .padding(.bottom, 24)
    }
}

private struct FoundOneSidebarRow: View {
    let tab: FoundOneSurfaceTab
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: tab.systemImage)
                    .font(.system(size: 16, weight: .semibold))
                    .frame(width: 22, height: 22)
                Text(tab.label)
                    .font(.system(size: 15, weight: selected ? .bold : .semibold))
                    .lineLimit(1)
                Spacer(minLength: 0)
            }
            // 2026-05-25 사장님 신고: 미선택 탭이 거의 안 보이는 inkMuted → ink(진한 색)로.
            .foregroundStyle(selected ? BUColor.midnightInk : BUColor.ink)
            .padding(.horizontal, 13)
            .frame(minHeight: 46)
            .background {
                tabBackground
                    .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
            }
            .overlay(
                RoundedRectangle(cornerRadius: 15, style: .continuous)
                    .strokeBorder(
                        selected ? BUColor.midnight.opacity(0.18) : Color.clear,
                        lineWidth: 1
                    )
            )
            .shadow(
                color: selected ? Color.black.opacity(0.06) : .clear,
                radius: 14,
                x: 0,
                y: 4
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.label)
    }

    @ViewBuilder
    private var tabBackground: some View {
        if selected {
            // 선택 탭 — 흰색 단단 배경. 이전 0.82/0.56 그라디언트는 미세하게 투명해 가독성 저하.
            Color.white
        } else {
            Color.clear
        }
    }
}

// MARK: - Surface Placeholder

private struct NativeSurfacePlaceholder: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        ZStack {
            BUBackgroundSurface()
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.shellGap) {
                    BUCard(.outer) {
                        VStack(alignment: .leading, spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(BUColor.midnight08)
                                    .frame(width: 40, height: 40)
                                Image(systemName: systemImage)
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(BUColor.midnightInk)
                            }

                            Text(title)
                                .font(.system(size: 24, weight: .bold))
                                .foregroundStyle(BUColor.ink)
                                .tracking(-0.72)

                            Text(subtitle)
                                .font(.system(size: 14, weight: .regular))
                                .foregroundStyle(BUColor.inkMuted)
                                .lineSpacing(4)
                        }
                    }
                }
                .padding(.horizontal, BUSpacing.md)
                .padding(.top, BUSpacing.md)
            }
        }
    }
}

// MARK: - SettingsView

private struct SettingsView: View {
    let coordinator: AuthCoordinator
    @State private var showDeleteConfirm = false

    var body: some View {
        ZStack {
            BUBackgroundSurface()
            ScrollView {
                VStack(spacing: BUSpacing.cardGap) {
                    if let session = coordinator.currentSession {
                        BUCard(.card) {
                            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                                BUEyebrow("계정")
                                Text(session.displayName ?? session.email ?? "사용자")
                                    .font(BUFont.cardTitleSmall)
                                Text("로그인: \(session.provider.rawValue)")
                                    .font(BUFont.bodyCaption)
                                    .foregroundStyle(BUColor.inkSecondary)
                            }
                        }
                    }

                    Button {
                        Task { await coordinator.signOut() }
                    } label: {
                        Text("로그아웃")
                            .font(BUFont.label)
                            .foregroundStyle(BUColor.inkSecondary)
                            .frame(maxWidth: .infinity, minHeight: 52)
                            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous))
                    }
                    .buttonStyle(.plain)

                    Button {
                        showDeleteConfirm = true
                    } label: {
                        Text("계정 삭제")
                            .font(BUFont.label)
                            .foregroundStyle(BUColor.danger)
                            .frame(maxWidth: .infinity, minHeight: 52)
                            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .padding(.top, BUSpacing.lg)
                }
                .padding(BUSpacing.md)
            }
        }
        .alert("계정을 삭제하시겠어요?", isPresented: $showDeleteConfirm) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) {
                Task { await coordinator.deleteAccount() }
            }
        } message: {
            Text("모든 데이터가 영구 삭제됩니다. 되돌릴 수 없습니다.")
        }
    }
}

// MARK: - DEBUG Demo Mode (시뮬레이터 시각 검증)

#if DEBUG

/// 디자인 미리보기 전용 메뉴 — 실제 사장님이 보는 영역에 절대 노출되지 않음.
/// SignInView 우하단의 흐릿한 회색 텍스트로 자리잡아 평소엔 안 보이는 수준.
struct DemoModeMenu: View {
    let onSelect: (MockScenario) -> Void

    var body: some View {
        Menu {
            Section("⚠️ 디자인 미리보기 — 가짜 데이터") {
                Button("안정 운영 (외식)") { onSelect(.healthy) }
                Button("주의 신호 (카페)") { onSelect(.warning) }
                Button("긴급 위기 (SaaS)") { onSelect(.critical) }
                Button("매출 미기록 5일") { onSelect(.staleSales) }
                Button("첫 진입 (empty)") { onSelect(.empty) }
            }
        } label: {
            Text("디자인 미리보기")
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.55))
                .tracking(0.2)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
        }
    }
}

/// DEBUG 데모 탭 — Today (시나리오) + Roadmap + 종료 버튼.
/// ⚠️ 상단에 큰 "데모 데이터" 배너 강제 표시 → 실제 가게 데이터로 착각 방지.
struct DemoTabs: View {
    let scenario: MockScenario
    @Binding var selectedTab: AppRoot.Tab
    let onExit: () -> Void

    private var mockData: MockData {
        MockData.scenario(scenario)
    }

    var body: some View {
        ZStack(alignment: .top) {
            FoundOneMobileShell(
                selectedTab: $selectedTab,
                tabs: webSurfaceTabs(businessLaunched: mockData.resolverInput.businessLaunched, offeringCategoryId: mockData.resolverInput.categoryId),
                bottomTabs: bottomQuickTabs(businessLaunched: mockData.resolverInput.businessLaunched, offeringCategoryId: mockData.resolverInput.categoryId, offeringSubIndustryId: nil),
                accessory: {
                    ExitButton(action: onExit)
                }
            ) {
                content
                    .padding(.top, 36)  // 배너 자리
            }

            DemoModeBanner(scenario: scenario, onExit: onExit)
        }
    }

    /// Demo 모드용 stub store — 빈 StoreInfoState (placeholder UI 그대로 표시).
    /// 가짜 데이터로 섹션을 채울 수 있으나, 사장님 실제 데이터로 착각 방지 우선.
    private var demoStoreInfo: StoreInfoStore {
        StoreInfoStore(repository: MockStoreInfoRepository())
    }

    /// Demo 모드용 stub store — Mock 데이터로 채운 DashboardStore (Supabase 호출 X).
    private var demoDashboardStore: DashboardStore {
        let s = DashboardStore(
            dailyRepo: InMemoryDailyEntryRepository(seed: mockData.entries),
            costsRepo: InMemoryMonthlyCostsRepository(seed: mockData.costs)
        )
        s.setProfile(
            storeName: mockData.storeName,
            userName: mockData.userName,
            daysSinceLaunch: mockData.daysSinceLaunch,
            category: mockData.category,
            currentCash: mockData.currentCash,
            businessLaunched: mockData.resolverInput.businessLaunched
        )
        return s
    }

    /// Demo 모드용 현금흐름 store — repository nil (메모리 전용, 미설정 상태) →
    /// TodayView 에 설정 프롬프트가 노출되어 설정 시트 플로우를 시각 검증할 수 있다.
    private var demoCashflowStore: CashflowStore {
        CashflowStore(repository: nil, defaultCategoryKey: webCategoryId(from: mockData.category))
    }

    @ViewBuilder
    private var content: some View {
        switch selectedTab {
            case .home:
                if mockData.resolverInput.businessLaunched {
                    TodayView(mock: mockData, dashboardStore: demoDashboardStore, storeInfo: demoStoreInfo, cashflowStore: demoCashflowStore)
                } else {
                    PreLaunchHomeView(
                        store: demoDashboardStore,
                        onOpenCurrentStage: { selectedTab = .roadmap }
                    )
                }
            case .current:
                RoadmapView()
            case .roadmap:
                RoadmapView()
            case .guides:
                GuidesView(store: demoDashboardStore)
            case .franchise:
                FranchiseView()
            case .marketing:
                MarketingView(store: demoDashboardStore, mock: mockData)
            case .tax:
                TaxView(store: demoDashboardStore)
            case .reports:
                ReportsView(mock: mockData)
            case .finance:
                FinanceView(mock: mockData)
            case .offerings:
                OfferingsView(storeInfoStore: demoStoreInfo, fallbackCategoryId: mockData.resolverInput.categoryId)
            case .analytics:
                MyStoreView(store: demoDashboardStore, storeInfo: demoStoreInfo)
            case .team:
                TeamManagementView(storeInfoStore: demoStoreInfo)
            case .profile:
                // Demo 모드: coordinator nil → dangerCard (로그아웃 / 계정 삭제) 숨김.
                ProfileView(store: demoDashboardStore, coordinator: nil, storeInfo: demoStoreInfo)
        }
    }
}

private struct DemoModeBanner: View {
    let scenario: MockScenario
    let onExit: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "eye.trianglebadge.exclamationmark.fill")
                .font(.system(size: 12, weight: .semibold))
            Text("디자인 미리보기 — 실제 가게 데이터 아님 · \(scenario.rawValue)")
                .font(.system(size: 11.5, weight: .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            Spacer(minLength: 6)
            Button(action: onExit) {
                Text("로그인으로")
                    .font(.system(size: 11, weight: .heavy))
                    .padding(.horizontal, 9)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.22), in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [BUColor.danger, BUColor.danger],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color.black.opacity(0.18))
                .frame(height: 0.6)
        }
        .shadow(color: Color.black.opacity(0.18), radius: 8, x: 0, y: 4)
        .padding(.horizontal, 6)
        .padding(.top, 4)
    }
}

private struct ExitButton: View {
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Image(systemName: "xmark.circle.fill")
                .font(.system(size: 22))
                .foregroundStyle(BUColor.inkMuted)
                .background(Circle().fill(BUColor.surfaceElevated.opacity(0.9)))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("닫기")
    }
}

#endif  // DEBUG
