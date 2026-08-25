//
//  TodayView.swift — Today 화면 (웹 CEOMorningHero 1:1 미러)
//
//  웹 SSOT: apps/web/app/lib/components/dashboard/CEOMorningHero.tsx
//
//  구조 (3-Row hero outer card + nested cards):
//
//   ┌─ heroOuter (radius 24, 3-stop diagonal gradient, 2 radial glows) ─┐
//   │                                                                   │
//   │  Row 1 — 인사 영역                                                  │
//   │    [36×36 icon box] eyebrow(날짜·모드)                              │
//   │                     [pill 운영N일째] [pill 단계] [pill WoW%]          │
//   │                     "좋은 아침, 사장님"                              │
//   │                     "상호명 · 운영 N일째"                            │
//   │                                                                   │
//   │  Row 1.5 — 위험신호 박스 (HEALTH_COLORS, radius 14)                 │
//   │    [● dot] 제목   등급                                              │
//   │            메시지                                                  │
//   │                                                                   │
//   │  Row 2 — nested white card (radius 18) — NSM 메인 메트릭              │
//   │    NSM EYEBROW                                                    │
//   │    [큰 숫자 34pt]    [delta pill +18% WoW]                          │
//   │    "어제보다 +18% 성장 (description)"                                │
//   │                                                                   │
//   └───────────────────────────────────────────────────────────────────┘
//

import SwiftUI
import Combine
import OSLog
import FoundOneDesignSystem
import FoundOneCore
import FoundOneComponents
import FoundOneData

private let logger = Logger(subsystem: "com.foundone.ios", category: "TodayView")

// MARK: - TodayView

/// 재사용 DateFormatter — body 마다 DateFormatter() 생성은 비용이 큼(성능 2026-08-19).
enum TodayFormatters {
    /// "yyyy-MM-dd" UTC — 달력 날짜 문자열 → 요일 계산용.
    static let isoUTC: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "UTC")
        return f
    }()
    /// "yyyy-MM" — 이번 달 prefix 필터.
    static let yearMonth: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM"
        return f
    }()
    /// "M월 d일 EEE" ko_KR — 헤더 날짜.
    static let koMonthDayWeekday: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.dateFormat = "M월 d일 EEE"
        return f
    }()
}

public struct TodayView: View {

    let mock: MockData
    let healthResult: UnifiedHealthResult
    let hero: Hero
    /// MoreInsightsStrip 의 sheet 콘텐츠 데이터.
    /// 사장님 결정 (2026-05-19): 웹에서 운영 대시보드 안에 보이는 콘텐츠라서
    /// 모바일에서도 별도 탭 이동이 아니라 popup sheet 로 보여줘야 멘탈 모델이 일치.
    let dashboardStore: DashboardStore?
    let storeInfo: StoreInfoStore?
    /// 현금흐름 store — nil 이면 mock 예측 카드로 fallback(데모/프리뷰). 있으면 설정 게이팅 동작.
    let cashflowStore: CashflowStore?
    /// 코칭 일지 store (웹과 동일 Supabase). nil = 데모/프리뷰 (기록·카드 비활성).
    let coaching: CoachingHistoryStore?
    /// SaaS 사용자 지표 store (스타트업 전용, 웹과 동일 Supabase). nil = 데모/프리뷰.
    let saas: SaasMetricsStore?
    /// 구독 운영 store (웹과 동일 Supabase). nil = 데모/프리뷰.
    let subscription: SubscriptionStore?
    /// 탭 전환 (세팅 미션 딥링크 — 비용=내 가게, 오퍼링) — MainTabs 가 주입
    let onSwitchTab: ((AppRoot.Tab) -> Void)?
    @State private var showInputSheet = false
    /// 매출 흐름 막대에서 선택한 날짜 (nil = 오늘)
    @State private var inputSheetDate: Date? = nil
    @State private var showInventorySheet = false
    @State private var showTeamSheet = false
    @State private var showRecipeSheet = false
    @State private var showCustomerSheet = false
    @State private var showBasisSheet = false
    /// 인앱 알림함 (출근·초대·연차·수당) — 헤더 벨. 데모/비로그인은 자동 비활성(빈 목록). 2026-07-14
    ///   성능(2026-08-19): 소유자는 MainTabs(탭 전환에도 생존·재구독 없음). 미주입(프리뷰·데모)은 공용 fallback.
    @ObservedObject private var notifStore: NotificationsStore
    private static let fallbackNotifStore = NotificationsStore(client: BUSupabase.shared.client)
    /// 가게 세팅 미션 카드 — 기존 등록 판정 휴리스틱에 decisions 필요
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var showNotifications = false
    /// 초대된 직원(store_members) — 팀카드 인원·명단. 종전 팀카드는 수동 급여명단만 세어 초대직원 누락 (2026-07-14)
    @State private var invitedStaff: [TeamMember] = []
    /// storeInfo 변경 감지용 — storeInfo 는 plain let 이라 자체 관찰이 안 되므로
    /// objectWillChange 를 구독해 이 값을 bump → 홈 카드(재고·직원·고객) 즉시 재렌더.
    @State private var storeRevision = 0

    /// 2026-05-27 P0-A: AI dashboard/actions 응답 (Hero 코칭 카드에 주입).
    /// nil = 미 fetch 또는 미인증 (mock fallback). 빈 배열 = AI 가 빈 응답 반환.
    @State private var aiActions: [AiAction]?
    @State private var aiFetchError: String?

    /// 홈 세그먼트 (2026-08-19 IA — 웹 OperationalDashboard 동일 3탭: 오늘 · 운영 · 더보기).
    ///   한 화면에 카드 수십 장이 동시에 뜨지 않게 progressive disclosure. 카드는 삭제 0 — 탭으로 분산만.
    enum HomeSegment: String, CaseIterable, Hashable {
        case today, ops, more
        var labelKo: String {
            switch self {
            case .today: return "오늘"
            case .ops:   return "운영"
            case .more:  return "더보기"
            }
        }
    }
    @State private var segment: HomeSegment = .today

    public init(
        mock: MockData,
        dashboardStore: DashboardStore? = nil,
        storeInfo: StoreInfoStore? = nil,
        cashflowStore: CashflowStore? = nil,
        coaching: CoachingHistoryStore? = nil,
        saas: SaasMetricsStore? = nil,
        subscription: SubscriptionStore? = nil,
        notifStore: NotificationsStore? = nil,
        onSwitchTab: ((AppRoot.Tab) -> Void)? = nil
    ) {
        self.mock = mock
        self._notifStore = ObservedObject(wrappedValue: notifStore ?? Self.fallbackNotifStore)
        self.healthResult = HealthScore.calculate(
            entries: mock.entries,
            costs: mock.costs,
            category: mock.category,
            stage: mock.stage,
            currentCash: mock.currentCash
        )
        self.hero = HeroResolver.resolve(mock.resolverInput)
        self.dashboardStore = dashboardStore
        self.storeInfo = storeInfo
        self.cashflowStore = cashflowStore
        self.coaching = coaching
        self.saas = saas
        self.subscription = subscription
        self.onSwitchTab = onSwitchTab
    }

    /// hero → 코칭 신호 종류 (웹 CEOMorningHero 매핑: crisis→critical, warning→important, 그 외 drucker=good/나머지 notable).
    private var coachingSignalKind: CoachingSignalKind {
        switch hero.tone {
        case .crisis:  return .critical
        case .warning: return .important
        case .neutral: return hero.source == .drucker ? .good : .notable
        }
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 0) {
                // 공통 페이지 헤더 (2026-08-19 통일) — 가게 이름 + 상태 한 줄 + 알림 벨
                BUPageHeader(
                    title: mock.storeName.isEmpty ? "내 가게" : mock.storeName,
                    subtitle: mock.resolverInput.businessLaunched
                        ? (mock.daysSinceLaunch > 0 ? "운영 중 · \(mock.daysSinceLaunch + 1)일째" : "운영 중")
                        : "오픈 준비 중",
                    trailing: { NotificationBell(unread: notifStore.unreadCount, action: { showNotifications = true }) },
                    accessory: {
                        BUSegmentedControl(
                            items: HomeSegment.allCases.map { BUSegmentItem(id: $0, label: $0.labelKo) },
                            selection: $segment
                        )
                    }
                )
                // 성능(2026-08-19): 카드 수십 장 — LazyVStack 으로 화면 밖 카드 지연 생성.
                LazyVStack(spacing: BUSpacing.shellGap) {
                    switch segment {
                    case .today: todaySegment
                    case .ops:   opsSegment
                    case .more:  moreSegment
                    }

                    // 하단 탭바 회피
                    Color.clear.frame(height: 110)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
                .padding(.bottom, BUSpacing.md)
            }
        }
        // ⚠️ 2026-05-25: 중복 .background(BUBackgroundSurface()) 제거.
        //   FoundOneMobileShell 이 이미 풀스크린 Aurora 를 깔고 있음. 콘텐츠 영역에 또 깔면
        //   독립적인 TimelineView 가 다른 위상으로 애니메이션 → BrandBar 영역과 콘텐츠 영역의
        //   배경이 미묘하게 달라 보이는 분리감 발생. 사장님 신고 — "배경 나눠진게 보기 안 좋아".
        // 재고/직원/고객 store 변경 시 홈 카드 즉시 갱신 — storeInfo 는 plain let 이라 자체 관찰이
        //   안 됨(추가/CSV 가 카드에 즉시 안 뜨던 원인). objectWillChange 구독으로 재렌더 유발.
        //   nil(데모·프리뷰)이면 더미 publisher → 크래시 없음.
        .onReceive(storeInfo?.objectWillChange ?? ObservableObjectPublisher()) { _ in
            storeRevision &+= 1
        }
        // 시뮬 시각 검증 훅 (시뮬 탭 도구 부재 대응 — BU_DEMO_EMAIL_SHEET 패턴, 2026-08-25).
        //   BU_DEMO_ALLOW=1 이중 가드 + fallback(no-op) store 에만 시드 → 실계정 오염 불가.
        //   SEED_INVENTORY=cafe → 카페 픽스처(벌크·포장 메뉴) 주입 / INVENTORY·RECIPE_SHEET=1 → 시트 자동 오픈.
        .onAppear {
            let env = ProcessInfo.processInfo.environment
            guard env["BU_DEMO_ALLOW"] == "1" else { return }
            // 초기 load() 완료 후 시드 (즉시 시드하면 비동기 load 의 빈 state 가 덮어씀) → 시트는 그 뒤 오픈
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                if env["BU_DEMO_SEED_INVENTORY"] == "cafe", let si = storeInfo, si.state.inventory.isEmpty {
                    si.commit { s in s.inventory = Self.demoCafeInventory() }
                }
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                if env["BU_DEMO_INVENTORY_SHEET"] == "1" { showInventorySheet = true }
                if env["BU_DEMO_RECIPE_SHEET"] == "1" { showRecipeSheet = true }
            }
        }
        .sheet(isPresented: $showInputSheet, onDismiss: { inputSheetDate = nil }) {
            QuickInputSheet(dashboardStore: dashboardStore, initialDate: inputSheetDate)
        }
        .sheet(isPresented: $showInventorySheet) {
            if let si = storeInfo {
                InventoryManagementSheet(
                    storeInfoStore: si,
                    isMenuIndustry: isMenuCardIndustry,
                    goldenMax: (mock.category == .beauty || mock.category == .fitness || mock.category == .pet || mock.category == .education || mock.category == .livingService || mock.category == .space) ? 25 : 33,
                    categoryId: webCategoryId(from: mock.category)
                )
            }
        }
        .sheet(isPresented: $showRecipeSheet) {
            if let si = storeInfo {
                MenuRecipeSheet(storeInfoStore: si,
                                goldenMax: (mock.category == .beauty || mock.category == .fitness || mock.category == .pet || mock.category == .education || mock.category == .livingService || mock.category == .space) ? 25 : 33)
            }
        }
        .sheet(isPresented: $showTeamSheet) {
            // 2026-07-12 — 웹 TeamCard 관리하기 → team 서피스 미러.
            //   초대·근무표·연차(TeamManagementView)가 기본, 수동 급여 명단은 그 안의 버튼으로.
            TeamManagementView(isSheet: true, storeInfoStore: storeInfo)
        }
        .sheet(isPresented: $showNotifications) {
            NotificationsSheet(store: notifStore)
        }
        // 인앱 알림 로드 + 실시간 구독 (2026-07-14). 데모/비로그인은 store 가 자동 no-op.
        //   start() 는 멱등(채널 있으면 skip). stop 은 소유자(MainTabs) 가 담당 — 탭 전환마다 재구독 방지.
        .task { await notifStore.start() }
        .task { await loadInvitedStaff() }
        .sheet(isPresented: $showCustomerSheet) {
            if let si = storeInfo {
                let mode = BUCustomerMode(rawValue: mock.category.customerModeRaw) ?? .membership
                CustomerManagementSheet(
                    storeInfoStore: si,
                    mode: mode,
                    label: mock.category.customerLabelKo
                )
            }
        }
        .sheet(isPresented: $showBasisSheet) {
            if let ds = dashboardStore, let cs = cashflowStore {
                RevenueBasisSheet(
                    ko: true,
                    cardOverlap: ds.autoCardOverlap,
                    hasPopbill: ds.autoHasPopbill,
                    basis: ds.autoBasis,
                    cashflowStore: cs,
                    onSaved: { Task { await refetchUnifiedRevenue() } }
                )
            }
        }
        // 코칭 일지 — 오늘 노출된 hero 신호 1개 자동 기록 (웹 recordSignal 미러). 영업 시작 후만.
        .task(id: "coaching-record") {
            guard mock.resolverInput.businessLaunched, let coaching else { return }
            await coaching.recordTodaySignal(
                brief: mock.category == .startupTech ? .startup : .offline,
                kind: coachingSignalKind,
                headline: String(hero.analysisKo.prefix(200)),
                action: String(hero.actionKo.prefix(300))
            )
        }
        // 2026-05-27 P0-A: AI 모닝 브리핑 비동기 fetch.
        //   - View 마운트 시 1회 호출 (server 측에 24h KST 캐시)
        //   - 인증 안 됨·네트워크 실패 시 silent fail → mock fallback 자연스럽게
        //   - aiActions 가 set 되면 HeroOuterCard 의 Row3CoachingNested 가 자동 갱신
        .task(id: "ai-actions") {
            await loadAIActions()
        }
    }

    // MARK: - Segments (2026-08-19 IA) — 웹 OperationalDashboard 3탭 1:1 미러
    //   「오늘」= 리추얼 스트립 → 세팅 미션 → 히어로 → 매출 흐름 → 빠른 입력 → 손익 → 현금 (≤ 6장)
    //   「운영」= 재고/고객(업종 분기) → 팀 → 업종 핵심 → 위생/스타트업 → 사용자수
    //   「더보기」= 오늘 상세(KPI 스트립·코칭 일지·운영 의식) 인라인 + 주간 점검·성장 도구 시트
    //   카드 삭제 0 — 종전 홈 카드는 전부 어느 한 탭에서 도달. 내 가게·로드맵 진입점은 하단 탭과 중복이라 제거.

    @ViewBuilder
    private var todaySegment: some View {
        // 주간 리추얼 — 슬림 스트립, 이번 주 한 번 닫으면 다음 주까지 비표시 (히어로 Row1 과 중복 안 함)
        HomeRitualBanner()

        // 가게 세팅 미션 — 기존 가게 등록자만 (로드맵·AI 로드맵 유저 미노출, 완료 시 자동 소멸)
        if let storeInfo {
            BUStoreSetupMissionsCard(
                storeInfo: storeInfo,
                decisions: roadmapStore.decisions,
                entriesCount: mock.entries.count,
                costsTotal: dashboardStore?.costs.total ?? 0,
                categoryId: Self.starterCategoryId(for: mock.category),
                subIndustryId: UserDefaults.standard.string(forKey: "roadmap.selectedIndustryId"),
                onRevenue: { showInputSheet = true },
                onCosts: { onSwitchTab?(.analytics) },
                onOfferings: { onSwitchTab?(.offerings) },
                onVerifyBiz: { onSwitchTab?(.roadmap) }
            )
        }

        // ① AI 모닝 히어로 — 인사 + 위험신호(+스타트업 신호) + NSM + AI 코칭 (한 장 유지)
        HeroOuterCard(
            mock: mock,
            healthResult: healthResult,
            hero: hero,
            aiActions: aiActions
        )

        // ② 매출 흐름 (PortOne·TossPlace 등 자동수집 매출 합산 — autoSourceCount 배지)
        ActivitySnapshotCard(
            entries: mock.entries,
            bepDailySales: bepDailySales,
            autoSourceCount: dashboardStore?.autoSourceCount ?? 0,
            autoBreakdown: dashboardStore?.autoBreakdown ?? [],
            onTapBasis: ((dashboardStore?.autoCardOverlap ?? false) || (dashboardStore?.autoHasPopbill ?? false))
                ? { showBasisSheet = true } : nil,
            // 막대·"기록" 탭 → 그 날짜로 입력 시트 (웹 패리티)
            onSelectDate: { date in
                inputSheetDate = date
                showInputSheet = true
            }
        )

        // ③ 빠른 매출 입력 — 매출 흐름 바로 아래 (2026-08-19: 종전 홈 최하단 → 매출 직하)
        QuickInputButton(action: { showInputSheet = true })

        // ④ 손익 — 월 환산 매출 vs 월 비용 (실데이터). 웹 Tier1DailyHub 순서 손익→현금 미러.
        PLHeroCard(
            totalSales: ratios.monthlyRevenueEquivalent,
            totalCosts: mock.costs.total,
            ingredientRatio: ratios.ingredientRatio,
            laborRatio: ratios.laborRatio,
            rentRatio: ratios.rentRatio,
            thresholds: IndustryThresholds.thresholds(for: mock.category),
            categoryId: mock.category.benchmarkCategoryId
        )

        // ⑤ 현금흐름 — 미설정이면 설정 프롬프트, 설정 완료면 14일 잔고
        //   (손익과 2-up 은 폰 폭에서 숫자·차트가 깨져 스택 유지 — 웹은 .dash-2col)
        if let cs = cashflowStore {
            CashflowSection(
                store: cs,
                recentDailyEntries: mock.entries.map { CashflowDailyEntry(date: $0.date, sales: $0.sales) },
                fallbackMonthlyCostsTotal: mock.costs.total
            )
        } else {
            CashflowHeroCard(
                currentBalance: mock.currentCash ?? 0,
                projectedBalances: projected14,
                isCrisis: (projected14.last ?? 0) < 0,
                crisisDaysUntil: crisisDaysUntil()
            )
        }
    }

    @ViewBuilder
    private var opsSegment: some View {
        // ① 재고 vs 고객 (업종 분기) — startupTech 는 둘 다 생략
        if mock.category.showsCustomerCardInsteadOfInventory {
            let mode = BUCustomerMode(rawValue: mock.category.customerModeRaw) ?? .membership
            CustomerSummaryCard(
                members: realMembers,
                mode: mode,
                label: mock.category.customerLabelKo,
                onManage: { showCustomerSheet = true }
            )
        } else if mock.category != .startupTech {
            // 통합 '메뉴·재료 관리' (2026-07-22 사장님 지시, 웹 정합):
            //   메뉴 업종은 메뉴 섹션(→ MenuRecipeSheet: 원가율·판매 ±·레시피·재고 자동차감) 동봉.
            InventoryOpsCard(
                items: inventoryForCard,
                onManage: { showInventorySheet = true },
                menuItems: isMenuCardIndustry ? menuProducts : [],
                onManageMenus: (isMenuCardIndustry && storeInfo != nil) ? { showRecipeSheet = true } : nil
            )
        }

        // ② 직원 관리 (전 업종) — 웹 TodayManagementSection 재고·팀 그룹 미러
        TeamCard(
            employees: realEmployees,
            invitedNames: invitedStaff.map(\.name),
            manualLaborCost: mock.costs.labor,
            onManage: { showTeamSheet = true }
        )

        // 메뉴 수익성 카드 → '메뉴·재료 관리'(InventoryOpsCard 메뉴 섹션 → MenuRecipeSheet)로 흡수 (2026-07-22).

        // ③ 업종 핵심 (외식→원가율 / 소매→SellThrough / 피트니스→Retention / 교육→재등록 / 미용→예약 …)
        IndustryFocusCard(mock: mock, members: realMembers, inventory: realInventoryItems)

        // ④ 스타트업 핵심 지표 점수판 (런웨이·순burn·성장률·ARR/직원·총이익률·Burn Multiple, 전부 실데이터)
        if mock.category == .startupTech {
            StartupHealthCard(metrics: startupHealthMetrics)
        }

        // ④' 외식·카페 위생점검 — 원가율(IndustryFocus)과 나란히 (사장님: "둘 다")
        if mock.category == .restaurant || mock.category == .cafe {
            FoodSafetyCard()
        }

        // ⑤ 사용자수(고객 변화) — 성장 선행지표. 홈 전체에서 이 한 곳만 (더보기 오늘 상세 중복 제거 2026-08-19).
        //   회원 로스터(CustomerSummary)와 다른 *지표* 카드. 데이터 0 이면 '첫 10명' 온보딩 empty (가짜 없음).
        UserActivityCard(
            totalCustomers: totalCustomers,
            thisMonthCustomers: thisMonthCustomers,
            dailyAvgCustomers: dailyAvgCustomers,
            avgTicket: avgTicket
        )
    }

    @ViewBuilder
    private var moreSegment: some View {
        // 종전 MoreInsightsStrip 내용. 오늘 상세(KPI 스트립·코칭 일지·운영 의식)는 인라인(데이터 먼저),
        // 주간 점검·성장 도구는 전용 뷰라 시트로. '내 가게'·'로드맵' 진입점은 하단 탭 중복 → 제거.
        MoreInsightsStrip(
            mock: mock,
            dailyKpiCells: dailyKpiCells,
            storeInfo: storeInfo,
            coaching: coaching,
            saas: saas,
            subscription: subscription
        )
    }

    // MARK: - AI Morning Briefing (P0-A)

    /// AI dashboard/actions 호출 → aiActions @State 업데이트.
    /// MockData 의 매출·비용 데이터를 context 로 보내고, 서버가 enrichDashboardContext 로 나머지 채움.
    /// 매출 집계 기준 변경 후 재합산 — 새 basis 로 다시 fetch 해 매출 카드·breakdown 즉시 갱신.
    private func refetchUnifiedRevenue() async {
        guard let ds = dashboardStore else { return }
        let svc = UnifiedRevenueService(supabase: BUSupabase.shared.client)
        let u = await svc.fetch(basis: cashflowStore?.settings.revenueBasis, fromDays: 30)
        ds.mergeAutoEntries(
            u.entries, sourceCount: u.sources.count,
            breakdown: u.breakdown, cardOverlap: u.cardOverlap,
            hasPopbill: u.sources.popbill, basis: u.basis
        )
    }

    private func loadAIActions() async {
        // BUSupabase 의 currentSession 으로 인증 가능 확인. demo/anonymous 면 skip.
        guard BUSupabase.shared.currentUser != nil else {
            aiActions = nil  // mock fallback 유지
            return
        }

        // 매출·비용 합산 — server enrichment 의 input
        let monthlySalesWon = Int(mock.entries.reduce(0) { $0 + $1.sales })
        let monthlyCosts = AIDashboardMonthlyCosts(
            ingredients: Int(mock.costs.ingredients),
            labor: Int(mock.costs.labor),
            rent: Int(mock.costs.rent),
            utilities: Int(mock.costs.utilities),
            other: Int(mock.costs.other + mock.costs.sga + mock.costs.marketing + mock.costs.interest)
        )

        // health → enum 문자열 매핑
        let healthString: String = {
            switch healthResult.grade {
            case .healthy:            return "healthy"
            case .caution, .warning:  return "caution"
            case .critical:           return "danger"
            case .unknown:            return "healthy"
            }
        }()

        // iOS category enum 은 raw value 가 web 과 달라서 (restaurant vs food) 매핑 필수.
        let webCategoryId = webCategoryId(from: mock.category)

        // ── 웹 파리티: 클라이언트가 보낼 수 있는 운영 신호 (백엔드는 웹·iOS 동일 enrich) ──
        let totalCostWon = monthlyCosts.ingredients + monthlyCosts.labor + monthlyCosts.rent + monthlyCosts.utilities + monthlyCosts.other
        let primeRate = monthlySalesWon > 0
            ? Double(monthlyCosts.ingredients + monthlyCosts.labor) / Double(monthlySalesWon) : 0
        let sortedEntries = mock.entries.sorted { $0.date < $1.date }
        let last7Sum = sortedEntries.suffix(7).reduce(0.0) { $0 + $1.sales }
        let prev7Sum = sortedEntries.dropLast(7).suffix(7).reduce(0.0) { $0 + $1.sales }
        let weeklyChange = prev7Sum > 0 ? ((last7Sum - prev7Sum) / prev7Sum) * 100 : 0
        let monthlyBurn = max(0.0, Double(totalCostWon - monthlySalesWon))
        let runwayMonths: Double = {
            guard let cash = mock.currentCash, cash > 0, monthlyBurn > 0 else { return 0 }
            return cash / monthlyBurn
        }()
        let operatingPhase: String = mock.daysSinceLaunch <= 0 ? "pre-launch"
            : mock.daysSinceLaunch > 90 ? "mature"
            : mock.daysSinceLaunch > 30 ? "growth" : "early"
        let salesTrend: String = {
            let last14 = Array(sortedEntries.suffix(14))
            guard last14.count >= 14 else { return "insufficient" }
            let r7 = last14.suffix(7).reduce(0.0) { $0 + $1.sales } / 7
            let p7 = last14.prefix(7).reduce(0.0) { $0 + $1.sales } / 7
            guard p7 > 0 else { return "insufficient" }
            let ch = (r7 - p7) / p7 * 100
            return ch >= 5 ? "improving" : ch <= -5 ? "declining" : "stable"
        }()
        // 요일별 매출 패턴 — 최약 요일이 일평균의 N% (웹 computeWeakestDayPct 미러). 달력 날짜 요일은 UTC 기준(TZ 무관).
        let weakestDayPct: Int? = {
            let withSales = sortedEntries.filter { $0.sales > 0 }
            guard withSales.count >= 14 else { return nil }
            let df = TodayFormatters.isoUTC
            var cal = Calendar(identifier: .gregorian)
            cal.timeZone = TimeZone(identifier: "UTC")!
            var sums = [Double](repeating: 0, count: 7)
            var counts = [Int](repeating: 0, count: 7)
            for e in withSales {
                guard let d = df.date(from: e.date) else { continue }
                let dow = cal.component(.weekday, from: d) - 1  // 1=일 → 0
                sums[dow] += e.sales
                counts[dow] += 1
            }
            var weekdayAvgs: [Double] = []
            for i in 0..<7 where counts[i] >= 2 { weekdayAvgs.append(sums[i] / Double(counts[i])) }
            guard weekdayAvgs.count >= 4 else { return nil }
            let overallAvg = withSales.reduce(0.0) { $0 + $1.sales } / Double(withSales.count)
            guard overallAvg > 0, let weakest = weekdayAvgs.min() else { return nil }
            let pct = Int((weakest / overallAvg * 100).rounded())
            return pct < 95 ? pct : nil
        }()

        let context = AIDashboardContext(
            industryCategoryId: webCategoryId,
            storeName: mock.storeName,
            industryLabel: mock.category.labelKo,
            monthlySales: monthlySalesWon,
            monthlyCosts: monthlyCosts,
            weeklyChange: weeklyChange,
            primeRate: primeRate,
            runway: runwayMonths,
            businessHealthScore: healthString,
            daysSinceLaunch: mock.daysSinceLaunch,
            operatingPhase: operatingPhase,
            salesTrendDirection: salesTrend,
            weakestDayPct: weakestDayPct
        )

        let repo = AIDashboardActionsRepository(supabase: BUSupabase.shared.client)
        do {
            let response = try await repo.fetchActions(context: context)
            // server fallback (LLM 파싱 실패) 면 빈 배열. mock 으로 그대로 유지.
            if response._fallback == true || response.todayActions.isEmpty {
                aiActions = nil
                return
            }
            aiActions = response.toAiActions()
            aiFetchError = nil
        } catch {
            // 인증 만료·429·500 모두 silent fail (사장님 화면 보호 — mock fallback).
            aiFetchError = error.localizedDescription
            aiActions = nil
        }
    }

    // MARK: - Derived for cards

    private var ratios: CostRatiosResult {
        CostRatios.calculate(
            costs: mock.costs,
            totalRevenue: mock.entries.reduce(0) { $0 + $1.sales },
            days: mock.entries.count
        )
    }

    private var bepDailySales: Double {
        mock.costs.total > 0 ? mock.costs.total / 26 : 0
    }

    private var totalCustomers: Int {
        // 가짜 금지: 고객 0명이면 0 그대로(종전 max(1,…)은 1명 위조 + 객단가 부풀림).
        // avgTicket 은 자체 분모 가드(>0)가 있어 0 division 안전.
        mock.entries.reduce(0) { $0 + $1.customers }
    }

    /// 이번 달 누적 고객 (실데이터) — 현재 월 entry 의 고객 수 합.
    private var thisMonthCustomers: Int {
        let ym = TodayFormatters.yearMonth.string(from: Date())
        return mock.entries.filter { $0.date.hasPrefix(ym) }.reduce(0) { $0 + $1.customers }
    }

    /// 일평균 고객 (실데이터) — 누적 고객 ÷ 고객 입력된 일수.
    private var dailyAvgCustomers: Double {
        let daysWithCustomers = mock.entries.filter { $0.customers > 0 }.count
        guard daysWithCustomers > 0 else { return 0 }
        let total = mock.entries.reduce(0) { $0 + $1.customers }
        return Double(total) / Double(daysWithCustomers)
    }

    private func monthPrefix(offset: Int) -> String {
        let cal = Calendar.current
        let base = cal.date(byAdding: .month, value: offset, to: Date()) ?? Date()
        return TodayFormatters.yearMonth.string(from: base)
    }
    private var thisMonthSales: Double {
        let ym = monthPrefix(offset: 0)
        return mock.entries.filter { $0.date.hasPrefix(ym) }.reduce(0) { $0 + $1.sales }
    }
    private var lastMonthSales: Double {
        let ym = monthPrefix(offset: -1)
        return mock.entries.filter { $0.date.hasPrefix(ym) }.reduce(0) { $0 + $1.sales }
    }

    /// 스타트업 핵심 지표 — 전부 실데이터 계산. 불가 항목은 nil → 카드가 "—" 표시(가짜 금지).
    private var startupHealthMetrics: StartupHealthMetrics {
        let monthlyRev = ratios.monthlyRevenueEquivalent
        let netBurn = mock.costs.total - monthlyRev
        let runway: Double? = {
            guard let cash = mock.currentCash, cash > 0, netBurn > 0 else { return nil }
            return cash / netBurn
        }()
        let mom: Double? = lastMonthSales > 0 ? (thisMonthSales - lastMonthSales) / lastMonthSales * 100 : nil
        let emp = realEmployees.count
        let arrPerEmp: Double? = (emp > 0 && monthlyRev > 0) ? (monthlyRev * 12) / Double(emp) : nil
        let gm: Double? = ratios.ready ? max(0, 100 - ratios.ingredientRatio) : nil
        let netNew = thisMonthSales - lastMonthSales
        let bm: Double? = (netBurn > 0 && netNew > 0) ? netBurn / netNew : nil
        return StartupHealthMetrics(
            runwayMonths: runway, netBurnMonthly: netBurn, momGrowthPct: mom,
            arrPerEmployee: arrPerEmp, grossMarginPct: gm, burnMultiple: bm
        )
    }

    private var avgTicket: Double {
        let totalRev = mock.entries.reduce(0.0) { $0 + $1.sales }
        let totalCust = totalCustomers
        return totalCust > 0 ? totalRev / Double(totalCust) : 0
    }

    private var projected14: [Double] {
        guard let cash = mock.currentCash else { return [] }
        let avgDaily = ratios.monthlyRevenueEquivalent / 26
        let dailyBurn = mock.costs.total / 26
        let dailyNet = avgDaily - dailyBurn
        return (0..<14).map { day in
            cash + dailyNet * Double(day)
        }
    }

    private func crisisDaysUntil() -> Int? {
        for (idx, b) in projected14.enumerated() where b < 0 {
            return idx
        }
        return nil
    }

    // MARK: - 재고·직원·고객 카드용 실데이터 (storeInfo 로드 후 사용, 미로드 시 빈 배열)

    private var realInventoryItems: [BUInventoryItem] {
        guard let si = storeInfo, si.isLoaded else { return [] }
        return si.state.inventory
    }

    /// IndustryCategory → 웹 starter category id (세팅 미션 오퍼링 kind 해석용 — categoryToIndustry 역방향)
    static func starterCategoryId(for category: IndustryCategory) -> String? {
        switch category {
        case .restaurant:    return "food"
        case .cafe:          return "cafe-dessert"
        case .retail:        return "retail"
        case .beauty:        return "beauty"
        case .fitness:       return "fitness"
        case .education:     return "education"
        case .pet:           return "pet"
        case .livingService: return "living-service"
        case .space:         return "space"
        case .ecommerce:     return "online-digital"
        case .startupTech:   return "startup-tech"
        default:             return nil
        }
    }

    /// 메뉴 수익성 카드 노출 업종 — 음식·카페·서비스(메뉴/서비스 라인업 입력 업종).
    ///   소매·이커머스는 product 가 곧 재고라 제외(SellThrough 가 담당).
    private var isMenuCardIndustry: Bool {
        switch mock.category {
        case .restaurant, .cafe, .beauty, .fitness, .pet, .education, .livingService, .space: return true
        default: return false
        }
    }

    /// 시뮬 시각 검증용 카페 픽스처 — 벌크(원가·리듬)·개수(수량)·홀/포장 메뉴 전 유형 포함.
    /// BU_DEMO_SEED_INVENTORY=cafe 에서만 사용 (no-op fallback store 전용, 2026-08-25).
    private static func demoCafeInventory() -> [BUInventoryItem] {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        let fiveDaysAgo = f.string(from: Date().addingTimeInterval(-5 * 86_400))
        return [
            BUInventoryItem(id: "demo-milk", name: "우유", quantity: 0, unit: "ml", unitCost: 2.6, category: "fresh",
                            lastOrderedAt: fiveDaysAgo, orderCycleDays: 3,
                            purchasePackSize: 1000, purchasePackPrice: 2600),
            BUInventoryItem(id: "demo-bean", name: "원두", quantity: 0, unit: "g", unitCost: 18, category: "beverage",
                            purchasePackSize: 1000, purchasePackPrice: 18000),
            BUInventoryItem(id: "demo-cup", name: "아이스컵", quantity: 40, unit: "개", minThreshold: 50, unitCost: 150, category: "supply"),
            BUInventoryItem(id: "demo-straw", name: "빨대", quantity: 500, unit: "개", minThreshold: 100, unitCost: 20, category: "supply"),
            BUInventoryItem(id: "demo-americano", name: "아메리카노", quantity: 0, unit: "개", category: "other", itemType: "product",
                            recipe: [BURecipeIngredient(materialId: "demo-bean", qty: 18, unit: "g")],
                            takeoutRecipe: [
                                BURecipeIngredient(materialId: "demo-cup", qty: 1, unit: "개"),
                                BURecipeIngredient(materialId: "demo-straw", qty: 1, unit: "개"),
                            ],
                            sellingPrice: 4500, monthlySold: 8, monthlySoldTakeout: 5),
        ]
    }

    /// 메뉴 수익성 카드용 — 로드맵 menu-design 이 product 로 기록한 메뉴.
    private var menuProducts: [BUInventoryItem] {
        realInventoryItems.filter { $0.itemType == "product" }
    }

    /// 재고 카드용 — 메뉴 카드 업종이면 식자재(material)만 표시(메뉴 "재고 0개" 중복 방지).
    private var inventoryForCard: [BUInventoryItem] {
        isMenuCardIndustry ? realInventoryItems.filter { $0.itemType != "product" } : realInventoryItems
    }

    private var realEmployees: [BUEmployee] {
        guard let si = storeInfo, si.isLoaded else { return [] }
        return si.state.employees
    }

    private var realMembers: [BUMember] {
        guard let si = storeInfo, si.isLoaded else { return [] }
        return si.state.members
    }

    /// 초대된 직원(store_members) 로드 — 팀카드 인원·명단. get_store_members RPC(사장 본인 소유).
    ///   RPC 에러 시 기존 값 유지 — 빈 배열로 덮으면 일시 오류가 "직원 0명"으로 보임(RPC 에러≠부재).
    ///   데모/비로그인은 초기값 [] 그대로(수동 급여명단으로 fallback). 2026-07-14
    private func loadInvitedStaff() async {
        guard storeInfo != nil else { return }
        let repo = TeamRepository(supabase: BUSupabase.shared.client)
        do {
            invitedStaff = try await repo.members()
        } catch {
            logger.error("invitedStaff 로드 실패(기존 값 유지): \(error.localizedDescription)")
        }
    }

    private var dailyKpiCells: [KpiCellData] {
        // ⚠️ 2026-05-25 fix: 이전 `.sorted.last` 는 "가장 최근 entry" 라 어제 미입력 시
        //    3일 전 데이터가 "어제 매출" 로 표시되는 거짓말 버그. 정확히 어제 날짜로 검색.
        let yesterdayEntry = mock.entries.yesterdayEntry()
        let yesterdaySales = yesterdayEntry?.sales ?? 0
        let yesterdayCust = yesterdayEntry?.customers ?? 0
        let avgT = yesterdayCust > 0 ? yesterdaySales / Double(yesterdayCust) : 0
        // 런웨이 = 현금 ÷ 순월비용. 비용 미입력·현금 미상 → "—"(계산 불가),
        // 순비용 ≤ 0(흑자) → "흑자"(현금소진 개월 개념 무의미). 종전 99 위조 제거 — 웹 CEOMorningHero 와 동기.
        let runway: (months: Double, override: String?, grade: HealthGrade) = {
            guard let cash = mock.currentCash, mock.costs.total > 0 else { return (.nan, "—", .unknown) }
            let monthlyBurn = mock.costs.total - ratios.monthlyRevenueEquivalent
            guard monthlyBurn > 0 else { return (.nan, "흑자", .healthy) }
            let m = cash / monthlyBurn
            return (m, nil, HealthGrade.from(score: m * 10))
        }()
        return [
            .init(label: "어제매출", value: yesterdaySales, grade: yesterdaySales > 0 ? .healthy : .unknown, unit: "원"),
            .init(label: "어제고객", value: Double(yesterdayCust), grade: yesterdayCust > 0 ? .healthy : .unknown, unit: "명"),
            .init(label: "원가율", value: ratios.primeCostRatio,
                  grade: IndustryThresholds.thresholds(for: mock.category).primeCost?.grade(ratios.primeCostRatio) ?? .unknown,
                  unit: "%"),
            .init(label: "런웨이", value: runway.months.isFinite ? runway.months : nil,
                  displayOverride: runway.override,
                  grade: runway.grade, unit: "개월"),
            .init(label: "객단가", value: avgT, grade: avgT > 0 ? .healthy : .unknown, unit: "원"),
        ]
    }
}

// MARK: - Tier 0 — ritual banner (헤더는 BUPageHeader 공통, 2026-08-19)

private struct HomeRitualBanner: View {
    /// 2026-08-19 IA: 슬림 · 닫기 가능. 닫으면 해당 ISO 주(yyyy-Www) 동안 비표시 → 다음 주 자동 복귀 (주간 리추얼 성격).
    @AppStorage("home.ritualBanner.dismissedWeek") private var dismissedWeek = ""

    private static var currentWeekKey: String {
        let cal = Calendar(identifier: .iso8601)
        let c = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
        return "\(c.yearForWeekOfYear ?? 0)-W\(c.weekOfYear ?? 0)"
    }

    var body: some View {
        if dismissedWeek != Self.currentWeekKey {
            banner
        }
    }

    private var banner: some View {
        HStack(alignment: .center, spacing: 10) {
            Image(systemName: "calendar")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .frame(width: 26, height: 26)
                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 1) {
                Text("이번 주 목표를 세워보세요")
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .tracking(-0.13)
                Text("지난주 하이라이트를 돌아보고 한 가지 집중 목표를 정합니다.")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            Button {
                withAnimation(.easeInOut(duration: 0.18)) { dismissedWeek = Self.currentWeekKey }
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)
                    .frame(width: 26, height: 26)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("이번 주 리추얼 배너 닫기")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
        )
    }
}

// MARK: - Hero Outer Card (3-Row 통합)

private struct HeroOuterCard: View {
    let mock: MockData
    let healthResult: UnifiedHealthResult
    let hero: Hero
    /// 2026-05-27 P0-A: 서버에서 받은 AI 액션. nil 이면 mock 데이터로 fallback.
    /// AI fetch 완료 시 onAppear / .task 에서 채워짐.
    let aiActions: [AiAction]?

    @AppStorage("roadmap.selectedIndustryId") private var specialtyId = ""

    init(mock: MockData, healthResult: UnifiedHealthResult, hero: Hero, aiActions: [AiAction]? = nil) {
        self.mock = mock
        self.healthResult = healthResult
        self.hero = hero
        self.aiActions = aiActions
    }

    var body: some View {
        BUCard(.heroOuter) {
            VStack(alignment: .leading, spacing: BUSpacing.heroGap) {
                Row1Greeting(mock: mock, healthResult: healthResult)
                Row1_5RiskSignals(healthResult: healthResult)
                Row2NSMNested(mock: mock, hero: hero, healthResult: healthResult)
                // AI 데이터 있으면 그것 사용, 없으면 정적 fallback (mock.resolverInput.aiTopActions)
                Row3CoachingNested(
                    hero: hero,
                    actions: aiActions ?? mock.resolverInput.aiTopActions
                )
                // 실제 AI 코칭일 때만 피드백 — "안 맞아요"는 다음 코칭 prompt 에 주입돼 자가개선.
                if let acts = aiActions, !acts.isEmpty {
                    CoachingFeedbackRow(
                        headline: hero.analysisKo,
                        industryCategoryId: mock.category.benchmarkCategoryId,
                        specialtyId: specialtyId.isEmpty ? nil : specialtyId
                    )
                }
            }
        }
    }
}

// MARK: - Row 1 — 인사 + chips + greeting (웹 정확 미러)

private struct Row1Greeting: View {
    let mock: MockData
    let healthResult: UnifiedHealthResult

    /// 인사말 — userName이 이메일 형식이면 "사장님" 으로 대체.
    /// 이메일을 그대로 노출하면 호칭이 어색하고 줄이 길어져 Hero가 비대해짐.
    private var greetingLine1: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let timeOfDay: String
        switch hour {
        case 5..<11:  timeOfDay = "좋은 아침"
        case 11..<17: timeOfDay = "수고하세요"
        case 17..<22: timeOfDay = "저녁이에요"
        default:      timeOfDay = "밤이에요"
        }
        return "\(timeOfDay), \(displayUserName)"
    }

    /// 호칭용 사용자명 — 이메일이면 사장님으로, 빈 값이면 사장님으로.
    private var displayUserName: String {
        let raw = mock.userName.trimmingCharacters(in: .whitespacesAndNewlines)
        if raw.isEmpty || raw.contains("@") { return "사장님" }
        return raw
    }

    private var periodIcon: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<11:  return "sun.max"
        case 11..<17: return "sun.haze"
        case 17..<22: return "moon.haze"
        default:      return "moon.stars"
        }
    }

    private var dateString: String {
        TodayFormatters.koMonthDayWeekday.string(from: Date())
    }

    private var modeLabel: String {
        switch mock.category {
        case .startupTech: return "스타트업 모드"
        case .ecommerce:   return "온라인 모드"
        default:           return "운영 모드"
        }
    }

    private var weeklyChangePct: Double? {
        guard mock.entries.count >= 14 else { return nil }
        let sorted = mock.entries.sorted { $0.date < $1.date }
        let recent7 = sorted.suffix(7).reduce(0.0) { $0 + $1.sales }
        let prior7 = sorted.suffix(14).prefix(7).reduce(0.0) { $0 + $1.sales }
        guard prior7 > 0 else { return nil }
        return ((recent7 - prior7) / prior7) * 100
    }

    var body: some View {
        // 모바일 압축 레이아웃 — 사장님 피드백(2026-05-14):
        //   Hero가 화면 절반 차지 → 다른 카드 집중도 ↓.
        // 변경:
        //   • 아이콘 30×30 (-6pt)
        //   • Sub-greeting "상호명 · 운영 N일째" 제거 (BUPageHeader 중복)
        //   • 인사말 1줄 lineLimit + minimumScaleFactor
        HStack(alignment: .center, spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(BUColor.midnight08)
                    .frame(width: 30, height: 30)
                Image(systemName: periodIcon)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundStyle(BUColor.midnight)
            }

            VStack(alignment: .leading, spacing: 4) {
                // Eyebrow + chips 통합 (날짜는 너무 자명한 정보라 한 라인 압축)
                HStack(spacing: 5) {
                    Text(dateString)
                        .buHeroEyebrowStyle()
                        .lineLimit(1)
                    if mock.resolverInput.businessLaunched {
                        ChipFilled(text: "\(mock.daysSinceLaunch + 1)일째")
                    }
                    ChipSoft(text: shortStageLabel)
                    if let wow = weeklyChangePct {
                        ChipTrend(pct: wow)
                    }
                    Spacer(minLength: 0)
                }

                Text(greetingLine1)
                    .buHeroGreetingStyle()
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            Spacer(minLength: 0)
        }
    }

    /// 모바일 viewport 에 맞는 짧은 단계 라벨
    private var shortStageLabel: String {
        switch mock.stage {
        case .early:  return "초기"
        case .growth: return "성장"
        case .mature: return "성숙"
        }
    }
}

// MARK: - Row 1.5 — 다중 위험신호 박스

private struct Row1_5RiskSignals: View {
    let healthResult: UnifiedHealthResult

    private var signals: [RiskSignal] {
        guard healthResult.ready else { return [] }
        let order: [DomainKey] = [.cash, .profit, .efficiency, .growth]
        var out: [RiskSignal] = []
        for key in order {
            guard let dom = healthResult.domains[key],
                  dom.grade == .critical || dom.grade == .warning,
                  let worst = dom.components
                    .filter({ $0.score.isFinite })
                    .min(by: { $0.score < $1.score })
            else { continue }
            out.append(RiskSignal(
                grade: dom.grade,
                title: title(for: key),
                message: "\(worst.name) \(formatValue(name: worst.name, value: worst.value)) — 영역 점수 \(Int(dom.score))점"
            ))
            if out.count >= 3 { break }
        }
        return out
    }

    private func title(for key: DomainKey) -> String {
        switch key {
        case .cash:       return "현금 흐름 위험"
        case .profit:     return "수익성 위험"
        case .efficiency: return "비용 효율 위험"
        case .growth:     return "성장 둔화"
        }
    }
    private func formatValue(name: String, value: Double) -> String {
        guard value.isFinite else { return "—" }
        if name.contains("런웨이") { return String(format: "%.1f개월", value) }
        if name.contains("성장") { return "\(value > 0 ? "+" : "")\(String(format: "%.1f", value))%" }
        return "\(String(format: "%.1f", value))%"
    }

    var body: some View {
        if !signals.isEmpty {
            VStack(spacing: BUSpacing.xs) {
                ForEach(signals) { s in
                    let palette = HealthColors.palette(for: s.grade)
                    BUCard(.inner, tint: palette.dot) {
                        HStack(alignment: .top, spacing: 11) {
                            Circle()
                                .fill(palette.dot)
                                .frame(width: 9, height: 9)
                                .padding(.top, 5)
                                .shadow(color: palette.glow, radius: 4)
                            VStack(alignment: .leading, spacing: 3) {
                                HStack(spacing: 8) {
                                    Text(s.title)
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(palette.text)
                                        .lineLimit(1)
                                    Text(s.grade.labelKo)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(palette.text.opacity(0.7))
                                        .textCase(.uppercase)
                                        .tracking(0.5)
                                    Spacer(minLength: 0)
                                }
                                Text(s.message)
                                    .font(.system(size: 12.5, weight: .medium))
                                    .foregroundStyle(BUColor.ink.opacity(0.7))
                                    .lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Row 2 — NSM nested white card

private struct Row2NSMNested: View {
    let mock: MockData
    let hero: Hero
    let healthResult: UnifiedHealthResult

    private var nsmValue: String {
        // ⚠️ 2026-05-25 fix: "어제 매출" 라벨이므로 어제 entry 만. 미입력 시 "—" 표시.
        //    이전 `.sorted.last` 는 사장님 신고 — "3일 전 매출이 어제로 떴음" 버그 원인.
        let v = Int(mock.entries.yesterdaySales())
        if v == 0 { return "—" }
        return v.formatted(.number.grouping(.automatic))
    }

    private var nsmLabel: String { "어제 매출" }

    private var weeklyChangePct: Double? {
        guard mock.entries.count >= 14 else { return nil }
        let sorted = mock.entries.sorted { $0.date < $1.date }
        let r7 = sorted.suffix(7).reduce(0.0) { $0 + $1.sales }
        let p7 = sorted.suffix(14).prefix(7).reduce(0.0) { $0 + $1.sales }
        guard p7 > 0 else { return nil }
        return ((r7 - p7) / p7) * 100
    }

    private var deltaTone: (color: Color, bg: Color) {
        guard let pct = weeklyChangePct else {
            return (BUColor.inkMuted, BUColor.midnight08)
        }
        if pct >= 0 { return (BUColor.success, BUColor.success08) }
        return (BUColor.danger, BUColor.danger08)
    }

    private var avgDaily7: Double {
        let sorted = mock.entries.sorted { $0.date < $1.date }
        let last7 = sorted.suffix(7)
        guard !last7.isEmpty else { return 0 }
        return last7.reduce(0) { $0 + $1.sales } / Double(last7.count)
    }

    var body: some View {
        // 모바일 압축 (2026-05-14):
        //   7일 막대 차트는 ActivitySnapshotCard 와 동일 → Hero 에서 제거.
        //   Hero 는 "어제 매출 한 숫자 + WoW" 핵심만, 차트는 아래 카드로.
        BUCard(.nested) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .center, spacing: 8) {
                    Text(nsmLabel).buNsmEyebrowStyle()
                    Spacer(minLength: 0)
                    if let pct = weeklyChangePct {
                        DeltaPill(pct: pct, label: "WoW", tone: deltaTone)
                    }
                }

                Text(nsmValue)
                    .buNsmValueStyle()

                if avgDaily7 > 0 {
                    Text("7일 일평균 \(Int(avgDaily7).formatted())원")
                        .buNsmDescriptionStyle()
                }
            }
        }
    }

}

private struct DeltaPill: View {
    let pct: Double
    let label: String
    let tone: (color: Color, bg: Color)

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: pct >= 0 ? "arrow.up.right" : "arrow.down.right")
                .font(.system(size: 10, weight: .heavy))
            Text("\(pct >= 0 ? "+" : "")\(String(format: "%.1f", pct))%")
                .font(.system(size: 12.5, weight: .bold))
                .monospacedDigit()
        }
        .foregroundStyle(tone.color)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(tone.bg, in: Capsule())
        .fixedSize()
    }
}

// MARK: - Row 3 — AI 코칭 nested card (CEOMorningHero 의 hero CTA)

private struct Row3CoachingNested: View {
    let hero: Hero
    /// 우선순위 정렬된 행동 추천. Hero 카드엔 첫 번째만, 탭하면 전체 (최대 3개) popup.
    let actions: [AiAction]

    @State private var showActionsSheet = false

    private var toneColor: Color {
        switch hero.tone {
        case .crisis:  return BUColor.danger
        case .warning: return BUColor.warn
        case .neutral: return BUColor.midnight
        }
    }

    private var toneIcon: String {
        switch hero.tone {
        case .crisis:  return "exclamationmark.octagon.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .neutral: return "sparkles"
        }
    }

    /// 2개 이상일 때만 "+N개 더" 표시 + 탭 가능.
    private var hasMoreActions: Bool { actions.count >= 2 }

    var body: some View {
        Button {
            if hasMoreActions { showActionsSheet = true }
        } label: {
            BUCard(.nested) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Image(systemName: toneIcon)
                            .font(.system(size: 10, weight: .bold))
                        Text(hero.tagKo)
                            .font(.system(size: 9.5, weight: .bold))
                            .tracking(0.9)
                            .textCase(.uppercase)
                            .lineLimit(1)
                        Spacer(minLength: 0)
                        if hasMoreActions {
                            HStack(spacing: 3) {
                                Text("+\(actions.count - 1)개 더")
                                    .font(.system(size: 9.5, weight: .bold))
                                    .tracking(0.2)
                                Image(systemName: "arrow.up.right.square")
                                    .font(.system(size: 9, weight: .bold))
                            }
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(BUColor.midnight08, in: Capsule())
                        } else if let ref = hero.referencedCase {
                            HStack(spacing: 3) {
                                Image(systemName: "bookmark.fill")
                                    .font(.system(size: 8))
                                Text(ref.name)
                                    .font(.system(size: 9.5, weight: .bold))
                                    .tracking(0.2)
                                    .lineLimit(1)
                            }
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(BUColor.midnight08, in: Capsule())
                        }
                    }
                    .foregroundStyle(toneColor)

                    Text(hero.analysisKo)
                        .font(.system(size: 13.5, weight: .medium))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(2)
                        .multilineTextAlignment(.leading)
                        .lineLimit(6)   // 2026-08-19: 3줄에서 문장 중간 잘림(실렌더) → 여유. 긴 진단은 '+N개 더' 시트에서 전체
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    if !hero.actionKo.isEmpty {
                        Text(hero.actionKo)
                            .font(.system(size: 12.5, weight: .regular))
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(1.5)
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
        }
        .buttonStyle(.plain)
        .disabled(!hasMoreActions)
        .sheet(isPresented: $showActionsSheet) {
            AIActionsSheet(actions: actions, hero: hero)
        }
    }
}

// MARK: - AI Actions Sheet — popup 으로 3개 우선순위 행동 추천 모두 보기 (웹 SSOT 미러)

private struct AIActionsSheet: View {
    let actions: [AiAction]
    let hero: Hero
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                BUFlatBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        // 안내 텍스트
                        Text("오늘의 우선순위 행동")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                            .tracking(-0.4)
                            .padding(.top, 4)

                        Text("AI 가 사장님의 매출·비용·고객 데이터에서 도출한 \(actions.count)가지 행동을 우선순위 순서로 보여드립니다.")
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(3)
                            .padding(.bottom, 4)

                        // 우선순위 행동 카드 (1, 2, 3)
                        ForEach(Array(actions.enumerated()), id: \.offset) { idx, action in
                            actionCard(rank: idx + 1, action: action)
                        }

                        // 안내 footer
                        // "자동 갱신 + 업데이트돼요" 두 문장이 같은 뜻 — 한 문장으로 (2026-07-31)
                        Text("매일 아침 자동 갱신됩니다.")
                            .font(.system(size: 11))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(2)
                            .padding(.top, 8)

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("AI 경영 브리핑")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private func actionCard(rank: Int, action: AiAction) -> some View {
        let priorityColor: Color = {
            switch action.priority {
            case .high:   return BUColor.danger
            case .medium: return BUColor.warn
            case .low:    return BUColor.midnight
            }
        }()
        let priorityLabel: String = {
            switch action.priority {
            case .high:   return "긴급"
            case .medium: return "권장"
            case .low:    return "참고"
            }
        }()

        return HStack(alignment: .top, spacing: 12) {
            // Rank circle
            ZStack {
                Circle()
                    .fill(priorityColor.opacity(0.12))
                    .frame(width: 36, height: 36)
                Text("\(rank)")
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundStyle(priorityColor)
                    .monospacedDigit()
            }

            VStack(alignment: .leading, spacing: 6) {
                // Priority chip + reference
                HStack(spacing: 6) {
                    Text(priorityLabel)
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(0.6)
                        .textCase(.uppercase)
                        .foregroundStyle(priorityColor)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(priorityColor.opacity(0.10), in: Capsule())
                    if let ref = action.referencedCase {
                        HStack(spacing: 3) {
                            Image(systemName: "bookmark.fill")
                                .font(.system(size: 9))
                            Text(ref.name)
                                .font(.system(size: 10, weight: .bold))
                                .tracking(0.2)
                                .lineLimit(1)
                        }
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(BUColor.midnight08, in: Capsule())
                    }
                    // 정량 ROI 배지 — 웹과 동일 "예상 +X만"
                    if let impact = action.estimatedImpactWon, impact > 0 {
                        HStack(spacing: 3) {
                            Image(systemName: "chart.line.uptrend.xyaxis")
                                .font(.system(size: 9, weight: .bold))
                            Text("예상 +\((impact / 10_000).formatted())만")
                                .font(.system(size: 10, weight: .bold))
                                .tracking(0.2)
                        }
                        .foregroundStyle(BUColor.success)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(BUColor.success.opacity(0.12), in: Capsule())
                    }
                    Spacer(minLength: 0)
                }

                Text(action.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(2)
                    .multilineTextAlignment(.leading)

                Text(action.reason)
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.78))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(priorityColor.opacity(0.18), lineWidth: 1)
        )
    }
}

// MARK: - 빠른 입력 버튼 (Hero 아래)

private struct QuickInputButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(BUColor.midnight08)
                        .frame(width: 36, height: 36)
                    Image(systemName: "plus")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("매출 기록·수정")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                    Text("지난 날짜 선택 · 고객수 입력")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.inkSubtle)
            }
            .padding(EdgeInsets(top: 14, leading: 16, bottom: 14, trailing: 16))
            .background(
                LinearGradient(
                    colors: [BUColor.cardGradientTop, BUColor.cardGradientBottom],
                    startPoint: .top,
                    endPoint: .bottom
                ),
                in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
            .buShadow(.card)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Quick Input Sheet

/// 매출 입력 — 웹 ActivitySnapshotCard 패리티. 과거 날짜 선택 + 매출·고객수 + 수정/삭제.
///   (종전: 오늘·매출만. 웹은 날짜 선택·고객수·수정 가능 → 동일 수준으로 확장.)
///   저장은 dashboardStore.upsertEntry(임의 날짜 upsert→Supabase), 삭제는 deleteEntry(date).
private struct QuickInputSheet: View {
    let dashboardStore: DashboardStore?
    /// 매출 흐름 막대에서 넘어온 날짜 (nil = 오늘)
    var initialDate: Date? = nil
    @Environment(\.dismiss) private var dismiss

    private enum Field: Hashable { case sales, customers }
    @State private var selectedDate: Date = Date()
    @State private var sales: Int = 0
    @State private var customers: Int = 0
    @State private var field: Field = .sales

    /// KST "yyyy-MM-dd" (UTC off-by-one 회피, 위젯 LogSalesIntent 와 동일 패턴).
    private static let iso: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        return f
    }()
    private var dateStr: String { Self.iso.string(from: selectedDate) }
    private var existing: DailyEntry? { dashboardStore?.entries.first { $0.date == dateStr } }

    /// 선택 날짜의 기존 entry 를 키패드에 프리필(수정 모드). 없으면 0.
    private func loadForDate() {
        let e = existing
        sales = Int(e?.sales ?? 0)
        customers = e?.customers ?? 0
    }

    private func save() {
        guard let store = dashboardStore, sales > 0 || customers > 0 else { dismiss(); return }
        let entry = DailyEntry(date: dateStr, sales: Double(sales), customers: customers)
        Task { await store.upsertEntry(entry) }
        dismiss()
    }

    private func delete() {
        guard let store = dashboardStore else { dismiss(); return }
        let d = dateStr
        Task { await store.deleteEntry(date: d) }
        dismiss()
    }

    /// 활성 필드(매출/고객수)를 가리키는 키패드 바인딩 — 키패드 1개를 토글로 공유.
    private var activeBinding: Binding<Int> {
        Binding(
            get: { field == .sales ? sales : customers },
            set: { if field == .sales { sales = $0 } else { customers = $0 } }
        )
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: BUSpacing.sm) {
                // 날짜 선택 (과거 가능, 미래 차단)
                DatePicker("날짜", selection: $selectedDate, in: ...Date(), displayedComponents: .date)
                    .datePickerStyle(.compact)
                    .padding(.horizontal, BUSpacing.lg)
                    .onChange(of: selectedDate) { _, _ in loadForDate(); field = .sales }

                // 매출/고객수 현재값 요약 + 입력 대상 토글
                Picker("입력 항목", selection: $field) {
                    Text(sales > 0 ? "매출 \(sales.formatted())원" : "매출").tag(Field.sales)
                    Text(customers > 0 ? "고객 \(customers)명" : "고객수").tag(Field.customers)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, BUSpacing.lg)

                // 공유 키패드 — 활성 필드 입력. 기록 버튼 = 전체 저장.
                BUNumberPad(
                    amount: activeBinding,
                    unit: field == .sales ? "원" : "명",
                    quickAddValues: field == .sales ? [100_000, 10_000, 5_000, 1_000, 100] : [10, 5, 1],
                    onSubmit: save
                )
            }
            .navigationTitle(existing != nil ? "매출 수정" : "매출 기록")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("취소") { dismiss() }
                        .foregroundStyle(BUColor.inkSecondary)
                }
                if existing != nil {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("삭제", role: .destructive) { delete() }
                    }
                }
            }
            #endif
            .onAppear {
                if let initialDate { selectedDate = initialDate }
                loadForDate()
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - 현금흐름 섹션 (게이팅: 설정 프롬프트 ↔ HeroCard)
//
// store.settings.isConfigured(setupCompletedAt != nil) 로 분기 — 웹 CashflowHeroCard 의
// setup-state ↔ main-metrics 분기와 동일. store 를 @ObservedObject 로 관찰하므로
// 설정 시트에서 저장(setupCompletedAt 스탬프) 직후 자동으로 HeroCard 로 전환된다.
//
private struct CashflowSection: View {
    @ObservedObject var store: CashflowStore
    /// 매출 평균 산출용 — DashboardStore.entries → "yyyy-MM-dd"+sales.
    let recentDailyEntries: [CashflowDailyEntry]
    /// 고정비 미설정 시 일할 출금 fallback (월 비용 합).
    let fallbackMonthlyCostsTotal: Double
    /// 부가세 적립률 — tax_settings.vatType 으로 결정(간이 0.03 / 일반 0.10). 읽기 전 기본 0.10.
    @State private var vatRate: Double = 0.10
    @State private var showSetup = false
    @State private var showDetail = false

    /// 실제 14일 예측 — 웹 SSOT 와 1:1 (회귀 기준값 보존).
    private var projections: [CashflowDayProjection] {
        CashflowProjection.project(
            currentBalance: store.settings.currentBalance,
            recentDailyEntries: recentDailyEntries,
            salesChannels: store.settings.salesChannels,
            fixedExpenses: store.settings.fixedExpenses,
            vatReserveEnabled: store.settings.vatReserveEnabled,
            vatRate: vatRate,
            fallbackMonthlyCostsTotal: fallbackMonthlyCostsTotal
        )
    }

    var body: some View {
        Group {
            if store.settings.isConfigured {
                let proj = projections
                let crisis = CashflowProjection.detectCrisis(proj, thresholdDays: store.settings.crisisThresholdDays)
                CashflowRadarCard(
                    projections: proj,
                    crisis: crisis,
                    currentBalanceUpdatedAt: store.settings.currentBalanceUpdatedAt,
                    onDetail: { showDetail = true },
                    onEditSettings: { showSetup = true }
                )
            } else {
                CashflowSetupPrompt { showSetup = true }
            }
        }
        .sheet(isPresented: $showSetup) {
            CashflowSetupSheet(store: store)
        }
        .sheet(isPresented: $showDetail) {
            CashflowDetailSheet(projections: projections, settings: store.settings)
        }
        .task {
            // tax_settings.vatType → vatRate (간이 0.03 / 일반 0.10). 비로그인·실패 시 0.10 유지.
            if let t = await StoreProfileRepository.vatTypeForCurrentUser() {
                vatRate = (t == "simplified") ? 0.03 : 0.10
            }
        }
    }
}

// MARK: - 현금흐름 설정 프롬프트 (미설정 상태 — 웹 CashflowHeroCard setup-state 미러)

private struct CashflowSetupPrompt: View {
    let onStart: () -> Void

    private let bullets: [(String, String)] = [
        ("calendar.badge.clock", "채널별 정산주기·수수료로 14일 통장 잔고를 예측"),
        ("exclamationmark.triangle", "잔고가 마이너스로 갈 위험을 미리 경고"),
        ("creditcard", "월세·급여 등 고정비 빠지는 날까지 반영"),
    ]

    var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 11, style: .continuous)
                            .fill(LinearGradient(colors: [BUColor.midnight, BUColor.midnightDeep], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 36, height: 36)
                        Image(systemName: "wonsign.circle.fill")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("현금 흐름")
                            .buSectionEyebrowStyle()
                        Text("통장이 비기 전에 미리 대비하세요")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 0)
                }

                VStack(alignment: .leading, spacing: 9) {
                    ForEach(bullets, id: \.0) { icon, text in
                        HStack(alignment: .top, spacing: 9) {
                            Image(systemName: icon)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 18)
                            Text(text)
                                .font(.system(size: 12.5, weight: .medium))
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }

                Button(action: onStart) {
                    HStack(spacing: 6) {
                        Text("2분 빠른 설정")
                            .font(.system(size: 14, weight: .bold))
                        Image(systemName: "arrow.right")
                            .font(.system(size: 12, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(colors: [BUColor.midnight, BUColor.midnightDeep], startPoint: .leading, endPoint: .trailing),
                        in: RoundedRectangle(cornerRadius: BURadius.button, style: .continuous)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Chip helpers (Row 1)

private struct ChipFilled: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(.white)
            .tracking(0.6)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(BUColor.midnight, in: Capsule())
    }
}

private struct ChipSoft: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(BUColor.midnight)
            .tracking(0.5)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(BUColor.midnight08, in: Capsule())
    }
}

private struct ChipTrend: View {
    let pct: Double

    var body: some View {
        let positive = pct >= 0
        HStack(spacing: 2) {
            Image(systemName: positive ? "arrow.up.right" : "arrow.down.right")
                .font(.system(size: 9, weight: .heavy))
            Text("\(positive ? "+" : "")\(String(format: "%.0f", pct))%")
                .font(.system(size: 10, weight: .bold))
                .monospacedDigit()
        }
        .foregroundStyle(positive ? BUColor.success : BUColor.danger)
        .tracking(0.4)
        .padding(.horizontal, 8)
        .padding(.vertical, 2)
        .background(
            (positive ? BUColor.success : BUColor.danger).opacity(0.10),
            in: Capsule()
        )
        .fixedSize()
    }
}

// MARK: - More Insights — 운영 대시보드 안의 깊이 (popup sheet)
//
// 사장님 UX 원칙 (2026-05-19):
//   • 모바일 홈은 가장 중요한 카드만 유지
//   • 웹에서는 운영 대시보드 안에 보이는 콘텐츠 (주간 점검·성장·재무) →
//     모바일에서도 popup sheet 로 보여줘서 멘탈 모델 일치
//   • 별도 탭 이동 시 사장님이 다른 surface 로 떠난 느낌 → 혼동 발생
//
/// 홈에서 강등된 고객 지표 — "오늘 상세" 팝업에 전달 (실데이터).
/// 「더보기」 세그먼트 본문 (2026-08-19 IA — 종전 가로 스트립 → 세로 인라인).
///   오늘 상세(KPI 스트립·코칭 일지·운영 의식)는 카드 그대로 인라인(데이터 먼저),
///   주간 점검·성장 도구는 전용 풀뷰라 행 → 시트. 사용자수 카드는 「운영」에만 (중복 제거).
///   '내 가게'·'로드맵' 진입점은 하단 탭과 중복 → 제거.
private struct MoreInsightsStrip: View {

    let mock: MockData
    let dailyKpiCells: [KpiCellData]
    let storeInfo: StoreInfoStore?
    var coaching: CoachingHistoryStore? = nil
    var saas: SaasMetricsStore? = nil
    var subscription: SubscriptionStore? = nil

    enum SheetID: String, Identifiable {
        case weeklyPulse, growth
        var id: String { rawValue }

        var title: String {
            switch self {
            case .weeklyPulse: return "주간 점검"
            case .growth:      return "성장 도구"
            }
        }
    }

    @State private var openSheet: SheetID?

    private struct Insight: Identifiable {
        let id: SheetID
        let icon: String
        let label: String
        let subtitle: String
    }

    private let insights: [Insight] = [
        .init(id: .weeklyPulse, icon: "doc.richtext",   label: "주간 점검",  subtitle: "WoW · BEP · 벤치마크"),
        .init(id: .growth,      icon: "megaphone.fill", label: "성장 도구",  subtitle: "고객 · 마케팅 · 정책자금"),
    ]

    var body: some View {
        // ── 오늘 상세 — 인라인 ──
        DailyKpiStrip(cells: dailyKpiCells)

        // 코칭 14일 누적 일지 (웹과 동일 Supabase) — 매일 히어로 신호 + 사장님 대응 시간선
        if let coaching {
            CoachingHistoryCard(store: coaching)
        }

        DailyOpsRitualCard(category: mock.category)

        // ── 주간 점검 · 성장 도구 — 행 → 시트 ──
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Text("더 알아보기")
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.66)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.midnight)
                Text("· 탭하면 자세히 보기")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 4)

            ForEach(insights) { item in
                Button { openSheet = item.id } label: {
                    HStack(spacing: 10) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 11, style: .continuous)
                                .fill(BUColor.midnight.opacity(0.08))
                                .frame(width: 36, height: 36)
                            Image(systemName: item.icon)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(BUColor.midnight)
                        }
                        VStack(alignment: .leading, spacing: 1) {
                            Text(item.label)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(BUColor.ink)
                            Text(item.subtitle)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                                .lineLimit(1)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(BUColor.inkSubtle)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        Color.white.opacity(0.72),
                        in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(Color.black.opacity(0.05), lineWidth: 1)
                    )
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .sheet(item: $openSheet) { id in
            InsightSheet(title: id.title) {
                sheetContent(for: id)
            }
        }
    }

    @ViewBuilder
    private func sheetContent(for id: SheetID) -> some View {
        switch id {
        case .weeklyPulse:
            WeeklyPulseView(mock: mock, saas: saas, subscription: subscription)
        case .growth:
            GrowthForecastView(
                mock: mock,
                // 실데이터 직원 수 — 두루누리 자격(10인 미만)·게이팅에 사용 (storeInfo 미로드 시 0)
                currentEmployeeCount: (storeInfo?.isLoaded == true) ? (storeInfo?.state.employees.count ?? 0) : 0
            )
        }
    }
}


// MARK: - InsightSheet — popup wrapper (close button + drag indicator)

private struct InsightSheet<Content: View>: View {
    let title: String
    let content: Content
    @Environment(\.dismiss) private var dismiss

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle(title)
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                #endif
                .toolbar {
                    #if os(iOS)
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("닫기") { dismiss() }
                            .foregroundStyle(BUColor.midnight)
                    }
                    #else
                    ToolbarItem(placement: .cancellationAction) {
                        Button("닫기") { dismiss() }
                    }
                    #endif
                }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Today — 안정 운영") {
    TodayView(mock: .healthyRestaurant)
}

#Preview("Today — 긴급 위기") {
    TodayView(mock: .criticalSaaS)
}

#Preview("Today — 주의 신호") {
    TodayView(mock: .warningCafe)
}

#Preview("Today — 첫 진입") {
    TodayView(mock: .empty)
}
#endif
