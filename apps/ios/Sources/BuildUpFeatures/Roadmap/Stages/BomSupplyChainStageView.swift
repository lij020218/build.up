//
//  BomSupplyChainStageView.swift — BOM·공급망 확정 (iOS 네이티브)
//
//  stageId: "bom-supply-chain"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct BomSupplyChainStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "bom-supply-chain"

    @AppStorage("bom.bomLocked")       private var bomLocked       = false
    @AppStorage("bom.supplierLocked")  private var supplierLocked  = false
    @AppStorage("bom.singleSourceRisk") private var singleSourceRisk = false
    @AppStorage("bom.done")            private var done            = false

    private let pages = ["BOM 확정", "공급사 관리"]

    public init() {}

    /// 게이트: BOM 작성 시작 (BOM lock 또는 공급사 lock 중 하나라도 체크).
    private var canCompleteStage: Bool {
        bomLocked || supplierLocked
    }

    private var advanceHint: String {
        if done { return "BOM·공급망 확정 완료 — 다음 단계로" }
        if bomLocked && supplierLocked { return "BOM·공급사 확정 — 다음 단계로" }
        if bomLocked { return "BOM v1.0 확정 — 공급사 lock 진행" }
        if supplierLocked { return "공급사 lock — BOM 확정 진행" }
        return "BOM 또는 공급사 체크리스트를 시작하세요"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "BOM 및 공급망 락인",
            stageEyebrow: "단계 11 · BOM·공급망 확정",
            helperText: "BOM = 하드웨어의 설계도. 한 부품이 바뀌면 인증부터 다시. 자재명세서는 원가·공급망·인증의 기준이 됩니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
            currentPage: page,
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: bomPage
                    default: supplierPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - pg 0 BOM 확정

    private var bomPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("BOM 구성 요소")
                    let items = [
                        "핵심 IC (MCU·센서·통신 모듈)",
                        "기구·PCB 부품",
                        "패키징·라벨링 자재",
                        "소모품·부속품",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "circle.fill").font(.system(size: 5)).foregroundStyle(BUColor.inkMuted).padding(.top, 5)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("BOM 확정 체크포인트")
                    let items = [
                        "모든 부품에 대체 부품(Alternative) 1개 이상 지정",
                        "EOL(End of Life) 부품 없음 확인",
                        "원가 시뮬레이션: BOM Cost × 3 = 목표 소비자가",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "checkmark.circle").font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $bomLocked) {
                        Text("BOM v1.0 확정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - pg 1 공급사 관리

    private var supplierPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("공급사 lock-in 체크리스트")
                    let items = [
                        "NDA·공급 계약 체결 (최소 2개 공급처)",
                        "최소 주문 수량(MOQ) 협상 완료",
                        "리드타임 8주 이하 확인",
                        "품질 보증(QC) 기준 문서화",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "checkmark.circle").font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("단일 소싱 리스크")
                    Text("핵심 부품 공급사가 1곳뿐이면 양산 위협. 코로나 반도체 대란처럼 하나의 공급사 이슈가 전체 생산 중단으로.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $supplierLocked) {
                        Text("공급사 계약 완료 (최소 핵심 부품 2곳)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $singleSourceRisk) {
                        Text("단일 소싱 리스크 검토 및 대안 확보").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("BOM·공급망 확정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("BomSupplyChain") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["bom-supply-chain"] }
    return BomSupplyChainStageView().environment(store)
}
#endif
