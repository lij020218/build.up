//
//  PrototypeIterationStageView.swift — 프로토타입 반복 (iOS 네이티브)
//
//  stageId: "prototype-iteration"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct PrototypeIterationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "prototype-iteration"

    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private var helperText: String {
        switch industryId {
        case "robotics-physical-ai": return "로봇 v0~v3 주간 사이클 + go/no-go 게이트 (필드 안전·동작 정확도). 1 사이클 2-4주."
        case "biotech-medtech": return "후보물질 50-200개 → in vitro → in vivo → 임상 진입 후보 — 단계별 명시적 cutoff (효능·안전성·약동학)."
        default: return "딥테크는 반복이 더 느립니다. go/no-go 게이트로 낭비를 막으세요. 소프트웨어는 하루 배포, 딥테크는 한 사이클 3–6개월."
        }
    }

    @AppStorage("pi.iterPlanDone") private var iterPlanDone = false
    @AppStorage("pi.goNoGo")       private var goNoGo       = false
    @AppStorage("pi.v1Done")       private var v1Done       = false
    @AppStorage("pi.done")         private var done         = false

    private var currentInputs: [String: String] {
        ["iterPlanDone": "\(iterPlanDone)", "goNoGo": "\(goNoGo)", "v1Done": "\(v1Done)", "done": "\(done)"]
    }

    private let pages = ["반복 계획", "v1 프로토타입"]

    public init() {}

    /// 게이트: 반복 계획 수립 또는 v1 프로토타입 진행.
    private var canCompleteStage: Bool {
        iterPlanDone || v1Done
    }

    private var advanceHint: String {
        if done { return "프로토타입 반복 완료 — 다음 단계로" }
        if v1Done && goNoGo { return "v1·게이트 통과 — 다음 단계로" }
        if v1Done { return "v1 완료 — go/no-go 게이트 확인" }
        if iterPlanDone { return "반복 계획 수립 — v1 진행" }
        return "반복 계획 또는 v1 프로토타입을 시작하세요"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "프로토타입 반복 (Go/No-Go 게이트)",
            stageEyebrow: "단계 11 · 프로토타입 반복",
            helperText: helperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs) },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. 반복 계획·게이트 기준 수립", detail: "목표 KPI와 반복 주기, go/no-go 기준을 사전 정의."),
                    .init(label: "2. v1 프로토타입 완성·데모", detail: "핵심 기능 1가지 동작 + 외부 전문가 데모 수준 도달."),
                    .init(label: "3. go/no-go 게이트 통과", detail: "정밀도·생존율 등 사전 기준 충족 확인."),
                ],
                verifyItems: [
                    "go/no-go 기준 명확성 — 정밀도 ±2mm·세포 생존율 80% 같은 수치 cutoff가 모호하지 않은가",
                    "멈출 용기 — 미달 시 No-go·재설계 결정을 실제로 적용했는가, 매몰비용으로 끌고 가지 않았는가",
                    "핵심 가정 검증 — v1으로 가장 위험한 가정이 실제 검증됐는가",
                    "반복 예산 — 로봇 v1 3천만~1억, 바이오 1천만~5천만원 범위에서 다음 사이클 자금이 있는가",
                ],
                nextStageLabel: "다음 단계",
                nextSummary: "v1이 게이트를 통과했다면 다음 단계로 진행하세요."
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
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
                    case 0: iterPlanPage
                    default: v1Page
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - pg 0 반복 계획

    private var iterPlanPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
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
#Preview("PrototypeIteration") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["prototype-iteration"] }
    return PrototypeIterationStageView().environment(store)
}
#endif
