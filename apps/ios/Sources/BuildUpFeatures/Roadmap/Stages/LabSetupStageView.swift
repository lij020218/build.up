//
//  LabSetupStageView.swift — 연구소 설립·설비 (iOS 네이티브)
//
//  stageId: "lab-setup"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct LabSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "lab-setup"

    @AppStorage("lab.facilityDone")  private var facilityDone  = false
    @AppStorage("lab.safetyDone")    private var safetyDone    = false
    @AppStorage("lab.equipmentDone") private var equipmentDone = false
    @AppStorage("lab.done")          private var done          = false

    private let pages = ["연구소 설립", "핵심 장비"]

    public init() {}

    /// 게이트: 연구소 요건 또는 장비 목록 중 1개 이상 체크.
    private var canCompleteStage: Bool {
        facilityDone || safetyDone || equipmentDone
    }

    private var advanceHint: String {
        if done { return "연구소 설립·설비 완료 — 다음 단계로" }
        if facilityDone && equipmentDone { return "연구소·장비 확보 — 다음 단계로" }
        if facilityDone { return "연구소 인정 신청 — 장비 확보 진행" }
        if equipmentDone { return "장비 확보 — 연구소 인정 진행" }
        return "연구소 요건 또는 장비 목록을 정리하세요"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "연구실·시제품 작업장 셋업",
            stageEyebrow: "단계 10 · 연구소 설립·설비",
            helperText: "연구소 = 딥테크의 공장. 설립 전 법적 요건 먼저. 기업부설연구소 인정(RNDIP): 연구개발인력 최소 1명 석사 이상 또는 2명 학사.",
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
                    case 0: facilityPage
                    default: equipmentPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - pg 0 연구소 설립

    private var facilityPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("기업부설연구소 설립 절차")
                    let steps: [(String, String)] = [
                        ("1", "한국산업기술진흥협회(KOITA) 신청"),
                        ("2", "연구소장·연구인력 확보"),
                        ("3", "전용 연구 공간 확보"),
                        ("4", "인정서 발급 (2–4주)"),
                    ]
                    ForEach(steps, id: \.0) { num, desc in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(num)
                                .font(BUFont.eyebrow.weight(.bold))
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 18, alignment: .center)
                            Text(desc).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("연구소 인정 혜택")
                    let benefits = [
                        "R&D 비용 25–50% 세액공제",
                        "연구인력 4대보험 일부 지원",
                        "정부 R&D 과제 신청 자격",
                        "벤처 인증 연계 (연구개발기업 유형)",
                    ]
                    ForEach(benefits, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "star.fill").font(.system(size: 11)).foregroundStyle(BUColor.midnight).padding(.top, 2)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $facilityDone) {
                        Text("전용 연구 공간 확보 및 연구소 인정 신청").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $safetyDone) {
                        Text("안전 관리 프로토콜 수립 (화학물질·장비 안전)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - pg 1 핵심 장비

    private var equipmentPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("딥테크 분야별 필수 장비")
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("로봇·물리AI").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        Text("로봇 팔·센서 모듈·ROS 개발 워크스테이션·모션 캡처 시스템")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                    Divider()
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        Text("바이오·의료기기").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        Text("클린룸 (class 10000 이상)·세포 배양기·PCR·현미경")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("장비 확보 전략")
                    let items = [
                        "구매 vs 임대 vs 공용 장비 활용 비교",
                        "창업진흥원·연구원 공동 장비 활용 (대학·KIST·KAIST 협력)",
                        "정부 장비 바우처: 중소기업 최대 80% 지원",
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
                    Toggle(isOn: $equipmentDone) {
                        Text("핵심 장비 확보 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("연구소 설립·설비 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("LabSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["lab-setup"] }
    return LabSetupStageView().environment(store)
}
#endif
