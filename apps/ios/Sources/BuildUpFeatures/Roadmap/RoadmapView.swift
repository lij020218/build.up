//
//  RoadmapView.swift — 로드맵 (iOS 네이티브, 웹 SSOT 시각 미러)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/surfaces/RoadmapSurface.tsx
//   ※ 이 파일은 웹과 동일한 시각 언어로 유지되어야 함:
//      1. 헤더 — eyebrow + 큰 타이틀 + 우측 큰 % 숫자
//      2. 세그먼트 진행 바 — 단계 수만큼 4px 얇은 바
//      3. 평면 stage 리스트 + 단일 수직 타임라인 (Phase 그룹 헤더 X)
//      4. 작은 12px 원형 노드 (current pulse)
//      5. 반투명 화이트 카드 + 20px radius
//      6. 현재 stage 카드 — Aurora 그라데이션
//      7. stage 별 색상 태그 칩
//
//  cluster 별 총 단계 수:
//    offline-food: 21 / online-digital: 15 / startup-tech: 19 / 그 외: 22-23
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

// MARK: - Stage tag colors (웹 SSOT 미러)

private let stageTagMap: [String: (label: String, color: Color)] = [
    "budget-setup":          ("재무 시뮬레이션", Color(red: 0.486, green: 0.227, blue: 0.929)),  // #7c3aed
    "location-candidates":   ("상권 분석",       Color(red: 0.149, green: 0.388, blue: 0.922)),  // #2563eb
    "contract-review":       ("AI 계약 분석",    Color(red: 0.486, green: 0.227, blue: 0.929)),
    "construction-setup":    ("인테리어·집기",   Color(red: 0.851, green: 0.467, blue: 0.024)),  // #d97706
    "vendor-setup":          ("공급업체",         Color(red: 0.020, green: 0.588, blue: 0.412)),  // #059669
    "operations-setup":      ("배달·SNS",         Color(red: 0.859, green: 0.157, blue: 0.467)),  // #db2777
    "pre-launch":            ("소프트오픈",       Color(red: 0.918, green: 0.345, blue: 0.047)),  // #ea580c
    "tax-guide":             ("절세 가이드",      Color(red: 0.051, green: 0.600, blue: 0.533)),  // #0d9488
    "loan-guide":            ("자금조달·지원사업", Color(red: 0.020, green: 0.588, blue: 0.412)),
    "venture-certification": ("벤처인증",         Color(red: 0.020, green: 0.588, blue: 0.412)),
    "launch-gtm":            ("GTM 전략",         Color(red: 0.859, green: 0.157, blue: 0.467)),
]

// MARK: - RoadmapView

public struct RoadmapView: View {

    @AppStorage("roadmap.cluster") private var clusterRaw = BusinessCluster.offlineFood.rawValue
    @State private var showClusterPicker = false
    /// Stage push 체인 (wizard mode). 첫 stage 는 stagePath[0], "다음 단계로" 누르면 stagePath.append(nextStageId).
    @State private var stagePath: [String] = []
    /// AppRoot 에서 환경 주입된 전역 store — 다른 surface 와 공유 (TodayView·CurrentStageView 등).
    @Environment(RoadmapStore.self) private var store

    private var cluster: BusinessCluster {
        BusinessCluster(rawValue: clusterRaw) ?? .offlineFood
    }

    private var stages: [RoadmapStage] {
        RoadmapSampleData.stages(for: cluster) { stageId in
            switch store.status(for: stageId) {
            case .completed: return .completed
            case .current:   return .current
            case .upcoming:  return .upcoming
            }
        }
    }

    public init() {}

    private var completedCount: Int { stages.filter { $0.status == .completed }.count }
    private var totalCount: Int     { stages.count }
    private var percent: Int {
        totalCount > 0 ? Int((Double(completedCount) / Double(totalCount)) * 100) : 0
    }

    public var body: some View {
        // 2026-05-19 사장님 결정: stage 는 sheet 가 아니라 navigation push.
        //   RoadmapView 가 NavigationStack 을 제공 → StageRow 는 NavigationLink 로 push.
        //   로드맵 과정 중에 stage 가 중심이라 popup 보다는 화면 전환이 자연스러움.
        NavigationStack(path: $stagePath) {
            ZStack {
                BUBackgroundSurface()
                    .onAppear { store.setCluster(clusterRaw) }
                    .onChange(of: clusterRaw) { _, new in store.setCluster(new) }

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        // ── 헤더: eyebrow + 타이틀 + 우측 큰 % ──
                        header
                            .padding(.horizontal, BUSpacing.md)
                            .padding(.top, BUSpacing.md)
                            .padding(.bottom, 12)

                        // ── 세그먼트 진행 바 ──
                        segmentedProgress
                            .padding(.horizontal, BUSpacing.md)
                            .padding(.bottom, 20)

                        // ── 평면 stage 리스트 + 수직 타임라인 ──
                        timeline
                            .padding(.horizontal, BUSpacing.md)

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                }
            }
            .navigationTitle("로드맵")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showClusterPicker = true
                    } label: {
                        Image(systemName: "square.grid.2x2")
                            .foregroundStyle(BUColor.midnight)
                    }
                }
                #endif
            }
            .sheet(isPresented: $showClusterPicker) {
                // 업종 선택은 진입 단계 (path 정의 자체를 바꿈) → sheet 유지.
                IndustrySelectionStageView()
            }
            // ── Wizard chain: 카드 탭 → stagePath.append → 자동 push ──
            //   "다음 단계로" 누르면 wizardOnAdvance 가 다음 stageId 를 path 에 추가하여
            //   바로 다음 stage 화면으로 전환 (로드맵 리스트로 복귀 X).
            .navigationDestination(for: String.self) { stageId in
                wizardStageView(for: stageId)
                    .environment(\.wizardOnAdvance, advanceClosure())
            }
        }
    }

    /// "다음 단계로" 클릭 시 호출:
    ///   • currentStageId 가 있고 path 에 없으면 push (wizard 진행)
    ///   • 없으면 path 전체 clear → 로드맵 리스트 복귀 (로드맵 끝)
    private func advanceClosure() -> () -> Void {
        return {
            if let next = store.currentStageId, !stagePath.contains(next) {
                stagePath.append(next)
            } else {
                stagePath.removeAll()
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(alignment: .top, spacing: BUSpacing.md) {
            VStack(alignment: .leading, spacing: 6) {
                Text("창업 로드맵")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(1.54)
                    .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                    .textCase(.uppercase)

                Text(cluster.displayName)
                    .font(.system(size: 28, weight: .bold))
                    .tracking(-1.12)
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(2)

                Button {
                    showClusterPicker = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: cluster.icon)
                            .font(.system(size: 11, weight: .semibold))
                        Text("업종 변경")
                            .font(.system(size: 11, weight: .semibold))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 9, weight: .bold))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 5)
                    .background(BUColor.midnight.opacity(0.06), in: Capsule())
                }
                .buttonStyle(.plain)
                .padding(.top, 2)
            }

            Spacer(minLength: 0)

            VStack(alignment: .trailing, spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: 1) {
                    Text("\(percent)")
                        .font(.system(size: 36, weight: .heavy))
                        .tracking(-1.8)
                        .foregroundStyle(BUColor.ink)
                        .monospacedDigit()
                    Text("%")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                }
                .lineLimit(1)
                Text("\(completedCount) / \(totalCount) 완료")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            }
        }
    }

    // MARK: - Segmented progress bar

    private var segmentedProgress: some View {
        HStack(spacing: 3) {
            ForEach(0..<totalCount, id: \.self) { i in
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

    // MARK: - Timeline (평면 리스트 + 단일 vertical line)

    private var timeline: some View {
        ZStack(alignment: .topLeading) {
            // 수직 라인 (web: linear-gradient primary → fade)
            // left:10px (paddingLeft:28px 기준), top:20px, bottom:20px
            GeometryReader { geo in
                LinearGradient(
                    colors: [BUColor.midnight, BUColor.midnight.opacity(0.08)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(width: 2)
                .offset(x: 10, y: 20)
                .frame(maxHeight: max(0, geo.size.height - 40))
            }

            VStack(alignment: .leading, spacing: 0) {
                let currentIdx = stages.firstIndex { $0.status == .current }
                ForEach(Array(stages.enumerated()), id: \.element.id) { idx, stage in
                    StageRow(
                        stage: stage,
                        index: idx,
                        store: store,
                        currentIndex: currentIdx
                    )
                }
            }
            .padding(.leading, 28)  // 노드 자리 확보
        }
    }
}

// MARK: - StageRow (웹 .roadmap-card 미러)

private struct StageRow: View {

    let stage: RoadmapStage
    let index: Int
    let store: RoadmapStore
    /// 사장님이 도달할 다음 단계 인덱스 (현재 단계의 index). nil 이면 잠금 표시 안 함.
    let currentIndex: Int?

    private var isCurrent:   Bool { stage.status == .current }
    private var isCompleted: Bool { stage.status == .completed }
    /// 미래 단계 (현재보다 2단계 이상 뒤) — 살짝 잠금 시각화. 다음 단계 1개는 잠금 X.
    private var isLockedFuture: Bool {
        guard stage.status == .upcoming, let curr = currentIndex else { return false }
        return index > curr + 1
    }
    private var tag: (label: String, color: Color)? { stageTagMap[stage.id] }

    var body: some View {
        // 2026-05-21: value-based NavigationLink — stageId 를 path 에 push.
        //   RoadmapView 의 NavigationStack(path: $stagePath) 가 받아서 wizard chain 으로 연결.
        //   "다음 단계로" 누르면 wizardOnAdvance 가 다음 stageId 를 같은 path 에 추가.
        NavigationLink(value: stage.id) {
            cardContent
        }
        .buttonStyle(.plain)
    }

    // MARK: - card

    private var cardContent: some View {
        ZStack(alignment: .topLeading) {
            // 카드 배경
            background

            VStack(alignment: .leading, spacing: 6) {
                // 상단 row: "X단계" eyebrow + status badge
                HStack(spacing: BUSpacing.xs) {
                    Text("\(index + 1)단계")
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(1.1)
                        .foregroundStyle(BUColor.midnight)
                        .textCase(.uppercase)
                    Spacer(minLength: 0)
                    rightStatusBadge
                }

                // 타이틀
                Text(stage.titleKo)
                    .font(.system(size: isCurrent ? 20 : 17, weight: isCurrent ? .bold : .semibold))
                    .tracking(-0.34)
                    .foregroundStyle(titleColor)
                    .lineSpacing(2)
                    .strikethrough(isCompleted && !isCurrent, color: BUColor.inkSubtle)
                    .multilineTextAlignment(.leading)

                // 태그 칩 (완료 X)
                if !isCompleted, let tag = tag {
                    HStack(spacing: 4) {
                        Text(tag.label)
                            .font(.system(size: 10, weight: .semibold))
                            .tracking(0.2)
                            .foregroundStyle(tag.color)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 3)
                            .background(tag.color.opacity(0.04), in: Capsule())
                    }
                }

                // goal (완료 X)
                if !isCompleted {
                    Text(stage.descriptionKo)
                        .font(.system(size: isCurrent ? 14 : 13, weight: .regular))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.85))
                        .lineSpacing(3)
                        .padding(.top, 2)
                        .multilineTextAlignment(.leading)
                }
            }
            .padding(.horizontal, isCurrent ? 24 : 20)
            .padding(.vertical, isCurrent ? 22 : (isCompleted ? 14 : 18))
        }
        // 노드 (수직선 위에 떠있는 점)
        .overlay(alignment: .topLeading) {
            node
                .offset(x: -24, y: 20)  // web: left:-24px, top:20px
        }
        .padding(.bottom, isCurrent ? 12 : 8)
        .opacity(isLockedFuture ? 0.55 : 1.0)
    }

    @ViewBuilder
    private var background: some View {
        if isCurrent {
            ZStack {
                // ── Aurora gradient blob (current 전용 — 웹 AuroraBackground 미러) ──
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.98),
                                Color(red: 0.961, green: 0.973, blue: 1.0).opacity(0.94),
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                AuroraGradientLayer()
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .opacity(0.85)
                    .allowsHitTesting(false)
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
            }
            .shadow(color: BUColor.midnight.opacity(0.06), radius: 12, x: 0, y: 4)
        } else if isCompleted {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color.white.opacity(0.48))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(Color.black.opacity(0.03), lineWidth: 1)
                )
        } else {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color.white.opacity(0.72))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(Color.black.opacity(0.04), lineWidth: 1)
                )
        }
    }

    private var titleColor: Color {
        if isCurrent { return BUColor.ink }
        if isCompleted { return Color(white: 0.45) }
        return BUColor.ink
    }

    // MARK: - node (left:-24, web 미러)

    @ViewBuilder
    private var node: some View {
        if isCurrent {
            Circle()
                .fill(BUColor.midnight)
                .frame(width: 12, height: 12)
                .overlay(
                    Circle()
                        .strokeBorder(BUColor.midnight.opacity(0.1), lineWidth: 4)
                        .scaleEffect(1.5)
                )
        } else if isCompleted {
            Circle()
                .fill(BUColor.midnight)
                .frame(width: 10, height: 10)
        } else {
            Circle()
                .fill(Color.white)
                .frame(width: 12, height: 12)
                .overlay(
                    Circle()
                        .strokeBorder(BUColor.midnight, lineWidth: 2)
                )
        }
    }

    // MARK: - right status badge

    @ViewBuilder
    private var rightStatusBadge: some View {
        if isCompleted {
            ZStack {
                Circle()
                    .fill(BUColor.midnight)
                    .frame(width: 14, height: 14)
                Image(systemName: "checkmark")
                    .font(.system(size: 8, weight: .heavy))
                    .foregroundStyle(.white)
            }
        } else if isCurrent {
            Text("현재")
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.4)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
        } else if isLockedFuture {
            HStack(spacing: 3) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 8, weight: .heavy))
                Text("잠금")
                    .font(.system(size: 9.5, weight: .heavy))
                    .tracking(0.3)
            }
            .foregroundStyle(BUColor.inkMuted.opacity(0.55))
            .padding(.horizontal, 7)
            .padding(.vertical, 2)
            .background(BUColor.inkMuted.opacity(0.06), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
        } else {
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(BUColor.inkSubtle)
        }
    }

}

// MARK: - Stage detail sheet (fallback)

// Fallback — stage view dispatch 에 매칭되는 게 없을 때.
// 2026-05-19: NavigationStack 제거 (RoadmapView 가 push).
private struct StageDetailSheet: View {
    let stage: RoadmapStage

    var body: some View {
        ZStack {
            BUBackgroundSurface()
            ScrollView {
                VStack(alignment: .leading, spacing: BUSpacing.lg) {
                    Text(stage.titleKo)
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .tracking(-0.5)
                    Text(stage.descriptionKo)
                        .font(.system(size: 15, weight: .regular))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(5)
                }
                .padding(BUSpacing.md)
            }
        }
        .navigationTitle("\(stage.stepNumber)단계")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Roadmap — 외식") {
    let store = RoadmapStore()
    store.pathProvider = { raw in
        let c = BusinessCluster(rawValue: raw) ?? .offlineFood
        return RoadmapSampleData.stageIds(for: c)
    }
    return NavigationStack { RoadmapView() }.environment(store)
}

#Preview("Roadmap — 기술 스타트업") {
    let store = RoadmapStore()
    store.pathProvider = { raw in
        let c = BusinessCluster(rawValue: raw) ?? .offlineFood
        return RoadmapSampleData.stageIds(for: c)
    }
    return NavigationStack { RoadmapView() }
        .environment(store)
        .onAppear { UserDefaults.standard.set("startup-tech", forKey: "roadmap.cluster") }
}
#endif

// MARK: - AuroraGradientLayer (현재 단계 강조 — 웹 AuroraBackground 미러)
//
// 3개 컬러 blob 을 비스듬히 배치 → blur 처리 → 카드 모양에 clip.
// 정적 (애니메이션 없음) — 모바일 성능 우선. 웹은 keyframes 로 흐르는 효과지만
// SwiftUI 에서 비싸므로 정적 그라데이션으로 동일 분위기 전달.
//

private struct AuroraGradientLayer: View {
    var body: some View {
        GeometryReader { proxy in
            ZStack {
                Circle()
                    .fill(Color(red: 0.353, green: 0.784, blue: 0.98))     // sky blue
                    .frame(width: proxy.size.width * 0.7, height: proxy.size.width * 0.7)
                    .blur(radius: 40)
                    .offset(x: -proxy.size.width * 0.25, y: -proxy.size.height * 0.25)
                Circle()
                    .fill(Color(red: 0.486, green: 0.227, blue: 0.929))     // purple
                    .frame(width: proxy.size.width * 0.6, height: proxy.size.width * 0.6)
                    .blur(radius: 50)
                    .offset(x: proxy.size.width * 0.3, y: proxy.size.height * 0.1)
                Circle()
                    .fill(Color(red: 0.20, green: 0.78, blue: 0.349))      // green
                    .frame(width: proxy.size.width * 0.5, height: proxy.size.width * 0.5)
                    .blur(radius: 45)
                    .offset(x: proxy.size.width * 0.1, y: proxy.size.height * 0.5)
            }
            .opacity(0.18)   // 카드 콘텐츠 가독성 우선
        }
    }
}
