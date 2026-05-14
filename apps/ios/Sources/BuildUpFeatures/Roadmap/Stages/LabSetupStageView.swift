//
//  LabSetupStageView.swift — 연구소 설립·설비 (iOS 네이티브)
//
//  stageId: "lab-setup"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct LabSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("lab.facilityDone")  private var facilityDone  = false
    @AppStorage("lab.safetyDone")    private var safetyDone    = false
    @AppStorage("lab.equipmentDone") private var equipmentDone = false
    @AppStorage("lab.done")          private var done          = false

    private let pages = ["연구소 설립", "핵심 장비"]

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
                                case 0: facilityPage
                                default: equipmentPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("연구소 설립·설비")
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

    // MARK: - pg 0 연구소 설립

    private var facilityPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("연구소 설립·설비")
                    Text("연구소 = 딥테크의 공장\n설립 전에 법적 요건 먼저")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("기업부설연구소 인정: RNDIP (연구개발인력 최소 1명 석사 이상 또는 2명 학사)")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

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
#Preview("LabSetup") { LabSetupStageView() }
#endif
