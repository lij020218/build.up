//
//  RoadmapView.swift — 로드맵 (iOS 네이티브, 웹 SSOT 시각 미러)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/surfaces/RoadmapSurface.tsx
//   ※ 이 파일은 웹과 동일한 시각 언어로 유지되어야 함:
//      1. 헤더 — eyebrow + 큰 타이틀 + 우측 큰 % 숫자
//      2. 진행 바 — 4px 연속 트랙 1개 (2026-08-06: 단계 수만큼 쪼갠 조각 → 연속 트랙)
//      3. 평면 stage 리스트 + 단일 수직 타임라인 (Phase 그룹 헤더 X)
//      4. 작은 12px 원형 노드 (current pulse)
//      5. 카드 표면은 디자인 시스템 토큰(cardGradient/heroGradient) — 흰색 하드코딩 금지
//      6. 현재 stage 카드 — 미드나잇 계열 hero 그라데이션 (2026-08-06: Aurora 무지개 블롭 제거)
//      7. stage 태그 칩 — 브랜드 네이비 단일 색 (2026-08-06: 단계별 무지개 색 제거)
//
//  cluster 별 총 단계 수:
//    offline-food: 21 / online-digital: 15 / startup-tech: 19 / 그 외: 22-23
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

// MARK: - Stage tags (웹 SSOT 미러)

/// 단계 태그 라벨. **색은 단계마다 다르게 주지 않는다** —
/// 종전에는 보라·파랑·분홍·청록이 뒤섞여(#7c3aed·#2563eb·#db2777·#0d9488)
/// 브랜드 토큰(미드나잇 네이비 + 라벤더) 밖의 무지개가 됐다 (2026-08-06 정리).
private let stageTagMap: [String: String] = [
    "budget-setup":          "재무 시뮬레이션",
    "location-candidates":   "상권 분석",
    "contract-review":       "AI 계약 분석",
    "construction-setup":    "인테리어·집기",
    "vendor-setup":          "공급업체",
    "operations-setup":      "배달·SNS",
    "pre-launch":            "소프트오픈",
    "tax-guide":             "절세 가이드",
    "loan-guide":            "자금조달·지원사업",
    "venture-certification": "벤처인증",
    "launch-gtm":            "GTM 전략",
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

    /// 로드맵 스냅샷 — body 당 1회 계산 (stages 배열 + 파생 카운트). 성능 2026-08-19:
    ///   종전엔 header/progress/timeline 이 각각 `stages` computed 를 재호출해 path 를 3~4회 재구성했다.
    private struct Snapshot {
        let stages: [RoadmapStage]
        let completedCount: Int
        var totalCount: Int { stages.count }
        var percent: Int {
            totalCount > 0 ? Int((Double(completedCount) / Double(totalCount)) * 100) : 0
        }
    }

    private func makeSnapshot() -> Snapshot {
        let stages = RoadmapSampleData.stages(for: cluster) { stageId in
            switch store.status(for: stageId) {
            case .completed: return .completed
            case .current:   return .current
            case .upcoming:  return .upcoming
            }
        }
        return Snapshot(stages: stages, completedCount: stages.filter { $0.status == .completed }.count)
    }

    public init() {}

    public var body: some View {
        // 2026-05-19 사장님 결정: stage 는 sheet 가 아니라 navigation push.
        //   RoadmapView 가 NavigationStack 을 제공 → StageRow 는 NavigationLink 로 push.
        //   로드맵 과정 중에 stage 가 중심이라 popup 보다는 화면 전환이 자연스러움.
        let snap = makeSnapshot()
        NavigationStack(path: $stagePath) {
            // ⚠️ 2026-08-06 되돌림: NavigationStack 은 자체 불투명 배경을 칠하므로
            //   MobileShell 의 풀스크린 Aurora 가 가려져 로드맵만 흰 화면이 됐다.
            //   (2026-05-25 에 "중복"이라 판단해 지웠던 것이 원인.)
            //   2026-08-19: Aurora 는 정적 래스터(1회)라 여기 1장 추가는 저비용 — 홈과 동일 룩 유지.
            ZStack {
                BUBackgroundSurface()
                    .ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        // ── 공통 페이지 헤더 (2026-08-19 통일): 타이틀 "로드맵" + 진행 한 줄 + 업종 그리드 버튼
                        //    accessory = 업종 컨텍스트 행 + 진행 바 ──
                        BUPageHeader(
                            title: "로드맵",
                            subtitle: progressLine(snap),
                            trailing: {
                                BUHeaderIconButton(systemName: "square.grid.2x2", accessibilityLabel: "업종 변경") {
                                    showClusterPicker = true
                                }
                            },
                            accessory: { headerAccessory(snap) }
                        )
                        .padding(.bottom, 6)

                        // ── 평면 stage 리스트 + 수직 타임라인 ──
                        timeline(snap)
                            .padding(.horizontal, BUSpacing.md)

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                }
            }
            .onAppear { store.setCluster(clusterRaw) }
            .onChange(of: clusterRaw) { _, new in store.setCluster(new) }
            // 센터 내비 타이틀·툴바 제거 — 타이틀은 BUPageHeader 하나만 (2026-08-19).
            //   push 된 stage 화면은 자체 navigationTitle 을 유지하므로 루트에서만 숨긴다.
            #if os(iOS)
            .toolbar(.hidden, for: .navigationBar)
            #endif
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
            #if DEBUG
            // 디자인 검증용 — BU_DEMO_STAGE=startup-type 이면 해당 stage 로 자동 push.
            //   SIMCTL_CHILD_BU_DEMO_STAGE=startup-type xcrun simctl launch ...
            .onAppear {
                if let demoStage = ProcessInfo.processInfo.environment["BU_DEMO_STAGE"],
                   !demoStage.isEmpty, stagePath.isEmpty {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        stagePath = [demoStage]
                    }
                }
            }
            #endif
        }
        // 단계 상세 push 중 쉘 하단 탭바 숨김 — 탭바가 '다음 단계로' CTA 를 가리던 문제 (2026-08-19)
        .preference(key: BUHideBottomTabsKey.self, value: !stagePath.isEmpty)
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

    // MARK: - Header (BUPageHeader subtitle + accessory)

    /// 진행 한 줄 — "음식점·카페·소매 · 21/21 완료" (시작 전엔 "· 21단계 · 시작 전").
    private func progressLine(_ snap: Snapshot) -> String {
        let progress = snap.completedCount > 0
            ? "\(snap.completedCount)/\(snap.totalCount) 완료 · \(snap.percent)%"
            : "\(snap.totalCount)단계 · 시작 전"
        return "\(cluster.displayName) · \(progress)"
    }

    /// accessory — 업종 변경 캡슐 + (있으면) D-day 칩 / AI 인수인계 안내 + 진행 바.
    private func headerAccessory(_ snap: Snapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
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

                // 목표 오픈 D-day — budget-setup 결정 inputs.targetOpenDate (웹 RoadmapSurface 미러).
                //   과거·비정상 날짜는 미표시 (카운트다운 위조 금지).
                if let dday = openDday {
                    Text(dday.diff == 0 ? "오늘이 목표 오픈일" : "목표 오픈 D-\(dday.diff) · \(dday.label)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 9).padding(.vertical, 5)
                        .background(BUColor.midnight.opacity(0.07), in: Capsule())
                        .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.14), lineWidth: 1))
                }
                Spacer(minLength: 0)
            }

            if showAiHandoffHint {
                Text("AI가 기획 단계를 채워뒀어요 — 다음 단계부터 확인만 하며 이어가면 됩니다.")
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }

            // 세그먼트 진행 바 (헤더 아래 accessory 유지)
            segmentedProgress(snap)
        }
    }

    /// AI 인수인계 안내 — 웹 RoadmapSurface 미러: aiGenerated 프리필이 있고 예산 단계가
    /// 아직 미완료일 때만 ("왜 앞이 ✓인지" 설명, 사용자가 예산을 완료하면 자동 소멸).
    private var showAiHandoffHint: Bool {
        guard let d = store.decisions["budget-setup"] else { return false }
        return d.inputs["aiGenerated"] == "true" && d.completedAt == nil
    }

    /// 웹 RoadmapSurface openDday 와 동일 규칙: 로컬 파싱, 0~730일 범위만.
    private var openDday: (diff: Int, label: String)? {
        guard let raw = store.decisions["budget-setup"]?.inputs["targetOpenDate"] else { return nil }
        let parts = raw.prefix(10).split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        var comps = DateComponents(); comps.year = parts[0]; comps.month = parts[1]; comps.day = parts[2]
        let cal = Calendar.current
        guard let target = cal.date(from: comps) else { return nil }
        let today = cal.startOfDay(for: Date())
        let diff = cal.dateComponents([.day], from: today, to: cal.startOfDay(for: target)).day ?? -1
        guard diff >= 0, diff <= 730 else { return nil }
        return (diff, "\(parts[1])월 \(parts[2])일")
    }

    // MARK: - Segmented progress bar

    /// 연속 트랙 하나. 종전에는 단계 수만큼(오프라인 21칸) 조각을 늘어놨는데,
    /// 진행 0일 때 회색 부스러기처럼 보이고 단계가 많을수록 지저분했다 (2026-08-06 정리).
    private func segmentedProgress(_ snap: Snapshot) -> some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(BUColor.midnight.opacity(0.08))
                Capsule()
                    .fill(BUColor.midnight)
                    .frame(width: max(snap.completedCount > 0 ? 8 : 0,
                                      geo.size.width * CGFloat(snap.completedCount) / CGFloat(max(1, snap.totalCount))))
                    .animation(.easeOut(duration: 0.4), value: snap.completedCount)
            }
        }
        .frame(height: 4)
    }

    // MARK: - Timeline (평면 리스트 + 단일 vertical line)

    private func timeline(_ snap: Snapshot) -> some View {
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
                let currentIdx = snap.stages.firstIndex { $0.status == .current }
                ForEach(Array(snap.stages.enumerated()), id: \.element.id) { idx, stage in
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
    private var tag: String? { stageTagMap[stage.id] }

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
                        Text(tag)
                            .font(.system(size: 10, weight: .semibold))
                            .tracking(0.2)
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 3)
                            .background(BUColor.midnight.opacity(0.06), in: Capsule())
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
            .padding(.vertical, isCurrent ? 22 : (isCompleted || isLockedFuture ? 14 : 18))
        }
        // 노드 (수직선 위에 떠있는 점)
        .overlay(alignment: .topLeading) {
            node
                .offset(x: -24, y: 20)  // web: left:-24px, top:20px
        }
        .padding(.bottom, isCurrent ? 12 : 8)
        // 종전엔 카드 전체를 0.55 로 흐려 글자까지 뿌옇게 죽었다.
        //   → 표면·여백·글자색으로 위계를 만들고 불투명도는 건드리지 않는다 (2026-08-06).
    }

    @ViewBuilder
    private var background: some View {
        // 2026-08-06 정리: 종전 현재 단계 카드는 AuroraGradientLayer(하늘색·보라·초록 블롭)를
        //   깔아 카드 하나가 무지개로 보였고, 나머지 카드는 흰색 불투명(0.72/0.48)이라
        //   라벤더 배경 위에 흰 판이 이어 붙은 화면이 됐다.
        //   → 디자인 시스템 토큰(hero/card 그라데이션, 미드나잇 네이비) 한 계열로 통일.
        if isCurrent {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [BUColor.heroGradientMid, BUColor.heroGradientEnd],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(BUColor.midnight.opacity(0.16), lineWidth: 1)
                )
                .shadow(color: BUColor.midnight.opacity(0.08), radius: 14, x: 0, y: 5)
        } else if isCompleted {
            // 완료 = 가장 조용하게. 배경(라벤더 미스트)이 그대로 비쳐야 흰 판처럼 보이지 않는다.
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(BUColor.cardGradientTop.opacity(0.34))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1)
                )
        } else if isLockedFuture {
            // 아직 잠긴 먼 단계 — 가장 가볍게. 목록이 흰 판의 반복으로 보이지 않게 한다.
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(BUColor.cardGradientTop.opacity(0.26))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(BUColor.midnight.opacity(0.05), lineWidth: 1)
                )
        } else {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [BUColor.cardGradientTop.opacity(0.58), BUColor.cardGradientBottom.opacity(0.52)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(BUColor.midnight.opacity(0.08), lineWidth: 1)
                )
        }
    }

    private var titleColor: Color {
        if isCurrent { return BUColor.ink }
        if isCompleted { return Color(white: 0.45) }
        // 잠금 단계는 카드 전체를 흐리는 대신 글자만 한 단계 낮춘다 (가독성 유지).
        if isLockedFuture { return BUColor.ink.opacity(0.55) }
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
    // 현재 클러스터 경로(stageId 순서) — 주입되면 단계 번호를 경로 위치 기준으로 계산.
    @Environment(\.roadmapStageOrder) private var stageOrder

    /// 경로 내 위치 기반 단계 번호. path 에 없으면 nil → 숫자 라벨 숨김(잘못된 전역 번호 표시 금지).
    private var resolvedStepLabel: String? {
        guard let idx = stageOrder.firstIndex(of: stage.id) else { return nil }
        return "\(idx + 1)단계"
    }

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
        .navigationTitle(resolvedStepLabel ?? stage.titleKo)
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



/// 단계 상세가 push 된 동안 쉘의 하단 탭바를 숨기는 신호 (2026-08-19 심사 전 실렌더: 탭바가 "다음 단계로" CTA 를 가림)
struct BUHideBottomTabsKey: PreferenceKey {
    static let defaultValue: Bool = false
    static func reduce(value: inout Bool, nextValue: () -> Bool) { value = value || nextValue() }
}
