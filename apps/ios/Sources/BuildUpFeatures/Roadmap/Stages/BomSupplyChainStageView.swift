//
//  BomSupplyChainStageView.swift — BOM·공급망 확정 (iOS 네이티브)
//
//  stageId: "bom-supply-chain"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct BomSupplyChainStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("bom.bomLocked")       private var bomLocked       = false
    @AppStorage("bom.supplierLocked")  private var supplierLocked  = false
    @AppStorage("bom.singleSourceRisk") private var singleSourceRisk = false
    @AppStorage("bom.done")            private var done            = false

    private let pages = ["BOM 확정", "공급사 관리"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    Picker("탭", selection: $page) {
                        ForEach(pages.indices, id: \.self) { i in
                            Text(pages[i]).tag(i)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(BUSpacing.md)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: bomPage
                                default: supplierPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("BOM·공급망 확정")
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

    // MARK: - pg 0 BOM 확정

    private var bomPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("BOM·공급망 확정")
                    Text("BOM = 하드웨어의 설계도\n한 부품이 바뀌면 인증부터 다시")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("자재명세서 (BOM)는 원가·공급망·인증의 기준이 됩니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

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
#Preview("BomSupplyChain") { BomSupplyChainStageView() }
#endif
