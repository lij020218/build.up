//
//  PackagingAndTestStageView.swift — 패키징·테스트 (iOS 네이티브)
//
//  stageId: "packaging-and-test"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct PackagingAndTestStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "packaging-and-test"

    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private var helperText: String {
        switch industryId {
        case "semiconductor": return "OSAT (ASE·Amkor·JCET·Powertech). 2026년 가격 5-30% 인상 + 가동률 90% — 일찍 락인."
        case "climate-energy": return "에너지·태양광·배터리 — 신뢰성 시험 (염수·UV·진동·열사이클) + KS/IEC/UL 인증."
        default: return "OSAT(Outsourced Semiconductor Assembly and Test) = 패키징·테스트 전문 위탁. 설계 이후 생산의 마지막 퍼즐입니다."
        }
    }

    @State private var page = 0

    @AppStorage("pkg.osatSelected")   private var osatSelected   = false
    @AppStorage("pkg.testPlanDone")   private var testPlanDone   = false
    @AppStorage("pkg.firstSampleOK")  private var firstSampleOK  = false
    @AppStorage("pkg.done")           private var done           = false

    private let pages = ["OSAT 선정", "테스트 계획"]

    public init() {}

    /// 게이트: OSAT 파트너 선정 + 테스트 계획 수립.
    private var canCompleteStage: Bool {
        osatSelected && testPlanDone
    }

    private var advanceHint: String {
        if !osatSelected { return "OSAT 파트너를 선정하세요" }
        if !testPlanDone { return "테스트 계획을 완성하세요" }
        return "OSAT + 테스트 계획 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "패키징 및 테스트 (OSAT)",
            stageEyebrow: "단계 12 · 패키징·테스트",
            helperText: helperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. 패키지 유형·OSAT 선정", detail: "QFN/BGA/WLP/CoWoS 중 선택 후 OSAT 파트너 확정."),
                    .init(label: "2. 테스트 계획 수립", detail: "EWS·FT·SLT 단계와 ATE 프로그램 완성."),
                    .init(label: "3. 초도 샘플 테스트", detail: "첫 샘플 기능·수율 검증 통과."),
                ],
                verifyItems: [
                    "OSAT가 원하는 패키지 유형 경험·인증을 보유했는지 확인.",
                    "MPW 샘플 수준 MOQ(50~200개)가 가능한 곳인지 — 대량 전용 OSAT는 소량 거절.",
                    "Fault Coverage 95%·수율 목표를 충족했는지 (첫 MPW는 50~70%도 정상).",
                    "OSAT 가동률 90%·가격 인상기 — 캐파를 일찍 락인했는지 확인.",
                ],
                nextStageLabel: "다음 단계",
                nextSummary: "패키징·테스트를 통과한 검증 칩으로 양산 파트너 선정 단계로 넘어갑니다."
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
                    case 0: osatPage
                    default: testPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 OSAT 선정

    private var osatPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("패키지 유형 선택")
                    let pkgTypes: [(String, String)] = [
                        ("QFN/QFP", "저가·표준. 대부분의 MCU·센서에 적합."),
                        ("BGA/FBGA", "고집적. 모바일 AP·메모리에 사용."),
                        ("WLP/CSP", "최소 폼팩터. 웨어러블·IoT용."),
                        ("CoWoS/HBM", "HPC·AI 가속기. 2.5D/3D 패키지."),
                    ]
                    ForEach(pkgTypes, id: \.0) { pkg, desc in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(pkg).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("OSAT 선정 기준")
                    let items = [
                        "원하는 패키지 유형 경험·인증 보유",
                        "MOQ (최소 주문): MPW 샘플 50–200개 가능한 곳",
                        "국내 OSAT: 하나마이크론·STS반도체",
                        "해외 OSAT: ASE·Amkor — 대량 양산 시 유리",
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
                    Toggle(isOn: $osatSelected) {
                        Text("OSAT 파트너 선정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - pg 1 테스트 계획

    private var testPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("반도체 테스트 단계")
                    let stages: [(String, String, String)] = [
                        ("EWS", "Wafer Test", "다이 단계 불량 선별"),
                        ("FT", "Package Test", "완성품 기능 테스트"),
                        ("SLT", "System-Level Test", "실제 시스템 환경 테스트"),
                    ]
                    ForEach(stages, id: \.0) { abbr, name, desc in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(abbr).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 36, alignment: .leading)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("테스트 커버리지 목표")
                    let targets: [(String, String)] = [
                        ("Fault Coverage", "95% 이상"),
                        ("수율 (Yield)", "양산 손익분기 95% 이상 (wafer·final test 모두 — 첫 MPW 검증 단계는 50–70%도 정상)"),
                    ]
                    ForEach(targets, id: \.0) { label, value in
                        HStack(spacing: BUSpacing.sm) {
                            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted).frame(width: 100, alignment: .leading)
                            Text(value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $testPlanDone) {
                        Text("테스트 계획 및 ATE 프로그램 완성").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $firstSampleOK) {
                        Text("초도 샘플 테스트 통과").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("패키징·테스트 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("PackagingAndTest") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["packaging-and-test"] }
    return PackagingAndTestStageView().environment(store)
}
#endif
