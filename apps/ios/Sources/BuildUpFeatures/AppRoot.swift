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
    @State private var selectedTab: Tab = .today
    /// DEBUG 빌드에서 SignInView 우회 — 시뮬레이터 시각 검증용.
    @State private var demoMode: MockScenario? = nil

    public enum Tab: Hashable, Sendable {
        case today
        case daily
        case weekly
        case ops
        case growth
        case roadmap
        case settings
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
            case "roadmap": self._selectedTab = State(initialValue: .roadmap)
            case "today":   self._selectedTab = State(initialValue: .today)
            case "daily":   self._selectedTab = State(initialValue: .daily)
            case "weekly":  self._selectedTab = State(initialValue: .weekly)
            case "ops":     self._selectedTab = State(initialValue: .ops)
            case "growth":  self._selectedTab = State(initialValue: .growth)
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
            } else if coordinator.isAuthenticated, let store = dashboardStore {
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
        store.setProfile(
            storeName: "내 가게",
            userName: session.displayName ?? "사장님",
            daysSinceLaunch: 0,
            category: .general,
            currentCash: nil
        )
        self.dashboardStore = store
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
        BuildUpMobileShell(selectedTab: $selectedTab, tabs: operationalTabs) {
            switch selectedTab {
            case .today:
                TodayView(mock: mockData)
            case .daily:
                DailyHubView(mock: mockData)
            case .weekly:
                WeeklyPulseView(mock: mockData)
            case .ops:
                OperationsView(mock: mockData)
            case .growth:
                GrowthForecastView(mock: mockData)
            case .roadmap:
                RoadmapView()
            case .settings:
                SettingsView(coordinator: coordinator)
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

private let operationalTabs: [BuildUpSurfaceTab] = [
    .init(id: .today, label: "홈", systemImage: "house"),
    .init(id: .daily, label: "일간", systemImage: "chart.bar"),
    .init(id: .weekly, label: "주간", systemImage: "calendar.badge.clock"),
    .init(id: .ops, label: "운영", systemImage: "shippingbox"),
    .init(id: .growth, label: "성장", systemImage: "sparkles"),
    .init(id: .roadmap, label: "로드맵", systemImage: "map"),
    .init(id: .settings, label: "내 정보", systemImage: "person.crop.circle"),
]

private struct BuildUpMobileShell<Content: View, Accessory: View>: View {
    @Binding var selectedTab: AppRoot.Tab
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
                BuildUpBrandBar(accessory: accessory)
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, 6)

                BuildUpSurfaceNav(
                    tabs: tabs,
                    selectedTab: $selectedTab
                )
                .padding(.bottom, 2)

                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .tint(BUColor.midnightInk)
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

    var body: some View {
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
    }
}

private struct BuildUpSurfaceNav: View {
    let tabs: [BuildUpSurfaceTab]
    @Binding var selectedTab: AppRoot.Tab

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(tabs) { tab in
                    let selected = selectedTab == tab.id
                    BuildUpSurfaceNavButton(tab: tab, selected: selected) {
                        withAnimation(.snappy(duration: 0.22)) {
                            selectedTab = tab.id
                        }
                    }
                }
            }
            .padding(5)
            .background(
                RoundedRectangle(cornerRadius: BURadius.pill, style: .continuous)
                    .fill(Color.white.opacity(0.88))
                    .overlay(
                        RoundedRectangle(cornerRadius: BURadius.pill, style: .continuous)
                            .strokeBorder(BUColor.borderSubtle, lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.06), radius: 22, x: 0, y: 8)
            )
            .padding(.horizontal, BUSpacing.md)
        }
        .scrollClipDisabled()
    }
}

private struct BuildUpSurfaceNavButton: View {
    let tab: BuildUpSurfaceTab
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 7) {
                Image(systemName: tab.systemImage)
                    .font(.system(size: 12, weight: .semibold))
                    .frame(width: 14, height: 14)
                Text(tab.label)
                    .font(.system(size: 12.5, weight: selected ? .semibold : .regular))
                    .lineLimit(1)
            }
            .foregroundStyle(selected ? BUColor.midnightInk : BUColor.inkMuted)
            .padding(.horizontal, 11)
            .frame(minHeight: 36)
            .background {
                tabBackground
                    .clipShape(Capsule())
            }
            .overlay(
                Capsule()
                    .strokeBorder(
                        selected ? Color.white.opacity(0.82) : Color.clear,
                        lineWidth: 1
                    )
            )
            .shadow(
                color: selected ? Color.black.opacity(0.05) : .clear,
                radius: 20,
                x: 0,
                y: 8
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
                    Color.white.opacity(0.62),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        } else {
            Color.clear
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
            tabs: operationalTabs.filter { $0.id != .settings },
            accessory: {
                ExitButton(action: onExit)
            }
        ) {
            switch selectedTab {
            case .today:
                TodayView(mock: mockData)
            case .daily:
                DailyHubView(mock: mockData)
            case .weekly:
                WeeklyPulseView(mock: mockData)
            case .ops:
                OperationsView(mock: mockData)
            case .growth:
                GrowthForecastView(mock: mockData)
            case .roadmap:
                RoadmapView()
            case .settings:
                TodayView(mock: mockData)
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
