//
//  EdaToolingSetupStageView.swift — EDA 환경 설정 (iOS 네이티브)
//
//  stageId: "eda-tooling-setup"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct EdaToolingSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "eda-tooling-setup"

    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private var helperText: String {
        switch industryId {
        case "semiconductor": return "Synopsys/Cadence/Siemens EDA — multi-year 협상 시 10-25% 할인. 스타트업 티어 가능."
        case "climate-energy": return "시뮬레이션 SW (ANSYS·COMSOL) — 에너지·열·유체 + 표준 인증 도구."
        default: return "반도체 설계의 시작 = EDA 툴. 라이선스 비용은 연간 수억~수십억. 스타트업은 클라우드·교육용 라이선스 우선."
        }
    }

    @State private var page = 0

    @AppStorage("eda.edaTool")      private var edaTool      = ""
    @AppStorage("eda.licenseOK")    private var licenseOK    = false
    @AppStorage("eda.ipLibraryOK")  private var ipLibraryOK  = false
    @AppStorage("eda.done")         private var done         = false

    private let pages = ["EDA 라이선스", "IP·라이브러리"]

    public init() {}

    /// 게이트: EDA 툴 선택 + 라이선스 확보 + 설계 환경(PDK/IP) 결정.
    private var canCompleteStage: Bool {
        !edaTool.isEmpty && licenseOK && ipLibraryOK
    }

    private var advanceHint: String {
        if edaTool.isEmpty { return "EDA 툴을 선택하세요" }
        if !licenseOK { return "EDA 라이선스 확보를 체크하세요" }
        if !ipLibraryOK { return "PDK·IP 라이브러리 확보를 체크하세요" }
        return "EDA 환경 설정 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "EDA 도구·설계 환경 셋업",
            stageEyebrow: "단계 10 · EDA 환경 설정",
            helperText: helperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["edaTool": edaTool])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["edaTool": edaTool]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. EDA 툴 선정·라이선스 확보", detail: "Synopsys·Cadence·Siemens·오픈소스 중 선택, 클라우드·대학·파운드리 번들로 비용 절감."),
                    .init(label: "2. PDK·IP 라이브러리 확보", detail: "파운드리 공정 PDK + 표준 셀·Hard/Soft IP 결정."),
                ],
                verifyItems: [
                    "선택한 PDK가 목표 파운드리 공정과 일치하는가 — 공정 변경 시 전체 재설계가 필요합니다.",
                    "오픈소스 툴 선택 시 목표 공정(N7 이상) PDK 지원 한계를 확인했는가.",
                    "Hard IP 라이선스 비용(수억~수십억)이 예산에 반영돼 있는가.",
                ],
                nextStageLabel: "다음 단계",
                nextSummary: "확보한 EDA 환경으로 본격 설계·검증에 들어갑니다."
            ),
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
                    case 0: licensePage
                    default: ipPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 EDA 라이선스

    private var licensePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("주요 EDA 툴 선택")
                    let options: [(String, String, String)] = [
                        ("synopsys", "Synopsys", "Design Compiler·ICC2·VCS. 업계 표준. 엔터프라이즈 라이선스 수억원/년."),
                        ("cadence", "Cadence", "Innovus·Virtuoso·Spectre. 아날로그·혼성 설계에 강점."),
                        ("siemens", "Siemens EDA (구 Mentor)", "Questa·Calibre. DRC/LVS 검증에 강점."),
                        ("open", "오픈소스 (OpenROAD·Magic)", "무료. TSMC N7 이상 PDK 지원 제한. 학술·초기 검증에 적합."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = edaTool == id
                        Button {
                            edaTool = isSelected ? "" : id
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

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("스타트업 EDA 라이선스 절약 방법")
                    let items = [
                        "클라우드 EDA (Cadence Cloud / AWS 파트너): 사용량 기반 과금",
                        "대학 공동 라이선스 활용 (KAIST·서울대·포항공대)",
                        "파운드리 지원 PDK + EDA 번들 (TSMC-Synopsys 파트너십)",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "lightbulb").font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 IP·라이브러리

    private var ipPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("IP·PDK (Process Design Kit) 전략")
                    let items = [
                        "PDK = 특정 파운드리 공정의 설계 규칙 집합. 공정 변경 시 재설계 필요.",
                        "표준 셀 라이브러리: TSMC·삼성·UMC 제공 또는 제3자 구매",
                        "Hard IP: 외부 구매 (ARM 코어·USB·PCIe IP 블록). 수억원~수십억원.",
                        "Soft IP: RTL 수준. 직접 개발 또는 오픈소스 (RISC-V 등).",
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
                    Toggle(isOn: $licenseOK) {
                        Text("EDA 툴 라이선스 확보 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $ipLibraryOK) {
                        Text("PDK 및 IP 라이브러리 확보 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("EDA 환경 설정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("EdaToolingSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["eda-tooling-setup"] }
    return EdaToolingSetupStageView().environment(store)
}
#endif
