//
//  FieldOrClinicalTestStageView.swift — 현장·임상 시험 (iOS 네이티브)
//
//  stageId: "field-or-clinical-test"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct FieldOrClinicalTestStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "field-or-clinical-test"

    @AppStorage("fct.testType")     private var testType     = ""
    @AppStorage("fct.planDone")     private var planDone     = false
    @AppStorage("fct.testDone")     private var testDone     = false
    @AppStorage("fct.indSubmitted") private var indSubmitted = false
    @AppStorage("fct.done")         private var done         = false

    private let pages = ["시험 계획", "진행 현황"]

    public init() {}

    /// 게이트: 시험 유형 선택 또는 계획 수립.
    private var canCompleteStage: Bool {
        !testType.isEmpty || planDone
    }

    private var advanceHint: String {
        if done { return "현장·임상 시험 완료 — 다음 단계로" }
        if testDone { return "시험 완료 — 다음 단계로" }
        if planDone { return "시험 계획 수립 — 시험 진행" }
        if testType == "field" { return "현장 테스트 — 파일럿 고객 확보" }
        if testType == "clinical" { return "임상시험 — IND 제출 준비" }
        return "시험 유형(현장/임상)을 선택하세요"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "필드 테스트 / 임상 시험",
            stageEyebrow: "단계 12 · 현장·임상 시험",
            helperText: "실제 환경에서의 검증. 연구실 결과와 현장은 다릅니다. 로봇은 현장 테스트, 바이오·의료기기는 식약처 IND 후 임상시험.",
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
                    case 0: planPage
                    default: statusPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - pg 0 시험 계획

    private var planPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("시험 유형 선택")
                    let options: [(String, String, String)] = [
                        ("field", "현장 테스트 (Field Test)", "로봇·IoT·물리AI. 실제 운영 환경 배치. 파일럿 고객 확보가 핵심."),
                        ("clinical", "임상시험 (Clinical Test)", "바이오·의료기기. 식약처 IND 신청 후 진행. 최소 30영업일 소요."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = testType == id
                        Button {
                            testType = isSelected ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(title).font(BUFont.bodySmall.weight(.bold))
                                        .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)
                                    Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                        .multilineTextAlignment(.leading)
                                }
                                Spacer()
                                if isSelected {
                                    Image(systemName: "checkmark.circle.fill").font(.system(size: 16)).foregroundStyle(BUColor.midnight)
                                }
                            }
                            .padding(BUSpacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(isSelected ? BUColor.midnight.opacity(0.06) : BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            if testType == "field" || testType.isEmpty {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        BUEyebrow("현장 테스트 계획")
                        let items = [
                            "파일럿 고객 (얼리어답터) 3–5곳 확보",
                            "측정 지표 사전 정의 (효율·정확도·가동률)",
                            "테스트 기간: 4–12주",
                        ]
                        ForEach(items, id: \.self) { item in
                            HStack(alignment: .top, spacing: 6) {
                                Image(systemName: "circle.fill").font(.system(size: 5)).foregroundStyle(BUColor.inkMuted).padding(.top, 5)
                                Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            if testType == "clinical" {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        BUEyebrow("임상시험 계획")
                        let items = [
                            "임상시험계획서(IND) 작성 — CRO 활용 권장",
                            "식약처 제출 (30영업일 심사)",
                            "IRB(기관생명윤리위원회) 승인",
                            "1상: 안전성 / 2상: 유효성 / 3상: 대규모 비교",
                        ]
                        ForEach(items, id: \.self) { item in
                            HStack(alignment: .top, spacing: 6) {
                                Image(systemName: "circle.fill").font(.system(size: 5)).foregroundStyle(BUColor.inkMuted).padding(.top, 5)
                                Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 진행 현황

    private var statusPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("진행 현황 체크")
                    Toggle(isOn: $planDone) {
                        Text("시험 계획 수립 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $indSubmitted) {
                        Text("식약처 IND 제출 완료 (바이오만 해당)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $testDone) {
                        Text("현장·임상 시험 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("시험 완료 후 — 무엇을 해야 하나")
                    let items = [
                        "결과 데이터 정리 (성능 지표·부작용·사용자 피드백)",
                        "규제 기관 제출용 보고서 작성",
                        "언론·IR 자료에 임상 결과 활용",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "arrow.right.circle").font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("현장·임상 시험 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("FieldOrClinicalTest") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["field-or-clinical-test"] }
    return FieldOrClinicalTestStageView().environment(store)
}
#endif
