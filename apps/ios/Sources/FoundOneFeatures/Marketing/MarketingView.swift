//
//  MarketingView.swift — 마케팅 운영 허브 (웹 MarketingSurface 1:1 미러)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/MarketingSurface.tsx
//   섹션 순서 (모두 인라인, 시트 없음):
//    1. Header + KPI 3 (이달 지출 / ROAS / 활성 채널)
//    2. 성장 예측 진입 카드 (탭 → GrowthForecastView sheet)
//    3. 마케팅 작업하기 = 사례 엔진 (MarketingCasesCard) — 히어로 1 + 채널 진행도 + 더 보기.
//       2026-06-10: 기존 코칭·트렌드 2개 섹션은 이 단일 엔진으로 통합·삭제됨.
//    3.5. 이번 주 밈·챌린지 (MarketingMemeLane) — 2026-07-24 신설, 전역 주간 팩 미러.
//    4. 채널별 지출 추적 (추천 chip + list + collapsible add form)
//    5. 보조: LoyaltyDonut + CampaignIdeas (iOS 고유 유지)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData
import FoundOneCore

@MainActor
@Observable
fileprivate final class MarketingPageState {
    var loadingKpi: Bool = false
    var campaigns: [CampaignRecord] = []
    var monthlyBudget: Int = 0
    var kpis: MarketingKpis = MarketingKpis(month: "", spendWon: 0, attributedRevenueWon: 0, blendedRoas: 0, activeChannels: 0)


    // 마케팅 작업하기 = 성공사례·트렌드 → 내 사업 적용
    var casesLoading: Bool = false
    var casesError: String? = nil
    var plays: [MarketingPlay] = []
    var casesSources: [CasesSourceItem] = []
    var casesWeekKey: String? = nil
    var doneTitles: Set<String> = []

    // 이번 주 밈·챌린지 팩 (전역 팩: 주간 수집 + 일간 top-up — 웹 MemeLane 패리티)
    var memePack: MemePackResponse? = nil

    // 이달(KST) 매출 합 — 적정 마케팅 예산 판정용 (웹 mtdRevenueWon 패리티)
    var mtdRevenueWon: Int = 0

    var profile: FundingProfileSnapshot? = nil
}

public struct MarketingView: View {

    let store: DashboardStore
    let mock: MockData

    @State private var state = MarketingPageState()
    @State private var showGrowthForecast: Bool = false
    // 세그먼트 탭 (2026-08-03 개편, 웹 패리티 — 한 화면에 다 쌓지 않는다)
    //  장부·예산은 전용 탭 (사장님 지시 — 종전 하단 접힘 카드에서 승격)
    @State private var tab: MarketingTab = .weekly

    enum MarketingTab: String, CaseIterable {
        case weekly, create, ledger
        var label: String {
            switch self {
            case .weekly: return "이번 주"
            case .create: return "만들기"
            case .ledger: return "장부·예산"
            }
        }
    }

    public init(store: DashboardStore, mock: MockData) {
        self.store = store
        self.mock = mock
    }

    // 이번 달 활성 채널 — 웹 MarketingSurface.tsx:104,108 패리티.
    //   monthCampaigns = campaigns.filter(c.month === curMonth(KST)) → 채널 Set.
    //   computeKpis 와 동일한 KST currentMonthKey 기준.
    private var activeChannelsThisMonth: [String] {
        let month = MarketingRepository.currentMonthKey()
        return Array(Set(state.campaigns.filter { $0.month == month }.map(\.channel)))
    }

    // 재생성 게이팅 — 웹 MarketingSurface.tsx:267 패리티.
    //   "이미 콘텐츠가 정상 표시 중이면 force 재생성 X (LLM/web_search 비용·6회/시 한도 보호).
    //    진짜 문제(에러 또는 빈 결과)일 때만 force 허용." canRegenerate = error != nil || plays.isEmpty.
    private var canRegenerateCases: Bool {
        state.casesError != nil || state.plays.isEmpty
    }

    // 신규 개업(12개월 이내) — 웹 isNewBiz 패리티
    private var isNewBiz: Bool {
        guard let raw = state.profile?.businessLaunchedDate else { return false }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        guard let d = f.date(from: String(raw.prefix(10))) else { return false }
        return Date().timeIntervalSince(d) < 365 * 86_400
    }

    // 적정 마케팅 예산 판정 — 웹 spendCheck 패리티 (SSOT 미러 MarketingBudgetBenchmarks)
    private var spendCheck: MarketingBudgetBenchmarks.Assessment? {
        MarketingBudgetBenchmarks.assess(
            spendWon: state.kpis.spendWon,
            revenueWon: state.mtdRevenueWon,
            categoryId: state.profile?.industryCategoryId,
            isNewBiz: isNewBiz
        )
    }

    public var body: some View {
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 풀스크린 Aurora 사용.
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    header
                    segmentedTabs

                    if tab == .weekly {
                        growthNavCard

                        // 2026-06-10: 코칭·트렌드·작업하기 3개 AI 섹션 → 단일 엔진(MarketingCasesCard)으로 통합.
                        //   웹 MarketingFocus 와 패리티. 히어로 1순위 + 채널 진행도 + 더 보기.
                        MarketingCasesCard(
                            loading: state.casesLoading,
                            error: state.casesError,
                            plays: state.plays,
                            sources: state.casesSources,
                            activeChannels: activeChannelsThisMonth,
                            categoryId: state.profile?.industryCategoryId,
                            doneTitles: state.doneTitles,
                            canRefresh: canRegenerateCases,
                            onToggleDone: { title in togglePlayDone(title) },
                            onRefresh: { Task { await loadCases(force: true) } }
                        )

                        // 이번 주 밈·챌린지 — 웹 MemeLane 미러 (전역 팩: 주간 수집 + 일간 top-up · 원본만·개사 없음)
                        MarketingMemeLane(pack: state.memePack)

                        // 리뷰 관리 — 추후 제공 예정 (2026-08-03 사장님 결정, 웹 패리티)
                        reviewComingSoonCard
                    }

                    if tab == .create {
                        // 카드뉴스 스튜디오 — 웹 CardNewsStudio 미러 (지금 무료·9월부터 프로 전용)
                        CardNewsStudioCard(
                            storeName: state.profile?.storeName ?? store.storeName,
                            industryCategoryId: state.profile?.industryCategoryId,
                            subIndustryId: state.profile?.subIndustryId,
                            isOperating: state.profile?.businessLaunched ?? true
                        )
                    }

                    // 장부·예산 전용 탭 (2026-08-03 승격 — 종전 하단 접힘 카드 폐기, 웹 패리티)
                    if tab == .ledger {
                        ledgerSummaryCard
                        if let check = spendCheck { budgetNoteCard(check) }
                        kpiSection
                        MarketingCampaignsList(
                            campaigns: state.campaigns,
                            industryCategoryId: state.profile?.industryCategoryId,
                            onAdd: { campaign in Task { await addCampaign(campaign) } },
                            onDelete: { id in Task { await deleteCampaign(id) } }
                        )
                    }

                    // iOS 고유 보조 블록
                    LoyaltyDonutBlock()
                    CampaignIdeasBlock()

                    Color.clear.frame(height: 110)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
                .padding(.top, BUSpacing.md)
            }
            .refreshable { await refreshAll() }
        }
        .navigationTitle("마케팅")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .task { await initialLoad() }
        .sheet(isPresented: $showGrowthForecast) {
            NavigationStack {
                GrowthForecastView(mock: mock)
                    .navigationTitle("성장 예측")
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("닫기") { showGrowthForecast = false }
                        }
                    }
            }
        }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("마케팅 · MARKETING")
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.54)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                .textCase(.uppercase)
            Text("내 가게 마케팅")
                .font(.system(size: 28, weight: .bold))
                .tracking(-1.12)
                .foregroundStyle(BUColor.ink)
            // 웹 MarketingSurface.tsx 헤더 카피와 통일 (2026-07-24 개편).
            Text("이번 주에 딱 하나. 읽을 건 줄이고, 바로 쓸 것만 드려요.")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.78))
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 2)
        }
    }

    // 세그먼트 탭 — 웹 pill 세그먼트 패리티 (탭당 핵심 기능만)
    private var segmentedTabs: some View {
        HStack(spacing: 4) {
            ForEach(MarketingTab.allCases, id: \.self) { t in
                Button {
                    withAnimation(.easeInOut(duration: 0.15)) { tab = t }
                } label: {
                    HStack(spacing: 6) {
                        Text(t.label)
                            .font(.system(size: 13.5, weight: .bold))
                            .foregroundStyle(tab == t ? BUColor.ink : BUColor.inkMuted)
                        // 저지출 경고 점 — 장부 탭에 안 들어와도 경고가 보이게 (웹 패리티)
                        if t == .ledger, let check = spendCheck, check.band == .below {
                            Circle().fill(BUColor.danger).frame(width: 6, height: 6)
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 11, style: .continuous)
                            .fill(tab == t ? Color.white : Color.clear)
                    )
                    .buShadow(tab == t ? .card : .none)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(BUColor.ink.opacity(0.045), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    // 리뷰 관리 — 추후 제공 예정 (어중간한 반자동 대신 정식 연동 때 한 번에, 웹 패리티)
    private var reviewComingSoonCard: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("리뷰 관리 — 추후 제공 예정")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                Text("리뷰 자동 수집·분석·답글 초안을 준비 중이에요. 지금은 공식 채널에서 확인해 주세요.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
            if let url = URL(string: "https://smartplace.naver.com") {
                Link("스마트플레이스 →", destination: url)
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(BUColor.accent)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    // 적정 예산 카드 — 판정 가능(월매출 존재)할 때만. 출처·국가를 숨기지 않는다 (웹 패리티)
    private func budgetNoteCard(_ check: MarketingBudgetBenchmarks.Assessment) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Group {
                Text("이달 마케팅 지출 = 매출의 \(check.pct, specifier: "%.1f")%")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(check.band == .below ? BUColor.danger : BUColor.success)
                + Text(" — \(check.isNewBiz ? "신규 개업 " : "")통용 기준은 \(Int(check.lowPct))~\(Int(check.highPct))%예요.\(check.band == .below ? " 지금은 기준보다 낮아 노출이 부족할 수 있어요." : "")")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(BUColor.ink)
            }
            .fixedSize(horizontal: false, vertical: true)
            if let url = URL(string: check.benchmark.sourceUrl) {
                HStack(spacing: 4) {
                    Text("한국 공식 통계는 없어")
                    Link(check.benchmark.sourceLabelKo, destination: url)
                        .foregroundStyle(BUColor.accent)
                    Text("을 기준으로 보여드려요.")
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .strokeBorder(check.band == .below ? BUColor.danger.opacity(0.25) : BUColor.cardBorder, lineWidth: 1)
        )
    }

    // 장부 요약 카드 — "이달 0원 · ROAS — · 채널 N개" 한 줄 (장부·예산 탭 상단, 웹 패리티)
    private var ledgerSummaryCard: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("마케팅 장부")
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                .textCase(.uppercase)
            Text("이달 \(state.kpis.spendWon > 0 ? formatWon(state.kpis.spendWon) + "원" : "0원") · ROAS \(state.kpis.spendWon > 0 ? String(format: "%.1fx", state.kpis.blendedRoas) : "—") · 채널 \(state.kpis.activeChannels)개")
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)
            // 저지출 경고 — 웹 요약줄 배지 패리티 (SSOT: MarketingBudgetBenchmarks)
            if let check = spendCheck, check.band == .below {
                Text("매출의 \(check.pct, specifier: "%.1f")% — 기준(\(Int(check.lowPct))~\(Int(check.highPct))%)보다 낮음")
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(BUColor.danger)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(BUColor.danger.opacity(0.08), in: RoundedRectangle(cornerRadius: 7, style: .continuous))
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    private var kpiSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                KpiTile(
                    eyebrow: "이달 지출",
                    value: state.kpis.spendWon > 0 ? formatWon(state.kpis.spendWon) : "—",
                    sub: state.kpis.spendWon > 0 ? "원" : "캠페인 추가",
                    tint: BUColor.accent
                )
                // ROAS — 웹 MarketingSurface.tsx:362 패리티. 신호등 색 제거:
                //   ROAS ≥ 1 → 네이비(success #1d3557), < 1 → 벽돌(danger #b64c4c) 2색 분기만.
                KpiTile(
                    eyebrow: "블렌디드 ROAS",
                    value: state.kpis.spendWon > 0
                        ? String(format: "%.1fx", state.kpis.blendedRoas)
                        : "—",
                    sub: state.kpis.spendWon == 0 ? "기여 매출 입력" : "",
                    tint: state.kpis.blendedRoas >= 1 ? BUColor.success : BUColor.danger
                )
                // 활성 채널 — 웹은 중립 텍스트 색(var(--text)). 신호등 강조 없음.
                KpiTile(
                    eyebrow: "활성 채널",
                    value: "\(state.kpis.activeChannels)개",
                    sub: state.kpis.activeChannels == 0 ? "아직 없음" : "",
                    tint: BUColor.inkMuted
                )
            }
            .padding(.horizontal, 2)
        }
    }

    private var growthNavCard: some View {
        Button {
            showGrowthForecast = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(BUColor.accent)
                VStack(alignment: .leading, spacing: 2) {
                    Text("성장 예측 & What-If")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("7일 매출 예측 · 마일스톤 · 시나리오 시뮬레이션")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.6))
            }
            .padding(.horizontal, 14).padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(minHeight: BUSpacing.minTapTarget)
            .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Load

    private func initialLoad() async {
        async let kpi: () = loadKpisAndCampaigns()
        async let prof: FundingProfileSnapshot? = loadProfileQuiet()
        _ = await (kpi, prof)
        if state.profile == nil {
            state.profile = await loadProfileQuiet()
        }
        // 2026-06-10: 코칭·트렌드는 단일 엔진(loadCases)으로 통합 — 불필요 LLM 호출 차단.
        async let cases: () = loadCases()
        async let memes: () = loadMemePack()
        async let revenue: () = loadMtdRevenue()
        _ = await (cases, memes, revenue)
    }

    /// 이달(KST) 매출 합 — 예산 판정 분모 (웹 mtdRevenueWon = dailyEntries 이달 합 패리티)
    private func loadMtdRevenue() async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let repo = DailyEntryRepository(supabase: BUSupabase.shared.client, getUserId: { uid })
        let month = MarketingRepository.currentMonthKey()
        let entries = (try? await repo.list(limit: 40, ascending: false)) ?? []
        state.mtdRevenueWon = Int(entries.filter { $0.date.hasPrefix(month) }.reduce(0.0) { $0 + $1.sales })
    }

    /// 주간 밈 팩 — 전역 팩 DB 읽기(저비용, LLM 호출 아님). 실패 시 레인 숨김.
    private func loadMemePack() async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        if state.profile == nil { state.profile = await loadProfileQuiet() }
        let repo = MarketingRepository(supabase: BUSupabase.shared.client, userId: uid)
        state.memePack = await repo.fetchMemePack(categoryId: state.profile?.industryCategoryId)
    }

    private func loadProfileQuiet() async -> FundingProfileSnapshot? {
        guard let uid = BUSupabase.shared.currentUser?.id else { return nil }
        let repo = FundingProfileRepository(supabase: BUSupabase.shared.client, userId: uid)
        let snap = try? await repo.loadSnapshot()
        if let snap { state.profile = snap }
        return snap
    }

    private func loadKpisAndCampaigns() async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        state.loadingKpi = true
        defer { state.loadingKpi = false }
        let repo = MarketingRepository(supabase: BUSupabase.shared.client, userId: uid)
        do {
            let (campaigns, budget) = try await repo.listCampaigns()
            state.campaigns = campaigns
            state.monthlyBudget = budget
            state.kpis = MarketingRepository.computeKpis(from: campaigns)
        } catch {}
    }

    private func refreshAll() async {
        // 웹 패리티(MarketingSurface.tsx:267): 정상 표시 중인 사례는 풀-투-리프레시로 force 재생성하지 않음.
        //   LLM/web_search 비용·6회/시 한도 보호. 에러/빈 결과일 때만 force 허용, 그 외엔 캐시 사용.
        let allowForce = canRegenerateCases
        async let kpi: () = loadKpisAndCampaigns()
        async let cases: () = loadCases(force: allowForce)
        async let memes: () = loadMemePack()
        async let revenue: () = loadMtdRevenue()
        _ = await (kpi, cases, memes, revenue)
    }

    private func loadCases(force: Bool = false) async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        state.casesLoading = true
        state.casesError = nil
        defer { state.casesLoading = false }

        if state.profile == nil { state.profile = await loadProfileQuiet() }
        var ctx = MarketingCoachContext()
        ctx.storeName = state.profile?.storeName ?? store.storeName
        ctx.industryCategoryId = state.profile?.industryCategoryId
        ctx.subIndustryId = state.profile?.subIndustryId
        ctx.monthlyRevenueWon = state.profile?.monthlyAvgRevenue
        ctx.monthlySpendWon = state.kpis.spendWon
        ctx.blendedRoas = state.kpis.blendedRoas
        ctx.activeChannels = Array(Set(state.campaigns.map(\.channel)))
        ctx.currentStageLabel = (state.profile?.businessLaunched ?? true) ? "운영 중" : "오픈 준비"
        ctx.launchDate = state.profile?.businessLaunchedDate
        ctx.hasUserSales = state.profile?.hasUserSales
        ctx.salesTrendPct = state.profile?.weeklySalesChangePct
        ctx.force = force

        let repo = MarketingRepository(supabase: BUSupabase.shared.client, userId: uid)
        do {
            let resp = try await repo.fetchCases(context: ctx)
            state.plays = resp.plays
            state.casesSources = resp.sources ?? []
            state.casesWeekKey = resp.weekKey
            if resp.plays.isEmpty {
                state.casesError = "사례를 받아오지 못했어요. 잠시 후 다시 시도해주세요."
            } else if let wk = resp.weekKey {
                // 이번 주 "했어요" 체크 상태 로드 (피드백 루프)
                state.doneTitles = Set(await repo.playProgress(weekKey: wk))
            }
        } catch {
            state.casesError = (error as? (any LocalizedError))?.errorDescription ?? error.localizedDescription
        }
    }

    private func togglePlayDone(_ title: String) {
        guard let uid = BUSupabase.shared.currentUser?.id, let wk = state.casesWeekKey else { return }
        let willDo = !state.doneTitles.contains(title)
        if willDo { state.doneTitles.insert(title) } else { state.doneTitles.remove(title) }  // optimistic
        Task {
            let repo = MarketingRepository(supabase: BUSupabase.shared.client, userId: uid)
            await repo.setPlayDone(weekKey: wk, title: title, done: willDo)
        }
    }

    private func addCampaign(_ campaign: CampaignRecord) async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let repo = MarketingRepository(supabase: BUSupabase.shared.client, userId: uid)
        do {
            let updated = try await repo.addCampaign(campaign)
            state.campaigns = updated
            state.kpis = MarketingRepository.computeKpis(from: updated)
        } catch {}
    }

    private func deleteCampaign(_ id: String) async {
        guard let uid = BUSupabase.shared.currentUser?.id else { return }
        let repo = MarketingRepository(supabase: BUSupabase.shared.client, userId: uid)
        do {
            let updated = try await repo.deleteCampaign(id: id)
            state.campaigns = updated
            state.kpis = MarketingRepository.computeKpis(from: updated)
        } catch {}
    }
}

// MARK: - KPI tile

private struct KpiTile: View {
    let eyebrow: String
    let value: String
    let sub: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(eyebrow)
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                .textCase(.uppercase)
                .lineLimit(1)
            Text(value)
                .font(.system(size: 22, weight: .heavy))
                .tracking(-0.4)
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(sub)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(tint.opacity(0.9))
                .lineLimit(1)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .frame(width: 145, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .fill(Color.white.opacity(0.96))
        )
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
        .buShadow(.card)
    }
}

// MARK: - 원 포맷

func formatWon(_ won: Int) -> String {
    if won >= 100_000_000 {
        let eok = Double(won) / 100_000_000
        return String(format: "%.1f억", eok)
    }
    if won >= 10_000 {
        let man = Int(Double(won) / 10_000.0)
        return "\(man.formatted())만"
    }
    return "\(won.formatted())"
}
