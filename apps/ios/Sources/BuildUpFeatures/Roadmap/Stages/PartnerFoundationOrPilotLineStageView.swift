//
//  PartnerFoundationOrPilotLineStageView.swift — 파운드리 파트너십·양산 (iOS 네이티브)
//
//  stageId: "partner-foundation-or-pilot-line"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct PartnerFoundationOrPilotLineStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "partner-foundation-or-pilot-line"

    @State private var page = 0

    @AppStorage("pf.foundryPartner") private var foundryPartner = ""
    @AppStorage("pf.nda")            private var nda            = false
    @AppStorage("pf.volumePlan")     private var volumePlan     = false
    @AppStorage("pf.done")           private var done           = false

    private let pages = ["파운드리 파트너십", "양산 계획"]

    public init() {}

    /// 게이트: 파운드리 파트너 선정 + NDA·양산 계약 + 스케일업 계획.
    private var canCompleteStage: Bool {
        !foundryPartner.isEmpty && nda && volumePlan
    }

    private var advanceHint: String {
        if foundryPartner.isEmpty { return "파운드리 파트너를 선정하세요" }
        if !nda { return "파운드리 NDA·양산 계약을 체크하세요" }
        if !volumePlan { return "양산 스케일업 계획을 확정하세요" }
        return "파운드리 파트너십 확정 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "파운드리 파트너십 / 파일럿 라인",
            stageEyebrow: "단계 13 · 파운드리 파트너십",
            helperText: "파운드리 파트너십 = 반도체의 양산 계약. TSMC 2/3nm는 2027–2028까지 예약 완료. 선단 공정은 빠른 예약이 경쟁력입니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["foundryPartner": foundryPartner])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["foundryPartner": foundryPartner]) },
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
                    case 0: foundryPage
                    default: productionPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 파운드리 파트너십

    private var foundryPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("주요 파운드리 비교")
                    let options: [(String, String, String)] = [
                        ("tsmc", "TSMC", "세계 최고 기술. N3/N5 선단. 한국 법인(TSMC Korea) 통해 접근."),
                        ("samsung", "삼성 파운드리", "GAA 2nm 경쟁. 국내 스타트업 지원 프로그램 있음."),
                        ("umc", "UMC", "28nm–180nm 성숙 공정 전문. 가격 경쟁력."),
                        ("globalfoundries", "GlobalFoundries", "FDX(22nm). 아날로그·RF·자동차반도체 강점."),
                        ("xfab", "X-FAB", "아날로그·파워반도체 전문. 유럽 기반."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = foundryPartner == id
                        Button {
                            foundryPartner = isSelected ? "" : id
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
                    BUEyebrow("파운드리 접근 방법 (스타트업)")
                    let items = [
                        "TSMC: FAE(Field Application Engineer) 미팅 요청 → 설계지원팀 배정",
                        "삼성: 삼성전자 파운드리사업부 한국법인 직접 접촉",
                        "IP 라이선스·EDA 파트너 통해 소개 받는 것이 빠름",
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

    // MARK: - pg 1 양산 계획

    private var productionPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("양산 전 체크포인트")
                    let items = [
                        "MPW 결과 기반 수율·성능 확인",
                        "고객 PO (구매발주서) 확보 — 양산 비용 선지급 전",
                        "공급망 BOM 파운드리 공정에 맞게 최적화",
                        "스케일업 예산 확보 (시리즈 A 또는 정부 R&D)",
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
                    Toggle(isOn: $nda) {
                        Text("파운드리 NDA·양산 계약 체결").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $volumePlan) {
                        Text("양산 스케일업 계획 확정").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("파운드리 파트너십·양산 계획 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("PartnerFoundationOrPilotLine") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["partner-foundation-or-pilot-line"] }
    return PartnerFoundationOrPilotLineStageView().environment(store)
}
#endif
