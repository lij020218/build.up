//
//  GuidesView.swift — 펀딩 (정책자금 · 창업지원, iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/GuidesView.tsx
//   매칭 로직은 packages/shared/src/startup-programs.ts (79개 프로그램, 결정론적)
//   → iOS 는 /api/funding/match 경유 (FundingRepository), 매칭 결과 + 점수 + 매칭 이유 + D-day
//   → AI 점수 평가는 /api/ai/funding/score (FundingScoreSheet)
//
//  레이아웃 (1-컬럼, 모바일 최적):
//   1. Header — eyebrow + title + subtitle
//   2. KPI 요약 — 전체/자격/모집중/예정 (API stats)
//   3. 추천 매칭 토글 — ON → personalFit 상위 6개만
//   4. 카테고리 필터 (정부/민간/지역/대기업/콘테스트)
//   5. 상태 필터 (모집중/예정)
//   6. 프로그램 카드 리스트
//   7. 빈 상태 / 푸터
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData
import FoundOneCore

// MARK: - Filter models

private enum CategoryFilter: String, CaseIterable, Identifiable {
    case all, government, `private`, local, corporate, competition

    var id: String { rawValue }

    var label: String {
        switch self {
        case .all:         return "전체"
        case .government:  return "정부"
        case .private:     return "민간·재단"
        case .local:       return "지역"
        case .corporate:   return "대기업"
        case .competition: return "콘테스트"
        }
    }

    // ⚠️ 신호등/무지개 금지 — 웹 GuidesView 와 동일하게 미드나잇 단색. 카테고리 구분은 라벨로.
    var color: Color {
        BUColor.midnight
    }

    static func from(_ apiValue: String) -> CategoryFilter {
        CategoryFilter(rawValue: apiValue) ?? .all
    }
}

private enum StatusFilter: String, CaseIterable, Identifiable {
    case all, open, upcoming

    var id: String { rawValue }

    var label: String {
        switch self {
        case .all:      return "모두"
        case .open:     return "모집중"
        case .upcoming: return "예정"
        }
    }
}

// MARK: - Page state

@MainActor
@Observable
fileprivate final class FundingPageState {
    var loading: Bool = false
    var error: String? = nil
    var programs: [FundingProgram] = []
    var stats: FundingMatchStats? = nil
    var recommendMode: Bool = false

    var categoryFilter: CategoryFilter = .all
    var statusFilter: StatusFilter = .all

    var profileSnapshot: FundingProfileSnapshot? = nil

    var filtered: [FundingProgram] {
        var list = programs
        // 2026-06-30 사장님 신고: 미용실인데 AI스타트업·모빌리티/로보틱스·딥테크가 뜸.
        //   추천 모드는 이미 recommend(eligible 필터)지만, 기본 브라우즈는 match(전체)라 업종·대상
        //   불일치(eligible=false)가 흐리게라도 노출되던 누수 → 기본 브라우즈에서 제외(웹 패리티).
        if !recommendMode {
            list = list.filter { $0.eligible }
        }
        if categoryFilter != .all {
            list = list.filter { CategoryFilter.from($0.category) == categoryFilter }
        }
        if statusFilter != .all {
            list = list.filter { $0.applicationStatus == statusFilter.rawValue }
        }
        // 파운드원 자체 운영 지원사업(앱 내부 신청)은 노출될 때 항상 맨 위 고정.
        if let idx = list.firstIndex(where: { $0.internalApply }), idx > 0 {
            list.insert(list.remove(at: idx), at: 0)
        }
        return list
    }
}

// MARK: - GuidesView

public struct GuidesView: View {

    let store: DashboardStore

    @State private var state = FundingPageState()
    @State private var scoreTarget: FundingProgram? = nil
    @State private var applyTarget: FundingProgram? = nil
    /// 공고 맞춤 사업계획서 시트 (2026-08-14, 주 2회 — 웹 FundingPlanModal 미러)
    @State private var planTarget: FundingProgram? = nil
    /// 내 사업계획서 목록 시트 (서버 저장 원장 — 웹 FundingPlansListModal 미러)
    @State private var plansListOpen: Bool = false
    @Environment(\.openURL) private var openURL

    public init(store: DashboardStore) {
        self.store = store
    }

    public var body: some View {
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 풀스크린 Aurora 사용.
        ZStack {
            ScrollView {
                VStack(spacing: 0) {
                    // 공통 페이지 헤더 (2026-08-19 통일) — "정책자금" + 매칭 모드 한 줄
                    BUPageHeader(title: "정책자금", subtitle: headerSubtitle)
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        if state.loading {
                            loadingState
                        } else if let err = state.error {
                            errorState(err)
                        } else {
                            kpiSummary
                            recommendToggle
                            myPlansButton
                            OwnerProfileChips(onChange: { Task { await loadPrograms() } }, showNudge: true)
                            categoryChips
                            statusChips
                            programList
                        }

                        footnote
                        Color.clear.frame(height: 110)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                }
            }
            .refreshable {
                await loadPrograms()
            }
        }
        .task {
            await loadPrograms()
        }
        .sheet(item: $scoreTarget) { program in
            if let snapshot = state.profileSnapshot {
                FundingScoreSheet(program: program, profile: snapshot)
            }
        }
        .sheet(item: $applyTarget) { program in
            if let snapshot = state.profileSnapshot {
                GrantApplySheet(program: program, snapshot: snapshot)
            }
        }
        .sheet(item: $planTarget) { program in
            if let snapshot = state.profileSnapshot {
                FundingPlanSheet(program: program, profile: snapshot)
            }
        }
        .sheet(isPresented: $plansListOpen) {
            FundingPlansListSheet()
        }
    }

    // MARK: - Header subtitle (종전 큰 제목 "지금 받을 수 있는 자금/내 가게에 맞는 펀딩"은 부제로 합침)

    private var headerSubtitle: String {
        if state.recommendMode { return "내 가게 맞춤 TOP 6" }
        if let snapshot = state.profileSnapshot, !snapshot.businessLaunched {
            return "사업 정보 입력 후 맞춤 매칭"
        }
        return "전체 매칭 · 마감 임박 우선"
    }

    // MARK: - States

    private var loadingState: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text("프로그램을 불러오는 중…")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    private func errorState(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundStyle(BUColor.danger)
                Text("매칭 불러오기 실패")
                    .font(.system(size: 14, weight: .heavy))
            }
            Text(message)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            Button {
                Task { await loadPrograms() }
            } label: {
                Text("다시 시도")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
                    .frame(minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight, in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    // MARK: - KPI summary

    private var kpiSummary: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                KPIMini(
                    eyebrow: "전체",
                    value: "\(state.stats?.total ?? 0)개",
                    sub: state.recommendMode ? "추천" : "매칭됨",
                    tint: BUColor.midnight
                )
                KPIMini(
                    eyebrow: "내 자격",
                    value: "\(state.stats?.eligible ?? 0)개",
                    sub: "조건 충족",
                    tint: BUColor.success
                )
                KPIMini(
                    eyebrow: "모집중",
                    value: "\(state.stats?.open ?? 0)개",
                    sub: "신청 가능",
                    tint: BUColor.warn
                )
                KPIMini(
                    eyebrow: "예정",
                    value: "\(state.stats?.upcoming ?? 0)개",
                    sub: "공고 대기",
                    tint: BUColor.inkMuted
                )
            }
            .padding(.horizontal, 2)
        }
    }

    // MARK: - Recommend toggle

    private var recommendToggle: some View {
        Button {
            state.recommendMode.toggle()
            Task { await loadPrograms() }
        } label: {
            HStack(alignment: .center, spacing: 10) {
                Image(systemName: state.recommendMode ? "sparkles" : "magnifyingglass")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(state.recommendMode ? .white : BUColor.midnight)
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.recommendMode ? "추천 매칭 ON" : "추천 매칭 보기")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(state.recommendMode ? .white : BUColor.ink)
                    Text(state.recommendMode ? "TOP 6 자격 충족 + 적합도 높은 순" : "내 가게에 가장 적합한 6개만")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(state.recommendMode ? Color.white.opacity(0.82) : BUColor.inkMuted)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(minHeight: BUSpacing.minTapTarget)
            .background(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .fill(state.recommendMode ? BUColor.midnight : Color.white.opacity(0.72))
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .strokeBorder(state.recommendMode ? Color.clear : BUColor.cardBorder, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - My plans (서버 저장 사업계획서 목록, 2026-08-14)

    private var myPlansButton: some View {
        Button {
            plansListOpen = true
        } label: {
            HStack(alignment: .center, spacing: 10) {
                Image(systemName: "doc.text")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                VStack(alignment: .leading, spacing: 2) {
                    Text("내 사업계획서 보기")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text("생성한 초안 목록 · 어디서든 열람")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.6))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(minHeight: BUSpacing.minTapTarget)
            .background(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .fill(Color.white.opacity(0.72))
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Filter chips

    private var categoryChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(CategoryFilter.allCases) { cat in
                    FilterChip(
                        label: cat.label,
                        isSelected: state.categoryFilter == cat,
                        action: { state.categoryFilter = cat }
                    )
                }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, 2)
        }
    }

    private var statusChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(StatusFilter.allCases) { st in
                    FilterChip(
                        label: st.label,
                        isSelected: state.statusFilter == st,
                        action: { state.statusFilter = st },
                        small: true
                    )
                }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, 2)
        }
    }

    // MARK: - Program list

    @ViewBuilder
    private var programList: some View {
        let list = state.filtered
        if list.isEmpty {
            emptyState
        } else {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(list) { program in
                    ProgramCard(
                        program: program,
                        onApply: { applyTo(program) },
                        onScore: { scoreTarget = program },
                        onPlan: { planTarget = program }
                    )
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 6) {
            Image(systemName: "tray")
                .font(.system(size: 24, weight: .regular))
                .foregroundStyle(BUColor.inkMuted.opacity(0.5))
            Text("조건에 맞는 펀딩이 없습니다")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
            Text("필터를 조정해보세요")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
    }

    // MARK: - Footnote

    private var footnote: some View {
        Text("매칭 정보는 2026년 기준 공고 데이터입니다. 정확한 신청은 각 기관 공고를 확인하세요.")
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            .lineSpacing(2)
            .padding(.top, 4)
    }

    // MARK: - Actions

    private func applyTo(_ program: FundingProgram) {
        // 앱 내부 신청형 → 신청 시트, 그 외 → 외부 공식사이트.
        if program.internalApply {
            applyTarget = program
        } else if let url = URL(string: program.url) {
            openURL(url)
        }
    }

    private func loadPrograms() async {
        state.loading = true
        state.error = nil
        defer { state.loading = false }

        do {
            guard let uid = BUSupabase.shared.currentUser?.id else {
                state.error = "로그인이 필요합니다."
                return
            }
            let profileRepo = FundingProfileRepository(supabase: BUSupabase.shared.client, userId: uid)
            let snapshot = try await profileRepo.loadSnapshot()
            state.profileSnapshot = snapshot

            let criteria = FundingProfileRepository.makeCriteria(from: snapshot)
            let fundingRepo = FundingRepository(supabase: BUSupabase.shared.client)
            let response = state.recommendMode
                ? try await fundingRepo.recommend(criteria: criteria, limit: 6)
                : try await fundingRepo.matchAll(criteria: criteria)

            state.programs = response.programs
            state.stats = response.stats
        } catch {
            state.error = (error as? (any LocalizedError))?.errorDescription ?? error.localizedDescription
        }
    }
}

// MARK: - KPI mini card

private struct KPIMini: View {
    let eyebrow: String
    let value: String
    let sub: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(eyebrow)
                .font(.system(size: 10, weight: .semibold))
                .tracking(0.8)
                .foregroundStyle(BUColor.inkMuted.opacity(0.75))
                .textCase(.uppercase)
                .lineLimit(1)
            Text(value)
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            Text(sub)
                .font(.system(size: 10.5, weight: .medium))
                .foregroundStyle(tint.opacity(0.9))
                .lineLimit(1)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .frame(width: 124, alignment: .leading)
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

// MARK: - Filter chip

private struct FilterChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void
    var small: Bool = false

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: small ? 12 : 13, weight: .heavy))
                .foregroundStyle(isSelected ? .white : BUColor.ink)
                .padding(.horizontal, small ? 12 : 14)
                .padding(.vertical, small ? 8 : 10)
                .frame(minHeight: BUSpacing.minTapTarget)
                .background(
                    Capsule(style: .continuous)
                        .fill(isSelected ? BUColor.midnight : Color.white.opacity(0.72))
                )
                .overlay(
                    Capsule(style: .continuous)
                        .strokeBorder(isSelected ? Color.clear : BUColor.cardBorder, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Program card

private struct ProgramCard: View {
    let program: FundingProgram
    let onApply: () -> Void
    let onScore: () -> Void
    /// 공고 맞춤 사업계획서 시트 오픈 (주 2회)
    let onPlan: () -> Void

    @State private var docsExpanded: Bool = false
    @State private var reasonsExpanded: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // ── Top row: status / D-day / highlight ──
            HStack(alignment: .center, spacing: 6) {
                StatusBadge(status: program.applicationStatus)
                if let dday = program.daysUntilDeadline, dday >= 0 {
                    DDayBadge(days: dday)
                }
                if program.highlight {
                    Image(systemName: "star.fill")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(BUColor.warn)
                }
                Spacer(minLength: 0)
                if program.eligible {
                    HStack(spacing: 3) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 10, weight: .bold))
                        Text("자격 충족")
                            .font(.system(size: 10, weight: .heavy))
                    }
                    .foregroundStyle(BUColor.success)
                }
            }

            // ── Category chip + amount ──
            HStack(alignment: .center, spacing: 8) {
                CategoryChip(category: CategoryFilter.from(program.category))
                Spacer(minLength: 6)
                if let amount = program.amount, !amount.isEmpty {
                    Text(amount)
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.midnightDeep)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
            }

            // ── Program name ──
            Text(program.name)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .fixedSize(horizontal: false, vertical: true)

            // ── Benefit ──
            Text(program.benefit)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.85))
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

            // ── Match reasons (collapsible) ──
            if !program.matchReasons.isEmpty {
                MatchReasonsView(reasons: program.matchReasons, expanded: $reasonsExpanded)
            }

            // ── Organizer + target ──
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 5) {
                    Image(systemName: "building.2")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                    Text(program.organizer)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.85))
                        .lineLimit(1)
                }
                HStack(spacing: 5) {
                    Image(systemName: "target")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                    Text(program.target)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(2)
                }
                HStack(spacing: 5) {
                    Image(systemName: "calendar")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.65))
                    Text(program.season)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(1)
                }
            }

            // ── Required docs (collapsible) ──
            if !program.requiredDocs.isEmpty {
                RequiredDocsView(docs: program.requiredDocs, expanded: $docsExpanded)
            }

            // ── Bottom: AI score + Apply ──
            HStack(spacing: 8) {
                Button(action: onScore) {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 10, weight: .heavy))
                        Text("AI 점수")
                            .font(.system(size: 12, weight: .heavy))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight.opacity(0.10), in: Capsule())
                }
                .buttonStyle(.plain)

                Button(action: onPlan) {
                    HStack(spacing: 4) {
                        Image(systemName: "doc.text")
                            .font(.system(size: 10, weight: .heavy))
                        Text("맞춤 계획서")
                            .font(.system(size: 12, weight: .heavy))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight.opacity(0.10), in: Capsule())
                }
                .buttonStyle(.plain)

                Spacer(minLength: 0)

                Button(action: onApply) {
                    HStack(spacing: 4) {
                        Text(program.internalApply ? "신청하기" : "신청")
                            .font(.system(size: 12, weight: .heavy))
                        Image(systemName: program.internalApply ? "paperplane.fill" : "arrow.up.right")
                            .font(.system(size: 10, weight: .heavy))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .frame(minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight, in: Capsule())
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 4)
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .fill(program.eligible ? Color.white.opacity(0.85) : Color.white.opacity(0.55))
        )
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
        .buShadow(.card)
        .opacity(program.eligible ? 1.0 : 0.78)
    }
}

// MARK: - Sub-views

private struct StatusBadge: View {
    let status: String  // "open" | "upcoming" | "closed"

    private var info: (label: String, color: Color) {
        switch status {
        case "open":
            return ("모집중", BUColor.success)
        case "upcoming":
            return ("예정", BUColor.warn)
        default:
            return ("마감", BUColor.inkMuted)
        }
    }

    var body: some View {
        Text(info.label)
            .font(.system(size: 10, weight: .heavy))
            .foregroundStyle(.white)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(info.color, in: Capsule())
    }
}

private struct DDayBadge: View {
    let days: Int

    private var color: Color {
        if days <= 3 { return BUColor.danger }   // urgent red
        if days <= 7 { return BUColor.warn }   // orange
        if days <= 14 { return BUColor.warn }  // amber
        return BUColor.inkMuted
    }

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "timer")
                .font(.system(size: 8, weight: .bold))
            Text("D-\(days)")
                .font(.system(size: 10, weight: .heavy))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(color, in: Capsule())
    }
}

private struct CategoryChip: View {
    let category: CategoryFilter

    var body: some View {
        Text(category.label)
            .font(.system(size: 10.5, weight: .heavy))
            .tracking(0.4)
            .foregroundStyle(category.color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(category.color.opacity(0.10), in: Capsule())
    }
}

private struct MatchReasonsView: View {
    let reasons: [FundingMatchReason]
    @Binding var expanded: Bool

    var body: some View {
        let visible = expanded ? reasons : Array(reasons.prefix(2))
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 4) {
                Image(systemName: "sparkle")
                    .font(.system(size: 9, weight: .bold))
                Text("왜 추천?")
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(0.3)
                Spacer(minLength: 0)
                if reasons.count > 2 {
                    Button {
                        expanded.toggle()
                    } label: {
                        Text(expanded ? "접기" : "더 보기")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                    }
                    .buttonStyle(.plain)
                }
            }
            .foregroundStyle(BUColor.midnightDeep)

            VStack(alignment: .leading, spacing: 3) {
                ForEach(Array(visible.enumerated()), id: \.offset) { _, r in
                    HStack(alignment: .firstTextBaseline, spacing: 5) {
                        Text("•")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(BUColor.midnight.opacity(0.6))
                        Text(r.text)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(BUColor.ink.opacity(0.85))
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .padding(8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(BUColor.midnight.opacity(0.05))
        )
    }
}

private struct RequiredDocsView: View {
    let docs: [String]
    @Binding var expanded: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                expanded.toggle()
            } label: {
                HStack(spacing: 5) {
                    Image(systemName: "doc.text")
                        .font(.system(size: 10, weight: .bold))
                    Text("필요 서류 \(docs.count)개")
                        .font(.system(size: 11, weight: .heavy))
                    Spacer(minLength: 0)
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 9, weight: .bold))
                }
                .foregroundStyle(BUColor.inkMuted)
                .padding(.vertical, 6)
            }
            .buttonStyle(.plain)

            if expanded {
                VStack(alignment: .leading, spacing: 3) {
                    ForEach(Array(docs.enumerated()), id: \.offset) { _, d in
                        HStack(alignment: .firstTextBaseline, spacing: 5) {
                            Text("•")
                                .font(.system(size: 10, weight: .heavy))
                                .foregroundStyle(BUColor.inkMuted.opacity(0.6))
                            Text(d)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(BUColor.ink.opacity(0.85))
                                .fixedSize(horizontal: false, vertical: true)
                            Spacer(minLength: 0)
                        }
                    }
                }
                .padding(.top, 4)
                .padding(.leading, 12)
            }
        }
    }
}

// FundingScoreSheet 는 FundingScoreSheet.swift 에 분리.

// MARK: - 창업지원금 신청 시트 (앱 내부 신청 — 현 사업체로 즉시 신청)

private struct GrantApplySheet: View {
    let program: FundingProgram
    let snapshot: FundingProfileSnapshot

    @Environment(\.dismiss) private var dismiss
    @State private var pitch: String = ""
    @State private var submitting = false
    @State private var errorMsg: String? = nil
    @State private var done = false
    @State private var announce: String? = nil

    // 접수 기간·발표일 — 서버(/api/funding/apply)와 동일.
    private let applyOpen = "2026-06-15"
    private let applyClose = "2026-08-15"
    private let announceDefault = "2026-08-22"

    private func kstToday() -> String {
        let fmt = DateFormatter()
        fmt.timeZone = TimeZone(identifier: "Asia/Seoul")
        fmt.dateFormat = "yyyy-MM-dd"
        return fmt.string(from: Date())
    }
    private var windowState: String {
        let today = kstToday()
        if today < applyOpen { return "before" }
        if today > applyClose { return "closed" }
        return "open"
    }
    private func dot(_ s: String) -> String { s.replacingOccurrences(of: "-", with: ".") }

    var body: some View {
        NavigationStack {
            ScrollView {
                if done {
                    successView
                } else {
                    formView
                }
            }
            .navigationTitle("창업지원금 신청")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(done ? "닫기" : "취소") { dismiss() }
                }
            }
        }
    }

    private var formView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(program.name)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(BUColor.ink)
            Text("신청 \(dot(applyOpen))~\(dot(applyClose)) · 발표 \(dot(announceDefault)) · 1팀 100만원")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)

            // 신청할 사업체
            VStack(alignment: .leading, spacing: 6) {
                Text("신청할 사업체")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                Text(snapshot.storeName ?? "(사업체 이름 미입력)")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                Text("현재 사업체 정보(최근 매출·사용자 수 변화 등)가 함께 전달돼요.")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

            // 아이디어·열정
            VStack(alignment: .leading, spacing: 6) {
                Text("사업 아이디어와 열정 (선택)")
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                TextEditor(text: $pitch)
                    .font(.system(size: 14))
                    .frame(minHeight: 100)
                    .padding(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .strokeBorder(BUColor.cardBorder, lineWidth: 1)
                    )
                Text("어떤 사업을, 왜 하고 있는지 / 무엇에 열정을 쏟는지 적어주세요. 심사에서 가장 중요해요.")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.8))
            }

            if windowState == "before" {
                Text("신청은 \(dot(applyOpen))부터 가능해요.")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            } else if windowState == "closed" {
                Text("신청이 마감되었어요.")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.danger)
            }
            if let err = errorMsg {
                Text(err)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.danger)
            }

            Button(action: { Task { await submit() } }) {
                Text(submitting ? "신청 중…" : "예, 신청할게요")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .opacity(windowState == "open" && !submitting ? 1 : 0.5)
            }
            .buttonStyle(.plain)
            .disabled(windowState != "open" || submitting)
        }
        .padding(20)
    }

    private var successView: some View {
        VStack(spacing: 12) {
            Text("🎉").font(.system(size: 40))
            Text("신청 완료!")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
            Text("\(snapshot.storeName ?? "회원님의 사업체")(으)로 신청이 접수됐어요. 선정 결과는 \(dot(announce ?? announceDefault))에 발표됩니다. 그때까지 열정을 잃지 마세요!")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
            Button(action: { dismiss() }) {
                Text("확인")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
            .padding(.top, 8)
        }
        .padding(28)
        .frame(maxWidth: .infinity)
    }

    private func submit() async {
        submitting = true
        errorMsg = nil
        let repo = FundingApplyRepository(supabase: BUSupabase.shared.client)
        let result = await repo.apply(programId: program.id, pitch: pitch, snapshot: snapshot)
        submitting = false
        if result.ok {
            announce = result.announce
            done = true
        } else {
            errorMsg = result.message ?? "신청에 실패했어요."
        }
    }
}
