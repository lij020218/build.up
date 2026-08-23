//
//  GuestModeView.swift — 로그인 없이 둘러보기 (게스트 모드)
//
//  App Review 5.1.1(v) 대응 (2026-08-23): "계정 기반이 아닌 기능은 가입 없이 접근 가능해야"
//  → 계정·개인정보와 무관한 번들 정보 surface 3개만 노출하는 Release 셸.
//
//   • 프랜차이즈 — FranchiseView 그대로 (franchise-brands JSON 번들, 100% 로컬·네트워크 無)
//   • 세금       — GuestTaxView (TaxDataRegistry·TaxEstimate 번들 데이터의 안내 섹션만.
//                  내 가게 기준 계산은 "가입 후" 게이트)
//   • 로드맵     — GuestRoadmapPreview (RoadmapSampleData 오프라인 경로 + StageContentRegistry
//                  읽기 전용 렌더. 입력·완료 버튼·store 쓰기 전부 없음)
//
//  ⚠️ 가짜 숫자 금지 — 데모 매출·대시보드 절대 미노출. 계정 기반 surface(홈·AI·직원)는
//     전부 가입 게이트 뒤에 남는다. DEBUG 데모 인프라(DemoTabs)와 완전 별개.
//
//  디자인 (2026-08-23 미니멀·아이콘 리디자인):
//   • 모든 행/카드 leading = 36pt 아이콘 타일 (rounded 10, midnight 8% bg, SF Symbol semibold)
//   • 테두리 제거 — 옅은 bg(white 0.72 / midnight 4%)로 구분, radius 14-16
//   • 섹션 헤더 = 10pt SF 심볼 + 11pt heavy 라벨
//   • 로드맵 = phase 별 그룹 섹션 (행마다 번호·칩 반복 제거)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

// MARK: - 아이콘 디자인 시스템 (게스트 전용 fileprivate)

/// SF Symbol 이름 검증 — 이 iOS 버전에 없으면 폴백 심볼로 대체.
private func safeSymbol(_ name: String, fallback: String = "circle.fill") -> String {
    #if canImport(UIKit)
    if UIImage(systemName: name) != nil { return name }
    return UIImage(systemName: fallback) != nil ? fallback : "circle.fill"
    #else
    return name
    #endif
}

/// 36×36 라운드 사각 아이콘 타일 — 모든 목록 행/카드의 leading 요소.
private struct GuestIconTile: View {
    let symbol: String
    var fallback: String = "circle.fill"
    var size: CGFloat = 36

    var body: some View {
        Image(systemName: safeSymbol(symbol, fallback: fallback))
            .font(.system(size: size >= 36 ? 15.5 : 13, weight: .semibold))
            .foregroundStyle(BUColor.midnight)
            .frame(width: size, height: size)
            .background(
                BUColor.midnight.opacity(0.08),
                in: RoundedRectangle(cornerRadius: size >= 36 ? 10 : 8, style: .continuous)
            )
    }
}

/// 섹션 헤더 — 작은 심볼 + 11pt heavy 라벨.
private struct GuestSectionHeader: View {
    let symbol: String
    let text: String

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: safeSymbol(symbol))
                .font(.system(size: 10, weight: .bold))
            Text(text)
                .font(.system(size: 11, weight: .heavy))
                .kerning(0.3)
        }
        .foregroundStyle(BUColor.ink.opacity(0.5))
        .padding(.leading, 2)
    }
}

// MARK: - Guest Shell

public struct GuestModeView: View {

    /// 게스트 종료 → SignInView 복귀 (가입/로그인 진입점)
    let onExitToSignIn: () -> Void

    public init(onExitToSignIn: @escaping () -> Void) {
        self.onExitToSignIn = onExitToSignIn
    }

    private enum GuestTab: String, CaseIterable, Identifiable {
        case roadmap
        case franchise
        case tax

        var id: String { rawValue }

        var label: String {
            switch self {
            case .roadmap:   return "로드맵"
            case .franchise: return "프랜차이즈"
            case .tax:       return "세금"
            }
        }

        var systemImage: String {
            switch self {
            case .roadmap:   return "map"
            case .franchise: return "storefront"
            case .tax:       return "wonsign.circle"
            }
        }
    }

    @State private var selectedTab: GuestTab = {
        #if DEBUG
        // 디자인 검증용 — SIMCTL_CHILD_BU_DEMO_GUEST_TAB=franchise|tax|roadmap (시뮬 탭 도구 부재 대응)
        if let raw = ProcessInfo.processInfo.environment["BU_DEMO_GUEST_TAB"],
           let tab = GuestTab(rawValue: raw.lowercased()) {
            return tab
        }
        #endif
        return .roadmap
    }()
    /// 게이트된 기능 탭 시 안내 알림 ("가입 후 이용할 수 있어요")
    @State private var showSignupGateAlert = false

    public var body: some View {
        ZStack {
            BUBackgroundSurface()

            VStack(spacing: 0) {
                banner

                Group {
                    switch selectedTab {
                    case .roadmap:
                        GuestRoadmapPreview(onRequestSignup: { showSignupGateAlert = true })
                    case .franchise:
                        FranchiseView()
                    case .tax:
                        GuestTaxView(onRequestSignup: { showSignupGateAlert = true })
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .overlay(alignment: .bottom) {
            tabBar
                .padding(.horizontal, 28)
                .padding(.bottom, 6)
        }
        .tint(BUColor.midnightInk)
        .alert("가입 후 이용할 수 있어요", isPresented: $showSignupGateAlert) {
            Button("가입하기") { onExitToSignIn() }
            Button("계속 둘러보기", role: .cancel) {}
        } message: {
            Text("내 가게 데이터를 기반으로 한 기능은 무료 가입 후 이용할 수 있어요.")
        }
    }

    // MARK: 상단 배너 — 항상 표시 (한 줄 유지)

    private var banner: some View {
        HStack(spacing: 8) {
            Image(systemName: "eye")
                .font(.system(size: 12, weight: .semibold))
            Text("둘러보기 모드")
                .font(.system(size: 12, weight: .bold))
                .lineLimit(1)
            Spacer(minLength: 6)
            Button(action: onExitToSignIn) {
                Text("가입하기")
                    .font(.system(size: 11, weight: .heavy))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.white.opacity(0.22), in: Capsule())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("가입하기")
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [BUColor.midnight, BUColor.midnightBright],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .padding(.horizontal, 6)
        .padding(.top, 4)
    }

    // MARK: 하단 탭 바 — 게스트 3탭 + 가입/로그인

    private var tabBar: some View {
        HStack(spacing: 2) {
            ForEach(GuestTab.allCases) { tab in
                let selected = selectedTab == tab
                Button {
                    withAnimation(.snappy(duration: 0.2)) { selectedTab = tab }
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

            // 4번째 아이템 — 가입/로그인 (게스트 종료)
            Button(action: onExitToSignIn) {
                VStack(spacing: 3) {
                    Image(systemName: "person.crop.circle.badge.plus")
                        .font(.system(size: 17, weight: .medium))
                    Text("가입/로그인")
                        .font(.system(size: 10, weight: .semibold))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                .foregroundStyle(BUColor.midnight)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("가입 또는 로그인")
        }
        .padding(6)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(Capsule().strokeBorder(Color.white.opacity(0.55), lineWidth: 0.7))
        .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 0.7).padding(-0.7))
    }
}

// MARK: - GuestTaxView — 번들 세금 정보 (안내 섹션만, 계정 데이터 無)

struct GuestTaxView: View {
    let onRequestSignup: () -> Void

    @Environment(\.openURL) private var openURL

    private let hometax = "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3"

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                BUPageHeader(
                    title: "세금",
                    subtitle: "세액공제 · 신고 일정 안내"
                )
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    hometaxRow
                    gatedCalcRow
                    creditSection
                    scheduleSection
                    Color.clear.frame(height: 110)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
            }
        }
        .scrollIndicators(.hidden)
    }

    // ── 국세청 홈택스 — 신고·납부는 공식 채널로 ──

    private var hometaxRow: some View {
        Button {
            if let url = URL(string: hometax) { openURL(url) }
        } label: {
            HStack(spacing: 12) {
                GuestIconTile(symbol: "building.columns")
                VStack(alignment: .leading, spacing: 2) {
                    Text("국세청 홈택스")
                        .font(.system(size: 14.5, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .lineLimit(1)
                    Text("신고·납부·전자세금계산서")
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(1)
                }
                Spacer(minLength: 6)
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.midnight.opacity(0.55))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("국세청 홈택스 열기")
    }

    // ── 세금 계산은 내 매출 기반 → 가입 게이트 ──

    private var gatedCalcRow: some View {
        Button(action: onRequestSignup) {
            HStack(spacing: 12) {
                GuestIconTile(symbol: "lock")
                VStack(alignment: .leading, spacing: 2) {
                    Text("내 가게 기준 예상 세금")
                        .font(.system(size: 14.5, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .lineLimit(1)
                    Text("가입 후 매출을 기록하면 보여요")
                        .font(.system(size: 11.5))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineLimit(1)
                }
                Spacer(minLength: 6)
                Text("가입")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(BUColor.midnight, in: Capsule())
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // ── 세액공제·감면 (공통 4종 — 번들 데이터, 누구에게나 동일) ──

    /// TaxDataRegistry.common id → SF Symbol.
    private func creditSymbol(_ id: String) -> String {
        switch id {
        case "yellow-umbrella":       return "umbrella"
        case "pension-irp":           return "chart.line.uptrend.xyaxis"
        case "integrated-employment": return "person.2.badge.plus"
        case "sincere-medical-edu":   return "cross.case"
        default:                      return "percent"
        }
    }

    private var creditSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            GuestSectionHeader(symbol: "checkmark.seal", text: "챙길 세액공제·감면")
            ForEach(TaxDataRegistry.common) { b in
                HStack(alignment: .top, spacing: 12) {
                    GuestIconTile(symbol: creditSymbol(b.id), fallback: "person.2")
                    VStack(alignment: .leading, spacing: 2) {
                        Text(b.titleKo)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                        Text(b.summaryKo)
                            .font(.system(size: 11.5))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(1.5)
                            .lineLimit(2)   // 밀도: 요약 2줄 컷, 법조 근거는 하단 각주 하나로 갈음
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            // 업종특화 감면 — 업종은 계정 데이터 → 가입 게이트 행
            Button(action: onRequestSignup) {
                HStack(spacing: 12) {
                    GuestIconTile(symbol: "lock")
                    Text("업종별 감면은 가입 후 내 업종 기준으로 보여요")
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(BUColor.ink.opacity(0.65))
                        .lineSpacing(2)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            Text("※ 자격·감면율은 조세특례제한법·국세청 기준 안내예요. 실제 적용 세액은 홈택스·세무사로 확정하세요.")
                .font(.system(size: 10.5))
                .foregroundStyle(BUColor.ink.opacity(0.45))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 2)
        }
    }

    // ── 신고 일정 (전 사업자 공통 캘린더 — 직원 필터만 제외하고 전부 표시) ──

    private struct ScheduleItem {
        let event: TaxScheduleEvent
        let daysUntil: Int
        let dDayLabel: String
    }

    private var scheduleSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            GuestSectionHeader(symbol: "calendar", text: "신고 일정")
            ForEach(upcomingEvents(), id: \.event.id) { item in
                HStack(alignment: .center, spacing: 12) {
                    GuestIconTile(symbol: "calendar")
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.event.title)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.85)
                        Text(item.event.description)
                            .font(.system(size: 11.5))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 8)
                    Text(item.dDayLabel)
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(item.daysUntil <= 14 ? BUColor.danger : BUColor.midnight)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            Text("내 과세유형(간이·일반)에 맞춘 일정은 가입 후 보여드려요.")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .padding(.horizontal, 2)
        }
    }

    /// 오늘 기준 다가오는 신고일 — 게스트는 과세유형·직원 정보가 없으므로
    /// 직원 필수 이벤트만 제외하고 일반 안내로 전부 표시 (TaxView 로직의 무프로필 버전).
    private func upcomingEvents() -> [ScheduleItem] {
        let cal = Calendar(identifier: .gregorian)
        let today = cal.startOfDay(for: Date())
        let year = cal.component(.year, from: today)
        var items: [ScheduleItem] = []
        for e in TaxDataRegistry.events {
            if e.requiresEmployees { continue }
            for y in [year, year + 1] {
                if let date = cal.date(from: DateComponents(year: y, month: e.month, day: e.day)) {
                    let d0 = cal.startOfDay(for: date)
                    let days = cal.dateComponents([.day], from: today, to: d0).day ?? 0
                    if days >= 0 {
                        items.append(.init(event: e, daysUntil: days, dDayLabel: days == 0 ? "오늘" : "D-\(days)"))
                        break
                    }
                }
            }
        }
        return items.sorted { $0.daysUntil < $1.daysUntil }.prefix(4).map { $0 }
    }
}

// MARK: - GuestRoadmapPreview — 오프라인 경로 읽기 전용 미리보기

struct GuestRoadmapPreview: View {
    let onRequestSignup: () -> Void

    /// 읽기 전용 단계 목록 — decisions/store 없이 전부 upcoming.
    ///  ⚠️ RoadmapSampleData.stages(for:) (기본)은 데모용으로 완료 표시를 섞으므로 금지 —
    ///     게스트에게 가짜 진행도를 보여주지 않는다.
    private let stages = RoadmapSampleData.stages(for: .offlineFood, resolveStatus: { _ in .upcoming })

    @State private var selectedStage: RoadmapStage? = nil

    #if DEBUG
    /// 디자인 검증용 — SIMCTL_CHILD_BU_DEMO_GUEST_STAGE=<stageId> 로 상세 시트 자동 오픈.
    private func autoOpenStageIfDemo() {
        if let raw = ProcessInfo.processInfo.environment["BU_DEMO_GUEST_STAGE"],
           let stage = stages.first(where: { $0.stageId == raw }) {
            selectedStage = stage
        }
    }
    #endif

    private struct PhaseGroup: Identifiable {
        let phase: StagePhase
        var stages: [RoadmapStage]
        var id: String { phase.rawValue }
    }

    /// phase 순서를 유지한 연속 그룹 (offline: 준비 → 사업 등록 → 오픈 준비 → 오픈·운영).
    private var phaseGroups: [PhaseGroup] {
        var groups: [PhaseGroup] = []
        for stage in stages {
            if let last = groups.indices.last, groups[last].phase == stage.phase {
                groups[last].stages.append(stage)
            } else {
                groups.append(PhaseGroup(phase: stage.phase, stages: [stage]))
            }
        }
        return groups
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                BUPageHeader(
                    title: "창업 로드맵",
                    subtitle: "단계를 눌러 내용 미리보기"
                )
                VStack(alignment: .leading, spacing: 8) {
                    signupHintCard
                    ForEach(phaseGroups) { group in
                        GuestSectionHeader(symbol: phaseSymbol(group.phase), text: group.phase.labelKo)
                            .padding(.top, 10)
                        ForEach(group.stages) { stage in
                            stageRow(stage)
                        }
                    }
                    Color.clear.frame(height: 110)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
            }
        }
        .scrollIndicators(.hidden)
        #if DEBUG
        .onAppear { autoOpenStageIfDemo() }
        #endif
        .sheet(item: $selectedStage) { stage in
            GuestStageDetailSheet(stage: stage, onRequestSignup: onRequestSignup)
        }
    }

    // ── 심볼 매핑 ──

    /// phase → 섹션 헤더 심볼 (offline 4종 + 안전 기본값).
    private func phaseSymbol(_ phase: StagePhase) -> String {
        switch phase {
        case .preparation:  return "lightbulb"
        case .registration: return "doc.text"
        case .setup:        return "hammer"
        case .launch:       return "storefront"
        default:            return "flag"
        }
    }

    /// stageId → 행 아이콘 심볼 (offline 21종 + 안전 기본값).
    private func stageSymbol(_ id: String) -> String {
        switch id {
        // 공통 준비
        case "industry-selection":         return "square.grid.2x2"
        case "startup-type":               return "building.2"
        case "business-model":             return "switch.2"
        case "target-customer-definition": return "person.2"
        case "budget-setup":               return "wonsign.circle"
        // 사업 등록
        case "permit-check":               return "checkmark.seal"
        case "location-candidates":        return "map"
        case "contract-review":            return "doc.text.magnifyingglass"
        // 오픈 준비
        case "construction-setup":         return "paintbrush.pointed"
        case "registration-setup":         return "doc.badge.plus"
        case "biz-registration":           return "creditcard"
        case "tax-guide":                  return "percent"
        case "loan-guide":                 return "banknote"
        case "menu-design":                return "fork.knife"
        case "vendor-setup":               return "shippingbox"
        case "hiring-setup":               return "person.badge.plus"
        case "insurance-tax-setup":        return "checkmark.shield"
        // 오픈·운영
        case "operations-setup":           return "megaphone"
        case "pre-launch":                 return "sparkles"
        case "financial-review":           return "chart.line.uptrend.xyaxis"
        case "pre-launch-final":           return "flag.checkered"
        default:                           return "flag"
        }
    }

    private var signupHintCard: some View {
        HStack(spacing: 8) {
            Image(systemName: "sparkles")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.midnightBright)
            Text("가입하면 내 업종 맞춤 구성으로 진행을 관리할 수 있어요.")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.ink.opacity(0.7))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 14))
    }

    private func stageRow(_ stage: RoadmapStage) -> some View {
        Button {
            selectedStage = stage
        } label: {
            HStack(spacing: 12) {
                GuestIconTile(symbol: stageSymbol(stage.stageId))
                Text(stage.titleKo)
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                Spacer(minLength: 6)
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.inkSubtle)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(stage.stepNumber)단계 \(stage.titleKo)")
    }
}

// MARK: - GuestStageDetailSheet — StageContentRegistry 읽기 전용 렌더
//
//  BUStageContentRenderer 는 RoadmapStore environment + UserDefaults 기록 + Supabase 동기화가
//  얽혀 있어 게스트에 부적합 → 정적(비인터랙티브) 섹션만 골라 그리는 전용 read-only 렌더.
//  입력·토글·체크리스트·완료 버튼 없음.

private struct GuestStageDetailSheet: View {
    let stage: RoadmapStage
    let onRequestSignup: () -> Void

    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    private var content: BUStageContent? {
        StageContentRegistry.content(for: stage.stageId)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    header
                    if let content {
                        if let ka = content.keyAction {
                            keyActionCard(ka)
                        }
                        ForEach(Array(content.pages.enumerated()), id: \.offset) { _, page in
                            renderPage(page)
                        }
                    }
                    signupFooter
                    Color.clear.frame(height: 24)
                }
                .padding(.horizontal, BUSpacing.screenMargin)
                .padding(.top, 6)
            }
            .scrollIndicators(.hidden)
            .background(BUFlatBackground().ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: "eye")
                    .font(.system(size: 10, weight: .bold))
                Text("\(stage.stepNumber)단계 · \(stage.phase.labelKo) · 미리보기")
                    .font(.system(size: 11.5, weight: .heavy))
                    .textCase(nil)
            }
            .foregroundStyle(BUColor.midnight.opacity(0.6))
            Text(content?.shell.title ?? stage.titleKo)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(BUColor.ink)
                .tracking(-0.5)
                .fixedSize(horizontal: false, vertical: true)
            Text(content?.shell.helperText ?? stage.descriptionKo)
                .font(.system(size: 13))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.top, 8)
    }

    private func keyActionCard(_ ka: BUStageContent.KeyAction) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                Image(systemName: "star")
                    .font(.system(size: 10, weight: .bold))
                Text(ka.eyebrow)
                    .font(.system(size: 11, weight: .heavy))
            }
            .foregroundStyle(BUColor.midnight.opacity(0.6))
            Text(ka.title)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
                .fixedSize(horizontal: false, vertical: true)
            Text(ka.subtitle)
                .font(.system(size: 12.5))
                .foregroundStyle(BUColor.ink.opacity(0.7))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            if let minis = ka.miniCards, !minis.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(Array(minis.enumerated()), id: \.offset) { _, m in
                        HStack(alignment: .top, spacing: 10) {
                            GuestIconTile(symbol: m.icon, fallback: "checkmark.circle", size: 28)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(m.label)
                                    .font(.system(size: 12.5, weight: .bold))
                                    .foregroundStyle(BUColor.ink)
                                Text(m.detail)
                                    .font(.system(size: 11.5))
                                    .foregroundStyle(BUColor.inkMuted)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
                .padding(.top, 4)
            }
            if let pillars = ka.pillars, !pillars.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(Array(pillars.enumerated()), id: \.offset) { _, p in
                        HStack(alignment: .top, spacing: 10) {
                            GuestIconTile(symbol: p.icon, fallback: "checkmark.circle", size: 28)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(p.label)
                                    .font(.system(size: 12.5, weight: .bold))
                                    .foregroundStyle(BUColor.ink)
                                Text(p.meta)
                                    .font(.system(size: 11.5))
                                    .foregroundStyle(BUColor.inkMuted)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    // ── 페이지 → 정적 섹션만 렌더 ──

    @ViewBuilder
    private func renderPage(_ page: BUStageContent.Page) -> some View {
        let rendered = page.sections.filter { isRenderable($0) }
        if !rendered.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                if !page.label.isEmpty {
                    GuestSectionHeader(symbol: "square.stack", text: page.label)
                        .padding(.top, 4)
                }
                ForEach(Array(rendered.enumerated()), id: \.offset) { _, section in
                    renderSection(section)
                }
            }
        }
    }

    private func isRenderable(_ section: BUStageContent.Section) -> Bool {
        switch section {
        case .whyList, .stepList, .infoCard, .noteList, .comparisonCards, .pathCards, .stageOverview, .linkCards:
            return true
        default:
            // interactive·checklist·permit(byCategory)·wrapup 등 — 계정/입력 종속이라 미리보기 제외
            return false
        }
    }

    @ViewBuilder
    private func renderSection(_ section: BUStageContent.Section) -> some View {
        switch section {
        case .whyList(_, let subtitle, let items):
            sectionCard(symbol: "questionmark.circle", eyebrow: "왜 필요한가", subtitle: subtitle) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .top, spacing: 8) {
                        Text(item.accent)
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(BUColor.midnightBright)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(item.title)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(BUColor.ink)
                            Text(item.body)
                                .font(.system(size: 12))
                                .foregroundStyle(BUColor.inkMuted)
                                .lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        case .stepList(_, let eyebrow, let subtitle, let steps, _, let links):
            sectionCard(symbol: "list.number", eyebrow: eyebrow, subtitle: subtitle) {
                ForEach(Array(steps.enumerated()), id: \.offset) { idx, step in
                    HStack(alignment: .top, spacing: 8) {
                        Text("\(idx + 1)")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                            .frame(width: 20, height: 20)
                            .background(BUColor.midnight.opacity(0.07), in: Circle())
                        VStack(alignment: .leading, spacing: 1) {
                            Text(step.title)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(BUColor.ink)
                            if !step.detail.isEmpty {
                                Text(step.detail)
                                    .font(.system(size: 12))
                                    .foregroundStyle(BUColor.inkMuted)
                                    .lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
                if let links, !links.isEmpty {
                    ForEach(Array(links.enumerated()), id: \.offset) { _, link in
                        if let url = URL(string: link.url) {
                            Button {
                                openURL(url)
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: "link")
                                        .font(.system(size: 10, weight: .semibold))
                                    Text(link.label)
                                        .font(.system(size: 12, weight: .bold))
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 9, weight: .semibold))
                                }
                                .foregroundStyle(BUColor.midnight)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        case .infoCard(_, _, let title, let body):
            sectionCard(symbol: nil, eyebrow: nil, subtitle: nil) {
                HStack(spacing: 6) {
                    Image(systemName: "info.circle")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    Text(title)
                        .font(.system(size: 13.5, weight: .heavy))
                        .foregroundStyle(BUColor.midnightDeep)
                }
                Text(body)
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.ink.opacity(0.72))
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        case .noteList(_, let title, let items):
            sectionCard(symbol: nil, eyebrow: nil, subtitle: nil) {
                HStack(spacing: 6) {
                    Image(systemName: "note.text")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BUColor.midnight)
                    Text(title)
                        .font(.system(size: 13.5, weight: .heavy))
                        .foregroundStyle(BUColor.midnightDeep)
                }
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .top, spacing: 6) {
                        Text("·")
                            .font(.system(size: 12.5, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                        Text(item)
                            .font(.system(size: 12.5))
                            .foregroundStyle(BUColor.ink.opacity(0.72))
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        case .comparisonCards(let eyebrow, let cards):
            sectionCard(symbol: "arrow.left.arrow.right", eyebrow: eyebrow, subtitle: nil) {
                ForEach(Array(cards.enumerated()), id: \.offset) { _, cardItem in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(cardItem.title)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                        if let criteria = cardItem.criteria, !criteria.isEmpty {
                            Text(criteria)
                                .font(.system(size: 11.5, weight: .semibold))
                                .foregroundStyle(BUColor.midnight.opacity(0.7))
                        }
                        Text(cardItem.desc)
                            .font(.system(size: 12))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.vertical, 4)
                }
            }
        case .pathCards(_, let eyebrow, let subtitle, let cards, _):
            sectionCard(symbol: "signpost.right", eyebrow: eyebrow, subtitle: subtitle) {
                ForEach(Array(cards.enumerated()), id: \.offset) { _, cardItem in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(cardItem.condition)
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(BUColor.midnight.opacity(0.7))
                        Text(cardItem.recommendation)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(BUColor.ink)
                        Text(cardItem.reason)
                            .font(.system(size: 12))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.vertical, 4)
                }
            }
        case .stageOverview(let headline, let intro, let stat, let outlineEyebrow, let workOutline, let outcomeTitle, let outcome):
            sectionCard(symbol: nil, eyebrow: nil, subtitle: nil) {
                Text(headline)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .fixedSize(horizontal: false, vertical: true)
                Text(intro)
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.ink.opacity(0.72))
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 6) {
                    Text(stat.value)
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                    Text(stat.label)
                        .font(.system(size: 12))
                        .foregroundStyle(BUColor.inkMuted)
                }
                .padding(.vertical, 2)
                GuestSectionHeader(symbol: "list.bullet", text: outlineEyebrow)
                    .padding(.top, 2)
                ForEach(Array(workOutline.enumerated()), id: \.offset) { idx, item in
                    HStack(alignment: .top, spacing: 8) {
                        Text("\(idx + 1)")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                            .frame(width: 20, height: 20)
                            .background(BUColor.midnight.opacity(0.07), in: Circle())
                        VStack(alignment: .leading, spacing: 1) {
                            Text(item.title)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(BUColor.ink)
                            Text(item.detail)
                                .font(.system(size: 12))
                                .foregroundStyle(BUColor.inkMuted)
                                .lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                Text("\(outcomeTitle): \(outcome)")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.ink.opacity(0.6))
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 2)
            }
        case .linkCards(let eyebrow, let links):
            sectionCard(symbol: "link", eyebrow: eyebrow, subtitle: nil) {
                ForEach(Array(links.enumerated()), id: \.offset) { _, link in
                    if let url = URL(string: link.url) {
                        Button {
                            openURL(url)
                        } label: {
                            VStack(alignment: .leading, spacing: 1) {
                                HStack(spacing: 6) {
                                    Text(link.name)
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(BUColor.midnight)
                                    Text(link.badge)
                                        .font(.system(size: 10, weight: .heavy))
                                        .foregroundStyle(BUColor.midnight.opacity(0.65))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(BUColor.midnight.opacity(0.06), in: Capsule())
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 9, weight: .semibold))
                                        .foregroundStyle(BUColor.midnight.opacity(0.55))
                                }
                                Text(link.desc)
                                    .font(.system(size: 11.5))
                                    .foregroundStyle(BUColor.inkMuted)
                                    .lineSpacing(2)
                                    .multilineTextAlignment(.leading)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(.vertical, 4)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        default:
            EmptyView()
        }
    }

    private func sectionCard<Content: View>(
        symbol: String?,
        eyebrow: String?,
        subtitle: String?,
        @ViewBuilder _ content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if let eyebrow, !eyebrow.isEmpty {
                HStack(spacing: 5) {
                    if let symbol {
                        Image(systemName: safeSymbol(symbol))
                            .font(.system(size: 10, weight: .bold))
                    }
                    Text(eyebrow)
                        .font(.system(size: 11, weight: .heavy))
                }
                .foregroundStyle(BUColor.midnight.opacity(0.6))
            }
            if let subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var signupFooter: some View {
        Button {
            dismiss()
            onRequestSignup()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "lock")
                    .font(.system(size: 13, weight: .semibold))
                Text("이 단계를 내 로드맵으로 관리하려면 가입이 필요해요")
                    .font(.system(size: 13, weight: .bold))
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, minHeight: 50)
            .padding(.horizontal, 14)
            .background(
                LinearGradient(colors: [BUColor.midnight, BUColor.midnightBright], startPoint: .leading, endPoint: .trailing),
                in: RoundedRectangle(cornerRadius: 15, style: .continuous)
            )
        }
        .buttonStyle(.plain)
        .padding(.top, 4)
    }
}

#if canImport(UIKit)
import UIKit
#endif
