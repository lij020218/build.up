//
//  IndustrySelectionStageView.swift — 업종 선택 (iOS 네이티브)
//
//  stageId: "industry-selection"
//
//  업종 클러스터 8종을 4개 그룹으로 표시.
//  선택 결과를 @AppStorage("roadmap.cluster")에 저장 — RoadmapView가 읽어 단계 목록 전환.
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct IndustrySelectionStageView: View {

    @Environment(\.dismiss) private var dismiss
    @AppStorage("roadmap.cluster") private var selectedCluster = "offline-food"

    private struct ClusterOption {
        let id: String; let icon: String; let name: String; let desc: String
    }

    private let groups: [(String, [ClusterOption])] = [
        ("오프라인·커머스", [
            ClusterOption(id: "offline-food",    icon: "fork.knife",      name: "음식점·카페·소매",      desc: "외식업·카페·소매점·뷰티·피트니스 등 오프라인 사업. 인허가·입지·인테리어 중심."),
            ClusterOption(id: "online-digital",  icon: "cart",            name: "온라인 커머스",          desc: "스마트스토어·쿠팡·자체몰 기반 온라인 판매. 소싱·플랫폼·마케팅 중심."),
        ]),
        ("기술 스타트업", [
            ClusterOption(id: "startup-tech",    icon: "laptopcomputer",  name: "기술 스타트업 (SaaS)",   desc: "소프트웨어·앱·플랫폼 기반. 고객 발굴·MVP·GTM 중심."),
            ClusterOption(id: "hardware-iot",    icon: "cpu",             name: "하드웨어·IoT",           desc: "스마트 기기·센서·임베디드 제품. EVT→DVT→PVT 프로토타입 중심."),
        ]),
        ("딥테크 (연구 중심)", [
            ClusterOption(id: "robotics-physical-ai", icon: "gear.badge", name: "로봇·물리 AI",           desc: "로봇·드론·자율주행 등 물리 세계 AI. 연구소·현장 테스트·규제 허가 중심."),
            ClusterOption(id: "biotech-medtech", icon: "cross.case",      name: "바이오·의료기기",         desc: "신약·의료기기·헬스케어 기술. 임상시험·식약처 허가 중심."),
        ]),
        ("반도체·클린테크", [
            ClusterOption(id: "semiconductor",   icon: "memorychip",      name: "반도체",                 desc: "IC 설계·파운드리·패키징. EDA·테이프아웃·파운드리 파트너십 중심."),
            ClusterOption(id: "climate-energy",  icon: "leaf",            name: "클린테크·에너지",         desc: "태양광·배터리·탄소포집 등 에너지 기술. 반도체 경로와 유사한 설계·양산 구조."),
        ]),
    ]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {

                            BUCard(.hero) {
                                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                                    BUEyebrow("업종 선택")
                                    Text("내 사업에 맞는\n로드맵을 선택하세요")
                                        .font(.system(size: 22, weight: .bold))
                                        .foregroundStyle(BUColor.midnightDeep)
                                        .tracking(-0.3)
                                        .lineSpacing(4)
                                    Text("업종마다 로드맵 단계가 다릅니다. 선택 후 로드맵이 해당 업종에 맞게 바뀝니다.")
                                        .font(BUFont.bodySmall)
                                        .foregroundStyle(BUColor.inkSecondary)
                                        .lineSpacing(3)
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)

                            ForEach(groups, id: \.0) { groupName, clusters in
                                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                                    BUEyebrow(groupName)
                                        .padding(.horizontal, BUSpacing.md)

                                    VStack(spacing: BUSpacing.xs) {
                                        ForEach(clusters, id: \.id) { cluster in
                                            clusterButton(cluster)
                                                .padding(.horizontal, BUSpacing.md)
                                        }
                                    }
                                }
                            }

                            BUCard(.card) {
                                HStack(alignment: .top, spacing: BUSpacing.sm) {
                                    Image(systemName: "info.circle.fill")
                                        .font(.system(size: 16))
                                        .foregroundStyle(BUColor.midnight.opacity(0.6))
                                    Text("선택 후 로드맵 화면을 닫고 다시 열면 업종에 맞는 단계로 업데이트됩니다.")
                                        .font(BUFont.bodyCaption)
                                        .foregroundStyle(BUColor.inkSecondary)
                                        .lineSpacing(2)
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)

                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("업종 선택")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private func clusterButton(_ cluster: ClusterOption) -> some View {
        let isSelected = selectedCluster == cluster.id
        return Button { selectedCluster = cluster.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(isSelected ? BUColor.midnight.opacity(0.12) : BUColor.midnight.opacity(0.06))
                        .frame(width: 40, height: 40)
                    Image(systemName: cluster.icon).font(.system(size: 18)).foregroundStyle(BUColor.midnight)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(cluster.name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    Text(cluster.desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(BUColor.midnight).font(.system(size: 20))
                }
            }
            .padding(BUSpacing.sm)
            .background(isSelected ? BUColor.midnight.opacity(0.05) : Color.clear, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous).strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 2))
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
#Preview("IndustrySelection") { IndustrySelectionStageView() }
#endif
