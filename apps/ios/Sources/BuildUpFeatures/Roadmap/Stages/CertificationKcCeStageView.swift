//
//  CertificationKcCeStageView.swift — KC·CE·FCC 인증 (iOS 네이티브)
//
//  stageId: "certification-kc-ce"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct CertificationKcCeStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "certification-kc-ce"

    @AppStorage("cert.kcRequired")  private var kcRequired  = false
    @AppStorage("cert.ceRequired")  private var ceRequired  = false
    @AppStorage("cert.fccRequired") private var fccRequired = false
    @AppStorage("cert.kcApplied")   private var kcApplied   = false
    @AppStorage("cert.ceApplied")   private var ceApplied   = false
    @AppStorage("cert.done")        private var done        = false

    private let pages = ["인증 종류", "신청 절차"]

    public init() {}

    /// 게이트: 필요 인증 1개 이상 선택.
    private var canCompleteStage: Bool {
        kcRequired || ceRequired || fccRequired
    }

    private var advanceHint: String {
        if done { return "인증 프로세스 시작 — 다음 단계로" }
        if kcApplied || ceApplied { return "신청 진행 중 — 다음 단계로" }
        if canCompleteStage { return "필요 인증 선택 — 신청 절차 확인" }
        return "필요한 인증을 최소 1개 선택하세요"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "인증 (KC·CE·FCC)",
            stageEyebrow: "단계 12 · KC·CE·FCC 인증",
            helperText: "인증 없이는 판매 불가. KC는 국내, CE는 유럽, FCC는 미국. 무선 통신 포함 제품은 8–16주 소요.",
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
                    case 0: certTypePage
                    default: procedurePage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - pg 0 인증 종류

    private var certTypePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("인증별 적용 범위")
                    let certInfos: [(String, String, String)] = [
                        ("KC", "한국", "국내 판매 의무. 전기용품안전기준(KS). 위반 시 리콜·판매정지."),
                        ("CE", "유럽", "EU 수출 시 필수. RoHS·EMC·LVD 지령 포함. 유럽 대리인 지정 필요."),
                        ("FCC", "미국", "미국 판매·수출 시 필수. 무선 제품은 ID 등록 의무."),
                        ("MIC", "일본", "일본 판매 시 전파법 인증. 국내 TELEC 대행 기관 통해 가능."),
                    ]
                    ForEach(certInfos, id: \.0) { cert, region, desc in
                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: BUSpacing.xs) {
                                Text(cert).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                                Text("(\(region))").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                            }
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        .padding(.bottom, BUSpacing.xs)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("필요 인증 선택")
                    Toggle(isOn: $kcRequired) {
                        Text("KC 인증 필요 (국내 판매)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $ceRequired) {
                        Text("CE 인증 필요 (유럽 수출 계획)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $fccRequired) {
                        Text("FCC 인증 필요 (미국 수출 계획)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - pg 1 신청 절차

    private var procedurePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("KC 인증 신청 절차")
                    let steps: [(String, String)] = [
                        ("1", "시험기관 선정 (KTL·KOTITI·FITI 등)"),
                        ("2", "시험 의뢰"),
                        ("3", "심사·시험 (4–16주)"),
                        ("4", "인증서 발급"),
                        ("5", "제품에 KC 마크 표시"),
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
                    BUEyebrow("인증 비용 가이드 (2026 기준)")
                    let costs: [(String, String)] = [
                        ("KC 기본", "300–800만원 (제품 복잡도에 따라)"),
                        ("CE 마킹", "500–1,500만원"),
                        ("FCC", "500–2,000만원"),
                        ("EMC 시험", "별도 추가 가능"),
                    ]
                    ForEach(costs, id: \.0) { label, value in
                        HStack(spacing: BUSpacing.sm) {
                            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted).frame(width: 72, alignment: .leading)
                            Text(value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신청 완료 체크")
                    Toggle(isOn: $kcApplied) {
                        Text("KC 인증 신청 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $ceApplied) {
                        Text("CE 인증 신청 완료 (해당 시)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("인증 프로세스 시작 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("CertificationKcCe") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["certification-kc-ce"] }
    return CertificationKcCeStageView().environment(store)
}
#endif
