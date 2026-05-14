//
//  HardwarePrototypeStageView.swift — 하드웨어 프로토타입 (iOS 네이티브)
//
//  stageId: "hardware-prototype"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct HardwarePrototypeStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("hp.evtDone") private var evtDone = false
    @AppStorage("hp.dvtDone") private var dvtDone = false
    @AppStorage("hp.pvtDone") private var pvtDone = false
    @AppStorage("hp.done")    private var done    = false

    private let pages = ["EVT", "DVT", "PVT"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            ForEach(pages.indices, id: \.self) { i in
                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) { page = i }
                                } label: {
                                    Text(pages[i])
                                        .font(BUFont.bodySmall.weight(page == i ? .semibold : .regular))
                                        .foregroundStyle(page == i ? BUColor.midnight : BUColor.inkMuted)
                                        .padding(.horizontal, BUSpacing.md)
                                        .padding(.vertical, BUSpacing.sm)
                                        .background(page == i ? BUColor.midnight.opacity(0.08) : Color.clear, in: Capsule())
                                }
                            }
                        }
                        .padding(.horizontal, BUSpacing.sm)
                    }
                    .padding(.vertical, BUSpacing.xs)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: evtPage
                                case 1: dvtPage
                                default: pvtPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("하드웨어 프로토타입")
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

    // MARK: - pg 0 EVT

    private var evtPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("하드웨어 프로토타입")
                    Text("EVT → DVT → PVT\n하드웨어는 3단계 검증이 필수")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("소프트웨어와 달리 하드웨어는 되돌리기 어렵습니다. 각 단계 체크리스트를 완료해야 다음으로.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("EVT 목표 — 설계 개념 검증")
                    let items = [
                        "핵심 기능이 기술적으로 동작하는가?",
                        "주요 부품 선정 완료",
                        "첫 번째 프로토타입 — 외관·마감 불문, 기능 우선",
                        "내부 팀 테스트로 기능 확인",
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
                    BUEyebrow("EVT 완료 체크")
                    Toggle(isOn: $evtDone) {
                        Text("EVT 완료 — 기술 동작 확인").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("EVT 가이드")
                    let infos = [
                        ("소요 기간", "4–8주"),
                        ("예산 범위", "500만~3,000만원 (부품·외주 가공비)"),
                    ]
                    ForEach(infos, id: \.0) { label, value in
                        HStack(spacing: BUSpacing.sm) {
                            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted).frame(width: 72, alignment: .leading)
                            Text(value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 DVT

    private var dvtPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("DVT 목표 — 설계 완성도 검증")
                    let items = [
                        "최종 디자인·폼팩터 확정",
                        "양산용 자재 BOM 95% 이상 확정",
                        "외부 베타 사용자 10–30명 테스트",
                        "내구성·환경 테스트 (온도·진동·낙하)",
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
                    BUEyebrow("DVT 완료 체크")
                    Toggle(isOn: $dvtDone) {
                        Text("DVT 완료 — 설계 확정").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("DVT 단계 주요 실수")
                    let warnings = [
                        "BOM 확정 전 KC 인증 신청 → 재인증 비용 발생",
                        "공급사 단일 소싱 → 부품 단종 시 양산 중단",
                    ]
                    ForEach(warnings, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 13)).foregroundStyle(Color.orange)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 PVT

    private var pvtPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("PVT 목표 — 양산 공정 검증")
                    let items = [
                        "EMS 파트너와 소규모 시험 생산 (50–200개)",
                        "공정 수율 98% 이상 달성",
                        "KC/CE/FCC 인증 병행 진행",
                        "고객 베타 배송 준비",
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
                    BUEyebrow("PVT 완료 체크")
                    Toggle(isOn: $pvtDone) {
                        Text("PVT 완료 — 양산 준비").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("전체 완료")
                    Toggle(isOn: $done) {
                        Text("하드웨어 프로토타입 3단계 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("HardwarePrototype") { HardwarePrototypeStageView() }
#endif
