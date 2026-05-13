//
//  AppRoot.swift — 앱 최상위 컨테이너
//
//  Xcode App target 의 `@main` App struct 가 `AppRoot()` 를 body 로 사용.
//
//   @main
//   struct BuildUpApp: App {
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
import BuildUpDesignSystem
import BuildUpCore
import BuildUpComponents
import BuildUpAuth
import BuildUpData
import BuildUpNotifications

public struct AppRoot: View {

    @State private var coordinator: AuthCoordinator
    @State private var dashboardStore: DashboardStore?
    @State private var notificationFlow = NotificationPermissionFlow()
    @State private var showNotificationSheet = false
    @State private var selectedTab: Tab = .home
    /// DEBUG 빌드에서 SignInView 우회 — 시뮬레이터 시각 검증용.
    @State private var demoMode: MockScenario? = nil

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
        // BU_DEMO_SCENARIO 환경변수 → 즉시 데모 진입 (시뮬레이터 시각 검증)
        //   SIMCTL_CHILD_BU_DEMO_SCENARIO=warning xcrun simctl launch <UUID> <bundle-id>
        if let raw = ProcessInfo.processInfo.environment["BU_DEMO_SCENARIO"],
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
                    MainTabs(
                        store: store,
                        coordinator: coordinator,
                        selectedTab: $selectedTab
                    )
                    .task {
                        await loadDashboardIfNeeded(coordinator: coordinator)
                        await notificationFlow.refresh()
                        if notificationFlow.status != .granted {
                            showNotificationSheet = true
                        }
                    }
                    .sheet(isPresented: $showNotificationSheet) {
                        NotificationOptInView(flow: notificationFlow) {
                            showNotificationSheet = false
                        }
                    }
                } else {
                    AuthenticatedLoadingView()
                        .task {
                            await loadDashboardIfNeeded(coordinator: coordinator)
                        }
                }
            } else {
                SignInView(coordinator: coordinator)
                    .overlay(alignment: .topTrailing) {
                        #if DEBUG
                        DemoModeMenu { scenario in
                            demoMode = scenario
                        }
                        .padding(.top, 8)
                        .padding(.trailing, BUSpacing.md)
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
    }

    private static func readableError(_ error: any Error) -> String {
        if let localized = (error as? any LocalizedError)?.errorDescription {
            return localized
        }
        return String(describing: error)
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
        BuildUpMobileShell(selectedTab: $selectedTab, tabs: webSurfaceTabs(businessLaunched: store.businessLaunched)) {
            switch selectedTab {
            case .home:
                TodayView(mock: mockData)
            case .current:
                RoadmapView()
            case .roadmap:
                RoadmapView()
            case .guides:
                NativeSurfacePlaceholder(
                    title: "펀딩",
                    subtitle: "웹의 정책자금·가이드 surface와 연결될 자리입니다.",
                    systemImage: "doc.text.magnifyingglass"
                )
            case .franchise:
                NativeSurfacePlaceholder(
                    title: "프랜차이즈",
                    subtitle: "웹 프랜차이즈 분석 surface와 같은 정보 구조로 준비 중입니다.",
                    systemImage: "storefront"
                )
            case .marketing:
                GrowthForecastView(mock: mockData)
            case .reports:
                WeeklyPulseView(mock: mockData)
            case .analytics:
                DailyHubView(mock: mockData)
            case .profile:
                SettingsView(coordinator: coordinator)
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

private struct BuildUpSurfaceTab: Identifiable, Sendable {
    let id: AppRoot.Tab
    let label: String
    let systemImage: String
}

private func webSurfaceTabs(businessLaunched: Bool) -> [BuildUpSurfaceTab] {
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

private struct BuildUpMobileShell<Content: View, Accessory: View>: View {
    @Binding var selectedTab: AppRoot.Tab
    @State private var sidebarOpen = false
    let tabs: [BuildUpSurfaceTab]
    let accessory: Accessory
    let content: Content

    init(
        selectedTab: Binding<AppRoot.Tab>,
        tabs: [BuildUpSurfaceTab],
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
                BuildUpBrandBar(
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
                    BuildUpLiquidSidebar(
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

private extension BuildUpMobileShell where Accessory == EmptyView {
    init(
        selectedTab: Binding<AppRoot.Tab>,
        tabs: [BuildUpSurfaceTab],
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

private struct BuildUpBrandBar<Accessory: View>: View {
    let accessory: Accessory
    let onOpenSidebar: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            Button(action: onOpenSidebar) {
                Image(systemName: "sidebar.leading")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.midnightInk)
                    .frame(width: 34, height: 34)
                    .background(Color.white.opacity(0.76), in: Circle())
                    .overlay(
                        Circle()
                            .strokeBorder(Color.white.opacity(0.82), lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("메뉴")

            ZStack {
                LinearGradient(
                    colors: [BUColor.auroraNavy, BUColor.auroraBlue, BUColor.auroraTeal],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Text("b")
                    .font(.system(size: 17, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .tracking(-0.3)
            }
            .frame(width: 32, height: 32)
            .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
            .shadow(color: BUColor.midnightInk.opacity(0.15), radius: 8, x: 0, y: 2)

            Text("Build")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.48)
            + Text(".")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(BUColor.midnightInk)
                .tracking(-0.48)
            + Text("UP")
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.48)

            Spacer(minLength: 0)
            accessory
        }
        .frame(minHeight: 32)
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.42), lineWidth: 1)
                )
                .shadow(color: Color.black.opacity(0.05), radius: 18, x: 0, y: 8)
        )
    }
}

private struct BuildUpLiquidSidebar: View {
    let tabs: [BuildUpSurfaceTab]
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
                    Text("b")
                        .font(.system(size: 17, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                        .tracking(-0.3)
                }
                .frame(width: 34, height: 34)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 1) {
                    Text("Build.UP")
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
                        .foregroundStyle(BUColor.inkMuted)
                        .frame(width: 32, height: 32)
                        .background(Color.white.opacity(0.56), in: Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("사이드바 닫기")
            }
            .padding(.top, 54)

            VStack(alignment: .leading, spacing: 6) {
                ForEach(tabs) { tab in
                    BuildUpSidebarRow(
                        tab: tab,
                        selected: selectedTab == tab.id
                    ) {
                        selectedTab = tab.id
                        onClose()
                    }
                }
            }

            Spacer(minLength: 0)

            Text("웹 surface와 동일한 순서")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .padding(.bottom, 24)
        }
        .padding(.horizontal, 18)
        .frame(width: 292)
        .frame(maxHeight: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.58), lineWidth: 1)
                )
                .shadow(color: Color.black.opacity(0.12), radius: 34, x: 0, y: 18)
        )
        .padding(.leading, 10)
        .padding(.vertical, 10)
    }
}

private struct BuildUpSidebarRow: View {
    let tab: BuildUpSurfaceTab
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
            .foregroundStyle(selected ? BUColor.midnightInk : BUColor.inkMuted)
            .padding(.horizontal, 13)
            .frame(minHeight: 46)
            .background {
                tabBackground
                    .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
            }
            .overlay(
                RoundedRectangle(cornerRadius: 15, style: .continuous)
                    .strokeBorder(
                        selected ? Color.white.opacity(0.82) : Color.clear,
                        lineWidth: 1
                    )
            )
            .shadow(
                color: selected ? Color.black.opacity(0.05) : .clear,
                radius: 16,
                x: 0,
                y: 6
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.label)
    }

    @ViewBuilder
    private var tabBackground: some View {
        if selected {
            LinearGradient(
                colors: [
                    Color.white.opacity(0.82),
                    Color.white.opacity(0.56),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
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

/// SignInView 우상단에 노출되는 작은 메뉴 — 사장님이 5 시나리오 즉시 진입 가능.
struct DemoModeMenu: View {
    let onSelect: (MockScenario) -> Void

    var body: some View {
        Menu {
            Button("안정 운영 (외식)") { onSelect(.healthy) }
            Button("주의 신호 (카페)") { onSelect(.warning) }
            Button("긴급 위기 (SaaS)") { onSelect(.critical) }
            Button("매출 미기록 5일") { onSelect(.staleSales) }
            Button("첫 진입 (empty)") { onSelect(.empty) }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "eye.fill")
                    .font(.system(size: 10))
                Text("DEMO")
                    .font(.system(size: 10, weight: .bold))
                    .tracking(0.5)
            }
            .foregroundStyle(BUColor.inkMuted)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(BUColor.surfaceElevated.opacity(0.85), in: Capsule())
            .overlay(
                Capsule()
                    .strokeBorder(BUColor.borderSubtle, lineWidth: 0.5)
            )
        }
    }
}

/// DEBUG 데모 탭 — Today (시나리오) + Roadmap + 종료 버튼.
struct DemoTabs: View {
    let scenario: MockScenario
    @Binding var selectedTab: AppRoot.Tab
    let onExit: () -> Void

    private var mockData: MockData {
        MockData.scenario(scenario)
    }

    var body: some View {
        BuildUpMobileShell(
            selectedTab: $selectedTab,
            tabs: webSurfaceTabs(businessLaunched: mockData.resolverInput.businessLaunched),
            accessory: {
                ExitButton(action: onExit)
            }
        ) {
            switch selectedTab {
            case .home:
                TodayView(mock: mockData)
            case .current:
                RoadmapView()
            case .roadmap:
                RoadmapView()
            case .guides:
                NativeSurfacePlaceholder(
                    title: "펀딩",
                    subtitle: "정책자금, 지원사업, 필수 가이드를 웹과 같은 surface로 연결합니다.",
                    systemImage: "doc.text.magnifyingglass"
                )
            case .franchise:
                NativeSurfacePlaceholder(
                    title: "프랜차이즈",
                    subtitle: "브랜드 비교와 창업 비용 분석 surface를 준비 중입니다.",
                    systemImage: "storefront"
                )
            case .marketing:
                GrowthForecastView(mock: mockData)
            case .reports:
                WeeklyPulseView(mock: mockData)
            case .analytics:
                DailyHubView(mock: mockData)
            case .profile:
                NativeSurfacePlaceholder(
                    title: "내 정보",
                    subtitle: "계정, 언어, 매장 정보를 관리하는 profile surface입니다.",
                    systemImage: "person.crop.circle"
                )
            }
        }
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
