//
//  PrototypeIterationStageView.swift — 프로토타입 반복 (iOS 네이티브)
//
//  stageId: "prototype-iteration"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct PrototypeIterationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("pi.iterPlanDone") private var iterPlanDone = false
    @AppStorage("pi.goNoGo")       private var goNoGo       = false
    @AppStorage("pi.v1Done")       private var v1Done       = false
    @AppStorage("pi.done")         private var done         = false

    private let pages = ["반복 계획", "v1 프로토타입"]

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
                                case 0: iterPlanPage
                                default: v1Page
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("프로토타입 반복")
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

    // MARK: - pg 0 반복 계획

    private var iterPlanPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("프로토타입 반복")
                    Text("딥테크는 반복이 더 느리다\ngo/no-go 게이트로 낭비를 막는다")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("소프트웨어는 하루 배포, 딥테크는 한 사이클이 3–6개월. 설계가 더 중요.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("반복 계획 수립")
                    let items = [
                        "목표 성능 지표 (KPI) 사전 정의 — 무엇이 성공인가",
                        "반복 주기: 로봇 2–4주 / 바이오 3–6개월",
                        "각 반복마다 go/no-go 게이트 — 멈출 용기가 필요",
                        "실패 가정 목록 — 무엇이 틀릴 수 있는가",
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
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $iterPlanDone) {
                        Text("반복 계획 및 go/no-go 기준 수립").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("go/no-go 게이트 예시")
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("로봇").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        Text("정밀도 ±2mm 달성 → Go / 미달 → No-go → 재설계")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                    Divider()
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("바이오").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        Text("세포 생존율 80% 이상 → Go / 미달 → No-go → 프로토콜 수정")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }
        }
    }

    // MARK: - pg 1 v1 프로토타입

    private var v1Page: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("v1 프로토타입 목표")
                    let items = [
                        "핵심 기능 1가지만 동작 — 완벽하지 않아도 됨",
                        "외부 전문가 (교수·전문가 5–10명) 데모 가능한 수준",
                        "핵심 가정 검증 완료",
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
                    Toggle(isOn: $v1Done) {
                        Text("v1 프로토타입 완성 및 데모 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $goNoGo) {
                        Text("go/no-go 게이트 통과").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("딥테크 프로토타입 예산 가이드")
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("로봇").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        Text("v1 프로토타입 3,000만~1억원 (센서·actuator·소프트웨어)")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                    Divider()
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("바이오").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        Text("v1 실험 1,000만~5,000만원 (시약·클린룸 사용료·인건비)")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("프로토타입 반복 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("PrototypeIteration") { PrototypeIterationStageView() }
#endif
