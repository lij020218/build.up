//
//  PackagingAndTestStageView.swift — 패키징·테스트 (iOS 네이티브)
//
//  stageId: "packaging-and-test"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct PackagingAndTestStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("pkg.osatSelected")   private var osatSelected   = false
    @AppStorage("pkg.testPlanDone")   private var testPlanDone   = false
    @AppStorage("pkg.firstSampleOK")  private var firstSampleOK  = false
    @AppStorage("pkg.done")           private var done           = false

    private let pages = ["OSAT 선정", "테스트 계획"]

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
                                case 0: osatPage
                                default: testPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("패키징·테스트")
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

    // MARK: - pg 0 OSAT 선정

    private var osatPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("패키징·테스트")
                    Text("OSAT = 패키징·테스트 전문 위탁\n설계 이후 생산의 마지막 퍼즐")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("OSAT(Outsourced Semiconductor Assembly and Test): ASE·Amkor·JCET 등 글로벌 OSAT")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

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
                        ("수율 (Yield)", "80% 이상 (첫 MPW 기준 50–70%도 정상)"),
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
#Preview("PackagingAndTest") { PackagingAndTestStageView() }
#endif
