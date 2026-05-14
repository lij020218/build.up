//
//  RoadmapView.swift — path-aware 로드맵 모바일 화면 (웹 SSOT 미러)
//
//  ⚠️ 웹 SSOT: packages/shared/src/roadmap/workflow.ts
//   웹은 46개 stage 풀에서 사장님 cluster 의 reachable stage 만 노출.
//   cluster 별 총 단계 수:
//     offline-food: 22 / online-digital: 15 / startup-tech: 19
//     hardware-iot: 22 / robotics-physical-ai: 22 / biotech-medtech: 22
//     semiconductor: 22 / climate-energy: 22
//
//  모바일 디자인 결정:
//   • 업종(cluster) 선택 → @AppStorage("roadmap.cluster") 저장
//   • 수직 timeline (좌측 진행 line + 단계 dot)
//   • 단계별 카드 — 완료 (faded) / 진행 중 (강조 + hero) / 예정 (dim)
//   • Phase 별 sticky header
//   • 상단 banner — "X / N 완료 (%)"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

// MARK: - RoadmapView

public struct RoadmapView: View {

    @AppStorage("roadmap.cluster") private var clusterRaw = BusinessCluster.offlineFood.rawValue
    @State private var showClusterPicker = false

    private var cluster: BusinessCluster {
        BusinessCluster(rawValue: clusterRaw) ?? .offlineFood
    }

    private var stages: [RoadmapStage] {
        RoadmapSampleData.stages(for: cluster)
    }

    public init() {}

    private var progress: (completed: Int, total: Int) {
        (
            completed: stages.filter { $0.status == .completed }.count,
            total: stages.count
        )
    }

    private var groupedByPhase: [(StagePhase, [RoadmapStage])] {
        StagePhase.allCases.compactMap { phase in
            let filtered = stages.filter { $0.phase == phase }
            return filtered.isEmpty ? nil : (phase, filtered)
        }
    }

    public var body: some View {
        ZStack {
            BUBackgroundSurface()

            ScrollView {
                LazyVStack(alignment: .leading, spacing: BUSpacing.cardGap, pinnedViews: [.sectionHeaders]) {

                    // 업종 선택 배너
                    ClusterBadge(cluster: cluster) {
                        showClusterPicker = true
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.md)

                    // 진행도 배너
                    ProgressBanner(
                        completed: progress.completed,
                        total: progress.total
                    )
                    .padding(.horizontal, BUSpacing.md)

                    // Phase 별 섹션
                    ForEach(groupedByPhase, id: \.0) { (phase, phaseStages) in
                        Section {
                            ForEach(phaseStages) { stage in
                                StageCard(stage: stage)
                                    .padding(.horizontal, BUSpacing.md)
                            }
                        } header: {
                            PhaseHeader(phase: phase, stages: phaseStages)
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
            IndustrySelectionStageView()
        }
    }
}

// MARK: - Cluster badge

private struct ClusterBadge: View {
    let cluster: BusinessCluster
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: BUSpacing.sm) {
                Image(systemName: cluster.icon)
                    .font(.system(size: 14)).foregroundStyle(BUColor.midnight)
                Text(cluster.displayName)
                    .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                Spacer()
                Text("업종 변경")
                    .font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkSubtle)
            }
            .padding(BUSpacing.sm)
            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
        }
        .buttonStyle(.plain)
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
                timelineColumn
                contentCard
            }
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showDetail) {
            stageSheet
        }
    }

    // MARK: - stageSheet dispatch (웹 stageId → native view)

    @ViewBuilder
    private var stageSheet: some View {
        switch stage.id {
        // ── 공통 준비 (Shared) ──
        case "industry-selection":
            IndustrySelectionStageView()
        case "startup-type":
            StartupTypeStageView()
        case "business-model":
            BusinessModelStageView()
        case "target-customer-definition":
            TargetCustomerStageView()
        case "budget-setup":
            BudgetSetupStageView()

        // ── Offline (외식·카페·소매) ──
        case "permit-check":
            PermitCheckStageView()
        case "location-candidates":
            LocationCandidatesStageView()
        case "contract-review":
            ContractReviewStageView()
        case "registration-setup":
            RegistrationSetupStageView()
        case "biz-registration":
            BizRegistrationStageView()
        case "construction-setup":
            ConstructionSetupStageView()
        case "menu-design":
            MenuDesignStageView()
        case "vendor-setup":
            VendorSetupStageView()
        case "hiring-setup":
            HiringSetupStageView()
        case "insurance-tax-setup":
            InsuranceTaxSetupStageView()
        case "operations-setup":
            OperationsSetupStageView()
        case "pre-launch":
            PreLaunchStageView()

        // ── Online Digital ──
        case "platform-setup":
            PlatformSetupStageView()
        case "online-registration":
            OnlineRegistrationStageView()
        case "sourcing-setup":
            SourcingSetupStageView()
        case "store-setup":
            StoreSetupStageView()
        case "online-marketing":
            OnlineMarketingStageView()

        // ── Startup-Tech (SaaS) ──
        case "startup-foundation":
            StartupFoundationStageView()
        case "customer-discovery":
            CustomerDiscoveryStageView()
        case "company-setup":
            CompanySetupStageView()
        case "mvp-build":
            MvpBuildStageView()
        case "launch-gtm":
            LaunchGtmStageView()
        case "go-live":
            GoLiveStageView()
        case "growth-engine":
            GrowthEngineStageView()
        case "fundraising-readiness":
            FundraisingReadinessStageView()
        case "venture-certification":
            VentureCertificationStageView()

        // ── Hardware-IoT ──
        case "hardware-prototype":
            HardwarePrototypeStageView()
        case "bom-supply-chain":
            BomSupplyChainStageView()
        case "certification-kc-ce":
            CertificationKcCeStageView()
        case "manufacturing-partner":
            ManufacturingPartnerStageView()

        // ── Lab (Robotics / Biotech) ──
        case "lab-setup":
            LabSetupStageView()
        case "prototype-iteration":
            PrototypeIterationStageView()
        case "field-or-clinical-test":
            FieldOrClinicalTestStageView()
        case "regulatory-submission":
            RegulatorySubmissionStageView()

        // ── Semiconductor / Climate-Energy ──
        case "eda-tooling-setup":
            EdaToolingSetupStageView()
        case "mpw-or-pilot-tape-out":
            MpwOrPilotTapeOutStageView()
        case "packaging-and-test":
            PackagingAndTestStageView()
        case "partner-foundation-or-pilot-line":
            PartnerFoundationOrPilotLineStageView()

        // ── Shared Tail (모든 cluster) ──
        case "tax-guide":
            TaxGuideStageView()
        case "loan-guide":
            LoanGuideStageView()
        case "financial-review":
            FinancialReviewStageView()
        case "pre-launch-final":
            PreLaunchFinalStageView()
        case "first-month-check":
            FirstMonthCheckStageView()

        default:
            StageDetailSheet(stage: stage)
        }
    }

    // MARK: - Timeline column

    private var timelineColumn: some View {
        VStack(spacing: 0) {
            ZStack {
                Circle()
                    .fill(BUColor.surfaceElevated)
                    .frame(width: 28, height: 28)
                    .overlay(
                        Circle().strokeBorder(statusTint.opacity(stage.status == .upcoming ? 0.25 : 0.6), lineWidth: 2)
                    )
                statusIcon
            }
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

                Text(stage.titleKo)
                    .font(BUFont.cardTitleSmall)
                    .foregroundStyle(stage.status == .upcoming ? BUColor.inkMuted : BUColor.ink)
                    .strikethrough(stage.status == .completed, color: BUColor.inkSubtle)

                if stage.status == .current {
                    Text(stage.descriptionKo)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .padding(.top, 2)
                }

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

// MARK: - Stage detail sheet (fallback)

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
                                    Text("예상 기간").buEyebrowStyle()
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
#Preview("Roadmap — 외식") {
    NavigationStack { RoadmapView() }
}

#Preview("Roadmap — 기술 스타트업") {
    NavigationStack { RoadmapView() }
        .onAppear { UserDefaults.standard.set("startup-tech", forKey: "roadmap.cluster") }
}

#Preview("Roadmap — 반도체") {
    NavigationStack { RoadmapView() }
        .onAppear { UserDefaults.standard.set("semiconductor", forKey: "roadmap.cluster") }
}
#endif
