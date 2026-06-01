//
//  MpwOrPilotTapeOutStageView.swift — MPW·테이프아웃 (iOS 네이티브)
//
//  stageId: "mpw-or-pilot-tape-out"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct MpwOrPilotTapeOutStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "mpw-or-pilot-tape-out"

    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private var helperText: String {
        switch industryId {
        case "semiconductor": return "MPW shuttle 90-95% 절감 (수만~수십만달러). TSMC 2/3nm 2027-2028 매진 — 일찍 락인."
        case "climate-energy": return "파일럿 양산 — 첫 100~1000대 검증. NRE·금형비 + 신뢰성 시험 (1만 시간 가속수명)."
        default: return "테이프아웃 = 설계 완료의 선언. 되돌리면 수십억이 날아갑니다. MPW는 비용을 90–95% 절감할 수 있습니다."
        }
    }

    @State private var page = 0

    @AppStorage("mpw.tapeOutType")   private var tapeOutType  = ""
    @AppStorage("mpw.designFrozen")  private var designFrozen = false
    @AppStorage("mpw.submitted")     private var submitted    = false
    @AppStorage("mpw.done")          private var done         = false

    private let pages = ["MPW vs 풀마스크", "테이프아웃 준비"]

    public init() {}

    /// 게이트: 테이프아웃 유형 (MPW vs 풀마스크) 선택 + 설계 Freeze + 제출 완료.
    private var canCompleteStage: Bool {
        !tapeOutType.isEmpty && designFrozen && submitted
    }

    private var advanceHint: String {
        if tapeOutType.isEmpty { return "MPW vs 풀마스크 유형을 선택하세요" }
        if !designFrozen { return "설계 Freeze 체크가 필요합니다" }
        if !submitted { return "파운드리 테이프아웃 제출을 체크하세요" }
        return "테이프아웃 제출 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "MPW 또는 파일럿 테이프아웃",
            stageEyebrow: "단계 11 · MPW·테이프아웃",
            helperText: helperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["tapeOutType": tapeOutType])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["tapeOutType": tapeOutType]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. MPW vs 풀마스크 선택", detail: "공동 웨이퍼(90~95% 절감) 또는 풀 마스크셋 결정."),
                    .init(label: "2. 설계 Freeze", detail: "RTL·레이아웃 변경 금지 선언."),
                    .init(label: "3. 테이프아웃 제출", detail: "파운드리에 테이프아웃 데이터 제출 완료."),
                ],
                verifyItems: [
                    "DRC 100% 통과 — 미통과 시 제조 자체가 거절됩니다.",
                    "LVS 일치·EMIR(전류 밀도) 검증을 마쳤는지 확인.",
                    "노드·파운드리 선택이 맞는지 — 되돌리면 수십억과 6~9개월이 날아갑니다.",
                    "TSMC 2/3nm 등 인기 노드는 매진 전 캐파를 미리 락인했는지 확인.",
                ],
                nextStageLabel: "다음 단계",
                nextSummary: "테이프아웃 후 6~28주 제조를 거쳐 패키징·테스트 단계로 넘어갑니다."
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
                    case 0: mpwPage
                    default: tapeOutPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 MPW vs 풀마스크

    private var mpwPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("MPW vs 풀마스크 선택")
                    let options: [(String, String, String)] = [
                        ("mpw", "MPW (공동 웨이퍼)", "공유 웨이퍼 run · Full mask 대비 90~95% 절감 (수만~수십만 달러). TSMC Shared Block(Muse Semi)·삼성 CMP·SkyWater·GlobalFoundries·Tower·X-FAB·EUROPRACTICE."),
                        ("full", "풀 마스크셋", "28nm $1M+ (약 14억원+) / 7nm $10M+ (약 140억원+). MPW 검증 후 양산 결정. 생산 시간은 MPW도 Full도 동일 6~9개월."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = tapeOutType == id
                        Button {
                            tapeOutType = isSelected ? "" : id
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
                    BUEyebrow("한국 MPW 접근 방법")
                    let items = [
                        "TSMC OIP CMP 파트너 (한국: 씨제이씨·더존 EDA 등) 통해 신청",
                        "IMEC ePIXfab (포토닉스), EuroPra (유럽 공공 MPW)",
                        "삼성 파운드리 MPW: 국내 스타트업 우선 배정 있음",
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
                    BUEyebrow("테이프아웃 전 반드시 확인")
                    let warnings = [
                        "DRC (Design Rule Check) 100% 통과 — 미통과 시 제조 거절",
                        "LVS (Layout vs Schematic) 일치 확인",
                        "EMIR (전류 밀도) 검증",
                        "파운드리 테이프아웃 체크리스트 전항목 완료",
                    ]
                    ForEach(warnings, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 13)).foregroundStyle(Color.red.opacity(0.8))
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 테이프아웃 준비

    private var tapeOutPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("테이프아웃 체크리스트")
                    Toggle(isOn: $designFrozen) {
                        Text("설계 Freeze — RTL·레이아웃 변경 금지").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $submitted) {
                        Text("파운드리 테이프아웃 데이터 제출 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("테이프아웃 이후 일정")
                    let schedule: [(String, String)] = [
                        ("웨이퍼 제조", "8–16주 (공정 노드에 따라)"),
                        ("다이 출하·패키징", "4–8주"),
                        ("초도 샘플 테스트", "2–4주"),
                        ("첫 샘플까지 총", "6–28주"),
                    ]
                    ForEach(schedule, id: \.0) { label, value in
                        HStack(spacing: BUSpacing.sm) {
                            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted).frame(width: 96, alignment: .leading)
                            Text(value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("MPW·테이프아웃 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("MpwOrPilotTapeOut") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["mpw-or-pilot-tape-out"] }
    return MpwOrPilotTapeOutStageView().environment(store)
}
#endif
