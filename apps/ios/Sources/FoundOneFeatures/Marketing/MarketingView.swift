//
//  MarketingView.swift — 마케팅 운영 허브 (웹 MarketingSurface 1:1 미러)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/MarketingSurface.tsx
//   섹션 순서 (모두 인라인, 시트 없음):
//    1. Header + KPI 3 (이달 지출 / ROAS / 활성 채널)
//    2. 성장 예측 진입 카드 (탭 → GrowthForecastView sheet)
//    3. AI 코칭 (3 액션 full inline)
//    4. AI 트렌드 (출처 메타 + 5 트렌드 + 참조 출처 리스트)
//    5. 마케팅 작업하기 (focused 트렌드의 playbook + case + tools)
//    6. 채널별 지출 추적 (추천 chip + list + collapsible add form)
//    7. 보조: LoyaltyDonut + CampaignIdeas (iOS 고유 유지)
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

    var profile: FundingProfileSnapshot? = nil
}

public struct MarketingView: View {

    let store: DashboardStore
    let mock: MockData

    @State private var state = MarketingPageState()
    @State private var showGrowthForecast: Bool = false

    public init(store: DashboardStore, mock: MockData) {
        self.store = store
        self.mock = mock
    }

    public var body: some View {
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 풀스크린 Aurora 사용.
        ZStack {
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    header
                    kpiSection
                    growthNavCard

                    // 2026-06-10: 코칭·트렌드·작업하기 3개 AI 섹션 → 단일 엔진(MarketingCasesCard)으로 통합.
                    //   웹 MarketingFocus 와 패리티. 히어로 1순위 + 채널 진행도 + 더 보기.
                    MarketingCasesCard(
                        loading: state.casesLoading,
                        error: state.casesError,
                        plays: state.plays,
                        sources: state.casesSources,
                        activeChannels: Array(Set(state.campaigns.map(\.channel))),
                        categoryId: state.profile?.industryCategoryId,
                        doneTitles: state.doneTitles,
                        onToggleDone: { title in togglePlayDone(title) },
                        onRefresh: { Task { await loadCases(force: true) } }
                    )

                    MarketingCampaignsList(
                        campaigns: state.campaigns,
                        industryCategoryId: state.profile?.industryCategoryId,
                        onAdd: { campaign in Task { await addCampaign(campaign) } },
                        onDelete: { id in Task { await deleteCampaign(id) } }
                    )

                    // iOS 고유 보조 블록
                    LoyaltyDonutBlock()
                    CampaignIdeasBlock()

                    footnote
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
            Text("이번 주, 매출 만들기")
                .font(.system(size: 28, weight: .bold))
                .tracking(-1.12)
                .foregroundStyle(BUColor.ink)
            Text("AI 코칭 + 트렌드 + 캠페인 ROI")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.78))
                .padding(.top, 2)
        }
    }

    private var kpiSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                KpiTile(
                    eyebrow: "이달 지출",
                    value: state.kpis.spendWon > 0 ? formatWon(state.kpis.spendWon) : "—",
                    sub: state.kpis.spendWon > 0 ? "원" : "캠페인 추가",
                    tint: Color(red: 0, green: 0.478, blue: 1.0)
                )
                KpiTile(
                    eyebrow: "블렌디드 ROAS",
                    value: state.kpis.spendWon > 0
                        ? String(format: "%.1fx", state.kpis.blendedRoas)
                        : "—",
                    sub: state.kpis.spendWon == 0
                        ? "기여 매출 입력"
                        : (state.kpis.blendedRoas >= 2 ? "건강" : state.kpis.blendedRoas >= 1 ? "보통" : "미달"),
                    tint: state.kpis.blendedRoas >= 2 ? BUColor.success
                          : state.kpis.blendedRoas >= 1 ? BUColor.warn
                          : BUColor.danger
                )
                KpiTile(
                    eyebrow: "활성 채널",
                    value: "\(state.kpis.activeChannels)개",
                    sub: state.kpis.activeChannels >= 3 ? "다채널" : state.kpis.activeChannels == 0 ? "없음" : "확장 가능",
                    tint: state.kpis.activeChannels >= 3 ? BUColor.success : BUColor.inkMuted
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
                    .foregroundStyle(Color(red: 0, green: 0.478, blue: 1.0))
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

    private var footnote: some View {
        Text("코칭은 주 1회, 트렌드는 일 1회 캐시됩니다. 재생성으로 즉시 갱신 가능.")
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            .lineSpacing(2)
            .padding(.top, 4)
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
        await loadCases()
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
        async let kpi: () = loadKpisAndCampaigns()
        async let cases: () = loadCases(force: true)
        _ = await (kpi, cases)
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
