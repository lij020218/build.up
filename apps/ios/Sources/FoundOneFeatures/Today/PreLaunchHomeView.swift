//
//  PreLaunchHomeView.swift — 영업 전 홈 (로드맵 중심)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/HomeView.tsx
//
//  routing:
//    !businessLaunched → PreLaunchHomeView (이 파일)  — 로드맵 중심
//     businessLaunched → TodayView                    — 운영 KPI 중심
//
//  구조 (모바일 스택, side-by-side 없음):
//    1. heroPanel       — eyebrow + 타이틀 + 본문 + summary 3-chip + "지금/다음" stage rail + 큰 CTA
//    2. roadmapSignalCard — 시그널: % 큰 숫자 + segmented bar + 2x2 미니 그리드
//    3. founderSnapshotCard — 사장님 정보 미니 리스트 (업종/창업형태/자본금/오픈시점)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - PreLaunchHomeView

public struct PreLaunchHomeView: View {

    let store: DashboardStore
    let onOpenCurrentStage: () -> Void

    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.cluster") private var clusterRaw = BusinessCluster.offlineFood.rawValue

    public init(
        store: DashboardStore,
        onOpenCurrentStage: @escaping () -> Void
    ) {
        self.store = store
        self.onOpenCurrentStage = onOpenCurrentStage
    }

    // MARK: - Derived

    private var cluster: BusinessCluster {
        BusinessCluster(rawValue: clusterRaw) ?? .offlineFood
    }

    private var stages: [RoadmapStage] {
        RoadmapSampleData.stages(for: cluster) { stageId in
            switch roadmapStore.status(for: stageId) {
            case .completed: return .completed
            case .current:   return .current
            case .upcoming:  return .upcoming
            }
        }
    }

    private var completedCount: Int { roadmapStore.completedCount }
    private var totalCount: Int     { max(roadmapStore.totalCount, stages.count) }
    private var percent: Int {
        totalCount > 0 ? Int((Double(completedCount) / Double(totalCount)) * 100) : 0
    }
    private var isFreshAccount: Bool { completedCount == 0 }
    private var allStagesDone: Bool {
        totalCount > 0 && completedCount >= totalCount
    }

    private var currentStage: RoadmapStage? {
        if let cid = roadmapStore.currentStageId {
            return stages.first { $0.id == cid }
        }
        return stages.first { $0.status == .current } ?? stages.first
    }

    private var nextStage: RoadmapStage? {
        let path = roadmapStore.pathStageIds
        guard let cid = roadmapStore.currentStageId,
              let idx = path.firstIndex(of: cid),
              idx + 1 < path.count else { return nil }
        let nextId = path[idx + 1]
        return stages.first { $0.id == nextId }
    }

    // MARK: - Body

    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 0) {
                // 공통 페이지 헤더 (2026-08-19 통일) — 가게 이름 + 준비 상태 한 줄
                BUPageHeader(
                    title: store.storeName.isEmpty ? "내 가게" : store.storeName,
                    subtitle: allStagesDone
                        ? "오픈 준비 완료 · \(totalCount)단계 모두 완료"
                        : "오픈 준비 중 · \(completedCount)/\(totalCount)단계 완료"
                )
                VStack(alignment: .leading, spacing: 16) {
                    heroPanel
                    roadmapSignalCard
                    founderSnapshotCard
                    Color.clear.frame(height: 110)  // 하단 탭바 회피
                }
                .padding(.horizontal, BUSpacing.screenMargin)
            }
        }
        // ⚠️ 2026-05-25: 중복 BUBackgroundSurface 제거 — MobileShell 이 풀스크린으로 깖.
    }

    // MARK: - Hero Panel

    private var heroPanel: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Eyebrow
            Text("ROADMAP-FIRST STARTUP OS")
                .font(.system(size: 11, weight: .heavy))
                .tracking(1.4)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.midnight.opacity(0.72))

            // Big title
            Text(isFreshAccount
                 ? "한 단계씩 창업의 구조를 세웁니다."
                 : "지금 필요한 판단과 다음 실행을 한 곳에 모았습니다.")
                .font(.system(size: 26, weight: .bold))
                .tracking(-1.04)
                .foregroundStyle(BUColor.ink)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

            // Body
            Text(isFreshAccount
                 ? "Found.One은 긴 체크리스트 대신, 지금 정해야 할 것 하나만 또렷하게 보여줍니다."
                 : "현재 단계는 크게, 나머지는 얇게. 복잡한 창업 과정을 실행 가능한 리듬으로 정리합니다.")
                .font(.system(size: 13.5, weight: .regular))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

            // Summary 3-segment chip row
            summaryChipRow
                .padding(.top, 4)

            // Stage rail (지금 / 다음) — allStagesDone 이면 완료 배너로 대체
            if allStagesDone {
                completionBanner
            } else {
                stageRail
            }

            // 큰 CTA 버튼
            Button(action: onOpenCurrentStage) {
                Text(allStagesDone ? "완료 화면 보기" : "현재 단계 열기")
                    .font(.system(size: 14.5, weight: .heavy))
                    .tracking(-0.2)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 22)
                    .padding(.vertical, 14)
                    .background(BUColor.midnight, in: Capsule())
            }
            .buttonStyle(.plain)
            .padding(.top, 2)
            .frame(minHeight: 44, alignment: .leading)
        }
        .padding(.horizontal, 22)
        .padding(.vertical, 22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .strokeBorder(Color.black.opacity(0.04), lineWidth: 1)
        )
        .shadow(color: BUColor.midnight.opacity(0.06), radius: 14, x: 0, y: 6)
    }

    @ViewBuilder
    private var summaryChipRow: some View {
        HStack(spacing: 8) {
            summaryChip(text: "진행률 \(percent)%")
            summaryChip(text: "완료 \(completedCount) / \(totalCount)")
            summaryChip(text: cluster.displayName)
            Spacer(minLength: 0)
        }
    }

    private func summaryChip(text: String) -> some View {
        Text(text)
            .font(.system(size: 11.5, weight: .semibold))
            .tracking(-0.1)
            .foregroundStyle(BUColor.midnight)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(BUColor.midnight.opacity(0.06), in: Capsule())
            .fixedSize()
    }

    private var stageRail: some View {
        VStack(spacing: 10) {
            stageRailCard(
                label: "지금",
                title: currentStage?.titleKo ?? "준비 단계",
                body: currentStage?.descriptionKo ?? "업종을 선택하면 첫 단계가 시작됩니다.",
                isCurrent: true
            )
            stageRailCard(
                label: "다음",
                title: nextStage?.titleKo ?? "다음 단계 준비 중",
                body: nextStage?.descriptionKo ?? "현재 단계를 마치면 다음 흐름이 열립니다.",
                isCurrent: false
            )
        }
    }

    private func stageRailCard(label: String, title: String, body: String, isCurrent: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label)
                .font(.system(size: 10.5, weight: .heavy))
                .tracking(0.8)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.midnight.opacity(isCurrent ? 1.0 : 0.6))
            Text(title)
                .font(.system(size: isCurrent ? 17 : 15, weight: isCurrent ? .bold : .semibold))
                .tracking(-0.34)
                .foregroundStyle(BUColor.ink)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            Text(body)
                .font(.system(size: 12.5, weight: .regular))
                .foregroundStyle(BUColor.inkMuted.opacity(0.85))
                .lineSpacing(2)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(isCurrent
                      ? Color.white.opacity(0.92)
                      : Color.white.opacity(0.58))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(
                    isCurrent
                        ? BUColor.midnight.opacity(0.12)
                        : Color.black.opacity(0.04),
                    lineWidth: 1
                )
        )
    }

    private var completionBanner: some View {
        HStack(alignment: .center, spacing: 12) {
            ZStack {
                Circle()
                    .fill(BUColor.midnight)
                    .frame(width: 36, height: 36)
                Image(systemName: "checkmark")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("\(totalCount)단계 모두 완료")
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                Text("창업 준비가 완료되었습니다")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(BUColor.midnight.opacity(0.06))
        )
    }

    // MARK: - Roadmap Signal Card

    private var roadmapSignalCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Title + 큰 % 우측
            HStack(alignment: .top, spacing: 12) {
                Text("로드맵 시그널")
                    .font(.system(size: 13, weight: .heavy))
                    .tracking(-0.2)
                    .foregroundStyle(BUColor.ink)

                Spacer(minLength: 0)

                HStack(alignment: .firstTextBaseline, spacing: 1) {
                    Text("\(percent)")
                        .font(.system(size: 36, weight: .heavy))
                        .tracking(-1.8)
                        .foregroundStyle(BUColor.ink)
                        .monospacedDigit()
                    Text("%")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                }
                .lineLimit(1)
            }

            // Segmented progress bar (RoadmapView 패턴 미러)
            segmentedProgress

            // 2x2 미니 그리드
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    miniMetric(label: "현재 단계", value: currentStage?.titleKo ?? "—")
                    miniMetric(label: "다음 흐름", value: nextStage?.titleKo ?? "정리 완료")
                }
                HStack(spacing: 8) {
                    miniMetric(label: "진행률",   value: "\(percent)%")
                    miniMetric(label: "완료",     value: "\(completedCount) / \(totalCount)")
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(Color.black.opacity(0.04), lineWidth: 1)
        )
    }

    private var segmentedProgress: some View {
        HStack(spacing: 3) {
            ForEach(0..<max(totalCount, 1), id: \.self) { i in
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(barColor(at: i))
                    .frame(height: 4)
                    .animation(.easeOut(duration: 0.4), value: completedCount)
            }
        }
    }

    private func barColor(at index: Int) -> Color {
        if index < completedCount {
            return BUColor.midnight
        } else if index == completedCount {
            return BUColor.midnight.opacity(0.3)
        } else {
            return BUColor.midnight.opacity(0.05)
        }
    }

    private func miniMetric(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10.5, weight: .semibold))
                .tracking(0.4)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.75))
            Text(value)
                .font(.system(size: 13.5, weight: .semibold))
                .tracking(-0.2)
                .foregroundStyle(BUColor.ink)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white.opacity(0.62))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Color.black.opacity(0.03), lineWidth: 1)
        )
    }

    // MARK: - Founder Snapshot Card

    private var founderSnapshotCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("사장님 정보")
                .font(.system(size: 13, weight: .heavy))
                .tracking(-0.2)
                .foregroundStyle(BUColor.ink)

            VStack(spacing: 0) {
                miniRow(label: "세부 업종", value: cluster.displayName, isFirst: true)
                miniRow(label: "창업 형태", value: startupTypeLabel)
                miniRow(label: "자본금",   value: capitalLabel)
                miniRow(label: "오픈 시점", value: openDateLabel)
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(Color.black.opacity(0.04), lineWidth: 1)
        )
    }

    private func miniRow(label: String, value: String, isFirst: Bool = false) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(label)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
            Spacer(minLength: 8)
            Text(value)
                .font(.system(size: 13, weight: .semibold))
                .tracking(-0.1)
                .foregroundStyle(BUColor.ink)
                .multilineTextAlignment(.trailing)
                .lineLimit(2)
        }
        .padding(.vertical, 11)
        .overlay(alignment: .top) {
            if !isFirst {
                Rectangle()
                    .fill(Color.black.opacity(0.05))
                    .frame(height: 0.5)
            }
        }
    }

    // MARK: - Founder data formatting

    /// 창업 형태 — roadmap decisions["startup-type"].inputs["startupType"] 에 저장된 raw 키 매핑.
    private var startupTypeLabel: String {
        guard let raw = roadmapStore.input("startup-type", key: "startupType"), !raw.isEmpty else {
            return "미정"
        }
        switch raw {
        case "individual", "sole": return "개인사업자"
        case "corporation", "corp": return "법인"
        case "franchise":           return "프랜차이즈"
        case "nonStore", "no-store": return "무점포"
        default:                     return raw
        }
    }

    private var capitalLabel: String {
        guard let raw = roadmapStore.input("budget-setup", key: "startupWon"),
              let won = Int(raw), won > 0 else {
            return "미정"
        }
        // 1억 이상 → "X.X억", 1천만 이상 → "X천만원", 그 외 raw
        if won >= 100_000_000 {
            let eok = Double(won) / 100_000_000
            return String(format: "%.1f억", eok)
        }
        if won >= 10_000_000 {
            let cheonman = won / 10_000_000
            return "\(cheonman)천만원"
        }
        return "\(won.formatted())원"
    }

    private var openDateLabel: String {
        guard let raw = roadmapStore.input("budget-setup", key: "openDateId"), !raw.isEmpty else {
            return "미정"
        }
        switch raw {
        case "asap", "now":         return "최대한 빨리"
        case "in-1-month", "1m":    return "1개월 이내"
        case "in-3-months", "3m":   return "3개월 이내"
        case "in-6-months", "6m":   return "6개월 이내"
        case "in-1-year", "1y":     return "1년 이내"
        case "undecided":           return "미정"
        default:                    return raw
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("PreLaunchHome — 첫 진입") {
    @Previewable @State var roadmap: RoadmapStore = {
        let s = RoadmapStore()
        s.pathProvider = { raw in
            let c = BusinessCluster(rawValue: raw) ?? .offlineFood
            return RoadmapSampleData.stageIds(for: c)
        }
        return s
    }()
    let dash = DashboardStore(
        dailyRepo: InMemoryDailyEntryRepository(seed: []),
        costsRepo: InMemoryMonthlyCostsRepository(seed: MonthlyCosts())
    )
    PreLaunchHomeView(store: dash, onOpenCurrentStage: {})
        .environment(roadmap)
}
#endif
