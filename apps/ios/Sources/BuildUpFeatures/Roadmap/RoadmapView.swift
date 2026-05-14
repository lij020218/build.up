//
//  RoadmapView.swift — path-aware 로드맵 모바일 화면 (웹 SSOT 미러)
//
//  ⚠️ 웹 SSOT: packages/shared/src/roadmap/workflow.ts
//   웹은 46개 stage 풀에서 사장님 cluster 의 reachable stage 만 노출.
//   path 길이 — offline=15, online=12, startup-tech=14, semiconductor=22.
//   현재 모바일은 외식 path 17 단계 기본 (target-customer + menu-design 신규 포함).
//   RoadmapSampleData 참조.
//
//  모바일 디자인 결정:
//   • 수직 timeline (좌측 진행 line + 단계 dot)
//   • 단계별 카드 — 완료 (faded) / 진행 중 (강조 + Liquid Glass hero) / 예정 (dim)
//   • 단계 그룹 (Phase) 별 sticky header
//   • 진행도 상단 banner — "X / 17 완료 (%)"
//
//  웹과 차이:
//   • 가로 phase 탭 → 모바일 vertical 스크롤
//   • 클릭 시 단계 상세 sheet
//   • 한 화면에 보이는 단계 ~3-4개 (모바일 viewport 고려)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

// MARK: - RoadmapView

public struct RoadmapView: View {

    let stages: [RoadmapStage]

    public init(stages: [RoadmapStage] = RoadmapSampleData.stages) {
        self.stages = stages
    }

    private var progress: (completed: Int, total: Int) {
        (
            completed: stages.filter { $0.status == .completed }.count,
            total: stages.count
        )
    }

    private var groupedByPhase: [(StagePhase, [RoadmapStage])] {
        StagePhase.allCases.map { phase in
            (phase, stages.filter { $0.phase == phase })
        }
    }

    public var body: some View {
        ZStack {
            BUBackgroundSurface()

            ScrollView {
                LazyVStack(alignment: .leading, spacing: BUSpacing.cardGap, pinnedViews: [.sectionHeaders]) {

                    // ── 상단 진행도 banner ──
                    ProgressBanner(
                        completed: progress.completed,
                        total: progress.total
                    )
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.md)

                    // ── Phase 별 섹션 ──
                    ForEach(groupedByPhase, id: \.0) { (phase, phaseStages) in
                        if !phaseStages.isEmpty {
                            Section {
                                ForEach(phaseStages) { stage in
                                    StageCard(stage: stage)
                                        .padding(.horizontal, BUSpacing.md)
                                }
                            } header: {
                                PhaseHeader(phase: phase, stages: phaseStages)
                            }
                        }
                    }

                    Spacer(minLength: BUSpacing.xxxl)
                }
            }
        }
        .navigationTitle("로드맵")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
    }
}

// MARK: - Progress banner

private struct ProgressBanner: View {

    let completed: Int
    let total: Int

    private var percent: Double { total > 0 ? Double(completed) / Double(total) : 0 }

    var body: some View {
        BUCard(.hero) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("내 진행도")

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text("\(completed)")
                        .buHeroNumberStyle(color: BUColor.midnightDeep)
                    Text("/ \(total) 단계")
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(BUColor.inkMuted)
                }

                // 진행 바
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(BUColor.midnight.opacity(0.08))
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [BUColor.midnight, BUColor.midnight.opacity(0.7)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geo.size.width * percent)
                    }
                }
                .frame(height: 8)
                .padding(.top, 4)

                Text("\(Int(percent * 100))% 완료 · 한 걸음씩, 같이 만들어 가요")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
            }
        }
    }
}

// MARK: - Phase header (sticky)

private struct PhaseHeader: View {
    let phase: StagePhase
    let stages: [RoadmapStage]

    private var completed: Int {
        stages.filter { $0.status == .completed }.count
    }

    var body: some View {
        HStack(spacing: BUSpacing.xs) {
            BUTagBadge(phase.labelKo, style: .solid)
            Text(phase.subtitleKo)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkSecondary)
            Spacer()
            Text("\(completed)/\(stages.count)")
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)
                .monospacedDigit()
        }
        .padding(.horizontal, BUSpacing.md)
        .padding(.vertical, BUSpacing.sm)
        .background(BUColor.surface.opacity(0.95))
        .background(.ultraThinMaterial)
    }
}

// MARK: - StageCard

private struct StageCard: View {

    let stage: RoadmapStage

    @State private var showDetail = false

    private var statusTint: Color {
        switch stage.status {
        case .completed: return BUColor.success
        case .current:   return BUColor.midnight
        case .upcoming:  return BUColor.inkMuted
        }
    }

    private var statusLabel: String {
        switch stage.status {
        case .completed: return "완료"
        case .current:   return "진행 중"
        case .upcoming:  return "예정"
        }
    }

    var body: some View {
        Button {
            showDetail = true
        } label: {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                // 좌측 timeline dot + line
                timelineColumn

                // 우측 콘텐츠 카드
                contentCard
            }
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showDetail) {
            StageDetailSheet(stage: stage)
        }
    }

    // 좌측 dot + 세로 line
    private var timelineColumn: some View {
        VStack(spacing: 0) {
            // dot
            ZStack {
                Circle()
                    .fill(BUColor.surfaceElevated)
                    .frame(width: 28, height: 28)
                    .overlay(
                        Circle().strokeBorder(statusTint.opacity(stage.status == .upcoming ? 0.25 : 0.6), lineWidth: 2)
                    )
                statusIcon
            }
            // line (마지막 단계 제외)
            Rectangle()
                .fill(statusTint.opacity(0.15))
                .frame(width: 2)
                .frame(maxHeight: .infinity)
        }
        .frame(width: 28)
    }

    @ViewBuilder
    private var statusIcon: some View {
        switch stage.status {
        case .completed:
            Image(systemName: "checkmark")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(BUColor.success)
        case .current:
            Circle()
                .fill(BUColor.midnight)
                .frame(width: 10, height: 10)
        case .upcoming:
            Text("\(stage.stepNumber)")
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)
                .monospacedDigit()
        }
    }

    private var contentCard: some View {
        BUCard(stage.status == .current ? .hero : .card, tint: stage.status == .current ? statusTint : nil) {
            VStack(alignment: .leading, spacing: 6) {
                // 단계 번호 + 상태
                HStack(spacing: BUSpacing.xs) {
                    Text("단계 \(stage.stepNumber)")
                        .font(BUFont.eyebrow)
                        .foregroundStyle(BUColor.inkMuted)
                        .tracking(0.5)
                    Spacer()
                    if stage.status == .current {
                        BUTagBadge(statusLabel, style: .solid, tint: BUColor.midnight)
                    }
                    if stage.status == .completed {
                        BUTagBadge(statusLabel, style: .soft, tint: BUColor.success)
                    }
                }

                // 제목
                Text(stage.titleKo)
                    .font(BUFont.cardTitleSmall)
                    .foregroundStyle(stage.status == .upcoming ? BUColor.inkMuted : BUColor.ink)
                    .strikethrough(stage.status == .completed, color: BUColor.inkSubtle)

                // 설명 (current 만 노출)
                if stage.status == .current {
                    Text(stage.descriptionKo)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .padding(.top, 2)
                }

                // 예상 일수 + chevron
                if let days = stage.estimatedDays {
                    HStack(spacing: BUSpacing.xs) {
                        Image(systemName: "clock")
                            .font(.system(size: 10))
                        Text("예상 \(days)일")
                            .font(BUFont.eyebrow)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.inkSubtle)
                    }
                    .foregroundStyle(BUColor.inkMuted)
                    .padding(.top, 2)
                }
            }
        }
        .opacity(stage.status == .upcoming ? 0.65 : 1.0)
    }
}

// MARK: - Stage detail sheet

private struct StageDetailSheet: View {
    let stage: RoadmapStage
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        VStack(alignment: .leading, spacing: BUSpacing.xs) {
                            BUEyebrow("\(stage.phase.labelKo) · 단계 \(stage.stepNumber)")
                            Text(stage.titleKo)
                                .font(.system(size: 28, weight: .bold))
                                .foregroundStyle(BUColor.midnightDeep)
                                .tracking(-0.5)
                                .lineSpacing(4)
                        }

                        BUCard(.card) {
                            Text(stage.descriptionKo)
                                .font(BUFont.body)
                                .foregroundStyle(BUColor.ink)
                                .lineSpacing(5)
                        }

                        if let days = stage.estimatedDays {
                            HStack(spacing: BUSpacing.sm) {
                                Image(systemName: "clock.arrow.circlepath")
                                    .font(.system(size: 24))
                                    .foregroundStyle(BUColor.midnight)
                                VStack(alignment: .leading) {
                                    Text("예상 기간")
                                        .buEyebrowStyle()
                                    Text("\(days)일")
                                        .font(BUFont.cardTitleSmall)
                                        .foregroundStyle(BUColor.ink)
                                }
                            }
                            .padding(BUSpacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.lg, style: .continuous))
                        }

                        Spacer(minLength: 0)
                    }
                    .padding(BUSpacing.md)
                }
            }
            .navigationTitle("단계 상세")
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
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Roadmap — 외식 17단계") {
    NavigationStack {
        RoadmapView()
    }
}

#Preview("Roadmap — Dark") {
    NavigationStack {
        RoadmapView()
    }
    .preferredColorScheme(.dark)
}
#endif
