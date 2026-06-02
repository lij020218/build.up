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
    /// 전역 "진행 초기화" 코디네이터 — ProfileView 가 트리거, AppRoot 가 오버레이 표시.
    @State private var resetCoordinator = ResetCoordinator()
    /// DEBUG 빌드에서 SignInView 우회 — 시뮬레이터 시각 검증용.
    @State private var demoMode: MockScenario? = nil
    /// 기존 가게 등록 완료 후 loadDashboardIfNeeded 에서 StoreInfo / AppStorage 에 적용할 임시 저장.
    @State private var pendingRegistration: StoreRegistration? = nil

    public enum Tab: Hashable, Sendable {
        case home
        case current
        case roadmap
        case guides
        case franchise
        case marketing
        case reports
        case analytics
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
            case "reports":       self._selectedTab = State(initialValue: .reports)
            case "analytics", "store": self._selectedTab = State(initialValue: .analytics)
            case "profile", "settings": self._selectedTab = State(initialValue: .profile)
            default: break
            }
        }
        #endif
    }

    public var body: some View {
        Group {
            if let scenario = demoMode {
                // ── DEBUG 데모 모드 ──
                DemoTabs(scenario: scenario, selectedTab: $selectedTab) {
                    demoMode = nil
                }
            } else if coordinator.isAuthenticated {
                if let store = dashboardStore {
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
                            storeInfo: storeInfoStore ?? Self.makeFallbackStoreInfo(),
                            coordinator: coordinator,
                            selectedTab: $selectedTab
                        )
                        .transition(.opacity)
                        .task {
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
                        // 로그인 성공 후 store 생성
                        for await change in BUSupabase.shared.authStateChanges {
                            if change.session != nil {
                                await loadDashboardIfNeeded(coordinator: coordinator)
                                break
                            }
                        }
                    }
            }
        }
        .environment(roadmapStore)
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
    private func loadDashboardIfNeeded(coordinator: AuthCoordinator) async {
        guard let session = coordinator.currentSession, dashboardStore == nil else { return }

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
        self.roadmapStore = connectedRoadmap
        await connectedRoadmap.syncFromRemote()
    }

    /// 로딩 완료 전 임시 — 빈 state. load() 가 끝나면 즉시 storeInfoStore 가 set 되어
    /// MainTabs 가 새 store 로 리렌더됨. (FallbackRepo 는 read 시 즉시 빈 state 반환.)
    @MainActor
    private static func makeFallbackStoreInfo() -> StoreInfoStore {
        StoreInfoStore(repository: FallbackStoreInfoRepository())
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

                        selectedTab = .home  // 운영 대시보드로
                    },
                    onBack: { path = nil }
                )
            case .ai:
                AIRoadmapWizardView(
                    webAppURL: BUSupabase.shared.env.webAppURL,
                    onComplete: { result, nameInput in
                        // cluster: industryCategoryId → BusinessCluster rawValue
                        let clusterRaw: String
                        switch result.parsed.industryCategoryId {
                        case "online-digital": clusterRaw = "online-digital"
                        case "startup-tech":   clusterRaw = "startup-tech"
                        default:               clusterRaw = "offline-food"
                        }
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
                        // 웹·앱 SSOT: AI 위저드에서 정한 업종도 business_profiles 에 반영 (영업 전).
                        OnboardingProfileSync.persistIndustry(
                            categoryId: result.parsed.industryCategoryId,
                            subIndustryId: nil
                        )
                        OnboardingProfileSync.persistBusinessLaunched(false)
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

private struct AuthenticatedLoadingView: View {
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
    @ObservedObject var storeInfo: StoreInfoStore
    let coordinator: AuthCoordinator
    @Binding var selectedTab: AppRoot.Tab

    private var mockData: MockData {
        MockData(
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
    }

    var body: some View {
        FoundOneMobileShell(selectedTab: $selectedTab, tabs: webSurfaceTabs(businessLaunched: store.businessLaunched)) {
            switch selectedTab {
            case .home:
                if store.businessLaunched {
                    TodayView(mock: mockData, dashboardStore: store, storeInfo: storeInfo)
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
            case .reports:
                ReportsView(mock: mockData)
            case .analytics:
                MyStoreView(store: store, storeInfo: storeInfo)
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

private func webSurfaceTabs(businessLaunched: Bool) -> [FoundOneSurfaceTab] {
    [
        .init(id: .home, label: "홈", systemImage: "house"),
        businessLaunched ? nil : .init(id: .current, label: "현재 단계", systemImage: "doc.text"),
        .init(id: .roadmap, label: "로드맵", systemImage: "list.bullet"),
        businessLaunched ? .init(id: .guides, label: "펀딩", systemImage: "doc.text.magnifyingglass") : nil,
        .init(id: .franchise, label: "프랜차이즈", systemImage: "storefront"),
        businessLaunched ? .init(id: .marketing, label: "마케팅", systemImage: "megaphone") : nil,
        businessLaunched ? .init(id: .reports, label: "보고서", systemImage: "doc.richtext") : nil,
        businessLaunched ? .init(id: .analytics, label: "내 가게", systemImage: "chart.bar") : nil,
        .init(id: .profile, label: "내 정보", systemImage: "person.crop.circle"),
    ].compactMap { $0 }
}

private struct FoundOneMobileShell<Content: View, Accessory: View>: View {
    @Binding var selectedTab: AppRoot.Tab
    @State private var sidebarOpen = false
    let tabs: [FoundOneSurfaceTab]
    let accessory: Accessory
    let content: Content

    init(
        selectedTab: Binding<AppRoot.Tab>,
        tabs: [FoundOneSurfaceTab],
        @ViewBuilder accessory: () -> Accessory,
        @ViewBuilder content: () -> Content
    ) {
        self._selectedTab = selectedTab
        self.tabs = tabs
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
        .tint(BUColor.midnightInk)
        .animation(.snappy(duration: 0.24), value: sidebarOpen)
    }
}

private extension FoundOneMobileShell where Accessory == EmptyView {
    init(
        selectedTab: Binding<AppRoot.Tab>,
        tabs: [FoundOneSurfaceTab],
        @ViewBuilder content: () -> Content
    ) {
        self.init(
            selectedTab: selectedTab,
            tabs: tabs,
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

            ZStack {
                LinearGradient(
                    colors: [BUColor.auroraNavy, BUColor.auroraBlue, BUColor.auroraTeal],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Text("f")
                    .font(.system(size: 17, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .tracking(-0.3)
            }
            .frame(width: 30, height: 30)
            .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
            .shadow(color: BUColor.midnightInk.opacity(0.12), radius: 6, x: 0, y: 2)

            Text("Found")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.48)
            + Text(".")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(BUColor.midnightInk)
                .tracking(-0.48)
            + Text("One")
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.48)

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
    let onClose: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 10) {
                ZStack {
                    LinearGradient(
                        colors: [BUColor.auroraNavy, BUColor.auroraBlue, BUColor.auroraTeal],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    Text("f")
                        .font(.system(size: 17, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                        .tracking(-0.3)
                }
                .frame(width: 34, height: 34)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 1) {
                    Text("Found.One")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                        .tracking(-0.45)
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
                tabs: webSurfaceTabs(businessLaunched: mockData.resolverInput.businessLaunched),
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

    @ViewBuilder
    private var content: some View {
        switch selectedTab {
            case .home:
                if mockData.resolverInput.businessLaunched {
                    TodayView(mock: mockData, dashboardStore: demoDashboardStore, storeInfo: demoStoreInfo)
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
            case .reports:
                ReportsView(mock: mockData)
            case .analytics:
                MyStoreView(store: demoDashboardStore, storeInfo: demoStoreInfo)
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
                colors: [Color(red: 0.71, green: 0.21, blue: 0.18), Color(red: 0.55, green: 0.14, blue: 0.12)],
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
    }
}

#endif  // DEBUG
